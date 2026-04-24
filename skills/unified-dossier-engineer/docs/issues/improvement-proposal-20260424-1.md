# Improvement Proposal: enforce backlog actualization before delivery step closure

Issue ID: `ISS-04`

Primary owner skill: `unified-dossier-engineer`

## Проблема

Runtime and methodology currently allow a feature dossier to reach `status: done` while the selected backlog item remains in an earlier delivery state.

Observed incident:

- `F-0024` reached `status: done`, `coverage_gate: strict`, and has an implementation step-close artifact with `process_complete: true`.
- The mapped backlog item `CF-024` remained `delivery_state: planned`.
- `queue` therefore still surfaced `CF-024` as ready backlog work even though the corresponding feature was already delivered.
- The implementation log explicitly said no backlog truth mutation was required, so the implementation close-out missed the required `CF-024 planned -> implemented` actualization.
- The helper-managed stage state for `F-0024` also still had `step_close_ts: null`, `step_artifact: null`, and `process_complete_ts: null` after the step-close artifact was written.

This is a skill/runtime contract gap, not just one operator mistake. The current closure path does not mechanically require evidence that dossier lifecycle progress and backlog delivery-state progress have been reconciled before authoritative step closure.

## Почему это важно

The skill preserves separate axes for backlog item lifecycle, feature dossier maturity, coverage gate, review freshness, verification freshness, and step closure state. Keeping them separate is correct, but allowing them to drift silently breaks operator decisions.

If implementation closure can finish while the backlog item remains `planned`:

- `queue` can offer already-delivered work for a new intake;
- downstream items can receive dependency-change attention without the upstream item being marked complete;
- reports and status summaries disagree with `docs/ssot/index.md`;
- future agents must infer truth from dossier prose and commits instead of deterministic backlog artifacts;
- `dossier-step-close` looks authoritative while required backlog actualization was skipped.

## Текущая активная поверхность

Релевантные active references:

- [Delivery workflow layer](../../references/delivery-workflow-layer.md)
- [Backlog truth layer](../../references/backlog-truth-layer.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Runtime and command boundary](../../references/runtime-and-command-boundary.md)

## Требуемое исправление

Add a lifecycle reconciliation gate to the shipped workflow so mutating stage closure cannot silently skip required backlog actualization.

The core rule:

- `dossier-step-close` must fail closed when the selected backlog item's delivery state is behind the lifecycle state implied by the closing dossier stage, unless the stage carries explicit structured evidence that no backlog lifecycle actualization is required.

For ordinary selected-feature progression, the expected backlog delivery-state targets are:

- after `spec-compact` close: selected backlog item is at least `specified`;
- after `plan-slice` close: selected backlog item is at least `planned`;
- after `implementation` close: selected backlog item is `implemented`.

This rule does not collapse backlog lifecycle and dossier maturity into one enum. It only requires an explicit reconciliation check at the closure boundary.

## Что должно измениться

### 1. Structured backlog reconciliation state

Extend helper-managed stage state with explicit backlog reconciliation fields, for example:

- `backlog_lifecycle_target`
- `backlog_lifecycle_current`
- `backlog_lifecycle_reconciled`
- `backlog_actualization_artifacts`
- `backlog_actualization_verdict`

The exact names may change during implementation, but the fields must be machine-readable and stored in `.dossier/stages/*`, with bounded stage-log frontmatter mirroring if needed.

### 2. Step-close enforcement

`dossier-step-close` must read the selected `backlog_item_key`, inspect current backlog truth through the canonical backlog state/read model, and enforce the target for the stage being closed.

Expected behavior:

- if the target is already satisfied, close may proceed and record reconciliation evidence;
- if the target is not satisfied and no accepted actualization artifact is provided, close fails before writing a step-close artifact;
- if a `patch-item` or other accepted actualization artifact is provided, close validates that applying/reading current truth now satisfies the target;
- implementation close cannot pass with the selected item still `planned`.

### 3. Stage-controller follow-up signals

Stage-controller commands still must not mutate backlog truth directly.

Instead, stage-controller paths should materialize follow-up state early enough for the agent:

- `spec-compact` should indicate whether selected item actualization to `specified` is required;
- `plan-slice` should indicate whether actualization to `planned` is required;
- `implementation` should indicate whether actualization to `implemented` is required.

Truthful stage closure remains blocked while this follow-up is unresolved.

### 4. Read-model drift detection

Backlog read surfaces should expose deterministic drift when a feature dossier is closed beyond the backlog item's delivery state.

At minimum, one shipped read or validation surface should flag:

- feature dossier `status: done` with selected backlog item not `implemented`;
- step-close artifact `process_complete: true` with helper-managed stage state missing step-close linkage;
- selected backlog item offered by `queue` even though a mapped feature is already `done`.

The implementation may choose where this lives (`status`, `lint-dossiers`, `queue`, or a central validation helper), but the drift must be machine-detectable and covered by tests.

### 5. Stage-state closure parity

When `dossier-step-close` writes a close artifact, it must also update helper-managed stage state and stage-log frontmatter for the same stage cycle.

