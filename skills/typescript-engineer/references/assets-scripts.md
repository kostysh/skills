# Assets and Scripts Usage

> **Load when:** User asks how to use the bundled assets or scripts in this skill.

## Assets
- `assets/tsconfig-strict.json` - Copy to project root as a strict baseline and customize for your runtime.
- `assets/biome.json` - Copy to project root for Biome defaults; adjust rules as needed.
- `assets/eslint.config.js` - Copy to project root for ESLint 9 flat config; ensure `typescript-eslint` is installed.

Use assets as starting points, not immutable templates. Align paths and ignore patterns to your repo layout.

## Scripts
- `scripts/validate-setup.sh` - Run from the project root to validate Node/TypeScript tooling and key config files.

```bash
bash scripts/validate-setup.sh
```

If the repo is a monorepo, run the script at the root and update it to check package-level configs if needed.
