---
name: pencil-dev
description: |-
  Use when creating, iterating, inspecting, or exporting Pencil `.pen` design
  files with the Pencil CLI or Pencil MCP tools. Applies to generated UI
  mockups, app screens, dashboards, web pages, marketing visuals, slide-like
  graphics, and edits to existing Pencil designs where the observable outcome
  is a saved `.pen` file plus, when possible, a visually inspected export.
metadata:
  source-version: 0.1.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 5921eba15cc9b96de70ec53de4ffba2c2929b3331c42bbeebdaff25323f38791
---

# pencil-dev

## Start here

1. Confirm the request needs a Pencil design artifact, not only web code, prose, or a generic bitmap image.
2. Separate capability from substrate before acting. The target capability is a saved Pencil design and, when export is possible, a visually checked image or PDF export.
3. Treat `.pen` files as opaque design artifacts. Do not read, grep, parse, or hand-edit them as text; use Pencil MCP tools when available, or the Pencil CLI.
4. Choose MCP when the current open Pencil canvas is the source of truth; choose CLI when an on-disk file, headless run, export, batch job, or CI-style automation is the source of truth.
5. Prefer existing project paths and keep generated design files in the user's working tree or an obvious subdirectory such as `designs/`.
6. If the project or user requires a specific Pencil CLI model or agent configuration, pass it explicitly and verify command output or usage metadata before reporting completion.

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

`pencil-dev` adapts the official `@pencil.dev/cli` skill guidance for a portable Codex skill. It enables agents to create, iterate, inspect, and export Pencil `.pen` design artifacts while keeping `.pen` handling tool-based rather than text-based.

Official baseline: `@pencil.dev/cli` `0.2.7` published `SKILL.md`. Treat that source as version context, not as a hidden dependency; when current CLI behavior matters, verify with the installed CLI and npm registry.

Pencil design generation is long-running. Simple visual components may take 1-2 minutes, app screens and landing sections often take 2-3 minutes, and complex full-page or dashboard designs can take 3-5+ minutes. Tell the user when a run may take several minutes.

## MCP vs CLI

Use Pencil MCP as the first choice when the current open design is the source of truth. This includes requests about the visible canvas, current selection, live edits, inspecting hierarchy, reading variables, applying precise node changes, taking screenshots, exporting specific nodes, or aligning a design with nearby code while Pencil is running.

Use the CLI as the first choice when the saved file path is the source of truth. This includes headless creation, prompt-driven edits to an input `.pen`, simple export of an existing `.pen`, batch jobs, repeatable automation, CI/CD, and sessions where the Pencil app or IDE extension is not available.

Use CLI interactive mode as a fallback bridge: it exposes MCP-style tool calls against a running app or a headless local editor, but it is still a terminal workflow. Prefer direct MCP tools when the agent already has them; prefer normal CLI agent/export/batch commands when the task is one-shot and path-based.

CLI agent mode may use MCP tools internally while the output `.pen` is still only active editor state. During that run, the `--out` file may not exist on disk until the final save. Do not run path-based export or inspection against the `--out` path, and do not claim the file is missing, until the CLI process exits. After exit, verify the saved file with filesystem metadata and review an export when possible.

Core CLI shape:

```bash
pencil --out <output.pen> --prompt "<design description>" --export <output.png> --export-scale 2
```

Use `--export-type png|jpeg|webp|pdf` when the requested export format is not the default. Use `--prompt-file` only for attaching reference images or text files to the prompt; do not use it as a substitute for passing the user's prompt text.

When working through Pencil MCP tools, load the editor state and schema first if the MCP surface provides that operation. The schema is the contract for subsequent design operations; guessing structure or reading `.pen` directly is not a valid substitute.

## Workflow stages

### Workflow stage: Select the Pencil surface

Choose the smallest Pencil interface that can deliver an observable design artifact.

1. Identify the source of truth first: an open Pencil app/IDE canvas, a saved `.pen` path, a requested export file, or a batch/automation target.
2. Prefer direct Pencil MCP tools when the user refers to the current/open design, selected elements, live canvas changes, inspecting hierarchy, precise node edits, variables, guidelines, screenshots, or exporting specific nodes.
3. Before using other Pencil MCP tools, load the current editor state and schema when the MCP surface exposes that capability.
4. Prefer CLI agent mode when the user wants a new design or prompt-driven edit saved to a named `.pen` file from the terminal, especially when no Pencil app/IDE canvas is open.
5. Prefer CLI export mode when the only requested outcome is exporting an existing saved `.pen` file to PNG, JPEG, WEBP, or PDF.
6. Prefer CLI batch mode for multiple independent design tasks, repeatable automation, or CI-style work.
7. Prefer CLI interactive mode only when direct MCP tools are unavailable but you still need fine-grained MCP-style operations against a saved file or a headless editor.
8. If both MCP and CLI are available, do not mix them until the source of truth is clear. Use MCP for the live open canvas; use CLI for saved-file automation after the file is saved.
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
2. Use MCP against the open canvas when the user is working in that canvas.
3. Before using CLI on a file that may also be open in Pencil, make sure the current canvas has been saved or ask the user to confirm that the saved file is the source of truth.
4. After major MCP changes, save through the available Pencil surface when possible before running CLI export or external automation.

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

### Workflow stage: Review and report

Close the loop with visual evidence instead of only command success.

1. Open or render the exported image/PDF and visually inspect it before reporting done.
2. If using MCP, use the available screenshot/export/validation tools to verify the visible state.
3. Report artifact paths, what was checked, and any limitation such as missing auth, no export, or an unreviewed visual result.

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
