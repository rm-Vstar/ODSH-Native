# 配置

ODSH-Native 读取宿主进程环境变量（见 .env.example），不会自动加载 .env。启动 OpenClaw 前应导出变量，或配置服务/容器环境；独立 CLI 可使用 Node --env-file=.env 显式加载。仅复制示例文件不会生效。
插件清单（openclaw.plugin.json）声明空 configSchema；所有运行时开关都从环境变量读取——目前没有任何插件配置键已接线。

例外：独立 src/gateway/bridge.mjs CLI 会显式加载当前工作目录的 .env（可用 OC_ENV_FILE 覆盖路径），已有进程变量优先。OpenClaw 插件入口和直接导入 gateway-client 均不调用该加载器。

## .env

| 键 | 含义 | 默认 |
|---|---|---|
| OC_HOST | OpenClaw 网关地址 | 127.0.0.1 |
| OC_PORT | 网关端口 | 18789 |
| OC_TOKEN | gateway.auth.token | 必填 |
| OC_ORIGIN | WS Upgrade Origin（须在 gateway.controlUi.allowedOrigins 内）；空 = http://\<host\>:\<port\> | 空 |
| OC_KEYS | Ed25519 设备 JWK 文件 | 首次自动生成 |
| OC_CONNECT_TIMEOUT_MS | 配对/连接超时 | 45000 |
| OC_REPLY_TIMEOUT_MS | 网关请求/应答超时 | 20000 |
| DSH_WORKER_ENDPOINT | 远端 DSH worker(remote)；空=internal。必须 `http(s)://`；明文 http 会以明文发送 Bearer token——优先 https 或 localhost | 空 |
| DSH_WORKER_TOKEN | 发给远端 worker 的 Bearer token（remote 时建议设置） | 空 |
| CUA_DRIVER | cua-driver 二进制 | cua-driver |
| CUA_REMOTE | 远程 cua-computer-server URL（docker → 宿主桌面）；空=本地 cua-driver | 空 |
| TESSERACT_BIN | 本地 OCR 可执行文件 | tesseract |
| ODSH_VISUAL_DIR | 截图目录；本地驱动须向此目录写入帧 | Linux 存在 /dev/shm 时为 /dev/shm/odsh-visual，否则为系统临时目录下 odsh-visual |
| ODSH_LEASE_MODE | 桌面协调：off 或 single-process | off |
| OPENCLAW_BIN | 独立 clean-exec 可执行文件 | openclaw |
| OC_ENV_FILE | 独立 bridge 加载的环境文件 | 工作目录下 .env |
| ODSH_WS_KEEPALIVE_MS | 网关 ping 间隔（毫秒），0 关闭 | 4000 |

网关变量用于独立网关客户端，原生工具注册不需要这些设置。修改桌面/worker 环境后重启宿主进程；凭据应存放于宿主秘密配置。

## 桌面任务租约

可选 ODSH_LEASE_MODE=single-process 强制 CUA/视觉携带任务凭证，默认 off 兼容旧行为。仅限单进程；不确定在途工作会隔离，不能自动接管。详见[配置、操作和限制](LEASES.zh.md)。
