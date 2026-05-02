# Implementation Log

## Log ID

`implementation-log-20260502-5`

## Related Issue

`issue-20260501-5` — `docs/issues/issue-20260501-5.md`

## Related Plan

`implementation-plan-20260501-5` — `docs/issues/implementation-plan-20260501-5.md`

## Operator Request

Оператор попросил закоммитить подготовленный issue/plan пакет и приступить к имплементации independent required review gates.

## Summary

Реализован runtime-контракт независимых обязательных ревью: required review gates теперь принимают только свежие PASS review artifacts с eligible provenance, matching bounded review packet hash, read-only fresh-session launch metadata, reviewer/implementer separation и достаточным reasoning effort.

## Changes Made

- `skills/dossier-engineer/src/app.ts` — добавлен `review packet`, eligibility checks for required review gates, provenance/compute-policy fields in `review record`, and `fresh|missing_or_stale|ineligible` required review states.
- `skills/dossier-engineer/src/cli/run-cli.ts` — обновлён список команд help surface для `review required|packet|record`.
- `skills/dossier-engineer/test/cli.test.ts` — добавлены runtime acceptance tests для missing provenance, same reviewer/implementer identity, stale packet hash, low reasoning effort, high-risk medium reasoning, and eligible final review closure.
- `skills/dossier-engineer/references/*` — обновлены active contracts for independent review launch, bounded packets, provenance fields, compute policy, and command examples.
- `skills/dossier-engineer/skill.yaml` — обновлена source version и command/stage guidance.
- `skills/dossier-engineer/scripts/dossier-engineer.mjs` и `.map` — rebuilt runtime artifacts.

## Decisions

- `review packet` is read-only derived output. It produces a bounded packet and `packet_hash`; it does not spawn the reviewer and does not write artifacts.
- `review record` remains the only writer for review artifacts. The implementing agent records the independent reviewer's returned report unchanged through the runtime.
- Required gates reject PASS reviews that lack eligible provenance instead of silently treating them as fresh.
- Portable CLI records launch metadata such as `fresh-session-no-fork`; it does not hardcode a specific agent platform or spawn API.
- `reviewer_model=default` is the recommended normal model label. Required gates reject `low` reasoning; high-risk and security-sensitive reviews require `high` or `xhigh`.
- Review packet hashing uses normalized material scope and material live-app evidence scope, not raw full work frontmatter or duplicate verification artifacts.

## Verification Performed

- `cd skills/dossier-engineer && pnpm run format` — PASS.
- `cd skills/dossier-engineer && pnpm test` — PASS, 19 runtime acceptance tests.
- `cd skills/dossier-engineer && pnpm run lint` — PASS, including Biome, ESLint, and TypeScript typecheck.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer` — PASS.
- `rg -n "/home/|/Users/|C:\\\\|file://" skills/dossier-engineer` — PASS, no absolute local path matches.
- Instruction quality audit from `skill-source-compiler` — PASS: active guidance now explains the independent review outcome, exact required-review eligibility fields, reviewer launch constraints, model/reasoning policy, command sequence, validation behavior, and stale/ineligible fallback states without adding a new artifact family.

## Deviations From Plan

- Runtime does not validate that `raw_report_ref` still exists during later eligibility checks; `review record --report` validates the path at record time. Body-preserved findings remain sufficient for eligibility.
- The first implementation kept full work frontmatter in the packet hash; tests exposed metadata churn after `stage ready`, so packet material scope was narrowed to normalized material fields.

## Side Effects

- Existing PASS reviews without independent provenance can still exist as historical artifacts, but they no longer satisfy required closure gates.
- Operators and implementers must run `review packet` and record provenance fields for required reviews that need to close `plan-slice` or `implementation`.
- Duplicate live-app verification for the same entrypoint/runtime path/evidence no longer stales already fresh implementation reviews.

## Follow-up

- Future work can add additional eligible reviewer kinds if the runtime gains another auditable independent-review mechanism.

## Final Status

PASS
