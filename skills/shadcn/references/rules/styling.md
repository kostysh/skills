# Styling

Preserve the project's shadcn style and theming mode. Prefer built-in variants and semantic project tokens, but do not turn preferences into blanket prohibitions that reject documented customization.

## Variants and className

Use the smallest sufficient option:

1. existing variant or size;
2. documented `className` for layout or a bounded visual adjustment;
3. semantic theme token;
4. reusable component variant;
5. product-level wrapper.

```tsx
<Button variant="outline" size="sm">Open</Button>
<Card className="mx-auto max-w-md">...</Card>
<Button className="rounded-full">Continue</Button>
```

Do not duplicate a built-in variant with raw classes. Use `cn()` when conditional or caller-provided classes must be merged.

## Color and dark mode

When `tailwind.cssVariables` is enabled, prefer semantic tokens such as `bg-background`, `text-muted-foreground`, and `text-destructive`. Add a project token when a reusable product color is missing.

When CSS variables are disabled, follow the project's generated utility and dark-mode pattern. Do not force semantic tokens that the project configuration does not provide.

Raw palette colors are acceptable only when they are an intentional, bounded design choice supported by the project's design direction; they are not a substitute for reusable status tokens.

## Layout utilities

- Prefer `gap-*` for flex and grid layouts where it expresses the relationship clearly.
- Prefer `size-*` when equal width and height are intentional and supported by the project's Tailwind version.
- Prefer `truncate` when its complete behavior is desired.
- Add overlay stacking changes only for an observed stacking failure and verify the affected nested-overlay case.

These are maintainability defaults, not reasons to rewrite correct unrelated code.

## Verification

- Check the configured Tailwind version, CSS file, prefix, and theming mode.
- Run the relevant lint, typecheck, and build checks.
- Exercise responsive, light/dark, focus, disabled, and overlay states affected by the change.
- Route broad visual direction to `frontend-design` and formal UX/accessibility review to `web-ui-reviewer`.
