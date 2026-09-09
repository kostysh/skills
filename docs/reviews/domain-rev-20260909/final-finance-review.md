# financial-calculations-engineer 0.3.1 — независимый CHANGE review

**PASS в заявленной ограниченной области.** Неразрешённых P1/P2 в изменённом финансовом скиле и необходимых неизменённых контрактах не установлено. Исходные противоречия устранены; поведенческие свидетельства подтверждают достаточный локальный расчёт, переносимость API и формулы, честную границу parity и пригодный downstream handoff с возвратом реального исполнения. Это не сертификат любой финансовой реализации или production readiness.

## Основание и границы

Mode: `change`; assurance: `independent`. Reviewer не автор target, не исполнитель его исправлений и не author self-check. Base: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`; worktree `/home/kostysh/.codex/skills/custom/.worktrees/domain-rev-20260909`. Полный manifest `docs/reviews/domain-rev-20260909/final-target-manifest.json`, SHA256 `5354de2ff05fc1117ea991c09ec1db1f92dc274499c2ecad2f72ddb4a765496e`. Все 16 финансовых entries повторно пересчитаны и совпали. SKILL.md SHA256 `a8b86fa481a66d016020bb1eecd951ebe04f29a5d2a2ae9182dc0d4eb42f1688`.

Потребитель — агент, реализующий или проверяющий принятую денежную формулу, затем владелец соответствующего Node/SQL/spec handoff. Успех: exact minor units, авторитетные currency/scale/rules, сохранение фактического API/DTO, correct sign/rounding/range, наблюдаемая проверка только заявленных границ. Anti-claims: скил не устанавливает налоговую применимость, валютные метаданные, FX policy, бухгалтерские правила или юридическую законность.

Прочитаны repository/target AGENTS, skill-standard, skill-reviewer и обязательные methodology/forward-testing, implementation-discipline; source skill.yaml, emitted SKILL.md, fragment, все шесть активных references и UI metadata. Проверены baseline findings, фиксированные criteria, author self-check, structural/isolated evidence, реальные чистые F01–F08 outputs и implementation files. Прямые неизменённые product/architecture/spec/code-review boundaries просмотрены только для нового handoff; соседние skills не аудировались. Предыдущий промежуточный отчёт: `/tmp/domain-final-finance-source-review.md`.

Reviewer выполнял только чтение, hashing, JSON readback и запись отчётов в /tmp. Runtime не импортировался и не перезапускался, target не менялся. Exit 1 от diff SPEC-initial/SPEC означает ожидаемые различия, не неуспешную проверку.

## Closure mapping

| Исходная проблема | Исправленный контракт и свидетельство | Решение |
| --- | --- | --- |
| F-FIN-01: обязательный пример API/DTO/global settings противоречит discovery/local fallback | Root и money-library/server/browser/VAT references делают профиль условным; actual API или local formula сохраняют финансовые гарантии. F01 реализует readMinor/mulDivMinor с unit/value; F02 — локальный JPY без engine; F07 — совместимый EUR API/DTO. | Закрыто |
| F-FIN-02: stop даже при разрешённом source precedence | Workflow отличает outdated implementation от unresolved authority. F06 применяет CONTRACT-D и получает 250; F08 блокирует только конфликтующую политику, завершив известную арифметику и поля. | Закрыто |
| F-FIN-03: безусловная sign symmetry | Workflow требует symmetry лишь для обещающих её mode/operation и различает reversal/new negative calculation. F01 floor: 3→1, −3→−2; F07 half-away: ±0.03→±2 cents. | Закрыто |
| Conditional references и downstream handoff | Все шесть references required с явными triggers. Новый handoff называет owner/output/return evidence, не требует новых design artifacts для локального исправления. J01 producer → SPEC → implementation → real observations → domain reassessment завершён. | Подтверждено |

P1 screen: не найден поддержанный путь silent policy invention, опасного действия, ложного завершения или систематической неверной маршрутизации. Не найден и отдельный P2 путь из несогласованных обязательных API, fallback, portability или evidence claims. Поэтому таблица содержит закрытые проблемы, а не новые findings.

## Поведение и J01

Чистые F01–F08 соответствуют фиксированным критериям. F03 не подставляет неизвестные currency/units/rate; F04 не создаёт ложное замечание; F05 не закрывает SQL/application/persistence через unit tests/build. S02/S06 выбирают finance для EUR allocation и JPY parity; смежные S03–S05 выбирают соответствующих владельцев. Это ограниченная catalog selection, не доказательство host auto-loading.

Прочитана J01 цепочка из `docs/reviews/domain-rev-20260909/candidate-joint`: input, producer handoffs, SPEC-initial и count clarification delta, финальный SPEC, runtime-report, service/schema/run, raw evidence, final financial reassessment и граница отдельного GDPR reassessment. Проверены baseline финансовый reassessment/сравнение и общий literal oracle. Consumer сохраняет PREVIEW-1, требует реальный readback и возвращает узкий вопрос count владельцу; полученное уточнение не меняет финансовую формулу.

Независимый read-only разбор candidate evidence подтвердил 160 expected/actual assertions без расхождений. Код run.mjs действительно вызывает psql через service, использует фиксированные числовые литералы и отдельные SELECT, а не mock или implementation-as-oracle. Число 160 включает нефинансовые проверки и не является сравнительной метрикой качества.

Финансовые наблюдения: восемь literal fixtures через Node, PostgreSQL, service JSON и export; положительный/отрицательный floor, zero, quantity10, >2^53, MAX/MIN int64. MAX-node/MAX-sql дают fee `4611686018427387903`; EXACT service сохраняет `9007199254740993`/`4503599627370496`; MIN export сохраняет `-4611686018427387904`. Негативные service cases и прямые SQL cases сохраняют отказ до записи и readback. Дополнительные SQL NULL вызовы теперь возвращают `invalid calculation input`.

Сверенные runtime hashes:

- service.mjs: `b0d3000ef20117a5f566cbeceddd2cb6b9f9e7291ce61a8d3b638cc79ae8f2c3`;
- schema.sql: `4629a5968c60accd72dc7316eaf1a413ee46ba9ca6826325216c65489f3ec126`;
- run.mjs: `c2e55feb3a0054fe9fa5202899136b9a1a55ae4f782611a61b466a537f6b706f`.

Первоначальные SQL division и NULL ошибки временной реализации не скрыты. MAX ошибка выявлена literal oracle, NULL — дополнительным root readback; финальное заключение относится только к исправленному snapshot и повторному evidence. Это ограничивает утверждение о самостоятельном первом проходе: финальная цепочка подтверждает обнаружение/исправление/возврат доказательств, но не безошибочную первую реализацию и не независимое обнаружение NULL самим доменным executor. Исходный skill не предписывает ошибочный SQL; требует real-boundary error/range evidence, и финальный re-check соответствует этому контракту.

## Проверки и пределы

Использованы предоставленные успешные finance lint/check/isolated compile, link/readback и quick validation; test:ci — 108 passed. Это structural/package evidence, не основание behavioral PASS само по себе. Target оставался неизменным; evidence соответствует финансовому trial snapshot. Обе версии прошли те же standalone/selection criteria, поэтому улучшение success rate и статистическая надёжность не установлены.

Blindness отделена от review independence: fresh batch executors получили active skill и обычные синтетические входы, без rubric/diagnosis; изоляция instruction-only на общей FS. Первый contaminated candidate finance run исключён целиком, учитывается candidate-finance-clean. Поздний guided runtime repair не выдан за blind initial success. Назначенные model/settings известны из provenance, backend model ID отдельно не подтверждён.

Реальная проверенная граница J01 — временный прямой service → PostgreSQL 18.4 → persist/readback/export. HTTP listener/wire, browser, concurrency, arbitrary crash recovery, external ledger, production и реальные правовые/налоговые операции не проверены. Error parity означает требуемое отклонение, а не одинаковые тексты/коды всех исключений. Частные fixtures не доказывают все строки, любые знаменатели или универсальную арифметическую правильность. Политики и scope синтетического кейса остаются входными фактами. GDPR correctness не присвоена финансовому review.

Эти пределы не препятствуют PASS для заявленного bounded skill CHANGE: source conflicts закрыты, material pathways имеют пропорциональные samples и реальную downstream boundary, claims не превосходят evidence. Следующий владелец — ведущий maintainer: включить данный независимый verdict и limits в implementation log и продолжить только уже авторизованный acceptance checkpoint. Этот review не разрешает commit, push, publication или merge.

Административное уточнение после исполнения: по сообщению ведущего агента временный PostgreSQL container удалён с проверкой отсутствия (`resource-cleanup.json`). Исторические runtime observations сохранены; повторный живой запуск в данном review не выполнялся. Утверждение о работающем сейчас контейнере не делается.
