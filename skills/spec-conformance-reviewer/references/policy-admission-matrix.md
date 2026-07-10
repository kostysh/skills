# Policy/Admission Matrix

Use this optional reference only when normative sources mention policy decisions, admission gates, external consultant or downstream invocation, fail-closed behavior, activation decisions, or refusal semantics.

## Trigger Checklist

Before building the matrix, record:

- the normative source that triggers policy/admission review
- the decision subject, such as user, consultant, tenant, request, scope, or downstream call
- the expected allow, deny, refusal, fail-closed, or activation behavior
- any required persistence, audit, freshness, or no-invocation side effects

If no trigger exists, do not use this matrix as a general edge-case checklist.

## Row Catalog

Include a row only when it has a requirement basis.

| Row | Use when the normative source defines or implies |
|---|---|
| explicit allow | the conditions that permit admission or invocation |
| explicit deny / refusal / no invocation | conditions that must block admission, persist refusal, or avoid downstream invocation |
| missing admission evidence | behavior when required evidence is absent |
| ambiguous admission evidence | behavior when evidence exists but cannot prove admission |
| stale evidence or missing freshness timestamp | age limits, freshness timestamps, or recency checks are normative |
| unsupported or unhealthy downstream path | dependency capability, health, or support status changes the decision |
| duplicate or conflicting request id | idempotency, replay, dedupe, or persistence contract is normative |
| activation conflict | single-active-scope, mutually exclusive activation, or replacement behavior is normative |
| persistence failure | fail-closed auditability or durable decision logging is normative |

## Traceability Fields

For each included row, capture:

- `row_id`
- requirement ID and source citation
- precondition
- expected decision
- required side effect
- implementation evidence
- test or fixture evidence
- status
- notes on ambiguity or missing proof

## Classification Rules

- Use `not_fulfilled` only when a mandatory row has requirement basis and implementation evidence contradicts or omits it.
- Use `partially_fulfilled` only when evidence proves some required observable decision behavior and a required branch, constraint, or side effect is visibly absent. A missing proof surface alone does not establish partial fulfillment.
- Use `cannot_determine` when code, tests, runtime configuration, persistence, or another enforcement surface is incomplete or unavailable.
- Use `ambiguous_spec` when the normative source does not define the expected behavior clearly enough.
- Mark rows out of scope when they are plausible policy concerns but have no source basis for the current review.

## Reviewer Self-Check

- Did I read the normative source before implementation?
- Does each row cite a requirement ID?
- Did I avoid turning unsupported rows into findings?
- Are deny/refusal/no-invocation outcomes first-class when the spec requires them?
- Are freshness, replay, activation, downstream health, and persistence rows included only when normative?
- Are security exploitability or general merge-risk concerns routed to the right reviewer skill unless the spec makes them normative?

## Example Classification

If a spec says "deny requests with stale approval evidence and do not invoke the consultant," a missing stale-evidence branch is `not_fulfilled`.

If a spec only says "validate approval evidence" and never defines stale behavior, stale evidence is `ambiguous_spec` or a verification gap, not a confirmed violation.
