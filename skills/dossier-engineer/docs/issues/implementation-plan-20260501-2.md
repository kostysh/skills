# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260501-2`

## Related Issue

`issue-20260501-2` — `skills/dossier-engineer/docs/issues/issue-20260501-2.md`

## Source Artifacts

- `skills/dossier-engineer/docs/issues/issue-20260501-2.md`
- `skills/dossier-engineer/docs/dossier-engineer-problem-analysis-and-proposals.ru.md`
- `skills/dossier-engineer/references/parallel-development.md`
- `skills/dossier-engineer/references/runtime-commands.md`
- `skills/dossier-engineer/references/artifact-contract.md`
- `skills/dossier-engineer/src/app.ts`
- `skills/dossier-engineer/src/infra.ts`
- `skills/dossier-engineer/src/cli/run-cli.ts`
- `skills/dossier-engineer/test/cli.test.ts`
- `skills/dossier-engineer/package.json`

## Objective

Сделать mutating runtime commands single-writer safe: dossier writes are serialized through an ephemeral lock, writes use temp+rename, commands re-read affected artifacts under lock, stale writes are detected, and long-running verification commands do not hold the lock while external processes run.

Anti-claim: этот план не меняет stage/business gates Phase 1/3/4 и не превращает Markdown/YAML dossier в database.

## Assumptions

- Primary lock path is `<repo-root>/.dossier-runtime/write.lock/`.
- `.dossier-runtime/` must be ignored by git and excluded from changesets/reports.
- Read-only commands may run without lock and may observe a transient mixed view.
- Closure decisions remain protected because mutating closure commands re-read and validate under lock.
- `verify run` is logically mutating but must split external execution from final result recording.
- Default lock conflict behavior is fail-fast with lock-held output and `Next actions`; bounded waiting is out of scope unless introduced later through an explicit flag such as `--wait-lock <duration>`.

## Scope

In scope:

- Ephemeral lock acquisition via atomic directory creation.
- Lock metadata, conflict output, and recovery diagnostics.
- Fail-fast lock conflict behavior.
- Mutation envelope for all mutating commands.
- Temp+rename writes and stale write detection.
- `verify run` split behavior.
- Cleanup on failure via finally/defer path.
- Tests for concurrent mutation and crash/partial-write safety.

Out of scope:

- Database storage.
- Per-file locks.
- Locks under `docs/dossier` or committed canonical lock artifacts.
- Holding locks during long-running external commands.
- Business gate changes from other phases.

## Proposed Changes

- Add lock/transaction helpers in `src/infra.ts`.
- Replace direct `writeFile` artifact writes with temp+rename writes.
- Wrap mutating command handlers in a common mutation envelope.
- Ensure affected artifacts are re-read after lock acquisition before mutation.
- Add post-write validation for affected artifacts inside the mutation envelope.
- Add stale detection using previous file hash, `updated_at`, or an equivalent runtime-owned compare signal.
- Implement lock conflict output with lock path, holder metadata, age, safe recovery guidance, and `Next actions`.
- Use fail-fast as default lock conflict behavior; optional bounded wait may be added later through an explicit flag but is not required for Phase 2.
- Add an explicit mutating/read-only command matrix and tests proving every known mutating command enters the mutation envelope.
- Add `lock status` and `lock break --reason` if the command surface remains small; otherwise make conflict diagnostics sufficient for manual recovery.
- Ensure `.dossier-runtime/` ignore guidance exists and reports/changesets never include runtime lock data.
- Update active guidance with the exact runtime concurrency wording and old lock-file wording from the issue.

## Implementation Steps

