# Spec and Plan Risk Patterns

Use this reference during:

- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`

Its purpose is to kill contract-risk earlier, before expensive corrective cycles appear during implementation or after real usage.

## During `spec-compact`

### 1. Operator/agent contract

When the feature has operator-facing, agent-facing, or machine-facing behavior, make the contract explicit.

Capture what is relevant:

- first-run flow;
- blocking questions and ambiguity policy;
- path/root semantics;
- machine-facing output fields;
- error interpretation rules;
- cross-tool or cross-skill handoff rules.

Do not leave these as “obvious from context” if implementation or usage could drift without them.

### 2. Safety and boundary semantics

When the feature touches trust boundaries or failure-prone surfaces, record the safety semantics explicitly.

Capture what is relevant:

- path ownership;
- symlink policy;
- rollback vs partial success;
- concurrency or mutation ordering;
- stale-state handling;
- provenance requirements.

This is the right place to turn recurring implementation decisions into explicit contract.

### 3. Unresolved-decision triage

Do not leave all unresolved points as undifferentiated open items.

Classify them as:

- `normative now`
  - must be fixed in the specification/process before implementation continues safely
- `implementation freedom`
  - legitimate local design room; no immediate spec change required
- `temporary assumption`
  - tolerated for now but must be validated, removed, or carried forward explicitly

This triage prevents later confusion about which decisions reveal a weak specification and which do not.

## During `plan-slice`

### 1. Contract-risk block

Before closing planning, identify contract risks that must be killed before close-out.

Typical risk axes:

- first-run scenario;
- machine-readable output contract;
- help/discoverability;
- path/root semantics;
- cross-skill handoff;
- docs/runtime parity;
- operator ambiguity points.

If the feature has no meaningful exposure on one axis, say so briefly and move on.

### 2. Drift-guard work

Plan explicit drift-guard work when the feature spans multiple normative layers.

Typical layers:

- `SKILL.md`
- workflow/reference docs
- utility spec
- help output
- tests

If drift between these layers would be expensive, add a guard task instead of waiting for later corrective work.

### 3. Real usage audit

If the feature has agent-facing, operator-facing, or machine-facing behavior, plan a real usage audit after the main implementation flow.

The goal is not more theory. The goal is to expose:

- discoverability defects;
- machine-field overload;
- path/root confusion;
- command interpretation drift;
- cross-skill handoff confusion.

### 4. Corrective backlog categories

When planning a real usage audit, predefine the corrective categories:

- `docs-only`
- `runtime`
- `schema/help`
- `cross-skill`
- `audit-only`

This keeps follow-up work structured instead of turning it into one unbounded “cleanup”.

## Keep it proportional

Do not mechanically add every block to every dossier.

Use these patterns when the feature actually has:

- meaningful operator/agent/runtime surface;
- ambiguity that could create drift;
- safety semantics worth preserving;
- enough complexity that a later corrective pass would be costly.
