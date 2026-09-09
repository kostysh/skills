# AGENTS.md

## Applicability

This template describes a new pnpm repository. Adapt commands, runtime pins and checks to established project conventions before adopting it. User task scope governs actions: review-only work does not authorize fixes, install, build, clear, servers or publication. Report unavailable checks and the exact unverified behavior; do not imply readiness from a successful build alone.

## Package manager

- Use `pnpm` only.
- Add and run tools through `pnpm`.
- Do not introduce `npm`, `npx`, `yarn`, `bun`, or `bunx` examples.

## Documentation workflow

- Apply local formatting to authorized files after significant Markdown or MDX edits; check broad script scope before using it.
- Run `pnpm lint:md:fix` for fixable Markdown issues.
- Run `pnpm docs:quality` before handoff.
- After a successful build, use `pnpm run serve` to inspect that output when routes, `baseUrl`, `trailingSlash`, search, or theme behavior changed. `pnpm run serve --build` intentionally rebuilds; do not insert an extra `--` before pnpm script flags.
- Keep `.github/workflows/docs-quality.yml` in check-only mode.
- Do not add autofix commands to CI.

## Authoring rules

- Preserve the project format; prefer `.md` for new plain content where consistent. Default Docusaurus parsing is MDX even for `.md`; inspect `markdown.format`.
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
- Lint includes every authored content/version/locale tree, including named docs instances; generated exclusions are explicit.
- No broken relative links or stale navbar/sidebar references remain.
- New pages are reachable from the intended navigation.
- Title, description, headings, and front matter are coherent.
- Rendered verification is done when pages, layouts, or MDX components changed.

## Route and IA safety

- If docs are served from `/`, avoid conflicting `src/pages/index.*`.
- Prevent collisions in final routes, including the site base URL, instance `routeBasePath`, version and locale. The same slug in different instances is valid when its final routes differ.
- For versioned docs, update the intended version only.
- Consider search impact when renaming or splitting high-value docs.

## MDX policy

- Prettier formats `.md` and `.mdx`.
- markdownlint-cli2 lints `.md` by default.
- Expand markdownlint-cli2 to `.mdx` only after validating the actual MDX patterns used in the repo.
- `markdownlint-cli2 --fix` is for local work only, never for CI.
