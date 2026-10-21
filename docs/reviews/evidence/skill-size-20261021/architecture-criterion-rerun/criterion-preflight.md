# Независимая проверка исправленного критерия до запусков

**PASS — исправление критерия и подготовленные пакеты пригодны для двух новых проб по frozen rubric v2.** Findings P1/P2/P3: **none**. Это preflight, а не результат behavioral trials или новый baseline-аудит architecture-engineer. Пробы ещё не оценены.

Режим: `re-audit`, узкая граница — ошибочное обязательное `draft/blocked` в прежнем критерии, точная коррекция и сохранение условий сравнения. Assurance: `independent`. Assessor не автор коррекции, не executor, не менял candidate или skills и не участвовал в Git/network/delegation. Разрешённая запись ограничена `/tmp/skill-eval-20261021-9f2/assessment/`.

## Основание и scope

Проверен worktree `/home/kostysh/.codex/skills/custom/.worktrees/trim-skill-size-warnings`, HEAD/task base `273b6148fd9df629368f6de29812b0849369140a`. Evidence root: `docs/reviews/evidence/skill-size-20261021/architecture-criterion-rerun/` относительно worktree. Потребитель результата — root/maintainer, который запускает два новых одинаково ограниченных исполнения, затем получает независимую оценку raw outputs.

Прочитаны `criterion-change.md`, `criterion-delta.json`, `rubric-v2.md`, `inputs.json`, `pre-run-freeze.json`, `skill-invariants.json`, `run-mapping.json`; неизменный прежний rubric из parent `inputs.json` и соответствующая оговорка parent `independent-review.md:73–84`. Старые outputs не переоценивались.

Метод: текущие repository `AGENTS.md`, `docs/skill-standard.md`, `skills/skill-reviewer/SKILL.md`, `references/methodology.md` и `references/forward-testing.md`; scope/evidence-ограничения implementation-discipline. Owning architecture sources: обе поставленные версии `SKILL.md`, их локальные methodology/artifact guidance и handoff templates; source declaration `skills/architecture-engineer/skill.yaml` и релевантный overview. Проверка не запускает compiler, package scripts или suite, которые могли бы писать в candidate.

## Вывод критерия из источников

| Источник | Норма/факт | Следствие для корректной оценки |
| --- | --- | --- |
| Неизменённая architecture methodology:350–356 | Handoff называет accountable `next_stage_owner` и `expected_next_output`; нормативная детализация поведения/контракта направляется spec-engineer. | Следующий выход спецификатора нельзя требовать как уже готовый вход передачи ему. |
| Methodology:362,366–374 | `ready` означает достаточность authority/inputs для названного владельца без скрытого архитектурного выбора; `blocked` означает, что именно этот владелец не может действовать. | Готовность спецификатора и готовность кодирования оцениваются отдельно. Правило не даёт разрешения coding без нужных контрактов. |
| Synthetic `sources.md:6–10` | A-4 уже принята; владелец DTO-контракта — preview-core. Точные members должен согласовать spec-owner до реализации. | Для handoff спецификатору `ready` допустим. Единственный факт отсутствия DTO members не доказывает blocker для его работы. Для реализации этот пробел остаётся обязательной зависимостью. |
| `sources.md:3–7,12–13` и `task.md` | R1/R2/R3, один локальный процесс, существующие Parser/View/ApplyImport, память текущего открытия; требуется только краткий анализ, без реализации и публикации. | Сохранены инварианты, scope, соразмерный артефакт, source-backed validation и запреты выдуманного кода, backlog и runtime completion. |
| Reviewer forward-testing:19,42,46–54 | Необходимое исправление критерия объясняется; затронутое сравнение повторяется или ограничивается. Новые исполнения используют одинаковые исходные inputs и фиксированный критерий. | Исторические INCONCLUSIVE сохраняются. Новый criterion не применяется задним числом к r17/k44. Будущие результаты не выводятся из preflight. |

Это независимое выведение из неизменённой нормы и raw case. Пояснение автора не служит ground truth. Исправление не связано с изменённой overview-фразой candidate: нужные routing/readiness rules побайтно одинаковы в baseline/candidate.

У rubric v1 конкретный дефект: безусловное требование `draft/blocked` могло отклонить корректный ready handoff спецификатору при достаточной принятой архитектуре. V2 закрывает этот путь. Она допускает готовность названного владельца к своему выходу, требует source-backed причины реального `draft/blocked`, сохраняет ожидание DTO agreement до реализации и блокирует только работу, которой детали нужны как вход. Поэтому корректный spec handoff проходит, необоснованный blocker или coding readiness без DTO — нет. Последние два утверждения здесь являются проверкой логики критерия, а не наблюдением executor behavior.

Для последующей traceability принимаю следующие labels без изменения смысла frozen rubric:

| Label | Закрытое условие |
| --- | --- |
| C1 | Вывести изменение и инварианты из P-7/A-4. |
| C2 | Сохранить существующие локальные parser/view/apply boundaries без новой infrastructure. |
| C3 | Дать architecture rationale, соразмерный check/delta и source-backed validation direction. |
| C4 | Передать DTO/behavior detail spec-engineer с названным owner, expected output и owner-relative readiness; не блокировать его лишь из-за будущих DTO members; реализация ждёт DTO agreement. |
| C5 | Не выдумывать DTO signatures или implementation/sprint backlogs. |
| C6 | Не выдавать architecture artifacts за implemented preview. |
| C7 | Недостающая деталь ограничивает только работу, которой нужна как вход; не блокирует авторизованное получение этой детали или поддержанное источниками остальное рассмотрение. |
| C8 | Assessment guard: не требовать заданного heading, byte count или exhaustive artifact register; forced invocation, synthetic input, один case. |

