# Лог имплементации 11: очистка active surface от stale wording

## Что изменено

- Source bundle переведен на самодостаточное present-tense wording без описания текущего skill-а через deleted split skills или merge-era identity.
- В [skill.yaml](../../skill.yaml), source fragments и active references:
  - удалены формулировки про `merged skill`, `merged runtime`, `merged target`;
  - удалены live references к split `backlog-engineer` / `dossier-engineer`;
  - active prose упрощена до текущей canonical модели: этот skill, этот runtime, canonical `.dossier` + `docs/ssot`, launcher `dossier-engineer`.
- Operator-facing runtime wording выровнено:
  - global help больше не говорит языком merge narrative;
  - init-materialized `.dossier/backlog/AGENTS.md` больше не содержит stale identity wording;
  - partial-success warning у `feature-intake` больше не использует stale merge wording.
- Перегенерированы [SKILL.md](../../SKILL.md) и [compile-report.md](../compile-report.md).
- Regression guards усилены в [test/docs-contract.test.ts](../../test/docs-contract.test.ts) и [test/cli.test.ts](../../test/cli.test.ts):
  - generated skill больше не должен возвращаться к deleted split-skill wording;
  - help surface больше не должен возвращаться к merge-era identity phrasing.

## Что сознательно не менялось

- Не переписывались historical `docs/issues/*`, старые refactoring plans и implementation logs вне требуемого индекса.
- Не менялась функциональность runtime, кроме user-facing wording.
- Не проводились попутные prose-cleanups вне scope `refactoring-plan-4`.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

## Ожидаемый итог

После этого цикла:

- active surface описывает только текущий canonical skill;
- generated `SKILL.md` self-contained и present-tense;
- help/runtime/init-generated wording не подталкивает агента искать deleted skills;
- docs-contract/tests не дают stale wording silently вернуться позже.
