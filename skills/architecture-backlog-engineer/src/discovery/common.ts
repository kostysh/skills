import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SCHEMA_VERSION = '3';

export const PHASE_STATES = [
  'initialized',
  'sources_resolved',
  'target_reconstructed',
  'as_built_reconstructed',
  'claims_extracted',
  'graph_built',
  'sliced',
  'validated',
  'rendered',
  'closed',
] as const;

export const ACCEPTANCE_CLASSES = ['draft-only', 'planning-grade', 'implementation-grade'] as const;
export const ASSESSMENT_STATUSES = ['not-run', 'pass', 'fail'] as const;
export const ITEM_CLASSES = [
  'capability_seam',
  'feature_slice',
  'control_guardrail',
  'migration',
  'retirement',
  'spike_discovery',
  'operational_enablement',
  'documentation_support_enablement',
] as const;
export const RELATION_TYPES = [
  'realizes',
  'decomposes_into',
  'depends_on',
  'blocked_by',
  'governed_by',
  'migrates_from',
  'retires',
  'replaces',
  'proves',
  'reviewed_by',
  'belongs_to_track',
  'touches_contract',
  'touches_data_domain',
  'enabled_by',
] as const;
export const SUMMARY_LABELS = [
  'Implemented',
  'Partially implemented',
  'Planned',
  'Missing',
  'Blocked',
  'Needs clarification',
] as const;
export const BACKLOG_PROTOCOL_STATES = [
  'candidate',
  'discovered',
  'validated',
  'accepted',
] as const;
export const DELIVERY_STATES = ['not_started', 'partially_delivered', 'delivered'] as const;
export const READINESS_STATES = ['not_ready', 'needs_clarification', 'ready'] as const;
export const ITEM_CLOSURE_STATES = ['open', 'partial', 'closed'] as const;
export const COMPATIBILITY_CLASSES = ['backward', 'forward', 'breaking'] as const;
export const ROLLOUT_MODES = ['dark_launch', 'canary', 'shadow', 'phased', 'big_bang'] as const;
export const ROLLBACK_CLASSES = [
  'deploy_rollback',
  'config_secret_rollback',
  'schema_data_rollback',
  'forward_fix_only',
  'backup_restore',
  'replay_rebuild',
  'no_safe_rollback',
] as const;
export const UNCERTAINTY_CLASSES = [
  'decision_unknown',
  'integration_unknown',
  'scale_unknown',
  'security_unknown',
  'policy_unknown',
  'data_unknown',
  'operability_unknown',
] as const;
export const ORIGIN_REF_KINDS = [
  'claim_ref',
  'gap_ref',
  'control_obligation_ref',
  'policy_decision_ref',
  'decommission_need_ref',
  'review_finding_ref',
  'unknown_ref',
] as const;
export const CLAIM_COMMITMENTS = ['committed', 'deferred', 'optional', 'out_of_scope'] as const;
export const CLAIM_CLASSES = [
  'functional_capability',
  'control_obligation',
  'interface_contract',
  'data_evolution',
  'migration',
  'retirement',
  'operational_capability',
  'policy_decision_need',
] as const;
export const REVIEW_ROLES = [
  'product_strategy',
  'system_architecture',
  'application_engineering',
  'platform_sre',
  'support_operations',
  'security',
  'qa_release',
] as const;
export const REVIEW_VERDICTS = ['pass', 'pass_with_findings', 'fail'] as const;
export const REVIEW_SCOPES = ['item', 'run', 'track_proof'] as const;
export const GRAPH_REF_KINDS = [
  'run',
  'item',
  'track',
  'track_proof',
  'proof',
  'review',
  'contract',
  'data_domain',
  'value_stream',
] as const;
export const SOURCE_KINDS = [
  'architecture_doc',
  'adr',
  'runtime_evidence',
  'deployment_contract',
  'delivered_dossier_ssot',
  'code_evidence',
  'operational_evidence',
  'backlog_text',
] as const;
export const SOURCE_AUTHORITIES = [
  'authoritative_target_truth',
  'authoritative_current_truth',
  'historical_context_only',
  'superseded_excluded',
  'planning_only',
] as const;
export const APPLICABILITY_STATUSES = ['required', 'not_applicable'] as const;
export const PROOF_DIMENSION_STATUSES = ['present', 'missing', 'not_applicable'] as const;
export const PROOF_DIMENSION_KEYS = [
  'architecture_trace',
  'implementation_trace',
  'verification_trace',
  'security_trace',
  'release_trace',
  'rollback_or_recovery_trace',
  'operability_trace',
] as const;
export const TRACK_GATE_FAIL_MODES = ['fail_open', 'fail_closed'] as const;
export const DRIFT_CAUSES = [
  'source_change',
  'contract_change',
  'topology_change',
  'track_gate_change',
  'incident_false_closure',
  'security_finding',
  'nfr_breach',
  'external_dependency_change',
  'owner_boundary_change',
  'release_path_change',
] as const;
export const NEGATIVE_SCOPE_CLASSES = [
  'optional',
  'future',
  'manual',
  'trusted_local_only',
  'compatibility_only',
  'stub',
  'health_only',
  'out_of_scope',
] as const;
export const POLICY_DECISION_STATES = ['required', 'decided', 'waived', 'deferred'] as const;
export const DEPENDENCY_CRITICALITIES = ['boot_critical', 'degraded', 'optional'] as const;
export const ISSUE_RESOLUTION_STATES = ['open', 'resolved', 'downgraded'] as const;
export const TRACK_PROOF_COVERAGE_KEYS = [
  'boot_startup_dependencies',
  'end_to_end_journey',
  'operator_control_path',
  'degraded_mode_exercise',
  'release_gate_execution',
  'rollback_or_recovery_rehearsal',
  'observability_and_alert_routing',
  'runbook_and_escalation_path',
] as const;

