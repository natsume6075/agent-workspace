import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startWorker } from '../worker.mjs';

test('the real stdio entrypoint initializes and disconnects without stopping the persistent worker', async () => {
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-stdio-test-'));
  const worker = await startWorker({ directory: state, workspace: state });
  const server = fileURLToPath(new URL('../server.mjs', import.meta.url));
  const transport = new StdioClientTransport({ command: process.execPath, args: [server, '--state-dir', state], stderr: 'pipe' });
  const client = new Client({ name: 'stdio-test', version: '1' });
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length, 8);
    const bad = await client.callTool({ name: 'get_agent_task', arguments: { job_id: '11111111-1111-4111-8111-111111111111' } });
    assert.equal(bad.isError, true);
    assert.equal(fs.existsSync(path.join(state, 'jobs/owner.lock')), true);
  } finally {
    await client.close();
    assert.equal(fs.existsSync(path.join(state, 'jobs/owner.lock')), true);
    await worker.stop();
    assert.equal(fs.existsSync(path.join(state, 'jobs/owner.lock')), false);
    fs.rmSync(state, { recursive: true, force: true });
  }
});
