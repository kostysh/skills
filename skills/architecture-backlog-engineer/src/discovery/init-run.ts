import fs from 'node:fs';
import path from 'node:path';

import {
  ACCEPTANCE_CLASSES,
  BACKLOG_PROTOCOL_STATES,
  DELIVERY_STATES,
  ITEM_CLOSURE_STATES,
  PHASE_STATES,
  READINESS_STATES,
  SCHEMA_VERSION,
  SUMMARY_LABELS,
  appendNdjson,
  createEmptyAsBuiltModel,
  createEmptyTargetSystemModel,
  detectLegacyLayout,
  legacyLayoutMessage,
  runPaths,
  utcNow,
  writeJson,
  type AcceptanceClass,
  type AssessmentFile,
  type BacklogFile,
  type Manifest,
} from './common.js';

const DEFAULT_ACCEPTANCE_TARGET: AcceptanceClass = 'planning-grade';

export interface InitializeDiscoveryRunOptions {
  acceptanceTarget?: AcceptanceClass;
  force?: boolean;
  runDir: string;
}

export interface InitializeDiscoveryRunResult {
  createdAt: string;
  runDir: string;
}

function createDefaultTrack(trackId: string, title: string, closureGoal: string) {
  return {
    track_id: trackId,
    title,
    closure_goal: closureGoal,
    backlog_protocol_state: BACKLOG_PROTOCOL_STATES[0],
    delivery_state: DELIVERY_STATES[0],
    readiness_state: READINESS_STATES[1],
    closure_state: ITEM_CLOSURE_STATES[0],
    summary_label: SUMMARY_LABELS[4],
    first_shippable_journey_ids: [],
    required_track_gate_ids: [],
    track_proof_refs: [],
  };
}

export function createEmptyAssessment(
  runId: string,
  createdAt: string,
  target: AcceptanceClass,
): AssessmentFile {
  return {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    assessed_at: createdAt,
    status: 'not-run',
    errors: [],
    warnings: [],
    hard_fails: [],
    lint_findings: [],
    stale_proofs: [],
    stale_items: [],
    stale_claims: [],
    track_gate_failures: [],
    required_review_roles: [],
    present_review_roles: [],
    missing_review_roles: [],
    pending_track_proof_reviews: [],
    waiver_findings: [],
    invalid_waiver_ids: [],
    next_actions: [
      'Record authoritative sources in backlog.json.source_authority.',
      'Populate value_streams, tracks, track_journeys, track_gates, proofs, reviews, and roadmap_matrix.',
      'Run validate before relying on report output.',
    ],
    score: {
      total: 0,
      max: 100,
      sections: [],
    },
    acceptance: {
      target,
      achieved: 'draft-only',
      target_satisfied: false,
      blocking_reasons: ['Run initialized but not yet validated.'],
    },
    closure: {
      status: 'open',
      reason: 'Run initialized but discovery evidence has not been assessed yet.',
    },
    delta_summary: {
      baseline_established: false,
      changed_source_ids: [],
      changed_claim_ids: [],
      stale_claim_ids: [],
      stale_item_ids: [],
      stale_proof_ids: [],
      track_gate_ids_to_recalculate: [],
      dirty_flags: [],
      topology_changed: false,
      contract_changed: false,
      changed_track_gate_ids: [],
    },
    rebaseline_required: false,
    stats: {},
  };
}

export function initializeDiscoveryRun(
  options: InitializeDiscoveryRunOptions,
): InitializeDiscoveryRunResult {
  const acceptanceTarget = options.acceptanceTarget ?? DEFAULT_ACCEPTANCE_TARGET;
  if (!ACCEPTANCE_CLASSES.includes(acceptanceTarget)) {
    throw new Error(`Invalid acceptance target: ${acceptanceTarget}`);
  }

  const runDir = path.resolve(options.runDir);
  if (!options.force && detectLegacyLayout(runDir)) {
    throw new Error(legacyLayoutMessage(runDir));
  }

  const paths = runPaths(runDir);
  const canonicalPaths = [paths.manifest, paths.backlog, paths.assessment, paths.journal, paths.report];
  if (!options.force && canonicalPaths.some((filePath) => fs.existsSync(filePath))) {
    throw new Error(`Run directory already contains discovery artifacts: ${runDir}`);
  }

  const createdAt = utcNow();
  const runId = path.basename(runDir);

  const manifest: Manifest = {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    created_at: createdAt,
    updated_at: createdAt,
    phase_state: PHASE_STATES[0],
    acceptance_target: acceptanceTarget,
    baseline_source_hashes: {},
    current_source_hashes: {},
    baseline_canonical_hashes: {},
    current_canonical_hashes: {},
    dirty_flags: [],
    last_assessment_status: 'not-run',
    last_render_at: null,
    last_delta_at: null,
    last_rebaseline_at: null,
    last_rebaseline_causes: [],
    legacy_layout_detected: false,
  };

  const backlog: BacklogFile = {
    metadata: {
      schema_version: SCHEMA_VERSION,
      run_id: runId,
      created_at: createdAt,
      updated_at: createdAt,
    },
    glossary: {},
    aliases: {},
    id_strategy: {
      claim: 'claim-*',
      item: 'item-*',
      contract: 'contract-*',
      proof: 'proof-*',
      review: 'review-*',
      track: 'track-*',
      journey: 'journey-*',
      track_gate: 'track-gate-*',
      track_proof: 'track-proof-*',
      waiver: 'waiver-*',
    },
    source_authority: [],
    source_exclusions: [],
    target_system: createEmptyTargetSystemModel(),
    value_streams: [],
    tracks: [
      createDefaultTrack(
        'minimal-working-system',
        'Minimal working system',
        'First runnable end-to-end system.',
      ),
      createDefaultTrack(
        'externally-safe-operationally-supportable',
        'Externally safe and operationally supportable system',
        'Safe external operation with support and observability.',
      ),
      createDefaultTrack(
        'full-target-system',
        'Full target system',
        'The architecture target with all committed seams closed.',
      ),
    ],
    track_gates: [],
    track_journeys: [],
    as_built: createEmptyAsBuiltModel(),
    claims: [],
    negative_scope: [],
    quality_attributes: [],
    policy_decisions: [],
    contracts: [],
    data_domains: [],
    gaps: [],
    contradictions: [],
    unknowns: [],
    uncertainty_to_spike: [],
    delivered_lineage_notes: [],
    items: [],
    relations: [],
    proofs: [],
    track_proofs: [],
    reviews: [],
    waivers: [],
    roadmap_matrix: [],
  };

  const assessment = createEmptyAssessment(runId, createdAt, acceptanceTarget);

  writeJson(paths.manifest, manifest);
  writeJson(paths.backlog, backlog);
  writeJson(paths.assessment, assessment);
  appendNdjson(paths.journal, {
    ts: createdAt,
    event: 'run_initialized',
    run_id: runId,
    acceptance_target: acceptanceTarget,
    schema_version: SCHEMA_VERSION,
  });

  return {
    createdAt,
    runDir,
  };
}
