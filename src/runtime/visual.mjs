// src/runtime/visual.mjs - A-class tool: describe a screenshot/image (OCR / vision backend).
// Zero-dependency, cross-platform, fail-safe. Backends probed in order:
//   1. tesseract CLI (TESSERACT_BIN or on PATH) for local OCR.
//   2. screen capture: LOCAL cua-driver (no CUA_REMOTE) OR remote computer-server (CUA_REMOTE set).
// Never fabricates OCR output: when no backend can produce text it returns a truthful,
// actionable payload (path + image info + note) instead of pretending OCR succeeded.
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { stat, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const TESS = process.env.TESSERACT_BIN || 'tesseract';
const CUA = process.env.CUA_DRIVER || 'cua-driver';
const REMOTE = process.env.CUA_REMOTE || ''; // http://host.docker.internal:8000 for docker->host
// In-memory-first scratch dir: /dev/shm (tmpfs) keeps captured frames off the persistent
// disk on Linux; falls back to the OS tmp dir elsewhere. Override with ODSH_VISUAL_DIR.
const SHM = (process.platform === 'linux' && existsSync('/dev/shm')) ? '/dev/shm/odsh-visual' : null;
const CAP_DIR = process.env.ODSH_VISUAL_DIR || SHM || join(tmpdir(), 'odsh-visual');

async function which(cmd) {
  const probes = process.platform === 'win32' ? [cmd, cmd + '.exe', cmd + '.cmd', cmd + '.bat'] : [cmd];
  for (const p of probes) {
    const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [p], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

async function ocrWithTesseract(imagePath, bin) {
  try {
    const { stdout, stderr } = await run(bin, [imagePath, 'stdout'], { timeout: 30000, maxBuffer: 32 * 1024 * 1024 });
    return { ok: true, engine: 'tesseract', text: (stdout || '').trim() };
  } catch (e) {
    return { ok: false, engine: 'tesseract', error: e.stderr || e.message };
  }
}

// Write each base64 image returned by a remote computer-server /cmd screenshot into CAP_DIR.
async function writeBase64Images(items) {
  await mkdir(CAP_DIR, { recursive: true });
  const written = [];
  for (const it of (items || [])) {
    if (!it || typeof it.data_base64 !== 'string') continue;
    const mime = it.mime_type || 'image/png';
    const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
    const f = join(CAP_DIR, 'desktop-' + process.pid + '-' + Date.now() + '-' + written.length + '.' + ext);
    try { await writeFile(f, Buffer.from(it.data_base64, 'base64')); written.push(f); } catch { /* skip bad image */ }
  }
  return written;
}

// Parse a computer-server /cmd SSE payload into a uniform image list. Two response
// shapes are accepted (see docs/CUA-EXECUTION.md §Command map):
//   - trycua 主线 (get_desktop_state): {success, images: [{data_base64, mime_type}]}
//   - PyPI 0.1.25 (openinterpreter 系, screenshot): {success, image_data: "<base64>"}
// Exported as a pure function so tests can pin both formats.
export function parseRemoteScreenshot(text) {
  let images = null;
  let single = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.startsWith('data: ')) continue;
    let j = null;
    try { j = JSON.parse(line.slice(6).trim()); } catch { continue; }
    if (!j) continue;
    if (j.success === false) return { ok: false, error: j.error || 'remote screenshot failed' };
    if (Array.isArray(j.images) && j.images.length) { images = j.images; break; }
    if (typeof j.image_data === 'string' && j.image_data) { single = j.image_data; break; }
  }
  if (images) return { ok: true, images };
  if (single) return { ok: true, images: [{ data_base64: single, mime_type: 'image/png' }] };
  return { ok: false, error: 'remote capture returned no image' };
}

// Remote capture via cua-computer-server /cmd (SSE). Tries the trycua 主线 command
// first (get_desktop_state); if the server answers 4xx / no image (PyPI 0.1.25
// openinterpreter 系 does not know it) falls back to the 0.1.25 `screenshot` name.
async function remoteScreenshot() {
  const base = String(REMOTE).replace(/\/$/, '');
  if (!/^https?:\/\//.test(REMOTE)) return { ok: false, error: 'invalid CUA_REMOTE (must be http(s)://...)', remote: true };
  const attempt = async (command) => {
    const r = await fetch(base + '/cmd', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command, params: {} }),
      signal: AbortSignal.timeout(60000),
    });
    return { status: r.status, text: await r.text() };
  };
  try {
    let resp = await attempt('get_desktop_state');
    let parsed = parseRemoteScreenshot(resp.text);
    if (resp.status >= 400 || !parsed.ok) {
      resp = await attempt('screenshot');
      parsed = parseRemoteScreenshot(resp.text);
    }
    if (!parsed.ok) return { ok: false, remote: true, error: parsed.error || 'remote capture failed (tried get_desktop_state + screenshot)' };
    const written = await writeBase64Images(parsed.images);
    if (!written.length) return { ok: false, remote: true, error: 'could not persist remote screenshot' };
    return { ok: true, remote: true, path: written[written.length - 1] };
  } catch (e) {
    return { ok: false, remote: true, error: e.message, hint: 'is computer-server running and CUA_REMOTE correct?' };
  }
}

