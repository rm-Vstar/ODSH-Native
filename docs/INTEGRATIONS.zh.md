# 集成

## 作为 OpenClaw 插件（推荐）

1. 把 ODSH-Native 加进 OpenClaw 插件目录（copy src/、openclaw.plugin.json、package.json，或发布后 `openclaw plugins install`）。
2. 在 `/tools` 验证出现 odsh.exec / odsh.cua / odsh.visual / odsh.serve。
3. `npm run check` + `npm test` 跑自测。

## ClawHub / 打包发布（未来）
- 打包为插件包并发布到 ClawHub；`openclaw plugins install clawhub:<包名>`。
- 尚未发布（见 docs/OPERATIONS）。

## CUA 桌面/视觉
- `odsh.cua` 本地 spawn cua-driver（trycua/cua）。
- 支持 Windows / macOS / Linux 后台 computer use，不抢焦点。

## DSH 后端 worker
- `odsh.serve` 以内嵌（本地子进程）或 remote（HTTP `DSH_WORKER_ENDPOINT`，如 DSH/Cordis worker）执行。