# Security Review Methodology

Use this file for the common workflow, regardless of stack.

## Review Basis and Input Contract

Select one mode before analysis:

- `targeted`: bounded review of an identifiable diff, file set, snippet, or security-sensitive path; never emits PASS;
- `formal`: scoped audit with an explicit status and reproducible coverage;
- `re-audit`: verification of prior findings against a new stable snapshot.

Record or derive:

1. stable target identity: commit, base/head diff, aggregate content hash, or exact supplied artifact;
2. report scope and any wider research scope used only to confirm or clear findings;
3. actors, assets, trust boundaries, and allowed attacker capabilities;
4. authoritative requirements, documented exceptions, and project-specific security contracts;
5. available runtime, deployment, configuration, test, and boundary evidence;
6. prior findings and remediation evidence for `re-audit`.

The default external-attacker model is an exploration hypothesis, not authority for a project-specific requirement. Do not invent an actor, deployment control, compliance requirement, or application contract that the available sources do not establish.

Use `BLOCKED` when the target or snapshot is unavailable, moving, or internally conflicting enough that conclusions are not reproducible. Use `INCOMPLETE` when the review can proceed but mandatory coverage or evidence for the requested formal assurance is absent. Missing evidence alone is not `FAIL`.

## Review Standard

Report only findings that survive all of these checks:

1. **Attacker control**: the attacker controls input, identity, trigger, or reachable code path.
2. **Reachability**: the vulnerable path can actually execute in the reviewed context.
3. **Mitigation check**: no surrounding validation, escaping, parameterization, access control, or deployment boundary already neutralizes it.
4. **Impact**: the outcome matters for confidentiality, integrity, availability, or privilege.

If any link is weak, downgrade the concern.

Do not infer helper, middleware, client, role, or credential semantics from names such as `requireUser`, `adminClient`, `safeQuery`, or `validated`. Absence of a control in a supplied snippet or diff is not proof that the control is absent from the reachable path unless the supplied scope establishes the path is complete or surrounding definitions were inspected. Keep the item in `needs verification` when unseen middleware, client construction, schema, policy, or downstream authorization can decide exploitability.

For policy-governance admission surfaces, security-relevant operator/control-plane impact can satisfy the impact side of a finding only when the review explicitly states the actor and control path.

## Surface Discovery

Before finalizing a review or audit, identify which of these surfaces are in scope:

- backend request handlers, jobs, and worker code
- frontend browser code, rendered templates, and client-side state
- browser durable storage such as IndexedDB, `localStorage`, and `sessionStorage`
- auth, sessions, cookies, and identity boundaries
- telemetry, logging, and error-reporting flows
- CI, release, and automation paths
- data plane and privilege boundaries such as SQL, RLS, grants, or storage policies
- server-side data-access construction such as REST/PostgREST filters, SDK query builders, RPC args, storage keys, search filters, or service-role paths
- direct data-access authorization such as RLS helper functions, RPC identity checks, service-role store methods, storage policies, and user-JWT PostgREST behavior
- required audit/security event capture paths, including same-transaction failure behavior or durable fallback where required
- inbound or outbound integrations such as webhooks, callbacks, and URL fetchers
- policy-governance admission gates for external invocation, executable approval capability, policy activation, active-scope selection, governance/audit persistence preconditions, fail-closed decisions, stored `allowed` replay, conflict replay, authority binding, or security-relevant replay/idempotency controls

If both frontend and backend exist, inspect both before claiming the review is complete.

## Audit Order Template

For an explicit formal audit, use this order unless the user gives a narrower scope. When a dedicated security scan orchestrator owns repository traversal, do not run a parallel scan; consume its resolved scope and artifacts instead.

1. Entrypoints, deployment config, trust-boundary assumptions, and environment handling.
2. Auth, session, cookie, and privilege transitions.
3. Attacker-controlled input reaching sensitive sinks or missing permission checks.
4. Server-side data-access construction and direct authorization: raw SQL, REST/PostgREST URLs, SDK query builders, RPC args, storage/search keys, user-JWT RLS/RPC behavior, and service-role paths.
5. Browser durable storage and telemetry/error reporting: credential/session material, sensitive or authoritative identity/provider/network data, exposure and access controls, retention, redaction, sentinel payload behavior, and negative API tests.
6. CSRF refresh/reissue when present: selected synchronizer, signed double-submit, or other accepted pattern; session binding, Origin/CORS and request validation, response leakage, pending-session scope, and rotation atomicity only when the stateful contract requires rotation.
7. File handling, redirects, outbound requests, and integration boundaries.
8. Policy-governance admission when the trigger is present: deny/no-invocation, failed/conflicting persistence, historical replay versus current executable capability, conflict replay, freshness authority, evidence identity, release/runtime/deployment binding, activation races, and audit sufficiency.
9. CI, automation, secrets exposure, and supply chain paths.
10. Stack-specific deep dives through `references/domain-handoffs.md` when implementation details change exploitability.

## Confidence Rubric

| Level | Meaning | Action |
|---|---|---|
| HIGH | full exploit chain or missing control is demonstrated from the reviewed code | report |
| MEDIUM | strong signal, but one trust-boundary or mitigation question is unresolved | "needs verification" only |
| LOW | theoretical, cosmetic, or obviously mitigated | do not report |

## Evidence Checklist

For every reported finding, prove:

