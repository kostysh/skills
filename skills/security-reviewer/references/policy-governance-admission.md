# Policy-Governance Admission

Use this file when a review touches policy/control-plane admission that gates external side effects, authorization, governance state, or security-relevant policy activation.

## Trigger Boundary

Use this checkpoint only when the reviewed slice affects one of these surfaces:

- external consultant/tool invocation admission
- admission or approval gates that can produce current executable capability
- policy profile activation or active-scope selection
- governance/audit persistence used as a precondition for action
- fail-closed policy gates
- replay/idempotency controls around security-relevant decisions

Do not use this checkpoint for ordinary code-quality concerns, general policy architecture, or features that do not gate external side effects, authorization, policy activation, or security-relevant governance state. Route non-security merge risks to `code-reviewer`.

This checkpoint is distinct from route auth-admission. Route admission stays in `references/api-auth-input.md`; this file covers policy/control-plane admission before non-route side effects or active governance decisions.

## Bounded Security Checklist

Check:

- explicit deny/no-invocation: an explicit deny decision prevents external consultant/tool invocation and other protected side effects
- failed/conflicting audit persistence: failed, ambiguous, or conflicting admission/audit writes fail closed before external invocation or activation
- stale allow replay: duplicate, conflicting, or replayed request IDs cannot reuse a stale allow decision across actor, scope, policy version, or freshness boundary
- freshness evidence: missing freshness timestamp or stale age-gated evidence fails closed when freshness is required
- authority binding: freshness, evidence identity, scope, stage, release, runtime artifact, and deployment identity come from canonical sources rather than caller-selected refs
- activation race: active-policy activation is serialized so two security/governance policies cannot become active for the same scope concurrently
- audit explanation sufficiency: admission and refusal records explain actor, policy/scope, freshness evidence, replay/idempotency key, decision, and side-effect outcome well enough to reconstruct why action was allowed or refused

Before reporting, verify surrounding mitigations such as transactions, unique constraints, locks, compare-and-swap updates, outbox ordering, policy-version binding, idempotency key scope, and fail-closed error handling.

## Admission Replay Semantics

Separate these meanings before judging the gate:

- historical/audit replay: returns the prior decision, status, refusal reason, or audit record for inspection only
- current invocable or executable capability: can invoke an external tool, enqueue protected work, mint or reuse a token, approve a payment, deploy, publish, roll back, access a protected resource, or otherwise create a fresh side effect
- conflict replay: reuses the same idempotency key or replay identifier with different security-relevant inputs

Required checks:

- replay of a stored `allowed` decision returns only historical/audit status unless a fresh invocation is independently authorized by current policy, current evidence, and the bound identity set
- replay does not grant a new invocable capability, reuse an old capability token, enqueue protected work, or skip current admission checks
- conflict replay with the same idempotency key and different actor, operation, target/resource, scope, stage, policy version, evidence identity, release/runtime artifact, deployment identity, or freshness window fails closed
- idempotency scope includes every security-relevant dimension needed to prevent one allowed decision from authorizing a different request

For an admission-gate verdict, return `FAIL` when stored `allowed` replay grants current executable capability, conflict replay does not fail closed, or idempotency scope omits a security-relevant identity dimension that the caller can vary.

## Authority Binding

Ask:

- freshness timestamp authority: who controls the timestamp, such as caller input, server clock, provider-signed timestamp, database record, deployment platform, or another canonical source
- evidence identity authority: which canonical source binds evidence identity, such as immutable evidence record, verified artifact digest, signed attestation, database row, audit log, or provider event
- whether the caller can choose scope, stage, evidence, release, runtime artifact, deployment, or policy refs, and whether the server verifies those refs are authorized for the actor and operation
- what happens when evidence is absent, stale, deleted, superseded, or belongs to a different actor, scope, stage, release, runtime artifact, or deployment
- release-to-runtime artifact binding and deployment identity binding: which identity binds release to immutable runtime artifact and which deployment identity proves where that artifact is allowed to run

