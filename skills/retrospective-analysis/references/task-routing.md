# Approved task handoff

Read this reference only when the operator requests or approves creation of
tracker tasks from an accepted retrospective plan.

## Hard gates

Do not mutate a tracker until all conditions hold:

1. the report and machine matrix are stable;
2. the required independent audit is `PASS`;
3. the numbered remediation plan reconciles all active recommendations;
4. the operator has separately approved creation of tasks from that plan;
5. project-specific task-management rules and tracker tools are available.

Approval of the retrospective request, report, audit, or implementation plan is
not implied approval to create external tasks.

## Task shape

Create:

- one navigation parent for the accepted remediation program;
- one child per active numbered plan step.

Do not create children for recommendations marked already implemented,
cancelled, rejected, superseded, not applicable, or intentionally retained
without action.

Issue bodies navigate to the authoritative report and exact plan step. They may
summarize outcome, dependencies, owner, evidence, and anti-claims, but must not
copy and fork the normative remediation plan.

Use the project's native parent-child mechanism and field semantics. Set status
from actual dependencies:

- ready only when prerequisites and source authority are ready;
- blocked when a named external or predecessor gate is unresolved;
- backlog when valid work is intentionally deferred;
- in progress only after an executor starts it.

## Idempotent creation protocol

Before any create operation:

1. read the accepted plan and enumerate exact active step IDs;
2. query the target repository/project for the navigation parent and each step
   using stable step ID, exact title, parent linkage, and project identity;
3. classify each as absent, exactly present, duplicate, or ambiguous;
4. stop on duplicate or ambiguous state; do not “repair” by creating another
   item;
5. present the intended exact counts when project rules require a preview.

For each authorized create:

1. create once;
2. capture the returned immutable issue/item ID and URL directly from the
   mutation response;
3. add native parent/project linkage using that identity;
4. read the issue and project item back directly by ID;
5. verify title, body source link, parent, status, and required fields before
   continuing.

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

- exactly one navigation parent;
- exactly one child for every active step and none for inactive dispositions;
- unique stable step IDs and titles;
- correct native parent links;
- correct target project and status/dependency fields;
- total task count equals the accepted active-step count;
- report links point to the stable authoritative revision.

Record the returned IDs/URLs and reconciliation evidence. Task existence proves
only backlog routing, not implementation or effectiveness.
