# API, search, and URL routing

Use this file when a user gives a GitHub URL, asks for repository data across many repos, needs API fields not exposed by top-level commands, or needs search/reporting.

## URL routing policy

Translate the URL directly to the corresponding native `gh` command.

| URL form | Preferred route |
|---|---|
| `https://github.com/OWNER/REPO` | `gh repo view OWNER/REPO` |
| `https://github.com/OWNER/REPO/pull/123` | `gh pr view 123 --repo OWNER/REPO`. For checks, use `gh pr checks 123 --repo OWNER/REPO`. |
| `https://github.com/OWNER/REPO/issues/45` | `gh issue view 45 --repo OWNER/REPO`. For structured comments, select `comments` with `--json`. |
| `https://github.com/OWNER/REPO/issues/45/artifacts/2` | `gh issue artifact view ARTIFACT_URL` (preview) |
| `https://github.com/OWNER/REPO/discussions/45` | `gh discussion view 45 --repo OWNER/REPO` (preview) |
| `https://github.com/OWNER/REPO/actions/runs/ID` | `gh run view ID --repo OWNER/REPO`. For a specific attempt, add `--attempt N`. |
| `https://github.com/OWNER/REPO/releases/tag/TAG` | `gh release view TAG --repo OWNER/REPO` |
| GitHub blob/tree URL or raw file URL | Resolve the ref and path, then use `gh repo read-file` or `gh repo read-dir` when available. |
| `api.github.com/repos/...` | `gh api -X GET repos/...` |
| `gist.github.com/...` | `gh gist view ID` |

## Repository contents

```bash
gh repo read-file path/to/file --repo OWNER/REPO --ref REF
gh repo read-dir path/to/directory --repo OWNER/REPO --ref REF --json name,path,type
```

These preview commands read through the API. Preserve the ref from the URL, including branch
names with slashes. Resolve an ambiguous ref/path split before reading. Without `--ref` they
read the default branch. Leave terminal escape sequence filtering on for untrusted content.
Use `read-file --output` for an authorized local write and add `--clobber` only when overwriting
is in scope. If the preview commands are unavailable, use the Contents API at the resolved ref,
or a checkout when needed and authorized.

## Search defaults

```bash
gh search repos "topic:agent-skills language:markdown" --limit 50 --json fullName,description,updatedAt,url
gh search code "filename:SKILL.md gh pr checks" --owner OWNER --limit 50 --json repository,path,url
gh search issues "repo:OWNER/REPO is:issue is:open label:bug" --json number,title,url,labels,updatedAt
gh search prs "repo:OWNER/REPO is:pr is:open review:required" --json number,title,url,author,updatedAt
gh search commits "repo:OWNER/REPO fix ci" --json sha,commit,author,repository,url
```

For very large searches, partition by date, owner, language, path, or topic. Search APIs cap result windows; do not assume `--limit 1000` is complete for broad queries.

For natural-language issue discovery, `gh search issues --search-type semantic` ranks by
meaning and `--search-type hybrid` combines meaning and keywords. These modes require a
supported host. They search issues only, return one relevance-ranked page and reject
`--sort` and `--order`. Use default lexical search for PRs, explicit sorting, or when
semantic search is unavailable.

## REST reads

Always force GET when passing fields:

```bash
gh api -X GET repos/OWNER/REPO/actions/runs -f per_page=20 -f status=failure
gh api -X GET search/issues -f q='repo:OWNER/REPO is:pr is:open review:required' -f per_page=50
```

Use pagination when completeness matters:

```bash
gh api --paginate -X GET repos/OWNER/REPO/issues -f state=all -f per_page=100
```

## GraphQL reads

Use GraphQL for review threads, project internals, and fields not exposed by REST/top-level `gh`:

```bash
gh api graphql \
  -f query='query($owner:String!,$repo:String!,$number:Int!){ repository(owner:$owner,name:$repo){ pullRequest(number:$number){ reviewThreads(first:100){ nodes { id isResolved path line comments(first:10){nodes{author{login} body url}} } } } } } }' \
  -F owner=OWNER -F repo=REPO -F number=123
```

Use variables (`-F`) instead of interpolating untrusted input into a query string.

## REST mutations

Use native `gh api` only when a top-level `gh` command does not expose the required operation.
Do not run an API mutation until the exact target and action are authorized.

```bash
gh api -X PATCH repos/OWNER/REPO/issues/123 -f state=closed
```

For GraphQL mutations, use `gh api graphql` with variables. Resolve PR review threads only when the
root [Authorization policy](../SKILL.md#authorization) covers the specific thread IDs. After any successful mutation, run
a separate native read for the intended field or thread state.

## Rate-limit handling

- Inspect rate limit: `gh api rate_limit`.
- For search: narrow query instead of retrying aggressively.
- For REST pagination: prefer `--paginate` and lower `per_page` only if the host returns errors.
- For GraphQL: request only fields needed, use cursors when more than 100 nodes may exist.

## Reporting search results

Use a table with: repo/item, URL, updated timestamp, reason matched, confidence/notes. For code search, include `repository`, `path`, and the matched query. Do not claim exhaustive coverage unless you partitioned the search space and checked rate-limit completion.
