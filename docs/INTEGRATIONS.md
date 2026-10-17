# Integrations

## As an OpenClaw plugin (recommended)

1. Add ODSH-Native to the OpenClaw plugin roots (install the complete built checkout, including src/, dist/ and both manifests, into a plugin directory, or publish and `openclaw plugins install`).
2. Verify `/tools` lists `odsh.exec`, `odsh.cua`, `odsh.visual`, `odsh.serve`, `odsh.lease`.
3. `npm run check` + `npm test` run the self-tests.

## Install from ClawHub (published)

The plugin is **published to ClawHub** as `odsh-native`:

```bash
openclaw plugins install clawhub:odsh-native --acknowledge-clawhub-risk
```

`--acknowledge-clawhub-risk` confirms the release-scan's `suspicious` trust label, which is expected for a high-privilege local-exec/desktop plugin (fail-closed by design). Verify via `/tools`.

## Cua desktop/vision

- `odsh.cua` spawns cua-driver locally or uses the configured remote computer-server.
- Desktop availability, permissions and focus behavior depend on the backend and command; see [desktop execution](CUA-EXECUTION.md).

## DSH Harness worker bridge

- `odsh.serve` runs internal (local subprocess) or remote (HTTP `DSH_WORKER_ENDPOINT`, e.g. a DSH/Cordis worker).