---
name: shadcn
description: "Build and maintain shadcn/ui projects with Base UI defaults:
  inspect components.json, use current CLI/docs, add or update registry
  components safely, compose and theme them, and verify project behavior. Use
  for shadcn components, registries, presets, configuration, fixes, or
  debugging."
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b8dd2d26ad23f9f6dee0514fae50d6cd1173e43989abf4b69ea0c2bd05198461
---

# shadcn

## Start here

1. Confirm that the task requires shadcn-specific component, registry, preset, configuration, or composition guidance.
2. Identify the project root and acquire current project context before choosing imports, paths, dependencies, or component APIs.
3. Treat Base UI as the current default for new shadcn work and use project-resolved documentation for exact APIs.
4. Load only the active references whose triggers match the task.
5. Define the observable result and the checks that must pass before changing files.

## When to use this skill

- Initializing or configuring shadcn/ui and components.json.
- Searching, adding, updating, composing, styling, fixing, or debugging shadcn components and registry items.
- Inspecting or applying shadcn presets with the current CLI.

## When NOT to use this skill

- The task neither creates nor uses shadcn/ui, components.json, registry items, or shadcn presets.
- The task is broad visual direction rather than shadcn component composition; use frontend-design.
- The task is React runtime correctness, application architecture, or framework behavior without a shadcn-specific decision.
- The user requests a formal code, UX, or accessibility verdict; use the owning review skill and provide shadcn domain input only.

## Overview

Build and maintain shadcn components as source code inside the user's project. The skill succeeds when the requested UI works in the target project and the strongest claimed status is supported by project or interaction evidence.

Base UI is the default for new shadcn work. Use current project-resolved documentation and installed source for exact component APIs instead of relying on remembered examples.

## Inputs and authority

Minimum useful inputs are the project root and the requested component, registry item, preset, fix, or composition. Before choosing imports, paths, dependencies, or props:

1. inspect `components.json`, `package.json`, and the lockfile;
2. choose the matching runner (`pnpm dlx`, `npx`, or `bunx --bun`);
3. run `shadcn info --json` from the project root when `components.json` exists;
4. inspect installed component source when project info is incomplete or a component has local changes.

If project context cannot be acquired, stop before dependent mutations or produce a clearly limited example that does not claim project integration.

Use this precedence when sources disagree:

1. operator constraints;
2. repository instructions;
3. inspected project configuration and installed source;
4. current CLI help and official shadcn documentation;
5. examples in this skill.

## Default workflow

1. **Inspect before adding.** Check installed components and resolved UI paths. Reuse installed source instead of re-adding it.
2. **Discover deliberately.** Use `shadcn search` for registries. An unqualified official component such as `button` does not need a registry question; ask only when multiple third-party sources could satisfy the request.
3. **Fetch current APIs.** Run `shadcn docs <components...> --json`, fetch the returned URLs, and inspect local wrappers before choosing props.
4. **Preview changes.** Use `add --dry-run`, `--diff`, or `--view` before updating installed components or accepting third-party registry code.
5. **Apply surgically.** Preserve local variants and user changes. Never use `--overwrite` or apply a broad preset without explicit authority.
6. **Inspect emitted source.** Verify aliases, icon imports, dependencies, composition, accessibility names, and client/server boundaries.
7. **Prove the result.** Run the narrowest relevant typecheck, lint, tests, or build. Exercise changed interaction through an existing browser test or targeted smoke check when practical.

Read [CLI](references/cli.md) for command and preset workflows. Load only the component references that match the task.

## Component selection

