import {
  loadCompactRunArtifacts,
  type AssessmentFile,
  type Manifest,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';

export interface DiscoveryRunStatus {
  assessment: AssessmentFile | null;
  legacyLayoutMessage?: string;
  manifest: Manifest | null;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

export function getDiscoveryRunStatus(runDirInput: string): DiscoveryRunStatus {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) {
    return {
      assessment: null,
      manifest: null,
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
      ...(bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {}),
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
