# gh-utility

This is a code-backed portable skill.

- Source runtime code lives in `src/`.
- Built runtime artifact is `scripts/gh-utility.mjs`.
- Tests live in `test/`.
- Keep `SKILL.md`, `references/*`, CLI help, and tests aligned when command behavior changes.
- Do not add Python helper scripts; this repository standardizes code-backed skill utilities on TypeScript.

Useful commands from the workspace root:

```bash
pnpm --filter @kostysh/gh-utility-cli build
pnpm --filter @kostysh/gh-utility-cli test
pnpm --filter @kostysh/gh-utility-cli lint
```
