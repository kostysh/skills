# Baseline: независимая оценка catalog selection

**Результат записанных решений: FAIL — 14 PASS, 1 FAIL.** Во всех 15 случаях выбран правильный основной владелец. C09 дополнительно и без условия назначает `supabase-engineer`, хотя вход не устанавливает Supabase-контекст. Это ограниченный дефект состава выбранных скиллов, не вывод о выполнении security review или качестве исправлений.

Режим: bounded baseline assessment; assurance: **independent**. Оценщик не автор candidate и не исполнитель выбора. Проверены все 15 raw tasks и все 15 результатов; целевые скиллы и runtime-среды не изменялись.

## Зафиксированная основа

Критерий взят без изменения из [protocol/catalog.json](protocol/catalog.json), frozen `2026-09-09T12:04:33.644561+00:00`: первый элемент oracle — обязательный основной владелец; companions допустимы для реальных отдельных решений, включая условный последующий handoff. Обязательный выбор неприменимого target — ошибка. Выбор должен предшествовать загрузке тел скиллов и реализации. Естественная активация ограничена предоставленным каталогом из22 элементов.

| Артефакт | SHA-256 | Проверка |
| --- | --- | --- |
| `protocol/catalog.json` | `1d81adb1d9f01841520a0cee4f10a7f3e99c7b41c13b508a4bb3fbcd97a5fcfa` | Прочитан целиком; oracle и критерий не менялись |
| [tasks.json](/tmp/framework-platforms-20260909/trials/baseline/catalog/tasks.json) | `78b01d8948c5194e78f8e09dfa54ed271455af76c650cfdb8ab22f1d2b6b28f5` | Совпадает с frozen hash;15 уникальных ID |
| [catalog.json](/tmp/framework-platforms-20260909/trials/baseline/catalog/catalog.json) | `7c87ebe3691ae0efffddd255004b7df3454aa8860f2f167ac3aa1448c2f13489` | Совпадает с frozen hash;22 записи name/description/UI metadata |
| [result.json](/tmp/framework-platforms-20260909/trials/baseline/catalog/result.json) | `a252d0e95656970079c6d3fd8c2c5d4c260d08261b177c77f360b74064193341` | Прочитаны все15 решений; нет пропущенных/дублирующихся ID или имён вне каталога |

UI metadata входит в фактическую экспозицию: это не опыт только с `description`. Отсутствующие в ограниченном каталоге конкурирующие plugin/skill описания не участвовали; результат нельзя распространить на весь установленный каталог или произвольные пользовательские запросы.

## Вердикт каждого случая

В столбце companions указана оценка фактически записанного состава. `implementation-discipline` допустим для заявленной реализации, проверки кода или архитектурного/миграционного планирования и не заменяет доменного владельца.

| ID | Обязательный основной владелец → фактический | Companions и основание | Вердикт |
| --- | --- | --- | --- |
| C01 | `hono-engineer` → `hono-engineer` | `typescript-engineer` соответствует отдельному typed-client контракту; `implementation-discipline` — ограниченному исправлению. Hono остаётся владельцем validation/error API. | PASS |
| C02 | `supabase-engineer` → `supabase-engineer` | Только `implementation-discipline`; не навязан формальный security verdict вместо разрешённого исправления grants/RLS. | PASS |
| C03 | `nextjs` → `nextjs` | Обязательный `supabase-engineer` присутствует и владеет сохранением/чтением; Next отвечает за форму, отображение и reload. `implementation-discipline` применим. | PASS |
| C04 | `electron-engineer` → `electron-engineer` | `implementation-discipline` применим; не добавлен React-владелец только по факту renderer. IPC/preload/Linux package остаются Electron-задачей. | PASS |
| C05 | `docusaurus-repo` → `docusaurus-repo` | `implementation-discipline` применим; version/locale/base URL и поиск production build распознаны как Docusaurus. | PASS |
| C06 | `payload` → `payload` | `implementation-discipline` применим; восстановление правил доступа собственного endpoint принадлежит Payload, не миграции контента. | PASS |
| C07 | `payload-migration` → `payload-migration` | Оба обязательных companions `payload` и `nextjs` присутствуют: импорт в целевую CMS и проверка потребляющей страницы. `implementation-discipline` применим. | PASS |
| C08 | `node-engineer` → `node-engineer` | Companions отсутствуют; Hono/Supabase не активированы для обычного зависшего Node процесса. | PASS |
| C09 | `security-reviewer` → `security-reviewer` | Основной владелец верен, `implementation-discipline` допустим. Безусловный `supabase-engineer` не обоснован raw task: `security-definer RPC` устанавливает предмет security review, но не использование Supabase. Условие последующего platform handoff не записано. | **FAIL** |
| C10 | `react-components-engineer` → `react-components-engineer` | `implementation-discipline` применим; hydration нескольких экземпляров направлена компонентному владельцу без ложного Next/CMS выбора. | PASS |
| C11 | `react-spa-engineer` → `react-spa-engineer` | `implementation-discipline` применим; Zustand/React Router относятся SPA, отсутствующий Electron не активирован. | PASS |
| C12 | `documentation` → `documentation` | Companions отсутствуют; how-to по существующему CLI не превращена в разработку CLI/Docusaurus сайта. | PASS |
| C13 | `typescript-engineer` → `typescript-engineer` | Companions отсутствуют; условный тип не активирует framework/CMS. | PASS |
| C14 | `payload-migration` → `payload-migration` | `implementation-discipline` применим к подготовке стратегии миграции. Reason явно сохраняет запрет выполнения импорта. | PASS |
| C15 | `architecture-engineer` → `architecture-engineer` | Обязательный `supabase-engineer` присутствует как поставщик платформенных ограничений; topology остаётся архитектурному владельцу. `implementation-discipline` применим. | PASS |

