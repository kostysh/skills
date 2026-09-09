# UI-REV — agent-browser 0.2.4, bounded re-audit

**PASS — AB-CLEAN-01 закрыт. P1: 0; P2: 0; P3: 0 в проверенной delta и её прямой regression/interop границе.** Это независимый verdict нового снимка; прежний FAIL `/tmp/ui-rev-final-browser.md` сохранён и не переписан. J/group acceptance, production, native activation и публикация исключены.

Mode `re-audit`; assurance `independent`: reviewer `/root/ui_final_browser_review` не менял candidate и не исполнял B2. Consumer — оператор, которому browser executor передаёт наблюдаемый результат и достоверное состояние собственных ресурсов. Applied basis — ранее прочитанные repository AGENTS/standard и skill-reviewer methodology/forward-testing. Новых испытаний/процессов reviewer не запускал, targets не изменял.

## Снимок

Target `/home/kostysh/.codex/skills/custom/.worktrees/ui-revision/skills/agent-browser`, source-version 0.2.4. `docs/reviews/ui-rev-20260908/candidate-v2-agent-browser-manifest.json`: 12 individual SHA256 сверены, mismatches 0. Aggregate SHA256 `b7c69bb74caa6e43eea8b5a5dfa56e430f80f1d80900f3425fd6ae2a44511ef1` вычислен из сортированных строк `file-hash + two spaces + skill-relative POSIX path + LF`. Root SHA256 `0b4d4c303431541c52bb44e5452be8604585a0a366d19abcbbc884276bb36e9d`.

Generated root идентичен `/tmp/ui-rev-20260908/candidate-v2-active/agent-browser/SKILL.md`. Root, CF reference и UI metadata byte-identical isolated compiled-v2 output. Readback source `skill.yaml:89–90` и generated `SKILL.md:110–111` совпал. V1→v2 root delta ограничена двумя cleanup/reporting steps плюс version/source hash; предыдущие CF/maintenance изменения остаются в уже проверенной области.

## Finding → correction → evidence

AB-CLEAN-01 P1 исходно: Ctrl-C/npm exit130 принят за cleanup, хотя child server продолжал работать. V2 требует actual termination, включая server child; parent exit не evidence; перед дальнейшим termination нужна ownership verification; недоказанный/работающий остаток сообщается без cleanup success. Это прямое уточнение существующего обязательства, не новый process-management workflow или полномочие на чужие процессы.

B2 `/tmp/ui-rev-20260908/results-browser-v2/raw-commands.json` прочитан с отдельным выделением cleanup entries (zero-based indices):

| Evidence | Наблюдение и значение |
| --- | --- |
| Entries 5–12 | Create total3→4; поиск и /items/4; после reload Name=Test UI-REV; Alpha/Beta и Gamma/Test UI-REV на двух страницах, final Next disabled; удаление только test record возвращает total3. Функциональная regression граница сохранена. |
| Entry13 `406c81` | Browser close возвращает Browser closed, но session list ещё показывает ui-rev-browser-v2. Executor не останавливается на этой неоднозначной строке. |
| Entry14 `8b2dff` | Последующий полный ps в owning shell показывает только sandbox/bash/ps, без browser/daemon; shell затем exit0. Это actual process readback, а не вывод из команды close. |
| Entry15 `6cec0a` | После сообщённого launcher exit130 TCP43801 всё ещё connect_ex0, listener_absent False. Исходный survivor failure path повторился и обнаружен. |
| Entry16 `dc9cb8` | Перед SIGTERM PID980862 assertions сверяют точный cwd candidate-browser-v2 и UI_REV_PORT43801. После сигнала: server_pid_absent True, esbuild_child_absent True, port_connect_ex111. Это наблюдаемое закрытие оставшегося ресурса. |
| Sentinel before/after | `/tmp/ui-rev-20260908/cleanup-sentinel-{before,after}.json`: соседний Python HTTP server PID980004 сохранил start/cmd/cwd и HTTP200. Направленная cleanup не остановила этот независимый ресурс. |

