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
