# CUA 桌面执行

ODSH-Native 通过 **cua-driver** 兼容的 server 驱动桌面/视觉。两种可选模式，保证宿主环境与 docker 环境都有最简连接方式：

| 模式 | 适用场景 | 方式 |
|---|---|---|
| **本地**（默认） | cua-driver 与 OpenClaw 同机 | `CUA_REMOTE` 留空 → 本地 spawn `cua-driver`（宿主安装，无隧道） |
| **远程** | OpenClaw 在容器里、桌面在 Windows/macOS 宿主 | `CUA_REMOTE=http://host.docker.internal:8000` → 经 HTTP 调用宿主上的 `cua-computer-server`（`POST /cmd`） |

两种模式均 fail-closed：工具名格式校验、无 shell、远程 URL 仅 http(s)、远程错误以 `{ok:false}` 返回而不抛异常。

## 启用

### 本地（宿主安装，最简单）
- 安装 cua-driver（见 github.com/trycua/cua）：Windows PowerShell / macOS-Linux curl 安装脚本。
- 若二进制不在 PATH，在 `.env` 设 `CUA_DRIVER`。

### 远程（docker → 宿主桌面，经 computer-server）——宿主前置：必须开一个端口

Windows/macOS 宿主必须运行 `cua-computer-server`，并把它默认 `8000` 的 HTTP 端口暴露给
OpenClaw 容器。**没有这个服务，插件远程模式只会返回 `{ok:false, error:"fetch failed"}`**——
光设环境变量不够。

1. 在宿主（交互会话）安装并启动 server：

   **PyPI `cua-computer-server` 0.1.25**（2026-08 实测，openinterpreter 系——自带
   ODSH-Native 使用的 `POST /cmd` + SSE 协议，**无需 `[driver]` extra**）：
   ```powershell
   pip install cua-computer-server
   python -m computer_server --host 0.0.0.0 --port 8000
   ```
   > ⚠️ GitHub 主线参数（`--backend cua-driver --capture-scope desktop`）与 `[driver]` extra
   > 仅 **trycua 主线**支持；PyPI 0.1.25 会拒绝（`unrecognized arguments`）。若你用 GitHub
   > 主线，则用那套命令。无论哪种，`--host 0.0.0.0` 都必须有，容器才能访问该端口。
   > Windows 上 `No module named 'win32api'` 只是警告；`pip install pywin32` 可消除。

2. 先验证 server 再动 OpenClaw：
   ```powershell
   curl http://localhost:8000/status
   # {"status":"ok","os_type":"windows"}
   ```

3. 在 OpenClaw **容器**里设置端点。`CUA_REMOTE` 从环境读取，需经 OpenClaw 配置注入
   （如 `env.vars`）。⚠️ **必须完整重启容器/进程**——gateway 热重载（SIGUSR1）不会重新读
   环境，插件会继续走本地模式（`spawn cua-driver ENOENT`）。
   ```env
   CUA_REMOTE=http://host.docker.internal:8000
   ```
   从 `odsh.cua` 的返回判断当前模式：
   - 本地模式 → `{ok:false, error:"spawn cua-driver ENOENT"}`
   - 远程模式、服务未起 → `{ok:false, remote:true, error:"fetch failed"}`（环境已生效，去启动服务）
   - 远程模式、正常 → `{ok:true, remote:true, ...}`

4. `odsh.cua` / `odsh.visual`（无 path 截图）即通过 `POST /cmd`（SSE）操作宿主桌面。
   `odsh.visual` 在 Linux 上把截图存到 `/dev/shm/odsh-visual`（tmpfs 内存盘——不写持久盘；
   可用 `ODSH_VISUAL_DIR` 覆盖）。

> 可选：直接在 OpenClaw 注册远程 MCP（无需 ODSH-Native 代码）：
> ```bash
> openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
> ```

## 命令映射——0.1.25 vs trycua 主线

两条 computer-server 线的**命令名不同**。ODSH-Native 已归一化：`odsh.cua` 原样转发你给的
工具名；`odsh.visual` 截图先试 `get_desktop_state`，遇 4xx/无图再回退 `screenshot`。

| 功能 | PyPI 0.1.25（openinterpreter） | trycua 主线 |
|---|---|---|
| 屏幕尺寸 | `get_screen_size` | `computer_get_screen_size` |
| 截图 | `screenshot` → `{success, image_data}` | `get_desktop_state` → `{success, images[]}` |
| 未知命令 | `400 {"detail":"Unknown command: xxx"}` | （各异） |

## 工具

- `odsh.cua` — image / click / keyboard / browser（CDP），后台且 focus-safe。按 `CUA_REMOTE`
  探测本地 `cua-driver` 或远程 computer-server。
- `odsh.visual` — 无图片路径时抓实时桌面帧（本地 cua-driver 或远程 computer-server），存到
  `/dev/shm/odsh-visual`（内存），然后**一步 OCR**：装有 tesseract 时直接返回 `text`
  （无需外部视觉模型）。

## 安全

- `runtime/cua.mjs` 工具名格式校验（fail-closed）；远程 URL 必须 http(s)；argv key 格式校验。
- computer-server **无内置 token**——建议仅绑定本地/回环或防火墙只放行 docker 网段，或套 SSH 隧道（见上：端口必须可达，但别让它被陌生人可达）。
- 配置由操作者提供，不来自不可信信封。