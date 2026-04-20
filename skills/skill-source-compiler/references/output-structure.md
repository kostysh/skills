# Output structure

The canonical generated layout is:

```text
skill-name/
├── package.json  # for code-backed skills that ship a runtime package or CLI
├── SKILL.md
├── skill.yaml
├── fragments/   # only if the source bundle uses fragment files
├── references/
├── assets/
├── scripts/     # only if the source bundle emits runtime files here
├── test/        # only if the source bundle emits tests here
└── docs/
```

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
10. Active references
11. Assets
12. Portability
13. Supporting surface
14. Final checks

## Generated metadata

- `SKILL.md` frontmatter should carry the skill content version from `skill.source-version`
- `docs/compile-report.md` should report the skill content version and, when present, the CLI/package version from `package.json`
