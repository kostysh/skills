# Improvement Proposal: добавить правило языка оператора для логов досье

## Проблема

Активный контракт логирования `unified-dossier-engineer` требует, чтобы логи досье оставались human-readable и operator-facing, но не говорит явно, на каком языке агент должен писать авторские narrative-секции.

Текущая активная политика сохраняет:

- human-readable Markdown-логи;
- operator-facing narrative context;
- обязательный narrative scaffold для `feature-intake` и основных stage logs;
- machine-readable поля в bounded structured fields, а не вывод из prose.

Но она не фиксирует явно:

- должна ли авторская narrative-часть логов следовать языку оператора;
- какие части могут оставаться на английском как стабильная machine-facing структура;
- что делать в мультиязычной сессии или при явном предпочтении оператора;
- являются ли generated scaffold headings локализуемыми или стабильными английскими labels.

## Почему это важно

Логи досье не только mechanical lifecycle telemetry. Они также являются operator-facing process evidence для retrospective review, process improvement и будущего handoff.

Если оператор работает на русском, итальянском или другом неанглийском языке, English-only narrative sections снижают полезность:

- `Operator feedback`;
- `Decisions / reclassifications`;
- `Backlog follow-up`;
- `Process misses`;
- `Close-out`;
- retrospective-ready process evidence.

Без явного правила агенты могут импровизировать непоследовательно:

- один stage log будет написан на языке оператора;
- другой будет написан на английском, потому что scaffold headings английские;
- direct quotes, commands, identifiers и machine fields могут быть ошибочно переведены;
- будущему retrospective analysis придется угадывать language intent по смешанной прозе.

## Текущая активная поверхность

Релевантные активные references:

- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Commandized stage control](../../references/commandized-stage-control.md)

Текущий контракт говорит, что логи должны оставаться human-readable и operator-facing, но не содержит operator-language rule.

## Требуемое исправление

Добавить явное operator-language rule в активный logging contract.

Рекомендуемая политика:

- Agent-authored narrative content в dossier logs по умолчанию должен использовать язык оператора.
- Stable scaffold headings могут оставаться на английском, если skill отдельно не вводит localization policy.
- Commands, paths, identifiers, JSON keys, YAML frontmatter keys, tool names, skill names и direct quotes должны оставаться точными.
- Если оператор явно просит другой язык логов, нужно следовать явному предпочтению оператора и фиксировать это, когда релевантно.
- Если сессия мультиязычная или язык оператора неоднозначен, выбирать язык текущего operator request и не переводить exact evidence.

## Что должно измениться

### 1. Active telemetry reference

Обновить [Telemetry and closure](../../references/telemetry-and-closure.md), чтобы определить language rule для authored narrative sections.

Правило должно быть рядом с log contract и прояснять границу между:

- human-authored narrative content;
- stable scaffold labels;
- machine-readable fields;
- exact evidence strings.

### 2. Stage-control reference

Обновить [Commandized stage control](../../references/commandized-stage-control.md), если нужно, чтобы stage-controller behavior не создавал впечатление, что mechanical scaffold generation определяет язык authored narrative content.

### 3. Runtime / utility specification

Если runtime или utility-spec описывает stage-log bootstrap/update behavior, выровнять это с language boundary:

- generated scaffold headings могут оставаться стабильными;
- authored narrative body принадлежит агенту и должен следовать operator-language policy;
- helper-owned updates должны сохранять authored content без перевода или нормализации.

### 4. Tests

Добавить или обновить docs-contract coverage, чтобы это правило не регрессировало.

Предлагаемые assertion terms:

- `operator language`
- `agent-authored narrative content`
- `commands, paths, identifiers, JSON keys`
- `Generated scaffold headings`

## Acceptance Criteria

Issue считается исправленным только когда:

- активная logging guidance явно говорит, что agent-authored dossier log narrative по умолчанию следует языку оператора;
- активная guidance ясно перечисляет exact strings, которые не должны переводиться;
- generated scaffold headings и machine-readable fields не смешиваются с языком authored narrative;
- docs-contract tests защищают правило;
- runtime не обещает automatic language detection или translation, если это не реализовано и не покрыто тестами.

## Non-Goals

- Не добавлять automatic language detection в CLI без отдельной спецификации и тестов.
- Не локализовать YAML keys, JSON keys, command names, paths, identifiers или tool names.
- Не переписывать historical logs только ради нормализации языка.
- Не требовать перевода всех generated scaffold headings.
