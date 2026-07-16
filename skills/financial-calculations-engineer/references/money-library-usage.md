# Canonical money engine

Read this reference when discovering, using, or extending a project-owned money library.

## Discover before use

Inspect the target repository rather than assuming a package path:

1. locate the established owner of money representation and arithmetic;
2. read its manifest, public exports, version, behavioral documentation, configuration model, and tests;
3. confirm which runtimes consume it today;
4. distinguish public API from internal files or undocumented subpaths;
5. record any required behavior the engine does not expose.

If no canonical engine exists, do not create a generic package for one local formula. Keep the formula with the authoritative domain owner unless current reuse or a cross-contour boundary justifies shared ownership.

## Compatible `money` API profile

When the discovered package publicly exports the following APIs with matching contracts, use them instead of ad-hoc arithmetic:

| Need | Public API and contract |
| --- | --- |
| Parse human EUR input | `parseEurToCents`: trimmed plain decimal string, dot or comma separator, zero to two fractional digits, no grouping separators |
| Add or subtract cents | `add`, `sub` |
| Sign operations | `neg`, `abs`, `sign`, `compare`, `isZero` |
| Apply non-negative rate | `mulRatePpm`: integer ppm in `0..1_000_000`, explicit rounding mode |
| Divide or round ratio | `div`, `roundDiv`: non-zero divisor; `roundDiv` requires a positive denominator |
| Equal allocation | `allocateEqual` |
| Weighted allocation | `allocateByWeights`: non-negative bigint weights and input-order tie-break |
| Format presentation | `formatEurCents`; output is presentation only and must not be parsed as canonical input |
| Runtime guards | `setCompatibilityMode`, `setResourceLimits`, `setMathMode`, and reset helpers when actually exported |

Verify these names and semantics against the target package at invocation time. This table is a compatible profile, not proof that the package exists or has not changed.

## Configuration boundary

The compatible engine uses process-global mutable configuration. Configure it once at application bootstrap in this order:

1. compatibility mode;
2. resource-limit overrides;
3. safe math mode;
4. locale, when the application owns a global default.

Do not change global policy per request. Reset locale and safe-math configuration between tests to prevent order-dependent results.

Safe mode validates configured ranges and resources; it does not supply business authority, SQL conformance, persistence wiring, or application parity.

## Extension decision

Add a primitive to the canonical engine only when at least one is true:

- multiple current consumers need the same financial behavior;
- SQL, backend, and browser require one shared numeric contract;
- a public compatibility or safety boundary must be centralized.

Keep tariff-specific composition, product eligibility, tax applicability, and ledger policy outside the arithmetic engine. Any extension requires public export, behavioral documentation when non-trivial, unit tests, affected runtime tests, and application consumption before claiming delivered capability.
