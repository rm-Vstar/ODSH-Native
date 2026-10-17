# Operations

## Run

- `npm run check` — recursively syntax-check JS/TS, excluding dependency, VCS and build directories.
- `npm test` — unit tests + real-SDK plugin-load tests (report SKIP when peer `openclaw` is absent; SUMMARY counts passed, skipped and failed cases).
- `node scripts/build.mjs` — emit `dist/index.js` (runtimeExtensions artifact).

## Security

- Fail-closed: shell-free `execFile` (no shell) in `src/runtime/exec.mjs`, tool-name format check in `src/runtime/cua.mjs`, plugin `impl` path containment + symlink-escape rejection in `src/registry.mjs`, optional `DSH_WORKER_TOKEN` Bearer auth for remote worker (endpoint must be http(s)://).
- Keep credentials in the host secret configuration. The repository security scan detects selected secret/identifier patterns; review changes before release.
- `openclaw` is supplied by the host (peer), never bundled.

## Troubleshooting

- **Plugin not loading** → ensure the `openclaw` peer package is present on the host; check `/tools`.
- **Windows ESM path error** → plugin uses `pathToFileURL` for directory resolution (cross-platform).
- **`odsh.serve` remote fails** → set `DSH_WORKER_ENDPOINT` to a reachable HTTP worker.
## Desktop task leases

Optional `ODSH_LEASE_MODE=single-process` requires task credentials for CUA/visual; default off is compatible. Single-process only; uncertain in-flight work is quarantined, never automatically taken over. See [configuration, workflow and limits](LEASES.md).

Commands execute with host permissions; shell-free execution and name-format checks are not a sandbox. Screenshot files require access controls and a retention policy; storage may be tmpfs or a filesystem directory.
