# Skills

Portable AI-agent skills maintained as a pnpm workspace. Runnable skill folders live under `skills/`; development source and generated outputs follow each skill's maintenance contract.

## Maintenance

- [Repository instructions](AGENTS.md) — authority, workflow, independent gates, and record locations.
- [Skill standard](docs/skill-standard.md) — normative repository quality requirements.
- [Issue template](docs/templates/ISSUE_TEMPLATE.md), [plan template](docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md), and [implementation log template](docs/templates/IMPLEMENTATION_LOG_TEMPLATE.md) — supporting record formats.
- `skill-creator` — skill authoring; `skill-source-compiler` — source bundles and generation; `skill-reviewer` — independent skill review.

The repository standard is maintenance policy. Each shipped skill keeps its own core method local and does not require this checkout to run.

## Current methodology work

- [Source report](docs/reviews/review-20260907-skill-methodology.md) — preserved proposal.
- [Accepted three-task plan](docs/plans/implementation-plan-20260907-1.md).
- [Independent plan audit](docs/reviews/audit-implementation-plan-20260907-1.md).
- [Implementation record](docs/reviews/implementation-log-20260907-1.md).

Reports, plans, and logs are supporting records; they do not override active rules.

## Ревизия десяти скилов

- [Принятый план](docs/plans/implementation-plan-20260907-2.md) — четыре группы, отдельный коммит каждого скила.
- [Аудит плана](docs/reviews/audit-implementation-plan-20260907-2.md) — PASS.
- [Исходные версии](docs/reviews/evidence/skills-revision/README.md) — snapshot и внешнее основание.
