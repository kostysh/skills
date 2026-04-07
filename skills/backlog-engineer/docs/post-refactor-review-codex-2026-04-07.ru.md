# Review после follow-up рефакторинга `@kostysh/backlog-engineer-cli`

## Контекст

Этот отчёт фиксирует мою повторную оценку skill/docs/runtime contract после имплементации плана из [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md).

Фокус проверки:

- насколько улучшился first-run agent contract;
- насколько `SKILL.md` стал самодостаточным и директивным;
- насколько help/output/walkthrough теперь реально помогают агенту;
- какие проблемы ещё остались.

Проверка выполнялась по:

- текущему дереву файлов skill;
- актуальному `git log`;
- текущему `SKILL.md`;
- `references/*`;
- generated `AGENTS.md` template;
- реальному help output CLI.

## Findings

### 1. Средний приоритет: invocation contract всё ещё неоднозначен и в текущей среде буквально не исполняется

Главная оставшаяся practical-проблема: docs уже показывают команды в форме `backlog-engineer ...`, но не фиксируют канонический local invocation pattern для случая, когда бинарь не установлен в `PATH`.

Подтверждение:

- в [SKILL.md](../SKILL.md) runtime status всё ещё говорит только:
  - `built artifact: scripts/backlog-engineer.mjs`
- см. [SKILL.md](../SKILL.md) раздел `Runtime status`
- walkthrough уже использует bare command examples:
  - `backlog-engineer init --path ./backlog`
  - `backlog-engineer register-source ...`
  - `backlog-engineer packet ...`
- см. [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md)

Практическая проверка в текущей среде показала:

```bash
which backlog-engineer
```

не возвращает путь, а

```bash
backlog-engineer --help
```

даёт `command not found`.

Следствие:

- агент, который буквально следует walkthrough, всё ещё может упасть до первого полезного шага;
- старая проблема “где именно запускать CLI” снижена, но не закрыта полностью.

Что исправить:

- в `SKILL.md` и walkthrough явно зафиксировать один канонический execution pattern;
- например:
  - если CLI установлен в `PATH`, использовать `backlog-engineer`;
  - для локального запуска из skill root использовать `node <skill-root>/scripts/backlog-engineer.mjs`.

> codex: Согласен. Это real defect agent-facing contract, не runtime bug. Исправление должно быть в `SKILL.md`, walkthrough и command reference. Я бы зафиксировал один канонический local pattern буквально, без вариативности в примерах: для skill-local запуска использовать `node ./scripts/backlog-engineer.mjs` из skill root, а bare `backlog-engineer` показывать только как optional installed-path variant.

Важно:

- это не обязательно требует изменения runtime;
- это прежде всего defect agent-facing contract.

### 2. Средний приоритет: правило про “one short blocking question” частично ослабло в `SKILL.md`

Важное улучшение уже произошло: `SKILL.md` теперь правильно требует `operator-input-first` preflight и буквальный запрет идти в repo до ответа оператора.

Но внутри самого `SKILL.md` контракт всё ещё не полностью совпадает с walkthrough.

Сейчас в [SKILL.md](../SKILL.md):

- сначала агент должен выяснить:
  - system state;
  - source of truth for `delivery_state`;
- затем при отсутствии state skill говорит:
  - задать один короткий preflight question;
  - подождать ответа;
- но сама формулировка вопроса дальше перечисляет только:
  - design-only;
  - partially implemented;
  - unsure;
- после этого отдельно добавляется ещё одно правило:
  - если система partially implemented, спросить best available source of truth for delivery state.

То есть на уровне формулировки в `SKILL.md` получается не один блокирующий вопрос, а потенциально двухшаговый dialog.

При этом walkthrough уже лучше и чище:

- в [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md) один вопрос сразу объединяет:
  - system state;
  - source of truth for `delivery_state`.

Следствие:

- `SKILL.md` и walkthrough теперь расходятся не по направлению, а по жёсткости контракта;
- агент, читающий только `SKILL.md`, может построить более длинный preflight, чем было согласовано.

