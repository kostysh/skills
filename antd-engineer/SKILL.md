---
name: antd-engineer
description: Ant Design foundation and system-level guidance (principles, layout/navigation/data patterns, theming/tokens, accessibility, integration, migration). Use for framework understanding and constraints beyond individual components.
---

# Ant Design Engineer

Use this skill when the user needs **framework-level understanding** of Ant Design: design principles, layout/navigation patterns, data entry/display guidance, theming/tokens, accessibility considerations, integration details, or migration constraints. This skill complements (but does not replace) the component reference skill.

**When to switch to the component skill**: If the user needs concrete API/props, component selection, or code snippets, use the `antd-components` skill. Keep this skill for system‑level decisions and constraints.

## Scope

**Covers**
- Design system principles and layout/navigation/data patterns
- Theme and token strategy, global configuration, and customization
- Integration and platform constraints (SSR, i18n, date libraries, build tooling)
- Migration guidance and framework limitations

**Does NOT cover**
- Per-component API/props/usage (use the components skill for that)
- Non-Ant Design frameworks

## Primary sources (official docs)

Prefer the official AntD docs before broader web search:

### Design principles and patterns (specs)
- Introduction, overview, values: `https://ant.design/docs/spec/introduce`, `https://ant.design/docs/spec/overview`, `https://ant.design/docs/spec/values`
- Layout: `https://ant.design/docs/spec/layout`
- Navigation: `https://ant.design/docs/spec/navigation`
- Data entry: `https://ant.design/docs/spec/data-entry`
- Data display: `https://ant.design/docs/spec/data-display`
- Feedback: `https://ant.design/docs/spec/feedback`
- Typography and color: `https://ant.design/docs/spec/font`, `https://ant.design/docs/spec/colors`
- Motion and interaction: `https://ant.design/docs/spec/motion`, `https://ant.design/docs/spec/transition`
- Accessibility-relevant visual rules: `https://ant.design/docs/spec/contrast`
- Supporting layout rules: `https://ant.design/docs/spec/alignment`, `https://ant.design/docs/spec/proximity`, `https://ant.design/docs/spec/repetition`

### Implementation and integration guidance
- Getting started: `https://ant.design/docs/react/getting-started`
- Recommended usage: `https://ant.design/docs/react/recommendation`
- Common props: `https://ant.design/docs/react/common-props`
- Theme customization: `https://ant.design/docs/react/customize-theme`
- Internationalization: `https://ant.design/docs/react/i18n`
- SSR: `https://ant.design/docs/react/server-side-rendering`
- Custom date library: `https://ant.design/docs/react/use-custom-date-library`
- Migration: `https://ant.design/docs/react/migration-v6`
- FAQ/limits: `https://ant.design/docs/react/faq`

Use broader web search only if the official docs above are missing a required detail or appear outdated for the user’s target version.

## Workflow

1. **Clarify context**: target AntD version, product type (B2B/B2C), platform (web/SSR), and theming needs.
2. **Classify the need**: design principles, layout/navigation pattern, data entry/display rules, theming/tokens, or integration constraints.
3. **Load the minimal docs** from the lists above (avoid loading everything).
4. **Extract rules**: key constraints, recommended patterns, anti-patterns, and defaults.
5. **Translate into guidance**: concise, actionable recommendations with clear rationale.
6. **Bridge to components** only at a high level (e.g., “use Tabs for secondary navigation”), then defer API details to the component skill.

## References (when to load examples)

Use these references **only when you need concrete cases/examples**. Keep SKILL.md lean; pull the smallest relevant file.

- **Foundation & system framing**: `references/foundation-introduce.md`
  - Use when the user needs AntD philosophy, scope, or system framing before any implementation guidance.
- **Layout & navigation patterns**: `references/layout-navigation.md`
  - Use when the request is about page structure, sidebars, menus, tabs, or hierarchy.
- **Data entry patterns**: `references/data-entry.md`
  - Use when selecting input controls, validation strategy, or multi-step forms.
- **Data display & feedback patterns**: `references/data-display-feedback.md`
  - Use when choosing tables/lists, empty states, alerts, or result messaging.
- **Tokens & theming**: `references/tokens-theming.md`
  - Use when deciding between seed/map/alias/component tokens or theme algorithms.
- **Integration & migration**: `references/integration-migration.md`
  - Use when SSR, i18n, date libraries, or migration constraints are involved.
- **Anti‑patterns & pitfalls**: `references/anti-patterns.md`
  - Use when the user risks misusing AntD patterns, overriding styles incorrectly, or mixing paradigms.

## Token and theming guidance (how and when)

Use this section to answer “when and how to use tokens” questions quickly.

### When to use which theming mechanism
- **Seed tokens**: when you want to set a global visual direction (primary color, base radius, font size).
- **Map tokens**: when you need to harmonize derived values across the system (spacing scale, border colors).
- **Alias tokens**: when you need semantic intent (e.g., `colorError`, `colorTextSecondary`).
- **Component tokens**: when a single component needs a localized override (e.g., Table header background).

### When to use ConfigProvider vs CSS
- **ConfigProvider theme**: preferred for consistent, app-wide changes and component-level overrides.
- **CSS/inline styles**: only for isolated, one-off adjustments where tokens don’t exist.
- **Avoid** overriding deep internal selectors; prefer tokens and component tokens.

### When to use algorithms
- **Default algorithm**: standard theme.
- **Dark algorithm**: for dark mode; pair with token adjustments to maintain contrast.
- **Compact algorithm**: for dense layouts (e.g., data-heavy admin).

Reference: `https://ant.design/docs/react/customize-theme`

## Quick decision checklists

### Layout and navigation
- Use **Layout** for page chrome; prefer **Menu + Sider** for primary navigation.
- Use **Tabs** for in-page views, **Breadcrumb** for hierarchy, **Steps** for multi-step flows.
- Validate against navigation and layout specs: `https://ant.design/docs/spec/layout`, `https://ant.design/docs/spec/navigation`

### Data entry
- Prefer **Form** as the container; ensure field validation and clear affordances.
- Use `data-entry` spec to keep labels/controls consistent: `https://ant.design/docs/spec/data-entry`

### Data display and feedback
- Use **Table/List** for structured data; **Empty/Result** for edge states.
- Use **Alert/Message/Notification/Modal** for feedback, scoped by severity.
- Validate against `data-display` and `feedback` specs when relevant:
  - `https://ant.design/docs/spec/data-display`
  - `https://ant.design/docs/spec/feedback`

## Anti‑patterns and constraints

- Don’t mix multiple layout paradigms in a single view (e.g., mixed grids and custom positioning).
- Avoid deep CSS overrides; prefer tokens and ConfigProvider.
- Ensure contrast requirements when using custom colors.
- For SSR, confirm hydration stability and style ordering (see SSR doc).

## Questions to ask when unclear

- What AntD major version are you targeting?
- Do you need light/dark themes or brand variants?
- Is this page data-heavy or marketing/consumer oriented?
- Are you targeting SSR or client-only rendering?

## Output expectations

Provide:
- A short summary of **principles and constraints**
- A practical **decision checklist** (what to pick and why)
- Any **framework limitations** (SSR, i18n, theme boundaries)
- Pointers to the exact doc pages used

Keep the response tight; only expand where the user asks for detail.
