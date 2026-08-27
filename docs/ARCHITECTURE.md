# ODSH-Native — 架构设计 (DRAFT v0)

> 主线语言: **Node.js / TypeScript**。(CUA 桌面/视觉经本地 spawn 语言无关二进制; 干净 subagent 复用 OpenClaw 原生 `openclaw agent exec`。)
> 目标: 让 OpenClaw 在宿主机(优先 Windows)上, 不依赖「Windows Node + SSH 桥 + 第二个 LLM」, 原生获得 ①跨平台不抢焦点桌面/视觉 ②干净 subagent ③DSH 插件能力。

## 1. 核心设计原则

1. **去第二 LLM**: 不维护独立 DSH 上下文。执行交给「工具 + 干净 agent exec worker」。
2. **复用 OpenClaw 原生**: `tools.invoke`(HTTP) 做工具调用; `openclaw agent exec` 做一次性、临时状态、无角色/记忆的干净 sub-agent 执行。
3. **插件 = 本地工具注册表**: 一个目录放可枚举的工具定义(可执行/脚本/LLM 包装), ODSH-Native 发现并暴露给 OpenClaw。
4. **本地 CUA**: cua-driver 作为本地 CLI 被 spawn, 不再经 SSH/跨容器。

## 2. 目录结构

```
ODSH-Native/
├─ ODSH-NATIVE-GOAL.md      # 目标与验收(DRAFT)
├─ ARCHITECTURE.md          # 本文档
├─ package.json             # (待建) Node 工程
├─ src/
│  ├─ registry/             # 能力/插件注册表(枚举+加载+暴露)
│  │  ├─ registry.mjs       #   工具注册、白名单、JSON schema
│  │  └─ load-plugins.mjs   # 从 plugins/ 发现并加载
│  ├─ tools/                # 内置工具(可被 OpenClaw tools.invoke)
│  │  ├─ exec.mjs           # 本地执行
│  │  ├─ file.mjs           # 文件读写/检索
│  │  ├─ cua.mjs            # 本地 spawn cua-driver(截图/浏览器/点击)
│  │  └─ visual.mjs         # 视觉理解封装(OCR/截图描述)
│  ├─ worker/               # 干净 sub-agent
│  │  ├─ clean-exec.mjs     # 封装 `openclaw agent exec`
│  │  └─ report.mjs         # 结果回传主 agent 的契约
│  └─ gateway/              # OpenClaw 集成
│     ├─ tools-invoke.mjs   # 走 tools.invoke HTTP 端点
│     └─ ed25519.mjs        # (可复用 ODSH-Bridge) 网关配对签名
└─ plugins/                 # 一等工具插件(用户可往这放, 自动发现)
   └─ example-plugin/
      └─ tool.mjs
```

## 3. 干净 sub-agent(需求②) — 用 OpenClaw 原生

- 入口: `openclaw agent exec "task"` (` --cwd ` ` --json `)。
- 特点: 默认创建并随后删除临时状态目录, 无 persona/记忆 → 「完全干净上下文」。
- ODSH-Native 封装为 `src/worker/clean-exec.mjs`: 接收任务文本/参数 → spawn agent exec → 解析结果 → 汇报回主 agent。
- 目的: 轻任务(查 API/跑脚本/系统操作)不载入角色记忆, 降 token 开销。

## 4. 桌面/视觉工具(需求①, 本地 CUA)

- `src/tools/cua.mjs`: spawn 本机 cua-driver CLI (list-tools / screenshot / click / browser CDP 等)。
- 不抢焦点: cua-driver 本身 focus-safe; 本地 spawn 无 SSH 隧道。
- `visual.mjs`: 截图像素/OCR/描述, 供 OpenClaw 视觉理解。
- 跨平台: cua-driver 支持 Windows/macOS/Linux(引用 trycua/cua)。

## 5. 插件与能力注册表(需求③)

- `plugins/` 目录: 每个插件 = 一个文件夹, 内含 `manifest.json`(name, tools, 依赖 bins/env) + 工具实现。
- `registry.mjs`: 递归发现 → 校验(安全: 路径/argv 白名单, 同 ODSH-Bridge 的 fail-closed 传统) → 挂到 `tools.invoke`。
- 复用 DSH-Bridge 已验证形态(exec/文件/代码/检索)作为内置插件模板。

## 6. 与 ODSH-Bridge for Docker 对比

| 维度 | Docker 版 | Native |
|------|------|------|
| 形态 | 双容器+文件信封桥 | 单机宿主集成 |
| LLM | 双 LLM | 单主 agent + 干净 worker |
| CUA | SSH → Windows | 本地 spawn |
| 轻任务 | 载入全量记忆 | 干净 sub-agent |
| 插件 | DSH 隔离 | 原生注册表作为一等工具 |

## 7. 待确认/下一步

- [x] 语言: Node/TS 主线(已定)
- [ ] SDK/工程化: TypeScript? ESM? (默认 TS + ESM 对齐现有)
- [ ] 集成面: 先 `tools.invoke` HTTP 端点, 还是 OpenClaw plugin/hook? (默认先 tools.invoke)
- [ ] 安全策略: 复用 fail-closed(路径约束/argv 白名单/requester allowlist)
- [ ] CUA 分支: 是否默认内置(取消你的选择: 必须,桌面+视觉都要)
