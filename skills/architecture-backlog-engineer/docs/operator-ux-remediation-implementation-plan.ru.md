# План имплементации `operator-ux-remediation-spec`

## 1. Цель

Реализовать [operator-ux-remediation-spec.ru.md](./operator-ux-remediation-spec.ru.md) без расхождений между:

- `SKILL.md`;
- `references/standard.md`;
- `references/artifact-model.md`;
- CLI/runtime в `src/`;
- generated/operator-facing output (`status`, `delta`, `report.md`);
- test surface в `test/cli.test.mjs`.

Итоговое состояние: operator-facing UX и machine-check contract совпадают, документ не оставляет открытых вопросов и готов к прямой реализации.

## 2. Источники истины

- каноническая спецификация: `docs/operator-ux-remediation-spec.ru.md`
- operator-facing use cases: `docs/operator-use-cases.ru.md`
- skill contract: `SKILL.md`
- нормативная методика: `references/standard.md`
- artifact model: `references/artifact-model.md`
- runtime surface:
  - `src/cli.ts`
  - `src/discovery/common.ts`
  - `src/discovery/source-runtime.ts`
  - `src/discovery/discover-run.ts`
  - `src/discovery/repair-run.ts`
  - `src/discovery/validate-run.ts`
  - `src/discovery/drift-state.ts`
  - `src/discovery/delta-run.ts`
  - `src/discovery/rebaseline-run.ts`
  - `src/discovery/status-run.ts`
  - `src/discovery/render-views.ts`
  - `src/discovery/init-run.ts`
- tests: `test/cli.test.mjs`

## 3. Неподвижные решения для реализации

1. Канонический packet key внутри `DiscoverySourcePacket.source` — только `source_id`; `sourceId` остаётся внутренним CLI/runtime именем только для `SourceInputSpec`.
2. Канонический outcome event для lineage и `UC-28` — `report_rendered` с `render_reason=mutating_command`.
3. `command_run_id` создаётся заново для каждого top-level CLI invocation; auto-render той же команды использует тот же `command_run_id`; retry получает новый.
4. `render` остаётся recovery-командой: он может переписать generated files, но не меняет canonical run-state и не сдвигает stale lineage.
5. Новый canonical file не добавляется; исторический контекст хранится в `journal.ndjson`.
6. Минимальный required contract для `negative_scope` реализуется как в спецификации и validator contract, без скрытых “optional by convention” полей.
7. `assessment.stats` становится фиксированным operator-facing metric set; все ключи обязательны, отсутствующие сущности сериализуются как `0`.
8. Вся новая статистика, freshness-диагностика и rendered output вычисляются из deduplicated/sorted наборов, чтобы `assessment.json`, `status`, `delta` и `report.md` использовали один и тот же счётчик.
9. Реализация считается завершённой только после синхронного обновления docs, runtime, build artifact и tests.

## 4. Порядок исполнения задач

Задачи выполняются строго в порядке `1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9`. Переход к следующей задаче допускается только после закрытия обязательной проверки предыдущей задачи.

### Задача 1. Зафиксировать нормативный extraction/edit contract в `references/standard.md`

Файлы:

- `references/standard.md`

Обязательные изменения:

- добавить `Extraction Checklist`;
- формализовать decision rules для `source-only discovery`, embedded packets и explicit packet edit;
- зафиксировать provenance contract explicit packet edits;
- зафиксировать boundaries для `replace_sections`, immutable identity и evidence-based `delivery_state`;
- добавить canonical rule для `UC-21`, включая `negative_scope`;
- добавить state machine для `Gap`/`Unknown`;
- определить stale-review semantics, `rebaseline_readiness`, `render_reason`, `command_run_id` и `New Stale Since Last Change`;
- синхронизировать required fields для `Spike` authoring с validator contract.

Результат задачи:

- `standard.md` полностью покрывает нормативные решения extraction/edit contract и документирует prerequisites для validation guardrails;
- в документе не остаётся ссылок на “догадаться по коду”.

Обязательная проверка:

- diff `references/standard.md` покрывает все нормативные решения extraction/edit contract, `negative_scope`, stale-review и readiness из спецификации;
- terminology совпадает со спецификацией и не конфликтует с `references/artifact-model.md`.

### Задача 2. Привести provenance и source-authority runtime к каноническому contract

Файлы:

- `src/discovery/source-runtime.ts`
- `src/discovery/discover-run.ts`

Обязательные изменения:

- разделить canonical packet key `packet.source.source_id` и CLI-only `SourceInputSpec.sourceId` без двусмысленности;
- обеспечить merge/update `source_authority` до merge section data;
- ввести явную provenance metadata для explicit packet edits;
- обеспечить validator-visible markers, достаточные для machine-check enforcement правил `replace_sections`, immutable identity и packet-authored `source_refs`;
- разрешать `replace_sections` только для source-driven refresh;
- запрещать planning overlay и explicit packet edit изменять immutable identity поля;
- сохранять `source_refs` в packet-authored entries системно трассируемыми, а не произвольной ручной строкой;
- запретить скрытое определение planning overlay vs source-driven refresh по косвенным признакам.

Результат задачи:

- runtime больше не зависит от имплицитных эвристик там, где спецификация требует provenance-driven behavior.

Обязательная проверка:

- explicit packet path детерминирован;
- machine-check enforcement блокирует `replace_sections` вне source-driven refresh;
- machine-check enforcement блокирует изменение immutable identity и произвольную ручную подмену packet-authored `source_refs`;
- `packet.source.source_id` и CLI-only `sourceId` нигде не смешиваются на одном contract boundary.

### Задача 3. Зафиксировать assessment model и fixed stats contract

Файлы:

- `src/discovery/common.ts`
- `src/discovery/validate-run.ts`

Обязательные изменения:

- добавить в `AssessmentFile` поле `stale_review_artifacts: string[]`;
- добавить в `AssessmentFile` поле `rebaseline_readiness: { status: 'allowed' | 'blocked' | 'not_needed'; reasons: string[] }`;
- добавить в `DeltaSummary` поле `stale_review_artifact_ids: string[]`;
- заменить открытый `stats: Record<string, number>` на machine-tight fixed metric set в типах, runtime-сборке и сериализации;
- обновить `validate-run.ts`, чтобы producer `assessment.stats` вычислял именно фиксированный contract, а не старый open-ended counters map.

Результат задачи:

- `AssessmentFile`, `DeltaSummary` и runtime producer используют один и тот же fixed schema contract;
- `assessment.stats` больше не зависит от open-ended counters map.

Обязательная проверка:

- `validate-run.ts` сериализует только фиксированный metric set;
- `assessment.json` содержит fixed numeric metrics c zero-default semantics;
- `delta_summary.stale_review_artifact_ids` присутствует как массив ID и использует пустой массив при отсутствии stale review artifacts.

### Задача 4. Реализовать stale-review, readiness и validation guardrails

Файлы:

- `src/discovery/validate-run.ts`
- `src/discovery/drift-state.ts`

Обязательные изменения:

- вычислять `stale_review_artifacts` по scope-aware правилам;
- реализовать fail-closed semantics после `rebaseline`:
  - `run`-scope review старше `last_rebaseline_at` становятся stale автоматически;
  - `item` и `track_proof` stale только при затронутом scope;
- вычислять `rebaseline_readiness`;
- валидировать `Gap`/`Unknown` transitions;
- валидировать evidence-based `delivery_state`;
- валидировать canonical `negative_scope` contract, включая conditional manual/synthetic fields;
- синхронизировать diagnostics и `next_actions` с новыми freshness/coverage conditions.

Результат задачи:

- validator и drift model отражают все guardrails спецификации;
- readiness, stale-review и item-level invalidation реализованы fail-closed.

