# Лог имплементации 2

## Область

Этот лог фиксирует выполнение grouped implementation wave `Package 2 + Package 3 + Package 5` из [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md).

## Цель волны

Сделать merged skill достаточно подробным в трёх смежных областях без перехода к runtime-коду:

- unified artifact topology
- backlog truth layer
- source-change review redesign

## Что реализовано

1. Active normative surface расширен новыми required references:
   - [references/unified-artifact-topology.md](../references/unified-artifact-topology.md)
   - [references/backlog-truth-layer.md](../references/backlog-truth-layer.md)
   - [references/source-review-contract.md](../references/source-review-contract.md)

2. В [skill.yaml](../skill.yaml) эти references сделаны обязательными и снабжены явными load triggers.

3. В [references/unified-artifact-topology.md](../references/unified-artifact-topology.md) зафиксированы:
   - canonical `.dossier` layout
   - `docs/ssot` boundary
   - replacement root discovery contract
   - feature dossier migration rule

4. В [references/backlog-truth-layer.md](../references/backlog-truth-layer.md) зафиксированы:
   - backlog-owned read-model family
   - readiness signals
   - canonical mutation and actualization families
   - clean-confirmation rules
   - source-maintenance invariants

5. В [references/source-review-contract.md](../references/source-review-contract.md) зафиксированы:
   - source-review record model
   - source-first review semantics after `refresh`
   - readiness blocking
   - truthful closure outcomes
   - explicit no-op path
   - no-NLP boundary for utility

6. В [references/unified-architecture.md](../references/unified-architecture.md) добавлена навигация на новые detailed references, чтобы top-level architecture ref не разрастался и не дублировал heavy guidance.

7. В emitted surface добавлены соответствующие required references и короткий high-signal guardrail:
   source hash change opens source review first and must not flood linked items immediately.

## Кодовые изменения

Код в этой волне не менялся.

Следствие:

- `code-reviewer` не требуется
- `security-reviewer` не требуется

Это docs/reference implementation wave.

## Проверки

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmp>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

## Acceptance target

Волна считается завершённой только если внешний `spec-conformance-reviewer` подтвердит:

- Package 2 acceptance
- Package 3 acceptance
- Package 5 acceptance

против:

- [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
- [unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md)
