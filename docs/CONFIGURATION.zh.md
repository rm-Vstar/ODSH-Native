# 配置

ODSH-Native 通过 `.env`（见 .env.example）配置。插件清单（openclaw.plugin.json）声明**空** configSchema：
所有运行时开关都从环境变量读取——目前没有任何插件配置键已接线。

## .env

| 键 | 含义 | 默认 |
|---|---|---|
| OC_HOST | OpenClaw 网关地址 | 127.0.0.1 |
| OC_PORT | 网关端口 | 18789 |
| OC_TOKEN | gateway.auth.token | 必填 |
| OC_ORIGIN | WS Upgrade Origin（须在 gateway.allowedOrigins 内）；空 = http://\<host\>:\<port\> | 空 |
| OC_KEYS | Ed25519 设备 JWK 文件 | 首次自动生成 |
| OC_CONNECT_TIMEOUT_MS | 配对/连接超时 | 45000 |
| OC_REPLY_TIMEOUT_MS | 网关请求/应答超时 | 20000 |
| DSH_WORKER_ENDPOINT | 远端 DSH worker(remote)；空=internal。必须 `http(s)://`；明文 http 会以明文发送 Bearer token——优先 https 或 localhost | 空 |
| DSH_WORKER_TOKEN | 发给远端 worker 的 Bearer token（remote 时建议设置） | 空 |
| CUA_DRIVER | cua-driver 二进制 | cua-driver |
| CUA_REMOTE | 远程 cua-computer-server URL（docker → 宿主桌面）；空=本地 cua-driver | 空 |
| SERPDIVE_API_KEY | **保留**——网页搜索规划中，尚未实现 | 空 |
| TINYFISH_API_KEY | **保留**——网页搜索规划中，尚未实现 | 空 |

说明：

- 原先的 `ODSH_PLUGINS_DIR` / `ODSH_WATCH_*` / `ODSH_SCHEDULE_JSON` /
  `CUA_TIMEOUT_MS` 键已**移除**：没有任何代码读取它们（B 类 watcher/scheduler 与
  plugins-dir 环境开关尚未接入运行时）。见 CHANGELOG。

## 说明

- 绝不提交真实 token；.env 已 gitignore。
- openclaw 是 peer 依赖（宿主提供）。