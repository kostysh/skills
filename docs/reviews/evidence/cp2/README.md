# Свидетельства CP2

Supporting-набор для задачи 2 принятого плана, не нормативные инструкции и не постоянный evaluation framework. Candidate — content 0.2.10; CLI 0.2.5 неизменён.

- `cases/` — четыре исходные пользовательские задачи и fixtures.
- `criteria-and-input-manifests/` — независимые критерии, фиксация до candidate-правок, исходные хеши runs. Исполнителям недоступны по инструкции.
- `packages/{baseline,candidate}/skill-source-compiler/` — точные emitted-пакеты, копировавшиеся исполнителям как `compiler/`.
- `baseline-manifest.json` — полный baseline source; воспроизводится из базы `f4c9eec590047ea7c5dd01d72532e2e92b52bb94` и папки `skills/skill-source-compiler`.
- `candidate-manifest.json` — source-снимок до trials; после них разрешены только административные supporting-обновления, активный пакет остаётся неизменным.
- `source-diff.patch` — supporting-копия tracked diff на момент readback, не заменяет полный manifest или untracked log.
- `results/run-NN-events.json` — прямые публичные app-visible записи completed turns, включая команды и outputs. Все pages полные, outputs без truncation. Закрытые рассуждения не экспортировались.
- `results/run-NN/` — фактический result.md, конечные fixtures и выпущенные deliverables; неизменная копия compiler не дублируется для каждого run.
- `execution-context.json` — назначенные модель/effort, fresh contexts, dispatch, app elapsed times и число команд.
- `assessment.md` и `evaluator-readback.json` — независимая оценка: baseline 4/4 и candidate 4/4 SATISFIED; не полный audit PASS.
- `output-checks.json` — отдельная проверка конечных source/deliverable координатором после trials; не ретроспективное доказательство подкоманд исполнителей.
- `coordinator-readback.json` — конечные хеши и изменения относительно inputs, пересчитанные координатором.
- `structural-checks.json`, `author-readback.json`, `author-self-check.md` — структурная и авторская проверка; не independent PASS.

Для повторения создаётся новый пустой run-каталог: содержимое одного `cases/NN` и пакет одной версии под `compiler/`. Исполнителю передаются только task prompt и границы доступа, без criteria, плана, исходного отчёта и ожидаемого результата. Baseline runs 01–04, candidate 05–08 соответствуют cases 01–04. Критерии подготовил отдельный автор до правок; оценщик отделён и от автора критериев, и от автора candidate. Изоляция инструктивная на общей FS; прямые traces и файловое readback ограничивают наблюдаемый вывод, но не доказывают OS-wide отсутствие действий.

Это forced invocation, не проверка выбора скила из каталога. Единичные парные случаи не устанавливают статистическую устойчивость, причинное улучшение, внешнюю интеграцию или экономию. Общие инструкции среды также влияют на агента. Baseline использует тот же runtime; сравнение относится к инструкциям. Корневой текст вырос с 18801 до 19211 bytes, root+references с 39055 до 43348; сокращение контекста не заявляется. Команд 34 baseline и 32 candidate; token/cost и контролируемая latency недоступны.

Вспомогательный `skill-creator/quick_validate.py` отклоняет существующий `compatibility` одинаково в baseline и candidate. Его allowlist уже контракта существующего пакета; поле не удалялось ради зелёного результата. Собственные compiler lint/check и readback проходят. Эта ограниченная несовместимость отдельно предъявляется аудитору.

Первоначальный экспорт run02 пропускал публичный fileChange; по замечанию оценщика он восстановлен из исходного app turn и независимо проверен. Восемь экспортов исключают только reasoning. Для групповых shell-команд run08 stdout/exit отдельных подкоманд не всегда выделены; эта граница сохранена в assessment.
