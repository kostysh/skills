# Анализ проблем `dossier-engineer` и предложения по исправлению

Дата анализа: 2026-05-01

## 0. Область анализа

Анализ выполнен только по приложенным актуальным материалам:

- текущая актуальная версия skill/runtime `dossier-engineer`;
- dossier artifacts проекта, на котором обкатывался новый процесс;
- отчёт агента со сравнением stage-методик.

Старые версии скила, предыдущие черновики и контекст проектирования не использовались как источник истины. Там, где в отчёте упоминается “старый процесс”, это только пересказ из предоставленного comparison report, а не самостоятельный анализ старого архива.

## 1. Краткий вывод

Проблемы имеют один общий корень: текущий `dossier-engineer` хорошо защищает проект от **явного substrate-only closure** на уровне принципов, но слабее управляет **содержательностью спецификации, плана и завершения stage lifecycle**.

Текущая модель стала легче и capability-oriented, но в ней ослабли три механизма, которые раньше заставляли агента писать содержательные stage artifacts:

1. `spec-compact` и `plan-slice` больше не являются самостоятельными содержательными контрактами. Runtime в основном проверяет наличие структурных признаков: behavior acceptance, demo scenario, anti-claim, challenge. Этого достаточно, чтобы поймать пустоту, но недостаточно, чтобы получить качественную спецификацию и план.
2. `queue` сообщает “Ready work items”, хотя фактически означает “у work item нет базовых blockers, можно начать следующий протокольный шаг”. Это создаёт ложное ощущение, что item готов к реализации, хотя стадии ещё `not_started`.
3. Stage closure и post-close hygiene разделены на несколько команд, а runtime не обеспечивает single-writer protection. Поэтому агенты забывают закрывать стадии, закрывают работу на уровне текста, но не обновляют lifecycle, или параллельные вызовы перетирают изменения.

Критически важно: эти проблемы не нужно решать возвращением тяжёлого старого протокола. Правильное направление — **не добавить ещё больше артефактов, а укрепить несколько узких точек**:

- сделать `queue` честным: “actionable next step”, а не “implementation-ready”;
- сделать `spec-compact` и `plan-slice` содержательными блоками внутри work item, а не отдельной бюрократией;
- потребовать минимальную `AC -> implementation surface -> evidence` матрицу;
- перенести concept-conformance review до implementation, но убрать избыточное дублирование review на micro-fixes;
- слить implementation close и hygiene в один нормальный terminal path или жёстко запретить handoff без post-close state;
- добавить single-writer lock для mutating CLI-команд.

## 2. Подтверждённые симптомы по приложенным артефактам

### 2.1. Stage artifacts действительно часто пустые

По `/code/projects/demo-editor/docs/dossier/stages/` найдено 15 stage events. Из них 9 имеют пустое body, если не считать заголовки `## Summary` и `## Notes`.

Разбивка:

| Stage | Events | Empty body events | Комментарий |
|---|---:|---:|---|
| `feature-intake` | 3 | 3 | Все события пустые, включая ready/close. |
| `spec-compact` | 3 | 3 | Все события пустые. Именно это бьёт по качеству спецификации. |
| `plan-slice` | 6 | 3 | Ready/close/start пустые; содержательны в основном challenge events. |
| `implementation` | 3 | 0 | Implementation events содержательнее, потому что к этому моменту уже была реальная отладка и evidence. |

Пример: `STG-20260430-...-987110.md` имеет `stage: plan-slice`, `event: ready`, summary с планом, но body пустой. То есть runtime сохраняет короткий summary, но не требует полноценного плана.

### 2.2. `lint`, `status`, `capability check` проходят, хотя спецификации/планы слабы

На предоставленных artifacts, скопированных под `docs/dossier`, runtime даёт:

```text
status: success
queue: Ready work items: 2
capability check: Capability gates pass
lint: No lint findings
```

При этом comparison report и retro честно фиксируют, что `plan-slice` был слишком тонким, а stage-event summary не заменяет спецификацию и план.

Это означает, что runtime и skill currently validate **структурную достаточность**, но не достаточность stage artifact как инженерного handoff-контракта.

### 2.3. `queue` смешивает разные смыслы readiness

Для двух новых items:

- `WI-20260501-route-operator-replies-in-agent-review-t-5f7346`;
- `WI-20260501-treat-selected-docx-text-as-advisory-age-51001b`;

`queue` сообщает `Ready work items: 2`, хотя у обоих:

```yaml
stage_state:
  feature-intake: not_started
  spec-compact: not_started
  plan-slice: not_started
  implementation: not_started
```

