# Bootstrap and Structure

## Baseline

- Docusaurus 3.x currently requires Node.js 20+.
- Default bootstrap command:

```bash
pnpm create docusaurus@latest my-docs classic --typescript
cd my-docs
pnpm add -D prettier markdownlint-cli2
pnpm start
```

Immediately after scaffolding:

- add the mandatory doc quality files from [references/doc-quality-tooling-and-agents.md](doc-quality-tooling-and-agents.md)
- create `AGENTS.md` before the repository is handed to other agents
- add `.github/workflows/docs-quality.yml` before the first PR
- add the required `package.json` scripts for formatting, linting, fixing, and docs quality gates
- convert the scaffold to `docusaurus.config.ts` and `sidebars.ts` if the template did not already create TypeScript config files
- align the repo's Node runtime signals (`engines`, `.nvmrc`, CI) instead of leaving Docusaurus on one version and the repo on another

## What the classic template gives you

- `docs/` for documentation content
- `blog/` for changelog/blog content
- `src/pages/` for standalone routes
- `src/css/custom.css` for global theme overrides
- `static/` for images and files copied directly to the build output
- `docusaurus.config.*` for site-level configuration
- `sidebars.js` or `sidebars.ts` for docs navigation

Use the classic preset unless you know exactly why you want manual plugin composition.

## Recommended starting modes

### Docs-only

Use this for product docs, SDK docs, internal runbooks, or API docs sites.

```ts
import type {Config} from '@docusaurus/types';

const config: Config = {
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
};

export default config;
```

Rules:

- Remove or replace `src/pages/index.*` to avoid a route collision with docs at `/`.
- Put the real home doc at `slug: /` if you want the first document to live at the site root.

### Docs + blog/changelog

Use this when the docs site also publishes release notes, engineering announcements, or migration posts.

- Keep `docs` at `/docs`
- Keep `blog` at `/blog`
- Use navbar items to separate product docs and editorial content

### Docs + landing page

Use this when the project needs a branded homepage but the documentation is still the primary product surface.

- Keep a custom `src/pages/index.tsx`
- Put docs at `/docs`
- Do not let the landing page grow into a second site with its own design system unless there is a real business reason

## Monorepo guidance

Use a dedicated site folder such as `website/` when Docusaurus lives beside application packages.

Example:

```text
repo/
├── packages/
├── apps/
└── website/
    ├── docs/
    ├── src/
    ├── docusaurus.config.ts
    └── package.json
```

Practical rules:

- Run `create-docusaurus` from the monorepo root if you want it to scaffold `website/`.
- A typical monorepo bootstrap command is `pnpm create docusaurus website classic --typescript`.
- Make the hosting provider's base directory point at the Docusaurus root.
- If docs must import local packages, prefer workspace dependencies over file copies.

## Core commands

```bash
pnpm start
pnpm build
pnpm run serve -- --build
pnpm exec docusaurus --version
pnpm exec docusaurus --help
pnpm exec docusaurus clear
```

Treat `pnpm build` and `pnpm run serve -- --build` as mandatory checks before handing work back.
For repo bootstrap, also treat `pnpm format:check` and `pnpm lint:md` as mandatory.
