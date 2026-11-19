Production Electron work is desktop platform engineering, not only a web app in a shell. Treat Electron as a security-sensitive runtime with browser content, Node capabilities, native OS integration, a local install footprint, and a supply-chain-sensitive updater.

Default to a thin main process, an untrusted renderer, a minimal capability-based preload, typed IPC with runtime validation, explicit navigation policy, signed release artifacts, and version-aware maintenance. Preserve the installed supported branch; upgrade only within the requested task.

Use the first boundary-safe desktop surface: built-in Electron APIs, native OS behavior, and existing main-owned services come before new abstraction layers or renderer-facing wrappers.

## Version and Evidence Boundary

Inspect the project's Electron and build-tool versions, package manager, OS and architecture before choosing APIs. Keep the installed supported branch unless the task calls for an upgrade. For example, Electron 44 raised the macOS minimum to 13 and stopped publishing Windows x86 and Linux armv7l binaries. Check the distribution targets before changing majors.

Check build tools against the host Node version. Electron 45.0.0's npm installer requires Node >=22.12.0 and Forge CLI 8.0.1 requires >=22.13.0. Electron 45.0.0 itself embeds Node 24.22.0. Both electron-vite 5.0.0 and 6.0.0 declare Node `^20.19.0 || >=22.12.0`. Their Vite peers are 5–7 and 6–8 respectively. Use a supported host Node LTS that meets the installed tools' requirements.

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

Use the canonical split from [Build Process](references/build-process.md): electron-vite owns dev/preview/build for main, preload, and renderer source; Electron Forge packages the built app, makes distributables, and handles publication. Use another build or packaging stack only when the existing project already commits to it or a documented product constraint requires it.

## Reference Navigation

Read only the reference needed for the task:

| Task | Reference |
| --- | --- |
| Process boundaries, windows, sessions, custom protocols | [Architecture](references/architecture.md) |
| BrowserWindow security, IPC, preload, navigation, CSP | [Security, IPC, and Preload](references/security-ipc-preload.md) |
| Project layout, package boundaries, ESM/CJS | [Tooling and Project Structure](references/tooling-project-structure.md) |
| TypeScript across main, preload, renderer, shared contracts | [TypeScript in Electron](references/typescript-in-electron.md) |
| End-to-end build pipeline | [Build Process](references/build-process.md) |
| React/Vite renderer, routing, dev/prod origins | [Renderer Integration](references/renderer-integration.md) |
| Menus, tray, shortcuts, dialogs, downloads, native OS features | [Native OS Integration](references/native-os-integration.md) |
| Files, config, secrets, SQLite, native modules | [Data, Storage, and Native Integration](references/data-storage-native.md) |
| Testing, packaged smoke, logs, crash reporting | [Testing and Observability](references/testing-observability.md) |
| ASAR, fuses, signing, notarization, updates, CI | [Packaging, Release, and Updates](references/packaging-release-updates.md) |
| Reducing source exposure in distributed apps | [Source Protection](references/source-protection.md) |
| Reviews, migrations, release checklists, playbooks | [Review Playbooks](references/review-playbooks.md) |
