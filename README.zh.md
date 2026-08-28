# ODSH-Native — 将 DeepSeek Harness 能力打包为 OpenClaw 插件

> ODSH-Native 是 ODSH-Bridge 思路的宿主侧重打包：不再用两个容器 + 文件信封桥，
> 而是把 **DeepSeek Harness（DSH）的执行与插件/能力面** 打包成一个 *原生 OpenClaw 插件*——
> 无需第二个 LLM、无需 Windows-Node + SSH 桥、无需 Docker。

## 它能做什么

- **A 类（可执行 agent-tool）**：`odsh.exec`、`odsh.cua`、`odsh.visual`、`odsh.serve` 注册为 OpenClaw 一等 agent 工具。
- **B 类（常驻服务）**：自动监听（`services/watcher.mjs`）与定时（`services/scheduler.mjs`），由插件生命周期托管。
- **承载 DSH Harness 插件**：`odsh.serve` + `runtime/dsh-worker.mjs` 桥（本地子进程 internal 模式，或 remote 指向 HTTP DSH/Cordis worker）。
- **干净 sub-agent**：复用 OpenClaw 原生 `agent exec` / `sessions_spawn`（无需第二 LLM、无 persona/记忆）。

## 设计决策

- **原生插件，而非桥运行时**：采用官方 `openclaw/plugin-sdk/tool-plugin` 的 `defineToolPlugin` 契约；不自建 "第二运行时"。
- **openclaw 是 peer 依赖**：由宿主 OpenClaw 提供，不打进插件。
- **语言**：插件入口用 TypeScript/ESM（`src/index.ts`）；运行时工具逻辑用纯 ESM（`src/runtime/*.mjs`），无 TS 构建链也能跑。

## 快速开始（详见 docs/QUICKSTART）

```bash
# 1. 本地验证装 peer SDK（运行时由宿主 OpenClaw 提供）
npm install --no-save openclaw@2026.7.1-2

# 2. 语法检查 / 测试 / 构建
npm run check
npm test
node scripts/build.mjs            # -> dist/index.js (OpenClaw runtimeExtensions 产物)

# 3. 安装到 OpenClaw 并通过 /tools 验证（见 docs/INTEGRATIONS）
```

## 文档（拆分）

- **docs/QUICKSTART** — 首次运行与安装
- **docs/CONFIGURATION** — .env 与插件配置
- **docs/ARCHITECTURE-v2** — 设计与能力
- **docs/INTEGRATIONS** — 安装到 OpenClaw / ClawHub
- **docs/OPERATIONS** — 运维、安全、排障
- **docs/CUA-EXECUTION** — 通过 cua-driver 的桌面/视觉

## 安全

默认 fail-closed（承袭 ODSH-Bridge）：`exec.mjs` 用无 shell 的 `execFile`、工具名白名单、插件加载的路径遏制、远程 worker 可选 Bearer 鉴权、不提交真实 token、`tests/security.test.mjs` 拦截被跟踪的个人标识符/密钥。见 docs/OPERATIONS §安全。

## 许可

MIT — 见 LICENSE。

## 致谢

- 基于 **OpenClaw**（插件 SDK、`agent exec`、会话派生）。
- 桌面/视觉：**cua-driver**（trycua/cua）——`odsh.cua` 仅本地 spawn 它。

---

_中文译本；英文为主：[README.md](README.md)_ · 路线图：[ROADMAP.md](ROADMAP.md)