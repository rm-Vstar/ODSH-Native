// tools/visual.mjs — 视觉能力 (需求①): 截图/OCR, 走本地 cua-driver (或可替换后端)。
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
const run = promisify(execFile);
const CUA = process.env.CUA_DRIVER || 'cua-driver';

// 截图并保存 PNG; 返回路径。OCR 说明: 需依赖 cua-driver 的视觉/OCR 子命令或外部 OCR。
export async function screenshot({ path = 'screenshot.png', format = 'png' } = {}) {
  try {
    const { stdout } = await run(CUA, ['screenshot', '--format', format, '--output', path], { timeout: 60000 });
    return { ok: true, path, info: stdout };
  } catch (e) {
    // 若 cua-driver 未安装, 提供清晰提示(宿主需装)
    return { ok: false, error: (e.stderr || e.message) + ' (cua-driver 未就绪? 需在宿主安装 cua-driver)' };
  }
}

// 视觉描述: 占位, 待接入 OCR / 多模态。
export async function describe({ image } = {}) {
  return { ok: false, error: 'describe: OCR 后端待接入' };
}

// CLI: node src/tools/visual.mjs screenshot
if (process.argv[1] && process.argv[1].endsWith('visual.mjs')) {
  const cmd = process.argv[2];
  if (cmd === 'screenshot') { const r = await screenshot({ path: process.argv[3] || 'shot.png' }); console.log(JSON.stringify(r)); }
  else { console.log('usage: visual.mjs screenshot [path]'); }
}
