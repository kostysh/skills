---
name: electron-engineer
description: Build, modernize, review, test, package, and release
  production-grade Electron desktop applications across macOS, Windows, and
  Linux. Covers Electron process architecture, main/preload/renderer trust
  boundaries, TypeScript process typing, typed IPC, security hardening, custom
  protocols, native OS integration, data and secret storage, source exposure
  reduction, build pipelines, performance, testing, observability, packaging,
  signing, notarization, auto-updates, and Electron major-version migrations.
metadata:
  source-version: 0.1.8
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: aa4162e94da0b5063c612bc1dbc59347df5775d1ec875631ea4c5e9a055bd439
---

# electron-engineer

## Start here

1. Confirm the task is Electron-specific and state the intended user-visible outcome before changing code.
2. Preserve the core trust boundary: renderer is untrusted UI, preload is a minimal capability facade, and main owns privileged desktop services.
3. Load the smallest matching reference for the task; do not load every reference by default.
4. Prefer existing project conventions unless they violate Electron security, packaging, or release invariants.
5. Finish only after running the narrowest meaningful validation, or explicitly reporting why validation could not run.

## When to use this skill

- Building a new Electron desktop application for macOS, Windows, Linux, or a cross-platform target matrix.
- Modernizing or reviewing Electron main/preload/renderer architecture, IPC, BrowserWindow, custom protocols, menus, tray, native OS integration, or multi-window flows.
- Hardening Electron security, including context isolation, sandboxing, CSP, navigation, external URL handling, sender validation, and preload surface review.
- Configuring TypeScript across Electron main, preload, renderer, utility, shared contracts, electron-vite, and Forge surfaces.
- Designing local data, file, secret storage, source exposure reduction, build process, native module, offline-first, or crash recovery behavior in an Electron app.
- Packaging, signing, notarizing, distributing, updating, testing, debugging, observing, or migrating Electron applications.

## When NOT to use this skill

- The app is Tauri, Flutter, native Swift/Kotlin/C# desktop, browser-only web, mobile, or CLI-only.
- The work is pure TypeScript language or type-system behavior with no Electron boundary; use `typescript-engineer`.
- The work is pure Node runtime behavior with no Electron integration; use `node-engineer`.
- The work is pure React SPA architecture inside a renderer with no desktop boundary; use `react-spa-engineer`.

## Overview

Production Electron work is desktop platform engineering, not only a web app in a shell. Treat Electron as a security-sensitive runtime with browser content, Node capabilities, native OS integration, a local install footprint, and a supply-chain-sensitive updater.

Default to a thin main process, an untrusted renderer, a minimal capability-based preload, typed IPC with runtime validation, explicit navigation policy, signed release artifacts, and regular Electron major upgrades.

## Default Architecture

Use paths and package boundaries to make trust boundaries obvious:

```text
src/
  main/
    bootstrap.ts
    windows/
    ipc/
    protocols/
    services/
    security/
    updates/
    observability/
  preload/
    index.ts
    bridges/
  renderer/
    app/
    features/
    routes/
    components/
  shared/
    ipc/
    contracts/
    schemas/
    errors/
    types/
```

Keep privileged logic in main-owned services. Keep preload thin and role-specific. Keep renderer code browser-safe. Keep shared contracts serializable and free of Electron main dependencies.

## Safe Defaults

