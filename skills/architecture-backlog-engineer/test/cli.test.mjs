import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'architecture-backlog.mjs');
const SKILL_DOC_PATH = path.join(SKILL_DIR, 'SKILL.md');
const OPERATOR_HELP_PATH = path.join(SKILL_DIR, 'docs', 'operator-use-cases.ru.md');
const OPERATOR_WORKFLOW_GROUPS = [
  'Create backlog',
  'Audit backlog',
  'Audit one item',
  'Edit backlog',
];
const OPERATOR_WORKFLOWS = [
  ['UC-01', 'Create backlog from one source'],
  ['UC-02', 'Create backlog from multiple sources'],
  ['UC-03', 'Create backlog with current truth'],
  ['UC-04', 'Draft backlog from incomplete architecture'],
  ['UC-05', 'Show structured backlog'],
  ['UC-06', 'Show backlog summary metrics'],
  ['UC-07', 'Show delivery state for all items'],
  ['UC-08', 'Show uncovered claims'],
  ['UC-09', 'Show ranked problem list'],
  ['UC-10', 'Show DoR-ready items'],
  ['UC-23', 'Show delta from baseline'],
  ['UC-24', 'Show stale items after drift'],
  ['UC-25', 'Show stale proofs and reviews'],
  ['UC-11', 'Show item summary'],
  ['UC-12', 'Show item details'],
  ['UC-13', 'Change general item data via explicit packet or updated inputs'],
  ['UC-14', 'Change question on linked Spike'],
  ['UC-15', 'Change Gap'],
  ['UC-16', 'Change Unknown'],
  ['UC-17', 'Create timeboxed Spike'],
  ['UC-18', 'Change owner'],
  ['UC-19', 'Change depends_on relation'],
  ['UC-20', 'Update delivery state from current truth'],
  ['UC-21', 'Mark architecture claim as deferred, optional, or negative scope'],
  ['UC-22', 'Fix roadmap order through graph relations'],
  ['UC-26', 'Set new baseline with rebaseline'],
  ['UC-27', 'Check rebaseline readiness'],
  ['UC-28', 'Check new stale after change'],
  ['UC-29', 'Add current truth to existing run'],
];
const FIXED_ASSESSMENT_STATS_KEYS = [
  'sources_total',
  'claims_total',
  'contracts_total',
  'data_domains_total',
  'items_total',
  'items_delivered',
  'items_partially_delivered',
  'items_not_started',
  'gaps_total',
  'unknowns_total',
  'contradictions_total',
  'stale_claims_total',
  'stale_items_total',
  'stale_proofs_total',
  'stale_review_artifacts_total',
  'warnings_total',
  'hard_fails_total',
  'dor_ready_total',
  'review_artifacts_total',
  'waivers_total',
];

