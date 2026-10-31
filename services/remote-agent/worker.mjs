import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JobManager } from './jobs.mjs';

export async function startWorker({ directory, workspace, createClient, timeoutMs }) {
  process.umask(0o077);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  const manager = new JobManager({ directory: path.join(directory, 'jobs'), workspace, createClient, timeoutMs });
  const socketPath = path.join(directory, 'worker.sock');
  let stopped = false;
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.once('close', () => sockets.delete(socket));
    socket.setTimeout(15_000, () => socket.destroy());
    socket.on('error', () => {});
    let text = '', handled = false;
    socket.on('data', async chunk => {
      if (handled) return;
      text += chunk;
      if (text.length > 128_000) { handled = true; socket.end(JSON.stringify({ error: 'Request too large' }) + '\n'); return; }
      if (!text.includes('\n')) return;
      handled = true;
      try {
        const { method, params: p = {} } = JSON.parse(text.slice(0, text.indexOf('\n')));
        let result;
        switch (method) {
          case 'status': result = { pid: process.pid, active_job_id: manager.active?.job.job_id ?? null, queued: manager.queue.length }; break;
          case 'submit': result = manager.submit(p); break;
          case 'view': result = manager.view(p.job_id, p.cursor); break;
          case 'continue': result = manager.continue(p); break;
          case 'cancel': result = await manager.cancel(p.job_id); break;
          case 'artifact': result = manager.artifact(p.job_id, p.artifact_id); break;
          case 'approval_preview': result = manager.approvalPreviewFor(p.job_id, p.approval_id); break;
          case 'approval_resolve': result = await manager.resolveApproval(p.job_id, p.approval_id, async () => p.response); break;
          case 'shutdown': result = { stopping: true }; setImmediate(() => stop()); break;
          default: throw new Error('Unknown worker operation');
        }
        socket.end(JSON.stringify({ result }) + '\n');
      } catch (e) { socket.end(JSON.stringify({ error: e.message }) + '\n'); }
    });
  });
  async function stop() {
    if (stopped) return;
    stopped = true;
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
    await manager.close();
  }
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(socketPath, resolve);
    });
    fs.chmodSync(socketPath, 0o600);
  } catch (e) { await manager.close(); throw e; }
  return { manager, server, stop };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--state-dir');
  if (index !== -1 && !process.argv[index + 1]) throw new Error('--state-dir requires a directory');
  const directory = index === -1 ? fileURLToPath(new URL('./.local/', import.meta.url)) : path.resolve(process.argv[index + 1]);
  const worker = await startWorker({ directory, workspace: fileURLToPath(new URL('../../', import.meta.url)) });
  console.log('WSL remote agent worker ready. No public listener; access is via a user-only Unix socket.');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await worker.stop(); process.exit(0); });
}