export type PhaseState = (typeof PHASE_STATES)[number];
export type AcceptanceClass = (typeof ACCEPTANCE_CLASSES)[number];
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];
export type ItemClass = (typeof ITEM_CLASSES)[number];
export type RelationType = (typeof RELATION_TYPES)[number];
export type SummaryLabel = (typeof SUMMARY_LABELS)[number];
export type BacklogProtocolState = (typeof BACKLOG_PROTOCOL_STATES)[number];
export type DeliveryState = (typeof DELIVERY_STATES)[number];
export type ReadinessState = (typeof READINESS_STATES)[number];
export type ItemClosureState = (typeof ITEM_CLOSURE_STATES)[number];
export type CompatibilityClass = (typeof COMPATIBILITY_CLASSES)[number];
export type RolloutMode = (typeof ROLLOUT_MODES)[number];
export type RollbackClass = (typeof ROLLBACK_CLASSES)[number];
export type UncertaintyClass = (typeof UNCERTAINTY_CLASSES)[number];
export type OriginRefKind = (typeof ORIGIN_REF_KINDS)[number];
export type ClaimCommitment = (typeof CLAIM_COMMITMENTS)[number];
export type ClaimClass = (typeof CLAIM_CLASSES)[number];
export type ReviewRole = (typeof REVIEW_ROLES)[number];
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];
export type ReviewScope = (typeof REVIEW_SCOPES)[number];
export type GraphRefKind = (typeof GRAPH_REF_KINDS)[number];
export type SourceKind = (typeof SOURCE_KINDS)[number];
export type SourceAuthorityClass = (typeof SOURCE_AUTHORITIES)[number];
export type SourceAccessStatus = 'ok' | 'inaccessible';
export type ApplicabilityStatus = (typeof APPLICABILITY_STATUSES)[number];
export type ProofDimensionStatus = (typeof PROOF_DIMENSION_STATUSES)[number];
export type ProofDimensionKey = (typeof PROOF_DIMENSION_KEYS)[number];
export type TrackGateFailMode = (typeof TRACK_GATE_FAIL_MODES)[number];
export type DriftCause = (typeof DRIFT_CAUSES)[number];
export type NegativeScopeClass = (typeof NEGATIVE_SCOPE_CLASSES)[number];
export type PolicyDecisionState = (typeof POLICY_DECISION_STATES)[number];
export type DependencyCriticality = (typeof DEPENDENCY_CRITICALITIES)[number];
export type IssueResolutionState = (typeof ISSUE_RESOLUTION_STATES)[number];
export type TrackProofCoverageKey = (typeof TRACK_PROOF_COVERAGE_KEYS)[number];

