# Операторские юзкейзы для `architecture-backlog-engineer`

Этот файл является рабочим development-документом для доработки operator-facing сценариев. Shipped operator manual находится в `references/operator-manual.md`.

Все сценарии ниже запускаются обычным промптом к агенту. Оператор обычно дает агенту архитектурные и связанные документы, существующий `run-dir` и вопрос на естественном языке. Агент читает prose-источники, интерпретирует их, при необходимости создает explicit packet files по схеме и регистрирует их через штатную CLI утилиту скила. Оператор не создает packets и не управляет canonical артефактами напрямую.

Для изменения беклога агент должен опираться на обновленные authoritative inputs или на собственный explicit packet, который агент сформировал по этим inputs, а затем пересчитывать run через штатную CLI утилиту. Агенту запрещено напрямую создавать или изменять артефакты методики скила; оператор не создает артефакты самостоятельно.

Если `run-dir` не указан, агент должен использовать текущий run или явно сказать, какой run он выбрал.

## Глоссарий

- `элемент беклога` / `work item` — любая единица работы в `backlog graph`.
- `architecture claim` — зафиксированное утверждение или обязательство архитектуры, которое должно быть покрыто работой.
- `uncovered` — `architecture claim`, который пока не покрыт элементом беклога.
- `Question` — поле `question` у `Spike`; конкретный вопрос, на который нужно ответить, чтобы снять неопределенность.
- `Gap` — обязательный кусок работы или покрытия, которого не хватает в беклоге.
- `Unknown` — значимая неопределенность, мешающая точно зафиксировать работу.
- `Contradiction` — противоречие между источниками, утверждениями или состояниями системы.
- `Spike` — ограниченная по времени исследовательская задача для снятия `Unknown`.
- `DoR` — `Definition of Ready`; минимальный набор условий, при котором элемент можно считать готовым к дальнейшей проработке.
- `delivery state` — состояние реализации элемента: сделано, частично сделано, не сделано и т.д.
- `depends_on` — зависимость одного элемента беклога от другого.
- `current` — текущее состояние discovery run, с которым работает система сейчас.
- `current truth` — авторитетное описание того, что реально существует в системе сейчас.
- `as-built` — реконструкция фактической системы на основе `current truth`.
- `source truth` — исходные авторитетные данные, из которых пересчитывается `backlog graph`.
- `source packet` — explicit машиночитаемый packet file, который агент формирует по схеме на основе prose-источников и затем передает утилите через CLI; это внутренний механизм агента, а не артефакт, который должен author-ить оператор.
- `runtime evidence` — код, runtime, deploy и ops-данные, из которых собирается `current truth`.
- `delta` — разница между текущей и прошлой версией беклога.
- `baseline` — принятая базовая версия беклога, с которой сравниваются следующие изменения.
- `architecture drift` — расхождение между целевой архитектурой и текущим состоянием run.
- `runtime drift` — расхождение между текущей системой и ранее зафиксированной `baseline`.
- `stale` — элемент, `proof`, `review artifact` или вывод, который устарел из-за изменений архитектуры или текущей системы.

## Общее правило

После любого изменения входных данных или состояния беклога `backlog graph` должен автоматически пересчитываться. Команды, меняющие operator-facing состояние run, автоматически обновляют `report.md`; отдельная команда `render` используется только как recovery-команда, если generated files нужно восстановить без нового изменения run.

## Допустимые входы

| Группа сценариев | Что оператор может дать агенту | Что агент не должен принимать как shortcut |
| --- | --- | --- |
| Создание беклога | один или несколько authoritative architecture/ADR/current-truth/evidence sources, optional `run-dir`, optional acceptance target | ручное редактирование canonical файлов |
| Аудит беклога | `run-dir`, optional item reference, optional audit question | пересказ устаревшего `report.md` без сверки с текущим состоянием run |
| Редактирование беклога | updated authoritative documents, change request на естественном языке, optional `run-dir`; для `delivery state` только authoritative current-truth evidence | ручное редактирование canonical артефактов; попытка менять `delivery_state` без authoritative current-truth evidence |

