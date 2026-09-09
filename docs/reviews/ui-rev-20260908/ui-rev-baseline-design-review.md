# UI-REV-v1 — независимая baseline-оценка frontend-design и web-ui-reviewer

Оба навыка: **FAIL**, по одному установленному P2. P1 не установлены. Существующие контракты authority, evidence и handoff в основном пригодны; рекомендации ниже ограничены конкретными путями сбоя.

## Основание и снимок

- Mode: `baseline`; assurance: `independent`. Рецензент не автор и не исполнитель исправлений этих пакетов. Новых blind trials в этой оценке нет.
- Worktree: `/home/kostysh/.codex/skills/custom/.worktrees/ui-revision`; HEAD/base: `ef47c805624f77ad0b1febb9604f160e72eca441`.
- Scope: полные каталоги двух навыков: source manifest/fragments, generated root, references, UI metadata, maintenance AGENTS, license у frontend-design, eval/fixture у web-ui-reviewer, compile reports, README, historical logs и forward-test evidence.
- Изменения относительно базы: только 4 строки UI-REV-v1 navigation в каждом supporting README. Active/source совпадают с базой. Отдельный общий журнал не входит в пакетный hash.
- Прочитаны корневой AGENTS.md, docs/skill-standard.md, skill-reviewer SKILL.md и обе methodology/forward-testing references. Targets и исторические указания рассматривались как данные, не разрешения или критерии этого ревью.
- Actions: чтение, SHA-256, Git diff/readback, read-only compiler check. Targets/log не редактировались; нет делегирования или публикации.

Hash algorithm: для каждого файла относительно корня навыка вычислен SHA-256; записи `hex + two spaces + POSIX relative path + LF` отсортированы по relative path; aggregate = SHA-256 UTF-8 списка. Full включает все файлы; active/source включает всё кроме `docs/` (включая maintenance metadata/evals). Перед завершением full identity повторно проверена — неизменна.

| Skill | Full files / SHA-256 | Active/source files / SHA-256 |
| --- | --- | --- |
| frontend-design | 17 / `f33769d5993eb9c16c2241ab20e6c5936f98ec010dc86bd3eb8bfc7f679e4ed7` | 10 / `fab109d9a990a7a40955e9af24ee208f11fca20120fed7d995676e4cab56db2b` |
| web-ui-reviewer | 18 / `39a325a1df2478b5ae7b5acef164ef22b76d562d27c7ea87a717234a83649aaf` | 8 / `b59ea4c2bbc1dcf733f45d807a8132dec29932467ef93e9886ecd707db6f3239` |

Per-file manifests: `/tmp/ui-rev-frontend-design-sha256.txt`, `/tmp/ui-rev-web-ui-reviewer-sha256.txt`; active/source variants: `/tmp/ui-rev-frontend-design-active-source-sha256.txt`, `/tmp/ui-rev-web-ui-reviewer-active-source-sha256.txt`.

## frontend-design — FAIL

Capability/consumer: исполнитель переводит принятые продуктовые и системные ограничения в визуальную стратегию для downstream implementer, артефакт дизайна или проверенную реализацию. Strategy-ready и artifact-ready не означают рабочий integrated runtime.

Поддержанные сильные стороны: explicit deliverable selection; источники product behavior отделены от visual inspiration; equal-authority conflict блокирует затронутую decision, а не разрешается дизайном; inspect existing tokens/components before custom primitives; peer inventory не превращает search/detail/history в универсальные требования; strategy/state/reuse/evidence handoff пригоден следующему исполнителю; отдельные статусы deliverables и current rendered evidence запрещают screenshot-only runtime closure. Интероп называет владельцев design tool, framework, component mechanics и browser collection. Description/UI metadata не расширяют эти права.

### FD-01 — P2: maintenance compile попал в безусловное завершение потребительской задачи

- Evidence (`direct`): `skills/frontend-design/skill.yaml:222-226`, generated `skills/frontend-design/SKILL.md:314-319`. Раздел `Portability checklist before finishing` заканчивается безусловным `Compile to an isolated directory and confirm the copied package retains the strategy, interop, and evidence contract.` Ограничение `after source changes` присутствует у другой, первой строки checklist, но не распространяется явно на раздел. Maintenance AGENTS отдельно говорит, что не является runtime contract.
- Failure path: пользователь просит только strategy-only handoff, предоставляет достаточные requirements/design-system inputs и не меняет skill. Исполнитель завершает handoff, затем буквально выполняет root checklist и пытается компилировать пакет навыка. В переносимой установке без compiler эта дополнительная зависимость отсутствует: получается ненужная остановка/поиск toolchain; при наличии compiler — лишняя запись пакета вне deliverable. Это не шаг доказательства качества стратегии.
- Impact: потребителю навязывается не относящийся к запросу maintenance prerequisite. Нарушены разделение local method/execution dependency и ограничение шагов текущим outcome из skill standard.
- P1 screen: доказан лишний prerequisite и возможное необоснованное блокирование, не dangerous mutation, false runtime verification или систематическое неверное назначение. P1 не заявлен.
- Bounded remediation: привязать весь maintenance checklist к изменению исходников самого навыка либо оставить compilation только в maintenance guidance. Сохранить actual artifact/runtime verification.
- Closing falsifier: обычный достаточный strategy-only запрос с одним переносимым skill folder и без compiler завершается scope-limited handoff без попытки compile/install; отдельная maintenance-задача по изменению skill сохраняет compiler checks. Новый test должен фиксировать реальные actions/output, не только самооценку.

