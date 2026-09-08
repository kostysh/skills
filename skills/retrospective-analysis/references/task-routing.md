# Approved task handoff

Read this reference for an explicitly requested tracker handoff or its
reconciliation. Preparing a handoff does not itself authorize tracker mutation.

## Hard gates

Do not mutate a tracker until all conditions hold:

1. the analysis and accepted residual actions are stable; full mode additionally
   requires its stable report and machine matrix;
2. an independent audit is `PASS` when full mode or applicable project rules
   require it; a targeted action does not inherit the full-mode audit gate;
3. every active action has a stable identifier, source, owner and acceptance
   boundary; full mode additionally reconciles the numbered plan;
4. the operator has separately approved creation for the accepted actions or
   numbered plan in the exact target;
5. project-specific task-management rules and tracker tools are available.

Approval of the retrospective request, report, audit, or implementation plan is
not implied approval to create external tasks.

Reuse explicit creation approval already given for the same accepted actions
and target. If a gate is missing, identify that gate and continue supported
handoff preparation without creating external items.

## Task shape

Choose the smallest shape required by the accepted scope and native project
rules:

- full program: one navigation parent and one child per active numbered step;
- targeted work: one actionable item per approved residual action, with an
  existing parent or a new navigation item only when the project requires it.

If no active actions remain, report that no creation is needed; do not add an
empty navigation item. Record expected navigation and actionable counts
separately before mutation.

Do not create children for recommendations marked already implemented,
cancelled, rejected, superseded, not applicable, or intentionally retained
without action.

Issue bodies link to the stable analysis and exact accepted action, or to the
authoritative report and numbered step when a plan applies. They may summarize
outcome, dependencies, owner, evidence, and anti-claims without forking that
source. A targeted action needs no invented plan or step.

Use native project fields and, when the selected shape includes a parent,
its parent-child mechanism. Set status from actual dependencies:

- ready only when prerequisites and source authority are ready;
- blocked when a named external or predecessor gate is unresolved;
- backlog when valid work is intentionally deferred;
- in progress only after an executor starts it.

## Idempotent creation protocol

Before any create operation:

1. read the accepted actions or plan and enumerate exact active action/step IDs;
2. query the target repository/project for each action and any parent required
   by the selected shape, using stable ID, title, applicable parent linkage,
   and project identity;
3. classify each as absent, exactly present, duplicate, or ambiguous;
4. stop on duplicate or ambiguous state; do not “repair” by creating another
   item;
5. present the intended exact counts when project rules require a preview.

For each authorized create:

1. create once;
2. capture the returned immutable issue/item ID and URL directly from the
   mutation response;
3. add required project linkage and any parent linkage in the selected shape
   using that identity;
4. read the issue and project item back directly by ID;
5. verify title, body source link, status, required fields, and parent presence
   or absence against the selected shape before continuing.

Do not repeat a mutation because:

- search indexing is delayed;
- project views are eventually consistent;
- a command timed out after returning an ID;
- output was truncated, backgrounded, or not visible in a prior terminal;
- a broad search does not immediately show the new item.

Resolve uncertain outcomes through direct readback of the returned identity or
stop for reconciliation.

## Final reconciliation

After creation, verify:

- navigation items match the selected shape (one parent for a full program);
- exactly one actionable item for every active action/step and none for
  inactive dispositions;
- unique stable action/step IDs and titles;
- correct native parent links, or their absence for a standalone item;
- correct target project and status/dependency fields;
- actionable count equals the accepted active-action/step count;
- total item count equals navigation count plus actionable count: for a full
  program with N active steps, one parent plus N children is N + 1 items;
- analysis/report links point to the stable authoritative revision and exact
  accepted action or plan step.

Record the returned IDs/URLs and reconciliation evidence. Task existence proves
only backlog routing, not implementation or effectiveness.
