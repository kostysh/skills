# Anti‑patterns & Pitfalls

Use this file when the request risks **misusing patterns** or **overriding AntD conventions**.

## Layout & navigation

- **Using Tabs as primary app navigation** → Tabs are for in‑page views. Use Menu + Layout for global navigation.
  Docs: `https://ant.design/docs/spec/navigation`
- **Mixed layout paradigms** (custom grids + Layout + absolute positioning) → pick one layout system to avoid alignment drift.
  Docs: `https://ant.design/docs/spec/layout`

## Data entry

- **Placeholder‑only labels** → accessibility and clarity issues. Use visible labels in `Form.Item`.
  Docs: `https://ant.design/docs/spec/data-entry`
- **Uncontrolled inputs inside Form** → validation and state drift. Prefer Form‑controlled fields.
  Docs: `https://ant.design/components/form`
- **Overusing modal forms** for simple edits → use inline or Drawer when context is needed.
  Docs: `https://ant.design/docs/spec/feedback`

## Data display & feedback

- **Using Table for simple lists** → heavy layout and features not needed. Use List or Card.
  Docs: `https://ant.design/docs/spec/data-display`
- **Modal for every confirmation** → use Popconfirm for quick destructive actions.
  Docs: `https://ant.design/components/popconfirm`
- **Too many Notifications/Message** → creates noise; prefer inline Alert for persistent guidance.
  Docs: `https://ant.design/docs/spec/feedback`

## Tokens & theming

- **Deep CSS overrides or `!important`** → brittle and hard to maintain. Prefer tokens and component tokens.
  Docs: `https://ant.design/docs/react/customize-theme`
- **Mixing custom colors without contrast checks** → breaks accessibility.
  Docs: `https://ant.design/docs/spec/contrast`

## Integration

- **Ignoring SSR style order** → hydration mismatch. Follow SSR guidance.
  Docs: `https://ant.design/docs/react/server-side-rendering`
- **Mixing date libraries** → parsing/format bugs. Use one official date library integration.
  Docs: `https://ant.design/docs/react/use-custom-date-library`

