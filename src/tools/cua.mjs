// tools/cua.mjs — 原生 CUA 工具 (需求①): 本地 spawn cua-driver, 无 SSH/跨容器。
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const CUA = process.env.CUA_DRIVER || 'cua-driver';
// 安全: 工具名白名单, 复用 ODSH-Bridge 的 argv 白名单传统(避免命令注入)
const TOOL_RE = /^[A-Za-z0-9_][A-Za-z0-9_\-]*$/;

export default async function cuaTool({ tool, args = {}, timeoutMs = 60000 }) {
  if (!tool || !TOOL_RE.test(String(tool))) {
    throw new Error('invalid/empty cua tool name');
  }
  const argv = [tool];
  if (args && args.raw) argv.push(args.raw); // 保留底层参数(受白名单保护时)
  try {
    const { stdout, stderr } = await run(CUA, argv, { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
    return { ok: true, output: stdout, error: stderr };
  } catch (e) {
    return { ok: false, code: typeof e.code === 'number' ? e.code : null, error: e.stderr || e.message };
  }
}
