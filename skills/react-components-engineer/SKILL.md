---
name: react-components-engineer
description: Build, harden, review, and diagnose reusable React components
  across SSR, hydration, multiple instances, portals, Effects, opaque children,
  and server/client boundaries. Use for component-level runtime resilience;
  route app architecture, styling, test strategy, and security verdicts to their
  owners.
compatibility: Portable documentation-only engineering skill. It ships no
  runtime or test harness and requires repository evidence plus installed React
  and framework versions for project-specific decisions.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 2c04626f28953a33b303a8f18b71dbdca6a0f960e25d8dfc147cf61f1f54a58b
---

# react-components-engineer

## Start here

1. Classify the task as create/change, review, or diagnose; review and diagnosis remain read-only unless remediation is explicitly authorized.
2. Establish the observable component behavior, consumer, supplied code, repository instructions, installed React and framework versions, release channel, applicable execution contexts, existing conventions, and available verification before choosing a pattern.
3. Apply precedence in this order: operator and repository instructions; accepted product, API, accessibility, and security contracts; manifest, lockfile, configuration, and existing code; official documentation matching the installed version and release channel; then examples in this skill.
4. Apply only risks supported by the component's actual execution contexts. Do not introduce a Canary or Experimental API, change the React release channel, or replace a framework-owned mechanism without explicit authority.
5. Stop as blocked when equal-authority sources conflict or a required product, security, framework, or compatibility decision has no owner-supplied answer. Otherwise provide the strongest bounded result and label missing evidence.
6. Define claim-matched behavioral evidence before changing anything. Source files, API imports, Storybook stories, mocks, typecheck, lint, build, or compiler success prove only their own contours.

## When to use this skill

- Creating, changing, reviewing, or diagnosing reusable React components and providers when runtime correctness across rendering contexts is material.
- Hardening component behavior for SSR, hydration, repeated mounts, multiple instances or roots, opaque children, portals, iframes, pop-out windows, Effects, transitions, Activity, or memoization.
- Assessing component-level server/client boundary mechanics alongside the framework and security owners.

## When NOT to use this skill

- App routing, data layers, forms, persistence, or SPA integration are the primary concern; use react-spa-engineer.
- Next.js App Router, RSC transport, caching, hydration shell, or framework configuration is the primary concern; use nextjs and pair this skill only for component semantics.
- The task is primarily visual design, design-system presentation, or styling; use frontend-design.
- The task is a formal accessibility or UX audit, test-runner strategy, TypeScript toolchain decision, security verdict, or general PR verdict; route that primary decision to its owning skill.

## Overview

Build React components that preserve their declared behavior in the rendering contexts the project actually uses.

## Capability and anti-claims

This skill succeeds when it identifies a concrete component-level failure path, selects a project-compatible React pattern, and reports a result whose status is supported by evidence from the relevant renderer or browser boundary.

The instructions do not create runtime capability, choose a framework contract, grant authorization, prove accessibility or performance, or establish security by themselves. A hook, API import, wrapper, Storybook story, mock, typecheck, build, or generated file is bounded evidence and cannot close a broader behavior claim.

## Context decision matrix

| Context | Apply when | Required invariant | Claim-matched evidence |
| --- | --- | --- | --- |
| Every render | Always | Render is pure; state ownership is explicit; Effects synchronize only with external systems and have symmetric cleanup | Re-render and lifecycle scenario covering the external behavior |
| SSR and hydration | The component is server-rendered and hydrated | Server render does not touch browser-only APIs; initial client output matches server output | Server render plus hydration with mismatch/recoverable-error observation |
| Multiple instances or roots | Reuse, repeated mounts, or multiple roots are possible | No hardcoded shared DOM IDs or mutable singleton state; root prefixes are coordinated by the root owner | Two instances or roots exercised together |
| Opaque composition | The public API accepts arbitrary `children` or slots | Do not infer child shape without an explicit element contract; data flow remains traceable | Supported child forms and invalid-contract behavior exercised |
| Portal, iframe, or pop-out | DOM or events may live in another document | Browser resources derive from the owned DOM node or an explicit realm contract | Scenario in the actual target document/window |
| Visibility lifecycle | Activity or retained hidden UI is used | State and external side effects follow the installed API's visible/hidden lifecycle | Hide, update, reveal, and cleanup behavior exercised |
| Server/client boundary | RSC or another server/client component boundary is real | Client props follow the framework serialization contract; sensitive fields are allowlisted on the server | Framework integration/build plus boundary behavior; security owner evidence for security claims |
| Transition or optimization | The feature exists and a measured interaction or duplicate-work path is in scope | Optimization APIs never carry semantic correctness; version and release-channel gates are satisfied | Observed transition or measurement matching the claim |

