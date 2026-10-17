# ODSH-Native — 将 DeepSeek Harness 能力打包为一个原生 OpenClaw 插件

<div align="center">

[**中文**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.zh.md) ·
[**English**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D22.6-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-%E6%8F%92%E4%BB%B6-blue.svg)
![ClawHub](https://img.shields.io/badge/ClawHub-odsh--native-8a2be2.svg)

</div>

> **一句话定位**：把你的 OpenClaw agent 变成一个 **DeepSeek Harness（DSH）执行平面**——真实本地命令（odsh.exec）、桌面控制与截图（odsh.cua / odsh.visual）、DSH worker 派发（odsh.serve）、原生工具通过**OpenClaw 插件**（官方 SDK 契约）提供，DSH 风格插件注册表为独立辅助能力。运行于 OpenClaw 宿主进程，支持本地执行及可选的远程桌面/worker 后端。
>
> 注意：常驻 watcher/scheduler 以库 API（`startResidentServices`）提供，插件安装时**不自动启动**（见路线图）。

> 已发布到 **ClawHub**：odsh-native（community、source-linked、pluginApi ≥ 2026.3.24-beta.2）。

---

## 目录

- [它能做什么](#它能做什么)
- [从 ClawHub 安装](#从-clawhub-安装)
- [从源码安装（开发者）](#从源码安装开发者)
- [Docker → 宿主桌面（远程 CUA）](#docker--宿主桌面远程-cua)
- [文档](#文档)
- [设计与安全](#设计与安全)
- [路线图与版本](#路线图与版本)
- [许可与致谢](#许可与致谢)

---

## 它能做什么

- 通过 `odsh.exec` 在宿主上**执行真实命令**（无 shell、fail-closed）。
- 通过 `odsh.cua` **控制桌面**——点击、输入、浏览器（基于 cua-driver，焦点行为取决于后端与命令）。
- 通过 `odsh.visual` **理解屏幕/图片**——本地 OCR（tesseract），或来自本地 cua-driver / 远程 computer-server 的实时桌面帧。
- 通过 `odsh.serve` 把任务**派发给 DSH/Cordis worker**（本地子进程或远程 HTTP）。
- 通过独立注册表发现 DSH 风格工具插件（`npm run tools`）；这些工具与原生 OpenClaw 工具注册分开。
- B 类 watcher/scheduler 以库 API（`startResidentServices`）提供，插件安装时**不自动启动**——见路线图。

ODSH-Native 把 ODSH-Bridge 的思路重打包为开源 OpenClaw 插件：DSH 执行 + 插件/能力面，做成 OpenClaw 一等 agent 工具平面。

---

## 从 ClawHub 安装

插件已发布到 ClawHub（odsh-native）：

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

装完在 OpenClaw 界面打开 **`/tools`**，确认列出 odsh.exec、odsh.cua、odsh.visual、odsh.serve、odsh.lease；租约工具在启用对应模式后可用。

> 确认 ClawHub 风险标记前请审阅源码与权限。命令及桌面操作使用宿主进程权限；无 shell 执行并非沙箱。

---

## 从源码安装（开发者）

```bash
git clone https://github.com/rm-Vstar/ODSH-Native.git
cd ODSH-Native

# 本地验证（运行时由宿主 OpenClaw 提供 openclaw peer）
npm install
npm run check && npm test
node scripts/build.mjs            # -> dist/index.js
```

安装完整插件目录；详见[集成](docs/INTEGRATIONS.zh.md)和[快速开始](docs/QUICKSTART.zh.md)。

---

## Docker → 宿主桌面（远程 CUA）

当 **OpenClaw 跑在容器里**、而真实桌面在 Windows/macOS **宿主**上时，把插件指向宿主上的 `cua-computer-server`。这是**可选项**——`CUA_REMOTE` 为空时插件继续用**本地** `cua-driver`（宿主安装最简）。

### 设置

在宿主交互桌面会话中运行兼容的 computer-server，仅向可信客户端开放 HTTP 端口。在 OpenClaw 服务/容器环境设置 CUA_REMOTE 后重启该进程。插件使用 POST /cmd 与 SSE 响应；截图先尝试 get_desktop_state，再尝试 screenshot。后端前提与截图存储见[桌面执行](docs/CUA-EXECUTION.zh.md)。

---

## 文档

| 文档 | 用途 |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | 首次运行与安装 |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | 设计与能力边界 |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | .env 与插件配置 |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | 安装到 OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | 通过 cua-driver 的桌面/视觉 |
| [docs/LEASES](docs/LEASES.zh.md) | 桌面任务协调与恢复 |
| [docs/OPERATIONS](docs/OPERATIONS.md) | 运维、安全、排障 |

---

## 设计与安全

- **原生插件，而非桥运行时**：官方 openclaw/plugin-sdk/tool-plugin defineToolPlugin 契约——不自建“第二运行时”。
- **openclaw 是 peer 依赖**：由宿主 OpenClaw 提供，绝不打包。
- **TypeScript/ESM 入口**（src/index.ts）+ 纯 ESM 运行时（src/runtime/*.mjs）——无需 TS 构建链即可运行。
- **默认 fail-closed**：无 shell 的 execFile、工具名格式校验、CUA_REMOTE 仅 http(s)、插件加载路径遏制 + 符号链接逃逸拒绝、远程 worker 可选 Bearer 鉴权（端点必须 http(s)://）。输入与路径检查并非命令授权，见[运维](docs/OPERATIONS.zh.md)。

---

## 路线图与版本

- 路线图：[ROADMAP.md](ROADMAP.md)
- 变更：[CHANGELOG.md](CHANGELOG.md) · 维护：[MAINTENANCE.md](MAINTENANCE.md)

---

## 许可与致谢

- **许可：** MIT — 见 [LICENSE](LICENSE)。
- 基于 **OpenClaw**（插件 SDK、agent exec、会话派生）。
- 桌面/视觉基于 **cua-driver**——本地 spawn，焦点行为取决于后端与命令；远程模式经 **cua-computer-server**。

---

_中文译本；英文为主：[README.md](README.md)。_

## 桌面任务租约

可选 ODSH_LEASE_MODE=single-process 强制 CUA/视觉携带任务凭证，默认 off 兼容旧行为。仅限单进程；不确定在途工作会隔离，不能自动接管。详见[配置、操作和限制](docs/LEASES.zh.md)。
