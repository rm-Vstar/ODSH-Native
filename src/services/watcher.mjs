// src/services/watcher.mjs - B-class: auto-watch dir/files; on change invoke handler
import { watch } from "node:fs";
export function createWatcher({ paths = [], handler = async () => {} } = {}) {
  const watchers = [];
  for (const p of paths) {
    try {
      const w = watch(p, { persistent: true }, (evt, filename) => {
        // A handler that throws synchronously must not take down the host process:
        // isolate the call, log the failure, keep watching.
        try { Promise.resolve(handler({ eventType: evt, filename, path: p })).catch((e) => console.warn('[watcher] handler error:', e?.message || e)); }
        catch (e) { console.warn('[watcher] handler threw synchronously:', e?.message || e); }
      });
      watchers.push(w);
    } catch (e) { /* unwatchable */ }
  }
  return { stop() { for (const w of watchers) { try { w.close(); } catch {} } } };
}
