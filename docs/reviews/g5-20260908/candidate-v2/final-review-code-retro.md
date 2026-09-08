# G5: независимая оценка code-reviewer и retrospective-analysis

**code-reviewer — PASS. retrospective-analysis — FAIL: остаточный P2 RA-1 на targeted handoff.** Mode: `re-audit` исходных шести findings плюс `change` для прямо затронутых режимов, дедупликации инструкций, загрузки ссылок и maintenance boundary. Assurance: `independent`; reviewer не создавал и не исправлял кандидат. Ниже весь установленный материальный набор; новых P1 не установлено.

## Снимок и границы

Потребитель code-reviewer — maintainer, получающий воспроизводимые merge risks с калиброванной рекомендацией. Потребитель retrospective-analysis — оператор, получающий доказательный причинный разбор и, при отдельной полномочной передаче, остаточные действия. Оцениваются инструкции и наблюдаемые решения на заданных случаях; не production correctness, реальный tracker, native activation, универсальная надёжность или эффективность будущего процесса.

- Base: `504b87331f22b3a5303875bef69163a40d4372d7`; baseline report: `/home/kostysh/.codex/skills/custom/.worktrees/g5-methodology/docs/reviews/g5-20260908/baseline/baseline-review-retro.md`.
- Compiled: `/tmp/g5-evidence-8z1wlw3e/candidate-v2/skills`; identity `6ab6ffe4b3646630d01c775c629212fc6af57c7a4e6d5c64e18e305499f6ffbc`.
- Source: `/tmp/g5-evidence-8z1wlw3e/candidate-v2-source/skills`; identity `14e896ffa04c5641919487e370f0331bf2c3c94a4a88822a0deb277afdfece37`.
- Exact delta: `/tmp/g5-evidence-8z1wlw3e/candidate-v2-diff.patch`, только два назначенных пакета и непосредственные контракты соседей. Незатронутая ранее проверенная поверхность исключена; PRD/approval оценивает другой reviewer.
- Алгоритм: SHA-256 ordered compact JSON массива `path`/`sha256`; paths относительно соответствующего candidate root, включают `skills/`. Проверены identity и все 446 compiled / 88 source files; несовпадений и дополнительных файлов нет. Повторная проверка content hashes в конце: 0 несовпадений. Первая попытка ошибочно добавила второй `skills/` к пути и завершилась FileNotFoundError; исправленная read-only проверка выше успешна.

## Незакрытый finding

### RA-1-R — P2: targeted handoff всё ещё требует отсутствующий numbered plan

**Basis: direct/conflicting.** `retrospective-analysis/references/report-and-remediation-plan.md:8–13` разрешает targeted recommendation без numbered plan; `references/task-routing.md:10–15,31–33,59` допускает accepted residual actions и одну самостоятельную задачу. Но hard gate `task-routing.md:16` безусловно требует одобрения создания задач **from that plan**, а `:43–45` требует ссылки issue body на **authoritative report and exact plan step**. У targeted recommendation по контракту такого шага может не быть.

**Путь отказа:** оператор уже разрешил одну стабильную residual action A1 в точном tracker; источник, owner, acceptance и native rules доступны, numbered plan не запрошен → hard gate требует plan, которого легитимно нет, и output contract требует несуществующий exact step → ненужная остановка либо навязывание плана. Существующий mode-specific контекст позволяет исполнителю догадаться о замене на action, но не устраняет буквальное противоречие обязательного gate и выходного контракта.

**P1 screen:** подтверждён material false-block/расширение артефактов; не установлены опасная операция, ложная external closure или обход полномочий. Поэтому P2. Это продолжение исходного RA-1, а не отдельный декоративный терминологический finding.

**RCA и направление владельцу:** исходный full-plan объект сохранился в обязательных нижележащих clauses после введения action-or-step модели в верхней части. Проверить весь handoff от gate через task body и linkage до readback, затем последовательно использовать accepted action либо numbered step по выбранному режиму. Parent linkage в `:73–75` также читать/уточнить в пределах выбранной shape, чтобы исправление не сохранило другую утечку full hierarchy. Сохранить full-mode matrix, независимость, idempotency и explicit creation authority.

**Закрывающая проверка:** standalone targeted accepted action без numbered plan и parent, с уже данной точной authority, даёт одну source-linked задачу/подготовленную мутацию без нового plan gate; парные full случаи сохраняют matrix/independent PASS и запрет преждевременной записи. Проверять решения на синтетическом адаптере допустимо, не выдавая это за реальную интеграцию. Имеющиеся R1–R4 не выполняют этот переход: R4 только сверяет ранее созданный full snapshot.

## Исходные findings → delta → результат

