# TypeScript in Electron

Use this reference when configuring TypeScript for Electron main, preload, renderer, utility, or shared code; designing typed IPC/preload/window APIs; choosing tsconfig, module resolution, or Electron type surfaces; typing electron-vite env/imports/assets; handling ESM/CJS output; using decorators; or setting typecheck gates. For generic TypeScript language and type-system work, pair with `typescript-engineer`. For build command order, use [Build Process](build-process.md).

## Goal

TypeScript in Electron should encode runtime boundaries. It is not enough for the compiler to be green if renderer code can see Node types, preload exposes broad IPC, or bundled output does not match the packaged runtime.

Default posture:

- separate type environments by process
- keep shared contracts serializable and runtime-validated
- type the renderer-facing preload API explicitly
- run typecheck outside electron-vite bundling
- verify packaged behavior when module format, preload output, native modules, or env handling changes

## Process Type Ownership

| Area | Type environment | Owns | Must not see |
| --- | --- | --- | --- |
| `main` | Electron main plus Node | app lifecycle, windows, IPC handlers, native OS, storage, updater | DOM globals, renderer framework types |
| `preload` | Electron renderer/preload subset plus constrained Node APIs | `contextBridge` facade, IPC invoke wrappers, event cleanup | broad `fs`, `shell`, generic IPC, renderer UI imports |
| `renderer` | browser/DOM plus framework types | UI, routing, view state, calls to typed preload API | Node globals, Electron modules, privileged policy |
| `shared` | serializable TypeScript only | IPC channel constants, schemas, result envelopes, DTOs | Electron, Node, DOM, framework runtime dependencies unless split |
| `utility` | Node/Electron utility process | CPU-heavy or crash-prone services, native wrappers | renderer UI, hidden privileged API surface |
| config/scripts | Node tool runtime | `electron.vite.config.ts`, `forge.config.ts`, release scripts | app runtime assumptions unless explicitly invoked there |

Electron's process-specific type subpaths are useful for autocomplete and typechecking:

- `electron/main` for main-process modules
- `electron/renderer` for renderer-process Electron modules used in preload
- `electron/common` for modules that can run in both

These aliases do not change runtime behavior. Use them to clarify process intent, not to justify importing Electron from renderer UI.

## tsconfig Strategy

Use separate tsconfig files when the app has more than one runtime boundary:

```text
tsconfig.base.json
tsconfig.main.json
tsconfig.preload.json
tsconfig.renderer.json
tsconfig.node.json
```

Baseline matrix:

| Config | `lib` and `types` | Module resolution | Notes |
| --- | --- | --- | --- |
| base | strict shared defaults only | none or inherited | no DOM/Node/Electron globals by default |
| main | ES libs, Node, Electron main, `electron-vite/node` when needed | `bundler` for electron-vite bundled source; `NodeNext` for unbundled Node-run files | match bundled output and `package.json` `main` |
| preload | ES libs, constrained Electron renderer/preload types, `electron-vite/node` when needed | usually `bundler` | full-bundle dependencies when sandboxed preload needs imports |
| renderer | DOM libs, framework types, `vite/client` when needed | `bundler` | no `@types/node` or Electron types in normal UI code |
| shared | no ambient Node/DOM/Electron unless split | `bundler` or project-reference default | contracts must stay serializable |
| config/scripts | Node plus tool types | `NodeNext` or the loader-required mode | type Forge config and release scripts separately |

Recommended compiler posture:

- `strict: true`
- no implicit `any`
- no broad `skipLibCheck` as a first response to Electron/native type conflicts
- `isolatedModules: true` for files transformed by Vite/esbuild/SWC
- project references or separate `tsc --noEmit -p ...` commands when boundaries are large
- `@ts-expect-error` only with a short reason and a tracked removal condition

Do not create one global tsconfig that mixes DOM, Node, Electron, test, and renderer framework globals. It hides boundary leaks.

## electron-vite TypeScript Integration

electron-vite is the canonical source build layer for this skill. Use it as an Electron-aware bundler for `main`, `preload`, and `renderer`, not as proof that the TypeScript program is type-correct.

Rules:

- keep explicit `main`, `preload`, and `renderer` config sections when behavior diverges
- add `electron-vite/node` declarations through a `.d.ts` file or `compilerOptions.types` when using electron-vite-specific globals or import suffixes
- type `import.meta.env` in `env.d.ts`; keep `MAIN_VITE_`, `PRELOAD_VITE_`, `RENDERER_VITE_`, and `VITE_` scopes explicit
- run `tsc --noEmit` or process-specific typecheck scripts separately from `electron-vite build`
- keep renderer dependencies browser-safe even if bundling makes Node imports appear to work
- fully bundle preload dependencies when sandboxed preload needs imports at runtime
- use isolated builds for multiple preload or renderer entries when shared chunks would break sandbox, loading, or startup behavior

Decorators need special handling. Vite/Rollup does not support TypeScript `emitDecoratorMetadata` by default. If a main-side ORM or similar library requires metadata, use electron-vite's SWC path deliberately, install the optional SWC dependency, and cover the affected startup path in packaged smoke tests.

