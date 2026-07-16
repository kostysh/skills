# VAT and IVA arithmetic

Read this reference when an accepted source requires forward VAT/IVA, reverse VAT/scorporo, or residual-cent handling.

## Required authority

Before calculating, obtain the accepted source, version or effective date, transaction scope, applicable rate, inclusive or exclusive basis, rounding mode, fixation point, and residual-cent policy. A 22% example demonstrates arithmetic only; it does not decide whether 22%, a reduced rate, zero rate, exemption, or another treatment applies.

## Forward calculation

For an accepted net amount and non-negative ppm rate:

```ts
const taxCents = mulRatePpm(netCents, ratePpm, roundingMode);
const grossCents = add(netCents, taxCents);
```

This fixes tax to cents before forming gross. Use it only when the accepted contract names that fixation point. Preserve the same rule for negative corrections or refunds when authority requires sign-symmetric behavior.

## Reverse calculation

For an accepted gross-authoritative contract:

```ts
const PPM = 1_000_000n;
const netCents = roundDiv(
  grossCents * PPM,
  PPM + BigInt(ratePpm),
  roundingMode,
);
```

The bigint engine can represent the widened numerator. A PostgreSQL implementation must use an exact widened intermediate and then enforce the accepted output range.

## Residual cent and higher precision

Reverse calculation can produce a net/tax pair whose forward recomposition differs from authoritative gross by one cent. Do not let the implementer choose silently. The accepted policy must say whether to:

- preserve gross and allocate the residual to a named component;
- accept the recomposed difference;
- use a separately named higher-precision intermediate and define its fixation;
- reject or route the case.

A higher-precision intermediate is not `MoneyCents`. Give it a distinct unit and prevent accidental persistence or DTO serialization as cents.

## Evidence

Use independently approved literals for ordinary, rounding-sensitive, zero-rate, negative/refund, reverse, and residual-cent cases. Record the source identity for each policy-bearing fixture. Formula agreement without applicability authority proves arithmetic only.
