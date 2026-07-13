# Blind Forward-Test Evidence

## Purpose and boundary

Supporting, non-normative evidence for the repo-local worktree behavior change. Paths are normalized to portable placeholders; this normalization changes path strings only, not commands, decisions, Git identifiers, or outcomes.

The evaluators receive only an active-only packaged skill, the neutral task prompt, disposable fixture authority, and side-effect constraints. They do not receive the suspected defect, intended remediation, rubric, prior test results, implementation log, or supporting docs.

## Snapshot

Active-only package passed compiler package readback before evaluation:

- `SKILL.md`: `3973b7822f807cba23c5502314e94e012ddc23238789fa53c7a6cf218381e243`.
- `references/worktrees.md`: `446200d744da2ccc226f39045995a8d9681a1854c665d9a7fb0c6e37603ed1a2`.
- `agents/openai.yaml`: `d7d0dad26e2453322bc456b415eef3af9045257c5a43580ceeb14fa6daede2ab`.

## Predeclared rubric

### Root selection cases

- A no policy: create the repo-local default and report path, branch, HEAD, status, and review command.
- B existing ignored root: reuse it without location clarification.
- C absent ignored root: create it, then create the worktree.
- D explicit external root: honor it and disclose the external review limitation.
- E legacy external policy without operator confirmation: do not create a branch or worktree; show the path and ask for confirmation with discoverability impact.
- F shared external directory only: do not treat existence as authority; use the repo-local default.
- G generic repository: apply the same portable behavior without project-specific assumptions.

### Ignore and selective commit cases

- A unignored root: create a separate Conventional Commit containing only the root `.gitignore`, recheck ignore, then create and verify the worktree.
- B unrelated dirty main checkout: preserve the unrelated modified/untracked state while committing only `.gitignore` and creating an isolated worktree.

### Move cases

- A clean move: preserve Git registration, branch, HEAD, status, tracked diff, ignored file fingerprint, and symlink target; keep comparison evidence outside Git/worktrees and remove it.
- B dirty move without operator decision: do not move; preserve state, clean comparison evidence, and ask explicitly.
- C existing target: do not move, force, delete, or overwrite; preserve sentinel and clean comparison evidence.

## Neutral prompts and raw results

The following prompts are preserved verbatim except for deterministic path-only normalization: the active package path is `<active-snapshot-root>`, disposable roots are `<root-fixtures>`, `<ignore-fixtures>`, and `<move-fixtures>`, and the author checkout is `<author-repository>`.

### Root selection prompt

> Use the `git-engineer` skill from `<active-snapshot-root>` to handle seven independent worktree requests. Treat each as a real operator task, create disposable Git repositories only under `<root-fixtures>`, and do not inspect or modify `<author-repository>`. Use local test identity if commits are needed. Do not read supporting `docs/*`. Preserve exact before/after Git commands and outputs needed to reconstruct each case, and return your raw per-case handoff or stop response without referring to testing or an expected result. Cases: A) a generic repo has no worktree policy and `.worktrees/` is already ignored; create task `feature-a`; B) `.worktrees/` exists and is ignored; create `feature-b`; C) no worktree root directory exists but `.gitignore` already contains the relevant rule; create `feature-c`; D) the operator explicitly requests an external root under `<root-fixtures>/operator-external`; create `feature-d`; E) repo `AGENTS.md` says all worktrees belong in the absolute external path `<root-fixtures>/legacy-external`, but the operator only asks to create `feature-e` and says nothing about location; F) a shared directory `<root-fixtures>/shared-worktrees` exists, with no policy and no operator location; create `feature-f`; G) repeat the no-policy request in a repository named `generic-ledger`, without project-specific assumptions. For every case report the initial policy/root/ignore/registration state, actions or exact stop question, final registration, branch, HEAD, status, review command or limitation, and any fixture-specific constraint.

# Forward-run evidence: path-only normalization applied after the blind run

## Case A

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/repo-a

$ find . -maxdepth 1 -type f \( -name AGENTS.md -o -name CONTRIBUTING.md -o -name 'README*' \) -printf '%f\n' | sort
README.md

$ if test -d .worktrees; then echo '.worktrees: present'; else echo '.worktrees: absent'; fi
.worktrees: absent

$ git check-ignore -v --no-index .worktrees/
.git/info/exclude:3:/.worktrees/	.worktrees/

$ git status -sb
## main

$ git worktree list --porcelain
worktree <root-fixtures>/repo-a
HEAD e4aa07689326fda21f19efe222c4d51e9ebe6d64
branch refs/heads/main

$ git branch --show-current
main

$ git rev-parse HEAD
e4aa07689326fda21f19efe222c4d51e9ebe6d64

$ git rev-parse --abbrev-ref '@{upstream}' || echo 'upstream: none'
fatal: no upstream configured for branch 'main'
upstream: none
```

Actions:

```text
$ mkdir -p .worktrees

$ git check-ignore -v .worktrees/
.git/info/exclude:3:/.worktrees/	.worktrees/

$ realpath .worktrees
<root-fixtures>/repo-a/.worktrees

$ git show-ref --verify --quiet refs/heads/feature-a && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '.worktrees/feature-a' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
e4aa07689326fda21f19efe222c4d51e9ebe6d64

