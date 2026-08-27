// registry.mjs — ODSH-Native 能力/插件注册表（fail-closed，安全发现）
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const TOOL_NAME_RE = /^[A-Za-z0-9_][A-Za-z0-9_\-]*$/; // 工具名白名单

export class Registry {
  constructor({ plugins = resolve('plugins') } = {}) {
    this.pluginsDir = plugins;
    this.tools = new Map(); // name -> { plugin, manifest, t, run }
  }
  async discover() {
    let entries = [];
    try { entries = await readdir(this.pluginsDir, { withFileTypes: true }); } catch { return this; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      await this._loadPlugin(e.name);
    }
    return this;
  }
  async _loadPlugin(name) {
    const p = join(this.pluginsDir, name);
    let manifest;
    try { manifest = JSON.parse(await readFile(join(p, 'manifest.json'), 'utf8')); }
    catch { manifest = { name, tools: [] }; }
    if (!manifest.tools) manifest.tools = [];
    for (const t of manifest.tools) {
      if (!TOOL_NAME_RE.test(t.name)) {
        console.warn('[registry] skip bad tool name:', t.name);
        continue;
      }
      try {
        const mod = await import(resolve(p, t.impl || 'tool.mjs'));
        this.tools.set(t.name, { plugin: name, manifest, t, run: mod.run || mod.default });
      } catch (err) {
        console.warn('[registry] failed to load', name + '/' + t.name, err.message);
      }
    }
    return this;
  }
  list() { return [...this.tools.keys()]; }
  async invoke(name, params = {}) {
    const t = this.tools.get(name);
    if (!t) throw new Error('tool not found: ' + name);
    return t.run(params);
  }
}

// CLI: node src/registry.mjs list
if (process.argv[1] && process.argv[1].endsWith('registry.mjs')) {
  const r = await new Registry().discover();
  console.log('tools:', r.list().join(', ') || '(none)');
}
