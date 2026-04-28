# Source Protection

Use this reference when reducing source-code exposure in distributed Electron apps, removing source maps and dev artifacts, choosing minification, obfuscation, bytecode, or deciding what business logic must leave the client. For where these checks run in the standard build pipeline, use [Build Process](build-process.md).

## Goal and Boundary

Source protection is about preventing trivial theft of business logic by unpacking an installer or `app.asar` and reading readable JavaScript. It is not a cryptographic guarantee and does not replace signing, notarization, ASAR integrity, Electron fuses, updater trust, authorization, or server-side license enforcement.

Assume a determined user can inspect client-side code eventually. The engineering goal is to:

- remove accidental disclosure
- raise the reverse-engineering cost
- prevent casual repackaging or source browsing
- move irreplaceable business authority out of the distributed client
- keep packaged runtime behavior testable

## Threat Model

| Risk | Mitigation |
| --- | --- |
| User extracts `app.asar` and reads business logic | bundle, minify, obfuscate or bytecode selected modules; audit packaged contents |
| User reads sourcemaps to recover original TypeScript | do not ship production sourcemaps unless explicitly approved and access-controlled |
| User finds secrets in bundles | remove secrets from client code; use server-side or OS-managed secret flows |
| User modifies code and repackages app | signing, notarization, ASAR integrity, fuses, updater trust, runtime integrity checks |
| User bypasses licensing logic in client | server-side entitlement checks; signed license tokens; no client-only licensing authority |
| Obfuscation breaks runtime or debugging | test packaged artifacts on every target OS and architecture |

## Non-Negotiables

- Do not ship `.map` files, original TypeScript, test fixtures, debug builds, `.env` files, private keys, signing credentials, or internal docs in production packages.
- Do not store API secrets, license secrets, encryption keys, or private algorithms as readable strings in renderer, preload, or main bundles.
- Do not rely on ASAR as source-code protection. ASAR packaging is easy to inspect; ASAR integrity is for tamper detection.
- Do not rely on obfuscation or bytecode for authorization. Any business-critical permission decision must be verified server-side or with a signed authority model.
- Do not weaken Electron sandbox, context isolation, or preload boundaries just to support a source-protection tool unless the risk is explicitly accepted and compensated.

## Protection Layers

Use layered controls:

1. **Architecture first**: keep truly sensitive logic on a backend or service the user cannot inspect. Keep the desktop client as a capability-limited UI and local runtime.
2. **Bundle and minify**: ship production bundles, not source trees. Strip comments, debug code, sourcemaps, test files, fixtures, and dead feature branches.
3. **Targeted obfuscation**: use obfuscation for business-critical modules where it does not break runtime, diagnostics, accessibility, or support workflows.
4. **Bytecode where appropriate**: consider V8 bytecode or toolchain-specific bytecode features for main/preload or other supported Node-side bundles, but validate platform, architecture, Electron/V8 version, preload sandbox implications, and crash behavior.
5. **Integrity and signing**: enable ASAR integrity/fuses where supported and sign/notarize/timestamp artifacts so modified packages are detected or lose platform trust.
6. **Runtime and server checks**: pair client hardening with server-side entitlement, feature gating, update trust, and telemetry for tamper/update failures.

## Closed-Source Baseline

For a commercial closed-source Electron app, default to this baseline unless the product explicitly accepts source exposure:

- production bundles only; no raw source tree in `resources/`
- minification enabled for renderer, preload, and main bundles where compatible
- production sourcemaps disabled or stored outside the public package behind controlled error-reporting access
- `app.asar` enabled to avoid casual source browsing
- ASAR integrity enabled where supported
- `OnlyLoadAppFromAsar` enabled where compatible so Electron does not fall back to loose app code
- unneeded fuses disabled, especially debug/runtime extension surfaces that are not part of production behavior
- source exposure audit in CI against the packaged artifact, not only the build directory
- bytecode or targeted obfuscation considered for main/preload modules that contain offline proprietary logic

Do not implement custom ASAR encryption by forking or patching Electron as the default answer. It creates long-term maintenance, platform, signing, update, and security-review costs. Consider it only as a deliberate product/security program with owner-approved residual risk.

## Protection Tiers

| Tier | Use when | Controls |
| --- | --- | --- |
| Public or low-risk UI | Source exposure is acceptable | normal production bundle, no secrets, no sourcemaps unless intended |
| Commercial baseline | Avoid trivial extraction from package | minify, no sourcemaps, ASAR, artifact audit, signing, ASAR integrity/fuses |
| High-value offline logic | Logic must run locally but should be hard to inspect | isolate module, bytecode or targeted obfuscation, protected strings, packaged smoke per OS/arch, server/license checks where possible |
| Cannot leak | Extraction would materially harm the business | move authority logic server-side or into a controlled service; do not rely on Electron client protection |

