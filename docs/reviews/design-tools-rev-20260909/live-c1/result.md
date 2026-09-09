# Notification settings implementation

Outcome: implementation finished. Browser verification status: **partial**, because an early arrow-key selection anomaly remains unexplained; the requested flows otherwise have observed browser evidence.

## Project and changes

Target: `/tmp/design-tools-rev-20260909/live-c1`, served only at `http://127.0.0.1:43862`, dedicated browser session `dtr-c1`.

Inspected project package/lockfile, components.json, installed Button, theme provider, and current CLI output. The project resolves Vite, React, Tailwind v4, **Radix Nova**, Lucide, and `~ui` aliases. Used the supplied shadcn skill and its CLI/customization/composition/forms/icons/styling references, plus agent-browser and installed CLI guidance. No supplied skill was changed. No subagents were created.

Added official Input, Switch, RadioGroup, Dialog, Field, and their Label/Separator dependencies. Previewed with `pnpm exec shadcn add ... --dry-run`; refused the prompted Button replacement. Inspected every emitted wrapper. Merged only the current upstream Button `focus-visible:ring-3` addition, preserving the local brand variant.

The screen has required email validation with associated errors, independent notification state, disabled daily/weekly choices when paused, draft-preserving Cancel/Escape, selected-value confirmation, and an explicit live status with the last applied settings. All settings use React local state; no backend or email delivery. Existing theme, primitive library, aliases, icon library, package/lockfile, theme provider and unrelated `preserved-note.ts` remain unchanged. `preservation.json` records byte comparisons; `implementation.diff` is the complete source delta. `before.tar.gz` holds the baseline. This disposable project has no Git repository.

## Commands and documentation

Project-installed CLI used through `pnpm exec shadcn`: `info --json`, `add --help`, `docs button input switch radio-group dialog field --json`, Button dry-run/diff, component-add dry-run, and actual add (Button overwrite answered **no**). No preset or whole-file replacement was used. See `shadcn-info.json`, `shadcn-docs.json`, `shadcn-add-help.txt`, `button-dry-run.txt`, `button-upstream.diff`, `components-dry-run.txt`, `components-add.txt`.

Fetched and inspected current project-resolved official [Button](https://ui.shadcn.com/docs/components/radix/button), [Input](https://ui.shadcn.com/docs/components/radix/input), [Switch](https://ui.shadcn.com/docs/components/radix/switch), [RadioGroup](https://ui.shadcn.com/docs/components/radix/radio-group), [Dialog](https://ui.shadcn.com/docs/components/radix/dialog), and [Field](https://ui.shadcn.com/docs/components/radix/field) documentation. Fetched Markdown is saved in `docs-*.md`.

`pnpm typecheck`: passed. `pnpm build`: passed. Build warning concerns existing Vite configuration use of `__dirname` under a planned future loader default; no build failure. Outputs: `typecheck.txt`, `build.txt`.

`pnpm lint`: fails on the pre-existing Button `buttonVariants` export (`react-refresh/only-export-components`). Initial lint also saw the baseline evidence copy; that copy was archived, and final lint isolates the one same source error. No lint success claimed. Output: `lint-final.txt`; baseline in archive and Button delta demonstrate the export was unchanged.

## Browser observations

Used installed agent-browser with explicit session and existing `/usr/bin/google-chrome`; no request interception or backend mocks. Network is the real local Vite app. Inspected browser console and page errors: only Vite/React development messages, no captured errors (`browser-console.txt`, `browser-errors.txt`).

- Empty submission: associated `Enter your email address.` alert; focus on email; dialog absent. Malformed `invalid-email` submitted with Enter: associated invalid-email error, aria-invalid true, dialog absent. Evidence: `empty-validation*`, `invalid-validation.txt`.
- Keyboard Tab from email focuses switch; Space pauses notifications. Both radios become disabled and Tab skips them to Review changes. Saved choice remains. Evidence: `disabled-frequency.txt`, `disabled-dom.txt`, `disabled-tab-focus.txt`.
- Enter on Review opens a titled/described dialog containing email and selected notification/frequency values. Initial focus Cancel; Shift+Tab goes to Confirm and Tab wraps to Cancel. Escape preserves draft and, after the exit transition, focus returns to Review. Initial immediate post-Escape snapshot captured the closing animation; settled readback proves closure. Evidence: `dialog-off.txt`, `dialog-entry-focus.txt`, `dialog-reverse-trap.txt`, `dialog-forward-trap.txt`, `after-escape-settled.txt`, `escape-focus-settled.txt`.
- Cancel keeps draft and leaves the prior applied state untouched. Keyboard Tab/Enter confirms and exposes a visible live status, returning focus to Review. Daily and later Weekly/on and Weekly/off states were observed. Evidence: `cancel-preserved.txt`, `confirm-focus.txt`, `dialog-weekly-verified.txt`, `mobile-layout.txt`, `applied-off.txt`.
- At 1440px desktop and 390px mobile, screenshots inspected. Mobile document width equals 390; dialog fits within viewport. Light/dark states inspected. Evidence: `desktop-initial.png`, `desktop-applied.png`, `mobile-applied.png`, `mobile-dark.png`, `mobile-dialog-layout.txt`, `mobile-dialog-settled.png` (this final settled screenshot is dark).

### Keyboard evidence limitation

The initial ArrowRight sequence remained Daily. A focused-radio retry recorded focus moving from Daily to Weekly while Weekly stayed unchecked and timed out waiting for selection (`radio-before-key.txt`, `radio-after-right.txt`). Those failed attempts did not capture key event ordering. I did not patch app or library based on a guessed cause.

Added read-only document key/focus/click event tracing, then tested the path again: an ArrowRight trial and four bounded alternating ArrowLeft/ArrowRight diagnostic trials all changed both focus and checked state. Trace shows keydown, next-radio focus, click, changed selection, then keyup (`radio-event-order.json`, `radio-diagnostic-trials.json`). Space activation also observed (`radio-space-selection.txt`). Current upstream Radix source was inspected for context, but it does not establish the earlier failure's cause in this installed runtime. The earlier anomaly is **not** declared fixed or attributed to Radix, React, or the browser tool. Next evidence needed for full keyboard assurance: reproduce a failing sequence with its keydown/keyup/focus/click ordering, then isolate the exact implementation/runtime path. Later passes do not erase the earlier failure.

Some earlier artifact names say “weekly” although the first sequence actually applied Daily; the file contents are retained exactly and the later `dialog-weekly-verified.txt` plus `mobile-layout.txt` are the actual Weekly evidence.

An evidence-directory change during the running Vite session reset local draft state before the final screenshot. The missing-dialog wait was interrupted, the fresh page was re-snapshotted and refilled, and the final screenshot captured the settled dialog. The app intentionally does not persist settings across reloads.

## Cleanup

Closed only browser session `dtr-c1`. Immediate session inventory briefly still listed it; final inventory reports **No active sessions** (`browser-sessions-final.txt`). Identified Vite PID 89601 listening on assigned port, with owning pnpm process tree, then sent TERM only to that Vite PID. Launcher exited 143; final `ss` shows no listener on 43862 and `ps` shows none of the recorded server-tree PIDs. See `server-before-stop.txt`, `processes-before-stop.txt`, `server-after-stop.txt`, `server-processes-after.txt`, `browser-close.txt`. No task-owned server/browser remains running according to these checks.
