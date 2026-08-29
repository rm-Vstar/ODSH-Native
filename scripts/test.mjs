// scripts/test.mjs — cross-platform minimal test runner (no deps)
//
// Import-based runner: every tests/*.test.mjs module is imported and each of its
// exported test functions is awaited. Guards:
//   - no test files present            -> exit 1
//   - total collected cases < MIN      -> exit 1 (a suite that silently exports
//     nothing — e.g. a top-level process.exit() or a scan not exported as a test —
//     would otherwise produce a false-green run)
// Suites must NEVER call process.exit() at import time (see tests/security.test.mjs).
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ok, deepStrictEqual, doesNotThrow } from 'node:assert/strict';
const ROOT = resolve(import.meta.dirname, '..');
const dir = join(ROOT, 'tests');
const MIN_CASES = 16; // keep in sync with the exported-test count across tests/
const files = (() => { try { return readdirSync(dir).filter((f)=>f.endsWith('.test.mjs')); } catch { return []; } })();
if (!files.length) { console.error('no tests found in tests/'); process.exit(1); }
let failures = 0;
let cases = 0;
for (const file of files) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  const exportable = typeof mod.default === 'function' ? { default: mod.default } : mod;
  const t = { ok, deepStrictEqual, doesNotThrow };
  const suiteTests = Object.entries(exportable).filter(([name, fn]) => name.startsWith('t_') && typeof fn === 'function');
  cases += suiteTests.length;
  for (const [name, fn] of suiteTests) {
    try { await fn(t); console.log('PASS ' + file + ' :: ' + name); }
    catch (e) { failures++; console.error('FAIL ' + file + ' :: ' + name + ' — ' + e.message); }
  }
}
if (cases < MIN_CASES) {
  console.error('SUITE_INCOMPLETE: only ' + cases + ' case(s) collected across ' + files.length +
    ' file(s) — expected at least ' + MIN_CASES + ' (a suite may have quietly exported nothing)');
  process.exit(1);
}
if (failures) { console.error(failures + ' failed'); process.exit(1); }
console.log('ALL TESTS PASSED (' + files.length + ' test file(s), ' + cases + ' case(s))');