function runCli(args) {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd: SKILL_DIR,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function createTempRunDir(t, name) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  t.after(() => {
    fs.rmSync(tempDir, { force: true, recursive: true });
  });
  return tempDir;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadNdjson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (raw.length === 0) {
    return [];
  }

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

function journalEventsByName(entries, eventName) {
  return entries.filter((entry) => entry.event === eventName);
}

function lastJournalEvent(entries, eventName) {
  return [...entries].reverse().find((entry) => entry.event === eventName);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function sha256Fingerprint(content) {
  return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

function ref(kind, id) {
  return { kind, id };
}

function countUniqueIds(entries, key) {
  return new Set(
    entries
      .map((entry) => entry[key])
      .filter((value) => typeof value === 'string' && value.length > 0),
  ).size;
}

function uniqueEntriesById(entries, key) {
  const unique = [];
  const seen = new Set();
  for (const entry of entries) {
    const value = entry[key];
    if (typeof value !== 'string' || value.length === 0 || seen.has(value)) {
      continue;
    }
    seen.add(value);
    unique.push(entry);
  }
  return unique;
}

function assertSubstringsInOrder(text, substrings) {
  let previousIndex = -1;
  for (const substring of substrings) {
    const currentIndex = text.indexOf(substring);
    assert.notEqual(
      currentIndex,
      -1,
      `Expected output to contain substring in order: ${substring}`,
    );
    assert.ok(
      currentIndex > previousIndex,
      `Expected substring ${substring} to appear after the previous section marker`,
    );
    previousIndex = currentIndex;
  }
}

function extractReportSection(report, heading) {
  const sectionHeading = `## ${heading}\n`;
  const sectionStart = report.indexOf(sectionHeading);
  assert.notEqual(sectionStart, -1, `Expected report to contain section: ${heading}`);
  const nextSectionStart = report.indexOf('\n## ', sectionStart + sectionHeading.length);
  const sectionEnd = nextSectionStart === -1 ? report.length : nextSectionStart;
  return report.slice(sectionStart, sectionEnd).replace(/\s+$/, '');
}

function buildProofDimensions() {
  return {
    architecture_trace: {
      status: 'present',
      artifact: 'docs/payments-architecture.md',
    },
    implementation_trace: {
      status: 'present',
      command: 'pnpm test payments',
    },
    verification_trace: {
      status: 'present',
      command: 'pnpm test payments',
    },
    security_trace: {
      status: 'present',
      artifact: 'artifacts/security-review.md',
    },
    release_trace: {
      status: 'present',
      procedure: 'release-checklist/payments',
    },
    rollback_or_recovery_trace: {
      status: 'present',
      procedure: 'runbooks/payments-rollback',
    },
    operability_trace: {
      status: 'present',
      artifact: 'runbooks/payments-operations.md',
    },
  };
}

function buildTrackProofCoverage() {
  return {
    boot_startup_dependencies: true,
    end_to_end_journey: true,
    operator_control_path: true,
    degraded_mode_exercise: true,
    release_gate_execution: true,
    rollback_or_recovery_rehearsal: true,
    observability_and_alert_routing: true,
    runbook_and_escalation_path: true,
  };
}

function buildReadinessContract() {
  return {
    behavior_described: true,
    happy_path_defined: true,
    error_paths_defined: true,
    acceptance_examples_defined: true,
    interface_data_impact_described: true,
    nfr_impact_known: true,
    security_privacy_impact_known: true,
    rollout_defined: true,
    recovery_defined: true,
    observability_contract_defined: true,
    required_proof_defined: true,
    docs_support_impact_described: true,
    estimate_band_defined: true,
    confidence_defined: true,
    unresolved_questions_below_threshold: true,
    class_specific_checks: {},
  };
}

function buildSpikeDoneContract(overrides = {}) {
  return {
    class_specific_checks: {
      promised_artifact_exists: false,
      outcome_recorded: false,
      follow_on_items_linked: true,
      silent_continuation_blocked: true,
      ...overrides,
    },
  };
}

function buildNfrContract(scope = 'payments') {
  return {
    latency: `p95 < 500ms for ${scope}`,
    throughput: `500 rps for ${scope}`,
    concurrency: `200 inflight for ${scope}`,
    availability: '99.95%',
    durability: `zero lost operations for ${scope}`,
    rpo: '5m',
    rto: '30m',
    cost_budget: `within current ${scope} budget`,
    privacy_compliance_class: 'pci-sensitive',
    accessibility_localization_duty: 'merchant dashboard localized and keyboard accessible',
    auditability_traceability: `${scope} transitions are fully audited`,
    scalability_envelope: `5x seasonal traffic for ${scope}`,
  };
}

function buildObservabilityContract(scope = 'payments') {
  return {
    sli_slo: [`${scope}-success-rate >= 99.9%`],
    alert_thresholds: [`${scope}-failure-rate > 1% for 5m`],
    audit_requirements: [`${scope} state transition audit log retained`],
    security_controls: ['signed webhook verification'],
    privacy_controls: ['PII redaction in logs'],
    analytics_obligations: [`${scope} funnel event emitted`],
    monitoring_evidence_refs: [`evidence:${scope}:monitoring`],
    dashboards: [`dashboard:${scope}`],
    runbook_refs: [`runbook:${scope}`],
    telemetry_signals: [`trace:${scope}`, `metric:${scope}`],
    bypass_governance: 'No bypass outside incident commander override.',
    residual_exceptions: ['none'],
  };
}

function buildContractGovernance() {
  return {
    applicable: true,
    contract_owner: 'payments-architecture',
    compatibility_class: 'backward',
    versioning_strategy: 'header-versioned',
    consumer_impact: 'merchant dashboard and provider adapter',
    migration_strategy: 'dual-write for one release',
    canonical_writer: 'payments-api',
    reconciliation_strategy: 'daily provider capture reconciliation',
    deprecation_window: '30d',
    retirement_condition: 'all merchants on v2 contract',
  };
}

function buildBaseTracks() {
  return [
    {
      track_id: 'minimal-working-system',
      title: 'Minimal working system',
      description: 'First runnable end-to-end payment system.',
      closure_goal: 'First runnable end-to-end system.',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      first_shippable_journey_ids: ['journey-payments-submit'],
      required_track_gate_ids: ['gate-payments-safe'],
      track_proof_refs: ['track-proof-payments'],
    },
    {
      track_id: 'externally-safe-operationally-supportable',
      title: 'Externally safe and operationally supportable system',
      description: 'Control, support, and observability closure for external operation.',
      closure_goal: 'Safe external operation with support and observability.',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      first_shippable_journey_ids: ['journey-payments-safety'],
      required_track_gate_ids: ['gate-payments-external-safety'],
      track_proof_refs: ['track-proof-payments-safety'],
    },
    {
      track_id: 'full-target-system',
      title: 'Full target system',
      description: 'Migration, retirement, and documentation closure for the target architecture.',
      closure_goal: 'The architecture target with all committed seams closed.',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      first_shippable_journey_ids: ['journey-payments-full-target'],
      required_track_gate_ids: ['gate-payments-full-target'],
      track_proof_refs: ['track-proof-payments-target'],
    },
  ];
}

function buildReviews(runId, { implementationGrade }) {
  const productVerdict = implementationGrade ? 'pass' : 'pass_with_findings';
  const architectureVerdict = implementationGrade ? 'pass' : 'pass_with_findings';
  const qaVerdict = implementationGrade ? 'pass' : 'pass_with_findings';
  const reviews = [
    {
      review_id: 'review-product',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'pm-1',
      role: 'product_strategy',
      independent: true,
      verdict: productVerdict,
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:product'],
      score_contribution: 8,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-architecture',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'arch-1',
      role: 'system_architecture',
      independent: true,
      verdict: architectureVerdict,
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:architecture'],
      score_contribution: 10,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-engineering',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'eng-1',
      role: 'application_engineering',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:engineering'],
      score_contribution: 10,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-qa',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'qa-1',
      role: 'qa_release',
      independent: true,
      verdict: qaVerdict,
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:qa'],
      score_contribution: 7,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-platform',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'sre-1',
      role: 'platform_sre',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:platform'],
      score_contribution: 10,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-security',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'sec-1',
      role: 'security',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:security'],
      score_contribution: 10,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-support',
      review_scope: 'run',
      reviewed_ref: ref('run', runId),
      reviewer: 'ops-1',
      role: 'support_operations',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:support'],
      score_contribution: 10,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-track-minimal',
      review_scope: 'track_proof',
      reviewed_ref: ref('track_proof', 'track-proof-payments'),
      reviewer: 'eng-track-1',
      role: 'application_engineering',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['proof-track-payments'],
      score_contribution: 5,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-track-safety',
      review_scope: 'track_proof',
      reviewed_ref: ref('track_proof', 'track-proof-payments-safety'),
      reviewer: 'sre-track-1',
      role: 'platform_sre',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['proof-track-payments-safety'],
      score_contribution: 5,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
    {
      review_id: 'review-track-target',
      review_scope: 'track_proof',
      reviewed_ref: ref('track_proof', 'track-proof-payments-target'),
      reviewer: 'ops-track-1',
      role: 'support_operations',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['proof-track-payments-target'],
      score_contribution: 5,
      reviewed_at: '2026-03-26T00:00:00Z',
    },
  ];

  return reviews;
}

function getEconomicFactorsForItem(item) {
  switch (item.value?.slice_value_kind) {
    case 'user_value':
      return ['strategic_fit', 'dependency_unlock', 'user_value', 'cost_of_delay'];
    case 'control_closure':
      return ['risk_burn_down', 'compliance_deadline', 'dependency_unlock'];
    case 'risk_retirement':
      return ['risk_burn_down', 'ops_pain_reduction', 'lead_time_risk'];
    default:
      return ['strategic_fit'];
  }
}

function buildRoadmapMatrix(items, relations) {
  const incomingByItemId = new Map();
  const outgoingByItemId = new Map();

  for (const relation of relations) {
    if (relation.from?.kind === 'item') {
      const current = outgoingByItemId.get(relation.from.id) ?? [];
      current.push(relation);
      outgoingByItemId.set(relation.from.id, current);
    }
    if (relation.to?.kind === 'item') {
      const current = incomingByItemId.get(relation.to.id) ?? [];
      current.push(relation);
      incomingByItemId.set(relation.to.id, current);
    }
  }

  return items.map((item, index) => {
    const incoming = incomingByItemId.get(item.item_id) ?? [];
    const outgoing = outgoingByItemId.get(item.item_id) ?? [];
    return {
      row_id: `roadmap-${item.item_id}`,
      item_ref: ref('item', item.item_id),
      item_class: item.item_class,
      parent_refs: incoming
        .filter((relation) => relation.relation_type === 'decomposes_into')
        .map((relation) => relation.from),
      child_refs: outgoing
        .filter((relation) => relation.relation_type === 'decomposes_into')
        .map((relation) => relation.to),
      track_ref: ref('track', item.track_id),
      dependency_refs: item.dependency_refs.map((dependencyRef) => ref('item', dependencyRef)),
      dependency_type: item.dependency_refs.length > 0 ? 'depends_on' : 'entry',
      dependency_entries: item.dependency_refs.map((dependencyRef) => ({
        ref: ref('item', dependencyRef),
        dependency_type: 'depends_on',
      })),
      milestone: item.milestone,
      backlog_protocol_state: item.backlog_protocol_state,
      delivery_state: item.delivery_state,
      readiness_state: item.readiness_state,
      closure_state: item.closure_state,
      summary_label: item.summary_label,
      economic_priority_note: item.economic_priority_note,
      economic_factors: getEconomicFactorsForItem(item),
      proof_refs: item.proof_refs,
      retirement_ref: outgoing.find((relation) => relation.relation_type === 'retires')?.to ?? null,
      topology_rank: index + 1,
      safety_rank: index + 1,
      economic_rank: index + 1,
    };
  });
}

function buildBaseBacklog(runId, { implementationGrade = false } = {}) {
  const economicNote = implementationGrade
    ? 'Explicit economics justify this landing order.'
    : 'Dependency unlock and bounded risk justify planning order.';
  const contractGovernance = buildContractGovernance();
  const items = [
    {
      item_id: 'item-payments-seam',
      item_class: 'capability_seam',
      track_id: 'minimal-working-system',
      milestone: 'M1',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Payments capability seam',
      claim_refs: ['claim-payments'],
      adr_refs: ['ADR-001'],
      origin_ref: [{ kind: 'claim_ref', ref: 'claim-payments' }],
      owners: {
        decision_owner: 'product',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-data'],
      },
      proof_refs: ['proof-payments-seam'],
      dependency_refs: [],
      change_surfaces: ['runtime'],
      interfaces_touched: ['contract-payments-api'],
      data_domains_touched: ['data-domain-payments'],
      trust_boundaries_crossed: ['public-api-to-provider'],
      actor_role_set: ['customer', 'operator'],
      data_class: 'pci-sensitive',
      value: {
        persona_or_operator_served: 'customer',
        product_or_operator_value: 'Accept customer invoice payments.',
        why_now: 'This seam unlocks the first runnable payment journey.',
        slice_value_kind: 'user_value',
      },
      planning_constraints: {
        estimate_band: 'M',
        confidence: 'medium',
        external_lead_time_risk: 'Provider contract activation',
        staffing_skill_constraints: 'Needs payment gateway and ledger support',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'integration_unknown',
        dominant_rollback_class: 'deploy_rollback',
        blast_radius_note: 'Checkout and receipts only',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: '7d unless contract or topology changes',
      contract_governance: contractGovernance,
      nfr_contract: buildNfrContract('payments-seam'),
      observability_contract: buildObservabilityContract('payments-seam'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v2_submission',
        kill_switch: 'disable_payments_v2_submission',
        temporary_controls: [
          {
            control_id: 'TMP-ALLOWLIST',
            description: 'Merchant allowlist during early rollout',
            retirement_owner: 'payments-team',
            retirement_date: '2026-05-01',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'deploy_rollback',
        strategy: 'Rollback service image and replay pending submissions',
        rehearsal_proof_refs: ['proof-payments-seam'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        capability_added: 'Accept customer invoice payments end to end',
        owner_surfaces: ['payments-api', 'payments-worker'],
        real_closure_definition: 'A customer pays an invoice and operators can reconcile outcomes.',
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-slice',
      item_class: 'feature_slice',
      track_id: 'minimal-working-system',
      milestone: 'M1',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Invoice payment submission slice',
      claim_refs: ['claim-payments'],
      policy_decision_refs: ['policy-refunds'],
      adr_refs: ['ADR-001'],
      origin_ref: [{ kind: 'claim_ref', ref: 'claim-payments' }],
      owners: {
        decision_owner: 'product',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-data'],
      },
      proof_refs: ['proof-payments'],
      dependency_refs: ['item-payments-seam'],
      change_surfaces: ['runtime', 'trust_boundary', 'data_class', 'policy'],
      interfaces_touched: ['contract-payments-api'],
      data_domains_touched: ['data-domain-payments'],
      trust_boundaries_crossed: ['public-api-to-provider'],
      actor_role_set: ['customer', 'operator'],
      data_class: 'pci-sensitive',
      value: {
        persona_or_operator_served: 'customer',
        product_or_operator_value: 'Customer can submit an invoice payment.',
        why_now: 'This delivers the first shippable revenue path.',
        slice_value_kind: 'user_value',
      },
      planning_constraints: {
        estimate_band: 'S',
        confidence: 'high',
        external_lead_time_risk: 'Provider rate-limit review',
        staffing_skill_constraints: 'Needs checkout UI and provider adapter support',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'integration_unknown',
        dominant_rollback_class: 'deploy_rollback',
        blast_radius_note: 'Checkout and receipt persistence only',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: '7d unless API or topology changes',
      contract_governance: contractGovernance,
      nfr_contract: buildNfrContract('payments-slice'),
      observability_contract: buildObservabilityContract('payments-slice'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v2_submission',
        kill_switch: 'disable_payments_v2_submission',
        temporary_controls: [
          {
            control_id: 'TMP-SUBMISSION-ALLOWLIST',
            description: 'Merchant allowlist for first payment submissions',
            retirement_owner: 'payments-team',
            retirement_date: '2026-05-01',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'deploy_rollback',
        strategy: 'Rollback service image and reconcile unsettled payments',
        rehearsal_proof_refs: ['proof-payments'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        parent_seam_ref: ref('item', 'item-payments-seam'),
        acceptance_examples: [
          'Customer pays a valid invoice and sees success.',
          'Timeout returns a safe retry message without duplicate charge.',
        ],
      },
      risks_gaps: 'Provider timeout handling remains under active rehearsal.',
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-control',
      item_class: 'control_guardrail',
      track_id: 'externally-safe-operationally-supportable',
      milestone: 'M2',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Idempotency and timeout guardrail',
      origin_ref: [{ kind: 'control_obligation_ref', ref: 'claim-payments-control' }],
      owners: {
        decision_owner: 'security',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-data'],
      },
      proof_refs: ['proof-payments-control'],
      dependency_refs: ['item-payments-slice'],
      change_surfaces: ['trust_boundary', 'policy', 'data_class', 'observability'],
      interfaces_touched: ['contract-payments-api'],
      data_domains_touched: ['data-domain-payments'],
      trust_boundaries_crossed: ['public-api-to-provider'],
      actor_role_set: ['operator'],
      data_class: 'pci-sensitive',
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value: 'Prevent duplicate charging and force safe timeout behavior.',
        why_now: 'External launch is unsafe without this guardrail.',
        slice_value_kind: 'control_closure',
      },
      planning_constraints: {
        estimate_band: 'S',
        confidence: 'medium',
        external_lead_time_risk: 'Provider failure-mode confirmation',
        staffing_skill_constraints: 'Needs platform and security pairing',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'security_unknown',
        dominant_rollback_class: 'forward_fix_only',
        blast_radius_note: 'Payment submission and provider callback paths',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'must be refreshed before external release',
      contract_governance: contractGovernance,
      nfr_contract: buildNfrContract('payments-control'),
      observability_contract: buildObservabilityContract('payments-control'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v2_external_launch',
        kill_switch: 'disable_payments_v2_external_launch',
        temporary_controls: [
          {
            control_id: 'TMP-FAIL-CLOSED',
            description: 'Temporary merchant allowlist until all fail-closed checks pass',
            retirement_owner: 'security',
            retirement_date: '2026-05-10',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'forward_fix_only',
        strategy: 'Disable launch flag and keep fail-closed control active',
        rehearsal_proof_refs: ['proof-payments-control'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        control_objective: 'Prevent duplicate charging and fail safely on provider timeout.',
        enforcing_surface: 'payment submission workflow',
        fail_mode: 'fail_closed',
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-ops',
      item_class: 'operational_enablement',
      track_id: 'externally-safe-operationally-supportable',
      milestone: 'M2',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Payments operational enablement',
      origin_ref: [{ kind: 'claim_ref', ref: 'claim-payments-ops' }],
      owners: {
        decision_owner: 'platform',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-support'],
      },
      proof_refs: ['proof-payments-ops'],
      dependency_refs: ['item-payments-control'],
      change_surfaces: ['runtime', 'deployment', 'observability', 'support', 'enablement'],
      actor_role_set: ['operator', 'support'],
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value:
          'Support and runtime teams can operate the payment system safely.',
        why_now: 'External supportability is impossible without runbooks and escalation ownership.',
        slice_value_kind: 'risk_retirement',
      },
      planning_constraints: {
        estimate_band: 'S',
        confidence: 'medium',
        external_lead_time_risk: 'Pager routing readiness',
        staffing_skill_constraints: 'Needs platform and support coverage',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'operability_unknown',
        dominant_rollback_class: 'config_secret_rollback',
        blast_radius_note: 'Dashboards, alerts, and operator handoff only',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'refresh after alerting or runtime topology changes',
      nfr_contract: buildNfrContract('payments-ops'),
      observability_contract: buildObservabilityContract('payments-ops'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v2_external_launch',
        kill_switch: 'disable_payments_v2_external_launch',
        temporary_controls: [
          {
            control_id: 'TMP-OPS-HANDOFF',
            description: 'Ops runbook dry-run before external launch',
            retirement_owner: 'payments-ops',
            retirement_date: '2026-05-05',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'config_secret_rollback',
        strategy: 'Rollback alert routing and operator enablement config',
        rehearsal_proof_refs: ['proof-payments-ops'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        runbook_or_enablement_artifact: 'runbooks/payments-operations.md',
        operational_audience: 'payments-oncall and support tier 2',
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-migration',
      item_class: 'migration',
      track_id: 'full-target-system',
      milestone: 'M3',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Migrate payment callbacks to v2 contract',
      claim_refs: ['claim-payments-migration'],
      origin_ref: [{ kind: 'claim_ref', ref: 'claim-payments-migration' }],
      owners: {
        decision_owner: 'architecture',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-data'],
      },
      proof_refs: ['proof-payments-migration'],
      dependency_refs: ['item-payments-control', 'item-payments-slice'],
      change_surfaces: ['runtime', 'deployment', 'data_class'],
      interfaces_touched: ['contract-payments-api'],
      data_domains_touched: ['data-domain-payments'],
      trust_boundaries_crossed: ['provider-callback-to-payments-api'],
      actor_role_set: ['operator'],
      data_class: 'pci-sensitive',
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value:
          'Migrate the payment runtime to the target callback contract safely.',
        why_now: 'Target architecture remains split until callback migration closes.',
        slice_value_kind: 'risk_retirement',
      },
      planning_constraints: {
        estimate_band: 'M',
        confidence: 'medium',
        external_lead_time_risk: 'Provider callback contract enablement window',
        staffing_skill_constraints: 'Needs schema migration and provider adapter support',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'integration_unknown',
        dominant_rollback_class: 'schema_data_rollback',
        blast_radius_note: 'Callback ingestion and reconciliation pipeline',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'invalid immediately after contract or topology change',
      contract_governance: contractGovernance,
      nfr_contract: buildNfrContract('payments-migration'),
      observability_contract: buildObservabilityContract('payments-migration'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v2_callbacks',
        kill_switch: 'disable_payments_v2_callbacks',
        temporary_controls: [
          {
            control_id: 'TMP-DUAL-WRITE',
            description: 'Dual-write callback records during migration window',
            retirement_owner: 'payments-team',
            retirement_date: '2026-06-01',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'schema_data_rollback',
        strategy: 'Replay provider callbacks from audit log to the previous schema',
        rehearsal_proof_refs: ['proof-payments-migration'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        source_state: 'v1 callback contract',
        target_state: 'v2 callback contract',
        stop_go_checkpoint: 'all pilot merchants stable on v2 callback path',
        cleanup_scope: ['temporary_migration_code'],
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-retirement',
      item_class: 'retirement',
      track_id: 'full-target-system',
      milestone: 'M3',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Retire legacy payment callback path',
      origin_ref: [{ kind: 'decommission_need_ref', ref: 'claim-payments-retirement' }],
      owners: {
        decision_owner: 'architecture',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-security', 'team-support'],
      },
      proof_refs: ['proof-payments-retirement'],
      dependency_refs: ['item-payments-migration'],
      change_surfaces: ['runtime', 'support'],
      interfaces_touched: ['contract-payments-api'],
      data_domains_touched: ['data-domain-payments'],
      actor_role_set: ['operator', 'support'],
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value: 'Remove the legacy callback path and its residual risk.',
        why_now: 'Temporary migration compatibility cannot remain in the target system.',
        slice_value_kind: 'risk_retirement',
      },
      planning_constraints: {
        estimate_band: 'S',
        confidence: 'medium',
        external_lead_time_risk: 'Merchant migration confirmation window',
        staffing_skill_constraints: 'Needs release and support verification',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'operability_unknown',
        dominant_rollback_class: 'forward_fix_only',
        blast_radius_note: 'Legacy callback code, docs, alerts, and dashboards',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'refresh before production retirement cutover',
      contract_governance: contractGovernance,
      nfr_contract: buildNfrContract('payments-retirement'),
      observability_contract: buildObservabilityContract('payments-retirement'),
      rollout: {
        applicability: 'required',
        mode: 'phased',
        feature_flag: 'payments_v1_callback_path',
        kill_switch: 'disable_payments_v1_callback_path',
        temporary_controls: [
          {
            control_id: 'TMP-LEGACY-CALLBACK',
            description: 'Residual legacy callback gate during staged retirement',
            retirement_owner: 'payments-team',
            retirement_date: '2026-06-15',
          },
        ],
      },
      recovery: {
        applicability: 'required',
        class: 'forward_fix_only',
        strategy: 'Re-enable legacy callback path only via formal incident rollback',
        rehearsal_proof_refs: ['proof-payments-retirement'],
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        replaces_or_retires_ref: ref('contract', 'contract-payments-api'),
        retirement_trigger: 'all merchants and operators are on v2 callback processing',
        legacy_assets: ['legacy-callback-handler', 'legacy-callback-dashboard'],
        dependent_consumers: ['merchant-dashboard', 'payments-support'],
        cleanup_scope: ['code', 'flags', 'secrets', 'docs', 'dashboards', 'alerts', 'data'],
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-spike',
      item_class: 'spike_discovery',
      track_id: 'full-target-system',
      milestone: 'M2',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Bounded spike for provider retry-window ambiguity',
      origin_ref: [{ kind: 'unknown_ref', ref: 'unknown-provider-retry-window' }],
      owners: {
        decision_owner: 'architecture',
        delivery_owner: 'payments-team',
        consulted_teams: ['team-security', 'team-data'],
      },
      proof_refs: ['proof-payments-spike'],
      dependency_refs: ['item-payments-slice'],
      actor_role_set: ['operator'],
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value: 'Resolve callback retry-window uncertainty before migration.',
        why_now: 'Migration cannot safely close while provider retry semantics are ambiguous.',
        slice_value_kind: 'risk_retirement',
      },
      planning_constraints: {
        estimate_band: 'XS',
        confidence: 'medium',
        external_lead_time_risk: 'Provider response SLA',
        staffing_skill_constraints: 'Needs provider integration specialist',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'integration_unknown',
        dominant_rollback_class: 'forward_fix_only',
        blast_radius_note: 'Discovery only; no runtime rollout',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'refresh if provider contract changes',
      nfr_contract: buildNfrContract('payments-spike'),
      observability_contract: buildObservabilityContract('payments-spike'),
      rollout: {
        applicability: 'not_applicable',
        justification: 'Discovery artifact only; no production behavior changes.',
      },
      recovery: {
        applicability: 'not_applicable',
        justification: 'Discovery artifact only; no production behavior changes.',
      },
      readiness_contract: buildReadinessContract(),
      done_contract: buildSpikeDoneContract(),
      class_payload: {
        question:
          'What retry window does the provider actually guarantee for duplicate callback suppression?',
        uncertainty_class: 'integration_unknown',
        validation_method: 'Replay provider callbacks in staging with controlled duplicates',
        expected_artifact: 'artifacts/provider-retry-window-spike.md',
        exit_criteria: 'Documented provider retry guarantee and engineering recommendation',
        kill_criteria: 'Provider cannot commit to bounded duplicate suppression window',
        max_duration: '3d',
        follow_on_item_refs: ['item-payments-migration'],
        spike_outcome: 'pending',
      },
      economic_priority_note: economicNote,
    },
    {
      item_id: 'item-payments-docs',
      item_class: 'documentation_support_enablement',
      track_id: 'full-target-system',
      milestone: 'M3',
      backlog_protocol_state: 'validated',
      delivery_state: 'not_started',
      readiness_state: 'ready',
      closure_state: 'open',
      summary_label: 'Planned',
      title: 'Payments documentation and support source of truth',
      origin_ref: [{ kind: 'claim_ref', ref: 'claim-payments-ops' }],
      owners: {
        decision_owner: 'support',
        delivery_owner: 'payments-team',
        runtime_owner: 'payments-ops',
        escalation_owner: 'incident-manager',
        consulted_teams: ['team-support'],
      },
      proof_refs: ['proof-payments-docs'],
      dependency_refs: ['item-payments-ops'],
      change_surfaces: ['support', 'enablement'],
      actor_role_set: ['operator', 'support'],
      value: {
        persona_or_operator_served: 'operator',
        product_or_operator_value:
          'Support and operators use a single source of truth for payment incidents.',
        why_now: 'Support handoff remains weak without durable docs.',
        slice_value_kind: 'risk_retirement',
      },
      planning_constraints: {
        estimate_band: 'XS',
        confidence: 'high',
        external_lead_time_risk: 'Support training scheduling',
        staffing_skill_constraints: 'Needs support lead availability',
        blocked_by_decision_status: false,
        dominant_uncertainty_class: 'operability_unknown',
        dominant_rollback_class: 'config_secret_rollback',
        blast_radius_note: 'Documentation, support handoff, and escalation workflow only',
        unresolved_questions_below_threshold: true,
      },
      evidence_freshness_sla: 'refresh on every release touching runtime or support surface',
      nfr_contract: buildNfrContract('payments-docs'),
      observability_contract: buildObservabilityContract('payments-docs'),
      rollout: {
        applicability: 'not_applicable',
        justification: 'Documentation update only; no production behavior changes.',
      },
      recovery: {
        applicability: 'not_applicable',
        justification: 'Documentation update only; no production behavior changes.',
      },
      readiness_contract: buildReadinessContract(),
      done_contract: {},
      class_payload: {
        doc_audience: 'payments support tier 1 and tier 2',
        doc_scope: 'runtime, escalation, customer-facing payment failures',
        source_of_truth_artifact: 'docs/payments-support.md',
        freshness_update_trigger: 'any release touching payment runtime or support workflow',
        freshness_update_owner: 'support-ops-manager',
        support_handoff_artifact: 'docs/payments-support-handoff.md',
      },
      economic_priority_note: economicNote,
    },
  ];

  const relations = [
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-seam'),
      to: ref('track', 'minimal-working-system'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-slice'),
      to: ref('track', 'minimal-working-system'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-control'),
      to: ref('track', 'externally-safe-operationally-supportable'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-ops'),
      to: ref('track', 'externally-safe-operationally-supportable'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-migration'),
      to: ref('track', 'full-target-system'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-retirement'),
      to: ref('track', 'full-target-system'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-spike'),
      to: ref('track', 'full-target-system'),
    },
    {
      relation_type: 'belongs_to_track',
      from: ref('item', 'item-payments-docs'),
      to: ref('track', 'full-target-system'),
    },
    {
      relation_type: 'decomposes_into',
      from: ref('item', 'item-payments-seam'),
      to: ref('item', 'item-payments-slice'),
    },
    {
      relation_type: 'decomposes_into',
      from: ref('item', 'item-payments-seam'),
      to: ref('item', 'item-payments-control'),
    },
    {
      relation_type: 'decomposes_into',
      from: ref('item', 'item-payments-seam'),
      to: ref('item', 'item-payments-migration'),
    },
    {
      relation_type: 'decomposes_into',
      from: ref('item', 'item-payments-seam'),
      to: ref('item', 'item-payments-retirement'),
    },
    {
      relation_type: 'decomposes_into',
      from: ref('item', 'item-payments-seam'),
      to: ref('item', 'item-payments-docs'),
    },
    {
      relation_type: 'realizes',
      from: ref('item', 'item-payments-slice'),
      to: ref('item', 'item-payments-seam'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-control'),
      to: ref('item', 'item-payments-slice'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-ops'),
      to: ref('item', 'item-payments-control'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-migration'),
      to: ref('item', 'item-payments-control'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-retirement'),
      to: ref('item', 'item-payments-migration'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-spike'),
      to: ref('item', 'item-payments-slice'),
    },
    {
      relation_type: 'depends_on',
      from: ref('item', 'item-payments-docs'),
      to: ref('item', 'item-payments-ops'),
    },
    {
      relation_type: 'governed_by',
      from: ref('item', 'item-payments-slice'),
      to: ref('item', 'item-payments-control'),
    },
    {
      relation_type: 'enabled_by',
      from: ref('item', 'item-payments-ops'),
      to: ref('item', 'item-payments-slice'),
    },
    {
      relation_type: 'enabled_by',
      from: ref('item', 'item-payments-docs'),
      to: ref('item', 'item-payments-ops'),
    },
    {
      relation_type: 'migrates_from',
      from: ref('item', 'item-payments-migration'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'retires',
      from: ref('item', 'item-payments-retirement'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_contract',
      from: ref('item', 'item-payments-seam'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_contract',
      from: ref('item', 'item-payments-slice'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_contract',
      from: ref('item', 'item-payments-control'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_contract',
      from: ref('item', 'item-payments-migration'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_contract',
      from: ref('item', 'item-payments-retirement'),
      to: ref('contract', 'contract-payments-api'),
    },
    {
      relation_type: 'touches_data_domain',
      from: ref('item', 'item-payments-seam'),
      to: ref('data_domain', 'data-domain-payments'),
    },
    {
      relation_type: 'touches_data_domain',
      from: ref('item', 'item-payments-slice'),
      to: ref('data_domain', 'data-domain-payments'),
    },
    {
      relation_type: 'touches_data_domain',
      from: ref('item', 'item-payments-control'),
      to: ref('data_domain', 'data-domain-payments'),
    },
    {
      relation_type: 'touches_data_domain',
      from: ref('item', 'item-payments-migration'),
      to: ref('data_domain', 'data-domain-payments'),
    },
    {
      relation_type: 'touches_data_domain',
      from: ref('item', 'item-payments-retirement'),
      to: ref('data_domain', 'data-domain-payments'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-seam'),
      to: ref('proof', 'proof-payments-seam'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-slice'),
      to: ref('proof', 'proof-payments'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-control'),
      to: ref('proof', 'proof-payments-control'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-ops'),
      to: ref('proof', 'proof-payments-ops'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-migration'),
      to: ref('proof', 'proof-payments-migration'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-retirement'),
      to: ref('proof', 'proof-payments-retirement'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-spike'),
      to: ref('proof', 'proof-payments-spike'),
    },
    {
      relation_type: 'proves',
      from: ref('item', 'item-payments-docs'),
      to: ref('proof', 'proof-payments-docs'),
    },
    {
      relation_type: 'proves',
      from: ref('track', 'minimal-working-system'),
      to: ref('track_proof', 'track-proof-payments'),
    },
    {
      relation_type: 'proves',
      from: ref('track', 'externally-safe-operationally-supportable'),
      to: ref('track_proof', 'track-proof-payments-safety'),
    },
    {
      relation_type: 'proves',
      from: ref('track', 'full-target-system'),
      to: ref('track_proof', 'track-proof-payments-target'),
    },
  ];

  const reviews = buildReviews(runId, { implementationGrade });
  for (const review of reviews) {
    relations.push({
      relation_type: 'reviewed_by',
      from: review.review_scope === 'track_proof' ? review.reviewed_ref : ref('run', runId),
      to: ref('review', review.review_id),
    });
  }

  return {
    metadata: {
      schema_version: '3',
      run_id: runId,
      created_at: '2026-03-26T00:00:00Z',
      updated_at: '2026-03-26T00:00:00Z',
    },
    glossary: {
      seam: 'A capability boundary that owns closure.',
    },
    aliases: {
      payments: ['billing'],
    },
    id_strategy: {
      source: 'src-*',
      claim: 'claim-*',
      quality_attribute: 'qa-*',
      policy_decision: 'policy-*',
      item: 'item-*',
      contract: 'contract-*',
      data_domain: 'data-domain-*',
      proof: 'proof-*',
      review: 'review-*',
      track: 'track-*',
      value_stream: 'vs-*',
      journey: 'journey-*',
      track_gate: 'track-gate-*',
      track_proof: 'track-proof-*',
      waiver: 'waiver-*',
      unknown: 'unknown-*',
    },
    source_authority: [
      {
        source_id: 'src-architecture',
        ref: '/tmp/architecture.md',
        kind: 'architecture_doc',
        authority: 'authoritative_target_truth',
        precedence: 1,
        fingerprint: 'sha256:architecture',
      },
      {
        source_id: 'src-runtime',
        ref: '/tmp/runtime.md',
        kind: 'runtime_evidence',
        authority: 'authoritative_current_truth',
        precedence: 2,
        fingerprint: 'sha256:runtime',
      },
      {
        source_id: 'src-old-brief',
        ref: '/tmp/old-brief.md',
        kind: 'architecture_doc',
        authority: 'superseded_excluded',
        fingerprint: 'sha256:old-brief',
      },
    ],
    source_exclusions: [
      {
        source_id: 'src-old-brief',
        reason: 'Superseded by the current architecture packet and runtime evidence.',
        superseded_by: ['src-architecture', 'src-runtime'],
      },
    ],
    target_system: {
      actors: ['customer'],
      operator_personas: ['operator'],
      external_consumer_groups: ['merchant'],
      external_dependencies: ['payment-provider', 'notification-provider'],
      trust_boundaries: ['public api', 'payment provider'],
      durable_state_families: ['payments', 'receipts'],
      control_surfaces: ['rate limits', 'idempotency'],
      failure_domains: ['provider timeout', 'receipt dispatch'],
      team_and_ownership_assumptions: ['payments-team owns API and worker'],
      quality_goals: ['customer payment completion under target latency'],
      policy_surfaces: ['refund policy', 'PCI handling'],
    },
    value_streams: [
      {
        value_stream_id: 'vs-payments',
        title: 'Invoice payment flow',
        description: 'Customer submits and completes an invoice payment.',
        primary_personas: ['customer', 'operator'],
        initiating_triggers: ['invoice payment initiated'],
        workflow_steps: ['Submit payment', 'Call provider', 'Persist result'],
        linked_track_ids: ['minimal-working-system'],
        success_conditions: ['Customer pays successfully', 'Operator can reconcile failures'],
        support_handoff: 'support-payments-tier2',
      },
      {
        value_stream_id: 'vs-payments-safety',
        title: 'External safety and support closure',
        description: 'Operators validate fail-closed safety and support readiness.',
        primary_personas: ['operator'],
        initiating_triggers: ['external launch readiness review'],
        workflow_steps: ['Verify fail-closed controls', 'Confirm alert routing', 'Train support'],
        linked_track_ids: ['externally-safe-operationally-supportable'],
        success_conditions: ['Fail-closed control path proven', 'Support handoff ready'],
        support_handoff: 'support-payments-tier2',
      },
      {
        value_stream_id: 'vs-payments-target',
        title: 'Target-state migration and retirement',
        description: 'Operators migrate callbacks, retire the old path, and publish durable docs.',
        primary_personas: ['operator'],
        initiating_triggers: ['v2 callback contract launch'],
        workflow_steps: [
          'Resolve provider unknown',
          'Migrate callbacks',
          'Retire legacy path',
          'Publish docs',
        ],
        linked_track_ids: ['full-target-system'],
        success_conditions: ['v2 callback path is canonical', 'legacy path retired safely'],
        support_handoff: 'support-payments-tier2',
      },
    ],
    tracks: buildBaseTracks(),
    track_gates: [
      {
        track_gate_id: 'gate-payments-safe',
        track_id: 'minimal-working-system',
        title: 'Payments proof freshness gate',
        description: 'The first runnable system has fresh proof and no broken journey wiring.',
        gate_type: 'readiness',
        fail_mode: 'fail_open',
        governing_control_item_refs: [],
        owner_refs: ['payments-team'],
        required_proof_refs: ['proof-payments'],
        applies_to_journey_ids: ['journey-payments-submit'],
        recalculation_triggers: ['source_change', 'proof_change'],
      },
      {
        track_gate_id: 'gate-payments-external-safety',
        track_id: 'externally-safe-operationally-supportable',
        title: 'External safety guardrails closed',
        description:
          'Fail-closed safety, support, and observability obligations are all evidenced.',
        gate_type: 'safety',
        fail_mode: 'fail_closed',
        governing_control_item_refs: ['item-payments-control'],
        owner_refs: ['security', 'payments-ops'],
        required_proof_refs: ['proof-payments-control', 'proof-track-payments-safety'],
        applies_to_journey_ids: ['journey-payments-safety'],
        recalculation_triggers: ['source_change', 'topology_change', 'control_change'],
      },
      {
        track_gate_id: 'gate-payments-full-target',
        track_id: 'full-target-system',
        title: 'Target-state migration and retirement closure',
        description:
          'Migration, retirement, and documentation closure are all evidenced for the target architecture.',
        gate_type: 'completeness',
        fail_mode: 'fail_open',
        governing_control_item_refs: [],
        owner_refs: ['payments-team', 'support'],
        required_proof_refs: [
          'proof-payments-migration',
          'proof-payments-retirement',
          'proof-track-payments-target',
        ],
        applies_to_journey_ids: ['journey-payments-full-target'],
        recalculation_triggers: ['source_change', 'topology_change', 'release_change'],
      },
    ],
    track_journeys: [
      {
        journey_id: 'journey-payments-submit',
        track_id: 'minimal-working-system',
        value_stream_id: 'vs-payments',
        persona: 'customer',
        trigger: 'Invoice payment initiated',
        workflow_steps: ['Submit payment', 'Call provider', 'Persist result'],
        success_condition: 'Payment succeeds without duplicate charge.',
        support_handoff: 'support-payments-tier2',
      },
      {
        journey_id: 'journey-payments-safety',
        track_id: 'externally-safe-operationally-supportable',
        value_stream_id: 'vs-payments-safety',
        persona: 'operator',
        trigger: 'External launch readiness review',
        workflow_steps: [
          'Verify fail-closed controls',
          'Confirm alerts and dashboards',
          'Confirm support handoff',
        ],
        success_condition: 'External launch is fail-closed and supportable.',
        support_handoff: 'support-payments-tier2',
      },
      {
        journey_id: 'journey-payments-full-target',
        track_id: 'full-target-system',
        value_stream_id: 'vs-payments-target',
        persona: 'operator',
        trigger: 'Target-state callback migration',
        workflow_steps: [
          'Resolve provider retry-window uncertainty',
          'Migrate callbacks',
          'Retire legacy path',
          'Publish support docs',
        ],
        success_condition:
          'Target payment architecture is deployable, supportable, and legacy-free.',
        support_handoff: 'support-payments-tier2',
      },
    ],
    as_built: {
      deployable_surfaces: ['api', 'worker'],
      services: ['payments-api'],
      processes: ['payments-worker'],
      jobs: ['receipt-dispatch'],
      apis: ['public-payments-api'],
      event_surfaces: ['payment-events'],
      queues: ['receipt-queue'],
      state_stores: ['payments-db'],
      deployable_units: ['payments-api-image', 'payments-worker-image'],
      ownership_matrix: ['payments-platform'],
      environment_matrix: ['staging', 'production'],
      ingress_interfaces: ['public-http'],
      egress_interfaces: ['provider-http'],
      canonical_writers: ['payments-api'],
      trust_boundary_crossings: ['public api -> provider'],
      data_classes: ['pci-sensitive'],
      dependency_classifications: [
        {
          dependency_id: 'payment-provider',
          criticality: 'boot_critical',
          owner: 'vendor-payments',
        },
        {
          dependency_id: 'notification-provider',
          criticality: 'degraded',
          owner: 'vendor-notify',
        },
      ],
      synthetic_behaviors: [],
      compatibility_only_behaviors: [],
      vendor_external_owners: ['vendor-payments', 'vendor-notify'],
      missing_operational_inputs: [],
    },
    claims: [
      {
        claim_id: 'claim-payments',
        title: 'The system must accept invoice payments.',
        claim_class: 'functional_capability',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
      {
        claim_id: 'claim-payments-control',
        title: 'External payment submission must fail closed on timeout and duplication risk.',
        claim_class: 'control_obligation',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
      {
        claim_id: 'claim-payments-migration',
        title: 'The target system uses the v2 payment callback contract.',
        claim_class: 'migration',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
      {
        claim_id: 'claim-payments-retirement',
        title: 'The legacy payment callback path must be retired.',
        claim_class: 'retirement',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
      {
        claim_id: 'claim-payments-ops',
        title:
          'Operators must support payment incidents with explicit runbooks and escalation paths.',
        claim_class: 'operational_capability',
        commitment: 'committed',
        source_refs: ['src-architecture', 'src-runtime'],
      },
    ],
    negative_scope: [],
    quality_attributes: [
      {
        quality_attribute_id: 'qa-latency',
        title: 'P95 under 500ms',
        quality_class: 'latency',
        target: 'p95 < 500ms',
        applies_to_refs: [
          ref('item', 'item-payments-slice'),
          ref('track', 'minimal-working-system'),
        ],
        owner_refs: ['payments-team'],
        source_refs: ['src-architecture'],
        proof_refs: ['proof-payments'],
      },
      {
        quality_attribute_id: 'qa-availability',
        title: 'Payment availability target',
        quality_class: 'availability',
        target: '99.95%',
        applies_to_refs: [ref('track', 'externally-safe-operationally-supportable')],
        owner_refs: ['payments-ops'],
        source_refs: ['src-architecture', 'src-runtime'],
        proof_refs: ['proof-track-payments-safety'],
      },
    ],
    policy_decisions: [
      {
        policy_decision_id: 'policy-refunds',
        title: 'Refund policy review complete',
        policy_surface: 'refunds',
        decision_state: 'decided',
        owner: 'legal-ops',
        source_refs: ['src-architecture'],
        related_item_refs: ['item-payments-slice', 'item-payments-control'],
        revisit_trigger: 'Policy text changes',
      },
    ],
    contracts: [
      {
        contract_id: 'contract-payments-api',
        title: 'Payments API contract',
        owner: 'payments-architecture',
        versioning_strategy: 'header-versioned',
        reconciliation_strategy: 'daily provider capture reconciliation',
        deprecation_window: '30d',
        retirement_condition: 'all merchants migrated to v2',
      },
    ],
    data_domains: [
      {
        domain_id: 'data-domain-payments',
        title: 'Payments ledger',
        data_class: 'pci-sensitive',
        owners: ['payments-data', 'security'],
      },
    ],
    gaps: [],
    contradictions: [],
    unknowns: [
      {
        issue_id: 'unknown-provider-retry-window',
        title: 'Provider retry-window guarantee is ambiguous',
        severity: 'high',
        resolution_state: 'open',
        fail_closed_category: false,
        source_refs: ['src-runtime'],
        owner_implications: ['payments-team', 'architecture'],
        related_claim_refs: ['claim-payments-migration'],
        related_item_refs: ['item-payments-migration'],
      },
    ],
    uncertainty_to_spike: [
      {
        unknown_id: 'unknown-provider-retry-window',
        spike_item_id: 'item-payments-spike',
      },
    ],
    delivered_lineage_notes: [],
    items,
    relations,
    proofs: [
      {
        proof_id: 'proof-payments-seam',
        title: 'Capability seam proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-seam'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after contract or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'contract_change', 'topology_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments',
        title: 'Smoke and contract proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-slice'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after contract or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'contract_change', 'topology_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-control',
        title: 'Control closure proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-control'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after safety control or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: [
          'source_change',
          'contract_change',
          'topology_change',
          'track_gate_change',
        ],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-ops',
        title: 'Operational enablement proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-ops'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after alerting or runbook changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'topology_change', 'track_gate_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-migration',
        title: 'Migration proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-migration'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after contract, data, or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'contract_change', 'topology_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-retirement',
        title: 'Retirement proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-retirement'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh before production retirement cutover.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'topology_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-spike',
        title: 'Spike evidence proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-spike'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh if the provider contract changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'contract_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-payments-docs',
        title: 'Documentation and support proof',
        environment: 'staging',
        covered_ref: ref('item', 'item-payments-docs'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh on each support or runtime release.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'topology_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-track-payments',
        title: 'Minimal track closure proof',
        environment: 'staging',
        covered_ref: ref('track_proof', 'track-proof-payments'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after minimal track gate or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: ['source_change', 'topology_change', 'track_gate_change'],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-track-payments-safety',
        title: 'Externally safe track closure proof',
        environment: 'staging',
        covered_ref: ref('track_proof', 'track-proof-payments-safety'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after safety gate, alerting, or topology changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: [
          'source_change',
          'contract_change',
          'topology_change',
          'track_gate_change',
        ],
        dimensions: buildProofDimensions(),
      },
      {
        proof_id: 'proof-track-payments-target',
        title: 'Full target track closure proof',
        environment: 'staging',
        covered_ref: ref('track_proof', 'track-proof-payments-target'),
        covered_commit_or_build: 'build:payments-v1',
        executed_at: '2026-03-26T00:00:00Z',
        freshness_rule: 'Refresh after migration, retirement, or support changes.',
        fresh_until: '2026-06-30T00:00:00Z',
        invalidated_by: [
          'source_change',
          'contract_change',
          'topology_change',
          'track_gate_change',
        ],
        dimensions: buildProofDimensions(),
      },
    ],
    track_proofs: [
      {
        track_proof_id: 'track-proof-payments',
        track_id: 'minimal-working-system',
        proof_refs: ['proof-payments', 'proof-track-payments'],
        coverage: buildTrackProofCoverage(),
      },
      {
        track_proof_id: 'track-proof-payments-safety',
        track_id: 'externally-safe-operationally-supportable',
        proof_refs: ['proof-payments-control', 'proof-payments-ops', 'proof-track-payments-safety'],
        coverage: buildTrackProofCoverage(),
      },
      {
        track_proof_id: 'track-proof-payments-target',
        track_id: 'full-target-system',
        proof_refs: [
          'proof-payments-migration',
          'proof-payments-retirement',
          'proof-payments-docs',
          'proof-track-payments-target',
        ],
        coverage: buildTrackProofCoverage(),
      },
    ],
    reviews,
    waivers: [],
    roadmap_matrix: buildRoadmapMatrix(items, relations),
  };
}

function seedBacklog(runDir, options) {
  const manifest = loadJson(path.join(runDir, 'manifest.json'));
  const backlog = buildBaseBacklog(manifest.run_id, options);
  const sourceDir = path.join(runDir, 'sources');
  fs.mkdirSync(sourceDir, { recursive: true });
  const sourceFixtures = {
    architecture: {
      sourceId: 'src-architecture',
      filePath: path.join(sourceDir, 'architecture.md'),
      content:
        '# Architecture\n\nCommitted capability seam, migration, retirement, and support obligations.\n',
    },
    runtime: {
      sourceId: 'src-runtime',
      filePath: path.join(sourceDir, 'runtime.md'),
      content:
        '# Runtime evidence\n\nCurrent provider behavior, ownership, and operational evidence.\n',
    },
    superseded: {
      sourceId: 'src-old-brief',
      filePath: path.join(sourceDir, 'old-brief.md'),
      content: '# Old brief\n\nSuperseded architecture snapshot.\n',
    },
  };

  for (const fixture of Object.values(sourceFixtures)) {
    fs.writeFileSync(fixture.filePath, fixture.content, 'utf8');
  }

  for (const source of backlog.source_authority) {
    const matchingFixture = Object.values(sourceFixtures).find(
      (fixture) => fixture.sourceId === source.source_id,
    );
    if (!matchingFixture) {
      continue;
    }
    source.ref = matchingFixture.filePath;
    source.fingerprint = sha256Fingerprint(matchingFixture.content);
  }

  writeJson(path.join(runDir, 'backlog.json'), backlog);
  return sourceFixtures;
}

function writePacketMarkdown(filePath, title, packet) {
  fs.writeFileSync(
    filePath,
    `# ${title}\n\n\`\`\`architecture-backlog-packet\n${JSON.stringify(packet, null, 2)}\n\`\`\`\n`,
    'utf8',
  );
}

function createDiscoverSources(runDir, options) {
  const runId = path.basename(runDir);
  const backlog = buildBaseBacklog(runId, options);
  const sourceDir = path.join(runDir, 'discover-sources');
  fs.mkdirSync(sourceDir, { recursive: true });
  const architecturePath = path.join(sourceDir, 'architecture.md');
  const runtimePath = path.join(sourceDir, 'runtime.md');

  const architecturePacket = {
    source: {
      source_id: 'src-architecture',
      ref: architecturePath,
      kind: 'architecture_doc',
      authority: 'authoritative_target_truth',
      precedence: 1,
    },
    id_strategy: backlog.id_strategy,
    glossary: backlog.glossary,
    aliases: backlog.aliases,
    target_system: backlog.target_system,
    value_streams: backlog.value_streams,
    tracks: backlog.tracks,
    claims: backlog.claims,
    negative_scope: backlog.negative_scope,
    quality_attributes: backlog.quality_attributes,
    policy_decisions: backlog.policy_decisions,
    contracts: backlog.contracts,
    data_domains: backlog.data_domains,
  };

  const runtimePacket = {
    source: {
      source_id: 'src-runtime',
      ref: runtimePath,
      kind: 'runtime_evidence',
      authority: 'authoritative_current_truth',
      precedence: 2,
    },
    as_built: backlog.as_built,
    track_gates: backlog.track_gates,
    track_journeys: backlog.track_journeys,
    unknowns: backlog.unknowns,
    uncertainty_to_spike: backlog.uncertainty_to_spike,
    delivered_lineage_notes: backlog.delivered_lineage_notes,
    items: backlog.items,
    relations: backlog.relations,
    proofs: backlog.proofs,
    track_proofs: backlog.track_proofs,
    reviews: backlog.reviews,
    waivers: backlog.waivers,
  };

  writePacketMarkdown(architecturePath, 'Architecture source', architecturePacket);
  writePacketMarkdown(runtimePath, 'Runtime source', runtimePacket);

  return { architecturePath, runtimePath };
}

function mutateBacklog(runDir, mutator) {
  const backlogPath = path.join(runDir, 'backlog.json');
  const backlog = loadJson(backlogPath);
  mutator(backlog);
  writeJson(backlogPath, backlog);
}

test('global help exposes compact lifecycle commands', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /init <run-dir>/);
  assert.match(result.stdout, /discover <run-dir>/);
  assert.match(result.stdout, /status <run-dir>/);
  assert.match(result.stdout, /repair <run-dir>/);
  assert.match(result.stdout, /validate <run-dir>/);
  assert.match(result.stdout, /render <run-dir>/);
  assert.match(result.stdout, /discover-discovery-run/);
  assert.match(result.stdout, /status-discovery-run/);
  assert.equal(result.stderr, '');
});

test('init creates compact v3 artifacts and empty runs fail validation honestly', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-empty');

  const initResult = runCli(['init', runDir]);
  assert.equal(initResult.status, 0);
  assert.match(initResult.stdout, new RegExp(`Initialized discovery run at ${runDir}`));
  assert.match(initResult.stdout, /Rendered report into/);

  for (const fileName of ['manifest.json', 'backlog.json', 'assessment.json', 'journal.ndjson']) {
    assert.equal(fs.existsSync(path.join(runDir, fileName)), true, `${fileName} should exist`);
  }
  assert.equal(fs.existsSync(path.join(runDir, 'report.md')), true, 'report.md should exist');

  const manifest = loadJson(path.join(runDir, 'manifest.json'));
  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const initialAssessment = loadJson(path.join(runDir, 'assessment.json'));
  const initJournal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const initEvent = lastJournalEvent(initJournal, 'run_initialized');
  const initRenderEvent = lastJournalEvent(initJournal, 'report_rendered');
  assert.equal(manifest.schema_version, '3');
  assert.deepEqual(manifest.baseline_source_hashes, {});
  assert.deepEqual(manifest.current_source_hashes, {});
  assert.notEqual(manifest.last_render_at, null);
  assert.deepEqual(backlog.source_exclusions, []);
  assert.deepEqual(backlog.value_streams, []);
  assert.deepEqual(backlog.track_gates, []);
  assert.deepEqual(backlog.track_journeys, []);
  assert.deepEqual(backlog.track_proofs, []);
  assert.deepEqual(backlog.waivers, []);
  assert.deepEqual(backlog.roadmap_matrix, []);
  assert.deepEqual(
    Object.keys(initialAssessment.stats).sort(),
    [...FIXED_ASSESSMENT_STATS_KEYS].sort(),
  );
  assert.deepEqual(
    initialAssessment.stats,
    Object.fromEntries(FIXED_ASSESSMENT_STATS_KEYS.map((key) => [key, 0])),
  );
  assert.deepEqual(initialAssessment.stale_review_artifacts, []);
  assert.deepEqual(initialAssessment.delta_summary.stale_review_artifact_ids, []);
  assert.deepEqual(initialAssessment.rebaseline_readiness, {
    status: 'not_needed',
    reasons: ['Rebaseline is not needed until validation detects baseline drift.'],
  });
  assert.ok(initEvent);
  assert.ok(initRenderEvent);
  assert.equal(initEvent.command_run_id, initRenderEvent.command_run_id);
  assert.equal(initRenderEvent.render_reason, 'mutating_command');
  assert.deepEqual(initRenderEvent.stale_snapshot, {
    claims: [],
    items: [],
    proofs: [],
    reviews: [],
  });
  assert.deepEqual(initRenderEvent.new_stale_snapshot, {
    status: 'unknown',
    reason: 'first recorded snapshot; no previous stale snapshot to diff',
    claims: [],
    items: [],
    proofs: [],
    reviews: [],
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stdout, /Assessment status: fail/);
  assert.match(validationResult.stdout, /Rendered report into/);
  assert.match(validationResult.stderr, /No authoritative sources recorded/);

  const renderResult = runCli(['render', runDir]);
  assert.equal(renderResult.status, 0);
  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /Target-system model populated: No/);
  assert.match(report, /As-built model populated: No/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.acceptance.achieved, 'draft-only');
  assert.equal(assessment.closure.status, 'open');
  assert.deepEqual(Object.keys(assessment.stats).sort(), [...FIXED_ASSESSMENT_STATS_KEYS].sort());
  assert.equal(assessment.stats.hard_fails_total, assessment.hard_fails.length);
  assert.equal(assessment.stats.warnings_total, assessment.warnings.length);
  assert.deepEqual(assessment.stale_review_artifacts, []);
  assert.deepEqual(assessment.delta_summary.stale_review_artifact_ids, []);
  assert.equal(assessment.rebaseline_readiness.status, 'not_needed');
});

test('discover bootstraps a run from source inputs with embedded architecture-backlog packets', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-discover');
  const { architecturePath, runtimePath } = createDiscoverSources(runDir, {
    implementationGrade: true,
  });

  const discoverResult = runCli([
    'discover',
    runDir,
    '--acceptance-target',
    'implementation-grade',
    '--architecture-source',
    architecturePath,
    '--runtime-source',
    runtimePath,
  ]);
  assert.equal(discoverResult.status, 0);
  assert.match(discoverResult.stdout, /Initialized discovery run/);
  assert.match(discoverResult.stdout, /Applied source packets: 2/);
  assert.match(discoverResult.stdout, /Rebaseline readiness:/);
  assert.match(discoverResult.stdout, /New stale since last change:/);
  assert.match(discoverResult.stdout, /Status: unknown/);
  assert.match(discoverResult.stdout, /Rendered report into/);

  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const manifest = loadJson(path.join(runDir, 'manifest.json'));
  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.notEqual(manifest.last_render_at, null);
  assert.equal(backlog.source_authority.length, 2);
  assert.ok(
    backlog.source_authority.every(
      (source) =>
        typeof source.fingerprint === 'string' && source.fingerprint.startsWith('sha256:'),
    ),
  );
  assert.ok(backlog.roadmap_matrix.length > 0);
  assert.equal(assessment.acceptance.achieved, 'implementation-grade');
  assert.equal(fs.existsSync(path.join(runDir, 'report.md')), true);
  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const discoverInitEvent = lastJournalEvent(journal, 'run_initialized');
  const sourcesDiscoveredEvent = lastJournalEvent(journal, 'sources_discovered');
  const validatedEvent = lastJournalEvent(journal, 'run_validated');
  const renderEvent = lastJournalEvent(journal, 'report_rendered');
  assert.ok(discoverInitEvent);
  assert.ok(sourcesDiscoveredEvent);
  assert.ok(validatedEvent);
  assert.ok(renderEvent);
  assert.equal(discoverInitEvent.command_run_id, sourcesDiscoveredEvent.command_run_id);
  assert.equal(sourcesDiscoveredEvent.command_run_id, validatedEvent.command_run_id);
  assert.equal(validatedEvent.command_run_id, renderEvent.command_run_id);
  assert.equal(renderEvent.render_reason, 'mutating_command');
});

test('planning overlay packets cannot use replace_sections', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-planning-replace-sections');
  const packetPath = path.join(runDir, 'packets', 'planning-replace-sections.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Planning packet', {
    source: {
      ref: packetPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'planning_overlay',
    },
    replace_sections: ['items'],
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'Planning overlay should not replace the whole items section',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 1);
  assert.match(discoverResult.stderr, /Planning overlay packet .* cannot use replace_sections/);
});

test('canonical packet boundaries reject sourceId and missing explicit merge provenance', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-explicit-packet-canonical-source-id');
  const sourceIdPacketPath = path.join(runDir, 'packets', 'source-id-alias.md');
  const missingProvenancePacketPath = path.join(runDir, 'packets', 'missing-merge-provenance.md');
  const embeddedSourcePath = path.join(runDir, 'sources', 'embedded-source-id-alias.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(sourceIdPacketPath), { recursive: true });

  writePacketMarkdown(sourceIdPacketPath, 'SourceId alias packet', {
    source: {
      sourceId: 'src-invalid-alias',
      ref: sourceIdPacketPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'planning_overlay',
    },
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'This packet must be rejected before merge',
      },
    ],
  });

  const aliasResult = runCli(['discover', runDir, '--source-packet', sourceIdPacketPath]);
  assert.equal(aliasResult.status, 1);
  assert.match(
    aliasResult.stderr,
    /Packet .* must use packet\.source\.source_id; sourceId is not valid in canonical packets/,
  );

  writePacketMarkdown(missingProvenancePacketPath, 'Missing merge provenance packet', {
    source: {
      ref: missingProvenancePacketPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'This packet must declare merge_mode explicitly',
      },
    ],
  });

  const missingProvenanceResult = runCli([
    'discover',
    runDir,
    '--source-packet',
    missingProvenancePacketPath,
  ]);
  assert.equal(missingProvenanceResult.status, 1);
  assert.match(
    missingProvenanceResult.stderr,
    /Explicit source packet .* must define packet\.packet_provenance\.merge_mode/,
  );

  fs.mkdirSync(path.dirname(embeddedSourcePath), { recursive: true });
  writePacketMarkdown(embeddedSourcePath, 'Embedded sourceId alias packet', {
    source: {
      sourceId: 'src-embedded-alias',
    },
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'Embedded packet must also be rejected on canonical source boundary',
      },
    ],
  });

  const embeddedAliasResult = runCli([
    'discover',
    runDir,
    '--source',
    `architecture_doc:authoritative_target_truth:${embeddedSourcePath}`,
  ]);
  assert.equal(embeddedAliasResult.status, 1);
  assert.match(
    embeddedAliasResult.stderr,
    /Packet .* must use packet\.source\.source_id; sourceId is not valid in canonical packets/,
  );
});

test('planning overlay claim patches cannot change immutable claim fields', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-planning-claim-patch');
  const packetPath = path.join(runDir, 'packets', 'planning-claim-patch.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Planning claim patch', {
    source: {
      ref: packetPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'planning_overlay',
    },
    claims: [
      {
        claim_id: 'claim-payments',
        title: 'This title rewrite must be rejected',
        commitment: 'optional',
        revisit_trigger: 'Re-evaluate after payment provider stabilization.',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 1);
  assert.match(
    discoverResult.stderr,
    /Planning overlay claim patch claim-payments may only change claim_id, commitment, and revisit_trigger; found title/,
  );
});

test('explicit packet merge provenance must match resolved source authority semantics', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-merge-provenance-mismatch');
  const packetPath = path.join(runDir, 'packets', 'merge-provenance-mismatch.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Bad merge provenance packet', {
    source: {
      ref: packetPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'source_driven_refresh',
    },
    replace_sections: ['items'],
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'Planning packets may not masquerade as source-driven refresh',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 1);
  assert.match(
    discoverResult.stderr,
    /Packet .* declares packet\.packet_provenance\.merge_mode=source_driven_refresh but resolved merge_mode=planning_overlay/,
  );
});

test('explicit packets cannot rewrite existing source authority identity fields', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-authority-rewrite');
  const packetPath = path.join(runDir, 'packets', 'source-authority-rewrite.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Bad source authority rewrite', {
    source: {
      source_id: 'src-architecture',
      ref: packetPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'planning_overlay',
      source_id: 'src-architecture',
    },
    items: [
      {
        item_id: 'item-payments-seam',
        title: 'Attempted source authority rewrite',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 1);
  assert.match(
    discoverResult.stderr,
    /Explicit source packet .* cannot rewrite source_authority\.(ref|kind|authority) for src-architecture/,
  );
});

test('explicit packets cannot register duplicate source authority identity under a new source id', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-authority-identity-duplicate');
  const packetPath = path.join(runDir, 'packets', 'source-authority-identity-duplicate.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Bad duplicate source authority identity', {
    source: {
      source_id: 'src-runtime-alias',
      ref: sourceFixtures.runtime.filePath,
      kind: 'runtime_evidence',
      authority: 'authoritative_current_truth',
      precedence: 2,
    },
    packet_provenance: {
      merge_mode: 'source_driven_refresh',
      source_id: 'src-runtime-alias',
      source_kind: 'runtime_evidence',
      source_authority: 'authoritative_current_truth',
    },
    items: [
      {
        item_id: 'item-payments-docs',
        delivery_state: 'delivered',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 1);
  assert.match(
    discoverResult.stderr,
    /cannot register duplicate source_authority identity .* under src-runtime-alias; reuse existing source_id src-runtime/,
  );
});

test('explicit planning packets derive source authority ids and system-manage source refs', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-planning-source-refs');
  const packetPath = path.join(runDir, 'packets', 'planning-negative-scope.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.negative_scope = 'neg-*';
  });
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  writePacketMarkdown(packetPath, 'Planning negative scope packet', {
    source: {
      ref: packetPath,
      kind: 'backlog_text',
      authority: 'planning_only',
    },
    packet_provenance: {
      merge_mode: 'planning_overlay',
    },
    claims: [
      {
        claim_id: 'claim-payments',
        commitment: 'out_of_scope',
        revisit_trigger: 'Re-evaluate when reconciliation automation becomes funded.',
      },
    ],
    negative_scope: [
      {
        negative_scope_id: 'neg-payments-manual-reconcile',
        title: 'Manual reconciliation remains out of scope for phase one.',
        negative_scope_class: 'manual',
        source_refs: ['manually-authored-source-ref'],
        owner_implications: ['payments-team'],
        related_claim_refs: ['claim-payments'],
        related_item_refs: ['item-payments-ops'],
        critical_path_item_refs: ['item-payments-ops'],
        owner_seam_item_refs: ['item-payments-ops'],
        revisit_trigger: 'Revisit when operator capacity is exceeded.',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', packetPath]);
  assert.equal(discoverResult.status, 0, discoverResult.stderr || discoverResult.stdout);

  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const planningSource = backlog.source_authority.find((source) => source.ref === packetPath);
  assert.ok(
    planningSource?.source_id,
    'planning packet should create or reuse a source_authority entry',
  );
  assert.equal(planningSource.kind, 'backlog_text');
  assert.equal(planningSource.authority, 'planning_only');

  const negativeScope = backlog.negative_scope.find(
    (entry) => entry.negative_scope_id === 'neg-payments-manual-reconcile',
  );
  assert.ok(negativeScope, 'negative scope entry should be created');
  assert.deepEqual(negativeScope.source_refs, [planningSource.source_id]);
  assert.deepEqual(negativeScope.packet_provenance, {
    merge_mode: 'planning_overlay',
    source_authority: 'planning_only',
    source_id: planningSource.source_id,
    source_kind: 'backlog_text',
    source_refs_managed: true,
  });
});

test('planning-grade fixture validates and renders a schema-v3 report', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-planning');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
    assert.ok(docsItem?.planning_constraints);
    delete docsItem.planning_constraints.estimate_band;
    delete docsItem.planning_constraints.confidence;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
  assert.match(validationResult.stdout, /Achieved acceptance: planning-grade/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const uniqueItems = uniqueEntriesById(backlog.items, 'item_id');
  assert.equal(assessment.acceptance.achieved, 'planning-grade');
  assert.equal(assessment.score.total < 95, true);
  assert.deepEqual(assessment.track_gate_failures, []);
  assert.deepEqual(assessment.waiver_findings, []);
  assert.deepEqual(Object.keys(assessment.stats).sort(), [...FIXED_ASSESSMENT_STATS_KEYS].sort());
  assert.equal(
    assessment.stats.sources_total,
    countUniqueIds(backlog.source_authority, 'source_id'),
  );
  assert.equal(assessment.stats.claims_total, countUniqueIds(backlog.claims, 'claim_id'));
  assert.equal(assessment.stats.contracts_total, countUniqueIds(backlog.contracts, 'contract_id'));
  assert.equal(
    assessment.stats.data_domains_total,
    countUniqueIds(backlog.data_domains, 'domain_id'),
  );
  assert.equal(assessment.stats.items_total, countUniqueIds(backlog.items, 'item_id'));
  assert.equal(
    assessment.stats.items_delivered,
    uniqueItems.filter((item) => item.delivery_state === 'delivered').length,
  );
  assert.equal(
    assessment.stats.items_partially_delivered,
    uniqueItems.filter((item) => item.delivery_state === 'partially_delivered').length,
  );
  assert.equal(
    assessment.stats.items_not_started,
    uniqueItems.filter((item) => item.delivery_state === 'not_started').length,
  );
  assert.equal(assessment.stats.gaps_total, countUniqueIds(backlog.gaps, 'issue_id'));
  assert.equal(assessment.stats.unknowns_total, countUniqueIds(backlog.unknowns, 'issue_id'));
  assert.equal(
    assessment.stats.contradictions_total,
    countUniqueIds(backlog.contradictions, 'issue_id'),
  );
  assert.equal(assessment.stats.stale_claims_total, assessment.stale_claims.length);
  assert.equal(assessment.stats.stale_items_total, assessment.stale_items.length);
  assert.equal(assessment.stats.stale_proofs_total, assessment.stale_proofs.length);
  assert.equal(
    assessment.stats.stale_review_artifacts_total,
    assessment.stale_review_artifacts.length,
  );
  assert.equal(assessment.stats.warnings_total, assessment.warnings.length);
  assert.equal(assessment.stats.hard_fails_total, assessment.hard_fails.length);
  assert.equal(
    assessment.stats.dor_ready_total,
    uniqueItems.filter((item) => item.readiness_state === 'ready').length,
  );
  assert.equal(
    assessment.stats.review_artifacts_total,
    countUniqueIds(backlog.reviews, 'review_id'),
  );
  assert.equal(assessment.stats.waivers_total, countUniqueIds(backlog.waivers, 'waiver_id'));
  assert.deepEqual(assessment.delta_summary.stale_review_artifact_ids, []);
  assert.deepEqual(assessment.stale_review_artifacts, []);
  assert.deepEqual(assessment.rebaseline_readiness, {
    status: 'not_needed',
    reasons: ['Baseline drift is not detected, so rebaseline is not needed.'],
  });

  const renderResult = runCli(['render', runDir]);
  assert.equal(renderResult.status, 0);
  assert.match(renderResult.stdout, /Rendered report into/);
  assert.equal(fs.existsSync(path.join(runDir, 'report.md')), true);

  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /# Architecture Backlog Report/);
  assert.match(
    report,
    /\| Source ID \| Kind \| Authority \| Precedence \| Reference \| Fingerprint \| Notes \|/,
  );
  assert.match(report, /## Value Streams/);
  assert.match(report, /## Track Closure/);
  assert.match(report, /## Proof Dimensions/);
  assert.match(report, /## Closure Evidence/);
  assert.match(report, /## Traceability/);
  assert.match(report, /Committed claims mapped to items: 5\/5/);
  assert.match(report, /## Graph Relations/);
  assert.match(report, /track:minimal-working-system/);
});

test('assessment stats use deduplicated canonical ids instead of raw array lengths', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-dedup-stats');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority.push({ ...backlog.source_authority[0] });
    backlog.claims.push({ ...backlog.claims[0] });
    backlog.contracts.push({ ...backlog.contracts[0] });
    backlog.data_domains.push({ ...backlog.data_domains[0] });
    backlog.items.push({ ...backlog.items[0] });
    backlog.gaps.push({ ...backlog.gaps[0] });
    backlog.unknowns.push({ ...backlog.unknowns[0] });
    backlog.contradictions.push({ ...backlog.contradictions[0] });
    backlog.reviews.push({ ...backlog.reviews[0] });
    backlog.waivers.push({ ...backlog.waivers[0] });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const uniqueItems = uniqueEntriesById(backlog.items, 'item_id');
  assert.equal(
    assessment.stats.sources_total,
    countUniqueIds(backlog.source_authority, 'source_id'),
  );
  assert.equal(assessment.stats.claims_total, countUniqueIds(backlog.claims, 'claim_id'));
  assert.equal(assessment.stats.contracts_total, countUniqueIds(backlog.contracts, 'contract_id'));
  assert.equal(
    assessment.stats.data_domains_total,
    countUniqueIds(backlog.data_domains, 'domain_id'),
  );
  assert.equal(assessment.stats.items_total, countUniqueIds(backlog.items, 'item_id'));
  assert.equal(
    assessment.stats.items_delivered,
    uniqueItems.filter((item) => item.delivery_state === 'delivered').length,
  );
  assert.equal(
    assessment.stats.items_partially_delivered,
    uniqueItems.filter((item) => item.delivery_state === 'partially_delivered').length,
  );
  assert.equal(
    assessment.stats.items_not_started,
    uniqueItems.filter((item) => item.delivery_state === 'not_started').length,
  );
  assert.equal(assessment.stats.gaps_total, countUniqueIds(backlog.gaps, 'issue_id'));
  assert.equal(assessment.stats.unknowns_total, countUniqueIds(backlog.unknowns, 'issue_id'));
  assert.equal(
    assessment.stats.contradictions_total,
    countUniqueIds(backlog.contradictions, 'issue_id'),
  );
  assert.equal(
    assessment.stats.review_artifacts_total,
    countUniqueIds(backlog.reviews, 'review_id'),
  );
  assert.equal(assessment.stats.waivers_total, countUniqueIds(backlog.waivers, 'waiver_id'));
});

test('repair rebuilds derivable summary labels, track refs, and roadmap matrix', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-repair');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    delete backlog.items.find((item) => item.item_id === 'item-payments-seam').summary_label;
    backlog.tracks[0].first_shippable_journey_ids = [];
    backlog.tracks[0].required_track_gate_ids = [];
    backlog.tracks[0].track_proof_refs = [];
    backlog.roadmap_matrix = [];
  });

  const repairResult = runCli(['repair', runDir]);
  assert.equal(repairResult.status, 0);
  assert.match(repairResult.stdout, /Applied derivable repairs:/);

  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  assert.equal(
    backlog.items.find((item) => item.item_id === 'item-payments-seam').summary_label,
    'Planned',
  );
  assert.deepEqual(backlog.tracks[0].first_shippable_journey_ids, ['journey-payments-submit']);
  assert.deepEqual(backlog.tracks[0].required_track_gate_ids, ['gate-payments-safe']);
  assert.deepEqual(backlog.tracks[0].track_proof_refs, ['track-proof-payments']);
  assert.ok(backlog.roadmap_matrix.length > 0);
  assert.equal(fs.existsSync(path.join(runDir, 'report.md')), true);
});

test('repair recreates derivable missing assessment and journal artifacts before validating', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-repair-bundle');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.rmSync(path.join(runDir, 'assessment.json'));
  fs.rmSync(path.join(runDir, 'journal.ndjson'));

  const repairResult = runCli(['repair', runDir]);
  assert.equal(repairResult.status, 0);
  const manifestAfterRepair = loadJson(path.join(runDir, 'manifest.json'));
  assert.equal(fs.existsSync(path.join(runDir, 'assessment.json')), true);
  assert.equal(fs.existsSync(path.join(runDir, 'journal.ndjson')), true);
  assert.notEqual(manifestAfterRepair.last_render_at, null);

  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const repairedEvent = lastJournalEvent(journal, 'run_bundle_repaired');
  const renderEvent = lastJournalEvent(journal, 'report_rendered');
  assert.ok(repairedEvent);
  assert.ok(renderEvent);
  assert.equal(manifestAfterRepair.last_render_at, renderEvent.ts);
  assert.equal(renderEvent.render_reason, 'mutating_command');
  assert.equal(
    journal.some((entry) => entry.event === 'run_bundle_repaired'),
    true,
  );
});

test('repair, validate, delta, and rebaseline hard-fail with rendered lineage when authoritative source refs are unreadable', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-inaccessible-source');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: true });
  fs.rmSync(sourceFixtures.architecture.filePath);

  const repairResult = runCli(['repair', runDir]);
  assert.equal(repairResult.status, 1);
  assert.match(repairResult.stdout, /Rendered report into/);
  assert.match(
    repairResult.stderr,
    /Source src-architecture could not be read from its declared ref\./,
  );
  const journalAfterRepair = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const repairRefreshEvent = lastJournalEvent(journalAfterRepair, 'source_fingerprints_refreshed');
  const repairValidateEvent = lastJournalEvent(journalAfterRepair, 'run_validated');
  const repairRenderEvent = lastJournalEvent(journalAfterRepair, 'report_rendered');
  assert.ok(repairRefreshEvent);
  assert.ok(repairValidateEvent);
  assert.ok(repairRenderEvent);
  assert.equal(repairRefreshEvent.command_run_id, repairValidateEvent.command_run_id);
  assert.equal(repairValidateEvent.command_run_id, repairRenderEvent.command_run_id);

  mutateBacklog(runDir, (backlog) => {
    for (const source of backlog.source_authority) {
      source.last_accessed_at = '2020-01-01T00:00:00Z';
    }
  });
  const validateResult = runCli(['validate', runDir]);
  assert.equal(validateResult.status, 1);
  assert.match(validateResult.stdout, /Rendered report into/);
  assert.match(
    validateResult.stderr,
    /Source src-architecture could not be read from its declared ref\./,
  );
  const journalAfterValidate = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const refreshEvent = lastJournalEvent(journalAfterValidate, 'source_fingerprints_refreshed');
  const validateEvent = lastJournalEvent(journalAfterValidate, 'run_validated');
  const validateRenderEvent = lastJournalEvent(journalAfterValidate, 'report_rendered');
  assert.ok(refreshEvent);
  assert.ok(validateEvent);
  assert.ok(validateRenderEvent);
  assert.equal(refreshEvent.command_run_id, validateEvent.command_run_id);
  assert.equal(validateEvent.command_run_id, validateRenderEvent.command_run_id);

  mutateBacklog(runDir, (backlog) => {
    for (const source of backlog.source_authority) {
      source.last_accessed_at = '2020-01-01T00:00:00Z';
    }
  });
  const deltaResult = runCli(['delta', runDir]);
  assert.equal(deltaResult.status, 1);
  assert.match(deltaResult.stdout, /Rendered report into/);
  assert.match(
    deltaResult.stderr,
    /Source src-architecture could not be read from its declared ref\./,
  );
  const journalAfterDelta = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const deltaRefreshEvent = lastJournalEvent(journalAfterDelta, 'source_fingerprints_refreshed');
  const deltaValidateEvent = lastJournalEvent(journalAfterDelta, 'run_validated');
  const deltaRenderEvent = lastJournalEvent(journalAfterDelta, 'report_rendered');
  assert.ok(deltaRefreshEvent);
  assert.ok(deltaValidateEvent);
  assert.ok(deltaRenderEvent);
  assert.equal(deltaRefreshEvent.command_run_id, deltaValidateEvent.command_run_id);
  assert.equal(deltaValidateEvent.command_run_id, deltaRenderEvent.command_run_id);

  mutateBacklog(runDir, (backlog) => {
    for (const source of backlog.source_authority) {
      source.last_accessed_at = '2020-01-01T00:00:00Z';
    }
  });
  const rebaselineResult = runCli(['rebaseline', runDir]);
  assert.equal(rebaselineResult.status, 1);
  assert.match(rebaselineResult.stdout, /Rendered report into/);
  assert.match(
    rebaselineResult.stderr,
    /Source src-architecture could not be read from its declared ref\./,
  );
  const journalAfterRebaseline = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const rebaselineRefreshEvent = lastJournalEvent(
    journalAfterRebaseline,
    'source_fingerprints_refreshed',
  );
  const rebaselineValidateEvent = lastJournalEvent(journalAfterRebaseline, 'run_validated');
  const rebaselineRenderEvent = lastJournalEvent(journalAfterRebaseline, 'report_rendered');
  assert.ok(rebaselineRefreshEvent);
  assert.ok(rebaselineValidateEvent);
  assert.ok(rebaselineRenderEvent);
  assert.equal(rebaselineRefreshEvent.command_run_id, rebaselineValidateEvent.command_run_id);
  assert.equal(rebaselineValidateEvent.command_run_id, rebaselineRenderEvent.command_run_id);
});

test('stale proof forces assessment fail and blocks acceptance uplift', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-stale-proof');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const proof = backlog.proofs.find((entry) => entry.proof_id === 'proof-payments');
    assert.ok(proof);
    proof.fresh_until = '2020-01-01T00:00:00Z';
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stdout, /Assessment status: fail/);
  assert.match(validationResult.stdout, /Achieved acceptance: draft-only/);
  assert.match(validationResult.stdout, /LINT: Proof proof-payments is stale\./);
  assert.match(validationResult.stderr, /HARD_FAIL: Proof proof-payments is stale\./);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.status, 'fail');
  assert.equal(assessment.acceptance.achieved, 'draft-only');
  assert.equal(assessment.score.total >= 95, true);
  assert.deepEqual(assessment.stale_proofs, ['proof-payments']);
  assert.equal(assessment.stale_review_artifacts.includes('review-track-minimal'), true);
  assert.equal(
    assessment.delta_summary.stale_review_artifact_ids.includes('review-track-minimal'),
    true,
  );
  assert.equal(assessment.rebaseline_readiness.status, 'not_needed');

  const statusResult = runCli(['status', runDir]);
  assert.equal(statusResult.status, 1);
  assert.match(statusResult.stdout, /Hard-fails: 4/);
  assert.match(statusResult.stdout, /Hard-fail details:/);
  assert.match(statusResult.stdout, /Proof proof-payments is stale\./);
  assert.match(
    statusResult.stdout,
    /Item item-payments-slice is stale after proof, claim, contract, or topology drift/,
  );
});

test('score below 80 stays draft-only instead of becoming planning-grade', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-score-floor');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.quality_attributes = backlog.quality_attributes.slice(0, 1);
    for (const [index, item] of backlog.items.entries()) {
      if (index < 6 && item.planning_constraints) {
        delete item.planning_constraints.estimate_band;
        delete item.planning_constraints.confidence;
        delete item.estimate_band;
        delete item.confidence;
      }
    }
    for (const review of backlog.reviews) {
      review.verdict = 'pass_with_findings';
    }
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
  assert.match(validationResult.stdout, /Assessment status: pass/);
  assert.match(validationResult.stdout, /Achieved acceptance: draft-only/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.status, 'pass');
  assert.equal(assessment.score.total < 80, true);
  assert.equal(assessment.acceptance.achieved, 'draft-only');
  assert.match(
    assessment.acceptance.blocking_reasons.join('\n'),
    /below the planning-grade floor of 80/,
  );
  assert.equal(assessment.closure.status, 'open');
});

test('implementation-grade fixture reaches implementation-grade and status reports success', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-implementation');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
  assert.match(validationResult.stdout, /Achieved acceptance: implementation-grade/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.acceptance.achieved, 'implementation-grade');
  assert.equal(assessment.score.total >= 95, true);

  const statusResult = runCli(['status', runDir]);
  assert.equal(statusResult.status, 0);
  assert.match(statusResult.stdout, /Achieved acceptance: implementation-grade/);
  assert.match(statusResult.stdout, /Assessment: pass/);
});

test('draft-only target cannot uplift to implementation-grade without full baseline reviews', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-missing-review');

  assert.equal(runCli(['init', '--acceptance-target', 'draft-only', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const removedReviewIds = new Set(['review-platform', 'review-security', 'review-support']);
    backlog.reviews = backlog.reviews.filter((review) => !removedReviewIds.has(review.review_id));
    backlog.relations = backlog.relations.filter(
      (relation) =>
        !(relation.relation_type === 'reviewed_by' && removedReviewIds.has(relation.to?.id ?? '')),
    );
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stdout, /Assessment status: fail/);
  assert.match(validationResult.stdout, /Achieved acceptance: draft-only/);
  assert.match(validationResult.stderr, /ERROR: Required review role missing: platform_sre/);
  assert.match(validationResult.stderr, /ERROR: Required review role missing: security/);
  assert.match(validationResult.stderr, /ERROR: Required review role missing: support_operations/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.status, 'fail');
  assert.equal(assessment.acceptance.achieved, 'draft-only');
  assert.match(assessment.errors.join('\n'), /Required review role missing: platform_sre/);
  assert.match(assessment.errors.join('\n'), /Required review role missing: security/);
  assert.match(assessment.errors.join('\n'), /Required review role missing: support_operations/);
});

test('run review artifacts must also be linked through graph-level reviewed_by relations', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-review-linkage');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.relations = backlog.relations.filter(
      (relation) =>
        !(
          relation.relation_type === 'reviewed_by' &&
          relation.from?.kind === 'run' &&
          relation.from?.id === backlog.metadata.run_id &&
          relation.to?.kind === 'review' &&
          relation.to?.id === 'review-product'
        ),
    );
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Review review-product is missing graph-level reviewed_by relation/,
  );
});

test('track proofs require the canonical coverage checklist and graph-level proves linkage', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-track-proof');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    delete backlog.track_proofs[0].coverage.runbook_and_escalation_path;
    backlog.relations = backlog.relations.filter(
      (relation) =>
        !(
          relation.relation_type === 'proves' &&
          relation.from?.kind === 'track' &&
          relation.from?.id === 'minimal-working-system' &&
          relation.to?.kind === 'track_proof' &&
          relation.to?.id === 'track-proof-payments'
        ),
    );
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Track proof track-proof-payments must include boolean coverage\.runbook_and_escalation_path/,
  );
  assert.match(
    validationResult.stderr,
    /Track proof track-proof-payments is missing graph-level proves relation from track minimal-working-system/,
  );
});

test('pre-GA compact schema v2 is rejected instead of being silently reinterpreted', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-schema-v2');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.metadata.schema_version = '2';
  });
  const manifestPath = path.join(runDir, 'manifest.json');
  const manifest = loadJson(manifestPath);
  manifest.schema_version = '2';
  writeJson(manifestPath, manifest);

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Unsupported schema_version in manifest\.json/);
  assert.match(validationResult.stderr, /Unsupported schema_version in backlog\.json/);
});

test('status, render, delta, and rebaseline reject unsupported compact schemas with cutover guidance', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-unsupported-schema-commands');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.metadata.schema_version = '2';
  });

  const manifestPath = path.join(runDir, 'manifest.json');
  const manifest = loadJson(manifestPath);
  manifest.schema_version = '2';
  writeJson(manifestPath, manifest);

  const assessmentPath = path.join(runDir, 'assessment.json');
  const assessment = loadJson(assessmentPath);
  assessment.schema_version = '2';
  writeJson(assessmentPath, assessment);

  for (const command of ['status', 'render', 'delta', 'rebaseline']) {
    const result = runCli([command, runDir]);
    assert.equal(result.status, 1, `${command} should fail on unsupported compact schema`);
    assert.match(result.stderr, /Unsupported schema_version in manifest\.json/);
    assert.match(result.stderr, /Unsupported schema_version in backlog\.json/);
    assert.match(result.stderr, /Unsupported schema_version in assessment\.json/);
    assert.match(result.stderr, /pre-GA breaking cutover policy/);
    assert.doesNotMatch(result.stderr, /ENOENT/);
  }
});

test('value streams and journeys must carry the full typed linkage contract', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-value-streams');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    delete backlog.value_streams[0].support_handoff;
    backlog.value_streams[0].primary_personas = [];
    backlog.value_streams[0].initiating_triggers = [];
    backlog.value_streams[0].workflow_steps = [];
    backlog.value_streams[0].success_conditions = [];
    backlog.value_streams[0].linked_track_ids = [];
    delete backlog.track_journeys[0].value_stream_id;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Value stream vs-payments must include at least one primary_personas entry/,
  );
  assert.match(validationResult.stderr, /Value stream vs-payments missing support_handoff/);
  assert.match(
    validationResult.stderr,
    /Track journey journey-payments-submit has invalid value_stream_id/,
  );
});

test('journeys must point to a value stream that is linked back to the same track', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-value-stream-reciprocity');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.value_streams[0].linked_track_ids = ['full-target-system'];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Track minimal-working-system does not map to any value stream/,
  );
  assert.match(
    validationResult.stderr,
    /Track journey journey-payments-submit points to value stream vs-payments but that value stream is not linked to track minimal-working-system/,
  );
});

test('fail-closed track gates must link to owned control work and required proof', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-fail-closed-gate');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.track_gates[0].fail_mode = 'fail_closed';
    backlog.track_gates[0].governing_control_item_refs = [];
    backlog.track_gates[0].owner_refs = [];
    backlog.track_gates[0].required_proof_refs = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Track gate gate-payments-safe must include at least one governing_control_item_refs entry/,
  );
  assert.match(
    validationResult.stderr,
    /Track gate gate-payments-safe must include at least one owner_refs entry/,
  );
  assert.match(
    validationResult.stderr,
    /Track gate gate-payments-safe must include at least one required_proof_refs entry/,
  );
});

test('track proofs require at least one atomic proof that covers the track_proof object', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-track-proof-anchor');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.proofs = backlog.proofs.filter((proof) => proof.proof_id !== 'proof-track-payments');
    backlog.track_proofs[0].proof_refs = ['proof-payments'];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Track proof track-proof-payments must be backed by at least one proof whose covered_ref points to the track_proof/,
  );
});

test('item proofs require self-covering proof bundles and graph-level proves linkage', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-item-proof-closure');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const proof = backlog.proofs.find((entry) => entry.proof_id === 'proof-payments');
    assert.ok(proof);
    proof.covered_ref = ref('item', 'item-payments-seam');
    backlog.relations = backlog.relations.filter(
      (relation) =>
        !(
          relation.relation_type === 'proves' &&
          relation.from?.kind === 'item' &&
          relation.from?.id === 'item-payments-slice' &&
          relation.to?.kind === 'proof' &&
          relation.to?.id === 'proof-payments'
        ),
    );
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Item item-payments-slice proof_ref proof-payments is missing graph-level proves relation/,
  );
  assert.match(
    validationResult.stderr,
    /Item item-payments-slice must have at least one proof_ref whose covered_ref points to the item itself/,
  );
});

test('target system requires operator, consumer, quality, and policy surfaces', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-target-system-minimum');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.target_system.operator_personas = [];
    backlog.target_system.external_consumer_groups = [];
    backlog.target_system.quality_goals = [];
    backlog.target_system.policy_surfaces = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /target_system must include at least one operator_personas entry/,
  );
  assert.match(
    validationResult.stderr,
    /target_system must include at least one external_consumer_groups entry/,
  );
  assert.match(
    validationResult.stderr,
    /target_system must include at least one quality_goals entry/,
  );
  assert.match(
    validationResult.stderr,
    /target_system must include at least one policy_surfaces entry/,
  );
});

test('externally safe track only hard-fails unresolved fail-closed categories', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-fail-closed-category');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.gap = 'gap-*';
    backlog.gaps.push({
      issue_id: 'gap-support-handoff-note',
      title: 'Support handoff note needs wording cleanup',
      severity: 'low',
      fail_closed_category: false,
      source_refs: ['src-runtime'],
      owner_implications: ['support'],
      related_claim_refs: ['claim-payments-ops'],
      related_item_refs: ['item-payments-ops'],
    });
  });

  let validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);

  mutateBacklog(runDir, (backlog) => {
    const gap = backlog.gaps.find((entry) => entry.issue_id === 'gap-support-handoff-note');
    assert.ok(gap);
    gap.fail_closed_category = true;
  });

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Externally safe track has unresolved fail-closed issue gap-support-handoff-note/,
  );
});

test('manual or synthetic closure on a required track must declare same-track owner seams', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-manual-closure-owner-seam');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.as_built.synthetic_behaviors = ['Manual provider reconciliation fallback'];
    backlog.negative_scope.push({
      negative_scope_id: 'neg-manual-reconcile',
      title: 'Manual provider reconciliation fallback',
      negative_scope_class: 'manual',
      source_refs: ['src-runtime'],
      owner_implications: ['payments-team', 'support'],
      related_claim_refs: ['claim-payments-ops'],
      related_item_refs: ['item-payments-control'],
      critical_path_item_refs: ['item-payments-control'],
      owner_seam_item_refs: [],
      revisit_trigger: 'until automatic provider reconciliation is implemented',
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Negative scope neg-manual-reconcile must declare owner_seam_item_refs for manual\/synthetic closure/,
  );
});

test('delivery_state requires authoritative current-truth evidence', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-delivery-evidence');
  const runtimeDeliveryPacketPath = path.join(runDir, 'packets', 'runtime-delivery.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    const seamItem = backlog.items.find((item) => item.item_id === 'item-payments-seam');
    const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
    assert.ok(seamItem);
    assert.ok(docsItem);
    seamItem.delivery_state = 'delivered';
    docsItem.delivery_state = 'delivered';
    backlog.roadmap_matrix = buildRoadmapMatrix(backlog.items, backlog.relations);
  });

  let validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Item item-payments-seam sets delivery_state=delivered without authoritative current-truth evidence/,
  );

  mutateBacklog(runDir, (backlog) => {
    const seamItem = backlog.items.find((item) => item.item_id === 'item-payments-seam');
    const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
    assert.ok(seamItem);
    assert.ok(docsItem);
    seamItem.delivery_state = 'not_started';
    docsItem.delivery_state = 'delivered';
    docsItem.packet_provenance = {
      merge_mode: 'source_driven_refresh',
      source_id: 'src-missing-runtime',
      source_kind: 'runtime_evidence',
      source_authority: 'authoritative_current_truth',
      source_refs_managed: true,
    };
    docsItem.source_refs = ['src-missing-runtime'];
    backlog.roadmap_matrix = buildRoadmapMatrix(backlog.items, backlog.relations);
  });

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Item item-payments-docs sets delivery_state=delivered without authoritative current-truth evidence/,
  );

  fs.mkdirSync(path.dirname(runtimeDeliveryPacketPath), { recursive: true });
  writePacketMarkdown(runtimeDeliveryPacketPath, 'Runtime delivery evidence', {
    source: {
      source_id: 'src-runtime',
      ref: sourceFixtures.runtime.filePath,
      kind: 'runtime_evidence',
      authority: 'authoritative_current_truth',
      precedence: 2,
    },
    packet_provenance: {
      merge_mode: 'source_driven_refresh',
      source_id: 'src-runtime',
      source_kind: 'runtime_evidence',
      source_authority: 'authoritative_current_truth',
    },
    items: [
      {
        item_id: 'item-payments-docs',
        delivery_state: 'delivered',
      },
    ],
  });

  const discoverResult = runCli(['discover', runDir, '--source-packet', runtimeDeliveryPacketPath]);
  assert.equal(discoverResult.status, 0, discoverResult.stderr || discoverResult.stdout);

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0, validationResult.stderr || validationResult.stdout);

  const backlog = loadJson(path.join(runDir, 'backlog.json'));
  const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
  assert.ok(docsItem);
  assert.deepEqual(docsItem.source_refs, ['src-runtime']);
  assert.deepEqual(docsItem.packet_provenance, {
    merge_mode: 'source_driven_refresh',
    source_authority: 'authoritative_current_truth',
    source_id: 'src-runtime',
    source_kind: 'runtime_evidence',
    source_refs_managed: true,
  });
  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.stats.items_delivered, 1);
});

test('out_of_scope claims must align with the canonical negative_scope register', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-negative-scope-canonical');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.negative_scope = 'neg-*';
    const claim = backlog.claims.find((entry) => entry.claim_id === 'claim-payments');
    assert.ok(claim);
    claim.commitment = 'out_of_scope';
    claim.revisit_trigger = 'Revisit when reconciliation automation is funded.';
  });

  let validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Claim claim-payments is out_of_scope but has no canonical negative_scope entry/,
  );

  mutateBacklog(runDir, (backlog) => {
    backlog.negative_scope.push({
      negative_scope_id: 'neg-payments-phase-one',
      title: 'Manual payment reconciliation remains out of scope for phase one.',
      negative_scope_class: 'manual',
      source_refs: ['src-runtime'],
      owner_implications: ['payments-team'],
      related_claim_refs: ['claim-payments'],
      related_item_refs: ['item-payments-ops'],
      critical_path_item_refs: ['item-payments-ops'],
      owner_seam_item_refs: ['item-payments-ops'],
      revisit_trigger: 'Revisit when support volume exceeds manual capacity.',
    });
    const claim = backlog.claims.find((entry) => entry.claim_id === 'claim-payments');
    assert.ok(claim);
    claim.commitment = 'committed';
  });

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Negative scope neg-payments-phase-one claim claim-payments must set claim\.commitment=out_of_scope/,
  );
});

test('critical unknowns may be downgraded instead of forcing bounded spikes', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-downgraded-unknown');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].resolution_state = 'downgraded';
    backlog.unknowns[0].downgraded_severity = 'medium';
    backlog.unknowns[0].resolution_note =
      'Provider SLA and callback retries are now bounded enough for planning work.';
    backlog.uncertainty_to_spike = [];
    backlog.items = backlog.items.filter((item) => item.item_id !== 'item-payments-spike');
    backlog.proofs = backlog.proofs.filter((proof) => proof.proof_id !== 'proof-payments-spike');
    backlog.relations = backlog.relations.filter(
      (relation) =>
        relation.from?.id !== 'item-payments-spike' &&
        relation.to?.id !== 'item-payments-spike' &&
        relation.to?.id !== 'proof-payments-spike',
    );
    backlog.roadmap_matrix = backlog.roadmap_matrix.filter(
      (row) => row.item_ref?.id !== 'item-payments-spike',
    );
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
});

test('gap and unknown resolution fields must follow the canonical state machine', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-resolution-state-machine');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.gap = 'gap-*';
    backlog.gaps.push({
      issue_id: 'gap-payments-wording',
      title: 'Payment support note wording needs correction.',
      severity: 'low',
      resolution_state: 'resolved',
      source_refs: ['src-runtime'],
      owner_implications: ['support'],
      related_claim_refs: ['claim-payments-ops'],
      related_item_refs: ['item-payments-docs'],
    });
    backlog.unknowns[0].resolution_note = 'This note should be cleared before reopening.';
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Gap gap-payments-wording must include resolution_note when resolved/,
  );
  assert.match(
    validationResult.stderr,
    /Unknown unknown-provider-retry-window must clear resolution_note when resolution_state=open/,
  );
});

test('run_validated journals issue resolution snapshots and requires a new note for downgraded to resolved transitions', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-resolution-snapshots');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].resolution_state = 'downgraded';
    backlog.unknowns[0].downgraded_severity = 'medium';
    backlog.unknowns[0].resolution_note = 'Provider ambiguity is now bounded enough for planning.';
  });

  let validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0, validationResult.stderr || validationResult.stdout);

  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const latestValidatedEvent = [...journal]
    .reverse()
    .find((entry) => entry.event === 'run_validated');
  assert.ok(latestValidatedEvent, 'validate should persist a run_validated journal event');
  assert.deepEqual(latestValidatedEvent.issue_resolution_snapshot, {
    gaps: [],
    unknowns: [
      {
        issue_id: 'unknown-provider-retry-window',
        resolution_state: 'downgraded',
        resolution_note: 'Provider ambiguity is now bounded enough for planning.',
      },
    ],
  });

  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].resolution_state = 'resolved';
    delete backlog.unknowns[0].downgraded_severity;
  });

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Unknown unknown-provider-retry-window must include a new resolution_note when transitioning downgraded -> resolved/,
  );

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Unknown unknown-provider-retry-window must include a new resolution_note when transitioning downgraded -> resolved/,
  );
});

