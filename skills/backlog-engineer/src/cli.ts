import packageJson from '../package.json' with { type: 'json' };
import { runCli } from './cli/run-cli.ts';
import type { CliIo } from './commands/types.ts';

const io: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr,
};

const exitCode = await runCli(process.argv.slice(2), io, packageJson.version);
process.exitCode = exitCode;

export { runCli };
