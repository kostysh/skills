# Improvement Proposal: Remove Stale Split-Skill / Merge-Era Wording From Active Surface

## Problem

The active instruction surface of `unified-dossier-engineer` still contains stale merge-era wording that refers to deleted split skills as if they were still part of the live operating model.

Examples from the current active surface:

- `This skill is the code-backed home of the merged dossier-engineer.`
- `The task only changes the split backlog-engineer or dossier-engineer skill without affecting the merged skill.`

This wording is wrong for the current repository state.

The repository no longer ships:

- `skills/backlog-engineer`
- `skills/dossier-engineer`

The canonical skill is now:

- `skills/unified-dossier-engineer`

## Why This Is A Problem

Active instructions must describe current truth, not historical transition narrative.

Leaving split-skill wording in the active surface creates false implications:

- that split skills still exist and may need to be consulted;
- that the canonical skill is only a “merged variant” of something else that still matters operationally;
- that transitional or legacy reasoning is still part of the active method.

This increases agent confusion and can cause:

- pointless searching for deleted skills;
- incorrect mentions of `backlog-engineer` or `dossier-engineer` in operator-facing outputs;
- weak boundary hygiene in future edits because the source bundle still speaks in migration language.

## Root Cause

The source bundle retained transition-era merge wording after the project already decided:

- no legacy support;
- no split-model compatibility;
- one canonical unified skill only.

This is not a documentation nuance. It is stale active contract text.

## Required Fix

Remove split-skill and merge-era narrative from the active surface of `unified-dossier-engineer`.

The active skill must describe only the current canonical truth:

- one canonical unified skill;
- one canonical runtime;
- self-contained current-tense wording;
- no transitional wording in active instructions.

## What Must Change

### 1. Root generated skill wording

Fix generated [SKILL.md](../SKILL.md) so it no longer says or implies:

- that `unified-dossier-engineer` is the “merged `dossier-engineer`”;
- that split `backlog-engineer` or split `dossier-engineer` still exist as live skill targets;
- that current operator/agent decisions should reason in terms of split-skill ownership.

Replace this with canonical wording such as:

- this skill is the code-backed home of the canonical unified dossier/backlog runtime;
- use this skill when maintaining the canonical unified skill and runtime;
- do not use this skill for unrelated skills that do not affect the canonical unified source bundle or runtime.

### 2. Source bundle wording

Fix the source bundle, especially:

- [skill.yaml](../skill.yaml)
- source fragments that feed emitted `SKILL.md`
- any active `references/*` that still describe the skill through deleted split-skill identities

The emitted `SKILL.md` must become clean as a consequence of source-bundle cleanup, not by one-off editing.

### 3. Active reference language

Active references must be self-contained and written in present-tense canonical terms.

They must:

- describe only the current unified skill, runtime, artifacts, and workflow;
- remain understandable without knowing anything about deleted split skills;
- avoid any wording that implies the agent should reason about current tasks through old split-skill identities.

If historical context is useful for maintainers, keep it in non-normative `docs/*`, not in the active instruction surface.

### 4. Generated/help/runtime parity

If any shipped runtime/help text still uses split-skill or merge-era identity wording, clean that too.

The active operator-facing surface must consistently say:

- canonical unified skill;
- canonical unified runtime;
- self-contained current model only.

## Acceptance Criteria

This issue is fixed only when:

- active `SKILL.md` no longer refers to deleted split skills as live entities;
- active `skill.yaml` no longer contains split-skill wording in user-facing fields;
- active references are self-contained and describe only the current canonical unified skill;
- generated surface, active source bundle, and operator-facing wording all consistently describe only the canonical unified skill;
- any remaining historical discussion is moved out of active surface into non-normative docs.

## Non-Goals

- Do not rewrite legitimate historical issue/proposal documents unless needed for clarity.
- Do not remove useful architectural explanation just because the merge happened historically.
- Do not keep transitional wording in active surface “for context”.
