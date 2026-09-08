# G5-v1 — журнал улучшения четырёх методологических скиллов

## Основание, границы и состояние

Оператор принял G5-v1 и поручил улучшить `prd-engineer`, `requirements-approval`, `code-reviewer`, `retrospective-analysis`. Результат — корректное поведение скиллов и пригодные межскилловые передачи; журнал и компиляция служат свидетельствами, но не доказывают поведение. Отдельный issue не требуется: основание — прямое задание и принятый план в беседе от 2026-09-08.

Scope delta: `unchanged`. Unauthorized additions: `none`. Активные инструкции — English; рабочие записи — русский. Соседние скиллы проверяются только на прямых стыках. Коммит, push и merge не разрешены. На прямой вопрос о независимых ревьюерах и baseline/candidate исполнителях для G5-v1 оператор ответил «Продолжай» 2026-09-08; это разрешение используется в пределах данной группы.

База: `504b87331f22b3a5303875bef69163a40d4372d7`, исходный `master` чист, `origin/master` по локальному tracking совпадает; свежая удалённая проверка не выполнялась. Worktree: `.worktrees/g5-methodology`, ветка `codex/g5-methodology`, создан до изменений. Соседние worktree не изменялись.

## Источники и метод

- [Стандарт скиллов](skill-standard.md), корневой `AGENTS.md`, принятый G5-v1 и контракт контрольных точек глобального `/plan`.
- `skill-reviewer`: методология, независимость, приоритет вердиктов, слепые поведенческие испытания.
- `skill-creator`, `skill-source-compiler`, `implementation-discipline`: исходники прежде генерации, минимальные исправления, авторская проверка.
- [GPT-6 Astra — Prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices), прочитано 2026-09-08. Применимые разделы: Initiative and follow-through; Instruction following; Personality and writing style; Subagent delegation; Testing and verification. Проверяются повторные разрешения, необоснованные остановки, конфликтующие инструкции, ясность, полномочия делегирования и соразмерность проверок. Примеры гайда не предоставляют разрешений и не отменяют обязательные ограничения.

## Подготовка и предварительные наблюдения

Все четыре исходных пакета прошли compiler `check`: [полный вывод](reviews/g5-20260908/baseline-structural.txt). Это структурная проверка, не независимый вердикт.

Предварительные направления исследования, ещё не формальные findings:

| Скилл | Наблюдение и проверяемый риск |
| --- | --- |
| prd-engineer | Безусловный этап полного сопоставления source atoms может противоречить лёгкому draft-only режиму; reference ограничивает эту проверку утверждением о полноте. Проверить достаточный короткий запрос и строгий handoff отдельно. |
| requirements-approval | Безусловные runtime/environment шаги могут блокировать подготовку вопроса о предпочтении заказчика. Проверить применимость, отсутствие runtime и сохранение полезной подготовки. |
| code-reviewer | Корень требует full-diff merge-risk workflow для каждого review, а complexity-only reference задаёт узкий режим. Проверить маршрутизацию, полезные локальные findings при неполном общем охвате и предел рекомендации. |
| retrospective-analysis | Targeted режим обещает отсутствие общего реестра и иерархии, но report/task-routing guidance предписывает матрицу и parent/children. Проверить небольшой завершённый инцидент и разделение анализа, плана и внешнего действия. |

До изменения активных инструкций зафиксированы [сырьевые задания](reviews/g5-20260908/case-inputs.md) и отдельные [критерии оценщика](reviews/g5-20260908/assessor-criteria.md). Исполнителям передаются только назначенный случай, необходимые данные и соответствующий пакет; критерии, этот журнал и диагнозы им не передаются. Свежий контекст сам по себе не доказывает изоляцию: фактическая экспозиция будет записана по каждому запуску.

## Исправления и свидетельства

Независимый baseline: [prd-engineer / requirements-approval](reviews/g5-20260908/baseline/baseline-product-review.md), [code-reviewer / retrospective-analysis](reviews/g5-20260908/baseline/baseline-review-retro.md). По каждому скиллу `FAIL`, всего восемь P2; P1 не установлен. Ревьюеры не исправляли источники. Их verdict относится к исходному снимку, не к кандидату.

