import { Registry } from '../src/registry.mjs';
import { resolve } from 'node:path';

export async function t_discover_finds_echo(t) {
  const r = new Registry({ plugins: resolve(import.meta.dirname, '..', 'plugins') });
  await r.discover();
  t.ok(r.list().includes('echo'), 'echo tool should be discovered from plugins/');
}

export async function t_invoke_echo(t) {
  const r = new Registry({ plugins: resolve(import.meta.dirname, '..', 'plugins') });
  await r.discover();
  const res = await r.invoke('echo', { text: 'hello-win' });
  t.deepStrictEqual(res, { ok: true, echoed: 'hello-win' });
}

export async function t_invoke_unknown_tool(t) {
  const r = new Registry({ plugins: resolve(import.meta.dirname, '..', 'plugins') });
  await r.discover();
  let threw = false;
  try { await r.invoke('no-such-tool', {}); } catch (e) { threw = /tool not found/.test(e.message); }
  t.ok(threw, 'unknown tool must reject with "tool not found"');
  return 'unknown tool rejected';
}

export async function t_blocks_traversal_impl(t) {
  // A plugin manifest pointing its impl outside pluginsDir (../ traversal) must be
  // skipped fail-closed, not dynamically imported.
  const { mkdtempSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = mkdtempSync(join(tmpdir(), 'registry-traversal-'));
  const pdir = join(root, 'evil');
  mkdirSync(pdir, { recursive: true });
  writeFileSync(join(pdir, 'manifest.json'), JSON.stringify({
    name: 'evil',
    tools: [{ name: 'evil-tool', impl: '../../../src/runtime/exec.mjs', description: 'escapes pluginsDir' }],
  }));
  const r = new Registry({ plugins: root });
  await r.discover();
  t.deepStrictEqual(r.list(), [], 'traversal impl must be blocked (fail-closed)');
}

export async function t_blocks_symlink_escape(t) {
  // A symlink INSIDE pluginsDir pointing at a file OUTSIDE it must be rejected:
  // the lexical containment check alone cannot see through symlinks.
  const { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const base = mkdtempSync(join(tmpdir(), 'registry-symlink-'));
  const root = join(base, 'plugins');       // pluginsDir
  const outsideDir = join(base, 'outside'); // sibling, OUTSIDE pluginsDir
  mkdirSync(join(root, 'evil'), { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  const outside = join(outsideDir, 'outside.mjs');
  writeFileSync(outside, 'export function run(){ return { ok: true, escaped: true }; }');
  symlinkSync(outside, join(root, 'evil', 'tool.mjs')); // inside -> outside
  writeFileSync(join(root, 'evil', 'manifest.json'), JSON.stringify({
    name: 'evil',
    tools: [{ name: 'evil-tool', impl: 'tool.mjs', description: 'symlink escapes pluginsDir' }],
  }));
  const r = new Registry({ plugins: root });
  await r.discover();
  t.deepStrictEqual(r.list(), [], 'symlink escaping pluginsDir must be blocked (fail-closed)');
}