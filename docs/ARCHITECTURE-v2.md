# ODSH-Native — 重构蓝图 (ARCHITECTURE v2)

**状态**: 重构设计稿（v2，取代 v1 的 standalone 定位）  
**Goal**: 目标是成为一个**真正的 OpenClaw 插件**，具备 A 类（可执行 agent-tool）+ 部分 B 类（常驻后台/自动监听 + 承载 DSH Harness 插件）。

---

## 1. 定位转变

**原 v1**: standalone Node 项目 + 自建 registry，把工具暴露给 OpenClaw（额外一层）。  
**重构 v2**: **原生 OpenClaw 插件**。直接用 OpenClaw 官方插件机制注册 agent-tool，不再自建 bridge/gateway 那套"第二运行时"。

## 2. 目标能力面

| 类别 | 能力 | 通过 OpenClaw 何种机制 |
|------|------|------|
| A 类（执行） | exec / file / cua / visual / 自定义插件工具 | agent tool（`defineToolEntry` / `api.on("tool")`） |
| B 类-1 | 常驻后台服务 / 自动监听 | plugin 生命周期 + `api.on("`调度/hook") + File watcher / scheduler |
| B 类-2 | 承载 DSH Harness 插件 | 桥接执行后端（把 DSH 的 `ctx`-grade 能力作为受调的服务） |
| （副） | 干净 sub-agent | 复用 OpenClaw 原生 `sessions_spawn` / `agent exec`（不重新造） |

## 3. OpenClaw 插件骨架（v2 新写）

遵循官方规范（`docs.openclaw.ai/plugins/*`）：

### 3.1 清单
`openclaw.plugin.json`（manifest，`contracts.tools` 声明） + `package.json`（`openclaw.extensions`、`type: module`、peer `openclaw`）。

### 3.2 入口
- 安装后：`extensions: ["./dist/index.js"]` / `runtimeExtensions`。
- 源码开发：`extensions: ["./src/index.ts"]`（TypeScript ESM，对齐 OpenClaw 生态）。

### 3.3 注册 A 类工具
用 `defineToolPlugin` / `api.on("tool")` 把现有 ODSH-Native 能力（exec、cua、visual、registry 插件）逐个注册为 OpenClaw agent-tool。

### 3.4 注册 B 类常驻服务
- 用插件 hook 生命周期（`api.on("hook_name", handler)`，如 lifecycle/调度）挂常驻监听。
- 或内置一个 scheduler / File watcher（成为 OpenClaw 的一个后台服务能力面）。

### 3.5 承载 DSH Harness 插件的桥接
- 方式：OpenClaw 插件通过 agent-tool`spawn-dsh-worker`，把需在 DSH Harness 生命周期里执行的任务发给一个 DSH 常驻后端（Cordis worker），由它执行并回传。
- （复用 DSH 侧 `odsh-bridge.ts` 那种 `ctx.effect(spawn)` 的能力）

### 3.6 配置
`configSchema`（`openclaw.plugin.json`）+ `config` 校验（对 `typebox`）。

## 4. 目录结构（重构后目标）

```
ODSH-Native/
├─ openclaw.plugin.json        # manifest（contracts.tools + configSchema）
├─ package.json                # openclaw.extensions / runtimeExtensions / peers
├─ src/
│  ├─ index.ts                 # 插件主入口(defineToolPlugin/definePluginEntry)
│  ├─ tools/                    # A类: 每个一个 agent-tool
│  │  ├─ exec.ts
│  │  ├─ cua.ts
│  │  ├─ visual.ts
│  │  └─ file.ts
│  ├─ registry/               # 加载 plugins/ 目录的 DSH 风格工具
│  │  ├─ registry.ts
│  │  └─ load-plugins.ts
│  ├─ services/               # B 类: 常驻后台 / 监听
│  │  ├─ watcher.ts   # File/目录监听触发 agent-tool
│  │  └─ scheduler.ts # 定时任务
│  ├─ harness/                # B 类: 承载 DSH 插件的桥
│  │  └─ dsh-worker.ts # 调 DSH 常驻后端执行
│  └─ worker/
│     └─ clean-exec.ts        # 复用原生 agent exec/sessions_spawn
├─ plugins/                   # 用户可放 DSH 风格工具插件(被 registry 发现)
│  └─ example-plugin/
│     ├─ manifest.json
│     └─ tool.mjs
├─ tests/
└─ dist/                      # 构建产物(runtimeExtensions)
```

## 5. 复用现有代码
- `src/tools/exec.mjs`、`src/tools/cua.mjs`、`src/tools/visual.mjs`、`src/registry.mjs`、`plugins/example-plugin`：薄封装成 TS/ESM 的 agent-tool（直接搬逻辑，改注册面）。
- `src/gateway/*`：**保留 as-is**（可能用于"调用 OpenClaw 其他工具"的客户端能力，或不再必要）。
- `scripts/check.mjs / test.mjs`：保留，加对 TS/SDK 入口的 check。

## 6. 与现有 ODSH-Bridge for Docker 的关系
- ODSH-Native v2 是上位替代:同为"把 DSH 能力给 OpenClaw",但走**原生插件**而非**双容器+桥**。
- 保留复用:registry 的 fail-closed 安全传统、exec/cua 工具、DSH 插件发现。

## 7. 需要确认(决策)
1. 插件入口用 TS(`src/index.ts`)还是保留 `.mjs`? → 默认租 VS(对齐 OpenClaw 插件生态; TS ESM)
2. `openclaw` peer 版本兼容(2026.3.24+ beta 接口)
3. B 类: 内置 watcher/scheduler 由插件自带,还是用 OpenClaw 的 cron hook?
4. DSH-Harness 桥: 是**远程调用一个 DSH 常驻**(跨进程),还是**宿主内嵌**一个 DSH worker 子进程(更贴本机)?

## 8. 实现状态 (2026-08-28)

- [x] openclaw.plugin.json: manifest (contracts.tools: odsh.exec/cua/visual/serve + configSchema)
- [x] package.json: plugin form (extensions + runtimeExtensions + peer openclaw)
- [x] src/index.ts: 主入口 (defineToolPlugin + 4 A 类 agent tools + B 类生命周期) -- Node24 strip-types 通过
- [x] src/runtime/{exec,cua,visual,dsh-worker}.mjs: A 类执行工具 + B 类 DSH worker 桥 (internal/remote)
- [x] src/services/{watcher,scheduler}.mjs: B 类常驻后台服务
- [x] scripts/build.mjs -> dist/index.js (runtimeExtensions 产物, 可 import)
- [x] 测试: 11 cases 全 PASS (registry3+runtime2+services2+dsh-worker2+plugin-load2); check ALL_SYNTAX_OK(23+)
- [ ] 真连 DSH 后端 (DSH_WORKER_ENDPOINT) 端到端 (internal 已验证)
- [x] 真 OpenClaw plugin-sdk 加载验证: 用 npm openclaw@2026.7.1-2 的 plugin-sdk/tool-plugin 加载 plugin, 注册 4 tools 并真实执行 odsh.exec(round-trip ok) -- 本环境已实证

---