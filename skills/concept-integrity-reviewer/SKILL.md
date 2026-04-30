---
name: concept-integrity-reviewer
description: Review feature ideas, backlog items, specifications, plans,
  acceptance criteria, or implementations against a higher-level product or
  system concept. Use when a task may create infrastructure, mocks, metadata,
  wrappers, tests, or documentation that looks like progress but does not
  deliver the claimed observable capability; when separating capability from
  substrate; when checking whether acceptance criteria can be satisfied without
  real behavior; or before implementing complex agent, runtime, platform,
  self-development, cognition, workflow, or product features whose wording may
  drift from the original concept.
compatibility: Portable documentation-only review skill. Use before
  specification, planning, implementation, or closure when concept alignment and
  real capability are more important than local spec compliance.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 6daeb1cd722588064afa84583993167aa5db82647f4e17e2ceda82c82e9e8314
---

# concept-integrity-reviewer

## Start here

1. Confirm the higher-level concept, user capability, product goal, or system behavior the work is supposed to advance.
2. Do not assume the requested task is valid just because it has acceptance criteria.
3. Separate observable behavior from substrate before recommending implementation.
4. If the review finds high fake-risk, recommend rewriting or splitting the task before coding.

## When to use this skill

- Reviewing feature ideas, backlog items, specifications, plans, implementation proposals, acceptance criteria, or closure claims against a concept.
- The task claims a new capability for an agent, runtime, product, platform, cognition loop, self-development path, training/evaluation pipeline, deployment path, workflow, or user-facing behavior.
- The work may be closable with storage, APIs, logs, jobs, wrappers, mocks, metadata, policy records, tests, or documentation without proving real behavior.
- The user asks whether a feature is real, fake, substrate-only, concept-aligned, overclaimed, or likely to create false confidence.
- Before implementation of complex features where agents wrote or heavily shaped the specification or acceptance criteria.

## When NOT to use this skill

- The request is a small mechanical code fix with no claimed product, runtime, or system capability.
- The user only needs implementation-vs-written-spec compliance; use spec-conformance-reviewer instead.
- The user asks for general bug, maintainability, or security review without a higher-level concept claim.
- The work is explicitly labeled as infrastructure-only and the user is not asking whether it advances a concept.

## Workflow stages

### Workflow stage: Fix the concept target

Make the intended capability explicit before evaluating the task.

1. Name the higher-level concept, product goal, or system behavior being tested.
2. State the intended observable capability in user or runtime terms.
3. Identify the actor, trigger, behavior, durable state change, feedback, and recovery expectation when applicable.

Validation:

- The target is an observable capability, not only a component name or implementation layer.
- Missing concept context is called out as a review limitation instead of being invented.

### Workflow stage: Compare the task to the capability

Detect whether the task actually delivers the intended behavior.

1. Summarize what the task, spec, plan, or implementation actually builds.
2. Classify each major output as behavior or substrate.
3. Treat storage, migrations, APIs, wrappers, queues, logs, configs, mocks, test harnesses, evidence files, and documentation as substrate unless they directly enable demonstrated behavior.
4. Identify anti-claims: important things that will still not work after completion.

Validation:

- The review does not call substrate a capability.
- Anti-claims are explicit enough to prevent false confidence.

### Workflow stage: Run the acceptance exploit check

Find whether acceptance criteria can be satisfied without the claimed capability.

1. For each acceptance criterion, ask how an agent could satisfy it with the least real behavior.
2. Mark criteria that can pass through mocks, metadata, tables, logs, wrappers, snapshots, fixtures, documentation, or static tests.
3. Identify the missing observable demonstration that would force the real behavior.

Validation:

- Any exploitable criterion is reported as a specification defect, not as implementation success.
- The review proposes a behavior-level acceptance replacement when possible.

### Workflow stage: Issue a fake-risk verdict

Give a decision that prevents misleading implementation or closure.

1. Assign fake-risk as low, medium, or high.
2. Choose one decision: proceed, rewrite spec, split substrate and capability tasks, downscope wording, or reject as misleading.
3. State the smallest next artifact needed before implementation or closure.

Validation:

- The verdict is based on capability evidence, not task volume or test count.
- The decision says what should happen before more code is written when fake-risk is medium or high.

## Interop priority

- **implementation discipline:** implementation-discipline. Once a concept-aligned implementation target is accepted, implementation-discipline owns minimal diffs, assumptions, verification, and reporting.
- **written specification compliance:** spec-conformance-reviewer. spec-conformance-reviewer checks code against normative written requirements; this skill checks whether those requirements deliver the concept.
- **general code defects:** code-reviewer. code-reviewer owns bugs, regressions, and maintainability findings that do not depend on concept alignment.
- **technical feasibility and domain semantics:** the relevant domain skill. Domain skills own facts about frameworks, runtimes, APIs, security, data, or infrastructure.

## Gotchas

- **high** — A large test suite does not prove a capability if the tests only validate mocks, metadata, persistence, static contracts, or harness behavior.
- **medium** — Do not dismiss substrate as useless; label it honestly and separate it from capability closure.
- **medium** — Do not demand the whole final product from every task. A substrate task is valid when it is explicitly scoped as substrate and does not claim capability completion.
- **high** — If a task can be closed without real behavior, the defect is in the specification or acceptance criteria even if the implementation matches them.

## Policies

### Capability-first policy
A feature claim must be judged by observable behavior the user or runtime can exercise, not by the amount of infrastructure produced.

### Substrate labeling policy
Storage, APIs, jobs, wrappers, logs, policy records, tests, and documentation may be useful, but they must be labeled as substrate unless they are connected to demonstrated behavior.

### Anti-claims policy
Every review of a non-trivial feature must state what remains non-working, unavailable, simulated, manually mediated, or only harness-proven.

### Acceptance integrity policy
Acceptance criteria are defective when they can pass without the claimed capability; propose behavior-level criteria that force the capability to be demonstrated.

## Portability rules

- Do not reference machine-specific paths or external repository state.
- Keep all mandatory concept-integrity-reviewer guidance inside this skill folder.
- Use this skill as a review and planning discipline; it does not prescribe framework-specific implementation techniques.

## Portability checklist before finishing

- Confirm the generated skill has clear triggers for when to apply concept-integrity-reviewer.
- Confirm the fake-risk verdict and decision options are present.
- Confirm no absolute paths appear in the emitted skill.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