| Finding → путь отказа | Исправление в источниках | Закрывающая проверка |
| --- | --- | --- |
| PRD-BASE-1: недоступный обязательный сосед блокирует переносимый PRD | Явный локальный метод и предел недоступной зависимости; обратная передача от requirements-approval сохраняет authority PRD | P1/P2/P3, аудит межскиллового контракта |
| RA-BASE-1: compiler требуется для обычного approval draft | Все portability checks явно maintenance-only; успешность подготовки отделена от closure | A1/A2/F, чтение пакета без compiler |
| CR-1: accepted behavioral fix расширяет переаудит | Widening ограничено выходом за принятый remediation scope и зависимыми контрактами | C3: E1 bounded, E2 требует решения о scope |
| CR-2: audit sink навязывает новый fail-closed контракт | Prerequisite определяется owning contract/invariant; observational sink не меняет admission | C4: B1 без вымышленного blocker, B2 с настоящим blocker |
| CR-3: недоступный файл скрывает подтверждённый дефект | Accounted и inspected различены во всех прямых инструкциях; partial findings сохраняются под limited | C2 плюс запрет clean approval при неполном scope |
| Retro RA-1: full output/gates попадают в targeted | Общий mode/output contract, условные matrix/independence/plan и native task shape | R1/R2/R3, targeted handoff и сохранение full gates |
| Retro RA-2: обычное ретро компилирует собственный пакет | Maintenance-only checklist; локальная causal/evidence методика не требует compiler | R1/R3 и readback emitted package |
| Retro RA-3: parent + N children должны иметь total N | Navigation и actionable учитываются отдельно; full total N+1, дубликаты и пропуски остаются дефектом | R4: N1/N2 проходят, D/M отклоняются |

Прямые уточнения рядом с исправлениями: conditional references классифицированы required с прежними условиями загрузки; сохранены draft и complexity-only сценарии; проверки runtime/environment при согласовании ограничены вопросами, которые они могут разрешить. Это не новые runtime или продуктовые требования. Content versions: PRD 0.1.8, approval 0.2.3, code-reviewer 0.4.6, retro 0.1.1. Пакетная версия code-reviewer не меняется; существующий structural test сверяет версию источника с generated metadata вместо жёсткой привязки к старому номеру.

### Поведенческий baseline

Сохранены полные ответы отдельных свежих исполнителей: [P1/P2](reviews/g5-20260908/baseline/baseline-prd-trial.md), [P3](reviews/g5-20260908/baseline/baseline-prd-standalone.md), [A1/A2/F](reviews/g5-20260908/baseline/baseline-approval-trial.md), [C1/C2](reviews/g5-20260908/baseline/baseline-code-trial.md), [C3/C4](reviews/g5-20260908/baseline/baseline-code-extended.md), [R1/R2](reviews/g5-20260908/baseline/baseline-retro-trial.md), [R3/R4](reviews/g5-20260908/baseline/baseline-retro-extended.md), [выбор каталога](reviews/g5-20260908/baseline/baseline-selection.md). Все критерии кроме R4 выполнены в этих выборочных случаях; R4 воспроизвёл отказ в полном count PASS для корректных N1/N2 из-за противоречия N versus N+1. Успешное исполнение не отменяет установленные source-contract defects.

Снимок baseline: `bb7039d80648b4e9ddb2052f71b4c1f14355ee4c562da1e98dd2e3946de8a618`, алгоритм и 471 path/hash — [manifest](reviews/g5-20260908/baseline/files.json). После прогонов несовпадений hash нет. Ассессор — основной агент, знающий критерии и будущие исправления; это не независимая приёмка кандидата. Исполнители не получали findings, критерии, журнал или candidate. Несколько самостоятельных случаев одного скилла выполнялись в одном свежем контексте; они не изолированы друг от друга. F — статический replay, не live delivery. Каталог проверялся отдельно до чтения тел скиллов; native activation не заявлена. Baseline agents использовали унаследованные настройки родительского агента без model override; независимая runtime metadata в ответе collaboration API отсутствует. Проверены сохранённые ответы и неизменность снимка; полная внешняя телеметрия действий недоступна.

### Авторская проверка перед генерацией

`ready-to-regenerate` для четырёх пакетов. Проверены outcome/consumer, достаточные входы, полномочия, корректный частичный результат, один источник решения на исправляемой границе, явные conditional load triggers, доступность declared files, переносимость локального метода и пределы внешних зависимостей. Исправления направлены на восемь путей отказа, без нового runtime/harness. Проверены исходные положительные и отрицательные случаи; критерии v2 зафиксированы до правок. Это авторская готовность, не independent PASS.

Source lint: [4/4 OK](reviews/g5-20260908/candidate-lint.txt). Generated parity, candidate execution и независимый re-audit ещё предстоят.

### Среда проверок

В песочнице даже `pnpm --version` завершался `unable to open database file`; вне неё получена версия `10.28.2`. Это препятствие доступа к среде pnpm, не ошибка скиллов. Независимый baseline reviewer также зафиксировал неуспешную попытку pnpm до теста и затем 1/1 structural test через объявленную Node-команду; snapshot остался неизменным. Повторные проверки выполняются с разрешённым доступом к среде и ограниченными ресурсами.

