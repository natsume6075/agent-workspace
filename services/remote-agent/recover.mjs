// Local operator command only: never advertised as an MCP tool.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('./.local/jobs/', import.meta.url));
function alive(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('Invalid PID; inspect the state manually');
  try { process.kill(pid, 0); return true; }
  catch (e) { if (e.code === 'ESRCH') return false; throw e; }
}
const lock = path.join(directory, 'owner.lock');
const owner = JSON.parse(fs.readFileSync(lock, 'utf8'));
if (alive(owner.pid)) throw new Error('Server owner is still alive; refusing recovery');
for (const name of fs.readdirSync(directory).filter(n => /^[0-9a-f-]{36}\.json$/.test(n))) {
  const job = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
  if (job.agent_pid && alive(job.agent_pid)) throw new Error(`Agent for ${job.job_id} is still alive; inspect locally before recovery`);
}
fs.unlinkSync(lock);
console.log('Stale lock removed after checking saved PIDs. On next startup unfinished jobs become interrupted; no task is automatically rerun.');
