# План имплементации `ISS-07`

Issue: [issue-20260424-4.md](issue-20260424-4.md)

Status: audited

## Рабочие допущения

- Pre-review checklist evidence принадлежит dossier workflow readiness, а не `implementation-discipline`.
- Checklist evidence не доказывает correctness и не заменяет external independent audits.
- Risk-family declarations должны быть explicit agent input; runtime не infer-ит high-risk scope из keywords, filenames, prose или diff heuristics.
- `.dossier/stages/*` остается authoritative structured coordination and validation surface; implementation stage log frontmatter остается bounded mirror.
- Начальная built-in risk family `policy-admission-governance` может иметь известный checklist id set, но core runtime должен поддерживать custom risk families без domain-specific code changes.
- Low-risk, documentation-only, artifact-only, or undeclared-risk implementations не должны получать нерелевантный checklist gate.

## Цель

После implementation high-risk implementation stage сможет явно объявить bounded risk family и записать structured author-side checklist evidence до external review handoff.

Observable outcome:

- `implementation` stage state может содержать `pre_review_risk_families` с `policy-admission-governance`;
- `implementation --ready-for-close` с declared risk family и missing/incomplete checklist fails before marking the stage ready for external review;
- complete checklist evidence records bounded entries in `.dossier/stages/<feature>/implementation.json` and mirrored implementation log frontmatter;
- external reviewers can read checklist evidence as author-side readiness context while required audit bundle remains unchanged;
- implementation without declared risk family remains valid without checklist evidence.

## Scope

