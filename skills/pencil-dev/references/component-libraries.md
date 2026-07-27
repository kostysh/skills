# Component libraries

Read this when the operator asks to create, maintain, import, inspect, or use
Pencil component libraries, reusable components, `.lib.pen` files, or
design-system assets.

## Capability boundary

A component-library task is complete only when MCP evidence shows reusable
component origins and their usage in target frames. Naming, screenshots,
duplicate shapes, or a file suffix alone are substrate.

Stay inside the MCP-only `.pen` boundary:

- use `get_editor_state(include_schema: true)` before library work;
- use `batch_design` only according to the returned schema;
- use `batch_get` to inspect reusable components, refs, and instances;
- use `snapshot_layout`, `get_screenshot`, or `export_nodes` for review evidence;
- do not use Pencil CLI, raw `.pen` reads, JSON edits, filesystem patching, or another agent.

## Pencil library model

Pencil design libraries are reusable component collections that can be imported
into other `.pen` files. Library files use the `.lib.pen` suffix. Pencil's UI
can turn a file into a library, import libraries into a target file, and place
library assets from the Assets panel.

Turning an existing file into a design library cannot be undone. Default to a
new dedicated `.lib.pen`; before asking the operator to convert an existing
file, explain the irreversible effect and obtain explicit confirmation.

Those UI actions may be required because MCP may not expose every library
lifecycle operation. If a needed library file is missing, not open, not marked
as a library, or not imported into the target file, immediately tell the
operator what is blocked and which editor action is needed. Continue only after
fresh `get_editor_state(include_schema: true)` identifies the expected file and
`batch_get` confirms the required reusable/library state.

## Creating a component library

1. Define the design-system inventory before editing: component names, variants,
   states, tokens/themes, and expected mockup usage.
2. Work in an MCP-visible dedicated `.lib.pen` when creating a new design
   library; do not repurpose an existing design file without confirmation.
3. Use `get_variables` when components should share tokens/themes.
4. Use `batch_design` to create component origins, variants, nested components,
   reusable nodes, or variables only when the returned schema exposes those
   operations.
5. If MCP cannot mark an element as reusable or turn a new file into a library,
   ask the operator to perform that editor action; require explicit confirmation
   before irreversible conversion of an existing file.
6. Verify the library with one `batch_get` call that searches reusable nodes
   rather than reading every component one by one.
7. After material changes, apply the root save-status contract to the library
   file before claiming a durable component-library result.

## Using a library in mockups

1. Confirm the target mockup file is open and MCP-visible.
2. Confirm the needed library is imported or otherwise visible to the target
   file. If not, immediately notify the operator and ask for the editor import
   step instead of bypassing MCP.
3. After a `.lib.pen` file changes, first use `batch_get` to check the consumer's
   refreshed component state; ask the operator to reload or reopen only when MCP
   evidence remains stale.
4. Use batched reusable-node searches to list available library components.
5. Place or copy component instances through `batch_design` according to the
   schema. Customize instance content, state, or variant without detaching unless
   the user asks for a one-off design.
6. Verify that target frames contain component refs or instances, not merely
   visually similar duplicated shapes.
7. Apply the root save-status contract to each materially changed consumer file.

## Preserve library, module, and runtime roles

Before materially editing a product or module mockup, use `batch_get` to inspect
the relevant peer frames, reusable component origins or instances, and
source-established functional views. Record each applicable capability as
reuse, justified divergence, or `N/A` with its authority. Search, detail, and
history are named falsifiers when accepted sources establish them; they are not
universal requirements to invent from a checklist.

Keep the representation hierarchy explicit:

1. accepted product and UX sources own required behavior and journey coverage;
2. the reusable Pencil library owns reusable components, variants, and tokens
   that MCP confirms;
3. the module mockup consumes those sources and remains a directional design
   artifact;
4. a supplied runtime representation is separate implementation evidence and
   does not become library or product authority merely because it exists.

Resolve disagreement through the accepted source hierarchy. Do not detach or
duplicate library components to hide a missing variant, copy a runtime omission
into the mockup, or treat a polished module frame as proof of runtime coverage.

## Reporting

Report:

- which library file and target file were MCP-visible;
- which reusable components were created or reused;
- which target frames use component instances or refs;
- what MCP checks, screenshots, or exports verified the result;
- save status for each materially changed library or consumer file;
- any UI-only library setup/import step the operator had to complete.
