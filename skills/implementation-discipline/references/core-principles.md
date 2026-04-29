# Core principles

Use this reference whenever the task involves writing, changing, or reviewing code.

## Think before coding

- State assumptions explicitly.
- If the request is ambiguous, name the ambiguity instead of silently picking one interpretation.
- If there is a materially simpler implementation, prefer it and say why.

## Simplicity first

- Add only what the task needs.
- Do not introduce single-use abstractions unless they genuinely reduce complexity.
- Do not add configurability, extensibility, or defensive branches for scenarios the task does not require.
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
