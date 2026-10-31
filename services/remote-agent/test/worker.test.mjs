import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startWorker } from '../worker.mjs';
import { JobClient } from '../job-client.mjs';
import { FakeAgent, waitFor } from './helpers.mjs';

test('jobs and pending approvals survive MCP disconnects and reconnects; socket is user-only', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-worker-test-'));
  const directory = path.join(temp, 'state'), workspace = path.join(temp, 'work');
  fs.mkdirSync(workspace);
  let agent;
  const worker = await startWorker({ directory, workspace, createClient: () => {
    agent = new FakeAgent(c => c.approval()); return agent;
  } });
  t.after(async () => { await worker.stop(); fs.rmSync(temp, { recursive: true, force: true }); });
  assert.equal(fs.statSync(path.join(directory, 'worker.sock')).mode & 0o777, 0o600);
  const firstClient = new JobClient({ directory, workspace });
  const job = await firstClient.submit({ request_id: 'persistent', instruction: 'Test persistent work', backend: 'codex' });
  await waitFor(() => worker.manager.view(job.job_id).status === 'awaiting_approval');
  await firstClient.close();
  const nextClient = new JobClient({ directory, workspace });
  const pending = await nextClient.view(job.job_id);
  assert.equal(pending.status, 'awaiting_approval');
  assert.equal(worker.manager.active.job.job_id, job.job_id);
  await nextClient.resolveApproval(job.job_id, pending.pending_approvals[0].approval_id, async preview => {
    assert.match(preview, /example-command/); return { action: 'accept', content: { approve: true } };
  });
  assert.equal(agent.responses[0].result.decision, 'accept');
  agent.complete();
  await waitFor(() => worker.manager.view(job.job_id).status === 'completed');
  assert.equal((await nextClient.view(job.job_id)).result, 'done');
  assert.equal((await nextClient.submit({ request_id: 'persistent', instruction: 'Test persistent work', backend: 'codex' })).job_id, job.job_id);
});
