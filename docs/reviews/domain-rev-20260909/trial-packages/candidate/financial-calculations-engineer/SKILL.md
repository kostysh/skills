---
name: financial-calculations-engineer
description: Design, implement, and review EUR-first money arithmetic and
  cross-layer parity using accepted currency, scale, and rounding rules. Use
  verified project APIs or a local formula for VAT/IVA, rates, allocation, and
  units; never invent FX, tax, or accounting policy.
metadata:
  source-version: 0.3.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: a3f9a1c46960dde29d6de43f5bc88bb06ac69f2330c7d0a77e924fe5047a2c3e
---

# financial-calculations-engineer

## Start here

1. Classify the request as design, implementation/remediation, or review-only and confirm whether mutations are authorized.
2. Obtain the accepted business, legal, tax, tariff, or accounting source for every material financial rule before choosing arithmetic.
3. Define the calculation contract, including currency code, minor-unit scale, units, rates, formulas, rounding and fixation points, negative flows, ranges, errors, and residual allocation.
4. Establish the currency and scale from the accepted contract; EUR is the default supported profile, never a fallback for unidentified currency.
5. Discover the target repository's canonical money engine and the actual runtime contours affected; do not assume a package name or path.
6. Read the required local references only when their stated task conditions apply.
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

Apply accepted financial rules through exact arithmetic and real-boundary evidence.

## Capability boundary

Own:

- EUR amount representation through the accepted project contract;
- non-EUR amount representation when code and minor-unit scale are authoritative, using a verified API or an authorized local formula;
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

Use exact integer minor units with explicit currency, scale, amount/rate units, rounding/fixation, sign and allocation rules. Preserve the accepted API and DTO contract; profile examples are conditional. The workflow below owns implementation and verification requirements, including local formulas when no engine exists.

## Completion boundary

Report the applied authority, calculation contract, executed contours, and evidence gaps. Source, unit tests, SQL text, schemas, and mocks cannot prove an unexecuted runtime boundary.

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
8. When applicability, effective period, and source precedence resolve a discrepancy, treat outdated code or examples as a conformance gap and perform the authorized review or correction.
9. Stop only the calculation or handoff that depends on missing authority or an unresolved conflict; return the exact owner decision needed and complete independently supported analysis.

Validation:

- Every material financial decision traces to an accepted source instead of a skill example or utility behavior.
- Currency code, scale, unit-bearing fields, and formulas are unambiguous.
- Missing or conflicting code, scale, FX, or policy authority produces a blocked handoff, not an invented default or conversion.

### Workflow stage: Discover the canonical engine and real contours

Reuse verified project behavior without turning one repository layout or utility test suite into universal capability.

1. Inspect the target repository for an established money engine, its manifest, public exports, version, configuration model, behavioral docs, and tests; verify APIs before using the mapping reference.
2. Use the discovered public API when it satisfies the accepted contract, preserving existing types and DTOs. Apply the example profiles in the money-library reference only when that public contract actually matches; do not add a facade, wrapper, or migration to match example names.
3. An available engine constructor or compatibility profile is not currency authority, a currency registry, or an FX provider.
4. If no canonical engine exists, do not create a shared package automatically; keep one domain-specific formula with its owning module or route a genuinely shared boundary to architecture ownership.
5. For a local formula without an engine, enforce the same accepted code, scale, units, rounding, and range directly in its owning module. Missing currency authority blocks the dependent path; missing example API names do not.
6. Add a primitive to the canonical engine only when it is reusable financial behavior or a shared cross-contour boundary; keep one-off tariff or product formulas with the authoritative domain owner while composing engine primitives.
7. Inventory applicable contours separately, such as library unit, PostgreSQL, backend/domain integration, browser bundle, application UI, persistence, and external ledger integration.
8. Treat library availability, unit tests, generated fixtures, schemas, and wrappers as substrate for broader application or parity claims until the corresponding real contour is exercised.

Validation:

- The chosen project API or local formula preserves the accepted financial contract; no undocumented profile or absent package is assumed.
- Every claimed contour has a named runtime boundary and consumer.
- Shared-library changes are justified by current reuse or a protected boundary.

### Workflow stage: Implement the smallest contract-complete change

Preserve the accepted financial contract with explicit units and identical numeric semantics at every affected boundary.

1. Keep canonical amounts as integer minor units; cents specialize EUR, while another currency uses its authorized engine scale. Name any higher-precision intermediate separately.
2. Preserve the accepted amount and DTO representation. Currency, scale, and units may be explicit values or unambiguous fixed contract semantics; never reinterpret them or impose an example wire shape.
3. Preserve currency code and scale across browser, server, persistence, and integration contracts; reject mixed-currency or mixed-scale arithmetic and DTOs before calculation.
4. Apply the accepted rounding, fixation, sign, refund, reversal, and remainder rules. Test sign symmetry only when the named mode and operation promise it; a directed rounding mode need not be symmetric, and reversing a fixed amount can differ from calculating a new negative amount.
5. Use the public strict parsers and serializers when available; do not replace boundary validation with `BigInt(untrustedString)` or let one unitless string mean either integer minor units or human-entered major units.
6. Use the verified formatter contract and preserve the amount's currency and scale; changing presentation must not relabel an amount or imply an unperformed conversion.
7. Recompute or validate authoritative amounts on the server; browser previews and submitted totals are not persistence authority by themselves.
8. Match PostgreSQL denominator, rate, range, overflow, rounding, error, and tie-break behavior to the accepted contract and its owning numeric implementation; use widened exact intermediates when bigint multiplication can overflow.
9. Preserve the verified range, widened-intermediate, parser, and output-check guarantees; example profile details live in the money-library reference.
10. Reject empty or all-zero weighted allocations before any zero-total fast path when the engine contract does.
11. Respect the discovered configuration model. If the library has process-global settings, configure them at bootstrap and restore test changes; do not introduce globals into an instance-scoped or stateless implementation.

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
7. For a handoff, name the next owner and requested output, pass accepted rules and unresolved decisions without substituting library behavior for authority, and state which observations must return for bounded numeric re-check.

