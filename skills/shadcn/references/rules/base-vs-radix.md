# Base UI API Checks

Base UI is the default for this skill. Radix guidance in this file exists only to recognize legacy code and migration boundaries.

Before using this reference, read [../base-ui-policy.md](../base-ui-policy.md) when the task can add, update, or migrate components.

## Contents

- Base UI docs are the source of truth
- Radix legacy markers
- Custom triggers and polymorphic rendering
- Links styled as buttons
- Current Base UI component API checks
- Migration review checks

---

## Base UI Docs Are the Source of Truth

shadcn's Base UI wrappers can preserve familiar shadcn APIs while changing the underlying primitive implementation. Do not infer current wrapper APIs from old Radix examples or from raw Base UI primitive examples.

For every component you create, fix, or update:

```bash
npx shadcn@latest docs button dialog select --base base --json
```

Fetch the returned docs and examples before choosing props. If local project context already confirms `base: "base"`, the project may drive the docs command, but `--base base` is still the safest explicit choice.

---

## Radix Legacy Markers

Treat these as blockers for new Base UI work unless the user explicitly asked for legacy Radix maintenance:

- imports from `@radix-ui/*`
- imports from `radix-ui`
- imports from `@radix-ui/react-slot`
- `asChild` on shadcn UI components
- preset URLs or config values that explicitly select `base=radix`

Use `rg` on changed UI files after edits:

```bash
rg -n '@radix-ui/|from "radix-ui"|from '\''radix-ui'\''|@radix-ui/react-slot|asChild' <changed-ui-paths>
```

Expected result for new Base UI work: no matches in changed UI files.

---

## Custom Triggers and Polymorphic Rendering

Radix uses `asChild`. Base UI uses `render` at the primitive layer, and shadcn Base UI components may expose `render` where polymorphic replacement is supported.

**Incorrect for new Base UI work:**

```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

**Base UI pattern when docs show `render`:**

```tsx
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

Rules:

- Do not wrap triggers in extra elements to make composition work.
- Do not write `asChild` in Base UI work.
- Check current Base docs before assuming every trigger supports `render`.
- If an existing Radix project needs `asChild`, label the work as explicit legacy Radix maintenance.

---

## Links Styled as Buttons

For Base UI button links, prefer `buttonVariants` on a plain link/anchor. Do not render links through the Base UI `Button` component unless current docs explicitly require it.

**Incorrect for Base UI links:**

```tsx
<Button render={<a href="/docs" />} nativeButton={false}>
  Read the docs
</Button>
```

**Correct:**

```tsx
import { buttonVariants } from "@/components/ui/button"

<a className={buttonVariants({ variant: "outline" })} href="/docs">
  Read the docs
</a>
```

For framework links, apply `buttonVariants` through `className` on the link component when it accepts anchor attributes.

---

## Current Base UI Component API Checks

These checks reflect current shadcn Base UI docs. If the docs command returns different usage, follow the fetched docs and update this reference.

### Select

Base UI `Select` uses an `items` prop on the root in the shadcn wrapper. Keep items inside `SelectGroup`.

```tsx
const items = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
]

<Select items={items}>
  <SelectTrigger>
    <SelectValue placeholder="Theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

Do not use old guidance that says Base placeholders must be encoded only as `{ value: null }`; current shadcn Base docs show `SelectValue placeholder`.

### ToggleGroup

Current shadcn Base docs use the familiar shadcn wrapper API with `type="single"` for single selection.

```tsx
<ToggleGroup type="single">
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
</ToggleGroup>
```

Do not remove `type` just because raw Base UI primitives use a different lower-level API.

### Slider

Current shadcn Base docs use an array for `defaultValue` on single-thumb sliders.

```tsx
<Slider defaultValue={[33]} max={100} step={1} />
```

Do not convert single-thumb values to scalar numbers unless the fetched shadcn Base docs for the installed version require it.

### Accordion

Current shadcn Base docs use array `defaultValue`.

```tsx
<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It follows the documented accessibility pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

Use `multiple` for multi-open accordions when the fetched Base docs show it.

---

## Migration Review Checks

When moving code from Radix to Base UI:

1. Replace Radix dependencies through the shadcn CLI or documented migration path, not raw GitHub files.
2. Re-fetch Base docs for every touched component.
3. Remove `asChild` from changed Base UI code.
4. Replace link buttons with `buttonVariants` on real links.
5. Inspect changed files for Radix imports and `@radix-ui/react-slot`.
6. Re-run project checks or the narrowest available type/lint check.

If any Radix marker remains because the user requested legacy maintenance, report it explicitly.
