# План имплементации `ISS-06`

Issue: [issue-20260424-3.md](issue-20260424-3.md)

Status: audited

## Рабочие допущения

- Текущий runtime уже пишет default review artifact в уникальный путь с commit/timestamp/uuid, но это не является явной round identity и не описано как immutable per-round evidence contract.
- `review-artifact` остается helper для записи уже полученного external audit result; он не запускает и не доказывает независимость аудита.
- `.dossier/stages/*` остается authoritative structured coordination and validation surface для review events и close-out validation.
- Stage log frontmatter остается bounded mirror для parity-protected machine fields.
- Совместимость существующих consumers важнее чистоты новой схемы: stable latest references должны оставаться readable как обычные review artifact JSON copies, но они не должны быть единственным evidence.
- Историческая миграция старых overwritten artifacts не входит в задачу; новая схема должна предотвращать новые потери evidence.

## Цель

После implementation каждый `review-artifact` attempt оставляет отдельный immutable JSON artifact с full findings/provenance, а helper-managed stage state связывает каждый review event с этим immutable path и explicit round identity.

Observable outcome:

- `FAIL` review, за которым следует `PASS` того же `audit_class`, оставляет оба полных artifact файла в `.dossier/reviews/<feature>/`;
- stage state содержит два `review_events` с разными immutable paths и разными round ids;
- stable latest path, если он записывается, содержит backward-compatible copy последнего artifact как compatibility convenience и не заменяет immutable evidence;
- `dossier-step-close` принимает финальный valid `PASS` bundle и не требует удаления/перезаписи раннего `FAIL`;
- retrospective reconstruction может восстановить must-fix findings, remediation sequence и final pass из structured artifacts без stage-log prose.

## Scope

