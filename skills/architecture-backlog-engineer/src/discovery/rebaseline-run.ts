import {
  appendNdjson,
  loadCompactRunArtifacts,
  runPaths,
  utcNow,
  writeJson,
  type AssessmentFile,
  type DriftCause,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';
import { computeDriftState } from './drift-state.js';
import { refreshRunSourceFingerprints } from './source-runtime.js';
import { validateDiscoveryRun } from './validate-run.js';

export interface RebaselineRunResult {
  assessment: AssessmentFile | null;
  causes: DriftCause[];
  inaccessibleSources: string[];
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  rebaselinedAt?: string;
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export async function rebaselineDiscoveryRun(runDirInput: string): Promise<RebaselineRunResult> {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      causes: [],
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
      causes: [],
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
      causes: [],
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir: refreshResult.runDir,
      unsupportedSchemaMessages: [],
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
      causes: [],
      inaccessibleSources: refreshResult.inaccessibleSources,
      ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  if (!manifest || !backlog || !assessment) {
    return {
      assessment: null,
      causes: [],
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const paths = runPaths(runDir);
  const driftState = computeDriftState(manifest, backlog);
  const rebaselinedAt = utcNow();
  const causes = [...new Set(driftState.deltaSummary.dirty_flags)] as DriftCause[];

  appendNdjson(paths.journal, {
    ts: rebaselinedAt,
    event: 'rebaseline_started',
    run_id: manifest.run_id,
    previous_baseline_source_hashes: manifest.baseline_source_hashes,
    previous_baseline_canonical_hashes: manifest.baseline_canonical_hashes,
    causes,
  });

  manifest.updated_at = rebaselinedAt;
  manifest.last_rebaseline_at = rebaselinedAt;
  manifest.last_rebaseline_causes = causes;
  manifest.baseline_source_hashes = driftState.currentSourceHashes;
  manifest.current_source_hashes = driftState.currentSourceHashes;
  manifest.baseline_canonical_hashes = driftState.currentCanonicalHashes;
  manifest.current_canonical_hashes = driftState.currentCanonicalHashes;
  manifest.dirty_flags = [];
  writeJson(paths.manifest, manifest);

  const validationResult = validateDiscoveryRun(runDir);
  if (!validationResult.assessment) {
    const result: RebaselineRunResult = {
      assessment: null,
      causes,
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: validationResult.missingArtifacts,
      rebaselinedAt,
      runDir,
      unsupportedSchemaMessages: [],
    };
    if (validationResult.legacyLayoutMessage) {
      result.legacyLayoutMessage = validationResult.legacyLayoutMessage;
    }
    return result;
  }

  appendNdjson(paths.journal, {
    ts: rebaselinedAt,
    event: 'rebaseline_completed',
    run_id: manifest.run_id,
    causes,
    assessment_status: validationResult.assessment.status,
    stale_claim_ids: validationResult.assessment.stale_claims,
    stale_item_ids: validationResult.assessment.stale_items,
    stale_proof_ids: validationResult.assessment.stale_proofs,
  });

  return {
    assessment: validationResult.assessment,
    causes,
    inaccessibleSources: refreshResult.inaccessibleSources,
    missingArtifacts: [],
    rebaselinedAt,
    runDir,
    unsupportedSchemaMessages: [],
  };
}
