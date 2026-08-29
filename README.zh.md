# ODSH-Native — 将 DeepSeek Harness 能力打包为一个原生 OpenClaw 插件

<div align="center">

[**中文**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.zh.md) ·
[**English**](https://github.com/rm-Vstar/ODSH-Native/blob/main/README.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D22.6-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-%E6%8F%92%E4%BB%B6-blue.svg)
![ClawHub](https://img.shields.io/badge/ClawHub-odsh--native-8a2be2.svg)

</div>

> **一句话定位**：把你的 OpenClaw agent 变成一个 **DeepSeek Harness（DSH）执行平面**——真实本地命令（odsh.exec）、桌面控制与截图（odsh.cua / odsh.visual）、DSH worker 派发（odsh.serve）、DSH 风格工具插件，全部以**原生 OpenClaw 插件**（官方 SDK 契约）提供。无需第二个 LLM、无需 Windows-Node + SSH 桥、无需 Docker——只需 openclaw plugins install clawhub:odsh-native。
>
> 注意：常驻 watcher/scheduler 以库 API（`startResidentServices`）提供，插件安装时**不自动启动**（见路线图）。

> 已发布到 **ClawHub**：odsh-native（community、source-linked、pluginApi ≥ 2026.3.24-beta）。

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
- 通过 `odsh.cua` **控制桌面**——点击、输入、浏览器（基于 cua-driver，不抢焦点）。
- 通过 `odsh.visual` **理解屏幕/图片**——本地 OCR（tesseract），或来自本地 cua-driver / 远程 computer-server 的实时桌面帧。
- 通过 `odsh.serve` 把任务**派发给 DSH/Cordis worker**（本地子进程或远程 HTTP）。
- **挂载 DSH 风格工具插件**（从 `plugins/` 经 fail-closed 注册表自动发现）。
- B 类 watcher/scheduler 以库 API（`startResidentServices`）提供，插件安装时**不自动启动**——见路线图。

ODSH-Native 把 ODSH-Bridge 的思路重打包为开源 OpenClaw 插件：DSH 执行 + 插件/能力面，做成 OpenClaw 一等 agent 工具平面——**无需第二个 LLM、无需 Windows-Node + SSH 桥、无需 Docker。**

---

## 从 ClawHub 安装

插件已发布到 ClawHub（odsh-native）：

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

装完在 OpenClaw 界面打开 **`/tools`**，确认列出 odsh.exec、odsh.cua、odsh.visual、odsh.serve。

> **为什么要 --acknowledge-clawhub-risk？** 发布安全扫描把本项目标为 suspicious，因为它本质上是一个**本地执行 + 桌面控制**的高权限插件——含 odsh.exec（无 shell）、桌面截图路径、以及可选的远程 worker 调用。插件自身保持 fail-closed（无 shell、工具名格式校验、路径遏制）；勾选信任标记前建议快速过一遍源码。

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

把插件目录放进 OpenClaw 插件根并注册；详见 **docs/INTEGRATIONS** 与 **docs/QUICKSTART**。

---

## Docker → 宿主桌面（远程 CUA）

当 **OpenClaw 跑在容器里**、而真实桌面在 Windows/macOS **宿主**上时，把插件指向宿主上的 `cua-computer-server`。这是**可选项**——`CUA_REMOTE` 为空时插件继续用**本地** `cua-driver`（宿主安装最简）。

### 前置（宿主侧，一次性）——必须开一个端口

远程 CUA 需要宿主上运行 `cua-computer-server`，并把它的 HTTP 端口（默认 `8000`）暴露给容器。
**没有服务 → `odsh.cua`/`odsh.visual` 返回 `{ok:false, error:"fetch failed"}`**；只设
`CUA_REMOTE` 不够。

1. 在交互会话安装并启动 server —— **PyPI `cua-computer-server` 0.1.25**（2026-08 实测；
   自带 ODSH-Native 所需的 `POST /cmd` + SSE 协议；**无需 `[driver]` extra**）：

```powershell
pip install cua-computer-server
python -m computer_server --host 0.0.0.0 --port 8000
```

   > GitHub 主线参数（`--backend cua-driver --capture-scope desktop` 和 `[driver]` extra）
   > 仅 **trycua 主线**支持——PyPI 0.1.25 会拒绝（`unrecognized arguments`）。`--host 0.0.0.0`
   > 必须要有，容器才能访问该端口。Windows 上 `No module named 'win32api'` 只是警告
   > （`pip install pywin32` 可消除）。

2. 先自检：`curl http://localhost:8000/status` → `{"status":"ok",...}`。

### 容器侧——二选一

**方式 A：经插件（`CUA_REMOTE`）**：

```env
CUA_REMOTE=http://host.docker.internal:8000
```

⚠️ **设置后必须完整重启容器**——gateway 热重载不会重新读环境变量，插件会继续走本地模式
（报 `spawn cua-driver ENOENT`）。

odsh.cua 与 odsh.visual（无 path 截图）即通过 `POST /cmd`（SSE）操作宿主桌面；odsh.visual
在 Linux 上把帧存到 `/dev/shm/odsh-visual`（tmpfs 内存盘，不碰持久盘；可用 `ODSH_VISUAL_DIR`
覆盖），装有 tesseract 时直接一步 OCR 返回 `text`（无需外部视觉模型）。截图会先试
`get_desktop_state`（trycua 主线），失败再回退 `screenshot`（PyPI 0.1.25）。

**方式 B：经 OpenClaw 原生 MCP（无需插件代码）**：

```bash
openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
```

> **注意**：`cua-computer-server` **无内置 token**。对外暴露前请绑定回环/防火墙只放行 docker 网段（或套 SSH 隧道）。

---

## 文档

| 文档 | 用途 |
|---|---|
| [docs/QUICKSTART](docs/QUICKSTART.md) | 首次运行与安装 |
| [docs/ARCHITECTURE-v2](docs/ARCHITECTURE-v2.md) | 设计与能力边界 |
| [docs/CONFIGURATION](docs/CONFIGURATION.md) | .env 与插件配置 |
| [docs/INTEGRATIONS](docs/INTEGRATIONS.md) | 安装到 OpenClaw / ClawHub |
| [docs/CUA-EXECUTION](docs/CUA-EXECUTION.md) | 通过 cua-driver 的桌面/视觉 |
| [docs/OPERATIONS](docs/OPERATIONS.md) | 运维、安全、排障 |

---

## 设计与安全

- **原生插件，而非桥运行时**：官方 openclaw/plugin-sdk/tool-plugin defineToolPlugin 契约——不自建“第二运行时”。
- **openclaw 是 peer 依赖**：由宿主 OpenClaw 提供，绝不打包。
- **TypeScript/ESM 入口**（src/index.ts）+ 纯 ESM 运行时（src/runtime/*.mjs）——无需 TS 构建链即可运行。
- **默认 fail-closed**：无 shell 的 execFile、工具名格式校验、CUA_REMOTE 仅 http(s)、插件加载路径遏制 + 符号链接逃逸拒绝、远程 worker 可选 Bearer 鉴权（端点必须 http(s)://）、不提交真实 token、tests/security.test.mjs 拦截被跟踪的个人标识符与密钥。见 docs/OPERATIONS §安全。

---

## 路线图与版本

- 路线图：[ROADMAP.md](ROADMAP.md)
- 变更：[CHANGELOG.md](CHANGELOG.md) · 维护：[MAINTENANCE.md](MAINTENANCE.md)

---

## 许可与致谢

- **许可：** MIT — 见 [LICENSE](LICENSE)。
- 基于 **OpenClaw**（插件 SDK、agent exec、会话派生）。
- 桌面/视觉基于 **cua-driver**——本地 spawn，不抢焦点；远程模式经 **cua-computer-server**。

---

_中文译本；英文为主：[README.md](README.md)。_
