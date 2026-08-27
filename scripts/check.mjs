// scripts/check.mjs — 跨平台递归 ESM 语法检查
// Windows cmd 不展开 glob，node --check src/*.mjs 在宿主上失效；此脚本递归收集 .mjs/.js 再逐个 --check。
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'build']);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.mjs') || p.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
let bad = 0;
for (const file of files) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status === 0) { console.log('OK   ' + file.replace(ROOT + sep, '')); }
  else { bad++; console.log('FAIL ' + file + '\n' + (r.stderr || '')); }
}
if (bad) { console.error('CHECK_FAILED ' + bad + ' file(s)'); process.exit(1); }
console.log('ALL_SYNTAX_OK (' + files.length + ' files)');