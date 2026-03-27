# Customization and UX

## Theme config that matters most

These `themeConfig` areas usually provide the highest leverage:

- `colorMode`
- `image` and `metadata`
- `announcementBar`
- `docs.sidebar`
- `navbar`
- `footer`
- `prism`

Useful examples:

```ts
themeConfig: {
  colorMode: {
    defaultMode: 'light',
    disableSwitch: false,
    respectPrefersColorScheme: false,
  },
  announcementBar: {
    id: 'beta',
    content: 'API v2 is now available.',
    isCloseable: true,
  },
  docs: {
    sidebar: {
      hideable: true,
      autoCollapseCategories: true,
    },
  },
},
```

## CSS strategy

Use this escalation order:

1. `themeConfig`
2. CSS variables and stable theme class selectors
3. page-local CSS modules
4. wrapped theme components
5. ejected theme components

Good defaults:

- global brand tokens in `src/css/custom.css`
- CSS modules beside custom React pages and components
- minimal selector depth
- do not target fragile implementation details if a theme variable or wrapper can solve it

Example:

```css
:root {
  --ifm-color-primary: #0b57d0;
  --ifm-color-primary-dark: #0847aa;
  --ifm-code-font-size: 0.92rem;
}

[data-theme='dark'] {
  --ifm-color-primary: #7fb2ff;
}
```

## Pages and custom UI

Use `src/pages/` for:

- homepages
- product overview pages
- pricing or support pages
- custom landing flows that should not live in docs

Keep docs content in `docs/`. If a page needs doc navigation, it probably belongs in `docs/`, not `src/pages/`.

## Swizzling

Swizzling is for React-level customization of theme components.

Commands:

```bash
pnpm exec docusaurus swizzle --list
pnpm exec docusaurus swizzle @docusaurus/theme-classic Navbar
pnpm exec docusaurus swizzle @docusaurus/theme-search-algolia SearchBar
pnpm exec docusaurus swizzle @docusaurus/theme-classic DocItem --eject
```

Rules:

- wrap before ejecting
- eject only when CSS, props, and composition are not enough
- restart the dev server after swizzling
- remove stale files from `src/theme/` when undoing swizzles

Wrapping pattern:

```tsx
import React from 'react';
import OriginalNavbar from '@theme-original/Navbar';

export default function NavbarWrapper(props) {
  return <OriginalNavbar {...props} />;
}
```

## UX heuristics for docs sites

- Search should be obvious and near-immediate to use.
- The navbar should answer only top-level routing questions.
- Sidebars should be information architecture, not a dump of every page in the repo.
- Avoid giant hero sections on docs-first sites.
- Keep the first screen readable on laptops without scrolling through branding chrome.
- Use diagrams, callouts, and tabs to reduce ambiguity, not to decorate.
- Verify keyboard navigation, focus states, and contrast after custom theme work.
- Test mobile sidebar depth and code block overflow early; these are common regressions.
