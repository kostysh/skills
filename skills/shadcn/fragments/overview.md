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
