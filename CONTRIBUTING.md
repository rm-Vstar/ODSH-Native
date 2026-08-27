# Contributing

Thanks for helping ODSH-Native.

## Dev loop

```bash
npm run check      # syntax: all JS/TS
npm test           # security scan + unit + real-SDK plugin-load tests
node scripts/build.mjs  # emit dist/index.js
```

## Standards (aligned with ODSH-Bridge for Docker)

- English is primary; provide `.zh.md` alongside any `docs/*.md`.
- Keep bins/env fail-closed: argv allowlist, tool-name whitelists, no real secrets.
- Every behavior change: bump version, add CHANGELOG entry.
- Each release runs `npm run check` + `npm test` (`ALL_SYNTAX_OK` / `ALL TESTS PASSED`).

## Code of conduct

Be respectful; security reviews are mandatory for anything that expands execution.
