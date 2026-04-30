# dossier-engineer

`dossier-engineer` is a source-traced, capability-oriented, merge-safe delivery workflow for software projects that use Markdown/YAML dossier artifacts.

Its main purpose is to keep agents focused on observable product capability instead of mistaking infrastructure, scaffolding, tests, reports, or lifecycle metadata for delivered behavior.

## What It Provides

- Source registration and impact tracking for concepts, specs, policies, contracts, test plans, and external references.
- Capability records that describe observable behavior before work items are created.
- Existing-project onboarding through baseline capabilities and evidence instead of retroactive closed tasks.
- Capability, support, maintenance, and exploration work items with explicit gates.
- Delivery stage control for feature-intake, spec-compact, plan-slice, implementation, change-proposal, review, verification, closure, hygiene, changesets, reports, and retrospectives.
- Guardrails against support work accumulating without capability progress.
- Operator-facing guidance for asking agents what `dossier-engineer` can do and how to use it safely.

## Active Skill Surface

- `SKILL.md` — generated agent-facing skill instructions.
- `skill.yaml` — source of truth for generated skill metadata, sections, active references, supporting files, and copied runtime files.
- `fragments/*.md` — source fragments rendered into `SKILL.md`.
- `references/*.md` — active English references linked from `SKILL.md`.
- `scripts/dossier-engineer.mjs` — bundled CLI runtime.
- `src/*.ts`, `src/cli/*.ts`, `test/*.ts` — runtime source and tests.

Active references:

- `references/workflow.md` — delivery stages, onboarding, change-proposal, closure, and detailed command flow.
- `references/capability-governance.md` — capability-vs-substrate rules, anti-claims, demonstrations, concept conformance, and guardrails.
- `references/artifact-contract.md` — artifact schemas, frontmatter ownership, and runtime-managed fields.
- `references/runtime-commands.md` — command families, arguments, and expected operator flow.
- `references/review-and-closure.md` — verification, review, freshness, evidence, and closure gates.
- `references/parallel-development.md` — branch, scope, merge, and changeset rules.
- `references/retrospective.md` — retrospective reporting and process-miss analysis.
- `references/operator-capabilities.md` — operator-facing capability overview and prompt patterns.

## Supporting And Historical Surface

- `docs/cli-spec.ru.md` — historical Russian CLI specification.
- `docs/functional-coverage-matrix.ru.md` — historical Russian functional coverage matrix.
- `docs/operator-ux.ru.md` — historical Russian operator UX source for the English operator capability reference.
- `docs/ru/references/*.ru.md` — historical Russian copies of the reference material.
- `docs/logs/*.md` — implementation logs for skill maintenance.
- `assets/examples/*.ru.md` — historical Russian examples of runtime-created artifacts.

Supporting documents do not override `SKILL.md` or active references unless `skill.yaml` explicitly promotes them.

## Key Rules

- Canonical dossier state lives only in Markdown files with YAML frontmatter under `docs/dossier/`.
- Runtime commands own IDs, timestamps, hashes, lifecycle states, source-review records, review records, verification records, guardrail states, and closure transitions.
- Agents may edit semantic body sections only after the runtime creates the artifact scaffold.
- Capability work cannot close on infrastructure evidence alone.
- Support work must be explicitly marked as support and linked to the capability or guardrail it enables.
- Existing-project onboarding records already working behavior as baseline capabilities, not as artificial closed work items.
- Status, queue, attention, capability, guardrail, report, and retrospective outputs are derived views, not primary truth.

## Maintenance

This is a generated source-bundle skill. Do not hand-edit `SKILL.md` as the source of truth.

For instruction-surface changes:

1. Edit `skill.yaml`, `fragments/*`, `references/*`, or supporting files as appropriate.
2. Run `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .` from this skill root.
3. Run `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`.
4. Run the runtime package checks that are relevant to the change.

For runtime changes, keep `src/`, `scripts/`, tests, command documentation, and `SKILL.md` command references aligned.

## Useful Checks

```bash
node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .
node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .
pnpm run lint
pnpm run format:check
pnpm test
```

`format:check` currently also validates existing runtime formatting. If it fails on unrelated pre-existing formatting drift, report that separately instead of hiding it.
