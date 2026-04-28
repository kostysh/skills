# Data, Storage, and Native Integration

Use this reference when handling app paths, config files, local state, secrets, SQLite, safeStorage, file import/export, or native modules. For source build, native rebuild placement, package/make/publish order, and packaged artifact gates, use [Build Process](build-process.md).

## App Paths

Use Electron app paths instead of hardcoded directories:

| Data | Preferred location |
| --- | --- |
| user configuration and durable app state | `app.getPath("userData")` |
| browser cache, cookies, dictionaries, devtools state | `sessionData` when separated from durable app data |
| logs | `app.getPath("logs")` |
| crash dumps | crash reporter path or `crashDumps` where supported |
| temporary exports | `temp` with explicit cleanup |

Do not put large caches, derived indexes, or browser session data into user-backed config files without a product reason.

## Config Files

Small config/state files should be:

- schema-validated on read
- written atomically through temp file plus rename
- permission-restricted where the OS supports it
- resilient to corruption with a backup or reset path
- separate from secrets

Do not trust imported config files. Treat imports as untrusted input and validate content before applying.

## Secrets

Keep secrets out of renderer storage, logs, crash metadata, query strings, and diagnostic bundles.

Use `safeStorage` or an OS credential store when available, but treat it as a platform-dependent encryption layer, not a universal vault:

- check encryption availability before persistent storage
- reject weak Linux fallback backends for high-risk credentials
- support session-only mode when secure persistence is unavailable
- keep secret access behind main-owned services
- expose only derived auth state or explicit commands to renderer

## File Access

File workflows should use explicit user intent:

- `dialog.showOpenDialog` for imports
- `dialog.showSaveDialog` for exports
- root-bound path checks for workspace operations
- extension and MIME validation where relevant
- content validation before parsing or executing import effects

Never let renderer supply an arbitrary path and a requested filesystem operation without domain authorization in main.

## SQLite and Local Databases

SQLite is often a good desktop fit for durable structured state, but library choice is an operational decision.

Before choosing a native SQLite binding:

- confirm Electron ABI rebuild support
- confirm ASAR unpack behavior
- verify macOS signing/notarization with bundled native libraries
- test Windows and Linux target architectures
- compare with IndexedDB, append-only JSON, or service-backed storage for simpler needs

Keep migrations deterministic and testable outside the full Electron UI.

## Native Modules

Native modules require release discipline:

| Symptom | Likely cause | Response |
| --- | --- | --- |
| Works before Electron upgrade, fails after | ABI drift or missed rebuild | run Electron-targeted rebuild and verify target arch |
| Works in dev, fails packaged | native module left inside ASAR or wrong runtime path | configure unpacking and packaged smoke test |
| Fails only on arm64 | missing prebuild or wrong CI runner | build on target arch or ship verified prebuilds |
| Signing/notarization fails | bundled native binary entitlement or signature issue | treat as release blocker |
| Worker crash | native addon not safe in worker context | keep native loading in main/utility unless proven safe |

Do not add native dependencies for convenience APIs if a built-in Electron, Chromium, or Node capability is sufficient.

## Diagnostics Export

A support diagnostics bundle may include:

- app version and Electron/Chromium/Node versions
- OS and architecture
- enabled feature flags
- sanitized config
- last bounded log files
- crash IDs or dump references
- updater status
- package signature verification summary when available

Require user consent before sharing. Redact tokens, auth headers, PII, raw clipboard, file contents, and sensitive full paths unless explicitly needed.