Exclude contexts that project evidence makes impossible. Do not add substrate to satisfy an inapplicable row.

## Version-sensitive API gates

| API | Gate | Boundary |
| --- | --- | --- |
| `useId` | Installed React supports it and a component-owned DOM relationship needs an ID | Not for list keys, data identity, cache keys, or async Server Components; multiple roots require owner-coordinated `identifierPrefix` |
| `cache` | React Server Components are actually used | Request-scoped memoization and shared snapshots only; it is not a concurrency-correctness primitive and framework caching policy still wins |
| `startTransition` | A non-urgent state update is appropriate | It does not create a View Transition and must not control text inputs; pending UI requires the matching transition API |
| `<Activity>` | The installed stable React version exposes it and the component uses retained hidden UI | Hidden mode destroys Effects and later recreates them while preserving state; verify any globally scoped DOM or CSS behavior separately |
| `<ViewTransition>` | The project already uses a React channel that exposes it | Canary/Experimental feature; requires a real `<ViewTransition>` boundary and transition-driven update, never a release-channel upgrade by default |
| Experimental taint APIs | The project already uses a compatible Experimental RSC environment | Optional defense-in-depth after authorization, DTO allowlisting, and isolation; never security closure |
| `useMemo`, `memo`, `useCallback` | Profiling or a concrete dependency-identity need justifies them | Performance hints only; correctness must survive cache discard or re-render |

For detailed patterns and caveats, load [React Component Resilience Patterns](references/bulletproof-patterns.md) only for the applicable contexts.

## Workflow stages

### Workflow stage: Establish the component basis

Make the task mode, authority, compatibility boundary, runtime claim, side effects, and proof target explicit.

1. Inspect applicable repository instructions, accepted contracts, package manifest and lockfile, relevant component and call sites, renderer or framework configuration, installed versions, current behavior, and available checks.
2. Record mode, in-scope component contract, consumer, allowed mutations, applicable contexts, source precedence, unresolved inputs, and the observable behavior or review question.
3. For review or diagnosis, remain read-only. For authorized changes, preserve the public API unless the requested outcome requires a deliberate contract change.

Validation:

- The next action does not depend on an invented React version, release channel, framework behavior, product rule, or security claim.
- Each selected resilience risk has a concrete failure path in the supplied component and contexts.

### Workflow stage: Select and apply the smallest supported pattern

Correct the applicable component failure without universal checklists or version-incompatible APIs.

1. Load the optional resilience reference only for the concrete risks in scope and apply its version and context gates.
2. Prefer project-native and stable React or framework mechanisms; add a version-sensitive API only when the installed environment supports it and the component actually uses the corresponding feature.
3. Preserve render purity, deterministic server/client output where hydration applies, symmetric Effect setup and cleanup, per-instance ownership, opaque-child contracts, correct DOM realm ownership, and explicit server/client data boundaries as applicable.
4. Route framework, security, accessibility, visual, TypeScript, test-runner, and formal-review decisions to their owners while retaining component-semantics responsibility.

Validation:

- The change or finding addresses the observed failure path instead of merely adding a recommended API, wrapper, story, test file, or checklist item.
- Stable projects receive no unsupported Canary or Experimental imports and no release-channel change without explicit authority.

### Workflow stage: Verify and hand off the component result

Match the completion status to observed evidence and give the next consumer an actionable result.