Оператор может ссылаться на run, элемент беклога, `Spike` или `architecture claim` по `id`, названию или краткому описанию. Агент обязан разрешить запрос к canonical `item_id` или `claim_id` и явно назвать разрешенный идентификатор в ответе, если это важно для diff или последующих шагов.

## Как читать ответ агента

Агент должен отвечать человеческим summary в чате и давать ссылку на актуальный run или `report.md`, если нужен подробный просмотр.

Основные operator-facing surfaces:

| Вопрос оператора | Основной источник ответа |
| --- | --- |
| Структура беклога, владельцы, порядок, зависимости | `report.md`: `Feature Candidates`, `Roadmap`, `Roadmap Matrix`, `Graph Relations` |
| Общий статус и summary metrics | `status` + `report.md`: `Run Summary`, `Lifecycle And Drift`, CLI blocks `Rebaseline readiness` / `New stale since last change`, report sections `Rebaseline Readiness` / `New Stale Since Last Change`, `Gaps And Validation` |
| Краткая карточка элемента | `report.md`: `Item Summary Index` |
| Полная детализация элемента | `report.md`: `Item Detail Sections` |
| Непокрытые claims и planning-ready items | `report.md`: `Final Operating Questions` |
| Drift, stale, stale proofs, stale reviews | `status` или `delta` + `report.md`: `Lifecycle And Drift`, CLI blocks `Rebaseline readiness` / `New stale since last change`, report sections `Rebaseline Readiness` / `New Stale Since Last Change`, `Review Governance`, `Gaps And Validation` |
| Delta между `current` и `baseline` | `delta` operator output; при необходимости дополнительно `report.md`: `Lifecycle And Drift` |

TODO: пересмотреть таблицу operator-facing surfaces после обновления контракта.

## 1. Создание беклога

Во всех сценариях ниже агент сначала читает prose-источники и интерпретирует смысл запроса, затем при необходимости author-ит explicit packet files по схеме и регистрирует их через штатную CLI утилиту. CLI materialize-ит canonical backlog graph, валидирует run и обновляет human-facing outputs.

| Код | Workflow | Промпт | Допустимые входы | Что делает агент |
| --- | --- | --- | --- | --- |
| `UC-01` | Create backlog from one source | `Собери новый беклог из [architecture-source] в [run-dir] и покажи результат.` | один authoritative architecture source, optional `run-dir`, optional acceptance target | Запускает `discover`, который сам инициализирует или переиспользует run, валидирует его и auto-render-ит `report.md`. В ответе ссылается на `Run Summary`, `Source Authority`, `Feature Candidates` и `Roadmap`. |
| `UC-02` | Create backlog from multiple sources | `Собери единый беклог из [architecture-source-1], [architecture-source-2] и [adr-source] в [run-dir].` | несколько authoritative architecture/ADR sources, optional `run-dir`, optional acceptance target | Запускает `discover` с несколькими источниками, показывает краткий итог и явный список использованных источников. Источник истины для source set — `Resolved sources` и `report.md` section `Source Authority`. |
| `UC-03` | Create backlog with current truth | `Собери беклог из [architecture-source] с учетом текущей системы из [runtime-source] в [run-dir].` | architecture/ADR sources плюс один или несколько `runtime_evidence`, `deployment_contract`, `code_evidence`, `operational_evidence` или delivered dossier sources | Пересчитывает run с учетом `as-built`, отдельно перечисляет принятые current-truth inputs и ссылается на `Source Authority`, `Feature Candidates`, `Item Summary Index` и `Lifecycle And Drift`. |
| `UC-04` | Draft backlog from incomplete architecture | `Собери черновой беклог из [architecture-source] и отдельно покажи Gap и Unknown.` | один или несколько неполных architecture/ADR sources | Строит черновой run без скрытия дыр, явно выносит `Gap`, `Unknown` и `Contradiction`, затем ссылается на `Feature Candidates`, `Item Summary Index` и `Final Operating Questions`. |

## 2. Аудит состояния беклога

### 2.1. Аудит беклога в целом

