import fs from "node:fs";
import path from "node:path";

import {
  ACCEPTANCE_CLASSES,
  PHASE_STATES,
  SCHEMA_VERSION,
  appendNdjson,
  runPaths,
  utcNow,
  writeJson,
  type AcceptanceClass,
  type ClosureFile,
  type DiscoveryState,
  type Manifest,
  type ValidationFile,
} from "./common.js";

const DEFAULT_ACCEPTANCE_TARGET: AcceptanceClass = "planning-grade";

export interface InitializeDiscoveryRunOptions {
  acceptanceTarget?: AcceptanceClass;
  force?: boolean;
  runDir: string;
}

export interface InitializeDiscoveryRunResult {
  createdAt: string;
  runDir: string;
}

export function initializeDiscoveryRun(
  options: InitializeDiscoveryRunOptions,
): InitializeDiscoveryRunResult {
  const acceptanceTarget = options.acceptanceTarget ?? DEFAULT_ACCEPTANCE_TARGET;
  if (!ACCEPTANCE_CLASSES.includes(acceptanceTarget)) {
    throw new Error(`Invalid acceptance target: ${acceptanceTarget}`);
  }

  const runDir = path.resolve(options.runDir);
  const paths = runPaths(runDir);
  const canonicalPaths = [
    paths.manifest,
    paths.journal,
    paths.state,
    paths.validation,
    paths.closure,
  ];

  if (!options.force && canonicalPaths.some((filePath) => fs.existsSync(filePath))) {
    throw new Error(`Run directory already contains canonical artifacts: ${runDir}`);
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
    source_refs: [],
    source_hashes: {},
    dirty_flags: [],
    last_validation_status: null,
    last_render_at: null,
  };

  const state: DiscoveryState = {
    metadata: {
      schema_version: SCHEMA_VERSION,
      run_id: runId,
      created_at: createdAt,
    },
    glossary: {},
    source_authority: [],
    target_system: {},
    as_built: {},
    claims: [],
    negative_scope: [],
    quality_attributes: [],
    policy_decisions: [],
    contracts: [],
    items: [],
    relations: [],
    proofs: [],
    reviews: [],
    tracks: [
      { track_id: "minimal-working-system", title: "Minimal working system" },
      {
        track_id: "externally-safe-operationally-supportable",
        title: "Externally safe and operationally supportable system",
      },
      { track_id: "full-target-system", title: "Full target system" },
    ],
  };

  const validation: ValidationFile = {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    validated_at: createdAt,
    status: "not-run",
    errors: [],
    warnings: [],
    stats: {},
  };

  const closure: ClosureFile = {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    status: "open",
    acceptance_class: "draft-only",
    closed_at: null,
    reason: "Run initialized but not validated.",
  };

  writeJson(paths.manifest, manifest);
  writeJson(paths.state, state);
  writeJson(paths.validation, validation);
  writeJson(paths.closure, closure);
  appendNdjson(paths.journal, {
    ts: createdAt,
    event: "run_initialized",
    run_id: runId,
    acceptance_target: acceptanceTarget,
  });
  fs.mkdirSync(paths.views, { recursive: true });

  return {
    createdAt,
    runDir,
  };
}
