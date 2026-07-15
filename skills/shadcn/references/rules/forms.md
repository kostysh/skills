# Forms and inputs

Use current shadcn docs and installed source for exact props. Choose controls by user semantics, not by option count alone.

## Fields

Use `Field` for a labelled control and `FieldGroup` for related fields:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" />
  </Field>
</FieldGroup>
```

Use `FieldSet` and `FieldLegend` for a semantic group of related controls.

## Validation and disabled states

Put group state on `Field` and control state on the interactive element:

```tsx
<Field data-invalid>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" aria-invalid />
  <FieldError>Enter a valid email address.</FieldError>
</Field>
```

For disabled fields, pair `data-disabled` on `Field` with `disabled` on the control. Connect error messages and descriptions using the component's documented accessibility pattern.

## Input groups

Use the input-group-specific controls and buttons:

```tsx
<InputGroup>
  <InputGroupInput placeholder="Search..." />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Search">
      <SearchIcon />
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

- Use `InputGroupInput` or `InputGroupTextarea`, not a plain control inside `InputGroup`.
- Use `InputGroupButton` for actions inside an addon.
- Keep the addon after the control in DOM order when current docs require it; use `align` for visual placement.

## Choose controls by semantics

- Independent boolean setting: `Switch`.
- Boolean agreement inside a form: `Checkbox`.
- One choice from a visible set: `RadioGroup` or documented single `ToggleGroup`.
- Multiple independent selected items: checkboxes or documented multiple `ToggleGroup`, based on interaction semantics.
- Predefined compact choice: `Select`.
- Searchable choice: `Combobox`.

Current single-selection toggle groups use the documented single mode:

```tsx
<ToggleGroup type="single">
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
</ToggleGroup>
```

Fetch current docs before using controlled values or multi-selection because their types are version-sensitive.

## Verification

- Run typecheck and form tests where present.
- Test label activation, keyboard navigation, error announcement, disabled state, and submission behavior affected by the change.
- Do not accept correct JSX structure as proof that validation or submission works.
