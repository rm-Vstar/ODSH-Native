// src/runtime/cua.mjs — A-class tool: drive local CUA (cua-driver)
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const CUA = process.env.CUA_DRIVER || 'cua-driver';
const TOOL_RE = /^[A-Za-z0-9_][A-Za-z0-9_\-]*$/;
export async function runCua({ tool, args = {}, timeoutMs = 60000 } = {}) {
  if (!tool || !TOOL_RE.test(String(tool))) throw new Error('invalid/empty cua tool');
  try { const { stdout, stderr } = await run(CUA, [tool], { timeout: timeoutMs, maxBuffer: 64*1024*1024 }); return { ok: true, output: stdout, error: stderr }; }
  catch (e) { return { ok: false, code: typeof e.code === 'number' ? e.code : null, error: e.stderr || e.message }; }
}
