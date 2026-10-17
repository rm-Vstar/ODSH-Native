// One desktop per Node process. Bearer capability, NOT a session identity.
import { randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
let holder = null;
let quarantined = false;
const fail = error => ({ ok: false, error: 'lease: ' + error });
function mode() { return process.env.ODSH_LEASE_MODE || 'off'; }
function ttl(value = 30000) {
  if (!Number.isInteger(value) || value < 150 || value > 300000) throw new Error('ttlMs must be an integer in [150, 300000]');
  return value;
}
function valid(token) {
  return holder && typeof token === 'string' && token === holder.token && performance.now() < holder.deadline;
}
function view() {
  return { ok: true, resource: 'desktop', owner: holder.owner, token: holder.token,
    expiresAt: Date.now() + Math.max(0, holder.deadline - performance.now()), ttlMs: holder.ttlMs };
}
export function leaseCommand({ action, owner, token, ttlMs } = {}) {
  if (mode() !== 'single-process') return fail('requires ODSH_LEASE_MODE=single-process');
  if (quarantined) return fail('resource quarantined; operator must confirm all work stopped before process restart');
  try {
    if (action === 'acquire') {
      if (holder && (holder.active || performance.now() < holder.deadline)) return fail('desktop busy');
      if (typeof owner !== 'string' || !owner.trim() || owner.length > 200) return fail('owner label required (max 200 characters)');
      const duration = ttl(ttlMs);
      holder = { owner, token: randomBytes(32).toString('hex'), ttlMs: duration, deadline: performance.now() + duration, active: false };
      return view();
    }
    if (!valid(token)) return fail('missing, expired or stale token');
    if (action === 'renew') {
      const duration = ttl(ttlMs ?? holder.ttlMs);
      holder.ttlMs = duration; holder.deadline = performance.now() + duration;
      return view();
    }
    if (action === 'release') {
      if (holder.active) return fail('execution still active');
      holder = null; return { ok: true, released: true };
    }
    return fail('unknown action');
  } catch (e) { return fail(e.message); }
}
// Keep task ownership across calls; auto-renew ONLY during actual execution.
// Any backend failure is conservatively ambiguous: quarantine rather than unsafe takeover.
export async function withDesktopLease(token, operation) {
  if (mode() === 'off') return operation();
  if (mode() !== 'single-process') return fail('invalid ODSH_LEASE_MODE');
  if (quarantined) return fail('resource quarantined');
  if (!valid(token)) return fail('missing, expired or stale token');
  if (holder.active) return fail('execution still active');
  const current = holder;
  current.active = true;
  // Renew on admission before dispatch; the first heartbeat may outlive the old deadline.
  current.deadline = performance.now() + current.ttlMs;
  let lost = false;
  const timer = setInterval(() => {
    if (!valid(token)) { lost = true; return; }
    current.deadline = performance.now() + current.ttlMs;
  }, Math.max(25, Math.floor(current.ttlMs / 3)));
  timer.unref();
  try {
    const result = await operation();
    if (lost || !valid(token)) { quarantined = true; return fail('ownership lost during execution; outcome uncertain, resource quarantined'); }
    if (!result || result.ok !== true) {
      quarantined = true;
      return { ...result, ok: false, leaseQuarantined: true,
        leaseNote: 'Outcome may be uncertain; no takeover until operator confirms all work stopped and restarts process.' };
    }
    return result;
  } catch (e) {
    quarantined = true; return fail('execution outcome uncertain: ' + e.message);
  } finally { clearInterval(timer); current.active = false; }
}