Что исправить:

- выровнять `SKILL.md` на wording walkthrough;
- буквальное правило должно быть таким:
  - если не хватает информации о system state и/или delivery-state evidence,
  - задать один короткий объединённый вопрос;
  - затем ждать ответа.

> codex: Согласен полностью. Это точечный, но важный defect wording-а в `SKILL.md`. Исправление должно быть именно в основном skill contract, не только в walkthrough. Иначе агент, который читает только `SKILL.md`, снова будет строить двухшаговый preflight вместо одного blocking question.

## Что стало заметно лучше

### 1. `SKILL.md` реально превратился в first-run contract

Это главное улучшение всего цикла.

Раньше `SKILL.md` был полезен как обзор, но не как жёсткий operational guide. Сейчас в нём уже есть все основные first-run решения:

- `operator-input-first` preflight;
- запрет идти в repo до ответа оператора;
- `coverage-first backlog` как default strategy;
- директивное правило `gap -> clarification / investigation / decision task`;
- цельная path/root mental model;
- serial-only mutations для одного backlog root;
- high-level интерпретация output ключевых команд.

Это особенно видно в:

- [SKILL.md](../SKILL.md) раздел `Preflight before first backlog`
- [SKILL.md](../SKILL.md) раздел `First backlog strategy`
- [SKILL.md](../SKILL.md) раздел `gap vs continue`
- [SKILL.md](../SKILL.md) раздел `Path and root mental model`
- [SKILL.md](../SKILL.md) раздел `What to expect in output`

По сравнению с состоянием во время исходной сессии это качественный скачок.

### 2. References стали гораздо более usable для первого реального прохода

Сильные улучшения:

- появился канонический walkthrough:
  - [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md)
- `data-model.md` и `examples-and-templates.md` теперь лучше разведены как normative vs illustrative layers;
- `command-reference.md` перестал быть слишком “тонким” и теперь реально помогает в interpretation/output contract;
- `document-to-packet-workflow.md` больше не конфликтует с основным skill contract.

Результат:

- первый production-like scenario теперь действительно можно собрать из `SKILL.md` + references;
- необходимость лезть в `src/` резко снизилась.

### 3. Help output CLI стал materially better

Проверка реального help показала, что improvement не только документный, но и user-facing.

Особенно хорошо:

- `register-source --help` теперь показывает:
  - allowed values;
  - backlog-scoped nature команды;
  - path resolution;
  - serial mutation rule;
  - absolute-path behavior в machine-facing output.
- `packet --help` теперь объясняет:
  - `--dry-run`;
  - authored draft vs canonical immutable copy;
  - absolute-path output contract.
- `queue --help` теперь честно говорит:
  - что это ordered chains, а не flat ready list;
  - что делать, если `queue` пустой.

Это именно тот тип discoverability, которого не хватало в первой сессии.

> codex: Подтверждаю. Это хороший сигнал, что help действительно перестал быть просто schema-adjacent output и начал работать как operational aid для агента.

### 4. Generated backlog `AGENTS.md` больше не конфликтует со штатным workflow

Текущий шаблон в [assets/backlog-agents.template.md](../assets/backlog-agents.template.md) уже нормально различает:

- authored drafts;
- utility-owned canonical copies.

Критическое улучшение:

- ручное редактирование draft packet/patch files разрешено до apply;
- ручное редактирование canonical import copies запрещено;
- наличие draft + canonical copy объяснено как intentional, а не как clutter.

Это снимает один из самых неприятных внутренних конфликтов исходного skill contract.

> codex: Согласен. Это одно из самых ценных исправлений цикла, потому что оно убирает ложный конфликт между нормальным authoring draft и utility-owned immutable copies.

## Дополнительное наблюдение по traceability

История follow-up реализации сейчас распределена неидеально.

Фактическое дерево показывает поздние коммиты:

- `9c75bbd`
- `772028e`
- `319c140`
- `dfa2cb7`
- `179d084`

Именно они соответствуют структуре пакетов из `refactoring-plan-3.ru.md`.

