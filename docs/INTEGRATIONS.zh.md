# 集成

## 作为 OpenClaw 插件（推荐）

1. 把 ODSH-Native 加进 OpenClaw 插件目录（安装完整构建目录，包含 src/、dist/ 与两个清单，或发布后 `openclaw plugins install`）。
2. 在 `/tools` 验证出现 odsh.exec / odsh.cua / odsh.visual / odsh.serve / odsh.lease。
3. `npm run check` + `npm test` 跑自测。

## 从 ClawHub 安装

openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk

确认风险前审阅源码与宿主执行权限。

## CUA 桌面/视觉
- odsh.cua 本地调用 cua-driver，或使用已配置的远程 computer-server。
- 桌面可用性、权限与焦点行为取决于后端和命令，见[桌面执行](CUA-EXECUTION.zh.md)。

## DSH 后端 worker
- `odsh.serve` 以内嵌（本地子进程）或 remote（HTTP `DSH_WORKER_ENDPOINT`，如 DSH/Cordis worker）执行。