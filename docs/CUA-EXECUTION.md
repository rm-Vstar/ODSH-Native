# CUA Execution

ODSH-Native drives desktop/vision via **cua-driver** (trycua/cua). Two selectable modes keep
the simplest wiring in both host and docker environments:

| Mode | When | How |
|---|---|---|
| **Local** (default) | cua-driver installed on the same host as OpenClaw | `CUA_REMOTE` empty → spawn `cua-driver` locally (host install, no tunnel). |
| **Remote** | OpenClaw in a container, desktop on the Windows/macOS host | `CUA_REMOTE=http://host.docker.internal:8000` → talk to a `cua-computer-server` over HTTP (`POST /cmd`). |

Both are fail-closed: tool-name format check, no shell, http(s)-only remote URL, remote errors surface as `{ok:false}` instead of throwing.

## Enable

### Local (host install, simplest)
- Install cua-driver (see https://github.com/trycua/cua): Windows PowerShell `irm https://cua.ai/driver/install.ps1 | iex`, macOS/Linux curl installer.
- Set `CUA_DRIVER` in `.env` if the binary is not on PATH.

### Remote (docker → host desktop via computer-server)
1. On the Windows host (interactive session), start the official computer-server exposing cua-driver:
   ```powershell
   pip install "cua-computer-server[driver]"
   python -m computer_server --backend cua-driver --capture-scope desktop --host 0.0.0.0 --port 8000
   ```
2. In the OpenClaw container set:
   ```env
   CUA_REMOTE=http://host.docker.internal:8000
   ```
3. `odsh.cua` / `odsh.visual` (no-path capture) now talk to the host desktop via HTTPS/HTTP JSON (`/cmd`), returning base64 screenshots persisted under `<tmpdir>/odsh-visual/`.

> Optionally register the remote MCP directly in OpenClaw (no ODSH-Native code needed):
> ```bash
> openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
> ```

## Tools

- `odsh.cua` — list-tools / get_desktop_state / click / keyboard / browser (CDP), background & focus-safe.
- `odsh.visual` — with no image path, grabs a live frame (local cua-driver or remote computer-server) and runs local OCR (tesseract).

## Security

- Tool-name format check (fail-closed) in `runtime/cua.mjs`; remote URL must be http(s); argv keys format-checked.
- Remote mode has **no built-in token in computer-server** — bind it locally or firewall to your docker subnet, or wrap in SSH.
- Config comes from the operator, not from untrusted envelopes.
