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
  --session /path/to/rollout.jsonl \
  --out out/scan-summary.json
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

The agent must resolve `session_id` and find the canonical trace file before calling the CLI. If `--logs-dir` or `--artifacts-dir` is omitted, `scan` tries the standard directories derived from `session_meta.cwd` after the trace file is provided.
If `session_meta.cwd` is missing or unreliable, resolve a confirmed `project root` first. Do not pass guessed `--logs-dir` or `--artifacts-dir` values just to make the command run.

### `report`

Generate a Markdown draft retrospective report.

```bash
node scripts/retro-cli.mjs report \
  --session /path/to/rollout.jsonl \
  --logs-dir /path/to/.dossier/logs \
  --artifacts-dir /path/to/project \
  --phase "implementation" \
  --title "Retrospective: F-0016 implementation" \
  --out out/retrospective-report.md
```

### `skill-audit`

Generate a skill-focused Markdown draft.

```bash
node scripts/retro-cli.mjs skill-audit \
  --session /path/to/rollout.jsonl \
  --logs-dir /path/to/.dossier/logs \
  --skills-dir /path/to/skills \
  --out out/skill-audit.md
```

### `logging-review`

Generate a logging-quality and improvement draft.

```bash
node scripts/retro-cli.mjs logging-review \
  --logs-dir /path/to/.dossier/logs \
  --out out/logging-review.md
```

## Supported options

- `--session <file>`: rollout or session JSONL file
- `--logs-dir <dir>`: directory containing stage logs
- `--artifacts-dir <dir>`: project root or evidence root
- `--skills-dir <dir>`: directory containing skill folders
- `--phase <name>`: optional phase label for the report
- `--title <text>`: title override
- `--out <file>`: output path
- `--pretty`: pretty-print JSON for `scan`
- `--help`: show command help

## Heuristics used by the CLI

The CLI tries to infer:
- timestamps from `ts`, `timestamp`, `created_at`, `time`, and ISO-like strings;
- event types from `type`, `event_type`, `kind`, and `event`;
- tool names from common `tool`, `tool_name`, and nested call objects;
- `session_id` and `project_root` from `session_meta`;
- backlog items, feature ids, touched paths, and referenced artifacts from trace text;
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
- `scan` does not replace manual scope review when the trace contains multiple tasks or multiple features.
- The generated report is a draft. The agent should read the cited artifacts before finalizing findings.

## Exit codes

- `0`: success
- `1`: usage error or missing required input
- `2`: parsing or filesystem failure
