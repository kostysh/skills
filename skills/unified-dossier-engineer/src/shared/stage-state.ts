import path from 'node:path';

import { fileExists, readText, writeJsonAtomic } from '../vendor/dossier-engineer/lib/fs-utils.ts';
import { sanitizeFeatureId } from './feature-identity.ts';
import { assertManagedReadPath, assertManagedWritePath } from './path-guards.ts';

const STAGE_STATE_STAGES = [
  'feature-intake',
  'spec-compact',
  'plan-slice',
  'implementation',
  'change-proposal',
] as const;

const IMPLEMENTATION_REVIEW_SCOPES = ['non-code', 'code-bearing'] as const;
const PROCESS_MISS_SEVERITIES = ['low', 'medium', 'high'] as const;
const BACKLOG_ACTUALIZATION_VERDICTS = [
  'actualization_required',
  'actualized_by_backlog_artifact',
  'blocked_backlog_item_missing',
  'current_state_satisfies_target',
  'no_lifecycle_target',
] as const;

export type StageStateStage = (typeof STAGE_STATE_STAGES)[number];
export type ProcessMissSeverity = (typeof PROCESS_MISS_SEVERITIES)[number];

export type StageStateProcessMiss = {
  category: string;
  id: string;
  resolved: boolean;
  severity: ProcessMissSeverity;
  summary: string;
};

export type StageStateReviewEvent = {
  allowed_by_policy: boolean | null;
  artifact_path: string | null;
  audit_class: string | null;
  event_commit: string | null;
  implementation_scope: (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null;
  invalidated: boolean;
  must_fix_count: number | null;
  recorded_at: string | null;
  review_mode: string | null;
  reviewer: string | null;
  reviewer_agent_id: string | null;
  reviewer_skill: string | null;
  reviewer_thread_id: string | null;
  security_trigger_reason: string | null;
  stale: boolean;
  verdict: string | null;
};

export interface StageStateRecord {
  backlog_actualization_artifacts: string[];
  backlog_actualization_verdict: (typeof BACKLOG_ACTUALIZATION_VERDICTS)[number];
  backlog_followup_kind: string | null;
  backlog_followup_required: boolean;
  backlog_followup_resolved: boolean;
  backlog_item_key: string | null;
  backlog_lifecycle_current: string | null;
  backlog_lifecycle_reconciled: boolean;
  backlog_lifecycle_target: string | null;
  cycle_id: string;
  degraded_review_present: boolean;
  entered_ts: string | null;
  executed_audit_classes: string[];
  feature_cycle_id: string;
  feature_id: string;
  final_closure_commit: string | null;
  final_delivery_commit: string | null;
  final_pass_ts: string | null;
  first_review_agent_started_ts: string | null;
  implementation_review_scope: (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null;
  intake_process_complete_ts: string | null;
  invalidated_review_present: boolean;
  local_gates_green_ts: string | null;
  log_path: string;
  phase_scope: string | null;
  primary_backlog_item_key: string | null;
  primary_feature_id: string | null;
  process_complete_ts: string | null;
  process_misses: StageStateProcessMiss[];
  ready_for_close_ts: string | null;
  required_audit_classes: string[];
  required_external_review_pending: boolean;
  required_security_review: boolean | null;
  review_artifacts: string[];
  review_events: StageStateReviewEvent[];
  review_trace_commits: string[];
  reviewer_agent_ids: string[];
  reviewer_skills: string[];
  security_trigger_reasons: string[];
  session_id: string | null;
  skill_followups: string[];
  skill_issues: string[];
  skills_used: string[];
  stage: StageStateStage;
  stage_entry_commit: string | null;
  stage_state: 'blocked' | 'in_progress' | 'ready_for_close';
  stale_review_present: boolean;
  start_ts: string | null;
  step_artifact: string | null;
  step_close_ts: string | null;
  trace_locator_kind: string | null;
  trace_runtime: string | null;
  transition_events: Array<Record<string, unknown>>;
  verification_artifacts: string[];
  version: 1;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toStringArray(value: unknown): string[] {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
    ),
  ];
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
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

function normalizeBacklogActualizationVerdict(
  value: unknown,
): (typeof BACKLOG_ACTUALIZATION_VERDICTS)[number] {
  return BACKLOG_ACTUALIZATION_VERDICTS.includes(
    value as (typeof BACKLOG_ACTUALIZATION_VERDICTS)[number],
  )
    ? (value as (typeof BACKLOG_ACTUALIZATION_VERDICTS)[number])
    : 'no_lifecycle_target';
}

function toTransitionEvents(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => item !== null && typeof item === 'object',
      )
    : [];
}

function toReviewEvents(value: unknown): StageStateReviewEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      allowed_by_policy:
        typeof item.allowed_by_policy === 'boolean' ? item.allowed_by_policy : null,
      artifact_path: toNullableString(item.artifact_path),
      audit_class: toNullableString(item.audit_class),
      event_commit: toNullableString(item.event_commit),
      implementation_scope: normalizeImplementationReviewScope(item.implementation_scope),
      invalidated: toBoolean(item.invalidated),
      must_fix_count:
        typeof item.must_fix_count === 'number' && Number.isFinite(item.must_fix_count)
          ? item.must_fix_count
          : null,
      recorded_at: toNullableString(item.recorded_at),
      review_mode: toNullableString(item.review_mode),
      reviewer: toNullableString(item.reviewer),
      reviewer_agent_id: toNullableString(item.reviewer_agent_id),
      reviewer_skill: toNullableString(item.reviewer_skill),
      reviewer_thread_id: toNullableString(item.reviewer_thread_id),
      security_trigger_reason: toNullableString(item.security_trigger_reason),
      stale: toBoolean(item.stale),
      verdict: toNullableString(item.verdict),
    }));
}

