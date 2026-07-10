---
name: implementation-discipline
description: Behavioral coding discipline for writing, modifying, and reviewing
  code with explicit assumptions, project-purpose alignment, minimal complexity,
  surgical diffs, and verifiable success criteria.
compatibility: Portable documentation-only skill. Use alongside language,
  framework, and review skills; it does not replace domain-specific engineering
  guidance.
metadata:
  source-version: 0.1.8
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 3ca5a49f2887c5eeaefb6d9b00987730df4ef63169392e259896987b384ed7d9
---

# implementation-discipline

## Start here

1. Confirm the task actually includes code changes, refactoring, or code review.
2. Classify the task as implementation/remediation or review-only, and confirm whether code changes are authorized before selecting workflow stages.
3. For non-trivial local work, identify the larger project goal or end-to-end capability the change is supposed to advance before changing or assessing code.
4. State assumptions, constraints, and any blocking ambiguity before changing or assessing code.
5. When implementing from an accepted audit or review report, create a remediation matrix before claiming completion.
6. Prefer the first sufficient design rung and define the verification target before implementing.
7. Use this skill together with the relevant language, framework, or review skill; it does not replace them.

## When to use this skill

- Implement new code with minimal complexity and explicit verification.
- Modify existing code where overreach or speculative refactoring is a risk.
- Review code when you need to check for unnecessary complexity or weak success criteria.

## When NOT to use this skill

- The task is purely non-code documentation or analysis.
- The task depends entirely on domain rules owned by another skill and no code is being changed.
- The requested change is intentionally exploratory architecture work rather than implementation.

## Workflow stages

### Workflow stage: Clarify the task and the target

Make the task mode, mutation authority, and target explicit before changing or assessing code.

1. Classify the task as implementation/remediation or review-only and determine whether the request authorizes code changes.
2. For review-only requests, do not change code; use the clarification, capability, and evidence lenses, route formal findings and output to `code-reviewer`, and skip the design and implementation stages unless remediation is explicitly requested.
3. For non-trivial local work, identify the larger project goal or end-to-end flow and the role this local change plays in it.
4. State assumptions that the change relies on.
5. Surface ambiguity instead of silently choosing an interpretation; stop and ask when a safe conservative assumption is not available.
6. Define what successful completion will look like in observable terms.

Validation:

- The task mode and mutation authority are explicit.
- Review-only work has no code mutations and does not enter design or implementation stages.
- Non-trivial local work is tied to a project goal or end-to-end flow, or explicitly labeled as purpose-uncertain or support-only.
- The chosen interpretation is explicit.
- Any blocking ambiguity has either a stated conservative assumption or an explicit ask.
- Success can be checked without vague phrases like "should work now".

### Workflow stage: Run a capability reality checkpoint

Prevent implementation work from turning a claimed capability into substrate-only progress without saying so.

1. For feature, runtime, product, agent, or system-capability changes, state the observable behavior the system should have after the work.
2. Separate real behavior from substrate such as storage, APIs, jobs, wrappers, logs, config, migrations, tests, or documentation.
3. State anti-claims: what the change will still not make possible after it is complete.
4. Check whether the narrow task framing advances, ignores, or conflicts with the stated project purpose; call out misleading framing before implementation.
5. Check whether the acceptance criteria can be satisfied without delivering the observable behavior.
6. If the acceptance criteria can pass through substrate-only work, call that a specification defect before implementation and either narrow the claim or ask to rewrite the spec.

Validation:

- The implementation target is an observable behavior or is explicitly labeled as substrate-only.
- Any substrate-only result is not described as a completed capability.
- The final report states important behavior that remains non-working.

### Workflow stage: Convert accepted audit reports into a remediation matrix

Keep audit remediation tied to concrete behavior, evidence, and explicit status.

