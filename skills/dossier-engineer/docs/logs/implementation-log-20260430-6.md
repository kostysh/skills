# Implementation Log 2026-04-30-6

## Task

Add runtime `Next actions` reminders for body completion after scaffold artifact creation.

## Capability vs Substrate

Observable behavior: when runtime creates a source, capability, baseline, guardrail, work item, review, verification, or changeset artifact, CLI output includes an additional next action that reminds the agent to complete the human-readable body before stage close, handoff, PR preparation, or final response.

Substrate: this change does not validate body completeness, infer whether prose is meaningful, or block scaffold creation. It reinforces the existing Body Completion Gate in runtime output.

## Completed

- Added a centralized runtime helper that appends body-completion reminders based on created artifact types.
- Covered scaffold-generating command output with a CLI contract test.
- Documented the reminder behavior in the runtime command guide.
- Registered this implementation log in `skill.yaml`.

## Verification

- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`
- `pnpm run format`
- `pnpm run format:check`
- `pnpm run lint`
- `pnpm test`
- `git diff --check`

## Instruction Quality Audit

PASS.

- The instruction contract distinguishes a runtime reminder from a validation gate.
- The body-completion rule remains anchored in `SKILL.md` and `references/body-completion.md`.
- The runtime reminder is centralized, so new scaffold commands using `created_artifacts` inherit the behavior.
- The anti-claim is explicit: this does not prove completed body content.

## Residual Risk

The reminder depends on scaffold commands reporting created artifact types correctly in `created_artifacts`.
