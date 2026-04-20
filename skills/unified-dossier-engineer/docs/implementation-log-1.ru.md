# Лог имплементации 1

## Область

Этот лог фиксирует выполнение `Package 1` из [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md).

## Цель пакета

Стабилизировать source bundle и emitted instruction surface для planning-stage generated skill-а `unified-dossier-engineer`.

## Что реализовано

1. Создан canonical generated-skill scaffold:
   - [AGENTS.md](../AGENTS.md)
   - [skill.yaml](../skill.yaml)
   - [fragments/](../fragments/)
   - [references/](../references/)
   - [assets/](../assets/)
   - [src/](../src/)
   - [test/](../test/)
   - [scripts/](../scripts/)
   - [package.json](../package.json)

2. Сгенерирован root [SKILL.md](../SKILL.md) через `skill-source-compiler`, без speculative runtime/CLI contract.

3. В active surface оставлены только required references:
   - [references/status-and-scope.md](../references/status-and-scope.md)
   - [references/unified-architecture.md](../references/unified-architecture.md)
   - [references/source-bundle-governance.md](../references/source-bundle-governance.md)

4. Зафиксирована compiler-first maintenance model:
   - source of truth rooted at `skill.yaml`
   - generated `SKILL.md` is not hand-edited
   - compile/check workflow is mandatory after source-bundle edits

5. Отделены active references and assets от maintainer-only `docs/*`.
   `docs/*` остаётся служебной поверхностью для концепции, планов и implementation logs и не является частью emitted active contract.

6. В [docs/issues/unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md) зафиксировано compiler-driven ограничение на размер `SKILL.md` и необходимость progressive disclosure.

7. После external spec-conformance review закрыты две corrective findings:
   - `docs/compile-report.md` убран из emitted active instructions; compile report остаётся maintainer-only output
   - ownership `change-proposal` / `contract-drift-audit` / `backlog impact verdict` в active reference [references/unified-architecture.md](../references/unified-architecture.md) выровнен с концепцией в пользу delivery workflow layer

## Проверки

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmp>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

## Acceptance status

`Package 1` считается реализованным, если внешний `spec-conformance-reviewer` подтвердит:

- canonical `skill.yaml` is stable
- minimal active references are sufficient and reachable
- `docs/*` no longer behaves like an active guidance channel
- root `SKILL.md` remains concise and navigation-focused
- generated output does not promise runtime behavior that does not ship yet
