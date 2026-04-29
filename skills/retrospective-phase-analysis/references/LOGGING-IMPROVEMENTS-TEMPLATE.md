# Logging improvements template

## Summary

- Logging quality overall:
- Highest-impact gaps:
- Which analyses were limited by telemetry:

## Findings

### Gap L-01
- Current behavior:
- Why it is insufficient:
- Example effect on retrospective quality:
- Proposed improvement:
- Priority:

## Existing mechanisms checked

Before proposing schema or log changes, check whether existing canonical artifacts, workflow sequencing, or prompt recipes already solve the issue.

| Mechanism | Checked? | Result | Remaining gap |
|---|---|---|---|

## Recommended schema changes

| Field or artifact | Why add/change it | Consumer | Priority |
|---|---|---|---|

Recommend schema/log expansion only when the existing mechanisms above are insufficient.

When review history is involved, distinguish producer and consumer ownership:

- UDE owns producer fields such as `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events`.
- RPA owns consumer behavior: source-quality labels, incomplete aggregate metrics, and fallback trace/prose extraction when producer fields are absent.
- Missing immutable non-PASS review artifacts should be recorded as telemetry gaps, not silently converted into structured truth.

## Recommended process changes

1.
2.
3.

## Recommended automation

- Validation checks:
- Auto-generated links:
- Derived metrics:
- Sidecar telemetry:
