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
