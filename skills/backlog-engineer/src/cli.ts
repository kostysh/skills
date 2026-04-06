import packageJson from '../package.json';
import { runCli } from './cli/run-cli.js';
import type { CliIo } from './commands/types.js';

const io: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr,
};

const exitCode = await runCli(process.argv.slice(2), io, packageJson.version);
process.exitCode = exitCode;

export { runCli };
