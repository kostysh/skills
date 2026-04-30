# Parallel development rules

The goal is to allow multiple agents and branches to work with dossier artifacts without a central state file and without guaranteed merge conflicts.

## 1. Core principle

Each canonical record is stored as a separate Markdown/YAML artifact. A branch should change only records in its scope.

Forbidden:

- global mutable indexes;
- sequential counters;
- committed generated status/queue/attention reports;
- shared lock files;
- JSON/JSONL canonical state;
- manual frontmatter edits.

## 2. Conflict-safe artifact model

Merge-safe by default:

- new `WI-*.md` work items;
- new `CAP-*.md` capabilities;
- new `VER-*.md` verification records;
- new `REV-*.md` review records;
- new `HYG-*.md` hygiene records;
- new `STG-*.md` stage events;
- new `CS-*.md` changesets.

Potential conflict zones:

- same `CAP-*.md` capability claim edited by multiple branches;
- same `WI-*.md` work item frontmatter edited by multiple branches;
- same `SRC-*.md` source record updated after source movement/change;
- same `KILL-*.md` guardrail resolved/triggered by multiple branches;
- same `BASE-*.md` baseline updated by multiple onboarding branches.

Resolve conflicts semantically. Conflict on the same capability or work item usually means overlapping product scope.

## 3. Branch discipline

Before starting branch work:

```bash
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer queue --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

During branch work:

- create new records instead of editing old immutable evidence;
- avoid updating broad baselines from multiple branches;
- use a new changeset record for branch summary;
- do not commit generated global reports unless explicitly requested.

Before handoff or PR:

```bash
dossier-engineer lint --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
dossier-engineer changeset create --scope current-branch --summary "<summary>"
```

## 4. Capability conflicts

When two branches edit the same capability claim:

1. Compare concept source and source hashes.
2. Determine whether branches describe the same observable behavior.
3. If one branch narrows capability into infrastructure-only behavior, keep the broader observable claim and open change-proposal for the narrower branch.
4. If branches introduce different behaviors, split into separate capability records.
5. If both branches extend the same capability, preserve both work items and update capability claim only if both extensions are now part of the product intent.
6. Run `capability check` after resolution.

## 5. Work-item conflicts

When two branches edit the same work item:

- do not mechanically merge frontmatter;
- identify whether acceptance criteria, demo, anti-claims, risk, or delivery kind changed;
- rerun review/verification if material scope changed;
- open change-proposal if implementation no longer matches concept or demo;
- prefer `work split` when branches represent different slices.

Runtime commands:

```bash
dossier-engineer work split --work <work-id> --title "<new title>" --reason "<reason>"
dossier-engineer stage reopen --work <work-id> --stage <stage> --reason "<material merge change>"
```

## 6. Source conflicts

When source files change in multiple branches:

```bash
dossier-engineer source refresh --root .
dossier-engineer source impact --source <source-id>
```

If source hash changed, runtime opens source-review. Resolve source-review before linked work is considered ready.

## 7. Baseline conflicts

For existing-project onboarding:

- use one baseline per onboarding effort or release snapshot;
- avoid many branches writing to the same baseline artifact;
- if two baselines describe the same capability differently, resolve capability record first;
- baseline conflicts should not create closed work items;
- unverified baseline entries remain unverified until evidence is recorded.

## 8. Guardrail conflicts

When a guardrail is triggered in one branch and resolved in another:

1. Re-run `guardrail check` after merge.
2. Verify resolution evidence still applies.
3. If support work accumulated during conflict, run `capability check`.
4. Reopen guardrail if evidence is stale or contradicted.

## 9. Immutable evidence

Review, verification, hygiene and stage-event artifacts are immutable attempts.

When evidence becomes stale:

- create a new artifact;
- leave old artifact as historical evidence;
- do not edit old PASS into FAIL or fresh into stale;
- let derived views compute freshness.

## 10. Changesets

Each branch should create a changeset before handoff:

```bash
dossier-engineer changeset create --scope current-branch --summary "<branch summary>"
```

Changeset should include:

- changed sources;
- changed capabilities;
- baselines updated;
- guardrails added/triggered/resolved;
- work items changed;
- reviews and verification;
- hygiene;
- process misses;
- capability drift or support-only risk.
