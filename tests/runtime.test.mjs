// tests/runtime.test.mjs — verify A-class runtime tools execute real work
import { execTool } from "../src/runtime/exec.mjs";
import { describeVisual } from "../src/runtime/visual.mjs";
import { parseRemoteScreenshot } from "../src/runtime/visual.mjs";

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

export async function t_parse_remote_screenshot_trycua_format(t) {
  // trycua 主线 get_desktop_state shape: data: {success, images:[{data_base64, mime_type}]}
  const r = parseRemoteScreenshot('data: {"success":true,"images":[{"data_base64":"QUJD","mime_type":"image/png"}]}\r\n');
  t.ok(r.ok, 'trycua images[] shape must parse');
  t.ok(r.images.length === 1, 'one image expected');
  t.ok(r.images[0].data_base64 === 'QUJD', 'base64 passthrough');
  return 'trycua format parsed';
}

export async function t_parse_remote_screenshot_0125_format(t) {
  // PyPI 0.1.25 (openinterpreter 系) screenshot shape: data: {success, image_data: "<base64>"}
  const r = parseRemoteScreenshot('data: {"success":true,"image_data":"QUJD"}\r\n');
  t.ok(r.ok, '0.1.25 image_data shape must parse');
  t.ok(r.images.length === 1, 'one image expected');
  t.ok(r.images[0].data_base64 === 'QUJD', 'base64 passthrough');
  t.ok(r.images[0].mime_type === 'image/png', 'default mime');
  return '0.1.25 format parsed';
}

export async function t_parse_remote_screenshot_failure(t) {
  // success:false or no image data must NOT be reported as a fabricated success.
  const bad = parseRemoteScreenshot('data: {"success":false,"error":"boom"}\n');
  t.ok(!bad.ok, 'success:false must fail');
  t.ok(bad.error === 'boom', 'error passthrough');
  const empty = parseRemoteScreenshot('data: {"success":true}\n');
  t.ok(!empty.ok, 'success without image must fail');
  const junk = parseRemoteScreenshot('HTTP/1.1 400 Bad Request\r\n{"detail":"Unknown command: xxx"}');
  t.ok(!junk.ok, 'non-SSE/4xx body must fail');
  return 'failure paths fail-closed';
}