# Delivery planning patterns

Use these patterns when decomposition, task size, sequencing, or module boundaries are unclear.

## 1. Thin capability slice

Deliver the smallest observable capability that proves the path from input to result.

Good for project/feature planning.

```text
Input -> accepted architecture path -> persisted/resulting state -> observable output -> verification evidence
```

## 2. Module increment

Deliver a verifiable piece of a module's responsibility.

Good when the requested scope is one module, service, adapter, or bounded context.

```text
Accepted responsibility -> public/internal boundary -> implementation obligation -> verification hook
```

Examples:

```text
MI-01: Payments module accepts CreateBillingProfile command and validates tenant ownership.
MI-02: Payments module persists billing profile state and enforces source-of-truth invariant.
MI-03: Payments module emits BillingProfileCreated audit event.
```

## 3. Capability-substrate pairing

Use when a needed task is mostly scaffold, migration setup, fixture work, config, docs, or test harness work.

Keep it only if it names the outcome it enables:

```text
Current source obligation -> direct-path insufficiency -> substrate -> owner increment -> evidence unlocked
```

Examples:

```text
Weak: Add webhook fixture folder.
Better: Add provider webhook fixtures needed to verify MI-02 idempotent callback handling.

Weak: Create audit event wrapper.
Better: Add audit event helper used by VS-03 account-status transition and covered by event contract tests.
```

If there is no current source obligation, owner outcome, or reason the direct task and existing verification are insufficient, merge it into another task, delete it, or route the gap.

Future-only substrate is not a valid standalone task. If a wrapper, config surface, harness, or extension point is only for "later", require a concrete dependent increment and revisit trigger before keeping it.

## 4. Contract-first task

Use when multiple tasks depend on a stable API/event/schema/interface.

Create a task for accepted contract alignment and tests before parallel implementation.

Do not invent the contract. If the contract is not accepted, route to `architecture-engineer`.

## 5. Integration verification support

Use when external provider, async flow, queue, event stream, webhook, SDK, or rate limit makes verification risky.

Start with the narrowest existing sandbox, contract test, fixture, or boundary check. Create a harness or other support task only when a current integration obligation cannot be verified directly; name the obligation, dependent increment, evidence unlocked, and direct-path insufficiency.

## 6. Migration split

Use when data changes carry rollback or compatibility risk.

Prefer separate tasks for:

```text
migration plan/spec;
safe schema/data change;
compatibility layer;
application behavior;
cleanup after rollout.
```

Route unresolved migration strategy to `architecture-engineer`.

## 7. Security boundary split

Use when auth, permissions, tenant isolation, secrets, audit, or abuse behavior is involved.

Separate:

```text
policy/contract basis;
enforcement implementation;
negative/failure cases;
audit/security evidence;
review and validation.
```

Route exact behavior to `spec-engineer` and security judgment to the appropriate review path.

## 8. Risk spike

Use when a key planning choice depends on evidence.

A spike is valid only if it has a bounded question and a planning decision that will be unlocked.

## 9. Hardening after capability

Do not hide hardening inside the first implementation task if it creates review overload.

Common hardening tasks:

```text
observability;
error/degraded paths;
backfill/cleanup;
performance validation;
security negative cases;
operational docs;
rollout flags.
```

## 10. Backlog repair

When auditing an existing backlog:

```text
merge substrate-only tasks into capability/module increments;
split giant tasks by review path and risk;
promote hidden high-risk tasks;
route missing architecture/spec/product decisions;
add verification hints;
resequence to expose risk early.
```

## 11. Parallel implementation with shared acceptance

Use when tasks can be developed in separate worktrees but their correctness depends on one combined invariant.

```text
Clear start edges -> parallel implementation -> independent branch review -> shared acceptance fixture -> task closure
```

Do not serialize implementation merely because acceptance is shared. Record an `acceptance` edge with the joint evidence and owner. Add a separate `merge` edge only when integration order is constrained.

Example:

```text
Protocolla and Rifiuta may be implemented independently.
Neither is accepted until one same-record race proves exactly one terminal outcome and authoritative reread.
```
