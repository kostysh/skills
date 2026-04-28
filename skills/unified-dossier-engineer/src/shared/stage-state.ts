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
const PRE_REVIEW_CHECKLIST_ENTRY_STATUSES = ['pass', 'not_applicable', 'blocked'] as const;
const PRE_REVIEW_CHECKLIST_STATUSES = ['not_required', 'missing', 'blocked', 'complete'] as const;
const POLICY_ADMISSION_RISK_PROFILES = ['not_applicable', 'applicable'] as const;
const POLICY_ADMISSION_MATRIX_STATUSES = [
  'not_required',
  'missing',
  'blocked',
  'complete',
] as const;
const POST_CLOSE_BACKLOG_HYGIENE_STATUSES = [
  'not_required',
  'missing',
  'stale',
  'blocked',
  'clean',
] as const;
const BACKLOG_ACTUALIZATION_VERDICTS = [
  'actualization_required',
  'actualized_by_backlog_artifact',
  'blocked_backlog_item_missing',
  'current_state_satisfies_target',
  'no_lifecycle_target',
] as const;

export type StageStateStage = (typeof STAGE_STATE_STAGES)[number];
export type ProcessMissSeverity = (typeof PROCESS_MISS_SEVERITIES)[number];
export type PreReviewChecklistEntryStatus = (typeof PRE_REVIEW_CHECKLIST_ENTRY_STATUSES)[number];
export type PreReviewChecklistStatus = (typeof PRE_REVIEW_CHECKLIST_STATUSES)[number];
export type PolicyAdmissionRiskProfile = (typeof POLICY_ADMISSION_RISK_PROFILES)[number];
export type PolicyAdmissionMatrixStatus = (typeof POLICY_ADMISSION_MATRIX_STATUSES)[number];
export type PostCloseBacklogHygieneStatus = (typeof POST_CLOSE_BACKLOG_HYGIENE_STATUSES)[number];

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
  evidence_count: number | null;
  event_commit: string | null;
  implementation_scope: (typeof IMPLEMENTATION_REVIEW_SCOPES)[number] | null;
  invalidated: boolean;
  latest_copy_path: string | null;
  must_fix_count: number | null;
  recorded_at: string | null;
  review_mode: string | null;
  review_attempt_id: string | null;
  review_round_id: string | null;
  review_round_number: number | null;
  reviewer: string | null;
  reviewer_agent_id: string | null;
  reviewer_skill: string | null;
  reviewer_thread_id: string | null;
  security_trigger_reason: string | null;
  stale: boolean;
  verdict: string | null;
};

export type StageStatePolicyAdmissionNegativeMatrixEntry = {
  ac: string;
  evidence: string;
  negative_test: string;
  production_path: string;
  risk: string;
};

