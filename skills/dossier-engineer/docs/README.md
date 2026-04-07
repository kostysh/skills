# `dossier-engineer` Docs

This folder contains supporting documentation for the `dossier-engineer` skill and its CLI utility.

`dossier-engineer` is a lean docs-as-code workflow for large software projects with AI agents. It is built around one Feature Dossier per feature, one global index, stable traceability IDs, explicit backlog discovery, machine-checkable verification artifacts, and independent review before step closure.

## Start Here

- Read [../SKILL.md](../SKILL.md) for the operator-facing workflow, rules, and command guidance.
- Read [../references/WORKFLOW.md](../references/WORKFLOW.md) for a compact workflow reference.
- Use this `docs/` folder when you need deeper utility-specific architecture or behavior details.

## Document Map

| File | Purpose | When to read |
| --- | --- | --- |
| [utility-architecture.md](utility-architecture.md) | Technical architecture of the `dossier-engineer` CLI: runtime model, module boundaries, core layers, and testing approach. | Read first when you need to understand how the utility is structured internally. |
| [utility-spec.ru.md](utility-spec.ru.md) | Current behavioral specification of the CLI utility, including command contracts, artifacts, path rules, and exit-code behavior. This document is written in Russian. | Read when you need exact runtime behavior or want to validate implementation details against the documented contract. |

## Related Materials

- [../references/WORKFLOW.md](../references/WORKFLOW.md) explains the end-to-end dossier workflow.
- [../references/DOSSIER_TEMPLATE.md](../references/DOSSIER_TEMPLATE.md) provides the canonical Feature Dossier template.
- [../references/SSOT_INDEX_TEMPLATE.md](../references/SSOT_INDEX_TEMPLATE.md) provides the global index template.
- [../references/FEATURE_CANDIDATES_TEMPLATE.md](../references/FEATURE_CANDIDATES_TEMPLATE.md) provides the feature-candidate backlog template.
- [../references/EXAMPLE_FEATURE_DOSSIER.md](../references/EXAMPLE_FEATURE_DOSSIER.md) shows a worked dossier example.
- [../assets/example-repo/](../assets/example-repo/) contains a small example repository that demonstrates the expected repo layout.

## Suggested Reading Paths

### If you are new to the skill

1. [../SKILL.md](../SKILL.md)
2. [../references/WORKFLOW.md](../references/WORKFLOW.md)
3. [../references/EXAMPLE_FEATURE_DOSSIER.md](../references/EXAMPLE_FEATURE_DOSSIER.md)

### If you are working on the CLI

1. [utility-architecture.md](utility-architecture.md)
2. [utility-spec.ru.md](utility-spec.ru.md)
3. [../src/](../src/)
4. [../test/](../test/)

## Scope of This Folder

- This folder is for utility-focused documentation.
- The canonical skill contract lives in [../SKILL.md](../SKILL.md).
- Templates and reusable reference material live in [../references/](../references/).
- The built runtime lives at [../scripts/dossier.mjs](../scripts/dossier.mjs).
