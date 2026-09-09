# Canonical money engine

Read this reference when discovering, using, or extending a project-owned money library, especially for a non-EUR task.

## Discover before use

Inspect the target repository rather than assuming a package path:

1. locate the established owner of money representation and arithmetic;
2. read its manifest, public exports, version, behavioral documentation, configuration model, and tests;
3. confirm which runtimes consume it today;
4. distinguish public API from internal files or undocumented subpaths;
5. record any required behavior the engine does not expose.

If no canonical engine exists, do not create a generic package for one local formula. Keep the formula with the authoritative domain owner unless current reuse or a cross-contour boundary justifies shared ownership.

## Currency authority and readiness

EUR remains the default and first-class profile. Use another currency only when an accepted project, product, legal, accounting, or maintained currency-data source supplies both:

- the exact currency code;
- the authoritative integer `minorUnitDigits` for the relevant contract and effective period.

A factory that accepts exactly three uppercase ASCII letters and scale `0..20` performs structural validation only. It does not prove ISO 4217 membership, current metadata, legal applicability, or that the caller chose the right scale. Missing or conflicting non-EUR scale is a blocked authority question, never a reason to default to two digits.

## Compatible EUR facade profile

When the discovered package publicly exposes this profile with matching contracts, retain it for EUR compatibility work:

| Need | Public API and contract |
| --- | --- |
| Canonical EUR amount | `MoneyCents = bigint`, representing EUR cents |
| Built-in engine form | Immutable `EUR` definition with code `EUR` and `minorUnitDigits: 2` when an engine-shaped EUR amount is required |
| Parse human EUR input | `parseEurToCents`: strict major-unit string to cents |
| Format EUR | `formatEurCents(cents, { locale? })`; currency is always EUR |
| EUR DTO | `EurCentsDto` with `{ currency: 'EUR', amountCents }`, plus public strict parse/serialize helpers when exported |
| Arithmetic | Top-level `add`, `sub`, `neg`, `abs`, `compare`, `isZero`, `sign`, `div`, `mulRatePpm`, and `roundDiv` |
| Allocation | Top-level `allocateEqual` and `allocateByWeights` |

Do not add a `currency` option to `formatEurCents`. `FormatOptions` contains only optional `locale`; passing USD, JPY, or another label for EUR cents is relabeling, not conversion.

## Compatible generic currency-engine profile

For an authorized non-EUR code/scale, verify and use a separately constructed immutable engine:

```ts
const engine = createCurrencyEngine({ code, minorUnitDigits });
```

The compatible profile is:

| Need | Public API and contract |
| --- | --- |
| Tagged amount | `CurrencyAmount<TCode>` with `currency`, `minorUnitDigits`, and bigint `minorUnits` |
| Major-unit input | `engine.parseMajorUnits(input)` |
| Presentation | `engine.format(amount, { locale? })`; code and scale come from the engine definition |
| DTO boundary | `engine.parseDto(input)` and `engine.serializeDto(amount)` using `{ currency, minorUnitDigits, amountMinorUnits }` |
| Explicit wrapping | `engine.fromMinorUnits(value)` and `engine.toMinorUnits(amount)` |
| Arithmetic | `engine.add`, `sub`, `neg`, `abs`, `compare`, `isZero`, `sign`, `div`, and `mulRatePpm` |
| Allocation | `engine.allocateEqual` and `engine.allocateByWeights` |

Preserve the tagged amount while it is in domain code. The engine must check both currency and scale at runtime before unwrapping, so mixed currency or mixed scale fails closed even if callers bypass static types. Do not unwrap two amounts and combine their raw `bigint` values outside that guard.

The factory is not a plugin registry, discovery mechanism, ISO catalog, or FX service. Creating two engines does not establish a conversion rate or authorize conversion between them.

## DTO and parsing boundary

Use public strict parsers and serializers instead of `BigInt(untrustedString)`. A compatible DTO parser checks exact keys, canonical base-10 integer syntax, currency, scale, and range. The DTO contracts remain distinct:

```text
EUR:     { currency: 'EUR', amountCents }
generic: { currency, minorUnitDigits, amountMinorUnits }
```

DTO parse/serialize range validation applies independently of safe/unsafe calculation mode when the discovered package promises that contract.

## Safety and configuration profile

Verify these behaviors rather than inferring them from a preset name:

- `postgresql` and `nodejs` compatibility ranges cover full signed int64 minor units: `-9_223_372_036_854_775_808n..9_223_372_036_854_775_807n`;
- public `roundDiv` accepts a widened exact bigint numerator and range-checks its final result in safe mode;
- weighted allocation rejects empty input and all-zero weights even when total is zero;
- a valid zero-total weighted allocation returns zero parts;
- process-global locale, math mode, compatibility mode, and resource limits are configured once at bootstrap and reset between tests;
- each engine's immutable code/scale definition is separate from that process-global configuration.

A compatibility mode describes a local range/resource policy. It is not PostgreSQL execution, browser application wiring, persistence, or cross-layer parity evidence.

## Extension decision

Add a primitive to the canonical engine only when at least one is true:

- multiple current consumers need the same financial behavior;
- SQL, backend, and browser require one shared numeric contract;
- a public compatibility or safety boundary must be centralized.

Keep tariff-specific composition, product eligibility, tax applicability, FX policy, and ledger policy outside the arithmetic engine. Any extension requires public export, behavioral documentation when non-trivial, unit tests, affected runtime tests, and application consumption before claiming delivered capability.
