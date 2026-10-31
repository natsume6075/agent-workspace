import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { isUtf8 } from 'node:buffer';

const excluded = new Set(['.git', '.codex', '.ssh', '.aws', '.local', '.venv', '.cache',
  'node_modules', 'secrets', 'coverage', '__pycache__', 'target', 'dist', 'build']);
const privateName = name => name === '.env' || name.startsWith('.env.') || /\.(pem|key)$/i.test(name);
const maxFiles = 10_000;
const maxBytes = 32_768;

export function snapshot(root) {
  const entries = new Map();
  let complete = true, examined = 0;
  function walk(dir) {
    let files;
    try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch { complete = false; return; }
    for (const entry of files) {
      if (++examined > maxFiles) { complete = false; return; }
      if (excluded.has(entry.name) || privateName(entry.name)) continue;
      const file = path.join(dir, entry.name);
      // Do not follow symlinks or inspect sockets/devices.
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) {
        try {
          const stat = fs.lstatSync(file, { bigint: true });
          entries.set(path.relative(root, file), `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`);
        } catch { complete = false; }
      }
      if (examined > maxFiles) return;
    }
  }
  walk(root);
  return { entries, complete };
}

export function captureArtifacts(root, directory, before) {
  const after = snapshot(root);
  const changed = [...after.entries].filter(([p, value]) => before.entries.get(p) !== value).map(([p]) => p);
  const deleted = [...before.entries.keys()].filter(p => !after.entries.has(p));
  const artifacts = [];
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  for (const relative of changed.slice(0, 32)) {
    const file = path.join(root, relative);
    const meta = { path: relative, snapshot_available: false };
    let fd;
    try {
      // Recheck canonical containment in case a directory changed to a symlink.
      const real = fs.realpathSync(file);
      const rel = path.relative(root, real);
      if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Path left workspace');
      fd = fs.openSync(real, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      const stat = fs.fstatSync(fd);
      meta.bytes = stat.size;
      if (!stat.isFile() || stat.size > maxBytes) {
        meta.reason = 'Snapshot supports regular files up to 32 KiB'; artifacts.push(meta); continue;
      }
      const bytes = Buffer.alloc(maxBytes + 1);
      const size = fs.readSync(fd, bytes, 0, bytes.length, 0);
      if (size > maxBytes) throw new Error('File grew past snapshot limit');
      const data = bytes.subarray(0, size);
      meta.artifact_id = randomUUID();
      meta.bytes = size;
      meta.sha256 = createHash('sha256').update(data).digest('hex');
      meta.encoding = isUtf8(data) ? 'utf8' : 'base64';
      fs.writeFileSync(path.join(directory, meta.artifact_id), data, { mode: 0o600 });
      meta.snapshot_available = true;
    } catch { meta.reason = 'File unavailable or outside artifact boundary'; }
    finally { if (fd !== undefined) fs.closeSync(fd); }
    artifacts.push(meta);
  }
  return { changed, deleted, artifacts, complete: before.complete && after.complete,
    note: 'Excluded dependency/private paths; at most 10000 entries scanned and 32 changed files snapshotted. Snapshots are task output and may contain sensitive data.' };
}

export function readArtifact(directory, meta) {
  const data = fs.readFileSync(path.join(directory, meta.artifact_id));
  if (data.length > maxBytes || createHash('sha256').update(data).digest('hex') !== meta.sha256) {
    throw new Error('Artifact integrity check failed');
  }
  return { ...meta, content: data.toString(meta.encoding) };
}
