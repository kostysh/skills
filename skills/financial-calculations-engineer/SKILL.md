---
name: financial-calculations-engineer
description: Design, implement, and review deterministic EUR arithmetic and
  cross-layer numeric parity. Use for VAT/IVA, discounts, rates, allocations,
  parsing, formatting, and ledger amount balancing. Require authoritative
  financial rules and real-boundary evidence; never invent tax or accounting
  policy.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: a2d9e51b0f94916165ae3c7886eabfcec958e74eaf901c75f94c9f47df2937e9
---

# financial-calculations-engineer

## Start here

1. Classify the request as design, implementation/remediation, or review-only and confirm whether mutations are authorized.
2. Obtain the accepted business, legal, tax, tariff, or accounting source for every material financial rule before choosing arithmetic.
3. Define the calculation contract, including units, currency, rates, formulas, rounding and fixation points, negative flows, ranges, errors, and residual allocation.
4. Discover the target repository's canonical money engine and the actual runtime contours affected; do not assume a package name or path.
5. Load only the optional references whose triggers match the task.
6. Report evidence per real contour and reserve full verification for boundaries that were actually exercised.

## When to use this skill

- Designing, implementing, or reviewing deterministic EUR amount representation, arithmetic, rounding, VAT/IVA, discounts, rates, allocations, scorporo, parsing, or formatting.
- Preserving numeric invariants for ledger amounts when the accounting and posting policy is already authoritative.
- Establishing or checking parity across a project money library, PostgreSQL, backend, and browser/application contours.

## When NOT to use this skill

- Selecting tax applicability, tariff rules, ledger accounts, recognition policy, or posting lifecycle without an accepted authoritative source.
- Pure framework, transport, UI, database, or TypeScript work with no financial invariant.
- Treating a green utility package, fixture file, SQL snippet, or mock as proof of end-to-end financial capability.

## Overview

Guide finance-oriented work from accepted rules to reproducible integer arithmetic and evidence at the real runtime boundaries.

## Capability boundary

Own:

- EUR amount representation and conversions;
- rate encoding and arithmetic;
- rounding, fixation, allocation, and residual invariants;
- numeric conformance across the project money engine, PostgreSQL, backend, and browser when those contours are in scope.

Do not own:

- whether a tax or tariff applies;
- the authoritative rate or effective period;
- ledger accounts, debit/credit meaning, recognition, audit, or posting lifecycle;
- framework, transport, database deployment, or UI mechanics.

Those rules must come from an accepted source. A library example can demonstrate `22%`; it cannot authorize using 22% for a transaction.

## Core invariants

- Represent canonical EUR amounts as integer cents in domain state and persistence unless an accepted contract explicitly names a different precision for a specific intermediate.
- Keep amount, rate, percentage, weight, and display string as distinct types or schemas.
- Never use binary floating point for canonical financial arithmetic.
- Make rounding mode, precision, fixation point, sign behavior, and remainder ordering explicit.
- Treat negative amounts, refunds, reversals, zero values, bounds, overflow, and invalid inputs as first-class cases.
- Convert and format only at named boundaries; never calculate from formatted output.
- Prefer the established project money engine after verifying its current public API.
- Require literal expected fixtures and real-contour evidence for parity claims.

## Completion boundary

Library source, tests, a browser bundle, SQL text, migrations, DTO schemas, mocks, and fixture files may be necessary substrate. None proves a broader runtime contour that did not execute.

A complete result states which financial authority was applied, what calculation contract was implemented, which contours actually ran, and what remains unverified or unavailable.

## Workflow stages

### Workflow stage: Establish authority and the calculation contract

Prevent correct arithmetic from implementing an invented or ambiguous financial policy.

1. Classify the task mode and mutation authority; keep review-only work read-only and route formal findings output to `code-reviewer`.
2. Identify each authoritative source by stable id or title, version or effective date when applicable, and the rules it owns.
3. Apply precedence in this order: accepted legal/accounting/product specification; project financial contract; canonical money-engine public API and tests for arithmetic behavior; application code; examples in this skill.
4. Define currency and amount unit, rate unit and bounds, inclusive or exclusive basis, formula, rounding mode, fixation points, negative/refund behavior, range and overflow behavior, error semantics, and allocation or residual-cent policy as applicable.
5. If a material rule is missing, conflicting, expired, or lower-authority than another source, stop the risky path and return the exact authority question instead of choosing a policy.

