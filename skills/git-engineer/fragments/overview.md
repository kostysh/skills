## Outcome and evidence boundary

Complete the requested Git operation with the smallest authorized mutation, preserve unrelated operator-owned work, and verify the resulting local or remote refs. A command that was shown or started, a compiler check, and a globally clean worktree are not completion evidence by themselves.

This documentation-only skill does not enforce repository policy, prove GitHub state, decide code-review findings, or repair CI. It guides Git decisions and reports only the state that was actually observed.

## Authority and readiness

Before mutating a repository:

1. Resolve the repository root and read explicit operator instructions plus applicable `AGENTS.md`, `CONTRIBUTING.md`, `README*`, hooks, and linked process documentation.
2. Inspect the current branch, `HEAD`, index, staged, unstaged, untracked, upstream, remote, and any merge, rebase, revert, or cherry-pick state relevant to the request.
3. Name the exact operation and target. Inspection does not authorize mutation; commit does not authorize push; push does not authorize a pull request; rewrite, deletion, conflict resolution, and destructive cleanup require explicit operator or repository authority.
4. Stop before mutation when the target, base, remote, destination ref, ownership, protected status, operator-owned state, or applicable policy remains materially ambiguous.

Use repository state as evidence, not as permission. An existing branch, upstream, worktree, stash, or remote configuration does not by itself authorize changing it.

## Commit convention

Apply commit-message policy in this order:

1. explicit operator instruction for the current task;
2. mandatory repository policy and a clear, consistent repository convention;
3. the portable `git-engineer` default below.

The default is Conventional Commits with a type emoji:

```text
<type>(<optional-scope>)<optional-!>: <emoji> <subject>

<optional body>

<optional footer(s)>
```

| Purpose | Default type | Emoji |
| --- | --- | --- |
| New behavior or user-facing capability | `feat` | ✨ |
| Bug fix | `fix` | 🐛 |
| Internal restructuring without behavior change | `refactor` | ♻️ |
| Performance improvement | `perf` | ⚡ |
| Tests | `test` | 🧪 |
| Documentation-only change | `docs` | 📝 |
| Build system or dependencies | `build` | 🏗️ |
| CI configuration | `ci` | 👷 |
| Maintenance or tooling | `chore` | 🔧 |
| Revert | `revert` | ⏪ |

Choose the type from the change purpose, not the file extension. Documentation that is required to complete a bug fix remains part of the `fix` commit unless repository policy says otherwise. Additional repository-defined types are valid.

Derive an optional scope from repository policy and established history. Do not assume a `packages/` layout, invent a generic multi-package scope, or add a scope merely to fill the field. Keep the subject concise and imperative. For a breaking change, use `!`, a `BREAKING CHANGE:` footer, or both as required by repository policy.

## Commit and amend operations

1. Record the starting branch and `HEAD`, then inspect `git status --porcelain=v2 --branch` and the current index.
2. Select the intended paths or hunks explicitly. Avoid broad staging when unrelated changes exist.
3. Inspect `git diff --cached --name-status` and the staged diff before committing. The staged delta must match the requested change.
4. Preserve unrelated staged, unstaged, and untracked work. Do not reset, restore, clean, or stash it merely to obtain a clean status.
5. Include tracked generated or synchronized artifacts when repository policy, source/generated parity, release behavior, or the requested change requires them. Exclude dependencies, caches, and incidental build output unless they are intentionally tracked and required.
6. Split commits when changes have independent purposes, rollback boundaries, or validation evidence. Do not split mechanically by file class when the files jointly implement one outcome.
7. Run the applicable repository checks unless the operator explicitly accepts the gap.
8. After commit or amend, verify the resulting commit OID and inspect its message and changed paths. Re-read status and report preserved residual changes instead of requiring a globally clean worktree.

An amend rewrites the current commit. Do not amend a published or shared commit without explicit rewrite authority and a safe remote-update plan.

## Merge, rebase, cherry-pick, revert, and branch operations

- Resolve the source, destination, base, and expected tip OIDs before the operation. Do not substitute a hosting platform's default branch for repository policy.
- Use rebase or fast-forward when policy requires linear history and commits must be preserved; squash only when collapse is authorized; use a merge commit when branch topology must remain visible.
- Do not auto-stash or start a history operation over unrelated dirty state unless the operator explicitly authorizes the preservation strategy.
- If Git stops on conflicts, preserve the in-progress state. Report the operation, conflicted paths, current `HEAD`, and the available continue, skip, or abort choices; do not claim completion or choose a destructive recovery path without authority.
- After success, verify the relevant branch tips, ancestry or resulting commit, and worktree status against the requested outcome.

## Push and remote-ref safety

Before any push, resolve the exact remote, local source, destination ref, upstream relationship, and current remote destination OID. Prefer an explicit refspec such as `<source>:refs/heads/<destination>` over relying on ambiguous defaults.

For a normal push:

1. confirm that the update is the intended fast-forward or creation;
2. push only the named ref;
3. perform a fresh remote read and verify that the destination ref resolves to the intended OID.

For a non-fast-forward update:

1. require explicit rewrite authority, an owned task branch, and confirmation that the destination is not protected or mainline;
2. record the exact remote destination OID that the operator-authorized rewrite is based on;
3. use an explicit source/destination refspec and `--force-with-lease=refs/heads/<destination>:<expected-oid>`;
4. never use `--force`, an implicit lease, `--all`, `--mirror`, or a broad matching refspec;
5. stop if the lease fails or ownership, protection, remote identity, or expected OID is uncertain;
6. after success, freshly read the remote ref and compare its OID with the intended local source.

Local remote-tracking refs and successful command exit alone do not prove the current remote state. If a fresh remote read is unavailable, report the push result as `partial`, not `verified`.

## Git worktrees

Before choosing a worktree root, creating a worktree, or moving an existing worktree, read [Worktree operations](references/worktrees.md). That reference owns directory precedence, ignore preparation, creation checks, move preservation, stop rules, and the review handoff.

The portable default is `<repository-root>/.worktrees/<task-slug>`. An explicit operator location wins. Repository policy may select another repository-local root, but an external location requires explicit operator confirmation.

## Interop handoff

- Use `gh-utility` for GitHub repositories, issues, pull requests, checks, labels, Actions, merges, and other platform reads or mutations. `git-engineer` may supply the repository-approved history method and exact local branch/ref facts; `gh-utility` owns platform execution and fresh GitHub-state verification.
- Use `code-reviewer` for findings, severity, approval, and merge-readiness judgment. A requested Git operation does not authorize a review verdict.
- Use `gh-fix-ci` for diagnosis and remediation of failing GitHub pull-request checks. This skill may report the local branch or commit involved but does not decide the CI fix.

## Output contract

End with exactly one evidence-calibrated status:

- `verified`: the requested operation completed and the relevant local and, when applicable, remote terminal state was freshly observed;
- `partial`: an authorized action occurred, but required validation or an external boundary could not be observed;
- `blocked`: no safe completion is possible without missing authority, policy, target facts, conflict resolution, credentials, or an external-state change.

Report the requested operation and scope, actions actually taken, starting and resulting branch/HEAD/commit or remote ref OIDs, applicable checks, preserved residual changes, conflicts or side effects, evidence limits, and the smallest next action when status is not `verified`. Distinguish commands proposed from commands actually run.
