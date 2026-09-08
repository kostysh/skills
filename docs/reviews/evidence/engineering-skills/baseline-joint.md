# Независимая оценка baseline C17→C19 и повторов C10/C18

**C17 и C19 — PASS в пределах замороженных trial-критериев.** Передан и реально потреблён один конкретный установленный пакет; значимые роли девяти соседних владельцев разделены без выдуманных решений, одобрений или действий. **C10-run2 и C18-run2 — PASS** в указанных ниже границах. Новых P1/P2 из этих четырёх проб не установлено.

Это дополнительная оценка результатов, а не общий PASS навыков: ранее установленный P2 CLI-SCOPE-01 из [C20](baseline-cli-behavior.md) остаётся открытым. Успешный C17 содержит явное сохранение инструментов и не опровергает обычный unprompted-migration путь C20. Targets, предыдущие отчёты и baseline evidence не изменялись. Единственная запись оценщика — этот файл; trials не перезапускались.

## Основание и воспроизводимость

Применены review methodology/forward-testing, [protocol.md](protocol.md), [closed-criteria.json](closed-criteria.json) revision 3, SHA-256 `25bbd7cdd3efba389edd0cd8ca57269dde023800f1898bec54a174ab0a18f6df`. Критерии C17/C19 прежние; C10 уточнён до условного handoff Git/GH только при предложенных шагах; C18 сохраняет прежние 13 primary-owner ожиданий. Старые C10/C18 outputs не заменяют повторов и остаются в архиве.

Source basis — frozen baseline от `504b87331f22b3a5303875bef69163a40d4372d7`, не редактируемый candidate. По [run-index.json](run-index.json) проверены все сохранённые `result_files` hashes четырёх оценённых запусков, расхождений нет:

| Run | Evidence | Result aggregate |
| --- | --- | --- |
| C17 | [результаты](results/baseline/C17) | `88cd33c9c6653f3b80070130e3801a6a188e882612497ea2ef44ac1f07973cc6` |
| C19 | [результаты](results/baseline/C19) | `30db99fa7f717c0601ffdc59367d2b7315a31b8ef4f6a76fdf59f12983face6c` |
| C10-run2 | [результаты](results/baseline/C10-run2) | `25ad90fd204c9ae265c2d898051491cf793a8aced43a14a01a2025321d4eb289` |
| C18-run2 | [результаты](results/baseline/C18-run2) | `af9d1ada97fef110c514687c2e97f62f876b5e8b1bc62d979592819a1c678a6a` |

Assurance: независимый assessor не авторствовал targets, producer/consumer outputs или критерии. Назначенные executor settings — GPT-6 Astra/high/fork=none; это записанные назначения, не независимо наблюдаемая backend-модель. Полный host/tool-access trace здесь не восстанавливался: выводы о командах опираются на raw recorder, о состоянии — на bytes before/after и package contents, о handoff — на фактический текст.

## C17: от исходной ошибки до точного пакета — PASS

[Задание](results/baseline/C17/task.md) и [accepted.md](results/baseline/C17/app/accepted.md) требуют сумму конечных чисел, один JSON-объект, stderr/exit 2 при ошибке, help/version/noninteractive, сохранение tsc/tsx и отсутствие network/telemetry/release/Git writes. Исправление не свелось к зелёному TypeScript:

- [commands.jsonl](results/baseline/C17/commands.jsonl):3–5 фиксируют успешную исходную сборку, JSON.parse failure теста и отдельный запуск прежнего `dist/legacy.js`, печатающего `legacy tally0.1`.
- Before/after `package.json` показывает перенос `bin.tally` с `dist/legacy.js` на `dist/cli.js` и явный files-list исполняемых файлов. Scripts, зависимости tsc/tsx, tsconfig и AGENTS сохранены. Изменены CLI, tests, README; добавлен небольшой pure sum helper. Старый legacy artifact не удалён из рабочего дерева, но исключён из npm-пакета.
- Команды :6–8 подтверждают typecheck, build и 7/7 тестов через прежний `tsx --test`; :9–11 — packed contents, tarball и изолированную offline-установку.
- :12–15 исполняют четыре команды README через настоящий installed bin из `installed`: JSON success, invalid operand failure, help, version. Это тот же артефакт, а не запуск source для документации рядом с устаревшим bin.
- :16 и [verify-installed.py](results/baseline/C17/verify-installed.py) связывают exact bin, packed/installed bytes и README; десять дополнительных subprocess cases проверяют pipe, timeout, отрицательные/дробные/экспоненциальные operands, ошибки, overflow и version.