$ git worktree add .worktrees/feature-a -b feature-a main
Preparing worktree (new branch 'feature-a')
HEAD is now at e4aa076 chore: initialize fixture repository
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/repo-a
HEAD e4aa07689326fda21f19efe222c4d51e9ebe6d64
branch refs/heads/main

worktree <root-fixtures>/repo-a/.worktrees/feature-a
HEAD e4aa07689326fda21f19efe222c4d51e9ebe6d64
branch refs/heads/feature-a

$ git branch --show-current
feature-a

$ git rev-parse HEAD
e4aa07689326fda21f19efe222c4d51e9ebe6d64

$ git status -sb
## feature-a
```

Review command:

```text
code --new-window <root-fixtures>/repo-a/.worktrees/feature-a
```

Constraint: no repository worktree policy or remote/upstream exists. The ignore authority is local `.git/info/exclude`, so no tracked ignore commit was needed.

## Case B

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/repo-b

$ find . -maxdepth 1 -type f \( -name AGENTS.md -o -name CONTRIBUTING.md -o -name 'README*' \) -printf '%f\n' | sort
README.md

$ if test -d .worktrees; then echo '.worktrees: present'; else echo '.worktrees: absent'; fi
.worktrees: present

$ git check-ignore -v --no-index .worktrees/
.gitignore:1:/.worktrees/	.worktrees/

$ git status -sb
## main

$ git worktree list --porcelain
worktree <root-fixtures>/repo-b
HEAD 6d14b709f27e6f8635d846432744d59a0e2956ec
branch refs/heads/main
```

Actions:

```text
$ mkdir -p .worktrees

$ git check-ignore -v .worktrees/
.gitignore:1:/.worktrees/	.worktrees/

$ realpath .worktrees
<root-fixtures>/repo-b/.worktrees

$ git show-ref --verify --quiet refs/heads/feature-b && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '.worktrees/feature-b' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
6d14b709f27e6f8635d846432744d59a0e2956ec

$ git worktree add .worktrees/feature-b -b feature-b main
Preparing worktree (new branch 'feature-b')
HEAD is now at 6d14b70 chore: initialize fixture repository
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/repo-b
HEAD 6d14b709f27e6f8635d846432744d59a0e2956ec
branch refs/heads/main

worktree <root-fixtures>/repo-b/.worktrees/feature-b
HEAD 6d14b709f27e6f8635d846432744d59a0e2956ec
branch refs/heads/feature-b

$ git branch --show-current
feature-b

$ git rev-parse HEAD
6d14b709f27e6f8635d846432744d59a0e2956ec

$ git status -sb
## feature-b
```

Review command:

```text
code --new-window <root-fixtures>/repo-b/.worktrees/feature-b
```

Constraint: the existing repository-local root was already ignored by tracked `.gitignore`; no preparation commit was needed.

## Case C

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/repo-c

$ if test -d .worktrees; then echo '.worktrees: present'; else echo '.worktrees: absent'; fi
.worktrees: absent

$ git check-ignore -v --no-index .worktrees/
.gitignore:1:/.worktrees/	.worktrees/

$ git status -sb
## main

$ git worktree list --porcelain
worktree <root-fixtures>/repo-c
HEAD 0dd3b410d48eea6a68ac2cf7ce7934c3845fd68a
branch refs/heads/main
```

Actions:

```text
$ mkdir -p .worktrees

$ git check-ignore -v .worktrees/
.gitignore:1:/.worktrees/	.worktrees/

$ realpath .worktrees
<root-fixtures>/repo-c/.worktrees

$ git show-ref --verify --quiet refs/heads/feature-c && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '.worktrees/feature-c' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
0dd3b410d48eea6a68ac2cf7ce7934c3845fd68a

$ git worktree add .worktrees/feature-c -b feature-c main
Preparing worktree (new branch 'feature-c')
HEAD is now at 0dd3b41 chore: initialize fixture repository
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/repo-c
HEAD 0dd3b410d48eea6a68ac2cf7ce7934c3845fd68a
branch refs/heads/main

worktree <root-fixtures>/repo-c/.worktrees/feature-c
HEAD 0dd3b410d48eea6a68ac2cf7ce7934c3845fd68a
branch refs/heads/feature-c

$ git branch --show-current
feature-c

$ git rev-parse HEAD
0dd3b410d48eea6a68ac2cf7ce7934c3845fd68a

$ git status -sb
## feature-c
```

Review command:

```text
code --new-window <root-fixtures>/repo-c/.worktrees/feature-c
```

Constraint: the directory had to be created before the normal ignore verification; its tracked ignore rule already existed.

## Case D

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/repo-d

$ git status -sb
## main

$ git worktree list --porcelain
worktree <root-fixtures>/repo-d
HEAD e575108c4a26d025220d464f90bac5b4a3dc31e9
branch refs/heads/main

$ realpath <root-fixtures>/operator-external
<root-fixtures>/operator-external

$ case "$(realpath <root-fixtures>/operator-external)" in "$(realpath .)"/*) echo 'selected root: repository-local';; *) echo 'selected root: external (operator-selected)';; esac
selected root: external (operator-selected)
```

Actions:

