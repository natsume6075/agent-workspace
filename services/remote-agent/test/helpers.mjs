import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JobManager } from '../jobs.mjs';

export class FakeAgent extends EventEmitter {
  constructor(script = () => {}) { super(); this.script = script; this.calls = []; this.responses = []; this.stopped = false; }
  async initialize() {}
  async request(method, params) {
    this.calls.push({ method, params });
    if (method.startsWith('thread/')) return { thread: { id: params.threadId ?? 'thread-test' } };
    if (method === 'turn/start') {
      setImmediate(() => this.script(this));
      return { turn: { id: 'turn-test' } };
    }
  }
  send(msg) { this.responses.push(msg); }
  respond(id, result) { this.responses.push({ id, result }); }
  async stop() { if (!this.stopped) { this.stopped = true; this.emit('exit', {}); } }
  notify(method, params) { this.emit('notification', { method, params: { threadId: 'thread-test', ...params } }); }
  complete(text = 'done') {
    this.notify('item/completed', { item: { type: 'agentMessage', phase: 'final_answer', text } });
    this.notify('turn/completed', { turn: { id: 'turn-test', status: 'completed' } });
  }
  approval(id = 17) {
    this.emit('request', { id, method: 'item/commandExecution/requestApproval',
      params: { threadId: 'thread-test', turnId: 'turn-test', command: 'example-command', cwd: '/tmp' } });
  }
}

export function fixture(t, script, options = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-agent-test-'));
  const workspace = path.join(temp, 'workspace');
  fs.mkdirSync(workspace);
  const clients = [];
  const manager = new JobManager({ directory: path.join(temp, 'jobs'), workspace,
    createClient: () => { const c = new FakeAgent(script); clients.push(c); return c; }, ...options });
  t.after(async () => { await manager.close(); fs.rmSync(temp, { recursive: true, force: true }); });
  return { manager, clients, temp };
}

export async function waitFor(predicate) {
  const end = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('Test timed out');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
