# Worktree operations

Read this reference before choosing a worktree root, creating a worktree, or moving an existing worktree.

## Outcome and limits

Make task worktrees easy for the operator to discover and review without weakening Git isolation. Default to a path inside the current repository, never choose an external root silently, and preserve observable Git and operator-owned state when moving an existing linked worktree.

This guidance does not make an external worktree visible inside an already-open editor workspace, change editor settings, or prove that no unobservable process or agent is using a worktree. When ownership or activity cannot be established from available evidence, stop and ask the operator.

## Choose the worktree root

1. Resolve the repository root with `git rev-parse --show-toplevel`.
2. If the operator explicitly specifies a location for the current task, use it after reporting whether it is repository-local or external.
3. Otherwise inspect the closest applicable repository instructions. They may replace the portable default only with a repository-local root.
4. Otherwise use `<repository-root>/.worktrees/<task-slug>` without asking.

Treat a root as repository-local only when its canonical path is contained by the canonical repository root. Reject absolute or path-traversing task slugs. If a symlink or canonical-path resolution sends the proposed root outside the repository, treat it as external.

An outside-repository absolute path in legacy repository documentation, or the mere existence of a shared external worktree directory, is not authority to use it. Before using an external root that the operator did not already choose explicitly:

1. show the exact proposed path;
2. explain the confirmed technical reason the repository-local root cannot be used;
3. explain the effect on editor discoverability and review;
4. obtain explicit operator confirmation;
5. record the constraint and decision in commentary and the final handoff.

If confirmation is absent, stop before creating or moving the worktree.

## Prepare a repository-local root

Before creating a worktree under the repository root:

1. Run `git status -sb` and `git worktree list`.
2. Create the selected top-level worktree directory when it is absent. For the default, create `<repository-root>/.worktrees/`; do not add `.gitkeep`.
3. Use `git check-ignore` on the actual top-level directory and confirm that Git ignores it.
4. If it is not ignored, add the repository-relative directory rule to the root `.gitignore`.
5. Stage only the root `.gitignore` with an explicit path. Never use `git add .` in a dirty checkout.
6. Inspect `git diff --cached --name-only` and `git diff --cached -- .gitignore`; the staged set must contain only the intended root `.gitignore` change.
7. Create a separate Conventional Commit containing only that change.
8. Repeat `git check-ignore` and stop if the directory is still not ignored.

Do not create the worktree when repository policy or operator instructions prohibit the required `.gitignore` commit, the staged scope cannot be isolated, or the ignore check cannot be established. Never commit the contents of the worktree root.

## Create and verify a task worktree

1. Resolve the base branch from explicit operator instructions and applicable repository policy; do not infer it from the hosting platform's default branch alone.
2. Inspect the base branch, its upstream, and the intended base commit. Do not use a dirty checkout as an implicit source of files, or an unpublished local base commit, without operator permission.
3. Inspect `git worktree list` and confirm that the target path and task branch are not already assigned.
4. Validate that `<task-slug>` is one repository-relative path component and that the resulting canonical parent remains inside the selected root.
5. Create the branch and worktree with `git worktree add <path> -b <branch> <base>`.
6. Verify the registered canonical path with `git worktree list --porcelain`.
7. Inside the new worktree, verify `git branch --show-current`, `git rev-parse HEAD`, and `git status -sb`.
8. Run only the repository-required setup and baseline checks. Report failures instead of hiding or automatically bypassing them.

Report at least:

- repository root;
- canonical worktree path;
- task branch;
- base commit;
- resulting `git status -sb`;
- `code --new-window <repository-root>/.worktrees/<task-slug>` or the corresponding command for an explicitly selected root.

## Move an existing linked worktree

Use `git worktree move`; do not substitute a manual filesystem move. The main worktree and linked worktrees containing submodules cannot be moved with this command. Treat those cases, locked worktrees, cross-filesystem failures, and other Git-reported limitations as blocking technical constraints; report them and ask the operator instead of forcing or inventing a fallback.

### Before moving

1. Locate the exact entry with `git worktree list --porcelain` and confirm it is a linked worktree.
2. Record its canonical path, branch, and HEAD.
3. Capture staged, unstaged, untracked, and ignored state without exposing file contents in commentary or handoff.
4. Keep comparison evidence in process memory when possible. If a file is necessary, create a permission-restricted disposable directory outside the repository and every worktree, and keep its path private.
5. Never write comparison manifests, diffs, hashes, or temporary evidence into the repository, source worktree, or destination worktree.
6. Capture a private comparison manifest for ignored operator-owned paths and symlinks. Include relative path, file type, symlink target, and a non-disclosing content or metadata fingerprint sufficient to detect loss or change.
7. Capture the tracked staged and unstaged diff in the same protected evidence boundary.
8. Check available process and agent-coordination evidence for a dev server, test runner, shell, editor task, or another agent using the worktree.
9. Confirm the destination does not exist and is not registered to another worktree.
10. For a repository-local destination, complete the ignore preparation contract first.

Do not move a dirty, locked, occupied, or uncertainly idle worktree without an explicit operator decision based on the reported state. Do not delete or overwrite an existing destination. Do not use `--force` as a shortcut around these gates.

### Move and verify

1. Run `git worktree move <old-path> <new-path>` only after every precondition passes.
2. Re-read `git worktree list --porcelain` and confirm the new canonical path is registered and the old path is absent.
3. Confirm branch and HEAD are unchanged.
4. Compare staged, unstaged, untracked, and ignored status with the pre-move state.
5. Compare the tracked diff and the private ignored-file and symlink manifest; stop and report any mismatch.
6. Confirm that evidence capture introduced no paths in the repository, source worktree, or destination worktree.
7. Delete any disposable comparison artifacts after comparison and on every pre-move stop path. If cleanup fails, report the retained private path as an unresolved side effect without exposing its contents.
8. Run `git status -sb` at the new path and include it in the handoff, together with the evidence-cleanup result.

The move is complete only when Git registration, branch, HEAD, tracked diff, status, ignored operator-owned paths, and symlink targets match the pre-move evidence and all file-backed comparison evidence has been removed.
