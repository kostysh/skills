---
name: typescript-engineer
description: "Professional TypeScript development skill focused purely on the
  language, type system, and type-safe debugging. Covers type inference,
  generics, mapped/conditional/template literal types, type guards, overloads,
  branded types, removing `any`, diagnosing compiler errors, validation with
  Zod, and modern toolchain configuration (tsconfig, ESLint, Biome, pnpm).
  Framework-agnostic: no React, NestJS, or other framework-specific content."
metadata:
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 04533a04c8d0a242fba1244a25e4eb69afdd6eafea2fd9074ee872fe079399e9
---

# typescript-engineer

## Start here

1. Confirm the work is TypeScript language, type-system, type-safe debugging, or TypeScript toolchain work.
2. Run the existing typecheck command before non-trivial typing changes, or use pnpm tsc --noEmit when no wrapper exists.
3. Identify the root compiler or inference cause before patching symptoms.
4. Prefer TypeScript inference, narrowing, `satisfies`, built-in utility types, runtime-derived types, and schema-derived types before bespoke type machinery or new helper dependencies.
5. Use the narrowest sound type fix and rerun typecheck after changes.

## When to use this skill

- Writing type-safe TypeScript code in any project.
- Designing generics, mapped types, conditional types, overloads, type guards, branded types, or runtime-derived types.
- Resolving compiler errors, removing any, configuring tsconfig, ESLint, Biome, pnpm, or Zod validation.

## When NOT to use this skill

- React-specific patterns, hooks, routing, or UI behavior.
- Backend framework patterns that belong to a framework skill.
- Frontend design or UI implementation guidance.

## Overview

Professional TypeScript development - language and type system only, no frameworks.

## Scope
Applies to TypeScript language features, type system design, and toolchain configuration. Avoid framework-specific guidance.
## Interop (Priority)
- When paired with a framework skill (e.g. `react-spa-engineer`), this skill provides the baseline for TypeScript language/toolchain rules.
- Defer framework-specific patterns (React, routing, hooks, UI) to the framework skill.
- If rules conflict, follow this skill for TypeScript/toolchain and the framework skill for framework APIs.

## Non-negotiables (baseline)
- For non-trivial typing work, run the repo's typecheck command first; if none exists, use `pnpm tsc --noEmit`. Re-run it after changes.
- Keep tests and type checks deterministic; do not rely on implicit `any` or unsafe assertions.
- Replace `any` deliberately: prefer `unknown`, constrained generics, discriminated unions, overloads, or schema-derived types.
- Use the first sufficient TypeScript construct: inference, narrowing, `satisfies`, built-in utility types, runtime-derived types, and schema-derived types come before bespoke conditional/mapped machinery or helper dependencies.
- Use both Biome and ESLint: Biome for formatting and baseline lint, ESLint for type-aware rules.
- Use `@ts-expect-error` with a short justification; do not use `@ts-ignore`.
- For fragile type-level behavior, add type tests or negative compile assertions.
- For testing guidance, use the `typescript-test-engineer` skill.

## When Invoked
1. Run the existing typecheck command, or `pnpm tsc --noEmit` if the repo has no wrapper script, to capture the full error set before changing types.
2. Identify the root cause before patching symptoms: widened literals, missing constraints, invalid indexing, overload mismatch, unsafe `any`, or unsound assertions.
3. Check whether inference, narrowing, `satisfies`, built-in utility types, runtime-derived types, or schema inference solves the problem before adding bespoke type helpers.
4. Prefer the narrowest sound fix: constraints, narrowing, `satisfies`, runtime-derived types, overloads, or schema inference instead of widening everything to `string`, `object`, or `any`.
5. Validate call sites and IntelliSense after the fix. For tricky type-level APIs, add type tests or negative assertions to lock behavior.
6. Re-run typecheck after changes and verify the error count moved in the intended direction.

## Quick Start (no Vite)
```bash
pnpm init -y
pnpm add -D typescript @types/node
npx tsc --init
```

Adjust `tsconfig.json` for your runtime and module resolution. See `references/toolchain.md` for the moduleResolution matrix and baseline configs.

### Module resolution quick matrix

| App type | moduleResolution | module | Notes |
|---------|------------------|--------|-------|
| Node.js apps | `NodeNext` | `NodeNext` | Align with `package.json` `type`. |
| React apps (Vite) | `bundler` | `ESNext` | Bundler-based resolution. |

## Project Setup Checklist
- Use pnpm for package management.
- Configure ESM/CJS and `moduleResolution` to match your runtime.
- Enable strict mode and incremental builds where appropriate.
- Set up Biome + ESLint together.
- Validate external data at boundaries (Zod or equivalent).
- Delegate testing patterns to `typescript-test-engineer`.
- When defining project scripts, keep test contours explicit (local fast loop, PR required gates, nightly stability) and defer details to `typescript-test-engineer`.

