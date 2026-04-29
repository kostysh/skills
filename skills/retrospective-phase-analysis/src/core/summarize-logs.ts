import fs from 'node:fs';
import path from 'node:path';

import { isNonPassReviewEvent, parseStageLog } from '../parsers/stage-log.ts';
import { stringFromUnknown } from './shared.ts';
import type {
  LogMetrics,
  LogsSummary,
  MetricEvidenceQuality,
  ParsedStageLog,
  ReviewEvent,
  ReviewSignal,
} from './types.ts';

function emptyMetricSource(reason: string): { quality: MetricEvidenceQuality; reason: string } {
  return {
    quality: 'none',
    reason,
  };
}

function createEmptyMetrics(): LogMetrics {
  return {
    logsTotal: 0,
    reviewRoundsTotal: 0,
    reviewFindingsTotal: 0,
    processMissesTotal: 0,
    backlogActualizedCount: 0,
    stages: {},
    skillsReferenced: {},
    lateLogStartCount: 0,
    sources: {
      candidate_incidents: emptyMetricSource('No stage logs were analyzed.'),
      process_misses: emptyMetricSource('No stage logs were analyzed.'),
      skills_referenced: emptyMetricSource('No stage logs were analyzed.'),
    },
  };
}

function qualityRank(value: MetricEvidenceQuality): number {
  return {
    none: 0,
    trace_derived: 1,
    prose_derived: 1,
    validated_fallback: 2,
    structured: 3,
    incomplete: 4,
  }[value];
}

function mergeQuality(
  current: MetricEvidenceQuality,
  incoming: MetricEvidenceQuality,
): MetricEvidenceQuality {
  if (current === 'incomplete' || incoming === 'incomplete') {
    return 'incomplete';
  }
  if (current === 'none') {
    return incoming;
  }
  if (incoming === 'none' || current === incoming) {
    return current;
  }
  if (
    current === 'trace_derived' ||
    current === 'prose_derived' ||
    incoming === 'trace_derived' ||
    incoming === 'prose_derived'
  ) {
    return 'incomplete';
  }
  return qualityRank(incoming) > qualityRank(current) ? incoming : current;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
    : [];
}

function processMissCount(log: ParsedStageLog): {
  count: number;
  quality: MetricEvidenceQuality;
} {
  const structuredMisses = Array.isArray(log.metadata.process_misses)
    ? log.metadata.process_misses
    : null;
  if (structuredMisses) {
    return { count: structuredMisses.length, quality: 'structured' };
  }

  const structuredTotal = Number(log.metadata.process_misses_total);
  if (Number.isFinite(structuredTotal)) {
    return { count: structuredTotal, quality: 'structured' };
  }

  if (log.processMissLines.length > 0) {
    return { count: log.processMissLines.length, quality: 'prose_derived' };
  }

  return { count: 0, quality: 'none' };
}

function skillNames(log: ParsedStageLog): {
  quality: MetricEvidenceQuality;
  skills: string[];
} {
  const skillsUsed = stringArray(log.metadata.skills_used);
  if (skillsUsed.length > 0) {
    return { skills: skillsUsed, quality: 'structured' };
  }

  const legacySkill = stringFromUnknown(log.metadata.skill, '');
  if (legacySkill) {
    return { skills: [legacySkill], quality: 'validated_fallback' };
  }

  return { skills: ['unknown'], quality: 'none' };
}

function isSafeStageSegment(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/u.test(value) && value !== '.' && value !== '..';
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

function stageStatePath(projectRoot: string, log: ParsedStageLog): string | null {
  const featureId =
    stringFromUnknown(log.metadata.primary_feature_id, '') ||
    stringFromUnknown(log.metadata.feature_id, '');
  const stage = stringFromUnknown(log.metadata.stage, '');
  if (!featureId || !stage || !isSafeStageSegment(featureId) || !isSafeStageSegment(stage)) {
    return null;
  }
  return path.join(projectRoot, '.dossier', 'stages', featureId, `${stage}.json`);
}

const STAGE_STATE_ALLOWED_FIELDS = new Set([
  'backlog_actualized',
  'backlog_item_key',
  'closed_at',
  'close_out_ts',
  'closeout_ts',
  'completed_at',
  'feature_id',
  'final_pass_ts',
  'intake_process_complete_ts',
  'late_log_start',
  'late_start',
  'log_quality',
  'phase_completed_at',
  'phase_scope',
  'primary_backlog_item_key',
  'primary_feature_id',
  'process_complete_ts',
  'process_misses',
  'process_misses_total',
  'ready_for_close_ts',
  'closure_bundle_id',
  'closure_bundle_round',
  'closure_bundle_rounds_by_audit_class',
  'non_pass_review_events',
  'rpa_source_identity',
  'rpa_source_quality',
  'selected_closure_ts',
  'selected_review_artifacts',
  'selected_step_artifact',
  'selected_verification_artifact',
  'review_artifact',
  'review_artifacts',
  'review_findings_total',
  'review_events',
  'review_passed_at',
  'review_rounds',
  'review_rounds_total',
  'skill',
  'skill_followups',
  'skill_issues',
  'skills_used',
  'stage',
  'step_artifact',
  'step_artifacts',
  'step_close_ts',
  'verification_artifact',
  'verification_artifacts',
  'verification_completed_at',
  'verify_artifact',
]);

function selectedStageStateFields(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => STAGE_STATE_ALLOWED_FIELDS.has(key)),
  );
}

