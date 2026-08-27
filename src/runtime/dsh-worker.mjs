// src/runtime/dsh-worker.mjs - B-class: resident DSH Harness worker bridge
// Hosts execution for DSH-style tasks. Two modes:
//   internal: run a command locally (default),
//   remote:   POST to a DSH Harness HTTP backend (if configured).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

const REMOTE = process.env.DSH_WORKER_ENDPOINT || "";
const MAX_IMGUI = 64 * 1024 * 1024;

export async function spawnDSHWorker({ task, cmd, args = [], mode, timeoutMs = 30000 } = {}) {
  const useRemote = (mode === "remote") || (mode === undefined && !!REMOTE);
  if (useRemote) return remoteRun({ task, cmd, args, timeoutMs });
  return internalRun({ task, cmd, args, timeoutMs });
}

async function internalRun({ task, cmd, args, timeoutMs }) {
  // If a command is given, run it; else run a node snippet with the task string.
  const useCmd = typeof cmd === "string" && cmd;
  try {
    const out = useCmd
      ? await run(cmd, (args || []), { timeout: timeoutMs, maxBuffer: 64*1024*1024 })
      : await run(process.execPath, ["--input-type=module", "-e", "console.log(process.argv[1])", "--", String(task || "")], { timeout: timeoutMs, maxBuffer: 16*1024*1024 });
    return { ok: true, source: "internal", task, stdout: out.stdout };
  } catch (e) { return { ok: false, source: "internal", error: e.stderr || e.message }; }
}

async function remoteRun({ task, cmd, args, timeoutMs }) {
  if (!REMOTE) return { ok: false, error: "no DSH_WORKER_ENDPOINT configured" };
  try {
    const r = await fetch(REMOTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task, cmd, args }), signal: AbortSignal.timeout(timeoutMs || 30000) });
    const text = await r.text();
    return { ok: r.ok, source: "remote", status: r.status, output: text };
  } catch (e) { return { ok: false, source: "remote", error: e.message }; }
}