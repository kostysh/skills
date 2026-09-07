# Свидетельства CP3

Supporting evidence для задачи3 и итогового аудита методологической базы. Эти файлы не становятся active instructions и не являются постоянным harness.

- `cases/` — frozen inputs десяти execution cases и catalog case11 (6 requests в одном контексте на вариант).
- `criteria-and-input-manifests/` — независимые rubric/coverage, freeze205files и initial manifests22runs. Fixtures+criteria зафиксированы до candidate edits.
- `target-evidence/` — два реальных предварительных применения маленького target skill с outputs и public traces. Они заменили черновые synthetic записи до freeze; их raw snapshots включены в cases.
- `packages/{baseline,candidate}/skill-reviewer` — полные emitted пакеты, включая historical supporting documents; сравниваются отдельно от trialcopy.
- `trial-package-policy.json` — executioncopy содержит SKILL/references/UI без reviewer history; catalogcopy содержит только parsedcards. Исключённая история не меняет active contract. Целевой historical note как часть проверяемого материала остаётся в своём case.
- `baseline-manifest.json`, `candidate-manifest.json`, `source-diff.patch` — source identities и supporting tracked diff. Baseline13files соответствует reviewer из базы f4c9eec590047ea7c5dd01d72532e2e92b52bb94. Candidate14files включает source-only implementation log, не входящий в compiled package.
- `results/run-NN.md` — фактические reports; `results/run-NN-events.json` — прямые public app event records. Только reasoning исключён. Все страницы completed и hasMore=false; stdout больших чтений усечён на app limit20000chars. Не утверждается полный stdout всех команд. Исходные прочитанные файлы отдельно сохранены.
- `coordinator-readback.json` — все22run inventories/hashes: единственное добавление result.md, нет изменений/удалений input или reviewer.
- `execution-context.json` — recorded dispatch/model settings, thread identities, counts, durations и truncation locations. Настройки назначены координатором, не независимо выведены из trace.
- `structural-checks.json`, `author-readback.json`, `author-self-check.md` — авторская/структурная проверка, не independent review PASS.

Воспроизведение: новый run folder с одним `cases/case-NN`; для execution добавить active subset выбранного полного package как `reviewer/`, для catalogue добавить reviewer-card из parsed frontmatter и UI. Baseline01..11, candidate12..22 соответствуют cases01..11. Передать только frozen prompt, local input paths и ограничение чтения/единственной записи result.md. Criteria, соседние runs, reviewer history и ожидаемый результат не передавать. Предыдущие findings в re-audit — необходимые taskinputs; такие runs не слепы к прежней находке, но новый итог не подсказан.

Роли: независимый caseauthor, fresh executors, отдельный assessor, candidateauthor/root. SharedFS ограничена инструкциями, не hard sandbox. App-visible commands/readback дают bounded observations, не доказательство отсутствия любых OS syscalls. Недостающие/усечённые данные остаются explicit limits.

Сценарные assurance и context — заданные условия упражнения. Case06 suppliedhistory не доказывает live delivery. Case07 — minimal source/delivery pair, не compilerCLI fixture. Case09 реальные observations покрывают local formatting, не optional integration. Catalogcase проверяет выбор по предоставленным карточкам, не механизм загрузки всех host. Глобальные инструкции среды могут влиять на ответы.

Root+methodology25377→19990bytes, всеactive29955→26991; baseline66 и candidate69 shell commands. Tokens/cost и контролируемая latency недоступны. Эти измерения не доказывают экономию, причинный эффект или устойчивость за пределами выборки. Вспомогательный quick_validate одинаково отклоняет compatibility в обеих версиях; собственные compiler gates проходят.

- `assessment.md`, `evaluator-readback.json` — независимая оценка всех 22 trials и проверка сохранённых evidence; candidate 11/11, baseline 9/11. Исправления — cases02/04; case09 проходит в обеих версиях.