`C4` и `C7` — ровно два объявленных изменения. Остальные критерии сохранены. Исходный `task.md` отдельно сохраняет разрешённый output `evidence/result.md` и запреты реализации/публикации; labels не добавляют требований.

## Независимые проверки snapshot и пакетов

Выполнены только известные read-only операции: чтение, SHA256, сравнение bytes, `git show`, `git rev-parse`, `git diff --name-only`, `git ls-files --others --exclude-standard`. Ни suite, ни writing checks на candidate не запускались.

Алгоритм aggregate: SHA256 от UTF-8 compact sorted-key JSON объекта `relative evidence path -> file SHA256`, без перевода строки. Все пять hashes из `pre-run-freeze.json` совпали. Независимо получен заявленный aggregate:

`8598200cfb06807b8e701ed1f944b7d3fea3e8d9ae451694f3ec1d301289c313`.

| Поверхность | Проверенная identity/результат |
| --- | --- |
| Rubric v1, извлечённая из parent `inputs.json` | SHA256 `46dc4134e0ac3d1e4ffbe5b4a45a3806d4a263c0eabe181b84fe79bad67b64c4`. |
| `rubric-v2.md` | SHA256 `208a7bd0952dc408c9efef85d91467d8dd7b345e675e059015c4f3ac6e29ea96`. |
| Точность delta | Восстановление v2 из v1 только двумя literal replacements из `criterion-delta.json` и заменой heading дало побайтно фактическую v2. Иных изменений нет. |
| `criterion-change.md`, отдельно от пятифайлового freeze | SHA256 `1335b83fca45973aba7629bd9473f857c7334452322417755d09f979a5069bdb`. |
| Сам `pre-run-freeze.json` | SHA256 `fe3756d9e6533c92c4c2cc11fcc1864c1bfcf40deb34c2b550fa3f959a0d84b0`. |
| Raw inputs | Объект `inputs.json` равен прежним architecture files из parent inputs. Обе case-копии равны declared content/sha256: task `2dcfa06f3a7c0cdfda80cbfdd704d929656a085cb7f04a7c9d4173a5d23bc77c`, sources `c0b6b8c6187ee0c9dcc9993255ca153a87f89ba63b8ea1261b0361b9eb7cb661`. |
| `u61`, baseline | Ref `ce19ba418e1671167254c260e4617564335489ae`; ровно 15 active files, каждый равен `git show ref:skills/architecture-engineer/path` и mapping hash. SKILL.md: 26032 bytes; SHA256 `0ed5c6fe6529a1191ee57c9f47c8369137ee30dc55df021ba43d8054269e8e20`. |
| `z08`, candidate | Ref `273b6148fd9df629368f6de29812b0849369140a`; ровно 15 active files, каждый равен своему ref и mapping hash. SKILL.md: 25977 bytes; SHA256 `d8051ab60169057cc41838e86704cc46310e96d5125816f097c4ffee41c02bdd`. |
| Сравнение active packages | Различается только `SKILL.md`: source-version/hash metadata и одно сокращение overview. Остальные 14 файлов одинаковы. Symlinks отсутствуют. |
| Manifest aggregate активного пакета | Тот же compact sorted-key JSON алгоритм с путями относительно skill/: u61 `3c50fd016f79be4a57e17ced6cade82d835628d144cd20275f12b61da7823400`; z08 `947f79742d3338b09fe3f16c536d5f8b0d4deaa67cadfa855c6f7057b38eaaaa`. |
| Architecture methodology, обе копии | SHA256 `d1e03ecc93166eb8e203e353ac92c96db382a5adfeb6883a8d0f2869ca9629cb`. |
| Полный architecture package candidate | Все 40 файлов, включая source/supporting, совпали с manifest в `skill-invariants.json`; лишних/недостающих файлов нет. Tree OID `755f08fba34cc541dbee3c8dbc1a8e57a561b172`. |
| Каталог skills/ | Base tree OID `08b4d43340801332654a240f540627960ee794d1`; tracked delta к task base пуст, non-ignored untracked files отсутствуют. |
| Прежнее evidence | Все 13 hashes из `prior_records_unchanged` совпали. Исторические rubric/results/report не заменены. |

## Границы и следующий шаг

Предварительные исполнительские копии содержат root, все три локальные references, десять templates и UI metadata. Source и supporting history исключены из trial surface; это документированное active-package сравнение, а не испытание полного shipped package. Межскиловые зависимости также исключены, как в прежних пробах; межскиловое исполнение этой парой не подтверждается. Полный package здесь проверен на неизменность bytes, а не на всю функциональность.

Assessor видел correction, mapping и rubric; это допустимая exposure его роли. Исполнители ещё не запускались по данному preflight. Фактические fresh contexts, prompts, доступ к answer keys, tool events, побочные изменения и результаты предстоит проверить после запусков. На общей файловой системе instruction-based isolation не является hard sandbox.

**Можно запускать обе пробы с этим неизменным frozen rubric и одинаковыми inputs.** Root сохраняет raw outputs и доступные events/exposure сведения и передаёт их для независимой оценки `PASS`/`FAIL`/`INCONCLUSIVE` каждого case. Настоящий документ не подтверждает trial PASS, естественную активацию, runtime preview, улучшение надёжности/ресурсов или готовность интеграции до следующей оценки.
