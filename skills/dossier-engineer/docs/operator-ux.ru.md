# Operator UX for `dossier-engineer`

Главная модель взаимодействия такая: **оператор формулирует продуктовую цель и ограничения, агент ведёт досье через `dossier-engineer` runtime**. Оператору не нужно вручную заполнять frontmatter, придумывать ID, менять статусы или следить за YAML-схемой.

## Базовое правило для оператора

Не давай агенту задачу в стиле:

> Сделай API, таблицы, lifecycle и тесты.

Лучше так:

> Используй `dossier-engineer`. Сначала сформулируй capability: какое наблюдаемое поведение должно появиться у системы, как его продемонстрировать, какие anti-claims зафиксировать, и только потом создай work item и план реализации.

То есть оператор управляет **смыслом и приоритетами**, а агент обязан управлять **досье, runtime-командами, проверками и evidence**.

---

# Типовой процесс

## 1. Старт нового проекта

Команда агенту:

```text
Используй skill dossier-engineer.
Инициализируй досье для нового проекта <название>.
Канонический источник концепции: <путь к concept/architecture/spec документу>.
Сначала зарегистрируй source, затем выдели initial capabilities.
Не создавай work items, пока capability claim, demo scenario и anti-claims не будут сформулированы.
```

Что агент должен сделать:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<concept>"
dossier-engineer capability create ...
dossier-engineer capability claim set ...
dossier-engineer capability check --root .
```

Оператор после этого смотрит не “список задач”, а **карту будущих способностей продукта**.

Хороший контрольный вопрос оператору:

```text
Покажи мне capability map и объясни, какая observable behavior появится у продукта после реализации каждой capability.
```

---

## 2. Старт в уже существующем рабочем проекте

Команда агенту:

```text
Используй dossier-engineer в режиме existing-project onboarding.
Проект уже имеет рабочую функциональность. Не создавай искусственно закрытые work items.
Сначала зафиксируй baseline существующих capabilities с evidence.
Раздели observed, partial и unverified capabilities.
```

Что агент должен сделать:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<current concept>"
dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <source-id>
dossier-engineer capability create --title "<existing capability>" --status existing --source <source-id>
dossier-engineer capability claim set ...
dossier-engineer capability demo record ...
dossier-engineer baseline capability add ...
dossier-engineer capability check --root .
```

Ключевой смысл: существующий код **не считается доказанной функцией автоматически**. Доказанной считается только capability с наблюдаемым поведением и evidence.

---

## 3. Получить текущее состояние проекта

Команда агенту:

```text
Используй dossier-engineer и покажи текущее состояние проекта:
status, attention, queue, capability check и guardrail check.
После этого предложи следующий самый безопасный шаг.
```

Что агент должен выполнить:

```bash
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer queue --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

Что оператор должен смотреть:

* какие capabilities доказаны;
* какие capabilities только заявлены;
* есть ли support work без продуктового результата;
* есть ли source changes;
* есть ли guardrails;
* какие work items реально готовы к работе.

---

## 4. Создать новую продуктовую фичу

Команда агенту:

```text
Создай новую capability для следующего поведения: <описание>.
Источник требования: <source/doc/section>.
Сначала сформулируй capability claim в формате:
actor -> trigger -> behavior -> response -> state change -> continuity.
Затем добавь anti-claims и demo scenario.
После этого создай capability work item.
```

Агент должен использовать примерно такой путь:

```bash
dossier-engineer capability create ...
dossier-engineer capability claim set ...
dossier-engineer capability anti-claim add ...
dossier-engineer work create --delivery capability ...
dossier-engineer work acceptance add --kind behavior ...
dossier-engineer work demo set ...
dossier-engineer work anti-claim add ...
dossier-engineer capability check --work <work-id>
```

Операторский критерий качества:

```text
Я должен понимать, что именно пользователь/оператор/система сможет сделать после реализации, и как это будет доказано.
```

---

## 5. Разработать фичу через полный workflow

Команда агенту:

```text
Возьми work item <WI-id> и проведи его через полный dossier workflow:
feature-intake -> spec-compact -> plan-slice -> implementation.
На plan-slice обязательно сначала оспорь задачу:
где она может стать инфраструктурной заготовкой,
что может оказаться самообманом,
какие implied expectations не записаны.
Не закрывай implementation без behavioral verification и concept-conformance review.
```

Агент должен идти стадиями:

```bash
dossier-engineer stage start --work <work-id> --stage feature-intake --session <session-id>
dossier-engineer stage ready --work <work-id> --stage feature-intake --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage feature-intake

