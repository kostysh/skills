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
