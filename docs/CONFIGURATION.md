# Configuration

ODSH-Native is configured through `.env` (see `.env.example`) and the OpenClaw plugin `configSchema` (openclaw.plugin.json).

## .env

| Key | Meaning | Default |
|---|---|---|
| `OC_HOST` | OpenClaw gateway host | `127.0.0.1` |
| `OC_PORT` | Gateway port | `18789` |
| `OC_TOKEN` | gateway.auth.token | _required_ |
| `OC_KEYS` | Ed25519 device JWK file | auto-generate first run |
| `DSH_WORKER_ENDPOINT` | Remote DSH worker (mode=remote); empty = internal | _(empty)_ |
| `CUA_DRIVER` | cua-driver binary | `cua-driver` |

## Plugin config (openclaw.plugin.json configSchema)

- `watch.enabled` / `watch.paths` — B-class auto-watch
- `schedule` — B-class interval tasks
- `pluginsDir` — DSH-style tool plugins dir (default `plugins`)

## Notes

- Never commit real tokens; keep `.env` gitignored.
- openclaw is a **peer** dependency (the host provides it).