For normal app renderers:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` when feasible
- `webviewTag: false` unless a reviewed embed feature requires it
- deny popups and arbitrary navigation
- strict production CSP
- no production fallback to `localhost`
- no raw `ipcRenderer` or generic bridge exposed to renderer

## Tooling Defaults

Use the canonical split from [Build Process](references/build-process.md): electron-vite owns dev/preview/build for main, preload, and renderer source; Electron Forge owns package/make/publish for distributable artifacts. Use another build or packaging stack only when the existing project already commits to it or a documented product constraint requires it.

## Reference Navigation

Read only the reference needed for the task:

| Task | Reference |
| --- | --- |
| Process boundaries, windows, sessions, custom protocols | [Architecture](references/architecture.md) |
| BrowserWindow security, IPC, preload, navigation, CSP | [Security, IPC, and Preload](references/security-ipc-preload.md) |
| Project layout, package boundaries, ESM/CJS | [Tooling and Project Structure](references/tooling-project-structure.md) |
| TypeScript across main, preload, renderer, shared contracts | [TypeScript in Electron](references/typescript-in-electron.md) |
| End-to-end build pipeline | [Build Process](references/build-process.md) |
| React/Vite renderer, routing, dev/prod origins | [Renderer Integration](references/renderer-integration.md) |
| Menus, tray, shortcuts, dialogs, downloads, native OS features | [Native OS Integration](references/native-os-integration.md) |
| Files, config, secrets, SQLite, native modules | [Data, Storage, and Native Integration](references/data-storage-native.md) |
| Testing, packaged smoke, logs, crash reporting | [Testing and Observability](references/testing-observability.md) |
| ASAR, fuses, signing, notarization, updates, CI | [Packaging, Release, and Updates](references/packaging-release-updates.md) |
| Reducing source exposure in distributed apps | [Source Protection](references/source-protection.md) |
| Reviews, migrations, release checklists, playbooks | [Review Playbooks](references/review-playbooks.md) |

## Workflow stages

### Workflow stage: Frame outcome and risk

Define what good looks like, which Electron boundary is touched, and what evidence is needed.

1. Identify the touched boundary first: main, preload, renderer, shared contracts, source build, packaging, updater, native module, or release pipeline.
2. Inspect local project facts before asking: Electron major, target platforms, build tool, renderer framework, native modules, updater model, and release channel when relevant.
3. Read only the matching reference. Use version-matched official Electron docs only when a version-sensitive fact, API, or migration point is needed.
4. Ask a narrow clarification only when the missing choice materially changes architecture, security posture, distribution, or irreversible release behavior.

Validation:

- The success criteria, touched boundary, and validation target are explicit.
- Assumptions are labeled if evidence is unavailable.

### Workflow stage: Preserve Electron boundaries

Make the smallest change that preserves security, runtime, and release invariants.

1. Keep privileged capabilities in main-owned services; keep preload role-specific; keep renderer browser-safe.
2. For IPC or preload work, use explicit capability methods, runtime schemas, sender validation, and serialized errors; never expose raw IPC or generic channel dispatch.
3. For windows or navigation, keep secure BrowserWindow defaults, deny-by-default popup/navigation policy, and validated external URL handling.
4. For source builds, packaging, source protection, updates, native modules, or signing, preserve packaged-runtime behavior and platform release requirements.

Validation:

- No new broad preload capability, unsafe BrowserWindow flag, unbounded navigation surface, renderer secret, or release-path regression is introduced.
- Any weaker compatibility fallback is documented with risk and compensating controls.

### Workflow stage: Verify and report

Prove the changed boundary and produce a concise, useful final answer.

1. Run the most relevant available check for the touched boundary: unit, IPC, preload, renderer, E2E, packaged smoke, artifact, signing, or update-feed check.
2. Use a packaged smoke or artifact check for packaging, updater, protocol, native module, signing, or release-pipeline changes when feasible.
3. Before finalizing, check correctness, grounding, formatting, and high-impact side effects.
4. Report changed files, validation run, and any unverified platform, signing, notarization, updater, or packaged-runtime risk.

Validation:

- Verification matches the changed Electron boundary, not only browser dev mode.
- Final output is concise and names any validation gap.

## Interop priority

- **TypeScript language, strict typing, schema-derived types, compiler errors, tsconfig, linting, and package-manager toolchain:** typescript-engineer. Electron-engineer owns Electron boundaries; TypeScript language and toolchain rules remain with typescript-engineer.
- **Node runtime behavior, streams, worker_threads, diagnostics, shutdown, ESM/CJS runtime details, and open handles:** node-engineer. Electron main and preload run on Node-adjacent runtimes, but Node runtime mechanics belong to node-engineer.
- **React renderer component architecture, routing internals, TanStack Query, Zustand, forms, and browser UI state:** react-spa-engineer. Renderer SPA architecture belongs to react-spa-engineer; Electron-engineer owns the desktop boundary around it.
- **Test runner policy, mocking strategy, coverage gates, Vitest, node:test, and CI test behavior:** typescript-test-engineer. Electron-engineer defines Electron test layers and release smoke needs; detailed TypeScript test policy belongs to typescript-test-engineer.
- **Security audit methodology, vulnerability severity, exploitability, secrets, CI permissions, and supply-chain threat review:** security-reviewer. Electron-engineer defines Electron-specific hardening defaults; security-reviewer owns audit process and severity.

## Gotchas

- **high** — Dev-mode renderer behavior is not proof that a packaged Electron app works; packaging changes origins, CSP, ASAR paths, protocols, signing, and update metadata.
- **high** — Do not introduce `nodeIntegration: true`, `contextIsolation: false`, disabled CSP, arbitrary navigation, or raw IPC for convenience.
- **high** — A generic preload bridge such as `invoke(channel, payload)` is a privilege-expansion bug pattern, not a production abstraction.
- **high** — Source protection raises the reverse-engineering cost but does not make client-side business logic secret; do not use obfuscation, bytecode, ASAR, or native wrappers as a replacement for server-side authorization, licensing checks, or signing/ASAR integrity.
- **high** — Auto-update is a supply-chain boundary; it needs signed artifacts, trusted metadata, rollback policy, and test feeds.
- **medium** — Native modules must be rebuilt and smoke-tested against Electron's bundled Node, target OS, target architecture, ASAR layout, and signing/notarization path.
- **medium** — Electron docs and examples are version-sensitive; check the project Electron major before applying API guidance from snippets or current docs.

## Policies

### Security defaults
Generate secure defaults first. If compatibility requires weaker settings, document the specific risk and implement the least-dangerous fallback with compensating controls.

### Release discipline
Treat packaging, signing, updater metadata, rollback, SBOM, provenance, and platform-specific smoke tests as part of product behavior, not post-build chores.

### Source protection discipline
For closed-source commercial Electron apps, protect against trivial source extraction by removing source maps and dev artifacts, minimizing readable bundles, considering targeted obfuscation or bytecode for main/preload/business-critical modules, and auditing packaged contents. Do not put secrets, private keys, licensing authority, or irreplaceable business logic exclusively in distributed client code.

### Retrieval and grounding budget
For version-sensitive Electron facts, inspect local manifests and lockfiles first. Fetch version-matched official Electron docs, release notes, or platform docs only when a required fact, API, date, migration risk, or source-backed claim is missing. Stop searching once the core decision is supported; if evidence remains missing, label the assumption instead of guessing.

### Output contract
For implementation work, report the outcome first, then changed surfaces, validation run, and remaining release or platform risk. For audits, lead with findings. For plans, include requirements, affected files/APIs, data flow or state changes when relevant, validation checks, failure behavior, privacy/security considerations, and material open questions.

### Missing context and stop rules
If required context is retrievable, look it up before asking. Ask only when the missing choice materially changes architecture, security, distribution, or irreversible release behavior. If proceeding with an assumption, state it and choose a reversible action.

### Active normative surface
The generated SKILL.md is the default active instruction surface. References become active for the task when selected from SKILL.md navigation or explicitly loaded by the agent; docs/* and investigations are supporting material only unless explicitly promoted by SKILL.md.

### Compiler maintenance
Maintain this skill through skill.yaml, fragments, references, and skill-source-compiler regeneration. Do not hand-edit generated SKILL.md as the source of truth.

## Optional references
- [Architecture](references/architecture.md) — Read this when designing process boundaries, window ownership, sessions, custom protocols, crash boundaries, offline-first behavior, or multi-window architecture.
- [Security, IPC, and Preload](references/security-ipc-preload.md) — Read this when configuring BrowserWindow security, preload APIs, IPC contracts, sender validation, CSP, navigation policy, or external URL handling.
- [Tooling and Project Structure](references/tooling-project-structure.md) — Read this when shaping project layout, package boundaries, ESM/CJS strategy, monorepo layout, or native-module boundaries.
- [TypeScript in Electron](references/typescript-in-electron.md) — Read this when configuring TypeScript for Electron main, preload, renderer, utility, or shared code; designing typed IPC/preload/window APIs; choosing tsconfig/moduleResolution/types; typing electron-vite env/imports/assets; handling ESM/CJS output; using decorators; or setting typecheck gates.
- [Build Process](references/build-process.md) — Read this when defining, implementing, reviewing, or debugging the Electron build pipeline, electron-vite scripts, Forge package/make/publish flow, CI build lanes, source-protection build steps, or packaged artifact validation.
- [Renderer Integration](references/renderer-integration.md) — Read this when integrating React, Vite, routing, custom app protocols, dev/prod renderer origins, CSP differences, or renderer test doubles.
- [Native OS Integration](references/native-os-integration.md) — Read this when designing or reviewing menus, tray, dock/taskbar, shortcuts, dialogs, clipboard, downloads, drag-and-drop, notifications, desktop capture, screen/display behavior, power APIs, dark mode, accessibility, or other native OS features.
- [Data, Storage, and Native Integration](references/data-storage-native.md) — Read this when handling app paths, config files, local state, secrets, SQLite, safeStorage, file import/export, or native modules.
- [Testing and Observability](references/testing-observability.md) — Read this when designing Electron test layers, debugging runtime issues, logging, crash reporting, diagnostics export, performance budgets, or packaged smoke tests.
- [Packaging, Release, and Updates](references/packaging-release-updates.md) — Read this when packaging, signing, notarizing, choosing distribution targets, configuring auto-updates, release channels, CI provenance, SBOM, or rollback policy.
- [Source Protection](references/source-protection.md) — Read this when reducing source-code exposure in distributed Electron apps, removing source maps and dev artifacts, choosing minification, obfuscation, bytecode, or deciding what business logic must leave the client.
- [Review Playbooks](references/review-playbooks.md) — Read this when reviewing Electron code, migrating Electron majors, auditing release readiness, or applying practical security and recovery playbooks.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory electron-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.
- Keep external documentation mentions optional and version-sensitive rather than required local dependencies.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
- Confirm the copied skill remains understandable and usable in isolation.
