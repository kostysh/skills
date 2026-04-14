import fs from 'node:fs';

import { resolveRetroOutputLayout, safeMkdirForFile } from '../core/shared.ts';
import { createUsageError } from '../cli/errors.ts';
import type { CommonCommandInput, OptionSpec } from './types.ts';
import type { ScanSummary } from '../core/types.ts';
import type { RetroOutputCommandName } from '../core/shared.ts';

type ParsedOptions = Record<string, string | boolean>;

export const COMMON_OPTION_SPECS: OptionSpec[] = [
  {
    name: 'session',
    type: 'string',
    valueLabel: '<file>',
    description: 'Rollout or session JSONL file.',
  },
  {
    name: 'logs-dir',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Directory containing stage logs.',
  },
  {
    name: 'artifacts-dir',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Project root or evidence root.',
  },
  {
    name: 'skills-dir',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Directory containing skill folders.',
  },
  {
    name: 'out-root',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Root directory for durable retrospective outputs.',
  },
];

export function parseOptions(argv: string[], specs: readonly OptionSpec[]): ParsedOptions {
  const specByName = new Map<string, OptionSpec>();
  for (const spec of specs) {
    specByName.set(`--${spec.name}`, spec);
    for (const alias of spec.aliases ?? []) {
      specByName.set(alias, spec);
    }
  }

  const parsed: ParsedOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    const spec = specByName.get(token);
    if (!spec) {
      if (token.startsWith('-')) {
        throw createUsageError(`Unknown option: ${token}`);
      }
      throw createUsageError(`Unexpected positional argument: ${token}`);
    }

    if (spec.type === 'boolean') {
      parsed[spec.name] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('-')) {
      throw createUsageError(`Missing value for --${spec.name}`);
    }

    parsed[spec.name] = value;
    index += 1;
  }

  for (const spec of specs) {
    if (spec.required && parsed[spec.name] === undefined) {
      throw createUsageError(`Missing required option --${spec.name}`);
    }
  }

  return parsed;
}

export function optionToHelpLine(spec: OptionSpec): string {
  const flags = [...(spec.aliases ?? []), `--${spec.name}`]
    .map((flag) => (spec.type === 'string' ? `${flag} ${spec.valueLabel ?? '<value>'}` : flag))
    .join(', ');
  return `${flags.padEnd(28)}${spec.description}`;
}

export function toCommonCommandInput(options: ParsedOptions): CommonCommandInput {
  const input: CommonCommandInput = {};
  const session = toOptionalString(options.session);
  const logsDir = toOptionalString(options['logs-dir']);
  const artifactsDir = toOptionalString(options['artifacts-dir']);
  const skillsDir = toOptionalString(options['skills-dir']);
  const outRoot = toOptionalString(options['out-root']);

  if (session) {
    input.session = session;
  }
  if (logsDir) {
    input.logsDir = logsDir;
  }
  if (artifactsDir) {
    input.artifactsDir = artifactsDir;
  }
  if (skillsDir) {
    input.skillsDir = skillsDir;
  }
  if (outRoot) {
    input.outRoot = outRoot;
  }

  return input;
}

export function toRequiredString(value: string | boolean | undefined, message: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw createUsageError(message);
}

export function toOptionalString(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toBoolean(value: string | boolean | undefined): boolean {
  return value === true;
}

export function writeJson(filePath: string, data: unknown, pretty = false): void {
  safeMkdirForFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, pretty ? 2 : 0), 'utf8');
}

export function writeText(filePath: string, data: string): void {
  safeMkdirForFile(filePath);
  fs.writeFileSync(filePath, data, 'utf8');
}

export function resolveCommandOutputPath(
  summary: ScanSummary,
  input: CommonCommandInput & { out?: string },
  commandName: RetroOutputCommandName,
): string {
  const explicitOut = input.out;
  if (typeof explicitOut === 'string' && explicitOut.length > 0) {
    return explicitOut;
  }

  const layoutOptions: { commandName: RetroOutputCommandName; outRoot?: string } = {
    commandName,
  };
  if (input.outRoot) {
    layoutOptions.outRoot = input.outRoot;
  }

  return resolveRetroOutputLayout(summary, layoutOptions).filePath;
}
