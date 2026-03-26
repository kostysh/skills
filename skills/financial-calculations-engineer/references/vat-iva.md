# VAT and IVA Patterns

## Forward calculation (imponibile -> IVA -> totale)
- Use `mulRatePpm(imponibileCents, 220_000, mode)` for IVA 22%.
- Quantize IVA to cents first, then compute `totale = imponibile + iva`.
- For IVA 0%, keep `ratePpm = 0`.

## Reverse calculation (scorporo IVA 22%)
Use explicit integer formula with rounding:

```ts
const imponibileCents = roundDiv(totalCents * 100n, 122n, 'HALF_AWAY_FROM_ZERO');
```

## Expected edge behavior
- `total 1000.00` can round-trip with `imponibile 819.67`.
- `total 2000.00` may produce `imponibile 1639.34`, then forward calculation yields `1999.99`.
- This `0.01` gap is expected when base is constrained to two decimals.

## Handling 0.01 scorporo gap
Choose one policy and keep it explicit:
1. Treat total as authoritative and accept derived-base rounding gap.
2. Keep higher precision for intermediate base (for example 3 decimals) and quantize final payable amount.
3. Avoid repeated intermediate rounding across chained steps.

## Regression policy
- Keep accountant-provided VAT examples as golden tests.
- Never change rounding behavior without updating tests and docs.
