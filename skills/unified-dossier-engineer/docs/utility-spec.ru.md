# Спецификация объединённой утилиты `dossier-engineer`

## Статус документа

Этот документ является **maintainer-facing utility specification** для canonical shipped runtime `dossier-engineer`.

Он поддерживает активные references, runtime/help/tests parity и maintainer-facing schema reasoning. Если этот supporting документ расходится с shipped runtime, active references, help surface и tests выигрывают до исправления спецификации.

Документ:

- фиксирует shipped command contract и planned-compatible invariants;
- задаёт root / artifact / lock / output / error semantics;
- служит upstream input для runtime/help/test parity work.

Документ не делает docs-only behavior shipped: команды, flags, output fields и error codes считаются shipped только когда они есть в runtime/help/tests.

## 1. Назначение утилиты

Утилита `dossier-engineer` является единым mechanical runtime для двух внутренних подсистем skill-а:

- `backlog truth layer`
- `delivery workflow layer`

Утилита должна поддерживать:

- backlog graph truth;
- source registry and source-review handling;
- delivery-stage control;
- verification / review / closure helpers;
- lifecycle telemetry aggregation;
- repo-local retrospective discoverability.

## 2. Главные ограничения

### 2.1 Mechanical only

Утилита может:

- читать и писать артефакты;
- валидировать schema и invariants;
- считать deterministic aggregates;
- materialize-ить structured state transitions.

Утилита не может:

- анализировать prose как NLP engine;
- классифицировать смысл source changes;
- принимать semantic product decisions вместо агента;
- делать root-cause attribution.

### 2.2 Stage-controller commands не заменяют closure helpers

Primary delivery stages могут стать first-class commands, но:

- их authority заканчивается на `ready_for_close`;
- authoritative `closed` state остаётся за `dossier-step-close`;
- lifecycle closure truth после step close остаётся за `lifecycle-refresh`, когда нужен lifecycle snapshot refresh.

### 2.3 Backlog truth не мутируется delivery-stage command-ами напрямую

Stage-controller commands могут only materialize-ить:

- `backlog_followup_required`
- `backlog_followup_kind`
- `backlog_followup_resolved`

Но реальные backlog mutations выполняются только backlog-side commands.

## 3. Semantic invocation form

На уровне спецификации используется semantic form:

```bash
dossier-engineer <command> [options]
```

Физический runtime entrypoint зафиксирован как `scripts/dossier-engineer.mjs` и package bin `dossier-engineer`.

## 4. Root и artifact contract

## 4.1 Repo process root

Canonical process root определяется через:

```text
.dossier/manifest.json
```

Команды могут запускаться:

- из repo root;
- из любого descendant directory;

если upward discovery находит `.dossier/manifest.json`.

## 4.2 Backlog subroot

Canonical backlog subroot определяется через:

```text
.dossier/backlog/manifest.json
```

Это поддерево остаётся отдельным mechanical truth layer внутри общего `.dossier`.

## 4.3 Human-facing SSOT boundary

Утилита не должна подменять project-facing SSOT.

Canonical human-facing docs остаются в:

```text
docs/ssot/
```

В `.dossier` живут только accounting / process / machine-facing artifacts.

## 4.4 Canonical artifact families

Unified utility должна считать canonical такими семействами:

```text
.dossier/
├── manifest.json
├── backlog/
│   ├── manifest.json
│   ├── state.json
│   ├── sources.json
│   ├── applied.json
│   ├── source-review/
│   ├── packets/
│   ├── patches/
│   ├── reports/
│   └── mutation.lock
├── logs/
├── stages/
├── reviews/
├── verification/
├── steps/
├── metrics/
├── retro/
│   └── session-index.jsonl
├── ops/
│   └── locks/
└── drift/
```

## 4.5 Path normalization

Правила:

- repo-owned artifact paths в machine-facing JSON должны быть repo-relative POSIX paths;
- source document paths хранятся как normalized POSIX paths relative to repo process root;
- для external sources допускаются `..` segments;
- absolute machine-local trace paths не должны попадать в durable repo artifacts.

## 5. Lock semantics

## 5.1 Backlog mutation lock

Все backlog mutating commands для одного process root выполняются только последовательно.

Canonical lock:

```text
.dossier/backlog/mutation.lock
```

Эта группа включает:

- `register-source`
- `update-source-path`
- `remove-source`
- `packet`
- `patch-item`
- `remove-item`
- `refresh`
- `status --refresh`
- report generation, если команда materialize-ит repo-owned report artifact

## 5.2 Delivery mutation lock

Mutating delivery commands сериализуются по feature cycle.

Canonical advisory lock path:

```text
.dossier/ops/locks/<feature-id>--<feature_cycle_id>.lock
```

