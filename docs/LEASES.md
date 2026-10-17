# Desktop task leases

## Configuration and workflow

Default `ODSH_LEASE_MODE=off` preserves existing behavior (no locking). Set `ODSH_LEASE_MODE=single-process` in the host environment **before startup** to require credentials for runtime and legacy CUA/visual calls. Other nonempty values fail closed. This is an explicit single-Node-process deployment assertion, not a distributed lock. Do not change mode during tasks. Plugin config keys are not used.

1. Call `odsh.lease` with `{"action":"acquire","owner":"my-task-label","ttlMs":30000}`. The result contains `token`, `owner`, `resource:"desktop"`, `ttlMs`, and informational wall-clock `expiresAt`.
2. Pass that secret as `leaseToken` on **every** `odsh.cua` and `odsh.visual` call, throughout the entire multi-step task. Lease ownership persists between calls, not just during a click. All visual calls, even file-only OCR, conservatively share this resource.
3. During reasoning/idle gaps call `odsh.lease` with `{"action":"renew","token":"<token>"}` before expiry. Optional `ttlMs` changes the duration. Default 30000 ms, range 150–300000 ms. No automatic idle renewal: abandoned tasks must expire.
4. Finish with `{"action":"release","token":"<token>"}`. Release during active execution is refused. Never log or share the token; owner is an untrusted diagnostic label, not session identity. 

The lease manager uses monotonic expiry, random 256-bit bearer tokens and execution-time renewal. Concurrent calls are rejected, not queued, even with the same token. Retry busy errors only after the active call finishes. Stale tokens cannot revive or release a replacement lease. Credentials are not forwarded to HTTP servers or driver arguments.

## Recovery and limits

Idle expiry allows acquisition only when no execution is active. During execution automatic renewal stops on loss; a post-execution check refuses protected success after expiry/loss. Every backend failure is conservatively quarantined, including potentially harmless validation/OCR errors: safety is preferred to availability. `leaseQuarantined` marks backend-result quarantine. Quarantine blocks renew/release/acquire/execution for the process lifetime; there is intentionally no automatic reset command. A hung operation stays busy indefinitely. An operator must verify/stop old local children and remote work **before restarting**. A network timeout or HTTP response is not remote fencing or proof that detached effects stopped. Restart itself does not make takeover safe.

Guarantees cover cooperative guarded calls in one loaded Module in one Node process only. Multiple processes, worker isolates, duplicate package copies, other plugins, manual desktop use, direct HTTP/driver access, arbitrary `odsh.exec`/`odsh.serve` commands and discovered third-party registry tools can bypass it. Restrict these capabilities and external desktop writers separately. No crash-persistent quarantine, cross-process arbitration, remote fencing, rollback, exactly-once execution, idempotency or protection against irreversible effects is promised. A bearer token is not tenant authentication; callers sharing it share authority. Do not enable this mode for independent processes controlling the same desktop.

## Renewal failure

If renewal fails, stop dispatching new desktop steps. An expired or replaced token requires a new acquisition: first confirm that the previous operation has finished, then acquire a lease and re-read desktop state before continuing. For quarantine, follow the operator recovery above. A timed-out action may already have produced side effects; confirm its outcome before retrying.
