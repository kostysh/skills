---
name: typescript-engineer
description: Use for TypeScript language and type-system work, compiler
  diagnostics, type-safe APIs, tsconfig, and Biome/ESLint configuration. Ground
  explanations, review, diagnosis, and changes in repository and
  installed-version evidence; pair with runtime, framework, testing, validation,
  and domain owners.
metadata:
  source-version: 0.2.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f49fff450f4148b6ea549e90824a957f47fb47bc031c6c071728c797d5ef3947
---

# typescript-engineer

## Start here

1. Classify the request as explain, review/diagnose, or authorized change; review and diagnosis stay read-only unless the user also requests remediation.
2. Establish the expected type or compiler behavior, repository policy, installed TypeScript and lint versions, relevant tsconfig and package or workspace commands, current diagnostics, and affected public call sites before choosing a fix.
3. Apply precedence in this order: explicit user requirements, repository policy and compatible installed behavior, current official version-matched documentation, then this skill's portable defaults; stop when equal-authority inputs conflict.
4. Load only the optional reference triggered by the current problem and keep framework, runtime, testing, validation-library, and domain decisions with their owning skills.
5. Define the evidence boundary before changing code: compiler and lint checks prove only the paths they inspect, not runtime or domain behavior.

## When to use this skill

- Explaining, designing, reviewing, diagnosing, or changing TypeScript language and type-system behavior.
- Resolving compiler diagnostics, unsafe any flow, inference and narrowing failures, overload or generic API behavior, public declaration contracts, and type regressions.
- Configuring TypeScript compiler behavior or coordinating Biome with ESLint plus typescript-eslint for complementary lint coverage.

## When NOT to use this skill

- Framework APIs, component or route behavior, bundler integration, or Vite/React application setup except for the narrowly isolated TypeScript compiler facet.
- Node execution mode, built-in type stripping, ESM or CJS runtime behavior, runtime import extensions, or process behavior; use node-engineer.
- Test strategy, runner configuration, coverage, mocks, or CI contours; use typescript-test-engineer, pairing this skill only for compile-time type assertions.
- Package-manager selection, business or domain modeling policy, validation-library runtime semantics, or application architecture without a TypeScript-specific decision.

## Overview

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

## Workflow stages

### Workflow stage: Establish the TypeScript basis

Make the task, authority, installed behavior, affected contract, and allowed side effects explicit before drawing conclusions.

1. Record explain, review/diagnose, or change mode and whether mutations are authorized.
2. Inspect repository instructions, package and workspace scripts, installed TypeScript and lint versions, relevant tsconfig inheritance or project references, current diagnostics, and affected call sites or declaration consumers.
3. Define the targeted diagnostic or type/API behavior and identify any runtime, framework, test, validation-library, or domain owner that must be paired.
4. If required sources are missing or conflict, provide bounded guidance or report blocked instead of inventing a contract.

Validation:

- The task mode, source precedence, target behavior, verification command, public contract, and mutation boundary are reconstructable.

### Workflow stage: Diagnose and choose the first sound construct

Resolve the root compiler or inference cause without broadening types or importing unnecessary machinery.

1. Trace the first actionable root cause, such as widening, missing constraints, invalid indexing, unsound assertions, incorrect overloads, module-resolution mismatch, or unsafe boundary data.
2. Prefer inference, control-flow narrowing, satisfies, built-in utility types, runtime- or schema-derived types, and constrained generics before bespoke conditional types or helper dependencies.
3. Check public call sites and declaration consumers before tightening or widening an exported type.
4. Keep runtime and domain semantics unchanged unless the user explicitly authorized that separate owner-controlled change.

Validation:

- The proposed result explains why it is sound, what contract changes, and what remains outside the TypeScript claim.

### Workflow stage: Apply only the authorized TypeScript change

Implement the narrowest sound change while preserving repository and owner boundaries.

1. In explain or review/diagnose mode, return the explanation or findings without editing.
2. In change mode, modify only the accepted TypeScript or toolchain scope and avoid broad assertions, implicit any, unowned suppressions, or unrelated dependency and config changes.
3. For a new setup or explicit lint hardening, keep both Biome and ESLint plus typescript-eslint, assign one owner to overlapping rules, and retain ESLint rules that cover installed-version gaps.
4. In an existing project, do not install a missing linter during an unrelated task; report the missing contour as a verification gap unless toolchain changes are authorized.

Validation:

- Every mutation traces to the requested behavior, and dual-lint coverage is either present or honestly reported as incomplete.

### Workflow stage: Verify and report at the claimed boundary

Prove the targeted TypeScript behavior without treating partial or substrate checks as broader completion.

1. Run the repository's relevant typecheck or build-graph command and both configured lint contours; use a local compiler fallback only after confirming it targets the intended files and config.
2. Confirm the targeted diagnostic is resolved or intentionally preserved, no new relevant diagnostics were introduced, and affected call sites or declarations still satisfy the intended contract.
3. Use positive and negative compile assertions for fragile type APIs; route runtime, integration, and test-runner evidence to the owning skill.
4. Report the outcome or root cause, changed type/API contract, exact checks, remaining diagnostics, unverified boundaries, and status as verified, partial, or blocked.

