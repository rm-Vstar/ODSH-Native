// bridge.mjs — ODSH-Native ↔ OpenClaw 网关集成面
// 复用 Ed25519 配对网关(从 ODSH-Bridge 移植)。把 ODSH-Native 注册表工具暴露给/调用 OpenClaw。
import { loadEnvFile } from './env.mjs';
import { openSession } from './gateway-client.mjs';
import { Registry } from '../registry.mjs';
import { resolve } from 'node:path';

loadEnvFile();

export class Bridge {
  constructor({ registry = undefined, plugins = resolve('plugins') } = {}) {
    this.registry = registry || new Registry({ plugins });
    this.session = null;
  }
  async init() { await this.registry.discover(); return this; }
  async connect(o = {}) {
    const { envInt } = await import('./env.mjs');
    this.session = await openSession({ connectTimeoutMs: o.connectTimeoutMs || envInt('OC_CONNECT_TIMEOUT_MS', 45000) });
    return this;
  }
  async callOpenClaw(name, args = {}, { timeoutMs } = {}) {
    if (!this.session) throw new Error('bridge not connected');
    const { envInt } = await import('./env.mjs');
    return this.session.request('tools.invoke', { name, args }, { timeoutMs: timeoutMs || envInt('OC_REPLY_TIMEOUT_MS', 20000) });
  }
  caps() { return this.registry.list().map((n) => ({ name: n, source: 'odsh-native' })); }
  invokeLocal(name, params = {}) { return this.registry.invoke(name, params); }
  close() { try { this.session && this.session.close(); } catch {} }
}

// CLI: node src/gateway/bridge.mjs [tool] [jsonArgs]
if (process.argv[1] && process.argv[1].endsWith('bridge.mjs')) {
  const b = new Bridge();
  await b.init();
  console.log('caps:', b.caps().map((c) => c.name).join(', ') || '(none)');
  const tool = process.argv[2];
  if (tool) {
    const params = process.argv[3] ? JSON.parse(process.argv[3]) : {};
    console.log('invoke', tool, '->', JSON.stringify(await b.invokeLocal(tool, params)));
  }
}
