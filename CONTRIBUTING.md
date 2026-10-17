# Contributing

Thanks for helping ODSH-Native.

## Dev loop

```bash
npm run check      # syntax: all JS/TS
npm test           # security scan + unit + real-SDK plugin-load tests
node scripts/build.mjs  # emit dist/index.js
```

## Standards (aligned with ODSH-Bridge for Docker)

- Keep English and Chinese reader guides aligned; architecture and maintainer references may remain single-language.
- Keep bins/env fail-closed: shell-free argument arrays, CUA tool/key format checks, registry path containment and operator-managed secrets. These checks are not a sandbox.
- Every behavior change: bump version, add CHANGELOG entry.
- Each release runs `npm run check` + `npm test` (`ALL_SYNTAX_OK` / `ALL TESTS PASSED`).

## Code of conduct

Be respectful; security reviews are mandatory for anything that expands execution.
