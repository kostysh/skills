# План имплементации `improvement-proposal-20260424-1`

Issue: [improvement-proposal-20260424-1.md](improvement-proposal-20260424-1.md)

Status: audited

Этот файл является текущим планом по new issue workflow. Встроенный draft plan внутри issue используется только как исходный материал и не является отдельным plan artifact.

## Рабочие допущения

- `.dossier/stages/*` остается authoritative structured coordination and validation surface.
- Stage log frontmatter остается bounded mirror для parity-protected machine fields.
- Backlog truth mutation остается только в backlog layer через `patch-item` или `refresh + patch`.
- `dossier-step-close` может читать backlog truth, валидировать reconciliation и записывать closure evidence, но не может мутировать backlog truth.
- Canonical delivery-state order остается `defined < specified < planned < implemented`.
- Для первого implementation pass accepted actualization evidence ограничивается repo-managed backlog mutation artifacts, прежде всего `.dossier/backlog/patches/*`; broader evidence kinds требуют отдельного follow-up issue.

## Цель

После implementation authoritative close-out для `spec-compact`, `plan-slice` и `implementation` не сможет завершиться, если selected backlog item находится ниже lifecycle target этой стадии.

Observable outcome:

- `implementation` close-out с selected item в `planned` fails before step artifact write;
- после canonical `patch-item`, который переводит selected item в `implemented`, тот же close-out проходит и записывает reconciliation evidence;
- если current backlog truth уже удовлетворяет target, close-out проходит без fake mutation artifact и записывает no-op reconciliation verdict;
- `queue` больше не silently предлагает backlog item, чей mapped feature dossier уже `done`, как ordinary ready work.

## Scope

