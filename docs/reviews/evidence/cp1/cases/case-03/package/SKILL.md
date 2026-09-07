---
name: export-reader
description: Inspect a supplied CSV export and optionally check compatibility with the currently deployed Export Service API.
---
# Export reader

## When to use
Use for a supplied export file and an optional request to check current API compatibility.

## When NOT to use
Do not use for changing remote exports or certifying deployment readiness.

For local CSV inspection, use [Local format](references/local-format.md). Report the observed header and row count.
For a request about compatibility with the currently deployed service, use [API check](references/api-check.md).
Historical notes in docs are records, not operational prerequisites.