test('resolved issues cannot reopen without authoritative current-truth evidence or drift reassessment', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-reopen-guardrails');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].resolution_state = 'resolved';
    backlog.unknowns[0].resolution_note =
      'Provider contract now documents the retry-window guarantee explicitly.';
  });

  let validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0, validationResult.stderr || validationResult.stdout);

  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].resolution_state = 'open';
    delete backlog.unknowns[0].resolution_note;
    backlog.unknowns[0].source_refs = ['src-architecture'];
  });

  assert.equal(runCli(['delta', runDir]).status, 0);
  assert.equal(runCli(['rebaseline', runDir]).status, 0);

  validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Unknown unknown-provider-retry-window cannot transition resolved -> open without authoritative current-truth evidence or drift reassessment/,
  );
});

test('spikes require machine-checkable done-contract closure state', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-spike-done-contract');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    const spike = backlog.items.find((item) => item.item_id === 'item-payments-spike');
    assert.ok(spike);
    spike.done_contract = {};
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Spike item-payments-spike done_contract.class_specific_checks.promised_artifact_exists must be a boolean/,
  );
  assert.match(
    validationResult.stderr,
    /Spike item-payments-spike done_contract.class_specific_checks.silent_continuation_blocked must be a boolean/,
  );
});

test('quality attributes and policy decisions are required durable ledgers', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-ledger-requiredness');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.quality_attributes = [];
    backlog.policy_decisions = [];
    const slice = backlog.items.find((item) => item.item_id === 'item-payments-slice');
    assert.ok(slice);
    slice.policy_decision_refs = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /quality_attributes ledger must not be empty/);
  assert.match(validationResult.stderr, /policy_decisions ledger must not be empty/);
});

