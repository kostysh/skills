# Testing and Observability

Use this reference when designing Electron test layers, debugging runtime issues, logging, crash reporting, diagnostics export, performance budgets, or packaged smoke tests. For CI build-lane ordering and where packaged smoke fits in the source-build/package/make/publish flow, use [Build Process](build-process.md).

## Test Pyramid

Electron needs layered tests:

| Layer | Purpose | Typical tools |
| --- | --- | --- |
| Domain/unit | pure services, schemas, path checks, config, update policy | `node:test`, Vitest |
| IPC handler | payload validation, sender validation, serialized errors | `node:test`, Vitest |
| Preload surface | exported API shape, no raw IPC, listener cleanup | Vitest with mocked Electron |
| Renderer | UI behavior against mocked preload APIs | Vitest, Testing Library |
| Electron E2E | real windows, protocols, dialogs, menus, native integration | Playwright Electron or WebdriverIO |
| Packaged smoke | packaged app startup, asset loading, signing/update/protocol checks | platform-specific scripts and E2E smoke |

Do not try to prove every behavior through full Electron E2E. Most security boundary behavior is faster and clearer as unit or contract tests.

## IPC and Preload Tests

Test IPC handlers as functions when possible:

- valid payload succeeds
- invalid payload returns `INVALID_PAYLOAD`
- unauthorized sender returns `UNAUTHORIZED`
- domain errors are serialized
- paths are normalized and root-bound

Preload tests should assert:

- no raw `ipcRenderer` is exported
- no generic `invoke` method is exported
- public keys match the intended API
- listeners return cleanup functions
- renderer code sees typed result shapes

## E2E Tooling

Playwright Electron can drive real Electron apps but may have version-sensitive or experimental aspects. WebdriverIO Electron service is a valid third-party alternative for teams already using WebdriverIO.

Spectron is deprecated and should appear only in migration plans away from legacy tests.

On Linux CI, expect to configure a display environment for real Electron runs. Keep E2E tests small and focused on desktop runtime behavior.

## Packaged Smoke Tests

Packaged smoke tests are release gates for:

- app starts without dev server
- main window loads packaged renderer origin
- custom `app://` protocol resolves assets
- no production request to `localhost`
- preload API is present and narrow
- native modules load from packaged layout
- utility or isolated worker paths start, fail, and shut down predictably when relevant
- session permission allow/deny paths work for media, notifications, desktop capture, or remote content when relevant
- basic menu/dialog/deep link flow works when relevant
- signature/notarization checks pass when credentials are available
- updater can check a fake or static test feed

Run these on every target OS lane that the product supports, or clearly report the missing lane.

## Native and Permission Tests

Test native integrations at the boundary that owns them:

- menus, tray, dock/taskbar, recent documents, and launcher actions route through main-owned commands
- dialogs and file imports cover approve, cancel, invalid file, and cleanup paths
- download handlers cover target path validation, cancel/pause/resume when supported, and partial-file cleanup
- global shortcuts unregister on quit, reload, account switch, and settings changes
- power blockers stop when the protected task ends or fails
- notifications, media, desktop capture, and geolocation have explicit deny cases
- logout, account switch, private windows, and remote/auth sessions clear cookies, storage, service workers, cache, and permissions according to policy

Use unit or contract tests for handler policy and narrow Electron E2E or manual release checks for OS behavior that cannot be simulated reliably.

## Security Scenario Checks

Cover security-sensitive Electron flows with automated tests when practical and manual release checks when the OS or package target makes automation unreliable:

- renderer cannot call `require`, import Electron, or access raw Node APIs in normal app windows
- malicious navigation and popup attempts are blocked
- unsafe `shell.openExternal` inputs such as `file:`, `javascript:`, `data:`, and unknown custom schemes are denied
- invalid IPC payloads fail schema validation
- IPC calls from the wrong origin, frame, window role, or session fail sender validation
- production CSP blocks inline script and dev-server/HMR origins
- arbitrary file paths from renderer are denied unless main authorizes the domain operation
- remote or embedded content receives no privileged preload and at least one permission request is denied

## Performance Budgets

Track:

- cold start
- time to first interaction
- steady-state memory
- background CPU and power
- window creation latency
- IPC payload size for heavy workflows
- utility process startup, cancellation, and crash recovery when used

Common Electron performance failures:

- blocking synchronous work in main during startup
- oversized preload bundle
- initializing updater, database, indexes, or plugins on the critical UI path
- giant JSON payloads over IPC
- chatty IPC where `MessagePort`, streaming, or persisted handoff is needed
- renderer event listener leaks
- retained `BrowserWindow` or `webContents` references
- utility processes, global shortcuts, download handlers, or power blockers without lifecycle ownership
- dev-only profiling instead of packaged profiling

Profile packaged builds when investigating startup, protocol, ASAR, signing, or preload issues.

## Logging

Use structured logs with fields such as:

- timestamp
- level
- service
- appVersion
- electronVersion
- platform
- windowId or windowRole
- sessionId
- ipcChannel
- correlationId
- event
- error code and message

Redact tokens, auth headers, raw request bodies, PII, file contents, clipboard data, and sensitive full paths.

## Diagnostics Matrix

Choose diagnostics by environment and exposure:

| Diagnostic | Use for | Production rule |
| --- | --- | --- |
| Main debugger or Node inspector | local main-process debugging | dev or support build only; never exposed by default |
| Renderer DevTools | local renderer debugging | dev/local only unless an explicit support mode gates it |
| `ELECTRON_ENABLE_LOGGING` and Chromium logs | support troubleshooting for startup, GPU, protocol, or network issues | bounded logs with redaction; no secrets or raw request bodies |
| command-line switches | feature flags and platform diagnostics | set before ready; no `--noSandbox`, remote debugging, or inspector flags in production scripts |
| `netLog` | network, TLS, proxy, and update diagnostics | capture only with consent; treat output as sensitive |
| `contentTracing` | startup, rendering, and jank profiling | prefer packaged or production-like scenarios; redact before sharing |
| Chrome DevTools Protocol debugger | automation, profiling, or targeted debugging | do not expose a production remote debugging port |
| crash dumps, heap snapshots, and performance traces | incident artifacts | store securely, bound retention, redact or restrict access |

Do not turn a diagnostic escape hatch into a permanent release capability. If support diagnostics are needed, make the enablement explicit, time-bounded, logged, and removable.

## Crash Reporting and Debugging

Initialize crash reporting early. Decide separately whether crash upload is automatic, opt-in, or support-driven.

Debug main with Node inspector flags in dev or controlled support builds. Debug renderer with Chromium DevTools. Use heap snapshots and performance traces for renderer leaks and jank. For main hangs, pair with `node-engineer` and inspect open handles, diagnostic reports, utility/worker state, and long-running synchronous work.

For incidents, capture artifacts:

- logs around the correlation ID
- renderer performance trace if UI is frozen
- heap snapshot if memory grows
- crash dump or crash ID
- utility process or worker exit reason and correlated stderr/logs when relevant
- Electron, Chromium, Node, OS, and architecture versions
- update channel and package target
