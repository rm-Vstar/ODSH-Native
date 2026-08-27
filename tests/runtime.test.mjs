// tests/runtime.test.mjs — verify A-class runtime tools execute real work
import { execTool } from "../src/runtime/exec.mjs";
import { describeVisual } from "../src/runtime/visual.mjs";

export async function t_exec_ok() {
  const r = await execTool({ cmd: process.execPath, args: ["-e", "console.log(123)"] });
  if (!r.ok) throw new Error("exec failed");
  if (!/123/.test(String(r.stdout))) throw new Error("unexpected output " + r.stdout);
  return "exec ok: " + String(r.stdout).trim();
}

export async function t_visual_stub() {
  const r = await describeVisual({ path: "/tmp/x.png" });
  if (r.path !== "/tmp/x.png") throw new Error("visual not passed path");
  return "visual stub ok";
}
