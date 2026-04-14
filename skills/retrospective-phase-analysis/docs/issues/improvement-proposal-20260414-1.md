# Предложение по улучшению 20260414-1: сделать `scan`-извлечение scope надежным на реальных session traces

## Контекст

Артефакты ретроанализа по сессии `019d7490-46d0-7811-b43f-056bb617a7ab` уже показали крупную tooling-проблему:

- релевантные stage logs существовали, но auto-detection вернул `0`;
- `scan-summary.json` расширил scope далеко за пределы реальной работы;
- backlog и feature extraction содержали malformed и явно non-canonical ids.

Я повторно запустил текущий `scan` на той же session trace и воспроизвел ту же проблему уже в текущей версии skill-а:

- `mentioned_backlog_items` все еще содержит значения вроде `CF-012.delivery_state`, `CF-018-backed`, `CF-XXX`, `CF-0`;
- `mentioned_features` все еще расширяется до `F-0001` ... `F-0017`;
- `candidate_stage_logs` все еще пуст;
- `candidate_review_artifacts` и `candidate_verification_artifacts` все еще выходят далеко за пределы реального session scope.

Текущие релевантные точки реализации:

- [SKILL.md](../../SKILL.md)
- [references/CLI.md](../../references/CLI.md)
- [references/REFERENCE.md](../../references/REFERENCE.md)
- [src/core/extract-trace-scope.ts](../../src/core/extract-trace-scope.ts)
- [src/core/build-scan-summary.ts](../../src/core/build-scan-summary.ts)

## Почему это заслуживает изменения

Это не косметическая проблема ложных срабатываний.

Когда `scan` так агрессивно расширяет scope:

- retrospective стартует со слабого evidence manifest;
- stage-log discovery становится ненадежным;
- candidate incidents либо недопроизводятся, либо размываются;
- оператор не может доверять summary как first-pass карте того, что реально произошло.

Это напрямую ослабляет главную ценность skill-а.

## Набор предложений

### P1. Заменить text-wide extraction на event-classified anchor extraction

#### Наблюдаемая проблема

Текущий extraction все еще слишком permissive:

- [extract-trace-scope.ts](../../src/core/extract-trace-scope.ts) рекурсивно собирает текст почти из всех event payload через `collectEventTexts(...)`;
- `mentioned_backlog_items` использует `CF-[A-Za-z0-9._-]+`, из-за чего принимает field suffixes, placeholders и truncated ids;
- `extractTouchedPaths(...)` парсит широкие path-shaped подстроки из raw text blobs, включая listings и helper output.

Из-за этого tool начинает воспринимать low-signal trace text как scope anchors.

#### Предлагаемое изменение

Перепроектировать scope extraction вокруг evidence classes, а не вокруг одного большого text pool.

Предпочтительный порядок anchors:

1. явные operator / agent references to canonical work ids;
2. явные command arguments и patch targets;
3. successful write targets;
4. напрямую referenced durable artifacts;
5. и только потом — очень консервативный fallback parsing из prose.

Также нужно ужесточить id rules так, чтобы `scan` принимал только canonical ids:

- backlog items: только digits, без suffixes, placeholders и field-access tails;
- features: только canonical `F-XXXX`;
- отбрасывать токены вроде `CF-012.delivery_state`, `CF-XXX`, `CF-0`, `CF-018-backed`.

Точки приложения:

- [src/core/extract-trace-scope.ts](../../src/core/extract-trace-scope.ts)
- [references/REFERENCE.md](../../references/REFERENCE.md)
- при необходимости явной фиксации contract: [SKILL.md](../../SKILL.md)

Ожидаемый эффект:

- `scan-summary.json` станет заметно уже и надежнее;
- `mentioned_backlog_items` и `mentioned_features` снова станут реальными scope anchors;
- уменьшится downstream artifact over-linking.

### P2. Разделить write-confirmed artifact linkage и listing/noise parsing

#### Наблюдаемая проблема

Тот же воспроизведенный запуск показывает, что tool все еще путает:

- реально измененные artifacts;
- directory listings;
- broad repo snapshots;
- partial или malformed path fragments.

Именно поэтому `touched_paths`, `candidate_review_artifacts` и `candidate_verification_artifacts` раздуваются до repo-wide sample, а `candidate_stage_logs` остаются пустыми.

Текущая логика все еще слишком сильно полагается на generic path-shaped substrings вместо confirmed write или direct-link evidence.

#### Предлагаемое изменение

Разделить artifact linkage на две строгие корзины:

1. write-confirmed artifacts
2. read-only references

Правила:

- только write-confirmed paths могут становиться `candidate_stage_logs`;
- read-only references могут становиться supporting evidence, но сами по себе не должны расширять stage scope;
- directory listings, recursive file dumps и help text никогда не должны становиться touched-path evidence;
- `candidate_review_artifacts` и `candidate_verification_artifacts` должны требовать либо прямой trace reference, либо одного high-confidence canonical anchor, а не широкого набора извлеченных feature ids.

Точки приложения:

- [src/core/extract-trace-scope.ts](../../src/core/extract-trace-scope.ts)
- [src/core/build-scan-summary.ts](../../src/core/build-scan-summary.ts)
- [test/scan.test.ts](../../test/scan.test.ts)

Ожидаемый эффект:

- исчезнет repo-wide artifact fan-out из одной noisy session trace;
- отсутствие stage logs станет осмысленным, а не ambiguous;
- точность first-pass retrospective заметно вырастет даже без полного report stage.

### P3. Потреблять dossier-side log anchors или manifests, когда они существуют

#### Наблюдаемая проблема

Logging review показал, что открытый gap сейчас лежит в цепочке:

`trace -> log discovery -> cross-skill ops telemetry`

Даже при более строгом trace parsing часть реальных сессий все равно не будет достаточно чисто экспонировать stage-log paths для deterministic discovery.

#### Предлагаемое изменение

Научить `retrospective-phase-analysis` потреблять dossier-side discovery aids, если они существуют, до перехода к heuristic stage-log linkage.

Кандидатные входы:

- stage-log metadata with trace anchors;
- session-level ops log для cross-skill episodes;
- явный log manifest или index.

Это предложение зависит от dossier-side work, но retrospective skill должен быть готов использовать такие anchors как first-class evidence, а не игнорировать их.

Точки приложения:

- [references/CLI.md](../../references/CLI.md)
- [references/REFERENCE.md](../../references/REFERENCE.md)
- [src/core/build-scan-summary.ts](../../src/core/build-scan-summary.ts)

Ожидаемый эффект:

- cross-skill telemetry станет тем, что retrospective tool реально умеет использовать;
- уменьшится число сессий, где stage-log linkage сваливается к weak heuristics;
- вырастет согласованность между dossier logging policy и retrospective consumption.

## Что не должно меняться

- Не расширять `scan` обратно в сторону broad repo reading.
- Не считать все `.dossier/logs` автоматически in-scope, когда trace linkage отсутствует.
- Не “чинить” это только в prose; проблема находится в runtime extraction behavior.

## Рекомендация

Это предложение стоит реализовывать с высоким приоритетом.

Почему:

- сбой текущий, а не исторический;
- он воспроизводится на реальной сессии, ради которой и делался retrospective;
- он подрывает доверие к first-pass output skill-а;
- затронутые поверхности локальны и хорошо тестируются.