## C09: ограниченный finding

Basis: **direct** для записанного выбора и входа; **inferred** для риска избыточной активации. Confidence: **medium** — отсутствующие сведения о целевом RPC нельзя восполнить предположением, что это Supabase. Вход: «Нужен формальный read-only security review security-definer RPC и оценка серьёзности риска». Ответ безусловно включает Supabase и объясняет его участие платформенной семантикой, которой вход не устанавливает.

Failure path: общий RPC security request → правильный `security-reviewer` плюс необусловленный платформенный companion → расширение набора обязательных владельцев до неподтверждённой платформы. Критерий protocol требует реальной отдельной задачи для companions. Нельзя считать API термин `RPC` достаточным доказательством конкретного провайдера.

**P1 screen:** серьёзность bounded selection finding — **P2**. Нет записанного смещения основного security-владельца, начала remediation, опасного действия или ложного security/implementation PASS. Поддержан только лишний безусловный target в решении выбора. Это не доказательство систематически неверной маршрутизации.

Закрывающий oracle для сопоставимого candidate: сохранить `security-reviewer` главным; не назначать Supabase обязательным без платформенного входа либо явно обозначить условный handoff после подтверждения, что RPC размещён в Supabase. Нельзя менять raw C09 добавлением слова Supabase и выдавать новый вход за исправление того же случая. Из этого наблюдения не следует необходимость править описание Supabase без диагностики причины и candidate trial.

## Граница доказательства

**Подтверждено:** входной каталог совпадает с frozen22-entry snapshot;15 первичных владельцев совпадают с oracle; обязательные companion-handoffs C03/C07/C15 сохранены;14 полных составов выбора соответствуют критерию; один состав требует указанного уточнения. Это оценка фактического `result.json`, а не прогноз поведения.

**Независимо не подтверждено:** в предоставленном каталоге trial находятся только `tasks.json`, `catalog.json`, `result.json`. Отсутствует tool trace/исполнительский transcript, который подтверждал бы, что тела скиллов не читались до решения, реализация не начиналась, executor не видел oracle/диагнозы и использовал назначенные GPT-6 Astra/settings. Эти свойства экспозиции имеют статус **INCONCLUSIVE в доступной доказательной базе**. Это не утверждение, что нарушение произошло. Хеш JSON результата подтверждает его идентичность, но не происхождение или ограничения контекста исполнителя.

Записанные reason-поля не доказывают фактическое соблюдение operating modes, полномочий, HTTP/DB/browser/packaging границ. Здесь не оценивались forced execution, bodies/references, качество реализации, runtime/API, Supabase Auth/RLS, Electron Linux package или production build/deployment. Итоговые семь skill PASS этим отчётом не выдаются.

Для завершения acquisition-части достаточно привязать к тем же хешам уже имеющийся независимый executor transcript с фактической model/settings/exposure; сам по себе этот пробел не требует нового runtime или переписывания заданий. Следующий владелец — root protocol owner: сохранить14 положительных результатов и C09 finding отдельно от общей оценки скиллов и сопоставить candidate при неизменённых входах/критериях.

Уточнение protocol owner после оценки: root сообщил, что spawn metadata фиксирует назначение `gpt-6-astra`, `high`, `fork_turns=none`; фактическая backend model identity недоступна. Назначенные параметры поэтому учитываются как подтверждённые владельцем запуска, а не извлечённые из трёх JSON этого trial. Это не восполняет отсутствующий executor read log и не меняет14 PASS/1 FAIL для записанных решений. Root сохранит original trial и проведёт симметричные baseline/candidate запуски с per-command read capture; результаты будущих запусков в этот отчёт не включены.


## Дополнение: публичный trace и происхождение результата, 2026-09-09

Verdict **14 PASS / 1 FAIL (C09), primary 15/15** сохранён. Для acquisition ранее указанное отсутствие read/write trace снято в границах нового свидетельства: **bounded acquisition PASS**.

[baseline_catalog_executor.jsonl](raw-agent-traces/baseline_catalog_executor.jsonl), events1–4: единственное чтение — frozen `tasks.json` и `catalog.json`; полностью видимый stdout побайтово совпадает с их конкатенацией. Следующая операция — `apply_patch` для `result.json`; строки patch восстанавливают нынешний результат побайтово. В этих четырёх событиях нет skill-body reads, implementation или иных источников. Это подтверждает конкретный catalog-only путь получения решения; первоначальный пробел больше не следует представлять как отсутствие любых read evidence. Нового selection run не было. Прежние результаты, хеши и C09 не переписаны.

Проверены SHA-256 trace против manifest и последовательность публичных tool-call inputs/outputs. Model `gpt-6-astra`, effort `high` теперь наблюдаются в записанной turn configuration; это не независимая аттестация фактической backend model identity. Экспорт не содержит полного контекста/dispatch history: из него нельзя доказать отсутствие любой незафиксированной экспозиции. В явных reads не обнаружены candidate или закрытый rubric. Непрозрачные служебные communication payloads не интерпретировались и не использованы для выводов. Поведенческие испытания, изменения trial/candidate и обращения к БД оценщиком не выполнялись.
