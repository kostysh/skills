# Независимая оценка сокращения двух скилов

**PASS — bounded change review. Assurance: independent.** В проверенном delta требования сохранены, оба generated `SKILL.md` укладываются в прежние лимиты, предупреждения сняты. Findings P1/P2/P3: **none**. Это оценка трёх сокращений и их generated/package parity; она не является новым baseline-аудитом всей функциональности двух скилов.

Парные trials дают **2 PASS и 2 INCONCLUSIVE по неизменённым fixed rubrics**. У architecture rubric есть описанная ниже неоднозначность статуса handoff. Результат нельзя представлять как «4/4 PASS».

## Основание и стабильный scope

Потребители изменения — агент, читающий архитектурные или planning instructions, и maintainer, принимающий сгенерированный пакет. Проверяемый результат: убрать размерные warnings сокращением повторов в исходниках, сохранив требования и лимиты. Проектный эффект — более компактные portable instructions без нового workflow, зависимости или процесса.

Режим: `change`. Reviewer не писал и не исправлял candidate. Применены baseline `AGENTS.md`, `docs/skill-standard.md`, `skill-reviewer` 0.2.7 с `references/methodology.md` и `references/forward-testing.md`; scope/simplicity/evidence проверены с `implementation-discipline`. Target-specific `AGENTS.md` для двух скилов нет.

- Baseline commit: `ce19ba418e1671167254c260e4617564335489ae`.
- Candidate root: `/home/kostysh/.codex/skills/custom/.worktrees/trim-skill-size-warnings`.
- Candidate aggregate: `fe6cdd26ec69ad75acb06c4fe85da1a253d7cc67e5e01567826b56c9ac350fa2`.
- Baseline aggregate: `d7233afdf70ef47963933ea40b4f730ed3c14b788575bd39504aae000086a12f`.
- Идентичность: SHA-256 каждого из 30 repo-relative путей из `docs/reviews/evidence/skill-size-20261021/snapshot.json`; aggregate — SHA-256 compact sorted-key JSON `relative path -> file SHA256`. Reviewer заново вычислил оба manifest и aggregate; совпадение полное.
- Включены source manifests/fragments, generated roots/compile reports, active references, assets и UI metadata. Рассмотрено неизменённое окружение решений, нужное для трёх замен. Общий compiler/runtime не менялся относительно baseline.
- Supporting logs, navigation, новые evidence/review/status records не входят в этот hash/verdict scope. Их ссылки не превращены в active instructions. Не проверялись прежние не затронутые решения как отдельный baseline-аудит.

Reviewer выполнял чтение, hashing и известные read-only checks. Candidate не редактировался; Git mutations, network, publication и delegation не выполнялись. Отчёт и собственные check records записаны только в `/tmp/skill-size-20261021/`.

## Размер и сохранение требований

| Скил | До, bytes | После, bytes | Лимит до/после | Версия источника |
| --- | ---: | ---: | ---: | --- |
| architecture-engineer | 26032 | 25977 | 26000 | 0.1.10 → 0.1.11 |
| delivery-planner | 23842 | 23493 | 23500 | 0.2.14 → 0.2.15 |

Размер измерен по фактическим UTF-8 bytes. Запас составляет 23 и 7 bytes. Это факт текущего снимка, а не гарантия отсутствия warnings после будущих правок.

Reviewer прочитал baseline/candidate diff и emitted roots, сопоставил каждую замену и проверил точное равенство остального generated body после нормализации только `source-version` и `skillforge-source-hash`.

| Substitution | Что сохранено | Почему delta достаточен |
| --- | --- | --- |
| `architecture-engineer/fragments/overview.md:1`: два вводных абзаца объединены в один | Архитектура — слой решений между product input и downstream specs, delivery planning, domain work и implementation evidence. Агент владеет system shape и rationale. Сохранено условие `not normally` для sprint/task decomposition. | `shape of the system / reasoning behind it` заменены на `system shape / rationale`; роль, потребители и квалификатор не изменились. Responsibility boundary, запрет task backlog и handoff contract ниже остались побайтно прежними. |
| `delivery-planner/fragments/overview.md:1–7`: повтор purpose, список scopes и default/output exclusions сжаты | Accepted product/architecture context; handoff items, constraints, boundaries, contracts, risks, validation obligations; right-sized tasks для безопасного downstream execution. Сохранены все шесть planning scopes и все module/service synonyms. Default — один compact Markdown Delivery Plan; heavy YAML не default; workflow — решения, не механическая форма; узкая область и ясная authority допускают краткий план. Сохранены все восемь исключений: PRDs, architecture decisions, ADRs, ASR records, implementation-ready specs, code, CI changes, merge decisions. | Удалён повтор purpose; перечисления и запреты сохранены без нового условия. Authority/readiness, task handoff, minimal output и planning completion anti-claim в root/methodology не изменены. |
| `delivery-planner/fragments/final-checks.md:9`: три routes объединены в одну строку | Missing architecture decisions → `architecture-engineer`; missing product intent → `prd-engineer`; missing behavior/verification detail → `spec-engineer`. | Ввод `For missing inputs` сохраняет исходное условие missing. Владельцы и категории не изменены. Canonical methodology: owner/boundary gap → architecture; accepted-owner behavior/schema/member gap → spec; блокируется только зависимая работа. |

