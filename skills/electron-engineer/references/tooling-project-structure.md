# Tooling and Project Structure

Use this reference when shaping project layout, package boundaries, ESM/CJS strategy, monorepo layout, or native-module boundaries. For build commands, source bundling, package/make/publish, and CI build sequence, use [Build Process](build-process.md).

## Tooling Baseline

The canonical stack is:

- `electron-vite` for source development, preview, and production bundling of main, preload, and renderer.
- Electron Forge for packaging the built output, making platform distributables, and publishing artifacts.

Do not introduce another build or packaging stack unless the existing project already uses one or a product constraint requires it.

## Recommended Layout

Use a layout that mirrors trust boundaries:

```text
apps/desktop/
  src/
    main/
    preload/
    renderer/
    shared/
  test/
    unit/
    integration/
    e2e/
    smoke/
  forge.config.ts
  package.json
packages/
  domain/
  config/
  ui/
```

Rules:

- `main` may import domain services and shared contracts, not renderer UI.
- `preload` imports shared contracts and tiny adapters only.
- `renderer` imports browser-safe shared modules.
- `shared` must not depend on Electron main APIs or DOM-specific globals unless clearly split.
- packaging config should be close to the desktop app package.

## TypeScript and Module Boundaries

Use TypeScript by default. Pair with `typescript-engineer` for tsconfig and language rules.

Electron has distinct execution contexts:

- main and preload execute in Node/Electron-controlled contexts
- renderer executes in Chromium/browser context
- bundled output may differ from source module style

Do not treat "all ESM" or "all CJS" as the goal. The goal is repeatable runtime behavior in dev and packaged builds. Keep import extensions, bundler output, and package `type` aligned with the code that actually runs.

## Build Boundaries

Keep build boundaries aligned with runtime trust boundaries:

- main and preload are bundled as Electron-controlled Node-side entrypoints
- renderer is bundled as browser code
- shared contracts remain browser-safe and serializable
- packaged artifacts consume built output, not raw source trees

Use [Build Process](build-process.md) for the concrete command sequence and artifact rules.

## Native Module Boundary

Native modules are an operational dependency:

- rebuild against Electron's bundled Node ABI
- verify target OS and architecture
- unpack from ASAR when required
- include native binaries in signing/notarization checks
- smoke-test packaged app, not only dev mode

Avoid native dependencies unless they provide clear product value. If SQLite or another native dependency is selected, include rebuild and package smoke checks in the release lane from day one. Use [Build Process](build-process.md) for where these checks fit in the pipeline.

## Upgrade Policy

Electron releases regularly and supports a limited set of stable majors. For production apps:

- track current Electron major, bundled Chromium, bundled Node, and V8
- triage release notes regularly
- budget recurring major upgrades
- test native modules and packaging on each major bump
- use version-matched docs when applying API guidance

Old snippets can contain unsafe defaults. Treat any sample using disabled context isolation, raw IPC, `remote`, Spectron, or broad renderer Node access as historical until proven current.
