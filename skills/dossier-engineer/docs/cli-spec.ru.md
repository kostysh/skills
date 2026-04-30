# Техническая спецификация CLI `dossier-engineer`

Документ не является частью активной методики скила. Он предназначен для реализации runtime-утилиты `dossier-engineer`.

## 1. Цели CLI

CLI должен:

1. Создавать canonical dossier artifacts как Markdown-файлы с YAML frontmatter.
2. Владеть machine-owned frontmatter: IDs, timestamps, hashes, statuses, lifecycle, stage states, capability gates, freshness, guardrail states.
3. Давать агенту protocol-safe `Next actions` после каждой mutating command.
4. Валидировать dossier без использования JSON/JSONL/database canonical state.
5. Поддерживать parallel development через sharded artifacts and non-sequential IDs.
6. Предотвращать подмену capability infrastructure work.
7. Поддерживать onboarding существующего проекта через baseline capabilities.

CLI не должен реализовывать отдельный database, lock file, global mutable index или canonical JSON state.

## 2. Canonical layout

CLI создаёт и использует:

```text
docs/dossier/
├── project.md
├── sources/SRC-*.md
├── capabilities/CAP-*.md
├── baselines/BASE-*.md
├── guardrails/KILL-*.md
├── work-items/WI-*.md
├── source-reviews/SR-*.md
├── stages/WI-*/*.md
├── verification/WI-*/*.md
├── reviews/WI-*/*.md
├── hygiene/WI-*/*.md
├── changesets/CS-*.md
├── reports/*.md
└── retro/RETRO-*.md
```

Forbidden canonical paths/patterns:

```text
.dossier/state.json
.dossier/*.json
.dossier/*.jsonl
docs/dossier/state.json
docs/dossier/index.json
docs/dossier/*.json
docs/dossier/*.jsonl
```

CLI may print YAML to stdout with `--format yaml`, but stdout is not canonical state.

## 3. Root discovery

Root resolution order:

1. `--root <path>` when supplied.
2. Current working directory if it contains `docs/dossier/project.md`.
3. Nearest parent directory containing `docs/dossier/project.md`.
4. Nearest parent git root when command is `init`.
5. Failure with exit code `5`.

`init` requires an existing filesystem root.

## 4. ID generation

Format:

```text
<PREFIX>-<YYYYMMDD>-<slug>-<entropy6>
```

Prefixes:

- `PRJ`, `SRC`, `CAP`, `BASE`, `KILL`, `WI`, `SR`, `STG`, `VER`, `REV`, `HYG`, `CS`, `RETRO`, `AC`, `BLK`.

`slug` rules:

- lowercase;
- ascii-folded when possible;
- non-alphanumeric groups replaced with `-`;
- max 40 chars;
- no leading/trailing hyphen;
- fallback `item` when empty.

`entropy6`:

- first 6 hex chars from cryptographically strong random bytes;
- regenerate if resulting path exists.

No global counters.

## 5. Timestamps and hashes

Timestamps:

- UTC ISO 8601 strings;
- example: `2026-04-30T12:00:00Z`.

Source content hash:

- algorithm: `sha256`;
- value: lowercase hex;
- local files only;
- external references use `value: null` unless content snapshot is explicitly supplied.

Material scope hash:

- algorithm: sha256 over canonical normalized YAML subset;
- stable key ordering;
- excludes volatile timestamps except source hash timestamps;
- includes only semantics relevant to closure.

Material scope inputs for work item:

- source refs and current source hashes;
- capability refs and capability claims;
- delivery kind and relation;
- acceptance criteria;
- demonstration scenario;
- anti-claims;
- challenge state;
- dependencies;
- risk classification;
- implementation evidence refs;
- guardrail relevance.

## 6. Console output envelope

Every mutating command prints:

```text
Result: success|blocked|failed
Command: <full command>
Created artifacts:
- <path>
Changed artifacts:
- <path>
Warnings:
- <warning>
Blockers:
- <blocker>
Next actions:
1. <action>
2. <action>
```

Read-only commands print summary, findings, and next actions.

