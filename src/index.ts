// src/index.ts - ODSH-Native OpenClaw plugin entry (v2)
// A-class agent tools + B-class resident services.
import { defineToolPlugin } from "openclaw";
import { execTool } from "./runtime/exec.mjs";
import { runCua } from "./runtime/cua.mjs";
import { describeVisual } from "./runtime/visual.mjs";
import { spawnDSHWorker } from "./runtime/dsh-worker.mjs";
import { createWatcher } from "./services/watcher.mjs";
import { createScheduler } from "./services/scheduler.mjs";

export default defineToolPlugin(({ onTool, api, config = {} }) => {
  const tools = [
    { name: "odsh.exec", description: "Execute a local command (fail-closed argv).", schema: { type: "object", properties: { cmd: { type: "string" }, args: { type: "array", items: { type: "string" } }, cwd: { type: "string" } }, required: ["cmd"] }, run: (p) => execTool(p) },
    { name: "odsh.cua", description: "Drive local CUA (cua-driver): screenshot/click/browser, no focus steal.", schema: { type: "object", properties: { tool: { type: "string" }, args: { type: "object" } }, required: ["tool"] }, run: (p) => runCua(p) },
    { name: "odsh.visual", description: "Describe a screenshot/image (OCR/vision).", schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }, run: (p) => describeVisual(p) },
    { name: "odsh.serve", description: "Execute a task inside a DSH Harness resident worker (B-class).", schema: { type: "object", properties: { task: { type: "string" } }, required: ["task"] }, run: (p) => spawnDSHWorker(p) },
  ];
  for (const t of tools) api.registerTool(t);

  // B-class resident watcher + scheduler
  const wcfg = (config.watch || {});
  let watcher = null;
  if (wcfg.enabled && Array.isArray(wcfg.paths)) {
    watcher = createWatcher({ paths: wcfg.paths, handler: (ev) => { if (api && api.emit) api.emit("odsh.watch", ev); } });
  }
  const scheduler = createScheduler((config.schedule || []));
  return { async stop() { if (watcher) watcher.stop(); scheduler.stop(); } };
});