export interface Manifest {
  schema_version: string;
  run_id: string;
  created_at: string;
  updated_at: string;
  phase_state: PhaseState;
  acceptance_target: AcceptanceClass;
  baseline_source_hashes: Record<string, string>;
  current_source_hashes: Record<string, string>;
  baseline_canonical_hashes: Record<string, string>;
  current_canonical_hashes: Record<string, string>;
  baseline_issue_item_links?: Record<string, string[]>;
  current_issue_item_links?: Record<string, string[]>;
  dirty_flags: DriftCause[];
  last_assessment_status: AssessmentStatus;
  last_render_at: string | null;
  last_delta_at: string | null;
  last_rebaseline_at: string | null;
  last_rebaseline_causes: DriftCause[];
  legacy_layout_detected: boolean;
}

export interface GraphRef {
  kind?: GraphRefKind;
  id?: string;
}

export interface SourceAuthorityRef {
  source_id?: string;
  ref?: string;
  kind?: SourceKind;
  authority?: SourceAuthorityClass;
  precedence?: number;
  fingerprint?: string;
  notes?: string;
  last_access_status?: SourceAccessStatus;
  last_accessed_at?: string;
  last_access_error?: string | null;
}

export interface SourceExclusion {
  source_id?: string;
  reason?: string;
  superseded_by?: string[];
}

export interface TargetSystemModel {
  actors: string[];
  operator_personas: string[];
  external_consumer_groups: string[];
  external_dependencies: string[];
  trust_boundaries: string[];
  durable_state_families: string[];
  control_surfaces: string[];
  failure_domains: string[];
  team_and_ownership_assumptions: string[];
  quality_goals: string[];
  policy_surfaces: string[];
}

export interface AsBuiltDependencyClassification {
  dependency_id?: string;
  criticality?: DependencyCriticality;
  owner?: string;
}

export interface AsBuiltModel {
  deployable_surfaces: string[];
  services: string[];
  processes: string[];
  jobs: string[];
  apis: string[];
  event_surfaces: string[];
  queues: string[];
  state_stores: string[];
  deployable_units: string[];
  ownership_matrix: string[];
  environment_matrix: string[];
  ingress_interfaces: string[];
  egress_interfaces: string[];
  canonical_writers: string[];
  trust_boundary_crossings: string[];
  data_classes: string[];
  dependency_classifications: AsBuiltDependencyClassification[];
  synthetic_behaviors: string[];
  compatibility_only_behaviors: string[];
  vendor_external_owners: string[];
  missing_operational_inputs: string[];
}

export interface ArchitectureClaim {
  claim_id?: string;
  title?: string;
  claim_class?: ClaimClass;
  commitment?: ClaimCommitment;
  source_refs?: string[];
  revisit_trigger?: string | null;
  adr_refs?: string[];
}

export interface NegativeScopeEntry {
  negative_scope_id?: string;
  title?: string;
  negative_scope_class?: NegativeScopeClass;
  source_refs?: string[];
  owner_implications?: string[];
  related_claim_refs?: string[];
  related_item_refs?: string[];
  critical_path_item_refs?: string[];
  owner_seam_item_refs?: string[];
  revisit_trigger?: string | null;
}

export interface QualityAttributeEntry {
  quality_attribute_id?: string;
  title?: string;
  quality_class?: string;
  target?: string;
  applies_to_refs?: GraphRef[];
  owner_refs?: string[];
  source_refs?: string[];
  proof_refs?: string[];
}

export interface PolicyDecisionEntry {
  policy_decision_id?: string;
  title?: string;
  policy_surface?: string;
  decision_state?: PolicyDecisionState;
  owner?: string;
  source_refs?: string[];
  related_item_refs?: string[];
  revisit_trigger?: string | null;
}

export interface LedgerIssueEntry {
  issue_id?: string;
  title?: string;
  severity?: string;
  source_refs?: string[];
  owner_implications?: string[];
  related_claim_refs?: string[];
  related_item_refs?: string[];
  fail_closed_category?: boolean;
  resolution_state?: IssueResolutionState;
  downgraded_severity?: string | null;
  resolution_note?: string | null;
}

export interface UncertaintyToSpikeEntry {
  unknown_id?: string;
  spike_item_id?: string;
}

export interface DeliveredLineageNote {
  lineage_note_id?: string;
  item_id?: string;
  note?: string;
  proof_refs?: string[];
}

export interface OriginRef {
  kind?: OriginRefKind;
  ref?: string;
}

export interface Owners {
  decision_owner?: string;
  delivery_owner?: string;
  runtime_owner?: string;
  escalation_owner?: string;
  consulted_teams?: string[];
}

export interface ValueDescriptor {
  persona_or_operator_served?: string;
  product_or_operator_value?: string;
  why_now?: string;
  slice_value_kind?: 'user_value' | 'risk_retirement' | 'control_closure';
}

