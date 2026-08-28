// src/runtime/cua.mjs — A-class tool: drive CUA (cua-driver / computer-server).
// Two modes, selected by CUA_REMOTE (optional):
//   * empty        -> LOCAL  : execFile('cua-driver', ...) on this host (host install).
//   * http(s) URL  -> REMOTE : POST <url>/cmd to a cua-computer-server (docker -> host).
// Fail-closed in both modes: tool-name whitelist, no shell, http(s)-only remote URL,
// remote errors surface as {ok:false} instead of throwing.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const CUA = process.env.CUA_DRIVER || 'cua-driver';
const REMOTE = process.env.CUA_REMOTE || ''; // e.g. http://host.docker.internal:8000
const TOOL_RE = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;

async function remoteCua(tool, argsObj, timeoutMs) {
  const base = String(REMOTE).replace(/\/$/, '');
  if (!/^https?:\/\//.test(REMOTE)) return { ok: false, error: 'invalid CUA_REMOTE (must be http(s)://...)', remote: true };
  const params = {};
  if (argsObj && typeof argsObj === 'object') {
    for (const [k, v] of Object.entries(argsObj)) {
      const key = String(k);
      if (!TOOL_RE.test(key)) return { ok: false, error: 'invalid cua arg key: ' + key, remote: true };
      params[key] = v;
    }
  }
  try {
    const r = await fetch(base + '/cmd', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command: tool, params }),
      signal: AbortSignal.timeout(timeoutMs || 60000),
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, remote: true, status: r.status, error: text.slice(0, 2000) };
    // SSE stream: lines of `data: {json}`. Take the last data JSON carrying success + result.
    let parsed = { ok: false, remote: true, output: text, raw: text };
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      let j = null; try { j = JSON.parse(payload); } catch { continue; }
      if (j && j.success !== undefined) { parsed = { ok: !!j.success, remote: true, output: j.data ?? j.result ?? j, raw: text, ...(j.error ? { error: j.error } : {}) }; }
    }
    return parsed;
  } catch (e) {
    return { ok: false, remote: true, error: e.message, hint: 'is computer-server running and CUA_REMOTE correct?' };
  }
}

export async function runCua({ tool, args = {}, timeoutMs = 60000 } = {}) {
  if (!tool || !TOOL_RE.test(String(tool))) return { ok: false, error: 'invalid/empty cua tool' };
  if (REMOTE) return remoteCua(tool, args, timeoutMs);

  // LOCAL mode: forward args as --key value (array form, no shell, keys whitelisted).
  const argv = [tool];
  if (args && typeof args === 'object') {
    for (const [k, v] of Object.entries(args)) {
      const key = String(k);
      if (!TOOL_RE.test(key)) return { ok: false, error: 'invalid cua arg key: ' + key };
      argv.push('--' + key, String(v));
    }
  }
  try {
    const { stdout, stderr } = await run(CUA, argv, { timeout: timeoutMs, maxBuffer: 64*1024*1024 });
    return { ok: true, output: stdout, error: stderr };
  } catch (e) {
    return { ok: false, code: typeof e.code === 'number' ? e.code : null, error: e.stderr || e.message };
  }
}