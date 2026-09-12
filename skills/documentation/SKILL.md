---
name: documentation
description: Create, review, restructure, and rewrite source-grounded technical
  documentation with Diataxis. Use for tutorials, how-to guides, reference,
  explanations, docs architecture, and audits of user-need fit, factual support,
  task completion, and maintainability.
metadata:
  source-version: 0.2.2
  tags: documentation, technical-writing, diataxis, tutorials, how-to, reference,
    explanation
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: a87cfb73f3ec493e5de69127714d570b77bedc92e9f02dc377f388ca213150ca
---

# documentation

## Start here

1. Name the task mode as author, rewrite, review, or restructure, and confirm whether file changes are authorized.
2. Identify the audience and user job, target product version or state, language, format, location, and repository conventions.
3. Inspect the authoritative product sources and current interfaces needed to support factual or executable claims.
4. Select the primary Diataxis form or identify a coordinating overview or navigation role; load the optional guide only when its trigger matches.
5. Define the evidence required for the strongest honest outcome status before drafting or editing.

## When to use this skill

- Create or rewrite source-grounded technical documentation.
- Choose between tutorial, how-to guide, reference, and explanation.
- Review documentation for user-need fit, factual support, task completion, structure, and maintainability.
- Split mixed-purpose pages or improve documentation information architecture.
- Plan or perform a bounded documentation-corpus restructure around user needs.

## When NOT to use this skill

- Marketing copy, landing pages, or brand messaging.
- Defining or changing product requirements, implementation behavior, architecture decisions, or delivery decomposition; route by the decision being made, not the document title.
- Changelogs, release notes, incident reports, or status updates.
- Pure technical correctness work where no documentation deliverable or review is requested.
- File-format or visual-layout work whose primary problem is DOCX, PDF, or rendered-page fidelity.

## Overview

Use this skill to create documentation that fits a real user need and remains
honest about what its sources and checks establish.

Diataxis governs documentation form, flow, and information architecture. It
does not replace technical authority or verification against the product.

Read [references/diataxis-guide.md](references/diataxis-guide.md) only when form
selection is ambiguous, mixed content needs a substantial rewrite, a tutorial
or how-to needs detailed design, or corpus and multi-audience information
architecture is in scope.

## Capability boundary

- Capability: produce an actionable document, review, or restructure handoff
  for a named reader and target state, with claims and completion status matched
  to current evidence.
- Anti-claim: a correct Diataxis category, polished prose, Markdown lint, link
  check, generated site, or docs build does not prove factual or executable
  correctness by itself.
- Use safe editorial assumptions for presentation details only. Never assume
  product behavior, commands, defaults, permissions, errors, version support,
  or rationale.

## Diataxis compass

Ask two questions: does the content inform action or cognition, and does it
support acquisition/study or application/work?

| Primary need | Mode | Form |
| --- | --- | --- |
| Learn through a guided practical experience | Action + acquisition/study | Tutorial |
| Accomplish a real task or solve a problem | Action + application/work | How-to guide |
| Look up facts about an interface or system | Cognition + application/work | Reference |
| Build a mental model or understand why | Cognition + acquisition/study | Explanation |

Use the compass as a course-correction tool, not as a four-folder mandate.

## Form contracts

### Tutorial

- Own the learner's successful experience from meaningful starting point to
  visible result.
- Use one reliable path, small steps, expected outcomes, and prompts to notice
  important effects.
- Minimize alternatives and explanation that interrupt the learning flow.

A tutorial remains `draft` when its safe end-to-end path or material expected
results have not been checked for the target environment.

### How-to guide

- Start from a real user goal, not from a tour of a tool or feature.
- Assume relevant baseline competence and keep actions focused on the outcome.
- Include branches and judgment only where the real problem requires them.

A how-to remains `draft` when its main executable path, material conditions, or
commands have not been checked against the target version.

### Reference

- Mirror the authoritative product, API, command, schema, or interface surface.
- Use consistent entries for signatures, defaults, constraints, errors, and
  short illustrative examples.
- Keep recommendations and rationale in a how-to guide or explanation.

Reference completeness is scoped to a named contract surface. Do not call it
complete because its entries are internally consistent.

### Explanation

- Bound the topic and connect concepts, constraints, history, rationale,
  alternatives, and trade-offs.
- Separate sourced facts and accepted decisions from author interpretation.
- Do not turn the page into setup instructions or exhaustive interface lookup.

An explanation can be structurally strong while remaining `draft` if its facts
or attributed rationale cannot be traced to an accepted source.

## Mixed content and information architecture

- Give each document or bounded section a primary user need.
- Split content when mixed forms disrupt the reader's task; otherwise use a
  clear supporting section or link rather than chasing theoretical purity.
- Allow landing and navigation pages to coordinate several forms as overviews.
- For corpus work, improve the smallest useful page or cluster first. Preserve
  discoverability and identify URL, navigation, link, and redirect effects
  before moving material.
