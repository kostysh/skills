import fs from "node:fs";
import path from "node:path";

export const SCHEMA_VERSION = "1";

export const PHASE_STATES = [
  "initialized",
  "sources_resolved",
  "target_reconstructed",
  "as_built_reconstructed",
  "claims_extracted",
  "graph_built",
  "sliced",
  "contracts_bound",
  "proof_bound",
  "validated",
  "reviewed",
  "rendered",
  "closed",
];

export const ACCEPTANCE_CLASSES = ["draft-only", "planning-grade", "implementation-grade"];

export const ITEM_CLASSES = [
  "capability_seam",
  "feature_slice",
  "control_guardrail",
  "migration",
  "retirement",
  "spike_discovery",
  "operational_enablement",
  "documentation_support_enablement",
];

export const RELATION_TYPES = [
  "realizes",
  "decomposes_into",
  "depends_on",
  "blocked_by",
  "governed_by",
  "migrates_from",
  "retires",
  "replaces",
  "proves",
  "reviewed_by",
  "belongs_to_track",
  "touches_contract",
  "touches_data_domain",
  "enabled_by",
];

export const SUMMARY_LABELS = [
  "Implemented",
  "Partially implemented",
  "Planned",
  "Missing",
  "Blocked",
  "Needs clarification",
];

export function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

export function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function appendNdjson(filePath, event) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export function runPaths(runDir) {
  return {
    manifest: path.join(runDir, "manifest.json"),
    journal: path.join(runDir, "journal.ndjson"),
    state: path.join(runDir, "state.snapshot.json"),
    validation: path.join(runDir, "validation.json"),
    closure: path.join(runDir, "closure.json"),
    views: path.join(runDir, "views"),
  };
}
