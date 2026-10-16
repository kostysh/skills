# Доказательства аудита 2026-10-16

Это неактивные материалы независимого аудита адаптированного error-fixer.

- [Вердикт PASS](assessment-v1.md), [протокол](trial-protocol.md), [рубрика](closed/rubric-v1.md).
- `inputs/` — исходные задачи и синтетические проекты; `runs/` — точные prompts.
- `evidence/` — raw tool events, final, оценки, diff и hashes каждого прогона.
- `candidate-v1.json` — проверенные 8 файлов. Их исходные supporting log/README
  сохранены в `reviewed-supporting/`, поскольку итоговые записи дополнены результатами.
- `freeze-v1.json` — критерии и inputs до прогонов. Для исключения повторного
  обнаружения скила файл `trial-skill/SKILL.md` хранится как
  `trial-skill/skill-instructions.txt` с теми же байтами и hash.
- `original-skill.txt` — исходный файл архива; отдельный аудит оригинала не выполнялся.
- `workspace-tests.txt` — фактический stdout/stderr обязательного `pnpm test:ci`.

Абсолютные пути в raw events отражают историческую изолированную среду. Они не
являются зависимостями скила. Кэши npm и копии проектов после прогона не включены:
изменения восстанавливаются из исходных fixtures и сохранённых patch. Системные
инструкции и внутреннее reasoning не сохранены.

Unified diff сохранены в `project-diff.patch.json`: поле `text` содержит исходный
patch без изменения байтов; поле `sha256` позволяет проверить восстановление.
Это сохраняет обязательные пробелы контекста patch без trailing-whitespace
ошибок проверки Git.
