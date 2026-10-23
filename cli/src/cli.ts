import { parseArgs } from 'node:util';
import pkg from '../package.json' with { type: 'json' };
import { Installer } from './installer.ts';
import type { Target } from './model.ts';
import { destination, targets } from './model.ts';
import { download, latestCatalog } from './network.ts';
import { chooseInstallation, chooseMode } from './prompts.ts';

const help = `kskills ${pkg.version} — install and update skills\n\nRun without a command to open the interactive menu.\n  kskills install <skill...> --target <codex|claude-code|opencode|pi|universal|custom> [--path <directory>]\n  kskills update\n  kskills --help\n  kskills --version\n\nNon-interactive custom and universal targets require --path. Relative paths use the current directory.\nConfiguration: ~/.kskills/setup.json\nExit codes: 0 success; 1 error or partial result; 2 invalid arguments; 130 cancelled.\n`;
async function run(): Promise<number> {
  let values: { help?: boolean; version?: boolean; target?: string; path?: string };
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({
      allowPositionals: true,
      strict: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'V' },
        target: { type: 'string' },
        path: { type: 'string' },
      },
    }));
    if (values.help || values.version) {
      if (
        positionals.length ||
        values.target !== undefined ||
        values.path !== undefined ||
        (values.help && values.version)
      )
        throw new Error('Do not combine --help or --version with an action or other options.');
      process.stdout.write(values.help ? help : `${pkg.version}\n`);
      return 0;
    }
    const command = positionals[0];
    if (command === 'install') {
      if (
        positionals.length < 2 ||
        !targets.includes(values.target as Target) ||
        values.path === ''
      )
        throw new Error('Provide skill names and a valid --target.');
      destination(values.target as Target, values.path);
    } else if (command === 'update') {
      if (positionals.length !== 1 || values.target !== undefined || values.path !== undefined)
        throw new Error('update does not accept additional arguments or options.');
    } else if (command !== undefined || values.target !== undefined || values.path !== undefined)
      throw new Error('Unknown command or options.');
    else if (!process.stdin.isTTY || !process.stderr.isTTY)
      throw new Error('Without a terminal, use install with arguments and options, or update.');
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n${help}`);
    return 2;
  }
  const mode = positionals[0] ?? (await chooseMode());
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error('Cancelled.'));
  process.once('SIGINT', cancel);
  try {
    const get = (url: string, limit?: number) => download(url, limit, controller.signal);
    const installer = new Installer(undefined, get, controller.signal);
    // Validate existing state before making any network request.
    const config = await installer.read();
    if (mode === 'update' && !config.installations.length)
      throw new Error('No installations found. Install skills first.');
    process.stderr.write('Checking the skills catalog…\n');
    const catalog = await latestCatalog(get);
    const selected =
      mode === 'install'
        ? positionals.length
          ? {
              names: positionals.slice(1),
              target: values.target as Target,
              path: destination(values.target as Target, values.path),
            }
          : await chooseInstallation(catalog)
        : undefined;
    if (selected) process.stderr.write(`Installation path: ${selected.path}\n`);
    const result = selected
      ? await installer.install(catalog, selected.names, selected.path, selected.target)
      : await installer.update(catalog);
    for (const changed of result.changed) process.stdout.write(`Installed ${changed}\n`);
    for (const error of result.errors) process.stderr.write(`${error}\n`);
    if (controller.signal.aborted) {
      process.stderr.write('Cancelled.\n');
      return 130;
    }
    if (!result.changed.length && !result.errors.length) process.stdout.write('All up to date\n');
    return result.errors.length ? 1 : 0;
  } catch (error) {
    if (controller.signal.aborted) {
      process.stderr.write('Cancelled.\n');
      return 130;
    }
    throw error;
  } finally {
    process.removeListener('SIGINT', cancel);
  }
}
try {
  process.exitCode = await run();
} catch (error) {
  if (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.name === 'AbortPromptError')
  ) {
    process.stderr.write('Cancelled.\n');
    process.exitCode = 130;
  } else {
    process.stderr.write(`Error: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