`next` затем корректно говорит начать `feature-intake`. Но оператор/агент видит “ready” и может принять это за “готово к implementation”. Это UX/runtime-сигнал, который провоцирует преждевременную уверенность.

### 2.4. Реализация и dossier lifecycle расходились

Ретро-анализ прямо фиксирует:

- кодовые коммиты существовали;
- work item оставался `planned` / `implementation: in_progress`;
- queue продолжала считать его ready;
- closure пришлось делать отдельно позже.

Это подтверждает проблему: agent может выполнить code work, но забыть довести dossier lifecycle до truth state. Причина не только в агенте. Текущий протокол имеет несколько отдельных шагов: `stage ready`, `stage close`, `hygiene run`, затем `status/queue`. Любой из них агент может пропустить.

### 2.5. Live integration proof появился поздно

Ретро показывает, что ранние reviews/tests проверяли substrate: bridge, tools, prompt routing, selection handling, IPC/security boundaries. Пользовательское поведение стало доказанным только после live Electron demo:

- активный renderer editor;
- live bridge;
- visible comment/suggestion;
- typed failures;
- dirty state;
- save flow.

До этого агент мог считать фичу почти завершённой, но пользователь не видел ожидаемого поведения. Это ровно тот класс ошибок, ради которого создавался `dossier-engineer`.

## 3. Причины проблемного поведения

## 3.1. Причина A: `spec-compact` и `plan-slice` стали слишком “тонкими”

В `references/workflow.md` stage semantics правильные по намерению:

- `spec-compact` должен определить behavioral acceptance, anti-claims, demo scenario;
- `plan-slice` должен выбрать минимальный implementation slice, риски, challenge и verification profile.

Но фактический runtime gate намного слабее.

В `src/app.ts` функция `workGateFindings` проверяет для capability work только:

- есть ли хотя бы один acceptance criterion с `kind: behavior`;
- есть ли непустой `demonstration.scenario`;
- есть ли хотя бы один anti-claim;
- записан ли challenge.

Эти проверки полезны, но это **presence checks**, не **quality checks**. Любая общая формулировка проходит.

`stageGateFindings` для `plan-slice` проверяет только `challenge.recorded === true`. Он не проверяет:

- implementation target;
- production integration path;
- files/interfaces/components;
- sequencing;
- risk decisions;
- verification matrix;
- change-proposal triggers;
- dependency decisions;
- acceptance-to-evidence mapping.

В результате `plan-slice` легко превращается в один challenge summary.

### Почему это особенно опасно

Challenge отвечает на вопрос “как план может быть неверным?”. Но он не отвечает на вопрос “какой именно план мы выполняем?”. Если после challenge нет конкретного implementation handoff, агент всё равно может начать кодить по общей идее.

## 3.2. Причина B: stage events не являются содержательными stage contracts

Runtime создаёт stage event body через шаблон:

```text
# <stage> <event>

## Summary

## Notes
```

В текущей версии body completion reminder применяется к artifact types:

- source;
- capability;
- baseline;
- guardrail;
- work_item;
- review;
- verification;
- changeset.

`stage_event` не входит в этот список. Поэтому runtime не напоминает агенту заполнить body stage events, хотя именно stage events сейчас часто оказываются единственным отдельным stage artifact.

Это создаёт противоречие:

- методика говорит, что стадии важны;
- runtime создаёт stage artifacts;
- но stage artifacts могут оставаться scaffold-only;
- lint это пропускает;
- agent считает protocol выполненным.

## 3.3. Причина C: work item body перегружен ролями

Work item сейчас одновременно является:

- backlog item;
- feature dossier;
- capability relation record;
- spec container;
- plan container;
- challenge context;
- closure notes;
- process notes.

Это хорошо для merge-safety и простоты хранения, но есть побочный эффект: если агент заполнил общие sections work item body, он может считать, что spec и plan уже готовы. На деле нужны разные уровни detail:

- work item summary — “что это за работа”;
- spec-compact — “что именно должно наблюдаемо работать и как это фальсифицировать”;
- plan-slice — “какой production path и implementation surface должны быть изменены”.

Сейчас эти уровни смешиваются.

## 3.4. Причина D: `queue` даёт misleading readiness signal

В runtime `queue` item считается ready, если:

- lifecycle не closed/retired/implemented;
- нет базовых workGateFindings;
- зависимости закрыты;
- нет open blockers/source reviews/triggered guardrails.

Но `queue` не различает:

- ready to start feature-intake;
- ready to spec;
- ready to plan;
- ready to implement;
- ready to close;
- ready for handoff.

Он возвращает общий label `Ready work items`. Это провоцирует ошибку UX: наличие заполненного work item воспринимается как readiness к implementation.

