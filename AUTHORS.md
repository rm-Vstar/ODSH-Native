# Authors

ODSH-Native is a host-side evolution of the ODSH-Bridge integration between
**DeepSeek Harness (DSH)** and **OpenClaw**: it rebundles DSH's execution and
plugin/capability surface as a first-class OpenClaw plugin.

## Author

- **rm-Vstar** — author / maintainer
  - Refactored ODSH-Native from a standalone bridge into a native OpenClaw plugin
    (`openclaw/plugin-sdk/tool-plugin` `defineToolPlugin`), A-class agent tools
    (exec/cua/visual/serve) and B-class resident services (watcher/scheduler + DSH
    worker bridge).
  - Verified plugin load + register + round-trip execution under the real OpenClaw SDK.
  - Host-side fix for Windows ESM plugin loading (`pathToFileURL`).
