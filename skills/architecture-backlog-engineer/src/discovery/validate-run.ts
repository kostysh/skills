import fs from 'node:fs';
import path from 'node:path';

import {
  BACKLOG_PROTOCOL_STATES,
  CLAIM_COMMITMENTS,
  CLAIM_CLASSES,
  COMPATIBILITY_CLASSES,
  DEPENDENCY_CRITICALITIES,
  DELIVERY_STATES,
  ITEM_CLASSES,
  ITEM_CLOSURE_STATES,
  ISSUE_RESOLUTION_STATES,
  NEGATIVE_SCOPE_CLASSES,
  ORIGIN_REF_KINDS,
  PHASE_STATES,
  POLICY_DECISION_STATES,
  READINESS_STATES,
  RELATION_TYPES,
  REVIEW_SCOPES,
  REVIEW_ROLES,
  REVIEW_VERDICTS,
  ROLLBACK_CLASSES,
  ROLLOUT_MODES,
  PROOF_DIMENSION_KEYS,
  SCHEMA_VERSION,
  SOURCE_AUTHORITIES,
  SOURCE_KINDS,
  SUMMARY_LABELS,
  TRACK_PROOF_COVERAGE_KEYS,
  UNCERTAINTY_CLASSES,
  appendNdjson,
  asArray,
  asStringRecord,
  detectLegacyLayout,
  formatGraphRef,
  graphRef,
  graphRefKey,
  hasOwnEntries,
  isAcceptanceClass,
  isGraphRef,
  isNonEmptyString,
  legacyLayoutMessage,
  loadNdjson,
  loadJson,
  parseTimestamp,
  runPaths,
  unsupportedSchemaMessage,
  utcNow,
  writeJson,
  type AcceptanceClass,
  type AssessmentFile,
  type AssessmentAcceptance,
  type AssessmentClosure,
  type BacklogFile,
  type DiscoveryItem,
  type DiscoveryRelation,
  type GraphRef,
  type Manifest,
  type ReviewRole,
  type ScoreSection,
} from './common.js';
import { computeDriftState } from './drift-state.js';

const REQUIRED_TRACK_IDS = new Set([
  'minimal-working-system',
  'externally-safe-operationally-supportable',
  'full-target-system',
]);

const BASELINE_IMPLEMENTATION_REVIEW_ROLES: ReviewRole[] = [
  'product_strategy',
  'system_architecture',
  'application_engineering',
  'platform_sre',
  'security',
  'qa_release',
  'support_operations',
];

const REVIEW_FINDING_SEVERITY_RANK = new Map<string, number>([
  ['critical', 5],
  ['high', 4],
  ['medium', 3],
  ['low', 2],
  ['info', 1],
]);

const READINESS_EXEMPTIONS_BY_CLASS: Record<
  NonNullable<DiscoveryItem['item_class']>,
  Set<string>
> = {
  capability_seam: new Set(),
  feature_slice: new Set(),
  control_guardrail: new Set(),
  migration: new Set(),
  retirement: new Set(),
  spike_discovery: new Set(),
  operational_enablement: new Set(['rollout_defined', 'recovery_defined']),
  documentation_support_enablement: new Set(['rollout_defined', 'recovery_defined']),
};

const DONE_EXEMPTIONS_BY_CLASS: Record<NonNullable<DiscoveryItem['item_class']>, Set<string>> = {
  capability_seam: new Set(),
  feature_slice: new Set(),
  control_guardrail: new Set(),
  migration: new Set(),
  retirement: new Set(),
  spike_discovery: new Set(),
  operational_enablement: new Set([
    'code_and_infra_complete',
    'migration_execution_or_safe_schedule_complete',
  ]),
  documentation_support_enablement: new Set([
    'code_and_infra_complete',
    'migration_execution_or_safe_schedule_complete',
  ]),
};

const ITEM_CLASSES_REQUIRING_VALUE_DESCRIPTOR = new Set<NonNullable<DiscoveryItem['item_class']>>([
  'capability_seam',
  'feature_slice',
  'control_guardrail',
  'migration',
  'retirement',
  'spike_discovery',
  'operational_enablement',
  'documentation_support_enablement',
]);

const ITEM_CLASSES_REQUIRING_ACTOR_ROLE_SET = new Set<NonNullable<DiscoveryItem['item_class']>>([
  'capability_seam',
  'feature_slice',
  'control_guardrail',
  'migration',
  'retirement',
  'spike_discovery',
  'operational_enablement',
  'documentation_support_enablement',
]);

const ITEM_CLASSES_REQUIRING_ADR_REFS = new Set<NonNullable<DiscoveryItem['item_class']>>([
  'capability_seam',
  'feature_slice',
]);

const OUTGOING_RELATIONS_BY_CLASS: Record<NonNullable<DiscoveryItem['item_class']>, Set<string>> = {
  capability_seam: new Set([
    'decomposes_into',
    'depends_on',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
    'touches_contract',
    'touches_data_domain',
    'replaces',
  ]),
  feature_slice: new Set([
    'realizes',
    'depends_on',
    'blocked_by',
    'touches_contract',
    'touches_data_domain',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
  ]),
  control_guardrail: new Set([
    'depends_on',
    'proves',
    'reviewed_by',
    'belongs_to_track',
    'touches_contract',
    'touches_data_domain',
  ]),
  migration: new Set([
    'migrates_from',
    'depends_on',
    'retires',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
    'touches_contract',
    'touches_data_domain',
  ]),
  retirement: new Set([
    'retires',
    'depends_on',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
    'touches_contract',
    'touches_data_domain',
  ]),
  spike_discovery: new Set([
    'enabled_by',
    'depends_on',
    'reviewed_by',
    'proves',
    'belongs_to_track',
  ]),
  operational_enablement: new Set([
    'enabled_by',
    'depends_on',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
  ]),
  documentation_support_enablement: new Set([
    'enabled_by',
    'depends_on',
    'governed_by',
    'proves',
    'reviewed_by',
    'belongs_to_track',
  ]),
};

const SUPPORT_SURFACES = new Set([
  'runtime',
  'deployment',
  'rollback',
  'recovery',
  'observability',
  'support',
  'enablement',
]);

const SECURITY_SURFACES = new Set([
  'auth',
  'authz',
  'trust_boundary',
  'data_class',
  'secret',
  'policy',
  'exposure',
]);

const QUALITY_CLASSES = new Set([
  'latency',
  'throughput',
  'concurrency',
  'availability',
  'durability',
  'rpo',
  'rto',
  'cost_budget',
  'privacy_compliance',
  'accessibility_localization',
  'auditability_traceability',
  'scalability',
]);

const CRITICAL_UNKNOWN_SEVERITIES = new Set(['critical', 'high']);
const MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES = new Set([
  'manual',
  'stub',
  'trusted_local_only',
  'compatibility_only',
]);
const DELIVERY_EVIDENCE_SOURCE_KINDS = new Set([
  'runtime_evidence',
  'deployment_contract',
  'delivered_dossier_ssot',
  'code_evidence',
  'operational_evidence',
]);
const REQUIRED_RETIREMENT_CLEANUP_SCOPE = [
  'code',
  'flags',
  'secrets',
  'docs',
  'dashboards',
  'alerts',
  'data',
] as const;
const GENERIC_SLICE_TITLE_PATTERNS = [
  /(^|\b)build service\b/i,
  /(^|\b)add basic observability\b/i,
  /(^|\b)implement auth\b/i,
  /(^|\b)prepare infra\b/i,
  /(^|\b)tech(?:nical)? improvement\b/i,
];

const CLASS_PAYLOAD_KEYS: Record<NonNullable<DiscoveryItem['item_class']>, Set<string>> = {
  capability_seam: new Set(['capability_added', 'owner_surfaces', 'real_closure_definition']),
  feature_slice: new Set(['parent_seam_ref', 'acceptance_examples']),
  control_guardrail: new Set(['control_objective', 'enforcing_surface', 'fail_mode']),
  migration: new Set(['source_state', 'target_state', 'stop_go_checkpoint', 'cleanup_scope']),
  retirement: new Set([
    'replaces_or_retires_ref',
    'retirement_trigger',
    'legacy_assets',
    'dependent_consumers',
    'cleanup_scope',
  ]),
  spike_discovery: new Set([
    'question',
    'uncertainty_class',
    'validation_method',
    'expected_artifact',
    'exit_criteria',
    'kill_criteria',
    'max_duration',
    'follow_on_item_refs',
    'spike_outcome',
  ]),
  operational_enablement: new Set(['runbook_or_enablement_artifact', 'operational_audience']),
  documentation_support_enablement: new Set([
    'doc_audience',
    'doc_scope',
    'source_of_truth_artifact',
    'freshness_update_trigger',
    'freshness_update_owner',
    'support_handoff_artifact',
  ]),
};

const ORIGIN_KINDS_BY_CLASS: Record<NonNullable<DiscoveryItem['item_class']>, Set<string>> = {
  capability_seam: new Set(['claim_ref', 'gap_ref', 'review_finding_ref']),
  feature_slice: new Set(['claim_ref', 'gap_ref', 'review_finding_ref']),
  control_guardrail: new Set([
    'control_obligation_ref',
    'policy_decision_ref',
    'review_finding_ref',
  ]),
  migration: new Set(['claim_ref', 'gap_ref', 'review_finding_ref', 'unknown_ref']),
  retirement: new Set(['decommission_need_ref', 'gap_ref', 'review_finding_ref']),
  spike_discovery: new Set(['unknown_ref', 'gap_ref', 'review_finding_ref']),
  operational_enablement: new Set([
    'claim_ref',
    'control_obligation_ref',
    'policy_decision_ref',
    'review_finding_ref',
  ]),
  documentation_support_enablement: new Set([
    'claim_ref',
    'control_obligation_ref',
    'policy_decision_ref',
    'review_finding_ref',
  ]),
};

export interface ValidateDiscoveryRunResult {
  errors: string[];
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  runDir: string;
  assessment: AssessmentFile | null;
  warnings: string[];
}

export interface ValidateDiscoveryRunOptions {
  commandRunId?: string;
}

function pushIssue(
  target: string[],
  message: string,
  hardFails?: string[],
  hardFail = false,
): void {
  target.push(message);
  if (hardFail && hardFails) {
    hardFails.push(message);
  }
}

function graphRefExists(
  ref: GraphRef | null,
  runId: string,
  itemIds: Set<string>,
  trackIds: Set<string>,
  trackProofIds: Set<string>,
  proofIds: Set<string>,
  reviewIds: Set<string>,
  contractIds: Set<string>,
  dataDomainIds: Set<string>,
  valueStreamIds: Set<string>,
): boolean {
  if (!ref || !isNonEmptyString(ref.id)) {
    return false;
  }

  switch (ref.kind) {
    case 'run':
      return ref.id === runId;
    case 'item':
      return itemIds.has(ref.id);
    case 'track':
      return trackIds.has(ref.id);
    case 'track_proof':
      return trackProofIds.has(ref.id);
    case 'proof':
      return proofIds.has(ref.id);
    case 'review':
      return reviewIds.has(ref.id);
    case 'contract':
      return contractIds.has(ref.id);
    case 'data_domain':
      return dataDomainIds.has(ref.id);
    case 'value_stream':
      return valueStreamIds.has(ref.id);
    default:
      return false;
  }
}

function relationEndpointExists(
  relation: DiscoveryRelation,
  runId: string,
  itemIds: Set<string>,
  trackIds: Set<string>,
  trackProofIds: Set<string>,
  proofIds: Set<string>,
  reviewIds: Set<string>,
  contractIds: Set<string>,
  dataDomainIds: Set<string>,
  valueStreamIds: Set<string>,
): { fromRef: GraphRef | null; toRef: GraphRef | null; validFrom: boolean; validTo: boolean } {
  const relType = relation.relation_type;
  const fromRef = normalizeRelationRef(relation.from, 'item');
  const toRef = normalizeRelationRef(relation.to);

  if (!isNonEmptyString(relType) || toRef === null) {
    return { fromRef, toRef, validFrom: false, validTo: false };
  }

  let validFrom = false;
  let validTo = false;

  switch (relType) {
    case 'belongs_to_track':
      validFrom =
        fromRef?.kind === 'item' &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      validTo =
        toRef.kind === 'track' &&
        graphRefExists(
          toRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      break;
    case 'proves':
      validFrom =
        fromRef !== null &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        ) &&
        (fromRef.kind === 'item' || fromRef.kind === 'track');
      validTo =
        (fromRef?.kind === 'item' &&
          toRef.kind === 'proof' &&
          graphRefExists(
            toRef,
            runId,
            itemIds,
            trackIds,
            trackProofIds,
            proofIds,
            reviewIds,
            contractIds,
            dataDomainIds,
            valueStreamIds,
          )) ||
        (fromRef?.kind === 'track' &&
          toRef.kind === 'track_proof' &&
          graphRefExists(
            toRef,
            runId,
            itemIds,
            trackIds,
            trackProofIds,
            proofIds,
            reviewIds,
            contractIds,
            dataDomainIds,
            valueStreamIds,
          ));
      break;
    case 'reviewed_by':
      validFrom =
        fromRef !== null &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        ) &&
        (fromRef.kind === 'item' || fromRef.kind === 'run' || fromRef.kind === 'track_proof');
      validTo =
        toRef.kind === 'review' &&
        graphRefExists(
          toRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      break;
    case 'touches_contract':
      validFrom =
        fromRef?.kind === 'item' &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      validTo =
        toRef.kind === 'contract' &&
        graphRefExists(
          toRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      break;
    case 'touches_data_domain':
      validFrom =
        fromRef?.kind === 'item' &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      validTo =
        toRef.kind === 'data_domain' &&
        graphRefExists(
          toRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      break;
    case 'migrates_from':
    case 'retires':
    case 'replaces':
      validFrom =
        fromRef?.kind === 'item' &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      validTo =
        (toRef.kind === 'item' &&
          graphRefExists(
            toRef,
            runId,
            itemIds,
            trackIds,
            trackProofIds,
            proofIds,
            reviewIds,
            contractIds,
            dataDomainIds,
            valueStreamIds,
          )) ||
        (toRef.kind === 'contract' &&
          graphRefExists(
            toRef,
            runId,
            itemIds,
            trackIds,
            trackProofIds,
            proofIds,
            reviewIds,
            contractIds,
            dataDomainIds,
            valueStreamIds,
          ));
      break;
    default:
      validFrom =
        fromRef?.kind === 'item' &&
        graphRefExists(
          fromRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      validTo =
        toRef.kind === 'item' &&
        graphRefExists(
          toRef,
          runId,
          itemIds,
          trackIds,
          trackProofIds,
          proofIds,
          reviewIds,
          contractIds,
          dataDomainIds,
          valueStreamIds,
        );
      break;
  }

  return { fromRef, toRef, validFrom, validTo };
}

function hasChangeSurface(item: DiscoveryItem, surfaces: Set<string>): boolean {
  return asArray(item.change_surfaces).some((surface) => surfaces.has(surface));
}

function requiresRollout(item: DiscoveryItem): boolean {
  return item.item_class !== 'spike_discovery';
}

function normalizeRelationRef(value: unknown, defaultKind?: GraphRef['kind']): GraphRef | null {
  if (isGraphRef(value)) {
    return value;
  }

  if (isNonEmptyString(value) && defaultKind) {
    return graphRef(defaultKind, value);
  }

  return null;
}

function relationRefEquals(
  left: GraphRef | null | undefined,
  right: GraphRef | null | undefined,
): boolean {
  return graphRefKey(left) === graphRefKey(right);
}

function getDependencyRefs(item: DiscoveryItem): string[] {
  return asArray(item.dependency_refs ?? item.dependencies);
}

function getPlanningConstraints(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.planning_constraints);
}

function getPlanningString(item: DiscoveryItem, key: string): string | undefined {
  const planning = getPlanningConstraints(item);
  return isNonEmptyString(planning[key]) ? String(planning[key]) : undefined;
}

function getPlanningBoolean(item: DiscoveryItem, key: string): boolean | null {
  const planning = getPlanningConstraints(item);
  return typeof planning[key] === 'boolean' ? planning[key] : null;
}

function getItemEstimateBand(item: DiscoveryItem): string | undefined {
  const planning = getPlanningConstraints(item);
  return isNonEmptyString(planning.estimate_band) ? planning.estimate_band : item.estimate_band;
}

function getItemConfidence(item: DiscoveryItem): string | undefined {
  const planning = getPlanningConstraints(item);
  return isNonEmptyString(planning.confidence) ? planning.confidence : item.confidence;
}

function getValueRecord(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.value);
}

function getNfrContract(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.nfr_contract);
}

function getObservabilityContract(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.observability_contract);
}

function getReadinessContract(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.readiness_contract);
}

function getDoneContract(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.done_contract);
}

function getContractExemptions(contract: Record<string, unknown>): Record<string, string> {
  const raw = asStringRecord(contract.exemptions);
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isNonEmptyString(value)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function contractCheckSatisfied(
  contract: Record<string, unknown>,
  field: string,
  allowedExemptions: Set<string>,
): { exempted: boolean; satisfied: boolean } {
  const value = contract[field];
  if (value === true) {
    return { exempted: false, satisfied: true };
  }

  const exemptions = getContractExemptions(contract);
  if (allowedExemptions.has(field) && isNonEmptyString(exemptions[field])) {
    return { exempted: true, satisfied: true };
  }

  return { exempted: false, satisfied: false };
}

function validateFindingCollection(
  reviewId: string,
  collection: unknown,
  collectionName: 'findings' | 'hard_fail_report',
  errors: string[],
  hardFails: string[],
  reviewFindingIds: Set<string>,
): void {
  if (!Array.isArray(collection)) {
    pushIssue(errors, `Review ${reviewId} missing ${collectionName}`, hardFails, true);
    return;
  }

  let previousRank = Number.POSITIVE_INFINITY;
  for (const entry of collection) {
    const finding = asStringRecord(entry);
    if (!isNonEmptyString(finding.finding_id)) {
      pushIssue(
        errors,
        `Review ${reviewId} has ${collectionName} entry with invalid finding_id`,
        hardFails,
        true,
      );
      continue;
    }
    if (reviewFindingIds.has(finding.finding_id)) {
      pushIssue(errors, `Duplicate review finding_id: ${finding.finding_id}`, hardFails, true);
      continue;
    }
    reviewFindingIds.add(finding.finding_id);
    if (
      !isNonEmptyString(finding.severity) ||
      !REVIEW_FINDING_SEVERITY_RANK.has(finding.severity)
    ) {
      pushIssue(
        errors,
        `Review ${reviewId} has ${collectionName} entry ${finding.finding_id} with invalid severity`,
        hardFails,
        true,
      );
      continue;
    }
    if (!isNonEmptyString(finding.title) || !isNonEmptyString(finding.detail)) {
      pushIssue(
        errors,
        `Review ${reviewId} has ${collectionName} entry ${finding.finding_id} without title/detail`,
        hardFails,
        true,
      );
      continue;
    }

    const rank = REVIEW_FINDING_SEVERITY_RANK.get(finding.severity) ?? 0;
    if (rank > previousRank) {
      pushIssue(
        errors,
        `Review ${reviewId} ${collectionName} must be ordered by severity`,
        hardFails,
        true,
      );
    }
    previousRank = rank;
  }
}

function getClassPayload(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.class_payload);
}

function getPayloadString(item: DiscoveryItem, key: string, fallback?: string): string | undefined {
  const payload = getClassPayload(item);
  return isNonEmptyString(payload[key]) ? String(payload[key]) : fallback;
}

function getPayloadStringArray(item: DiscoveryItem, key: string, fallback?: string[]): string[] {
  const payload = getClassPayload(item);
  const payloadValue = payload[key];
  if (Array.isArray(payloadValue)) {
    return payloadValue.filter(isNonEmptyString);
  }

  return fallback ?? [];
}

function getPayloadGraphRef(
  item: DiscoveryItem,
  key: string,
  fallbackKind?: GraphRef['kind'],
): GraphRef | null {
  const payload = getClassPayload(item);
  const value = payload[key];
  if (isGraphRef(value)) {
    return value;
  }
  if (isNonEmptyString(value) && fallbackKind) {
    return graphRef(fallbackKind, value);
  }
  return null;
}

function getDoneContractClassCheck(item: DiscoveryItem, key: string): boolean | null {
  const doneContract = getDoneContract(item);
  const classSpecificChecks = asStringRecord(doneContract.class_specific_checks);
  return typeof classSpecificChecks[key] === 'boolean' ? classSpecificChecks[key] : null;
}

function isSecurityDirectlyImpacted(items: DiscoveryItem[]): boolean {
  return items.some(
    (item) => item.item_class === 'control_guardrail' || hasChangeSurface(item, SECURITY_SURFACES),
  );
}

function isRuntimeOrSupportDirectlyImpacted(items: DiscoveryItem[]): boolean {
  return items.some(
    (item) =>
      item.item_class === 'operational_enablement' ||
      item.item_class === 'documentation_support_enablement' ||
      hasChangeSurface(item, SUPPORT_SURFACES),
  );
}

function getRolloutMode(item: DiscoveryItem): string | null {
  const rollout = asStringRecord(item.rollout);
  return isNonEmptyString(rollout.mode) ? String(rollout.mode) : (item.rollout_mode ?? null);
}

function getRolloutApplicability(item: DiscoveryItem): string {
  const rollout = asStringRecord(item.rollout);
  return isNonEmptyString(rollout.applicability) ? String(rollout.applicability) : 'required';
}

function getRolloutJustification(item: DiscoveryItem): string | null {
  const rollout = asStringRecord(item.rollout);
  return isNonEmptyString(rollout.justification) ? String(rollout.justification) : null;
}

function getRecoveryClass(item: DiscoveryItem): string | null {
  const recovery = asStringRecord(item.recovery);
  return isNonEmptyString(recovery.class) ? String(recovery.class) : (item.rollback_class ?? null);
}

function getRecoveryApplicability(item: DiscoveryItem): string {
  const recovery = asStringRecord(item.recovery);
  return isNonEmptyString(recovery.applicability) ? String(recovery.applicability) : 'required';
}

function getRecoveryJustification(item: DiscoveryItem): string | null {
  const recovery = asStringRecord(item.recovery);
  return isNonEmptyString(recovery.justification) ? String(recovery.justification) : null;
}

function getContractGovernance(item: DiscoveryItem): Record<string, unknown> {
  return asStringRecord(item.contract_governance);
}

function isObsoleteNaShape(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'n_a';
}

function isCriticalUnknownSeverity(value: unknown): boolean {
  return isNonEmptyString(value) && CRITICAL_UNKNOWN_SEVERITIES.has(value.toLowerCase());
}

function itemTouchesTrustBoundary(item: DiscoveryItem): boolean {
  return (
    asArray(item.trust_boundaries_crossed).length > 0 || hasChangeSurface(item, SECURITY_SURFACES)
  );
}

function itemRequiresNfrContract(item: DiscoveryItem): boolean {
  return [
    'capability_seam',
    'feature_slice',
    'control_guardrail',
    'migration',
    'operational_enablement',
  ].includes(item.item_class ?? '');
}

function itemRequiresObservabilityContract(item: DiscoveryItem): boolean {
  return (
    itemRequiresNfrContract(item) ||
    hasChangeSurface(item, SUPPORT_SURFACES) ||
    item.item_class === 'documentation_support_enablement'
  );
}

function hasGenericSliceTitle(title: unknown): boolean {
  return (
    isNonEmptyString(title) && GENERIC_SLICE_TITLE_PATTERNS.some((pattern) => pattern.test(title))
  );
}

function getUnexpectedPayloadKeys(item: DiscoveryItem): string[] {
  if (!isNonEmptyString(item.item_class)) {
    return [];
  }

  const allowedKeys = CLASS_PAYLOAD_KEYS[item.item_class];
  return Object.keys(getClassPayload(item)).filter((key) => !allowedKeys.has(key));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function validateStringArrayField(
  record: Record<string, unknown>,
  field: string,
  ownerLabel: string,
  errors: string[],
  hardFails: string[],
): string[] {
  const value = record[field];
  if (!isStringArray(value)) {
    pushIssue(errors, `${ownerLabel} must include ${field}[]`, hardFails, true);
    return [];
  }

  return value;
}

function requireNonEmptyStringArrayField(
  record: Record<string, unknown>,
  field: string,
  ownerLabel: string,
  errors: string[],
  hardFails: string[],
): string[] {
  const value = validateStringArrayField(record, field, ownerLabel, errors, hardFails);
  if (value.length === 0) {
    pushIssue(errors, `${ownerLabel} must include at least one ${field} entry`, hardFails, true);
  }
  return value;
}

function validateNonEmptyStringRecord(
  record: Record<string, unknown>,
  ownerLabel: string,
  errors: string[],
  hardFails: string[],
): void {
  for (const [key, value] of Object.entries(record)) {
    if (!isNonEmptyString(key)) {
      pushIssue(errors, `${ownerLabel} contains an empty key`, hardFails, true);
    }
    if (!isNonEmptyString(value)) {
      pushIssue(errors, `${ownerLabel}.${key} must be a non-empty string`, hardFails, true);
    }
  }
}

function validateAliasRecord(
  record: Record<string, unknown>,
  ownerLabel: string,
  errors: string[],
  hardFails: string[],
): void {
  for (const [key, value] of Object.entries(record)) {
    if (!isNonEmptyString(key)) {
      pushIssue(errors, `${ownerLabel} contains an empty canonical term`, hardFails, true);
    }
    if (!isStringArray(value) || value.length === 0) {
      pushIssue(errors, `${ownerLabel}.${key} must be a non-empty string array`, hardFails, true);
      continue;
    }
    if (value.some((alias) => alias === key)) {
      pushIssue(
        errors,
        `${ownerLabel}.${key} must not repeat the canonical term as an alias`,
        hardFails,
        true,
      );
    }
  }
}

function validateSourceRefs(
  refs: unknown,
  ownerLabel: string,
  sourceIds: Set<string>,
  excludedSourceIds: Set<string>,
  errors: string[],
  hardFails: string[],
): string[] {
  if (!isStringArray(refs)) {
    pushIssue(errors, `${ownerLabel} must include source_refs[]`, hardFails, true);
    return [];
  }
  if (refs.length === 0) {
    pushIssue(errors, `${ownerLabel} must include source_refs[]`, hardFails, true);
    return refs;
  }

  for (const sourceRef of refs) {
    if (!sourceIds.has(sourceRef)) {
      pushIssue(errors, `${ownerLabel} references unknown source ${sourceRef}`, hardFails, true);
    } else if (excludedSourceIds.has(sourceRef)) {
      pushIssue(errors, `${ownerLabel} references excluded source ${sourceRef}`, hardFails, true);
    }
  }

  return refs;
}

function getCurrentTruthEvidenceSourceIds(
  refs: unknown,
  sourceById: Map<string, BacklogFile['source_authority'][number]>,
): string[] {
  if (!Array.isArray(refs)) {
    return [];
  }

  const sourceIds = new Set<string>();
  for (const sourceRef of refs) {
    if (!isNonEmptyString(sourceRef)) {
      continue;
    }
    const source = sourceById.get(sourceRef);
    if (
      source &&
      source.authority === 'authoritative_current_truth' &&
      isNonEmptyString(source.kind) &&
      DELIVERY_EVIDENCE_SOURCE_KINDS.has(source.kind)
    ) {
      sourceIds.add(sourceRef);
    }
  }

  return [...sourceIds].sort();
}

function collectItemDeliveryEvidenceSourceIds(
  item: DiscoveryItem,
  sourceById: Map<string, BacklogFile['source_authority'][number]>,
  excludedSourceIds: Set<string>,
): string[] {
  const packetProvenance = asStringRecord((item as Record<string, unknown>).packet_provenance);
  if (
    packetProvenance.merge_mode !== 'source_driven_refresh' ||
    packetProvenance.source_refs_managed !== true
  ) {
    return [];
  }

  const managedSourceRefs = getCurrentTruthEvidenceSourceIds(
    (item as Record<string, unknown>).source_refs,
    sourceById,
  ).filter((sourceId) => !excludedSourceIds.has(sourceId));
  if (managedSourceRefs.length === 0) {
    return [];
  }

  const sourceId = isNonEmptyString(packetProvenance.source_id) ? packetProvenance.source_id : null;
  if (sourceId === null || !managedSourceRefs.includes(sourceId)) {
    return [];
  }

  const source = sourceById.get(sourceId);
  if (
    source !== undefined &&
    source.authority === 'authoritative_current_truth' &&
    isNonEmptyString(source.kind) &&
    DELIVERY_EVIDENCE_SOURCE_KINDS.has(source.kind) &&
    (packetProvenance.source_authority === undefined ||
      packetProvenance.source_authority === source.authority) &&
    (packetProvenance.source_kind === undefined || packetProvenance.source_kind === source.kind)
  ) {
    return [sourceId];
  }

  return [];
}

function sourceAuthorityIdentityKey(
  source: Pick<BacklogFile['source_authority'][number], 'ref' | 'kind' | 'authority'>,
): string | null {
  if (
    !isNonEmptyString(source.ref) ||
    !isNonEmptyString(source.kind) ||
    !isNonEmptyString(source.authority)
  ) {
    return null;
  }

  return `${source.ref}::${source.kind}::${source.authority}`;
}

interface IssueResolutionSnapshotEntry {
  issue_id: string;
  resolution_state: string | null;
  resolution_note: string | null;
}

function buildIssueResolutionSnapshot<
  T extends {
    issue_id?: string | null;
    resolution_state?: string | null;
    resolution_note?: string | null;
  },
>(entries: T[]): IssueResolutionSnapshotEntry[] {
  return entries
    .filter((entry): entry is (typeof entries)[number] & { issue_id: string } =>
      isNonEmptyString(entry.issue_id),
    )
    .map((entry) => ({
      issue_id: entry.issue_id,
      resolution_state: isNonEmptyString(entry.resolution_state) ? entry.resolution_state : null,
      resolution_note: isNonEmptyString(entry.resolution_note) ? entry.resolution_note : null,
    }))
    .sort((left, right) => left.issue_id.localeCompare(right.issue_id));
}

function readIssueResolutionSnapshotEntries(value: unknown): IssueResolutionSnapshotEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: IssueResolutionSnapshotEntry[] = [];
  for (const candidate of value) {
    const record = asStringRecord(candidate);
    if (!isNonEmptyString(record.issue_id)) {
      continue;
    }
    entries.push({
      issue_id: record.issue_id,
      resolution_state: isNonEmptyString(record.resolution_state) ? record.resolution_state : null,
      resolution_note: isNonEmptyString(record.resolution_note) ? record.resolution_note : null,
    });
  }
  return entries;
}

