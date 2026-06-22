# Complexity-only review

Use this reference only when the user explicitly asks for over-engineering, simplification, unnecessary dependency, dead flexibility, or deletion review.

This is a bounded review mode. It complements normal merge-risk review; it does not replace correctness, security, performance, accessibility, release, or specification review.

## Scope

Report only unnecessary complexity:

- code or files that can be deleted without losing required behavior;
- hand-rolled logic that a language/runtime standard feature already provides;
- dependency use that a native platform feature or already-installed project tool covers;
- abstractions with one real implementation or one caller when no boundary requires them;
- wrappers that only delegate;
- config, flags, modes, or extension points nobody can currently exercise;
- longer code that can be replaced by a shorter equally correct form.

Do not report:

- trust-boundary validation;
- auth, security, privacy, accessibility, migration, release, or data-loss safeguards;
- compatibility shims with a current consumer;
- test seams, plugin/API contracts, or architecture boundaries that protect a real behavior;
- the smallest runnable check that proves non-trivial behavior.

## Tags

Use these tags exactly:

| Tag | Use for | Replacement requirement |
| --- | --- | --- |
| `delete` | dead code, unused flexibility, speculative features | say "nothing" or name the owner task where it belongs |
| `stdlib` | hand-rolled language/runtime feature | name the standard function/API |
| `native` | code or dependency replaced by platform/browser/DB/OS feature | name the native feature |
| `yagni` | abstraction, config, or extension point without current need | inline, remove, or defer by trigger |
| `shrink` | same behavior with fewer moving parts | show the shorter shape |

## Evidence rules

- Read the relevant diff or scope before reporting.
- Verify each finding against current usage, call sites, tests, and project conventions.
- A finding must name the exact removal or replacement path.
- If the simpler replacement would change behavior, do not report it unless that behavior is unneeded by the reviewed scope.
- If evidence is not strong enough, use an open question instead of a finding.

## Output

For a diff:

```text
<file>:L<line>: <tag>: <what to cut>. <replacement>.
```

For a repository or broad scope:

```text
<tag>: <what to cut>. <replacement>. [<path>]
```

Rank broad findings by biggest safe simplification first. End only this bounded report with:

```text
net: -<N> lines possible, -<M> deps possible.
```

If there is nothing to cut:

```text
Lean already for the reviewed scope.
```

Do not use line-count net as severity in a normal merge-risk review.
