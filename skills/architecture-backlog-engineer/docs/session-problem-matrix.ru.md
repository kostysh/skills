# Матрица проблем использования `architecture-backlog-engineer`

Контекст: матрица собрана по итогам этой сессии, в которой создавался новый backlog run для `yaagi` в `backlog-new` на основе архитектурного документа и backlog-planning источника с явным правилом `intaken => implemented`.

Цель документа: зафиксировать не только явные поломки, но и любое диагностическое трение, лишние действия или лишние минуты, которые возникли из-за текущего UX, правил или недосказанностей skill-а и его CLI.

| Код | Проблема | Как решил | С чем связана | Как исправить | Решение |
| --- | --- | --- | --- | --- | --- |
| `ABE-PM-001` | У существующего run сохранился фантомный `governed_by` relation, хотя в packet'ах его уже не было. | Нашёл relation в `backlog.json`, убедился, что в packet'ах его нет, затем пересоздал run через `init --force` и повторный `discover`. | `discover` делает upsert/merge и не трактует отсутствие entry как удаление; при этом skill по умолчанию рекомендует reuse existing run. | Явно задокументировать в `SKILL.md`: reuse безопасен только для additive updates; если нужно удалить relation/item/section, нужен `source_driven_refresh + replace_sections` или controlled reset run. | Сохранить `governed_by` как часть модели, но добавить в утилиту source-scoped reconciliation для `relations[]`/`items[]` и описать режимы `additive` vs `reconcile` в skill. |
| `ABE-PM-002` | Удаление relation по принципу “убрал из packet и заново discover” не сработало. | После проверки merge semantics отказался от дальнейших попыток “вычистить отсутствием” и использовал reset run. | В quick-path skill-а не сказано, что omission не равен deletion для array sections. | Добавить отдельное правило в execution contract и operator manual: “array sections are upsert-only; omission is not deletion”. | Не делать omission destructive; добавить в утилиту явный delete primitive для relation/item edits и описать это как отдельный edit-сценарий в skill. |
| `ABE-PM-003` | `replace_sections` как штатный механизм очистки section был найден слишком поздно. | Пришлось читать `packet-schema.md` и код CLI, чтобы понять, что `replace_sections` вообще существует и доступен только в `source_driven_refresh`. | Критичная remediation-возможность спрятана глубоко в schema reference и не вынесена в основной workflow skill-а. | Добавить в `SKILL.md` короткий remediation playbook: когда использовать `replace_sections`, когда делать reset run, когда достаточно обычного `discover`. | Добавить в `SKILL.md` короткий remediation playbook с правилами выбора между `discover`, `replace_sections` и `reset run`. |
| `ABE-PM-004` | Нестабильность `source.ref` по форме записи (`relative` vs `absolute`) создавала риск конфликтов идентичности источника. | Нормализовал `source.ref` к абсолютным путям и дальше держал их неизменными. | Identity-совместимость source authority чувствительна к форме ref, а skill не делает это правило явным в quick path. | Добавить правило “normalize source refs once” с примерами для локальных файлов и явным запретом менять форму ref в середине run. | Нормализовать все локальные `source.ref` в repo-relative path внутри утилиты; абсолютные пути в canonical artifacts запретить; путь вне repo root считать hard-fail. |
| `ABE-PM-005` | Операторское правило `intaken => implemented` пришлось вручную переводить в backlog ontology. | Завёл отдельный `current-truth` packet и закодировал mapping в canonical states/items/proofs/reviews. | Проблема оказалась не в отсутствии механизма, а в том, что существующее правило можно прочитать слишком абстрактно и начать искать универсальный cookbook, хотя mapping проект-специфичен. | Уточнить существующее правило в `SKILL.md`: mapping из внешнего status vocabulary всегда project-specific и применяется сразу в canonical packet fields текущего run/source без переноса внешних статусов в canonical artifacts. | Уточнить инструкцию skill-а: явный project-specific mapping из внешнего status vocabulary сразу проецируется в canonical packet fields текущего run/source; внешние статусы не сохраняются в canonical artifacts. |
| `ABE-PM-006` | Для closed `feature_slice` оказалось недостаточно `class_payload.acceptance_examples`; валидатор требовал и top-level `acceptance_examples`. | Дополнил items top-level полем `acceptance_examples` и заново прогнал `discover`. | Важное validator-specific требование не видно из основного workflow и легко пропускается при packet authoring. | Добавить в skill краткий checklist по `feature_slice` closure и отдельный пункт: “top-level acceptance_examples обязательны для closed slices”. | Добавить в skill краткий checklist по closure для `feature_slice` и явно зафиксировать, что для closed slices top-level `acceptance_examples` обязательны. |
| `ABE-PM-007` | Review artifacts стали stale после изменения `current-truth` packet. | Освежил `reviewed_at` после финальных packet-правок и повторно прогнал `discover`. | Skill не проговаривает, что source change делает reviews stale даже без смыслового изменения review content. | Добавить правило последовательности: сначала закончить packet mutations, потом обновлять review artifacts; отдельно перечислить условия stale review. | `TBD` |
| `ABE-PM-008` | `track_proof` reviews могут быть stale не из-за времени, а из-за role applicability. | Разобрал validator, понял, что stale вызван applicability mismatch, и сменил роли review на валидные для этих scope (`security`, `application_engineering`). | Правила applicability buried in validator/standard; из `assessment.json` неясно, stale по времени review или по несоответствию роли. | Добавить в skill таблицу “какие роли допустимы/разумны для `run`, `item`, `track_proof` reviews” и явное предупреждение про applicability-based staleness. | `TBD` |
| `ABE-PM-009` | `change_surfaces` в prose-friendly виде (`безопасность`, `операции`, `платформа`) не совпали с canonical taxonomy, из-за чего impact-модель работала не так, как ожидалось. | Пришлось читать validator constants (`SECURITY_SURFACES`, `SUPPORT_SURFACES`) и уже от этого выбирать review strategy. | В skill нет короткого словаря canonical surface labels, хотя от них зависят required reviews и часть policy/NFR логики. | Вынести в quick reference канонический словарь `change_surfaces` и рекомендовать агенту всегда маппить prose labels на canonical values. | `TBD` |
| `ABE-PM-010` | Ошибка `Item item-cf-024 (control_guardrail) has invalid outgoing relation governed_by` не указывала, откуда именно relation взялся. | Пришлось вручную сравнить packet'ы и merged `backlog.json`, затем читать `packet_provenance` и merge behavior, чтобы понять, что это legacy canonical state. | Диагностика validator-а показывает симптом, но не показывает origin packet/source provenance или возможную причину (`stale merged relation`). | Улучшить diagnostics: для relation errors выводить `from/to`, `packet_provenance`, и hint вида “entry may persist from previous merge; omission does not delete relation”. | `TBD` |
| `ABE-PM-011` | Диагностика stale review artifacts показывала только список ID без причины staleness. | Разобрал код validator-а и понял, что для `track_proof` причина была в applicability mismatch, а не в timestamp. | `assessment.json` и `status` не объясняют, stale review по времени, по stale proof dependency, по recalculation или по applicability mismatch. | Добавить в assessment/report поле с reason-per-review (`predates_dirty_state`, `stale_proof_dependency`, `needs_gate_recalc`, `applicability_mismatch`). | `TBD` |
| `ABE-PM-012` | Параллельный запуск `discover` и чтения `status`/`assessment.json` дал противоречивую картину и лишнюю проверку. | После этого читал финальный state только после завершения mutating command. | Skill не предупреждает, что mutating CLI команды нельзя смешивать с параллельными read/status операциями, если нужен достоверный финальный state. | Добавить operational rule: не параллелить `init/discover/repair/rebaseline` с `status` или прямым чтением canonical artifacts. | `TBD` |
| `ABE-PM-013` | Для понимания реальной причины проблем пришлось лезть в bundled CLI source, хотя skill обещает progressive disclosure через `packet-schema` и validator output. | Использовал `packet-schema.md`, затем validator output, а потом уже исходники CLI как последний рубеж. | Текущий progressive disclosure не покрывает типовые failure modes вроде stale merge state, applicability mismatch, source identity drift. | Добавить в `docs/` troubleshooting guide с индексом типовых ошибок и ссылками: symptom -> probable cause -> minimal fix -> deeper reference. | `TBD` |

