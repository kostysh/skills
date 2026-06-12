# Security Review Methodology

Use this file for the common workflow, regardless of stack.

## Review Standard

Report only findings that survive all of these checks:

1. **Attacker control**: the attacker controls input, identity, trigger, or reachable code path.
2. **Reachability**: the vulnerable path can actually execute in the reviewed context.
3. **Mitigation check**: no surrounding validation, escaping, parameterization, access control, or deployment boundary already neutralizes it.
4. **Impact**: the outcome matters for confidentiality, integrity, availability, or privilege.

If any link is weak, downgrade the concern.

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

For an explicit scan or report, use this order unless the user gives a narrower scope:

1. Entrypoints, deployment config, trust-boundary assumptions, and environment handling.
2. Auth, session, cookie, and privilege transitions.
3. Attacker-controlled input reaching sensitive sinks or missing permission checks.
4. Server-side data-access construction and direct authorization: raw SQL, REST/PostgREST URLs, SDK query builders, RPC args, storage/search keys, user-JWT RLS/RPC behavior, and service-role paths.
5. Browser durable storage and telemetry/error reporting: OTP/CSRF/session/identity storage, raw network envelope leaks, redaction, sentinel payload behavior, and negative API tests.
6. CSRF refresh/reissue when present: valid cookie boundary, Origin/CORS, rate/admission, session freshness, rotation atomicity, no JWT/session/cookie in response body, and pending-session scope.
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
- what attacker outcome becomes possible
- what assumption still depends on runtime, edge, or deployment config if the repo does not show it

Source-text tests, source-grep checks, and absence/presence string checks are not security evidence by themselves. Use behavioral tests, sentinel payloads, negative API tests, or runtime traces that exercise the control.

## Common False Positives

Do not flag these without stronger context:

- constants or deployment config treated as attacker-controlled
- framework-autoescaped template output
- parameterized ORM or query builder usage
- privileged-only flows where the same privilege is required to exploit the path
- test-only helpers or dead code
- missing TLS or `Secure` cookies in obviously local or non-HTTPS development setups

## Uncertainty and Overrides

- If a protection may live at the edge, reverse proxy, platform config, or runtime environment, say `not visible in reviewed code; verify at runtime/config`.
- If the project intentionally deviates from a best practice, check whether the deviation still leaves an exploit path. Report the exploit path, not the policy disagreement.
- If you cannot confirm exploitability because a stack-specific detail is missing, keep it in `needs verification` and hand off through `references/domain-handoffs.md`.

## Default Output

```markdown
[high] `path/to/file.ts:42` Short title
Confidence: HIGH
Impact: what an attacker gains
Evidence: attacker input -> vulnerable path -> effect
Fix: the safest remediation direction
```

If needed:

```markdown
Needs verification
- `path/to/file.ts:99` Short note on what remains unclear
```

## Formal Audit Output

For an explicit audit or report, prefer:

```markdown
Executive summary
- Brief statement of the reviewed scope and top risks

Confirmed findings
[critical] SR-001 `path/to/file.ts:42` Short title
Confidence: HIGH
Impact: what an attacker gains
Evidence: attacker input -> vulnerable path -> effect
Fix: the safest remediation direction

Needs verification
- `path/to/file.ts:99` What remains unclear and what to verify

Reviewed and cleared
- Short list of high-risk surfaces inspected but not reported

Data-access construction reviewed
- State whether raw SQL, REST/PostgREST, SDK query builders, RPC, and service-role paths were inspected, or explicitly say they were out of scope.
```

## Review Close-Out

Before finalizing:

- ensure the reviewed surfaces are clear from the response
- for formal audits that include backend/database code, name whether raw SQL, REST/PostgREST, SDK query builders, RPC, and service-role paths were inspected
- ensure all reported findings are high confidence
- ensure each finding names a concrete attacker outcome
- drop anything that is really just a best-practice suggestion
- keep medium-confidence items separate from confirmed findings
- say what must still be verified at runtime if that affects confidence
- do not claim storage, telemetry, or CSRF protection is verified from source-text tests alone