- Active references:
  - [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
  - [../../references/backlog-truth-layer.md](../../references/backlog-truth-layer.md)
  - [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
  - [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
  - [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- Maintainer-facing utility spec:
  - [../utility-spec.ru.md](../utility-spec.ru.md)
- Runtime:
  - `src/shared/stage-state.ts`
  - `src/delivery/stage-control.ts`
  - `src/unified-cli.ts`
  - backlog read wrappers in `src/backlog/commands.ts`
  - a new small lifecycle reconciliation helper under `src/delivery/` or `src/shared/`
- Tests:
  - `test/cli.test.ts`
  - `test/docs-contract.test.ts`

## Non-Goals

- Do not make stage-controller commands mutate backlog truth directly.
- Do not merge backlog `delivery_state` and dossier status into one enum.
- Do not infer actualization from prose, commit messages, or `docs/ssot/index.md`.
- Do not auto-mark dependent items reviewed or mutate dependency-attention state.
- Do not rewrite historical dossiers, historical step artifacts, or historical stage states.
- Do not redesign queue ranking beyond drift warning/exclusion needed for this issue.
- Do not solve general multi-follow-up schema design beyond lifecycle reconciliation fields.

## Затронутые поверхности

### Active instructions

Update active references to make lifecycle reconciliation a first-class closure gate:

- `delivery-workflow-layer.md`: state that selected backlog item lifecycle target is enforced at truthful close-out for `spec-compact`, `plan-slice`, and `implementation`.
- `backlog-truth-layer.md`: define canonical lifecycle targets and keep actualization bounded to `patch-item` / `refresh + patch`.
- `commandized-stage-control.md`: state-controller commands expose follow-up signals and lifecycle fields but do not perform actualization.
- `telemetry-and-closure.md`: add reconciliation fields to machine-complete stage schema and step-close parity requirements.
- `runtime-and-command-boundary.md`: describe the shipped helper boundary for `dossier-step-close` lifecycle reconciliation without adding unshipped semantic automation claims.
- `docs/utility-spec.ru.md`: align stage-controller, helper close-out, output/error, and canonical flow sections with the shipped reconciliation gate.

### Runtime

Add a small deterministic reconciliation helper with these responsibilities:

- map stage to lifecycle target:
  - `spec-compact -> specified`
  - `plan-slice -> planned`
  - `implementation -> implemented`
  - all other stages -> no lifecycle target
- compare delivery states using `defined < specified < planned < implemented`;
- resolve selected backlog item from helper-managed stage state first, then dossier frontmatter fallback;
- read current backlog truth through the canonical backlog state/read model;
- build a bounded reconciliation result for stage-state/log mirroring;
- detect closed-feature/backlog-state drift for read surfaces.

Extend stage state and frontmatter mirror fields with bounded machine fields:

- `backlog_lifecycle_target`
- `backlog_lifecycle_current`
- `backlog_lifecycle_reconciled`
- `backlog_actualization_artifacts`
- `backlog_actualization_verdict`

Initial verdict values:

- `no_lifecycle_target`
- `current_state_satisfies_target`
- `actualization_required`
- `actualized_by_backlog_artifact`
- `blocked_backlog_item_missing`

Update stage-controller writes for `spec-compact`, `plan-slice`, and `implementation`:

- compute lifecycle reconciliation on bootstrap/update/ready-for-close;
- force `backlog_followup_required: true` when current backlog state is behind target;
- set `backlog_followup_resolved` to false while lifecycle reconciliation is false;
- preserve operator-provided `--backlog-followup-kind` where present, otherwise use `backlog-lifecycle-actualization`;
- record lifecycle fields in `.dossier/stages/*` and mirrored frontmatter;
- keep stage-controller commands non-mutating.

Update `dossier-step-close` wrapper before vendored close-out:

- resolve feature id, stage, current stage state, and selected backlog item;
- read current backlog truth before invoking the vendored command;
- fail before writing a step-close artifact when current delivery state is below target;
- emit a specific fail-closed error, for example `UDE_BACKLOG_ACTUALIZATION_REQUIRED`, with current state, target state, selected item key, and next command guidance;
- accept success only when current truth satisfies target;
- optionally accept repeatable `--backlog-actualization-artifact <path>` for managed backlog artifact trace links, but never allow the artifact to bypass current-state validation;
- store accepted artifact links only after managed-path validation and, for patch artifacts, confirmation that the patch/applied registry concerns the selected item.

Update successful close-out recording:

- preserve existing review/verification/step artifact linkage;
- write `step_close_ts`, `step_artifact`, and `process_complete_ts` into helper-managed stage state and frontmatter;
- write lifecycle reconciliation fields into the same stage state/frontmatter update;
- do not leave a successfully closed stage snapshot in `ready_for_close` with null close linkage.

Add read-model drift detection:

- implement one central helper that detects at least:
  - dossier `status: done` with selected backlog item below `implemented`;
  - implementation step artifact with `process_complete: true` while helper-managed implementation state lacks `step_artifact`, `step_close_ts`, or `process_complete_ts`;
  - queue candidate mapped to an already-done feature with backlog item below `implemented`;
- surface drift in `status` with deterministic fields such as `lifecycle_reconciliation_drift_count` and `lifecycle_reconciliation_drifts`;
- update `queue` to exclude drift-blocked item keys from ordinary ready chains and emit a warning or explicit `drift_blocked_item_keys` field in the unified envelope;
- avoid changing vendored queue ranking rules except for this wrapper-level drift exclusion.

### Tests

Add focused CLI tests for:

- regression equivalent: `F-0024` done / `CF-024` planned blocks `implementation` step close before step artifact write;
- normal implementation close-out after `patch-item` moves selected item to `implemented`;
- no-op close-out where current backlog truth already satisfies the target;
- `spec-compact` and `plan-slice` targets enforce `specified` and `planned`;
- successful `dossier-step-close` updates helper-managed stage state with `step_close_ts`, `step_artifact`, `process_complete_ts`, and lifecycle reconciliation fields;
- `status` reports closed-dossier/backlog-state drift deterministically;
- `queue` does not silently present a mapped done feature's backlog item as ordinary ready work;
- managed-path rejection for invalid `--backlog-actualization-artifact`.

Add docs-contract tests for:

- active references define lifecycle targets without collapsing state axes;
- stage-controller docs keep direct backlog mutation forbidden;
- utility spec and runtime-boundary docs mention `dossier-step-close` reconciliation enforcement and read-model drift visibility.

## План работ

1. Update docs first:
   - add lifecycle reconciliation gate language to active references;
   - update `docs/utility-spec.ru.md`;
   - add docs-contract assertions that lock the rule.
2. Add lifecycle reconciliation helper:
   - stage target mapping;
   - delivery-state rank comparator;
   - selected backlog item resolver;
   - current backlog state reader;
   - drift detector skeleton reused by `status` and `queue`.
3. Extend `StageStateRecord` and normalization:
   - add lifecycle fields;
   - include them in `stageStateMirrorFields`;
   - normalize arrays/verdicts defensively for old artifacts.
4. Wire stage-controller follow-up visibility:
   - compute reconciliation for `spec-compact`, `plan-slice`, `implementation`;
   - write lifecycle fields and merged follow-up booleans;
   - keep direct backlog mutation forbidden.
5. Enforce close-out gate in `dossier-step-close`:
   - validate target before vendored close-out;
   - validate optional actualization artifact paths;
   - block before step artifact write when target is unmet;
   - record reconciliation and close linkage after successful vendored close-out.
6. Wire read-model drift detection:
   - add deterministic status fields;
   - filter or warn in queue wrapper so drift is not silent.
7. Add regression and parity tests.
8. Run formatting, lint, tests, and compiler parity.

## Verification

Required checks:

- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

Targeted behavioral proof:

- implementation close fails with selected item `planned`;
- `patch-item` actualizes selected item to `implemented`;
- the same implementation close succeeds and writes reconciliation plus step-close linkage;
- `queue` no longer returns that selected item as ordinary ready work while mapped feature is done.

## Риски и side effects

- Existing historical inconsistent artifacts stay inconsistent; this plan only makes drift detectable and prevents new silent close-outs.
- Optional `--backlog-actualization-artifact` must remain trace evidence, not an override for current backlog truth.
- Queue output shape may gain wrapper-level warning/drift fields; tests must pin the envelope without changing vendored queue schema.
- Stage-controller follow-up fields are currently single-kind; lifecycle-specific fields carry the exact reconciliation truth to avoid redesigning all follow-up schema in this issue.

## External Audit

Status: reviewed

Reviewer: external agent `Feynman`

Verdict: `PASS`

Findings: none.

Residual risks accepted for implementation:

- If `--backlog-actualization-artifact` is implemented, command help and CLI tests must pin the flag so help/runtime parity remains true.
- Drift detection must keep one centralized mapping between feature dossier `status: done`, selected backlog key, and current backlog state so `status` and `queue` cannot diverge.
- Queue handling must stay wrapper-level warning/exclusion and must not redesign vendored queue ranking.