function validateGraphRefArray(
  refs: unknown,
  ownerLabel: string,
  field: string,
  runId: string,
  itemIds: Set<string>,
  trackIds: Set<string>,
  trackProofIds: Set<string>,
  proofIds: Set<string>,
  reviewIds: Set<string>,
  contractIds: Set<string>,
  dataDomainIds: Set<string>,
  valueStreamIds: Set<string>,
  errors: string[],
  hardFails: string[],
): GraphRef[] {
  if (!Array.isArray(refs)) {
    pushIssue(errors, `${ownerLabel} must include ${field}[]`, hardFails, true);
    return [];
  }

  const validatedRefs: GraphRef[] = [];
  for (const ref of refs) {
    if (!isGraphRef(ref)) {
      pushIssue(errors, `${ownerLabel} has invalid graph ref in ${field}`, hardFails, true);
      continue;
    }
    if (
      !graphRefExists(
        ref,
        runId,
        itemIds,
        trackIds,
        trackProofIds,
        proofIds,
        reviewIds,
        contractIds,
        dataDomainIds,
        valueStreamIds,
      )
    ) {
      pushIssue(
        errors,
        `${ownerLabel} references missing ${formatGraphRef(ref)} in ${field}`,
        hardFails,
        true,
      );
      continue;
    }
    validatedRefs.push(ref);
  }

  return validatedRefs;
}

function targetSystemIsPopulated(targetSystem: BacklogFile['target_system']): boolean {
  const target = asStringRecord(targetSystem);
  return (
    Array.isArray(target.actors) &&
    target.actors.length > 0 &&
    Array.isArray(target.operator_personas) &&
    target.operator_personas.length > 0 &&
    Array.isArray(target.external_consumer_groups) &&
    target.external_consumer_groups.length > 0 &&
    Array.isArray(target.external_dependencies) &&
    target.external_dependencies.length > 0 &&
    Array.isArray(target.trust_boundaries) &&
    target.trust_boundaries.length > 0 &&
    Array.isArray(target.durable_state_families) &&
    target.durable_state_families.length > 0 &&
    Array.isArray(target.control_surfaces) &&
    target.control_surfaces.length > 0 &&
    Array.isArray(target.failure_domains) &&
    target.failure_domains.length > 0 &&
    Array.isArray(target.team_and_ownership_assumptions) &&
    target.team_and_ownership_assumptions.length > 0 &&
    Array.isArray(target.quality_goals) &&
    target.quality_goals.length > 0 &&
    Array.isArray(target.policy_surfaces) &&
    target.policy_surfaces.length > 0
  );
}

function asBuiltIsPopulated(asBuilt: BacklogFile['as_built']): boolean {
  const built = asStringRecord(asBuilt);
  return (
    Array.isArray(built.deployable_surfaces) &&
    built.deployable_surfaces.length > 0 &&
    Array.isArray(built.services) &&
    built.services.length > 0 &&
    Array.isArray(built.processes) &&
    built.processes.length > 0 &&
    Array.isArray(built.jobs) &&
    built.jobs.length > 0 &&
    Array.isArray(built.apis) &&
    built.apis.length > 0 &&
    Array.isArray(built.event_surfaces) &&
    built.event_surfaces.length > 0 &&
    Array.isArray(built.queues) &&
    built.queues.length > 0 &&
    Array.isArray(built.state_stores) &&
    built.state_stores.length > 0 &&
    Array.isArray(built.deployable_units) &&
    built.deployable_units.length > 0 &&
    Array.isArray(built.ownership_matrix) &&
    built.ownership_matrix.length > 0 &&
    Array.isArray(built.environment_matrix) &&
    built.environment_matrix.length > 0 &&
    Array.isArray(built.ingress_interfaces) &&
    built.ingress_interfaces.length > 0 &&
    Array.isArray(built.egress_interfaces) &&
    built.egress_interfaces.length > 0 &&
    Array.isArray(built.canonical_writers) &&
    built.canonical_writers.length > 0 &&
    Array.isArray(built.trust_boundary_crossings) &&
    built.trust_boundary_crossings.length > 0 &&
    Array.isArray(built.data_classes) &&
    built.data_classes.length > 0 &&
    Array.isArray(built.dependency_classifications) &&
    built.dependency_classifications.length > 0 &&
    Array.isArray(built.vendor_external_owners) &&
    built.vendor_external_owners.length > 0
  );
}

function trackProofCoverageIsSufficient(coverage: unknown): boolean {
  const coverageRecord = asStringRecord(coverage);
  return TRACK_PROOF_COVERAGE_KEYS.every((coverageKey) => coverageRecord[coverageKey] === true);
}

const SAFETY_TRACK_PRIORITY = new Map<string, number>([
  ['minimal-working-system', 0],
  ['externally-safe-operationally-supportable', 1],
  ['full-target-system', 2],
]);

const SAFETY_ITEM_CLASS_PRIORITY = new Map<string, number>([
  ['control_guardrail', 0],
  ['operational_enablement', 1],
  ['documentation_support_enablement', 1],
  ['capability_seam', 2],
  ['feature_slice', 2],
  ['migration', 2],
  ['retirement', 2],
  ['spike_discovery', 2],
]);

const ECONOMIC_TIE_BREAK_GROUPS: string[][] = [
  ['compliance_deadline'],
  ['risk_burn_down'],
  ['dependency_unlock'],
  ['cost_of_delay'],
  ['user_value', 'ops_pain_reduction'],
  ['learning_value'],
  ['reversibility'],
  ['lead_time_risk'],
  ['strategic_fit'],
];

function getSafetyPriority(
  entry: BacklogFile['roadmap_matrix'][number],
): readonly [number, number] {
  const trackId = entry.track_ref?.id ?? '';
  const trackPriority = SAFETY_TRACK_PRIORITY.get(trackId) ?? Number.MAX_SAFE_INTEGER;
  const itemPriority =
    trackId === 'externally-safe-operationally-supportable'
      ? (SAFETY_ITEM_CLASS_PRIORITY.get(entry.item_class ?? '') ?? Number.MAX_SAFE_INTEGER)
      : 0;
  return [trackPriority, itemPriority] as const;
}

function compareEconomicPriority(
  left: BacklogFile['roadmap_matrix'][number],
  right: BacklogFile['roadmap_matrix'][number],
): number {
  const leftFactors = new Set(asArray(left.economic_factors).filter(isNonEmptyString));
  const rightFactors = new Set(asArray(right.economic_factors).filter(isNonEmptyString));

  for (const factorGroup of ECONOMIC_TIE_BREAK_GROUPS) {
    const leftHas = factorGroup.some((factor) => leftFactors.has(factor));
    const rightHas = factorGroup.some((factor) => rightFactors.has(factor));
    if (leftHas === rightHas) {
      continue;
    }
    return leftHas ? -1 : 1;
  }

  return 0;
}

function getIssueEffectiveSeverity(entry: BacklogFile['unknowns'][number]): string {
  if (entry.resolution_state === 'downgraded' && isNonEmptyString(entry.downgraded_severity)) {
    return entry.downgraded_severity;
  }

  return entry.severity ?? '';
}

function scoreSection(
  id: string,
  label: string,
  max: number,
  score: number,
  reason: string,
): ScoreSection {
  return { id, label, max, score, reason };
}

function computeScore(
  backlog: BacklogFile,
  hardFails: string[],
  errors: string[],
  warnings: string[],
  lintFindings: string[],
  staleProofs: string[],
  staleItems: string[],
  staleClaims: string[],
  missingRequiredReviews: ReviewRole[],
  pendingTrackProofReviews: string[],
  committedClaimsWithoutItems: string[],
  missingOwners: string[],
): { max: number; sections: ScoreSection[]; total: number } {
  const sections: ScoreSection[] = [];

  const sourceAuthorityScore =
    backlog.source_authority.length === 0
      ? 0
      : hardFails.some((issue) => issue.includes('source'))
        ? 4
        : 10;
  sections.push(
    scoreSection(
      'truth_model',
      'Truth model and source authority',
      10,
      sourceAuthorityScore,
      backlog.source_authority.length === 0
        ? 'No authoritative sources recorded.'
        : 'Source authority ledger is present.',
    ),
  );

  const reconstructionScore =
    targetSystemIsPopulated(backlog.target_system) && asBuiltIsPopulated(backlog.as_built)
      ? 10
      : targetSystemIsPopulated(backlog.target_system) || asBuiltIsPopulated(backlog.as_built)
        ? 5
        : 0;
  sections.push(
    scoreSection(
      'reconstruction',
      'Whole-system plus as-built reconstruction',
      10,
      reconstructionScore,
      reconstructionScore === 10
        ? 'Target and as-built reconstructions are populated.'
        : 'Target system or as-built reconstruction is incomplete.',
    ),
  );

  const coverageScore =
    committedClaimsWithoutItems.length === 0 &&
    missingOwners.length === 0 &&
    staleClaims.length === 0
      ? 15
      : Math.max(
          0,
          15 -
            committedClaimsWithoutItems.length * 4 -
            missingOwners.length * 2 -
            staleClaims.length * 2,
        );
  sections.push(
    scoreSection(
      'coverage',
      'Claim coverage and ownership completeness',
      15,
      coverageScore,
      committedClaimsWithoutItems.length === 0 &&
        missingOwners.length === 0 &&
        staleClaims.length === 0
        ? 'Committed claims map to owned backlog items and no claim drift remains unresolved.'
        : 'Some committed claims are unmapped, stale, or items are missing owners.',
    ),
  );

  const ontologyPenalty = errors.filter(
    (error) =>
      error.includes('item_class') ||
      error.includes('track_id') ||
      error.includes('Relation') ||
      error.includes('orphan') ||
      error.includes('belongs_to_track') ||
      error.includes('semantic') ||
      error.includes('trust-boundary') ||
      error.includes('manual/synthetic'),
  ).length;
  sections.push(
    scoreSection(
      'ontology',
      'Backlog ontology and decomposition quality',
      15,
      Math.max(0, 15 - ontologyPenalty * 2),
      ontologyPenalty === 0
        ? 'Item classes and graph relations are coherent.'
        : 'Graph semantics still have defects.',
    ),
  );

  const nfrPenalty = errors.filter(
    (error) =>
      error.includes('nfr_contract') ||
      error.includes('observability_contract') ||
      error.includes('Quality attribute') ||
      error.includes('Policy decision') ||
      error.includes('trust-boundary') ||
      error.includes('data_class'),
  ).length;
  const nfrStructuralPenalty = backlog.quality_attributes.length < 2 ? 6 : 0;
  const nfrScore = Math.max(0, 10 - nfrPenalty - nfrStructuralPenalty);
  sections.push(
    scoreSection(
      'nfr_policy',
      'NFR, policy, security, and compliance completeness',
      10,
      nfrScore,
      nfrScore === 10
        ? 'NFR, observability, policy, and trust-boundary obligations are explicit and validated.'
        : 'NFR, observability, policy, quality-attribute, or trust-boundary obligations are still incomplete.',
    ),
  );

  const contractErrors = errors.filter(
    (issue) =>
      issue.includes('compatibility') ||
      issue.includes('migration governance') ||
      issue.includes('canonical_writer') ||
      issue.includes('consumer_impact') ||
      issue.includes('contract/data-changing') ||
      issue.includes('touches_contract') ||
      issue.includes('touches data domain') ||
      issue.includes('cleanup_scope') ||
      issue.includes('dependent_consumers'),
  ).length;
  sections.push(
    scoreSection(
      'contract_governance',
      'Interface, data, and migration governance',
      10,
      contractErrors === 0 ? 10 : Math.max(0, 10 - contractErrors * 2),
      contractErrors === 0
        ? 'Contract-changing work carries compatibility governance.'
        : 'Contract or migration governance gaps remain.',
    ),
  );

  const readinessPenalty =
    lintFindings.filter(
      (finding) =>
        finding.includes('estimate_band') ||
        finding.includes('confidence') ||
        finding.includes('acceptance_examples') ||
        finding.includes('readiness'),
    ).length +
    errors.filter(
      (error) =>
        error.includes('Feature slice') ||
        error.includes('readiness_contract') ||
        error.includes('slice_value_kind') ||
        error.includes('dominant_') ||
        error.includes('blast_radius_note') ||
        error.includes('external_lead_time_risk') ||
        error.includes('staffing_skill_constraints') ||
        error.includes('blocked_by_decision_status') ||
        error.includes('generic horizontal title'),
    ).length;
  sections.push(
    scoreSection(
      'planning_readiness',
      'Planning readiness and acceptance specificity',
      10,
      Math.max(0, 10 - readinessPenalty * 2),
      readinessPenalty === 0
        ? 'Planning-horizon items carry readiness details.'
        : 'Some items still need readiness detail before planning use.',
    ),
  );

  const sequencingErrors = errors.filter(
    (error) =>
      error.includes('depends on unknown item') ||
      error.includes('Roadmap matrix') ||
      error.includes('track proof') ||
      error.includes('track gate'),
  ).length;
  const sequencingScore =
    backlog.items.length > 0 &&
    backlog.roadmap_matrix.length > 0 &&
    sequencingErrors === 0 &&
    backlog.items.some((item) => isNonEmptyString(item.economic_priority_note))
      ? 10
      : backlog.items.length > 0 && sequencingErrors === 0
        ? 7
        : 3;
  sections.push(
    scoreSection(
      'sequencing',
      'Sequencing, dependency graph, and economics',
      10,
      sequencingScore,
      sequencingScore >= 7
        ? 'Dependencies are explicit and at least some economics are recorded.'
        : 'Dependency or economics data is still thin.',
    ),
  );

  const proofPenalty =
    staleProofs.length +
    staleItems.length +
    hardFails.filter((issue) => issue.includes('rollout') || issue.includes('rollback')).length;
  sections.push(
    scoreSection(
      'proof_operability',
      'Proof, rollout, rollback/recovery, and operability',
      5,
      Math.max(0, 5 - proofPenalty),
      proofPenalty === 0
        ? 'Proof bundles, freshness, rollout, and recovery data are present.'
        : 'Proof freshness, stale items, or rollout data is incomplete.',
    ),
  );

  const reviewPenalty =
    missingRequiredReviews.length +
    pendingTrackProofReviews.length +
    warnings.filter((warning) => warning.toLowerCase().includes('review')).length;
  sections.push(
    scoreSection(
      'review_automation',
      'Review, drift management, retirement closure, and automation',
      5,
      Math.max(0, 5 - reviewPenalty),
      reviewPenalty === 0
        ? 'Required reviews and track-closure reviews are present.'
        : 'Review or track-closure coverage is incomplete.',
    ),
  );

  const total = sections.reduce((sum, section) => sum + section.score, 0);
  return {
    max: 100,
    sections,
    total,
  };
}

function acceptanceAtLeast(achieved: AcceptanceClass, target: AcceptanceClass): boolean {
  const rank = (value: AcceptanceClass): number => {
    switch (value) {
      case 'draft-only':
        return 0;
      case 'planning-grade':
        return 1;
      case 'implementation-grade':
        return 2;
    }
  };

  return rank(achieved) >= rank(target);
}

function buildAcceptanceState(
  target: AcceptanceClass,
  achieved: AcceptanceClass,
  targetSatisfied: boolean,
  blockingReasons: string[],
): AssessmentAcceptance {
  const normalizedTarget =
    target === 'draft-only'
      ? 'draft-only'
      : target === 'planning-grade'
        ? 'planning-grade'
        : 'implementation-grade';
  const normalizedAchieved =
    achieved === 'draft-only'
      ? 'draft-only'
      : achieved === 'planning-grade'
        ? 'planning-grade'
        : 'implementation-grade';

  return {
    target: normalizedTarget,
    achieved: normalizedAchieved,
    target_satisfied: targetSatisfied,
    blocking_reasons: targetSatisfied ? [] : blockingReasons,
  };
}

function isProofDimensionNotApplicableAllowed(
  item: DiscoveryItem,
  dimensionKey: string,
  justification: unknown,
): boolean {
  if (!isNonEmptyString(justification)) {
    return false;
  }

  if (dimensionKey !== 'security_trace') {
    return false;
  }

  return !isSecurityDirectlyImpacted([item]);
}

function getScopedItemsForGraphRef(
  scope: GraphRef,
  _runId: string,
  itemsById: Map<string, DiscoveryItem>,
  backlog: BacklogFile,
): DiscoveryItem[] {
  switch (scope.kind) {
    case 'item': {
      const item = itemsById.get(scope.id ?? '');
      return item ? [item] : [];
    }
    case 'run':
      return backlog.items.filter((item): item is DiscoveryItem & { item_id: string } =>
        isNonEmptyString(item.item_id),
      );
    case 'track_proof': {
      const trackProof = backlog.track_proofs.find((entry) => entry.track_proof_id === scope.id);
      if (!trackProof?.track_id) {
        return [];
      }
      return backlog.items.filter((item) => item.track_id === trackProof.track_id);
    }
    default:
      return [];
  }
}

function isRoleDirectlyImpacted(
  role: ReviewRole,
  scopedItems: DiscoveryItem[],
  targetAcceptance: AcceptanceClass,
): boolean {
  switch (role) {
    case 'product_strategy':
    case 'system_architecture':
    case 'application_engineering':
      return true;
    case 'qa_release':
      return targetAcceptance !== 'draft-only';
    case 'platform_sre':
    case 'support_operations':
      return isRuntimeOrSupportDirectlyImpacted(scopedItems);
    case 'security':
      return isSecurityDirectlyImpacted(scopedItems);
  }
}

function addRequiredRoleScope(
  requiredRoleScopes: Map<ReviewRole, Map<string, GraphRef>>,
  role: ReviewRole,
  scope: GraphRef,
): void {
  const scopeKey = graphRefKey(scope);
  const roleScopes = requiredRoleScopes.get(role) ?? new Map<string, GraphRef>();
  roleScopes.set(scopeKey, scope);
  requiredRoleScopes.set(role, roleScopes);
}

function scopeIsWaived(
  validWaivedScopesByRole: Map<ReviewRole, Set<string>>,
  role: ReviewRole,
  scope: GraphRef,
  runScopeKey: string,
): boolean {
  const waivedScopes = validWaivedScopesByRole.get(role);
  if (!waivedScopes) {
    return false;
  }

  return waivedScopes.has(runScopeKey) || waivedScopes.has(graphRefKey(scope));
}

