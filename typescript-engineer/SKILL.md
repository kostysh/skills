---
name: typescript-engineer
description: |
  Professional TypeScript development skill focused purely on the language and its type system.
  Covers type system fundamentals (generics, mapped types, conditional types, satisfies operator),
  enterprise patterns (Result type, error handling, branded types), validation with Zod,
  and modern toolchain configuration (tsconfig, ESLint, Biome, pnpm).
  Framework-agnostic: no React, NestJS, or other framework-specific content.
---

# TypeScript Engineer

Professional TypeScript development - language and type system only, no frameworks.

## Scope
Applies to TypeScript language features, type system design, and toolchain configuration. Avoid framework-specific guidance.
## Interop (Priority)
- When paired with a framework skill (e.g. `react-spa-engineer`), this skill provides the baseline for TypeScript language/toolchain rules.
- Defer framework-specific patterns (React, routing, hooks, UI) to the framework skill.
- If rules conflict, follow this skill for TypeScript/toolchain and the framework skill for framework APIs.

## Non-negotiables (baseline)
- Keep tests and type checks deterministic; do not rely on implicit `any` or unsafe assertions.
- Use both Biome and ESLint: Biome for formatting and baseline lint, ESLint for type-aware rules.
- Use `@ts-expect-error` with a short justification; do not use `@ts-ignore`.
- For testing guidance, use the `typescript-test-engineer` skill.

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

## When to Use This Skill
Use when:
- Writing type-safe TypeScript code (any project)
- Designing complex type patterns (generics, mapped types, conditional types)
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
- [patterns.md](references/patterns.md) - Error handling, validation, project organization
- [toolchain.md](references/toolchain.md) - Tooling, tsconfig, linting, module resolution
- [vite.md](references/vite.md) - Vite setup for React/TS apps
- [monorepo.md](references/monorepo.md) - Large codebases and project references
- [practices.md](references/practices.md) - Common mistakes, migration, @ts-expect-error policy
- [assets-scripts.md](references/assets-scripts.md) - How to use bundled assets and scripts