export interface PlanningConstraints {
  estimate_band?: string;
  confidence?: string;
  external_lead_time_risk?: string;
  staffing_skill_constraints?: string;
  blocked_by_decision_status?: boolean;
  dominant_uncertainty_class?: UncertaintyClass;
  dominant_rollback_class?: RollbackClass;
  blast_radius_note?: string;
  unresolved_questions_below_threshold?: boolean;
}

export interface ContractGovernance {
  applicable?: boolean;
  contract_owner?: string;
  compatibility_class?: CompatibilityClass;
  versioning_strategy?: string;
  consumer_impact?: string;
  migration_strategy?: string;
  canonical_writer?: string;
  reconciliation_strategy?: string;
  deprecation_window?: string;
  retirement_condition?: string;
}

export interface NfrContract {
  latency?: string;
  throughput?: string;
  concurrency?: string;
  availability?: string;
  durability?: string;
  rpo?: string;
  rto?: string;
  cost_budget?: string;
  privacy_compliance_class?: string;
  accessibility_localization_duty?: string;
  auditability_traceability?: string;
  scalability_envelope?: string;
}

export interface ObservabilityContract {
  sli_slo?: string[];
  alert_thresholds?: string[];
  audit_requirements?: string[];
  security_controls?: string[];
  privacy_controls?: string[];
  analytics_obligations?: string[];
  monitoring_evidence_refs?: string[];
  dashboards?: string[];
  runbook_refs?: string[];
  telemetry_signals?: string[];
  bypass_governance?: string | null;
  residual_exceptions?: string[];
}

export interface RolloutTemporaryControl {
  control_id?: string;
  description?: string;
  retirement_owner?: string;
  retirement_date?: string;
}

export interface RolloutContract {
  applicability?: ApplicabilityStatus;
  mode?: RolloutMode | null;
  feature_flag?: string;
  kill_switch?: string;
  temporary_controls?: RolloutTemporaryControl[];
  justification?: string | null;
}

export interface RecoveryContract {
  applicability?: ApplicabilityStatus;
  class?: RollbackClass | null;
  strategy?: string;
  justification?: string | null;
  rehearsal_proof_refs?: string[];
}

export interface ReadinessContract {
  behavior_described?: boolean;
  happy_path_defined?: boolean;
  error_paths_defined?: boolean;
  acceptance_examples_defined?: boolean;
  interface_data_impact_described?: boolean;
  nfr_impact_known?: boolean;
  security_privacy_impact_known?: boolean;
  rollout_defined?: boolean;
  recovery_defined?: boolean;
  observability_contract_defined?: boolean;
  required_proof_defined?: boolean;
  docs_support_impact_described?: boolean;
  estimate_band_defined?: boolean;
  confidence_defined?: boolean;
  unresolved_questions_below_threshold?: boolean;
  exemptions?: Record<string, string>;
  class_specific_checks?: Record<string, boolean>;
}

export interface DoneContract {
  code_and_infra_complete?: boolean;
  tests_and_verification_complete?: boolean;
  dashboards_alerts_traces_logging_present?: boolean;
  runbooks_and_support_handoff_present?: boolean;
  migration_execution_or_safe_schedule_complete?: boolean;
  release_notes_and_docs_updated?: boolean;
  flags_and_kill_switches_governed?: boolean;
  temporary_mechanism_retirement_recorded?: boolean;
  exemptions?: Record<string, string>;
  class_specific_checks?: Record<string, boolean>;
}

export interface ProofDimension {
  status?: ProofDimensionStatus;
  justification?: string | null;
  command?: string | null;
  artifact?: string | null;
  procedure?: string | null;
}

export type ProofDimensions = Partial<Record<ProofDimensionKey, ProofDimension>>;

export interface ReviewFinding {
  finding_id?: string;
  severity?: string;
  title?: string;
  detail?: string;
}

export interface ReviewArtifact extends Record<string, unknown> {
  review_id?: string;
  review_scope?: ReviewScope;
  reviewed_ref?: GraphRef;
  reviewer?: string;
  role?: ReviewRole;
  independent?: boolean;
  verdict?: ReviewVerdict;
  findings?: ReviewFinding[];
  hard_fail_report?: ReviewFinding[];
  evidence_refs?: string[];
  score_contribution?: number;
  reviewed_at?: string;
}

