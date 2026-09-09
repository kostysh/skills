---
name: financial-calculations-engineer
description: Design, implement, and review deterministic money arithmetic and
  cross-layer parity. Keep EUR as default; use discovered currency engines only
  with authoritative code and scale. Cover VAT/IVA, rates, allocation, parsing,
  formatting, and ledger amounts; never invent FX, tax, or accounting policy.
metadata:
  source-version: 0.3.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 9e9d156dcab083f150591d0d68c5e843b1e00eb400c55493be4f6083e3897b37
---

# financial-calculations-engineer

## Start here

1. Classify the request as design, implementation/remediation, or review-only and confirm whether mutations are authorized.
2. Obtain the accepted business, legal, tax, tariff, or accounting source for every material financial rule before choosing arithmetic.
3. Define the calculation contract, including currency code, minor-unit scale, units, rates, formulas, rounding and fixation points, negative flows, ranges, errors, and residual allocation.
4. Use the built-in EUR facade by default; non-EUR requires authoritative code/scale and a verified generic engine.
5. Discover the target repository's canonical money engine and the actual runtime contours affected; do not assume a package name or path.
6. Load only the optional references whose triggers match the task.
7. Report evidence per real contour and reserve full verification for boundaries that were actually exercised.

## When to use this skill

- Designing, implementing, or reviewing deterministic money representation, arithmetic, rounding, VAT/IVA, rates, allocation, scorporo, parsing, or formatting, with EUR as default.
- Handling a non-EUR financial task when an authoritative currency code and minor-unit scale are available or must be identified before work can proceed.
- Preserving currency, scale, and numeric invariants for ledger amounts when the accounting and posting policy is already authoritative.
- Establishing or checking parity across a project money library, PostgreSQL, backend, and browser/application contours.

## When NOT to use this skill

- Selecting tax applicability, tariff rules, ledger accounts, recognition policy, or posting lifecycle without an accepted authoritative source.
- Inventing currency metadata or FX, or treating a three-letter shape as ISO 4217 validation.
- Pure framework, transport, UI, database, or TypeScript work with no financial invariant.
- Treating a green utility package, fixture file, SQL snippet, or mock as proof of end-to-end financial capability.

## Overview

Guide finance-oriented work from accepted rules to reproducible integer minor-unit arithmetic and evidence at the real runtime boundaries.

## Capability boundary

Own:

- EUR amount representation through the built-in/default facade;
- non-EUR amount representation through a discovered immutable currency engine only when code and minor-unit scale are authoritative;
- rate encoding and arithmetic;
- rounding, fixation, allocation, and residual invariants;
- numeric conformance across the project money engine, PostgreSQL, backend, and browser when those contours are in scope.

Do not own:

- whether a tax or tariff applies;
- the authoritative rate or effective period;
- ISO 4217 validation, currency discovery, FX rates, or conversion policy;
- ledger accounts, debit/credit meaning, recognition, audit, or posting lifecycle;
- framework, transport, database deployment, or UI mechanics.

Those rules must come from an accepted source. A `22%` example cannot authorize a transaction rate. Accepting `[A-Z]{3}` and scale `0..20` validates structure, not a real currency or its current scale.

## Core invariants

- Represent canonical amounts as integer minor units in domain state and persistence unless an accepted contract explicitly names a different precision for a specific intermediate; cents are the EUR specialization.
- Keep EUR on its first-class compatible facade. For another currency, preserve the immutable engine's code and `minorUnitDigits` in every amount and boundary DTO.
- Keep amount, rate, percentage, weight, and display string as distinct types or schemas.
- Never use binary floating point for canonical financial arithmetic.
- Make rounding mode, precision, fixation point, sign behavior, and remainder ordering explicit.
- Treat negative amounts, refunds, reversals, zero values, bounds, overflow, and invalid inputs as first-class cases.
- Fail closed on currency or scale mismatch; never manually relabel an amount or imply FX conversion from formatting or engine construction.
- Convert and format only at authoritative named boundaries; never calculate from formatted output.
- Prefer the established project money engine after verifying its current public API.
- Require literal expected fixtures and real-contour evidence for parity claims.

