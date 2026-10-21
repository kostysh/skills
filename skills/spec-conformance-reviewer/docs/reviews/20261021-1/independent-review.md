# Независимый change review: spec-conformance-reviewer

**PASS для зафиксированного изменения task 4.** Дополнение отделяет продуктовые требования от предположений автора и фактов платформы, требует проверить допустимую ветвь gate вместе с отказами и сохраняет действующие статусы неопределённости. Findings P1/P2/P3 не установлены. Четыре выполненные пробы самостоятельно оценены как PASS в их локальной границе.

Режим: `change`. Assurance: `independent`. Ревьюер `/root/audit_spec` не создавал и не исправлял кандидат, fixtures, rubric или ответы исполнителей. Автор кандидата и fixtures — `/root/review_skills`; организацию запусков и архивирование выполнял root. Авторская самооценка и итоговые утверждения исполнителей не использовались как независимый verdict.

## Основание и стабильный scope

- Прямое поручение: **только task 4** из [исходного запроса](</home/kostysh/.codex/attachments/163ef2a9-db9a-4dd3-bccb-96ea1310b745/Pasted text.txt>). Tasks 1–3 и их изменения исключены из этого verdict.
- Репозиторий кандидата: `/home/kostysh/.codex/skills/custom/.worktrees/evidence-aware-skill-repairs`.
- Base: `0bd4d8d92a9488e5595faa2045353733ec0b5fca`.
- Candidate aggregate SHA-256: `f93fb54b2b18b438a64e8deee0cca9bcd026b2dcd2125cc47c857974c04bf786`.
- Baseline aggregate SHA-256: `d1d8833f05eaf1180a2d8ecc57a7b3441ee2cce6e86dbe7ea427dcac83cee71f`.
- Алгоритм: SHA-256 каждого файла; затем SHA-256 UTF-8 compact JSON объекта `relative POSIX path -> SHA-256`, отсортированного по ключам. Точный inventory из девяти active/maintenance файлов находится в [snapshot.json](/home/kostysh/.codex/skills/custom/.worktrees/evidence-aware-skill-repairs/skills/spec-conformance-reviewer/docs/reviews/20261021-1/snapshot.json).
- Ревьюер заново вычислил оба aggregate: candidate из текущих файлов, baseline через `git show <base>:<path>`. Оба совпали. Все шесть файлов active trial copy совпали с candidate. Повторная проверка перед записью отчёта подтвердила тот же candidate.

Прочитаны применимые root/target `AGENTS.md`, `docs/skill-standard.md`, текущие `skill-reviewer/SKILL.md`, `references/methodology.md`, `references/forward-testing.md`, а также применимые правила `implementation-discipline`. Основанием решения служат текущие источники. Исторический [RCA](/code/projects/aequitasadr-app/tmp/issue544-final-evidence/support603/control-after611/phase-admission-integration-rca-spec.md) прочитан как контекст проблемы; он не превращён в продуктовую норму или доказательство точной причины первого GET.

Проверены diff к base, `skill.yaml`, `fragments/overview.md`, его parity с неизменённым root, generated `SKILL.md`, UI metadata, все три активных reference, объявленный worked fixture, compile report и новые supporting записи. Существующие historical logs не переаудировались. Единственное поведенческое изменение — `references/methodology.md`; `skill.yaml`, root, routing, reporting и policy matrix не изменены. Supporting README/log прочитаны как запись процесса, не как активные инструкции.

Ревьюер выполнил только чтение, сравнение, хеширование и read-only `git diff --check`. Ни кандидат, ни исходные кейсы не изменялись. Новые агенты, внешние сервисы, публикация и Git mutations не использовались. Единственная запись ревьюера — этот отчёт в `/tmp`.

## Проверяемая способность и вывод по тексту

Потребитель — владелец реализации, получающий источник, статус требования, доказательство и ограниченный verdict. Проверяемая способность: после явного применения навыка агент выводит ожидаемое поведение из owning sources, сопоставляет с фактическим gate и не принимает зелёные авторские проверки за определение требования.

Это не доказательство автоматического выбора навыка, live platform integration, общего соответствия любого приложения или причины исторических отказов Aequitas.