export type StageStatePreReviewChecklistEntry = {
  evidence: string;
  id: string;
  risk_family: string;
  status: PreReviewChecklistEntryStatus;
  summary: string;
  test_refs: string[];
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
  closure_bundle_id: string | null;
  closure_bundle_round: number | null;
  closure_bundle_rounds_by_audit_class: Record<string, number>;
  non_pass_review_events: Array<Record<string, unknown>>;
  policy_admission_matrix_blockers: string[];
  policy_admission_matrix_status: PolicyAdmissionMatrixStatus;
  policy_admission_negative_matrix: StageStatePolicyAdmissionNegativeMatrixEntry[];
  policy_admission_risk_families: string[];
  policy_admission_risk_profile: PolicyAdmissionRiskProfile | null;
  policy_admission_risk_rationale: string | null;
  post_close_backlog_hygiene_artifact: string | null;
  post_close_affected_feature_ids: string[];
  post_close_backlog_hygiene_blockers: string[];
  post_close_backlog_hygiene_checked_at: string | null;
  post_close_backlog_hygiene_global_refresh_artifact: string | null;
  post_close_backlog_hygiene_refresh_at: string | null;
  post_close_hygiene_schema_version: number | null;
  post_close_post_status_summary: Record<string, unknown> | null;
  post_close_pre_status_summary: Record<string, unknown> | null;
  post_close_backlog_hygiene_required: boolean;
  post_close_backlog_hygiene_status: PostCloseBacklogHygieneStatus;
  post_close_lifecycle_reconciliation_drift_count: number | null;
  post_close_open_source_review_count: number | null;
  post_close_source_review_blocked_item_count: number | null;
  post_close_unresolved_attention_present: boolean | null;
  pre_review_checklist_blockers: string[];
  pre_review_checklist_status: PreReviewChecklistStatus;
  pre_review_checklists: StageStatePreReviewChecklistEntry[];
  pre_review_risk_families: string[];
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
  rpa_source_identity: Record<string, unknown> | null;
  rpa_source_quality: Record<string, unknown> | null;
  security_trigger_reasons: string[];
  selected_closure_ts: string | null;
  selected_review_artifacts: string[];
  selected_step_artifact: string | null;
  selected_verification_artifact: string | null;
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

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function toObjectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toObjectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object' && !Array.isArray(item),
      )
    : [];
}

function toNumberRecord(value: unknown): Record<string, number> {
  const record = toObjectRecord(value);
  if (!record) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, number] => {
      const [, entryValue] = entry;
      return typeof entryValue === 'number' && Number.isInteger(entryValue) && entryValue > 0;
    }),
  );
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

function normalizePolicyAdmissionRiskProfile(value: unknown): PolicyAdmissionRiskProfile | null {
  return POLICY_ADMISSION_RISK_PROFILES.includes(value as PolicyAdmissionRiskProfile)
    ? (value as PolicyAdmissionRiskProfile)
    : null;
}

function normalizePolicyAdmissionMatrixStatus(value: unknown): PolicyAdmissionMatrixStatus {
  return POLICY_ADMISSION_MATRIX_STATUSES.includes(value as PolicyAdmissionMatrixStatus)
    ? (value as PolicyAdmissionMatrixStatus)
    : 'missing';
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
      evidence_count: toNullableNumber(item.evidence_count),
      event_commit: toNullableString(item.event_commit),
      implementation_scope: normalizeImplementationReviewScope(item.implementation_scope),
      invalidated: toBoolean(item.invalidated),
      latest_copy_path: toNullableString(item.latest_copy_path),
      must_fix_count:
        typeof item.must_fix_count === 'number' && Number.isFinite(item.must_fix_count)
          ? item.must_fix_count
          : null,
      recorded_at: toNullableString(item.recorded_at),
      review_mode: toNullableString(item.review_mode),
      review_attempt_id: toNullableString(item.review_attempt_id),
      review_round_id: toNullableString(item.review_round_id),
      review_round_number:
        typeof item.review_round_number === 'number' &&
        Number.isInteger(item.review_round_number) &&
        item.review_round_number > 0
          ? item.review_round_number
          : null,
      reviewer: toNullableString(item.reviewer),
      reviewer_agent_id: toNullableString(item.reviewer_agent_id),
      reviewer_skill: toNullableString(item.reviewer_skill),
      reviewer_thread_id: toNullableString(item.reviewer_thread_id),
      security_trigger_reason: toNullableString(item.security_trigger_reason),
      stale: toBoolean(item.stale),
      verdict: toNullableString(item.verdict),
    }));
}

