# Integrations

## As an OpenClaw plugin (recommended)

1. Add ODSH-Native to the OpenClaw plugin roots (copy `src/`, `openclaw.plugin.json`, `package.json` into a plugin dir, or publish and `openclaw plugins install`).
2. Verify `/tools` lists `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve`.
3. `npm run check` + `npm test` run the self-tests.

## Install from ClawHub (published)

The plugin is **published to ClawHub** as `odsh-native`:

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

`--acknowledge-clawhub-risk` confirms the release-scan's `suspicious` trust label, which is expected for a high-privilege local-exec/desktop plugin (fail-closed by design). Verify via `/tools`.

## Cua desktop/vision

- `odsh.cua` spawns `cua-driver` locally (trycua/cua).
- Supports Windows / macOS / Linux background computer use without stealing focus.

## DSH Harness worker bridge

- `odsh.serve` runs internal (local subprocess) or remote (HTTP `DSH_WORKER_ENDPOINT`, e.g. a DSH/Cordis worker).