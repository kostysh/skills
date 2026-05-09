# Ревью скила spec-engineer

Общая оценка
Скил концептуально сильный: чётко противопоставляет capability vs substrate, продвигает фальсифицируемые требования, anti-claims и right-sizing. 

Основной риск — несколько мелких структурных дефектов в SKILL.md и недостаточная навигация между смежными скилами. Также не хватает «golden example» итогового артефакта.

## Критичные проблемы (fix)

1. Пустой/дублирующий заголовок ## Overview
SKILL.md:44-46 содержит подряд ## Overview и ## Core objective — Overview пустой. Похоже на артефакт сборки фрагмента fragments/overview.md. Нужно сделать его нормальным родителем для блоков Core / Capability / Right-sized. Скорее всего путем форматирования.

2. SKILL.md:201 ссылается на docs/* и docs/issues/*. - Полностью убери "Supporting and historical surface"

3. Нет cross-reference на родственные скилы prd-engineer, spec-conformance-reviewer и concept-conformance-reviewer.
SKILL.md:36-42 (When NOT to use) описывает кейсы «не для этого скила», но не называет, какой скил подходит. У соседей это сделано явно. Добавить:

«PRD вместо спеки → prd-engineer»
«Проверка кода против спеки → spec-conformance-reviewer»
«Substrate vs capability в коде → concept-conformance-reviewer»

4. Нет «выходного» примера спеки
В скиле подробно описаны как писать, но нет ни одного полноценного worked example (input → готовый spec). Это самая частая причина того, что агент собирает Frankenstein-документ из шаблонов. Добавить в references/ файл example-spec.md с одним маленьким, но реалистичным примером (например, API endpoint или validation rule) — input на 3-4 строки, output по compact-шаблону из methodology.md:170-179.

## Существенные улучшения (should-fix)

5. Compact-шаблон не подсвечен в SKILL.md
В methodology.md:170-179 есть отличный 6-секционный compact-шаблон для маленьких задач, но SKILL.md ни разу о нём не упоминает. Risk: агент будет тянуть полный шаблон даже на одну функцию. Добавить в Right-sized rigor (SKILL.md:62-70) явный поинт «for trivial scope, use compact 6-section template (see methodology.md)».

6. Нет contract на input
code-reviewer чётко работает на «diff/branch». prd-engineer — на «product idea / existing PRD». У spec-engineer нет аналогичного определения: что считается допустимым input (свободный prose? ticket? API change в коде?). Добавить блок ## Input contract или дополнить Start here строкой о минимально приемлемом входе.

7. Дубликат «Choose representation»
Workflow-стейдж SKILL.md:104-118 и Policy Representation-fit SKILL.md:171-172 почти повторяют друг друга, а также есть ещё таблица в methodology.md:107-117. Это три места с одним и тем же знанием — оставить одну каноничную таблицу в methodology.md, в SKILL.md оставить только указатель и краткий тезис.

8. Дублирование Stop rule / Open questions gotcha
Gotcha в SKILL.md:158 и шаг 4 стейджа Audit (SKILL.md:143) и Stop rules в methodology.md:230-238 описывают одно и то же тремя путями. Stop rules вообще стоит поднять в SKILL.md как отдельный блок — это самое полезное практическое правило безопасности скила, сейчас оно похоронено в reference.

9. Нет финального чек-листа в SKILL.md
methodology.md:213-227 содержит сильный «Quality audit before finalizing». Стоит на него явно сослаться в стейдже Audit SKILL.md строкой типа «before reporting done, run the Quality audit checklist from methodology.md». Сейчас связь имплицитная.

10. Patterns: непоследовательное наличие falsifiers
В spec-patterns.md Common falsifiers есть у API endpoint, Workflow, Migration, Function. Нет у Small feature, Validation rule, NFR, UI. Привести к единому формату — каждый паттерн должен иметь 2-3 falsifier.

11. UI pattern не покрывает доступность достаточно
spec-patterns.md:151-162: «accessibility-relevant behavior» — слишком общо. Добавить конкретику: focus management, keyboard navigation, screen reader announcements, контраст, error linking. Это самая частая «substrate-only» зона в UI спеках.

Нюансы и nit-замечания
12. Смешанные языки в supporting docs
docs/README.md на русском, остальные нормативные файлы — на английском. Согласно правилу portability + чтобы не сбивать downstream-агентов, перевести README на английский.

13. Start here step 5 о языке вывода — не на своём месте
SKILL.md:27: пункт о working language семантически про output formatting, остальные 4 — про thinking/scoping. Перенести в ## Policies как «Output language policy» или вынести в Output contract.

14. Capability statement шаблон стоит продублировать в SKILL.md
Отличная конструкция «When <actor> does <trigger>, the system MUST <response>, creating/preserving <state/effect>, so that <continuity>» из methodology.md:23-26 — это центральный артефакт скила. Стоит явно показать его в SKILL.md (1-2 строки), чтобы агент использовал его без обязательного похода в reference.

15. Verification map не упоминает property-based / fuzzing
methodology.md:200-209: для function-level спек property-based testing — нативный инструмент. Можно добавить строку | Property-based test | Function invariants over input space |.

16. Anti-claim про generated docs
Anti-claim «This spec does not make generated documentation acceptance evidence for runtime behavior» в methodology.md:39 — гениальный пример, но он одинокий. Добавить ещё 1-2 anti-claim шаблона про «mocked tests as evidence», «schema presence as behavior».

17. Policy Output contract слишком плотный
SKILL.md:177-178 — это длинный список через запятую. Перевести в bullets, иначе агент его будет пропускать глазами при компрессии контекста.

## Что НЕ менять (сильные стороны)
- Чёткое разделение capability/substrate в fragments/overview.md и SKILL.md:53-60.
- Right-sizing matrix по scope в methodology.md:45-52 — лучшая часть скила.
- Atomic requirement шаблон с Good/Weak примером в methodology.md:78-95.
- Триада Positive/Negative/Falsifier в methodology.md:181-195 — даёт операционно проверяемый AC.
- Portability rules и checklist соблюдены, ссылки относительные, файлы внутри папки скила.

## Ревью spec-engineer как методики

### Где она расположена в ландшафте

18. Скил молча комбинирует несколько традиций: RFC 2119 (MUST/SHOULD — названо явно), фальсифицируемость по Попперу (через Falsifier), design-by-contract Мейера (preconditions/postconditions/invariants — упомянуты, но не атрибутированы), BDD/Gherkin (шаблон capability statement — это Gherkin с дополнительной clause continuity), risk-based testing (через right-sizing), и FMEA-подобный behaviour inventory. Это сильная ДНК, но методика её не называет — пользователь не может локализовать её в экосистеме и невольно изобретает велосипед в местах, где есть готовый аппарат.

### Методологические пробелы (по убыванию важности)

19. Нет «cost-of-being-wrong» как ортогональной оси к scope
Right-sizing привязан к размеру объекта (function → endpoint → workflow → system slice). Но реальный драйвер строгости — blast radius при ошибке. Пятистрочное правило идемпотентности платежей требует больше строгости, чем 500-строчная спека дашборда. Зрелые методики (safety integrity levels, risk-based testing) тиерят по критичности, а не по размеру. Без этой оси скил будет по-разному строг на одинаковом «scope».

Фикс: добавить в Frame intake шаг «criticality lens»: what's the worst observable consequence if this requirement is wrong? — и привязать обязательность Falsifier/инвариантов к ответу.

20. Behaviour inventory — это checklist, а не метод
methodology.md:57-72 перечисляет 11 классов поведений, но не учит, как их находить. Реальные методики используют конкретную технику: equivalence partitioning, boundary value analysis, state-transition coverage, STRIDE для security, FMEA для отказов. Сейчас инвентаризация держится на «вспомнил/не вспомнил».

Фикс: дать в references/ отдельный файл discovery-techniques.md с короткими рецептами каждой техники и условием применимости.

21. Нет каталога «self-deception patterns»
Методика блестяще ловит один паттерн самообмана (substrate ≠ capability). Но есть ещё семейство, которое она не называет:

- Тавтологичные AC: «system returns X when it should return X».
- Необнаруживаемая observability: «handles errors gracefully» без определения «graceful».
- Single-actor blindness: спека только под happy actor, без admin/attacker/operator.
- Implicit retroactive scope: AC, которые молча применяются к существующим данным.
- Mock-driven AC: «given the upstream returns success, system updates state», когда сама спека про этот upstream.
- Completion-bias scope: спека останавливается после happy path как будто edge cases — это уже другой документ.

Это самая высокая по leverage добавка: один reference references/anti-patterns.md закроет 80% реальных факапов спек.

22. Атомарность требования не операционализирована
Policy говорит «one obligation per requirement», но не даёт теста, является ли требование атомарным. Практический критерий: если можно сформулировать два независимо проверяемых AC — это два требования. Сейчас агент будет колебаться на «X MUST validate input AND log failure».

23. Инварианты как first-class приём недооценены
Они упомянуты как одна из representations среди прочих, но это самое мощное оружие против гейминга: инвариант проверяется везде, а не в одной точке. Методика должна их явно поднимать: «если часть спеки можно выразить инвариантом — делай это в первую очередь, а нарративные требования — во вторую». Это прямой trade с Гёделем-Мейером, и его надо назвать.

24. Время и temporal logic свёрнуты в одно слово «continuity»
Eventually consistent, within N seconds, retried but at-most-once, leads-to causally — это разные temporal-операторы. Сейчас методика их склеивает, и спека «eventually idempotent» проходит спокойно, хотя это разные обещания. Для распределённых систем нужен мини-словарь temporal-кванторов: always, eventually, until, leads-to, at-most-once, at-least-once, exactly-once.

25. Concurrency/ordering/idempotency/consistency — это 4 проблемы, а не 1 буллет
В methodology.md:67 они склеены. Каждая требует своих вопросов: где shared state? что считается linearization point? какие races допустимы? какова retry policy и стоимость retry? Сейчас агент скорее всего пропустит 3 из 4.

26. Нет техники для existing-system-being-changed
Workflow stages негласно предполагают greenfield-фрейминг. Реальный массовый кейс — «система делает X, поменяй на Y». Тут нужна methodology для:

- behavioural diff: текущее → целевое поведение,
- migration существующего состояния,
- backwards-compatibility scope,
- coexistence старого и нового во время роллаута.

Migration-pattern в spec-patterns.md это касается, но в workflow stages нет шага «extract delta». Без него спека на изменение всё время выглядит как спека «с нуля», и теряется ценная информация о том, что нельзя сломать.

27. Глоссарий должен быть первым шагом, а не одним из вариантов
Самый дешёвый источник неправильных реализаций — двусмысленные термины («user», «session», «active», «pending»). Сейчас глоссарий — equal option в methodology.md:107-117. Должно быть жёстче: перед тем как писать требования, выпиши термины, которые встречаются больше одного раза или несут роль.

28. Capability statement шаблон не имеет precondition
Шаблон «When/MUST/creating/so that» неявно предполагает, что trigger admissible. Реальные системы нуждаются в precondition (актор аутентифицирован, ресурс существует), trigger (действие), guard (доп. правила), response, postcondition. Five-part Gherkin (Given/And/When/Then/And) точнее. Сейчас pre/guard будут прятаться внутри trigger или AC.

29. Capability vs substrate — определение зависит от контекста, и это не сказано
API и схемы перечислены как substrate (SKILL.md:58). Но если спека — про публичный API, то API и есть capability. Один и тот же артефакт меняет роль в зависимости от того, кто потребитель спеки. Сейчас агент будет механически клеймить любые API как substrate. Надо явно сказать: «capability defined relative to the spec consumer».

30. Verification map не включает несколько важных методов
Отсутствуют: property-based testing, fault injection / chaos, differential testing, golden/approval testing, formal model checking, conformance suites, simulation. Для function-level спек property-based — нативный инструмент, и его отсутствие в таблице создаёт впечатление, что example-based test покрывает invariants, что неверно.

31. Нет дисциплины traceability на уровне требования
Source material выписывается один раз на интейке. Каждое требование должно трассироваться к источнику (issue, decision, user need, regulation). Без этого через два рефакторинга спеки невозможно понять, почему там R7. Это особенно важно, когда спеку пересоздаёт LLM.

32. Эволюция спеки отсутствует
Как меняется спека? Versioning, deprecation, «R5 supersedes R3 from v0.2», requirement в статусе REMOVED вместо удаления. Для агента, который регенерирует спеки, evolution discipline важнее, не меньше.

33. Конфликт example vs rule неразрешён формально
Сказано, что они должны совпадать. Но что выигрывает при расхождении — не объявлено. Должна быть строка: rules — normative, examples — illustrative; при расхождении правило побеждает, пример исправляется.

34. Скил говорит, что он «для AI coding agents», но не доводит до конца
Если первичный читатель — LLM, методика должна явно проектироваться против её типичных провалов:

- галлюцинированные API не из спеки,
- правдоподобный код, который компилится, но не соответствует AC,
- творческая интерпретация vague nouns («appropriately», «as needed», «if applicable»),
- completion-bias (агент остановился после happy path).

Каждый из этих failure modes требует контр-меры в методике (запрет vague slot-words, обязательное перечисление edge cases, требование runnable AC). Сейчас это размазано.

## Места, где методика может навредить при буквальном применении

35. ВАЖНО! «Smallest spec depth that can guide correct implementation» — без шкалы критичности это поощряет под-спецификацию security-чувствительных кусков
Маленький endpoint и маленькая authz-проверка имеют одинаковый «scope», но разную цену ошибки. Без criticality-lens (см. пробел №1) методика будет одинаково лёгкой к обоим.

36. ВАЖНО! Right-sizing-by-scope без criticality-фактора создаёт «спецификация-маленькая-→-проверка-маленькая»
Возможна ситуация, когда крошечная функция (signTransaction) имеет огромный blast radius, но методика разрешит ей «inputs/outputs/edges/examples/acceptance». Нужен явный override: «несмотря на маленький scope, при критичности X — обязательны invariants, formal verification map и multiple falsifiers».

37. ВАЖНО! Положение «do not specify implementation mechanisms» иногда слишком жёсткое
Иногда выбор алгоритма/структуры данных есть часть требования (например, «MUST use CRDT for offline merge», «MUST use UUIDv7 для лексикографической сортировки»). Сейчас гайдлайн «не специфицировать механизм, если не explicit constraint» формально верный, но в деле агент будет зачищать обоснованные ограничения. Стоит добавить пример «когда механизм — это требование».

38. ВАЖНО! Verification map поощряет «test» как дефолт
Из 7 методов, test стоит первым и самым понятным. Агент будет писать тесты как универсальный verification path, даже там, где правильнее inspection (presence) или analysis (capacity). Стоит добавить anti-pattern: «не используйте test там, где наблюдение статично».
