// tests/dsh-worker.test.mjs - B-class resident DSH worker end-to-end
import { spawnDSHWorker } from "../src/runtime/dsh-worker.mjs";

export async function t_serve_internal() {
  const r = await spawnDSHWorker({ cmd: process.execPath, args: ["-e", "process.stdout.write('DSH_WORKER_OK')"] });
  if (!r.ok) throw new Error("internal serve failed: " + JSON.stringify(r));
  const out = String(r.stdout || "");
  if (!/DSH_WORKER_OK/.test(out)) throw new Error("unexpected out: " + out);
  return "odsh.serve ok";
}

export async function t_serve_no_cmd() {
  // Without a command (and with no remote endpoint) internal serve cannot execute a
  // DSH task, so it must report the truth ({ok:false}) rather than fake an echo.
  const r = await spawnDSHWorker({ task: "just-task" });
  if (r.ok) throw new Error("expected ok:false for no-cmd internal serve, got " + JSON.stringify(r));
  return "odsh.serve no-cmd ok (truthful)";
}
