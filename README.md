# ODSH-Native

全新宿主级产品（区别于 ODSH-Bridge for Docker）。目标：让 OpenClaw 在宿主机上，不依赖「Windows Node + SSH 桥 + 第二个 Agent」，原生获得：
① 跨平台、不抢焦点的桌面系统操作与视觉能力；
② 派生「干净无上下文（无角色/记忆）的纯执行 subagent，跑完汇报回主 agent；
 ③ 原生使用 DSH 平台的全部插件与扩展能力。

## 状态
- 本仓库：DRAFT / 设计阶段。
- 权威目标与验收标准见 ODSH-NATIVE-GOAL.md。

## 关联项目
- ODSH-Bridge for Docker → https://github.com/Mikoribbit/ODSH-Bridge （容器版，双 LLM + 文件信封桥）

## 目录规划（占位）

.
    ├── ODSH-NATIVE-GOAL.md    # 目标文档（DRAFT）
    ├── docs/                  # 架构图 / 插件设计 / 对比文档
    ├── src/                   # 核心实现（待定 Rust / Node）
    └── plugins/               # 一等工具插件集
