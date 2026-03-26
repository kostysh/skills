# MIGRATION.md

## Purpose

Use this runbook to migrate an existing repository onto the current dossier protocol.

Treat migration as an **infrastructure and process upgrade**, not as feature delivery.
Do the migration first. Resume normal feature work only after the repository is aligned.

## Use this runbook when

Run this procedure when one or more of the following are true:

- the repository already uses an older dossier workflow;
- repo-local `scripts/` are older than the current skill package;
- `.dossier/verification/`, `.dossier/reviews/`, `.dossier/steps/`, or `.dossier/drift/` are missing;
- dossiers still overload one field to represent multiple state machines;
- the repository has no machine-checkable review or step-closure artifacts;
- the repository has no clear rule for migrating older features into the current protocol.

## Required migration outcomes

After migration:

- repo-local dossier automation scripts are current and are the **primary runtime**;
- repo-root `AGENTS.md` reflects the current dossier protocol and preserves repo-specific overlays;
- the repository contains the required `.dossier/` directories;
- dossier frontmatter uses separate `status` and `coverage_gate` dimensions;
- old untouched features remain legacy without fabricated history;
- active features are rebased onto the current step-closure protocol;
- implementation review explicitly covers completeness, code review, and security review;
- `debt-audit` remains marker-only and is not treated as proof of completeness.

## Hard rules

1. **Do not fabricate history.**
   Do not generate fake historical verification, review, or step-close artifacts for work that did not actually pass through the current protocol.

2. **Use repo-local scripts as the primary runtime after migration.**
   Skill-folder script execution is bootstrap-only fallback. The repository must end up using `node scripts/...` from repo root.

3. **Do not mix migration with product work.**
   Put migration on a dedicated branch and commit it separately from feature delivery.

4. **Prefer touch-to-migrate over mass historical rewrites.**
   Old untouched features may remain legacy until they are touched again.

5. **Rebaseline active work.**
   Features that are currently active must move to the current verify → review → close protocol before more implementation continues.

6. **Use independent review.**
   For review of a migrated step, use a separate reviewer agent whenever the `spawn_agent` tool exists. If platform policy requires explicit user authorization before spawning, ask for that authorization instead of downgrading review. If a separate reviewer agent still cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.

7. **Treat implementation completeness as a mandatory review dimension.**
   For implementation review, verify that delivered behavior fully matches the dossier, slicing plan, approved changes, and acceptance criteria. Hidden scope deferral is not acceptable.

## Preconditions

Before starting:

- the repository has a clean or intentionally stashed worktree;
- the current dossier skill package is available to the agent;
- Node.js >= 18 is available;
- git metadata is available for the repository;
- the repository has a canonical architecture document or one can be identified during migration.

## Migration procedure

### Phase 1 — Create a dedicated migration branch

Create a dedicated branch and stop normal feature work on the current branch.

Suggested branch name:

```bash
git checkout -b chore/dossier-protocol-migration
```

Record the starting state:

```bash
git status --short
node --version
git rev-parse --short HEAD
```

If the worktree already contains unrelated product changes, do not continue until they are either committed separately or stashed.

### Phase 2 — Provision the current repo-local protocol runtime

From the current dossier skill package, provision or update the following in the repository:

- `scripts/*.mjs`
- `scripts/lib/*`
- repo-root `AGENTS.md`
- `docs/ssot/index.md` if missing
- `docs/backlog/feature-candidates.md` if missing
- `.dossier/verification/`
- `.dossier/reviews/`
- `.dossier/steps/`
- `.dossier/drift/`

Rules for this phase:

- preserve repo-specific command names, paths, and overlays when updating `AGENTS.md`;
- keep repo-root `AGENTS.md` overlay-only; do not duplicate default dossier workflow rules from the skill unless the repository is intentionally tightening them;
- do not leave the repository dependent on running scripts from the skill folder;
- if the repository already has equivalent directories, normalize them instead of deleting useful existing state;
- do not remove valid repo-specific ADR references from `AGENTS.md`.

At the end of this phase, the repository must be able to run canonical commands from repo root, for example:

```bash
node scripts/dossier.mjs index-refresh
node scripts/dossier.mjs lint-dossiers
node scripts/dossier.mjs next-step
```

### Phase 3 — Normalize dossier and backlog schema

Inspect all dossiers and normalize them to the current state model, but keep the
touch-to-migrate rule intact.

Working rule for this phase:

- **active or touched dossiers** should be fully aligned to the current state model;
- **untouched legacy dossiers** may receive the **minimum schema-only normalization**
  required for repo-wide tools to run truthfully;
- untouched legacy dossiers must **not** receive fabricated verification, review, or
  step-closure history during this phase.

Required dossier rules:

- `status` represents **dossier maturity only**;
- `coverage_gate` represents **coverage enforcement only**;
- dossier IDs use stable `F-*` identifiers;
- acceptance criteria text exists only in the dossier;
- candidate features remain in `docs/backlog/feature-candidates.md` and use `CF-*` IDs;
- `docs/ssot/index.md` lists only real dossiers, not candidates.

