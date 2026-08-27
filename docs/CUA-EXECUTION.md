# CUA Execution

ODSH-Native drives local desktop/vision via **cua-driver** (trycua/cua), spawned locally via the `odsh.cua` agent tool. Unlike the Docker edition, there is **no SSH tunnel and no focus-stealing**: cua-driver runs on the same host.

## Enable

- Install cua-driver (see https://github.com/trycua/cua): Windows PowerShell `irm https://cua.ai/driver/install.ps1 | iex`, macOS/Linux curl installer.
- Set `CUA_DRIVER` in `.env` if the binary is not on PATH.

## Tools

- `odsh.cua` — list-tools / screenshot / click / keyboard / browser (CDP), background & focus-safe.

## Security

- Tool-name whitelist (fail-closed) in `runtime/cua.mjs`.
- Runs on the local host only; config comes from the operator, not from untrusted envelopes.