| Код | Workflow | Промпт | Допустимые входы | Что делает агент |
| --- | --- | --- | --- | --- |
| `UC-05` | Show structured backlog | `Покажи структурированный беклог по [run-dir] в удобном виде.` | `run-dir` | Отвечает из `Feature Candidates`, `Roadmap`, `Roadmap Matrix` и `Graph Relations`, не из сырых canonical JSON. |
| `UC-06` | Show backlog summary metrics | `Покажи общий статус беклога по [run-dir]: всего элементов, реализовано, не реализовано, Gap, Unknown, Contradiction, stale, warnings, hard-fails, DoR-ready.` | `run-dir` | Использует `status` как canonical operator summary. Возвращает фиксированный набор метрик: `sources_total`, `claims_total`, `contracts_total`, `data_domains_total`, `items_total`, `items_delivered`, `items_partially_delivered`, `items_not_started`, `gaps_total`, `unknowns_total`, `contradictions_total`, `stale_claims_total`, `stale_items_total`, `stale_proofs_total`, `stale_review_artifacts_total`, `warnings_total`, `hard_fails_total`, `dor_ready_total`, `review_artifacts_total`, `waivers_total`. Затем ссылается на `Run Summary`, `Lifecycle And Drift`, CLI blocks `Rebaseline readiness` / `New stale since last change`, report sections `Rebaseline Readiness` / `New Stale Since Last Change` и `Gaps And Validation`. |
| `UC-07` | Show delivery state for all items | `Покажи delivery state по всем элементам беклога в [run-dir].` | `run-dir` | Собирает список из `Feature Candidates`, `Item Summary Index`, `Item Detail Sections` и `Roadmap Matrix`. Если authoritative current-truth evidence недостаточно, явно говорит, какие item states остаются ненадежными. |
| `UC-08` | Show uncovered claims | `Покажи architecture claims, которые остаются uncovered в [run-dir].` | `run-dir` | Отвечает из `Final Operating Questions`; при необходимости дополняет item-level traceability через `Item Detail Sections`. |
| `UC-09` | Show ranked problem list | `Покажи все проблемные элементы беклога и отсортируй их по тяжести проблемы. Включи Gap, Unknown, Contradiction, stale и warnings/findings, если они привязаны к элементу.` | `run-dir` | Показывает ранжированный список проблемных элементов. Базовый severity order: `hard-fail/contradiction`, `stale`, `Gap`, `Unknown`, warning-only findings. Для каждого элемента указывает причину ранга и ссылку на источник проблемы в `Lifecycle And Drift`, `Review Governance`, `Final Operating Questions` или item-level sections. |
| `UC-10` | Show DoR-ready items | `Покажи элементы беклога, которые уже проходят DoR.` | `run-dir` | Использует `readiness_state` из canonical state, подтверждает ответ через `Final Operating Questions` и `Item Detail Sections`. |
| `UC-23` | Show delta from baseline | `Покажи delta между current и baseline для [run-dir].` | `run-dir` | Запускает `delta`. Это canonical operator-facing diff, потому что он печатает `Changed sources/claims/gates`, `Human-readable diff`, `Stale and readiness diagnostics` и CLI block `New stale since last change`. При необходимости дополнительно ссылается на `Lifecycle And Drift` и report section `New Stale Since Last Change`. |
| `UC-24` | Show stale items after drift | `Покажи элементы беклога, которые стали stale после drift.` | `run-dir` | Использует `status` или `delta` для текущего списка stale items и `Lifecycle And Drift` для file-based explanation. |
| `UC-25` | Show stale proofs and reviews | `Покажи stale proofs и stale review artifacts для [run-dir].` | `run-dir` | Использует `status` или `delta`, где canonical state уже содержит и `stale_proofs`, и `stale_review_artifacts`. Для rendered context ссылается на `Lifecycle And Drift` и `Review Governance`. |

### 2.2. Аудит отдельного элемента беклога

