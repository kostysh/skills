---
name: pencil-dev
description: Create, inspect, iterate, validate, import, and export Pencil
  `.pen` designs through MCP connected to an open editor. Use for UI mockups,
  app screens, dashboards, web pages, marketing visuals, slide-like graphics, or
  existing design edits; keep `.pen` handling MCP-only.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: e31571fdef4987b90949f5f6fd9988fa26f185d36eba8d91f76b61a19610385b
---

# pencil-dev

## Start here

1. Confirm the request needs a Pencil `.pen` design artifact, not only web code, prose, or a generic bitmap image.
2. Separate capability from substrate. Success means the requested design criteria are verified in the intended MCP-backed document, with visual evidence and persistence status appropriate to the claim; tool discovery or MCP success alone is substrate.
3. Treat MCP-only handling as this skill's operating policy, not as a claim about Pencil's underlying file format. Do not read, parse, diff, patch, or hand-edit `.pen` files through filesystem or JSON tools, and do not use Pencil CLI as fallback.
4. At each task start, call `get_app_state` with its live signature, confirm the intended file/canvas/selection, and capture its `filePath`.
5. Read `references/unified-mcp-api.md` before MCP calls; live API owns call behavior, accepted sources own artifact semantics, and unresolved conflicts require a stop.
6. Derive checkable criteria from the user's brief before editing. Stop for clarification when material ambiguity or conflicting authority would require invented design decisions.
7. If Pencil MCP is absent/disconnected or cannot see the intended open file, immediately notify the operator, diagnose that exact boundary, and report blocked if it cannot be restored.
8. For creation or material visual edits, require structural readback plus an MCP screenshot or visual export. Report `structurally verified, visually unreviewed` when visual evidence is unavailable.
9. After material edits, ask the operator to save in Pencil. Do not claim a durable saved `.pen` without save confirmation; report exports and persistence as separate results.

## When to use this skill

- Creating a new Pencil design in an open Pencil editor through MCP.
- Iterating on an existing open `.pen` file while preserving design continuity.
- Inspecting, validating, or modifying a Pencil design through Pencil MCP tools.
- Exporting nodes from an open `.pen` design through MCP.
- Creating or using component libraries through MCP-visible reusable nodes and instances.
- Inspecting or importing a real page through Pencil's integrated browser.
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

Read [Unified Pencil MCP API](references/unified-mcp-api.md), call
`get_app_state` with its live signature, confirm the intended document and
selection, and pass its `filePath` downstream. Live signatures and schema own
calls; accepted sources own artifact semantics. Refresh app state after relevant
editor changes and stop on unresolved conflict.

Use this routing table for the consolidated surface:

| Need | Current MCP operation |
| --- | --- |
| Confirm active file, selection, and canvas | `get_app_state` |
| Read current schema and execute guidance | `read_skill` |
| Read, edit, verify, screenshot, or export | `execute` |
| Inspect or import a live web page | `browser` |
| Load optional style direction | `get_style` |
| Inspect or use component libraries | `execute`; read the component-library reference first |

## Component libraries

When the operator asks for component libraries, reusable components,
`.lib.pen`, or design-system assets, read
[Component libraries](references/component-libraries.md) before acting.

## Workflow stages

### Workflow stage: Confirm MCP editor boundary

Bind every MCP operation to the intended live document and current tool contract.

1. Read `references/unified-mcp-api.md`, inspect the live surface, and call `get_app_state` with its current signature for the intended open editor document.
2. Verify the file, canvas, and selection; pass the confirmed `filePath` downstream when required.
3. Use current `read_skill` guidance and live signatures for calls; refresh app state after relevant editor changes or node mismatches.

Validation:

- Fresh `get_app_state` output identifies the intended active document and the exact `filePath` used downstream.
- No mutation runs against a stale, ambiguous, or mismatched file or selection.

### Workflow stage: Troubleshoot editor bridge

Distinguish an unavailable MCP connection from a connected server with no visible target file.

1. If the Pencil MCP server/tool surface is absent or disconnected, immediately notify the operator and ask them to start Pencil and restore the host's MCP connection.
2. If MCP is connected but cannot see the intended `.pen`, immediately report the open-file blocker before troubleshooting it.
3. If app state reports that a file must be open, ask the operator to focus the Pencil canvas for the target `.pen`.
4. Ask the operator to close raw/text tabs, reopen the file in Pencil, and reload the editor or extension when the correct canvas still remains invisible to MCP.
5. Re-run `get_app_state` after the operator changes focus, editor mode, or extension state.
6. If MCP still cannot see the file, mark the task blocked until the Pencil editor bridge is restored.

Validation:

- The bridge is restored only when fresh app state identifies the intended document and `filePath`.
- The operator was notified immediately when MCP or target-file access was unavailable.
- No CLI, raw file access, filesystem patching, or alternate agent path is used to bypass the missing MCP state.

### Workflow stage: Read and plan with MCP

Inspect only the design state needed for the requested change.

