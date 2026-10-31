import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JobManager } from '../jobs.mjs';
import { fixture, waitFor } from './helpers.mjs';
import { agentEnvironment, launchOptions } from '../app-server.mjs';

const task = (id, extra = {}) => ({ request_id: id, instruction: 'Investigate the project', backend: 'codex', ...extra });

test('idempotent submission, changed arguments rejected, correct backend and persisted continuation', async t => {
  const { manager: m, clients } = fixture(t, c => c.complete());
  const job = m.submit(task('req1', { backend: 'local_codex' }));
  assert.equal(m.submit(task('req1', { backend: 'local_codex' })).job_id, job.job_id);
  assert.throws(() => m.submit(task('req1')), /different arguments/);
  await waitFor(() => m.view(job.job_id).status === 'completed');
  assert.equal(clients.length, 1);
  const start = clients[0].calls.find(c => c.method === 'thread/start').params;
  assert.equal(start.approvalPolicy, 'on-request'); assert.equal(start.sandbox, 'workspace-write');
  assert.equal(start.approvalsReviewer, 'user'); assert.equal(start.modelProvider, 'ollama');
  const next = m.continue({ job_id: job.job_id, request_id: 'req2', instruction: 'Now test the result' });
  await waitFor(() => m.view(next.job_id).status === 'completed');
  assert.equal(clients[1].calls.find(c => c.method === 'thread/resume').params.threadId, 'thread-test');
  assert.equal(m.view(next.job_id).backend, 'local_codex');
  assert.equal(fs.statSync(path.join(m.directory, job.job_id + '.json')).mode & 0o777, 0o600);
});

test('only one writer runs; queued cancellation never starts a second agent; running cancellation stops process', async t => {
  const { manager: m, clients } = fixture(t, () => {});
  const a = m.submit(task('one')), b = m.submit(task('two'));
  assert.equal(clients.length, 1); assert.equal(m.view(b.job_id).status, 'queued');
  await m.cancel(b.job_id); assert.equal(clients.length, 1);
  const stopped = await m.cancel(a.job_id);
  assert.equal(stopped.status, 'cancelled'); assert.equal(clients[0].stopped, true);
});

test('human approval is scoped to request/turn and cannot replay after completion', async t => {
  const { manager: m, clients } = fixture(t, c => c.approval());
  const j = m.submit(task('approval'));
  await waitFor(() => m.view(j.job_id).status === 'awaiting_approval');
  const approval = m.view(j.job_id).pending_approvals[0];
  assert.equal(approval.preview, undefined);
  await m.resolveApproval(j.job_id, approval.approval_id, async preview => {
    assert.match(preview, /example-command/);
    return { action: 'accept', content: { approve: true } };
  });
  assert.deepEqual(clients[0].responses, [{ id: 17, result: { decision: 'accept' } }]);
  clients[0].complete(); await waitFor(() => m.view(j.job_id).status === 'completed');
  await assert.rejects(m.resolveApproval(j.job_id, approval.approval_id, async () => { throw new Error('should not ask again'); }), /no longer pending/);
});

test('declined or missing human answer never grants permission; cancellation invalidates open form', async t => {
  const { manager: m, clients } = fixture(t, c => c.approval());
  const j = m.submit(task('decline'));
  await waitFor(() => m.view(j.job_id).status === 'awaiting_approval');
  let a = m.view(j.job_id).pending_approvals[0];
  await m.resolveApproval(j.job_id, a.approval_id, async () => ({ action: 'cancel' }));
  assert.equal(clients[0].responses[0].result.decision, 'decline');
  clients[0].approval(18);
  a = m.view(j.job_id).pending_approvals[0];
  let answer;
  const pending = m.resolveApproval(j.job_id, a.approval_id, () => new Promise(r => { answer = r; }));
  await m.cancel(j.job_id); answer({ action: 'accept', content: { approve: true } });
  await assert.rejects(pending, /expired/);
  assert.equal(clients[0].responses.length, 1);
});

test('unsupported requests fail closed; file approval requires the actual proposed changes', async t => {
  const { manager: m, clients } = fixture(t, () => {});
  const j = m.submit(task('unsupported'));
  await waitFor(() => m.view(j.job_id).turn_id);
  clients[0].emit('request', { id: 20, method: 'item/permissions/requestApproval', params: {} });
  assert.ok(clients[0].responses[0].error);
  clients[0].emit('request', { id: 21, method: 'item/fileChange/requestApproval', params: { itemId: 'missing' } });
  assert.equal(clients[0].responses[1].result.decision, 'decline');
});

test('timeout, bounded progress, and shutdown/restart retain evidence without rerunning', async t => {
  const { manager: m, temp, clients } = fixture(t, () => {}, { timeoutMs: 100 });
  const j = m.submit(task('timeout'));
  await waitFor(() => m.view(j.job_id).status === 'failed');
  assert.match(m.view(j.job_id).error, /time limit/); assert.equal(clients[0].stopped, true);
  const next = m.submit(task('restart'));
  await m.close();
  const reopened = new JobManager({ directory: path.join(temp, 'jobs'), workspace: temp,
    createClient: () => { throw new Error('Must not auto-restart'); } });
  assert.equal(reopened.view(next.job_id).status, 'interrupted');
  assert.equal(reopened.view(j.job_id).status, 'failed');
  await reopened.close();
});

test('a second server cannot acquire the same execution directory', async t => {
  const { manager: m, temp } = fixture(t, () => {});
  assert.throws(() => new JobManager({ directory: m.directory, workspace: temp }), /EEXIST/);
});

test('agent processes receive no tunnel key or unrelated secrets, and local backend has no cloud credentials', () => {
  const source = { PATH: '/usr/bin', HOME: '/home/test', CONTROL_PLANE_API_KEY: 'private',
    OTHER_PASSWORD: 'private', CODEX_API_KEY: 'codex-only', OPENAI_API_KEY: 'api-only' };
  const local = agentEnvironment('local_codex', source), cloud = agentEnvironment('codex', source);
  assert.equal(local.CONTROL_PLANE_API_KEY, undefined); assert.equal(cloud.OTHER_PASSWORD, undefined);
  assert.equal(local.CODEX_API_KEY, undefined); assert.equal(local.OPENAI_API_KEY, undefined);
  assert.equal(cloud.CODEX_API_KEY, 'codex-only'); assert.equal(local.OLLAMA_NO_CLOUD, '1');
  assert.ok(!launchOptions('local_codex').args.some(a => a.includes('danger-full-access')));
});
