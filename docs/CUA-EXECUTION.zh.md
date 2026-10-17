# CUA 桌面执行

ODSH-Native 通过 **cua-driver** 兼容的 server 驱动桌面/视觉。两种模式分别用于同机驱动与远程桌面：

| 模式 | 适用场景 | 方式 |
|---|---|---|
| **本地**（默认） | cua-driver 与 OpenClaw 同机 | `CUA_REMOTE` 留空 → 本地 spawn `cua-driver`（宿主安装，无隧道） |
| **远程** | OpenClaw 在容器里、桌面在 Windows/macOS 宿主 | `CUA_REMOTE=http://host.docker.internal:8000` → 经 HTTP 调用宿主上的 `cua-computer-server`（`POST /cmd`） |

两种模式均 fail-closed：工具名格式校验、无 shell、远程 URL 仅 http(s)、远程错误以 `{ok:false}` 返回而不抛异常。

## 启用

### 本地（宿主安装，最简单）
- 安装 cua-driver（见 github.com/trycua/cua）：Windows PowerShell / macOS-Linux curl 安装脚本。
- 若二进制不在 PATH，在宿主环境设置 CUA_DRIVER。

### 远程桌面

在交互桌面会话中运行兼容的 computer-server。其 HTTP 端点须对插件宿主可达，并仅向可信客户端开放。启动前在 OpenClaw 服务/容器环境设置 CUA_REMOTE，然后重启该进程。安装及启动参数以所用服务版本的文档为准。

插件调用 POST /cmd 并解析 SSE 响应。odsh.cua 原样转发命令名，需选择后端支持的命令；odsh.visual 先尝试 get_desktop_state，再尝试 screenshot。插件不发送 CUA 鉴权头，应通过网络控制或与客户端兼容的认证代理保护访问。

## 命令映射——0.1.25 vs trycua 主线

两条 computer-server 线的**命令名不同**。ODSH-Native 已归一化：`odsh.cua` 原样转发你给的
工具名；`odsh.visual` 截图先试 `get_desktop_state`，遇 4xx/无图再回退 `screenshot`。

| 功能 | PyPI 0.1.25（openinterpreter） | trycua 主线 |
|---|---|---|
| 屏幕尺寸 | `get_screen_size` | `computer_get_screen_size` |
| 截图 | `screenshot` → `{success, image_data}` | `get_desktop_state` → `{success, images[]}` |
| 未知命令 | `400 {"detail":"Unknown command: xxx"}` | （各异） |

## 工具

- `odsh.cua` — image / click / keyboard / browser（CDP），焦点行为取决于后端与命令。按 `CUA_REMOTE`
  探测本地 `cua-driver` 或远程 computer-server。
- `odsh.visual` — 无图片路径时抓实时桌面帧（本地 cua-driver 或远程 computer-server），存到配置的截图目录，然后**一步 OCR**：装有 tesseract 时直接返回 `text`
  （无需外部视觉模型）。

## 安全

- `runtime/cua.mjs` 工具名格式校验（fail-closed）；远程 URL 必须 http(s)；argv key 格式校验。
- 将远程桌面访问限制为可信调用方；插件自身不提供桌面服务认证。
- 配置由操作者提供，不来自不可信信封。
## 截图存储与协调

Linux 存在 /dev/shm 时使用 /dev/shm/odsh-visual，其他系统使用系统临时目录；ODSH_VISUAL_DIR 可覆盖。应配置本地驱动将截图写入同一目录：捕获仅接受本次调用期间新增或变化的图片。共享目录中的并发截图未与具体生产者绑定。插件会保留截图文件，应按保留策略配置访问权限与清理。可选[桌面租约](LEASES.zh.md)协调同一已加载模块、同一 Node 进程中的受管调用，包括纯文件 OCR。