test('extended item schema fields are enforced for planning-ready items', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-extended-item-schema');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const slice = backlog.items.find((item) => item.item_id === 'item-payments-slice');
    assert.ok(slice);
    slice.adr_refs = [];
    slice.actor_role_set = [];
    delete slice.value.product_or_operator_value;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Item item-payments-slice must declare adr_refs/);
  assert.match(validationResult.stderr, /Item item-payments-slice must declare actor_role_set/);
  assert.match(
    validationResult.stderr,
    /Item item-payments-slice missing value.product_or_operator_value/,
  );
});

test('item evidence freshness sla is mandatory', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-item-freshness-sla');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
    assert.ok(docsItem);
    delete docsItem.evidence_freshness_sla;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Item item-payments-docs missing evidence_freshness_sla/);
});

test('claims must resolve to canonical source authority entries', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-claim-traceability');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.claims[0].source_refs = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Claim claim-payments must include source_refs\[\]/);
});

test('claims cannot satisfy traceability through excluded sources', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-claim-excluded-source');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.claims[0].source_refs = ['src-old-brief'];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Claim claim-payments references excluded source src-old-brief/,
  );
});

test('source exclusions must also exist in source authority and declare superseding sources', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-exclusion-authority');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority = backlog.source_authority.filter(
      (source) => source.source_id !== 'src-old-brief',
    );
    backlog.source_exclusions[0].superseded_by = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Source exclusion src-old-brief has no matching source_authority entry/,
  );
  assert.match(
    validationResult.stderr,
    /Source exclusion src-old-brief must include superseded_by\[\]/,
  );
});

