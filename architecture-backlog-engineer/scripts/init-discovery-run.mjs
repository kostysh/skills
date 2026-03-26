#!/usr/bin/env node
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
} from "./discovery-common.mjs";

function parseArgs(argv) {
  const args = { force: false, acceptanceTarget: "planning-grade", runDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--force") {
      args.force = true;
    } else if (token === "--acceptance-target") {
      args.acceptanceTarget = argv[i + 1];
      i += 1;
    } else if (!args.runDir) {
      args.runDir = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  if (!args.runDir) {
    throw new Error("Usage: node scripts/init-discovery-run.mjs <run-dir> [--acceptance-target draft-only|planning-grade|implementation-grade] [--force]");
  }
  if (!ACCEPTANCE_CLASSES.includes(args.acceptanceTarget)) {
    throw new Error(`Invalid acceptance target: ${args.acceptanceTarget}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const runDir = path.resolve(args.runDir);
  const paths = runPaths(runDir);
  const canonicalPaths = [paths.manifest, paths.journal, paths.state, paths.validation, paths.closure];

  if (!args.force && canonicalPaths.some((filePath) => fs.existsSync(filePath))) {
    throw new Error(`Run directory already contains canonical artifacts: ${runDir}`);
  }

  const createdAt = utcNow();
  const manifest = {
    schema_version: SCHEMA_VERSION,
    run_id: path.basename(runDir),
    created_at: createdAt,
    updated_at: createdAt,
    phase_state: PHASE_STATES[0],
    acceptance_target: args.acceptanceTarget,
    source_refs: [],
    source_hashes: {},
    dirty_flags: [],
    last_validation_status: null,
    last_render_at: null,
  };
  const state = {
    metadata: {
      schema_version: SCHEMA_VERSION,
      run_id: path.basename(runDir),
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
  const validation = {
    schema_version: SCHEMA_VERSION,
    run_id: path.basename(runDir),
    validated_at: createdAt,
    status: "not-run",
    errors: [],
    warnings: [],
    stats: {},
  };
  const closure = {
    schema_version: SCHEMA_VERSION,
    run_id: path.basename(runDir),
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
    run_id: path.basename(runDir),
    acceptance_target: args.acceptanceTarget,
  });
  fs.mkdirSync(paths.views, { recursive: true });
  console.log(`Initialized discovery run at ${runDir}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