| Требование task 4 | Проверенный источник кандидата и вывод |
| --- | --- |
| Независимо вывести ожидаемое поведение | `methodology.md:35,158` задают источник ожиданий до сопоставления с кодом/fixtures. Авторская модель не получает нормативную силу. |
| Проверить допустимый сценарий и обязательные отказы | `methodology.md:127,169` требуют обе ветви в уже условном admission review. Trigger по нормативным источникам и требование source basis каждой строки сохранены. |
| Найти лишнее ограничение реализации | `methodology.md:127,238,297` охватывают state/type/identity/transition restriction, которая блокирует принятое поведение, включая ошибочную fixture expectation. Нужны достижимая ветвь и источник обязанности. |
| Различать норму, факт, предположение и пробел | `methodology.md:35,297` отделяют эти четыре категории. Provider state сам по себе не создаёт обязанности допустить его. |
| Сохранить статусы и границы | Новая формулировка `methodology.md:297` согласована с неизменёнными `reporting.md` и `policy-admission-matrix.md:48–51`: нарушение — `not_fulfilled`; неясное требование — `ambiguous_spec`; недостающая enforcement/platform evidence — `cannot_determine`. Read-only и bounded re-audit в `methodology.md:15,19–21` сохранены. |

Изменение размещено в существующем обязательном reference. Generated root уже требует читать methodology при каждом review; дополнительная маршрутизация не нужна. Новый процесс, dependency, runner, общий E2E gate, approval gate или универсальная матрица не появились. Контракт допуска не сводится к правилу «разрешать все известные платформе состояния».

P1-screen: на проверенном пути не установлен механизм ложного положительного verdict, подмены продуктовой authority фактом платформы, автоматического превращения пробела evidence в нарушение или разрешения reviewer remediation. P2-дефекты parity, доступности reference, scope или воспроизводимости также не установлены. P3-замечаний, требующих изменения кандидата, нет.

## Независимая оценка четырёх проб

Источник raw inputs/results — [архив 20261021-1](/home/kostysh/.codex/skills/custom/.worktrees/evidence-aware-skill-repairs/skills/spec-conformance-reviewer/docs/reviews/20261021-1/README.md). Прочитаны исходные задачи, normative/project/provider documents, before/after code, diffs и fixtures. Затем проверены реальные `result.md`, traceability/review-basis, scratch scripts, stdout/stderr и per-command exit codes. Самооценка в отчёте исполнителя не была достаточным основанием PASS.

| Case | Самостоятельно установленный результат | Оценка |
| --- | --- | --- |
| 31: guard запрещает требуемый сценарий | EP-17 r4 R-2 ссылается на recognized unfinished states; API 2.3 включает `pending/null`. Actual `runPhase` на capture: before вызывает команду 1 раз, after — 0. Авторские after tests зелёные 12/12. Независимые от них scratch assertions получают 3 нарушения `pending` из 41 проверок; 38 остальных проходят. Исполнитель выдаёт `not_fulfilled`, `non-compliant`, один finding с R-2 и кодом, сохраняя evidence о допустимых отказах и локальный scope. | PASS |
| 32: строгий запрет прямо принят политикой | При том же provider contract EP-17 r5 намеренно запрещает `pending`. Исполнитель не выводит обязанность допуска из platform support. After tests 13/13; дополнительные 85 наблюдений проверяют как разрешения, так и отказы. `compliant` ограничен local admission/dispatch. Неизменённый `TypeError` на nested null не объявлен нарушением: политика нормирует no dispatch, но не форму ошибки. | PASS |
| 33: первичный продуктовый источник отсутствует | Исполнитель сохраняет наблюдаемый before/after отказ и wire facts, но не назначает им продуктовую authority. Текст политики недоступен, author assumption не утверждён. Вывод: `POL-UNKNOWN — ambiguous_spec`, `cannot determine due to missing or conflicting normative basis`; ни `not_fulfilled`, ни `compliant` не заявлены. Назван Release Engineering и конкретный недостающий источник. After tests 12/12 не использованы для закрытия policy gap. | PASS |
| 34: корректная реализация | EP-17 r4 и API 2.3 обосновывают допуск `pending/null`; after его сохраняет и запрещает unknown. After tests 13/13; scratch suite 6/6, 570 вызовов, включая 568 after, фактически считает dispatch. Трассировка охватывает allow/refusal/identity/inventory. Вывод `compliant` не повышен до live provider, transport или бизнес-эффекта команды; лишний E2E gate не потребован. | PASS |

Числа выше — результаты наблюдённых запусков исполнителей, повторно прочитанные и проверенные ревьюером; ревьюер не заявляет собственный повторный запуск этих suites. Scratch scripts импортируют настоящий supplied `admit/runPhase`, ожидаемое поведение выводят из указанной политики, а callback измеряет число вызовов на принятой локальной границе. Поэтому зелёные проверки не являются только сравнением с возвращённым `commandCalls`.

