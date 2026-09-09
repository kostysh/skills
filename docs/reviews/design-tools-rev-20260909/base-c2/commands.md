# Actual command index

Working directory for project commands: `/tmp/design-tools-rev-20260909/live-base-c2`. Outputs numbered in execution order. pnpm and browser commands used authorized elevated execution because the task environment identifies pnpm's sandbox database problem. No global configuration changed.

- Initial read: `cat` supplied shadcn SKILL.md, all six triggered active references, unchanged agent-browser SKILL.md, supplied raw-live-task.txt. Inspected project's package.json, components.json, pnpm-lock.yaml, App, Button, theme CSS/provider, Vite/TS/ESLint config, unrelated sentinel. `git status --short` failed because disposable fixture has no Git repository. Baseline preserved by filesystem copy.
- `pnpm exec shadcn --help`, `info --json`, `add --help`, `docs --help` (initial tool output; info also saved in 02-install.txt).
- `pnpm exec shadcn docs button input field switch radio-group dialog --json`; `pnpm exec shadcn add button --dry-run`; `pnpm exec shadcn add button --diff` → 01-cli-docs-preview.txt.
- `pnpm exec shadcn add input field switch radio-group dialog --dry-run`; `pnpm exec shadcn add input field switch radio-group dialog -y` → 02-install.txt. Noninteractive command stopped at overwrite prompt after five files. Repeated command in PTY; entered `n` for Button overwrite → 03-install-interactive.txt. Final new files: input, switch, radio-group, label, separator, field, dialog.
- Web open and curl fetched CLI-returned official shadcn URLs (docs-*.html); curl fetched Base UI dialog/switch markdown. Radio-group.md API URL returned HTTP 404; inspected installed public `node_modules/@base-ui/react/radio-group/RadioGroup.d.ts` and wrapper instead. No props guessed from the unavailable page.
- `agent-browser --version` → 0.27.3; `agent-browser skills get core --full` → agent-browser-guidance.txt; `agent-browser --help` → agent-browser-help.txt.
- Applied one Button class merge and new App.tsx with Python/heredoc; 04-implementation.diff/final-source.diff record source changes. No overwrite flag or preset command used.
- `pnpm run typecheck`; `pnpm run build`; `pnpm run lint` → 05-checks.txt.
- `pnpm exec eslint --stdin --stdin-filename src/components/ui/button.tsx < <baseline Button file>` → 09-baseline-lint.txt.
- Initial `pnpm run dev -- --host 127.0.0.1 --port 43865 --strictPort` forwarded an extra `--` to Vite, which used 5173 (06-server.txt). Identified child PID 238090 and stopped it. Corrected invocation: `pnpm run dev --host 127.0.0.1 --port 43865 --strictPort` → 08-server-correct-port.txt.

Browser command prefix throughout: `agent-browser --session dtr-base-c2`. No request interception used. Browser outputs 10–19 contain successive snapshots, actions, DOM observations, and screenshot paths. Each page-changing action used a fresh snapshot before reusing refs.

- `open http://127.0.0.1:43865`; `set viewport 1440 1000`; `snapshot -i`; `screenshot desktop-initial.png`.
- Click Review with empty email; snapshot; eval active element, dialog count, aria-describedby, aria-invalid.
- Fill `invalid-address`; `press Enter`; inspect error and zero dialogs. Fill `trial@example.com`; Tab to switch; Space toggles off; snapshots identify both disabled radios.
- Inspect actual Tab focus: disabled selected Base UI radio remains focusable, next Tab reaches Review. Toggle on; focus Daily; ArrowRight selects Weekly; Tab reaches Review.
- Enter opens; `wait --fn` waits for Cancel focus; Tab to Confirm, Tab wraps to Cancel; Shift+Tab wraps to Confirm. Escape closes; wait for zero dialog nodes; inspect focus returned to Review and unchanged draft/no applied status.
- Reopen; Cancel using Enter; wait for zero dialog nodes; same unchanged draft/no status. Reopen; Shift+Tab to Confirm; Enter applies; wait for close; inspect weekly/on status and Review focus.
- Activate switch by its text label; focus disabled Weekly; ArrowLeft and Space; click Daily label. All leave Weekly selected. Old applied status remains on until confirmation.
- `set viewport 390 844`; full screenshots; eval innerWidth/document.scrollWidth both 390. Open dialog showing Off and saved Weekly; Confirm; inspect off result.
- `press d` uses existing theme-provider keyboard toggle; dark screenshot. Reopen light/dark dialogs and wait until `document.getAnimations().every(a => a.playState === "finished")` for settled captures. Earlier 14/17 screenshots/snapshots sampled animation and are not settled-focus evidence; 15/19 correct this observation timing.
- `console`; `errors`; `network requests` → 18-final-mobile-console.txt. No page or console errors; only Vite connection and React DevTools info. Requests were local app assets.
- `cmp` preserved files and final diff/hashes → 20-preservation.txt, final-source.diff, final-source-sha256.txt.
- `get cdp-url`; `ss -ltnp` established Chrome PID 242738 on 35691 and Vite PID 240622 on 43865. `agent-browser --session dtr-base-c2 close`; `kill -TERM 240622` → 21-cleanup-actions.txt. Both server launcher tool sessions returned expected signal exit 143. Final PID/port/session inspection → 22-cleanup-verified.txt.
