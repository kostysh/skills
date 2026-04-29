# CLI reference

## Purpose

`scripts/retro-cli.mjs` helps an agent summarize session traces and stage logs into machine-assisted drafts. It does not replace direct artifact reading.

## Global help and version

```bash
node scripts/retro-cli.mjs --help
node scripts/retro-cli.mjs help report
node scripts/retro-cli.mjs --version
```

## Commands

### `scan`

Build an evidence summary and metrics snapshot.

```bash
node scripts/retro-cli.mjs scan \
  --session /path/to/rollout.jsonl

node scripts/retro-cli.mjs scan \
  --session /path/to/rollout.jsonl \
  --out-root /path/to/analysis-root \
  --pretty

node scripts/retro-cli.mjs scan \
  --session /path/to/rollout.jsonl \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3 \
  --language ru

node scripts/retro-cli.mjs scan \
  --session /path/to/active-session.jsonl \
  --until-ts 2026-04-10T10:06:00Z

node scripts/retro-cli.mjs scan \
  --session /path/to/rollout.jsonl \
  --stage-log .dossier/logs/implementation.md \
  --artifact-evidence "operator supplied closure artifact list"
```

Outputs:
- `schema_version`
- provided session trace path
- resolved project root from `session_meta.cwd`
- trace-derived scope block
- discovery provenance for included, excluded, and manually included artifacts
- timeline bounds
- event counts
- tool usage
- agent-context counters such as `session.compactedEvents`, long gaps, and aborted turns
- stage-log metrics
- review metrics
- process-miss metrics
- candidate incidents scoped to the analyzed trace and linked stage logs
- data-quality notes
- `phase_boundary`
- structured `stage_log_candidates`, `review_artifact_candidates`, `verification_artifact_candidates`, and `step_artifact_candidates`
- `artifact_identity` derived from included stage artifacts when available
- metric `sources` and quality labels: `structured`, `trace_derived`, `prose_derived`, `incomplete`, and legacy `validated_fallback`
- extracted `reviewSignals` for non-PASS review evidence, including source quality, classification, and immutable-artifact matching status
- `reportStatus`
- `validation` metadata with `agent_validated: false` for generated scaffolds
- `skills.available`, `skills.referenced`, and `skills.unreferenced_count`
- `run_dir`, `operator_language`, and `report_language`

`scan` also prints a compact JSON line to stdout with `run_dir`, `scan_summary`, and `report_language`.

After `scan`, generate all three Markdown scaffolds into the same `run_dir`:

- `report --run-dir <run_dir>`
- `skill-audit --run-dir <run_dir>`
- `logging-review --run-dir <run_dir>`
- `problem-matrix --run-dir <run_dir>`

These files are mandatory bundle checkpoints, but they remain scaffolds until the agent validates them against the cited evidence.

Persisted output privacy:

- `scan-summary.json` and generated Markdown reports redact absolute local runtime paths.
- Expected display forms are `<project-root>/...`, `<skills-root>/...`, `<session-trace:<short-session-id>>`, and `<absolute-path:redacted>/...`.
- The compact stdout line may contain exact operational paths for immediate follow-up commands; do not copy raw stdout into committed retrospective artifacts.

The agent must resolve `session_id` and find the canonical trace file before calling the CLI. If `--logs-dir` or `--artifacts-dir` is omitted, `scan` tries the standard directories derived from `session_meta.cwd` after the trace file is provided.
If `session_meta.cwd` is missing or unreliable, resolve a confirmed `project root` first. Do not pass guessed `--logs-dir` or `--artifacts-dir` values just to make the command run.
Auto-discovered directories from `session_meta.cwd` are read-side hints only. Explicit `--artifacts-dir` and `--logs-dir` are also read-side hints. None of them redefine the durable output root.
Without `--out`, commands write into a durable bundle under `.dossier/retro/<scope>/<run>/` when the current working directory or one of its ancestors is dossier-managed. Otherwise they fall back to `out/retro/<scope>/<run>/` relative to the current working directory.

Output modes:

- `--out-root <dir>`: the CLI chooses the canonical run directory under this root and reports it as `run_dir`.
- `--run-dir <dir>`: the caller provides the exact canonical run directory; follow-up commands write into this directory and do not create sibling bundles.
- `--out <file>`: low-level one-file override; do not use for the normal bundle workflow.
- `--draft`: explicitly temporary auto draft under `out/retro-drafts`.

For a retrospective of one session trace, the default scope is `session-<short-session-id>`. A feature semantic scope should be used only when the operator explicitly asks for a feature-scoped retrospective or when one analysis combines multiple session traces for one feature.

The first `scan` that writes a bundle establishes the canonical run directory. Do not create a second bundle after that scan unless the operator explicitly requested a new run.

Phase boundary:

- Use `--until-line <n>` or `--until-ts <iso>` only when the analyzed phase is a prefix of the trace.
- This is required for active-session retrospectives where later events belong to the retrospective itself.
- If linked stage artifacts provide close/completion timestamps, `scan` may derive an `artifact_derived` boundary before final scope extraction.
- If later same-session retrospective work appears after analyzed artifacts and no strong boundary exists, `scan` fails closed and asks for `--until-line` or `--until-ts`.
- The boundary is applied before scope extraction and metrics.
- `scan-summary.json` records `phase_boundary.mode`, `phase_boundary.until_line`, `phase_boundary.until_ts`, `phase_boundary.reason`, and `phase_boundary.excluded_events_count`.

Artifact candidates:

- `referenced_only` paths remain candidates but are not analyzed by default.
- Excluded stage-log candidates include a precise `reason` and `next_action`; `referenced_only` stage-log candidates tell the operator to rerun with `--stage-log <path> --artifact-evidence <justification>` when manual inclusion is valid.
- `trace_patch_target`, `trace_shell_write`, `trace_write`, and `tool_output_path` candidates can be auto-included when the trace confirms write/change evidence.
- `stage_artifact_link` candidates can be auto-included when an included stage log or bounded stage state explicitly links the artifact, the path exists inside the confirmed project root, and the artifact path or content matches the artifact scope.
- Legacy arrays such as `candidate_stage_logs` are derived from included candidates only.
- Feature-id matching alone does not include review, verification, or step artifacts.
- Helper-managed `.dossier/stages/*` state is not broad-scanned; it is read only from bounded paths derived from already included stage logs.

Metrics:

- Structured fields such as `process_misses`, `process_misses_total`, and `skills_used` win over prose sections.
- Structured `review_events` with `FAIL` or `non-compliant` verdicts produce candidate incidents even when a linked final review artifact is `PASS`.
- Active UDE producer fields are consumed when present: `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`, selected closure bundle fields, and `review_events`.
- UDE `review_history_quality: complete` is structured review evidence; `process_miss` or `limited` keeps aggregate review metrics incomplete until the agent validates the limitation.
- Trace-derived and prose-derived non-PASS review signals are fallback evidence, not immutable review truth.
- Prose fallback is counted only when structured fields are absent, and fallback source quality is recorded in `stageLogs.metrics.sources`.
- `trace_derived`, `prose_derived`, or `incomplete` metrics keep `reportStatus.status` at `draft_requires_agent_validation`.

Manual overrides:

- `--stage-log <path>` manually includes a stage log.
- `--review-artifact <path>` manually includes a review artifact.
- `--verification-artifact <path>` manually includes a verification artifact.
- These flags are repeatable.
- Any manual override requires `--artifact-evidence <text>`.
- Manual inclusion is recorded per artifact kind and marks the report scaffold as draft until the agent validates the evidence.
- Manual inclusion does not resolve same-session phase-boundary ambiguity; provide `--until-line` or `--until-ts` when the boundary remains unclear.

### `report`

Generate a Markdown draft retrospective report.

```bash
node scripts/retro-cli.mjs report \
  --session /path/to/rollout.jsonl \
  --phase "implementation" \
  --title "Retrospective: F-0016 implementation"

node scripts/retro-cli.mjs report \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3
```

Generated reports keep `Data-quality limits` evidence-source focused and render `Agent-context factors` separately. A `compacted` event is not a data-quality limitation when the raw trace is available and parsed, but it can appear as an agent-context factor.

### `skill-audit`

Generate a skill-focused Markdown draft.

```bash
node scripts/retro-cli.mjs skill-audit \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3
```

`skill-audit` uses the injected `Available skills` catalog in the session trace as its scope. `--skills-dir` is optional enrichment for referenced skills only; it does not discover additional skills. When using `--run-dir`, pass `--skills-dir` to the initial `scan`; follow-up commands reuse the persisted `scan-summary.json`.

### `logging-review`

Generate a logging-quality and improvement draft.

```bash
node scripts/retro-cli.mjs logging-review \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3
```

Generated logging reviews include a recommendation-discipline checkpoint: check existing canonical artifacts, workflow sequencing, or prompt recipes before proposing new fields or log schema changes.

### `problem-matrix`

Generate a skill/process problem matrix draft.

```bash
node scripts/retro-cli.mjs problem-matrix \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3
```

The command writes `problem-matrix-by-skill.md` into the run directory unless `--out <file>` is supplied. The matrix includes columns `ID`, `Проблема`, `Скил, содержащий проблему`, and `Предложение по решению проблемы`. It is a draft grouping of reusable skill/process problems until the agent validates the cited evidence.

### `validate`

Record final agent validation metadata after the agent has read and validated the cited evidence.

```bash
node scripts/retro-cli.mjs validate \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3 \
  --validated-scope "scan summary and generated Markdown bundle" \
  --residual-confidence medium \
  --validation-notes "Validated cited evidence; residual incomplete metrics remain documented."
```

`validate` updates `scan-summary.json` with `agent_validated: true`, `validated_scope`, `residual_confidence`, `validation_notes`, `validated_at`, and optional `validated_by`. It records validation already performed by the agent; it does not validate evidence automatically and does not erase existing `reportStatus.reasons`.

## Supported options

