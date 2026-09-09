# Deployment, Versioning, and i18n

## Deployment essentials

Set these correctly before touching host-specific settings:

- `url`: canonical site origin without a trailing slash
- `baseUrl`: path prefix under that origin
- `organizationName` and `projectName` when using GitHub Pages deploy helpers

Example:

```ts
const config = {
  url: 'https://docs.acme.dev',
  baseUrl: '/',
};
```

For authorized deployment preparation, build and preview the same output:

```bash
pnpm build
pnpm run serve --port 3000
```

Use the built preview to catch issues hidden by dev mode and exercise nested direct URLs, reloads and asset paths under `baseUrl`. Local preview does not prove CDN redirects or canonical hosting. After authorized publication, read back the intended canonical URL and relevant routes; without remote access, report deployment as unverified.

## `trailingSlash`

Treat `trailingSlash` as a deployment behavior choice, not as cosmetic formatting.

- Pick it deliberately when the host, CDN, or legacy URL scheme cares about slash style.
- Re-test the built preview after changing it because nested routes, canonical URLs, and static asset paths can shift.
- When you see unexplained 404s or duplicate URL variants after a routing change, verify `baseUrl` and `trailingSlash` together.

## Clear stale build state

When routes, plugin composition, or locale structure change and the output looks stale or inconsistent, clear generated artifacts before deeper debugging:

```bash
pnpm exec docusaurus clear
pnpm build
pnpm run serve
```

## Host notes

- Netlify and Vercel are usually the easiest for previews and static hosting.
- In monorepos, set the host's base directory to the Docusaurus root such as `website/`.
- Self-hosting via `docusaurus serve` works, but a static host/CDN is usually better.

## Versioning

Docusaurus versioning is useful, but expensive in maintenance.

Use versioning when:

- multiple product versions are live at the same time
- docs differ materially between releases
- users genuinely need old docs

Avoid versioning when:

- docs change slowly
- one live version is enough
- contributor simplicity matters more than archival depth

CLI examples:

```bash
pnpm exec docusaurus docs:version 1.0.0
pnpm exec docusaurus docs:version:community 1.0.0
```

Behavior model:

- `docs/` is the current version
- `docs:version` copies a snapshot to `versioned_docs/version-<version>/` and sidebars to `versioned_sidebars/`; current content remains in place
- named instances use `<pluginId>_versioned_docs/`, `<pluginId>_versioned_sidebars/` and their own versions file; use `docs:version:<pluginId>`
- modify the requested current or numbered version only; snapshot creation is not needed to edit an existing version
- the latest numbered version usually gets the shortest stable URL

## i18n

Declare locales in site config:

```ts
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'fr'],
},
themeConfig: {
  navbar: {
    items: [{type: 'localeDropdown', position: 'right'}],
  },
},
```

Translation locations:

- default-instance current docs: `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- numbered docs: the same plugin directory with `version-<version>/` instead of `current/`
- named-instance docs: `i18n/<locale>/docusaurus-plugin-content-docs-<pluginId>/current/` or `version-<version>/`
- blog Markdown: `i18n/<locale>/docusaurus-plugin-content-blog/`
- Markdown pages: `i18n/<locale>/docusaurus-plugin-content-pages/`
- React pages/components: use `Translate`/`translate` and extract with the installed `write-translations` command; translate `i18n/<locale>/code.json`, not copied JSX pages
- plugin/theme UI JSON lives under its corresponding directory in `i18n/<locale>/`; inspect generated translation files instead of assuming every string is in root JSON

See the [i18n tutorial](https://docusaurus.io/docs/i18n/tutorial). Preserve untranslated fallback behavior unless changing it is in scope; a build alone does not prove locale/version navigation.

Practical rules:

- translate JSON UI strings and Markdown content separately
- use explicit heading IDs when translated anchor stability matters
- remember that non-default locales usually get `/<locale>/` in the URL
- localized 404 behavior depends on the host and often needs extra configuration

## Release checklist

- `build` passes without warnings you do not understand
- preview host or `pnpm run serve` matches production paths and `trailingSlash` behavior
- search indexes the right routes and languages
- version dropdowns resolve correctly
- locale switching keeps users on a sensible equivalent page
- metadata, social image, and canonical URL behavior are correct