## Minification and Obfuscation

Minification is a baseline readability reduction, not protection by itself. Obfuscation can raise the cost of reverse engineering but has trade-offs:

- harder crash stack traces and support diagnostics
- possible performance overhead
- higher false-positive risk from antivirus tools
- broken dynamic code patterns, reflection, `Function.prototype.toString`, or framework assumptions
- harder security scanning and code review of emitted artifacts

Apply obfuscation selectively. Do not obfuscate everything by default if it makes releases fragile or support impossible.

Recommended policy:

- renderer UI: minify by default; obfuscate only business-sensitive client logic that cannot move elsewhere
- preload: protect carefully; never broaden preload privileges to support obfuscation
- main: suitable for stronger protection if packaged smoke tests cover startup, IPC, updater, storage, and native integrations
- shared contracts: usually keep stable and inspectable unless they encode sensitive algorithms

## Bytecode and Native/WASM Wrappers

Bytecode can hide source text better than minification, but it is not absolute protection:

- V8 bytecode is tied to Electron/V8 and can be sensitive to architecture or runtime version
- tooling may support only main/preload, not renderer
- preload bytecode may require Node APIs and can conflict with sandbox expectations; prefer moving protected logic to main or a utility process before disabling preload sandbox
- static strings can remain recoverable unless protected separately
- stack traces and support diagnostics become harder

Native modules or WASM can raise the reverse-engineering cost for selected algorithms, but they introduce ABI, signing, notarization, packaging, and platform support costs. Do not move logic into native code merely to hide it unless the product value justifies the release burden.

## Tooling Guidance

Prefer source-protection tooling that integrates with the existing build system and can be verified in packaged smoke tests:

- Canonical electron-vite projects: evaluate built-in bytecode support for main/preload and its documented limitations before adding separate obfuscators.
- Non-Vite or custom pipelines: evaluate V8 bytecode tooling only if it can compile against the exact Electron runtime used by the app.
- Obfuscators: apply after bundling where practical, pin versions, and keep a small protected surface.
- Native/WASM: use only for high-value isolated algorithms with explicit release ownership.

Avoid protection tools that require broad runtime changes, unsafe dynamic evaluation, disabled context isolation, exposed Node integration in renderer, or a nonstandard updater path.

## Business Logic Placement

Classify business logic before choosing a protection method:

| Logic type | Placement |
| --- | --- |
| UI workflows and presentation rules | client bundle; minify |
| Local-only convenience algorithms | client bundle; minify or targeted obfuscation |
| Paid feature entitlements | server-side authority or signed license token verification |
| Pricing, fraud, abuse, or authorization policy | server-side |
| Proprietary algorithms that must run offline | consider bytecode/native/WASM plus licensing and tamper controls; accept residual reverse-engineering risk |
| Secrets and private keys | never ship in client |

If the business cannot tolerate extraction, the logic cannot live only in the distributed Electron client.

## Packaged Artifact Audit

Before release, inspect the packaged app contents:

- no `.map`, `.ts`, `.tsx`, `.jsx`, source fixtures, snapshots, tests, storybook output, or debug-only files unless explicitly approved
- no `.env`, private keys, certificates, provisioning profiles, signing files, or internal configuration
- no dev server URLs, localhost fallbacks, or HMR artifacts
- no readable business-critical modules outside the accepted protection policy
- ASAR integrity and `OnlyLoadAppFromAsar` are enabled where supported and compatible
- protected bundles run in packaged smoke tests on every target OS and architecture

Suggested audit patterns:

- list `app.asar` contents and search for source extensions, sourcemaps, tests, fixtures, `.env`, private keys, and internal docs
- unpack or inspect only in CI scratch space; do not commit unpacked artifacts
- scan both `app.asar` and `app.asar.unpacked`
- verify bytecode/obfuscation output replaced the readable module it is meant to protect
- verify no build step copied original source beside the protected output
- verify crash reporting can map obfuscated frames through private, non-shipped sourcemaps when needed

For source-protection changes, verify both extraction resistance and runtime behavior. A package that hides code but breaks updater, preload, sandbox, or crash diagnostics is not production-ready.

## Review Questions

Ask these before approving a source-protection plan:

- Which business logic is actually sensitive, and why can it not move server-side?
- What attacker is in scope: casual unzip, competitor analysis, license bypass, or skilled reverse engineering?
- Are sourcemaps and original sources absent from packaged artifacts?
- Are secrets absent from client bundles and string literals?
- Does the protection tool require disabling sandbox or other Electron security controls?
- Are protected artifacts tested after packaging, signing, and notarization?
- Can support still diagnose crashes without exposing original source?
- Is the residual extraction risk accepted by the product owner?
