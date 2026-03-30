import {
  appendNdjson,
  loadCompactRunArtifacts,
  loadJson,
  runPaths,
  utcNow,
  writeJson,
  type AssessmentFile,
  type Manifest,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';
import {
  buildBaselineProjection,
  readLatestBaselineProjection,
  type BaselineProjection,
} from './command-lineage.js';
import { refreshRunSourceFingerprints } from './source-runtime.js';
import { validateDiscoveryRun } from './validate-run.js';

export interface HumanReadableDelta {
  baselineEstablished: boolean;
  claimCommitmentChanges: string[];
  itemAdds: string[];
  itemRemovals: string[];
  itemStateChanges: string[];
  relationAdds: string[];
  relationRemovals: string[];
  roadmapOrderChanges: string[];
}

export interface DeltaRunResult {
  assessment: AssessmentFile | null;
  humanReadableDiff: HumanReadableDelta;
  inaccessibleSources: string[];
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export interface ComputeDiscoveryDeltaOptions {
  commandRunId?: string;
}

function formatNullable(value: string | null): string {
  return value ?? 'null';
}

function relationKey(relation: BaselineProjection['relations'][number]): string {
  return `${relation.relation_type} ${relation.from.kind}:${relation.from.id} -> ${relation.to.kind}:${relation.to.id}`;
}

function roadmapRowKey(row: BaselineProjection['roadmap_rows'][number]): string {
  return `${row.row_id} (${row.item_id})`;
}

function createEmptyHumanReadableDelta(): HumanReadableDelta {
  return {
    baselineEstablished: false,
    claimCommitmentChanges: [],
    itemAdds: [],
    itemRemovals: [],
    itemStateChanges: [],
    relationAdds: [],
    relationRemovals: [],
    roadmapOrderChanges: [],
  };
}

function buildHumanReadableDelta(
  baselineProjection: BaselineProjection | null,
  currentProjection: BaselineProjection,
): HumanReadableDelta {
  if (baselineProjection === null) {
    return createEmptyHumanReadableDelta();
  }

  const itemAdds: string[] = [];
  const itemRemovals: string[] = [];
  const itemStateChanges: string[] = [];
  const relationAdds: string[] = [];
  const relationRemovals: string[] = [];
  const claimCommitmentChanges: string[] = [];
  const roadmapOrderChanges: string[] = [];

  const baselineItemsById = new Map(
    baselineProjection.items.map((item) => [item.item_id, item] as const),
  );
  const currentItemsById = new Map(
    currentProjection.items.map((item) => [item.item_id, item] as const),
  );
  for (const item of currentProjection.items) {
    if (!baselineItemsById.has(item.item_id)) {
      itemAdds.push(`${item.item_id} (${item.title ?? 'untitled'})`);
      continue;
    }

    const previousItem = baselineItemsById.get(item.item_id);
    if (!previousItem) {
      continue;
    }

    const changes: string[] = [];
    for (const [field, currentValue, previousValue] of [
      ['delivery_state', item.delivery_state, previousItem.delivery_state],
      ['readiness_state', item.readiness_state, previousItem.readiness_state],
      ['closure_state', item.closure_state, previousItem.closure_state],
      ['summary_label', item.summary_label, previousItem.summary_label],
    ] as const) {
      if (currentValue !== previousValue) {
        changes.push(
          `${field}: ${formatNullable(previousValue)} -> ${formatNullable(currentValue)}`,
        );
      }
    }

    if (changes.length > 0) {
      itemStateChanges.push(`${item.item_id}: ${changes.join('; ')}`);
    }
  }
  for (const item of baselineProjection.items) {
    if (!currentItemsById.has(item.item_id)) {
      itemRemovals.push(`${item.item_id} (${item.title ?? 'untitled'})`);
    }
  }

  const baselineRelationKeys = new Set(
    baselineProjection.relations.map((relation) => relationKey(relation)),
  );
  const currentRelationKeys = new Set(
    currentProjection.relations.map((relation) => relationKey(relation)),
  );
  for (const relation of currentProjection.relations.map((entry) => relationKey(entry))) {
    if (!baselineRelationKeys.has(relation)) {
      relationAdds.push(relation);
    }
  }
  for (const relation of baselineProjection.relations.map((entry) => relationKey(entry))) {
    if (!currentRelationKeys.has(relation)) {
      relationRemovals.push(relation);
    }
  }

  const baselineClaimsById = new Map(
    baselineProjection.claim_commitments.map((claim) => [claim.claim_id, claim] as const),
  );
  const currentClaimsById = new Map(
    currentProjection.claim_commitments.map((claim) => [claim.claim_id, claim] as const),
  );
  for (const claim of currentProjection.claim_commitments) {
    const previousClaim = baselineClaimsById.get(claim.claim_id);
    if (!previousClaim) {
      claimCommitmentChanges.push(
        `${claim.claim_id}: commitment ${formatNullable(null)} -> ${formatNullable(claim.commitment)}; revisit_trigger: ${formatNullable(null)} -> ${formatNullable(claim.revisit_trigger)}`,
      );
      continue;
    }
    if (
      claim.commitment !== previousClaim.commitment ||
      claim.revisit_trigger !== previousClaim.revisit_trigger
    ) {
      claimCommitmentChanges.push(
        `${claim.claim_id}: commitment ${formatNullable(previousClaim.commitment)} -> ${formatNullable(claim.commitment)}; revisit_trigger: ${formatNullable(previousClaim.revisit_trigger)} -> ${formatNullable(claim.revisit_trigger)}`,
      );
    }
  }
  for (const claim of baselineProjection.claim_commitments) {
    if (!currentClaimsById.has(claim.claim_id)) {
      claimCommitmentChanges.push(
        `${claim.claim_id}: commitment ${formatNullable(claim.commitment)} -> ${formatNullable(null)}; revisit_trigger: ${formatNullable(claim.revisit_trigger)} -> ${formatNullable(null)}`,
      );
    }
  }

  const baselineRoadmapByRowId = new Map(
    baselineProjection.roadmap_rows.map((row) => [row.row_id, row] as const),
  );
  const currentRoadmapByRowId = new Map(
    currentProjection.roadmap_rows.map((row) => [row.row_id, row] as const),
  );
  for (const row of currentProjection.roadmap_rows) {
    const previousRow = baselineRoadmapByRowId.get(row.row_id);
    if (!previousRow) {
      roadmapOrderChanges.push(`${roadmapRowKey(row)} added to roadmap order`);
      continue;
    }

    const changes: string[] = [];
    for (const [field, currentValue, previousValue] of [
      ['track_id', row.track_id, previousRow.track_id],
      ['topology_rank', row.topology_rank, previousRow.topology_rank],
      ['safety_rank', row.safety_rank, previousRow.safety_rank],
      ['economic_rank', row.economic_rank, previousRow.economic_rank],
    ] as const) {
      if (currentValue !== previousValue) {
        changes.push(`${field}: ${String(previousValue)} -> ${String(currentValue)}`);
      }
    }

    if (changes.length > 0) {
      roadmapOrderChanges.push(`${roadmapRowKey(row)}: ${changes.join('; ')}`);
    }
  }
  for (const row of baselineProjection.roadmap_rows) {
    if (!currentRoadmapByRowId.has(row.row_id)) {
      roadmapOrderChanges.push(`${roadmapRowKey(row)} removed from roadmap order`);
    }
  }

  return {
    baselineEstablished: true,
    claimCommitmentChanges: claimCommitmentChanges.sort(),
    itemAdds: itemAdds.sort(),
    itemRemovals: itemRemovals.sort(),
    itemStateChanges: itemStateChanges.sort(),
    relationAdds: relationAdds.sort(),
    relationRemovals: relationRemovals.sort(),
    roadmapOrderChanges: roadmapOrderChanges.sort(),
  };
}

export async function computeDiscoveryDelta(
  runDirInput: string,
  options: ComputeDiscoveryDeltaOptions = {},
): Promise<DeltaRunResult> {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (
    bundleRepair.legacyLayoutMessage ||
    bundleRepair.irreparableMissingArtifacts.length > 0 ||
    bundleRepair.unsupportedSchemaMessages.length > 0
  ) {
    return {
      assessment: null,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: [],
      ...(bundleRepair.legacyLayoutMessage
        ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage }
        : {}),
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  const refreshResult = await refreshRunSourceFingerprints(runDirInput, {
    ...(options.commandRunId ? { commandRunId: options.commandRunId } : {}),
  });
  if (
    refreshResult.legacyLayoutMessage ||
    refreshResult.missingArtifacts.length > 0 ||
    refreshResult.unsupportedSchemaMessages.length > 0
  ) {
    return {
      assessment: null,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: refreshResult.inaccessibleSources,
      ...(refreshResult.legacyLayoutMessage
        ? { legacyLayoutMessage: refreshResult.legacyLayoutMessage }
        : {}),
      missingArtifacts: refreshResult.missingArtifacts,
      runDir: refreshResult.runDir,
      unsupportedSchemaMessages: refreshResult.unsupportedSchemaMessages,
    };
  }
  if (refreshResult.inaccessibleSources.length > 0) {
    const validationResult = validateDiscoveryRun(refreshResult.runDir, {
      ...(options.commandRunId ? { commandRunId: options.commandRunId } : {}),
    });
    return {
      assessment: validationResult.assessment,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: validationResult.missingArtifacts,
      runDir: refreshResult.runDir,
      unsupportedSchemaMessages: [],
      ...(validationResult.legacyLayoutMessage
        ? { legacyLayoutMessage: validationResult.legacyLayoutMessage }
        : {}),
    };
  }

  const {
    assessment,
    backlog,
    legacyLayoutMessage,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
  } = loadCompactRunArtifacts(runDirInput);

  if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: refreshResult.inaccessibleSources,
      ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  const validationResult = validateDiscoveryRun(runDir, {
    ...(options.commandRunId ? { commandRunId: options.commandRunId } : {}),
  });
  if (!validationResult.assessment) {
    const result: DeltaRunResult = {
      assessment: null,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: validationResult.missingArtifacts,
      runDir,
      unsupportedSchemaMessages: [],
    };
    if (validationResult.legacyLayoutMessage) {
      result.legacyLayoutMessage = validationResult.legacyLayoutMessage;
    }
    return result;
  }

  if (!manifest || !assessment || !backlog) {
    return {
      assessment: null,
      humanReadableDiff: createEmptyHumanReadableDelta(),
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const paths = runPaths(runDir);
  const currentProjection = buildBaselineProjection(backlog);
  const baselineProjection = readLatestBaselineProjection(paths.journal);
  const humanReadableDiff = buildHumanReadableDelta(baselineProjection, currentProjection);

  const refreshedManifest = loadJson<Manifest>(paths.manifest);
  const refreshedAssessment = loadJson<AssessmentFile>(paths.assessment);
  const computedAt = utcNow();
  refreshedManifest.updated_at = computedAt;
  refreshedManifest.last_delta_at = computedAt;
  writeJson(paths.manifest, refreshedManifest);
  appendNdjson(paths.journal, {
    ts: computedAt,
    event: 'delta_computed',
    run_id: refreshedManifest.run_id,
    ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
    changed_source_ids: refreshedAssessment.delta_summary.changed_source_ids,
    changed_claim_ids: refreshedAssessment.delta_summary.changed_claim_ids,
    stale_item_ids: refreshedAssessment.delta_summary.stale_item_ids,
    stale_proof_ids: refreshedAssessment.delta_summary.stale_proof_ids,
    track_gate_ids_to_recalculate: refreshedAssessment.delta_summary.track_gate_ids_to_recalculate,
    rebaseline_required: refreshedAssessment.rebaseline_required,
  });

  return {
    assessment: refreshedAssessment,
    humanReadableDiff,
    inaccessibleSources: refreshResult.inaccessibleSources,
    missingArtifacts: [],
    runDir,
    unsupportedSchemaMessages: [],
  };
}