function firstString(...values: unknown[]): string {
  return (
    values.find((value): value is string => typeof value === 'string' && value.length > 0) ?? ''
  );
}

function matchingOptionalField(left: string, right: string): boolean {
  return !left || !right || left === right;
}

function stageStateScopeMatches(state: Record<string, unknown>, log: ParsedStageLog): boolean {
  const logFeatureId = firstString(log.metadata.primary_feature_id, log.metadata.feature_id);
  const stateFeatureId = firstString(state.primary_feature_id, state.feature_id);
  const logBacklogItem = firstString(
    log.metadata.primary_backlog_item_key,
    log.metadata.backlog_item_key,
  );
  const stateBacklogItem = firstString(state.primary_backlog_item_key, state.backlog_item_key);
  const logStage = firstString(log.metadata.stage);
  const stateStage = firstString(state.stage);

  return (
    matchingOptionalField(logFeatureId, stateFeatureId) &&
    matchingOptionalField(logBacklogItem, stateBacklogItem) &&
    matchingOptionalField(logStage, stateStage)
  );
}

function enrichLogWithStageState(log: ParsedStageLog, projectRoot: string | null): ParsedStageLog {
  if (!projectRoot || !pathInside(projectRoot, log.filePath)) {
    return log;
  }
  const statePath = stageStatePath(projectRoot, log);
  if (!statePath || !safeFileInsideRoot(projectRoot, statePath)) {
    return log;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8')) as Record<string, unknown>;
    if (!stageStateScopeMatches(parsed, log)) {
      return {
        ...log,
        metadata: {
          ...log.metadata,
          stage_state_artifact_rejected: statePath,
          stage_state_rejection_reason: 'Stage state scope did not match the included stage log.',
        },
      };
    }
    return {
      ...log,
      metadata: {
        ...log.metadata,
        ...selectedStageStateFields(parsed),
        stage_state_artifact: statePath,
      },
    };
  } catch {
    return log;
  }
}

function sourceReason(quality: MetricEvidenceQuality, metric: string): string {
  if (quality === 'structured') {
    return `${metric} used structured stage artifact fields where available.`;
  }
  if (quality === 'validated_fallback') {
    return `${metric} used legacy structured metadata fields because new structured fields were absent.`;
  }
  if (quality === 'trace_derived') {
    return `${metric} used trace-derived fallback evidence because structured fields were absent.`;
  }
  if (quality === 'prose_derived') {
    return `${metric} used prose-derived fallback because structured fields were absent in at least one analyzed log.`;
  }
  if (quality === 'incomplete') {
    return `${metric} mixed lower-quality or incomplete evidence and requires agent validation.`;
  }
  return `${metric} had no usable evidence in analyzed logs.`;
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function objectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value
        .map((entry) => objectRecord(entry))
        .filter((entry): entry is Record<string, unknown> => entry !== null)
    : [];
}