- Active references:
  - [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
  - [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
  - [../../references/audit-policy.md](../../references/audit-policy.md)
  - [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
  - [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- New active reference:
  - `references/implementation-pre-review-checklists.md`
- Source bundle:
  - `skill.yaml`
  - generated `SKILL.md`
- Maintainer-facing utility spec:
  - [../utility-spec.ru.md](../utility-spec.ru.md)
- Runtime:
  - `src/shared/stage-state.ts`
  - `src/delivery/stage-control.ts`
  - `src/unified-cli.ts`
  - generated `scripts/dossier-engineer.mjs`
- Tests:
  - `test/cli.test.ts`
  - `test/docs-contract.test.ts`

## Non-Goals

- Не менять `implementation-discipline`.
- Не делать `policy-admission-governance` checklist обязательным для каждого implementation.
- Не infer-ить risk families из keywords, filenames, source code, chat summaries или review findings.
- Не превращать dossier runtime в domain-specific reviewer or correctness oracle.
- Не заменять required `spec-conformance-reviewer`, `code-reviewer` или `security-reviewer` audits.
- Не менять audit freshness, launch independence, same-thread rejection или required audit bundle semantics.
- Не блокировать low-risk documentation-only или artifact-only implementation stages нерелевантными checklists.

## Затронутые поверхности

### Active instructions

Add a new active reference `references/implementation-pre-review-checklists.md` and register it in the source bundle.

The reference defines:

- purpose: author-side high-risk readiness evidence before external review;
- distinction from `implementation-discipline` and external audit policy;
- explicit declaration rule for risk families;
- generic checklist entry schema;
- built-in `policy-admission-governance` checklist ids;
- custom risk-family behavior that requires explicit checklist entries but no core runtime domain changes.

Update existing references:

- `skill.yaml`: add the new reference with `required: true` or explicitly route it through an existing required reference if the implementation chooses an embedded reachability model; update copied/generated surfaces accordingly.
- generated `SKILL.md`: regenerate from `skill.yaml` rather than editing the generated file by hand.
- `delivery-workflow-layer.md`: implementation readiness includes pre-review checklist completeness only when risk families are declared.
- `telemetry-and-closure.md`: add parity-protected checklist fields to machine-complete stage schema and log frontmatter mirror.
- `audit-policy.md`: state checklist evidence is reviewer context and readiness evidence, not audit evidence or launch-mode proof.
- `commandized-stage-control.md`: document implementation stage-controller input boundary and fail-closed readiness behavior.
- `runtime-and-command-boundary.md` and `docs/utility-spec.ru.md`: align shipped flags, schema fields, validation behavior, and tests.

### Runtime

Extend helper-managed stage state with bounded implementation-only fields:

- `pre_review_risk_families: string[]`
- `pre_review_checklists: PreReviewChecklistEntry[]`
- `pre_review_checklist_status: "not_required" | "missing" | "blocked" | "complete"`
- `pre_review_checklist_blockers: string[]`

Checklist entry shape:

- `risk_family`
- `id`
- `status: "pass" | "not_applicable" | "blocked"`
- `summary`
- `evidence`
- optional `test_refs: string[]`

Add runtime parsing for explicit stage-controller inputs:

- repeatable `--risk-family <id>`
- repeatable `--pre-review-check <dsl>`

Initial DSL:

```text
risk_family=<id>;id=<id>;status=<pass|not_applicable|blocked>;summary=<text>;evidence=<text>;test_refs=<comma-list>
```

Rules:

- flags are accepted only by `implementation` stage-controller writes;
- `--risk-family` values are stable bounded identifiers, not prose;
- checklist entries must reference a declared risk family;
- malformed entries fail before stage artifacts are written;
- repeated entries use stable `(risk_family, id)` identity and latest explicit value wins inside one stage cycle;
- `status=blocked` makes checklist status `blocked` and prevents `ready_for_close`;
- declared risk family with missing required evidence prevents `ready_for_close`.

Built-in `policy-admission-governance` required checklist ids:

- `explicit-allow-deny`
- `deny-or-failed-admission-no-invocation`
- `conflicting-request-replay-fail-closed`
- `ambiguous-stale-unsupported-evidence`
- `freshness-timestamp-required`
- `active-scope-concurrency-model`
- `append-only-decision-audit-facts`
- `regression-test-paths`

Custom risk-family behavior:

- custom families are allowed without core runtime code changes;
- runtime does not know domain-required ids for custom families;
- readiness requires at least one `pass` or `not_applicable` checklist entry for each declared custom family and no `blocked` entries;
- projects can enforce richer custom checklist semantics through project-level docs/tests without changing generic runtime behavior.

Readiness behavior:

- no declared risk families -> `pre_review_checklist_status: "not_required"` and no blocker;
- declared family with missing entries -> `missing`, fail before `implementation --ready-for-close` writes `stage_state: ready_for_close`;
- declared family with any `blocked` entry -> `blocked`, fail before ready-for-close;
- declared family with complete entries -> `complete`, ready-for-close may proceed to existing verification/review/closure flow.

Preserve existing review policy:

- `review-artifact` and `dossier-step-close` do not treat checklist evidence as an audit artifact;
- required audit classes and freshness validation remain unchanged;
- checklist fields can be read by reviewers but do not satisfy or weaken external review requirements.

### Tests

Add focused CLI tests for:

- `implementation --ready-for-close --risk-family policy-admission-governance` without required checklist entries fails before writing ready-for-close state;
- complete `policy-admission-governance` checklist writes `pre_review_risk_families`, `pre_review_checklists`, `pre_review_checklist_status: "complete"`, and mirrored frontmatter;
- `status=blocked` checklist entry prevents ready-for-close and reports deterministic blockers;
- implementation without declared risk family reaches ready-for-close without checklist fields beyond `not_required`;
- custom risk family with at least one non-blocked checklist entry is accepted without adding runtime domain code;
- malformed checklist DSL fails before writing stage artifacts;
- `review-artifact` and `dossier-step-close` behavior remains governed by the existing audit bundle and does not accept checklist evidence as review evidence.

Add docs-contract tests for:

- active references define checklist evidence as readiness evidence, not correctness proof or external audit replacement;
- docs require explicit risk-family declaration and forbid keyword inference;
- docs list `policy-admission-governance` required checklist ids;
- source-bundle/reference reachability includes `references/implementation-pre-review-checklists.md`;
- utility spec/help/runtime docs expose only shipped flags and fields.

## План работ

1. Update docs first:
   - add `references/implementation-pre-review-checklists.md`;
   - register it in `skill.yaml` as an active required reference, or explicitly wire it through an existing required reference with docs-contract coverage;
   - regenerate generated `SKILL.md` from the source bundle;
   - update active references and utility spec;
   - add docs-contract assertions for source-bundle reachability and reference parity.
2. Extend stage-state schema:
   - add checklist fields and normalization defaults;
   - include checklist fields in stage-state mirror/frontmatter parity;
   - preserve backward compatibility for existing stage artifacts.
3. Add checklist DSL parsing and validation:
   - implement identifier validation;
   - parse repeatable checklist entries;
   - merge entries by `(risk_family, id)`;
   - reject malformed or implementation-external usage before writes.
4. Wire implementation stage-controller:
   - persist declarations and checklist entries on ordinary implementation updates;
   - evaluate checklist status on every implementation write;
   - fail before ready-for-close when declared checklist evidence is missing or blocked;
   - keep undeclared-risk implementation behavior unchanged.
5. Update CLI help and unified wrapper docs:
   - expose `--risk-family` and `--pre-review-check` only for implementation;
   - keep existing `--implementation-scope` semantics unchanged.
6. Add runtime tests for declared built-in family, custom family, no-family path, blocked path, and malformed DSL.
7. Add regression tests proving checklist evidence does not satisfy review artifacts or weaken `dossier-step-close`.
8. Build runtime artifact and run verification.
9. Re-run the skill source compiler so generated `SKILL.md`, copied runtime artifacts, source-bundle metadata, and active references remain aligned.

## Verification

Required checks:

- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

Targeted behavioral proof:

- declared `policy-admission-governance` without checklist blocks `implementation --ready-for-close`;
- complete declared checklist allows ready-for-close while external audit requirements remain pending;
- implementation without risk family stays unaffected.

## Риски и side effects

- Hardcoding too much policy-domain semantics would violate the generic workflow boundary; keep only the initial built-in checklist ids and generic custom-family validation.
- Checklist entries can become noisy prose if `summary`/`evidence` are unconstrained; keep them bounded single-line fields.
- A future project may need richer custom-family semantics; this plan intentionally leaves that to project-level docs/tests rather than expanding core runtime.
- Ready-for-close failure must happen before state mutation so incomplete checklist evidence cannot falsely mark the stage as review-ready.
- Reviewers may over-trust checklist evidence unless docs and tests keep it clearly separate from independent audit evidence.

## External Audit

Status: reviewed

Reviewer: external agent `Bacon`

Verdict: `PASS`

Findings: none.

Required changes addressed before PASS:

- First external audit by `Popper` found that the plan omitted source-bundle/source-compiled skill surfaces. The plan now includes `skill.yaml`, generated `SKILL.md`, compiler parity, and docs-contract reference reachability.

Residual risks accepted for implementation:

- Malformed `--pre-review-check` or unsupported-stage flag usage must be rejected before any stage log or `.dossier/stages/*` write.
- Generated `scripts/dossier-engineer.mjs`, `SKILL.md`, `skill.yaml`, help text, runtime schema, and docs-contract tests must stay in the same implementation change set.
- Custom risk-family semantics must not expand into runtime domain rules beyond the generic declared-family non-blocked-evidence contract.
