# Service-backed CLIs

Use this reference when the CLI wraps an API, admin service, browser-derived workflow, or another external system that future agent threads should operate safely by command name.

## Preflight

Before scaffolding:

- name the binary the agent will actually invoke
- identify the source material: OpenAPI, SDK docs, curl examples, browser workflow, existing script, or admin tool
- name the first concrete jobs in user language, for example `list drafts`, `download failed job logs`, or `search messages`

For installable CLIs, check whether the proposed command already exists:

```bash
command -v <tool-name> || true
```

If the name is already taken, pick a clearer binary name before you scaffold the package and docs around it.

## Command taxonomy

For service-backed CLIs, prefer an explicit family of commands:

- `tool-name --help` for discovery
- `tool-name --json doctor` for health, config, auth source, version, and missing setup
- optional `tool-name init ...` when local config is less painful than env-only setup
- discovery commands that list accounts, workspaces, queues, channels, projects, or similar containers
- resolve commands that turn names, slugs, URLs, or permalinks into stable IDs
- read commands that fetch exact objects and bounded lists/searches
- narrow write commands that each do one named action, ideally with `--dry-run`, `preview`, or draft-first behavior where supported
- one clearly named raw escape hatch such as `request` or `api` when low-level access is genuinely needed

Do not expose only a generic `request` command. Give agents high-level verbs for the repeated jobs.

Service-backed write commands that mutate external systems are protected commands. Define their per-action option allowlist and reject unknown, removed, or prohibited legacy flags before calling the service or executor. Deprecated-but-supported aliases may remain only as explicit aliases with warning, migration, and test coverage.

## Auth and config

For secrets and tokens, prefer the boring path first:

1. environment variables with the provider's standard name when one exists
2. documented user config for normal usage
3. explicit token flags only for one-off tests

`doctor --json` should report:

- whether auth is present
- the auth source category, for example `env`, `config`, `flag`, provider default, or `missing`
- what setup step is missing

Never print full tokens or secret values.

If the source material comes from DevTools or copied curl requests, create sanitized endpoint notes before implementing:

- method and path
- required headers
- auth mechanism and CSRF behavior
- request body shape
- response identifiers and pagination fields
- representative redacted response

Never commit cookies, bearer tokens, or production payloads.

## Installability

If the CLI is meant to run from any repository, the install path is part of the contract.

Minimum checks:

- `package.json#bin` points to the real built runtime entry
- install instructions are explicit
- the command works outside the source directory

Smoke test from another working directory such as `/tmp` or an unrelated repo:

```bash
command -v <tool-name>
<tool-name> --help
<tool-name> --json doctor
```

Do not treat `pnpm exec`, `npm run`, or source-mode wrappers as proof that the installed CLI contract works.