// Pick the newest capture under CAP_DIR, verifying each candidate still exists (the
// directory may be shared/rotated by other captures, so a name listed by readdir can
// already be gone or half-written — fall back to older files instead of returning a
// stale or non-existent path).
async function pickLatestImage() {
  const names = (await readdir(CAP_DIR)).filter((n) => /\.(png|jpe?g|webp)$/i.test(n)).sort();
  for (let i = names.length - 1; i >= 0; i--) {
    const cand = join(CAP_DIR, names[i]);
    try { if ((await stat(cand)).isFile()) return cand; } catch { /* removed/replaced concurrently — try older */ }
  }
  return null;
}

async function localCaptureScreen(cuaPath) {
  await mkdir(CAP_DIR, { recursive: true });
  const out = join(CAP_DIR, 'desktop-' + process.pid + '-' + Date.now() + '.png');
  try {
    await run(cuaPath, ['get_desktop_state'], { timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
    let found = null;
    try { if ((await stat(out)).isFile()) found = out; } catch { /* not there */ }
    if (!found) found = await pickLatestImage();
    if (!found) return { ok: false, error: 'cua-driver ran but produced no image file' };
    return { ok: true, path: found };
  } catch (e) {
    return { ok: false, error: e.stderr || e.message };
  }
}

export async function describeVisual({ path, image } = {}) {
  const src = path || image || null;
  let st = null;
  if (src) { try { st = await stat(src); } catch { st = null; } }

  if (!src) {
    // Capture: prefer remote computer-server when CUA_REMOTE is set, else local cua-driver.
    let shot = null;
    let backend = null;
    if (REMOTE) { shot = await remoteScreenshot(); backend = 'computer-server'; }
    else { const cuaPath = await which(CUA); if (cuaPath) { shot = await localCaptureScreen(cuaPath); backend = 'cua-driver'; } }
    if (!shot) return { ok: true, source: 'none', note: 'no image path given, no CUA_REMOTE, and no local cua-driver; pass an image path' };
    if (!shot.ok) return { ok: false, source: 'capture', remote: shot.remote, engine: backend, error: shot.error || 'capture unavailable' };
    // Fast-path: OCR the freshly captured frame in one call (scratch dir is /dev/shm
    // tmpfs when available, so no persistent-disk write happens).
    const tesseract = await which(TESS);
    if (tesseract) {
      const ocr = await ocrWithTesseract(shot.path, tesseract);
      if (ocr.ok) return { ok: true, source: 'capture', remote: shot.remote, engine: 'tesseract', backend, path: shot.path, text: ocr.text, note: 'captured a live frame and OCR\'d it in one shot' };
      return { ok: true, source: 'capture', remote: shot.remote, engine: backend, path: shot.path, note: 'captured a live frame; OCR produced no text — pass the path to a multimodal model', ...(ocr.error ? { ocrError: ocr.error } : {}) };
    }
    return { ok: true, source: 'capture', remote: shot.remote, engine: backend, path: shot.path, note: 'captured a live frame; no local OCR backend — pass the path to a multimodal model' };
  }

  if (!st || !st.isFile()) {
    return { ok: false, error: 'image path does not exist or is not a file: ' + src };
  }

  const tesseract = await which(TESS);
  if (tesseract) {
    const ocr = await ocrWithTesseract(src, tesseract);
    if (ocr.ok) return { ok: true, engine: 'tesseract', path: src, text: ocr.text, size: st.size };
  }

  return { ok: true, engine: 'none', path: src, size: st.size, note: 'no local OCR backend detected; pass to a multimodal model for description' };
}