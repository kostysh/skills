---
name: pencil-dev
description: |-
  Use when creating, iterating, inspecting, or exporting Pencil `.pen` design
  files with the Pencil CLI or Pencil MCP tools. Applies to generated UI
  mockups, app screens, dashboards, web pages, marketing visuals, slide-like
  graphics, and edits to existing Pencil designs where the observable outcome
  is a saved `.pen` file plus, when possible, a visually inspected export.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 96987bea4bb83a17ef3b5e87c3163b7eeb89e8b8be2ce0503c477e3f96de6b5c
---

# pencil-dev

## Start here

1. Confirm the request needs a Pencil design artifact, not only web code, prose, or a generic bitmap image.
2. Separate capability from substrate before acting. The target capability is a saved Pencil design and, when export is possible, a visually checked image or PDF export.
3. Treat `.pen` files as opaque design artifacts. Do not read, grep, parse, or hand-edit them as text; use Pencil MCP tools when available, or the Pencil CLI.
4. If the user says a `.pen` document is open in VSCode, Pencil extension, or Pencil app, treat the live MCP editor state as the source of truth for edits.
5. Respect explicit project constraints such as editing only through MCP with CLI export allowed after save.
6. Choose MCP when the current open Pencil canvas is the source of truth; choose CLI when an on-disk file, headless run, export, batch job, or CI-style automation is the source of truth.
7. Do not use CLI agent mode for edits when direct MCP editing is available for the live editor.
8. Prefer existing project paths and keep generated design files in the user's working tree or an obvious subdirectory such as `designs/`.
9. If the project or user requires a specific Pencil CLI model or agent configuration, pass it explicitly and verify command output or usage metadata before reporting completion.

## When to use this skill

- Creating a new Pencil design from a natural-language brief.
- Iterating on an existing `.pen` file while preserving design continuity.
- Exporting a `.pen` design to PNG, JPEG, WebP, or PDF for review.
- Inspecting, validating, or modifying a Pencil design through Pencil MCP tools.
- Producing visual mockups for websites, app screens, dashboards, slides, posters, banners, or marketing assets.

## When NOT to use this skill

- The user only wants frontend code changes and no Pencil design artifact.
- The task is generic raster image generation or photo editing; use an image generation/editing workflow instead.
- The task requires manual JSON surgery inside `.pen` files; use Pencil tools or stop and explain the limitation.
- Authentication, account creation, package installation, or global machine configuration would be required but the user has not authorized that side effect.

## Overview

`pencil-dev` creates, iterates, inspects, and exports Pencil `.pen` design artifacts while keeping `.pen` handling tool-based rather than text-based.

Verify current CLI behavior when it matters. Pencil generation can take several minutes; warn before CLI runs.

## MCP vs CLI

Use Pencil MCP when the current open design is the source of truth: visible canvas, selection, live edits, hierarchy inspection, variables, precise node changes, screenshots, or node export. If the user says the document is open in VSCode, the Pencil extension, or the Pencil app, direct MCP editing is mandatory for live edits.

Use the CLI when the saved file path is the source of truth: headless creation, prompt-driven saved-file edits, simple export, batch jobs, automation, CI, or sessions without the Pencil app/IDE extension. CLI export is acceptable after save when the user allows saved-file export; CLI editing is not a fallback for live editor edits.

Use CLI interactive mode as fallback when direct MCP tools are unavailable. CLI agent may launch an internal agent and cross a different state boundary; it is not a substitute for direct MCP editing.

CLI agent mode may use MCP tools internally while the output `.pen` is still only active editor state. During that run, the `--out` file may not exist on disk until the final save. Do not run path-based export or inspection against the `--out` path, and do not claim the file is missing, until the CLI process exits. After exit, verify the saved file with filesystem metadata and review an export when possible.

Core CLI shape:

```bash
pencil --out <output.pen> --prompt "<design description>" --export <output.png> --export-scale 2
```

Use `--export-type png|jpeg|webp|pdf` for non-default exports. Use `--prompt-file` only for reference files, not as a substitute for the user's prompt text.

When working through Pencil MCP tools, first discover/load the Pencil MCP tools, then call `get_editor_state(include_schema: true)`. The schema is the contract for subsequent `batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`, `get_variables`, `set_variables`, and `export_nodes` calls; guessing structure or reading `.pen` directly is not a valid substitute.

If MCP cannot see the open document, or export reports `wrong .pen file`, diagnose the source-of-truth boundary: ask the user to save, reopen the file, or restart the VSCode window/Pencil extension. After save, ordinary CLI export is acceptable when allowed; do not switch to CLI agent editing.

## Workflow stages

### Workflow stage: Select the Pencil surface

Choose the smallest Pencil interface that can deliver an observable design artifact.

