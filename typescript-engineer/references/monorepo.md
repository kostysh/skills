# Monorepo and Large Codebases

> **Load when:** User works in a monorepo, large codebase, or asks about project references, tsconfig.base.json, or incremental builds.

## Recommended structure
- `tsconfig.base.json` at repo root with shared compilerOptions.
- Per-package `tsconfig.json` extends the base and sets package-specific options.
- Use project references for build ordering and incremental builds.

Example:
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsbuildinfo"
  }
}
```

```json
// packages/foo/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```json
// tsconfig.json (root build graph)
{
  "files": [],
  "references": [
    { "path": "./packages/foo" },
    { "path": "./packages/bar" }
  ]
}
```

## Build and typecheck
```bash
# Build in dependency order
pnpm tsc -b

# Typecheck only (no emit/build output)
pnpm tsc --noEmit

# Clean build outputs
pnpm tsc -b --clean
```

## Path aliases
- Prefer per-package public entrypoints over cross-package path aliases.
- If you must use aliases, define them in `tsconfig.base.json` and align bundler/runtime resolution.

## Dependency installation (monorepo rule)
- Install dependencies only from the repo root with `pnpm install`.
- Do not run package-local installs inside `packages/*` or `apps/*`.
- Add dependencies via workspace-aware commands from the root (e.g., `pnpm -C <path> add ...` when needed).

## Linting at scale
- Run Biome at repo root for formatting and baseline lint.
- Run ESLint with `projectService: true` and a consistent `tsconfigRootDir`.
- Keep ignore patterns consistent across packages (dist, coverage, generated).
