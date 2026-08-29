# ODSH-Native — DeepSeek Harness capabilities as a native OpenClaw plugin

<div align="center">

[**English**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.md) ·
[**中文**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.zh.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D22.6-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-plugin-blue.svg)
![ClawHub](https://img.shields.io/badge/ClawHub-odsh--native-8a2be2.svg)

</div>

> **One-line positioning**: turns your OpenClaw agent into a **DeepSeek Harness (DSH) execution
> plane** — real local commands (odsh.exec), desktop control & screenshots (odsh.cua /
> odsh.visual), DSH-worker dispatch (odsh.serve), DSH-style tool plugins — as a **native
> OpenClaw plugin** (official SDK contract).
> No second LLM, no Windows-Node + SSH bridge, no Docker requirement — just `openclaw plugins install clawhub:odsh-native`.

> Published on **ClawHub**: `odsh-native` (community, source-linked, pluginApi ≥ 2026.3.24-beta).

---

## Table of contents

- [What it does](#what-it-does)
- [Install from ClawHub](#install-from-clawhub)
- [Install from source (developers)](#install-from-source-developers)
- [Docker → host desktop (remote CUA)](#docker--host-desktop-remote-cua)
- [Documentation](#documentation)
- [Design & security](#design--security)
- [Roadmap & keep in sync](#roadmap--keep-in-sync)
- [License & credits](#license--credits)

---

## What it does

- **Run real commands** on the host via `odsh.exec` (shell-free, fail-closed).
- **Control the desktop** with `odsh.cua` — click, type, browse via cua-driver, no focus steal.
- **Understand screens / images** with `odsh.visual` — local OCR via tesseract, or a live frame from local cua-driver / remote computer-server.
- **Dispatch work to a DSH / Cordis worker** with `odsh.serve` (local subprocess or remote HTTP).
- **Add DSH-style tool plugins** (auto-discovered from `plugins/` via the fail-closed registry).
- B-class watcher/scheduler helpers exist as a library API (`startResidentServices`) but are **not auto-started** by the plugin yet — see the Roadmap.

ODSH-Native rebundles the idea of the upstream [ODSH-Bridge](https://github.com/Mikoribbit/odsh-bridge)
project as an open-source OpenClaw plugin: DeepSeek Harness execution + plugin/capability surface as
first-class agent tool plane — **no second LLM, no Windows-Node + SSH bridge, no Docker requirement.**

---

## Install from ClawHub

Published on ClawHub as `odsh-native`:

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

Then open **`/tools`** in the OpenClaw UI and confirm `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve` are listed.

> **Why the risk flag?** Release-scan marks `suspicious` because this is a high-privilege
> **local exec + desktop-control** plugin by design — it lands `odsh.exec` (shell-free),
> a desktop capture path, and an optional remote worker call. The plugin stays
> fail-closed (no shell, tool-name format checks, path containment); acknowledge the trust flag
> only after a quick source review.

---

## Install from source (developers)

```bash
git clone https://github.com/rm-Vstar/ODSH-Native.git
cd ODSH-Native

# local validation (host OpenClaw provides the `openclaw` peer at runtime)
npm install
npm run check && npm test
node scripts/build.mjs            # -> dist/index.js
```

Plop the plugin folder into OpenClaw's plugin root and register it; see **docs/INTEGRATIONS** and **docs/QUICKSTART**.

---

## Docker → host desktop (remote CUA)

When **OpenClaw runs in a container** but the real desktop lives on the Windows/macOS **host**, point
the plugin at a `cua-computer-server` on the host. This is optional — with `CUA_REMOTE` empty the
plugin keeps using a **local** `cua-driver` (simplest for host installs).

### Prerequisites (host side, one-time) — a port must be open

Remote CUA needs a `cua-computer-server` running on the host with its HTTP port (default
`8000`) reachable from the container. **No server → `odsh.cua`/`odsh.visual` answer
`{ok:false, error:"fetch failed"}`**; `CUA_REMOTE` alone is not enough.

1. Start the server in an interactive host session — **PyPI `cua-computer-server` 0.1.25**
   (verified 2026-08; speaks the exact `POST /cmd` + SSE protocol; **no `[driver]` extra**):
```powershell
pip install cua-computer-server
python -m computer_server --host 0.0.0.0 --port 8000
```
   > The GitHub-mainline flags (`--backend cua-driver --capture-scope desktop` and the
   > `[driver]` extra) are **trycua 主线 only** — PyPI 0.1.25 rejects them. `--host 0.0.0.0` is
   > required so the container can reach the port. `No module named 'win32api'` on Windows is a
   > harmless warning (`pip install pywin32` silences it).
2. Sanity-check it: `curl http://localhost:8000/status` → `{"status":"ok",...}`.

### Container side — pick one

**Option A — via the plugin (`CUA_REMOTE`)**:

```env
CUA_REMOTE=http://host.docker.internal:8000
```

⚠️ **A full container restart is required after setting it** — gateway hot-reload does not
re-read the environment, so the plugin keeps trying local mode (`spawn cua-driver ENOENT`).

`odsh.cua` and `odsh.visual` (no-path capture) then talk to the host desktop over
`POST /cmd` (SSE); `odsh.visual` keeps frames in `/dev/shm/odsh-visual` on Linux (in-RAM, no
persistent-disk writes; override via `ODSH_VISUAL_DIR`) and OCR-fast-paths them with tesseract
when installed (returns `text` in one shot, no external vision model). The capture probes
`get_desktop_state` (trycua 主线) first and falls back to `screenshot` (PyPI 0.1.25).

**Option B — via OpenClaw native MCP (no plugin code needed)**:

```bash
openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
```

> **Note:** `cua-computer-server` has **no built-in token**. Bind it to loopback or firewall to
> your docker subnet (or wrap in SSH) before exposing it beyond the host.

---

## Documentation

| Doc | Purpose |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | First run & install |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | Design & capability boundaries |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | `.env` & plugin config |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | Install into OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | Desktop / vision via cua-driver |
| [docs/OPERATIONS](docs/OPERATIONS.md) | Ops, security, troubleshooting |

---

## Design & security

- **Native plugin, not a bridge runtime.** Official `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` contract — no self-built registry-as-runtime.
- **`openclaw` is a peer dependency** — provided by the host OpenClaw, never bundled.
- **TypeScript/ESM entry** (`src/index.ts`) + plain-ESM runtime (`src/runtime/*.mjs`) — runs with no TS build chain.
- **Fail-closed by default:** shell-free `execFile`, tool-name format checks, http(s)-only `CUA_REMOTE`, path-containment + symlink-escape rejection in the registry, optional remote-worker Bearer auth, no real tokens committed, and `tests/security.test.mjs` blocks tracked personal identifiers & secrets. See docs/OPERATIONS §Security.

---

## Roadmap & keep in sync

- Roadmap: [ROADMAP.md](ROADMAP.md)
- Changes: [CHANGELOG.md](CHANGELOG.md) · Maintainers: [MAINTENANCE.md](MAINTENANCE.md)

---

## License & credits

- **License:** MIT — see [LICENSE](LICENSE).
- Built on **OpenClaw** (plugin SDK, `agent exec`, session-spawn).
- Desktop/vision via **[cua-driver](https://github.com/trycua/cua)** — `odsh.cua` spawns it locally, no focus steal; remote mode via **cua-computer-server**.

---

_English is the primary language; a Chinese translation lives at [README.zh.md](README.zh.md)._
