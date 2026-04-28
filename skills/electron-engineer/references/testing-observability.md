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
- basic menu/dialog/deep link flow works when relevant
- signature/notarization checks pass when credentials are available
- updater can check a fake or static test feed

Run these on every target OS lane that the product supports, or clearly report the missing lane.

## Performance Budgets

Track:

- cold start
- time to first interaction
- steady-state memory
- background CPU and power
- window creation latency
- IPC payload size for heavy workflows

Common Electron performance failures:

- blocking synchronous work in main during startup
- oversized preload bundle
- initializing updater, database, indexes, or plugins on the critical UI path
- giant JSON payloads over IPC
- renderer event listener leaks
- retained `BrowserWindow` or `webContents` references
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

## Crash Reporting and Debugging

Initialize crash reporting early. Decide separately whether crash upload is automatic, opt-in, or support-driven.

Debug main with Node inspector flags. Debug renderer with Chromium DevTools. Use heap snapshots and performance traces for renderer leaks and jank. For main hangs, pair with `node-engineer` and inspect open handles, diagnostic reports, worker state, and long-running synchronous work.

For incidents, capture artifacts:

- logs around the correlation ID
- renderer performance trace if UI is frozen
- heap snapshot if memory grows
- crash dump or crash ID
- Electron, Chromium, Node, OS, and architecture versions
- update channel and package target