## Вывод

Большинство проблем было не в “невозможности” сделать задачу, а в том, что несколько критичных правил существовали только имплицитно:

- merge semantics для existing run;
- deletion vs omission;
- review freshness/applicability;
- canonical taxonomy для `change_surfaces`;
- стабильность `source.ref`.

Если эти правила поднять в основной `SKILL.md` и operator-facing remediation docs, то agent сможет:

- быстрее выбирать между `reuse`, `replace_sections` и `init --force`;
- меньше времени тратить на чтение исходников CLI;
- реже попадать в stale/diagnostic loops;
- точнее авторить packet'ы с первого прохода.

## Решения

### `ABE-PM-001` — фантомный `governed_by` relation в existing run

#### Короткий вывод

- `governed_by` не выглядит ошибкой старой версии и не выглядит лишним relation type.
- Его нужно сохранить как часть методики.
- Проблема находится в semantics обновления canonical state, а не в самом relation.

#### Что означает `governed_by`

В текущей методике `governed_by` — это item-level relation от work item к `control_guardrail`.

Смысл relation:

- `feature_slice`, `capability_seam`, `migration`, `retirement`, `operational_enablement`, `documentation_support_enablement` могут быть `governed_by` конкретным control item;
- `control_guardrail` обязан быть целью хотя бы одного входящего `governed_by`;
- это не то же самое, что `track_gates[].governing_control_item_refs`, потому что `governing_control_item_refs` работает на уровне track gate, а `governed_by` на уровне item graph.

