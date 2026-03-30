import { loadCompactRunArtifacts, runPaths, type AssessmentFile, type Manifest } from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';
import { readLatestMutatingNewStaleSnapshot } from './command-lineage.js';

export interface DiscoveryRunStatus {
  assessment: AssessmentFile | null;
  legacyLayoutMessage?: string;
  manifest: Manifest | null;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

const SUMMARY_METRIC_DEFINITIONS: Array<[keyof AssessmentFile['stats'], string]> = [
  ['sources_total', 'sources_total'],
  ['claims_total', 'claims_total'],
  ['contracts_total', 'contracts_total'],
  ['data_domains_total', 'data_domains_total'],
  ['items_total', 'items_total'],
  ['items_delivered', 'items_delivered'],
  ['items_partially_delivered', 'items_partially_delivered'],
  ['items_not_started', 'items_not_started'],
  ['gaps_total', 'gaps_total'],
  ['unknowns_total', 'unknowns_total'],
  ['contradictions_total', 'contradictions_total'],
  ['stale_claims_total', 'stale_claims_total'],
  ['stale_items_total', 'stale_items_total'],
  ['stale_proofs_total', 'stale_proofs_total'],
  ['stale_review_artifacts_total', 'stale_review_artifacts_total'],
  ['warnings_total', 'warnings_total'],
  ['hard_fails_total', 'hard_fails_total'],
  ['dor_ready_total', 'dor_ready_total'],
  ['review_artifacts_total', 'review_artifacts_total'],
  ['waivers_total', 'waivers_total'],
];

function formatStringList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'None';
}

export function getSummaryMetricLines(assessment: AssessmentFile): string[] {
  return SUMMARY_METRIC_DEFINITIONS.map(
    ([key, label]) => `${label}: ${String(assessment.stats[key] ?? 0)}`,
  );
}

export function getDiscoveryRunStatus(runDirInput: string): DiscoveryRunStatus {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (
    bundleRepair.legacyLayoutMessage ||
    bundleRepair.irreparableMissingArtifacts.length > 0 ||
    bundleRepair.unsupportedSchemaMessages.length > 0
  ) {
    return {
      assessment: null,
      manifest: null,
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
      ...(bundleRepair.legacyLayoutMessage
        ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage }
        : {}),
    };
  }

  const {
    assessment,
    legacyLayoutMessage,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
  } = loadCompactRunArtifacts(runDirInput);

  return {
    assessment,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
    ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
  };
}

export function renderDiscoveryStatusOutput(runDirInput: string): string[] {
  const status = getDiscoveryRunStatus(runDirInput);
  if (!status.manifest || !status.assessment) {
    return [];
  }

  const { assessment, manifest, runDir } = status;
  const newStale = readLatestMutatingNewStaleSnapshot(runPaths(runDir).journal);

  return [
    'Core run status:',
    `Run: ${manifest.run_id}`,
    `Phase: ${manifest.phase_state}`,
    `Target acceptance: ${manifest.acceptance_target}`,
    `Achieved acceptance: ${assessment.acceptance.achieved}`,
    `Assessment: ${assessment.status}`,
    `Closure: ${assessment.closure.status}`,
    `Score: ${assessment.score.total}/${assessment.score.max}`,
    `Last render: ${manifest.last_render_at ?? 'Never'}`,
    `Last delta: ${manifest.last_delta_at ?? 'Never'}`,
    `Last rebaseline: ${manifest.last_rebaseline_at ?? 'Never'}`,
    '',
    'Summary metrics:',
    ...getSummaryMetricLines(assessment),
    '',
    'Drift and stale diagnostics:',
    `Rebaseline required: ${assessment.rebaseline_required ? 'Yes' : 'No'}`,
    `Dirty flags: ${formatStringList(assessment.delta_summary.dirty_flags)}`,
    `Changed sources: ${formatStringList(assessment.delta_summary.changed_source_ids)}`,
    `Changed claims: ${formatStringList(assessment.delta_summary.changed_claim_ids)}`,
    `Track gates to recalculate: ${formatStringList(
      assessment.delta_summary.track_gate_ids_to_recalculate,
    )}`,
    `Stale claims: ${formatStringList(assessment.stale_claims)}`,
    `Stale items: ${formatStringList(assessment.stale_items)}`,
    `Stale proofs: ${formatStringList(assessment.stale_proofs)}`,
    `Stale review artifacts: ${formatStringList(assessment.stale_review_artifacts)}`,
    `Missing review roles: ${formatStringList(assessment.missing_review_roles)}`,
    `Pending track-proof reviews: ${formatStringList(assessment.pending_track_proof_reviews)}`,
    `Waiver findings: ${formatStringList(assessment.waiver_findings)}`,
    '',
    'Rebaseline readiness:',
    `Status: ${assessment.rebaseline_readiness.status}`,
    ...(assessment.rebaseline_readiness.reasons.length > 0
      ? assessment.rebaseline_readiness.reasons.map((reason) => `- ${reason}`)
      : ['- None']),
    '',
    'New stale since last change:',
    `Status: ${newStale.status}`,
    `Reason: ${newStale.reason ?? 'None'}`,
    `Claims: ${formatStringList(newStale.claims)}`,
    `Items: ${formatStringList(newStale.items)}`,
    `Proofs: ${formatStringList(newStale.proofs)}`,
    `Reviews: ${formatStringList(newStale.reviews)}`,
    '',
    'Hard-fails and next actions:',
    `Hard-fails: ${assessment.hard_fails.length}`,
    ...(assessment.hard_fails.length > 0
      ? ['Hard-fail details:', ...assessment.hard_fails.map((hardFail) => `- ${hardFail}`)]
      : ['Hard-fail details: None']),
    ...(assessment.next_actions.length > 0
      ? ['Next actions:', ...assessment.next_actions.map((action) => `- ${action}`)]
      : ['Next actions: None']),
  ];
}
