# Customization and theming

Read this reference when changing theme tokens, variants, CSS, or wrapper components.

## Preserve project configuration

Inspect `components.json` and `shadcn info --json` before changing theme behavior. Respect:

- `tailwind.cssVariables` and the existing token format;
- the configured CSS file and Tailwind version;
- the selected style, icon library, aliases, and prefix;
- local component variants and wrapper contracts.

Do not switch theming mode or create a second global CSS file as a side effect of a component task.

## Preferred customization order

1. Use a built-in component variant or size.
2. Use documented `className` customization with semantic project tokens.
3. Change or add theme tokens in the configured global CSS file.
4. Add a local component variant when it is reused and belongs to that component.
5. Compose a wrapper when it represents a real product-level pattern.

Avoid a new abstraction when a documented variant or a small local class is sufficient.

## Theme tokens

When CSS variables are enabled, define light and dark values in the existing theme sections and expose new tokens through the project's current Tailwind pattern.

```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}

@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

```tsx
<div className="bg-warning text-warning-foreground">Warning</div>
```

The example reflects the current default Tailwind setup. For an older or customized project, follow its existing config and current official documentation instead of copying this block mechanically.

When CSS variables are disabled, preserve the project's generated utility-class pattern. Do not claim that semantic token rules apply unchanged.

## Component variants

Use `cva` in the existing component source when a reusable variant is required:

```tsx
const buttonVariants = cva("...", {
  variants: {
    variant: {
      warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    },
  },
})
```

Update exported types and all relevant usages. Run typecheck and inspect every visual state affected by the variant.

## Presets

Inspect current and incoming preset state with the CLI before applying changes. Use `shadcn apply` for existing projects and request approval when component source, fonts, or theme configuration will be replaced. See [CLI](cli.md#inspect-and-apply-presets).

## Verification

- Confirm only the configured CSS and intended component files changed.
- Run the project's typecheck, lint, tests, or build as applicable.
- Exercise light/dark and relevant interaction states when visual behavior changed.
- Report any state not checked; a valid CSS file alone is not visual evidence.