### Стабильный кандидат и локальные проверки

После source-first регенерации четыре compiler `check` и четыре независимые `compile` завершились exit 0: [packaging](reviews/g5-20260908/candidate-packaging.txt). Candidate-v2 compiled identity `6ab6ffe4b3646630d01c775c629212fc6af57c7a4e6d5c64e18e305499f6ffbc` (446 файлов, включая неизменных соседей); source identity `14e896ffa04c5641919487e370f0331bf2c3c94a4a88822a0deb277afdfece37` (88 файлов четырёх исходных пакетов). После фиксации активные инструкции не меняются во время испытаний и review.

Дополнительный `quick_validate.py`: PRD, approval, code — exit 0; retro — exit 1 из-за `compatibility`, уже присутствовавшего в baseline. Это ограничение whitelist системного валидатора, не новая ошибка generated parity; стандарт репозитория допускает дополнительные metadata, compiler принимает пакет. [Полный диагностический вывод](reviews/g5-20260908/candidate-packaging-diagnostic.txt). Этот check не объявляется пройденным. Advisory approval size: 15002 bytes при рекомендации 15000; лимит не повышался. Удалена дублирующая формулировка там, где canonical workflow уже задаёт тот же контракт; финальный reviewer проверяет сохранение обязательств.

Первый общий packaging script остановился на assertion без вывода подкоманды, а внешняя shell-группа завершилась 0: это не успешная проверка. Диагностика сохранила реальные exit codes; повторное compile в частично заполненный v1 подтверждает запрет перезаписи существующего target. Использован новый независимый v2 root, частичный v1 сохранён. Отдельно выявлено описанное ограничение quick_validate.

`pnpm install --frozen-lockfile` выполнен с разрешённым доступом; lockfile не изменён. Обязательный `env npm_config_workspace_concurrency=1 nice -n 10 pnpm test:ci` завершился exit 0: 108/108 тестов (code-reviewer 1, hono 18, security 24, compiler 44, typescript-test-engineer 21). Наблюдаемый unified-exec session 9450, начальный output chunk 8192df, финальный ee455c; полный stdout сохранён в сообщениях запуска, отдельного raw-файла нет. Позднейшее сокращение одной повторяющейся prose-строки approval проверено повторными regeneration/check/compile; оснований повторять весь CI нет. Compiler build не изменил файлы вне четырёх целевых пакетов.

Descriptions/names всех четырёх скиллов неизменны: [catalog parity](reviews/g5-20260908/catalog-parity.json). Выбор каталога использует прежнее релевантное baseline evidence; новый execution не выдаётся за native activation.

### Повтор исходного RA-1: RCA до следующего исправления

Независимый reviewer обнаружил на стабильном v2 остаточный P2 в `references/task-routing.md`: targeted action разрешён без numbered plan, но hard gate 4 и issue-body contract требуют «that plan»/«exact plan step». Смежный путь mutation/readback/final reconciliation всё ещё безусловно упоминает parent и step IDs. Пока source contradiction остаётся, хороший отдельный trial не закрывает finding.

До изменения повторно прочитаны весь исходный workflow/root, mode/output contract, рекомендации/план и полный путь task-routing: gates → shape → source link → enumeration/idempotency → create/readback → reconciliation. Причина неполного исправления: разделение режимов было проведено в выбор режима, матрицу и counts, но не во все потребляющие пункты handoff. Ранние R1/R3 проверяли анализ/рекомендацию, R4 — full reconciliation; они не опровергали навязывание плана при targeted action handoff.

Disposition: `rule` — согласовать action-or-step и conditional parent по всему bounded handoff; `test` — дополнительные J2/J3 с критериями до этого исправления проверяют достаточный targeted и сохранённый full audit gate; `owner` — автор этого изменения, независимый reviewer проверяет closure; `scope` — только исходный RA-1 и его прямые последствия, соседние скиллы не меняются. Никакого смягчения full-mode audit, creation permission, idempotency или readback не разрешено. Candidate-v2 остаётся неизменным для текущего review; следующий снимок будет отдельным.

### Итог v2 и ограниченное исправление v3

На v2: independent [PRD/approval PASS](reviews/g5-20260908/candidate-v2/final-review-product.md); [code-reviewer PASS, retro FAIL](reviews/g5-20260908/candidate-v2/final-review-code-retro.md). Единственное оставшееся material finding — RA-1-R, без нового P1. Авторская [оценка trial outputs](reviews/g5-20260908/candidate-v2/assessment.md) отдельно от independent verdicts.