## Completion boundary

Library source, package tests, a browser bundle, SQL text, migrations, DTO schemas, mocks, and fixture files may be necessary substrate. None proves application wiring, persistence, real PostgreSQL execution, or another broader runtime contour that did not execute.

A complete result states which financial authority was applied, what calculation contract was implemented, which contours actually ran, and what remains unverified or unavailable.

## Workflow stages

### Workflow stage: Establish authority and the calculation contract

Prevent correct arithmetic from implementing an invented or ambiguous financial policy.

1. Classify the task mode and mutation authority; keep review-only work read-only and route formal findings output to `code-reviewer`.
2. Identify each authoritative source by stable id or title, version or effective date when applicable, and the rules it owns.
3. Apply precedence in this order: accepted legal/accounting/product specification; project financial contract; canonical money-engine public API and tests for arithmetic behavior; application code; examples in this skill.
4. From accepted sources, define currency code, minor-unit scale, amount/rate units, bounds, formula, rounding/fixation, negative flows, range/overflow, errors, and allocation or residual policy.
5. Treat EUR with two minor-unit digits as the built-in/default profile only when the contract is EUR; do not use that scale as a fallback for another or unidentified currency.
6. Treat a three-uppercase-letter code and scale `0..20` only as structural engine inputs, never as proof of ISO 4217 identity or current minor-unit metadata.
7. For FX, require authoritative currencies, rate provenance/time/direction, spread or fees, rounding/fixation, and an implemented conversion boundary; otherwise report unsupported conversion.
8. If a material rule is missing, conflicting, expired, or lower-authority than another source, stop the risky path and return the exact authority question instead of choosing a policy.

Validation:

- Every material financial decision traces to an accepted source instead of a skill example or utility behavior.
- Currency code, scale, unit-bearing fields, and formulas are unambiguous.
- Missing or conflicting code, scale, FX, or policy authority produces a blocked handoff, not an invented default or conversion.

### Workflow stage: Discover the canonical engine and real contours

Reuse verified project behavior without turning one repository layout or utility test suite into universal capability.

1. Inspect the target repository for an established money engine, its manifest, public exports, version, configuration model, behavioral docs, and tests; verify APIs before using the mapping reference.
2. Distinguish the EUR facade (`MoneyCents`, EUR boundary APIs, top-level arithmetic) from `createCurrencyEngine`; use the facade for EUR and one separate engine for an authorized non-EUR code/scale.
3. Treat the factory as a local constructor, not a plugin registry, discovery service, ISO catalog, or FX provider.
4. If no canonical engine exists, do not create a shared package automatically; keep one domain-specific formula with its owning module or route a genuinely shared boundary to architecture ownership.
5. If a non-EUR task lacks both an authoritative code/scale and a verified generic engine contract, stop that path; never fall back to EUR cents or silently reuse another engine.
6. Add a primitive to the canonical engine only when it is reusable financial behavior or a shared cross-contour boundary; keep one-off tariff or product formulas with the authoritative domain owner while composing engine primitives.
7. Inventory applicable contours separately, such as library unit, PostgreSQL, backend/domain integration, browser bundle, application UI, persistence, and external ledger integration.
8. Treat library availability, unit tests, generated fixtures, schemas, and wrappers as substrate for broader application or parity claims until the corresponding real contour is exercised.

Validation:

- The chosen EUR facade or generic engine and API are present in the target repository, and generic engine definition matches the accepted code/scale; otherwise the path has a deterministic fallback or stop.
- Every claimed contour has a named runtime boundary and consumer.
- Shared-library changes are justified by current reuse or a protected boundary.

### Workflow stage: Implement the smallest contract-complete change

Preserve the accepted financial contract with explicit units and identical numeric semantics at every affected boundary.