1. Identify the source of truth first: an open Pencil app/IDE canvas, a saved `.pen` path, a requested export file, or a batch/automation target.
2. Use direct Pencil MCP tools for live editor edits when the user refers to the current/open design, selected elements, live canvas changes, inspecting hierarchy, precise node edits, variables, guidelines, screenshots, or exporting specific nodes.
3. Before using other Pencil MCP tools, discover/load the Pencil MCP surface, then call `get_editor_state(include_schema: true)`; only after that use `batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`, `get_variables`, `set_variables`, or `export_nodes`.
4. Prefer CLI agent mode only when the user wants a new design or prompt-driven saved-file edit from the terminal and no live MCP editor state is the source of truth.
5. Prefer CLI export mode when the only requested outcome is exporting an existing saved `.pen` file to PNG, JPEG, WEBP, or PDF.
6. Prefer CLI batch mode for multiple independent design tasks, repeatable automation, or CI-style work.
7. Prefer CLI interactive mode only when direct MCP tools are unavailable but you still need fine-grained MCP-style operations against a saved file or a headless editor.
8. If both MCP and CLI are available, do not mix them until the source of truth is clear. Use MCP for the live open canvas; use normal CLI export only after the file is saved and the user allows saved-file export.
9. If neither MCP nor CLI can operate on the chosen source of truth, explain that no real Pencil artifact can be produced in this session and do not claim completion.
10. For an existing saved `.pen`, prefer MCP or CLI interactive iteration when the task needs inspection, variables, layout diagnosis, screenshots, or focused node edits; prefer CLI agent mode when the requested change is broad and prompt-driven.

Validation:

- The chosen surface matches the source of truth and can create, modify, inspect, or export the requested artifact without raw `.pen` file editing.
- The final report can name whether MCP, CLI agent mode, CLI export mode, CLI batch mode, or CLI interactive mode was used and why.

### Workflow stage: Check CLI readiness

Verify the local CLI and auth assumptions before starting a long-running design job.

1. Check availability with `command -v pencil` first.
2. If `pencil` is absent, ask before using `npx`, installing `@pencil.dev/cli`, or changing project/global dependencies.
3. When version freshness matters, compare the installed version with `npm view @pencil.dev/cli version`; checking once near the first Pencil run is enough unless behavior changes.
4. Check account state with `pencil status` before a CLI generation run.
5. Ask before installing packages globally, creating accounts, logging in, or relying on a user-provided `PENCIL_CLI_KEY`.
6. After explicit approval, accepted setup options include `npm install -g @pencil.dev/cli`, local `npm install @pencil.dev/cli`, `pencil signup`, and `pencil login`.

Validation:

- The CLI command surface and authentication state are known, or the missing prerequisite is reported as a blocker.

### Workflow stage: Protect open file state

Avoid losing unsaved live-canvas changes when switching between MCP and CLI.

1. If Pencil app/IDE has the design open, assume unsaved canvas state may differ from the saved `.pen` file.
2. Use MCP against the open canvas when the user is working in that canvas; do not substitute CLI agent edits for direct MCP editing.
3. If MCP cannot see the open document, or an export reports `wrong .pen file`, diagnose the source-of-truth boundary instead of switching to CLI editing: ask the user to save, reopen the document, or restart the VSCode window/Pencil extension.
4. Before using CLI on a file that may also be open in Pencil, make sure the current canvas has been saved or ask the user to confirm that the saved file is the source of truth.
5. After the saved-file boundary is clear, CLI export is acceptable; CLI editing remains inappropriate for a live editor task unless the user explicitly changes the source of truth.
6. After major MCP changes, save through the available Pencil surface when possible before running CLI export or external automation.
7. Even when MCP has problems, do not inspect `.pen` files with filesystem read, grep, diff, or patch tools.

Validation:

- The workflow does not overwrite or export stale `.pen` content without acknowledging the source-of-truth risk.

### Workflow stage: Create or iterate the design

Produce a `.pen` file that reflects the user's actual brief.

1. For new designs, run `pencil --out <output.pen> --prompt "<user brief>" --export <output.png> --export-scale 2`.
2. For edits, run `pencil --in <existing.pen> --out <next.pen> --prompt "<requested change>" --export <next.png> --export-scale 2`.
3. If the user or project requires a specific model, pass it explicitly with the supported CLI option and verify the model in command output or available usage metadata.
4. Pass the user's brief directly. Do not add invented layout, palette, typography, or content details unless the user asked for them.
5. Use a generous command timeout, normally at least 10 minutes, because design generation can take several minutes.
6. Keep successive versions discoverable, such as `design.pen`, `design-v2.pen`, and `design-v3.pen`.
7. When using CLI agent mode, do not treat intermediate MCP screenshots, `batch_design` success, README text, prompt files, usage files, or created directories as the deliverable. The deliverable is the saved `.pen` after the command exits.
8. Do not run path-based MCP export or inspection against a CLI `--out` path while the CLI process is still running; wait for the final save and process exit first.

Validation:

- The command exits successfully, the `.pen` output exists and is non-empty, and an export exists when export was requested or feasible.
- If the CLI reported export success after final save, open the exported file visually; if export failed, retry from the saved `.pen` or report the split result explicitly.