| Код | Workflow | Промпт | Допустимые входы | Что делает агент |
| --- | --- | --- | --- | --- |
| `UC-11` | Show item summary | `Покажи краткий статус элемента [item-id или название] в [run-dir].` | `run-dir` плюс `item_id`, title или описание | Разрешает запрос к canonical `item_id`, затем отвечает из `Item Summary Index`. Краткая карточка всегда содержит `item_id`, `title`, `item_class`, `summary_label`, `delivery_state`, `track_id`, `owners`, ключевые `depends_on` и major problems. |
| `UC-12` | Show item details | `Покажи полную детализацию элемента [item-id или название] в [run-dir].` | `run-dir` плюс `item_id`, title или описание | Разрешает запрос к canonical `item_id`, затем отвечает из `Item Detail Sections`. Полная карточка содержит поля summary плюс origin refs, claim refs, proof refs, review refs, contract/data-domain relations, readiness/done/rollout/recovery details и связанные `Gap`, `Unknown`, `Contradiction`, `Spike`. |

## 3. Работа с беклогом

| Код | Workflow | Промпт | Допустимые входы | Что делает агент |
| --- | --- | --- | --- | --- |
| `UC-13` | Change general item data via explicit packet or updated inputs | `Измени общие поля элемента [item-id или название] так: [изменение]. Не трогай Gap, Unknown, Spike, delivery state, depends_on и покрытие architecture claim.` | updated authoritative input или explicit `source packet` | Применяет только общий planning overlay, затем повторно запускает `discover`. Этот сценарий не используется для `Gap`, `Unknown`, `Spike`, `delivery_state`, `depends_on` и claim commitment edits. |
| `UC-14` | Change question on linked Spike | `Измени question у Spike для элемента [item-id или название] на: [новый question]. Если связанных Spike несколько, сначала покажи варианты.` | item reference плюс новый `question` через updated input или explicit `source packet` | Если связанных `Spike` несколько, сначала разрешает неоднозначность. Затем меняет `question` у связанного `Spike` и повторно запускает `discover`. |
| `UC-15` | Change Gap | `Измени Gap по элементу [item-id или название] так: [изменение].` | item reference плюс updated `Gap` content через updated input или explicit `source packet` | Меняет только `Gap`-related section и повторно запускает `discover`. |
| `UC-16` | Change Unknown | `Измени Unknown по элементу [item-id или название] так: [изменение].` | item reference плюс updated `Unknown` content через updated input или explicit `source packet` | Меняет только `Unknown`-related section и повторно запускает `discover`. |
| `UC-17` | Create timeboxed Spike | `Создай timeboxed Spike для элемента [item-id или название]. Если обязательных данных не хватает, сначала перечисли, что нужно уточнить.` | item reference плюс данные для `Spike` в explicit `source packet` | Если обязательных полей не хватает, сначала перечисляет их. Иначе создает `Spike`, повторно запускает `discover` и показывает краткую карточку нового элемента. |
| `UC-18` | Change owner | `Измени owner элемента [item-id или название] на [новый owner].` | item reference плюс новый owner через updated input или explicit `source packet` | Меняет owner, повторно запускает `discover`, затем ссылается на обновленные item и roadmap sections. |
| `UC-19` | Change depends_on relation | `Сделай так, чтобы [item-id-1 или название-1] depends_on [item-id-2 или название-2].` или `Убери relation [item-id-1 или название-1] depends_on [item-id-2 или название-2].` | обе ссылки на элементы плюс явное направление relation в explicit `source packet` | Меняет relation, повторно запускает `discover`, пересчитывает порядок и явно повторяет итоговое направление связи. Для проверки ссылается на `Graph Relations` и `Roadmap Matrix`. |
| `UC-20` | Update delivery state from current truth | `Обнови delivery state элемента [item-id] на основе данных о текущей системе из [runtime-source].` | authoritative current-truth source: `runtime_evidence`, `deployment_contract`, `code_evidence`, `operational_evidence` или delivered dossier source | Не принимает planning-only packet, который напрямую пишет `delivery_state`. Вместо этого добавляет evidence-backed source, повторно запускает `discover` и ссылается на `Source Authority`, `Feature Candidates` и item-level sections. |
| `UC-21` | Mark architecture claim as deferred, optional, or negative scope | `Пометь architecture claim [claim-id или название] как deferred или optional, либо вынеси его в negative scope с revisit_trigger: [текст].` | claim reference плюс explicit planning decision packet; для `negative_scope` обязателен `revisit_trigger` | Меняет только claim-commitment semantics, не переписывая identity и source trace claim-а, затем повторно запускает `discover`. |
| `UC-22` | Fix roadmap order through graph relations | `Исправь roadmap order для [item-id|название] так, чтобы он соответствовал depends_on.` | updated ordering inputs или relation changes через updated input или explicit `source packet` | Исправляет ordering inputs или graph relations, затем повторно запускает `discover` и ссылается на `Roadmap`, `Roadmap Matrix` и `Graph Relations`. |
| `UC-26` | Set new baseline with rebaseline | `Установи текущую версию беклога как новую baseline.` | `run-dir` | Запускает `rebaseline`, который auto-render-ит `report.md`. В ответе показывает результат, текущий render state и ссылается на CLI blocks `Rebaseline readiness` / `New stale since last change` и report sections `Rebaseline Readiness` / `New Stale Since Last Change`. |
| `UC-27` | Check rebaseline readiness | `Скажи, можно ли сейчас устанавливать новую baseline, и объясни почему.` | `run-dir` | Отвечает из блока `Rebaseline readiness` в `status` и из section `Rebaseline Readiness` в `report.md`. Формат ответа использует точные runtime statuses: `allowed`, `blocked` или `not_needed`, плюс причины. |
| `UC-28` | Check new stale after change | `Проверь, появились ли после последнего изменения новые stale элементы, proofs или review artifacts.` | `run-dir` | Отвечает из блока `New stale since last change` в `discover`, `status` или `delta`, а также из rendered section `New Stale Since Last Change`. Если новых stale нет, прямо говорит это, а не заставляет читать diagnostics вручную. |
| `UC-29` | Add current truth to existing run | `Добавь current truth из [runtime-source] в существующий run [run-dir] и пересчитай беклог.` | существующий `run-dir` плюс один или несколько authoritative current-truth sources | Повторно запускает `discover` с новым current-truth source и затем ссылается на `Source Authority`, `Feature Candidates`, `Lifecycle And Drift` и item-level sections. |