test('id_strategy must cover every major ledger class used by the run', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-id-strategy');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    delete backlog.id_strategy.source;
    delete backlog.id_strategy.value_stream;
    delete backlog.id_strategy.quality_attribute;
    delete backlog.id_strategy.policy_decision;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /id_strategy must define source/);
  assert.match(validationResult.stderr, /id_strategy must define value_stream/);
  assert.match(validationResult.stderr, /id_strategy must define quality_attribute/);
  assert.match(validationResult.stderr, /id_strategy must define policy_decision/);
});

test('authoritative sources require explicit, unique, gap-free precedence', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-precedence');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority[0].precedence = 1;
    backlog.source_authority[1].precedence = 3;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Authoritative source precedence has gaps: missing 2/);
});

test('authoritative sources cannot reuse precedence values', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-precedence-duplicate');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority[0].precedence = 1;
    backlog.source_authority[1].precedence = 1;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Duplicate authoritative source precedence 1/);
});

test('backlog text cannot outrank protected architectural truth', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-backlog-text');
  const backlogSourcePath = path.join(runDir, 'sources', 'planning-backlog.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(backlogSourcePath), { recursive: true });
  fs.writeFileSync(backlogSourcePath, '# Planning backlog\n\nDraft planning notes.\n', 'utf8');
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority.push({
      source_id: 'src-backlog',
      ref: backlogSourcePath,
      kind: 'backlog_text',
      authority: 'planning_only',
      precedence: 1,
      fingerprint: 'sha256:backlog',
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Source src-backlog uses backlog_text with precedence 1, which outranks or ties protected architectural truth/,
  );
});

test('superseded_excluded sources require explicit exclusion metadata and exclusions cannot conflict with active sources', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-source-exclusions');
  const supersededSourcePath = path.join(runDir, 'sources', 'old-adr.md');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  fs.mkdirSync(path.dirname(supersededSourcePath), { recursive: true });
  fs.writeFileSync(supersededSourcePath, '# Old ADR\n\nSuperseded architectural note.\n', 'utf8');
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority.push({
      source_id: 'src-superseded',
      ref: supersededSourcePath,
      kind: 'adr',
      authority: 'superseded_excluded',
      fingerprint: 'sha256:old-adr',
    });
    backlog.source_exclusions.push({
      source_id: 'src-runtime',
      reason: 'incorrectly excluded active runtime source',
      superseded_by: ['src-architecture'],
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Source src-superseded is marked superseded_excluded but has no matching source_exclusions entry/,
  );
  assert.match(
    validationResult.stderr,
    /Source exclusion src-runtime conflicts with source_authority entry that is not superseded_excluded/,
  );
});

test('origin refs must resolve against their canonical ledgers by kind', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-origin-refs');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.gap = 'gap-*';
    backlog.id_strategy.unknown = 'unknown-*';
    backlog.claims.push(
      {
        claim_id: 'claim-control-obligation',
        title: 'Idempotency is mandatory on payment submission.',
        claim_class: 'control_obligation',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
      {
        claim_id: 'claim-retirement-v1',
        title: 'Legacy payment capture path must be retired.',
        claim_class: 'retirement',
        commitment: 'committed',
        source_refs: ['src-architecture'],
      },
    );
    backlog.gaps.push({
      issue_id: 'gap-reconciliation',
      title: 'Reconciliation flow not fully specified.',
      severity: 'high',
      source_refs: ['src-architecture'],
      owner_implications: ['payments-team'],
      related_claim_refs: ['claim-payments'],
      related_item_refs: ['item-payments-seam'],
    });
    backlog.unknowns.push({
      issue_id: 'unknown-provider-timeout',
      title: 'Provider timeout envelope not verified.',
      severity: 'medium',
      resolution_state: 'open',
      source_refs: ['src-runtime'],
      owner_implications: ['payments-team'],
      related_claim_refs: ['claim-payments'],
      related_item_refs: ['item-payments-slice'],
    });
    backlog.reviews[0].findings = [
      {
        finding_id: 'finding-product-reconcile',
        severity: 'medium',
        title: 'Reconciliation follow-up needed',
        detail: 'Operator reconciliation criteria should be tightened.',
      },
    ];
    backlog.items[0].origin_ref = [
      { kind: 'claim_ref', ref: 'claim-payments' },
      { kind: 'control_obligation_ref', ref: 'claim-control-obligation' },
      { kind: 'policy_decision_ref', ref: 'policy-refunds' },
      { kind: 'decommission_need_ref', ref: 'claim-retirement-v1' },
      { kind: 'review_finding_ref', ref: 'finding-product-reconcile' },
      { kind: 'unknown_ref', ref: 'unknown-provider-timeout' },
      { kind: 'gap_ref', ref: 'gap-reconciliation' },
    ];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
});

test('broken origin refs fail against the canonical ledger for that kind', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-origin-ref-broken');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.items[0].origin_ref = [{ kind: 'gap_ref', ref: 'gap-does-not-exist' }];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Item item-payments-seam has unresolved gap_ref gap-does-not-exist/,
  );
});

