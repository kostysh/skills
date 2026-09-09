# Config, Presets, and Routing

## Site config priorities

Treat `docusaurus.config.*` as the contract for:

- site metadata: `title`, `tagline`, `favicon`
- deployment: `url`, `baseUrl`, `organizationName`, `projectName`
- content architecture: `presets`, `plugins`, `themes`
- custom metadata via `customFields`

Use TypeScript config when possible:

```ts
import type {Config} from '@docusaurus/types';

const config: Config = {
  title: 'Acme Docs',
  url: 'https://docs.acme.dev',
  baseUrl: '/',
};

export default config;
```

## Preset vs plugin composition

- Use `preset-classic` for the common case.
- Use manual `plugins` and `themes` only when:
  - you need multiple docs plugin instances
  - you need a custom local plugin
  - you intentionally do not want the classic bundle

Preset configuration example:

```ts
presets: [
  [
    'classic',
    {
      docs: {
        sidebarPath: './sidebars.ts',
      },
      blog: false,
      theme: {
        customCss: './src/css/custom.css',
      },
    },
  ],
];
```

Manual plugin configuration example:

```ts
plugins: [
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'api',
      path: 'api',
      routeBasePath: 'api',
      sidebarPath: './sidebarsApi.ts',
    },
  ],
];
```

## Routing rules

Practical defaults:

- `/docs/*` for standard docs sites
- `/` for docs-only sites
- `/blog/*` for changelog/editorial content
- `/api/*` or `/reference/*` for generated reference material

Do route planning before writing content:

- `routeBasePath` changes the whole section's URL base
- `slug` changes an individual doc URL
- `src/pages/foo.tsx` becomes `/foo`
- `static/` assets are copied to the build root and referenced from the site base URL

## Route-collision traps

- `routeBasePath: '/'` plus `src/pages/index.*`
- a doc `slug` that overlaps an existing page
- multiple docs plugin instances pointing at the same `routeBasePath`
- navbar links hardcoded to paths that move during refactors

## Navbar strategy

Prefer navbar items that survive docs refactors:

- `type: 'doc'` when you know the stable `docId`
- `type: 'docSidebar'` when the first item of a sidebar may change
- `type: 'docsVersionDropdown'` for versioned docs
- `type: 'localeDropdown'` for multi-locale sites

Example:

```ts
themeConfig: {
  navbar: {
    title: 'Acme',
    items: [
      {
        type: 'docSidebar',
        sidebarId: 'guides',
        position: 'left',
        label: 'Guides',
      },
      {
        type: 'docsVersionDropdown',
        position: 'right',
      },
      {
        href: 'https://github.com/acme/docs',
        position: 'right',
        'aria-label': 'GitHub repository',
      },
    ],
  },
},
```

## Multi-instance docs

Use multiple docs plugin instances only when one site truly owns multiple doc families with different navigation or release cycles.

Example:

```ts
presets: [
  [
    'classic',
    {
      docs: {
        path: 'product',
        routeBasePath: 'product',
        sidebarPath: './sidebarsProduct.ts',
      },
    },
  ],
],
plugins: [
  [
    '@docusaurus/plugin-content-docs',
    {
      id: 'community',
      path: 'community',
      routeBasePath: 'community',
      sidebarPath: './sidebarsCommunity.ts',
    },
  ],
],
```

Rules:

- Every non-default docs plugin instance needs a unique `id`.
- Large, independently operated doc sets are often better as separate Docusaurus sites.
- Docs-related navbar items can target a specific instance with `docsPluginId`.