Validation:

- Every material financial decision traces to an accepted source instead of a skill example or utility behavior.
- Unit-bearing fields and formulas are unambiguous.
- Missing or conflicting authority produces a blocked handoff, not an invented default.

### Workflow stage: Discover the canonical engine and real contours

Reuse verified project behavior without turning one repository layout or utility test suite into universal capability.

1. Inspect the target repository for an established money engine, its manifest, public exports, version, configuration model, behavioral docs, and tests; verify APIs before using the mapping reference.
2. If no canonical engine exists, do not create a shared package automatically; keep one domain-specific formula with its owning module or route a genuinely shared boundary to architecture ownership.
3. Add a primitive to the canonical engine only when it is reusable financial behavior or a shared cross-contour boundary; keep one-off tariff or product formulas with the authoritative domain owner while composing engine primitives.
4. Inventory applicable contours separately, such as library unit, PostgreSQL, backend/domain integration, browser bundle, application UI, persistence, and external ledger integration.
5. Treat library availability, unit tests, generated fixtures, schemas, and wrappers as substrate for broader application or parity claims until the corresponding real contour is exercised.

Validation:

- The chosen engine and API are present in the target repository or their absence has a deterministic fallback or stop.
- Every claimed contour has a named runtime boundary and consumer.
- Shared-library changes are justified by current reuse or a protected boundary.

### Workflow stage: Implement the smallest contract-complete change

Preserve the accepted financial contract with explicit units and identical numeric semantics at every affected boundary.

1. Keep canonical EUR amounts as integer cents in domain logic unless the accepted contract explicitly defines another precision for an intermediate value; keep rates in a separate integer unit.
2. Use explicit rounding modes only at accepted fixation points, and preserve sign symmetry, reversals, refunds, zero values, and deterministic remainder ordering.
3. Use unit-bearing DTO and schema names such as `amountCents`; never let one unitless string mean either canonical cents or human-entered euros.
4. Recompute or validate authoritative amounts on the server; browser previews and submitted totals are not persistence authority by themselves.
5. Match PostgreSQL denominator, rate, range, overflow, rounding, error, and tie-break behavior to the canonical engine; use widened exact intermediates when bigint multiplication can overflow.
6. Configure process-global money settings once at application bootstrap and reset them between tests; do not mutate global math policy per request.

Validation:

- No canonical money arithmetic uses binary floating point or formatted strings.
- Boundary schemas preserve units without reinterpretation.
- Each changed contour implements the same accepted formula and error contract.

### Workflow stage: Verify real contours and report honestly

Make the evidence strength match the financial and parity claim.

1. Build fixed expected fixtures from accepted examples or independently reviewed literals; do not calculate expected values with the implementation under test.
2. Exercise every contour named in the completion claim at its real boundary, including real PostgreSQL for SQL claims and actual browser or application runtime for browser claims.
3. Record an evidence matrix with `contour`, fixture or source identity, command or artifact, observed result, and status `verified`, `not-run`, `not-applicable`, or `blocked`.
4. Classify the overall result as `verified` only when every applicable claimed contour is verified; otherwise report `partial` when useful work exists or `blocked` when authority or a required boundary is unavailable.
5. Report the authoritative calculation contract, affected contours, implementation or review outcome, evidence matrix, anti-claims, and residual risk.

Validation:

- Green package tests are not reported as SQL, application wiring, persistence, or end-to-end parity evidence.
- The final status follows the evidence matrix without substrate-only closure.

## Interop priority

