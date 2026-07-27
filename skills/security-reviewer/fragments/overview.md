Find exploitable security weaknesses without turning every suspicious pattern into a finding. The observable capability is a reproducible, bounded review result tied to a stable target, explicit coverage, traced attack paths, and calibrated evidence. Files, compiler output, grep results, fixtures, mocks, and green tests are supporting substrate unless they exercise the security boundary being claimed.

## Non-Goals

- Do not turn this into a generic code-quality reviewer.
- Do not embed framework implementation playbooks that already belong to domain skills.
- Do not author final Hono middleware designs, Supabase policies, or Cloudflare configuration from this skill alone.
- Do not present this skill as penetration testing, SAST/DAST, dependency scanning, exhaustive repository traversal, or standards compliance. Even when a versioned control set is supplied, `spec-conformance-reviewer` owns control fulfillment and compliance status; this skill contributes only exploitability findings and evidence limits.

## Non-Negotiables

- Research before reporting. Do not flag issues from pattern matching alone.
- Trace attacker-controlled input, identity, or code execution path to the sink or missing control.
- Check surrounding code for mitigations, validation, framework defaults, and trust boundaries.
- Distinguish attacker-controlled data from server-controlled config, constants, and operator-managed settings.
- For auth/RBAC/RLS reviews, inspect both HTTP/API admission + service logic and direct data-access paths such as PostgREST, RPC, RLS helpers/policies, storage, and service-role store methods; do not accept API-only evidence as proof of database-path safety.
- For session or active-context authorization, check freshness claims across layers: session id/version, active context id/version, active role, active scope/tenant, account/session/role status, and profile/readiness gates when permissions depend on them.
- Treat service-role access as privileged. Ordinary user reads/writes should use user JWT, RLS, or security-checked RPC unless a documented internal/admin/secret boundary requires privileged credentials.
- Report HIGH confidence findings by default. MEDIUM confidence items belong in a separate "needs verification" section only when they materially affect next steps.
- Do not report LOW confidence, purely theoretical, dead-code, comment-only, or test-only issues unless the user explicitly asks.

## Default Threat Model

Unless the user gives a different one, assume:

- external attacker
- no repository write access
- no privileged production shell access
- can send requests, open accounts, submit forms, upload files, open pull requests from forks, post public comments, and replay network traffic they control

Adjust the threat model explicitly if the code is internal-only or requires trusted operator access.

## Operating Modes

- Targeted review is the default. Load only the references needed for the identified surface, report only high-confidence findings, and never issue PASS.
- Formal audit or report mode applies only when the user explicitly asks for it and the target, snapshot, scope, and requested assurance can be established. Enumerate applicable surfaces, assign stable finding IDs, and use the formal status contract from `references/methodology.md`.
- Re-audit mode checks prior findings against a new stable snapshot and current evidence without editing the target.

## Fast Workflow

1. Identify the reviewed surfaces and stack before judging findings:
   - backend request handlers, jobs, and workers
   - frontend browser code and client-side rendering paths
   - browser durable storage such as IndexedDB, `localStorage`, and `sessionStorage`
   - auth, sessions, cookies, and identity boundaries
   - telemetry, logging, and error-reporting paths
   - CI, release automation, and supply chain paths
   - storage, data plane, and database privilege boundaries
   - inbound and outbound integrations such as webhooks and URL fetchers
2. Apply the auth-admission early checkpoint during planning, early implementation framing, or the first review pass when a slice changes protected route admission, replay/idempotency controls, pre-auth resource consumption, or closely related authorization-boundary handling:
   - identify the route trust boundary and the admission middleware that protects it
   - compare pre-auth versus post-auth resource consumption, including body parsing and expensive lookups
   - state replay/idempotency expectations and quota/key isolation when they are relevant
   - require bounded request-body handling on high-risk routes before untrusted body reads
   - keep this checkpoint bounded to route admission; do not turn it into a generic security planning framework
