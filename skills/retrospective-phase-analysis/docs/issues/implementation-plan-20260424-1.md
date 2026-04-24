# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260424-1`

## Related Issue

`RPA-05` — [issue-20260424-1.md](issue-20260424-1.md)

## Source Artifacts

- [issue-20260424-1.md](issue-20260424-1.md) — audited regression issue, acceptance criteria, constraints and non-goals.
- [improvement-proposal-20260423-1.md](improvement-proposal-20260423-1.md) — `RPA-04` artifact-driven discovery, conservative boundaries, structured-first metrics and validation-required rules.
- [improvement-proposal-20260415-1.md](improvement-proposal-20260415-1.md) — active-session boundary, trace-confirmed stage log extraction and scaffold/final report separation.
- [improvement-proposal-20260415-2.md](improvement-proposal-20260415-2.md) — skill-audit scope from operational session trace and avoidance of catalog/name-match noise.
- `SKILL.md` — generated active skill contract for trace-driven scoping, report status and CLI workflow.
- `references/CLI.md` — public CLI contract for `scan`, `report`, `skill-audit`, `logging-review`, candidates, metrics, `reportStatus` and limitations.
- `references/REFERENCE.md` — detailed evidence hierarchy, scope derivation, metrics precedence, skill-friction rules and anti-patterns.
- `references/SKILL-AUDIT-TEMPLATE.md` — expected skill audit output structure and evidence expectations.
- `fragments/overview.md` and `skill.yaml` — source bundle inputs for generated `SKILL.md`.
- `AGENTS.md` — code-backed generated skill maintenance contract.
- Runtime surfaces: `src/core/build-scan-summary.ts`, `src/core/extract-trace-scope.ts`, `src/core/summarize-logs.ts`, `src/core/extract-skill-scope.ts`, `src/core/infer-candidate-incidents.ts`, `src/parsers/stage-log.ts`, `src/render/report-markdown.ts`, `src/render/logging-review-markdown.ts`, `src/render/skill-audit-markdown.ts`, `src/core/types.ts`.
- Test surfaces: `test/scan.test.ts`, `test/report.test.ts`, `test/cli.test.ts`, `test/docs-contract.test.ts`, `test/fixtures/*`, `test/evaluation-contract.md`.
- Generated or derived outputs to refresh after implementation: `scripts/retro-cli.mjs`, `scripts/retro-cli.mjs.map`, `SKILL.md`, `docs/compile-report.md`.

## Objective

Добавить targeted regression coverage и report-status/report-rendering rules для case `dossier activity + referenced_only stage logs + zero included logs`, чтобы generated scaffolds не выглядели incident-free или reliable, когда все релевантные stage logs исключены. Реализация должна сохранить conservative boundary и artifact-gating правила из `RPA-04`: weak candidates остаются weak, auto-inclusion не расширяется, а manual overrides остаются evidence-justified.

## Assumptions

- Skill остается code-backed generated skill; source files, tests and references are edited first, then runtime and generated skill artifacts are rebuilt/regenerated.
- Existing `reportStatus.status = draft_requires_agent_validation` is sufficient for validation-required state unless implementation proves a narrower enum or field is necessary.
- `ArtifactCandidate.reason` can carry the inclusion reason, but the implementation may add a narrowly scoped `next_action` field if tests show that a separate field is the clearest way to satisfy the acceptance criterion.
- The regression should use synthetic portable fixtures, not real session paths or runtime-specific traces.
- Broad text matches in skill audit are not enough for active skill usage; accepted evidence must come from bounded operational trace fields, actual skill-open/use paths, or structured included stage-log skill metrics.

## Scope

Входит в scope:

- Dedicated regression fixture for `dossier activity + referenced_only stage logs + zero included logs`.
- `reportStatus` reason that names excluded stage-log candidates and says validation is required.
- Markdown report and logging review wording that treats metrics as incomplete, not as incident-free.
- Candidate rendering or summary data that exposes exact inclusion reason and next action for `referenced_only` stage logs inside an explicit same-session boundary.
- Skill-audit fixture and extraction adjustment to prevent catalog/name-only text matches from becoming active skill usage.
- Candidate incident inference from structured review FAIL events in included stage logs or bounded stage state, even when linked final review artifact is PASS.
- Tests, fixture updates, docs/runtime parity and regenerated artifacts required by this behavior.

Не входит в scope:

- Moving session-id resolution into the CLI.
- Broad-scanning `.dossier/stages/*` or `.dossier/reviews/*` by feature id alone.
- Auto-including weak `referenced_only` candidates without stronger evidence or explicit justified override.
- Redesigning the full report narrative style.
- Reworking unrelated retrospective automation issues beyond the `RPA-05` regression case.

## Proposed Changes

- Add focused fixtures under `test/fixtures/`:
  - a session trace with dossier activity and explicit same-session boundary where `.dossier/logs/...` appears only as `referenced_only`;
  - matching project artifacts showing the log exists but lacks trace write/change evidence;
  - a skill-audit trace where skill names appear in catalog or broad copied text but no actual skill-open/use evidence exists;
  - a stage log or bounded stage-state fixture with structured review FAIL followed by final PASS artifact linkage.
- Update `src/core/build-scan-summary.ts`:
  - distinguish the existing generic zero-stage-log reason from the stronger case where stage-log candidates exist but none are included;
  - include candidate names and validation-required next action in `reportStatus.reasons`;
  - preserve `ready_for_agent_finalization` for genuinely clean scans.
- Update `src/core/extract-trace-scope.ts` and `src/core/types.ts` only if needed:
  - keep `referenced_only` as `not_included`;
  - ensure each referenced-only stage-log candidate has precise `reason`;
  - optionally add a stable `next_action` field to `ArtifactCandidate` and document/update snapshots if this is clearer than overloading `reason`.
- Update renderers:
  - `src/render/report-markdown.ts`: when stage logs are excluded and none are included, make `Candidate incidents` explicitly "not reliable until excluded stage-log candidates are validated" instead of presenting `0` as a trustworthy incident-free result;
  - `src/render/logging-review-markdown.ts`: state that log-derived metrics are incomplete and list the excluded stage-log candidates or point to report-status reasons;
  - `src/render/skill-audit-markdown.ts`: keep empty audit output for no active usage evidence and avoid sections from catalog/name-only matches.
- Update skill-audit extraction in `src/core/extract-skill-scope.ts`:
  - treat injected catalog and copied catalog-like blocks as dictionary/context only;
  - prefer actual skill-open/use evidence such as `skills/<name>/SKILL.md`, accepted tool/command path fields, or structured included stage-log `skills_used`;
  - avoid broad `function_call_output.output` or large copied text blobs unless they are explicitly accepted operational evidence.
- Update `src/core/infer-candidate-incidents.ts`, `src/core/summarize-logs.ts`, and `src/parsers/stage-log.ts` as needed:
  - parse or normalize structured review events from metadata/stage state;
  - emit candidate incidents for structured FAIL/non-compliant review events before a final PASS;
  - avoid double-counting when structured `review_findings_total` already covers the same failure.
- Update active docs:
  - `references/CLI.md` for validation-required zero-included-log behavior, candidate reason/next-action contract, and skill-audit evidence rules;
  - `references/REFERENCE.md` for the regression rule and structured FAIL incident inference;
  - `references/SKILL-AUDIT-TEMPLATE.md` if needed to require actual evidence over catalog/name-only matches;
  - `fragments/overview.md` and `skill.yaml` only if active `SKILL.md` needs a short rule or manifest copy coverage.
- Rebuild/regenerate:
  - run package build to refresh `scripts/retro-cli.mjs` and map;
  - run skill-source-compiler regeneration/check so `SKILL.md` and `docs/compile-report.md` stay aligned.
- Update `docs/README.md` with this implementation plan and, during implementation, the implementation log.

## Implementation Steps

