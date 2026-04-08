import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_DOSSIERS_DIR,
  DEFAULT_STRICT_COVERAGE_STATUSES,
  extractAcIds,
  extractFeatureIdFromAc,
  isDossierFile,
  listDossierFiles,
  matchesFeatureFile,
  readAllDossiers,
  readDossierRecord,
  type DossierRecord,
} from './lib/dossier-utils.ts';
import { fileExists, readText, walk, writeJsonAtomic, writeTextAtomic } from './lib/fs-utils.ts';
import {
  getChangedFiles,
  getCurrentCommit,
  getDirtyPaths,
  getHeadRef,
  getMergeBase,
  hasDirtyWorktree,
  inGitRepo,
  normalizeRepoPath,
  resolveBaseRef,
  runGit,
  toRepoRelativePath,
} from './lib/git-utils.ts';
import { buildRedFlagsBlock, analyzeDossiers, renderLintSummary } from './core/lint-dossiers.ts';
import { hasExecutableSectionChange, parseTopLevelSections } from './core/markdown.ts';
import { defaultNextStep, statusToNextStep } from './core/workflow.ts';

export const CLI_NAME = 'dossier';
export const CLI_DISPLAY_NAME = 'node scripts/dossier.mjs';
export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_USAGE = 2;
const DEFAULT_INDEX_FILE = 'docs/ssot/index.md';
const BACKLOG_DELIVERY_STATES = ['defined', 'specified', 'planned', 'implemented'] as const;

export interface CliIo {
  stderr: Pick<NodeJS.WriteStream, 'write'>;
  stdout: Pick<NodeJS.WriteStream, 'write'>;
}

export interface CommandDefinition {
  aliases: string[];
  description: string;
  helpText: () => string;
  name: string;
  run: (argv: string[], io: CliIo) => Promise<number> | number;
}

interface CoverageAuditResult {
  acCount: number;
  coverageGate: string;
  dossier: string;
  featureId: string;
  found: Map<string, string[]>;
  missing: string[];
  status: string | null;
  title: string;
}

interface VerificationCheck {
  command: string;
  duration_ms: number;
  exit_code: number;
  name: string;
  status: 'fail' | 'pass';
  stderr: string;
  stdout: string;
}

interface ReviewArtifactShape {
  feature_id?: string;
  findings?: {
    must_fix?: unknown;
  };
  reviewed_commit?: string;
  step?: string;
  verdict?: string;
}

interface StepArtifactShape {
  blockers?: unknown;
  next_step?: string;
  process_complete?: boolean;
}

interface VerifyArtifactShape {
  current_commit?: string;
  feature_id?: string;
  status?: string;
  step?: string;
}

export class UsageError extends Error {
  readonly helpText: string | undefined;

  constructor(message: string, helpText?: string) {
    super(message);
    this.name = 'UsageError';
    this.helpText = helpText;
  }
}

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function hasOption(argv: string[], ...names: string[]): boolean {
  return names.some((name) => argv.includes(name));
}

function takeOption(argv: string[], name: string, fallback: string | null = null): string | null {
  const exact = argv.indexOf(name);
  if (exact !== -1) {
    const value = argv[exact + 1];
    if (!value || value.startsWith('--')) {
      return fallback;
    }
    return value;
  }

  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function takeManyOptions(argv: string[], name: string): string[] {
  const values: string[] = [];
  const prefix = `${name}=`;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === name) {
      const value = argv[index + 1];
      if (value && !value.startsWith('--')) {
        values.push(value);
      }
      continue;
    }
    if (arg?.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
    }
  }
  return values;
}

function ensureRequired(value: string | null, message: string, helpText: string): string {
  if (!value) {
    throw new UsageError(message, helpText);
  }
  return value;
}

function ensureNonEmpty(values: string[], message: string, helpText: string): string[] {
  if (values.length === 0) {
    throw new UsageError(message, helpText);
  }
  return values;
}

