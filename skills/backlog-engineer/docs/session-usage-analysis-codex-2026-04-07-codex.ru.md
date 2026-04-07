# Отчёт по реальному использованию навыка `backlog-engineer` в сессии Codex от 2026-04-07

## Контекст и цель отчёта

Этот отчёт фиксирует не абстрактный обзор навыка, а именно те проблемы, которые реально проявились у меня при выполнении задачи:

- создать новый backlog в `backlog-new`;
- построить его на основании `docs/architecture/system.md`;
- сделать это через фактический workflow навыка `backlog-engineer` и его CLI.

Я сознательно включаю как прямые дефекты, так и косвенные проблемы:

- противоречия между `SKILL.md`, reference-доками и реальным CLI;
- UX-проблемы, которые повышают вероятность ошибки агента;
- недостающие спецификации, из-за которых пришлось читать исходники;
- проблемы самой модели backlog, проявившиеся на реальном архитектурном документе;
- случаи, где проблема была не в CLI-коде, а в том, как навык заставляет агента работать.

Отдельно в конце я фиксирую то, что сначала выглядело как дефект, но после проверки не подтвердилось. Это важно, чтобы не тратить время на ложные цели.

---

## Как именно навык использовался в этой сессии

Ниже полный фактический путь использования.

1. Я загрузил:
   - `SKILL.md`;
   - `references/command-reference.md`;
   - `references/data-model.md`;
   - `references/document-to-packet-workflow.md`;
   - `references/examples-and-templates.md`.

2. Я проверил репозиторий пользователя:
   - `docs/architecture/system.md`;
   - `README.md`;
   - `docs/ssot/index.md`;
   - релевантные ADR.

3. Я пытался найти сам CLI сначала в репозитории пользователя, потому что из `SKILL.md` следовало, что built artifact называется `scripts/backlog-engineer.mjs`.

4. После того как в репозитории пользователя утилита не нашлась, я отдельно искал её в директории навыка и обнаружил реальный путь:
   - `/home/kostysh/.codex/skills/custom/skills/backlog-engineer/scripts/backlog-engineer.mjs`

5. Я посмотрел `--help` у CLI и help по отдельным командам:
   - `init`
   - `register-source`
   - `template`
   - `packet`
   - `status`

6. Я инициализировал backlog-root через `init`.

7. Я прочитал сгенерированный `backlog-new/AGENTS.md`.

8. Я зарегистрировал источники через `register-source`.

9. Я создал packet-шаблон через `template packet`.

10. На этапе авторинга packet мне пришлось читать уже не только docs навыка, но и исходники CLI, потому что docs не давали достаточно точной схемы.

11. Я выполнил:
   - `packet --dry-run`
   - `packet`
   - `status`
   - `gaps`
   - `queue`
   - `attention`

Итог реального прогона:

- backlog был создан;
- packet применился корректно;
- статус показал `20` items;
- `14` items стали `implemented`;
- `6` items стали `defined` с `gaps`;
- `queue` вернул пустой список.

Именно на этом фактическом сценарии основаны выводы ниже.

---

## Главные выводы

Самая важная общая оценка:

`backlog-engineer` уже пригоден для end-to-end использования, но в текущем виде он ещё слишком сильно опирается на "внутреннее понимание автора навыка" и недостаточно хорошо замыкает реальный workflow для нового агента.

В этой сессии мне пришлось:

- искать CLI вручную;
- читать исходники для понимания схем;
- обходить противоречия в инструкциях;
- вручную решать неоднозначности вокруг cwd/backlog root/path resolution;
- получать в конце backlog без actionable queue, потому что честно выставленные `gaps` не превращаются в следующие задачи.

То есть навык уже не сломан, но ещё не даёт той степени "операторски удобного" и "агентски безопасного" workflow, которую сам заявляет.

---

## Подтверждённые проблемы

### 1. В `SKILL.md` неоднозначно указан путь к built artifact CLI

### Что произошло в сессии

Я сначала искал `scripts/backlog-engineer.mjs` в репозитории пользователя, потому что именно так навык описывает built artifact. В репозитории пользователя его не оказалось. Только после дополнительного поиска я нашёл реальный CLI в директории самого навыка.

### Доказательство

- `SKILL.md` говорит:
  - package: `@kostysh/backlog-engineer-cli`
  - source entrypoint: `src/cli.ts`
  - built artifact: `scripts/backlog-engineer.mjs`
  - см. [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L104)

### Почему это проблема

Из текста неясно, относительно чего указан путь `scripts/backlog-engineer.mjs`:

- относительно skill root;
- относительно текущего пользовательского репозитория;
- относительно package root.

Для агента это важно, потому что поиск CLI является блокирующим шагом перед любым реальным использованием.

### Влияние

- лишний поиск;
- риск ошибочно решить, что CLI вообще не установлен;
- риск перейти на ручное создание артефактов, хотя CLI существует.

### Рекомендация

В `SKILL.md` нужно указывать путь явно:

- либо абсолютным паттерном "within this skill directory";
- либо фразой вида:
  `built artifact inside the skill root: scripts/backlog-engineer.mjs`

Ещё лучше сразу дать готовую форму вызова:

```text
node <skill-root>/scripts/backlog-engineer.mjs
```

