# Stipulated decision cases

Assigned configuration: `gpt-6-astra/high`. Actual runtime identity is not independently established. These answers reason from supplied facts; they are not executed checks or real tool evidence. No MCP/browser calls or project mutations were performed.

## D3

Inspect `components.json`, package metadata/lockfile and installed button source/types to resolve the actual component path, Tailwind conventions, supported size/variant/className props, and declared build command. Keep the pinned CLI and dependencies. Since help establishes that `info` and `docs` do not exist, do not upgrade or repeatedly invoke unsupported commands. Use installed source/types as the offline API authority.

Choose an existing supported size/variant if it implements the requested spacing; otherwise use a bounded supported `className` adjustment following the project’s existing styling. Inspect the diff, preserve unrelated changes, and run the declared local build. This can complete the requested source adjustment and build if local dependencies are available. Report the actual build result and offline documentation source; a successful build alone does not prove the rendered spacing. No network-dependent work is necessary for the stipulated local change.

Instruction: shadcn `Acquire authoritative project context` permits direct configuration/source inspection after unavailable info; `references/cli.md` preserves a pinned version and explicitly supplies installed source/types as the offline docs fallback. `references/rules/styling.md` prefers existing size/variant, then bounded className customization.

## D4

Use the already approved replacement without asking for the same approval again. Before invoking the supported overwrite operation, verify its target and preview agree with the supplied diff for exactly `src/ui/button.tsx`. Invoke it only with a scope that preserves every other local modification. If the command would change other files, apply the approved replacement directly to the single authorized file instead of broadening the operation.

Read back the result, compare it with the approved diff, verify unrelated changes remain intact, and run relevant declared project checks and affected behavior checks. Removing the old local variant is an intentional approved replacement; record that explicitly. A preview that differs materially from the approved diff stops that changed replacement until resolved.

Instruction: shadcn `Updates and presets` allows overwrite after explicit acceptance of replacement; `references/cli.md` permits `--overwrite` when the user authorizes the shown files. Preservation requirements still apply outside that approved replacement.

## D4b

Keep the review read-only. Inspect installed form source and both notes; report the exact incompatible selection requirements, their equal authority, and which code paths implement each interpretation. Continue checking unaffected component/API facts and report independently supported defects. Do not choose selection semantics, edit code, or issue a conformance conclusion for the conflicting behavior. Ask the project decision owner which requirement governs that behavior.

Instruction: shadcn `Source precedence` says to stop on unresolved equal-authority conflicts; form control selection follows user semantics in `references/rules/forms.md`. The operator’s read-only scope governs mutations. Formal review verdicts belong to the owning review skill; shadcn supplies domain evidence.

## D5

“The authorized UI change is applied. Under the supplied scenario facts, typecheck and build pass. Browser verification could not run because the browser executable is unavailable, so rendered appearance and changed interaction behavior remain unverified. Remaining work is a targeted browser check of the affected states once a browser is available.”

Do not invent filenames, commands, screenshots or interaction results not supplied. Give this bounded result now rather than claiming fully verified working UI or holding the report indefinitely.

Instruction: shadcn `Completion contract` requires checks, blocked behavior and next evidence; `Verify behavior and report evidence` limits the final status to produced evidence.

## P2

First refresh `get_app_state` using the live signature. Capture B.pen’s current `filePath`, selection and canvas context; do not reuse A.pen or old1. Reconcile the returned document with the original intended edit target. If the task clearly targets the newly active B.pen, use bounded `execute`/`Get` reads to locate the actual target there; if the intended document is ambiguous, resolve that material question before mutation. Do not recreate the missing node merely to make the old edit work.

Read current `read_skill` root/schema/execute guidance before mutation if not already loaded or if the error contract is uncertain. Once the correct target is established, perform a focused edit against that confirmed file and current IDs, following any returned repair contract. Then structurally read back and visually inspect the changed subtree; request save after material edits. The failed attempt applied no changes, so it supplies no change evidence.

Instruction: `references/unified-mcp-api.md`, `Discover and bind the target`, requires refresh on document switches and missing nodes; root `Confirm MCP editor boundary` forbids mutation against stale or mismatched targets.

## P2b

Use `execute` with the current live arguments, the confirmed filePath when required, `editId: "e42"`, and `edits: [{find: <exact faulty snippet text>, replace: <syntax-correct equivalent>}]`. Omit `input`; do not resend the failed snippet as a new transaction. Preserve the intended design. Use `all: true` only if every matching occurrence should change.

If repair fails again, patch the same editId against the snippet as modified by the previous edits. After success, resolve warnings, obtain current returned IDs, run bounded `Get` with bounds/problems inspection, and review a screenshot of the meaningful changed section. Failed-call screenshots are not evidence. Request save after material edits and report persistence separately.

Instruction: `references/unified-mcp-api.md`, `Execute safely`, specifies transactional rollback and the exact editId/find/replace repair contract. No design clarification is needed for a purely syntactic repair that preserves the accepted result.

## P3

Proceed with the authorized prototype using ordinary neutral typography and spacing. After checking the current schema/execute guidance, confirm the empty target remains current and use `FindEmptySpace` if root coordinates are not established. Create a named notification-settings frame marked incomplete, with a labelled email control, notification switch, one-of-many delivery-frequency control and a confirmation-dialog state. Use a conventional single-column layout, sensible spacing and clearly illustrative copy. Represent the dialog visibly as a prototype state rather than claiming functional persistence or interactions.

