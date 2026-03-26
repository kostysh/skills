# Changelog

## v2.0.1

- Restored the explicit separate-reviewer-agent instruction as the default execution model for independent review when the platform supports agent spawning.
- Kept `debt-audit` marker-only and clarified that implementation completeness belongs to mandatory review, not to debt-marker scanning.
- Expanded `implementation` review requirements with explicit completeness review, code review, and security review.

## v2.0.0

- Added explicit multi-dimensional state model: backlog status, dossier status, `coverage_gate`, review freshness, and step closure.
- Added machine-checkable process artifacts and scripts: `dossier-verify`, `review-artifact`, `dossier-step-close`, `contract-drift-audit`, `next-step`, `index-refresh`.
- Reworked `coverage-audit` to use `coverage_gate` and scoped orphan reporting.
- Reworked `lint-dossiers` to be read-only by default and aligned it with explicit coverage gating.
- Kept `debt-audit.mjs` as a marker-only compatibility entrypoint and added `marker-audit.mjs` alias.
- Reworked `sync-index` and `index-refresh` to reduce dirty-diff churn and keep a single orchestrated writer path.
- Updated templates, operational workflow docs, repo `AGENTS.md` template, and example repo to match the new process contract.