- Let audience and product use shape complex hierarchies; do not assume that
  every documentation set needs four top-level directories.

## Review order

1. Unsupported, inaccurate, unsafe, or unusable claims.
2. Mismatch between the reader's need and the document's promise or form.
3. Missing prerequisites, outcomes, navigation, or companion material.
4. Language, consistency, scanning, and style.

Keep review findings separate from edits unless remediation is explicitly
authorized.

## Workflow stages

### Workflow stage: Establish the documentation basis

Prevent polished prose from inventing product truth or exceeding the evidence available for the target version.

1. Record the task mode, mutation authority, downstream reader or maintainer, requested artifact, and target version or product state.
2. Treat operator and repository instructions as output constraints; use accepted product, specification, and architecture sources for intended behavior and current code, CLI, API, schema, or runtime contracts for shipped behavior.
3. Treat existing documentation and examples as candidate material, not as authority when stronger sources are available.
4. Resolve intended-versus-shipped differences by the named target state; do not silently choose through an unresolved source conflict.
5. If sources are insufficient, limit the result to structure-reviewed or draft and avoid introducing new factual claims; stop as blocked when the requested artifact cannot be produced safely without an owner decision.

Validation:

- Audience, user job, target state, source authority, and allowed side effects are explicit.
- Technical facts and product decisions are sourced or withheld; any editorial assumptions are labeled and cannot supply missing product truth.

### Workflow stage: Shape the smallest useful documentation change

Match the user's need without forcing a four-folder taxonomy or redesigning the corpus unnecessarily.

1. Use the Diataxis compass to select one primary need and form for the requested document or section, unless its explicit role is to coordinate or navigate several forms.
2. Split or link mixed material only when doing so improves the reader's task; allow overview and navigation pages to coordinate several forms without pretending to be one of them.
3. For corpus work, begin with the smallest valuable page or cluster and account for audience, discoverability, existing URLs, navigation, and companion content before proposing moves.
4. Preserve established terminology, voice, language, formatting, and site conventions unless the task explicitly changes them.

Validation:

- Form or coordinating role, scope, and proposed structure trace to a reader need rather than to empty Diataxis buckets.
- The change has no speculative pages, categories, redirects, or platform work.

### Workflow stage: Produce the requested deliverable

Deliver an actionable document, review, or restructure handoff without crossing product or platform ownership.

1. In author or rewrite mode, create the requested artifact and keep factual, procedural, and version claims traceable to the established basis.
2. In review mode, remain read-only unless remediation was also authorized; lead with inaccurate or unusable behavior, then user-need and structure mismatches, then style.
3. In restructure mode, provide or apply a keep, rewrite, split, move, and retire map with link, navigation, URL, and redirect implications proportional to the requested scope.
4. Route only the decision or evidence needed by this task to its owner in Interop priority; pass the reader goal, target state, accepted sources, exact question, and existing evidence. Consume the returned decision or result only within its stated scope and version.
5. Load a neighboring skill only when that dependency applies and it is available. If unavailable, continue content work supported by accepted facts and direct checks; name the missing decision or unperformed specialist assessment, withhold dependent claims, and use the existing documentation status contract. Ordinary documentation does not require a specialist gate; unresolved product decisions still require their established owner.

Validation:

- The downstream reader or maintainer can use the result without inventing facts, scope, destination, or follow-up ownership.
- Review-only work has not changed files, and authoring work has not silently changed product behavior.

### Workflow stage: Verify proportionately and report an honest status

Match the completion claim to current semantic, factual, executable, and publication evidence.

1. Trace factual claims to authoritative sources and check terminology, language, prerequisites, examples, and expected results against the target version.
2. For executable CLI or Node/TypeScript documentation, match the handoff to the exact target version and executed artifact, runtime and platform, commands and flags, prerequisites, stdout/stderr, exit codes, and observed success/error evidence as applicable. For packaged CLI instructions, identify the package and installed bin. Use source or typecheck evidence only for its boundary; a source-tree run cannot verify instructions for an untested installed artifact.
3. For tutorials, safely walk the path end to end when possible; for how-to guides, check the main executable path and material branches; for reference, compare the scoped entries with the authoritative contract; for explanation, check factual claims and attributed rationale.
4. For moved or published content, run available link, navigation, route, and docs-build checks; treat formatting, lint, file presence, and build success as structural evidence only.
5. Do not execute destructive, production, privileged, or externally visible operations solely to validate documentation without authority; use a safe environment or static evidence and report the gap.
6. Report structure-reviewed for a structure-only review, draft when material functional checks are missing, verified only when all applicable checks for the requested documentation boundary pass, or blocked when an unresolved authority gap prevents safe delivery.

Validation:

- The final report names mode, form or coordinating role, audience, artifact or findings, sources and assumptions, checks run and not run, status, and unresolved gaps.
- Diataxis fit, prose quality, lint, generated files, or a green docs build alone cannot establish verified documentation.

## Interop priority

- **unresolved product scope or acceptance, implementation behavior, and architecture boundaries or trade-offs:** prd-engineer for product decisions; spec-engineer for implementation contracts; architecture-engineer for architecture decisions. Pass the accepted source and exact unresolved decision; consume the owner's decision and applicability as factual authority. A document title such as RFC does not select its owner. documentation may improve presentation but cannot invent the decision or its approval.
- **decomposition into implementation tasks, dependencies, and sequencing:** delivery-planner. Pass accepted product, specification, and architecture sources plus requested scope; consume their traced task and handoff results. Documentation structure is local work; delivery decomposition must not manufacture scope from an editorial outline.
- **executable CLI, Node.js, or TypeScript instructions needing technical diagnosis or verification:** cli-engineer for public commands and installed-bin behavior; node-engineer for runtime/version execution; typescript-engineer for compiler/type contracts. Supply the exact failing example and target artifact; consume the versioned command, runtime, or compiler result with raw evidence and limits using the executable-documentation check above. Do not turn a typecheck into runtime proof or change product code under documentation-only authority.
- **test design or runner diagnosis, formal code review, or security assessment required by the task:** typescript-test-engineer, code-reviewer, or security-reviewer for the respective decision. Pass the documented behavior, exact snapshot, observed failure and requested check; consume test results and coverage limits, scoped code findings, or exploitability findings respectively. Preserve each owner's verdict and read-only boundary; ordinary prose edits do not trigger these assessments.
- **authorized Git operations or GitHub resource inspection and publication:** git-engineer for history and refs; gh-utility for GitHub operations and fresh platform state. Pass exact repository, paths, refs or resource identity and existing action authority; consume verified ref/OID or resource/check readback. Writing documentation does not authorize commit, push, PR publication, or merge; unavailable publication evidence leaves that boundary unverified.
- **framework, API, security, data, operational, and other specialized technical facts:** The relevant domain or framework skill and accepted project sources. documentation owns reader fit and form while domain owners establish technical correctness.
- **Docusaurus config, routes, sidebars, MDX mechanics, search, build, deployment, and redirects:** docusaurus-repo. documentation owns content information architecture; docusaurus-repo owns platform implementation and publication mechanics.
- **DOCX or PDF generation, editing, rendering, pagination, and visual-layout fidelity:** An available skill discovered in the current catalog by its DOCX or PDF capability. Pass content, audience, required format and layout constraints; consume the artifact and render-check results. documentation owns content intent and form. If no format capability is available, complete supported content work and report rendering unverified; do not claim a verified rendered artifact.
- **whether documentation or other artifacts prove a broader delivered product or system capability:** concept-conformance-reviewer. documentation can describe or support a capability but does not independently prove that runtime behavior exists.

## Gotchas

- **high** — Diataxis can improve fit, flow, and information architecture, but it does not establish accuracy, completeness, consistency, or executable correctness.
- **high** — Do not turn missing product behavior, version, defaults, commands, errors, or rationale into a writing assumption.
- **high** — Formatting, lint, generated pages, link checks, and a green docs build are useful evidence but cannot by themselves verify the documented behavior.
- **medium** — Do not create empty tutorial, how-to, reference, and explanation trees or initiate a corpus-wide reorganization merely to mirror the Diataxis diagram.
- **high** — Do not draft persistent project prose in the wrong language with the intent to translate it later; select the audience and language before the first draft.

## Policies

### Source-authority policy
Select the target version or product state before resolving sources; use the owner of intended behavior for planned-state claims, current interfaces for shipped-state claims, and stop rather than silently reconcile unresolved conflicts.

### Side-effect policy
Review mode is read-only by default, and documentation validation does not authorize destructive, privileged, production, or externally visible operations.

### Status contract
Report structure-reviewed, draft, verified, or blocked for the requested documentation boundary; never let one checked dimension imply that all dimensions passed.

### Language preflight policy
Before creating persistent documentation, identify the audience and repository language rule; final language review is verification, not the primary drafting workflow.

## Optional references
- [Diataxis Guide](references/diataxis-guide.md) — Read this when form selection is ambiguous, mixed content needs a rewrite, a tutorial or how-to needs detailed design, or corpus and multi-audience information architecture is in scope.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory documentation guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.
- Treat external methodology links as optional provenance, never as a runtime dependency.

## Portability checklist before finishing

- Only when changing or packaging this skill itself, run the owning skill-source-compiler lint, regenerate, and check workflow as applicable; inspect active dependencies and reference reachability, then compile to an isolated directory and read back the copied package's authority, evidence, status, and interop contracts. These maintenance checks are not prerequisites for ordinary documentation work; compiler availability does not determine a document's review status.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