function numberOrNull(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function firstNullableString(...values: unknown[]): string | null {
  return (
    values.find((value): value is string => typeof value === 'string' && value.length > 0) ?? null
  );
}

function normalizeLinkedPath(projectRoot: string | null, filePath: string | null): string | null {
  if (!filePath) {
    return null;
  }
  if (path.isAbsolute(filePath)) {
    return path.normalize(filePath);
  }
  return projectRoot ? path.resolve(projectRoot, filePath) : filePath;
}

function matchingArtifact(projectRoot: string | null, filePath: string | null): boolean {
  const normalized = normalizeLinkedPath(projectRoot, filePath);
  if (!normalized || !projectRoot) {
    return false;
  }
  return safeFileInsideRoot(projectRoot, normalized);
}

function reviewSignalFromStructuredRecord(input: {
  record: Record<string, unknown>;
  log: ParsedStageLog;
  projectRoot: string | null;
  source: ReviewSignal['source'];
  sourceIdentity: Record<string, unknown> | null;
  forceIncomplete?: boolean;
}): ReviewSignal | null {
  const raw =
    firstNullableString(
      input.record.raw,
      input.record.summary,
      input.record.message,
      input.record.title,
      input.record.notes,
    ) ?? JSON.stringify(input.record);
  const verdict = firstNullableString(
    input.record.verdict,
    input.record.status,
    input.record.result,
    input.record.outcome,
    input.record.review_status,
  );
  const reviewEvent: ReviewEvent = {
    raw,
    details: [],
    timestamp: firstNullableString(
      input.record.timestamp,
      input.record.ts,
      input.record.created_at,
      input.record.time,
      input.record.occurred_at,
    ),
    verdict,
    source: 'structured',
  };
  if (!isNonPassReviewEvent(reviewEvent)) {
    return null;
  }

  const artifactPath = firstNullableString(
    input.record.artifact_path,
    input.record.immutable_artifact_path,
    input.record.review_artifact,
    input.record.review_artifact_path,
  );
  const normalizedArtifact = normalizeLinkedPath(input.projectRoot, artifactPath);

  return {
    source_quality: input.forceIncomplete ? 'incomplete' : 'structured',
    source: input.source,
    verdict: stringFromUnknown(verdict, 'non-pass'),
    audit_class: firstNullableString(
      input.record.audit_class,
      input.record.reviewer,
      input.record.skill,
    ),
    round:
      firstNullableString(input.record.review_round_id, input.record.review_attempt_id) ??
      numberOrNull(input.record.review_round_number) ??
      numberOrNull(input.record.round),
    commit: firstNullableString(input.record.event_commit, input.record.commit),
    artifact_path: normalizedArtifact,
    matching_artifact: matchingArtifact(input.projectRoot, artifactPath),
    source_identity: input.sourceIdentity,
    timestamp: reviewEvent.timestamp,
    evidence: input.log.filePath,
    must_fix_count: numberOrNull(input.record.must_fix_count),
    evidence_count: numberOrNull(input.record.evidence_count),
  };
}

function udeReviewSignals(log: ParsedStageLog, projectRoot: string | null): ReviewSignal[] {
  const sourceIdentity = objectRecord(log.metadata.rpa_source_identity);
  const sourceQuality = objectRecord(log.metadata.rpa_source_quality);
  const reviewHistoryQuality = firstNullableString(sourceQuality?.review_history_quality);
  const forceIncomplete =
    reviewHistoryQuality === 'process_miss' || reviewHistoryQuality === 'limited';

  return objectArray(log.metadata.non_pass_review_events)
    .map((record) =>
      reviewSignalFromStructuredRecord({
        record,
        log,
        projectRoot,
        source: 'ude',
        sourceIdentity,
        forceIncomplete,
      }),
    )
    .filter((signal): signal is ReviewSignal => signal !== null);
}

function structuredReviewSignals(log: ParsedStageLog, projectRoot: string | null): ReviewSignal[] {
  return objectArray(log.metadata.review_events)
    .map((record) =>
      reviewSignalFromStructuredRecord({
        record,
        log,
        projectRoot,
        source: log.metadata.stage_state_artifact ? 'stage_state' : 'stage_log_metadata',
        sourceIdentity: objectRecord(log.metadata.rpa_source_identity),
      }),
    )
    .filter((signal): signal is ReviewSignal => signal !== null);
}

function proseReviewSignals(log: ParsedStageLog): ReviewSignal[] {
  return log.reviewEvents
    .filter((event) => event.source === 'prose' && isNonPassReviewEvent(event))
    .map((event) => ({
      source_quality: 'prose_derived',
      source: 'prose',
      verdict: stringFromUnknown(event.verdict, 'non-pass'),
      audit_class: null,
      round: null,
      commit: null,
      artifact_path: null,
      matching_artifact: false,
      source_identity: null,
      timestamp: event.timestamp,
      evidence: log.filePath,
      must_fix_count: null,
      evidence_count: event.details.length > 0 ? event.details.length : null,
    }));
}

function collectReviewSignals(log: ParsedStageLog, projectRoot: string | null): ReviewSignal[] {
  const structured = [
    ...udeReviewSignals(log, projectRoot),
    ...structuredReviewSignals(log, projectRoot),
  ];
  if (structured.length > 0) {
    return structured;
  }

  const structuredFindings = Number(log.metadata.review_findings_total);
  if (Number.isFinite(structuredFindings) && structuredFindings > 0) {
    return [];
  }

  return proseReviewSignals(log);
}

function reviewSignalMetricQuality(signals: readonly ReviewSignal[]): MetricEvidenceQuality {
  if (signals.length === 0) {
    return 'none';
  }
  if (
    signals.some((signal) => !signal.matching_artifact || signal.source_quality === 'incomplete')
  ) {
    return 'incomplete';
  }
  return signals.reduce<MetricEvidenceQuality>(
    (current, signal) => mergeQuality(current, signal.source_quality),
    'none',
  );
}

function reviewFindingsFromSignals(signals: readonly ReviewSignal[]): number {
  return signals.reduce((total, signal) => total + (signal.must_fix_count ?? 0), 0);
}

function summarizeParsedLogs(logs: ParsedStageLog[], projectRoot: string | null): LogsSummary {
  const metrics = createEmptyMetrics();
  metrics.logsTotal = logs.length;
  let processMissQuality: MetricEvidenceQuality = 'none';
  let skillsQuality: MetricEvidenceQuality = 'none';
  let candidateIncidentQuality: MetricEvidenceQuality = 'none';
  const reviewSignals = logs.flatMap((log) => collectReviewSignals(log, projectRoot));

  for (const log of logs) {
    const metadata = log.metadata;
    const stage = stringFromUnknown(metadata.stage, 'unknown');
    const reviewRounds = Number(
      metadata.review_rounds ?? metadata.review_rounds_total ?? log.reviewEvents.length ?? 0,
    );
    const reviewFindings = Number(metadata.review_findings_total);
    const hasStructuredReviewFindings = Number.isFinite(reviewFindings);
    const processMisses = processMissCount(log);
    const skills = skillNames(log);
    const logReviewSignals = reviewSignals.filter((signal) => signal.evidence === log.filePath);
    const reviewIncidents =
      hasStructuredReviewFindings && reviewFindings > 0
        ? 'structured'
        : reviewSignalMetricQuality(logReviewSignals);

    metrics.reviewRoundsTotal += Number.isFinite(reviewRounds) ? reviewRounds : 0;
    metrics.reviewFindingsTotal += hasStructuredReviewFindings
      ? reviewFindings
      : reviewFindingsFromSignals(logReviewSignals);
    metrics.processMissesTotal += processMisses.count;
    metrics.backlogActualizedCount += metadata.backlog_actualized === true ? 1 : 0;
    if (metadata.late_start === true || metadata.late_log_start === true) {
      metrics.lateLogStartCount += 1;
    }
    processMissQuality = mergeQuality(processMissQuality, processMisses.quality);
    candidateIncidentQuality = mergeQuality(
      mergeQuality(candidateIncidentQuality, processMisses.quality),
      reviewIncidents,
    );
    skillsQuality = mergeQuality(skillsQuality, skills.quality);

    metrics.stages[stage] = (metrics.stages[stage] ?? 0) + 1;
    for (const skill of skills.skills) {
      metrics.skillsReferenced[skill] = (metrics.skillsReferenced[skill] ?? 0) + 1;
    }
  }
  metrics.sources.process_misses = {
    quality: processMissQuality,
    reason: sourceReason(processMissQuality, 'process_misses'),
  };
  metrics.sources.skills_referenced = {
    quality: skillsQuality,
    reason: sourceReason(skillsQuality, 'skills_referenced'),
  };
  metrics.sources.candidate_incidents = {
    quality: candidateIncidentQuality,
    reason: sourceReason(candidateIncidentQuality, 'candidate_incidents'),
  };

  return {
    exists: true,
    logs,
    metrics,
    reviewSignals,
  };
}

export function summarizeLogs(
  logsDir?: string,
  allowedFilePaths?: readonly string[],
  projectRoot?: string | null,
): LogsSummary {
  const files =
    allowedFilePaths === undefined
      ? []
      : Array.from(
          new Set(
            allowedFilePaths.filter(
              (filePath) => filePath.endsWith('.md') && fs.existsSync(filePath),
            ),
          ),
        );

  if (!logsDir || !fs.existsSync(logsDir)) {
    if (files.length > 0) {
      return summarizeParsedLogs(
        files.map((filePath) =>
          enrichLogWithStageState(parseStageLog(filePath), projectRoot ?? null),
        ),
        projectRoot ?? null,
      );
    }

    return {
      exists: false,
      logs: [],
      metrics: createEmptyMetrics(),
      reviewSignals: [],
    };
  }

  const logs = files.map((filePath) =>
    enrichLogWithStageState(parseStageLog(filePath), projectRoot ?? null),
  );

  return summarizeParsedLogs(logs, projectRoot ?? null);
}