Validation:

- Green package or browser-bundle tests are not reported as SQL, application wiring, persistence, or end-to-end parity evidence.
- The final status follows the evidence matrix without substrate-only closure.

## Interop priority

- **tax applicability, tariff policy, accounting recognition, ledger accounts, and posting lifecycle:** Accepted legal, accounting, product, or financial specification. This skill implements and checks supplied financial rules; it does not invent them. Use `spec-engineer` to make accepted rules executable, not to create authority.
- **accepted product requirements, architecture ownership, and implementation-ready specification:** prd-engineer, architecture-engineer, or spec-engineer according to the remaining decision. Supply the accepted calculation contract and evidence limits. Product owns policy scope, architecture owns genuinely shared boundaries, and spec formalizes accepted behavior; do not require new design artifacts for an already specified local correction.
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
- **high** — Do not copy illustrative integer SQL until denominator, rate, overflow, range, rounding, error, and tie-break semantics match the accepted contract and its owning numeric implementation.
- **high** — Do not call package unit tests, browser-bundle tests, fixtures, schemas, or mocks cross-layer parity unless the claimed real contours executed the same fixtures.
- **high** — If the discovered library has process-global settings, do not change them per request or confuse them with per-engine currency/scale; preserve its actual configuration and test-isolation contract.
- **high** — Do not persist a browser preview or client-submitted total as authoritative without server-side recomputation or contract validation.
- **high** — Balanced integer amounts do not establish correct ledger accounts, recognition, audit, or posting lifecycle.

## Policies

### Authority-before-arithmetic policy
Require accepted, traceable financial rules before choosing formulas or defaults; utility APIs define arithmetic behavior, not business or legal authority.

### Explicit-units policy
Every persisted or transported amount and rate must carry unambiguous currency, minor-unit scale, and unit semantics in its schema, name, or discriminants; cents specialize EUR, and conversions occur only at authoritative named boundaries.

### Currency-profile policy
Use the accepted currency/scale through the discovered public API or an authorized local formula; reject missing authority, mixed currency/scale, manual relabeling, and unsupported FX. Example profiles do not require a new engine or DTO.

### Rounding and fixation policy
Rounding mode, precision, fixation points, and residual allocation are part of the accepted contract and must match across every affected contour.

### Canonical-engine discovery policy
Verify the target repository's current public numeric contract and tests; the money-library reference owns conditional example profiles. A path or API table is not proof of an available engine, currency registry, or conversion capability.

### Parity-claim policy
Claim parity only for the exact fixture identity and real contours that executed successfully; missing SQL, backend, browser, persistence, or application evidence remains explicit.

### Reporting contract
Report the authoritative calculation contract, affected contours, outcome, per-contour evidence matrix, anti-claims, residual risk, and an overall status no stronger than the weakest required contour.

## Required active references
- [Browser boundaries](references/browser.md) — Read this when browser input, preview, state, serialization, or formatting is in scope.
- [Database and SQL conformance](references/database-sql.md) — Read this when PostgreSQL storage, SQL formulas, allocation, or database parity is in scope.
- [Canonical money engine](references/money-library-usage.md) — Read this when discovering or using a money library, and for every non-EUR engine task.
- [Cross-layer parity evidence](references/parity-testing.md) — Read this before claiming parity or designing fixtures across two or more runtime contours.
- [Server and backend boundaries](references/server-backend.md) — Read this when DTOs, JSON serialization, server calculation, persistence, or backend configuration is in scope.
- [VAT and IVA arithmetic](references/vat-iva.md) — Read this when an accepted source requires forward VAT/IVA, reverse VAT/scorporo, or residual-minor-unit handling.

## Portability rules

- Do not require a machine-specific path, repository layout, external local file, or package name to understand or execute the core workflow.
- Discover project financial authorities and any canonical money engine; missing authority limits the dependent decision, while a sufficient local formula follows the explicit no-engine path.
- Keep all mandatory calculation, evidence, fallback, and reporting rules inside this skill folder.
- Treat formulas, rates, paths, API names, and project profiles as examples until verified against the target source.

## Portability checklist before finishing

- Confirm the generated SKILL links every conditionally required reference with its precise load trigger.
- Confirm copied-skill use has a deterministic discovery, fallback, or blocked path when no project money engine exists.
- Confirm no active instruction requires an absolute local path or external repository state.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
