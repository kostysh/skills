# Severity and Confidence

Severity answers "how bad if true." Confidence answers "how sure am I that it is true."

## Severity

| Label | Meaning |
|---|---|
| `[blocking]` | likely bug, regression, data risk, operational hazard, or missing merge-critical test |
| `[important]` | meaningful weakness worth fixing soon, but not clearly merge-blocking |
| `[nit]` | local cleanup or clarity suggestion |
| `[question]` | unresolved design or verification question |

## Confidence

| Level | Meaning | Default action |
|---|---|---|
| High | evidence in the changed scope is strong | emit as a finding |
| Medium | real concern, but one link is unclear | ask a question or note an assumption |
| Low | mostly speculative | drop it |

## Downgrade Rules

Downgrade from finding to question when:

- the code path may already be guarded elsewhere
- a missing test might exist outside the touched scope
- the behavior depends on unstated runtime assumptions
- the impact is real but the changed code may not be the source