`--format yaml` schema:

```yaml
result: success
command: capability create
created_artifacts:
  - path: docs/dossier/capabilities/CAP-20260430-resume-a17c92.md
    artifact_type: capability
    id: CAP-20260430-resume-a17c92
changed_artifacts: []
warnings: []
blockers: []
next_actions:
  - command: dossier-engineer capability claim set --capability CAP-20260430-resume-a17c92 ...
    reason: Complete the observable capability claim
```

`--quiet` must not suppress blockers or next actions.

## 7. Exit codes

- `0` — success, no blockers.
- `1` — invalid command, invalid args, filesystem error, parser error.
- `2` — blocked by protocol validation; no unsafe write performed.
- `3` — lint found errors.
- `4` — external verification command failed.
- `5` — dossier root not found or unsupported layout.

## 8. Artifact schemas

### 8.1 `dossier_project`

Path: `docs/dossier/project.md`.

Required frontmatter:

```yaml
artifact_type: dossier_project
schema_version: "2.2"
project_id: PRJ-20260430-example-a17c92
project_name: Example
review_mode: risk_weighted
capability_policy:
  require_concept_for_capabilities: true
  require_behavioral_demo_for_capability_closure: true
  require_anti_claim_for_capability_spec: true
  require_challenge_before_implementation: true
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
verification_profiles:
  default:
    commands: []
  behavioral-demo:
    commands: []
review_policy:
  capability_requires:
    - concept-conformance-reviewer
    - spec-conformance-reviewer
  code_requires:
    - code-reviewer
  risk_requires:
    security:
      - security-reviewer
guardrail_defaults:
  max_closed_support_without_recent_demo: 5
```

### 8.2 `source`

Path: `docs/dossier/sources/<id>.md`.

Required frontmatter:

```yaml
artifact_type: source
schema_version: "2.2"
id: SRC-20260430-product-concept-a17c92
title: Product concept
source_path: docs/concept.md
source_kind: concept
authority: canonical
content_hash:
  algorithm: sha256
  value: <hex-or-null>
registered_at: "2026-04-30T12:00:00Z"
changed_at: null
status: active
tags: []
```

Enums:

- `source_kind`: `concept|architecture|specification|policy|contract|decision-record|test-plan|external-reference|code-reference|other`;
- `authority`: `canonical|supporting|informational|deprecated`;
- `status`: `active|deprecated|missing|removed`.

### 8.3 `capability`

Path: `docs/dossier/capabilities/<id>.md`.

Required frontmatter:

```yaml
artifact_type: capability
schema_version: "2.2"
id: CAP-20260430-resume-investigation-a17c92
title: Resume prior investigation
status: intended
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors: []
claim:
  actor: null
  trigger: null
  observable_behavior: null
  system_response: null
  state_change: null
  continuity: null
anti_claims: []
demo_evidence: []
owner: agent
area:
  - core
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `status`: `intended|existing|partial|unverified|retired`.

Demo evidence shape:

```yaml
id: VER-20260430-resume-demo-3a1c9e
verdict: pass
summary: Operator resumed a prior investigation and state continuity was observed.
evidence:
  - path: docs/evidence/resume-demo.md
recorded_at: "2026-04-30T12:30:00Z"
```

### 8.4 `baseline`

Path: `docs/dossier/baselines/<id>.md`.

Required frontmatter:

```yaml
artifact_type: baseline
schema_version: "2.2"
id: BASE-20260430-existing-product-a17c92
title: Existing product baseline
mode: existing-project
source_refs:
  - SRC-20260430-product-concept-a17c92
capabilities: []
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Membership shape:

```yaml
capability_id: CAP-20260430-resume-investigation-a17c92
status: observed
evidence:
  - docs/evidence/resume-demo.md
added_at: "2026-04-30T12:30:00Z"
notes: null
```

Enums:

- `mode`: `existing-project|release-snapshot|regression-baseline|manual`;
- membership `status`: `observed|assumed|unverified|partial|regressed`.

### 8.5 `guardrail`

Path: `docs/dossier/guardrails/<id>.md`.