## 3.5. Причина E: lifecycle finalization слишком дробная

Текущий implementation completion path:

1. `stage ready --stage implementation`;
2. `stage close --stage implementation`;
3. `hygiene run --stage implementation`;
4. `status`;
5. `queue`;
6. `changeset/report/handoff`.

Если агент сделал код, но не прошёл этот путь полностью, dossier lifecycle расходится с реальным кодом. Именно это зафиксировано в ретро.

Сама идея “ready_for_close не равно closed” правильная. Но для агента это слишком много терминальных шагов, особенно после длинной отладки. Чем больше отдельных команд нужно выполнить в конце, тем выше вероятность, что одна будет пропущена.

## 3.6. Причина F: concept-conformance review расположен слишком поздно

Skill требует concept-conformance review для implementation closure. Но проблема часто возникает **до implementation**: задача уже сформулирована слишком узко или план уходит в infrastructure.

`plan-slice` должен быть gate, где это ловится. Сейчас runtime не требует concept-conformance для `plan-slice` closure. В `capability-governance.md` сказано, что plan-slice “should also receive concept-conformance review” в рискованных случаях, но это should, не hard gate.

В результате agent может начать implementation по слабому плану, а concept review появится только перед closure, когда уже накоплены код и micro-fixes.

## 3.7. Причина G: behavioral verification не всегда означает production integration

Текущий profile `behavioral-demo` хорош по смыслу, но слишком общий. Для user-visible app capabilities он должен означать: demo проходит через реальный пользовательский/операторский entrypoint и действующее приложение.

В ретро видно, что automated tests были полезны, но не доказывали live editor behavior. Настоящее evidence — live Electron demo — появилось поздно.

Причина: skill говорит “behavioral demo”, но не требует явно:

- actual app entrypoint;
- production renderer/main/preload path;
- active UI/editor state;
- visible before/after state;
- save/continuity path;
- evidence that mocks/headless stores are not substituting live behavior.

## 3.8. Причина H: testable anti-claims не всегда превращаются в negative acceptance criteria

В work items есть хорошие anti-claims. Например: “не отправлять ordinary human comments агенту без явного operator intent”. Это фактически negative behavior requirement. Если оставить его только anti-claim, реализация может забыть проверить его тестом или demo.

Anti-claim полезен как граница, но когда он проверяем, он должен становиться negative acceptance criterion или falsifier в demo matrix.

## 3.9. Причина I: review signal разбавлен micro-fix шумом

Ретро фиксирует много PASS review artifacts для одного work item после микрофиксов. Это ухудшает signal-to-noise:

- каждое маленькое изменение получило локальный PASS;
- но общая картина “готово ли поведение” оставалась неочевидной;
- ранние reviews проверяли substrate до live behavior.

Текущий процесс рискует быть одновременно слишком слабым на plan/spec и слишком шумным на micro-review.

## 3.10. Причина J: runtime race не устранён методикой

В текущей версии `parallel-development.md` запрещает “shared lock files”. Это правильно для committed canonical state, но вредно, если трактовать это как запрет на runtime lock. Для защиты от race нужен ephemeral runtime lock, не canonical artifact.

В `src/infra.ts` запись файла выполняется через обычный `writeFile`:

```ts
await writeFile(absolutePath, stringifyMarkdownArtifact(frontmatter, body), 'utf8');
```

`updateArtifact` читает artifact, меняет frontmatter и пишет файл обратно. Нет:

- single-writer lock;
- atomic temp+rename write;
- stale-read check;
- compare-and-swap по предыдущему hash;
- transaction envelope для команд, меняющих несколько файлов.

Именно поэтому параллельные runtime-команды могут перетирать acceptance/anti-claims в одном artifact.

## 3.11. Причина K: skill уже содержит много правильных правил, но runtime не проверяет ключевые из них

В `SKILL.md` и references уже есть хорошие правила:

- Body Completion Gate;
- Dossier Language Policy;
- capability-first policy;
- behavioral demo;
- challenge;
- concept-conformance;
- anti-claims;
- guardrails.

Но часть правил остаётся “агент должен помнить”. Когда агент устал, работает долго, отлаживает код или сталкивается с runtime race, он забывает правила. Это нормальное поведение агента. Надёжность процесса должна держаться не на памяти агента, а на минимальных runtime gates и коротких финальных ритуалах.


## 3.12. Причина L: CLI specification and runtime implementation diverge

В `docs/cli-spec.ru.md` уже описаны более сильные алгоритмы, чем фактически реализованы в runtime. Например, CLI spec говорит, что `queue` должен учитывать current stage, previous required stage, stage-specific gates, stale reviews/verification and closure validity. Но фактический `queue` в `src/app.ts` в основном применяет `workGateFindings`, dependencies, source reviews, guardrails and blockers.

