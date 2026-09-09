# Read inventory / provenance / settings

Task: actual UI consumer review of disposable joint. Inherited agent model/reasoning; no override requested or applied. No delegates. Read-only target; only report/provenance written. No new runtime, server, test, package install, web retrieval or source edits.

Active instructions read: supplied candidate-active/web-ui-reviewer/SKILL.md and required references/web-interface-guidelines.md. No unrelated repository, other skills, rubric, history or memory accessed.

Read inventory under /tmp/ui-rev-20260908:
- joint/README.md, src/main.jsx, src/style.css (full content); all eight source manifest files read by hashing to verify snapshot identity.
- results-candidate-additional/D1.md.
- results-joint-presentation/handoff.md, snapshot.json, checks.md; filenames inventoried in that directory. Viewed empty-mobile.png and list-desktop.png.
- results-joint-browser/handoff.md, raw.jsonl, api-evidence.json, network.har (parsed entries/request metadata); filenames inventoried in that directory. Viewed desktop-save-focus.png, mobile-error.png, mobile-return-list.png.

Evidence provenance: presentation producer reports agent-browser 0.27.3 Chromium on localhost:43788; browser consumer reports agent-browser 0.27.3 separate session localhost:43789, real synthetic HTTP, no interception. Raw command stream/HAR verified against the cited findings. No external integration assertion. snapshot.json all eight SHA256 entries match current target. UI reviewer did not independently rerun producer commands; screenshots listed above were directly visually inspected.

## Bounded re-audit 2026-09-09

Same supplied skill retained; mandatory web-interface-guidelines.md reread. Original report reread and preserved. No model/effort override, delegation, new server, browser session, test, source mutation or external retrieval. Wrote reaudit.md and appended this provenance only.

New reads under results-joint-fix: finalhandoff.md, stablemanifest.json, before-manifest.json, before-main.jsx, after-main.jsx, change.diff, states.py, cleanup.json, build.txt; raw.jsonl selected records 47–244 with detailed core 63–180; verified-retry.har, correction.har and neighbors.har API entries parsed. All eight joint manifest files hashed; current main.jsx inspected with line numbers; exact diff independently reconstructed and matched. Earlier failed branch1 HAR and excluded early screenshots not treated as success evidence.

Directly viewed nine screenshots: verified-error-desktop.png, correction-error-mobile.png, correction-success-mobile.png, create-required-desktop.png, create-required-mobile.png, ui-only-saving-desktop.png, verified-editor-required-desktop.png, verified-success-desktop.png, ui-only-creating-desktop.png. Producer screenshot review claims not substituted for reviewer viewing. Real core HTTP separated from later controlled response-delay/abort evidence. Intermediate list reload in retry branch explicitly reflected in the report; clean correction branch used for cache-navigation conclusion.