## When to Use This Skill
Use when:
- Writing type-safe TypeScript code (any project)
- Designing complex type patterns (generics, mapped types, conditional types)
- Resolving TypeScript compiler errors and inference failures
- Removing `any` types from legacy or loosely typed code
- Designing type guards, assertion functions, and overloads
- Deriving types from runtime values with `as const`, `typeof`, or `const` type parameters
- Migrating JavaScript codebases to TypeScript
- Configuring TypeScript toolchains (tsconfig, ESLint, Biome, pnpm)
- Implementing validation with Zod
- Creating branded/nominal types for domain safety

Do NOT use for:
- React-specific patterns (use React skills)
- Backend framework patterns (use framework skills)
- Frontend UI patterns

## Assets and Scripts
- Use `references/assets-scripts.md` for guidance on bundled assets and scripts.

## When you need more detail
Read only the relevant reference file:
- [type-system.md](references/type-system.md) - Core type system guide
- [generics.md](references/generics.md) - Advanced generics and utility types
- [runtime-derived-types.md](references/runtime-derived-types.md) - `as const`, `typeof`, `[number]`, and `const` type parameters
- [type-debugging.md](references/type-debugging.md) - Diagnosing compiler errors, isolating root causes, and type regression checks
- [overloads.md](references/overloads.md) - Function overloads, overload ordering, and overloads vs unions
- [patterns.md](references/patterns.md) - Error handling, validation, project organization
- [toolchain.md](references/toolchain.md) - Tooling, tsconfig, linting, module resolution
- [vite.md](references/vite.md) - Vite setup for React/TS apps
- [monorepo.md](references/monorepo.md) - Large codebases and project references
- [practices.md](references/practices.md) - Common mistakes, migration, @ts-expect-error policy
- [assets-scripts.md](references/assets-scripts.md) - How to use bundled assets and scripts

## Workflow stages

### Workflow stage: Make the TypeScript change

Resolve TypeScript problems with narrow, sound fixes and deterministic verification.

1. Run the repo typecheck or pnpm tsc --noEmit to capture the baseline.
2. Identify root causes such as widened literals, missing constraints, invalid indexing, overload mismatch, unsafe any, or unsound assertions.
3. Check whether built-in TypeScript utilities, inference, narrowing, `satisfies`, runtime-derived types, or schema inference solve the problem before adding custom conditional/mapped helpers or third-party type helpers.
4. Prefer constraints, narrowing, satisfies, runtime-derived types, overloads, or schema inference over broad widening.
5. Validate call sites and IntelliSense; add type tests or negative assertions for fragile type-level APIs.
6. Rerun typecheck and verify the error count moved in the intended direction.

Validation:

- The fix avoids implicit any, unsafe assertions, and unnecessary broadening.
- Typecheck or an explicit equivalent verification was run or the gap is reported.

## Interop priority

- **framework APIs and framework-specific patterns:** the relevant framework skill. This skill owns TypeScript language and toolchain rules, while framework skills own framework behavior.
- **testing patterns:** typescript-test-engineer. Use the testing skill for test design and runner behavior.

## Required active references
- [assets-scripts.md](references/assets-scripts.md) — Read this when you need How to use bundled assets and scripts.
- [generics.md](references/generics.md) — Read this when you need Advanced generics and utility types.
- [monorepo.md](references/monorepo.md) — Read this when you need Large codebases and project references.
- [overloads.md](references/overloads.md) — Read this when you need Function overloads, overload ordering, and overloads vs unions.
- [patterns.md](references/patterns.md) — Read this when you need Error handling, validation, project organization.
- [practices.md](references/practices.md) — Read this when you need Common mistakes, migration, @ts-expect-error policy.
- [runtime-derived-types.md](references/runtime-derived-types.md) — Read this when you need `as const`, `typeof`, `[number]`, and `const` type parameters.
- [toolchain.md](references/toolchain.md) — Read this when you need Tooling, tsconfig, linting, module resolution.
- [type-debugging.md](references/type-debugging.md) — Read this when you need Diagnosing compiler errors, isolating root causes, and type regression checks.
- [type-system.md](references/type-system.md) — Read this when you need Core type system guide.
- [vite.md](references/vite.md) — Read this when you need Vite setup for React/TS apps.

## Bundled assets

- `assets/biome.json` — Bundled asset: assets/biome.json.
- `assets/eslint.config.js` — Bundled asset: assets/eslint.config.js.
- `assets/tsconfig-strict.json` — Bundled asset: assets/tsconfig-strict.json.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory typescript-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
