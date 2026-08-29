# CUA Execution

ODSH-Native drives desktop/vision via a **cua-driver**-compatible server. Two selectable modes keep
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

### Remote (docker → host desktop via computer-server) — host prerequisite: a port must be open

The Windows/macOS host must run a `cua-computer-server` and **expose its HTTP port** (default
`8000`) to the OpenClaw container. Without this server the plugin's remote mode answers
`{ok:false, error:"fetch failed"}` — the environment variable alone is not enough.

1. On the host (interactive session) install and start the server:

   **PyPI `cua-computer-server` 0.1.25** (verified 2026-08, openinterpreter line — ships the
   `POST /cmd` + SSE protocol ODSH-Native speaks, exactly; **no `[driver]` extra needed**):
   ```powershell
   pip install cua-computer-server
   python -m computer_server --host 0.0.0.0 --port 8000
   ```
   > ⚠️ The GitHub-mainline flags (`--backend cua-driver --capture-scope desktop`) and the
   > `[driver]` extra are **trycua 主线 only**; PyPI 0.1.25 rejects them (`error: unrecognized
   > arguments`). If you are on the GitHub mainline instead, use that invocation. Either way
   > `--host 0.0.0.0` is required so the container can reach the port.
   > `No module named 'win32api'` on Windows is only a warning; `pip install pywin32` silences it.

2. Verify the server before touching OpenClaw:
   ```powershell
   curl http://localhost:8000/status
   # {"status":"ok","os_type":"windows"}
   ```

3. In the OpenClaw **container** set the endpoint. `CUA_REMOTE` is read from the environment, so
   inject it via the OpenClaw config (e.g. `env.vars`). ⚠️ **A full container/process restart is
   required** — gateway hot-reload (SIGUSR1) does not re-read the environment, so the plugin
   would keep trying local mode (`spawn cua-driver ENOENT`).
   ```env
   CUA_REMOTE=http://host.docker.internal:8000
   ```
   How to tell which mode is live from an `odsh.cua` answer:
   - local mode → `{ok:false, error:"spawn cua-driver ENOENT"}`
   - remote mode, server down → `{ok:false, remote:true, error:"fetch failed"}` (env is live, start the server)
   - remote mode, working → `{ok:true, remote:true, ...}`

4. `odsh.cua` / `odsh.visual` (no-path capture) now talk to the host desktop via `POST /cmd`
   (SSE). `odsh.visual` keeps screenshots in `/dev/shm/odsh-visual` on Linux (tmpfs, in RAM — no
   persistent-disk writes; override with `ODSH_VISUAL_DIR`).

> Optionally register the remote MCP directly in OpenClaw (no ODSH-Native code needed):
> ```bash
> openclaw mcp set cua-driver '{"url":"http://host.docker.internal:8000/mcp","transport":"streamable-http"}'
> ```

## Command map — 0.1.25 vs trycua 主线

The two computer-server lines use **different command names**. ODSH-Native normalizes this:
`odsh.cua` forwards your tool name verbatim, while `odsh.visual`'s capture probes
`get_desktop_state` first and falls back to `screenshot` on a 4xx / no-image reply.

| Function | PyPI 0.1.25 (openinterpreter) | trycua 主线 |
|---|---|---|
| screen size | `get_screen_size` | `computer_get_screen_size` |
| screenshot | `screenshot` → `{success, image_data}` | `get_desktop_state` → `{success, images[]}` |
| unknown command | `400 {"detail":"Unknown command: xxx"}` | (varies) |

## Tools

- `odsh.cua` — image / click / keyboard / browser (CDP), background & focus-safe. Probes the
  local `cua-driver` or the remote computer-server depending on `CUA_REMOTE`.
- `odsh.visual` — with no image path, grabs a live frame (local cua-driver or remote
  computer-server), stores it under `/dev/shm/odsh-visual` (in RAM), then **OCR-fast-paths it**:
  when tesseract is installed the reply carries `text` immediately (no external vision model).

## Security

- Tool-name format check (fail-closed) in `runtime/cua.mjs`; remote URL must be http(s); argv keys format-checked.
- Remote mode has **no built-in token in computer-server** — bind it locally or firewall to your docker subnet, or wrap in SSH (see the host-prerequisite note above: the port must be reachable, so do not let it be reachable by rand).
- Config comes from the operator, not from untrusted envelopes.