- `--session <file>`: rollout or session JSONL file
- `--logs-dir <dir>`: directory containing stage logs
- `--artifacts-dir <dir>`: project root or evidence root
- `--skills-dir <dir>`: optional directory containing skill folders for referenced-skill enrichment
- `--phase <name>`: optional phase label for the report
- `--title <text>`: title override
- `--out <file>`: exact output file override
- `--out-root <dir>`: root where the CLI chooses the canonical retrospective run directory
- `--run-dir <dir>`: exact canonical retrospective run directory to reuse
- `--language <language>`: operator language tag or name for report metadata and final analysis content
- `--until-line <n>`: analyze only session events at or before this JSONL line
- `--until-ts <iso>`: analyze only session events at or before this timestamp
- `--stage-log <path>`: manually include a stage log; repeatable; requires `--artifact-evidence`
- `--review-artifact <path>`: manually include a review artifact; repeatable; requires `--artifact-evidence`
- `--verification-artifact <path>`: manually include a verification artifact; repeatable; requires `--artifact-evidence`
- `--artifact-evidence <text>`: required justification for manual artifact inclusion
- `--validated-scope <text>`: validation command only; evidence scope the agent validated
- `--residual-confidence <high|medium|low>`: validation command only; confidence after validation
- `--validation-notes <text>`: validation command only; agent-authored validation notes
- `--validated-by <name>`: validation command only; optional validator identity
- `--draft`: write an explicitly temporary draft bundle
- `--pretty`: pretty-print JSON for `scan`
- `--help`: show command help

Language rule:

- Pass the operator language to `scan`, for example `--language ru`, `--language it`, or `--language "Italian"`.
- `scan-summary.json` records `operator_language` and `report_language`.
- `report`, `skill-audit`, `logging-review`, and `problem-matrix` inherit language from `scan-summary.json` when invoked with `--run-dir`.
- Generated Markdown scaffold headings and structural labels are always English.
- The operator language is metadata for agent-authored analysis content and final conclusions, not a template-localization selector.
- English is acceptable for direct quotes, commands, paths, identifiers, JSON keys, tool names, skill names, and generated scaffold labels.

Report status rule:

- Generated Markdown is a scaffold. The final report is the agent's responsibility after evidence validation.
- Generated scan summaries set `validation.agent_validated` to `false`.
- Use `validate --run-dir ...` only after the agent has validated the cited evidence; it records `agent_validated: true` with validation scope, residual confidence, and notes.
- `draft_requires_agent_validation` is used when evidence quality is degraded, no stage logs were analyzed despite dossier activity, unresolved ambiguities exist, manual overrides were used, or the injected `Available skills` catalog is missing.
- Excluded stage-log candidates are stronger than generic missing logs: `reportStatus.reasons` names the excluded candidates and generated Markdown marks log-derived metrics as incomplete.
- Compaction is reported as agent context, not data-quality loss, when the raw trace is available and parsed.
- Non-PASS review signals without matching immutable artifacts keep review metrics incomplete until validated.
- Draft Markdown includes `Status: draft, requires agent validation`.
- `ready_for_agent_finalization` means the automated checks found no draft trigger, but the agent still owns final conclusions.

## Heuristics used by the CLI

The CLI tries to infer:
- timestamps from `ts`, `timestamp`, `created_at`, `time`, and ISO-like strings;
- event types from `type`, `event_type`, `kind`, and `event`;
- tool names from common `tool`, `tool_name`, and nested call objects;
- `session_id` and `project_root` from `session_meta`;
- canonical backlog items, canonical feature ids, touched paths, and referenced artifacts from high-confidence trace anchors;
- review findings from stage-log metadata and review-event text;
- process misses from stage-log sections and metadata;
- possible skills from the injected `Available skills` catalog;
- referenced skills from operational user/assistant messages, commands, tool-call metadata, patch metadata, explicit skill file reads, and structured stage-log skill metrics.

## Important limitations

- The script is intentionally dependency-free and therefore heuristic.
- Unknown event schemas are preserved but may not be fully classified.
- Markdown stage logs are parsed best when they begin with a YAML block.
- `scan` does not discover the session trace for you; the agent must pass `--session <file>`.
- when `session_meta.cwd` is missing or stale, the agent must resolve `project root` before supplying optional directories.
- `scan` only treats `.dossier/logs` as in-scope when the trace shows those log paths as created or changed in the analyzed session.
- `scan` does not treat malformed ids such as `CF-012.delivery_state`, `CF-018-backed`, `CF-0`, or `CF-XXX` as canonical backlog items.
- `scan` does not widen review or verification scope by feature-id fan-out alone; those artifacts must be directly referenced in the trace.
- direct references without write/change evidence are `referenced_only` candidates, not analyzed artifacts.
- copied `Available skills` catalogs, large copied text blobs, compacted context, and tool-output blobs are not active skill-usage evidence.
- manual overrides require explicit evidence and reduce confidence until validated.
- `scan` does not replace manual scope review when the trace contains multiple tasks or multiple features.
- The generated report is a draft. The agent should read the cited artifacts before finalizing findings.

## Exit codes

- `0`: success
- `1`: usage error or missing required input
- `2`: parsing or filesystem failure
