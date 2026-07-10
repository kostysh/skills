# Core principles

Use this reference whenever the task involves writing, changing, or reviewing code.

## Think before coding

- Classify the request as implementation/remediation or review-only before selecting workflow stages.
- Treat review, assessment, and diagnosis as read-only unless the request explicitly authorizes code changes; use `code-reviewer` when formal code-review findings and output are requested.
- For non-trivial local work, name the larger project goal or end-to-end capability the change is supposed to advance.
- State the role this local change plays in that larger flow, and call out purpose assumptions when the role is inferred.
- State assumptions explicitly.
- If the request is ambiguous, name the ambiguity instead of silently picking one interpretation.
- If there is a materially simpler implementation, prefer it and say why.
- If the narrow task framing does not advance or conflicts with the intended project capability, say so before coding.

## Simplicity first

- Add only what the task needs.
- Stop at the first sufficient rung: skip speculative work; use language/runtime standard features; use native platform or existing project features; use an already-installed dependency; then write the smallest code that works.
- Do not introduce single-use abstractions unless they genuinely reduce complexity or protect a real boundary such as security, compatibility, a test seam, or a plugin/API contract.
- Do not add configurability, extensibility, or defensive branches for scenarios the task does not require.
- Do not add dependencies, factories, providers, wrappers, or config knobs without a concrete reason the simpler rung fails.
- If the solution feels larger than the problem, simplify it before proceeding.

## Surgical changes

- Touch only the code needed for the request.
- Match the local style and structure unless the task explicitly asks for a broader refactor.
- Do not opportunistically clean up adjacent code.
- Remove only the dead code or imports that your own change made obsolete.

## Visible reasoning

- Do not hide confusion or weak assumptions inside code.
- If the implementation depends on a risky assumption, call it out before or alongside the change.
- If the task asks for one thing but the safest solution is different, explain the tradeoff directly.
