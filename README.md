# ODSH-Native

全新宿主机产品（区别于 ODSH-Bridge for Docker）。让 OpenClaw 在宿主机（优先 Windows），不依赖「Windows Node + SSH 桥 + 第二个 LLM」：
- ① 跨平台不抢焦点的桌面系统操作与视觉能力（本地 CUA）
- ② 干净 sub-agent（复用 OpenClaw 原生 `agent exec`：一次性/临时状态/无 persona/记忆）
- ③ 原生 DSH 插件能力（插件 = 本地可发现、可注册的工具）

## 主线语言
- Node.js / ESM（对齐 OpenClaw 生态）；CUA 本地 spawn。

## 状态
- 注册表可用：node src/registry.mjs list / invoke
- 干净 worker：node src/worker/clean-exec.mjs <task>
- 本地工具：src/tools/exec.mjs、src/tools/cua.mjs
- 设计：docs/ARCHITECTURE.md

## 关联
- ODSH-Bridge for Docker：https://github.com/Mikoribbit/ODSH-Bridge