test('report traceability reflects invalid claim sources instead of counting them as covered', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-report-traceability');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.claims[0].source_refs = ['src-old-brief'];
  });

  assert.equal(runCli(['validate', runDir]).status, 1);
  const renderResult = runCli(['render', runDir]);
  assert.equal(renderResult.status, 0);

  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /## Claims/);
  assert.match(report, /## Issue Ledgers/);
  assert.match(report, /Claims with valid canonical source refs: 4\/5/);
  assert.match(report, /Claims with excluded source refs: claim-payments/);
});

test('delta command surfaces drift, stale evidence, and rebaseline requirement', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-delta');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);
  const renderEventsBeforeDelta = journalEventsByName(
    loadNdjson(path.join(runDir, 'journal.ndjson')),
    'report_rendered',
  ).length;

  fs.writeFileSync(
    sourceFixtures.architecture.filePath,
    '# Architecture\n\nCommitted capability seam, migration, retirement, and support obligations.\n\nUpdated architecture promise.\n',
    'utf8',
  );

  const deltaResult = runCli(['delta', runDir]);
  assert.equal(deltaResult.status, 0);
  assert.match(deltaResult.stdout, /Core assessment summary:/);
  assert.match(deltaResult.stdout, /Summary metrics:/);
  assert.match(deltaResult.stdout, /Changed sources: src-architecture/);
  assert.match(deltaResult.stdout, /Rebaseline required: Yes/);
  assert.match(deltaResult.stdout, /Human-readable diff:/);
  assert.match(deltaResult.stdout, /baseline_established=false/);
  assert.match(deltaResult.stdout, /Item adds: Unavailable without baseline_projection\./);
  assert.match(deltaResult.stdout, /Item removals: Unavailable without baseline_projection\./);
  assert.match(deltaResult.stdout, /Item state changes: Unavailable without baseline_projection\./);
  assert.match(deltaResult.stdout, /Relation adds: Unavailable without baseline_projection\./);
  assert.match(deltaResult.stdout, /Relation removals: Unavailable without baseline_projection\./);
  assert.match(
    deltaResult.stdout,
    /Claim commitment changes: Unavailable without baseline_projection\./,
  );
  assert.match(
    deltaResult.stdout,
    /Roadmap order changes: Unavailable without baseline_projection\./,
  );
  assert.match(deltaResult.stdout, /Stale review artifacts: .*review-product/);
  assert.match(deltaResult.stdout, /Rebaseline readiness:/);
  assert.match(deltaResult.stdout, /Status: blocked/);
  assert.match(deltaResult.stdout, /New stale since last change:/);
  for (const key of FIXED_ASSESSMENT_STATS_KEYS) {
    assert.match(deltaResult.stdout, new RegExp(`${key}: \\d+`));
  }

  const manifest = loadJson(path.join(runDir, 'manifest.json'));
  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const deltaEvent = lastJournalEvent(journal, 'delta_computed');
  const validatedEvent = lastJournalEvent(journal, 'run_validated');
  const renderEvents = journalEventsByName(journal, 'report_rendered');
  const renderEvent = renderEvents[renderEvents.length - 1];
  assert.notEqual(manifest.last_delta_at, null);
  assert.notEqual(manifest.last_render_at, null);
  assert.equal(assessment.delta_summary.changed_source_ids.includes('src-architecture'), true);
  assert.equal(assessment.rebaseline_required, true);
  assert.equal(assessment.rebaseline_readiness.status, 'blocked');
  assert.equal(assessment.stale_claims.includes('claim-payments'), true);
  assert.equal(assessment.stale_items.includes('item-payments-seam'), true);
  assert.equal(assessment.stale_proofs.includes('proof-payments-seam'), true);
  assert.ok(deltaEvent);
  assert.ok(validatedEvent);
  assert.ok(renderEvent);
  assert.equal(renderEvents.length, renderEventsBeforeDelta + 1);
  assert.equal(deltaEvent.command_run_id, validatedEvent.command_run_id);
  assert.equal(validatedEvent.command_run_id, renderEvent.command_run_id);
  assert.equal(manifest.last_render_at, renderEvent.ts);
  assert.equal(renderEvent.render_reason, 'mutating_command');
  assert.equal(renderEvent.stale_snapshot.claims.includes('claim-payments'), true);
  assert.deepEqual(renderEvent.new_stale_snapshot.claims, renderEvent.stale_snapshot.claims);

  const statusResult = runCli(['status', runDir]);
  assert.equal(statusResult.status, 1);
  assertSubstringsInOrder(statusResult.stdout, [
    'Core run status:',
    'Summary metrics:',
    'Drift and stale diagnostics:',
    'Rebaseline readiness:',
    'New stale since last change:',
    'Hard-fails and next actions:',
  ]);
  assert.match(statusResult.stdout, /Rebaseline required: Yes/);
  assert.match(statusResult.stdout, /Dirty flags: source_change/);
  assert.match(statusResult.stdout, /Stale proofs: .*proof-payments-seam/);
  assert.match(statusResult.stdout, /Stale review artifacts: .*review-product/);
  for (const key of FIXED_ASSESSMENT_STATS_KEYS) {
    assert.match(statusResult.stdout, new RegExp(`${key}: \\d+`));
  }

  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /## Rebaseline Readiness/);
  assert.match(report, /## New Stale Since Last Change/);
  assert.match(report, /- Stale review artifacts: .*review-product/);
  assert.match(report, /- Reviews: .*review-product/);
});

