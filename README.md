# Skills

Focused workflows for AI coding agents: plan a feature, build it, review the
result, and maintain the project. Each skill includes instructions and the
references, scripts, or templates needed for its work.

Use the **`@kostysh/skills` CLI** to choose skills, install them for your agent
or a single project, and update them later.

[Browse the skills](skills/) · [CLI guide](cli/README.md) ·
[npm package](https://www.npmjs.com/package/@kostysh/skills) ·
[Skill releases](https://github.com/kostysh/skills/releases?q=skills-&expanded=true)

## Get started

Requires **Node.js 24 or later**. Run either command:

```sh
npx @kostysh/skills
```

```sh
pnpx @kostysh/skills
```

Choose **Install**, select skills, then choose an agent or **Custom path**.
Use the arrow keys to move, **Space** to toggle skills, and **Enter** to confirm.
Press **Ctrl-C** to cancel. The CLI shows the destination before installation.

To install skills only in your current project, choose **Custom path** and enter
a relative directory such as `.agents/skills` or `.claude/skills`.

## Find a skill

| Work | Skills |
| --- | --- |
| Requirements and planning | [prd-engineer](skills/prd-engineer/), [requirements-approval](skills/requirements-approval/), [architecture-engineer](skills/architecture-engineer/), [spec-engineer](skills/spec-engineer/), [delivery-planner](skills/delivery-planner/) |
| Application development | [typescript-engineer](skills/typescript-engineer/), [node-engineer](skills/node-engineer/), [hono-engineer](skills/hono-engineer/), [react-spa-engineer](skills/react-spa-engineer/), [react-components-engineer](skills/react-components-engineer/), [nextjs](skills/nextjs/), [shadcn](skills/shadcn/), [payload](skills/payload/), [payload-migration](skills/payload-migration/), [supabase-engineer](skills/supabase-engineer/), [financial-calculations-engineer](skills/financial-calculations-engineer/) |
| Design | [frontend-design](skills/frontend-design/), [pencil-dev](skills/pencil-dev/) |
| Tools and delivery | [cli-engineer](skills/cli-engineer/), [electron-engineer](skills/electron-engineer/), [git-engineer](skills/git-engineer/), [gh-utility](skills/gh-utility/), [docusaurus-repo](skills/docusaurus-repo/), [agent-browser](skills/agent-browser/) |
| Reviews | [code-reviewer](skills/code-reviewer/), [security-reviewer](skills/security-reviewer/), [web-ui-reviewer](skills/web-ui-reviewer/), [spec-conformance-reviewer](skills/spec-conformance-reviewer/), [concept-conformance-reviewer](skills/concept-conformance-reviewer/), [gdpr-compliance](skills/gdpr-compliance/) |
| Testing and maintenance | [typescript-test-engineer](skills/typescript-test-engineer/), [error-fixer](skills/error-fixer/), [implementation-discipline](skills/implementation-discipline/), [retrospective-analysis](skills/retrospective-analysis/) |
| Documentation and skills | [documentation](skills/documentation/), [skill-source-compiler](skills/skill-source-compiler/), [skill-reviewer](skills/skill-reviewer/) |

Open a skill to read its scope and prerequisites. Some workflows require tools
or connected services; the installer installs skill files, and you configure
those tools separately.

## Install from the command line

Install one or more skills for your agent:

```sh
npx @kostysh/skills install code-reviewer typescript-test-engineer --target codex
```

Install in the current project:

```sh
npx @kostysh/skills install code-reviewer --target custom --path .claude/skills
```

| Target | Default directory |
| --- | --- |
| `codex` | `~/.agents/skills` |
| `claude-code` | `~/.claude/skills` |
| `opencode` | `~/.config/opencode/skills` |
| `pi` | `~/.pi/agent/skills` |
| `universal` | Enter a path; the menu suggests `~/.agents/skills` |
| `custom` | Enter a path; the menu suggests `.agents/skills` in the current project |

`--path` overrides any preset. Non-interactive `custom` and `universal` installs
require it. Relative paths resolve from the directory where you run the CLI.

The CLI downloads the selected skills from a stable GitHub skills release and
checks their SHA-256 hashes. It installs runtime instructions and resources;
development docs, tests, and source bundles are excluded. The npm package
contains the installer; skills are downloaded when you select them.

## Keep skills up to date

```sh
npx @kostysh/skills update
```

This checks all installations recorded in `~/.kskills/setup.json`. It updates
skills with newer versions and restores missing managed skill directories.
If a skill's destination contains local changes or an unmanaged directory, the
CLI preserves it and reports a conflict. The [CLI guide](cli/README.md) covers
errors and recovery.

For command syntax and exit codes:

```sh
npx @kostysh/skills --help
```

## For maintainers

This is a pnpm workspace. Runnable skills live in [`skills/`](skills/); each
skill declares its maintenance source. Start with the [repository instructions](AGENTS.md)
and [skill standard](docs/skill-standard.md). Record templates are in
[`docs/templates/`](docs/templates/). CLI development and release instructions
are in the [CLI guide](cli/README.md#development-and-releases).