Required checks:

- freshness must be derived from a canonical trusted source or cryptographically/provider verified source when freshness affects admission
- evidence identity must be bound to the actor, operation, target/resource, scope, stage, policy version, and freshness window used by the decision
- caller-selected scope, stage, evidence, release, runtime artifact, or deployment refs require an independent server-side authorization and binding check
- absent or stale evidence fails closed when the gate claims evidence is required
- release, runtime artifact, and deployment identity are bound by immutable artifact digest, signed provenance, protected environment identity, deployment approval identity, or equivalent control when deployment/publish/rollback authority depends on them

For an admission-gate verdict, return `FAIL` when caller-controlled freshness, evidence, scope, stage, release, runtime artifact, or deployment identity can influence admission without protective binding to canonical authority.

## Actor Guidance

Keep the default external-attacker threat model unless the reviewed surface needs a narrower or different actor. For policy-governance admission, explicitly state the actor when it is an operator, compromised integration, external consultant/tool integration, or replay source.

Report a finding only when the actor/control path is confirmed or the impact is security-relevant operator/control-plane impact. If the concern is only confusing policy state, weak product behavior, or a general merge risk without a security-relevant control path, route it to `code-reviewer`.

## Reporting Gates

Report only HIGH-confidence findings by default:

- confirmed actor, trigger, or replay source control
- reachable admission path
- missing or bypassed fail-closed control
- security impact on external side effects, authorization, governance state, or active security policy
- evidence that mitigations do not already prevent the outcome

Use `needs verification` when transaction isolation, queue ordering, lock scope, runtime idempotency storage, or platform audit persistence is not visible in reviewed code.
Also use `needs verification` when artifact provenance, deployment identity, provider timestamp verification, or canonical evidence storage is not visible but could be supplied by infrastructure.

## Examples

### External Invocation Admission Review

Ask:

- After explicit DENY, is there any external consultant/tool invocation, queued job, webhook, or retry that can still run?
- If admission or audit persistence fails or conflicts, does the system fail closed before invocation?
- Can a replayed request ID or stale allow replay invoke a consultant/tool under a different actor, scope, policy version, or freshness window?
- Does the audit record explain admission or refusal, including the decision, actor, policy/scope, freshness timestamp, idempotency key, and whether side effects were skipped?

Report only if the reviewed path confirms no-invocation is bypassed, failed/conflicting persistence still permits side effects, or stale replay reaches an external invocation with security impact.

Expected verdict: `FAIL` when replay of a stored `allowed` decision can invoke the consultant/tool again without fresh policy, evidence, and identity binding.

### Caller-Controlled Freshness or Evidence Review

Ask:

- Does the caller submit a freshness timestamp, evidence record ID, policy scope, stage, release, runtime artifact, or deployment ref that affects admission?
- Is that caller-selected ref bound to a canonical server/provider record and to the same actor, operation, target/resource, scope, stage, policy version, and freshness window?
- Does absent, stale, mismatched, or superseded evidence fail closed before side effects?
- If a deployment or publish/rollback decision is involved, does the release ref bind to an immutable runtime artifact and protected deployment identity?

Expected verdict: `FAIL` when caller-controlled freshness or evidence refs can satisfy admission without canonical authority binding.

### Active-Policy Activation Review

Ask:

- Confirm active-policy activation is serialized by transaction, unique active constraint, compare-and-swap, lock, or equivalent guard.
- Can concurrent activation create simultaneous active security/governance policies for the same scope?
- Does missing freshness evidence or a stale freshness timestamp fail closed when age gating is required?
- Does the audit record provide audit explanation sufficiency for both the refused activation and the admitted active policy?

Report only if a confirmed actor/control path can create conflicting active policy state or bypass a fail-closed activation gate with security-relevant operator/control-plane impact.
