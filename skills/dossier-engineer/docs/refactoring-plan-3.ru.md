# Refactoring plan 3: `dossier-engineer` UX corrective pass 2

## Назначение

Этот документ фиксирует короткий corrective pass после повторного UX-аудита `dossier-engineer`.

Нормативный источник истины для этого pass:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)

Аудитные источники:

- operator UX audit
- agent UX audit

## Цель

Устранить оставшиеся UX-дефекты без расширения runtime-модели:

1. убрать misleading closure path вокруг `dossier-verify --changed-only`;
2. сделать closure trio явно видимой в repo-facing examples;
3. усилить global help и command help так, чтобы shipped commands и workflow stages больше не смешивались;
4. убрать двусмысленность `workflow_next` как будто это runnable subcommand;
5. сделать `review-artifact` честным persistence command с явным reviewer provenance;
6. выровнять `dossier-verify` с canonical `index-refresh` path;
7. жёстко зафиксировать, что CLI никогда не интерпретирует prose из dossier body.

## Fixed decisions

Эти решения не переоткрываются в рамках данного pass:

1. CLI никогда не интерпретирует prose из dossier body.
2. `next-step` остаётся artifact/state-driven command и не становится content-aware.
3. Новые команды, артефакты или machine-readable body structures не добавляются.
4. `dossier-verify --changed-only` остаётся repo-scope audit mode, а не canonical closure path for one dossier.
5. `review-artifact` не выполняет review и не эмулирует независимость; она только фиксирует уже полученный reviewer verdict.
6. `index-refresh` — canonical full refresh path; `sync-index` — narrow table/graph refresh path.

## Package 1. Text/docs contract

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/WORKFLOW.md](../references/WORKFLOW.md)
- [../references/REPO_AGENTS_TEMPLATE.md](../references/REPO_AGENTS_TEMPLATE.md)
- [../assets/example-repo/AGENTS.md](../assets/example-repo/AGENTS.md)
- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [README.md](README.md)

### Changes

1. В `SKILL.md` и `WORKFLOW.md`:
   - закрепить, что `dossier-verify --dossier` — canonical closure path for one dossier;
   - описать `--changed-only` как repo-scope audit mode;
   - явно развести workflow stages и shipped CLI commands;
   - сузить wording `next-step` до dossier-local workflow stage resolution;
   - явно записать, что CLI never interprets dossier body prose.
2. В repo templates/examples:
   - добавить closure trio:
     - `dossier-verify`
     - `review-artifact`
     - `dossier-step-close`
   - использовать `--dossier` в canonical closure examples;
   - добавить `--reviewer` в `review-artifact` examples.
3. В `README.md`:
   - добавить новый corrective pass в индекс docs.

### Acceptance

- closure examples больше не нормализуют `--changed-only` как one-dossier close-out path;
- repo-facing examples включают полный closure trio;
- wording нигде не намекает, что CLI interprets dossier prose;
- shipped CLI commands и workflow stages больше не смешиваются;
- `git diff --check -- skills/dossier-engineer` проходит.

## Package 2. Runtime/spec/test alignment

### Scope

- [../src/commands.ts](../src/commands.ts)
- [utility-spec.ru.md](utility-spec.ru.md)
- [../test/cli.test.ts](../test/cli.test.ts)
- [../scripts/dossier.mjs](../scripts/dossier.mjs) via build
- other touched runtime/tests if needed

### Changes

1. `globalHelp`:
   - явно сказать, что help lists shipped CLI commands only;
   - отправлять workflow stages в `SKILL.md` / `WORKFLOW.md`;
   - сузить description `next-step` до dossier-local.
2. `feature-intake` и `next-step` output:
   - перестать подавать raw `workflow_next` как будто это subcommand;
   - сделать field/output wording explicitly stage-oriented.
3. `review-artifact`:
   - убрать default reviewer;
   - сделать `--reviewer` обязательным;
   - help/description должны честно говорить, что команда only persists a supplied review result.
4. `dossier-verify`:
   - использовать `index-refresh` как canonical refresh check;
   - обновить help/spec accordingly;
   - не оставлять drift с `sync-index`.
5. Tests:
   - добавить/обновить coverage для:
     - global help wording;
     - stage-oriented output fields;
     - required `--reviewer`;
     - `dossier-verify` bundle check naming/behavior;
     - closure path examples if runtime expectations changed.

### Acceptance

- runtime output больше не выглядит как invitation to run nonexistent subcommands;
- `review-artifact` без `--reviewer` завершается `UsageError`;
- `dossier-verify` больше не дрейфует относительно `index-refresh` contract;
- docs/spec/runtime/test expectations совпадают;
- `pnpm --dir skills/dossier-engineer run format` — PASS;
- `pnpm --dir skills/dossier-engineer run lint` — PASS;
- `pnpm --dir skills/dossier-engineer run test` — PASS;
- `git diff --check -- skills/dossier-engineer` — PASS.

## Review order

### Package 1

1. spec/process conformance review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - this plan

### Package 2

1. spec/process conformance review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - this plan
2. if spec/process review is PASS:
   - code review
   - security review
