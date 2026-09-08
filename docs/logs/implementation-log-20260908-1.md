# Реализация улучшений четырёх инженерных скиллов

План: [FOUR-SKILLS-20260908-v2](../plans/implementation-plan-20260908-1.md). Прямое разрешение исполнения и делегирования получено 2026-09-08. Scope `unchanged`; Unauthorized additions: none.

## Текущий результат

Реализация завершена: все четыре skill-вердикта и общий interop — независимый PASS. Открытых P1/P2 в принятой границе нет. [Итог и ссылки на проверки](../reviews/evidence/engineering-skills/verification-summary.md). Полные baseline/candidate snapshots, первоначальные провалы и все повторы сохранены.

## Основание и решения

- Потребитель — агент, исправляющий CLI и подготавливающий точную инструкцию. Отчёты подтверждают проверенные границы, не заменяют результат.
- Рабочие записи — русский, активные инструкции — английский.
- Фиксированный опубликованный base исключает влияние незавершённой G5; повторная совместимость после принятия G5 обязательна.
- `pnpm` первоначально не смог открыть database в unwritable XDG-каталоге. С task-local `XDG_DATA_HOME`, `XDG_CACHE_HOME`, `XDG_STATE_HOME` под `/tmp/engineering-tools` работает pnpm 10.28.2. Системные настройки не изменены.

## Проверки и ограничения

Перед созданием: master чистый, `.worktrees/` игнорируется, имя/путь свободны. Опубликованный SHA подтверждён HTTPS `git ls-remote`; SSH readback встретил permissions error системного ssh config. HTTPS не меняет remote config.

Создание worktree сначала встретило read-only `.git`; разрешённая sandbox escalation успешно создала только принятую ветку и worktree. Никаких commits, push или merge.

`pnpm install --frozen-lockfile` успешно, Node v24.15.0, pnpm10.28.2. Предупреждение ignored esbuild build scripts сохранено как setup observation; пригодность build ещё будет проверена.

## Recovery snapshot

- Worktree: `/home/kostysh/.codex/skills/custom/.worktrees/engineering-skills`.
- Branch: `codex/engineering-skills`; HEAD/base: `504b87331f22b3a5303875bef69163a40d4372d7`; upstream не установлен, публикации нет.
- Исходный статус: чистый; текущие supporting записи — только в этом worktree.
- Last accepted checkpoint: принят весь план исполнения; промежуточных approval stops нет.
- Next authorized action: передать reviewable результат оператору; commit/push/merge/publication не разрешены.
- Независимая приёмка: PASS, включая final master ef47c80; это не утверждение об операторском approval публикации.

## Baseline evidence

Структурный baseline всех4 пакетов: lint/check/out-of-place compile/check —16 успешных команд; baseline-structural.json. TS/Node независимый source audit установил3 P2; CLI/docs первичный source audit —2 P3, broad verdict pending behavior. Raw case outputs сохраняются до любых target edits. C20 добавлен до правок для обычного sufficient CLI запроса без явного запрета миграции; прежняя рубрика сохранена как v1, существующие случаи неизменны. C20 наблюдает незаказанную замену tsx test command, независимая классификация выполняется.

Оператор уточнил источник финальных зависимостей: master. Принятое уточнение и официальные источники — в sources.md. Работа больше не ожидает отдельного идентификатора G5; финальный master SHA ещё предстоит freshly-read и сопоставить.

## Стабильный candidate

- documentation0.2.1: DOC-FMT, concrete executable facts и условные decision handoffs.
- typescript-engineer0.2.2: TS-01 JSON overload soundness, TS-02 asconst aliases, conditional reference classification и producer/consumer results.
- node-engineer0.1.4: NODE-01 native/loader resolver separation, exact artifact и owner result boundaries.
- cli-engineer0.2.1: CLI-SCOPE-01 сохранение existing tooling на полном пути root/references/UI/eval, P3 CLI-TEL, конкретные conditional interop результаты.

Авторские selfchecks, compiler lint/regenerate/check, отдельные compile/readback и creator validators прошли. Selfchecks — не independent PASS. [CLI author](../reviews/evidence/engineering-skills/author-cli.md), [TS/Node author](../reviews/evidence/engineering-skills/author-ts-node.md), [documentation author](../reviews/evidence/engineering-skills/author-documentation.md).

Baseline C01–C19 PASS в указанных границах (C10/C18 уточнены доcandidate с сохранением старых versions/runs), C20 FAIL/P2 из-за незаказанного runner replacement. Guided source probe отдельно подтверждает TS-01. Независимые source reviews CLI/docs не нашли новыхP1/P2; полного verdict до candidate behavior нет.

Авторская временная проверка через pnpm auto-install изменила shared fixture dependencies. Старое дерево и raw ошибки сохранены. До первого candidate trial root выполнил `npm ci --ignore-scripts` по exact исходному lockfile; все четыре прямые версии совпали, [restore evidence](../reviews/evidence/engineering-skills/toolchain-restore.json). Сам candidate validation использует отдельную копию repository, frozen lockfile и own node_modules; исходный reviewed compiler не перегенерируется тестами.

