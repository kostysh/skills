import fs from 'node:fs';
import path from 'node:path';

import { listFilesRecursive, sortUnique } from './shared.ts';
import type { ScopeConfidence, SessionSummary } from './types.ts';

interface TraceScopeInputs {
  sessionSummary: SessionSummary;
  projectRoot: string | null;
}

interface TraceScopeSummary {
  project_root: string | null;
  mentioned_backlog_items: string[];
  mentioned_features: string[];
  touched_paths: string[];
  referenced_artifacts: string[];
  candidate_stage_logs: string[];
  candidate_review_artifacts: string[];
  candidate_verification_artifacts: string[];
  scope_confidence: ScopeConfidence;
  scope_ambiguities: string[];
}

const SKIPPED_KEYS = new Set([
  'base_instructions',
  'developer_instructions',
  'user_instructions',
  'formatted_output',
]);

function escapeForRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function trimPathCandidate(value: string): string {
  return value.replaceAll(/^[\s("'`[{<]+|[\s"',.;:)\]}>`]+$/gu, '');
}

function isInterestingRelativePath(value: string): boolean {
  return /^(?:\.dossier|docs|src|test|scripts|skills|packages)\//u.test(value);
}

function isInterestingRootFile(value: string): boolean {
  return /^(?:AGENTS\.md|README\.md|package\.json|pnpm-lock\.yaml|tsconfig\.json)$/u.test(value);
}

function normalizePathCandidate(candidate: string, projectRoot: string | null): string | null {
  const trimmed = trimPathCandidate(candidate);
  if (!trimmed) {
    return null;
  }

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  if (projectRoot && (isInterestingRelativePath(trimmed) || isInterestingRootFile(trimmed))) {
    return path.resolve(projectRoot, trimmed);
  }

  return null;
}

function isProjectScopedPath(value: string, projectRoot: string | null): boolean {
  if (!projectRoot) {
    return false;
  }

  const normalizedRoot = path.resolve(projectRoot);
  const normalizedValue = path.resolve(value);
  return (
    normalizedValue === normalizedRoot ||
    normalizedValue.startsWith(`${normalizedRoot}${path.sep}`) ||
    normalizedValue.startsWith(`${normalizedRoot}/`)
  );
}

function isReferencedArtifact(value: string, projectRoot: string | null): boolean {
  if (!projectRoot) {
    return false;
  }

  const relative = path.relative(projectRoot, value);
  if (relative.startsWith('..')) {
    return false;
  }

  return (
    relative.startsWith('.dossier/') ||
    relative.startsWith(`.dossier${path.sep}`) ||
    relative.startsWith('docs/') ||
    relative.startsWith(`docs${path.sep}`)
  );
}

function isStageLogArtifact(value: string, projectRoot: string | null): boolean {
  if (!projectRoot) {
    return false;
  }

  const relative = path.relative(projectRoot, value);
  if (relative.startsWith('..')) {
    return false;
  }

  return (
    relative.startsWith('.dossier/logs/') ||
    relative.startsWith(`.dossier${path.sep}logs${path.sep}`)
  );
}

function collectEventTexts(input: unknown, pathTrail: string[] = []): string[] {
  if (input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string') {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectEventTexts(item, pathTrail));
  }

  if (typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  const eventType = typeof record.type === 'string' ? record.type : null;
  if (eventType === 'session_meta') {
    const payload =
      record.payload && typeof record.payload === 'object'
        ? (record.payload as Record<string, unknown>)
        : null;
    const out: string[] = [];
    if (typeof payload?.id === 'string') {
      out.push(payload.id);
    }
    if (typeof payload?.cwd === 'string') {
      out.push(payload.cwd);
    }
    return out;
  }

  if (eventType === 'turn_context') {
    return [];
  }

  const out: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (SKIPPED_KEYS.has(key)) {
      continue;
    }

    out.push(...collectEventTexts(value, [...pathTrail, key]));
  }

  return out;
}

function extractMatches(values: readonly string[], pattern: RegExp): string[] {
  const matches: string[] = [];
  for (const value of values) {
    for (const match of value.matchAll(pattern)) {
      const candidate = match[1] ?? match[0];
      if (candidate) {
        matches.push(candidate);
      }
    }
  }
  return sortUnique(matches);
}

function extractTouchedPaths(values: readonly string[], projectRoot: string | null): string[] {
  const rawCandidates: string[] = [];
  const absolutePathPattern = /(?:^|[\s("'`[{<])((?:\/[A-Za-z0-9._@-]+)+(?:\.[A-Za-z0-9._-]+)?)/gu;
  const relativePathPattern =
    /(?:^|[\s("'`[{<])((?:\.dossier|docs|src|test|scripts|skills|packages)\/[A-Za-z0-9._@/\-]+(?:\.[A-Za-z0-9._-]+)?)/gu;
  const rootFilePattern =
    /\b(AGENTS\.md|README\.md|package\.json|pnpm-lock\.yaml|tsconfig\.json)\b/gu;

  rawCandidates.push(...extractMatches(values, absolutePathPattern));
  rawCandidates.push(...extractMatches(values, relativePathPattern));
  rawCandidates.push(...extractMatches(values, rootFilePattern));

  const normalized = rawCandidates
    .map((value) => normalizePathCandidate(value, projectRoot))
    .filter((value): value is string => value !== null)
    .filter((value) => isProjectScopedPath(value, projectRoot));

  return sortUnique(normalized);
}

function extractEventType(record: Record<string, unknown>): string | null {
  return (
    [record.type, record.event_type, record.kind, record.event, record.name].find(
      (value): value is string => typeof value === 'string',
    ) ?? null
  );
}

function extractEventToolName(record: Record<string, unknown>): string | null {
  return (
    [record.tool, record.tool_name, record.recipient].find(
      (value): value is string => typeof value === 'string',
    ) ?? null
  );
}

function isToolCallEvent(record: Record<string, unknown>): boolean {
  const eventType = extractEventType(record);
  return (
    typeof record.command === 'string' ||
    typeof record.patch === 'string' ||
    typeof record.diff === 'string' ||
    (typeof eventType === 'string' && /tool_call/u.test(eventType))
  );
}

function isToolResultEvent(record: Record<string, unknown>): boolean {
  const eventType = extractEventType(record);
  return typeof eventType === 'string' && /tool_result/u.test(eventType);
}

function eventRequestsStageLogWrite(
  record: Record<string, unknown>,
  stageLogPaths: readonly string[],
  projectRoot: string | null,
): boolean {
  const toolName = extractEventToolName(record)?.toLowerCase() ?? '';
  if (toolName.includes('apply_patch')) {
    const patchBlob = [record.patch, record.diff, record.command]
      .filter((value): value is string => typeof value === 'string')
      .join('\n');
    const patchTargets = sortUnique(
      patchBlob.split(/\r?\n/u).flatMap((line) => {
        const match = line.match(/^\*\*\* (?:Update File|Add File|Move to): (.+)$/u);
        if (!match?.[1]) {
          return [];
        }
        const normalized = normalizePathCandidate(match[1], projectRoot);
        if (!normalized || !isProjectScopedPath(normalized, projectRoot)) {
          return [];
        }
        return [normalized];
      }),
    );
    return stageLogPaths.some((filePath) => patchTargets.includes(filePath));
  }

  const commandBlob = [record.command, record.body]
    .filter((value): value is string => typeof value === 'string')
    .join('\n');

  return stageLogPaths.some((filePath) => {
    const relativePath =
      projectRoot && isProjectScopedPath(filePath, projectRoot)
        ? path.relative(projectRoot, filePath)
        : null;
    const candidates = [filePath, relativePath].filter((value): value is string => value !== null);

    return candidates.some((candidate) => {
      const escaped = escapeForRegex(candidate);
      const destinationPatterns = [
        new RegExp(`(?:>|>>)\\s*['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
        new RegExp(`\\btee\\b(?:\\s+-a)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
        new RegExp(`\\btouch\\b\\s+['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
        new RegExp(`\\bsed\\b[\\s\\S]*?-i(?:\\S*)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
        new RegExp(`\\bperl\\b[\\s\\S]*?-0pi(?:\\S*)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
        new RegExp(`\\b(?:cp|mv)\\b(?:\\s+[^\\s]+)+\\s+['"]?${escaped}['"]?(?:\\s|$)`, 'iu'),
      ];
      return destinationPatterns.some((pattern) => pattern.test(commandBlob));
    });
  });
}

function isSuccessfulToolResult(record: Record<string, unknown>): boolean {
  if (record.aborted === true) {
    return false;
  }
  if (typeof record.exit_code === 'number' && record.exit_code !== 0) {
    return false;
  }
  if (typeof record.status === 'string' && !/^(ok|success|passed|pass)$/iu.test(record.status)) {
    return false;
  }
  if (typeof record.error === 'string' && record.error.length > 0) {
    return false;
  }
  return true;
}

function hasConfirmedToolResult(
  events: readonly unknown[],
  startIndex: number,
  expectedToolName: string | null,
): boolean {
  for (let index = startIndex + 1; index < events.length; index += 1) {
    const candidate = events[index];
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    const record = candidate as Record<string, unknown>;
    if (isToolResultEvent(record)) {
      const resultToolName = extractEventToolName(record)?.toLowerCase() ?? null;
      if (
        expectedToolName !== null &&
        resultToolName !== null &&
        resultToolName !== expectedToolName
      ) {
        continue;
      }
      return isSuccessfulToolResult(record);
    }

    if (
      isToolCallEvent(record) ||
      typeof record.type === 'string' ||
      typeof record.event === 'string'
    ) {
      return false;
    }
  }

  return false;
}

function extractChangedStageLogPaths(
  events: readonly unknown[],
  projectRoot: string | null,
): string[] {
  const out: string[] = [];

  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object') {
      continue;
    }

    const record = event as Record<string, unknown>;
    if (!isToolCallEvent(record)) {
      continue;
    }

    const eventTexts = collectEventTexts(event);
    const eventStageLogPaths = extractTouchedPaths(eventTexts, projectRoot).filter((filePath) =>
      isStageLogArtifact(filePath, projectRoot),
    );
    if (eventStageLogPaths.length === 0) {
      continue;
    }
    if (!eventRequestsStageLogWrite(record, eventStageLogPaths, projectRoot)) {
      continue;
    }
    if (
      !hasConfirmedToolResult(events, index, extractEventToolName(record)?.toLowerCase() ?? null)
    ) {
      continue;
    }

    out.push(...eventStageLogPaths);
  }

  return sortUnique(out);
}

function collectFeatureScopedCandidates(
  baseDir: string | undefined,
  featureIds: readonly string[],
): string[] {
  if (!baseDir || featureIds.length === 0 || !fs.existsSync(baseDir)) {
    return [];
  }

  return sortUnique(
    listFilesRecursive(baseDir).filter((filePath) =>
      featureIds.some((featureId) => filePath.includes(featureId)),
    ),
  );
}

function scoreScopeConfidence(
  sessionPresent: boolean,
  backlogItems: readonly string[],
  featureIds: readonly string[],
  touchedPaths: readonly string[],
  referencedArtifacts: readonly string[],
  ambiguities: readonly string[],
): ScopeConfidence {
  if (!sessionPresent) {
    return 'low';
  }

  const directAnchorCount =
    backlogItems.length + featureIds.length + touchedPaths.length + referencedArtifacts.length;
  if (directAnchorCount === 0) {
    return 'low';
  }

  return ambiguities.length > 0 ? 'medium' : 'high';
}

export function extractTraceScope({
  sessionSummary,
  projectRoot,
}: TraceScopeInputs): TraceScopeSummary {
  const texts = sessionSummary.events.flatMap((event) => collectEventTexts(event));
  const mentionedBacklogItems = extractMatches(texts, /\b(CF-[A-Za-z0-9._-]+)\b/gu);
  const mentionedFeatures = extractMatches(texts, /\b(F-\d{4,})\b/gu);
  const touchedPaths = extractTouchedPaths(texts, projectRoot);
  const touchedStageLogs = extractChangedStageLogPaths(sessionSummary.events, projectRoot);
  const referencedArtifacts = sortUnique(
    touchedPaths.filter((filePath) => isReferencedArtifact(filePath, projectRoot)),
  );

  const candidateReviewArtifacts = sortUnique([
    ...referencedArtifacts.filter((filePath) =>
      filePath.includes(`${path.sep}.dossier${path.sep}reviews${path.sep}`),
    ),
    ...collectFeatureScopedCandidates(
      projectRoot ? path.join(projectRoot, '.dossier', 'reviews') : undefined,
      mentionedFeatures,
    ),
  ]);
  const candidateVerificationArtifacts = sortUnique([
    ...referencedArtifacts.filter((filePath) =>
      filePath.includes(`${path.sep}.dossier${path.sep}verification${path.sep}`),
    ),
    ...collectFeatureScopedCandidates(
      projectRoot ? path.join(projectRoot, '.dossier', 'verification') : undefined,
      mentionedFeatures,
    ),
  ]);
  const candidateStageLogs = touchedStageLogs;

  const scopeAmbiguities: string[] = [];
  if (
    mentionedBacklogItems.length === 0 &&
    mentionedFeatures.length === 0 &&
    touchedPaths.length === 0 &&
    referencedArtifacts.length === 0
  ) {
    scopeAmbiguities.push(
      'No trace-derived backlog items, feature ids, or touched project paths were found.',
    );
  }
  if (mentionedBacklogItems.length > 1) {
    scopeAmbiguities.push(
      `Multiple backlog items were mentioned in one trace: ${mentionedBacklogItems.join(', ')}.`,
    );
  }
  if (mentionedFeatures.length > 1) {
    scopeAmbiguities.push(
      `Multiple feature ids were mentioned in one trace: ${mentionedFeatures.join(', ')}.`,
    );
  }
  if (candidateStageLogs.length === 0) {
    scopeAmbiguities.push(
      'The session trace did not confirm any stage-log path created or changed in this session.',
    );
  }
  if (mentionedFeatures.length > 0 && candidateReviewArtifacts.length === 0) {
    scopeAmbiguities.push(
      `No review artifacts were auto-linked for feature ids ${mentionedFeatures.join(', ')}.`,
    );
  }
  if (mentionedFeatures.length > 0 && candidateVerificationArtifacts.length === 0) {
    scopeAmbiguities.push(
      `No verification artifacts were auto-linked for feature ids ${mentionedFeatures.join(', ')}.`,
    );
  }

  return {
    project_root: projectRoot,
    mentioned_backlog_items: mentionedBacklogItems,
    mentioned_features: mentionedFeatures,
    touched_paths: touchedPaths,
    referenced_artifacts: referencedArtifacts,
    candidate_stage_logs: candidateStageLogs,
    candidate_review_artifacts: candidateReviewArtifacts,
    candidate_verification_artifacts: candidateVerificationArtifacts,
    scope_confidence: scoreScopeConfidence(
      sessionSummary.exists,
      mentionedBacklogItems,
      mentionedFeatures,
      touchedPaths,
      referencedArtifacts,
      scopeAmbiguities,
    ),
    scope_ambiguities: scopeAmbiguities,
  };
}
