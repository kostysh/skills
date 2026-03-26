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
  type DiscoveryState,
  type Manifest,
  type ValidationFile,
} from "./common.js";

export interface ValidateDiscoveryRunResult {
  errors: string[];
  missingArtifacts: string[];
  runDir: string;
  validation: ValidationFile | null;
  warnings: string[];
}

export function validateDiscoveryRun(runDirInput: string): ValidateDiscoveryRunResult {
  const runDir = path.resolve(runDirInput);
  const paths = runPaths(runDir);
  const missingArtifacts = [
    paths.manifest,
    paths.journal,
    paths.state,
    paths.validation,
    paths.closure,
  ].filter((filePath) => !fs.existsSync(filePath));

  if (missingArtifacts.length > 0) {
    return {
      errors: [],
      missingArtifacts,
      runDir,
      validation: null,
      warnings: [],
    };
  }

  const manifest = loadJson<Manifest>(paths.manifest);
  const state = loadJson<DiscoveryState>(paths.state);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (manifest.schema_version !== SCHEMA_VERSION) {
    errors.push("Unsupported schema_version in manifest.json");
  }
  if (!PHASE_STATES.includes(manifest.phase_state)) {
    errors.push("Invalid phase_state in manifest.json");
  }
  if (state.metadata?.schema_version !== SCHEMA_VERSION) {
    errors.push("Unsupported schema_version in state.snapshot.json");
  }

  const itemIds = new Set<string>();
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
    if (!item.item_class || !ITEM_CLASSES.includes(item.item_class as (typeof ITEM_CLASSES)[number])) {
      errors.push(`Invalid item_class for ${itemId}`);
    }
    if (
      item.summary_label &&
      !SUMMARY_LABELS.includes(item.summary_label as (typeof SUMMARY_LABELS)[number])
    ) {
      errors.push(`Invalid summary_label for ${itemId}`);
    }
    if (!Array.isArray(item.origin_ref) || item.origin_ref.length === 0) {
      warnings.push(`Item has no origin_ref: ${itemId}`);
    }
  }

  const trackIds = new Set(
    (state.tracks ?? [])
      .map((track) => track.track_id)
      .filter((trackId): trackId is string => Boolean(trackId)),
  );
  const proofIds = new Set(
    (state.proofs ?? [])
      .map((proof) => proof.proof_id)
      .filter((proofId): proofId is string => Boolean(proofId)),
  );
  const reviewIds = new Set(
    (state.reviews ?? [])
      .map((review) => review.review_id)
      .filter((reviewId): reviewId is string => Boolean(reviewId)),
  );

  for (const relation of state.relations ?? []) {
    const relType = relation.relation_type;
    const fromId = relation.from;
    const toId = relation.to;

    if (!relType || !RELATION_TYPES.includes(relType as (typeof RELATION_TYPES)[number])) {
      errors.push(`Invalid relation_type: ${String(relType ?? "")}`);
    }
    if (!fromId || !toId) {
      errors.push("Relation missing from/to");
      continue;
    }

    const validFrom = itemIds.has(fromId) || trackIds.has(fromId);
    const validTo =
      itemIds.has(toId) ||
      trackIds.has(toId) ||
      proofIds.has(toId) ||
      reviewIds.has(toId);

    if (!validFrom) {
      errors.push(`Relation source not found: ${fromId}`);
    }
    if (!validTo) {
      errors.push(`Relation target not found: ${toId}`);
    }
  }

  const validationStatus: "pass" | "fail" = errors.length === 0 ? "pass" : "fail";
  const validation: ValidationFile = {
    schema_version: SCHEMA_VERSION,
    run_id: manifest.run_id ?? path.basename(runDir),
    validated_at: utcNow(),
    status: validationStatus,
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
  manifest.last_validation_status = validationStatus;
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

  return {
    errors,
    missingArtifacts: [],
    runDir,
    validation,
    warnings,
  };
}
