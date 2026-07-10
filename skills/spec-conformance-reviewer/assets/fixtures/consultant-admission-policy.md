# Review Fixture: Consultant Admission Policy

This is a portable worked regression oracle for `spec-conformance-reviewer`. It is not a real product specification, a blind forward-test, or independent behavioral evidence. Blind evaluation must use a different raw scenario without exposing the expected extraction or classification.

## Normative Source

Feature `CONSULTANT-ADMISSION-001` defines the consultant admission decision for a request.

Mandatory requirements:

- A consultant request may be admitted only when the request has a signed approval artifact for the same consultant and scope.
- The approval artifact must include `signed_at`, and `signed_at` must be no older than 24 hours at decision time.
- When admission is allowed, the system must persist decision `ADMITTED` before invoking the external consultant.
- When the approval artifact explicitly denies the consultant, the system must persist decision `DENIED` with a refusal code and must not invoke the external consultant.
- When the approval artifact is missing, ambiguous, missing `signed_at`, or stale, the system must persist decision `REFUSED` with a refusal code and must not invoke the external consultant.

The source does not define unsupported consultant types, downstream health, duplicate request ids, activation conflicts, or persistence-failure recovery.

## Sample Implementation Evidence

```text
decide(request):
  if request.approval.status == "approved":
    invokeConsultant(request.consultant_id)
    persist("ADMITTED")
    return "ADMITTED"

  if request.approval.status == "denied":
    return "DENIED"

  return "REFUSED"
```

```text
tests:
  admits approved request
  refuses missing approval
```

## Expected Extraction

| Requirement ID | Requirement | Matrix row |
|---|---|---|
| CAD-001 | Admit only same-consultant, same-scope signed approval evidence | explicit allow |
| CAD-002 | Require `signed_at` no older than 24 hours | stale evidence or missing freshness timestamp |
| CAD-003 | Persist `ADMITTED` before external invocation | explicit allow |
| CAD-004 | Explicit denial persists `DENIED` with refusal code and no invocation | explicit deny / refusal / no invocation |
| CAD-005 | Missing, ambiguous, missing-freshness, or stale evidence persists `REFUSED` with refusal code and no invocation | missing and ambiguous admission evidence; stale evidence |

## Expected Classification

- `CAD-001`: `partially_fulfilled` or `cannot_determine`; same-consultant and same-scope checks are not visible.
- `CAD-002`: `not_fulfilled`; no `signed_at` or 24-hour freshness check is visible.
- `CAD-003`: `not_fulfilled`; invocation happens before persistence.
- `CAD-004`: `not_fulfilled`; denial returns without persisted decision, refusal code, or no-invocation evidence.
- `CAD-005`: `partially_fulfilled`; missing approval returns refused, but no persistence, refusal code, ambiguous evidence, missing freshness, or stale branch is visible.

Rows for unsupported downstream, unhealthy downstream, duplicate request id, activation conflict, and persistence-failure recovery should not become non-compliance findings for this fixture. The source explicitly leaves them undefined, so classify them as out of scope, `ambiguous_spec`, or verification gaps if implementation evidence raises them.
