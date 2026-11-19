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
