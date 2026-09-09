# Bootstrap and Structure

## Baseline

- Inspect installed versions and declared scripts first. For new bootstrap or version-sensitive changes, verify [installation](https://docusaurus.io/docs/installation), release notes and package engines/peers for the selected versions. Current docs are not evidence for a different installed release.
- Checked 2026-09-09: stable Docusaurus 3.10.2 requires Node >=20 and supports React 18/19; its new scaffold uses React 19. Existing 3.9.2/React 18 projects need no automatic upgrade. New 3.10 scaffold uses `.mdx` content and Faster defaults; preserve existing parser/build choices.
- Select a supported Node release satisfying core, pnpm, plugins and quality tools together. For new repos the template uses Node 24 LTS; Node 22 is another option when all selected tools support it. markdownlint-cli2 0.23.2 requires Node >=22, so core's >=20 minimum is insufficient. Preserve a compatible installed legacy linter/runtime combination rather than replacing it with latest. If the existing runtime is unsupported, report that lifecycle limit without upgrading it without authority.
- These are dated compatibility facts, not permanent pins. Recheck engines and the [Node release schedule](https://github.com/nodejs/Release/blob/main/schedule.json) when choosing versions. If sources are unavailable, preserve verified installed choices and bound the unverified adoption decision.
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
  title: 'Acme Docs',
  url: 'https://docs.acme.dev',
  baseUrl: '/',
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
pnpm run serve
pnpm exec docusaurus --version
pnpm exec docusaurus --help
pnpm exec docusaurus clear
```

For authorized bootstrap, run `pnpm docs:quality` (includes build), then `pnpm run serve` and inspect the affected routes. For other tasks apply the root verification boundary. `pnpm run serve --build` is an optional combined rebuild/preview, not a check of frozen output. Use the installed CLI help when scripts or flags differ.
