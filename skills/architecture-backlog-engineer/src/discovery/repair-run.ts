import {
  appendNdjson,
  asArray,
  isNonEmptyString,
  loadCompactRunArtifacts,
  runPaths,
  utcNow,
  writeJson,
  type BacklogFile,
  type BacklogProtocolState,
  type DeliveryState,
  type ItemClosureState,
  type Manifest,
  type ReadinessState,
  type SummaryLabel,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';
import { buildRoadmapMatrix } from './roadmap-matrix.js';

export interface RepairBacklogResult {
  appliedRepairs: string[];
  backlog: BacklogFile;
  changed: boolean;
}

export interface RepairRunResult {
  appliedRepairs: string[];
  backlog: BacklogFile | null;
  legacyLayoutMessage?: string;
  manifest: Manifest | null;
  missingArtifacts: string[];
  repairedAt?: string;
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export interface RepairDiscoveryRunOptions {
  commandRunId?: string;
}

function deriveSummaryLabel(
  backlogProtocolState: BacklogProtocolState | undefined,
  deliveryState: DeliveryState | undefined,
  readinessState: ReadinessState | undefined,
  closureState: ItemClosureState | undefined,
  blocked: boolean,
): SummaryLabel {
  if (blocked) {
    return 'Blocked';
  }
  if (deliveryState === 'delivered' && closureState === 'closed') {
    return 'Implemented';
  }
  if (deliveryState === 'partially_delivered' || closureState === 'partial') {
    return 'Partially implemented';
  }
  if (readinessState === 'needs_clarification') {
    return 'Needs clarification';
  }
  if (
    backlogProtocolState === 'candidate' &&
    deliveryState === 'not_started' &&
    readinessState === 'not_ready'
  ) {
    return 'Missing';
  }
  return 'Planned';
}

function blockedState(backlogRecord: Record<string, unknown>): boolean {
  const planningConstraints = backlogRecord.planning_constraints;
  const blockedByDecisionStatus =
    typeof planningConstraints === 'object' &&
    planningConstraints !== null &&
    (planningConstraints as Record<string, unknown>).blocked_by_decision_status === true;

  return blockedByDecisionStatus || isNonEmptyString(backlogRecord.blocked_without);
}

function syncTrackDerivedRefs(backlog: BacklogFile, appliedRepairs: string[]): void {
  const journeyIdsByTrackId = new Map<string, string[]>();
  for (const journey of backlog.track_journeys) {
    if (!isNonEmptyString(journey.track_id) || !isNonEmptyString(journey.journey_id)) {
      continue;
    }
    const current = journeyIdsByTrackId.get(journey.track_id) ?? [];
    current.push(journey.journey_id);
    journeyIdsByTrackId.set(journey.track_id, current);
  }

  const gateIdsByTrackId = new Map<string, string[]>();
  for (const gate of backlog.track_gates) {
    if (!isNonEmptyString(gate.track_id) || !isNonEmptyString(gate.track_gate_id)) {
      continue;
    }
    const current = gateIdsByTrackId.get(gate.track_id) ?? [];
    current.push(gate.track_gate_id);
    gateIdsByTrackId.set(gate.track_id, current);
  }

  const trackProofIdsByTrackId = new Map<string, string[]>();
  for (const trackProof of backlog.track_proofs) {
    if (!isNonEmptyString(trackProof.track_id) || !isNonEmptyString(trackProof.track_proof_id)) {
      continue;
    }
    const current = trackProofIdsByTrackId.get(trackProof.track_id) ?? [];
    current.push(trackProof.track_proof_id);
    trackProofIdsByTrackId.set(trackProof.track_id, current);
  }

  for (const track of backlog.tracks) {
    const derivedJourneyIds = [...new Set(journeyIdsByTrackId.get(track.track_id) ?? [])];
    const derivedGateIds = [...new Set(gateIdsByTrackId.get(track.track_id) ?? [])];
    const derivedTrackProofIds = [...new Set(trackProofIdsByTrackId.get(track.track_id) ?? [])];

    const currentJourneyIds = [
      ...new Set(asArray(track.first_shippable_journey_ids).filter(isNonEmptyString)),
    ];
    if (JSON.stringify(currentJourneyIds) !== JSON.stringify(derivedJourneyIds)) {
      track.first_shippable_journey_ids = derivedJourneyIds;
      appliedRepairs.push(`track:${track.track_id}:first_shippable_journey_ids`);
    }

    const currentGateIds = [
      ...new Set(asArray(track.required_track_gate_ids).filter(isNonEmptyString)),
    ];
    if (JSON.stringify(currentGateIds) !== JSON.stringify(derivedGateIds)) {
      track.required_track_gate_ids = derivedGateIds;
      appliedRepairs.push(`track:${track.track_id}:required_track_gate_ids`);
    }

    const currentTrackProofIds = [
      ...new Set(asArray(track.track_proof_refs).filter(isNonEmptyString)),
    ];
    if (JSON.stringify(currentTrackProofIds) !== JSON.stringify(derivedTrackProofIds)) {
      track.track_proof_refs = derivedTrackProofIds;
      appliedRepairs.push(`track:${track.track_id}:track_proof_refs`);
    }
  }
}

export function repairBacklogCanonicalState(backlog: BacklogFile): RepairBacklogResult {
  const appliedRepairs: string[] = [];

  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id)) {
      continue;
    }
    const derivedSummaryLabel = deriveSummaryLabel(
      item.backlog_protocol_state,
      item.delivery_state,
      item.readiness_state,
      item.closure_state,
      blockedState(item),
    );
    if (item.summary_label !== derivedSummaryLabel) {
      item.summary_label = derivedSummaryLabel;
      appliedRepairs.push(`item:${item.item_id}:summary_label`);
    }
  }

  for (const track of backlog.tracks) {
    const derivedSummaryLabel = deriveSummaryLabel(
      track.backlog_protocol_state,
      track.delivery_state,
      track.readiness_state,
      track.closure_state,
      false,
    );
    if (track.summary_label !== derivedSummaryLabel) {
      track.summary_label = derivedSummaryLabel;
      appliedRepairs.push(`track:${track.track_id}:summary_label`);
    }
  }

  syncTrackDerivedRefs(backlog, appliedRepairs);

  const derivedRoadmapMatrix = buildRoadmapMatrix(backlog.items, backlog.relations);
  const currentRoadmapMatrix = JSON.stringify(backlog.roadmap_matrix);
  const nextRoadmapMatrix = JSON.stringify(derivedRoadmapMatrix);
  if (currentRoadmapMatrix !== nextRoadmapMatrix) {
    backlog.roadmap_matrix = derivedRoadmapMatrix;
    appliedRepairs.push('roadmap_matrix:rebuilt');
  }

  if (appliedRepairs.length > 0) {
    backlog.metadata.updated_at = utcNow();
  }

  return {
    appliedRepairs,
    backlog,
    changed: appliedRepairs.length > 0,
  };
}

