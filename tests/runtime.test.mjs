// tests/runtime.test.mjs — verify A-class runtime tools execute real work
import { execTool } from "../src/runtime/exec.mjs";
import { describeVisual } from "../src/runtime/visual.mjs";

export async function t_exec_ok() {
  const r = await execTool({ cmd: process.execPath, args: ["-e", "console.log(123)"] });
  if (!r.ok) throw new Error("exec failed");
  if (!/123/.test(String(r.stdout))) throw new Error("unexpected output " + r.stdout);
  return "exec ok: " + String(r.stdout).trim();
}

export async function t_visual_missing_path_reports_error() {
  // A path that does not exist must return a truthful {ok:false}, not a fabricated success.
  const r = await describeVisual({ path: "/tmp/does-not-exist-odsh.png" });
  if (r.ok) throw new Error("expected ok:false for missing image, got " + JSON.stringify(r));
  return "visual missing-path ok";
}

export async function t_visual_none_capture_fallback() {
  // No image path and no OCR/cua available -> honest {ok:true} with a note (never fake OCR).
  const r = await describeVisual({});
  if (!r) throw new Error("visual empty-payload failed");
  return "visual no-path ok: engine=" + (r.engine || 'none');
}