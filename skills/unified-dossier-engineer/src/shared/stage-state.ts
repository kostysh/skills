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

export type StageStateStage = (typeof STAGE_STATE_STAGES)[number];

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
  backlog_item_key: string | null;
  cycle_id: string;
  degraded_review_present: boolean;
  entered_ts: string | null;
  executed_audit_classes: string[];
  feature_cycle_id: string;
  feature_id: string;
  final_pass_ts: string | null;
  first_review_agent_started_ts: string | null;
  implementation_review_scope: (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null;
  intake_process_complete_ts: string | null;
  invalidated_review_present: boolean;
  local_gates_green_ts: string | null;
  log_path: string;
  process_complete_ts: string | null;
  ready_for_close_ts: string | null;
  required_audit_classes: string[];
  required_external_review_pending: boolean;
  required_security_review: boolean | null;
  review_events: StageStateReviewEvent[];
  review_trace_commits: string[];
  reviewer_agent_ids: string[];
  reviewer_skills: string[];
  security_trigger_reasons: string[];
  session_id: string | null;
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
  version: 1;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
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

function normalizeStage(value: unknown): StageStateStage | null {
  return STAGE_STATE_STAGES.includes(value as StageStateStage) ? (value as StageStateStage) : null;
}

function stageStatePath(root: string, featureId: string, stage: StageStateStage): string {
  const normalizedFeatureId = sanitizeFeatureId(featureId, 'feature id');
  return path.join(root, '.dossier', 'stages', normalizedFeatureId, `${stage}.json`);
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
    review_events: toReviewEvents(parsed.review_events),
    reviewer_skills: toStringArray(parsed.reviewer_skills),
    reviewer_agent_ids: toStringArray(parsed.reviewer_agent_ids),
    review_trace_commits: toStringArray(parsed.review_trace_commits),
    degraded_review_present: toBoolean(parsed.degraded_review_present),
    invalidated_review_present: toBoolean(parsed.invalidated_review_present),
    stale_review_present: toBoolean(parsed.stale_review_present),
    session_id: toNullableString(parsed.session_id),
    trace_runtime: toNullableString(parsed.trace_runtime),
    trace_locator_kind: toNullableString(parsed.trace_locator_kind),
    stage_entry_commit: toNullableString(parsed.stage_entry_commit),
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
  const stage = normalizeStage(payload.metadata.stage);
  const featureId = sanitizeFeatureId(payload.featureId, 'feature id');
  if (!stage) {
    return null;
  }
  const absPath = stageStatePath(payload.root, featureId, stage);
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'stages', featureId),
    absPath,
    `${stage} stage state`,
  );
  const record: StageStateRecord = {
    version: 1,
    stage,
    feature_id: featureId,
    feature_cycle_id: toNullableString(payload.metadata.feature_cycle_id) ?? '',
    cycle_id: toNullableString(payload.metadata.cycle_id) ?? '',
    log_path: payload.logPath.split(path.sep).join('/'),
    backlog_item_key: toNullableString(payload.metadata.backlog_item_key),
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
    review_events: toReviewEvents(payload.metadata.review_events),
    reviewer_skills: toStringArray(payload.metadata.reviewer_skills),
    reviewer_agent_ids: toStringArray(payload.metadata.reviewer_agent_ids),
    review_trace_commits: toStringArray(payload.metadata.review_trace_commits),
    degraded_review_present: toBoolean(payload.metadata.degraded_review_present),
    invalidated_review_present: toBoolean(payload.metadata.invalidated_review_present),
    stale_review_present: toBoolean(payload.metadata.stale_review_present),
    session_id: toNullableString(payload.metadata.session_id),
    trace_runtime: toNullableString(payload.metadata.trace_runtime),
    trace_locator_kind: toNullableString(payload.metadata.trace_locator_kind),
    stage_entry_commit: toNullableString(payload.metadata.stage_entry_commit),
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
  await writeJsonAtomic(absPath, record);
  return path.relative(payload.root, absPath).split(path.sep).join('/');
}