export function validateDiscoveryRun(
  runDirInput: string,
  options: ValidateDiscoveryRunOptions = {},
): ValidateDiscoveryRunResult {
  const runDir = path.resolve(runDirInput);
  if (detectLegacyLayout(runDir)) {
    return {
      errors: [legacyLayoutMessage(runDir)],
      legacyLayoutMessage: legacyLayoutMessage(runDir),
      missingArtifacts: [],
      runDir,
      assessment: null,
      warnings: [],
    };
  }

  const paths = runPaths(runDir);
  const missingArtifacts = [paths.manifest, paths.backlog, paths.assessment, paths.journal].filter(
    (filePath) => !fs.existsSync(filePath),
  );

  if (missingArtifacts.length > 0) {
    return {
      errors: [],
      missingArtifacts,
      runDir,
      assessment: null,
      warnings: [],
    };
  }

  const manifest = loadJson<Manifest>(paths.manifest);
  const backlog = loadJson<BacklogFile>(paths.backlog);
  const previousAssessment = loadJson<AssessmentFile>(paths.assessment);
  const journalEvents = loadNdjson<Record<string, unknown>>(paths.journal);
  const errors: string[] = [];
  const warnings: string[] = [];
  const hardFails: string[] = [];
  const lintFindings: string[] = [];
  const nextActions: string[] = [];
  const backlogRecord = backlog as unknown as Record<string, unknown>;
  const previousValidatedSnapshotRecord = asStringRecord(
    [...journalEvents]
      .reverse()
      .find(
        (event) =>
          event.event === 'run_validated' &&
          event.status === 'pass' &&
          event.issue_resolution_snapshot !== undefined,
      )?.issue_resolution_snapshot,
  );
  const previousGapResolutionById = new Map(
    readIssueResolutionSnapshotEntries(previousValidatedSnapshotRecord.gaps).map((entry) => [
      entry.issue_id,
      entry,
    ]),
  );
  const previousUnknownResolutionById = new Map(
    readIssueResolutionSnapshotEntries(previousValidatedSnapshotRecord.unknowns).map((entry) => [
      entry.issue_id,
      entry,
    ]),
  );

  if (manifest.schema_version !== SCHEMA_VERSION) {
    pushIssue(errors, unsupportedSchemaMessage('manifest.json'), hardFails, true);
  }
  if (!PHASE_STATES.includes(manifest.phase_state)) {
    pushIssue(errors, 'Invalid phase_state in manifest.json', hardFails, true);
  }
  if (backlog.metadata?.schema_version !== SCHEMA_VERSION) {
    pushIssue(errors, unsupportedSchemaMessage('backlog.json'), hardFails, true);
  }
  if (previousAssessment.schema_version !== SCHEMA_VERSION) {
    pushIssue(errors, unsupportedSchemaMessage('assessment.json'), hardFails, true);
  }
  if (backlog.metadata?.run_id !== manifest.run_id) {
    pushIssue(errors, 'manifest.json and backlog.json run_id values do not match', hardFails, true);
  }
  if (
    typeof manifest.baseline_source_hashes !== 'object' ||
    manifest.baseline_source_hashes === null
  ) {
    pushIssue(errors, 'manifest.json baseline_source_hashes must be an object', hardFails, true);
  }
  if (
    typeof manifest.current_source_hashes !== 'object' ||
    manifest.current_source_hashes === null
  ) {
    pushIssue(errors, 'manifest.json current_source_hashes must be an object', hardFails, true);
  }
  if (
    typeof manifest.baseline_canonical_hashes !== 'object' ||
    manifest.baseline_canonical_hashes === null
  ) {
    pushIssue(errors, 'manifest.json baseline_canonical_hashes must be an object', hardFails, true);
  }
  if (
    typeof manifest.current_canonical_hashes !== 'object' ||
    manifest.current_canonical_hashes === null
  ) {
    pushIssue(errors, 'manifest.json current_canonical_hashes must be an object', hardFails, true);
  }

  for (const requiredArrayLedger of [
    'source_authority',
    'source_exclusions',
    'value_streams',
    'tracks',
    'track_gates',
    'track_journeys',
    'claims',
    'negative_scope',
    'quality_attributes',
    'policy_decisions',
    'contracts',
    'data_domains',
    'gaps',
    'contradictions',
    'unknowns',
    'uncertainty_to_spike',
    'delivered_lineage_notes',
    'items',
    'relations',
    'proofs',
    'track_proofs',
    'reviews',
    'waivers',
    'roadmap_matrix',
  ]) {
    if (!Array.isArray(backlogRecord[requiredArrayLedger])) {
      pushIssue(errors, `backlog.json.${requiredArrayLedger} must be an array`, hardFails, true);
    }
  }
  for (const requiredObjectLedger of [
    'glossary',
    'aliases',
    'id_strategy',
    'target_system',
    'as_built',
  ]) {
    if (
      typeof backlogRecord[requiredObjectLedger] !== 'object' ||
      backlogRecord[requiredObjectLedger] === null
    ) {
      pushIssue(errors, `backlog.json.${requiredObjectLedger} must be an object`, hardFails, true);
    }
  }

  const driftState = computeDriftState(manifest, backlog);
  const hasBaselineIssueItemLinksSnapshot =
    typeof manifest.baseline_issue_item_links === 'object' &&
    manifest.baseline_issue_item_links !== null &&
    !Array.isArray(manifest.baseline_issue_item_links);

  if (backlog.source_authority.length === 0) {
    pushIssue(
      errors,
      'No authoritative sources recorded in backlog.json.source_authority',
      hardFails,
      true,
    );
  }
  if (!hasOwnEntries(backlog.glossary)) {
    pushIssue(errors, 'Glossary must be non-empty', hardFails, true);
  } else {
    validateNonEmptyStringRecord(backlog.glossary, 'glossary', errors, hardFails);
  }
  if (!hasOwnEntries(backlog.aliases)) {
    pushIssue(errors, 'Aliases must be non-empty', hardFails, true);
  } else {
    validateAliasRecord(backlog.aliases, 'aliases', errors, hardFails);
  }
  if (!hasOwnEntries(backlog.id_strategy)) {
    pushIssue(errors, 'ID strategy must be non-empty', hardFails, true);
  } else {
    validateNonEmptyStringRecord(backlog.id_strategy, 'id_strategy', errors, hardFails);
  }

  const requiredIdStrategyKeys = new Set<string>();
  if (backlog.source_authority.length > 0 || backlog.source_exclusions.length > 0) {
    requiredIdStrategyKeys.add('source');
  }
  const idStrategyByLedger: Array<[keyof BacklogFile, string]> = [
    ['claims', 'claim'],
    ['negative_scope', 'negative_scope'],
    ['quality_attributes', 'quality_attribute'],
    ['policy_decisions', 'policy_decision'],
    ['contracts', 'contract'],
    ['data_domains', 'data_domain'],
    ['gaps', 'gap'],
    ['contradictions', 'contradiction'],
    ['unknowns', 'unknown'],
    ['items', 'item'],
    ['proofs', 'proof'],
    ['reviews', 'review'],
    ['tracks', 'track'],
    ['value_streams', 'value_stream'],
    ['track_journeys', 'journey'],
    ['track_gates', 'track_gate'],
    ['track_proofs', 'track_proof'],
    ['waivers', 'waiver'],
  ];
  for (const [ledgerName, idStrategyKey] of idStrategyByLedger) {
    const ledger = backlog[ledgerName];
    if (Array.isArray(ledger) && ledger.length > 0) {
      requiredIdStrategyKeys.add(idStrategyKey);
    }
  }
  for (const requiredKey of requiredIdStrategyKeys) {
    if (!isNonEmptyString(backlog.id_strategy[requiredKey])) {
      pushIssue(
        errors,
        `id_strategy must define ${requiredKey} for the ledger classes used by this run`,
        hardFails,
        true,
      );
    }
  }

  const targetSystemRecord = asStringRecord(backlog.target_system);
  for (const field of [
    'actors',
    'operator_personas',
    'external_consumer_groups',
    'external_dependencies',
    'trust_boundaries',
    'durable_state_families',
    'control_surfaces',
    'failure_domains',
    'team_and_ownership_assumptions',
    'quality_goals',
    'policy_surfaces',
  ]) {
    requireNonEmptyStringArrayField(targetSystemRecord, field, 'target_system', errors, hardFails);
  }
  if (!targetSystemIsPopulated(backlog.target_system)) {
    pushIssue(
      errors,
      'Target-system reconstruction is incomplete; actors, operators, consumers, trust boundaries, ownership assumptions, quality goals, and policy surfaces must be populated',
      hardFails,
      true,
    );
  }

  const asBuiltRecord = asStringRecord(backlog.as_built);
  for (const field of [
    'deployable_surfaces',
    'services',
    'processes',
    'jobs',
    'apis',
    'event_surfaces',
    'queues',
    'state_stores',
    'deployable_units',
    'ownership_matrix',
    'environment_matrix',
    'ingress_interfaces',
    'egress_interfaces',
    'canonical_writers',
    'trust_boundary_crossings',
    'data_classes',
    'vendor_external_owners',
  ]) {
    requireNonEmptyStringArrayField(asBuiltRecord, field, 'as_built', errors, hardFails);
  }
  for (const field of [
    'synthetic_behaviors',
    'compatibility_only_behaviors',
    'missing_operational_inputs',
  ]) {
    validateStringArrayField(asBuiltRecord, field, 'as_built', errors, hardFails);
  }
  if (!Array.isArray(asBuiltRecord.dependency_classifications)) {
    pushIssue(errors, 'as_built must include dependency_classifications[]', hardFails, true);
  } else {
    const dependencyCriticalities = new Set<string>();
    const dependencyIds = new Set<string>();
    for (const dependency of asBuiltRecord.dependency_classifications) {
      const dependencyRecord = asStringRecord(dependency);
      if (!isNonEmptyString(dependencyRecord.dependency_id)) {
        pushIssue(
          errors,
          'as_built dependency classification missing dependency_id',
          hardFails,
          true,
        );
      } else {
        dependencyIds.add(String(dependencyRecord.dependency_id));
      }
      if (
        !isNonEmptyString(dependencyRecord.criticality) ||
        !DEPENDENCY_CRITICALITIES.includes(
          dependencyRecord.criticality as (typeof DEPENDENCY_CRITICALITIES)[number],
        )
      ) {
        pushIssue(
          errors,
          'as_built dependency classification has invalid criticality',
          hardFails,
          true,
        );
      } else {
        dependencyCriticalities.add(String(dependencyRecord.criticality));
      }
      if (!isNonEmptyString(dependencyRecord.owner)) {
        pushIssue(errors, 'as_built dependency classification missing owner', hardFails, true);
      }
    }
    for (const dependencyId of backlog.target_system.external_dependencies) {
      if (!dependencyIds.has(dependencyId)) {
        pushIssue(
          errors,
          `as_built dependency_classifications must cover target_system external dependency ${dependencyId}`,
          hardFails,
          true,
        );
      }
    }
    if (asBuiltRecord.dependency_classifications.length > 1 && dependencyCriticalities.size < 2) {
      pushIssue(
        errors,
        'as_built dependency_classifications must distinguish criticality across dependencies',
        hardFails,
        true,
      );
    }
  }
  if (!asBuiltIsPopulated(backlog.as_built)) {
    pushIssue(
      errors,
      'As-built reconstruction is incomplete; deployable/runtime surfaces, ownership, environments, dependency classifications, trust-boundary crossings, and vendor ownership must be populated',
      hardFails,
      true,
    );
  }
  if (backlog.claims.length === 0) {
    pushIssue(errors, 'No architecture claims recorded', hardFails, true);
  }
  if (backlog.items.length === 0) {
    pushIssue(errors, 'No backlog items recorded', hardFails, true);
  }

  const sourceIds = new Set<string>();
  const sourceById = new Map<string, BacklogFile['source_authority'][number]>();
  const authoritativePrecedenceBySourceId = new Map<string, number>();
  const authoritativeSourceIdByPrecedence = new Map<number, string>();
  const supersededAuthoritySourceIds = new Set<string>();
  const protectedAuthoritativePrecedences: number[] = [];
  const declaredItemIds = new Set(
    backlog.items
      .filter((item): item is BacklogFile['items'][number] & { item_id: string } =>
        isNonEmptyString(item.item_id),
      )
      .map((item) => item.item_id),
  );
  const declaredItemClassById = new Map(
    backlog.items
      .filter(
        (
          item,
        ): item is BacklogFile['items'][number] & {
          item_id: string;
          item_class: NonNullable<DiscoveryItem['item_class']>;
        } =>
          isNonEmptyString(item.item_id) &&
          isNonEmptyString(item.item_class) &&
          ITEM_CLASSES.includes(item.item_class),
      )
      .map((item) => [item.item_id, item.item_class]),
  );
  const sourceIdentityByKey = new Map<string, string>();
  for (const source of backlog.source_authority) {
    if (!isNonEmptyString(source.source_id)) {
      pushIssue(errors, 'Source authority entry missing source_id', hardFails, true);
      continue;
    }
    if (sourceIds.has(source.source_id)) {
      pushIssue(errors, `Duplicate source_id: ${source.source_id}`, hardFails, true);
    }
    sourceIds.add(source.source_id);
    sourceById.set(source.source_id, source);
    const identityKey = sourceAuthorityIdentityKey(source);
    if (identityKey !== null) {
      const existingSourceId = sourceIdentityByKey.get(identityKey);
      if (existingSourceId && existingSourceId !== source.source_id) {
        pushIssue(
          errors,
          `Source ${source.source_id} duplicates source_authority identity ${source.ref} (${source.kind}, ${source.authority}); reuse source_id ${existingSourceId}`,
          hardFails,
          true,
        );
      } else {
        sourceIdentityByKey.set(identityKey, source.source_id);
      }
    }
    if (!isNonEmptyString(source.ref)) {
      pushIssue(errors, `Source ${source.source_id} is missing ref`, hardFails, true);
    }
    if (source.last_access_status === 'inaccessible') {
      pushIssue(
        errors,
        `Source ${source.source_id} is not readable from ref ${source.ref ?? '<missing-ref>'}`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(source.kind) || !SOURCE_KINDS.includes(source.kind)) {
      pushIssue(errors, `Source ${source.source_id} has invalid kind`, hardFails, true);
    }
    if (!isNonEmptyString(source.authority) || !SOURCE_AUTHORITIES.includes(source.authority)) {
      pushIssue(errors, `Source ${source.source_id} has invalid authority`, hardFails, true);
    }
    const requiresPrecedence =
      source.authority === 'authoritative_target_truth' ||
      source.authority === 'authoritative_current_truth';
    if (requiresPrecedence) {
      if (!Number.isInteger(source.precedence) || Number(source.precedence) <= 0) {
        pushIssue(
          errors,
          `Source ${source.source_id} must include a positive integer precedence`,
          hardFails,
          true,
        );
      } else {
        const precedence = Number(source.precedence);
        authoritativePrecedenceBySourceId.set(source.source_id, precedence);
        if (authoritativeSourceIdByPrecedence.has(precedence)) {
          pushIssue(
            errors,
            `Duplicate authoritative source precedence ${precedence}: ${authoritativeSourceIdByPrecedence.get(precedence)} and ${source.source_id}`,
            hardFails,
            true,
          );
        } else {
          authoritativeSourceIdByPrecedence.set(precedence, source.source_id);
        }
        if (
          source.kind === 'architecture_doc' ||
          source.kind === 'adr' ||
          source.kind === 'delivered_dossier_ssot' ||
          source.kind === 'runtime_evidence'
        ) {
          protectedAuthoritativePrecedences.push(precedence);
        }
      }
    }
    if (source.authority === 'superseded_excluded') {
      supersededAuthoritySourceIds.add(source.source_id);
    }
    if (
      source.kind === 'backlog_text' &&
      (source.authority === 'authoritative_target_truth' ||
        source.authority === 'authoritative_current_truth')
    ) {
      pushIssue(
        errors,
        `Source ${source.source_id} uses backlog_text but is marked authoritative`,
        hardFails,
        true,
      );
    }
  }

  const sortedAuthoritativePrecedences = [...authoritativeSourceIdByPrecedence.keys()].sort(
    (left, right) => left - right,
  );
  for (let index = 1; index < sortedAuthoritativePrecedences.length; index += 1) {
    const previous = sortedAuthoritativePrecedences[index - 1];
    const current = sortedAuthoritativePrecedences[index];
    if (current !== undefined && previous !== undefined && current - previous > 1) {
      const missingPrecedences: number[] = [];
      for (let candidate = previous + 1; candidate < current; candidate += 1) {
        missingPrecedences.push(candidate);
      }
      pushIssue(
        errors,
        `Authoritative source precedence has gaps: missing ${missingPrecedences.join(', ')}`,
        hardFails,
        true,
      );
    }
  }
  const strongestProtectedPrecedence =
    protectedAuthoritativePrecedences.length > 0
      ? Math.min(...protectedAuthoritativePrecedences)
      : null;
  if (strongestProtectedPrecedence !== null) {
    for (const source of backlog.source_authority) {
      if (
        source.kind === 'backlog_text' &&
        Number.isInteger(source.precedence) &&
        Number(source.precedence) <= strongestProtectedPrecedence
      ) {
        pushIssue(
          errors,
          `Source ${source.source_id} uses backlog_text with precedence ${source.precedence}, which outranks or ties protected architectural truth`,
          hardFails,
          true,
        );
      }
    }
  }

  const excludedSourceIds = new Set<string>();
  for (const exclusion of backlog.source_exclusions) {
    if (!isNonEmptyString(exclusion.source_id)) {
      pushIssue(errors, 'Source exclusion entry missing source_id', hardFails, true);
      continue;
    }
    if (excludedSourceIds.has(exclusion.source_id)) {
      pushIssue(
        errors,
        `Duplicate source exclusion source_id: ${exclusion.source_id}`,
        hardFails,
        true,
      );
    }
    excludedSourceIds.add(exclusion.source_id);
    if (!isNonEmptyString(exclusion.reason)) {
      pushIssue(
        errors,
        `Source exclusion ${exclusion.source_id} is missing reason`,
        hardFails,
        true,
      );
    }
    const matchingSourceAuthority = sourceById.get(exclusion.source_id);
    if (!matchingSourceAuthority) {
      pushIssue(
        errors,
        `Source exclusion ${exclusion.source_id} has no matching source_authority entry`,
        hardFails,
        true,
      );
    }
    if (matchingSourceAuthority && matchingSourceAuthority.authority !== 'superseded_excluded') {
      pushIssue(
        errors,
        `Source exclusion ${exclusion.source_id} conflicts with source_authority entry that is not superseded_excluded`,
        hardFails,
        true,
      );
    }
    const supersededBy = asArray(exclusion.superseded_by);
    if (supersededBy.length === 0) {
      pushIssue(
        errors,
        `Source exclusion ${exclusion.source_id} must include superseded_by[]`,
        hardFails,
        true,
      );
    }
    for (const supersedingSourceId of supersededBy) {
      if (!sourceIds.has(supersedingSourceId)) {
        pushIssue(
          errors,
          `Source exclusion ${exclusion.source_id} references unknown superseding source ${supersedingSourceId}`,
          hardFails,
          true,
        );
      }
      if (supersedingSourceId === exclusion.source_id) {
        pushIssue(
          errors,
          `Source exclusion ${exclusion.source_id} cannot supersede itself`,
          hardFails,
          true,
        );
      }
    }
  }
  for (const sourceId of supersededAuthoritySourceIds) {
    if (!excludedSourceIds.has(sourceId)) {
      pushIssue(
        errors,
        `Source ${sourceId} is marked superseded_excluded but has no matching source_exclusions entry`,
        hardFails,
        true,
      );
    }
  }

  const valueStreamIds = new Set<string>();
  for (const valueStream of backlog.value_streams) {
    if (!isNonEmptyString(valueStream.value_stream_id)) {
      pushIssue(errors, 'Value stream missing value_stream_id', hardFails, true);
      continue;
    }
    if (valueStreamIds.has(valueStream.value_stream_id)) {
      pushIssue(
        errors,
        `Duplicate value_stream_id: ${valueStream.value_stream_id}`,
        hardFails,
        true,
      );
    }
    valueStreamIds.add(valueStream.value_stream_id);
    if (!isNonEmptyString(valueStream.title)) {
      pushIssue(
        errors,
        `Value stream ${valueStream.value_stream_id} missing title`,
        hardFails,
        true,
      );
    }
  }

  const trackIds = new Set<string>();
  for (const track of backlog.tracks) {
    if (!isNonEmptyString(track.track_id)) {
      pushIssue(errors, 'Track missing track_id', hardFails, true);
      continue;
    }
    if (trackIds.has(track.track_id)) {
      pushIssue(errors, `Duplicate track_id: ${track.track_id}`, hardFails, true);
    }
    trackIds.add(track.track_id);
    if (!isNonEmptyString(track.title)) {
      pushIssue(errors, `Track ${track.track_id} missing title`, hardFails, true);
    }
    if (!isNonEmptyString(track.description)) {
      pushIssue(errors, `Track ${track.track_id} missing description`, hardFails, true);
    }
    if (!isNonEmptyString(track.closure_goal)) {
      pushIssue(errors, `Track ${track.track_id} missing closure_goal`, hardFails, true);
    }
    if (
      !isNonEmptyString(track.backlog_protocol_state) ||
      !BACKLOG_PROTOCOL_STATES.includes(track.backlog_protocol_state)
    ) {
      pushIssue(
        errors,
        `Track ${track.track_id} has invalid backlog_protocol_state`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(track.delivery_state) ||
      !DELIVERY_STATES.includes(track.delivery_state)
    ) {
      pushIssue(errors, `Track ${track.track_id} has invalid delivery_state`, hardFails, true);
    }
    if (
      !isNonEmptyString(track.readiness_state) ||
      !READINESS_STATES.includes(track.readiness_state)
    ) {
      pushIssue(errors, `Track ${track.track_id} has invalid readiness_state`, hardFails, true);
    }
    if (
      !isNonEmptyString(track.closure_state) ||
      !ITEM_CLOSURE_STATES.includes(track.closure_state)
    ) {
      pushIssue(errors, `Track ${track.track_id} has invalid closure_state`, hardFails, true);
    }
    if (!isNonEmptyString(track.summary_label) || !SUMMARY_LABELS.includes(track.summary_label)) {
      pushIssue(errors, `Track ${track.track_id} has invalid summary_label`, hardFails, true);
    }
    if (!Array.isArray(track.first_shippable_journey_ids)) {
      pushIssue(
        errors,
        `Track ${track.track_id} must include first_shippable_journey_ids[]`,
        hardFails,
        true,
      );
    }
    if (!Array.isArray(track.required_track_gate_ids)) {
      pushIssue(
        errors,
        `Track ${track.track_id} must include required_track_gate_ids[]`,
        hardFails,
        true,
      );
    }
    if (!Array.isArray(track.track_proof_refs)) {
      pushIssue(errors, `Track ${track.track_id} must include track_proof_refs[]`, hardFails, true);
    }
    if (REQUIRED_TRACK_IDS.has(track.track_id)) {
      if (asArray(track.first_shippable_journey_ids).length === 0) {
        pushIssue(
          errors,
          `Required track ${track.track_id} must link at least one first_shippable_journey_id`,
          hardFails,
          true,
        );
      }
      if (asArray(track.required_track_gate_ids).length === 0) {
        pushIssue(
          errors,
          `Required track ${track.track_id} must link at least one required_track_gate_id`,
          hardFails,
          true,
        );
      }
      if (asArray(track.track_proof_refs).length === 0) {
        pushIssue(
          errors,
          `Required track ${track.track_id} must link at least one track_proof_ref`,
          hardFails,
          true,
        );
      }
    }
  }
  for (const trackId of REQUIRED_TRACK_IDS) {
    if (!trackIds.has(trackId)) {
      pushIssue(errors, `Required closure track missing: ${trackId}`, hardFails, true);
    }
  }

  if (backlog.track_journeys.length > 0 && backlog.value_streams.length === 0) {
    pushIssue(
      errors,
      'At least one value stream must exist when track_journeys are present',
      hardFails,
      true,
    );
  }

  const linkedTrackIdsByValueStreamId = new Map<string, string[]>();
  for (const valueStream of backlog.value_streams) {
    if (!isNonEmptyString(valueStream.value_stream_id)) {
      continue;
    }
    const valueStreamLabel = `Value stream ${valueStream.value_stream_id}`;
    if (!isNonEmptyString(valueStream.description)) {
      pushIssue(errors, `${valueStreamLabel} missing description`, hardFails, true);
    }
    requireNonEmptyStringArrayField(
      asStringRecord(valueStream),
      'primary_personas',
      valueStreamLabel,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(valueStream),
      'initiating_triggers',
      valueStreamLabel,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(valueStream),
      'workflow_steps',
      valueStreamLabel,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(valueStream),
      'success_conditions',
      valueStreamLabel,
      errors,
      hardFails,
    );
    const linkedTrackIds = requireNonEmptyStringArrayField(
      asStringRecord(valueStream),
      'linked_track_ids',
      valueStreamLabel,
      errors,
      hardFails,
    );
    if (!isNonEmptyString(valueStream.support_handoff)) {
      pushIssue(errors, `${valueStreamLabel} missing support_handoff`, hardFails, true);
    }
    linkedTrackIdsByValueStreamId.set(valueStream.value_stream_id, linkedTrackIds);
    for (const linkedTrackId of linkedTrackIds) {
      if (!trackIds.has(linkedTrackId)) {
        pushIssue(
          errors,
          `${valueStreamLabel} references unknown linked track ${linkedTrackId}`,
          hardFails,
          true,
        );
      }
    }
  }

  for (const track of backlog.tracks) {
    if (!isNonEmptyString(track.track_id)) {
      continue;
    }
    const linkedToValueStream = backlog.value_streams.some((valueStream) =>
      asArray(valueStream.linked_track_ids).includes(track.track_id),
    );
    if (asArray(track.first_shippable_journey_ids).length > 0 && !linkedToValueStream) {
      pushIssue(
        errors,
        `Track ${track.track_id} does not map to any value stream`,
        hardFails,
        true,
      );
    }
  }

  const journeyIds = new Set<string>();
  for (const journey of backlog.track_journeys) {
    if (!isNonEmptyString(journey.journey_id)) {
      pushIssue(errors, 'Track journey missing journey_id', hardFails, true);
      continue;
    }
    if (journeyIds.has(journey.journey_id)) {
      pushIssue(errors, `Duplicate journey_id: ${journey.journey_id}`, hardFails, true);
    }
    journeyIds.add(journey.journey_id);
    if (!isNonEmptyString(journey.track_id) || !trackIds.has(journey.track_id)) {
      pushIssue(
        errors,
        `Track journey ${journey.journey_id} has invalid track_id`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(journey.value_stream_id) ||
      !valueStreamIds.has(journey.value_stream_id)
    ) {
      pushIssue(
        errors,
        `Track journey ${journey.journey_id} has invalid value_stream_id`,
        hardFails,
        true,
      );
    }
    if (
      isNonEmptyString(journey.track_id) &&
      trackIds.has(journey.track_id) &&
      isNonEmptyString(journey.value_stream_id) &&
      valueStreamIds.has(journey.value_stream_id)
    ) {
      const linkedTrackIds = linkedTrackIdsByValueStreamId.get(journey.value_stream_id) ?? [];
      if (!linkedTrackIds.includes(journey.track_id)) {
        pushIssue(
          errors,
          `Track journey ${journey.journey_id} points to value stream ${journey.value_stream_id} but that value stream is not linked to track ${journey.track_id}`,
          hardFails,
          true,
        );
      }
    }
    if (!isNonEmptyString(journey.persona)) {
      pushIssue(errors, `Track journey ${journey.journey_id} missing persona`, hardFails, true);
    }
    if (!isNonEmptyString(journey.trigger)) {
      pushIssue(errors, `Track journey ${journey.journey_id} missing trigger`, hardFails, true);
    }
    requireNonEmptyStringArrayField(
      asStringRecord(journey),
      'workflow_steps',
      `Track journey ${journey.journey_id}`,
      errors,
      hardFails,
    );
    if (!isNonEmptyString(journey.success_condition)) {
      pushIssue(
        errors,
        `Track journey ${journey.journey_id} missing success_condition`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(journey.support_handoff)) {
      pushIssue(
        errors,
        `Track journey ${journey.journey_id} missing support_handoff`,
        hardFails,
        true,
      );
    }
  }
  for (const trackId of REQUIRED_TRACK_IDS) {
    const journeysForTrack = backlog.track_journeys.filter(
      (journey) => journey.track_id === trackId,
    );
    if (journeysForTrack.length === 0) {
      pushIssue(
        errors,
        `Required track ${trackId} must resolve to at least one track journey`,
        hardFails,
        true,
      );
    }
    const linkedValueStreams = backlog.value_streams.filter((valueStream) =>
      asArray(valueStream.linked_track_ids).includes(trackId),
    );
    if (linkedValueStreams.length === 0) {
      pushIssue(
        errors,
        `Required track ${trackId} must map to at least one value stream`,
        hardFails,
        true,
      );
    }
  }

  const trackGateIds = new Set<string>();
  const trackGateFailures: string[] = [];
  for (const gate of backlog.track_gates) {
    if (!isNonEmptyString(gate.track_gate_id)) {
      pushIssue(errors, 'Track gate missing track_gate_id', hardFails, true);
      continue;
    }
    if (trackGateIds.has(gate.track_gate_id)) {
      pushIssue(errors, `Duplicate track_gate_id: ${gate.track_gate_id}`, hardFails, true);
    }
    trackGateIds.add(gate.track_gate_id);
    if (!isNonEmptyString(gate.track_id) || !trackIds.has(gate.track_id)) {
      pushIssue(errors, `Track gate ${gate.track_gate_id} has invalid track_id`, hardFails, true);
    }
    if (!isNonEmptyString(gate.title)) {
      pushIssue(errors, `Track gate ${gate.track_gate_id} missing title`, hardFails, true);
    }
    if (!isNonEmptyString(gate.description)) {
      pushIssue(errors, `Track gate ${gate.track_gate_id} missing description`, hardFails, true);
    }
    if (!isNonEmptyString(gate.gate_type)) {
      pushIssue(errors, `Track gate ${gate.track_gate_id} missing gate_type`, hardFails, true);
    }
    if (
      !isNonEmptyString(gate.fail_mode) ||
      !['fail_open', 'fail_closed'].includes(gate.fail_mode)
    ) {
      pushIssue(errors, `Track gate ${gate.track_gate_id} has invalid fail_mode`, hardFails, true);
    }
    const ownerRefs = requireNonEmptyStringArrayField(
      asStringRecord(gate),
      'owner_refs',
      `Track gate ${gate.track_gate_id}`,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(gate),
      'required_proof_refs',
      `Track gate ${gate.track_gate_id}`,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(gate),
      'applies_to_journey_ids',
      `Track gate ${gate.track_gate_id}`,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      asStringRecord(gate),
      'recalculation_triggers',
      `Track gate ${gate.track_gate_id}`,
      errors,
      hardFails,
    );
    const governingControlRefs =
      gate.fail_mode === 'fail_closed' || gate.gate_type === 'safety'
        ? requireNonEmptyStringArrayField(
            asStringRecord(gate),
            'governing_control_item_refs',
            `Track gate ${gate.track_gate_id}`,
            errors,
            hardFails,
          )
        : validateStringArrayField(
            asStringRecord(gate),
            'governing_control_item_refs',
            `Track gate ${gate.track_gate_id}`,
            errors,
            hardFails,
          );
    for (const controlItemRef of governingControlRefs) {
      if (!declaredItemIds.has(controlItemRef)) {
        pushIssue(
          errors,
          `Track gate ${gate.track_gate_id} references unknown governing control item ${controlItemRef}`,
          hardFails,
          true,
        );
        continue;
      }
      if (declaredItemClassById.get(controlItemRef) !== 'control_guardrail') {
        pushIssue(
          errors,
          `Track gate ${gate.track_gate_id} governing control ${controlItemRef} must be a control_guardrail`,
          hardFails,
          true,
        );
      }
    }
    if (
      ownerRefs.length === 0 ||
      (gate.fail_mode === 'fail_closed' && governingControlRefs.length === 0)
    ) {
      trackGateFailures.push(gate.track_gate_id);
    }
  }

  const claimIds = new Set<string>();
  const claimById = new Map<string, BacklogFile['claims'][number]>();
  const committedClaimIds = new Set<string>();
  const controlObligationClaimIds = new Set<string>();
  const decommissionNeedClaimIds = new Set<string>();
  for (const claim of backlog.claims) {
    if (!isNonEmptyString(claim.claim_id)) {
      pushIssue(errors, 'Architecture claim missing claim_id', hardFails, true);
      continue;
    }
    if (claimIds.has(claim.claim_id)) {
      pushIssue(errors, `Duplicate claim_id: ${claim.claim_id}`, hardFails, true);
    }
    claimIds.add(claim.claim_id);
    if (!claimById.has(claim.claim_id)) {
      claimById.set(claim.claim_id, claim);
    }
    if (!isNonEmptyString(claim.claim_class) || !CLAIM_CLASSES.includes(claim.claim_class)) {
      pushIssue(errors, `Claim ${claim.claim_id} has invalid claim_class`, hardFails, true);
    }
    if (!isNonEmptyString(claim.commitment) || !CLAIM_COMMITMENTS.includes(claim.commitment)) {
      pushIssue(errors, `Claim ${claim.claim_id} has invalid commitment`, hardFails, true);
    }
    if (claim.commitment === 'committed') {
      committedClaimIds.add(claim.claim_id);
    }
    if (claim.claim_class === 'control_obligation') {
      controlObligationClaimIds.add(claim.claim_id);
    }
    if (claim.claim_class === 'retirement') {
      decommissionNeedClaimIds.add(claim.claim_id);
    }
    if (
      (claim.commitment === 'deferred' || claim.commitment === 'optional') &&
      !isNonEmptyString(claim.revisit_trigger)
    ) {
      pushIssue(
        errors,
        `Claim ${claim.claim_id} is ${claim.commitment} but missing revisit_trigger`,
        hardFails,
        true,
      );
    }
    validateSourceRefs(
      claim.source_refs,
      `Claim ${claim.claim_id}`,
      sourceIds,
      excludedSourceIds,
      errors,
      hardFails,
    );
  }

  const contractIds = new Set<string>();
  for (const contract of backlog.contracts) {
    if (!isNonEmptyString(contract.contract_id)) {
      pushIssue(errors, 'Contract ledger entry missing contract_id', hardFails, true);
      continue;
    }
    if (contractIds.has(contract.contract_id)) {
      pushIssue(errors, `Duplicate contract_id: ${contract.contract_id}`, hardFails, true);
    }
    contractIds.add(contract.contract_id);
    if (!isNonEmptyString(contract.title)) {
      pushIssue(errors, `Contract ${contract.contract_id} missing title`, hardFails, true);
    }
    if (!isNonEmptyString(contract.owner)) {
      pushIssue(errors, `Contract ${contract.contract_id} missing owner`, hardFails, true);
    }
    if (!isNonEmptyString(contract.versioning_strategy)) {
      pushIssue(
        errors,
        `Contract ${contract.contract_id} missing versioning_strategy`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(contract.reconciliation_strategy)) {
      pushIssue(
        errors,
        `Contract ${contract.contract_id} missing reconciliation_strategy`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(contract.deprecation_window)) {
      pushIssue(
        errors,
        `Contract ${contract.contract_id} missing deprecation_window`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(contract.retirement_condition)) {
      pushIssue(
        errors,
        `Contract ${contract.contract_id} missing retirement_condition`,
        hardFails,
        true,
      );
    }
  }

  const dataDomainIds = new Set<string>();
  for (const domain of backlog.data_domains) {
    if (!isNonEmptyString(domain.domain_id)) {
      pushIssue(errors, 'Data-domain entry missing domain_id', hardFails, true);
      continue;
    }
    if (dataDomainIds.has(domain.domain_id)) {
      pushIssue(errors, `Duplicate data domain id: ${domain.domain_id}`, hardFails, true);
    }
    dataDomainIds.add(domain.domain_id);
    if (!isNonEmptyString(domain.title)) {
      pushIssue(errors, `Data domain ${domain.domain_id} missing title`, hardFails, true);
    }
    if (!isNonEmptyString(domain.data_class)) {
      pushIssue(errors, `Data domain ${domain.domain_id} missing data_class`, hardFails, true);
    }
    requireNonEmptyStringArrayField(
      domain as Record<string, unknown>,
      'owners',
      `Data domain ${domain.domain_id}`,
      errors,
      hardFails,
    );
  }

  const proofIds = new Set<string>();
  const proofCoveredRefById = new Map<string, GraphRef>();
  const staleProofs = new Set<string>(driftState.deltaSummary.stale_proof_ids);
  for (const proof of backlog.proofs) {
    if (!isNonEmptyString(proof.proof_id)) {
      pushIssue(errors, 'Proof bundle missing proof_id', hardFails, true);
      continue;
    }
    if (proofIds.has(proof.proof_id)) {
      pushIssue(errors, `Duplicate proof_id: ${proof.proof_id}`, hardFails, true);
    }
    proofIds.add(proof.proof_id);

    if (!isNonEmptyString(proof.environment)) {
      pushIssue(errors, `Proof ${proof.proof_id} missing environment`, hardFails, true);
    }
    if (!isGraphRef(proof.covered_ref)) {
      pushIssue(errors, `Proof ${proof.proof_id} missing covered_ref`, hardFails, true);
    } else {
      proofCoveredRefById.set(proof.proof_id, proof.covered_ref);
    }
    if (!isNonEmptyString(proof.covered_commit_or_build)) {
      pushIssue(errors, `Proof ${proof.proof_id} missing covered_commit_or_build`, hardFails, true);
    }
    if (!isNonEmptyString(proof.executed_at) || parseTimestamp(proof.executed_at) === null) {
      pushIssue(errors, `Proof ${proof.proof_id} missing a valid executed_at`, hardFails, true);
    }
    if (!isNonEmptyString(proof.freshness_rule)) {
      pushIssue(errors, `Proof ${proof.proof_id} missing freshness_rule`, hardFails, true);
    }
    const invalidatedBy = asArray(proof.invalidated_by);
    if (invalidatedBy.length === 0) {
      pushIssue(errors, `Proof ${proof.proof_id} missing invalidated_by`, hardFails, true);
    } else {
      for (const cause of invalidatedBy) {
        if (
          !['source_change', 'contract_change', 'topology_change', 'track_gate_change'].includes(
            cause,
          )
        ) {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} has invalid invalidated_by cause ${cause}`,
            hardFails,
            true,
          );
        }
      }
    }
    if (typeof proof.dimensions !== 'object' || proof.dimensions === null) {
      pushIssue(errors, `Proof ${proof.proof_id} missing dimensions`, hardFails, true);
    } else {
      for (const dimensionKey of PROOF_DIMENSION_KEYS) {
        const dimension = asStringRecord(proof.dimensions[dimensionKey]);
        if (
          !isNonEmptyString(dimension.status) ||
          !['present', 'missing', 'not_applicable'].includes(dimension.status)
        ) {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} has invalid ${dimensionKey} status`,
            hardFails,
            true,
          );
          continue;
        }
        if (dimension.status === 'missing') {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} dimension ${dimensionKey} may not remain missing`,
            hardFails,
            true,
          );
        }
        if (
          dimension.status === 'present' &&
          !isNonEmptyString(dimension.command) &&
          !isNonEmptyString(dimension.artifact) &&
          !isNonEmptyString(dimension.procedure)
        ) {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} dimension ${dimensionKey} must include command, artifact, or procedure when present`,
            hardFails,
            true,
          );
        }
        if (dimension.status === 'not_applicable' && !isNonEmptyString(dimension.justification)) {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} dimension ${dimensionKey} must include justification when not_applicable`,
            hardFails,
            true,
          );
        }
        if (dimension.status === 'not_applicable' && dimensionKey !== 'security_trace') {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} dimension ${dimensionKey} may not be not_applicable`,
            hardFails,
            true,
          );
        }
      }
    }

    const freshUntil = parseTimestamp(proof.fresh_until ?? null);
    if (freshUntil !== null && freshUntil < Date.now()) {
      staleProofs.add(proof.proof_id);
      lintFindings.push(`Proof ${proof.proof_id} is stale.`);
      hardFails.push(`Proof ${proof.proof_id} is stale.`);
    }
  }

  const trackProofIds = new Set<string>();
  const trackProofIdToTrackId = new Map<string, string>();
  for (const trackProof of backlog.track_proofs) {
    if (!isNonEmptyString(trackProof.track_proof_id)) {
      pushIssue(errors, 'Track proof missing track_proof_id', hardFails, true);
      continue;
    }
    if (trackProofIds.has(trackProof.track_proof_id)) {
      pushIssue(errors, `Duplicate track_proof_id: ${trackProof.track_proof_id}`, hardFails, true);
    }
    const trackProofId = trackProof.track_proof_id;
    trackProofIds.add(trackProof.track_proof_id);
    if (!isNonEmptyString(trackProof.track_id) || !trackIds.has(trackProof.track_id)) {
      pushIssue(
        errors,
        `Track proof ${trackProof.track_proof_id} has invalid track_id`,
        hardFails,
        true,
      );
    } else {
      trackProofIdToTrackId.set(trackProofId, trackProof.track_id);
    }
    if (!Array.isArray(trackProof.proof_refs)) {
      pushIssue(
        errors,
        `Track proof ${trackProof.track_proof_id} must include proof_refs[]`,
        hardFails,
        true,
      );
    } else if (trackProof.proof_refs.length === 0) {
      pushIssue(
        errors,
        `Track proof ${trackProof.track_proof_id} must include at least one proof_ref`,
        hardFails,
        true,
      );
    }
    if (typeof trackProof.coverage !== 'object' || trackProof.coverage === null) {
      pushIssue(
        errors,
        `Track proof ${trackProof.track_proof_id} must include coverage`,
        hardFails,
        true,
      );
    } else {
      const coverageRecord = asStringRecord(trackProof.coverage);
      for (const coverageKey of TRACK_PROOF_COVERAGE_KEYS) {
        if (typeof coverageRecord[coverageKey] !== 'boolean') {
          pushIssue(
            errors,
            `Track proof ${trackProof.track_proof_id} must include boolean coverage.${coverageKey}`,
            hardFails,
            true,
          );
        }
      }
      if (!trackProofCoverageIsSufficient(trackProof.coverage)) {
        pushIssue(
          errors,
          `Track proof ${trackProof.track_proof_id} must prove all track-level closure coverage dimensions`,
          hardFails,
          true,
        );
      }
    }
    for (const proofRef of asArray(trackProof.proof_refs)) {
      if (!proofIds.has(proofRef)) {
        pushIssue(
          errors,
          `Track proof ${trackProof.track_proof_id} references unknown proof ${proofRef}`,
          hardFails,
          true,
        );
      }
    }
    const hasTrackProofCoveredAtomicProof = asArray(trackProof.proof_refs).some((proofRef) =>
      relationRefEquals(
        proofCoveredRefById.get(proofRef) ?? null,
        graphRef('track_proof', trackProofId),
      ),
    );
    if (!hasTrackProofCoveredAtomicProof) {
      pushIssue(
        errors,
        `Track proof ${trackProofId} must be backed by at least one proof whose covered_ref points to the track_proof`,
        hardFails,
        true,
      );
    }
  }

  for (const track of backlog.tracks) {
    for (const journeyId of asArray(track.first_shippable_journey_ids)) {
      if (!journeyIds.has(journeyId)) {
        pushIssue(
          errors,
          `Track ${track.track_id} references unknown journey ${journeyId}`,
          hardFails,
          true,
        );
      }
    }
    for (const trackGateId of asArray(track.required_track_gate_ids)) {
      if (!trackGateIds.has(trackGateId)) {
        pushIssue(
          errors,
          `Track ${track.track_id} references unknown track gate ${trackGateId}`,
          hardFails,
          true,
        );
      }
    }
    for (const trackProofRef of asArray(track.track_proof_refs)) {
      if (!trackProofIds.has(trackProofRef)) {
        pushIssue(
          errors,
          `Track ${track.track_id} references unknown track proof ${trackProofRef}`,
          hardFails,
          true,
        );
      }
    }
    if (REQUIRED_TRACK_IDS.has(track.track_id)) {
      for (const trackGateId of asArray(track.required_track_gate_ids)) {
        const gate = backlog.track_gates.find(
          (candidate) => candidate.track_gate_id === trackGateId,
        );
        if (!gate || gate.track_id !== track.track_id) {
          pushIssue(
            errors,
            `Required track ${track.track_id} must resolve track gate ${trackGateId} to the same track`,
            hardFails,
            true,
          );
        }
      }
      for (const trackProofRef of asArray(track.track_proof_refs)) {
        const trackProof = backlog.track_proofs.find(
          (candidate) => candidate.track_proof_id === trackProofRef,
        );
        if (!trackProof || trackProof.track_id !== track.track_id) {
          pushIssue(
            errors,
            `Required track ${track.track_id} must resolve track proof ${trackProofRef} to the same track`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  for (const gate of backlog.track_gates) {
    if (!isNonEmptyString(gate.track_gate_id)) {
      continue;
    }

    for (const journeyId of asArray(gate.applies_to_journey_ids)) {
      if (!journeyIds.has(journeyId)) {
        pushIssue(
          errors,
          `Track gate ${gate.track_gate_id} references unknown journey ${journeyId}`,
          hardFails,
          true,
        );
      }
    }
    for (const proofRef of asArray(gate.required_proof_refs)) {
      if (!proofIds.has(proofRef)) {
        pushIssue(
          errors,
          `Track gate ${gate.track_gate_id} references unknown proof ${proofRef}`,
          hardFails,
          true,
        );
        if (gate.fail_mode === 'fail_closed') {
          trackGateFailures.push(gate.track_gate_id);
        }
        continue;
      }
      if (staleProofs.has(proofRef) && gate.fail_mode === 'fail_closed') {
        const message = `Track gate ${gate.track_gate_id} is fail_closed but proof ${proofRef} is stale`;
        pushIssue(errors, message, hardFails, true);
        trackGateFailures.push(gate.track_gate_id);
      }
    }
    if (driftState.deltaSummary.track_gate_ids_to_recalculate.includes(gate.track_gate_id)) {
      const message = `Track gate ${gate.track_gate_id} requires recalculation due to detected drift`;
      if (gate.fail_mode === 'fail_closed') {
        pushIssue(errors, message, hardFails, true);
        trackGateFailures.push(gate.track_gate_id);
      } else {
        warnings.push(message);
      }
    }
  }

  const reviewIds = new Set<string>();
  const reviewFindingIds = new Set<string>();
  const eligibleReviews: BacklogFile['reviews'][number][] = [];
  for (const review of backlog.reviews) {
    if (!isNonEmptyString(review.review_id)) {
      pushIssue(errors, 'Review artifact missing review_id', hardFails, true);
      continue;
    }
    if (reviewIds.has(review.review_id)) {
      pushIssue(errors, `Duplicate review_id: ${review.review_id}`, hardFails, true);
    }
    reviewIds.add(review.review_id);

    if (!isNonEmptyString(review.review_scope) || !REVIEW_SCOPES.includes(review.review_scope)) {
      pushIssue(errors, `Review ${review.review_id} has invalid review_scope`, hardFails, true);
    }
    if (!isGraphRef(review.reviewed_ref)) {
      pushIssue(errors, `Review ${review.review_id} missing reviewed_ref`, hardFails, true);
    }
    if (!isNonEmptyString(review.reviewer)) {
      pushIssue(errors, `Review ${review.review_id} missing reviewer`, hardFails, true);
    }
    if (!isNonEmptyString(review.role) || !REVIEW_ROLES.includes(review.role)) {
      pushIssue(errors, `Review ${review.review_id} has invalid role`, hardFails, true);
      continue;
    }
    if (review.independent !== true) {
      warnings.push(
        `Review ${review.review_id} for role ${review.role} is not marked independent.`,
      );
    }
    if (!isNonEmptyString(review.verdict) || !REVIEW_VERDICTS.includes(review.verdict)) {
      pushIssue(errors, `Review ${review.review_id} has invalid verdict`, hardFails, true);
      continue;
    }
    if (!Array.isArray(review.evidence_refs) || review.evidence_refs.length === 0) {
      pushIssue(errors, `Review ${review.review_id} missing evidence_refs`, hardFails, true);
    }
    if (
      typeof review.score_contribution !== 'number' ||
      !Number.isFinite(review.score_contribution)
    ) {
      pushIssue(
        errors,
        `Review ${review.review_id} missing numeric score_contribution`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(review.reviewed_at) || parseTimestamp(review.reviewed_at) === null) {
      pushIssue(errors, `Review ${review.review_id} missing valid reviewed_at`, hardFails, true);
      continue;
    }
    for (const collectionName of ['findings', 'hard_fail_report'] as const) {
      validateFindingCollection(
        review.review_id,
        review[collectionName],
        collectionName,
        errors,
        hardFails,
        reviewFindingIds,
      );
    }
    if (review.verdict === 'fail' && asArray(review.hard_fail_report).length === 0) {
      pushIssue(
        errors,
        `Review ${review.review_id} with verdict=fail must include hard_fail_report findings`,
        hardFails,
        true,
      );
    }
    if (review.review_scope === 'item' && review.reviewed_ref?.kind !== 'item') {
      pushIssue(
        errors,
        `Review ${review.review_id} must reference an item when review_scope=item`,
        hardFails,
        true,
      );
      continue;
    }
    if (review.review_scope === 'run' && review.reviewed_ref?.kind !== 'run') {
      pushIssue(
        errors,
        `Review ${review.review_id} must reference the run when review_scope=run`,
        hardFails,
        true,
      );
      continue;
    }
    if (review.review_scope === 'track_proof' && review.reviewed_ref?.kind !== 'track_proof') {
      pushIssue(
        errors,
        `Review ${review.review_id} must reference a track_proof when review_scope=track_proof`,
        hardFails,
        true,
      );
      continue;
    }
    eligibleReviews.push(review);
  }

  const waiverFindings: string[] = [];
  const waiverIds = new Set<string>();
  const invalidWaiverIds = new Set<string>();
  const invalidWaivedScopeKeysByRole = new Map<ReviewRole, Set<string>>();
  for (const waiver of backlog.waivers) {
    if (!isNonEmptyString(waiver.waiver_id)) {
      pushIssue(errors, 'Waiver entry missing waiver_id', hardFails, true);
      waiverFindings.push('Waiver entry missing waiver_id');
      continue;
    }
    if (waiverIds.has(waiver.waiver_id)) {
      const message = `Duplicate waiver_id: ${waiver.waiver_id}`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    waiverIds.add(waiver.waiver_id);
    if (!isNonEmptyString(waiver.waived_role) || !REVIEW_ROLES.includes(waiver.waived_role)) {
      const message = `Waiver ${waiver.waiver_id} has invalid waived_role`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    if (!isGraphRef(waiver.scope)) {
      const message = `Waiver ${waiver.waiver_id} missing scope`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    if (!isNonEmptyString(waiver.granting_authority)) {
      const message = `Waiver ${waiver.waiver_id} missing granting_authority`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    if (!isNonEmptyString(waiver.rationale)) {
      const message = `Waiver ${waiver.waiver_id} missing rationale`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    if (!isNonEmptyString(waiver.expiry_or_revisit_trigger)) {
      const message = `Waiver ${waiver.waiver_id} missing expiry_or_revisit_trigger`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
    validateStringArrayField(
      waiver as Record<string, unknown>,
      'impacted_surfaces',
      `Waiver ${waiver.waiver_id}`,
      errors,
      hardFails,
    );
    const waiverScope = isGraphRef(waiver.scope) ? waiver.scope : null;
    if (
      waiverScope &&
      waiverScope.kind !== 'run' &&
      waiverScope.kind !== 'item' &&
      waiverScope.kind !== 'track_proof'
    ) {
      const message = `Waiver ${waiver.waiver_id} has unsupported scope kind ${waiverScope.kind}`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
    }
  }

  const unknownEntryById = new Map<string, BacklogFile['unknowns'][number]>();
  for (const entry of backlog.unknowns) {
    if (isNonEmptyString(entry.issue_id) && !unknownEntryById.has(entry.issue_id)) {
      unknownEntryById.set(entry.issue_id, entry);
    }
  }

  const itemIds = new Set<string>();
  const itemsById = new Map<string, DiscoveryItem>();
  const mappedClaimRefs = new Set<string>();
  const itemOriginRefs = new Map<string, BacklogFile['items'][number]['origin_ref']>();
  const missingOwners: string[] = [];
  const itemsMissingDeliveryEvidence: string[] = [];
  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id)) {
      pushIssue(errors, 'Item missing item_id', hardFails, true);
      continue;
    }
    if (itemIds.has(item.item_id)) {
      pushIssue(errors, `Duplicate item_id: ${item.item_id}`, hardFails, true);
    }
    itemIds.add(item.item_id);
    itemsById.set(item.item_id, item);

    if (!isNonEmptyString(item.item_class) || !ITEM_CLASSES.includes(item.item_class)) {
      pushIssue(errors, `Item ${item.item_id} has invalid item_class`, hardFails, true);
      continue;
    }
    if (!isNonEmptyString(item.track_id) || !trackIds.has(item.track_id)) {
      pushIssue(errors, `Item ${item.item_id} has invalid track_id`, hardFails, true);
    }
    if (
      !isNonEmptyString(item.backlog_protocol_state) ||
      !BACKLOG_PROTOCOL_STATES.includes(item.backlog_protocol_state)
    ) {
      pushIssue(errors, `Item ${item.item_id} has invalid backlog_protocol_state`, hardFails, true);
    }
    if (!isNonEmptyString(item.delivery_state) || !DELIVERY_STATES.includes(item.delivery_state)) {
      pushIssue(errors, `Item ${item.item_id} has invalid delivery_state`, hardFails, true);
    } else if (
      item.delivery_state === 'delivered' ||
      item.delivery_state === 'partially_delivered'
    ) {
      const deliveryEvidenceSourceIds = collectItemDeliveryEvidenceSourceIds(
        item,
        sourceById,
        excludedSourceIds,
      );
      if (deliveryEvidenceSourceIds.length === 0) {
        pushIssue(
          errors,
          `Item ${item.item_id} sets delivery_state=${item.delivery_state} without authoritative current-truth evidence`,
          hardFails,
          true,
        );
        itemsMissingDeliveryEvidence.push(item.item_id);
      }
    }
    if (
      !isNonEmptyString(item.readiness_state) ||
      !READINESS_STATES.includes(item.readiness_state)
    ) {
      pushIssue(errors, `Item ${item.item_id} has invalid readiness_state`, hardFails, true);
    }
    if (
      !isNonEmptyString(item.closure_state) ||
      !ITEM_CLOSURE_STATES.includes(item.closure_state)
    ) {
      pushIssue(errors, `Item ${item.item_id} has invalid closure_state`, hardFails, true);
    }
    if (!isNonEmptyString(item.summary_label) || !SUMMARY_LABELS.includes(item.summary_label)) {
      pushIssue(errors, `Item ${item.item_id} has invalid summary_label`, hardFails, true);
    }
    if (
      item.rollout_mode !== undefined ||
      item.rollback_class !== undefined ||
      isNonEmptyString(item.n_a_justification)
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} uses obsolete pre-GA N/A fields; use rollout/recovery applicability plus explicit justification`,
        hardFails,
        true,
      );
    }

    const originRefs = asArray(item.origin_ref);
    itemOriginRefs.set(item.item_id, originRefs);
    if (originRefs.length === 0) {
      pushIssue(errors, `Item ${item.item_id} has no origin_ref`, hardFails, true);
    } else {
      for (const origin of originRefs) {
        if (!isNonEmptyString(origin.kind) || !ORIGIN_REF_KINDS.includes(origin.kind)) {
          pushIssue(errors, `Item ${item.item_id} has invalid origin_ref kind`, hardFails, true);
          continue;
        }
        if (!isNonEmptyString(origin.ref)) {
          pushIssue(errors, `Item ${item.item_id} has origin_ref without ref`, hardFails, true);
          continue;
        }
      }
    }

    if (
      !item.owners ||
      !isNonEmptyString(item.owners.decision_owner) ||
      !isNonEmptyString(item.owners.delivery_owner)
    ) {
      const message = `Item ${item.item_id} is missing required owners`;
      pushIssue(errors, message, hardFails, true);
      missingOwners.push(item.item_id);
    }

    if (!Array.isArray(item.dependency_refs) && !Array.isArray(item.dependencies)) {
      pushIssue(errors, `Item ${item.item_id} must include dependency_refs[]`, hardFails, true);
    }
    if (!Array.isArray(item.proof_refs) || item.proof_refs.length === 0) {
      pushIssue(
        errors,
        `Item ${item.item_id} must include non-empty proof_refs[]`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(item.evidence_freshness_sla)) {
      pushIssue(errors, `Item ${item.item_id} missing evidence_freshness_sla`, hardFails, true);
    }

    const adrRefs = Array.isArray(item.adr_refs) ? item.adr_refs : [];
    if (item.adr_refs !== undefined) {
      if (item.adr_refs.length === 0 || item.adr_refs.some((adrRef) => !isNonEmptyString(adrRef))) {
        pushIssue(errors, `Item ${item.item_id} has invalid adr_refs`, hardFails, true);
      }
      if (new Set(adrRefs).size !== adrRefs.length) {
        pushIssue(errors, `Item ${item.item_id} has duplicate adr_refs`, hardFails, true);
      }
    }
    if (ITEM_CLASSES_REQUIRING_ADR_REFS.has(item.item_class) && adrRefs.length === 0) {
      pushIssue(errors, `Item ${item.item_id} must declare adr_refs`, hardFails, true);
    }

    const policyDecisionRefs = Array.isArray(item.policy_decision_refs)
      ? item.policy_decision_refs
      : [];
    if (item.policy_decision_refs !== undefined) {
      if (
        item.policy_decision_refs.length === 0 ||
        item.policy_decision_refs.some((policyDecisionRef) => !isNonEmptyString(policyDecisionRef))
      ) {
        pushIssue(errors, `Item ${item.item_id} has invalid policy_decision_refs`, hardFails, true);
      }
      if (new Set(policyDecisionRefs).size !== policyDecisionRefs.length) {
        pushIssue(
          errors,
          `Item ${item.item_id} has duplicate policy_decision_refs`,
          hardFails,
          true,
        );
      }
    }

    const actorRoleSet = Array.isArray(item.actor_role_set) ? item.actor_role_set : [];
    if (item.actor_role_set !== undefined) {
      if (
        item.actor_role_set.length === 0 ||
        item.actor_role_set.some((actorRole) => !isNonEmptyString(actorRole))
      ) {
        pushIssue(errors, `Item ${item.item_id} has invalid actor_role_set`, hardFails, true);
      }
      if (new Set(actorRoleSet).size !== actorRoleSet.length) {
        pushIssue(
          errors,
          `Item ${item.item_id} has duplicate actor_role_set entries`,
          hardFails,
          true,
        );
      }
    }
    if (ITEM_CLASSES_REQUIRING_ACTOR_ROLE_SET.has(item.item_class) && actorRoleSet.length === 0) {
      pushIssue(errors, `Item ${item.item_id} must declare actor_role_set`, hardFails, true);
    }

    if (isNonEmptyString(item['n_a_justification'])) {
      pushIssue(
        errors,
        `Item ${item.item_id} uses obsolete n_a_justification; use applicability plus explicit justification instead`,
        hardFails,
        true,
      );
    }
    if (isObsoleteNaShape(item.rollout_mode)) {
      pushIssue(errors, `Item ${item.item_id} uses obsolete rollout_mode=n_a`, hardFails, true);
    }
    if (isObsoleteNaShape(item.rollback_class)) {
      pushIssue(errors, `Item ${item.item_id} uses obsolete rollback_class=n_a`, hardFails, true);
    }

    const unexpectedPayloadKeys = getUnexpectedPayloadKeys(item);
    if (unexpectedPayloadKeys.length > 0) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes semantic payload keys not allowed for ${item.item_class}: ${unexpectedPayloadKeys.join(', ')}`,
        hardFails,
        true,
      );
    }

    const allowedOriginKinds = ORIGIN_KINDS_BY_CLASS[item.item_class];
    const resolvedOriginKinds = new Set(
      originRefs
        .filter((origin) => isNonEmptyString(origin.kind) && isNonEmptyString(origin.ref))
        .map((origin) => origin.kind as string),
    );
    if (![...resolvedOriginKinds].some((originKind) => allowedOriginKinds.has(originKind))) {
      pushIssue(
        errors,
        `Item ${item.item_id} must be backed by ${[...allowedOriginKinds].join(', ')} for class ${item.item_class}`,
        hardFails,
        true,
      );
    }

    const valueRecord = getValueRecord(item);
    for (const field of ['persona_or_operator_served', 'product_or_operator_value', 'why_now']) {
      if (valueRecord[field] !== undefined && !isNonEmptyString(valueRecord[field])) {
        pushIssue(errors, `Item ${item.item_id} has invalid value.${field}`, hardFails, true);
      }
    }
    if (ITEM_CLASSES_REQUIRING_VALUE_DESCRIPTOR.has(item.item_class)) {
      for (const field of ['persona_or_operator_served', 'product_or_operator_value', 'why_now']) {
        if (!isNonEmptyString(valueRecord[field])) {
          pushIssue(errors, `Item ${item.item_id} missing value.${field}`, hardFails, true);
        }
      }
    }
    if (
      isNonEmptyString(valueRecord.persona_or_operator_served) &&
      actorRoleSet.length > 0 &&
      !actorRoleSet.includes(valueRecord.persona_or_operator_served)
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} actor_role_set must include value.persona_or_operator_served`,
        hardFails,
        true,
      );
    }

    const sliceValueKind = valueRecord.slice_value_kind;
    if (
      sliceValueKind !== undefined &&
      (!isNonEmptyString(sliceValueKind) ||
        !['user_value', 'risk_retirement', 'control_closure'].includes(String(sliceValueKind)))
    ) {
      pushIssue(errors, `Item ${item.item_id} has invalid slice_value_kind`, hardFails, true);
    }

    if (item.item_class === 'feature_slice') {
      if (!isNonEmptyString(getPlanningString(item, 'external_lead_time_risk'))) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing external_lead_time_risk`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(getPlanningString(item, 'staffing_skill_constraints'))) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing staffing_skill_constraints`,
          hardFails,
          true,
        );
      }
      if (getPlanningBoolean(item, 'blocked_by_decision_status') === null) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing blocked_by_decision_status`,
          hardFails,
          true,
        );
      }
      const dominantUncertainty = getPlanningString(item, 'dominant_uncertainty_class');
      if (
        !isNonEmptyString(dominantUncertainty) ||
        !UNCERTAINTY_CLASSES.includes(dominantUncertainty as (typeof UNCERTAINTY_CLASSES)[number])
      ) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing valid dominant_uncertainty_class`,
          hardFails,
          true,
        );
      }
      const dominantRollbackClass = getPlanningString(item, 'dominant_rollback_class');
      if (
        !isNonEmptyString(dominantRollbackClass) ||
        !ROLLBACK_CLASSES.includes(dominantRollbackClass as (typeof ROLLBACK_CLASSES)[number])
      ) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing valid dominant_rollback_class`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(getPlanningString(item, 'blast_radius_note'))) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} missing blast_radius_note`,
          hardFails,
          true,
        );
      }
      if (getPlanningBoolean(item, 'unresolved_questions_below_threshold') !== true) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} must declare unresolved_questions_below_threshold=true`,
          hardFails,
          true,
        );
      }
      if (
        !isNonEmptyString(sliceValueKind) ||
        !['user_value', 'risk_retirement', 'control_closure'].includes(String(sliceValueKind))
      ) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} must declare a valid slice_value_kind`,
          hardFails,
          true,
        );
      }
      if (hasGenericSliceTitle(item.title)) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} uses an invalid generic horizontal title`,
          hardFails,
          true,
        );
      }
      if (
        asArray(item.interfaces_touched).length === 0 &&
        asArray(item.data_domains_touched).length === 0 &&
        asArray(item.change_surfaces).length === 0
      ) {
        pushIssue(
          errors,
          `Feature slice ${item.item_id} must describe bounded contract, data, or surface impact`,
          hardFails,
          true,
        );
      }
    }

    const readinessContract = getReadinessContract(item);
    const allowedReadinessExemptions = READINESS_EXEMPTIONS_BY_CLASS[item.item_class];
    for (const exemptionKey of Object.keys(getContractExemptions(readinessContract))) {
      if (!allowedReadinessExemptions.has(exemptionKey)) {
        pushIssue(
          errors,
          `Item ${item.item_id} has invalid readiness exemption ${exemptionKey}`,
          hardFails,
          true,
        );
      }
    }
    if (item.readiness_state === 'ready') {
      for (const readinessKey of [
        'behavior_described',
        'happy_path_defined',
        'error_paths_defined',
        'acceptance_examples_defined',
        'interface_data_impact_described',
        'nfr_impact_known',
        'security_privacy_impact_known',
        'rollout_defined',
        'recovery_defined',
        'observability_contract_defined',
        'required_proof_defined',
        'docs_support_impact_described',
        'estimate_band_defined',
        'confidence_defined',
        'unresolved_questions_below_threshold',
      ]) {
        const readinessState = contractCheckSatisfied(
          readinessContract,
          readinessKey,
          allowedReadinessExemptions,
        );
        if (!readinessState.satisfied) {
          pushIssue(
            errors,
            `Ready item ${item.item_id} must satisfy readiness_contract.${readinessKey}`,
            hardFails,
            true,
          );
        }
      }
    }

    for (const dataDomainId of asArray(item.data_domains_touched)) {
      if (!dataDomainIds.has(dataDomainId)) {
        pushIssue(
          errors,
          `Item ${item.item_id} references unknown data domain ${dataDomainId}`,
          hardFails,
          true,
        );
      }
    }

    if (itemTouchesTrustBoundary(item)) {
      if (asArray(item.trust_boundaries_crossed).length === 0) {
        pushIssue(
          errors,
          `Item ${item.item_id} must declare trust_boundaries_crossed`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(item.data_class)) {
        pushIssue(
          errors,
          `Item ${item.item_id} must declare data_class for trust-boundary work`,
          hardFails,
          true,
        );
      }
      if (asArray(item.data_domains_touched).length === 0) {
        pushIssue(
          errors,
          `Item ${item.item_id} must map trust-boundary work to data_domains_touched`,
          hardFails,
          true,
        );
      }
      if (!item.owners || asArray(item.owners.consulted_teams).length === 0) {
        pushIssue(
          errors,
          `Item ${item.item_id} must declare consulted security/data ownership teams`,
          hardFails,
          true,
        );
      }
    }

    if (itemRequiresNfrContract(item)) {
      const nfrContract = getNfrContract(item);
      for (const field of [
        'latency',
        'throughput',
        'concurrency',
        'availability',
        'durability',
        'rpo',
        'rto',
        'cost_budget',
        'privacy_compliance_class',
        'accessibility_localization_duty',
        'auditability_traceability',
        'scalability_envelope',
      ]) {
        if (!isNonEmptyString(nfrContract[field])) {
          pushIssue(errors, `Item ${item.item_id} missing nfr_contract.${field}`, hardFails, true);
        }
      }
    }

    if (itemRequiresObservabilityContract(item)) {
      const observabilityContract = getObservabilityContract(item);
      for (const field of [
        'sli_slo',
        'alert_thresholds',
        'audit_requirements',
        'security_controls',
        'privacy_controls',
        'analytics_obligations',
      ]) {
        requireNonEmptyStringArrayField(
          observabilityContract,
          field,
          `Item ${item.item_id} observability_contract`,
          errors,
          hardFails,
        );
      }
      validateStringArrayField(
        observabilityContract,
        'monitoring_evidence_refs',
        `Item ${item.item_id} observability_contract`,
        errors,
        hardFails,
      );
      validateStringArrayField(
        observabilityContract,
        'dashboards',
        `Item ${item.item_id} observability_contract`,
        errors,
        hardFails,
      );
      validateStringArrayField(
        observabilityContract,
        'runbook_refs',
        `Item ${item.item_id} observability_contract`,
        errors,
        hardFails,
      );
      validateStringArrayField(
        observabilityContract,
        'telemetry_signals',
        `Item ${item.item_id} observability_contract`,
        errors,
        hardFails,
      );
      validateStringArrayField(
        observabilityContract,
        'residual_exceptions',
        `Item ${item.item_id} observability_contract`,
        errors,
        hardFails,
      );
      if (!('bypass_governance' in observabilityContract)) {
        pushIssue(
          errors,
          `Item ${item.item_id} observability_contract must declare bypass_governance`,
          hardFails,
          true,
        );
      }
    }

    if (requiresRollout(item)) {
      const rolloutRecord = asStringRecord(item.rollout);
      const rolloutApplicability = getRolloutApplicability(item);
      const rolloutMode = getRolloutMode(item);
      if (!['required', 'not_applicable'].includes(rolloutApplicability)) {
        pushIssue(
          errors,
          `Item ${item.item_id} has invalid rollout applicability`,
          hardFails,
          true,
        );
      } else if (rolloutApplicability === 'required') {
        if (
          !isNonEmptyString(rolloutMode) ||
          !ROLLOUT_MODES.includes(rolloutMode as (typeof ROLLOUT_MODES)[number])
        ) {
          pushIssue(
            errors,
            `Item ${item.item_id} is missing a valid rollout mode`,
            hardFails,
            true,
          );
        }
      } else if (!isNonEmptyString(getRolloutJustification(item))) {
        pushIssue(
          errors,
          `Item ${item.item_id} uses not_applicable rollout without justification`,
          hardFails,
          true,
        );
      } else if (
        !['spike_discovery', 'operational_enablement', 'documentation_support_enablement'].includes(
          item.item_class,
        )
      ) {
        pushIssue(
          errors,
          `Item ${item.item_id} may not mark rollout as not_applicable for class ${item.item_class}`,
          hardFails,
          true,
        );
      }
      const temporaryControls = Array.isArray(rolloutRecord.temporary_controls)
        ? rolloutRecord.temporary_controls
        : [];
      if (
        (isNonEmptyString(rolloutRecord.feature_flag) ||
          isNonEmptyString(rolloutRecord.kill_switch)) &&
        temporaryControls.length === 0
      ) {
        lintFindings.push(
          `Item ${item.item_id} defines feature flag or kill switch without retirement control metadata.`,
        );
      }
      for (const entry of temporaryControls) {
        const temporaryControl = asStringRecord(entry);
        if (
          !isNonEmptyString(temporaryControl.control_id) ||
          !isNonEmptyString(temporaryControl.description) ||
          !isNonEmptyString(temporaryControl.retirement_owner) ||
          !isNonEmptyString(temporaryControl.retirement_date)
        ) {
          pushIssue(
            errors,
            `Item ${item.item_id} rollout temporary control entries must include control_id, description, retirement_owner, and retirement_date`,
            hardFails,
            true,
          );
        }
      }

      const recoveryApplicability = getRecoveryApplicability(item);
      const recoveryClass = getRecoveryClass(item);
      if (!['required', 'not_applicable'].includes(recoveryApplicability)) {
        pushIssue(
          errors,
          `Item ${item.item_id} has invalid recovery applicability`,
          hardFails,
          true,
        );
      } else if (recoveryApplicability === 'required') {
        if (
          !isNonEmptyString(recoveryClass) ||
          !ROLLBACK_CLASSES.includes(recoveryClass as (typeof ROLLBACK_CLASSES)[number])
        ) {
          pushIssue(
            errors,
            `Item ${item.item_id} is missing a valid recovery class`,
            hardFails,
            true,
          );
        }
      } else if (!isNonEmptyString(getRecoveryJustification(item))) {
        pushIssue(
          errors,
          `Item ${item.item_id} uses not_applicable recovery without justification`,
          hardFails,
          true,
        );
      } else if (
        !['spike_discovery', 'operational_enablement', 'documentation_support_enablement'].includes(
          item.item_class,
        )
      ) {
        pushIssue(
          errors,
          `Item ${item.item_id} may not mark recovery as not_applicable for class ${item.item_class}`,
          hardFails,
          true,
        );
      }
    }

    if (item.readiness_state === 'ready') {
      if (!isNonEmptyString(getItemEstimateBand(item))) {
        lintFindings.push(`Item ${item.item_id} is ready but missing estimate_band.`);
      }
      if (!isNonEmptyString(getItemConfidence(item))) {
        lintFindings.push(`Item ${item.item_id} is ready but missing confidence.`);
      }
    }

    switch (item.item_class) {
      case 'capability_seam':
        if (!isNonEmptyString(getPayloadString(item, 'capability_added', item.capability_added))) {
          pushIssue(
            errors,
            `Capability seam ${item.item_id} missing capability_added`,
            hardFails,
            true,
          );
        }
        if (
          getPayloadStringArray(item, 'owner_surfaces', asArray(item.owner_surfaces)).length === 0
        ) {
          pushIssue(
            errors,
            `Capability seam ${item.item_id} missing owner_surfaces`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(
            getPayloadString(item, 'real_closure_definition', item.real_closure_definition),
          )
        ) {
          pushIssue(
            errors,
            `Capability seam ${item.item_id} missing real_closure_definition`,
            hardFails,
            true,
          );
        }
        break;
      case 'feature_slice':
        if (
          !isGraphRef(getPayloadGraphRef(item, 'parent_seam_ref', 'item')) &&
          !isNonEmptyString(item.parent_seam_id)
        ) {
          pushIssue(
            errors,
            `Feature slice ${item.item_id} missing parent_seam_id`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(getValueRecord(item).persona_or_operator_served) &&
          !isNonEmptyString(item.persona)
        ) {
          pushIssue(errors, `Feature slice ${item.item_id} missing persona`, hardFails, true);
        }
        if (!isNonEmptyString(getValueRecord(item).product_or_operator_value)) {
          pushIssue(
            errors,
            `Feature slice ${item.item_id} missing product_or_operator_value`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(getValueRecord(item).why_now) && !isNonEmptyString(item.why_now)) {
          pushIssue(errors, `Feature slice ${item.item_id} missing why_now`, hardFails, true);
        }
        if (
          getPayloadStringArray(item, 'acceptance_examples', asArray(item.acceptance_examples))
            .length === 0
        ) {
          pushIssue(
            errors,
            `Feature slice ${item.item_id} missing acceptance_examples`,
            hardFails,
            true,
          );
        }
        break;
      case 'control_guardrail':
        if (
          !isNonEmptyString(getPayloadString(item, 'control_objective', item.control_objective))
        ) {
          pushIssue(
            errors,
            `Control guardrail ${item.item_id} missing control_objective`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(getPayloadString(item, 'enforcing_surface', item.enforcing_surface))
        ) {
          pushIssue(
            errors,
            `Control guardrail ${item.item_id} missing enforcing_surface`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(getPayloadString(item, 'fail_mode', item.fail_mode))) {
          pushIssue(errors, `Control guardrail ${item.item_id} missing fail_mode`, hardFails, true);
        }
        if (
          validateStringArrayField(
            getObservabilityContract(item),
            'monitoring_evidence_refs',
            `Control guardrail ${item.item_id} observability_contract`,
            errors,
            hardFails,
          ).length === 0
        ) {
          pushIssue(
            errors,
            `Control guardrail ${item.item_id} missing monitoring_evidence_refs`,
            hardFails,
            true,
          );
        }
        if (!('bypass_governance' in getObservabilityContract(item))) {
          pushIssue(
            errors,
            `Control guardrail ${item.item_id} missing bypass_governance`,
            hardFails,
            true,
          );
        }
        break;
      case 'migration': {
        if (!isNonEmptyString(getPayloadString(item, 'source_state', item.source_state))) {
          pushIssue(errors, `Migration ${item.item_id} missing source_state`, hardFails, true);
        }
        if (!isNonEmptyString(getPayloadString(item, 'target_state', item.target_state))) {
          pushIssue(errors, `Migration ${item.item_id} missing target_state`, hardFails, true);
        }
        const compatibilityClass = getContractGovernance(item).compatibility_class;
        if (
          (!isNonEmptyString(compatibilityClass) ||
            !COMPATIBILITY_CLASSES.includes(
              compatibilityClass as (typeof COMPATIBILITY_CLASSES)[number],
            )) &&
          (!isNonEmptyString(item.compatibility_class) ||
            !COMPATIBILITY_CLASSES.includes(item.compatibility_class))
        ) {
          pushIssue(
            errors,
            `Migration ${item.item_id} missing compatibility_class`,
            hardFails,
            true,
          );
        }
        const migrationStrategy = getContractGovernance(item).migration_strategy;
        const canonicalWriter = getContractGovernance(item).canonical_writer;
        if (!isNonEmptyString(migrationStrategy) && !isNonEmptyString(item.migration_strategy)) {
          pushIssue(
            errors,
            `Migration ${item.item_id} missing migration_strategy`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(canonicalWriter) && !isNonEmptyString(item.canonical_writer)) {
          pushIssue(errors, `Migration ${item.item_id} missing canonical_writer`, hardFails, true);
        }
        if (
          !isNonEmptyString(getPayloadString(item, 'stop_go_checkpoint', item.stop_go_checkpoint))
        ) {
          pushIssue(
            errors,
            `Migration ${item.item_id} missing stop_go_checkpoint`,
            hardFails,
            true,
          );
        }
        if (
          getPayloadStringArray(item, 'cleanup_scope', asArray(item.cleanup_scope)).length === 0
        ) {
          pushIssue(errors, `Migration ${item.item_id} missing cleanup_scope`, hardFails, true);
        }
        break;
      }
      case 'retirement': {
        if (
          !isGraphRef(getPayloadGraphRef(item, 'replaces_or_retires_ref', 'item')) &&
          !isNonEmptyString(item.replaces_or_retires_ref)
        ) {
          pushIssue(
            errors,
            `Retirement ${item.item_id} missing replaces_or_retires_ref`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(getPayloadString(item, 'retirement_trigger', item.retirement_trigger))
        ) {
          pushIssue(
            errors,
            `Retirement ${item.item_id} missing retirement_trigger`,
            hardFails,
            true,
          );
        }
        if (
          getPayloadStringArray(item, 'legacy_assets', asArray(item.legacy_assets)).length === 0
        ) {
          pushIssue(errors, `Retirement ${item.item_id} missing legacy_assets`, hardFails, true);
        }
        if (
          getPayloadStringArray(item, 'dependent_consumers', asArray(item.dependent_consumers))
            .length === 0
        ) {
          pushIssue(
            errors,
            `Retirement ${item.item_id} missing dependent_consumers`,
            hardFails,
            true,
          );
        }
        const cleanupScope = new Set(
          getPayloadStringArray(item, 'cleanup_scope', asArray(item.cleanup_scope)),
        );
        for (const requiredCleanupTarget of REQUIRED_RETIREMENT_CLEANUP_SCOPE) {
          if (!cleanupScope.has(requiredCleanupTarget)) {
            pushIssue(
              errors,
              `Retirement ${item.item_id} cleanup_scope must cover ${requiredCleanupTarget}`,
              hardFails,
              true,
            );
          }
        }
        break;
      }
      case 'spike_discovery': {
        if (
          !isNonEmptyString(getPayloadString(item, 'uncertainty_class', item.uncertainty_class))
        ) {
          pushIssue(errors, `Spike ${item.item_id} missing uncertainty_class`, hardFails, true);
        }
        if (!isNonEmptyString(getPayloadString(item, 'question', item.question))) {
          pushIssue(errors, `Spike ${item.item_id} missing question`, hardFails, true);
        }
        if (
          !isNonEmptyString(getPayloadString(item, 'validation_method', item.validation_method))
        ) {
          pushIssue(errors, `Spike ${item.item_id} missing validation_method`, hardFails, true);
        }
        if (
          !isNonEmptyString(getPayloadString(item, 'expected_artifact', item.expected_artifact))
        ) {
          pushIssue(errors, `Spike ${item.item_id} missing expected_artifact`, hardFails, true);
        }
        if (!isNonEmptyString(getPayloadString(item, 'max_duration', item.max_duration))) {
          pushIssue(errors, `Spike ${item.item_id} missing max_duration`, hardFails, true);
        }
        if (!isNonEmptyString(getPayloadString(item, 'exit_criteria', item.exit_criteria))) {
          pushIssue(errors, `Spike ${item.item_id} missing exit_criteria`, hardFails, true);
        }
        if (!isNonEmptyString(getPayloadString(item, 'kill_criteria', item.kill_criteria))) {
          pushIssue(errors, `Spike ${item.item_id} missing kill_criteria`, hardFails, true);
        }
        if (
          getPayloadStringArray(item, 'follow_on_item_refs', asArray(item.follow_on_item_refs))
            .length === 0
        ) {
          pushIssue(errors, `Spike ${item.item_id} missing follow_on_item_refs`, hardFails, true);
        }
        for (const doneCheck of [
          'promised_artifact_exists',
          'outcome_recorded',
          'follow_on_items_linked',
          'silent_continuation_blocked',
        ]) {
          if (getDoneContractClassCheck(item, doneCheck) === null) {
            pushIssue(
              errors,
              `Spike ${item.item_id} done_contract.class_specific_checks.${doneCheck} must be a boolean`,
              hardFails,
              true,
            );
          }
        }
        if (getDoneContractClassCheck(item, 'follow_on_items_linked') !== true) {
          pushIssue(
            errors,
            `Spike ${item.item_id} must machine-check follow_on_items_linked`,
            hardFails,
            true,
          );
        }
        if (getDoneContractClassCheck(item, 'silent_continuation_blocked') !== true) {
          pushIssue(
            errors,
            `Spike ${item.item_id} must machine-check silent_continuation_blocked`,
            hardFails,
            true,
          );
        }
        const spikeOutcome = getPayloadString(
          item,
          'spike_outcome',
          isNonEmptyString(item.spike_outcome) ? item.spike_outcome : undefined,
        );
        if (
          item.closure_state === 'closed' ||
          (isNonEmptyString(spikeOutcome) && spikeOutcome !== 'pending')
        ) {
          if (getDoneContractClassCheck(item, 'promised_artifact_exists') !== true) {
            pushIssue(
              errors,
              `Closed spike ${item.item_id} must machine-check promised_artifact_exists`,
              hardFails,
              true,
            );
          }
          if (getDoneContractClassCheck(item, 'outcome_recorded') !== true) {
            pushIssue(
              errors,
              `Closed spike ${item.item_id} must machine-check outcome_recorded`,
              hardFails,
              true,
            );
          }
        }
        break;
      }
      case 'operational_enablement':
        if (
          !isNonEmptyString(
            getPayloadString(
              item,
              'runbook_or_enablement_artifact',
              item.runbook_or_enablement_artifact,
            ),
          )
        ) {
          pushIssue(
            errors,
            `Operational enablement ${item.item_id} missing runbook_or_enablement_artifact`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(
            getPayloadString(item, 'operational_audience', item.operational_audience),
          )
        ) {
          pushIssue(
            errors,
            `Operational enablement ${item.item_id} missing operational_audience`,
            hardFails,
            true,
          );
        }
        if (
          !item.owners ||
          !isNonEmptyString(item.owners.runtime_owner) ||
          !isNonEmptyString(item.owners.escalation_owner)
        ) {
          pushIssue(
            errors,
            `Operational enablement ${item.item_id} missing runtime_owner or escalation_owner`,
            hardFails,
            true,
          );
        }
        break;
      case 'documentation_support_enablement':
        if (!isNonEmptyString(getPayloadString(item, 'doc_audience', item.doc_audience))) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing doc_audience`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(getPayloadString(item, 'doc_scope', item.doc_scope))) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing doc_scope`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(
            getPayloadString(item, 'source_of_truth_artifact', item.source_of_truth_artifact),
          )
        ) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing source_of_truth_artifact`,
            hardFails,
            true,
          );
        }
        if (
          !isNonEmptyString(
            getPayloadString(item, 'freshness_update_trigger', item.freshness_update_trigger),
          )
        ) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing freshness_update_trigger`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(getPayloadString(item, 'freshness_update_owner'))) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing freshness_update_owner`,
            hardFails,
            true,
          );
        }
        if (!isNonEmptyString(getPayloadString(item, 'support_handoff_artifact'))) {
          pushIssue(
            errors,
            `Documentation/support enablement ${item.item_id} missing support_handoff_artifact`,
            hardFails,
            true,
          );
        }
        break;
    }

    const doneContract = getDoneContract(item);
    const allowedDoneExemptions = DONE_EXEMPTIONS_BY_CLASS[item.item_class];
    for (const exemptionKey of Object.keys(getContractExemptions(doneContract))) {
      if (!allowedDoneExemptions.has(exemptionKey)) {
        pushIssue(
          errors,
          `Item ${item.item_id} has invalid done exemption ${exemptionKey}`,
          hardFails,
          true,
        );
      }
    }
    if (item.closure_state === 'closed') {
      for (const doneKey of [
        'code_and_infra_complete',
        'tests_and_verification_complete',
        'dashboards_alerts_traces_logging_present',
        'runbooks_and_support_handoff_present',
        'migration_execution_or_safe_schedule_complete',
        'release_notes_and_docs_updated',
        'flags_and_kill_switches_governed',
        'temporary_mechanism_retirement_recorded',
      ]) {
        const doneState = contractCheckSatisfied(doneContract, doneKey, allowedDoneExemptions);
        if (!doneState.satisfied) {
          pushIssue(
            errors,
            `Closed item ${item.item_id} must satisfy done_contract.${doneKey}`,
            hardFails,
            true,
          );
        }
      }

      switch (item.item_class) {
        case 'feature_slice': {
          for (const check of [
            'end_to_end_acceptance_examples_pass',
            'production_proof_fresh',
            'rollout_and_recovery_rehearsed',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed feature slice ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          if (asArray(item.acceptance_examples).length === 0) {
            pushIssue(
              errors,
              `Closed feature slice ${item.item_id} must retain acceptance_examples`,
              hardFails,
              true,
            );
          }
          if (asArray(item.proof_refs).some((proofRef) => staleProofs.has(proofRef))) {
            pushIssue(
              errors,
              `Closed feature slice ${item.item_id} has stale proof evidence`,
              hardFails,
              true,
            );
          }
          const recovery = asStringRecord(item.recovery);
          const rehearsalProofRefs = Array.isArray(recovery.rehearsal_proof_refs)
            ? recovery.rehearsal_proof_refs.filter((proofRef): proofRef is string =>
                isNonEmptyString(proofRef),
              )
            : [];
          if (rehearsalProofRefs.length === 0) {
            pushIssue(
              errors,
              `Closed feature slice ${item.item_id} must evidence rehearsal via recovery.rehearsal_proof_refs`,
              hardFails,
              true,
            );
          }
          break;
        }
        case 'migration':
          for (const check of [
            'migration_executed_or_gated',
            'reconciliation_evidence_exists',
            'old_write_path_status_explicit',
            'rollback_forward_fix_decision_evidenced',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed migration ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          break;
        case 'retirement':
          for (const check of [
            'old_path_disabled_or_residual_gate_governed',
            'dependent_assets_removed_or_residual_items',
            'consumer_impact_window_closed_or_governed',
            'cleanup_proof_exists',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed retirement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          break;
        case 'control_guardrail':
          for (const check of [
            'canonical_path_enforced',
            'alerting_audit_evidence_exists',
            'bypass_rules_governed',
            'residual_exceptions_recorded',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed control guardrail ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          break;
        case 'operational_enablement':
          for (const check of [
            'required_operational_artifacts_exist',
            'ownership_and_escalation_surfaces_current',
            'enablement_proof_fresh',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed operational enablement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          break;
        case 'documentation_support_enablement':
          for (const check of [
            'published_to_intended_audience',
            'freshness_owner_assigned',
            'handoff_guidance_linked',
          ]) {
            if (getDoneContractClassCheck(item, check) !== true) {
              pushIssue(
                errors,
                `Closed documentation/support enablement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`,
                hardFails,
                true,
              );
            }
          }
          break;
      }
    }

    if (
      item.item_class !== 'capability_seam' &&
      (isNonEmptyString(item.capability_added) ||
        asArray(item.owner_surfaces).length > 0 ||
        isNonEmptyString(item.real_closure_definition))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes capability-seam semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'feature_slice' &&
      (isNonEmptyString(item.parent_seam_id) ||
        asArray(item.acceptance_examples).length > 0 ||
        isNonEmptyString(item.persona))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes feature-slice semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'control_guardrail' &&
      (isNonEmptyString(item.control_objective) ||
        isNonEmptyString(item.enforcing_surface) ||
        isNonEmptyString(item.fail_mode))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes control semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'migration' &&
      (isNonEmptyString(item.source_state) ||
        isNonEmptyString(item.target_state) ||
        isNonEmptyString(item.stop_go_checkpoint))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes migration semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'retirement' &&
      (isNonEmptyString(item.replaces_or_retires_ref) ||
        isNonEmptyString(item.retirement_trigger) ||
        asArray(item.legacy_assets).length > 0 ||
        asArray(item.cleanup_scope).length > 0)
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes retirement semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'spike_discovery' &&
      (isNonEmptyString(item.question) ||
        isNonEmptyString(item.validation_method) ||
        isNonEmptyString(item.expected_artifact) ||
        asArray(item.follow_on_item_refs).length > 0)
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes spike semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'operational_enablement' &&
      (isNonEmptyString(item.runbook_or_enablement_artifact) ||
        isNonEmptyString(item.operational_audience))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes operational-enablement semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
    if (
      item.item_class !== 'documentation_support_enablement' &&
      (isNonEmptyString(item.doc_audience) ||
        isNonEmptyString(item.doc_scope) ||
        isNonEmptyString(item.source_of_truth_artifact) ||
        isNonEmptyString(item.freshness_update_trigger))
    ) {
      pushIssue(
        errors,
        `Item ${item.item_id} mixes documentation/support semantics into ${item.item_class}`,
        hardFails,
        true,
      );
    }
  }

  const externallySafeTrackId = 'externally-safe-operationally-supportable';
  const externallySafeItemIds = new Set(
    backlog.items
      .filter((item) => item.track_id === externallySafeTrackId && isNonEmptyString(item.item_id))
      .map((item) => item.item_id as string),
  );
  for (const gate of backlog.track_gates.filter(
    (candidate) => candidate.track_id === externallySafeTrackId,
  )) {
    if (gate.fail_mode !== 'fail_closed') {
      pushIssue(
        errors,
        `Externally safe track gate ${gate.track_gate_id} must be fail_closed`,
        hardFails,
        true,
      );
    }
    if (isNonEmptyString(gate.track_gate_id) && trackGateFailures.includes(gate.track_gate_id)) {
      pushIssue(
        errors,
        `Externally safe track gate ${gate.track_gate_id} is not closed`,
        hardFails,
        true,
      );
    }
  }
  for (const issueCollection of [backlog.gaps, backlog.contradictions, backlog.unknowns]) {
    for (const entry of issueCollection) {
      if (
        isNonEmptyString(entry.issue_id) &&
        entry.fail_closed_category === true &&
        asArray(entry.related_item_refs).some((itemRef) => externallySafeItemIds.has(itemRef))
      ) {
        pushIssue(
          errors,
          `Externally safe track has unresolved fail-closed issue ${entry.issue_id}`,
          hardFails,
          true,
        );
      }
    }
  }

  const negativeScopeIds = new Set<string>();
  const negativeScopeByTitle = new Map<string, BacklogFile['negative_scope'][number]>();
  const claimsCoveredByNegativeScope = new Set<string>();
  const negativeScopeClaimsMissingOutOfScopeCommitment: string[] = [];
  for (const entry of backlog.negative_scope) {
    if (!isNonEmptyString(entry.negative_scope_id)) {
      pushIssue(errors, 'Negative scope entry missing negative_scope_id', hardFails, true);
      continue;
    }
    if (negativeScopeIds.has(entry.negative_scope_id)) {
      pushIssue(errors, `Duplicate negative_scope_id: ${entry.negative_scope_id}`, hardFails, true);
    }
    negativeScopeIds.add(entry.negative_scope_id);
    if (!isNonEmptyString(entry.title)) {
      pushIssue(errors, `Negative scope ${entry.negative_scope_id} missing title`, hardFails, true);
    } else {
      negativeScopeByTitle.set(entry.title, entry);
    }
    if (
      !isNonEmptyString(entry.negative_scope_class) ||
      !NEGATIVE_SCOPE_CLASSES.includes(entry.negative_scope_class)
    ) {
      pushIssue(
        errors,
        `Negative scope ${entry.negative_scope_id} has invalid negative_scope_class`,
        hardFails,
        true,
      );
    }
    validateSourceRefs(
      entry.source_refs,
      `Negative scope ${entry.negative_scope_id}`,
      sourceIds,
      excludedSourceIds,
      errors,
      hardFails,
    );
    requireNonEmptyStringArrayField(
      entry as Record<string, unknown>,
      'owner_implications',
      `Negative scope ${entry.negative_scope_id}`,
      errors,
      hardFails,
    );
    for (const claimRef of requireNonEmptyStringArrayField(
      entry as Record<string, unknown>,
      'related_claim_refs',
      `Negative scope ${entry.negative_scope_id}`,
      errors,
      hardFails,
    )) {
      if (!claimIds.has(claimRef)) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} references unknown claim ${claimRef}`,
          hardFails,
          true,
        );
        continue;
      }
      claimsCoveredByNegativeScope.add(claimRef);
      const relatedClaim = claimById.get(claimRef);
      if (relatedClaim?.commitment !== 'out_of_scope') {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} claim ${claimRef} must set claim.commitment=out_of_scope`,
          hardFails,
          true,
        );
        negativeScopeClaimsMissingOutOfScopeCommitment.push(claimRef);
      }
    }
    for (const itemRef of validateStringArrayField(
      entry as Record<string, unknown>,
      'related_item_refs',
      `Negative scope ${entry.negative_scope_id}`,
      errors,
      hardFails,
    )) {
      if (!itemIds.has(itemRef)) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} references unknown item ${itemRef}`,
          hardFails,
          true,
        );
      }
    }
    if (!isNonEmptyString(entry.revisit_trigger)) {
      pushIssue(
        errors,
        `Negative scope ${entry.negative_scope_id} missing revisit_trigger`,
        hardFails,
        true,
      );
    }
    const criticalPathItemRefs =
      entry.critical_path_item_refs === undefined
        ? []
        : validateStringArrayField(
            entry as Record<string, unknown>,
            'critical_path_item_refs',
            `Negative scope ${entry.negative_scope_id}`,
            errors,
            hardFails,
          );
    for (const itemRef of criticalPathItemRefs) {
      if (!itemIds.has(itemRef)) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} references unknown critical_path_item ${itemRef}`,
          hardFails,
          true,
        );
      }
    }
    const ownerSeamItemRefs =
      entry.owner_seam_item_refs === undefined
        ? []
        : validateStringArrayField(
            entry as Record<string, unknown>,
            'owner_seam_item_refs',
            `Negative scope ${entry.negative_scope_id}`,
            errors,
            hardFails,
          );
    for (const itemRef of ownerSeamItemRefs) {
      if (!itemIds.has(itemRef)) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} references unknown owner_seam_item ${itemRef}`,
          hardFails,
          true,
        );
      }
    }
    if (MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES.has(entry.negative_scope_class ?? '')) {
      if (criticalPathItemRefs.length === 0) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} must declare critical_path_item_refs for manual/synthetic closure`,
          hardFails,
          true,
        );
      }
      if (ownerSeamItemRefs.length === 0) {
        pushIssue(
          errors,
          `Negative scope ${entry.negative_scope_id} must declare owner_seam_item_refs for manual/synthetic closure`,
          hardFails,
          true,
        );
      }
      for (const ownerItemRef of ownerSeamItemRefs) {
        const ownerItem = itemsById.get(ownerItemRef);
        if (!ownerItem || ownerItem.item_class !== 'operational_enablement') {
          pushIssue(
            errors,
            `Negative scope ${entry.negative_scope_id} owner seam ${ownerItemRef} must be an operational_enablement item`,
            hardFails,
            true,
          );
          continue;
        }
        if (
          !ownerItem.owners ||
          !isNonEmptyString(ownerItem.owners.runtime_owner) ||
          !isNonEmptyString(ownerItem.owners.escalation_owner)
        ) {
          pushIssue(
            errors,
            `Negative scope ${entry.negative_scope_id} owner seam ${ownerItemRef} must declare runtime_owner and escalation_owner`,
            hardFails,
            true,
          );
        }
      }
      const criticalTracks = new Set(
        criticalPathItemRefs
          .map((itemRef) => itemsById.get(itemRef)?.track_id)
          .filter((trackId): trackId is string => isNonEmptyString(trackId)),
      );
      const ownerTracks = new Set(
        ownerSeamItemRefs
          .map((itemRef) => itemsById.get(itemRef)?.track_id)
          .filter((trackId): trackId is string => isNonEmptyString(trackId)),
      );
      for (const trackId of criticalTracks) {
        if (REQUIRED_TRACK_IDS.has(trackId) && !ownerTracks.has(trackId)) {
          pushIssue(
            errors,
            `Negative scope ${entry.negative_scope_id} introduces manual/synthetic closure on required track ${trackId} without same-track owner seam`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  const outOfScopeClaimsMissingNegativeScope = backlog.claims
    .filter((claim) => isNonEmptyString(claim.claim_id) && claim.commitment === 'out_of_scope')
    .map((claim) => claim.claim_id as string)
    .filter((claimId) => !claimsCoveredByNegativeScope.has(claimId));
  for (const claimId of outOfScopeClaimsMissingNegativeScope) {
    pushIssue(
      errors,
      `Claim ${claimId} is out_of_scope but has no canonical negative_scope entry`,
      hardFails,
      true,
    );
  }

  for (const behaviorTitle of backlog.as_built.synthetic_behaviors) {
    const entry = negativeScopeByTitle.get(behaviorTitle);
    if (!entry || !MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES.has(entry.negative_scope_class ?? '')) {
      pushIssue(
        errors,
        `Synthetic behavior ${behaviorTitle} must be modeled as manual/synthetic negative_scope with explicit critical-path and owner-seam linkage`,
        hardFails,
        true,
      );
    }
  }
  for (const behaviorTitle of backlog.as_built.compatibility_only_behaviors) {
    const entry = negativeScopeByTitle.get(behaviorTitle);
    if (!entry || entry.negative_scope_class !== 'compatibility_only') {
      pushIssue(
        errors,
        `Compatibility-only behavior ${behaviorTitle} must be modeled as compatibility_only negative_scope with explicit critical-path and owner-seam linkage`,
        hardFails,
        true,
      );
    }
  }

  if (backlog.quality_attributes.length === 0) {
    pushIssue(errors, 'quality_attributes ledger must not be empty', hardFails, true);
  }

  const qualityAttributeIds = new Set<string>();
  for (const entry of backlog.quality_attributes) {
    if (!isNonEmptyString(entry.quality_attribute_id)) {
      pushIssue(errors, 'Quality attribute entry missing quality_attribute_id', hardFails, true);
      continue;
    }
    if (qualityAttributeIds.has(entry.quality_attribute_id)) {
      pushIssue(
        errors,
        `Duplicate quality_attribute_id: ${entry.quality_attribute_id}`,
        hardFails,
        true,
      );
    }
    qualityAttributeIds.add(entry.quality_attribute_id);
    if (!isNonEmptyString(entry.title)) {
      pushIssue(
        errors,
        `Quality attribute ${entry.quality_attribute_id} missing title`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.quality_class)) {
      pushIssue(
        errors,
        `Quality attribute ${entry.quality_attribute_id} missing quality_class`,
        hardFails,
        true,
      );
    } else if (!QUALITY_CLASSES.has(entry.quality_class)) {
      pushIssue(
        errors,
        `Quality attribute ${entry.quality_attribute_id} has unsupported quality_class`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.target)) {
      pushIssue(
        errors,
        `Quality attribute ${entry.quality_attribute_id} missing target`,
        hardFails,
        true,
      );
    }
    validateGraphRefArray(
      entry.applies_to_refs,
      `Quality attribute ${entry.quality_attribute_id}`,
      'applies_to_refs',
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
      errors,
      hardFails,
    );
    validateStringArrayField(
      entry as Record<string, unknown>,
      'owner_refs',
      `Quality attribute ${entry.quality_attribute_id}`,
      errors,
      hardFails,
    );
    validateSourceRefs(
      entry.source_refs,
      `Quality attribute ${entry.quality_attribute_id}`,
      sourceIds,
      excludedSourceIds,
      errors,
      hardFails,
    );
    for (const proofRef of validateStringArrayField(
      entry as Record<string, unknown>,
      'proof_refs',
      `Quality attribute ${entry.quality_attribute_id}`,
      errors,
      hardFails,
    )) {
      if (!proofIds.has(proofRef)) {
        pushIssue(
          errors,
          `Quality attribute ${entry.quality_attribute_id} references unknown proof ${proofRef}`,
          hardFails,
          true,
        );
      }
    }
  }

  if (backlog.policy_decisions.length === 0) {
    pushIssue(errors, 'policy_decisions ledger must not be empty', hardFails, true);
  }

  const policyDecisionIds = new Set<string>();
  for (const entry of backlog.policy_decisions) {
    if (!isNonEmptyString(entry.policy_decision_id)) {
      pushIssue(errors, 'Policy decision entry missing policy_decision_id', hardFails, true);
      continue;
    }
    if (policyDecisionIds.has(entry.policy_decision_id)) {
      pushIssue(
        errors,
        `Duplicate policy_decision_id: ${entry.policy_decision_id}`,
        hardFails,
        true,
      );
    }
    policyDecisionIds.add(entry.policy_decision_id);
    if (!isNonEmptyString(entry.title)) {
      pushIssue(
        errors,
        `Policy decision ${entry.policy_decision_id} missing title`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.policy_surface)) {
      pushIssue(
        errors,
        `Policy decision ${entry.policy_decision_id} missing policy_surface`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(entry.decision_state) ||
      !POLICY_DECISION_STATES.includes(entry.decision_state)
    ) {
      pushIssue(
        errors,
        `Policy decision ${entry.policy_decision_id} has invalid decision_state`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.owner)) {
      pushIssue(
        errors,
        `Policy decision ${entry.policy_decision_id} missing owner`,
        hardFails,
        true,
      );
    }
    validateSourceRefs(
      entry.source_refs,
      `Policy decision ${entry.policy_decision_id}`,
      sourceIds,
      excludedSourceIds,
      errors,
      hardFails,
    );
    for (const itemRef of validateStringArrayField(
      entry as Record<string, unknown>,
      'related_item_refs',
      `Policy decision ${entry.policy_decision_id}`,
      errors,
      hardFails,
    )) {
      if (!itemIds.has(itemRef)) {
        pushIssue(
          errors,
          `Policy decision ${entry.policy_decision_id} references unknown item ${itemRef}`,
          hardFails,
          true,
        );
      }
    }
    if (
      (entry.decision_state === 'required' || entry.decision_state === 'deferred') &&
      !isNonEmptyString(entry.revisit_trigger)
    ) {
      pushIssue(
        errors,
        `Policy decision ${entry.policy_decision_id} missing revisit_trigger`,
        hardFails,
        true,
      );
    }
  }

  const gapIds = new Set<string>();
  const contradictionIds = new Set<string>();
  const unknownIds = new Set<string>();
  const issuesWithInvalidResolutionState: string[] = [];
  for (const [ledgerName, entries, idSet] of [
    ['Gap', backlog.gaps, gapIds],
    ['Contradiction', backlog.contradictions, contradictionIds],
    ['Unknown', backlog.unknowns, unknownIds],
  ] as const) {
    for (const entry of entries) {
      if (!isNonEmptyString(entry.issue_id)) {
        pushIssue(errors, `${ledgerName} entry missing issue_id`, hardFails, true);
        continue;
      }
      if (idSet.has(entry.issue_id)) {
        pushIssue(
          errors,
          `Duplicate ${ledgerName.toLowerCase()} issue_id: ${entry.issue_id}`,
          hardFails,
          true,
        );
      }
      idSet.add(entry.issue_id);
      if (!isNonEmptyString(entry.title)) {
        pushIssue(errors, `${ledgerName} ${entry.issue_id} missing title`, hardFails, true);
      }
      if (!isNonEmptyString(entry.severity)) {
        pushIssue(errors, `${ledgerName} ${entry.issue_id} missing severity`, hardFails, true);
      }
      if ('fail_closed_category' in entry && typeof entry.fail_closed_category !== 'boolean') {
        pushIssue(
          errors,
          `${ledgerName} ${entry.issue_id} has invalid fail_closed_category`,
          hardFails,
          true,
        );
      }
      if (
        'resolution_state' in entry &&
        entry.resolution_state !== undefined &&
        entry.resolution_state !== null
      ) {
        if (
          !isNonEmptyString(entry.resolution_state) ||
          !ISSUE_RESOLUTION_STATES.includes(entry.resolution_state)
        ) {
          pushIssue(
            errors,
            `${ledgerName} ${entry.issue_id} has invalid resolution_state`,
            hardFails,
            true,
          );
        }
      }
      if (ledgerName === 'Gap' || ledgerName === 'Unknown') {
        const issueLabel = `${ledgerName} ${entry.issue_id}`;
        const resolutionState = isNonEmptyString(entry.resolution_state)
          ? entry.resolution_state
          : null;
        const hasResolutionNote = isNonEmptyString(entry.resolution_note);
        const hasDowngradedSeverity = isNonEmptyString(entry.downgraded_severity);
        const hasCurrentTruthReopenEvidence =
          getCurrentTruthEvidenceSourceIds(entry.source_refs, sourceById).length > 0;
        const previousResolution =
          ledgerName === 'Gap'
            ? previousGapResolutionById.get(entry.issue_id)
            : previousUnknownResolutionById.get(entry.issue_id);

        if (ledgerName === 'Unknown' && resolutionState === null) {
          pushIssue(errors, `Unknown ${entry.issue_id} missing resolution_state`, hardFails, true);
          issuesWithInvalidResolutionState.push(entry.issue_id);
        }
        if (resolutionState === null) {
          if (hasResolutionNote || hasDowngradedSeverity) {
            pushIssue(
              errors,
              `${issueLabel} has resolution fields but no resolution_state`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
        } else if (resolutionState === 'open') {
          if (hasResolutionNote) {
            pushIssue(
              errors,
              `${issueLabel} must clear resolution_note when resolution_state=open`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
          if (hasDowngradedSeverity) {
            pushIssue(
              errors,
              `${issueLabel} must clear downgraded_severity when resolution_state=open`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
          if (
            previousResolution &&
            (previousResolution.resolution_state === 'resolved' ||
              previousResolution.resolution_state === 'downgraded') &&
            !hasCurrentTruthReopenEvidence &&
            driftState.deltaSummary.dirty_flags.length === 0
          ) {
            pushIssue(
              errors,
              `${issueLabel} cannot transition ${previousResolution.resolution_state} -> open without authoritative current-truth evidence or drift reassessment`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
        } else if (resolutionState === 'resolved' || resolutionState === 'downgraded') {
          if (!hasResolutionNote) {
            pushIssue(
              errors,
              `${issueLabel} must include resolution_note when ${resolutionState}`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
        }
        if (
          previousResolution?.resolution_state === 'downgraded' &&
          resolutionState === 'resolved' &&
          previousResolution.resolution_note === (hasResolutionNote ? entry.resolution_note : null)
        ) {
          pushIssue(
            errors,
            `${issueLabel} must include a new resolution_note when transitioning downgraded -> resolved`,
            hardFails,
            true,
          );
          issuesWithInvalidResolutionState.push(entry.issue_id);
        }
        if (resolutionState === 'resolved' && hasDowngradedSeverity) {
          pushIssue(
            errors,
            `${issueLabel} must clear downgraded_severity when resolution_state=resolved`,
            hardFails,
            true,
          );
          issuesWithInvalidResolutionState.push(entry.issue_id);
        }
        if (resolutionState === 'downgraded') {
          if (!hasDowngradedSeverity) {
            pushIssue(
              errors,
              `${issueLabel} must include downgraded_severity when resolution_state=downgraded`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          } else if (isCriticalUnknownSeverity(entry.downgraded_severity)) {
            pushIssue(
              errors,
              `${issueLabel} downgraded_severity must be below critical/high`,
              hardFails,
              true,
            );
            issuesWithInvalidResolutionState.push(entry.issue_id);
          }
        }
      }
      validateSourceRefs(
        entry.source_refs,
        `${ledgerName} ${entry.issue_id}`,
        sourceIds,
        excludedSourceIds,
        errors,
        hardFails,
      );
      validateStringArrayField(
        entry as Record<string, unknown>,
        'owner_implications',
        `${ledgerName} ${entry.issue_id}`,
        errors,
        hardFails,
      );
      for (const claimRef of validateStringArrayField(
        entry as Record<string, unknown>,
        'related_claim_refs',
        `${ledgerName} ${entry.issue_id}`,
        errors,
        hardFails,
      )) {
        if (!claimIds.has(claimRef)) {
          pushIssue(
            errors,
            `${ledgerName} ${entry.issue_id} references unknown claim ${claimRef}`,
            hardFails,
            true,
          );
        }
      }
      for (const itemRef of validateStringArrayField(
        entry as Record<string, unknown>,
        'related_item_refs',
        `${ledgerName} ${entry.issue_id}`,
        errors,
        hardFails,
      )) {
        if (!itemIds.has(itemRef)) {
          pushIssue(
            errors,
            `${ledgerName} ${entry.issue_id} references unknown item ${itemRef}`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  const unknownToSpike = new Map<string, string>();
  for (const entry of backlog.uncertainty_to_spike) {
    if (!isNonEmptyString(entry.unknown_id)) {
      pushIssue(errors, 'uncertainty_to_spike entry missing unknown_id', hardFails, true);
      continue;
    }
    if (!unknownIds.has(entry.unknown_id)) {
      pushIssue(
        errors,
        `uncertainty_to_spike references unknown unknown_id ${entry.unknown_id}`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.spike_item_id) || !itemIds.has(entry.spike_item_id)) {
      pushIssue(
        errors,
        `uncertainty_to_spike ${entry.unknown_id} references invalid spike_item_id`,
        hardFails,
        true,
      );
      continue;
    }
    if (declaredItemClassById.get(entry.spike_item_id) !== 'spike_discovery') {
      pushIssue(
        errors,
        `uncertainty_to_spike ${entry.unknown_id} must point to a spike_discovery item`,
        hardFails,
        true,
      );
    }
    if (unknownToSpike.has(entry.unknown_id)) {
      pushIssue(
        errors,
        `uncertainty_to_spike duplicates unknown_id ${entry.unknown_id}`,
        hardFails,
        true,
      );
    } else {
      unknownToSpike.set(entry.unknown_id, entry.spike_item_id);
    }
  }
  for (const [unknownId, unknownEntry] of unknownEntryById) {
    if (
      unknownEntry.resolution_state !== 'resolved' &&
      unknownEntry.resolution_state !== 'downgraded' &&
      isCriticalUnknownSeverity(getIssueEffectiveSeverity(unknownEntry)) &&
      !unknownToSpike.has(unknownId)
    ) {
      pushIssue(
        errors,
        `Critical unknown ${unknownId} must be resolved, downgraded, or linked to a bounded spike`,
        hardFails,
        true,
      );
    }
  }

  for (const entry of backlog.delivered_lineage_notes) {
    if (!isNonEmptyString(entry.lineage_note_id)) {
      pushIssue(errors, 'Delivered lineage note missing lineage_note_id', hardFails, true);
      continue;
    }
    if (!isNonEmptyString(entry.item_id) || !itemIds.has(entry.item_id)) {
      pushIssue(
        errors,
        `Delivered lineage note ${entry.lineage_note_id} has invalid item_id`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.note)) {
      pushIssue(
        errors,
        `Delivered lineage note ${entry.lineage_note_id} missing note`,
        hardFails,
        true,
      );
    }
    for (const proofRef of validateStringArrayField(
      entry as Record<string, unknown>,
      'proof_refs',
      `Delivered lineage note ${entry.lineage_note_id}`,
      errors,
      hardFails,
    )) {
      if (!proofIds.has(proofRef)) {
        pushIssue(
          errors,
          `Delivered lineage note ${entry.lineage_note_id} references unknown proof ${proofRef}`,
          hardFails,
          true,
        );
      }
    }
  }

  for (const entry of backlog.roadmap_matrix) {
    if (!isNonEmptyString(entry.row_id)) {
      pushIssue(errors, 'Roadmap matrix entry missing row_id', hardFails, true);
      continue;
    }
    if (!isGraphRef(entry.item_ref) || entry.item_ref.kind !== 'item') {
      pushIssue(errors, `Roadmap matrix ${entry.row_id} missing item_ref`, hardFails, true);
    } else if (!itemIds.has(entry.item_ref.id ?? '')) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} references unknown item ${entry.item_ref.id}`,
        hardFails,
        true,
      );
    }
    if (!isGraphRef(entry.track_ref) || entry.track_ref.kind !== 'track') {
      pushIssue(errors, `Roadmap matrix ${entry.row_id} missing track_ref`, hardFails, true);
    } else if (!trackIds.has(entry.track_ref.id ?? '')) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} references unknown track ${entry.track_ref.id}`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.item_class) || !ITEM_CLASSES.includes(entry.item_class)) {
      pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid item_class`, hardFails, true);
    }
    if (
      !isNonEmptyString(entry.backlog_protocol_state) ||
      !BACKLOG_PROTOCOL_STATES.includes(entry.backlog_protocol_state)
    ) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing valid backlog_protocol_state`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(entry.delivery_state) ||
      !DELIVERY_STATES.includes(entry.delivery_state)
    ) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing valid delivery_state`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(entry.readiness_state) ||
      !READINESS_STATES.includes(entry.readiness_state)
    ) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing valid readiness_state`,
        hardFails,
        true,
      );
    }
    if (
      !isNonEmptyString(entry.closure_state) ||
      !ITEM_CLOSURE_STATES.includes(entry.closure_state)
    ) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing valid closure_state`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.summary_label) || !SUMMARY_LABELS.includes(entry.summary_label)) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing valid summary_label`,
        hardFails,
        true,
      );
    }
    if (!isNonEmptyString(entry.dependency_type)) {
      pushIssue(errors, `Roadmap matrix ${entry.row_id} missing dependency_type`, hardFails, true);
    }
    if (!isNonEmptyString(entry.economic_priority_note)) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing economic_priority_note`,
        hardFails,
        true,
      );
    }
    validateGraphRefArray(
      entry.parent_refs ?? [],
      `Roadmap matrix ${entry.row_id}`,
      'parent_refs',
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
      errors,
      hardFails,
    );
    validateGraphRefArray(
      entry.child_refs ?? [],
      `Roadmap matrix ${entry.row_id}`,
      'child_refs',
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
      errors,
      hardFails,
    );
    validateGraphRefArray(
      entry.dependency_refs ?? [],
      `Roadmap matrix ${entry.row_id}`,
      'dependency_refs',
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
      errors,
      hardFails,
    );
    validateGraphRefArray(
      asArray(entry.retirement_ref ? [entry.retirement_ref] : []),
      `Roadmap matrix ${entry.row_id}`,
      'retirement_ref',
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
      errors,
      hardFails,
    );
    for (const proofRef of asArray(entry.proof_refs)) {
      if (!proofIds.has(proofRef)) {
        pushIssue(
          errors,
          `Roadmap matrix ${entry.row_id} references unknown proof ${proofRef}`,
          hardFails,
          true,
        );
      }
    }
  }

  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id)) {
      continue;
    }

    for (const claimRef of asArray(item.claim_refs)) {
      if (!claimIds.has(claimRef)) {
        pushIssue(
          errors,
          `Item ${item.item_id} references unknown claim_ref ${claimRef}`,
          hardFails,
          true,
        );
      } else {
        mappedClaimRefs.add(claimRef);
      }
    }
    for (const policyDecisionRef of asArray(item.policy_decision_refs)) {
      if (!policyDecisionIds.has(policyDecisionRef)) {
        pushIssue(
          errors,
          `Item ${item.item_id} references unknown policy_decision_ref ${policyDecisionRef}`,
          hardFails,
          true,
        );
      }
    }

    for (const origin of asArray(itemOriginRefs.get(item.item_id))) {
      if (!isNonEmptyString(origin.kind) || !isNonEmptyString(origin.ref)) {
        continue;
      }

      let originResolved = false;
      switch (origin.kind) {
        case 'claim_ref':
          originResolved = claimIds.has(origin.ref);
          break;
        case 'gap_ref':
          originResolved = gapIds.has(origin.ref);
          break;
        case 'control_obligation_ref':
          originResolved = controlObligationClaimIds.has(origin.ref);
          break;
        case 'policy_decision_ref':
          originResolved = policyDecisionIds.has(origin.ref);
          break;
        case 'decommission_need_ref':
          originResolved = decommissionNeedClaimIds.has(origin.ref);
          break;
        case 'review_finding_ref':
          originResolved = reviewFindingIds.has(origin.ref);
          break;
        case 'unknown_ref':
          originResolved = unknownIds.has(origin.ref);
          break;
      }

      if (!originResolved) {
        pushIssue(
          errors,
          `Item ${item.item_id} has unresolved ${origin.kind} ${origin.ref}`,
          hardFails,
          true,
        );
      } else if (
        origin.kind === 'claim_ref' ||
        origin.kind === 'control_obligation_ref' ||
        origin.kind === 'decommission_need_ref'
      ) {
        mappedClaimRefs.add(origin.ref);
      }
    }
  }

  for (const proof of backlog.proofs) {
    if (
      isGraphRef(proof.covered_ref) &&
      !graphRefExists(
        proof.covered_ref,
        manifest.run_id,
        itemIds,
        trackIds,
        trackProofIds,
        proofIds,
        reviewIds,
        contractIds,
        dataDomainIds,
        valueStreamIds,
      )
    ) {
      pushIssue(
        errors,
        `Proof ${proof.proof_id} references missing covered_ref ${formatGraphRef(proof.covered_ref)}`,
        hardFails,
        true,
      );
    }
    if (
      isGraphRef(proof.covered_ref) &&
      proof.covered_ref.kind === 'item' &&
      isNonEmptyString(proof.covered_ref.id)
    ) {
      const coveredItem = itemsById.get(proof.covered_ref.id);
      if (coveredItem && typeof proof.dimensions === 'object' && proof.dimensions !== null) {
        const securityDimension = asStringRecord(proof.dimensions.security_trace);
        if (
          securityDimension.status === 'not_applicable' &&
          !isProofDimensionNotApplicableAllowed(
            coveredItem,
            'security_trace',
            securityDimension.justification,
          )
        ) {
          pushIssue(
            errors,
            `Proof ${proof.proof_id} may not mark security_trace as not_applicable for item ${coveredItem.item_id}`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  for (const review of backlog.reviews) {
    if (
      isGraphRef(review.reviewed_ref) &&
      !graphRefExists(
        review.reviewed_ref,
        manifest.run_id,
        itemIds,
        trackIds,
        trackProofIds,
        proofIds,
        reviewIds,
        contractIds,
        dataDomainIds,
        valueStreamIds,
      )
    ) {
      pushIssue(
        errors,
        `Review ${review.review_id} references missing reviewed_ref ${formatGraphRef(review.reviewed_ref)}`,
        hardFails,
        true,
      );
    }
  }

  for (const waiver of backlog.waivers) {
    if (
      isGraphRef(waiver.scope) &&
      !graphRefExists(
        waiver.scope,
        manifest.run_id,
        itemIds,
        trackIds,
        trackProofIds,
        proofIds,
        reviewIds,
        contractIds,
        dataDomainIds,
        valueStreamIds,
      )
    ) {
      const message = `Waiver ${waiver.waiver_id} references missing scope ${formatGraphRef(waiver.scope)}`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
    }
  }

  const outgoingByItem = new Map<string, DiscoveryRelation[]>();
  const incomingByItem = new Map<string, DiscoveryRelation[]>();
  for (const relation of backlog.relations) {
    if (
      !isNonEmptyString(relation.relation_type) ||
      !RELATION_TYPES.includes(relation.relation_type)
    ) {
      pushIssue(
        errors,
        `Invalid relation_type: ${String(relation.relation_type ?? '')}`,
        hardFails,
        true,
      );
      continue;
    }
    const fromRef = normalizeRelationRef(relation.from, 'item');
    const toRef = normalizeRelationRef(relation.to);
    if (!fromRef || !toRef) {
      pushIssue(errors, 'Relation missing from/to graph refs', hardFails, true);
      continue;
    }

    const { validFrom, validTo } = relationEndpointExists(
      relation,
      manifest.run_id,
      itemIds,
      trackIds,
      trackProofIds,
      proofIds,
      reviewIds,
      contractIds,
      dataDomainIds,
      valueStreamIds,
    );

    if (!validFrom) {
      pushIssue(errors, `Relation source not found: ${formatGraphRef(fromRef)}`, hardFails, true);
    }
    if (!validTo) {
      pushIssue(
        errors,
        `Relation target not found for ${relation.relation_type}: ${formatGraphRef(toRef)}`,
        hardFails,
        true,
      );
    }

    if (validFrom && fromRef.kind === 'item') {
      const fromItemId = fromRef.id;
      if (!isNonEmptyString(fromItemId)) {
        pushIssue(errors, 'Relation item source is missing an id', hardFails, true);
        continue;
      }
      const outgoing = outgoingByItem.get(fromItemId) ?? [];
      outgoing.push(relation);
      outgoingByItem.set(fromItemId, outgoing);
    }
    if (validTo && toRef.kind === 'item') {
      const toItemId = toRef.id;
      if (!isNonEmptyString(toItemId)) {
        pushIssue(errors, 'Relation item target is missing an id', hardFails, true);
        continue;
      }
      const incoming = incomingByItem.get(toItemId) ?? [];
      incoming.push(relation);
      incomingByItem.set(toItemId, incoming);
    }
  }

  const roadmapRowsByItemId = new Map<string, BacklogFile['roadmap_matrix'][number]>();
  const topologyRanks = new Set<number>();
  const safetyRanks = new Set<number>();
  const economicRanks = new Set<number>();
  const topologyRankByItemId = new Map<string, number>();
  for (const entry of backlog.roadmap_matrix) {
    if (!isGraphRef(entry.item_ref) || !isNonEmptyString(entry.item_ref.id)) {
      continue;
    }
    if (roadmapRowsByItemId.has(entry.item_ref.id)) {
      pushIssue(
        errors,
        `Roadmap matrix has duplicate item row for ${entry.item_ref.id}`,
        hardFails,
        true,
      );
      continue;
    }
    roadmapRowsByItemId.set(entry.item_ref.id, entry);
    for (const [label, value, bucket] of [
      ['topology_rank', entry.topology_rank, topologyRanks],
      ['safety_rank', entry.safety_rank, safetyRanks],
      ['economic_rank', entry.economic_rank, economicRanks],
    ] as const) {
      if (!Number.isInteger(value) || (value as number) < 0) {
        pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid ${label}`, hardFails, true);
        continue;
      }
      if (bucket.has(value as number)) {
        pushIssue(
          errors,
          `Roadmap matrix ${entry.row_id} duplicates ${label}=${value}`,
          hardFails,
          true,
        );
        continue;
      }
      bucket.add(value as number);
    }
    if (Number.isInteger(entry.topology_rank) && (entry.topology_rank as number) >= 0) {
      topologyRankByItemId.set(entry.item_ref.id, entry.topology_rank as number);
    }
  }
  const roadmapRows = backlog.roadmap_matrix.filter(
    (
      entry,
    ): entry is (typeof backlog.roadmap_matrix)[number] & { item_ref: GraphRef & { id: string } } =>
      isGraphRef(entry.item_ref) &&
      entry.item_ref.kind === 'item' &&
      isNonEmptyString(entry.item_ref.id),
  );
  for (let leftIndex = 0; leftIndex < roadmapRows.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < roadmapRows.length; rightIndex += 1) {
      const left = roadmapRows[leftIndex];
      const right = roadmapRows[rightIndex];
      if (!left || !right) {
        continue;
      }

      const [leftTrackPriority, leftItemPriority] = getSafetyPriority(left);
      const [rightTrackPriority, rightItemPriority] = getSafetyPriority(right);
      const leftSafetyRank = left.safety_rank ?? Number.MAX_SAFE_INTEGER;
      const rightSafetyRank = right.safety_rank ?? Number.MAX_SAFE_INTEGER;

      if (
        (leftTrackPriority < rightTrackPriority ||
          (leftTrackPriority === rightTrackPriority && leftItemPriority < rightItemPriority)) &&
        leftSafetyRank >= rightSafetyRank
      ) {
        pushIssue(
          errors,
          `Roadmap matrix safety_rank must place ${left.item_ref.id} before ${right.item_ref.id} by methodology safety precedence`,
          hardFails,
          true,
        );
      }
      if (
        (leftTrackPriority > rightTrackPriority ||
          (leftTrackPriority === rightTrackPriority && leftItemPriority > rightItemPriority)) &&
        leftSafetyRank <= rightSafetyRank
      ) {
        pushIssue(
          errors,
          `Roadmap matrix safety_rank must place ${right.item_ref.id} before ${left.item_ref.id} by methodology safety precedence`,
          hardFails,
          true,
        );
      }

      if (leftTrackPriority === rightTrackPriority && leftItemPriority === rightItemPriority) {
        const economicPriority = compareEconomicPriority(left, right);
        if (
          economicPriority < 0 &&
          (left.economic_rank ?? Number.MAX_SAFE_INTEGER) >=
            (right.economic_rank ?? Number.MAX_SAFE_INTEGER)
        ) {
          pushIssue(
            errors,
            `Roadmap matrix economic_rank must place ${left.item_ref.id} before ${right.item_ref.id} by methodology economic precedence`,
            hardFails,
            true,
          );
        }
        if (
          economicPriority > 0 &&
          (left.economic_rank ?? Number.MAX_SAFE_INTEGER) <=
            (right.economic_rank ?? Number.MAX_SAFE_INTEGER)
        ) {
          pushIssue(
            errors,
            `Roadmap matrix economic_rank must place ${right.item_ref.id} before ${left.item_ref.id} by methodology economic precedence`,
            hardFails,
            true,
          );
        }
      }
    }
  }
  for (const itemId of itemIds) {
    if (!roadmapRowsByItemId.has(itemId)) {
      pushIssue(errors, `Item ${itemId} is missing roadmap_matrix row`, hardFails, true);
    }
  }
  for (const entry of backlog.roadmap_matrix) {
    if (
      !isGraphRef(entry.item_ref) ||
      entry.item_ref.kind !== 'item' ||
      !isNonEmptyString(entry.item_ref.id)
    ) {
      continue;
    }
    const rowItem = itemsById.get(entry.item_ref.id);
    if (!rowItem || !isNonEmptyString(rowItem.item_id)) {
      continue;
    }
    const outgoing = outgoingByItem.get(rowItem.item_id) ?? [];
    const incoming = incomingByItem.get(rowItem.item_id) ?? [];
    if (entry.item_class !== rowItem.item_class) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} item_class mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (!relationRefEquals(entry.track_ref, graphRef('track', rowItem.track_id ?? ''))) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} track_ref mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.milestone !== rowItem.milestone) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} milestone mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.backlog_protocol_state !== rowItem.backlog_protocol_state) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} backlog_protocol_state mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.delivery_state !== rowItem.delivery_state) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} delivery_state mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.readiness_state !== rowItem.readiness_state) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} readiness_state mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.closure_state !== rowItem.closure_state) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} closure_state mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.summary_label !== rowItem.summary_label) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} summary_label mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (entry.economic_priority_note !== rowItem.economic_priority_note) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} economic_priority_note mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    const expectedParents = incoming
      .filter((relation) => relation.relation_type === 'decomposes_into')
      .map((relation) => normalizeRelationRef(relation.from))
      .filter((ref): ref is GraphRef => ref?.kind === 'item' && isNonEmptyString(ref.id))
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    const actualParents = asArray(entry.parent_refs)
      .filter((ref): ref is GraphRef => isGraphRef(ref) && ref.kind === 'item')
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    if (expectedParents.map(graphRefKey).join('|') !== actualParents.map(graphRefKey).join('|')) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} parent_refs mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    const expectedChildren = outgoing
      .filter((relation) => relation.relation_type === 'decomposes_into')
      .map((relation) => normalizeRelationRef(relation.to))
      .filter((ref): ref is GraphRef => ref?.kind === 'item' && isNonEmptyString(ref.id))
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    const actualChildren = asArray(entry.child_refs)
      .filter((ref): ref is GraphRef => isGraphRef(ref) && ref.kind === 'item')
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    if (expectedChildren.map(graphRefKey).join('|') !== actualChildren.map(graphRefKey).join('|')) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} child_refs mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    const expectedDependencies = getDependencyRefs(rowItem)
      .map((dependencyId) => graphRef('item', dependencyId))
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    const actualDependencies = asArray(entry.dependency_refs)
      .filter((ref): ref is GraphRef => isGraphRef(ref) && ref.kind === 'item')
      .sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
    if (
      expectedDependencies.map(graphRefKey).join('|') !==
      actualDependencies.map(graphRefKey).join('|')
    ) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} dependency_refs mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    if (!Array.isArray(entry.dependency_entries)) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} missing dependency_entries`,
        hardFails,
        true,
      );
    } else {
      const dependencyEntryKeys = new Set<string>();
      for (const dependencyEntry of entry.dependency_entries) {
        const dependencyEntryRecord = asStringRecord(dependencyEntry);
        const dependencyRef = dependencyEntryRecord.ref;
        if (!isGraphRef(dependencyRef) || dependencyRef.kind !== 'item') {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} has invalid dependency_entries.ref`,
            hardFails,
            true,
          );
          continue;
        }
        if (!isNonEmptyString(dependencyEntryRecord.dependency_type)) {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} dependency entry missing dependency_type`,
            hardFails,
            true,
          );
          continue;
        }
        dependencyEntryKeys.add(`${dependencyRef.id}:${dependencyEntryRecord.dependency_type}`);
      }
      for (const dependencyRef of expectedDependencies) {
        if (
          ![...dependencyEntryKeys].some((entryKey) => entryKey.startsWith(`${dependencyRef.id}:`))
        ) {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} dependency_entries missing typed dependency for ${dependencyRef.id}`,
            hardFails,
            true,
          );
        }
      }
    }
    if (!Array.isArray(entry.economic_factors) || entry.economic_factors.length === 0) {
      pushIssue(errors, `Roadmap matrix ${entry.row_id} missing economic_factors`, hardFails, true);
    } else {
      for (const economicFactor of entry.economic_factors) {
        if (
          !isNonEmptyString(economicFactor) ||
          ![
            'strategic_fit',
            'dependency_unlock',
            'user_value',
            'ops_pain_reduction',
            'risk_burn_down',
            'compliance_deadline',
            'learning_value',
            'reversibility',
            'cost_of_delay',
            'lead_time_risk',
          ].includes(economicFactor)
        ) {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} has invalid economic_factor ${String(economicFactor)}`,
            hardFails,
            true,
          );
        }
      }
    }
    const expectedProofRefs = [...asArray(rowItem.proof_refs)].sort();
    const actualProofRefs = [...asArray(entry.proof_refs)].sort();
    if (expectedProofRefs.join('|') !== actualProofRefs.join('|')) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} proof_refs mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    const expectedRetirementRef =
      outgoing
        .filter((relation) => relation.relation_type === 'retires')
        .map((relation) => normalizeRelationRef(relation.to))
        .find((ref): ref is GraphRef => ref !== null) ?? null;
    if (!relationRefEquals(entry.retirement_ref ?? null, expectedRetirementRef)) {
      pushIssue(
        errors,
        `Roadmap matrix ${entry.row_id} retirement_ref mismatch for ${rowItem.item_id}`,
        hardFails,
        true,
      );
    }
    const rowTopologyRank = topologyRankByItemId.get(rowItem.item_id);
    if (rowTopologyRank !== undefined) {
      const topologyParents = incoming
        .filter((relation) => relation.relation_type === 'decomposes_into')
        .map((relation) => normalizeRelationRef(relation.from))
        .filter((ref): ref is GraphRef => ref?.kind === 'item' && isNonEmptyString(ref.id));
      const orderedPredecessors = [
        ...topologyParents.map((ref) => ({ ref, relationLabel: 'parent' })),
        ...expectedDependencies.map((ref) => ({ ref, relationLabel: 'dependency' })),
      ];
      for (const predecessor of orderedPredecessors) {
        const predecessorRank = topologyRankByItemId.get(predecessor.ref.id ?? '');
        if (predecessorRank !== undefined && predecessorRank >= rowTopologyRank) {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} topology_rank must place ${predecessor.relationLabel} ${predecessor.ref.id} before ${rowItem.item_id}`,
            hardFails,
            true,
          );
        }
      }
      for (const childRef of expectedChildren) {
        const childRank = topologyRankByItemId.get(childRef.id ?? '');
        if (childRank !== undefined && childRank <= rowTopologyRank) {
          pushIssue(
            errors,
            `Roadmap matrix ${entry.row_id} topology_rank must place child ${childRef.id} after ${rowItem.item_id}`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  for (const review of backlog.reviews) {
    if (!isNonEmptyString(review.review_id) || !isGraphRef(review.reviewed_ref)) {
      continue;
    }
    const expectedReviewRef = graphRef('review', review.review_id);
    const hasReviewedByRelation = backlog.relations.some(
      (relation) =>
        relation.relation_type === 'reviewed_by' &&
        relationRefEquals(normalizeRelationRef(relation.from), review.reviewed_ref) &&
        relationRefEquals(normalizeRelationRef(relation.to), expectedReviewRef),
    );
    if (!hasReviewedByRelation) {
      pushIssue(
        errors,
        `Review ${review.review_id} is missing graph-level reviewed_by relation from ${formatGraphRef(review.reviewed_ref)}`,
        hardFails,
        true,
      );
    }
  }

  for (const trackProof of backlog.track_proofs) {
    if (!isNonEmptyString(trackProof.track_proof_id) || !isNonEmptyString(trackProof.track_id)) {
      continue;
    }
    const trackId = trackProof.track_id;
    const trackProofId = trackProof.track_proof_id;
    const hasTrackProofRelation = backlog.relations.some(
      (relation) =>
        relation.relation_type === 'proves' &&
        relationRefEquals(normalizeRelationRef(relation.from), graphRef('track', trackId)) &&
        relationRefEquals(normalizeRelationRef(relation.to), graphRef('track_proof', trackProofId)),
    );
    if (!hasTrackProofRelation) {
      pushIssue(
        errors,
        `Track proof ${trackProofId} is missing graph-level proves relation from track ${trackId}`,
        hardFails,
        true,
      );
    }
  }

  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id) || !isNonEmptyString(item.item_class)) {
      continue;
    }

    const itemId = item.item_id;
    const itemClass = item.item_class;
    const itemTrackId = item.track_id;

    const dependencies = getDependencyRefs(item);
    for (const dependency of dependencies) {
      if (!itemIds.has(dependency)) {
        pushIssue(errors, `Item ${itemId} depends on unknown item ${dependency}`, hardFails, true);
      }
    }

    for (const proofRef of asArray(item.proof_refs)) {
      if (!proofIds.has(proofRef)) {
        pushIssue(errors, `Item ${itemId} references unknown proof ${proofRef}`, hardFails, true);
      }
    }

    const outgoing = outgoingByItem.get(itemId) ?? [];
    const incoming = incomingByItem.get(itemId) ?? [];
    const proofRelations = outgoing.filter((relation) => relation.relation_type === 'proves');
    const proofRelationIds = new Set(
      proofRelations
        .map((relation) => normalizeRelationRef(relation.to))
        .filter((ref): ref is GraphRef => ref?.kind === 'proof' && isNonEmptyString(ref.id))
        .map((ref) => ref.id as string),
    );
    for (const proofRef of asArray(item.proof_refs)) {
      if (!proofRelationIds.has(proofRef)) {
        pushIssue(
          errors,
          `Item ${itemId} proof_ref ${proofRef} is missing graph-level proves relation`,
          hardFails,
          true,
        );
      }
    }
    const itemHasCoveringProof = asArray(item.proof_refs).some((proofRef) => {
      const coveredRef = proofCoveredRefById.get(proofRef);
      return relationRefEquals(coveredRef, graphRef('item', itemId));
    });
    if (!itemHasCoveringProof) {
      pushIssue(
        errors,
        `Item ${itemId} must have at least one proof_ref whose covered_ref points to the item itself`,
        hardFails,
        true,
      );
    }
    const allowedRelations = OUTGOING_RELATIONS_BY_CLASS[itemClass];
    for (const relation of outgoing) {
      if (!allowedRelations.has(relation.relation_type ?? '')) {
        pushIssue(
          errors,
          `Item ${itemId} (${itemClass}) has invalid outgoing relation ${relation.relation_type}`,
          hardFails,
          true,
        );
      }
    }

    const trackRelations = outgoing.filter(
      (relation) => relation.relation_type === 'belongs_to_track',
    );
    if (trackRelations.length !== 1) {
      pushIssue(
        errors,
        `Item ${itemId} must have exactly one belongs_to_track relation`,
        hardFails,
        true,
      );
    } else if (
      !isNonEmptyString(itemTrackId) ||
      !relationRefEquals(
        normalizeRelationRef(trackRelations[0]?.to),
        graphRef('track', itemTrackId),
      )
    ) {
      pushIssue(
        errors,
        `Item ${itemId} has belongs_to_track mismatch with track_id`,
        hardFails,
        true,
      );
    }

    if (itemClass === 'feature_slice') {
      const realizes = outgoing.filter((relation) => relation.relation_type === 'realizes');
      if (realizes.length !== 1) {
        pushIssue(
          errors,
          `Feature slice ${itemId} must realize exactly one parent seam`,
          hardFails,
          true,
        );
      } else {
        const realizeRelation = realizes[0];
        if (!realizeRelation) {
          pushIssue(
            errors,
            `Feature slice ${itemId} must realize exactly one parent seam`,
            hardFails,
            true,
          );
          continue;
        }
        const realizedParentRef = normalizeRelationRef(realizeRelation.to);
        const parent =
          realizedParentRef?.kind === 'item' && isNonEmptyString(realizedParentRef.id)
            ? itemsById.get(realizedParentRef.id)
            : undefined;
        if (!parent || parent.item_class !== 'capability_seam') {
          pushIssue(
            errors,
            `Feature slice ${itemId} must realize a capability seam`,
            hardFails,
            true,
          );
        }
        const parentSeamRef =
          getPayloadGraphRef(item, 'parent_seam_ref', 'item') ??
          (isNonEmptyString(item.parent_seam_id) ? graphRef('item', item.parent_seam_id) : null);
        if (parentSeamRef && !relationRefEquals(realizedParentRef, parentSeamRef)) {
          pushIssue(errors, `Feature slice ${itemId} has parent_seam_id mismatch`, hardFails, true);
        }
      }
    }

    if (itemClass === 'control_guardrail') {
      const governedByIncoming = incoming.filter(
        (relation) => relation.relation_type === 'governed_by',
      );
      if (governedByIncoming.length === 0) {
        pushIssue(
          errors,
          `Control guardrail ${itemId} must be the target of governed_by`,
          hardFails,
          true,
        );
      }
    }

    if (itemClass === 'migration') {
      const migrationsFrom = outgoing.filter(
        (relation) => relation.relation_type === 'migrates_from',
      );
      if (migrationsFrom.length !== 1) {
        pushIssue(
          errors,
          `Migration ${itemId} must have exactly one migrates_from relation`,
          hardFails,
          true,
        );
      }
    }

    if (itemClass === 'retirement') {
      const retires = outgoing.filter((relation) => relation.relation_type === 'retires');
      if (retires.length === 0) {
        pushIssue(
          errors,
          `Retirement ${itemId} must retire at least one legacy path`,
          hardFails,
          true,
        );
      }
    }

    if (itemClass === 'capability_seam') {
      const decomposesInto = outgoing.filter(
        (relation) => relation.relation_type === 'decomposes_into',
      );
      if (decomposesInto.length === 0) {
        pushIssue(
          errors,
          `Capability seam ${itemId} must decompose into owned child work`,
          hardFails,
          true,
        );
      }
      for (const relation of decomposesInto) {
        const relationTarget = normalizeRelationRef(relation.to);
        const target =
          relationTarget?.kind === 'item' && isNonEmptyString(relationTarget.id)
            ? itemsById.get(relationTarget.id)
            : undefined;
        if (
          target &&
          ![
            'feature_slice',
            'control_guardrail',
            'migration',
            'retirement',
            'operational_enablement',
            'documentation_support_enablement',
          ].includes(target.item_class ?? '')
        ) {
          pushIssue(
            errors,
            `Capability seam ${itemId} decomposes into invalid item ${formatGraphRef(relationTarget)}`,
            hardFails,
            true,
          );
        }
      }
    }

    if (itemClass === 'spike_discovery') {
      const hiddenImplementation = outgoing.filter(
        (relation) => relation.relation_type === 'decomposes_into',
      );
      if (hiddenImplementation.length > 0) {
        pushIssue(
          errors,
          `Spike ${itemId} may not decompose into implementation work`,
          hardFails,
          true,
        );
      }
      const mappedUnknowns = backlog.uncertainty_to_spike.filter(
        (entry) => entry.spike_item_id === itemId,
      );
      if (mappedUnknowns.length === 0) {
        pushIssue(
          errors,
          `Spike ${itemId} must be linked from uncertainty_to_spike`,
          hardFails,
          true,
        );
      }
      for (const followOnItemRef of getPayloadStringArray(
        item,
        'follow_on_item_refs',
        asArray(item.follow_on_item_refs),
      )) {
        if (!itemIds.has(followOnItemRef)) {
          pushIssue(
            errors,
            `Spike ${itemId} references unknown follow-on item ${followOnItemRef}`,
            hardFails,
            true,
          );
          continue;
        }
        if (followOnItemRef === itemId) {
          pushIssue(
            errors,
            `Spike ${itemId} cannot reference itself as a follow-on item`,
            hardFails,
            true,
          );
        }
      }
    }

    if (
      itemClass === 'operational_enablement' ||
      itemClass === 'documentation_support_enablement'
    ) {
      const parentRelations = outgoing.filter(
        (relation) =>
          relation.relation_type === 'enabled_by' || relation.relation_type === 'governed_by',
      );
      if (parentRelations.length === 0) {
        pushIssue(
          errors,
          `Item ${itemId} (${itemClass}) must declare at least one enabled_by or governed_by relation`,
          hardFails,
          true,
        );
      }
    }

    const contractRelations = outgoing.filter(
      (relation) => relation.relation_type === 'touches_contract',
    );
    const dataDomainRelations = outgoing.filter(
      (relation) => relation.relation_type === 'touches_data_domain',
    );
    const contractChanging =
      contractRelations.length > 0 ||
      dataDomainRelations.length > 0 ||
      asArray(item.interfaces_touched).length > 0 ||
      asArray(item.data_domains_touched).length > 0 ||
      item.item_class === 'migration' ||
      itemTouchesTrustBoundary(item);
    if (contractChanging) {
      const governance = getContractGovernance(item);
      if (governance.applicable !== true) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but contract_governance.applicable is not true`,
          hardFails,
          true,
        );
      }
      const contractOwner =
        typeof governance.contract_owner === 'string' ? governance.contract_owner : null;
      const compatibilityClass =
        typeof governance.compatibility_class === 'string'
          ? governance.compatibility_class
          : item.compatibility_class;
      const migrationStrategy =
        typeof governance.migration_strategy === 'string'
          ? governance.migration_strategy
          : item.migration_strategy;
      const canonicalWriter =
        typeof governance.canonical_writer === 'string'
          ? governance.canonical_writer
          : item.canonical_writer;
      const consumerImpact =
        typeof governance.consumer_impact === 'string'
          ? governance.consumer_impact
          : item.consumer_impact;
      const versioningStrategy =
        typeof governance.versioning_strategy === 'string' ? governance.versioning_strategy : null;
      const reconciliationStrategy =
        typeof governance.reconciliation_strategy === 'string'
          ? governance.reconciliation_strategy
          : null;
      const deprecationWindow =
        typeof governance.deprecation_window === 'string' ? governance.deprecation_window : null;
      const retirementCondition =
        typeof governance.retirement_condition === 'string'
          ? governance.retirement_condition
          : null;

      if (!isNonEmptyString(contractOwner)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but missing contract_owner`,
          hardFails,
          true,
        );
      }
      if (
        !isNonEmptyString(compatibilityClass) ||
        !COMPATIBILITY_CLASSES.includes(
          compatibilityClass as (typeof COMPATIBILITY_CLASSES)[number],
        )
      ) {
        pushIssue(
          errors,
          `Item ${itemId} is contract-changing but missing compatibility_class`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(migrationStrategy)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract-changing but missing migration governance`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(canonicalWriter)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract-changing but missing canonical_writer`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(consumerImpact)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract-changing but missing consumer_impact`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(versioningStrategy)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but missing versioning_strategy`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(reconciliationStrategy)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but missing reconciliation_strategy`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(deprecationWindow)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but missing deprecation_window`,
          hardFails,
          true,
        );
      }
      if (!isNonEmptyString(retirementCondition)) {
        pushIssue(
          errors,
          `Item ${itemId} is contract/data-changing but missing retirement_condition`,
          hardFails,
          true,
        );
      }
      if (asArray(item.interfaces_touched).length > 0 && contractRelations.length === 0) {
        pushIssue(
          errors,
          `Item ${itemId} lists interfaces_touched but has no touches_contract relation`,
          hardFails,
          true,
        );
      }
      if (asArray(item.data_domains_touched).length > 0 && dataDomainRelations.length === 0) {
        pushIssue(
          errors,
          `Item ${itemId} lists data_domains_touched but has no touches_data_domain relation`,
          hardFails,
          true,
        );
      }
      for (const relation of contractRelations) {
        const targetRef = normalizeRelationRef(relation.to);
        if (
          targetRef?.kind === 'contract' &&
          !asArray(item.interfaces_touched).includes(targetRef.id ?? '')
        ) {
          pushIssue(
            errors,
            `Item ${itemId} touches contract ${targetRef.id} but does not list it in interfaces_touched`,
            hardFails,
            true,
          );
        }
      }
      for (const relation of dataDomainRelations) {
        const targetRef = normalizeRelationRef(relation.to);
        if (
          targetRef?.kind === 'data_domain' &&
          !asArray(item.data_domains_touched).includes(targetRef.id ?? '')
        ) {
          pushIssue(
            errors,
            `Item ${itemId} touches data domain ${targetRef.id} but does not list it in data_domains_touched`,
            hardFails,
            true,
          );
        }
      }
    }
  }

  const committedClaimsWithoutItems = [...committedClaimIds].filter(
    (claimId) => !mappedClaimRefs.has(claimId),
  );
  for (const claimId of committedClaimsWithoutItems) {
    pushIssue(errors, `Committed claim ${claimId} is not mapped to any item`, hardFails, true);
  }

  const replacements = backlog.relations.filter(
    (relation) => relation.relation_type === 'replaces',
  );
  for (const relation of replacements) {
    const replacementTarget = normalizeRelationRef(relation.to);
    const replacementSource = normalizeRelationRef(relation.from, 'item');
    const retiredByRetirement = backlog.items.some((item) => {
      if (item.item_class !== 'retirement' || !isNonEmptyString(item.item_id)) {
        return false;
      }
      const outgoing = outgoingByItem.get(item.item_id) ?? [];
      return outgoing.some(
        (candidate) =>
          candidate.relation_type === 'retires' &&
          relationRefEquals(normalizeRelationRef(candidate.to), replacementTarget),
      );
    });
    if (!retiredByRetirement) {
      pushIssue(
        errors,
        `Replacement path ${formatGraphRef(replacementSource)} -> ${formatGraphRef(replacementTarget)} has no retirement item`,
        hardFails,
        true,
      );
    }
  }

  for (const claimId of driftState.staleClaims) {
    const message = `Claim ${claimId} is stale after source or claim drift`;
    lintFindings.push(message);
    hardFails.push(message);
  }
  for (const itemId of driftState.staleItems) {
    const message = `Item ${itemId} is stale after proof, claim, contract, or topology drift`;
    lintFindings.push(message);
    hardFails.push(message);
  }
  for (const proofId of driftState.staleProofs) {
    const message = `Proof ${proofId} is stale after freshness expiry or drift invalidation`;
    lintFindings.push(message);
    hardFails.push(message);
  }
  for (const gateId of driftState.deltaSummary.track_gate_ids_to_recalculate) {
    const gate = backlog.track_gates.find((candidate) => candidate.track_gate_id === gateId);
    if (gate?.fail_mode === 'fail_closed') {
      const message = `Track gate ${gateId} requires recalculation after drift and is fail_closed`;
      pushIssue(errors, message, hardFails, true);
      trackGateFailures.push(gateId);
    }
  }

  const targetAcceptance: AcceptanceClass = isAcceptanceClass(manifest.acceptance_target)
    ? manifest.acceptance_target
    : 'draft-only';

  const runScopeRef = graphRef('run', manifest.run_id);
  const runScopeKey = graphRefKey(runScopeRef);
  const validWaivedScopesByRole = new Map<ReviewRole, Set<string>>();
  for (const waiver of backlog.waivers) {
    if (
      !isNonEmptyString(waiver.waiver_id) ||
      !isNonEmptyString(waiver.waived_role) ||
      !isGraphRef(waiver.scope)
    ) {
      continue;
    }
    const scopeItems = getScopedItemsForGraphRef(waiver.scope, manifest.run_id, itemsById, backlog);
    const directlyImpacted = isRoleDirectlyImpacted(
      waiver.waived_role,
      scopeItems,
      targetAcceptance,
    );
    if (directlyImpacted) {
      const message = `Waiver ${waiver.waiver_id} is invalid because role ${waiver.waived_role} is directly impacted by its scope`;
      pushIssue(errors, message, hardFails, true);
      waiverFindings.push(message);
      invalidWaiverIds.add(waiver.waiver_id);
      const invalidScopes =
        invalidWaivedScopeKeysByRole.get(waiver.waived_role) ?? new Set<string>();
      invalidScopes.add(graphRefKey(waiver.scope));
      invalidWaivedScopeKeysByRole.set(waiver.waived_role, invalidScopes);
      continue;
    }
    const waivedScopes = validWaivedScopesByRole.get(waiver.waived_role) ?? new Set<string>();
    waivedScopes.add(graphRefKey(waiver.scope));
    validWaivedScopesByRole.set(waiver.waived_role, waivedScopes);
  }

  const requiredRoleScopes = new Map<ReviewRole, Map<string, GraphRef>>();
  for (const role of [
    'product_strategy',
    'system_architecture',
    'application_engineering',
  ] as const) {
    addRequiredRoleScope(requiredRoleScopes, role, runScopeRef);
  }
  if (targetAcceptance !== 'draft-only') {
    addRequiredRoleScope(requiredRoleScopes, 'qa_release', runScopeRef);
  }
  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id)) {
      continue;
    }
    const itemScope = graphRef('item', item.item_id);
    if (
      item.item_class === 'operational_enablement' ||
      item.item_class === 'documentation_support_enablement' ||
      hasChangeSurface(item, SUPPORT_SURFACES)
    ) {
      addRequiredRoleScope(requiredRoleScopes, 'platform_sre', itemScope);
      addRequiredRoleScope(requiredRoleScopes, 'support_operations', itemScope);
    }
    if (item.item_class === 'control_guardrail' || hasChangeSurface(item, SECURITY_SURFACES)) {
      addRequiredRoleScope(requiredRoleScopes, 'security', itemScope);
    }
  }
  for (const trackProof of backlog.track_proofs) {
    if (!isNonEmptyString(trackProof.track_proof_id)) {
      continue;
    }
    const trackProofScope = graphRef('track_proof', trackProof.track_proof_id);
    const scopedItems = getScopedItemsForGraphRef(
      trackProofScope,
      manifest.run_id,
      itemsById,
      backlog,
    );
    if (
      trackProof.track_id === 'externally-safe-operationally-supportable' ||
      trackProof.track_id === 'full-target-system' ||
      isRuntimeOrSupportDirectlyImpacted(scopedItems)
    ) {
      addRequiredRoleScope(requiredRoleScopes, 'platform_sre', trackProofScope);
      addRequiredRoleScope(requiredRoleScopes, 'support_operations', trackProofScope);
    }
    if (isSecurityDirectlyImpacted(scopedItems)) {
      addRequiredRoleScope(requiredRoleScopes, 'security', trackProofScope);
    }
  }

  if (targetAcceptance === 'implementation-grade') {
    for (const role of BASELINE_IMPLEMENTATION_REVIEW_ROLES) {
      addRequiredRoleScope(requiredRoleScopes, role, runScopeRef);
    }
  }

  const validRunWaivedRoles = new Set<ReviewRole>();
  for (const [role, scopes] of validWaivedScopesByRole) {
    if (scopes.has(runScopeKey)) {
      validRunWaivedRoles.add(role);
    }
  }

  const requiredReviewRoles = new Set<ReviewRole>();
  for (const [role, scopes] of requiredRoleScopes) {
    const hasUnwaivedScope = [...scopes.values()].some(
      (scope) => !scopeIsWaived(validWaivedScopesByRole, role, scope, runScopeKey),
    );
    if (hasUnwaivedScope) {
      requiredReviewRoles.add(role);
    }
  }

  const assessedAt = utcNow();
  const staleItemIds = new Set(driftState.staleItems);
  const staleProofIds = new Set([...staleProofs]);
  const recalculatedTrackGateIds = new Set(driftState.deltaSummary.track_gate_ids_to_recalculate);
  const trackById = new Map(
    backlog.tracks
      .filter((track) => isNonEmptyString(track.track_id))
      .map((track) => [track.track_id, track] as const),
  );
  const trackProofById = new Map(
    backlog.track_proofs
      .filter((trackProof) => isNonEmptyString(trackProof.track_proof_id))
      .map((trackProof) => [trackProof.track_proof_id, trackProof] as const),
  );
  const countUniqueIds = <T>(entries: T[], selector: (entry: T) => string | undefined): number =>
    new Set(
      entries
        .map((entry) => selector(entry))
        .filter((value): value is string => isNonEmptyString(value)),
    ).size;
  const uniqueItemsById = new Map<string, DiscoveryItem>();
  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id) || uniqueItemsById.has(item.item_id)) {
      continue;
    }
    uniqueItemsById.set(item.item_id, item);
  }
  const lastRebaselineAt = parseTimestamp(manifest.last_rebaseline_at);
  const dirtyStateObservedAt = parseTimestamp(manifest.last_delta_at ?? manifest.updated_at);
  const staleReviewArtifacts = [
    ...new Set(
      eligibleReviews.flatMap((review) => {
        if (
          !isNonEmptyString(review.review_id) ||
          !isNonEmptyString(review.review_scope) ||
          !isGraphRef(review.reviewed_ref)
        ) {
          return [];
        }

        const reviewTimestamp = isNonEmptyString(review.reviewed_at)
          ? parseTimestamp(review.reviewed_at)
          : null;
        if (review.review_scope === 'run' && review.reviewed_ref.kind === 'run') {
          const predatesRebaseline =
            reviewTimestamp !== null &&
            lastRebaselineAt !== null &&
            reviewTimestamp < lastRebaselineAt;
          const predatesCurrentDirtyState =
            reviewTimestamp !== null &&
            dirtyStateObservedAt !== null &&
            reviewTimestamp < dirtyStateObservedAt &&
            driftState.deltaSummary.dirty_flags.length > 0;
          return predatesRebaseline || predatesCurrentDirtyState ? [review.review_id] : [];
        }

        let applicabilityMismatch = false;
        if (
          isNonEmptyString(review.role) &&
          REVIEW_ROLES.includes(review.role) &&
          (review.review_scope === 'item' || review.review_scope === 'track_proof')
        ) {
          const roleScopes = requiredRoleScopes.get(review.role);
          const reviewedScopeKey = graphRefKey(review.reviewed_ref);
          const scopeItems = getScopedItemsForGraphRef(
            review.reviewed_ref,
            manifest.run_id,
            itemsById,
            backlog,
          );
          const directlyImpacted = isRoleDirectlyImpacted(
            review.role,
            scopeItems,
            targetAcceptance,
          );
          const comparableRequiredScopeExists =
            roleScopes !== undefined &&
            [...roleScopes.values()].some((scope) => scope.kind === review.review_scope);
          const scopeStillRequired =
            directlyImpacted &&
            (roleScopes?.has(reviewedScopeKey) ?? false) &&
            !scopeIsWaived(validWaivedScopesByRole, review.role, review.reviewed_ref, runScopeKey);
          const hasSameScopeInvalidWaiver =
            invalidWaivedScopeKeysByRole.get(review.role)?.has(reviewedScopeKey) ?? false;
          applicabilityMismatch =
            comparableRequiredScopeExists && (!scopeStillRequired || hasSameScopeInvalidWaiver);
        }

        if (
          review.review_scope === 'item' &&
          review.reviewed_ref.kind === 'item' &&
          (staleItemIds.has(review.reviewed_ref.id ?? '') || applicabilityMismatch)
        ) {
          return [review.review_id];
        }

        if (review.review_scope === 'track_proof' && review.reviewed_ref.kind === 'track_proof') {
          const trackProof = trackProofById.get(review.reviewed_ref.id ?? '');
          const hasStaleProofDependency = asArray(trackProof?.proof_refs).some((proofId) =>
            staleProofIds.has(proofId),
          );
          const requiredTrackGateIds = isNonEmptyString(trackProof?.track_id)
            ? asArray(trackById.get(trackProof.track_id)?.required_track_gate_ids).filter(
                isNonEmptyString,
              )
            : [];
          const needsRecalculation = requiredTrackGateIds.some((gateId) =>
            recalculatedTrackGateIds.has(gateId),
          );
          return hasStaleProofDependency || needsRecalculation || applicabilityMismatch
            ? [review.review_id]
            : [];
        }

        return [];
      }),
    ),
  ].sort();
  const staleReviewArtifactIds = new Set(staleReviewArtifacts);
  const effectiveReviews = eligibleReviews.filter(
    (review) => isNonEmptyString(review.review_id) && !staleReviewArtifactIds.has(review.review_id),
  );
  const runReviewRoleMap = new Map<ReviewRole, { independent: boolean; verdicts: string[] }>();
  for (const review of effectiveReviews) {
    if (
      !isNonEmptyString(review.role) ||
      review.review_scope !== 'run' ||
      !relationRefEquals(review.reviewed_ref, graphRef('run', manifest.run_id))
    ) {
      continue;
    }
    const runState = runReviewRoleMap.get(review.role) ?? { independent: false, verdicts: [] };
    runState.independent = runState.independent || review.independent === true;
    runState.verdicts.push(review.verdict ?? '');
    runReviewRoleMap.set(review.role, runState);
  }
  const pendingTrackProofReviews: string[] = [];
  const runReviews = effectiveReviews.filter(
    (review) =>
      review.review_scope === 'run' &&
      relationRefEquals(review.reviewed_ref, graphRef('run', manifest.run_id)),
  );
  if (runReviews.length === 0) {
    pushIssue(
      errors,
      'Run must be reviewed_by at least one fresh run-scope review artifact',
      hardFails,
      true,
    );
  }
  for (const trackProof of backlog.track_proofs) {
    if (!isNonEmptyString(trackProof.track_proof_id)) {
      continue;
    }
    const trackProofId = trackProof.track_proof_id;
    const trackProofReviews = effectiveReviews.filter(
      (review) =>
        review.review_scope === 'track_proof' &&
        relationRefEquals(review.reviewed_ref, graphRef('track_proof', trackProofId)),
    );
    if (trackProofReviews.length === 0) {
      pendingTrackProofReviews.push(trackProofId);
      pushIssue(
        errors,
        `Track proof ${trackProofId} must be reviewed_by at least one fresh track_proof review artifact`,
        hardFails,
        true,
      );
      continue;
    }
    if (!trackProofReviews.some((review) => review.independent === true)) {
      pendingTrackProofReviews.push(trackProofId);
      pushIssue(
        errors,
        `Track proof ${trackProofId} must have at least one independent fresh track_proof review`,
        hardFails,
        true,
      );
    }
    if (trackProofReviews.every((review) => review.verdict === 'fail')) {
      pushIssue(
        errors,
        `Track proof ${trackProofId} has only failing fresh track_proof reviews`,
        hardFails,
        true,
      );
    }
    if (trackProofReviews.some((review) => review.verdict === 'pass_with_findings')) {
      warnings.push(
        `Track proof ${trackProofId} passed fresh review with findings; confirm track-closure follow-up actions are tracked.`,
      );
    }
  }

  const presentReviewRoles = [...runReviewRoleMap.keys()].sort();
  const missingRequiredReviews: ReviewRole[] = [];
  const validatedReviewRoles = new Set<ReviewRole>();
  const validateRequiredReviewRole = (role: ReviewRole): void => {
    if (validatedReviewRoles.has(role)) {
      return;
    }
    validatedReviewRoles.add(role);

    if (validRunWaivedRoles.has(role)) {
      return;
    }

    const reviewState = runReviewRoleMap.get(role);
    if (!reviewState) {
      missingRequiredReviews.push(role);
      pushIssue(errors, `Required review role missing: ${role}`, hardFails, true);
      return;
    }
    if (!reviewState.independent) {
      pushIssue(
        errors,
        `Required review role ${role} lacks an independent fresh review artifact`,
        hardFails,
        true,
      );
    }
    if (reviewState.verdicts.every((verdict) => verdict === 'fail')) {
      pushIssue(
        errors,
        `Required review role ${role} has only failing fresh reviews`,
        hardFails,
        true,
      );
    }
    if (reviewState.verdicts.some((verdict) => verdict === 'pass_with_findings')) {
      warnings.push(
        `Review role ${role} passed with findings; confirm follow-up actions are tracked.`,
      );
    }
  };
  for (const role of [...requiredReviewRoles].sort()) {
    validateRequiredReviewRole(role);
  }
  const reviewWarnings = warnings.filter((warning) => warning.toLowerCase().includes('review'));

  const preliminaryScore = computeScore(
    backlog,
    hardFails,
    errors,
    warnings,
    lintFindings,
    [...staleProofs],
    driftState.staleItems,
    driftState.staleClaims,
    missingRequiredReviews,
    pendingTrackProofReviews,
    committedClaimsWithoutItems,
    missingOwners,
  );

  const candidateForImplementationGrade =
    errors.length === 0 &&
    hardFails.length === 0 &&
    preliminaryScore.total >= 95 &&
    reviewWarnings.length === 0;
  if (candidateForImplementationGrade) {
    for (const role of BASELINE_IMPLEMENTATION_REVIEW_ROLES) {
      requiredReviewRoles.add(role);
      validateRequiredReviewRole(role);
    }
  }

  const score = candidateForImplementationGrade
    ? computeScore(
        backlog,
        hardFails,
        errors,
        warnings,
        lintFindings,
        [...staleProofs],
        driftState.staleItems,
        driftState.staleClaims,
        missingRequiredReviews,
        pendingTrackProofReviews,
        committedClaimsWithoutItems,
        missingOwners,
      )
    : preliminaryScore;

  if (
    warnings.length > 0 &&
    !warnings.some((warning) => warning.toLowerCase().includes('review'))
  ) {
    nextActions.push(
      'Resolve remaining warnings before treating the run as stable planning input.',
    );
  }
  if (hardFails.length > 0) {
    nextActions.push('Fix hard-fail validation issues and rerun validate.');
  }
  if (itemsMissingDeliveryEvidence.length > 0) {
    nextActions.push(
      `Back delivery_state with authoritative current-truth evidence: ${[...new Set(itemsMissingDeliveryEvidence)].sort().join(', ')}.`,
    );
  }
  const negativeScopeAlignmentIssues = [
    ...negativeScopeClaimsMissingOutOfScopeCommitment,
    ...outOfScopeClaimsMissingNegativeScope,
  ];
  if (negativeScopeAlignmentIssues.length > 0) {
    nextActions.push(
      `Align out_of_scope claims with canonical negative_scope entries: ${[...new Set(negativeScopeAlignmentIssues)].sort().join(', ')}.`,
    );
  }
  if (issuesWithInvalidResolutionState.length > 0) {
    nextActions.push(
      `Normalize Gap/Unknown resolution fields to the canonical state machine: ${[...new Set(issuesWithInvalidResolutionState)].sort().join(', ')}.`,
    );
  }
  if (missingRequiredReviews.length > 0) {
    nextActions.push(`Obtain independent reviews for: ${missingRequiredReviews.join(', ')}.`);
  }
  if (pendingTrackProofReviews.length > 0) {
    nextActions.push(
      `Attach independent track-proof reviews for: ${pendingTrackProofReviews.join(', ')}.`,
    );
  }
  if (staleProofs.size > 0) {
    nextActions.push(`Refresh stale proof bundles: ${[...staleProofs].join(', ')}.`);
  }
  if (driftState.staleItems.length > 0) {
    nextActions.push(`Refresh stale items after drift: ${driftState.staleItems.join(', ')}.`);
  }
  if (driftState.staleClaims.length > 0) {
    nextActions.push(`Re-verify changed claims: ${driftState.staleClaims.join(', ')}.`);
  }
  if (driftState.rebaselineRequired) {
    nextActions.push(
      'Run delta, update canonical state, and rebaseline before relying on acceptance.',
    );
  }
  if (committedClaimsWithoutItems.length > 0) {
    nextActions.push(`Map committed claims to items: ${committedClaimsWithoutItems.join(', ')}.`);
  }
  if (
    backlog.items.some(
      (item) =>
        item.readiness_state === 'ready' &&
        (!isNonEmptyString(getItemEstimateBand(item)) ||
          !isNonEmptyString(getItemConfidence(item))),
    )
  ) {
    nextActions.push('Complete estimate_band and confidence on ready items.');
  }

  const uniqueHardFails = [...new Set(hardFails)];
  const hasHardFails = uniqueHardFails.length > 0;
  const canonicalArtifactsComplete = errors.length === 0;
  const reviewGateErrors = errors.filter((error) => error.startsWith('Required review role '));
  const planningScoreEligible = score.total >= 80;
  const implementationScoreEligible = score.total >= 95;
  const implementationAcceptanceEligible =
    implementationScoreEligible &&
    reviewWarnings.length === 0 &&
    missingRequiredReviews.length === 0 &&
    pendingTrackProofReviews.length === 0;

  const assessmentStatus: AssessmentFile['status'] =
    canonicalArtifactsComplete && !hasHardFails ? 'pass' : 'fail';
  let acceptanceAchieved: AcceptanceClass = 'draft-only';
  if (
    canonicalArtifactsComplete &&
    !hasHardFails &&
    reviewGateErrors.length === 0 &&
    planningScoreEligible
  ) {
    acceptanceAchieved = implementationAcceptanceEligible
      ? 'implementation-grade'
      : 'planning-grade';
  }

  const blockingReasons = [...uniqueHardFails];
  if (missingRequiredReviews.length > 0) {
    blockingReasons.push(`Missing required review roles: ${missingRequiredReviews.join(', ')}`);
  }
  for (const reviewIssue of reviewGateErrors) {
    blockingReasons.push(reviewIssue);
  }
  if (!planningScoreEligible) {
    blockingReasons.push(
      `Score ${score.total}/${score.max} is below the planning-grade floor of 80.`,
    );
  }

  if (!planningScoreEligible) {
    nextActions.push(
      'Raise the score to at least 80/100 before treating the run as planning-grade.',
    );
  }

  const targetSatisfied = acceptanceAtLeast(acceptanceAchieved, targetAcceptance);
  const closureStatus =
    acceptanceAchieved === 'implementation-grade'
      ? 'implementation_ready'
      : acceptanceAchieved === 'planning-grade'
        ? 'planning_ready'
        : 'open';
  const acceptanceState = buildAcceptanceState(
    targetAcceptance,
    acceptanceAchieved,
    targetSatisfied,
    blockingReasons,
  );
  const closureState: AssessmentClosure = {
    status: closureStatus,
    reason:
      closureStatus === 'implementation_ready'
        ? 'No hard-fails remain and the score reaches implementation-grade.'
        : closureStatus === 'planning_ready'
          ? 'No hard-fails remain and the run is fit for planning.'
          : 'Hard-fails, incomplete mandatory artifacts, review gaps, or insufficient score keep the run open.',
  };
  const rebaselineReadinessReasons: string[] = [];
  if (!driftState.rebaselineRequired) {
    rebaselineReadinessReasons.push('Baseline drift is not detected, so rebaseline is not needed.');
  } else {
    if (assessmentStatus !== 'pass') {
      rebaselineReadinessReasons.push('Assessment must pass before rebaseline is allowed.');
    }
    if (uniqueHardFails.length > 0) {
      rebaselineReadinessReasons.push(
        'Hard-fail validation issues must be resolved before rebaseline.',
      );
    }
    if (driftState.staleItems.length > 0) {
      rebaselineReadinessReasons.push(`Stale items remain: ${driftState.staleItems.join(', ')}.`);
    }
    if (staleProofs.size > 0) {
      rebaselineReadinessReasons.push(
        `Stale proofs remain: ${[...staleProofs].sort().join(', ')}.`,
      );
    }
    if (staleReviewArtifacts.length > 0) {
      rebaselineReadinessReasons.push(
        `Stale review artifacts remain: ${[...staleReviewArtifacts].sort().join(', ')}.`,
      );
    }
    if (missingRequiredReviews.length > 0) {
      rebaselineReadinessReasons.push(
        `Missing required review roles remain: ${[...new Set(missingRequiredReviews)].sort().join(', ')}.`,
      );
    }
    if (pendingTrackProofReviews.length > 0) {
      rebaselineReadinessReasons.push(
        `Pending track-proof reviews remain: ${[...new Set(pendingTrackProofReviews)].sort().join(', ')}.`,
      );
    }
    if (trackGateFailures.length > 0) {
      rebaselineReadinessReasons.push(
        `Track gate failures remain: ${[...new Set(trackGateFailures)].sort().join(', ')}.`,
      );
    }
  }
  const rebaselineReadiness = !driftState.rebaselineRequired
    ? {
        status: 'not_needed' as const,
        reasons: rebaselineReadinessReasons,
      }
    : rebaselineReadinessReasons.length === 0
      ? {
          status: 'allowed' as const,
          reasons: [],
        }
      : {
          status: 'blocked' as const,
          reasons: rebaselineReadinessReasons,
        };
  if (staleReviewArtifacts.length > 0) {
    nextActions.push(`Refresh stale review artifacts: ${staleReviewArtifacts.join(', ')}.`);
  }

  const deltaSummary = {
    ...driftState.deltaSummary,
    stale_review_artifact_ids: [...staleReviewArtifacts].sort(),
  };

  const assessment: AssessmentFile = {
    schema_version: SCHEMA_VERSION,
    run_id: manifest.run_id ?? path.basename(runDir),
    assessed_at: assessedAt,
    status: assessmentStatus,
    errors,
    warnings,
    hard_fails: uniqueHardFails,
    lint_findings: [...new Set(lintFindings)],
    stale_proofs: [...new Set([...staleProofs])],
    stale_items: driftState.staleItems,
    stale_claims: driftState.staleClaims,
    stale_review_artifacts: [...staleReviewArtifacts].sort(),
    track_gate_failures: [...new Set(trackGateFailures)],
    required_review_roles: [...requiredReviewRoles].sort(),
    present_review_roles: presentReviewRoles,
    missing_review_roles: [...new Set(missingRequiredReviews)].sort(),
    pending_track_proof_reviews: [...new Set(pendingTrackProofReviews)].sort(),
    waiver_findings: [...new Set(waiverFindings)],
    invalid_waiver_ids: [...invalidWaiverIds].sort(),
    next_actions: [...new Set(nextActions)],
    score,
    acceptance: acceptanceState,
    closure: closureState,
    rebaseline_readiness: rebaselineReadiness,
    stats: {
      sources_total: countUniqueIds(backlog.source_authority, (entry) => entry.source_id),
      claims_total: countUniqueIds(backlog.claims, (entry) => entry.claim_id),
      contracts_total: countUniqueIds(backlog.contracts, (entry) => entry.contract_id),
      data_domains_total: countUniqueIds(backlog.data_domains, (entry) => entry.domain_id),
      items_total: uniqueItemsById.size,
      items_delivered: [...uniqueItemsById.values()].filter(
        (item) => item.delivery_state === 'delivered',
      ).length,
      items_partially_delivered: [...uniqueItemsById.values()].filter(
        (item) => item.delivery_state === 'partially_delivered',
      ).length,
      items_not_started: [...uniqueItemsById.values()].filter(
        (item) => item.delivery_state === 'not_started',
      ).length,
      gaps_total: countUniqueIds(backlog.gaps, (entry) => entry.issue_id),
      unknowns_total: countUniqueIds(backlog.unknowns, (entry) => entry.issue_id),
      contradictions_total: countUniqueIds(backlog.contradictions, (entry) => entry.issue_id),
      stale_claims_total: new Set(driftState.staleClaims).size,
      stale_items_total: staleItemIds.size,
      stale_proofs_total: staleProofIds.size,
      stale_review_artifacts_total: staleReviewArtifacts.length,
      warnings_total: warnings.length,
      hard_fails_total: uniqueHardFails.length,
      dor_ready_total: [...uniqueItemsById.values()].filter(
        (item) => item.readiness_state === 'ready',
      ).length,
      review_artifacts_total: countUniqueIds(backlog.reviews, (entry) => entry.review_id),
      waivers_total: countUniqueIds(backlog.waivers, (entry) => entry.waiver_id),
    },
    delta_summary: deltaSummary,
    rebaseline_required: driftState.rebaselineRequired,
  };

  writeJson(paths.assessment, assessment);

  manifest.updated_at = assessment.assessed_at;
  manifest.last_assessment_status = assessment.status;
  manifest.current_source_hashes = driftState.currentSourceHashes;
  manifest.current_canonical_hashes = driftState.currentCanonicalHashes;
  manifest.current_issue_item_links = driftState.currentIssueItemLinks;
  manifest.dirty_flags = driftState.deltaSummary.dirty_flags;
  if (!driftState.baselineEstablished || !hasBaselineIssueItemLinksSnapshot) {
    manifest.baseline_source_hashes = driftState.baselineSourceHashes;
    manifest.baseline_canonical_hashes = driftState.baselineCanonicalHashes;
    manifest.baseline_issue_item_links = driftState.baselineIssueItemLinks;
  }
  if (assessment.status === 'pass' && !['rendered', 'closed'].includes(manifest.phase_state)) {
    manifest.phase_state = 'validated';
  }
  writeJson(paths.manifest, manifest);
  const recordedWaiverIds = new Set(
    journalEvents
      .filter((event) => event.event === 'waiver_recorded')
      .map((event) => event.waiver_id)
      .filter((waiverId): waiverId is string => isNonEmptyString(waiverId)),
  );
  const closedTrackIds = new Set(
    journalEvents
      .filter((event) => event.event === 'track_closed')
      .map((event) => event.track_id)
      .filter((trackId): trackId is string => isNonEmptyString(trackId)),
  );
  for (const waiver of backlog.waivers) {
    if (!isNonEmptyString(waiver.waiver_id) || recordedWaiverIds.has(waiver.waiver_id)) {
      continue;
    }
    appendNdjson(paths.journal, {
      ts: assessment.assessed_at,
      event: 'waiver_recorded',
      run_id: assessment.run_id,
      ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
      waiver_id: waiver.waiver_id,
      waived_role: waiver.waived_role ?? null,
      scope: formatGraphRef(waiver.scope),
      valid: !invalidWaiverIds.has(waiver.waiver_id),
      impacted_surfaces: asArray(waiver.impacted_surfaces),
    });
  }
  for (const track of backlog.tracks) {
    if (
      !isNonEmptyString(track.track_id) ||
      track.closure_state !== 'closed' ||
      closedTrackIds.has(track.track_id)
    ) {
      continue;
    }
    appendNdjson(paths.journal, {
      ts: assessment.assessed_at,
      event: 'track_closed',
      run_id: assessment.run_id,
      ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
      track_id: track.track_id,
      summary_label: track.summary_label ?? null,
      track_proof_refs: asArray(track.track_proof_refs),
    });
  }
  appendNdjson(paths.journal, {
    ts: assessment.assessed_at,
    event: 'run_validated',
    run_id: assessment.run_id,
    ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
    status: assessment.status,
    achieved_acceptance: assessment.acceptance.achieved,
    score: assessment.score.total,
    error_count: errors.length,
    warning_count: warnings.length,
    issue_resolution_snapshot: {
      gaps: buildIssueResolutionSnapshot(backlog.gaps),
      unknowns: buildIssueResolutionSnapshot(backlog.unknowns),
    },
  });

  return {
    errors,
    missingArtifacts: [],
    runDir,
    assessment,
    warnings,
  };
}