Иными словами:

- `governed_by` отвечает на вопрос: какая работа управляется каким guardrail;
- `governing_control_item_refs` отвечает на вопрос: какие controls закрывают fail-closed/safety gate этого трека.

#### Что именно сломалось в сессии

В сессии relation исчез из packet'ов, но остался в canonical `backlog.json`.

Это означает не то, что relation-модель неверна, а то, что текущая утилита:

- умеет upsert для `relations[]`;
- но не умеет deterministic deletion для отсутствующих relation entries в пределах того же source.

Из-за этого stale relation продолжает жить в merged state и дальше ломает валидацию.

#### Рациональное решение

Основное решение должно быть в утилите.

Нужно добавить source-scoped reconciliation для array sections, в первую очередь для:

- `relations`
- `items`

Рабочая идея:

- packet может объявить, что для указанных section он не просто делает upsert, а синхронизирует текущее содержимое source;
- утилита перед merge удаляет из целевой section все записи с тем же `packet_provenance.source_id`;
- затем заново добавляет entries из текущего packet.

Это не то же самое, что `replace_sections`:

- `replace_sections` заменяет section глобально;
- reconciliation должен работать только в пределах одного source.

#### Предпочтительный контракт утилиты

Рекомендуемый новый механизм:

- добавить в packet новый ключ, например `reconcile_sections`;
- разрешить его для `source_driven_refresh` и, при необходимости, для planning-source packet'ов, которые переописывают source целиком;
- первым целевым сценарием считать повторное извлечение backlog из одного planning source или одного authoritative source.

Пример semantics:

- `reconcile_sections: ["relations"]`
- значит: все `relations` от текущего `source_id` считаются полным снимком и должны быть приведены в точное соответствие packet'у.

#### Что нужно сделать в skill / методике

В `SKILL.md` надо явно развести три режима:

1. `additive update`
   Используется, когда packet только добавляет/уточняет graph.

2. `source reconciliation`
   Используется, когда packet переописывает тот же source целиком и omission должен означать deletion внутри этого source.

3. `full reset`
   Используется как аварийный fallback, если run уже загрязнён legacy merge-state или reconciliation ещё не поддержан утилитой.

Дополнительно skill должен прямо говорить:

- `governed_by` сохраняется как часть модели;
- проблема не в relation-модели;
- проблема в отсутствии source-scoped reconciliation semantics.

#### Что ещё стоит улучшить в утилите

Диагностика для relation errors должна сразу показывать:

- `from`
- `to`
- `relation_type`
- `packet_provenance.source_id`
- hint, что relation может быть stale merged entry от предыдущего снимка source

Тогда агенту не придётся вручную сверять packet'ы с merged `backlog.json`.

#### Почему это лучший путь

Это решение:

- сохраняет правильную часть методики;
- устраняет недетерминизм в canonical merge;
- уменьшает ручной анализ артефактов;
- снижает зависимость от поведения агента;
- делает workflow проверяемым на уровне утилиты, а не только инструкций.

### `ABE-PM-002` — omission relation в packet не удаляет его из canonical graph

#### Короткий вывод

- Это не случайная поломка.
- Это следствие текущего edit/merge контракта: packet semantics сейчас upsert-only.
- Значит исправлять нужно не “поведение omission”, а добавить явный механизм удаления.

#### Что показало изучение методики и утилиты

Текущий контракт skill-а и утилиты последовательно говорит одно и то же:

- `discover` принимает partial upsert packets;
- validation идёт по merged canonical backlog;
- omission в packet не трактуется как удаление;
- `replace_sections` разрешён только для полного section refresh и не подходит для точечного operator edit.