- **tax applicability, tariff policy, accounting recognition, ledger accounts, and posting lifecycle:** Accepted legal, accounting, product, or financial specification. This skill implements and checks supplied financial rules; it does not invent them. Use `spec-engineer` to make accepted rules executable, not to create authority.
- **TypeScript types, compiler behavior, and language-level APIs:** typescript-engineer. This skill owns financial units and invariants; typescript-engineer owns TypeScript mechanics.
- **test framework, fixtures, mocks, coverage, and test-process behavior:** typescript-test-engineer. This skill defines required financial cases and evidence boundaries; the test skill owns test mechanics.
- **PostgreSQL or Supabase schema, functions, migrations, transactions, and deployment:** The relevant database or Supabase skill. This skill owns numeric semantics and SQL conformance; the database skill owns platform implementation and operations.
- **UI state, forms, accessibility, framework lifecycle, and browser integration:** The relevant frontend or framework skill. This skill owns parse, format, units, preview authority, and parity invariants; frontend skills own UI mechanics.
- **formal code-review process, severity, findings, and merge guidance:** code-reviewer. This skill supplies financial-domain judgment while code-reviewer owns read-only review workflow and output.

## Gotchas

- **high** — Do not infer a tax rate, tariff, ledger account, posting rule, or residual-cent policy from a utility example.
- **high** — Do not accept a generic money string that could mean canonical cents or human-entered euros; encode the unit in the field and parser contract.
- **high** — Do not copy illustrative integer SQL until denominator, rate, overflow, range, rounding, error, and tie-break semantics are proven against the canonical engine.
- **high** — Do not call package unit tests, browser-bundle tests, fixtures, schemas, or mocks cross-layer parity unless the claimed real contours executed the same fixtures.
- **high** — Do not change process-global locale, compatibility, resource, or math settings per request; configure once at bootstrap and isolate tests.
- **high** — Do not persist a browser preview or client-submitted total as authoritative without server-side recomputation or contract validation.
- **high** — Balanced integer amounts do not establish correct ledger accounts, recognition, audit, or posting lifecycle.

## Policies

### Authority-before-arithmetic policy
Require accepted, traceable financial rules before choosing formulas or defaults; utility APIs define arithmetic behavior, not business or legal authority.

### Explicit-units policy
Every persisted or transported amount and rate must carry an unambiguous unit in its schema, name, or discriminant, and conversions occur only at named boundaries.

### Rounding and fixation policy
Rounding mode, precision, fixation points, and residual allocation are part of the accepted contract and must match across every affected contour.

### Canonical-engine discovery policy
Verify the target repository's current public money API and tests at invocation time; a relative path or API table in this skill is guidance, not proof that the engine exists or is compatible.

### Parity-claim policy
Claim parity only for the exact fixture identity and real contours that executed successfully; missing SQL, backend, browser, persistence, or application evidence remains explicit.

### Reporting contract
Report the authoritative calculation contract, affected contours, outcome, per-contour evidence matrix, anti-claims, residual risk, and an overall status no stronger than the weakest required contour.

## Optional references
- [Browser boundaries](references/browser.md) — Read this when browser input, preview, state, serialization, or formatting is in scope.
- [Database and SQL conformance](references/database-sql.md) — Read this when PostgreSQL storage, SQL formulas, allocation, or database parity is in scope.
- [Canonical money engine](references/money-library-usage.md) — Read this when discovering, using, or extending a project-owned money library.
- [Cross-layer parity evidence](references/parity-testing.md) — Read this before claiming parity or designing fixtures across two or more runtime contours.
- [Server and backend boundaries](references/server-backend.md) — Read this when DTOs, JSON serialization, server calculation, persistence, or backend configuration is in scope.
- [VAT and IVA arithmetic](references/vat-iva.md) — Read this when an accepted source requires forward VAT/IVA, reverse VAT/scorporo, or residual-cent handling.

## Portability rules

- Do not require a machine-specific path, repository layout, external local file, or package name to understand or execute the core workflow.
- Discover project financial authorities and the canonical money engine from the target repository; stop or route deterministically when they are absent.
- Keep all mandatory calculation, evidence, fallback, and reporting rules inside this skill folder.
- Treat formulas, rates, paths, API names, and project profiles as examples until verified against the target source.

## Portability checklist before finishing

- Confirm the generated SKILL links every optional reference with its precise load trigger.
- Confirm copied-skill use has a deterministic discovery, fallback, or blocked path when no project money engine exists.
- Confirm no active instruction requires an absolute local path or external repository state.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
