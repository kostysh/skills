# Base C2 notification-settings live trial

Status: completed

Implemented the requested local-state notification settings in `/tmp/design-tools-rev-20260909/live-base-c2` using installed shadcn 4.21.0 / Base UI 1.8.0, base-nova, Vite/React/TypeScript, Tailwind v4, Lucide icons, and `~ui` aliases. Used supplied shadcn active instructions and unchanged agent-browser guidance. No other trial/project tree or maintenance material was consulted.

## Changes

- Added official Input, Field, Switch, RadioGroup, Dialog and transitive Label/Separator wrappers through the installed project CLI.
- Read the Button registry preview and declined its overwrite prompt. Merged only the upstream `focus-visible:ring-3` class. Preserved `brand` variant and used it for Review/Confirm.
- Implemented required email validation with associated error, independent notifications switch, daily/weekly radios disabled when off, controlled confirmation, Cancel/Escape draft preservation, and separate applied-state status.
- Confirm dialog has an accessible title/description, explicit initial focus on Cancel, and final focus on Review.
- App uses project semantic theme tokens; existing CSS, theme provider, components.json, package.json, lockfile, and unrelated sentinel remained byte-identical. Final source preserved; no Git commit/publication.

## Verified evidence

- `pnpm run typecheck`: passed.
- `pnpm run build`: passed.
- `pnpm run lint`: failed only at pre-existing Button `buttonVariants` mixed export (`react-refresh/only-export-components`). Exact same error reproduced from original Button source via eslint stdin; no new lint error observed. This is not a clean lint claim.
- Real browser, session `dtr-base-c2`, local origin port 43865, without intercepted requests. Empty/malformed email blocks dialog and focuses input; associated error is exposed. Valid email opens selected on/weekly values.
- Keyboard Tab/Space switch operation and radio ArrowRight selection observed. Disabled frequency ignores ArrowLeft, Space, and label click. Base UI retains selected disabled radio in Tab order; it is aria-disabled and cannot change. No claim that disabled radios are removed from Tab order.
- Dialog opens with Cancel focus; forward and reverse keyboard wrap observed after focus guards settle. Escape and Cancel preserve draft, do not apply, and restore Review focus. Confirm via keyboard applies on/weekly and returns focus. Mobile Confirm applies off/weekly; applied status remains unchanged while later drafts are edited/cancelled.
- Desktop 1440×1000 and mobile 390×844 inspected. Mobile document width is exactly 390; no horizontal overflow. Settled light/dark dialogs and mobile disabled/applied states visually inspected.
- Console contained only Vite connection debug and React DevTools info; page errors output empty. Network listing contains local assets and no backend delivery request.
- Before/after comparisons prove customized variant, theme, config, aliases, dependency manifest/lock, and unrelated sentinel preserved.

## Scope and limits

Local React state only; no email delivery, backend, persistence across reload, or formal accessibility certification claimed. Browser checks are targeted smoke checks, not a formal E2E suite. Vite emits an existing future native-config warning for `__dirname`; configuration left intact. Official radio-group API markdown URL returned 404; exact API acquired from installed wrapper/public type declaration. Assigned model gpt-6-astra/high does not establish the actual serving model.

The initial server command passed an extra `--`, causing Vite to use 5173. That identified trial-owned child was stopped before the corrected command started assigned port 43865. Early dialog snapshots sampled transition/focus-guard states; subsequent explicit condition waits established settled focus and screenshots.

## Evidence and cleanup

`commands.md` indexes actual commands and outputs. `01`–`22` files contain raw CLI/build/browser/preservation/cleanup output. `before/` contains the input source/config baseline; `final-source.diff` and `final-source-sha256.txt` identify the resulting source. PNGs show desktop/mobile/validation/dialog/applied and dark states; use `*-settled.png` for final dialog visuals.

Dedicated browser closed; Vite child terminated. Final verification checks both server generations, browser PID, assigned/default/CDP ports, and active session listing. No owned server/browser process or listener remains. Source remains in the disposable app.
