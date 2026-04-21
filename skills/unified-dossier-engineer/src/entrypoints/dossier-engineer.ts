import packageJson from '../../package.json' with { type: 'json' };

import { runLauncher } from '../compat/launcher.ts';

const io = {
  stdout: process.stdout,
  stderr: process.stderr,
};

const exitCode = await runLauncher(process.argv.slice(2), io, packageJson.version, 'primary');
process.exitCode = exitCode;
