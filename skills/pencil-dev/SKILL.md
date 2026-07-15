---
name: pencil-dev
description: Create, iterate, inspect, validate, and export Pencil `.pen`
  designs through Pencil MCP tools connected to an open editor. Use for UI
  mockups, app screens, dashboards, web pages, marketing visuals, slide-like
  graphics, or edits to existing Pencil designs; keep `.pen` handling MCP-only.
metadata:
  source-version: 0.1.9
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: bbded369974202e8db0c4bda384b045a90f0907e5c51f7eaa023172b5736e994
---

# pencil-dev

## Start here

1. Confirm the request needs a Pencil `.pen` design artifact, not only web code, prose, or a generic bitmap image.
2. Separate capability from substrate. Success means the requested design criteria are verified in the intended MCP-backed document, with visual evidence and persistence status appropriate to the claim; tool discovery or MCP success alone is substrate.
3. Treat MCP-only handling as this skill's operating policy, not as a claim about Pencil's underlying file format. Do not read, parse, diff, patch, or hand-edit `.pen` files through filesystem or JSON tools, and do not use Pencil CLI as fallback.
4. At the start of every task, call `get_editor_state(include_schema: true)`, confirm the intended active file/canvas/selection, capture its `filePath`, and follow the returned live schema for downstream calls.
5. Derive checkable criteria from the user's brief before editing. Stop for clarification when material ambiguity or conflicting authority would require invented design decisions.
6. If Pencil MCP is absent/disconnected or cannot see the intended open file, immediately notify the operator, diagnose that exact boundary, and report blocked if it cannot be restored.
7. For creation or material visual edits, require structural readback plus an MCP screenshot or visual export. Report `structurally verified, visually unreviewed` when visual evidence is unavailable.
8. After material edits, ask the operator to save in Pencil. Do not claim a durable saved `.pen` without save confirmation; report exports and persistence as separate results.

## When to use this skill

- Creating a new Pencil design in an open Pencil editor through MCP.
- Iterating on an existing open `.pen` file while preserving design continuity.
- Inspecting, validating, or modifying a Pencil design through Pencil MCP tools.
- Exporting nodes from an open `.pen` design through MCP.
- Creating or using component libraries through MCP-visible reusable nodes and instances.
- Producing visual mockups for websites, app screens, dashboards, slides, posters, banners, or marketing assets when MCP can operate on the open design.

## When NOT to use this skill

- The user only wants frontend code changes and no Pencil design artifact.
- The task is generic raster image generation or photo editing; use an image generation/editing workflow instead.
- The task requires manual JSON surgery, raw `.pen` parsing, filesystem patching, or text-editor edits inside `.pen` files.
- The task can only be performed by Pencil CLI, CLI interactive mode, CLI agent mode, headless generation, or path-based export without an open MCP-connected editor.
- Pencil MCP cannot see an open Pencil desktop/IDE document and the operator cannot restore that bridge in the current session.

## Overview

`pencil-dev` works on open Pencil `.pen` artifacts only through Pencil MCP. Its
capability is a design result checked against the user's brief, with evidence
and persistence status matched to the claim. MCP setup and successful calls are
only substrate.

## MCP-only `.pen` boundary

MCP-only handling is this skill's deliberate operating policy, not a statement
about Pencil's underlying format. Never use raw-file tooling, Pencil CLI, or
another agent as fallback for `.pen` work.

## Required MCP sequence

At the start of every task, call `get_editor_state(include_schema: true)`,
confirm the intended file/canvas/selection, and use its `filePath` plus the live
schema for downstream calls. Repeat after relevant editor-state changes; cached
schema never substitutes for current target confirmation.

Use this non-exhaustive routing table; the live MCP surface and returned schema
govern actual availability and arguments:

| Need | MCP tool |
| --- | --- |
| Confirm active file/editor/schema | `get_editor_state(include_schema: true)` |
| Inspect hierarchy, nodes, or reusable components | `batch_get` |
| Create, modify, move, replace, delete, or set variables | `batch_design` |
| Check structural layout problems | `snapshot_layout(problemsOnly: true)` |
| Review visual fidelity | `get_screenshot` |
| Read variables/themes | `get_variables` |
| Export images or PDF | `export_nodes` |
| Export an explicit HTML handoff when available | `export_html` |
| Inspect or use component libraries | `batch_get` plus `batch_design`; read the component-library reference first |

## Component libraries

When the operator asks for component libraries, reusable components,
`.lib.pen`, or design-system assets, read
[Component libraries](references/component-libraries.md) before acting.

## Workflow stages

### Workflow stage: Confirm MCP editor boundary

Bind every operation to the intended live document and current Pencil schema.