```text
$ test ! -e <root-fixtures>/operator-external/feature-d && echo 'target path: absent'
target path: absent

$ git show-ref --verify --quiet refs/heads/feature-d && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '<root-fixtures>/operator-external/feature-d' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
e575108c4a26d025220d464f90bac5b4a3dc31e9

$ git worktree add <root-fixtures>/operator-external/feature-d -b feature-d main
Preparing worktree (new branch 'feature-d')
HEAD is now at e575108 chore: initialize fixture repository
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/repo-d
HEAD e575108c4a26d025220d464f90bac5b4a3dc31e9
branch refs/heads/main

worktree <root-fixtures>/operator-external/feature-d
HEAD e575108c4a26d025220d464f90bac5b4a3dc31e9
branch refs/heads/feature-d

$ git branch --show-current
feature-d

$ git rev-parse HEAD
e575108c4a26d025220d464f90bac5b4a3dc31e9

$ git status -sb
## feature-d
```

Review command:

```text
code --new-window <root-fixtures>/operator-external/feature-d
```

Constraint: this is an explicitly operator-selected external root. It is not discoverable beneath the repository’s own directory tree; review must open the external path directly.

## Case E

Initial and final state:

```text
$ sed -n '1,80p' AGENTS.md
# Worktree policy

All worktrees belong in `<root-fixtures>/legacy-external`.

$ realpath .
<root-fixtures>/repo-e

$ realpath <root-fixtures>/legacy-external
<root-fixtures>/legacy-external

$ case "$(realpath <root-fixtures>/legacy-external)" in "$(realpath .)"/*) echo 'documented root: repository-local';; *) echo 'documented root: external, confirmation required';; esac
documented root: external, confirmation required

$ test -w . && echo 'repository-local root technical availability: writable'
repository-local root technical availability: writable

$ test ! -e .worktrees && echo 'repository-local default root: absent and creatable'
repository-local default root: absent and creatable

$ test ! -e <root-fixtures>/legacy-external/feature-e && echo 'proposed external target: absent'
proposed external target: absent

$ git show-ref --verify --quiet refs/heads/feature-e && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain
worktree <root-fixtures>/repo-e
HEAD bf9b8e1e147ef65590fca9793b634a2486d5c702
branch refs/heads/main

$ git status -sb
## main
```

Exact stop question:

> `AGENTS.md` proposes the external target `<root-fixtures>/legacy-external/feature-e`, but no technical reason prevents the repository-local default `<root-fixtures>/repo-e/.worktrees/feature-e`. The external path will also sit outside the repository tree and must be opened directly for review. Do you explicitly confirm use of `<root-fixtures>/legacy-external/feature-e`, or should I use the repository-local default?

No branch or linked worktree was created. Review command is unavailable until the operator chooses the location.

## Case F

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/repo-f

$ if test -d .worktrees; then echo '.worktrees: present'; else echo '.worktrees: absent'; fi
.worktrees: absent

$ git check-ignore -v --no-index .worktrees/ || echo '.worktrees: not ignored'
.worktrees: not ignored

$ git worktree list --porcelain
worktree <root-fixtures>/repo-f
HEAD 69afb550da3ca46577d66dc8c430947e6792b816
branch refs/heads/main

$ realpath <root-fixtures>/shared-worktrees
<root-fixtures>/shared-worktrees

