---
name: security-reviewer
description: Perform bounded security review of code, CI, permissions, webhooks,
  secrets, data access, and config. Use for vulnerability review, exploitability
  triage, or scoped audits. Own threat modeling, confidence gating, attack
  paths, and findings—not scan orchestration, compliance, pentesting, or fixes.
metadata:
  source-version: 0.1.12
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: d4be3ce6e5451299a0376dfd19cb4040ed6e23a302be84cd839be47b746eed50
---

# security-reviewer

## Start here

1. Confirm the request is a bounded security review, exploitability triage, or scoped formal audit rather than implementation, standards compliance, or scan orchestration.
2. Read references/methodology.md, select targeted, formal, or re-audit mode, and establish a stable review basis before drawing conclusions.
3. Keep the review read-only by default; research exploitability before reporting and do not flag findings from pattern matching alone.
4. Load only the optional references triggered by the reviewed surfaces and state any missing evidence or residual risk.

## When to use this skill

- Targeted security review, vulnerability finding, or exploitability triage for an identifiable code or configuration scope.
- Authn, authz, sessions, tokens, secrets, permissions, webhooks, CI, Supabase RLS, app-layer data-access construction, or sensitive input-to-sink flows.
- Scoped formal security audit or remediation re-audit when the target, snapshot, and requested assurance can be established.

## When NOT to use this skill

- General non-security code quality review without a security objective.
- Implementing a fix or pure framework guidance owned by a domain or implementation skill.
- A full PR, repository, or deep multi-pass scan when a dedicated security scan orchestrator is available.
- ASVS or another standards-compliance verdict or implementation-to-control-set mapping, whether or not a versioned control set is supplied; route that work to spec-conformance-reviewer.
- UI, accessibility, shell portability, or style review with no security angle.

## Overview

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

## Workflow stages

### Workflow stage: Establish the review basis

Make the requested review reproducible and prevent a stronger conclusion than the available inputs support.

1. Record targeted, formal, or re-audit mode; the stable commit, diff, content hash, or exact supplied artifact; report scope; and wider research scope.
2. Identify actors, assets, trust boundaries, authoritative requirements or exceptions, available runtime/config evidence, and any prior findings.
3. Use the default threat model only as a labeled exploration hypothesis when project-specific authority is missing.
4. Return BLOCKED when the target or snapshot is unavailable or unstable; use INCOMPLETE when review can proceed but required coverage or evidence remains missing.

Validation:

- Another reviewer can reconstruct the target, snapshot, report scope, research scope, threat model, inputs, and evidence limitations.
- Missing evidence never becomes FAIL by itself, and absent authority never becomes an invented security requirement.

### Workflow stage: Analyze security paths

Find exploitable weaknesses with confidence gating and line-referenced evidence.

1. Identify reviewed surfaces, stack, trust boundaries, identities, secrets, privileged actions, and sensitive sinks.
2. Apply the bounded auth-admission checkpoint when route admission, replay, idempotency, or pre-auth resource use changes.
3. Apply the bounded policy-governance admission checkpoint only when external invocation, admission/approval executable capability, policy activation, active-scope selection, governance/audit preconditions, fail-closed gates, or security-relevant replay/idempotency controls change.
4. Apply the data-access construction checkpoint when backend code reads or writes a database, constructs REST/PostgREST filters, uses Supabase clients, calls RPC, uses query builders, touches storage keys, or reaches service-role clients.
5. Trace attacker-controlled input or identity to a missing control or sensitive sink.
6. Check surrounding mitigations, framework defaults, and deployment constraints before reporting.
7. Classify confidence and severity; keep unresolved stack or runtime facts in needs verification rather than promoting them to findings.

Validation:

- Reported findings have confirmed attacker control, reachability, impact, evidence, and fix direction.
- Backend/database audits name whether raw SQL, REST/PostgREST construction, SDK query builders, RPC, and service-role paths were inspected; database security is not claimed complete when server-side data-access construction was out of scope.
- Policy-governance findings state the relevant actor/control path or security-relevant operator/control-plane impact, including replay semantics and authority binding when those decide executable capability.
- Low-confidence, theoretical, test-only, comment-only, or mitigated patterns are not reported by default.

### Workflow stage: Close out with calibrated evidence

Return a security result whose status, coverage, and downstream ownership cannot be mistaken for broader proof.

1. Start with one plain-language outcome sentence before security status, severity, confidence, or verdict terminology.
2. Report the review basis, confirmed findings, needs verification, inspected and uninspected surfaces, residual risk, and evidence limits.
3. In targeted mode, report findings or no confirmed findings in reviewed scope without issuing PASS.
4. In formal mode, use FAIL only for confirmed in-scope findings, PASS (scoped) only for a complete named security-review scope, INCOMPLETE for missing mandatory coverage/evidence, and BLOCKED for an unavailable or unstable basis.
5. Do not issue an overall merge recommendation; hand confirmed security blockers and residual risk to code-reviewer when merge guidance is requested.

Validation:

- Status follows the evidence contract and cannot imply penetration testing, full scan coverage, standards compliance, or whole-system security; standards/control fulfillment always belongs to spec-conformance-reviewer.
- No reviewed-and-cleared claim rests only on grep, source-text assertions, mocks, fixtures, or green unit tests that do not exercise the claimed boundary.

### Workflow stage: Re-audit a remediated snapshot

Verify accepted fixes without editing the target or reusing a stale verdict.

