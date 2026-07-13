# Quick Checklist

- authoritative target/base/scope resolved without guessing
- starting snapshot identity recorded and review kept read-only
- full diff read
- changed files accounted for
- spec or intent alignment checked when normative sources exist
- risky paths reviewed: auth, migrations, CI, tests, config
- policy/admission merge-risk pass run when changed files or intent touch gates, admission, persistence, active scope, idempotency, replay, or freshness
- runtime-gate deployed-path pass run when changed files or intent touch production construction, lifecycle wiring, request/tick path, invocation boundary, idempotency lock scope, or deployment/cell identity binding
- regressions checked
- test coverage checked
- compatibility checked
- available specialized authority loaded when needed, or the domain marked unassessed
- findings ordered by severity
- speculative comments removed or downgraded
- repeated related blocker after remediation routes to root-cause investigation before more fixes
- ending snapshot matches the starting identity
- evidence footer names scope, checks, limits, and exactly one recommendation status
