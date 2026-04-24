# Implementation Log 13: operator-language dossier log policy

## Scope

Реализован [refactoring-plan-6.ru.md](../issues/refactoring-plan-6.ru.md) для [issues/improvement-proposal-20260423-1.md](../issues/improvement-proposal-20260423-1.md).

Цель изменения:

- добавить в active log contract правило языка оператора для authored narrative;
- сохранить exact machine-facing strings без перевода;
- разделить generated scaffold headings, machine-readable fields и agent-authored narrative content;
- зафиксировать, что runtime не делает automatic language detection или translation;
- защитить правило docs-contract тестом.

## Измененные active surfaces

### Telemetry and closure

Обновлен [references/telemetry-and-closure.md](../../references/telemetry-and-closure.md):

- `Agent-authored narrative content` в dossier logs теперь follows the operator language by default;
- explicit operator language preference wins;
- multilingual или ambiguous sessions используют язык текущего operator request, если нет explicit preference;
- generated scaffold headings могут оставаться stable English labels;
- commands, paths, identifiers, JSON keys, YAML frontmatter keys, tool names, skill names и direct quotes остаются exact;
- historical logs не переписываются только ради language normalization.

### Commandized stage control

Обновлен [references/commandized-stage-control.md](../../references/commandized-stage-control.md):

- mechanical scaffold generation не определяет language of authored narrative;
- stage-controller reruns и helper-owned closure updates сохраняют authored narrative sections without translation or normalization;
- stage-controller остается mechanical progress controller и не получает language intelligence.

### Runtime-facing boundary

Обновлены:

- [references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- [docs/utility-spec.ru.md](../utility-spec.ru.md)

Решение:

- runtime source не менялся;
- new CLI flags, language-selection schema или localization behavior не добавлялись;
- runtime/help surface не должен imply support for automatic operator-language detection, translation, or localization;
- stage-log bootstrap/update может materialize stable scaffold headings, но authored narrative body остается agent-owned.

## Tests

Обновлен [test/docs-contract.test.ts](../../test/docs-contract.test.ts):

- добавлен regression guard для operator-language log policy;
- тест защищает operator language, agent-authored narrative content, multilingual/ambiguous fallback, exact non-translated strings, generated scaffold headings и runtime non-translation boundary;
- существующий operator-facing narrative minimum test выровнен с новым `without translation or normalization` wording.

## External audit

Выполнен внешний аудит имплементации:

- scope признан соблюденным;
- runtime/CLI language detection или translation не обещаны;
- runtime source не менялся;
- деструктивных side effects и semantic drift вне issue не найдено.

Единственная low-находка: docs-contract guard не защищал multilingual/ambiguous fallback.
Находка закрыта добавлением assertions для `multilingual or ambiguous sessions` и `current operator request`.

## Verification

Выполнены проверки:

- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 58 tests.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer exec biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false test/docs-contract.test.ts` — pass.

Full package `format:check` не запускался в этом change set; targeted Biome check был достаточен для единственного измененного TypeScript файла.

## Notes

Это agent-authored narrative policy, а не CLI localization feature.
Runtime source не менялся, потому что issue требует методологическую language policy и guardrails против ложных runtime promises.
