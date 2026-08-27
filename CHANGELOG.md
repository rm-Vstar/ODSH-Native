# Changelog

All notable changes to ODSH-Native are documented here. Format: Keep a Changelog.

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