# Diff Completeness

Use this file when the diff is large, truncated, or unclear.

## Rules

- Do not finalize findings until every changed file is accounted for.
- If CLI diff output truncates, recover coverage by reading changed files directly.
- If the review target is unclear, state the assumption before continuing.

## Minimum Sequence

1. Identify the base branch or comparison target.
2. Read the full diff.
3. List all changed files.
4. For any truncated file, read the file directly until every changed hunk is visible.
5. Keep a reviewed-files list.
6. Before final output, state:
   - which files were reviewed
   - which areas were high risk
   - which areas, if any, could not be fully verified

## Pre-Conclusion Audit

Before finalizing:

- every changed file has been seen
- deleted tests or config files were checked, not skipped
- no finding depends on an unseen hunk
- unverifiable areas are called out explicitly
