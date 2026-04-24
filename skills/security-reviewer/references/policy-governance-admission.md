# Policy-Governance Admission

Use this file when a review touches policy/control-plane admission that gates external side effects, authorization, governance state, or security-relevant policy activation.

## Trigger Boundary

Use this checkpoint only when the reviewed slice affects one of these surfaces:

- external consultant/tool invocation admission
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
- activation race: active-policy activation is serialized so two security/governance policies cannot become active for the same scope concurrently
- audit explanation sufficiency: admission and refusal records explain actor, policy/scope, freshness evidence, replay/idempotency key, decision, and side-effect outcome well enough to reconstruct why action was allowed or refused

Before reporting, verify surrounding mitigations such as transactions, unique constraints, locks, compare-and-swap updates, outbox ordering, policy-version binding, idempotency key scope, and fail-closed error handling.

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

## Examples

### External Invocation Admission Review

Ask:

- After explicit DENY, is there any external consultant/tool invocation, queued job, webhook, or retry that can still run?
- If admission or audit persistence fails or conflicts, does the system fail closed before invocation?
- Can a replayed request ID or stale allow replay invoke a consultant/tool under a different actor, scope, policy version, or freshness window?
- Does the audit record explain admission or refusal, including the decision, actor, policy/scope, freshness timestamp, idempotency key, and whether side effects were skipped?

Report only if the reviewed path confirms no-invocation is bypassed, failed/conflicting persistence still permits side effects, or stale replay reaches an external invocation with security impact.

### Active-Policy Activation Review

Ask:

- Confirm active-policy activation is serialized by transaction, unique active constraint, compare-and-swap, lock, or equivalent guard.
- Can concurrent activation create simultaneous active security/governance policies for the same scope?
- Does missing freshness evidence or a stale freshness timestamp fail closed when age gating is required?
- Does the audit record provide audit explanation sufficiency for both the refused activation and the admitted active policy?

Report only if a confirmed actor/control path can create conflicting active policy state or bypass a fail-closed activation gate with security-relevant operator/control-plane impact.
