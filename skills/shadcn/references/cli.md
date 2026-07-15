# shadcn CLI

Read this reference before initialization, registry operations, component updates, docs lookup, or preset work.

## Runner and live contract

Use the runner selected from the target project's lockfile and `packageManager`:

```bash
pnpm dlx shadcn@latest <command>
npx shadcn@latest <command>
bunx --bun shadcn@latest <command>
```

Examples below use `npx`. Substitute the project runner. Before a version-sensitive workflow, run the command's `--help`; current help and official docs outrank this summary. Do not invent flags.

If the project pins a shadcn CLI version, use that version unless the operator explicitly asks to upgrade. Otherwise use the current release.

## Acquire project context

Run from the project root:

```bash
npx shadcn@latest info --json
```

Use the result to determine framework, Tailwind version, package manager, aliases, resolved paths, style, icon library, registries, and installed components. If it fails, inspect `components.json`, `package.json`, the lockfile, and installed component source. Do not treat missing output as an empty project configuration.

## Initialize

Use `init` for an existing application or `init --name`/`create` for a new one. Base UI is the current default.

```bash
npx shadcn@latest init
npx shadcn@latest init --name my-app --template vite
npx shadcn@latest init --name my-app --preset nova
```

Preview the current help before combining templates, presets, monorepo options, or non-interactive flags. Initialization writes configuration, CSS, dependencies, and utility files; run it in the intended target directory.

## Search, inspect, and add

```bash
npx shadcn@latest search
npx shadcn@latest search @shadcn --query dialog
npx shadcn@latest view @shadcn/dialog
npx shadcn@latest add dialog --dry-run
npx shadcn@latest add dialog --diff
npx shadcn@latest add dialog --view
npx shadcn@latest add dialog
```

Rules:

- Use unqualified names for ordinary official components; do not ask a registry question when the requested item is unambiguous.
- Ask for a registry choice when multiple third-party items or sources plausibly match the request.
- Prefer `add --dry-run`, `--diff`, or `--view` over raw registry or repository downloads when evaluating project-specific effects.
- Inspect all emitted files from third-party registries for hardcoded aliases, unexpected dependencies, and incompatible composition.
- Never use `--overwrite` without explicit approval after showing the relevant diff.

## Component docs

Resolve current component documentation and examples through the CLI:

```bash
npx shadcn@latest docs button dialog select --json
```

Fetch the returned official URLs. If network access is unavailable, inspect installed component source and types, then state the evidence limitation. Do not guess an API from memory when the task depends on exact props.

## Update installed components

1. Run `add <component> --dry-run` to identify affected files.
2. Run `add <component> --diff [path]` for each locally changed file.
3. Preserve local variants, behavior, and styling while applying the required upstream delta.
4. Use `--overwrite` only when the user explicitly authorizes replacing the shown files.
5. Read changed source and run project checks after the merge.

## Inspect and apply presets

Use the current preset commands instead of manually decoding codes or constructing URLs:

```bash
npx shadcn@latest preset resolve --json
npx shadcn@latest preset decode <code>
npx shadcn@latest preset url <code>
npx shadcn@latest apply <code>
npx shadcn@latest apply <code> --only theme,font
```

Before applying a preset to an existing project:

1. inspect current preset state;
2. inspect the incoming preset;
3. show the affected scope;
4. ask for approval when components, fonts, or theme configuration will be replaced;
5. use only partial parts supported by current `apply --help`;
6. inspect changed files and run project checks.

Do not route an existing-project preset change through a forced initialization when `apply` owns the requested operation.

## Stop and fallback rules

- Stop before path- or import-dependent changes when project context remains unavailable.
- Stop before overwrite or broad preset application when approval is missing.
- If current help and official docs conflict, prefer the installed project contract and report the discrepancy.
- CLI exit success proves only command completion; it does not prove component correctness, build success, accessibility, or interaction behavior.