1. Add the `RPA-05` regression fixtures in `test/fixtures/` using relative paths and synthetic session ids.
2. Write failing tests first in the smallest relevant files:
   - `test/scan.test.ts` for scan summary status, candidates, skill-audit extraction and structured FAIL incidents;
   - `test/report.test.ts` for Markdown/reporting wording;
   - `test/cli.test.ts` only if serialized CLI behavior or stdout/run-dir flow changes;
   - `test/docs-contract.test.ts` for active docs terms.
3. Implement scan summary status changes in `build-scan-summary.ts` and candidate reason/next-action behavior in `extract-trace-scope.ts` or `types.ts` if required.
4. Implement skill-audit evidence filtering in `extract-skill-scope.ts` without reintroducing directory-wide skill fan-out.
5. Implement structured review FAIL incident inference from included logs/stage state while preserving structured-over-prose precedence and no double counting.
6. Update Markdown renderers to show incomplete metrics and validation-required status for zero included logs with excluded candidates.
7. Update `references/*`, `fragments/overview.md`, `skill.yaml` and docs contract tests for docs/runtime/test parity.
8. Run package build, tests and typecheck; update generated `scripts/*` and generated skill files through the established commands.
9. Create `docs/logs/implementation-log-20260424-1.md` during implementation and update `docs/README.md`.

## Verification Plan

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli build`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis`
- Portability scan for absolute local paths and Windows drive paths in `skills/retrospective-phase-analysis`.
- Manual fixture walkthrough:
  - confirm stage-log candidates are `referenced_only`, `not_included`, and named in validation-required reasons;
  - confirm generated main report and logging review say metrics are incomplete, not incident-free;
  - confirm skill-audit ignores catalog/name-only matches and includes only active usage/open evidence;
  - confirm structured FAIL review events produce candidate incidents even when final review artifact is PASS;
  - confirm `RPA-04` conservative boundary and artifact-gating tests still pass.

## Risks and Side Effects

- Risk: wording changes could make all zero-stage-log scans look blocked even when there are no meaningful stage-log candidates.
  - Mitigation: trigger the stronger reason only when dossier activity and excluded stage-log candidates exist.
- Risk: skill-audit filtering could hide legitimate skill use mentioned in normal assistant text.
  - Mitigation: accept bounded operational fields and explicit skill-open/use evidence, and cover examples with tests.
- Risk: adding `ArtifactCandidate.next_action` could alter serialized scan-summary shape.
  - Mitigation: make the field additive, document it, update golden snapshots and keep existing `reason` stable.
- Risk: structured FAIL inference could double-count review failures already represented by `review_findings_total`.
  - Mitigation: keep structured-over-prose precedence and deduplicate by log/stage/reason class.
- Risk: generated artifacts drift from source.
  - Mitigation: build and regenerate from source bundle, then run skill-source-compiler check.
- Destructive side effects: none expected; changes are scoped to this skill's docs, runtime, tests, fixtures and generated artifacts.

## Rollback Plan

Revert the files changed for `RPA-05`: added fixtures/tests, runtime changes, docs/reference updates, `skill.yaml` or `fragments/overview.md` changes, regenerated `scripts/*`, generated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun package tests and `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis` to confirm the skill is internally consistent again.

## Independent Audit

Audit status: `REVIEWED`

Auditor: `Epicurus`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:
- Verdict: `PASS`.
- The plan covers all `RPA-05` acceptance criteria: zero included `referenced_only` logs, validation-required `reportStatus`, incomplete metrics wording, skill-audit filtering and structured FAIL incidents.
- The plan preserves `RPA-04` boundaries: no weak auto-inclusion, no feature-id broad scan, no CLI session-id resolution and evidence-justified manual overrides.
- The plan accounts for the code-backed generated workflow: source-first edits, build/regenerate, generated `SKILL.md`, `scripts/*`, `docs/compile-report.md`, tests and portability checks.

Required corrections:
- None.

Final status: `PASS`