1. Fix the re-audit scope to the accepted prior findings, exact remediation delta, current closure evidence, and adjacent regression surface on a new stable snapshot.
2. Re-test each original attack path and the blast-radius surface; preserve unresolved items as needs verification or confirmed findings and do not repeat unchanged previously cleared full scope.
3. Widen to a fresh formal or targeted review when the threat model, security authority, public behavior, or material scope changed or the blast radius cannot be bounded; cosmetic edits alone do not close an attack path.
4. If the same or a materially related confirmed finding survives remediation, require root-cause investigation of assumptions, the full attack path, adjacent controls and surfaces, and remediation scope before another point fix.
5. Invalidate the prior result after any material code, configuration, runtime, test, or evidence change.

Validation:

- The reviewer remains read-only and every closure claim is tied to the new snapshot and current evidence.

## Interop priority

- **security threat model, exploitability, confidence thresholds, and vulnerability reporting:** security-reviewer. This skill owns security findings and reporting discipline.
- **framework/runtime facts and remediation detail:** the relevant domain skill. Domain skills own framework behavior and remediation implementation, while this skill decides whether the issue is exploitable and reportable and later re-audits the result.
- **non-security review flow and general merge-risk findings:** code-reviewer. Move non-security findings and every overall merge recommendation to code-reviewer when both skills are active.
- **mapping implementation to an explicit security standard or versioned control set:** spec-conformance-reviewer. spec-conformance-reviewer owns requirement coverage and compliance status; security-reviewer owns exploitability and vulnerability classification.
- **Git-backed diff scans, repository scans, deep multi-pass scans, and durable scan artifacts when a dedicated orchestrator is available:** security-diff-scan, security-scan, or deep-security-scan. The scan skill owns traversal and canonical scan artifacts; security-reviewer must not run a parallel scan or issue a competing scan verdict.

## Gotchas

- **high** — A PASS on an old diff is not evidence for a changed implementation. If files or behavior changed after the audit, perform a delta review on the new scope before reporting PASS.
- **high** — Do not use FAIL merely because the target, coverage, runtime facts, or evidence are missing; use INCOMPLETE or BLOCKED according to the status contract.
- **high** — Do not issue an overall merge recommendation from security-reviewer, especially from MEDIUM-confidence or needs-verification items; route merge guidance to code-reviewer.
- **high** — PASS is always scoped to the recorded snapshot and named coverage; it is not proof of whole-system security, standards compliance, penetration testing, or exhaustive scanning.
- **high** — Review screenshots, status-site evidence, history payloads, logs, and problem responses for secrets, raw provider payloads, tokens, cookies, OTP, and unnecessary PII; code-only security review is insufficient for evidence-bearing changes.

## Policies

### Audit scope contract
A security audit must name the exact diff, commit, hash, or supplied-artifact scope; research scope; actors and trust boundaries; external surfaces; data-access construction; sensitive-data checks; and current evidence artifacts reviewed. If mandatory scope or evidence is missing, report INCOMPLETE; if the basis is unavailable or unstable, report BLOCKED.

### Read-only review boundary
Security review is read-only by default. A separate domain or implementation owner applies remediation only when explicitly authorized, and security-reviewer re-audits the resulting stable snapshot.

### Security status contract
Targeted review never emits PASS. Formal FAIL requires a confirmed in-scope finding; PASS (scoped) requires a complete named security-review scope and no confirmed findings; INCOMPLETE represents missing mandatory coverage or evidence; BLOCKED represents an unavailable or unstable review basis. Standards/control fulfillment and compliance status always belong to spec-conformance-reviewer.

### Bounded remediation re-audit
Re-audit fixed prior findings on a new stable snapshot using the remediation delta, original attack paths, closure evidence, and blast-radius surface. Skip unchanged cleared scope; widen when threat model, authority, public behavior, or material scope changed or blast radius is unbounded.

## Required active references
- [Methodology](references/methodology.md) — Read this for every review before selecting mode, establishing the review basis, classifying findings, or issuing a scoped status.

## Optional references
- [Api Auth Input](references/api-auth-input.md) — Read this when you need input validation, injection, authn, authz, CSRF refresh/reissue threat modeling, mass assignment, file handling checks, and detection hints.
- [Data Access Injection](references/data-access-injection.md) — Read this when backend code constructs SQL, REST/PostgREST URLs, SDK query-builder filters, RPC args, storage keys, search queries, or service-role data access from request or persisted user-controlled values.
- [Domain Handoffs](references/domain-handoffs.md) — Read this when you need stack discovery and when to defer to domain skills for framework-specific detail.
- [Github Actions](references/github-actions.md) — Read this when you need GitHub Actions threat model, attack classes, detection hints, and safe patterns.
- [Policy Governance Admission](references/policy-governance-admission.md) — Read this when reviewing external consultant/tool invocation admission, admission/approval gates that can produce executable capability, policy profile activation, active-scope selection, governance/audit persistence preconditions, fail-closed policy gates, or replay/idempotency controls around security-relevant decisions.
- [Secrets Config](references/secrets-config.md) — Read this when you need secrets, browser durable storage, telemetry/error reporting leaks, config trust boundaries, token scope, logging exposure, and dev-versus-prod nuance.
- [Supabase Rls](references/supabase-rls.md) — Read this when you need RLS, grants, privileged functions, RPC, and service-role review.
- [Webhooks](references/webhooks.md) — Read this when you need signature verification, replay windows, raw body handling, idempotency, and reporting checks.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory security-reviewer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/issues/*`
- Supporting glob: `docs/logs/*`
