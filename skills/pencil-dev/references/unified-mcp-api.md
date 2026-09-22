# Unified Pencil MCP API

Read this before calling Pencil MCP for any `.pen` task. It defines the
portable operating contract for the consolidated API. Exact live signatures,
the current `.pen` schema, and runtime error contracts own callable behavior;
accepted operator/product/library intent owns the requested artifact semantics.
Use current provider-supplied `read_skill` guidance to apply the runtime, but
stop when it cannot be reconciled with the accepted result instead of silently
changing that result.

## Discover and bind the target

1. Inspect the available Pencil MCP surface. The standard consolidated surface
   exposes `get_app_state`, `execute`, `get_style`, and `read_skill`; `browser`
   is desktop-conditional, and `spawn_agents` may be exposed only by a server
   started with its dedicated enable flag. Do not assume a conditional tool is
   callable or that its presence grants delegation authority.
2. Call `get_app_state` with its current live signature. Confirm the intended
   active canvas file, selection, and top-level context, then capture its
   `filePath`.
3. Pass the exact `filePath` to `execute` and `browser` when their live schemas
   require it. Never infer a target from a prior task, cached selection, or
   remembered node ID.
4. If `read_skill` is available, read its root plus `pen-schema.md` and
   `execute.md` before the first mutation. Read any task-specific reference
   linked by those files before its operation, especially `generate.md` before
   `Generate`; re-read when a property, operation, or error contract is
   uncertain.
5. Re-read app state after the operator switches, opens, reloads, or reopens a
   document, and whenever a node is missing or no longer matches expectations.
   Pencil is collaborative; re-read instead of recreating or overwriting
   concurrent user changes.
6. Stop when MCP cannot identify the intended file. Do not bypass this boundary
   with legacy tool names, CLI, filesystem reads, or raw `.pen` editing.

Do not call removed discrete tools such as `get_editor_state`, `batch_get`,
`batch_design`, `snapshot_layout`, `get_screenshot`, `get_variables`,
`export_nodes`, or `export_html` unless the current live MCP surface explicitly
advertises them.

## Current routing

| Need | Current operation |
| --- | --- |
| Active file, selection, and canvas context | `get_app_state` |
| Current schema and provider guidance | `read_skill` |
| Read nodes or variables | `execute` with `Get`, `GetVariables`, and `Print` |
| Create or change nodes | `execute` with `Insert`, `Copy`, `Update`, `Replace`, `Move`, or `Delete` |
| Generate or transform in-document imagery or vector artwork | `execute` with `Generate`; read current `generate.md` first |
| Set variables and themes | `execute` with `SetVariables` |
| Find safe root placement | `execute` with `FindEmptySpace` |
| Inspect bounds or clipping | `execute` with a `Get` visitor and `ctx.bounds` / `ctx.problems` |
| Review visuals | `execute` with `TakeScreenshot` |
| Export images, PDF, or HTML | `execute` with `Export` |
| Load, inspect, capture, or import a live page | `browser` |
| Obtain art direction when none was supplied | `get_style` |

## Execute safely

- Send a small JavaScript snippet in `input` and keep each call focused on one
  coherent section or verification step. Use only functions documented by the
  current `execute.md`.
- A failed snippet is transactional: its document changes and created globals
  are rolled back. Repair it with the returned `editId` plus `edits`, where
  every edit uses the exact current fields `{find, replace}` and may add
  `all: true` only when every match should change. Omit `input` from a repair
  call; never resend the failed snippet as a new `input`. Continue patching the
  same `editId` if the repaired snippet fails again, matching the snippet as
  already modified by earlier edits.
- Repair syntax without silently changing design intent. If replacing or
  removing an unsupported property would change layout semantics—for example,
  mapping an external margin to internal padding—clarify the intended result
  before applying that edit.
- Treat returned warnings as unresolved work and fix them in the next
  `execute` call before claiming that section complete.
- Each call has its own JavaScript scope. Do not assume `const`, `let`, or helper
  functions survive another call. When a later call needs a created ID, expose
  it with `Print` or use the response's returned name-to-ID mapping, then pass
  that literal ID to the next call. Do not use a top-level `return` as an ID
  transport; use cross-call globals only when current `execute.md` explicitly
  documents them.
- Give every inserted or replaced node a human-readable `name`. Do not assign
  IDs when inserting, copying, or replacing; use the random IDs returned by
  Pencil. Targets are ID/path strings, not node objects.