For each dossier that migration touches, ensure the frontmatter is consistent
with the current protocol. The important correction is semantic, not cosmetic:

- remove any old usage where `status` was also used as a coverage or verification gate;
- add `coverage_gate` where it is missing;
- preserve truthful maturity state;
- update `updated:` when the dossier is materially normalized.

For untouched legacy dossiers, stop at schema hygiene if that is enough for
repo-wide validation to run. Do not rewrite requirements/design sections or
invent current-process progress just to make old dossiers look uniform.

### Phase 4 — Run baseline repository checks

Run the repository-wide read-only checks after provisioning and schema normalization:

```bash
node scripts/dossier.mjs index-refresh
node scripts/dossier.mjs lint-dossiers
node scripts/dossier.mjs coverage-audit
node scripts/dossier.mjs debt-audit
node scripts/dossier.mjs next-step
```

Interpretation rules:

- `debt-audit` checks explicit markers only and must not be interpreted as completeness proof;
- `coverage-audit` findings must be triaged against the current dossier state and `coverage_gate`;
- `next-step` should become easier to interpret after migration, not more ambiguous.

If `lint-dossiers` fails, fix dossier schema and index consistency before continuing.

### Phase 5 — Classify existing features

Classify each existing feature into one of these buckets:

#### 1. Untouched legacy feature

Use this bucket when:

- the feature is not being worked on now;
- the current branch does not contain behavioral changes for it;
- there is no immediate need to re-open its workflow.

Handling rule:

- leave the feature as legacy;
- minimum schema normalization from Phase 3 is allowed when needed for current
  repo-wide tooling, but do not turn that into fake current-process history;
- do **not** fabricate `.dossier/verification/*`, `.dossier/reviews/*`, or `.dossier/steps/*` for old historical work;
- migrate it only when the feature is touched again.

#### 2. Active feature

Use this bucket when:

- dossier `status` is `planned` or `in_progress`; or
- the current branch already touches its code, tests, runtime, or dossier; or
- the operator expects work on it to continue immediately after migration.

Handling rule:

- rebaseline the feature onto the current protocol now.

#### 3. Mature but re-opened feature

Use this bucket when:

- dossier `status` is `done`, but migration work or follow-up changes touched executable behavior, executable dossier sections, or runtime assumptions.

Handling rule:

- treat the touched change as a new mutating step under the current protocol;
- do not pretend the old historical step was already closed under the new protocol.

### Phase 6 — Rebaseline every active feature

For every active feature, determine the current open step truthfully.

Typical mapping:

- `proposed` → `spec-compact`
- `shaped` → `plan-slice`
- `planned` or `in_progress` → usually `implementation`
- requirement changes on mature work → `change-proposal`

Then execute the current protocol on the **current repository state**, not on reconstructed history.

#### Step 6.1 — Determine the dossier path and step

Example:

```bash
DOSSIER=docs/features/F-0001-password-reset.md
STEP=implementation
```

#### Step 6.2 — Run local step checks

Run the repository checks that are appropriate for the step and changed scope. This normally includes tests, typechecks, or repo-specific commands from `AGENTS.md`.

Then run the canonical verification bundle:

```bash
node scripts/dossier.mjs dossier-verify --dossier "$DOSSIER" --step "$STEP"
```

Use `--extra` when repo overlays require additional commands.

#### Step 6.3 — Perform independent review

Review must be independent from the authoring pass.
Use a separate reviewer agent whenever the `spawn_agent` tool exists. If session policy requires explicit user authorization before spawning, request it before continuing. Do not silently downgrade to self-review or `emulated-independent-review`; if a separate reviewer agent still cannot be used, leave the step blocked unless the user explicitly approves degraded review mode.

For `implementation`, the review is not complete unless it explicitly covers **all** of the following:

- **implementation completeness** against the dossier, slicing plan, approved requirement changes, and current acceptance criteria;
- **code review** for correctness, maintainability, edge cases, and integration seams;
- **security review** for auth, secrets, trust boundaries, input handling, persistence, logging, unsafe defaults, and abuse paths;
- explicit detection of hidden scope deferral such as stubs, placeholder behavior, partially implemented branches, or silently postponed runtime behavior.

`debt-audit` does not replace any of the review dimensions above.

Persist the review result:

```bash
node scripts/dossier.mjs review-artifact \
  --dossier "$DOSSIER" \
  --step "$STEP" \
  --verdict PASS \
  --reviewer independent-reviewer
```

If the review finds issues, record them with `--must-fix`, `--should-fix`, and `--evidence` and do not close the step until they are resolved.

#### Step 6.4 — Close the step

Close the step only after verification passes and the review artifact is fresh for the current commit.

