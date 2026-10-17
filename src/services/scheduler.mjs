// src/services/scheduler.mjs - B-class: interval scheduler
export function createScheduler(tasks = []) {
  const timers = [];
  let stopped = false;
  for (const t of tasks) {
    if (!t || !t.run) continue;
    const ms = (typeof t.every === "number") ? t.every : (parseInt(t.every, 10) || 60000);
    let inFlight = false;
    timers.push(setInterval(async () => {
      // Skip busy ticks per task; stopping prevents admission, not active work.
      if (stopped || inFlight) return;
      inFlight = true;
      try { await t.run(); }
      catch (e) { console.warn('[scheduler] task error:', e?.message || e); }
      finally { inFlight = false; }
    }, ms));
  }
  return { stop() { stopped = true; for (const id of timers) clearInterval(id); } };
}
