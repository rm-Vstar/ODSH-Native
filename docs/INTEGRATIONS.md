# Integrations

## As an OpenClaw plugin (recommended)

1. Add ODSH-Native to the OpenClaw plugin roots (copy `src/`, `openclaw.plugin.json`, `package.json` into a plugin dir, or publish and `openclaw plugins install`).
2. Verify `/tools` lists `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve`.
3. `npm run check` + `npm test` run the self-tests.

## ClawHub / package publish (future)

- Bundle as a plugin package and publish to ClawHub; `openclaw plugins install clawhub:<pkg>`.
- Not yet published (see docs/OPERATIONS).

## Cua desktop/vision

- `odsh.cua` spawns `cua-driver` locally (trycua/cua).
- Supports Windows / macOS / Linux background computer use without stealing focus.

## DSH Harness worker bridge

- `odsh.serve` runs internal (local subprocess) or remote (HTTP `DSH_WORKER_ENDPOINT`, e.g. a DSH/Cordis worker).