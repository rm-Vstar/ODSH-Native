# Changelog

All notable changes to ODSH-Native are documented here. Format: Keep a Changelog.

## [Unreleased]

**CUA 打通 validation round (2026-08-29, from the Docker→host CUA integration summary)**.

### Added

- `odsh.visual` capture fast-path: a fresh live frame is now **OCR-featured in the same call**
  (tesseract) when no image path is given — one-shot `{ok, text, path}` instead of save-then-
  describe. See docs/CUA-EXECUTION.
- Remote capture now **probes both computer-server lines**: `get_desktop_state` (trycua 主线)
  first, falling back to `screenshot` (PyPI `cua-computer-server` 0.1.25, openinterpreter 系)
  on 4xx / no-image. Response parser (`parseRemoteScreenshot`, exported for tests) accepts
  both `images[]` and `image_data` shapes and fails closed on `success:false` / no data.
- Captures go to `/dev/shm/odsh-visual` on Linux (tmpfs — in RAM, no persistent-disk write),
  falling back to the OS tmp dir elsewhere; override with `ODSH_VISUAL_DIR`.

### Docs

- `docs/CUA-EXECUTION(.zh).md` rewritten: host prerequisite now states **a port must be open**
  (no server → `fetch failed`), the verified PyPI 0.1.25 command (`pip install
  cua-computer-server` + `python -m computer_server --host 0.0.0.0 --port 8000`, no `[driver]`
  extra, no GitHub-mainline flags), the 0.1.25 ↔ trycua command map, and the **full restart
  required** note for `CUA_REMOTE` via `env.vars` (hot-reload does not re-read env).
- README (EN/zh) host prerequisite updated to the same verified 0.1.25 instructions + restart
  caveat; `odsh.visual`/`odsh.cua` tool descriptions in `src/index.ts` now state the
  computer-server prerequisite explicitly for agents.

**Security hardening + robustness round (2026-08-29):** see below.

---

**Audit round 2026-08-29 (round 2): security hardening + robustness.**

### Security

- `src/runtime/dsh-worker.mjs`: remote endpoint is now validated fail-closed
  (`validateWorkerEndpoint`) — only `http(s)://` URLs are accepted; a bare host or a
  non-http scheme is refused before the Bearer token could be sent to an unexpected
  transport. Plain `http://` remains allowed (documented contract for local DSH/Cordis
  workers) with a docs warning that the token travels in cleartext over it.
- `src/registry.mjs`: plugin `impl` containment now resolves symlinks (`realpathSync`)
  and re-checks the real path against the real pluginsDir root, closing the symlink-
  escape bypass where a link inside pluginsDir pointed at a file outside it.
- `src/services/scheduler.mjs` / `src/services/watcher.mjs`: a handler that throws
  synchronously is now isolated (try/catch + logged warning) instead of crashing the
  host process.
- `src/gateway/gateway-client.mjs`: an idle connection no longer self-destructs after
  the ~8s read timeout — a timed-out read is not a close, so the recv loop keeps
  running until the socket actually closes. Added a configurable keepalive ping
  (`ODSH_WS_KEEPALIVE_MS`, default 4000, 0 disables) to keep quiet links warm.
- Docs honesty: "tool whitelist" wording corrected to "tool-name format check" across
  `runtime/cua.mjs`, `runtime/exec.mjs`, README, OPERATIONS, CUA-EXECUTION (EN/zh) —
  the existing check is a fail-closed name-format regex, not a capability whitelist.
- `docs/CONFIGURATION(.zh).md`: `DSH_WORKER_ENDPOINT` row now documents the http(s)
  requirement and the cleartext-token caveat of plain http.

### Tests

- New `tests/dsh-worker.test.mjs`: endpoint scheme validation (http/https allowed,
  bare host / empty / file: / ftp: rejected).
- `tests/registry.test.mjs::t_blocks_symlink_escape`: symlink inside pluginsDir
  pointing outside is blocked fail-closed.
- `tests/services.test.mjs`: `t_scheduler_sync_throw_does_not_crash` and
  `t_watcher_sync_throw_does_not_crash` — sync-throwing handlers must not kill the
  host and healthy neighbours keep working.
- New `tests/gateway-client.test.mjs`: keepalive ping frame is a masked, empty
  RFC 6455 ping.

**Audit round 2026-08-29: test-harness truth, doc honesty, least-privilege, wiring cleanup.**

### Fixed

- `tests/security.test.mjs` no longer calls `process.exit()` at import time. It previously
  killed the `scripts/test.mjs` runner mid-suite (the security scan ran a second time and
  exited 0 before `services.test.mjs` ever executed — a false-green npm test). The scan is
  now exported as a pure function + a `t_security_scan` test; the top-level exit only runs
  when the file is executed directly (`npm test` first stage).