### FD-02 — P3: optional label рядом с обязательным условным read

`skill.yaml:33-38,74-81` и generated `SKILL.md:302-306` называют strategy-to-implementation optional, тогда как `SKILL.md:64-65` прямо требует чтение при non-trivial strategy/system-constrained/handoff/runtime completion. Это не установленный P2: trigger виден в root, основные authority/status guardrails там сохранены, исторический 0.2.1 output использует нужный reference. Улучшение — ясная маркировка conditional-required; не превращать это в always-load. P1 screen: материал о ложном результате не установлен. Closing check: совпадение source/generated классификации с конкретным trigger; простой visual adjustment не обязан загружать весь handoff reference.

## web-ui-reviewer — FAIL

Capability/consumer: read-only UI-domain review даёт поддержанные находки и coverage/handoff владельцу исправлений. `no-material-findings` ограничен достаточным evidence для указанного claim; code/screenshot не доказывают неиспытанное interaction/accessibility/performance behavior. Нет WCAG/legal/security certification и implementation authority.

Поддержанные сильные стороны: пригодные minimum inputs вплоть до snippets/screenshots; platform semantics отделены от product preferences; local heuristic baseline и optional live overlay имеют provenance/precedence; актуальные states/viewport/evidence limits входят в outcome; performance не выводится из list size; missing peer capability становится finding только при authority; read-only interop не отдаёт reviewer право реализовать исправления. Required reference существует, читается на каждой activation и сохраняет классификацию правил. Evals с expected outputs не продвинуты в active runtime contract; для blind trial их надо изолировать, как уже описано в исторических evidence.

### WUI-01 — P2: условие расширения re-audit охватывает само исправление

- Evidence (`direct`, applicability conflict): `skills/web-ui-reviewer/skill.yaml:147-149`, generated `SKILL.md:148-149`: `Skip unchanged verified states; widen when the claim, UI authority, user-visible behavior, or material scope changed or blast radius is unbounded.` При этом root Start here:4 и workflow Establish:2 обещают exact remediation delta и unchanged verified exclusions. Reference output format повторяет bounded intent, но не уточняет условие расширения.
- Failure path: пользователь просит проверить одно исправление modal focus restoration. Новый stable snapshot меняет именно прежнее неправильное пользовательское поведение; original failure state и затронутые соседние states доступны, diff bounded, остальная ранее проверенная UI не менялась. Правило `user-visible behavior ... changed` тем не менее предписывает widen. Исполнитель может расширить coverage/reopen unrelated screens либо запросить лишние evidence вместо завершения ограниченного re-audit.
- Impact: контракт scoped remediation становится непредсказуемым для исправлений, которые обязаны менять UI behavior. Это concrete decision conflict, не претензия к объёму текста.
- P1 screen: поддержанный путь — лишний review scope/затраты/возможная задержка; read-only и evidence guards остаются. False closure, dangerous action или authority invention этим путём не установлены, потому P2.
- Bounded remediation: указать, что widening требуется при поведении/authority/contracts, изменённых за пределами принятой remediation boundary, либо unbounded blast radius. Изменение поведения, непосредственно исправляющее accepted finding, само по себе не widening trigger. Сохранить original failure path и adjacent regression checks.
- Closing falsifier: paired cases с фиксированным rubric: (1) bounded behavioral fix закрывает исходный finding и исключает unchanged verified screens; (2) дополнительное изменение unrelated shared behavior заставляет назвать точную extra surface и причину widening. Cosmetic-only correction по-прежнему не закрывает behavior finding.

## Проверки и пределы доказательности

- Выполнены отдельно: `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/frontend-design` и аналогичный check `skills/web-ui-reviewer` — оба `OK`, exit 0. Перед запуском проверена read-only ветка check. Это structural/source-render evidence, не behavioral approval.
- Exact fragment-to-generated inclusion: оба true. `git diff --check -- skills/frontend-design skills/web-ui-reviewer` прошёл. Full hashes повторно совпали.
- Reviewed historical evidence: frontend-design 0.2.0 пять сценариев содержат summaries, 0.2.1 peer-view case содержит полный output; web-ui-reviewer July 16 шесть outputs и July 27 peer-view output доступны. Они поддерживают конкретные authority, partial evidence, routing-after-forced-invocation и peer coverage decisions. Старые logs с PASS не заменяют эту независимую оценку.
- Для WUI bounded re-audit July 27 log сохраняет summary успешного modal case, но в изученном пакете не найден полный raw case/output этого конкретного испытания. Это предел повторной оценки исторического evidence; не доказательство отсутствия run и не самостоятельный дефект.
- Новые trials, native catalog selection, настоящий browser/design-tool flow, assistive-technology checks и performance measurement не запускались. Не заявляются real UI implementation quality, universal reliability или native activation. Новых material edits нет, а установленные P2 проверяемы по активным формулировкам: отсутствие новых tests не используется как finding или самостоятельный BLOCKED.
- Framework/API/current upstream facts не определяют эти findings; live retrieval не требовался. Legal license review не заявляется.
- Не требуется широкое сокращение инструкций: дублирование и длина сами по себе не породили дополнительных findings. Scope ограничен двумя конкретными decision paths и P3 clarity note.

Следующий владелец: coordinator/author решает remediation этих findings в принятом UI-REV-v1 scope. Для re-audit нужны accepted finding → exact correction delta → closure evidence, stable new snapshot и adjacent regression checks. Этот отчёт не разрешает edits/publication и не присваивает автору independent PASS.