1. Identify the intended `.pen` document and confirm it is open in Pencil desktop or an IDE editor, not as raw text.
2. Discover/load the Pencil MCP tool surface when needed.
3. Call `get_editor_state(include_schema: true)` at the start of each task; capture the active `filePath` and verify the file/canvas/selection before acting.
4. Pass that `filePath` to downstream tools when the live signature requires it.
5. Repeat editor-state confirmation after the operator opens, switches, reloads, or reopens a file, or whenever target identity is uncertain; cached schema never replaces fresh target confirmation.
6. Treat the live returned schema and available tool signatures as authoritative for calls; the static tool table is routing guidance, not an exhaustive API contract.

Validation:

- `get_editor_state(include_schema: true)` identifies the intended active document and the exact `filePath` used downstream.
- No mutation runs against a stale, ambiguous, or mismatched file or selection.

### Workflow stage: Troubleshoot editor bridge

Distinguish an unavailable MCP connection from a connected server with no visible target file.

1. If the Pencil MCP server/tool surface is absent or disconnected, immediately notify the operator and ask them to start Pencil and restore the host's MCP connection.
2. If MCP is connected but cannot see the intended `.pen`, immediately report the open-file blocker before troubleshooting it.
3. If the MCP tool reports `A file needs to be open in the editor`, ask the operator to focus the Pencil canvas for the target `.pen`.
4. Ask the operator to close any raw/text tab for the `.pen` and reopen the file in Pencil desktop or the IDE extension.
5. Ask the operator to reload the editor window or Pencil extension when the correct editor is open but MCP still sees no file.
6. Re-run `get_editor_state(include_schema: true)` after the operator changes focus, editor mode, or extension state.
7. If MCP still cannot see the file, mark the task blocked until the Pencil editor bridge is restored.

Validation:

- The bridge is restored only when `get_editor_state(include_schema: true)` succeeds for the intended document.
- The operator was notified immediately when MCP or target-file access was unavailable.
- No CLI, raw file access, filesystem patching, or alternate agent path is used to bypass the missing MCP state.

### Workflow stage: Read and plan with MCP

Inspect only the design state needed for the requested change.

1. Translate the user's brief and authoritative local design/spec context into checkable criteria; ask before editing if material ambiguity or conflict cannot be resolved without invention.
2. Use `batch_get` to read top-level nodes, selected nodes, known node IDs, or grouped search patterns.
3. Combine related searches and node reads into a single `batch_get` call when possible.
4. Use low read depth first and request deeper node data only for the specific subtree needed for the task.
5. Use `get_variables` when the change depends on design tokens, themes, or CSS handoff values.
6. Use `get_guidelines` only when a task-specific Pencil guide or style is needed; do not load unrelated guides.

Validation:

- The planned edit or export is grounded in the accepted brief criteria and MCP-returned nodes, variables, guidelines, or selection state.
- The agent has not read or parsed the `.pen` file through filesystem or JSON tools.

### Workflow stage: Create or use component libraries

Build reusable Pencil component assets and use them in mockups without leaving the MCP-only boundary.

1. Read `references/component-libraries.md` before creating, importing, inspecting, or using reusable components or `.lib.pen` files.
2. Work only against MCP-visible open library and target files; immediately notify the operator when an editor UI action is required for library creation, import, or asset placement.
3. Use `batch_design` and `batch_get` according to the schema to create/list reusable components and place instances, then verify refs or instances through MCP.

Validation:

- The component inventory and target mockup usage are visible through MCP reads.
- Any required UI-only library setup/import step is reported immediately and not bypassed with CLI or raw `.pen` editing.

### Workflow stage: Create or iterate with MCP

Modify the open Pencil design through schema-backed MCP operations.

1. Use `batch_design` for creating frames, inserting nodes, copying, updating properties, replacing, moving, deleting, setting variables, or generating assets in the open design.
2. Apply the user's brief and any accepted art-direction handoff without inventing unsupported content, layout, or style decisions.
3. Keep edits scoped to the intended nodes, frames, or canvas region from MCP state.
4. After edits, use `batch_get` to compare the resulting nodes with the accepted criteria; use layout checks for relevant structure and sizing.
5. Do not claim completion from a successful MCP call alone; verify the resulting design state.

Validation:

- Each claimed criterion has follow-up MCP evidence; material visual results continue to the visual review gate before completion.
- No Pencil CLI, CLI agent, CLI interactive session, headless prompt run, raw JSON edit, or filesystem patch was used.

### Workflow stage: Review, persist, and export with MCP

Close the loop with evidence matched to the claim and an explicit persistence result.

1. Run `snapshot_layout(problemsOnly: true)` after material edits, or a scoped `snapshot_layout` when only one node subtree changed.
2. For creation and material visual edits, use `get_screenshot` on the smallest meaningful node or inspect a visual export; do not substitute a clean layout result for visual conformance.
3. Use `export_nodes` for PNG, JPEG, WEBP, or PDF exports from MCP-visible node IDs.
4. Use `export_html` only when it is present in the live MCP surface and the user explicitly requests an HTML/Tailwind or HTML/CSS handoff.
5. After material edits, ask the operator to save through Pencil. If save is unconfirmed, report the verified live change or export separately from unconfirmed `.pen` persistence.
6. Report the target file, accepted criteria, MCP evidence, visual-review status, save status, export paths, limitations, and any downstream owner.