function normalizeProcessMissSeverity(value: unknown): ProcessMissSeverity {
  return PROCESS_MISS_SEVERITIES.includes(value as ProcessMissSeverity)
    ? (value as ProcessMissSeverity)
    : 'medium';
}

function toProcessMisses(value: unknown): StageStateProcessMiss[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const misses = value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      id: toNullableString(item.id),
      category: toNullableString(item.category),
      severity: normalizeProcessMissSeverity(item.severity),
      resolved: toBoolean(item.resolved),
      summary: toNullableString(item.summary),
    }))
    .filter(
      (
        item,
      ): item is {
        category: string;
        id: string;
        resolved: boolean;
        severity: ProcessMissSeverity;
        summary: string;
      } => item.id !== null && item.category !== null && item.summary !== null,
    );
  return [...new Map(misses.map((miss) => [miss.id, miss])).values()];
}

function normalizeStage(value: unknown): StageStateStage | null {
  return STAGE_STATE_STAGES.includes(value as StageStateStage) ? (value as StageStateStage) : null;
}

function stageStatePath(root: string, featureId: string, stage: StageStateStage): string {
  const normalizedFeatureId = sanitizeFeatureId(featureId, 'feature id');
  return path.join(root, '.dossier', 'stages', normalizedFeatureId, `${stage}.json`);
}

