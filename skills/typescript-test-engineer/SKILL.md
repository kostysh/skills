---
name: typescript-test-engineer
description: Design, implement, review, and diagnose TypeScript tests for Node,
  React, and edge projects. Use for test strategy, node:test or Vitest,
  deterministic fixtures and mocks, coverage, CI failures, hanging tests, and
  evidence quality; keep review and diagnosis read-only unless fixes are
  requested.
metadata:
  source-version: 0.1.7
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: e140d4c5cbd57a5b97bf9b44371ac089a4c95d87495019418093ccc6aa3c4e8d
---

# typescript-test-engineer

## Start here

1. Classify the request as design, implementation, review, or diagnose before selecting a workflow; review and diagnose are read-only unless the user explicitly requests fixes.
2. Resolve expected behavior from explicit user decisions, accepted specifications or acceptance criteria, and repository contracts; treat current implementation and existing tests as evidence, not authority when sources conflict.
3. Follow the repository test runner and existing conventions before applying defaults.
4. Keep tests deterministic, behavior-focused, isolated from real network calls, and warning-clean.
5. Use the smallest check that proves the behavior, but do not replace high-risk boundary verification with a tiny self-check.
6. If expected behavior remains missing or contradictory after repository inspection, stop with a blocked or limited result instead of inventing assertions.
7. Report mode-specific outputs, exact validation evidence, and any unverified production boundary before claiming completion.

## When to use this skill

- Designing, writing, reviewing, or fixing tests in TypeScript Node, edge, or React projects.
- Debugging node:test, Vitest, mocks, hanging tests, open handles, deprecations, coverage, or CI test behavior.
- Applying explicit TDD only when the user asks for it.

## When NOT to use this skill

- The task is pure TypeScript language work without test design or runner behavior.
- The task is browser interaction automation rather than test strategy or formal project E2E; use agent-browser for smoke and browser diagnostics when available.
- The task is security-sensitive CI permission or secret handling without a testing focus; use security-reviewer.

## Overview

Use this skill to turn an authoritative behavior contract into deterministic TypeScript test design, implemented tests, review findings, or a bounded diagnosis. The result must identify what was actually exercised and must not present green tooling, coverage, fixtures, or mocks as proof of a broader production capability.

## Scope and capability boundary

Apply this skill to TypeScript test strategy and runner behavior for Node, React, and edge projects. Repository runner policy and existing conventions win over defaults.

This skill can:

- select proportionate unit, integration, contract, E2E, or smoke evidence;
- design or implement tests when the selected mode authorizes it;
- review changed behavior against test evidence;
- diagnose runner failures, hangs, warnings, coverage differences, and flaky async behavior.

This skill does not define framework, platform, security, money, persistence, or product behavior. Consume those rules from accepted sources and the relevant domain owner. Browser smoke evidence does not satisfy a formal repository E2E gate unless the repository contract says it does.

## Core testing rules

- Prefer deterministic, order-agnostic tests and avoid shared mutable global state.
- Assert observable outcomes, state transitions, errors, and side effects instead of internal call shape unless the call is itself the contract.
- For low-risk helpers, use the smallest runnable check that fails on the targeted behavior regression.
- Do not downshift security, privacy, money, data-loss, auth, accessibility, release, persistence, RLS, RPC, provider, or production-wiring verification to a tiny self-check.
- When a sourced contract forbids behavior, add negative or fail-closed coverage; for security-sensitive code, missing negative coverage is a test gap.
- Use dependency injection or targeted mocks for isolation. Unit and integration tests must not make uncontrolled real network calls.
- Test doubles must be local or test-only and impossible to select in stage or production runtime.
- Fixtures must preserve relevant production invariants rather than invent convenient roles, sessions, tenants, profiles, readiness, or status combinations.
- In-memory stores and mocks can prove API flow but cannot prove persistence, RLS, RPC, provider authorization, service-role safety, or other unexercised boundaries.
- For state-changing doubles, use a shared contract suite when the double reimplements production state transitions or authorization behavior.
- For event-driven tests, subscribe or create the listener promise before triggering the action that may emit the event.
- For hanging tests in diagnose mode, isolate the repro, inspect handles, identify the cause and evidence limits, and recommend remediation without editing. Only when fixes are explicitly authorized may implementation repair teardown where the resource is created, stress-rerun the isolated case, and run the full relevant suite.

