import fs from 'node:fs';
import path from 'node:path';

import { sortUnique, stringFromUnknown, tryParseDate } from './shared.ts';
import type {
  ArtifactCandidate,
  MetricEvidenceQuality,
  ParsedStageLog,
  ScopeArtifactIdentity,
} from './types.ts';

export interface ArtifactEvidenceEnhancement {
  artifactIdentity: ScopeArtifactIdentity;
  artifactIdentityAmbiguities: string[];
  artifactLinkedReviewCandidates: ArtifactCandidate[];
  artifactLinkedVerificationCandidates: ArtifactCandidate[];
  artifactLinkedStepCandidates: ArtifactCandidate[];
  artifactBoundaryTs: string | null;
}

const EMPTY_IDENTITY: ScopeArtifactIdentity = {
  phase_scope: null,
  primary_backlog_item_key: null,
  primary_feature_id: null,
  source: null,
};

const REVIEW_LINK_KEYS = ['review_artifacts', 'review_artifact'];
const VERIFICATION_LINK_KEYS = [
  'verification_artifacts',
  'verification_artifact',
  'verify_artifact',
];
const STEP_LINK_KEYS = ['step_artifacts', 'step_artifact'];
const BOUNDARY_TIMESTAMP_KEYS = [
  'step_close_ts',
  'close_out_ts',
  'closeout_ts',
  'process_complete_ts',
  'intake_process_complete_ts',
  'final_pass_ts',
  'ready_for_close_ts',
  'completed_at',
  'closed_at',
  'phase_completed_at',
  'verification_completed_at',
  'review_passed_at',
];

function uniqueNonEmpty(values: readonly string[]): string[] {
  return sortUnique(values.map((value) => value.trim()).filter((value) => value.length > 0));
}

function stringListFromUnknown(value: unknown): string[] {
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function pathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function safeFileInsideRoot(root: string, candidate: string): boolean {
  try {
    const stat = fs.lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      return false;
    }

    return pathInside(fs.realpathSync(root), fs.realpathSync(candidate));
  } catch {
    return false;
  }
}

