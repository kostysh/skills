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
  source-version: 0.2.8
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: eb93734e73ff95555afb172f7c2b4db161c14faf410f5ea469e6e3af387bd775
---

# skill-source-compiler

## Start here

1. Confirm the task actually requires skill compilation or structural regeneration.
2. Read every required active reference before rewriting the target skill.
3. Treat the supplied skill.yaml, declared local files, operator constraints, and applicable repository instructions as inputs; operator constraints win, then repository instructions, then explicit source precedence, then same-surface specificity.
4. If the skill ships a runtime utility, look for it under <skill-root>/scripts and invoke it from the skill root instead of assuming a global executable exists.
5. Keep active normative guidance separate from supporting or historical documents.
6. Audit skill instructions for outcome-first structure, clear constraints, validation gates, and stop rules before regenerating or publishing; treat this as an author self-check, not an independent capability verdict.
7. Reject placeholder commands, modes, metrics, configuration surfaces, and references that do not change the agent workflow or cannot be backed by runtime behavior, measurement, or active guidance.
8. Keep all required rules, examples, templates, and any documented CLI contract inside the emitted skill folder.
9. Before writing generated output, determine either ready-to-regenerate from the resolved source inventory or blocked with a concrete reason; unresolved semantic conflicts require blocked: unresolved-conflict.

## When to use this skill

- Compile or regenerate a multi-file skill from a structured source bundle.
- Normalize a skill that accumulated duplicated or contradictory instructions.
- Rebuild a portable skill after source edits, reviews, or policy updates.

## When NOT to use this skill

- The task is a tiny direct edit to a simple prose-only skill.
- Required source files are missing and the source bundle cannot be resolved confidently.
- A supporting document should remain historical instead of being promoted into the active workflow.

## Overview

This skill helps an agent turn a **structured source bundle** into a portable Agent Skills package without hidden repository state. Inputs are the source manifest, its declared local files, operator constraints, and applicable repository instructions. The agent owns semantic analysis, precedence, instruction readiness, and the decision to return `ready-to-regenerate` or `blocked`; unresolved equal-authority conflicts require `blocked: unresolved-conflict`.

The packaged CLI is narrower. It validates declared schema, structure, reference classification, generated-file drift, file reachability, output safety, and text portability, then safely regenerates or compiles declared files. It does not understand semantic equivalence, prove that instructions produce correct behavior, or award an independent review `PASS`.

The output is an emitted skill folder with generated `SKILL.md`, compiler report, and only the references, assets, runtime, and supporting files declared for emission. It should favor **progressive disclosure**: keep `SKILL.md` focused on recurring decisions and procedures, and place detailed material in linked `references/` files with explicit load triggers.

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
3. If active guidance still has an equal-authority semantic conflict, stop as blocked: unresolved-conflict instead of regenerating or publishing.

Validation:

- Every semantic conflict is resolved by an explicit rule or the agent reports blocked: unresolved-conflict.
- Do not claim that CLI lint or compile inferred semantic equivalence, contradiction, or behavioral readiness.

### Workflow stage: Audit instruction quality

Perform an author-side structural and instruction-quality self-check without presenting compiler success as an independent behavioral verdict.

1. Check that the skill states the user-visible outcome, success criteria, constraints, side-effect limits, and output contract.
2. Remove vague, contradictory, or duplicate rules; add precedence only where behavior would otherwise be ambiguous.
3. Replace unnecessary step-by-step micromanagement with decision criteria, unless the exact sequence is required for safety, correctness, or tooling.
4. Remove placeholder commands, modes, metrics, configuration surfaces, or references that are only future substrate and do not create observable agent behavior now.
5. Ensure reference and tool triggers are concrete enough to support precise retrieval without loading everything by default.
6. Include validation commands, self-check expectations, fallback behavior, and stop rules when the skill changes code, artifacts, or external state.

Validation:

- The skill is outcome-first, contradiction-free, progressively disclosed, and has explicit validation and stop conditions.
- Every declared command, mode, metric, config knob, and active reference is justified by current runtime behavior, measured evidence, or active guidance.
- The result is reported as author self-check evidence; formal review of real skill capability is routed to skill-reviewer.
- The self-check ends in ready-to-regenerate or blocked with the blocking reason and unresolved inputs.

### Workflow stage: Render the target skill

Produce a standard Agent Skills folder with progressive disclosure.

1. Generate SKILL.md with Start here, applicability, workflow, references, gotchas, and portability sections.
2. Copy active references, assets, runtime files, and supporting docs into their emitted paths.
3. Emit a non-normative compile report under docs/ for traceability.

Validation:

- SKILL.md links every required reference.
- Active instructions and declared assets contain no absolute local dependencies; non-normative historical logs are not portability dependencies.
- CLI success is reported only as schema, structure, drift, reachability, and portability evidence, not behavioral PASS.

## Interop priority

- **defining a new skill's purpose, triggers, and authoring approach:** skill-creator. skill-creator owns initial skill design; skill-source-compiler owns normalization and generation after a structured bundle is chosen.
- **assumptions, change scope, minimal implementation, and verification discipline:** implementation-discipline. implementation-discipline governs how code and skill changes are made; skill-source-compiler supplies the source and generation contract.
- **language and toolchain matters:** the language or toolchain skill. Language semantics, packaging, linting, and testing conventions belong to language and toolchain skills.
- **framework APIs and framework idioms:** the framework skill. Framework-specific APIs, lifecycle rules, and integration patterns belong to framework skills.
- **independent review of skill capability, behavioral reliability, evidence integrity, and final review verdict:** skill-reviewer. skill-source-compiler owns source structure, generation, drift, and local author self-checks; skill-reviewer owns independent stable-snapshot review and behavioral verdicts.

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