## Test-evidence selection

1. Identify the named behavior, falsifier, risk, runner, TypeScript execution path, and downstream consumer.
2. Select the evidence layer that owns the invariant:
   - unit for pure local input/output and branching;
   - integration for service, HTTP, middleware, adapter, and composition behavior;
   - contract for shared producer/consumer or production/double invariants;
   - runtime or database boundary tests for RLS, RPC, bindings, persistence, or provider behavior;
   - formal E2E for repository-defined user journeys and deployed boundaries;
   - browser smoke only for sampled interaction evidence and diagnostics.
3. For specified or implied forbidden behavior, plan negative/fail-closed tests from `references/testing.md`; for security-sensitive code, treat missing negative tests as a test gap.
4. For side-effecting/state-changing behavior, list applicable failure modes from the negative matrix in `references/testing.md`; mark irrelevant rows `N/A` with a reason in the design or review notes.
5. For replay/rate-limit regression tests, name the targeted risk or failure mode and make the exercised scenario or assertions prove that exact risk; a prose label alone is not coverage.
6. Use clear Arrange-Act-Assert and deterministic time, random, IDs, ports, data, and cleanup where relevant.
7. Run repository-native checks for the selected contour and inspect failures, warnings, stderr, skips, hangs, and coverage differences.

## Confidence contours

Repository policy wins. When no policy exists, use:

- local: targeted tests for fast feedback;
- PR: required deterministic gates for merge risk;
- release: full repository-required gates and documented smoke or E2E evidence where the accepted behavior or release policy requires it; coverage only when an accepted coverage contour exists.

Add repeated shuffle, soak, or nightly stability contours only when the repository defines them. Do not invent telemetry, thresholds, or scheduled jobs from this skill alone.

## Runner and environment selection

- Follow the existing runner. Do not migrate Jest, Vitest, or `node:test` unless runner migration is the task.
- For modern supported Node versions, built-in TypeScript type stripping can execute erasable `.ts` syntax, but it does not type-check, read `tsconfig.json`, transform path aliases, or support syntax that requires JavaScript emit. Read the Node section of `references/testing.md` before choosing direct execution, a build path, or a third-party loader.
- For React, read `references/react-vitest.md`; distinguish simulated DOM tests from Vitest Browser Mode and external browser smoke.
- For Cloudflare Workers without a repository-specific harness, use the current Workers Vitest integration for local runtime unit and integration tests. Treat `unstable_dev` as a legacy migration case, not the default.
- For formal E2E, follow the repository contract and use dedicated test or sandbox credentials. Never use production credentials or real payment instruments.

## Warning and coverage boundaries

- Fix warnings introduced by the current change. For pre-existing or upstream-blocked warnings, record the exact warning, ownership, blocker, and next evidence instead of silently broadening the mutation scope.
- Use the repository coverage command when it exists. Coverage is a signal about exercised code, not proof of assertion quality or real-boundary behavior.
- When normal tests pass but coverage fails, diagnose by rerunning the exact coverage command, comparing flags and environment, and isolating under instrumentation. Recommend the root-cause fix without editing; only an explicitly authorized implementation may apply it before changing thresholds or timeouts.
- When timeout changes are explicitly authorized and justified, centralize integration timeouts in runner configuration or repository scripts; never use increases to hide unresolved async work, open handles, or long polling.

## TDD opt-in

Use TDD only when the user explicitly requests it. Then read `references/tdd.md`. A regression test added after an already-implemented fix is valid test work but is not represented as test-first TDD. Never delete or rewrite existing production code merely to recreate a TDD sequence without separate destructive-change authorization.

## Conditional references

- `references/testing.md` — read the relevant section for Node, edge, integration, E2E, databases, coverage, events, mocks, or hanging tests.
- `references/testing-anti-patterns.md` — read when writing or reviewing mocks, fixtures, test doubles, or test utilities.
- `references/react-vitest.md` — read for React, Vitest, Testing Library, DOM environments, Browser Mode, and async UI tests.
- `references/tdd.md` — read only after explicit TDD opt-in.

