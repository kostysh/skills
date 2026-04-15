# Spec and Plan Risk Patterns

Use this reference during:

- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`

Its purpose is to kill contract-risk earlier, before expensive corrective cycles appear during implementation or after real usage.

## Adversarial proof obligations

Use this section when a feature touches side effects, durable state, lifecycle transitions, idempotency, retries, shutdown/startup, queues/jobs, transactions, audit evidence, a canonical writer/read-only consumer boundary, or a trust boundary.

Do not treat a broad phrase such as `idempotency tests`, `race tests`, `shutdown tests`, `boundary tests`, `failure tests`, `integration tests`, `coverage for edge cases`, or `adversarial tests` as a sufficient proof. These labels are acceptable only when paired with concrete proof details.

During `spec-compact`, classify each relevant case as `specified` or explicit `N/A`:

- sequential success;
- invalid input;
- dependency failure / timeout;
- duplicate or replay after completion;
- concurrent duplicate or racing request;
- concurrent conflicting request;
- partial side effect / crash / restart;
- stale read / stale snapshot / late completion.

For every `specified` case, name:

- participating operation(s);
- race window or ordering boundary;
- expected winner/loser result when there is competition;
- durable invariant;
- externally observable result or error;
- required proof type.

For every `N/A` case, write a compact `N/A rationale`. If a case cannot be classified yet, record it as a blocking `Open question` with `needed_by: before_planned`.

Keep these distinctions explicit:

- sequential replay is not the same proof as concurrent replay when concurrency is possible;
- duplicate same-payload replay is not the same proof as conflicting replay;
- closed admission is not the same shutdown/startup proof as an already-started in-flight operation;
- stale snapshot behavior must prove what can and cannot be reported before the canonical writer state is durable.

During `plan-slice`, map every non-`N/A` adversarial semantics entry into a named proof obligation. The mapping may be a table or compact list, but it must contain:

| Risk / edge case | Spec source | Required proof | Slice | Verification artifact | N/A rationale |
|---|---|---|---|---|---|

proof specificity smell pass: flag any generic verification label that does not name the operation pair or participating operation(s), race window or ordering boundary, expected observable result/error, and durable invariant.

Examples of sufficient proof obligations:

- concurrent same-key same-payload lifecycle requests converge to one durable record;
- concurrent same-key different-payload lifecycle requests return one success and one conflict without duplicate records;
- shutdown waits for already-started admission write before emitting evidence snapshot;
- stale snapshot cannot report completion before in-flight canonical writer state is durable.

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

### 3. Adversarial semantics

When the trigger in [Adversarial proof obligations](#adversarial-proof-obligations) applies, add compact adversarial semantics before planning.

Each triggered case must be `specified` with the required proof fields or explicit `N/A` with rationale. Do not leave `idempotency`, `shutdown`, `failure handling`, or `boundary behavior` as broad labels.

Use the side-effecting implementation checklist as upstream trigger vocabulary: timeout budget, late completion, abort/cancellation, partial side effects, idempotency / duplicate delivery, logging/audit append failures, and crash/restart boundaries.

### 4. Unresolved-decision triage

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

### 2. Risk-to-proof mapping

Before closing planning, every non-`N/A` adversarial semantics entry must have a named proof obligation in a slice.

The proof must name the competing or participating operation(s), race window or ordering boundary, expected observable result/error, and durable invariant. If a proof is intentionally unnecessary, the plan must carry an explicit `N/A rationale`; silence is not coverage.

Run the proof specificity smell pass before implementation. Generic labels such as `idempotency tests`, `shutdown tests`, or `integration tests` need concrete proof details beside them.

### 3. Drift-guard work

Plan explicit drift-guard work when the feature spans multiple normative layers.

Typical layers:

- `SKILL.md`
- workflow/reference docs
- utility spec
- help output
- tests

If drift between these layers would be expensive, add a guard task instead of waiting for later corrective work.

### 4. Real usage audit

If the feature has agent-facing, operator-facing, or machine-facing behavior, plan a real usage audit after the main implementation flow.

The goal is not more theory. The goal is to expose:

- discoverability defects;
- machine-field overload;
- path/root confusion;
- command interpretation drift;
- cross-skill handoff confusion.

### 5. Corrective backlog categories

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
