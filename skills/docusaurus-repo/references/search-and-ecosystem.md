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

- Contextual search is the default good choice.
- Use the official Docusaurus v3 crawler configuration instead of inventing your own baseline.
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

Only add it when the product actually wants conversational search behavior.

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

One strong Docusaurus v3 option is `@cmfcmf/docusaurus-search-local`.

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

- It supports versioned docs and i18n.
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
- Re-run `pnpm build` and `pnpm run serve -- --build` after every plugin addition or upgrade.

## API docs ecosystem

Two common Docusaurus-native options:

- `docusaurus-plugin-openapi-docs`
- `docusaurus-theme-openapi-docs`

Use them when:

- you want OpenAPI specs rendered into the same docs IA as the rest of the site
- you need generated reference pages under a dedicated docs section
- you want versioned or multi-instance API reference docs

Mandatory rule:

- check the plugin compatibility matrix against the current Docusaurus release before adopting it

Implementation pattern:

- create a dedicated docs plugin instance such as `/api`
- generate reference docs into that content tree
- keep hand-written guides separate from generated reference docs
- do not hand-edit generated endpoint pages; change the source spec or generator config instead
- decide whether generated output is committed or rebuilt in CI, then document that rule in `AGENTS.md`

This avoids polluting product guides with machine-generated endpoint pages.
