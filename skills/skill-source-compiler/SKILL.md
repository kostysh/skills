---
name: skill-source-compiler
description: Compile structured skill source bundles into portable Agent Skills
  folders. Use when authoring, normalizing, or regenerating complex multi-file
  skills that need explicit active references, outcome-first instruction
  structure, supporting docs, and portability rules.
license: Apache-2.0
compatibility: Designed for skills-compatible agents that can read Markdown
  files and copy local files inside the skill folder. The packaged CLI at
  scripts/skill-source-compiler.mjs requires Node.js >= 22.22.0.
metadata:
  source-version: 0.2.4
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b86cd514fdc65b6b159139f5589b9cdb158a37dbc20345aa38ca986296886cad
---

# skill-source-compiler

## Start here

1. Confirm the task actually requires skill compilation or structural regeneration.
2. Read every required active reference before rewriting the target skill.
3. If the skill ships a runtime utility, look for it under <skill-root>/scripts and invoke it from the skill root instead of assuming a global executable exists.
4. Keep active normative guidance separate from supporting or historical documents.
5. Audit skill instructions for outcome-first structure, clear constraints, validation gates, and stop rules before regenerating or publishing.
6. Keep all required rules, examples, templates, and any documented CLI contract inside the emitted skill folder.

## When to use this skill

- Compile or regenerate a multi-file skill from a structured source bundle.
- Normalize a skill that accumulated duplicated or contradictory instructions.
- Rebuild a portable skill after source edits, reviews, or policy updates.

## When NOT to use this skill

- The task is a tiny direct edit to a simple prose-only skill.
- Required source files are missing and the source bundle cannot be resolved confidently.
- A supporting document should remain historical instead of being promoted into the active workflow.

## Overview

This skill exists to help an agent transform a **structured source bundle** into a standard Agent Skills package without relying on hidden repository state. The compiler should preserve semantic intent, remove duplication, enforce precedence, and render a `SKILL.md` whose section order makes the active workflow easy to follow.

The generated skill should favor **progressive disclosure**: keep `SKILL.md` focused on the decisions and procedures the agent needs every time, and place detailed material in linked `references/` files with explicit load triggers.

## Workflow stages

### Workflow stage: Analyze the source bundle

Build a complete source inventory before generating any output.

1. Read skill.yaml and list every fragment, reference, asset, runtime file, and supporting file.
2. Verify that required references exist and are marked as active in the source surface.
3. Identify whether the target skill is documentation-only or code-backed.

Validation:

- No required reference is orphaned.
- No file is assigned to both active and supporting surfaces.

### Workflow stage: Resolve conflicts and duplication

Convert competing guidance into a single deterministic instruction set.

1. Merge semantically equivalent guidance instead of repeating it across sections.
2. Apply explicit precedence rules when two instructions overlap.
3. Fail the compile if the source bundle lacks a deterministic conflict policy.

Validation:

- Every conflict is resolved by an explicit rule or becomes a compile error.

### Workflow stage: Audit instruction quality

Ensure the generated skill gives enough outcome, constraint, tool, validation, and stop-rule structure without over-specifying the path.

1. Check that the skill states the user-visible outcome, success criteria, constraints, side-effect limits, and output contract.
2. Remove vague, contradictory, or duplicate rules; add precedence only where behavior would otherwise be ambiguous.
3. Replace unnecessary step-by-step micromanagement with decision criteria, unless the exact sequence is required for safety, correctness, or tooling.
4. Ensure reference and tool triggers are concrete enough to support precise retrieval without loading everything by default.
5. Include validation commands, self-check expectations, fallback behavior, and stop rules when the skill changes code, artifacts, or external state.

Validation:

- The skill is outcome-first, contradiction-free, progressively disclosed, and has explicit validation and stop conditions.

### Workflow stage: Render the target skill

Produce a standard Agent Skills folder with progressive disclosure.

1. Generate SKILL.md with Start here, applicability, workflow, references, gotchas, and portability sections.
2. Copy active references, assets, runtime files, and supporting docs into their emitted paths.
3. Emit a non-normative compile report under docs/ for traceability.

Validation:

- SKILL.md links every required reference.
- No emitted file contains absolute local paths.

## Interop priority

- **language and toolchain matters:** the language or toolchain skill. Language semantics, packaging, linting, and testing conventions belong to language and toolchain skills.
- **framework APIs and framework idioms:** the framework skill. Framework-specific APIs, lifecycle rules, and integration patterns belong to framework skills.

## Runnable commands
### CLI command: `help`
**Use when:** You need to confirm the public CLI contract before invoking another command.

**Summary:** Show the shipped command surface, command-local usage, and exit-code contract.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Optional command name.

**Outputs:** Human-readable help text on stdout.; Exit code 0 on success.

**Examples:** node scripts/skill-source-compiler.mjs --help; node scripts/skill-source-compiler.mjs help compile

### CLI command: `lint`
**Use when:** Before compile, after source edits, or when reviewing source-surface changes.

**Summary:** Validate a source bundle without writing emitted output.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Source bundle directory path.

**Outputs:** OK or FAIL status on stdout.; Structured diagnostic lines on stdout.; Exit code 1 when validation errors are found.

**Examples:** node scripts/skill-source-compiler.mjs lint <source-dir>

