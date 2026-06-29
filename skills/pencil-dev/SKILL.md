---
name: pencil-dev
description: |-
  Use when creating, iterating, inspecting, validating, or exporting Pencil
  `.pen` design files through Pencil MCP tools attached to an open Pencil
  editor or custom editor. Applies to generated UI mockups, app screens,
  dashboards, web pages, marketing visuals, slide-like graphics, and edits to
  existing Pencil designs where `.pen` handling must stay MCP-only.
metadata:
  source-version: 0.1.5
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: c7d40affac518fc32bd5778a22137f031acff5ef74087f7603c5afde6ce174eb
---

# pencil-dev

## Start here

1. Confirm the request needs a Pencil `.pen` design artifact, not only web code, prose, or a generic bitmap image.
2. Separate capability from substrate before acting. The target capability is an open editor-backed Pencil design that can be inspected, changed, or exported through MCP tools; CLI setup, filesystem access, or raw file metadata is not the capability.
3. Treat `.pen` files as opaque design artifacts. Do not read, grep, parse, diff, patch, or hand-edit them through filesystem tools, JSON tooling, text editors, or raw file inspection.
4. The only allowed working path for `.pen` read, inspect, edit, layout-check, screenshot, or export work is Pencil MCP connected to an open Pencil Design Editor or Pencil custom editor.
5. Before any MCP operation beyond discovery, call `get_editor_state(include_schema: true)` and use the returned schema and active file/editor state as the contract for later operations.
6. If Pencil MCP is unavailable, cannot see the file, or reports that a file needs to be open in the editor, immediately notify the operator, then diagnose the editor/custom-editor bridge. Do not fall back to Pencil CLI, raw `.pen` access, a built-in Pencil agent, or another agent.
7. Use `batch_get` for hierarchy/search reads, `batch_design` for design edits, `snapshot_layout(problemsOnly: true)` for structural layout checks, `get_screenshot` for visual review, `get_variables` for tokens/themes, and `export_nodes` for image/PDF exports.
8. Do not install, reinstall, invoke, or recommend Pencil CLI for `.pen` work in this skill; CLI/headless/interactive/agent/export paths are explicitly out of scope.
9. Report blocked status clearly when the required MCP/editor bridge is unavailable.

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
- Pencil MCP cannot see an open Pencil Design Editor/custom editor document and the operator cannot restore that bridge in the current session.

## Overview

`pencil-dev` works on Pencil `.pen` design artifacts only through Pencil MCP
tools attached to an open Pencil editor or custom editor. The capability is
MCP-visible design state, screenshot, or node export; setup and file metadata
are only substrate.

## MCP-only `.pen` boundary

Treat `.pen` files as opaque. Never use filesystem reads, text/JSON tooling,
Pencil CLI, headless/interactive/agent workflows, CLI export, or another agent
as fallback. If MCP is unavailable or cannot see the intended file, immediately
tell the operator what is blocked; the task remains blocked until the
editor/custom-editor bridge is restored.

## Required MCP sequence

Before any design operation beyond tool discovery, call
`get_editor_state(include_schema: true)` and use the returned schema/rules as
the contract. Guessing `.pen` structure is not valid.

Use the MCP tools by role:

| Need | MCP tool |
| --- | --- |
| Confirm active file/editor/schema | `get_editor_state(include_schema: true)` |
| Inspect hierarchy, nodes, or reusable components | `batch_get` |
| Create, modify, move, replace, delete, or set variables | `batch_design` |
| Check structural layout problems | `snapshot_layout(problemsOnly: true)` |
| Review visual fidelity | `get_screenshot` |
| Read variables/themes | `get_variables` |
| Export review artifacts | `export_nodes` |
| Inspect or use component libraries | `batch_get` plus `batch_design`; read the component-library reference first |

## Editor/custom-editor troubleshooting

If MCP reports `A file needs to be open in the editor`, or the editor state does
not identify the intended document, immediately notify the operator, then ask
them to:

1. focus the Pencil canvas for the target `.pen`;
2. close any raw/text tab for the same file;
3. reopen the file with the Pencil Design Editor or Pencil custom editor;
4. reload the editor window or Pencil extension if MCP still cannot see it.

After each operator action, retry `get_editor_state(include_schema: true)`.
Do not bypass the problem with CLI, raw `.pen` reads, filesystem patching,
or another agent. Report `blocked` if the MCP/editor bridge remains unavailable.

## Component libraries

When the operator asks for component libraries, reusable components,
`.lib.pen`, or design-system assets, read
[Component libraries](references/component-libraries.md) before acting.

## Workflow stages

### Workflow stage: Confirm MCP editor boundary

Prove that the active work can happen through the open Pencil editor, not through a stale saved-file or CLI path.

1. Identify the intended `.pen` document and confirm it is open as a Pencil Design Editor or Pencil custom editor, not as raw text.
2. Discover/load the Pencil MCP tool surface when needed.
3. Call `get_editor_state(include_schema: true)` before any read, edit, screenshot, layout, variable, or export operation.
4. Check that the editor state points at the intended active file/canvas/selection before changing anything.
5. Treat the returned schema and Pencil rules as the authoritative operation contract; do not infer a raw file structure.

Validation:

- `get_editor_state(include_schema: true)` succeeds and identifies an active Pencil editor state for the intended document.
- The next MCP operation can be chosen from the returned schema and the available MCP tools.

### Workflow stage: Troubleshoot editor bridge

Restore MCP visibility when the editor/custom-editor bridge, not the design content, is the blocker.