- `Update` changes properties but not `children`, `id`, `type`, or `ref`.
  Use `Replace` for a subtree replacement and `Move` for hierarchy/order.
- When copying and customizing descendants, put overrides in the same `Copy`
  operation. Copied descendants receive new IDs, so later updates using source
  descendant IDs are unsafe.
- Use slash-separated instance paths only for descendants inside component
  instances. To emulate deletion inside an instance, override `enabled: false`.

## Read and verify proportionally

- Use `Get(path, {depth})` for a bounded subtree or a `Get` visitor for compact
  searches and checks. Do not dump an entire document when a targeted visitor
  or shallow read is sufficient.
- Use `resolveVariables`, `resolveInstances`, or `includePathGeometry` only when
  the task needs computed values, expanded instances, or exact path geometry.
- Inspect layout through visitor context: `ctx.bounds` proves resolved geometry
  and `ctx.problems` reports clipping. A clean structural check does not prove
  typography, color, contrast, or visual fidelity.
- Use `TakeScreenshot([nodeId])` only after a meaningful section is complete,
  preferably in the same successful call that finishes it. Its argument is an
  array of node ID strings, even for one node. Review the smallest useful node.
  Screenshots from failed calls are not evidence.
- Use `Export` only for requested deliverables. Image formats are `png`,
  `jpeg`, `webp`, and `pdf`; HTML formats are `html-tailwind` and `html-css`.
  Use `Export([nodeId], format, outputPath)`; export is not a substitute for
  `TakeScreenshot` visual review.
- Read existing variables with `GetVariables` before `SetVariables`; variable
  definition names omit `$`, while property references include it.

## Create and generate without corrupting layout

- Use `FindEmptySpace` before placing a new top-level frame when exact root
  coordinates are not already established. Keep the document root limited to
  major frames and reusable components.
- Mark every new, copied, or materially modified root frame
  `placeholder: true` while it is incomplete, finish that frame, then clear the
  flag promptly.
- Follow the current `.pen` schema rather than CSS assumptions. Unsupported
  values such as margins, percentage dimensions, or undocumented alignment
  modes must be redesigned with supported layout primitives.
- Read the current provider `generate.md` before every `Generate` workflow and
  use only the types and signatures it advertises. The reviewed API includes
  new-image types (`ai`, `stock`), frame-producing vector types (`svg`,
  `vectorize-image`), and existing-image transforms (`remove-background`,
  `replace-background`). Images remain fills rather than `image` nodes.
- Every current `Generate` type is asynchronous. For frame-producing types,
  poll the target frame's runtime-owned `placeholder` occasionally. For
  fill-producing types, poll the image fill URL until the documented pending
  value is replaced. Do not screenshot, export, duplicate, or retry pending
  work merely because the initiating call returned.
- Existing-image transforms must use an image URL read from the current
  document. When a transform returns an asset URL, apply it with `Update` in the
  same successful `execute` call as required by the live contract; do not carry
  that transient URL into a later call or invent one. Retry only after the
  documented completion signal proves the prior generation failed.

## Browser bridge

Use `browser` only when the task needs a real page as design input or a visual
feedback loop.

1. Pass the confirmed `filePath` to every current browser action. Run
   `action: "load-page"` with `url` before other actions unless the already
   loaded local page is live-reloading correctly.
2. For subsequent actions, use one of `return-element`, `return-screenshot`,
   `screenshot-to-canvas`, or `import-to-canvas`. Set `target` to `query`,
   `selection`, or `full-page`; `target: "query"` also requires
   `querySelector`.
3. Prefer a focused `query` or user `selection` over `full-page` for DOM reads,
   screenshots, and imports. `return-element` and `return-screenshot` inspect;
   `screenshot-to-canvas` and `import-to-canvas` mutate the Pencil document.
4. Treat imported editable layers as Pencil nodes and continue with `execute`;
   do not keep reasoning in CSS/HTML after import.

The integrated browser supports design import and visual feedback. It is not a
formal end-to-end test of the implemented web application; route that claim to
the relevant browser-testing skill.

## Completion and persistence

Report the confirmed `filePath`, accepted criteria, structural readback,
visual-review status, warnings or generation state, exports, and remaining
limitations. A successful `execute` call proves only that call. After material
edits, ask the operator to save in Pencil; without save confirmation, report a
verified live change separately from unconfirmed durable persistence.
