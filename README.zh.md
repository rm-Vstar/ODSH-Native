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
- [网页搜索（SERPdive + TinyFish 智能选择）](#网页搜索serpdive--tinyfish-智能选择)
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

### 前置（宿主侧，一次性）

1. 安装 cua-driver（https://github.com/trycua/cua），Windows PowerShell：

```powershell
irm https://cua.ai/driver/install.ps1 | iex
```

2. 在交互会话启动官方 computer-server 以暴露 cua-driver：

```powershell
pip install "cua-computer-server[driver]"
python -m computer_server --backend cua-driver --capture-scope desktop --host 0.0.0.0 --port 8000
```

### 容器侧——二选一

**方式 A：经插件（`CUA_REMOTE`）**：

```env
CUA_REMOTE=http://host.docker.internal:8000
```

odsh.cua 与 odsh.visual（无 path 截图）即通过 `POST /cmd`（SSE）操作宿主桌面；截图落盘到 `<tmpdir>/odsh-visual/`。

**方式 B：经 OpenClaw 原生 MCP（无需插件代码）**：

```bash
openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
```

> **注意**：`cua-computer-server` **无内置 token**。对外暴露前请绑定回环/防火墙只放行 docker 网段（或套 SSH 隧道）。

---

## 网页搜索（SERPdive + TinyFish 智能选择）—— *规划，尚未实现*

> **状态：PLANNED。** 该能力目前**没有实现**——`src/` 中无对应接线（`.env.example` 里的 `SERPDIVE_API_KEY` / `TINYFISH_API_KEY` 仅**预留**，供后续实现落地时免改 `.env`）。下面属于**预期设计**，今日均不可用。

| 引擎 | 强项 | 何时选择 |
|---|---|---|
| **SERPdive**（serpdive.com） | 搜索即答案：一次调用返回提炼好的、可直接给 LLM 用的答案（answer + 每源 content） | 问答/调研式查询：要答案，不只是链接 |
| **TinyFish**（tinyfish.ai） | 排序搜索 + **JS 渲染的整页抓取**（markdown 正文） | 需要原始正文、SPA/JS 重页面，或要整页文本 |

**规划中的选择逻辑**：轻量路由——答案式查询先用 SERPdive；需要原始结果时退回 TinyFish Search；调用方要整页正文（urls[]）时用 TinyFish Fetch。两者低量免费（SERPdive：1000 credits/月含免费 krill 模型；TinyFish：Search 与 Fetch 在 $0 下也免费）。无需 DeepSeek 网页搜索余额。

**预留接线**（供未来实现；今天不可用）：

```bash
# SERPdive — 搜索即答案（Bearer sd_live_…）
curl -X POST https://api.serpdive.com/v1/search -H "Authorization: Bearer $SERPDIVE_KEY" -H "Content-Type: application/json" -d '{"query":"...","model":"mako"}'
# TinyFish — 搜索（免费，X-API-Key）
curl "https://api.search.tinyfish.ai?query=..." -H "X-API-Key: $TINYFISH_API_KEY"
# TinyFish — 抓整页（免费，JS 渲染）
curl -X POST https://api.fetch.tinyfish.ai -H "X-API-Key: $TINYFISH_API_KEY" -H "Content-Type: application/json" -d '{"urls":["https://example.com"],"format":"markdown","ttl":0}'
```

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
- 网页搜索基于 **SERPdive** + **TinyFish**（**规划中，尚未实现**）。

---

_中文译本；英文为主：[README.md](README.md)。_