Эта группа включает:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `sync-index`
- `index-refresh`
- `lint-dossiers --update-index`

Важно:

- read-only commands не берут mutation lock;
- utility specification не разрешает parallel mutating commands для одного feature cycle.

## 6. Command families

## 6.1 Bootstrap / root-management

- `help`
- `init`

### `init`

Merged `init` должен materialize-ить оба слоя:

- `.dossier/manifest.json`
- `.dossier/backlog/manifest.json`
- backlog-owned state/artifact directories
- `docs/ssot/index.md`
- `docs/ssot/features/`
- repo-local reinforcement artifacts only where the canonical process explicitly owns them

`init` не должен silently destroy existing managed truth.

## 6.2 Backlog truth commands

### Source registry and maintenance

- `register-source`
- `list-sources`
- `update-source-path`
- `remove-source`
- `refresh`

### Backlog authoring / mutation

- `template`
- `packet`
- `patch-item`
- `remove-item`

### Backlog read models

- `status`
- `report`
- `items`
- `queue`
- `attention`
- `gaps`
- `search`

Semantics:

- эти read models остаются backlog-layer surfaces by default;
- они не должны silently broaden into dossier-local workflow answers;
- `next-step` остаётся отдельной dossier-local query surface.

### Source-review helper

- `ack-source-review`

`ack-source-review` существует только для truthful no-op closure path:

- не мутирует backlog truth;
- закрывает open source-review record только explicit acknowledgment-ом;
- materialize-ит `outcome = no_backlog_change`;
- materialize-ит `resolution_kind = ack`.

## 6.3 Delivery stage-controller commands

Shipped first-class stage-controller set:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

### Common authority boundary

Все stage-controller commands:

- open / resume / block / ready-for-close the stage;
- bootstrap/update stage log;
- bootstrap/update helper-managed stage state;
- validate structured prerequisites;
- emit machine-readable transition state;
- emit explicit backlog follow-up signals.

Session provenance contract:

- агент сам определяет session id до вызова utility;
- все stage-controller write paths, которые bootstrap/update stage log или helper-managed stage state, требуют `--session-id <id>`;
- `--trace-runtime <name>` является optional explicit metadata и не имеет Codex-specific default;
- если `--session-id` отсутствует, write path fail-closed до записи stage artifacts;
- runtime записывает только явно переданное значение и не делает auto-discovery из Codex-local session store, private filesystem layout или environment fallback.

Schema authority contract:

- `.dossier/stages/*` is the authoritative structured coordination/validation surface for parity-protected stage fields;
- stage log YAML frontmatter is a bounded mirror of those fields;
- shipped writers must normalize and enforce parity for fields introduced or tightened by this schema contract.

Parity-protected machine fields:

- `backlog_followup_required`
- `backlog_followup_kind`
- `backlog_followup_resolved`
- `backlog_lifecycle_target`
- `backlog_lifecycle_current`
- `backlog_lifecycle_reconciled`
- `backlog_actualization_artifacts`
- `backlog_actualization_verdict`
- `review_artifacts`
- `review_events`
- `verification_artifacts`
- `step_artifact`
- `final_delivery_commit`
- `final_closure_commit`
- `skills_used`
- `skill_issues`
- `skill_followups`
- `process_misses`
- `primary_feature_id`
- `primary_backlog_item_key`
- `phase_scope`
- selected closure summary fields: `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, `selected_closure_ts`
- RPA producer fields: `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`
- plan-slice-only `policy_admission_risk_profile`
- plan-slice-only `policy_admission_risk_rationale`
- plan-slice-only `policy_admission_risk_families`
- plan-slice-only `policy_admission_negative_matrix`
- plan-slice-only `policy_admission_matrix_status`
- plan-slice-only `policy_admission_matrix_blockers`
- implementation-only `pre_review_risk_families`
- implementation-only `pre_review_checklists`
- implementation-only `pre_review_checklist_status`
- implementation-only `pre_review_checklist_blockers`
- implementation-only `post_close_backlog_hygiene_global_refresh_artifact`
- implementation-only `post_close_affected_feature_ids`
- implementation-only `post_close_pre_status_summary`
- implementation-only `post_close_post_status_summary`
- implementation-only `post_close_hygiene_schema_version`

Agent-supplied schema inputs:

- repeatable `--skill-used <skill-name>`;
- repeatable `--skill-issue <code-or-summary>`;
- repeatable `--skill-followup <code-or-summary>`;
- repeatable `--process-miss <dsl>`;
- optional `--phase-scope <text>`.
- `plan-slice` only: `--policy-admission-risk-profile <not_applicable|applicable>`;
- `plan-slice` only: `--policy-admission-risk-rationale <text>`;
- `plan-slice` only: repeatable `--policy-admission-risk <admission|replay|evidence|release-policy|runtime-gating>`;
- `plan-slice` only: repeatable `--policy-admission-negative <dsl>`;
- `implementation` only: repeatable `--risk-family <id>`;
- `implementation` only: repeatable `--pre-review-check <dsl>`.

`--process-miss` DSL:

```text
id=<id>;category=<category>;severity=<low|medium|high>;resolved=<true|false>;summary=<text>
```

`--pre-review-check` DSL:

```text
risk_family=<id>;id=<id>;status=<pass|not_applicable|blocked>;summary=<text>;evidence=<text>;test_refs=<comma-list>
```

`--policy-admission-negative` DSL:

```text
ac=<id>;risk=<admission|replay|evidence|release-policy|runtime-gating>;negative_test=<text>;production_path=<path-or-behavior>;evidence=<path-or-command>
```

Rules:

- selected-feature lifecycle reconciliation is explicit machine state, not inferred from prose, commits, or `docs/ssot/index.md`;
- malformed `--process-miss` entries fail before stage artifacts are written;
- malformed `--pre-review-check` entries fail before stage artifacts are written;
- malformed `--policy-admission-negative` entries fail before stage artifacts are written;
- `plan-slice --ready-for-close` requires explicit policy/admission classification: `not_applicable` with rationale and no risks, or `applicable` with bounded risk families and negative-matrix coverage;
- policy/admission risk taxonomy is `admission`, `replay`, `evidence`, `release-policy`, and `runtime-gating`;
- policy/admission negative matrix shape is `AC -> risk -> negative test -> production path -> evidence source`;
- policy/admission classification is explicit and must not be inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `--risk-family` and `--pre-review-check` are accepted only by `implementation`;
- implementation risk-family declarations are explicit and must not be inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `implementation --ready-for-close` fails before writing `stage_state: ready_for_close` when declared pre-review checklist evidence is `missing` or `blocked`, or when linked applicable `plan-slice` policy/admission matrix evidence is missing or incomplete;
- linked `plan-slice` lookup for implementation readiness uses helper-managed `.dossier/stages/<feature_id>/plan-slice.json` first, falls back to latest same-feature `plan-slice` stage log only when state is absent, requires matching `feature_cycle_id`, treats mismatched cycle identity as stale, and treats absent linked plan evidence as `not_required` for legacy/non-commandized flows;
- built-in `policy-admission-governance` requires `explicit-allow-deny`, `deny-or-failed-admission-no-invocation`, `conflicting-request-replay-fail-closed`, `ambiguous-stale-unsupported-evidence`, `freshness-timestamp-required`, `active-scope-concurrency-model`, `append-only-decision-audit-facts`, and `regression-test-paths`;
- custom risk families require at least one `pass` or `not_applicable` checklist entry and no `blocked` entries, without core runtime domain changes;
- `process_misses` is structured source of truth; `Process misses` prose is rendered mirror plus preserved human notes;
- `review_artifacts`, `review_events`, `verification_artifacts`, and `step_artifact` are explicit artifact links, not heuristic recovery;
- `review_events[]` links every review attempt to attempt id, round id, round number, immutable artifact path, optional latest copy path, audit class, verdict, reviewer provenance, freshness, invalidation state, and bounded `evidence_count`;
- `review_artifacts` is an ordered unique list of immutable attempt artifact paths, including failed and passing attempts;
- `final_delivery_commit` and `final_closure_commit` are optional trace links only and never required closure evidence;
- artifact-level `event_commit` on selected review and verification artifacts is the material-scope freshness anchor in git repositories when present or expected; no-commit repositories do not invent commit-anchor requirements;
- skill annotations are not scraped from trace or prose.

Они не:

- materialize authoritative `closed`;
- write lifecycle closure truth;
- execute helper-owned closure semantics.

### Common machine-readable transition surface

Minimum common fields:

- `stage`
- `feature_id`
- `feature_cycle_id`
- `cycle_id`
- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`
- `backlog_followup_required`
- `backlog_followup_kind`
- `backlog_followup_resolved`
- `backlog_lifecycle_target`
- `backlog_lifecycle_current`
- `backlog_lifecycle_reconciled`
- `backlog_actualization_artifacts`
- `backlog_actualization_verdict`
- `review_artifacts`
- `review_events`
- `verification_artifacts`
- `step_artifact`
- `final_delivery_commit`
- `final_closure_commit`
- `skills_used`
- `skill_issues`
- `skill_followups`
- `process_misses`
- `primary_feature_id`
- `primary_backlog_item_key`
- `phase_scope`
- `session_id`
- `trace_locator_kind`
- `trace_runtime`
- `next_commands`

Rules:

- repeated block/resume history lives in `transition_events[]`;
- `trace_locator_kind: session_id` must not be emitted with `session_id: null` by new stage-controller writes;
- ambiguous singleton fields such as `blocked_ts` / `resumed_ts` are forbidden unless explicitly marked as derived (`first_*`, `last_*`);
- `stage_state` may reach `ready_for_close`, but not authoritative `closed`.
- stage-log bootstrap/update must materialize and preserve the canonical narrative scaffold required by the active log contract;
- generated scaffold headings may remain stable labels, while authored narrative body is agent-owned and follows the active operator-language policy;
- stage-controller commands may update helper-owned structured fields and transition sections, but must not collapse a non-trivial log into a mechanical summary plus transition list.
- helper-owned updates preserve authored content without translation or normalization;
- stage-controller commands do not author or validate semantic `plan-slice` content; active methodology owns the requirement that `plan-slice` have an explicit execution target, completion recognition, and implementation boundaries before the agent treats it as ready for implementation.

## 6.4 Delivery helper / closure / integrity commands

- `contract-drift-audit`
- `coverage-audit`
- `debt-audit`
- `dependency-graph`
- `sync-index`
- `index-refresh`
- `lint-dossiers`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `next-step`
- `lifecycle-refresh`

### Helper ownership rules

- `dossier-step-close` remains the only authoritative closure writer for delivery steps;
- `dossier-step-close` enforces selected backlog item lifecycle reconciliation for `spec-compact`, `plan-slice`, and `implementation` before writing a step artifact;
- `lifecycle-refresh` remains the lifecycle aggregation helper for metrics/session-index refresh;
- `next-step` remains dossier-local query surface;
- `contract-drift-audit` remains mature-change helper, not a primary stage controller.
- `review-artifact` persists one immutable already obtained audit attempt for one audit class and does not perform the audit.

### Audit-bundle contract

Every mutating dossier stage must truthfully close only after the audit bundle required by active audit policy is satisfied.

Baseline required audit for non-code mutating stages:

- `feature-intake` -> `spec-conformance-reviewer`
- `spec-compact` -> `spec-conformance-reviewer`
- `plan-slice` -> `spec-conformance-reviewer`
- `change-proposal` -> `spec-conformance-reviewer`

Implementation review scope remains explicit mechanical input, but it is recorded on the current helper-managed implementation stage state by `implementation --ready-for-close` and then consumed by helper commands:

- `non-code` -> required audit bundle is `spec-conformance-reviewer`
- `code-bearing` -> required audit bundle is `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`

Fail-closed runtime rule:

- recorded `non-code` scope is accepted only when the runtime can mechanically confirm a documentation-only change set since implementation stage entry;
- if that confirmation is unavailable or fails, helper commands must enforce the `code-bearing` bundle instead.

`review-artifact` must persist at minimum:

- `stage`
- `audit_class`
- `review_attempt_id`
- `review_round_id`
- `review_round_number`
- `artifact_role: "immutable_attempt"` for the authoritative per-round artifact
- immutable artifact path linkage in helper-managed `review_events[]`
- optional `latest_copy_path` when a stable/latest compatibility copy is written
- reviewer provenance
- external-versus-degraded review mode
- freshness / invalidation state
- implementation review scope from the current helper-managed implementation stage state where applicable
- helper-managed stage-state membership for the current stage cycle
- security-trigger reason where applicable

FAIL `review-artifact` attempts must include at least one `--must-fix` and at least one `--evidence`. PASS attempts must not include `--must-fix`. Full FAIL `must_fix` and `evidence` findings live in the immutable review artifact; stage state/log mirrors only bounded links and counts such as `must_fix_count` and `evidence_count`.

Default review artifact filenames are bounded immutable attempt files under `.dossier/reviews/<feature>/`, for example `<step>--<audit_class>--rNN--<verdict>--<commit-or-no-commit>.json`.

Stable/latest review references are backward-compatible full artifact JSON copies. They preserve ordinary review artifact fields such as `audit_class`, `verdict`, `findings`, reviewer provenance, `stage`, `feature_id`, and freshness fields, but they must also stamp `artifact_role: "latest_copy"` and `immutable_artifact_path`. Latest copies are convenience references only; retrospective reconstruction and closure outputs must use immutable attempt artifacts as authoritative evidence.

The canonical runtime mechanically enforces only the durable subset of audit-policy launch evidence:

- external-versus-degraded review mode
- reviewer provenance and reviewer skill
- commit freshness / invalidation
- reviewer thread provenance stamped by the current runtime when available, for same-thread rejection

This remains a process-trust contract, not a tamper-resistant attestation system. Repo-local helper-managed stage state and review artifacts coordinate the managed workflow, but they are not presented as cryptographic proof against hostile manual tampering.

