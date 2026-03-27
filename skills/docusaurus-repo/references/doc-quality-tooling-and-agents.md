# Doc Quality Tooling and AGENTS

## Mandatory bootstrap

Every Docusaurus repo created with this skill must ship with:

- `prettier`
- `markdownlint-cli2`
- `.prettierrc.json`
- `.prettierignore`
- `.markdownlint-cli2.jsonc`
- `AGENTS.md`
- `.github/workflows/docs-quality.yml`

Do this immediately after scaffolding the site, before significant content work starts.

## Install

```bash
pnpm add -D prettier markdownlint-cli2
```

## Required package scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint:md": "markdownlint-cli2",
    "lint:md:fix": "markdownlint-cli2 --fix",
    "docs:quality": "pnpm format:check && pnpm lint:md && pnpm build"
  }
}
```

Rules:

- `prettier` is the formatter/fixer for `.md` and `.mdx`.
- `markdownlint-cli2` is the structural Markdown linter and should be used in both normal and `--fix` modes.
- `docs:quality` is a mandatory gate before handoff.
- CI runs check-only commands. Autofix stays local.

## Default config files

Use the ready templates from `assets/project-files/`:

- [assets/project-files/.prettierrc.json](../assets/project-files/.prettierrc.json)
- [assets/project-files/.prettierignore](../assets/project-files/.prettierignore)
- [assets/project-files/.markdownlint-cli2.jsonc](../assets/project-files/.markdownlint-cli2.jsonc)
- [assets/project-files/AGENTS.md](../assets/project-files/AGENTS.md)
- [assets/project-files/.github/workflows/docs-quality.yml](../assets/project-files/.github/workflows/docs-quality.yml)

Adapt them to the target repo, but do not omit them.

## GitHub Actions workflow

Add a dedicated docs-quality workflow to GitHub Actions.

Required behavior:

- run on `pull_request` and `push`
- install dependencies with `pnpm`
- run `pnpm format:check`
- run `pnpm lint:md`
- run `pnpm build`
- never run `pnpm format`
- never run `pnpm lint:md:fix`
- never mutate repository files in CI

Use the ready template from `assets/project-files/.github/workflows/docs-quality.yml`.

## Why this split

Based on the markdown-linters research:

- Prettier is the formatter baseline and handles Markdown and MDX well.
- markdownlint-cli2 is the default production Markdown linter and supports `--fix` for fixable rules.
- The combination is stronger than trying to make one tool do both jobs.

## Docusaurus-specific markdownlint defaults

The provided `.markdownlint-cli2.jsonc` intentionally:

- configures `frontMatter` so YAML front matter is ignored correctly
- disables `MD041` because Docusaurus often uses front matter `title` without a literal first-line heading
- disables `MD033` because Docusaurus and MDX commonly need HTML/JSX
- disables `MD013` so Prettier and authoring flow are not forced into noisy line-wrap churn

## MDX policy

Start with this policy:

- Prettier runs on both `.md` and `.mdx`.
- markdownlint-cli2 lints `.md` by default.
- Expand markdownlint-cli2 globs to `.mdx` only after validating the project's actual MDX patterns and confirming the lint noise is acceptable.

This is the safe default for Docusaurus because MDX can contain JSX-heavy constructs that are outside markdownlint-cli2's primary focus.

## AGENTS.md requirements

Seed `AGENTS.md` at repo bootstrap. It should tell future agents:

- use `pnpm` only
- run `pnpm format` after significant doc edits
- run `pnpm lint:md:fix` for fixable Markdown issues
- run `pnpm docs:quality` before handoff
- keep GitHub Actions docs-quality workflow in check-only mode
- prefer `.md` over `.mdx` unless JSX/imported components are necessary
- keep slugs, sidebars, routes, and search implications in sync
- validate rendered output, not only source files

## Mandatory doc quality gates

At minimum, `AGENTS.md` must enforce:

1. `pnpm format:check`
2. `pnpm lint:md`
3. `pnpm build`
4. GitHub Actions workflow runs only check commands and no autofix
5. no broken or stale navigation/route assumptions
6. coherent front matter, headings, and document titles
7. explicit rendered verification when pages, layouts, or MDX components changed