If an interop skill such as `agent-browser`, `code-reviewer`, or a domain owner is unavailable, preserve its boundary: provide the test strategy or limited finding that this skill owns and report the unperformed browser, formal-review, or domain judgment instead of inventing evidence.

## Workflow stages

### Workflow stage: Resolve mode and behavior contract

Establish mutation authority, expected behavior, evidence boundary, and the honest completion state before designing assertions.

1. Classify the request as design, implementation, review, or diagnose; do not mutate files in review or diagnose mode.
2. Identify the requested scope, runner, TypeScript execution path, test level, changed behavior, and downstream consumer.
3. Apply source precedence: explicit user decisions, accepted specifications or acceptance criteria, then repository contracts and conventions; use implementation and existing tests as evidence only.
4. Inspect callers and nearby sources when behavior is underspecified; return blocked or limited when a material conflict remains.

Validation:

- Mode and allowed side effects are explicit.
- Expected behavior is sourced, or the result is honestly blocked or limited.
- No green test, coverage number, mock, fixture, or current implementation is treated as authority by itself.

### Workflow stage: Design or implement behavior-focused tests

Produce the smallest sufficient test design or authorized test change that proves the named behavior and applicable falsifiers.

1. For low-risk helper logic such as a branch, loop, parser, formatter, or pure utility, choose the smallest runnable check that would fail if the behavior regresses.
2. For specified or implied forbidden behavior, plan negative/fail-closed tests from the contract source: spec, security/privacy contract, CI/CD gate, auth/RBAC, validation, redaction, environment isolation, or acceptance falsifier.
3. For side-effecting/state-changing behavior, list applicable negative matrix rows and mark irrelevant rows N/A with a reason.
4. Design isolated fixtures, mocks, and assertions that prove the named risk or behavior; use shared contract suites when test doubles replace production state-changing components.
5. In design mode, return the test plan without changing files; in implementation mode, change only the explicitly authorized scope and use clear Arrange-Act-Assert.

Validation:

- Tests assert observable behavior, covering the happy path and relevant negative/fail-closed cases instead of relying on happy-path coverage alone.
- Low-risk helper checks are intentionally small but still fail on the targeted behavior regression.
- For security-sensitive code, missing negative/fail-closed tests are reported as a test gap.
- Relevant side-effecting/state-changing risks are covered or explicitly marked N/A by relevance.

### Workflow stage: Review or diagnose without implicit remediation

Produce evidence-backed findings or a diagnosis while preserving the read-only boundary.

1. For review, freeze the target scope, read the full touched diff, and map each changed behavior to existing, added, removed, or weakened tests.
2. For diagnosis, reproduce or isolate the failure when safe, identify the cause and evidence limits, and recommend the smallest remediation without applying it.
3. Route formal diff severity and merge guidance to code-reviewer while retaining ownership of test-strategy and runner judgments.

Validation:

- No file or external state changed unless the user separately authorized fixes.
- Findings and diagnoses distinguish proven behavior, gaps, assumptions, and unassessed boundaries.

### Workflow stage: Verify and report proportionate evidence

Run the checks appropriate to the selected mode and report a decision-complete result without substrate-only closure.

1. In implementation mode, run relevant tests, inspect warnings and stderr, resolve warnings introduced by the change, and run repository-required coverage or CI gates.
2. For CI workflow changes, validate touched YAML and pair with security-reviewer when permissions, secrets, or untrusted inputs change.
3. Report the mode-specific output contract and name every required check that did not run with its blocker and next-best evidence.

Validation:

- Implementation output maps behavior to changed tests, files, commands and results, warning status, coverage status, and unverified boundaries.
- Review output includes stable scope, behavior-to-test mapping, findings with evidence, unverified areas, and a test-adequacy verdict.
- Design output includes test levels, scenarios and falsifiers, fixture or boundary needs, intended commands, and open assumptions.
- Diagnose output includes reproduction or symptom, cause evidence, evidence limits, and recommended remediation.

## Interop priority

