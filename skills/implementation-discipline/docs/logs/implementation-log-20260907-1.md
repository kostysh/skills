# Ревизия implementation-discipline: группа 1

Русский; ID `implementation-log-20260907-1`. Отдельный issue не создавался: исполнение принятого [плана implementation-plan-20260907-2](../../../../docs/plans/implementation-plan-20260907-2.md), группа 1. Исходная база `4ddcb698457a741028664ed9af441009c4838d23`; рабочая ветка `codex/skills-revision`. Все изменения сделаны после создания отдельного worktree. Группы 2–4 и публикация не выполнялись.

## Результат и границы

Source-version `0.2.6 → 0.2.7`. Уточнены основания локальной коррекции и полномочия владельца требований; обозначения conditional references согласованы с условиями чтения. Scope delta относительно исходного принятого плана: unchanged. Unauthorized additions: none. Дополнительное правило native planner оператор сначала запросил, затем явно отменил; оно отсутствует в итоговом source/generated. Официальный [changelog](https://learn.chatgpt.com/docs/changelog) подтверждает disabled-by-default planning tool; конфигурация Codex не менялась.

Capability — исполнитель делает разрешённую ограниченную коррекцию по достаточному основанию либо даёт честный ограниченный вывод, автор передаёт потребителю требования с реальным владельцем. Source/generated и этот журнал — substrate. Проверки синтетических задач не доказывают универсальной надёжности, улучшения baseline, работу настоящего редактора или native UI.

## Findings → изменения → evidence

Независимая [baseline-ревизия](../reviews/baseline-20260907-1.md): FAIL, два P2 и P3, на уровне нормативных failure paths. Автор исправлений — координатор; baseline reviewer и оценщик не являются авторами candidate.

| Основание / владелец | Корневой путь и прямое исправление | Falsifier / результат / статус |
| --- | --- | --- |
| F1 P2 / implementation-discipline | Безусловный exact original witness мог запрещать независимо поддержанное локальное исправление. В workflow, validation и verification-loop разделены основание коррекции, доступный replay и предел deployed claim; соседняя гипотеза не разрешает правку. | Cases01/03/09: реальная коррекция с red/green, diagnosis-only без мутации, локальный fix при недоступной исходной среде — PASS обоих вариантов. `verified` в этой границе; исходный ошибочный отказ в прогонах не воспроизведён. |
| F2 P2 / implementation-discipline | Universal customer chain могла навязать несуществующий approval. Требования теперь опираются на владельца из действующего governance; реальный customer gate сохранён. Workflow/validation/source-authority policy согласованы. | Cases10 internal/customer и фактическая цепочка06→spec-engineer — PASS обоих вариантов; `verified` для поддержанного owner/handoff поведения. Не доказано поведенческое улучшение baseline. |
| P3 / implementation-discipline | Две conditional references были названы optional при обязательных Read when/before triggers. Required classification согласована, условия чтения не расширены. | Lint/check, source/emitted parity и active readback — PASS; `verified` как структурная согласованность. Фактический прежний пропуск reference не заявляется. |
| Отменённое дополнение / оператор | Policy planner и start-here entry удалены по прямому решению. Промежуточные source/trials сохранены отдельно. | `not-applicable`: cases07/08 и superseded candidate13–19 исключены из итоговой приёмки. |

У изменений нет нового runtime, UI metadata, API, механизма делегирования или внешнего обязательного файла. Domain ownership, read-only режим, запрет самоавторизации через derived artifacts и пределы публикации сохранены. Настоящий customer-owned scope не становится решением произвольного оператора. Эти решения устраняют двусмысленность инструкций и сохраняют downstream-границы.

## Проверки

Author self-check по skill-source-compiler: ready-to-regenerate перед первоначальной генерацией; после отмены planner выполнены повторная генерация и fresh trials нового стабильного пакета. [Evidence](../reviews/evidence/g1/README.md) содержит self-check, source diff, исходные и итоговые пакеты, manifests, реальные tool events и файлы.

Собственные compiler lint, source check, isolated compile и emitted check проходят; девять emitted файлов побайтно совпадают с source. Активные ссылки существуют, machine-specific обязательных путей нет. Root 18492 bytes; advisory ceiling не повышался. Runtime compiler не менялся; у target нет package-local runtime/tests или UI metadata. Поэтому отдельный выдуманный test runner не добавлялся. Полный repository CI предусмотрен после группы 4, сейчас не запускался.

Вспомогательный skill-creator quick_validate отклоняет существующее frontmatter compatibility одинаково на baseline и final. Это известное несовпадение allowlist вспомогательного валидатора с используемым форматом; результат сохранён как exit 1, не выдан за PASS и не исправлялся удалением корректного поля.

[Независимая оценка испытаний](../reviews/assessment-20260907-1.md): 9/10 пар PASS, case04 INCONCLUSIVE для буквального null/undefined-критерия, который отсутствует в C-1. Поддержанная C-1 часть обоих outputs корректна; конкретная nullish-семантика проверена другими источниками в cases01/06/10. Критерии задним числом не изменены, неподдержанная претензия не принята. Два реальных downstream consumer outputs — PASS. Каталог: пять запросов в одном контексте на вариант, отдельно от принудительного применения.

Все учитываемые 22 исполнения — fresh/no-fork, настройки назначены inherited без overrides. Эффективные platform settings и полный системный контекст независимо не измерены. Изоляция инструкциями на общей FS не является OS sandbox. Основные 35 и дополнение16 исходных файлов сохранили хеши; составитель дополнения09/10 знал baseline diagnoses, исполнители не получали их или рубрику. В двух consumer traces обрезаны крупные stdout чтения; реальные входы и outputs сохранены целиком. Наблюдаемой утечки критериев и запрещённых мутаций не установлено. Полная исходная raw-серия сохраняется, включая superseded/withdrawn результаты; они не смешиваются с финальными.

## Статус и продолжение

Изменения и ограниченная проверка завершены. [Независимый re-audit](../reviews/evidence/g1/final-audit.md): **PASS, assurance independent**, F1/F2/P3 закрыты; отсутствие поведенческого преимущества baseline и case04 INCONCLUSIVE сохранены. Reviewed identity `G1-FINAL-NO-PLANNER-v1`, 132 файла, aggregate `b773d8218c2bdc38057b51e2e082374ef68558355a640e5f430a6d5bd328f054`; [snapshot](../reviews/evidence/g1/final-review-snapshot.json). Аудитор `/root/g1_final_audit` не автор/исполнитель/оценщик. Последующий delta — только точные report/readback/snapshot и статусы/ссылки журнала и общего плана; active/emitted и raw evidence не менялись. Это разрешено аудитором без повторного полного аудита. Далее разрешены отдельные локальные commit скила и общего статуса, затем приёмка группы 1. **READY FOR OPERATOR ACCEPTANCE** после фиксации; группы 2–4 не приняты. Публикации нет. Откат — восстановление scoped source/generated из Git baseline с сохранением evidence и соседних изменений.