3. Apply the policy-governance admission checkpoint only when a slice gates external consultant/tool invocation, admission/approval executable capability, policy profile activation, active-scope selection, governance/audit persistence preconditions, fail-closed policy gates, or replay/idempotency controls around security-relevant decisions:
   - keep this checkpoint distinct from route auth-admission; it covers policy/control-plane admission rather than HTTP route admission
   - load `references/policy-governance-admission.md` for the bounded checklist
   - check explicit deny/no-invocation, failed or conflicting persistence before side effects, historical replay versus current executable capability, conflict replay, caller-controlled freshness/evidence refs, authority binding, activation races, and audit sufficiency
   - report only HIGH-confidence findings with a confirmed attacker/control path or security-relevant operator/control-plane impact; route non-security merge risks to `code-reviewer`
4. Classify the review scope and load only the needed references:
   - general methodology
   - API/auth/input
   - policy-governance admission
   - GitHub Actions
   - Supabase RLS
   - data-access injection
   - webhooks
   - secrets/config
   - domain handoffs when stack-specific behavior changes exploitability
5. Apply the data-access construction checkpoint when backend code reads/writes a database, uses REST/PostgREST, Supabase clients, RPC calls, service-role clients, query builders, or manually constructs URLs/filters.
   This checkpoint must enumerate attacker-controlled request/body/query/header/cookie values and persisted user-controlled values that reach data-access filters, select lists, RPC args, query-builder fragments, SQL fragments, storage keys, table/function/column names, or service-role calls.
6. Apply the browser storage and telemetry checkpoint when frontend code persists data or reports client errors:
   - never accept browser storage of passwords, OTP/recovery material, CSRF secrets, cookies, JWT/session IDs, refresh tokens, or equivalent credentials/session material
   - evaluate identity/provider/network payloads and telemetry fields by sensitivity, exposure, access control, retention, integrity/authority, and attacker impact rather than flagging field names alone
   - source-text checks are not evidence by themselves; require behavioral tests, sentinel payloads, or negative API tests for the claimed protection
7. For CSRF refresh/reissue reviews, first identify the documented synchronizer-token, signed double-submit, or other accepted pattern. Check session binding, secrecy, Origin/CORS and request validation, response leakage, and pending-session scope; require atomic rotation only when the selected stateful contract promises rotation.
8. For protected backend data paths, compare the route/service authorization with the direct data-access boundary:
   - user JWT/PostgREST/RPC/RLS behavior versus server API behavior
   - service-role reads for internal secrets/admin tasks versus ordinary user-scoped reads or mutations
   - stale or mismatched session/context/role/scope/status/readiness claims at RLS helper, RPC, and storage-policy boundaries
   - required audit/security events, including fail-closed same-transaction capture or durable fallback where the event is required
9. Map trust boundaries:
   - inputs
   - identities and roles
   - secrets and credentials
   - privileged actions
   - sensitive sinks
10. Trace the attack path:
   - entry point
   - attacker-controlled value
   - execution or authorization mechanism
   - impact
11. Verify mitigations:
   - validation or sanitization
   - framework escaping or parameterization
   - access controls
   - environment or deployment constraints
12. Classify confidence and severity.
13. Choose the output mode:
   - targeted findings in chat
   - formal audit sections with stable IDs
   - re-audit status for a remediated snapshot

## What Not to Flag by Default

- tests, fixtures, dead code, comments, or docs
- constants and server-controlled config values
- framework-protected patterns unless protections are disabled or bypassed
- authenticated-only actions where the reported exploit still requires the same privileged role you are treating as trusted
- defense-in-depth observations with no plausible exploit path
- local or dev-only HTTP usage without evidence that the same assumption reaches production

## Confidence Levels

| Level | Criteria | Action |
|---|---|---|
| HIGH | attacker control, reachability, and impact are confirmed | report as a finding |
| MEDIUM | a meaningful issue exists but one link still needs verification | keep in "needs verification" |
| LOW | theoretical, best-practice only, or clearly mitigated elsewhere | do not report |

