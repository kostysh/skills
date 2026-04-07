# Лог имплементации 2 `@kostysh/backlog-engineer-cli`

Этот файл продолжает основной лог из [implementation-log-1.ru.md](implementation-log-1.ru.md) и фиксирует отдельный follow-up цикл после завершения базовой имплементации.

Документ ведётся инкрементально во время реализации follow-up плана из [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md).

## Правила ведения лога

- Одна завершённая запись соответствует одному завершённому пакету follow-up изменений.
- Запись добавляется до коммита пакета и обновляется после внешнего ревью.
- В логе фиксируются только факты и принятые решения, которые важны для следующих пакетов.
- Любое решение или допущение за пределами текущей концепции, спецификаций и утверждённых контрактов фиксируется отдельной явной пометкой.
- Лог не заменяет git history, а дополняет её инженерным контекстом.
- Для каждого follow-up пакета в записи обязательно фиксируется полное время закрытия пакета: от начала работ по пакету до коммита, закрывающего пакет.
- Для runtime-пакетов применяется тот же review-контур:
  1. `spec-conformance-reviewer`
  2. после `PASS` — `code-reviewer`
  3. после `PASS` — `security-reviewer`

## Формат записи

### Follow-up package `<код>` — `<название>`

- Статус:
- Дата:
- Начало работ:
- Полное время закрытия:
- Коммит:
- Что сделано:
- Ключевые решения:
- Допущения вне спецификации:
- Проверки приёмки:
- Внешнее ревью:
- Следующий пакет:

## Записи

### Follow-up package `S1` — `Skill and reference hardening`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 16:05:00 +02:00
- Полное время закрытия: 00:25:00
- Коммит: `30bd58b` `docs(backlog-engineer): harden first-run guidance`
- Что сделано:
  - `SKILL.md` усилен как self-contained first-run contract:
    - добавлен preflight по состоянию системы;
    - добавлены правила inference для `delivery_state`;
    - добавлен reconciliation playbook для as-built и planning-state;
    - добавлено явное правило `gap vs continue`;
    - добавлено правило serial-only mutations для одного backlog root;
    - добавлены notes по интерпретации output ключевых команд;
    - уточнены semantics `queue` и canonical packet copy;
  - supporting references выровнены под тот же agent-facing contract:
    - `cli-contract.md`
    - `command-reference.md`
    - `data-model.md`
    - `document-to-packet-workflow.md`
    - `operator-workflows.md`
- Ключевые решения:
  - operational knowledge, нужное агенту для первого рабочего прохода, должно жить прежде всего в `SKILL.md`, а не только в `docs/`;
  - packet/import semantics в skill сформулированы так, чтобы агент не считал canonical copy дубликатом или источником текущей истины;
  - вопрос `queue` пока решается через skill/docs clarification, без изменения runtime output contract.
- Допущения вне спецификации:
  - нет
- Проверки приёмки:
  - self-review diff against follow-up plan — OK
  - skill/reference drift checks on updated topics — OK
- Внешнее ревью:
  - не запускалось; пакет не меняет runtime behavior и не вводит новый code surface
- Следующий пакет: `S2 — Mutation lock and managed gitignore`

### Follow-up package `S2` — `Mutation lock and managed gitignore`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 16:31:43 +02:00
- Полное время закрытия: 1h 17m 08s
- Коммит: `858829c` `feat(backlog-engineer): add mutation lock and managed gitignore`
- Что сделано:
  - подготовлен runtime concurrency guard на backlog root:
    - advisory lock через `open(..., 'wx')`
    - lock file `/.backlog/mutation.lock`
    - explicit refusal path `BE_MUTATION_LOCKED`
  - lock внедрён в command runtime для mutating-команд и для `status --refresh`
  - `init` расширен backlog-local `.gitignore` c managed section под ignore правила lock file
  - существующий `.gitignore` в backlog root теперь сохраняется и дополняется вместо слепого overwrite
  - `delete-backlog` расширен удалением utility-owned `.gitignore`
  - для file-backed runtime убран небезопасный lexical fallback:
    - utility-owned anchored directory operations теперь fail-closed завершаются `BE_PLATFORM_UNSUPPORTED`
  - синхронизированы runtime-facing docs:
    - `process-cli.ru.md`
    - `utility-spec.ru.md`
    - `schemas-and-types.ru.md`
    - `module-interfaces.ru.md`
    - `test-matrix.ru.md`
    - `references/cli-contract.md`
    - `references/command-reference.md`
  - добавлены tests на:
    - lock refusal
    - lock release after failure
    - `.gitignore` creation/update contract
    - `.gitignore` ownership in delete flow
- Ключевые решения:
  - mutating guard реализуется именно как advisory lock на backlog root, а не как optimistic write conflict detection
  - stale lock автоматически не снимается; занятый lock всегда даёт явный refusal path
  - backlog-local `.gitignore` стал частью utility-owned artifact set, но при существующем пользовательском `.gitignore` обновляется только managed section
  - utility-owned artifact I/O не имеет права silently деградировать к lexical-path fallback; при отсутствии anchored directory handling runtime возвращает `BE_PLATFORM_UNSUPPORTED`
  - `delete-backlog` обязан предвалидировать managed entries и удалять `.backlog.json` последней, чтобы error-path не оставлял полудестроенный backlog root
