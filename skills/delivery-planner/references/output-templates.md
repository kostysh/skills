# Output templates

Use these templates as flexible shapes, not mandatory forms. Prefer the smallest one that is useful. Delete rows or sections that do not help the downstream agent; do not expand a narrow request just to satisfy the template.

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

## 2. Assumptions and gaps

| Type | Item | Impact | Route / handling |
|---|---|---|---|
| Blocking / non-blocking |  |  |  |

## 3. Decomposition

| ID | Slice / module increment | Observable or verifiable outcome | Source / architecture reference | Risk |
|---|---|---|---|---|
| VS-01 / MI-01 |  |  |  | low/medium/high |

## 4. Task table

| Task | Slice / increment | Goal | Scope | Depends on | Risk | Next step | Verification hint | Review hint |
|---|---|---|---|---|---|---|---|---|
| T-01 | VS-01 |  |  |  |  | spec-engineer/coding/etc. |  |  |

## 5. Sequencing

- Wave 0:
- Wave 1:
- Wave 2:
- Parallelizable:
- Must not parallelize yet:

## 6. Routing and risk notes

- `prd-engineer`:
- `architecture-engineer`:
- `spec-engineer`:
- coding-ready:
- review-sensitive:

## 7. Audit summary

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

## 2. Architecture obligations to implement

| Obligation | Meaning for this module | Risk | Route if unresolved |
|---|---|---|---|
| Contract / data / security / ops / integration |  |  |  |

## 3. Module increments

| ID | Increment | Verifiable module outcome | Verification hook | Risk |
|---|---|---|---|---|
| MI-01 |  |  | test/contract/log/metric/audit |  |

## 4. Tasks

| Task | Increment | Goal | Depends on | Risk | Next step | Verification hint | Review hint |
|---|---|---|---|---|---|---|---|

## 5. Sequence

- First stabilize:
- Then implement:
- Then harden:
- Parallelizable:
- Blocked by:

## 6. Audit summary

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