dossier-engineer stage start --work <work-id> --stage spec-compact --session <session-id>
dossier-engineer stage ready --work <work-id> --stage spec-compact --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage spec-compact

dossier-engineer stage start --work <work-id> --stage plan-slice --session <session-id>
dossier-engineer work challenge record --work <work-id> --summary "<challenge>"
dossier-engineer stage ready --work <work-id> --stage plan-slice --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage plan-slice

dossier-engineer stage start --work <work-id> --stage implementation --session <session-id>
```

После реализации:

```bash
dossier-engineer verify required --work <work-id> --stage implementation
dossier-engineer verify record --work <work-id> --stage implementation --profile behavioral-demo --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>

dossier-engineer review required --work <work-id> --stage implementation
dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>
dossier-engineer review record --work <work-id> --stage implementation --class spec-conformance-reviewer --verdict pass --reviewer <reviewer-id>

dossier-engineer stage ready --work <work-id> --stage implementation --summary "<implemented result>"
dossier-engineer stage close --work <work-id> --stage implementation
dossier-engineer hygiene run --work <work-id> --stage implementation
```

---

## 6. Создать инфраструктурную задачу правильно

Инфраструктура допустима, но она не должна маскироваться под функцию.

Команда агенту:

```text
Создай support work item для <инфраструктурная задача>.
Свяжи его с capability <CAP-id> или guardrail <KILL-id>.
Объясни, почему эта support-задача нужна сейчас и какую capability она разблокирует.
Не засчитывай её как продуктовую функцию.
```

Агент должен использовать:

```bash
dossier-engineer work create --delivery support ...
dossier-engineer work support explain --work <work-id> --summary "<why needed now>"
dossier-engineer capability check --work <work-id>
```

Хороший операторский вопрос:

```text
Какая capability останется невозможной, если мы не сделаем эту support-задачу?
```

Если агент не может ответить, задача, скорее всего, преждевременная.

---

## 7. Исправить баг или регрессию

Команда агенту:

```text
Исправь баг <описание>.
Сначала найди capability, которую баг нарушает.
Создай maintenance work item, зафиксируй regression demo, затем реализуй fix.
Закрывай задачу только после доказательства, что существующая capability восстановлена.
```

Агент должен создать work item с:

```bash
dossier-engineer work create --delivery maintenance --relation maintains ...
dossier-engineer work demo set --work <work-id> --name "<regression demo>" --scenario "<behavior restored>"
```

Тут цель не “починить код”, а **восстановить наблюдаемую способность системы**.

---

## 8. Провести research / exploration

Команда агенту:

```text
Создай exploration work item для вопроса: <вопрос>.
Не представляй результат как продуктовую capability.
Закрой exploration только когда будет записан ответ, evidence и решение:
создавать follow-up work или явно не создавать.
```

Агент использует:

```bash
dossier-engineer work create --delivery exploration --type research ...
```

Exploration не должен тихо превращаться в “мы вроде сделали фичу”.

---

## 9. Изменился source/concept/spec

Команда агенту:

```text
Источник <path/source-id> изменился.
Обнови source hash, покажи impacted capabilities и work items.
Не меняй задачи автоматически. Сначала покажи source impact и предложи решения.
```

Агент должен выполнить:

```bash
dossier-engineer source refresh --source <source-id>
dossier-engineer source impact --source <source-id>
```

Затем оператор принимает решение:

```text
Для impacted item <WI-id> открой change-proposal и обнови scope.
```

или:

```text
Отметь source review как no_backlog_change с обоснованием.
```

---

## 10. Когда в ходе реализации найден drift

Команда агенту:

```text
Останови текущую implementation stage.
Открой change-proposal для <WI-id>.
Опиши, что изменилось: concept, capability claim, acceptance, demo или scope.
После принятия изменения верни задачу на самую раннюю затронутую стадию.
```

Агент использует:

```bash
dossier-engineer stage start --work <work-id> --stage change-proposal --session <session-id>
dossier-engineer work amend --work <work-id> --from-change-proposal --summary "<accepted change>"
dossier-engineer stage ready --work <work-id> --stage change-proposal --summary "<verdict>"
dossier-engineer stage close --work <work-id> --stage change-proposal
```

Главное: drift не чинится “по ходу дела” незаметно.

---

## 11. Параллельная разработка / несколько агентов

Команда каждому агенту:

```text
Работай только в scope своего work item/capability.
Не редактируй чужие dossier records.
Перед handoff создай changeset для текущей ветки и выполни lint, capability check, guardrail check.
```

Перед PR агент должен выполнить:

```bash
dossier-engineer changeset create --scope current-branch --summary "<branch summary>"
dossier-engineer lint --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

