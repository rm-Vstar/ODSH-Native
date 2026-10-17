# QUICKSTART (中文)
本地跑通 ODSH-Native 插件。

## 前置
- Node 22.6+（24/25 推荐；`--experimental-strip-types` 需要 ≥ 22.6）
- 一个 OpenClaw 宿主（提供 `openclaw` peer 包）
- （可选）`cua-driver` 供 `odsh.cua`

## 本地验证（无需宿主 OpenClaw）
```bash
npm install --no-save openclaw@2026.7.1-2
npm run check
npm test
npm run build
```

## 安装进 OpenClaw
见[集成](INTEGRATIONS.zh.md)（宿主侧安装及工具发现）。

## 获得的能力
- odsh.exec / odsh.cua / odsh.visual / odsh.serve / odsh.lease
## 桌面前提

启动前在宿主进程环境设置桌面/worker 变量，见[配置](CONFIGURATION.zh.md)。本地 CUA 需要宿主进程可用的驱动，远程 CUA 需要可达的兼容 computer-server；OCR 使用本地 tesseract。任务级协调需启用单进程模式，按[领取、续租和释放](LEASES.zh.md)操作。SDK 测试通过模拟宿主注册 API 加载源码与构建入口，宿主安装是独立步骤。
