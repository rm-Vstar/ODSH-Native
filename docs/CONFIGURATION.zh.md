# 配置

ODSH-Native 通过 `.env`（见 .env.example）及 OpenClaw 插件 configSchema（openclaw.plugin.json）配置。

## .env

| 键 | 含义 | 默认 |
|---|---|---|
| OC_HOST | OpenClaw 网关地址 | 127.0.0.1 |
| OC_PORT | 网关端口 | 18789 |
| OC_TOKEN | gateway.auth.token | 必填 |
| OC_KEYS | Ed25519 设备 JWK 文件 | 首次自动生成 |
| DSH_WORKER_ENDPOINT | 远端 DSH worker(remote)；空=internal | 空 |
| CUA_DRIVER | cua-driver 二进制 | cua-driver |

## 插件配置（openclaw.plugin.json configSchema）

- watch.enabled / watch.paths —— B 类自动监听
- schedule —— B 类定时任务
- pluginsDir —— DSH 风格工具插件目录（默认 plugins）

## 说明

- 绝不提交真实 token；.env 已 gitignore。
- openclaw 是 peer 依赖（宿主提供）。