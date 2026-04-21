import type { CliIo } from '../unified-cli.ts';
import { runUnifiedCli } from '../unified-cli.ts';

export type InvocationKind = 'primary' | 'compat-backlog' | 'compat-dossier';

export async function runLauncher(
  argv: string[],
  io: CliIo,
  version: string,
  invocation: InvocationKind,
): Promise<number> {
  if (invocation !== 'primary') {
    const legacyName = invocation === 'compat-backlog' ? 'backlog-engineer' : 'dossier';
    io.stderr.write(
      `[compat] ${legacyName} is transitional. Prefer \`dossier-engineer <command>\`.\n`,
    );
  }

  return runUnifiedCli(argv, io, {
    invocation,
    version,
  });
}
