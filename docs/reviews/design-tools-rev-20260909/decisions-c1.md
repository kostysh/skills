# Stipulated decision cases

Assigned configuration: `gpt-6-astra` / `high`. This records the assignment, not a verified runtime model identity. These answers are reasoning over supplied facts, not real tool execution or an independent PASS assessment. No project or Pencil mutations were performed.

## D3 — Older pinned CLI, offline spacing change

Use the pinned CLI contract; do not upgrade or invoke unsupported `info`/`docs` commands after help has established their absence. Inspect `components.json`, package metadata, the lockfile and installed button source/types to resolve aliases, Tailwind configuration, existing size/variant choices and supported customization props. Prefer an existing size/variant if it expresses the requested spacing; otherwise use the installed supported `className` mechanism for the smallest adjustment. Preserve local variants and theming. Run the declared local build and applicable narrow checks; inspect the resulting diff for unintended changes.

The spacing edit and local build can proceed offline if the installed contract and local dependencies are sufficient. Report official online documentation as unavailable and name local source/types and command help as the API evidence. Build success would prove the build, with visual spacing still requiring rendered inspection. No missing-network blocker should be invented for source-supported local work.

Instruction: `shadcn/references/cli.md`, “Runner and live contract” preserves pinned versions; “Acquire project context” provides direct inspection fallback; “Component docs” explicitly uses installed source/types offline. `shadcn/references/rules/styling.md`, “Variants and className” gives the customization order.

## D4 — Explicitly approved single-file replacement

Reuse the explicit approval for the supplied `src/ui/button.tsx` diff, including removal/replacement of its old local variant. Establish the current file and unrelated-change baseline; verify the command's actual target/output scope against that exact approved diff. Then perform the narrowly scoped replacement using its supported overwrite flag when its preview confirms the single-file scope. If the command necessarily writes other files, do not run it broadly: apply the already approved exact file diff directly, or resolve an unavoidable wider scope before those additional writes.

Read back the final button source, confirm its delta equals the approved replacement, and verify all other pre-existing modifications remain intact. Run applicable declared project checks and interaction verification for affected behavior. Report the intentional approved replacement. A second approval is unnecessary for the unchanged approved scope; newly discovered collateral changes are outside it.

Instruction: `shadcn/SKILL.md`, “Updates and presets” permits overwrite after explicit acceptance; “Plan and apply the smallest safe shadcn change” preserves unrelated modifications. `shadcn/references/cli.md`, “Update installed components” limits overwrite to shown, authorized files and requires readback and checks.

## D4b — Read-only review with conflicting behavior requirements

Keep the reviewed source unchanged. Inspect the installed form contract and report its actual selection behavior, supported by source and any available non-mutating evidence. Assess unaffected form aspects such as control semantics, labeling, disabled/error handling and composition. Record both equally authoritative notes and the observable difference each would require; do not choose one implicitly or remediate the form.

The selection-conformance conclusion remains unresolved until the operator or owning requirement authority identifies the governing behavior. Other supported findings can be delivered now. A formal review verdict belongs to the owning review skill, with shadcn supplying domain facts; no unconditional conformance conclusion follows from an ambiguous requirement.

Instruction: `shadcn/SKILL.md`, “Source precedence” says to stop on unresolved equal-authority conflicts; “When NOT to use” and “Interop priority” route formal verdicts. `shadcn/references/rules/forms.md` chooses controls by semantics and requires behavior evidence rather than JSX alone.

## D5 — Passing static checks, browser unavailable

Bounded final report: “The authorized UI change is applied. Typecheck and build pass according to the supplied scenario facts. Browser verification could not run because the browser executable is unavailable, so the affected rendered appearance and interaction remain unverified. Remaining work is to restore an available browser environment and exercise the changed states and interaction. This is implementation and build completion, with browser verification outstanding.”

In an actual handoff, identify the inspected context, changed files and exact successful commands from real evidence; those details are not supplied here and must not be fabricated. Do not delay this requested report or describe the UI as fully working.

Instruction: `shadcn/SKILL.md`, “Completion contract” and “Verify behavior and report evidence” require explicit evidence limits and prohibit working-UI claims from compiler validation alone.

## P2 — Document switch and missing target

Stop using cached `A.pen` / `old1`. Next call fresh `get_app_state` using the live signature; inspect the active document, canvas, selection and returned `filePath`. Confirm whether B is the intended task target: a user switch establishes changed editor state, but does not automatically retarget an A-specific edit. If task intent remains ambiguous, clarify the target before mutation.

