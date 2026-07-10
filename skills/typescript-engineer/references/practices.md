# TypeScript Practices and Migration

> **Load when:** The task reduces unsafe `any` or assertions, changes a public type contract, migrates JavaScript, or needs a TypeScript suppression policy.

Repository policy and the intended public contract win over style preferences in this reference.

## Suppression directives

Fix the type or boundary first. When a negative compile assertion or temporary upstream incompatibility genuinely needs a directive:

- prefer `@ts-expect-error` because it fails when the expected diagnostic disappears;
- include a short description of the expected error and why it is intentional;
- keep the directive on the narrowest line;
- remove it when the condition no longer applies;
- follow stricter repository policy when present.

```ts
declare function setMode(mode: "safe" | "fast"): void;

// @ts-expect-error - unsupported modes must remain rejected
setMode("legacy");
```

Do not mechanically replace a version-matrix `@ts-ignore` without checking every supported TypeScript version: a line can error in one supported version and not another. If repository policy permits that exceptional case, document the version boundary and keep an executable matrix check.

## Unsafe `any` and assertions

Distinguish `any` by propagation risk instead of banning the token mechanically.

Prefer:

- `unknown` plus narrowing for untrusted or opaque values;
- constrained generics for relationships between inputs and outputs;
- discriminated unions for state variants;
- `satisfies` when validating a shape while preserving inference;
- types derived from an accepted runtime schema or source definition;
- a small adapter around inaccurate third-party declarations.

An assertion is acceptable only when a runtime invariant or external contract exists, TypeScript cannot express it directly, and the assertion is isolated at that boundary. Record the invariant and add the narrowest regression evidence. An assertion does not validate data.

## Public type contracts

Before tightening or widening an exported type:

1. find callers, implementers, declaration consumers, and serialized boundaries;
2. state whether the change is source-compatible and whether it changes emitted declarations;
3. prefer inference internally but annotate exported behavior when the annotation intentionally protects a public contract;
4. compile affected consumers or declaration tests when the claim depends on them.

Do not force callers into casts merely to make the implementation typecheck.

## Boundary data

Accept opaque external data as `unknown` until the owning runtime boundary validates or narrows it. TypeScript may derive a type from an accepted schema, but the validation library, framework, or domain owner decides what the schema must accept and how failures behave.

## Incremental JavaScript migration

Preserve runtime behavior and advance strictness in observable steps:

1. identify the current JS checking, transpilation, test, and module paths;
2. enable TypeScript or `checkJs` only for an intentionally bounded source set;
3. migrate files or boundaries in small groups with the existing runtime tests;
4. reduce `any` and enable stricter compiler options as explicit gates;
5. keep generated declarations and public consumers compatible where applicable.

Example starting point for a checked JavaScript slice:

```jsonc
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noEmit": true
  },
  "include": ["src/migrating/**/*.js"]
}
```

Do not advertise migration complete because files were renamed or a config exists. Completion requires the intended source set to be checked and the relevant runtime behavior to remain verified by its owning tests.