- **TypeScript language and type-system rules:** typescript-engineer. This skill owns testing strategy and runner behavior, while TypeScript language semantics belong to typescript-engineer.
- **Stable diff scope, finding severity, and merge guidance:** code-reviewer. code-reviewer owns the formal read-only review process; this skill supplies test-strategy and runner-domain judgments.
- **Authorized code and test remediation:** implementation-discipline. implementation-discipline owns mutation discipline and minimal changes; this skill owns the test behavior and evidence contract.
- **Browser smoke sessions and interaction diagnostics:** agent-browser. Use agent-browser when available for sampled browser interaction evidence; formal repository E2E remains owned by the project test suite and its framework tooling.
- **CI permissions, secrets, and untrusted inputs:** security-reviewer. security-reviewer owns permissions, secrets, untrusted-input, and exploitability judgments; this skill owns tests that exercise the sourced security contract.
- **Framework, platform, and domain behavior used as the test oracle:** the relevant framework or domain skill. Specialized owners define the behavior contract; this skill converts that contract into proportionate test evidence without inventing domain rules.

## Gotchas

- **high** — Do not let UI tests pass against fixtures that drift from exported server schemas, route names, validation problem shapes, history payload contracts, or security boundaries.
- **high** — Do not change tests, production code, configuration, or deprecated APIs during review or diagnosis unless the user separately requests remediation.
- **high** — Do not activate TDD or delete already-written code unless the user explicitly requested TDD and separately authorized any destructive rewrite.
- **high** — A green suite, coverage percentage, mock, fixture, generated file, or test name is evidence only for what it actually exercises; none proves an unexercised production boundary.

## Policies

### Mode and mutation boundary
Classify every task as design, implementation, review, or diagnose. Design returns a plan; review and diagnose stay read-only; implementation changes only the explicitly authorized scope. A request to review, assess, inspect, or diagnose does not authorize fixes.

### Behavior authority and readiness
Use explicit user decisions, accepted specifications or acceptance criteria, and repository contracts as behavior authority in that order. Treat current implementation and existing tests as evidence, not authority when sources conflict. Inspect callers and sources first, then return blocked or limited rather than inventing expected behavior.

### Mode-specific output
Implementation reports behavior-to-test mapping, changed files, exact commands and results, warnings, coverage, and unverified boundaries. Review reports stable scope, behavior-to-test mapping, evidence-backed findings, unverified areas, and verdict. Design reports levels, scenarios, falsifiers, fixtures, commands, and assumptions. Diagnose reports symptom or reproduction, cause evidence, limits, and recommended remediation.

### Completion evidence
When reporting completion, name the relevant test, coverage, or CI validation commands that ran; state whether warnings and stderr were clean or documented; and call out any check that could not run with the exact blocker and next-best evidence. Do not imply completion while required validation is missing or still failing.

### Structural evidence limit
Test-file existence, regex contract tests, coverage percentages, mocks, fixtures, and green commands are substrate or bounded evidence. Claim the named behavior only when the corresponding scenario or real boundary was exercised; otherwise report the gap.

### Smallest sufficient check
Prefer the smallest runnable check that fails on the behavior regression for low-risk logic. Do not use that rule to downshift security, privacy, money, data-loss, auth, accessibility, release, persistence/RLS/RPC/provider, or production-wiring verification.

### Scenario template coverage
For API validation, form validation, loading indicators, route naming migration, and history payload work, include tests for both the happy path and the falsifier that previously failed or could pass as substrate-only behavior.

## Optional references
- [React Vitest](references/react-vitest.md) — Read this for React tests using Vitest, Testing Library, jsdom, happy-dom, or Browser Mode.
- [Tdd](references/tdd.md) — Read this only when the user explicitly requests TDD.
- [Testing Anti Patterns](references/testing-anti-patterns.md) — Read this when writing or reviewing mocks, fixtures, test doubles, or test utilities.
- [Testing](references/testing.md) — Read only the relevant section for Node, edge, integration, E2E, database, coverage, event, or hanging-test work.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory typescript-test-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every linked reference listed by SKILL.md exists inside this skill folder and that optional interop skills are not required for the core capability.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
