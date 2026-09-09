# Controlled focus-fault remediation

Status: completed for the bounded owner fix and exercised local regression path; ready for independent delta re-audit. This is remediation of an explicitly injected fixture fault, not a naturally discovered defect in the skill or initial app implementation. It does not change the earlier full-pipeline/Pencil verification limits.

Source: `/tmp/design-tools-rev-20260909/joint-base-project/src/App.tsx:125`.

- Before controlled SHA256: `19e033b13f67a14452c5b3667bd088611de48a1f4dfcb89ae377ca74fd73cb19` (matches assigned fault snapshot).
- Fixed SHA256: `0a5cacbb934b782d671a6395e17996147165d76994acd18f1686bcc9aff95080`.
- Exact delta: replace `finalFocus={false}` with `finalFocus={() => showResult ? resultRef.current : reviewRef.current}`. One line only. Before/after source plus full source/config/dependency checksum manifests are retained; only App.tsx differs. Button brand, all components, styles, unrelated source, package.json, lockfile and components.json are unchanged.

The independent reviewer supplied the controlled failure: keyboard Review → Enter → Cancel focused → Escape → modal removed leaves BODY focused, then Tab enters email. That is consumed pre-fix evidence, not a new owner reproduction. The actual installed Base UI DialogPopup type documents that false suppresses focus movement and a callback may return the target element. The fix uses the existing review/result refs and existing state to restore the correct live element after closing; no effect, timer, new state, dependency or component changes.

## Actual owner checks after the fix

- `pnpm typecheck`: passed.
- `pnpm build`: passed. Existing Vite config future-native-loader __dirname warning remains unchanged.
- Original keyboard path replay at `http://127.0.0.1:43869`, agent-browser session `dtr-joint-fix`: focus Review, Enter, wait for Cancel, Escape, wait for modal removal. Observed active element is BUTTON “Review changes”, not BODY. Pressing Enter immediately starts another review.
- Adjacent Cancel: Enter on focused Cancel closes dialog and returns focus to BUTTON “Review changes”.
- Adjacent Confirm: Tab from Cancel to Confirm, Enter, modal removed; active element is H2 “Changes applied”; applied result is Weekly.
- After-apply edit/cancel: Tab from result heading to Edit preferences, Enter, change Weekly→Daily with keyboard, Tab to Review, Enter, Cancel. Modal shows Weekly→Daily; Cancel retains Daily draft and returns focus to BUTTON “Review changes”.
- Browser `errors` returned no entries. No network mocking, backend or Pencil actions.

No unaffected layout/form validation scenarios or lint rerun: previous evidence covers the unchanged surface, including the known pre-existing lint failure in preserved Button. This owner report is not the independent re-audit verdict. No screen-reader, cross-browser or full-pipeline claim.

Evidence: `before/App.tsx`, `after/App.tsx`, `before-sha256.json`, `after-sha256.json`, `source.diff`, typecheck/build outputs, `browser-transcript.txt`, screenshots for Escape/result/after-apply Cancel, server log and cleanup-before/after files. No new browser scenario failed during this focused replay.

Cleanup verified: browser session dtr-joint-fix closed, port43869 has no listener, Vite PID350643 absent; launcher session ended143; agent-browser reports no active sessions. No publication, subagents, skill or Pencil changes.
