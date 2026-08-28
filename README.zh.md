# ODSH-Native
### 将 DeepSeek Harness 能力，打包为一个原生 OpenClaw 插件

> **[ClawHub](https://clawhub.ai)：`odsh-native`** · _source-linked · pluginApi ≥ 2026.3.24-beta_ · _属主：见 ClawHub_

**[ClawHub 安装](#-从-clawhub-安装) · [源码安装](#-从源码安装开发者) · [文档](#-文档)**

**它能做什么** — ODSH-Native 把你的 OpenClaw agent 变成一个 **DeepSeek Harness（DSH）执行平面**：

- 通过 `odsh.exec` 在宿主上**执行真实命令**（无 shell、fail-closed）。
- 通过 `odsh.cua` **控制桌面**——点击、输入、浏览器（基于 `cua-driver`，不抢焦点）。
- 通过 `odsh.visual` **理解屏幕/图片**——基于 tesseract 的本地 OCR。
- 通过 `odsh.serve` 把任务**派发给 DSH/Cordis worker**（本地子进程或远程 HTTP）。
- **挂载 DSH 风格工具插件**，并运行**常驻 watcher/scheduler** 服务。

无需第二 LLM、无需 Windows-Node + SSH 桥、无需 Docker——只是一个 OpenClaw 插件。

ODSH-Native 把 [ODSH-Bridge](https://github.com/Mikoribbit/odsh-bridge) 的思路重打包为一个**开源 OpenClaw 插件**。不再需要两个容器 + 文件信封桥，而是把 DeepSeek Harness（DSH）的执行能力与插件/能力面，做成 OpenClaw 的**一等 agent 工具平面**——**无需第二个 LLM、无需 Windows-Node + SSH 桥、无需 Docker。**

---

## ✨ 能力一览

| | 能力 |
|---|---|
| 🖥️ **A 类（可执行 agent-tool）** | `odsh.exec` · `odsh.cua` · `odsh.visual` · `odsh.serve`，注册为原生 OpenClaw agent 工具 |
| 🔄 **B 类（常驻服务）** | 自动监听（`services/watcher.mjs`）+ 定时（`services/scheduler.mjs`），由插件生命周期托管 |
| 🧩 **承载 DSH Harness** | `odsh.serve` + `runtime/dsh-worker.mjs` 桥（本地子进程 internal，或 HTTP remote 指向 DSH/Cordis worker） |
| 🧹 **干净 sub-agent** | 复用 OpenClaw 原生 `agent exec` / `sessions_spawn`；临时任务无需第二 LLM、无 persona/记忆 |

---

## 🚀 从 ClawHub 安装

插件已发布到 ClawHub，任何 OpenClaw 实例都可安装：

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

装完在 OpenClaw 界面打开 **`/tools`**，确认列出 `odsh.exec`、`odsh.cua`、`odsh.visual`、`odsh.serve`。

> **为什么要 --acknowledge-clawhub-risk？** 发布安全扫描把本项目标为 `suspicious`，
> 因为它本质上是一个**本地执行 + 桌面控制**的高权限插件——含 `odsh.exec`（无 shell）、
> 桌面截图路径、以及可选的远程 worker 调用。插件自身保持 fail-closed（无 shell、
> 工具白名单、路径遏制）；勾选信任标记前建议快速过一遍源码。

---

## 🔧 从源码安装（开发者）

```bash
git clone https://github.com/rm-Vstar/ODSH-Native.git
cd ODSH-Native

# 本地验证（运行时由宿主 OpenClaw 提供 `openclaw` peer）
npm install
npm run check && npm test
node scripts/build.mjs            # -> dist/index.js
```

把插件目录放进 OpenClaw 插件根并注册；详见 **docs/INTEGRATIONS** 与 **docs/QUICKSTART**。

---

## 🧭 文档

| 文档 | 用途 |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | 首次运行与安装 |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | 设计与能力边界 |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | `.env` 与插件配置 |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | 安装到 OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | 通过 cua-driver 的桌面/视觉 |
| [docs/OPERATIONS](docs/OPERATIONS.md) | 运维、安全、排障 |

---

## 🛡️ 设计与安全

- **原生插件，而非桥运行时**：官方 `openclaw/plugin-sdk/tool-plugin` `defineToolPlugin` 契约——不自建"第二运行时"。
- **`openclaw` 是 peer 依赖**：由宿主 OpenClaw 提供，绝不打包。
- **TypeScript/ESM 入口**（`src/index.ts`）+ 纯 ESM 运行时（`src/runtime/*.mjs`）——无需 TS 构建链即可运行。
- **默认 fail-closed**：无 shell 的 `execFile`、工具名白名单、插件加载路径遏制、远程 worker 可选 Bearer 鉴权、不提交真实 token、`tests/security.test.mjs` 拦截被跟踪的个人标识符与密钥。见 docs/OPERATIONS §安全。

---

## 📦 路线图与版本

- 路线图：[ROADMAP.md](ROADMAP.md)
- 变更：[CHANGELOG.md](CHANGELOG.md) · 维护：[MAINTENANCE.md](MAINTENANCE.md)

---

## 许可与致谢

- **许可：** MIT — 见 [LICENSE](LICENSE)。
- 基于 **OpenClaw**（插件 SDK、`agent exec`、会话派生）。
- 桌面/视觉基于 **[cua-driver](https://github.com/trycua/cua)**——`odsh.cua` 本地 spawn 它，不抢焦点。

---

_中文译本；英文为主：[README.md](README.md)。_
