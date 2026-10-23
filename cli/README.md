# @kostysh/skills

Install and update skills from `kostysh/skills`. Requires Node.js 24 or later.
The CLI interface is English; skill descriptions and files keep their original
language.

```sh
npx @kostysh/skills
pnpx @kostysh/skills
```

In the menu, use the arrow keys to move, Space to select skills, Enter to
continue, and Ctrl-C to cancel. Choose Install, select skills, then choose an
agent or Custom path. For a project installation, enter a directory such as
`.agents/skills`. Relative paths resolve from the current directory; the
configuration records absolute paths.

## Commands and destinations

```sh
npx @kostysh/skills install code-reviewer --target codex
npx @kostysh/skills install code-reviewer --target custom --path .claude/skills
npx @kostysh/skills update
npx @kostysh/skills --help
npx @kostysh/skills --version
```

You can install several skills by listing their names after `install`.

| Target | Default directory |
| --- | --- |
| `codex` | `~/.agents/skills` |
| `claude-code` | `~/.claude/skills` |
| `opencode` | `~/.config/opencode/skills` |
| `pi` | `~/.pi/agent/skills` |
| `universal` | Enter a path; the menu suggests `~/.agents/skills` |
| `custom` | Enter a path; the menu suggests `.agents/skills` |

`--path` overrides any preset. Non-interactive `universal` and `custom` installs
require `--path`. Without a terminal, provide a complete `install` command or
use `update`.

Updates check every installation in `~/.kskills/setup.json`. If a skill's
destination contains local changes or an unmanaged directory, the CLI preserves
it and reports a conflict with a nonzero exit code. Missing managed skill
directories are restored from the catalog.
When all checks succeed and no changes are needed, the CLI prints `All up to date`.
Without a saved installation, run `install` first.

Exit codes: 0 for success, 1 for an error or partial result, 2 for invalid
arguments, and 130 for cancellation. Prompts and diagnostics go to stderr;
results go to stdout.

The previous skill directory is kept until the new configuration is saved.
After a crash, `~/.kskills/setup.lock` may remain: remove it only after checking
that no other CLI process is running. Directories named `.kskills-*` inside an
installation path may contain a backup; keep them until the installed files
and configuration have been checked.

## Recovery after a crash

An ordinary error rolls back the change. A forced process termination between
replacing a skill and saving the configuration can leave the new copy out of
sync with the configuration. A subsequent `update` reports a conflict. To
recover manually:

1. Stop all CLI processes. Copy `~/.kskills/setup.json`, the affected skill
   directory, and every `.kskills-*` directory from the installation to a
   separate backup location. Keep the lock and original backups for now.
2. Find the installation by `path` and the skill by `name` in the configuration.
   Its `contentHash` identifies the last recorded copy. To compare copies, save
   the following script as `recovery-hash.mjs` outside the skill directories.
   It only reads files and requires Node.js 24 or later, with no CLI source or
   npm dependencies.

```js
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

if (!process.argv[2]) throw new Error('Provide the skill directory path');
const root = resolve(process.argv[2]);
const hash = (data) => createHash('sha256').update(data).digest('hex');
const files = [];
async function walk(path = '') {
  const stat = await lstat(join(root, path));
  if (stat.isSymbolicLink()) throw new Error(`Symbolic link: ${path}`);
  if (stat.isFile() && path) files.push(path);
  else if (stat.isDirectory()) {
    for (const name of await readdir(join(root, path))) {
      await walk(path ? `${path}/${name}` : name);
    }
  } else throw new Error(`Unsupported file type: ${path}`);
}
await walk();
const entries = [];
for (const file of files.sort()) entries.push([file, hash(await readFile(join(root, file)))]);
console.log(hash(JSON.stringify(entries)));
```

3. Run `node recovery-hash.mjs "/absolute/path/to/skill"`, then run it for
   each `.kskills-*/old` directory in this installation. Compare the results
   with the affected skill's `contentHash` in the configuration.
4. If the installed copy matches the configuration, leave it in place. If it
   is missing or differs, and **exactly one** `old` copy matches the
   configuration, move the current skill directory to a new, separate
   quarantine directory, if present. Then move the matching `old` directory to
   the original skill path. Do not merge directories or overwrite existing
   files. Compute the restored skill's hash again; it must match the configuration.
5. Only after every installation agrees with the configuration and no CLI
   process is running, remove `~/.kskills/setup.lock` and run `update`. Keep
   quarantine copies and backups until you have verified the result.

If the configuration has no record of the skill, no copies match, or multiple
copies match, stop recovery and preserve all copies for investigation. Do not
guess a version or `contentHash`, and do not delete a differing copy: it may
contain local changes. This procedure restores the recorded version; it does
not recover a lost or damaged configuration.

## Development and releases

From the workspace root:

```sh
pnpm --filter @kostysh/skills test
pnpm --filter @kostysh/skills lint
pnpm --filter @kostysh/skills verify:package
pnpm --filter @kostysh/skills pack:skills --out ../skills-release --release skills-YYYYMMDD --previous-latest
```

The packer reads built `SKILL.md` files and runtime resources; it does not run
the skill compiler. It excludes development docs, source bundles, tests, and
maintenance instructions. Runtime templates in `assets/`, including `AGENTS.md`,
are preserved. The catalog's contentHash history prevents reusing a version
with different contents. For manual packaging, use `--previous <catalog.json>`
or `--previous-latest` to check published versions; the release workflow does
this automatically. Replace `YYYYMMDD` with the release date and use an empty
output directory.

Two independent workflows handle releases: `skills-*` tags publish skill archives
and a catalog to GitHub Releases; `cli-v<version>` tags publish only the CLI to
public npm. The CLI selects the stable skills release with the latest publication
time, ignoring CLI releases and prereleases. The CLI tag must match the package
version. Tags and publication require an operator command.

The npm owner must register the package if needed and configure a Trusted
Publisher for `kostysh/skills`, workflow `publish-cli.yml`, allowing `npm publish`.
Publication uses npm OIDC and needs no permanent npm token. Publish a skills
release first. After npm publication, verify both launchers and a real
installation/update from the published archives. A successful local smoke check
with an HTTP fixture does not verify public publication.
