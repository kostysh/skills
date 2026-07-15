---
name: shadcn
description: "Manage shadcn projects with a Base UI-first policy: add, search,
  fix, debug, style, and compose components using docs, registries, and presets.
  Use for shadcn/ui, Base UI, basecn, components.json, registry items, `shadcn
  init`, `--preset` app creation, or preset switching."
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f7523bfa193cd0f9c84fdc9bb33b927989592727840be53f79d58145a248c437
---

# shadcn

## Start here

1. Confirm the task matches shadcn's applicability criteria.
2. Treat Base UI as the invariant for all new shadcn UI work unless the user explicitly requests legacy Radix maintenance.
3. Use the preserved overview guidance as the normative workflow for this skill after the Base UI invariant is satisfied.
4. Load only the active references that match the current task.
5. Preserve existing project conventions only when they do not conflict with the Base UI invariant.

## When to use this skill

- Working with shadcn/ui components, Base UI, basecn, registries, presets, components.json, or shadcn CLI commands.
- Adding, composing, styling, fixing, debugging, or reviewing shadcn components in a project.
- Searching or viewing registry items, component docs, examples, presets, or templates.

## When NOT to use this skill

- The project does not use shadcn/ui, components.json, registry items, or shadcn presets.
- The task is broad visual art direction rather than shadcn component composition; use frontend-design.
- The task is React architecture or reusable component runtime correctness without shadcn-specific behavior.

## Overview

A framework for building UI, components, and design systems. Components are added as source code to the user's project via the CLI.

This skill is **Base UI-first**. All new shadcn UI work targets Base UI unless the user explicitly requests legacy Radix maintenance. This is a capability invariant, not a naming preference: verify project config, docs source, installed component source, and changed files.

> **IMPORTANT:** Run all CLI commands using the project's package runner: `npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest` — based on the project's `packageManager`. Examples below use `npx shadcn@latest` but substitute the correct runner for the project.

Before install, update, or init workflows, check the current official shadcn CLI docs or help output and use the latest CLI unless the operator explicitly requests another version. Prefer explicit `--base base` for initialization and explicit `--base base` for docs lookup.

## Current Project Context

```json
!`npx shadcn@latest info --json 2>/dev/null || echo '{"error": "No shadcn project found. Run shadcn init first."}'`
```

The JSON above contains the project config and installed components. Use `npx shadcn@latest docs <component> --base base --json` to get Base UI documentation and example URLs for any component.

If the project context reports `base: "radix"` or Radix-based shadcn component source, stop before adding new UI. Ask whether to migrate to Base UI or perform explicit legacy Radix maintenance.

## Principles

1. **Use existing components first.** Use `npx shadcn@latest search` to check registries before writing custom UI. Check community registries too.
2. **Use Base UI docs and project config.** Fetch docs with `--base base` unless confirmed Base project context already drives the command.
3. **Compose, don't reinvent.** Settings page = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table.
4. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
5. **Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct code pairs.

### Styling & Tailwind → [styling.md](references/rules/styling.md)

- **`className` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Forms & Inputs → [forms.md](references/rules/forms.md)

- **Forms use `FieldGroup` + `Field`.** Never use raw `div` with `space-y-*` or `grid gap-*` for form layout.
- **`InputGroup` uses `InputGroupInput`/`InputGroupTextarea`.** Never raw `Input`/`Textarea` inside `InputGroup`.
- **Buttons inside inputs use `InputGroup` + `InputGroupAddon`.**
- **Option sets (2–7 choices) use `ToggleGroup`.** Don't loop `Button` with manual active state.
- **`FieldSet` + `FieldLegend` for grouping related checkboxes/radios.** Don't use a `div` with a heading.
- **Field validation uses `data-invalid` + `aria-invalid`.** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

### Component Structure → [composition.md](references/rules/composition.md)

