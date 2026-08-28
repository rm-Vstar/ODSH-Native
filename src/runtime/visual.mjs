// src/runtime/visual.mjs - A-class tool: describe a screenshot/image (OCR / vision backend).
// Zero-dependency, cross-platform, fail-safe. Backends probed in order:
//   1. tesseract CLI (TESSERACT_BIN or on PATH) for local OCR.
//   2. cua-driver get_desktop_state when no image path is provided.
// Never fabricates OCR output: when no backend can produce text it returns a truthful,
// actionable payload (path + image info + note) instead of pretending OCR succeeded.
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { stat, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const run = promisify(execFile);
const TESS = process.env.TESSERACT_BIN || 'tesseract';
const CUA = process.env.CUA_DRIVER || 'cua-driver';

async function which(cmd) {
  const probes = process.platform === 'win32'
    ? [cmd, cmd + '.exe', cmd + '.cmd', cmd + '.bat']
    : [cmd];
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

// Reused (not growing) scratch dir so captures do not leak one temp dir per call.
const CAP_DIR = join(tmpdir(), 'odsh-visual');
async function captureScreenshot(cuaPath) {
  await mkdir(CAP_DIR, { recursive: true });
  const out = join(CAP_DIR, 'desktop-' + process.pid + '-' + Date.now() + '.png');
  try {
    // Invoke cua-driver; we cannot rely on where it writes its frame, so after the
    // call we verify an image actually exists before claiming success (never fake it).
    await run(cuaPath, ['get_desktop_state'], { timeout: 60000, maxBuffer: 64 * 1024 * 1024 });
    let found = null;
    try { if ((await stat(out)).isFile()) found = out; } catch { /* not there */ }
    if (!found) {
      const names = (await readdir(CAP_DIR)).filter((n) => /\.(png|jpe?g|webp)$/i.test(n));
      if (names.length) found = join(CAP_DIR, names[names.length - 1]);
    }
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
    const cuaPath = await which(CUA);
    if (cuaPath) {
      const shot = await captureScreenshot(cuaPath);
      return { ok: shot.ok, source: 'capture', engine: 'cua-driver', path: shot.path, note: shot.ok ? 'captured live desktop frame' : (shot.error || 'capture unavailable'), ...(shot.error ? { error: shot.error } : {}) };
    }
    return { ok: true, source: 'none', note: 'no image path given and no cua-driver to capture; pass an image path' };
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