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
> odsh.visual), DSH-worker dispatch (odsh.serve), a standalone DSH-style plugin registry — alongside the **native
> OpenClaw plugin** (official SDK contract).
> Runs inside the OpenClaw host process, with local execution and optional remote desktop/worker backends.

> Published on **ClawHub**: `odsh-native` (community, source-linked, pluginApi ≥ 2026.3.24-beta.2).

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
- **Control the desktop** with `odsh.cua` — click, type, browse via cua-driver, focus behavior depends on the backend and command.
- **Understand screens / images** with `odsh.visual` — local OCR via tesseract, or a live frame from local cua-driver / remote computer-server.
- **Dispatch work to a DSH / Cordis worker** with `odsh.serve` (local subprocess or remote HTTP).
- **Discover DSH-style tool plugins** with the standalone registry (`npm run tools`). These are separate from native OpenClaw tool registration.
- B-class watcher/scheduler helpers exist as a library API (`startResidentServices`) but are **not auto-started** by the plugin yet — see the Roadmap.

ODSH-Native rebundles the idea of the upstream [ODSH-Bridge](https://github.com/Mikoribbit/odsh-bridge)
project as an open-source OpenClaw plugin: DeepSeek Harness execution + plugin/capability surface as
first-class agent tool plane.

---

## Install from ClawHub

Published on ClawHub as `odsh-native`:

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

Then open **`/tools`** in the OpenClaw UI and confirm `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve`, `odsh.lease` are listed; the lease tool requires its mode to be enabled.

> Review the source and permissions before acknowledging the ClawHub risk flag. Commands and desktop operations use host process permissions; shell-free execution is not a sandbox.

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

Install the complete plugin directory; see [integrations](docs/INTEGRATIONS.md) and [quickstart](docs/QUICKSTART.md).

---

## Docker → host desktop (remote CUA)

When **OpenClaw runs in a container** but the real desktop lives on the Windows/macOS **host**, point
the plugin at a `cua-computer-server` on the host. This is optional — with `CUA_REMOTE` empty the
plugin keeps using a **local** `cua-driver` (simplest for host installs).

### Setup

Run a compatible computer-server in the host interactive desktop session. Restrict its HTTP port to trusted clients, set CUA_REMOTE in the OpenClaw service/container environment, and restart that process. The plugin uses POST /cmd with SSE responses; capture tries get_desktop_state, then screenshot. See [desktop setup and protocol](docs/CUA-EXECUTION.md).

---

## Documentation

| Doc | Purpose |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | First run & install |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | Design & capability boundaries |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | `.env` & plugin config |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | Install into OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | Desktop / vision via cua-driver |
| [docs/LEASES](docs/LEASES.md) | Desktop task coordination and recovery |
| [docs/OPERATIONS](docs/OPERATIONS.md) | Ops, security, troubleshooting |

---

## Design & security

- **Native plugin, not a bridge runtime.** Official `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` contract — no self-built registry-as-runtime.
- **`openclaw` is a peer dependency** — provided by the host OpenClaw, never bundled.
- **TypeScript/ESM entry** (`src/index.ts`) + plain-ESM runtime (`src/runtime/*.mjs`) — runs with no TS build chain.
- **Fail-closed by default:** shell-free `execFile`, tool-name format checks, http(s)-only `CUA_REMOTE`, path-containment + symlink-escape rejection in the registry, optional remote-worker Bearer auth. Input/path checks are not command authorization; see [operations](docs/OPERATIONS.md).

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

## Desktop task leases

Optional `ODSH_LEASE_MODE=single-process` requires task credentials for CUA/visual; default off is compatible. Single-process only; uncertain in-flight work is quarantined, never automatically taken over. See [configuration, workflow and limits](docs/LEASES.md).
