# Implementation Plan

## Language

Русский.

Английскими оставлены CLI commands, enum/frontmatter keys, review class names и точные формулировки будущего skill/runtime contract.

## Plan ID

`implementation-plan-20260501-5`

## Related Issue

`issue-20260501-5` — `skills/dossier-engineer/docs/issues/issue-20260501-5.md`

## Source Artifacts

- `skills/dossier-engineer/docs/issues/issue-20260501-5.md`
- `skills/dossier-engineer/references/review-and-closure.md`
- `skills/dossier-engineer/references/workflow.md`
- `skills/dossier-engineer/references/runtime-commands.md`
- `skills/dossier-engineer/references/artifact-contract.md`
- `skills/dossier-engineer/src/app.ts`
- `skills/dossier-engineer/src/domain.ts`
- `skills/dossier-engineer/test/cli.test.ts`
- `skills/dossier-engineer/skill.yaml`

## Objective

Сделать required review gates проверяемо независимыми: runtime должен отличать fresh eligible independent review от self-review, same-thread review и unknown-provenance review, а closure должна принимать только review artifacts, которые одновременно fresh по material scope и eligible по provenance.

Observable capability:

- `review required` показывает required classes, freshness, eligibility и причины missing/stale/ineligible state.
- `review record` может записать reviewer provenance and packet metadata без ручного frontmatter editing.
- `stage close`, `lint`, closure checks and hygiene fail closed when a required review is fresh by hash but ineligible by provenance.
- `review packet` генерирует bounded derived packet for independent review without creating a new canonical packet artifact family.
- Required review provenance records reviewer model and reasoning effort so required gates are not satisfied by a deliberately underpowered audit.

Anti-claims:

- Не встраиваем Codex-specific spawn API в portable CLI.
- Не требуем, чтобы reviewer писал canonical `REV-*.md` сам.
- Не добавляем new generic `external-review` class.
- Не создаём canonical review-packet artifact family.
- Не требуем `security-reviewer` для каждого code change без risk/security-sensitive trigger.
- Не хардкодим vendor-specific model names в portable runtime.

## Assumptions

- Phase 1-4 changes are already implemented and remain the baseline.
- Existing `review record` remains the only canonical write path for review artifacts.
- Reviewer agents are read-only. They return structured review reports; implementing agent records those reports unchanged through runtime.
- Runtime cannot inspect hidden conversation context. It validates declared provenance fields and fails closed when provenance is missing or ineligible.
- Existing review artifacts without provenance are not rewritten. Compatibility for historical records must be explicit and limited to already-closed/history reporting.
- Agent-side launch guidance may mention `fork_context: false` as an example equivalent for environments that expose such a flag, but CLI/runtime must stay portable.
- Agent-side reviewer selection must choose model and reasoning effort appropriate to review class, risk, ambiguity and blast radius; low reasoning is not acceptable for required closure gates.

## Scope

In scope:

- Review artifact provenance fields.
- Reviewer model/reasoning provenance fields and policy.
- Review eligibility predicates for required gates.
- Derived `review packet` command/output.
- `review required` output with freshness, eligibility and reasons.
- `review record` flags for provenance, packet hash, required reason, raw report reference and read-only status.
- Closure/lint/stage gates that require fresh eligible PASS reviews.
- Rerun/freshness semantics after `FAIL` / `BLOCKED` and subsequent fixes.
- Active guidance updates and regenerated `SKILL.md`.
- Runtime acceptance tests.
- Docs navigation update.

Out of scope:

- Direct spawning from the portable CLI.
- Vendor-specific model selection hardcoded in runtime.
- Any canonical mutable packet store.
- Reviewer write access.
- Rewriting historical review artifacts.
- New delivery stage.
- New mandatory artifact family.
- Replacing existing review classes with a single external review class.
- Full semantic diff classifier for every possible code/security surface. Use current risk/material-scope signals and conservative reasons.

## Proposed Changes

### Runtime data model

Extend review frontmatter with optional provenance fields:

