---
name: implementation-discipline
description: Behavioral coding discipline for writing, modifying, and reviewing
  code with explicit assumptions, project-purpose alignment, minimal complexity,
  surgical diffs, and verifiable success criteria.
compatibility: Portable documentation-only skill. Use alongside language,
  framework, and review skills; it does not replace domain-specific engineering
  guidance.
metadata:
  source-version: 0.1.4
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 70ed8f66f0619b36776b460e65cdcb992c91636f6b7ee14799fa18a6d4ab7bad
---

# implementation-discipline

## Start here

1. Confirm the task actually includes code changes, refactoring, or code review.
2. For non-trivial local work, identify the larger project goal or end-to-end capability the change is supposed to advance before changing or assessing code.
3. State assumptions, constraints, and any blocking ambiguity before changing or assessing code.
4. Prefer the simplest sufficient design and define the verification target before implementing.
5. Use this skill together with the relevant language, framework, or review skill; it does not replace them.

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

Make the implementation target explicit before touching code.

1. For non-trivial local work, identify the larger project goal or end-to-end flow and the role this local change plays in it.
2. State assumptions that the change relies on.
3. Surface ambiguity instead of silently choosing an interpretation; stop and ask when a safe conservative assumption is not available.
4. Define what successful completion will look like in observable terms.

Validation:

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

### Workflow stage: Design the smallest sufficient change

Prevent speculative abstractions and unnecessary surface area.

1. Choose the smallest design that satisfies the request.
2. Reject flexibility, configurability, or abstractions that are not demanded by the task.
3. Prefer adapting existing code over introducing a new layer for one use.

Validation:

- Every new concept in the diff is required by the request.
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
3. If a bug was fixed, confirm the failing behavior is now covered or demonstrably resolved.
4. When repeated independent validation signals point to one defect class, expand verification from the specific symptom to adjacent observable cases before reporting done.
5. If verification cannot run, use the next-best static check or state why no useful check is available.
6. Report the outcome, checks run, checks not run, and remaining risk.

Validation:

- The final report names the checks that passed or explains why they could not run.
- Any unverified risk is called out explicitly.

## Interop priority

- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill helps shape implementation quality, while code-reviewer owns review process and findings output.

## Gotchas

- **high** — Do not hide uncertainty behind implementation; surface assumptions and ambiguities before coding.
- **high** — Do not add speculative abstractions, configuration, or error handling that the task did not require.
- **high** — Do not broaden the diff with unrelated cleanup or refactoring.
- **medium** — If you cannot verify the intended outcome, say so explicitly instead of implying confidence.
- **medium** — If the next change would depend on guessing through blocking ambiguity, stop and ask before editing.
- **high** — Do not treat acceptance criteria as sufficient when they can be satisfied by mocks, metadata, tables, logs, wrappers, or documentation without the claimed behavior.
- **high** — Do not treat local correctness as sufficient when the change does not advance, or actively conflicts with, the intended project capability.

## Policies

### Project-purpose fit policy
Local implementation correctness is insufficient when the work fails to advance the intended project capability. For non-trivial work, state the larger goal or end-to-end flow, the local role, and any purpose assumptions before coding.

### Simplicity-first policy
Default to the smallest implementation that satisfies the request. Extra flexibility is a cost, not a virtue.

### Surgical-diff policy
Every changed line should trace directly to the task; unrelated cleanup belongs in a different change set.

### Evidence-over-intuition policy
Completion requires naming the checks that prove success or the exact gap that remains.

### Capability reality policy
A feature is not complete unless it creates or preserves an observable capability. Infrastructure may be valuable, but it must be labeled as infrastructure.

### Reporting contract
Final reports must name the completed outcome, verification evidence, and any unverified risk. For non-trivial work, also state whether the result advances the intended project capability or remains support-only; when another active review skill defines a stricter format, follow that format while preserving the same evidence.

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
