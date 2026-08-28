# ODSH-Native
### DeepSeek Harness capabilities, delivered as a native OpenClaw plugin

> **[ClawHub](https://clawhub.ai): `odsh-native`** · _source-linked · pluginApi ≥ 2026.3.24-beta_ · _owner: see ClawHub_

ODSH-Native rebundles the [ODSH-Bridge](https://github.com/Mikoribbit/odsh-bridge) idea into an **open-source OpenClaw plugin**. Instead of wiring two containers and a file-envelope bridge, it packages DeepSeek Harness (DSH) execution and a plugin/capability surface as a first-class OpenClaw agent tool plane — **no second LLM, no Windows-Node + SSH bridge, no Docker requirement.**

---

## ✨ Features

| | Capability |
|---|---|
| 🖥️ **A-class agent tools** | `odsh.exec` · `odsh.cua` · `odsh.visual` · `odsh.serve` — registered as native OpenClaw agent tools |
| 🔄 **B-class resident services** | auto-watch (`services/watcher.mjs`) + scheduling (`services/scheduler.mjs`) hosted by the plugin lifecycle |
| 🧩 **DSH Harness hosting** | `odsh.serve` + `runtime/dsh-worker.mjs` bridge (local subprocess, or remote over HTTP to a DSH/Cordis worker) |
| 🧹 **Clean sub-agent** | reuses OpenClaw native `agent exec` / `sessions_spawn` — no second LLM, no persona/memory for ad-hoc tasks |

---

## 🚀 Install from ClawHub

The plugin is published to ClawHub and available to any OpenClaw instance:

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

Then on the OpenClaw UI, open **`/tools`** and confirm `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve` are listed.

> **Why the risk flag?** Release-scan marks `suspicious` because this is a high-privilege
> **local exec + desktop-control** plugin by design — it lands `odsh.exec` (shell-free),
> a desktop capture path, and an optional remote worker call. The plugin itself stays
> fail-closed (no shell, tool whitelist, path containment); acknowledge the trust flag
> only after a quick source review.

---

## 🔧 Install from source (developers)

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

## 🧭 Documentation

| Doc | Purpose |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | First run & install |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | Design & capability boundaries |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | `.env` & plugin config |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | Install into OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | Desktop / vision via cua-driver |
| [docs/OPERATIONS](docs/OPERATIONS.md) | Ops, security, troubleshooting |

---

## 🛡️ Design & security

- **Native plugin, not a bridge runtime.** Official `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` contract — no self-built registry-as-runtime.
- **`openclaw` is a peer dependency** — provided by the host OpenClaw, never bundled.
- **TypeScript/ESM entry** (`src/index.ts`) + plain-ESM runtime (`src/runtime/*.mjs`) — runs with no TS build chain.
- **Fail-closed by default:** shell-free `execFile`, tool-name whitelist, registry path-containment, optional remote-worker Bearer auth, no real tokens committed, and `tests/security.test.mjs` blocks tracked personal identifiers & secrets. See docs/OPERATIONS §Security.

---

## 📦 Roadmap & keep in sync

- Roadmap: [ROADMAP.md](ROADMAP.md)
- Changes: [CHANGELOG.md](CHANGELOG.md) · Maintainers: [MAINTENANCE.md](MAINTENANCE.md)

---

## License & credits

- **License:** MIT — see [LICENSE](LICENSE).
- Built on **OpenClaw** (plugin SDK, `agent exec`, session-spawn).
- Desktop/vision via **[cua-driver](https://github.com/trycua/cua)** — `odsh.cua` spawns it locally, no focus steal.

---

_English is the primary language; a Chinese translation lives at [README.zh.md](README.zh.md)._
