# Release playbook

Use this file for version bumps, release notes, tags, release health checks, publishing, assets, and immutable-release-aware flows.

## Release safety defaults

- Treat Git tags as source-of-truth.
- Inspect before publish: `git tag`, `git show TAG`, `gh release list`, `gh release view TAG`.
- Prefer signed tags created from the default branch after a release PR is merged.
- Prefer CI-driven release creation where the repo already has a release workflow.
- Use `--notes-file` for any multiline release body.
- Prefer draft release → upload assets → publish when immutable releases may be enabled.
- Do not delete releases/assets/tags without explicit approval and a recovery plan.

## Inspect release state

```bash
node scripts/gh-utility.mjs release-state --repo OWNER/REPO --tag v1.2.3 --fetch-tags
gh release list --repo OWNER/REPO --limit 20
gh release view v1.2.3 --repo OWNER/REPO --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets,body
git show --no-patch --format='%H %aI %s' v1.2.3
git diff --stat v1.2.2..v1.2.3
```

## Determine version

Inspect ecosystem files before editing:

| Ecosystem | Common version files |
|---|---|
| Node | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` |
| Python | `pyproject.toml`, `setup.cfg`, `setup.py`, package `__init__.py` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Go | tags/modules, `go.mod` for module path (not version) |
| Java | `pom.xml`, `build.gradle`, `gradle.properties` |
| .NET | `.csproj`, `Directory.Build.props`, `.nuspec` |
| Docker/action | `action.yml`, image tags, Helm charts |

Use conventional commits only if the project already follows them; otherwise ask for major/minor/patch or infer conservatively.

## Recommended release flow

1. Inspect current state and latest tag.
2. Determine next version and changed files.
3. Update all version files consistently.
4. Update changelog/release notes from actual diff evidence.
5. Create `release/vX.Y.Z` branch and PR.
6. Wait for CI and review.
7. After merge, tag default branch with a signed tag:

```bash
git checkout main
git pull --ff-only
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

8. Let CI publish if configured.
9. Verify:

```bash
gh release view vX.Y.Z --repo OWNER/REPO --json url,name,tagName,isDraft,isPrerelease,publishedAt,assets,body
gh release verify vX.Y.Z --repo OWNER/REPO
```

10. If release body needs editing, use:

```bash
gh release edit vX.Y.Z --repo OWNER/REPO --notes-file release-notes.md
```

## Direct `gh release create`

Only use direct release creation when it matches the repository's policy and the user approves. Avoid implicit lightweight tag creation.

Safer direct pattern with existing tag:

```bash
git show --no-patch vX.Y.Z
gh release create vX.Y.Z --repo OWNER/REPO --title "vX.Y.Z" --notes-file release-notes.md --draft
# upload assets while draft
gh release upload vX.Y.Z dist/* --repo OWNER/REPO
# publish draft via UI or approved API/CLI step
```

If the tag does not exist, stop and ask whether to create a signed tag from the default branch or let CI handle it.

## Release notes evidence standard

Do not rely only on commit subjects or `--generate-notes` when the user asks for accurate notes. Inspect:

```bash
git log --oneline BASE..TAG
git diff --name-status BASE..TAG
git diff --stat BASE..TAG
git show --stat IMPORTANT_COMMIT
```

Read changed workflows, scripts, docs, public API files, and version metadata before claiming behavior changed. Mention validation only if run in the current environment.

## Assets and verification

```bash
gh release upload TAG file1 file2 --repo OWNER/REPO
gh release download TAG --repo OWNER/REPO --dir tmp/release-assets
gh release verify-asset TAG asset-name --repo OWNER/REPO
gh attestation verify dist/app.tar.gz --repo OWNER/REPO
```

Asset upload/delete is medium/high risk; ask first. For immutable releases, attach all assets before publication.

## Recovery notes

- Draft typo: edit body/title before publish.
- Published mutable release typo: edit body with `--notes-file`; changing assets/tags may be policy-restricted.
- Immutable release tag mistake: tag name may not be reusable; stop and escalate to maintainer policy.
- CI re-run clobbered notes: edit release body after CI completes and avoid re-running release workflow unless necessary.