export interface Waiver {
  waiver_id?: string;
  waived_role?: ReviewRole;
  scope?: GraphRef;
  granting_authority?: string;
  rationale?: string;
  expiry_or_revisit_trigger?: string;
  impacted_surfaces?: string[];
  valid?: boolean;
}

export interface DiscoveryItem extends Record<string, unknown> {
  item_id?: string;
  item_class?: ItemClass;
  track_id?: string;
  milestone?: string;
  backlog_protocol_state?: BacklogProtocolState;
  delivery_state?: DeliveryState;
  readiness_state?: ReadinessState;
  closure_state?: ItemClosureState;
  summary_label?: SummaryLabel;
  title?: string;
  origin_ref?: OriginRef[];
  owners?: Owners;
  proof_refs?: string[];
  dependency_refs?: string[];
  claim_refs?: string[];
  adr_refs?: string[];
  policy_decision_refs?: string[];
  change_surfaces?: string[];
  interfaces_touched?: string[];
  data_domains_touched?: string[];
  trust_boundaries_crossed?: string[];
  actor_role_set?: string[];
  data_class?: string | null;
  value?: ValueDescriptor | null;
  planning_constraints?: PlanningConstraints | null;
  evidence_freshness_sla?: string;
  contract_governance?: ContractGovernance | null;
  nfr_contract?: NfrContract | null;
  observability_contract?: ObservabilityContract | null;
  rollout?: RolloutContract | null;
  recovery?: RecoveryContract | null;
  readiness_contract?: ReadinessContract | null;
  done_contract?: DoneContract | null;
  class_payload?: Record<string, unknown> | null;
  architectural_scope?: string;
  blocked_without?: string;
  risks_gaps?: string;
  economic_priority_note?: string;
  capability_added?: string;
  dependencies?: string[];
  estimate_band?: string;
  confidence?: string;
  rollout_mode?: RolloutMode;
  rollback_class?: RollbackClass;
  n_a_justification?: string;
  compatibility_class?: CompatibilityClass;
  migration_strategy?: string;
  canonical_writer?: string;
  consumer_impact?: string;
  owner_surfaces?: string[];
  real_closure_definition?: string;
  parent_seam_id?: string;
  persona?: string;
  acceptance_examples?: string[];
  why_now?: string;
  control_objective?: string;
  enforcing_surface?: string;
  fail_mode?: string;
  source_state?: string;
  target_state?: string;
  replaces_or_retires_ref?: string;
  retirement_trigger?: string;
  legacy_assets?: string[];
  uncertainty_class?: UncertaintyClass;
  question?: string;
  validation_method?: string;
  expected_artifact?: string;
  max_duration?: string;
  exit_criteria?: string;
  kill_criteria?: string;
  follow_on_item_refs?: string[];
  runbook_or_enablement_artifact?: string;
  operational_audience?: string;
  doc_audience?: string;
  doc_scope?: string;
  source_of_truth_artifact?: string;
  freshness_update_trigger?: string;
  stop_go_checkpoint?: string;
  dependent_consumers?: string[];
  cleanup_scope?: string[];
}

export interface DiscoveryRelation extends Record<string, unknown> {
  relation_id?: string;
  relation_type?: RelationType;
  from?: GraphRef;
  to?: GraphRef;
}

export interface ContractLedgerEntry {
  contract_id?: string;
  title?: string;
  owner?: string;
  versioning_strategy?: string;
  reconciliation_strategy?: string;
  deprecation_window?: string;
  retirement_condition?: string;
}

export interface DataDomain {
  domain_id?: string;
  title?: string;
  data_class?: string;
  owners?: string[];
}

export interface ProofBundle extends Record<string, unknown> {
  proof_id?: string;
  covered_ref?: GraphRef;
  covered_commit_or_build?: string;
  environment?: string;
  executed_at?: string;
  freshness_rule?: string;
  fresh_until?: string | null;
  invalidated_by?: string[];
  dimensions?: ProofDimensions;
  title?: string;
}

export interface TrackProofCoverage {
  boot_startup_dependencies: boolean;
  end_to_end_journey: boolean;
  operator_control_path: boolean;
  degraded_mode_exercise: boolean;
  release_gate_execution: boolean;
  rollback_or_recovery_rehearsal: boolean;
  observability_and_alert_routing: boolean;
  runbook_and_escalation_path: boolean;
}

export interface TrackProof {
  track_proof_id?: string;
  track_id?: string;
  proof_refs?: string[];
  coverage?: TrackProofCoverage;
}

