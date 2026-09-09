# Joint Pencil → shadcn consumer result

Status: **partial**. Supported local implementation and assigned browser scenarios are complete. Required typecheck/build passed; full project lint is not green because of a pre-existing error in the preserved Button. Pencil visual verification and durable save/reopen remain unconfirmed, so this is not full-pipeline or design-conformance completion.

## Scope and source

Implemented in `/tmp/design-tools-rev-20260909/joint-base-project` from the independent frozen `pencil-c1-before-refresh/handoff.md`, original consumer brief and inspected desktop confirmation export. That export shows copied edit content without its modal; four other exports are blank. Structured handoff supplies supported content and directional layout, with ordinary implementation decisions. No Pencil mutation, automatic conversion, verified-design claim, backend/email send, publication or subagents.

Original task overrides the handoff contradiction: frequency is disabled while notifications are off, with selection retained and email still editable. Existing Geist typography, neutral semantic tokens, Base UI base-nova, lucide icons, ~ui aliases, Button brand variant and unrelated source were preserved. SHA256 evidence confirms Button, stylesheet and sentinel unchanged.

## Change and documentation

`src/App.tsx` now owns draft, reviewed snapshot, applied values, validation, responsive settings card, confirmation dialog and visible local result. Official shadcn CLI added input, switch, radio-group, card, field, label, separator and dialog; overwrite of Button was explicitly declined. No dependency/theme/preset replacement occurred. Before/after source and source.diff are retained outside the app.

Used installed `pnpm exec shadcn info --json`, `docs … --json`, add help/dry-run and official [Field](https://ui.shadcn.com/docs/components/base/field), [Input](https://ui.shadcn.com/docs/components/base/input), [Switch](https://ui.shadcn.com/docs/components/base/switch), [Radio Group](https://ui.shadcn.com/docs/components/base/radio-group), [Card](https://ui.shadcn.com/docs/components/base/card), [Dialog](https://ui.shadcn.com/docs/components/base/dialog) pages plus actual emitted wrappers/installed Base UI types. Additional Base UI radio-group markdown retrieval failed; installed source grounded that keyboard behavior.

## Checks

- `pnpm typecheck`: pass; `pnpm build`: pass (existing Vite future config-loader warning).
- `pnpm lint`: fail at unchanged `src/components/ui/button.tsx:58:18`, `react-refresh/only-export-components`. Preserved intentionally; no claim all checks pass.
- Actual agent-browser0.27.3 Chromium, desktop1440×960 and mobile390×960: required/invalid linked email error and focus; independent switch; disabled radio non-activation and retained choice; keyboard daily/weekly changes when on; unchanged status; review dialog summary; Tab/Shift+Tab focus loop; Escape/Cancel retaining draft and restoring Review focus; Confirm applying values, local live status and result-heading focus. Mobile final applied values: sam@example.test / Off / Weekly(paused). Card width358 and document width390; stable modal width358, stacked actions. Browser error log empty. No network interception or backend calls.

Observed failures and corrected original paths are preserved in `browser-transcript.txt` and `implementation-log.md`: sandbox runtime constraints; fill-vs-keyboard discrepancy; premature animation/focus observations; semantic switch locator failure; disabled-radio tab-stop expectation mismatch. No application source remediation was necessary after initial implementation. The selected disabled Base UI radio remains a tab stop, ignores activation and preserves value; no stronger accessibility claim. Final screenshot waits for animation completion; failed/early screenshots are explicitly distinguished in the log.

## Evidence and limits

Evidence root: `/tmp/design-tools-rev-20260909/joint-evidence`.

`before/`, `after/`, `source.diff`, `preservation-sha256.txt`; CLI info/docs/dry-run; typecheck/build/lint outputs; browser commands/results, screenshots, failure/fix notes; cleanup-before/after and server log.

Screenshots include desktop-edit/invalid-email/off/confirm/applied and mobile-edit/off/confirm/applied. `desktop-required-error.png` is the first failed automation attempt; use the corrected required-field snapshot in the transcript. `mobile-confirm-in-animation.png` is an early capture; final mobile-confirm.png is stable, opacity1.

Only the observed local Chromium flow is proved; no formal independent UI/accessibility verdict, screen-reader, dark-mode, cross-browser, durable state, backend, complete Pencil visual or save/reopen proof. Independent UI review is the next owner.

Cleanup verified: dtr-joint closed, assigned Vite listener and launcher/browser PIDs absent, port43866 not listening, no active agent-browser sessions. No publication.

Assigned model configuration: gpt-6-astra/high. Actual serving identity was not independently exposed.
