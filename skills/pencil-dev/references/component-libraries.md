# Component libraries

Read this when the operator asks to create, maintain, import, inspect, or use
Pencil component libraries, reusable components, `.lib.pen` files, or
design-system assets. Read [Unified Pencil MCP API](unified-mcp-api.md) first.

## Capability boundary

A component-library task is complete only when MCP evidence shows reusable
component origins and their usage in target frames. Naming, screenshots,
duplicate shapes, or a file suffix alone are substrate.

Stay inside the MCP-only `.pen` boundary:

- use `get_app_state` with its current signature before library work and retain
  the confirmed `filePath`;
- use `execute` with `Get` to inspect reusable components, refs, instances, and
  variables;
- use `execute` mutations only according to current `execute.md` and the live
  `.pen` schema;
- use `ctx.bounds` / `ctx.problems` plus `TakeScreenshot` for review evidence,
  and `Export` only for requested deliverables;
- do not use removed discrete tools, Pencil CLI, raw `.pen` reads, JSON edits,
  filesystem patching, or another agent as a bypass.

## Pencil library model

Pencil design libraries are reusable component collections that can be imported
into other `.pen` files. Library files use the `.lib.pen` suffix. Pencil's UI
can turn a file into a library, import libraries into a target file, and place
library assets from the Assets panel.

Turning an existing file into a design library cannot be undone. Default to a
new dedicated `.lib.pen`; before asking the operator to convert an existing
file, explain the irreversible effect and obtain explicit confirmation.

Those UI actions may be required because MCP does not expose every library
lifecycle operation. If a needed library is missing, not open, not marked as a
library, or not imported into the target file, immediately report the exact
blocker and required editor action. Continue only after fresh `get_app_state`
confirms the expected target and `execute` readback exposes the required
reusable/library state.

An imported library component may appear under an MCP-visible provider-qualified
ID, for example with a `D:` or `u:` prefix. Use only IDs exposed in the current
consumer document; do not assume that a raw component ID from another file can
be referenced before that library is imported or visible.

### Authority for imported components

- Live tool signatures, `pen-schema.md`, and `execute.md` own the callable
  `Get` / `Insert` / `Update` shapes and error behavior.
- The accepted brief plus fresh consumer-document readback own whether the
  result must remain a connected imported instance rather than a detached copy.
- Provider guidance against raw cross-file references applies to component IDs
  that are not imported or visible in the current consumer. It does not
  authorize copying or detaching a provider-qualified component that fresh
  `get_app_state` and `Get` already expose in that consumer.
- If current schema/provider guidance explicitly rejects a consumer-visible
  provider ID, or `Insert` rejects it, stop and report the authority/runtime
  conflict. Never silently fall back to `Copy`, duplicate shapes, or detach.

## Create reusable components

1. Define the source-authorized component inventory before editing: component
   names, variants, states, tokens/themes, and expected mockup usage.
2. Work in an MCP-visible dedicated `.lib.pen` when creating a new design
   library; do not repurpose an existing design file without confirmation.
3. Read variables with `GetVariables` before `SetVariables` when components
   share tokens or themes.
4. Create an origin with `Insert(..., {reusable: true, ...})`; give every node a
   human-readable `name` and use returned random IDs rather than assigning IDs.
5. Build nested component structure with `Insert`, `Copy`, `Update`, `Replace`,
   and `Move` according to the current schema. Keep an incomplete root origin
   `placeholder: true`, then clear it when complete.
6. If MCP cannot perform a required file/library lifecycle action, ask the
   operator to perform it in Pencil; require explicit confirmation before
   irreversible conversion of an existing file.
7. Verify origins in one compact visitor, for example by listing nodes whose
   `reusable` property is true, rather than dumping or reading every component
   separately.
8. Apply the root save-status contract before claiming a durable library result.

## Create and customize instances

- Prefer existing reusable origins over visually duplicating them.
- Insert a connected instance as
  `{type: "ref", ref: componentId, name: "..."}` with the MCP-visible component
  ID. `Copy` or visually duplicated shapes are not connection evidence and do
  not substitute for a requested connected imported instance.
- Override the instance root directly. Put descendant overrides in one flat
  `descendants` map keyed by descendant ID, unique name, or slash-separated
  nested instance path.
- When `Copy` customizes descendants, put those overrides in the same `Copy`
  operation. Copied descendants receive new IDs; do not update the copy using
  source descendant IDs afterward.
- Use `Update(instanceId + "/childId", {...})` for property overrides and
  `Replace(instanceId + "/childId", completeNode)` for a subtree replacement.
  An instance has no independent `children`; use known origin IDs or a targeted
  `Get(instanceId, {resolveInstances: true})` read when expansion is necessary.
- To emulate deletion inside an instance, override `enabled: false`. Do not
  detach an instance or duplicate shapes merely to hide a missing variant.
- When an instance is outside layout, set both `x` and `y`; inside layout,
  prefer supported `fit_content` / `fill_container` sizing.

## Use an imported library in mockups

1. Confirm the target mockup and its exact `filePath` through fresh app state.
2. Confirm the needed library is imported and its components are visible to
   `Get`. If not, immediately request the editor import step.
3. After a `.lib.pen` change, read the consumer's current reusable components
   before inserting. Ask the operator to reload or reopen only when readback
   still shows stale state.
4. Place instances through `execute` and customize them without detaching unless
   the user explicitly requests a one-off design.
5. Verify that target frames contain component refs/instances and that their
   resolved content, bounds, and visual state meet the accepted criteria.
6. Apply the root save-status contract to every materially changed library or
   consumer document.

## Preserve library, module, and runtime roles

Before materially editing a product or module mockup, use a targeted `Get`
visitor to inspect relevant peer frames, reusable origins or instances, and
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

- which library and consumer `filePath` values were MCP-visible;
- which reusable origins were created or reused;
- which target frames contain refs/instances and how that was read back;
- what bounds checks and screenshots verified the result;
- requested export paths, if any;
- save status for each materially changed library or consumer file;
- any UI-only library setup/import step completed by the operator.