В обоих `skill.yaml` единственный delta — patch version. Лимиты, descriptions, reference triggers, sections, policies, interop, loading conditions, assets, metadata и source/runtime relationship не менялись. Generated roots содержат только эти fragment substitutions и ожидаемые metadata changes. Перемещение обязательных правил в optional/supporting surface отсутствует.

## Проверки и emitted readback

Собственные выполненные команды reviewer, все exit 0:

```text
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/architecture-engineer
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/delivery-planner
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check /tmp/skill-size-20261021/emitted-final/architecture-engineer
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check /tmp/skill-size-20261021/emitted-final/delivery-planner
git diff --check
```

До запуска проверен read-only путь `checkSourceBundle` / `checkCompiledSkill`: он рендерит в памяти, читает файлы и сравнивает output. Source check подтверждает актуальность generated root и compile report; в обоих reports `Warnings: none`. Проверен также реальный размер, поэтому это не вывод только из exit code.

Final emitted packages: `/tmp/skill-size-20261021/emitted-final/{architecture-engineer,delivery-planner}`. Reviewer проверил каждый включённый файл: **25/25** и **21/21** совпали с соответствующими source-package files. Все required local references/assets из snapshot существуют. Ранний `emitted/` не использован как финальный supporting readback.

Повторно использовано author evidence того же active/source snapshot:

- `structural-commands.json`: прочитаны фактические command arrays, stdout/stderr и individual exit codes; **51 запись, все exit 0, stderr пуст**. Включены target lint/regenerate/check, out-of-place compile/check, emitted validator, 37 distinct creator validations и final compile после navigation update.
- Creator validation: **37/37**, плюс два ранних emitted validations. Это проверка структуры.
- `candidate-tests.txt`: фактический вызов `pnpm test:ci`, terminal totals **110/110**: code-reviewer 1, hono-engineer 18, security-reviewer 26, typescript-test-engineer 21, compiler 44; failures/cancelled/skipped/todo — 0. Exit 0 записан в `checks.json`. Это существующая suite, а не 110 behavioral tests двух документационных скилов.
- `author-self-check.json` прочитан и сверён с реальным delta; авторская оценка не использована как независимый verdict.

Reviewer не повторял writing `regenerate` или `test:ci` на candidate: последнее имеет compiler `pretest/build`. Доступное evidence и собственные narrow checks достаточны для этой границы. Искусственный runtime или постоянный новый harness для двух documentation-only скилов не требуется.

Собственные raw records: `/tmp/skill-size-20261021/independent-checks.json`, `independent-verification.json`, `independent-trial-integrity.json`.

## Парные trials и fixed rubric

Reviewer прочитал все четыре raw `result.md` и `execution.json`, как в `results.json`, так и в соответствующих `/tmp/skill-size-20261021/runs/<id>/evidence/`. Проверены hashes embedded text, файлов на диске, одинаковых raw inputs, fixed rubrics и active trial packages. Несовпадений нет. Trial active inventory полный: architecture 15 файлов, delivery 7; лишних файлов внутри run folders не обнаружено. У каждого executor записано чтение семи релевантных inputs; их hashes совпадают.