function ensureEnumValue<T extends readonly string[]>(
  value: string,
  allowedValues: T,
  optionName: string,
  helpText: string,
): T[number] {
  if (allowedValues.includes(value as T[number])) {
    return value as T[number];
  }
  throw new UsageError(
    `${optionName} must be one of: ${allowedValues.map((item) => `"${item}"`).join(', ')}.`,
    helpText,
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function stringOrFallback(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function frontmatterString(
  frontmatter: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  return stringOrFallback(frontmatter[key], fallback);
}

function relativeToRoot(root: string, targetPath: string): string {
  return path.relative(root, targetPath).split(path.sep).join('/');
}

function quoteArg(value: string): string {
  return /^[A-Za-z0-9_./:=,@+-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCli(parts: string[]): string {
  return parts.map((part) => quoteArg(part)).join(' ');
}

function canonicalCli(commandName: string, args: string[] = []): string {
  return formatCli(['node', 'scripts/dossier.mjs', commandName, ...args]);
}

function slugify(value: string): string {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'feature';
}

function yamlFlowStringArray(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

function nextFeatureId(dossiers: DossierRecord[]): string {
  const maxNumeric = dossiers.reduce((current, dossier) => {
    const match = String(dossier.frontmatter.id).match(/^F-(\d{4})$/);
    return match ? Math.max(current, Number.parseInt(match[1] ?? '0', 10)) : current;
  }, 0);
  return `F-${String(maxNumeric + 1).padStart(4, '0')}`;
}

function renderInitialDossier(params: {
  area: string;
  backlogBlockers: string[];
  backlogDeliveryState: (typeof BACKLOG_DELIVERY_STATES)[number];
  backlogDependencies: string[];
  backlogItemKey: string;
  backlogSources: string[];
  created: string;
  dependsOn: string[];
  featureId: string;
  impacts: string[];
  owners: string[];
  title: string;
}): string {
  const {
    area,
    backlogBlockers,
    backlogDeliveryState,
    backlogDependencies,
    backlogItemKey,
    backlogSources,
    created,
    dependsOn,
    featureId,
    impacts,
    owners,
    title,
  } = params;
  const formatNestedList = (values: string[]): string =>
    values.length > 0 ? values.map((value) => `    - ${value}`).join('\n') : '    - none recorded';
  return `---
id: ${featureId}
title: ${title}
status: proposed
coverage_gate: deferred
owners: ${yamlFlowStringArray(owners)}
area: ${area}
depends_on: ${yamlFlowStringArray(dependsOn)}
impacts: ${yamlFlowStringArray(impacts)}
created: ${created}
updated: ${created}
links:
  issue: ""
  pr: []
  docs: []
---

## 1. Context & Goal

- **Backlog handoff:**
  - Backlog item key: ${backlogItemKey}
  - Backlog delivery state at intake: ${backlogDeliveryState}
  - Source traceability:
${formatNestedList(backlogSources)}
  - Known blockers at intake:
${formatNestedList(backlogBlockers)}
  - Known dependencies at intake:
${formatNestedList(backlogDependencies)}
- User problem:
- Goal:
- Non-goals:
- Current substrate / baseline:

## 2. Scope

### In scope

### Out of scope

### Constraints

### Assumptions (optional)

### Open questions (optional)

## 3. Requirements & Acceptance Criteria (SSoT)

## 4. Non-functional requirements (NFR)

## 5. Design (compact)

### 5.1 API surface

### 5.2 Runtime / deployment surface

### 5.3 Data model changes

### 5.4 Edge cases and failure modes

### 5.5 Verification surface / initial verification plan

### 5.6 Representation upgrades (triggered only when needed)

### 5.7 Definition of Done

### 5.8 Rollout / activation note (triggered only when needed)

## 6. Slicing plan (2–6 increments)

## 7. Task list (implementation units)

## 8. Test plan & Coverage map

| AC ID | Test reference | Status |
|---|---|---|

## 9. Decision log (ADR blocks)

## 10. Progress & links

- Backlog item key: ${backlogItemKey}
- Status progression: \`proposed -> shaped -> planned -> in_progress -> done\`
- Issue:
- PRs:

## 11. Change log

- ${created}: Initial dossier created from backlog item \`${backlogItemKey}\` at backlog delivery state \`${backlogDeliveryState}\`.
`;
}

function replaceBlock(
  content: string,
  beginMarker: string,
  endMarker: string,
  block: string,
): string {
  const begin = content.indexOf(beginMarker);
  const end = content.indexOf(endMarker);
  if (begin === -1 || end === -1 || end < begin) {
    return `${content.trim()}\n\n${beginMarker}\n${block}\n${endMarker}\n`;
  }
  const before = content.slice(0, begin + beginMarker.length);
  const after = content.slice(end);
  return `${before}\n${block}\n${after}`;
}

function escapePipe(value: unknown): string {
  return String(value).replace(/\|/g, '\\|');
}

function escapeQuotes(value: unknown): string {
  return String(value).replace(/"/g, '\\"');
}

function buildMermaidGraph(dossiers: DossierRecord[]): string {
  const nodes = dossiers.map((dossier) => {
    const frontmatter = dossier.frontmatter ?? {};
    const featureId = frontmatterString(frontmatter, 'id', dossier.relPath);
    const title = frontmatterString(frontmatter, 'title');
    const nodeId = featureId.replace(/-/g, '');
    const label = `${featureId} ${title}`.trim();
    return `  ${nodeId}["${escapeQuotes(label)}"]`;
  });

  const edges: string[] = [];
  for (const dossier of dossiers) {
    const frontmatter = dossier.frontmatter ?? {};
    const from = frontmatterString(frontmatter, 'id', dossier.relPath).replace(/-/g, '');
    for (const dependency of toStringArray(frontmatter.depends_on)) {
      edges.push(`  ${from} --> ${String(dependency).replace(/-/g, '')}`);
    }
  }

  return ['```mermaid', 'graph TD', ...nodes, ...edges, '```'].join('\n');
}

function featureRow(dossier: DossierRecord, indexDir: string): string {
  const frontmatter = dossier.frontmatter ?? {};
  const dependsOn = toStringArray(frontmatter.depends_on);
  const impacts = toStringArray(frontmatter.impacts);
  const relPath = path.relative(indexDir, dossier.absPath).split(path.sep).join('/');

  return `| ${frontmatterString(frontmatter, 'id', '—')} | ${escapePipe(frontmatterString(frontmatter, 'title'))} | ${frontmatterString(frontmatter, 'status')} | ${dossier.coverageGate} | ${frontmatterString(frontmatter, 'area')} | ${dependsOn.length > 0 ? dependsOn.join(', ') : '—'} | ${impacts.length > 0 ? impacts.join(',') : '—'} | \`${relPath}\` |`;
}

function ensureIndexSkeleton(): string {
  return `# SSOT Index

> Single-file navigation source of truth.  
> **Do not duplicate requirements here.** Link to Feature Dossiers instead.

_Last sync: ${new Date().toISOString()}_

## Features

<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

## Dependency graph

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->

## Red flags

<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
`;
}

function getBaselineFromGit(
  root: string,
  relPath: string,
  baseRef: string | null,
): { label: string; text: string | null } | null {
  const head = getHeadRef(root);
  if (!head) {
    return null;
  }

  const diffVsHead =
    runGit(root, ['diff', '--name-only', 'HEAD', '--', relPath], { allowFailure: true }) || '';
  if (diffVsHead.trim()) {
    return {
      label: 'HEAD',
      text: runGit(root, ['show', `HEAD:${relPath}`], { allowFailure: true }),
    };
  }

  const mergeBase = baseRef ? getMergeBase(root, baseRef) : null;
  if (mergeBase) {
    return {
      label: mergeBase,
      text: runGit(root, ['show', `${mergeBase}:${relPath}`], { allowFailure: true }),
    };
  }

  const previousCommit = runGit(root, ['rev-parse', '--verify', 'HEAD~1'], {
    allowFailure: true,
  });
  if (previousCommit) {
    return {
      label: previousCommit,
      text: runGit(root, ['show', `${previousCommit}:${relPath}`], { allowFailure: true }),
    };
  }

  return null;
}

function isTestFile(filePath: string): boolean {
  return (
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath) ||
    filePath.split(path.sep).includes('test') ||
    filePath.split(path.sep).includes('tests')
  );
}

async function selectChangedDossiers({
  absRoot,
  baseRef,
  dossiersDir,
}: {
  absRoot: string;
  baseRef: string | null;
  dossiersDir: string;
}): Promise<string[]> {
  if (!inGitRepo(absRoot)) {
    throw new UsageError('--changed-only requires a git repository.', coverageAuditHelp());
  }

  const absDossiersDir = path.resolve(absRoot, dossiersDir);
  const dossierFiles = await listDossierFiles(absDossiersDir);
  const dossierAbsPaths = dossierFiles.map((fileName) => path.join(absDossiersDir, fileName));
  const selected = new Set<string>();

  const changedFiles = getChangedFiles(absRoot, baseRef);
  const changedAbsPaths = changedFiles.map((fileName) => normalizeRepoPath(absRoot, fileName));

  for (const absPath of changedAbsPaths) {
    if (dossierAbsPaths.includes(absPath)) {
      selected.add(absPath);
    }
  }

  for (const absPath of changedAbsPaths) {
    if (!isTestFile(absPath)) {
      continue;
    }

    let content: string;
    try {
      content = await readText(absPath);
    } catch {
      continue;
    }

    for (const acId of extractAcIds(content)) {
      const featureId = extractFeatureIdFromAc(acId);
      if (!featureId) {
        continue;
      }

      for (const dossierPath of dossierAbsPaths) {
        if (matchesFeatureFile(featureId, dossierPath)) {
          selected.add(dossierPath);
        }
      }
    }
  }

  return [...selected].sort();
}

function resolveOrphanScope({
  changedOnly,
  dossier,
  orphansScope,
}: {
  changedOnly: boolean;
  dossier: string | null;
  orphansScope: string;
}): string {
  if (orphansScope !== 'auto') {
    return orphansScope;
  }
  if (dossier || changedOnly) {
    return 'dossier';
  }
  return 'repo';
}

const DEFAULT_SCAN_ROOTS = [
  'src',
  'apps',
  'packages',
  'infra',
  'scripts',
  'test',
  'docs',
  '.github',
  'AGENTS.md',
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.typecheck.json',
  'tsconfig.eslint.json',
  'biome.json',
  'eslint.config.js',
] as const;

const MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/;
const MARKDOWN_MARKER_PATTERN = /^\s*(?:>\s*)?(?:[-*+]|\d+\.)?\s*(TODO|FIXME|HACK|XXX)\b/;
const COMMENT_MARKER_PATTERN = /(?:^|\s)(?:\/\/|#|\/\*|\*|<!--|;|--\s).*\b(TODO|FIXME|HACK|XXX)\b/;

function isMarkdownLike(filePath: string): boolean {
  return /\.(md|mdx|txt)$/i.test(filePath);
}

function shouldFlagLine(filePath: string, line: string): boolean {
  if (!MARKER_PATTERN.test(line)) {
    return false;
  }
  if (COMMENT_MARKER_PATTERN.test(line)) {
    return true;
  }
  return isMarkdownLike(filePath) && MARKDOWN_MARKER_PATTERN.test(line);
}

async function collectExplicitPaths(root: string, relPaths: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const relPath of relPaths) {
    const absPath = path.resolve(root, relPath);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) {
      await walk(absPath, files, { rootDir: root });
      continue;
    }
    if (stat.isFile()) {
      files.push(absPath);
    }
  }
  return [...new Set(files)].sort();
}

async function collectDefaultFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const relPath of DEFAULT_SCAN_ROOTS) {
    const absPath = path.resolve(root, relPath);
    try {
      const stat = await fs.stat(absPath);
      if (stat.isDirectory()) {
        await walk(absPath, files, { rootDir: root });
      } else if (stat.isFile()) {
        files.push(absPath);
      }
    } catch {
      // Ignore missing optional paths.
    }
  }
  return [...new Set(files)].sort();
}

async function readJsonArtifact<T>(root: string, artifactPath: string): Promise<T> {
  const absPath = path.resolve(root, artifactPath);
  return JSON.parse(await readText(absPath)) as T;
}

async function readLatestJsonFile(dirPath: string): Promise<Record<string, unknown> | null> {
  if (!(await fileExists(dirPath))) {
    return null;
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const absPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(absPath);
        return { absPath, mtimeMs: stat.mtimeMs };
      }),
  );
  files.sort((left, right) => right.mtimeMs - left.mtimeMs);
  const latest = files[0];
  if (!latest) {
    return null;
  }
  return JSON.parse(await fs.readFile(latest.absPath, 'utf8')) as Record<string, unknown>;
}

function createBufferedIo(): {
  io: CliIo;
  readStderr: () => string;
  readStdout: () => string;
} {
  const stdoutParts: string[] = [];
  const stderrParts: string[] = [];
  return {
    io: {
      stdout: {
        write(chunk) {
          stdoutParts.push(String(chunk));
          return true;
        },
      },
      stderr: {
        write(chunk) {
          stderrParts.push(String(chunk));
          return true;
        },
      },
    },
    readStdout: () => stdoutParts.join(''),
    readStderr: () => stderrParts.join(''),
  };
}

export async function executeCommand(
  command: CommandDefinition,
  argv: string[],
  io: CliIo,
  invocationName = command.name,
): Promise<number> {
  try {
    return await command.run(argv, io);
  } catch (error) {
    if (error instanceof UsageError) {
      writeLine(io.stderr, error.message);
      if (error.helpText) {
        writeLine(io.stderr, error.helpText);
      }
      return EXIT_USAGE;
    }

    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    writeLine(io.stderr, `[${invocationName}] FATAL: ${message}`);
    return EXIT_FAILURE;
  }
}

export function findCommand(name: string): CommandDefinition | undefined {
  return COMMANDS.find((command) => command.name === name || command.aliases.includes(name));
}

async function invokeCommandByName(name: string, argv: string[], io: CliIo): Promise<number> {
  const command = findCommand(name);
  if (!command) {
    throw new Error(`Unknown command: ${name}`);
  }
  return executeCommand(command, argv, io, name);
}

async function captureCommandResult({
  args,
  commandName,
  displayArgs = args,
  name,
}: {
  args: string[];
  commandName: string;
  displayArgs?: string[];
  name: string;
}): Promise<VerificationCheck> {
  const startedAt = Date.now();
  const buffer = createBufferedIo();
  const exitCode = await invokeCommandByName(commandName, args, buffer.io);
  return {
    name,
    command: canonicalCli(commandName, displayArgs),
    exit_code: exitCode,
    stdout: buffer.readStdout(),
    stderr: buffer.readStderr(),
    duration_ms: Date.now() - startedAt,
    status: exitCode === 0 ? 'pass' : 'fail',
  };
}

function runExternalCommand({
  args = [],
  command,
  cwd,
  displayCommand,
  name,
  shell = false,
}: {
  args?: string[];
  command: string;
  cwd: string;
  displayCommand?: string;
  name: string;
  shell?: boolean;
}): VerificationCheck {
  const startedAt = Date.now();
  const result = shell
    ? spawnSync(command, {
        cwd,
        encoding: 'utf8',
        shell: true,
      })
    : spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
      });

  return {
    name,
    command: displayCommand ?? (shell ? command : formatCli([command, ...args])),
    exit_code: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    duration_ms: Date.now() - startedAt,
    status: result.status === 0 ? 'pass' : 'fail',
  };
}

