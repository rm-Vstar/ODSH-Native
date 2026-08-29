// src/runtime/dsh-worker.mjs - B-class: resident DSH Harness worker bridge
// Hosts execution for DSH-style tasks. Two modes:
//   internal: run a command locally (default),
//   remote:   POST to a DSH Harness HTTP backend (if configured).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

const REMOTE = process.env.DSH_WORKER_ENDPOINT || "";
const REMOTE_TOKEN = process.env.DSH_WORKER_TOKEN || "";
const MAX_IMGUI = 64 * 1024 * 1024;

/**
 * Validate a remote worker endpoint before sending it any traffic (fail-closed).
 * Only http(s):// URLs are accepted: a bare host ("localhost:8000") or a non-http
 * scheme (file:, ftp:, ...) is refused so the Bearer token can never be shipped to
 * an unexpected transport. http:// itself is allowed (documented contract — e.g. a
 * local DSH/Cordis worker) but callers should prefer https or localhost because the
 * token travels in cleartext over plain http.
 * @param {string} url
 * @returns {{ok: boolean, error?: string}}
 */
export function validateWorkerEndpoint(url) {
  if (!url) return { ok: false, error: "no DSH_WORKER_ENDPOINT configured" };
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, error: "invalid DSH_WORKER_ENDPOINT (must be http(s)://...) — refusing to send the token to a non-http endpoint" };
  }
  return { ok: true };
}

export async function spawnDSHWorker({ task, cmd, args = [], mode, timeoutMs = 30000 } = {}) {
  const useRemote = (mode === "remote") || (mode === undefined && !!REMOTE);
  if (useRemote) return remoteRun({ task, cmd, args, timeoutMs });
  return internalRun({ task, cmd, args, timeoutMs });
}

async function internalRun({ task, cmd, args, timeoutMs }) {
  // Only a command is truly executed locally. Without one we cannot "execute a DSH
  // task" in-process, so we report the truth rather than faking an echo.
  if (typeof cmd !== "string" || !cmd) {
    return { ok: false, source: "internal", error: "internal serve requires a command; or set DSH_WORKER_ENDPOINT for remote mode" };
  }
  try {
    const out = await run(cmd, (args || []), { timeout: timeoutMs, maxBuffer: 64*1024*1024 });
    return { ok: true, source: "internal", task, stdout: out.stdout };
  } catch (e) { return { ok: false, source: "internal", error: e.stderr || e.message }; }
}

async function remoteRun({ task, cmd, args, timeoutMs }) {
  const v = validateWorkerEndpoint(REMOTE);
  if (!v.ok) return { ok: false, source: "remote", error: v.error };
  try {
    const headers = { "content-type": "application/json" };
    if (REMOTE_TOKEN) headers["authorization"] = "Bearer " + REMOTE_TOKEN;
    const r = await fetch(REMOTE, { method: "POST", headers, body: JSON.stringify({ task, cmd, args }), signal: AbortSignal.timeout(timeoutMs || 30000) });
    const text = await r.text();
    return { ok: r.ok, source: "remote", status: r.status, output: text };
  } catch (e) { return { ok: false, source: "remote", error: e.message }; }
}