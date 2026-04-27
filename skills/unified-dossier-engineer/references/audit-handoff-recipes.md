# Audit handoff recipes

Use this reference when launching a blocking external dossier audit or preparing a reviewer prompt for one of the required audit classes.

Use it together with:

- [Audit policy](audit-policy.md)
- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)
- [Telemetry and closure](telemetry-and-closure.md)

## When to use

- A mutating dossier stage is ready for required external review.
- An implementation needs the final `spec-conformance-reviewer`, `code-reviewer`, or `security-reviewer` audit bundle.
- A failed audit round has been remediated and a fresh rerun is required.

## When NOT to use

- The reviewer would inherit the authoring agent's forked or full conversation context.
- The task is a self-check, implementation pre-review checklist, or local verification run.
- The requested review would require the reviewer to modify product/source/test/backlog truth files or change `HEAD`.

## Common handoff skeleton

Use this skeleton as the prompt body for the external reviewer. Fill every placeholder before handoff.

```text
Audit task: Review the dossier stage for correctness against the stated scope. Do not implement fixes.
Audit class: <spec-conformance-reviewer|code-reviewer|security-reviewer>
Stage: <feature-intake|spec-compact|plan-slice|implementation|change-proposal>
Feature: <feature_id>
Dossier: <repo-relative dossier path>
Checked scope: <repo-relative files, artifacts, commands, and behavior under review>
Trace commit: <commit sha or explicit no-commit anchor>
Implementation scope: <non-code|code-bearing|not-applicable>
Verification artifacts: <repo-relative verification artifact paths or none>
Prior review artifacts: <repo-relative review artifact paths or none>
Source materials: <issue, plan, spec, backlog item, acceptance criteria, or other repo-relative sources>

Read-only audit analysis:
- Do not change product/source/test/backlog truth files.
- Do not change `HEAD`, create commits, rewrite history, or stage changes.
- After deciding PASS or FAIL, record only the review verdict through `dossier-engineer review-artifact`.
- That helper-owned accounting write is allowed only for managed review artifact / stage-state evidence and must not change material scope.
- Any other reviewer mutation invalidates the audit.

Shared risk map:
- <risk shared by all reviewers>
- <risk shared by all reviewers>

Reviewer focus:
- <class-specific focus from this reference>

After review:
- If PASS, run the PASS `review-artifact` command for this audit class.
- If FAIL, run the FAIL `review-artifact` command for this audit class and include must-fix findings.
- A blocking audit round is not complete until the immutable review attempt artifact exists.
```

## Shared risk map

The authoring agent must provide one shared risk map for all reviewers in the same review bundle. Keep it compact and aligned to the actual stage scope.

Include risks such as:

- requirement or acceptance-criteria mismatch;
- stale verification evidence;
- stale or invalidated review evidence;
- unresolved backlog or source-review blockers;
- lifecycle reconciliation drift;
- implementation scope misclassification;
- protected side effects from deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect.

## Reviewer focus by audit class

### `spec-conformance-reviewer`

Focus on:

- issue, plan, spec, acceptance criteria, and backlog truth alignment;
- selected backlog item lifecycle target for the audited stage;
- whether implementation or plan scope exceeds the approved objective;
- unresolved ambiguity, non-goals, or source-review blockers;
- whether verification and review evidence covers the stated requirements.

### `code-reviewer`

Focus on:

- correctness bugs, regressions, maintainability risks, and missing tests;
- runtime/help/docs-contract parity when command behavior is documented;
- freshness of verification after material code or test changes;
- protected side-effect invariants when the shared risk map declares them:
  - reservation before side effect;
  - idempotent replay behavior;
  - terminal CAS / no terminal overwrite;
  - strict caller input;
  - live-vs-stale running behavior.

### `security-reviewer`

Focus on:

- trust boundaries, caller-controlled input, path/file-system handling, external processes, network behavior, auth/authz, secret handling, and unsafe defaults;
- protected side effects from deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect;
- whether security-sensitive changes were reviewed after final material changes;
- whether code-bearing implementation security review records the required trigger reason.

For code-bearing implementation security audits, the `review-artifact` command must include:

```text
--security-trigger-reason <reason>
```

## PASS command templates

For `spec-conformance-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step <stage> --audit-class spec-conformance-reviewer --verdict PASS --reviewer <reviewer-id> --reviewer-skill spec-conformance-reviewer --reviewer-agent-id <agent-id> --notes <summary>
```

For `code-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step <stage> --audit-class code-reviewer --verdict PASS --reviewer <reviewer-id> --reviewer-skill code-reviewer --reviewer-agent-id <agent-id> --notes <summary>
```

For `security-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step implementation --audit-class security-reviewer --verdict PASS --reviewer <reviewer-id> --reviewer-skill security-reviewer --reviewer-agent-id <agent-id> --security-trigger-reason <reason> --notes <summary>
```

## FAIL command templates

For `spec-conformance-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step <stage> --audit-class spec-conformance-reviewer --verdict FAIL --reviewer <reviewer-id> --reviewer-skill spec-conformance-reviewer --reviewer-agent-id <agent-id> --must-fix <finding> --evidence <repo-relative evidence>
```

For `code-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step <stage> --audit-class code-reviewer --verdict FAIL --reviewer <reviewer-id> --reviewer-skill code-reviewer --reviewer-agent-id <agent-id> --must-fix <finding> --evidence <repo-relative evidence>
```

For `security-reviewer`:

```text
dossier-engineer review-artifact --dossier <dossier-path> --step implementation --audit-class security-reviewer --verdict FAIL --reviewer <reviewer-id> --reviewer-skill security-reviewer --reviewer-agent-id <agent-id> --security-trigger-reason <reason> --must-fix <finding> --evidence <repo-relative evidence>
```

## Completion rule

A required blocking audit round is incomplete until `review-artifact` writes one immutable attempt artifact for the audit class and verdict.

Rules:

- PASS and FAIL rounds both need durable immutable artifacts.
- A later PASS supersedes an earlier FAIL only through `dossier-step-close` policy validation.
- If the reviewer mutates material files, backlog truth, or `HEAD`, discard the attempt and rerun it with a valid read-only reviewer.
- If material scope changes after the artifact is recorded, rerun affected verification and review artifacts before `dossier-step-close`.