### Workflow stage: Maintain design handoff clarity

Keep multi-frame mockups reviewable without turning design artifacts into false delivery gates.

1. For a new or materially updated multi-frame mockup, add or update a sibling README or index next to the `.pen` file.
2. Include purpose, artifact status, source/spec links, frame inventory, anti-claims, privacy constraints, and review evidence.
3. If foundation or reference frames were copied into the target `.pen`, remove those copied reference frames after creating the target frames.
4. After cleanup, verify the top-level node inventory through MCP and confirm that only intended target frames or sections remain.
5. Treat `.pen` files, screenshots, and exports as design substrate. Do not create or hold GitHub/blocker tasks on mockups when the delivery plan accepts implemented runtime behavior.

Validation:

- Multi-frame mockups have a sibling README/index that explains frame purpose and review status.
- Copied foundation/reference frames are absent from the target document's top-level inventory after cleanup.
- The report does not claim runtime capability from Pencil mockups, screenshots, or exports alone.

### Workflow stage: Review and report

Close the loop with visual evidence instead of only command success.

1. Open or render the exported image/PDF and visually inspect it before reporting done.
2. If using MCP, use `snapshot_layout(problemsOnly: true)` where feasible and use screenshot/export tools to verify the visible state.
3. After cleanup of copied reference frames, verify top-level inventory through MCP before reporting done.
4. If export fails but the `.pen` is saved and visually checked through MCP, report the split result precisely.
5. Report artifact paths, what was checked, and any limitation such as missing auth, no export, or an unreviewed visual result.

Validation:

- The final response names the produced artifacts and the verification performed.

## Interop priority

- **art direction for web UI quality:** frontend-design. `pencil-dev` owns Pencil artifact creation, iteration, export, and `.pen` handling; frontend-design owns broader visual direction.
- **testing built web apps:** playwright or browser testing skills. `pencil-dev` only proves Pencil design artifacts, not runtime behavior of implemented web apps.
- **bitmap-only generation or editing:** imagegen. Use Pencil only when a durable `.pen` artifact is part of the requested outcome.

## Gotchas

- **high** — Do not claim success from setup alone; a real outcome needs a saved `.pen` artifact and usually an inspected export.
- **high** — Do not read, grep, parse, diff, or patch `.pen` files as text. Treat them as opaque and use Pencil tools.
- **high** — Do not silently add creative detail to the user's prompt. Pencil has its own design agent; invented specifics can conflict with it.
- **medium** — Do not use temporary directories for durable design artifacts unless the user explicitly wants throwaway output.
- **medium** — Export commands can fail even when `.pen` generation succeeds; report the split result precisely.
- **high** — Do not switch between MCP and CLI on the same design until you know whether the live canvas or saved `.pen` file is authoritative.
- **high** — In CLI agent mode, the active editor state is not a durable repository artifact until the final save writes the `.pen` file.
- **medium** — Path-based MCP export can fail or inspect stale content if the `.pen` path has not been saved yet. Wait for CLI exit, verify the saved file, then export from the saved file or use the final CLI export.
- **medium** — Copied foundation/reference frames are scaffolding. Remove them from the target `.pen` after target frames are created and verify the top-level inventory.
- **high** — Pencil mockups, screenshots, and exports are design substrate, not implemented runtime behavior or production delivery gates.

## Policies

### Capability reality policy
A completed Pencil task means the user can open or review a produced design artifact. Installation, auth checks, command planning, or metadata alone are substrate.

### Side-effect policy
Package installation, account signup, login, and persistent global configuration require explicit user approval.

### Prompt fidelity policy
Pass the user's design request or edit request directly to Pencil unless the user asks you to elaborate the brief.

### Evidence policy
Prefer exported visual evidence. If visual inspection is impossible, say the artifact is unreviewed and explain why.

### Tool selection policy
MCP is for live, editor-backed, precise design work; CLI is for headless, path-based, export, batch, and automation work. When both could work, choose by source of truth rather than convenience.

### Save boundary policy
For CLI agent runs, the completion boundary is process exit plus a verified non-empty `.pen` file. Do not report completion from intermediate MCP/editor state alone.

### Live editor policy
If the user is working in an open VSCode/Pencil extension or app document, direct MCP editor state is the source of truth for edits; CLI export is allowed only after the file is saved and the saved-file boundary is clear.

### Handoff clarity policy
Multi-frame mockups need a sibling README or index that explains purpose, status, source links, frame inventory, anti-claims, privacy constraints, and review evidence.

### Runtime delivery policy
Do not treat Pencil artifacts as proof of implemented runtime capability when the project delivery plan accepts runtime behavior.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep mandatory Pencil guidance inside this skill folder; external CLI docs are optional update context, not required runtime dependencies.
- Use relative links for local metadata, docs, references, scripts, and assets.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration when this source bundle changes.
- Search the skill folder for absolute local paths before finishing.
- Confirm copied standalone skill users can understand the Pencil CLI/MCP boundary from `SKILL.md` alone.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