Once the intended document is confirmed, load current provider guidance through `read_skill` where needed, then use a bounded `execute` `Get` with that exact `filePath` to locate and verify the actual target and relevant current content. Do not recreate the missing node or reuse A's IDs in B. Apply the scoped edit only after the mismatch is resolved; then read back structure and review a screenshot, followed by save confirmation for material edits. No rollback is needed for the stipulated failed attempt because no changes were applied.

Instruction: `pencil-dev/references/unified-mcp-api.md`, “Discover and bind the target,” requires fresh state after document switches and missing nodes and prohibits inferred cached targets. `pencil-dev/SKILL.md`, “Confirm MCP editor boundary,” prohibits stale or mismatched mutations.

## P2b — Transactional syntax repair

Use the returned repair contract for `editId: "e42"`: provide `edits: [{find: <exact faulty snippet text>, replace: <syntax-correct text>}]`, plus any live-schema-required target field. Omit `input`; do not submit the failed snippet as a new execution. Preserve the intended design semantics, and use `all: true` only if every match should change. The exact strings require the actual failing snippet and error; they cannot be invented from this case.

If repair fails, keep repairing `e42`, matching the snippet as modified by earlier edits. Treat the original failed transaction's changes and globals as rolled back and any screenshot from it as invalid evidence. After success, resolve returned warnings, use fresh returned IDs for bounded structural readback and bounds/problems checks, and visually inspect the completed section through `TakeScreenshot([nodeId])`. Request save confirmation after material changes. Clarification is needed only if a purported syntax/property fix would change intended design semantics.

Instruction: `pencil-dev/references/unified-mcp-api.md`, “Execute safely,” explicitly specifies `editId` plus `{find, replace}`, no repair `input`, transactional rollback and same-ID retries.

## P3 — Routine prototype design choices

Proceed with the confirmed empty test document. Read current schema/execute guidance, translate the brief into checkable criteria, and use `FindEmptySpace` if root coordinates are not already established. Create a named notification-settings frame with a neutral palette, ordinary typography and consistent spacing; include a labeled email field, notification switch, delivery-frequency control, and a clearly titled confirmation-dialog state. Mark incomplete root frames as placeholders, build focused sections with supported schema primitives and returned IDs, then clear placeholders when finished. Verify structure, bounds/problems and screenshots; ask the operator to save.

Routine prototype choices such as font size, spacing, neutral shades, control arrangement and illustrative dialog copy are authorized and need no clarification. Label any illustrative frequency values or UI states as prototype assumptions rather than accepted business policy. Clarification is required only when a choice materially commits product behavior or conflicts with an accepted source—for example real delivery schedules, what action requires confirmation, whether disabling notifications affects all channels, or production validation/persistence behavior. A static screen/dialog prototype can proceed without implementing or claiming those runtime decisions.

Instruction: `pencil-dev/SKILL.md`, “Prompt fidelity policy,” requires clarification for material ambiguity; the supplied brief explicitly authorizes routine design choices. `pencil-dev/references/unified-mcp-api.md`, “Create and generate without corrupting layout” and “Read and verify proportionally” govern creation and verification.

## P4 — Disconnected desktop bridge

Immediate response: “Pencil editing is blocked: `get_app_state` reports `transport not connected to app:desktop`, so I cannot identify a live target document. Please start or reconnect Pencil's desktop MCP bridge and open the intended canvas. I can resume once fresh app state returns that document and its `filePath`.”

Useful independent work is to organize already supplied requirements into a compact checklist of requested edits and verification criteria. Do not claim inspection of the unseen document. After connection restoration, re-run app state, confirm the intended target, then inspect it before editing. Do not invoke raw `.pen` reads, CLI, another agent or browser as a bypass.

Instruction: `pencil-dev/SKILL.md`, “Troubleshoot editor bridge,” requires immediate notification and restoration of the connection boundary; `pencil-dev/references/unified-mcp-api.md`, “Discover and bind the target,” stops operations without an identified live file.

## P5 — Structure confirmed, screenshot failed, save unknown

Completion report: “The requested structure is confirmed by Pencil Get. Status: **structurally verified, visually unreviewed**; the screenshot failed, so visual completion is not established. No export was requested or produced. Saving is unconfirmed, so durable `.pen` persistence is not established. Remaining work is a successful screenshot and visual inspection, plus operator save confirmation after material edits.”

