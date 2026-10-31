import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const COMMANDS = Object.freeze({
  kernel: ['uname', ['-r']],
  node: [process.execPath, ['--version']],
  npm: ['npm', ['--version']],
  codex: ['codex', ['--version']],
});

// No caller-supplied executable, arguments, environment, or shell.
export function runVersion(file, args, { timeout = 5000 } = {}) {
  return new Promise(resolve => {
    execFile(file, args, {
      shell: false, timeout, killSignal: 'SIGKILL', maxBuffer: 4096,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C', NO_COLOR: '1' },
    }, (error, stdout) => {
      if (error) {
        const status = error.code === 'ENOENT' ? 'not_installed'
          : error.killed ? 'timeout' : 'error';
        // Never return stderr, environment variables, or raw exception messages.
        resolve({ status });
      } else {
        resolve({ status: 'ok', version: stdout.trim() });
      }
    });
  });
}

export async function getEnvironmentVersions() {
  const os = await readFile('/etc/os-release', 'utf8').then(text => {
    const name = text.match(/^PRETTY_NAME=(.*)$/m)?.[1];
    return name ? { status: 'ok', version: name.replace(/^"(.*)"$/, '$1') }
      : { status: 'unavailable' };
  }, () => ({ status: 'unavailable' }));
  const entries = await Promise.all(Object.entries(COMMANDS).map(async ([key, [file, args]]) =>
    [key, await runVersion(file, args)]));
  return { os, ...Object.fromEntries(entries), collected_at: new Date().toISOString() };
}
