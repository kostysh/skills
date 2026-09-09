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
    "package": "electron-forge package",
    "make": "electron-forge make",
    "publish": "electron-forge publish"
  }
}
```

Invoke declared scripts explicitly with the repository package manager (`pnpm run`, `npm run`, or `yarn run`). In particular, bare `pnpm publish` is the registry publisher, not the Forge `publish` script. Keep the semantic contract:

- `dev` starts Electron with main/preload builds and renderer dev server.
- `preview` builds main, preload, and renderer, then starts Electron against built output.
- `build` creates production source bundles only.
- `package` creates the platform app bundle from built output.
- `make` normally runs package again, then creates installers/archives; `--skip-package` reuses an existing package only when intentionally verified.
- `publish` normally runs package and make before upload. `--dry-run` saves prepared artifact state without upload; `--from-dry-run` publishes that saved state. Do not hide a prebuild or source-changing lifecycle hook in the latter path.

If Forge output and electron-vite output directories conflict, set electron-vite `outDir` to a stable build directory such as `dist` and keep Forge output in its own `out` directory.

## Pipeline

Use this order when the release must publish the verified bytes:

1. Install from the lockfile. For pnpm/Forge use project-local `node-linker=hoisted` as described in [Tooling](tooling-project-structure.md), then validate the dependency layout.
2. Run applicable lint, process typecheck and tests. Run `pnpm build` (or the repository equivalent) once to produce main/preload/renderer source bundles, including authorized source-protection transforms. Inspect the output.
3. Run the installed Forge publish dry-run path, e.g. `pnpm run publish --dry-run`. It performs package/make and saves state without upload. Review publisher/hooks for side effects and use only the authorized target/channel. This is a local preparation command, not upload permission.
4. Perform signing/notarization at the lifecycle stage required by the selected packager/maker (Forge package can sign/notarize the app before make). All byte-changing transforms/signing must precede final hashes. Freeze the resulting package and distributables plus saved dry-run metadata; record hashes, target, versions and source revision.
5. Audit ASAR, native modules, fuses/integrity, resources and exposure. Smoke-test the exact final app and installer/archive payload where applicable; verify signatures and update metadata. Checks must not alter the frozen artifact. Missing target credentials/runtime leaves that release claim unverified.
6. Only with existing publication authority, recheck the saved hashes and run `pnpm run publish --from-dry-run` with no source build/prepublish transformation. Verify the published artifact/metadata against those hashes. If bytes change, repeat validation of the changed artifacts before upload.

An equivalent immutable-artifact promotion flow is valid. Ordinary local package/make work can run a source build followed by package or make; do not confuse it with a frozen release. Running plain make after package smoke or plain publish after make may recreate the app and invalidate the earlier evidence. Use `--skip-package` only with an intentionally retained package; it alone does not make a later plain publish immutable. Verify flags and saved-state behavior with the installed Forge CLI.

Sources: [Forge CLI](https://www.electronforge.io/cli), [build lifecycle](https://www.electronforge.io/core-concepts/build-lifecycle).

## electron-vite Practices

Use electron-vite as an Electron build tool, not as a renderer-only Vite wrapper:

- Keep explicit `main`, `preload`, and `renderer` config sections.
- Keep main/preload dependencies out of renderer bundles.
- Keep renderer code browser-safe; no Node or Electron imports in renderer.
- Do not use `nodeIntegration` as a workaround for build problems.
- Use preload plus `contextBridge` for renderer capabilities.
- Fully bundle preload dependencies when sandbox support requires a single preload bundle.
- Isolated builds are experimental: verify installed electron-vite support and use only for a demonstrated multi-entry shared-chunk loading problem. A fully bundled CJS preload preserves sandbox; native ESM preload is not supported in the sandbox.
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
- `make` packages again by default; the command contract above owns intentional reuse.
- `publish` normally packages/makes again; the frozen dry-run/from-dry-run flow above owns publishing verified bytes.

Forge is also the place to wire platform makers, publishers, signing/notarization hooks, icons, native module rebuilds, and package lifecycle hooks. Keep custom logic small and documented; if source bundling logic grows, move it back to electron-vite config or a prebuild step rather than hiding it inside Forge hooks.

Use [Packaging, Release, and Updates](packaging-release-updates.md) for signing, notarization, update channels, CI provenance, SBOM, rollback, and release policy.

## CI Build Lanes

Recommended lanes:

| Lane | Commands and checks |
| --- | --- |
| PR | install, lint, typecheck, unit/IPC/preload/renderer tests, `electron-vite build` |
| Nightly | PR lane plus `electron-forge package`, source exposure audit, packaged smoke |
| Beta | signed prerelease package, `electron-forge make`, fake update feed, staged channel |
| Stable | source build, prepared/signed dry-run artifacts, hashes/SBOM/provenance, exact-artifact smoke, authorized saved-state publication |
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