1. Translate the user's brief and authoritative local design/spec context into checkable criteria; ask before editing if material ambiguity or conflict cannot be resolved without invention.
2. Use bounded `execute` `Get` reads or visitors for the target and relevant peer/library inventory; deepen or resolve data only when the task needs it.
3. Use `GetVariables` for token/theme work and optional `get_style` only when the user supplied no brand or style authority.

Validation:

- The planned edit or export is grounded in accepted criteria and current MCP readback.
- The agent has not read or parsed the `.pen` file through filesystem or JSON tools.

### Workflow stage: Use the integrated browser when needed

Bring a real page into the design workflow without confusing design feedback with runtime testing.

1. Use `browser` only when the request needs a live page, DOM/style inspection, screenshot reference, editable canvas import, or a visual implementation feedback loop.
2. Load the page first, prefer a focused target, and reserve canvas actions for authorized design mutations.
3. After import, treat the result as Pencil nodes and continue through `execute` rather than CSS/HTML assumptions.

Validation:

- Any browser-to-canvas mutation is visible in the confirmed target document and verified like other Pencil nodes.
- Browser inspection or import is not reported as formal web-app E2E or production capability proof.

### Workflow stage: Create or use component libraries

Build reusable Pencil component assets and use them in mockups without leaving the MCP-only boundary.

1. Read `references/component-libraries.md` before creating, importing, inspecting, or using reusable components or `.lib.pen` files.
2. Work only against MCP-visible library and consumer files; use current `execute` operations to create/read reusable origins and instances, and surface required UI-only lifecycle actions immediately.

Validation:

- The component inventory and target mockup usage are visible through MCP reads.
- Any required UI-only library setup/import step is reported immediately and not bypassed with CLI or raw `.pen` editing.

### Workflow stage: Create or iterate with MCP

Modify the confirmed Pencil design through transactional, schema-backed `execute` calls.

1. Use focused `execute` snippets and only operations documented by the current runtime.
2. Apply the user's brief and any accepted art-direction handoff without inventing unsupported content, layout, or style decisions.
3. Keep edits scoped, apply required naming/placeholder rules, repair failures through their returned edit contract, and resolve warnings before completing the affected section.
4. After each meaningful section, use `Get` to compare current state with accepted criteria; re-read rather than overwrite concurrent changes.

Validation:

- Each claimed criterion has follow-up MCP evidence; material visual results continue to the visual review gate before completion.
- No Pencil CLI, CLI agent, CLI interactive session, headless prompt run, raw JSON edit, or filesystem patch was used.

### Workflow stage: Review, persist, and export with MCP

Close the loop with evidence matched to the claim and an explicit persistence result.

1. Use an `execute` `Get` visitor with `ctx.bounds` and `ctx.problems` after material edits, scoped to the changed subtree when possible.
2. For creation and material visual edits, use `TakeScreenshot` on the smallest meaningful node; clean bounds or export success do not prove visual conformance.
3. Use `Export` only for requested deliverables and retain its returned paths.
4. After material edits, ask the operator to save through Pencil. If save is unconfirmed, report the verified live change or export separately from unconfirmed `.pen` persistence.
5. Report the target file, accepted criteria, structural and visual evidence, warnings or generation state, save status, export paths, limitations, and any downstream owner.

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
- **testing built web apps:** playwright or browser testing skills. `pencil-dev` may use Pencil's integrated browser for design import and visual feedback, but only browser-testing skills prove runtime behavior of implemented web apps.
- **bitmap-only generation or editing:** imagegen. Use Pencil only when a durable `.pen` artifact is part of the requested outcome and MCP can operate on an open design.
- **generated HTML handoff and frontend delivery:** relevant frontend implementation and browser-testing skills. `pencil-dev` owns an explicitly requested `Export` HTML artifact and its path; it does not prove production integration, accessibility, responsiveness, or runtime behavior.

## Gotchas

- **high** — Do not claim success from tool discovery, MCP success, node existence, or a clean layout alone; evidence must show the accepted brief criteria and match any visual or persistence claim.
- **high** — Cached app state, prior selection, or remembered node IDs cannot authorize a new mutation; refresh state after file/selection changes and stop on target mismatch.
- **high** — Do not call removed discrete Pencil tools unless the current live surface advertises them; route consolidated reads, mutations, layout checks, screenshots, variables, and exports through `execute`.
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
If Pencil MCP is unavailable or fresh `get_app_state` cannot identify the intended `.pen`, immediately notify the operator, troubleshoot the connection or open-file boundary, and report blocked instead of bypassing MCP.

### Live API precedence policy
Live signatures, schema, and errors own calls; accepted operator/product/library sources own artifact semantics. Stop on unresolved conflict instead of silently copying, detaching, or mutating.

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

## Required active references
- [Unified Pencil MCP API](references/unified-mcp-api.md) — Read this before calling Pencil MCP for any `.pen` task; it owns current tool routing, execute safety, browser bridging, verification, and API-drift handling.

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
- Supporting glob: `docs/forward-tests/*`
- Supporting glob: `docs/logs/*`
