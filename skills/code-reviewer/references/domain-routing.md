# Domain Routing

Load only the skill that matches the touched code. Keep review context narrow.

## File or Pattern -> Skill

| Signal | Load |
|---|---|
| `new Hono(`, `app.route(`, `Context`, `wrangler`, API routes, middleware | `hono-engineer` |
| `supabase`, SQL migrations, policies, `auth.uid()`, Edge Functions | `supabase-engineer` |
| React SPA state, routing, TanStack Query, Zustand, RHF, Dexie | `react-spa-engineer` |
| SSR, hydration, portals, reusable component hardening | `react-components-engineer` |
| Node runtime, streams, shutdown, ESM/CJS, process hangs | `node-engineer` |
| Type modeling, generics, unsafe assertions, tsconfig, lint rules | `typescript-engineer` |
| `node:test`, Vitest, testing utilities, CI test contours | `typescript-test-engineer` |
| UI, accessibility, content, forms, visual interaction quality | `web-ui-reviewer` |

## Policy/admission Merge-risk Ownership

Keep non-security policy/admission merge-risk probes in `code-reviewer` when changed files or linked intent touch policy gates, admission before side effects, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks. Load `references/policy-admission-merge-risk.md` for the bounded pass.

Use this skill for review findings such as invocation after deny, stale evidence admission, replay conflict, fail-open persistence, active-scope concurrency, or missing tests for those reachable paths.

Do not expand this into a full compliance matrix or threat model:

- use `spec-conformance-reviewer` for requirement-by-requirement traceability, compliance statuses, and implementation-versus-spec verdicts
- use `security-reviewer` for exploitability analysis, vulnerability classification, and security severity
- use the matching domain skill for framework or runtime correctness details

## Runtime-gate Deployed-path Ownership

Keep non-security deployed-path runtime-gate probes in `code-reviewer` when changed files or linked intent touch a gate that authorizes execution through a shipped lifecycle. Load `references/runtime-gate-deployed-path.md` for the bounded pass.

Use this skill for review findings such as production construction bypassing a gate, deployed dependency wiring that omits the gate, request/tick execution that invokes before the gate, invocation boundaries that move outside the policy/admission decision, idempotency locks scoped away from the gated side effect, deployed-path tests that cover only isolated units, or hard-coded deployment/cell identity at an integration boundary.

Do not expand this into another skill's ownership:

- use `security-reviewer` for exploitability analysis, replay authority, credential handling, vulnerability classification, and security severity
- use `spec-conformance-reviewer` for requirement-by-requirement identity or lifecycle compliance
- use the matching domain skill for framework lifecycle, dependency injection, storage, lock, queue, router, or runtime mechanics needed to confirm or clear the probe

## Route to Security Reviewer

Switch to `security-reviewer` when the change is primarily about:

- authn or authz
- RLS and permission model
- webhook signature verification
- GitHub Actions or release workflows
- secret handling
- input validation with exploitable sinks

Use both skills when a mixed review needs security findings plus non-security findings.

## Route to Questions Instead of Findings

Do not load extra skills just to decorate low-confidence comments. If the concern is weak:

- ask a question
- note an assumption
- move on