| Need | Prefer |
| --- | --- |
| Action | `Button` with an existing variant |
| Text or structured input | `Input`, `Textarea`, `Select`, `Combobox`, `InputOTP` |
| Independent boolean setting | `Switch` or `Checkbox`, based on form semantics |
| Single choice | `RadioGroup`, `Select`, or documented single `ToggleGroup` |
| Multiple toggled choices | Documented multiple `ToggleGroup` |
| Data display | `Table`, `Card`, `Badge`, `Avatar` |
| Navigation | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination` |
| Overlay | `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Popover` |
| Feedback | `sonner`, `Alert`, `Progress`, `Skeleton`, `Spinner` |
| Empty state | `Empty` |

## Stable guardrails

- Prefer installed components and built-in variants before custom primitives or duplicated styles.
- Use project aliases and the configured icon library; do not hardcode `@/` or one icon package.
- Follow [Forms](references/rules/forms.md) for fields, input groups, choice semantics, and validation.
- Follow [Composition](references/rules/composition.md) for overlays, groups, cards, triggers, and link-styled buttons.
- Follow [Styling](references/rules/styling.md) and [Customization](references/customization.md) without changing the project's configured theming mode.
- Follow [Icons](references/rules/icons.md) for spacing attributes and imports.

## Updates and presets

For an installed component, preview upstream changes per file and merge them with local modifications. Overwrite only after the user explicitly accepts replacement.

For presets, inspect current state with `shadcn preset resolve`. Inspect supplied codes with the CLI's `preset` commands. Use `shadcn apply` for an existing project and ask before applying changes that replace component source, fonts, or theme configuration. Use partial application only for parts supported by current command help.

## Completion contract

Report:

- project context and documentation source used;
- components, registry items, presets, commands, and files changed;
- project checks and interaction checks that passed;
- intentional user-approved replacements;
- blocked or unverified behavior and the next evidence needed.

Do not report working UI from CLI success, generated files, static JSX inspection, or compiler validation alone.

## Workflow stages

### Workflow stage: Acquire authoritative project context

Establish the project configuration and current component contract without relying on host-specific prompt interpolation.

1. Identify the project root from the user's scope, components.json, package.json, and lockfile.
2. Choose the project package runner, then run `shadcn info --json` from the project root when components.json exists.
3. If info fails, inspect components.json and installed component source directly; do not invent aliases, paths, icon libraries, installed components, or framework settings.
4. For a new project, use the current CLI defaults unless the user supplied a preset or other supported configuration.

Validation:

- Every path, import, package-manager, and component-API decision traces to inspected project context or current official docs.
- Missing context is represented as blocked or limited before any dependent mutation.

### Workflow stage: Plan and apply the smallest safe shadcn change

Reuse installed components and current registry/docs behavior while preserving user-owned source changes.

1. Inspect installed components before adding or importing them.
2. Use `shadcn search` and `shadcn docs` for current discovery and API guidance; fetch returned docs or inspect installed source before choosing props.
3. Use `add --dry-run`, `--diff`, or `--view` before updating installed files or accepting third-party registry content.
4. Ask only when a destructive overwrite, ambiguous third-party registry choice, or product/design decision requires user authority.
5. Apply the smallest change that satisfies the request and preserve unrelated local modifications.

Validation:

- The changed source uses project aliases, configured icons, current component APIs, and the requested registry or preset.
- No overwrite or broad preset application occurs without explicit authority.

### Workflow stage: Verify behavior and report evidence

Prove the strongest honest completion claim for the changed project.

1. Read every added or changed registry file and resolve incorrect imports, missing dependencies, and composition defects.
2. Run the narrowest relevant project checks such as typecheck, lint, tests, or build.
3. Exercise the changed interaction with an existing browser test or targeted smoke check when the task changes observable UI behavior.
4. Report the context used, commands and files changed, verification evidence, and any blocked or unverified behavior.

Validation:

- CLI success, generated files, or static examples alone never close an interactive or project-build claim.
- The final status does not exceed the evidence produced.

## Interop priority

- **Visual hierarchy, art direction, responsive composition, typography, and motion:** frontend-design. frontend-design owns presentation decisions; shadcn owns component discovery, installation, and library-specific composition.
- **Reusable React component runtime, effects, hydration, portals, and multi-instance correctness:** react-components-engineer. react-components-engineer owns runtime correctness; shadcn supplies component-specific API and source guidance.
- **Next.js App Router, RSC transport, directives, routing, caching, and framework configuration:** nextjs. nextjs owns framework semantics; shadcn owns the component and registry layer within that framework.
- **SPA routing, client data, forms, state, persistence, and application integration:** react-spa-engineer. react-spa-engineer owns application-flow integration; shadcn owns the component and registry layer used by that flow.
- **TypeScript language, compiler diagnostics, tsconfig, and module resolution:** typescript-engineer. typescript-engineer owns language and compiler correctness; shadcn owns its generated component contract.
- **Test runner behavior, fixtures, browser-test strategy, determinism, and CI integration:** typescript-test-engineer. typescript-test-engineer owns test design; shadcn defines the component behavior that needs evidence.
- **Formal UX and accessibility review:** web-ui-reviewer. web-ui-reviewer owns the verdict; shadcn provides domain-specific implementation facts and authorized remediation.
- **Formal code-review findings, severity, merge guidance, and review verdict:** code-reviewer. code-reviewer owns the formal verdict; shadcn supplies library-specific evidence and authorized remediation.

## Gotchas

- **high** — CLI flags and component props change; current project source, command help, and official docs outrank remembered examples.
- **high** — Do not claim project context is already injected; acquire it explicitly and represent failure before dependent changes.
- **high** — Registry installation is not completion evidence; inspect emitted source, aliases, dependencies, and composition before running project checks.
- **medium** — Semantic-token guidance depends on components.json; preserve the project's configured theming mode instead of forcing a different one.

## Policies

### Source precedence
Apply operator constraints first, then repository instructions, inspected project configuration and installed source, current CLI help and official docs, and finally static skill examples. Stop on unresolved equal-authority conflicts.

### Base UI default
Use the current Base UI default for new shadcn work and resolve exact component APIs from the target project and current documentation.

### Mutation safety
Preview updates and third-party registry content; require explicit approval before overwrite, broad preset application, or replacing customized component source.

### Evidence boundary
Compiler checks prove package structure, CLI output proves only that command, and project checks or interaction evidence prove only the exercised behavior.

## Required active references
- [CLI](references/cli.md) — Read this before init, add, update, registry search, docs lookup, or preset work.
- [Customization](references/customization.md) — Read this when changing themes, CSS variables, component variants, or wrappers.
- [Composition](references/rules/composition.md) — Read this when composing groups, overlays, cards, tabs, avatars, feedback, triggers, or link-styled buttons.
- [Forms](references/rules/forms.md) — Read this when building fields, input groups, independent toggles, choice sets, or validation states.
- [Icons](references/rules/icons.md) — Read this when adding icons or changing the configured icon library.
- [Styling](references/rules/styling.md) — Read this when changing variants, semantic colors, className usage, spacing, responsive layout, or dark mode.

## Bundled assets

- `assets/shadcn-small.png` — Bundled asset: assets/shadcn-small.png.
- `assets/shadcn.png` — Bundled asset: assets/shadcn.png.

## Portability rules

- Do not depend on host-specific prompt interpolation, machine-specific absolute paths, or files outside this skill folder.
- Keep mandatory shadcn guidance inside this skill folder and use relative links for local resources.
- Treat network-fetched docs as current authority with installed source and command help as the offline fallback.

## Portability checklist before finishing

- Regenerate and run the skill-source-compiler lint and check commands.
- Resolve every local Markdown link in the emitted package.
- Search the complete skill folder for forbidden terminology and absolute local dependencies.
- Compile to an isolated directory and confirm the copied skill remains understandable and usable.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