**Outputs:** Compiled output path on stdout.; Warning lines on stdout when lint emits warnings.; Exit code 1 without modifying files when the resolved output skill directory already exists.

**Examples:** node scripts/skill-source-compiler.mjs compile <source-dir> --out-dir <independent-skills-dir>

### CLI command: `compile-all`
**Use when:** You need out-of-place packaged copies of multiple source bundles.

**Summary:** Compile direct child directories that contain skill.yaml into distinct paths under an independent output directory.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Sources root directory path.; --out-dir <independent-skills-dir>.

**Outputs:** Count of compiled source bundles on stdout.; One emitted output path per compiled bundle on stdout.; Exit code 1 before writing when two bundles resolve to the same output path.; Exit code 1 before writing when any resolved output skill directory already exists.

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

**Summary:** Verify a compiled skill folder or generated source bundle against generated-file, reachability, structural, drift, and text-portability invariants.

**Runtime script:** `scripts/skill-source-compiler.mjs`

**Inputs:** Skill directory path.

**Outputs:** OK or FAIL status on stdout.; Diagnostic lines on stdout.; Exit code 1 when invariants fail.

**Examples:** node scripts/skill-source-compiler.mjs check <skill-dir>

## Gotchas

- **high** — When a skill ships a utility, look for it under <skill-root>/scripts and invoke it relative to the skill root instead of assuming a global executable is installed.
- **high** — Use regenerate for in-place source-bundle maintenance; use compile or compile-all only with independent output directories.
- **high** — Never compile into an output directory that overlaps the source bundle; the runtime rejects overlap before destructive writes.
- **high** — Compile and compile-all fail closed when a resolved output skill directory already exists. Choose a new output root; do not assume the CLI owns or may replace existing files.
- **high** — Never promote docs/* into active guidance unless the source bundle explicitly marks that content as active.
- **high** — Do not require repository files outside the emitted skill folder to understand or execute the skill.
- **medium** — Do not silently guess through unresolved semantic conflicts; report blocked: unresolved-conflict because the CLI does not perform semantic analysis.
- **medium** — Never present a workflow stage as a runnable command unless the packaged CLI help surface actually exposes it.
- **medium** — Do not create placeholder references for simple source bundles; reference sections are conditional and should exist only when they carry real active guidance.
- **medium** — Do not add placeholder commands, modes, metrics, or config knobs for future flexibility; add them only when the current skill behavior uses and verifies them.

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
Skill instructions should be outcome-first, precise about constraints and completion criteria, explicit about validation and stop rules, and free of contradictory or unnecessarily mechanical process guidance. This compiler stage is an author self-check and does not by itself establish independent behavioral PASS.

### Observable skill surface
Commands, modes, metrics, configuration surfaces, and active references belong in a skill only when they change current agent behavior and have a runtime, measurement, or guidance source that agents can verify.

### CLI evidence boundary
The CLI validates declared schema, structure, generated-file drift, reachability, output safety, and text portability. It does not infer semantic conflicts, prove instruction quality, or establish behavioral PASS.

### Output safety
Default CLI compilation writes only to a new resolved skill directory. Existing targets, source overlap, duplicate targets, and validation failures must stop before the first output write.

### Agent output contract
Report status ready-to-regenerate or blocked, the authoritative inputs and precedence used, emitted paths when writes occurred, checks run with evidence, and unresolved gaps. For blocked status, include the reason and confirm that generated output was not written.

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

- Do not emit absolute local dependencies or machine-specific environment assumptions in active instructions or declared assets; URLs and explicit web-route/example syntax are not filesystem dependencies.
- Do not require external local files outside the skill folder.
- Keep all mandatory templates, scripts, and references inside the emitted skill directory.
- Use only relative links inside the generated skill bundle.

## Portability checklist before finishing

- Search active instructions and declared assets for absolute local dependencies and remove them.
- Confirm every required reference exists inside the emitted skill folder.
- Confirm the copied skill remains understandable in isolation.
- Keep docs/* clearly non-normative unless promoted explicitly by SKILL.md.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/issues/*`
- Supporting glob: `docs/logs/*`

## Final checks

Before finishing:

- verify that every required reference is linked from `SKILL.md`
- verify that supporting docs remain clearly non-normative
- verify instruction quality: outcome-first instructions, no unresolved contradictions, precise reference/tool triggers, validation gates, and stop rules; report `blocked: unresolved-conflict` if this cannot be established
- report this instruction-quality result as an author self-check; route formal independent skill-capability review to skill-reviewer
- verify that copied assets and runtime files are reachable by relative path; include tests in the emitted package only when they are intentionally shipped and independently runnable there
- verify that the generated bundle can be copied to another machine without losing required behavior
- verify that compilation used a new resolved output skill directory and did not replace an existing target
- report CLI results as structural and portability evidence only, never as proof of semantic or behavioral `PASS`
