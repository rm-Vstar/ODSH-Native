// tests/cua.test.mjs - CUA remote/local mode selection + fail-closed.
// CUA_REMOTE is read at module load, so each case spawns a fresh node process.
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Resolve the runtime module relative to this test file (was a hard-coded
// absolute path with a double slash and the wrong repo name).
const MOD = new URL('../src/runtime/cua.mjs', import.meta.url).href;
// Probe scripts live in the OS temp dir (never inside the repo), one per pid so
// parallel runners cannot clobber each other; cleaned up after every spawn.
const PROBE_FILE = join(tmpdir(), '_odsh_cua_probe-' + process.pid + '.mjs');

function probe(env, args) {
  const script =
    'import { runCua } from ' + JSON.stringify(MOD) + ';\n' +
    'const out = await runCua(JSON.parse(process.env.PROBE || "{}"));\n' +
    'console.log(JSON.stringify(out));';
  writeFileSync(PROBE_FILE, script, 'utf8');
  try {
    const r = spawnSync(process.execPath, ['--experimental-strip-types', PROBE_FILE], {
      env: { ...process.env, ...env, PROBE: JSON.stringify(args) },
      encoding: 'utf8', timeout: 30000,
    });
    if (r.status !== 0) throw new Error('probe failed: ' + (r.stderr || r.stdout));
    const lines = (r.stdout || '').trim().split(/\r?\n/).filter(Boolean);
    return JSON.parse(lines[lines.length - 1]);
  } finally {
    try { unlinkSync(PROBE_FILE); } catch { /* tmp file already gone */ }
  }
}

export async function t_remote_rejects_invalid_url() {
  const r = probe({ CUA_REMOTE: 'not-a-url' }, { tool: 'get_desktop_state' });
  if (r.ok || !/invalid CUA_REMOTE/.test(r.error)) throw new Error('invalid URL must fail-closed: ' + JSON.stringify(r));
  return 'remote invalid-url rejected';
}
export async function t_remote_rejects_bad_argv_key() {
  const r = probe({ CUA_REMOTE: 'http://host.docker.internal:8000' }, { tool: 'good_tool', args: { 'bad key': 1 } });
  if (r.ok || !/invalid cua arg key/.test(r.error)) throw new Error('bad argv key must fail-closed: ' + JSON.stringify(r));
  return 'remote bad argv key rejected';
}
export async function t_remote_conn_refused_reports_error() {
  const r = probe({ CUA_REMOTE: 'http://127.0.0.1:1' }, { tool: 'get_desktop_state', timeoutMs: 4000 });
  if (r.ok || !r.remote) throw new Error('unreachable remote must be ok:false: ' + JSON.stringify(r));
  return 'remote unreachable surfaced';
}
export async function t_local_invalid_tool_fail_closed() {
  const r = probe({ CUA_REMOTE: '' }, { tool: 'x;ls' });
  if (r.ok || !/invalid/.test(r.error)) throw new Error('local invalid tool must fail-closed: ' + JSON.stringify(r));
  return 'local invalid tool rejected';
}