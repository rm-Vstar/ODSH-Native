# Configuration

ODSH-Native reads the host process environment (see .env.example). It does not automatically load .env. Export variables before starting OpenClaw, configure the service/container environment, or use Node --env-file=.env when launching a standalone CLI. Copying the example alone has no effect.
The plugin manifest (`openclaw.plugin.json`) declares an **empty** `configSchema`: all runtime knobs are
read from the environment — no plugin-config keys are wired yet.

Exception: the standalone src/gateway/bridge.mjs CLI explicitly loads .env from its current working directory (OC_ENV_FILE overrides the path); existing process variables win. The OpenClaw plugin entry and direct gateway-client imports do not invoke that loader.

## .env

| Key | Meaning | Default |
|---|---|---|
| `OC_HOST` | OpenClaw gateway host | `127.0.0.1` |
| `OC_PORT` | Gateway port | `18789` |
| `OC_TOKEN` | gateway.auth.token | _required_ |
| `OC_ORIGIN` | WS upgrade Origin (must be in gateway.controlUi.allowedOrigins); empty = `http://<host>:<port>` | _(empty)_ |
| `OC_KEYS` | Ed25519 device JWK file | auto-generate first run |
| `OC_CONNECT_TIMEOUT_MS` | pairing/connect timeout | `45000` |
| `OC_REPLY_TIMEOUT_MS` | gateway request/reply timeout | `20000` |
| `DSH_WORKER_ENDPOINT` | Remote DSH worker (mode=remote); empty = internal. Must be `http(s)://`; plain http sends the Bearer token in cleartext — prefer https or localhost | _(empty)_ |
| `DSH_WORKER_TOKEN` | Bearer token sent to the remote worker (recommended when remote) | _(empty)_ |
| `CUA_DRIVER` | cua-driver binary | `cua-driver` |
| `CUA_REMOTE` | Remote cua-computer-server URL (docker → host desktop); empty = local cua-driver | _(empty)_ |
| TESSERACT_BIN | Local OCR executable | tesseract |
| ODSH_VISUAL_DIR | Capture directory; local driver must write frames here | Linux /dev/shm/odsh-visual when available, otherwise OS temp directory + /odsh-visual |
| ODSH_LEASE_MODE | Desktop coordination: off or single-process | off |
| OPENCLAW_BIN | Standalone clean-exec executable | openclaw |
| OC_ENV_FILE | Environment file loaded by standalone bridge | .env in working directory |
| ODSH_WS_KEEPALIVE_MS | Gateway ping interval in ms; 0 disables | 4000 |

Gateway variables apply to the standalone gateway client, not native plugin registration. Restart the host process after desktop/worker environment changes. Store credentials in the host secret configuration.

## Desktop task leases

Optional `ODSH_LEASE_MODE=single-process` requires task credentials for CUA/visual; default off is compatible. Single-process only; uncertain in-flight work is quarantined, never automatically taken over. See [configuration, workflow and limits](LEASES.md).
