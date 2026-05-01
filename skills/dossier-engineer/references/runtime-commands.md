# Runtime command guide

Runtime command: `dossier-engineer`.

The agent uses runtime for all structured dossier operations. Runtime creates frontmatter, IDs, timestamps, hashes, state transitions, derived next actions, and validation errors.

## 1. General rules

Common flags:

```bash
--root <path>
--session <id>
--format text|yaml
--dry-run
--quiet
--verbose
```

Each mutating command outputs:

```text
Result: success|blocked|failed
Command: <command>
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
```

The agent must read `Next actions` and perform the first applicable protocol-safe step.

Mutating runtime commands acquire an exclusive ephemeral dossier write lock before
reading and writing artifacts. The primary lock path is
`.dossier-runtime/write.lock/` under the dossier root. The lock is runtime
metadata, not dossier state: do not commit it, reference it from changesets, or
repair it as an artifact. Ensure `.dossier-runtime/` is ignored by git in
dossier-managed repositories.

Default lock conflict behavior is fail-fast. A blocked mutating command reports
the lock path, holder metadata when available, lock age, and recovery-oriented
Next actions. Do not wait or retry implicitly; re-run the command after
confirming the holder finished or after safely removing a stale lock.

Read-only commands may run without the write lock and may observe a transient
mixed view while another process is committing multiple artifact updates.
Closure, record, and other mutating decisions re-read affected artifacts after
acquiring the write lock.

`verify run` is logically mutating because it may record verification results,
but its external command execution phase does not hold the write lock. The
runtime reads the intended verification scope, runs external commands without
the lock, then acquires the lock, re-reads affected artifacts, checks material
scope and profile freshness, records the verification artifact, validates the
write, and releases the lock.

When a command creates a source, capability, baseline, guardrail, work item,
review, verification, or changeset scaffold, runtime also returns a body
completion reminder in `Next actions`. That reminder does not validate the body
and does not replace the Body Completion Gate; it makes the required manual body
completion visible immediately after scaffold creation.

## 2. Project commands

### `init`

```bash
dossier-engineer init --root . --project-name "<project>" [--review-mode risk_weighted|strict|custom]
```

Creates `docs/dossier/project.md`, canonical directories, default verification profiles, review policy and capability policy.

Next actions:

- register concept source;
- create capabilities or baseline;
- run status/capability checks.

### `status`

```bash
dossier-engineer status --root .
```

Read-only derived view:

- lifecycle summary;
- capabilities by status;
- open source reviews;
- triggered guardrails;
- stale reviews/verification;
- closure violations;
- next recommended action.

### `attention`

```bash
dossier-engineer attention --root .
```

Prioritizes:

1. invalid artifacts;
2. triggered guardrails;
3. open source reviews;
4. capability work without behavioral proof;
5. existing capabilities without evidence;
6. support accumulation without demo;
7. stale reviews/verification;
8. failed reviews or verification;
9. blocking blockers;
10. missing hygiene.

### `queue`

```bash
dossier-engineer queue --root . [--area <area>] [--owner <owner>]
```

Computes the next actionable work by dependency order and protocol readiness.
The summary uses `Next actionable work`, not `Ready work items`, because items
in early stages are not implementation-ready.

Each actionable line includes:

```text
WI-... | next_action=start_stage|mark_stage_ready|close_stage|run_hygiene | stage=<stage> | implementation_ready=true|false
```

`implementation_ready=true` is emitted only when the next protocol action is on
the implementation stage itself. Feature-intake, spec-compact, plan-slice, and
post-close hygiene actions remain `implementation_ready=false`.

A work item is not actionable when:

- source-review is open;
- guardrail is triggered for its scope;
- dependency is not closed;
- blocker is open;

For dependency calculation, a work item is terminal only after post-close
hygiene has passed. `lifecycle=implemented` alone is not dependency-complete.
For backwards compatibility, `lifecycle=implemented` plus closed/passed
implementation hygiene is treated as terminal handoff-complete.

