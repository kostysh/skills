---
name: agent-browser
description: Use agent-browser to navigate and interact with rendered web pages,
  fill forms, take screenshots, extract data, and run browser smoke or
  diagnostic checks. Verify the requested terminal state and report completed,
  partial, or blocked; do not replace a formal project E2E suite.
metadata:
  source-version: 0.2.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f6f311a251737095f4be724ffccccec6176e23388fadcf3aabf1b1ffd567826a
allowed-tools: Bash(agent-browser:*)
---

# agent-browser

## Start here

1. Identify the target, requested user-visible result, expected terminal state, and any material limit on external side effects or extraction scope.
2. Run `agent-browser --version` and load the installed CLI's version-matched guidance with `agent-browser skills get core --full`; if unavailable, use `agent-browser --help`.
3. Read `references/cloudflare-access-otp.md` before a human Cloudflare Access email-OTP flow; keep that browser identity gate separate from application authentication and infrastructure credentials.
4. Follow the snapshot loop, verify the requested result, and report exactly one status: completed, partial, or blocked.

## When to use this skill

- Navigating or interacting with rendered websites and web applications from the terminal.
- Filling forms, taking screenshots, recording evidence, exporting PDFs, or extracting rendered content.
- Running sampled browser smoke or diagnostic scenarios and inspecting page, console, or network behavior.
- Producing SPA evidence while distinguishing real backend paths from intercepted or mocked traffic.

## When NOT to use this skill

- Static source inspection or a direct HTTP client can establish the result without a rendered browser.
- The task is to author, maintain, or replace a formal project E2E suite.
- The requested tool is explicitly Playwright or a more specific browser skill owns the target workflow.

## Quick start

Use the guidance shipped by the installed CLI instead of a copied command
reference:

```bash
agent-browser --version
agent-browser skills get core --full
```

The stable interaction loop is:

```bash
agent-browser open <url>
agent-browser snapshot -i
# interact with refs from the current snapshot
# wait for the expected result
agent-browser snapshot -i
agent-browser get url
```

Refs become stale after navigation and material page changes, so snapshot again
before reusing them. If bundled guidance is unavailable, check the root and
relevant subcommand help.

## What proves completion

- Navigation or interaction: the requested final URL or visible state is
  observed.
- Extraction: the requested fields and scope are checked, including pagination
  or lazy loading; otherwise report the extracted subset as partial.
- SPA or integration behavior: state whether relevant network calls were real or
  intercepted. Mocks prove local UI behavior only.
- Diagnosis: browser requests, responses, console, and page errors are evidence;
  another domain owner must establish backend or provider root cause.

A screenshot, snapshot, trace, successful command, or healthy runtime is useful
evidence only when it supports the requested result. It is not completion by
itself.

## Setup boundary

Agent-browser owns its browser runtime. Do not install Playwright packages in the
target project to prepare it. Use the installed CLI's diagnostic and install
guidance, or report a blocked handoff when environment changes are not in scope.

Do not put secrets in command history or reports. Use the installed CLI's
authentication guidance and treat saved state, downloads, screenshots, traces,
and recordings as potentially sensitive.

## Workflow stages

### Workflow stage: Run and verify the browser task

Reach the requested observable result through the rendered page without confusing CLI activity with task completion.

1. Apply the governing user, system, and project policies; this skill does not grant authority for additional external side effects.
2. Use the installed CLI guidance for command syntax. If the runtime fails, use its help or `agent-browser doctor --offline --quick`; use mutating repair commands only when already authorized, and never add Playwright to the target project merely to prepare agent-browser.
3. Open the target, snapshot before using refs, interact, wait for the expected condition, and re-snapshot after navigation or material page changes.
4. Verify the final URL, visible state, or extracted values that establish the requested result; use console, page-error, network, screenshot, or trace evidence only when relevant.
5. For extraction, verify the requested fields and scope, including pagination or lazy-loading limits; if completeness is not established, report the observed subset as partial.
6. Treat intercepted responses as local UI evidence, not proof of a live API or provider path, and do not infer backend root cause from browser symptoms alone.

Validation:

- The expected terminal state is directly observed, or the exact blocker and strongest supported partial result are recorded.

### Workflow stage: Report the browser result

Provide an evidence-bounded outcome instead of a command transcript.

1. Report exactly one status: completed, partial, or blocked.
2. Name the target and context, main actions, expected and observed terminal state, real or intercepted network mode when relevant, and any unverified scope.
3. Do not expose credentials, tokens, cookies, or saved-state contents; report artifacts only when created.
4. Close sessions and processes started for the task, or state what remains running and who owns it.

Validation:

- The user can tell what result was achieved, what was not proved, and whether anything remains running.

## Interop priority

- **Formal browser test suites, fixtures, assertions, coverage, and CI behavior:** the project E2E framework and its testing owner. Agent-browser supplies sampled smoke or diagnostic evidence and does not replace suite coverage.
- **Explicit Playwright CLI work or persistent interactive browser and Electron QA:** playwright or playwright-interactive as requested. Do not silently switch tools when the requested tool or persistent session model is part of the task.
- **Static retrieval or backend, security, accessibility, and other conclusions beyond observed browser facts:** the relevant source, HTTP, or domain skill. Agent-browser owns rendered browser interaction and observed evidence, not adjacent specialized conclusions.

## Gotchas

- **high** — Use the installed CLI's version-matched guidance and help for command syntax; do not maintain or trust a copied command encyclopedia when they disagree.
- **high** — A successful command, snapshot, screenshot, trace, or intercepted response does not prove the requested user-visible result by itself.
- **high** — Keep secrets out of shell history and reports, treat browser artifacts as potentially sensitive, and clean up sessions or processes started for the task.
- **high** — Never substitute Wrangler login, a Cloudflare API token, or an Access service token for a human Cloudflare Access browser login; report blocked when the authorized browser identity or confidential OTP path is unavailable.

## Policies

### Guidance and authority
Governing user, system, and project policies define authority; installed version-matched CLI guidance defines command syntax; this skill does not widen either boundary.

### Browser evidence
Match evidence to the claim and report the target, expected and observed terminal state, relevant real or intercepted network mode, and exact limits of partial or blocked results.

## Optional references
- [Cloudflare Access OTP](references/cloudflare-access-otp.md) — Read this before a browser flow protected by a human Cloudflare Access email OTP, especially when the application has a separate OTP or infrastructure credentials are also available.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep the stable snapshot workflow and evidence contract inside this skill; external CLI guidance supplies only version-specific command details.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Confirm the copied skill remains understandable when the CLI is unavailable, while clearly reporting execution as blocked or handed off.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
