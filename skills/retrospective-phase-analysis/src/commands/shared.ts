import fs from 'node:fs';
import path from 'node:path';

import { resolveRetroOutputLayout, safeMkdirForFile } from '../core/shared.ts';
import { createUsageError } from '../cli/errors.ts';
import type { CommonCommandInput, OptionSpec, ReportLanguage } from './types.ts';
import type { ScanSummary } from '../core/types.ts';
import type { RetroOutputCommandName } from '../core/shared.ts';

type ParsedOptionValue = string | boolean | string[];
type ParsedOptions = Record<string, ParsedOptionValue>;

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
    description: 'Optional directory containing skill folders for referenced-skill enrichment.',
  },
  {
    name: 'out-root',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Root directory where the CLI chooses the canonical retrospective run directory.',
  },
  {
    name: 'run-dir',
    type: 'string',
    valueLabel: '<dir>',
    description: 'Exact canonical retrospective run directory to reuse.',
  },
  {
    name: 'language',
    type: 'string',
    valueLabel: '<language>',
    description:
      'Operator language tag or name for report metadata and generated Markdown scaffolds.',
  },
  {
    name: 'draft',
    type: 'boolean',
    description: 'Write an explicitly temporary draft bundle under out/retro-drafts.',
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

    if (spec.repeatable) {
      const existing = parsed[spec.name];
      parsed[spec.name] = Array.isArray(existing) ? [...existing, value] : [value];
    } else {
      parsed[spec.name] = value;
    }
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
  const runDir = toOptionalString(options['run-dir']);
  const language = toOptionalLanguage(options.language);
  const draft = toBoolean(options.draft);

  if (runDir && outRoot) {
    throw createUsageError('Use either --run-dir or --out-root, not both');
  }
  if (draft && (runDir || outRoot)) {
    throw createUsageError('Use --draft only without --run-dir or --out-root');
  }

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
  if (runDir) {
    input.runDir = runDir;
  }
  if (language) {
    input.language = language;
  }
  if (draft) {
    input.draft = draft;
  }

  return input;
}

export function toRequiredString(value: ParsedOptionValue | undefined, message: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw createUsageError(message);
}

export function toOptionalString(value: ParsedOptionValue | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toStringList(value: ParsedOptionValue | undefined): string[] {
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item.length > 0);
  }

  return [];
}

export function toOptionalLanguage(
  value: ParsedOptionValue | undefined,
): ReportLanguage | undefined {
  const language = toOptionalString(value)?.trim();
  return language && language.length > 0 ? language : undefined;
}

export function toBoolean(value: ParsedOptionValue | undefined): boolean {
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

  const layoutOptions: {
    commandName: RetroOutputCommandName;
    outRoot?: string;
    runDir?: string;
    draft?: boolean;
  } = {
    commandName,
  };
  if (input.outRoot) {
    layoutOptions.outRoot = input.outRoot;
  }
  if (input.runDir) {
    layoutOptions.runDir = input.runDir;
  }
  if (input.draft) {
    layoutOptions.draft = input.draft;
  }

  return resolveRetroOutputLayout(summary, layoutOptions).filePath;
}

export function assertOutputOverrideIsExclusive(
  input: CommonCommandInput & { out?: string },
): void {
  if (input.out && (input.runDir || input.outRoot || input.draft)) {
    throw createUsageError(
      'Use --out only as a low-level single-file override; do not combine it with --run-dir, --out-root, or --draft',
    );
  }
}

export function loadScanSummaryFromRunDir(runDir: string): ScanSummary {
  const scanSummaryPath = path.join(path.resolve(runDir), 'scan-summary.json');
  if (!fs.existsSync(scanSummaryPath)) {
    throw createUsageError(`--run-dir requires an existing scan-summary.json: ${scanSummaryPath}`);
  }

  return JSON.parse(fs.readFileSync(scanSummaryPath, 'utf8')) as ScanSummary;
}
