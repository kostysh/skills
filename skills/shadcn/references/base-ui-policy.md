# Base UI Policy

All new shadcn UI work targets Base UI. Radix is a legacy or migration concern, not an equal default.

## Capability Target

The skill should produce observable Base UI behavior:

- new projects are initialized with `--base base`
- component docs and examples come from Base UI docs
- installed shadcn components are selected from a Base UI project configuration
- changed UI files do not introduce Radix imports, `@radix-ui/react-slot`, `from "radix-ui"`, or `asChild`

Anti-claim: this policy does not migrate existing applications by itself. It tells the agent when to continue, when to stop, and what to verify.

## Context Gate

Before init, add, update, migration, registry, or component-authoring work:

1. Run or inspect `shadcn info --json` when a project exists.
2. If there is no shadcn project and the task is to initialize one, include `--base base`.
3. If there is no project context and the task is to write example code, assume Base UI and fetch docs with `--base base`.
4. If project context says `base: "base"` or the resolved docs are under `/docs/components/base/`, continue.
5. If project context says `base: "radix"` or the codebase uses Radix shadcn components, stop before adding new UI and ask whether to migrate to Base UI or perform explicit legacy Radix maintenance.

Do not silently preserve Radix conventions just because they already exist. Preserving conventions happens only after the Base UI invariant is satisfied or the user explicitly chooses legacy Radix maintenance.

## Base UI Docs

Use Base UI docs for every component you create, fix, or update:

```bash
npx shadcn@latest docs button dialog select --base base --json
```

Fetch the returned docs and example URLs before relying on component APIs. Use project package runner (`pnpm dlx`, `npx`, `bunx --bun`) as described in [cli.md](cli.md).

## Installation Policy

For official shadcn components:

- use the shadcn CLI from a confirmed Base UI project
- initialize new projects with `--base base`
- prefer explicit `--base base` even when a preset or default appears to imply Base UI
- do not use Radix preset URLs such as `base=radix`

For basecn components:

- treat `basecn.dev` as an optional Base UI registry for extra components and examples
- configure the namespace only when you need `@basecn/...` items:

```json
{
  "registries": {
    "@basecn": "https://basecn.dev/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @basecn/combobox
```

Do not replace official shadcn component installation with `@basecn/...` unless the user requested a basecn component or the official registry lacks the needed Base UI component.

## Migration Gate

If a project is Radix-based and the user asks for new UI:

1. State that the project is Radix-based and new UI should not be added until the Base UI direction is chosen.
2. Offer two paths: migrate/reinitialize to Base UI, or perform explicit legacy Radix maintenance.
3. If the user chooses migration, preview changes with `--dry-run` and `--diff` where supported, then update components through the CLI rather than fetching raw files.
4. If the user chooses legacy Radix maintenance, keep the change scoped and label Radix-only code as intentional in the final report.

Do not use `--overwrite` without explicit user approval.

## Verification Gate

After changing shadcn config or UI files:

```bash
npx shadcn@latest info --json
rg -n '@radix-ui/|from "radix-ui"|from '\''radix-ui'\''|@radix-ui/react-slot|asChild' <changed-ui-paths>
```

Expected result for new Base UI work:

- `info` confirms Base UI project context when available
- the search has no matches in changed UI files
- any remaining matches are pre-existing or explicitly requested legacy Radix maintenance
- installed component files import Base UI through current package names, such as `@base-ui/react`, not the old `@base-ui-components/react`

Some shadcn components are primitive-independent, such as data tables built on TanStack Table. They may have no Base UI imports; the important check is that they do not introduce Radix primitives.
