# High-risk backend contract matrix

Read this reference before drafting, materially revising, or accepting a high-risk backend specification that touches a public API, persistent state, authorization, money, retries, external resources, or required audit evidence. Also read it when a specification spans multiple implementation packages/components or crosses an external-provider boundary. Without a high-risk trigger, apply only the conditional package/provider readback below; do not manufacture the full `HRB-*` matrix.

## Outcome

For high-risk scope, produce one compact matrix that makes every applicable cross-layer decision falsifiable before coding. For package/provider-only scope, produce only the conditional readback below. Neither output is a project-wide registry; do not add hypothetical infrastructure or select domain architecture.

## Matrix contract

When the high-risk trigger applies, include every row below. Mark a row `applicable` or `not_applicable`; `not_applicable` requires a source-backed reason. For each applicable row record:

- authoritative source and decision owner;
- normative contract or invariant;
- relevant layer and downstream owner;
- exact failure distinctions and forbidden outcomes;
- the smallest falsifier or negative oracle;
- executable test or evidence contour;
- handoff status and blocker, if any.

| Row | Decision boundary |
| --- | --- |
| `HRB-01` | Ledger and idempotency ownership across the whole command, including key scope, fingerprint, replay, conflict, and committed outcome. |
| `HRB-02` | Deterministic lock order, protected canonical state, winner/loser semantics, and rollback effects under concurrency. |
| `HRB-03` | Exact ACL: grants, RLS, `SECURITY DEFINER`, direct-access closure, elevated exceptions, and negative principals. |
| `HRB-04` | Authentication, session, role, tenant/context, and assignment recheck points at admission, phase transitions, delivery, and authoritative readback. |
| `HRB-05` | Internal database failure, SQLSTATE retryability, domain outcome, and safe public error mapping without provider leakage. |
| `HRB-06` | Distinct absent, `null`, expired, revoked, transport-loss, persistence-loss, and unknown-outcome states plus allowed recovery. |
| `HRB-07` | Numeric and money representation across database/domain/JSON boundaries, including safe range, bigint conversion, currency, locale, and exact examples. |
| `HRB-08` | Request integrity such as Origin/CSRF, signed raw bytes, replay binding, and body limits when the accepted credential or provider contract requires them. |
| `HRB-09` | Audit/evidence event, bounded payload, transaction phase, correlation, retention owner, and fail-closed or explicitly degraded behavior. |
| `HRB-10` | Resource lifecycle across create, read, replay, finalize, expiry, discard, and cleanup; for every already accepted applicable `HRB-05`/`HRB-06` outcome or state, the permitted next action, including cleanup, replay, or terminal handling when relevant, plus its actor and environment. |
| `HRB-11` | Executable domain and cross-entity invariants with negative constraints that reject an otherwise convenient but invalid state. |
| `HRB-12` | One accepted owning schema or source for the exact public request, response, identifier, DTO, pagination/event, namespace, and compatibility symbols; consumers reference those symbols instead of restating aliases, and forbidden aliases remain explicit. |

## Conditional multi-package or provider readback

Apply this supplement only when one specification spans multiple implementation
packages/components or crosses an external-provider boundary. Do not add it to a
simple single-component specification merely because this reference was loaded.

- For each affected package or component, map the accepted public symbol, its
  accepted contract owner, declared direct dependencies, and accepted upstream
  preconditions. Reliance on an undeclared transitive dependency blocks the
  affected handoff.
- Reference the accepted architecture boundary between generic adapter
  capability/configuration and application-owned provider profile, admission,
  and model literals. Record owners and consumers without selecting or changing
  that boundary in the specification.
- For each applicable inherited limit, enum member, error, or format member, map
  the canonical owner, every consumer/path that must preserve it, and a negative
  oracle that fails when a member is omitted.
- Route a missing contract/package/provider owner or boundary to
  `architecture-engineer`. After ownership is accepted, route missing exact
  behavior, schema, signature, or member detail to `spec-engineer`. Block only
  the dependent handoff.

## Readiness gate

A high-risk backend specification is not `ready for coding` while an applicable row lacks authority, a normative decision, a falsifier, or executable evidence. A package/provider-triggered specification is not ready while an applicable conditional-readback item lacks its accepted owner, dependency/boundary disposition, inherited-member coverage, negative oracle, or downstream route. Route missing product decisions to the product owner, architecture choices to `architecture-engineer`, Supabase facts to `supabase-engineer`, Hono integration facts to `hono-engineer`, security verdicts to `security-reviewer`, and money semantics to the financial-domain owner.

The test inventory must map every applicable row to at least one test or real-boundary check that would fail for the prohibited outcome. Happy-path, mock-only, schema-presence, generated-file, or self-authored evidence cannot close a row whose claim crosses a stronger boundary.