test('delta uses baseline projection for human-readable diff after rebaseline', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-delta-baseline-projection');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);
  assert.equal(runCli(['rebaseline', runDir]).status, 0);

  mutateBacklog(runDir, (backlog) => {
    backlog.items[0].summary_label = 'Blocked';
    backlog.claims[0].commitment = 'optional';
    backlog.relations.push({
      relation_type: 'enabled_by',
      from: ref('item', 'item-payments-retirement'),
      to: ref('item', 'item-payments-docs'),
    });
    backlog.roadmap_matrix[0].topology_rank = 99;
  });

  const deltaResult = runCli(['delta', runDir]);
  assert.equal(deltaResult.status, 0, deltaResult.stderr || deltaResult.stdout);
  assert.match(deltaResult.stdout, /baseline_established=true/);
  assert.match(deltaResult.stdout, /Item state changes: .*item-payments-seam/);
  assert.match(deltaResult.stdout, /Relation adds: .*item:item-payments-retirement/);
  assert.match(deltaResult.stdout, /Claim commitment changes: .*claim-payments/);
  assert.match(deltaResult.stdout, /Roadmap order changes: .*item-payments-seam/);
});

test('status recomputes assessment after source refresh and surfaces current drift', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-status-refresh-drift');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);

  fs.writeFileSync(
    sourceFixtures.architecture.filePath,
    '# Architecture\n\nCommitted capability seam, migration, retirement, and support obligations.\n\nStatus should detect this drift without a separate validate command.\n',
    'utf8',
  );

  const statusResult = runCli(['status', runDir]);
  assert.equal(statusResult.status, 1, statusResult.stderr || statusResult.stdout);
  assert.match(statusResult.stdout, /Rebaseline required: Yes/);
  assert.match(statusResult.stdout, /Dirty flags: source_change/);
  assert.match(statusResult.stdout, /Changed sources: src-architecture/);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.rebaseline_required, true);
  assert.equal(assessment.delta_summary.changed_source_ids.includes('src-architecture'), true);
});

test('rebaseline command resets drift baseline but preserves proof invalidation semantics', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-rebaseline');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);

  fs.writeFileSync(
    sourceFixtures.architecture.filePath,
    '# Architecture\n\nCommitted capability seam, migration, retirement, and support obligations.\n\nUpdated architecture promise.\n',
    'utf8',
  );

  assert.equal(runCli(['delta', runDir]).status, 0);
  const renderEventsBeforeRebaseline = journalEventsByName(
    loadNdjson(path.join(runDir, 'journal.ndjson')),
    'report_rendered',
  ).length;
  const rebaselineResult = runCli(['rebaseline', runDir]);
  assert.equal(rebaselineResult.status, 0);
  assert.match(rebaselineResult.stdout, /Rebaseline completed/);
  assert.match(rebaselineResult.stdout, /Rebaseline required: No/);
  assert.match(rebaselineResult.stdout, /Summary metrics:/);
  assert.match(rebaselineResult.stdout, /Stale review artifacts: .*review-product/);
  assert.match(rebaselineResult.stdout, /Rebaseline readiness:/);
  assert.match(rebaselineResult.stdout, /Status: not_needed/);
  assert.match(rebaselineResult.stdout, /New stale since last change:/);

  const manifest = loadJson(path.join(runDir, 'manifest.json'));
  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const rebaselineStartedEvent = lastJournalEvent(journal, 'rebaseline_started');
  const rebaselineCompletedEvent = lastJournalEvent(journal, 'rebaseline_completed');
  const renderEvent = lastJournalEvent(journal, 'report_rendered');
  assert.equal(
    manifest.baseline_source_hashes['src-architecture'],
    sha256Fingerprint(fs.readFileSync(sourceFixtures.architecture.filePath, 'utf8')),
  );
  assert.deepEqual(manifest.dirty_flags, []);
  assert.notEqual(manifest.last_render_at, null);
  assert.notEqual(manifest.last_rebaseline_at, null);
  assert.deepEqual(manifest.last_rebaseline_causes, ['source_change']);
  assert.deepEqual(manifest.baseline_issue_item_links, manifest.current_issue_item_links);
  assert.deepEqual(
    manifest.current_issue_item_links['issue:unknown:unknown-provider-retry-window'],
    ['item-payments-migration', 'item-payments-spike'],
  );
  assert.equal(assessment.rebaseline_required, false);
  assert.equal(assessment.stale_proofs.includes('proof-payments-seam'), true);
  assert.equal(assessment.stale_review_artifacts.includes('review-product'), true);
  assert.equal(assessment.delta_summary.stale_review_artifact_ids.includes('review-product'), true);
  assert.ok(rebaselineStartedEvent);
  assert.ok(rebaselineCompletedEvent);
  assert.ok(renderEvent);
  assert.equal(
    journalEventsByName(journal, 'report_rendered').length,
    renderEventsBeforeRebaseline + 1,
  );
  assert.equal(rebaselineStartedEvent.command_run_id, rebaselineCompletedEvent.command_run_id);
  assert.equal(rebaselineCompletedEvent.command_run_id, renderEvent.command_run_id);
  assert.equal(manifest.last_render_at, renderEvent.ts);
  assert.ok(rebaselineCompletedEvent.baseline_projection);
  assert.equal(Array.isArray(rebaselineCompletedEvent.baseline_projection.items), true);
  assert.equal(
    rebaselineCompletedEvent.baseline_projection.items.some(
      (item) => item.item_id === 'item-payments-seam',
    ),
    true,
  );
  assert.equal(renderEvent.render_reason, 'mutating_command');
  assert.equal(
    assessment.next_actions.some((action) => /Refresh stale proof bundles/.test(action)),
    true,
  );
});

test('repair auto-renders with one command_run_id and --no-render is no longer accepted', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-repair-auto-render');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.items[0].summary_label = 'Blocked';
  });

  const renderEventsBeforeRepair = journalEventsByName(
    loadNdjson(path.join(runDir, 'journal.ndjson')),
    'report_rendered',
  ).length;
  const repairResult = runCli(['repair', runDir]);
  assert.equal(repairResult.status, 0, repairResult.stderr || repairResult.stdout);
  assert.match(repairResult.stdout, /Rendered report into/);
  const manifestAfterRepair = loadJson(path.join(runDir, 'manifest.json'));
  assert.notEqual(manifestAfterRepair.last_render_at, null);

  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const repairedEvent = lastJournalEvent(journal, 'canonical_repaired');
  const validatedEvent = lastJournalEvent(journal, 'run_validated');
  const renderEvent = lastJournalEvent(journal, 'report_rendered');
  assert.ok(repairedEvent);
  assert.ok(validatedEvent);
  assert.ok(renderEvent);
  assert.equal(
    journalEventsByName(journal, 'report_rendered').length,
    renderEventsBeforeRepair + 1,
  );
  assert.equal(repairedEvent.command_run_id, validatedEvent.command_run_id);
  assert.equal(validatedEvent.command_run_id, renderEvent.command_run_id);
  assert.equal(manifestAfterRepair.last_render_at, renderEvent.ts);
  assert.equal(renderEvent.render_reason, 'mutating_command');

  const discoverHelpResult = runCli(['help', 'discover']);
  assert.equal(discoverHelpResult.status, 0);
  assert.doesNotMatch(discoverHelpResult.stdout, /--no-render/);

  const repairHelpResult = runCli(['help', 'repair']);
  assert.equal(repairHelpResult.status, 0);
  assert.doesNotMatch(repairHelpResult.stdout, /--no-render/);

  const discoverNoRenderResult = runCli(['discover', runDir, '--no-render']);
  assert.equal(discoverNoRenderResult.status, 2);
  assert.match(discoverNoRenderResult.stderr, /Unknown option '--no-render'/);

  const repairNoRenderResult = runCli(['repair', runDir, '--no-render']);
  assert.equal(repairNoRenderResult.status, 2);
  assert.match(repairNoRenderResult.stderr, /Unknown option '--no-render'/);
});

test('validate auto-renders and recovery render stays outside mutating stale lineage', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-validate-render-lineage');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });

  const renderEventsBeforeValidate = journalEventsByName(
    loadNdjson(path.join(runDir, 'journal.ndjson')),
    'report_rendered',
  ).length;
  const validateResult = runCli(['validate', runDir]);
  assert.equal(validateResult.status, 0, validateResult.stderr || validateResult.stdout);
  assert.match(validateResult.stdout, /Rendered report into/);
  const manifestAfterValidate = loadJson(path.join(runDir, 'manifest.json'));
  assert.notEqual(manifestAfterValidate.last_render_at, null);
  const reportBeforeRecoveryRender = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  const newStaleSectionBeforeRecoveryRender = extractReportSection(
    reportBeforeRecoveryRender,
    'New Stale Since Last Change',
  );

  const afterValidateJournal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const validatedEvent = lastJournalEvent(afterValidateJournal, 'run_validated');
  const mutatingRenderEvent = lastJournalEvent(afterValidateJournal, 'report_rendered');
  assert.ok(validatedEvent);
  assert.ok(mutatingRenderEvent);
  assert.equal(
    journalEventsByName(afterValidateJournal, 'report_rendered').length,
    renderEventsBeforeValidate + 1,
  );
  assert.equal(validatedEvent.command_run_id, mutatingRenderEvent.command_run_id);
  assert.equal(manifestAfterValidate.last_render_at, mutatingRenderEvent.ts);
  assert.equal(mutatingRenderEvent.render_reason, 'mutating_command');
  assert.ok(mutatingRenderEvent.stale_snapshot);
  assert.ok(mutatingRenderEvent.new_stale_snapshot);

  const explicitRenderResult = runCli(['render', runDir]);
  assert.equal(
    explicitRenderResult.status,
    0,
    explicitRenderResult.stderr || explicitRenderResult.stdout,
  );

  const afterExplicitRenderJournal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const renderEvents = journalEventsByName(afterExplicitRenderJournal, 'report_rendered');
  const recoveryRenderEvent = renderEvents[renderEvents.length - 1];
  assert.equal(recoveryRenderEvent.render_reason, 'recovery_render');
  assert.equal('stale_snapshot' in recoveryRenderEvent, false);
  assert.equal('new_stale_snapshot' in recoveryRenderEvent, false);
  const reportAfterRecoveryRender = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.equal(
    extractReportSection(reportAfterRecoveryRender, 'New Stale Since Last Change'),
    newStaleSectionBeforeRecoveryRender,
  );
});

test('stale reviews do not satisfy fresh review coverage or acceptance after rebaseline', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-rebaseline-fresh-review-gates');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);

  fs.writeFileSync(
    sourceFixtures.architecture.filePath,
    '# Architecture\n\nCommitted capability seam, migration, retirement, and support obligations.\n\nUpdated architecture promise.\n',
    'utf8',
  );

  assert.equal(runCli(['delta', runDir]).status, 0);
  assert.equal(runCli(['rebaseline', runDir]).status, 0);

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Run must be reviewed_by at least one fresh run-scope review artifact/,
  );
  assert.match(validationResult.stderr, /Required review role missing: product_strategy/);
  assert.match(
    validationResult.stderr,
    /Track proof track-proof-payments must be reviewed_by at least one fresh track_proof review artifact/,
  );

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.acceptance.achieved, 'draft-only');
  assert.equal(assessment.acceptance.target_satisfied, false);
  assert.deepEqual(assessment.present_review_roles, []);
  assert.equal(assessment.missing_review_roles.includes('product_strategy'), true);
  assert.equal(assessment.pending_track_proof_reviews.includes('track-proof-payments'), true);
});

test('issue-ledger drift still stales linked reviews when current linkage is removed alongside the issue change', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-link-removal-staleness');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.reviews.push({
      review_id: 'review-migration-link-removal',
      review_scope: 'item',
      reviewed_ref: ref('item', 'item-payments-migration'),
      reviewer: 'arch-link-removal-1',
      role: 'system_architecture',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:migration-link-removal'],
      score_contribution: 3,
      reviewed_at: '2026-03-26T00:00:00Z',
    });
    backlog.relations.push({
      relation_id: 'rel-item-migration-review-link-removal',
      relation_type: 'reviewed_by',
      from: ref('item', 'item-payments-migration'),
      to: ref('review', 'review-migration-link-removal'),
    });
  });

  assert.equal(runCli(['validate', runDir]).status, 0);

  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].severity = 'medium';
    backlog.unknowns[0].title = 'Provider retry-window changed while linkage was removed';
    backlog.unknowns[0].related_item_refs = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1, validationResult.stderr || validationResult.stdout);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.stale_review_artifacts.includes('review-migration-link-removal'), true);
});

test('validate backfills missing baseline issue-link snapshots on baselined runs', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-link-snapshot-backfill');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.reviews.push({
      review_id: 'review-migration-link-backfill',
      review_scope: 'item',
      reviewed_ref: ref('item', 'item-payments-migration'),
      reviewer: 'arch-link-backfill-1',
      role: 'system_architecture',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:migration-link-backfill'],
      score_contribution: 3,
      reviewed_at: '2026-03-26T00:00:00Z',
    });
    backlog.relations.push({
      relation_id: 'rel-item-migration-review-link-backfill',
      relation_type: 'reviewed_by',
      from: ref('item', 'item-payments-migration'),
      to: ref('review', 'review-migration-link-backfill'),
    });
  });

  assert.equal(runCli(['validate', runDir]).status, 0);

  const manifestPath = path.join(runDir, 'manifest.json');
  const manifest = loadJson(manifestPath);
  delete manifest.baseline_issue_item_links;
  writeJson(manifestPath, manifest);

  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].severity = 'medium';
    backlog.unknowns[0].title = 'Provider retry-window changed after baseline snapshot upgrade';
    backlog.unknowns[0].related_item_refs = [];
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1, validationResult.stderr || validationResult.stdout);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  const updatedManifest = loadJson(manifestPath);
  assert.equal(assessment.stale_review_artifacts.includes('review-migration-link-backfill'), true);
  assert.equal(
    updatedManifest.baseline_issue_item_links[
      'issue:unknown:unknown-provider-retry-window'
    ].includes('item-payments-migration'),
    true,
  );
  assert.equal(
    updatedManifest.current_issue_item_links[
      'issue:unknown:unknown-provider-retry-window'
    ].includes('item-payments-migration'),
    false,
  );
});

test('issue-ledger drift stales only reviews whose item scope is linked to the changed issue surface', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-issue-scope-staleness');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.id_strategy.gap = 'gap-*';
    backlog.reviews.push(
      {
        review_id: 'review-migration-issue-item',
        review_scope: 'item',
        reviewed_ref: ref('item', 'item-payments-migration'),
        reviewer: 'arch-item-1',
        role: 'system_architecture',
        independent: true,
        verdict: 'pass',
        findings: [],
        hard_fail_report: [],
        evidence_refs: ['note:migration-issue-item'],
        score_contribution: 3,
        reviewed_at: '2026-03-26T00:00:00Z',
      },
      {
        review_id: 'review-docs-unrelated-item',
        review_scope: 'item',
        reviewed_ref: ref('item', 'item-payments-docs'),
        reviewer: 'ops-item-2',
        role: 'support_operations',
        independent: true,
        verdict: 'pass',
        findings: [],
        hard_fail_report: [],
        evidence_refs: ['note:docs-unrelated-item'],
        score_contribution: 3,
        reviewed_at: '2026-03-26T00:00:00Z',
      },
    );
    backlog.relations.push(
      {
        relation_id: 'rel-item-migration-review-issue',
        relation_type: 'reviewed_by',
        from: ref('item', 'item-payments-migration'),
        to: ref('review', 'review-migration-issue-item'),
      },
      {
        relation_id: 'rel-item-docs-review-unrelated',
        relation_type: 'reviewed_by',
        from: ref('item', 'item-payments-docs'),
        to: ref('review', 'review-docs-unrelated-item'),
      },
    );
    backlog.gaps.push({
      issue_id: 'gap-docs-unrelated-origin',
      title: 'Historical docs wording gap remains unrelated to migration unknowns.',
      severity: 'low',
      resolution_state: 'open',
      source_refs: ['src-runtime'],
      owner_implications: ['support'],
      related_claim_refs: ['claim-payments-ops'],
      related_item_refs: ['item-payments-docs'],
    });
    const docsItem = backlog.items.find((item) => item.item_id === 'item-payments-docs');
    assert.ok(docsItem);
    docsItem.origin_ref = [
      ...(docsItem.origin_ref ?? []),
      { kind: 'gap_ref', ref: 'gap-docs-unrelated-origin' },
    ];
  });

  assert.equal(runCli(['validate', runDir]).status, 0);

  mutateBacklog(runDir, (backlog) => {
    backlog.unknowns[0].severity = 'medium';
    backlog.unknowns[0].title = 'Provider retry-window remains ambiguous after partner follow-up';
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1, validationResult.stderr || validationResult.stdout);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.stale_review_artifacts.includes('review-migration-issue-item'), true);
  assert.equal(assessment.stale_review_artifacts.includes('review-docs-unrelated-item'), false);
});

test('validate rejects duplicate physical source authority identity even when source ids differ', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-duplicate-source-authority-identity');

  assert.equal(runCli(['init', runDir]).status, 0);
  const sourceFixtures = seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    backlog.source_authority.push({
      source_id: 'src-runtime-alias',
      ref: sourceFixtures.runtime.filePath,
      kind: 'runtime_evidence',
      authority: 'authoritative_current_truth',
      precedence: 4,
      fingerprint: backlog.source_authority.find((source) => source.source_id === 'src-runtime')
        ?.fingerprint,
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Source src-runtime-alias duplicates source_authority identity .*; reuse source_id src-runtime/,
  );
});