function toPolicyAdmissionNegativeMatrixEntries(
  value: unknown,
): StageStatePolicyAdmissionNegativeMatrixEntry[] {
  const entries = toObjectArray(value)
    .map((item) => ({
      ac: toNullableString(item.ac),
      risk: toNullableString(item.risk),
      negative_test: toNullableString(item.negative_test),
      production_path: toNullableString(item.production_path),
      evidence: toNullableString(item.evidence),
    }))
    .filter(
      (
        item,
      ): item is {
        ac: string;
        evidence: string;
        negative_test: string;
        production_path: string;
        risk: string;
      } =>
        item.ac !== null &&
        item.risk !== null &&
        item.negative_test !== null &&
        item.production_path !== null &&
        item.evidence !== null,
    );
  return [
    ...new Map(
      entries.map((entry) => [`${entry.ac}\u0000${entry.risk}\u0000${entry.negative_test}`, entry]),
    ).values(),
  ];
}

function normalizeProcessMissSeverity(value: unknown): ProcessMissSeverity {
  return PROCESS_MISS_SEVERITIES.includes(value as ProcessMissSeverity)
    ? (value as ProcessMissSeverity)
    : 'medium';
}

function normalizePreReviewChecklistEntryStatus(value: unknown): PreReviewChecklistEntryStatus {
  return PRE_REVIEW_CHECKLIST_ENTRY_STATUSES.includes(value as PreReviewChecklistEntryStatus)
    ? (value as PreReviewChecklistEntryStatus)
    : 'blocked';
}

function normalizePreReviewChecklistStatus(value: unknown): PreReviewChecklistStatus {
  return PRE_REVIEW_CHECKLIST_STATUSES.includes(value as PreReviewChecklistStatus)
    ? (value as PreReviewChecklistStatus)
    : 'not_required';
}