- where attacker-controlled data comes from
- where it reaches a dangerous sink or missing permission check
- why framework defaults do not already make it safe
- which middleware, helper, client construction, schema, policy, and downstream guard definitions were inspected when their behavior decides the path
- what attacker outcome becomes possible
- what assumption still depends on runtime, edge, or deployment config if the repo does not show it

Source-text tests, source-grep checks, and absence/presence string checks are not security evidence by themselves. Use behavioral tests, sentinel payloads, negative API tests, or runtime traces that exercise the control.

Tests, fixtures, generated reports, and compiler success can prove their own structural or exercised contract only. They do not establish complete security review behavior or a real production boundary unless the tested path reaches that boundary under the claimed conditions.

## Common False Positives

Do not flag these without stronger context:

- constants or deployment config treated as attacker-controlled
- framework-autoescaped template output
- parameterized ORM or query builder usage
- security semantics inferred only from helper, middleware, role, or client names
- a missing check inferred only from its absence in a partial snippet or diff while a reachable surrounding layer remains unseen
- privileged-only flows where the same privilege is required to exploit the path
- test-only helpers or dead code
- missing TLS or `Secure` cookies in obviously local or non-HTTPS development setups

## Uncertainty and Overrides

- If a protection may live at the edge, reverse proxy, platform config, or runtime environment, say `not visible in reviewed code; verify at runtime/config`.
- If the project intentionally deviates from a best practice, check whether the deviation still leaves an exploit path. Report the exploit path, not the policy disagreement.
- If you cannot confirm exploitability because a stack-specific detail is missing, keep it in `needs verification` and hand off through `references/domain-handoffs.md`.

## Status and Ownership Contract

Use these formal statuses exactly:

| Status | Required condition |
|---|---|
| `FAIL` | At least one confirmed, reachable, in-scope security finding survives mitigation checks. |
| `PASS (scoped)` | The named stable security-review scope has complete required coverage and evidence, with no confirmed findings. |
| `INCOMPLETE` | Analysis ran, but mandatory scope, surfaces, or evidence for the requested assurance remain missing. |
| `BLOCKED` | The target, snapshot, or indispensable authority is unavailable, unstable, or irreconcilably conflicting. |

Rules:

- Targeted review reports confirmed findings, needs verification, or `no confirmed findings in reviewed scope`; it never emits PASS.
- `PASS (scoped)` does not imply whole-system security, penetration testing, SAST/DAST, dependency scanning, exhaustive repository coverage, or any standards-compliance status.
- ASVS and other implementation-to-control-set mapping, control fulfillment, and compliance verdicts belong to `spec-conformance-reviewer` whether or not a complete versioned control set is supplied. This skill may contribute exploitability findings and evidence limits, but must not issue per-control pass/fail or the compliance status.
- `security-reviewer` does not issue an overall merge recommendation. Send confirmed security blockers and residual risk to `code-reviewer`, which owns the merge decision.
- Review is read-only by default. A domain or implementation owner applies authorized remediation; this skill re-audits the new stable snapshot.

## Default Output

```markdown
[Review basis: target/snapshot and report scope]

[high] `path/to/file.ts:42` Short title
Confidence: HIGH
Impact: what an attacker gains
Evidence: attacker input -> vulnerable path -> effect
Fix: the safest remediation direction

Needs verification
- unresolved fact and the owner/evidence that can close it

Result: confirmed findings | no confirmed findings in reviewed scope
Evidence limits: untested or unavailable boundary
```

## Formal Audit Output

For an explicit audit or report, prefer:

```markdown
Executive summary
- Mode, stable target/snapshot, report scope, research scope, actors, and top risks

Confirmed findings
[critical] SR-001 `path/to/file.ts:42` Short title
Confidence: HIGH
Impact: what an attacker gains
Evidence: attacker input -> vulnerable path -> effect
Fix: the safest remediation direction

Needs verification
- `path/to/file.ts:99` What remains unclear and what to verify

Reviewed and cleared
- Only surfaces cleared by named code, configuration, behavioral, or boundary evidence

Uninspected surfaces and residual risk
- Missing surface/evidence and why it limits the result

Data-access construction reviewed
- State whether raw SQL, REST/PostgREST, SDK query builders, RPC, and service-role paths were inspected, or explicitly say they were out of scope.

Status: FAIL | PASS (scoped) | INCOMPLETE | BLOCKED
Evidence limits: What this status does not prove
Next owner: Domain fact, implementation, spec-conformance, scan orchestration, or merge decision owner
```

For re-audit, add `prior finding -> current change -> evidence -> status`, re-run the original attack path and adjacent regression surface, and tie the result to the new snapshot.

## Review Close-Out

Before finalizing:

- ensure the reviewed surfaces are clear from the response
- ensure the mode, stable target, report scope, research scope, actors, authoritative inputs, and evidence limits are explicit
- for formal audits that include backend/database code, name whether raw SQL, REST/PostgREST, SDK query builders, RPC, and service-role paths were inspected
- ensure all reported findings are high confidence
- ensure each finding names a concrete attacker outcome
- drop anything that is really just a best-practice suggestion
- keep medium-confidence items separate from confirmed findings
- say what must still be verified at runtime if that affects confidence
- do not claim storage, telemetry, or CSRF protection is verified from source-text tests alone
- do not use `FAIL` for missing evidence, issue PASS in targeted mode, or make an overall merge recommendation
- invalidate the result if the reviewed code, configuration, runtime contract, tests, or evidence changed after the recorded snapshot
