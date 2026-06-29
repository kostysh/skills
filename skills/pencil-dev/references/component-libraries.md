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

Those UI actions may be required because MCP may not expose every library
lifecycle operation. If a needed library file is missing, not open, not marked
as a library, or not imported into the target file, immediately tell the
operator what is blocked and which editor action is needed. Continue only after
`get_editor_state(include_schema: true)` can see the updated file state.

## Creating a component library

1. Define the design-system inventory before editing: component names, variants,
   states, tokens/themes, and expected mockup usage.
2. Work in an MCP-visible open library file. Prefer `.lib.pen` for reusable
   library files when the operator is creating a new design library.
3. Use `get_variables` when components should share tokens/themes.
4. Use `batch_design` to create component origins, variants, nested components,
   reusable nodes, or variables only when the returned schema exposes those
   operations.
5. If MCP cannot mark an element as reusable or turn a file into a library, ask
   the operator to perform that specific editor UI action, then re-run
   `get_editor_state(include_schema: true)` and inspect the result.
6. Verify the library with one `batch_get` call that searches reusable nodes
   rather than reading every component one by one.

## Using a library in mockups

1. Confirm the target mockup file is open and MCP-visible.
2. Confirm the needed library is imported or otherwise visible to the target
   file. If not, immediately notify the operator and ask for the editor import
   step instead of bypassing MCP.
3. Use `batch_get` reusable-node searches to list available library components.
4. Place or copy component instances through `batch_design` according to the
   schema. Customize instance content, state, or variant without detaching unless
   the user asks for a one-off design.
5. Verify that target frames contain component refs or instances, not merely
   visually similar duplicated shapes.

## Reporting

Report:

- which library file and target file were MCP-visible;
- which reusable components were created or reused;
- which target frames use component instances or refs;
- what MCP checks, screenshots, or exports verified the result;
- any UI-only library setup/import step the operator had to complete.
