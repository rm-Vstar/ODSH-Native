# Roadmap

> Phase-gated plan for ODSH-Native. Nothing ships without the security tests passing.

## Phase 0 - Host-hardening (current)

- [x] Native OpenClaw plugin skeleton (A-class agent tools + B-class resident services).
- [x] Real OpenClaw plugin-sdk load + round-trip validation.
- [ ] Full host OpenClaw install & verify via /tools.
- [x] `odsh.visual` local OCR via tesseract + cua-driver capture (truthful no-render note when no backend).
- [ ] `odsh.visual` multimodal description backend (external model) for when no local OCR exists.
- [ ] ClawHub publish as an installable plugin package.

## Phase 1 - DSH Harness hosting

- [ ] `odsh.serve` remote mode against a real DSH/Cordis worker (DSH_WORKER_ENDPOINT E2E).
- [ ] Bidirectional bridge conventions (currently plugin → DSH worker).

## Phase 2 - Ecosystem

- [ ] Publish to ClawHub; `openclaw plugins install clawhub:odsh-native`.
- [ ] Example DSH-style plugins in `plugins/`.

## Decision rules

1. Security scan (`npm test`) must be green before release.
2. `openclaw` stays a peer dependency (host-provided); never bundle it.
3. Non-goal: do not rebuild a second LLM or the Docker file-envelope bridge.