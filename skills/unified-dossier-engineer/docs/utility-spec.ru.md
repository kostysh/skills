# Спецификация объединённой утилиты `dossier-engineer`

## Статус документа

Этот документ является **maintainer-facing utility specification** для будущей объединённой утилиты merged skill-а `dossier-engineer`.

Это **не** описание уже shipped runtime.

Документ:

- фиксирует целевой command contract;
- задаёт root / artifact / lock / output / error semantics;
- служит обязательным upstream input для `Package 8`.

Документ не означает, что перечисленные commands уже существуют в help surface текущего runtime.

## 1. Назначение утилиты

Будущая объединённая утилита `dossier-engineer` должна стать единым mechanical runtime для двух внутренних подсистем merged skill-а:

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

Физический runtime entrypoint и script path будут окончательно зафиксированы в `Package 8`.

До того момента этот документ нормирует command semantics, а не конкретный launcher path.

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
- repo-local reinforcement artifacts only where the merged process explicitly owns them

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

Future first-class stage-controller set:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

### Common authority boundary

Все stage-controller commands:

- open / resume / block / ready-for-close the stage;
- bootstrap/update stage log;
- validate structured prerequisites;
- emit machine-readable transition state;
- emit explicit backlog follow-up signals.

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
- `next_commands`

Rules:

- repeated block/resume history lives in `transition_events[]`;
- ambiguous singleton fields such as `blocked_ts` / `resumed_ts` are forbidden unless explicitly marked as derived (`first_*`, `last_*`);
- `stage_state` may reach `ready_for_close`, but not authoritative `closed`.

## 6.4 Delivery helper / closure / integrity commands

- `contract-drift-audit`
- `coverage-audit`
- `debt-audit`
- `marker-audit` as compatibility alias only
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
- `lifecycle-refresh` remains the lifecycle aggregation helper for metrics/session-index refresh;
- `next-step` remains dossier-local query surface;
- `contract-drift-audit` remains mature-change helper, not a primary stage controller.

## 7. Preservation / rename / deprecation matrix

| Current command | Future status | Rationale |
| --- | --- | --- |
| `feature-intake` | preserve literally | already aligns with future stage-controller model |
| `spec-compact` | add as new first-class command | currently workflow-only, becomes stage controller |
| `plan-slice` | add as new first-class command | currently workflow-only, becomes stage controller |
| `implementation` | add as new first-class command | currently workflow-only, becomes stage controller |
| `change-proposal` | add as new first-class command | mature change path becomes commandized stage boundary |
| `contract-drift-audit` | preserve literally | helper for mature-change executable drift |
| `dossier-verify` | preserve literally | helper-owned verification artifact writer |
| `review-artifact` | preserve literally | helper-owned review persistence |
| `dossier-step-close` | preserve literally | authoritative closure artifact writer |
| `lifecycle-refresh` | preserve literally | authoritative lifecycle aggregation helper |
| `next-step` | preserve literally | dossier-local query/read surface |
| `coverage-audit` | preserve literally | delivery verification helper |
| `debt-audit` | preserve literally | delivery debt helper |
| `marker-audit` | keep as compatibility alias only | avoid unnecessary churn |
| `dependency-graph` | preserve literally | dossier-side generated read helper |
| `sync-index` | preserve literally | deterministic index helper |
| `index-refresh` | preserve literally | single-writer orchestrated index refresh |
| `lint-dossiers` | preserve literally | integrity/lint helper |
| `register-source` | preserve literally | backlog source registry contract already fits merged model |
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
| `init` | preserve literally with expanded merged semantics | now bootstraps both process root and backlog subroot |
| `delete-backlog` | deprecate from first-wave merged runtime | dangerous backlog-root-only semantics no longer map cleanly to unified process root |

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
queue -> items -> feature-intake -> spec-compact -> plan-slice -> implementation -> dossier-verify -> review-artifact -> dossier-step-close -> lifecycle-refresh
```

If backlog truth changed during any delivery stage:

```text
... -> patch-item or refresh+patch -> items -> status -> continue / close
```

## 8.4 Mature change path

```text
change-proposal -> contract-drift-audit -> explicit backlog impact verdict -> no-op | patch-item | source update | packet -> dossier-verify/review-artifact/dossier-step-close -> lifecycle-refresh
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
- `lifecycle-refresh` returns lifecycle snapshot path and session-index path when refreshed;
- `review-artifact` and `dossier-verify` return artifact paths and truthful pass/fail.

## 10. Error contract

## 10.1 Exit-code policy

Future runtime should standardize on:

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
- lifecycle aggregation happens only through `lifecycle-refresh`;
- implementation lifecycle end markers cannot materialize without step-close-backed evidence;
- logs remain `.md` with YAML frontmatter;
- lifecycle snapshots and session index remain structured machine artifacts;
- no command may infer missing truth from prose.

## 12. Non-goals for first merged runtime

This specification intentionally does **not** require first-wave runtime to support:

- semantic prose classification;
- automatic plan/spec authoring;
- direct mutation of backlog truth from stage-controller commands;
- repo-wide destructive delete replacement for `delete-backlog`;
- implicit closure by commit, chat summary, or informal PASS signal.

## 13. Package 8 handoff

`Package 8` must derive from this document, not re-open it ad hoc.

Implementation/runtime design in `Package 8` must preserve:

- command family boundaries from section 6;
- preservation / deprecation matrix from section 7;
- root and lock contracts from sections 4 and 5;
- output and error contracts from sections 9 and 10;
- truthful closure and telemetry rules from section 11.
