Find exploitable security weaknesses without turning every suspicious pattern into a finding. This skill owns threat model, confidence, exploitability, and security reporting discipline.

## When to Use

- "security review", "find vulnerabilities", "audit for OWASP issues"
- Reviewing authn, authz, session, token, secret, or permission changes
- Reviewing GitHub Actions, release workflows, or automation with secrets
- Reviewing Supabase RLS, grants, privileged functions, or service-role boundaries
- Reviewing app-layer data-access construction through REST/PostgREST, SDK query builders, RPC, storage, search, or service-role clients
- Reviewing webhook handlers, signature verification, replay protection, or idempotency
- Checking user-controlled input flowing into sensitive sinks

## When NOT to Use

- General code quality review without a security objective: use `code-reviewer`
- Pure framework implementation guidance: use the relevant domain skill
- UI or accessibility review: use `web-ui-reviewer`
- Pure shell portability or style review with no security angle: use the relevant engineering skill or tooling

## Skill Interop (Priority)

- This skill owns security threat model, confidence thresholds, exploitability checks, and vulnerability reporting.
- Domain skills own framework/runtime facts and remediation detail:
  - `hono-engineer`
  - `supabase-engineer`
  - `react-spa-engineer`
  - `react-components-engineer`
  - `node-engineer`
- `code-reviewer` owns non-security review flow and general merge-risk findings.
- If both skills are active, keep confirmed security findings under this skill and move non-security findings to `code-reviewer`.

## Non-Goals

- Do not turn this into a generic code-quality reviewer.
- Do not embed framework implementation playbooks that already belong to domain skills.
- Do not author final Hono middleware designs, Supabase policies, or Cloudflare configuration from this skill alone.

## Non-Negotiables

- Research before reporting. Do not flag issues from pattern matching alone.
- Trace attacker-controlled input, identity, or code execution path to the sink or missing control.
- Check surrounding code for mitigations, validation, framework defaults, and trust boundaries.
- Distinguish attacker-controlled data from server-controlled config, constants, and operator-managed settings.
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

- Targeted review is the default. Load only the references needed for the changed surface and report only high-confidence findings.
- Passive notice applies while editing nearby code. Mention only high-signal issues that are likely real and matter to the work in progress.
- Formal audit or report mode applies only when the user explicitly asks to scan, audit, or produce a report. In this mode, enumerate all relevant surfaces, use the audit order from `references/methodology.md`, assign stable finding IDs, and include line-referenced evidence.

## Fast Workflow

1. Identify the reviewed surfaces and stack before judging findings:
   - backend request handlers, jobs, and workers
   - frontend browser code and client-side rendering paths
   - auth, sessions, cookies, and identity boundaries
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
   This checkpoint must enumerate attacker-controlled request/body/query/header/cookie values and persisted user-controlled values that reach data-access filters, select lists, RPC args, SQL fragments, storage keys, or service-role calls.
6. Map trust boundaries:
   - inputs
   - identities and roles
   - secrets and credentials
   - privileged actions
   - sensitive sinks
7. Trace the attack path:
   - entry point
   - attacker-controlled value
   - execution or authorization mechanism
   - impact
8. Verify mitigations:
   - validation or sanitization
   - framework escaping or parameterization
   - access controls
   - environment or deployment constraints
9. Classify confidence and severity.
10. Choose the output mode:
   - targeted findings in chat
   - formal audit sections with stable IDs
   - remediation of one confirmed finding at a time

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

- Findings first, ordered by severity.
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
- In formal audit mode that includes backend/database code, include a short "data-access construction reviewed" note naming whether raw SQL, REST/PostgREST, SDK query builders, RPC, and service-role paths were inspected. Do not claim database security review is complete if server-side data-access construction was not inspected.
- Write a markdown report only when the user asks for one or the repo expects an artifact.
- If nothing clears the bar, say so plainly instead of inventing issues.

## Project Overrides

- Respect explicit project rules and documented exceptions when they intentionally deviate from a best practice.
- Do not report a finding just because a pattern is non-ideal. Report it only when the override still leaves a plausible exploit path.
- If an override is necessary but undocumented, suggest documenting the rationale and compensating controls.

## Remediation Rules

- Fix one confirmed finding at a time.
- Preserve expected behavior unless the security issue requires a breaking change. Call out that tradeoff before making it.
- Prefer narrow, auditable changes over broad rewrites.
- Follow the project's normal test and change flow so the security fix is likely to be accepted and kept.

## Reference Map

Read only what you need:

- `references/methodology.md` - confidence gating, surface discovery, audit order, uncertainty language, and report format
- `references/api-auth-input.md` - input validation, injection, authn, authz, CSRF, mass assignment, file handling checks, and detection hints
- `references/data-access-injection.md` - SQL, REST/PostgREST, SDK query-builder, RPC, storage, search, and service-role data-access construction checks
- `references/policy-governance-admission.md` - external invocation admission, approval gates that produce executable capability, policy activation, fail-closed governance gates, freshness, replay semantics, authority binding, and audit sufficiency checks
- `references/github-actions.md` - GitHub Actions threat model, attack classes, detection hints, and safe patterns
- `references/supabase-rls.md` - RLS, grants, privileged functions, RPC, and service-role review
- `references/webhooks.md` - signature verification, replay windows, raw body handling, idempotency, and reporting checks
- `references/secrets-config.md` - secrets, config trust boundaries, token scope, logging exposure, and dev-versus-prod nuance
- `references/domain-handoffs.md` - stack discovery and when to defer to domain skills for framework-specific detail
