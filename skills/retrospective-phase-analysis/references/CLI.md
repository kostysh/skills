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
  --session-id 019d7490-46d0-7811-b43f-056bb617a7ab \
  --out out/scan-summary.json
```

Outputs:
- resolved session trace path
- resolved project root from `session_meta.cwd`
- trace-derived scope block
- timeline bounds
- event counts
- tool usage
- stage-log metrics
- review metrics
- process-miss metrics
- candidate incidents
- data-quality notes

If `--logs-dir` or `--artifacts-dir` is omitted, `scan` tries the standard directories derived from `session_meta.cwd`.

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
- `--session-id <id>`: session id used to discover the rollout or session JSONL file
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
- `scan` does not replace manual scope review when the trace contains multiple tasks or multiple features.
- The generated report is a draft. The agent should read the cited artifacts before finalizing findings.

## Exit codes

- `0`: success
- `1`: usage error or missing required input
- `2`: parsing or filesystem failure