Это уже закреплено и в schema, и в operator-facing remediation docs.

Следовательно, текущее поведение:

- ожидаемо для существующей модели;
- неудобно для edit-сценариев;
- но не является “неожиданным багом” в узком смысле.

#### В чём реальная проблема

Сейчас методика умеет:

- добавить relation;
- обновить relation через upsert с тем же identity;
- полностью заменить section через `replace_sections`.

Но она не умеет удобно и детерминированно:

- удалить один relation;
- удалить один item;
- заменить old relation на new relation без грубого section-level refresh или reset run.

То есть проблема — отсутствие explicit delete semantics на уровне packet/CLI.

#### Рациональное решение

Основное решение должно быть в утилите.

Нужно добавить явный delete primitive, а не менять смысл omission.

Предпочтительный подход:

- новый packet key, например `delete_entries`;
- внутри него секции по аналогии с packet sections, начиная с:
  - `relations`
  - при необходимости позже `items`, `proofs`, `reviews`

Для `relations` удаление должно адресоваться по стабильной identity:

- `relation_id`, если он есть;
- иначе по canonical tuple:
  - `relation_type`
  - `from.kind`
  - `from.id`
  - `to.kind`
  - `to.id`

#### Почему omission нельзя просто сделать deletion

Это ухудшит саму модель packet authoring.

Сейчас partial upsert безопасен:

- маленький packet меняет только то, что явно прислал агент;
- отсутствие поля или entry ничего не уничтожает.

Если omission начнёт означать deletion:

- любой неполный packet станет потенциально destructive;
- возрастёт шанс случайной потери canonical state;
- агенту придётся мыслить full-snapshot семантикой даже для микроправок.

Это ухудшит UX и повысит вероятность ошибок.

#### Как должен работать новый delete primitive

Ожидаемый контракт:

1. `discover` сначала применяет `delete_entries`.
2. Потом применяет обычный upsert packet data.
3. Потом запускает repair/validate/render как и сейчас.

Это даёт детерминированную модель:

- удалить relation;
- затем при необходимости добавить новый;
- получить чистый merged graph за один проход CLI.

#### Ограничения, которые нужны сразу

Delete не должен быть “безусловным”.

Минимальные guardrails:

- `planning_overlay` может удалять только entry, которые разрешено редактировать этому сценарию;
- packet должен удалять только entry, source-owned тем же `source_id`, если это source-scoped operator edit;
- попытка снести authoritative-current или authoritative-target entry planning overlay’ем должна hard-fail-иться;
- journal/status/report должны показывать факт удаления.

#### Что нужно добавить в skill / методику

В `SKILL.md` и operator-facing docs надо явно записать:

- omission не означает deletion;
- для удаления relation используется explicit delete packet primitive;
- “replace relation” — это canonical workflow:
  - delete old relation
  - add new relation

Особенно это важно для edit-сценариев уровня:

- `depends_on`
- `governed_by`
- `enabled_by`
- `blocked_by`

#### Почему это лучший путь

Такое решение:

- сохраняет безопасный partial-upsert contract;
- убирает необходимость reset run для точечных graph edits;
- делает editing semantics явными и machine-checkable;
- уменьшает ручные workaround-ы и анализ canonical файлов;
- лучше соответствует приоритету: сначала утилита, потом текстовые инструкции.

### `ABE-PM-003` — `replace_sections` найден слишком поздно

#### Короткий вывод

- Проблема не в отсутствии механизма, а в его discoverability.
- `replace_sections` уже существует, но спрятан слишком глубоко для рабочего сценария.
- Здесь достаточно улучшить skill / методику.

#### Что именно произошло

В сессии `replace_sections` был найден только после чтения `packet-schema.md` и исходников CLI.

Это означает, что основной workflow skill-а не помогает агенту быстро ответить на практический вопрос:

- когда обычного `discover` достаточно;
- когда нужен `replace_sections`;
- когда нужно прекращать локальный repair и делать `init --force`.

#### Почему это важно

`replace_sections` — не редкая внутренняя опция, а штатный remediation инструмент.

Если агент не видит его вовремя, он:

- тратит время на лишние гипотезы;
- может читать исходники CLI без необходимости;
- может выбрать грубый обходной путь вроде reset run, хотя section-level refresh уже был доступен.

#### Зафиксированное решение

В `SKILL.md` нужно добавить короткий remediation playbook.

