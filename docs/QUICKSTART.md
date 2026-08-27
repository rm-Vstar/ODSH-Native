# Quickstart
Get ODSH-Native running as an OpenClaw plugin.

## 1. Requirements
- Node 18+ (24+ recommended for `--experimental-strip-types`).
- An OpenClaw host (provides the `openclaw` peer package).
- (optional) `cua-driver` for the `odsh.cua` tool.

## 2. Local validation (no host OpenClaw needed)
```bash
npm install --no-save openclaw@2026.7.1-2   # peer SDK for the load test
npm run check
npm test
node scripts/build.mjs                    # -> dist/index.js
```

## 3. Install into OpenClaw
Follow docs/INTEGRATIONS for host-side install and verifying via /tools.

## What you get
- `odsh.exec` — run a local command.
- `odsh.cua` — drive cua-driver (screenshot / click / browser).
- `odsh.visual` — describe a screenshot (OCR stubbed).
- `odsh.serve` — execute in a DSH Harness worker (internal/remote).