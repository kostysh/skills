# TypeScript Toolchain

> **Load when:** The task changes `tsconfig`, TypeScript versions, module or module-resolution behavior, or coordinated Biome and ESLint coverage.

Treat toolchain configuration as executable behavior. Inspect the repository and installed versions before recommending options or commands; do not copy a generic config over an existing project.

## Establish the real toolchain

Before editing, identify:

- the repository's package manager and package/workspace scripts;
- the installed TypeScript, Biome, ESLint, and typescript-eslint versions;
- the `tsconfig` inheritance and project-reference graph;
- whether TypeScript emits JavaScript, declarations only, or no output;
- the runtime, bundler, test transform, and downstream package consumers;
- the exact local, CI, and release commands whose behavior must remain compatible.

Repository policy and compatible installed behavior win over this reference's defaults. If a requested upgrade changes compiler, lint, emit, or module semantics, treat it as explicit migration work rather than incidental cleanup.

## TypeScript configuration decisions

Start with the smallest compiler configuration that matches the real execution and distribution path. Common strictness options include:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true
  }
}
```

These are candidates, not a universal template:

- enabling them in an existing project can expose migration work;
- `exactOptionalPropertyTypes` changes assignability at public boundaries;
- `noUncheckedIndexedAccess` propagates `undefined` into indexed reads;
- `verbatimModuleSyntax` makes type/value import intent observable and must match the emitter and runtime path;
- emit, declaration, JSX, library, target, and interop options depend on the actual project.

Prefer the repository's existing `typecheck`, `build`, or package-scoped command. A generic local compiler fallback is acceptable only after confirming the intended `tsconfig` and source set. Do not claim coverage from a successful command that loaded zero root files or skipped referenced projects.

## Module and module-resolution workflow

Choose `module` and `moduleResolution` from the real emitter/runtime/consumer contract, not from a framework label.

1. Identify what executes: source TypeScript, emitted JavaScript, or bundled output.
2. Identify who resolves imports: Node, a bundler, another runtime, or downstream package consumers.
3. Identify whether emitted declarations preserve imports that consumers must resolve.
4. Select settings that model that path, then run the real build and consumer-facing check.

Typical directions:

| Execution or distribution path | TypeScript direction | Required owner check |
| --- | --- | --- |
| JavaScript emitted for modern Node | a matching Node mode such as `NodeNext` or a version-frozen Node mode supported by the installed TypeScript | `node-engineer` confirms runtime mode, package type, and import extensions |
| Application fully processed by a bundler | `moduleResolution: "bundler"` with a compatible `module` setting | framework/bundler owner confirms the produced runtime behavior |
| Published library with externalized imports or declarations | model downstream consumers, not only the author's bundler | build and consumer/declaration evidence |
| Source `.ts` executed by Node | compiler options must reflect the runtime mode, but Node ignores many `tsconfig` transforms | `node-engineer` owns type stripping and runtime import semantics |

Do not assume `paths` rewrites runtime imports. TypeScript path mapping describes resolution to the compiler; the runtime or bundler needs a compatible mechanism.

## Dual-lint baseline: Biome plus ESLint

For a new TypeScript setup or explicit lint hardening, configure both tools because their coverage is complementary.

### Biome owns

- formatting;
- import organization when enabled for the installed version;
- fast syntax and repository-style checks;
- the type-aware rules implemented and enabled by the installed Biome version.

### ESLint plus typescript-eslint owns

- type-informed rules not implemented or not stable enough in the installed Biome version;
- repository policy expressed through ESLint plugins or rule options;
- compatibility rules whose behavior the project has already standardized.

The overlap changes between releases. Inspect the installed rule surfaces instead of preserving a historical comparison table. Current Biome releases include some promise and condition analysis that older releases lacked; typescript-eslint still exposes additional type-checked rules and configuration. Examples that commonly require an ESLint decision include strict boolean expressions, unsafe `any` propagation, template-expression restrictions, exhaustive switches, unbound methods, or project-specific plugin rules. Verify each example against the installed versions before assigning ownership.

For every overlapping rule:

1. choose Biome or ESLint as the single diagnostic owner;
2. disable or avoid enabling the duplicate in the other tool;
3. keep the complementary tool enabled for its remaining coverage;
4. run both repository commands in check-only mode before claiming the lint contour verified.

Do not add either tool during an unrelated TypeScript fix. In an existing project, preserve its declared toolchain and report a missing required contour. If repository policy intentionally overrides the dual-lint baseline, state that authority and the coverage it leaves unassessed.

## Type-aware ESLint setup

Use the installed typescript-eslint documentation and project convention. A modern flat-config setup normally combines a recommended type-checked configuration with project-service or an explicit project configuration. Confirm:

- linted files belong to the intended TypeScript projects;
- config and generated files that need different treatment have explicit overrides;
- type-aware rules are not silently running without type information;
- the supported ESLint, typescript-eslint, and TypeScript version ranges are compatible.

Strict and stylistic presets are policy choices, not universal defaults. Prefer a stable recommended type-checked baseline unless the repository deliberately accepts a more opinionated or semver-unstable preset.

## Verification

For a toolchain change, record:

- installed versions before and after;
- the effective `tsconfig` and project graph used by the command;
- the exact typecheck or build command and whether it covered referenced projects;
- Biome and ESLint check-only commands;
- the rule ownership decision for overlaps;
- any diagnostics intentionally deferred and the authority for doing so.

Compiler success proves only the loaded TypeScript program. Lint success proves only enabled rules over matched files. Neither proves runtime, framework, domain, or deployment behavior.

## Currency sources

For version-sensitive work, consult the current official documentation that matches the installed or requested version:

- TypeScript modules and compiler options: `https://www.typescriptlang.org/docs/handbook/modules/`
- Biome configuration and rule inventory: `https://biomejs.dev/reference/configuration/` and `https://biomejs.dev/linter/rules/`
- typescript-eslint typed linting and shared configs: `https://typescript-eslint.io/getting-started/typed-linting/` and `https://typescript-eslint.io/users/configs/`
- Node TypeScript runtime behavior: `https://nodejs.org/api/typescript.html` through `node-engineer`