## Severity Levels

| Severity | Use for |
|---|---|
| Critical | direct compromise, auth bypass, repo or production takeover, secret exfiltration, destructive write impact |
| High | exploitable with clear path and significant confidentiality, integrity, or availability impact |
| Medium | real weakness with narrower preconditions or reduced blast radius |
| Low | defense-in-depth only; usually do not report unless explicitly requested |

## Default Brevity Mode

Unless the user explicitly asks for a formal audit or report:

- use terse chat output
- do not narrate intermediate reasoning or review passes
- do not produce tables, matrices, executive summaries, or cleared-surfaces sections
- report all confirmed in-scope findings, but keep the output compressed
- make each finding short, behavior-based, and evidence-backed
- collapse duplicate symptoms into one root-cause finding where possible
- keep questions and assumptions to the minimum necessary for correctness

## Output Rules

- Start with one plain-language outcome sentence, then report findings ordered by severity.
- Use the format from `references/methodology.md`.
- Every reported finding must include:
  - location with line references when available
  - confidence
  - issue
  - impact
  - evidence
  - fix direction
  - what still needs runtime or infrastructure verification if uncertainty remains
- If useful, add a short "needs verification" section for medium-confidence items.
- Add a short "reviewed and cleared" section when it helps show what high-risk areas were inspected and rejected.
- In formal audit mode, add stable finding IDs and a short executive summary.
- Include the review basis, coverage, uninspected surfaces, residual risk, evidence limits, and the status defined by `references/methodology.md`.
- Never issue an overall merge recommendation; hand confirmed security blockers and residual risk to `code-reviewer`.
- In formal audit mode that includes backend/database code, include a short "data-access construction reviewed" note naming whether raw SQL, REST/PostgREST, SDK query builders, RPC, storage, RLS helper/policy, and service-role paths were inspected. Do not claim database security review is complete if server-side data-access construction or direct data-access authorization was not inspected.
- Do not cite source-text tests, source-grep tests, or presence/absence string checks as security evidence unless they are paired with behavioral tests, sentinel payloads, or negative API tests that exercise the protection.
- Write a markdown report only when the user asks for one or the repo expects an artifact.
- If nothing clears the bar, say so plainly instead of inventing issues.

## Project Overrides

- Respect explicit project rules and documented exceptions when they intentionally deviate from a best practice.
- Do not report a finding just because a pattern is non-ideal. Report it only when the override still leaves a plausible exploit path.
- If an override is necessary but undocumented, suggest documenting the rationale and compensating controls.

## Reference Map

Read `references/methodology.md` for every review, then load only the optional references whose triggers match the reviewed surface:

- `references/methodology.md` - confidence gating, surface discovery, audit order, uncertainty language, and report format
- `references/api-auth-input.md` - input validation, injection, authn, authz, CSRF, mass assignment, file handling checks, and detection hints
- `references/data-access-injection.md` - SQL, REST/PostgREST, SDK query-builder, RPC, storage, search, and service-role data-access construction checks
- `references/policy-governance-admission.md` - external invocation admission, approval gates that produce executable capability, policy activation, fail-closed governance gates, freshness, replay semantics, authority binding, and audit sufficiency checks
- `references/github-actions.md` - GitHub Actions threat model, attack classes, detection hints, and safe patterns
- `references/supabase-rls.md` - RLS, grants, privileged functions, RPC, and service-role review
- `references/webhooks.md` - signature verification, replay windows, raw body handling, idempotency, and reporting checks
- `references/secrets-config.md` - secrets, browser durable storage, telemetry/error reporting leaks, config trust boundaries, token scope, logging exposure, and dev-versus-prod nuance
- `references/domain-handoffs.md` - stack discovery and when to defer to domain skills for framework-specific detail
