import fs from 'node:fs';
import path from 'node:path';

import {
  appendNdjson,
  type BacklogFile,
  loadCompactRunArtifacts,
  loadJson,
  runPaths,
  utcNow,
  writeJson,
  type AcceptanceClass,
  type AssessmentFile,
  type Manifest,
  type PhaseState,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';
import { initializeDiscoveryRun } from './init-run.js';
import { repairBacklogCanonicalState } from './repair-run.js';
import {
  loadSourcePacketRefs,
  mergeDiscoveryPacketsIntoBacklog,
  refreshSourceFingerprintsInBacklog,
  resolveSourceInputs,
  type SourceInputSpec,
} from './source-runtime.js';
import { validateDiscoveryRun } from './validate-run.js';

export interface DiscoverRunOptions {
  acceptanceTarget?: AcceptanceClass;
  commandRunId?: string;
  packetRefs?: string[];
  repair?: boolean;
  runDir: string;
  sourceInputs: SourceInputSpec[];
}

export interface DiscoverRunResult {
  assessment: AssessmentFile | null;
  appliedPackets: number;
  appliedRepairs: string[];
  initialized: boolean;
  inaccessibleSources: string[];
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  runDir: string;
  sourceIds: string[];
  unsupportedSchemaMessages: string[];
}

function runHasAnyCanonicalArtifact(runDir: string): boolean {
  const paths = runPaths(runDir);
  return [paths.manifest, paths.backlog, paths.assessment, paths.journal, paths.report].some(
    (filePath) => fs.existsSync(filePath),
  );
}

function hasAnyEntries(record: Record<string, unknown>): boolean {
  return Object.values(record).some((value) => Array.isArray(value) && value.length > 0);
}

function derivePhaseState(backlog: BacklogFile): PhaseState {
  if (backlog.items.length > 0) {
    return 'graph_built';
  }
  if (backlog.claims.length > 0) {
    return 'claims_extracted';
  }
  if (hasAnyEntries(backlog.as_built as unknown as Record<string, unknown>)) {
    return 'as_built_reconstructed';
  }
  if (hasAnyEntries(backlog.target_system as unknown as Record<string, unknown>)) {
    return 'target_reconstructed';
  }
  if (backlog.source_authority.length > 0) {
    return 'sources_resolved';
  }
  return 'initialized';
}

export async function discoverDiscoveryRun(
  options: DiscoverRunOptions,
): Promise<DiscoverRunResult> {
  const runDir = path.resolve(options.runDir);
  let initialized = false;

  const bundleRepair = repairCompactRunBundle(runDir);
  if (bundleRepair.legacyLayoutMessage || bundleRepair.unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      appliedPackets: 0,
      appliedRepairs: [],
      initialized,
      inaccessibleSources: [],
      ...(bundleRepair.legacyLayoutMessage
        ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage }
        : {}),
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      sourceIds: [],
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  if (!bundleRepair.hasAnyCanonicalArtifacts) {
    initializeDiscoveryRun({
      ...(options.acceptanceTarget ? { acceptanceTarget: options.acceptanceTarget } : {}),
      ...(options.commandRunId ? { commandRunId: options.commandRunId } : {}),
      runDir,
    });
    initialized = true;
  } else if (bundleRepair.irreparableMissingArtifacts.length > 0) {
    return {
      assessment: null,
      appliedPackets: 0,
      appliedRepairs: [],
      initialized,
      inaccessibleSources: [],
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      sourceIds: [],
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  const compactArtifacts = loadCompactRunArtifacts(runDir);
  if (
    compactArtifacts.legacyLayoutMessage ||
    compactArtifacts.unsupportedSchemaMessages.length > 0
  ) {
    return {
      assessment: null,
      appliedPackets: 0,
      appliedRepairs: [],
      initialized,
      inaccessibleSources: [],
      ...(compactArtifacts.legacyLayoutMessage
        ? { legacyLayoutMessage: compactArtifacts.legacyLayoutMessage }
        : {}),
      missingArtifacts: compactArtifacts.missingArtifacts,
      runDir: compactArtifacts.runDir,
      sourceIds: [],
      unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages,
    };
  }

  if (compactArtifacts.missingArtifacts.length > 0) {
    if (runHasAnyCanonicalArtifact(runDir)) {
      return {
        assessment: null,
        appliedPackets: 0,
        appliedRepairs: [],
        initialized,
        inaccessibleSources: [],
        missingArtifacts: compactArtifacts.missingArtifacts,
        runDir: compactArtifacts.runDir,
        sourceIds: [],
        unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages,
      };
    }
  }

  const { backlog, manifest } = compactArtifacts;
  if (!backlog || !manifest) {
    return {
      assessment: null,
      appliedPackets: 0,
      appliedRepairs: [],
      initialized,
      inaccessibleSources: [],
      missingArtifacts: compactArtifacts.missingArtifacts,
      runDir: compactArtifacts.runDir,
      sourceIds: [],
      unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages,
    };
  }

  const paths = runPaths(runDir);
  const resolvedSources = await resolveSourceInputs(options.sourceInputs, process.cwd());
  const explicitPackets = await loadSourcePacketRefs(options.packetRefs ?? [], process.cwd());
  const mergeResult = mergeDiscoveryPacketsIntoBacklog(backlog, resolvedSources, explicitPackets);
  const refreshResult = await refreshSourceFingerprintsInBacklog(backlog, process.cwd());
  const repairResult =
    options.repair === false
      ? { appliedRepairs: [], changed: false }
      : repairBacklogCanonicalState(backlog);

  const loadedManifest = loadJson<Manifest>(paths.manifest);
  loadedManifest.updated_at = utcNow();
  if (options.acceptanceTarget) {
    loadedManifest.acceptance_target = options.acceptanceTarget;
  }
  loadedManifest.phase_state = derivePhaseState(backlog);
  writeJson(paths.backlog, backlog);
  writeJson(paths.manifest, loadedManifest);
  appendNdjson(paths.journal, {
    ts: loadedManifest.updated_at,
    event: 'sources_discovered',
    run_id: loadedManifest.run_id,
    ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
    source_ids: mergeResult.appliedSourceIds,
    packet_count: mergeResult.appliedPackets,
    initialized,
    refreshed_source_ids: refreshResult.changedSourceIds,
    access_state_changed_source_ids: refreshResult.accessStateChangedSourceIds,
    inaccessible_source_ids: refreshResult.inaccessibleSources,
    applied_repairs: repairResult.appliedRepairs,
  });

  if (refreshResult.inaccessibleSources.length > 0) {
    return {
      assessment: null,
      appliedPackets: mergeResult.appliedPackets,
      appliedRepairs: repairResult.appliedRepairs,
      initialized,
      inaccessibleSources: refreshResult.inaccessibleSources,
      missingArtifacts: [],
      runDir,
      sourceIds: mergeResult.appliedSourceIds,
      unsupportedSchemaMessages: [],
    };
  }

  const validationResult = validateDiscoveryRun(runDir, {
    ...(options.commandRunId ? { commandRunId: options.commandRunId } : {}),
  });

  return {
    assessment: validationResult.assessment,
    appliedPackets: mergeResult.appliedPackets,
    appliedRepairs: repairResult.appliedRepairs,
    initialized,
    inaccessibleSources: refreshResult.inaccessibleSources,
    missingArtifacts: validationResult.missingArtifacts,
    runDir,
    sourceIds: mergeResult.appliedSourceIds,
    unsupportedSchemaMessages: [],
    ...(validationResult.legacyLayoutMessage
      ? { legacyLayoutMessage: validationResult.legacyLayoutMessage }
      : {}),
  };
}