### CLI command: `compile`
**Use when:** You need an out-of-place packaged copy of one source bundle.

**Summary:** Compile one source bundle into an independent generated skill folder.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Source bundle directory path.; --out-dir <independent-skills-dir>.

**Outputs:** Compiled output path on stdout.; Warning lines on stdout when lint emits warnings.

**Examples:** node scripts/skill-source-compiler.mjs compile <source-dir> --out-dir <independent-skills-dir>

### CLI command: `compile-all`
**Use when:** You need out-of-place packaged copies of multiple source bundles.

**Summary:** Compile every direct child source bundle under a sources root into an independent output directory.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Sources root directory path.; --out-dir <independent-skills-dir>.

**Outputs:** Count of compiled source bundles on stdout.; One emitted output path per compiled bundle on stdout.

**Examples:** node scripts/skill-source-compiler.mjs compile-all <sources-root> --out-dir <independent-skills-dir>

### CLI command: `regenerate`
**Use when:** You need to refresh SKILL.md and docs/compile-report.md in the folder that contains skill.yaml.

**Summary:** Regenerate compiler-owned files inside a source bundle.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Source bundle directory path.

**Outputs:** Regenerated source bundle path on stdout.; Warning lines on stdout when lint emits warnings.

**Examples:** node scripts/skill-source-compiler.mjs regenerate <source-dir>

### CLI command: `check`
**Use when:** After compile, after regenerate, or when auditing a generated skill for drift.

**Summary:** Verify a compiled skill folder or generated source bundle against structural, drift, and portability invariants.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Skill directory path.

**Outputs:** OK or FAIL status on stdout.; Diagnostic lines on stdout.; Exit code 1 when invariants fail.

**Examples:** node scripts/skill-source-compiler.mjs check <skill-dir>

## Gotchas

- **high** — When a skill ships a utility, look for it under <skill-root>/scripts and invoke it relative to the skill root instead of assuming a global executable is installed.
- **high** — Use regenerate for in-place source-bundle maintenance; use compile or compile-all only with independent output directories.
- **high** — Never compile into an output directory that overlaps the source bundle; the runtime rejects overlap before destructive writes.
- **high** — Never promote docs/* into active guidance unless the source bundle explicitly marks that content as active.
- **high** — Do not require repository files outside the emitted skill folder to understand or execute the skill.
- **medium** — Do not silently guess through unresolved conflicts; emit a compile error instead.
- **medium** — Never present a workflow stage as a runnable command unless the packaged CLI help surface actually exposes it.
- **medium** — Do not create placeholder references for simple source bundles; reference sections are conditional and should exist only when they carry real active guidance.

## Policies

### Active normative surface
The generated SKILL.md and required references are the only active default instruction surface unless SKILL.md explicitly promotes more files.

### Supporting and historical surface
docs/*, docs/issues/*, analyses, and investigations are supporting material only and must not override active guidance.

### Workflow stages vs shipped CLI
A workflow stage is not a runnable command unless the packaged CLI help surface exposes it. Keep workflow stages and CLI commands separate in both the source manifest and the generated SKILL.md.

### In-place regeneration
In-place regeneration writes only compiler-owned generated files. Manifest entries whose source and target resolve to the same path are validation-only; non-same-path in-place copies fail closed until ownership is explicit.

### Optional reference surface
Source bundles may omit references when the generated SKILL.md is self-contained; checks must still validate declared or linked references when they exist.

### Instruction quality
Skill instructions should be outcome-first, precise about constraints and completion criteria, explicit about validation and stop rules, and free of contradictory or unnecessarily mechanical process guidance.

## Required active references
- [Source language](references/source-language.md) — Read this before mapping source bundle fields into generated sections.
- [Conflict resolution](references/conflict-resolution.md) — Read this when duplicate or overlapping guidance appears in the source bundle.
- [Maintenance](references/maintenance.md) — Read this when creating, versioning, compiling, or releasing a code-backed generated skill.

## Optional references
- [Authoring guidelines](references/authoring-guidelines.md) — Read this when refining SKILL.md scope, progressive disclosure, instruction quality, or description quality.
- [Output structure](references/output-structure.md) — Read this when you need the canonical generated folder layout and section order.

## Bundled assets

- `assets/source-template.yaml` — Minimal template for a new skill source bundle.

## Portability rules

- Do not emit absolute paths or machine-specific environment assumptions.
- Do not require external local files outside the skill folder.
- Keep all mandatory templates, scripts, and references inside the emitted skill directory.
- Use only relative links inside the generated skill bundle.

## Portability checklist before finishing

- Search the emitted skill for absolute paths and remove them.
- Confirm every required reference exists inside the emitted skill folder.
- Confirm the copied skill remains understandable in isolation.
- Keep docs/* clearly non-normative unless promoted explicitly by SKILL.md.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/issues/*`

## Final checks

Before finishing:

- verify that every required reference is linked from `SKILL.md`
- verify that supporting docs remain clearly non-normative
- verify instruction quality: outcome-first instructions, no unresolved contradictions, precise reference/tool triggers, validation gates, and stop rules
- verify that copied assets, runtime files, and tests are still reachable by relative path
- verify that the generated bundle can be copied to another machine without losing required behavior
