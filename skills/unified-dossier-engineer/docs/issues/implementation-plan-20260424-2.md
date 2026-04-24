# План имплементации `ISS-05`

Issue: [issue-20260424-2.md](issue-20260424-2.md)

Status: audited

## Рабочие допущения

- Implementation step closure остается authoritative и не должна автоматически запускать source refresh.
- Post-close backlog hygiene является branch/readiness evidence после successful implementation closure, а не дополнительным gate для самого `dossier-step-close`.
- Checkpoint преимущественно read-only; единственная допустимая backlog mutation внутри checkpoint — explicit existing `refresh` behavior.
- Open source-review records после refresh должны быть surfaced as blocking/unclean, но не auto-acked.
- Historical implementation closures остаются валидными; новое правило применяется к будущим implementation closures через new stage-state fields.
- Queue ranking не redesign-ится; новые readiness signals добавляют warnings/blocking metadata.

## Цель

После implementation closure runtime и active workflow требуют explicit post-close backlog hygiene evidence перед final branch-complete reporting или выбором следующего intake.

Observable outcome:

- successful future `implementation` close marks post-close hygiene as required and initially missing without running refresh;
- explicit hygiene checkpoint runs `refresh`, captures `status`, `attention`, and `queue`, and writes durable artifact;
- open source reviews after refresh make hygiene status `blocked` or not-clean and remain visible in evidence/readiness output;
- clean refresh/status/attention/queue evidence marks hygiene status `clean`;
- `next-step`, `status`, or equivalent readiness output reports missing/stale/blocked hygiene after fresh implementation close when checkpoint has not run or is no longer fresh.

## Scope

