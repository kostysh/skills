# Database and SQL conformance

Read this reference when PostgreSQL storage, SQL formulas, allocation, or database parity is in scope.

## Storage contract

- Store canonical EUR cents in `BIGINT` only when the accepted range fits signed int64.
- Store integer rates separately and add constraints matching the canonical engine, such as ppm `0..1_000_000` when that is the accepted API contract.
- Store currency, source/version, rounding/fixation policy, or calculation provenance when the owning specification requires them.
- Never store localized display strings as calculation inputs.

## SQL conformance contract

Do not copy an unchecked rounding helper. A project-owned SQL implementation must explicitly match the canonical engine for:

| Concern | Required behavior |
| --- | --- |
| Denominator | Reject zero and any sign the engine rejects; do not silently return `NULL` |
| Rate | Enforce the same integer unit and bounds |
| Rounding | Implement only named modes with matching positive and negative tie behavior |
| Intermediate arithmetic | Use exact widened arithmetic such as `numeric`, or prove inputs cannot overflow before division |
| Output | Check the final result against the accepted bigint/int64 range before casting |
| Errors | Preserve an explicit, tested error contract instead of converting invalid input to a value |
| Allocation | Guarantee sum equality and use an explicit stable business key or ordering for remainder ties |

`amount_cents * rate_ppm` can overflow PostgreSQL `BIGINT` even when the rounded result fits `BIGINT`. Casting only the final result is too late; widen or preflight the intermediate expression.

## Required real-PostgreSQL cases

Execute the same fixed fixture identities against the canonical engine and PostgreSQL. Include:

- positive, zero, and negative amounts;
- exact divisions and positive/negative ties;
- zero and rejected negative denominators;
- minimum, maximum, and just-outside accepted rates;
- accepted output extrema and intermediate-overflow cases;
- output-range failures;
- allocation ties with rows supplied in different physical orders;
- rollback or persistence behavior when calculation fails.

SQL text, a migration file, a generated fixture, or a JavaScript test named “matches SQL” is not SQL evidence. Record the database command, fixture version, observed rows or errors, and environment identity.
