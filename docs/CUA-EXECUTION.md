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
- Set `CUA_DRIVER` in the host environment if the binary is not on PATH.

### Remote desktop

Run a compatible computer-server in an interactive desktop session. Its HTTP endpoint must be reachable from the plugin host and restricted to trusted clients. Configure CUA_REMOTE in the OpenClaw service/container environment before startup, then restart that process. Use the server version’s documented installation and launch options.

The plugin calls POST /cmd and parses SSE responses. odsh.cua forwards command names unchanged; choose names supported by your backend. odsh.visual tries get_desktop_state and then screenshot. The plugin sends no CUA authentication header; protect access with network controls or an authenticated proxy compatible with this client.

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

- `odsh.cua` — image / click / keyboard / browser (CDP), focus behavior depends on the backend and command. Probes the
  local `cua-driver` or the remote computer-server depending on `CUA_REMOTE`.
- `odsh.visual` — with no image path, grabs a live frame (local cua-driver or remote
  computer-server), stores it in the configured capture directory, then **OCR-fast-paths it**:
  when tesseract is installed the reply carries `text` immediately (no external vision model).

## Security

- Tool-name format check (fail-closed) in `runtime/cua.mjs`; remote URL must be http(s); argv keys format-checked.
- Restrict remote desktop access to trusted callers; the plugin does not provide desktop-server authentication.
- Config comes from the operator, not from untrusted envelopes.
## Capture storage and coordination

Linux uses /dev/shm/odsh-visual when /dev/shm exists; other systems use the OS temporary directory. ODSH_VISUAL_DIR overrides this selection. Configure the local driver to write frames into the same directory: capture accepts only images created or changed during that call. Shared-directory concurrent captures are not associated with a specific producer. The plugin retains captured files; configure access permissions and cleanup according to your retention policy. Optional [desktop leases](LEASES.md) coordinate guarded calls in one loaded module in one Node process, including file-only OCR.
