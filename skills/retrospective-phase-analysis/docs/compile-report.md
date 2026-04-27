# Compile report
Generated from `skill.yaml`.

## Versions
- Skill source version: `0.1.1`
- CLI package version: `0.1.1`

## Source files
- `agents/openai.yaml`
- `assets/metrics-schema.json`
- `fragments/overview.md`
- `package.json`
- `references/CLI.md`
- `references/LOGGING-IMPROVEMENTS-TEMPLATE.md`
- `references/PROJECT-ADAPTATION.md`
- `references/REFERENCE.md`
- `references/REPORT-TEMPLATE.md`
- `references/SKILL-AUDIT-TEMPLATE.md`
- `scripts/retro-cli.mjs`
- `scripts/retro-cli.mjs.map`
- `skill.yaml`
- `src/cli.ts`
- `src/cli/command-registry.ts`
- `src/cli/errors.ts`
- `src/cli/parse-argv.ts`
- `src/cli/run-cli.ts`
- `src/commands/index.ts`
- `src/commands/logging-review.ts`
- `src/commands/report.ts`
- `src/commands/scan.ts`
- `src/commands/shared.ts`
- `src/commands/skill-audit.ts`
- `src/commands/types.ts`
- `src/core/artifact-evidence.ts`
- `src/core/build-scan-summary.ts`
- `src/core/extract-skill-scope.ts`
- `src/core/extract-trace-scope.ts`
- `src/core/infer-candidate-incidents.ts`
- `src/core/resolve-evidence-roots.ts`
- `src/core/shared.ts`
- `src/core/summarize-logs.ts`
- `src/core/summarize-session.ts`
- `src/core/types.ts`
- `src/parsers/jsonl.ts`
- `src/parsers/loose-yaml.ts`
- `src/parsers/markdown.ts`
- `src/parsers/stage-log.ts`
- `src/render/logging-review-markdown.ts`
- `src/render/report-markdown.ts`
- `src/render/skill-audit-markdown.ts`
- `test/cli-contract-snapshots.test.ts`
- `test/cli.test.ts`
- `test/docs-contract.test.ts`
- `test/evaluation-contract.md`
- `test/fixtures/artifacts/.dossier/logs/closure.md`
- `test/fixtures/artifacts/.dossier/logs/implementation.md`
- `test/fixtures/artifacts/.dossier/reviews/F-0016-review.md`
- `test/fixtures/artifacts/.dossier/steps/F-0016-step.md`
- `test/fixtures/artifacts/.dossier/verification/F-0016-verification.md`
- `test/fixtures/artifacts/docs/adr/ADR-0016-observability.md`
- `test/fixtures/artifacts/docs/features/F-0016-retro.md`
- `test/fixtures/artifacts/docs/spec.md`
- `test/fixtures/artifacts/docs/verification.md`
- `test/fixtures/artifacts/src/retro/collector.ts`
- `test/fixtures/contracts/help-output-golden.txt`
- `test/fixtures/contracts/report-help-golden.txt`
- `test/fixtures/contracts/scan-summary-golden.json`
- `test/fixtures/contracts/session-skills-trace.jsonl`
- `test/fixtures/contracts/skill-audit-help-golden.txt`
- `test/fixtures/logs/closure.md`
- `test/fixtures/logs/implementation.md`
- `test/fixtures/rpa-05/final-pass-review.md`
- `test/fixtures/rpa-05/project/docs/features/F-0050-retro.md`
- `test/fixtures/rpa-05/session-referenced-only-stage-log.jsonl`
- `test/fixtures/rpa-05/session-skill-catalog-noise.jsonl`
- `test/fixtures/rpa-05/session-structured-review-fail.jsonl`
- `test/fixtures/rpa-05/stage-log-referenced-only.md`
- `test/fixtures/rpa-05/stage-log-structured-review.md`
- `test/fixtures/rpa-05/structured-stage-state.json`
- `test/fixtures/rpa-06/project/.dossier/logs/implementation.md`
- `test/fixtures/rpa-06/session-compacted-with-raw-trace.jsonl`
- `test/fixtures/sessions/multi-feature-session.jsonl`
- `test/fixtures/sessions/phase-session-with-apply-patch-body-mention.jsonl`
- `test/fixtures/sessions/phase-session-with-log-link.jsonl`
- `test/fixtures/sessions/phase-session-with-log-read-only.jsonl`
- `test/fixtures/sessions/phase-session-with-log-write-error.jsonl`
- `test/fixtures/sessions/phase-session-with-other-apply-patch.jsonl`
- `test/fixtures/sessions/phase-session-with-other-write.jsonl`
- `test/fixtures/sessions/phase-session-with-stage-log-source-write.jsonl`
- `test/fixtures/sessions/phase-session.jsonl`
- `test/fixtures/skills/unified-dossier-engineer/SKILL.md`
- `test/report.test.ts`
- `test/scan.test.ts`
- `tsconfig.json`
- `vite.config.ts`

## Required references
- `references/CLI.md`
- `references/LOGGING-IMPROVEMENTS-TEMPLATE.md`
- `references/PROJECT-ADAPTATION.md`
- `references/REFERENCE.md`
- `references/REPORT-TEMPLATE.md`
- `references/SKILL-AUDIT-TEMPLATE.md`

## Warnings
- none

## Notes
- This document is supporting output only.
- It does not override `SKILL.md`.