[J1/J2/J3 raw execution](reviews/g5-20260908/candidate-v2/joint-execution.md) выполнен fresh `g5_joint_execution`, explicit Astra/nofork, без критериев/диагнозов; exposure сохранена в ответе. J1 потребил реальный output A2, сохранил Q-17 authority/trace и Q-18 open, draft-only/non-authoritative и workflow partial. J2 подготовил 0/1/1 standalone action без повторного permission/плана. J3 сохранил missing independent PASS как blocker full creation. Все три удовлетворяют supplemental criteria; это preflight и consumer output, не actual tracker integration. Успех J2 на v2 не отменяет literal RA-1-R.

После RCA обновлён только `retrospective-analysis/references/task-routing.md`: exact accepted action либо numbered step в creation authority и ссылке на источник; parent linkage/readback выбирается по shape; final reconciliation использует action/step ID и точный источник. Full-mode audit/matrix, task authority, idempotency и N+1 не ослаблены. Author self-check: весь путь gates → body → enumerate → create → readback → final reconciliation согласован с mode/output; source ownership сохранён, дополнительные понятия не введены. Версия 0.1.1 остаётся версией одной ещё не опубликованной правки; содержимое различают exact source hashes.

[Lint/check/compile v3](reviews/g5-20260908/candidate-v3-packaging.txt) — exit 0. Новый compiled snapshot `a2c5e282964bdec51b82e628856c8debf8d71c78d6502df69f2d3af5bfbd92e2`, source `b6c5a954d17876706999202bf85d107231983939c41b007cedf0a0e0b78f6dae`; [manifest/delta](reviews/g5-20260908/candidate-v3/candidate-v3-delta.patch). Остальные три пакета и их direct-contract verdicts неизменны. Для prose-only bounded correction повторяется J2/J3 и RA-1-R audit, общий CI не повторяется без нового runtime/test изменения.

## Итоговая контрольная точка G5-v1

Все четыре скилла улучшены и получили независимый PASS. Исходные восемь P2 закрыты; остаточный RA-1 после первого candidate audit устранён через полный RCA затронутого пути и bounded v3 re-audit.

| Скилл | Итог и граница verdict |
| --- | --- |
| prd-engineer | [PASS independent, включая J1 addendum](reviews/g5-20260908/final/final-review-product.md); v2 content сохранён в final v3 |
| requirements-approval | [PASS independent](reviews/g5-20260908/final/final-review-product.md); v2 content сохранён в final v3 |
| code-reviewer | [PASS independent](reviews/g5-20260908/final/final-review-code-retro.md); v2 content сохранён в final v3 |
| retrospective-analysis | [PASS independent v3](reviews/g5-20260908/final/final-review-retro-v3.md); RA-1-R закрыт, остальные v2 findings/gates переиспользованы |

[Fresh v3 J2/J3 raw](reviews/g5-20260908/final/joint-retro-v3.md) — PASS по неизменным supplemental критериям, независимо оценён reviewer. Provenance добавлен к raw после исполнения, без изменения ответов и без повторного запуска. Фактическая v2→v3 delta по manifest — только task-routing.md; повторная генерация сохранила root/report побайтово. [Финальный readback](reviews/g5-20260908/final/snapshot-readback.json): все 4 frozen sets без hash/file-set расхождений; 88 source files final worktree совпадают с v3. Ссылки четырёх docs/README доступны; `git diff --check` прошёл. [Evidence inventory](reviews/g5-20260908/evidence-files.json) фиксирует durable raw outputs, manifests и reports; документы после сохранения verdict не меняют active surface.

**Capability:** агент выполняет достаточные короткие PRD/approval/review/targeted-retro задачи, сохраняет полномочия и полезные partial outputs, корректно передаёт решение approval в PRD и различает targeted/full handoff. Это наблюдалось на зафиксированных синтетических случаях, source/package inspection и independent assessments.

**Substrate:** source-first изменения и generated packages четырёх скиллов, общий журнал, raw evidence, manifests и review reports. Никакого нового runtime или постоянного test harness не добавлено.

**Anti-claims / not accepted:** универсальная надёжность, естественная активация во всех hosts, реальная email/GitHub/tracker интеграция, продуктовый runtime и доказанное будущее предотвращение не проверены. Ни публикация, ни установка worktree-версий в основной checkout, ни пользовательская приёмка не произошли. Дополнительный quick_validate retro остался exit 1 на прежнем compatibility; compiler/standard допускают этот контракт, independent reviewer признал границу применимости. Advisory approval размера +2 bytes сохранён. Baseline inherited model и candidate assigned Astra не выдаются за независимо наблюдённую runtime metadata; sample exposure limits записаны выше.

