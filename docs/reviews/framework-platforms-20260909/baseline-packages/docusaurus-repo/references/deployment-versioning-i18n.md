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

Mandatory checks:

```bash
pnpm build
pnpm run serve -- --build --port 3000
```

Use `pnpm run serve -- --build` to catch issues hidden by dev mode and to surface `baseUrl` or path-prefix mistakes before deploy.

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
pnpm run serve -- --build
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
- older versions move to `versioned_docs/`
- old sidebars move to `versioned_sidebars/`
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

- docs: `i18n/<locale>/docusaurus-plugin-content-docs/current`
- blog: `i18n/<locale>/docusaurus-plugin-content-blog`
- pages: `i18n/<locale>/docusaurus-plugin-content-pages`
- UI strings: `i18n/<locale>/*.json`

Practical rules:

- translate JSON UI strings and Markdown content separately
- use explicit heading IDs when translated anchor stability matters
- remember that non-default locales usually get `/<locale>/` in the URL
- localized 404 behavior depends on the host and often needs extra configuration

## Release checklist

- `build` passes without warnings you do not understand
- preview host or `pnpm run serve -- --build` matches production paths and `trailingSlash` behavior
- search indexes the right routes and languages
- version dropdowns resolve correctly
- locale switching keeps users on a sensible equivalent page
- metadata, social image, and canonical URL behavior are correct
