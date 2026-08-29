# Configuration

ODSH-Native is configured through `.env` (see `.env.example`). The plugin manifest
(`openclaw.plugin.json`) declares an **empty** `configSchema`: all runtime knobs are
read from the environment — no plugin-config keys are wired yet.

## .env

| Key | Meaning | Default |
|---|---|---|
| `OC_HOST` | OpenClaw gateway host | `127.0.0.1` |
| `OC_PORT` | Gateway port | `18789` |
| `OC_TOKEN` | gateway.auth.token | _required_ |
| `OC_ORIGIN` | WS upgrade Origin (must be in gateway.allowedOrigins); empty = `http://<host>:<port>` | _(empty)_ |
| `OC_KEYS` | Ed25519 device JWK file | auto-generate first run |
| `OC_CONNECT_TIMEOUT_MS` | pairing/connect timeout | `45000` |
| `OC_REPLY_TIMEOUT_MS` | gateway request/reply timeout | `20000` |
| `DSH_WORKER_ENDPOINT` | Remote DSH worker (mode=remote); empty = internal. Must be `http(s)://`; plain http sends the Bearer token in cleartext — prefer https or localhost | _(empty)_ |
| `DSH_WORKER_TOKEN` | Bearer token sent to the remote worker (recommended when remote) | _(empty)_ |
| `CUA_DRIVER` | cua-driver binary | `cua-driver` |
| `CUA_REMOTE` | Remote cua-computer-server URL (docker → host desktop); empty = local cua-driver | _(empty)_ |

Notes:

- The former `ODSH_PLUGINS_DIR` / `ODSH_WATCH_*` / `ODSH_SCHEDULE_JSON` /
  `CUA_TIMEOUT_MS` keys were **removed**: nothing consumed them (the B-class
  watcher/scheduler and plugins-dir env knobs are not wired into the runtime yet).
  See CHANGELOG.

## Notes

- Never commit real tokens; keep `.env` gitignored.
- openclaw is a **peer** dependency (the host provides it).