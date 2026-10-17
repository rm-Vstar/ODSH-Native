# 运维

## 运行
- `npm run check` — 递归检查 JS/TS 语法，排除依赖、版本控制和构建目录。
- `npm test` — 单元测试 + 真实 SDK 插件加载测试（缺少 openclaw peer 时报告 SKIP，SUMMARY 分别统计通过、跳过和失败）。
- `node scripts/build.mjs` — 产出 dist/index.js（runtimeExtensions 产物）。

## 安全
- 默认 fail-closed：`src/runtime/exec.mjs` 的无 shell 参数数组执行、`src/runtime/cua.mjs` 的工具名格式校验；`src/registry.mjs` 的插件 impl 路径遏制 + 符号链接逃逸拒绝；远程 worker 可选 Bearer 鉴权（端点必须 http(s)://）。
- 凭据存放于宿主秘密配置。仓库安全扫描检查特定秘密/标识模式，发布前仍需人工审阅。
- openclaw 由宿主提供（peer），绝不捆绑。

## 排障
- **插件不加载** → 确认宿主有 openclaw peer 包；查 /tools。
- **Windows ESM 路径报错** → 插件用 pathToFileURL 做目录解析（跨平台）。
- **odsh.serve remote 失败** → 把 DSH_WORKER_ENDPOINT 指向可达的 HTTP worker。
## 桌面任务租约

可选 ODSH_LEASE_MODE=single-process 强制 CUA/视觉携带任务凭证，默认 off 兼容旧行为。仅限单进程；不确定在途工作会隔离，不能自动接管。详见[配置、操作和限制](LEASES.zh.md)。

命令以宿主权限执行，无 shell 与名称格式校验并非沙箱。截图需配置访问权限及保留策略，存储可能是 tmpfs 或普通文件系统目录。
