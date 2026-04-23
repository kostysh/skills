import fs from 'node:fs';
import path from 'node:path';

import { parseStageLog } from '../parsers/stage-log.ts';
import { stringFromUnknown } from './shared.ts';
import type { LogMetrics, LogsSummary, MetricEvidenceQuality, ParsedStageLog } from './types.ts';

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
    structured: 3,
    unvalidated_fallback: 1,
    validated_fallback: 2,
  }[value];
}

function mergeQuality(
  current: MetricEvidenceQuality,
  incoming: MetricEvidenceQuality,
): MetricEvidenceQuality {
  if (current === 'unvalidated_fallback' || incoming === 'unvalidated_fallback') {
    return 'unvalidated_fallback';
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
    return { count: log.processMissLines.length, quality: 'unvalidated_fallback' };
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

function reviewIncidentQuality(log: ParsedStageLog): MetricEvidenceQuality {
  const structuredFindings = Number(log.metadata.review_findings_total);
  if (Number.isFinite(structuredFindings)) {
    return 'structured';
  }

  const reviewText = (
    log.sections['События ревью'] ||
    log.sections['Review events'] ||
    ''
  ).toLowerCase();
  return reviewText.includes('fail') || reviewText.includes('non-compliant')
    ? 'unvalidated_fallback'
    : 'none';
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
  'review_artifact',
  'review_artifacts',
  'review_findings_total',
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

function stageStateScopeMatches(
  state: Record<string, unknown>,
  log: ParsedStageLog,
): boolean {
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
          stage_state_rejection_reason:
            'Stage state scope did not match the included stage log.',
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
  if (quality === 'unvalidated_fallback') {
    return `${metric} used prose fallback because structured fields were absent in at least one analyzed log.`;
  }
  return `${metric} had no usable evidence in analyzed logs.`;
}

function summarizeParsedLogs(logs: ParsedStageLog[]): LogsSummary {
  const metrics = createEmptyMetrics();
  metrics.logsTotal = logs.length;
  let processMissQuality: MetricEvidenceQuality = 'none';
  let skillsQuality: MetricEvidenceQuality = 'none';
  let candidateIncidentQuality: MetricEvidenceQuality = 'none';

  for (const log of logs) {
    const metadata = log.metadata;
    const stage = stringFromUnknown(metadata.stage, 'unknown');
    const reviewRounds = Number(
      metadata.review_rounds ?? metadata.review_rounds_total ?? log.reviewEvents.length ?? 0,
    );
    const reviewFindings = Number(metadata.review_findings_total ?? 0);
    const processMisses = processMissCount(log);
    const reviewIncidents = reviewIncidentQuality(log);
    const skills = skillNames(log);

    metrics.reviewRoundsTotal += Number.isFinite(reviewRounds) ? reviewRounds : 0;
    metrics.reviewFindingsTotal += Number.isFinite(reviewFindings) ? reviewFindings : 0;
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
    reason:
      candidateIncidentQuality === 'unvalidated_fallback'
        ? 'Candidate incident inference includes prose fallback evidence.'
        : 'Candidate incident inference uses structured evidence where available.',
  };

  return {
    exists: true,
    logs,
    metrics,
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
      );
    }

    return {
      exists: false,
      logs: [],
      metrics: createEmptyMetrics(),
    };
  }

  const logs = files.map((filePath) =>
    enrichLogWithStageState(parseStageLog(filePath), projectRoot ?? null),
  );

  return summarizeParsedLogs(logs);
}