## Typed Preload, IPC, and Window API

The renderer should consume one typed capability API, not Electron transport details.

Contract shape:

```ts
export const IPC_CHANNELS = {
  workspaceList: "workspace:list",
} as const;

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface DesktopApi {
  workspace: {
    list(input: WorkspaceListRequest): Promise<IpcResult<WorkspaceSummary[]>>;
  };
}
```

Renderer global declaration:

```ts
export {};

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}
```

Rules:

- define the public `DesktopApi` in shared contract code or a renderer-visible declaration file
- expose one method per capability through `contextBridge`
- validate IPC payloads and responses at runtime with the project's schema tool
- keep result envelopes serializable; do not throw raw main-process errors across IPC
- model event subscriptions as functions that return cleanup callbacks
- avoid `window as any`, generic `invoke<T>`, exported `ipcRenderer`, or renderer-known channel strings
- keep Electron's contextBridge serialization limits in mind: prototypes, symbols, functions, errors, and complex objects may not cross as expected

Type safety does not replace sender validation. Main handlers still need origin, frame, window role, and session checks.

## Module Format and Runtime Output

Electron has different module loaders by context:

- main uses Node's module loader
- renderer uses Chromium/browser module loading
- preload behavior depends on sandbox and context isolation
- electron-vite may transform TypeScript source into CJS, ESM, `.cjs`, or `.mjs` output depending on config and package `type`

Decision rules:

- choose CJS or ESM for runtime behavior, not to silence TypeScript errors
- keep `package.json` `main`, BrowserWindow preload paths, and Forge packaging config aligned with built output
- when using native ESM in main, account for async module loading before Electron `ready`
- sandboxed preload scripts cannot rely on native ESM imports; bundle preload code instead
- ESM preload output needs the correct extension and packaged path handling
- TypeScript `paths` aliases are compile-time only unless electron-vite, tests, and runtime packaging all resolve them
- avoid mixing `require` and `import` through unsound default-import assumptions for CommonJS packages; verify the bundled and packaged behavior

Use [Build Process](build-process.md) for the build/package/make/publish order and [Tooling and Project Structure](tooling-project-structure.md) for package boundaries.

## Environment, Assets, and Native Types

Environment variables are type and security boundaries:

- only expose env variables with the intended electron-vite prefix
- type `ImportMetaEnv` in renderer-visible `.d.ts` files
- do not type secrets into renderer env declarations
- treat env-derived values as untrusted configuration and validate them in main

Asset and native-module imports need explicit declarations:

- use electron-vite's declared asset/import suffix types where available
- add narrow module declarations for project-specific asset imports
- keep native module types in main or utility boundaries
- do not make renderer compile by adding broad `declare module "*"` declarations

For native modules, the TypeScript type passing is only the first gate. Runtime still needs Electron ABI rebuild, ASAR unpacking, target architecture checks, and packaged smoke tests.

## Verification Gates

For TypeScript changes in Electron apps, run the narrowest applicable gates:

| Change | Required check |
| --- | --- |
| shared IPC or preload contract | typecheck shared/preload/renderer plus IPC contract tests |
| main/preload TypeScript config | `tsc --noEmit` for the affected config plus `electron-vite build` |
| renderer-only typing | renderer typecheck plus renderer tests |
| env declarations | typecheck plus dev/build mode check for expected prefixes |
| ESM/CJS or path alias change | typecheck, `electron-vite build`, packaged startup smoke |
| native module typings | typecheck, native rebuild, packaged smoke on target OS/arch |
| decorators/metadata | typecheck, electron-vite build with SWC path, packaged startup smoke |

CI should include process-specific typecheck before packaging. Do not claim a TypeScript migration is complete because `electron-vite dev` starts.

## Review Red Flags

Flag these in Electron TypeScript reviews:

- one tsconfig gives renderer Node/Electron globals
- renderer imports `electron`, `node:*`, or main-only shared modules
- `window as any` or `declare global` that exposes broad native objects
- generic typed IPC helpers that accept arbitrary channel strings
- shared contracts import Electron, DOM, framework, or Node runtime modules accidentally
- `electron-vite build` used as the only TypeScript verification
- `skipLibCheck` added without understanding the failing package boundary
- `nodeIntegration` or disabled sandbox used to fix TypeScript or bundling errors
- TypeScript `paths` work in editor but fail in tests or packaged app
- ESM/CJS changes without packaged startup verification
- decorators enabled without checking Rollup/SWC behavior
- ambient `declare module "*"` hides missing asset/native-module declarations

## Official Docs to Check

Use these when implementation needs exact, version-sensitive details:

- Electron Process Model and process-specific TypeScript module aliases
- Electron Context Isolation TypeScript usage
- Electron ESM guide
- electron-vite TypeScript, Env Variables and Modes, Development, Dependency Handling, Isolated Build, and CLI guides
- TypeScript `moduleResolution` reference
- Electron Forge TypeScript configuration
