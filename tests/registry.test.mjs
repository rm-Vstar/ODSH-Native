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
}