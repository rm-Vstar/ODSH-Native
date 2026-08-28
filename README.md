# ODSH-Native — DeepSeek Harness capabilities as an OpenClaw plugin

> ODSH-Native is a host-side re-bundle of the ODSH-Bridge idea: instead of wiring
> two containers and a file-envelope bridge, it packages **DeepSeek Harness (DSH)**
> execution and plugin/capability surface as a *native OpenClaw plugin* — no second
> LLM, no Windows-Node + SSH bridge, no Docker requirement.

## What it does

- **A-class agent tools** — `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve` registered as first-class OpenClaw agent tools.
- **B-class resident services** — auto-watch (`services/watcher.mjs`) and scheduling (`services/scheduler.mjs`) hosted by the plugin lifecycle.
- **DSH Harness hosting** — `odsh.serve` + `runtime/dsh-worker.mjs` bridge (internal local subprocess, or remote against an HTTP DSH/Cordis worker).
- **Clean sub-agent** — reuses OpenClaw native `agent exec` / `sessions_spawn` (no second LLM, no persona/memory for ad-hoc tasks).

## Design decisions

- **Native plugin, not a bridge runtime.** Uses the official `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` contract; no self-built registry-as-runtime.
- **openclaw is a peer dependency** — provided by the host OpenClaw, not bundled.
- **Language** — TypeScript/ESM plugin entry (`src/index.ts`); runtime tool logic in plain ESM (`src/runtime/*.mjs`) so it runs without a TS build chain.

## Getting started (see docs/QUICKSTART)

```bash
# 1. install the plugin peer SDK for local validation (host OpenClaw provides it at runtime)
npm install --no-save openclaw@2026.7.1-2

# 2. syntax check / tests / build
npm run check
npm test
node scripts/build.mjs            # -> dist/index.js (OpenClaw runtimeExtensions artifact)

# 3. install the plugin into OpenClaw and verify via /tools (see docs/INTEGRATIONS)
```

## Documentation (split)

- **docs/QUICKSTART** — first run & install
- **docs/CONFIGURATION** — .env & plugin config
- **docs/ARCHITECTURE-v2** — design & capabilities
- **docs/INTEGRATIONS** — installing into OpenClaw / ClawHub
- **docs/OPERATIONS** — ops, security, troubleshooting
- **docs/CUA-EXECUTION** — desktop/vision via cua-driver

## Security

Fail-closed by design (inherited from ODSH-Bridge): shell-free `execFile` (no shell) in `exec.mjs`, tool-name whitelists, path-containment in the registry, optional Bearer auth for the remote worker, no real tokens committed, and `tests/security.test.mjs` blocks tracked personal identifiers / secrets. See docs/OPERATIONS §Security.

## License

MIT — see LICENSE.

## Credits

- Built on **OpenClaw** (plugin SDK, `agent exec`, session-spawn).
- Desktop/vision: **cua-driver** (trycua/cua) — `odsh.cua` just spawns it locally.

---

_English is the primary language; a Chinese translation is at [README.zh.md](README.zh.md)._ &nbsp; Roadmap: [ROADMAP.md](ROADMAP.md)