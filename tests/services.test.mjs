// tests/services.test.mjs - B-class watcher/scheduler lifecycle
import { createWatcher } from "../src/services/watcher.mjs";
import { createScheduler } from "../src/services/scheduler.mjs";

export async function t_watcher_stop() {
  const w = createWatcher({ paths: [], handler: () => {} });
  await w.stop();
  return "watcher stop ok";
}

export async function t_scheduler_runs_and_stops() {
  let n = 0;
  const s = createScheduler([{ every: 5, run: () => { n++; } }]);
  await new Promise(res => setTimeout(res, 30));
  s.stop();
  if (n < 1) throw new Error("scheduler did not tick");
  return "scheduler ticked " + n + "x then stopped";
}
