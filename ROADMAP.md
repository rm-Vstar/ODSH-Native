# Roadmap

> Phase-gated plan for ODSH-Native. Nothing ships without the security tests passing.

## Phase 0 - Host-hardening (current)

- [x] Native OpenClaw plugin skeleton (A-class agent tools + B-class resident services).
- [x] Real OpenClaw plugin-sdk load + round-trip validation.
- [ ] Full host OpenClaw install & verify via /tools.
- [x] `odsh.visual` local OCR via tesseract + cua-driver capture (truthful no-render note when no backend).
- [ ] `odsh.visual` multimodal description backend (external model) for when no local OCR exists.
- [x] ClawHub publish as an installable plugin package (`clawhub:odsh-native`, v2.0.2+).

## Phase 1 - DSH Harness hosting

- [ ] `odsh.serve` remote mode against a real DSH/Cordis worker (DSH_WORKER_ENDPOINT E2E).
- [ ] Wire the resident watcher/scheduler helpers (`startResidentServices`) into the plugin
      lifecycle so B-class services actually start on install (currently library-only).

## Phase 2 - Ecosystem

- [x] Publish to ClawHub (`openclaw plugins install clawhub:odsh-native`) — done in v2.0.2.
- [x] Example DSH-style plugins in `plugins/` (example-plugin).
- [ ] More example plugins + community docs.

## Decision rules

1. Security scan (`npm test`) must be green before release.
2. `openclaw` stays a peer dependency (host-provided); never bundle it.
3. Non-goal: do not rebuild a second LLM or the Docker file-envelope bridge.