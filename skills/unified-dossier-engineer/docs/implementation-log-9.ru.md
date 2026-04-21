# Implementation Log 9: operator-facing stage-log restoration

## Scope

Implement [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) to restore operator-facing value in intake/stage logs without weakening deterministic telemetry or closure truth.

## Delivered changes

- active log references now explicitly require operator-facing narrative evidence, not only thin telemetry
- `utility-spec.ru.md` now aligns bootstrap/update rules with the richer log contract
- shipped runtime log renderer now materializes a canonical scaffold for:
  - `feature-intake`
  - primary stage-controller logs
- stage-controller reruns preserve authored narrative sections instead of collapsing logs back to a mechanical summary
- helper-owned closure updates through `dossier-step-close` also preserve authored narrative sections
- docs-contract and CLI tests now protect:
  - active log references
  - utility-spec parity
  - bootstrap scaffold shape
  - preservation across stage reruns
  - preservation across helper-owned close-out rewrites

## Validation

- `pnpm typecheck`
- `pnpm test`
- `pnpm format`
- `pnpm lint`
- `skill-source-compiler lint`
- `skill-source-compiler compile`
- `skill-source-compiler check`

## Notes

- The implementation keeps `transition_events[]` authoritative for mechanical transitions.
- The implementation does not reintroduce prose inference or a second reasoning artifact.
- The implementation intentionally keeps empty required sections as `none` to avoid drifting back into prose-heavy logs.
