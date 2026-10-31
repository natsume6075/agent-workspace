import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JobClient } from './job-client.mjs';

const directory = fileURLToPath(new URL('./.local/', import.meta.url));
const client = new JobClient({ directory });
const action = process.argv[2];
if (!['start', 'status', 'stop'].includes(action)) throw new Error('Usage: node control.mjs start|status|stop');
if (action === 'status') {
  console.log(JSON.stringify(await client.request('status')));
} else if (action === 'stop') {
  console.log(JSON.stringify(await client.request('shutdown')));
} else {
  try {
    const status = await client.request('status');
    console.log(JSON.stringify({ already_running: true, ...status }));
  } catch {
    process.umask(0o077);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const log = fs.openSync(new URL('./.local/worker.log', import.meta.url), 'a', 0o600);
    const child = spawn(process.execPath, [fileURLToPath(new URL('./worker.mjs', import.meta.url))],
      { detached: true, stdio: ['ignore', log, log] });
    fs.closeSync(log);
    let error;
    child.once('error', e => { error = e; });
    child.unref();
    let ready = false;
    for (let i = 0; i < 50; i++) {
      if (error) throw error;
      try {
        const status = await client.request('status');
        console.log(JSON.stringify({ started: true, ...status })); ready = true; break;
      } catch { await new Promise(r => setTimeout(r, 100)); }
    }
    if (!ready) throw new Error('Worker failed to start. Inspect .local/worker.log; if a stale lock remains, see README recovery steps.');
  }
}
