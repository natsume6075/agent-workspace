import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { agentEnvironment } from './app-server.mjs';

const exec = promisify(execFile);
export async function capabilities(workspace) {
  const cli = (process.env.PATH ?? '').split(path.delimiter).some(p => {
    try { fs.accessSync(path.join(p, 'codex'), fs.constants.X_OK); return true; } catch { return false; }
  });
  let authenticated = false;
  if (cli) {
    try {
      await exec('codex', ['login', 'status'], { env: agentEnvironment('codex'), timeout: 5000, maxBuffer: 16_384 });
      authenticated = true;
    } catch { /* Never forward authentication diagnostics to MCP. */ }
  }
  let local = 'unavailable';
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const data = await response.json();
      local = data.models?.some(m => ['qwen3.5:4b-codex', 'qwen3.5:4b-codex:latest'].includes(m.name)) ? 'model_present' : 'model_missing';
    }
  } catch { /* A stopped Ollama is reported, never a reason to switch to cloud. */ }
  return {
    backends: {
      codex: { cli_present: cli, authenticated, ready_for_submission: cli && authenticated },
      local_codex: { cli_present: cli, ollama: local, model: 'qwen3.5:4b-codex', ready_for_submission: cli && local === 'model_present' },
    },
    workspaces: [{ id: 'workspace', path: workspace }],
    concurrency: 1, task_time_limit_seconds: 900, automatic_backend_fallback: false,
    sandbox: 'workspace-write', approval_policy: 'on-request',
    approvals: 'Human MCP form elicitation required. Unsupported clients leave requests pending.',
    progress: 'Poll get_agent_task. No automatic push or automatic ChatGPT wake-up.',
    note: 'Preflight checks are not an inference test. A submitted task may still fail.',
  };
}
