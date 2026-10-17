# ODSH-Native 架构

本文描述当前源码。后续计划见 [ROADMAP](../ROADMAP.md)。

## 原生插件入口

[package.json](../package.json) 声明源码入口与运行时入口，[插件清单](../openclaw.plugin.json) 声明五个工具。[src/index.ts](../src/index.ts) 使用宿主提供的 OpenClaw SDK 注册工具：

| 工具 | 当前行为 |
|---|---|
| odsh.exec | 在宿主进程权限下以命令与参数数组执行本地程序 |
| odsh.cua | 本地执行 cua-driver，或经 HTTP POST /cmd 调用远程 computer-server |
| odsh.visual | 对指定图片进行本地 OCR，或抓取桌面帧后尝试 OCR；返回图片路径供调用方继续处理 |
| odsh.serve | internal 模式执行本地子进程；remote 模式向配置的 HTTP worker 发送任务 |
| odsh.lease | 可选的单进程桌面任务租约领取、续租和释放 |

独立文件工具尚未注册。原生入口使用 [src/runtime](../src/runtime/exec.mjs) 中的实现；[src/tools](../src/tools/exec.mjs) 保留独立辅助入口，并非原生工具注册来源。

## 配置与执行边界

运行时配置来自宿主环境，插件配置 schema 当前为空。原生入口使用进程环境；独立 [bridge](../src/gateway/bridge.mjs) 会加载环境文件。详见[配置](CONFIGURATION.zh.md)。

本地命令采用无 shell 的参数数组执行。CUA 校验工具名与参数键格式，远端地址要求 HTTP(S)。这些校验不构成命令授权或沙箱；操作者负责约束宿主权限和远端访问。

视觉实现优先使用本地 tesseract；OCR 不可用时返回路径及说明，由调用方选择多模态模型。截图目录优先采用 Linux 的 /dev/shm，其他环境回退系统临时目录；可显式配置目录。文件保留与访问权限由部署方管理。

## 可选桌面协调

租约保护同一已加载模块、同一 Node 进程中的受管 CUA/视觉调用，包括文件 OCR。任务在步骤间保留凭证，执行期间自动续租，空闲期间由调用方续租。执行失败或失租可能隔离资源，恢复需确认旧操作结束后重启进程。跨进程或外部桌面写入者需独立协调，详见[租约](LEASES.zh.md)。

## 独立辅助能力

- [注册表](../src/registry.mjs) 发现插件目录下的清单并校验实现路径与真实路径。发现的工具由独立调用方执行，原生入口未将其注册为 OpenClaw 工具。第三方实现以进程权限运行，路径校验不是代码沙箱。
- [常驻服务](../src/services/scheduler.mjs) 提供定时器与文件监听库；入口导出的常驻服务工厂由调用方显式启动和停止，插件注册不会自动启动这些服务。
- [clean-exec](../src/worker/clean-exec.mjs) 封装宿主命令行的 agent exec。会话与上下文隔离语义由所用 OpenClaw 版本决定。
- [网关客户端](../src/gateway/gateway-client.mjs) 为独立集成提供设备身份、配对与请求响应；原生工具注册无需连接此客户端。

## 构建与检查

构建脚本从源码入口生成 [dist/index.js](../dist/index.js)，将运行时和服务导入路径指回源码目录，并检查生成文件语法。因此安装包应保留完整源码依赖，而非仅复制构建入口。检查命令与发布步骤见[运维](OPERATIONS.zh.md)和[维护](../MAINTENANCE.md)。
