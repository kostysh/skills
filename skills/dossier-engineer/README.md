# dossier-engineer

`dossier-engineer` — скил для ведения source-traced, capability-oriented и merge-safe процесса разработки через Markdown/YAML досье.

## Состав пакета

- `SKILL.md` — активный скил на английском языке.
- `references/workflow.ru.md` — рабочий workflow по стадиям, включая старт нового проекта и onboarding существующего проекта.
- `references/capability-governance.ru.md` — правила защиты продуктовой способности от подмены инфраструктурой.
- `references/artifact-contract.ru.md` — контракт артефактов, frontmatter ownership и runtime-owned schemas.
- `references/runtime-commands.ru.md` — как агент использует runtime-команды.
- `references/review-and-closure.ru.md` — verification, review, concept conformance и closure gates.
- `references/parallel-development.ru.md` — правила параллельной разработки.
- `references/retrospective.ru.md` — ретроспективный анализ процесса.

## Не часть активной методики

- `docs/cli-spec.ru.md` — техническая спецификация CLI для реализации runtime.
- `docs/functional-coverage-matrix.ru.md` — проектная матрица покрытия функций исходного процесса.
- `assets/examples/*.ru.md` — примеры артефактов, создаваемых runtime.

## Ключевые решения

- Canonical state хранится только в Markdown-файлах с YAML frontmatter под `docs/dossier/`.
- Frontmatter создаётся и изменяется runtime-командами, а не вручную агентом.
- Capability layer отделяет наблюдаемую продуктовую способность от work items и инфраструктуры.
- Feature-like work item не закрывается без capability claim, behavioral demo, anti-claims, pre-implementation challenge и concept-conformance evidence.
- Infrastructure/support work явно маркируется как support и не засчитывается как продуктовая функция без связанной demonstration.
- Existing-project onboarding фиксирует уже работающую функциональность как baseline capabilities, а не как искусственно закрытые задачи.
- Queue/status/attention/capability/guardrail checks являются derived views, а не отдельными источниками истины.