function featureIntakeHelp(): string {
  return [
    'Create a new Feature Dossier for already selected backlog work.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} feature-intake --title <text> --backlog-item-key <key> --backlog-delivery-state <state> --backlog-source <source> --area <name> --owner <owner> --impact <impact> [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --title <text>               Dossier title. Required.',
    '  --backlog-item-key <key>     Selected backlog item key from backlog-engineer. Required.',
    '  --backlog-delivery-state <state>  Backlog delivery state at intake. Required.',
    '                               Allowed: defined, specified, planned, implemented.',
    '  --backlog-source <source>    Repeatable backlog source traceability entry. At least one required.',
    '  --backlog-dependency <key>   Repeatable backlog dependency visible at intake.',
    '  --backlog-blocker <text>     Repeatable backlog blocker visible at intake.',
    '  --area <name>                Area label for frontmatter. Required.',
    '  --owner <name>               Repeatable owner value. At least one required.',
    '  --impact <name>              Repeatable impact value. At least one required.',
    '  --depends-on <id>            Repeatable delivered prerequisite.',
    '  --slug <slug>                Optional dossier slug. Defaults to slugified title.',
    '  --output <path>              Optional dossier output path directly inside docs/features.',
    '  --json                       Emit JSON output.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runFeatureIntakeCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = featureIntakeHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  if (argv.includes('--selected-work') || argv.some((arg) => arg.startsWith('--selected-work='))) {
    throw new UsageError(
      '--selected-work is no longer supported. Use --backlog-item-key, --backlog-delivery-state, and at least one --backlog-source.',
      helpText,
    );
  }
  const title = ensureRequired(takeOption(argv, '--title', null), '--title is required.', helpText);
  const backlogItemKey = ensureRequired(
    takeOption(argv, '--backlog-item-key', null),
    '--backlog-item-key is required.',
    helpText,
  );
  const backlogDeliveryState = ensureEnumValue(
    ensureRequired(
      takeOption(argv, '--backlog-delivery-state', null),
      '--backlog-delivery-state is required.',
      helpText,
    ),
    BACKLOG_DELIVERY_STATES,
    '--backlog-delivery-state',
    helpText,
  );
  const backlogSources = ensureNonEmpty(
    takeManyOptions(argv, '--backlog-source'),
    'At least one --backlog-source is required.',
    helpText,
  );
  const backlogDependencies = takeManyOptions(argv, '--backlog-dependency');
  const backlogBlockers = takeManyOptions(argv, '--backlog-blocker');
  const area = ensureRequired(takeOption(argv, '--area', null), '--area is required.', helpText);
  const owners = takeManyOptions(argv, '--owner');
  const impacts = takeManyOptions(argv, '--impact');
  const dependsOn = takeManyOptions(argv, '--depends-on');
  const output = takeOption(argv, '--output', null);
  const json = hasOption(argv, '--json');
  const slug = takeOption(argv, '--slug', slugify(title)) ?? slugify(title);

  if (owners.length === 0) {
    throw new UsageError('At least one --owner is required.', helpText);
  }
  if (impacts.length === 0) {
    throw new UsageError('At least one --impact is required.', helpText);
  }

  const absRoot = path.resolve(root);
  const absDossiersDir = path.resolve(absRoot, DEFAULT_DOSSIERS_DIR);
  const dossiers = (await fileExists(absDossiersDir))
    ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, {
        strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES,
      })
    : [];
  const featureId = nextFeatureId(dossiers);
  const defaultRelPath = path.join(DEFAULT_DOSSIERS_DIR, `${featureId}-${slug}.md`);
  const outputPath = output ? path.resolve(absRoot, output) : path.resolve(absRoot, defaultRelPath);
  const outputBaseName = path.basename(outputPath);
  const outputDir = path.dirname(outputPath);

  if (!isDossierFile(outputBaseName) || !matchesFeatureFile(featureId, outputBaseName)) {
    throw new UsageError(
      '--output must point to a dossier file named like docs/features/F-XXXX-slug.md for the allocated feature id.',
      helpText,
    );
  }
  if (outputDir !== absDossiersDir) {
    throw new UsageError(
      '--output must point to a dossier file directly inside docs/features for the current repository root.',
      helpText,
    );
  }
  await fs.mkdir(absDossiersDir, { recursive: true });
  const realRoot = await fs.realpath(absRoot);
  const realDossiersDir = await fs.realpath(absDossiersDir);
  const expectedRealDossiersDir = path.join(realRoot, DEFAULT_DOSSIERS_DIR);
  if (realDossiersDir !== expectedRealDossiersDir) {
    throw new UsageError(
      'docs/features must be a real directory inside the repository root and must not be a symlinked path.',
      helpText,
    );
  }
  if (await fileExists(outputPath)) {
    throw new UsageError(
      `Refusing to overwrite existing dossier ${relativeToRoot(absRoot, outputPath)}.`,
      helpText,
    );
  }

  const created = new Date().toISOString().slice(0, 10);
  const markdown = renderInitialDossier({
    area,
    backlogBlockers,
    backlogDeliveryState,
    backlogDependencies,
    backlogItemKey,
    backlogSources,
    created,
    dependsOn,
    featureId,
    impacts,
    owners,
    title,
  });
  await writeTextAtomic(outputPath, markdown);

  const summary = {
    dossier: relativeToRoot(absRoot, outputPath),
    feature_id: featureId,
    backlog_item_key: backlogItemKey,
    backlog_delivery_state: backlogDeliveryState,
    backlog_source_traceability: backlogSources,
    backlog_dependencies: backlogDependencies,
    backlog_blockers: backlogBlockers,
    partial_success: false,
    workflow_next: 'spec-compact',
  };

  const refreshIo = createBufferedIo();
  const refreshExit = await runIndexRefreshCommand(['--root', absRoot], refreshIo.io);
  if (refreshExit !== EXIT_SUCCESS) {
    const refreshStdout = refreshIo.readStdout();
    const refreshStderr = refreshIo.readStderr();
    if (json) {
      writeLine(
        io.stdout,
        JSON.stringify(
          {
            ...summary,
            partial_success: true,
            refresh_exit_code: refreshExit,
            refresh_stdout: refreshStdout.trim() || null,
            refresh_stderr: refreshStderr.trim() || null,
          },
          null,
          2,
        ),
      );
      return refreshExit;
    }
    if (refreshStdout) {
      io.stdout.write(refreshStdout);
    }
    if (refreshStderr) {
      io.stderr.write(refreshStderr);
    }
    writeLine(
      io.stderr,
      '[feature-intake] Dossier was created, but index-refresh failed. Resolve the reported issues before continuing.',
    );
    return refreshExit;
  }

  if (json) {
    writeLine(io.stdout, JSON.stringify(summary, null, 2));
    return EXIT_SUCCESS;
  }

  writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
  writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
  writeLine(io.stdout, `[feature-intake] backlog_item_key=${backlogItemKey}`);
  writeLine(io.stdout, `[feature-intake] backlog_delivery_state=${backlogDeliveryState}`);
  writeLine(io.stdout, '[feature-intake] next=dossier-local spec-compact');
  return EXIT_SUCCESS;
}

