# Search and Ecosystem

## Search strategy

Pick search before polishing UI. It changes both architecture and operations.

### Use Algolia DocSearch when

- docs are public
- search quality matters more than zero-infra simplicity
- you want contextual search across versions and locales
- you may later want Ask AI

Typical config:

```ts
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_API_KEY',
    indexName: 'YOUR_INDEX_NAME',
    contextualSearch: true,
  },
},
```

Practical notes:

- Contextual search depends on crawler records and version/language facets. A configured UI is not an indexed service; test a real result, click-through and reload in each relevant version/locale.
- Ship search-only frontend credentials; keep indexing/admin credentials out of site bundles and reports.
- Use the official current Docusaurus crawler configuration instead of inventing your own baseline.
- If results are empty, suspect crawler or faceting configuration before suspecting Docusaurus.
- Style DocSearch through `custom.css` using Infima variables instead of hard-forking the UI first.

### Ask AI

Ask AI is an Algolia extension, not a replacement for correctly configured DocSearch.

```ts
themeConfig: {
  algolia: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_API_KEY',
    indexName: 'YOUR_INDEX_NAME',
    askAi: 'YOUR_ALGOLIA_ASK_AI_ASSISTANT_ID',
  },
},
```

Only add it when the product wants conversational search and has a configured Algolia assistant. The assistant-ID option is supported in the 3.9+ DocSearch 4 integration; verify the installed theme API before using it in older projects. Config alone does not prove answer quality or service access.

### Use Typesense when

- you need self-hosted or managed open-source search infrastructure
- you want hosted search without Algolia
- you are comfortable operating a crawler and a search cluster

Typical Docusaurus-side shape:

```ts
themes: ['docusaurus-theme-search-typesense'],
themeConfig: {
  typesense: {
    typesenseCollectionName: 'docs',
    typesenseServerConfig: {
      nodes: [{host: 'search.example.com', port: 443, protocol: 'https'}],
      apiKey: 'SEARCH_ONLY_KEY',
    },
    contextualSearch: true,
  },
},
```

### Use local search when

- docs are private or air-gapped
- the index is small enough to download into the browser
- you want static hosting with no external search service

An option is `@cmfcmf/docusaurus-search-local`; verify its published engine/peer constraints against the installed project before choosing a pinned version.

Typical config:

```ts
plugins: [
  [
    '@cmfcmf/docusaurus-search-local',
    {
      indexDocs: true,
      indexBlog: true,
      indexPages: false,
      language: 'en',
      maxSearchResults: 8,
    },
  ],
],
```

Practical notes:

- It supports versioned docs and i18n; search works in production build/serve, not the development server. Configure languages/indexed roots and test actual results across the required locale/version matrix.
- It is still a community plugin, so pin and verify compatibility on upgrade.
- For large multi-version multi-locale docs, hosted search usually scales better.

### Build your own search UI when

- you need unified product search beyond docs
- you already have an internal search backend
- Algolia or Typesense UI constraints are unacceptable

Start by swizzling `SearchBar` rather than forking half the theme.

## Community plugin rules

- Verify compatibility with your Docusaurus major and minor version before installation.
- Pin plugin versions explicitly.
- Assume community plugins can lag behind fresh Docusaurus releases.
- For authorized plugin changes, build and inspect the same output with `pnpm run serve`; avoid a second build when the quality gate already built it.

## API docs ecosystem

The OpenAPI integration uses a generator plugin and a companion theme:

- `docusaurus-plugin-openapi-docs`
- `docusaurus-theme-openapi-docs`

Use them when:

- you want OpenAPI specs rendered into the same docs IA as the rest of the site
- you need generated reference pages under a dedicated docs section
- you want versioned or multi-instance API reference docs

Mandatory rule:

- check the plugin compatibility matrix against the current Docusaurus release before adopting it

Implementation pattern:

- use a dedicated generated tree, optionally a docs plugin instance such as `/api`; configure the generator plugin and companion theme together and the docs instance `docItemComponent` as required by the installed plugin (`@theme/ApiItem` in the owner example)
- generate reference docs into that content tree
- keep hand-written guides separate from generated reference docs
- do not hand-edit generated endpoint pages; change the source spec or generator config instead
- decide whether generated output is committed or rebuilt in CI, then document that rule in `AGENTS.md`

This avoids polluting product guides with machine-generated endpoint pages.

## Dated compatibility evidence

Checked 2026-09-09; recheck owner matrices and published package metadata before adoption. These pairs do not require upgrading a compatible existing site:

- [Local search](https://github.com/cmfcmf/docusaurus-search-local): 2.0.1 declares Docusaurus ^3 and React/React DOM 18 or 19 peers.
- [Typesense](https://github.com/typesense/docusaurus-theme-search-typesense): 0.27.0 targets Docusaurus >=3.9 <4 and Node >=20. A functioning crawler/collection/server is a separate prerequisite; UI configuration does not create it.
- [OpenAPI](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs): 5.x targets Docusaurus 3.10+; 4.x serves the 3.5–3.9.2 branch. Keep plugin/theme versions compatible and verify generated page rendering.

For unavailable external services, complete authorized local config/build checks and name the missing service observation. Do not invent credentials, indexes or successful remote queries.
