# Implementation log 2026-04-30-1

## Задача

Перевести скил `dossier-engineer` в формат source bundle для `skill-source-compiler` и перевести активные reference-документы на английский язык. Русскоязычные версии сохранить в `docs/ru/references/`.

## Capability vs substrate

Наблюдаемая способность: скил должен регенерировать `SKILL.md` из `skill.yaml`, ссылаться на английские active references, сохранять русские reference-копии как historical docs, и проходить `skill-source-compiler check`.

Субстрат: наличие `skill.yaml`, fragments, copied files, docs/ru и compile report. Само по себе это не считается завершением без `regenerate` и `check`.

## Выполнено

- Добавлен `skill.yaml` как source of truth для generated skill.
- Добавлены `fragments/overview.md` и `fragments/final-checks.md`.
- Активные references переведены на английский как `references/*.md`.
- Русские references скопированы в `docs/ru/references/*.ru.md`.
- Старые `references/*.ru.md` удалены из active references folder после сохранения исторических копий.
- Добавлен этот implementation log и `docs/README.md` как supporting docs.

## Проверка

- `skill-source-compiler lint .`
- `skill-source-compiler regenerate .`
- `skill-source-compiler check .`
- `pnpm run lint`
- `pnpm run format:check`
- `pnpm test`
- portability search for absolute local paths in active/generated skill files
- Cyrillic search in active English `references/*.md`, `SKILL.md`, `skill.yaml`, and fragments

## Остаточные риски

- Перевод сохраняет технические термины (`capability`, `support`, `source-review`, `change-proposal`) без русской адаптации.
