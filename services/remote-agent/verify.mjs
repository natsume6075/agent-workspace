import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { startWorker } from './worker.mjs';
import { JobClient } from './job-client.mjs';
import { createRemoteServer } from './server.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const backend = process.argv[process.argv.indexOf('--backend') + 1];
if (!process.argv.includes('--backend') || !['codex', 'local_codex'].includes(backend)) {
  throw new Error('Usage: node verify.mjs --backend codex|local_codex');
}
process.umask(0o077);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-agent-live-'));
const directory = path.join(scratch, 'state');
const workspace = path.join(scratch, 'workspace');
fs.mkdirSync(workspace, { mode: 0o700 });
fs.writeFileSync(path.join(workspace, 'AGENTS.md'), 'This is an isolated verification workspace. Perform only the requested verification. Do not access other workspaces, credentials or the network. Preserve all sandbox and approval requirements.\n');
const nonce = randomBytes(12).toString('hex');
const worker = await startWorker({ directory, workspace, timeoutMs: 180_000 });
const server = createRemoteServer(new JobClient({ directory, workspace }));
const client = new Client({ name: 'remote-agent-verification', version: '0.1.0' });
const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport); await client.connect(clientTransport);
async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) throw new Error(result.content[0].text);
  return result.structuredContent;
}
const manager = {
  submit: args => call('submit_agent_task', { workspace: 'workspace', ...args }),
  view: job_id => call('get_agent_task', { job_id }),
  continue: args => call('continue_agent_task', args),
  artifact: (job_id, artifact_id) => call('get_agent_artifact', { job_id, artifact_id }),
};
const log = [];
async function wait(job_id) {
  let previous;
  while (true) {
    const state = await manager.view(job_id);
    if (state.status !== previous) console.log(JSON.stringify({ backend, job_id, status: state.status }));
    previous = state.status;
    if (['completed', 'failed', 'cancelled', 'interrupted'].includes(state.status)) {
      log.push({ job_id, status: state.status, thread_id: state.thread_id, changed_files: state.changed_files, error: state.error });
      if (state.status !== 'completed') throw new Error(state.error ?? state.status);
      return state;
    }
    if (state.status === 'awaiting_approval') throw new Error('Verification requires human approval; no automatic permission granted');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
let success = false;
try {
  const first = await manager.submit({ request_id: 'live-first', backend,
    instruction: `Create proof.txt in this working directory containing exactly the following ASCII text and no newline: ${nonce}. Use a real file editing or shell tool. Then read the file to verify it. Do not just describe a command. Do not modify AGENTS.md. Report the relative filename and verification result.` });
  await wait(first.job_id);
  if (fs.readFileSync(path.join(workspace, 'proof.txt'), 'utf8') !== nonce) throw new Error('First artifact does not match');
  // Wait for cleanup before creating a continuation on the same saved thread.
  if (worker.manager.active) await worker.manager.active.done;
  const firstState = await manager.view(first.job_id);
  const firstArtifact = firstState.artifacts.find(a => a.path === 'proof.txt' && a.snapshot_available);
  if (!firstArtifact || (await manager.artifact(first.job_id, firstArtifact.artifact_id)).content !== nonce) {
    throw new Error('Initial artifact snapshot is missing or incorrect');
  }
  const second = await manager.continue({ job_id: first.job_id, request_id: 'live-second',
    instruction: 'Read proof.txt using a real tool. Append exactly the ASCII text _continued without any newline, preserving its previous contents. Read it again to verify. Do not modify any other file.' });
  const done = await wait(second.job_id);
  if (worker.manager.active) await worker.manager.active.done;
  if (fs.readFileSync(path.join(workspace, 'proof.txt'), 'utf8') !== nonce + '_continued') throw new Error('Continued artifact does not match');
  if (done.thread_id !== (await manager.view(first.job_id)).thread_id) throw new Error('Continuation used a different thread');
  if ((await manager.artifact(first.job_id, firstArtifact.artifact_id)).content !== nonce) {
    throw new Error('Continuation modified the original artifact snapshot');
  }
  const secondArtifact = (await manager.view(second.job_id)).artifacts.find(a => a.path === 'proof.txt' && a.snapshot_available);
  if (!secondArtifact || (await manager.artifact(second.job_id, secondArtifact.artifact_id)).content !== nonce + '_continued') {
    throw new Error('Continued artifact snapshot is missing or incorrect');
  }
  success = true;
} finally {
  await client.close(); await server.close(); await worker.stop();
  const result = { collected_at: new Date().toISOString(), backend, success, transport: 'MCP -> Unix socket worker -> Codex app-server', scratch, jobs: log };
  const output = fileURLToPath(new URL('./.local/', import.meta.url));
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(output, `verification-${backend}.json`), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify(result));
}