- **Items always inside their Group.** `SelectItem` → `SelectGroup`. `DropdownMenuItem` → `DropdownMenuGroup`. `CommandItem` → `CommandGroup`.
- **Use Base UI APIs for custom triggers.** In Base UI work, do not write `asChild`; fetch current Base docs and use `render` or the documented wrapper API. Radix `asChild` is allowed only for explicit legacy work. → [base-vs-radix.md](references/rules/base-vs-radix.md)
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`. Don't dump everything in `CardContent`.
- **Button has no `isPending`/`isLoading`.** Compose with `Spinner` + `data-icon` + `disabled`.
- **`TabsTrigger` must be inside `TabsList`.** Never render triggers directly in `Tabs`.
- **`Avatar` always needs `AvatarFallback`.** For when the image fails to load.

### Use Components, Not Custom Markup → [composition.md](references/rules/composition.md)

- **Use existing components before custom markup.** Check if a component exists before writing a styled `div`.
- **Callouts use `Alert`.** Don't build custom styled divs.
- **Empty states use `Empty`.** Don't build custom empty state markup.
- **Toast via `sonner`.** Use `toast()` from `sonner`.
- **Use `Separator`** instead of `<hr>` or `<div className="border-t">`.
- **Use `Skeleton`** for loading placeholders. No custom `animate-pulse` divs.
- **Use `Badge`** instead of custom styled spans.

### Icons → [icons.md](references/rules/icons.md)

- **Icons in `Button` use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"` on the icon.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS. No `size-4` or `w-4 h-4`.
- **Pass icons as objects, not string keys.** `icon={CheckIcon}`, not a string lookup.

### CLI

- **Base UI is the default invariant for this skill.** Use `--base base` on init and `docs --base base` for docs lookup unless explicit legacy Radix maintenance is requested.
- **Never decode or fetch preset codes manually.** Pass them directly to `npx shadcn@latest init --preset <code>`.

## Key Patterns

These are the most common patterns that differentiate correct shadcn/ui code. For edge cases, see the linked rule files above.

```tsx
// Form layout: FieldGroup + Field, not div + Label.
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// Validation: data-invalid on Field, aria-invalid on the control.
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>

// Icons in buttons: data-icon, no sizing classes.
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// Spacing: gap-*, not space-y-*.
<div className="flex flex-col gap-4">  // correct
<div className="space-y-4">           // wrong

// Equal dimensions: size-*, not w-* h-*.
<Avatar className="size-10">   // correct
<Avatar className="w-10 h-10"> // wrong

// Status colors: Badge variants or semantic tokens, not raw colors.
<Badge variant="secondary">+20.1%</Badge>    // correct
<span className="text-emerald-600">+20.1%</span> // wrong
```

## Component Selection

| Need                       | Use                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Button/action              | `Button` with appropriate variant                                                                   |
| Form inputs                | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| Toggle between 2–5 options | `ToggleGroup` + `ToggleGroupItem`                                                                   |
| Data display               | `Table`, `Card`, `Badge`, `Avatar`                                                                  |
| Navigation                 | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                     |
| Overlays                   | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation)       |
| Feedback                   | `sonner` (toast), `Alert`, `Progress`, `Skeleton`, `Spinner`                                        |
| Command palette            | `Command` inside `Dialog`                                                                           |
| Charts                     | `Chart` (wraps Recharts)                                                                            |
| Layout                     | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                          |
| Empty states               | `Empty`                                                                                             |
| Menus                      | `DropdownMenu`, `ContextMenu`, `Menubar`                                                            |
| Tooltips/info              | `Tooltip`, `HoverCard`, `Popover`                                                                   |

## Key Fields

The injected project context contains these key fields:

- **`aliases`** → use the actual alias prefix for imports (e.g. `@/`, `~/`), never hardcode.
- **`isRSC`** → when `true`, components using `useState`, `useEffect`, event handlers, or browser APIs need `"use client"` at the top of the file. Always reference this field when advising on the directive.
- **`tailwindVersion`** → `"v4"` uses `@theme inline` blocks; `"v3"` uses `tailwind.config.js` (see help/docs).
- **`tailwindCssFile`** → the global CSS file where custom CSS variables are defined. Always edit this file, never create a new one.
- **`style`** → component visual treatment (e.g. `nova`, `vega`).
- **`base`** → primitive library (`radix` or `base`). Must be `base` for new UI work; `radix` triggers the migration/legacy gate.
- **`iconLibrary`** → determines icon imports. Use `lucide-react` for `lucide`, `@tabler/icons-react` for `tabler`, etc. Never assume `lucide-react`.
- **`resolvedPaths`** → exact file-system destinations for components, utils, hooks, etc.
- **`framework`** → routing and file conventions (e.g. Next.js App Router vs Vite SPA).
- **`packageManager`** → use this for any non-shadcn dependency installs (e.g. `pnpm add date-fns` vs `npm install date-fns`).

