# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260428-1`

## Related Issue

`issue-20260428-1` — `docs/issues/issue-20260428-1.md`

## Source Artifacts

- `docs/issues/issue-20260428-1.md`
- `skill.yaml`
- `fragments/overview.md`
- `references/architecture.md`
- `references/security-ipc-preload.md`
- `references/testing-observability.md`
- `references/data-storage-native.md`
- `references/packaging-release-updates.md`
- `references/review-playbooks.md`
- `references/build-process.md`
- `references/source-protection.md`
- `references/renderer-integration.md`
- `references/tooling-project-structure.md`
- Reviewed local Electron example skills summarized in the issue: generated Electron API topic map, architecture/scaffold skills, backend/packaging examples, and upgrade-discipline notes.

## Objective

Расширить `electron-engineer` production guidance так, чтобы native OS integration, app lifecycle, permissions, diagnostics, heavy-work isolation, data migrations, embedded backends, store targets, and release verification стали явно discoverable через focused references и checklists, без превращения скила в Electron API encyclopedia.

## Assumptions

- Скил остается documentation-only и поддерживается через `skill-source-compiler`.
- `electron-vite` остается canonical source build layer, а Electron Forge остается canonical package/make/publish distribution layer.
- Новые материалы должны быть переносимыми: без absolute local paths и без обязательной зависимости от внешних локальных example skills.
- Version-sensitive Electron API details должны быть сформулированы как guidance с требованием проверять project Electron major и official docs при реализации.
- Новая информация должна быть concise и production-oriented: decision tables, ownership rules, anti-patterns, verification checks.

## Scope

Included:

- Add `references/native-os-integration.md`.
- Register the new optional reference in `skill.yaml`.
- Add the new reference to `fragments/overview.md` navigation.
- Update existing references listed in the related issue.
- Check all existing active references for ownership conflicts. Update `source-protection.md`, `renderer-integration.md`, or `tooling-project-structure.md` only if the new guidance creates overlap or needs a pointer.
- Update `docs/README.md` and `skill.yaml` supporting entries for this plan and later implementation log.
- Regenerate compiler-owned files.

Excluded:

- Copying API-reference content from example skills.
- Adding Electron EGG, UpgradeLink, electron-builder, Forge Vite plugin, or Webpack guidance as baseline.
- Adding runtime scripts, package-audit scripts, or security scanner integration.
- Implementing a full project scaffold.
- Changing canonical build process beyond links back to `references/build-process.md`.

## Proposed Changes

1. `skill.yaml`
   - Bump `skill.source-version`.
   - Add optional reference `ref-native-os-integration`.
   - Add supporting entry for this implementation plan.
   - Add supporting entry for the implementation log when implementation is performed.

2. `fragments/overview.md`
   - Add `Native OS integration` row in Reference Navigation.
   - Keep root guidance lean; do not duplicate topic details in `SKILL.md`.

3. `references/native-os-integration.md`
   - Define ownership rules for Electron native features:
     - main owns privileged OS interactions;
     - preload exposes narrow capability methods;
     - renderer owns UI and user intent.
   - Cover:
     - menus, context menus, tray, dock, taskbar, recent documents, launcher actions;
     - local/global shortcuts and cleanup;
     - dialogs, clipboard, downloads, drag-and-drop;
     - notifications, desktop capture, screen/display, power monitor/save blocker, dark mode, accessibility;
     - per-feature validation, cleanup, and testing expectations.
   - Link to `Build Process` only for packaged artifact/resource validation, not for command ordering.

4. `references/architecture.md`
   - Add lifecycle and activation section:
     - `app.whenReady()`;
     - single instance lock and `second-instance`;
     - macOS `open-file`, `open-url`, `activate`;
     - tray-only app quit semantics;
     - route/file/deep-link normalization before renderer commands.
   - Add heavy-work isolation section:
     - main process must not own long CPU-bound or crash-prone work;
     - prefer `utilityProcess` for Node-side isolated work where Electron fuses may disable `child_process.fork`;
     - use workers only for browser-safe renderer work or proven worker-safe Node work;
     - use `MessagePort`/stream handoff for large or frequent payloads instead of chatty IPC.
   - Add embedded-context decision note for `iframe`, `WebContentsView`, and `<webview>` with detailed security rules deferred to `security-ipc-preload.md`.

5. `references/security-ipc-preload.md`
   - Add session permission policy:
     - deny-by-default `setPermissionRequestHandler`;
     - scope permission grants by session, origin, window role, and permission type;
     - require explicit product reason for notifications, media, geolocation, desktop capture, and remote content.
     - define session partition ownership for trusted app UI, remote content, auth flows, and private windows;
     - require cookies/storage cleanup for logout, account switch, private windows, and remote/untrusted sessions.
   - Add web embed security policy:
     - prefer sandboxed `iframe` or main-controlled `WebContentsView`;
     - `<webview>` only as reviewed exception with `will-attach-webview` validation and strict `webPreferences`.

6. `references/testing-observability.md`
   - Add diagnostics matrix:
     - command-line switches;
     - Electron/Node environment variables;
     - net logging;
     - content tracing;
     - CDP/debugger;
     - crash dumps, heap snapshots, performance traces.
   - Classify dev-only versus production-safe diagnostics.
   - Add manual security scenarios and packaged verification cases.
   - Add checks for utility-process crashes, worker/native-module failures, MessagePort backpressure, and session cleanup.
   - Keep performance budgets project-specific.

7. `references/data-storage-native.md`
   - Add app data migration guidance:
     - idempotency;
     - backup before destructive migration;
     - partial-failure recovery;
     - rollback or safe-mode behavior.
   - Add embedded backend boundary:
     - bind to loopback;
     - random port where feasible;
     - capability token/auth;
     - strict CORS;
     - lifecycle shutdown;
     - no privileged unauthenticated localhost API.