- `scripts/test.mjs` now enforces a minimum of **16 collected cases** across suites, so a
  suite that silently exports nothing can no longer pass as green.
- `tests/cua.test.mjs` resolved its hard-coded absolute module path (wrong repo name,
  double slash) to `new URL('../src/runtime/cua.mjs', import.meta.url)`; the probe file now
  lives in `os.tmpdir()` (per-pid) and is cleaned up after every probe instead of polluting
  the repo.
- `tests/registry.test.mjs::t_invoke_unknown_tool` was a stub (`let threw = false;` with no
  assertion) — it now asserts the unknown-tool invocation actually rejects.
- `src/runtime/visual.mjs`: latest-PNG fallback selection now verifies the chosen file
  exists (stat) and walks back to older images, removing the race where a file listed by
  `readdir` could be gone/replaced before return.

### Changed

- `odsh.serve` schema (`src/index.ts`) now mirrors the worker contract: `cmd`, `args`,
  `mode`, `timeoutMs` added (internal mode requires `cmd`; secrets stay out of the schema).
- Least-privilege: `gateway-client.mjs` requests `['operator.read','operator.write']`
  instead of `admin/approvals/pairing` (the client only calls tools; if a future gateway
  needs the exact approved set, restore the commented full list).
- `openclaw.plugin.json` `configSchema` trimmed to an empty schema: the declared
  `pluginsDir`/`watch`/`dshWorker` keys were never consumed by the runtime.
- `.env.example` drops un-wired keys (`ODSH_PLUGINS_DIR`, `ODSH_WATCH_*`, `ODSH_SCHEDULE_JSON`,
  `CUA_TIMEOUT_MS`); `docs/CONFIGURATION(.zh).md` env tables synced to it.
- `package.json`: removed the dangling `typebox` dependency (zero src references) and
  corrected `engines` to `>=22.6` (required for `--experimental-strip-types`).
- `scripts/check.mjs` now also syntax-checks `.ts` files (matches docs/OPERATIONS claim).
- README(EN/zh): web search (SERPdive + TinyFish) is now explicitly **planned, not
  implemented**; B-class watcher/scheduler described as a library API that is not
  auto-started; Node badge -> >=22.6. ROADMAP.md ClawHub items marked done.

## [2.0.5] - 2026-08-28

**README rebuild (EN/zh top-level language switch, docker→host remote-CUA + web-search sections, env sample).**

### Added

- Top-level English/Chinese language switch (mirrors the ODSH-Bridge for Docker README) plus badges, TOC, and richer sections.
- New Docker → host desktop (remote CUA) section: host prerequisites (cua-driver + cua-computer-server), container-side options (CUA_REMOTE env or OpenClaw mcp set cua-driver streamable-http), security note (no built-in token).
- New Web search (SERPdive + TinyFish, smart selection) **documentation only** — the plugin
  ships **no implementation yet** (status: planned; keys reserved in `.env.example`).
- .env.example: CUA_REMOTE, SERPDIVE_API_KEY, TINYFISH_API_KEY.

### Changed

- README.md / README.zh.md restructured to match the ODSH-Bridge format.

## [2.0.4] - 2026-08-28
All notable changes to ODSH-Native are documented here. Format: Keep a Changelog.

## [2.0.4] - 2026-08-28

**Optional remote CUA mode (docker → host desktop via cua-computer-server).**

### Added

- `CUA_REMOTE` env selects a **remote** CUA backend: `odsh.cua` and `odsh.visual` now talk to a `cua-computer-server` over HTTP (`POST /cmd`, SSE) when set, e.g. `CUA_REMOTE=http://host.docker.internal:8000`. Empty keeps the local `cua-driver` path (host install, simplest).
- `odsh.visual` no-path capture works in remote mode too: fetches `get_desktop_state`, persists base64 images under `<tmpdir>/odsh-visual/`, then runs local OCR.
- Remote mode is fail-closed: http(s)-only URL, tool/key whitelist, remote failures surface as `{ok:false}`.
- Tests: `tests/cua.test.mjs` covers remote/local selection, invalid URL, bad argv key, unreachable remote, and local invalid-tool rejection (each in a subprocess to pick up env per-mode).

### Changed

- docs/CUA-EXECUTION (EN+zh) documents both modes incl. the OpenClaw `mcp set` option and a host-side computer-server launch snippet.

## [2.0.3] - 2026-08-28

**Fix: dist entry now carries the OpenClaw plugin contract (register) — plugin is loadable-capability again.**

### Fixed

