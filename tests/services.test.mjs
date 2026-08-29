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

export async function t_scheduler_sync_throw_does_not_crash() {
  // A handler that throws synchronously must not take down the host process;
  // a healthy task next to it must keep ticking.
  let n = 0;
  const s = createScheduler([
    { every: 5, run: () => { throw new Error('sync boom'); } },
    { every: 5, run: () => { n++; } },
  ]);
  await new Promise(res => setTimeout(res, 30));
  s.stop();
  if (n < 1) throw new Error("healthy task did not tick alongside a throwing task");
  return "scheduler survived sync throw; healthy task ticked " + n + "x";
}

export async function t_watcher_sync_throw_does_not_crash() {
  // A handler that throws synchronously on a fs.watch event must not crash the
  // process; a healthy watcher on the same file must still receive the event.
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'watcher-throw-'));
  const file = join(dir, 'f.txt');
  writeFileSync(file, '0');
  let n = 0;
  const w = createWatcher({ paths: [file], handler: () => { throw new Error('sync boom'); } });
  const w2 = createWatcher({ paths: [file], handler: () => { n++; } });
  writeFileSync(file, '1');
  await new Promise(res => setTimeout(res, 200));
  w.stop(); w2.stop();
  if (n < 1) throw new Error("healthy watcher did not receive the event");
  return "watcher survived sync throw; healthy watcher saw " + n + " event(s)";
}