Минимальный состав playbook:

1. **Обычный `discover`**
   Использовать, если изменение additive и omission ничего не должен удалять.

2. **`replace_sections`**
   Использовать, если нужен полный refresh конкретной section из authoritative source и текущий packet должен считаться полным снимком этой section.

3. **`init --force` / reset run**
   Использовать только как fallback, когда canonical state уже загрязнён, section-level remediation недостаточен или нужная semantics ещё не поддержана утилитой.

#### Что именно стоит вписать в skill

Нужен короткий блок вида:

- “Если вы обновляете existing run и только добавляете/уточняете данные — используйте `discover`.”
- “Если authoritative packet переописывает section целиком — используйте `replace_sections`.”
- “Если run уже содержит legacy merge-state, который нельзя корректно снять section-level refresh’ем — используйте reset run.”

#### Почему этого достаточно

Эта проблема не требует новой функциональности в утилите.

Механизм уже есть. Не хватает только:

- раннего упоминания в основном skill;
- явного правила выбора;
- remediation-oriented wording вместо глубокого reference-only поиска.

#### Ожидаемый эффект

После такого изменения агент сможет раньше принимать правильное решение и реже уходить в:

- чтение исходников CLI;
- лишние repair-итерации;
- преждевременный `reset run`.

### `ABE-PM-004` — нестабильность `source.ref`

#### Короткий вывод

- Решение должно быть только в утилите.
- Агент не должен вручную заботиться о форме пути.
- Каноническая persisted форма для локального source ref должна быть только repo-relative.

#### Что именно считается проблемой

Один и тот же файл может приходить в разных формах:

- `docs/architecture/system.md`
- `./docs/architecture/system.md`
- `/code/projects/yaagi/docs/architecture/system.md`

С точки зрения смысла это один и тот же source.
С точки зрения строки — это разные значения.

Если утилита не унифицирует их в одну каноническую форму достаточно рано, возникают:

- ложные конфликты identity;
- лишние source drift-сигналы;
- лишние repair-итерации;
- утечка абсолютных путей в коммитящиеся артефакты.

#### Зафиксированное решение

Утилита должна всегда нормализовать локальные `source.ref` в repo-relative path.

Примеры:

- было `/code/projects/yaagi/docs/architecture/system.md`
- стало `docs/architecture/system.md`

- было `./docs/architecture/system.md`
- стало `docs/architecture/system.md`

#### Жёсткие правила контракта

1. Абсолютные пути не должны сохраняться в canonical artifacts.
2. Любой локальный `source.ref` перед identity checks и merge должен приводиться к repo-relative форме.
3. Если path не лежит внутри repo root, утилита должна делать hard-fail.

#### Почему именно так

Это даёт сразу три свойства:

- **стабильность**
  Один и тот же source всегда имеет один и тот же persisted ref.

- **безопасность**
  В `manifest.json`, `backlog.json` и других артефактах не светится структура локального диска.

- **детерминизм**
  Source identity перестаёт зависеть от того, как именно агент написал path в packet.

#### Почему skill менять не нужно

Если нормализация будет встроена в утилиту как обязательный canonicalization step, то:

- агент может прислать локальный путь в любой разумной форме;
- утилита сама приведёт его к безопасной canonical форме;
- методика не требует от агента помнить дополнительное правило.

Значит для этой проблемы достаточно доработки утилиты, без изменения `SKILL.md`.

#### Что именно нужно сделать в утилите

На уровне CLI/runtime:

1. Определять repo root run-а.
2. Для каждого локального `source.ref`:
   - резолвить путь;
   - проверять, что он находится внутри repo root;
   - сохранять обратно только repo-relative path.
3. Все identity/compatibility checks выполнять уже по normalized repo-relative ref.
4. Если путь вне repo root:
   - выдавать hard-fail с понятной диагностикой.

#### Ожидаемый эффект

После этого исчезнут:

- конфликты между `relative` и `absolute` формами одного и того же source;
- необходимость вручную следить за формой `source.ref`;
- риск утечки абсолютных путей в репозиторий.

### `ABE-PM-005` — project-specific mapping внешнего planning status

#### Короткий вывод

- Проблема не в отсутствии механизма.
- Утилиту менять не нужно.
- Нужно уточнить уже существующее правило в `SKILL.md` как прямую инструкцию применения project-specific mapping.

#### Что показала сессия

В этом кейсе оператор явно задал project-specific mapping:

- `intaken => implemented`

Агент корректно применил его так, как и должен был:

- не переносил `intaken` в canonical backlog;
- сразу записал canonical states в packet.

То есть рабочий механизм уже есть.

#### В чём реальная проблема

Текущая формулировка в `SKILL.md` верная по смыслу, но слишком общая.

Она говорит, что explicit mapping надо применять, но недостаточно явно фиксирует итоговую форму результата:

- mapping всегда project-specific;
- mapping сразу проецируется в canonical packet fields;
- canonical backlog хранит уже canonical semantics, а не внешний status vocabulary.

#### Что на что меняется

**Было в `SKILL.md`:**

- `If the operator provides an explicit mapping from an external planning-status vocabulary to backlog semantics, apply that mapping directly when authoring the packet unless it conflicts with packet-schema hard constraints.`

**Должно стать:**

- `If the operator provides an explicit project-specific mapping from an external planning-status vocabulary to backlog semantics, apply that mapping directly into canonical packet fields for the current run/source unless it conflicts with packet-schema hard constraints. Canonical artifacts must store the resulting backlog semantics rather than the external status labels.`

#### Смысл уточнения

Новая формулировка явно фиксирует три вещи:

1. mapping всегда project-specific;
2. mapping применяется сразу в packet;
3. canonical artifacts содержат результат этого mapping-а, а не внешние статусные метки.

#### Почему утилиту менять не нужно

Утилита уже получает на вход packet с canonical backlog semantics.

В этом сценарии от неё не требуется:

- хранить внешние статусы;
- регистрировать отдельный mapping;
- выполнять отдельную трансляцию.

Вся нужная работа уже должна происходить на этапе authoring packet-а по explicit operator instruction.

#### Ожидаемый эффект

После такого уточнения skill:

- даст агенту прямое правило преобразования;
- сохранит текущий простой workflow “один packet, один discover”;
- уберёт лишнюю неоднозначность при работе с project-specific status vocabulary.

### `ABE-PM-006` — top-level `acceptance_examples` обязательны для closed `feature_slice`

#### Короткий вывод

- Это уточнение инструкции skill-а.
- Утилиту менять не нужно.
- Для closed `feature_slice` skill должен явно проверять top-level `acceptance_examples` как часть closure checklist.

#### Что показала сессия

В packet для closed `feature_slice` уже были `acceptance_examples` внутри `class_payload`, но этого оказалось недостаточно.

Валидатор требовал именно top-level поле `acceptance_examples` на самом item, из-за чего packet пришлось доавторить и прогнать `discover` повторно.

#### В чём реальная проблема

Требование существует, но оно плохо видно в основном authoring workflow.

Из-за этого легко сделать правдоподобный packet, в котором:

- domain-specific acceptance лежит в `class_payload`;
- но обязательное top-level поле для closed slice пропущено.

То есть проблема не в отсутствии механизма и не в работе утилиты, а в том, что closure-правило недостаточно явно поднято в `SKILL.md`.

#### Что на что меняется

**Было:**

- agent ориентируется на schema/validator и общие packet authoring правила;
- обязательность top-level `acceptance_examples` для closed `feature_slice` не выделена как отдельный closure checkpoint.

**Должно стать:**

- в `SKILL.md` появляется краткий checklist по closure для `feature_slice`;
- отдельным пунктом в этом checklist явно записано:
  - для closed `feature_slice` top-level `acceptance_examples` обязательны;
  - `class_payload.acceptance_examples` могут дополнять item, но не заменяют top-level поле.

#### Как должен выглядеть checklist

Краткий checklist для closed `feature_slice` должен напоминать агенту проверить минимум:

- closure/readiness semantics согласованы;
- есть top-level `acceptance_examples`;
- при необходимости заполнены class-specific closure fields;
- proofs/reviews/gates не противоречат закрытому состоянию slice.

Важно, что это должен быть именно короткий operator-facing checklist, а не глубокая ссылка в schema reference.

#### Почему утилиту менять не нужно

Утилита уже валидирует это правило корректно.

Проблема возникает раньше:

- на этапе packet authoring;
- когда агент не видит обязательность top-level поля достаточно рано.

Значит наилучшее исправление — сделать это требование явным в skill, а не добавлять дополнительную механику в CLI.

#### Ожидаемый эффект

После такого уточнения skill:

- уменьшится число повторных `discover` из-за формально неполного closure packet;
- агент будет быстрее собирать closed `feature_slice` правильно с первого прохода;
- distinction между top-level и `class_payload` acceptance станет явной и больше не будет ловушкой.