- `scripts/build.mjs` previously emitted a hand-written `createPlugin` entry into `dist/index.js`, which OpenClaw loads as `runtimeExtensions` and rejected as **non-capability** (`missing register/activate export`). The four agent tools therefore did not register on install.
- Now `build.mjs` re-emits `src/index.ts` (the `defineToolPlugin` product) with only the import paths remapped (`./runtime` / `./services` → `../src/runtime` / `../src/services`), so `dist/index.js` carries `id/name/description/configSchema/register` — matching the load contract.
- Added `tests/plugin-load.test.mjs::t_dist_entry_matches_contract` asserting `dist/index.js` registers all 4 tools, guarding against regression.

## [2.0.2] - 2026-08-28

**Published to ClawHub; docs polish; security-scan consent.**

### Added

- **ClawHub install option** in README (EN + zh): `openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk`. Package published to ClawHub as `odsh-native`.
- docs/INTEGRATIONS updated to reflect the plugin is published (was "future / not yet published").

### Changed

- Reworked README.md / README.zh.md for readability (feature table, emoji section headers, docs table, risk-note for the ClawHub trust flag).
- `package.json` / `openclaw.plugin.json` version bump 2.0.1 → 2.0.2.

### Fixed

- security.test.mjs: strip the authorized public `github.com/mikoribbit/odsh-bridge` upstream URL before the identifier scan, so a link to the public upstream repo is not misread as a leaked handle.

## [2.0.1] - 2026-08-28

**Hardening round: audit-driven bug fixes, path/safety hardening, docs sync.**

### Fixed

- `runtime/visual.mjs` no longer fabricates a screenshot path when capturing via `cua-driver`: it reuses a stable scratch dir and verifies an image actually exists before returning `ok:true` (was returning a non-existent `desktop.png` and leaking one temp dir per call).
- `runtime/exec.mjs` returns `{ok:false}` for a missing `cmd` instead of throwing a raw exception (consistent fail-closed convention).
- `runtime/cua.mjs` now forwards `args` as `--key value` (keys whitelisted) instead of silently dropping them; empty/invalid tool returns `{ok:false}`.
- `registry.mjs` fail-closed containment: a plugin `impl` that resolves outside `pluginsDir` (`../` traversal / arbitrary import) is skipped with a warning.
- `runtime/dsh-worker.mjs` internal no-command mode reports `{ok:false}` truthfully (was a fake echo that claimed to "execute a DSH task"); remote mode now sends an optional `DSH_WORKER_TOKEN` Bearer header.

### Changed

- `scripts/build.mjs` uses `path.join` instead of hard-coded `/` separators (cross-platform).
- Docs synced to reality: `odsh.visual` is a real local-OCR backend (not a stub); README/OPERATIONS security wording now says "shell-free execFile" instead of the inaccurate "argv allowlist".
- `.env.example` / `docs/CONFIGURATION` document `DSH_WORKER_TOKEN`.

### Tests

- Added `registry.test.mjs::t_blocks_traversal_impl` regression; updated `dsh-worker.test.mjs::t_serve_no_cmd` to assert the truthful `ok:false`.

## [2.0.0] - 2026-08-28

**Rebundle: a native OpenClaw plugin.**

### Changed

- Repositioned ODSH-Native from a standalone bridge + self-built registry into a **real OpenClaw plugin** using the official `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` contract.
- `src/index.ts` now registers A-class agent tools (`odsh.exec` / `odsh.cua` / `odsh.visual` / `odsh.serve`) under the real SDK; B-class resident services (watcher / scheduler / DSH worker bridge) live in `src/services` & `src/runtime`.
- `openclaw` moved to a **peer dependency** (host-provided) instead of a bundled runtime. Validation installs it with `--no-save`.

### Added (docs / hygiene)
- Bilingual README (`README.md` / `README.zh.md`) matching the ODSH-Bridge documentation style; split `docs/` (QUICKSTART / CONFIGURATION / INTEGRATIONS / OPERATIONS / CUA-EXECUTION / ARCHITECTURE-v2), each with a `.zh.md`.
- `AUTHORS.md`, `.gitignore`, `.env.example` (bilingual).
- `tests/security.test.mjs` privacy/secret scan wired into `npm test`.

### Fixed / Verified
- Real-SDK plugin load verified: registers 4 tools and executes `odsh.exec` round-trip under `openclaw@2026.7.1-2`.
- Cross-platform `check`/`test` via `--experimental-strip-types`; skip graph when the peer `openclaw` is absent.

## [0.1.0] - earlier

- Init; skeleton; gateway self-contained Ed25519; host-win plugin-load fix; first v2 plugin skeleton (A+B classes).