1. If Pencil MCP is unavailable or cannot see the intended `.pen`, immediately tell the operator that MCP/open-file access is blocked before attempting troubleshooting.
2. If the MCP tool reports `A file needs to be open in the editor`, ask the operator to focus the Pencil canvas for the target `.pen`.
3. Ask the operator to close any raw/text tab for the `.pen` and reopen the file with the Pencil Design Editor or Pencil custom editor.
4. Ask the operator to reload the editor window or Pencil extension when the correct editor is open but MCP still sees no file.
5. Re-run `get_editor_state(include_schema: true)` after the operator changes focus, editor mode, or extension state.
6. If MCP still cannot see the file, mark the task blocked until the editor/custom-editor bridge is restored.

Validation:

- The bridge is restored only when `get_editor_state(include_schema: true)` succeeds for the intended document.
- The operator was notified immediately when MCP or target-file access was unavailable.
- No CLI, raw file access, filesystem patching, or alternate agent path is used to bypass the missing MCP state.

### Workflow stage: Read and plan with MCP

Inspect only the design state needed for the requested change.

1. Use `batch_get` to read top-level nodes, selected nodes, known node IDs, or grouped search patterns.
2. Combine related searches and node reads into a single `batch_get` call when possible.
3. Use low read depth first and request deeper node data only for the specific subtree needed for the task.
4. Use `get_variables` when the change depends on design tokens, themes, or CSS handoff values.
5. Use `get_guidelines` only when a task-specific Pencil guide or style is needed; do not load unrelated guides.

Validation:

- The planned edit or export is grounded in MCP-returned nodes, variables, guidelines, or selection state.
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
2. Pass the user's brief or requested change directly unless the user asked for elaboration.
3. Keep edits scoped to the intended nodes, frames, or canvas region from MCP state.
4. After broad edits, use `batch_get` or `snapshot_layout` to confirm the intended nodes exist and copied reference/foundation frames were removed when they were only scaffolding.
5. Do not claim completion from a successful MCP call alone; verify the resulting design state.

Validation:

- MCP reports the edit operation succeeded and follow-up MCP inspection shows the intended design state.
- No Pencil CLI, CLI agent, CLI interactive session, headless prompt run, raw JSON edit, or filesystem patch was used.

### Workflow stage: Export and review with MCP

Close the loop with MCP layout and visual evidence.

1. Run `snapshot_layout(problemsOnly: true)` after material edits, or a scoped `snapshot_layout` when only one node subtree changed.
2. Use `get_screenshot` sparingly for the smallest meaningful node when visual fidelity must be checked.
3. Use `export_nodes` for PNG, JPEG, WEBP, or PDF exports from MCP-visible node IDs.
4. Visually inspect MCP screenshots or generated exports before reporting done when visual review is part of the request.
5. If MCP export or screenshot cannot operate on the open design, report the split result precisely and do not switch to CLI export.

Validation:

- The final report names the MCP layout check, screenshot, or export used as evidence.
- Any missing visual review, export, or layout validation is reported as a limitation instead of implied success.

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

## Gotchas

- **high** — Do not claim success from tool discovery, MCP listing, editor reload, or setup alone; real progress needs MCP-visible design state or an MCP-produced export/screenshot.
- **high** — Do not read, grep, parse, diff, patch, or hand-edit `.pen` files as text or JSON. Treat them as opaque and use Pencil MCP only.
- **high** — Do not use Pencil CLI, reinstall Pencil CLI, CLI interactive mode, CLI agent mode, headless generation, or CLI export as fallback for `.pen` work.
- **high** — If MCP cannot see the intended `.pen`, the task is blocked on the editor/custom-editor bridge until `get_editor_state(include_schema: true)` succeeds.
- **high** — Do not claim component-library work from naming, screenshots, or duplicate shapes alone; verify reusable components, refs, or instances through MCP.
- **high** — Do not silently add creative detail to the user's prompt. Pencil has its own design operations; invented specifics can conflict with the brief.
- **medium** — Do not use temporary directories for durable exports or handoff docs unless the user explicitly wants throwaway output.
- **medium** — Copied foundation/reference frames are scaffolding. Remove them from the target `.pen` after target frames are created and verify the top-level inventory through MCP.
- **high** — Pencil mockups, screenshots, and exports are design substrate, not implemented runtime behavior or production delivery gates.

## Policies

### Capability reality policy
A completed Pencil task means the user can inspect the open MCP-backed design state or review an MCP-produced screenshot/export. CLI setup, filesystem metadata, or raw `.pen` access is substrate and does not prove design capability.

### MCP-only `.pen` policy
All `.pen` read, inspect, edit, layout-check, screenshot, and export work must go through Pencil MCP tools attached to an open Pencil editor/custom editor.

### Prohibited paths policy
Pencil CLI, CLI headless runs, CLI interactive mode, CLI agent mode, CLI export, CLI installation/reinstallation, built-in Pencil agents, raw JSON, text editors, filesystem reads, grep, diff, and patch tools are not valid `.pen` workflows for this skill.

### Editor bridge policy
If Pencil MCP is unavailable or `get_editor_state(include_schema: true)` cannot see the intended `.pen`, immediately notify the operator, then troubleshoot the editor/custom-editor bridge; if it remains unavailable, report blocked instead of bypassing MCP.

### Schema-first policy
Call `get_editor_state(include_schema: true)` before other MCP operations unless the current `.pen` schema is already in context, and follow that schema for every `batch_get`, `batch_design`, layout, screenshot, variable, or export operation.

### Prompt fidelity policy
Pass the user's design request or edit request directly unless the user asks you to elaborate the brief.

### Evidence policy
Prefer MCP layout checks plus MCP screenshot/export evidence. If visual inspection is impossible, say the artifact is unreviewed and explain why.

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