```yaml
reviewer_kind: spawned-agent
reviewer_role: code-reviewer
reviewer_id: codex-reviewer-20260501-a
implementer_id: codex-implementer-20260501-b
launch_mode: spawned
launch_context: fresh-session-no-fork
isolation_level: bounded-packet
context_inheritance: none
readonly: true
packet_hash: sha256:...
required_reason: "code-bearing change"
raw_report_ref: docs/dossier/reviews/.../raw-report.md
reviewer_model: default
reviewer_reasoning_effort: high
model_selection_policy: required-review-risk-weighted
model_selection_reason: "security-sensitive runtime change"
```

Keep existing required fields:

```yaml
audit_class: code-reviewer
verdict: pass
material_scope_hash: sha256:...
```

Eligibility for new required gates:

- `verdict: pass`;
- fresh material/review scope hash;
- `launch_mode: spawned`;
- `launch_context: fresh-session-no-fork`;
- `context_inheritance: none`;
- `isolation_level: bounded-packet` or `repository-readonly`;
- `readonly: true`;
- `reviewer_kind: spawned-agent` or a future explicitly supported independent kind;
- `reviewer_role` matches `audit_class`;
- `reviewer_id` and `implementer_id` are present;
- `reviewer_id != implementer_id`;
- `packet_hash` is present, well-formed, and matches the runtime-generated packet hash for the same `work_item_id`, `stage`, `audit_class`, and current `material_scope_hash`;
- `raw_report_ref` points to a durable in-repo report or the returned reviewer findings/rationale are copied into the immutable review body;
- `reviewer_model`, `reviewer_reasoning_effort`, `model_selection_policy`, and `model_selection_reason` are present for required reviews;
- `reviewer_reasoning_effort` is not `low` for required gates that can block or permit closure;
- high-risk required reviews use `reviewer_reasoning_effort: high` or `xhigh`, including `security-reviewer`, broad/novel concept work, runtime/platform/lifecycle/concurrency/provenance/source-of-truth work, many-AC/falsifier/spec ambiguity, previous `FAIL` / `BLOCKED`, or high blast radius;
- not same-thread, self-review, unknown provenance or missing provenance.

### Runtime commands

Add or extend:

```bash
dossier-engineer review packet --work <work-id> --stage <stage> --class <review-class>
```

The packet is derived output. It must include source refs, capability claim, acceptance criteria, negative/falsifier criteria, anti-claims, `Spec Compact`, `Plan Slice`, integration path, AC/evidence/falsifier matrix, verification/evidence refs, material scope hash, role-selection reason and class-specific questions.

Runtime must compute a deterministic packet hash from the generated packet content and expose it with the packet. Required review eligibility must compare `review.frontmatter.packet_hash` against the current generated packet hash for the same `work_item_id`, `stage`, `audit_class`, and material scope. Missing, malformed, mismatched, or stale packet hashes make a required review ineligible.

Extend:

```bash
dossier-engineer review record \
  --work <work-id> \
  --stage <stage> \
  --class <review-class> \
  --verdict pass|fail|blocked|not_applicable \
  --reviewer <reviewer-id> \
  --reviewer-kind spawned-agent \
  --reviewer-role <review-class> \
  --implementer-id <id> \
  --launch-mode spawned \
  --launch-context fresh-session-no-fork \
  --isolation-level bounded-packet \
  --context-inheritance none \
  --readonly true \
  --packet-hash sha256:<hash> \
  --required-reason "<reason>" \
  --reviewer-model default|<model-id-or-family> \
  --reviewer-reasoning-effort medium|high|xhigh \
  --model-selection-policy required-review-risk-weighted \
  --model-selection-reason "<reason>" \
  --report <path>
```

`review record` must still record `FAIL` / `BLOCKED`; eligibility only controls whether a review can satisfy required gates.

`review record --report <path>` must preserve reviewer-authored findings/rationale. Acceptable implementations:

- copy the raw reviewer report into the immutable review body or a canonical review-adjacent immutable file referenced by `raw_report_ref`;
- or validate that `raw_report_ref` points to a durable in-repo report path and store enough body content to preserve verdict, findings, rationale and reviewed scope.

Later PASS reviews must never delete, overwrite, or obscure earlier `FAIL` / `BLOCKED` findings/rationale.