Но полный trail этого цикла сейчас фактически лежит не только в [implementation-log-2.ru.md](implementation-log-2.ru.md), а в значительной степени в [implementation-log-1.ru.md](implementation-log-1.ru.md), где уже есть follow-up packages `1..5`.

Это не дефект runtime или самого skill contract, но это лёгкий defect инженерной traceability:

- если читать только `implementation-log-2.ru.md`, можно решить, что follow-up цикл закрыт раньше, чем это произошло в реальном дереве.

Если захотите это дочистить, лучше либо:

- явно развести назначение `implementation-log-1` и `implementation-log-2` в `docs/README.md`;
- либо собрать весь follow-up trail одного цикла в одном месте.

> codex: Согласен частично. Traceability defect реальный, но теперь он уже легче чинится, чем раньше: нужно просто яснее развести роль `implementation-log-1` и `implementation-log-2` в `docs/README.md` и не допускать повторного смешивания циклов. Полный перенос старых записей я бы сейчас не делал, если это не даёт новой практической пользы.

## Общий verdict

Стало существенно лучше.

Ключевой позитивный вывод:

- теперь skill уже не выглядит как “интересная утилита с неполным agent contract”;
- он гораздо ближе к состоянию “первый реальный агент может пройти сценарий без source spelunking и без скрытой реконструкции mental model”.

Наиболее сильные улучшения:

- `SKILL.md` стал operational;
- references стали согласованнее;
- help output стал полезным;
- walkthrough действительно закрывает first-run scenario;
- generated `AGENTS.md` перестал противоречить packet/patch workflow.

Оставшиеся самые важные хвосты:

1. явно закрыть local invocation contract CLI;
2. довести wording preflight в `SKILL.md` до того же уровня жёсткости, который уже есть в walkthrough.

Если исправить именно эти два пункта, я бы считал follow-up цикл почти полностью закрывшим исходные проблемы первой сессии.

> codex: Моя оценка такая же. Из реально оставшегося вижу именно два actionable хвоста: invocation contract и единый blocking preflight question. Остальное уже выглядит как polishing, а не как дефекты, ломающие first-run workflow.

## Матрица проблем и решений

| Проблема | Приоритет | Где исправлять | Решение |
| --- | --- | --- | --- |
| Local invocation contract CLI не зафиксирован явно, а bare `backlog-engineer` может быть недоступен в `PATH` | P0 | `SKILL.md`, `references/first-backlog-walkthrough.md`, `references/command-reference.md` | Зафиксировать один канонический local execution pattern для skill-local запуска: `node ./scripts/backlog-engineer.mjs` из skill root. Формулировка команды и требование запускать её именно из skill root должны всегда идти вместе. Bare `backlog-engineer` оставить только как optional variant для случая, когда CLI установлен в `PATH`. |
| В `SKILL.md` preflight wording всё ещё допускает двухшаговый dialog вместо одного blocking question | P0 | `SKILL.md` как primary fix; затем `references/first-backlog-walkthrough.md` | Переписать preflight contract так, чтобы при отсутствии информации о `system state` и/или `delivery-state evidence` агент задавал один короткий объединённый вопрос и затем ждал ответа. После этого синхронизировать walkthrough example, чтобы wording оставался максимально близким по смыслу. |
| Traceability между `implementation-log-1` и `implementation-log-2` остаётся неидеальной | P2 | `docs/README.md` | Явно развести назначение двух логов и зафиксировать, какой цикл где документируется. Старые записи не переносить без практической необходимости. |
| Help/output contract стал сильнее, но его нужно удерживать от drift в будущих циклах | P2 | process/docs discipline | Сохранить текущий критерий: help должен печатать всё, что строго валидируется, и всё, что меняет mental model команды, но не превращаться в dump схемы. |
| Follow-up цикл в целом почти закрыт, но остаются два first-run хвоста | P1 | planning / next small cycle | Следующий цикл ограничить двумя пунктами: invocation contract и единый blocking preflight question. Остальное считать polishing-only. |
