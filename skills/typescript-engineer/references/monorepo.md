# Monorepo and Project-Reference Typechecking

> **Load when:** The affected TypeScript project uses workspaces, shared configs, solution configs, `composite`, or project references.

Do not assume a root `tsc --noEmit` checks a monorepo. Establish the repository's build graph and package commands before selecting a fallback.

## Discover the graph

Inspect:

- root and package `package.json` scripts;
- package-manager workspace definitions;
- shared `tsconfig` files and each `extends` chain;
- root solution configs with `files: []` and `references`;
- package configs using `composite`, declaration emit, or separate build/typecheck configs;
- the CI command that is expected to traverse the graph.

A root solution config can intentionally have zero root files. Running ordinary `tsc --noEmit` against it may validate no package sources. Project references are normally traversed by a repository wrapper or build mode such as `tsc -b`; use the project's contract rather than inventing one.

## Shared configuration boundaries

Share only options that are genuinely common. Package-specific values usually include:

- `rootDir`, `outDir`, and declaration paths;
- runtime or bundler-specific `module` settings;
- JSX, DOM, Worker, or Node libraries and types;
- test and generated-file inclusions;
- incremental cache locations.

Avoid a shared `tsBuildInfoFile` that makes packages overwrite the same cache. Avoid forcing one runtime's module or library settings onto every package.

## Project references

Use project references when the repository benefits from an explicit build graph, incremental composite builds, or package declaration boundaries. They are not required merely because multiple packages exist.

A referenced package commonly enables `composite` and, when it is distributed through declarations, appropriate declaration emit. The root solution lists dependencies without pretending those referenced sources are root files.

```jsonc
// Root solution config: graph declaration, not an ordinary source program.
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" }
  ]
}
```

The verification command must traverse the intended graph. Record whether it is a repository script, package-manager recursive command, task runner, or `tsc -b` invocation.

## Public package boundaries

- Prefer package entrypoints and exports over cross-package imports into private source paths.
- Keep compiler path aliases aligned with the actual runtime/bundler and package-resolution contract.
- Check declaration output and at least the affected downstream consumers when exported types change.
- Do not turn a TypeScript diagnosis into a package-manager or monorepo-architecture migration without explicit authority.

## Verification

For a monorepo type change, verify:

1. the targeted package command or graph-aware root command;
2. the targeted diagnostic and absence of new relevant diagnostics;
3. affected project references or downstream consumers;
4. both configured Biome and ESLint contours for matched files;
5. any intentionally unvisited package or runtime boundary as an explicit evidence limit.
