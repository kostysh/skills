# План имплементации `issue-20260428-2`

Plan ID: `implementation-plan-20260428-2`

Related issue: [issue-20260428-2.md](issue-20260428-2.md)

Status: audited

## Исходные артефакты

- [issue-20260428-2.md](issue-20260428-2.md) - проблема и proposed resolution для closure, audit history, post-close hygiene, policy/admission readiness и RPA producer signals.
- [implementation-plan-20260424-2.md](implementation-plan-20260424-2.md) и [../logs/implementation-log-20260424-2.md](../logs/implementation-log-20260424-2.md) - текущий контракт post-close backlog hygiene.
- [implementation-plan-20260424-3.md](implementation-plan-20260424-3.md) и [../logs/implementation-log-20260424-3.md](../logs/implementation-log-20260424-3.md) - immutable per-round review artifacts.
- [implementation-plan-20260424-4.md](implementation-plan-20260424-4.md) и [../logs/implementation-log-20260424-4.md](../logs/implementation-log-20260424-4.md) - implementation pre-review checklist evidence.
- [implementation-plan-20260425-1.md](implementation-plan-20260425-1.md) и [../logs/implementation-log-20260425-1.md](../logs/implementation-log-20260425-1.md) - audit handoff recipes, protected side-effect preset и pre-close hygiene rehearsal.
- [implementation-plan-20260428-1.md](implementation-plan-20260428-1.md) и [../logs/implementation-log-20260428-1.md](../logs/implementation-log-20260428-1.md) - текущий `intaken` lifecycle и selected-feature close-out baseline.
- [../../references/status-and-scope.md](../../references/status-and-scope.md) - canonical runtime scope, hard invariants и no-loss rule.
- [../../references/audit-policy.md](../../references/audit-policy.md) - required audit classes, external independence policy, freshness и helper boundaries.
- [../../references/audit-handoff-recipes.md](../../references/audit-handoff-recipes.md) - reviewer handoff и PASS/FAIL `review-artifact` completion rule.
- [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md) - `plan-slice`, `implementation`, closure и hygiene workflow obligations.
- [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md) - stage-controller authority, stage-state schema и readiness gates.
- [../../references/implementation-pre-review-checklists.md](../../references/implementation-pre-review-checklists.md) - существующая `policy-admission-governance` implementation risk family.
- [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md) - stage-state/log parity, closure truth, review events, process misses и retrospective telemetry.
- [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md) - shipped CLI/help/runtime parity boundary.
- [../../references/source-bundle-governance.md](../../references/source-bundle-governance.md) - source-bundle-first maintenance и regeneration workflow.
- [../utility-spec.ru.md](../utility-spec.ru.md) - maintainer-facing runtime and artifact contract.
- Ожидаемые runtime surfaces:
  - `../../src/shared/stage-state.ts`
  - `../../src/shared/post-close-hygiene.ts`
  - `../../src/delivery/stage-control.ts`
  - `../../src/unified-cli.ts`
  - `../../src/vendor/dossier-engineer/commands.ts`
  - `../../src/vendor/dossier-engineer/lib/lifecycle-telemetry.ts`
  - `../../scripts/dossier-engineer.mjs`
- Ожидаемые test surfaces:
  - `../../test/cli.test.ts`
  - `../../test/docs-contract.test.ts`

## Рабочие допущения