Аналогично, CLI spec описывает для `plan-slice` validation: challenge and verification plan valid. Фактический `stageGateFindings` для `plan-slice` проверяет только наличие challenge.

Это важная причина проблемного поведения: skill/reference layer создаёт правильные ожидания, но runtime позволяет агенту пройти более слабый путь. Агент обычно следует фактическим runtime blockers и `Next actions`, а не всей длинной спецификации. Поэтому критические правила должны быть либо очень короткими в active skill, либо реально enforceable runtime gates.

Следствие: добавлять новые правила в reference полезно только тогда, когда они либо сильно просты и повторяются в final checklist, либо подкреплены runtime blocking behavior.

## 4. Предложения по исправлению

Ниже предложения сгруппированы по приоритету. Они не требуют возврата к сложному старому процессу. Наоборот, несколько предложений уменьшают количество шагов и убирают двусмысленные сигналы.

## P0. Ввести single-writer lock для mutating runtime-команд

### Проблема

Race condition не решается методикой. Если два агента одновременно вызывают mutating command, они могут прочитать один и тот же старый artifact и записать разные версии, потеряв часть изменений.

### Предложение

Все mutating commands должны брать exclusive write lock на dossier root.

Read-only commands могут работать параллельно:

- `status`;
- `attention`;
- `queue`;
- `next`;
- `lint`, если не пишет;
- `capability check`;
- `guardrail check`, если без `--record`;
- `source impact`.

Mutating commands должны сериализоваться:

- `source add/refresh/review resolve`;
- `capability create/claim/anti-claim/demo`;
- `baseline create/capability add`;
- `guardrail add/resolve`;
- `work create/acceptance/demo/anti-claim/challenge/support/dependency/blocker/risk/amend/split/retire`;
- `stage start/ready/close/reopen/log`;
- `verify run/record`;
- `review record`;
- `hygiene run`;
- `changeset create`;
- `report create`;
- `retro create`.

### Как сделать без превращения runtime в базу данных

Использовать ephemeral lock directory, не canonical artifact:

```text
.git/dossier-engineer-write.lock/
```

или:

```text
.dossier-runtime/write.lock/
```

Главное: lock не должен лежать как committed Markdown artifact и не должен быть частью dossier truth.

Atomic acquisition:

```text
mkdir(lock_dir)
```

Если `mkdir` успешен — lock получен. Если директория существует — команда завершается без изменений и печатает holder info + next actions.

### Правило выполнения mutating command

1. Acquire write lock.
2. После lock заново прочитать все affected artifacts.
3. Проверить preconditions.
4. Подготовить изменения in memory.
5. Записать файлы atomic temp+rename.
6. Выполнить post-write validation для affected artifacts.
7. Release lock.

### Почему coarse-grained lock лучше per-file locks

На первой версии нужен lock на весь dossier root. Это проще и надёжнее:

- нет deadlocks;
- нет порядка захвата locks;
- все multi-file команды консистентны;
- CLI-команды короткие, поэтому serialization не ухудшит разработку кода.

Parallel code work остаётся. Сериализуется только запись в coordination layer.

### Что поменять в skill wording

Текущее правило “avoid shared lock files” надо уточнить:

```text
Do not use committed lock files or lock files as canonical dossier state.
Ephemeral runtime write locks are required for mutating commands and are not dossier artifacts.
```

## P0. Переименовать/перестроить `queue`: не “Ready work items”, а “Actionable next work”

### Проблема

`queue` создаёт ложное ощущение readiness. Work items со всеми стадиями `not_started` выводятся как “Ready work items”.

### Предложение

Не плодить новую команду. Оставить `queue`, но изменить смысл вывода.

Вместо:

```text
Ready work items: 2
- WI-...
```

Выводить:

```text
Actionable work items: 2

Ready to start protocol:
- WI-... -> next: stage start feature-intake

Ready for implementation:
- none

Ready for implementation closure:
- none
```

Или ещё проще:

```text
Next actionable work:
- WI-... | next_stage=feature-intake | action=start | not implementation-ready
- WI-... | next_stage=feature-intake | action=start | not implementation-ready
```

### Зачем это важно

Агент и оператор перестанут путать:

- можно начать протокол;
- можно реализовывать;
- можно закрывать;
- можно считать готовым.

### Minimal runtime change

Изменить только label и группировку вывода. Сама логика поиска actionable items может остаться почти такой же.

## P0. Сделать `spec-compact` и `plan-slice` не отдельными тяжёлыми артефактами, а обязательными body-блоками work item