1. Run only applicable scenarios, using the existing project test stack and a real renderer or browser boundary when the claim depends on hydration, another document, visibility lifecycle, or server/client integration.
2. Classify the result as verified, partial, or blocked. Verified requires evidence that exercises the claimed behavior; an implemented change without that evidence is partial.
3. Report mode, component contract, applicable contexts, change or findings, verification evidence, status, residual risks or blockers, anti-claims, and next owner.

Validation:

- Unavailable or lower-fidelity verification lowers the result status instead of being reported as completed.
- The handoff does not imply framework support, accessibility, performance, or security assurance that was not established by the owning skill and evidence.

## Interop priority

- **TypeScript language, compiler, tsconfig, module resolution, and lint configuration:** typescript-engineer. react-components-engineer owns component runtime semantics; typescript-engineer owns language and toolchain correctness.
- **Test strategy, runner behavior, fixtures, mocks, determinism, and CI contours:** typescript-test-engineer. react-components-engineer defines the component behavior and required scenario; typescript-test-engineer owns test design and runner correctness.
- **Client-side routing, data, forms, state, persistence, and SPA feature integration:** react-spa-engineer. react-spa-engineer owns the application flow; react-components-engineer owns reusable component behavior within that flow.
- **Next.js App Router, RSC transport, directives, caching, hydration shell, and framework configuration:** nextjs. nextjs owns framework semantics and installed-version behavior; react-components-engineer owns the reusable component contract at that boundary.
- **Visual hierarchy, styling, motion design, responsive composition, and design-system presentation:** frontend-design. frontend-design owns presentation decisions; react-components-engineer preserves runtime correctness.
- **Formal UX and accessibility review:** web-ui-reviewer. web-ui-reviewer owns the audit verdict; react-components-engineer implements or reviews component-level runtime corrections.
- **Sensitive-data classification, authorization, exploitability, threat modeling, and security verdicts:** security-reviewer. security-reviewer owns security assurance; react-components-engineer enforces only the accepted server/client component boundary.
- **Formal PR findings, severity, merge guidance, and review verdict:** code-reviewer. code-reviewer owns the formal verdict; react-components-engineer supplies React component domain analysis and implements authorized remediation.

## Gotchas

- **high** — Do not recommend an API from a different React release channel or version as a universal hardening step; prove installed support and feature applicability first.
- **high** — An imported API, hook, wrapper, Storybook story, mock, typecheck, build, or green unit test can be useful substrate without proving SSR, hydration, cross-document, lifecycle, RSC, performance, or security behavior.
- **high** — A reusable component must not silently inject a pre-hydration script or suppress a mismatch; app-shell ownership, CSP and escaping, framework support, and identical initial output must be resolved first.
- **high** — Experimental taint APIs are optional defense-in-depth for supported RSC environments, not a substitute for server authorization, DTO allowlisting, isolation, or a security review.
- **high** — Do not assume one global window, document, DOM id, mutable singleton, mount, or Effect setup; derive ownership from the component instance and mirror every external setup with cleanup.
- **medium** — Use useId for component-owned DOM and accessibility relationships, not list keys, data identities, cache keys, or async Server Components.

## Policies

### Applicability-first policy
Evaluate and verify only contexts that the component contract and project evidence make possible; an inapplicable axis is excluded with rationale, not mechanically implemented.

### Stable supported mechanism policy
Prefer the installed stable React and framework mechanisms. Canary or Experimental APIs require existing project adoption or explicit operator authority and must retain their channel caveats.

### Evidence and status policy
Report verified only when claim-matched behavior was exercised. Report partial when analysis or implementation is useful but the required boundary was not observed, and blocked when a missing authoritative decision or conflict prevents a safe result.

## Optional references
- [React Component Resilience Patterns](references/bulletproof-patterns.md) — Read this when a concrete SSR, hydration, multi-instance, composition, portal, Effect lifecycle, transition, Activity, RSC, sensitive-data, or memoization risk is in scope and exact pattern or version caveats are needed.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory react-components-engineer guidance inside this skill folder.
- Treat external documentation links as optional provenance; the local instructions must remain sufficient offline.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search active instructions and declared files for absolute local dependencies before finishing.
- Confirm every active reference listed by SKILL.md exists inside this skill folder.
- Confirm a copied skill remains understandable without repository history, runtime files, or supporting logs.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
