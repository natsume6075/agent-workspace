import net from 'node:net';
import path from 'node:path';

export class JobClient {
  constructor({ directory, workspace }) {
    this.directory = directory; this.workspace = workspace;
    this.socketPath = path.join(directory, 'worker.sock');
  }
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath);
      let data = '', finished = false;
      const fail = error => { if (!finished) { finished = true; socket.destroy(); reject(error); } };
      socket.setTimeout(20_000, () => fail(new Error('WSL worker did not respond')));
      socket.on('error', () => fail(new Error('WSL worker unavailable. Run node services/remote-agent/control.mjs start locally.')));
      socket.on('connect', () => socket.write(JSON.stringify({ method, params }) + '\n'));
      socket.on('data', chunk => {
        data += chunk;
        if (data.length > 1_000_000) return fail(new Error('Worker response too large'));
        if (!data.includes('\n')) return;
        try {
          const result = JSON.parse(data.slice(0, data.indexOf('\n')));
          finished = true; socket.destroy();
          if (result.error) reject(new Error(result.error)); else resolve(result.result);
        } catch { fail(new Error('Invalid worker response')); }
      });
      socket.on('close', () => { if (!finished) fail(new Error('Worker connection closed without response')); });
    });
  }
  submit(args) { return this.request('submit', args); }
  view(job_id, cursor = 0) { return this.request('view', { job_id, cursor }); }
  continue(args) { return this.request('continue', args); }
  cancel(job_id) { return this.request('cancel', { job_id }); }
  artifact(job_id, artifact_id) { return this.request('artifact', { job_id, artifact_id }); }
  async resolveApproval(job_id, approval_id, askHuman) {
    const preview = await this.request('approval_preview', { job_id, approval_id });
    const response = await askHuman(preview);
    return this.request('approval_resolve', { job_id, approval_id, response });
  }
  async close() { /* MCP disconnects must never terminate the worker. */ }
}
