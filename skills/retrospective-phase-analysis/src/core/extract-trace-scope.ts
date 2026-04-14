import fs from 'node:fs';
import path from 'node:path';

import { sortUnique } from './shared.ts';
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

const ID_TEXT_KEYS = new Set(['content', 'message', 'text', 'command', 'patch', 'body']);
const PATH_TEXT_KEYS = new Set([
  'content',
  'message',
  'text',
  'command',
  'patch',
  'body',
  'notes',
  'path',
  'paths',
  'filePath',
  'file_path',
  'dossier',
  'verify_artifact',
  'review_artifact',
]);

const CANONICAL_BACKLOG_ITEM_PATTERN = /(^|[^A-Za-z0-9_-])(CF-\d{3,4})(?![A-Za-z0-9_.-])/gu;
const CANONICAL_FEATURE_ID_PATTERN = /(^|[^A-Za-z0-9_-])(F-\d{4})(?![A-Za-z0-9_.-])/gu;
const FEATURE_ID_IN_PATH_PATTERN = /(?:^|[\\/])(F-\d{4})(?=[\\/]|[-_.])/gu;

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

function isHighSignalAnchorText(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const lineCount = trimmed.split(/\r?\n/u).length;
  if (trimmed.length > 4000 || lineCount > 40) {
    return false;
  }

  return !(
    trimmed.includes('<INSTRUCTIONS>') ||
    trimmed.includes('# AGENTS.md') ||
    trimmed.includes('Original token count:') ||
    trimmed.includes('Process exited with code') ||
    trimmed.startsWith('Command: /bin/bash -lc') ||
    trimmed.startsWith('Command: node ')
  );
}

