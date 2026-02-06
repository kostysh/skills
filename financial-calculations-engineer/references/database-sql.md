# Database and SQL Patterns

## Storage model
- Store canonical money in cents: `amount_cents BIGINT NOT NULL`.
- Store rates separately, prefer ppm integers: `rate_ppm INT`.
- Use SQL views for display (`amount_cents::numeric / 100`) instead of storing formatted values.

## Deterministic SQL formulas
Recommended half-away-from-zero integer division helper:

```sql
create or replace function round_div_half_away_from_zero(numerator bigint, denominator bigint)
returns bigint
language sql
immutable
as $$
  select case
    when denominator = 0 then null
    when numerator >= 0 then (numerator + (denominator/2)) / denominator
    else - ((-numerator + (denominator/2)) / denominator)
  end;
$$;
```

Rate application with ppm:

```sql
create or replace function mul_rate_ppm_cents(amount_cents bigint, rate_ppm int)
returns bigint
language sql
immutable
as $$
  select round_div_half_away_from_zero(amount_cents * rate_ppm::bigint, 1000000);
$$;
```

## Allocation
- Use deterministic largest-remainder allocation for weighted distribution.
- Guarantee invariants:
  - each row is integer cents,
  - sum of allocated rows equals original total,
  - tie-break rule is deterministic.

## Parity requirement
- SQL formulas must match `packages/money` semantics exactly.
- Maintain shared golden cases tested in SQL + backend + browser.
