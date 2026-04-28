# Packaging, Release, and Updates

Use this reference when signing, notarizing, choosing distribution targets, configuring auto-updates, release channels, CI provenance, SBOM, or rollback policy. For the command sequence from source build to package/make/publish, use [Build Process](build-process.md). For reducing readable source exposure in shipped artifacts, also use [Source Protection](source-protection.md).

## Packaging Baseline

Release behavior is product behavior. Treat packaging config as code that needs review and tests. The source build must already be complete before Forge package/make/publish runs; see [Build Process](build-process.md).

Baseline:

- ASAR packaging where appropriate
- explicit ASAR unpacking for native modules and external binaries
- Electron fuses reviewed and configured
- ASAR integrity enabled when supported by the chosen toolchain
- source exposure audit completed for sourcemaps, dev artifacts, readable bundles, and accidental secrets
- release artifacts named and versioned deterministically
- app name, bundle/application IDs, icons, desktop categories, file associations, protocol handlers, and platform resources reviewed
- checksums generated
- platform-specific smoke tests run against packaged artifacts

ASAR is not a security boundary by itself. Integrity, fuses, signing, and trusted update metadata provide the release trust story. Source protection is a separate concern: it makes bundled code harder to inspect, but it does not replace integrity, signing, authorization, or server-side licensing controls.

## Platform Targets

| Platform | Common targets | Required release concerns |
| --- | --- | --- |
| macOS | DMG and ZIP | Developer ID signing, hardened runtime, notarization, stapling, entitlements, helper binaries |
| Windows | NSIS, Squirrel.Windows, MSI/WiX, MSIX | Authenticode signing, timestamping, installer/update mechanism, SmartScreen/reputation expectations |
| Linux | AppImage, deb, rpm, Flatpak, Snap | distro expectations, package-manager trust, sandbox model, checksums, provenance, update model |

Choose targets based on users and deployment environment, not on what is easiest to build locally.

## Store and Managed Distribution Targets

Store targets such as Mac App Store, MSIX, Windows Store, Flatpak, Snap, or enterprise-managed channels are product decisions. Do not add them as incidental makers.

Before committing to a store or managed target, review:

- sandbox model and entitlement/capability requirements
- filesystem, network, background, login item, screen capture, notification, and auto-launch constraints
- update strategy: store-managed, enterprise-managed, or app-managed
- package identity, signing identity, icons, metadata, privacy labels, and review requirements
- runtime checks such as `process.mas` or `process.windowsStore` when behavior must differ
- whether self-update is prohibited, redundant, or allowed for that target

Run a separate smoke check against the store-shaped or sideloaded artifact when feasible. A direct-download build passing smoke tests does not prove the store target is valid.

## Signing and Notarization

macOS:

- sign app and helper binaries
- use hardened runtime for outside-App-Store distribution
- notarize release artifacts
- staple notarization ticket when distributing directly
- review entitlements before adding native modules or plugins

Windows:

- sign installers and executables
- timestamp signatures
- use public-trusted certificates for public distribution
- treat self-signed certificates as development/test only

Linux:

- align with the chosen package ecosystem
- publish checksums and provenance
- consider repository/package-manager trust for enterprise users

## Auto-Update Architecture

Built-in Electron auto-update support differs by platform and package target. Linux often relies on package-manager or vendor tooling rather than the built-in updater.

Choose update strategy explicitly:

| Scenario | Strategy |
| --- | --- |
| open-source app on public GitHub Releases, macOS/Windows only | built-in updater with compatible metadata service |
| commercial app with object storage and controlled metadata | built-in updater with own static feed or server |
| private providers, staged channels, integrated Linux updater needs that Forge cannot satisfy | non-canonical vendor updater or packaging stack, with trade-offs documented through [Build Process](build-process.md) |
| enterprise managed or air-gapped endpoints | package-manager, MSIX, MSI, deb/rpm, or IT-controlled channel; no self-update by default |

Update security requirements:

- signed app and updater-compatible package
- TLS and trusted update origin
- immutable release artifacts
- channel isolation
- staged rollout when appropriate
- rollback artifacts retained
- downgrade policy explicit
- fake update feed tests in CI
- telemetry for check, download, install, and rollback failures

## CI Lanes

Use separate lanes. For exact build-stage ordering, use [Build Process](build-process.md).

- PR: lint, typecheck, unit, IPC, preload, renderer tests, dependency review
- nightly: unsigned or internal packaged artifacts and smoke tests
- beta: signed prerelease artifacts, canary channel, fake-update integration tests
- stable: sign, notarize, publish, checksums, SBOM, provenance or attestation, release notes
- hotfix: narrow cherry-pick with the same signing and updater gates
- dry run: all release steps except public publish

Do not first discover signing, notarization, or updater failures in a public stable release.

## Supply Chain

For release workflows:

- minimize signing secret exposure
- prefer short-lived credentials or managed signing when possible
- restrict release runners and protected tags/branches
- generate SBOM or dependency inventory
- run dependency and license review
- create artifact provenance or attestations where supported
- keep release metadata auditable

Treat update metadata, installers, blockmaps, manifests, checksums, and app archives as sensitive release artifacts.

## Electron Upgrade Releases

Electron upgrades require release checks beyond dependency install:

- read version-matched Electron docs and breaking changes
- rebuild native modules
- validate sandbox, preload, protocol, and webPreferences behavior
- run packaged smoke on supported OS and architecture lanes
- verify signing/notarization still passes
- verify updater compatibility and metadata generation
- check bundled Chromium/Node changes for security and runtime impact