Validation:

- A lower error count, an empty solution program, compiler success, lint success, generated files, or mocks cannot by themselves satisfy completion.

## Interop priority

- **framework APIs, framework lifecycle, bundler integration, React or Vite application setup:** the relevant framework skill. typescript-engineer owns the isolated TypeScript compiler and type-system facet; the framework owner decides framework behavior and integration.
- **Node execution mode, type stripping, ESM or CJS runtime semantics, and runtime import behavior:** node-engineer. node-engineer establishes the runtime contract; typescript-engineer configures TypeScript consistently with that resolved contract.
- **test strategy, runner behavior, mocks, coverage, and CI test contours:** typescript-test-engineer. typescript-engineer owns compile-time type assertions and expected type contracts; typescript-test-engineer owns executable test design and runner policy.
- **runtime validation-library semantics and domain validation policy:** the relevant validation-library, framework, or domain skill. typescript-engineer may derive and inspect types from an accepted runtime schema but cannot invent what must be validated or claim runtime safety from a type alone.
- **formal code-review scope, severity, findings format, and merge guidance:** code-reviewer. typescript-engineer supplies TypeScript domain analysis while code-reviewer owns the formal review verdict and merge-risk synthesis.

## Gotchas

- **high** — Do not run a generic tsc --noEmit fallback until you know which config and files it checks; an empty solution config can return success without traversing referenced projects.
- **high** — Do not treat compiler or lint success as runtime, framework, validation, security, or domain proof.
- **high** — Do not replace a diagnostic with any, a broad assertion, a non-null assertion, or a suppression unless the authority, invariant, and regression evidence justify that exact boundary.
- **high** — Do not assume Biome and ESLint coverage is static; inspect installed versions, assign one owner to overlapping rules, and preserve the complementary contour required by repository policy.
- **medium** — Do not silently tighten an exported type without checking source compatibility, declaration output, and affected consumers.

## Policies

### Source precedence
Explicit user requirements override repository policy only for the authorized task; compatible repository policy and installed behavior override generic defaults. Equal-authority conflicts stop the strongest claim.

### Dual-lint baseline
New TypeScript setup and explicit lint hardening use Biome plus ESLint with typescript-eslint because their coverage is complementary. Existing repositories retain their declared policy; a missing required contour is reported rather than silently treated as equivalent coverage.

### Mutation boundary
Explain and review/diagnose requests are read-only. Change requests authorize only the TypeScript or toolchain scope explicitly requested or necessarily implied by the accepted behavior.

### Evidence and completion
Verified requires the targeted behavior or diagnostic, no new relevant diagnostics, a command that actually covers the affected project graph, and any necessary consumer checks. Partial and blocked states must remain visible.

### Output contract
Report the outcome or root cause, source basis and assumptions, changed type or API contract, exact verification and remaining diagnostics, unverified runtime or owner boundaries, and verified, partial, or blocked status.

## Optional references
- [Generics](references/generics.md) — Read this when designing or diagnosing generics, mapped or conditional types, template literal types, variadic tuples, or reusable type transforms.
- [Monorepo Typechecking](references/monorepo.md) — Read this when the affected TypeScript project uses workspaces, project references, solution configs, composite builds, or shared tsconfig files.
- [Function Overloads](references/overloads.md) — Read this when return types depend on input shape, an overloaded API is wrapped, or overloads must be compared with unions or an options object.
- [Boundary Type Patterns](references/patterns.md) — Read this when modeling typed success/failure states, unknown boundaries, schema-derived types, or branded values without taking over runtime or domain policy.
- [TypeScript Practices](references/practices.md) — Read this when migrating JavaScript, reducing unsafe any or assertions, preserving public type contracts, or handling TypeScript suppression directives.
- [Runtime-Derived Types](references/runtime-derived-types.md) — Read this when deriving literal unions or API types with as const, typeof, indexed access, satisfies, or const type parameters.
- [TypeScript Toolchain](references/toolchain.md) — Read this when changing tsconfig, module or moduleResolution, TypeScript versions, or coordinated Biome and ESLint plus typescript-eslint coverage.
- [Type Debugging](references/type-debugging.md) — Read this when diagnosing compiler errors, inference failures, invalid indexing, assignability, overload resolution, or type-regression evidence.
- [Type System](references/type-system.md) — Read this when the task needs TypeScript type-system fundamentals, narrowing, unions, intersections, interfaces, aliases, satisfies, unknown, or never.

## Portability rules

- Do not reference machine-specific absolute paths or require repository files outside this skill folder to understand core behavior.
- Treat package-manager commands, TypeScript versions, lint versions, tsconfig paths, workspace layout, and CI gates as discovered project context rather than portable constants.
- Use only relative links for optional references and supporting documents inside the skill folder.

## Portability checklist before finishing

- Run skill-source-compiler lint, regenerate, and check after source changes.
- Confirm every optional reference has a precise trigger and is reachable from generated SKILL.md.
- Search the copied skill for absolute paths, stale assets or scripts, and external mandatory dependencies.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
