# Maintenance

Use this reference when maintaining a `code-backed-generated` skill.

## Scaffold a new code-backed skill

Minimum layout:

```text
skill-name/
├── AGENTS.md
├── SKILL.md                  # generated output
├── skill.yaml                # source of truth for skill content
├── fragments/                # optional prose fragments rendered into SKILL.md
├── references/              # active reference docs copied into the output
├── assets/                  # templates and bundled static files
├── src/                     # source code for the shipped runtime
├── test/                    # tests for the shipped runtime and contracts
├── scripts/                 # built runtime artifacts copied into the output
└── package.json             # CLI/package manifest
```

Required setup:

- add `skill.source-version` in `skill.yaml`
- add `skill.recommended-skill-md-max-bytes` in `skill.yaml`
- define shipped commands in `skill.yaml` only if the runtime actually exposes them
- include command runtime files and smoke tests under `copies`
- keep `AGENTS.md` explicit about skill type, source of truth, and maintenance shortcuts

## Version model

Code-backed generated skills use two separate versions:

- `skill.yaml` `skill.source-version`: version of the skill content and generated instruction surface
- `package.json` `version`: version of the shipped CLI or runtime package

Versioning rules:

- bump `skill.source-version` when skill prose, references, source-bundle policy, or generated output changes
- bump `package.json` `version` when shipped runtime behavior, CLI help, runtime dependencies, or package release surface changes
- bump both when both the instruction surface and the runtime surface change

Rendering note:

- the generated `SKILL.md` must place `skill.source-version` under frontmatter `metadata`, not at the top level

## Optimizing SKILL.md size

The generated `SKILL.md` should stay focused on:

- activation criteria
- workflow stages
- required references
- short gotchas and policies

Move bulky detail into `references/*` when possible:

- long explanations
- framework- or provider-specific variants
- extended examples
- checklists that are only needed in specific scenarios

The public Agent Skills guidance recommends keeping the main `SKILL.md` under about `5000` tokens and `500` lines. This skill uses `skill.recommended-skill-md-max-bytes` as a rough byte-based approximation of that token guidance; the default `20000` bytes is an estimate, not a tokenizer-exact limit.

Use `skill.recommended-skill-md-max-bytes` as a recommended ceiling, not as an excuse to pack more prose into the root file. Raise the limit only when the extra size is genuinely necessary and references cannot remove the bulk without harming usability.

## Compile workflow

When maintaining a generated skill:

1. edit the source files first: `skill.yaml`, `fragments/`, `references/`, `src/`, `test/`, `package.json`
2. look for the shipped utility under `<skill-root>/scripts` and invoke it from the skill root; do not assume a global executable on `PATH`
3. rebuild runtime artifacts into `scripts/`
4. run `node scripts/skill-source-compiler.mjs regenerate .` from the skill root to refresh `SKILL.md` and `docs/compile-report.md`
5. run lint, typecheck, and tests from the workspace root

Do not hand-edit generated `SKILL.md` as the source of truth.
If compile warns that `SKILL.md` exceeds the recommended size, reduce root-file prose first and move detail into active references before increasing the limit.

Use `compile <source-dir> --out-dir <independent-skills-dir>` only when you need an out-of-place packaged copy. The output directory must not be the source bundle, a parent of the source bundle, or a child of the source bundle.

Use `compile-all <sources-root> --out-dir <independent-skills-dir>` only when every child source bundle can be emitted into an independent output directory. The runtime preflights all child output paths before the first destructive write.

In-place regeneration writes only compiler-owned generated files:

- `SKILL.md`
- `docs/compile-report.md`

Manifest entries whose `source` and `target` resolve to the same path are validation-only in in-place mode. Manifest entries whose `source` and `target` resolve to different paths fail closed until the manifest language has an explicit ownership marker.

## Release checklist

- confirm documented commands match the built CLI help surface
- confirm every documented command still has tests
- confirm `SKILL.md`, `docs/compile-report.md`, runtime files, and tests reflect the same change set
- confirm the skill can be copied by itself without losing required behavior