> codex: Согласен. Это чистый docs defect. В `SKILL.md` нужно явно написать, что built artifact находится внутри skill root, а не внутри пользовательского репозитория, и дать канонический pattern вызова.

---

### 2. Инструкция "сперва задай короткий preflight-вопрос" конфликтует с нормальным автономным режимом агента

### Что произошло в сессии

Навык требует перед первым backlog спросить у оператора:

- design-only;
- partially implemented;
- unsure.

Но пользователь не просил планирование и не давал сигнала, что хочет отдельный диалог перед действием. По текущим общим правилам среды я должен по возможности не останавливать выполнение и сделать разумное предположение. В результате я не следовал этой части навыка буквально, а сам вывел состояние системы из кода, тестов и `docs/ssot/index.md`.

### Доказательство

- preflight question в `SKILL.md`: [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L52)
- при этом тот же навык дальше требует приоритизировать code/tests как лучший сигнал для `delivery_state`: [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L158)

### Почему это проблема

Это не просто stylistic issue, а реальный конфликт поведения:

- одна часть навыка заставляет спросить;
- общая среда и хороший UX требуют не тормозить пользователя без необходимости;
- в реальном usage это приводит к тому, что агент либо нарушает навык, либо делает лишний диалог.

### Влияние

- навык ведёт к ненужной интерактивности;
- повышается latency на простом сценарии "создай backlog";
- разные агенты будут вести себя по-разному и непредсказуемо.

### Рекомендация

Заменить правило с обязательного вопроса на двухрежимное:

- если есть явные сильные сигналы в code/tests/index, агент сам определяет `delivery_state` posture;
- вопрос задаётся только если evidence действительно неоднозначен и это materially changes output.

Иначе говоря: не "всегда спросить", а "спросить только при реальной неопределённости".

> codex: Согласен по сути, но я бы сформулировал ещё жёстче: первый шаг должен быть не "determine system state", а "analyze operator input and detect missing prerequisites". Пока оператор не дал сигнал идти в код, агент не должен по умолчанию исследовать repo ради `delivery_state`.

>>> Агент указал на "реальный конфликт поведения" и я с ним согласен. Его предложение про "если есть явные сильные сигналы в code/tests/index" и "вопрос" верное - но когда ты будешь исправлять - вариант с вопросом нужно определить максимально четко, - "задать вопрос, остановиться и ждать ответа оператора".

> codex: Принимаю. Формулировка должна стать жёсткой и пошаговой: сначала агент анализирует запрос оператора; если состояние системы и источник оценки `delivery_state` не указаны явно, агент задаёт один короткий вопрос, затем останавливается и ждёт ответа. В код, тесты и repo для выяснения статуса он идёт только после такого ответа или если оператор сам прямо направил туда.

---

### 3. Для корректного использования навыка пришлось читать исходники CLI, потому что docs не задают достаточно точную схему packet

### Что произошло в сессии

После генерации packet-template мне всё равно пришлось лезть в исходники CLI, чтобы понять:

- каков точный shape `target_system` и `as_built`;
- какие поля реально валидируются как enum;
- какие поля только "рекомендуются" в docs, но не enforced в коде.

То есть reference-доки оказались недостаточны для уверенного авторинга первого реального packet.

### Доказательство

Docs говорят, что:

- `target_system` и `as_built` это "short, structured summary" без точной схемы:
  [data-model.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/data-model.md#L121)

Но реальный код показывает точную форму:

- `StructuredSummaryEntrySchema = record(NonEmptyString, primitive | primitive[])`
  [scalars.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/schemas/scalars.ts#L198)

### Почему это проблема

Фраза "structured summary" не даёт агенту enough information:

- можно ли вкладывать объекты;
- можно ли использовать массивы объектов;
- какие типы значений допустимы;
- что будет rejected.

В реальном сценарии это заставило меня читать source code. Для навыка, который позиционируется как usable by other agents, это слишком высокий cognitive tax.

### Влияние

- первый реальный packet authoring становится зависимым от чтения исходников;
- повышается риск либо overly conservative packet authoring, либо schema errors;
- часть агентов просто не сделает этот шаг и будет писать "примерно подходящий JSON".

### Рекомендация

В `references/data-model.md` нужно явно описать shape `target_system` и `as_built`, например:

```json
{
  "area": "string",
  "summary": "string",
  "services": ["string"],
  "status": "string"
}
```

И отдельно явно написать ограничение:

- только primitive values;
- либо массив primitive values;
- вложенные объекты запрещены.

> codex: Согласен. Это не runtime problem, а недостаток reference contract. Агент не должен читать `src/` ради первого packet. В references нужен точный shape и список допустимых value kinds.

>>> Мне казалось, что мы решили эту проблему и что у нас есть точный shape и, даже, примеры. Если это недоработано - нужно доработать.

> codex: Да, значит проблема решена не до конца. Сейчас есть intention, отдельные примеры и shape в коде, но agent-facing reference всё ещё недостаточно строгий. Исправление вижу так: в `references/data-model.md` дать exact contract для `target_system` и `as_built`, перечислить допустимые value kinds и рядом оставить 1-2 канонических примера.

---

### 4. Docs создают впечатление контролируемых классификаций, но большая часть taxonomy вообще не enforced в CLI

### Что произошло в сессии

Пока я собирал packet, мне пришлось проверить, являются ли:

- `type`
- `claim_class`
- `commitment`
- `data_class`
- `quality_class`
- `policy_surface`
- `decision_state`

реальными enum или просто рекомендациями.

Оказалось:

- `source kind` и `source authority` действительно валидируются;
- `delivery_state` тоже реально enum;
- но почти весь остальной semantic taxonomy в packet схеме это просто `NonEmptyString`.

### Доказательство

Docs формулируют "starter values" так, что это легко воспринимается как semi-normative vocabulary:

- source kinds: [data-model.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/data-model.md#L53)
- `claim_class`: [data-model.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/data-model.md#L152)
- `quality_class`: [data-model.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/data-model.md#L210)
- `decision_state`: [data-model.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/data-model.md#L235)

Но код показывает:

- `ControlledStringSchema = NonEmptyStringSchema`
  [scalars.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/schemas/scalars.ts#L198)

А packet schema использует именно `ControlledStringSchema` для этих полей.

### Почему это проблема

Это создаёт ложное чувство safety:

- агент думает, что utility защитит от typo/drift;
- на практике utility принимает почти любой непустой string;
- consistency между пакетами обеспечивается только дисциплиной агента.

### Влияние

- высокий риск taxonomy drift;
- разные backlog-root могут использовать несовместимые категории;
- автоанализ и future aggregation будут хуже, чем ожидается из docs.

### Рекомендация

Нужно выбрать один из двух путей:

1. Либо честно документировать, что это free-form strings, и убрать ощущение "quasi-enum".
2. Либо реально ввести enum/registry для ключевых классификаций.

На мой взгляд, минимум нужно зафиксировать хотя бы:

- `item.type`
- `claim_class`
- `quality_class`
- `policy_surface`

Иначе полезность derived state и cross-backlog consistency останется хрупкой.

> codex: Частично согласен. Проблема реальная, но я бы не начинал с тотального ужесточения schema. Первый шаг лучше сделать честным: явно разделить "strict enum" и "starter vocabulary". Уже потом решать, какие поля действительно worth enforcing в CLI.

>>> "enum/registry" не вводим. Честно документируем.

> codex: Принято. Тогда решение однозначное: убрать quasi-enum tone из docs, везде явно писать `starter vocabulary, not enforced by CLI`, и отдельно отметить, какие поля действительно strict enum, а какие только recommended free-form strings.

---

### 5. `register-source` help не выводит допустимые значения, хотя команда реально их строго валидирует

### Что произошло в сессии

Перед вызовом `register-source` мне пришлось отдельно читать docs и потом исходники, чтобы понять, какие `kind` и `authority` допустимы.

Help команды говорит только:

- "Source kind defined by the skill contract"
- "Source authority defined by the skill contract"

Но не показывает сам список.

### Доказательство

- help/definition команды:
  [register-source.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/register-source.ts#L18)
- реальные allowed values:
  [source-registry-service.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/sources/source-registry-service.ts#L13)

### Почему это проблема

Это плохой CLI discoverability:

- значения ограничены;
- команда их знает;
- но пользователь/агент не получает их в `help`.

### Влияние

- лишняя зависимость от внешней docs;
- лишний риск ошибки при первом использовании;
- повышенная стоимость автоматизации.

### Рекомендация

`help register-source` должен печатать допустимые значения прямо в usage/help output.

Минимум:

```text
Allowed kinds: architecture, module, adr, technical-decision, integration, operations, planning, specification
Allowed authorities: authoritative, supporting, derived
```

> codex: Согласен. Это низкая по сложности и высокая по полезности правка: help должен печатать allowed values напрямую, раз команда их уже знает и валидирует.

>>> обязательно делаем, для каждой команды. В скиле тоже должно быть.

> codex: Согласен. Тогда это не точечная правка `register-source`, а системное правило: `help` каждой команды должен показывать всё, что реально строго валидируется, а `SKILL.md` должен объяснять, чего ожидать в output и как это интерпретировать.

---

### 6. Модель разрешения путей и backlog root слишком неочевидна и местами неоднородна

### Что произошло в сессии

Чтобы успешно выполнить workflow, мне пришлось постоянно учитывать три разных вещи:

- где находится current working directory;
- найден ли backlog root через `.backlog.json`;
- относительно чего резолвится конкретный `--path` или `--out`.

Практически:

- `status` не принимает `--path`, но требует backlog root в cwd/parent cwd;
- `register-source` тоже требует backlog root, но `--path` резолвится как CLI path и потом нормализуется относительно backlog root;
- `template packet --out` пишет файл относительно cwd;
- `packet --path` принимает authored packet path, опять же относительно текущего CLI resolution.

### Доказательство

- root discovery идёт по cwd вверх:
  [root-discovery.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/runtime/root-discovery.ts#L9)
- `status` падает, если backlog root не найден:
  [status.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/status.ts#L38)
- `template` пишет output относительно `cwd`:
  [template.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/template.ts#L98)
- `register-source` резолвит input path через CLI path, а потом приводит к path relative to backlog root:
  [register-source.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/register-source.ts#L86)

### Почему это проблема

Эта модель не сломана технически, но она слишком cognitively expensive:

- часть команд работает "по месту";
- часть опирается на автообнаружение root;
- часть возвращает absolute paths;
- часть возвращает backlog-relative paths.

В результате агенту приходится не просто вызывать команды, а постоянно держать в голове тонкую path model.

### Влияние

- высокий риск запускать команды из неправильного cwd;
- неочевидные ошибки `BE_ROOT_NOT_FOUND`;
- более сложные shell snippets и автоматизация.

### Рекомендация

Нужно унифицировать модель.

Наиболее практичный вариант:

- добавить единый `--backlog-root <path>` для всех команд, которым нужен root;
- оставить cwd-discovery только как fallback;
- в help явно писать, какие аргументы резолвятся относительно cwd, а какие относительно backlog root.

> codex: Согласен. Важно отделить уже исправленную проблему внешних source paths от более широкой проблемы mental model. Даже после фикса source paths у CLI остаётся дорогая для агента смесь cwd-based и root-based resolution.

>>> Мне кажется, что "добавить единый `--backlog-root <path>`" - плохая идея, мы вначале именно так и планировали и потом отказались от этого. Нужно решить проблему иначе

> codex: Принимаю. Тогда решение без нового флага такое: сохранить cwd-based root discovery, но сделать её очевидной. Для этого нужны три вещи: явный раздел в `SKILL.md` про path/root model, честные help-тексты у root-scoped команд, и более понятные output/error messages с указанием найденного или не найденного backlog root.

---

### 7. Возвращаемые пути в output-командах непоследовательны: где-то absolute, где-то relative

### Что произошло в сессии

После `packet` я получил:

- `authored_packet_path` как абсолютный путь;
- `canonical_packet_path` как backlog-relative path.

Это не блокирует работу, но создаёт неоднозначную mental model и усложняет последующую автоматизацию.

### Доказательство

Схема output это прямо закрепляет:

- `authored_packet_path: NormalizedFsPathSchema`
- `canonical_packet_path: BacklogRelativePosixPathSchema`
- см. [commands.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/schemas/commands.ts#L161)

### Почему это проблема

Для человека это ещё терпимо. Для автоматического агента и для shell choreography это неудачно:

- один путь можно сразу открыть;
- второй нужно сначала склеить с backlog root.

### Влияние

- лишняя логика на клиенте;
- лишний шанс ошибиться при follow-up операциях;
- непоследовательность выходного контракта.

### Рекомендация

Нужно выбрать одну модель и держать её везде:

- либо всегда absolute;
- либо всегда relative + отдельно explicit backlog root in every response.

Я бы рекомендовал always absolute в machine-facing output.

> codex: Согласен с проблемой. Я бы тоже склонялся к `always absolute` для machine-facing output, либо к строго последовательной модели `relative + explicit backlog_root` во всех ответах. Смешанная модель сейчас действительно лишняя нагрузка.
>
>>> Поддерживаю "`always absolute`"

> codex: Принято. Тогда решение простое: machine-facing output должен возвращать filesystem paths в absolute form везде, где путь нужен агенту для следующего действия. Relative paths можно оставлять только внутри utility-owned storage, но не в внешнем command response.

---

### 8. Сгенерированный backlog-root `AGENTS.md` противоречит штатному workflow packet/patch

### Что произошло в сессии

После `init` я прочитал сгенерированный `backlog-new/AGENTS.md` и обнаружил правило:

- "Do not edit `.backlog.json`, `.backlog/`, `packets/`, `patches/`, or `reports/` manually..."

Но нормальный workflow навыка требует:

- сгенерировать packet template;
- затем вручную заполнить authored packet file;
- затем применить его через `packet`.

То есть сгенерированный `AGENTS.md` запрещает именно то действие, которое сам навык требует как штатный путь.

### Доказательство

- запрет в template:
  [render-agents-template.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/templates/render-agents-template.ts#L1)
- при этом сам `SKILL.md` прямо говорит "Agent authors packet and patch files":
  [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L117)
- и workflow требует:
  - `template packet`
  - then fill in keys, source IDs, dependencies, gaps
  - см. [document-to-packet-workflow.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/document-to-packet-workflow.md#L131)

### Почему это проблема

Это жёсткое внутреннее противоречие.

Для агента оно выглядит так:

- инструмент просит author packet;
- generated local rules запрещают author packet.

### Влияние

- снижает доверие к generated backlog root contract;
- может привести к излишне осторожному агенту, который вообще не станет писать packet;
- создаёт путаницу между "не редактируй canonical import copies" и "не редактируй authored drafts".

### Рекомендация

Разделить два понятия:

- authored draft files inside `packets/` and `patches/` are editable before apply;
- canonical immutable import copies are not editable after registration.

То есть в `AGENTS.md` нужно переписать правило примерно так:

- do not edit `.backlog/` and canonical import copies manually;
- you may author draft packet/patch files before apply;
- after apply, treat canonical copies as immutable.

> codex: Сильная находка. Это реальное противоречие между generated local rules и штатным workflow skill-а. Здесь нужно не косметическое уточнение, а явное разведение authored drafts и canonical copies.

>>> Обязательно исправить! AGENTS.md в данном случае должен быть сильным помощником скила, а не вносить неопределенность.

> codex: Полностью согласен. Здесь нужно переписать template не общими словами, а rule-by-rule: authored drafts в `packets/` и `patches/` до apply редактировать можно; `.backlog/*`, `.backlog.json`, `reports/` и canonical import copies руками редактировать нельзя.

---

### 9. Отсутствует batch registration источников, а навык одновременно запрещает параллелизм мутаций

### Что произошло в сессии

Для первого backlog мне понадобилось зарегистрировать 8 источников. Команды пришлось запускать строго последовательно. Первая попытка оформить это как loop в shell закончилась ошибкой quoting, после чего я переписал вызов в более простой форме.

Важно: ошибка была не в CLI, а в том, что workflow с большим количеством sequential `register-source` быстро приводит к shell-choreography, а это уже зона повышенного риска.

### Доказательство

- навык требует последовательные mutation commands:
  [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L33)
- `document-to-packet` повторяет, что `register-source` нельзя гонять параллельно:
  [document-to-packet-workflow.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/document-to-packet-workflow.md#L36)
- при этом отдельной команды вида `register-sources --manifest ...` нет.

### Почему это проблема

На маленьком сценарии это просто неудобно. На реальном архитектурном наборе из десятков docs это уже ощутимая UX-проблема.

### Влияние

- агент вынужден писать shell loops;
- возрастают шансы quoting/path mistakes;
- возрастает latency на первой инициализации backlog.

### Рекомендация

Добавить один из вариантов:

1. `register-sources --manifest sources.json`
2. `register-source --path ...` с повторяемым флагом
3. `register-source-batch` на список путей

При этом мутационный lock можно сохранить, просто выполнять batch atomically внутри одной команды.

> codex: Согласен, но считаю это не первым приоритетом. Сначала надо сделать невозможной ошибку параллельных мутаций на уровне skill/help/output. Batch registration полезен, но уже как UX-ускоритель после этого.

>>> Да, на данном этапе нужно явно указать в скиле на невозможность параллельного запуска регистраций.

> codex: Согласен. На текущем этапе этого достаточно и это приоритетнее batch API. Формулировка должна быть предельно жёсткой: never run `register-source` in parallel for the same backlog root; if multiple sources are needed, register them strictly one by one.

---

### 10. `template packet` полезен слишком слабо: он даёт только пустой JSON-скелет и почти не снижает когнитивную нагрузку

### Что произошло в сессии

Я корректно использовал `template packet`, но практическая польза оказалась минимальной:

- создан пустой JSON;
- дальше всю полезную структуру всё равно пришлось авторить вручную;
- для нетривиального backlog из архитектуры это не дало реального ускорения.

### Доказательство

- reference обещает skeleton with `context` and `items`:
  [command-reference.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/references/command-reference.md#L80)
- реализация packet template действительно рендерит только пустой базовый template:
  [template.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/template.ts#L101)

### Почему это проблема

Для заявленного use case "turn architecture docs into backlog graph" такой template almost no-op:

- он не помогает с naming;
- не помогает с section ordering beyond empty keys;
- не помогает с source placeholders;
- не помогает с consistent starter context.

### Влияние

- большая часть work остаётся полностью manual;
- template есть формально, но почти не уменьшает вероятность ошибки.

### Рекомендация

У packet template должно быть хотя бы одно из двух улучшений:

1. richer starter content:
   - placeholders for source ids;
   - commented field expectations;
   - suggested starter taxonomy;

2. higher-level scaffold command:
   - например `template packet --from-source ../docs/architecture/system.md`
   - хотя бы prefill `key_strategy`, `target_system`, `as_built` blocks и source placeholders.

> codex: Согласен с проблемой, но решать её лучше без source-derived magic. Я бы начал с richer starter template: обязательные placeholders, подсказки по source ids, starter blocks для `target_system` / `as_built`, и явные field expectations.

---

### 11. Модель `gap` честно предотвращает invention, но легко приводит к backlog без следующего шага

### Что произошло в сессии

Я честно следовал правилу навыка:

- если missing fact materially blocks confident task statement, нужно ставить `gap`.

В результате 6 задач получили `gaps`, и после применения packet:

- `status` показал `ready_for_next_step_count = 0`;
- `queue` вернул `[]`.

То есть backlog получился честным, но практически не дающим дальнейшего движения внутри самой модели.

### Доказательство

- `SKILL.md` требует превращать missing facts в `gaps`:
  [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L211)
- derived state делает item ready только если:
  - `delivery_state !== implemented`
  - `gaps.length === 0`
  - no todo
  - dependencies ready
  - см. [replay-pipeline.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/core/replay-pipeline.ts#L719)
- queue берёт только ready non-implemented items without gaps:
  [queue-service.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/core/queue-service.ts#L1)

### Почему это проблема

На реальной архитектуре это проявилось сразу:

- gaps есть;
- backlog честно говорит "blocked";
- но у utility нет first-class механизма превратить эти gaps в action items.

Получается dead-end:

- backlog знает, что чего-то не хватает;
- но не знает, какой следующий элемент работы должен закрыть нехватку.

### Влияние

- новая backlog graph может быть корректной, но operationally inert;
- `queue` оказывается пустой;
- агенту приходится вручную придумывать follow-up work outside the model.

### Рекомендация

Нужно добавить один из механизмов:

1. первый класс задач типа:
   - `investigation`
   - `decision`
   - `contract-definition`

2. либо derived `todo` из `gaps`, который указывает следующий action;

3. либо explicit workflow:
   - "when gap blocks queue, create a clarification packet with decision/investigation items".

> codex: Согласен. Здесь проблема не в том, что `gap` плох, а в том, что skill недостаточно объясняет, когда честно остановиться на `gap`, а когда сразу породить clarification / investigation items. Иначе backlog легко становится truthful, но operationally inert.

>>> Мы же решали эту проблему! Удели проблеме больше внимания, она не должна всплывать снова и снова. Для выработки правильной инструкции проведи внутреннюю конкурентную оценку вариантов, чтобы остановиться на наиболее директивном и однозначно понятном для агента варианте.

> codex: Провёл внутренний выбор вариантов. Самый директивный и наименее конфликтный с текущей моделью вариант такой: `gap` остаётся как marker блокировки на существующей задаче, но если отсутствующий факт можно закрыть отдельной работой, агент обязан сразу создать отдельную clarification/investigation/decision task и сделать заблокированную задачу зависимой от неё. Не вводить derived todos из gaps и не усложнять утилиту. Правило для skill-а должно звучать жёстко: "Do not leave a brand-new backlog with only blocked gap items when the blocking uncertainty itself can be expressed as concrete work."

Сейчас навык хорошо моделирует блокировку, но плохо моделирует работу по снятию блокировки.

---

### 12. Навык не даёт ясного правила: новый backlog из архитектуры должен включать уже реализованные элементы или только будущую работу

### Что произошло в сессии

Поскольку пользователь попросил "создать новый backlog на основании архитектуры", а система уже частично реализована, мне пришлось самостоятельно решить:

- включать ли `implemented` seams в новый backlog;
- или пытаться строить backlog только на оставшейся работе.

Я выбрал смешанный вариант:

- отражать и уже реализованные seams;
- и ещё не доставленные seams.

Но это было моё решение, а не чёткий output skill.

### Доказательство

Навык говорит:

- reconcile as-built and planning state in the packet;
- do not expect the utility to reconcile for you;
- см. [SKILL.md](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/SKILL.md#L192)

Но он не формулирует конечное правило для brand-new backlog:

- должен ли это быть "full architecture coverage graph";
- или "forward-looking actionable backlog only".

### Почему это проблема

На практике это сильно меняет результат:

- full coverage graph приводит к большому числу `implemented` items;
- future-only backlog даёт более короткий actionable list, но теряет architecture coverage.

### Влияние

- разные агенты будут строить принципиально разные backlog roots из одного и того же input;
- невозможно стабильно сравнивать output разных запусков.

### Рекомендация

В `SKILL.md` нужно явно зафиксировать одну из стратегий:

1. `coverage-first backlog`
   - includes implemented + pending seams;

2. `forward-only backlog`
   - includes only work not yet delivered;

3. dual-mode:
   - explicit flag or operator intent:
     - `coverage`
     - `actionable`.

Сейчас это важное место оставлено на усмотрение агента.

> codex: Согласен. Если выбирать default, я бы склонялся к `coverage-first backlog`: включать уже реализованные и ещё не реализованные seams, а actionable work получать через `queue` и `attention`. Но это должно быть закреплено в skill явно, а не оставлено на taste агента.

>>> Не думаю, что мы должны идти по пути усложнения утилиты, это потянет за собой новые проблемы. Нужно оптимизировать то, что у нас уже есть! Для меня очевидно, что если система уже частично реализована, то беклог в обязательно порядке должен включать реализованные задачи. Если этого не сделать - то беклог не будет полноценным и по нему нельзя будет судить об общем статусе реализованности системы. Сформулируй свое решение!

> codex: Формулирую жёсткое решение: default strategy для brand-new backlog — `coverage-first backlog`. Если система уже частично реализована, агент обязан включать в backlog и уже реализованные, и ещё не реализованные архитектурно значимые задачи. `Implemented` items нужны не как будущая работа, а как часть полной карты покрытия архитектуры. Исключать можно только incidental code, который не образует meaningful backlog item.

---

### 13. Help и command surface недостаточно хорошо объясняют, что query-команды зависят от auto-discovered backlog root

### Что произошло в сессии

Команды вроде `status`, `queue`, `attention`, `gaps` в usage не показывают никакой связи с backlog root, хотя без найденного root они просто падают с `BE_ROOT_NOT_FOUND`.

### Доказательство

- `status` usage:
  [status.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/status.ts#L19)
- при этом execute requires `context.backlogRoot`:
  [status.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/commands/status.ts#L38)

### Почему это проблема

Help создаёт ложное ощущение, что это "глобальные" команды, тогда как на деле они "cwd-sensitive backlog commands".

### Влияние

- неочевидные ошибки;
- лишняя необходимость помнить, из какой директории запущен CLI;
- ухудшение scripting experience.

### Рекомендация

Даже если cwd-discovery остаётся, help должен это говорить явно:

```text
This command requires execution from a backlog root or a child of it.
```

Ещё лучше:

- добавить `--backlog-root`;
- показывать в help оба режима.

> codex: Согласен. Даже если `--backlog-root` не вводить сразу, help должен честно говорить, что query-команды backlog-scoped и требуют root discovery через cwd/parents.

>>> Нет, "`--backlog-root`" не делаем. Помогаем агенту подсказками в скиле и выводе утилиты.

> codex: Принято. Тогда проблема должна решаться только через skill/help/output: root-scoped команды прямо говорят про cwd/parent discovery, ошибки показывают ожидаемую модель, а skill отдельно учит агента держать один стабильный working directory внутри backlog root.

---

### 14. Навык заявляет operator-friendly workflow, но в критических местах фактически требует source-level spelunking

### Что произошло в сессии

В этой сессии мне пришлось читать:

- docs навыка;
- исходники CLI;
- output schemas;
- generated AGENTS template;
- derived-state logic.

То есть навык оказался usable, но не self-descriptive.

### Доказательство

Наиболее болезненные места, которые пришлось проверять по коду:

- true schema for `target_system` / `as_built`;
- controlled vs uncontrolled string taxonomies;
- real root-discovery behavior;
- contradiction in generated `AGENTS.md`;
- readiness semantics leading to empty `queue`.

### Почему это проблема

Для "свежего" навыка это особенно опасно:

- новые агенты будут либо действовать слишком уверенно и ошибаться;
- либо перестрахуются и будут чаще спрашивать пользователя;
- либо будут избегать skill-level CLI altogether.

### Влияние

- высокий onboarding cost;
- непредсказуемость качества между агентами;
- навык кажется более зрелым, чем есть на самом деле.

### Рекомендация

Нужен жёсткий принцип:

- agent-facing docs должны быть достаточны для первого production-like scenario без чтения `src/`.

Если это пока не достигнуто, надо честно написать в `SKILL.md`, что для некоторых сценариев source inspection может быть required.

> codex: Согласен с диагнозом. Целевое состояние должно быть таким: первый production-like scenario агент проходит по `SKILL.md` и references без чтения `src/`. Если это не так, проблема в skill/docs, а не в "недостаточной опытности" агента.

>>> Что делать? Сформулируй свое предложение, но сначала хорошо подумай!

> codex: Моё предложение такое. Цель должна быть не "агент иногда может залезть в `src/`", а "первый production-like scenario агент проходит без чтения `src/`". Для этого нужен не один фикс, а связка: 1) `SKILL.md` задаёт жёсткий first-run workflow и preflight decisions; 2) references становятся действительно нормативными по shapes, path model, output interpretation и backlog strategy; 3) generated `AGENTS.md` перестаёт противоречить skill-у; 4) help команд показывает strict values и backlog-root expectations. После этого source inspection перестаёт быть нормальной частью workflow и остаётся только для разработки самой утилиты.

---

## Проблемы средней важности

### 15. `next_commands` в ответах почти не помогли в реальном сценарии

В реальном прогоне:

- `packet --dry-run` вернул `next_commands: []`;
- `packet` тоже вернул `next_commands: []`.

Формально это корректно, но практически этот механизм пока не несёт заметной UX-пользы.

Если уж поле есть, оно могло бы хотя бы предлагать:

- `status`
- `gaps`
- `attention`
- `queue`

в зависимости от состояния результата.

Это не критический дефект, но упущенная UX-возможность.

---

### 16. Session-level friction показал, что architecture-to-backlog flow пока слишком "ручной"

Этот пункт не про одну багу, а про суммарный effect:

- определить posture системы;
- зарегистрировать источники по одному;
- разобраться в path model;
- проверять schema details по коду;
- вручную author large packet;
- потом получить backlog без queue.

Для первого реального архитектурного сценария это всё ещё слишком много ручной когнитивной работы.

Если цель навыка именно "turn architecture into maintainable backlog graph", то здесь ещё нужен слой productization поверх существующего низкоуровневого CLI.

---

## Что я сначала заподозрил как дефект, но после проверки снял

### 1. `init` якобы не создаёт `packets/`, `patches/`, `reports/`

Сначала мне показалось, что `init` не создал эти директории, потому что я посмотрел только список файлов, а не каталогов.

После проверки:

- исходники явно создают `packets`, `patches`, `reports`;
- см. [backlog-layout.ts](/home/kostysh/.codex/skills/custom/skills/backlog-engineer/src/artifacts/backlog-layout.ts#L54)
- и на диске эти директории действительно есть.

Это не дефект навыка/утилиты, а моя ранняя ложная тревога из-за неполной инспекции.

Я специально включаю этот пункт, чтобы не отправлять вас чинить несуществующую проблему.

---

## Приоритет исправлений

### P0

- Исправить противоречие в generated `AGENTS.md` относительно ручного редактирования `packets/` и `patches/`.
- Уточнить в `SKILL.md`, где реально находится built artifact CLI.
- Убрать обязательность preflight-вопроса как default behavior и заменить её на evidence-first inference.
- Явно документировать path/root resolution model или добавить `--backlog-root` на весь command surface.

### P1

- Сделать packet authoring docs self-sufficient без чтения `src/`.
- Либо честно задокументировать free-form taxonomy, либо реально зафиксировать enum для ключевых классификаций.
- Вывести допустимые `kind` / `authority` прямо в `help register-source`.
- Ослабить ручной choreography вокруг массового `register-source`.

### P2

- Улучшить `template packet`, чтобы он реально снижал когнитивную нагрузку.
- Сделать `next_commands` полезными.
- Ввести более явную стратегию для "coverage backlog vs future-only backlog".

### P3

- Добавить first-class механизм обработки `gaps` как следующей работы, а не только как текстовой блокировки.

На практике именно последний пункт может сильнее всего повысить реальную usefulness backlog после честного architecture import.

---

## Самая важная архитектурная проблема модели backlog, выявленная этой сессией

Если убрать все частные UX и docs issues, то главный содержательный вывод такой:

Текущая модель хорошо умеет:

- честно не выдумывать недостающие факты;
- фиксировать gaps;
- строить traceable graph;
- различать implemented vs not implemented.

Но она пока хуже умеет следующий шаг после честности.

Именно это проявилось сильнее всего:

- backlog корректный;
- gaps честные;
- attention есть;
- queue пустой.

То есть система умеет хорошо сказать "здесь ещё нельзя уверенно продолжать", но плохо умеет превратить это в "вот какая работа должна быть сделана теперь".

Для навыка, который должен вести агента от архитектуры к рабочему backlog, это сейчас ключевая точка роста.

---

## Итог

Навык `backlog-engineer` уже достаточно зрелый, чтобы пройти полный реальный сценарий "architecture -> backlog root -> packet -> apply -> status". Это важный позитивный факт.

Но по результатам этой сессии его зрелость пока ограничивают не столько raw CLI-bugs, сколько:

- внутренние противоречия в агентских инструкциях;
- неполная agent-facing спецификация;
- неоднородная модель путей и root discovery;
- слишком слабая помощь на стадии authoring;
- отсутствие first-class механизма превращать `gaps` в следующую работу.

Если исправить именно эти места, навык станет заметно полезнее не только для автора, но и для любого другого агента, который впервые возьмёт его в работу.

---

## Матрица проблем и решений

| Проблема | Решение | Основной слой изменений | Приоритет |
| --- | --- | --- | --- |
| Неочевидный путь к built artifact CLI | Явно написать в `SKILL.md`, что built artifact находится внутри skill root, и дать канонический pattern вызова | `SKILL.md` | P0 |
| Неправильный первый шаг перед созданием backlog | Заменить `determine system state` на `analyze operator input first`; если состояния системы и источника оценки нет, задать один вопрос и ждать ответа | `SKILL.md` | P0 |
| Agent-facing docs не дают достаточно точный shape packet | В `references/data-model.md` зафиксировать exact shape для `target_system` и `as_built`, допустимые value kinds и примеры | `references/data-model.md` | P0/P1 |
| Docs создают ложное ощущение strict taxonomy | Честно разделить `strict enum` и `starter vocabulary`; не вводить новый registry | `references/data-model.md`, `SKILL.md` | P1 |
| Help не показывает strict allowed values и скрывает важную mental model команды | Печатать всё, что строго валидируется, и всё, что меняет mental model команды; не превращать help в dump схемы. В первую очередь: allowed values, root expectations, cwd/root resolution, характер output paths | CLI help, `SKILL.md` | P1 |
| Path/root model cognitively expensive | Не добавлять `--backlog-root`; вместо этого усилить skill, help и output объяснения cwd/root discovery и path resolution | `SKILL.md`, command help, command output/errors | P0 |
| Output paths смешивают absolute и relative | Для machine-facing output перейти на `always absolute`; внутреннюю storage-модель можно оставить relative | CLI output contracts, references | P1 |
| Generated `AGENTS.md` противоречит packet/patch workflow | Развести authored drafts и canonical copies; запретить ручное редактирование только utility-owned state и canonical imports | AGENTS template, `SKILL.md` | P0 |
| Агенты пытаются регистрировать источники параллельно | Вынести в skill и help жёсткое правило: `register-source` для одного backlog root только строго последовательно | `SKILL.md`, command help | P0 |
| `template packet` почти не снижает когнитивную нагрузку | Сделать richer starter template: placeholders, source-id hints, starter blocks для `target_system` / `as_built`, field expectations | CLI template output, references | P2 |
| `gap` блокирует queue без понятного next step | Жёсткое skill-правило: если неопределённость можно закрыть отдельной работой, агент обязан создать clarification / investigation / decision task и повесить blocked item на неё | `SKILL.md`, workflow references | P0 |
| Неясно, включать ли implemented items в новый backlog | Зафиксировать default strategy: `coverage-first backlog`; для частично реализованной системы backlog обязан включать реализованные архитектурно значимые задачи | `SKILL.md`, references | P0 |
| Query-команды скрыто зависят от auto-discovered backlog root | В help и output явно объяснить, что команды backlog-scoped и работают из backlog root или его дочерних директорий | CLI help, `SKILL.md` | P1 |
| Новый агент вынужден читать `src/` для первого реального сценария | Сделать `SKILL.md` + references самодостаточными для первого production-like scenario; source inspection оставить только для разработки утилиты | `SKILL.md`, references, AGENTS template, help | P0 |
| Нет одного канонического walkthrough для первого реального сценария | Добавить короткий end-to-end how-to: `architecture doc -> init -> register-source -> template packet -> packet --dry-run -> packet -> status/gaps/queue/attention` с ожидаемыми результатами | `references/` | P1 |
| `next_commands` пока мало полезны | Сделать их ситуационно полезными для реального follow-up (`status`, `gaps`, `attention`, `queue`) | CLI output contracts | P2 |
| Первый architecture-to-backlog flow остаётся слишком ручным | Улучшать skill/docs и low-level UX последовательно, не усложняя пока модель новой high-level автоматикой | План follow-up, `SKILL.md`, references, help | P1 |
