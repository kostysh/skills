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
├── references/              # optional active reference docs copied into the output
├── assets/                  # optional templates and bundled static files
├── src/                     # source code for the shipped runtime
├── test/                    # tests for the shipped runtime and contracts
├── scripts/                 # built runtime artifacts copied into the output
└── package.json             # CLI/package manifest
```

Required setup:

- add `skill.source-version` in `skill.yaml`
- add `skill.recommended-skill-md-max-bytes` in `skill.yaml`
- define shipped commands in `skill.yaml` only if the runtime actually exposes them
- define modes, metrics, and configuration surfaces only if the current skill behavior uses them and verification can prove or inspect them
- include built command runtime files under `copies`; keep source tests in the authoring package unless a test is deliberately shipped and runnable without omitted source or toolchain files
- keep `AGENTS.md` explicit about skill type, source of truth, and maintenance shortcuts
- do not add placeholder `references/*` files for simple skills whose generated `SKILL.md` is self-contained

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
- required references when they exist
- short gotchas and policies

Move bulky detail into `references/*` when possible:

- long explanations
- framework- or provider-specific variants
- extended examples
- checklists that are only needed in specific scenarios

The public Agent Skills guidance recommends keeping the main `SKILL.md` under about `5000` tokens and `500` lines. This skill uses `skill.recommended-skill-md-max-bytes` as a rough byte-based approximation of that token guidance; the default `20000` bytes is an estimate, not a tokenizer-exact limit.

Use `skill.recommended-skill-md-max-bytes` as a recommended ceiling, not as an excuse to pack more prose into the root file. Raise the limit only when the extra size is genuinely necessary and references cannot remove the bulk without harming usability.

## Compile workflow

When maintaining a generated skill, edit the declared source first and use the shipped utility under `<skill-root>/scripts`; do not assume a global executable.

- For instruction-only changes, bump the skill content version, regenerate `SKILL.md` and `docs/compile-report.md`, run CLI `lint` and `check`, and read back the generated package. No runtime rebuild or code test suite is implied by a prose change.
- When runtime, dependencies, or the public CLI contract changes, update the owning source and contract tests, bump the runtime version, rebuild `scripts/`, and run the declared package checks. Use repository/package commands rather than internal dependency paths.
- For delivery of a changed generated skill, compile into a new independent output root and inspect the emitted instructions and required files. If the package ships a utility, exercise it from that copy without relying on omitted authoring files.
- Material instruction changes need the author self-check and the applicable independent review/behavioral gate. A trivial non-behavioral edit uses narrow evidence with its rationale; it does not acquire an artificial runtime test requirement.

Do not hand-edit generated `SKILL.md` as the source of truth.
If compile warns that `SKILL.md` exceeds the recommended size, reduce root-file prose first and move detail into active references before increasing the limit. If a simple skill remains clear and under the recommended size, keep it self-contained instead of adding placeholder references.

Use `compile <source-dir> --out-dir <independent-skills-dir>` only when you need an out-of-place packaged copy. The output directory must not be the source bundle, a parent of the source bundle, or a child of the source bundle.

The resolved `<independent-skills-dir>/<skill-name>` directory must not already exist. The CLI fails closed instead of replacing it because an existing directory may contain operator-owned files. Choose a new output root or explicitly remove a target only after independently establishing that it is disposable.

Use `compile-all <sources-root> --out-dir <independent-skills-dir>` for direct child directories that contain `skill.yaml`. Other direct child directories are skipped. The runtime rejects duplicate paths, overlap, or any existing resolved target before the first write.

In-place regeneration writes only compiler-owned generated files:

- `SKILL.md`
- `docs/compile-report.md`

Manifest entries whose `source` and `target` resolve to the same path are validation-only in in-place mode. Manifest entries whose `source` and `target` resolve to different paths fail closed until the manifest language has an explicit ownership marker.

## Release checklist

- confirm documented commands match the built CLI help surface
- confirm every documented command still has tests
- inspect any description-length warning; 300 Unicode code points is advisory, so preserve justified triggers and record the rationale rather than treating length alone as a release blocker
- confirm documented modes, metrics, configuration surfaces, and active references are current behavior, not future substrate
- confirm `SKILL.md`, `docs/compile-report.md`, runtime files, and source tests reflect the same change set
- compile to an isolated directory and prove the emitted runtime works there without relying on omitted source files, package metadata, or toolchain configuration
- confirm the skill can be copied by itself without losing required behavior
