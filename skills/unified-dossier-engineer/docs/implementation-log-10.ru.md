# Лог имплементации 10: восстановление обязательной audit policy

## Что изменено

- Добавлен новый active reference [references/audit-policy.md](../references/audit-policy.md) как единый canonical source of truth для dossier-stage audit policy.
- Active refs и utility spec выровнены так, чтобы:
  - every mutating dossier stage required external review before truthful closure;
  - `implementation` имел explicit `non-code` vs `code-bearing` review scope;
  - `review-artifact` оставался узким persistence helper;
  - `dossier-step-close` валидировал required audit bundle, а не один generic review artifact.
- Runtime widened from single-review semantics to audit-bundle semantics:
  - `review-artifact` now persists `audit_class`, `review_mode`, provenance, invalidation, implementation scope, and security trigger data;
  - `dossier-step-close` now accepts repeatable `--review-artifact`;
  - closure blocks on missing, self-review, invalidated, or stale required audits;
  - implementation close-out distinguishes `non-code` and `code-bearing` bundles.
- Helper trust path no longer treats Markdown stage logs as the machine policy oracle:
  - helper-managed stage state now lives under `.dossier/stages/*`;
  - implementation scope and current-cycle review-bundle membership are read from stage state during helper validation;
  - helper-owned stage-log rewrites mirror state but no longer define policy truth.
- External-independence validation now follows the bounded `process-trust` model:
  - `review-artifact` stamps `reviewer_thread_id` when the current runtime exposes it;
  - `dossier-step-close` rejects same-thread reviews when both author and reviewer thread provenance are available;
  - runtime no longer overclaims tamper-resistant provenance from repo-local stage state;
  - required implementation audits fall back to `code-bearing` whenever dirty or untracked non-`.dossier/` paths break the recorded `non-code` claim.
- Stage-log / lifecycle observability restored for review policy:
  - required vs executed audit classes;
  - reviewer skills / agent ids;
  - degraded / invalidated / stale review signals;
  - implementation security-review requirement and trigger reasons.

## Что сознательно не менялось

- Не затрагивались stale merge-era wording issues вне scope этого плана.
- Не добавлялись новые command families или новые review helpers.
- Не переписывались unrelated active refs и runtime areas, не связанные с audit policy.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `skill-source-compiler lint`
- `skill-source-compiler compile`
- `skill-source-compiler check`
- `git diff --check`

## Ожидаемый итог

Merged skill снова имеет:

- stage-wide mandatory external review baseline for all mutating dossier stages;
- explicit implementation audit bundle policy;
- runtime-enforced rejection of self-review substitutes;
- durable observability for required-vs-executed audit coverage.