export function repairDiscoveryRun(
  runDirInput: string,
  options: RepairDiscoveryRunOptions = {},
): RepairRunResult {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (bundleRepair.legacyLayoutMessage || bundleRepair.unsupportedSchemaMessages.length > 0) {
    return {
      appliedRepairs: [],
      backlog: null,
      manifest: null,
      ...(bundleRepair.legacyLayoutMessage
        ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage }
        : {}),
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }
  if (!bundleRepair.hasAnyCanonicalArtifacts) {
    return {
      appliedRepairs: [],
      backlog: null,
      manifest: null,
      missingArtifacts: [runPaths(runDirInput).backlog],
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: [],
    };
  }
  if (bundleRepair.irreparableMissingArtifacts.length > 0) {
    return {
      appliedRepairs: [],
      backlog: null,
      manifest: null,
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  const {
    backlog,
    legacyLayoutMessage,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
  } = loadCompactRunArtifacts(runDirInput);

  if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) {
    return {
      appliedRepairs: [],
      backlog: null,
      manifest: null,
      ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  if (!backlog || !manifest) {
    return {
      appliedRepairs: [],
      backlog: null,
      manifest: null,
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const repairResult = repairBacklogCanonicalState(backlog);
  const repairedAt = utcNow();
  const paths = runPaths(runDir);

  if (repairResult.changed) {
    manifest.updated_at = repairedAt;
    if (manifest.phase_state === 'initialized') {
      manifest.phase_state = 'graph_built';
    }
    writeJson(paths.backlog, backlog);
    writeJson(paths.manifest, manifest);
    appendNdjson(paths.journal, {
      ts: repairedAt,
      event: 'canonical_repaired',
      run_id: manifest.run_id,
      ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
      applied_repairs: repairResult.appliedRepairs,
    });
  }

  return {
    appliedRepairs: repairResult.appliedRepairs,
    backlog,
    manifest,
    missingArtifacts: [],
    repairedAt,
    runDir,
    unsupportedSchemaMessages: [],
  };
}
