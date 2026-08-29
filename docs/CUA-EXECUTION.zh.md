# CUA 桌面执行

ODSH-Native 通过 **cua-driver**（trycua/cua）驱动桌面/视觉。两种可选模式，保证宿主环境与 docker 环境都有最简连接方式：

| 模式 | 适用场景 | 方式 |
|---|---|---|
| **本地**（默认） | cua-driver 与 OpenClaw 同机 | `CUA_REMOTE` 留空 → 本地 spawn `cua-driver`（宿主安装，无隧道） |
| **远程** | OpenClaw 在容器里、桌面在 Windows/macOS 宿主 | `CUA_REMOTE=http://host.docker.internal:8000` → 经 HTTP 调用宿主上的 `cua-computer-server`（`POST /cmd`） |

两种模式均 fail-closed：工具名格式校验、无 shell、远程 URL 仅 http(s)、远程错误以 `{ok:false}` 返回而不抛异常。

## 启用

### 本地（宿主安装，最简单）
- 安装 cua-driver（见 github.com/trycua/cua）：Windows PowerShell / macOS-Linux curl 安装脚本。
- 若二进制不在 PATH，在 `.env` 设 `CUA_DRIVER`。

### 远程（docker → 宿主桌面，经 computer-server）
1. Windows 宿主（交互会话）启动官方 computer-server 以暴露 cua-driver：
   ```powershell
   pip install "cua-computer-server[driver]"
   python -m computer_server --backend cua-driver --capture-scope desktop --host 0.0.0.0 --port 8000
   ```
2. OpenClaw 容器内设置：
   ```env
   CUA_REMOTE=http://host.docker.internal:8000
   ```
3. `odsh.cua` / `odsh.visual`（无 path 的截图）即可通过 JSON（`/cmd`）操作宿主桌面；截图以 base64 落盘到 `<tmpdir>/odsh-visual/`。

> 可选：直接在 OpenClaw 注册远程 MCP（无需 ODSH-Native 代码）：
> ```bash
> openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
> ```

## 工具

- `odsh.cua` — list-tools / get_desktop_state / click / keyboard / browser（CDP），后台且 focus-safe。
- `odsh.visual` — 无图片路径时抓实时桌面帧（本地 cua-driver 或远程 computer-server）并跑本地 OCR（tesseract）。

## 安全

- `runtime/cua.mjs` 工具名格式校验（fail-closed）；远程 URL 必须 http(s)；argv key 格式校验。
- computer-server **无内置 token**——建议仅绑定本地/回环或防火墙只放行 docker 网段，或套 SSH 隧道。
- 配置由操作者提供，不来自不可信信封。