- Active references:
  - [../../references/audit-policy.md](../../references/audit-policy.md)
  - [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
  - [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
  - [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
  - [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- Maintainer-facing utility spec:
  - [../utility-spec.ru.md](../utility-spec.ru.md)
- Runtime:
  - `src/vendor/dossier-engineer/commands.ts`
  - `src/delivery/stage-control.ts`
  - `src/shared/stage-state.ts`
  - `src/unified-cli.ts`
  - generated `scripts/dossier-engineer.mjs`
- Tests:
  - `test/cli.test.ts`
  - `test/docs-contract.test.ts`

## Non-Goals

- Не удалять compatibility behavior для существующих stable/latest review artifact consumers без planned migration.
- Не менять policy required external independent audits и не заменять reviewer launch discipline artifact metadata.
- Не требовать historical artifact migration или reconstruction already lost overwritten evidence.
- Не redesign-ить весь `.dossier/reviews` layout шире review attempt identity and latest compatibility copies.
- Не дублировать большие command outputs в каждый review artifact.
- Не заставлять reviewers писать source code или менять форму reviewer output вне уже поддержанных `--must-fix`, `--should-fix`, `--evidence`, `--notes`.

## Затронутые поверхности

### Active instructions

Update active references to define immutable review-attempt evidence:

- `audit-policy.md`: state that `review-artifact` persists one immutable review attempt, and that later attempts supersede for closure only through policy validation, not by overwriting earlier evidence.
- `telemetry-and-closure.md`: add required review-event fields for attempt identity, round number, immutable artifact path, and optional latest copy path; clarify that `review_artifacts` keeps immutable evidence links.
- `delivery-workflow-layer.md`: clarify implementation rerounds preserve failed review evidence and close only from a final valid PASS bundle.
- `commandized-stage-control.md`: list review attempt linkage as parity-protected state and keep stage controllers subordinate to helper-owned closure truth.
- `runtime-and-command-boundary.md`: document that shipped helper behavior writes bounded deterministic review attempt artifacts and compatibility latest copies without claiming launch-mode proof.
- `docs/utility-spec.ru.md`: align review artifact layout, helper output, stage-state schema, and close-out validation semantics.

### Runtime

Add a small review-attempt identity helper:

- derive next round number for `(feature_id, step, audit_class)` from helper-managed stage state first, then existing managed review artifacts as fallback;
- expose deterministic identifiers:
  - `review_attempt_id`, for example `<step>--<audit_class>--rNN`;
  - `review_round_id`, for example `rNN`;
  - `review_round_number`, as a positive integer;
- produce bounded immutable default filenames, for example `<step>--<audit_class>--rNN--<verdict-lower>--<commit-or-no-commit>.json`;
- if a collision exists, fail closed or add a bounded suffix while preserving the same round id only when retrying the same failed write is explicitly safe; do not overwrite a different artifact.

Extend review artifact JSON with:

- `review_attempt_id`
- `review_round_id`
- `review_round_number`
- `artifact_role: "immutable_attempt"`
- `latest_copy_path` when a compatibility latest copy is written
- existing provenance, findings, freshness, implementation scope, and security-trigger fields unchanged.

Keep compatibility paths:

- define stable/latest names per `(step, audit_class)`, for example `<step>--<audit_class>--latest.json`;
- write latest as a full backward-compatible review artifact JSON copy only after the immutable artifact write succeeds;
- include all fields old consumers expect on the latest copy, including `audit_class`, `verdict`, `findings`, reviewer provenance, stage, feature, and freshness fields;
- stamp the latest copy with `artifact_role: "latest_copy"` and `immutable_artifact_path` so new consumers can resolve the authoritative immutable attempt;
- never use latest as the only durable evidence;
- validate latest paths remain inside `.dossier/reviews/<feature>/`.

Extend helper-managed stage state and stage log frontmatter:

- add attempt identity fields to every `review_events` element;
- keep `artifact_path` as the immutable attempt path;
- add optional `latest_copy_path`;
- keep `review_artifacts` as an ordered unique list of immutable attempt paths, including FAIL and PASS attempts;
- add a derived latest-valid-pass view only if needed for close-out or telemetry, without removing event history.

Update `dossier-step-close`:

- accept immutable attempt paths passed via `--review-artifact`;
- if a latest copy path is passed for compatibility, resolve and validate its `immutable_artifact_path`, then record the immutable path in new outputs;
- choose one final valid PASS per required audit class from explicit inputs and stage-state events;
- keep duplicate same-audit-class inputs rejected unless the command intentionally distinguishes historical attempts from the final PASS bundle;
- require the selected PASS artifact to be recorded in current stage state through `review-artifact`;
- preserve existing freshness, same-thread, invalidated, external-mode, implementation-scope, audit-order, and security-trigger validations;
- write step artifact `review_artifacts` as the selected final PASS bundle while preserving full review history in stage state.

Update lifecycle/retrospective support:

- ensure lifecycle aggregation can count rerounds from structured `review_events` and not only from latest artifacts;
- expose enough structured fields for retrospective tooling to map FAIL findings to later PASS attempts by `audit_class`, `review_round_number`, `event_commit`, and `artifact_path`.

### Tests

Add focused CLI tests for:

- one `FAIL` then one `PASS` for the same stage/audit class leaves two immutable artifact files and preserves the first file content;
- stage state records two review events with distinct `review_round_number`, `review_attempt_id`, and immutable `artifact_path`;
- stable/latest full artifact copy updates to the PASS attempt while the FAIL artifact remains readable;
- old-consumer compatibility: reading the stable/latest path as a normal review artifact exposes `audit_class`, `verdict`, `findings`, reviewer provenance, stage, feature, and freshness fields;
- `dossier-step-close` succeeds with the final valid PASS artifact and its step artifact uses the selected PASS bundle, not the old FAIL;
- `dossier-step-close` rejects a latest copy path when it cannot resolve to a managed immutable attempt artifact;
- repeated same-class attempts remain deterministic and bounded inside `.dossier/reviews/<feature>/`;
- implementation code-bearing bundle still enforces spec -> code -> security audit order using selected PASS attempts, not historical FAIL attempts.

Add docs-contract tests for:

- active references require immutable per-round review artifacts;
- docs state stable/latest references are backward-compatible full artifact copies, not sole evidence;
- docs preserve the boundary that `review-artifact` records already obtained audits and `dossier-step-close` validates the durable bundle.

## План работ

1. Update docs first:
   - add immutable review-attempt contract to active references;
   - align `docs/utility-spec.ru.md`;
   - add docs-contract assertions for immutable attempts and latest-copy boundaries.
2. Extend stage-state schema:
   - add review event attempt identity fields;
   - normalize old events without those fields defensively;
   - keep frontmatter mirror bounded and backward-compatible.
3. Add review-attempt identity/path helper:
   - compute next round from stage state and managed files;
   - generate bounded immutable path;
   - generate optional stable/latest copy path;
   - validate all paths through existing managed path guards.
4. Update `review-artifact`:
   - write immutable attempt artifact first;
   - write backward-compatible latest artifact copy second;
   - stamp attempt fields into artifact JSON;
   - report immutable path in stdout and include latest copy path only as secondary output.
5. Update `recordReviewArtifactOnStageLog` and wrapper parsing:
   - read attempt fields from artifact JSON;
   - persist them into `review_events`;
   - append immutable paths to `review_artifacts` without collapsing old events.
6. Update `dossier-step-close`:
   - validate selected final PASS bundle from immutable artifacts;
   - preserve existing blockers and freshness checks;
   - avoid treating historical FAIL attempts as duplicate selected bundle inputs;
   - keep step artifact focused on final selected PASS artifacts while stage state keeps full history.
7. Update lifecycle/retrospective aggregation as needed:
   - compute rerounds from structured review events;
   - ensure no code path depends on reading only the latest review artifact.
8. Add regression and parity tests.
9. Build runtime artifact and run verification.

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

- run a same-class `FAIL` review and then a `PASS` review;
- confirm both immutable JSON files exist and the `FAIL` findings remain readable;
- confirm stage state links both events to immutable paths and round ids;
- close the step with the PASS artifact and confirm closure does not erase the FAIL history.

## Риски и side effects

- Latest compatibility copies can still confuse consumers if docs do not clearly say they are convenience references; tests must enforce immutable paths as the evidence source while keeping latest copies backward-compatible.
- Round-number derivation can race under concurrent `review-artifact` writes; use the existing delivery lock and fail closed on unmanaged collisions.
- Existing unique timestamp/uuid paths may already be consumed; keep reading old artifacts and normalize missing attempt fields instead of breaking historical data.
- `dossier-step-close` must not accidentally accept stale or invalidated historical PASS artifacts merely because a later FAIL also exists.
- Step artifact output may intentionally contain only selected final PASS artifacts; retrospective reconstruction must use stage state `review_events` for full history.

## External Audit

Status: reviewed

Reviewer: external agent `Averroes`

Verdict: `PASS`

Findings: none.

Required changes addressed before PASS:

- First external audit by `Nash` rejected the pointer-JSON compatibility option because it could break old stable review artifact consumers. The plan now requires stable/latest compatibility paths to be full backward-compatible review artifact JSON copies, with immutable attempt paths remaining authoritative.

Residual risks accepted for implementation:

- Round-number derivation must run under the existing delivery lock and fail closed on collisions, especially after partial writes.
- Latest compatibility paths must preserve any currently documented or consumed stable names, not only introduce a new `--latest` naming shape.
- `dossier-step-close` path resolution for latest copies must canonicalize back to managed immutable artifacts before recording or validating closure.
