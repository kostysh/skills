# Output templates

Use these templates as flexible shapes, not mandatory forms. Prefer the smallest one that is useful. Delete rows or sections that do not help the downstream agent; do not expand a narrow request just to satisfy the template.

The capability/substrate/anti-claims, decomposition type, and gate fields are guardrails, not a request for a longer document. Keep them terse. Their job is to prevent plans from presenting scaffolds, wrappers, specs, mocks, metadata, or empty tests as delivered capability.

## Repository artifact conventions

Before creating a persistent Delivery Plan, Module Delivery Plan, expanded task brief, or backlog audit in a repository, check whether repo-local artifact conventions exist through AGENTS.md, README, CONTRIBUTING, or docs linked from them.

If conventions exist, follow them for delivery plan path, delivery plan ID, module delivery plan ID, task brief persistence rules, metadata/front matter, source links, related artifact IDs, and module index updates. Do not hard-code a repository-specific path in these templates. If no convention exists, use the compact Markdown defaults below and state path assumptions only when writing files.

Do not persist task briefs as separate files when the delivery plan table is sufficient and repo conventions do not require standalone task artifacts. Recommend standalone task briefs only when they have reuse, execution, or review value outside the current plan.

## Compact Delivery Plan

```md
# Delivery Plan

## 1. Planning scope

- Scope type:
- Target:
- Included:
- Out of scope:
- Source authority:
- Output mode: compact

## 2. Capability, substrate, and anti-claims

- Capability:
- Substrate:
- Anti-claims:

## 3. Current baseline

- Already present:
- Not present / unknown:

## 4. Assumptions and gaps

| Type | Item | Impact | Route / handling |
|---|---|---|---|
| Blocking / non-blocking |  |  |  |

## 5. Decomposition

| ID | Type | Slice / increment | Observable or verifiable outcome | Source / architecture reference | Risk |
|---|---|---|---|---|---|
| VS-01 / MI-01 | vertical slice / support / spike / spec / review / module increment |  |  |  | low/medium/high |

## 6. Task table

| Task | Type | Slice / increment | Goal | Scope | Depends on | Risk | Next step | Verification hint | Review hint |
|---|---|---|---|---|---|---|---|---|---|
| T-01 | vertical slice / support / spike / spec / review | VS-01 |  |  |  |  | spec-engineer/coding/etc. |  |  |

## 7. Sequencing and gates

- Wave 0:
- Wave 1:
- Wave 2:
- Parallelizable:
- Must not parallelize yet:

| Gate | Blocks | How to clear |
|---|---|---|
|  |  |  |

## 8. Routing and risk notes

- `prd-engineer`:
- `architecture-engineer`:
- `spec-engineer`:
- coding-ready:
- review-sensitive:

## 9. Audit summary

- Scope respected:
- Architecture not redesigned:
- Substrate tied to outcomes:
- Hidden high-risk work exposed:
- Every task has verification direction:
- Output kept compact:
```

## Module Delivery Plan

```md
# Module Delivery Plan

## 1. Module scope

- Module/service/bounded context:
- Accepted responsibilities:
- Public/internal boundaries:
- Collaborators:
- Out of scope:
- Architecture handoff references:

## 2. Module outcome, substrate, and anti-claims

- Module outcome:
- Substrate:
- Anti-claims:

## 3. Current module baseline

- Already present:
- Not present / unknown:

## 4. Architecture obligations to implement

| Obligation | Meaning for this module | Risk | Route if unresolved |
|---|---|---|---|
| Contract / data / security / ops / integration |  |  |  |

## 5. Module increments

| ID | Increment | Verifiable module outcome | Verification hook | Risk |
|---|---|---|---|---|
| MI-01 |  |  | test/contract/log/metric/audit |  |

## 6. Tasks

| Task | Type | Increment | Goal | Scope | Depends on | Risk | Next step | Verification hint | Review hint |
|---|---|---|---|---|---|---|---|---|---|
| T-01 | module increment / support / spike / spec / review | MI-01 |  |  |  |  | spec-engineer/coding/etc. |  |  |

## 7. Sequence and gates

- First stabilize:
- Then implement:
- Then harden:
- Parallelizable:
- Blocked by:

| Gate | Blocks | How to clear |
|---|---|---|
|  |  |  |

## 8. Audit summary

- Module boundary respected:
- Substrate tied to module increments:
- Hidden high-risk work exposed:
- Verification hooks named:
```

## Expanded task brief

Use only when compact table is not enough.

```md
### Task T-XX — Title

- Slice / increment:
- Goal:
- Scope:
- Out of scope:
- Dependencies:
- Risk:
- Architecture reference:
- Next step:
- Verification hint:
- Review hint:
- Open questions:
```