**accepted now:** представлено к приёмке локальное улучшение ровно четырёх скиллов по G5-v1 с individual independent PASS и указанными пределами. Это не утверждение, что оператор уже принял результат.

**blocking decision:** технических blockers нет; далее требуется операторская приёмка по принятой финальной контрольной точке. **next autonomous action:** none до явного решения оператора. Commit/push/merge требуют отдельного разрешения.

**Ключевые решения:** 1) maintenance checks отделены от ordinary skill execution — достаточные задачи не блокируются отсутствием compiler, качество пакетов проверяется при обслуживании; 2) partial review и accepted correction сохраняют установленный scope — меньше ложных остановок без clean approval непроверенного; 3) targeted action и full numbered plan протянуты через весь handoff — standalone задача допустима, full audit и mutation authority сохранены; 4) несовместимый дополнительный валидатор не меняет разрешённую metadata и не выдаётся за PASS — переносимость ограничена реальной применимостью проверки. Не расширены границы соседних скиллов или публикации.

**Отклонения:** scope `unchanged` относительно принятого G5-v1, Unauthorized additions: none. Уточнены handoff cases после обнаруженного RA-1-R; критерии закреплены до второго исправления, новые случаи не выданы за старое baseline comparison. Общий CI не повторялся после prose-only delta по отсутствию нового runtime риска. Новых открытых продуктовых решений нет.

### Recovery ledger

Snapshot: 2026-09-08 18:43:08 UTC. Task/source: принятый G5-v1, корневой AGENTS.md, docs/skill-standard.md, global PLANS.md checkpoint contract. Workspace `/home/kostysh/.codex/skills/custom/.worktrees/g5-methodology`, branch `codex/g5-methodology`; HEAD/base `504b87331f22b3a5303875bef69163a40d4372d7`. Ветка без собственного upstream; против локального origin/master ahead/behind `0/0`, remote freshness не заявлена. Основной checkout `master` чист. В worktree 29 tracked modified files, staged 0; untracked — общий implementation log и каталог G5 evidence. Не сделаны commit/push/PR/merge, внешний CI не запускался; локальный test:ci 108/108 PASS с указанными session/chunk IDs. Последняя принятая оператором точка — G5-v1 implementation authority и разрешение independent agents («Продолжай»); текущая финальная точка ещё ожидает приёмки. Resume: проверить HEAD/status и source hashes только на этих поверхностях; до нового указания мутаций нет.

Stop: awaiting explicit approval to continue
Next autonomous action: none

## Приёмка оператором

2026-09-08 18:47:59 UTC — оператор: «принимаю. продолжай». Итог G5-v1 принят. Перед продолжением проверены HEAD `504b87331f22b3a5303875bef69163a40d4372d7`, отсутствие staged changes и совпадение всех 88 source files с принятой identity `b6c5a954d17876706999202bf85d107231983939c41b007cedf0a0e0b78f6dae`. Активные инструкции не менялись; эта запись — административное обновление после приёмки, не новая версия reviewed skill surface.

Принятый план отдельно требует разрешения на commit/push/merge. Следующий предлагаемый переход — публикация принятых изменений через task branch `codex/g5-methodology` и PR в `kostysh/skills:master`, проверки CI и merge; Git mutations пока не выполнены. Требуется конкретизировать полномочия этого перехода, а не повторно принимать реализацию.

## Разрешение публикации

Оператор подтвердил: «да, продолжай как описал» — разрешены commits, push `codex/g5-methodology`, PR в `kostysh/skills:master`, ожидание CI, merge, проверка CI точной merged revision и удаление рабочей ветки/worktree. Финальная приёмка завершена; прежние записи об ожидании — исторические. Публикуется принятый source snapshot, активные инструкции не меняются. История сохраняется отдельными commit по четырём скиллам и общим evidence commit; merge-коммит следует существующей истории репозитория. Результат публикации и CI будет доступен через PR и итоговый ответ, без дополнительного post-merge docs-only commit.

Проверка публикационного diff: общий `git diff --check` обнаружил 211 строк с одиночным пробелом только внутри двух сохранённых `.patch` — обязательный prefix пустой context-line формата unified diff. Каждая диагностированная строка проверена; содержимое raw evidence не нормализовалось. Проверка всех остальных source/docs paths прошла. Первый staged check сообщил это после подготовки evidence; локальный evidence commit был создан до разбора предупреждений. Причина разобрана до push, исключение ограничено этими двумя patch-файлами.
