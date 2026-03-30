import fs from 'node:fs';
import path from 'node:path';

import {
  PHASE_STATES,
  SCHEMA_VERSION,
  detectLegacyLayout,
  legacyLayoutMessage,
  loadJson,
  runPaths,
  unsupportedSchemaMessage,
  utcNow,
  writeJson,
  type AcceptanceClass,
  type AssessmentFile,
  type BacklogFile,
  type Manifest,
  type PhaseState,
} from './common.js';
import { createEmptyAssessment } from './init-run.js';

export interface BundleRepairResult {
  existingArtifactCount: number;
  hasAnyCanonicalArtifacts: boolean;
  irreparableMissingArtifacts: string[];
  legacyLayoutMessage?: string;
  repairedArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
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
  return PHASE_STATES[0];
}

function createRecoveredManifest(
  backlog: BacklogFile,
  existingAssessment: AssessmentFile | null,
  runDir: string,
  repairedAt: string,
): Manifest {
  const runId = backlog.metadata.run_id ?? path.basename(runDir);
  const acceptanceTarget: AcceptanceClass =
    existingAssessment?.acceptance?.target ?? 'planning-grade';

  return {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    created_at: backlog.metadata.created_at ?? repairedAt,
    updated_at: repairedAt,
    phase_state: derivePhaseState(backlog),
    acceptance_target: acceptanceTarget,
    baseline_source_hashes: {},
    current_source_hashes: {},
    baseline_canonical_hashes: {},
    current_canonical_hashes: {},
    baseline_issue_item_links: {},
    current_issue_item_links: {},
    dirty_flags: [],
    last_assessment_status: existingAssessment?.status ?? 'not-run',
    last_render_at: null,
    last_delta_at: null,
    last_rebaseline_at: null,
    last_rebaseline_causes: [],
    legacy_layout_detected: false,
  };
}

export function repairCompactRunBundle(runDirInput: string): BundleRepairResult {
  const runDir = path.resolve(runDirInput);
  if (detectLegacyLayout(runDir)) {
    return {
      existingArtifactCount: 0,
      hasAnyCanonicalArtifacts: false,
      irreparableMissingArtifacts: [],
      legacyLayoutMessage: legacyLayoutMessage(runDir),
      repairedArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const paths = runPaths(runDir);
  const artifactEntries = [
    ['manifest', paths.manifest],
    ['backlog', paths.backlog],
    ['assessment', paths.assessment],
    ['journal', paths.journal],
  ] as const;
  const existingArtifacts = artifactEntries.filter(([, filePath]) => fs.existsSync(filePath));
  const missingArtifacts = artifactEntries.filter(([, filePath]) => !fs.existsSync(filePath));
  const repairedArtifacts: string[] = [];
  const unsupportedSchemaMessages: string[] = [];

  if (existingArtifacts.length === 0) {
    return {
      existingArtifactCount: 0,
      hasAnyCanonicalArtifacts: false,
      irreparableMissingArtifacts: [],
      repairedArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  if (!fs.existsSync(paths.backlog)) {
    return {
      existingArtifactCount: existingArtifacts.length,
      hasAnyCanonicalArtifacts: true,
      irreparableMissingArtifacts: [paths.backlog],
      repairedArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  const backlog = loadJson<BacklogFile>(paths.backlog);
  if (backlog.metadata?.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('backlog.json'));
  }

  const existingAssessment = fs.existsSync(paths.assessment)
    ? loadJson<AssessmentFile>(paths.assessment)
    : null;
  if (existingAssessment && existingAssessment.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('assessment.json'));
  }

  const existingManifest = fs.existsSync(paths.manifest)
    ? loadJson<Manifest>(paths.manifest)
    : null;
  if (existingManifest && existingManifest.schema_version !== SCHEMA_VERSION) {
    unsupportedSchemaMessages.push(unsupportedSchemaMessage('manifest.json'));
  }

  if (unsupportedSchemaMessages.length > 0) {
    return {
      existingArtifactCount: existingArtifacts.length,
      hasAnyCanonicalArtifacts: true,
      irreparableMissingArtifacts: [],
      repairedArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  const repairedAt = utcNow();
  let manifest = existingManifest;
  let assessment = existingAssessment;

  if (!manifest) {
    manifest = createRecoveredManifest(backlog, assessment, runDir, repairedAt);
    writeJson(paths.manifest, manifest);
    repairedArtifacts.push(paths.manifest);
  }

  if (!assessment) {
    assessment = createEmptyAssessment(manifest.run_id, repairedAt, manifest.acceptance_target);
    writeJson(paths.assessment, assessment);
    repairedArtifacts.push(paths.assessment);
  }

  if (!fs.existsSync(paths.journal)) {
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(paths.journal, '', 'utf8');
    repairedArtifacts.push(paths.journal);
  }

  if (repairedArtifacts.length > 0 && manifest) {
    const updatedManifest: Manifest = {
      ...manifest,
      updated_at: repairedAt,
      phase_state: derivePhaseState(backlog),
      last_assessment_status: assessment?.status ?? manifest.last_assessment_status,
    };
    writeJson(paths.manifest, updatedManifest);
    fs.appendFileSync(
      paths.journal,
      `${JSON.stringify({
        ts: repairedAt,
        event: 'run_bundle_repaired',
        run_id: updatedManifest.run_id,
        repaired_artifacts: repairedArtifacts.map((filePath) => path.basename(filePath)),
        previously_missing_artifacts: missingArtifacts.map(([, filePath]) =>
          path.basename(filePath),
        ),
      })}\n`,
      'utf8',
    );
  }

  return {
    existingArtifactCount: existingArtifacts.length,
    hasAnyCanonicalArtifacts: true,
    irreparableMissingArtifacts: [],
    repairedArtifacts,
    runDir,
    unsupportedSchemaMessages,
  };
}
