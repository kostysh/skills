# Money Library Usage

## Canonical rule
- Treat `packages/money` as the canonical implementation for EUR money logic.
- Keep feature code thin. Put reusable money behavior into `packages/money` plus tests.

## API mapping

| Business task | `money` API |
| --- | --- |
| Parse user amount string | `parseEurToCents` |
| Add/subtract amounts | `add`, `sub` |
| Sign and absolute handling | `neg`, `abs`, `sign` |
| Apply VAT/discount rate | `mulRatePpm` |
| Explicit division with rounding | `div`, `roundDiv` |
| Split amount equally | `allocateEqual` |
| Split amount by weights | `allocateByWeights` |
| Locale formatting for UI | `formatEurCents` |
| Runtime validation guardrails | `setMathMode`, `setCompatibilityMode`, `setResourceLimits` |

## Correct patterns
- Parse at boundaries, then keep only `bigint` cents in domain state.
- Pass explicit rounding mode for every operation that can produce fractions.
- Prefer ppm rates (`22% = 220_000`) to avoid decimal ambiguity.
- Add regression tests for every new business formula.

## Anti-patterns
- Performing money math with `number` or `parseFloat`.
- Copying VAT formulas into random service modules.
- Formatting amounts before business calculations complete.
- Rounding at multiple intermediate steps without clear fixation points.
- Maintaining separate "almost same" money helpers outside `packages/money`.

## Extension protocol
When business needs a new money primitive:
1. Add function to `packages/money/src`.
2. Add unit tests in `packages/money/test`.
3. Use the new function in app code.
4. Document usage in `packages/money/docs` if behavior is non-trivial.