## Задачи на доработку методики

Статус пунктов ниже не считается подтвержденным; они требуют перепроверки при восстановлении контракта и runtime behavior.

| Код | Что требуется перепроверить | Где зафиксировано |
| --- | --- | --- |
| `METH-01` | Добавлен явный extraction contract: `Extraction Checklist`, decision table для `source-only discovery` vs explicit packet, mapping operator intent -> packet sections. | `references/standard.md`, `SKILL.md` |
| `METH-02` | Operator-facing help был вынесен в shipped reference-файл skill package; этот файл остается development-документом для доработки сценариев. | `references/operator-manual.md`, `docs/operator-use-cases.ru.md`, `SKILL.md` |
| `METH-03` | Канонически определены `stale_review_artifacts`, причины устаревания и поведение после `rebaseline`. | `references/standard.md`, `assessment.json`, `status`, `delta`, `report.md` |

## Доработка утилиты

Статус пунктов ниже не считается подтвержденным; они требуют перепроверки при восстановлении контракта и runtime behavior.

| Код | Что требуется перепроверить | Где проявляется |
| --- | --- | --- |
| `CLI-01` | Все mutating commands auto-render-ят `report.md`; отдельный `render` остался recovery-командой. | `discover`, `repair`, `validate`, `delta`, `rebaseline`, `render` |
| `CLI-02` | Утилита вычисляет и хранит `stale_review_artifacts`, а затем отдает их в operator-facing outputs и generated views. | `assessment.json`, `status`, `delta`, `report.md` |

## Практический критерий успеха

Оператору нужен не “граф”, не “packet” и не “канонический JSON” как таковые.

Оператору нужен способ прийти к следующему результату:

- из архитектуры получен точный список элементов беклога;
- для каждого элемента беклога понятны смысл, владелец, место в последовательности и зависимости;
- все `Unknown` либо сняты, либо вынесены в отдельные `Spike`;
- все заметные `Gap` превращены в исполнимую работу или явно переведены в `deferred`, `optional` или `negative scope`;
- беклог можно дальше использовать для специфицирования и планирования имплементации.
