# Renderer Integration

Use this reference when integrating React, routing, custom app protocols, dev/prod renderer origins, CSP differences, or renderer test doubles. For electron-vite commands and source build sequence, use [Build Process](build-process.md).

## Renderer Responsibilities

Renderer code owns:

- UI composition
- user interaction
- view state
- browser-safe data presentation
- optimistic UI and local component state

Renderer code must not own:

- secrets
- privileged filesystem access
- shell execution
- update installation
- code signing or release logic
- authorization decisions based only on renderer claims

When renderer architecture is mostly React SPA work, pair with `react-spa-engineer`.

## Dev vs Packaged Runtime

Always model two renderer origins:

| Runtime | Typical origin | Risk |
| --- | --- | --- |
| Dev | Vite or webpack dev server | relaxed CSP, HMR, localhost assumptions |
| Packaged | custom `app://` or static file origin | path/routing/CSP/protocol differences |

Release code must never fall back to a dev server or `localhost` silently. Environment switching should fail closed when packaged assets are missing.

The concrete `dev`, `preview`, and `build` command behavior belongs in [Build Process](build-process.md); this reference owns renderer runtime implications.

## Routing

Choose routing based on packaged behavior:

- hash routing is acceptable for small apps that do not need clean internal paths
- browser-style routing should use a custom standard protocol such as `app://bundle`
- direct `file://` plus history routing is fragile

If the app supports deep links, file opens, or multi-window restoration, normalize routes in main before sending trusted route commands to renderer.

## Custom Protocol Integration

Use `app://bundle/index.html` or equivalent as the trusted packaged renderer origin when browser-like semantics are needed.

Protocol design must include:

- root-bound asset serving
- no path traversal
- correct MIME types
- CSP compatibility
- no arbitrary user file serving
- no `bypassCSP` by default

## CSP by Environment

Keep dev and production CSP separate:

- dev may need websocket/HMR allowances
- production should remove HMR, unsafe eval, dev server origins, and broad connect sources
- inline styles should be limited to what the framework or design system actually requires
- remote images, fonts, and APIs should be allowlisted explicitly

Do not satisfy a dev warning by weakening production CSP.

## Renderer Access to Desktop Capabilities

Renderer code should call typed preload APIs:

```ts
const result = await window.desktop.workspace.list({ root });
```

It should not know IPC channel names. It should not import Electron. It should not call Node APIs. For component tests, mock `window.desktop` at the boundary instead of launching Electron for every component.

## State and Persistence

Use browser storage only for low-risk UI preferences. Do not store access tokens, refresh tokens, encryption keys, sensitive file contents, or privileged policy state in renderer storage.

For desktop durable state:

- use main-owned config or database services
- expose narrow commands and query methods through preload
- validate returned data before rendering if it can be influenced by files, plugins, imports, or network sync

## Renderer Testing

Use renderer unit/component tests for UI behavior. Mock the preload API:

- verify calls use capability methods, not transport strings
- test success and serialized error states
- test loading, denial, and permission states

Use real Electron E2E only for behavior that depends on the desktop runtime, such as actual windows, protocols, menus, dialogs, clipboard, updater checks, or native permissions.
