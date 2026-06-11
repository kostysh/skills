# Reporting Rules

Use findings and verdicts that can be traced back to specific requirements.

## Requirement Statuses

| Status | Use for |
|---|---|
| `fulfilled` | enough evidence shows the requirement is implemented completely |
| `partially_fulfilled` | some required behavior exists, but branches, constraints, or side effects are missing |
| `not_fulfilled` | the implementation contradicts the requirement or omits mandatory behavior |
| `cannot_determine` | current evidence is not enough for a responsible conclusion |
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
| `compliant` | all mandatory in-scope requirements are covered and no critical or major deviations remain |
| `compliant with minor gaps` | core requirements are met but minor gaps or limited verification issues remain |
| `partially compliant` | some requirements are met, but there are major gaps or partial implementations |
| `non-compliant` | key mandatory requirements are violated |
| `cannot determine due to missing or conflicting spec` | the normative basis is incomplete or contradictory enough that a reliable verdict is blocked |

## Report Structure

Use the full structure when the user asks for a formal report or when the review is broad:

1. Executive Summary
2. Scope and Sources
3. Requirement Extraction
4. Traceability Matrix
5. Findings
6. Verification Gaps
7. Final Verdict

## Markdown Template

```md
# Spec Compliance Review

## 1. Executive Summary
- Scope:
- Normative sources:
- Verdict:
- Key blockers:
- Analysis limitations:

## 2. Scope and Sources
### 2.1 Normative inputs
- ...

### 2.2 Implementation inputs
- ...

### 2.3 Out of scope
- ...

## 3. Requirement Extraction
| ID | Type | Source | Requirement | Priority | Notes |
|---|---|---|---|---|---|

## 4. Traceability Matrix
| Requirement ID | Requirement | Implementation Evidence | Test Evidence | Status | Notes |
|---|---|---|---|---|---|

## 5. Findings
### F-1: <Title>
- Severity:
- Requirement IDs:
- Spec basis:
- Implementation evidence:
- Impact:
- Recommendation:
- Confidence:

## 6. Verification Gaps
- ...

## 7. Final Verdict
- Status:
- Rationale:
```

## Wording Rules

- Keep every serious finding tied to a requirement ID and source.
- Separate non-compliance from missing proof.
- Call out conflicting sources explicitly; do not pick a winner silently.
- If the implementation adds behavior with no requirement basis, label it as unspecified behavior, spec divergence, or contract drift.
- If confidence depends on inference instead of direct text, say so explicitly.
- Do not call a requirement fulfilled when the only evidence is schema/route/contract presence, a mock success path, an in-memory test, documentation, or an audit event name without capture semantics.
- When mocks or in-memory stores are the only tests for a production persistence/RLS/RPC/provider boundary, report a verification gap unless the normative requirement is limited to the mocked layer.
- Avoid vague language such as "looks wrong" or "should probably".

## Minimal Self-Check

- normative sources listed
- requirements extracted explicitly
- requirement-to-code traceability preserved
- findings cite requirement basis and evidence
- ambiguity and missing evidence separated from violations
- edge cases and error paths checked when normative
- policy/admission rows have normative basis before they affect the verdict
- tests evaluated as proof, not counted superficially
- verdict derived from requirement coverage, not from general impression
