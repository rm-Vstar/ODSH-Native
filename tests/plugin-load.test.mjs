// tests/plugin-load.test.mjs - loads the OpenClaw plugin under the real openclaw plugin-sdk.
// Skips when the openclaw peer package is not installed in this checkout.
let entry = null;
let skip = false;
const skipNote = "openclaw peer not installed - plugin-load skipped";
try {
  import.meta.resolve("openclaw/plugin-sdk/tool-plugin");
} catch (e) {
  if (e.code === 'ERR_MODULE_NOT_FOUND' && /^Cannot find package 'openclaw' imported from /.test(e.message)) skip = true;
  else throw e;
}
if (!skip) entry = (await import("../src/index.ts")).default;

export async function t_plugin_loads_and_registers() {
  if (skip) return "SKIP: " + skipNote;
  if (typeof entry !== "object" || typeof entry.register !== "function") throw new Error("no register()");
  const registered = [];
  const mockApi = { registerTool(spec, opts) { registered.push({ spec, opts }); }, pluginConfig: {} };
  entry.register(mockApi);
  const names = registered.map(r => (r.spec && r.spec.name) || r.spec);
  if (names.length < 4 || !names.includes("odsh.exec")) throw new Error("tools not registered: " + names.join(","));
  return "registered: " + names.join(", ");
}

export async function t_plugin_exec_roundtrip() {
  if (skip) return "SKIP: " + skipNote;
  const registered = [];
  const mockApi = { registerTool(spec, opts) { registered.push({ spec, opts }); }, pluginConfig: {} };
  entry.register(mockApi);
  const t = registered.find(r => (r.spec && r.spec.name === "odsh.exec"));
  if (!t) throw new Error("odsh.exec not registered");
  const r = await t.spec.execute(undefined, { cmd: process.execPath, args: ["-e", "process.stdout.write('PLUGIN_EXEC_OK')"] });
  const out = JSON.stringify(r);
  if (!/PLUGIN_EXEC_OK/.test(out)) throw new Error("exec did not run through plugin: " + out.slice(0,80));
  return "odsh.exec round-trip ok";
}

export async function t_dist_entry_matches_contract() {
  // The runtime artifact (dist/index.js) is what OpenClaw actually loads (runtimeExtensions).
  // It must carry the SAME defineToolPlugin product as src/index.ts, i.e. a register().
  if (skip) return "SKIP: " + skipNote;
  const distEntry = (await import("../dist/index.js")).default;
  if (!distEntry || typeof distEntry.register !== "function") throw new Error("dist entry missing register() - OpenClaw would load it as non-capability");
  const registered = [];
  const mockApi = { registerTool(spec, opts) { registered.push({ spec, opts }); }, pluginConfig: {} };
  distEntry.register(mockApi);
  const names = registered.map(r => (r.spec && r.spec.name) || r.spec);
  if (names.length < 4 || !names.includes("odsh.exec")) throw new Error("dist did not register tools: " + names.join(","));
  return "dist registers: " + names.join(", ");
}
