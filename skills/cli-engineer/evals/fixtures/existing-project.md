# Existing CLI project

- Package: `@acme/legacy-cli`
- Runtime: TypeScript on Node.js
- Build: an established esbuild script that emits `dist/cli.js`
- CLI tests: none yet
- Unrelated frontend package: uses Vitest for browser component tests
- `tsx`: not installed
- Requested change: add `--json` output and improve `--help`
- Explicit non-goal: build-system migration or unrelated frontend-test changes
- Distribution: internal package installed through its npm `bin` entry