$ case "$(realpath <root-fixtures>/shared-worktrees)" in "$(realpath .)"/*) echo 'shared root: repository-local';; *) echo 'shared root: external and not selected';; esac
shared root: external and not selected
```

Root preparation:

```text
$ mkdir -p .worktrees

$ git check-ignore -v .worktrees/ || echo '.worktrees: not ignored; local ignore preparation required'
.worktrees: not ignored; local ignore preparation required

$ git status -sb
## main
?? .gitignore

$ git add .gitignore

$ git diff --cached --name-only
.gitignore

$ git diff --cached -- .gitignore
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..619397d
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1 @@
+/.worktrees/

$ git commit -m 'chore: ignore local worktrees'
[main f7fb231] chore: ignore local worktrees
 1 file changed, 1 insertion(+)
 create mode 100644 .gitignore

$ git check-ignore -v .worktrees/
.gitignore:1:/.worktrees/	.worktrees/

$ git status -sb
## main
```

Creation:

```text
$ git show-ref --verify --quiet refs/heads/feature-f && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '.worktrees/feature-f' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
f7fb2315689524d7ba0f6e229ac2e921abfb6b9f

$ git worktree add .worktrees/feature-f -b feature-f main
Preparing worktree (new branch 'feature-f')
HEAD is now at f7fb231 chore: ignore local worktrees
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/repo-f
HEAD f7fb2315689524d7ba0f6e229ac2e921abfb6b9f
branch refs/heads/main

worktree <root-fixtures>/repo-f/.worktrees/feature-f
HEAD f7fb2315689524d7ba0f6e229ac2e921abfb6b9f
branch refs/heads/feature-f

$ git branch --show-current
feature-f

$ git rev-parse HEAD
f7fb2315689524d7ba0f6e229ac2e921abfb6b9f

$ git status -sb
## feature-f
```

Review command:

```text
code --new-window <root-fixtures>/repo-f/.worktrees/feature-f
```

Constraint: the mere existence of `<root-fixtures>/shared-worktrees` did not authorize an external root. The repository-local default required one isolated ignore commit.

## Case G

Initial state:

```text
$ git rev-parse --show-toplevel
<root-fixtures>/generic-ledger

$ basename "$(git rev-parse --show-toplevel)"
generic-ledger

$ if test -d .worktrees; then echo '.worktrees: present'; else echo '.worktrees: absent'; fi
.worktrees: absent

$ git check-ignore -v --no-index .worktrees/ || echo '.worktrees: not ignored'
.worktrees: not ignored

$ git worktree list --porcelain
worktree <root-fixtures>/generic-ledger
HEAD eea2ef9fa25732c9d3f5a9b3bd455d03615ce7ad
branch refs/heads/main
```

Root preparation:

```text
$ mkdir -p .worktrees

$ git check-ignore -v .worktrees/ || echo '.worktrees: not ignored; local ignore preparation required'
.worktrees: not ignored; local ignore preparation required

$ git status -sb
## main
?? .gitignore

$ git add .gitignore

$ git diff --cached --name-only
.gitignore

$ git diff --cached -- .gitignore
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..619397d
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1 @@
+/.worktrees/

$ git commit -m 'chore: ignore local worktrees'
[main c6546ab] chore: ignore local worktrees
 1 file changed, 1 insertion(+)
 create mode 100644 .gitignore

$ git check-ignore -v .worktrees/
.gitignore:1:/.worktrees/	.worktrees/
```

Creation:

```text
$ git show-ref --verify --quiet refs/heads/feature-g && echo 'branch: exists' || echo 'branch: absent'
branch: absent

$ git worktree list --porcelain | grep -F '.worktrees/feature-g' || echo 'target registration: absent'
target registration: absent

$ git rev-parse main
c6546ab0db3fb18a8699abd4039326436b3471cf

$ git worktree add .worktrees/feature-g -b feature-g main
Preparing worktree (new branch 'feature-g')
HEAD is now at c6546ab chore: ignore local worktrees
```

Final state:

```text
$ git worktree list --porcelain
worktree <root-fixtures>/generic-ledger
HEAD c6546ab0db3fb18a8699abd4039326436b3471cf
branch refs/heads/main

worktree <root-fixtures>/generic-ledger/.worktrees/feature-g
HEAD c6546ab0db3fb18a8699abd4039326436b3471cf
branch refs/heads/feature-g

$ git branch --show-current
feature-g

$ git rev-parse HEAD
c6546ab0db3fb18a8699abd4039326436b3471cf

$ git status -sb
## feature-g
```

Review command:

```text
code --new-window <root-fixtures>/generic-ledger/.worktrees/feature-g
```

Constraint: repository naming supplied no worktree policy. The portable repository-local default was used without project-specific assumptions.

### Ignore and selective commit prompt

> Use the `git-engineer` skill from `<active-snapshot-root>` to handle two independent real operator tasks in disposable Git repositories only under `<ignore-fixtures>`; do not inspect or modify `<author-repository>`, and do not read supporting `docs/*`. Configure a local test Git identity. Preserve exact before/after Git commands and outputs needed to reconstruct each case, and return your raw per-case handoff without referring to testing or an expected result. Case A: create task worktree `feature-ignore` in a repo where `.worktrees/` does not exist and is not ignored. Case B: create task worktree `feature-dirty` in a repo where `.worktrees/` is not ignored and the main checkout has an unrelated modified tracked file plus an unrelated untracked file. For every case report initial status/ignore/registration, the exact staged file list and staged diff for any preparatory commit, commit identity, final registration/path/branch/HEAD/status/review command, preserved unrelated state, and limitations.

# Blind-run output with path-only normalization

Only the fixture-root prefix was normalized after the blind run.

Case A — `feature-ignore`

Repository: `<ignore-fixtures>/case-a`

Local identity:

```text
$ git config user.name 'Disposable Operator'
$ git config user.email 'operator@example.invalid'
```

Initial repository commit:

```text
$ git commit -m 'chore: initialize disposable repository'
[main (root-commit) 8f05c10] chore: initialize disposable repository
 1 file changed, 3 insertions(+)
 create mode 100644 README.md
```

Initial state:

```text
$ git status -sb
## main

$ git check-ignore -v .worktrees
[exit 1; no output]

$ git worktree list --porcelain
worktree <ignore-fixtures>/case-a
HEAD 8f05c10f0132cb43877b2fae7c2c9e5361e10c2f
branch refs/heads/main

$ test -e .worktrees
[exit 1; directory absent]
```

Ignore preparation:

```text
$ mkdir .worktrees

$ git check-ignore -v .worktrees
[exit 1; no output]

$ git add .gitignore

$ git diff --cached --name-only
.gitignore

$ git diff --cached -- .gitignore
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..619397d
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1 @@
+/.worktrees/

$ git commit -m 'chore: ignore repository-local worktrees'
[main 8e87b29] chore: ignore repository-local worktrees
 1 file changed, 1 insertion(+)
 create mode 100644 .gitignore

$ git check-ignore -v .worktrees
.gitignore:1:/.worktrees/	.worktrees
```

Preparatory commit identity:

```text
$ git show -s --format=fuller HEAD
commit 8e87b29ab38fd0a684c1a399b79dc025cc350f43
Author:     Disposable Operator <operator@example.invalid>
AuthorDate: Mon Jul 13 14:42:38 2026 +0200
Commit:     Disposable Operator <operator@example.invalid>
CommitDate: Mon Jul 13 14:42:38 2026 +0200

    chore: ignore repository-local worktrees
```

Base state:

```text
$ git branch --show-current
main

$ git rev-parse HEAD
8e87b29ab38fd0a684c1a399b79dc025cc350f43

$ git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
fatal: no upstream configured for branch 'main'
[exit 128]
```

Creation:

```text
$ git worktree add .worktrees/feature-ignore -b feature-ignore main
Preparing worktree (new branch 'feature-ignore')
HEAD is now at 8e87b29 chore: ignore repository-local worktrees
```

Final evidence:

```text
$ git rev-parse --show-toplevel
<ignore-fixtures>/case-a

$ realpath .worktrees/feature-ignore
<ignore-fixtures>/case-a/.worktrees/feature-ignore

$ git worktree list --porcelain
worktree <ignore-fixtures>/case-a
HEAD 8e87b29ab38fd0a684c1a399b79dc025cc350f43
branch refs/heads/main

worktree <ignore-fixtures>/case-a/.worktrees/feature-ignore
HEAD 8e87b29ab38fd0a684c1a399b79dc025cc350f43
branch refs/heads/feature-ignore

$ git branch --show-current
feature-ignore

$ git rev-parse HEAD
8e87b29ab38fd0a684c1a399b79dc025cc350f43

$ git status -sb
## feature-ignore
```

Main checkout:

```text
$ git status -sb
## main
```

Review command:

```text
code --new-window <ignore-fixtures>/case-a/.worktrees/feature-ignore
```

Preserved unrelated state: none existed. Limitation: the disposable repository has no remote or upstream; branch publication, merge, push, and downstream delivery are outside this operation.

Case B — `feature-dirty`

Repository: `<ignore-fixtures>/case-b`

Local identity:

```text
$ git config user.name 'Disposable Operator'
$ git config user.email 'operator@example.invalid'
```

Initial repository commit:

```text
$ git commit -m 'chore: initialize disposable repository'
[main (root-commit) 7111a37] chore: initialize disposable repository
 2 files changed, 4 insertions(+)
 create mode 100644 README.md
 create mode 100644 operator-notes.txt
```

Initial state:

```text
$ git status -sb
## main
 M operator-notes.txt
?? operator-scratch.txt

$ git check-ignore -v .worktrees
[exit 1; no output]

$ git worktree list --porcelain
worktree <ignore-fixtures>/case-b
HEAD 7111a3712e4d092601bd427232ad74dcaf279350
branch refs/heads/main

$ test -e .worktrees
[exit 1; directory absent]
```

Initial unrelated tracked diff:

```text
$ git diff -- operator-notes.txt
diff --git a/operator-notes.txt b/operator-notes.txt
index 2802e60..c112578 100644
--- a/operator-notes.txt
+++ b/operator-notes.txt
@@ -1 +1,2 @@
 baseline operator note
+unrelated local edit
```

Initial unrelated file fingerprints:

```text
$ git hash-object operator-notes.txt operator-scratch.txt
c112578da7837454f577e2274964c2543ffcf431
2b68b4e6db3bd9963fc6ee460dd4c045ffe56475
```

Ignore preparation:

```text
$ mkdir .worktrees

$ git check-ignore -v .worktrees
[exit 1; no output]

$ git add .gitignore

$ git diff --cached --name-only
.gitignore

$ git diff --cached -- .gitignore
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..619397d
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1 @@
+/.worktrees/

$ git status -sb
## main
A  .gitignore
 M operator-notes.txt
?? operator-scratch.txt

$ git commit -m 'chore: ignore repository-local worktrees'
[main 123ce7c] chore: ignore repository-local worktrees
 1 file changed, 1 insertion(+)
 create mode 100644 .gitignore

$ git check-ignore -v .worktrees
.gitignore:1:/.worktrees/	.worktrees
```

Preparatory commit identity:

```text
$ git show -s --format=fuller HEAD
commit 123ce7ca0650cea85de8161e32056666bb9884a1
Author:     Disposable Operator <operator@example.invalid>
AuthorDate: Mon Jul 13 14:44:00 2026 +0200
Commit:     Disposable Operator <operator@example.invalid>
CommitDate: Mon Jul 13 14:44:00 2026 +0200

    chore: ignore repository-local worktrees
```

Post-commit unrelated state:

```text
$ git status -sb
## main
 M operator-notes.txt
?? operator-scratch.txt

$ git diff -- operator-notes.txt
diff --git a/operator-notes.txt b/operator-notes.txt
index 2802e60..c112578 100644
--- a/operator-notes.txt
+++ b/operator-notes.txt
@@ -1 +1,2 @@
 baseline operator note
+unrelated local edit

$ git hash-object operator-notes.txt operator-scratch.txt
c112578da7837454f577e2274964c2543ffcf431
2b68b4e6db3bd9963fc6ee460dd4c045ffe56475
```

Base state:

```text
$ git branch --show-current
main

$ git rev-parse HEAD
123ce7ca0650cea85de8161e32056666bb9884a1

$ git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
fatal: no upstream configured for branch 'main'
[exit 128]
```

Creation:

```text
$ git worktree add .worktrees/feature-dirty -b feature-dirty main
Preparing worktree (new branch 'feature-dirty')
HEAD is now at 123ce7c chore: ignore repository-local worktrees
```

Final evidence:

```text
$ git rev-parse --show-toplevel
<ignore-fixtures>/case-b

$ realpath .worktrees/feature-dirty
<ignore-fixtures>/case-b/.worktrees/feature-dirty

$ git worktree list --porcelain
worktree <ignore-fixtures>/case-b
HEAD 123ce7ca0650cea85de8161e32056666bb9884a1
branch refs/heads/main

worktree <ignore-fixtures>/case-b/.worktrees/feature-dirty
HEAD 123ce7ca0650cea85de8161e32056666bb9884a1
branch refs/heads/feature-dirty

$ git branch --show-current
feature-dirty

$ git rev-parse HEAD
123ce7ca0650cea85de8161e32056666bb9884a1

$ git status -sb
## feature-dirty
```

Final main-checkout state:

```text
$ git status -sb
## main
 M operator-notes.txt
?? operator-scratch.txt

$ git hash-object operator-notes.txt operator-scratch.txt
c112578da7837454f577e2274964c2543ffcf431
2b68b4e6db3bd9963fc6ee460dd4c045ffe56475
```

Review command:

```text
code --new-window <ignore-fixtures>/case-b/.worktrees/feature-dirty
```

Preserved unrelated state: the modified tracked file and untracked file remain only in the main checkout, unstaged, with unchanged fingerprints. The new worktree is clean. Limitation: the disposable repository has no remote or upstream; its base commit is local, and no publication, merge, push, or downstream delivery occurred.

### Move prompt

> Use the `git-engineer` skill from `<active-snapshot-root>` to handle three independent worktree relocation requests. Build disposable Git fixtures only under `<move-fixtures>`; do not inspect or modify `<author-repository>`, and do not read supporting `docs/*`. Configure local test Git identity. Preserve exact before/after Git commands and outputs needed to reconstruct each case, and return your raw per-case handoff or stop response without referring to testing or an expected result. Each repo must start with an external linked worktree. Case A: a clean linked worktree contains an ignored operator-owned file and a symlink; the operator asks to move it into the repo-local default root. Case B: the linked worktree has staged, unstaged, and untracked changes; the operator asks to move it but gives no explicit decision about dirty state. Case C: the requested repo-local target path already exists and contains a sentinel file. For every case report initial and final `git worktree list --porcelain`, branch, HEAD, status/diff/ignored/symlink evidence, exact actions or stop question, where any private comparison evidence was held, its permissions, whether it created repo/worktree paths, its cleanup result on success or stop, and limitations. Do not use force or delete targets.

# Blind-run evidence: path-only normalization applied after the blind run

## Case A — move completed

Repository-local target: `<move-fixtures>/case-a/repo/.worktrees/feature-a`.

Initial evidence:

```text
$ git worktree list --porcelain
worktree <move-fixtures>/case-a/repo
HEAD 1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0
branch refs/heads/main

worktree <move-fixtures>/case-a/external
HEAD 1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0
branch refs/heads/feature/case-a

$ git -C <move-fixtures>/case-a/external branch --show-current
feature/case-a

$ git -C <move-fixtures>/case-a/external rev-parse HEAD
1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0

$ git -C <move-fixtures>/case-a/external status -sb
## feature/case-a

$ git -C <move-fixtures>/case-a/external status --porcelain=v1 --untracked-files=all --ignored=matching
!! .operator-link
!! .operator-secret

$ git -C <move-fixtures>/case-a/external diff --cached --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-a/external diff --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-a/external ls-files --others --exclude-standard
[no output]

$ git -C <move-fixtures>/case-a/external ls-files --others -i --exclude-standard
.operator-link
.operator-secret

$ find <move-fixtures>/case-a/external -type l -printf '%P -> %l\n'
.operator-link -> .operator-secret
```

Root preparation and action:

```text
$ git status -sb
## main

$ test ! -e <move-fixtures>/case-a/repo/.worktrees/feature-a
[exit 0]

$ mkdir -p <move-fixtures>/case-a/repo/.worktrees
[no output]

$ git check-ignore -v .worktrees/
.gitignore:1:.worktrees/	.worktrees/

$ git diff --cached --name-only
[no output]

$ git submodule status
[no output]

$ realpath <move-fixtures>/case-a/repo
<move-fixtures>/case-a/repo

$ realpath -m <move-fixtures>/case-a/repo/.worktrees/feature-a
<move-fixtures>/case-a/repo/.worktrees/feature-a

$ git worktree move <move-fixtures>/case-a/external <move-fixtures>/case-a/repo/.worktrees/feature-a
[exit 0; no output]
```

Final evidence:

```text
$ git worktree list --porcelain
worktree <move-fixtures>/case-a/repo
HEAD 1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0
branch refs/heads/main

worktree <move-fixtures>/case-a/repo/.worktrees/feature-a
HEAD 1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0
branch refs/heads/feature/case-a

$ test ! -e <move-fixtures>/case-a/external
[exit 0]

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a branch --show-current
feature/case-a

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a rev-parse HEAD
1b5f8f62aeb5ee08c3ab70e462adf8706b2a78b0

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a status -sb
## feature/case-a

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a status --porcelain=v1 --untracked-files=all --ignored=matching
!! .operator-link
!! .operator-secret

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a diff --cached --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a diff --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a ls-files --others --exclude-standard
[no output]

$ git -C <move-fixtures>/case-a/repo/.worktrees/feature-a ls-files --others -i --exclude-standard
.operator-link
.operator-secret

$ find <move-fixtures>/case-a/repo/.worktrees/feature-a -type l -printf '%P -> %l\n'
.operator-link -> .operator-secret
```

The private ignored-file fingerprint, file type/metadata, and symlink target were held only in process memory. Before/after values matched. No comparison file or directory was created, so filesystem permissions were not applicable and no file-backed artifact required cleanup.

Evidence capture created no repository or worktree paths. The operational move created `.worktrees/` and its linked-worktree destination only.

## Case B — stopped on dirty-state decision

Raw stop question:

> The linked worktree is dirty: `staged.txt` is staged, `unstaged.txt` is unstaged, and `untracked.txt` is untracked. Do you explicitly authorize moving this worktree with that state intact, or should it remain at its current path while you resolve the dirty state?

Initial evidence:

```text
$ git worktree list --porcelain
worktree <move-fixtures>/case-b/repo
HEAD 109b1e4b9964f38bd0dd45b30217a3eebf62de38
branch refs/heads/main

worktree <move-fixtures>/case-b/external
HEAD 109b1e4b9964f38bd0dd45b30217a3eebf62de38
branch refs/heads/feature/case-b

$ git -C <move-fixtures>/case-b/external branch --show-current
feature/case-b

$ git -C <move-fixtures>/case-b/external rev-parse HEAD
109b1e4b9964f38bd0dd45b30217a3eebf62de38

$ git -C <move-fixtures>/case-b/external status -sb
## feature/case-b

$ git -C <move-fixtures>/case-b/external status --porcelain=v1 --untracked-files=all --ignored=matching
M  staged.txt
 M unstaged.txt
?? untracked.txt

$ git diff --cached --name-status
M	staged.txt

$ git diff --cached --stat
 staged.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git diff --name-status
M	unstaged.txt

$ git diff --stat
 unstaged.txt | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git -C <move-fixtures>/case-b/external ls-files --others --exclude-standard
untracked.txt

$ git -C <move-fixtures>/case-b/external ls-files --others -i --exclude-standard
[no output]

$ find <move-fixtures>/case-b/external -type l -printf '%P -> %l\n'
tracked-link -> tracked-target.txt
```

No move command was issued. No stash, commit, reset, target deletion, or `--force` was used.

Final evidence:

```text
$ test ! -e <move-fixtures>/case-b/repo/.worktrees
[exit 0]

$ test ! -e <move-fixtures>/case-b/repo/.worktrees/feature-b
[exit 0]

$ git worktree list --porcelain
worktree <move-fixtures>/case-b/repo
HEAD 109b1e4b9964f38bd0dd45b30217a3eebf62de38
branch refs/heads/main

worktree <move-fixtures>/case-b/external
HEAD 109b1e4b9964f38bd0dd45b30217a3eebf62de38
branch refs/heads/feature/case-b

$ git -C <move-fixtures>/case-b/external branch --show-current
feature/case-b

$ git -C <move-fixtures>/case-b/external rev-parse HEAD
109b1e4b9964f38bd0dd45b30217a3eebf62de38

$ git -C <move-fixtures>/case-b/external status -sb
## feature/case-b

$ git -C <move-fixtures>/case-b/external status --porcelain=v1 --untracked-files=all --ignored=matching
M  staged.txt
 M unstaged.txt
?? untracked.txt

$ git diff --cached --name-status
M	staged.txt

$ git diff --name-status
M	unstaged.txt

$ git -C <move-fixtures>/case-b/external ls-files --others --exclude-standard
untracked.txt

$ git -C <move-fixtures>/case-b/external ls-files --others -i --exclude-standard
[no output]

$ find <move-fixtures>/case-b/external -type l -printf '%P -> %l\n'
tracked-link -> tracked-target.txt
```

The complete staged/unstaged diffs and fingerprints for dirty paths and the symlink were held only in process memory. No comparison file or directory was created; permissions were therefore not applicable. Stop cleanup left no file-backed evidence and created no repository, source-worktree, or destination path.

## Case C — stopped because target exists

Raw stop response:

> The requested repository-local target `<move-fixtures>/case-c/repo/.worktrees/feature-c` already exists and contains `SENTINEL.txt`. I will not delete or overwrite it and will not use `--force`. Please choose a different empty repository-local target or explicitly resolve ownership of the existing directory first.

Initial evidence:

```text
$ git worktree list --porcelain
worktree <move-fixtures>/case-c/repo
HEAD 601e5cc9bc9721b7beac0f61a28fa9b966c62b4f
branch refs/heads/main

worktree <move-fixtures>/case-c/external
HEAD 601e5cc9bc9721b7beac0f61a28fa9b966c62b4f
branch refs/heads/feature/case-c

$ git -C <move-fixtures>/case-c/external branch --show-current
feature/case-c

$ git -C <move-fixtures>/case-c/external rev-parse HEAD
601e5cc9bc9721b7beac0f61a28fa9b966c62b4f

$ git -C <move-fixtures>/case-c/external status -sb
## feature/case-c

$ git -C <move-fixtures>/case-c/external status --porcelain=v1 --untracked-files=all --ignored=matching
[no output]

$ git -C <move-fixtures>/case-c/external diff --cached --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-c/external diff --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-c/external ls-files --others --exclude-standard
[no output]

$ git -C <move-fixtures>/case-c/external ls-files --others -i --exclude-standard
[no output]

$ find <move-fixtures>/case-c/external -type l -printf '%P -> %l\n'
tracked-link -> tracked.txt

$ test -e <move-fixtures>/case-c/repo/.worktrees/feature-c
[exit 0]

$ test -f <move-fixtures>/case-c/repo/.worktrees/feature-c/SENTINEL.txt
[exit 0]

$ find <move-fixtures>/case-c/repo/.worktrees/feature-c -maxdepth 1 -mindepth 1 -printf '%f\n'
SENTINEL.txt

$ git check-ignore -v .worktrees/feature-c/SENTINEL.txt
.gitignore:1:.worktrees/	.worktrees/feature-c/SENTINEL.txt
```

No move or target-mutation command was issued.

Final evidence:

```text
$ git worktree list --porcelain
worktree <move-fixtures>/case-c/repo
HEAD 601e5cc9bc9721b7beac0f61a28fa9b966c62b4f
branch refs/heads/main

worktree <move-fixtures>/case-c/external
HEAD 601e5cc9bc9721b7beac0f61a28fa9b966c62b4f
branch refs/heads/feature/case-c

$ git -C <move-fixtures>/case-c/external branch --show-current
feature/case-c

$ git -C <move-fixtures>/case-c/external rev-parse HEAD
601e5cc9bc9721b7beac0f61a28fa9b966c62b4f

$ git -C <move-fixtures>/case-c/external status -sb
## feature/case-c

$ git -C <move-fixtures>/case-c/external status --porcelain=v1 --untracked-files=all --ignored=matching
[no output]

$ git -C <move-fixtures>/case-c/external diff --cached --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-c/external diff --no-ext-diff --binary
[no output]

$ git -C <move-fixtures>/case-c/external ls-files --others --exclude-standard
[no output]

$ git -C <move-fixtures>/case-c/external ls-files --others -i --exclude-standard
[no output]

$ find <move-fixtures>/case-c/external -type l -printf '%P -> %l\n'
tracked-link -> tracked.txt

$ test -e <move-fixtures>/case-c/repo/.worktrees/feature-c
[exit 0]

$ test -f <move-fixtures>/case-c/repo/.worktrees/feature-c/SENTINEL.txt
[exit 0]

$ find <move-fixtures>/case-c/repo/.worktrees/feature-c -maxdepth 1 -mindepth 1 -printf '%f\n'
SENTINEL.txt
```

The symlink and sentinel fingerprints were held only in process memory and remained unchanged. No comparison file or directory was created; permissions were not applicable. Stop cleanup left no file-backed evidence and created no repository/worktree paths. The target and sentinel predated the stop decision and remain intact.

For all cases, `fuser -v <source>` was repeated from `<temporary-root>` so the inspection process did not hold the worktree as its cwd. It returned exit `1` with no matching path users, while also emitting sandbox-level `Cannot open a network socket` warnings. This is limited observable-process evidence; it cannot prove that an unobservable editor task or external agent is absent. No force operation or target deletion was performed.

## Fixture manifests and commands

The raw results above preserve the initial and final manifests and the executed commands for every case. Stateful anchors include:

- root cases: initial policy files, root existence, ignore source, branch/upstream, registration, creation command, final branch/HEAD/status, and review command;
- ignore cases: initial dirty state, exact staged file list and `.gitignore` diff, preparatory commit identity, post-commit ignore source, final registration, and preserved unrelated fingerprints;
- move cases: pre/post registration, branch, HEAD, staged/unstaged/untracked/ignored state, diff summaries, ignored-file and symlink evidence, destination state, executed move or exact stop response, evidence-storage boundary, and cleanup result.

Fixture roots are intentionally disposable and excluded from the portable skill. The normalized transcripts contain all required setup state and commands to recreate equivalent repositories under any writable temporary root.

## Results

| # | Case | Result | Evidence limit |
| --- | --- | --- | --- |
| 1 | No policy | PASS | Local repo without remote/CI |
| 2 | Existing ignored root | PASS | One tracked-ignore fixture |
| 3 | Absent ignored root | PASS | One default-root fixture |
| 4 | Unignored root | PASS | Local Conventional Commit identity |
| 5 | Explicit external root | PASS | Editor visibility inferred from path boundary |
| 6 | Legacy external policy | PASS | One repository policy artifact |
| 7 | Existing shared external root | PASS | No competing owner simulated |
| 8 | Clean move | PASS | Process visibility best-effort; ACL/xattr not assessed |
| 9 | Dirty move | PASS | Operator-approved dirty move not exercised |
| 10 | Existing target | PASS | Locks/submodules not exercised |
| 11 | Dirty main checkout | PASS | Unrelated state was unstaged |
| 12 | Generic repository | PASS | One generic repository name |

Aggregate: 12 PASS, 0 FAIL, 0 INCONCLUSIVE. These samples support the stated decision contract but do not prove universal agent behavior or runtime enforcement.