| Case/run | Fixed-rubric result | Наблюдение |
| --- | --- | --- |
| Architecture baseline `r17` | **INCONCLUSIVE** | P-7/A-4, R1–R3, границы одного процесса, Parser/View/ApplyImport и память сохранены; есть rationale и будущая validation; DTO/signatures и backlog не придуманы; нет runtime claim. Spec-owner handoff `ready`, implementation ждёт DTO. Неопределённость только в status clause rubric. |
| Architecture candidate `k44` | **INCONCLUSIVE** | Те же защищаемые решения. Есть source trace, constraints, ожидаемый DTO-контракт/verification map и возврат architecture owner при изменении A-4. Явно различены готовность spec-owner и неготовность реализации. Та же status ambiguity, не новая регрессия. |
| Delivery baseline `s26` | **PASS** | Один Markdown plan модуля S-2, source trace и P1/P2/AH1 coverage. AH2 → architecture, QP → product, QS с принятым owner → spec. Зависимые increments blocked, независимые уточнения доступны. Нет fabricated schema/owner decision, infrastructure или coding/runtime readiness. Есть typed dependencies и общая acceptance boundary. |
| Delivery candidate `m83` | **PASS** | Те же требуемые routes и ограничения. MI-01 явно не зависит от AH2/QP после T-S; зависимая ветка ошибок остаётся blocked. Контракты не выдуманы; acceptance/evidence и owner return paths заданы. Scope unchanged, один Markdown plan, отдельного harness нет. |

Architecture rubric, сохранённая в `inputs.json:13`, требует: «route exact DTO/behavior detail to spec-engineer with an appropriate draft/blocked handoff and expected output». Literal `draft/blocked` не выполнен обоими outputs: `r17/result.md:17` и `k44/result.md:13` содержат `ready`. Поэтому закрытый case нельзя без оговорки считать PASS.

При этом owning source — неизменённая `architecture-engineer/references/methodology.md:366–374` — определяет `ready` по способности **названного владельца** произвести expected output без неоговорённого архитектурного выбора. В supplied A-4 владелец DTO уже принят, отсутствуют его точные детали. Spec-owner вправе согласовать их; это не отсутствие архитектурного owner decision. Оба outputs прямо блокируют реализацию до DTO: `r17/result.md:11,40`, `k44/result.md:26,36`. Они не выдают spec handoff за coding readiness.

Это source-grounded корректность outputs, отдельная от literal rubric outcome. Rubric не переписана и не переоценена задним числом; её неоднозначность ограничивает кейс. Она не устанавливает P1/P2 в candidate и не показывает regression: readiness/routing clauses вообще не входили в architecture delta. Требование сохранить изменённую вводную формулировку подтверждено прямым requirement mapping, побайтно неизменёнными условиями и одинаковыми наблюдаемыми границами обоих runs. Поэтому case ambiguity не блокирует **этот bounded source-preservation PASS**. Более сильный заявленный результат «architecture case PASS по этой fixed rubric» не поддержан.

## Evidence limits и готовность к интеграции

По записи author/root cases/rubrics подготовлены до candidate edits; reviewer проверил сохранённые hashes и текущее равенство, но сами hashes не доказывают хронологию подготовки. Case author одновременно автор candidate и знает rubric; reviewer — независимый assessor. По предоставленным dispatch/exposure сведениям четыре executors использовали fresh `fork_turns=none`, без model/reasoning override, и видели лишь свой opaque run, raw inputs и active skill. Независимо измеренных runtime model/settings нет.

Изоляция instruction-based на shared filesystem; это не hard sandbox. `execution.json` — записи исполнителей, не полный независимый аудит всех tool events. Совпадение текущих файлов/хешей подтверждено; оно не доказывает отсутствие любого внешнего чтения. Исполнители явно ограничены своим skill folder; межскиловая активация, включая фактическую загрузку `implementation-discipline`, не проверялась.

На каждый skill один synthetic case и его baseline/candidate replay. Это forced-invocation execution evidence. Оно не доказывает natural catalog selection, универсальную надёжность, статистическое улучшение, ускорение, все planning scopes или runtime проекта. Реальный CSV preview, external integration, product data и release readiness не проверялись и не заявляются. Сокращение bytes само по себе не используется как доказательство поведенческого улучшения.

В пределах трёх source substitutions и соответствующих generated packages candidate **готов к интеграционному этапу**: no P1/P2, independent assurance, stable identity, source preservation и structural/package checks достаточны. Следующий owner — root/maintainer: сохранить эту границу при оформлении evidence и выполнении уже разрешённого Git/CI integration workflow. Сам review не даёт новых Git/publication полномочий и не утверждает, что интеграция или exact-SHA CI уже выполнены. Изменение active/source файлов потребует нового bounded review; supporting status/link additions сохраняют verdict только для указанного исходного snapshot.
