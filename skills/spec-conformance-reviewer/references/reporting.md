# Reporting Rules

Use findings and verdicts that can be traced back to specific requirements.

Begin every result with one plain-language outcome sentence that states which requirement failures are closed, which remain, and what the reviewed boundary can now claim. Place formal requirement statuses and verdict terminology after that sentence.

## Requirement Statuses

| Status | Use for |
|---|---|
| `fulfilled` | enough evidence shows the requirement is implemented completely |
| `partially_fulfilled` | evidence proves some required observable behavior, but required branches, constraints, or side effects are absent |
| `not_fulfilled` | the complete reviewed implementation contradicts the requirement or visibly omits mandatory behavior |
| `cannot_determine` | the relevant implementation or enforcement surface is incomplete or unavailable, so current evidence cannot support a responsible conclusion |
| `not_applicable` | the requirement is outside the review scope |
| `ambiguous_spec` | the sources do not define the expected behavior clearly enough |

## Finding Severity

| Severity | Use for |
|---|---|
| `critical` | mandatory requirement failure causing broken user behavior, data loss, contract breakage, invalid state, or unsafe rollout |
| `major` | significant deviation from the spec that breaks one or more mandatory branches |
| `minor` | partial coverage, local inconsistency, missing edge-case handling, or limited contract mismatch |
| `note` | non-blocking ambiguity, evidence gap, or risk that does not prove non-compliance on its own |

## Policy/Admission Reporting

Use these rules only for reviews that have a normative policy/admission trigger.

- Missing explicit DENY, refusal, or no-invocation behavior is `not_fulfilled` only when the spec requires explicit admission/refusal semantics.
- Missing implementation evidence for a required matrix row is `cannot_determine` when the evidence surface is incomplete, and `not_fulfilled` when the reviewed implementation visibly omits or contradicts the requirement.
- Missing matrix coverage from an under-specified source is `ambiguous_spec`, `cannot_determine`, or a verification gap, not a spec violation.
- Unsupported or unhealthy downstream, replay/idempotency, activation conflict, and persistence-failure rows are in scope only when tied to a requirement basis or contract.
- Security exploitability findings belong to `security-reviewer` unless the normative source itself defines the security behavior being checked.
- General merge-risk findings belong to `code-reviewer` unless they are direct evidence of spec non-compliance.

Policy/admission findings should cite both a requirement ID and a matrix row. If the row is derived, state the derivation and confidence explicitly.

## Final Verdicts

| Verdict | Use for |
|---|---|
| `compliant` | every mandatory in-scope requirement is `fulfilled`, no mandatory ambiguity or unknown evidence remains, and evidence reaches each claimed enforcement boundary |
| `compliant with minor gaps` | every mandatory in-scope requirement is `fulfilled`; remaining gaps affect only `should`, optional, or non-blocking evidence that cannot change the claimed capability |
| `partially compliant` | one or more mandatory requirements are `partially_fulfilled`, no mandatory requirement is `not_fulfilled`, and evidence confirms meaningful required behavior |
| `non-compliant` | one or more mandatory requirements are `not_fulfilled`; fulfilled behavior and unresolved coverage limits remain visible but do not weaken this verdict |
| `cannot determine due to missing or conflicting normative basis` | an unresolved authority, missing normative input, or ambiguous mandatory requirement prevents a reliable verdict |
| `cannot determine due to insufficient implementation evidence` | no confirmed mandatory violation is enough to decide the result, but one or more mandatory requirements are `cannot_determine` because the enforcement surface is incomplete or unavailable |

## Verdict Aggregation

Apply these rules instead of choosing a verdict by general impression:

1. If the implementation or normative-source snapshot moves, stop and report the review as blocked; do not issue a conformance verdict for the stale identity.
2. If any mandatory requirement is `not_fulfilled`, use `non-compliant`. Otherwise, if one or more mandatory requirements are `partially_fulfilled`, use `partially compliant`. Preserve fulfilled behavior, every unresolved ambiguity, and every evidence gap as coverage information.
3. If no confirmed mandatory violation determines the result and any mandatory requirement is `ambiguous_spec`, use `cannot determine due to missing or conflicting normative basis`.
4. If no confirmed mandatory violation determines the result and any mandatory requirement is `cannot_determine`, use `cannot determine due to insufficient implementation evidence`.
5. Use `compliant` or `compliant with minor gaps` only when every mandatory requirement is `fulfilled`. Minor gaps cannot hide uncertainty about the claimed runtime or user-visible capability.

