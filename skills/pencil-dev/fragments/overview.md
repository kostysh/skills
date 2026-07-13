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