1. Keep canonical amounts as integer minor units; cents specialize EUR, while another currency uses its authorized engine scale. Name any higher-precision intermediate separately.
2. For EUR, preserve the compatible facade and `{ currency: 'EUR', amountCents }`; for another currency, use `CurrencyAmount<TCode>` and `{ currency, minorUnitDigits, amountMinorUnits }` through the verified engine profile.
3. Preserve currency code and scale across browser, server, persistence, and integration contracts; reject mixed-currency or mixed-scale arithmetic and DTOs before calculation.
4. Use explicit rounding modes only at accepted fixation points, and preserve sign symmetry, reversals, refunds, zero values, and deterministic remainder ordering.
5. Use the public strict parsers and serializers when available; do not replace boundary validation with `BigInt(untrustedString)` or let one unitless string mean either integer minor units or human-entered major units.
6. Pass only `locale` through `FormatOptions`; take currency from the EUR facade or immutable engine definition, and reject arbitrary relabeling or EUR-as-USD/JPY formatting without a real conversion.
7. Recompute or validate authoritative amounts on the server; browser previews and submitted totals are not persistence authority by themselves.
8. Match PostgreSQL denominator, rate, range, overflow, rounding, error, and tie-break behavior to the canonical engine; use widened exact intermediates when bigint multiplication can overflow.
9. Preserve full signed int64 for verified `postgresql`/`nodejs` profiles, permit widened `roundDiv` numerators with result checks, and keep DTO range checks independent of math mode when promised.
10. Reject empty or all-zero weighted allocations before any zero-total fast path when the engine contract does.
11. Configure process-global locale/math/compatibility/resources at bootstrap and reset them between tests; keep them distinct from immutable engine code/scale.

Validation:

- No canonical money arithmetic uses binary floating point or formatted strings.
- Boundary schemas preserve currency and scale without reinterpretation, relabeling, or mixed-contract arithmetic.
- Each changed contour implements the same accepted formula and error contract.

### Workflow stage: Verify real contours and report honestly

Make the evidence strength match the financial and parity claim.

1. Build fixed expected fixtures from accepted examples or independently reviewed literals, including currency code and scale where applicable; do not calculate expected values with the implementation under test.
2. Exercise every contour named in the completion claim at its real boundary, including real PostgreSQL for SQL claims and actual browser or application runtime for browser claims.
3. Include wrong DTO discriminants, wrong minor-unit scale, mixed-currency, mixed-scale, relabeling, and unsupported FX cases whenever those risks are in scope.
4. Record an evidence matrix with `contour`, fixture or source identity, command or artifact, observed result, and status `verified`, `not-run`, `not-applicable`, or `blocked`.
5. Classify the overall result as `verified` only when every applicable claimed contour is verified; otherwise report `partial` when useful work exists or `blocked` when authority or a required boundary is unavailable.
6. Report the authoritative calculation contract, affected contours, implementation or review outcome, evidence matrix, anti-claims, and residual risk.

Validation:

- Green package or browser-bundle tests are not reported as SQL, application wiring, persistence, or end-to-end parity evidence.
- The final status follows the evidence matrix without substrate-only closure.

## Interop priority

- **tax applicability, tariff policy, accounting recognition, ledger accounts, and posting lifecycle:** Accepted legal, accounting, product, or financial specification. This skill implements and checks supplied financial rules; it does not invent them. Use `spec-engineer` to make accepted rules executable, not to create authority.
- **TypeScript types, compiler behavior, and language-level APIs:** typescript-engineer. This skill owns financial units and invariants; typescript-engineer owns TypeScript mechanics.
- **test framework, fixtures, mocks, coverage, and test-process behavior:** typescript-test-engineer. This skill defines required financial cases and evidence boundaries; the test skill owns test mechanics.
- **PostgreSQL or Supabase schema, functions, migrations, transactions, and deployment:** The relevant database or Supabase skill. This skill owns numeric semantics and SQL conformance; the database skill owns platform implementation and operations.
- **UI state, forms, accessibility, framework lifecycle, and browser integration:** The relevant frontend or framework skill. This skill owns parse, format, units, preview authority, and parity invariants; frontend skills own UI mechanics.
- **formal code-review process, severity, findings, and merge guidance:** code-reviewer. This skill supplies financial-domain judgment while code-reviewer owns read-only review workflow and output.

