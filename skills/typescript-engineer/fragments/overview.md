Guide TypeScript language, type-system, compiler, and lint decisions to a sound, observable result. The skill is useful only when the agent can explain the type contract, preserve the authorized runtime behavior, and show what the selected compiler and lint commands actually checked.

## Capability and anti-claims

When a TypeScript request is supplied, identify whether the user wants an explanation, a read-only review or diagnosis, or an implementation. Use repository and installed-version evidence to diagnose the root cause, choose the narrowest sound construct, preserve public consumers, and report a verified, partial, or blocked result.

This documentation does not typecheck a project by itself. Compiler or lint success does not prove runtime, framework, validation, security, or domain behavior. A generated config, lower diagnostic count, empty solution program, type assertion, schema type, test double, or supporting log cannot close a broader capability claim.

## Minimum inputs and source precedence

Derive or obtain the expected behavior, repository instructions, installed TypeScript and lint versions, relevant `tsconfig` chain, package or workspace commands, current diagnostics, and affected public call sites or declaration consumers. For toolchain work, also identify the emitter, runtime, bundler, and downstream package consumers that determine module behavior.

Apply authority in this order:

1. explicit user requirements for the authorized task;
2. compatible repository policy and installed project behavior;
3. current official documentation that matches the installed or requested version;
4. portable defaults in this skill.

If equal-authority sources conflict, the requested contract is missing, or the required project graph cannot be exercised, limit the recommendation or report `blocked`. Do not invent the missing behavior.

## Dual-lint contract

For greenfield TypeScript setup or explicitly authorized lint hardening, use both Biome and ESLint with typescript-eslint. Biome owns formatting, fast syntax-oriented checks, and the type-aware rules supported by the installed Biome version. ESLint owns the remaining type-informed and repository-policy rules. Inspect installed versions and assign one owner to overlapping rules so duplicate diagnostics do not obscure the complementary coverage.

In an existing repository, follow its declared commands and policy. Do not add a missing linter during an unrelated TypeScript change. If the required Biome or ESLint contour is unavailable, report the exact gap and do not describe the toolchain as fully verified.

## Completion contract

`verified` requires evidence that the targeted diagnostic or type behavior is correct, no new relevant diagnostics were introduced, the selected command actually covered the affected project or reference graph, and public consumers still satisfy the intended contract. Use `partial` when useful work is complete but a required verification contour is missing; use `blocked` when missing authority or incompatible constraints prevent a sound result.

The final response states:

- the outcome or root cause;
- authoritative inputs and material assumptions;
- the changed or reviewed type/API contract;
- exact typecheck, build-graph, lint, or compile-assertion evidence;
- remaining diagnostics and unverified owner boundaries;
- `verified`, `partial`, or `blocked` status.
