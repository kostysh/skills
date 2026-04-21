import packageJson from '../../package.json' with { type: 'json' };

import { runUnifiedCli } from '../unified-cli.ts';

const io = {
  stdout: process.stdout,
  stderr: process.stderr,
};

const exitCode = await runUnifiedCli(process.argv.slice(2), io, {
  version: packageJson.version,
});
process.exitCode = exitCode;
