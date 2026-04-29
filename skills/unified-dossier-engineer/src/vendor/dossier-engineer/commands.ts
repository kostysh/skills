import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
  getChangedFilesBetween,
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
import { refreshLifecycleArtifacts } from './lib/lifecycle-telemetry.ts';
import { buildRedFlagsBlock, analyzeDossiers, renderLintSummary } from './core/lint-dossiers.ts';
import { hasExecutableSectionChange, parseTopLevelSections } from './core/markdown.ts';
import { defaultNextStep, normalizeWorkflowStage, statusToNextStep } from './core/workflow.ts';
import { readStageState } from '../../shared/stage-state.ts';
import { assertManagedWritePath, resolveManagedReadPath } from '../../shared/path-guards.ts';
import {
  evaluatePostCloseBacklogHygiene,
  readBacklogTruthTimestamps,
} from '../../shared/post-close-hygiene.ts';

export const CLI_NAME = 'dossier-engineer';
export const CLI_DISPLAY_NAME = 'dossier-engineer';
export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;
export const EXIT_USAGE = 2;
const DEFAULT_INDEX_FILE = 'docs/ssot/index.md';
const BACKLOG_DELIVERY_STATES = [
  'defined',
  'intaken',
  'specified',
  'planned',
  'implemented',
] as const;

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
  allowed_by_policy?: boolean;
  artifact_role?: string;
  audit_class?: string;
  event_commit?: string | null;
  feature_id?: string;
  findings?: {
    evidence?: unknown;
    must_fix?: unknown;
  };
  immutable_artifact_path?: string | null;
  implementation_scope?: string | null;
  invalidated?: boolean;
  latest_copy_path?: string | null;
  review_mode?: string;
  review_attempt_id?: string | null;
  review_round_id?: string | null;
  review_round_number?: number | null;
  reviewer_agent_id?: string | null;
  reviewer_skill?: string | null;
  reviewer_thread_id?: string | null;
  reviewer?: string;
  repair_next_action?: string | null;
  risk_families?: unknown;
  security_trigger_reason?: string | null;
  step?: string;
  verdict?: string;
}

interface StepArtifactShape {
  blockers?: unknown;
  degraded_review_present?: boolean;
  executed_audit_classes?: unknown;
  implementation_review_scope?: string | null;
  invalidated_review_present?: boolean;
  next_step?: string;
  process_complete?: boolean;
  required_audit_classes?: unknown;
  required_external_review_pending?: boolean;
  required_security_review?: boolean | null;
  review_artifacts?: unknown;
  review_trace_commits?: unknown;
  reviewer_agent_ids?: unknown;
  reviewer_skills?: unknown;
  stale_review_present?: boolean;
}

interface VerifyArtifactShape {
  event_commit?: string | null;
  feature_id?: string;
  missing_categories?: unknown;
  next_action?: string | null;
  required_categories?: unknown;
  satisfied_categories?: unknown;
  status?: string;
  step?: string;
  verification_profile_source?: string | null;
  verification_profile_scope?: string | null;
}

const AUDIT_CLASSES = ['spec-conformance-reviewer', 'code-reviewer', 'security-reviewer'] as const;

const REVIEW_MODES = ['external', 'degraded', 'self-review'] as const;

const IMPLEMENTATION_REVIEW_SCOPES = ['non-code', 'code-bearing'] as const;
const PRE_REVIEW_RISK_IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const IMPLEMENTATION_PROTECTED_PROFILE_SCOPE = 'implementation-protected-side-effects';
const NON_CODE_FILE_EXTENSIONS = new Set([
  '.adoc',
  '.gif',
  '.jpeg',
  '.jpg',
  '.md',
  '.mdx',
  '.png',
  '.rst',
  '.svg',
  '.txt',
  '.webp',
]);

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

function runtimeThreadId(): string | null {
  const processLike = Reflect.get(globalThis, 'process');
  const env =
    processLike && typeof processLike === 'object' ? Reflect.get(processLike, 'env') : undefined;
  const value = env && typeof env === 'object' ? Reflect.get(env, 'CODEX_THREAD_ID') : undefined;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
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

function positiveIntegerOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function uniqueStrings(values: Iterable<string | null | undefined>): string[] {
  return [
    ...new Set(
      [...values].map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean),
    ),
  ];
}

function sortAuditClasses(values: Iterable<string | null | undefined>): string[] {
  const unique = uniqueStrings(values);
  return [
    ...AUDIT_CLASSES.filter((value) => unique.includes(value)),
    ...unique
      .filter((value) => !AUDIT_CLASSES.includes(value as (typeof AUDIT_CLASSES)[number]))
      .sort(),
  ];
}

function requiredAuditClassesForStep(
  step: string,
  implementationScope: (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null,
): string[] {
  if (step === 'implementation' && implementationScope === 'code-bearing') {
    return [...AUDIT_CLASSES];
  }
  return ['spec-conformance-reviewer'];
}

function stringOrFallback(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeImplementationReviewScope(
  value: unknown,
): (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null {
  return IMPLEMENTATION_REVIEW_SCOPES.includes(
    value as (typeof IMPLEMENTATION_REVIEW_SCOPES)[number],
  )
    ? (value as (typeof IMPLEMENTATION_REVIEW_SCOPES)[number])
    : null;
}

function normalizeRiskFamily(value: string, optionName: string, helpText: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new UsageError(`${optionName} cannot be empty.`, helpText);
  }
  if (/[\r\n]/u.test(normalized)) {
    throw new UsageError(`${optionName} must be a single-line value.`, helpText);
  }
  if (!PRE_REVIEW_RISK_IDENTIFIER_PATTERN.test(normalized)) {
    throw new UsageError(
      `${optionName} must be a stable lowercase identifier using letters, digits, and hyphens.`,
      helpText,
    );
  }
  return normalized;
}

function normalizeRiskFamilies(values: string[], optionName: string, helpText: string): string[] {
  return uniqueStrings(values.map((value) => normalizeRiskFamily(value, optionName, helpText)));
}

function isManagedDossierPath(filePath: string): boolean {
  const normalized = String(filePath)
    .trim()
    .replace(/^["']|["']$/gu, '')
    .replace(/^\.\//u, '')
    .split(path.sep)
    .join('/');
  return (
    normalized === '.dossier' ||
    normalized.startsWith('.dossier/') ||
    normalized === 'dossier' ||
    normalized.startsWith('dossier/')
  );
}

function isAuditFreshnessExemptPath(filePath: string): boolean {
  const normalized = String(filePath)
    .trim()
    .replace(/^["']|["']$/gu, '')
    .replace(/^\.\//u, '')
    .split(path.sep)
    .join('/');
  const canonical = normalized.startsWith('dossier/') ? `.${normalized}` : normalized;
  return (
    canonical === '.dossier' ||
    canonical === '.dossier/manifest.json' ||
    canonical === '.dossier/backlog/manifest.json' ||
    canonical === '.dossier/backlog/mutation.lock' ||
    canonical === '.dossier/backlog/.gitignore' ||
    canonical === '.dossier/backlog/AGENTS.md' ||
    canonical.startsWith('.dossier/backlog/reports/') ||
    canonical.startsWith('.dossier/logs/') ||
    canonical.startsWith('.dossier/stages/') ||
    canonical.startsWith('.dossier/reviews/') ||
    canonical.startsWith('.dossier/verification/') ||
    canonical.startsWith('.dossier/steps/') ||
    canonical.startsWith('.dossier/metrics/') ||
    canonical.startsWith('.dossier/retro/') ||
    canonical.startsWith('.dossier/ops/') ||
    canonical.startsWith('.dossier/drift/')
  );
}

function isDocumentationOnlyPath(filePath: string): boolean {
  if (isManagedDossierPath(filePath)) {
    return true;
  }
  return NON_CODE_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function resolveImplementationReviewScope(
  root: string,
  featureId: string,
): Promise<(typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null> {
  const state = await readStageState(root, 'implementation', featureId);
  const declaredScope = normalizeImplementationReviewScope(state?.implementation_review_scope);
  if (!declaredScope) {
    return null;
  }
  if (declaredScope === 'code-bearing') {
    return 'code-bearing';
  }
  const entryCommit = toNullableString(state?.stage_entry_commit);
  if (!inGitRepo(root) || !entryCommit || !getCurrentCommit(root)) {
    return 'code-bearing';
  }
  const changedFiles = getChangedFilesBetween(root, entryCommit, 'HEAD').filter(
    (filePath) => !isManagedDossierPath(filePath),
  );
  const dirtyPaths = getDirtyPaths(root).filter((filePath) => !isManagedDossierPath(filePath));
  const allPaths = [...new Set([...changedFiles, ...dirtyPaths])];
  return allPaths.every(isDocumentationOnlyPath) ? 'non-code' : 'code-bearing';
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

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function reviewDirPath(root: string, featureId: string): string {
  return path.join(root, '.dossier', 'reviews', featureId);
}

function reviewLatestPath(
  root: string,
  featureId: string,
  step: string,
  auditClass: string,
): string {
  return path.join(reviewDirPath(root, featureId), `${step}--${auditClass}--latest.json`);
}

function legacyReviewLatestPath(
  root: string,
  featureId: string,
  step: string,
  auditClass: string,
): string {
  const stableAuditName = auditClass.replace(/-reviewer$/u, '-review');
  return path.join(reviewDirPath(root, featureId), `${step}-${stableAuditName}.json`);
}

async function existingReviewRoundNumbers(payload: {
  auditClass: string;
  featureId: string;
  root: string;
  step: string;
}): Promise<number[]> {
  const rounds: number[] = [];
  const stage =
    payload.step === 'feature-intake' ? 'feature-intake' : normalizeWorkflowStage(payload.step);
  if (
    stage === 'feature-intake' ||
    stage === 'spec-compact' ||
    stage === 'plan-slice' ||
    stage === 'implementation' ||
    stage === 'change-proposal'
  ) {
    const state = await readStageState(payload.root, stage, payload.featureId);
    for (const event of state?.review_events ?? []) {
      if (
        event.audit_class === payload.auditClass &&
        typeof event.review_round_number === 'number' &&
        Number.isInteger(event.review_round_number) &&
        event.review_round_number > 0
      ) {
        rounds.push(event.review_round_number);
      }
    }
  }

  const reviewsDir = reviewDirPath(payload.root, payload.featureId);
  if (!(await fileExists(reviewsDir))) {
    return rounds;
  }
  const filenamePattern = new RegExp(
    `^${escapeRegExp(payload.step)}--${escapeRegExp(payload.auditClass)}--r(\\d{2,})--`,
    'u',
  );
  const entries = await fs.readdir(reviewsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }
    const match = entry.name.match(filenamePattern);
    if (match?.[1]) {
      rounds.push(Number.parseInt(match[1], 10));
      continue;
    }
    try {
      const parsed = JSON.parse(await readText(path.join(reviewsDir, entry.name))) as {
        artifact_role?: unknown;
        audit_class?: unknown;
        review_round_number?: unknown;
        step?: unknown;
      };
      if (
        parsed.artifact_role !== 'latest_copy' &&
        parsed.step === payload.step &&
        parsed.audit_class === payload.auditClass &&
        typeof parsed.review_round_number === 'number' &&
        Number.isInteger(parsed.review_round_number) &&
        parsed.review_round_number > 0
      ) {
        rounds.push(parsed.review_round_number);
      }
    } catch {
      // Filename parsing above is sufficient for managed attempt files.
    }
  }
  return rounds;
}

async function nextReviewAttemptIdentity(payload: {
  auditClass: string;
  featureId: string;
  root: string;
  step: string;
}): Promise<{
  reviewAttemptId: string;
  reviewRoundId: string;
  reviewRoundNumber: number;
}> {
  const existingRounds = await existingReviewRoundNumbers(payload);
  const reviewRoundNumber = Math.max(0, ...existingRounds) + 1;
  const reviewRoundId = `r${String(reviewRoundNumber).padStart(2, '0')}`;
  return {
    reviewAttemptId: `${payload.step}--${payload.auditClass}--${reviewRoundId}`,
    reviewRoundId,
    reviewRoundNumber,
  };
}

async function readReviewArtifactForClose(payload: {
  featureId: string;
  inputPath: string;
  root: string;
}): Promise<{ path: string; review: ReviewArtifactShape }> {
  const managedDir = reviewDirPath(payload.root, payload.featureId);
  const absInputPath = await resolveManagedReadPath(
    payload.root,
    payload.inputPath,
    managedDir,
    'review artifact path',
  );
  const inputReview = JSON.parse(await readText(absInputPath)) as ReviewArtifactShape;
  if (inputReview.artifact_role !== 'latest_copy') {
    return { path: relativeToRoot(payload.root, absInputPath), review: inputReview };
  }

  const immutableArtifactPath = toNullableString(inputReview.immutable_artifact_path);
  if (!immutableArtifactPath) {
    throw new Error('Latest review artifact copy is missing immutable_artifact_path.');
  }
  const absImmutablePath = await resolveManagedReadPath(
    payload.root,
    immutableArtifactPath,
    managedDir,
    'immutable review artifact path',
  );
  const immutableReview = JSON.parse(await readText(absImmutablePath)) as ReviewArtifactShape;
  if (immutableReview.artifact_role !== 'immutable_attempt') {
    throw new Error(
      'Latest review artifact copy does not resolve to a managed immutable attempt artifact.',
    );
  }
  return { path: relativeToRoot(payload.root, absImmutablePath), review: immutableReview };
}

function quoteArg(value: string): string {
  return /^[A-Za-z0-9_./:=,@+-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCli(parts: string[]): string {
  return parts.map((part) => quoteArg(part)).join(' ');
}

function canonicalCli(commandName: string, args: string[] = []): string {
  return formatCli(['dossier-engineer', commandName, ...args]);
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
backlog_item_key: ${backlogItemKey}
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
    '  --backlog-item-key <key>     Selected backlog item key from the backlog truth layer. Required.',
    '  --backlog-delivery-state <state>  Backlog delivery state at intake. Required.',
    '                               Allowed: defined, intaken, specified, planned, implemented.',
    '  --backlog-source <source>    Repeatable backlog source traceability entry. At least one required.',
    '  --backlog-dependency <key>   Repeatable backlog dependency visible at intake.',
    '  --backlog-blocker <text>     Repeatable backlog blocker visible at intake.',
    '  --area <name>                Area label for frontmatter. Required.',
    '  --owner <name>               Repeatable owner value. At least one required.',
    '  --impact <name>              Repeatable impact value. At least one required.',
    '  --depends-on <id>            Repeatable delivered prerequisite.',
    '  --slug <slug>                Optional dossier slug. Defaults to slugified title.',
    '  --output <path>              Optional dossier output path directly inside docs/ssot/features.',
    '  --json                       Emit JSON output.',
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - feature-intake runs index-refresh after creating the dossier.',
    '  - JSON partial_success=true means the dossier was created but index-refresh failed; fix the reported refresh issues before continuing.',
    '  - workflow_stage_next values name workflow stages, not shipped CLI subcommands.',
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
      '--output must point to a dossier file named like docs/ssot/features/F-XXXX-slug.md for the allocated feature id.',
      helpText,
    );
  }
  if (outputDir !== absDossiersDir) {
    throw new UsageError(
      '--output must point to a dossier file directly inside docs/ssot/features for the current repository root.',
      helpText,
    );
  }
  await fs.mkdir(absDossiersDir, { recursive: true });
  const realRoot = await fs.realpath(absRoot);
  const realDossiersDir = await fs.realpath(absDossiersDir);
  const expectedRealDossiersDir = path.join(realRoot, DEFAULT_DOSSIERS_DIR);
  if (realDossiersDir !== expectedRealDossiersDir) {
    throw new UsageError(
      'docs/ssot/features must be a real directory inside the repository root and must not be a symlinked path.',
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
    workflow_stage_next: 'spec-compact',
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
  writeLine(
    io.stdout,
    '[feature-intake] next_workflow_stage=spec-compact (workflow stage, not CLI command)',
  );
  return EXIT_SUCCESS;
}

function syncIndexHelp(): string {
  return [
    'Regenerate only the generated dossier table and dependency graph blocks in docs/ssot/index.md.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} sync-index [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    `  --dossiers-dir <path>        Dossiers directory. Defaults to ${DEFAULT_DOSSIERS_DIR}.`,
    `  --index-file <path>          Index file. Defaults to ${DEFAULT_INDEX_FILE}.`,
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - sync-index does not refresh the generated Red flags block.',
    '  - Use index-refresh for the canonical full refresh path after mutating dossier work.',
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

  writeLine(io.stdout, `Debt audit: ${filesToScan.length} file(s) scanned.`);
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
    event_commit: inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null,
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
    'Persist one immutable already obtained audit attempt for one audit class as a durable artifact.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} review-artifact --dossier <path> --step <name> --audit-class <name> --verdict PASS|FAIL [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Dossier under review.',
    '  --step <name>                Workflow step under review.',
    `  --audit-class <name>         Audit class. One of: ${AUDIT_CLASSES.join(', ')}.`,
    '  --verdict <PASS|FAIL>        Review verdict.',
    '  --reviewer <name>            Reviewer identifier. Required.',
    `  --review-mode <mode>         Review mode. One of: ${REVIEW_MODES.join(', ')}. Defaults to external.`,
    '  --reviewer-skill <name>      Reviewer skill name when available.',
    '  --reviewer-agent-id <id>     Reviewer agent identifier when available.',
    '  --implementation-scope <scope> Deprecated here; implementation scope must be recorded on the current implementation stage state via implementation --ready-for-close.',
    '  --security-trigger-reason <text> Security trigger reason for applicable implementation security audits.',
    '  --risk-family <id>           Repeatable declared implementation risk family for FAIL artifacts only.',
    '  --invalidated                Mark this audit artifact as invalidated by later material change.',
    '  --rerun-reason <text>        Optional rerun or invalidation reason.',
    '  --notes <text>               Free-form reviewer notes.',
    '  --output <path>              Artifact output path.',
    '  --must-fix <text>            Repeatable must-fix finding.',
    '  --should-fix <text>          Repeatable should-fix finding.',
    '  --evidence <text>            Repeatable evidence pointer.',
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - review-artifact does not perform the review itself; it records one immutable already obtained audit attempt for one audit class.',
    '  - stable/latest review copies are compatibility conveniences; immutable attempt artifacts remain authoritative evidence.',
    '  - --reviewer should name the separate reviewer agent or review skill that produced the verdict.',
    '  - reviewer_thread_id is stamped from the current runtime when available and is used for same-thread external-review rejection.',
    '  - review-artifact records observable provenance only; it does not prove fork_context, full-history inheritance, prompt mutability, or model tier.',
    '  - Audits launched with forked/full-history authoring context do not satisfy external independent audit policy and must be rerun.',
    '  - review-artifact never replaces the required audit bundle enforced by dossier-step-close.',
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
  const auditClass = ensureEnumValue(
    ensureRequired(takeOption(argv, '--audit-class', null), '--audit-class is required.', helpText),
    AUDIT_CLASSES,
    '--audit-class',
    helpText,
  );
  const verdict = ensureRequired(
    takeOption(argv, '--verdict', null),
    '--verdict is required.',
    helpText,
  ).toUpperCase();
  const reviewer = ensureRequired(
    takeOption(argv, '--reviewer', null),
    '--reviewer is required.',
    helpText,
  );
  const reviewMode = ensureEnumValue(
    takeOption(argv, '--review-mode', 'external') ?? 'external',
    REVIEW_MODES,
    '--review-mode',
    helpText,
  );
  const reviewerSkill = takeOption(argv, '--reviewer-skill', null);
  const reviewerAgentId = takeOption(argv, '--reviewer-agent-id', null);
  const implementationScopeRaw = takeOption(argv, '--implementation-scope', null);
  const securityTriggerReason = takeOption(argv, '--security-trigger-reason', null);
  const riskFamilies = normalizeRiskFamilies(
    takeManyOptions(argv, '--risk-family'),
    '--risk-family',
    helpText,
  );
  const invalidated = hasOption(argv, '--invalidated');
  const rerunReason = takeOption(argv, '--rerun-reason', null);
  const notes = takeOption(argv, '--notes', '') ?? '';
  const output = takeOption(argv, '--output', null);
  const mustFix = takeManyOptions(argv, '--must-fix')
    .map((value) => value.trim())
    .filter(Boolean);
  const shouldFix = takeManyOptions(argv, '--should-fix')
    .map((value) => value.trim())
    .filter(Boolean);
  const evidence = takeManyOptions(argv, '--evidence')
    .map((value) => value.trim())
    .filter(Boolean);
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier);

  if (!['PASS', 'FAIL'].includes(verdict)) {
    throw new UsageError('--verdict must be PASS or FAIL.', helpText);
  }
  if (verdict === 'PASS' && mustFix.length > 0) {
    throw new UsageError('PASS review artifacts cannot contain --must-fix findings.', helpText);
  }
  if (verdict === 'FAIL' && mustFix.length === 0) {
    throw new UsageError(
      'FAIL review artifacts require at least one --must-fix finding.',
      helpText,
    );
  }
  if (verdict === 'FAIL' && evidence.length === 0) {
    throw new UsageError(
      'FAIL review artifacts require at least one --evidence pointer.',
      helpText,
    );
  }
  if (verdict === 'PASS' && riskFamilies.length > 0) {
    throw new UsageError('--risk-family is only allowed for FAIL review artifacts.', helpText);
  }
  if (riskFamilies.length > 0 && step !== 'implementation') {
    throw new UsageError(
      '--risk-family is only allowed for implementation review artifacts.',
      helpText,
    );
  }

  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const featureId = frontmatterString(
    dossierRecord.frontmatter,
    'id',
    path.basename(absDossier, '.md'),
  );
  const inRepo = inGitRepo(absRoot);
  if (takeOption(argv, '--event-commit', null)) {
    throw new UsageError(
      '--event-commit is not supported; review-artifact stamps current HEAD when available.',
      helpText,
    );
  }
  if (implementationScopeRaw) {
    throw new UsageError(
      '--implementation-scope must be recorded on implementation --ready-for-close, not passed to review-artifact.',
      helpText,
    );
  }
  const implementationStageState =
    step === 'implementation' ? await readStageState(absRoot, 'implementation', featureId) : null;
  const implementationScope =
    step === 'implementation' ? await resolveImplementationReviewScope(absRoot, featureId) : null;
  if (step === 'implementation') {
    if (!implementationScope) {
      throw new UsageError(
        'Implementation review scope is missing from the current implementation stage state. Record it via implementation --ready-for-close --implementation-scope <scope> before review-artifact.',
        helpText,
      );
    }
    const declaredRiskFamilies = implementationStageState?.pre_review_risk_families ?? [];
    const undeclaredRiskFamilies = riskFamilies.filter(
      (riskFamily) => !declaredRiskFamilies.includes(riskFamily),
    );
    if (undeclaredRiskFamilies.length > 0) {
      throw new UsageError(
        `--risk-family values must be declared in the current implementation stage state: ${undeclaredRiskFamilies.join(', ')}.`,
        helpText,
      );
    }
    if (auditClass === 'security-reviewer' && !securityTriggerReason) {
      throw new UsageError(
        '--security-trigger-reason is required for implementation security audits.',
        helpText,
      );
    }
  } else if (implementationScope) {
    throw new UsageError(
      '--implementation-scope is only allowed when --step=implementation.',
      helpText,
    );
  }
  if (securityTriggerReason && !(step === 'implementation' && auditClass === 'security-reviewer')) {
    throw new UsageError(
      '--security-trigger-reason is only allowed for implementation security audits.',
      helpText,
    );
  }
  const reviewerThreadId = runtimeThreadId();
  const commit = inRepo ? getCurrentCommit(absRoot) : null;
  const attemptIdentity = await nextReviewAttemptIdentity({
    root: absRoot,
    featureId,
    step,
    auditClass,
  });
  const latestOutputPath = reviewLatestPath(absRoot, featureId, step, auditClass);
  const latestOutputRelPath = relativeToRoot(absRoot, latestOutputPath);
  const repeatedFailRiskFamilies =
    verdict === 'FAIL'
      ? riskFamilies.filter((riskFamily) =>
          (implementationStageState?.review_events ?? []).some(
            (event) =>
              event.verdict === 'FAIL' &&
              event.implementation_scope === implementationScope &&
              Array.isArray(event.risk_families) &&
              event.risk_families.includes(riskFamily),
          ),
        )
      : [];
  const repairNextAction =
    repeatedFailRiskFamilies.length > 0
      ? `Repair adjacent scenario evidence for repeated FAIL risk families: ${repeatedFailRiskFamilies.join(', ')}. Add or update the nearest regression scenario before rerunning the external review.`
      : null;

  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    audit_class: auditClass,
    artifact_role: 'immutable_attempt',
    review_mode: reviewMode,
    reviewer,
    reviewer_skill: reviewerSkill,
    reviewer_agent_id: reviewerAgentId,
    reviewer_thread_id: reviewerThreadId,
    ...(riskFamilies.length > 0 ? { risk_families: riskFamilies } : {}),
    ...(repairNextAction ? { repair_next_action: repairNextAction } : {}),
    review_attempt_id: attemptIdentity.reviewAttemptId,
    review_round_id: attemptIdentity.reviewRoundId,
    review_round_number: attemptIdentity.reviewRoundNumber,
    latest_copy_path: latestOutputRelPath,
    step,
    dossier: dossierRecord.relPath,
    feature_id: featureId,
    event_commit: commit,
    implementation_scope: implementationScope,
    security_trigger_reason: securityTriggerReason,
    invalidated,
    rerun_reason: rerunReason,
    allowed_by_policy: reviewMode === 'external' && invalidated !== true,
    verdict,
    findings: {
      must_fix: mustFix,
      should_fix: shouldFix,
      evidence,
    },
    notes,
  };

  const defaultOutput = path.join(
    reviewDirPath(absRoot, featureId),
    `${attemptIdentity.reviewAttemptId}--${verdict.toLowerCase()}--${commit ? commit.slice(0, 12) : 'no-commit'}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await assertManagedWritePath(
    absRoot,
    reviewDirPath(absRoot, featureId),
    outputPath,
    'review-artifact output path',
  );
  if (await fileExists(outputPath)) {
    throw new UsageError(
      `Immutable review attempt artifact already exists: ${relativeToRoot(absRoot, outputPath)}.`,
      helpText,
    );
  }
  await assertManagedWritePath(
    absRoot,
    reviewDirPath(absRoot, featureId),
    latestOutputPath,
    'review-artifact latest copy path',
  );
  await writeJsonAtomic(outputPath, artifact);
  const immutableArtifactPath = relativeToRoot(absRoot, outputPath);
  const latestArtifact = {
    ...artifact,
    artifact_role: 'latest_copy',
    immutable_artifact_path: immutableArtifactPath,
  };
  await writeJsonAtomic(latestOutputPath, latestArtifact);

  const legacyLatestOutputPath = legacyReviewLatestPath(absRoot, featureId, step, auditClass);
  if (legacyLatestOutputPath !== latestOutputPath) {
    await assertManagedWritePath(
      absRoot,
      reviewDirPath(absRoot, featureId),
      legacyLatestOutputPath,
      'review-artifact legacy latest copy path',
    );
    await writeJsonAtomic(legacyLatestOutputPath, {
      ...latestArtifact,
      latest_copy_path: relativeToRoot(absRoot, legacyLatestOutputPath),
    });
  }

  writeLine(io.stdout, `[review-artifact] Wrote ${relativeToRoot(absRoot, outputPath)}`);
  writeLine(io.stdout, `[review-artifact] latest_copy=${latestOutputRelPath}`);
  writeLine(
    io.stdout,
    `[review-artifact] audit_class=${auditClass} verdict=${verdict} step=${step} feature=${featureId} event_commit=${commit ?? 'none'}`,
  );
  if (repairNextAction) {
    writeLine(io.stdout, `[review-artifact] repair_next_action=${repairNextAction}`);
  }
  return EXIT_SUCCESS;
}

function dossierStepCloseHelp(): string {
  return [
    'Machine-checkable closure gate for a mutating dossier step.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} dossier-step-close --dossier <path> --step <name> --verify-artifact <path> --review-artifact <path> [--review-artifact <path> ...] [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Dossier being closed.',
    '  --step <name>                Workflow step being closed.',
    '  --verify-artifact <path>     Verification artifact path.',
    '  --review-artifact <path>     Review artifact path. Repeat for multi-audit bundles.',
    '  --backlog-actualization-artifact <path>  Applied backlog patch artifact proving selected-item lifecycle actualization. Repeatable.',
    `  --implementation-scope <scope> Optional cross-check only. Implementation scope is read from the current implementation stage state and must match if provided.`,
    '  --next-step <name>           Override computed next step.',
    '  --output <path>              Step artifact output path.',
    '  --allow-dirty                Skip the clean-worktree blocker only; review freshness invalidation still applies.',
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - dossier-step-close validates the observable durable review bundle; it does not prove reviewer launch-mode independence.',
    '  - Audits launched with forked/full-history authoring context must be rerun before truthful closure.',
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
  const reviewArtifacts = ensureNonEmpty(
    takeManyOptions(argv, '--review-artifact'),
    '--review-artifact is required.',
    helpText,
  );
  const implementationScopeRaw = takeOption(argv, '--implementation-scope', null);
  const requestedImplementationScope = implementationScopeRaw
    ? ensureEnumValue(
        implementationScopeRaw,
        IMPLEMENTATION_REVIEW_SCOPES,
        '--implementation-scope',
        helpText,
      )
    : null;
  if (step !== 'implementation' && implementationScopeRaw) {
    throw new UsageError(
      '--implementation-scope is only allowed when --step=implementation.',
      helpText,
    );
  }
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
  const implementationScope =
    step === 'implementation' ? await resolveImplementationReviewScope(absRoot, featureId) : null;
  if (step === 'implementation' && !implementationScope) {
    throw new UsageError(
      'Implementation review scope is missing from the current implementation stage state. Record it via implementation --ready-for-close --implementation-scope <scope> before dossier-step-close.',
      helpText,
    );
  }
  if (
    step === 'implementation' &&
    requestedImplementationScope &&
    requestedImplementationScope !== implementationScope
  ) {
    throw new UsageError(
      `--implementation-scope (${requestedImplementationScope}) does not match the current implementation stage state scope (${implementationScope}).`,
      helpText,
    );
  }
  const blockers: string[] = [];
  let staleReviewPresent = false;
  let staleSelectedEvidencePresent = false;
  let invalidSelectedEvidencePresent = false;
  const markStaleSelectedEvidence = (): void => {
    staleReviewPresent = true;
    staleSelectedEvidencePresent = true;
  };
  const markInvalidSelectedEvidence = (): void => {
    invalidSelectedEvidencePresent = true;
  };
  const reviewNextAction = (auditClass: string): string =>
    `Next action: rerun reviewer-owned review-artifact accounting for ${auditClass} and select the latest valid PASS artifact.`;
  const reviewFreshnessNextAction = (auditClass: string): string =>
    `Next action: rerun reviewer-owned review-artifact accounting for ${auditClass} after refreshing review for the reviewed material scope.`;
  const reviewArtifactReadNextAction =
    'Next action: rerun reviewer-owned review-artifact accounting for the required audit class and select the latest valid PASS artifact.';
  const verificationArtifactLabel = relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact));
  const rejectVerification = (message: string): void => {
    markInvalidSelectedEvidence();
    blockers.push(
      `Verification artifact ${verificationArtifactLabel} ${message}. Next action: rerun dossier-verify for the reviewed material scope.`,
    );
  };
  const stageState = await readStageState(
    absRoot,
    step as Parameters<typeof readStageState>[1],
    featureId,
  );
  if (!stageState) {
    blockers.push(
      `No helper-managed ${step} stage state found for ${featureId}. Re-run the stage controller before dossier-step-close.`,
    );
  }

  let verify: VerifyArtifactShape | null = null;
  try {
    verify = await readJsonArtifact<VerifyArtifactShape>(absRoot, verifyArtifact);
  } catch (error) {
    rejectVerification(
      `could not be read (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  const reviewArtifactPaths: string[] = [];
  const reviewArtifactPathByAuditClass = new Map<string, string>();
  const reviewsByAuditClass = new Map<string, ReviewArtifactShape>();
  for (const reviewArtifact of reviewArtifacts) {
    try {
      const { path: resolvedReviewArtifactPath, review } = await readReviewArtifactForClose({
        root: absRoot,
        featureId,
        inputPath: reviewArtifact,
      });
      const auditClass = ensureEnumValue(
        stringOrFallback(review.audit_class),
        AUDIT_CLASSES,
        'review artifact audit_class',
        helpText,
      );
      if (reviewsByAuditClass.has(auditClass)) {
        markInvalidSelectedEvidence();
        const existingArtifactPath =
          reviewArtifactPathByAuditClass.get(auditClass) ?? '<already selected artifact>';
        blockers.push(
          `Duplicate review artifact for audit class ${auditClass}: selected ${existingArtifactPath} and ${resolvedReviewArtifactPath}. ${reviewNextAction(auditClass)}`,
        );
        continue;
      }
      reviewsByAuditClass.set(auditClass, review);
      reviewArtifactPathByAuditClass.set(auditClass, resolvedReviewArtifactPath);
      reviewArtifactPaths.push(resolvedReviewArtifactPath);
    } catch (error) {
      markInvalidSelectedEvidence();
      blockers.push(
        `Could not read review artifact ${relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact))} (${error instanceof Error ? error.message : String(error)}). ${reviewArtifactReadNextAction}`,
      );
    }
  }

  const eventCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
  const currentThreadId = runtimeThreadId();
  const recordedReviewEvents = stageState?.review_events ?? [];
  const recordedReviewPaths = new Map(
    recordedReviewEvents
      .map(
        (event, index) =>
          [
            toNullableString(event.artifact_path),
            {
              ...event,
              order_index: index,
            },
          ] as const,
      )
      .filter(
        (
          entry,
        ): entry is [
          string,
          (typeof recordedReviewEvents)[number] & {
            order_index: number;
          },
        ] => entry[0] !== null,
      ),
  );
  const latestRecordedReviewByAuditClass = new Map<string, (typeof recordedReviewEvents)[number]>();
  for (const event of recordedReviewEvents) {
    const auditClass = toNullableString(event.audit_class);
    if (!auditClass) {
      continue;
    }
    latestRecordedReviewByAuditClass.set(auditClass, event);
  }
  if (verify && verify.status !== 'pass') {
    rejectVerification(`does not report status=pass (got ${String(verify.status)})`);
  }
  if (verify && verify.step !== step) {
    rejectVerification(`has step mismatch: expected ${step}, got ${String(verify.step)}`);
  }
  if (verify?.feature_id && verify.feature_id !== featureId) {
    rejectVerification(`has feature mismatch: expected ${featureId}, got ${verify.feature_id}`);
  }
  if (
    verify &&
    step === 'implementation' &&
    implementationScope === 'code-bearing' &&
    (stageState?.pre_review_risk_families.length ?? 0) > 0
  ) {
    const requiredCategories = Array.isArray(verify.required_categories)
      ? toStringArray(verify.required_categories)
      : null;
    const satisfiedCategories = Array.isArray(verify.satisfied_categories)
      ? toStringArray(verify.satisfied_categories)
      : null;
    const missingCategories = Array.isArray(verify.missing_categories)
      ? toStringArray(verify.missing_categories)
      : null;
    if (!toNullableString(verify.verification_profile_source)) {
      rejectVerification(
        'is missing verification_profile_source for code-bearing implementation with declared pre-review risk families',
      );
    }
    if (verify.verification_profile_scope !== IMPLEMENTATION_PROTECTED_PROFILE_SCOPE) {
      rejectVerification(
        `has verification_profile_scope mismatch: expected ${IMPLEMENTATION_PROTECTED_PROFILE_SCOPE}, got ${String(verify.verification_profile_scope)}`,
      );
    }
    if (!requiredCategories) {
      rejectVerification('is missing required_categories array');
    } else if (requiredCategories.length === 0) {
      rejectVerification(
        'has no required_categories for code-bearing implementation with declared pre-review risk families',
      );
    }
    if (!satisfiedCategories) {
      rejectVerification('is missing satisfied_categories array');
    } else if (requiredCategories) {
      const unsatisfiedCategories = requiredCategories.filter(
        (category) => !satisfiedCategories.includes(category),
      );
      if (unsatisfiedCategories.length > 0) {
        rejectVerification(
          `does not satisfy required verification profile categories: ${unsatisfiedCategories.join(', ')}`,
        );
      }
    }
    if (!missingCategories) {
      rejectVerification('is missing missing_categories array');
    } else if (missingCategories.length > 0) {
      rejectVerification(
        `has missing verification profile categories: ${missingCategories.join(', ')}`,
      );
    }
  }

  const requiredAuditClasses = requiredAuditClassesForStep(step, implementationScope);
  const reviewSatisfiesPolicy = new Map<string, boolean>();
  const reviewOrderIndices = new Map<string, number>();
  for (const auditClass of requiredAuditClasses) {
    const review = reviewsByAuditClass.get(auditClass);
    if (!review) {
      markInvalidSelectedEvidence();
      blockers.push(
        `Missing required review artifact for audit class ${auditClass}. ${reviewNextAction(auditClass)}`,
      );
      reviewSatisfiesPolicy.set(auditClass, false);
      continue;
    }
    let reviewIsValid = true;
    const reviewArtifactPath = reviewArtifactPaths.find((artifactPath) => {
      const recorded = recordedReviewPaths.get(artifactPath);
      return recorded && toNullableString(recorded.audit_class) === auditClass;
    });
    const reviewArtifactLabel = reviewArtifactPath ?? `<unrecorded ${auditClass} artifact>`;
    const rejectReview = (message: string): void => {
      markInvalidSelectedEvidence();
      blockers.push(
        `Review artifact ${reviewArtifactLabel} for ${auditClass} ${message}. ${reviewNextAction(auditClass)}`,
      );
      reviewIsValid = false;
    };
    const rejectStaleReview = (message: string): void => {
      markStaleSelectedEvidence();
      blockers.push(
        `Review artifact ${reviewArtifactLabel} for ${auditClass} ${message}. ${reviewFreshnessNextAction(auditClass)}`,
      );
      reviewIsValid = false;
    };
    if (!reviewArtifactPath) {
      rejectReview(
        `was not recorded in the current helper-managed ${step} stage state via review-artifact`,
      );
    } else {
      const recorded = recordedReviewPaths.get(reviewArtifactPath);
      if (recorded) {
        reviewOrderIndices.set(auditClass, recorded.order_index);
      }
      const latestRecorded = latestRecordedReviewByAuditClass.get(auditClass);
      const latestRecordedArtifactPath = toNullableString(latestRecorded?.artifact_path);
      if (latestRecordedArtifactPath && latestRecordedArtifactPath !== reviewArtifactPath) {
        rejectReview(
          `is not the latest recorded attempt for this audit class; selected ${reviewArtifactPath}, latest ${latestRecordedArtifactPath}`,
        );
      }
    }
    if (review.verdict !== 'PASS') {
      rejectReview(`has verdict ${String(review.verdict)}, expected PASS`);
    }
    if (!review.reviewer || !String(review.reviewer).trim()) {
      rejectReview('is missing reviewer provenance');
    }
    if (review.step !== step) {
      rejectReview(`has step mismatch: expected ${step}, got ${String(review.step)}`);
    }
    if (review.feature_id && review.feature_id !== featureId) {
      rejectReview(`has feature mismatch: expected ${featureId}, got ${review.feature_id}`);
    }
    if (Array.isArray(review.findings?.must_fix) && review.findings.must_fix.length > 0) {
      rejectReview('still contains must-fix findings');
    }
    if ((review.review_mode ?? 'external') !== 'external') {
      rejectReview('is not an external audit');
    }
    if (review.invalidated === true) {
      rejectReview('is marked invalidated');
    }
    if (review.allowed_by_policy === false) {
      rejectReview('is not allowed by policy');
    }
    if (inGitRepo(absRoot) && !toNullableString(review.event_commit)) {
      rejectStaleReview('is missing event_commit in a git repo');
    }
    if (
      eventCommit &&
      review.event_commit &&
      String(review.event_commit).trim() &&
      review.event_commit !== eventCommit
    ) {
      rejectStaleReview(
        `is stale: event commit ${review.event_commit} does not match current HEAD ${eventCommit}`,
      );
    }
    const reviewerThreadId = toNullableString(review.reviewer_thread_id);
    if (currentThreadId && reviewerThreadId && reviewerThreadId === currentThreadId) {
      rejectReview('was produced by the current thread and is not an independent external audit');
    }
    if (step === 'implementation') {
      if (review.implementation_scope !== implementationScope) {
        rejectReview(
          `has implementation_scope mismatch: expected ${implementationScope}, got ${String(review.implementation_scope)}`,
        );
      }
      if (
        auditClass === 'security-reviewer' &&
        implementationScope === 'code-bearing' &&
        !toNullableString(review.security_trigger_reason)
      ) {
        rejectReview('is missing security_trigger_reason');
      }
    }
    reviewSatisfiesPolicy.set(auditClass, reviewIsValid);
  }

  const selectedReviewCommits = uniqueStrings(
    requiredAuditClasses.map((auditClass) => reviewsByAuditClass.get(auditClass)?.event_commit),
  );
  const verificationEventCommit = toNullableString(verify?.event_commit);
  if (inGitRepo(absRoot) && verify && !verificationEventCommit) {
    markStaleSelectedEvidence();
    blockers.push(
      `Verification artifact ${verificationArtifactLabel} is missing event_commit in a git repo. Next action: rerun dossier-verify for the reviewed material scope.`,
    );
  }
  if (
    selectedReviewCommits.length === 1 &&
    verificationEventCommit &&
    verificationEventCommit !== selectedReviewCommits[0]
  ) {
    markStaleSelectedEvidence();
    blockers.push(
      `Verification artifact ${verificationArtifactLabel} is stale: event commit ${verificationEventCommit} does not match selected review bundle commit ${selectedReviewCommits[0]}. Next action: rerun dossier-verify for the reviewed material scope.`,
    );
  }
  if (eventCommit && verificationEventCommit && verificationEventCommit !== eventCommit) {
    markStaleSelectedEvidence();
    blockers.push(
      `Verification artifact ${verificationArtifactLabel} is stale: event commit ${verificationEventCommit} does not match current HEAD ${eventCommit}. Next action: rerun dossier-verify for the reviewed material scope.`,
    );
  }

  if (step === 'implementation' && implementationScope === 'code-bearing') {
    const specOrder = reviewOrderIndices.get('spec-conformance-reviewer');
    const codeOrder = reviewOrderIndices.get('code-reviewer');
    const securityOrder = reviewOrderIndices.get('security-reviewer');
    if (
      typeof specOrder === 'number' &&
      typeof codeOrder === 'number' &&
      typeof securityOrder === 'number' &&
      !(specOrder < codeOrder && codeOrder < securityOrder)
    ) {
      markInvalidSelectedEvidence();
      blockers.push(
        'Implementation audit bundle order is invalid: expected spec-conformance-reviewer before code-reviewer before security-reviewer. Next action: rerun reviewer-owned review-artifact accounting in required bundle order and select the ordered PASS artifacts.',
      );
      reviewSatisfiesPolicy.set('spec-conformance-reviewer', false);
      reviewSatisfiesPolicy.set('code-reviewer', false);
      reviewSatisfiesPolicy.set('security-reviewer', false);
    }
  }

  if (inGitRepo(absRoot)) {
    const dirtyPaths = getDirtyPaths(absRoot).filter(
      (filePath) => !isAuditFreshnessExemptPath(filePath),
    );
    if (dirtyPaths.length > 0) {
      markStaleSelectedEvidence();
      for (const auditClass of requiredAuditClasses) {
        reviewSatisfiesPolicy.set(auditClass, false);
      }
      blockers.push(
        `Required audits are stale against uncommitted material changes: ${dirtyPaths.join(', ')}`,
      );
    }
    if (!allowDirty && dirtyPaths.length > 0) {
      blockers.push(`Worktree is dirty in material paths: ${dirtyPaths.join(', ')}`);
    }
  }

  const processComplete = blockers.length === 0;
  const requiredExternalReviewPending = requiredAuditClasses.some(
    (auditClass) => reviewSatisfiesPolicy.get(auditClass) !== true,
  );
  const reviewTraceCommits = uniqueStrings(
    [...reviewsByAuditClass.values()].map((review) => review.event_commit ?? null),
  );
  const reviewerSkills = uniqueStrings(
    [...reviewsByAuditClass.values()].map((review) => review.reviewer_skill ?? null),
  );
  const reviewerAgentIds = uniqueStrings(
    [...reviewsByAuditClass.values()].map((review) => review.reviewer_agent_id ?? null),
  );
  const securityTriggerReasons = uniqueStrings(
    [...reviewsByAuditClass.values()].map((review) => review.security_trigger_reason ?? null),
  );
  const selectedReviewArtifactsByAuditClass = Object.fromEntries(
    requiredAuditClasses.map((auditClass) => [
      auditClass,
      reviewArtifactPaths.find((artifactPath) => {
        const recorded = recordedReviewPaths.get(artifactPath);
        return recorded && toNullableString(recorded.audit_class) === auditClass;
      }) ?? null,
    ]),
  );
  const closureBundleRoundsByAuditClass = Object.fromEntries(
    requiredAuditClasses
      .map((auditClass) => {
        const roundNumber = positiveIntegerOrNull(
          reviewsByAuditClass.get(auditClass)?.review_round_number,
        );
        return roundNumber ? ([auditClass, roundNumber] as const) : null;
      })
      .filter((entry): entry is readonly [string, number] => entry !== null),
  );
  const closureBundleRoundValues = Object.values(closureBundleRoundsByAuditClass);
  const closureBundleRound =
    closureBundleRoundValues.length > 0 ? Math.max(...closureBundleRoundValues) : null;
  const selectedClosureTs = new Date().toISOString();
  const closureBundleFingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        event_commit: eventCommit ?? 'no-commit',
        review_rounds: closureBundleRoundsByAuditClass,
        selected_review_artifacts: selectedReviewArtifactsByAuditClass,
        step,
      }),
    )
    .digest('hex')
    .slice(0, 12);
  const closureBundleId = `${step}--bundle-${closureBundleFingerprint}--${
    closureBundleRound ? `r${String(closureBundleRound).padStart(2, '0')}` : 'r00'
  }--${eventCommit ? eventCommit.slice(0, 12) : 'no-commit'}`;
  const stageStatePath = path
    .join('.dossier', 'stages', featureId, `${step}.json`)
    .split(path.sep)
    .join('/');
  const stepArtifactRelPath = output
    ? relativeToRoot(absRoot, path.resolve(absRoot, output))
    : path.join('.dossier', 'steps', featureId, `${step}.json`).split(path.sep).join('/');
  const nonPassReviewEvents = recordedReviewEvents
    .filter((event) => event.verdict && event.verdict !== 'PASS')
    .map((event) => ({
      review_attempt_id: event.review_attempt_id,
      review_round_id: event.review_round_id,
      review_round_number: event.review_round_number,
      audit_class: event.audit_class,
      verdict: event.verdict,
      artifact_path: event.artifact_path,
      latest_copy_path: event.latest_copy_path,
      event_commit: event.event_commit,
      reviewer: event.reviewer,
      reviewer_agent_id: event.reviewer_agent_id,
      reviewer_skill: event.reviewer_skill,
      reviewer_thread_id: event.reviewer_thread_id,
      risk_families: event.risk_families,
      repair_next_action: event.repair_next_action,
      review_mode: event.review_mode,
      stale: event.stale,
      invalidated: event.invalidated,
      must_fix_count: event.must_fix_count,
      evidence_count: event.evidence_count,
    }));
  const processMisses = stageState?.process_misses ?? [];
  const countProcessMissCategory = (category: string): number =>
    processMisses.filter((miss) => miss.category === category).length;
  const hasProcessMiss = processMisses.some((miss) =>
    [
      'missing-fail-review-artifact',
      'trace-only-fail',
      'invalid-review-launch-mode',
      'same-thread-review-artifact',
      'source-quality-limitation',
    ].includes(miss.category),
  );
  const rpaSourceIdentity = {
    schema_version: 1,
    feature_id: featureId,
    backlog_item_key: stageState?.backlog_item_key ?? null,
    feature_cycle_id: stageState?.feature_cycle_id ?? null,
    cycle_id: stageState?.cycle_id ?? null,
    stage: step,
    dossier: dossierRecord.relPath,
    stage_log: stageState?.log_path ?? null,
    stage_state_path: stageStatePath,
    step_artifact: stepArtifactRelPath,
    event_commit: eventCommit,
    session_id: stageState?.session_id ?? null,
    trace_runtime: stageState?.trace_runtime ?? null,
  };
  const rpaSourceQuality = {
    schema_version: 1,
    review_history_quality: hasProcessMiss
      ? 'process_miss'
      : recordedReviewEvents.some(
            (event) =>
              event.verdict !== 'PASS' &&
              (!event.artifact_path || !event.review_attempt_id || !event.review_round_id),
          )
        ? 'limited'
        : 'complete',
    selected_bundle_quality: processComplete
      ? 'complete'
      : staleSelectedEvidencePresent
        ? 'stale'
        : invalidSelectedEvidencePresent
          ? 'invalid'
          : 'blocked',
    missing_fail_artifact_count: countProcessMissCategory('missing-fail-review-artifact'),
    trace_only_fail_count: countProcessMissCategory('trace-only-fail'),
    same_thread_rejected_count: blockers.filter((blocker) =>
      blocker.includes('not an independent external audit'),
    ).length,
    invalid_launch_mode_process_miss_count: countProcessMissCategory('invalid-review-launch-mode'),
    unrecoverable_historical_fail_present: processMisses.some(
      (miss) =>
        miss.category === 'trace-only-fail' || miss.category === 'source-quality-limitation',
    ),
    limitations: processMisses
      .filter((miss) => !miss.resolved)
      .map((miss) => `${miss.category}: ${miss.summary}`),
  };
  const selectedClosureBundle = {
    closure_bundle_id: closureBundleId,
    closure_bundle_round: closureBundleRound,
    closure_bundle_rounds_by_audit_class: closureBundleRoundsByAuditClass,
    selected_review_artifacts: reviewArtifactPaths,
    selected_review_artifacts_by_audit_class: selectedReviewArtifactsByAuditClass,
    selected_verification_artifact: relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact)),
    selected_step_artifact: stepArtifactRelPath,
    audit_class_order: requiredAuditClasses,
    selected_closure_ts: selectedClosureTs,
    event_commit: eventCommit,
  };
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    feature_id: featureId,
    dossier: dossierRecord.relPath,
    step,
    dossier_status: dossierRecord.frontmatter.status ?? null,
    event_commit: eventCommit,
    review_trace_commit: reviewTraceCommits.at(-1) ?? null,
    review_trace_commits: reviewTraceCommits,
    verification_trace_commit: verify?.event_commit ?? null,
    verification_artifact: relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact)),
    review_artifacts: reviewArtifactPaths,
    selected_closure_bundle: selectedClosureBundle,
    closure_bundle_id: closureBundleId,
    closure_bundle_round: closureBundleRound,
    closure_bundle_rounds_by_audit_class: closureBundleRoundsByAuditClass,
    selected_review_artifacts: reviewArtifactPaths,
    selected_verification_artifact: selectedClosureBundle.selected_verification_artifact,
    selected_step_artifact: stepArtifactRelPath,
    selected_closure_ts: selectedClosureTs,
    rpa_source_identity: rpaSourceIdentity,
    rpa_source_quality: rpaSourceQuality,
    non_pass_review_events: nonPassReviewEvents,
    review_freshness: blockers.some((blocker) => blocker.includes('stale'))
      ? 'stale'
      : processComplete
        ? 'pass'
        : reviewsByAuditClass.size > 0
          ? 'fail'
          : 'missing',
    required_audit_classes: requiredAuditClasses,
    executed_audit_classes: sortAuditClasses(reviewsByAuditClass.keys()),
    required_external_review_pending: requiredExternalReviewPending,
    implementation_review_scope: implementationScope,
    required_security_review:
      step === 'implementation' ? implementationScope === 'code-bearing' : false,
    degraded_review_present: [...reviewsByAuditClass.values()].some(
      (review) => review.review_mode === 'degraded',
    ),
    invalidated_review_present: [...reviewsByAuditClass.values()].some(
      (review) => review.invalidated === true,
    ),
    stale_review_present: staleReviewPresent,
    reviewer_skills: reviewerSkills,
    reviewer_agent_ids: reviewerAgentIds,
    security_trigger_reasons: securityTriggerReasons,
    process_complete: processComplete,
    blockers,
    next_step: nextStep || defaultNextStep(dossierRecord.frontmatter.status, step) || undefined,
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

type VerificationProfileCategory = {
  command: string | null;
  evidence: string[];
  required: boolean;
  sideEffectful: boolean;
};

type VerificationProfile = {
  categories: Map<string, VerificationProfileCategory>;
  requiredCategories: string[];
  scope: string;
  source: string;
};

function normalizeVerificationCategoryId(value: string, label: string, helpText: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new UsageError(`${label} cannot be empty.`, helpText);
  }
  if (!PRE_REVIEW_RISK_IDENTIFIER_PATTERN.test(normalized)) {
    throw new UsageError(
      `${label} must be a stable lowercase identifier using letters, digits, and hyphens.`,
      helpText,
    );
  }
  return normalized;
}

function toEvidenceArray(value: unknown, category: string, helpText: string): string[] {
  const rawValues =
    typeof value === 'string' ? [value] : Array.isArray(value) ? value : value == null ? [] : null;
  if (rawValues === null) {
    throw new UsageError(
      `verification profile category "${category}" evidence must be a string or string array.`,
      helpText,
    );
  }
  return uniqueStrings(
    rawValues.map((item) => {
      if (typeof item !== 'string') {
        throw new UsageError(
          `verification profile category "${category}" evidence must contain only strings.`,
          helpText,
        );
      }
      return item;
    }),
  );
}

async function readVerificationProfile(payload: {
  helpText: string;
  inputPath: string;
  root: string;
}): Promise<VerificationProfile> {
  if (path.isAbsolute(payload.inputPath)) {
    throw new UsageError(
      '--verification-profile must be a repository-relative path.',
      payload.helpText,
    );
  }
  const absPath = await resolveManagedReadPath(
    payload.root,
    payload.inputPath,
    payload.root,
    'verification profile path',
  );
  const relPath = relativeToRoot(payload.root, absPath);
  const parsed = JSON.parse(await readText(absPath)) as Record<string, unknown>;
  if (parsed.version !== 1) {
    throw new UsageError('verification profile version must be 1.', payload.helpText);
  }
  const scope =
    typeof parsed.scope === 'string'
      ? normalizeVerificationCategoryId(
          parsed.scope,
          'verification profile scope',
          payload.helpText,
        )
      : null;
  if (!scope) {
    throw new UsageError('verification profile scope is required.', payload.helpText);
  }
  if (
    parsed.categories === null ||
    typeof parsed.categories !== 'object' ||
    Array.isArray(parsed.categories)
  ) {
    throw new UsageError('verification profile categories must be an object.', payload.helpText);
  }
  const categories = new Map<string, VerificationProfileCategory>();
  for (const [rawId, rawCategory] of Object.entries(parsed.categories)) {
    const id = normalizeVerificationCategoryId(
      rawId,
      'verification profile category',
      payload.helpText,
    );
    if (rawCategory === null || typeof rawCategory !== 'object' || Array.isArray(rawCategory)) {
      throw new UsageError(
        `verification profile category "${id}" must be an object.`,
        payload.helpText,
      );
    }
    const category = rawCategory as Record<string, unknown>;
    const command =
      typeof category.command === 'string' && category.command.trim().length > 0
        ? category.command.trim()
        : null;
    if (command && /[\r\n]/u.test(command)) {
      throw new UsageError(
        `verification profile category "${id}" command must be a single-line value.`,
        payload.helpText,
      );
    }
    categories.set(id, {
      command,
      evidence: toEvidenceArray(category.evidence, id, payload.helpText),
      required: category.required === true,
      sideEffectful: category.side_effectful === true,
    });
  }
  const explicitRequired = Array.isArray(parsed.required_categories)
    ? parsed.required_categories.map((item) => {
        if (typeof item !== 'string') {
          throw new UsageError(
            'verification profile required_categories must contain only strings.',
            payload.helpText,
          );
        }
        return normalizeVerificationCategoryId(
          item,
          'verification profile required category',
          payload.helpText,
        );
      })
    : [];
  const requiredCategories = uniqueStrings([
    ...explicitRequired,
    ...[...categories.entries()]
      .filter(([, category]) => category.required)
      .map(([categoryId]) => categoryId),
  ]);
  const unknownRequired = requiredCategories.filter((categoryId) => !categories.has(categoryId));
  if (unknownRequired.length > 0) {
    throw new UsageError(
      `verification profile required_categories reference missing categories: ${unknownRequired.join(', ')}.`,
      payload.helpText,
    );
  }
  return { source: relPath, scope, categories, requiredCategories };
}

function syntheticVerificationCheck(payload: {
  message: string;
  name: string;
  status: 'fail' | 'pass';
}): VerificationCheck {
  return {
    name: payload.name,
    command: 'verification profile evidence',
    exit_code: payload.status === 'pass' ? 0 : 1,
    stdout: payload.status === 'pass' ? payload.message : '',
    stderr: payload.status === 'fail' ? payload.message : '',
    duration_ms: 0,
    status: payload.status,
  };
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
    '  --skip-index-refresh              Skip index-refresh in the verification bundle.',
    '  --skip-diff-check                 Skip git diff --check.',
    '  --coverage-orphans-scope <scope>  Scope for coverage orphan detection.',
    '  --verification-profile <path>     Repository-relative JSON profile declaring required verification categories.',
    '  --extra <command>                 Repeatable extra shell command.',
    '  -h, --help                        Show help.',
    '',
    'Notes:',
    '  - Use --dossier for the canonical one-dossier close-out path.',
    '  - Use --changed-only only for repo-scope verification of the current change set.',
    '  - Without --dossier or --changed-only, dossier-verify runs repo-wide and writes a global artifact that is not a dossier-step-close input.',
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
  const skipIndexRefresh = hasOption(argv, '--skip-index-refresh');
  const skipDiffCheck = hasOption(argv, '--skip-diff-check');
  const coverageOrphansScope = takeOption(argv, '--coverage-orphans-scope', 'auto') ?? 'auto';
  const verificationProfilePath = takeOption(argv, '--verification-profile', null);
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
  const verificationProfile = verificationProfilePath
    ? await readVerificationProfile({
        root: absRoot,
        inputPath: verificationProfilePath,
        helpText,
      })
    : null;
  const implementationStageState =
    dossierRelPath && step === 'implementation'
      ? await readStageState(absRoot, 'implementation', featureId)
      : null;
  const implementationProfileRequired =
    step === 'implementation' &&
    (await resolveImplementationReviewScope(absRoot, featureId)) === 'code-bearing' &&
    (implementationStageState?.pre_review_risk_families.length ?? 0) > 0;
  if (!skipIndexRefresh) {
    checks.push(
      await captureCommandResult({
        name: 'index-refresh',
        commandName: 'index-refresh',
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

  const satisfiedCategories: string[] = [];
  const missingCategories: string[] = [];
  const sideEffectfulCategories: string[] = [];
  const profileRequiredCategories = verificationProfile
    ? verificationProfile.requiredCategories
    : implementationProfileRequired
      ? ['protected-side-effect-profile']
      : [];
  if (verificationProfile) {
    if (implementationProfileRequired) {
      if (verificationProfile.scope !== IMPLEMENTATION_PROTECTED_PROFILE_SCOPE) {
        missingCategories.push('protected-side-effect-profile');
        checks.push(
          syntheticVerificationCheck({
            name: 'profile:protected-side-effect-profile',
            status: 'fail',
            message: `Verification profile scope must be ${IMPLEMENTATION_PROTECTED_PROFILE_SCOPE} for code-bearing implementation with declared pre-review risk families.`,
          }),
        );
      }
      if (verificationProfile.requiredCategories.length === 0) {
        missingCategories.push('protected-side-effect-profile');
        checks.push(
          syntheticVerificationCheck({
            name: 'profile:protected-side-effect-profile',
            status: 'fail',
            message:
              'Verification profile must declare at least one required category for code-bearing implementation with declared pre-review risk families.',
          }),
        );
      }
    }
    for (const categoryId of verificationProfile.requiredCategories) {
      const category = verificationProfile.categories.get(categoryId);
      if (!category) {
        missingCategories.push(categoryId);
        continue;
      }
      if (category.sideEffectful) {
        sideEffectfulCategories.push(categoryId);
      }
      const commandCheck = category.command
        ? runExternalCommand({
            name: `profile:${categoryId}`,
            command: category.command,
            cwd: absRoot,
            shell: true,
            displayCommand: category.command,
          })
        : null;
      if (commandCheck) {
        checks.push(commandCheck);
      }
      const evidenceSatisfied = category.evidence.length > 0;
      const commandSatisfied = commandCheck === null || commandCheck.status === 'pass';
      const satisfied = category.sideEffectful
        ? evidenceSatisfied && commandSatisfied
        : commandCheck !== null
          ? commandCheck.status === 'pass'
          : evidenceSatisfied;
      if (satisfied) {
        satisfiedCategories.push(categoryId);
        if (!commandCheck) {
          checks.push(
            syntheticVerificationCheck({
              name: `profile:${categoryId}`,
              status: 'pass',
              message: `Declared evidence: ${category.evidence.join(' | ')}`,
            }),
          );
        }
      } else {
        missingCategories.push(categoryId);
        if (category.sideEffectful && !evidenceSatisfied) {
          checks.push(
            syntheticVerificationCheck({
              name: `profile:${categoryId}:evidence`,
              status: 'fail',
              message: 'Required side-effect verification category has no evidence pointer.',
            }),
          );
        }
        if (!commandCheck) {
          checks.push(
            syntheticVerificationCheck({
              name: `profile:${categoryId}`,
              status: 'fail',
              message: 'Required verification category has no evidence or passing command.',
            }),
          );
        }
      }
    }
  } else if (implementationProfileRequired) {
    missingCategories.push('protected-side-effect-profile');
    checks.push(
      syntheticVerificationCheck({
        name: 'profile:protected-side-effect-profile',
        status: 'fail',
        message:
          'Code-bearing implementation with declared pre-review risk families requires --verification-profile.',
      }),
    );
  }

  const overallStatus = checks.every((check) => check.status === 'pass') ? 'pass' : 'fail';
  const eventCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    step,
    feature_id: featureId,
    dossier: dossierRelPath,
    event_commit: eventCommit,
    status: overallStatus,
    verification_profile_source: verificationProfile?.source ?? null,
    verification_profile_scope: verificationProfile?.scope ?? null,
    required_categories: profileRequiredCategories,
    satisfied_categories: satisfiedCategories,
    missing_categories: missingCategories,
    side_effectful_categories: sideEffectfulCategories,
    next_action:
      missingCategories.length > 0
        ? `Provide passing evidence for required verification categories: ${missingCategories.join(', ')}.`
        : null,
    checks,
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'verification',
    featureId,
    `${step}-${eventCommit ? eventCommit.slice(0, 12) : 'workspace'}.json`,
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
    'Return the next dossier-local workflow stage for already selected work.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} next-step [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --dossier <path>             Resolve next step for one dossier. Required whenever more than one dossier exists in the repo.',
    '  --json                       Emit JSON output.',
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - workflow_stage_next is a real workflow stage name or null; it never uses shipped CLI command names.',
    '  - next-step stays dossier-local; use dossier-engineer backlog commands for selection, readiness, or lifecycle actualization.',
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
  let eventCommit: string | null = null;
  let dirtyWorktree = false;
  if (inGitRepo(absRoot)) {
    eventCommit = getCurrentCommit(absRoot);
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

  const targetFeatureId = target
    ? frontmatterString(target.frontmatter, 'id', path.basename(target.absPath, '.md'))
    : null;
  const postCloseBacklogHygiene = targetFeatureId
    ? evaluatePostCloseBacklogHygiene({
        state: await readStageState(absRoot, 'implementation', targetFeatureId),
        truth: await readBacklogTruthTimestamps(absRoot),
      })
    : evaluatePostCloseBacklogHygiene({
        state: null,
        truth: { updated_at: null, last_refresh_at: null },
      });

  const workflowNext =
    latestStepArtifact?.process_complete === false
      ? normalizeWorkflowStage(latestStepArtifact.next_step ?? null)
      : target
        ? normalizeWorkflowStage(statusToNextStep(target.frontmatter.status))
        : null;

  const blockers =
    latestStepArtifact?.process_complete === false && Array.isArray(latestStepArtifact.blockers)
      ? latestStepArtifact.blockers.filter((value): value is string => typeof value === 'string')
      : target
        ? []
        : [
            'No active dossier found. Select backlog work with dossier-engineer backlog commands and create a dossier via feature-intake before using next-step.',
          ];
  const reviewFreshness = latestReviewArtifact
    ? latestReviewArtifact.verdict === 'PASS'
      ? 'pass'
      : latestReviewArtifact.verdict === 'FAIL'
        ? 'fail'
        : 'unknown'
    : 'missing';

  const summary = {
    target_dossier: target ? target.relPath : null,
    dossier_status:
      typeof target?.frontmatter.status === 'string' ? target.frontmatter.status : null,
    workflow_stage_next: workflowNext,
    blocking_gate: blockers,
    uncommitted_work: dirtyWorktree,
    review_freshness: reviewFreshness,
    event_commit: eventCommit,
    review_trace_commit: latestReviewArtifact?.event_commit ?? null,
    process_complete: latestStepArtifact ? Boolean(latestStepArtifact.process_complete) : null,
    post_close_backlog_hygiene_status: postCloseBacklogHygiene.status,
    post_close_backlog_hygiene_artifact: postCloseBacklogHygiene.artifact,
    post_close_backlog_hygiene_blockers: postCloseBacklogHygiene.blockers,
  };

  if (json) {
    writeLine(io.stdout, JSON.stringify(summary, null, 2));
    return EXIT_SUCCESS;
  }

  writeLine(
    io.stdout,
    `Workflow stage next (workflow stage, not CLI command): ${summary.workflow_stage_next ?? 'none'}`,
  );
  writeLine(io.stdout, `Target dossier: ${summary.target_dossier ?? 'none selected'}`);
  writeLine(io.stdout, `Dossier status: ${summary.dossier_status ?? 'n/a'}`);
  writeLine(
    io.stdout,
    `Blocking gate: ${summary.blocking_gate.length > 0 ? summary.blocking_gate.join(' | ') : 'none recorded'}`,
  );
  writeLine(io.stdout, `Uncommitted work: ${summary.uncommitted_work ? 'yes' : 'no'}`);
  writeLine(io.stdout, `Review freshness: ${summary.review_freshness}`);
  writeLine(io.stdout, `Event commit: ${summary.event_commit ?? 'none'}`);
  writeLine(io.stdout, `Review trace commit: ${summary.review_trace_commit ?? 'none'}`);
  writeLine(
    io.stdout,
    `Process-complete: ${summary.process_complete === null ? 'unknown' : summary.process_complete ? 'yes' : 'no'}`,
  );
  writeLine(io.stdout, `Post-close backlog hygiene: ${summary.post_close_backlog_hygiene_status}`);
  writeLine(
    io.stdout,
    `Post-close hygiene artifact: ${summary.post_close_backlog_hygiene_artifact ?? 'none'}`,
  );
  writeLine(
    io.stdout,
    `Post-close hygiene blockers: ${
      summary.post_close_backlog_hygiene_blockers.length > 0
        ? summary.post_close_backlog_hygiene_blockers.join(' | ')
        : 'none'
    }`,
  );
  return EXIT_SUCCESS;
}

function lifecycleRefreshHelp(): string {
  return [
    'Rebuild lifecycle metrics and repo-local session anchors from structured lifecycle telemetry.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} lifecycle-refresh --feature-id <id> [options]`,
    '',
    'Options:',
    '  --root <path>                Repository root. Defaults to cwd.',
    '  --feature-id <id>            Feature id such as F-0001. Required unless --dossier is provided.',
    '  --dossier <path>             Dossier path used to resolve feature id.',
    '  --feature-cycle-id <id>      Lifecycle cycle id such as fc01. Required when more than one cycle exists for the feature.',
    '  --json                       Emit JSON output.',
    '  -h, --help                   Show help.',
    '',
    'Notes:',
    '  - lifecycle-refresh reads structured lifecycle logs and JSON artifacts only.',
    '  - It does not interpret prose and does not infer missing telemetry from narrative text.',
    '  - It refreshes .dossier/metrics/<feature-id>/<feature_cycle_id>.json and .dossier/retro/session-index.jsonl.',
  ].join('\n');
}

async function runLifecycleRefreshCommand(argv: string[], io: CliIo): Promise<number> {
  const helpText = lifecycleRefreshHelp();
  if (hasOption(argv, '--help', '-h')) {
    writeLine(io.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const root = takeOption(argv, '--root', process.cwd()) ?? process.cwd();
  const dossier = takeOption(argv, '--dossier', null);
  let featureId = takeOption(argv, '--feature-id', null);
  const featureCycleId = takeOption(argv, '--feature-cycle-id', null);
  const json = hasOption(argv, '--json');
  const absRoot = path.resolve(root);

  if (dossier) {
    const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), {
      root: absRoot,
    });
    featureId =
      featureId ??
      frontmatterString(
        dossierRecord.frontmatter,
        'id',
        path.basename(dossierRecord.absPath, '.md'),
      );
  }

  featureId = ensureRequired(
    featureId,
    '--feature-id is required unless --dossier is provided.',
    helpText,
  );

  const result = await refreshLifecycleArtifacts({
    root: absRoot,
    featureId,
    featureCycleId,
  });
  const metricsPath = relativeToRoot(absRoot, result.metricsPath);
  const sessionIndexPath = relativeToRoot(absRoot, result.sessionIndexPath);

  if (json) {
    writeLine(
      io.stdout,
      JSON.stringify(
        {
          feature_id: result.featureId,
          feature_cycle_id: result.featureCycleId,
          metrics_path: metricsPath,
          session_index_path: sessionIndexPath,
          snapshot: result.snapshot,
        },
        null,
        2,
      ),
    );
    return EXIT_SUCCESS;
  }

  writeLine(
    io.stdout,
    `[lifecycle-refresh] feature=${result.featureId} feature_cycle_id=${result.featureCycleId}`,
  );
  writeLine(io.stdout, `[lifecycle-refresh] metrics=${metricsPath}`);
  writeLine(io.stdout, `[lifecycle-refresh] session_index=${sessionIndexPath}`);
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
    description:
      'Refresh generated dossier table/graph blocks only; use index-refresh for a full refresh.',
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
    aliases: [],
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
    description: 'Persist an already obtained independent review artifact.',
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
    description: 'Resolve the next dossier-local workflow stage from structured state.',
    helpText: nextStepHelp,
    run: runNextStepCommand,
  },
  {
    name: 'lifecycle-refresh',
    aliases: [],
    description: 'Rebuild lifecycle metrics and session anchors from structured telemetry.',
    helpText: lifecycleRefreshHelp,
    run: runLifecycleRefreshCommand,
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
    'Commands below are shipped CLI commands only.',
    'Workflow stages such as feature-intake, spec-compact, plan-slice, implementation, and change-proposal are documented in SKILL.md and active references.',
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
