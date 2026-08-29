# Operations

## Run

- `npm run check` — syntax-check all JS/TS (recursive, cross-platform).
- `npm test` — unit tests + real-SDK plugin-load tests (gracefully skip when peer `openclaw` is absent).
- `node scripts/build.mjs` — emit `dist/index.js` (runtimeExtensions artifact).

## Security

- Fail-closed: shell-free `execFile` (no shell) in `runtime/exec.mjs`, tool-name format check in `runtime/cua.mjs`, plugin `impl` path containment + symlink-escape rejection in `registry.mjs`, optional `DSH_WORKER_TOKEN` Bearer auth for remote worker (endpoint must be http(s)://).
- No real tokens/keys committed; `tests/security.test.mjs` blocks tracked personal identifiers & secrets.
- `openclaw` is supplied by the host (peer), never bundled.

## Troubleshooting

- **Plugin not loading** → ensure the `openclaw` peer package is present on the host; check `/tools`.
- **Windows ESM path error** → plugin uses `pathToFileURL` for directory resolution (cross-platform).
- **`odsh.serve` remote fails** → set `DSH_WORKER_ENDPOINT` to a reachable HTTP worker.