function normalizeLinkedPath(projectRoot: string, value: string): string | null {
  const trimmed = value.replaceAll(/^[\s("'`[{<]+|[\s"',.;:)\]}>`]+$/gu, '');
  if (!trimmed) {
    return null;
  }

  const normalized = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.resolve(projectRoot, trimmed);
  return pathInside(projectRoot, normalized) ? normalized : null;
}

function readPreview(projectRoot: string, filePath: string): string {
  if (!safeFileInsideRoot(projectRoot, filePath)) {
    return '';
  }
  try {
    return fs.readFileSync(filePath, 'utf8').slice(0, 8000);
  } catch {
    return '';
  }
}

function pathOrContentContainsToken(projectRoot: string, filePath: string, token: string): boolean {
  return filePath.includes(token) || readPreview(projectRoot, filePath).includes(token);
}

function scopeMatchesArtifact(input: {
  projectRoot: string;
  filePath: string;
  featureId: string;
  backlogItemKey: string;
}): boolean {
  const tokens = [input.featureId, input.backlogItemKey].filter((value) => value.length > 0);
  if (tokens.length === 0) {
    return false;
  }

  return tokens.some((token) =>
    pathOrContentContainsToken(input.projectRoot, input.filePath, token),
  );
}

function artifactLinkCandidate(input: {
  projectRoot: string;
  filePath: string;
  field: string;
  log: ParsedStageLog;
  featureId: string;
  backlogItemKey: string;
}): ArtifactCandidate {
  const exists = safeFileInsideRoot(input.projectRoot, input.filePath);
  const scopeMatched =
    exists &&
    scopeMatchesArtifact({
      projectRoot: input.projectRoot,
      filePath: input.filePath,
      featureId: input.featureId,
      backlogItemKey: input.backlogItemKey,
    });
  const included = exists && scopeMatched;
  const reason = included
    ? `Linked by ${input.field} in ${input.log.filePath} and matched artifact scope.`
    : `Linked by ${input.field} in ${input.log.filePath}, but ${
        exists
          ? 'artifact scope could not be verified'
          : 'the target artifact file is missing or unsafe'
      }.`;

  return {
    path: input.filePath,
    evidence_kind: 'stage_artifact_link',
    event_ref: null,
    included,
    inclusion_source: included ? 'auto_included' : 'not_included',
    reason,
  };
}

function buildLinkedCandidates(input: {
  logs: readonly ParsedStageLog[];
  projectRoot: string | null;
  keys: readonly string[];
}): ArtifactCandidate[] {
  if (!input.projectRoot) {
    return [];
  }

  const out: ArtifactCandidate[] = [];
  for (const log of input.logs) {
    const featureId =
      stringFromUnknown(log.metadata.primary_feature_id, '') ||
      stringFromUnknown(log.metadata.feature_id, '');
    const backlogItemKey =
      stringFromUnknown(log.metadata.primary_backlog_item_key, '') ||
      stringFromUnknown(log.metadata.backlog_item_key, '');

    for (const key of input.keys) {
      for (const rawPath of stringListFromUnknown(log.metadata[key])) {
        const normalized = normalizeLinkedPath(input.projectRoot, rawPath);
        if (!normalized) {
          continue;
        }
        out.push(
          artifactLinkCandidate({
            projectRoot: input.projectRoot,
            filePath: normalized,
            field: key,
            log,
            featureId,
            backlogItemKey,
          }),
        );
      }
    }
  }

  return out;
}

function singleIdentityValue(input: {
  values: readonly string[];
  label: string;
  ambiguities: string[];
}): string | null {
  const values = uniqueNonEmpty(input.values);
  if (values.length === 0) {
    return null;
  }
  if (values.length > 1) {
    input.ambiguities.push(
      `Multiple artifact ${input.label} values were found: ${values.join(', ')}.`,
    );
    return null;
  }
  return values[0] ?? null;
}

function deriveArtifactIdentity(logs: readonly ParsedStageLog[]): {
  identity: ScopeArtifactIdentity;
  ambiguities: string[];
} {
  const ambiguities: string[] = [];
  for (const log of logs) {
    const rejectedState = stringFromUnknown(log.metadata.stage_state_artifact_rejected, '');
    if (rejectedState) {
      ambiguities.push(`Rejected mismatched stage state artifact: ${rejectedState}.`);
    }
  }
  const featureId = singleIdentityValue({
    values: logs.map(
      (log) =>
        stringFromUnknown(log.metadata.primary_feature_id, '') ||
        stringFromUnknown(log.metadata.feature_id, ''),
    ),
    label: 'feature ids',
    ambiguities,
  });
  const backlogItemKey = singleIdentityValue({
    values: logs.map(
      (log) =>
        stringFromUnknown(log.metadata.primary_backlog_item_key, '') ||
        stringFromUnknown(log.metadata.backlog_item_key, ''),
    ),
    label: 'backlog item keys',
    ambiguities,
  });
  const phaseScope = singleIdentityValue({
    values: logs.map(
      (log) =>
        stringFromUnknown(log.metadata.phase_scope, '') ||
        stringFromUnknown(log.metadata.stage, ''),
    ),
    label: 'phase scopes',
    ambiguities,
  });
  const source =
    logs
      .map((log) => stringFromUnknown(log.metadata.stage_state_artifact, '') || log.filePath)
      .find((value) => value.length > 0) ?? null;

  return {
    identity:
      featureId || backlogItemKey || phaseScope
        ? {
            phase_scope: phaseScope,
            primary_backlog_item_key: backlogItemKey,
            primary_feature_id: featureId,
            source,
          }
        : EMPTY_IDENTITY,
    ambiguities,
  };
}

function latestBoundaryTimestamp(logs: readonly ParsedStageLog[]): string | null {
  const dates: Date[] = [];
  for (const log of logs) {
    for (const key of BOUNDARY_TIMESTAMP_KEYS) {
      const parsed = tryParseDate(log.metadata[key]);
      if (parsed) {
        dates.push(parsed);
      }
    }
  }

  const latest = dates.sort((left, right) => right.valueOf() - left.valueOf())[0];
  return latest ? latest.toISOString() : null;
}

export function hasUnvalidatedFallbackMetrics(input: {
  candidate_incidents: { quality: MetricEvidenceQuality };
  process_misses: { quality: MetricEvidenceQuality };
  skills_referenced: { quality: MetricEvidenceQuality };
}): boolean {
  return Object.values(input).some((source) => source.quality === 'unvalidated_fallback');
}

export function deriveArtifactEvidenceEnhancement(input: {
  logs: readonly ParsedStageLog[];
  projectRoot: string | null;
}): ArtifactEvidenceEnhancement {
  const { identity, ambiguities } = deriveArtifactIdentity(input.logs);

  return {
    artifactIdentity: identity,
    artifactIdentityAmbiguities: ambiguities,
    artifactLinkedReviewCandidates: buildLinkedCandidates({
      logs: input.logs,
      projectRoot: input.projectRoot,
      keys: REVIEW_LINK_KEYS,
    }),
    artifactLinkedVerificationCandidates: buildLinkedCandidates({
      logs: input.logs,
      projectRoot: input.projectRoot,
      keys: VERIFICATION_LINK_KEYS,
    }),
    artifactLinkedStepCandidates: buildLinkedCandidates({
      logs: input.logs,
      projectRoot: input.projectRoot,
      keys: STEP_LINK_KEYS,
    }),
    artifactBoundaryTs: latestBoundaryTimestamp(input.logs),
  };
}
