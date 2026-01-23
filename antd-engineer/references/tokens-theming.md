# Tokens & Theming Cases

Use this file when the user asks about **theme configuration**, **token usage**, or **dark/compact modes**.

## Case 1: Branding a product without per‑component overrides

**Context**: Single brand, consistent look across the app.
**Decision**: Override seed tokens only (e.g., `colorPrimary`, `borderRadius`, `fontSize`).
**Why**: Seed tokens propagate consistently with minimal maintenance.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 2: A few components need a unique look

**Context**: Table header and Card border need custom colors.
**Decision**: Use component tokens for the specific components, keep global tokens intact.
**Why**: Avoids unintended global changes.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 3: Dark mode support

**Context**: Toggle between light/dark themes.
**Decision**: Use the dark algorithm plus token adjustments for contrast.
**Why**: Algorithm sets a consistent base; manual tokens fix edge cases.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 4: Dense admin interface

**Context**: High information density, many tables.
**Decision**: Use the compact algorithm; avoid manual spacing overrides.
**Why**: Keeps spacing systematic and consistent.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 5: Multi‑brand (white‑label) product

**Context**: Multiple tenants with distinct branding.
**Decision**: Create a theme preset per brand (seed + alias tokens), switch via `ConfigProvider`.
**Why**: Centralizes branding and avoids scattered overrides.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 6: Component‑specific visual tweaks

**Context**: Only one component needs customization (e.g., Button border radius).
**Decision**: Use component tokens for that component instead of global tokens or CSS.
**Why**: Limits blast radius to the target component.
**Docs**:
- `https://ant.design/docs/react/customize-theme`

## Case 7: Theme tokens in custom styles

**Context**: Custom layout needs to match AntD theme.
**Decision**: Use `useToken` to read tokens and apply them in custom styles.
**Why**: Keeps custom UI consistent with AntD theme changes.
**Docs**:
- `https://ant.design/docs/react/customize-theme`
