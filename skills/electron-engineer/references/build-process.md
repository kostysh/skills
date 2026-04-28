# Build Process

Use this reference when defining, implementing, reviewing, or debugging the Electron build pipeline, electron-vite scripts, Forge package/make/publish flow, CI build lanes, source-protection build steps, or packaged artifact validation.

## Canonical Stack

Use one default build stack:

- `electron-vite` owns source development, preview, and production bundling for `main`, `preload`, and `renderer`.
- Electron Forge owns packaging the built app, making OS-specific distributables, and publishing artifacts.

Do not use `@electron-forge/plugin-vite` as the default for new guidance. It is a valid Forge-native alternative for existing Forge projects, but the canonical skill path keeps source bundling in electron-vite because it gives one Electron-aware build command, one configuration surface for main/preload/renderer, and built-in source-protection hooks.

Do not introduce another packaging or build framework unless:

- the project already uses it and migration is out of scope
- a distribution requirement cannot be met by Forge
- the operator explicitly chooses the trade-off

## Command Contract

Standard package scripts:

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "preview": "electron-vite preview --outDir=dist",
    "build": "electron-vite build --outDir=dist",
    "package": "pnpm build && electron-forge package",
    "make": "pnpm build && electron-forge make",
    "publish": "pnpm build && electron-forge publish"
  }
}
```

Adapt the package-manager prefix to the repository (`pnpm`, `npm run`, `yarn`). Keep the semantic contract:

- `dev` starts Electron with main/preload builds and renderer dev server.
- `preview` builds main, preload, and renderer, then starts Electron against built output.
- `build` creates production source bundles only.
- `package` creates the platform app bundle from built output.
- `make` creates distributable installers/archives.
- `publish` uploads distributables after package/make prerequisites.

If Forge output and electron-vite output directories conflict, set electron-vite `outDir` to a stable build directory such as `dist` and keep Forge output in its own `out` directory.

## Pipeline

Use this order for production builds:

1. Install dependencies with the repo package manager and lockfile.
2. Run lint, typecheck, and unit/contract tests.
3. Run `electron-vite build` for main, preload, and renderer.
4. Run source-protection transforms configured in electron-vite, such as bytecode for selected main/preload modules, only when policy requires them.
5. Audit built output for sourcemaps, raw source, dev artifacts, `.env` files, test fixtures, private keys, and readable business-critical modules.
6. Run `electron-forge package` to produce a packaged app bundle.
7. Verify ASAR, unpacked native modules, fuses, ASAR integrity, app metadata, icons, and platform-specific resources.
8. Run packaged smoke tests against the packaged app, not only dev or preview mode.
9. Run `electron-forge make` for target distributables.
10. Sign, notarize, timestamp, checksum, SBOM, provenance, and release-note steps according to platform policy.
11. Run release smoke checks on generated distributables when feasible.
12. Run `electron-forge publish` only after artifacts and update metadata are verified.

Do not skip `electron-vite build` before Forge package/make/publish. Forge package does not become the source bundler in this canonical stack.

## electron-vite Practices

Use electron-vite as an Electron build tool, not as a renderer-only Vite wrapper:

- Keep explicit `main`, `preload`, and `renderer` config sections.
- Keep main/preload dependencies out of renderer bundles.
- Keep renderer code browser-safe; no Node or Electron imports in renderer.
- Do not use `nodeIntegration` as a workaround for build problems.
- Use preload plus `contextBridge` for renderer capabilities.
- Fully bundle preload dependencies when sandbox support requires a single preload bundle.
- Use isolated builds for multi-entry preload or renderer scenarios when shared chunks would break sandbox, loading, or startup behavior.
- Pin electron-vite and related plugins; review release notes before major upgrades.
- Keep dev-only flags such as inspector, remote debugging, and renderer-only dev commands out of release scripts.

## electron-vite Anti-Patterns

Flag these:

- `vite build` for renderer plus ad hoc scripts for main/preload instead of `electron-vite build`.
- Forge package/make run directly against raw TypeScript or source folders.
- Production package still points at dev server or `localhost`.
- Renderer imports Electron or Node modules because bundling made it "work".
- Disabling sandbox to fix preload dependency loading when full bundling would preserve sandbox.
- Using `--noSandbox`, remote debugging, inspector flags, or renderer-only shortcuts in production scripts.
- Shipping sourcemaps or original source with packaged artifacts.
- Enabling bytecode for preload by disabling sandbox without a security review.
- Generating bytecode once and reusing it across Electron/V8 versions, OSes, or architectures.
- Obfuscating everything without packaged smoke tests and support/debugging strategy.
- Adding electron-builder or another packager beside Forge without an explicit migration or product requirement.

## Source Protection During Build

If source protection is required, apply it during `electron-vite build`, then verify packaged output:

- Prefer built-in electron-vite bytecode for selected main/preload modules before adding a separate bytecode tool.
- Remember that bytecode is production-only and typically limited to main/preload.
- Keep renderer source protection to minification or targeted obfuscation; do not move privileged logic into renderer.
- Avoid preload bytecode if it forces sandbox disablement; prefer moving protected logic into main or a utility process.
- Build bytecode per target Electron/V8/runtime architecture; do not reuse caches blindly across targets.
- Keep private sourcemaps outside distributables if crash mapping is required.

Use [Source Protection](source-protection.md) for the full threat model and audit checklist.

## Forge Packaging and Distribution

Use Forge after the electron-vite source build:

- `package` creates the OS app bundle.
- `make` creates installers or distributable archives from the packaged app.
- `publish` uploads generated artifacts through configured publishers.

Forge is also the place to wire platform makers, publishers, signing/notarization hooks, icons, native module rebuilds, and package lifecycle hooks. Keep custom logic small and documented; if source bundling logic grows, move it back to electron-vite config or a prebuild step rather than hiding it inside Forge hooks.

Use [Packaging, Release, and Updates](packaging-release-updates.md) for signing, notarization, update channels, CI provenance, SBOM, rollback, and release policy.

## CI Build Lanes

Recommended lanes:

| Lane | Commands and checks |
| --- | --- |
| PR | install, lint, typecheck, unit/IPC/preload/renderer tests, `electron-vite build` |
| Nightly | PR lane plus `electron-forge package`, source exposure audit, packaged smoke |
| Beta | signed prerelease package, `electron-forge make`, fake update feed, staged channel |
| Stable | full build, package, make, signing/notarization/timestamping, checksums, SBOM, provenance, publish |
| Hotfix | same release gates as stable, scoped to the patched branch |
| Dry run | stable lane without public publish |

Run platform-specific package/make lanes on the target OS where signing, notarization, native modules, or installer behavior requires it.

## Verification

For build-process changes, verify:

- `electron-vite build` outputs expected main/preload/renderer bundles.
- `package.json` `main` points to built main output consumed by packaged app.
- production renderer does not load from `localhost`.
- preload path in packaged app points to built preload output.
- ASAR and `app.asar.unpacked` contain only intended files.
- protected modules are not shipped beside readable originals.
- native modules load in packaged app.
- packaged smoke starts the app and opens the main window.
- signing/notarization/update checks are either run or explicitly reported as unavailable.

Do not claim the build works based only on `electron-vite dev`.
