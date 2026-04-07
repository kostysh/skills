# Лог имплементации 3 `@kostysh/backlog-engineer-cli`

Этот файл продолжает историю из [implementation-log-2.ru.md](implementation-log-2.ru.md) и фиксирует отдельный финальный corrective pass по [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md).

Документ ведётся инкрементально во время реализации последнего doc-only корректирующего цикла.

## Правила ведения лога

- Одна завершённая запись соответствует одному завершённому пакету текущего corrective pass.
- Запись добавляется до коммита пакета и обновляется после приёмки.
- В логе фиксируются только факты и принятые решения, которые важны для чтения именно этого цикла.
- Любое решение или допущение за пределами текущей концепции, спецификаций и утверждённых контрактов фиксируется отдельной явной пометкой.
- Лог не заменяет git history, а дополняет её инженерным контекстом.

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

### Follow-up package `S5` — `Invocation contract normalization`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 21:59:24 +02:00
- Полное время закрытия: 00:01:33
- Коммит: `80567af` `docs(backlog-engineer): clarify local cli invocation`
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
- Коммит: `d03e3d6` `docs(backlog-engineer): harden first-run preflight wording`
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

### Follow-up package `S7` — `Preflight trigger fix and docs polish`

- Статус: завершён
- Дата: 2026-04-07
- Начало работ: 2026-04-07 22:26:53 +02:00
- Полное время закрытия: 00:00:32
- Коммит:
- Что сделано:
  - в `SKILL.md` trigger для combined blocking question ужат до правильного правила:
    - вопрос задаётся, если missing either `system state` or `delivery_state` source-of-truth information
  - в `docs/README.md` исправлена сломанная нумерация списка `Если нужно проектировать код`
- Ключевые решения:
  - decisive trigger lives in `SKILL.md`, because that is the primary agent contract
  - README numbering fix treated as docs polish in the same tiny corrective pass
- Допущения вне спецификации:
  - нет
- Проверки приёмки:
  - wording check in `SKILL.md` — OK
  - README numbering check — OK
- Внешнее ревью:
  - не запускалось; пакет docs-only и не меняет runtime behavior утилиты
- Следующий пакет:
  - current corrective pass fully closed