Helper-owned accounting artifacts such as `.dossier/logs/*`, `.dossier/stages/*`, `.dossier/reviews/*`, `.dossier/verification/*`, `.dossier/steps/*`, `.dossier/metrics/*`, `.dossier/retro/*`, `.dossier/ops/*`, backlog reports/locks, and support files like `.dossier/backlog/.gitignore` or `.dossier/backlog/AGENTS.md` do not invalidate audits by themselves. Canonical backlog truth artifacts under `.dossier/backlog/` such as `state.json`, `sources.json`, `applied.json`, `source-review/*`, `packets/*`, and `patches/*` remain material freshness invalidators.

Audit-launch rules such as `fork_context: false`, no forked/full-history inheritance, read-only reviewer prompts, and non-mini blocking models remain active policy requirements, but they are not inferred mechanically from prose or silently assumed by the runtime. Reviewer delegation with forked context or full-history inheritance does not satisfy `external independent audit`; if discovered, the audit must be invalidated and rerun with a valid external execution mode.

`review-artifact` and `dossier-step-close` record and validate observable durable provenance only. They must not claim automatic proof of launch-mode independence beyond the recorded provenance signals available to the runtime.

Implementation pre-review checklist evidence is reviewer context and author-side readiness evidence only. It is not audit evidence, not correctness proof, and not a replacement for `spec-conformance-reviewer`, `code-reviewer`, or `security-reviewer`.

`dossier-step-close` must reject truthful closure when:

- a required audit class is missing;
- a required audit is not external;
- a required audit is stale or invalidated;
- a required audit still carries blocking findings.
- current helper validation cannot confirm the required bundle from the helper-managed stage state.
- selected backlog item current delivery state is below the lifecycle target for `spec-compact`, `plan-slice`, or `implementation`.

When `--review-artifact` points at a latest copy, `dossier-step-close` resolves and validates its `immutable_artifact_path` inside `.dossier/reviews/<feature>/`. If that path is missing, unmanaged, or does not contain `artifact_role: "immutable_attempt"`, close-out fails closed. Step-close artifacts record the selected final PASS bundle as immutable attempt paths, while helper-managed stage state preserves the full review history.

Selected closure bundle contract:

- selected review artifacts must be latest valid immutable PASS attempts for each required audit class in policy order;
- selected review and verification artifacts must share the same material-scope `event_commit` in git repositories when commit anchors are available or expected;
- selected verification artifact missing or mismatched `event_commit` in a git repository is stale and should return a next action to rerun `dossier-verify` for the reviewed material scope;
- `closure_bundle_id` is the authoritative selected-close identity;
- `closure_bundle_rounds_by_audit_class` is the authoritative per-class selected round map;
- `closure_bundle_round` is compatibility scalar equal to the maximum selected round number and must not be treated as mixed-bundle identity;
- step artifacts and helper-managed stage state mirror `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, and `selected_closure_ts`;
- `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events[]` are emitted so retrospective consumers do not need trace-only inference when immutable artifacts exist.

Structured process-miss categories include `missing-fail-review-artifact`, `trace-only-fail`, `invalid-review-launch-mode`, `same-thread-review-artifact`, and `source-quality-limitation`. Historical prose-only FAIL rounds must not be backfilled as synthetic reviewer-owned immutable artifacts.

## 7. Shipped command matrix

| Command | Shipped status | Rationale |
| --- | --- | --- |
| `feature-intake` | shipped stage controller | aligns with the commandized stage-controller model |
| `spec-compact` | shipped stage controller | commandized stage boundary for compact specification |
| `plan-slice` | shipped stage controller | commandized stage boundary for implementation planning |
| `implementation` | shipped stage controller | commandized stage boundary for implementation work |
| `change-proposal` | shipped stage controller | mature change path commandized as a stage boundary |
| `contract-drift-audit` | preserve literally | helper for mature-change executable drift |
| `dossier-verify` | preserve literally | helper-owned verification artifact writer |
| `review-artifact` | preserve literally | helper-owned review persistence |
| `dossier-step-close` | preserve literally | authoritative closure artifact writer |
| `post-close-hygiene` | shipped delivery helper | implementation post-close refresh/status/attention/queue evidence |
| `lifecycle-refresh` | preserve literally | authoritative lifecycle aggregation helper |
| `next-step` | preserve literally | dossier-local query/read surface |
| `coverage-audit` | preserve literally | delivery verification helper |
| `debt-audit` | preserve literally | delivery debt helper |
| `dependency-graph` | preserve literally | dossier-side generated read helper |
| `sync-index` | preserve literally | deterministic index helper |
| `index-refresh` | preserve literally | single-writer orchestrated index refresh |
| `lint-dossiers` | preserve literally | integrity/lint helper |
| `register-source` | preserve literally | backlog source registry contract already fits canonical model |
| `list-sources` | preserve literally | source registry query surface |
| `update-source-path` | preserve literally | source identity must survive relocations |
| `remove-source` | preserve literally | source removal remains first-class maintenance path |
| `template` | preserve literally | packet/patch skeleton generation |
| `packet` | preserve literally | backlog growth path |
| `patch-item` | preserve literally | backlog mutation path |
| `remove-item` | preserve literally | backlog deletion path |
| `refresh` | preserve literally | source-review / source-derived recalculation path |
| `status` | preserve literally | backlog-layer short summary |
| `report` | preserve literally | backlog-layer report artifact |
| `items` | preserve literally | backlog full-card read model |
| `queue` | preserve literally | backlog selection read model |
| `attention` | preserve literally | backlog review-oriented read model |
| `gaps` | preserve literally | backlog blocker read model |
| `search` | preserve literally | backlog structural search |
| `ack-source-review` | add as new first-class backlog helper | explicit truthful no-op closure for source-review records |
| `init` | preserve literally with expanded canonical semantics | now bootstraps both process root and backlog subroot |
| `delete-backlog` | not shipped in canonical runtime | dangerous backlog-root-only semantics no longer map cleanly to unified process root |

## 8. Canonical flows

## 8.1 Backlog graph initialization

```text
init -> register-source* -> template packet -> packet -> status
```

## 8.2 Source-change review

```text
refresh --source-* -> attention -> items (if needed) -> ack-source-review / patch-item / packet / update-source-path|remove-source -> status
```

Rules:

- `refresh` opens or updates source-review records;
- item-level flood is forbidden as the first automatic effect;
- explicit no-op closure remains allowed through acknowledgment flow.

### Source-review command/read-model contract

`refresh --source-*` for changed sources must return at minimum:

- `changed_sources`
- `source_reviews_created`
- `source_reviews_updated`
- `source_review_ids`
- `next_commands`

`next_commands` should point first to:

- `attention`
- and, when `linked_item_count` remains operator-readable, `items --item-keys <linked_item_keys>`

`attention` by default must:

- surface open source-review records before generic item-level review entries;
- keep source-review entries compact and source-scoped, not item-flood oriented;
- expose enough scope to choose the next deterministic read:
  - `source_review_id`
  - `source_id`
  - `linked_item_keys`
  - `linked_item_count`
  - `status`
  - `next_commands`

Truthful closure for source-review records requires one explicit resolved path:

- `ack-source-review`:
  - `outcome = no_backlog_change`
  - `resolution_kind = ack`
- `patch-item`:
  - `outcome = patched_existing_items`
  - `resolution_kind = patch-item`
- `packet`:
  - `outcome = created_new_item`
  - `resolution_kind = packet`
- `update-source-path` or `remove-source`:
  - `outcome = source_maintenance`
  - `resolution_kind = update-source-path | remove-source`

All resolved source-review records must also materialize:

- `resolution_ref`
- `resolved_at`

While a source-review record is open:

- `outcome = pending`
- linked-item readiness remains blocked by the open source-review state
- `status` must reflect the blocking signal without requiring prose reconstruction

## 8.3 Ordinary selected-work delivery

```text
queue -> items -> feature-intake -> spec-compact -> plan-slice -> implementation -> dossier-verify -> review-artifact* -> dossier-step-close -> lifecycle-refresh
```

Before final implementation verification and the final review bundle, agents should run a pre-close hygiene rehearsal when refresh/status/attention/source-review checks can open or update backlog/source-review truth. The rehearsal runs refresh/status/attention/source-review checks without auto-ack, resolves discovered blockers through explicit backlog truth actions, and requires rerunning affected verification and review artifacts before `dossier-step-close` when material backlog/source-review mutation happens after earlier audits.

Final implementation close sequencing is:

```text
material commit freeze -> external reviewers write immutable review artifacts -> final verification -> dossier-step-close -> post-close hygiene
```

After material commit freeze, agents must not make material source/test/backlog truth changes before the final review artifacts are recorded. External reviewers record PASS or FAIL through `review-artifact`, final verification corresponds to the same material scope reviewed by those auditors, and any material mutation after final audits or final verification requires rerunning affected verification and affected review artifacts before `dossier-step-close`.

After successful `implementation` close, final branch-complete reporting and next-intake recommendation require explicit post-close backlog hygiene evidence:

```text
dossier-step-close --step implementation -> post-close-hygiene --step implementation -> status / next-step
```

`dossier-step-close` must not auto-refresh sources. It only marks future implementation closures with `post_close_backlog_hygiene_required: true` and initial `post_close_backlog_hygiene_status: missing`. `post-close-hygiene` explicitly runs `refresh`, captures pre/post `status`, `attention`, and `queue`, writes one durable global refresh artifact under `.dossier/verification/post-close-hygiene/` before any per-feature state points to it, writes per-feature `.dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json` artifacts for affected implementation features, and updates implementation stage state to `clean`, `blocked`, `stale`, or failed/partial evidence as appropriate.

Post-close hygiene v2 separates global refresh freshness from per-feature hygiene evidence:

- global artifact records `run_id`, result `complete|partial|failed`, affected feature ids, failed feature ids, pre/post status summaries, refresh summary, per-feature write statuses, and retry command for failed or partial runs;
- per-feature artifacts record `global_refresh_artifact`, `affected_feature_ids`, `pre_status_summary`, `post_status_summary`, schema version, feature-local result, and blockers;
- a global refresh can make another implementation feature stale or blocked without meaning the current feature has hidden cleanup debt;
- no feature is marked `clean` unless its per-feature artifact and stage state/frontmatter update both succeed;
- overlapping runs serialize through a global `post-close-hygiene` operation lock and sorted per-feature delivery locks.

If `refresh` opens source-review records, the branch is not backlog-clean. The command must surface that state as blocked evidence and must not auto-ack source reviews or apply backlog patches/packets.

If backlog truth changed during any delivery stage:

```text
... -> patch-item or refresh+patch -> items -> status -> continue / close
```

Selected-feature lifecycle close targets:

- `feature-intake -> intaken`
- `spec-compact -> specified`
- `plan-slice -> planned`
- `implementation -> implemented`

`dossier-step-close` validates current backlog truth against these targets. A managed backlog actualization artifact may be recorded as trace evidence, but it does not override current-state validation.
Canonical backlog lifecycle order is `defined < intaken < specified < planned < implemented`.
`intaken` means dossier handoff exists; it is not equivalent to `specified` and does not satisfy `spec-compact` closure.
`status` exposes `intaken_count`, while adjusted `ready_for_next_step_count` excludes `intaken` item keys from ordinary next-intake readiness.
`queue` must not silently return `intaken` items as fresh intake-ready work; the next action remains dossier-local `spec-compact` via `next-step`.

`plan-slice` protected side-effect handoff remains semantic agent-owned guidance. If implementation touches deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect, the plan and audit scope must call out reservation before side effect, idempotent replay behavior, terminal CAS / no terminal overwrite, strict caller input, and live-vs-stale running behavior. Stage-controller commands do not infer or validate those invariants.

`plan-slice` policy/admission classification remains mechanical input plus runtime shape validation. Applicable `admission`, `replay`, `evidence`, `release-policy`, or `runtime-gating` scopes must record the negative matrix before implementation handoff; `not_applicable` must record a bounded rationale. External review still evaluates semantic sufficiency.

## 8.4 Mature change path

```text
change-proposal -> contract-drift-audit -> explicit backlog impact verdict -> no-op | patch-item | source update | packet -> dossier-verify/review-artifact* -> dossier-step-close -> lifecycle-refresh
```

## 9. Output contract

## 9.1 Global JSON envelope

Commands that support `--json` should use a stable top-level envelope:

```json
{
  "command": "feature-intake",
  "scope": {
    "feature_id": "F-0001"
  },
  "result": "ok",
  "warnings": [],
  "next_commands": []
}
```

Allowed `result` values:

- `ok`
- `partial_success`
- `blocked`
- `fail`

Rules:

- mutating commands return compact summaries rather than full cards;
- read-model commands return the data shape appropriate to the read model;
- helper commands return artifact-centric summaries;
- `next_commands[]` remains the preferred deterministic follow-up hint.

## 9.2 Mutating backlog command output

Minimum compact fields:

- `counts`
- change buckets (`added`, `updated`, `removed`, or source-review summaries)
- `todo_created`
- `todo_updated`
- `todo_removed`
- `dry_run`
- `next_commands[]`

Additional rules:

- `refresh` must return source-review-oriented fields before any generic item review counts;
- `ack-source-review` must return the closed source-review identity plus the resulting blocking/readiness outcome;
- source-maintenance closures through `update-source-path` or `remove-source` must return enough reference data to link back to the resolved source-review record.

## 9.3 Stage-controller output

Minimum compact fields:

- common transition surface from section 6.3
- `log_path`
- `warnings`

If stage content itself still requires agent work, the command must say so via `next_commands` or `warnings` instead of pretending the semantic work is done.

## 9.4 Helper command output

Minimum direction:

- `dossier-step-close` returns step artifact path, blockers, and authoritative `process_complete`;
- `post-close-hygiene` returns the selected feature hygiene artifact path, global refresh artifact path, `run_id`, affected feature ids, failed feature ids, per-feature results, `post_close_backlog_hygiene_status`, open source-review count, source-review blocked item count, lifecycle drift count, unresolved attention flag, `backlog_clean`, blockers, and a retry command for failed or partial runs;
- `post-close-hygiene` partial or failed feature-write runs return non-zero with JSON result `fail`; they must not use `partial_success`, which remains reserved for other command families that can preserve a separately documented partial-success contract;
- `lifecycle-refresh` returns lifecycle snapshot path and session-index path when refreshed;
- `review-artifact` and `dossier-verify` return artifact paths and truthful pass/fail.

`status` also reports deterministic post-close hygiene counts and compact affected feature ids: `post_close_hygiene_missing_count`, `post_close_hygiene_stale_count`, `post_close_hygiene_blocked_count`, `post_close_hygiene_missing_feature_ids`, `post_close_hygiene_stale_feature_ids`, and `post_close_hygiene_blocked_feature_ids`.

`queue` may emit post-close hygiene warnings for missing, stale, or blocked implementation evidence, but this issue does not redesign queue ranking.

`next-step --dossier <implementation dossier>` reports `post_close_backlog_hygiene_status`, `post_close_backlog_hygiene_artifact`, and `post_close_backlog_hygiene_blockers` when an implementation dossier is process-complete.

## 10. Error contract

## 10.1 Exit-code policy

The shipped runtime standardizes on:

| Exit code | Meaning |
| --- | --- |
| `0` | success |
| `1` | fatal runtime / IO / unexpected internal failure |
| `2` | usage error or unsupported invocation |
| `3` | truthful blocking result produced by process or policy gates |

## 10.2 Symbolic error codes

JSON and stderr-facing errors should include a symbolic `error_code`.

Minimum family:

- `UDE_USAGE`
- `UDE_ROOT_NOT_FOUND`
- `UDE_PLATFORM_UNSUPPORTED`
- `UDE_MUTATION_LOCKED`
- `UDE_SCHEMA_INVALID`
- `UDE_SOURCE_REVIEW_OPEN`
- `UDE_BACKLOG_FOLLOWUP_REQUIRED`
- `UDE_BACKLOG_ACTUALIZATION_REQUIRED`
- `UDE_REVIEW_STALE`
- `UDE_CLOSURE_BLOCKED`
- `UDE_CANONICAL_ARTIFACT_MISSING`

Rules:

- symbolic code is the stable machine-facing contract;
- human-readable message may evolve, but must stay consistent with the symbolic code;
- `blocked` process results should prefer exit code `3` plus symbolic error code rather than masquerading as generic runtime failure.

## 11. Truthful closure and telemetry rules

Required utility-level rules:

- stage-controller commands may only reach `ready_for_close`;
- authoritative closure is written only by `dossier-step-close`;
- `dossier-step-close` fails closed before step artifact write when selected backlog item lifecycle reconciliation is unresolved for `feature-intake`, `spec-compact`, `plan-slice`, or `implementation`;
- lifecycle aggregation happens only through `lifecycle-refresh`;
- implementation lifecycle end markers cannot materialize without step-close-backed evidence;
- logs remain `.md` with YAML frontmatter;
- logs preserve the canonical narrative scaffold required by the active log contract for both `feature-intake` and primary stages;
- helper-owned closure writes preserve authored narrative sections without translation or normalization while updating helper-owned closure fields;
- lifecycle snapshots and session index remain structured machine artifacts;
- `status` exposes lifecycle reconciliation drift count/details;
- `queue` must not silently return a mapped done feature as ordinary ready work;
- `queue` must not silently return an `intaken` item as fresh intake-ready work;
- no command may infer missing truth from prose.
- no command may treat a mechanical `plan-slice --ready-for-close` transition as automatic proof that the implementation objective is clear; that semantic readiness remains agent-owned unless a future change explicitly implements and tests such validation.
- no command may synthesize audit handoff prompts, infer protected side-effect presets, auto-ack source reviews during pre-close hygiene rehearsal, or replace post-close hygiene confirmation.
- no automatic language detection or translation is part of the shipped runtime unless a future change implements and tests it explicitly.

## 12. Non-goals for the canonical runtime

This specification intentionally does **not** require the canonical runtime to support:

- semantic prose classification;
- automatic plan/spec authoring;
- direct mutation of backlog truth from stage-controller commands;
- repo-wide destructive delete replacement for `delete-backlog`;
- implicit closure by commit, chat summary, or informal PASS signal.

## 13. Runtime maintenance handoff

Runtime changes must derive from this document and the active references, not reopen command boundaries ad hoc.

Implementation/runtime design must preserve:

- command family boundaries from section 6;
- preservation / deprecation matrix from section 7;
- root and lock contracts from sections 4 and 5;
- output and error contracts from sections 9 and 10;
- truthful closure and telemetry rules from section 11.