- Active references:
  - [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
  - [../../references/backlog-truth-layer.md](../../references/backlog-truth-layer.md)
  - [../../references/source-review-contract.md](../../references/source-review-contract.md)
  - [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
  - [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
  - [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- Source bundle:
  - `skill.yaml`
  - generated `SKILL.md`
- Maintainer-facing utility spec:
  - [../utility-spec.ru.md](../utility-spec.ru.md)
- Runtime:
  - `src/shared/stage-state.ts`
  - `src/delivery/stage-control.ts`
  - `src/backlog/commands.ts`
  - `src/unified-cli.ts`
  - `src/vendor/dossier-engineer/commands.ts`
  - generated `scripts/dossier-engineer.mjs`
- Tests:
  - `test/cli.test.ts`
  - `test/docs-contract.test.ts`

## Non-Goals

- Не заставлять `dossier-step-close` автоматически запускать source refresh.
- Не auto-ack source reviews.
- Не превращать source-review outcomes в implicit backlog patches.
- Не делать implementation step closure dependent on unrelated source-review closure when the implementation bundle is otherwise valid.
- Не redesign-ить queue ranking.
- Не применять новое правило как retroactive invalidation для historical implementation closures.
- Не расширять первый implementation scope на non-implementation stages or broader branch-finish semantics.

## Затронутые поверхности

### Active instructions

Update active references to define the post-close backlog hygiene checkpoint:

- `delivery-workflow-layer.md`: after successful `implementation` close, final branch-complete reporting and next-intake recommendation require fresh post-close backlog hygiene evidence.
- `backlog-truth-layer.md`: source-review closure remains explicit through `ack-source-review`, `patch-item`, `packet`, `update-source-path`, or `remove-source`; hygiene checkpoint must not auto-resolve source-review records.
- `source-review-contract.md`: open source reviews after refresh remain blocking/readiness signals and must appear before clean branch-complete claims.
- `telemetry-and-closure.md`: add post-close hygiene artifact linkage and summary fields to machine-complete implementation stage schema.
- `commandized-stage-control.md`: preserve `dossier-step-close` authority and state that post-close hygiene is branch/readiness evidence after closure, not a stage-controller closure substitute.
- `runtime-and-command-boundary.md` and `docs/utility-spec.ru.md`: document the shipped helper/readiness surface without implying auto-refresh in `dossier-step-close`.
- `skill.yaml` / generated `SKILL.md`: update source-bundle command/reference surface if a new helper command is shipped.

### Runtime

Add implementation-stage state fields:

- `post_close_backlog_hygiene_required: boolean`
- `post_close_backlog_hygiene_status: "not_required" | "missing" | "stale" | "blocked" | "clean"`
- `post_close_backlog_hygiene_artifact: string | null`
- `post_close_backlog_hygiene_checked_at: string | null`
- `post_close_backlog_hygiene_refresh_at: string | null`
- `post_close_open_source_review_count: number | null`
- `post_close_source_review_blocked_item_count: number | null`
- `post_close_lifecycle_reconciliation_drift_count: number | null`
- `post_close_unresolved_attention_present: boolean | null`
- `post_close_backlog_hygiene_blockers: string[]`

Update successful `dossier-step-close --step implementation` handling:

- after closure succeeds and stage state is updated, set `post_close_backlog_hygiene_required: true`;
- set `post_close_backlog_hygiene_status: "missing"` and clear artifact/check timestamps;
- do not run `refresh`;
- do not block the implementation step artifact when review, verification, and backlog lifecycle gates are otherwise satisfied.

Add a new explicit helper command, tentatively `post-close-hygiene`:

- inputs:
  - `--dossier <path>` or `--feature-id <id>`
  - `--step implementation` for first implementation scope
  - `--json`
- preconditions:
  - resolves a managed implementation stage state;
  - requires implementation `step_artifact` / `process_complete_ts`;
  - fails closed for non-implementation stages in the first scope.
- behavior:
  - runs existing `refresh` explicitly as part of the command;
  - reads `status`, `attention`, and `queue` after refresh;
  - writes durable artifact under existing managed evidence roots, for example `.dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json`;
  - updates implementation stage state and mirrored frontmatter with summary fields.

Durable hygiene artifact fields:

- `version`
- `created_at`
- `feature_id`
- `step: "implementation"`
- `dossier`
- `implementation_step_artifact`
- `implementation_process_complete_ts`
- `refresh_ran_at`
- `backlog_last_refresh_at`
- `refresh_summary`
- `status_summary`
- `attention_summary`
- `queue_summary`
- `open_source_review_count`
- `source_review_blocked_item_count`
- `lifecycle_reconciliation_drift_count`
- `unresolved_attention_present`
- `backlog_clean`
- `blockers`

Hygiene status rules:

- `clean`: refresh ran after implementation close and no open source reviews, no source-review blocked items, no lifecycle reconciliation drift, and no blocking hygiene blockers.
- `blocked`: refresh ran but open source reviews, source-review blocked items, or lifecycle drift remain.
- `missing`: implementation close requires hygiene but no hygiene artifact exists.
- `stale`: artifact exists but predates implementation close or current backlog truth timestamps such as `state.updated_at` / `last_refresh_at`.
- `not_required`: non-implementation stages and legacy implementation states without the new required flag.

Update readiness surfaces:

- `next-step --dossier <implementation dossier>` reports `post_close_backlog_hygiene_status`, artifact path, and blockers when implementation is complete.
- `status` reports deterministic counts such as `post_close_hygiene_missing_count`, `post_close_hygiene_stale_count`, `post_close_hygiene_blocked_count`, and compact affected feature ids.
- `queue` emits warnings when stale/missing/blocked post-close hygiene exists, without changing queue ranking in this issue.

Preserve source-review semantics:

- `post-close-hygiene` must not call `ack-source-review`;
- no-op source-review outcomes remain operator/agent-authored and explicit;
- open source reviews are surfaced through artifact, `status`, `attention`, and readiness warnings.

### Tests

Add focused CLI tests for:

- successful `implementation` close marks post-close hygiene required/missing without running refresh;
- `post-close-hygiene` on a clean backlog writes durable artifact and updates stage state to `clean`;
- `post-close-hygiene` after changed source opens source-review evidence and marks hygiene `blocked` without auto-ack;
- `next-step` reports missing hygiene after future implementation close when checkpoint has not run;
- `status` reports stale/missing/blocked hygiene counts deterministically;
- stale hygiene is detected when artifact predates implementation close or current backlog truth timestamps;
- `queue` emits warning metadata without queue-ranking redesign;
- historical implementation closure lacking new required field remains `not_required` / legacy-compatible;
- explicit `ack-source-review` or patch workflow remains required to resolve open source reviews.

Add docs-contract tests for:

- active docs require post-implementation hygiene before branch-complete reporting or next-intake recommendation;
- docs forbid `dossier-step-close` auto-refresh and auto-ack;
- source-review semantics remain explicit;
- source-bundle/generated surfaces mention any new shipped helper command only after runtime/help/tests expose it.

## План работ

1. Update docs first:
   - update active references and utility spec with post-close hygiene workflow;
   - update `skill.yaml` / generated `SKILL.md` if a new command is shipped;
   - add docs-contract assertions for no auto-refresh, no auto-ack, and branch-complete hygiene evidence.
2. Extend stage-state schema:
   - add post-close hygiene fields;
   - normalize old artifacts with `not_required` defaults unless future required flag is present;
   - mirror fields into implementation stage log frontmatter.
3. Mark future implementation closures:
   - update successful implementation `dossier-step-close` recording to set hygiene required/missing after closure;
   - keep implementation close success independent from post-close hygiene.
4. Implement `post-close-hygiene` helper:
   - resolve feature/dossier safely;
   - validate implementation closure exists;
   - run explicit existing `refresh`;
   - collect `status`, `attention`, and `queue`;
   - write durable hygiene artifact;
   - update stage state/frontmatter summary.
5. Wire readiness surfacing:
   - update `next-step` for dossier-local missing/stale/blocked hygiene;
   - update `status` counts and affected feature ids;
   - add queue warning metadata without ranking changes.
6. Add runtime tests for clean, blocked, missing, stale, queue warning, and legacy-compatible paths.
7. Add regression tests proving source reviews are not auto-acked and closure is not blocked by hygiene.
8. Build runtime artifact and run verification.
9. Re-run skill source compiler so generated `SKILL.md`, copied runtime artifacts, source-bundle metadata, active references, and tests remain aligned.

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

- close implementation successfully and confirm hygiene is required/missing without refresh side effects;
- run hygiene checkpoint on clean backlog and confirm clean artifact/state;
- mutate a registered source, run checkpoint, and confirm open source-review blockers are visible and not auto-acked.

## Риски и side effects

- A new helper command expands command surface; help, runtime behavior, tests, source bundle, and generated `SKILL.md` must move together.
- Running `refresh` inside the explicit checkpoint is a real backlog mutation; command docs must make this clear and keep it outside `dossier-step-close`.
- Staleness detection must avoid retroactively invalidating historical closures; use explicit future-required state.
- Queue warnings must not become a hidden ranking redesign.
- Hygiene artifacts can grow noisy if full attention/queue payloads are dumped; keep summaries bounded and link only needed counts/ids.

## External Audit

Status: reviewed

Reviewer: external agent `Mencius`

Verdict: `PASS`

Findings: none.

Required changes: none.

Residual risks accepted for implementation:

- `post-close-hygiene` must respect existing backlog and delivery mutation lock ordering while running `refresh` and writing stage state/frontmatter.
- Staleness detection against `state.updated_at` / `last_refresh_at` must remain deterministic and legacy-safe.
- `unresolved_attention_present` must be computed from bounded `attention` summary, not prose or unbounded payload dumps.