- Допущения вне спецификации:
  - нет; реализуется уже согласованный follow-up contract
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run typecheck` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - `spec-conformance-reviewer` повторно не запускался после ранее полученного `PASS`, потому что финальная дельта содержала только code/security hardening без новых spec-link изменений
  - `code-reviewer` — PASS
  - `security-reviewer` — PASS
- Следующий пакет: `S3 — Packet output clarity`

### Follow-up package `S3` — `Packet output clarity`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 17:50:38 +02:00
- Полное время закрытия: 13m 19s
- Коммит: `15e71bb` `feat(backlog-engineer): clarify packet output contract`
- Что делаем:
  - делаем `packet` success output self-explanatory для authored draft vs immutable canonical import copy
  - добавляем структурные поля:
    - `authored_packet_path`
    - `canonical_packet_path`
    - `canonical_packet_purpose = "immutable_import_copy"`
  - синхронизируем `SKILL.md`, `references/*`, концепцию, спецификацию, схемы и тесты
- Ключевые решения:
  - свободный prose-блок в output не добавляется; различение authored/canonical packet делается только структурными полями
- Допущения вне спецификации:
  - нет; реализуется уже согласованный follow-up contract
- Локальная приёмка:
  - `pnpm --dir skills/backlog-engineer run format`
  - `pnpm --dir skills/backlog-engineer run lint`
  - `pnpm --dir skills/backlog-engineer run test`
- Внешние ревью:
  - `spec-conformance-reviewer` — PASS
  - `code-reviewer` — PASS
  - `security-reviewer` — PASS
- Следующий пакет: `S4 — Doc/runtime drift guard`

### Follow-up package `S4` — `Doc/runtime drift guard`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 18:07:45 +02:00
- Полное время закрытия: 10m 00s
- Коммит:
- Что делаем:
  - добавляем системный doc-sync checklist в process rules имплементации;
  - добавляем lightweight doc-contract tests для критичных agent-facing правил;
  - закрываем риск silent drift между `SKILL.md`, `references/*` и runtime contract.
- Ключевые решения:
  - drift guard делаем через лёгкие semantic anchors, а не через тяжёлый snapshot всех docs;
  - там, где это возможно, doc-contract tests привязываются к runtime-backed invariants (`PacketCommandOutputSchema`, `QueueCommandOutputSchema`, `ERROR_CODES`, `renderManagedGitignoreContent`);
  - полный doc/runtime diff не вводится; пакет закрывает только high-signal agent-facing rules.
- Допущения вне спецификации:
  - нет; пакет усиливает process/test guard rails вокруг уже принятого follow-up scope
- Локальная приёмка:
  - `pnpm --dir skills/backlog-engineer run format`
  - `pnpm --dir skills/backlog-engineer run lint`
  - `pnpm --dir skills/backlog-engineer run test`
- Внешние ревью:
  - `spec-conformance-reviewer` — PASS
  - `code-reviewer` — PASS после одной доработки
  - `security-reviewer` — PASS
- Следующий пакет:
  - follow-up цикл закрыт; новых пакетов по [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) не осталось

### Follow-up package `S5` — `Invocation contract normalization`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 21:59:24 +02:00
- Полное время закрытия: 00:01:33
- Коммит:
- Что сделано:
  - в `SKILL.md` добавлен явный execution note для local fallback invocation
  - в `references/first-backlog-walkthrough.md` execution note перенесён выше первого command example
  - в `references/command-reference.md` добавлен единый execution note для semantic command form и local fallback
  - во всех трёх местах `<skill-root>` определён буквально как директория, где лежит `SKILL.md` этого skill
  - во всех трёх местах зафиксировано, что fallback invocation меняет только command prefix и не меняет `cwd`
- Ключевые решения:
  - default examples остаются в semantic form `backlog-engineer ...`
  - local fallback pattern фиксируется как `node <skill-root>/scripts/backlog-engineer.mjs ...`
  - script path и working directory теперь разведены явно, чтобы не ломать root discovery и relative path resolution
- Допущения вне спецификации:
  - нет
- Проверки приёмки:
  - execution-note consistency check across `SKILL.md`, walkthrough, and command reference — OK
  - `node --experimental-strip-types --test skills/backlog-engineer/test/docs-contract.test.ts` — OK
- Внешнее ревью:
  - не запускалось; пакет docs-only и не меняет runtime behavior утилиты
- Следующий пакет: `S6 — Preflight wording hardening`

### Follow-up package `S6` — `Preflight wording hardening`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 22:01:22 +02:00
- Полное время закрытия: 00:00:26
- Коммит:
- Что сделано:
  - в `SKILL.md` preflight wording переписан на один combined blocking question
  - combined question теперь покрывает сразу:
    - system state
    - source of truth for `delivery_state`, если система уже partially implemented
  - вторичный шаг про source of truth ужат:
    - если partial implementation уже подтверждена, использовать источник, который оператор уже дал, или спросить его только если он всё ещё отсутствует после первого blocking question
  - walkthrough синхронизирован по тому же wording и тому же example question
- Ключевые решения:
  - primary fix живёт в `SKILL.md`; walkthrough только синхронизируется следом
  - defect считался wording-problem в основном agent contract, а не проблемой walkthrough itself
- Допущения вне спецификации:
  - нет
- Проверки приёмки:
  - combined-preflight consistency check across `SKILL.md` and walkthrough — OK
  - `node --experimental-strip-types --test skills/backlog-engineer/test/docs-contract.test.ts` — OK
- Внешнее ревью:
  - не запускалось; пакет docs-only и не меняет runtime behavior утилиты
- Следующий пакет:
  - corrective pass from [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md) закрыт
