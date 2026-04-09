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
8. Select one explicit dossier-side `backlog impact verdict`:
   - `no-op` only when all of the following are true:
     - no new backlog-relevant blockers, dependencies, or context facts were introduced;
     - no backlog-relevant canonical source was created or changed; ordinary dossier wording edits alone do not count, but ADR decisions logged through `adr-log` do;
     - no executable follow-up is required;
   - `patch existing item` when backlog truth changed for the current work unit, but no new standalone backlog item is needed;
   - `source update` when the change creates or changes a backlog-relevant canonical source, especially an ADR or architecture source; dossier SSoT wording edits alone do not trigger this verdict unless they introduce or change such a source;
   - `new backlog item` when the change creates a new delta scope that must live as separate backlog work.
9. If the change both updates a canonical source and changes current-work truth, treat `source update` as the primary verdict. Any dependent-item patching or new backlog work happens after source actualization, inside the backlog-side branch.
10. If the verdict is not `no-op`, return to `backlog-engineer` and complete the required backlog actualization before closing the stage.
11. Do not report the step as docs-only complete when executable follow-up is still required.
