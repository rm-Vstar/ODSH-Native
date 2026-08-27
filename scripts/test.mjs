// scripts/test.mjs — cross-platform minimal test runner (no deps)
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ok, deepStrictEqual, doesNotThrow } from 'node:assert/strict';
const ROOT = resolve(import.meta.dirname, '..');
const dir = join(ROOT, 'tests');
const files = (() => { try { return readdirSync(dir).filter((f)=>f.endsWith('.test.mjs')); } catch { return []; } })();
if (!files.length) { console.error('no tests found in tests/'); process.exit(1); }
let failures = 0;
for (const file of files) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  const exportable = typeof mod.default === 'function' ? { default: mod.default } : mod;
  const t = { ok, deepStrictEqual, doesNotThrow };
  for (const [name, fn] of Object.entries(exportable)) {
    if (name === 'default' || typeof fn !== 'function') continue;
    try { await fn(t); console.log('PASS ' + file + ' :: ' + name); }
    catch (e) { failures++; console.error('FAIL ' + file + ' :: ' + name + ' — ' + e.message); }
  }
}
if (failures) { console.error(failures + ' failed'); process.exit(1); }
console.log('ALL TESTS PASSED (' + files.length + ' test file(s))');