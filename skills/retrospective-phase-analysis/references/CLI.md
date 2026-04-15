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
```

Outputs:
- provided session trace path
- resolved project root from `session_meta.cwd`
- trace-derived scope block
- timeline bounds
- event counts
- tool usage
- stage-log metrics
- review metrics
- process-miss metrics
- candidate incidents scoped to the analyzed trace and linked stage logs
- data-quality notes
- `run_dir`, `operator_language`, and `report_language`

`scan` also prints a compact JSON line to stdout with `run_dir`, `scan_summary`, and `report_language`.

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

### `skill-audit`

Generate a skill-focused Markdown draft.

```bash
node scripts/retro-cli.mjs skill-audit \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3 \
  --skills-dir /path/to/skills
```

### `logging-review`

Generate a logging-quality and improvement draft.

```bash
node scripts/retro-cli.mjs logging-review \
  --run-dir /path/to/.dossier/retro/session-019d8db3/retrospective-20260414-203415-019d8db3
```

## Supported options

- `--session <file>`: rollout or session JSONL file
- `--logs-dir <dir>`: directory containing stage logs
- `--artifacts-dir <dir>`: project root or evidence root
- `--skills-dir <dir>`: directory containing skill folders
- `--phase <name>`: optional phase label for the report
- `--title <text>`: title override
- `--out <file>`: exact output file override
- `--out-root <dir>`: root where the CLI chooses the canonical retrospective run directory
- `--run-dir <dir>`: exact canonical retrospective run directory to reuse
- `--language <language>`: operator language tag or name for report metadata and generated Markdown scaffolds
- `--draft`: write an explicitly temporary draft bundle
- `--pretty`: pretty-print JSON for `scan`
- `--help`: show command help

Language rule:

- Pass the operator language to `scan`, for example `--language ru`, `--language it`, or `--language "Italian"`.
- `scan-summary.json` records `operator_language` and `report_language`.
- `report`, `skill-audit`, and `logging-review` inherit language from `scan-summary.json` when invoked with `--run-dir`.
- Markdown reports should be in the operator language; English is acceptable for direct quotes, commands, paths, identifiers, JSON keys, and tool or skill names.
- The CLI can only provide deterministic scaffolds. If no scaffold exists for the requested operator language, generator commands must fail instead of silently writing Markdown in another language. In that case, use `scan-summary.json` and author the final Markdown manually in the operator language, or add a renderer before rerunning the command.

## Heuristics used by the CLI

The CLI tries to infer:
- timestamps from `ts`, `timestamp`, `created_at`, `time`, and ISO-like strings;
- event types from `type`, `event_type`, `kind`, and `event`;
- tool names from common `tool`, `tool_name`, and nested call objects;
- `session_id` and `project_root` from `session_meta`;
- canonical backlog items, canonical feature ids, touched paths, and referenced artifacts from high-confidence trace anchors;
- review findings from stage-log metadata and review-event text;
- process misses from stage-log sections and metadata;
- skill references from metadata `skill:` lines and file paths.

## Important limitations

- The script is intentionally dependency-free and therefore heuristic.
- Unknown event schemas are preserved but may not be fully classified.
- Markdown stage logs are parsed best when they begin with a YAML block.
- `scan` does not discover the session trace for you; the agent must pass `--session <file>`.
- when `session_meta.cwd` is missing or stale, the agent must resolve `project root` before supplying optional directories.
- `scan` only treats `.dossier/logs` as in-scope when the trace shows those log paths as created or changed in the analyzed session.
- `scan` does not treat malformed ids such as `CF-012.delivery_state`, `CF-018-backed`, `CF-0`, or `CF-XXX` as canonical backlog items.
- `scan` does not widen review or verification scope by feature-id fan-out alone; those artifacts must be directly referenced in the trace.
- `scan` does not replace manual scope review when the trace contains multiple tasks or multiple features.
- The generated report is a draft. The agent should read the cited artifacts before finalizing findings.

## Exit codes

- `0`: success
- `1`: usage error or missing required input
- `2`: parsing or filesystem failure