function buildStageStateRecord(payload: {
  featureId: string;
  logPath: string;
  metadata: Record<string, unknown>;
}): StageStateRecord | null {
  const stage = normalizeStage(payload.metadata.stage);
  const featureId = sanitizeFeatureId(payload.featureId, 'feature id');
  if (!stage) {
    return null;
  }
  const backlogItemKey = toNullableString(payload.metadata.backlog_item_key);
  return {
    version: 1,
    stage,
    feature_id: featureId,
    feature_cycle_id: toNullableString(payload.metadata.feature_cycle_id) ?? '',
    cycle_id: toNullableString(payload.metadata.cycle_id) ?? '',
    log_path: payload.logPath.split(path.sep).join('/'),
    backlog_item_key: backlogItemKey,
    primary_feature_id: toNullableString(payload.metadata.primary_feature_id) ?? featureId,
    primary_backlog_item_key:
      toNullableString(payload.metadata.primary_backlog_item_key) ?? backlogItemKey,
    phase_scope: toNullableString(payload.metadata.phase_scope) ?? stage,
    backlog_lifecycle_target: toNullableString(payload.metadata.backlog_lifecycle_target),
    backlog_lifecycle_current: toNullableString(payload.metadata.backlog_lifecycle_current),
    backlog_lifecycle_reconciled: toBoolean(payload.metadata.backlog_lifecycle_reconciled, true),
    backlog_actualization_artifacts: toStringArray(
      payload.metadata.backlog_actualization_artifacts,
    ),
    backlog_actualization_verdict: normalizeBacklogActualizationVerdict(
      payload.metadata.backlog_actualization_verdict,
    ),
    backlog_followup_required: toBoolean(payload.metadata.backlog_followup_required),
    backlog_followup_kind: toNullableString(payload.metadata.backlog_followup_kind),
    backlog_followup_resolved: toBoolean(payload.metadata.backlog_followup_resolved),
    stage_state:
      payload.metadata.stage_state === 'blocked' ||
      payload.metadata.stage_state === 'in_progress' ||
      payload.metadata.stage_state === 'ready_for_close'
        ? payload.metadata.stage_state
        : 'in_progress',
    start_ts: toNullableString(payload.metadata.start_ts),
    entered_ts: toNullableString(payload.metadata.entered_ts),
    ready_for_close_ts: toNullableString(payload.metadata.ready_for_close_ts),
    transition_events: toTransitionEvents(payload.metadata.transition_events),
    required_audit_classes: toStringArray(payload.metadata.required_audit_classes),
    executed_audit_classes: toStringArray(payload.metadata.executed_audit_classes),
    required_external_review_pending: toBoolean(
      payload.metadata.required_external_review_pending,
      true,
    ),
    review_artifacts: toStringArray(payload.metadata.review_artifacts),
    verification_artifacts: toStringArray(payload.metadata.verification_artifacts),
    review_events: toReviewEvents(payload.metadata.review_events),
    reviewer_skills: toStringArray(payload.metadata.reviewer_skills),
    reviewer_agent_ids: toStringArray(payload.metadata.reviewer_agent_ids),
    review_trace_commits: toStringArray(payload.metadata.review_trace_commits),
    degraded_review_present: toBoolean(payload.metadata.degraded_review_present),
    invalidated_review_present: toBoolean(payload.metadata.invalidated_review_present),
    stale_review_present: toBoolean(payload.metadata.stale_review_present),
    skills_used: toStringArray(payload.metadata.skills_used),
    skill_issues: toStringArray(payload.metadata.skill_issues),
    skill_followups: toStringArray(payload.metadata.skill_followups),
    process_misses: toProcessMisses(payload.metadata.process_misses),
    session_id: toNullableString(payload.metadata.session_id),
    trace_runtime: toNullableString(payload.metadata.trace_runtime),
    trace_locator_kind: toNullableString(payload.metadata.trace_locator_kind),
    stage_entry_commit: toNullableString(payload.metadata.stage_entry_commit),
    final_delivery_commit: toNullableString(payload.metadata.final_delivery_commit),
    final_closure_commit: toNullableString(payload.metadata.final_closure_commit),
    implementation_review_scope: normalizeImplementationReviewScope(
      payload.metadata.implementation_review_scope,
    ),
    required_security_review:
      typeof payload.metadata.required_security_review === 'boolean'
        ? payload.metadata.required_security_review
        : null,
    security_trigger_reasons: toStringArray(payload.metadata.security_trigger_reasons),
    step_close_ts: toNullableString(payload.metadata.step_close_ts),
    step_artifact: toNullableString(payload.metadata.step_artifact),
    process_complete_ts: toNullableString(payload.metadata.process_complete_ts),
    intake_process_complete_ts: toNullableString(payload.metadata.intake_process_complete_ts),
    local_gates_green_ts: toNullableString(payload.metadata.local_gates_green_ts),
    first_review_agent_started_ts: toNullableString(payload.metadata.first_review_agent_started_ts),
    final_pass_ts: toNullableString(payload.metadata.final_pass_ts),
  };
}

