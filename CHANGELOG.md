# Changelog

All notable changes to ODSH-Native are documented here. Format: Keep a Changelog.

## [2.0.5] - 2026-08-28

**README rebuild (EN/zh top-level language switch, docker→host remote-CUA + web-search sections, env sample).**

### Added

- Top-level English/Chinese language switch (mirrors the ODSH-Bridge for Docker README) plus badges, TOC, and richer sections.
- New Docker → host desktop (remote CUA) section: host prerequisites (cua-driver + cua-computer-server), container-side options (CUA_REMOTE env or OpenClaw mcp set cua-driver streamable-http), security note (no built-in token).
- New Web search (SERPdive + TinyFish, smart selection) section: engine table, selection rule (SERPdive for answers, TinyFish Search for raw results, TinyFish Fetch for full pages), one-line curl wiring, both free.
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