### `next`

```bash
dossier-engineer next --work <work-id>
```

Returns the next safe protocol action for a work item.

After `stage close --stage implementation`, `next` reports the required hygiene
action. After successful `hygiene run --stage implementation`, `next` reports no
required work-item action and may only suggest optional changeset/report
handoff evidence.

### `lint`

```bash
dossier-engineer lint --root .
dossier-engineer lint --path <artifact-path>
dossier-engineer lint --type <artifact-type> [--fix-frontmatter]
```

Validates schemas, refs, closure gates, freshness, capability gates and forbidden canonical state files.

`--fix-frontmatter` repairs safe metadata only. It must not invent semantics or mark work as closed.

### `repair frontmatter`

```bash
dossier-engineer repair frontmatter --path <artifact-path> --type <artifact-type>
```

Creates or repairs missing frontmatter with safe defaults while preserving body. Blocks when semantic fields cannot be safely inferred.

## 3. Source commands

### `source add`

```bash
dossier-engineer source add --path <path> --kind <kind> --authority <authority> --title "<title>" [--tag <tag>...]
```

Creates `SRC-*.md`, computes local file hash, and returns next actions for capability creation or work creation.

### `source list`

```bash
dossier-engineer source list --root . [--status active] [--kind concept]
```

Lists sources with linked capability and work counts.

### `source refresh`

```bash
dossier-engineer source refresh --root .
dossier-engineer source refresh --source <source-id>
```

Recomputes hashes. When content changed, creates `SR-*.md` and records impacted capabilities and work items. Does not mutate work items automatically.

### `source impact`

```bash
dossier-engineer source impact --source <source-id> [--review <source-review-id>]
```

Shows affected capabilities, acceptance criteria, work items, source-review state and suggested next actions.

### `source review resolve`

```bash
dossier-engineer source review resolve --review <source-review-id> --verdict <verdict> --summary "<summary>" [--capability <capability-id>...] [--work <work-id>...]
```

Allowed verdicts:

- `no_backlog_change`;
- `update_capabilities`;
- `update_existing_items`;
- `create_followups`;
- `retire_items`;
- `blocked_pending_decision`.

## 4. Capability commands

### `capability create`

```bash
dossier-engineer capability create --title "<title>" --status intended|existing|partial|unverified|retired --source <source-id> [--area <area>] [--owner <owner>]
```

Creates `CAP-*.md` with scaffold and machine-owned frontmatter.

Rules:

- `intended` and `existing` require at least one source;
- `existing` will be flagged by `capability check` until demo/baseline evidence exists;
- `retired` requires reason in body or retirement command.

### `capability claim set`

```bash
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<later or restarted behavior>"
```

Sets capability claim fields. Recomputes impacted material-scope hashes for linked open work items.

### `capability anti-claim add`

```bash
dossier-engineer capability anti-claim add --capability <capability-id> --text "<explicit non-goal>"
```

Adds capability-level non-goal. Does not remove work-level anti-claim requirements.

### `capability demo record`

```bash
dossier-engineer capability demo record --capability <capability-id> --verdict pass|fail|blocked --summary "<summary>" [--evidence <path>...]
```

Records project-level capability evidence, usually for existing-project baseline or periodic end-to-end demonstrations.

### `capability check`

```bash
dossier-engineer capability check --root . [--capability <capability-id>] [--work <work-id>]
```

Read-only guard against self-deception. Flags:

- capability without concept source;
- incomplete claim;
- existing capability without evidence;
- capability work without behavior criterion;
- capability work without demo;
- capability work without anti-claim;
- closed capability work without behavioral verification;
- closed capability work without concept-conformance review;
- support work not linked to capability or guardrail;
- support chain without recent capability demonstration.

## 5. Baseline commands

### `baseline create`

