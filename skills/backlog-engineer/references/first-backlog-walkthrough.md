# First Backlog Walkthrough

Use this walkthrough when you need one exact first-run flow instead of separate reference fragments.

This walkthrough assumes:

- the operator wants a brand-new backlog;
- an architecture document is the anchor source;
- the agent is driving the CLI;
- packet authoring happens from a draft template, not from memory.

## Goal

Go from:

- architecture anchor source plus its required supporting sources

to:

- initialized backlog root
- registered source set
- authored packet draft
- validated `packet --dry-run`
- applied packet
- first read of `status`, `gaps`, `queue`, and `attention`
- explicit handoff to `dossier-engineer` for the selected work

## Execution note

Command examples below use `backlog-engineer ...` as the semantic command form.

If the CLI is not installed in `PATH`, replace only the command prefix with:

```bash
node <skill-root>/scripts/backlog-engineer.mjs ...
```

Where:

- `<skill-root>` means the directory that contains this skill's `SKILL.md`

Important:

- do not change `cwd` for that substitution;
- root discovery and relative path resolution still depend on the working directory where you execute the command.

## Step 1. Analyze operator input first

Before touching the repo or the codebase, check whether the operator already told you:

- whether the system is design-only or partially implemented;
- what source of truth should be used for `delivery_state`.

If that information is missing, ask one short combined question and wait.

Example:

> Is the system still only being designed, or is it already partially implemented? If it is partially implemented, what should I use as the source of truth for delivery state: codebase, tests, architecture docs, or something else?

Negative rule:

- until the operator answers, do not inspect the repo to infer implementation state on your own.

## Step 2. Close the source-set gate

Before `init`, `register-source`, `template packet`, or packet authoring, identify the full source set for the first backlog pass.

Interpret operator wording conservatively:

- if the operator says `based on system.md`, treat `system.md` as the anchor source;
- do not treat it as the only source unless the operator explicitly says `only from system.md`.

Minimum source-set expectations for a partially implemented repository:

- architecture anchor source;
- source of truth for `delivery_state`;
- repo-level cross-cutting ADR or decision sources, when they are declared as canonical;
- upstream concept or system-definition sources that the architecture source explicitly relies on.

Self-expanding source graph rule:

- if the anchor architecture source points to concept documents, ADRs, cross-cutting contracts, or other canonical sources, stop and expand the source set before packet authoring.

Planning backlog documents may still help with:

- candidate task names;
- ownership hints;
- delivery hints.

But they must not replace extraction from concept, architecture, and ADR sources.

Negative rule:

- do not author the first packet until the source-set gate is closed.

## Step 3. Initialize the backlog root

Example:

```bash
backlog-engineer init --path ./backlog
```

Expect in output:

- absolute `path`
- absolute `root_marker_path`
- absolute `agents_path`

Result:

- `./backlog` becomes the backlog root
- utility-owned files and directories are created there

## Step 4. Register the sources one by one

Run source registration from the backlog root or one of its child directories.

Example:

```bash
cd ./backlog
backlog-engineer register-source \
  --path ../docs/architecture/system.md \
  --kind architecture \
  --authority authoritative
```

Then repeat `register-source` for the rest of the source set, one source at a time.

Important:

- `--path` resolves from the current working directory;
- the stored source path may stay relative to backlog root and may contain `..`;
- machine-facing output returns `path` as an absolute filesystem path;
- for one backlog root, do not run `register-source` in parallel with other mutating commands.

Expect in output:

- `source_id`
- `source_label`
- absolute `path`
- `kind`
- `authority`
- `hash`

Keep every returned `source_id`. Do not invent them later.

## Step 5. Generate a packet draft

Example:

```bash
backlog-engineer template packet --out ./drafts/
```

Expect in output:

- `mode = "packet"`
- absolute `output_path`

What the draft contains:

- starter `context`
- starter `target_system`
- starter `as_built`
- placeholder `source_id` slots
- one starter task showing expected field usage

What the draft is not:

- not an apply-ready packet
- not canonical utility state

Replace placeholders such as `<source_id_1>` and remove starter entries that do not apply.

## Step 6. Author the first packet

Use the generated draft and fill it from the source document.

Checklist:

- use the full source set, not only the anchor architecture document;
- replace placeholder `source_id` values with the real registered `source_id`
- keep only context entries that materially help backlog understanding
- create atomic tasks, not module-sized blobs
- add `gaps` only when a missing fact would make the task unsafe to state confidently
- if an uncertainty can be expressed as concrete work, create a `clarification`, `investigation`, or `decision` task instead of leaving only blocked gap items
- keep the default strategy `coverage-first backlog`

Do not let planning backlog documents replace extraction from:

- concept documents;
- architecture sources;
- ADRs;
- cross-cutting decisions.

## Step 7. Validate with dry-run first

Example:

```bash
backlog-engineer packet --path ./drafts/packet.template.json --dry-run
```

Expect in output:

- `dry_run = true`
- absolute `authored_packet_path`
- `counts`
- `todo_created`
- `todo_updated`
- `next_commands`

If dry-run reports a problem:

- fix the draft
- rerun dry-run

## Step 8. Apply the packet

Example:

```bash
backlog-engineer packet --path ./drafts/packet.template.json
```

Expect in output:

- absolute `authored_packet_path`
- absolute `canonical_packet_path`
- `canonical_packet_purpose = "immutable_import_copy"`
- compact mutation summary

Interpretation:

- `authored_packet_path` is still your draft
- `canonical_packet_path` is the immutable import copy owned by the utility
- current backlog truth is not read from either packet file; read it from the utility

## Step 9. Read the first backlog state

Minimal first-pass flow:

```bash
backlog-engineer status
backlog-engineer gaps
backlog-engineer queue
backlog-engineer attention
```

Interpretation:

- `status` gives the short global summary
- `gaps` shows explicit blockers
- `queue` returns ordered ready chains, not a flat list
- `attention` returns review and re-check items, not every blocked task

If `queue` is empty:

- check `gaps`
- then check `attention`

Important:

- use this backlog read model to choose the first selected work;
- do not jump into dossier-local workflow before backlog selection and readiness are clear.

## Step 10. Hand off selected work to `dossier-engineer`

Once backlog selection is clear:

- take the selected `item_key`
- keep its current `delivery_state`
- keep the relevant source traceability
- keep known blockers and dependencies

Then continue in `dossier-engineer`:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`

Return to `backlog-engineer` again whenever dossier-side work changes backlog truth:

- actualize to `specified` after shaping/specification evidence
- actualize to `planned` after planning evidence
- actualize to `implemented` after implementation + closure evidence
- patch blockers, dependencies, and context facts discovered in dossier work

## Step 11. What not to do

Do not do these in the first run:

- do not infer system state from the repo before resolving missing operator input
- do not invent `source_id`
- do not mutate existing tasks through `packet`
- do not read packet files as the current source of truth after apply
- do not run mutating commands in parallel for the same backlog root

## End state

After this walkthrough you should have:

- one initialized backlog root
- at least one registered source
- one authored packet draft
- one applied packet
- the first real backlog state materialized by the utility
- one clear downstream handoff into `dossier-engineer`
