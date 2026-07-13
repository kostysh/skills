# Runtime TypeScript in Node

## Establish the executed path first

Before recommending a flag, loader, import extension, or tsconfig change, inspect:

- the exact local, CI, and deployed Node versions;
- repository package-manager and start/test scripts;
- `package.json` module markers and exports;
- whether Node executes source `.ts`, emitted JavaScript, or loader/bundler output;
- the TypeScript syntax actually present;
- the exact failing command, `NODE_OPTIONS`, and diagnostics.

Do not prescribe npm, pnpm, `npx`, nvm, Volta, `tsx`, or a build tool until repository tooling, installation state, supported versions, and mutation/network authority are known.

If repository artifacts are unavailable, describe which scripts, configs, versions, and emitted files must be inspected, but do not invent a local binary path such as `./node_modules/.bin/...` or a package-manager command. Return a version-bounded diagnosis and `partial`/`blocked` next step instead.

## Built-in support and version boundaries

Node's built-in TypeScript support strips types; it does not typecheck and does not read `tsconfig.json` at runtime.

High-risk compatibility facts:

- Node `22.6` through `22.17` requires `--experimental-strip-types`; type stripping is enabled by default from `22.18`.
- Node 24 enables stripping by default; it is stable from `24.12`.
- Node 26 keeps stable erasable-syntax stripping but removes `--experimental-transform-types`.
- `--experimental-transform-types` exists on supported Node 22/24 releases that document it, but must never be extrapolated to another major.

Always confirm the installed command surface with `node --version`, `node --help`, repository scripts, and current official documentation for every supported major. If a required major is unavailable locally, report that compatibility contour as unexecuted rather than claiming it from another version.

## Choose the path from the syntax

Use built-in stripping only when code contains erasable TypeScript syntax and does not depend on TSX, path alias rewriting, downlevel transforms, or code-generating TypeScript constructs.

For Node 26, code containing enums, parameter properties, namespaces with runtime code, or other non-erasable syntax needs one of these explicit decisions:

1. refactor to erasable syntax when the change is small, compatible, and authorized;
2. use an already-established full TypeScript loader when direct source execution is the accepted runtime contract;
3. emit or bundle JavaScript and execute the built artifact.

Do not silently change the production artifact, introduce a loader, or mass-rewrite syntax merely to make one local command pass. Route TypeScript language/config work to `typescript-engineer` after the Node runtime path is selected.

## Runtime facts that affect correctness

- Node ignores `tsconfig.json` runtime options such as `paths` and downlevel targets.
- Type-only imports need `import type` or inline `type` markers; otherwise Node treats them as runtime imports.
- Built-in stripping does not execute TypeScript under `node_modules`.
- `.tsx` is unsupported by built-in stripping.
- Decorators and other evolving syntax are version-sensitive; verify the actual Node parser/runtime instead of inferring support from TypeScript or TC39 status.

## Import extensions

When Node executes source TypeScript directly:

- use explicit `.ts`, `.mts`, or `.cts` relative specifiers matching the source files;
- verify the module system from extensions and the nearest `package.json` `type` field.

When Node executes emitted JavaScript:

- emitted specifiers must resolve to `.js`, `.mjs`, or `.cjs` artifacts as appropriate;
- keep source, compiler rewrite behavior, package exports, and runtime entry aligned;
- inspect and execute the emitted entry instead of assuming a successful build produced runnable imports.

Do not mix source-execution and emitted-output extension rules in one recommendation.

## Typecheck guard for erasable source

When the installed TypeScript version supports these options and direct source execution is accepted, a typecheck-only config can enforce the runtime subset:

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

Verify option availability against the installed TypeScript version. Use the repository's package-manager script or local compiler binary; do not invoke a potentially downloading command as a generic fallback.

`erasableSyntaxOnly` is a static guard, not runtime proof. Completion still requires the exact Node command on each claimed major. For an emitted-JavaScript service or package, keep a dedicated build config and execute the built artifact.

## Verification and reporting

At minimum report:

- exact Node and TypeScript versions actually inspected;
- exact source or emitted entry and module system;
- repository command and flags used;
- positive runtime result for supported syntax;
- negative or compatibility result for the relevant unsupported syntax/version;
- any supported major not executed locally;
- whether the result is `verified`, `partial`, or `blocked`.