Published master freshly-read 2026-09-08 снова `504b87331f22b3a5303875bef69163a40d4372d7`; зависимости и методология совпадают с baseline. G5 worktree не читался и не копировался. [Readback](../reviews/evidence/engineering-skills/master-readback.json).


## Промежуточная проверка candidate

`pnpm install --frozen-lockfile` и `pnpm test:ci` в `/tmp/engineering-candidate-validation` — exit0, включая build/test owning compiler; [raw](../reviews/evidence/engineering-skills/candidate-ci.json). Исходные four packages и девять соседей неизменны относительно frozen manifests; локальных отсутствующих active links нет, diff --check=0; [integrity](../reviews/evidence/engineering-skills/candidate-integrity.json).

C01–C10, C17 и C20 завершены, raw results сохранены. В C20 изменён только `src/cli.ts`, package.json побайтово сохранён; это закрывает наблюдавшуюся незаказанную замену runner при последующей независимой оценке.

C19 первого candidate получил неполный input из-за предположения collector о буквальном `installed/`: producer правильно сохранил архив и установку в `artifacts/`, но папка не была передана. Run сохранён как `C19-incomplete-collector` и INCONCLUSIVE для сравнения полной передачи. Collector исправлен без смены критериев/skills: все output directories сохраняют относительные пути. Fresh baseline и candidate C19 повторяются симметрично; [протокол](../reviews/evidence/engineering-skills/protocol.md), [архивы SHA256](../reviews/evidence/engineering-skills/c19-collector-readback.json). Это ошибка подготовки свидетельств, не дефект CLI/source handoff.


## Финальные зависимости из опубликованного master

Во время исполнения master продвинулся на ef47c805624f77ad0b1febb9604f160e72eca441 (merge G5). Root freshly-read ref и извлёк опубликованную ревизию через git archive в disposable copy. G5 worktree не использовался. Из девяти прямых соседей изменились code-reviewer0.4.6 и prd-engineer0.1.8; четыре target packages, семь остальных соседей, AGENTS/standard/reviewer/compiler/implementation-discipline не изменились. [Delta](../reviews/evidence/engineering-skills/master-dependency-delta.patch), [snapshot](../reviews/evidence/engineering-skills/master-snapshot.json).

Свежий master C19 потребляет тот же точный candidate C17 артефакт с обновлёнными владельцами. Каталожный ввод C18 (описания/metadata/UI) и task побайтово совпадают, поэтому принятый результат переиспользован с [доказательством](../reviews/evidence/engineering-skills/master-catalog-parity.json). Независимый assessor подтвердил достаточность этого affected scope; дополнительных зависимых случаев не выявлено.

`pnpm install --frozen-lockfile` + `pnpm test:ci` в `/tmp/engineering-master-validation` (ef47 master + точные4target packages) — exit0; [raw](../reviews/evidence/engineering-skills/master-ci.json). Исходная branch codex/engineering-skills остаётся на принятой базе504b без Git merge/rebase/commit/push.


## Завершение

[CLI](../reviews/evidence/engineering-skills/candidate-cli-review.md), [documentation](../reviews/evidence/engineering-skills/candidate-documentation-review.md), [TypeScript](../reviews/evidence/engineering-skills/candidate-typescript-review.md), [Node](../reviews/evidence/engineering-skills/candidate-node-review.md) и [общий interop/master delta](../reviews/evidence/engineering-skills/candidate-interop-review.md) — independent PASS. Source authors и assessors разделены. Авторские supporting checkpoints внутри frozen packages сохранены как история; этот общий журнал фиксирует финальные verdicts без изменения assessed package hashes.

Основное сравнение — baseline19PASS/1FAIL → candidate20PASS, catalog13/13. Fresh master C19 PASS подтверждает обновлённые code-reviewer/PRD handoffs; остальные branches и catalog inputs не изменились, независимый assessor обосновал отсутствие необходимости иных повторов. Все required compiler/validator/readback/link/CI checks завершены. [Финальная integrity](../reviews/evidence/engineering-skills/final-integrity.json) подтверждает те же четыре пакета, latest dependency hashes, workingHEAD504b и remoteef47, отсутствие stagedfiles и чистый основной checkout.

Scope unchanged; unauthorized additions none. Рабочая ветка и evidence сохранены, удаления worktree, commits, push, rebase/merge и публикации не было. Полный rollback возможен восстановлением только собственных target changes относительно baseline; исходные evidence и соседние изменения следует сохранять. Никакой rollback сейчас не выполнялся. Проверенные локальные границы и оставшиеся anti-claims приведены в итоговом отчёте.


## Разрешение публикации

После завершения реализации оператор поручил выполнить всё необходимое. Разрешены commit, push, PR и merge после успешных проверок. Проверенные пакеты сохранены; полные материалы упакованы с побайтовой проверкой, см. [publication record](../reviews/evidence/engineering-skills/PUBLICATION.md). Итоговые GitHub OID и CI будут подтверждены внешним readback.