1. Add tests that simulate concurrent mutating commands and assert one write succeeds while the other fails fast with lock-held output and `Next actions`.
2. Add tests for temp+rename behavior and simulated write failure without half-written Markdown.
3. Implement lock acquisition/release helpers with holder metadata, fail-fast lock-held output, and cleanup in finally/defer.
4. Implement atomic artifact write helper and update existing artifact write paths.
5. Introduce mutation envelope and classify mutating vs read-only commands.
6. Add command matrix coverage so each known mutating command is routed through the envelope and each read-only command is not.
7. Split `verify run`: external command execution outside lock, final record under lock after re-read and freshness check.
8. Add stale write/stale scope detection and tests for failing the write/record path when the affected artifact changed before recording.
9. Update active runtime guidance and command help with the exact ephemeral lock wording.
10. Rebuild runtime and run full checks.

## Verification Plan

- `cd skills/dossier-engineer && pnpm run build`
- `cd skills/dossier-engineer && pnpm test`
- `cd skills/dossier-engineer && pnpm run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer`
- Runtime acceptance tests must cover:
  - concurrent mutating commands cannot both write the same artifact;
  - temp+rename avoids half-written Markdown after simulated crash/failure;
  - affected artifacts are re-read after lock acquisition;
  - `verify run` external phase does not hold the write lock;
  - final `verify run` record phase uses the mutation envelope;
  - lock is released after validation/write/runtime errors;
  - post-write validation runs for affected artifacts before mutation command success;
  - primary lock path is `.dossier-runtime/write.lock`;
  - runtime does not rely on `.git` being a directory;
  - `.dossier-runtime/` is gitignored or setup guidance enforces it;
  - `.dossier-runtime/` and lock metadata never appear in generated changesets or reports;
  - lock conflict output includes path, holder metadata, age, safe recovery, and `Next actions`;
  - default lock conflict behavior fails fast and does not wait indefinitely;
  - implicit waiting/retry behavior is rejected unless a future explicit `--wait-lock <duration>` flag exists;
  - read-only commands run without lock and mixed-view limitation is documented.
  - a command matrix test proves every known mutating command uses the envelope;
  - stale-write/stale-scope tests fail the write/record path instead of overwriting.
- Active guidance includes:
  - `Mutating runtime commands MUST acquire an exclusive ephemeral dossier write lock before reading and writing artifacts...`;
  - `Do not use committed lock files or lock files as canonical dossier state...`;
  - the `verify run` split-lock rule.
- Perform `Audit instruction quality` workflow stage from `skill-source-compiler` after active guidance changes.

## Risks and Side Effects

- Coarse lock serializes all dossier writes. Mitigation: dossier commands are short; external verification runs outside lock.
- Stale locks can block writes. Mitigation: lock metadata plus `lock status` / `lock break` or explicit manual recovery guidance.
- Atomic rename behavior can differ by filesystem. Mitigation: keep temp files in same directory and test failure paths.
- Read-only commands may see transient mixed state. Mitigation: document advisory nature and protect mutations via re-read.

## Rollback Plan

- Revert lock envelope and atomic write helpers.
- Restore direct artifact write path only if tests and issue are also reverted.
- Remove `.dossier-runtime` command/help additions if introduced.
- Keep issue/plan as historical context unless explicitly removed.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agents `Fermat`, `Boyle`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Initial audit found missing explicit coverage for `.git` non-reliance, command matrix/envelope tests, stale-write/stale-scope tests, changeset/report lock exclusion, exact active guidance wording, instruction-quality audit, and post-write validation.
- Corrections added those requirements to proposed changes, implementation steps, and verification.
- Re-audit confirmed the plan covers coarse single-writer lock, atomic `mkdir`, temp+rename writes, re-read under lock, precondition/freshness checks, post-write validation, stale write/scope failure, failure cleanup, lock conflict output with `Next actions`, `verify run` split-lock behavior, `.dossier-runtime/write.lock`, `.git` non-reliance, no DB/per-file/canonical lock artifact, changeset/report exclusion, command matrix/envelope tests, and concurrent/atomic/stale tests.
- Final re-audit confirmed fail-fast lock conflict behavior is unambiguous: concurrent lock conflict fails fast with lock-held output and `Next actions`, and implicit waiting/retry is rejected unless a future explicit `--wait-lock <duration>` flag exists.

Required corrections: None after re-audit.

Final status: `PASS`