### Проблема

Возвращать отдельные stage dossiers для каждой стадии — риск усложнения. Но текущие stage events слишком тонкие. Нужен компромисс.

### Предложение

Оставить один `WI-*.md`, но добавить в него два обязательных stage body blocks:

```markdown
## Spec Compact

### Behavior statement

### Acceptance criteria matrix

### Negative acceptance / falsifiers

### Anti-claims and non-goals

### Open questions and gaps

## Plan Slice

### Implementation target

### Integration path

### Files, interfaces, and components

### Sequence

### AC to evidence matrix

### Risks and fallback/change-proposal triggers
```

Это не новый artifact и не новый слой. Это усиление уже существующего work item body.

### Stage close gates

`stage close --stage spec-compact` должен требовать непустой, project-specific content в `## Spec Compact`.

`stage close --stage plan-slice` должен требовать непустой, project-specific content в `## Plan Slice`.

Достаточно простых проверок:

- секция существует;
- в ней нет только placeholder/TODO;
- есть минимум одна matrix row или bullet по каждому обязательному subsection;
- plan-slice содержит хотя бы один конкретный file/interface/component или явно говорит “non-code” с rationale.

Это не идеальная семантическая проверка, но она создаст pressure на содержательность без тяжёлой бюрократии.

## P0. Добавить минимальную `AC -> implementation surface -> evidence` матрицу

### Проблема

В текущих artifacts acceptance есть, demo есть, но план не показывает, как каждый criterion будет доказан и через какую часть приложения.

### Предложение

Для capability work в `Plan Slice` обязательна короткая матрица:

| AC | Observable behavior | Implementation surface | Evidence method | Falsifier |
|---|---|---|---|---|
| AC-... | Что увидит оператор | UI/API/renderer/main/file | command/manual demo/test | Что докажет, что AC не выполнен |

Пример для live editor:

| AC | Observable behavior | Implementation surface | Evidence method | Falsifier |
|---|---|---|---|---|
| visible suggestion | Agent rewrite visible in open DOCX editor | renderer DocxEditorRef adapter + MCP live bridge | live Electron demo | only comment/log appears, no editor-visible text suggestion |

### Почему это решает интеграционную проблему

Агент не сможет закрыть “bridge/tools/tests”, если в matrix написано, что evidence должно проходить через active Electron editor.

## P0. Сделать “Integration Path” обязательным для user-visible capabilities

### Проблема

Агент реализовал feature и счёл её готовой, но не интегрировал в действующее приложение. Это случилось потому, что plan не был обязан назвать production entrypoint.

### Предложение

Для `delivery.kind: capability` и user-visible scope в plan-slice требовать:

```markdown
### Integration path

- Actor entrypoint:
- Runtime path:
- Production components touched:
- UI/API/agent path:
- State/effect path:
- Continuity path:
- What would prove this is integrated:
- What would prove this is only substrate:
```

Для desktop/editor проекта это, например:

- Actor entrypoint: operator action in Electron renderer;
- Runtime path: renderer -> preload -> main -> MCP/app-server -> renderer bridge;
- Visible result: comment/suggestion in active editor;
- Continuity: dirty state + save flow;
- Substrate-only falsifier: MCP returns success but editor shows nothing.

### Stage gate

`plan-slice` не должен закрываться, если Integration Path отсутствует или говорит только о внутреннем API без actor path.

## P0. Перенести concept-conformance review на `plan-slice` для capability work

### Проблема

Concept-conformance review перед implementation closure приходит слишком поздно. К этому моменту агент уже мог реализовать слабый/узкий/infrastructure-only план.

### Предложение

Для `delivery.kind: capability`:

- `plan-slice close` требует current PASS `concept-conformance-reviewer`;
- implementation closure проверяет, что этот review остаётся fresh;
- если capability claim/acceptance/plan изменились, review становится stale;
- не требовать второй concept review на implementation, если scope hash не изменился.

Это одновременно усиливает ранний контроль и снижает review overhead.

### Как не усложнить

Не добавлять новый review type. Использовать уже существующий `concept-conformance-reviewer`, но поменять timing.

## P1. Упростить terminal lifecycle: объединить implementation close и hygiene

### Проблема

Agent forgets finalization. Separate `stage close implementation` and `hygiene run` создают lifecycle drift.

### Предложение

Нормальный terminal path должен быть один:

```bash
dossier-engineer stage close --work <id> --stage implementation
```

При успешном implementation close runtime должен:

1. проверить implementation closure gates;
2. выполнить hygiene checks immediately;
3. создать hygiene artifact;
4. если hygiene pass — поставить lifecycle `closed`;
5. если hygiene blocked — не считать work item closed.