```bash
FEATURE_ID=$(basename "$DOSSIER" | sed -E 's/^(F-[0-9]{4}).*/\1/')
VERIFY_ARTIFACT=$(find ".dossier/verification/$FEATURE_ID" -type f -name "$STEP-*.json" | sort | tail -n 1)
REVIEW_ARTIFACT=$(find ".dossier/reviews/$FEATURE_ID" -type f -name "$STEP-*.json" | sort | tail -n 1)

if [ -z "$VERIFY_ARTIFACT" ] || [ -z "$REVIEW_ARTIFACT" ]; then
  echo "Missing scoped verification/review artifact for $FEATURE_ID step $STEP" >&2
  exit 1
fi

node scripts/dossier.mjs dossier-step-close \
  --dossier "$DOSSIER" \
  --step "$STEP" \
  --verify-artifact "$VERIFY_ARTIFACT" \
  --review-artifact "$REVIEW_ARTIFACT"
```

A step is not complete unless the resulting `.dossier/steps/<feature>/<step>.json` says `process_complete: true`.

#### Step 6.5 — Audit executable contract drift when applicable

If migration changed executable dossier sections on a dossier whose maturity is `planned`, `in_progress`, or `done`, run:

```bash
node scripts/dossier.mjs contract-drift-audit --dossier "$DOSSIER"
```

Then make an explicit follow-up decision:

- no executable follow-up needed; or
- code follow-up required; or
- test follow-up required; or
- runtime / deployment follow-up required.

Do not leave contract drift implicit.

### Phase 7 — Apply the touch-to-migrate rule to old untouched features

After active features are rebased, leave old untouched features alone.

Operational rule:

- they may remain without current `.dossier/*` process artifacts;
- they may keep legacy content/detail structure if the repository-wide tools no
  longer depend on changing it;
- they may keep only the minimum schema normalization needed for truthful current
  lint/index/coverage behavior;
- they are legacy until touched;
- at the first new mutating step, they must enter the current verify → review → close protocol.

Do not mass-rewrite every historical dossier only to make the repository look uniform.
Truthful process state is more important than visual consistency.

### Phase 8 — Run final validation

Run the final migration validation suite:

```bash
node scripts/dossier.mjs index-refresh
node scripts/dossier.mjs lint-dossiers
node scripts/dossier.mjs coverage-audit
node scripts/dossier.mjs debt-audit
node scripts/dossier.mjs next-step
```

Then manually verify all of the following:

- repo-local scripts are present and executable from repo root;
- required `.dossier/` directories exist;
- `AGENTS.md` points agents to the current protocol;
- untouched legacy features were **not** given fabricated historical closure artifacts;
- each active feature has a truthful current step artifact;
- each active implementation step has review evidence for completeness, code review, and security review;
- no step is described as complete when `process_complete` is false.

### Phase 9 — Commit migration as a standalone change

Commit migration separately from feature delivery.

Suggested commit message:

```bash
git add AGENTS.md docs scripts .dossier

git commit -m "chore: migrate repository to current dossier protocol"
```

## Failure handling

### `lint-dossiers` fails

Do not proceed to step closure.
Fix dossier frontmatter, broken links, index entries, or state-model misuse first.

### An active feature has no clear open step

Do not guess.
Use dossier maturity, current branch diff, and the last truthful completed artifact to determine the next open step.
If there is still ambiguity, treat the feature as needing `spec-compact` or `change-proposal` before implementation continues.

### Review passes but implementation is incomplete

This is not a valid PASS.
Re-open the review, record the missing scope as `must-fix`, complete the work, rerun verification, rerun review, and regenerate closure artifacts on the new commit.

### `debt-audit` passes but hidden deferral is discovered

Treat the hidden deferral as review failure or explicit approved scope reduction.
Marker cleanliness does not authorize silent incompleteness.

### `contract-drift-audit` finds executable impact

Do not leave the repository in an implied “docs updated, code later” state unless that follow-up is explicitly approved and tracked as a canonical next step.

### Review becomes stale before closure

Regenerate the review artifact for the current commit.
A stale review must not be used to close a step.

## Definition of done for migration

Migration is done only when all of the following are true:

- the repository uses current repo-local dossier scripts;
- the repository contains the current `.dossier/` structure;
- dossier state dimensions are normalized for active/touched dossiers, and any
  untouched legacy dossiers have only the minimum schema normalization required
  for truthful repo-wide validation;
- active features use current verification, review, and step-closure artifacts;
- implementation review explicitly checks completeness, code quality, and security;
- untouched legacy features remain truthful legacy rather than fake-current and
  have not been given fabricated current-process artifacts;
- final validation passes;
- the migration is committed separately from product work.

## Operator prompt

Use this prompt to trigger migration:

> Migrate this repository to the current dossier protocol by following `MIGRATION.md` exactly. Treat the migration as infrastructure work, not feature delivery. Do not fabricate historical review or closure artifacts. Rebaseline active features onto the current verify → review → close protocol, and use independent review for each migrated active step.

## Agent close-out format for migration

At the end of migration, report exactly these headings:

- `Provisioned runtime:`
- `Normalized artifacts:`
- `Legacy features left untouched:`
- `Active features rebased:`
- `Checks:`
- `Open blockers:`
- `Migration complete: yes|no`
- `Recommended next action:`

Do not say migration is complete if any active feature still lacks truthful step closure under the current protocol.