export function stageStateMirrorFields(state: StageStateRecord): Record<string, unknown> {
  return {
    backlog_followup_required: state.backlog_followup_required,
    backlog_followup_kind: state.backlog_followup_kind,
    backlog_followup_resolved: state.backlog_followup_resolved,
    review_artifacts: state.review_artifacts,
    verification_artifacts: state.verification_artifacts,
    step_artifact: state.step_artifact,
    final_delivery_commit: state.final_delivery_commit,
    final_closure_commit: state.final_closure_commit,
    skills_used: state.skills_used,
    skill_issues: state.skill_issues,
    skill_followups: state.skill_followups,
    process_misses: state.process_misses,
    primary_feature_id: state.primary_feature_id,
    primary_backlog_item_key: state.primary_backlog_item_key,
    phase_scope: state.phase_scope,
    backlog_lifecycle_target: state.backlog_lifecycle_target,
    backlog_lifecycle_current: state.backlog_lifecycle_current,
    backlog_lifecycle_reconciled: state.backlog_lifecycle_reconciled,
    backlog_actualization_artifacts: state.backlog_actualization_artifacts,
    backlog_actualization_verdict: state.backlog_actualization_verdict,
  };
}

export function normalizeMetadataForStageState(payload: {
  featureId: string;
  logPath: string;
  metadata: Record<string, unknown>;
}): Record<string, unknown> {
  const record = buildStageStateRecord(payload);
  return record ? { ...payload.metadata, ...stageStateMirrorFields(record) } : payload.metadata;
}

function assertStageSchemaParity(
  metadata: Record<string, unknown>,
  record: StageStateRecord,
): void {
  const mirror = stageStateMirrorFields(record);
  for (const [field, expected] of Object.entries(mirror)) {
    if (JSON.stringify(metadata[field] ?? null) !== JSON.stringify(expected ?? null)) {
      throw new Error(`Stage schema parity mismatch for ${field}.`);
    }
  }
}

