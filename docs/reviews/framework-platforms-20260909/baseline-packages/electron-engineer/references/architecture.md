# Architecture

Use this reference when designing process boundaries, windows, sessions, custom protocols, crash boundaries, offline-first behavior, or multi-window architecture.

## Trust Model

Model Electron as four cooperating boundaries:

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Main process | app lifecycle, windows, native OS integration, IPC handlers, protocols, storage, updater, observability | React state, view rendering, long synchronous CPU or filesystem work |
| Preload | minimal capability facade between isolated renderer and main | raw Electron objects, generic IPC, service locator APIs, broad filesystem or shell primitives |
| Renderer | UI, view state, user interaction, browser-safe client code | secrets, authorization decisions, direct filesystem writes, signing, updater, shell execution |
| Utility or worker process | isolated CPU-heavy or crash-prone work | unclear ownership or hidden privileged service surface |

The renderer is untrusted even when it only loads packaged UI. XSS, unsafe dependencies, compromised imported files, or renderer logic bugs must not become privileged desktop actions.

## Main Process Shape

Keep main process thin:

- bootstrap app lifecycle and single-instance behavior
- create and register windows
- register protocols before `app.whenReady()`
- register IPC handlers centrally
- delegate business work to services
- initialize logging, crash reporting, updater, and native integrations

Do not let windows construct their own privileged policy ad hoc. A main-owned registry should track window roles, webContents IDs, allowed origins, session partitions, and cleanup hooks.

## App Lifecycle and Activation

Create windows and use UI APIs only after Electron is ready. Register protocol privileges and early launch handlers before `app.whenReady()` when the platform requires it.

Define lifecycle policy before coding:

- single instance or multi-instance behavior
- second launch behavior for files, URLs, and launcher actions
- macOS `open-file`, `open-url`, and `activate` behavior
- Windows/Linux argv handling for file opens and launcher actions
- tray-only or background behavior when all windows close
- explicit quit path and cleanup for background services

Use `requestSingleInstanceLock()` when deep links, file opens, updater flows, tray state, or shared local resources require a single app authority. Normalize all launch inputs in main and route only validated commands to window roles. Raw argv, file paths, and URLs are not authorization.

## Window Ownership

Use `BrowserWindow` for app shell windows. Prefer `WebContentsView` for new embedded-content composition when the project needs view-level composition; treat older `BrowserView` code as migration-review material during Electron upgrades.

Every privileged window should define:

- explicit `webPreferences`
- preload path
- allowed internal origin
- navigation and popup policy
- crash or unresponsive recovery path
- listener cleanup ownership

For multi-window apps, synchronize through main-owned events or persisted domain state. Avoid renderer-to-renderer hidden coupling.

## Embedded Contexts

Choose embedded content by trust and control needs:

| Need | Preferred option |
| --- | --- |
| Standard web embed with browser sandbox semantics | sandboxed `iframe` |
| Main-controlled embedded page with its own `webContents` | `WebContentsView` |
| Legacy compatibility with existing `<webview>` code | reviewed exception only |

Embedded remote content must use isolated sessions and no privileged preload. Use [Security, IPC, and Preload](security-ipc-preload.md) for permission, navigation, and `<webview>` validation policy.

## Sessions and Remote Content

Use separate `session` partitions for:

- trusted packaged app UI
- remote or untrusted content
- authentication or browser-like embedded flows
- temporary/private windows

Remote content should not share the privileged app session and should not receive a preload exposing app capabilities. If remote content needs to communicate with the app, design a small, audited protocol rather than exposing desktop APIs.

## Heavy Work Isolation

Main coordinates desktop services; it should not run long CPU-bound work, crash-prone native code, or untrusted plugins on the UI-critical path.

Use this decision model:

| Workload | Preferred boundary |
| --- | --- |
| Browser-safe UI computation | renderer worker |
| Node-side CPU or crash-prone work | `utilityProcess` or a dedicated service process |
| Native addon work | main or utility process only after worker safety is proven |
| Large or frequent payloads | `MessagePort`, streaming, or shared persisted state instead of chatty IPC |

Prefer `utilityProcess` over `child_process.fork` for Electron-owned Node-side isolation when production fuses may disable run-as-node behavior. Track process lifecycle, exit codes, stderr/log correlation, backpressure, and cancellation. Do not hide a broad privileged service surface inside a worker or utility process.

## Custom Protocols

Prefer a custom app protocol such as `app://bundle/` for packaged renderer assets when the app needs browser-like routing, relative URLs, streaming, or web storage semantics.

Protocol rules:

- call `protocol.registerSchemesAsPrivileged()` before app ready
- use `standard: true` and `secure: true` for browser-like app content
- avoid `bypassCSP` unless a security review accepts the risk
- normalize requested paths
- enforce root-bound checks against path traversal
- never route arbitrary local files by string concatenation

Use `file://` only when its limitations are acceptable and path handling is still explicit.

## Crash Boundaries

Handle `render-process-gone` and repeated crash loops intentionally:

- record diagnostics with app, Electron, platform, window role, and route context
- restore only safe view state
- show a controlled recovery UI or safe-mode flow
- avoid infinite reload loops

Initialize main crash reporting early enough to capture startup failures. Renderer-only telemetry is not enough for desktop incidents.

## Offline-First Shape

For offline-capable apps:

- package renderer assets locally
- store durable domain state outside renderer-only browser storage when it has product value
- keep sync policy in main/domain services instead of renderer claims
- expose sync commands and status through typed IPC
- make conflict and retry behavior testable without launching Electron UI

Do not build offline behavior as a browser SPA that happens to run in a desktop shell.
