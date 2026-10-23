# Независимый аудит простоты: CLI CI, C1

**PASS простоты для C1.** Правило `cli/** text=auto eol=lf` — достаточный прямой Git primitive для установленной причины сбоя форматирования. Лишних концепций нет. Verdict относится только к этому стабильному delta; последующие изменения требуют нового bounded review до следующих аудитов.

Lean already for the reviewed scope. No findings.

## Основание и границы

Режим: read-only complexity-only bounded delta audit; автор реализации не выносил этот verdict, делегирования не было. Применены implementation-discipline (core-principles, verification-loop) и code-reviewer (diff-completeness, findings-format, severity-confidence, complexity-only). Прочитаны действующий и скопированный root AGENTS.md. Скилы и инструкции в этом delta не меняются; skill-maintenance workflow не инициирован.

База: `6ae886651550752d704212599c88ba3281760a9b`, исходный CLI commit PR #31. Текущий snapshot: `/tmp/kskills-ci-review-zk5m8p_0/snapshot`; manifest `../manifest.json`; 50 файлов; aggregate SHA-256 `29bba64c70a93bdc26a0515ea6e6ea5bd2c28f860ad71703a2740aef6189d97e`. Все 50 индивидуальных SHA-256 сверены в начале и в конце; итоговый aggregate независимо пересчитан как sorted `UTF8(path) + NUL + raw(bytes) + NUL` и совпал. Manifest SHA-256: `e6d7febb8e30f13a422cd17b4306d44de0e257fc5749aabfeb6c7b36aa52e658`.

Сравнение всех manifest files с базой подтвердило ровно два изменения: новый `.gitattributes` (1 строка) и добавление CI-записи в `cli/docs/implementation-log-20261023-1.md` (18 строк). Delta прочитан полностью, 2/2 файла accounted/read. Остальные 48 файлов не изменены и не переаудировались целиком. Для контекста прочитаны прежний simplicity-r3 PASS, CLI workflow, package command и Biome configuration. В базе нет tracked `.gitattributes`, которые требовали бы согласования иерархии attributes.

Целевой инвариант: Git checkout при `core.autocrlf=true` материализует CLI text с LF, сохраняет auto-detection binary и не меняет line-ending policy вне CLI. Потребители — разработчики и existing CI трёх ОС. Это устраняет препятствие для уже согласованного CLI, не добавляя функцию продукта. Допустимая мутация аудита — только отчёт и disposable evidence в `/tmp`; snapshot и task worktree не менялись.

## Простота решения

- Одно scoped declarative правило использует существующую ответственность Git за checkout. Оно не добавляет normalization script, dependency, OS branch, workflow step или caller configuration.
- `cli/**` охватывает существующие source/test/config files и вложенные папки CLI. Более широкое repository rule не нужно для установленного failure path. Более дробный перечень расширений добавил бы maintenance surface без текущей необходимости.
- `text=auto` сохраняет auto-detection binary, а `eol=lf` закрепляет требуемые окончания текстов. Удаление правила возвращает воспроизведённый сбой. Доказанного более простого равноценного решения нет.
- Formatter и обязательные проверки сохраняются; их ослабление не является допустимым упрощением. Журнал хранит witness, причину, bounded correction и оставшуюся CI-проверку без нового процесса или реестра.

## Evidence

Независимый disposable fixture: `/tmp/kskills-ci-simplicity-rck607xj/repo`; результат `/tmp/kskills-ci-simplicity-rck607xj/evidence.json`. Git 2.53.0, `core.autocrlf=true`, отдельная локальная конфигурация без global/system attributes. Fixture использовал точные bytes candidate `.gitattributes`.

1. До attributes `git checkout-index` записал CRLF в nested CLI text и outside CLI text.
2. После добавления candidate rule и повторного checkout CLI text стал исходным LF.
3. Binary с NUL и CRLF остался byte-identical до и после.
4. Outside CLI text сохранил прежние CRLF; `git check-attr` показал `text/eol: unspecified` вне CLI, `text: auto` и `eol: lf` внутри CLI.

Прочитан supplied native Windows format failure: `/tmp/kskills-pr31-windows-first-failure.log`; он содержит CRLF formatter diffs. Также прочитаны supplied reproduction `red.log` и `green.log` в `/tmp/kskills-pr31-eol-p9ilk82m`: исходный форматный отказ и `Checked 21 files. No fixes applied.` после attributes. Эти package-command запуски выполнены автором; независимый полный format-check здесь не повторялся, так как собственный fixture напрямую проверил единственный новый primitive и его blast radius.

Review basis: PR #31 / `codex/skills-cli`, base `6ae886651550752d704212599c88ba3281760a9b`; C1 snapshot `29bba64c70a93bdc26a0515ea6e6ea5bd2c28f860ad71703a2740aef6189d97e`.
Scope: complexity-only C1; 2/2 changed files inspected; 48 unchanged manifest files excluded from renewed full review; 50/50 hashes and aggregate stable.
Evidence: полный delta, base comparison, scoped config inspection, независимый red→green Git checkout fixture с binary/outside-CLI controls, supplied Windows failure и author format red/green logs.
Limits: общий correctness/spec/security/performance/accessibility/release verdict не выдаётся. Нативный Windows runtime, вся CLI suite, macOS/Linux CI и новый последующий test-only fix не оценены этим аудитом. PASS C1 не означает PASS трёх ОС или разрешение npm/merge/tags. После C1 родитель сообщил об отдельной Windows test incompatibility с --import absolute drive path; она находится вне этого snapshot и требует нового bounded audit.
Recommendation: limited