## Gotchas

- **high** — Do not infer a tax rate, tariff, ledger account, posting rule, or residual-minor-unit policy from a utility example.
- **high** — Do not infer ISO 4217 validity or a currency's minor-unit scale from a structurally accepted three-letter code and `0..20` engine scale; require an authoritative source.
- **high** — Do not relabel EUR as another currency, pass arbitrary currency through a EUR formatter, or treat engine construction as FX conversion.
- **high** — Do not unwrap and combine amounts across currencies or scales; preserve runtime tags and fail closed on either mismatch.
- **high** — Do not accept a generic money string that could mean integer minor units or human-entered major units; encode currency, scale, unit, and parser contract.
- **high** — Do not copy illustrative integer SQL until denominator, rate, overflow, range, rounding, error, and tie-break semantics are proven against the canonical engine.
- **high** — Do not call package unit tests, browser-bundle tests, fixtures, schemas, or mocks cross-layer parity unless the claimed real contours executed the same fixtures.
- **high** — Do not change process-global locale, compatibility, resource, or math settings per request or confuse them with immutable per-engine code/scale; configure globals once at bootstrap and isolate tests.
- **high** — Do not persist a browser preview or client-submitted total as authoritative without server-side recomputation or contract validation.
- **high** — Balanced integer amounts do not establish correct ledger accounts, recognition, audit, or posting lifecycle.

## Policies

### Authority-before-arithmetic policy
Require accepted, traceable financial rules before choosing formulas or defaults; utility APIs define arithmetic behavior, not business or legal authority.

### Explicit-units policy
Every persisted or transported amount and rate must carry unambiguous currency, minor-unit scale, and unit semantics in its schema, name, or discriminants; EUR cents remain the built-in specialization, and conversions occur only at authoritative named boundaries.

### Currency-profile policy
Use the compatible top-level facade for EUR and a separately created verified engine for another authorized code/scale; reject missing or conflicting scale, mixed currency/scale, manual relabeling, and unsupported FX.

### Rounding and fixation policy
Rounding mode, precision, fixation points, and residual allocation are part of the accepted contract and must match across every affected contour.

### Canonical-engine discovery policy
Verify the target repository's current public EUR facade, generic engine profile, and tests at invocation time; a relative path or API table in this skill is guidance, not proof that the engine, currency registry, or conversion capability exists.

### Parity-claim policy
Claim parity only for the exact fixture identity and real contours that executed successfully; missing SQL, backend, browser, persistence, or application evidence remains explicit.

### Reporting contract
Report the authoritative calculation contract, affected contours, outcome, per-contour evidence matrix, anti-claims, residual risk, and an overall status no stronger than the weakest required contour.

## Optional references
- [Browser boundaries](references/browser.md) — Read this when browser input, preview, state, serialization, or formatting is in scope.
- [Database and SQL conformance](references/database-sql.md) — Read this when PostgreSQL storage, SQL formulas, allocation, or database parity is in scope.
- [Canonical money engine](references/money-library-usage.md) — Read this when discovering or using a money library, and for every non-EUR engine task.
- [Cross-layer parity evidence](references/parity-testing.md) — Read this before claiming parity or designing fixtures across two or more runtime contours.
- [Server and backend boundaries](references/server-backend.md) — Read this when DTOs, JSON serialization, server calculation, persistence, or backend configuration is in scope.
- [VAT and IVA arithmetic](references/vat-iva.md) — Read this when an accepted source requires forward VAT/IVA, reverse VAT/scorporo, or residual-minor-unit handling.

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