Обязательная проверка:

- `validate-run.ts` и `drift-state.ts` покрывают stale-review, readiness, `negative_scope`, `Gap`/`Unknown` и `delivery_state` semantics;
- после `rebaseline` run-scope и scoped stale rules различаются именно так, как требует спецификация.

### Задача 5. Реализовать единый command lifecycle, journal lineage и auto-render contract

Файлы:

- `src/cli.ts`
- `src/discovery/init-run.ts`
- `src/discovery/discover-run.ts`
- `src/discovery/repair-run.ts`
- `src/discovery/validate-run.ts`
- `src/discovery/delta-run.ts`
- `src/discovery/rebaseline-run.ts`
- `src/discovery/render-views.ts`
- `references/artifact-model.md`

Обязательные изменения:

- генерировать `command_run_id` на каждый top-level CLI invocation;
- прокидывать `command_run_id` через phase-events и финальный auto-render;
- auto-render после `init`, `discover`, `repair`, `validate`, `delta`, `rebaseline`;
- удалить `--no-render` из `discover` и `repair`;
- оставить `render` recovery-only по semantics;
- в `report_rendered` писать `render_reason: mutating_command | recovery_render`;
- считать canonical outcome event для stale lineage только `report_rendered` c `render_reason=mutating_command`;
- journal events mutating-команд снабдить `command_run_id`;
- `report_rendered` снабдить `stale_snapshot` и `new_stale_snapshot` при наличии;
- `rebaseline_completed` снабдить `baseline_projection`;
- при отсутствии предыдущего command-level stale snapshot выдавать `New Stale Since Last Change = Unknown` с причиной `first recorded snapshot; no previous stale snapshot to diff`;
- зафиксировать эти semantics в `references/artifact-model.md`.

Результат задачи:

- после любой mutating-команды `assessment.json` и `report.md` всегда актуальны;
- recovery `render` не меняет stale lineage;
- journal содержит всю историю, нужную для `UC-28` и recovery-path.

Обязательная проверка:

- CLI help и runtime больше не содержат `--no-render` для `discover` и `repair`;
- после каждой mutating-команды обновляется `manifest.last_render_at`;
- после каждой mutating-команды в `journal.ndjson` записывается `report_rendered`;
- `command_run_id`, `render_reason`, `stale_snapshot`, `new_stale_snapshot` и `baseline_projection` сериализуются в journal детерминированно;
- первый snapshot для `New Stale Since Last Change` детерминированно выводит `Unknown` с фиксированной причиной, а не `None` и не пустое значение;
- `render` не меняет `New Stale Since Last Change`.

### Задача 6. Реализовать baseline projection и human-readable delta/status output

Файлы:

- `src/discovery/drift-state.ts`
- `src/discovery/delta-run.ts`
- `src/discovery/rebaseline-run.ts`
- `src/discovery/status-run.ts`
- `src/cli.ts`

Обязательные изменения:

- ввести `baseline_projection`;
- строить current projection из items, relations, claims и roadmap rows в deterministic order;
- для `delta` выдавать human-readable diff по items, relations, states, commitments и roadmap order;
- при отсутствии baseline projection явно отвечать `baseline_established=false`, без поддельного human-readable diff;
- привести `status` к фиксированному block order;
- выводить fixed metrics set из `assessment.stats`;
- добавить в `status` и `delta` вывод `stale review artifacts`, `rebaseline readiness`, `new stale`;
- обновить `discover` и `rebaseline` output по спецификации.

Результат задачи:

- CLI output предсказуем и соответствует operator-facing contract без ручной реконструкции из `assessment.json`.

Обязательная проверка:

- `delta` умеет показать human-readable diff относительно baseline за счёт `baseline_projection`;
- `status` печатает блоки строго в порядке `Core run status -> Summary metrics -> Drift and stale diagnostics -> Rebaseline readiness -> New stale since last change -> Hard-fails and next actions`;
- `delta` печатает human-readable diff по всем обязательным категориям: `item adds/removals`, `item state changes`, `relation adds/removals`, `claim commitment changes`, `roadmap order changes`;
- `status` и `delta` используют один и тот же fixed metrics set и одинаковые stale/new-stale identifiers.

### Задача 7. Реализовать `report.md` sections, anchors и deterministic read model

Файлы:

- `src/discovery/render-views.ts`

Обязательные изменения:

- добавить в `report.md` разделы:
  - `Item Summary Index`
  - `Item Detail Sections`
  - `Rebaseline Readiness`
  - `New Stale Since Last Change`
- расширить `Lifecycle And Drift` данными по `stale_review_artifacts` и recalculation surfaces;
- добавить явные anchors для item summary/detail sections;
- реализовать relations-based resolution для review refs, contract и data-domain sections;
- обеспечить deterministic ordering всех новых sections и lists.

Результат задачи:

- `report.md` покрывает `UC-05`–`UC-12`, `UC-23`, `UC-27`, `UC-28`;
- operator navigation опирается на стабильные sections и anchors.

Обязательная проверка:

- все новые anchors и sections стабильны и пригодны для operator navigation;
- каждый блок `Item Summary Index` содержит обязательный набор полей: `item_id`, `title`, `item_class`, `summary_label`, `delivery_state`, `track_id`, owners, ключевые `depends_on`, список основных проблем;
- каждый блок `Item Detail Sections` содержит обязательный набор полей: весь состав summary card, `origin_ref`, `claim_refs`, `proof_refs`, `review refs`, relations `touches_contract` / `touches_data_domain`, readiness/done/rollout/recovery contract, связанные `Gap`/`Unknown`/`Spike`;
- `report.md` использует те же fixed metrics и stale/new-stale identifiers, что и `status` и `delta`.

### Задача 8. Обновить `SKILL.md` и `docs/operator-use-cases.ru.md` после фиксации runtime/output contract

Файлы:

- `SKILL.md`
- `docs/operator-use-cases.ru.md`

Обязательные изменения:

- добавить в `SKILL.md` раздел `Help` с прямой ссылкой на `docs/operator-use-cases.ru.md`;
- добавить раздел `Prompt workflows` с верхнеуровневыми группами `Create backlog`, `Audit backlog`, `Audit one item`, `Edit backlog`;
- для всех `UC-*`, где это требует спецификация, добавить одноимённые workflow subsections;
- явно замаппить operator-facing запросы на финальные разделы `report.md`;
- зафиксировать допустимые входы для create/audit/edit сценариев;
- синхронизировать wording с финальным canonical vocabulary из спецификации и уже реализованных output contracts;
- синхронизировать `docs/operator-use-cases.ru.md` с финальными workflow names, help sections и output expectations, на которые ссылается `SKILL.md`.

Результат задачи:

- `SKILL.md` закрывает `WS-01` и ссылается только на уже зафиксированные workflow names и output contracts;
- агенту не нужно выводить mapping из кода.

Обязательная проверка:

- `SKILL.md` не вводит ни одного workflow name или help section, которого нет в финальном runtime/output contract;
- `SKILL.md` и `docs/operator-use-cases.ru.md` используют тот же vocabulary, что и спецификация и `report.md`.

### Задача 9. Закрыть test surface и verification bundle

Файлы:

- `test/cli.test.mjs`
- `scripts/architecture-backlog.mjs`

Обязательные изменения в `test/cli.test.mjs`:

- добавить тесты на fixed `assessment.stats` contract и zero-default semantics;
- добавить тесты на scope-aware `stale_review_artifacts`;
- добавить тесты на `rebaseline_readiness`;
- добавить тесты на human-readable `delta` и `baseline_projection`;
- добавить тесты на explicit packet provenance и canonical `packet.source.source_id`;
- добавить тесты на `negative_scope` minimal/conditional required fields;
- добавить положительные тесты на auto-render после `init`, `discover`, `repair`, `validate`, `delta`, `rebaseline`;
- отдельно проверить removal of `--no-render` from `discover` и `repair` на уровне CLI help/error surface;
- добавить тесты, которые после каждой mutating-команды подтверждают обновление `manifest.last_render_at` и наличие события `report_rendered` в `journal.ndjson`;
- добавить тесты на `command_run_id`, `render_reason` и stale lineage behavior;
- добавить тест на первый command-level stale snapshot, который подтверждает результат `Unknown` с причиной `first recorded snapshot; no previous stale snapshot to diff`;
- добавить тест на recovery `render`, который подтверждает, что `New Stale Since Last Change` не сдвигается;
- добавить тесты на fixed block order для `status`;
- добавить тесты на обязательные human-readable diff categories в `delta`;
- добавить тесты на `Item Summary Index`, `Item Detail Sections`, anchors и обязательный состав полей в `report.md`;
- добавить filesystem-level contract tests, которые проверяют обязательные `Help` и `Prompt workflows` sections в `SKILL.md`, а также согласованность упомянутых workflow names с `docs/operator-use-cases.ru.md`.

Обязательные команды проверки в каталоге skill package:

1. `pnpm format`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`

Дополнительная обязательная проверка:

- ручная инспекция generated `scripts/architecture-backlog.mjs`, чтобы убедиться, что build artifact синхронизирован с `src/`.

Результат задачи:

- каждый новый contract из спецификации имеет хотя бы одну merge-critical автоматизированную проверку;
- regression surface закрыт в `cli.test.mjs`;
- собранный `scripts/architecture-backlog.mjs` соответствует обновлённому `src/`.

## 5. Definition of Done для реализации

План считается выполненным только когда одновременно соблюдены все условия:

1. Спецификация, `SKILL.md`, `standard.md`, `artifact-model.md` и runtime code не противоречат друг другу.
2. `status`, `delta`, `rebaseline`, `discover` и `report.md` отражают новый operator-facing contract.
3. `assessment.json` и `journal.ndjson` содержат все новые machine-check fields и event attributes.
4. Recovery `render` не влияет на stale lineage.
5. `negative_scope`, packet provenance и evidence-based `delivery_state` валидируются без скрытых эвристик.
6. Все новые doc contracts (`SKILL.md`, `docs/operator-use-cases.ru.md`) имеют явную contract-level verification.
7. Все тесты и quality gates проходят.
8. Собранный `scripts/architecture-backlog.mjs` соответствует обновлённому `src/`.

## 6. Review-итерации

### Итерация 1

Найденные проблемы:

- `major`: структура документа была оформлена как phased roadmap, а не как список implementation-ready задач;
- `major`: порядок работ нарушал dependency order спецификации и поднимал `WS-01` слишком рано;
- `major`: task на fixed `assessment.stats` не фиксировал обязательные изменения в `src/discovery/validate-run.ts`;
- `major`: verification не требовал положительных auto-render тестов для `discover` и `repair`;
- `major`: `SKILL.md`/help-contract был включён в scope, но не имел собственного merge-critical verification;
- `major`: review log содержал placeholder и делал документ внутренне незавершённым;
- `minor`: initial source-of-truth list пропускал `src/discovery/drift-state.ts`.

Внесённые изменения:

- документ полностью переписан в ordered task list без фаз;
- задачи переставлены в canonical order из спецификации;
- task на assessment/validation теперь явно включает `validate-run.ts`, `drift-state.ts`, `common.ts`, `source-runtime.ts` и `discover-run.ts`;
- verification расширен положительными auto-render тестами для `discover` и `repair`;
- добавлены filesystem-level contract tests для `SKILL.md` и `docs/operator-use-cases.ru.md`;
- placeholder review log заменён фактической итерацией;
- `src/discovery/drift-state.ts` добавлен в initial runtime surface.

Перепроверено:

- соответствие dependency order разделу `Зависимости и порядок реализации` спецификации;
- покрытие reviewer findings по severity;
- отсутствие placeholder wording и roadmap-style phrasing.

### Итерация 2

Найденные проблемы:

- `major`: документ оставлял внешний gate через неописанный отдельно review-cycle;
- `major`: zero-default semantics были неверно перенесены на `delta_summary`, хотя спецификация требует их только для fixed numeric `assessment.stats`;
- `major`: verification не фиксировал обязательные `manifest.last_render_at` и `report_rendered` после каждой mutating-команды;
- `major`: verification для `status` и `delta` не фиксировал обязательный block order и обязательные категории human-readable diff;
- `major`: verification для `Item Summary Index` и `Item Detail Sections` не фиксировал обязательный состав полей.

Внесённые изменения:

- из подтверждения готовности убран внешний gate; документ сформулирован как уже implementation-ready artifact;
- zero-default semantics оставлены только у fixed numeric metrics, а `delta_summary.stale_review_artifact_ids` зафиксирован как массив ID;
- в Task 5 и Task 9 добавлена проверка `manifest.last_render_at` и события `report_rendered` после каждой mutating-команды;
- в Task 6 и Task 9 добавлена проверка точного block order `status` и полного набора human-readable diff categories в `delta`;
- в Task 7 и Task 9 добавлена проверка обязательного набора полей для `Item Summary Index` и `Item Detail Sections`.

Перепроверено:

- соответствие fixed metric/default semantics разделу `assessment.stats` спецификации;
- полнота auto-render contract по `manifest`, `journal` и operator-facing output;
- полнота output contract для `status`, `delta` и `report.md`.

### Итерация 3

Найденные проблемы:

- `major`: packet guardrails были описаны недостаточно жёстко и не требовали явного machine-check enforcement для `replace_sections`, immutable identity и packet-authored `source_refs`;
- `major`: first-snapshot semantics для `New Stale Since Last Change` не были зафиксированы как обязательный результат `Unknown` с причиной.

Внесённые изменения:

- в Task 2 добавлен явный machine-check enforcement для `replace_sections`, immutable identity и системной трассируемости packet-authored `source_refs`;
- в Task 5 и Task 9 добавлена фиксированная first-snapshot semantics для `New Stale Since Last Change = Unknown` с причиной `first recorded snapshot; no previous stale snapshot to diff`.

Перепроверено:

- enforcement всех packet guardrails, перечисленных в edit semantics спецификации;
- edge case первого command-level stale snapshot для `status`, `delta` и `report.md`.

### Итерация 4

Найденные проблемы:

- `none`

Внесённые изменения:

- дополнительных изменений не потребовалось.

Перепроверено:

- независимый финальный review и confirm-pass по текущей сохранённой версии завершились ответом `findings: none`.

## 7. Допущения и принятые решения

1. Реализация остаётся в пределах текущей schema v3; отдельная schema v4 или новый canonical artifact не вводятся.
2. Вся новая проверка добавляется в существующий `test/cli.test.mjs`; helper extraction допустим только как чистый refactor без изменения verification scope.
3. Обновление build artifact `scripts/architecture-backlog.mjs` обязательно входит в эту работу и не выносится в отдельный follow-up.
4. Все новые journal attributes допускаются как append-only расширение существующих событий, без ретроактивной миграции старых run bundles.
5. Если в ходе реализации обнаружится противоречие между спецификацией и существующим validator contract, источником истины становится обновлённая спецификация, а код и docs приводятся к ней в том же change set.

## 8. Подтверждение готовности

Независимый финальный review и confirm-pass по текущей сохранённой версии завершились ответом `findings: none`. Документ не содержит открытых вопросов, не оставляет ни одного “решить по ходу” пункта и готов к прямой реализации без дополнительной декомпозиции.