Required observable updates:

- `step_close_ts`
- `step_artifact`
- `process_complete_ts`
- any explicit backlog reconciliation fields from this issue

Existing step-close artifacts remain valid historical evidence, but new close-out writes must not leave the stage snapshot in `ready_for_close` with null close linkage.

## Acceptance Criteria

Issue считается исправленным только когда:

- `dossier-step-close` enforces selected backlog item lifecycle reconciliation for `spec-compact`, `plan-slice`, and `implementation`;
- implementation step closure fails if the selected backlog item is still below `implemented` and no valid backlog actualization evidence is present;
- stage-controller or close-out artifacts make required backlog actualization visible as structured state rather than prose-only guidance;
- helper-managed stage state records step-close linkage and process-complete timestamps when `dossier-step-close` succeeds;
- at least one validation/read surface detects closed-dossier/backlog-state drift before a new intake decision is made;
- `queue` cannot silently present a mapped `done` feature's backlog item as ordinary ready work without a drift warning or exclusion;
- docs describe lifecycle reconciliation without collapsing the separate state axes into one enum;
- tests cover the regression equivalent to `F-0024 done` while `CF-024 planned`;
- tests cover a normal implementation close-out where a backlog `patch-item` moves the selected item to `implemented`;
- tests cover a no-op branch only when current backlog truth already satisfies the target.

## Обязательное ограничение для последующего planning и implementation

Любой future planning или implementation по этому issue должен оставаться в границах lifecycle reconciliation.

Обязательные границы:

- do not make stage-controller commands mutate backlog truth directly;
- do not merge backlog delivery state and dossier status into one enum;
- do not infer actualization from prose, commit messages, or `docs/ssot/index.md` alone;
- do not auto-mark dependent items reviewed just because the upstream selected item reached the target state;
- preserve explicit `patch-item` / `refresh+patch` as the backlog truth mutation path;
- if broader queue ranking or dependency-attention behavior needs redesign, create a follow-up issue instead of expanding this one.

## Non-Goals

- Не переписывать historical dossiers или historical step-close artifacts.
- Не добавлять automatic backlog mutation inside `dossier-step-close`.
- Не отменять requirement for external review and verification artifacts.
- Не решать all telemetry schema parity gaps outside the specific step-close linkage fields named here.

## План имплементации

Status: draft

### Рабочие допущения

- `.dossier/stages/*` remains the authoritative structured coordination and validation surface.
- Backlog truth mutation continues to happen through canonical backlog commands such as `patch-item`.
- `dossier-step-close` may validate backlog truth and record reconciliation evidence, but it must not mutate backlog truth itself.

### Шаги

1. Update active references:
   - `references/delivery-workflow-layer.md` for lifecycle reconciliation as a closure gate;
   - `references/backlog-truth-layer.md` for selected-item actualization targets;
   - `references/commandized-stage-control.md` for structured follow-up visibility;
   - `references/telemetry-and-closure.md` for step-close-to-stage-state parity.
2. Add a central lifecycle target helper:
   - `spec-compact -> specified`;
   - `plan-slice -> planned`;
   - `implementation -> implemented`;
   - explicit no target for stages where selected-item lifecycle state is not advanced.
3. Extend stage-state types and writers with reconciliation fields and step-close linkage refresh.
4. Update `dossier-step-close`:
   - resolve feature id and selected backlog item;
   - read current backlog state through canonical state loading/read helpers;
   - fail closed if current state is below the stage target;
   - record reconciliation fields on successful close;
   - update `.dossier/stages/*` and stage-log frontmatter with `step_close_ts`, `step_artifact`, and `process_complete_ts`.
5. Add validation/read-model drift detection:
   - prefer a central helper reused by `status`, `queue`, and/or `lint-dossiers`;
   - ensure a mapped `done` feature with a non-implemented backlog item is visible before intake selection.
6. Add tests:
   - regression fixture for `F-0024 done` + `CF-024 planned` blocks implementation close or reports drift;
   - passing fixture where `patch-item` actualizes selected item to `implemented` before close;
   - no-op fixture where current backlog state already satisfies the target;
   - step-close parity fixture proving stage state gets close linkage.
7. Rebuild shipped runtime after source changes and update docs contract tests.

### Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- Targeted CLI fixture: `implementation` close fails with selected item `planned`, then passes after canonical `patch-item` actualization to `implemented`.

### Scope guards

- No automatic backlog mutation in `dossier-step-close`.
- No dependency-attention auto-close.
- No new dossier-status/backlog-state single enum.

## Внешний Review плана

Status: reviewed

Reviewer: external agent `Bacon`

Verdict: `PASS`

Findings: none.

Residual risks accepted for future implementation:

- `other accepted actualization artifact` needs a tight implementation-time definition, while canonical mutation remains `patch-item` / `refresh+patch`;
- `queue` behavior may be either warning or exclusion, as long as it stays limited to drift handling and does not redesign ranking;
- historical inconsistent artifacts remain out of scope, so existing drift still needs separate audit or manual cleanup.