export interface Track {
  track_id: string;
  title: string;
  description?: string;
  closure_goal?: string;
  backlog_protocol_state?: BacklogProtocolState;
  delivery_state?: DeliveryState;
  readiness_state?: ReadinessState;
  closure_state?: ItemClosureState;
  summary_label?: SummaryLabel;
  first_shippable_journey_ids?: string[];
  required_track_gate_ids?: string[];
  track_proof_refs?: string[];
}

export interface ValueStream {
  value_stream_id: string;
  title: string;
  description: string;
  primary_personas: string[];
  initiating_triggers: string[];
  workflow_steps: string[];
  success_conditions: string[];
  support_handoff: string;
  linked_track_ids: string[];
}

export interface TrackJourney {
  journey_id?: string;
  track_id?: string;
  value_stream_id?: string;
  persona?: string;
  trigger?: string;
  workflow_steps?: string[];
  success_condition?: string;
  support_handoff?: string;
}

export interface TrackGate {
  track_gate_id?: string;
  track_id?: string;
  title?: string;
  description?: string;
  gate_type?: string;
  fail_mode?: TrackGateFailMode;
  governing_control_item_refs?: string[];
  owner_refs?: string[];
  required_proof_refs?: string[];
  applies_to_journey_ids?: string[];
  recalculation_triggers?: string[];
}

export interface RoadmapDependencyEntry {
  ref?: GraphRef;
  dependency_type?: RelationType | 'parent' | 'child';
}

export interface RoadmapMatrixEntry {
  row_id?: string;
  item_ref?: GraphRef;
  item_class?: ItemClass;
  parent_refs?: GraphRef[];
  child_refs?: GraphRef[];
  track_ref?: GraphRef;
  dependency_refs?: GraphRef[];
  dependency_type?: string;
  dependency_entries?: RoadmapDependencyEntry[];
  milestone?: string;
  backlog_protocol_state?: BacklogProtocolState;
  delivery_state?: DeliveryState;
  readiness_state?: ReadinessState;
  closure_state?: ItemClosureState;
  summary_label?: SummaryLabel;
  economic_priority_note?: string;
  economic_factors?: string[];
  proof_refs?: string[];
  retirement_ref?: GraphRef | null;
  topology_rank?: number;
  safety_rank?: number;
  economic_rank?: number;
}

export interface BacklogFile {
  metadata: {
    schema_version: string;
    run_id: string;
    created_at: string;
    updated_at: string;
  };
  glossary: Record<string, string>;
  aliases: Record<string, string[]>;
  id_strategy: Record<string, string>;
  source_authority: SourceAuthorityRef[];
  source_exclusions: SourceExclusion[];
  target_system: TargetSystemModel;
  value_streams: ValueStream[];
  tracks: Track[];
  track_gates: TrackGate[];
  track_journeys: TrackJourney[];
  as_built: AsBuiltModel;
  claims: ArchitectureClaim[];
  negative_scope: NegativeScopeEntry[];
  quality_attributes: QualityAttributeEntry[];
  policy_decisions: PolicyDecisionEntry[];
  contracts: ContractLedgerEntry[];
  data_domains: DataDomain[];
  gaps: LedgerIssueEntry[];
  contradictions: LedgerIssueEntry[];
  unknowns: LedgerIssueEntry[];
  uncertainty_to_spike: UncertaintyToSpikeEntry[];
  delivered_lineage_notes: DeliveredLineageNote[];
  items: DiscoveryItem[];
  relations: DiscoveryRelation[];
  proofs: ProofBundle[];
  track_proofs: TrackProof[];
  reviews: ReviewArtifact[];
  waivers: Waiver[];
  roadmap_matrix: RoadmapMatrixEntry[];
}

export interface ScoreSection {
  id: string;
  label: string;
  max: number;
  score: number;
  reason: string;
}

export interface DeltaSummary {
  baseline_established: boolean;
  changed_source_ids: string[];
  changed_claim_ids: string[];
  stale_claim_ids: string[];
  stale_item_ids: string[];
  stale_proof_ids: string[];
  stale_review_artifact_ids: string[];
  track_gate_ids_to_recalculate: string[];
  dirty_flags: DriftCause[];
  topology_changed: boolean;
  contract_changed: boolean;
  changed_track_gate_ids: string[];
}

