# Evaluation contract

This maintainer-facing note keeps the non-runtime rationale behind the retrospective skill's
quality checks. It complements executable tests; it does not replace them.

## Purpose

- preserve the minimal quality scenarios that define whether the skill still works;
- explain why those scenarios were chosen for regression coverage;
- keep a visible backlog for future regression fixtures.

## Minimal quality scenarios

1. Given a session JSONL plus implementation-stage logs, the toolchain should still produce:
   - an evidence manifest;
   - a candidate incident register;
   - a dedicated skill-friction section or draft;
   - logging-improvement recommendations.
2. When the session trace is missing, the reports should explicitly downgrade confidence instead of
   fabricating trace-derived timing.
3. When a stage log omits review artifacts, the logging review should call out the observability gap
   and avoid inventing review history.
4. When a trace contains a compacted event with available raw trace and zero parse errors, the
   report should treat it as an agent-context factor, not as a data-quality limitation.
5. When operational trace evidence reports a non-PASS review without matching immutable review
   artifacts, the scan should keep the signal lower-quality, mark aggregate review metrics
   incomplete, and ignore copied issue or instruction text that merely discusses FAIL fixtures.

## Future regression fixtures

- richer multi-feature session traces;
- logs with structured `skills_used` arrays;
- traces with repeated rerounds and long silent spans;
- logs that include machine-readable incident ids for cross-checking.
