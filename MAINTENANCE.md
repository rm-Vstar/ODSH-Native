# Maintenance

Operational notes for keeping ODSH-Native healthy.

## Versioning (`docs/CHANGELOG.md`, package.json, openclaw.plugin.json)

- Semver: feature minor, bugfix/doc patch.
- Keep `package.json` and `openclaw.plugin.json` versions in lock-step.

## Release checklist

- [ ] `npm run check` → `ALL_SYNTAX_OK`
- [ ] `npm test` → `ALL SECURITY TESTS PASSED` + `ALL TESTS PASSED`
- [ ] `node scripts/build.mjs` → `dist/index.js` OK
- [ ] CHANGELOG entry + version bump
- [ ] commit as the project identity; push to `github.com/rm-Vstar/ODSH-Native`

## Known limitations

- `odsh.visual` has local OCR via tesseract + cua-driver capture; a **multimodal** description backend (external model) still needs work when no local OCR exists.
- `odsh.serve` remote mode needs a reachable `DSH_WORKER_ENDPOINT` (internal mode verified); remote auth via optional `DSH_WORKER_TOKEN`.
- Internal `odsh.serve` without a `cmd` reports `{ok:false}` by design (no in-process DSH task execution).
- Full host OpenClaw load (peer `openclaw` package + real session) not yet verified end-to-end in a host environment.

## Security post-hold

- Keep fail-closed: don't add shell-mode exec or broaden cua allowlist without a review.
- Re-run the security scan on every change that touches execution.
