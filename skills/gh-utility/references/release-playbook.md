# Release playbook

Use this file for GitHub-side release inspection, publication, assets, health checks, and
immutable-release-aware recovery. Version selection, source edits, local branches, commits, tags,
and pushes belong to the release implementation owner and `git-engineer`.

## Release safety defaults

- Treat the pushed Git tag and its commit SHA as source-of-truth.
- Inspect the remote tag/ref, existing release, publication policy, and CI ownership before acting.
- Prefer CI-driven release creation where the repository already has a release workflow.
- Use `--notes-file` for multiline release bodies.
- Prefer draft release → upload assets → publish when immutable releases may be enabled.
- Do not delete releases, assets, or tags without exact authorization and a recovery plan.

## Inspect GitHub release state

```bash
gh release list --repo OWNER/REPO --limit 20
gh release view v1.2.3 --repo OWNER/REPO --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets,body
gh api -X GET repos/OWNER/REPO/git/ref/tags/v1.2.3 --jq '{ref,sha:.object.sha,type:.object.type}'
```

If the tag is annotated, resolve the returned tag object only when the peeled commit SHA matters.
Do not infer local Git state from the presence of a GitHub release.

## Required handoff from source and Git owners

Before GitHub publication, obtain:

- approved version and release policy;
- merged commit SHA and source-validation evidence;
- signed tag name, target SHA, and push evidence from `git-engineer`;
- release-notes file and exact asset paths from their owning workflow;
- whether CI or a direct `gh release create` owns publication.

If any input is absent or conflicts with remote state, stop as `blocked`. `gh-utility` does not
infer versions, edit source files, create local branches, repair history, or push tags.

## Recommended release flow

1. Inspect current GitHub release state and latest remote tag.
2. Hand version/source/tag work to the release implementation owner and `git-engineer`.
3. Compare returned tag/SHA evidence with the authoritative remote ref.
4. Let CI publish when configured; otherwise use an exactly authorized direct release flow.
5. Verify:

```bash
gh release view vX.Y.Z --repo OWNER/REPO --json url,name,tagName,isDraft,isPrerelease,publishedAt,assets,body
```

When repository policy requires signed release attestations, additionally run
`gh release verify vX.Y.Z --repo OWNER/REPO`. Do not treat missing attestations as a generic release
failure when that policy is not enabled.

6. If an authorized body correction remains:

```bash
gh release edit vX.Y.Z --repo OWNER/REPO --notes-file release-notes.md
```

## Direct `gh release create`

Use direct creation only when repository policy allows it and the current request authorizes the
exact repository, existing tag, title, body, draft/public state, and asset plan.

```bash
gh api -X GET repos/OWNER/REPO/git/ref/tags/vX.Y.Z --jq '{ref,sha:.object.sha,type:.object.type}'
gh release create vX.Y.Z --repo OWNER/REPO --title "vX.Y.Z" --notes-file release-notes.md --draft
gh release upload vX.Y.Z dist/file1 dist/file2 --repo OWNER/REPO
```

If the remote tag does not exist or points to the wrong SHA, stop and hand correction to
`git-engineer`; do not create or push a tag from this skill.

## Release notes evidence

Use source-diff and validation evidence supplied by the implementation owner. Corroborate the
GitHub-visible compare range instead of turning commit subjects into unsupported behavior claims:

```bash
gh api -X GET repos/OWNER/REPO/compare/BASE...TAG \
  --jq '{status,ahead_by,total_commits,files:[.files[]|{filename,status,changes}]}'
```

Read changed workflows, scripts, docs, public API files, and version metadata through the owning
source workflow before claiming behavior changed. Mention validation only when current evidence
was supplied or observed.

## Assets and verification

```bash
gh release upload TAG file1 file2 --repo OWNER/REPO
gh release download TAG --repo OWNER/REPO --dir tmp/release-assets
gh release verify-asset TAG tmp/release-assets/asset-name --repo OWNER/REPO
gh attestation verify tmp/release-assets/asset-name --repo OWNER/REPO
```

`verify-asset` takes a local downloaded file path, not the remote asset name alone. Asset
upload/delete is medium/high risk; require an exact target and action. For immutable releases,
attach all assets before publication.

## Recovery notes

- Draft typo: edit body/title before publish.
- Published mutable release typo: edit body with `--notes-file`; changing assets/tags may be policy-restricted.
- Wrong or missing tag: hand correction to `git-engineer`; do not rewrite remote Git from this skill.
- Immutable release tag mistake: tag name may not be reusable; stop and escalate to maintainer policy.
- CI re-run clobbered notes: inspect current state before an authorized edit; do not rerun blindly.
