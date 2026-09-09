# Notification settings — implementation handoff
Design artifact: `/tmp/design-tools-rev-20260909/pencil-live-test.pen`, area A. Status: six static frames visually and structurally verified; PNG exported; .pen save/reopen pending operator.
Purpose: implement a local notification-preferences prototype in the existing shadcn project, with synthetic data and no email transmission.

## Sources and assumptions
Task brief: `/home/kostysh/.codex/skills/custom/.worktrees/design-tools-revision/docs/reviews/design-tools-rev-20260909/raw-pencil-live-task.txt`. Existing MCP-visible summary origin `CR7qO` and overview `P1cmj` were inspected before creating and were preserved.
Neutral Inter typography, zinc-like monochrome colors, ordinary spacing were selected under the brief. Synthetic email `alex@example.test`. Initial saved state: notifications true, email as above, frequency daily. Depicted draft changes only frequency to weekly.
No existing runtime repository or components.json was available in this task. Before coding, inspect the actual project's component configuration, aliases, lockfile/package manager, primitive dependencies, theme, icons and local component modifications. Reuse its installed primitives and patterns. These design colors are a neutral directional reference; reconcile with existing theme tokens rather than replace the project theme.

## Frames and exported PNGs
| State | Desktop 1440 × 1000 | Mobile 390 × 1040 |
| --- | --- | --- |
| Edit | YinY7; exports/YinY7.png | U5hcvC; exports/U5hcvC.png |
| Confirmation | KSPqv; exports/KSPqv.png | Rn7JR; exports/Rn7JR.png |
| Applied | F9YSQK; exports/F9YSQK.png | ypajU; exports/ypajU.png |

Desktop roots are at x1600/3200/4800, y1100. Mobile roots at same x columns, y2300. Reusable card `q5njV2` at (1600,400), width640. Its connected instances: oPZnK/hZmcp (edit), GSVaD/BEIgH (confirm), vbkzQ/fUDOU (applied). Summary refs to CR7qO: vAlv5/AIUDZ, YVOUO/fG5xg, K23cdE/Du0dN respectively.
Dialog nodes: desktop Y7aE6, mobile N6eSJ5. Frame names and visible content identify states. Copied metadata.state remains draft due provider behavior, and is not a transition definition.

## Behavior contract for implementation
Maintain separate `saved` and `draft` values and `dialogOpen`; changes do not update saved until Apply changes.
- Email input has an explicit associated label, type=email and a stable id. Editing the email never toggles notifications or changes frequency.
- Switch has its own labeled boolean state. Turning off does not overwrite email/frequency; proposed local behavior is to retain values, disable frequency controls while off, and allow email editing independently. Review must still show notifications Off clearly.
- Frequency is one radio group with mutually exclusive Daily and Weekly. The screenshot depicts weekly selected.
- Review changes is disabled when there are no changes or the email is invalid. Show an inline error associated with the email when invalid; do not open confirmation until valid. These validation/off/disabled interactive variants are implementation requirements proposed here, not separately drawn or runtime-tested.
- Valid Review changes opens a modal reviewing the current draft email, notifications and frequency. Depicted frequency diff is Daily → Weekly. The summary outside the dialog remains saved Daily until apply.
- Back or Escape closes dialog and keeps draft. Return focus to Review changes. Trap focus in the open modal; provide semantic title/description and prevent background interaction. Initial focus on Back is a conservative local choice.
- Apply changes copies draft to saved locally, closes the modal and displays the applied state. Summary becomes Preferences applied · Weekly, status says changes applied locally, and no-changes action becomes disabled.
- After apply, announce success through an appropriate live status. If Review is now disabled, move focus to the settings heading or status rather than a disabled trigger. Subsequent edits restore the Review action.
- Space toggles switch; arrow keys operate radio choices. Tab order follows labels/controls, frequency, Review, then modal-only actions while open.
- Use session-local React state only unless the owning runtime task explicitly requests browser persistence. No email API, network delivery or production account data.

## Suggested shadcn composition
Use the project's existing Card, Label/Input (or its Field abstraction), Switch, RadioGroup/RadioGroupItem, Button and Dialog family. Reuse a NotificationSettingsCard component for the preference form. Keep saved-summary and success status distinct from editable inputs. Use the existing form/validation pattern; do not assume a new dependency is required.
Confirm the actual primitive base before adding or updating components. A Pencil ref is a design connection and does not automatically convert to a React component.

## Responsive and visual treatment
Desktop: page64 padding, navigation divider, centered640 content column, 32 section separation, card24 padding, card vertical gaps24. Heading32/600; body16, labels14; ordinary line height about1.45. Card white with subtle #E4E4E7 border and radius12 on #FAFAFA page. Primary action #18181B with white label.
Mobile390: page20 padding, full350 content, heading28, card remains fluid. Email and helper text wrap to content width. Daily/weekly remain two equal choices. Review button full width. Use a fluid max-width640 content column between widths; the mockup canvas height is an export size, not a fixed runtime viewport requirement. Allow page scrolling on shorter devices.
Dialog: desktop480 wide, centered with horizontal Back/Apply actions; mobile350 wide (20 edge clearance), stacked full-width actions. For shorter viewport heights allow modal content scrolling and preserve reachable actions; verify in runtime.
Use installed focus-visible and disabled styles, maintain accessible labels and contrast, and verify 390 and1440 widths plus shorter viewports.

## Evidence and remaining work
See result.md for raw call index, recovery, authorization and save status. Latest structural checks report no clipped nodes across all seven new roots including resolved instances; MCP screenshots were inspected, six PNG exports succeeded.
The handoff is sufficient for a developer to implement the represented happy path and the specified behavior assumptions, but it is not working React or automatic conversion evidence. Validate actual form, independent state, dialog focus/escape, responsiveness and local apply in browser. Production backend, email, accessibility conformance and persistence are outside proven results.
Operator next action: save in Pencil, reopen the same file and notify the coordinator for MCP readback. Until then only live design and exported PNG persistence are confirmed.

