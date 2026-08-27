// clean-exec.mjs — 干净 sub-agent worker (需求②)
// 封装 OpenClaw 原生 `openclaw agent exec`: 一次性、临时状态、无 persona/记忆。
// 主 agent 把轻任务文本发到这, 由独立干净上下文执行, 结果回传。
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const BIN = process.env.OPENCLAW_BIN || 'openclaw';

export async function cleanExec(task, { cwd, json = true, timeoutMs = 120000 } = {}) {
  const args = ['agent', 'exec', task];
  if (cwd) args.push('--cwd', String(cwd));
  if (json) args.push('--json');
  const opts = { cwd, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 };
  if (cwd) opts.cwd = cwd;
  try {
    const { stdout, stderr } = await run(BIN, args, opts);
    return { ok: true, output: stdout, stderr };
  } catch (e) {
    return { ok: false, code: typeof e.code === 'number' ? e.code : null, stderr: e.stderr || e.message };
  }
}

// CLI: node src/worker/clean-exec.mjs "task text"
if (process.argv[1] && process.argv[1].endsWith('clean-exec.mjs')) {
  const task = process.argv[2];
  if (!task) { console.error('usage: worker <task> [--cwd <path>]'); process.exit(64); }
  const cwd = process.argv.includes('--cwd') ? process.argv[process.argv.indexOf('--cwd') + 1] : undefined;
  const res = await cleanExec(task, { cwd });
  process.stdout.write(res.output || '');
  process.stderr.write(res.stderr || '');
  process.exit(res.ok ? 0 : 1);
}
