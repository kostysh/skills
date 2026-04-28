# Review Playbooks

Use this reference when reviewing Electron code, migrating Electron majors, auditing release readiness, or applying practical security and recovery playbooks. For the canonical build/package/make/publish sequence and artifact gates, use [Build Process](build-process.md).

## Code Review Checklist

Flag high-risk issues first:

- `nodeIntegration: true` in normal renderer
- `contextIsolation: false`
- raw `ipcRenderer` or Electron objects exposed to renderer
- generic preload bridge
- IPC payloads without runtime validation
- privileged IPC without sender/origin/window validation
- renderer-owned secrets or authorization decisions
- arbitrary `shell.openExternal`
- arbitrary navigation or popup allowance
- remote content in privileged session
- string-built `file://` paths
- no CSP or dev CSP in production
- long sync work in main
- no cleanup for `webContents` or event listeners
- stale Electron major with no upgrade plan
- production package contains source maps, dev artifacts, env files, private keys, or readable business-critical bundles without an accepted source-protection decision
- no packaged smoke for packaging/protocol/updater/native-module changes

## Migration Checklist

For Electron major upgrades:

- capture current Electron, Chromium, Node, V8, and target platform matrix
- check supported-major status and EOL dates
- read version-matched release notes and breaking changes
- inspect removed/deprecated APIs such as legacy `remote` patterns
- verify sandbox and context isolation assumptions
- rebuild native modules
- run IPC/preload tests
- run packaged smoke tests
- verify signing, notarization, updater metadata, and release target generation
- update docs and project templates that mention old defaults

Do not batch several skipped majors with unrelated feature work unless the release risk is explicitly accepted.

## Release Readiness Checklist

Before stable release:

- artifact versions and release notes match
- macOS artifacts signed, notarized, and stapled when applicable
- Windows artifacts signed and timestamped when applicable
- Linux artifacts have checksums and chosen distribution trust model
- ASAR/fuses/integrity settings match policy
- source exposure audit passed: no source maps, dev artifacts, env files, private keys, fixtures, or unprotected business-critical bundles outside accepted policy
- native modules load in packaged app
- no packaged request to dev server or localhost
- updater checks a test feed successfully
- rollback artifact exists and is documented
- SBOM/provenance/checksums are published or archived
- smoke tests passed on each supported OS lane or missing lanes are reported

## Safe External URL Opening

Pattern:

- parse the string with `new URL`
- reject parse failures
- allow only approved schemes
- normalize and compare origins
- call `shell.openExternal` only after validation
- log denial with redaction

Default allowed schemes: `https:` and, only if product-required, `mailto:`.

Reject by default: `file:`, `javascript:`, `data:`, unknown custom schemes, and user-controlled deep links.

## Navigation Blocking

For privileged windows:

- deny all `window.open`
- block `will-navigate` outside trusted app origin
- send external links through validated open-external service
- open remote content in an isolated window/session without privileged preload

Tests should verify at least one denied external navigation and one allowed internal navigation for security-sensitive windows.

## Secure Custom Protocol

Protocol handler requirements:

- register scheme privileges before ready
- map only from trusted app origin to packaged asset root
- normalize path
- reject traversal
- return correct content type
- keep CSP active
- do not expose arbitrary user files

For workspace or user files, use explicit file APIs with authorization rather than the packaged app asset protocol.

## Single Instance and Deep Links

Register single-instance and deep-link handlers early:

- Windows/Linux: `requestSingleInstanceLock` and `second-instance`
- macOS: `open-url` and `open-file`
- normalize incoming URLs/files before use
- route to main-owned window registry
- never treat raw argv or URL strings as authorization

Deep-link behavior differs in dev and packaged builds. Package metadata must be tested.

## Renderer Crash Recovery

On renderer crash:

- record crash context
- prevent infinite reload loops
- offer reload, safe mode, or diagnostics export
- restore only validated route/view state
- clear suspicious transient renderer state

If crashes repeat on startup, bypass last route/plugin/workspace and open safe mode.

## Native Rebuild Troubleshooting

When native modules fail:

- confirm Electron version and architecture
- run Electron-targeted rebuild
- check ASAR unpack settings
- inspect packaged path resolution
- verify target OS dependencies
- test signing/notarization with native binaries
- avoid loading native modules inside workers unless proven safe

Treat native failures as release blockers, not post-release support chores.