`hygiene run` можно оставить как recovery/manual command, но нормальный агентский путь должен быть одной командой.

### Альтернатива, если не хочется менять semantics

Добавить одну команду-финишер:

```bash
dossier-engineer finish --work <id>
```

Она выполняет:

- required verification/review check;
- stage ready/close если возможно;
- hygiene;
- status/queue verification;
- changeset hint.

Но я предпочитаю первый вариант: меньше новых команд.

## P1. Ввести правило “testable anti-claim -> negative acceptance criterion”

### Проблема

Проверяемые anti-claims остаются prose boundary и теряются в implementation.

### Предложение

Если anti-claim описывает observable forbidden behavior, runtime/skill должны требовать добавить negative AC.

Примеры:

Anti-claim:

```text
Do not route ordinary human comments to Codex without explicit operator intent.
```

Должен стать AC:

```text
When an ordinary human comment is added without agent-authored thread context or explicit operator intent, the app must not route it to Codex.
```

Матрица должна включать negative criteria и их evidence.

### Как не усложнить

Не создавать отдельный artifact. Просто правило в `spec-compact`: “testable anti-claims must be represented as acceptance criteria or falsifiers.”

## P1. Свести micro-fix reviews к consolidated review перед closure

### Проблема

Один WI накопил много PASS reviews для micro-fixes. Это ухудшает signal-to-noise.

### Предложение

Для активного work item:

- micro-fixes внутри того же trust boundary записываются как verification/stage notes;
- code/security review повторяется только если изменился trust boundary, IPC/security/persistence/source interpretation или material scope;
- перед closure делается один consolidated code/security/spec review по финальному diff/scope.

### Формулировка правила

```text
Do not create a full review bundle for every micro-fix unless the micro-fix changes trust boundary, source interpretation, capability claim, security posture, or acceptance criteria. Prefer one consolidated review before closure for a sequence of stabilization fixes in the same active WI.
```

Это уменьшит overhead и повысит качество final review.

## P1. Сделать “live-app evidence” обязательным для UI/editor/user-facing capability

### Проблема

Behavioral-demo слишком общий. Automated tests могут пройти, но приложение не интегрировано.

### Предложение

Для capability с UI/editor/operator behavior:

- хотя бы одно evidence должно проходить через actual running application path;
- в verification body должны быть `before`, `action`, `after`, `continuity/save/retry`;
- mock/headless evidence может быть supporting, но не closure evidence.

Можно не менять schema, а использовать convention:

```yaml
profile: behavioral-demo
evidence_class: live-app
```

или оставить `evidence_class: behavioral`, но body должен явно говорить:

- actual app entrypoint;
- production path;
- observed UI/app state;
- falsifiers checked.

### Пример gate

Capability work cannot close if all passing verification evidence is:

- unit;
- mock;
- contract;
- headless store;
- prompt-only;
- schema-only.

## P1. Исправить Body Completion применительно к stage content

### Проблема

Body Completion Gate существует, но stage events не входят в runtime body completion reminder. А stage events часто пустые.

### Предложение

Выбрать один из двух вариантов.

#### Вариант A — лучше и проще: stage events остаются events, stage content живёт в work item

Тогда stage events можно не заполнять подробно. Но work item должен иметь обязательные `Spec Compact` и `Plan Slice` sections, и stage close проверяет их.

#### Вариант B — включить `stage_event` в Body Completion Gate

Если stage events остаются carrier stage content, добавить `stage_event` в body completion artifact types и требовать body content для `ready`/`close` events.

Я рекомендую вариант A. Он проще: меньше файлов, меньше конфликтов, больше шансов, что агент прочитает один work item и увидит полную картину.

## P1. Исправить `next` для closed/hygiene state

В проверке artifacts `next` для уже закрытого и hygiened work item всё равно предложил `hygiene run`. Это не главная проблема, но UX-сигнал плохой. `next` должен различать:

- implementation closed but hygiene missing;
- hygiene passed;
- lifecycle closed;
- no next action except changeset/report.

Если `post_close_hygiene.implementation: closed`, `next` не должен снова предлагать hygiene.

## P2. Добавить маленький “Stage Quality Rubric” вместо тяжёлых протоколов

Чтобы не усложнять skill, не нужно возвращать длинные старые stage artifacts. Достаточно короткой rubric, которую агент должен применить перед закрытием stage.

### `spec-compact` rubric

Перед close агент должен ответить:

1. Какое observable behavior будет создано/изменено?
2. Какие positive AC доказывают поведение?
3. Какие negative AC/falsifiers предотвращают самообман?
4. Какие anti-claims ограничивают scope?
5. Какие implied expectations пользователя учтены?
6. Какие gaps остаются?