export async function readStageState(
  root: string,
  stage: StageStateStage,
  featureId: string,
): Promise<StageStateRecord | null> {
  const absPath = stageStatePath(root, featureId, stage);
  if (!(await fileExists(absPath))) {
    return null;
  }
  await assertManagedReadPath(
    root,
    path.join(root, '.dossier', 'stages', sanitizeFeatureId(featureId, 'feature id')),
    absPath,
    `${stage} stage state`,
  );
  const parsed = JSON.parse(await readText(absPath)) as Record<string, unknown>;
  if (
    normalizeStage(parsed.stage) !== stage ||
    sanitizeFeatureId(toNullableString(parsed.feature_id) ?? featureId, 'feature id') !==
      sanitizeFeatureId(featureId, 'feature id')
  ) {
    return null;
  }
  return {
    version: 1,
    stage,
    feature_id: sanitizeFeatureId(featureId, 'feature id'),
    feature_cycle_id: toNullableString(parsed.feature_cycle_id) ?? '',
    cycle_id: toNullableString(parsed.cycle_id) ?? '',
    log_path: toNullableString(parsed.log_path) ?? '',
    backlog_item_key: toNullableString(parsed.backlog_item_key),
    primary_feature_id:
      toNullableString(parsed.primary_feature_id) ?? sanitizeFeatureId(featureId, 'feature id'),
    primary_backlog_item_key:
      toNullableString(parsed.primary_backlog_item_key) ??
      toNullableString(parsed.backlog_item_key),
    phase_scope: toNullableString(parsed.phase_scope) ?? stage,
    backlog_lifecycle_target: toNullableString(parsed.backlog_lifecycle_target),
    backlog_lifecycle_current: toNullableString(parsed.backlog_lifecycle_current),
    backlog_lifecycle_reconciled: toBoolean(parsed.backlog_lifecycle_reconciled, true),
    backlog_actualization_artifacts: toStringArray(parsed.backlog_actualization_artifacts),
    backlog_actualization_verdict: normalizeBacklogActualizationVerdict(
      parsed.backlog_actualization_verdict,
    ),
    backlog_followup_required: toBoolean(parsed.backlog_followup_required),
    backlog_followup_kind: toNullableString(parsed.backlog_followup_kind),
    backlog_followup_resolved: toBoolean(parsed.backlog_followup_resolved),
    stage_state:
      parsed.stage_state === 'blocked' ||
      parsed.stage_state === 'in_progress' ||
      parsed.stage_state === 'ready_for_close'
        ? parsed.stage_state
        : 'in_progress',
    start_ts: toNullableString(parsed.start_ts),
    entered_ts: toNullableString(parsed.entered_ts),
    ready_for_close_ts: toNullableString(parsed.ready_for_close_ts),
    transition_events: toTransitionEvents(parsed.transition_events),
    required_audit_classes: toStringArray(parsed.required_audit_classes),
    executed_audit_classes: toStringArray(parsed.executed_audit_classes),
    required_external_review_pending: toBoolean(parsed.required_external_review_pending, true),
    review_artifacts: toStringArray(parsed.review_artifacts),
    verification_artifacts: toStringArray(parsed.verification_artifacts),
    review_events: toReviewEvents(parsed.review_events),
    reviewer_skills: toStringArray(parsed.reviewer_skills),
    reviewer_agent_ids: toStringArray(parsed.reviewer_agent_ids),
    review_trace_commits: toStringArray(parsed.review_trace_commits),
    degraded_review_present: toBoolean(parsed.degraded_review_present),
    invalidated_review_present: toBoolean(parsed.invalidated_review_present),
    stale_review_present: toBoolean(parsed.stale_review_present),
    skills_used: toStringArray(parsed.skills_used),
    skill_issues: toStringArray(parsed.skill_issues),
    skill_followups: toStringArray(parsed.skill_followups),
    process_misses: toProcessMisses(parsed.process_misses),
    session_id: toNullableString(parsed.session_id),
    trace_runtime: toNullableString(parsed.trace_runtime),
    trace_locator_kind: toNullableString(parsed.trace_locator_kind),
    stage_entry_commit: toNullableString(parsed.stage_entry_commit),
    final_delivery_commit: toNullableString(parsed.final_delivery_commit),
    final_closure_commit: toNullableString(parsed.final_closure_commit),
    implementation_review_scope: normalizeImplementationReviewScope(
      parsed.implementation_review_scope,
    ),
    required_security_review:
      typeof parsed.required_security_review === 'boolean' ? parsed.required_security_review : null,
    security_trigger_reasons: toStringArray(parsed.security_trigger_reasons),
    step_close_ts: toNullableString(parsed.step_close_ts),
    step_artifact: toNullableString(parsed.step_artifact),
    process_complete_ts: toNullableString(parsed.process_complete_ts),
    intake_process_complete_ts: toNullableString(parsed.intake_process_complete_ts),
    local_gates_green_ts: toNullableString(parsed.local_gates_green_ts),
    first_review_agent_started_ts: toNullableString(parsed.first_review_agent_started_ts),
    final_pass_ts: toNullableString(parsed.final_pass_ts),
  };
}

export async function syncStageStateFromMetadata(payload: {
  featureId: string;
  logPath: string;
  metadata: Record<string, unknown>;
  root: string;
}): Promise<string | null> {
  const featureId = sanitizeFeatureId(payload.featureId, 'feature id');
  const record = buildStageStateRecord({
    featureId,
    logPath: payload.logPath,
    metadata: payload.metadata,
  });
  if (!record) {
    return null;
  }
  const stage = record.stage;
  const absPath = stageStatePath(payload.root, featureId, stage);
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'stages', featureId),
    absPath,
    `${stage} stage state`,
  );
  assertStageSchemaParity(payload.metadata, record);
  await writeJsonAtomic(absPath, record);
  return path.relative(payload.root, absPath).split(path.sep).join('/');
}
