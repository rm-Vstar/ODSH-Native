# ODSH-Native — 目标文档 (DRAFT)

> 本文档定义「ODSH-Native」新产物形态，对比现有 ODSH-Bridge for Docker，让 OpenClaw 在宿主机上，不依赖「Windows Node + SSH 桥 + 第二个 LLM」，原生获得：
> ① 跨平台、不抢焦点的桌面系统操作与视觉能力;
> ② 派生「完全干净上下文(无角色/记忆)」的纯执行 subagent，跑完汇报回主 agent;
> ③ 原生、无缝使用 DSH 平台的全部插件与扩展能力。
> **状态: DRAFT — 等确认后再落地。**

---

## 1. 背景与痛点

现有 ODSH-Bridge for Docker 解决跨容器协作，但存在四类问题：

1. **笨重**：依赖 Docker 共享卷 + 文件信封桥(Input/Output) + 自启守护 daemon，部署运维成本高。
2. **双 LLM**：DSH 是第二个独立 LLM/上下文，与 OpenClaw 用协议互换「结果摘要」，非单一智能体。
3. **Windows Node + SSH 桥**：CUA 桌面执行需 DSH 经 SSH 隧道打 Windows 宿主，笨重且不跨平台。
4. **上下文开销**：轻任务(跑脚本/查 API/系统操作)也要载入 OpenClaw 大量角色/记忆上下文，浪费 token。

## 2. 目标（3 大能力）

### 2.1 跨平台不抢焦点的桌面系统操作与视觉能力
- 本地调用 CUA/cua-driver 和浏览器（不需要第二个 LLM 中转，不需要 SSH 桥）。
- 不抢用户鼠标的截图、浏览器自动化(CDP)、点击、键盘、应用启动、视觉理解。
- 跨平台：Windows / macOS / Linux 宿主机皆可。

### 2.2 干净 subagent（无角色/记忆）
- OpenClaw 能派生「完全干净上下文（无 persona/记忆/会话历史）」的纯执行 subagent/worker。
- 跑完独立任务后把结果汇报回主 agent。
- 目的：减轻轻任务载入大量角色记忆上下文的 token 开销。

### 2.3 原生 DSH 插件能力
- 把 DSH 平台插件/扩展能力原生带进 OpenClaw，作为一等工具/worker（而非第二个独立 LLM）。
- 插件 = 本地可枚举/可加载的工具集（可执行/脚本/LLM 工具等）。
- 复用 DSH 已验证的 exec/文件/代码/检索能力形态。

## 3. 与 ODSH-Bridge for Docker 的定位对比

| 维度 | ODSH-Bridge for Docker | ODSH-Native |
|------|------|------|
| 形态 | 两个容器 + 文件信封桥 | 宿主机单一集成形态 |
| LLM | 两个独立 LLM 上下文 | 单个主 agent + 干净 worker |
| 系统操作 | DSH via SSH → Windows CUA | 本地 CUA（无 SSH/无锁/不抢焦点） |
| 轻任务 | 载入全量角色记忆 | 干净 subagent 隔离 |
| 插件 | DSH 插件隔离在 DSH | DSH 插件原生进 OpenClaw 一等工具 |
| 复杂度 | 高(daemon+协议+部署) | 低(轻壳+原生能力) |

## 4. 非目标（暂时不做）

- 不替代 OpenClaw 的既有人格/记忆生态。
- 不做跨机分布式（先聚焦单机宿主）。
- 不保留 Docker 卷/文件桥依赖。

## 5. 关键设计选择（待确认）

- **落地语言/运行时**：Rust 单一自足二进制？Node/TypeScript（复用现有 code 生态）？还是混合？
- **宿主平台优先**：先 Windows？还是 macOS+Linux？
- **OpenClaw 集成面**：走 tools/invoke（已有 HTTP 端点）？走 plugin/hook？仍用文件信封（不推荐）？
- **干净 subagent 入口**：用 OpenClaw 的 agent exec（一次性临时状态，已调研支持）？还是自建？
- **CUA 依赖**：用 cua-driver（本地 CLI）能否接受？只要截图+浏览器，还是也要点击/键盘/应用启动？

---

## 6. 验收标准（Definition of Done）

- [ ] D6.1 宿主机上 OpenClaw 能派一个干净 subagent 执行轻任务并回传，不需载入 persona/记忆。
- [ ] D6.2 本地（不抢焦点/无 SSH）完成一次桌面视觉/系统操作。
- [ ] D6.3 一个 DSH 插件能作为 OpenClaw 原生工具被调用。
- [ ] D6.4 无 Docker、无文件信封桥、无第二个 LLM，可单进程/轻进程跑通。
- [ ] D6.5 附架构图 + 插件编写指南 + 与 Docker 版对比文档。

---

_（本文件由 DSH 起草。请修改到满意后再让其落地。）_
