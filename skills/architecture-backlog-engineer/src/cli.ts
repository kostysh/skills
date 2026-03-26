import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import packageJson from '../package.json';
import { ACCEPTANCE_CLASSES, isAcceptanceClass, type AcceptanceClass } from './discovery/common.js';
import { initializeDiscoveryRun } from './discovery/init-run.js';
import { renderDiscoveryViews } from './discovery/render-views.js';
import { validateDiscoveryRun } from './discovery/validate-run.js';

const CLI_NAME = 'architecture-backlog';
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_USAGE = 2;

interface CliIo {
  stderr: Pick<NodeJS.WriteStream, 'write'>;
  stdout: Pick<NodeJS.WriteStream, 'write'>;
}

interface CommandDefinition {
  aliases: string[];
  description: string;
  helpText: () => string;
  name: string;
  run: (argv: string[], io: CliIo) => number;
}

class UsageError extends Error {
  readonly helpText: string | undefined;

  constructor(message: string, helpText?: string) {
    super(message);
    this.name = 'UsageError';
    this.helpText = helpText;
  }
}

const io: CliIo = {
  stderr: process.stderr,
  stdout: process.stdout,
};

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function globalHelp(): string {
  return [
    'Architecture backlog discovery CLI.',
    '',
    'Usage:',
    `  ${CLI_NAME} <command> [options]`,
    `  ${CLI_NAME} help [command]`,
    '',
    'Commands:',
    '  init <run-dir>       Initialize canonical discovery artifacts.',
    '  validate <run-dir>   Validate canonical state and refresh validation.json.',
    '  render <run-dir>     Render disposable markdown projections into views/.',
    '  help [command]       Show global or command-specific help.',
    '',
    'Compatibility aliases:',
    '  init-discovery-run',
    '  validate-discovery-run',
    '  render-discovery-views',
    '',
    'Global options:',
    '  -h, --help           Show help.',
    '  --version            Show CLI version.',
  ].join('\n');
}