function normalizePostCloseBacklogHygieneStatus(
  value: unknown,
  fallback: PostCloseBacklogHygieneStatus,
): PostCloseBacklogHygieneStatus {
  return POST_CLOSE_BACKLOG_HYGIENE_STATUSES.includes(value as PostCloseBacklogHygieneStatus)
    ? (value as PostCloseBacklogHygieneStatus)
    : fallback;
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

function toPreReviewChecklistEntries(value: unknown): StageStatePreReviewChecklistEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries = value
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      risk_family: toNullableString(item.risk_family),
      id: toNullableString(item.id),
      status: normalizePreReviewChecklistEntryStatus(item.status),
      summary: toNullableString(item.summary),
      evidence: toNullableString(item.evidence),
      test_refs: toStringArray(item.test_refs),
    }))
    .filter(
      (
        item,
      ): item is {
        evidence: string;
        id: string;
        risk_family: string;
        status: PreReviewChecklistEntryStatus;
        summary: string;
        test_refs: string[];
      } =>
        item.risk_family !== null &&
        item.id !== null &&
        item.summary !== null &&
        item.evidence !== null,
    );
  return [
    ...new Map(entries.map((entry) => [`${entry.risk_family}\u0000${entry.id}`, entry])).values(),
  ];
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
  const postCloseBacklogHygieneRequired =
    stage === 'implementation' && toBoolean(payload.metadata.post_close_backlog_hygiene_required);
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
    closure_bundle_id: toNullableString(payload.metadata.closure_bundle_id),
    closure_bundle_round: toPositiveInteger(payload.metadata.closure_bundle_round),
    closure_bundle_rounds_by_audit_class: toNumberRecord(
      payload.metadata.closure_bundle_rounds_by_audit_class,
    ),
    selected_review_artifacts: toStringArray(payload.metadata.selected_review_artifacts),
    selected_verification_artifact: toNullableString(
      payload.metadata.selected_verification_artifact,
    ),
    selected_step_artifact: toNullableString(payload.metadata.selected_step_artifact),
    selected_closure_ts: toNullableString(payload.metadata.selected_closure_ts),
    rpa_source_identity: toObjectRecord(payload.metadata.rpa_source_identity),
    rpa_source_quality: toObjectRecord(payload.metadata.rpa_source_quality),
    non_pass_review_events: toObjectArray(payload.metadata.non_pass_review_events),
    policy_admission_risk_profile: normalizePolicyAdmissionRiskProfile(
      payload.metadata.policy_admission_risk_profile,
    ),
    policy_admission_risk_rationale: toNullableString(
      payload.metadata.policy_admission_risk_rationale,
    ),
    policy_admission_risk_families: toStringArray(payload.metadata.policy_admission_risk_families),
    policy_admission_negative_matrix: toPolicyAdmissionNegativeMatrixEntries(
      payload.metadata.policy_admission_negative_matrix,
    ),
    policy_admission_matrix_status: normalizePolicyAdmissionMatrixStatus(
      payload.metadata.policy_admission_matrix_status,
    ),
    policy_admission_matrix_blockers: toStringArray(
      payload.metadata.policy_admission_matrix_blockers,
    ),
    backlog_lifecycle_target: toNullableString(payload.metadata.backlog_lifecycle_target),
    backlog_lifecycle_current: toNullableString(payload.metadata.backlog_lifecycle_current),
    backlog_lifecycle_reconciled: toBoolean(payload.metadata.backlog_lifecycle_reconciled, true),
    backlog_actualization_artifacts: toStringArray(
      payload.metadata.backlog_actualization_artifacts,
    ),
    backlog_actualization_verdict: normalizeBacklogActualizationVerdict(
      payload.metadata.backlog_actualization_verdict,
    ),
    post_close_backlog_hygiene_required: postCloseBacklogHygieneRequired,
    post_close_backlog_hygiene_status: postCloseBacklogHygieneRequired
      ? normalizePostCloseBacklogHygieneStatus(
          payload.metadata.post_close_backlog_hygiene_status,
          'missing',
        )
      : 'not_required',
    post_close_backlog_hygiene_artifact: toNullableString(
      payload.metadata.post_close_backlog_hygiene_artifact,
    ),
    post_close_backlog_hygiene_global_refresh_artifact: toNullableString(
      payload.metadata.post_close_backlog_hygiene_global_refresh_artifact,
    ),
    post_close_affected_feature_ids: toStringArray(
      payload.metadata.post_close_affected_feature_ids,
    ),
    post_close_pre_status_summary: toObjectRecord(payload.metadata.post_close_pre_status_summary),
    post_close_post_status_summary: toObjectRecord(payload.metadata.post_close_post_status_summary),
    post_close_hygiene_schema_version: toNullableNumber(
      payload.metadata.post_close_hygiene_schema_version,
    ),
    post_close_backlog_hygiene_checked_at: toNullableString(
      payload.metadata.post_close_backlog_hygiene_checked_at,
    ),
    post_close_backlog_hygiene_refresh_at: toNullableString(
      payload.metadata.post_close_backlog_hygiene_refresh_at,
    ),
    post_close_open_source_review_count: toNullableNumber(
      payload.metadata.post_close_open_source_review_count,
    ),
    post_close_source_review_blocked_item_count: toNullableNumber(
      payload.metadata.post_close_source_review_blocked_item_count,
    ),
    post_close_lifecycle_reconciliation_drift_count: toNullableNumber(
      payload.metadata.post_close_lifecycle_reconciliation_drift_count,
    ),
    post_close_unresolved_attention_present:
      typeof payload.metadata.post_close_unresolved_attention_present === 'boolean'
        ? payload.metadata.post_close_unresolved_attention_present
        : null,
    post_close_backlog_hygiene_blockers: toStringArray(
      payload.metadata.post_close_backlog_hygiene_blockers,
    ),
    pre_review_risk_families: toStringArray(payload.metadata.pre_review_risk_families),
    pre_review_checklists: toPreReviewChecklistEntries(payload.metadata.pre_review_checklists),
    pre_review_checklist_status: normalizePreReviewChecklistStatus(
      payload.metadata.pre_review_checklist_status,
    ),
    pre_review_checklist_blockers: toStringArray(payload.metadata.pre_review_checklist_blockers),
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
    review_events: state.review_events,
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
    closure_bundle_id: state.closure_bundle_id,
    closure_bundle_round: state.closure_bundle_round,
    closure_bundle_rounds_by_audit_class: state.closure_bundle_rounds_by_audit_class,
    selected_review_artifacts: state.selected_review_artifacts,
    selected_verification_artifact: state.selected_verification_artifact,
    selected_step_artifact: state.selected_step_artifact,
    selected_closure_ts: state.selected_closure_ts,
    rpa_source_identity: state.rpa_source_identity,
    rpa_source_quality: state.rpa_source_quality,
    non_pass_review_events: state.non_pass_review_events,
    ...(state.stage === 'plan-slice'
      ? {
          policy_admission_risk_profile: state.policy_admission_risk_profile,
          policy_admission_risk_rationale: state.policy_admission_risk_rationale,
          policy_admission_risk_families: state.policy_admission_risk_families,
          policy_admission_negative_matrix: state.policy_admission_negative_matrix,
          policy_admission_matrix_status: state.policy_admission_matrix_status,
          policy_admission_matrix_blockers: state.policy_admission_matrix_blockers,
        }
      : {}),
    backlog_lifecycle_target: state.backlog_lifecycle_target,
    backlog_lifecycle_current: state.backlog_lifecycle_current,
    backlog_lifecycle_reconciled: state.backlog_lifecycle_reconciled,
    backlog_actualization_artifacts: state.backlog_actualization_artifacts,
    backlog_actualization_verdict: state.backlog_actualization_verdict,
    ...(state.stage === 'implementation'
      ? {
          pre_review_risk_families: state.pre_review_risk_families,
          pre_review_checklists: state.pre_review_checklists,
          pre_review_checklist_status: state.pre_review_checklist_status,
          pre_review_checklist_blockers: state.pre_review_checklist_blockers,
          post_close_backlog_hygiene_required: state.post_close_backlog_hygiene_required,
          post_close_backlog_hygiene_status: state.post_close_backlog_hygiene_status,
          post_close_backlog_hygiene_artifact: state.post_close_backlog_hygiene_artifact,
          post_close_backlog_hygiene_global_refresh_artifact:
            state.post_close_backlog_hygiene_global_refresh_artifact,
          post_close_affected_feature_ids: state.post_close_affected_feature_ids,
          post_close_pre_status_summary: state.post_close_pre_status_summary,
          post_close_post_status_summary: state.post_close_post_status_summary,
          post_close_hygiene_schema_version: state.post_close_hygiene_schema_version,
          post_close_backlog_hygiene_checked_at: state.post_close_backlog_hygiene_checked_at,
          post_close_backlog_hygiene_refresh_at: state.post_close_backlog_hygiene_refresh_at,
          post_close_open_source_review_count: state.post_close_open_source_review_count,
          post_close_source_review_blocked_item_count:
            state.post_close_source_review_blocked_item_count,
          post_close_lifecycle_reconciliation_drift_count:
            state.post_close_lifecycle_reconciliation_drift_count,
          post_close_unresolved_attention_present: state.post_close_unresolved_attention_present,
          post_close_backlog_hygiene_blockers: state.post_close_backlog_hygiene_blockers,
        }
      : {}),
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
  const postCloseBacklogHygieneRequired =
    stage === 'implementation' && toBoolean(parsed.post_close_backlog_hygiene_required);
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
    closure_bundle_id: toNullableString(parsed.closure_bundle_id),
    closure_bundle_round: toPositiveInteger(parsed.closure_bundle_round),
    closure_bundle_rounds_by_audit_class: toNumberRecord(
      parsed.closure_bundle_rounds_by_audit_class,
    ),
    selected_review_artifacts: toStringArray(parsed.selected_review_artifacts),
    selected_verification_artifact: toNullableString(parsed.selected_verification_artifact),
    selected_step_artifact: toNullableString(parsed.selected_step_artifact),
    selected_closure_ts: toNullableString(parsed.selected_closure_ts),
    rpa_source_identity: toObjectRecord(parsed.rpa_source_identity),
    rpa_source_quality: toObjectRecord(parsed.rpa_source_quality),
    non_pass_review_events: toObjectArray(parsed.non_pass_review_events),
    policy_admission_risk_profile: normalizePolicyAdmissionRiskProfile(
      parsed.policy_admission_risk_profile,
    ),
    policy_admission_risk_rationale: toNullableString(parsed.policy_admission_risk_rationale),
    policy_admission_risk_families: toStringArray(parsed.policy_admission_risk_families),
    policy_admission_negative_matrix: toPolicyAdmissionNegativeMatrixEntries(
      parsed.policy_admission_negative_matrix,
    ),
    policy_admission_matrix_status: normalizePolicyAdmissionMatrixStatus(
      parsed.policy_admission_matrix_status,
    ),
    policy_admission_matrix_blockers: toStringArray(parsed.policy_admission_matrix_blockers),
    backlog_lifecycle_target: toNullableString(parsed.backlog_lifecycle_target),
    backlog_lifecycle_current: toNullableString(parsed.backlog_lifecycle_current),
    backlog_lifecycle_reconciled: toBoolean(parsed.backlog_lifecycle_reconciled, true),
    backlog_actualization_artifacts: toStringArray(parsed.backlog_actualization_artifacts),
    backlog_actualization_verdict: normalizeBacklogActualizationVerdict(
      parsed.backlog_actualization_verdict,
    ),
    post_close_backlog_hygiene_required: postCloseBacklogHygieneRequired,
    post_close_backlog_hygiene_status: postCloseBacklogHygieneRequired
      ? normalizePostCloseBacklogHygieneStatus(parsed.post_close_backlog_hygiene_status, 'missing')
      : 'not_required',
    post_close_backlog_hygiene_artifact: toNullableString(
      parsed.post_close_backlog_hygiene_artifact,
    ),
    post_close_backlog_hygiene_global_refresh_artifact: toNullableString(
      parsed.post_close_backlog_hygiene_global_refresh_artifact,
    ),
    post_close_affected_feature_ids: toStringArray(parsed.post_close_affected_feature_ids),
    post_close_pre_status_summary: toObjectRecord(parsed.post_close_pre_status_summary),
    post_close_post_status_summary: toObjectRecord(parsed.post_close_post_status_summary),
    post_close_hygiene_schema_version: toNullableNumber(parsed.post_close_hygiene_schema_version),
    post_close_backlog_hygiene_checked_at: toNullableString(
      parsed.post_close_backlog_hygiene_checked_at,
    ),
    post_close_backlog_hygiene_refresh_at: toNullableString(
      parsed.post_close_backlog_hygiene_refresh_at,
    ),
    post_close_open_source_review_count: toNullableNumber(
      parsed.post_close_open_source_review_count,
    ),
    post_close_source_review_blocked_item_count: toNullableNumber(
      parsed.post_close_source_review_blocked_item_count,
    ),
    post_close_lifecycle_reconciliation_drift_count: toNullableNumber(
      parsed.post_close_lifecycle_reconciliation_drift_count,
    ),
    post_close_unresolved_attention_present:
      typeof parsed.post_close_unresolved_attention_present === 'boolean'
        ? parsed.post_close_unresolved_attention_present
        : null,
    post_close_backlog_hygiene_blockers: toStringArray(parsed.post_close_backlog_hygiene_blockers),
    pre_review_risk_families: toStringArray(parsed.pre_review_risk_families),
    pre_review_checklists: toPreReviewChecklistEntries(parsed.pre_review_checklists),
    pre_review_checklist_status: normalizePreReviewChecklistStatus(
      parsed.pre_review_checklist_status,
    ),
    pre_review_checklist_blockers: toStringArray(parsed.pre_review_checklist_blockers),
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
