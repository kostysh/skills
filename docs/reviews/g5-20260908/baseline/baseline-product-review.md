# Независимый baseline review: prd-engineer и requirements-approval

Итог: установлены два ограниченных P2-дефекта активного контракта. Проверка инструкций, не поведенческая сертификация.

Режим `baseline`, assurance `independent`: авторство и исправление проверяемых пакетов не выполнялись. Потребитель отчёта — владелец G5-v1. Snapshot: `/tmp/g5-evidence-8z1wlw3e/baseline/skills`, Git `504b87331f22b3a5303875bef69163a40d4372d7`; предоставленная identity manifest `bb7039d80648b4e9ddb2052f71b4c1f14355ee4c562da1e98dd2e3946de8a618`. Identity повторно не вычислялась.

## prd-engineer — FAIL

**P2 PRD-BASE-1 — Обязательный внешний authoring gate не имеет fallback для переносимого пакета.**

- Основание: direct для отсутствующего контракта, inferred для поведения исполнителя. `prd-engineer/SKILL.md:19` требует применять `implementation-discipline` до выбора глубины для каждого нетривиального создания, изменения или review. Источник: `skill.yaml:85`; interop `skill.yaml:213–216` оставляет gate за этим соседом. Локальная инструкция не определяет действия при недоступности skill. `docs/skill-standard.md`, раздел Portability, требует явно определять, что остаётся возможным без специализированной зависимости. Повторённые поля результата помогают, но не определяют, являются ли они достаточной заменой внешнего gate.
- Путь: агенту передан только переносимый `prd-engineer`, пользователь просит полезный первый PRD по достаточным входам → обязательный предшествующий skill отсутствует → агент либо останавливает поддерживаемое локально составление PRD, либо молча считает ненаблюдаемый внешний gate выполненным. Это неопределённость interop на объявленной границе переносимости.
- P1 screen: ложная продуктовая готовность из этого места не установлена: отдельные правила текущей authority и ready сохраняются. Поддержанный эффект — лишняя блокировка или неподтверждённое выполнение внутреннего gate, поэтому P2.
- Направление исправления: явно определить локально достаточный scope/authority check, условие загрузки доступного соседа и точный предел вывода при его отсутствии. Не ослаблять текущую authority и не расширять продуктовый scope.
- Фальсификатор: свежий исполнитель получает только этот пакет и достаточный запрос на draft PRD; он завершает поддерживаемый draft, не просит устанавливать skill, не утверждает применение недоступного метода и не объявляет неподтверждённый ready. Пара с доступным соседом должна сохранять его действительные ограничения.

Положительные результаты inspection: actor/product boundary, текущая версия authority, named-consumer readiness, source-atom reconciliation и запрет архитектурного самоназначения выражены. Шаблон существует и содержит условия/исключения, source mapping и ограничение product-input readiness. Mandatory/optional название шаблона неоднозначно, но конкретный root trigger доступен; самостоятельный P2 на этом основании не установлен.

## requirements-approval — FAIL

**P2 RA-BASE-1 — В предметный runtime выведена безусловная компиляция самого skill.**

- Основание: direct для инструкции, inferred для исполнения. `requirements-approval/SKILL.md:193–198`, особенно строка 197, требует перед завершением `Compile to an isolated directory and confirm copied eval and supporting artifacts remain readable`. Источник: `skill.yaml:237–241`. Условие `after source changes` присутствует лишь у отдельного первого пункта; заголовок и пункт compilation не ограничены обслуживанием skill. Target `AGENTS.md` прямо отделяет maintenance guidance от runtime contract, однако опубликованный root возвращает maintenance-действие в обычную активацию.
- Путь: пользователь просит подготовить согласование из предоставленных вопросов → перед финальным ответом исполнитель видит обязательную compilation/eval-copy проверку → ищет compiler/source bundle, пишет посторонний compiled package или блокирует согласование из-за их отсутствия. Это не подтверждает triage, полномочия ответа или durable disposition.
- P1 screen: компиляция в изолированную директорию сама по себе не доказывает опасную мутацию или ложное закрытие workflow; Git/GitHub/email authority остаётся ограниченной. Установленный ущерб — посторонняя работа и ненужная зависимость/блокировка, поэтому P2.
- Направление исправления: оставить maintenance checks в maintenance-only поверхности либо явно ограничить весь блок изменениями исходников skill. Обычный финал должен проверять предметный output и фактически затронутые границы.
- Фальсификатор: свежий исполнитель с export-only входом готовит approval draft, не запускает compiler и не создаёт package output; отдельная авторизованная maintenance-задача всё ещё требует соответствующие structural checks.

Положительные результаты inspection: sender identity отделена от decision authority; конфликт и недоступное вложение ограничивают зависимый вопрос; внешний write требует конкретной authority; complete reply не приравнен к closure; durable follow-up ограничен decision-workflow boundary. Эквивалентные exported inputs явно разрешены вместо отсутствующих connectors.

## Проверки, ограничения и следующий владелец

Прочитаны применимые AGENTS, normative standard, замороженные skill-reviewer root/methodology/forward-testing; у обеих целей — source YAML, overview, emitted root, UI metadata, eval definitions/fixtures; у PRD — активный template. Прямые контракты соседей implementation-discipline, architecture-engineer и spec-engineer проверены только для ownership/handoff. Supporting history не использовалась как authority или proof.

Read-only проверка подтвердила точное вхождение обоих overview fragments в emitted roots и существование всех локальных Markdown targets корневых файлов. Runtime/scripts не заявлены. Полная compiler regeneration/parity, catalog selection, blind execution и реальные Gmail/GitHub/Git границы не выполнялись; eval JSON — намерение тестов, не результаты. Новые verdicts нельзя переносить на изменённые snapshots.

Учтены рекомендации [GPT-6 Astra — Prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices): проверять влияющие инструкции, устранять неоднозначные блокировки, доводить разрешённую часть до результата и соотносить verification с задачей. Примеры разрешений и делегации из документа не импортированы. Длина текста сама по себе не использовалась как дефект.

Следующий владелец — автор G5-v1: ограниченно исправить два контракта в source и regenerated surface, затем предоставить новый стабильный snapshot и поведенческие результаты указанных failure paths. Ни исправления, ни испытания этим отчётом не заявлены.
