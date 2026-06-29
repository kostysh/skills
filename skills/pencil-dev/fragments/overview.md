## Overview

`pencil-dev` creates, iterates, inspects, validates, and exports Pencil `.pen`
design artifacts through Pencil MCP tools attached to an open Pencil editor or
custom editor.

The capability is editor-backed design work that the user can inspect or review:
an MCP-visible design state, an MCP screenshot, or an MCP node export. Tool
discovery, CLI setup, raw file metadata, or filesystem access is only substrate
and must not be reported as completed design work.

## MCP-only `.pen` boundary

Treat `.pen` files as opaque design artifacts. Do not read, grep, parse, diff,
patch, or hand-edit them with filesystem tools, text editors, JSON tooling, or
ad hoc scripts. Do not use Pencil CLI, install or reinstall Pencil CLI, start
CLI headless/interactive/agent workflows, run CLI export, or delegate to a
built-in Pencil agent as a fallback for `.pen` work.

The only working path for `.pen` read, inspect, edit, layout-check, screenshot,
or export operations in this skill is Pencil MCP connected to an open Pencil
Design Editor or Pencil custom editor. If MCP is unavailable or cannot see the
intended file, the task is blocked until the editor/custom-editor bridge is
restored.

## Required MCP sequence

Before any design operation beyond tool discovery, call
`get_editor_state(include_schema: true)`. Use the returned editor state, active
file, selection, schema, and Pencil rules as the contract for subsequent MCP
calls. Guessing the `.pen` structure or reading the file directly is not a valid
substitute.

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

Example MCP flow:

```text
1. get_editor_state(include_schema: true)
2. batch_get(...) for the smallest useful nodes or searches
3. batch_design(...) for the requested edit
4. snapshot_layout(problemsOnly: true)
5. get_screenshot(...) or export_nodes(...) when visual/export evidence is needed
```

## Editor/custom-editor troubleshooting

If MCP reports `A file needs to be open in the editor`, or
`get_editor_state(include_schema: true)` does not identify the intended
document, ask the operator to:

1. focus the Pencil canvas for the target `.pen`;
2. close any raw/text tab for the same file;
3. reopen the file with the Pencil Design Editor or Pencil custom editor;
4. reload the editor window or Pencil extension if MCP still cannot see it.

After each operator action, retry `get_editor_state(include_schema: true)`.
Do not bypass the problem with CLI, raw `.pen` reads, filesystem patching,
or another agent. Report `blocked` if the MCP/editor bridge remains unavailable.