8. `references/packaging-release-updates.md`
   - Add store-target decision guidance for MAS, MSIX, and Windows Store.
   - Require sandbox/capability/entitlement review.
   - Add compatibility checks for `process.mas` and `process.windowsStore` where relevant.
   - Require store-specific updater strategy and smoke tests.

9. `references/review-playbooks.md`
   - Add review red flags:
     - unchecked permissions;
     - missing cookies/storage cleanup for logout/private/remote sessions;
     - unmanaged global shortcuts or power blockers;
     - unsafe web embeds;
     - heavy work left in main process;
     - `child_process.fork` dependency when production fuses disable run-as-node behavior;
     - local backend without auth;
     - migrations without backup/recovery;
     - missing icon/metadata/assets/store checks.

10. `references/source-protection.md`
   - Check whether run-as-node, inspector, and node-options fuse guidance conflicts with heavy-work guidance.
   - Add a short pointer if needed: protected or isolated Node-side work should prefer `utilityProcess` when fuses make `child_process.fork` inappropriate.

11. `references/renderer-integration.md`
   - Check whether renderer-owned UI, routing, desktop capture UI, or permission prompts need a pointer to `Native OS Integration` or `Security, IPC, and Preload`.
   - Do not duplicate native OS or permission policy here.

12. `references/tooling-project-structure.md`
   - Check whether package boundaries need a short pointer for utility-process entrypoints or native OS services.
   - Do not add build command sequencing here; keep command order in `Build Process`.

## Implementation Steps

1. Update `skill.yaml` with version bump, optional native OS integration reference, and supporting plan/log entries.
2. Add `references/native-os-integration.md` with concise decision tables and checklists.
3. Update `fragments/overview.md` navigation to expose the new reference.
4. Update `architecture.md` for lifecycle, activation, single-instance, tray semantics, heavy-work isolation, utility processes, MessagePort handoff, and embedded-context choice.
5. Update `security-ipc-preload.md` for permissions, session partition ownership, cookies/storage cleanup, desktop capture/media review, and web embed hardening.
6. Update `testing-observability.md` for diagnostics matrix, manual security scenarios, session cleanup checks, utility-process/worker checks, and packaged checks.
7. Update `data-storage-native.md` for migrations and embedded backend boundaries.
8. Update `packaging-release-updates.md` for store targets and platform release constraints.
9. Update `review-playbooks.md` for the new review red flags and release checks.
10. Inspect `source-protection.md`, `renderer-integration.md`, and `tooling-project-structure.md`; add only pointers needed to avoid ownership gaps or conflicts.
11. Create implementation log under `docs/logs/`.
12. Run compiler validation and portability checks.
13. Review generated `SKILL.md` and `docs/compile-report.md` for expected reference reachability and no unintended bloat.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/electron-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/electron-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/electron-engineer`
- Search `skills/electron-engineer` for absolute local paths.
- Confirm `SKILL.md` lists `Native OS Integration` under optional references.
- Confirm `docs/compile-report.md` includes the new reference, issue, plan, and implementation log.
- Confirm `references/build-process.md` remains the only place with canonical build command sequencing.
- Confirm non-canonical builders remain only as explicit exceptions or anti-patterns.
- Confirm no added reference is an API encyclopedia or long code-snippet collection.
- Confirm heavy-work isolation is reachable from `architecture.md`, validated in `testing-observability.md`, and reviewable from `review-playbooks.md`.
- Confirm session partition ownership and cookies/storage cleanup are reachable from `security-ipc-preload.md` and reviewable from `review-playbooks.md`.
- Confirm `source-protection.md` has no conflict with utility-process/fuse guidance.
- Confirm `renderer-integration.md` and `tooling-project-structure.md` either have necessary pointers or were intentionally left unchanged because their ownership remains separate.

## Risks and Side Effects

- Risk: skill bloat and weaker progressive disclosure.
  - Mitigation: one focused new reference; targeted updates elsewhere; no API reference copying.
- Risk: duplicated or conflicting guidance across references.
  - Mitigation: assign topic ownership explicitly and link instead of repeating build/process guidance.
- Risk: stale Electron API details.
  - Mitigation: phrase version-sensitive items as checks and require version-matched official docs during implementation.
- Risk: canonical build baseline drift.
  - Mitigation: keep all build sequence references pointing to `references/build-process.md`.
- Risk: supporting docs drift from generated files.
  - Mitigation: use `skill-source-compiler regenerate` and `check`.

## Rollback Plan

If implementation introduces confusion or excessive surface area:

- Revert the new `references/native-os-integration.md`.
- Remove `ref-native-os-integration` and supporting implementation-log entries from `skill.yaml`.
- Revert targeted edits in active references.
- Regenerate `SKILL.md` and `docs/compile-report.md`.
- Keep `issue-20260428-1.md` and this plan as supporting history unless the operator explicitly asks to remove historical artifacts.

## Independent Audit

Audit status: `PASS`

Auditor: spawned independent agents `Ampere` and `Kierkegaard`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- First audit result: `FAIL`. Required corrections covered missing heavy-work isolation, session cleanup, active-reference ownership coverage, and verification reachability.
- Corrections applied: heavy-work isolation added to proposed changes, implementation steps, verification plan, and review red flags; session partition/cookies/storage cleanup added; `source-protection.md`, `renderer-integration.md`, and `tooling-project-structure.md` added to source artifacts and ownership checks.
- Repeat audit result: `PASS`.
- Repeat audit findings: none.

Required corrections: none.

Final status: `PASS`
