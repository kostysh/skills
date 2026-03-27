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
import { refreshRunSourceFingerprints } from './source-runtime.js';
import { validateDiscoveryRun } from './validate-run.js';

export interface DeltaRunResult {
  assessment: AssessmentFile | null;
  inaccessibleSources: string[];
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export async function computeDiscoveryDelta(runDirInput: string): Promise<DeltaRunResult> {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      inaccessibleSources: [],
      ...(bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {}),
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  const refreshResult = await refreshRunSourceFingerprints(runDirInput);
  if (refreshResult.legacyLayoutMessage || refreshResult.missingArtifacts.length > 0 || refreshResult.unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      inaccessibleSources: refreshResult.inaccessibleSources,
      ...(refreshResult.legacyLayoutMessage ? { legacyLayoutMessage: refreshResult.legacyLayoutMessage } : {}),
      missingArtifacts: refreshResult.missingArtifacts,
      runDir: refreshResult.runDir,
      unsupportedSchemaMessages: refreshResult.unsupportedSchemaMessages,
    };
  }
  if (refreshResult.inaccessibleSources.length > 0) {
    return {
      assessment: null,
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir: refreshResult.runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const { assessment, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } =
    loadCompactRunArtifacts(runDirInput);

  if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      inaccessibleSources: refreshResult.inaccessibleSources,
      ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  const validationResult = validateDiscoveryRun(runDir);
  if (!validationResult.assessment) {
    const result: DeltaRunResult = {
      assessment: null,
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

  if (!manifest || !assessment) {
    return {
      assessment: null,
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const paths = runPaths(runDir);
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
    changed_source_ids: refreshedAssessment.delta_summary.changed_source_ids,
    changed_claim_ids: refreshedAssessment.delta_summary.changed_claim_ids,
    stale_item_ids: refreshedAssessment.delta_summary.stale_item_ids,
    stale_proof_ids: refreshedAssessment.delta_summary.stale_proof_ids,
    track_gate_ids_to_recalculate: refreshedAssessment.delta_summary.track_gate_ids_to_recalculate,
    rebaseline_required: refreshedAssessment.rebaseline_required,
  });

  return {
    assessment: refreshedAssessment,
    inaccessibleSources: refreshResult.inaccessibleSources,
    missingArtifacts: [],
    runDir,
    unsupportedSchemaMessages: [],
  };
}