1. For each accepted finding or recommendation, map `finding/recommendation -> concrete change -> test/evidence -> status`.
2. Use only these statuses unless the project defines stricter equivalents: `implemented`, `verified`, `blocked-by-compatibility`, `deferred-by-trigger`, and `not-applicable`.
3. For `deferred-by-trigger`, name the shortcut ceiling, revisit trigger, and evidence needed when the trigger occurs.
4. Tie the final remediation claim to the matrix statuses: claim that all applicable findings are fixed and verified only when every applicable finding is `verified`.
5. Report `not-applicable` entries separately as justified exclusions, not as fixes; classify unresolved remediation deterministically: any `blocked-by-compatibility` makes the overall result blocked and incomplete, otherwise any `deferred-by-trigger` makes it partial and deferred, otherwise any `implemented` makes it implemented but unverified.
6. Do not mark tooling, wrappers, metadata, config, migrations, tests, docs, or other substrate as runtime capability unless observable behavior and acceptance evidence prove it.
7. If a recommendation is only substrate, label it as substrate and state which behavior remains unverified.

Validation:

- Every accepted finding or recommendation has a mapped change or a justified non-implementation status.
- `verified` entries name concrete evidence.
- `deferred-by-trigger` entries name a concrete trigger instead of vague later work.
- The overall completion claim follows the unresolved-status precedence: blocked, then deferred, then implemented but unverified.
- A full fixed-and-verified claim has only `verified` applicable findings, with any `not-applicable` entries identified separately.
- Substrate-only entries are not reported as delivered runtime capability.

### Workflow stage: Design the smallest sufficient change

Prevent speculative abstractions and unnecessary surface area.

1. Choose the first sufficient rung that satisfies the request or preserves the intended capability.
2. Check rungs in order: do not build it when the need is speculative; use language/runtime standard features; use native platform or existing project features; use an already-installed dependency; then write the smallest code that works.
3. Reject flexibility, configurability, or abstractions that are not demanded by the task.
4. Prefer adapting existing code over introducing a new layer for one use.
5. Add a new dependency, factory, interface, provider, config knob, or wrapper only when the simpler rung fails for a concrete reason.

Validation:

- Every new concept in the diff is required by the request.
- The chosen rung is explicit when the change adds a dependency, abstraction, layer, or new surface.
- A simpler design was considered and rejected for a concrete reason.

### Workflow stage: Implement surgically

Keep the diff local, traceable, and easy to review.

1. Change only the code needed for the request.
2. Match existing local style and structure unless the task explicitly requires broader cleanup.
3. Remove only the dead code or imports created by your own change.

Validation:

- Each changed hunk traces directly to the requested outcome.
- Unrelated cleanup or refactoring is absent from the diff.

### Workflow stage: Verify and report with evidence

Close the loop with concrete checks instead of intuition.

1. Run the narrowest meaningful checks that prove the change.
2. Prefer existing local test, lint, typecheck, build, or smoke-test commands when they are the narrowest meaningful proof.
3. For low-risk non-trivial logic such as a branch, loop, parser, or formatting rule, leave the smallest runnable check that would fail if the behavior regresses.
4. For security, privacy, money, data-loss, auth, accessibility, release, or production-wiring paths, use the stronger project/domain verification instead of a minimal self-check.
5. If a bug was fixed, confirm the failing behavior is now covered or demonstrably resolved.
6. When repeated independent validation signals point to one defect class, expand verification from the specific symptom to adjacent observable cases before reporting done.
7. If verification cannot run, use the next-best static check or state why no useful check is available.
8. Report the outcome, checks run, checks not run, and remaining risk.

Validation:

- The final report names the checks that passed or explains why they could not run.
- Any unverified risk is called out explicitly.

## Interop priority

- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill keeps review-only work read-only and shapes implementation quality, while code-reviewer owns review process and findings output; remediation starts only when the request explicitly authorizes changes.

## Gotchas