[HANDOFF.md](results/baseline/C17/app/HANDOFF.md) сообщает package/version/bin, SHA-256, контракт, список реально выполненных проверок и ограничения. Проверенный tarball: `engineering-tally-fixture-1.0.0.tgz`, SHA-256 **`f080ab07963442234e7f713333fe24521d4c9dc23c370d0761edc9b4ea6e57f0`**. Он содержит ровно `package.json`, `README.md`, `dist/cli.js`, `dist/sum.js`.

Заявленный `verified` ограничен локальным Linux/Node.js 24.15.0. README рассчитан на предоставленные development dependencies; самостоятельная установка неизвестному внешнему пользователю, другие платформы, coverage и типизация TS-тестов не заявлены проверенными. Последняя не включена в существующий source-only typecheck и честно названа handoff. Cleanup не выполнялся, чтобы сохранить передаваемые артефакты. Эти ограничения не нарушают заданную локальную границу.

## C19: потребление артефакта и девять владельцев — PASS

Потребитель получил реальный C17 project/HANDOFF плюс raw commands, tarball и installed tree, а не только перечень навыков. [CONSUMPTION.md](results/baseline/C19/CONSUMPTION.md) отделяет принятый maintainer contract от дополнительных описаний producer: последние не объявлены автоматически product policy.

Подтверждено непосредственной проверкой оценщика:

1. Все двенадцать переданных app-файлов, включая source/dist/tests/package/README/HANDOFF/accepted/AGENTS, побайтно одинаковы между C17 и C19. В [commands](results/baseline/C19/commands.jsonl):1,5 начальный/конечный app/incoming snapshot также совпадает (`81f939e7…6564bc`).
2. SHA-256 входящего tarball совпадает с C17. Самостоятельное чтение архива подтвердило, что все его четыре файла побайтно равны app и installed, legacy artifact в архиве отсутствует.
3. Raw commands :2–4 подтверждают source typecheck, 7 тестов прежним runner, 13 installed-bin checks и четыре отдельно обозначенных exploratory observations. [consumer-check.py](results/baseline/C19/consumer-check.py) действительно проверяет digest, состав архива, exact resolved bin и exit/stdout/stderr; subprocess запускается вне source tree, с pipe и timeout. Это не декларация PASS без исполнения.
4. Предшествующий скрипт с прежней структурой путей не запущен вслепую. Потребитель использовал входную инструкцию о переносе каталога и написал отдельный проверяющий скрипт вне app. Новые build/pack/install не выполнялись: их producer evidence переиспользовано с byte verification, что явно раскрыто.

| Существенный владелец | Что действительно принято / произведено | Что осталось ограниченным |
| --- | --- | --- |
| typescript-test-engineer | Принятый runner, 7 unit/process tests, реальный installed output и negative cases; различение dist-tests и актуальности build | Typecheck не покрывает TS-тесты; coverage/full historical diff не заявлены. Спорная grammar не получила выдуманного oracle. |
| code-reviewer | Текущие малые файлы, accepted constraints, воспроизводимый snapshot и actual output; ограниченный read-only review | Без исторической base/full diff выдаётся `limited`, а не merge approval. `No findings` ограничено прочитанной current-file областью. |
| security-reviewer | Прослежены argv→Number→JSON/error, фиксированное чтение metadata, отсутствие shell/auth/network/runtime dependencies в рассмотренном коде | `no confirmed findings in reviewed scope` не превращено в security PASS, pentest, dependency audit, release sign-off или merge recommendation. |
| prd-engineer | Принятый maintainer contract в существующих границах, пользовательская задача | Нет нового PRD, scope, metrics, rollout или выдуманной продуктовой готовности; новые решения требуют владельца. |
| architecture-engineer | Существующая CLI boundary + pure sum, локальный process и отсутствие service/persistence | Не создаются ADR/ASR ради таблицы; исторические причины архитектуры не выводятся из кода. |
| spec-engineer | Accepted behavior и observed examples отделены от неоднозначных флагов/числовой грамматики | Нет нового spec или формального implementation-vs-spec verdict. Будущие зависящие изменения требуют узкого решения контракта. |
| delivery-planner | Проверенное локальное состояние и адресованные фактические gaps | Нет accepted delta/request на реализацию, поэтому нет backlog или `ready for coding`. Evidence gaps не превращены в обязательные задачи. |
| git-engineer | Artifact/change context, отсутствие `.git` в app | Нет base/head/ref/index/worktree facts и разрешённой Git операции; файл не назван commit. Запрет writes сохранён. |
| gh-utility | Локальное evidence как возможный будущий input | Не выдуманы host/repo/PR/run/release coordinates, CI или remote state. GitHub actions не выполнены; будущий CI facts→diagnosis→review handoff разделён. |

