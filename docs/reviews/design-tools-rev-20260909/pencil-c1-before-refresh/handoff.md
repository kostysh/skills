# Notification settings — handoff B

Status: design structure authored in the live Pencil document; visual verification BLOCKED. This is a directional design, not running React, automatic conversion, accessibility proof, or working persistence. The MCP snapshots and PNG exports of new content are blank despite populated node readback. Geometry visitors also report clipping. Do not implement by tracing the blank exports or treat this handoff as accepted visual evidence.

## Sources and scope

- Operator brief: `raw-pencil-live-task.txt` supplied for this trial; notification settings, reusable card plus connected instance, email field, independent notification switch, daily/weekly choice, Review changes, confirmation, applied result, desktop1440/mobile390, local synthetic data, PNG and implementation handoff.
- Intended live document: `/tmp/design-tools-rev-20260909/pencil-live-test.pen`, confirmed by get_app_state; no selected nodes at task start.
- Existing reusable library origin `w15TUy` and overview `vczSV` were inspected through MCP. The origin is reused via refs; the overview and its existing ref `CKBsf` remain unchanged in readback.
- Current provider root, pen-schema.md, execute.md and guide/components.md own the calls; supplied candidate pencil-dev active files own the workflow. No raw .pen access occurred.
- Only area B x10000..17800/y400..7400 was mutated. All new names begin B. No unrelated subtrees were inspected. No temporary canvas scaffolding was created; the reusable origin is an intentional deliverable.

## Canvas inventory

| Frame | Node | Canvas origin | Size |
| --- | --- | --- | --- |
| Reusable settings card | `jYGGQ` | 10000,400 | 600 × fit content |
| Desktop edit | `z2Por` | 10000,1200 | 1440 × 960 |
| Mobile edit | `snDqf` | 11520,1200 | 390 × 960 |
| Desktop confirmation | `F9YG0` | 12500,1200 | 1440 × 960 |
| Mobile confirmation | `E58XP` | 14020,1200 | 390 × 960 |
| Desktop applied | `P6Voh` | 15000,1200 | 1440 × 960 |
| Mobile applied | `D8GhR` | 16520,1200 | 390 × 960 |

`jYGGQ` has reusable:true. Edit refs `Xrjdb` and `etJey` point to it; copied confirmation screens preserve the refs. Its header `YPqkY` points to existing `w15TUy`. Confirmation summaries `x8k0I`/`VEjAM` and applied summaries `ZJGw4`/`VbePW` also point to `w15TUy`. `16-component-evidence.json` includes connected-ref and resolved mobile content readback.

## Behavior to implement

Use synthetic `alex@example.test`. Proposed initial applied state is notifications on, frequency daily. The edit frames show a draft with weekly selected; confirmation shows Daily → Weekly, notifications On and the unchanged email. Applied state reports weekly. Initial values and session-only retention are ordinary prototype assumptions, not established backend requirements.

Maintain separate draft and applied values. Typing edits the email draft. The notification switch changes only its boolean; it does not submit, rewrite email or alter the selected frequency. Daily/weekly is one mutually exclusive choice. When notifications are off, retain email and frequency so switching back on restores the choice; keep both editable. This independence is deliberate. A real off-state control must move the thumb left and expose the false semantic value, not merely dim the row.

Review changes validates a required syntactically valid email and opens the confirmation dialog with the draft summary. Invalid email must receive a linked inline message and focus. If no values differ, keep Review changes disabled or expose a clear unchanged status using the project convention. These edge behaviors need implementation and tests; they are not separately drawn.

Keep editing or Escape dismisses the dialog without applying and returns focus to Review changes. Apply changes copies the reviewed draft to local applied state and displays the applied result. Edit preferences returns to the edit form populated from that result. No email, network request, backend write, analytics, or user data is required. In-memory retention lasts only for the demo session; reload may restore the synthetic defaults. Dialog wording refers to this intended local behavior, not to .pen save status.

## Existing shadcn project integration

The brief identifies an existing shadcn project, but no project location or implementation files were supplied to this executor. Reuse its actual components, aliases, primitives, form conventions and theme after inspecting its components.json and source. The following maps design roles, not verified exports or exact API signatures:

| Design role | Existing project component to look for |
| --- | --- |
| Settings card and result | Card and its existing header/content/footer composition |
| Email | Label + Input, with project form error/help convention |
| Notifications | Switch with associated label and checked state |
| Frequency | RadioGroup and two RadioGroupItem controls |
| Review/apply/edit actions | Button variants |
| Confirmation | Dialog, title, description and actions |
| Applied feedback | Project status/Alert pattern or visible status region |

Use semantic label associations, email autocomplete/type, accessible radio group naming, keyboard switch/radio behavior, visible focus, dialog focus trapping/restoration and a live status announcement. Preserve the project's Radix/Base UI choice and imports; this design does not authorize replacement of its component system or dependencies.

## Responsive and visual treatment

Neutral palette: page #FAFAFA, surfaces #FFFFFF, primary text/actions #18181B, secondary #52525B, borders #E4E4E7/#D4D4D8; Inter typography at 12/14/22–32px. Existing library header uses its #F4F4F5 surface. Main desktop content is 600px centered inside a 1440px page with 64px page padding. At 390px, use 16px page gutters and 358px card width. Cards use 24px padding and 24px main gaps; fields use 8–10px gaps. Frequency options stack at both sizes. Desktop dialog is 480px wide with side-by-side actions; mobile dialog is 358px with stacked full-width actions. Screens are 960px tall for canvas inspection; actual pages must scroll normally instead of forcing this fixed viewport height. A 640px responsive transition is a proposed implementation assumption to reconcile with the host project.

## Evidence, exports and persistence

`raw-tools.json` preserves initial provider docs and authoring response including screenshot. Subsequent numbered JSON files retain exact Pencil arguments, returned text and base64 screenshots. `07-card-readback.json` records initial clipping; `08-layout-repair.json` records unsuccessful explicit-position diagnosis; `09-provider-diagnostic.json` records removal of those coordinates, a normal existing-library screenshot and a blank card export. Later reads still report clipping. There are no outstanding inserted-coordinate warning messages after cleanup, but layout problems remain unresolved.

The six PNG exports are `exports/z2Por.png`, `exports/snDqf.png`, `exports/F9YG0.png`, `exports/E58XP.png`, `exports/P6Voh.png`, `exports/D8GhR.png`. Export calls completed; these files are diagnostic/incomplete visual deliverables, not verified completed screens. The diagnostic card PNG is `diagnostic/jYGGQ.png`.

Save status: no operator confirmation yet and no documented save API. Requested operator action is to save the intended document in Pencil, then reopen/focus its Pencil canvas to refresh the bridge. After that, fresh get_app_state, bounded component/geometry readback, TakeScreenshot and corrected PNG exports are required. Until then, durable .pen persistence and visual conformance remain unconfirmed. Root cause of the blank-new-content/rendering versus normal existing library is not proven.
