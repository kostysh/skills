# AGENTS.md

## Package manager

- Use `pnpm` only.
- Add and run tools through `pnpm`.
- Do not introduce `npm`, `npx`, `yarn`, `bun`, or `bunx` examples.

## Documentation workflow

- Run `pnpm format` after significant Markdown or MDX edits.
- Run `pnpm lint:md:fix` for fixable Markdown issues.
- Run `pnpm docs:quality` before handoff.
- Run `pnpm run serve -- --build` when routes, `baseUrl`, `trailingSlash`, search, or theme behavior changed.
- Keep `.github/workflows/docs-quality.yml` in check-only mode.
- Do not add autofix commands to CI.

## Authoring rules

- Prefer `.md` unless JSX or imported React components are necessary.
- Keep one clear task, concept, or reference scope per document.
- Use explicit `slug` before renames that change public URLs.
- Keep `docs/` structure and sidebars aligned.
- Keep front matter valid.
- Keep JSX in MDX light and build-tested.
- Do not hand-edit generated API/reference docs; regenerate them from the source spec or generator pipeline.

## Quality gates

- `pnpm format:check` passes.
- `pnpm lint:md` passes.
- `pnpm build` passes.
- GitHub Actions docs-quality workflow runs only checks and no fixes.
- No broken relative links or stale navbar/sidebar references remain.
- New pages are reachable from the intended navigation.
- Title, description, headings, and front matter are coherent.
- Rendered verification is done when pages, layouts, or MDX components changed.

## Route and IA safety

- If docs are served from `/`, avoid conflicting `src/pages/index.*`.
- Do not create duplicate slugs across docs instances.
- For versioned docs, update the intended version only.
- Consider search impact when renaming or splitting high-value docs.

## MDX policy

- Prettier formats `.md` and `.mdx`.
- markdownlint-cli2 lints `.md` by default.
- Expand markdownlint-cli2 to `.mdx` only after validating the actual MDX patterns used in the repo.
- `markdownlint-cli2 --fix` is for local work only, never for CI.