function initHelp(): string {
  return [
    'Initialize canonical discovery artifacts for a run directory.',
    '',
    'Usage:',
    `  ${CLI_NAME} init <run-dir> [options]`,
    `  ${CLI_NAME} init-discovery-run <run-dir> [options]`,
    '',
    'Options:',
    '  --acceptance-target <class>  Set acceptance target.',
    '                               Values: draft-only, planning-grade, implementation-grade.',
    '  --force                      Overwrite canonical artifacts in an existing run directory.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

function validateHelp(): string {
  return [
    'Validate canonical discovery state and refresh validation.json.',
    '',
    'Usage:',
    `  ${CLI_NAME} validate <run-dir>`,
    `  ${CLI_NAME} validate-discovery-run <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function renderHelp(): string {
  return [
    'Render disposable markdown projections from canonical discovery state.',
    '',
    'Usage:',
    `  ${CLI_NAME} render <run-dir>`,
    `  ${CLI_NAME} render-discovery-views <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function toUsageError(error: unknown, helpText: string): UsageError {
  const message = error instanceof Error ? error.message : String(error);
  return new UsageError(message, helpText);
}

function parseCommandArgs<const T extends NonNullable<Parameters<typeof parseArgs>[0]>>(
  config: T,
  helpText: string,
) {
  try {
    return parseArgs(config);
  } catch (error) {
    throw toUsageError(error, helpText);
  }
}

function requireSingleRunDir(positionals: string[], commandName: string, helpText: string): string {
  if (positionals.length !== 1) {
    throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
  }

  const runDir = positionals[0];
  if (runDir === undefined) {
    throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
  }

  return runDir;
}

function runInitCommand(argv: string[], commandIo: CliIo): number {
  const helpText = initHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        'acceptance-target': {
          type: 'string',
        },
        force: {
          short: 'f',
          type: 'boolean',
        },
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'init', helpText);
  const acceptanceTargetValue = parsed.values['acceptance-target'];
  const acceptanceTarget =
    typeof acceptanceTargetValue === 'string' ? acceptanceTargetValue : undefined;
  if (acceptanceTargetValue !== undefined && acceptanceTarget === undefined) {
    throw new UsageError('Acceptance target must be provided as a single string value.', helpText);
  }
  if (acceptanceTarget !== undefined && !isAcceptanceClass(acceptanceTarget)) {
    throw new UsageError(
      `Invalid acceptance target: ${acceptanceTarget}. Expected one of ${ACCEPTANCE_CLASSES.join(', ')}.`,
      helpText,
    );
  }

  const initOptions: {
    acceptanceTarget?: AcceptanceClass;
    force?: boolean;
    runDir: string;
  } = { runDir };

  if (acceptanceTarget !== undefined) {
    initOptions.acceptanceTarget = acceptanceTarget;
  }
  const forceValue = parsed.values.force;
  if (forceValue !== undefined && typeof forceValue !== 'boolean') {
    throw new UsageError('Force must be provided as a boolean flag.', helpText);
  }
  if (forceValue !== undefined) {
    initOptions.force = forceValue;
  }

  const result = initializeDiscoveryRun(initOptions);
  writeLine(commandIo.stdout, `Initialized discovery run at ${result.runDir}`);
  return EXIT_SUCCESS;
}

function runValidateCommand(argv: string[], commandIo: CliIo): number {
  const helpText = validateHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'validate', helpText);
  const result = validateDiscoveryRun(runDir);

  if (result.missingArtifacts.length > 0) {
    for (const filePath of result.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing canonical artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }

  const validation = result.validation;
  if (!validation) {
    writeLine(commandIo.stderr, 'Validation state could not be produced.');
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Validation status: ${validation.status}`);
  for (const error of validation.errors) {
    writeLine(commandIo.stderr, `ERROR: ${error}`);
  }
  for (const warning of validation.warnings) {
    writeLine(commandIo.stdout, `WARNING: ${warning}`);
  }

  return validation.errors.length > 0 ? EXIT_FAILURE : EXIT_SUCCESS;
}

function runRenderCommand(argv: string[], commandIo: CliIo): number {
  const helpText = renderHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'render', helpText);
  const result = renderDiscoveryViews(runDir);
  writeLine(commandIo.stdout, `Rendered views into ${result.viewsDir}`);
  return EXIT_SUCCESS;
}

const COMMANDS: CommandDefinition[] = [
  {
    aliases: ['init-discovery-run'],
    description: 'Initialize canonical discovery artifacts.',
    helpText: initHelp,
    name: 'init',
    run: runInitCommand,
  },
  {
    aliases: ['validate-discovery-run'],
    description: 'Validate canonical state and refresh validation.json.',
    helpText: validateHelp,
    name: 'validate',
    run: runValidateCommand,
  },
  {
    aliases: ['render-discovery-views'],
    description: 'Render markdown projections into views/.',
    helpText: renderHelp,
    name: 'render',
    run: runRenderCommand,
  },
];

function findCommand(commandName: string): CommandDefinition | undefined {
  return COMMANDS.find(
    (command) => command.name === commandName || command.aliases.includes(commandName),
  );
}

function printUsageError(error: UsageError, commandIo: CliIo): number {
  writeLine(commandIo.stderr, error.message);
  if (error.helpText) {
    writeLine(commandIo.stderr);
    writeLine(commandIo.stderr, error.helpText);
  }
  return EXIT_USAGE;
}

export function executeCli(argv: string[], commandIo: CliIo = io): number {
  const firstToken = argv[0];
  if (firstToken === undefined) {
    return printUsageError(new UsageError('A command is required.', globalHelp()), commandIo);
  }

  const rest = argv.slice(1);

  if (firstToken === '--help' || firstToken === '-h') {
    writeLine(commandIo.stdout, globalHelp());
    return EXIT_SUCCESS;
  }

  if (firstToken === '--version') {
    writeLine(commandIo.stdout, packageJson.version);
    return EXIT_SUCCESS;
  }

  if (firstToken === 'help') {
    if (rest.length === 0) {
      writeLine(commandIo.stdout, globalHelp());
      return EXIT_SUCCESS;
    }
    if (rest.length > 1) {
      return printUsageError(
        new UsageError('help accepts at most one command name.', globalHelp()),
        commandIo,
      );
    }

    const targetName = rest[0];
    if (targetName === undefined) {
      return printUsageError(
        new UsageError('help accepts at most one command name.', globalHelp()),
        commandIo,
      );
    }

    const targetCommand = findCommand(targetName);
    if (!targetCommand) {
      return printUsageError(
        new UsageError(`Unknown command: ${targetName}`, globalHelp()),
        commandIo,
      );
    }

    writeLine(commandIo.stdout, targetCommand.helpText());
    return EXIT_SUCCESS;
  }

  const command = findCommand(firstToken);
  if (!command) {
    return printUsageError(
      new UsageError(`Unknown command: ${firstToken}`, globalHelp()),
      commandIo,
    );
  }

  try {
    return command.run(rest, commandIo);
  } catch (error) {
    if (error instanceof UsageError) {
      return printUsageError(error, commandIo);
    }

    const message = error instanceof Error ? error.message : String(error);
    writeLine(commandIo.stderr, message);
    return EXIT_FAILURE;
  }
}

function isDirectExecution(metaUrl: string): boolean {
  const currentFilePath = fileURLToPath(metaUrl);
  const argvPath = process.argv[1];
  if (!argvPath) {
    return false;
  }

  try {
    return fs.realpathSync(argvPath) === fs.realpathSync(currentFilePath);
  } catch {
    return path.resolve(argvPath) === currentFilePath;
  }
}

if (isDirectExecution(import.meta.url)) {
  process.exit(executeCli(process.argv.slice(2)));
}

export const cliName = CLI_NAME;