| Finding | Проверенное исправление и evidence | Закрытие |
| --- | --- | --- |
| CR-1 | diff-completeness отделяет accepted behavioral correction от unrelated dependent contract. C3: E1 bounded approve, E2 limited с сохранённой проверкой missing. | Закрыт |
| CR-2 | policy-admission и methodology требуют owning contract/protected invariant; C4 B1 best-effort без invented blocker, B2 durable prerequisite с blocking finding. | Закрыт |
| CR-3 | Root, completeness, methodology, checklist и findings-format различают accounted/unread, сохраняют blocker при limited. C2 даёт off-by-one и явно исключает недоступный файл. | Закрыт |
| RA-1 | Targeted result больше не требует matrix/appendices; R1–R3 это подтверждают, full output сохранён. Но task-routing plan gate и exact-step output остаются без targeted варианта. | Частично; RA-1-R |
| RA-2 | Root portability checklist явно maintenance-only, ordinary retrospective не требует compiler/source repo. R1–R3 завершены без compile. | Закрыт |
| RA-3 | Actionable/navigation/total разделены; R4 N1=1/1/2 и N2=1/2/3 проходят, D/M отклонены. | Закрыт |

## Прямые регрессии, interop и проверки

code-reviewer: C1 сохраняет complexity-only, применимость base и безопасную identity simplification, без general merge verdict. Удалённый развёрнутый root checklist сопоставлен с четырьмя review lenses, methodology и conditional gate references: correctness/контракты, async/ресурсы, architecture/design, production data path, authorization fixtures и negative transitions, длительные соединения, required durability, rollout/rollback, performance/compatibility остаются достижимыми. Для high-risk root явно требует methodology; сокращение не отменяет substantive obligations. Read-only, snapshot invalidation, evidence footer и specialist limits сохранены. Приоритеты security-reviewer, spec-conformance-reviewer и implementation-discipline не присвоены generic reviewer.

retrospective-analysis: evidence/causality оставляет причинные unknowns, primary-artifact verification, historical fix отдельно от prevention/effectiveness и дедупликацию по cause/control. Full mode сохраняет disposition всех наблюдений и failed audits, machine matrix, reconciliation, independent completeness и запрет тихого перехода в targeted. Это проверка инструкций, не исполнение целого full-retro. delivery-planner по-прежнему владеет task decomposition/readiness, retrospective — recommendation mapping, tracker owner — внешней записью/readback. Остаточный конфликт находится внутри handoff retro, а не требует изменения соседнего владельца.

Source/package readback: direct parity references/assets/agents — 14 файлов code-reviewer и 4 retro, 0 различий; code overview fragment целиком включён в compiled root. Прочитаны source maintenance AGENTS, exact diff, emitted roots, изменённые и необходимые прямые references, code template-test и packaging evidence. Compiler check/compile exit 0 переиспользованы из журнала и `candidate-packaging.txt`; собственная генерация/установка не выполнялась. Обязательный test:ci 108/108 — наблюдение автора с указанными session/chunk IDs в журнале, не повторный запуск reviewer. Изменённый structural test сохраняет template checks и сравнивает source-version с generated metadata; не является behavioral acceptance.

`quick_validate.py` для retro **exit 1**, не green: whitelist отвергает прежний `compatibility`, допускаемый стандартом и compiler. Это непригодность дополнительного check для заявленного metadata contract, не новый parity defect и не причина делать обязательный метод зависимым от runtime. Формальный FAIL выше вызван RA-1-R.

## Поведенческие свидетельства и пределы

Использованы фиксированные `assessor-criteria.md`, `case-inputs.md` и полные raw outputs `/tmp/g5-evidence-8z1wlw3e/runs/candidate-code-trials.md`, `candidate-retro-trials.md`. Assessor не автор candidate; знает критерии/исходные findings. C1/C2/C3/C4 и R1/R2/R3/R4 по закрытым критериям — **PASS**. R4 исправляет наблюдавшийся baseline false-block N1/N2; остальные успешные baseline samples не опровергали source contradictions и потому не объявляются новым улучшением поведения только по сравнению ответов.

Исполнители не видели diagnosis/rubric/candidate diff; code executor увидел весь raw case-inputs вместо только C-сценариев, retro — дополнительный заголовок S. Это ограниченная изоляция на общем filesystem, не hard sandbox. Несколько случаев выполнялись в одном свежем контексте; результаты синтетические, реальные runtime/tests/tracker приняты только как условия. Независимая runtime metadata модели и полная внешняя телеметрия недоступны; отсутствие запрещённых действий не доказывается одним итоговым текстом. Exposure не содержит ключа ответов, поэтому samples пригодны для bounded decisions, но не доказывают universal blind generalization. Targeted handoff и отказ full gate отдельно не исполнены; это названный evidence limit, а не доказательство отсутствия поведения.

[GPT-6 Astra prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) проверено онлайн: релевантны чувствительность к skill instructions, ненужные остановки, ясность, delegation policy и пропорциональная проверка. Гайд поддерживает проверку противоречий и существующей authority, но примеры не отменяют локальные gates. Дополнительные runtime и повтор полного CI ради этого review не нужны.

Следующий владелец — автор G5: RCA/ограниченное исправление RA-1-R, новый стабильный снимок и независимый bounded re-audit только изменённого handoff и его соседних gates. PASS code-reviewer сохраняется только для его неизменной проверенной поверхности; общий G5 PASS этот отчёт не предоставляет. Reviewer записал только этот отчёт, навыки не изменял.