Операторский принцип: каждый агент работает в своём **work/capability scope**, а не в общем глобальном state-файле.

---

## 12. Перед merge / handoff

Команда агенту:

```text
Подготовь handoff по текущей ветке.
Создай changeset, проверь dossier consistency, покажи blockers, stale reviews, failed verification и affected capabilities.
Не скрывай незакрытые риски.
```

Агент должен показать:

* что было изменено;
* какие capabilities затронуты;
* какие work items закрыты;
* какие evidence записаны;
* какие reviews свежие;
* какие blockers остались;
* есть ли guardrails.

---

## 13. Ретроспектива процесса

Команда агенту:

```text
Создай retrospective report за период <date/ref>.
Найди:
- support work без capability progress;
- задачи, где spec сдвинулся от concept;
- stale reviews;
- failed или weak behavioral evidence;
- повторяющиеся blockers;
- места, где workflow создавал лишний overhead.
Дай рекомендации по улучшению процесса.
```

Агент использует:

```bash
dossier-engineer retro create --since <date-or-ref> --until <date-or-ref>
```

---

# Практические шаблоны команд оператору

## “Что делать дальше?”

```text
Используй dossier-engineer.
Выполни status, attention, queue, capability check и guardrail check.
Скажи, какой следующий шаг наиболее безопасен и почему.
```

## “Сделать фичу без самообмана”

```text
Используй dossier-engineer.
Для фичи <описание> сначала создай или обнови capability.
Сформулируй observable behavior, demo scenario и anti-claims.
Перед реализацией оспорь план.
Не закрывай work item без behavioral evidence и concept-conformance review.
```

## “Не строить лишнюю инфраструктуру”

```text
Проверь, не является ли этот work item инфраструктурой вместо функции.
Если это support work, явно свяжи его с capability или guardrail.
Если связи нет, предложи либо изменить задачу, либо отложить её.
```

## “Проверить готовность к закрытию”

```text
Проверь work item <WI-id> на closure readiness.
Покажи missing gates:
behavioral evidence, concept conformance, spec conformance, anti-claims, demo scenario, stale reviews, blockers, source-review impact и guardrails.
```

## “Разобрать существующий проект”

```text
Используй dossier-engineer existing-project onboarding.
Создай baseline текущего продукта.
Зафиксируй observed capabilities с evidence.
Отдельно выдели partial и unverified capabilities.
Не создавай closed work items задним числом.
```

## “Планировать следующий sprint/slice”

```text
Используй queue и capability check.
Предложи следующий набор work items так, чтобы каждый capability item давал observable progress.
Ограничь support work только тем, что прямо разблокирует capability или guardrail.
```

---

# Как оператору оценивать качество работы агента

Сильный ответ агента содержит:

* ссылку на source/concept;
* capability claim;
* behavioral acceptance;
* demo scenario;
* anti-claims;
* pre-implementation challenge;
* ясное разделение capability/support/maintenance/exploration;
* runtime commands или результаты их выполнения;
* blockers и next actions;
* evidence перед closure.

Слабый ответ агента выглядит так:

* “создадим таблицы/API/тесты” без observable behavior;
* “фича готова”, но demo показывает только внутренний статус;
* “тесты проходят”, но пользовательский сценарий не доказан;
* support-задачи копятся без end-to-end capability;
* агент вручную правит frontmatter;
* агент закрывает work item без concept-conformance review.

Главный операторский вопрос, который стоит регулярно задавать:

```text
После закрытия этой задачи какая новая или восстановленная способность системы будет наблюдаемо работать, и чем это доказано?
```