function extractPathAnchorTexts(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (isHighSignalAnchorText(trimmed)) {
    return [trimmed];
  }

  const out = trimmed
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) {
        return false;
      }

      if (/^\*\*\* (?:Update File|Add File|Move to): /u.test(line)) {
        return true;
      }

      const mentionsInterestingPath =
        /(?:^|[\s("'`[{<])(?:\.dossier|docs|src|test|scripts|skills|packages)\//u.test(line) ||
        /(?:^|[\s("'`[{<])(?:\/[A-Za-z0-9._@-]+)+(?:\.[A-Za-z0-9._-]+)?/u.test(line);
      if (!mentionsInterestingPath) {
        return false;
      }

      return (
        /(>|>>)\s*['"]?/u.test(line) ||
        /\btee\b(?:\s+-a)?\s+/u.test(line) ||
        /\btouch\b\s+/u.test(line) ||
        /\bsed\b[\s\S]*?-i/u.test(line) ||
        /\bperl\b[\s\S]*?-0pi/u.test(line) ||
        /\b(?:cp|mv)\b(?:\s+\S+)+\s+/u.test(line)
      );
    });

  return out.length > 0 ? out : [];
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

function collectNestedStrings(input: unknown, depth = 0): string[] {
  if (depth > 8 || input === null || input === undefined) {
    return [];
  }

  if (typeof input === 'string') {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectNestedStrings(item, depth + 1));
  }

  if (typeof input !== 'object') {
    return [];
  }

  return Object.entries(input).flatMap(([key, value]) => {
    if (SKIPPED_KEYS.has(key)) {
      return [];
    }
    return collectNestedStrings(value, depth + 1);
  });
}

function collectEventTextsByKeys(
  input: unknown,
  allowedKeys: ReadonlySet<string>,
  depth = 0,
): string[] {
  if (depth > 8 || input === null || input === undefined) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectEventTextsByKeys(item, allowedKeys, depth + 1));
  }

  if (typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  if (record.type === 'session_meta') {
    return [];
  }

  const out: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (SKIPPED_KEYS.has(key)) {
      continue;
    }

    if (allowedKeys.has(key)) {
      out.push(...collectNestedStrings(value, depth + 1));
      continue;
    }

    out.push(...collectEventTextsByKeys(value, allowedKeys, depth + 1));
  }

  return out;
}

function extractMatches(values: readonly string[], pattern: RegExp): string[] {
  const matches: string[] = [];
  for (const value of values) {
    for (const match of value.matchAll(pattern)) {
      const candidate = match[2] ?? match[1] ?? match[0];
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
    .filter((value) => isProjectScopedPath(value, projectRoot))
    .filter((value) => {
      if (projectRoot && path.resolve(value) === path.resolve(projectRoot)) {
        return false;
      }

      if (fs.existsSync(value)) {
        return fs.statSync(value).isFile();
      }

      return path.extname(value).length > 0 || isInterestingRootFile(path.basename(value));
    });

  return sortUnique(normalized);
}

function extractCanonicalBacklogItems(values: readonly string[]): string[] {
  return extractMatches(values, CANONICAL_BACKLOG_ITEM_PATTERN);
}

function extractCanonicalFeatureIds(values: readonly string[]): string[] {
  return extractMatches(values, CANONICAL_FEATURE_ID_PATTERN);
}

function extractFeatureIdsFromPaths(values: readonly string[], projectRoot: string | null): string[] {
  if (!projectRoot) {
    return [];
  }

  const matches: string[] = [];
  for (const value of values) {
    const relativePath = path.relative(projectRoot, value);
    if (relativePath.startsWith('..')) {
      continue;
    }

    for (const match of relativePath.matchAll(FEATURE_ID_IN_PATH_PATTERN)) {
      if (match[1]) {
        matches.push(match[1]);
      }
    }
  }

  return sortUnique(matches);
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

function hasCommandLikeValue(value: unknown): boolean {
  return collectNestedStrings(value).some((entry) => entry.trim().length > 0);
}

function unwrapToolExecutionRecord(event: unknown): Record<string, unknown> | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const record = event as Record<string, unknown>;
  const payload =
    record.payload && typeof record.payload === 'object'
      ? (record.payload as Record<string, unknown>)
      : null;

  if (
    payload &&
    (hasCommandLikeValue(payload.command) ||
      hasCommandLikeValue(payload.patch) ||
      hasCommandLikeValue(payload.diff))
  ) {
    return payload;
  }

  return record;
}

function isToolCallEvent(record: Record<string, unknown>): boolean {
  const eventType = extractEventType(record);
  return (
    hasCommandLikeValue(record.command) ||
    hasCommandLikeValue(record.patch) ||
    hasCommandLikeValue(record.diff) ||
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

  const commandBlob = [record.command, record.body, record.patch, record.diff]
    .flatMap((value) => collectNestedStrings(value))
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
  if (
    typeof record.status === 'string' &&
    !/^(ok|success|passed|pass|completed|complete)$/iu.test(record.status)
  ) {
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
    const record = unwrapToolExecutionRecord(event);
    if (!record) {
      continue;
    }
    if (!isToolCallEvent(record)) {
      continue;
    }

    const eventTexts = collectEventTextsByKeys(event, PATH_TEXT_KEYS);
    const eventStageLogPaths = extractTouchedPaths(eventTexts, projectRoot).filter((filePath) =>
      isStageLogArtifact(filePath, projectRoot),
    );
    if (eventStageLogPaths.length === 0) {
      continue;
    }
    if (!eventRequestsStageLogWrite(record, eventStageLogPaths, projectRoot)) {
      continue;
    }
    const inlineSuccessfulExecution =
      extractEventType(record) === 'exec_command_end' && isSuccessfulToolResult(record);
    if (
      !inlineSuccessfulExecution &&
      !hasConfirmedToolResult(events, index, extractEventToolName(record)?.toLowerCase() ?? null)
    ) {
      continue;
    }

    out.push(...eventStageLogPaths);
  }

  return sortUnique(out);
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
  const idTexts = sessionSummary.events
    .flatMap((event) => collectEventTextsByKeys(event, ID_TEXT_KEYS))
    .filter(isHighSignalAnchorText);
  const pathTexts = sessionSummary.events
    .flatMap((event) => collectEventTextsByKeys(event, PATH_TEXT_KEYS))
    .flatMap((value) => extractPathAnchorTexts(value));
  const touchedPaths = extractTouchedPaths(pathTexts, projectRoot);
  const touchedStageLogs = extractChangedStageLogPaths(sessionSummary.events, projectRoot);
  const mentionedBacklogItems = extractCanonicalBacklogItems(idTexts);
  const mentionedFeatures = sortUnique([
    ...extractCanonicalFeatureIds(idTexts),
    ...extractFeatureIdsFromPaths(touchedPaths, projectRoot),
  ]);
  const referencedArtifacts = sortUnique(
    touchedPaths.filter((filePath) => isReferencedArtifact(filePath, projectRoot)),
  );

  const candidateReviewArtifacts = sortUnique(
    referencedArtifacts.filter((filePath) =>
      filePath.includes(`${path.sep}.dossier${path.sep}reviews${path.sep}`),
    ),
  );
  const candidateVerificationArtifacts = sortUnique(
    referencedArtifacts.filter((filePath) =>
      filePath.includes(`${path.sep}.dossier${path.sep}verification${path.sep}`),
    ),
  );
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
      `The trace did not directly reference any review artifacts for extracted feature ids ${mentionedFeatures.join(', ')}.`,
    );
  }
  if (mentionedFeatures.length > 0 && candidateVerificationArtifacts.length === 0) {
    scopeAmbiguities.push(
      `The trace did not directly reference any verification artifacts for extracted feature ids ${mentionedFeatures.join(', ')}.`,
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
