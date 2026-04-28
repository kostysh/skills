# Security, IPC, and Preload

Use this reference when configuring BrowserWindow security, preload APIs, IPC contracts, sender validation, CSP, navigation policy, or external URL handling.

## Security Baseline

For normal privileged app windows:

```ts
const win = new BrowserWindow({
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    webviewTag: false,
  },
});
```

Do not silently weaken these defaults. If compatibility requires a weaker setting, document the exact capability it grants and add compensating controls.

Also require:

- strict production CSP
- deny-by-default `setWindowOpenHandler`
- deny-by-default `will-navigate` outside trusted app origin
- validated `shell.openExternal`
- secrets outside renderer storage
- no privileged preload for remote/untrusted content

## Threat Model

Review Electron features against these abuse paths:

| Asset | Abuse path | Primary controls |
| --- | --- | --- |
| Auth tokens and secrets | renderer XSS reads local storage or logs | keep secrets in main/OS storage; redact logs |
| Files and workspace data | forged IPC reads or writes arbitrary paths | schema validation, path normalization, root checks, domain authorization |
| Shell and external links | renderer opens unsafe schemes | allowlist protocol and origin; reject `file:`, `javascript:`, `data:` |
| App binary and update chain | tampered package or metadata | signing, notarization, fuses, ASAR integrity, trusted update origin |
| Remote content | navigation into privileged renderer | session isolation, no privileged preload, navigation deny policy |

## Session Permissions and Cleanup

Use deny-by-default permission handling for sessions that can load remote content, embedded content, media flows, desktop capture, notifications, or geolocation.

Permission grants must be scoped by:

- session partition
- expected origin and protocol
- expected window role or webContents ID
- permission type
- explicit product feature state or user action

Do not grant permissions globally because one trusted window needs them. The deny path should be user-visible when it affects a workflow and testable in automation or manual release checks.

Own session storage deliberately:

| Session kind | Storage policy |
| --- | --- |
| trusted packaged app UI | durable only when product state requires it |
| remote or untrusted content | isolated partition, no privileged preload, explicit permission handler |
| auth or browser-like flow | isolated partition, clear cookies/storage on logout or account switch |
| temporary/private window | in-memory or cleanup-on-close partition |

Cookies, localStorage, IndexedDB, cache, service workers, and permissions should be cleared for logout, account switching, private windows, and remote flows when retention is not explicitly required.

## IPC Architecture

Default to command-style IPC:

- shared channel constants
- request and response runtime schemas
- serialized error envelope
- `ipcMain.handle` in main
- `ipcRenderer.invoke` inside preload
- typed domain methods exposed through `contextBridge`

Use events only for main-to-renderer notifications, progress, or state broadcasts. Use `MessagePort` or stream-style handoff for large data, frequent messages, or backpressure-sensitive flows.

Do not expose:

- `window.electron.ipcRenderer`
- `window.electron.invoke(channel, payload)`
- arbitrary channel strings in renderer
- broad `fs`, `shell`, or `system` objects

## Contract Pattern

Shape IPC contracts around capabilities:

```ts
export const IPC_CHANNELS = {
  appGetVersion: "app:getVersion",
  workspaceList: "workspace:list",
} as const;

export type IpcOk<T> = { ok: true; data: T };
export type IpcErr = {
  ok: false;
  error: { code: "UNAUTHORIZED" | "INVALID_PAYLOAD" | "INTERNAL"; message: string };
};
export type IpcResult<T> = IpcOk<T> | IpcErr;
```

Validate every inbound payload with Zod, Valibot, Ajv, or the project's existing runtime schema tool. Validate responses when they cross trust boundaries or are assembled from filesystem, network, plugin, or native data.

## Sender Validation

For privileged handlers, validate the sender:

- expected protocol and host, such as `app://bundle`
- expected window role or webContents ID
- expected session partition when relevant
- no calls from remote frames or untrusted windows

Payload validation does not replace sender validation. A valid payload from the wrong frame is still unauthorized.

## Preload Design

Good preload APIs are:

- role-specific
- small
- named by user capability, not transport
- promise-returning for commands
- event subscriptions with cleanup functions
- free of renderer framework dependencies

Example shape:

```ts
contextBridge.exposeInMainWorld("desktop", {
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.appGetVersion),
  },
  workspace: {
    list: (input: WorkspaceListRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspaceList, input),
  },
});
```

For multi-window apps, prefer role-specific bridges instead of one global export-everything surface.

## Navigation and External URLs

Privileged windows should reject arbitrary navigation:

```ts
win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

win.webContents.on("will-navigate", (event, rawUrl) => {
  const url = new URL(rawUrl);
  if (!(url.protocol === "app:" && url.hostname === "bundle")) {
    event.preventDefault();
  }
});
```

For external links:

- parse with `new URL`
- allow only specific schemes, normally `https:` and maybe `mailto:`
- compare normalized origin against an allowlist
- call `shell.openExternal` only after validation
- log denials without leaking sensitive URLs

## Web Embeds

Default choices:

- Use a sandboxed `iframe` for ordinary web embeds that do not need Electron control.
- Use `WebContentsView` for main-controlled embedded contexts with separate `webContents`.
- Avoid `<webview>` for new work. If legacy or product constraints require it, treat it as a reviewed exception.

For any embedded remote content:

- use a separate session partition
- do not attach privileged preload
- deny popups and arbitrary navigation
- validate all external URL handoff
- configure permission handling on that session
- test at least one denied navigation or permission path

If `<webview>` is allowed, validate `will-attach-webview` parameters, strip unsafe `preload`, reject untrusted URLs, keep `allowpopups` off unless explicitly required, and document why `iframe` or `WebContentsView` is insufficient.

## Review Red Flags

Flag these immediately:

- `nodeIntegration: true`
- `contextIsolation: false`
- `sandbox: false` without documented need
- raw `ipcRenderer` in renderer
- generic IPC bridge
- string-built `file://` asset paths
- unvalidated `shell.openExternal`
- missing CSP
- remote content in privileged session
- no deny-by-default permission handler for remote or media-capable sessions
- no cookies/storage cleanup for logout, private windows, or remote auth flows
- `<webview>` enabled without `will-attach-webview` validation
- secrets in `localStorage`, `sessionStorage`, or renderer logs
