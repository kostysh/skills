# Cross-Layer Parity Testing

## Goal
Guarantee identical outputs for identical inputs in:
- PostgreSQL formulas
- backend/domain code
- browser preview code

## Golden suite contents
- Forward VAT/IVA cases (simple exact examples).
- Rounding-sensitive VAT cases (for example `205.99` at 22%).
- Reverse VAT/scorporo cases (`total -> base`) including known `0.01` discrepancy scenarios.
- Allocation cases with deterministic remainder tie-break.
- Negative amount mirrors of all critical formulas.
- Zero-rate and zero-amount cases.

## Test implementation guidance
- Keep expected values as fixed literals, not recomputed from tested implementation.
- Assert both component values and total invariants.
- For allocation, assert:
  - exact sum equality,
  - deterministic ordering/tie-break behavior.

## Change protocol
When any financial formula changes:
1. Update spec/documentation first.
2. Update all affected golden tests.
3. Validate SQL/backend/browser parity before release.
4. Reject partial rollouts where only one layer changed.