See [cli.md — `info` command](references/cli.md) for the full field reference.

## Component Docs, Examples, and Usage

Run `npx shadcn@latest docs <component> --base base --json` to get the URLs for a component's Base UI documentation, examples, and API reference. Fetch these URLs to get the actual content.

```bash
npx shadcn@latest docs button dialog select --base base --json
```

**When creating, fixing, debugging, or using a component, always run `npx shadcn@latest docs` and fetch the URLs first.** This ensures you're working with the correct API and usage patterns rather than guessing.

## Workflow

1. **Get project context** — already injected above. Run `npx shadcn@latest info --json` again if you need to refresh.
2. **Enforce Base UI gate** — If there is no project and you are initializing, use `--base base`. If the project is Radix-based, stop before adding new UI and ask whether to migrate or do explicit legacy Radix maintenance. See [base-ui-policy.md](references/base-ui-policy.md).
3. **Check installed components first** — before running `add`, always check the `components` list from project context or list the `resolvedPaths.ui` directory. Don't import components that haven't been added, and don't re-add ones already installed.
4. **Find components** — `npx shadcn@latest search`.
5. **Get docs and examples** — run `npx shadcn@latest docs <component> --base base --json` to get URLs, then fetch them. Use `npx shadcn@latest view` to browse registry items you haven't installed. To preview changes to installed components, use `npx shadcn@latest add --diff`.
6. **Install or update** — `npx shadcn@latest add`. When updating existing components, use `--dry-run` and `--diff` to preview changes first (see [Updating Components](#updating-components) below).
7. **Fix imports in third-party components** — After adding components from community registries (e.g. `@basecn`, `@bundui`, `@magicui`), check the added non-UI files for hardcoded import paths like `@/components/ui/...`. These won't match the project's actual aliases. Use `npx shadcn@latest info --json` to get the correct `ui` alias (e.g. `@workspace/ui/components`) and rewrite the imports accordingly. The CLI rewrites imports for its own UI files, but third-party registry components may use default paths that don't match the project.
8. **Review added components** — After adding a component or block from any registry, **always read the added files and verify they are correct**. Check for missing sub-components (e.g. `SelectItem` without `SelectGroup`), missing imports, incorrect composition, Radix imports, `asChild`, or violations of the [Critical Rules](#critical-rules). Also replace any icon imports with the project's `iconLibrary` from the project context (e.g. if the registry item uses `lucide-react` but the project uses `hugeicons`, swap the imports and icon names accordingly). Fix all issues before moving on.
9. **Registry must be explicit** — When the user asks to add a block or component, **do not guess the registry**. If no registry is specified (e.g. user says "add a login block" without specifying `@shadcn`, `@basecn`, `@tailark`, etc.), ask which registry to use. Never default to a registry on behalf of the user.
10. **Switching presets** — Ask the user first: **reinstall**, **merge**, or **skip**?
   - **Reinstall**: `npx shadcn@latest init --preset <code> --force --reinstall`. Overwrites all components.
   - **Merge**: `npx shadcn@latest init --preset <code> --force --no-reinstall`, then run `npx shadcn@latest info` to list installed components, then for each installed component use `--dry-run` and `--diff` to [smart merge](#updating-components) it individually.
   - **Skip**: `npx shadcn@latest init --preset <code> --force --no-reinstall`. Only updates config and CSS, leaves components as-is.
   - **Important**: Always run preset commands inside the user's project directory. For new Base UI work, keep or set `--base base`. If a scratch/temp directory is needed for comparisons, pass `--base base` explicitly unless this is an approved legacy Radix task.

## Updating Components

When the user asks to update a component from upstream while keeping their local changes, use `--dry-run` and `--diff` to intelligently merge. **NEVER fetch raw files from GitHub manually — always use the CLI.**

1. Run `npx shadcn@latest add <component> --dry-run` to see all files that would be affected.
2. For each file, run `npx shadcn@latest add <component> --diff <file>` to see what changed upstream vs local.
3. Decide per file based on the diff:
   - No local changes → safe to overwrite.
   - Has local changes → read the local file, analyze the diff, and apply upstream updates while preserving local modifications.
   - User says "just update everything" → use `--overwrite`, but confirm first.
4. **Never use `--overwrite` without the user's explicit approval.**

## Quick Reference

```bash
# Init Base UI.
npx shadcn@latest init --name my-app --base base
npx shadcn@latest init --base base

# Add and inspect.
npx shadcn@latest add button card dialog
npx shadcn@latest add @basecn/combobox
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx

# Base docs.
npx shadcn@latest docs button dialog select --base base --json
```

**Base UI invariant:** use `--base base` for new projects and docs lookup. Radix presets or `base=radix` URLs are legacy-only.

## Workflow stages

### Workflow stage: Apply Base UI-first shadcn guidance

Apply shadcn guidance while keeping new UI work on Base UI and routing Radix projects through an explicit legacy or migration decision.

1. Match the request to the applicability criteria.
2. Check project context before init, add, update, migration, or component-authoring work; if the project is Radix-based, stop before adding new UI and ask for migration or explicit legacy Radix maintenance.
3. Follow the preserved overview sections for the concrete work.
4. Read the smallest relevant active reference before using detailed guidance from it.
5. Fetch Base UI component docs with `shadcn docs <component> --base base` unless a confirmed Base project context already drives the docs command.
6. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance, the Base UI policy, and any loaded reference constraints.
- New or changed shadcn UI files do not introduce Radix imports, `radix-ui` imports, `@radix-ui/react-slot`, or `asChild` unless the user explicitly requested legacy Radix work.

## Gotchas

- **high** — `basecn.dev` is an optional Base UI registry, not a replacement for confirming the project's shadcn `base` configuration.
- **high** — Do not satisfy a Base UI request by only changing prose or theme names; verify the project config, docs source, and touched component files.
- **medium** — Older examples may show Radix `asChild` or package imports; treat them as legacy unless current Base UI docs explicitly require them.

## Policies

### Base UI invariant
All new shadcn UI work targets Base UI. Radix is allowed only for explicit legacy maintenance or migration work requested by the user.

### Base UI verification
When changing shadcn UI files, verify project context and inspect changed files for Radix imports, `@radix-ui/react-slot`, `from "radix-ui"`, and `asChild`; report any intentional legacy exceptions.

## Required active references
- [Base UI Policy](references/base-ui-policy.md) — Read this before init, add, update, migration, registry, or component-authoring work where Base UI vs Radix can affect the result.
- [Cli](references/cli.md) — Read this when you need Commands, flags, presets, templates.
- [Customization](references/customization.md) — Read this when you need Theming, CSS variables, extending components.
- [Base UI API Checks](references/rules/base-vs-radix.md) — Read this when you need Base UI API checks, legacy Radix markers, custom triggers, link buttons, Select, ToggleGroup, Slider, or Accordion.
- [Composition](references/rules/composition.md) — Read this when you need Groups, overlays, Card, Tabs, Avatar, Alert, Empty, Toast, Separator, Skeleton, Badge, Button loading.
- [Forms](references/rules/forms.md) — Read this when you need FieldGroup, Field, InputGroup, ToggleGroup, FieldSet, validation states.
- [Icons](references/rules/icons.md) — Read this when you need data-icon, icon sizing, passing icons as objects.
- [Styling](references/rules/styling.md) — Read this when you need Semantic colors, variants, className, spacing, size, truncate, dark mode, cn(), z-index.

## Bundled assets

- `assets/shadcn-small.png` — Bundled asset: assets/shadcn-small.png.
- `assets/shadcn.png` — Bundled asset: assets/shadcn.png.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory shadcn guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
