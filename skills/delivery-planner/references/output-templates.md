# Output templates

Use these templates as flexible shapes, not mandatory forms. Prefer the smallest one that is useful. Delete rows or sections that do not help the downstream agent; do not expand a narrow request just to satisfy the template.

The capability/substrate/anti-claims, decomposition type, and gate fields are guardrails, not a request for a longer document. Keep them terse. Their job is to prevent plans from presenting scaffolds, wrappers, specs, mocks, metadata, or empty tests as delivered capability.

Begin with a concise result in plain, understandable language. Remove
unnecessary jargon and briefly explain necessary specialist terms; preserve
technical identifiers.

## Repository artifact conventions

Before creating a persistent Delivery Plan, Module Delivery Plan, expanded task brief, or backlog audit in a repository, check whether repo-local artifact conventions exist through AGENTS.md, README, CONTRIBUTING, or docs linked from them.

If conventions exist, follow their mandatory content, audit, checkpoint, stop,
and reporting rules as well as delivery plan path, IDs, task brief persistence,
metadata/front matter, source links, related artifacts, and module index
updates. Compactness never permits omitting those rules. Do not hard-code a
repository-specific path in these templates. If no convention exists, use the
compact Markdown defaults below and state path assumptions only when writing
files.

Do not persist task briefs as separate files when the delivery plan table is sufficient and repo conventions do not require standalone task artifacts. Recommend standalone task briefs only when they have reuse, execution, or review value outside the current plan.

## Compact Delivery Plan

```md
# Delivery Plan

Brief result:

## 1. Planning scope

- Scope type:
- Target:
- Included:
- Out of scope:
- Scope baseline / source:
- Scope delta: unchanged | narrowed | expanded | mixed
- Unauthorized additions: none | findings
- Source authority:
- Customer/contract basis for material product requirements:
- Plan handoff: draft | blocked | ready for <consumer>
- Output mode: compact

## 2. Capability, substrate, and anti-claims

- Capability:
- Substrate:
- Anti-claims:

## 3. Current baseline

- Already present:
- Not present / unknown:

## 4. Input readiness, assumptions, and gaps

| Source / input | Authority or status | Blocking / non-blocking | Impact | Owner / handling |
|---|---|---|---|---|
|  | authoritative / non-authoritative / draft / blocked / ready |  |  |  |

## 5. Obligation disposition and decomposition

| Source / obligation | Disposition | Slice / increment | Observable or verifiable outcome | Task / route | Risk |
|---|---|---|---|---|---|
|  | task / specialist route / spike / not applicable | VS-01 / MI-01 |  |  | low/medium/high |

## 6. Task handoffs

| Task | Type / risk | Slice / increment | Goal / scope | Source / obligation | Handoff status | Blockers / dependencies | Next owner | Expected output / evidence | Unblock / return route |
|---|---|---|---|---|---|---|---|---|---|
| T-01 | vertical slice / support / spike / spec / review; low/medium/high | VS-01 |  |  | draft / blocked / ready for owner |  |  |  |  |

## 7. Sequencing and gates

- Wave 0:
- Wave 1:
- Wave 2:
- Parallel implementation:
- Independent acceptance:
- Shared acceptance gates:
- Must not start or merge yet:

| From | To | Type | Gate / evidence | Owner / unblock or return route |
|---|---|---|---|---|
|  |  | `start` / `merge` / `acceptance` / `future-owner` |  |  |

## 8. Routing and risk notes

- `prd-engineer`:
- `architecture-engineer`:
- `spec-engineer`:
- coding-ready:
- review-sensitive:

## 9. Audit summary

- Scope respected:
- Scope delta, authority, and consequences explicit:
- Unauthorized additions: none | findings
- Material product additions have customer/contract coordination:
- Non-product obligations remain inside their authority boundary:
- Input readiness preserved:
- Every obligation dispositioned:
- Architecture not redesigned:
- Substrate tied to outcomes:
- Hidden high-risk work exposed:
- Every task has a truthful handoff and evidence contract:
- Implementation parallelism is distinct from acceptance independence:
- Same-record / shared-race work has a shared acceptance gate:
- Plan completion not reported as runtime progress:
- Output kept compact:
```

## Module Delivery Plan

```md
# Module Delivery Plan

Brief result:

## 1. Module scope

- Module/service/bounded context:
- Accepted responsibilities:
- Public/internal boundaries:
- Collaborators:
- Out of scope:
- Scope baseline / source:
- Scope delta: unchanged | narrowed | expanded | mixed
- Unauthorized additions: none | findings
- Customer/contract basis for material product requirements:
- Architecture handoff references:
- Plan handoff: draft | blocked | ready for <consumer>

## 2. Module outcome, substrate, and anti-claims

- Module outcome:
- Substrate:
- Anti-claims:

## 3. Current module baseline

- Already present:
- Not present / unknown:

## 4. Input readiness and architecture obligation disposition

| Source / obligation | Authority or status | Disposition | Meaning for this module | Task / route | Risk |
|---|---|---|---|---|---|
| Contract / data / security / ops / integration | authoritative / non-authoritative / draft / blocked / ready | task / specialist route / spike / not applicable |  |  |  |

## 5. Module increments

| ID | Increment | Verifiable module outcome | Verification hook | Risk |
|---|---|---|---|---|
| MI-01 |  |  | test/contract/log/metric/audit |  |

## 6. Task handoffs

| Task | Type / risk | Increment | Goal / scope | Source / obligation | Handoff status | Blockers / dependencies | Next owner | Expected output / evidence | Unblock / return route |
|---|---|---|---|---|---|---|---|---|---|
| T-01 | module increment / support / spike / spec / review; low/medium/high | MI-01 |  |  | draft / blocked / ready for owner |  |  |  |  |

## 7. Sequence and gates

- First stabilize:
- Then implement:
- Then harden:
- Parallel implementation:
- Independent acceptance:
- Shared acceptance gates:
- Must not start or merge yet:

| From | To | Type | Gate / evidence | Owner / unblock or return route |
|---|---|---|---|---|
|  |  | `start` / `merge` / `acceptance` / `future-owner` |  |  |

## 8. Audit summary

- Module boundary respected:
- Scope delta, authority, and consequences explicit:
- Unauthorized additions: none | findings
- Material product additions have customer/contract coordination:
- Non-product obligations remain inside their authority boundary:
- Input readiness preserved:
- Every obligation dispositioned:
- Substrate tied to module increments:
- Every task has a truthful handoff and evidence contract:
- Implementation parallelism is distinct from acceptance independence:
- Same-record / shared-race work has a shared acceptance gate:
- Plan completion not reported as runtime progress:
```

## Expanded task brief

Use only when compact table is not enough.

```md
### Task T-XX — Title

- Slice / increment:
- Goal:
- Scope:
- Out of scope:
- Source / obligation trace:
- Customer/contract basis or bounded non-product authority:
- Handoff status: draft | blocked | ready for <owner>
- Blockers and dependencies:
- Risk:
- Next owner:
- Expected output / evidence:
- Unblock condition / evidence-return route:
- Open questions:
```