test('render uses canonical roadmap matrix ordering and answers final operating questions', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-final-report');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);
  assert.equal(runCli(['render', runDir]).status, 0);

  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /## Applicability And Exemptions/);
  assert.match(report, /## Extended Item Schema/);
  assert.match(report, /## Review Governance/);
  assert.match(report, /## Lifecycle And Drift/);
  assert.match(report, /## Item Summary Index/);
  assert.match(report, /## Item Detail Sections/);
  assert.match(report, /## Rebaseline Readiness/);
  assert.match(report, /## New Stale Since Last Change/);
  assert.match(report, /## Final Operating Questions/);
  assert.match(report, /## Roadmap Matrix/);
  assert.match(report, /## Proof Dimensions/);
  assert.match(report, /## Closure Evidence/);
  for (const key of FIXED_ASSESSMENT_STATS_KEYS) {
    assert.match(report, new RegExp(`- ${key}: \\d+`));
  }
  assert.match(report, /11\. In what order must items land, and why\? 1\) item-payments-seam/);
  assert.match(
    report,
    /12\. What proof closes each item\? item-payments-seam -> proof-payments-seam \(fresh_or_current, build:payments-v1\)/,
  );
  assert.match(
    report,
    /13\. What proof closes each track\? minimal-working-system -> track-proof-payments \[/,
  );

  const roadmapSection = report.slice(
    report.indexOf('## Roadmap'),
    report.indexOf('## Traceability'),
  );
  assert.equal(
    roadmapSection.indexOf('Payments capability seam') <
      roadmapSection.indexOf('Payments documentation and support source of truth'),
    true,
  );
  assert.match(
    report,
    /15\. Does the roadmap end in a real, runnable, deployable, supportable system\?/,
  );
});

test('report renders stable item summary and detail anchors with relation-resolved fields', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-item-report-navigation');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.reviews.push({
      review_id: 'review-docs-item-report',
      review_scope: 'item',
      reviewed_ref: ref('item', 'item-payments-docs'),
      reviewer: 'support-docs-reviewer',
      role: 'support_operations',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:docs-item-report'],
      score_contribution: 2,
      reviewed_at: '2026-03-26T00:00:00Z',
    });
    backlog.relations.push({
      relation_type: 'reviewed_by',
      from: ref('item', 'item-payments-docs'),
      to: ref('review', 'review-docs-item-report'),
    });
  });

  assert.equal(runCli(['validate', runDir]).status, 0);
  assert.equal(runCli(['render', runDir]).status, 0);

  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(report, /<a id="item-summary-item-payments-seam"><\/a>/);
  assert.match(report, /### item-payments-seam/);
  assert.match(
    report,
    /- Jump to detail: \[item-payments-seam\]\(#item-detail-item-payments-seam\)/,
  );
  assert.match(report, /- item_id: item-payments-seam/);
  assert.match(report, /- title: Payments capability seam/);
  assert.match(report, /- item_class: capability_seam/);
  assert.match(report, /- summary_label: Planned/);
  assert.match(report, /- delivery_state: not_started/);
  assert.match(report, /- track_id: minimal-working-system/);
  assert.match(report, /- depends_on: None/);
  assert.match(report, /<a id="item-detail-item-payments-seam"><\/a>/);
  assert.match(report, /- touches_contracts: .*contract-payments-api/);
  assert.match(report, /- touches_data_domains: .*data-domain-payments/);
  assert.match(report, /- origin_ref: .*claim_ref:claim-payments/);
  assert.match(report, /- claim_refs: claim-payments/);
  assert.match(report, /- proof_refs: proof-payments-seam/);
  assert.match(report, /<a id="item-detail-item-payments-docs"><\/a>/);
  assert.match(
    report,
    /- review_refs: .*review-docs-item-report \(role=support_operations, verdict=pass\)/,
  );
});

test('roadmap matrix topology ranks must respect dependency and parent-child order', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-roadmap-topology-order');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const seamRow = backlog.roadmap_matrix.find((row) => row.item_ref?.id === 'item-payments-seam');
    const sliceRow = backlog.roadmap_matrix.find(
      (row) => row.item_ref?.id === 'item-payments-slice',
    );
    assert.ok(seamRow);
    assert.ok(sliceRow);
    seamRow.topology_rank = 2;
    sliceRow.topology_rank = 1;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Roadmap matrix roadmap-item-payments-slice topology_rank must place parent item-payments-seam before item-payments-slice/,
  );
});

test('roadmap matrix safety and economic ranks must follow methodology precedence', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-roadmap-method-order');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const seamRow = backlog.roadmap_matrix.find((row) => row.item_ref?.id === 'item-payments-seam');
    const docsRow = backlog.roadmap_matrix.find((row) => row.item_ref?.id === 'item-payments-docs');
    const migrationRow = backlog.roadmap_matrix.find(
      (row) => row.item_ref?.id === 'item-payments-migration',
    );
    const retirementRow = backlog.roadmap_matrix.find(
      (row) => row.item_ref?.id === 'item-payments-retirement',
    );
    assert.ok(seamRow);
    assert.ok(docsRow);
    assert.ok(migrationRow);
    assert.ok(retirementRow);

    seamRow.safety_rank = 8;
    docsRow.safety_rank = 1;

    migrationRow.economic_factors = ['lead_time_risk'];
    migrationRow.economic_rank = 1;
    retirementRow.economic_factors = ['compliance_deadline'];
    retirementRow.economic_rank = 8;
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Roadmap matrix safety_rank must place item-payments-seam before item-payments-docs by methodology safety precedence/,
  );
  assert.match(
    validationResult.stderr,
    /Roadmap matrix economic_rank must place item-payments-retirement before item-payments-migration by methodology economic precedence/,
  );
});

test('impacted tracks still require platform and support reviews after scope-aware applicability', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-track-review-applicability');

  assert.equal(runCli(['init', '--acceptance-target', 'draft-only', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    const removedItemIds = new Set(['item-payments-ops', 'item-payments-docs']);
    backlog.items = backlog.items.filter((item) => !removedItemIds.has(item.item_id));
    backlog.proofs = backlog.proofs.filter((proof) => {
      if (proof.covered_ref?.kind !== 'item') {
        return true;
      }
      return !removedItemIds.has(proof.covered_ref.id);
    });
    backlog.relations = backlog.relations.filter((relation) => {
      const fromId = relation.from?.kind === 'item' ? relation.from.id : null;
      const toId = relation.to?.kind === 'item' ? relation.to.id : null;
      return !removedItemIds.has(fromId) && !removedItemIds.has(toId);
    });
    backlog.reviews = backlog.reviews.filter(
      (review) => review.role !== 'platform_sre' && review.role !== 'support_operations',
    );
    backlog.claims = backlog.claims.map((claim) =>
      claim.claim_id === 'claim-payments-ops' ? { ...claim, commitment: 'optional' } : claim,
    );

    for (const item of backlog.items) {
      item.change_surfaces = [];
    }

    backlog.roadmap_matrix = buildRoadmapMatrix(backlog.items, backlog.relations);
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /Required review role missing: platform_sre/);
  assert.match(validationResult.stderr, /Required review role missing: support_operations/);
});

test('invalid run-scope waivers do not satisfy implementation-grade baseline review requirements', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-invalid-waiver');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.reviews = backlog.reviews.filter((review) => review.review_id !== 'review-support');
    backlog.relations = backlog.relations.filter(
      (relation) =>
        !(relation.relation_type === 'reviewed_by' && relation.to?.id === 'review-support'),
    );
    backlog.waivers.push({
      waiver_id: 'waiver-support-run',
      waived_role: 'support_operations',
      scope: ref('run', backlog.metadata.run_id),
      granting_authority: 'Head of Support',
      rationale: 'Trying to waive a directly impacted role should fail.',
      expiry_or_revisit_trigger: 'next release touching support handoff',
      impacted_surfaces: ['support'],
      valid: true,
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Waiver waiver-support-run is invalid because role support_operations is directly impacted by its scope/,
  );
  assert.match(validationResult.stderr, /Required review role missing: support_operations/);

  assert.equal(runCli(['render', runDir]).status, 0);
  const report = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
  assert.match(
    report,
    /\| waiver-support-run \| support_operations \| run:architecture-backlog-invalid-waiver-[^|]+ \| Head of Support \| no \| next release touching support handoff \| support \|/,
  );
});

test('invalid same-scope waiver marks the matching scoped review stale', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-invalid-scoped-waiver');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    backlog.reviews.push({
      review_id: 'review-support-docs-item',
      review_scope: 'item',
      reviewed_ref: ref('item', 'item-payments-docs'),
      reviewer: 'ops-item-1',
      role: 'support_operations',
      independent: true,
      verdict: 'pass',
      findings: [],
      hard_fail_report: [],
      evidence_refs: ['note:support-docs-item'],
      score_contribution: 3,
      reviewed_at: '2026-03-26T00:00:00Z',
    });
    backlog.relations.push({
      relation_id: 'rel-item-docs-review-support-item',
      relation_type: 'reviewed_by',
      from: ref('item', 'item-payments-docs'),
      to: ref('review', 'review-support-docs-item'),
    });
    backlog.waivers.push({
      waiver_id: 'waiver-support-docs-item',
      waived_role: 'support_operations',
      scope: ref('item', 'item-payments-docs'),
      granting_authority: 'Head of Support',
      rationale: 'Directly impacted support scope should not be waived.',
      expiry_or_revisit_trigger: 'next support-sensitive documentation change',
      impacted_surfaces: ['support'],
      valid: true,
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(
    validationResult.stderr,
    /Waiver waiver-support-docs-item is invalid because role support_operations is directly impacted by its scope/,
  );

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.stale_review_artifacts.includes('review-support-docs-item'), true);
  assert.equal(
    assessment.delta_summary.stale_review_artifact_ids.includes('review-support-docs-item'),
    true,
  );
  assert.equal(
    assessment.next_actions.some((action) =>
      /Refresh stale review artifacts: review-support-docs-item/.test(action),
    ),
    true,
  );
});

test('validate journals waiver_recorded and track_closed lifecycle events', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-journal-events');

  assert.equal(runCli(['init', '--acceptance-target', 'implementation-grade', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  mutateBacklog(runDir, (backlog) => {
    const minimalTrack = backlog.tracks.find(
      (track) => track.track_id === 'minimal-working-system',
    );
    assert.ok(minimalTrack);
    minimalTrack.closure_state = 'closed';
    minimalTrack.summary_label = 'Implemented';
    backlog.waivers.push({
      waiver_id: 'waiver-security-docs',
      waived_role: 'security',
      scope: ref('item', 'item-payments-docs'),
      granting_authority: 'Security Director',
      rationale: 'Documentation-only support artifact does not change security posture.',
      expiry_or_revisit_trigger: 'next documentation item touching trust boundaries',
      impacted_surfaces: ['enablement'],
      valid: true,
    });
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);

  const journal = loadNdjson(path.join(runDir, 'journal.ndjson'));
  const waiverEvent = journal.find(
    (event) => event.event === 'waiver_recorded' && event.waiver_id === 'waiver-security-docs',
  );
  const trackClosedEvent = journal.find(
    (event) => event.event === 'track_closed' && event.track_id === 'minimal-working-system',
  );
  const validatedEvent = lastJournalEvent(journal, 'run_validated');
  const renderEvent = lastJournalEvent(journal, 'report_rendered');

  assert.deepEqual(waiverEvent?.valid, true);
  assert.deepEqual(trackClosedEvent?.track_proof_refs, ['track-proof-payments']);
  assert.ok(validatedEvent);
  assert.ok(renderEvent);
  assert.equal(waiverEvent?.command_run_id, validatedEvent.command_run_id);
  assert.equal(trackClosedEvent?.command_run_id, validatedEvent.command_run_id);
  assert.equal(validatedEvent.command_run_id, renderEvent.command_run_id);
});

test('delta surfaces extended rebaseline causes beyond source-contract-topology drift', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-extended-drift-causes');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: true });
  assert.equal(runCli(['validate', runDir]).status, 0);

  mutateBacklog(runDir, (backlog) => {
    const controlProof = backlog.proofs.find(
      (proof) => proof.proof_id === 'proof-payments-control',
    );
    const migrationItem = backlog.items.find((item) => item.item_id === 'item-payments-migration');
    const controlItem = backlog.items.find((item) => item.item_id === 'item-payments-control');
    assert.ok(controlProof);
    assert.ok(migrationItem);
    assert.ok(controlItem);

    controlProof.invalidated_by = [
      ...(controlProof.invalidated_by ?? []),
      'incident_false_closure',
      'security_finding',
      'nfr_breach',
      'external_dependency_change',
      'owner_boundary_change',
      'release_path_change',
    ];
    backlog.unknowns[0].resolution_note =
      'Incident review showed the prior duplicate-suppression assumption was false.';
    backlog.quality_attributes[0].target = 'p95 < 300ms';
    backlog.target_system.external_dependencies.push('fraud-service');
    backlog.target_system.team_and_ownership_assumptions.push(
      'fraud-team owns provider risk controls',
    );
    backlog.as_built.dependency_classifications.push({
      dependency_id: 'fraud-service',
      criticality: 'degraded',
      owner: 'vendor-fraud',
    });
    backlog.as_built.vendor_external_owners.push('vendor-fraud');
    backlog.as_built.ownership_matrix.push('fraud-team');
    migrationItem.owners.consulted_teams.push('fraud-team');
    migrationItem.recovery.strategy = 'Use the incident-certified blue-green rollback path.';
    controlItem.observability_contract.security_controls.push('waf anomaly review');
  });

  const deltaResult = runCli(['delta', runDir]);
  assert.equal(deltaResult.status, 0);

  const assessment = loadJson(path.join(runDir, 'assessment.json'));
  assert.equal(assessment.delta_summary.dirty_flags.includes('incident_false_closure'), true);
  assert.equal(assessment.delta_summary.dirty_flags.includes('security_finding'), true);
  assert.equal(assessment.delta_summary.dirty_flags.includes('nfr_breach'), true);
  assert.equal(assessment.delta_summary.dirty_flags.includes('external_dependency_change'), true);
  assert.equal(assessment.delta_summary.dirty_flags.includes('owner_boundary_change'), true);
  assert.equal(assessment.delta_summary.dirty_flags.includes('release_path_change'), true);
  assert.equal(assessment.stale_proofs.includes('proof-payments-control'), true);
});

test('operator-facing help docs stay synchronized with workflow names, inputs, and runtime contract wording', () => {
  const skillDoc = fs.readFileSync(SKILL_DOC_PATH, 'utf8');
  const operatorHelpDoc = fs.readFileSync(OPERATOR_HELP_PATH, 'utf8');
  const skillWorkflows = [...skillDoc.matchAll(/^#### (.+) \(`(UC-\d{2})`\)$/gm)].map(
    ([, workflowName, ucCode]) => [ucCode, workflowName],
  );
  const operatorWorkflows = [...operatorHelpDoc.matchAll(/^\| `(UC-\d{2})` \| ([^|]+?) \|/gm)].map(
    ([, ucCode, workflowName]) => [ucCode, workflowName.trim()],
  );
  const skillWorkflowCodes = skillWorkflows.map(([ucCode]) => ucCode);
  const operatorWorkflowCodes = operatorWorkflows.map(([ucCode]) => ucCode);
  const skillWorkflowNames = skillWorkflows.map(([, workflowName]) => workflowName);
  const operatorWorkflowNames = operatorWorkflows.map(([, workflowName]) => workflowName);

  assert.match(skillDoc, /^## Help$/m);
  assert.match(skillDoc, /^## Prompt workflows$/m);
  assert.match(
    skillDoc,
    /\[docs\/operator-use-cases\.ru\.md\]\(docs\/operator-use-cases\.ru\.md\)/,
  );
  assert.match(
    skillDoc,
    /edit scenarios accept either updated authoritative inputs or an explicit `source packet`; they never authorize manual edits to `manifest\.json`, `backlog\.json`, `assessment\.json`, or `journal\.ndjson`\./,
  );

  assert.match(operatorHelpDoc, /Этот файл является официальным operator-facing help-reference/);
  assert.match(
    operatorHelpDoc,
    /\| Редактирование беклога \| updated authoritative source или explicit `source packet`; для `delivery state` только authoritative current-truth evidence \| planning-only packet, который напрямую пишет `delivery_state`; ручное редактирование canonical артефактов \|/,
  );

  for (const groupName of OPERATOR_WORKFLOW_GROUPS) {
    assert.match(skillDoc, new RegExp(`^### ${groupName}$`, 'm'));
  }

  assert.equal(skillWorkflows.length, OPERATOR_WORKFLOWS.length);
  assert.equal(operatorWorkflows.length, OPERATOR_WORKFLOWS.length);
  assert.equal(new Set(skillWorkflowCodes).size, OPERATOR_WORKFLOWS.length);
  assert.equal(new Set(operatorWorkflowCodes).size, OPERATOR_WORKFLOWS.length);
  assert.equal(new Set(skillWorkflowNames).size, OPERATOR_WORKFLOWS.length);
  assert.equal(new Set(operatorWorkflowNames).size, OPERATOR_WORKFLOWS.length);
  assert.deepEqual(skillWorkflows, OPERATOR_WORKFLOWS);
  assert.deepEqual(operatorWorkflows, OPERATOR_WORKFLOWS);
  assert.deepEqual(skillWorkflows, operatorWorkflows);

  for (const docText of [skillDoc, operatorHelpDoc]) {
    assert.match(docText, /Gaps And Validation/);
    assert.match(docText, /recovery/i);
    assert.doesNotMatch(docText, /--no-render/);
  }

  assert.match(
    skillDoc,
    /CLI blocks `Rebaseline readiness` \/ `New stale since last change`, plus report sections `Lifecycle And Drift`, `Rebaseline Readiness`, `New Stale Since Last Change`, and `Gaps And Validation`/,
  );
  assert.match(
    skillDoc,
    /`discover` surfaces resolved sources, `stale review artifacts`, `Rebaseline readiness`, and `New stale since last change`[.;]/,
  );
  assert.match(
    operatorHelpDoc,
    /`status` \+ `report\.md`: .*`Rebaseline readiness`.*`Rebaseline Readiness`/,
  );
  assert.match(
    operatorHelpDoc,
    /`status` или `delta` \+ `report\.md`: .*`New stale since last change`.*`New Stale Since Last Change`/,
  );
  assert.match(
    operatorHelpDoc,
    /Формат ответа использует точные runtime statuses: `allowed`, `blocked` или `not_needed`, плюс причины\./,
  );
  assert.match(
    operatorHelpDoc,
    /Отвечает из блока `Rebaseline readiness` в `status` и из section `Rebaseline Readiness` в `report\.md`\./,
  );
  assert.match(
    operatorHelpDoc,
    /Отвечает из блока `New stale since last change` в `discover`, `status` или `delta`, а также из rendered section `New Stale Since Last Change`\./,
  );
});

test('obsolete pre-GA n_a shapes are rejected in canonical items', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-obsolete-na');

  assert.equal(runCli(['init', runDir]).status, 0);
  seedBacklog(runDir, { implementationGrade: false });
  mutateBacklog(runDir, (backlog) => {
    const item = backlog.items.find((entry) => entry.item_id === 'item-payments-docs');
    assert.ok(item);
    item.rollout_mode = 'n_a';
    item.n_a_justification = 'legacy draft field';
  });

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 1);
  assert.match(validationResult.stderr, /uses obsolete pre-GA N\/A fields/);
  assert.match(validationResult.stderr, /uses obsolete rollout_mode=n_a/);
});

test('legacy layout is rejected with pre-GA rewrite guidance', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-legacy');

  writeJson(path.join(runDir, 'manifest.json'), { schema_version: '1' });
  writeJson(path.join(runDir, 'state.snapshot.json'), {});
  writeJson(path.join(runDir, 'validation.json'), {});
  writeJson(path.join(runDir, 'closure.json'), {});
  fs.mkdirSync(path.join(runDir, 'views'));

  const result = runCli(['validate', runDir]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Legacy discovery run layout detected/);
  assert.match(result.stderr, /pre-GA breaking cutover policy/);
});

test('render reports legacy layout or missing artifacts explicitly instead of raw ENOENT', (t) => {
  const legacyRunDir = createTempRunDir(t, 'architecture-backlog-render-legacy');
  writeJson(path.join(legacyRunDir, 'manifest.json'), { schema_version: '1' });
  writeJson(path.join(legacyRunDir, 'state.snapshot.json'), {});
  writeJson(path.join(legacyRunDir, 'validation.json'), {});
  writeJson(path.join(legacyRunDir, 'closure.json'), {});
  fs.mkdirSync(path.join(legacyRunDir, 'views'));

  const legacyResult = runCli(['render', legacyRunDir]);
  assert.equal(legacyResult.status, 1);
  assert.match(legacyResult.stderr, /Legacy discovery run layout detected/);
  assert.doesNotMatch(legacyResult.stderr, /ENOENT/);

  const missingArtifactRunDir = createTempRunDir(t, 'architecture-backlog-render-missing-artifact');
  assert.equal(runCli(['init', missingArtifactRunDir]).status, 0);
  seedBacklog(missingArtifactRunDir, { implementationGrade: false });
  fs.rmSync(path.join(missingArtifactRunDir, 'backlog.json'));

  const missingArtifactResult = runCli(['render', missingArtifactRunDir]);
  assert.equal(missingArtifactResult.status, 1);
  assert.match(missingArtifactResult.stderr, /Missing discovery artifact: .*backlog\.json/);
  assert.doesNotMatch(missingArtifactResult.stderr, /ENOENT/);
});

test('missing run-dir is reported as a usage error', () => {
  const result = runCli(['status']);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /status requires exactly one <run-dir> argument/);
  assert.match(result.stderr, /Usage:/);
});