Validation:

- A completed visual claim has both structural readback and screenshot/export inspection; otherwise it is explicitly `structurally verified, visually unreviewed`.
- A durable saved-file claim has operator save confirmation; requested exports and save status remain separate when either is incomplete.

### Workflow stage: Maintain design handoff clarity

Keep multi-frame mockups reviewable without turning design artifacts into false delivery gates.

1. For a new or materially updated multi-frame mockup, add or update a sibling README or index next to the `.pen` file when the project expects a handoff artifact.
2. Include purpose, artifact status, source/spec links, frame inventory, anti-claims, privacy constraints, and review evidence.
3. Verify frame inventory through MCP after cleanup.
4. Treat `.pen` files, screenshots, and exports as design substrate. Do not create or hold GitHub/blocker tasks on mockups when the delivery plan accepts implemented runtime behavior.

Validation:

- Multi-frame mockups have enough handoff context for review when a README/index is expected.
- The report does not claim runtime capability from Pencil mockups, screenshots, or exports alone.

## Interop priority

- **art direction for web UI quality:** frontend-design. `pencil-dev` owns MCP-only Pencil artifact creation, iteration, export, and `.pen` handling; frontend-design owns broader visual direction.
- **testing built web apps:** playwright or browser testing skills. `pencil-dev` only proves Pencil design artifacts, not runtime behavior of implemented web apps.
- **bitmap-only generation or editing:** imagegen. Use Pencil only when a durable `.pen` artifact is part of the requested outcome and MCP can operate on an open design.
- **generated HTML handoff and frontend delivery:** relevant frontend implementation and browser-testing skills. `pencil-dev` owns an explicitly requested MCP `export_html` artifact and its path; it does not prove production integration, accessibility, responsiveness, or runtime behavior.

## Gotchas

- **high** — Do not claim success from tool discovery, MCP success, node existence, or a clean layout alone; evidence must show the accepted brief criteria and match any visual or persistence claim.
- **high** — Cached schema or prior editor state cannot authorize a new mutation; refresh state after file/selection changes and stop on target mismatch.
- **high** — Do not claim component-library work from naming, screenshots, or duplicate shapes alone; verify reusable components, refs, or instances through MCP.
- **medium** — Do not use temporary directories for durable exports or handoff docs unless the user explicitly wants throwaway output.
- **medium** — Copied foundation/reference frames are scaffolding. Remove them from the target `.pen` after target frames are created and verify the top-level inventory through MCP.
- **high** — Pencil mockups, screenshots, and image/PDF/HTML exports are design or handoff substrate, not implemented runtime behavior or production delivery gates.

## Policies

### Capability reality policy
Complete only the claim supported by accepted brief criteria and matching MCP evidence; distinguish structural verification, visual review, exports, and saved-file persistence.

### MCP-only `.pen` policy
All `.pen` read, inspect, edit, layout-check, screenshot, and export work in this skill must go through Pencil MCP attached to an open Pencil desktop/IDE editor; CLI and raw-file workflows remain outside this skill even if Pencil supports them elsewhere.

### Editor bridge policy
If Pencil MCP is unavailable or `get_editor_state(include_schema: true)` cannot see the intended `.pen`, immediately notify the operator, troubleshoot the connection or open-file boundary, and report blocked instead of bypassing MCP.

### Schema-first policy
Call `get_editor_state(include_schema: true)` at the start of every task and after relevant editor-state changes; confirm the intended file/selection, propagate its `filePath`, and follow the live schema for downstream operations.

### Prompt fidelity policy
Derive checkable criteria from the user's request and accepted upstream art direction without silently inventing material design decisions; ask when ambiguity would change the result.

### Evidence policy
Creation and material visual edits require structural readback plus screenshot/export inspection; if visual evidence or save confirmation is missing, report that limitation and the split result explicitly.

### Component library policy
Component library work must prove reusable component origins and mockup instances through MCP-visible nodes; UI-only library creation/import steps must be surfaced to the operator immediately when MCP does not expose them.

### Handoff clarity policy
Multi-frame mockups need a sibling README or index when the project expects a handoff artifact; it should explain purpose, status, source links, frame inventory, anti-claims, privacy constraints, and review evidence.

### Runtime delivery policy
Do not treat Pencil artifacts as proof of implemented runtime capability when the project delivery plan accepts runtime behavior.

## Optional references
- [Component libraries](references/component-libraries.md) — Read this when the operator asks to create, maintain, import, inspect, or use Pencil component libraries, reusable components, `.lib.pen` files, or design-system assets.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep mandatory Pencil guidance inside this skill folder; external Pencil docs are optional update context, not required runtime dependencies.
- Use relative links for local metadata, docs, references, scripts, and assets.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration when this source bundle changes.
- Search the skill folder for absolute local paths before finishing.
- Confirm copied standalone skill users can understand the MCP-only `.pen` boundary from `SKILL.md` alone.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