```bash
dossier-engineer baseline create --title "<title>" --mode existing-project|release-snapshot|regression-baseline|manual --source <source-id>
```

Creates `BASE-*.md`. Used to start dossier in an already working project, or to capture release/regression capability state.

### `baseline capability add`

```bash
dossier-engineer baseline capability add --baseline <baseline-id> --capability <capability-id> --status observed|assumed|unverified|partial|regressed [--evidence <path>...]
```

Adds capability membership to baseline. If `status=observed`, at least one evidence path or capability demo must exist.

## 6. Guardrail commands

### `guardrail add`

```bash
dossier-engineer guardrail add --title "<title>" --condition "<trigger condition>" --action "<required action>" [--capability <capability-id>...] [--area <area>...]
```

Creates `KILL-*.md` active guardrail.

### `guardrail check`

```bash
dossier-engineer guardrail check --root . [--guardrail <guardrail-id>]
```

Read-only evaluation. Flags triggered guardrails and returns required actions.

### `guardrail resolve`

```bash
dossier-engineer guardrail resolve --guardrail <guardrail-id> --summary "<resolution>" [--evidence <path>...]
```

Resolves only when evidence or explicit decision is recorded. Resolution does not retroactively close blocked work.

## 7. Work commands

### `work create`

```bash
dossier-engineer work create --title "<title>" --type <type> --delivery capability|support|maintenance|exploration --source <source-id> --area <area> --owner <owner> [--capability <capability-id>] [--relation introduces|extends|supports|maintains|verifies|retires] [--priority low|normal|high|critical]
```

Creates `WI-*.md`.

Rules:

- `delivery=capability` requires `--capability` and relation `introduces` or `extends`;
- `delivery=support` requires capability or active guardrail before closure;
- `delivery=maintenance` requires existing capability;
- `delivery=exploration` may omit capability but must produce answer/follow-up at closure.

### `work acceptance add`

```bash
dossier-engineer work acceptance add --work <work-id> --kind behavior|contract|unit|integration|security|performance|operational|support --text "<criterion>" --source <source-id>#<anchor>
```

Adds structured acceptance criterion. Capability work needs at least one `kind=behavior` criterion.

### `work demo set`

```bash
dossier-engineer work demo set --work <work-id> --name "<name>" --scenario "<scenario>" [--falsifier "<condition>"...]
```

Defines closure demonstration. Required for capability and maintenance work.

### `work anti-claim add`

```bash
dossier-engineer work anti-claim add --work <work-id> --text "<explicit non-goal>"
```

Adds work-level anti-claim. Required for capability work before spec-compact closure.

### `work challenge record`

```bash
dossier-engineer work challenge record --work <work-id> --summary "<why the plan may be wrong>"
```

Creates stage event `challenge` and updates work challenge metadata. Required before plan-slice closure.

### `work support explain`

```bash
dossier-engineer work support explain --work <work-id> --reason "<why this support is necessary now>"
```

Required for support work closure.

### `work dependency add/remove`

```bash
dossier-engineer work dependency add --work <work-id> --depends-on <other-work-id>
dossier-engineer work dependency remove --work <work-id> --depends-on <other-work-id> --reason "<reason>"
```

Updates dependencies and blocks cycles.

### `work blocker add/resolve`

```bash
dossier-engineer work blocker add --work <work-id> --kind requirement-gap|decision|dependency|risk|external --summary "<summary>" [--non-blocking]
dossier-engineer work blocker resolve --work <work-id> --blocker <blocker-id> --summary "<resolution>"
```

### `work risk set`

```bash
dossier-engineer work risk set --work <work-id> --implementation <csv> --policy <csv>
```

Recomputes review requirements.

### `work amend`

```bash
dossier-engineer work amend --work <work-id> --from-change-proposal --summary "<summary>"
```

Applies accepted structured changes after change-proposal.

### `work split`

