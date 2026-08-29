// src/index.ts - ODSH-Native OpenClaw plugin entry (v2)
// A-class agent tools + B-class resident services. Follows the real OpenClaw
// plugin-sdk contract: defineToolPlugin({ id, name, description, configSchema, tools(plugin) }).
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";
import { execTool } from "../src/runtime/exec.mjs";
import { runCua } from "../src/runtime/cua.mjs";
import { describeVisual } from "../src/runtime/visual.mjs";
import { spawnDSHWorker } from "../src/runtime/dsh-worker.mjs";
import { createWatcher } from "../src/services/watcher.mjs";
import { createScheduler } from "../src/services/scheduler.mjs";

export default defineToolPlugin({
  id: "odsh-native",
  name: "ODSH-Native",
  description: "Bring DSH execution + plugin/capability surface into OpenClaw (A-class agent tools + B-class resident services).",
  activation: { onStartup: true },
  tools() {
    return [
      { name: "odsh.exec", description: "Execute a local command (fail-closed argv).", parameters: { type: "object", properties: { cmd: { type: "string" }, args: { type: "array", items: { type: "string" } }, cwd: { type: "string" } }, required: ["cmd"] }, execute: async (params) => execTool(params || {}) },
      { name: "odsh.cua", description: "Drive CUA (cua-driver / cua-computer-server): image/click/browser, no focus steal. Local mode spawns cua-driver; remote mode requires CUA_REMOTE (host must run computer-server on the port).", parameters: { type: "object", properties: { tool: { type: "string" }, args: { type: "object" } }, required: ["tool"] }, execute: async (params) => runCua(params || {}) },
      { name: "odsh.visual", description: "Describe a screenshot/image (OCR/vision): pass a path, or capture a live frame (requires cua-driver or a remote computer-server on CUA_REMOTE) and OCR it with tesseract if present.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }, execute: async (params) => describeVisual(params || {}) },
      // odsh.serve mirrors the worker contract (src/runtime/dsh-worker.mjs): internal mode
      // needs a command + args; remote mode (DSH_WORKER_ENDPOINT set) dispatches the task
      // object to the remote worker. Secrets (endpoints/tokens) stay OUT of the schema.
      { name: "odsh.serve", description: "Execute a task inside a DSH Harness resident worker (B-class): internal mode runs a local command, remote mode POSTs to DSH_WORKER_ENDPOINT.", parameters: { type: "object", properties: { task: { type: "string" }, cmd: { type: "string" }, args: { type: "array", items: { type: "string" } }, mode: { type: "string", enum: ["internal", "remote"] }, timeoutMs: { type: "integer", minimum: 1 } }, required: ["task"] }, execute: async (params) => spawnDSHWorker(params || {}) },
    ];
  },
});

// B-class resident support used by a factory tool variant (kept separate for clarity).
export function startResidentServices(config = {}) {
  const wcfg = (config.watch || {});
  const watcher = (wcfg.enabled && Array.isArray(wcfg.paths)) ? createWatcher({ paths: wcfg.paths }) : null;
  const scheduler = createScheduler((config.schedule || []));
  return { stop() { if (watcher) watcher.stop(); scheduler.stop(); } };
}
