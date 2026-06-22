# Native OS Integration

Use this reference when designing or reviewing native desktop features such as menus, tray, dock/taskbar, shortcuts, dialogs, clipboard, downloads, drag-and-drop, notifications, desktop capture, screen/display behavior, power APIs, dark mode, accessibility, or platform launcher actions. For source build, package/make/publish, and packaged artifact ordering, use [Build Process](build-process.md).

## Ownership Model

Native OS features are privileged product behavior:

| Layer | Owns |
| --- | --- |
| Main | OS APIs, permissions, windows, sessions, menus, tray, downloads, shortcuts, power APIs, dialogs, filesystem paths |
| Preload | narrow capability methods and event subscriptions with cleanup |
| Renderer | UI, user intent, progress display, permission explanation, and browser-safe state |

Prefer built-in Electron and native OS APIs behind narrow main-owned services before adding cross-platform abstraction packages or broad desktop facades. Add a wrapper only when the current feature needs shared policy, repeated behavior, or platform normalization now.

Do not expose broad native objects to renderer. Expose commands such as `openWorkspace`, `showSaveDialog`, `subscribeDownloadProgress`, or `setThemePreference`, not `fs`, `shell`, `clipboard`, `screen`, `session`, or raw IPC.

## Feature Decisions

| Feature | Default guidance | Required checks |
| --- | --- | --- |
| Application menu and context menu | main-owned templates; use OS roles when they match product intent | no dev-only menu items in production; menu actions route through typed commands |
| Tray, dock, taskbar, recent documents, launcher actions | main-owned lifecycle and platform metadata | explicit quit/hide behavior; launcher arguments normalized before use |
| Local shortcuts | prefer menu accelerators for focused app shortcuts | cross-platform accelerator review; no collision with text input |
| Global shortcuts | use only for product-critical background behavior | explicit user setting, registration failure handling, unregister on quit |
| Dialogs | main-owned user-consent boundary for open/save/import/export | file type filters, path validation, cancellation path |
| Clipboard | use only for explicit copy/paste flows | redact or avoid secrets; no background clipboard scraping |
| Downloads | session-owned workflow; renderer displays progress only | save path chosen or validated in main; cancel/pause/resume behavior; cleanup partial files |
| Drag and drop | validate files and MIME before import/export effects | root-bound paths; explicit user intent |
| Notifications | permissioned feature with OS settings respected | user preference, click handling, no sensitive notification bodies |
| Desktop capture and media | permissioned feature with source selection and explanation | origin/session/window-role check; no silent capture |
| Screen/display | main-owned window placement and display changes | restore windows within visible work area; handle display removal |
| Power monitor/save blocker | main-owned operational policy | stop blockers when task ends; reduce work on battery or thermal pressure |
| Dark mode | use OS preference by default; renderer follows CSS/media state | native theme override has user setting and packaged verification |
| Accessibility | renderer keeps semantic HTML, focus order, keyboard paths | do not break screen readers with custom chrome; expose manual toggle only when product needs it |

## Menus, Tray, and Launcher Behavior

Menus and tray actions execute in main. If they affect UI state, send a typed event to the correct window role rather than directly mutating renderer internals.

Define these before implementation:

- whether closing the last window quits, hides to tray, or keeps a background service alive
- whether macOS keeps the app active after all windows close
- which launcher or recent-document arguments are accepted
- how the app focuses an existing instance and routes an action to the main window

Tray-only and background apps need a visible quit path, bounded background work, and packaged smoke tests for restart, update, and logout behavior.

## File and Data Transfer

File import/export flows must start from explicit user intent. Renderer may request an import or export capability, but main owns the dialog, chosen path, validation, and filesystem operation.

Rules:

- never let renderer provide an arbitrary path plus operation without domain authorization
- validate extensions, MIME, file size, and parsed content before applying effects
- keep temporary exports in a temp path with cleanup
- do not put secrets or sensitive full paths into clipboard, logs, notifications, or diagnostics

## Permissions and Consent

Native features that touch privacy or OS resources need an explicit product reason and a testable deny path:

- notifications
- camera, microphone, screen capture, and desktop capture
- geolocation or media permissions from remote content
- global shortcuts
- filesystem imports/exports outside app-owned storage
- power blockers that affect battery or display sleep

Use [Security, IPC, and Preload](security-ipc-preload.md) for session permission handlers, remote content, and web embed policy.

## Verification

For native OS integration changes, verify:

- typed preload API exposes only the intended capability
- denied or cancelled permission/dialog paths are tested
- listeners, global shortcuts, tray objects, download handlers, and power blockers are cleaned up
- the behavior is smoke-tested in packaged mode when it depends on metadata, icons, protocols, signing, native resources, or app lifecycle
- platform-specific behavior is either tested on the target OS or reported as unverified