Extend `review required`, `next`, failed `stage close`, `lint`, and hygiene checks to report:

- required class;
- reason;
- freshness state;
- eligibility state;
- stale/ineligible reason;
- expected reviewer compute policy when relevant;
- next action to generate packet and run independent review when allowed.

### Guidance and docs

Update active references to state:

- implementing agent orchestrates independent review but does not author required PASS verdict;
- reviewer authors review result but does not write canonical dossier artifacts directly;
- implementing agent records returned report unchanged through runtime;
- required external review launch uses `fresh reviewer session`, `no context fork / no current-thread fork`, `no inherited thread history`, and `bounded review packet only`;
- if spawn is unavailable or permission is denied, agent stops at audit gate;
- operator permission to spawn is not a review verdict and not a waiver.
- required reviews must use a reviewer model and reasoning effort appropriate to review class, risk, ambiguity and blast radius;
- reviewer model capability should be at least comparable to the implementing agent's model for the reviewed domain, and high-risk reviews should use stronger model or higher reasoning effort where available;
- runtime records model/reasoning provenance but does not hardcode vendor-specific model names.

## Implementation Steps

1. Add failing tests for ineligible provenance:
   - plan-slice concept review with missing provenance does not close;
   - `launch_mode=self-review`, `same-thread`, `unknown`, missing `context_inheritance`, or `readonly=false` do not satisfy required gates;
   - missing `reviewer_id`, missing `implementer_id`, and `reviewer_id == implementer_id` are ineligible;
   - fresh eligible provenance allows plan-slice close.
2. Add tests for implementation closure:
   - required `spec-conformance-reviewer` / `code-reviewer` / `security-reviewer` gates reject fresh-but-ineligible reviews;
   - fresh eligible PASS bundle satisfies closure when material scope is current.
3. Add tests for `review packet`:
   - packet includes claim, ACs, negative/falsifier criteria, anti-claims, `Spec Compact`, `Plan Slice`, integration path, evidence refs, material scope hash, review class questions and role-selection reason;
   - packet does not include conversation transcript or hidden context.
4. Add tests for packet hash eligibility:
   - missing, malformed, mismatched, or stale `packet_hash` makes required review ineligible;
   - matching packet hash for the same work/stage/class/material scope is eligible.
5. Add tests for `FAIL` / `BLOCKED` preservation and later eligible PASS supersession:
   - failed/blocked artifacts remain visible;
   - returned findings/rationale remain preserved in body or durable raw report reference;
   - later PASS does not delete, overwrite, or obscure earlier failed/blocked findings.
6. Add tests for reviewer compute provenance:
   - missing `reviewer_model`, missing `reviewer_reasoning_effort`, missing `model_selection_policy`, or missing `model_selection_reason` make required review ineligible;
   - `reviewer_reasoning_effort=low` is ineligible for required closure gates;
   - `security-reviewer` required gate expects `high` or `xhigh` reasoning effort.
   - high-risk non-security reviews, such as broad/novel concept work, runtime lifecycle/concurrency/provenance work, many-AC/falsifier/spec ambiguity, previous `FAIL` / `BLOCKED`, or high blast radius, require `high` or `xhigh`.
7. Implement review provenance parsing/storage in `review record`.
8. Implement deterministic packet hash generation and packet hash validation for required reviews.
9. Implement reviewer compute provenance parsing and eligibility checks without hardcoding exact model names.
10. Implement returned findings/rationale preservation via immutable review body content or durable raw report reference.
11. Implement `reviewEligibleForRequiredGate` or equivalent helper and integrate it into `reviewFresh`, `reviewFreshForStage`, `review required`, stage gates, closure/lint/hygiene checks.
12. Implement derived `review packet` command and help output.
13. Extend required-review output with eligibility reasons and next actions.
14. Update active references, `skill.yaml`, generated `SKILL.md`, compile report, and docs README.
15. Run full runtime and source-bundle checks.

## Verification Plan

- `cd skills/dossier-engineer && pnpm run build`
- `cd skills/dossier-engineer && pnpm test`
- `cd skills/dossier-engineer && pnpm run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer`
- `git diff --check -- skills/dossier-engineer`
- Portability scan for absolute local paths in `skills/dossier-engineer`.

