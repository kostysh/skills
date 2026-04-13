import fs from 'node:fs';
import path from 'node:path';

import { listFilesRecursive, sortUnique } from './shared.ts';
import type { LogsSummary, ScopeConfidence, SessionSummary } from './types.ts';

interface TraceScopeInputs {
  sessionSummary: SessionSummary;
  projectRoot: string | null;
  logsSummary: LogsSummary;
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
    /\b((?:\.dossier|docs|src|test|scripts|skills|packages)\/[A-Za-z0-9._@/\-]+(?:\.[A-Za-z0-9._-]+)?)\b/gu;
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

function collectLogCandidates(
  logsSummary: LogsSummary,
  featureIds: readonly string[],
  backlogItems: readonly string[],
  referencedArtifacts: readonly string[],
): string[] {
  const direct = referencedArtifacts.filter((filePath) =>
    filePath.includes(`${path.sep}.dossier${path.sep}logs${path.sep}`),
  );
  const anchored = logsSummary.logs
    .filter((log) =>
      [...featureIds, ...backlogItems].some(
        (anchor) => log.filePath.includes(anchor) || log.raw.includes(anchor),
      ),
    )
    .map((log) => log.filePath);

  const candidates = sortUnique([...direct, ...anchored]);
  if (candidates.length > 0) {
    return candidates;
  }

  return sortUnique(logsSummary.logs.map((log) => log.filePath));
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
  logsSummary,
}: TraceScopeInputs): TraceScopeSummary {
  const texts = sessionSummary.events.flatMap((event) => collectEventTexts(event));
  const mentionedBacklogItems = extractMatches(texts, /\b(CF-[A-Za-z0-9._-]+)\b/gu);
  const mentionedFeatures = extractMatches(texts, /\b(F-\d{4,})\b/gu);
  const touchedPaths = extractTouchedPaths(texts, projectRoot);
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
  const candidateStageLogs = collectLogCandidates(
    logsSummary,
    mentionedFeatures,
    mentionedBacklogItems,
    referencedArtifacts,
  );

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
  if (
    candidateStageLogs.length > 1 &&
    referencedArtifacts.every(
      (filePath) => !filePath.includes(`${path.sep}.dossier${path.sep}logs${path.sep}`),
    )
  ) {
    scopeAmbiguities.push(
      'Stage logs were discovered from the standard logs directory but not directly linked from the trace.',
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
