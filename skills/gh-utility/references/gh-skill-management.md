# `gh skill` management playbook

Use this file when installing, previewing, updating, validating, or publishing agent skills through GitHub CLI.

## Safety rule

Agent skills can contain instructions, scripts, hooks, and assets that an agent may execute or follow. Review the source before installation, especially when granting shell or bash pre-approval in an agent host.

## Inspect before install

```bash
gh skill preview OWNER/REPO/SKILL_NAME
# or a local folder
node scripts/gh-utility.mjs validate-skill path/to/skill
find path/to/skill -maxdepth 3 -type f | sort
sed -n '1,220p' path/to/skill/SKILL.md
```

For a GitHub repo source, inspect repository metadata first:

```bash
gh repo view OWNER/REPO --json nameWithOwner,description,visibility,isArchived,licenseInfo,defaultBranchRef,url
```

## Install

Local skill:

```bash
gh skill install ./gh-utility --from-local --agent codex --scope user
```

Repository skill:

```bash
gh skill install OWNER/REPO/skills/gh-utility --agent codex --scope user
```

Shared project installation usually lives under `.agents/skills/`. User-level installs live under `~/.agents/skills/` or agent-specific skill directories depending on the host.

## Pinning and provenance

Prefer pinned refs or reviewed local installs when reproducibility matters:

```bash
gh skill install OWNER/REPO/skills/gh-utility --ref TREE_SHA --agent codex --scope user
```

Record source, tree SHA/ref, install path, and review date in a local audit note.

## Update

Preview update first:

```bash
gh skill update gh-utility --dry-run
gh skill update gh-utility
```

Pinned installs may be intentionally skipped by update tooling. Do not unpin or update without reviewing diffs.

## Publish checklist

Before publishing a skill repository:

- `SKILL.md` has valid frontmatter with a precise description.
- Large guidance is split into `references/`.
- Scripts are deterministic, dependency-light, and inspect-first.
- No tokens, secrets, private hostnames, or proprietary payloads are committed.
- License is included.
- README explains install, validation, and safety model.
- Example prompts exercise both read-only and approval-gated mutation routes.
- Version/tag/release flow is documented.

## Validate this skill

```bash
node scripts/gh-utility.mjs validate-skill .
pnpm --filter /gh-utility-cli typecheck
```

## Updating this skill safely

1. Read the current `SKILL.md` and changed files.
2. Run validator and Python compile checks.
3. Re-run a few read-only examples against a test repository.
4. Publish as a tag/release only after verification.
5. In consuming environments, run `gh skill preview` or inspect the archive before installation.
