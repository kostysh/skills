# VAT and IVA arithmetic

Read this reference when an accepted source requires forward VAT/IVA, reverse VAT/scorporo, or residual-minor-unit handling.

## Required authority

Before calculating, obtain the accepted source, version or effective date, transaction scope, currency code and minor-unit scale, applicable rate, inclusive or exclusive basis, rounding mode, fixation point, and residual-minor-unit policy. A 22% example demonstrates arithmetic only; it does not decide whether 22%, a reduced rate, zero rate, exemption, or another treatment applies.

## Forward calculation

For an accepted EUR net amount and non-negative ppm rate, keep the compatible facade:

```ts
const taxCents = mulRatePpm(netCents, ratePpm, roundingMode);
const grossCents = add(netCents, taxCents);
```

This fixes tax to cents before forming gross. Use it only when the accepted contract names that fixation point. Preserve the same rule for negative corrections or refunds when authority requires sign-symmetric behavior.

For another authorized currency, use only the matching engine methods so tags survive:

```ts
const tax = engine.mulRatePpm(net, ratePpm, roundingMode);
const gross = engine.add(net, tax);
```

The engine definition must match the accepted code and scale. Reject mixed currency/scale instead of unwrapping amounts and combining raw values.

## Reverse calculation

For an accepted EUR gross-authoritative contract using the verified top-level exact helper:

```ts
const PPM = 1_000_000n;
const netCents = roundDiv(
  grossCents * PPM,
  PPM + BigInt(ratePpm),
  roundingMode,
);
```

The bigint helper accepts the widened numerator and range-checks the result under the verified safety profile. A PostgreSQL implementation must use an exact widened intermediate and then enforce the accepted output range.

Do not assume the generic engine exposes a reverse-VAT primitive when it does not. Keep a required non-EUR reverse formula with its authoritative domain owner or justify a shared engine extension; any unwrap/rewrap path must preserve the same engine code/scale, exact widened arithmetic, output range, and fixation contract.

## Residual cent and higher precision

Reverse calculation can produce a net/tax pair whose forward recomposition differs from authoritative gross by one minor unit. Do not let the implementer choose silently. The accepted policy must say whether to:

- preserve gross and allocate the residual to a named component;
- accept the recomposed difference;
- use a separately named higher-precision intermediate and define its fixation;
- reject or route the case.

A higher-precision intermediate is not a canonical `MoneyCents` or `CurrencyAmount`. Give it a distinct unit and prevent accidental persistence or DTO serialization as canonical minor units.

## Evidence

Use independently approved literals for ordinary, rounding-sensitive, zero-rate, negative/refund, reverse, and residual-minor-unit cases. Record the source identity for each policy-bearing fixture. Formula agreement without applicability authority proves arithmetic only.
