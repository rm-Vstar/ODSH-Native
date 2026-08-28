# ODSH-Native — DeepSeek Harness capabilities as a native OpenClaw plugin

<div align="center">

[**English**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.md) ·
[**中文**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.zh.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D18-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-plugin-blue.svg)
![ClawHub](https://img.shields.io/badge/ClawHub-odsh--native-8a2be2.svg)

</div>

> **One-line positioning**: turns your OpenClaw agent into a **DeepSeek Harness (DSH) execution
> plane** — real local commands (odsh.exec), desktop control & screenshots (odsh.cua /
> odsh.visual), DSH-worker dispatch (odsh.serve), DSH-style tool plugins, and resident
> watcher/scheduler services — as a **native OpenClaw plugin** (official SDK contract).
> No second LLM, no Windows-Node + SSH bridge, no Docker requirement — just `openclaw plugins install clawhub:odsh-native`.

> Published on **ClawHub**: `odsh-native` (community, source-linked, pluginApi ≥ 2026.3.24-beta).

---

## Table of contents

- [What it does](#what-it-does)
- [Install from ClawHub](#install-from-clawhub)
- [Install from source (developers)](#install-from-source-developers)
- [Docker → host desktop (remote CUA)](#docker--host-desktop-remote-cua)
- [Web search (SERPdive + TinyFish, smart selection)](#web-search-serpdive--tinyfish-smart-selection)
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
- **Add DSH-style tool plugins** and run **resident watcher / scheduler** services.

ODSH-Native rebundles the [ODSH-Bridge](https://github.com/Mikoribbit/odsh-bridge) idea as an
open-source OpenClaw plugin: DeepSeek Harness execution + plugin/capability surface as first-class
agent tool plane — **no second LLM, no Windows-Node + SSH bridge, no Docker requirement.**

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
> fail-closed (no shell, tool whitelist, path containment); acknowledge the trust flag
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

### Prerequisites (host side, one-time)

1. Install cua-driver (https://github.com/trycua/cua), Windows PowerShell:
```powershell
irm https://cua.ai/driver/install.ps1 | iex
```
2. Start the official computer-server exposing cua-driver (interactive session):
```powershell
pip install "cua-computer-server[driver]"
python -m computer_server --backend cua-driver --capture-scope desktop --host 0.0.0.0 --port 8000
```

### Container side — pick one

**Option A — via the plugin (`CUA_REMOTE`)**:

```env
CUA_REMOTE=http://host.docker.internal:8000
```

`odsh.cua` and `odsh.visual` (no-path capture) then talk to the host desktop over
`POST /cmd` (SSE); screenshots persist to `<tmpdir>/odsh-visual/`.

**Option B — via OpenClaw native MCP (no plugin code needed)**:

```bash
openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
```

> **Note:** `cua-computer-server` has **no built-in token**. Bind it to loopback or firewall to
> your docker subnet (or wrap in SSH) before exposing it beyond the host.

---

## Web search (SERPdive + TinyFish, smart selection)

**ODSH-Native pairs two free web engines and picks per request:**

| Engine | Strengths | When selected |
|---|---|---|
| **SERPdive** (serpdive.com) | "search-as-answer": one call returns distilled, LLM-ready answers (`answer` + per-source `content`) | Q&A / research-style queries that need an answer, not just links |
| **TinyFish** (tinyfish.ai) | ranked search + **JS-rendered fetch** of full page bodies (markdown) | Raw content, SPA/JS-heavy pages, or when you need full page text |

**How it selects:** a thin router tries SERPdive first for answer-style queries; falls back to
TinyFish Search when a query needs raw results, and TinyFish Fetch when the caller wants full page
bodies (`urls[]`). Both are free at low volume (SERPdive: 1000 credits/mo incl. the free `krill`
model; TinyFish: Search & Fetch free even at $0). No DeepSeek web-search balance is required.

**Wire it up** (each is a one-liner):

```bash
# SERPdive — search-as-answer (Bearer sd_live_…)
curl -X POST https://api.serpdive.com/v1/search -H "Authorization: Bearer $SERPDIVE_KEY" -H "Content-Type: application/json" -d '{"query":"...","model":"mako"}'
# TinyFish — search (free, X-API-Key)
curl "https://api.search.tinyfish.ai?query=..." -H "X-API-Key: $TINYFISH_API_KEY"
# TinyFish — fetch full page (free, JS rendering)
curl -X POST https://api.fetch.tinyfish.ai -H "X-API-Key: $TINYFISH_API_KEY" -H "Content-Type: application/json" -d '{"urls":["https://example.com"],"format":"markdown","ttl":0}'
```

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
- **Fail-closed by default:** shell-free `execFile`, tool-name whitelist, http(s)-only `CUA_REMOTE`, path-containment in the registry, optional remote-worker Bearer auth, no real tokens committed, and `tests/security.test.mjs` blocks tracked personal identifiers & secrets. See docs/OPERATIONS §Security.

---

## Roadmap & keep in sync

- Roadmap: [ROADMAP.md](ROADMAP.md)
- Changes: [CHANGELOG.md](CHANGELOG.md) · Maintainers: [MAINTENANCE.md](MAINTENANCE.md)

---

## License & credits

- **License:** MIT — see [LICENSE](LICENSE).
- Built on **OpenClaw** (plugin SDK, `agent exec`, session-spawn).
- Desktop/vision via **[cua-driver](https://github.com/trycua/cua)** — `odsh.cua` spawns it locally, no focus steal; remote mode via **cua-computer-server**.
- Web search via **[SERPdive](https://serpdive.com)** + **[TinyFish](https://tinyfish.ai)**.

---

_English is the primary language; a Chinese translation lives at [README.zh.md](README.zh.md)._
