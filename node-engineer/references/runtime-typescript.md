# Runtime TypeScript in Node

## Use built-in Node TypeScript support intentionally

Built-in Node TypeScript support is a runtime feature, not a replacement for the TypeScript compiler.

Use it when:
- the code only needs erasable TypeScript syntax;
- you want to execute source `.ts` files directly in Node;
- the project does not rely on path alias rewriting, TSX, or downlevel transforms.

Do not use it as a blanket rule when:
- the repo already has an intentional build pipeline;
- runtime code depends on non-erasable TS syntax;
- the emitted JavaScript path is the supported production artifact.

## Version guide

- Node `22.6` to `22.17`: use `node --experimental-strip-types`.
- Node `22.18+`, `23.6+`, `24+`, `25+`: type stripping is enabled by default.
- When the code requires non-erasable TypeScript syntax, use `--experimental-transform-types` deliberately or switch to a full TypeScript execution/build tool.

## Runtime facts that matter

- Node does **not** read `tsconfig.json` at runtime.
- Type stripping removes inline types only; it does not perform general TypeScript transforms.
- Import specifiers must match the path the runtime executes.
- Type-only imports still need `import type` or inline `type` markers so Node can strip them correctly.

## Import extension rules

When Node runs source `.ts` directly:
- use `.ts`, `.mts`, or `.cts` in relative imports;
- do not teach the repo to use `.js` in source files just because emitted output will eventually be `.js`.

When the runtime executes emitted JavaScript:
- emitted files must contain valid `.js` specifiers;
- keep the build step responsible for that rewrite, not ad-hoc string edits.

Do not mix both styles in one recommendation without stating which runtime path owns them.

## Unsupported or risky assumptions

Built-in type stripping does not solve:
- path alias rewriting driven by `tsconfig`;
- TSX execution;
- generic downlevel compilation to older JavaScript targets;
- automatic support for decorators just because decorators are advanced in TC39.

Treat decorators as runtime-sensitive and verify actual Node support before recommending them.

## Recommended typecheck config for source-executed `.ts`

Use a typecheck-oriented config for direct Node execution:

```json
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

Notes:
- `rewriteRelativeImportExtensions` belongs in configs that may emit or validate emitted paths.
- If your TypeScript version/config requires `allowImportingTsExtensions` for checking `.ts` specifiers, use it only in a `noEmit` or `emitDeclarationOnly` config.
- Do **not** copy `allowImportingTsExtensions` into a JavaScript-emitting build config blindly.

## Build-path guardrails

For distributable packages or services that run emitted JavaScript:
- keep a dedicated build config;
- verify emitted import specifiers are valid in output;
- prefer one source of truth for runtime artifacts (`dist/`, bundle output, etc.).

If the repo supports both direct `.ts` execution and emitted `.js`, make that split explicit in scripts and docs instead of trying to hide it inside one magical tsconfig.
