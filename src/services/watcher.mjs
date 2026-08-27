// src/services/watcher.mjs - B-class: auto-watch dir/files; on change invoke handler
import { watch } from "node:fs";
export function createWatcher({ paths = [], handler = async () => {} } = {}) {
  const watchers = [];
  for (const p of paths) {
    try {
      const w = watch(p, { persistent: true }, (evt, filename) => {
        Promise.resolve(handler({ eventType: evt, filename, path: p })).catch(() => {});
      });
      watchers.push(w);
    } catch (e) { /* unwatchable */ }
  }
  return { stop() { for (const w of watchers) { try { w.close(); } catch {} } } };
}