### `plan-slice` rubric

Перед close агент должен ответить:

1. Какой production entrypoint будет задействован?
2. Какие files/interfaces/components будут изменены?
3. Какая последовательность implementation steps?
4. Как каждый AC будет доказан?
5. Где может возникнуть substrate-only false positive?
6. Когда нужен change-proposal?

Эту rubric можно добавить как reference и как stage close prompt, не создавая новых сущностей.

## 5. Предлагаемый минимальный roadmap изменений

## Phase 1 — быстрые исправления без усложнения модели

1. Изменить `queue` output:
   - “Ready work items” -> “Actionable work items”.
   - Показывать `next_stage` и `next_action`.
   - Явно помечать `not implementation-ready`.
2. Добавить в work item scaffold обязательные sections:
   - `## Spec Compact`;
   - `## Plan Slice`.
3. Добавить stage close checks на presence/non-placeholder content этих sections.
4. Для `plan-slice` capability work требовать current concept-conformance review.
5. Обновить final/handoff rule: нельзя говорить “готово”, пока `status` и `next` не показывают terminal state.
6. Исправить `next` для already-hygiened closed work.

Это минимальный набор, который должен резко улучшить качество specs/plans и убрать часть lifecycle drift.

## Phase 2 — runtime safety

1. Добавить single-writer lock для всех mutating commands.
2. Переписать file writes на temp+rename.
3. Читать affected artifacts после lock acquisition.
4. Добавить stale write detection по предыдущему file hash или updated_at.
5. Добавить lock conflict output with next actions.

Это решает race.

## Phase 3 — integration correctness

1. Ввести `Integration Path` section для capability plan-slice.
2. Ввести `AC -> surface -> evidence -> falsifier` matrix.
3. Для UI/editor/user-facing capabilities требовать live-app behavioral evidence.
4. Testable anti-claims превращать в negative AC/falsifier.

Это решает “фича реализована, но не интегрирована в действующее приложение”.

## Phase 4 — review noise reduction

1. Consolidated review before closure for sequences of micro-fixes.
2. Re-review only on material scope/trust boundary changes.
3. Concept-conformance moves to plan-slice; implementation checks freshness instead of requiring repeated concept reviews.

Это снижает overhead без ослабления safety.

## 6. Что не нужно делать

### Не возвращать полный старый тяжёлый workflow

Проблема не в том, что новый skill слишком простой вообще. Проблема в том, что он слишком слаб в нескольких точках: spec, plan, queue semantics, terminal closure, write concurrency.

Возврат большого количества stage artifacts и обязательных audits на каждый шаг снова перегрузит агента.

### Не добавлять отдельную базу данных

Markdown/YAML model остаётся правильной. Race решается lock + atomic write, а не базой данных.

### Не добавлять per-file locks на первой итерации

Per-file locking сложнее, чем нужно. One dossier root, one writer at a time — достаточно.

### Не полагаться только на “агент должен помнить”

Часть правил нужно оставить в skill, но ключевые failure modes должны иметь runtime-level blockers:

- queue label;
- stage close gates;
- concept review before implementation;
- write lock.

### Не считать больше review artifacts равным большему качеству

Серия micro-fix PASS reviews может ухудшить clarity. Нужен один final consolidated review, если trust boundary не менялся.

## 7. Конкретные формулировки для будущего изменения skill

Ниже не patch, а рекомендуемые формулировки.

### 7.1. Queue semantics

```md
`queue` shows actionable next work, not implementation readiness.
A queued work item may be ready only to start the next protocol stage.
The agent MUST inspect `next --work <id>` before treating any queued item as implementation-ready.
```

### 7.2. Spec Compact body contract

```md
Before `spec-compact` close, capability work MUST have a completed `Spec Compact` body section in the work item.
It must include behavior statement, acceptance criteria matrix, negative/falsifier criteria, anti-claims, and open gaps.
Frontmatter presence alone is not sufficient.
```

### 7.3. Plan Slice body contract

```md
Before `plan-slice` close, capability work MUST have a completed `Plan Slice` body section in the work item.
It must include implementation target, integration path, files/interfaces/components, sequence, AC-to-evidence matrix, risks, and change-proposal triggers.
A challenge alone is not a plan.
```

### 7.4. Integration path

```md
For user-visible capability work, the plan MUST name the production entrypoint and runtime path through which the capability will be observed.
Implementation closure evidence must exercise that path, not only mocks, schemas, internal stores, or headless tools.
```

### 7.5. Concept conformance timing

