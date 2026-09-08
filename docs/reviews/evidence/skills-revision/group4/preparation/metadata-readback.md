## implementation-discipline
```yaml
description: Use when implementing, refactoring, reviewing code, or authoring,
  revising, and reviewing PRDs, architecture, software specs, and delivery plans
  to keep scope source-authorized, minimize conceptual surface, and require
  proportional evidence.
```
UI not shipped

## security-reviewer
```yaml
description: Perform bounded security review of code, CI, permissions, webhooks,
  secrets, data access, and config. Use for vulnerability review, exploitability
  triage, or scoped audits. Own threat modeling, confidence gating, attack
  paths, and findings—not scan orchestration, compliance, pentesting, or fixes.
```
UI SHA256 d4f95ce6a167349b42743a4270ad2a483d87f2ac1eab8df9105958b7339d97ee

## git-engineer
```yaml
description: Use for repository-aware Git staging, commits, branches, worktrees,
  merge, rebase, cherry-pick, and safe pushes. Preserve unrelated work, apply
  Conventional Commits with emoji by default, and verify exact refs. Route
  GitHub resources, code review, and CI remediation to their owning skills.
```
UI SHA256 004eb840aa4b557d7ec581f040ab0a76b6d2c16037ab02e1d9b42d2adba3a354

## gh-utility
```yaml
description: Use when GitHub CLI (`gh`) is required for repos, issues, PRs,
  Actions, releases, Projects, Codespaces, secrets, variables, rulesets, search,
  API access, or `gh skill` commands. Keep targets explicit and verify changes;
  route Git history, review, CI fixes, security, and skill authoring elsewhere.
```
UI SHA256 cf65eaf5836119c1b7933f671a300b7de89af334a01831f25a3dbfb1741293a3

## architecture-engineer
```yaml
description: Design or revise architecture for AI-agent-driven development. Use
  when product scope, features, integrations, data, security, deployment, or
  findings require architectural requirements, boundaries, patterns, trade-offs,
  quality scenarios, spikes, ADRs, or handoff—not implementation backlogs.
```
UI SHA256 3420b7777dd1e4ba70e2f1bc7d35332f84601dee6cdc74a107979581a1f7e982

## spec-engineer
```yaml
description: Create concise, falsifiable software specs for AI coding agents.
  Use to turn ideas, tickets, APIs, domain rules, migrations, workflows, or
  function behavior into implementation-ready Markdown with observable
  requirements, acceptance evidence, anti-claims, source authority, and handoff
  readiness.
```
UI SHA256 a25ee17018d4c53dbdbc738ead78156d313ff5d3a36b8ee61a47f74cf695ddca

## delivery-planner
```yaml
description: Turn accepted product scope and architecture handoff into
  right-sized executable work for AI agents. Use for project, feature, module,
  service, or integration planning, sequencing, risk-aware breakdown, and
  routing gaps to owning skills. Produce one Delivery Plan, not rigid workflow
  registers.
```
UI SHA256 15fa04bbb796d07672569a8d5256c9f837537b013f2d8844d258c5a49d74fd66

## typescript-test-engineer
```yaml
description: Design, implement, review, and diagnose TypeScript tests for Node,
  React, and edge projects. Use for test strategy, node:test or Vitest,
  deterministic fixtures and mocks, coverage, CI failures, hanging tests, and
  evidence quality; keep review and diagnosis read-only unless fixes are
  requested.
```
UI SHA256 9fc7def9a8ab00f4acd2d5dfd8c166e5fcd853de375a8d620b24660ea1512a04

## concept-conformance-reviewer
```yaml
description: Review features, specs, plans, acceptance criteria,
  implementations, and closure claims against an established product or system
  concept. Use when scaffolding, APIs, mocks, tests, evidence, or docs may be
  mistaken for observable capability; not for ordinary spec, code, security, or
  domain review.
```
UI not shipped

## spec-conformance-reviewer
```yaml
description: Review code against authoritative specs, contracts, ADRs, tickets,
  PRDs, RFCs, migrations, and acceptance criteria. Build requirement-to-code
  traceability, identify compliance gaps or ambiguities, and issue an
  implementation-versus-spec verdict limited by source authority and evidence.
```
UI SHA256 cfb46dd79b7c1dbea6f21726d24c55d1ecde761ced9005f103ffb30629c88b2b
