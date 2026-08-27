// src/services/scheduler.mjs - B-class: interval scheduler
export function createScheduler(tasks = []) {
  const timers = [];
  for (const t of tasks) {
    if (!t || !t.run) continue;
    const ms = (typeof t.every === "number") ? t.every : (parseInt(t.every, 10) || 60000);
    timers.push(setInterval(() => { Promise.resolve(t.run()).catch(() => {}); }, ms));
  }
  return { stop() { for (const id of timers) clearInterval(id); } };
}