```bash
dossier-engineer work split --work <work-id> --title "<new title>" --reason "<reason>" [--capability <capability-id>] [--source <source-id>]
```

Creates new work item while preserving traceability.

### `work retire`

```bash
dossier-engineer work retire --work <work-id> --reason "<reason>"
```

Retires without deleting traceability.

## 8. Stage commands

### `stage start`

```bash
dossier-engineer stage start --work <work-id> --stage feature-intake|spec-compact|plan-slice|implementation|change-proposal --session <session-id>
```

Validates prerequisites and creates `STG-*` start event.

### `stage ready`

```bash
dossier-engineer stage ready --work <work-id> --stage <stage> --summary "<summary>"
```

Sets `ready_for_close` only when required stage gates pass.

For capability work, `spec-compact` and `plan-slice` readiness also enforce the
material body contracts described in the workflow reference. `plan-slice`
readiness requires a current PASS `concept-conformance-reviewer` review recorded
for `stage=plan-slice`.

### `stage close`

```bash
dossier-engineer stage close --work <work-id> --stage <stage>
```

Closes stage only when all closure gates pass.

Closing implementation sets `lifecycle=implemented`; it does not mark the work
item handoff-complete. Successful post-close hygiene is the terminal handoff
gate and sets the work item to closed/handoff-complete state.

### `stage reopen`

```bash
dossier-engineer stage reopen --work <work-id> --stage <stage> --reason "<reason>"
```

Reopens stage and marks affected evidence stale.

### `stage log`

```bash
dossier-engineer stage log --work <work-id> --stage <stage> --event note --summary "<summary>"
```

Creates immutable note event without transition.

## 9. Verification commands

### `verify required`

```bash
dossier-engineer verify required --work <work-id> --stage implementation
```

Returns required profiles and freshness state.

### `verify run`

```bash
dossier-engineer verify run --work <work-id> --stage implementation --profile default|behavioral-demo|<profile>
```

Executes configured verification profile, creates `VER-*.md`, updates coverage gate when appropriate.

### `verify record`

```bash
dossier-engineer verify record --work <work-id> --stage implementation --profile <profile> --evidence-class behavioral|contract|unit|integration|security|manual|support --verdict pass|fail|blocked|not_applicable --summary "<summary>" [--evidence <path>...]
```

Records external/manual verification evidence.

## 10. Review commands

### `review required`

```bash
dossier-engineer review required --work <work-id> --stage plan-slice
dossier-engineer review required --work <work-id> --stage implementation
```

Returns required review classes and freshness state for the requested stage.
For capability work at `stage=plan-slice`, the required class is
`concept-conformance-reviewer` and the review must be fresh for `plan-slice`.

### `review record`

```bash
dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer|spec-conformance-reviewer|code-reviewer|security-reviewer|<class> --verdict pass|fail|blocked|not_applicable --reviewer <reviewer-id> [--summary "<summary>"] [--evidence <path>...]
```

Creates immutable `REV-*.md` and compares material scope hash.

## 11. Hygiene commands

### `hygiene run`

```bash
dossier-engineer hygiene run --work <work-id> --stage implementation
```

Checks closure truth, source-review state, capability gates, behavioral demo, review freshness, queue impact, attention impact and post-close consistency. Creates `HYG-*.md`.

## 12. Changeset and reporting commands

### `changeset create`

```bash
dossier-engineer changeset create --scope current-branch --summary "<summary>" [--work <work-id>...] [--capability <capability-id>...] [--source <source-id>...]
```

Creates branch-level evidence without overwriting global state.

### `report create`

```bash
dossier-engineer report create --kind status|queue|attention|source-impact|capability|guardrail --scope repository|work:<id>|capability:<id>|source:<id>
```

Creates derived report. Report is not source of truth.

### `retro create`

```bash
dossier-engineer retro create --since <date-or-ref> --until <date-or-ref>
```

Creates derived retrospective report from canonical artifacts.
