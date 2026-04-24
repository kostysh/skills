# План добавления operator-language rule для логов досье

## Назначение

Этот план реализует [issue про язык оператора в логах досье](improvement-proposal-20260423-1.md).

Цель:

- добавить в active logging contract явное правило языка оператора;
- определить, что agent-authored narrative content в dossier logs по умолчанию пишется на языке оператора;
- сохранить точность commands, paths, identifiers, JSON/YAML keys, tool names, skill names и direct quotes;
- не смешивать язык authored narrative с generated scaffold headings и machine-readable fields;
- не обещать runtime language detection или automatic translation, если это не реализовано и не покрыто тестами.

## Подтвержденная проблема

Активная политика сейчас требует, чтобы логи были:

- human-readable Markdown artifacts;
- operator-facing;
- с narrative sections для non-trivial stages;
- с machine-readable fields в bounded structured fields.

Но active surface не фиксирует:

- на каком языке писать authored narrative sections;
- какие строки нельзя переводить;
- могут ли scaffold headings оставаться на английском;
- что делать при explicit operator preference или multilingual session;
- что runtime не выполняет automatic language detection / translation.

Из-за этого разные stage logs могут использовать разные языки, а exact evidence может быть ошибочно переведен.

## Фиксированные решения

- Agent-authored narrative content в dossier logs по умолчанию следует языку оператора.
- Operator language определяется агентом из текущего operator request или explicit operator preference; runtime не обязан и не должен автоматически определять язык.
- Если оператор явно просит другой язык логов, агент следует explicit preference и фиксирует это, когда релевантно.
- Если session multilingual или язык неоднозначен, агент выбирает язык текущего operator request и не переводит exact evidence.
- Generated scaffold headings могут оставаться stable English labels, если skill отдельно не вводит localization policy.
- Machine-readable fields остаются machine-readable; язык narrative не влияет на YAML/JSON keys, command names или artifact schemas.
- Commands, paths, identifiers, JSON keys, YAML frontmatter keys, tool names, skill names и direct quotes должны оставаться exact.
- Helper-owned updates должны сохранять authored content как есть и не переводить / нормализовать его.
- Исторические логи не переписываются только ради language normalization.
- При редактировании prose/contract surface этого skill-а разрешено вносить только изменения, прямо входящие в scope данного плана.
- Запрещено попутно улучшать, переписывать, дополнять или “подчищать” другие части skill-а, если эти правки не были явно запланированы в этом плане.

## Package 1. Провести inventory active log-language surface

### Цель

Определить все active/runtime-facing места, где нужно зафиксировать language boundary, не создавая лишних runtime obligations.

### Что входит

- Проверить active references:
  - `references/telemetry-and-closure.md`
  - `references/commandized-stage-control.md`
  - `references/runtime-and-command-boundary.md`
- Проверить `docs/utility-spec.ru.md`, если она описывает stage-log bootstrap/update, helper-owned closure writes, generated scaffold или narrative preservation.
- Проверить `test/docs-contract.test.ts`, чтобы понять существующую coverage вокруг operator-facing narrative minimum.
- Зафиксировать exact wording для:
  - `operator language`;
  - `agent-authored narrative content`;
  - exact strings that must not be translated;
  - generated scaffold headings;
  - runtime non-detection / non-translation boundary.

### Acceptance

- есть список active/runtime-facing мест, которые нужно менять;
- wording не обещает automatic language detection или translation;
- scope ограничен dossier log language policy и не меняет closure, audit или stage-controller semantics.

## Package 2. Обновить active telemetry/log contract

### Цель

Сделать operator-language rule частью canonical logging guidance.

### Что входит

- Обновить `references/telemetry-and-closure.md`, section `Log contract`.
- Добавить правило:
  - agent-authored narrative content follows the operator language by default;
  - explicit operator language preference wins;
  - ambiguous/multilingual session uses current operator request language unless explicit preference says otherwise.
- Ясно разделить:
  - authored narrative content;
  - stable scaffold headings;
  - machine-readable fields;
  - exact evidence strings.
- Перечислить exact strings, которые не переводятся:
  - commands;
  - paths;
  - identifiers;
  - JSON keys;
  - YAML frontmatter keys;
  - tool names;
  - skill names;
  - direct quotes.

### Acceptance

- active telemetry reference явно говорит, что authored log narrative по умолчанию следует языку оператора;
- exact non-translated strings перечислены в active guidance;
- generated scaffold headings и machine-readable fields не смешиваются с narrative language.

## Package 3. Выровнять stage-control и helper-preservation boundary

### Цель

Убедиться, что stage-controller/helper behavior не подразумевает автоматический выбор языка или перевод authored content.

### Что входит

- Обновить `references/commandized-stage-control.md`, если Package 1 подтвердит wording gap.
- Зафиксировать:
  - stage-controller command may materialize stable scaffold headings;
  - authored narrative language remains agent-owned;
  - helper-owned updates preserve authored narrative sections without translation or normalization;
  - mechanical scaffold generation does not determine the language of authored narrative.