export interface AssessmentStats {
  sources_total: number;
  claims_total: number;
  contracts_total: number;
  data_domains_total: number;
  items_total: number;
  items_delivered: number;
  items_partially_delivered: number;
  items_not_started: number;
  gaps_total: number;
  unknowns_total: number;
  contradictions_total: number;
  stale_claims_total: number;
  stale_items_total: number;
  stale_proofs_total: number;
  stale_review_artifacts_total: number;
  warnings_total: number;
  hard_fails_total: number;
  dor_ready_total: number;
  review_artifacts_total: number;
  waivers_total: number;
}

export interface RebaselineReadiness {
  status: 'allowed' | 'blocked' | 'not_needed';
  reasons: string[];
}

export interface AssessmentAcceptance {
  target: AcceptanceClass;
  achieved: AcceptanceClass;
  target_satisfied: boolean;
  blocking_reasons: string[];
}

export interface AssessmentClosure {
  status: 'open' | 'planning_ready' | 'implementation_ready';
  reason: string;
}

export interface AssessmentFile {
  schema_version: string;
  run_id: string;
  assessed_at: string;
  status: AssessmentStatus;
  errors: string[];
  warnings: string[];
  hard_fails: string[];
  lint_findings: string[];
  stale_proofs: string[];
  stale_items: string[];
  stale_claims: string[];
  stale_review_artifacts: string[];
  track_gate_failures: string[];
  required_review_roles: ReviewRole[];
  present_review_roles: ReviewRole[];
  missing_review_roles: ReviewRole[];
  pending_track_proof_reviews: string[];
  waiver_findings: string[];
  invalid_waiver_ids: string[];
  next_actions: string[];
  score: {
    total: number;
    max: number;
    sections: ScoreSection[];
  };
  acceptance: AssessmentAcceptance;
  closure: AssessmentClosure;
  delta_summary: DeltaSummary;
  rebaseline_required: boolean;
  rebaseline_readiness: RebaselineReadiness;
  stats: AssessmentStats;
}

export function createEmptyDeltaSummary(): DeltaSummary {
  return {
    baseline_established: false,
    changed_source_ids: [],
    changed_claim_ids: [],
    stale_claim_ids: [],
    stale_item_ids: [],
    stale_proof_ids: [],
    stale_review_artifact_ids: [],
    track_gate_ids_to_recalculate: [],
    dirty_flags: [],
    topology_changed: false,
    contract_changed: false,
    changed_track_gate_ids: [],
  };
}

export function createEmptyAssessmentStats(): AssessmentStats {
  return {
    sources_total: 0,
    claims_total: 0,
    contracts_total: 0,
    data_domains_total: 0,
    items_total: 0,
    items_delivered: 0,
    items_partially_delivered: 0,
    items_not_started: 0,
    gaps_total: 0,
    unknowns_total: 0,
    contradictions_total: 0,
    stale_claims_total: 0,
    stale_items_total: 0,
    stale_proofs_total: 0,
    stale_review_artifacts_total: 0,
    warnings_total: 0,
    hard_fails_total: 0,
    dor_ready_total: 0,
    review_artifacts_total: 0,
    waivers_total: 0,
  };
}

export interface CompactRunArtifacts {
  assessment: AssessmentFile | null;
  backlog: BacklogFile | null;
  legacyLayoutMessage?: string;
  manifest: Manifest | null;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export function isAcceptanceClass(value: string): value is AcceptanceClass {
  return ACCEPTANCE_CLASSES.includes(value as AcceptanceClass);
}

export function isGraphRefKind(value: string): value is GraphRefKind {
  return GRAPH_REF_KINDS.includes(value as GraphRefKind);
}

export function isGraphRef(value: unknown): value is GraphRef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as GraphRef;
  return (
    isNonEmptyString(candidate.kind) &&
    isGraphRefKind(candidate.kind) &&
    isNonEmptyString(candidate.id)
  );
}

export function graphRef(kind: GraphRefKind, id: string): GraphRef {
  return { kind, id };
}

export function formatGraphRef(ref: GraphRef | null | undefined): string {
  if (!ref || !isNonEmptyString(ref.kind) || !isNonEmptyString(ref.id)) {
    return 'unknown:unknown';
  }

  return `${ref.kind}:${ref.id}`;
}

export function graphRefKey(ref: GraphRef | null | undefined): string {
  return formatGraphRef(ref);
}

