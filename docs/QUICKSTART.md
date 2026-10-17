# Quickstart
Get ODSH-Native running as an OpenClaw plugin.

## 1. Requirements
- Node 22.6+ (24/25 recommended; `--experimental-strip-types` requires ≥ 22.6).
- An OpenClaw host (provides the `openclaw` peer package).
- (optional) `cua-driver` for the `odsh.cua` tool.

## 2. Local validation (no host OpenClaw needed)
```bash
npm install --no-save openclaw@2026.7.1-2   # peer SDK for the load test
npm run check
npm test
npm run build                    # -> dist/index.js
```

## 3. Install into OpenClaw
Follow [integrations](INTEGRATIONS.md) for host-side installation and tool discovery.

## What you get
- `odsh.exec` — run a local command.
- `odsh.cua` — drive cua-driver (screenshot / click / browser).
- `odsh.visual` — describe a screenshot (local OCR via tesseract when available; otherwise returns an image path and backend guidance).
- `odsh.serve` — execute in a DSH Harness worker (internal/remote).
## Desktop prerequisites

Set desktop/worker variables in the host process environment before startup; see [configuration](CONFIGURATION.md). Local CUA needs a driver available to that process; remote CUA needs a reachable compatible computer-server. OCR uses local tesseract. For task-level coordination enable single-process mode and follow [acquire, renew and release](LEASES.md). The SDK tests load source and built entries with a mock host registration API; host installation remains a separate step.
