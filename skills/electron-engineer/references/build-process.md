# Build Process

Use this reference when defining, implementing, reviewing, or debugging the Electron build pipeline, electron-vite scripts, Forge packaging, makers and releases, CI build lanes, source-protection build steps, or packaged artifact validation.

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

Example package scripts for electron-vite and Forge 8:

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "preview": "electron-vite preview --outDir=dist",
    "build": "electron-vite build --outDir=dist",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "release": "electron-forge release"
  }
}
```

Invoke the project's declared scripts with its package manager. Forge 7 projects commonly declare `"publish": "electron-forge publish"`. Use `pnpm run publish` to invoke that script. Bare `pnpm publish` publishes the npm package.

- `dev` starts Electron with main/preload builds and a renderer dev server.
- `preview` builds main, preload, and renderer, then starts Electron against built output.
- `build` creates production source bundles only.
- `package` creates the platform app from built output.
- `make` normally packages the app before running makers. A plain Forge release or publish normally runs make before upload.

Select commands from the installed Forge CLI. The examples use the script names above.

| Installed CLI | Prepare distributables locally | Reuse a previously verified platform app when making | Upload the saved distributables with publication authority |
| --- | --- | --- | --- |
| Forge 8.0.1 | `pnpm run make` saves the results of the makers | `pnpm run make --from-package` | `pnpm run release --from-make` |
| Forge 7.11.x | `pnpm run publish --dry-run` prepares artifacts and saves dry-run state | `pnpm run make --skip-package` | `pnpm run publish --from-dry-run` |

Forge 8.0.1 retains the old command and flags as deprecated aliases. Its `release --from-package` still runs makers. Use the saved make results when the distributable bytes have already been verified.

If Forge output and electron-vite output directories conflict, set electron-vite `outDir` to a stable build directory such as `dist` and keep Forge output in its own `out` directory.

## Pipeline

Use this order when the release must publish the verified bytes:

1. Install from the lockfile. For pnpm/Forge use project-local `node-linker=hoisted` as described in [Tooling](tooling-project-structure.md), then validate the dependency layout.
2. Run applicable lint, process typecheck and tests. Run `pnpm build` (or the repository equivalent) once to produce main/preload/renderer source bundles, including authorized source-protection transforms. Inspect the output.
3. Inspect the project's scripts and hooks for side effects. Prepare the distributables locally with the command for the installed Forge version in the table.
4. Perform signing/notarization at the lifecycle stage required by the selected packager/maker (Forge package can sign/notarize the app before make). All byte-changing transforms/signing must precede final hashes. Freeze the resulting package and distributables plus saved make results or dry-run metadata; record hashes, target, versions and source revision.
5. Audit ASAR, native modules, fuses/integrity, resources and exposure. Smoke-test the exact final app and installer/archive payload where applicable; verify signatures and update metadata. Checks must not alter the frozen artifact. Missing target credentials/runtime leaves that release claim unverified.
6. Only with publication authority for the target and channel, recheck hashes and use the installed CLI's upload command for saved distributables. Keep source builds and byte-changing hooks out of this step. If any bytes change, verify the changed artifacts before upload. Check the published artifacts and metadata against the recorded hashes.

An equivalent process that promotes the same verified bytes is valid. For local package or make tasks, stop after the requested artifact and checks. Plain make after package smoke or plain release after make may rebuild the artifact that passed verification.

[Forge 8 make](https://github.com/electron/forge/blob/48f38bb11debbd16737071f20784ff9c09ec502c/packages/api/core/src/api/make.ts), [Forge 8 release](https://github.com/electron/forge/blob/48f38bb11debbd16737071f20784ff9c09ec502c/packages/api/core/src/api/release.ts), [Forge 7 CLI](https://www.electronforge.io/cli).

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

Use Forge after the electron-vite source build. Follow the command table above for artifact reuse and publication.

Forge is also the place to wire platform makers, publishers, signing/notarization hooks, icons, native module rebuilds, and package lifecycle hooks. Keep custom logic small and documented; if source bundling logic grows, move it back to electron-vite config or a prebuild step rather than hiding it inside Forge hooks.

Use [Packaging, Release, and Updates](packaging-release-updates.md) for signing, notarization, update channels, CI provenance, SBOM, rollback, and release policy.

## CI Build Lanes

Recommended lanes:

| Lane | Commands and checks |
| --- | --- |
| PR | install, lint, typecheck, unit/IPC/preload/renderer tests, `electron-vite build` |
| Nightly | PR lane plus `electron-forge package`, source exposure audit, packaged smoke |
| Beta | signed prerelease package, `electron-forge make`, fake update feed, staged channel |
| Stable | source build, prepared/signed distributables, hashes/SBOM/provenance, exact-artifact smoke, authorized saved-state publication |
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
