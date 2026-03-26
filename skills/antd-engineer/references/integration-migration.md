# Integration & Migration Cases

Use this file when the user asks about **SSR**, **i18n**, **date libraries**, or **version upgrades**.

## Case 1: SSR with style consistency

**Context**: Next.js or SSR framework with hydration.
**Decision**: Follow AntD SSR guidance; ensure styles are injected consistently to avoid mismatch.
**Why**: CSS‑in‑JS must align between server and client.
**Docs**:
- `https://ant.design/docs/react/server-side-rendering`

## Case 2: Internationalization

**Context**: Multilingual app with date/number formats.
**Decision**: Configure AntD locale and integrate i18n provider for content strings.
**Why**: Prevents mixed locales in UI components.
**Docs**:
- `https://ant.design/docs/react/i18n`

## Case 3: Custom date library

**Context**: Replace Day.js or adapt to Moment/Luxon.
**Decision**: Use the official custom date library guide and keep all date pickers consistent.
**Why**: Mixed date libs cause parsing/formatting bugs.
**Docs**:
- `https://ant.design/docs/react/use-custom-date-library`

## Case 4: Migration to v6

**Context**: Upgrading a large app.
**Decision**: Follow migration guide, prioritize breaking changes in theming and tokens.
**Why**: Token and theme APIs are the most impactful changes.
**Docs**:
- `https://ant.design/docs/react/migration-v6`

## Case 5: Build tooling integration (Vite / Next / Umi)

**Context**: New project with a specific build tool.
**Decision**: Use the official integration guide for your tool.
**Why**: Ensures correct CSS‑in‑JS setup and avoids runtime style issues.
**Docs**:
- `https://ant.design/docs/react/use-with-vite`
- `https://ant.design/docs/react/use-with-next`
- `https://ant.design/docs/react/use-with-umi`

## Case 6: Locale + date formatting consistency

**Context**: Multi‑locale app with date pickers.
**Decision**: Align AntD locale with the chosen date library locale.
**Why**: Prevents mismatched month/day names and formatting.
**Docs**:
- `https://ant.design/docs/react/i18n`
- `https://ant.design/docs/react/use-custom-date-library`
