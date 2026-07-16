# CLI Testing And Release

Read this reference when changing CLI tests, the Vite artifact contract, installability, release readiness, or an explicitly authorized publication.

Current upstream evidence should come from the official [Node.js release table](https://nodejs.org/en/about/previous-releases), [Node.js TypeScript contract](https://nodejs.org/dist/latest/docs/api/typescript.html), [Vite build options](https://vite.dev/config/build-options.html), and [npm trusted-publishing guidance](https://docs.npmjs.com/trusted-publishers/). These links are optional provenance; the local behavioral contract below remains usable offline.

## Language, runtime, and runner baseline

For new CLI test surfaces and when replacing test tooling:

- use TypeScript for runtime code and tests
- use `node:test` as the test runner
- resolve the current Active LTS Node.js line from official Node.js sources before setting `engines`, CI, or test commands
- use the native type-stripping behavior supported by that Active LTS; do not preserve obsolete experimental flags by memory
- run an explicit TypeScript typecheck because native stripping does not type-check
- keep directly executed test files and helpers within Node's supported erasable TypeScript profile and independent of `tsconfig`-only runtime transforms such as `paths`
- never add or invoke `tsx`; rewrite incompatible test helpers to erasable TypeScript or execute Vite-built JavaScript
- use Vitest only when the user or an authoritative project contract explicitly requires it

Use a portable package script such as `node --test` when current Node discovery covers the repository layout. If explicit paths are required, avoid shell-only glob assumptions and verify the script on every claimed platform.

## Test pyramid

### Unit tests

Unit tests are mandatory. Test use cases, domain rules, error mapping, option validation, parsers, and pure formatters without real processes or networks.

### Process integration tests

Execute the CLI as a real process and assert:

- exit status
- `stdout`
- `stderr`
- filesystem and persistence effects
- environment, locale, color, CI, TTY, timeout, and interruption behavior when relevant

Use isolated environment variables and platform-appropriate temporary directories. Keep black-box process assertions independent of parser internals.

### Public contract tests

Cover the interfaces users and automation depend on:

- `--help` and command-local help
- `--version` / `-V`
- missing-required-input behavior
- `--json` schemas and `--plain` when supported
- stable exit-code mappings
- stdout/stderr separation
- non-interactive behavior
- deprecation warnings and migration behavior
- completion output when the CLI exposes completion

Snapshot only stable public surfaces, not incidental debug text.

### Protected command tests

For deploy, rollback, release, infrastructure, subprocess, network, filesystem, persistence, or other protected actions, prove:

- unknown options fail
- removed or prohibited legacy options fail
- supported deprecated aliases warn and map explicitly
- service, executor, subprocess, network, filesystem, and persistence dependencies are not invoked after validation failure

Validation must fail before the protected side-effect boundary.

## Interactive and TUI testing

Test both interactive and automation paths:

- prompts appear only with suitable TTY input
- `--no-input`, `--yes`, or an equivalent bypass works
- Ctrl-C and abort paths terminate predictably
- progress, color, and full-screen rendering degrade safely in CI and non-TTY environments
- secret prompts do not echo input

Framework helpers may reduce rendering boilerplate, but they do not replace process-level coverage of the real entrypoint.

## Quality gate

If the target repository lacks an equivalent gate, add package scripts for:

1. typecheck
2. format check
3. lint
4. `node:test` unit, integration, and contract coverage
5. Vite build
6. built-artifact smoke
7. packed and installed-command verification for durable CLIs

Expose at least `typecheck`, `format`, `format:check`, `lint`, `lint:fix`, and `test`. Preserve narrower formatter/linter scripts when the repository uses split tooling.

The gate is necessary evidence, not sufficient proof of the user job. Do not call the CLI `verified` merely because these commands are green.

## Vite artifact verification

For new CLI builds, Vite is the standard bundler. Verify the installed Vite major and current official configuration surface before authoring config.

The build must preserve:

- an explicit Node-oriented entry and target matching the current Active LTS baseline
- executable startup and shebang behavior
- deliberate externalization of Node built-ins, native addons, plugin hosts, and dynamic runtime integrations
- package assets and runtime-relative paths
- sourcemaps unless the distribution contract forbids them
- an output path that matches `package.json#bin` and `package.json#files`

If an existing project uses another build and migration is outside the request, verify its actual artifact without introducing a second bundler. Report the deviation from this skill's standard; do not claim Vite conformance.

## Installed-command evidence

For a CLI intended to work outside its source tree, build success and source-mode execution are insufficient.

1. Inspect the manifest identity, `bin`, `files`, `engines`, and version source.
2. Inspect `npm pack --dry-run`, then create the tarball when local writes are authorized.
3. Install that tarball into an isolated, platform-appropriate temporary project.
4. Resolve and invoke the exact installed bin without relying on the source checkout.
5. Run `--help`, `--version`, one representative success job, and one representative failure job.
6. Record exit status, stdout/stderr, side effects, runtime/platform, and cleanup result.

Use platform APIs or test-runner temp utilities rather than a universal `/tmp` path. On Windows, resolve the installed command with the applicable package-manager shim or `Get-Command`/`where.exe`; on POSIX, `command -v` may be used only as a platform-specific branch. The proof is execution of the exact installed bin, not the lookup utility itself.

## Representative job and service boundary

The strongest readiness claim must exercise a representative user job through the built or installed entrypoint.

For local-only CLIs, observe the intended file, process, or output result. For service-backed CLIs, use one of:

- the real intended service under authorized safe conditions
- an official sandbox or staging service
- an authoritative contract-conformant boundary that exercises request construction, auth/config selection, response handling, and observable job result

A parser test, help smoke, mocked adapter, stub response, or `doctor` command does not verify a real service job. Report mock/stub-only evidence as `partial` and name the unverified boundary.

## Packaging rules

For npm-distributed CLIs:

- define `bin`, preferably as an explicit command-name object
- keep `files` tight and publish only built runtime files and required assets
- set `engines.node` from the current Active LTS decision for new work, or from the authoritative supported-runtime contract for an existing project
- preserve the environment-based Node shebang through Vite output or a verified wrapper/post-build step
- expose `--version` from the package/release version source of truth
- document install and cleanup behavior
- verify the real bin path after packing and installation

Use Node SEA or other standalone distribution only when a real consumer requirement justifies the additional OS/architecture contract. Verify each shipped artifact independently.

## Release preparation versus publication

Release preparation may:

- run the quality gate
- build Vite artifacts
- inspect packed contents
- create and locally install a tarball
- verify version, changelog, deprecations, provenance configuration, and release notes
- report `release-ready` when all required local and boundary evidence passes

Release preparation does **not** authorize:

- `npm publish`
- registry, access, dist-tag, or trusted-publisher configuration changes
- Git commits, tags, pushes, or branch mutations
- GitHub releases or workflow changes

Route Git mutations to `git-engineer` and GitHub operations to `gh-utility`.

## Authorized npm publication

Before any registry write, require and freshly confirm:

- exact package name and package identity
- registry URL
- version
- dist-tag
- access/visibility
- release target and source revision
- credentials or trusted-publishing path
- explicit authorization for the exact publication

Prefer CI trusted publishing and provenance when the registry and repository support them. Stop if identity, target, version, access, authorization, or credentials are ambiguous.

After an authorized write:

1. read the exact package version and dist-tag from the target registry;
2. install that exact published version from the target registry in a clean temporary project;
3. execute the installed bin and representative smoke/job checks;
4. report observed registry state and command behavior separately from the requested mutation.

If the publish response is ambiguous, read the registry before retrying. Never retry a publication blindly.

## Evidence states

| State | Minimum evidence |
| --- | --- |
| `design/draft` | Decision-complete design or release proposal; no implementation claim |
| `implemented` | Authorized files changed; required verification incomplete or failing |
| `verified` | Representative job passes through the built or installed entrypoint and claimed boundary |
| `release-ready` | `verified` plus packed-content, clean-install, version, and release-contract checks |
| `published` | Authorized registry write plus fresh registry metadata and clean install of that exact version |
| `partial` | Some bounded evidence passed, but a claimed platform, install, service, or release boundary remains unverified |
| `blocked` | Required authority, target, source, compatibility, credential path, or safe verification is missing |

## Review checklist

- Does the test command use `node:test` and the current Active LTS-supported TypeScript path without `tsx`?
- Was the exact built and installed command executed outside the source tree?
- Did a representative success and failure job run, not only help/version?
- Are stdout/stderr, exit codes, non-TTY behavior, and protected fail-before-side-effects asserted?
- Is every claimed service or platform boundary actually exercised and named?
- Are release preparation and publication authority separated?
- Were packed contents inspected before publication and exact registry/install state read afterward?
- Does the final reported state match the strongest observed evidence?
