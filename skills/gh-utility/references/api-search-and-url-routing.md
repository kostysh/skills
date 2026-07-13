# API, search, and URL routing

Use this file when a user gives a GitHub URL, asks for repository data across many repos, needs API fields not exposed by top-level commands, or needs search/reporting.

## URL routing policy

Translate the URL directly to the corresponding native `gh` command.

| URL form | Preferred route |
|---|---|
| `https://github.com/OWNER/REPO` | `gh repo view OWNER/REPO` |
| `https://github.com/OWNER/REPO/pull/123` | `gh pr view 123 --repo OWNER/REPO`; `gh pr checks 123` |
| `https://github.com/OWNER/REPO/issues/45` | `gh issue view 45 --repo OWNER/REPO --comments` |
| `https://github.com/OWNER/REPO/actions/runs/ID` | `gh run view ID --repo OWNER/REPO --log-failed` |
| `https://github.com/OWNER/REPO/releases/tag/TAG` | `gh release view TAG --repo OWNER/REPO` |
| GitHub blob/tree URL or raw file URL | shallow clone with `gh repo clone`, then local read |
| `api.github.com/repos/...` | `gh api -X GET repos/...` |
| `gist.github.com/...` | `gh gist view ID` |

Do not use `gh api repos/OWNER/REPO/contents/PATH` and base64 decoding as the default file read path. Shallow clone is usually simpler, authenticated, and preserves filenames/modes.

## Search defaults

```bash
gh search repos "topic:agent-skills language:markdown" --limit 50 --json fullName,description,updatedAt,url
gh search code "filename:SKILL.md gh pr checks" --owner OWNER --limit 50 --json repository,path,url
gh search issues "repo:OWNER/REPO is:issue is:open label:bug" --json number,title,url,labels,updatedAt
gh search prs "repo:OWNER/REPO is:pr is:open review:required" --json number,title,url,author,updatedAt
gh search commits "repo:OWNER/REPO fix ci" --json sha,commit,author,repository,url
```

For very large searches, partition by date, owner, language, path, or topic. Search APIs cap result windows; do not assume `--limit 1000` is complete for broad queries.

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
current request explicitly authorizes the specific thread IDs. After any successful mutation, run
a separate native read for the intended field or thread state.

## Rate-limit handling

- Inspect rate limit: `gh api rate_limit`.
- For search: narrow query instead of retrying aggressively.
- For REST pagination: prefer `--paginate` and lower `per_page` only if the host returns errors.
- For GraphQL: request only fields needed, use cursors when more than 100 nodes may exist.

## Reporting search results

Use a table with: repo/item, URL, updated timestamp, reason matched, confidence/notes. For code search, include `repository`, `path`, and the matched query. Do not claim exhaustive coverage unless you partitioned the search space and checked rate-limit completion.