Do not manufacture an export to close the visual gap. The target path, detailed criteria, warnings and generation status were not supplied in this case; do not invent them or report a clean state beyond Get's stated structural result.

Instruction: `pencil-dev/SKILL.md`, “Review, persist, and export with MCP,” and `pencil-dev/references/unified-mcp-api.md`, “Completion and persistence,” separate structure, visual review, requested exports and saving.

## P6a — Read-only library inventory

The requested inspection is complete for the stipulated returned inventory: MCP Get establishes two reusable origins with their variant children, and screenshots establish the inspected appearance. Report the exact origin names and variant child names from that return, along with scope and any uninspected portion. The case does not give those names, so this reasoning answer cannot fabricate a literal inventory table.

No consumer mockup, instances, mutation or save request is needed. Do not claim consumer connectivity or behavior from origin inventory and screenshots.

Instruction: `pencil-dev/references/component-libraries.md`, “Capability boundary,” says inspection reports MCP-visible inventory and does not require mutations, a consumer or saving an unchanged document.

## P6b — Origin-only reusable button

The requested origin-only creation is complete: the reusable button origin with default and disabled states is structurally and visually verified in the dedicated MCP-visible test library, and saving is confirmed by the operator. Report the actual confirmed library path and origin/state identifiers when available; none are supplied here. No consumer or instance work remains under this request, and no consumer usage or runtime behavior is proven.

Instruction: `pencil-dev/references/component-libraries.md`, “Capability boundary,” explicitly permits completion of origin-only creation without an unrequested consumer; “Create reusable components” and the root save contract require origin evidence and persistence confirmation, which the scenario supplies.

## P6c — Preserve pre-existing reference frame

Preserve “Reference foundation” and every other frame outside the settings-only scope. Its name does not make it disposable. Remaining cleanup is limited to confirmed temporary scaffolding created by this task, if any: re-read candidate nodes and relevant refs before removing them, and preserve anything with uncertain ownership or needed connections. Clear any task-owned incomplete placeholder state only when the settings frame is finished; do not alter other frames merely for neatness.

Verify the remaining frame inventory and any affected connections through MCP. Hand off the verified settings change, its evidence and preserved scope; request save confirmation if absent. Update a sibling README/index only if the project expects that handoff artifact and it fits the authorized scope, recording the existing reference frame as retained. Do not invent cleanup work or a new unconditional documentation gate.

Instruction: `pencil-dev/SKILL.md`, cleanup “Gotchas” permit removal only of task-created disposable scaffolding or explicitly authorized cleanup and require preservation of pre-existing nodes; “Maintain design handoff clarity” makes README/index work conditional on project expectation.

## P6d — Screenshot-to-shadcn handoff

The handoff should identify the screenshot as visual reference, the repository as authority for validation/save behavior and existing theme, and the exact target screen/components. Record the visible hierarchy, labels, field grouping, spacing/alignment relationships and control/dialog states actually shown; distinguish measured/observed properties from implementation assumptions. Map email to a labeled input, the independent notification setting to Switch, and delivery frequency to an appropriate choice component using the repo-defined selection semantics and installed APIs. Record repository validation, error/disabled/loading behavior, save flow and resulting feedback with source pointers when inspected. Include responsive decisions, accessibility requirements and the checks needed to verify the implementation.

The screenshot supports visible layout and controls, not hidden behavior or exact underlying component props. The repo can resolve validation, save behavior and theme; inspect `components.json`, package/lockfile and local wrappers before selecting imports and shadcn props, then use supported docs/source. Follow existing responsive conventions if they provide sufficient authority; otherwise identify a proposed narrow-screen layout as an assumption and clarify only material behavior/layout ambiguities. Do not invent a mobile design or frequency choices as screenshot facts.

Unverified from these inputs: mobile appearance, keyboard/focus behavior, screen-reader labeling/error announcements, runtime validation/save execution, responsiveness and fidelity of the final implementation. A supplied screenshot does not establish the underlying `.pen` structure, reusable-library connections or saved state. This is an explicit design-to-code handoff, not automated conversion; verify the resulting application through its build and appropriate browser checks.

Instruction: `pencil-dev/SKILL.md`, “Interop priority” and “Runtime delivery policy,” separate design handoff from frontend delivery/runtime evidence. `shadcn/SKILL.md`, “Inputs and authority” and “Completion contract,” require project-resolved APIs and bounded claims; `shadcn/references/rules/forms.md`, `composition.md`, and `styling.md` provide semantic, interaction and theme guidance.