Outcome.md не скрывает промежуточную неудачу: завершение server заявлено только после проверки PID/child/port. B2 получает **PASS** по исходному B criterion, включая cleanup. Уже существовавший failure воспроизведён естественно на той же B задаче, поэтому ещё один искусственный запуск для обнаружения survivor не нужен. Достаточный обычный UI путь также выполнен успешно, без необоснованного blocked. Fallback при невозможности termination остаётся source-inspected, не отдельно исполненным; для закрытия конкретного P1 это не essential gap.

P1 screen: false cleanup closure исходного пути больше не поддерживается; текущий transcript показывает наблюдение остатка, ownership до сигнала и actual absence после него. Нет наблюдаемого kill-all, остановки sentinel или новых authority claims. General guarantee всех возможных child trees из одного trial не выводится.

## Прямая совместимость Node/CLI

Переиспользован `/tmp/ui-rev-neighbor-interop.md` только для неизменённой прежней границы. Затронутый AB delta дополнительно сопоставлен с accepted `/tmp/ui-rev-20260908/accepted-neighbors/node-engineer/SKILL.md` stages Apply/Verify, Interop и shutdown gotcha, и `cli-engineer/SKILL.md` Verify observable CLI capability/Interop. Все 42 файла двух соседей сверены с accepted-neighbor-manifest.json: mismatches0.

- Node0.1.4 full SHA256 `6c3d6df7848ed46acf0627c5da7c181153dd8435aa3810e282d1197adc4d6995`: Node владеет signal/process/server semantics и runtime remediation. AB требует наблюдения фактического завершения собственных task resources; не объявляет SIGTERM graceful shutdown, не устанавливает причину signal delivery, не предписывает менять приложение. Это совместимо с Node запретом выводить graceful completion лишь из server.close().
- CLI0.2.1 full SHA256 `71cdf688c56854b42bd6d8b0ccf0328cdbe7b3fb1e26dcb4a35f21a514f19544`: CLI владеет argv/exit/output/install contract и требует наблюдения side effects. AB уточняет, что exit launcher не доказывает child termination; CLI exit semantics не меняются. Browser operational use не превращён в CLI authoring/packaging requirement.

**PASS source-level direct interop для этой delta.** Новая общая Node/CLI ревизия не проводилась; compatibility prose не выдаётся за выполнение всех runtime/installed-bin путей соседей.

## Проверки и limits

Авторский candidate-v2-author-check фиксирует lint/regenerate/check/isolated compile exit0; independent readback подтвердил source/generated/active/compiled parity. Прежние 108/108 mandatory CI переиспользованы: delta instruction-only, compiler/runtime/test code не менялись. Повторные CI и новые trials этим reviewer не запускались.

По coordinator B2 — fresh nofork Astra, ровно исходный B input с заменой paths/port/session, без diagnosis/rubric; sentinel executor не подсказан. Это основание для blind execution characterization, не независимая проверка serving model или полной filesystem isolation. Runtime exact model/effort не раскрыт executor. Raw JSON содержит существенные действия, но не полную непрерывную telemetry: сам Ctrl-C/exit130 сохранён в outcome, а не отдельным raw JSON event. Вывод не зависит от приравнивания этого exit к cleanup: before/after port и PID checks напрямую сохранены. Причина OS/sandbox signal delivery не установлена и не требуется для bounded closure.

Browser evidence — local synthetic HTTP, no interception по executor; network POST201/GET200/DELETE200 реально записан. Container runtime workaround и начальные ошибки сохранены; это не проверка production security либо внешней интеграции. Browser process absence подтверждено в owning sandbox namespace; не заявляется аудит всех host browser resources. Sentinel before/after подготовлен автором, оценён reviewer отдельно от executor summary.

Неизменённые AB applicability/CF/metadata, четыре другие UI skills и прочие neighbor boundaries повторно не аудировались. Следующий consumer — координатор UI-REV: включить новый bounded PASS, сохранив первичный FAIL/RCA; завершить отдельно J и установленную общую приёмку. Этот verdict не авторизует publication.
