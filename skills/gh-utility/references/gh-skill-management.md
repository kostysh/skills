# `gh skill` management playbook

Use this reference for the preview-stage `gh skill` command family. It is subject to change without
notice. Start with `gh skill --help` and command-local help from the installed CLI; do not reuse
syntax from an older session without checking it.

## Preview and inspect

Preview fetches and renders a remote skill without installation:

```bash
gh skill preview OWNER/REPO SKILL_NAME
gh skill preview OWNER/REPO path/to/SKILL.md
gh skill preview OWNER/REPO SKILL_NAME@TAG_OR_SHA
```

Inspect the shown tree, `SKILL.md`, scripts, references, assets, provenance, and requested agent
permissions. Preview is not an independent capability or security review.

## Install

Remote installation takes the repository and skill selector as separate arguments:

```bash
gh skill install OWNER/REPO SKILL_NAME --agent codex --scope user
gh skill install OWNER/REPO path/to/SKILL.md --agent codex --scope project
gh skill install OWNER/REPO SKILL_NAME --pin TAG_OR_SHA --agent codex --scope user
```

Local installation uses `--from-local`:

```bash
gh skill install ./skills-repository gh-utility --from-local --agent codex --scope user
```

The default non-interactive scope and agent may differ from the operator's intent. Specify both.
Installing or forcing replacement changes agent instructions and may introduce executable code;
require exact authorization for the source, skill, agent, scope, pin, and overwrite behavior.

## List and update

```bash
gh skill list --agent codex --scope user --json skillName,path,sourceURL,scope,version,pinned
gh skill update gh-utility --dry-run
gh skill update gh-utility
```

`--dry-run` reports available updates without applying them. Pinned skills are skipped unless the
operator explicitly authorizes unpinning. A forced update can overwrite local modifications, so
inspect provenance and diff implications first.

## Validate and publish

Run validation from the repository discovery root, not from an individual skill folder:

```bash
gh skill publish skills --dry-run
```

The dry-run validates Agent Skills packaging rules. It does not prove instruction quality,
runtime behavior, portability beyond the checked rules, or independent review PASS. Use
`skill-source-compiler` for structured source drift and `skill-reviewer` for capability verdicts.

Publishing creates or changes repository/release state. Execute only after explicit authorization
for repository, version tag, discovered skill set, and release effect:

```bash
gh skill publish --tag vX.Y.Z
```

Do not run `--fix` without reviewing the exact frontmatter changes it will write.

## Verification

After install or update, run `gh skill list` for the selected agent/scope and inspect the installed
tree. After publish, verify the release and preview the published skill at the resulting tag.