When confirmed deviations and unknown requirements coexist, report the established negative verdict and state that coverage is incomplete. Never translate unknown evidence into `partially compliant`.

## Report Structure

Use the full structure when the user asks for a formal report or when the review is broad:

1. Executive Summary
2. Review Basis, Scope, and Sources
3. Requirement Extraction
4. Traceability Matrix
5. Findings
6. Verification Gaps and Routed Observations
7. Final Verdict and Handoff

## Markdown Template

```md
# Spec Compliance Review

Outcome: <plain-language statement of what is closed, what remains, and what the reviewed boundary can claim>

## 1. Executive Summary
- Scope:
- Implementation snapshot:
- Normative sources:
- Verdict:
- Key blockers:
- Analysis limitations:

## 2. Review Basis, Scope, and Sources
### 2.1 Snapshot and invalidation rule
- Implementation identity:
- Review mode and base:
- Invalidation condition:

### 2.2 Normative inputs and authority
| Source identity | Owner | Approval/version | Applicability | Authority basis |
|---|---|---|---|---|

### 2.3 Implementation inputs
- ...

### 2.4 Out of scope and blocked inputs
- ...

## 3. Requirement Extraction
| ID | Type | Source | Requirement | Modality | Origin | Derivation/confidence | Notes |
|---|---|---|---|---|---|---|---|

## 4. Traceability Matrix
| Requirement ID | Requirement | Observed or Missing Implementation Surface | Test Evidence | Status | Notes |
|---|---|---|---|---|---|

## 5. Findings
### F-1: <Title>
- Severity:
- Requirement IDs:
- Spec basis:
- Implementation evidence:
- Impact:
- Recommendation: bounded correction or root-cause investigation
- Confidence:

## 6. Verification Gaps and Routed Observations
- ...

## 7. Final Verdict and Handoff
- Status:
- Rationale:
- Coverage limitations:
- Clarification owner:
- Remediation owner:
```

## Wording Rules

- Keep every serious finding tied to a requirement ID and source.
- Separate non-compliance from missing proof.
- Call out conflicting sources explicitly; do not pick a winner silently.
- State why each normative source is authoritative; artifact type alone is not an authority argument.
- If the implementation adds behavior with no requirement basis, label it as unspecified behavior, spec divergence, or contract drift.
- If confidence depends on inference instead of direct text, say so explicitly.
- Do not call a requirement fulfilled when the only evidence is schema/route/contract presence, a mock success path, an in-memory test, documentation, or an audit event name without capture semantics.
- Do not use `partially_fulfilled` when only substrate exists; require evidence for some observable portion of the broader requirement.
- When mocks or in-memory stores are the only tests for a production persistence/RLS/RPC/provider boundary, report a verification gap unless the normative requirement is limited to the mocked layer.
- Avoid vague language such as "looks wrong" or "should probably".
- In remediation re-audit, report fixed findings and adjacent regression coverage; list unchanged previously verified requirements as excluded instead of repeating their full analysis.
- Do not treat a cosmetic diff as closure evidence for an original behavioral failure path.
- If a follow-up review repeats the same or a materially related blocking deviation after remediation, require root-cause investigation before more fixes.

## Minimal Self-Check

- stable implementation and normative-source identities recorded
- normative source authority, approval, applicability, and supersession checked
- requirements extracted explicitly
- modality and origin recorded separately; derived mandatory requirements remain `must`
- requirement-to-code traceability preserved
- findings cite requirement basis and evidence
- ambiguity and missing evidence separated from violations
- edge cases and error paths checked when normative
- policy/admission rows have normative basis before they affect the verdict
- tests evaluated as evidence at the claimed boundary, not counted superficially
- mandatory ambiguity or unknown evidence prevents both compliant verdicts
- verdict derived from the aggregation rules, not from general impression
- review remained read-only and the snapshot did not move
