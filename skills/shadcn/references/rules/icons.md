# Icons

Inspect `iconLibrary` in project context and use that package. Do not assume one library or rewrite the configured library as incidental cleanup.

## Icons inside components

Use the component's documented spacing attributes. Buttons currently use `data-icon`:

```tsx
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

<Button>
  Next
  <ArrowRightIcon data-icon="inline-end" />
</Button>
```

Let the component control icon size unless the docs or the user's design explicitly require a custom size. Remove redundant margin and sizing utilities that fight the component's selectors.

## Component-valued icon props

When a reusable component accepts an icon, pass a component value rather than a string lookup unless serialization is a real requirement:

```tsx
function StatusBadge({ icon: Icon }: { icon: React.ComponentType }) {
  return <Icon aria-hidden="true" />
}

<StatusBadge icon={CheckIcon} />
```

Provide an accessible name on the owning control; decorative icons should not duplicate it.

## Verification

- Confirm imports match the configured icon library.
- Run typecheck after changing icon components or names.
- Inspect alignment, accessible naming, and loading/disabled states in the affected UI.
