# Workflow stage steps: `change-proposal`

1. Re-read repo overlays, architecture, and the current dossier maturity.
2. Add a new change-log entry.
   - When the change affects planning or execution sequencing, tag it as `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, or `[contract drift]`.
3. Modify the AC list and every directly affected executable section.
4. Update slices, tasks, coverage map references, DoD, dependency references, rollout notes, approval-path notes, and assumption/fallback notes.
5. If the dossier is `planned`, `in_progress`, or `done`, or if executable sections changed, run `node scripts/dossier.mjs contract-drift-audit --dossier ...`.
6. If drift audit says follow-up is required, make that follow-up explicit:
   - same dossier slice/task;
   - linked backlog item;
   - ADR or architecture update.
7. Run `lint-dossiers`, `coverage-audit`, `debt-audit` (compatibility alias: `marker-audit`), and `index-refresh` as the canonical full refresh path.
8. Do not report the step as docs-only complete when executable follow-up is still required.
