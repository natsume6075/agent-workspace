import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { EventEmitter } from 'node:events';
import { homedir } from 'node:os';
import path from 'node:path';

const localCatalog = path.join(homedir(), 'llm', 'adapters', 'codex', 'codex-models.json');

// Only credentials for Codex itself are inherited. In particular the tunnel key
// and arbitrary parent environment variables are never passed to an agent.
export function agentEnvironment(backend, source = process.env) {
  const names = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR', 'CODEX_HOME',
    'SSL_CERT_FILE', 'SSL_CERT_DIR', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY'];
  if (backend === 'codex') names.push('CODEX_API_KEY', 'OPENAI_API_KEY');
  const env = Object.fromEntries(names.filter(k => source[k] !== undefined).map(k => [k, source[k]]));
  if (backend === 'local_codex') {
    env.CODEX_OSS_BASE_URL = 'http://127.0.0.1:11434/v1';
    env.OLLAMA_NO_CLOUD = '1';
  }
  return env;
}

export function launchOptions(backend) {
  if (!['codex', 'local_codex'].includes(backend)) throw new Error('Unknown backend');
  const args = ['app-server', '--stdio', '-c', 'approval_policy="on-request"',
    '-c', 'approvals_reviewer="user"', '-c', 'sandbox_mode="workspace-write"'];
  if (backend === 'local_codex') {
    args.push('-c', 'model_provider="ollama"', '-c', 'model="qwen3.5:4b-codex"',
      '-c', `model_catalog_json=${JSON.stringify(localCatalog)}`,
      '-c', 'features.apps=false', '-c', 'web_search="disabled"',
      '-c', 'model_context_window=65536', '-c', 'model_auto_compact_token_limit=48000');
  }
  return { command: 'codex', args, env: agentEnvironment(backend) };
}

export class AppServer extends EventEmitter {
  constructor({ command = 'codex', args = ['app-server', '--stdio'], env, cwd, requestTimeout = 60_000 } = {}) {
    super();
    this.seq = 0;
    this.pending = new Map();
    this.requestTimeout = requestTimeout;
    this.closed = false;
    this.child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
    // Diagnostics stay local; don't send raw stderr or command output to ChatGPT.
    this.diagnostic = '';
    this.child.stderr.on('data', b => { this.diagnostic = (this.diagnostic + b).slice(-8000); });
    this.child.stdin.on('error', () => {});
    const lines = createInterface({ input: this.child.stdout });
    lines.on('line', line => {
      if (line.length > 4_000_000) return this.emit('protocolError', new Error('App-server message too large'));
      let msg;
      try { msg = JSON.parse(line); } catch { return this.emit('protocolError', new Error('Invalid app-server JSON')); }
      if (msg.method) this.emit(msg.id === undefined ? 'notification' : 'request', msg);
      else {
        const waiter = this.pending.get(msg.id);
        if (!waiter) return;
        this.pending.delete(msg.id);
        clearTimeout(waiter.timer);
        if (msg.error) waiter.reject(new Error(msg.error.message ?? 'App-server request failed'));
        else waiter.resolve(msg.result);
      }
    });
    this.exited = new Promise(resolve => {
      const finish = (code, signal) => {
        if (this.closed) return;
        this.closed = true;
        for (const w of this.pending.values()) {
          clearTimeout(w.timer); w.reject(new Error('App-server exited'));
        }
        this.pending.clear();
        this.emit('exit', { code, signal });
        resolve({ code, signal });
      };
      this.child.once('error', error => { this.diagnostic = error.message; finish(null, 'spawn_error'); });
      this.child.once('close', finish);
    });
  }
  send(msg) {
    if (this.closed || this.child.stdin.destroyed) throw new Error('App-server is not running');
    this.child.stdin.write(JSON.stringify(msg) + '\n');
  }
  request(method, params = {}, timeoutMs = this.requestTimeout) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id); reject(new Error(`App-server ${method} timed out`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.send({ id, method, params }); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  respond(id, result) { this.send({ id, result }); }
  async initialize() {
    const result = await this.request('initialize', {
      clientInfo: { name: 'agent_workspace_remote', title: 'WSL Remote Agent', version: '0.1.0' },
    });
    this.send({ method: 'initialized', params: {} });
    return result;
  }
  async stop() {
    if (!this.closed) {
      // Signal the process group as well as Codex, including spawned commands.
      try { process.kill(-this.child.pid, 'SIGTERM'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
      let timer;
      await Promise.race([this.exited, new Promise(resolve => { timer = setTimeout(resolve, 3000); })]);
      clearTimeout(timer);
      if (!this.closed) {
        try { process.kill(-this.child.pid, 'SIGKILL'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
        await this.exited;
      }
    }
  }
}
