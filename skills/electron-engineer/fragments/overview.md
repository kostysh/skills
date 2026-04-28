Production Electron work is desktop platform engineering, not only a web app in a shell. Treat Electron as a security-sensitive runtime with browser content, Node capabilities, native OS integration, a local install footprint, and a supply-chain-sensitive updater.

Default to a thin main process, an untrusted renderer, a minimal capability-based preload, typed IPC with runtime validation, explicit navigation policy, signed release artifacts, and regular Electron major upgrades.

## Default Architecture

Use paths and package boundaries to make trust boundaries obvious:

```text
src/
  main/
    bootstrap.ts
    windows/
    ipc/
    protocols/
    services/
    security/
    updates/
    observability/
  preload/
    index.ts
    bridges/
  renderer/
    app/
    features/
    routes/
    components/
  shared/
    ipc/
    contracts/
    schemas/
    errors/
    types/
```

Keep privileged logic in main-owned services. Keep preload thin and role-specific. Keep renderer code browser-safe. Keep shared contracts serializable and free of Electron main dependencies.

## Safe Defaults

For normal app renderers:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` when feasible
- `webviewTag: false` unless a reviewed embed feature requires it
- deny popups and arbitrary navigation
- strict production CSP
- no production fallback to `localhost`
- no raw `ipcRenderer` or generic bridge exposed to renderer

## Tooling Defaults

Use the canonical split from [Build Process](references/build-process.md): electron-vite owns dev/preview/build for main, preload, and renderer source; Electron Forge owns package/make/publish for distributable artifacts. Use another build or packaging stack only when the existing project already commits to it or a documented product constraint requires it.

## Reference Navigation

Read only the reference needed for the task:

| Task | Reference |
| --- | --- |
| Process boundaries, windows, sessions, custom protocols | [Architecture](references/architecture.md) |
| BrowserWindow security, IPC, preload, navigation, CSP | [Security, IPC, and Preload](references/security-ipc-preload.md) |
| Project layout, package boundaries, ESM/CJS | [Tooling and Project Structure](references/tooling-project-structure.md) |
| End-to-end build pipeline | [Build Process](references/build-process.md) |
| React/Vite renderer, routing, dev/prod origins | [Renderer Integration](references/renderer-integration.md) |
| Files, config, secrets, SQLite, native modules | [Data, Storage, and Native Integration](references/data-storage-native.md) |
| Testing, packaged smoke, logs, crash reporting | [Testing and Observability](references/testing-observability.md) |
| ASAR, fuses, signing, notarization, updates, CI | [Packaging, Release, and Updates](references/packaging-release-updates.md) |
| Reducing source exposure in distributed apps | [Source Protection](references/source-protection.md) |
| Reviews, migrations, release checklists, playbooks | [Review Playbooks](references/review-playbooks.md) |
