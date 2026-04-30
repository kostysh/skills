Before reporting the skill ready after source-bundle changes:

- run the locally available `skill-source-compiler` runtime with `regenerate .` from the skill root;
- run the locally available `skill-source-compiler` runtime with `check .`;
- run the runtime package quality gate: `pnpm run lint`, `pnpm run format:check`, and `pnpm test`;
- confirm `SKILL.md` and `docs/compile-report.md` were generated from `skill.yaml`, not hand-edited.