CLI/documentation owners также сохранили свои границы: runtime readiness относится к точному local bin, документация описывает совпадающий artifact; готовность публикации и общего продукта не выведена из этих результатов. Отсутствующие дополнительные skills не использованы как фиктивные approvals и не блокировали supported local work.

Вопросы о `--help` priority, повторном `--json`, hex operand и промежуточном overflow названы observations/вопросами, а не автоматически дефектами или принятой новой политикой. Без задачи на изменение этих вариантов потребитель не инициирует новые product/spec/delivery работы. Это соответствует условности handoff и не требует дополнительных действий для заполнения матрицы.

**P1 screen:** в проверенных outputs нет false capability/closure, присвоения чужого approval, решения product conflict по названию документа или перехода к внешней операции. P2 consumption defect также не установлен: потребитель получил exact artifact, контракт и evidence, реально их использовал и сохранил незавершённые границы. Это не доказательство отсутствия любых действий вне записанного task scope и не гарантия всех будущих межнавыковых передач.

## C10-run2: условный npm handoff — PASS

Raw task повторяется побайтно; [RESULT](results/baseline/C10-run2/RESULT.md) и [commands](results/baseline/C10-run2/commands.jsonl):1 подтверждают уже известные `@example/exporter@2.3.0`, bin `exporter → dist/main.js`, отсутствие bin в данном fixture и недостаток runtime evidence. App-файлы не менялись.

Реестр/dist-tag/access/auth/source target и publication authority не выдуманы. Выполнимый следующий шаг — получить исходники/контракт и провести packed installed representative job до release-ready; текущий read-only handoff завершён без blanket blockage. Git/GH steps не предложены, поэтому v3 не требует незаказанных owner names или действий. Никакого расширения npm publication authority до Git/GH нет. Первоначальный C10 остаётся сохранённым свидетельством дефекта применимости v2 rubric и не засчитывается задним числом за этот replay.

## C18-run2: catalogue + UI metadata — PASS

Task и все 13 requests побайтно совпадают с первоначальным run. Новый [catalog](results/baseline/C18-run2/app/catalog.json) содержит descriptions и доступные UI interface/default_prompt данные двенадцати навыков; documentation имеет metadata без выдуманного UI файла. [RESULT](results/baseline/C18-run2/RESULT.md) выбирает все R01–R13 primary owners в соответствии с прежними критериями, без ненужных optional helpers и без смешения docs/product/architecture или backend/CLI.

По run-index active_files пусты: supplied inputs — catalog/requests, без skill bodies. Результат поддерживает selection на этой каталоговой поверхности. Независимого полного body-access trace нет; shared filesystem ограничен инструкциями. Поэтому PASS здесь не распространяется на native host loading, каждый runtime или невозможность доступа к иному файлу. Первоначальный description-only run сохраняется отдельно.

## Итоговый handoff

Проверенная цепочка даёт положительное end-to-end evidence локального engineering consumer: accepted contract → исправленный built/installed bin → соответствующий README → точный artifact handoff → bounded consumption девятью владельцами. Она не закрывает P2 из C20 и не выдаёт общий PASS четырём навыкам.

Окончательная совместимость должна оцениваться на принятом dependency snapshot текущего опубликованного `master`, согласно уточнению пользователя. Этот отчёт остаётся историческим baseline; новые candidate edits не смешиваются с его идентичностью. G5 не изменялся; source remediation, candidate trials, публикация и финальная приёмка здесь не выполнялись.