```md
Capability work requires concept-conformance review before `plan-slice` closes.
Implementation closure reuses that review if the material scope hash remains fresh; otherwise the review must be rerun.
```

### 7.6. Terminal closure

```md
A work item is not handoff-complete until implementation closure and post-close hygiene both pass, status has no closure violations, and queue no longer presents the work item as actionable.
```

### 7.7. Runtime concurrency

```md
Mutating runtime commands MUST acquire an exclusive ephemeral dossier write lock before reading and writing artifacts.
The lock is not canonical dossier state and must not be committed.
If the lock is held, the agent MUST stop the mutation and follow the runtime lock recovery instructions; it MUST NOT bypass the lock by manually editing artifacts.
```

## 8. Конкретные runtime acceptance tests, которые стоит добавить

Чтобы проблемы не вернулись, runtime tests должны проверять:

1. `queue` does not label `feature-intake:not_started` items as implementation-ready.
2. `stage close --stage spec-compact` blocks if `Spec Compact` body section is missing/placeholder.
3. `stage close --stage plan-slice` blocks if `Plan Slice` body section is missing/placeholder.
4. `stage close --stage plan-slice` blocks capability work without fresh concept-conformance review.
5. `stage close --stage plan-slice` blocks if plan lacks integration path for user-visible capability.
6. `stage close --stage plan-slice` blocks if AC-to-evidence matrix is absent.
7. `stage close --stage implementation` blocks if behavioral-demo evidence does not declare actual app entrypoint for UI/editor capability.
8. Testable anti-claim must be represented as negative AC or falsifier before spec close.
9. `stage close --stage implementation` either runs hygiene or clearly leaves lifecycle non-terminal and `next` reports hygiene only once.
10. Already hygiened closed work returns no hygiene next action.
11. Two concurrent mutating commands cannot both write the same artifact; one must wait or fail with lock-held output.
12. A mutating command writes via temp+rename and does not leave half-written Markdown after simulated crash.
13. Mutating command re-reads affected artifacts after acquiring lock.
14. `lint` or dedicated stage close check detects scaffold-only stage/spec/plan sections.
15. `capability check` distinguishes support evidence from actual live-app behavioral evidence.

## 9. Как это решает три упомянутые проблемы

### Проблема 1: качество спецификаций и планов упало

Решают:

- mandatory `Spec Compact` section;
- mandatory `Plan Slice` section;
- AC-to-evidence matrix;
- Integration Path;
- plan-slice concept-conformance review.

Это возвращает содержательность без возвращения тяжёлого старого workflow.

### Проблема 2: агент забывает финализировать стадии и lifecycle

Решают:

- объединение implementation close + hygiene или single terminal close path;
- final handoff rule: status/next must show terminal state;
- queue label fix;
- `next` hygiene bug fix.

### Проблема 3: фича закрывается, но не интегрирована в приложение

Решают:

- Integration Path в plan-slice;
- live-app behavioral evidence для user-visible capabilities;
- AC-to-evidence matrix;
- testable anti-claims as negative AC;
- concept-conformance before implementation.

## 10. Рекомендуемая итоговая позиция

Я бы не усложнял `dossier-engineer` новыми слоями и множеством новых артефактов. Текущая идея capability governance правильная. Проблема в том, что несколько gate-ов слишком декларативны и не привязаны к тому, что агент реально должен написать и доказать.

Лучший путь:

1. **Оставить один work item как главный stage contract.**
2. **Добавить в него две обязательные содержательные секции: `Spec Compact` и `Plan Slice`.**
3. **Сделать `queue` честным action queue, а не readiness queue.**
4. **Поставить concept-conformance перед implementation.**
5. **Потребовать production integration path для user-visible capabilities.**
6. **Сериализовать mutating runtime writes через ephemeral lock.**
7. **Сократить review шум через consolidated reviews.**

Это не возврат к тяжёлому старому процессу. Это более простая и более точная версия текущего процесса: меньше двусмысленности, меньше команд в конце, меньше race, больше инженерного смысла в spec/plan.

## 11. Приоритетная версия “минимального изменения”

Если выбрать только пять изменений, я бы выбрал эти:

1. **Single-writer lock + atomic writes** для mutating commands.
2. **Queue output: Actionable, not ready** с указанием next stage/action.
3. **Work item body blocks `Spec Compact` и `Plan Slice`**, проверяемые на stage close.
4. **Plan-slice requires concept-conformance review + Integration Path + AC-to-evidence matrix.**
5. **Implementation close automatically includes hygiene**, либо handoff запрещён без closed hygiene/status/queue verification.

Эти пять изменений закрывают большую часть наблюдаемых проблем и остаются достаточно простыми, чтобы агент мог им следовать.
