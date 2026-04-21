---
name: implementation-discipline
description: Behavioral coding discipline for writing, modifying, and reviewing
  code with explicit assumptions, minimal complexity, surgical diffs, and
  verifiable success criteria.
compatibility: Portable documentation-only skill. Use alongside language,
  framework, and review skills; it does not replace domain-specific engineering
  guidance.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: aeded42eecb3d28c730bbf65c611eb67069c4448b1804ebbad8522657db85557
---

# implementation-discipline

## Start here

1. Confirm the task actually includes code changes, refactoring, or code review.
2. State assumptions, constraints, and any ambiguity before changing code.
3. Prefer the simplest sufficient design and define the verification target before implementing.
4. Use this skill together with the relevant language, framework, or review skill; it does not replace them.

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

1. State assumptions that the change relies on.
2. Surface ambiguity instead of silently choosing an interpretation.
3. Define what successful completion will look like in observable terms.

Validation:

- The chosen interpretation is explicit.
- Success can be checked without vague phrases like "should work now".

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
2. If a bug was fixed, confirm the failing behavior is now covered or demonstrably resolved.
3. Report what was verified and what was not verified.

Validation:

- The final report names the checks that passed.
- Any unverified risk is called out explicitly.

## Interop priority

- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill helps shape implementation quality, while code-reviewer owns review process and findings output.

## Gotchas

- **high** — Do not hide uncertainty behind implementation; surface assumptions and ambiguities before coding.
- **high** — Do not add speculative abstractions, configuration, or error handling that the task did not require.
- **high** — Do not broaden the diff with unrelated cleanup or refactoring.
- **medium** — If you cannot verify the intended outcome, say so explicitly instead of implying confidence.

## Policies

### Simplicity-first policy
Default to the smallest implementation that satisfies the request. Extra flexibility is a cost, not a virtue.

### Surgical-diff policy
Every changed line should trace directly to the task; unrelated cleanup belongs in a different change set.

### Evidence-over-intuition policy
Completion requires naming the checks that prove success or the exact gap that remains.

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
