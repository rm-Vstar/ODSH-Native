#!/usr/bin/env node
// security.test.mjs - security regression scans for ODSH-Native (npm test).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = ["node_modules", "dist", ".git", ".dsh", "tmp-sec.mjs"];

function walk(acc, dir) {
  let ent = []; try { ent = readdirSync(join(ROOT, dir)); } catch { return acc; }
  for (const e of ent) {
    const p = join(ROOT, dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (!SKIP_DIRS.includes(e)) walk(acc, join(dir, e)); }
    else if (/.(mjs|js|ts|json|md|sh|ps1)$/.test(e)) acc.push({ rel: join(dir, e).split(sep).join("/"), path: p });
  }
  return acc;
}
const files = walk([], "");
const read = (rel) => { try { return readFileSync(join(ROOT, rel.split("/").join(sep)), "utf8"); } catch { return ""; } };

let failures = 0;
function ok(n){ console.log("  \u2713 " + n); }
function bad(n, d){ failures++; console.error("  \u2717 " + n + (d ? " :: " + d : "")); }
function assert(c, n, d){ c ? ok(n) : bad(n, d); }

console.log("security scan (" + files.length + " files):");

// 1) fail-closed in runtime
const execSrc = read("src/runtime/exec.mjs");
assert(/shell:\s*false/.test(execSrc), "exec uses execFile without shell (no command injection)");
const cuaSrc = read("src/runtime/cua.mjs");
assert(/TOOL_RE/.test(cuaSrc), "cua tool-name whitelist present (fail-closed)");

// 2) .env / node_modules gitignored
const gi = read(".gitignore");
assert(gi.includes(".env"), ".env gitignored");
assert(gi.includes("node_modules"), "node_modules gitignored");

// 3) no obvious secrets / long tokens
const PATS = [/([0-9a-f]){64}/gi, /ghp_[A-Za-z0-9]{20,}/g, /clh_[A-Za-z0-9]{20,}/g, /sk-[A-Za-z0-9]{20,}/g];
let secretHit = [];
for (const f of files) {
  const raw = read(f.rel).replace(/REPLACE_WITH_GATEWAY_TOKEN/g, "");
  for (const p of PATS) { const m = raw.match(p); if (m) secretHit.push(f.rel + ":" + p); }
}
assert(secretHit.length === 0, "no obvious secrets/keys across repo", secretHit.join(","));

// 4) privacy: no personal email / username / hostname leaked (consented AUTHORS allowed)
const CONSENT = ["AUTHORS.md", "tests/security.test.mjs"];
let leaked = [];
for (const f of files) {
  if (CONSENT.includes(f.rel)) continue;
  const low = read(f.rel).toLowerCase();
  for (const id of ["mikoribbit", "vstarphoto", "89732", "mikopc2024", "h:/odsh-bridge"]) {
    if (low.includes(id.toLowerCase())) leaked.push(f.rel + "#" + id);
  }
}
assert(leaked.length === 0, "no personal identifiers outside consented docs", leaked.join(","));

// 5) package.json name + semver
let pkg; try { pkg = JSON.parse(read("package.json")); } catch { pkg = null; }
assert(pkg && pkg.name === "odsh-native" && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(pkg.version), "package.json name + semver");

console.log(failures === 0 ? "\nALL SECURITY TESTS PASSED (" + files.length + " files)" : "\n" + failures + " FAILURE(S)");
process.exit(failures === 0 ? 0 : 1);