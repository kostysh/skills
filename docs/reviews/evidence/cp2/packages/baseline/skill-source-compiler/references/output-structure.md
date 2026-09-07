# Output structure

The authoring source layout may be:

```text
skill-name/
├── skill.yaml
├── fragments/
├── references/
├── assets/
├── src/
├── test/
├── scripts/
└── package.json
```

The emitted package layout is narrower:

```text
skill-name/
├── SKILL.md
├── references/  # declared entries only
├── assets/      # declared entries only
├── scripts/     # declared copies only
└── docs/
```

`docs/compile-report.md` is compiler-owned. `skill.yaml`, fragments, source code, tests, package metadata, and toolchain files are not emitted unless explicitly declared; do not declare them merely to make a source-bound test appear runnable.

## Section order

1. Start here
2. When to use
3. When NOT to use
4. Overview
5. Workflow stages
6. Interop priority
7. Runnable commands (only if the skill actually ships commands)
8. Gotchas
9. Policies
10. Active references (only when required or optional references are declared)
11. Assets (only when bundled assets are declared)
12. Portability
13. Supporting surface (only when supporting globs are declared)
14. Final checks

## Generated metadata

- `SKILL.md` frontmatter `metadata` should carry the skill content version from `skill.source-version`
- `docs/compile-report.md` should report the skill content version and, when present, the CLI/package version from `package.json`