function syncIndexHelp(): string {
  return [
    'Regenerate docs/ssot/index.md from Feature Dossier frontmatter.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} sync-index [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    `  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runSyncIndexCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = syncIndexHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossiersDir =
    takeOption(argv, '--dossiers-dir', DEFAULT_DOSSIERS_DIR) ?? DEFAULT_DOSSIERS_DIR;
  const indexFile = takeOption(argv, '--index-file', DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
  const absRoot = path.resolve(root);
  const absIndex = path.resolve(absRoot, indexFile);
  const indexDir = path.dirname(absIndex);

  const dossiers = await readAllDossiers(absRoot, dossiersDir, {
    strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES,
  });
  const featuresBlock = [
    '| ID | Title | Status | Coverage | Area | Depends on | Impacts | Dossier |',
    '|---|---|---|---|---|---|---|---|',
    ...(dossiers.length > 0
      ? dossiers.map((dossier) => featureRow(dossier, indexDir))
      : ['| — | — | — | — | — | — | — | — |']),
  ].join('\n');

  const graphBlock = buildMermaidGraph(dossiers);

  let content: string;
  try {
    content = await readText(absIndex);
  } catch {
    content = ensureIndexSkeleton();
  }

  const refreshedBlocks = replaceBlock(
    replaceBlock(
      content,
      '<!-- BEGIN GENERATED FEATURES -->',
      '<!-- END GENERATED FEATURES -->',
      featuresBlock,
    ),
    '<!-- BEGIN GENERATED DEP_GRAPH -->',
    '<!-- END GENERATED DEP_GRAPH -->',
    graphBlock,
  );

  if (refreshedBlocks === content) {
    writeLine(
      io.stdout,
      `[sync-index] ${indexFile} already up to date (${dossiers.length} dossier(s)).`,
    );
    return EXIT_SUCCESS;
  }

  const stamped = refreshedBlocks.replace(
    /_Last sync: .*?_\n/,
    `_Last sync: ${new Date().toISOString()}_\n`,
  );
  await writeTextAtomic(absIndex, stamped);
  writeLine(io.stdout, `[sync-index] Updated ${indexFile} from ${dossiers.length} dossier(s).`);
  return EXIT_SUCCESS;
}

function indexRefreshHelp(): string {
  return [
    'Run sync-index first, then lint-dossiers with --update-index.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} index-refresh [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    `  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runIndexRefreshCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = indexRefreshHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const syncExit = await invokeCommandByName('sync-index', argv, io);
  if (syncExit !== EXIT_SUCCESS) {
    return syncExit;
  }

  const lintArgs = argv.includes('--update-index') ? argv : [...argv, '--update-index'];
  return invokeCommandByName('lint-dossiers', lintArgs, io);
}

function lintDossiersHelp(): string {
  return [
    'Validate Feature Dossiers and optionally refresh the generated Red flags block.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} lint-dossiers [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    `  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
    '  --update-index               Refresh the generated Red flags block.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runLintDossiersCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = lintDossiersHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const dossiersDir =
    takeOption(argv, '--dossiers-dir', DEFAULT_DOSSIERS_DIR) ?? DEFAULT_DOSSIERS_DIR;
  const indexFile = takeOption(argv, '--index-file', DEFAULT_INDEX_FILE) ?? DEFAULT_INDEX_FILE;
  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const updateIndex = hasOption(argv, '--update-index');
  const absRoot = path.resolve(root);
  const absIndex = path.resolve(absRoot, indexFile);

  let dossiers: DossierRecord[] = [];
  try {
    dossiers = await readAllDossiers(absRoot, dossiersDir, {
      strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES,
    });
  } catch (error) {
    writeLine(
      io.stderr,
      `[lint-dossiers] ERROR: cannot read dossiers directory: ${path.resolve(absRoot, dossiersDir)}`,
    );
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    writeLine(io.stderr, message);
    return EXIT_FAILURE;
  }

  const findings = analyzeDossiers(dossiers);
  const errors = findings.filter((finding) => finding.level === 'error');

  writeLine(io.stdout, renderLintSummary(findings, dossiers.length));

  if (updateIndex) {
    try {
      const indexText = await readText(absIndex);
      const updatedIndex = replaceBlock(
        indexText,
        '<!-- BEGIN GENERATED RED_FLAGS -->',
        '<!-- END GENERATED RED_FLAGS -->',
        buildRedFlagsBlock(findings),
      );
      if (updatedIndex === indexText) {
        writeLine(io.stdout, `[lint-dossiers] Red flags block already up to date in ${indexFile}.`);
      } else {
        await writeTextAtomic(absIndex, updatedIndex);
        writeLine(io.stdout, `[lint-dossiers] Updated Red flags block in ${indexFile}.`);
      }
    } catch {
      writeLine(
        io.stderr,
        `[lint-dossiers] WARN: Could not update index red flags block (${indexFile}).`,
      );
    }
  }

  return errors.length > 0 ? 2 : EXIT_SUCCESS;
}

function dependencyGraphHelp(): string {
  return [
    'Output a Mermaid dependency graph from dossier frontmatter.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} dependency-graph [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runDependencyGraphCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = dependencyGraphHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossiersDir =
    takeOption(argv, '--dossiers-dir', DEFAULT_DOSSIERS_DIR) ?? DEFAULT_DOSSIERS_DIR;
  const absRoot = path.resolve(root);
  const dossiers = await readAllDossiers(absRoot, dossiersDir, {
    strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES,
  });
  writeLine(io.stdout, buildMermaidGraph(dossiers));
  return EXIT_SUCCESS;
}

function coverageAuditHelp(): string {
  return [
    'Check that each acceptance criterion ID is referenced in tests.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} coverage-audit [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Audit a single dossier.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    '  --changed-only               Audit dossiers touched by the current change set.',
    '  --base <ref>                 Git base ref for --changed-only.',
    '  --strict-statuses <list>     Comma-separated statuses treated as strict by default.',
    '  --orphans-scope <scope>      auto | dossier | repo | none. Defaults to auto.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runCoverageAuditCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = coverageAuditHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = takeOption(argv, '--dossier', null);
  const dossiersDir =
    takeOption(argv, '--dossiers-dir', DEFAULT_DOSSIERS_DIR) ?? DEFAULT_DOSSIERS_DIR;
  const changedOnly = hasOption(argv, '--changed-only');
  const base = takeOption(argv, '--base', null);
  const strictStatusesRaw = takeOption(argv, '--strict-statuses', null);
  const strictStatuses = strictStatusesRaw
    ? new Set(
        strictStatusesRaw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      )
    : DEFAULT_STRICT_COVERAGE_STATUSES;
  const orphansScope = takeOption(argv, '--orphans-scope', 'auto') ?? 'auto';
  const absRoot = path.resolve(root);

  if (dossier && changedOnly) {
    throw new UsageError('--dossier and --changed-only cannot be used together.', helpText);
  }

  const selectedDossiers: string[] = [];
  if (dossier) {
    selectedDossiers.push(path.resolve(absRoot, dossier));
  } else if (changedOnly) {
    const selected = await selectChangedDossiers({
      absRoot,
      dossiersDir,
      baseRef: resolveBaseRef(absRoot, base),
    });
    if (selected.length === 0) {
      writeLine(io.stdout, 'Coverage audit: 0 dossier(s) selected by --changed-only.');
      writeLine(io.stdout, 'Nothing to audit.');
      return EXIT_SUCCESS;
    }
    selectedDossiers.push(...selected);
  } else {
    const absDossiersDir = path.resolve(absRoot, dossiersDir);
    for (const fileName of await listDossierFiles(absDossiersDir)) {
      selectedDossiers.push(path.join(absDossiersDir, fileName));
    }
  }

  const testFiles = await walk(absRoot, [], { includeFile: isTestFile, rootDir: absRoot });
  const testContents = new Map<string, string>();
  for (const testFile of testFiles) {
    try {
      testContents.set(testFile, await readText(testFile));
    } catch {
      // Ignore unreadable files.
    }
  }

  const results: CoverageAuditResult[] = [];
  const selectedFeatureIds = new Set<string>();
  for (const dossierPath of selectedDossiers) {
    const record = await readDossierRecord(dossierPath, {
      root: absRoot,
      strictStatuses,
    });
    const frontmatter = record.frontmatter ?? {};
    const featureId =
      typeof frontmatter.id === 'string' ? frontmatter.id : path.basename(dossierPath, '.md');
    selectedFeatureIds.add(featureId);

    const found = new Map<string, string[]>();
    const missing: string[] = [];
    for (const acId of record.acIds) {
      const hits: string[] = [];
      for (const [testFile, content] of testContents.entries()) {
        if (content.includes(acId)) {
          hits.push(toRepoRelativePath(absRoot, testFile));
        }
      }
      if (hits.length === 0) {
        missing.push(acId);
      } else {
        found.set(acId, hits);
      }
    }

    results.push({
      dossier: record.relPath,
      featureId,
      title: frontmatterString(frontmatter, 'title'),
      status: typeof frontmatter.status === 'string' ? frontmatter.status : null,
      coverageGate: record.coverageGate,
      acCount: record.acIds.length,
      found,
      missing,
    });
  }

  const orphanMode = resolveOrphanScope({ changedOnly, dossier, orphansScope });
  const allAuditedAcs = new Set(
    results.flatMap((result) => [...result.found.keys(), ...result.missing]),
  );
  const orphan = new Map<string, Set<string>>();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;

  for (const [testFile, content] of testContents.entries()) {
    for (;;) {
      const match = regex.exec(content);
      if (!match) {
        break;
      }
      const acId = `AC-F${match[1]}-${(match[2] ?? '').padStart(2, '0')}`;
      if (allAuditedAcs.has(acId)) {
        continue;
      }

      if (orphanMode === 'none') {
        continue;
      }

      const featureId = extractFeatureIdFromAc(acId);
      const inScope =
        orphanMode === 'repo' ||
        (orphanMode === 'dossier' && featureId && selectedFeatureIds.has(featureId));
      if (!inScope) {
        continue;
      }

      const relPath = toRepoRelativePath(absRoot, testFile);
      if (!orphan.has(acId)) {
        orphan.set(acId, new Set());
      }
      orphan.get(acId)?.add(relPath);
    }
  }

  const blockingMissing = results.reduce(
    (total, result) => total + (result.coverageGate === 'strict' ? result.missing.length : 0),
    0,
  );
  const informationalMissing = results.reduce(
    (total, result) => total + (result.coverageGate !== 'strict' ? result.missing.length : 0),
    0,
  );

  writeLine(
    io.stdout,
    `Coverage audit: ${results.length} dossier(s), ${testFiles.length} test file(s) scanned. Blocking missing: ${blockingMissing}. Informational missing: ${informationalMissing}. Orphans: ${orphan.size} (scope: ${orphanMode}).`,
  );

  for (const result of results) {
    writeLine(io.stdout, '');
    writeLine(io.stdout, `== ${result.dossier} ==`);
    writeLine(
      io.stdout,
      `Status: ${result.status ?? 'unknown'} | coverage gate: ${result.coverageGate} | AC count: ${result.acCount}`,
    );

    if (result.missing.length === 0) {
      writeLine(io.stdout, 'All audited AC IDs are referenced in tests.');
    } else {
      const label = result.coverageGate === 'strict' ? 'Blocking' : 'Informational';
      writeLine(io.stdout, `${label} missing AC reference(s):`);
      for (const acId of result.missing) {
        writeLine(io.stdout, `- ${acId}`);
      }
    }
  }

  if (orphan.size > 0) {
    writeLine(io.stdout, '');
    writeLine(io.stdout, `== Orphan AC references (${orphanMode} scope) ==`);
    for (const [acId, files] of [...orphan.entries()].sort((left, right) =>
      left[0].localeCompare(right[0]),
    )) {
      writeLine(io.stdout, `- ${acId}: ${[...files].sort().join(', ')}`);
    }
  }

  return blockingMissing > 0 ? 3 : EXIT_SUCCESS;
}

function debtAuditHelp(): string {
  return [
    'Check for explicit unresolved debt markers.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} debt-audit [options]`,
    `  ${CLI_DISPLAY_NAME} marker-audit [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --changed-only               Scan only changed files.',
    '  --base <ref>                 Git base ref for --changed-only.',
    '  --paths <csv>                Comma-separated paths to scan.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runDebtAuditCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = debtAuditHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const changedOnly = hasOption(argv, '--changed-only');
  const base = takeOption(argv, '--base', null);
  const rawPaths = takeOption(argv, '--paths', '') ?? '';
  const paths = rawPaths
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const absRoot = path.resolve(root);

  let filesToScan: string[];
  if (paths.length > 0) {
    filesToScan = await collectExplicitPaths(absRoot, paths);
  } else if (changedOnly) {
    if (!inGitRepo(absRoot)) {
      throw new UsageError('--changed-only requires a git repository.', helpText);
    }
    const baseRef = resolveBaseRef(absRoot, base);
    filesToScan = getChangedFiles(absRoot, baseRef).map((filePath) =>
      normalizeRepoPath(absRoot, filePath),
    );
  } else {
    filesToScan = await collectDefaultFiles(absRoot);
  }

  const findings: Array<{ file: string; line: number; marker: string; text: string }> = [];
  for (const filePath of filesToScan) {
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    const relPath = relativeToRoot(absRoot, filePath) || path.basename(filePath);
    const lines = content.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (!shouldFlagLine(filePath, line)) {
        continue;
      }
      const markerMatch = line.match(MARKER_PATTERN);
      findings.push({
        file: relPath,
        line: index + 1,
        marker: markerMatch?.[1] ?? 'MARKER',
        text: line.trim(),
      });
    }
  }

  writeLine(
    io.stdout,
    `Marker audit (debt-audit compatibility): ${filesToScan.length} file(s) scanned.`,
  );
  writeLine(io.stdout, 'Scope: explicit debt markers only; manual debt review is still required.');

  if (findings.length === 0) {
    writeLine(io.stdout, 'No unresolved debt markers found.');
    return EXIT_SUCCESS;
  }

  writeLine(io.stderr, `Found ${findings.length} unresolved debt marker(s):`);
  for (const finding of findings) {
    writeLine(io.stderr, `- ${finding.file}:${finding.line} [${finding.marker}] ${finding.text}`);
  }
  return 2;
}

function contractDriftAuditHelp(): string {
  return [
    'Detect executable contract changes without matching implementation follow-up.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} contract-drift-audit --dossier <path> [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Dossier to audit.',
    '  --base <ref>                 Git base ref for baseline resolution.',
    '  --before-file <path>         Explicit baseline markdown file.',
    '  --output <path>              Artifact output path.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runContractDriftAuditCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = contractDriftAuditHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = ensureRequired(
    takeOption(argv, '--dossier', null),
    '--dossier is required.',
    helpText,
  );
  const base = takeOption(argv, '--base', null);
  const beforeFile = takeOption(argv, '--before-file', null);
  const output = takeOption(argv, '--output', null);
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier);
  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const relDossier = dossierRecord.relPath;
  const featureId = frontmatterString(
    dossierRecord.frontmatter,
    'id',
    path.basename(absDossier, '.md'),
  );

  let beforeText: string | null = null;
  let baselineLabel: string | null = null;
  if (beforeFile) {
    const absBefore = path.resolve(absRoot, beforeFile);
    beforeText = await fs.readFile(absBefore, 'utf8');
    baselineLabel = relativeToRoot(absRoot, absBefore);
  } else if (inGitRepo(absRoot)) {
    const baseRef = resolveBaseRef(absRoot, base);
    const baseline = getBaselineFromGit(absRoot, relDossier, baseRef);
    beforeText = baseline?.text ?? null;
    baselineLabel = baseline?.label ?? null;
  }

  if (beforeText === null) {
    throw new UsageError(
      'Could not resolve a baseline dossier snapshot. Use --before-file or run inside a git repository.',
      helpText,
    );
  }

  const beforeSections = parseTopLevelSections(beforeText);
  const afterSections = parseTopLevelSections(dossierRecord.markdown);
  const beforeAcIds = new Set(extractAcIds(beforeText));
  const afterAcIds = new Set(dossierRecord.acIds);

  const addedAcIds = [...afterAcIds].filter((acId) => !beforeAcIds.has(acId)).sort();
  const removedAcIds = [...beforeAcIds].filter((acId) => !afterAcIds.has(acId)).sort();
  const changedExecutableSections = hasExecutableSectionChange(beforeSections, afterSections);

  const beforeStatusMatch = String(beforeText).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const beforeFrontmatter = beforeStatusMatch ? (beforeStatusMatch[1] ?? '') : '';
  const afterFrontmatter =
    String(dossierRecord.markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const frontmatterChanged = ['depends_on', 'impacts', 'coverage_gate']
    .filter(
      (key) =>
        new RegExp(`^\\s*${key}:.*$`, 'm').test(beforeFrontmatter) ||
        new RegExp(`^\\s*${key}:.*$`, 'm').test(afterFrontmatter),
    )
    .filter((key) => {
      const beforeLine = beforeFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, 'm'))?.[0] ?? '';
      const afterLine = afterFrontmatter.match(new RegExp(`^\\s*${key}:.*$`, 'm'))?.[0] ?? '';
      return beforeLine.trim() !== afterLine.trim();
    });

  const executableContractChanged =
    addedAcIds.length > 0 ||
    removedAcIds.length > 0 ||
    changedExecutableSections.length > 0 ||
    frontmatterChanged.length > 0;

  const maturityRequiresAudit = ['planned', 'in_progress', 'done'].includes(
    String(dossierRecord.frontmatter.status),
  );
  const changedFiles = inGitRepo(absRoot)
    ? getChangedFiles(absRoot, resolveBaseRef(absRoot, base))
    : [];
  const codeFollowUpFiles = changedFiles.filter(
    (filePath) =>
      !filePath.startsWith('docs/') &&
      !filePath.startsWith('.dossier/') &&
      filePath !== 'AGENTS.md',
  );
  const architectureFollowUpFiles = changedFiles.filter(
    (filePath) => filePath === 'docs/architecture/system.md' || filePath.startsWith('docs/adr/'),
  );
  const requiresFollowUp =
    executableContractChanged && maturityRequiresAudit && codeFollowUpFiles.length === 0;

  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    feature_id: featureId,
    dossier: relDossier,
    current_commit: inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null,
    baseline: baselineLabel,
    executable_contract_changed: executableContractChanged,
    maturity_requires_audit: maturityRequiresAudit,
    added_ac_ids: addedAcIds,
    removed_ac_ids: removedAcIds,
    changed_executable_sections: changedExecutableSections,
    frontmatter_changes: frontmatterChanged,
    changed_files: changedFiles,
    code_follow_up_files: codeFollowUpFiles,
    architecture_follow_up_files: architectureFollowUpFiles,
    requires_follow_up: requiresFollowUp,
  };

  const outputPath = output
    ? path.resolve(absRoot, output)
    : path.join(absRoot, '.dossier', 'drift', featureId, `${Date.now()}.json`);
  await writeJsonAtomic(outputPath, artifact);

  writeLine(io.stdout, `[contract-drift-audit] feature=${featureId} baseline=${baselineLabel}`);
  writeLine(
    io.stdout,
    `[contract-drift-audit] executable_contract_changed=${executableContractChanged ? 'yes' : 'no'} maturity_requires_audit=${maturityRequiresAudit ? 'yes' : 'no'} requires_follow_up=${requiresFollowUp ? 'yes' : 'no'}`,
  );
  if (addedAcIds.length > 0) {
    writeLine(io.stdout, `Added AC IDs: ${addedAcIds.join(', ')}`);
  }
  if (removedAcIds.length > 0) {
    writeLine(io.stdout, `Removed AC IDs: ${removedAcIds.join(', ')}`);
  }
  if (changedExecutableSections.length > 0) {
    writeLine(io.stdout, `Changed executable sections: ${changedExecutableSections.join(' | ')}`);
  }
  if (frontmatterChanged.length > 0) {
    writeLine(io.stdout, `Changed frontmatter keys: ${frontmatterChanged.join(', ')}`);
  }
  writeLine(io.stdout, `Artifact: ${relativeToRoot(absRoot, outputPath)}`);

  if (requiresFollowUp) {
    writeLine(
      io.stderr,
      '[contract-drift-audit] Executable contract changed without matching code/test/runtime follow-up in the same change set.',
    );
    return 2;
  }
  return EXIT_SUCCESS;
}

function reviewArtifactHelp(): string {
  return [
    'Persist an independent review result as a durable artifact.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} review-artifact --dossier <path> --step <name> --verdict PASS|FAIL [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Dossier under review.',
    '  --step <name>                Workflow step under review.',
    '  --verdict <PASS|FAIL>        Review verdict.',
    '  --reviewer <name>            Reviewer identifier.',
    '  --reviewed-commit <sha>      Explicit reviewed commit.',
    '  --notes <text>               Free-form reviewer notes.',
    '  --output <path>              Artifact output path.',
    '  --must-fix <text>            Repeatable must-fix finding.',
    '  --should-fix <text>          Repeatable should-fix finding.',
    '  --evidence <text>            Repeatable evidence pointer.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runReviewArtifactCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = reviewArtifactHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = ensureRequired(
    takeOption(argv, '--dossier', null),
    '--dossier is required.',
    helpText,
  );
  const step = ensureRequired(takeOption(argv, '--step', null), '--step is required.', helpText);
  const verdict = ensureRequired(
    takeOption(argv, '--verdict', null),
    '--verdict is required.',
    helpText,
  ).toUpperCase();
  const reviewer = takeOption(argv, '--reviewer', 'independent-reviewer') ?? 'independent-reviewer';
  const reviewedCommit = takeOption(argv, '--reviewed-commit', null);
  const notes = takeOption(argv, '--notes', '') ?? '';
  const output = takeOption(argv, '--output', null);
  const mustFix = takeManyOptions(argv, '--must-fix');
  const shouldFix = takeManyOptions(argv, '--should-fix');
  const evidence = takeManyOptions(argv, '--evidence');
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier);

  if (!['PASS', 'FAIL'].includes(verdict)) {
    throw new UsageError('--verdict must be PASS or FAIL.', helpText);
  }
  if (verdict === 'PASS' && mustFix.length > 0) {
    throw new UsageError('PASS review artifacts cannot contain --must-fix findings.', helpText);
  }

  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const featureId = frontmatterString(
    dossierRecord.frontmatter,
    'id',
    path.basename(absDossier, '.md'),
  );
  const commit = reviewedCommit || (inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null);
  if (!commit) {
    throw new UsageError(
      'Could not determine reviewed commit. Provide --reviewed-commit when git metadata is unavailable.',
      helpText,
    );
  }

  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    reviewer,
    step,
    dossier: dossierRecord.relPath,
    feature_id: featureId,
    reviewed_commit: commit,
    verdict,
    findings: {
      must_fix: mustFix,
      should_fix: shouldFix,
      evidence,
    },
    notes,
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'reviews',
    featureId,
    `${step}-${commit.slice(0, 12)}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  writeLine(io.stdout, `[review-artifact] Wrote ${relativeToRoot(absRoot, outputPath)}`);
  writeLine(
    io.stdout,
    `[review-artifact] verdict=${verdict} step=${step} feature=${featureId} commit=${commit}`,
  );
  return EXIT_SUCCESS;
}

function dossierStepCloseHelp(): string {
  return [
    'Machine-checkable closure gate for a mutating dossier step.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} dossier-step-close --dossier <path> --step <name> --verify-artifact <path> --review-artifact <path> [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Dossier being closed.',
    '  --step <name>                Workflow step being closed.',
    '  --verify-artifact <path>     Verification artifact path.',
    '  --review-artifact <path>     Review artifact path.',
    '  --next-step <name>           Override computed next step.',
    '  --output <path>              Step artifact output path.',
    '  --allow-dirty                Skip clean-worktree enforcement.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runDossierStepCloseCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = dossierStepCloseHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = ensureRequired(
    takeOption(argv, '--dossier', null),
    '--dossier is required.',
    helpText,
  );
  const step = ensureRequired(takeOption(argv, '--step', null), '--step is required.', helpText);
  const verifyArtifact = ensureRequired(
    takeOption(argv, '--verify-artifact', null),
    '--verify-artifact is required.',
    helpText,
  );
  const reviewArtifact = ensureRequired(
    takeOption(argv, '--review-artifact', null),
    '--review-artifact is required.',
    helpText,
  );
  const nextStep = takeOption(argv, '--next-step', null);
  const output = takeOption(argv, '--output', null);
  const allowDirty = hasOption(argv, '--allow-dirty');
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier);

  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const featureId = frontmatterString(
    dossierRecord.frontmatter,
    'id',
    path.basename(absDossier, '.md'),
  );
  const blockers: string[] = [];

  let verify: VerifyArtifactShape | null = null;
  try {
    verify = await readJsonArtifact<VerifyArtifactShape>(absRoot, verifyArtifact);
  } catch (error) {
    blockers.push(
      `Could not read verification artifact ${relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact))} (${error instanceof Error ? error.message : String(error)}).`,
    );
  }

  let review: ReviewArtifactShape | null = null;
  try {
    review = await readJsonArtifact<ReviewArtifactShape>(absRoot, reviewArtifact);
  } catch (error) {
    blockers.push(
      `Could not read review artifact ${relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact))} (${error instanceof Error ? error.message : String(error)}).`,
    );
  }

  const currentCommit = inGitRepo(absRoot)
    ? getCurrentCommit(absRoot)
    : (review?.reviewed_commit ?? verify?.current_commit ?? null);

  if (verify && verify.status !== 'pass') {
    blockers.push(
      `Verification artifact does not report status=pass (got ${String(verify.status)}).`,
    );
  }
  if (verify && verify.step !== step) {
    blockers.push(
      `Verification artifact step mismatch: expected ${step}, got ${String(verify.step)}.`,
    );
  }
  if (verify?.feature_id && verify.feature_id !== featureId) {
    blockers.push(
      `Verification artifact feature mismatch: expected ${featureId}, got ${verify.feature_id}.`,
    );
  }

  if (review && review.verdict !== 'PASS') {
    blockers.push(`Review artifact verdict is ${String(review.verdict)}, expected PASS.`);
  }
  if (review && review.step !== step) {
    blockers.push(`Review artifact step mismatch: expected ${step}, got ${String(review.step)}.`);
  }
  if (review?.feature_id && review.feature_id !== featureId) {
    blockers.push(
      `Review artifact feature mismatch: expected ${featureId}, got ${review.feature_id}.`,
    );
  }
  if (Array.isArray(review?.findings?.must_fix) && review.findings.must_fix.length > 0) {
    blockers.push('Review artifact still contains must-fix findings.');
  }

  if (currentCommit && review?.reviewed_commit && review.reviewed_commit !== currentCommit) {
    blockers.push(
      `Review freshness is stale for current commit ${currentCommit}; review artifact is tied to ${review.reviewed_commit}.`,
    );
  }
  if (currentCommit && verify?.current_commit && verify.current_commit !== currentCommit) {
    blockers.push(
      `Verification artifact is stale for current commit ${currentCommit}; verify artifact is tied to ${verify.current_commit}.`,
    );
  }

  if (inGitRepo(absRoot) && !allowDirty) {
    const dirtyPaths = getDirtyPaths(absRoot).filter(
      (filePath) => !filePath.startsWith('.dossier/'),
    );
    if (dirtyPaths.length > 0) {
      blockers.push(`Worktree is dirty outside .dossier/: ${dirtyPaths.join(', ')}`);
    }
  }

  const processComplete = blockers.length === 0;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    feature_id: featureId,
    dossier: dossierRecord.relPath,
    step,
    dossier_status: dossierRecord.frontmatter.status ?? null,
    current_commit: currentCommit,
    verification_artifact: relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact)),
    review_artifact: relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact)),
    review_fresh_for_commit: Boolean(currentCommit && review?.reviewed_commit === currentCommit),
    process_complete: processComplete,
    blockers,
    next_step: nextStep || defaultNextStep(dossierRecord.frontmatter.status, step),
  };

  const defaultOutput = path.join(absRoot, '.dossier', 'steps', featureId, `${step}.json`);
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  writeLine(io.stdout, `[dossier-step-close] Wrote ${relativeToRoot(absRoot, outputPath)}`);
  writeLine(
    io.stdout,
    `[dossier-step-close] process_complete=${processComplete ? 'yes' : 'no'} step=${step} feature=${featureId}`,
  );
  if (blockers.length > 0) {
    writeLine(io.stderr, '[dossier-step-close] blockers:');
    for (const blocker of blockers) {
      writeLine(io.stderr, `- ${blocker}`);
    }
    return 2;
  }
  return EXIT_SUCCESS;
}

function dossierVerifyHelp(): string {
  return [
    'Run the canonical verification bundle and persist its JSON artifact.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} dossier-verify [options]`,
    '',
    'Options:',
    '  --root <path>                     Repository root. Defaults to cwd.',
    '  --step <name>                     Workflow step. Defaults to implementation.',
    '  --dossier <path>                  Limit verification to one dossier.',
    '  --changed-only                    Verify changed dossiers only.',
    '  --base <ref>                      Git base ref for --changed-only.',
    '  --output <path>                   Artifact output path.',
    '  --skip-sync-index                 Skip sync-index in the verification bundle.',
    '  --skip-diff-check                 Skip git diff --check.',
    '  --coverage-orphans-scope <scope>  Scope for coverage orphan detection.',
    '  --extra <command>                 Repeatable extra shell command.',
    '  -h, --help                        Show help.',
  ].join('\n');
}

async function runDossierVerifyCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = dossierVerifyHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const step = takeOption(argv, '--step', 'implementation') ?? 'implementation';
  const dossier = takeOption(argv, '--dossier', null);
  const changedOnly = hasOption(argv, '--changed-only');
  const base = takeOption(argv, '--base', null);
  const output = takeOption(argv, '--output', null);
  const skipSyncIndex = hasOption(argv, '--skip-sync-index');
  const skipDiffCheck = hasOption(argv, '--skip-diff-check');
  const coverageOrphansScope = takeOption(argv, '--coverage-orphans-scope', 'auto') ?? 'auto';
  const extra = takeManyOptions(argv, '--extra');
  const absRoot = path.resolve(root);

  if (dossier && changedOnly) {
    throw new UsageError('--dossier and --changed-only cannot be used together.', helpText);
  }

  let featureId = 'global';
  let dossierRelPath: string | null = null;
  if (dossier) {
    const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), {
      root: absRoot,
    });
    featureId = frontmatterString(
      dossierRecord.frontmatter,
      'id',
      path.basename(dossierRecord.absPath, '.md'),
    );
    dossierRelPath = dossierRecord.relPath;
  }

  const checks: VerificationCheck[] = [];
  if (!skipSyncIndex) {
    checks.push(
      await captureCommandResult({
        name: 'sync-index',
        commandName: 'sync-index',
        args: ['--root', absRoot],
        displayArgs: ['--root', '.'],
      }),
    );
  }

  checks.push(
    await captureCommandResult({
      name: 'lint-dossiers',
      commandName: 'lint-dossiers',
      args: ['--root', absRoot],
      displayArgs: ['--root', '.'],
    }),
  );

  const coverageArgs = ['--root', absRoot, '--orphans-scope', coverageOrphansScope];
  const coverageDisplayArgs = ['--root', '.', '--orphans-scope', coverageOrphansScope];
  if (dossierRelPath) {
    coverageArgs.push('--dossier', dossierRelPath);
    coverageDisplayArgs.push('--dossier', dossierRelPath);
  } else if (changedOnly) {
    coverageArgs.push('--changed-only');
    coverageDisplayArgs.push('--changed-only');
    if (base) {
      coverageArgs.push('--base', base);
      coverageDisplayArgs.push('--base', base);
    }
  }
  checks.push(
    await captureCommandResult({
      name: 'coverage-audit',
      commandName: 'coverage-audit',
      args: coverageArgs,
      displayArgs: coverageDisplayArgs,
    }),
  );

  const debtArgs = ['--root', absRoot];
  const debtDisplayArgs = ['--root', '.'];
  if (inGitRepo(absRoot) && (dossierRelPath || changedOnly)) {
    debtArgs.push('--changed-only');
    debtDisplayArgs.push('--changed-only');
    if (base) {
      debtArgs.push('--base', base);
      debtDisplayArgs.push('--base', base);
    }
  } else if (dossierRelPath) {
    debtArgs.push('--paths', dossierRelPath);
    debtDisplayArgs.push('--paths', dossierRelPath);
  }
  checks.push(
    await captureCommandResult({
      name: 'debt-audit',
      commandName: 'debt-audit',
      args: debtArgs,
      displayArgs: debtDisplayArgs,
    }),
  );

  if (inGitRepo(absRoot) && !skipDiffCheck) {
    checks.push(
      runExternalCommand({
        name: 'git-diff-check',
        command: 'git',
        args: ['diff', '--check'],
        cwd: absRoot,
        displayCommand: 'git diff --check',
      }),
    );
  }

  for (const extraCommand of extra) {
    checks.push(
      runExternalCommand({
        name: `extra:${extraCommand}`,
        command: extraCommand,
        cwd: absRoot,
        shell: true,
        displayCommand: extraCommand,
      }),
    );
  }

  const overallStatus = checks.every((check) => check.status === 'pass') ? 'pass' : 'fail';
  const currentCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    step,
    feature_id: featureId,
    dossier: dossierRelPath,
    current_commit: currentCommit,
    status: overallStatus,
    checks,
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'verification',
    featureId,
    `${step}-${currentCommit ? currentCommit.slice(0, 12) : 'workspace'}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  writeLine(
    io.stdout,
    `[dossier-verify] status=${overallStatus} step=${step} feature=${featureId}`,
  );
  writeLine(io.stdout, `[dossier-verify] artifact=${relativeToRoot(absRoot, outputPath)}`);
  for (const check of checks) {
    writeLine(
      io.stdout,
      `- ${check.name}: ${check.status} (exit ${check.exit_code}, ${check.duration_ms} ms)`,
    );
  }

  return overallStatus === 'pass' ? EXIT_SUCCESS : 2;
}

function nextStepHelp(): string {
  return [
    'Return the next dossier-local workflow action for already selected work.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} next-step [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Resolve next step for one dossier. Required when multiple dossiers exist.',
    '  --json                       Emit JSON output.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

async function runNextStepCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = nextStepHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = takeOption(argv, '--dossier', null);
  const json = hasOption(argv, '--json');
  const absRoot = path.resolve(root);
  const absDossiersDir = path.resolve(absRoot, DEFAULT_DOSSIERS_DIR);
  const dossiers = (await fileExists(absDossiersDir))
    ? await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, {
        strictStatuses: DEFAULT_STRICT_COVERAGE_STATUSES,
      })
    : [];

  if (!dossier && dossiers.length > 1) {
    throw new UsageError(
      'When more than one dossier exists, --dossier is required for next-step.',
      helpText,
    );
  }

  const target = dossier
    ? await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot })
    : (dossiers[0] ?? null);

  let latestStepArtifact: StepArtifactShape | null = null;
  let latestReviewArtifact: ReviewArtifactShape | null = null;
  let currentCommit: string | null = null;
  let dirtyWorktree = false;
  if (inGitRepo(absRoot)) {
    currentCommit = getCurrentCommit(absRoot);
    dirtyWorktree = hasDirtyWorktree(absRoot);
  }

  if (target) {
    const featureId = frontmatterString(
      target.frontmatter,
      'id',
      path.basename(target.absPath, '.md'),
    );
    latestStepArtifact = (await readLatestJsonFile(
      path.join(absRoot, '.dossier', 'steps', featureId),
    )) as StepArtifactShape | null;
    latestReviewArtifact = (await readLatestJsonFile(
      path.join(absRoot, '.dossier', 'reviews', featureId),
    )) as ReviewArtifactShape | null;
  }

  const workflowNext =
    latestStepArtifact?.process_complete === false
      ? (latestStepArtifact.next_step ?? null)
      : target
        ? statusToNextStep(target.frontmatter.status)
        : null;

  const blockers =
    latestStepArtifact?.process_complete === false && Array.isArray(latestStepArtifact.blockers)
      ? latestStepArtifact.blockers.filter((value): value is string => typeof value === 'string')
      : target
        ? []
        : [
            'No active dossier found. Select backlog work with backlog-engineer and create a dossier via feature-intake before using next-step.',
          ];
  const reviewFreshness = latestReviewArtifact
    ? currentCommit && latestReviewArtifact.reviewed_commit !== currentCommit
      ? `stale for current commit ${currentCommit}`
      : `valid for commit ${latestReviewArtifact.reviewed_commit}`
    : 'no review artifact found';

  const summary = {
    target_dossier: target ? target.relPath : null,
    dossier_status:
      typeof target?.frontmatter.status === 'string' ? target.frontmatter.status : null,
    workflow_next: workflowNext,
    blocking_gate: blockers,
    uncommitted_work: dirtyWorktree,
    review_freshness: reviewFreshness,
    process_complete: latestStepArtifact ? Boolean(latestStepArtifact.process_complete) : null,
  };

  if (json) {
    writeLine(io.stdout, JSON.stringify(summary, null, 2));
    return EXIT_SUCCESS;
  }

  writeLine(io.stdout, `Workflow next: ${summary.workflow_next ?? 'unknown'}`);
  writeLine(io.stdout, `Target dossier: ${summary.target_dossier ?? 'none selected'}`);
  writeLine(io.stdout, `Dossier status: ${summary.dossier_status ?? 'n/a'}`);
  writeLine(
    io.stdout,
    `Blocking gate: ${summary.blocking_gate.length > 0 ? summary.blocking_gate.join(' | ') : 'none recorded'}`,
  );
  writeLine(io.stdout, `Uncommitted work: ${summary.uncommitted_work ? 'yes' : 'no'}`);
  writeLine(io.stdout, `Review freshness: ${summary.review_freshness}`);
  writeLine(
    io.stdout,
    `Process-complete: ${summary.process_complete === null ? 'unknown' : summary.process_complete ? 'yes' : 'no'}`,
  );
  return EXIT_SUCCESS;
}

export const COMMANDS: CommandDefinition[] = [
  {
    name: 'feature-intake',
    aliases: [],
    description: 'Create a new dossier for already selected backlog work.',
    helpText: featureIntakeHelp,
    run: runFeatureIntakeCommand,
  },
  {
    name: 'sync-index',
    aliases: [],
    description: 'Regenerate docs/ssot/index.md from current dossier frontmatter.',
    helpText: syncIndexHelp,
    run: runSyncIndexCommand,
  },
  {
    name: 'index-refresh',
    aliases: [],
    description: 'Run sync-index and refresh the generated Red flags block.',
    helpText: indexRefreshHelp,
    run: runIndexRefreshCommand,
  },
  {
    name: 'lint-dossiers',
    aliases: [],
    description: 'Validate Feature Dossiers and optionally update Red flags.',
    helpText: lintDossiersHelp,
    run: runLintDossiersCommand,
  },
  {
    name: 'dependency-graph',
    aliases: [],
    description: 'Print the dossier dependency graph as Mermaid.',
    helpText: dependencyGraphHelp,
    run: runDependencyGraphCommand,
  },
  {
    name: 'coverage-audit',
    aliases: [],
    description: 'Check AC references in tests and report orphans.',
    helpText: coverageAuditHelp,
    run: runCoverageAuditCommand,
  },
  {
    name: 'debt-audit',
    aliases: ['marker-audit'],
    description: 'Scan for explicit TODO/FIXME/HACK/XXX debt markers.',
    helpText: debtAuditHelp,
    run: runDebtAuditCommand,
  },
  {
    name: 'contract-drift-audit',
    aliases: [],
    description: 'Detect executable contract drift without follow-up changes.',
    helpText: contractDriftAuditHelp,
    run: runContractDriftAuditCommand,
  },
  {
    name: 'review-artifact',
    aliases: [],
    description: 'Persist an independent review artifact.',
    helpText: reviewArtifactHelp,
    run: runReviewArtifactCommand,
  },
  {
    name: 'dossier-step-close',
    aliases: [],
    description: 'Write the machine-checkable step-closure artifact.',
    helpText: dossierStepCloseHelp,
    run: runDossierStepCloseCommand,
  },
  {
    name: 'dossier-verify',
    aliases: [],
    description: 'Run the canonical verification bundle and persist its artifact.',
    helpText: dossierVerifyHelp,
    run: runDossierVerifyCommand,
  },
  {
    name: 'next-step',
    aliases: [],
    description: 'Resolve the next recommended action across dossier state.',
    helpText: nextStepHelp,
    run: runNextStepCommand,
  },
];

export function globalHelp(): string {
  const commandLines = COMMANDS.map((command) => {
    const aliasSuffix =
      command.aliases.length > 0 ? ` (aliases: ${command.aliases.join(', ')})` : '';
    return `  ${command.name.padEnd(22)} ${command.description}${aliasSuffix}`;
  });

  return [
    'Unified CLI for the dossier-engineer skill.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} <command> [options]`,
    `  ${CLI_DISPLAY_NAME} help [command]`,
    '',
    'Commands:',
    ...commandLines,
    '',
    'Global options:',
    '  -h, --help                   Show global or command-specific help.',
    '  --version                    Show CLI version.',
  ].join('\n');
}