- **high** — Do not hide uncertainty behind implementation; surface assumptions and ambiguities before coding.
- **high** — Do not add speculative abstractions, configuration, or error handling that the task did not require.
- **high** — Do not add a dependency, layer, factory, interface, provider, wrapper, or config surface until standard, native, existing-project, or inline options have been checked and found insufficient.
- **high** — Do not broaden the diff with unrelated cleanup or refactoring.
- **medium** — If you cannot verify the intended outcome, say so explicitly instead of implying confidence.
- **high** — Do not hand off non-trivial work from a moving diff. Stabilize the changed scope, run the relevant verification, and label any remaining claim as implemented but not verified.
- **medium** — If the next change would depend on guessing through blocking ambiguity, stop and ask before editing.
- **high** — Do not treat acceptance criteria as sufficient when they can be satisfied by mocks, metadata, tables, logs, wrappers, or documentation without the claimed behavior.
- **high** — Do not treat local correctness as sufficient when the change does not advance, or actively conflicts with, the intended project capability.
- **high** — Do not collapse accepted audit findings into a vague done list; keep finding, change, evidence, and status linked.
- **high** — Do not report a complete remediation merely because every matrix row has a status; classify unresolved remediation as blocked when compatibility blockers exist, otherwise deferred when trigger deferrals exist, otherwise implemented but unverified.
- **high** — Do not change code during review-only work; enter design and implementation stages only after the request explicitly authorizes remediation.
- **high** — Do not leave deliberate shortcuts or deferrals without a named ceiling and concrete revisit trigger.

## Policies

### Project-purpose fit policy
Local implementation correctness is insufficient when the work fails to advance the intended project capability. For non-trivial work, state the larger goal or end-to-end flow, the local role, and any purpose assumptions before coding.

### Simplicity-first policy
Default to the first sufficient implementation rung that satisfies the request. Extra flexibility is a cost, not a virtue.

### First sufficient rung policy
Before adding code, layers, dependencies, configurability, or documentation, check whether the work can be skipped, handled by language/runtime standard features, handled by native platform or existing project features, handled by an already-installed dependency, or implemented inline with less surface area.

### Surgical-diff policy
Every changed line should trace directly to the task; unrelated cleanup belongs in a different change set.

### Evidence-over-intuition policy
Completion requires naming the checks that prove success or the exact gap that remains.

### Operator-not-QA policy
Operator feedback is not the primary verification mechanism. For UI, API, data, security, or delivery-flow work, produce current tool evidence before asking for approval; user screenshots may reveal defects but must not replace agent-side checks.

### Deferred shortcut policy
A deliberate simplification is acceptable only when the final report or remediation matrix names its ceiling, the trigger that requires revisiting it, and the evidence needed before upgrading it.

### Capability reality policy
A feature is not complete unless it creates or preserves an observable capability. Infrastructure may be valuable, but it must be labeled as infrastructure. Tooling and substrate are not runtime capability without observable behavior and acceptance evidence.

### Review-only boundary policy
A request to review, assess, or diagnose code does not authorize code changes. Keep review-only work read-only, use code-reviewer for formal findings and output, and begin remediation only after explicit change authority is present.

### Reporting contract
Final reports must name the completed outcome, verification evidence, and any unverified risk. Review-only reports must not imply remediation or mutations; remediation reports must classify unresolved status as blocked before deferred before implemented-but-unverified, reserve full fixed-and-verified claims for `verified` applicable findings, and list `not-applicable` entries separately. For non-trivial work, also state whether the result advances the intended project capability or remains support-only; when another active review skill defines a stricter format, follow that format while preserving the same evidence.

## Required active references
- [Core principles](references/core-principles.md) — Read this first when the task involves writing, changing, or reviewing code.
- [Verification loop](references/verification-loop.md) — Read this before implementing multi-step changes or deciding how to verify success.

## Portability rules

- Do not reference machine-specific paths or external repository state.
- Keep all required implementation-discipline guidance inside this skill folder.
- Treat examples as behavioral patterns, not as framework-specific rules.

## Portability checklist before finishing

- Confirm the generated SKILL links both required references.
- Confirm no absolute paths appear in the emitted skill.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