Runtime acceptance tests must cover:

- missing provenance makes required reviews ineligible for new gates;
- missing `reviewer_id`, missing `implementer_id`, or `reviewer_id == implementer_id` makes review ineligible;
- self-review, same-thread, unknown launch mode, forked/inherited context and `readonly=false` are ineligible;
- `launch_context=fresh-session-no-fork`, `context_inheritance=none`, eligible isolation and `readonly=true` are accepted;
- required reviews stay subject to Phase 4 material freshness;
- `review packet` includes bounded material context and excludes session transcript;
- missing, malformed, mismatched, or stale `packet_hash` makes required review ineligible;
- missing model/reasoning provenance makes required review ineligible;
- `reviewer_reasoning_effort=low` is ineligible for required closure gates;
- high-risk/security required reviews use `high` or `xhigh` reasoning effort and record model selection reason;
- high-risk non-security reviews with only `medium` reasoning effort are ineligible when the declared policy/reason identifies broad concept, runtime/platform/lifecycle/concurrency/provenance/source-of-truth work, many-AC/falsifier/spec ambiguity, previous `FAIL` / `BLOCKED`, or high blast radius;
- `FAIL` / `BLOCKED` artifacts remain immutable and visible, including returned findings/rationale;
- later eligible PASS can satisfy gate only when fresh and class-appropriate;
- `review required` explains missing/stale/ineligible states and next actions;
- operator spawn permission is described as permission to launch reviewer only, not a verdict or waiver.

## Risks and Side Effects

- Legacy review artifacts become ineligible for new required gates. Mitigation: do not rewrite history; document historical compatibility explicitly.
- Provenance flags make `review record` longer. Mitigation: provide `review packet` and precise `review required` next actions.
- Environment-specific spawning semantics can leak into portable CLI. Mitigation: keep spawn details in guidance and provenance, not direct CLI integration.
- Environment-specific model names can leak into portable CLI. Mitigation: store model/reasoning provenance and policy reason, but do not hardcode vendor-specific model names.
- Agents may claim provenance incorrectly. Mitigation: runtime validates required fields and fails closed for missing/ineligible metadata; true hidden-context validation remains an agent/runtime trust boundary.
- Over-review risk. Mitigation: keep Phase 4 consolidated review policy and risk-weighted `security-reviewer` triggers.

## Rollback Plan

- Revert provenance eligibility checks and `review packet` command.
- Preserve review artifact schema compatibility by leaving unknown provenance fields harmless when not enforced.
- Keep issue/plan as historical context unless explicitly removed.
- If partial rollback is needed, keep docs aligned with runtime behavior and remove any guidance that promises unenforced eligibility.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Lagrange`

Audit criteria:

- Conformance to `issue-20260501-5`.
- Consistency with current Phase 1/2/3/4 implementation.
- No Codex-specific spawn API dependency in portable CLI.
- No vendor-specific model list hardcoded into portable CLI.
- Reviewer remains read-only and does not write canonical artifacts directly.
- Required review gates cannot be satisfied by self-review/same-thread/unknown provenance.
- No unnecessary canonical artifact family or heavy workflow.
- Tests cover provenance eligibility, self-review identity, reviewer compute policy, packet boundedness, packet hash matching, stale/fresh interaction and failure preservation.

Audit notes:

- Initial audit by spawned agent `Lagrange` found required corrections:
  - add explicit `reviewer_id != implementer_id` and missing identity checks;
  - bind `packet_hash` to the generated packet for the same work/stage/class/material scope;
  - preserve returned findings/rationale, not only artifact existence.
  Corrections were applied to eligibility, proposed runtime behavior, implementation steps and verification plan.

- Second audit after adding reviewer compute policy found required corrections:
  - high-risk non-security reviews must require `high` or `xhigh`, not merely "not low";
  - portable examples must not use vendor-specific model names.
  Corrections replaced model examples with placeholders and added high-risk compute eligibility/test requirements.

Re-audit notes:

- PASS.
- No remaining required corrections after identity, packet hash, findings preservation, and reviewer compute policy updates.

Required corrections: None after re-audit.

Final status: `PASS`