### Acceptance

- active stage-control boundary не создает впечатления, что CLI выбирает язык authored narrative;
- helper-owned closure writes сохраняют существующий authored content без language normalization;
- stage-controller остается mechanical progress controller.

## Package 4. Выровнять runtime-facing utility specification

### Цель

Сохранить честную runtime boundary: методология требует operator-language narrative, но CLI не обещает language intelligence.

### Что входит

- Обновить `docs/utility-spec.ru.md`, если там есть stage-log bootstrap/update или helper-owned closure wording.
- Добавить runtime-facing boundary:
  - generated scaffold headings can remain stable;
  - authored narrative body is agent-owned and follows active operator-language policy;
  - runtime/helper updates preserve authored content without translation;
  - no automatic language detection or translation is part of the shipped runtime unless separately implemented and tested.
- Проверить `references/runtime-and-command-boundary.md`, нужен ли negative rule against language-detection promises in help/runtime surface.

### Acceptance

- utility spec aligned with active log contract;
- runtime/help surface не обещает automatic language detection / translation;
- no new CLI flags, output fields, or language-selection schema are documented unless runtime and tests actually ship them.

## Package 5. Поставить docs-contract regression guards

### Цель

Защитить language policy от повторной потери.

### Что входит

- Обновить `test/docs-contract.test.ts`.
- Добавить assertions на active refs, минимум:
  - `references/telemetry-and-closure.md`;
  - `references/commandized-stage-control.md`, если меняется;
  - `docs/utility-spec.ru.md`, если меняется;
  - `references/runtime-and-command-boundary.md`, если меняется.
- Suggested assertion terms:
  - `operator language`;
  - `agent-authored narrative content`;
  - `commands, paths, identifiers, JSON keys`;
  - `YAML frontmatter keys`;
  - `Generated scaffold headings`;
  - `without translation or normalization`;
  - `automatic language detection or translation`.

### Acceptance

- docs-contract падает, если active logging guidance теряет operator-language rule;
- tests защищают exact non-translated strings;
- tests защищают runtime non-detection / non-translation boundary;
- tests не требуют runtime behavior, которого нет.

## Package 6. Обновить docs navigation и implementation log

### Цель

Сделать изменение восстановимым для будущего maintainer-а.

### Что входит

- Обновить `docs/README.md`, добавив этот refactoring plan.
- После имплементации создать следующий `implementation-log-*.ru.md`.
- В implementation log зафиксировать:
  - какие active refs изменены;
  - почему runtime source не менялся или какие runtime-facing docs были выровнены;
  - какие docs-contract tests защищают правило;
  - какие проверки запускались;
  - был ли full `format:check` ограничен pre-existing unrelated formatting gap.

### Acceptance

- document map ведет к issue и plan;
- implementation log объясняет language policy decision и runtime boundary;
- future maintainer понимает, что это agent-authored narrative policy, а не CLI localization feature.

## Порядок реализации

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5
6. Package 6

Причина:

- сначала нужно определить active/runtime-facing language surface;
- затем добавить canonical log-language rule;
- после этого выровнять stage-control/helper и utility boundaries;
- затем поставить regression guards;
- navigation/log обновляются в конце, когда final scope понятен.

## Verification Plan

Минимальные проверки после реализации:

- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`

Если менялся TypeScript test:

- `pnpm --filter @kostysh/unified-dossier-engineer exec biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false test/docs-contract.test.ts`

Если менялись runtime/help source или generated launcher:

- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help <affected-command>`

Если менялись только Markdown docs и docs-contract tests:

- package `test` остается главным verification gate, потому что docs-contract живет в package tests.

## Основные риски

### 1. Случайно пообещать runtime language detection

Риск:

wording будет звучать так, будто CLI сам определяет язык оператора или переводит логи.

Сдерживание:

- явно писать, что operator language is agent-owned;
- runtime не promises automatic language detection or translation unless separately implemented and tested.

### 2. Перевести exact evidence

Риск:

агент начнет локализовать commands, paths, identifiers, JSON/YAML keys или direct quotes.

Сдерживание:

- active rule должен перечислять non-translated exact strings;
- docs-contract должен защищать этот список.

### 3. Перепутать scaffold headings и authored narrative

Риск:

generated scaffold headings начнут считаться обязательной локализационной поверхностью или, наоборот, английские headings будут использоваться как повод писать всю narrative на английском.

Сдерживание:

- явно разделить stable scaffold headings и agent-authored narrative content;
- разрешить stable English scaffold labels без отмены operator-language narrative.

### 4. Расширить scope до исторических логов

Риск:

implementation начнет переписывать existing historical logs ради language normalization.

Сдерживание:

- non-goal: historical logs are not rewritten only for language normalization;
- изменения ограничены active guidance, runtime-facing boundary, tests и docs navigation/log.
