// tools/exec.mjs — 本地执行工具 (复用 ODSH-Bridge 的 fail-closed 习惯: argv 白名单).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export default async function execTool({ cmd, args = [], cwd, timeoutMs = 30000 } = {}) {
  if (typeof cmd !== 'string' || !cmd) throw new Error('exec: cmd must be a plain string');
  try {
    const { stdout } = await run(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024, shell: false });
    return { ok: true, stdout };
  } catch (e) {
    return { ok: false, code: typeof e.code === 'number' ? e.code : null, error: e.stderr || e.message };
  }
}