Заново проверены все 68 исходных файлов четырёх cases, их SHA-256, `before_files` и текущие disposable copies: расхождений нет. Все 90 архивированных текстовых evidence файлов совпадают с фактическими trial directories, их content hashes корректны. В `results.json` у всех cases `changes: {}`; это подтверждено хешами исходных файлов, а не принято на веру. Полного наблюдения за любыми возможными процессными/сетевыми эффектами эти файлы не дают.

Пробы покрывают ровно четыре требуемых контраста, включая два достаточных/корректных случая против лишнего отказа. Для узкого дополнения этого достаточно совместно с source inspection. Отдельная fresh-context проба для неполной enforcement/platform evidence не запускалась: в этом change review сохранение `cannot_determine` подтверждено совместным чтением методологии и неизменённых status owners. Статистическая надёжность, все комбинации state/type/identity/transition и неизменённый полный re-audit workflow из четырёх проб не выводятся.

## Структура, parity и ограничения evidence

Авторские `lint → regenerate → check` завершились с exit 0; creator scaffold validation — exit 0. Эти записи проверены как структурные evidence, не как независимый behavioral PASS. Generated `SKILL.md`, объявленные source/active references и trial package сопоставлены отдельно. Required files доступны; методология находится в source-owned reference и не требует hand-edit generated output.

Read-only `git diff --check <base> -- skills/spec-conformance-reviewer` выполнен ревьюером: exit 0. Сохранённый общий `pnpm test:ci` прочитан по raw log: 110/110, fail 0. `spec-conformance-reviewer` не имеет собственного runtime/package test command; общий suite проверяет соседние пакеты и compiler, не заменяет его behavioral trials. Локальный run использовал Node 24.15.0; `.github/workflows/test.yml` выбирает Node 22. Exact-head CI остаётся отдельной границей интеграции, не заявленной этим отчётом.

Blindness и assurance различаются. По orchestration metadata каждый executor получил fresh `fork_turns=none`, одну задачу, свой case и active skill без rubric, исходной диагностики, author logs и соседних cases. Model/reasoning override не задавались; независимые runtime metadata модели не сохранены. Ревьюер не автор этих executions. Изоляция — ограничения инструкциями на общей файловой системе, не hard sandbox. Полной telemetry чтения всех файлов в архиве нет; гарантированное аппаратное предотвращение доступа к rubric не заявляется.

Закрытая rubric подготовлена по приёмке пользователя до candidate edits; её содержание проверено независимо от новой формулировки навыка. Preparation record фиксирует freeze `2026-10-21T11:47:19.305997+00:00` и удаление instructional hint из task до edits/trials. Текущие rubric/input-manifest hashes совпали с preparation. Полный временной аудит авторской сессии не проводился; chronology опирается на предоставленную запись подготовки и orchestration handoff.

Все cases синтетические и принудительно вызывают навык. Live service, natural discovery, результат реального #544/#603, скорость/стоимость и улучшение частоты ошибок относительно baseline не доказаны. Baseline сохранён и сравнён по diff/hash; количественного A/B baseline execution не было и этот PASS его не подразумевает.

Для воспроизводимости evidence scope закреплён также SHA-256:

| Артефакт | SHA-256 |
| --- | --- |
| `inputs.json` | `f15262784c9447fe053c9ec29a035296e6289d7a90b879f067f42de805257b03` |
| `results.json` | `121a0eb000cbbe1099828ca57490c04a938aa0e250e5375d45769ef607cb33eb` |
| `rubric.md` | `c8146918c6d4794e1144bdc199122bab00a263420a67c7d67a1cefe038957c1d` |
| `inputs.sha256` | `b8cec874b55516ffa427730b527b5fc9d3cc643e527de80346f8a30c3af337fb` |

## Решение и передача

**PASS, change / independent**, только для candidate aggregate `f93fb54b…786` и описанной evidence interpretation. Стабильность, source/package parity, отсутствие P1/P2 и соразмерное покрытие материальных claims подтверждены. Причины применять `FAIL`, `BLOCKED` или `PROVISIONAL` в этом scope не установлены.

Следующий владелец — root/implementation owner: записать этот verdict и фактические результаты trials в supporting log/README, затем продолжить уже разрешённый интеграционный маршрут с его отдельными checks. Обновление supporting статусов/ссылок может сохранить этот verdict только при неизменной active поверхности и evidence interpretation; его новый файл не покрывается прежним aggregate. Изменение методологии, governing source или смысла evidence требует нового snapshot и применимого повторного review. Этот отчёт не подтверждает завершение интеграции.