Required frontmatter:

```yaml
artifact_type: guardrail
schema_version: "2.2"
id: KILL-20260430-support-without-demo-a17c92
title: Stop support accumulation without demo
condition: If five closed support items pass without recent end-to-end capability demonstration.
action: Stop new support work and open change-proposal or demonstrate capability.
status: active
scope:
  areas: []
  capability_ids: []
triggered_at: null
resolved_at: null
resolution: null
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `status`: `active|triggered|resolved|retired`.

### 8.6 `work_item`

Path: `docs/dossier/work-items/<id>.md`.

Required frontmatter:

```yaml
artifact_type: work_item
schema_version: "2.2"
id: WI-20260430-resume-session-6f31c2
title: Resume prior investigation from dossier state
type: feature
lifecycle: defined
owners:
  - agent
area:
  - core
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors: []
delivery:
  kind: capability
  capability_refs:
    - capability_id: CAP-20260430-resume-investigation-a17c92
      relation: introduces
  support_reason: null
acceptance:
  criteria: []
  coverage_gate: open
demonstration:
  name: null
  scenario: null
  falsifiers: []
anti_claims: []
challenge:
  recorded: false
  latest_event_id: null
risk:
  implementation: []
  policy: []
review_policy: risk_weighted
dependencies: []
blocks: []
blockers: []
stage_state:
  feature-intake: not_started
  spec-compact: not_started
  plan-slice: not_started
  implementation: not_started
  change-proposal: not_started
post_close_hygiene:
  implementation: not_started
material_scope_hash: null
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `type`: `feature|fix|refactor|migration|research|test|documentation|operations|security|debt`;
- `lifecycle`: `defined|intaken|specified|planned|implemented|closed|retired`;
- `delivery.kind`: `capability|support|maintenance|exploration`;
- relation: `introduces|extends|supports|maintains|verifies|retires`;
- stage state: `not_started|in_progress|blocked|ready_for_close|closed|reopened`;
- coverage gate: `open|partial|green|not_applicable`.

Acceptance criterion shape:

```yaml
id: AC-20260430-resume-works-a1b2c3
kind: behavior
text: Operator can resume a prior investigation and continue from the last unresolved blocker.
source_ref:
  source_id: SRC-20260430-product-concept-a17c92
  anchor: resume-investigation
status: active
```

Acceptance `kind`: `behavior|contract|unit|integration|security|performance|accessibility|operational|documentation|support`.

### 8.7 Remaining artifacts

`source_review`, `stage_event`, `verification`, `review`, `hygiene`, `changeset`, and `retrospective_report` follow the schemas in `references/artifact-contract.ru.md`; implementation must validate their fields exactly enough to enforce closure gates.

## 9. Body scaffolds

CLI must create meaningful body scaffolds.

### Capability body

```markdown
# <title>

## Summary

## Concept interpretation

## Observable behavior

## Anti-claims

## Demonstrations

## Notes
```

### Baseline body

```markdown
# <title>

## Scope

## Observed capabilities

## Assumed or unverified capabilities

## Evidence notes

## Gaps
```

### Guardrail body

```markdown
# <title>

## Intent

## Trigger interpretation

## Required action

## Resolution history
```

### Work item body

```markdown
# <title>

## Summary

## Capability relation

## Source interpretation

## Scope

## Acceptance criteria notes

## Demonstration notes

## Anti-claims notes

## Pre-implementation challenge

## Dependencies and blockers

## Implementation notes

## Verification notes

## Review notes

## Closure notes

## Process notes
```

## 10. Command specifications

### 10.1 `help`

```bash
dossier-engineer help [command] [subcommand]
```

Behavior:

- print usage, examples, common options;
- no root required;
- exit `0`.

### 10.2 `init`

```bash
dossier-engineer init --root <path> --project-name "<name>" [--review-mode risk_weighted|strict|custom] [--force]
```

Writes:

- `docs/dossier/project.md`;
- canonical directories.

Validation:

- root exists;
- project name non-empty;
- project.md does not exist unless `--force`.

Next actions:

- for new project: source add concept, capability create;
- for existing project: baseline create.

### 10.3 `status`

```bash
dossier-engineer status --root <path>
```

Algorithm:

1. Discover root.
2. Load all artifacts.
3. Validate frontmatter syntactically.
4. Derive capability status summary.
5. Derive work lifecycle summary.
6. Derive open source-review counts.
7. Derive triggered guardrails.
8. Derive stale reviews/verification.
9. Derive closure violations.
10. Print summary and next actions.

Writes: none.

### 10.4 `attention`

```bash
dossier-engineer attention --root <path>
```

Priority order:

1. invalid YAML/frontmatter;
2. triggered guardrails;
3. open source reviews;
4. capability closure violations;
5. existing capability without evidence;
6. support chain without recent demo;
7. stale reviews/verification;
8. failed reviews/verification;
9. blockers;
10. missing hygiene;
11. unresolved process misses.

Writes: none.

### 10.5 `queue`

```bash
dossier-engineer queue --root <path> [--area <area>] [--owner <owner>]
```

Readiness algorithm:

A work item is queue-ready when:

- lifecycle not closed/retired;
- source refs valid;
- capability refs valid when required;
- no open source review affects linked source/capability;
- no active triggered guardrail affects scope;
- dependencies are closed or waived;
- blockers are resolved;
- current stage can advance;
- previous required stage is closed;
- stage-specific gates are not missing.

Sort:

1. dependency topological order;
2. priority;
3. capability relation order: `introduces/extends`, then `supports`, then others;
4. created_at;
5. ID.

### 10.6 `next`

```bash
dossier-engineer next --work <work-id>
```

Logic:

1. If work invalid, recommend `lint` or `repair frontmatter`.
2. If guardrail triggered, recommend guardrail resolution/change-proposal.
3. If source-review open, recommend source review resolution.
4. If capability gates missing, recommend capability/work commands.
5. If blockers exist, recommend blocker action.
6. If stage in progress, recommend stage-specific next command.
7. If stage ready, recommend `stage close`.
8. If implementation closed and hygiene missing, recommend `hygiene run`.
9. If done, recommend changeset/report action.

## 11. Source commands

### 11.1 `source add`

```bash
dossier-engineer source add --path <path> --kind <kind> --authority <authority> --title "<title>" [--tag <tag>...]
```

Behavior:

1. Resolve path relative to root unless URL-like.
2. Validate kind/authority.
3. For local file, require file exists and compute sha256.
4. For external-reference, allow URL-like path and hash null.
5. Generate ID.
6. Create `SRC-*.md` scaffold.
7. Return next actions.

Duplicate path:

- warn and show existing source;
- do not create duplicate unless `--allow-duplicate`.

### 11.2 `source refresh`

```bash
dossier-engineer source refresh --root <path>
dossier-engineer source refresh --source <source-id> [--record-missing]
```

Behavior:

1. For each source, validate path.
2. If missing and `--record-missing`, set status `missing`; else warn only.
3. Compute hash.
4. If unchanged, no write.
5. If changed:
   - update source hash and `changed_at`;
   - create `SR-*.md`;
   - compute impacted capabilities by `source_refs`;
   - compute impacted work items by source refs and linked capabilities.

No work item mutation.

### 11.3 `source impact`

Shows affected capabilities, work items, acceptance criteria, lifecycle and queue blocking state.

### 11.4 `source review resolve`

```bash
dossier-engineer source review resolve --review <id> --verdict <verdict> --summary "<summary>" [--capability <id>...] [--work <id>...]
```

Validation:

- review exists;
- status open/blocked;
- verdict valid;
- `update_capabilities` requires capability ids or explicit blocker;
- `create_followups` prints work/capability create next actions.

Writes source-review only.

## 12. Capability commands

### 12.1 `capability create`

```bash
dossier-engineer capability create --title "<title>" --status intended|existing|partial|unverified|retired --source <source-id> [--area <area>] [--owner <owner>]
```

Behavior:

1. Validate source exists.
2. Generate CAP ID.
3. Create scaffold with empty claim.
4. If status existing, add warning until demo/baseline evidence is recorded.
5. Return next action to set claim and record demo when needed.

### 12.2 `capability claim set`

```bash
dossier-engineer capability claim set --capability <id> --actor "<actor>" --trigger "<trigger>" --behavior "<behavior>" --response "<response>" --state-change "<state/effect>" --continuity "<continuity>"
```

Behavior:

- validate all args non-empty;
- update claim fields;
- update `updated_at`;
- recompute material scope for linked open work items;
- return next actions for anti-claims/demo/work creation.

### 12.3 `capability anti-claim add`

Adds non-empty anti-claim string. Deduplicate exact duplicates.

### 12.4 `capability demo record`

```bash
dossier-engineer capability demo record --capability <id> --verdict pass|fail|blocked --summary "<summary>" [--evidence <path>...]
```

Behavior:

- validate evidence paths if local;
- append demo evidence entry;
- if verdict pass and status unverified/partial, suggest status update command;
- if status existing and pass evidence exists, clear attention finding.

### 12.5 `capability check`

```bash
dossier-engineer capability check --root <path> [--capability <id>] [--work <id>]
```

Checks:

- capability has source refs;
- claim complete unless status retired;
- existing capability has pass evidence or observed baseline;
- capability work has behavior criterion/demo/anti-claim/challenge;
- closed capability work has fresh behavioral verification and concept review;
- support work has linked capability/guardrail and reason;
- support chain since latest capability demo does not exceed configured limit;
- acceptance criteria are not only infrastructure for capability work.

Writes none.

## 13. Baseline commands

### 13.1 `baseline create`

```bash
dossier-engineer baseline create --title "<title>" --mode existing-project|release-snapshot|regression-baseline|manual --source <source-id>
```

Behavior:

1. Validate source exists.
2. Generate BASE ID.
3. Create scaffold.
4. Return next actions to create capabilities and add them to baseline.

### 13.2 `baseline capability add`

```bash
dossier-engineer baseline capability add --baseline <id> --capability <id> --status observed|assumed|unverified|partial|regressed [--evidence <path>...] [--notes "<notes>"]
```

Behavior:

- validate baseline/capability exist;
- validate evidence paths;
- `observed` requires evidence path or pass capability demo;
- append or update membership for capability;
- if observed and capability status unverified/partial, recommend capability status update.

## 14. Guardrail commands

### 14.1 `guardrail add`

```bash
dossier-engineer guardrail add --title "<title>" --condition "<condition>" --action "<action>" [--capability <id>...] [--area <area>...]
```

Creates active `KILL-*.md`.

### 14.2 `guardrail check`

```bash
dossier-engineer guardrail check --root <path> [--guardrail <id>]
```

Evaluation:

- parse explicit guardrails;
- apply supported built-in heuristics:
  - support items closed since latest behavioral demo > configured maximum;
  - capability unverified while dependent support work closes;
  - no behavioral demo exists for active intended capabilities;
- for natural-language conditions not machine-evaluable, mark `needs_manual_evaluation` and include next action.

When triggered:

- update guardrail status only if command has `--record`; otherwise read-only report.

### 14.3 `guardrail resolve`

```bash
dossier-engineer guardrail resolve --guardrail <id> --summary "<summary>" [--evidence <path>...]
```

Behavior:

- validate guardrail exists;
- require summary;
- evidence optional but recommended;
- set status `resolved`, `resolved_at`, `resolution`.

## 15. Work commands

### 15.1 `work create`

```bash
dossier-engineer work create --title "<title>" --type <type> --delivery <kind> --source <source-id> --area <area> --owner <owner> [--capability <capability-id>] [--relation <relation>] [--priority <priority>]
```

Behavior:

1. Validate source exists.
2. Validate delivery kind.
3. Validate capability/relation requirements.
4. Generate WI ID.
5. Create scaffold.
6. Set lifecycle `defined`.
7. Return next action for feature-intake.

Rules:

- capability delivery: relation must be `introduces|extends`;
- support delivery: relation should be `supports` when capability supplied;
- maintenance delivery: capability status must be `existing|partial`; relation `maintains`;
- exploration delivery: relation optional.

### 15.2 `work acceptance add/update/retire`

Add:

```bash
dossier-engineer work acceptance add --work <id> --kind <kind> --text "<text>" --source <source-id>#<anchor>
```

Update:

```bash
dossier-engineer work acceptance update --work <id> --acceptance <ac-id> --text "<text>" --reason "<reason>"
```

Retire:

```bash
dossier-engineer work acceptance retire --work <id> --acceptance <ac-id> --reason "<reason>"
```

Behavior:

- mutate work item frontmatter;
- preserve retired criteria;
- recompute material scope hash;
- mark evidence stale by derived logic.

### 15.3 `work demo set`

Sets demonstration object. Required before spec-compact close for capability and maintenance work.

### 15.4 `work anti-claim add`

Adds anti-claim. Required for capability work before spec-compact close.

### 15.5 `work challenge record`

Creates `STG-*` event with event `challenge`; sets `challenge.recorded = true` and `latest_event_id`.

### 15.6 `work support explain`

Sets `delivery.support_reason`. Required for support closure.

### 15.7 `work dependency add/remove`

Updates dependencies and detects cycles.

### 15.8 `work blocker add/resolve`

Adds or resolves blocker. Blocking blockers set current in-progress stage to blocked.

### 15.9 `work risk set`

Validates risk families, updates risk arrays, recomputes required reviews.

### 15.10 `work amend`

Requires change-proposal stage in progress/ready. Applies accepted structured changes and returns earliest affected stage.

### 15.11 `work split`

Creates new work item, copies selected source/capability refs, records split reason in both bodies.

### 15.12 `work retire`

Sets lifecycle `retired`; does not delete artifact.

## 16. Stage commands

### 16.1 `stage start`

Validation:

- `feature-intake`: source refs valid;
- `spec-compact`: feature-intake closed;
- `plan-slice`: spec-compact closed;
- `implementation`: plan-slice closed;
- `change-proposal`: work exists.

Behavior:

- set stage state `in_progress`;
- create start event;
- output stage checklist.

### 16.2 `stage ready`

Validation by stage:

- feature-intake: delivery kind and refs valid;
- spec-compact: acceptance/demo/anti-claim gates valid;
- plan-slice: challenge and verification plan valid;
- implementation: required verification/reviews fresh;
- change-proposal: structured changes reflected.

Behavior:

- set `ready_for_close`;
- create ready event;
- print close command or blockers.

### 16.3 `stage close`

Validation:

- state is `ready_for_close`;
- previous stage closed;
- closure gates pass;
- no blockers/source-review/guardrail block.

Behavior:

- set stage `closed`;
- update lifecycle:
  - feature-intake -> `intaken`;
  - spec-compact -> `specified`;
  - plan-slice -> `planned`;
  - implementation -> `implemented`;
- create close event;
- after implementation close, recommend `hygiene run`.

### 16.4 `stage reopen`

Sets stage `reopened`, creates event, marks relevant evidence stale through derived logic.

### 16.5 `stage log`

Creates immutable note event.

## 17. Verification commands

### 17.1 `verify required`

Logic:

- load project profiles;
- inspect delivery kind, risk, capability gates;
- capability work requires `behavioral-demo`;
- maintenance requires behavioral or integration regression profile;
- support requires default/support profile;
- return missing/fresh/stale/failed status.

### 17.2 `verify run`

Behavior:

1. Load profile commands.
2. Execute commands in order.
3. Capture command, cwd, exit code, stdout/stderr summary or evidence path.
4. Determine verdict.
5. Create `VER-*.md`.
6. Update coverage gate if criteria covered.

If profile has no commands, block with next action to configure profile or use `verify record`.

### 17.3 `verify record`

Validates evidence paths and creates verification artifact.

## 18. Review commands

### 18.1 `review required`

Logic:

- capability work: concept-conformance + spec-conformance always required;
- code-bearing work: code-reviewer required;
- security/data/auth/privacy/network/dependency risk: security-reviewer required;
- contract/API/schema changes: contract-reviewer required;
- release/migration/operations risk: release-reviewer required;
- support work: concept-conformance required when support chain is long, guardrail triggered, or support claims concept-facing behavior.

### 18.2 `review record`

Creates immutable review artifact with current material scope hash.

## 19. Hygiene command

`hygiene run` checks:

- implementation stage closed;
- source reviews resolved;
- capability gates satisfied;
- behavioral demo fresh when required;
- concept/spec/code/security reviews fresh when required;
- guardrails not triggered;
- queue/status/attention derivation succeeds;
- no closure violations remain.

Creates `HYG-*.md` and updates `post_close_hygiene.implementation`.

## 20. Changeset, report, retro

### 20.1 `changeset create`

Infers changed artifacts from current git branch if possible, includes explicitly passed IDs, creates `CS-*.md`.

Must include fields for sources, capabilities, baselines, guardrails, work items, source reviews, reviews, verification, hygiene, process misses, skill feedback, capability drift.

### 20.2 `report create`

Creates derived Markdown report with `derived: true`. Reports are never closure evidence.

### 20.3 `retro create`

Scans canonical artifacts and computes:

- capability completion;
- support-to-capability ratio;
- behavioral demo outcomes;
- concept-conformance outcomes;
- guardrail outcomes;
- existing baseline observed/unverified counts;
- process misses;
- skill feedback;
- merge conflict hot spots.

## 21. Derived algorithms

### 21.1 Capability check

For each capability:

1. Validate source refs.
2. Validate claim completeness unless retired.
3. If status existing, require pass demo or observed baseline.
4. Collect linked work items.
5. Report support/capability ratio and recent demos.

For each work item:

1. Validate delivery kind.
2. Validate capability relation.
3. Validate behavior criteria/demo/anti-claim/challenge for capability work.
4. Validate support reason for support work.
5. Validate maintenance capability evidence.
6. Detect infrastructure-only closure.

### 21.2 Guardrail check

1. Load active guardrails.
2. For each guardrail, evaluate supported machine-readable conditions.
3. For natural-language conditions, report manual evaluation needed.
4. Include affected work/capability IDs.
5. Return next actions.
6. With `--record`, set status triggered and `triggered_at`.

### 21.3 Review freshness

1. Compute current material scope hash.
2. For each required review class, select latest review for work/stage/class.
3. Fresh if verdict pass/not_applicable and hash matches.
4. Stale if hash differs.
5. Failed if latest relevant verdict fail/blocked and no newer fresh pass exists.

### 21.4 Verification freshness

Same as review freshness, using verification profile/evidence class.

### 21.5 Source impact

1. Load source.
2. Find capabilities with source refs.
3. Find work items with source refs or linked impacted capabilities.
4. Attach open source-review state.
5. Report impacted acceptance criteria and queue status.

### 21.6 Closure validity

Stage closure invalid if:

- previous stage not closed;
- source-review open;
- guardrail triggered;
- capability gate missing;
- implementation closed without required fresh verification/reviews;
- closed work has blocker;
- coverage gate not green/not_applicable;
- post-close hygiene missing for lifecycle closed.

## 22. Test expectations

A correct implementation should test:

- root discovery;
- init idempotency;
- ID uniqueness without counters;
- source add hash generation;
- source refresh unchanged no-write;
- source refresh changed creates source-review;
- capability create/claim/demo;
- existing capability without evidence flagged;
- baseline create and membership validation;
- guardrail add/check/resolve;
- work create by delivery kind;
- capability work blocked without behavior criterion;
- capability work blocked without demo;
- capability work blocked without anti-claim;
- plan-slice blocked without challenge;
- implementation closure blocked without behavioral verification;
- implementation closure blocked without concept-conformance review;
- support work blocked without support reason;
- dependency cycle detection;
- stale review after capability claim change;
- source impact includes capabilities;
- hygiene after implementation close;
- changeset includes capability/baseline/guardrail fields;
- forbidden state files detected;
- generated reports not accepted as closure evidence.