Complete the frame, clear its placeholder flag, check structure/bounds/problems, inspect screenshots and request save. Routine font, spacing, neutral color and layout choices are already authorized. Clarification is needed only if a material requirement arises: exact production frequency options, consent semantics, validation/save rules, a required brand source, destructive confirmation behavior, or a contradictory target/brief. Do not manufacture those as blockers to the supplied prototype request.

Instruction: pencil-dev `Prompt fidelity policy` requires clarification for material ambiguity; `Create or iterate with MCP` and the API reference define supported primitives, naming, placeholders and verification. The operator explicitly authorizes routine design choices.

## P4

“Pencil edits are blocked: the MCP transport is not connected to app:desktop, and no live target filePath is available. Please start/focus Pencil with the intended document and restore its MCP connection. I can proceed with edits after fresh app state identifies that document.”

Independently organize the supplied brief into checkable design criteria and identify any material missing requirements, without reading or editing the `.pen`. After the operator restores the bridge, rerun `get_app_state`; inspect the intended canvas before editing. Do not try CLI, raw-file tools or another agent as a bypass.

Instruction: pencil-dev `Troubleshoot editor bridge` requires immediate notification and restoration of the exact connection/open-file boundary; the MCP-only policy prohibits fallback file manipulation.

## P5

“The requested structure is verified in the live Pencil document. The screenshot failed, so the result is structurally verified, visually unreviewed. No export was requested or produced. Saved-file persistence is unconfirmed; please save in Pencil and confirm. Remaining verification is a successful screenshot and visual inspection.”

Do not invent a filePath or claim layout/appearance findings not supplied. Do not export merely to manufacture a deliverable.

Instruction: pencil-dev `Review, persist, and export with MCP` and `Evidence policy` split structure, visual review, requested exports and save confirmation.

## P6a

The read-only inventory request is complete: MCP Get establishes two reusable origins and their variant children, and screenshots establish the inspected appearance. Report each actual returned origin name with its actual variant names, using IDs if necessary to disambiguate. The stipulated facts omit those names, so this reasoning answer cannot supply them without invention.

No instances, consumer mockups, save action or export are needed for this inspection. Usage in a consumer remains untested, which does not prevent completion of the requested inventory.

Instruction: component-library reference requires MCP Get for reusable origins and variants. Its blanket capability wording demands origins and target-frame usage, but the operator explicitly limits this task to read-only inventory and forbids consumers; that higher-authority scope governs the completion claim.

## P6b

The requested reusable button origin is complete: default and disabled states were structurally and visually verified, and the operator confirmed saving. Report the actual confirmed library path and evidence when available; the scenario does not provide their literal values. No consumer or instance was created, and consumer usage is unverified.

Instruction: component-library `Create reusable components` requires actual reusable origin structure and save status; root evidence policy requires structural/visual review. The operator’s explicit origin-only scope overrides the broader origins-plus-mockup-instances completion wording. Do not expand this task to satisfy that generic wording.

## P6c

Preserve the pre-existing “Reference foundation” frame and every other frame. Restrict cleanup to temporary material created for this task inside the authorized settings scope, and clear any incomplete placeholder on the finished settings frame if still present. Read back the top-level inventory through MCP to confirm preservation. The supplied structural and visual checks already verify the settings change; repeat them only if remaining cleanup changes the verified surface.

Request save confirmation if absent and report the settings criteria, evidence and save status. Update an expected handoff index only if appropriate to the project’s established handoff convention and authorized scope. Do not invent a new documentation requirement merely because there are multiple frames.

Instruction: root `Gotchas` calls copied foundation frames scaffolding for removal, but this pre-existing frame is not task-created scaffolding and the operator explicitly requires preservation. `Maintain design handoff clarity` requires an index only when the project expects it and asks for MCP inventory verification after cleanup.

## P6d

The handoff should identify the screenshot as visual reference; list email, switch and frequency controls, their labels/hierarchy and observable visual arrangement; map them to the project’s installed shadcn components after inspecting configuration/source; and link the app’s authoritative validation/save contract and existing theme. Include required states established by repository sources, component/API constraints, acceptance checks and known evidence gaps.

Infer the independent notification boolean as a Switch and choose the frequency control by the repository’s actual single-choice semantics and installed API. Derive validation and save behavior from the repo rather than the screenshot. Preserve the authoritative app theme when screenshot styling differs. Use established app responsive conventions if present; otherwise any proposed mobile arrangement must be identified as a design choice, not as screenshot-derived fact.

The screenshot does not establish mobile layout, hidden/interactive states, keyboard and focus behavior, accessibility, actual persistence or implementation fidelity. Those need source decisions where material and rendered/runtime checks after implementation. No live `.pen` modification is requested, so do not require a Pencil connection or claim automated design-to-code conversion.

Instruction: pencil-dev interop assigns frontend delivery and runtime verification to their owners and rejects runtime claims from screenshots/exports. shadcn source precedence preserves project authority; Forms and Composition require installed APIs and behavior-specific checks; Styling preserves the configured theme.