export function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function writeText(filePath: string, data: string): void {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, data, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function appendNdjson(filePath: string, event: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8');
}

export function loadNdjson<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (raw.length === 0) {
    return [];
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}

export function runPaths(runDir: string) {
  return {
    manifest: path.join(runDir, 'manifest.json'),
    backlog: path.join(runDir, 'backlog.json'),
    assessment: path.join(runDir, 'assessment.json'),
    journal: path.join(runDir, 'journal.ndjson'),
    report: path.join(runDir, 'report.md'),
  };
}

export function legacyRunPaths(runDir: string) {
  return {
    manifest: path.join(runDir, 'manifest.json'),
    state: path.join(runDir, 'state.snapshot.json'),
    validation: path.join(runDir, 'validation.json'),
    closure: path.join(runDir, 'closure.json'),
    journal: path.join(runDir, 'journal.ndjson'),
    views: path.join(runDir, 'views'),
  };
}

export function detectLegacyLayout(runDir: string): boolean {
  const paths = legacyRunPaths(runDir);
  return [paths.state, paths.validation, paths.closure, paths.views].some((filePath) =>
    fs.existsSync(filePath),
  );
}

export function legacyLayoutMessage(runDir: string): string {
  return [
    `Legacy discovery run layout detected at ${runDir}.`,
    'Schema v3 uses manifest.json, backlog.json, assessment.json, journal.ndjson, and report.md.',
    'This tool follows a pre-GA breaking cutover policy: rewrite the draft artifacts to schema v3 or re-initialize a new run directory before continuing.',
  ].join(' ');
}

export function unsupportedSchemaMessage(fileName: string): string {
  return [
    `Unsupported schema_version in ${fileName}.`,
    'This tool follows a pre-GA breaking cutover policy: rewrite the draft artifacts to schema v3 or re-initialize a new run directory before continuing.',
  ].join(' ');
}

export function loadCompactRunArtifacts(runDirInput: string): CompactRunArtifacts {
  const runDir = path.resolve(runDirInput);
  if (detectLegacyLayout(runDir)) {
    return {
      assessment: null,
      backlog: null,
      legacyLayoutMessage: legacyLayoutMessage(runDir),
      manifest: null,
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const paths = runPaths(runDir);
  const missingArtifacts = [paths.manifest, paths.backlog, paths.assessment, paths.journal].filter(
    (filePath) => !fs.existsSync(filePath),
  );

  if (missingArtifacts.length > 0) {
    return {
      assessment: null,
      backlog: null,
      manifest: null,
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const manifest = loadJson<Manifest>(paths.manifest);
  const backlog = loadJson<BacklogFile>(paths.backlog);
  const assessment = loadJson<AssessmentFile>(paths.assessment);
  const unsupportedSchemaMessages: string[] = [];

  if (manifest.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('manifest.json'));
  }
  if (backlog.metadata?.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('backlog.json'));
  }
  if (assessment.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('assessment.json'));
  }

  return {
    assessment,
    backlog,
    manifest,
    missingArtifacts: [],
    runDir,
    unsupportedSchemaMessages,
  };
}

export function hasOwnEntries(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function asStringRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export function formatOriginRef(ref: OriginRef): string {
  const kind = isNonEmptyString(ref.kind) ? ref.kind : 'unknown_ref';
  const value = isNonEmptyString(ref.ref) ? ref.ref : 'unknown';
  return `${kind}:${value}`;
}

export function createEmptyTargetSystemModel(): TargetSystemModel {
  return {
    actors: [],
    operator_personas: [],
    external_consumer_groups: [],
    external_dependencies: [],
    trust_boundaries: [],
    durable_state_families: [],
    control_surfaces: [],
    failure_domains: [],
    team_and_ownership_assumptions: [],
    quality_goals: [],
    policy_surfaces: [],
  };
}

export function createEmptyAsBuiltModel(): AsBuiltModel {
  return {
    deployable_surfaces: [],
    services: [],
    processes: [],
    jobs: [],
    apis: [],
    event_surfaces: [],
    queues: [],
    state_stores: [],
    deployable_units: [],
    ownership_matrix: [],
    environment_matrix: [],
    ingress_interfaces: [],
    egress_interfaces: [],
    canonical_writers: [],
    trust_boundary_crossings: [],
    data_classes: [],
    dependency_classifications: [],
    synthetic_behaviors: [],
    compatibility_only_behaviors: [],
    vendor_external_owners: [],
    missing_operational_inputs: [],
  };
}

export function parseTimestamp(value: string | null | undefined): number | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function hashJsonValue(value: unknown): string {
  return crypto.createHash('sha256').update(stableSerialize(value)).digest('hex');
}
