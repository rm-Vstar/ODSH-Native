# 运维

## 运行
- `npm run check` — 语法检查全部 JS/TS（递归、跨平台）。
- `npm test` — 单元测试 + 真实 SDK 插件加载测试（无 openclaw 时优雅跳过）。
- `node scripts/build.mjs` — 产出 dist/index.js（runtimeExtensions 产物）。

## 安全
- 默认 fail-closed：`runtime/exec.mjs` 的 argv 格式校验、`runtime/cua.mjs` 的工具名格式校验；`registry.mjs` 的插件 impl 路径遏制 + 符号链接逃逸拒绝；远程 worker 可选 Bearer 鉴权（端点必须 http(s)://）。
- 不提交真实 token/密钥；`tests/security.test.mjs` 拦截个人标识符与密钥。
- openclaw 由宿主提供（peer），绝不捆绑。

## 排障
- **插件不加载** → 确认宿主有 openclaw peer 包；查 /tools。
- **Windows ESM 路径报错** → 插件用 pathToFileURL 做目录解析（跨平台）。
- **odsh.serve remote 失败** → 把 DSH_WORKER_ENDPOINT 指向可达的 HTTP worker。