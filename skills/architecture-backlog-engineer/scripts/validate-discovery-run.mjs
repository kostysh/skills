#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  ITEM_CLASSES,
  PHASE_STATES,
  RELATION_TYPES,
  SCHEMA_VERSION,
  SUMMARY_LABELS,
  appendNdjson,
  loadJson,
  runPaths,
  utcNow,
  writeJson,
} from "./discovery-common.mjs";

function parseArgs(argv) {
  if (argv.length !== 1) {
    throw new Error("Usage: node scripts/validate-discovery-run.mjs <run-dir>");
  }
  return path.resolve(argv[0]);
}

function main() {
  const runDir = parseArgs(process.argv.slice(2));
  const paths = runPaths(runDir);
  const errors = [];
  const warnings = [];

  for (const filePath of [paths.manifest, paths.journal, paths.state, paths.validation, paths.closure]) {
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing canonical artifact: ${filePath}`);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  const manifest = loadJson(paths.manifest);
  const state = loadJson(paths.state);

  if (manifest.schema_version !== SCHEMA_VERSION) {
    errors.push("Unsupported schema_version in manifest.json");
  }
  if (!PHASE_STATES.includes(manifest.phase_state)) {
    errors.push("Invalid phase_state in manifest.json");
  }
  if (state?.metadata?.schema_version !== SCHEMA_VERSION) {
    errors.push("Unsupported schema_version in state.snapshot.json");
  }

  const itemIds = new Set();
  for (const item of state.items ?? []) {
    const itemId = item.item_id;
    if (!itemId) {
      errors.push("Item missing item_id");
      continue;
    }
    if (itemIds.has(itemId)) {
      errors.push(`Duplicate item_id: ${itemId}`);
    }
    itemIds.add(itemId);
    if (!ITEM_CLASSES.includes(item.item_class)) {
      errors.push(`Invalid item_class for ${itemId}`);
    }
    if (item.summary_label && !SUMMARY_LABELS.includes(item.summary_label)) {
      errors.push(`Invalid summary_label for ${itemId}`);
    }
    if (!Array.isArray(item.origin_ref) || item.origin_ref.length === 0) {
      warnings.push(`Item has no origin_ref: ${itemId}`);
    }
  }

  const trackIds = new Set((state.tracks ?? []).map((track) => track.track_id).filter(Boolean));
  const proofIds = new Set((state.proofs ?? []).map((proof) => proof.proof_id).filter(Boolean));
  const reviewIds = new Set((state.reviews ?? []).map((review) => review.review_id).filter(Boolean));

  for (const relation of state.relations ?? []) {
    const relType = relation.relation_type;
    const fromId = relation.from;
    const toId = relation.to;
    if (!RELATION_TYPES.includes(relType)) {
      errors.push(`Invalid relation_type: ${relType}`);
    }
    if (!fromId || !toId) {
      errors.push("Relation missing from/to");
      continue;
    }
    const validFrom = itemIds.has(fromId) || trackIds.has(fromId);
    const validTo = itemIds.has(toId) || trackIds.has(toId) || proofIds.has(toId) || reviewIds.has(toId);
    if (!validFrom) {
      errors.push(`Relation source not found: ${fromId}`);
    }
    if (!validTo) {
      errors.push(`Relation target not found: ${toId}`);
    }
  }

  const validation = {
    schema_version: SCHEMA_VERSION,
    run_id: manifest.run_id ?? path.basename(runDir),
    validated_at: utcNow(),
    status: errors.length === 0 ? "pass" : "fail",
    errors,
    warnings,
    stats: {
      items: (state.items ?? []).length,
      relations: (state.relations ?? []).length,
      proofs: (state.proofs ?? []).length,
      reviews: (state.reviews ?? []).length,
    },
  };
  writeJson(paths.validation, validation);

  manifest.updated_at = validation.validated_at;
  manifest.last_validation_status = validation.status;
  if (validation.status === "pass" && !["closed", "reviewed", "rendered"].includes(manifest.phase_state)) {
    manifest.phase_state = "validated";
  }
  writeJson(paths.manifest, manifest);
  appendNdjson(paths.journal, {
    ts: validation.validated_at,
    event: "run_validated",
    run_id: validation.run_id,
    status: validation.status,
    error_count: errors.length,
    warning_count: warnings.length,
  });

  console.log(`Validation status: ${validation.status}`);
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  for (const warning of warnings) {
    console.log(`WARNING: ${warning}`);
  }
  if (errors.length > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