- Independent audit issue accepted as valid input для planning.
- Имплементация code-bearing: меняются shipped runtime behavior, schemas, help output, tests и generated runtime artifacts.
- Source-bundle files являются authoritative для active instructions; generated `SKILL.md` и `docs/compile-report.md` регенерируются, а не правятся как источник истины.
- UDE владеет policy/admission readiness gate, потому что `plan-slice`, implementation readiness и closure telemetry живут в этом skill.
- Cross-skill работа ограничена UDE producer contract и follow-up guidance. Этот план не меняет `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer` или `retrospective-phase-analysis`.
- Runtime может валидировать durable artifact facts, helper-managed stage state, review mode, reviewer/thread provenance when available, schema shape, selected bundle membership и artifact-level material-scope freshness. Runtime не должен заявлять proof of launch mode, prompt mutability, model tier или фактической независимости reviewer сверх observable provenance.
- Stage-level commit fields such as `final_delivery_commit`, `final_closure_commit`, or generic commit anchors remain optional trace links, not closure proof. In git repositories, review and verification artifact `event_commit` values are material-scope freshness anchors only when the artifacts themselves carry them; no-commit repositories keep the existing no-commit behavior.
- Policy/admission risk classification остается explicit agent input. Runtime не infer-ит risk families из filenames, code diffs, keywords, review findings, chat traces или dossier prose.
- Historical prose-only FAIL rounds не backfill-ятся как reviewer-owned immutable artifacts. Они отражаются только как structured `process_misses` или retrospective source-quality limitations.
- Existing v1 post-close hygiene artifacts остаются readable; новые batch-aware hygiene fields получают schema/version marker и compatibility mapping.
- Batch-aware post-close hygiene требует отдельной global operation lock и deterministic per-feature lock ordering. Текущий per-feature delivery lock недостаточен для команды, которая сначала меняет global backlog freshness через refresh, а затем пишет несколько feature-local stage states.

## Цель

После implementation closure и retrospective evidence должны восстанавливаться из durable UDE artifacts без trace-only inference.

Observable outcome:

- `post-close-hygiene` разделяет global refresh freshness и per-feature hygiene evidence и умеет записывать batch run, где один global refresh затрагивает несколько implementation features.
- Каждый per-feature hygiene artifact пишет `pre_status_summary`, `post_status_summary`, `global_refresh_artifact`, `affected_feature_ids`, schema version и feature-local clean/blocked/stale result.
- Required audit round считается operationally complete только когда reviewer записал PASS или FAIL immutable `review-artifact`.
- FAIL `review-artifact` требует и `--must-fix`, и `--evidence`; runtime rejects FAIL artifacts without actionable must-fix evidence.
- Authoring guidance запрещает продолжать correction work после prose/trace FAIL до reviewer-owned FAIL accounting или фиксирует structured process miss, если historical evidence cannot be recovered.
- `dossier-step-close` выбирает только latest valid PASS artifact для каждого required audit class, tied to same `event_commit`, ordered by policy, recorded in current helper-managed stage state, not same-thread when provenance is available, and not stale/degraded/invalidated.
- `dossier-step-close` validates `selected_verification_artifact` freshness against the same reviewed material scope when commit anchors are available.
- Closure diagnostics называют artifact, rejection reason, stale/mismatched verification state и next reviewer-owned accounting or verification action.
- Successful step close записывает selected closure summary в helper-managed stage state и mirrored stage-log frontmatter: `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, `selected_closure_ts`.
- `plan-slice` записывает mandatory policy/admission risk classification. Если scope declares admission, replay, evidence, release-policy или runtime-gating risk, stage не может стать `ready_for_close` без policy/admission negative matrix.
- `not_applicable` classification записывает bounded rationale через explicit runtime flag/field, а не только prose.
- `implementation --ready-for-close` rechecks linked `plan-slice` classification/matrix перед material close readiness для этих risk families.
- UDE emits structured RPA producer fields для non-PASS review events, selected closure bundle, review round identity, source identity и source-quality limitations.
- Active references, utility spec, runtime/help, tests, generated artifacts и docs-contract coverage остаются aligned.

## Область работ

Входит в работу:

- post-close hygiene schema v2 и batch-aware runtime behavior;
- global refresh artifact plus per-feature hygiene artifact linkage;
- PASS и FAIL `review-artifact` completion rules, including FAIL `must_fix` + `evidence` validation;
- review-bundle selection и close-out diagnostics in `dossier-step-close`;
- selected closure bundle fields in step artifacts, helper-managed stage state и mirrored stage-log frontmatter;
- explicit structured process-miss guidance for missing FAIL artifacts;
- new portable UDE policy/admission risk-family reference;
- `plan-slice` risk classification, rationale и negative-matrix input/runtime validation;
- implementation readiness recheck for policy/admission plan evidence;
- RPA producer fields emitted by UDE artifacts;
- source-bundle, generated `SKILL.md`, runtime `scripts/`, tests и utility spec parity;
- implementation log и docs navigation updates after implementation.

Не входит в работу:

- no change to `issue-20260428-1` или `intaken` lifecycle implementation;
- no edits to reviewer skills или `retrospective-phase-analysis` beyond documenting UDE producer fields and possible follow-up expectations;
- no synthetic reconstruction of old prose-only FAIL artifacts as if reviewers wrote them originally;
- no project application code changes outside this skill;
- no new public launcher, unsupported repository layout, migration command или compatibility surface;
- no runtime inference of policy/admission risks from code/prose;
- no cryptographic attestation of reviewer independence.

## Предлагаемые изменения

### Active instructions и utility spec

Добавить новый active reference:

- `references/policy-admission-risk-families.md`
  - определить portable UDE-owned taxonomy: `admission`, `replay`, `evidence`, `release-policy`, `runtime-gating`;
  - определить when classification is required, when `not_applicable` is valid, and what evidence must exist for applicable scope;
  - определить negative matrix shape: `AC -> risk -> negative test -> production path -> evidence source`;
  - указать, что other skills may reference this guidance by skill name, but UDE remains usable when copied by itself.

Обновить существующие active references:

- `delivery-workflow-layer.md`
  - require explicit `plan-slice` policy/admission classification before implementation handoff;
  - require negative matrix for matching risks;
  - preserve pre-close hygiene rehearsal and post-close hygiene as separate gates.
- `commandized-stage-control.md`
  - add plan-slice policy/admission fields to parity-protected stage-state/log fields;
  - document stage-controller input flags and validation boundaries;
  - preserve rule that stage controllers do not author semantic plan content.
- `implementation-pre-review-checklists.md`
  - cross-reference new risk-family reference;
  - clarify how implementation pre-review evidence differs from plan-slice negative-matrix evidence.
- `audit-policy.md` and `audit-handoff-recipes.md`
  - harden PASS/FAIL completion language;
  - require FAIL `review-artifact` creation with `must_fix` and repo-relative `evidence` before authoring correction continues;
  - include policy/admission matrix and prior non-PASS artifacts in reviewer handoff inputs when applicable.
- `telemetry-and-closure.md`
  - add selected closure bundle fields, non-PASS event producer fields, source identity fields, source-quality fields and process-miss guidance;
  - split global refresh freshness from per-feature hygiene evidence in telemetry contract.
- `telemetry-and-closure.md`, `commandized-stage-control.md`, and `unified-artifact-topology.md`
  - reconcile freshness validation with the existing optional commit-anchor rule;
  - state that stage-level commit metadata remains optional trace context and is not closure proof;
  - state that artifact-level `event_commit` on review and verification artifacts is used as a material-scope freshness signal in git repos when present or expected, while no-commit repositories do not invent a commit requirement.
- `runtime-and-command-boundary.md` and [../utility-spec.ru.md](../utility-spec.ru.md)
  - align command/help/schema contract for new flags, artifact fields, error codes, and output fields.
- `skill.yaml`, `fragments/*`, generated `SKILL.md`, and `docs/compile-report.md`
  - register the new reference and regenerate generated output through `skill-source-compiler`.

### Runtime: Review Artifact Completion

Update `review-artifact` behavior in `src/vendor/dossier-engineer/commands.ts` and wrapper linkage in `src/unified-cli.ts`:

- require at least one `--must-fix` on `--verdict FAIL`;
- require at least one `--evidence` on `--verdict FAIL`;
- if implementation introduces a structured finding DSL, require every FAIL finding to link to evidence; otherwise enforce the current minimum of non-empty `must_fix[]` and non-empty `evidence[]`;
- continue rejecting PASS artifacts with `--must-fix`;
- stamp immutable attempt identity, round identity, latest-copy linkage, verdict, findings, reviewer provenance, thread provenance when available, `event_commit`, and allowed/freshness state;
- ensure FAIL and PASS attempts both append to `review_events[]` and `review_artifacts`;
- add tests proving FAIL without `--must-fix` fails, FAIL without `--evidence` fails, the immutable review artifact stores full `must_fix` and `evidence` findings, and stage state/log store immutable artifact linkage plus bounded counts.

### Runtime: Review Bundle Closure

Update `dossier-step-close` and stage-log linkage:

- resolve latest-copy paths to immutable attempts before validation;
- reject unmanaged, missing, duplicate, stale, degraded, invalidated, same-thread, wrong-feature, wrong-step, wrong-commit, wrong-scope, non-PASS, or not-latest selected artifacts with artifact-specific diagnostics;
- reject selected artifacts that are not the latest recorded attempt for their audit class in current helper-managed stage state;
- preserve fixed audit order for code-bearing implementation: `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`;
- require all selected artifacts to share closure `event_commit` when running in a git repo;
- validate selected verification freshness:
  - when selected review artifacts share an `event_commit`, the selected verification artifact `event_commit` must match it;
  - when current `HEAD` is available in a git repo, selected review and verification artifact `event_commit` values must also match current `HEAD`;
  - verification artifacts missing `event_commit` in a git repo are stale because `dossier-verify` is expected to stamp the artifact-level material-scope anchor there;
  - no-commit repositories and explicitly non-git roots do not fail solely because no commit anchor exists;
  - stale or mismatched verification is rejected with artifact-specific diagnostics and `next_action: "rerun dossier-verify for the reviewed material scope"`;
  - this validation does not treat stage-log/frontmatter commit fields as closure proof; it uses only selected artifact metadata plus current git state where available;
- record `selected_closure_bundle` object in the step artifact with round identity, selected review paths, selected verification artifact, selected step artifact, audit-class order, close timestamp, and source identity/source-quality producer fields;
- define selected closure round fields explicitly:
  - `closure_bundle_id` is the authoritative close-bundle identity for the selected close attempt;
  - `closure_bundle_rounds_by_audit_class` is the authoritative per-audit-class map of selected `review_round_number` values;
  - `closure_bundle_round` is a compatibility scalar equal to the maximum selected `review_round_number` and must not be used as the identity for mixed-round bundles;
- mirror compact summary to helper-managed stage state and stage-log frontmatter as `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, and `selected_closure_ts`;
- keep older `review_artifacts` as full attempt history, including non-PASS attempts.

### Runtime: RPA Producer Fields

Add concrete producer schema to step artifacts and helper-managed stage state.

`rpa_source_identity`:

- `schema_version`;
- `feature_id`;
- `backlog_item_key`;
- `feature_cycle_id`;
- `cycle_id`;
- `stage`;
- `dossier`;
- `stage_log`;
- `stage_state_path`;
- `step_artifact`;
- `event_commit`;
- `session_id`;
- `trace_runtime`.

`rpa_source_quality`:

- `schema_version`;
- `review_history_quality: complete|process_miss|limited`;
- `selected_bundle_quality: complete|blocked|stale|invalid`;
- `missing_fail_artifact_count`;
- `trace_only_fail_count`;
- `same_thread_rejected_count`;
- `invalid_launch_mode_process_miss_count`;
- `unrecoverable_historical_fail_present`;
- `limitations: string[]`.

Derivation rules:

- `review_history_quality: complete` when every `review_events[]` non-PASS entry has a managed immutable artifact path and no related missing/trace-only process miss exists;
- `review_history_quality: process_miss` when structured `process_misses[]` records missing FAIL artifacts, trace-only FAIL, invalid launch mode, or unrecoverable historical FAIL evidence;
- `review_history_quality: limited` when review history is present but source identity, immutable artifact linkage, or freshness data is incomplete without a specific process-miss category;
- `selected_bundle_quality: complete` when `dossier-step-close` completed and every selected review/verification artifact is valid, fresh, managed, latest, policy-ordered, and tied to the selected close;
- `selected_bundle_quality: blocked` when close writes a blocked step artifact with unresolved blockers;
- `selected_bundle_quality: stale` when selected review or verification evidence is stale against current material scope;
- `selected_bundle_quality: invalid` when selected evidence is degraded, invalidated, same-thread, unmanaged, wrong-scope, wrong-step, wrong-feature, wrong-order, wrong-commit, or not latest.

`non_pass_review_events[]`:

- `review_attempt_id`;
- `review_round_id`;
- `review_round_number`;
- `audit_class`;
- `verdict`;
- `artifact_path`;
- `latest_copy_path`;
- `event_commit`;
- reviewer provenance;
- freshness and invalidation state;
- `must_fix_count`;
- `evidence_count`.

Правила:

- these fields are producer contracts for RPA consumption, not RPA policy;
- RPA must not need trace parsing to reconstruct non-PASS review events when immutable artifacts exist;
- if immutable FAIL evidence is absent, UDE records structured `process_misses[]` and marks `rpa_source_quality.review_history_quality` as `process_miss` or `limited`.

### Runtime: Process Misses

Update process-miss guidance and tests:

- supported categories include `missing-fail-review-artifact`, `trace-only-fail`, `invalid-review-launch-mode`, `same-thread-review-artifact`, and `source-quality-limitation`;
- stage log prose may mention the miss, but `process_misses[]` remains structured source of truth;
- historical prose-only FAIL and invalid launch-mode findings are not converted into synthetic reviewer-owned artifacts;
- close diagnostics should advise either rerun reviewer-owned accounting or record a process miss when original reviewer accounting is unrecoverable.

### Runtime: Post-Close Hygiene V2

Update `post-close-hygiene`, hygiene evaluation, status/queue/next-step overlays, and tests:

- introduce a global refresh artifact for a hygiene run, stored under a managed `.dossier/verification/` path and referenced by per-feature artifacts;
- serialize batch hygiene through explicit lock ordering:
  - acquire global `post-close-hygiene` operation lock before refresh or artifact writes;
  - run global refresh under the existing backlog mutation lock and release it before feature-local delivery writes;
  - compute affected feature ids;
  - acquire per-feature delivery locks in sorted `feature_id` order before writing per-feature artifacts and stage state/frontmatter;
  - release per-feature locks in reverse order;
- collect `pre_status_summary` before refresh and `post_status_summary` after refresh/status/attention/queue checks;
- identify affected implementation features whose hygiene status changed or became stale/blocked because global truth changed;
- write one per-feature artifact for every affected feature, preserving the existing current-feature path for compatibility where possible;
- add schema/version marker for v2 artifacts and keep v1 artifacts readable for stale/missing/blocked evaluation;
- stage state stores per-feature hygiene result, `global_refresh_artifact`, `affected_feature_ids`, status summary timestamps, and blockers;
- `status`, `queue`, and `next-step` explain stale hygiene as feature-local evidence status, not as current-feature cleanup debt caused by another feature's refresh.
- handle partial failures explicitly:
  - global artifact records `run_id`, affected feature ids, per-feature write statuses, and `result: complete|partial|failed`;
  - a feature is not marked `clean` unless its per-feature artifact write and stage state/frontmatter update both succeed;
  - if any feature update fails, preserve successful per-feature artifacts, mark global artifact `partial`, return non-zero with failed feature ids and retry command, and let a later rerun reconcile missing/stale per-feature evidence.

### Runtime: Policy/Admission Plan-Slice Gate

Add explicit plan-slice readiness inputs and schema fields.

Proposed plan-slice flags:

- `--policy-admission-risk-profile <not_applicable|applicable>`
- `--policy-admission-risk-rationale <text>`
- repeatable `--policy-admission-risk <admission|replay|evidence|release-policy|runtime-gating>`
- repeatable `--policy-admission-negative <dsl>`

Proposed negative-matrix DSL:

```text
ac=<id>;risk=<id>;negative_test=<text>;production_path=<path-or-behavior>;evidence=<path-or-command>
```

Stage-state fields:

- `policy_admission_risk_profile`;
- `policy_admission_risk_rationale`;
- `policy_admission_risk_families`;
- `policy_admission_negative_matrix`;
- `policy_admission_matrix_status`;
- `policy_admission_matrix_blockers`.

Runtime validation:

- `plan-slice --ready-for-close` fails when classification is missing;
- `not_applicable` requires no declared risks and a non-empty bounded rationale;
- `applicable` requires at least one declared risk and at least one valid negative-matrix row for every declared risk;
- risk ids are bounded to the UDE policy/admission taxonomy;
- rows must include AC, risk, negative test, production path, and evidence source;
- runtime validates shape and declared-risk coverage, while external `spec-conformance-reviewer` validates semantic AC completeness;
- implementation readiness rechecks latest plan-slice state for missing or incomplete policy/admission matrix before final material close readiness;
- runtime never infers risks from source code, filenames, diffs, or prose.

### Тесты

Добавить docs-contract tests для:

- new active policy/admission reference is reachable from `skill.yaml` and generated `SKILL.md`;
- plan-slice classification, rationale, and matrix are mandatory in active references;
- risk taxonomy and matrix shape are present in active guidance and utility spec;
- PASS and FAIL `review-artifact` completion rule appears in audit policy and recipes;
- FAIL correction stop rule and structured process-miss guidance are documented;
- selected closure bundle fields are documented in telemetry/utility spec;
- docs reconcile optional stage-level commit anchors with artifact-level review/verification freshness anchors and preserve no-commit repository behavior;
- RPA producer fields include source identity and source-quality schema;
- post-close hygiene docs separate global refresh evidence from per-feature hygiene evidence;
- active docs preserve no-runtime-inference and no-synthetic-backfill rules.

Добавить CLI/runtime tests для:

- `review-artifact --verdict FAIL` without `--must-fix` fails;
- `review-artifact --verdict FAIL` without `--evidence` fails;
- FAIL with both `--must-fix` and `--evidence` writes immutable attempt and appends non-PASS `review_events[]`;
- later PASS does not overwrite earlier FAIL and close selects only latest valid PASS bundle;
- close rejects stale, duplicate, wrong-step, wrong-feature, degraded, invalidated, same-thread, not-latest, wrong-order, and wrong-commit selected review artifacts with actionable diagnostics;
- close rejects selected verification artifact whose `event_commit` is missing or mismatched against selected review bundle/current `HEAD` when commit anchors are available;
- successful close writes selected closure summary, including `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, and RPA producer fields into step artifact, stage state, and stage-log frontmatter;
- `post-close-hygiene` v2 writes global refresh plus per-feature artifacts for multiple affected features and keeps v1 artifacts readable;
- concurrent or overlapping `post-close-hygiene` v2 runs serialize through global operation lock and sorted per-feature delivery locks;
- simulated per-feature write failure leaves global artifact `partial`, preserves successful feature artifacts, reports failed feature ids, and does not mark failed features `clean`;
- status/queue/next-step surface global-refresh-induced stale state without attributing it as current-feature cleanup debt;
- `plan-slice --ready-for-close` fails on missing classification, missing rationale for `not_applicable`, invalid risk ids, incomplete matrix rows, and applicable risks without matrix coverage;
- `implementation --ready-for-close` blocks when linked plan-slice policy/admission matrix is missing or incomplete for declared risks;
- generated `scripts/dossier-engineer.mjs` matches source behavior.

## План работ

1. Inventory current runtime/help behavior for `review-artifact`, `dossier-step-close`, `post-close-hygiene`, `plan-slice`, `implementation`, `status`, `queue`, and `next-step`.
2. Update source-bundle active references and utility spec with policy/admission reference, review completion rules, selected closure summary, RPA producer schema, hygiene v2 contract, and process-miss rules.
3. Add docs-contract tests for the new active guidance and negative rules.
4. Extend `StageStateRecord`, frontmatter mirroring, normalization, and stage-log rendering for selected closure summary, policy/admission matrix fields, hygiene v2 fields, and RPA producer fields.
5. Harden `review-artifact` validation for FAIL `must_fix` and `evidence`; ensure wrapper linkage appends PASS and FAIL events consistently.
6. Harden `dossier-step-close` review-bundle resolution, not-latest selection checks, artifact-level material-scope freshness checks, selected verification freshness checks, no-commit repository handling, policy order checks, diagnostics, and selected bundle persistence.
7. Implement RPA producer fields and process-miss quality mapping in step artifacts and helper-managed stage state.
8. Implement post-close hygiene v2: global refresh artifact, deterministic global/per-feature lock ordering, affected-feature discovery, per-feature artifact writes, partial-failure accounting, v1 compatibility reads, and read-model overlays.
9. Implement plan-slice policy/admission classification inputs, rationale field, negative-matrix validation, help text, output fields, and implementation readiness recheck.
10. Add focused CLI regression tests and fixtures for review history, closure selection, hygiene v2, policy/admission readiness, and RPA producer fields.
11. Add focused CLI regression tests and fixtures for `rpa_source_quality` derivation across `complete`, `process_miss`, `limited`, `blocked`, `stale`, and `invalid` cases where practical.
12. Rebuild `scripts/dossier-engineer.mjs` from source.
13. Regenerate generated skill artifacts through `skill-source-compiler`.
14. Create implementation log under `docs/logs/` and update [../README.md](../README.md) with final implementation status.
15. Run verification, portability checks, and instruction-quality audit for substantial active-instruction changes.

## Verification

Обязательные команды:

```bash
pnpm --filter @kostysh/unified-dossier-engineer format
pnpm --filter @kostysh/unified-dossier-engineer lint
pnpm --filter @kostysh/unified-dossier-engineer typecheck
pnpm --filter @kostysh/unified-dossier-engineer test
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer
git diff --check -- skills/unified-dossier-engineer
```

Целевые behavioral checks:

- run FAIL external review accounting and confirm immutable FAIL artifact, `must_fix`, `evidence`, `review_events[]`, `review_artifacts`, and `non_pass_review_events[]` are durable;
- run later PASS bundle and confirm close selects only valid latest PASS attempts while preserving FAIL history;
- attempt close with stale/degraded/same-thread/not-latest artifacts and confirm diagnostics name artifact, reason, and next accounting action;
- attempt close with stale or mismatched verification artifact and confirm diagnostics name verification artifact, reason, and next action to rerun `dossier-verify`;
- run no-commit repository close-out and confirm the absence of commit anchors alone does not block closure;
- confirm docs-contract coverage preserves the distinction between optional stage-level commit trace links and artifact-level freshness anchors in git repos;
- run `post-close-hygiene` where one refresh affects multiple implementation features and confirm global refresh plus per-feature hygiene artifacts;
- run concurrent/overlapping `post-close-hygiene` attempts and a partial-failure fixture to confirm global lock, sorted per-feature locks, `partial` global artifact status, retry-safe output, and no false clean state;
- run plan-slice with `not_applicable` classification plus rationale and with applicable policy/admission risks plus negative matrix;
- confirm implementation readiness blocks when required plan-slice matrix evidence is absent;
- inspect generated stage log frontmatter and step artifact for selected closure summary;
- inspect UDE artifacts as RPA input and confirm `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events[]`, and selected closure bundle are available without trace parsing.

Portability и instruction quality:

- search changed `skills/unified-dossier-engineer` files for absolute local paths;
- confirm all required active references exist inside the skill folder and are reachable from `SKILL.md`;
- confirm no docs-only runtime behavior was introduced without source/help/test parity;
- run the `skill-source-compiler` instruction-quality audit workflow stage after active instruction changes and fix any gaps before finalizing.

## Риски и side effects

- Stricter FAIL artifact validation can block historical reviewer workflows that returned prose FAIL only; mitigation is process-miss recording, not synthetic backfill.
- Not-latest selected artifact rejection may fail close attempts that previously passed by selecting older PASS artifacts; diagnostics must identify the fresh reviewer-owned accounting action.
- Verification freshness checks can fail close attempts that previously had valid review artifacts but stale verification. Mitigation: return artifact-specific diagnostics and require rerunning `dossier-verify` for the selected reviewed/current material scope.
- Legacy same-thread artifacts may fail new close attempts even if they were previously accepted. Mitigation: stricter same-thread rejection applies to new close/re-close attempts after implementation; historical artifacts remain historical evidence, and reopened/reclosed stages require a valid external reviewer rerun instead of quiet acceptance.
- Post-close hygiene v2 can increase artifact volume when a global refresh affects many features; batch summary and per-feature artifacts must stay bounded.
- Post-close hygiene v2 can deadlock or leave misleading partial state if multi-feature writes are ad hoc. Mitigation: use global operation lock, sorted per-feature delivery locks, explicit `partial` global artifacts, and rerun-safe reconciliation.
- Plan-slice classification adds a new readiness requirement; `not_applicable` plus rationale keeps low-risk plans lightweight while making the decision explicit.
- Runtime validation of negative matrix shape cannot prove semantic AC completeness; external review must still evaluate matrix sufficiency.
- New RPA producer fields can drift if stage-state and step-artifact schemas diverge; tests must pin both surfaces.
- Adding a new active reference increases source-bundle/generated artifact size; compiler warnings must be treated as refactoring signals.

## Rollback plan

- Revert source-bundle reference changes, runtime schema/code changes, generated `scripts/dossier-engineer.mjs`, generated `SKILL.md`, tests, utility spec changes, and README/log updates in one revert.
- Existing v2 hygiene, selected closure, and RPA producer artifacts produced during a failed rollout remain historical evidence; do not delete them automatically.
- Existing same-thread or prose-only historical artifacts are not rewritten during rollback or forward rollout.
- If rollback removes v2 readers, affected repositories must use explicit operator guidance to inspect v2 artifacts manually or reapply the forward fix.
- Do not rewrite or delete immutable review attempts during rollback.

## External Audit

Audit status: reviewed

Auditor: external agents `Pasteur`, `Jason`, `Mill`, `Sartre`, `Volta`

Audit criteria:

- Conformance to [issue-20260428-2.md](issue-20260428-2.md).
- Coverage of source artifacts and current active/runtime surfaces that describe the problem.
- Sufficiency of proposed implementation and verification plan.
- Preservation of source-bundle-first maintenance and docs/runtime/test parity.
- Explicit handling of destructive side effects, portability, and non-backfill policy for historical prose-only FAIL rounds.

Review history:

- `Pasteur`: `FAIL`
- `Jason`: `PASS`
- `Mill`: `FAIL`
- `Sartre`: `PASS`
- `Volta`: `PASS` after PASS-audit should-fix edits

Required corrections from first audit:

- FAIL `review-artifact` evidence was under-specified. Fixed by requiring both `--must-fix` and `--evidence`, plus tests for both missing fields.
- RPA producer contract lacked concrete source identity and source-quality schema. Fixed by adding `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events[]` field contracts.
- `not_applicable` rationale was promised without runtime/schema/test path. Fixed by adding `--policy-admission-risk-rationale`, stage-state field, and tests.
- Legacy same-thread closure side effect was not explicit. Fixed in risks and rollback/new-close-attempt policy.
- Plan language was mostly English. Fixed by normalizing the document to Russian while preserving exact command, field, and artifact identifiers.

Should-fix from PASS audit applied:

- Clarified that full FAIL `must_fix` and `evidence` findings live in immutable review artifacts, while stage state/log keep links and bounded counts.
- Added derivation rules for `review_history_quality` and `selected_bundle_quality`.

Required corrections from later re-audits:

- Batch post-close hygiene lock ordering, partial-failure accounting, and concurrency behavior were under-specified. Fixed by adding global operation lock, sorted per-feature delivery locks, `partial` global artifact status, retry behavior, and tests.
- Selected verification freshness was missing from close-out hardening. Fixed by adding artifact-level `event_commit` validation against selected review bundle/current `HEAD` in git repos, diagnostics, no-commit behavior, and tests.
- `closure_bundle_round` was ambiguous. Fixed by defining authoritative `closure_bundle_id`, authoritative `closure_bundle_rounds_by_audit_class`, and compatibility scalar `closure_bundle_round`.
- Artifact-level `event_commit` freshness could conflict with active guidance that stage-level commit anchors are optional trace links. Fixed by preserving stage-level commit fields as non-proof trace metadata while using selected review/verification artifact metadata as material-scope freshness anchors in git repos only.

Residual risks accepted for implementation:

- Runtime enforcement of reviewer independence remains limited to observable provenance; launch-mode proof still depends on process discipline.
- The `event_commit` freshness contract needs careful fixtures so git-repo, no-commit repo, and non-git root behavior stay aligned with docs-contract tests.
- Later final check by `Volta` found no must-fix findings after should-fix edits.

Final status: `PASS`
