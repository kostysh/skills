#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
//#region package.json
var name = "@kostysh/architecture-backlog-engineer-cli";
var version = "0.1.0";
var description = "CLI utilities for the architecture-backlog-engineer skill.";
var type = "module";
var bin = { "architecture-backlog": "scripts/architecture-backlog.mjs" };
var exports = { ".": "./scripts/architecture-backlog.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/architecture-backlog.mjs",
	"format": "biome format --files-ignore-unknown=true --write src test package.json tsconfig.json vite.config.ts",
	"format:check": "biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false src test package.json tsconfig.json vite.config.ts",
	"lint:biome": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings src test package.json tsconfig.json vite.config.ts",
	"lint:eslint": "eslint \"src/**/*.ts\" \"test/**/*.mjs\" \"vite.config.ts\"",
	"lint": "pnpm run lint:biome && pnpm run lint:eslint && pnpm run typecheck",
	"lint:fix": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings --write src test package.json tsconfig.json vite.config.ts && eslint --fix \"src/**/*.ts\" \"test/**/*.mjs\" \"vite.config.ts\" && pnpm run typecheck",
	"pretest": "pnpm run build",
	"test": "node --test test/*.test.mjs",
	"typecheck": "tsc --noEmit"
};
var devDependencies = {
	"@types/node": "^25.5.0",
	"typescript": "^5.9.3",
	"vite": "^8.0.3"
};
var package_default = {
	name,
	version,
	"private": true,
	description,
	type,
	bin,
	exports,
	files,
	engines,
	scripts,
	devDependencies
};
var PHASE_STATES = [
	"initialized",
	"sources_resolved",
	"target_reconstructed",
	"as_built_reconstructed",
	"claims_extracted",
	"graph_built",
	"sliced",
	"validated",
	"rendered",
	"closed"
];
var ACCEPTANCE_CLASSES = [
	"draft-only",
	"planning-grade",
	"implementation-grade"
];
var ITEM_CLASSES = [
	"capability_seam",
	"feature_slice",
	"control_guardrail",
	"migration",
	"retirement",
	"spike_discovery",
	"operational_enablement",
	"documentation_support_enablement"
];
var RELATION_TYPES = [
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
	"enabled_by"
];
var SUMMARY_LABELS = [
	"Implemented",
	"Partially implemented",
	"Planned",
	"Missing",
	"Blocked",
	"Needs clarification"
];
var BACKLOG_PROTOCOL_STATES = [
	"candidate",
	"discovered",
	"validated",
	"accepted"
];
var DELIVERY_STATES = [
	"not_started",
	"partially_delivered",
	"delivered"
];
var READINESS_STATES = [
	"not_ready",
	"needs_clarification",
	"ready"
];
var ITEM_CLOSURE_STATES = [
	"open",
	"partial",
	"closed"
];
var COMPATIBILITY_CLASSES = [
	"backward",
	"forward",
	"breaking"
];
var ROLLOUT_MODES = [
	"dark_launch",
	"canary",
	"shadow",
	"phased",
	"big_bang"
];
var ROLLBACK_CLASSES = [
	"deploy_rollback",
	"config_secret_rollback",
	"schema_data_rollback",
	"forward_fix_only",
	"backup_restore",
	"replay_rebuild",
	"no_safe_rollback"
];
var UNCERTAINTY_CLASSES = [
	"decision_unknown",
	"integration_unknown",
	"scale_unknown",
	"security_unknown",
	"policy_unknown",
	"data_unknown",
	"operability_unknown"
];
var ORIGIN_REF_KINDS = [
	"claim_ref",
	"gap_ref",
	"control_obligation_ref",
	"policy_decision_ref",
	"decommission_need_ref",
	"review_finding_ref",
	"unknown_ref"
];
var CLAIM_COMMITMENTS = [
	"committed",
	"deferred",
	"optional",
	"out_of_scope"
];
var CLAIM_CLASSES = [
	"functional_capability",
	"control_obligation",
	"interface_contract",
	"data_evolution",
	"migration",
	"retirement",
	"operational_capability",
	"policy_decision_need"
];
var REVIEW_ROLES = [
	"product_strategy",
	"system_architecture",
	"application_engineering",
	"platform_sre",
	"support_operations",
	"security",
	"qa_release"
];
var REVIEW_VERDICTS = [
	"pass",
	"pass_with_findings",
	"fail"
];
var REVIEW_SCOPES = [
	"item",
	"run",
	"track_proof"
];
var GRAPH_REF_KINDS = [
	"run",
	"item",
	"track",
	"track_proof",
	"proof",
	"review",
	"contract",
	"data_domain",
	"value_stream"
];
var SOURCE_KINDS = [
	"architecture_doc",
	"adr",
	"runtime_evidence",
	"deployment_contract",
	"delivered_dossier_ssot",
	"code_evidence",
	"operational_evidence",
	"backlog_text"
];
var SOURCE_AUTHORITIES = [
	"authoritative_target_truth",
	"authoritative_current_truth",
	"historical_context_only",
	"superseded_excluded",
	"planning_only"
];
var PROOF_DIMENSION_KEYS = [
	"architecture_trace",
	"implementation_trace",
	"verification_trace",
	"security_trace",
	"release_trace",
	"rollback_or_recovery_trace",
	"operability_trace"
];
var NEGATIVE_SCOPE_CLASSES = [
	"optional",
	"future",
	"manual",
	"trusted_local_only",
	"compatibility_only",
	"stub",
	"health_only",
	"out_of_scope"
];
var POLICY_DECISION_STATES = [
	"required",
	"decided",
	"waived",
	"deferred"
];
var DEPENDENCY_CRITICALITIES = [
	"boot_critical",
	"degraded",
	"optional"
];
var ISSUE_RESOLUTION_STATES = [
	"open",
	"resolved",
	"downgraded"
];
var TRACK_PROOF_COVERAGE_KEYS = [
	"boot_startup_dependencies",
	"end_to_end_journey",
	"operator_control_path",
	"degraded_mode_exercise",
	"release_gate_execution",
	"rollback_or_recovery_rehearsal",
	"observability_and_alert_routing",
	"runbook_and_escalation_path"
];
function isAcceptanceClass(value) {
	return ACCEPTANCE_CLASSES.includes(value);
}
function isGraphRefKind(value) {
	return GRAPH_REF_KINDS.includes(value);
}
function isGraphRef(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return isNonEmptyString(candidate.kind) && isGraphRefKind(candidate.kind) && isNonEmptyString(candidate.id);
}
function graphRef(kind, id) {
	return {
		kind,
		id
	};
}
function formatGraphRef(ref) {
	if (!ref || !isNonEmptyString(ref.kind) || !isNonEmptyString(ref.id)) return "unknown:unknown";
	return `${ref.kind}:${ref.id}`;
}
function graphRefKey(ref) {
	return formatGraphRef(ref);
}
function utcNow() {
	return (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
}
function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}
function writeJson(filePath, data) {
	ensureDir(path.dirname(filePath));
	const tmpPath = `${filePath}.tmp`;
	fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
	fs.renameSync(tmpPath, filePath);
}
function writeText(filePath, data) {
	ensureDir(path.dirname(filePath));
	const tmpPath = `${filePath}.tmp`;
	fs.writeFileSync(tmpPath, data, "utf8");
	fs.renameSync(tmpPath, filePath);
}
function loadJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function appendNdjson(filePath, event) {
	ensureDir(path.dirname(filePath));
	fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}
function loadNdjson(filePath) {
	if (!fs.existsSync(filePath)) return [];
	const raw = fs.readFileSync(filePath, "utf8").trim();
	if (raw.length === 0) return [];
	return raw.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).map((line) => JSON.parse(line));
}
function runPaths(runDir) {
	return {
		manifest: path.join(runDir, "manifest.json"),
		backlog: path.join(runDir, "backlog.json"),
		assessment: path.join(runDir, "assessment.json"),
		journal: path.join(runDir, "journal.ndjson"),
		report: path.join(runDir, "report.md")
	};
}
function legacyRunPaths(runDir) {
	return {
		manifest: path.join(runDir, "manifest.json"),
		state: path.join(runDir, "state.snapshot.json"),
		validation: path.join(runDir, "validation.json"),
		closure: path.join(runDir, "closure.json"),
		journal: path.join(runDir, "journal.ndjson"),
		views: path.join(runDir, "views")
	};
}
function detectLegacyLayout(runDir) {
	const paths = legacyRunPaths(runDir);
	return [
		paths.state,
		paths.validation,
		paths.closure,
		paths.views
	].some((filePath) => fs.existsSync(filePath));
}
function legacyLayoutMessage(runDir) {
	return [
		`Legacy discovery run layout detected at ${runDir}.`,
		"Schema v3 uses manifest.json, backlog.json, assessment.json, journal.ndjson, and report.md.",
		"This tool follows a pre-GA breaking cutover policy: rewrite the draft artifacts to schema v3 or re-initialize a new run directory before continuing."
	].join(" ");
}
function unsupportedSchemaMessage(fileName) {
	return [`Unsupported schema_version in ${fileName}.`, "This tool follows a pre-GA breaking cutover policy: rewrite the draft artifacts to schema v3 or re-initialize a new run directory before continuing."].join(" ");
}
function loadCompactRunArtifacts(runDirInput) {
	const runDir = path.resolve(runDirInput);
	if (detectLegacyLayout(runDir)) return {
		assessment: null,
		backlog: null,
		legacyLayoutMessage: legacyLayoutMessage(runDir),
		manifest: null,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const paths = runPaths(runDir);
	const missingArtifacts = [
		paths.manifest,
		paths.backlog,
		paths.assessment,
		paths.journal
	].filter((filePath) => !fs.existsSync(filePath));
	if (missingArtifacts.length > 0) return {
		assessment: null,
		backlog: null,
		manifest: null,
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages: []
	};
	const manifest = loadJson(paths.manifest);
	const backlog = loadJson(paths.backlog);
	const assessment = loadJson(paths.assessment);
	const unsupportedSchemaMessages = [];
	if (manifest.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("manifest.json"));
	if (backlog.metadata?.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("backlog.json"));
	if (assessment.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("assessment.json"));
	return {
		assessment,
		backlog,
		manifest,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages
	};
}
function hasOwnEntries(value) {
	return Object.keys(value).length > 0;
}
function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function asArray(value) {
	return Array.isArray(value) ? value : [];
}
function asStringRecord(value) {
	return typeof value === "object" && value !== null ? value : {};
}
function formatOriginRef(ref) {
	return `${isNonEmptyString(ref.kind) ? ref.kind : "unknown_ref"}:${isNonEmptyString(ref.ref) ? ref.ref : "unknown"}`;
}
function createEmptyTargetSystemModel() {
	return {
		actors: [],
		operator_personas: [],
		external_consumer_groups: [],
		external_dependencies: [],
		trust_boundaries: [],
		durable_state_families: [],
		control_surfaces: [],
		failure_domains: [],
		team_and_ownership_assumptions: [],
		quality_goals: [],
		policy_surfaces: []
	};
}
function createEmptyAsBuiltModel() {
	return {
		deployable_surfaces: [],
		services: [],
		processes: [],
		jobs: [],
		apis: [],
		event_surfaces: [],
		queues: [],
		state_stores: [],
		deployable_units: [],
		ownership_matrix: [],
		environment_matrix: [],
		ingress_interfaces: [],
		egress_interfaces: [],
		canonical_writers: [],
		trust_boundary_crossings: [],
		data_classes: [],
		dependency_classifications: [],
		synthetic_behaviors: [],
		compatibility_only_behaviors: [],
		vendor_external_owners: [],
		missing_operational_inputs: []
	};
}
function parseTimestamp(value) {
	if (!isNonEmptyString(value)) return null;
	const timestamp = Date.parse(value);
	return Number.isNaN(timestamp) ? null : timestamp;
}
function stableSerialize(value) {
	if (value === null || value === void 0) return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
	if (typeof value === "object") return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(",")}}`;
	return JSON.stringify(value);
}
function hashJsonValue(value) {
	return crypto.createHash("sha256").update(stableSerialize(value)).digest("hex");
}
//#endregion
//#region src/discovery/init-run.ts
var DEFAULT_ACCEPTANCE_TARGET = "planning-grade";
function createDefaultTrack(trackId, title, closureGoal) {
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
		track_proof_refs: []
	};
}
function createEmptyAssessment(runId, createdAt, target) {
	return {
		schema_version: "3",
		run_id: runId,
		assessed_at: createdAt,
		status: "not-run",
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
			"Record authoritative sources in backlog.json.source_authority.",
			"Populate value_streams, tracks, track_journeys, track_gates, proofs, reviews, and roadmap_matrix.",
			"Run validate before relying on report output."
		],
		score: {
			total: 0,
			max: 100,
			sections: []
		},
		acceptance: {
			target,
			achieved: "draft-only",
			target_satisfied: false,
			blocking_reasons: ["Run initialized but not yet validated."]
		},
		closure: {
			status: "open",
			reason: "Run initialized but discovery evidence has not been assessed yet."
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
			changed_track_gate_ids: []
		},
		rebaseline_required: false,
		stats: {}
	};
}
function initializeDiscoveryRun(options) {
	const acceptanceTarget = options.acceptanceTarget ?? DEFAULT_ACCEPTANCE_TARGET;
	if (!ACCEPTANCE_CLASSES.includes(acceptanceTarget)) throw new Error(`Invalid acceptance target: ${acceptanceTarget}`);
	const runDir = path.resolve(options.runDir);
	if (!options.force && detectLegacyLayout(runDir)) throw new Error(legacyLayoutMessage(runDir));
	const paths = runPaths(runDir);
	const canonicalPaths = [
		paths.manifest,
		paths.backlog,
		paths.assessment,
		paths.journal,
		paths.report
	];
	if (!options.force && canonicalPaths.some((filePath) => fs.existsSync(filePath))) throw new Error(`Run directory already contains discovery artifacts: ${runDir}`);
	const createdAt = utcNow();
	const runId = path.basename(runDir);
	const manifest = {
		schema_version: "3",
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
		last_assessment_status: "not-run",
		last_render_at: null,
		last_delta_at: null,
		last_rebaseline_at: null,
		last_rebaseline_causes: [],
		legacy_layout_detected: false
	};
	const backlog = {
		metadata: {
			schema_version: "3",
			run_id: runId,
			created_at: createdAt,
			updated_at: createdAt
		},
		glossary: {},
		aliases: {},
		id_strategy: {
			claim: "claim-*",
			item: "item-*",
			contract: "contract-*",
			proof: "proof-*",
			review: "review-*",
			track: "track-*",
			journey: "journey-*",
			track_gate: "track-gate-*",
			track_proof: "track-proof-*",
			waiver: "waiver-*"
		},
		source_authority: [],
		source_exclusions: [],
		target_system: createEmptyTargetSystemModel(),
		value_streams: [],
		tracks: [
			createDefaultTrack("minimal-working-system", "Minimal working system", "First runnable end-to-end system."),
			createDefaultTrack("externally-safe-operationally-supportable", "Externally safe and operationally supportable system", "Safe external operation with support and observability."),
			createDefaultTrack("full-target-system", "Full target system", "The architecture target with all committed seams closed.")
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
		roadmap_matrix: []
	};
	const assessment = createEmptyAssessment(runId, createdAt, acceptanceTarget);
	writeJson(paths.manifest, manifest);
	writeJson(paths.backlog, backlog);
	writeJson(paths.assessment, assessment);
	appendNdjson(paths.journal, {
		ts: createdAt,
		event: "run_initialized",
		run_id: runId,
		acceptance_target: acceptanceTarget,
		schema_version: "3"
	});
	return {
		createdAt,
		runDir
	};
}
//#endregion
//#region src/discovery/bundle-repair.ts
function hasAnyEntries$1(record) {
	return Object.values(record).some((value) => Array.isArray(value) && value.length > 0);
}
function derivePhaseState$1(backlog) {
	if (backlog.items.length > 0) return "graph_built";
	if (backlog.claims.length > 0) return "claims_extracted";
	if (hasAnyEntries$1(backlog.as_built)) return "as_built_reconstructed";
	if (hasAnyEntries$1(backlog.target_system)) return "target_reconstructed";
	if (backlog.source_authority.length > 0) return "sources_resolved";
	return PHASE_STATES[0];
}
function createRecoveredManifest(backlog, existingAssessment, runDir, repairedAt) {
	const runId = backlog.metadata.run_id ?? path.basename(runDir);
	const acceptanceTarget = existingAssessment?.acceptance?.target ?? "planning-grade";
	return {
		schema_version: "3",
		run_id: runId,
		created_at: backlog.metadata.created_at ?? repairedAt,
		updated_at: repairedAt,
		phase_state: derivePhaseState$1(backlog),
		acceptance_target: acceptanceTarget,
		baseline_source_hashes: {},
		current_source_hashes: {},
		baseline_canonical_hashes: {},
		current_canonical_hashes: {},
		dirty_flags: [],
		last_assessment_status: existingAssessment?.status ?? "not-run",
		last_render_at: null,
		last_delta_at: null,
		last_rebaseline_at: null,
		last_rebaseline_causes: [],
		legacy_layout_detected: false
	};
}
function repairCompactRunBundle(runDirInput) {
	const runDir = path.resolve(runDirInput);
	if (detectLegacyLayout(runDir)) return {
		existingArtifactCount: 0,
		hasAnyCanonicalArtifacts: false,
		irreparableMissingArtifacts: [],
		legacyLayoutMessage: legacyLayoutMessage(runDir),
		repairedArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const paths = runPaths(runDir);
	const artifactEntries = [
		["manifest", paths.manifest],
		["backlog", paths.backlog],
		["assessment", paths.assessment],
		["journal", paths.journal]
	];
	const existingArtifacts = artifactEntries.filter(([, filePath]) => fs.existsSync(filePath));
	const missingArtifacts = artifactEntries.filter(([, filePath]) => !fs.existsSync(filePath));
	const repairedArtifacts = [];
	const unsupportedSchemaMessages = [];
	if (existingArtifacts.length === 0) return {
		existingArtifactCount: 0,
		hasAnyCanonicalArtifacts: false,
		irreparableMissingArtifacts: [],
		repairedArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	if (!fs.existsSync(paths.backlog)) return {
		existingArtifactCount: existingArtifacts.length,
		hasAnyCanonicalArtifacts: true,
		irreparableMissingArtifacts: [paths.backlog],
		repairedArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	const backlog = loadJson(paths.backlog);
	if (backlog.metadata?.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("backlog.json"));
	const existingAssessment = fs.existsSync(paths.assessment) ? loadJson(paths.assessment) : null;
	if (existingAssessment && existingAssessment.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("assessment.json"));
	const existingManifest = fs.existsSync(paths.manifest) ? loadJson(paths.manifest) : null;
	if (existingManifest && existingManifest.schema_version !== "3") unsupportedSchemaMessages.push(unsupportedSchemaMessage("manifest.json"));
	if (unsupportedSchemaMessages.length > 0) return {
		existingArtifactCount: existingArtifacts.length,
		hasAnyCanonicalArtifacts: true,
		irreparableMissingArtifacts: [],
		repairedArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
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
		fs.writeFileSync(paths.journal, "", "utf8");
		repairedArtifacts.push(paths.journal);
	}
	if (repairedArtifacts.length > 0 && manifest) {
		const updatedManifest = {
			...manifest,
			updated_at: repairedAt,
			phase_state: derivePhaseState$1(backlog),
			last_assessment_status: assessment?.status ?? manifest.last_assessment_status
		};
		writeJson(paths.manifest, updatedManifest);
		fs.appendFileSync(paths.journal, `${JSON.stringify({
			ts: repairedAt,
			event: "run_bundle_repaired",
			run_id: updatedManifest.run_id,
			repaired_artifacts: repairedArtifacts.map((filePath) => path.basename(filePath)),
			previously_missing_artifacts: missingArtifacts.map(([, filePath]) => path.basename(filePath))
		})}\n`, "utf8");
	}
	return {
		existingArtifactCount: existingArtifacts.length,
		hasAnyCanonicalArtifacts: true,
		irreparableMissingArtifacts: [],
		repairedArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
}
//#endregion
//#region src/discovery/source-runtime.ts
var PACKET_FENCE_MARKERS = [
	"architecture-backlog-packet",
	"abe-packet",
	"architecture-backlog"
];
var PACKET_SECTION_KEYS = [
	"id_strategy",
	"glossary",
	"aliases",
	"source_exclusions",
	"target_system",
	"value_streams",
	"tracks",
	"track_gates",
	"track_journeys",
	"as_built",
	"claims",
	"negative_scope",
	"quality_attributes",
	"policy_decisions",
	"contracts",
	"data_domains",
	"gaps",
	"contradictions",
	"unknowns",
	"uncertainty_to_spike",
	"delivered_lineage_notes",
	"items",
	"relations",
	"proofs",
	"track_proofs",
	"reviews",
	"waivers",
	"roadmap_matrix"
];
var SECTION_ID_SELECTORS = {
	source_exclusions: (entry) => isNonEmptyString(entry.source_id) ? entry.source_id : null,
	value_streams: (entry) => isNonEmptyString(entry.value_stream_id) ? entry.value_stream_id : null,
	tracks: (entry) => isNonEmptyString(entry.track_id) ? entry.track_id : null,
	track_gates: (entry) => isNonEmptyString(entry.track_gate_id) ? entry.track_gate_id : null,
	track_journeys: (entry) => isNonEmptyString(entry.journey_id) ? entry.journey_id : null,
	claims: (entry) => isNonEmptyString(entry.claim_id) ? entry.claim_id : null,
	negative_scope: (entry) => isNonEmptyString(entry.negative_scope_id) ? entry.negative_scope_id : null,
	quality_attributes: (entry) => isNonEmptyString(entry.quality_attribute_id) ? entry.quality_attribute_id : null,
	policy_decisions: (entry) => isNonEmptyString(entry.policy_decision_id) ? entry.policy_decision_id : null,
	contracts: (entry) => isNonEmptyString(entry.contract_id) ? entry.contract_id : null,
	data_domains: (entry) => isNonEmptyString(entry.domain_id) ? entry.domain_id : null,
	gaps: (entry) => isNonEmptyString(entry.issue_id) ? entry.issue_id : null,
	contradictions: (entry) => isNonEmptyString(entry.issue_id) ? entry.issue_id : null,
	unknowns: (entry) => isNonEmptyString(entry.issue_id) ? entry.issue_id : null,
	uncertainty_to_spike: (entry) => isNonEmptyString(entry.unknown_id) && isNonEmptyString(entry.spike_item_id) ? `${entry.unknown_id}::${entry.spike_item_id}` : null,
	delivered_lineage_notes: (entry) => isNonEmptyString(entry.lineage_note_id) ? entry.lineage_note_id : null,
	items: (entry) => isNonEmptyString(entry.item_id) ? entry.item_id : null,
	relations: (entry) => {
		if (isNonEmptyString(entry.relation_id)) return entry.relation_id;
		const from = asStringRecord(entry.from);
		const to = asStringRecord(entry.to);
		return isNonEmptyString(entry.relation_type) && isNonEmptyString(from.kind) && isNonEmptyString(from.id) && isNonEmptyString(to.kind) && isNonEmptyString(to.id) ? `${entry.relation_type}:${from.kind}:${from.id}:${to.kind}:${to.id}` : null;
	},
	proofs: (entry) => isNonEmptyString(entry.proof_id) ? entry.proof_id : null,
	track_proofs: (entry) => isNonEmptyString(entry.track_proof_id) ? entry.track_proof_id : null,
	reviews: (entry) => isNonEmptyString(entry.review_id) ? entry.review_id : null,
	waivers: (entry) => isNonEmptyString(entry.waiver_id) ? entry.waiver_id : null,
	roadmap_matrix: (entry) => {
		if (isNonEmptyString(entry.row_id)) return entry.row_id;
		const itemRef = asStringRecord(entry.item_ref);
		return isNonEmptyString(itemRef.id) ? itemRef.id : null;
	}
};
function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}
function fingerprintContent(content) {
	return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
}
function isHttpRef(ref) {
	return ref.startsWith("http://") || ref.startsWith("https://");
}
function isFileUrl(ref) {
	return ref.startsWith("file://");
}
function sanitizeIdPart(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
function deriveSourceId(kind, normalizedRef, usedIds) {
	const refName = isHttpRef(normalizedRef) ? new URL(normalizedRef).pathname.split("/").filter(Boolean).at(-1) ?? "source" : path.parse(isFileUrl(normalizedRef) ? fileURLToPath(normalizedRef) : normalizedRef).name || "source";
	const baseId = `src-${sanitizeIdPart(kind)}-${sanitizeIdPart(refName) || "source"}`;
	if (!usedIds.has(baseId)) {
		usedIds.add(baseId);
		return baseId;
	}
	const candidate = `${baseId}-${crypto.createHash("sha256").update(normalizedRef).digest("hex").slice(0, 8)}`;
	usedIds.add(candidate);
	return candidate;
}
function normalizeSourceRef(ref, baseDir) {
	if (isHttpRef(ref) || isFileUrl(ref)) return ref;
	return path.resolve(baseDir, ref);
}
async function readSourceContent(ref, baseDir) {
	const normalizedRef = normalizeSourceRef(ref, baseDir);
	if (isHttpRef(normalizedRef)) {
		const response = await fetch(normalizedRef);
		if (!response.ok) throw new Error(`Failed to read source ${normalizedRef}: ${response.status} ${response.statusText}`);
		return {
			content: await response.text(),
			normalizedRef
		};
	}
	const filePath = isFileUrl(normalizedRef) ? fileURLToPath(normalizedRef) : normalizedRef;
	return {
		content: fs.readFileSync(filePath, "utf8"),
		normalizedRef
	};
}
function looksLikePacket(payload) {
	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return false;
	const record = payload;
	return PACKET_SECTION_KEYS.some((key) => key in record) || "source" in record && typeof record.source === "object" && record.source !== null;
}
function parsePacketPayload(payload, packetRef) {
	if (Array.isArray(payload)) return payload.flatMap((entry) => parsePacketPayload(entry, packetRef));
	if (looksLikePacket(payload)) return [cloneJson(payload)];
	const record = asStringRecord(payload);
	if (Array.isArray(record.packets)) return record.packets.flatMap((entry) => parsePacketPayload(entry, packetRef));
	throw new Error(`Source packet ${packetRef} does not contain a valid architecture-backlog packet`);
}
function extractPacketBlocksFromMarkdown(content, packetRef) {
	const packets = [];
	const fencePattern = /```([^\n]*)\n([\s\S]*?)```/g;
	let match = fencePattern.exec(content);
	while (match !== null) {
		const infoString = match[1]?.trim() ?? "";
		if (!PACKET_FENCE_MARKERS.some((marker) => infoString.includes(marker))) {
			match = fencePattern.exec(content);
			continue;
		}
		const block = match[2]?.trim() ?? "";
		if (!block) {
			match = fencePattern.exec(content);
			continue;
		}
		const parsed = JSON.parse(block);
		packets.push(...parsePacketPayload(parsed, packetRef));
		match = fencePattern.exec(content);
	}
	return packets;
}
function parseDiscoverySourcePackets(content, packetRef) {
	const trimmed = content.trim();
	if (trimmed.length === 0) return [];
	try {
		return parsePacketPayload(JSON.parse(trimmed), packetRef);
	} catch {
		return extractPacketBlocksFromMarkdown(content, packetRef);
	}
}
function mergeValues(baseValue, incomingValue) {
	if (incomingValue === void 0) return cloneJson(baseValue);
	if (baseValue === void 0) return cloneJson(incomingValue);
	if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
		const merged = [...baseValue, ...incomingValue].map((entry) => cloneJson(entry));
		const seen = /* @__PURE__ */ new Set();
		const deduped = [];
		for (const entry of merged) {
			const key = hashJsonValue(entry);
			if (seen.has(key)) continue;
			seen.add(key);
			deduped.push(entry);
		}
		return deduped;
	}
	if (typeof baseValue === "object" && baseValue !== null && !Array.isArray(baseValue) && typeof incomingValue === "object" && incomingValue !== null && !Array.isArray(incomingValue)) {
		const merged = {};
		const keys = new Set([...Object.keys(baseValue), ...Object.keys(incomingValue)]);
		for (const key of keys) merged[key] = mergeValues(baseValue[key], incomingValue[key]);
		return merged;
	}
	return cloneJson(incomingValue);
}
function upsertArraySection(current, incoming, sectionKey) {
	const idSelector = SECTION_ID_SELECTORS[sectionKey];
	if (!idSelector) return mergeValues(current, incoming);
	const merged = current.map((entry) => cloneJson(entry));
	const indexById = /* @__PURE__ */ new Map();
	for (const [index, entry] of merged.entries()) {
		const entryId = idSelector(entry);
		if (entryId) indexById.set(entryId, index);
	}
	for (const incomingEntry of incoming) {
		const entryId = idSelector(incomingEntry);
		if (!entryId) {
			merged.push(cloneJson(incomingEntry));
			continue;
		}
		const existingIndex = indexById.get(entryId);
		if (existingIndex === void 0) {
			indexById.set(entryId, merged.length);
			merged.push(cloneJson(incomingEntry));
			continue;
		}
		merged[existingIndex] = mergeValues(merged[existingIndex], incomingEntry);
	}
	return merged;
}
var SOURCE_REF_SECTIONS = new Set([
	"claims",
	"negative_scope",
	"quality_attributes",
	"policy_decisions",
	"gaps",
	"contradictions",
	"unknowns"
]);
function defaultSourceRefs(entries, sourceId, sectionKey) {
	if (!sourceId) return entries.map((entry) => cloneJson(entry));
	return entries.map((entry) => {
		const cloned = cloneJson(entry);
		if ("source_refs" in cloned && Array.isArray(cloned.source_refs) && cloned.source_refs.length > 0) return cloned;
		if (SOURCE_REF_SECTIONS.has(sectionKey)) cloned.source_refs = [sourceId];
		return cloned;
	});
}
function assignAuthoritativePrecedence(backlog) {
	const authoritativeSources = backlog.source_authority.filter((source) => source.authority === "authoritative_target_truth" || source.authority === "authoritative_current_truth");
	authoritativeSources.sort((left, right) => {
		const leftPrecedence = Number.isInteger(left.precedence) ? Number(left.precedence) : Number.MAX_SAFE_INTEGER;
		const rightPrecedence = Number.isInteger(right.precedence) ? Number(right.precedence) : Number.MAX_SAFE_INTEGER;
		if (leftPrecedence !== rightPrecedence) return leftPrecedence - rightPrecedence;
		return String(left.source_id ?? "").localeCompare(String(right.source_id ?? ""));
	});
	authoritativeSources.forEach((source, index) => {
		source.precedence = index + 1;
	});
}
async function resolveSourceInputs(specs, baseDir) {
	const usedIds = /* @__PURE__ */ new Set();
	const resolved = [];
	for (const spec of specs) {
		const { content, normalizedRef } = await readSourceContent(spec.ref, baseDir);
		const packetBlocks = parseDiscoverySourcePackets(content, normalizedRef);
		const sourceId = isNonEmptyString(spec.sourceId) ? spec.sourceId : deriveSourceId(spec.kind, normalizedRef, usedIds);
		usedIds.add(sourceId);
		resolved.push({
			content,
			fingerprint: fingerprintContent(content),
			normalizedRef,
			packetBlocks,
			source: {
				source_id: sourceId,
				ref: normalizedRef,
				kind: spec.kind,
				authority: spec.authority,
				...spec.precedence !== void 0 ? { precedence: spec.precedence } : {},
				...spec.notes !== void 0 ? { notes: spec.notes } : {}
			}
		});
	}
	return resolved;
}
async function loadSourcePacketRefs(packetRefs, baseDir) {
	const packets = [];
	for (const packetRef of packetRefs) {
		const { content, normalizedRef } = await readSourceContent(packetRef, baseDir);
		packets.push(...parseDiscoverySourcePackets(content, normalizedRef));
	}
	return packets;
}
function mergeSourceAuthorityEntry(backlog, source) {
	if (!isNonEmptyString(source.source_id)) return null;
	const current = backlog.source_authority.find((entry) => entry.source_id === source.source_id);
	if (!current) {
		backlog.source_authority.push(cloneJson(source));
		return source.source_id;
	}
	const merged = mergeValues(current, source);
	Object.assign(current, merged);
	return source.source_id;
}
function mergeDiscoveryPacketsIntoBacklog(backlog, rawSources, packets) {
	const appliedSourceIds = /* @__PURE__ */ new Set();
	for (const source of rawSources) {
		const sourceId = mergeSourceAuthorityEntry(backlog, {
			...source.source,
			fingerprint: source.fingerprint
		});
		if (sourceId) appliedSourceIds.add(sourceId);
	}
	const allPackets = [...rawSources.flatMap((source) => source.packetBlocks.map((packet) => ({
		packet,
		fallbackSource: source.source
	}))), ...packets.map((packet) => ({
		packet,
		fallbackSource: null
	}))];
	for (const { fallbackSource, packet } of allPackets) {
		const mergedSource = mergeValues(fallbackSource ?? {}, packet.source ?? {});
		if (fallbackSource && isNonEmptyString(fallbackSource.source_id) && isNonEmptyString(packet.source?.source_id) && fallbackSource.source_id !== packet.source.source_id) {
			backlog.source_authority = backlog.source_authority.filter((entry) => entry.source_id !== fallbackSource.source_id);
			appliedSourceIds.delete(fallbackSource.source_id);
		}
		const sourceId = mergeSourceAuthorityEntry(backlog, mergedSource);
		if (sourceId) appliedSourceIds.add(sourceId);
		const replaceSections = new Set(asArray(packet.replace_sections).filter(isNonEmptyString));
		if (packet.id_strategy) backlog.id_strategy = mergeValues(replaceSections.has("id_strategy") ? {} : backlog.id_strategy, packet.id_strategy);
		if (packet.glossary) backlog.glossary = mergeValues(replaceSections.has("glossary") ? {} : backlog.glossary, packet.glossary);
		if (packet.aliases) backlog.aliases = mergeValues(replaceSections.has("aliases") ? {} : backlog.aliases, packet.aliases);
		if (packet.target_system) backlog.target_system = mergeValues(replaceSections.has("target_system") ? {} : backlog.target_system, packet.target_system);
		if (packet.as_built) backlog.as_built = mergeValues(replaceSections.has("as_built") ? {} : backlog.as_built, packet.as_built);
		for (const sectionKey of PACKET_SECTION_KEYS) {
			if (sectionKey === "id_strategy" || sectionKey === "glossary" || sectionKey === "aliases" || sectionKey === "target_system" || sectionKey === "as_built") continue;
			const sectionValue = packet[sectionKey];
			if (!sectionValue) continue;
			if (!Array.isArray(sectionValue)) continue;
			const entries = defaultSourceRefs(sectionValue, sourceId, sectionKey);
			if (replaceSections.has(sectionKey)) {
				backlog[sectionKey] = cloneJson(entries);
				continue;
			}
			backlog[sectionKey] = upsertArraySection(backlog[sectionKey], entries, sectionKey);
		}
	}
	assignAuthoritativePrecedence(backlog);
	backlog.metadata.updated_at = (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
	return {
		appliedPackets: allPackets.length,
		appliedSourceIds: [...appliedSourceIds].sort()
	};
}
async function refreshSourceFingerprintsInBacklog(backlog, baseDir) {
	const accessStateChangedSourceIds = [];
	const changedSourceIds = [];
	const inaccessibleSources = [];
	const refreshedAt = utcNow();
	for (const source of backlog.source_authority) {
		if (!isNonEmptyString(source.source_id) || !isNonEmptyString(source.ref)) continue;
		try {
			const { content, normalizedRef } = await readSourceContent(source.ref, baseDir);
			const fingerprint = fingerprintContent(content);
			const accessStateChanged = source.last_access_status !== "ok" || source.last_access_error !== null || source.last_accessed_at !== refreshedAt;
			if (source.ref !== normalizedRef) source.ref = normalizedRef;
			if (source.fingerprint !== fingerprint) {
				source.fingerprint = fingerprint;
				changedSourceIds.push(source.source_id);
			}
			source.last_access_status = "ok";
			source.last_access_error = null;
			source.last_accessed_at = refreshedAt;
			if (accessStateChanged) accessStateChangedSourceIds.push(source.source_id);
		} catch {
			const accessStateChanged = source.last_access_status !== "inaccessible" || source.last_access_error !== "Unable to read source ref" || source.last_accessed_at !== refreshedAt;
			source.last_access_status = "inaccessible";
			source.last_access_error = "Unable to read source ref";
			source.last_accessed_at = refreshedAt;
			inaccessibleSources.push(source.source_id);
			if (accessStateChanged) accessStateChangedSourceIds.push(source.source_id);
		}
	}
	if (changedSourceIds.length > 0 || accessStateChangedSourceIds.length > 0) backlog.metadata.updated_at = refreshedAt;
	return {
		accessStateChangedSourceIds: [...new Set(accessStateChangedSourceIds)].sort(),
		changedSourceIds: [...new Set(changedSourceIds)].sort(),
		inaccessibleSources: [...new Set(inaccessibleSources)].sort()
	};
}
async function refreshRunSourceFingerprints(runDirInput) {
	const bundleRepair = repairCompactRunBundle(runDirInput);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		accessStateChangedSourceIds: [],
		changedSourceIds: [],
		inaccessibleSources: [],
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {},
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	const { backlog, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) return {
		accessStateChangedSourceIds: [],
		changedSourceIds: [],
		inaccessibleSources: [],
		...legacyLayoutMessage ? { legacyLayoutMessage } : {},
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	if (!backlog || !manifest) return {
		accessStateChangedSourceIds: [],
		changedSourceIds: [],
		inaccessibleSources: [],
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const refreshResult = await refreshSourceFingerprintsInBacklog(backlog, process.cwd());
	if (refreshResult.changedSourceIds.length > 0 || refreshResult.accessStateChangedSourceIds.length > 0) {
		const refreshedAt = utcNow();
		backlog.metadata.updated_at = refreshedAt;
		manifest.updated_at = refreshedAt;
		const paths = runPaths(runDir);
		writeJson(paths.backlog, backlog);
		writeJson(paths.manifest, manifest);
		appendNdjson(paths.journal, {
			ts: refreshedAt,
			event: "source_fingerprints_refreshed",
			run_id: manifest.run_id,
			changed_source_ids: refreshResult.changedSourceIds,
			access_state_changed_source_ids: refreshResult.accessStateChangedSourceIds,
			inaccessible_source_ids: refreshResult.inaccessibleSources
		});
	}
	return {
		...refreshResult,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
}
//#endregion
//#region src/discovery/drift-state.ts
var SOURCE_CHANGE = "source_change";
var CONTRACT_CHANGE = "contract_change";
var TOPOLOGY_CHANGE = "topology_change";
var TRACK_GATE_CHANGE = "track_gate_change";
var INCIDENT_FALSE_CLOSURE = "incident_false_closure";
var SECURITY_FINDING = "security_finding";
var NFR_BREACH = "nfr_breach";
var EXTERNAL_DEPENDENCY_CHANGE = "external_dependency_change";
var OWNER_BOUNDARY_CHANGE = "owner_boundary_change";
var RELEASE_PATH_CHANGE = "release_path_change";
var RUNTIME_SURFACES = new Set([
	"runtime",
	"deployment",
	"observability",
	"support",
	"enablement",
	"rollback",
	"recovery"
]);
function claimHashKey(claimId) {
	return `claim:${claimId}`;
}
function trackGateHashKey(trackGateId) {
	return `track_gate:${trackGateId}`;
}
function issueHashKey() {
	return "issues";
}
function securityHashKey() {
	return "security_posture";
}
function nfrHashKey() {
	return "nfr_posture";
}
function externalDependencyHashKey() {
	return "external_dependencies";
}
function ownershipHashKey() {
	return "ownership";
}
function releasePathHashKey() {
	return "release_paths";
}
function getCurrentSourceHashes(backlog) {
	return Object.fromEntries(backlog.source_authority.filter((source) => isNonEmptyString(source.source_id) && isNonEmptyString(source.fingerprint)).map((source) => [source.source_id, source.fingerprint]));
}
function getSecurityPosture(backlog) {
	return {
		controls: backlog.items.filter((item) => item.item_class === "control_guardrail").map((item) => ({
			item_id: item.item_id ?? "",
			change_surfaces: asArray(item.change_surfaces),
			trust_boundaries_crossed: asArray(item.trust_boundaries_crossed),
			data_class: item.data_class ?? null,
			observability_contract: item.observability_contract ?? null
		})),
		security_reviews: backlog.reviews.filter((review) => review.role === "security").map((review) => ({
			review_id: review.review_id ?? "",
			verdict: review.verdict ?? "",
			findings: asArray(review.findings),
			hard_fail_report: asArray(review.hard_fail_report)
		})),
		track_gates: backlog.track_gates.filter((gate) => gate.fail_mode === "fail_closed").map((gate) => ({
			track_gate_id: gate.track_gate_id ?? "",
			gate_type: gate.gate_type ?? "",
			governing_control_item_refs: asArray(gate.governing_control_item_refs)
		}))
	};
}
function getNfrPosture(backlog) {
	return {
		quality_attributes: backlog.quality_attributes,
		item_contracts: backlog.items.map((item) => ({
			item_id: item.item_id ?? "",
			nfr_contract: item.nfr_contract ?? null,
			observability_contract: item.observability_contract ?? null
		}))
	};
}
function getIssueLedger(backlog) {
	return {
		gaps: backlog.gaps,
		contradictions: backlog.contradictions,
		unknowns: backlog.unknowns,
		delivered_lineage_notes: backlog.delivered_lineage_notes
	};
}
function getExternalDependencyLedger(backlog) {
	return {
		target_dependencies: asArray(backlog.target_system.external_dependencies),
		dependency_classifications: asArray(backlog.as_built.dependency_classifications),
		vendor_external_owners: asArray(backlog.as_built.vendor_external_owners)
	};
}
function getOwnershipLedger(backlog) {
	return {
		target_ownership: asArray(backlog.target_system.team_and_ownership_assumptions),
		as_built_ownership: asArray(backlog.as_built.ownership_matrix),
		item_owners: backlog.items.map((item) => ({
			item_id: item.item_id ?? "",
			owners: item.owners ?? null
		}))
	};
}
function getReleasePathLedger(backlog) {
	return {
		item_release_paths: backlog.items.map((item) => ({
			item_id: item.item_id ?? "",
			rollout: item.rollout ?? null,
			recovery: item.recovery ?? null
		})),
		proofs: backlog.proofs.map((proof) => ({
			proof_id: proof.proof_id ?? "",
			covered_ref: proof.covered_ref ?? null,
			release_trace: proof.dimensions?.release_trace ?? null,
			rollback_or_recovery_trace: proof.dimensions?.rollback_or_recovery_trace ?? null
		}))
	};
}
function getCurrentCanonicalHashes(backlog) {
	const hashes = {
		contracts: hashJsonValue({
			contracts: backlog.contracts,
			data_domains: backlog.data_domains
		}),
		topology: hashJsonValue(backlog.as_built),
		[issueHashKey()]: hashJsonValue(getIssueLedger(backlog)),
		[securityHashKey()]: hashJsonValue(getSecurityPosture(backlog)),
		[nfrHashKey()]: hashJsonValue(getNfrPosture(backlog)),
		[externalDependencyHashKey()]: hashJsonValue(getExternalDependencyLedger(backlog)),
		[ownershipHashKey()]: hashJsonValue(getOwnershipLedger(backlog)),
		[releasePathHashKey()]: hashJsonValue(getReleasePathLedger(backlog))
	};
	for (const claim of backlog.claims) if (isNonEmptyString(claim.claim_id)) hashes[claimHashKey(claim.claim_id)] = hashJsonValue(claim);
	for (const trackGate of backlog.track_gates) if (isNonEmptyString(trackGate.track_gate_id)) hashes[trackGateHashKey(trackGate.track_gate_id)] = hashJsonValue(trackGate);
	return hashes;
}
function collectChangedKeys(baseline, current) {
	const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
	const changed = [];
	for (const key of keys) if ((baseline[key] ?? null) !== (current[key] ?? null)) changed.push(key);
	return changed.sort();
}
function collectItemClaimRefs(item) {
	const refs = /* @__PURE__ */ new Set();
	for (const claimRef of asArray(item.claim_refs)) if (isNonEmptyString(claimRef)) refs.add(claimRef);
	for (const origin of asArray(item.origin_ref)) {
		if (!isNonEmptyString(origin.kind) || !isNonEmptyString(origin.ref)) continue;
		if (origin.kind === "claim_ref" || origin.kind === "control_obligation_ref" || origin.kind === "decommission_need_ref") refs.add(origin.ref);
	}
	return [...refs];
}
function itemTouchesContractOrData(item) {
	return asArray(item.interfaces_touched).length > 0 || asArray(item.data_domains_touched).length > 0 || item.item_class === "migration" || item.item_class === "retirement";
}
function itemTouchesTopology(item) {
	return asArray(item.change_surfaces).some((surface) => RUNTIME_SURFACES.has(surface)) || asArray(item.trust_boundaries_crossed).length > 0 || item.item_class === "operational_enablement" || item.item_class === "documentation_support_enablement" || item.item_class === "migration";
}
function itemTouchesSecurity(item) {
	return item.item_class === "control_guardrail" || asArray(item.trust_boundaries_crossed).length > 0 || asArray(item.change_surfaces).some((surface) => [
		"auth",
		"authz",
		"secrets",
		"policy",
		"data_class",
		"external_api"
	].includes(String(surface)));
}
function itemTouchesNfr(item) {
	return item.nfr_contract !== null || item.observability_contract !== null;
}
function itemTouchesExternalDependencies(item) {
	return asArray(item.interfaces_touched).length > 0 || item.item_class === "migration" || item.item_class === "retirement" || item.item_class === "capability_seam";
}
function itemTouchesOwnership(item) {
	return item.owners !== null && item.owners !== void 0;
}
function itemTouchesReleasePaths(item) {
	return item.rollout !== null || item.recovery !== null;
}
function proofInvalidatedByRebaseline(manifest, proofExecutedAt, invalidatedBy) {
	if (manifest.last_rebaseline_causes.length === 0) return false;
	const rebaselineAt = parseTimestamp(manifest.last_rebaseline_at);
	const executedAt = parseTimestamp(proofExecutedAt);
	if (rebaselineAt === null || executedAt === null) return false;
	if (executedAt >= rebaselineAt) return false;
	return invalidatedBy.some((cause) => manifest.last_rebaseline_causes.includes(cause));
}
function parseInvalidationCauses(value) {
	const validCauses = new Set([
		SOURCE_CHANGE,
		CONTRACT_CHANGE,
		TOPOLOGY_CHANGE,
		TRACK_GATE_CHANGE,
		INCIDENT_FALSE_CLOSURE,
		SECURITY_FINDING,
		NFR_BREACH,
		EXTERNAL_DEPENDENCY_CHANGE,
		OWNER_BOUNDARY_CHANGE,
		RELEASE_PATH_CHANGE
	]);
	return asArray(Array.isArray(value) ? value : []).filter((entry) => typeof entry === "string" && validCauses.has(entry));
}
function itemTouchesIssueLedgers(item) {
	return asArray(item.origin_ref).some((origin) => origin.kind === "gap_ref" || origin.kind === "unknown_ref" || origin.kind === "review_finding_ref");
}
function computeDriftState(manifest, backlog, nowMs = Date.now()) {
	const currentSourceHashes = getCurrentSourceHashes(backlog);
	const currentCanonicalHashes = getCurrentCanonicalHashes(backlog);
	const baselineEstablished = Object.keys(manifest.baseline_source_hashes).length > 0 || Object.keys(manifest.baseline_canonical_hashes).length > 0;
	const baselineSourceHashes = baselineEstablished ? manifest.baseline_source_hashes : currentSourceHashes;
	const baselineCanonicalHashes = baselineEstablished ? manifest.baseline_canonical_hashes : currentCanonicalHashes;
	const changedSourceIds = collectChangedKeys(baselineSourceHashes, currentSourceHashes);
	const changedCanonicalKeys = collectChangedKeys(baselineCanonicalHashes, currentCanonicalHashes);
	const changedClaimIds = changedCanonicalKeys.filter((key) => key.startsWith("claim:")).map((key) => key.slice(6));
	const changedTrackGateIds = changedCanonicalKeys.filter((key) => key.startsWith("track_gate:")).map((key) => key.slice(11));
	const topologyChanged = baselineCanonicalHashes.topology !== void 0 && currentCanonicalHashes.topology !== void 0 && baselineCanonicalHashes.topology !== currentCanonicalHashes.topology;
	const contractChanged = baselineCanonicalHashes.contracts !== void 0 && currentCanonicalHashes.contracts !== void 0 && baselineCanonicalHashes.contracts !== currentCanonicalHashes.contracts;
	const incidentChanged = baselineCanonicalHashes[issueHashKey()] !== void 0 && currentCanonicalHashes[issueHashKey()] !== void 0 && baselineCanonicalHashes[issueHashKey()] !== currentCanonicalHashes[issueHashKey()];
	const securityChanged = baselineCanonicalHashes[securityHashKey()] !== void 0 && currentCanonicalHashes[securityHashKey()] !== void 0 && baselineCanonicalHashes[securityHashKey()] !== currentCanonicalHashes[securityHashKey()];
	const nfrChanged = baselineCanonicalHashes[nfrHashKey()] !== void 0 && currentCanonicalHashes[nfrHashKey()] !== void 0 && baselineCanonicalHashes[nfrHashKey()] !== currentCanonicalHashes[nfrHashKey()];
	const externalDependencyChanged = baselineCanonicalHashes[externalDependencyHashKey()] !== void 0 && currentCanonicalHashes[externalDependencyHashKey()] !== void 0 && baselineCanonicalHashes[externalDependencyHashKey()] !== currentCanonicalHashes[externalDependencyHashKey()];
	const ownershipChanged = baselineCanonicalHashes[ownershipHashKey()] !== void 0 && currentCanonicalHashes[ownershipHashKey()] !== void 0 && baselineCanonicalHashes[ownershipHashKey()] !== currentCanonicalHashes[ownershipHashKey()];
	const releasePathChanged = baselineCanonicalHashes[releasePathHashKey()] !== void 0 && currentCanonicalHashes[releasePathHashKey()] !== void 0 && baselineCanonicalHashes[releasePathHashKey()] !== currentCanonicalHashes[releasePathHashKey()];
	const dirtyFlags = [];
	if (changedSourceIds.length > 0 || changedClaimIds.length > 0) dirtyFlags.push(SOURCE_CHANGE);
	if (contractChanged) dirtyFlags.push(CONTRACT_CHANGE);
	if (topologyChanged) dirtyFlags.push(TOPOLOGY_CHANGE);
	if (changedTrackGateIds.length > 0) dirtyFlags.push(TRACK_GATE_CHANGE);
	if (incidentChanged) dirtyFlags.push(INCIDENT_FALSE_CLOSURE);
	if (securityChanged) dirtyFlags.push(SECURITY_FINDING);
	if (nfrChanged) dirtyFlags.push(NFR_BREACH);
	if (externalDependencyChanged) dirtyFlags.push(EXTERNAL_DEPENDENCY_CHANGE);
	if (ownershipChanged) dirtyFlags.push(OWNER_BOUNDARY_CHANGE);
	if (releasePathChanged) dirtyFlags.push(RELEASE_PATH_CHANGE);
	const claimsById = new Map(backlog.claims.filter((claim) => isNonEmptyString(claim.claim_id)).map((claim) => [claim.claim_id, claim]));
	const itemsById = new Map(backlog.items.filter((item) => isNonEmptyString(item.item_id)).map((item) => [item.item_id, item]));
	const trackProofsById = new Map(backlog.track_proofs.filter((trackProof) => isNonEmptyString(trackProof.track_proof_id) && isNonEmptyString(trackProof.track_id)).map((trackProof) => [trackProof.track_proof_id, trackProof]));
	const trackGateIdsByTrack = /* @__PURE__ */ new Map();
	for (const gate of backlog.track_gates) {
		if (!isNonEmptyString(gate.track_gate_id) || !isNonEmptyString(gate.track_id)) continue;
		const existing = trackGateIdsByTrack.get(gate.track_id) ?? [];
		existing.push(gate.track_gate_id);
		trackGateIdsByTrack.set(gate.track_id, existing);
	}
	const staleClaims = /* @__PURE__ */ new Set();
	for (const claimId of changedClaimIds) staleClaims.add(claimId);
	for (const [claimId, claim] of claimsById) if (asArray(claim.source_refs).some((sourceRef) => changedSourceIds.includes(sourceRef))) staleClaims.add(claimId);
	const staleProofs = /* @__PURE__ */ new Set();
	for (const proof of backlog.proofs) {
		if (!isNonEmptyString(proof.proof_id)) continue;
		const invalidatedBy = parseInvalidationCauses(proof.invalidated_by);
		const freshUntil = parseTimestamp(proof.fresh_until ?? null);
		let stale = freshUntil !== null && freshUntil < nowMs;
		if (!stale && proof.covered_ref?.kind === "item" && isNonEmptyString(proof.covered_ref.id)) {
			const coveredItem = itemsById.get(proof.covered_ref.id);
			if (coveredItem) {
				const itemClaimRefs = collectItemClaimRefs(coveredItem);
				if (invalidatedBy.includes(SOURCE_CHANGE) && itemClaimRefs.some((claimRef) => staleClaims.has(claimRef))) stale = true;
				if (invalidatedBy.includes(CONTRACT_CHANGE) && contractChanged && itemTouchesContractOrData(coveredItem)) stale = true;
				if (invalidatedBy.includes(TOPOLOGY_CHANGE) && topologyChanged && itemTouchesTopology(coveredItem)) stale = true;
				if (invalidatedBy.includes(INCIDENT_FALSE_CLOSURE) && incidentChanged && itemTouchesIssueLedgers(coveredItem)) stale = true;
				if (invalidatedBy.includes(SECURITY_FINDING) && securityChanged && itemTouchesSecurity(coveredItem)) stale = true;
				if (invalidatedBy.includes(NFR_BREACH) && nfrChanged && itemTouchesNfr(coveredItem)) stale = true;
				if (invalidatedBy.includes(EXTERNAL_DEPENDENCY_CHANGE) && externalDependencyChanged && itemTouchesExternalDependencies(coveredItem)) stale = true;
				if (invalidatedBy.includes(OWNER_BOUNDARY_CHANGE) && ownershipChanged && itemTouchesOwnership(coveredItem)) stale = true;
				if (invalidatedBy.includes(RELEASE_PATH_CHANGE) && releasePathChanged && itemTouchesReleasePaths(coveredItem)) stale = true;
				if (invalidatedBy.includes(TRACK_GATE_CHANGE) && isNonEmptyString(coveredItem.track_id) && (trackGateIdsByTrack.get(coveredItem.track_id) ?? []).some((trackGateId) => changedTrackGateIds.includes(trackGateId))) stale = true;
			}
		} else if (!stale && proof.covered_ref?.kind === "track_proof" && isNonEmptyString(proof.covered_ref.id)) {
			const trackProof = trackProofsById.get(proof.covered_ref.id);
			if (trackProof) {
				if (invalidatedBy.includes(SOURCE_CHANGE) && staleClaims.size > 0) stale = true;
				if (invalidatedBy.includes(CONTRACT_CHANGE) && contractChanged) stale = true;
				if (invalidatedBy.includes(TOPOLOGY_CHANGE) && topologyChanged) stale = true;
				if (invalidatedBy.includes(INCIDENT_FALSE_CLOSURE) && incidentChanged) stale = true;
				if (invalidatedBy.includes(SECURITY_FINDING) && securityChanged) stale = true;
				if (invalidatedBy.includes(NFR_BREACH) && nfrChanged) stale = true;
				if (invalidatedBy.includes(EXTERNAL_DEPENDENCY_CHANGE) && externalDependencyChanged) stale = true;
				if (invalidatedBy.includes(OWNER_BOUNDARY_CHANGE) && ownershipChanged) stale = true;
				if (invalidatedBy.includes(RELEASE_PATH_CHANGE) && releasePathChanged) stale = true;
				if (invalidatedBy.includes(TRACK_GATE_CHANGE) && (trackGateIdsByTrack.get(trackProof.track_id) ?? []).some((trackGateId) => changedTrackGateIds.includes(trackGateId))) stale = true;
			}
		} else if (!stale && proof.covered_ref?.kind === "run") stale = invalidatedBy.some((cause) => dirtyFlags.includes(cause));
		if (!stale && proofInvalidatedByRebaseline(manifest, proof.executed_at, invalidatedBy)) stale = true;
		if (stale) staleProofs.add(proof.proof_id);
	}
	const staleItems = /* @__PURE__ */ new Set();
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id)) continue;
		const hasStaleClaims = collectItemClaimRefs(item).some((claimRef) => staleClaims.has(claimRef));
		const hasStaleProofs = asArray(item.proof_refs).some((proofRef) => staleProofs.has(proofRef));
		const invalidatedByNewDrift = incidentChanged && true || securityChanged && itemTouchesSecurity(item) || nfrChanged && itemTouchesNfr(item) || externalDependencyChanged && itemTouchesExternalDependencies(item) || ownershipChanged && itemTouchesOwnership(item) || releasePathChanged && itemTouchesReleasePaths(item);
		if (hasStaleClaims || hasStaleProofs || invalidatedByNewDrift) staleItems.add(item.item_id);
	}
	const trackGateIdsToRecalculate = new Set(changedTrackGateIds);
	for (const trackGate of backlog.track_gates) if (isNonEmptyString(trackGate.track_gate_id) && asArray(trackGate.required_proof_refs).some((proofRef) => staleProofs.has(proofRef))) trackGateIdsToRecalculate.add(trackGate.track_gate_id);
	return {
		baselineCanonicalHashes,
		baselineEstablished,
		baselineSourceHashes,
		currentCanonicalHashes,
		currentSourceHashes,
		deltaSummary: {
			baseline_established: baselineEstablished,
			changed_source_ids: changedSourceIds,
			changed_claim_ids: changedClaimIds,
			stale_claim_ids: [...staleClaims].sort(),
			stale_item_ids: [...staleItems].sort(),
			stale_proof_ids: [...staleProofs].sort(),
			track_gate_ids_to_recalculate: [...trackGateIdsToRecalculate].sort(),
			dirty_flags: dirtyFlags,
			topology_changed: topologyChanged,
			contract_changed: contractChanged,
			changed_track_gate_ids: changedTrackGateIds
		},
		rebaselineRequired: dirtyFlags.length > 0,
		staleClaims: [...staleClaims].sort(),
		staleItems: [...staleItems].sort(),
		staleProofs: [...staleProofs].sort()
	};
}
//#endregion
//#region src/discovery/validate-run.ts
var REQUIRED_TRACK_IDS = new Set([
	"minimal-working-system",
	"externally-safe-operationally-supportable",
	"full-target-system"
]);
var BASELINE_IMPLEMENTATION_REVIEW_ROLES = [
	"product_strategy",
	"system_architecture",
	"application_engineering",
	"platform_sre",
	"security",
	"qa_release",
	"support_operations"
];
var REVIEW_FINDING_SEVERITY_RANK = new Map([
	["critical", 5],
	["high", 4],
	["medium", 3],
	["low", 2],
	["info", 1]
]);
var READINESS_EXEMPTIONS_BY_CLASS = {
	capability_seam: /* @__PURE__ */ new Set(),
	feature_slice: /* @__PURE__ */ new Set(),
	control_guardrail: /* @__PURE__ */ new Set(),
	migration: /* @__PURE__ */ new Set(),
	retirement: /* @__PURE__ */ new Set(),
	spike_discovery: /* @__PURE__ */ new Set(),
	operational_enablement: new Set(["rollout_defined", "recovery_defined"]),
	documentation_support_enablement: new Set(["rollout_defined", "recovery_defined"])
};
var DONE_EXEMPTIONS_BY_CLASS = {
	capability_seam: /* @__PURE__ */ new Set(),
	feature_slice: /* @__PURE__ */ new Set(),
	control_guardrail: /* @__PURE__ */ new Set(),
	migration: /* @__PURE__ */ new Set(),
	retirement: /* @__PURE__ */ new Set(),
	spike_discovery: /* @__PURE__ */ new Set(),
	operational_enablement: new Set(["code_and_infra_complete", "migration_execution_or_safe_schedule_complete"]),
	documentation_support_enablement: new Set(["code_and_infra_complete", "migration_execution_or_safe_schedule_complete"])
};
var ITEM_CLASSES_REQUIRING_VALUE_DESCRIPTOR = new Set([
	"capability_seam",
	"feature_slice",
	"control_guardrail",
	"migration",
	"retirement",
	"spike_discovery",
	"operational_enablement",
	"documentation_support_enablement"
]);
var ITEM_CLASSES_REQUIRING_ACTOR_ROLE_SET = new Set([
	"capability_seam",
	"feature_slice",
	"control_guardrail",
	"migration",
	"retirement",
	"spike_discovery",
	"operational_enablement",
	"documentation_support_enablement"
]);
var ITEM_CLASSES_REQUIRING_ADR_REFS = new Set(["capability_seam", "feature_slice"]);
var OUTGOING_RELATIONS_BY_CLASS = {
	capability_seam: new Set([
		"decomposes_into",
		"depends_on",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track",
		"touches_contract",
		"touches_data_domain",
		"replaces"
	]),
	feature_slice: new Set([
		"realizes",
		"depends_on",
		"blocked_by",
		"touches_contract",
		"touches_data_domain",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track"
	]),
	control_guardrail: new Set([
		"depends_on",
		"proves",
		"reviewed_by",
		"belongs_to_track",
		"touches_contract",
		"touches_data_domain"
	]),
	migration: new Set([
		"migrates_from",
		"depends_on",
		"retires",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track",
		"touches_contract",
		"touches_data_domain"
	]),
	retirement: new Set([
		"retires",
		"depends_on",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track",
		"touches_contract",
		"touches_data_domain"
	]),
	spike_discovery: new Set([
		"enabled_by",
		"depends_on",
		"reviewed_by",
		"proves",
		"belongs_to_track"
	]),
	operational_enablement: new Set([
		"enabled_by",
		"depends_on",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track"
	]),
	documentation_support_enablement: new Set([
		"enabled_by",
		"depends_on",
		"governed_by",
		"proves",
		"reviewed_by",
		"belongs_to_track"
	])
};
var SUPPORT_SURFACES = new Set([
	"runtime",
	"deployment",
	"rollback",
	"recovery",
	"observability",
	"support",
	"enablement"
]);
var SECURITY_SURFACES = new Set([
	"auth",
	"authz",
	"trust_boundary",
	"data_class",
	"secret",
	"policy",
	"exposure"
]);
var QUALITY_CLASSES = new Set([
	"latency",
	"throughput",
	"concurrency",
	"availability",
	"durability",
	"rpo",
	"rto",
	"cost_budget",
	"privacy_compliance",
	"accessibility_localization",
	"auditability_traceability",
	"scalability"
]);
var CRITICAL_UNKNOWN_SEVERITIES = new Set(["critical", "high"]);
var MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES = new Set([
	"manual",
	"stub",
	"trusted_local_only",
	"compatibility_only"
]);
var REQUIRED_RETIREMENT_CLEANUP_SCOPE = [
	"code",
	"flags",
	"secrets",
	"docs",
	"dashboards",
	"alerts",
	"data"
];
var GENERIC_SLICE_TITLE_PATTERNS = [
	/(^|\b)build service\b/i,
	/(^|\b)add basic observability\b/i,
	/(^|\b)implement auth\b/i,
	/(^|\b)prepare infra\b/i,
	/(^|\b)tech(?:nical)? improvement\b/i
];
var CLASS_PAYLOAD_KEYS = {
	capability_seam: new Set([
		"capability_added",
		"owner_surfaces",
		"real_closure_definition"
	]),
	feature_slice: new Set(["parent_seam_ref", "acceptance_examples"]),
	control_guardrail: new Set([
		"control_objective",
		"enforcing_surface",
		"fail_mode"
	]),
	migration: new Set([
		"source_state",
		"target_state",
		"stop_go_checkpoint",
		"cleanup_scope"
	]),
	retirement: new Set([
		"replaces_or_retires_ref",
		"retirement_trigger",
		"legacy_assets",
		"dependent_consumers",
		"cleanup_scope"
	]),
	spike_discovery: new Set([
		"question",
		"uncertainty_class",
		"validation_method",
		"expected_artifact",
		"exit_criteria",
		"kill_criteria",
		"max_duration",
		"follow_on_item_refs",
		"spike_outcome"
	]),
	operational_enablement: new Set(["runbook_or_enablement_artifact", "operational_audience"]),
	documentation_support_enablement: new Set([
		"doc_audience",
		"doc_scope",
		"source_of_truth_artifact",
		"freshness_update_trigger",
		"freshness_update_owner",
		"support_handoff_artifact"
	])
};
var ORIGIN_KINDS_BY_CLASS = {
	capability_seam: new Set([
		"claim_ref",
		"gap_ref",
		"review_finding_ref"
	]),
	feature_slice: new Set([
		"claim_ref",
		"gap_ref",
		"review_finding_ref"
	]),
	control_guardrail: new Set([
		"control_obligation_ref",
		"policy_decision_ref",
		"review_finding_ref"
	]),
	migration: new Set([
		"claim_ref",
		"gap_ref",
		"review_finding_ref",
		"unknown_ref"
	]),
	retirement: new Set([
		"decommission_need_ref",
		"gap_ref",
		"review_finding_ref"
	]),
	spike_discovery: new Set([
		"unknown_ref",
		"gap_ref",
		"review_finding_ref"
	]),
	operational_enablement: new Set([
		"claim_ref",
		"control_obligation_ref",
		"policy_decision_ref",
		"review_finding_ref"
	]),
	documentation_support_enablement: new Set([
		"claim_ref",
		"control_obligation_ref",
		"policy_decision_ref",
		"review_finding_ref"
	])
};
function pushIssue(target, message, hardFails, hardFail = false) {
	target.push(message);
	if (hardFail && hardFails) hardFails.push(message);
}
function graphRefExists(ref, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) {
	if (!ref || !isNonEmptyString(ref.id)) return false;
	switch (ref.kind) {
		case "run": return ref.id === runId;
		case "item": return itemIds.has(ref.id);
		case "track": return trackIds.has(ref.id);
		case "track_proof": return trackProofIds.has(ref.id);
		case "proof": return proofIds.has(ref.id);
		case "review": return reviewIds.has(ref.id);
		case "contract": return contractIds.has(ref.id);
		case "data_domain": return dataDomainIds.has(ref.id);
		case "value_stream": return valueStreamIds.has(ref.id);
		default: return false;
	}
}
function relationEndpointExists(relation, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) {
	const relType = relation.relation_type;
	const fromRef = normalizeRelationRef(relation.from, "item");
	const toRef = normalizeRelationRef(relation.to);
	if (!isNonEmptyString(relType) || toRef === null) return {
		fromRef,
		toRef,
		validFrom: false,
		validTo: false
	};
	let validFrom = false;
	let validTo = false;
	switch (relType) {
		case "belongs_to_track":
			validFrom = fromRef?.kind === "item" && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			validTo = toRef.kind === "track" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		case "proves":
			validFrom = fromRef !== null && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) && (fromRef.kind === "item" || fromRef.kind === "track");
			validTo = fromRef?.kind === "item" && toRef.kind === "proof" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) || fromRef?.kind === "track" && toRef.kind === "track_proof" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		case "reviewed_by":
			validFrom = fromRef !== null && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) && (fromRef.kind === "item" || fromRef.kind === "run" || fromRef.kind === "track_proof");
			validTo = toRef.kind === "review" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		case "touches_contract":
			validFrom = fromRef?.kind === "item" && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			validTo = toRef.kind === "contract" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		case "touches_data_domain":
			validFrom = fromRef?.kind === "item" && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			validTo = toRef.kind === "data_domain" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		case "migrates_from":
		case "retires":
		case "replaces":
			validFrom = fromRef?.kind === "item" && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			validTo = toRef.kind === "item" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds) || toRef.kind === "contract" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
		default:
			validFrom = fromRef?.kind === "item" && graphRefExists(fromRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			validTo = toRef.kind === "item" && graphRefExists(toRef, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
			break;
	}
	return {
		fromRef,
		toRef,
		validFrom,
		validTo
	};
}
function hasChangeSurface(item, surfaces) {
	return asArray(item.change_surfaces).some((surface) => surfaces.has(surface));
}
function requiresRollout(item) {
	return item.item_class !== "spike_discovery";
}
function normalizeRelationRef(value, defaultKind) {
	if (isGraphRef(value)) return value;
	if (isNonEmptyString(value) && defaultKind) return graphRef(defaultKind, value);
	return null;
}
function relationRefEquals(left, right) {
	return graphRefKey(left) === graphRefKey(right);
}
function getDependencyRefs(item) {
	return asArray(item.dependency_refs ?? item.dependencies);
}
function getPlanningConstraints(item) {
	return asStringRecord(item.planning_constraints);
}
function getPlanningString(item, key) {
	const planning = getPlanningConstraints(item);
	return isNonEmptyString(planning[key]) ? String(planning[key]) : void 0;
}
function getPlanningBoolean(item, key) {
	const planning = getPlanningConstraints(item);
	return typeof planning[key] === "boolean" ? planning[key] : null;
}
function getItemEstimateBand(item) {
	const planning = getPlanningConstraints(item);
	return isNonEmptyString(planning.estimate_band) ? planning.estimate_band : item.estimate_band;
}
function getItemConfidence(item) {
	const planning = getPlanningConstraints(item);
	return isNonEmptyString(planning.confidence) ? planning.confidence : item.confidence;
}
function getValueRecord(item) {
	return asStringRecord(item.value);
}
function getNfrContract(item) {
	return asStringRecord(item.nfr_contract);
}
function getObservabilityContract(item) {
	return asStringRecord(item.observability_contract);
}
function getReadinessContract(item) {
	return asStringRecord(item.readiness_contract);
}
function getDoneContract(item) {
	return asStringRecord(item.done_contract);
}
function getContractExemptions(contract) {
	const raw = asStringRecord(contract.exemptions);
	const normalized = {};
	for (const [key, value] of Object.entries(raw)) if (isNonEmptyString(value)) normalized[key] = value;
	return normalized;
}
function contractCheckSatisfied(contract, field, allowedExemptions) {
	if (contract[field] === true) return {
		exempted: false,
		satisfied: true
	};
	const exemptions = getContractExemptions(contract);
	if (allowedExemptions.has(field) && isNonEmptyString(exemptions[field])) return {
		exempted: true,
		satisfied: true
	};
	return {
		exempted: false,
		satisfied: false
	};
}
function validateFindingCollection(reviewId, collection, collectionName, errors, hardFails, reviewFindingIds) {
	if (!Array.isArray(collection)) {
		pushIssue(errors, `Review ${reviewId} missing ${collectionName}`, hardFails, true);
		return;
	}
	let previousRank = Number.POSITIVE_INFINITY;
	for (const entry of collection) {
		const finding = asStringRecord(entry);
		if (!isNonEmptyString(finding.finding_id)) {
			pushIssue(errors, `Review ${reviewId} has ${collectionName} entry with invalid finding_id`, hardFails, true);
			continue;
		}
		if (reviewFindingIds.has(finding.finding_id)) {
			pushIssue(errors, `Duplicate review finding_id: ${finding.finding_id}`, hardFails, true);
			continue;
		}
		reviewFindingIds.add(finding.finding_id);
		if (!isNonEmptyString(finding.severity) || !REVIEW_FINDING_SEVERITY_RANK.has(finding.severity)) {
			pushIssue(errors, `Review ${reviewId} has ${collectionName} entry ${finding.finding_id} with invalid severity`, hardFails, true);
			continue;
		}
		if (!isNonEmptyString(finding.title) || !isNonEmptyString(finding.detail)) {
			pushIssue(errors, `Review ${reviewId} has ${collectionName} entry ${finding.finding_id} without title/detail`, hardFails, true);
			continue;
		}
		const rank = REVIEW_FINDING_SEVERITY_RANK.get(finding.severity) ?? 0;
		if (rank > previousRank) pushIssue(errors, `Review ${reviewId} ${collectionName} must be ordered by severity`, hardFails, true);
		previousRank = rank;
	}
}
function getClassPayload(item) {
	return asStringRecord(item.class_payload);
}
function getPayloadString(item, key, fallback) {
	const payload = getClassPayload(item);
	return isNonEmptyString(payload[key]) ? String(payload[key]) : fallback;
}
function getPayloadStringArray(item, key, fallback) {
	const payloadValue = getClassPayload(item)[key];
	if (Array.isArray(payloadValue)) return payloadValue.filter(isNonEmptyString);
	return fallback ?? [];
}
function getPayloadGraphRef(item, key, fallbackKind) {
	const value = getClassPayload(item)[key];
	if (isGraphRef(value)) return value;
	if (isNonEmptyString(value) && fallbackKind) return graphRef(fallbackKind, value);
	return null;
}
function getDoneContractClassCheck(item, key) {
	const classSpecificChecks = asStringRecord(getDoneContract(item).class_specific_checks);
	return typeof classSpecificChecks[key] === "boolean" ? classSpecificChecks[key] : null;
}
function isSecurityDirectlyImpacted(items) {
	return items.some((item) => item.item_class === "control_guardrail" || hasChangeSurface(item, SECURITY_SURFACES));
}
function isRuntimeOrSupportDirectlyImpacted(items) {
	return items.some((item) => item.item_class === "operational_enablement" || item.item_class === "documentation_support_enablement" || hasChangeSurface(item, SUPPORT_SURFACES));
}
function getRolloutMode(item) {
	const rollout = asStringRecord(item.rollout);
	return isNonEmptyString(rollout.mode) ? String(rollout.mode) : item.rollout_mode ?? null;
}
function getRolloutApplicability(item) {
	const rollout = asStringRecord(item.rollout);
	return isNonEmptyString(rollout.applicability) ? String(rollout.applicability) : "required";
}
function getRolloutJustification(item) {
	const rollout = asStringRecord(item.rollout);
	return isNonEmptyString(rollout.justification) ? String(rollout.justification) : null;
}
function getRecoveryClass(item) {
	const recovery = asStringRecord(item.recovery);
	return isNonEmptyString(recovery.class) ? String(recovery.class) : item.rollback_class ?? null;
}
function getRecoveryApplicability(item) {
	const recovery = asStringRecord(item.recovery);
	return isNonEmptyString(recovery.applicability) ? String(recovery.applicability) : "required";
}
function getRecoveryJustification(item) {
	const recovery = asStringRecord(item.recovery);
	return isNonEmptyString(recovery.justification) ? String(recovery.justification) : null;
}
function getContractGovernance(item) {
	return asStringRecord(item.contract_governance);
}
function isObsoleteNaShape(value) {
	return typeof value === "string" && value.trim().toLowerCase() === "n_a";
}
function isCriticalUnknownSeverity(value) {
	return isNonEmptyString(value) && CRITICAL_UNKNOWN_SEVERITIES.has(value.toLowerCase());
}
function itemTouchesTrustBoundary(item) {
	return asArray(item.trust_boundaries_crossed).length > 0 || hasChangeSurface(item, SECURITY_SURFACES);
}
function itemRequiresNfrContract(item) {
	return [
		"capability_seam",
		"feature_slice",
		"control_guardrail",
		"migration",
		"operational_enablement"
	].includes(item.item_class ?? "");
}
function itemRequiresObservabilityContract(item) {
	return itemRequiresNfrContract(item) || hasChangeSurface(item, SUPPORT_SURFACES) || item.item_class === "documentation_support_enablement";
}
function hasGenericSliceTitle(title) {
	return isNonEmptyString(title) && GENERIC_SLICE_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}
function getUnexpectedPayloadKeys(item) {
	if (!isNonEmptyString(item.item_class)) return [];
	const allowedKeys = CLASS_PAYLOAD_KEYS[item.item_class];
	return Object.keys(getClassPayload(item)).filter((key) => !allowedKeys.has(key));
}
function isStringArray(value) {
	return Array.isArray(value) && value.every(isNonEmptyString);
}
function validateStringArrayField(record, field, ownerLabel, errors, hardFails) {
	const value = record[field];
	if (!isStringArray(value)) {
		pushIssue(errors, `${ownerLabel} must include ${field}[]`, hardFails, true);
		return [];
	}
	return value;
}
function requireNonEmptyStringArrayField(record, field, ownerLabel, errors, hardFails) {
	const value = validateStringArrayField(record, field, ownerLabel, errors, hardFails);
	if (value.length === 0) pushIssue(errors, `${ownerLabel} must include at least one ${field} entry`, hardFails, true);
	return value;
}
function validateNonEmptyStringRecord(record, ownerLabel, errors, hardFails) {
	for (const [key, value] of Object.entries(record)) {
		if (!isNonEmptyString(key)) pushIssue(errors, `${ownerLabel} contains an empty key`, hardFails, true);
		if (!isNonEmptyString(value)) pushIssue(errors, `${ownerLabel}.${key} must be a non-empty string`, hardFails, true);
	}
}
function validateAliasRecord(record, ownerLabel, errors, hardFails) {
	for (const [key, value] of Object.entries(record)) {
		if (!isNonEmptyString(key)) pushIssue(errors, `${ownerLabel} contains an empty canonical term`, hardFails, true);
		if (!isStringArray(value) || value.length === 0) {
			pushIssue(errors, `${ownerLabel}.${key} must be a non-empty string array`, hardFails, true);
			continue;
		}
		if (value.some((alias) => alias === key)) pushIssue(errors, `${ownerLabel}.${key} must not repeat the canonical term as an alias`, hardFails, true);
	}
}
function validateSourceRefs(refs, ownerLabel, sourceIds, excludedSourceIds, errors, hardFails) {
	if (!isStringArray(refs)) {
		pushIssue(errors, `${ownerLabel} must include source_refs[]`, hardFails, true);
		return [];
	}
	if (refs.length === 0) {
		pushIssue(errors, `${ownerLabel} must include source_refs[]`, hardFails, true);
		return refs;
	}
	for (const sourceRef of refs) if (!sourceIds.has(sourceRef)) pushIssue(errors, `${ownerLabel} references unknown source ${sourceRef}`, hardFails, true);
	else if (excludedSourceIds.has(sourceRef)) pushIssue(errors, `${ownerLabel} references excluded source ${sourceRef}`, hardFails, true);
	return refs;
}
function validateGraphRefArray(refs, ownerLabel, field, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails) {
	if (!Array.isArray(refs)) {
		pushIssue(errors, `${ownerLabel} must include ${field}[]`, hardFails, true);
		return [];
	}
	const validatedRefs = [];
	for (const ref of refs) {
		if (!isGraphRef(ref)) {
			pushIssue(errors, `${ownerLabel} has invalid graph ref in ${field}`, hardFails, true);
			continue;
		}
		if (!graphRefExists(ref, runId, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds)) {
			pushIssue(errors, `${ownerLabel} references missing ${formatGraphRef(ref)} in ${field}`, hardFails, true);
			continue;
		}
		validatedRefs.push(ref);
	}
	return validatedRefs;
}
function targetSystemIsPopulated$1(targetSystem) {
	const target = asStringRecord(targetSystem);
	return Array.isArray(target.actors) && target.actors.length > 0 && Array.isArray(target.operator_personas) && target.operator_personas.length > 0 && Array.isArray(target.external_consumer_groups) && target.external_consumer_groups.length > 0 && Array.isArray(target.external_dependencies) && target.external_dependencies.length > 0 && Array.isArray(target.trust_boundaries) && target.trust_boundaries.length > 0 && Array.isArray(target.durable_state_families) && target.durable_state_families.length > 0 && Array.isArray(target.control_surfaces) && target.control_surfaces.length > 0 && Array.isArray(target.failure_domains) && target.failure_domains.length > 0 && Array.isArray(target.team_and_ownership_assumptions) && target.team_and_ownership_assumptions.length > 0 && Array.isArray(target.quality_goals) && target.quality_goals.length > 0 && Array.isArray(target.policy_surfaces) && target.policy_surfaces.length > 0;
}
function asBuiltIsPopulated$1(asBuilt) {
	const built = asStringRecord(asBuilt);
	return Array.isArray(built.deployable_surfaces) && built.deployable_surfaces.length > 0 && Array.isArray(built.services) && built.services.length > 0 && Array.isArray(built.processes) && built.processes.length > 0 && Array.isArray(built.jobs) && built.jobs.length > 0 && Array.isArray(built.apis) && built.apis.length > 0 && Array.isArray(built.event_surfaces) && built.event_surfaces.length > 0 && Array.isArray(built.queues) && built.queues.length > 0 && Array.isArray(built.state_stores) && built.state_stores.length > 0 && Array.isArray(built.deployable_units) && built.deployable_units.length > 0 && Array.isArray(built.ownership_matrix) && built.ownership_matrix.length > 0 && Array.isArray(built.environment_matrix) && built.environment_matrix.length > 0 && Array.isArray(built.ingress_interfaces) && built.ingress_interfaces.length > 0 && Array.isArray(built.egress_interfaces) && built.egress_interfaces.length > 0 && Array.isArray(built.canonical_writers) && built.canonical_writers.length > 0 && Array.isArray(built.trust_boundary_crossings) && built.trust_boundary_crossings.length > 0 && Array.isArray(built.data_classes) && built.data_classes.length > 0 && Array.isArray(built.dependency_classifications) && built.dependency_classifications.length > 0 && Array.isArray(built.vendor_external_owners) && built.vendor_external_owners.length > 0;
}
function trackProofCoverageIsSufficient(coverage) {
	const coverageRecord = asStringRecord(coverage);
	return TRACK_PROOF_COVERAGE_KEYS.every((coverageKey) => coverageRecord[coverageKey] === true);
}
var SAFETY_TRACK_PRIORITY$1 = new Map([
	["minimal-working-system", 0],
	["externally-safe-operationally-supportable", 1],
	["full-target-system", 2]
]);
var SAFETY_ITEM_CLASS_PRIORITY$1 = new Map([
	["control_guardrail", 0],
	["operational_enablement", 1],
	["documentation_support_enablement", 1],
	["capability_seam", 2],
	["feature_slice", 2],
	["migration", 2],
	["retirement", 2],
	["spike_discovery", 2]
]);
var ECONOMIC_TIE_BREAK_GROUPS$1 = [
	["compliance_deadline"],
	["risk_burn_down"],
	["dependency_unlock"],
	["cost_of_delay"],
	["user_value", "ops_pain_reduction"],
	["learning_value"],
	["reversibility"],
	["lead_time_risk"],
	["strategic_fit"]
];
function getSafetyPriority$1(entry) {
	const trackId = entry.track_ref?.id ?? "";
	return [SAFETY_TRACK_PRIORITY$1.get(trackId) ?? Number.MAX_SAFE_INTEGER, trackId === "externally-safe-operationally-supportable" ? SAFETY_ITEM_CLASS_PRIORITY$1.get(entry.item_class ?? "") ?? Number.MAX_SAFE_INTEGER : 0];
}
function compareEconomicPriority$1(left, right) {
	const leftFactors = new Set(asArray(left.economic_factors).filter(isNonEmptyString));
	const rightFactors = new Set(asArray(right.economic_factors).filter(isNonEmptyString));
	for (const factorGroup of ECONOMIC_TIE_BREAK_GROUPS$1) {
		const leftHas = factorGroup.some((factor) => leftFactors.has(factor));
		if (leftHas === factorGroup.some((factor) => rightFactors.has(factor))) continue;
		return leftHas ? -1 : 1;
	}
	return 0;
}
function getIssueEffectiveSeverity(entry) {
	if (entry.resolution_state === "downgraded" && isNonEmptyString(entry.downgraded_severity)) return entry.downgraded_severity;
	return entry.severity ?? "";
}
function scoreSection(id, label, max, score, reason) {
	return {
		id,
		label,
		max,
		score,
		reason
	};
}
function computeScore(backlog, hardFails, errors, warnings, lintFindings, staleProofs, staleItems, staleClaims, missingRequiredReviews, pendingTrackProofReviews, committedClaimsWithoutItems, missingOwners) {
	const sections = [];
	const sourceAuthorityScore = backlog.source_authority.length === 0 ? 0 : hardFails.some((issue) => issue.includes("source")) ? 4 : 10;
	sections.push(scoreSection("truth_model", "Truth model and source authority", 10, sourceAuthorityScore, backlog.source_authority.length === 0 ? "No authoritative sources recorded." : "Source authority ledger is present."));
	const reconstructionScore = targetSystemIsPopulated$1(backlog.target_system) && asBuiltIsPopulated$1(backlog.as_built) ? 10 : targetSystemIsPopulated$1(backlog.target_system) || asBuiltIsPopulated$1(backlog.as_built) ? 5 : 0;
	sections.push(scoreSection("reconstruction", "Whole-system plus as-built reconstruction", 10, reconstructionScore, reconstructionScore === 10 ? "Target and as-built reconstructions are populated." : "Target system or as-built reconstruction is incomplete."));
	const coverageScore = committedClaimsWithoutItems.length === 0 && missingOwners.length === 0 && staleClaims.length === 0 ? 15 : Math.max(0, 15 - committedClaimsWithoutItems.length * 4 - missingOwners.length * 2 - staleClaims.length * 2);
	sections.push(scoreSection("coverage", "Claim coverage and ownership completeness", 15, coverageScore, committedClaimsWithoutItems.length === 0 && missingOwners.length === 0 && staleClaims.length === 0 ? "Committed claims map to owned backlog items and no claim drift remains unresolved." : "Some committed claims are unmapped, stale, or items are missing owners."));
	const ontologyPenalty = errors.filter((error) => error.includes("item_class") || error.includes("track_id") || error.includes("Relation") || error.includes("orphan") || error.includes("belongs_to_track") || error.includes("semantic") || error.includes("trust-boundary") || error.includes("manual/synthetic")).length;
	sections.push(scoreSection("ontology", "Backlog ontology and decomposition quality", 15, Math.max(0, 15 - ontologyPenalty * 2), ontologyPenalty === 0 ? "Item classes and graph relations are coherent." : "Graph semantics still have defects."));
	const nfrPenalty = errors.filter((error) => error.includes("nfr_contract") || error.includes("observability_contract") || error.includes("Quality attribute") || error.includes("Policy decision") || error.includes("trust-boundary") || error.includes("data_class")).length;
	const nfrStructuralPenalty = backlog.quality_attributes.length < 2 ? 6 : 0;
	const nfrScore = Math.max(0, 10 - nfrPenalty - nfrStructuralPenalty);
	sections.push(scoreSection("nfr_policy", "NFR, policy, security, and compliance completeness", 10, nfrScore, nfrScore === 10 ? "NFR, observability, policy, and trust-boundary obligations are explicit and validated." : "NFR, observability, policy, quality-attribute, or trust-boundary obligations are still incomplete."));
	const contractErrors = errors.filter((issue) => issue.includes("compatibility") || issue.includes("migration governance") || issue.includes("canonical_writer") || issue.includes("consumer_impact") || issue.includes("contract/data-changing") || issue.includes("touches_contract") || issue.includes("touches data domain") || issue.includes("cleanup_scope") || issue.includes("dependent_consumers")).length;
	sections.push(scoreSection("contract_governance", "Interface, data, and migration governance", 10, contractErrors === 0 ? 10 : Math.max(0, 10 - contractErrors * 2), contractErrors === 0 ? "Contract-changing work carries compatibility governance." : "Contract or migration governance gaps remain."));
	const readinessPenalty = lintFindings.filter((finding) => finding.includes("estimate_band") || finding.includes("confidence") || finding.includes("acceptance_examples") || finding.includes("readiness")).length + errors.filter((error) => error.includes("Feature slice") || error.includes("readiness_contract") || error.includes("slice_value_kind") || error.includes("dominant_") || error.includes("blast_radius_note") || error.includes("external_lead_time_risk") || error.includes("staffing_skill_constraints") || error.includes("blocked_by_decision_status") || error.includes("generic horizontal title")).length;
	sections.push(scoreSection("planning_readiness", "Planning readiness and acceptance specificity", 10, Math.max(0, 10 - readinessPenalty * 2), readinessPenalty === 0 ? "Planning-horizon items carry readiness details." : "Some items still need readiness detail before planning use."));
	const sequencingErrors = errors.filter((error) => error.includes("depends on unknown item") || error.includes("Roadmap matrix") || error.includes("track proof") || error.includes("track gate")).length;
	const sequencingScore = backlog.items.length > 0 && backlog.roadmap_matrix.length > 0 && sequencingErrors === 0 && backlog.items.some((item) => isNonEmptyString(item.economic_priority_note)) ? 10 : backlog.items.length > 0 && sequencingErrors === 0 ? 7 : 3;
	sections.push(scoreSection("sequencing", "Sequencing, dependency graph, and economics", 10, sequencingScore, sequencingScore >= 7 ? "Dependencies are explicit and at least some economics are recorded." : "Dependency or economics data is still thin."));
	const proofPenalty = staleProofs.length + staleItems.length + hardFails.filter((issue) => issue.includes("rollout") || issue.includes("rollback")).length;
	sections.push(scoreSection("proof_operability", "Proof, rollout, rollback/recovery, and operability", 5, Math.max(0, 5 - proofPenalty), proofPenalty === 0 ? "Proof bundles, freshness, rollout, and recovery data are present." : "Proof freshness, stale items, or rollout data is incomplete."));
	const reviewPenalty = missingRequiredReviews.length + pendingTrackProofReviews.length + warnings.filter((warning) => warning.toLowerCase().includes("review")).length;
	sections.push(scoreSection("review_automation", "Review, drift management, retirement closure, and automation", 5, Math.max(0, 5 - reviewPenalty), reviewPenalty === 0 ? "Required reviews and track-closure reviews are present." : "Review or track-closure coverage is incomplete."));
	return {
		max: 100,
		sections,
		total: sections.reduce((sum, section) => sum + section.score, 0)
	};
}
function acceptanceAtLeast(achieved, target) {
	const rank = (value) => {
		switch (value) {
			case "draft-only": return 0;
			case "planning-grade": return 1;
			case "implementation-grade": return 2;
		}
	};
	return rank(achieved) >= rank(target);
}
function buildAcceptanceState(target, achieved, targetSatisfied, blockingReasons) {
	return {
		target: target === "draft-only" ? "draft-only" : target === "planning-grade" ? "planning-grade" : "implementation-grade",
		achieved: achieved === "draft-only" ? "draft-only" : achieved === "planning-grade" ? "planning-grade" : "implementation-grade",
		target_satisfied: targetSatisfied,
		blocking_reasons: targetSatisfied ? [] : blockingReasons
	};
}
function isProofDimensionNotApplicableAllowed(item, dimensionKey, justification) {
	if (!isNonEmptyString(justification)) return false;
	if (dimensionKey !== "security_trace") return false;
	return !isSecurityDirectlyImpacted([item]);
}
function getScopedItemsForGraphRef(scope, _runId, itemsById, backlog) {
	switch (scope.kind) {
		case "item": {
			const item = itemsById.get(scope.id ?? "");
			return item ? [item] : [];
		}
		case "run": return backlog.items.filter((item) => isNonEmptyString(item.item_id));
		case "track_proof": {
			const trackProof = backlog.track_proofs.find((entry) => entry.track_proof_id === scope.id);
			if (!trackProof?.track_id) return [];
			return backlog.items.filter((item) => item.track_id === trackProof.track_id);
		}
		default: return [];
	}
}
function isRoleDirectlyImpacted(role, scopedItems, targetAcceptance) {
	switch (role) {
		case "product_strategy":
		case "system_architecture":
		case "application_engineering": return true;
		case "qa_release": return targetAcceptance !== "draft-only";
		case "platform_sre":
		case "support_operations": return isRuntimeOrSupportDirectlyImpacted(scopedItems);
		case "security": return isSecurityDirectlyImpacted(scopedItems);
	}
}
function addRequiredRoleScope(requiredRoleScopes, role, scope) {
	const scopeKey = graphRefKey(scope);
	const roleScopes = requiredRoleScopes.get(role) ?? /* @__PURE__ */ new Map();
	roleScopes.set(scopeKey, scope);
	requiredRoleScopes.set(role, roleScopes);
}
function scopeIsWaived(validWaivedScopesByRole, role, scope, runScopeKey) {
	const waivedScopes = validWaivedScopesByRole.get(role);
	if (!waivedScopes) return false;
	return waivedScopes.has(runScopeKey) || waivedScopes.has(graphRefKey(scope));
}
function validateDiscoveryRun(runDirInput) {
	const runDir = path.resolve(runDirInput);
	if (detectLegacyLayout(runDir)) return {
		errors: [legacyLayoutMessage(runDir)],
		legacyLayoutMessage: legacyLayoutMessage(runDir),
		missingArtifacts: [],
		runDir,
		assessment: null,
		warnings: []
	};
	const paths = runPaths(runDir);
	const missingArtifacts = [
		paths.manifest,
		paths.backlog,
		paths.assessment,
		paths.journal
	].filter((filePath) => !fs.existsSync(filePath));
	if (missingArtifacts.length > 0) return {
		errors: [],
		missingArtifacts,
		runDir,
		assessment: null,
		warnings: []
	};
	const manifest = loadJson(paths.manifest);
	const backlog = loadJson(paths.backlog);
	const previousAssessment = loadJson(paths.assessment);
	const errors = [];
	const warnings = [];
	const hardFails = [];
	const lintFindings = [];
	const nextActions = [];
	const backlogRecord = backlog;
	if (manifest.schema_version !== "3") pushIssue(errors, unsupportedSchemaMessage("manifest.json"), hardFails, true);
	if (!PHASE_STATES.includes(manifest.phase_state)) pushIssue(errors, "Invalid phase_state in manifest.json", hardFails, true);
	if (backlog.metadata?.schema_version !== "3") pushIssue(errors, unsupportedSchemaMessage("backlog.json"), hardFails, true);
	if (previousAssessment.schema_version !== "3") pushIssue(errors, unsupportedSchemaMessage("assessment.json"), hardFails, true);
	if (backlog.metadata?.run_id !== manifest.run_id) pushIssue(errors, "manifest.json and backlog.json run_id values do not match", hardFails, true);
	if (typeof manifest.baseline_source_hashes !== "object" || manifest.baseline_source_hashes === null) pushIssue(errors, "manifest.json baseline_source_hashes must be an object", hardFails, true);
	if (typeof manifest.current_source_hashes !== "object" || manifest.current_source_hashes === null) pushIssue(errors, "manifest.json current_source_hashes must be an object", hardFails, true);
	if (typeof manifest.baseline_canonical_hashes !== "object" || manifest.baseline_canonical_hashes === null) pushIssue(errors, "manifest.json baseline_canonical_hashes must be an object", hardFails, true);
	if (typeof manifest.current_canonical_hashes !== "object" || manifest.current_canonical_hashes === null) pushIssue(errors, "manifest.json current_canonical_hashes must be an object", hardFails, true);
	for (const requiredArrayLedger of [
		"source_authority",
		"source_exclusions",
		"value_streams",
		"tracks",
		"track_gates",
		"track_journeys",
		"claims",
		"negative_scope",
		"quality_attributes",
		"policy_decisions",
		"contracts",
		"data_domains",
		"gaps",
		"contradictions",
		"unknowns",
		"uncertainty_to_spike",
		"delivered_lineage_notes",
		"items",
		"relations",
		"proofs",
		"track_proofs",
		"reviews",
		"waivers",
		"roadmap_matrix"
	]) if (!Array.isArray(backlogRecord[requiredArrayLedger])) pushIssue(errors, `backlog.json.${requiredArrayLedger} must be an array`, hardFails, true);
	for (const requiredObjectLedger of [
		"glossary",
		"aliases",
		"id_strategy",
		"target_system",
		"as_built"
	]) if (typeof backlogRecord[requiredObjectLedger] !== "object" || backlogRecord[requiredObjectLedger] === null) pushIssue(errors, `backlog.json.${requiredObjectLedger} must be an object`, hardFails, true);
	const driftState = computeDriftState(manifest, backlog);
	if (backlog.source_authority.length === 0) pushIssue(errors, "No authoritative sources recorded in backlog.json.source_authority", hardFails, true);
	if (!hasOwnEntries(backlog.glossary)) pushIssue(errors, "Glossary must be non-empty", hardFails, true);
	else validateNonEmptyStringRecord(backlog.glossary, "glossary", errors, hardFails);
	if (!hasOwnEntries(backlog.aliases)) pushIssue(errors, "Aliases must be non-empty", hardFails, true);
	else validateAliasRecord(backlog.aliases, "aliases", errors, hardFails);
	if (!hasOwnEntries(backlog.id_strategy)) pushIssue(errors, "ID strategy must be non-empty", hardFails, true);
	else validateNonEmptyStringRecord(backlog.id_strategy, "id_strategy", errors, hardFails);
	const requiredIdStrategyKeys = /* @__PURE__ */ new Set();
	if (backlog.source_authority.length > 0 || backlog.source_exclusions.length > 0) requiredIdStrategyKeys.add("source");
	for (const [ledgerName, idStrategyKey] of [
		["claims", "claim"],
		["negative_scope", "negative_scope"],
		["quality_attributes", "quality_attribute"],
		["policy_decisions", "policy_decision"],
		["contracts", "contract"],
		["data_domains", "data_domain"],
		["gaps", "gap"],
		["contradictions", "contradiction"],
		["unknowns", "unknown"],
		["items", "item"],
		["proofs", "proof"],
		["reviews", "review"],
		["tracks", "track"],
		["value_streams", "value_stream"],
		["track_journeys", "journey"],
		["track_gates", "track_gate"],
		["track_proofs", "track_proof"],
		["waivers", "waiver"]
	]) {
		const ledger = backlog[ledgerName];
		if (Array.isArray(ledger) && ledger.length > 0) requiredIdStrategyKeys.add(idStrategyKey);
	}
	for (const requiredKey of requiredIdStrategyKeys) if (!isNonEmptyString(backlog.id_strategy[requiredKey])) pushIssue(errors, `id_strategy must define ${requiredKey} for the ledger classes used by this run`, hardFails, true);
	const targetSystemRecord = asStringRecord(backlog.target_system);
	for (const field of [
		"actors",
		"operator_personas",
		"external_consumer_groups",
		"external_dependencies",
		"trust_boundaries",
		"durable_state_families",
		"control_surfaces",
		"failure_domains",
		"team_and_ownership_assumptions",
		"quality_goals",
		"policy_surfaces"
	]) requireNonEmptyStringArrayField(targetSystemRecord, field, "target_system", errors, hardFails);
	if (!targetSystemIsPopulated$1(backlog.target_system)) pushIssue(errors, "Target-system reconstruction is incomplete; actors, operators, consumers, trust boundaries, ownership assumptions, quality goals, and policy surfaces must be populated", hardFails, true);
	const asBuiltRecord = asStringRecord(backlog.as_built);
	for (const field of [
		"deployable_surfaces",
		"services",
		"processes",
		"jobs",
		"apis",
		"event_surfaces",
		"queues",
		"state_stores",
		"deployable_units",
		"ownership_matrix",
		"environment_matrix",
		"ingress_interfaces",
		"egress_interfaces",
		"canonical_writers",
		"trust_boundary_crossings",
		"data_classes",
		"vendor_external_owners"
	]) requireNonEmptyStringArrayField(asBuiltRecord, field, "as_built", errors, hardFails);
	for (const field of [
		"synthetic_behaviors",
		"compatibility_only_behaviors",
		"missing_operational_inputs"
	]) validateStringArrayField(asBuiltRecord, field, "as_built", errors, hardFails);
	if (!Array.isArray(asBuiltRecord.dependency_classifications)) pushIssue(errors, "as_built must include dependency_classifications[]", hardFails, true);
	else {
		const dependencyCriticalities = /* @__PURE__ */ new Set();
		const dependencyIds = /* @__PURE__ */ new Set();
		for (const dependency of asBuiltRecord.dependency_classifications) {
			const dependencyRecord = asStringRecord(dependency);
			if (!isNonEmptyString(dependencyRecord.dependency_id)) pushIssue(errors, "as_built dependency classification missing dependency_id", hardFails, true);
			else dependencyIds.add(String(dependencyRecord.dependency_id));
			if (!isNonEmptyString(dependencyRecord.criticality) || !DEPENDENCY_CRITICALITIES.includes(dependencyRecord.criticality)) pushIssue(errors, "as_built dependency classification has invalid criticality", hardFails, true);
			else dependencyCriticalities.add(String(dependencyRecord.criticality));
			if (!isNonEmptyString(dependencyRecord.owner)) pushIssue(errors, "as_built dependency classification missing owner", hardFails, true);
		}
		for (const dependencyId of backlog.target_system.external_dependencies) if (!dependencyIds.has(dependencyId)) pushIssue(errors, `as_built dependency_classifications must cover target_system external dependency ${dependencyId}`, hardFails, true);
		if (asBuiltRecord.dependency_classifications.length > 1 && dependencyCriticalities.size < 2) pushIssue(errors, "as_built dependency_classifications must distinguish criticality across dependencies", hardFails, true);
	}
	if (!asBuiltIsPopulated$1(backlog.as_built)) pushIssue(errors, "As-built reconstruction is incomplete; deployable/runtime surfaces, ownership, environments, dependency classifications, trust-boundary crossings, and vendor ownership must be populated", hardFails, true);
	if (backlog.claims.length === 0) pushIssue(errors, "No architecture claims recorded", hardFails, true);
	if (backlog.items.length === 0) pushIssue(errors, "No backlog items recorded", hardFails, true);
	const sourceIds = /* @__PURE__ */ new Set();
	const sourceById = /* @__PURE__ */ new Map();
	const authoritativePrecedenceBySourceId = /* @__PURE__ */ new Map();
	const authoritativeSourceIdByPrecedence = /* @__PURE__ */ new Map();
	const supersededAuthoritySourceIds = /* @__PURE__ */ new Set();
	const protectedAuthoritativePrecedences = [];
	const declaredItemIds = new Set(backlog.items.filter((item) => isNonEmptyString(item.item_id)).map((item) => item.item_id));
	const declaredItemClassById = new Map(backlog.items.filter((item) => isNonEmptyString(item.item_id) && isNonEmptyString(item.item_class) && ITEM_CLASSES.includes(item.item_class)).map((item) => [item.item_id, item.item_class]));
	for (const source of backlog.source_authority) {
		if (!isNonEmptyString(source.source_id)) {
			pushIssue(errors, "Source authority entry missing source_id", hardFails, true);
			continue;
		}
		if (sourceIds.has(source.source_id)) pushIssue(errors, `Duplicate source_id: ${source.source_id}`, hardFails, true);
		sourceIds.add(source.source_id);
		sourceById.set(source.source_id, source);
		if (!isNonEmptyString(source.ref)) pushIssue(errors, `Source ${source.source_id} is missing ref`, hardFails, true);
		if (source.last_access_status === "inaccessible") pushIssue(errors, `Source ${source.source_id} is not readable from ref ${source.ref ?? "<missing-ref>"}`, hardFails, true);
		if (!isNonEmptyString(source.kind) || !SOURCE_KINDS.includes(source.kind)) pushIssue(errors, `Source ${source.source_id} has invalid kind`, hardFails, true);
		if (!isNonEmptyString(source.authority) || !SOURCE_AUTHORITIES.includes(source.authority)) pushIssue(errors, `Source ${source.source_id} has invalid authority`, hardFails, true);
		if (source.authority === "authoritative_target_truth" || source.authority === "authoritative_current_truth") if (!Number.isInteger(source.precedence) || Number(source.precedence) <= 0) pushIssue(errors, `Source ${source.source_id} must include a positive integer precedence`, hardFails, true);
		else {
			const precedence = Number(source.precedence);
			authoritativePrecedenceBySourceId.set(source.source_id, precedence);
			if (authoritativeSourceIdByPrecedence.has(precedence)) pushIssue(errors, `Duplicate authoritative source precedence ${precedence}: ${authoritativeSourceIdByPrecedence.get(precedence)} and ${source.source_id}`, hardFails, true);
			else authoritativeSourceIdByPrecedence.set(precedence, source.source_id);
			if (source.kind === "architecture_doc" || source.kind === "adr" || source.kind === "delivered_dossier_ssot" || source.kind === "runtime_evidence") protectedAuthoritativePrecedences.push(precedence);
		}
		if (source.authority === "superseded_excluded") supersededAuthoritySourceIds.add(source.source_id);
		if (source.kind === "backlog_text" && (source.authority === "authoritative_target_truth" || source.authority === "authoritative_current_truth")) pushIssue(errors, `Source ${source.source_id} uses backlog_text but is marked authoritative`, hardFails, true);
	}
	const sortedAuthoritativePrecedences = [...authoritativeSourceIdByPrecedence.keys()].sort((left, right) => left - right);
	for (let index = 1; index < sortedAuthoritativePrecedences.length; index += 1) {
		const previous = sortedAuthoritativePrecedences[index - 1];
		const current = sortedAuthoritativePrecedences[index];
		if (current !== void 0 && previous !== void 0 && current - previous > 1) {
			const missingPrecedences = [];
			for (let candidate = previous + 1; candidate < current; candidate += 1) missingPrecedences.push(candidate);
			pushIssue(errors, `Authoritative source precedence has gaps: missing ${missingPrecedences.join(", ")}`, hardFails, true);
		}
	}
	const strongestProtectedPrecedence = protectedAuthoritativePrecedences.length > 0 ? Math.min(...protectedAuthoritativePrecedences) : null;
	if (strongestProtectedPrecedence !== null) {
		for (const source of backlog.source_authority) if (source.kind === "backlog_text" && Number.isInteger(source.precedence) && Number(source.precedence) <= strongestProtectedPrecedence) pushIssue(errors, `Source ${source.source_id} uses backlog_text with precedence ${source.precedence}, which outranks or ties protected architectural truth`, hardFails, true);
	}
	const excludedSourceIds = /* @__PURE__ */ new Set();
	for (const exclusion of backlog.source_exclusions) {
		if (!isNonEmptyString(exclusion.source_id)) {
			pushIssue(errors, "Source exclusion entry missing source_id", hardFails, true);
			continue;
		}
		if (excludedSourceIds.has(exclusion.source_id)) pushIssue(errors, `Duplicate source exclusion source_id: ${exclusion.source_id}`, hardFails, true);
		excludedSourceIds.add(exclusion.source_id);
		if (!isNonEmptyString(exclusion.reason)) pushIssue(errors, `Source exclusion ${exclusion.source_id} is missing reason`, hardFails, true);
		const matchingSourceAuthority = sourceById.get(exclusion.source_id);
		if (!matchingSourceAuthority) pushIssue(errors, `Source exclusion ${exclusion.source_id} has no matching source_authority entry`, hardFails, true);
		if (matchingSourceAuthority && matchingSourceAuthority.authority !== "superseded_excluded") pushIssue(errors, `Source exclusion ${exclusion.source_id} conflicts with source_authority entry that is not superseded_excluded`, hardFails, true);
		const supersededBy = asArray(exclusion.superseded_by);
		if (supersededBy.length === 0) pushIssue(errors, `Source exclusion ${exclusion.source_id} must include superseded_by[]`, hardFails, true);
		for (const supersedingSourceId of supersededBy) {
			if (!sourceIds.has(supersedingSourceId)) pushIssue(errors, `Source exclusion ${exclusion.source_id} references unknown superseding source ${supersedingSourceId}`, hardFails, true);
			if (supersedingSourceId === exclusion.source_id) pushIssue(errors, `Source exclusion ${exclusion.source_id} cannot supersede itself`, hardFails, true);
		}
	}
	for (const sourceId of supersededAuthoritySourceIds) if (!excludedSourceIds.has(sourceId)) pushIssue(errors, `Source ${sourceId} is marked superseded_excluded but has no matching source_exclusions entry`, hardFails, true);
	const valueStreamIds = /* @__PURE__ */ new Set();
	for (const valueStream of backlog.value_streams) {
		if (!isNonEmptyString(valueStream.value_stream_id)) {
			pushIssue(errors, "Value stream missing value_stream_id", hardFails, true);
			continue;
		}
		if (valueStreamIds.has(valueStream.value_stream_id)) pushIssue(errors, `Duplicate value_stream_id: ${valueStream.value_stream_id}`, hardFails, true);
		valueStreamIds.add(valueStream.value_stream_id);
		if (!isNonEmptyString(valueStream.title)) pushIssue(errors, `Value stream ${valueStream.value_stream_id} missing title`, hardFails, true);
	}
	const trackIds = /* @__PURE__ */ new Set();
	for (const track of backlog.tracks) {
		if (!isNonEmptyString(track.track_id)) {
			pushIssue(errors, "Track missing track_id", hardFails, true);
			continue;
		}
		if (trackIds.has(track.track_id)) pushIssue(errors, `Duplicate track_id: ${track.track_id}`, hardFails, true);
		trackIds.add(track.track_id);
		if (!isNonEmptyString(track.title)) pushIssue(errors, `Track ${track.track_id} missing title`, hardFails, true);
		if (!isNonEmptyString(track.description)) pushIssue(errors, `Track ${track.track_id} missing description`, hardFails, true);
		if (!isNonEmptyString(track.closure_goal)) pushIssue(errors, `Track ${track.track_id} missing closure_goal`, hardFails, true);
		if (!isNonEmptyString(track.backlog_protocol_state) || !BACKLOG_PROTOCOL_STATES.includes(track.backlog_protocol_state)) pushIssue(errors, `Track ${track.track_id} has invalid backlog_protocol_state`, hardFails, true);
		if (!isNonEmptyString(track.delivery_state) || !DELIVERY_STATES.includes(track.delivery_state)) pushIssue(errors, `Track ${track.track_id} has invalid delivery_state`, hardFails, true);
		if (!isNonEmptyString(track.readiness_state) || !READINESS_STATES.includes(track.readiness_state)) pushIssue(errors, `Track ${track.track_id} has invalid readiness_state`, hardFails, true);
		if (!isNonEmptyString(track.closure_state) || !ITEM_CLOSURE_STATES.includes(track.closure_state)) pushIssue(errors, `Track ${track.track_id} has invalid closure_state`, hardFails, true);
		if (!isNonEmptyString(track.summary_label) || !SUMMARY_LABELS.includes(track.summary_label)) pushIssue(errors, `Track ${track.track_id} has invalid summary_label`, hardFails, true);
		if (!Array.isArray(track.first_shippable_journey_ids)) pushIssue(errors, `Track ${track.track_id} must include first_shippable_journey_ids[]`, hardFails, true);
		if (!Array.isArray(track.required_track_gate_ids)) pushIssue(errors, `Track ${track.track_id} must include required_track_gate_ids[]`, hardFails, true);
		if (!Array.isArray(track.track_proof_refs)) pushIssue(errors, `Track ${track.track_id} must include track_proof_refs[]`, hardFails, true);
		if (REQUIRED_TRACK_IDS.has(track.track_id)) {
			if (asArray(track.first_shippable_journey_ids).length === 0) pushIssue(errors, `Required track ${track.track_id} must link at least one first_shippable_journey_id`, hardFails, true);
			if (asArray(track.required_track_gate_ids).length === 0) pushIssue(errors, `Required track ${track.track_id} must link at least one required_track_gate_id`, hardFails, true);
			if (asArray(track.track_proof_refs).length === 0) pushIssue(errors, `Required track ${track.track_id} must link at least one track_proof_ref`, hardFails, true);
		}
	}
	for (const trackId of REQUIRED_TRACK_IDS) if (!trackIds.has(trackId)) pushIssue(errors, `Required closure track missing: ${trackId}`, hardFails, true);
	if (backlog.track_journeys.length > 0 && backlog.value_streams.length === 0) pushIssue(errors, "At least one value stream must exist when track_journeys are present", hardFails, true);
	const linkedTrackIdsByValueStreamId = /* @__PURE__ */ new Map();
	for (const valueStream of backlog.value_streams) {
		if (!isNonEmptyString(valueStream.value_stream_id)) continue;
		const valueStreamLabel = `Value stream ${valueStream.value_stream_id}`;
		if (!isNonEmptyString(valueStream.description)) pushIssue(errors, `${valueStreamLabel} missing description`, hardFails, true);
		requireNonEmptyStringArrayField(asStringRecord(valueStream), "primary_personas", valueStreamLabel, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(valueStream), "initiating_triggers", valueStreamLabel, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(valueStream), "workflow_steps", valueStreamLabel, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(valueStream), "success_conditions", valueStreamLabel, errors, hardFails);
		const linkedTrackIds = requireNonEmptyStringArrayField(asStringRecord(valueStream), "linked_track_ids", valueStreamLabel, errors, hardFails);
		if (!isNonEmptyString(valueStream.support_handoff)) pushIssue(errors, `${valueStreamLabel} missing support_handoff`, hardFails, true);
		linkedTrackIdsByValueStreamId.set(valueStream.value_stream_id, linkedTrackIds);
		for (const linkedTrackId of linkedTrackIds) if (!trackIds.has(linkedTrackId)) pushIssue(errors, `${valueStreamLabel} references unknown linked track ${linkedTrackId}`, hardFails, true);
	}
	for (const track of backlog.tracks) {
		if (!isNonEmptyString(track.track_id)) continue;
		const linkedToValueStream = backlog.value_streams.some((valueStream) => asArray(valueStream.linked_track_ids).includes(track.track_id));
		if (asArray(track.first_shippable_journey_ids).length > 0 && !linkedToValueStream) pushIssue(errors, `Track ${track.track_id} does not map to any value stream`, hardFails, true);
	}
	const journeyIds = /* @__PURE__ */ new Set();
	for (const journey of backlog.track_journeys) {
		if (!isNonEmptyString(journey.journey_id)) {
			pushIssue(errors, "Track journey missing journey_id", hardFails, true);
			continue;
		}
		if (journeyIds.has(journey.journey_id)) pushIssue(errors, `Duplicate journey_id: ${journey.journey_id}`, hardFails, true);
		journeyIds.add(journey.journey_id);
		if (!isNonEmptyString(journey.track_id) || !trackIds.has(journey.track_id)) pushIssue(errors, `Track journey ${journey.journey_id} has invalid track_id`, hardFails, true);
		if (!isNonEmptyString(journey.value_stream_id) || !valueStreamIds.has(journey.value_stream_id)) pushIssue(errors, `Track journey ${journey.journey_id} has invalid value_stream_id`, hardFails, true);
		if (isNonEmptyString(journey.track_id) && trackIds.has(journey.track_id) && isNonEmptyString(journey.value_stream_id) && valueStreamIds.has(journey.value_stream_id)) {
			if (!(linkedTrackIdsByValueStreamId.get(journey.value_stream_id) ?? []).includes(journey.track_id)) pushIssue(errors, `Track journey ${journey.journey_id} points to value stream ${journey.value_stream_id} but that value stream is not linked to track ${journey.track_id}`, hardFails, true);
		}
		if (!isNonEmptyString(journey.persona)) pushIssue(errors, `Track journey ${journey.journey_id} missing persona`, hardFails, true);
		if (!isNonEmptyString(journey.trigger)) pushIssue(errors, `Track journey ${journey.journey_id} missing trigger`, hardFails, true);
		requireNonEmptyStringArrayField(asStringRecord(journey), "workflow_steps", `Track journey ${journey.journey_id}`, errors, hardFails);
		if (!isNonEmptyString(journey.success_condition)) pushIssue(errors, `Track journey ${journey.journey_id} missing success_condition`, hardFails, true);
		if (!isNonEmptyString(journey.support_handoff)) pushIssue(errors, `Track journey ${journey.journey_id} missing support_handoff`, hardFails, true);
	}
	for (const trackId of REQUIRED_TRACK_IDS) {
		if (backlog.track_journeys.filter((journey) => journey.track_id === trackId).length === 0) pushIssue(errors, `Required track ${trackId} must resolve to at least one track journey`, hardFails, true);
		if (backlog.value_streams.filter((valueStream) => asArray(valueStream.linked_track_ids).includes(trackId)).length === 0) pushIssue(errors, `Required track ${trackId} must map to at least one value stream`, hardFails, true);
	}
	const trackGateIds = /* @__PURE__ */ new Set();
	const trackGateFailures = [];
	for (const gate of backlog.track_gates) {
		if (!isNonEmptyString(gate.track_gate_id)) {
			pushIssue(errors, "Track gate missing track_gate_id", hardFails, true);
			continue;
		}
		if (trackGateIds.has(gate.track_gate_id)) pushIssue(errors, `Duplicate track_gate_id: ${gate.track_gate_id}`, hardFails, true);
		trackGateIds.add(gate.track_gate_id);
		if (!isNonEmptyString(gate.track_id) || !trackIds.has(gate.track_id)) pushIssue(errors, `Track gate ${gate.track_gate_id} has invalid track_id`, hardFails, true);
		if (!isNonEmptyString(gate.title)) pushIssue(errors, `Track gate ${gate.track_gate_id} missing title`, hardFails, true);
		if (!isNonEmptyString(gate.description)) pushIssue(errors, `Track gate ${gate.track_gate_id} missing description`, hardFails, true);
		if (!isNonEmptyString(gate.gate_type)) pushIssue(errors, `Track gate ${gate.track_gate_id} missing gate_type`, hardFails, true);
		if (!isNonEmptyString(gate.fail_mode) || !["fail_open", "fail_closed"].includes(gate.fail_mode)) pushIssue(errors, `Track gate ${gate.track_gate_id} has invalid fail_mode`, hardFails, true);
		const ownerRefs = requireNonEmptyStringArrayField(asStringRecord(gate), "owner_refs", `Track gate ${gate.track_gate_id}`, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(gate), "required_proof_refs", `Track gate ${gate.track_gate_id}`, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(gate), "applies_to_journey_ids", `Track gate ${gate.track_gate_id}`, errors, hardFails);
		requireNonEmptyStringArrayField(asStringRecord(gate), "recalculation_triggers", `Track gate ${gate.track_gate_id}`, errors, hardFails);
		const governingControlRefs = gate.fail_mode === "fail_closed" || gate.gate_type === "safety" ? requireNonEmptyStringArrayField(asStringRecord(gate), "governing_control_item_refs", `Track gate ${gate.track_gate_id}`, errors, hardFails) : validateStringArrayField(asStringRecord(gate), "governing_control_item_refs", `Track gate ${gate.track_gate_id}`, errors, hardFails);
		for (const controlItemRef of governingControlRefs) {
			if (!declaredItemIds.has(controlItemRef)) {
				pushIssue(errors, `Track gate ${gate.track_gate_id} references unknown governing control item ${controlItemRef}`, hardFails, true);
				continue;
			}
			if (declaredItemClassById.get(controlItemRef) !== "control_guardrail") pushIssue(errors, `Track gate ${gate.track_gate_id} governing control ${controlItemRef} must be a control_guardrail`, hardFails, true);
		}
		if (ownerRefs.length === 0 || gate.fail_mode === "fail_closed" && governingControlRefs.length === 0) trackGateFailures.push(gate.track_gate_id);
	}
	const claimIds = /* @__PURE__ */ new Set();
	const committedClaimIds = /* @__PURE__ */ new Set();
	const controlObligationClaimIds = /* @__PURE__ */ new Set();
	const decommissionNeedClaimIds = /* @__PURE__ */ new Set();
	for (const claim of backlog.claims) {
		if (!isNonEmptyString(claim.claim_id)) {
			pushIssue(errors, "Architecture claim missing claim_id", hardFails, true);
			continue;
		}
		if (claimIds.has(claim.claim_id)) pushIssue(errors, `Duplicate claim_id: ${claim.claim_id}`, hardFails, true);
		claimIds.add(claim.claim_id);
		if (!isNonEmptyString(claim.claim_class) || !CLAIM_CLASSES.includes(claim.claim_class)) pushIssue(errors, `Claim ${claim.claim_id} has invalid claim_class`, hardFails, true);
		if (!isNonEmptyString(claim.commitment) || !CLAIM_COMMITMENTS.includes(claim.commitment)) pushIssue(errors, `Claim ${claim.claim_id} has invalid commitment`, hardFails, true);
		if (claim.commitment === "committed") committedClaimIds.add(claim.claim_id);
		if (claim.claim_class === "control_obligation") controlObligationClaimIds.add(claim.claim_id);
		if (claim.claim_class === "retirement") decommissionNeedClaimIds.add(claim.claim_id);
		if ((claim.commitment === "deferred" || claim.commitment === "optional") && !isNonEmptyString(claim.revisit_trigger)) pushIssue(errors, `Claim ${claim.claim_id} is ${claim.commitment} but missing revisit_trigger`, hardFails, true);
		validateSourceRefs(claim.source_refs, `Claim ${claim.claim_id}`, sourceIds, excludedSourceIds, errors, hardFails);
	}
	const contractIds = /* @__PURE__ */ new Set();
	for (const contract of backlog.contracts) {
		if (!isNonEmptyString(contract.contract_id)) {
			pushIssue(errors, "Contract ledger entry missing contract_id", hardFails, true);
			continue;
		}
		if (contractIds.has(contract.contract_id)) pushIssue(errors, `Duplicate contract_id: ${contract.contract_id}`, hardFails, true);
		contractIds.add(contract.contract_id);
		if (!isNonEmptyString(contract.title)) pushIssue(errors, `Contract ${contract.contract_id} missing title`, hardFails, true);
		if (!isNonEmptyString(contract.owner)) pushIssue(errors, `Contract ${contract.contract_id} missing owner`, hardFails, true);
		if (!isNonEmptyString(contract.versioning_strategy)) pushIssue(errors, `Contract ${contract.contract_id} missing versioning_strategy`, hardFails, true);
		if (!isNonEmptyString(contract.reconciliation_strategy)) pushIssue(errors, `Contract ${contract.contract_id} missing reconciliation_strategy`, hardFails, true);
		if (!isNonEmptyString(contract.deprecation_window)) pushIssue(errors, `Contract ${contract.contract_id} missing deprecation_window`, hardFails, true);
		if (!isNonEmptyString(contract.retirement_condition)) pushIssue(errors, `Contract ${contract.contract_id} missing retirement_condition`, hardFails, true);
	}
	const dataDomainIds = /* @__PURE__ */ new Set();
	for (const domain of backlog.data_domains) {
		if (!isNonEmptyString(domain.domain_id)) {
			pushIssue(errors, "Data-domain entry missing domain_id", hardFails, true);
			continue;
		}
		if (dataDomainIds.has(domain.domain_id)) pushIssue(errors, `Duplicate data domain id: ${domain.domain_id}`, hardFails, true);
		dataDomainIds.add(domain.domain_id);
		if (!isNonEmptyString(domain.title)) pushIssue(errors, `Data domain ${domain.domain_id} missing title`, hardFails, true);
		if (!isNonEmptyString(domain.data_class)) pushIssue(errors, `Data domain ${domain.domain_id} missing data_class`, hardFails, true);
		requireNonEmptyStringArrayField(domain, "owners", `Data domain ${domain.domain_id}`, errors, hardFails);
	}
	const proofIds = /* @__PURE__ */ new Set();
	const proofCoveredRefById = /* @__PURE__ */ new Map();
	const staleProofs = new Set(driftState.deltaSummary.stale_proof_ids);
	for (const proof of backlog.proofs) {
		if (!isNonEmptyString(proof.proof_id)) {
			pushIssue(errors, "Proof bundle missing proof_id", hardFails, true);
			continue;
		}
		if (proofIds.has(proof.proof_id)) pushIssue(errors, `Duplicate proof_id: ${proof.proof_id}`, hardFails, true);
		proofIds.add(proof.proof_id);
		if (!isNonEmptyString(proof.environment)) pushIssue(errors, `Proof ${proof.proof_id} missing environment`, hardFails, true);
		if (!isGraphRef(proof.covered_ref)) pushIssue(errors, `Proof ${proof.proof_id} missing covered_ref`, hardFails, true);
		else proofCoveredRefById.set(proof.proof_id, proof.covered_ref);
		if (!isNonEmptyString(proof.covered_commit_or_build)) pushIssue(errors, `Proof ${proof.proof_id} missing covered_commit_or_build`, hardFails, true);
		if (!isNonEmptyString(proof.executed_at) || parseTimestamp(proof.executed_at) === null) pushIssue(errors, `Proof ${proof.proof_id} missing a valid executed_at`, hardFails, true);
		if (!isNonEmptyString(proof.freshness_rule)) pushIssue(errors, `Proof ${proof.proof_id} missing freshness_rule`, hardFails, true);
		const invalidatedBy = asArray(proof.invalidated_by);
		if (invalidatedBy.length === 0) pushIssue(errors, `Proof ${proof.proof_id} missing invalidated_by`, hardFails, true);
		else for (const cause of invalidatedBy) if (![
			"source_change",
			"contract_change",
			"topology_change",
			"track_gate_change"
		].includes(cause)) pushIssue(errors, `Proof ${proof.proof_id} has invalid invalidated_by cause ${cause}`, hardFails, true);
		if (typeof proof.dimensions !== "object" || proof.dimensions === null) pushIssue(errors, `Proof ${proof.proof_id} missing dimensions`, hardFails, true);
		else for (const dimensionKey of PROOF_DIMENSION_KEYS) {
			const dimension = asStringRecord(proof.dimensions[dimensionKey]);
			if (!isNonEmptyString(dimension.status) || ![
				"present",
				"missing",
				"not_applicable"
			].includes(dimension.status)) {
				pushIssue(errors, `Proof ${proof.proof_id} has invalid ${dimensionKey} status`, hardFails, true);
				continue;
			}
			if (dimension.status === "missing") pushIssue(errors, `Proof ${proof.proof_id} dimension ${dimensionKey} may not remain missing`, hardFails, true);
			if (dimension.status === "present" && !isNonEmptyString(dimension.command) && !isNonEmptyString(dimension.artifact) && !isNonEmptyString(dimension.procedure)) pushIssue(errors, `Proof ${proof.proof_id} dimension ${dimensionKey} must include command, artifact, or procedure when present`, hardFails, true);
			if (dimension.status === "not_applicable" && !isNonEmptyString(dimension.justification)) pushIssue(errors, `Proof ${proof.proof_id} dimension ${dimensionKey} must include justification when not_applicable`, hardFails, true);
			if (dimension.status === "not_applicable" && dimensionKey !== "security_trace") pushIssue(errors, `Proof ${proof.proof_id} dimension ${dimensionKey} may not be not_applicable`, hardFails, true);
		}
		const freshUntil = parseTimestamp(proof.fresh_until ?? null);
		if (freshUntil !== null && freshUntil < Date.now()) {
			staleProofs.add(proof.proof_id);
			lintFindings.push(`Proof ${proof.proof_id} is stale.`);
			hardFails.push(`Proof ${proof.proof_id} is stale.`);
		}
	}
	const trackProofIds = /* @__PURE__ */ new Set();
	const trackProofIdToTrackId = /* @__PURE__ */ new Map();
	for (const trackProof of backlog.track_proofs) {
		if (!isNonEmptyString(trackProof.track_proof_id)) {
			pushIssue(errors, "Track proof missing track_proof_id", hardFails, true);
			continue;
		}
		if (trackProofIds.has(trackProof.track_proof_id)) pushIssue(errors, `Duplicate track_proof_id: ${trackProof.track_proof_id}`, hardFails, true);
		const trackProofId = trackProof.track_proof_id;
		trackProofIds.add(trackProof.track_proof_id);
		if (!isNonEmptyString(trackProof.track_id) || !trackIds.has(trackProof.track_id)) pushIssue(errors, `Track proof ${trackProof.track_proof_id} has invalid track_id`, hardFails, true);
		else trackProofIdToTrackId.set(trackProofId, trackProof.track_id);
		if (!Array.isArray(trackProof.proof_refs)) pushIssue(errors, `Track proof ${trackProof.track_proof_id} must include proof_refs[]`, hardFails, true);
		else if (trackProof.proof_refs.length === 0) pushIssue(errors, `Track proof ${trackProof.track_proof_id} must include at least one proof_ref`, hardFails, true);
		if (typeof trackProof.coverage !== "object" || trackProof.coverage === null) pushIssue(errors, `Track proof ${trackProof.track_proof_id} must include coverage`, hardFails, true);
		else {
			const coverageRecord = asStringRecord(trackProof.coverage);
			for (const coverageKey of TRACK_PROOF_COVERAGE_KEYS) if (typeof coverageRecord[coverageKey] !== "boolean") pushIssue(errors, `Track proof ${trackProof.track_proof_id} must include boolean coverage.${coverageKey}`, hardFails, true);
			if (!trackProofCoverageIsSufficient(trackProof.coverage)) pushIssue(errors, `Track proof ${trackProof.track_proof_id} must prove all track-level closure coverage dimensions`, hardFails, true);
		}
		for (const proofRef of asArray(trackProof.proof_refs)) if (!proofIds.has(proofRef)) pushIssue(errors, `Track proof ${trackProof.track_proof_id} references unknown proof ${proofRef}`, hardFails, true);
		if (!asArray(trackProof.proof_refs).some((proofRef) => relationRefEquals(proofCoveredRefById.get(proofRef) ?? null, graphRef("track_proof", trackProofId)))) pushIssue(errors, `Track proof ${trackProofId} must be backed by at least one proof whose covered_ref points to the track_proof`, hardFails, true);
	}
	for (const track of backlog.tracks) {
		for (const journeyId of asArray(track.first_shippable_journey_ids)) if (!journeyIds.has(journeyId)) pushIssue(errors, `Track ${track.track_id} references unknown journey ${journeyId}`, hardFails, true);
		for (const trackGateId of asArray(track.required_track_gate_ids)) if (!trackGateIds.has(trackGateId)) pushIssue(errors, `Track ${track.track_id} references unknown track gate ${trackGateId}`, hardFails, true);
		for (const trackProofRef of asArray(track.track_proof_refs)) if (!trackProofIds.has(trackProofRef)) pushIssue(errors, `Track ${track.track_id} references unknown track proof ${trackProofRef}`, hardFails, true);
		if (REQUIRED_TRACK_IDS.has(track.track_id)) {
			for (const trackGateId of asArray(track.required_track_gate_ids)) {
				const gate = backlog.track_gates.find((candidate) => candidate.track_gate_id === trackGateId);
				if (!gate || gate.track_id !== track.track_id) pushIssue(errors, `Required track ${track.track_id} must resolve track gate ${trackGateId} to the same track`, hardFails, true);
			}
			for (const trackProofRef of asArray(track.track_proof_refs)) {
				const trackProof = backlog.track_proofs.find((candidate) => candidate.track_proof_id === trackProofRef);
				if (!trackProof || trackProof.track_id !== track.track_id) pushIssue(errors, `Required track ${track.track_id} must resolve track proof ${trackProofRef} to the same track`, hardFails, true);
			}
		}
	}
	for (const gate of backlog.track_gates) {
		if (!isNonEmptyString(gate.track_gate_id)) continue;
		for (const journeyId of asArray(gate.applies_to_journey_ids)) if (!journeyIds.has(journeyId)) pushIssue(errors, `Track gate ${gate.track_gate_id} references unknown journey ${journeyId}`, hardFails, true);
		for (const proofRef of asArray(gate.required_proof_refs)) {
			if (!proofIds.has(proofRef)) {
				pushIssue(errors, `Track gate ${gate.track_gate_id} references unknown proof ${proofRef}`, hardFails, true);
				if (gate.fail_mode === "fail_closed") trackGateFailures.push(gate.track_gate_id);
				continue;
			}
			if (staleProofs.has(proofRef) && gate.fail_mode === "fail_closed") {
				pushIssue(errors, `Track gate ${gate.track_gate_id} is fail_closed but proof ${proofRef} is stale`, hardFails, true);
				trackGateFailures.push(gate.track_gate_id);
			}
		}
		if (driftState.deltaSummary.track_gate_ids_to_recalculate.includes(gate.track_gate_id)) {
			const message = `Track gate ${gate.track_gate_id} requires recalculation due to detected drift`;
			if (gate.fail_mode === "fail_closed") {
				pushIssue(errors, message, hardFails, true);
				trackGateFailures.push(gate.track_gate_id);
			} else warnings.push(message);
		}
	}
	const reviewIds = /* @__PURE__ */ new Set();
	const reviewFindingIds = /* @__PURE__ */ new Set();
	const reviewRoleMap = /* @__PURE__ */ new Map();
	const runReviewRoleMap = /* @__PURE__ */ new Map();
	const trackProofReviewIds = /* @__PURE__ */ new Map();
	for (const review of backlog.reviews) {
		if (!isNonEmptyString(review.review_id)) {
			pushIssue(errors, "Review artifact missing review_id", hardFails, true);
			continue;
		}
		if (reviewIds.has(review.review_id)) pushIssue(errors, `Duplicate review_id: ${review.review_id}`, hardFails, true);
		reviewIds.add(review.review_id);
		if (!isNonEmptyString(review.review_scope) || !REVIEW_SCOPES.includes(review.review_scope)) pushIssue(errors, `Review ${review.review_id} has invalid review_scope`, hardFails, true);
		if (!isGraphRef(review.reviewed_ref)) pushIssue(errors, `Review ${review.review_id} missing reviewed_ref`, hardFails, true);
		if (!isNonEmptyString(review.reviewer)) pushIssue(errors, `Review ${review.review_id} missing reviewer`, hardFails, true);
		if (!isNonEmptyString(review.role) || !REVIEW_ROLES.includes(review.role)) {
			pushIssue(errors, `Review ${review.review_id} has invalid role`, hardFails, true);
			continue;
		}
		if (review.independent !== true) warnings.push(`Review ${review.review_id} for role ${review.role} is not marked independent.`);
		if (!isNonEmptyString(review.verdict) || !REVIEW_VERDICTS.includes(review.verdict)) {
			pushIssue(errors, `Review ${review.review_id} has invalid verdict`, hardFails, true);
			continue;
		}
		if (!Array.isArray(review.evidence_refs) || review.evidence_refs.length === 0) pushIssue(errors, `Review ${review.review_id} missing evidence_refs`, hardFails, true);
		if (typeof review.score_contribution !== "number" || !Number.isFinite(review.score_contribution)) pushIssue(errors, `Review ${review.review_id} missing numeric score_contribution`, hardFails, true);
		if (!isNonEmptyString(review.reviewed_at) || parseTimestamp(review.reviewed_at) === null) pushIssue(errors, `Review ${review.review_id} missing valid reviewed_at`, hardFails, true);
		for (const collectionName of ["findings", "hard_fail_report"]) validateFindingCollection(review.review_id, review[collectionName], collectionName, errors, hardFails, reviewFindingIds);
		if (review.verdict === "fail" && asArray(review.hard_fail_report).length === 0) pushIssue(errors, `Review ${review.review_id} with verdict=fail must include hard_fail_report findings`, hardFails, true);
		if (review.review_scope === "item" && review.reviewed_ref?.kind !== "item") pushIssue(errors, `Review ${review.review_id} must reference an item when review_scope=item`, hardFails, true);
		if (review.review_scope === "run" && review.reviewed_ref?.kind !== "run") pushIssue(errors, `Review ${review.review_id} must reference the run when review_scope=run`, hardFails, true);
		if (review.review_scope === "track_proof" && review.reviewed_ref?.kind !== "track_proof") pushIssue(errors, `Review ${review.review_id} must reference a track_proof when review_scope=track_proof`, hardFails, true);
		const state = reviewRoleMap.get(review.role) ?? {
			independent: false,
			verdicts: []
		};
		state.independent = state.independent || review.independent === true;
		state.verdicts.push(review.verdict);
		reviewRoleMap.set(review.role, state);
		if (review.review_scope === "run") {
			const runState = runReviewRoleMap.get(review.role) ?? {
				independent: false,
				verdicts: []
			};
			runState.independent = runState.independent || review.independent === true;
			runState.verdicts.push(review.verdict);
			runReviewRoleMap.set(review.role, runState);
		}
		if (review.review_scope === "track_proof" && review.reviewed_ref?.kind === "track_proof") {
			const existing = trackProofReviewIds.get(review.reviewed_ref.id ?? "") ?? [];
			existing.push(review.review_id);
			trackProofReviewIds.set(review.reviewed_ref.id ?? "", existing);
		}
	}
	const waiverFindings = [];
	const waiverIds = /* @__PURE__ */ new Set();
	const invalidWaiverIds = /* @__PURE__ */ new Set();
	for (const waiver of backlog.waivers) {
		if (!isNonEmptyString(waiver.waiver_id)) {
			pushIssue(errors, "Waiver entry missing waiver_id", hardFails, true);
			waiverFindings.push("Waiver entry missing waiver_id");
			continue;
		}
		if (waiverIds.has(waiver.waiver_id)) {
			const message = `Duplicate waiver_id: ${waiver.waiver_id}`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		waiverIds.add(waiver.waiver_id);
		if (!isNonEmptyString(waiver.waived_role) || !REVIEW_ROLES.includes(waiver.waived_role)) {
			const message = `Waiver ${waiver.waiver_id} has invalid waived_role`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		if (!isGraphRef(waiver.scope)) {
			const message = `Waiver ${waiver.waiver_id} missing scope`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		if (!isNonEmptyString(waiver.granting_authority)) {
			const message = `Waiver ${waiver.waiver_id} missing granting_authority`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		if (!isNonEmptyString(waiver.rationale)) {
			const message = `Waiver ${waiver.waiver_id} missing rationale`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		if (!isNonEmptyString(waiver.expiry_or_revisit_trigger)) {
			const message = `Waiver ${waiver.waiver_id} missing expiry_or_revisit_trigger`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
		validateStringArrayField(waiver, "impacted_surfaces", `Waiver ${waiver.waiver_id}`, errors, hardFails);
		const waiverScope = isGraphRef(waiver.scope) ? waiver.scope : null;
		if (waiverScope && waiverScope.kind !== "run" && waiverScope.kind !== "item" && waiverScope.kind !== "track_proof") {
			const message = `Waiver ${waiver.waiver_id} has unsupported scope kind ${waiverScope.kind}`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
		}
	}
	const itemIds = /* @__PURE__ */ new Set();
	const itemsById = /* @__PURE__ */ new Map();
	const mappedClaimRefs = /* @__PURE__ */ new Set();
	const itemOriginRefs = /* @__PURE__ */ new Map();
	const missingOwners = [];
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id)) {
			pushIssue(errors, "Item missing item_id", hardFails, true);
			continue;
		}
		if (itemIds.has(item.item_id)) pushIssue(errors, `Duplicate item_id: ${item.item_id}`, hardFails, true);
		itemIds.add(item.item_id);
		itemsById.set(item.item_id, item);
		if (!isNonEmptyString(item.item_class) || !ITEM_CLASSES.includes(item.item_class)) {
			pushIssue(errors, `Item ${item.item_id} has invalid item_class`, hardFails, true);
			continue;
		}
		if (!isNonEmptyString(item.track_id) || !trackIds.has(item.track_id)) pushIssue(errors, `Item ${item.item_id} has invalid track_id`, hardFails, true);
		if (!isNonEmptyString(item.backlog_protocol_state) || !BACKLOG_PROTOCOL_STATES.includes(item.backlog_protocol_state)) pushIssue(errors, `Item ${item.item_id} has invalid backlog_protocol_state`, hardFails, true);
		if (!isNonEmptyString(item.delivery_state) || !DELIVERY_STATES.includes(item.delivery_state)) pushIssue(errors, `Item ${item.item_id} has invalid delivery_state`, hardFails, true);
		if (!isNonEmptyString(item.readiness_state) || !READINESS_STATES.includes(item.readiness_state)) pushIssue(errors, `Item ${item.item_id} has invalid readiness_state`, hardFails, true);
		if (!isNonEmptyString(item.closure_state) || !ITEM_CLOSURE_STATES.includes(item.closure_state)) pushIssue(errors, `Item ${item.item_id} has invalid closure_state`, hardFails, true);
		if (!isNonEmptyString(item.summary_label) || !SUMMARY_LABELS.includes(item.summary_label)) pushIssue(errors, `Item ${item.item_id} has invalid summary_label`, hardFails, true);
		if (item.rollout_mode !== void 0 || item.rollback_class !== void 0 || isNonEmptyString(item.n_a_justification)) pushIssue(errors, `Item ${item.item_id} uses obsolete pre-GA N/A fields; use rollout/recovery applicability plus explicit justification`, hardFails, true);
		const originRefs = asArray(item.origin_ref);
		itemOriginRefs.set(item.item_id, originRefs);
		if (originRefs.length === 0) pushIssue(errors, `Item ${item.item_id} has no origin_ref`, hardFails, true);
		else for (const origin of originRefs) {
			if (!isNonEmptyString(origin.kind) || !ORIGIN_REF_KINDS.includes(origin.kind)) {
				pushIssue(errors, `Item ${item.item_id} has invalid origin_ref kind`, hardFails, true);
				continue;
			}
			if (!isNonEmptyString(origin.ref)) {
				pushIssue(errors, `Item ${item.item_id} has origin_ref without ref`, hardFails, true);
				continue;
			}
		}
		if (!item.owners || !isNonEmptyString(item.owners.decision_owner) || !isNonEmptyString(item.owners.delivery_owner)) {
			pushIssue(errors, `Item ${item.item_id} is missing required owners`, hardFails, true);
			missingOwners.push(item.item_id);
		}
		if (!Array.isArray(item.dependency_refs) && !Array.isArray(item.dependencies)) pushIssue(errors, `Item ${item.item_id} must include dependency_refs[]`, hardFails, true);
		if (!Array.isArray(item.proof_refs) || item.proof_refs.length === 0) pushIssue(errors, `Item ${item.item_id} must include non-empty proof_refs[]`, hardFails, true);
		if (!isNonEmptyString(item.evidence_freshness_sla)) pushIssue(errors, `Item ${item.item_id} missing evidence_freshness_sla`, hardFails, true);
		const adrRefs = Array.isArray(item.adr_refs) ? item.adr_refs : [];
		if (item.adr_refs !== void 0) {
			if (item.adr_refs.length === 0 || item.adr_refs.some((adrRef) => !isNonEmptyString(adrRef))) pushIssue(errors, `Item ${item.item_id} has invalid adr_refs`, hardFails, true);
			if (new Set(adrRefs).size !== adrRefs.length) pushIssue(errors, `Item ${item.item_id} has duplicate adr_refs`, hardFails, true);
		}
		if (ITEM_CLASSES_REQUIRING_ADR_REFS.has(item.item_class) && adrRefs.length === 0) pushIssue(errors, `Item ${item.item_id} must declare adr_refs`, hardFails, true);
		const policyDecisionRefs = Array.isArray(item.policy_decision_refs) ? item.policy_decision_refs : [];
		if (item.policy_decision_refs !== void 0) {
			if (item.policy_decision_refs.length === 0 || item.policy_decision_refs.some((policyDecisionRef) => !isNonEmptyString(policyDecisionRef))) pushIssue(errors, `Item ${item.item_id} has invalid policy_decision_refs`, hardFails, true);
			if (new Set(policyDecisionRefs).size !== policyDecisionRefs.length) pushIssue(errors, `Item ${item.item_id} has duplicate policy_decision_refs`, hardFails, true);
		}
		const actorRoleSet = Array.isArray(item.actor_role_set) ? item.actor_role_set : [];
		if (item.actor_role_set !== void 0) {
			if (item.actor_role_set.length === 0 || item.actor_role_set.some((actorRole) => !isNonEmptyString(actorRole))) pushIssue(errors, `Item ${item.item_id} has invalid actor_role_set`, hardFails, true);
			if (new Set(actorRoleSet).size !== actorRoleSet.length) pushIssue(errors, `Item ${item.item_id} has duplicate actor_role_set entries`, hardFails, true);
		}
		if (ITEM_CLASSES_REQUIRING_ACTOR_ROLE_SET.has(item.item_class) && actorRoleSet.length === 0) pushIssue(errors, `Item ${item.item_id} must declare actor_role_set`, hardFails, true);
		if (isNonEmptyString(item["n_a_justification"])) pushIssue(errors, `Item ${item.item_id} uses obsolete n_a_justification; use applicability plus explicit justification instead`, hardFails, true);
		if (isObsoleteNaShape(item.rollout_mode)) pushIssue(errors, `Item ${item.item_id} uses obsolete rollout_mode=n_a`, hardFails, true);
		if (isObsoleteNaShape(item.rollback_class)) pushIssue(errors, `Item ${item.item_id} uses obsolete rollback_class=n_a`, hardFails, true);
		const unexpectedPayloadKeys = getUnexpectedPayloadKeys(item);
		if (unexpectedPayloadKeys.length > 0) pushIssue(errors, `Item ${item.item_id} mixes semantic payload keys not allowed for ${item.item_class}: ${unexpectedPayloadKeys.join(", ")}`, hardFails, true);
		const allowedOriginKinds = ORIGIN_KINDS_BY_CLASS[item.item_class];
		if (![...new Set(originRefs.filter((origin) => isNonEmptyString(origin.kind) && isNonEmptyString(origin.ref)).map((origin) => origin.kind))].some((originKind) => allowedOriginKinds.has(originKind))) pushIssue(errors, `Item ${item.item_id} must be backed by ${[...allowedOriginKinds].join(", ")} for class ${item.item_class}`, hardFails, true);
		const valueRecord = getValueRecord(item);
		for (const field of [
			"persona_or_operator_served",
			"product_or_operator_value",
			"why_now"
		]) if (valueRecord[field] !== void 0 && !isNonEmptyString(valueRecord[field])) pushIssue(errors, `Item ${item.item_id} has invalid value.${field}`, hardFails, true);
		if (ITEM_CLASSES_REQUIRING_VALUE_DESCRIPTOR.has(item.item_class)) {
			for (const field of [
				"persona_or_operator_served",
				"product_or_operator_value",
				"why_now"
			]) if (!isNonEmptyString(valueRecord[field])) pushIssue(errors, `Item ${item.item_id} missing value.${field}`, hardFails, true);
		}
		if (isNonEmptyString(valueRecord.persona_or_operator_served) && actorRoleSet.length > 0 && !actorRoleSet.includes(valueRecord.persona_or_operator_served)) pushIssue(errors, `Item ${item.item_id} actor_role_set must include value.persona_or_operator_served`, hardFails, true);
		const sliceValueKind = valueRecord.slice_value_kind;
		if (sliceValueKind !== void 0 && (!isNonEmptyString(sliceValueKind) || ![
			"user_value",
			"risk_retirement",
			"control_closure"
		].includes(String(sliceValueKind)))) pushIssue(errors, `Item ${item.item_id} has invalid slice_value_kind`, hardFails, true);
		if (item.item_class === "feature_slice") {
			if (!isNonEmptyString(getPlanningString(item, "external_lead_time_risk"))) pushIssue(errors, `Feature slice ${item.item_id} missing external_lead_time_risk`, hardFails, true);
			if (!isNonEmptyString(getPlanningString(item, "staffing_skill_constraints"))) pushIssue(errors, `Feature slice ${item.item_id} missing staffing_skill_constraints`, hardFails, true);
			if (getPlanningBoolean(item, "blocked_by_decision_status") === null) pushIssue(errors, `Feature slice ${item.item_id} missing blocked_by_decision_status`, hardFails, true);
			const dominantUncertainty = getPlanningString(item, "dominant_uncertainty_class");
			if (!isNonEmptyString(dominantUncertainty) || !UNCERTAINTY_CLASSES.includes(dominantUncertainty)) pushIssue(errors, `Feature slice ${item.item_id} missing valid dominant_uncertainty_class`, hardFails, true);
			const dominantRollbackClass = getPlanningString(item, "dominant_rollback_class");
			if (!isNonEmptyString(dominantRollbackClass) || !ROLLBACK_CLASSES.includes(dominantRollbackClass)) pushIssue(errors, `Feature slice ${item.item_id} missing valid dominant_rollback_class`, hardFails, true);
			if (!isNonEmptyString(getPlanningString(item, "blast_radius_note"))) pushIssue(errors, `Feature slice ${item.item_id} missing blast_radius_note`, hardFails, true);
			if (getPlanningBoolean(item, "unresolved_questions_below_threshold") !== true) pushIssue(errors, `Feature slice ${item.item_id} must declare unresolved_questions_below_threshold=true`, hardFails, true);
			if (!isNonEmptyString(sliceValueKind) || ![
				"user_value",
				"risk_retirement",
				"control_closure"
			].includes(String(sliceValueKind))) pushIssue(errors, `Feature slice ${item.item_id} must declare a valid slice_value_kind`, hardFails, true);
			if (hasGenericSliceTitle(item.title)) pushIssue(errors, `Feature slice ${item.item_id} uses an invalid generic horizontal title`, hardFails, true);
			if (asArray(item.interfaces_touched).length === 0 && asArray(item.data_domains_touched).length === 0 && asArray(item.change_surfaces).length === 0) pushIssue(errors, `Feature slice ${item.item_id} must describe bounded contract, data, or surface impact`, hardFails, true);
		}
		const readinessContract = getReadinessContract(item);
		const allowedReadinessExemptions = READINESS_EXEMPTIONS_BY_CLASS[item.item_class];
		for (const exemptionKey of Object.keys(getContractExemptions(readinessContract))) if (!allowedReadinessExemptions.has(exemptionKey)) pushIssue(errors, `Item ${item.item_id} has invalid readiness exemption ${exemptionKey}`, hardFails, true);
		if (item.readiness_state === "ready") {
			for (const readinessKey of [
				"behavior_described",
				"happy_path_defined",
				"error_paths_defined",
				"acceptance_examples_defined",
				"interface_data_impact_described",
				"nfr_impact_known",
				"security_privacy_impact_known",
				"rollout_defined",
				"recovery_defined",
				"observability_contract_defined",
				"required_proof_defined",
				"docs_support_impact_described",
				"estimate_band_defined",
				"confidence_defined",
				"unresolved_questions_below_threshold"
			]) if (!contractCheckSatisfied(readinessContract, readinessKey, allowedReadinessExemptions).satisfied) pushIssue(errors, `Ready item ${item.item_id} must satisfy readiness_contract.${readinessKey}`, hardFails, true);
		}
		for (const dataDomainId of asArray(item.data_domains_touched)) if (!dataDomainIds.has(dataDomainId)) pushIssue(errors, `Item ${item.item_id} references unknown data domain ${dataDomainId}`, hardFails, true);
		if (itemTouchesTrustBoundary(item)) {
			if (asArray(item.trust_boundaries_crossed).length === 0) pushIssue(errors, `Item ${item.item_id} must declare trust_boundaries_crossed`, hardFails, true);
			if (!isNonEmptyString(item.data_class)) pushIssue(errors, `Item ${item.item_id} must declare data_class for trust-boundary work`, hardFails, true);
			if (asArray(item.data_domains_touched).length === 0) pushIssue(errors, `Item ${item.item_id} must map trust-boundary work to data_domains_touched`, hardFails, true);
			if (!item.owners || asArray(item.owners.consulted_teams).length === 0) pushIssue(errors, `Item ${item.item_id} must declare consulted security/data ownership teams`, hardFails, true);
		}
		if (itemRequiresNfrContract(item)) {
			const nfrContract = getNfrContract(item);
			for (const field of [
				"latency",
				"throughput",
				"concurrency",
				"availability",
				"durability",
				"rpo",
				"rto",
				"cost_budget",
				"privacy_compliance_class",
				"accessibility_localization_duty",
				"auditability_traceability",
				"scalability_envelope"
			]) if (!isNonEmptyString(nfrContract[field])) pushIssue(errors, `Item ${item.item_id} missing nfr_contract.${field}`, hardFails, true);
		}
		if (itemRequiresObservabilityContract(item)) {
			const observabilityContract = getObservabilityContract(item);
			for (const field of [
				"sli_slo",
				"alert_thresholds",
				"audit_requirements",
				"security_controls",
				"privacy_controls",
				"analytics_obligations"
			]) requireNonEmptyStringArrayField(observabilityContract, field, `Item ${item.item_id} observability_contract`, errors, hardFails);
			validateStringArrayField(observabilityContract, "monitoring_evidence_refs", `Item ${item.item_id} observability_contract`, errors, hardFails);
			validateStringArrayField(observabilityContract, "dashboards", `Item ${item.item_id} observability_contract`, errors, hardFails);
			validateStringArrayField(observabilityContract, "runbook_refs", `Item ${item.item_id} observability_contract`, errors, hardFails);
			validateStringArrayField(observabilityContract, "telemetry_signals", `Item ${item.item_id} observability_contract`, errors, hardFails);
			validateStringArrayField(observabilityContract, "residual_exceptions", `Item ${item.item_id} observability_contract`, errors, hardFails);
			if (!("bypass_governance" in observabilityContract)) pushIssue(errors, `Item ${item.item_id} observability_contract must declare bypass_governance`, hardFails, true);
		}
		if (requiresRollout(item)) {
			const rolloutRecord = asStringRecord(item.rollout);
			const rolloutApplicability = getRolloutApplicability(item);
			const rolloutMode = getRolloutMode(item);
			if (!["required", "not_applicable"].includes(rolloutApplicability)) pushIssue(errors, `Item ${item.item_id} has invalid rollout applicability`, hardFails, true);
			else if (rolloutApplicability === "required") {
				if (!isNonEmptyString(rolloutMode) || !ROLLOUT_MODES.includes(rolloutMode)) pushIssue(errors, `Item ${item.item_id} is missing a valid rollout mode`, hardFails, true);
			} else if (!isNonEmptyString(getRolloutJustification(item))) pushIssue(errors, `Item ${item.item_id} uses not_applicable rollout without justification`, hardFails, true);
			else if (![
				"spike_discovery",
				"operational_enablement",
				"documentation_support_enablement"
			].includes(item.item_class)) pushIssue(errors, `Item ${item.item_id} may not mark rollout as not_applicable for class ${item.item_class}`, hardFails, true);
			const temporaryControls = Array.isArray(rolloutRecord.temporary_controls) ? rolloutRecord.temporary_controls : [];
			if ((isNonEmptyString(rolloutRecord.feature_flag) || isNonEmptyString(rolloutRecord.kill_switch)) && temporaryControls.length === 0) lintFindings.push(`Item ${item.item_id} defines feature flag or kill switch without retirement control metadata.`);
			for (const entry of temporaryControls) {
				const temporaryControl = asStringRecord(entry);
				if (!isNonEmptyString(temporaryControl.control_id) || !isNonEmptyString(temporaryControl.description) || !isNonEmptyString(temporaryControl.retirement_owner) || !isNonEmptyString(temporaryControl.retirement_date)) pushIssue(errors, `Item ${item.item_id} rollout temporary control entries must include control_id, description, retirement_owner, and retirement_date`, hardFails, true);
			}
			const recoveryApplicability = getRecoveryApplicability(item);
			const recoveryClass = getRecoveryClass(item);
			if (!["required", "not_applicable"].includes(recoveryApplicability)) pushIssue(errors, `Item ${item.item_id} has invalid recovery applicability`, hardFails, true);
			else if (recoveryApplicability === "required") {
				if (!isNonEmptyString(recoveryClass) || !ROLLBACK_CLASSES.includes(recoveryClass)) pushIssue(errors, `Item ${item.item_id} is missing a valid recovery class`, hardFails, true);
			} else if (!isNonEmptyString(getRecoveryJustification(item))) pushIssue(errors, `Item ${item.item_id} uses not_applicable recovery without justification`, hardFails, true);
			else if (![
				"spike_discovery",
				"operational_enablement",
				"documentation_support_enablement"
			].includes(item.item_class)) pushIssue(errors, `Item ${item.item_id} may not mark recovery as not_applicable for class ${item.item_class}`, hardFails, true);
		}
		if (item.readiness_state === "ready") {
			if (!isNonEmptyString(getItemEstimateBand(item))) lintFindings.push(`Item ${item.item_id} is ready but missing estimate_band.`);
			if (!isNonEmptyString(getItemConfidence(item))) lintFindings.push(`Item ${item.item_id} is ready but missing confidence.`);
		}
		switch (item.item_class) {
			case "capability_seam":
				if (!isNonEmptyString(getPayloadString(item, "capability_added", item.capability_added))) pushIssue(errors, `Capability seam ${item.item_id} missing capability_added`, hardFails, true);
				if (getPayloadStringArray(item, "owner_surfaces", asArray(item.owner_surfaces)).length === 0) pushIssue(errors, `Capability seam ${item.item_id} missing owner_surfaces`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "real_closure_definition", item.real_closure_definition))) pushIssue(errors, `Capability seam ${item.item_id} missing real_closure_definition`, hardFails, true);
				break;
			case "feature_slice":
				if (!isGraphRef(getPayloadGraphRef(item, "parent_seam_ref", "item")) && !isNonEmptyString(item.parent_seam_id)) pushIssue(errors, `Feature slice ${item.item_id} missing parent_seam_id`, hardFails, true);
				if (!isNonEmptyString(getValueRecord(item).persona_or_operator_served) && !isNonEmptyString(item.persona)) pushIssue(errors, `Feature slice ${item.item_id} missing persona`, hardFails, true);
				if (!isNonEmptyString(getValueRecord(item).product_or_operator_value)) pushIssue(errors, `Feature slice ${item.item_id} missing product_or_operator_value`, hardFails, true);
				if (!isNonEmptyString(getValueRecord(item).why_now) && !isNonEmptyString(item.why_now)) pushIssue(errors, `Feature slice ${item.item_id} missing why_now`, hardFails, true);
				if (getPayloadStringArray(item, "acceptance_examples", asArray(item.acceptance_examples)).length === 0) pushIssue(errors, `Feature slice ${item.item_id} missing acceptance_examples`, hardFails, true);
				break;
			case "control_guardrail":
				if (!isNonEmptyString(getPayloadString(item, "control_objective", item.control_objective))) pushIssue(errors, `Control guardrail ${item.item_id} missing control_objective`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "enforcing_surface", item.enforcing_surface))) pushIssue(errors, `Control guardrail ${item.item_id} missing enforcing_surface`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "fail_mode", item.fail_mode))) pushIssue(errors, `Control guardrail ${item.item_id} missing fail_mode`, hardFails, true);
				if (validateStringArrayField(getObservabilityContract(item), "monitoring_evidence_refs", `Control guardrail ${item.item_id} observability_contract`, errors, hardFails).length === 0) pushIssue(errors, `Control guardrail ${item.item_id} missing monitoring_evidence_refs`, hardFails, true);
				if (!("bypass_governance" in getObservabilityContract(item))) pushIssue(errors, `Control guardrail ${item.item_id} missing bypass_governance`, hardFails, true);
				break;
			case "migration": {
				if (!isNonEmptyString(getPayloadString(item, "source_state", item.source_state))) pushIssue(errors, `Migration ${item.item_id} missing source_state`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "target_state", item.target_state))) pushIssue(errors, `Migration ${item.item_id} missing target_state`, hardFails, true);
				const compatibilityClass = getContractGovernance(item).compatibility_class;
				if ((!isNonEmptyString(compatibilityClass) || !COMPATIBILITY_CLASSES.includes(compatibilityClass)) && (!isNonEmptyString(item.compatibility_class) || !COMPATIBILITY_CLASSES.includes(item.compatibility_class))) pushIssue(errors, `Migration ${item.item_id} missing compatibility_class`, hardFails, true);
				const migrationStrategy = getContractGovernance(item).migration_strategy;
				const canonicalWriter = getContractGovernance(item).canonical_writer;
				if (!isNonEmptyString(migrationStrategy) && !isNonEmptyString(item.migration_strategy)) pushIssue(errors, `Migration ${item.item_id} missing migration_strategy`, hardFails, true);
				if (!isNonEmptyString(canonicalWriter) && !isNonEmptyString(item.canonical_writer)) pushIssue(errors, `Migration ${item.item_id} missing canonical_writer`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "stop_go_checkpoint", item.stop_go_checkpoint))) pushIssue(errors, `Migration ${item.item_id} missing stop_go_checkpoint`, hardFails, true);
				if (getPayloadStringArray(item, "cleanup_scope", asArray(item.cleanup_scope)).length === 0) pushIssue(errors, `Migration ${item.item_id} missing cleanup_scope`, hardFails, true);
				break;
			}
			case "retirement": {
				if (!isGraphRef(getPayloadGraphRef(item, "replaces_or_retires_ref", "item")) && !isNonEmptyString(item.replaces_or_retires_ref)) pushIssue(errors, `Retirement ${item.item_id} missing replaces_or_retires_ref`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "retirement_trigger", item.retirement_trigger))) pushIssue(errors, `Retirement ${item.item_id} missing retirement_trigger`, hardFails, true);
				if (getPayloadStringArray(item, "legacy_assets", asArray(item.legacy_assets)).length === 0) pushIssue(errors, `Retirement ${item.item_id} missing legacy_assets`, hardFails, true);
				if (getPayloadStringArray(item, "dependent_consumers", asArray(item.dependent_consumers)).length === 0) pushIssue(errors, `Retirement ${item.item_id} missing dependent_consumers`, hardFails, true);
				const cleanupScope = new Set(getPayloadStringArray(item, "cleanup_scope", asArray(item.cleanup_scope)));
				for (const requiredCleanupTarget of REQUIRED_RETIREMENT_CLEANUP_SCOPE) if (!cleanupScope.has(requiredCleanupTarget)) pushIssue(errors, `Retirement ${item.item_id} cleanup_scope must cover ${requiredCleanupTarget}`, hardFails, true);
				break;
			}
			case "spike_discovery": {
				if (!isNonEmptyString(getPayloadString(item, "uncertainty_class", item.uncertainty_class))) pushIssue(errors, `Spike ${item.item_id} missing uncertainty_class`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "question", item.question))) pushIssue(errors, `Spike ${item.item_id} missing question`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "validation_method", item.validation_method))) pushIssue(errors, `Spike ${item.item_id} missing validation_method`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "expected_artifact", item.expected_artifact))) pushIssue(errors, `Spike ${item.item_id} missing expected_artifact`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "max_duration", item.max_duration))) pushIssue(errors, `Spike ${item.item_id} missing max_duration`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "exit_criteria", item.exit_criteria))) pushIssue(errors, `Spike ${item.item_id} missing exit_criteria`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "kill_criteria", item.kill_criteria))) pushIssue(errors, `Spike ${item.item_id} missing kill_criteria`, hardFails, true);
				if (getPayloadStringArray(item, "follow_on_item_refs", asArray(item.follow_on_item_refs)).length === 0) pushIssue(errors, `Spike ${item.item_id} missing follow_on_item_refs`, hardFails, true);
				for (const doneCheck of [
					"promised_artifact_exists",
					"outcome_recorded",
					"follow_on_items_linked",
					"silent_continuation_blocked"
				]) if (getDoneContractClassCheck(item, doneCheck) === null) pushIssue(errors, `Spike ${item.item_id} done_contract.class_specific_checks.${doneCheck} must be a boolean`, hardFails, true);
				if (getDoneContractClassCheck(item, "follow_on_items_linked") !== true) pushIssue(errors, `Spike ${item.item_id} must machine-check follow_on_items_linked`, hardFails, true);
				if (getDoneContractClassCheck(item, "silent_continuation_blocked") !== true) pushIssue(errors, `Spike ${item.item_id} must machine-check silent_continuation_blocked`, hardFails, true);
				const spikeOutcome = getPayloadString(item, "spike_outcome", isNonEmptyString(item.spike_outcome) ? item.spike_outcome : void 0);
				if (item.closure_state === "closed" || isNonEmptyString(spikeOutcome) && spikeOutcome !== "pending") {
					if (getDoneContractClassCheck(item, "promised_artifact_exists") !== true) pushIssue(errors, `Closed spike ${item.item_id} must machine-check promised_artifact_exists`, hardFails, true);
					if (getDoneContractClassCheck(item, "outcome_recorded") !== true) pushIssue(errors, `Closed spike ${item.item_id} must machine-check outcome_recorded`, hardFails, true);
				}
				break;
			}
			case "operational_enablement":
				if (!isNonEmptyString(getPayloadString(item, "runbook_or_enablement_artifact", item.runbook_or_enablement_artifact))) pushIssue(errors, `Operational enablement ${item.item_id} missing runbook_or_enablement_artifact`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "operational_audience", item.operational_audience))) pushIssue(errors, `Operational enablement ${item.item_id} missing operational_audience`, hardFails, true);
				if (!item.owners || !isNonEmptyString(item.owners.runtime_owner) || !isNonEmptyString(item.owners.escalation_owner)) pushIssue(errors, `Operational enablement ${item.item_id} missing runtime_owner or escalation_owner`, hardFails, true);
				break;
			case "documentation_support_enablement":
				if (!isNonEmptyString(getPayloadString(item, "doc_audience", item.doc_audience))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing doc_audience`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "doc_scope", item.doc_scope))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing doc_scope`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "source_of_truth_artifact", item.source_of_truth_artifact))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing source_of_truth_artifact`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "freshness_update_trigger", item.freshness_update_trigger))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing freshness_update_trigger`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "freshness_update_owner"))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing freshness_update_owner`, hardFails, true);
				if (!isNonEmptyString(getPayloadString(item, "support_handoff_artifact"))) pushIssue(errors, `Documentation/support enablement ${item.item_id} missing support_handoff_artifact`, hardFails, true);
				break;
		}
		const doneContract = getDoneContract(item);
		const allowedDoneExemptions = DONE_EXEMPTIONS_BY_CLASS[item.item_class];
		for (const exemptionKey of Object.keys(getContractExemptions(doneContract))) if (!allowedDoneExemptions.has(exemptionKey)) pushIssue(errors, `Item ${item.item_id} has invalid done exemption ${exemptionKey}`, hardFails, true);
		if (item.closure_state === "closed") {
			for (const doneKey of [
				"code_and_infra_complete",
				"tests_and_verification_complete",
				"dashboards_alerts_traces_logging_present",
				"runbooks_and_support_handoff_present",
				"migration_execution_or_safe_schedule_complete",
				"release_notes_and_docs_updated",
				"flags_and_kill_switches_governed",
				"temporary_mechanism_retirement_recorded"
			]) if (!contractCheckSatisfied(doneContract, doneKey, allowedDoneExemptions).satisfied) pushIssue(errors, `Closed item ${item.item_id} must satisfy done_contract.${doneKey}`, hardFails, true);
			switch (item.item_class) {
				case "feature_slice": {
					for (const check of [
						"end_to_end_acceptance_examples_pass",
						"production_proof_fresh",
						"rollout_and_recovery_rehearsed"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed feature slice ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					if (asArray(item.acceptance_examples).length === 0) pushIssue(errors, `Closed feature slice ${item.item_id} must retain acceptance_examples`, hardFails, true);
					if (asArray(item.proof_refs).some((proofRef) => staleProofs.has(proofRef))) pushIssue(errors, `Closed feature slice ${item.item_id} has stale proof evidence`, hardFails, true);
					const recovery = asStringRecord(item.recovery);
					if ((Array.isArray(recovery.rehearsal_proof_refs) ? recovery.rehearsal_proof_refs.filter((proofRef) => isNonEmptyString(proofRef)) : []).length === 0) pushIssue(errors, `Closed feature slice ${item.item_id} must evidence rehearsal via recovery.rehearsal_proof_refs`, hardFails, true);
					break;
				}
				case "migration":
					for (const check of [
						"migration_executed_or_gated",
						"reconciliation_evidence_exists",
						"old_write_path_status_explicit",
						"rollback_forward_fix_decision_evidenced"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed migration ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					break;
				case "retirement":
					for (const check of [
						"old_path_disabled_or_residual_gate_governed",
						"dependent_assets_removed_or_residual_items",
						"consumer_impact_window_closed_or_governed",
						"cleanup_proof_exists"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed retirement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					break;
				case "control_guardrail":
					for (const check of [
						"canonical_path_enforced",
						"alerting_audit_evidence_exists",
						"bypass_rules_governed",
						"residual_exceptions_recorded"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed control guardrail ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					break;
				case "operational_enablement":
					for (const check of [
						"required_operational_artifacts_exist",
						"ownership_and_escalation_surfaces_current",
						"enablement_proof_fresh"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed operational enablement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					break;
				case "documentation_support_enablement":
					for (const check of [
						"published_to_intended_audience",
						"freshness_owner_assigned",
						"handoff_guidance_linked"
					]) if (getDoneContractClassCheck(item, check) !== true) pushIssue(errors, `Closed documentation/support enablement ${item.item_id} must satisfy done_contract.class_specific_checks.${check}`, hardFails, true);
					break;
			}
		}
		if (item.item_class !== "capability_seam" && (isNonEmptyString(item.capability_added) || asArray(item.owner_surfaces).length > 0 || isNonEmptyString(item.real_closure_definition))) pushIssue(errors, `Item ${item.item_id} mixes capability-seam semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "feature_slice" && (isNonEmptyString(item.parent_seam_id) || asArray(item.acceptance_examples).length > 0 || isNonEmptyString(item.persona))) pushIssue(errors, `Item ${item.item_id} mixes feature-slice semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "control_guardrail" && (isNonEmptyString(item.control_objective) || isNonEmptyString(item.enforcing_surface) || isNonEmptyString(item.fail_mode))) pushIssue(errors, `Item ${item.item_id} mixes control semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "migration" && (isNonEmptyString(item.source_state) || isNonEmptyString(item.target_state) || isNonEmptyString(item.stop_go_checkpoint))) pushIssue(errors, `Item ${item.item_id} mixes migration semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "retirement" && (isNonEmptyString(item.replaces_or_retires_ref) || isNonEmptyString(item.retirement_trigger) || asArray(item.legacy_assets).length > 0 || asArray(item.cleanup_scope).length > 0)) pushIssue(errors, `Item ${item.item_id} mixes retirement semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "spike_discovery" && (isNonEmptyString(item.question) || isNonEmptyString(item.validation_method) || isNonEmptyString(item.expected_artifact) || asArray(item.follow_on_item_refs).length > 0)) pushIssue(errors, `Item ${item.item_id} mixes spike semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "operational_enablement" && (isNonEmptyString(item.runbook_or_enablement_artifact) || isNonEmptyString(item.operational_audience))) pushIssue(errors, `Item ${item.item_id} mixes operational-enablement semantics into ${item.item_class}`, hardFails, true);
		if (item.item_class !== "documentation_support_enablement" && (isNonEmptyString(item.doc_audience) || isNonEmptyString(item.doc_scope) || isNonEmptyString(item.source_of_truth_artifact) || isNonEmptyString(item.freshness_update_trigger))) pushIssue(errors, `Item ${item.item_id} mixes documentation/support semantics into ${item.item_class}`, hardFails, true);
	}
	const externallySafeTrackId = "externally-safe-operationally-supportable";
	const externallySafeItemIds = new Set(backlog.items.filter((item) => item.track_id === externallySafeTrackId && isNonEmptyString(item.item_id)).map((item) => item.item_id));
	for (const gate of backlog.track_gates.filter((candidate) => candidate.track_id === externallySafeTrackId)) {
		if (gate.fail_mode !== "fail_closed") pushIssue(errors, `Externally safe track gate ${gate.track_gate_id} must be fail_closed`, hardFails, true);
		if (isNonEmptyString(gate.track_gate_id) && trackGateFailures.includes(gate.track_gate_id)) pushIssue(errors, `Externally safe track gate ${gate.track_gate_id} is not closed`, hardFails, true);
	}
	for (const issueCollection of [
		backlog.gaps,
		backlog.contradictions,
		backlog.unknowns
	]) for (const entry of issueCollection) if (isNonEmptyString(entry.issue_id) && entry.fail_closed_category === true && asArray(entry.related_item_refs).some((itemRef) => externallySafeItemIds.has(itemRef))) pushIssue(errors, `Externally safe track has unresolved fail-closed issue ${entry.issue_id}`, hardFails, true);
	const negativeScopeIds = /* @__PURE__ */ new Set();
	const negativeScopeByTitle = /* @__PURE__ */ new Map();
	for (const entry of backlog.negative_scope) {
		if (!isNonEmptyString(entry.negative_scope_id)) {
			pushIssue(errors, "Negative scope entry missing negative_scope_id", hardFails, true);
			continue;
		}
		if (negativeScopeIds.has(entry.negative_scope_id)) pushIssue(errors, `Duplicate negative_scope_id: ${entry.negative_scope_id}`, hardFails, true);
		negativeScopeIds.add(entry.negative_scope_id);
		if (!isNonEmptyString(entry.title)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} missing title`, hardFails, true);
		else negativeScopeByTitle.set(entry.title, entry);
		if (!isNonEmptyString(entry.negative_scope_class) || !NEGATIVE_SCOPE_CLASSES.includes(entry.negative_scope_class)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} has invalid negative_scope_class`, hardFails, true);
		validateSourceRefs(entry.source_refs, `Negative scope ${entry.negative_scope_id}`, sourceIds, excludedSourceIds, errors, hardFails);
		validateStringArrayField(entry, "owner_implications", `Negative scope ${entry.negative_scope_id}`, errors, hardFails);
		for (const claimRef of validateStringArrayField(entry, "related_claim_refs", `Negative scope ${entry.negative_scope_id}`, errors, hardFails)) if (!claimIds.has(claimRef)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} references unknown claim ${claimRef}`, hardFails, true);
		for (const itemRef of validateStringArrayField(entry, "related_item_refs", `Negative scope ${entry.negative_scope_id}`, errors, hardFails)) if (!itemIds.has(itemRef)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} references unknown item ${itemRef}`, hardFails, true);
		if (!isNonEmptyString(entry.revisit_trigger)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} missing revisit_trigger`, hardFails, true);
		const criticalPathItemRefs = entry.critical_path_item_refs === void 0 ? [] : validateStringArrayField(entry, "critical_path_item_refs", `Negative scope ${entry.negative_scope_id}`, errors, hardFails);
		for (const itemRef of criticalPathItemRefs) if (!itemIds.has(itemRef)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} references unknown critical_path_item ${itemRef}`, hardFails, true);
		const ownerSeamItemRefs = entry.owner_seam_item_refs === void 0 ? [] : validateStringArrayField(entry, "owner_seam_item_refs", `Negative scope ${entry.negative_scope_id}`, errors, hardFails);
		for (const itemRef of ownerSeamItemRefs) if (!itemIds.has(itemRef)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} references unknown owner_seam_item ${itemRef}`, hardFails, true);
		if (MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES.has(entry.negative_scope_class ?? "")) {
			if (criticalPathItemRefs.length === 0) pushIssue(errors, `Negative scope ${entry.negative_scope_id} must declare critical_path_item_refs for manual/synthetic closure`, hardFails, true);
			if (ownerSeamItemRefs.length === 0) pushIssue(errors, `Negative scope ${entry.negative_scope_id} must declare owner_seam_item_refs for manual/synthetic closure`, hardFails, true);
			for (const ownerItemRef of ownerSeamItemRefs) {
				const ownerItem = itemsById.get(ownerItemRef);
				if (!ownerItem || ownerItem.item_class !== "operational_enablement") {
					pushIssue(errors, `Negative scope ${entry.negative_scope_id} owner seam ${ownerItemRef} must be an operational_enablement item`, hardFails, true);
					continue;
				}
				if (!ownerItem.owners || !isNonEmptyString(ownerItem.owners.runtime_owner) || !isNonEmptyString(ownerItem.owners.escalation_owner)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} owner seam ${ownerItemRef} must declare runtime_owner and escalation_owner`, hardFails, true);
			}
			const criticalTracks = new Set(criticalPathItemRefs.map((itemRef) => itemsById.get(itemRef)?.track_id).filter((trackId) => isNonEmptyString(trackId)));
			const ownerTracks = new Set(ownerSeamItemRefs.map((itemRef) => itemsById.get(itemRef)?.track_id).filter((trackId) => isNonEmptyString(trackId)));
			for (const trackId of criticalTracks) if (REQUIRED_TRACK_IDS.has(trackId) && !ownerTracks.has(trackId)) pushIssue(errors, `Negative scope ${entry.negative_scope_id} introduces manual/synthetic closure on required track ${trackId} without same-track owner seam`, hardFails, true);
		}
	}
	for (const behaviorTitle of backlog.as_built.synthetic_behaviors) {
		const entry = negativeScopeByTitle.get(behaviorTitle);
		if (!entry || !MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES.has(entry.negative_scope_class ?? "")) pushIssue(errors, `Synthetic behavior ${behaviorTitle} must be modeled as manual/synthetic negative_scope with explicit critical-path and owner-seam linkage`, hardFails, true);
	}
	for (const behaviorTitle of backlog.as_built.compatibility_only_behaviors) {
		const entry = negativeScopeByTitle.get(behaviorTitle);
		if (!entry || entry.negative_scope_class !== "compatibility_only") pushIssue(errors, `Compatibility-only behavior ${behaviorTitle} must be modeled as compatibility_only negative_scope with explicit critical-path and owner-seam linkage`, hardFails, true);
	}
	if (backlog.quality_attributes.length === 0) pushIssue(errors, "quality_attributes ledger must not be empty", hardFails, true);
	const qualityAttributeIds = /* @__PURE__ */ new Set();
	for (const entry of backlog.quality_attributes) {
		if (!isNonEmptyString(entry.quality_attribute_id)) {
			pushIssue(errors, "Quality attribute entry missing quality_attribute_id", hardFails, true);
			continue;
		}
		if (qualityAttributeIds.has(entry.quality_attribute_id)) pushIssue(errors, `Duplicate quality_attribute_id: ${entry.quality_attribute_id}`, hardFails, true);
		qualityAttributeIds.add(entry.quality_attribute_id);
		if (!isNonEmptyString(entry.title)) pushIssue(errors, `Quality attribute ${entry.quality_attribute_id} missing title`, hardFails, true);
		if (!isNonEmptyString(entry.quality_class)) pushIssue(errors, `Quality attribute ${entry.quality_attribute_id} missing quality_class`, hardFails, true);
		else if (!QUALITY_CLASSES.has(entry.quality_class)) pushIssue(errors, `Quality attribute ${entry.quality_attribute_id} has unsupported quality_class`, hardFails, true);
		if (!isNonEmptyString(entry.target)) pushIssue(errors, `Quality attribute ${entry.quality_attribute_id} missing target`, hardFails, true);
		validateGraphRefArray(entry.applies_to_refs, `Quality attribute ${entry.quality_attribute_id}`, "applies_to_refs", manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails);
		validateStringArrayField(entry, "owner_refs", `Quality attribute ${entry.quality_attribute_id}`, errors, hardFails);
		validateSourceRefs(entry.source_refs, `Quality attribute ${entry.quality_attribute_id}`, sourceIds, excludedSourceIds, errors, hardFails);
		for (const proofRef of validateStringArrayField(entry, "proof_refs", `Quality attribute ${entry.quality_attribute_id}`, errors, hardFails)) if (!proofIds.has(proofRef)) pushIssue(errors, `Quality attribute ${entry.quality_attribute_id} references unknown proof ${proofRef}`, hardFails, true);
	}
	if (backlog.policy_decisions.length === 0) pushIssue(errors, "policy_decisions ledger must not be empty", hardFails, true);
	const policyDecisionIds = /* @__PURE__ */ new Set();
	for (const entry of backlog.policy_decisions) {
		if (!isNonEmptyString(entry.policy_decision_id)) {
			pushIssue(errors, "Policy decision entry missing policy_decision_id", hardFails, true);
			continue;
		}
		if (policyDecisionIds.has(entry.policy_decision_id)) pushIssue(errors, `Duplicate policy_decision_id: ${entry.policy_decision_id}`, hardFails, true);
		policyDecisionIds.add(entry.policy_decision_id);
		if (!isNonEmptyString(entry.title)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} missing title`, hardFails, true);
		if (!isNonEmptyString(entry.policy_surface)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} missing policy_surface`, hardFails, true);
		if (!isNonEmptyString(entry.decision_state) || !POLICY_DECISION_STATES.includes(entry.decision_state)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} has invalid decision_state`, hardFails, true);
		if (!isNonEmptyString(entry.owner)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} missing owner`, hardFails, true);
		validateSourceRefs(entry.source_refs, `Policy decision ${entry.policy_decision_id}`, sourceIds, excludedSourceIds, errors, hardFails);
		for (const itemRef of validateStringArrayField(entry, "related_item_refs", `Policy decision ${entry.policy_decision_id}`, errors, hardFails)) if (!itemIds.has(itemRef)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} references unknown item ${itemRef}`, hardFails, true);
		if ((entry.decision_state === "required" || entry.decision_state === "deferred") && !isNonEmptyString(entry.revisit_trigger)) pushIssue(errors, `Policy decision ${entry.policy_decision_id} missing revisit_trigger`, hardFails, true);
	}
	const gapIds = /* @__PURE__ */ new Set();
	const contradictionIds = /* @__PURE__ */ new Set();
	const unknownIds = /* @__PURE__ */ new Set();
	const unknownEntriesById = /* @__PURE__ */ new Map();
	for (const [ledgerName, entries, idSet] of [
		[
			"Gap",
			backlog.gaps,
			gapIds
		],
		[
			"Contradiction",
			backlog.contradictions,
			contradictionIds
		],
		[
			"Unknown",
			backlog.unknowns,
			unknownIds
		]
	]) for (const entry of entries) {
		if (!isNonEmptyString(entry.issue_id)) {
			pushIssue(errors, `${ledgerName} entry missing issue_id`, hardFails, true);
			continue;
		}
		if (idSet.has(entry.issue_id)) pushIssue(errors, `Duplicate ${ledgerName.toLowerCase()} issue_id: ${entry.issue_id}`, hardFails, true);
		idSet.add(entry.issue_id);
		if (ledgerName === "Unknown") unknownEntriesById.set(entry.issue_id, entry);
		if (!isNonEmptyString(entry.title)) pushIssue(errors, `${ledgerName} ${entry.issue_id} missing title`, hardFails, true);
		if (!isNonEmptyString(entry.severity)) pushIssue(errors, `${ledgerName} ${entry.issue_id} missing severity`, hardFails, true);
		if ("fail_closed_category" in entry && typeof entry.fail_closed_category !== "boolean") pushIssue(errors, `${ledgerName} ${entry.issue_id} has invalid fail_closed_category`, hardFails, true);
		if ("resolution_state" in entry && entry.resolution_state !== void 0 && entry.resolution_state !== null) {
			if (!isNonEmptyString(entry.resolution_state) || !ISSUE_RESOLUTION_STATES.includes(entry.resolution_state)) pushIssue(errors, `${ledgerName} ${entry.issue_id} has invalid resolution_state`, hardFails, true);
		}
		if (ledgerName === "Unknown") {
			if (!isNonEmptyString(entry.resolution_state)) pushIssue(errors, `Unknown ${entry.issue_id} missing resolution_state`, hardFails, true);
			else if (entry.resolution_state === "resolved" || entry.resolution_state === "downgraded") {
				if (!isNonEmptyString(entry.resolution_note)) pushIssue(errors, `Unknown ${entry.issue_id} must include resolution_note when ${entry.resolution_state}`, hardFails, true);
			}
			if (entry.resolution_state === "downgraded") {
				if (!isNonEmptyString(entry.downgraded_severity)) pushIssue(errors, `Unknown ${entry.issue_id} must include downgraded_severity when resolution_state=downgraded`, hardFails, true);
				else if (isCriticalUnknownSeverity(entry.downgraded_severity)) pushIssue(errors, `Unknown ${entry.issue_id} downgraded_severity must be below critical/high`, hardFails, true);
			}
		}
		validateSourceRefs(entry.source_refs, `${ledgerName} ${entry.issue_id}`, sourceIds, excludedSourceIds, errors, hardFails);
		validateStringArrayField(entry, "owner_implications", `${ledgerName} ${entry.issue_id}`, errors, hardFails);
		for (const claimRef of validateStringArrayField(entry, "related_claim_refs", `${ledgerName} ${entry.issue_id}`, errors, hardFails)) if (!claimIds.has(claimRef)) pushIssue(errors, `${ledgerName} ${entry.issue_id} references unknown claim ${claimRef}`, hardFails, true);
		for (const itemRef of validateStringArrayField(entry, "related_item_refs", `${ledgerName} ${entry.issue_id}`, errors, hardFails)) if (!itemIds.has(itemRef)) pushIssue(errors, `${ledgerName} ${entry.issue_id} references unknown item ${itemRef}`, hardFails, true);
	}
	const unknownToSpike = /* @__PURE__ */ new Map();
	for (const entry of backlog.uncertainty_to_spike) {
		if (!isNonEmptyString(entry.unknown_id)) {
			pushIssue(errors, "uncertainty_to_spike entry missing unknown_id", hardFails, true);
			continue;
		}
		if (!unknownIds.has(entry.unknown_id)) pushIssue(errors, `uncertainty_to_spike references unknown unknown_id ${entry.unknown_id}`, hardFails, true);
		if (!isNonEmptyString(entry.spike_item_id) || !itemIds.has(entry.spike_item_id)) {
			pushIssue(errors, `uncertainty_to_spike ${entry.unknown_id} references invalid spike_item_id`, hardFails, true);
			continue;
		}
		if (declaredItemClassById.get(entry.spike_item_id) !== "spike_discovery") pushIssue(errors, `uncertainty_to_spike ${entry.unknown_id} must point to a spike_discovery item`, hardFails, true);
		if (unknownToSpike.has(entry.unknown_id)) pushIssue(errors, `uncertainty_to_spike duplicates unknown_id ${entry.unknown_id}`, hardFails, true);
		else unknownToSpike.set(entry.unknown_id, entry.spike_item_id);
	}
	for (const [unknownId, unknownEntry] of unknownEntriesById) if (unknownEntry.resolution_state !== "resolved" && unknownEntry.resolution_state !== "downgraded" && isCriticalUnknownSeverity(getIssueEffectiveSeverity(unknownEntry)) && !unknownToSpike.has(unknownId)) pushIssue(errors, `Critical unknown ${unknownId} must be resolved, downgraded, or linked to a bounded spike`, hardFails, true);
	for (const entry of backlog.delivered_lineage_notes) {
		if (!isNonEmptyString(entry.lineage_note_id)) {
			pushIssue(errors, "Delivered lineage note missing lineage_note_id", hardFails, true);
			continue;
		}
		if (!isNonEmptyString(entry.item_id) || !itemIds.has(entry.item_id)) pushIssue(errors, `Delivered lineage note ${entry.lineage_note_id} has invalid item_id`, hardFails, true);
		if (!isNonEmptyString(entry.note)) pushIssue(errors, `Delivered lineage note ${entry.lineage_note_id} missing note`, hardFails, true);
		for (const proofRef of validateStringArrayField(entry, "proof_refs", `Delivered lineage note ${entry.lineage_note_id}`, errors, hardFails)) if (!proofIds.has(proofRef)) pushIssue(errors, `Delivered lineage note ${entry.lineage_note_id} references unknown proof ${proofRef}`, hardFails, true);
	}
	for (const entry of backlog.roadmap_matrix) {
		if (!isNonEmptyString(entry.row_id)) {
			pushIssue(errors, "Roadmap matrix entry missing row_id", hardFails, true);
			continue;
		}
		if (!isGraphRef(entry.item_ref) || entry.item_ref.kind !== "item") pushIssue(errors, `Roadmap matrix ${entry.row_id} missing item_ref`, hardFails, true);
		else if (!itemIds.has(entry.item_ref.id ?? "")) pushIssue(errors, `Roadmap matrix ${entry.row_id} references unknown item ${entry.item_ref.id}`, hardFails, true);
		if (!isGraphRef(entry.track_ref) || entry.track_ref.kind !== "track") pushIssue(errors, `Roadmap matrix ${entry.row_id} missing track_ref`, hardFails, true);
		else if (!trackIds.has(entry.track_ref.id ?? "")) pushIssue(errors, `Roadmap matrix ${entry.row_id} references unknown track ${entry.track_ref.id}`, hardFails, true);
		if (!isNonEmptyString(entry.item_class) || !ITEM_CLASSES.includes(entry.item_class)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid item_class`, hardFails, true);
		if (!isNonEmptyString(entry.backlog_protocol_state) || !BACKLOG_PROTOCOL_STATES.includes(entry.backlog_protocol_state)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid backlog_protocol_state`, hardFails, true);
		if (!isNonEmptyString(entry.delivery_state) || !DELIVERY_STATES.includes(entry.delivery_state)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid delivery_state`, hardFails, true);
		if (!isNonEmptyString(entry.readiness_state) || !READINESS_STATES.includes(entry.readiness_state)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid readiness_state`, hardFails, true);
		if (!isNonEmptyString(entry.closure_state) || !ITEM_CLOSURE_STATES.includes(entry.closure_state)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid closure_state`, hardFails, true);
		if (!isNonEmptyString(entry.summary_label) || !SUMMARY_LABELS.includes(entry.summary_label)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid summary_label`, hardFails, true);
		if (!isNonEmptyString(entry.dependency_type)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing dependency_type`, hardFails, true);
		if (!isNonEmptyString(entry.economic_priority_note)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing economic_priority_note`, hardFails, true);
		validateGraphRefArray(entry.parent_refs ?? [], `Roadmap matrix ${entry.row_id}`, "parent_refs", manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails);
		validateGraphRefArray(entry.child_refs ?? [], `Roadmap matrix ${entry.row_id}`, "child_refs", manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails);
		validateGraphRefArray(entry.dependency_refs ?? [], `Roadmap matrix ${entry.row_id}`, "dependency_refs", manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails);
		validateGraphRefArray(asArray(entry.retirement_ref ? [entry.retirement_ref] : []), `Roadmap matrix ${entry.row_id}`, "retirement_ref", manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds, errors, hardFails);
		for (const proofRef of asArray(entry.proof_refs)) if (!proofIds.has(proofRef)) pushIssue(errors, `Roadmap matrix ${entry.row_id} references unknown proof ${proofRef}`, hardFails, true);
	}
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id)) continue;
		for (const claimRef of asArray(item.claim_refs)) if (!claimIds.has(claimRef)) pushIssue(errors, `Item ${item.item_id} references unknown claim_ref ${claimRef}`, hardFails, true);
		else mappedClaimRefs.add(claimRef);
		for (const policyDecisionRef of asArray(item.policy_decision_refs)) if (!policyDecisionIds.has(policyDecisionRef)) pushIssue(errors, `Item ${item.item_id} references unknown policy_decision_ref ${policyDecisionRef}`, hardFails, true);
		for (const origin of asArray(itemOriginRefs.get(item.item_id))) {
			if (!isNonEmptyString(origin.kind) || !isNonEmptyString(origin.ref)) continue;
			let originResolved = false;
			switch (origin.kind) {
				case "claim_ref":
					originResolved = claimIds.has(origin.ref);
					break;
				case "gap_ref":
					originResolved = gapIds.has(origin.ref);
					break;
				case "control_obligation_ref":
					originResolved = controlObligationClaimIds.has(origin.ref);
					break;
				case "policy_decision_ref":
					originResolved = policyDecisionIds.has(origin.ref);
					break;
				case "decommission_need_ref":
					originResolved = decommissionNeedClaimIds.has(origin.ref);
					break;
				case "review_finding_ref":
					originResolved = reviewFindingIds.has(origin.ref);
					break;
				case "unknown_ref":
					originResolved = unknownIds.has(origin.ref);
					break;
			}
			if (!originResolved) pushIssue(errors, `Item ${item.item_id} has unresolved ${origin.kind} ${origin.ref}`, hardFails, true);
			else if (origin.kind === "claim_ref" || origin.kind === "control_obligation_ref" || origin.kind === "decommission_need_ref") mappedClaimRefs.add(origin.ref);
		}
	}
	for (const proof of backlog.proofs) {
		if (isGraphRef(proof.covered_ref) && !graphRefExists(proof.covered_ref, manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds)) pushIssue(errors, `Proof ${proof.proof_id} references missing covered_ref ${formatGraphRef(proof.covered_ref)}`, hardFails, true);
		if (isGraphRef(proof.covered_ref) && proof.covered_ref.kind === "item" && isNonEmptyString(proof.covered_ref.id)) {
			const coveredItem = itemsById.get(proof.covered_ref.id);
			if (coveredItem && typeof proof.dimensions === "object" && proof.dimensions !== null) {
				const securityDimension = asStringRecord(proof.dimensions.security_trace);
				if (securityDimension.status === "not_applicable" && !isProofDimensionNotApplicableAllowed(coveredItem, "security_trace", securityDimension.justification)) pushIssue(errors, `Proof ${proof.proof_id} may not mark security_trace as not_applicable for item ${coveredItem.item_id}`, hardFails, true);
			}
		}
	}
	for (const review of backlog.reviews) if (isGraphRef(review.reviewed_ref) && !graphRefExists(review.reviewed_ref, manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds)) pushIssue(errors, `Review ${review.review_id} references missing reviewed_ref ${formatGraphRef(review.reviewed_ref)}`, hardFails, true);
	for (const waiver of backlog.waivers) if (isGraphRef(waiver.scope) && !graphRefExists(waiver.scope, manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds)) {
		const message = `Waiver ${waiver.waiver_id} references missing scope ${formatGraphRef(waiver.scope)}`;
		pushIssue(errors, message, hardFails, true);
		waiverFindings.push(message);
	}
	const outgoingByItem = /* @__PURE__ */ new Map();
	const incomingByItem = /* @__PURE__ */ new Map();
	for (const relation of backlog.relations) {
		if (!isNonEmptyString(relation.relation_type) || !RELATION_TYPES.includes(relation.relation_type)) {
			pushIssue(errors, `Invalid relation_type: ${String(relation.relation_type ?? "")}`, hardFails, true);
			continue;
		}
		const fromRef = normalizeRelationRef(relation.from, "item");
		const toRef = normalizeRelationRef(relation.to);
		if (!fromRef || !toRef) {
			pushIssue(errors, "Relation missing from/to graph refs", hardFails, true);
			continue;
		}
		const { validFrom, validTo } = relationEndpointExists(relation, manifest.run_id, itemIds, trackIds, trackProofIds, proofIds, reviewIds, contractIds, dataDomainIds, valueStreamIds);
		if (!validFrom) pushIssue(errors, `Relation source not found: ${formatGraphRef(fromRef)}`, hardFails, true);
		if (!validTo) pushIssue(errors, `Relation target not found for ${relation.relation_type}: ${formatGraphRef(toRef)}`, hardFails, true);
		if (validFrom && fromRef.kind === "item") {
			const fromItemId = fromRef.id;
			if (!isNonEmptyString(fromItemId)) {
				pushIssue(errors, "Relation item source is missing an id", hardFails, true);
				continue;
			}
			const outgoing = outgoingByItem.get(fromItemId) ?? [];
			outgoing.push(relation);
			outgoingByItem.set(fromItemId, outgoing);
		}
		if (validTo && toRef.kind === "item") {
			const toItemId = toRef.id;
			if (!isNonEmptyString(toItemId)) {
				pushIssue(errors, "Relation item target is missing an id", hardFails, true);
				continue;
			}
			const incoming = incomingByItem.get(toItemId) ?? [];
			incoming.push(relation);
			incomingByItem.set(toItemId, incoming);
		}
	}
	const roadmapRowsByItemId = /* @__PURE__ */ new Map();
	const topologyRanks = /* @__PURE__ */ new Set();
	const safetyRanks = /* @__PURE__ */ new Set();
	const economicRanks = /* @__PURE__ */ new Set();
	const topologyRankByItemId = /* @__PURE__ */ new Map();
	for (const entry of backlog.roadmap_matrix) {
		if (!isGraphRef(entry.item_ref) || !isNonEmptyString(entry.item_ref.id)) continue;
		if (roadmapRowsByItemId.has(entry.item_ref.id)) {
			pushIssue(errors, `Roadmap matrix has duplicate item row for ${entry.item_ref.id}`, hardFails, true);
			continue;
		}
		roadmapRowsByItemId.set(entry.item_ref.id, entry);
		for (const [label, value, bucket] of [
			[
				"topology_rank",
				entry.topology_rank,
				topologyRanks
			],
			[
				"safety_rank",
				entry.safety_rank,
				safetyRanks
			],
			[
				"economic_rank",
				entry.economic_rank,
				economicRanks
			]
		]) {
			if (!Number.isInteger(value) || value < 0) {
				pushIssue(errors, `Roadmap matrix ${entry.row_id} missing valid ${label}`, hardFails, true);
				continue;
			}
			if (bucket.has(value)) {
				pushIssue(errors, `Roadmap matrix ${entry.row_id} duplicates ${label}=${value}`, hardFails, true);
				continue;
			}
			bucket.add(value);
		}
		if (Number.isInteger(entry.topology_rank) && entry.topology_rank >= 0) topologyRankByItemId.set(entry.item_ref.id, entry.topology_rank);
	}
	const roadmapRows = backlog.roadmap_matrix.filter((entry) => isGraphRef(entry.item_ref) && entry.item_ref.kind === "item" && isNonEmptyString(entry.item_ref.id));
	for (let leftIndex = 0; leftIndex < roadmapRows.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < roadmapRows.length; rightIndex += 1) {
		const left = roadmapRows[leftIndex];
		const right = roadmapRows[rightIndex];
		if (!left || !right) continue;
		const [leftTrackPriority, leftItemPriority] = getSafetyPriority$1(left);
		const [rightTrackPriority, rightItemPriority] = getSafetyPriority$1(right);
		const leftSafetyRank = left.safety_rank ?? Number.MAX_SAFE_INTEGER;
		const rightSafetyRank = right.safety_rank ?? Number.MAX_SAFE_INTEGER;
		if ((leftTrackPriority < rightTrackPriority || leftTrackPriority === rightTrackPriority && leftItemPriority < rightItemPriority) && leftSafetyRank >= rightSafetyRank) pushIssue(errors, `Roadmap matrix safety_rank must place ${left.item_ref.id} before ${right.item_ref.id} by methodology safety precedence`, hardFails, true);
		if ((leftTrackPriority > rightTrackPriority || leftTrackPriority === rightTrackPriority && leftItemPriority > rightItemPriority) && leftSafetyRank <= rightSafetyRank) pushIssue(errors, `Roadmap matrix safety_rank must place ${right.item_ref.id} before ${left.item_ref.id} by methodology safety precedence`, hardFails, true);
		if (leftTrackPriority === rightTrackPriority && leftItemPriority === rightItemPriority) {
			const economicPriority = compareEconomicPriority$1(left, right);
			if (economicPriority < 0 && (left.economic_rank ?? Number.MAX_SAFE_INTEGER) >= (right.economic_rank ?? Number.MAX_SAFE_INTEGER)) pushIssue(errors, `Roadmap matrix economic_rank must place ${left.item_ref.id} before ${right.item_ref.id} by methodology economic precedence`, hardFails, true);
			if (economicPriority > 0 && (left.economic_rank ?? Number.MAX_SAFE_INTEGER) <= (right.economic_rank ?? Number.MAX_SAFE_INTEGER)) pushIssue(errors, `Roadmap matrix economic_rank must place ${right.item_ref.id} before ${left.item_ref.id} by methodology economic precedence`, hardFails, true);
		}
	}
	for (const itemId of itemIds) if (!roadmapRowsByItemId.has(itemId)) pushIssue(errors, `Item ${itemId} is missing roadmap_matrix row`, hardFails, true);
	for (const entry of backlog.roadmap_matrix) {
		if (!isGraphRef(entry.item_ref) || entry.item_ref.kind !== "item" || !isNonEmptyString(entry.item_ref.id)) continue;
		const rowItem = itemsById.get(entry.item_ref.id);
		if (!rowItem || !isNonEmptyString(rowItem.item_id)) continue;
		const outgoing = outgoingByItem.get(rowItem.item_id) ?? [];
		const incoming = incomingByItem.get(rowItem.item_id) ?? [];
		if (entry.item_class !== rowItem.item_class) pushIssue(errors, `Roadmap matrix ${entry.row_id} item_class mismatch for ${rowItem.item_id}`, hardFails, true);
		if (!relationRefEquals(entry.track_ref, graphRef("track", rowItem.track_id ?? ""))) pushIssue(errors, `Roadmap matrix ${entry.row_id} track_ref mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.milestone !== rowItem.milestone) pushIssue(errors, `Roadmap matrix ${entry.row_id} milestone mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.backlog_protocol_state !== rowItem.backlog_protocol_state) pushIssue(errors, `Roadmap matrix ${entry.row_id} backlog_protocol_state mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.delivery_state !== rowItem.delivery_state) pushIssue(errors, `Roadmap matrix ${entry.row_id} delivery_state mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.readiness_state !== rowItem.readiness_state) pushIssue(errors, `Roadmap matrix ${entry.row_id} readiness_state mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.closure_state !== rowItem.closure_state) pushIssue(errors, `Roadmap matrix ${entry.row_id} closure_state mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.summary_label !== rowItem.summary_label) pushIssue(errors, `Roadmap matrix ${entry.row_id} summary_label mismatch for ${rowItem.item_id}`, hardFails, true);
		if (entry.economic_priority_note !== rowItem.economic_priority_note) pushIssue(errors, `Roadmap matrix ${entry.row_id} economic_priority_note mismatch for ${rowItem.item_id}`, hardFails, true);
		const expectedParents = incoming.filter((relation) => relation.relation_type === "decomposes_into").map((relation) => normalizeRelationRef(relation.from)).filter((ref) => ref?.kind === "item" && isNonEmptyString(ref.id)).sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		const actualParents = asArray(entry.parent_refs).filter((ref) => isGraphRef(ref) && ref.kind === "item").sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		if (expectedParents.map(graphRefKey).join("|") !== actualParents.map(graphRefKey).join("|")) pushIssue(errors, `Roadmap matrix ${entry.row_id} parent_refs mismatch for ${rowItem.item_id}`, hardFails, true);
		const expectedChildren = outgoing.filter((relation) => relation.relation_type === "decomposes_into").map((relation) => normalizeRelationRef(relation.to)).filter((ref) => ref?.kind === "item" && isNonEmptyString(ref.id)).sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		const actualChildren = asArray(entry.child_refs).filter((ref) => isGraphRef(ref) && ref.kind === "item").sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		if (expectedChildren.map(graphRefKey).join("|") !== actualChildren.map(graphRefKey).join("|")) pushIssue(errors, `Roadmap matrix ${entry.row_id} child_refs mismatch for ${rowItem.item_id}`, hardFails, true);
		const expectedDependencies = getDependencyRefs(rowItem).map((dependencyId) => graphRef("item", dependencyId)).sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		const actualDependencies = asArray(entry.dependency_refs).filter((ref) => isGraphRef(ref) && ref.kind === "item").sort((left, right) => graphRefKey(left).localeCompare(graphRefKey(right)));
		if (expectedDependencies.map(graphRefKey).join("|") !== actualDependencies.map(graphRefKey).join("|")) pushIssue(errors, `Roadmap matrix ${entry.row_id} dependency_refs mismatch for ${rowItem.item_id}`, hardFails, true);
		if (!Array.isArray(entry.dependency_entries)) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing dependency_entries`, hardFails, true);
		else {
			const dependencyEntryKeys = /* @__PURE__ */ new Set();
			for (const dependencyEntry of entry.dependency_entries) {
				const dependencyEntryRecord = asStringRecord(dependencyEntry);
				const dependencyRef = dependencyEntryRecord.ref;
				if (!isGraphRef(dependencyRef) || dependencyRef.kind !== "item") {
					pushIssue(errors, `Roadmap matrix ${entry.row_id} has invalid dependency_entries.ref`, hardFails, true);
					continue;
				}
				if (!isNonEmptyString(dependencyEntryRecord.dependency_type)) {
					pushIssue(errors, `Roadmap matrix ${entry.row_id} dependency entry missing dependency_type`, hardFails, true);
					continue;
				}
				dependencyEntryKeys.add(`${dependencyRef.id}:${dependencyEntryRecord.dependency_type}`);
			}
			for (const dependencyRef of expectedDependencies) if (![...dependencyEntryKeys].some((entryKey) => entryKey.startsWith(`${dependencyRef.id}:`))) pushIssue(errors, `Roadmap matrix ${entry.row_id} dependency_entries missing typed dependency for ${dependencyRef.id}`, hardFails, true);
		}
		if (!Array.isArray(entry.economic_factors) || entry.economic_factors.length === 0) pushIssue(errors, `Roadmap matrix ${entry.row_id} missing economic_factors`, hardFails, true);
		else for (const economicFactor of entry.economic_factors) if (!isNonEmptyString(economicFactor) || ![
			"strategic_fit",
			"dependency_unlock",
			"user_value",
			"ops_pain_reduction",
			"risk_burn_down",
			"compliance_deadline",
			"learning_value",
			"reversibility",
			"cost_of_delay",
			"lead_time_risk"
		].includes(economicFactor)) pushIssue(errors, `Roadmap matrix ${entry.row_id} has invalid economic_factor ${String(economicFactor)}`, hardFails, true);
		const expectedProofRefs = [...asArray(rowItem.proof_refs)].sort();
		const actualProofRefs = [...asArray(entry.proof_refs)].sort();
		if (expectedProofRefs.join("|") !== actualProofRefs.join("|")) pushIssue(errors, `Roadmap matrix ${entry.row_id} proof_refs mismatch for ${rowItem.item_id}`, hardFails, true);
		const expectedRetirementRef = outgoing.filter((relation) => relation.relation_type === "retires").map((relation) => normalizeRelationRef(relation.to)).find((ref) => ref !== null) ?? null;
		if (!relationRefEquals(entry.retirement_ref ?? null, expectedRetirementRef)) pushIssue(errors, `Roadmap matrix ${entry.row_id} retirement_ref mismatch for ${rowItem.item_id}`, hardFails, true);
		const rowTopologyRank = topologyRankByItemId.get(rowItem.item_id);
		if (rowTopologyRank !== void 0) {
			const orderedPredecessors = [...incoming.filter((relation) => relation.relation_type === "decomposes_into").map((relation) => normalizeRelationRef(relation.from)).filter((ref) => ref?.kind === "item" && isNonEmptyString(ref.id)).map((ref) => ({
				ref,
				relationLabel: "parent"
			})), ...expectedDependencies.map((ref) => ({
				ref,
				relationLabel: "dependency"
			}))];
			for (const predecessor of orderedPredecessors) {
				const predecessorRank = topologyRankByItemId.get(predecessor.ref.id ?? "");
				if (predecessorRank !== void 0 && predecessorRank >= rowTopologyRank) pushIssue(errors, `Roadmap matrix ${entry.row_id} topology_rank must place ${predecessor.relationLabel} ${predecessor.ref.id} before ${rowItem.item_id}`, hardFails, true);
			}
			for (const childRef of expectedChildren) {
				const childRank = topologyRankByItemId.get(childRef.id ?? "");
				if (childRank !== void 0 && childRank <= rowTopologyRank) pushIssue(errors, `Roadmap matrix ${entry.row_id} topology_rank must place child ${childRef.id} after ${rowItem.item_id}`, hardFails, true);
			}
		}
	}
	for (const review of backlog.reviews) {
		if (!isNonEmptyString(review.review_id) || !isGraphRef(review.reviewed_ref)) continue;
		const expectedReviewRef = graphRef("review", review.review_id);
		if (!backlog.relations.some((relation) => relation.relation_type === "reviewed_by" && relationRefEquals(normalizeRelationRef(relation.from), review.reviewed_ref) && relationRefEquals(normalizeRelationRef(relation.to), expectedReviewRef))) pushIssue(errors, `Review ${review.review_id} is missing graph-level reviewed_by relation from ${formatGraphRef(review.reviewed_ref)}`, hardFails, true);
	}
	for (const trackProof of backlog.track_proofs) {
		if (!isNonEmptyString(trackProof.track_proof_id) || !isNonEmptyString(trackProof.track_id)) continue;
		const trackId = trackProof.track_id;
		const trackProofId = trackProof.track_proof_id;
		if (!backlog.relations.some((relation) => relation.relation_type === "proves" && relationRefEquals(normalizeRelationRef(relation.from), graphRef("track", trackId)) && relationRefEquals(normalizeRelationRef(relation.to), graphRef("track_proof", trackProofId)))) pushIssue(errors, `Track proof ${trackProofId} is missing graph-level proves relation from track ${trackId}`, hardFails, true);
	}
	const pendingTrackProofReviews = [];
	if (backlog.reviews.filter((review) => review.review_scope === "run" && relationRefEquals(review.reviewed_ref, graphRef("run", manifest.run_id))).length === 0) pushIssue(errors, "Run must be reviewed_by at least one run-scope review artifact", hardFails, true);
	for (const trackProof of backlog.track_proofs) {
		if (!isNonEmptyString(trackProof.track_proof_id)) continue;
		const trackProofId = trackProof.track_proof_id;
		const trackProofReviews = backlog.reviews.filter((review) => review.review_scope === "track_proof" && relationRefEquals(review.reviewed_ref, graphRef("track_proof", trackProofId)));
		if (trackProofReviews.length === 0) {
			pendingTrackProofReviews.push(trackProofId);
			pushIssue(errors, `Track proof ${trackProofId} must be reviewed_by at least one track_proof review artifact`, hardFails, true);
			continue;
		}
		if (!trackProofReviews.some((review) => review.independent === true)) {
			pendingTrackProofReviews.push(trackProofId);
			pushIssue(errors, `Track proof ${trackProofId} must have at least one independent track_proof review`, hardFails, true);
		}
		if (trackProofReviews.every((review) => review.verdict === "fail")) pushIssue(errors, `Track proof ${trackProofId} has only failing track_proof reviews`, hardFails, true);
		if (trackProofReviews.some((review) => review.verdict === "pass_with_findings")) warnings.push(`Track proof ${trackProofId} passed review with findings; confirm track-closure follow-up actions are tracked.`);
	}
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id) || !isNonEmptyString(item.item_class)) continue;
		const itemId = item.item_id;
		const itemClass = item.item_class;
		const itemTrackId = item.track_id;
		const dependencies = getDependencyRefs(item);
		for (const dependency of dependencies) if (!itemIds.has(dependency)) pushIssue(errors, `Item ${itemId} depends on unknown item ${dependency}`, hardFails, true);
		for (const proofRef of asArray(item.proof_refs)) if (!proofIds.has(proofRef)) pushIssue(errors, `Item ${itemId} references unknown proof ${proofRef}`, hardFails, true);
		const outgoing = outgoingByItem.get(itemId) ?? [];
		const incoming = incomingByItem.get(itemId) ?? [];
		const proofRelations = outgoing.filter((relation) => relation.relation_type === "proves");
		const proofRelationIds = new Set(proofRelations.map((relation) => normalizeRelationRef(relation.to)).filter((ref) => ref?.kind === "proof" && isNonEmptyString(ref.id)).map((ref) => ref.id));
		for (const proofRef of asArray(item.proof_refs)) if (!proofRelationIds.has(proofRef)) pushIssue(errors, `Item ${itemId} proof_ref ${proofRef} is missing graph-level proves relation`, hardFails, true);
		if (!asArray(item.proof_refs).some((proofRef) => {
			return relationRefEquals(proofCoveredRefById.get(proofRef), graphRef("item", itemId));
		})) pushIssue(errors, `Item ${itemId} must have at least one proof_ref whose covered_ref points to the item itself`, hardFails, true);
		const allowedRelations = OUTGOING_RELATIONS_BY_CLASS[itemClass];
		for (const relation of outgoing) if (!allowedRelations.has(relation.relation_type ?? "")) pushIssue(errors, `Item ${itemId} (${itemClass}) has invalid outgoing relation ${relation.relation_type}`, hardFails, true);
		const trackRelations = outgoing.filter((relation) => relation.relation_type === "belongs_to_track");
		if (trackRelations.length !== 1) pushIssue(errors, `Item ${itemId} must have exactly one belongs_to_track relation`, hardFails, true);
		else if (!isNonEmptyString(itemTrackId) || !relationRefEquals(normalizeRelationRef(trackRelations[0]?.to), graphRef("track", itemTrackId))) pushIssue(errors, `Item ${itemId} has belongs_to_track mismatch with track_id`, hardFails, true);
		if (itemClass === "feature_slice") {
			const realizes = outgoing.filter((relation) => relation.relation_type === "realizes");
			if (realizes.length !== 1) pushIssue(errors, `Feature slice ${itemId} must realize exactly one parent seam`, hardFails, true);
			else {
				const realizeRelation = realizes[0];
				if (!realizeRelation) {
					pushIssue(errors, `Feature slice ${itemId} must realize exactly one parent seam`, hardFails, true);
					continue;
				}
				const realizedParentRef = normalizeRelationRef(realizeRelation.to);
				const parent = realizedParentRef?.kind === "item" && isNonEmptyString(realizedParentRef.id) ? itemsById.get(realizedParentRef.id) : void 0;
				if (!parent || parent.item_class !== "capability_seam") pushIssue(errors, `Feature slice ${itemId} must realize a capability seam`, hardFails, true);
				const parentSeamRef = getPayloadGraphRef(item, "parent_seam_ref", "item") ?? (isNonEmptyString(item.parent_seam_id) ? graphRef("item", item.parent_seam_id) : null);
				if (parentSeamRef && !relationRefEquals(realizedParentRef, parentSeamRef)) pushIssue(errors, `Feature slice ${itemId} has parent_seam_id mismatch`, hardFails, true);
			}
		}
		if (itemClass === "control_guardrail") {
			if (incoming.filter((relation) => relation.relation_type === "governed_by").length === 0) pushIssue(errors, `Control guardrail ${itemId} must be the target of governed_by`, hardFails, true);
		}
		if (itemClass === "migration") {
			if (outgoing.filter((relation) => relation.relation_type === "migrates_from").length !== 1) pushIssue(errors, `Migration ${itemId} must have exactly one migrates_from relation`, hardFails, true);
		}
		if (itemClass === "retirement") {
			if (outgoing.filter((relation) => relation.relation_type === "retires").length === 0) pushIssue(errors, `Retirement ${itemId} must retire at least one legacy path`, hardFails, true);
		}
		if (itemClass === "capability_seam") {
			const decomposesInto = outgoing.filter((relation) => relation.relation_type === "decomposes_into");
			if (decomposesInto.length === 0) pushIssue(errors, `Capability seam ${itemId} must decompose into owned child work`, hardFails, true);
			for (const relation of decomposesInto) {
				const relationTarget = normalizeRelationRef(relation.to);
				const target = relationTarget?.kind === "item" && isNonEmptyString(relationTarget.id) ? itemsById.get(relationTarget.id) : void 0;
				if (target && ![
					"feature_slice",
					"control_guardrail",
					"migration",
					"retirement",
					"operational_enablement",
					"documentation_support_enablement"
				].includes(target.item_class ?? "")) pushIssue(errors, `Capability seam ${itemId} decomposes into invalid item ${formatGraphRef(relationTarget)}`, hardFails, true);
			}
		}
		if (itemClass === "spike_discovery") {
			if (outgoing.filter((relation) => relation.relation_type === "decomposes_into").length > 0) pushIssue(errors, `Spike ${itemId} may not decompose into implementation work`, hardFails, true);
			if (backlog.uncertainty_to_spike.filter((entry) => entry.spike_item_id === itemId).length === 0) pushIssue(errors, `Spike ${itemId} must be linked from uncertainty_to_spike`, hardFails, true);
			for (const followOnItemRef of getPayloadStringArray(item, "follow_on_item_refs", asArray(item.follow_on_item_refs))) {
				if (!itemIds.has(followOnItemRef)) {
					pushIssue(errors, `Spike ${itemId} references unknown follow-on item ${followOnItemRef}`, hardFails, true);
					continue;
				}
				if (followOnItemRef === itemId) pushIssue(errors, `Spike ${itemId} cannot reference itself as a follow-on item`, hardFails, true);
			}
		}
		if (itemClass === "operational_enablement" || itemClass === "documentation_support_enablement") {
			if (outgoing.filter((relation) => relation.relation_type === "enabled_by" || relation.relation_type === "governed_by").length === 0) pushIssue(errors, `Item ${itemId} (${itemClass}) must declare at least one enabled_by or governed_by relation`, hardFails, true);
		}
		const contractRelations = outgoing.filter((relation) => relation.relation_type === "touches_contract");
		const dataDomainRelations = outgoing.filter((relation) => relation.relation_type === "touches_data_domain");
		if (contractRelations.length > 0 || dataDomainRelations.length > 0 || asArray(item.interfaces_touched).length > 0 || asArray(item.data_domains_touched).length > 0 || item.item_class === "migration" || itemTouchesTrustBoundary(item)) {
			const governance = getContractGovernance(item);
			if (governance.applicable !== true) pushIssue(errors, `Item ${itemId} is contract/data-changing but contract_governance.applicable is not true`, hardFails, true);
			const contractOwner = typeof governance.contract_owner === "string" ? governance.contract_owner : null;
			const compatibilityClass = typeof governance.compatibility_class === "string" ? governance.compatibility_class : item.compatibility_class;
			const migrationStrategy = typeof governance.migration_strategy === "string" ? governance.migration_strategy : item.migration_strategy;
			const canonicalWriter = typeof governance.canonical_writer === "string" ? governance.canonical_writer : item.canonical_writer;
			const consumerImpact = typeof governance.consumer_impact === "string" ? governance.consumer_impact : item.consumer_impact;
			const versioningStrategy = typeof governance.versioning_strategy === "string" ? governance.versioning_strategy : null;
			const reconciliationStrategy = typeof governance.reconciliation_strategy === "string" ? governance.reconciliation_strategy : null;
			const deprecationWindow = typeof governance.deprecation_window === "string" ? governance.deprecation_window : null;
			const retirementCondition = typeof governance.retirement_condition === "string" ? governance.retirement_condition : null;
			if (!isNonEmptyString(contractOwner)) pushIssue(errors, `Item ${itemId} is contract/data-changing but missing contract_owner`, hardFails, true);
			if (!isNonEmptyString(compatibilityClass) || !COMPATIBILITY_CLASSES.includes(compatibilityClass)) pushIssue(errors, `Item ${itemId} is contract-changing but missing compatibility_class`, hardFails, true);
			if (!isNonEmptyString(migrationStrategy)) pushIssue(errors, `Item ${itemId} is contract-changing but missing migration governance`, hardFails, true);
			if (!isNonEmptyString(canonicalWriter)) pushIssue(errors, `Item ${itemId} is contract-changing but missing canonical_writer`, hardFails, true);
			if (!isNonEmptyString(consumerImpact)) pushIssue(errors, `Item ${itemId} is contract-changing but missing consumer_impact`, hardFails, true);
			if (!isNonEmptyString(versioningStrategy)) pushIssue(errors, `Item ${itemId} is contract/data-changing but missing versioning_strategy`, hardFails, true);
			if (!isNonEmptyString(reconciliationStrategy)) pushIssue(errors, `Item ${itemId} is contract/data-changing but missing reconciliation_strategy`, hardFails, true);
			if (!isNonEmptyString(deprecationWindow)) pushIssue(errors, `Item ${itemId} is contract/data-changing but missing deprecation_window`, hardFails, true);
			if (!isNonEmptyString(retirementCondition)) pushIssue(errors, `Item ${itemId} is contract/data-changing but missing retirement_condition`, hardFails, true);
			if (asArray(item.interfaces_touched).length > 0 && contractRelations.length === 0) pushIssue(errors, `Item ${itemId} lists interfaces_touched but has no touches_contract relation`, hardFails, true);
			if (asArray(item.data_domains_touched).length > 0 && dataDomainRelations.length === 0) pushIssue(errors, `Item ${itemId} lists data_domains_touched but has no touches_data_domain relation`, hardFails, true);
			for (const relation of contractRelations) {
				const targetRef = normalizeRelationRef(relation.to);
				if (targetRef?.kind === "contract" && !asArray(item.interfaces_touched).includes(targetRef.id ?? "")) pushIssue(errors, `Item ${itemId} touches contract ${targetRef.id} but does not list it in interfaces_touched`, hardFails, true);
			}
			for (const relation of dataDomainRelations) {
				const targetRef = normalizeRelationRef(relation.to);
				if (targetRef?.kind === "data_domain" && !asArray(item.data_domains_touched).includes(targetRef.id ?? "")) pushIssue(errors, `Item ${itemId} touches data domain ${targetRef.id} but does not list it in data_domains_touched`, hardFails, true);
			}
		}
	}
	const committedClaimsWithoutItems = [...committedClaimIds].filter((claimId) => !mappedClaimRefs.has(claimId));
	for (const claimId of committedClaimsWithoutItems) pushIssue(errors, `Committed claim ${claimId} is not mapped to any item`, hardFails, true);
	const replacements = backlog.relations.filter((relation) => relation.relation_type === "replaces");
	for (const relation of replacements) {
		const replacementTarget = normalizeRelationRef(relation.to);
		const replacementSource = normalizeRelationRef(relation.from, "item");
		if (!backlog.items.some((item) => {
			if (item.item_class !== "retirement" || !isNonEmptyString(item.item_id)) return false;
			return (outgoingByItem.get(item.item_id) ?? []).some((candidate) => candidate.relation_type === "retires" && relationRefEquals(normalizeRelationRef(candidate.to), replacementTarget));
		})) pushIssue(errors, `Replacement path ${formatGraphRef(replacementSource)} -> ${formatGraphRef(replacementTarget)} has no retirement item`, hardFails, true);
	}
	for (const claimId of driftState.staleClaims) {
		const message = `Claim ${claimId} is stale after source or claim drift`;
		lintFindings.push(message);
		hardFails.push(message);
	}
	for (const itemId of driftState.staleItems) {
		const message = `Item ${itemId} is stale after proof, claim, contract, or topology drift`;
		lintFindings.push(message);
		hardFails.push(message);
	}
	for (const proofId of driftState.staleProofs) {
		const message = `Proof ${proofId} is stale after freshness expiry or drift invalidation`;
		lintFindings.push(message);
		hardFails.push(message);
	}
	for (const gateId of driftState.deltaSummary.track_gate_ids_to_recalculate) if (backlog.track_gates.find((candidate) => candidate.track_gate_id === gateId)?.fail_mode === "fail_closed") {
		pushIssue(errors, `Track gate ${gateId} requires recalculation after drift and is fail_closed`, hardFails, true);
		trackGateFailures.push(gateId);
	}
	const targetAcceptance = isAcceptanceClass(manifest.acceptance_target) ? manifest.acceptance_target : "draft-only";
	const runScopeRef = graphRef("run", manifest.run_id);
	const runScopeKey = graphRefKey(runScopeRef);
	const validWaivedScopesByRole = /* @__PURE__ */ new Map();
	for (const waiver of backlog.waivers) {
		if (!isNonEmptyString(waiver.waiver_id) || !isNonEmptyString(waiver.waived_role) || !isGraphRef(waiver.scope)) continue;
		const scopeItems = getScopedItemsForGraphRef(waiver.scope, manifest.run_id, itemsById, backlog);
		if (isRoleDirectlyImpacted(waiver.waived_role, scopeItems, targetAcceptance)) {
			const message = `Waiver ${waiver.waiver_id} is invalid because role ${waiver.waived_role} is directly impacted by its scope`;
			pushIssue(errors, message, hardFails, true);
			waiverFindings.push(message);
			invalidWaiverIds.add(waiver.waiver_id);
			continue;
		}
		const waivedScopes = validWaivedScopesByRole.get(waiver.waived_role) ?? /* @__PURE__ */ new Set();
		waivedScopes.add(graphRefKey(waiver.scope));
		validWaivedScopesByRole.set(waiver.waived_role, waivedScopes);
	}
	const requiredRoleScopes = /* @__PURE__ */ new Map();
	for (const role of [
		"product_strategy",
		"system_architecture",
		"application_engineering"
	]) addRequiredRoleScope(requiredRoleScopes, role, runScopeRef);
	if (targetAcceptance !== "draft-only") addRequiredRoleScope(requiredRoleScopes, "qa_release", runScopeRef);
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id)) continue;
		const itemScope = graphRef("item", item.item_id);
		if (item.item_class === "operational_enablement" || item.item_class === "documentation_support_enablement" || hasChangeSurface(item, SUPPORT_SURFACES)) {
			addRequiredRoleScope(requiredRoleScopes, "platform_sre", itemScope);
			addRequiredRoleScope(requiredRoleScopes, "support_operations", itemScope);
		}
		if (item.item_class === "control_guardrail" || hasChangeSurface(item, SECURITY_SURFACES)) addRequiredRoleScope(requiredRoleScopes, "security", itemScope);
	}
	for (const trackProof of backlog.track_proofs) {
		if (!isNonEmptyString(trackProof.track_proof_id)) continue;
		const trackProofScope = graphRef("track_proof", trackProof.track_proof_id);
		const scopedItems = getScopedItemsForGraphRef(trackProofScope, manifest.run_id, itemsById, backlog);
		if (trackProof.track_id === "externally-safe-operationally-supportable" || trackProof.track_id === "full-target-system" || isRuntimeOrSupportDirectlyImpacted(scopedItems)) {
			addRequiredRoleScope(requiredRoleScopes, "platform_sre", trackProofScope);
			addRequiredRoleScope(requiredRoleScopes, "support_operations", trackProofScope);
		}
		if (isSecurityDirectlyImpacted(scopedItems)) addRequiredRoleScope(requiredRoleScopes, "security", trackProofScope);
	}
	if (targetAcceptance === "implementation-grade") for (const role of BASELINE_IMPLEMENTATION_REVIEW_ROLES) addRequiredRoleScope(requiredRoleScopes, role, runScopeRef);
	const validRunWaivedRoles = /* @__PURE__ */ new Set();
	for (const [role, scopes] of validWaivedScopesByRole) if (scopes.has(runScopeKey)) validRunWaivedRoles.add(role);
	const requiredReviewRoles = /* @__PURE__ */ new Set();
	for (const [role, scopes] of requiredRoleScopes) if ([...scopes.values()].some((scope) => !scopeIsWaived(validWaivedScopesByRole, role, scope, runScopeKey))) requiredReviewRoles.add(role);
	const presentReviewRoles = [...runReviewRoleMap.keys()].sort();
	const missingRequiredReviews = [];
	const validatedReviewRoles = /* @__PURE__ */ new Set();
	const validateRequiredReviewRole = (role) => {
		if (validatedReviewRoles.has(role)) return;
		validatedReviewRoles.add(role);
		if (validRunWaivedRoles.has(role)) return;
		const reviewState = runReviewRoleMap.get(role);
		if (!reviewState) {
			missingRequiredReviews.push(role);
			pushIssue(errors, `Required review role missing: ${role}`, hardFails, true);
			return;
		}
		if (!reviewState.independent) pushIssue(errors, `Required review role ${role} lacks an independent review artifact`, hardFails, true);
		if (reviewState.verdicts.every((verdict) => verdict === "fail")) pushIssue(errors, `Required review role ${role} has only failing reviews`, hardFails, true);
		if (reviewState.verdicts.some((verdict) => verdict === "pass_with_findings")) warnings.push(`Review role ${role} passed with findings; confirm follow-up actions are tracked.`);
	};
	for (const role of [...requiredReviewRoles].sort()) validateRequiredReviewRole(role);
	const reviewWarnings = warnings.filter((warning) => warning.toLowerCase().includes("review"));
	const preliminaryScore = computeScore(backlog, hardFails, errors, warnings, lintFindings, [...staleProofs], driftState.staleItems, driftState.staleClaims, missingRequiredReviews, pendingTrackProofReviews, committedClaimsWithoutItems, missingOwners);
	const candidateForImplementationGrade = errors.length === 0 && hardFails.length === 0 && preliminaryScore.total >= 95 && reviewWarnings.length === 0;
	if (candidateForImplementationGrade) for (const role of BASELINE_IMPLEMENTATION_REVIEW_ROLES) {
		requiredReviewRoles.add(role);
		validateRequiredReviewRole(role);
	}
	const score = candidateForImplementationGrade ? computeScore(backlog, hardFails, errors, warnings, lintFindings, [...staleProofs], driftState.staleItems, driftState.staleClaims, missingRequiredReviews, pendingTrackProofReviews, committedClaimsWithoutItems, missingOwners) : preliminaryScore;
	if (warnings.length > 0 && !warnings.some((warning) => warning.toLowerCase().includes("review"))) nextActions.push("Resolve remaining warnings before treating the run as stable planning input.");
	if (hardFails.length > 0) nextActions.push("Fix hard-fail validation issues and rerun validate.");
	if (missingRequiredReviews.length > 0) nextActions.push(`Obtain independent reviews for: ${missingRequiredReviews.join(", ")}.`);
	if (pendingTrackProofReviews.length > 0) nextActions.push(`Attach independent track-proof reviews for: ${pendingTrackProofReviews.join(", ")}.`);
	if (staleProofs.size > 0) nextActions.push(`Refresh stale proof bundles: ${[...staleProofs].join(", ")}.`);
	if (driftState.staleItems.length > 0) nextActions.push(`Refresh stale items after drift: ${driftState.staleItems.join(", ")}.`);
	if (driftState.staleClaims.length > 0) nextActions.push(`Re-verify changed claims: ${driftState.staleClaims.join(", ")}.`);
	if (driftState.rebaselineRequired) nextActions.push("Run delta, update canonical state, and rebaseline before relying on acceptance.");
	if (committedClaimsWithoutItems.length > 0) nextActions.push(`Map committed claims to items: ${committedClaimsWithoutItems.join(", ")}.`);
	if (backlog.items.some((item) => item.readiness_state === "ready" && (!isNonEmptyString(getItemEstimateBand(item)) || !isNonEmptyString(getItemConfidence(item))))) nextActions.push("Complete estimate_band and confidence on ready items.");
	const uniqueHardFails = [...new Set(hardFails)];
	const hasHardFails = uniqueHardFails.length > 0;
	const canonicalArtifactsComplete = errors.length === 0;
	const reviewGateErrors = errors.filter((error) => error.startsWith("Required review role "));
	const planningScoreEligible = score.total >= 80;
	const implementationAcceptanceEligible = score.total >= 95 && reviewWarnings.length === 0 && missingRequiredReviews.length === 0 && pendingTrackProofReviews.length === 0;
	const assessmentStatus = canonicalArtifactsComplete && !hasHardFails ? "pass" : "fail";
	let acceptanceAchieved = "draft-only";
	if (canonicalArtifactsComplete && !hasHardFails && reviewGateErrors.length === 0 && planningScoreEligible) acceptanceAchieved = implementationAcceptanceEligible ? "implementation-grade" : "planning-grade";
	const blockingReasons = [...uniqueHardFails];
	if (missingRequiredReviews.length > 0) blockingReasons.push(`Missing required review roles: ${missingRequiredReviews.join(", ")}`);
	for (const reviewIssue of reviewGateErrors) blockingReasons.push(reviewIssue);
	if (!planningScoreEligible) blockingReasons.push(`Score ${score.total}/${score.max} is below the planning-grade floor of 80.`);
	if (!planningScoreEligible) nextActions.push("Raise the score to at least 80/100 before treating the run as planning-grade.");
	const targetSatisfied = acceptanceAtLeast(acceptanceAchieved, targetAcceptance);
	const closureStatus = acceptanceAchieved === "implementation-grade" ? "implementation_ready" : acceptanceAchieved === "planning-grade" ? "planning_ready" : "open";
	const acceptanceState = buildAcceptanceState(targetAcceptance, acceptanceAchieved, targetSatisfied, blockingReasons);
	const closureState = {
		status: closureStatus,
		reason: closureStatus === "implementation_ready" ? "No hard-fails remain and the score reaches implementation-grade." : closureStatus === "planning_ready" ? "No hard-fails remain and the run is fit for planning." : "Hard-fails, incomplete mandatory artifacts, review gaps, or insufficient score keep the run open."
	};
	const deltaSummary = {
		...driftState.deltaSummary,
		baseline_established: true
	};
	const assessment = {
		schema_version: "3",
		run_id: manifest.run_id ?? path.basename(runDir),
		assessed_at: utcNow(),
		status: assessmentStatus,
		errors,
		warnings,
		hard_fails: uniqueHardFails,
		lint_findings: [...new Set(lintFindings)],
		stale_proofs: [...new Set([...staleProofs])],
		stale_items: driftState.staleItems,
		stale_claims: driftState.staleClaims,
		track_gate_failures: [...new Set(trackGateFailures)],
		required_review_roles: [...requiredReviewRoles].sort(),
		present_review_roles: presentReviewRoles,
		missing_review_roles: [...new Set(missingRequiredReviews)].sort(),
		pending_track_proof_reviews: [...new Set(pendingTrackProofReviews)].sort(),
		waiver_findings: [...new Set(waiverFindings)],
		invalid_waiver_ids: [...invalidWaiverIds].sort(),
		next_actions: [...new Set(nextActions)],
		score,
		acceptance: acceptanceState,
		closure: closureState,
		stats: {
			sources: backlog.source_authority.length,
			claims: backlog.claims.length,
			contracts: backlog.contracts.length,
			data_domains: backlog.data_domains.length,
			items: backlog.items.length,
			relations: backlog.relations.length,
			proofs: backlog.proofs.length,
			track_proofs: backlog.track_proofs.length,
			reviews: backlog.reviews.length,
			waivers: backlog.waivers.length,
			previous_warnings: Array.isArray(previousAssessment.warnings) ? previousAssessment.warnings.length : 0
		},
		delta_summary: deltaSummary,
		rebaseline_required: driftState.rebaselineRequired
	};
	writeJson(paths.assessment, assessment);
	manifest.updated_at = assessment.assessed_at;
	manifest.last_assessment_status = assessment.status;
	manifest.current_source_hashes = driftState.currentSourceHashes;
	manifest.current_canonical_hashes = driftState.currentCanonicalHashes;
	manifest.dirty_flags = driftState.deltaSummary.dirty_flags;
	if (!driftState.baselineEstablished) {
		manifest.baseline_source_hashes = driftState.baselineSourceHashes;
		manifest.baseline_canonical_hashes = driftState.baselineCanonicalHashes;
	}
	if (assessment.status === "pass" && !["rendered", "closed"].includes(manifest.phase_state)) manifest.phase_state = "validated";
	writeJson(paths.manifest, manifest);
	const journalEvents = loadNdjson(paths.journal);
	const recordedWaiverIds = new Set(journalEvents.filter((event) => event.event === "waiver_recorded").map((event) => event.waiver_id).filter((waiverId) => isNonEmptyString(waiverId)));
	const closedTrackIds = new Set(journalEvents.filter((event) => event.event === "track_closed").map((event) => event.track_id).filter((trackId) => isNonEmptyString(trackId)));
	for (const waiver of backlog.waivers) {
		if (!isNonEmptyString(waiver.waiver_id) || recordedWaiverIds.has(waiver.waiver_id)) continue;
		appendNdjson(paths.journal, {
			ts: assessment.assessed_at,
			event: "waiver_recorded",
			run_id: assessment.run_id,
			waiver_id: waiver.waiver_id,
			waived_role: waiver.waived_role ?? null,
			scope: formatGraphRef(waiver.scope),
			valid: !invalidWaiverIds.has(waiver.waiver_id),
			impacted_surfaces: asArray(waiver.impacted_surfaces)
		});
	}
	for (const track of backlog.tracks) {
		if (!isNonEmptyString(track.track_id) || track.closure_state !== "closed" || closedTrackIds.has(track.track_id)) continue;
		appendNdjson(paths.journal, {
			ts: assessment.assessed_at,
			event: "track_closed",
			run_id: assessment.run_id,
			track_id: track.track_id,
			summary_label: track.summary_label ?? null,
			track_proof_refs: asArray(track.track_proof_refs)
		});
	}
	appendNdjson(paths.journal, {
		ts: assessment.assessed_at,
		event: "run_validated",
		run_id: assessment.run_id,
		status: assessment.status,
		achieved_acceptance: assessment.acceptance.achieved,
		score: assessment.score.total,
		error_count: errors.length,
		warning_count: warnings.length
	});
	return {
		errors,
		missingArtifacts: [],
		runDir,
		assessment,
		warnings
	};
}
//#endregion
//#region src/discovery/delta-run.ts
async function computeDiscoveryDelta(runDirInput) {
	const bundleRepair = repairCompactRunBundle(runDirInput);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		inaccessibleSources: [],
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {},
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	const refreshResult = await refreshRunSourceFingerprints(runDirInput);
	if (refreshResult.legacyLayoutMessage || refreshResult.missingArtifacts.length > 0 || refreshResult.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		inaccessibleSources: refreshResult.inaccessibleSources,
		...refreshResult.legacyLayoutMessage ? { legacyLayoutMessage: refreshResult.legacyLayoutMessage } : {},
		missingArtifacts: refreshResult.missingArtifacts,
		runDir: refreshResult.runDir,
		unsupportedSchemaMessages: refreshResult.unsupportedSchemaMessages
	};
	if (refreshResult.inaccessibleSources.length > 0) return {
		assessment: null,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir: refreshResult.runDir,
		unsupportedSchemaMessages: []
	};
	const { assessment, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		inaccessibleSources: refreshResult.inaccessibleSources,
		...legacyLayoutMessage ? { legacyLayoutMessage } : {},
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	const validationResult = validateDiscoveryRun(runDir);
	if (!validationResult.assessment) {
		const result = {
			assessment: null,
			inaccessibleSources: refreshResult.inaccessibleSources,
			missingArtifacts: validationResult.missingArtifacts,
			runDir,
			unsupportedSchemaMessages: []
		};
		if (validationResult.legacyLayoutMessage) result.legacyLayoutMessage = validationResult.legacyLayoutMessage;
		return result;
	}
	if (!manifest || !assessment) return {
		assessment: null,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const paths = runPaths(runDir);
	const refreshedManifest = loadJson(paths.manifest);
	const refreshedAssessment = loadJson(paths.assessment);
	const computedAt = utcNow();
	refreshedManifest.updated_at = computedAt;
	refreshedManifest.last_delta_at = computedAt;
	writeJson(paths.manifest, refreshedManifest);
	appendNdjson(paths.journal, {
		ts: computedAt,
		event: "delta_computed",
		run_id: refreshedManifest.run_id,
		changed_source_ids: refreshedAssessment.delta_summary.changed_source_ids,
		changed_claim_ids: refreshedAssessment.delta_summary.changed_claim_ids,
		stale_item_ids: refreshedAssessment.delta_summary.stale_item_ids,
		stale_proof_ids: refreshedAssessment.delta_summary.stale_proof_ids,
		track_gate_ids_to_recalculate: refreshedAssessment.delta_summary.track_gate_ids_to_recalculate,
		rebaseline_required: refreshedAssessment.rebaseline_required
	});
	return {
		assessment: refreshedAssessment,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
}
//#endregion
//#region src/discovery/roadmap-matrix.ts
var SAFETY_TRACK_PRIORITY = new Map([
	["minimal-working-system", 0],
	["externally-safe-operationally-supportable", 1],
	["full-target-system", 2]
]);
var SAFETY_ITEM_CLASS_PRIORITY = new Map([
	["control_guardrail", 0],
	["operational_enablement", 1],
	["documentation_support_enablement", 1],
	["capability_seam", 2],
	["feature_slice", 2],
	["migration", 2],
	["retirement", 2],
	["spike_discovery", 2]
]);
var ECONOMIC_TIE_BREAK_GROUPS = [
	["compliance_deadline"],
	["risk_burn_down"],
	["dependency_unlock"],
	["cost_of_delay"],
	["user_value", "ops_pain_reduction"],
	["learning_value"],
	["reversibility"],
	["lead_time_risk"],
	["strategic_fit"]
];
function getEconomicFactorsForItem(item) {
	switch (item.value?.slice_value_kind) {
		case "user_value": return [
			"strategic_fit",
			"dependency_unlock",
			"user_value",
			"cost_of_delay"
		];
		case "control_closure": return [
			"risk_burn_down",
			"compliance_deadline",
			"dependency_unlock"
		];
		case "risk_retirement": return [
			"risk_burn_down",
			"ops_pain_reduction",
			"lead_time_risk"
		];
		default: return ["strategic_fit"];
	}
}
function getSafetyPriority(entry) {
	const trackId = entry.track_ref?.id ?? "";
	return [SAFETY_TRACK_PRIORITY.get(trackId) ?? Number.MAX_SAFE_INTEGER, trackId === "externally-safe-operationally-supportable" ? SAFETY_ITEM_CLASS_PRIORITY.get(entry.item_class ?? "") ?? Number.MAX_SAFE_INTEGER : 0];
}
function compareEconomicPriority(left, right) {
	const leftFactors = new Set(asArray(left.economic_factors).filter(isNonEmptyString));
	const rightFactors = new Set(asArray(right.economic_factors).filter(isNonEmptyString));
	for (const factorGroup of ECONOMIC_TIE_BREAK_GROUPS) {
		const leftHas = factorGroup.some((factor) => leftFactors.has(factor));
		if (leftHas === factorGroup.some((factor) => rightFactors.has(factor))) continue;
		return leftHas ? -1 : 1;
	}
	return 0;
}
function dependencyRefKey(ref) {
	return `${ref?.kind ?? "unknown"}:${ref?.id ?? "unknown"}`;
}
function relationRef(ref) {
	return ref?.kind === "item" && isNonEmptyString(ref.id);
}
function collectRelationsByItem(relations) {
	const incoming = /* @__PURE__ */ new Map();
	const outgoing = /* @__PURE__ */ new Map();
	for (const relation of relations) {
		if (relationRef(relation.from)) {
			const current = outgoing.get(relation.from.id) ?? [];
			current.push(relation);
			outgoing.set(relation.from.id, current);
		}
		if (relationRef(relation.to)) {
			const current = incoming.get(relation.to.id) ?? [];
			current.push(relation);
			incoming.set(relation.to.id, current);
		}
	}
	return {
		incoming,
		outgoing
	};
}
function collectTopologyPredecessors(item, incoming) {
	const predecessors = /* @__PURE__ */ new Set();
	for (const relation of incoming) if (relationRef(relation.from) && (relation.relation_type === "decomposes_into" || relation.relation_type === "depends_on")) predecessors.add(relation.from.id);
	for (const dependencyRef of asArray(item.dependency_refs)) if (isNonEmptyString(dependencyRef)) predecessors.add(dependencyRef);
	return [...predecessors];
}
function buildTopologyRanks(items, incomingByItemId) {
	const itemIds = items.map((item) => item.item_id).filter(isNonEmptyString);
	const orderIndex = new Map(itemIds.map((id, index) => [id, index]));
	const predecessorsByItemId = /* @__PURE__ */ new Map();
	const successorsByItemId = /* @__PURE__ */ new Map();
	const indegreeByItemId = /* @__PURE__ */ new Map();
	for (const item of items) {
		if (!isNonEmptyString(item.item_id)) continue;
		const predecessors = new Set(collectTopologyPredecessors(item, incomingByItemId.get(item.item_id) ?? []));
		predecessorsByItemId.set(item.item_id, predecessors);
		indegreeByItemId.set(item.item_id, predecessors.size);
		if (!successorsByItemId.has(item.item_id)) successorsByItemId.set(item.item_id, /* @__PURE__ */ new Set());
		for (const predecessor of predecessors) {
			const successors = successorsByItemId.get(predecessor) ?? /* @__PURE__ */ new Set();
			successors.add(item.item_id);
			successorsByItemId.set(predecessor, successors);
		}
	}
	const ready = itemIds.filter((itemId) => (indegreeByItemId.get(itemId) ?? 0) === 0).sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
	const ordered = [];
	while (ready.length > 0) {
		const current = ready.shift();
		if (!current) continue;
		ordered.push(current);
		for (const successor of successorsByItemId.get(current) ?? []) {
			const nextIndegree = (indegreeByItemId.get(successor) ?? 0) - 1;
			indegreeByItemId.set(successor, nextIndegree);
			if (nextIndegree === 0) {
				ready.push(successor);
				ready.sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
			}
		}
	}
	for (const itemId of itemIds) if (!ordered.includes(itemId)) ordered.push(itemId);
	return new Map(ordered.map((itemId, index) => [itemId, index + 1]));
}
function stableGraphRefList(refs) {
	const seen = /* @__PURE__ */ new Set();
	const ordered = [];
	for (const ref of refs) {
		const key = dependencyRefKey(ref);
		if (seen.has(key)) continue;
		seen.add(key);
		ordered.push(ref);
	}
	return ordered;
}
function buildDependencyEntries(item, outgoing) {
	const dependencyEntries = [];
	for (const dependencyRef of asArray(item.dependency_refs)) {
		if (!isNonEmptyString(dependencyRef)) continue;
		dependencyEntries.push({
			ref: graphRef("item", dependencyRef),
			dependency_type: "depends_on"
		});
	}
	for (const relation of outgoing) if (relation.relation_type === "depends_on" && relationRef(relation.to)) dependencyEntries.push({
		ref: relation.to,
		dependency_type: "depends_on"
	});
	return stableGraphRefList(dependencyEntries.map((entry) => entry.ref).filter((entry) => entry !== void 0)).map((ref) => ({
		ref,
		dependency_type: "depends_on"
	}));
}
function buildRoadmapMatrix(items, relations) {
	const { incoming, outgoing } = collectRelationsByItem(relations);
	const topologyRanks = buildTopologyRanks(items, incoming);
	const rows = items.filter((item) => isNonEmptyString(item.item_id) && isNonEmptyString(item.track_id) && isNonEmptyString(item.item_class)).map((item) => {
		const incomingRelations = incoming.get(item.item_id) ?? [];
		const outgoingRelations = outgoing.get(item.item_id) ?? [];
		const parentRefs = stableGraphRefList(incomingRelations.filter((relation) => relation.relation_type === "decomposes_into" && relationRef(relation.from)).map((relation) => relation.from).filter((ref) => ref !== void 0));
		const childRefs = stableGraphRefList(outgoingRelations.filter((relation) => relation.relation_type === "decomposes_into" && relationRef(relation.to)).map((relation) => relation.to).filter((ref) => ref !== void 0));
		const dependencyEntries = buildDependencyEntries(item, outgoingRelations);
		const dependencyRefs = dependencyEntries.map((entry) => entry.ref).filter((entry) => entry !== void 0);
		const retirementRelation = outgoingRelations.find((relation) => relation.relation_type === "retires" && relation.to && isNonEmptyString(relation.to.id));
		return {
			row_id: `roadmap-${item.item_id}`,
			item_ref: graphRef("item", item.item_id),
			item_class: item.item_class,
			parent_refs: parentRefs,
			child_refs: childRefs,
			track_ref: graphRef("track", item.track_id),
			dependency_refs: dependencyRefs,
			dependency_type: dependencyEntries.length > 0 ? "depends_on" : "entry",
			dependency_entries: dependencyEntries,
			...item.milestone !== void 0 ? { milestone: item.milestone } : {},
			...item.backlog_protocol_state !== void 0 ? { backlog_protocol_state: item.backlog_protocol_state } : {},
			...item.delivery_state !== void 0 ? { delivery_state: item.delivery_state } : {},
			...item.readiness_state !== void 0 ? { readiness_state: item.readiness_state } : {},
			...item.closure_state !== void 0 ? { closure_state: item.closure_state } : {},
			...item.summary_label !== void 0 ? { summary_label: item.summary_label } : {},
			...item.economic_priority_note !== void 0 ? { economic_priority_note: item.economic_priority_note } : {},
			economic_factors: getEconomicFactorsForItem(item),
			...item.proof_refs !== void 0 ? { proof_refs: item.proof_refs } : {},
			retirement_ref: retirementRelation?.to ?? null,
			topology_rank: topologyRanks.get(item.item_id) ?? Number.MAX_SAFE_INTEGER,
			safety_rank: Number.MAX_SAFE_INTEGER,
			economic_rank: Number.MAX_SAFE_INTEGER
		};
	});
	const safetyOrdered = [...rows].sort((left, right) => {
		const [leftTrackPriority, leftItemPriority] = getSafetyPriority(left);
		const [rightTrackPriority, rightItemPriority] = getSafetyPriority(right);
		if (leftTrackPriority !== rightTrackPriority) return leftTrackPriority - rightTrackPriority;
		if (leftItemPriority !== rightItemPriority) return leftItemPriority - rightItemPriority;
		if ((left.topology_rank ?? 0) !== (right.topology_rank ?? 0)) return (left.topology_rank ?? 0) - (right.topology_rank ?? 0);
		return String(left.item_ref?.id ?? "").localeCompare(String(right.item_ref?.id ?? ""));
	});
	const safetyRankByItemId = new Map(safetyOrdered.map((entry, index) => [entry.item_ref?.id, index + 1]).filter((entry) => isNonEmptyString(entry[0])));
	const economicOrdered = [...rows].sort((left, right) => {
		const precedence = compareEconomicPriority(left, right);
		if (precedence !== 0) return precedence;
		const leftSafetyRank = safetyRankByItemId.get(left.item_ref?.id ?? "") ?? Number.MAX_SAFE_INTEGER;
		const rightSafetyRank = safetyRankByItemId.get(right.item_ref?.id ?? "") ?? Number.MAX_SAFE_INTEGER;
		if (leftSafetyRank !== rightSafetyRank) return leftSafetyRank - rightSafetyRank;
		if ((left.topology_rank ?? Number.MAX_SAFE_INTEGER) !== (right.topology_rank ?? Number.MAX_SAFE_INTEGER)) return (left.topology_rank ?? Number.MAX_SAFE_INTEGER) - (right.topology_rank ?? Number.MAX_SAFE_INTEGER);
		return String(left.item_ref?.id ?? "").localeCompare(String(right.item_ref?.id ?? ""));
	});
	const economicRankByItemId = new Map(economicOrdered.map((entry, index) => [entry.item_ref?.id, index + 1]).filter((entry) => isNonEmptyString(entry[0])));
	return rows.map((entry) => ({
		...entry,
		safety_rank: safetyRankByItemId.get(entry.item_ref?.id ?? "") ?? Number.MAX_SAFE_INTEGER,
		economic_rank: economicRankByItemId.get(entry.item_ref?.id ?? "") ?? Number.MAX_SAFE_INTEGER
	}));
}
//#endregion
//#region src/discovery/repair-run.ts
function deriveSummaryLabel(backlogProtocolState, deliveryState, readinessState, closureState, blocked) {
	if (blocked) return "Blocked";
	if (deliveryState === "delivered" && closureState === "closed") return "Implemented";
	if (deliveryState === "partially_delivered" || closureState === "partial") return "Partially implemented";
	if (readinessState === "needs_clarification") return "Needs clarification";
	if (backlogProtocolState === "candidate" && deliveryState === "not_started" && readinessState === "not_ready") return "Missing";
	return "Planned";
}
function blockedState(backlogRecord) {
	const planningConstraints = backlogRecord.planning_constraints;
	return typeof planningConstraints === "object" && planningConstraints !== null && planningConstraints.blocked_by_decision_status === true || isNonEmptyString(backlogRecord.blocked_without);
}
function syncTrackDerivedRefs(backlog, appliedRepairs) {
	const journeyIdsByTrackId = /* @__PURE__ */ new Map();
	for (const journey of backlog.track_journeys) {
		if (!isNonEmptyString(journey.track_id) || !isNonEmptyString(journey.journey_id)) continue;
		const current = journeyIdsByTrackId.get(journey.track_id) ?? [];
		current.push(journey.journey_id);
		journeyIdsByTrackId.set(journey.track_id, current);
	}
	const gateIdsByTrackId = /* @__PURE__ */ new Map();
	for (const gate of backlog.track_gates) {
		if (!isNonEmptyString(gate.track_id) || !isNonEmptyString(gate.track_gate_id)) continue;
		const current = gateIdsByTrackId.get(gate.track_id) ?? [];
		current.push(gate.track_gate_id);
		gateIdsByTrackId.set(gate.track_id, current);
	}
	const trackProofIdsByTrackId = /* @__PURE__ */ new Map();
	for (const trackProof of backlog.track_proofs) {
		if (!isNonEmptyString(trackProof.track_id) || !isNonEmptyString(trackProof.track_proof_id)) continue;
		const current = trackProofIdsByTrackId.get(trackProof.track_id) ?? [];
		current.push(trackProof.track_proof_id);
		trackProofIdsByTrackId.set(trackProof.track_id, current);
	}
	for (const track of backlog.tracks) {
		const derivedJourneyIds = [...new Set(journeyIdsByTrackId.get(track.track_id) ?? [])];
		const derivedGateIds = [...new Set(gateIdsByTrackId.get(track.track_id) ?? [])];
		const derivedTrackProofIds = [...new Set(trackProofIdsByTrackId.get(track.track_id) ?? [])];
		const currentJourneyIds = [...new Set(asArray(track.first_shippable_journey_ids).filter(isNonEmptyString))];
		if (JSON.stringify(currentJourneyIds) !== JSON.stringify(derivedJourneyIds)) {
			track.first_shippable_journey_ids = derivedJourneyIds;
			appliedRepairs.push(`track:${track.track_id}:first_shippable_journey_ids`);
		}
		const currentGateIds = [...new Set(asArray(track.required_track_gate_ids).filter(isNonEmptyString))];
		if (JSON.stringify(currentGateIds) !== JSON.stringify(derivedGateIds)) {
			track.required_track_gate_ids = derivedGateIds;
			appliedRepairs.push(`track:${track.track_id}:required_track_gate_ids`);
		}
		const currentTrackProofIds = [...new Set(asArray(track.track_proof_refs).filter(isNonEmptyString))];
		if (JSON.stringify(currentTrackProofIds) !== JSON.stringify(derivedTrackProofIds)) {
			track.track_proof_refs = derivedTrackProofIds;
			appliedRepairs.push(`track:${track.track_id}:track_proof_refs`);
		}
	}
}
function repairBacklogCanonicalState(backlog) {
	const appliedRepairs = [];
	for (const item of backlog.items) {
		if (!isNonEmptyString(item.item_id)) continue;
		const derivedSummaryLabel = deriveSummaryLabel(item.backlog_protocol_state, item.delivery_state, item.readiness_state, item.closure_state, blockedState(item));
		if (item.summary_label !== derivedSummaryLabel) {
			item.summary_label = derivedSummaryLabel;
			appliedRepairs.push(`item:${item.item_id}:summary_label`);
		}
	}
	for (const track of backlog.tracks) {
		const derivedSummaryLabel = deriveSummaryLabel(track.backlog_protocol_state, track.delivery_state, track.readiness_state, track.closure_state, false);
		if (track.summary_label !== derivedSummaryLabel) {
			track.summary_label = derivedSummaryLabel;
			appliedRepairs.push(`track:${track.track_id}:summary_label`);
		}
	}
	syncTrackDerivedRefs(backlog, appliedRepairs);
	const derivedRoadmapMatrix = buildRoadmapMatrix(backlog.items, backlog.relations);
	if (JSON.stringify(backlog.roadmap_matrix) !== JSON.stringify(derivedRoadmapMatrix)) {
		backlog.roadmap_matrix = derivedRoadmapMatrix;
		appliedRepairs.push("roadmap_matrix:rebuilt");
	}
	if (appliedRepairs.length > 0) backlog.metadata.updated_at = utcNow();
	return {
		appliedRepairs,
		backlog,
		changed: appliedRepairs.length > 0
	};
}
function repairDiscoveryRun(runDirInput) {
	const bundleRepair = repairCompactRunBundle(runDirInput);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		appliedRepairs: [],
		backlog: null,
		manifest: null,
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {},
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	if (!bundleRepair.hasAnyCanonicalArtifacts) return {
		appliedRepairs: [],
		backlog: null,
		manifest: null,
		missingArtifacts: [runPaths(runDirInput).backlog],
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: []
	};
	if (bundleRepair.irreparableMissingArtifacts.length > 0) return {
		appliedRepairs: [],
		backlog: null,
		manifest: null,
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	const { backlog, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) return {
		appliedRepairs: [],
		backlog: null,
		manifest: null,
		...legacyLayoutMessage ? { legacyLayoutMessage } : {},
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	if (!backlog || !manifest) return {
		appliedRepairs: [],
		backlog: null,
		manifest: null,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const repairResult = repairBacklogCanonicalState(backlog);
	const repairedAt = utcNow();
	const paths = runPaths(runDir);
	if (repairResult.changed) {
		manifest.updated_at = repairedAt;
		if (manifest.phase_state === "initialized") manifest.phase_state = "graph_built";
		writeJson(paths.backlog, backlog);
		writeJson(paths.manifest, manifest);
		appendNdjson(paths.journal, {
			ts: repairedAt,
			event: "canonical_repaired",
			run_id: manifest.run_id,
			applied_repairs: repairResult.appliedRepairs
		});
	}
	return {
		appliedRepairs: repairResult.appliedRepairs,
		backlog,
		manifest,
		missingArtifacts: [],
		repairedAt,
		runDir,
		unsupportedSchemaMessages: []
	};
}
//#endregion
//#region src/discovery/render-views.ts
function escapeCell(value) {
	if (value === null || value === void 0) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value).replace(/\|/g, "\\|");
	return (JSON.stringify(value) ?? "").replace(/\|/g, "\\|");
}
function itemSort(left, right) {
	return String(left.item_id ?? "").localeCompare(String(right.item_id ?? ""));
}
function stringValues(values) {
	return values.filter((value) => typeof value === "string" && value.length > 0);
}
function getRecordStringArray(record, key) {
	return Array.isArray(record[key]) ? stringValues(record[key]) : [];
}
function targetSystemIsPopulated(backlog) {
	return backlog.target_system.actors.length > 0 && backlog.target_system.operator_personas.length > 0 && backlog.target_system.external_consumer_groups.length > 0 && backlog.target_system.external_dependencies.length > 0 && backlog.target_system.trust_boundaries.length > 0 && backlog.target_system.durable_state_families.length > 0 && backlog.target_system.control_surfaces.length > 0 && backlog.target_system.failure_domains.length > 0 && backlog.target_system.team_and_ownership_assumptions.length > 0 && backlog.target_system.quality_goals.length > 0 && backlog.target_system.policy_surfaces.length > 0;
}
function asBuiltIsPopulated(backlog) {
	return backlog.as_built.deployable_surfaces.length > 0 && backlog.as_built.services.length > 0 && backlog.as_built.processes.length > 0 && backlog.as_built.jobs.length > 0 && backlog.as_built.apis.length > 0 && backlog.as_built.event_surfaces.length > 0 && backlog.as_built.queues.length > 0 && backlog.as_built.state_stores.length > 0 && backlog.as_built.deployable_units.length > 0 && backlog.as_built.ownership_matrix.length > 0 && backlog.as_built.environment_matrix.length > 0 && backlog.as_built.ingress_interfaces.length > 0 && backlog.as_built.egress_interfaces.length > 0 && backlog.as_built.canonical_writers.length > 0 && backlog.as_built.trust_boundary_crossings.length > 0 && backlog.as_built.data_classes.length > 0 && backlog.as_built.dependency_classifications.length > 0 && backlog.as_built.vendor_external_owners.length > 0;
}
function renderRunSummary(manifest, assessment) {
	return [
		"## Run Summary",
		"",
		`- Run ID: ${manifest.run_id}`,
		`- Phase state: ${manifest.phase_state}`,
		`- Acceptance target: ${manifest.acceptance_target}`,
		`- Achieved acceptance: ${assessment.acceptance.achieved}`,
		`- Target satisfied: ${assessment.acceptance.target_satisfied ? "Yes" : "No"}`,
		`- Assessment status: ${assessment.status}`,
		`- Closure status: ${assessment.closure.status}`,
		`- Score: ${assessment.score.total}/${assessment.score.max}`,
		`- Last assessed at: ${assessment.assessed_at}`,
		""
	];
}
function renderSourceAuthority(backlog) {
	const lines = [
		"## Source Authority",
		"",
		"| Source ID | Kind | Authority | Precedence | Reference | Fingerprint | Notes |",
		"| --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const source of backlog.source_authority) lines.push(`| ${escapeCell(source.source_id)} | ${escapeCell(source.kind)} | ${escapeCell(source.authority)} | ${escapeCell(source.precedence ?? "")} | ${escapeCell(source.ref)} | ${escapeCell(source.fingerprint ?? "")} | ${escapeCell(source.notes ?? "")} |`);
	if (backlog.source_authority.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderSourceExclusions(backlog) {
	const lines = [
		"## Source Exclusions",
		"",
		"| Source ID | Reason | Superseded By |",
		"| --- | --- | --- |"
	];
	for (const exclusion of backlog.source_exclusions) lines.push(`| ${escapeCell(exclusion.source_id)} | ${escapeCell(exclusion.reason)} | ${escapeCell(asArray(exclusion.superseded_by).join(", "))} |`);
	if (backlog.source_exclusions.length === 0) lines.push("| _none_ |  |  |");
	return [...lines, ""];
}
function renderKeyedListSection(title, entries) {
	const lines = [
		title,
		"",
		"| Field | Values |",
		"| --- | --- |"
	];
	for (const [label, values] of entries) lines.push(`| ${escapeCell(label)} | ${escapeCell(values.join("; "))} |`);
	return [...lines, ""];
}
function renderTargetSystem(backlog) {
	return renderKeyedListSection("## Target System", [
		["Actors", backlog.target_system.actors],
		["Operator personas", backlog.target_system.operator_personas],
		["External consumer groups", backlog.target_system.external_consumer_groups],
		["External dependencies", backlog.target_system.external_dependencies],
		["Trust boundaries", backlog.target_system.trust_boundaries],
		["Durable state families", backlog.target_system.durable_state_families],
		["Control surfaces", backlog.target_system.control_surfaces],
		["Failure domains", backlog.target_system.failure_domains],
		["Ownership assumptions", backlog.target_system.team_and_ownership_assumptions],
		["Quality goals", backlog.target_system.quality_goals],
		["Policy surfaces", backlog.target_system.policy_surfaces]
	]);
}
function renderAsBuilt(backlog) {
	const lines = renderKeyedListSection("## As-Built", [
		["Deployable surfaces", backlog.as_built.deployable_surfaces],
		["Services", backlog.as_built.services],
		["Processes", backlog.as_built.processes],
		["Jobs", backlog.as_built.jobs],
		["APIs", backlog.as_built.apis],
		["Event surfaces", backlog.as_built.event_surfaces],
		["Queues", backlog.as_built.queues],
		["State stores", backlog.as_built.state_stores],
		["Deployable units", backlog.as_built.deployable_units],
		["Ownership matrix", backlog.as_built.ownership_matrix],
		["Environment matrix", backlog.as_built.environment_matrix],
		["Ingress interfaces", backlog.as_built.ingress_interfaces],
		["Egress interfaces", backlog.as_built.egress_interfaces],
		["Canonical writers", backlog.as_built.canonical_writers],
		["Trust-boundary crossings", backlog.as_built.trust_boundary_crossings],
		["Data classes", backlog.as_built.data_classes],
		["Synthetic behaviors", backlog.as_built.synthetic_behaviors],
		["Compatibility-only behaviors", backlog.as_built.compatibility_only_behaviors],
		["Vendor / external owners", backlog.as_built.vendor_external_owners],
		["Missing operational inputs", backlog.as_built.missing_operational_inputs]
	]);
	lines.splice(lines.length - 1, 0, "### Dependency Classifications", "", "| Dependency | Criticality | Owner |", "| --- | --- | --- |");
	for (const dependency of backlog.as_built.dependency_classifications) lines.splice(lines.length - 1, 0, `| ${escapeCell(dependency.dependency_id ?? "")} | ${escapeCell(dependency.criticality ?? "")} | ${escapeCell(dependency.owner ?? "")} |`);
	if (backlog.as_built.dependency_classifications.length === 0) lines.splice(lines.length - 1, 0, "| _none_ |  |  |");
	return lines;
}
function renderValueStreams(backlog) {
	const lines = [
		"## Value Streams",
		"",
		"| Value Stream | Personas | Linked Tracks | Success Conditions |",
		"| --- | --- | --- | --- |"
	];
	for (const valueStream of backlog.value_streams) lines.push(`| ${escapeCell(valueStream.title ?? valueStream.value_stream_id ?? "")} | ${escapeCell(asArray(valueStream.primary_personas).join(", "))} | ${escapeCell(asArray(valueStream.linked_track_ids).join(", "))} | ${escapeCell(asArray(valueStream.success_conditions).join("; "))} |`);
	if (backlog.value_streams.length === 0) lines.push("| _none_ |  |  |  |");
	return [...lines, ""];
}
function renderFeatureCandidates(backlog) {
	const items = [...backlog.items].sort(itemSort);
	const lines = [
		"## Feature Candidates",
		"",
		"| Item ID | Class | Status | Track | Title | Owners | Proofs | Origins |",
		"| --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const item of items) {
		const owners = item.owners ? [item.owners.decision_owner, item.owners.delivery_owner].filter(Boolean).join(", ") : "";
		lines.push(`| ${escapeCell(item.item_id)} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label)} | ${escapeCell(item.track_id)} | ${escapeCell(item.title ?? item.capability_added ?? "")} | ${escapeCell(owners)} | ${escapeCell(asArray(item.proof_refs).join(", "))} | ${escapeCell(asArray(item.origin_ref).map(formatOriginRef).join(", "))} |`);
	}
	if (items.length === 0) lines.push("| _none_ |  |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderExtendedItemSchema(backlog) {
	const items = [...backlog.items].sort(itemSort);
	const lines = [
		"## Extended Item Schema",
		"",
		"| Item ID | ADRs | Policy Decisions | Actors / Roles | Value | Freshness SLA | Flags / Kill Switches |",
		"| --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const item of items) {
		const valueRecord = asStringRecord(item.value);
		const rolloutRecord = asStringRecord(item.rollout);
		const valueSummary = [
			valueRecord.persona_or_operator_served,
			valueRecord.product_or_operator_value,
			valueRecord.why_now
		].filter(isNonEmptyString).join(" / ");
		const flagSummary = [rolloutRecord.feature_flag, rolloutRecord.kill_switch].filter(isNonEmptyString).join(", ");
		lines.push(`| ${escapeCell(item.item_id)} | ${escapeCell(asArray(item.adr_refs).join(", "))} | ${escapeCell(asArray(item.policy_decision_refs).join(", "))} | ${escapeCell(asArray(item.actor_role_set).join(", "))} | ${escapeCell(valueSummary)} | ${escapeCell(item.evidence_freshness_sla ?? "")} | ${escapeCell(flagSummary)} |`);
	}
	if (items.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function getItemMap(backlog) {
	return new Map(backlog.items.filter((item) => typeof item.item_id === "string").map((item) => [item.item_id, item]));
}
function orderRoadmapRows(backlog) {
	return [...backlog.roadmap_matrix].sort((left, right) => {
		const topologyDelta = (left.topology_rank ?? Number.MAX_SAFE_INTEGER) - (right.topology_rank ?? Number.MAX_SAFE_INTEGER);
		if (topologyDelta !== 0) return topologyDelta;
		const safetyDelta = (left.safety_rank ?? Number.MAX_SAFE_INTEGER) - (right.safety_rank ?? Number.MAX_SAFE_INTEGER);
		if (safetyDelta !== 0) return safetyDelta;
		const economicDelta = (left.economic_rank ?? Number.MAX_SAFE_INTEGER) - (right.economic_rank ?? Number.MAX_SAFE_INTEGER);
		if (economicDelta !== 0) return economicDelta;
		return formatGraphRef(left.item_ref).localeCompare(formatGraphRef(right.item_ref));
	});
}
function renderRoadmap(backlog) {
	const itemMap = getItemMap(backlog);
	const ordered = orderRoadmapRows(backlog);
	const lines = [
		"## Roadmap",
		"",
		"| Topology | Safety | Economic | Item | Class | Track | States | Parents | Dependencies | Proofs | Retirement | Economics |",
		"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const row of ordered) {
		const itemId = row.item_ref?.id ?? "";
		const item = itemMap.get(itemId);
		const itemLabel = item ? item.title ?? item.item_id ?? "" : itemId;
		const states = [
			row.backlog_protocol_state,
			row.delivery_state,
			row.readiness_state,
			row.closure_state,
			row.summary_label
		].filter(isNonEmptyString).join(" / ");
		const dependencyEntries = asArray(row.dependency_entries).map((entry) => {
			const dependency = asStringRecord(entry);
			const dependencyRef = isGraphRef(dependency.ref) ? dependency.ref : void 0;
			const dependencyType = isNonEmptyString(dependency.dependency_type) ? dependency.dependency_type : "";
			return `${formatGraphRef(dependencyRef)} (${dependencyType})`;
		}).join("; ");
		lines.push(`| ${escapeCell(row.topology_rank ?? "")} | ${escapeCell(row.safety_rank ?? "")} | ${escapeCell(row.economic_rank ?? "")} | ${escapeCell(itemLabel)} | ${escapeCell(row.item_class ?? "")} | ${escapeCell(row.track_ref?.id ?? "")} | ${escapeCell(states)} | ${escapeCell(asArray(row.parent_refs).map(formatGraphRef).join(", "))} | ${escapeCell(dependencyEntries)} | ${escapeCell(asArray(row.proof_refs).join(", "))} | ${escapeCell(row.retirement_ref ? formatGraphRef(row.retirement_ref) : "")} | ${escapeCell((row.economic_factors ?? []).join(", "))}: ${escapeCell(row.economic_priority_note ?? "")} |`);
	}
	if (ordered.length === 0) lines.push("|  |  |  | _No roadmap rows yet_ |  |  |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderRoadmapMatrix(backlog) {
	const ordered = orderRoadmapRows(backlog);
	const lines = [
		"## Roadmap Matrix",
		"",
		"| Row | Item Ref | Track Ref | Dependency Entries | States | Proofs | Retirement |",
		"| --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const row of ordered) {
		const states = [
			row.backlog_protocol_state,
			row.delivery_state,
			row.readiness_state,
			row.closure_state,
			row.summary_label
		].filter(isNonEmptyString).join(" / ");
		const dependencyEntries = asArray(row.dependency_entries).map((entry) => {
			const record = asStringRecord(entry);
			const dependencyRef = isGraphRef(record.ref) ? record.ref : void 0;
			const dependencyTypeValue = record.dependency_type;
			return `${isNonEmptyString(dependencyTypeValue) ? dependencyTypeValue : ""}:${formatGraphRef(dependencyRef)}`;
		}).join("; ");
		lines.push(`| ${escapeCell(row.row_id ?? "")} | ${escapeCell(formatGraphRef(row.item_ref))} | ${escapeCell(formatGraphRef(row.track_ref))} | ${escapeCell(dependencyEntries)} | ${escapeCell(states)} | ${escapeCell(asArray(row.proof_refs).join(", "))} | ${escapeCell(row.retirement_ref ? formatGraphRef(row.retirement_ref) : "")} |`);
	}
	if (ordered.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderProofBundles(backlog, assessment) {
	const staleProofIds = new Set(assessment.stale_proofs);
	const lines = [
		"## Proof Bundles",
		"",
		"| Proof | Covers | Environment | Build | Fresh Until | Invalidated By | Status |",
		"| --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const proof of backlog.proofs) lines.push(`| ${escapeCell(proof.proof_id ?? "")} | ${escapeCell(formatGraphRef(proof.covered_ref))} | ${escapeCell(proof.environment ?? "")} | ${escapeCell(proof.covered_commit_or_build ?? "")} | ${escapeCell(proof.fresh_until ?? "")} | ${escapeCell(asArray(proof.invalidated_by).join(", "))} | ${escapeCell(staleProofIds.has(proof.proof_id ?? "") ? "stale" : "fresh_or_current")} |`);
	if (backlog.proofs.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function formatProofDimension(proof, dimensionKey) {
	const dimension = asStringRecord(asStringRecord(proof.dimensions)[dimensionKey]);
	const status = isNonEmptyString(dimension.status) ? dimension.status : "missing";
	const locator = [
		dimension.command,
		dimension.artifact,
		dimension.procedure
	].find(isNonEmptyString) ?? "";
	const justification = isNonEmptyString(dimension.justification) ? dimension.justification : "";
	const detail = locator || justification;
	return detail ? `${status}: ${detail}` : status;
}
function renderProofDimensions(backlog, assessment) {
	const staleProofIds = new Set(assessment.stale_proofs);
	const lines = [
		"## Proof Dimensions",
		"",
		"| Proof | Status | Architecture | Implementation | Verification | Security | Release | Rollback / Recovery | Operability |",
		"| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const proof of backlog.proofs) lines.push(`| ${escapeCell(proof.proof_id ?? "")} | ${escapeCell(staleProofIds.has(proof.proof_id ?? "") ? "stale" : "fresh_or_current")} | ${escapeCell(formatProofDimension(proof, "architecture_trace"))} | ${escapeCell(formatProofDimension(proof, "implementation_trace"))} | ${escapeCell(formatProofDimension(proof, "verification_trace"))} | ${escapeCell(formatProofDimension(proof, "security_trace"))} | ${escapeCell(formatProofDimension(proof, "release_trace"))} | ${escapeCell(formatProofDimension(proof, "rollback_or_recovery_trace"))} | ${escapeCell(formatProofDimension(proof, "operability_trace"))} |`);
	if (backlog.proofs.length === 0) lines.push("| _none_ |  |  |  |  |  |  |  |  |");
	return [...lines, ""];
}
function formatBooleanLedger(record, keys) {
	return keys.map((key) => `${key}=${record[key] === true ? "yes" : "no"}`).join("; ");
}
function formatKeyValueLedger(record) {
	return Object.entries(record).map(([key, value]) => `${key}=${value === true ? "yes" : value === false ? "no" : String(value)}`).join("; ");
}
function renderClosureEvidence(backlog, assessment) {
	const closedItems = backlog.items.filter((item) => item.closure_state === "closed");
	const staleProofIds = new Set(assessment.stale_proofs);
	const baselineDoneKeys = [
		"code_and_infra_complete",
		"tests_and_verification_complete",
		"dashboards_alerts_traces_logging_present",
		"runbooks_and_support_handoff_present",
		"migration_execution_or_safe_schedule_complete",
		"release_notes_and_docs_updated",
		"flags_and_kill_switches_governed",
		"temporary_mechanism_retirement_recorded"
	];
	const lines = [
		"## Closure Evidence",
		"",
		"| Item | Class | Baseline Done Checks | Class-Specific Done Checks | Proof Evidence | Exemptions |",
		"| --- | --- | --- | --- | --- | --- |"
	];
	for (const item of closedItems) {
		const done = asStringRecord(item.done_contract);
		const classSpecificChecks = formatKeyValueLedger(asStringRecord(done.class_specific_checks));
		const exemptions = formatKeyValueLedger(asStringRecord(done.exemptions));
		const proofEvidence = asArray(item.proof_refs).map((proofRef) => `${proofRef}:${staleProofIds.has(proofRef) ? "stale" : "fresh_or_current"}`).join("; ");
		lines.push(`| ${escapeCell(item.item_id ?? "")} | ${escapeCell(item.item_class ?? "")} | ${escapeCell(formatBooleanLedger(done, baselineDoneKeys))} | ${escapeCell(classSpecificChecks || "none")} | ${escapeCell(proofEvidence || "none")} | ${escapeCell(exemptions || "none")} |`);
	}
	if (closedItems.length === 0) lines.push("| _none_ |  |  |  |  |  |");
	return [...lines, ""];
}
function renderGapsAndValidation(assessment) {
	const lines = [
		"## Gaps And Validation",
		"",
		"### Hard Fails",
		""
	];
	if (assessment.hard_fails.length === 0) lines.push("- None");
	else for (const issue of assessment.hard_fails) lines.push(`- ${issue}`);
	lines.push("", "### Errors", "");
	if (assessment.errors.length === 0) lines.push("- None");
	else for (const error of assessment.errors) lines.push(`- ${error}`);
	lines.push("", "### Warnings", "");
	if (assessment.warnings.length === 0) lines.push("- None");
	else for (const warning of assessment.warnings) lines.push(`- ${warning}`);
	lines.push("", "### Lint Findings", "");
	if (assessment.lint_findings.length === 0) lines.push("- None");
	else for (const finding of assessment.lint_findings) lines.push(`- ${finding}`);
	lines.push("", "### Next Actions", "");
	if (assessment.next_actions.length === 0) lines.push("- None");
	else for (const action of assessment.next_actions) lines.push(`- ${action}`);
	return [...lines, ""];
}
function renderScoreSummary(assessment) {
	const lines = [
		"## Score Summary",
		"",
		"| Section | Score | Max | Reason |",
		"| --- | --- | --- | --- |"
	];
	for (const section of assessment.score.sections) lines.push(`| ${escapeCell(section.label)} | ${section.score} | ${section.max} | ${escapeCell(section.reason)} |`);
	if (assessment.score.sections.length === 0) lines.push("| _none_ | 0 | 0 | Assessment has not been scored yet. |");
	lines.push("", `Total score: **${assessment.score.total}/${assessment.score.max}**`, "");
	return lines;
}
function renderReviewAndClosure(assessment) {
	return [
		"## Review And Closure",
		"",
		`- Required review roles: ${assessment.required_review_roles.join(", ") || "None"}`,
		`- Present review roles: ${assessment.present_review_roles.join(", ") || "None"}`,
		`- Achieved acceptance: ${assessment.acceptance.achieved}`,
		`- Closure reason: ${assessment.closure.reason}`,
		"",
		"### Blocking Reasons",
		"",
		...assessment.acceptance.blocking_reasons.length === 0 ? ["- None"] : assessment.acceptance.blocking_reasons.map((reason) => `- ${reason}`),
		""
	];
}
function renderBackdrop(backlog) {
	const lines = ["## Context Coverage", ""];
	lines.push(`- Target-system model populated: ${targetSystemIsPopulated(backlog) ? "Yes" : "No"}`);
	lines.push(`- As-built model populated: ${asBuiltIsPopulated(backlog) ? "Yes" : "No"}`);
	lines.push(`- Value streams recorded: ${backlog.value_streams.length}`);
	lines.push(`- Track journeys recorded: ${backlog.track_journeys.length}`);
	lines.push(`- Track gates recorded: ${backlog.track_gates.length}`);
	lines.push(`- Claims recorded: ${backlog.claims.length}`);
	lines.push(`- Contracts recorded: ${backlog.contracts.length}`);
	lines.push(`- Data domains recorded: ${backlog.data_domains.length}`);
	lines.push(`- Proof bundles recorded: ${backlog.proofs.length}`);
	lines.push(`- Track proofs recorded: ${backlog.track_proofs.length}`);
	lines.push(`- Review artifacts recorded: ${backlog.reviews.length}`);
	lines.push(`- Waivers recorded: ${backlog.waivers.length}`);
	lines.push(`- Roadmap matrix entries: ${backlog.roadmap_matrix.length}`);
	lines.push("");
	return lines;
}
function renderTrackClosure(backlog) {
	const lines = [
		"## Track Closure",
		"",
		"| Track | First Shippable Journeys | Required Gates | Track Proofs |",
		"| --- | --- | --- | --- |"
	];
	for (const track of backlog.tracks) lines.push(`| ${escapeCell(track.title ?? track.track_id)} | ${escapeCell(asArray(track.first_shippable_journey_ids).join(", "))} | ${escapeCell(asArray(track.required_track_gate_ids).join(", "))} | ${escapeCell(asArray(track.track_proof_refs).join(", "))} |`);
	if (backlog.tracks.length === 0) lines.push("| _none_ |  |  |  |");
	return [...lines, ""];
}
function renderTrackJourneys(backlog) {
	const lines = [
		"## Track Journeys",
		"",
		"| Journey | Track | Value Stream | Persona | Trigger | Success Condition | Support Handoff |",
		"| --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const journey of backlog.track_journeys) lines.push(`| ${escapeCell(journey.journey_id ?? "")} | ${escapeCell(journey.track_id ?? "")} | ${escapeCell(journey.value_stream_id ?? "")} | ${escapeCell(journey.persona ?? "")} | ${escapeCell(journey.trigger ?? "")} | ${escapeCell(journey.success_condition ?? "")} | ${escapeCell(journey.support_handoff ?? "")} |`);
	if (backlog.track_journeys.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderTrackGates(backlog) {
	const lines = [
		"## Track Gates",
		"",
		"| Gate | Track | Type | Fail Mode | Governing Controls | Owners | Proofs | Recalculation Triggers |",
		"| --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const gate of backlog.track_gates) lines.push(`| ${escapeCell(gate.title ?? gate.track_gate_id ?? "")} | ${escapeCell(gate.track_id ?? "")} | ${escapeCell(gate.gate_type ?? "")} | ${escapeCell(gate.fail_mode ?? "")} | ${escapeCell(asArray(gate.governing_control_item_refs).join(", "))} | ${escapeCell(asArray(gate.owner_refs).join(", "))} | ${escapeCell(asArray(gate.required_proof_refs).join(", "))} | ${escapeCell(asArray(gate.recalculation_triggers).join(", "))} |`);
	if (backlog.track_gates.length === 0) lines.push("| _none_ |  |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderTrackProofs(backlog) {
	const lines = [
		"## Track Proofs",
		"",
		"| Track Proof | Track | Proof Refs | Closure Coverage |",
		"| --- | --- | --- | --- |"
	];
	for (const trackProof of backlog.track_proofs) {
		const coverage = Object.entries(trackProof.coverage ?? {}).map(([key, value]) => `${key}=${value === true ? "yes" : "no"}`).join(", ");
		lines.push(`| ${escapeCell(trackProof.track_proof_id ?? "")} | ${escapeCell(trackProof.track_id ?? "")} | ${escapeCell(asArray(trackProof.proof_refs).join(", "))} | ${escapeCell(coverage)} |`);
	}
	if (backlog.track_proofs.length === 0) lines.push("| _none_ |  |  |  |");
	return [...lines, ""];
}
function renderContractsAndDataDomains(backlog) {
	const lines = [
		"## Contract And Data Governance",
		"",
		"### Contracts",
		"",
		"| Contract | Owner | Versioning | Reconciliation | Deprecation Window | Retirement Condition |",
		"| --- | --- | --- | --- | --- | --- |"
	];
	for (const contract of backlog.contracts) lines.push(`| ${escapeCell(contract.contract_id ?? "")} | ${escapeCell(contract.owner ?? "")} | ${escapeCell(contract.versioning_strategy ?? "")} | ${escapeCell(contract.reconciliation_strategy ?? "")} | ${escapeCell(contract.deprecation_window ?? "")} | ${escapeCell(contract.retirement_condition ?? "")} |`);
	if (backlog.contracts.length === 0) lines.push("| _none_ |  |  |  |  |  |");
	lines.push("", "### Data Domains", "", "| Domain | Data Class | Owners |", "| --- | --- | --- |");
	for (const domain of backlog.data_domains) lines.push(`| ${escapeCell(domain.domain_id ?? "")} | ${escapeCell(domain.data_class ?? "")} | ${escapeCell(asArray(domain.owners).join(", "))} |`);
	if (backlog.data_domains.length === 0) lines.push("| _none_ |  |  |");
	return [...lines, ""];
}
function renderNfrAndObservability(backlog) {
	const lines = [
		"## NFR And Observability",
		"",
		"| Item | NFR Highlights | Observability Highlights |",
		"| --- | --- | --- |"
	];
	for (const item of backlog.items) {
		const nfr = asStringRecord(item.nfr_contract);
		const obs = asStringRecord(item.observability_contract);
		const nfrSummary = [
			nfr.latency,
			nfr.availability,
			nfr.durability,
			nfr.rpo,
			nfr.rto,
			nfr.privacy_compliance_class
		].filter((value) => typeof value === "string" && value.length > 0).join("; ");
		const obsSummary = [
			...getRecordStringArray(obs, "sli_slo"),
			...getRecordStringArray(obs, "alert_thresholds"),
			...getRecordStringArray(obs, "security_controls"),
			...getRecordStringArray(obs, "privacy_controls")
		].join("; ");
		lines.push(`| ${escapeCell(item.item_id ?? "")} | ${escapeCell(nfrSummary)} | ${escapeCell(obsSummary)} |`);
	}
	if (backlog.items.length === 0) lines.push("| _none_ |  |  |");
	return [...lines, ""];
}
function renderUncertaintyAndSpikes(backlog) {
	const lines = [
		"## Uncertainty And Spikes",
		"",
		"| Unknown | Severity | Related Items | Spike | Spike Artifact | Follow-on Items |",
		"| --- | --- | --- | --- | --- | --- |"
	];
	const spikesById = new Map(backlog.items.filter((item) => typeof item.item_id === "string" && item.item_class === "spike_discovery").map((item) => [item.item_id, item]));
	for (const unknown of backlog.unknowns) {
		const mapping = backlog.uncertainty_to_spike.find((entry) => entry.unknown_id === unknown.issue_id);
		const spike = mapping?.spike_item_id ? spikesById.get(mapping.spike_item_id) : void 0;
		const spikePayload = asStringRecord(spike?.class_payload);
		const followOns = Array.isArray(spikePayload.follow_on_item_refs) ? spikePayload.follow_on_item_refs : asArray(spike?.follow_on_item_refs);
		lines.push(`| ${escapeCell(unknown.issue_id ?? "")} | ${escapeCell(unknown.severity ?? "")} | ${escapeCell(asArray(unknown.related_item_refs).join(", "))} | ${escapeCell(mapping?.spike_item_id ?? "")} | ${escapeCell(typeof spikePayload.expected_artifact === "string" && spikePayload.expected_artifact || spike?.expected_artifact || "")} | ${escapeCell(followOns.join(", "))} |`);
	}
	if (backlog.unknowns.length === 0) lines.push("| _none_ |  |  |  |  |  |");
	return [...lines, ""];
}
function renderGraphRelations(backlog) {
	const lines = [
		"## Graph Relations",
		"",
		"| Relation | From | To |",
		"| --- | --- | --- |"
	];
	for (const relation of backlog.relations) lines.push(`| ${escapeCell(relation.relation_type)} | ${escapeCell(formatGraphRef(relation.from))} | ${escapeCell(formatGraphRef(relation.to))} |`);
	if (backlog.relations.length === 0) lines.push("| _none_ |  |  |");
	return [...lines, ""];
}
function collectSourceAuthorityState(backlog) {
	const sourceIds = /* @__PURE__ */ new Set();
	const excludedSourceIds = /* @__PURE__ */ new Set();
	for (const source of backlog.source_authority) {
		if (typeof source.source_id !== "string" || source.source_id.length === 0) continue;
		sourceIds.add(source.source_id);
		if (source.authority === "superseded_excluded") excludedSourceIds.add(source.source_id);
	}
	for (const exclusion of backlog.source_exclusions) if (typeof exclusion.source_id === "string" && exclusion.source_id.length > 0) excludedSourceIds.add(exclusion.source_id);
	return {
		sourceIds,
		excludedSourceIds
	};
}
function collectReviewFindingIds(backlog) {
	const reviewFindingIds = /* @__PURE__ */ new Set();
	for (const review of backlog.reviews) for (const collection of [review.findings, review.hard_fail_report]) for (const finding of asArray(collection)) if (typeof finding === "object" && finding !== null && typeof finding.finding_id === "string" && finding.finding_id.length > 0) reviewFindingIds.add(finding.finding_id);
	return reviewFindingIds;
}
function renderClaims(backlog) {
	const lines = [
		"## Claims",
		"",
		"| Claim ID | Class | Commitment | Source Refs | ADR Refs | Revisit Trigger |",
		"| --- | --- | --- | --- | --- | --- |"
	];
	for (const claim of backlog.claims) lines.push(`| ${escapeCell(claim.claim_id ?? "")} | ${escapeCell(claim.claim_class ?? "")} | ${escapeCell(claim.commitment ?? "")} | ${escapeCell(asArray(claim.source_refs).join(", "))} | ${escapeCell(asArray(claim.adr_refs).join(", "))} | ${escapeCell(claim.revisit_trigger ?? "")} |`);
	if (backlog.claims.length === 0) lines.push("| _none_ |  |  |  |  |  |");
	return [...lines, ""];
}
function renderIssueLedgers(backlog) {
	const lines = [
		"## Issue Ledgers",
		"",
		"| Ledger | Issue ID | Severity | Resolution | Fail-Closed Category | Sources | Related Claims | Related Items |",
		"| --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const [ledgerName, entries] of [
		["Gap", backlog.gaps],
		["Contradiction", backlog.contradictions],
		["Unknown", backlog.unknowns]
	]) for (const entry of entries) lines.push(`| ${ledgerName} | ${escapeCell(entry.issue_id ?? "")} | ${escapeCell(entry.severity ?? "")} | ${escapeCell(entry.resolution_state ?? "")} | ${escapeCell(entry.fail_closed_category === true ? "yes" : "")} | ${escapeCell(asArray(entry.source_refs).join(", "))} | ${escapeCell(asArray(entry.related_claim_refs).join(", "))} | ${escapeCell(asArray(entry.related_item_refs).join(", "))} |`);
	if (backlog.gaps.length === 0 && backlog.contradictions.length === 0 && backlog.unknowns.length === 0) lines.push("| _none_ |  |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderTraceability(backlog) {
	const { sourceIds, excludedSourceIds } = collectSourceAuthorityState(backlog);
	const claimIds = new Set(backlog.claims.map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0));
	const policyDecisionIds = new Set(backlog.policy_decisions.map((decision) => decision.policy_decision_id).filter((decisionId) => typeof decisionId === "string" && decisionId.length > 0));
	const gapIds = new Set(backlog.gaps.map((gap) => gap.issue_id).filter((gapId) => typeof gapId === "string" && gapId.length > 0));
	const unknownIds = new Set(backlog.unknowns.map((unknown) => unknown.issue_id).filter((unknownId) => typeof unknownId === "string" && unknownId.length > 0));
	const controlObligationClaimIds = new Set(backlog.claims.filter((claim) => claim.claim_class === "control_obligation").map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0));
	const decommissionNeedClaimIds = new Set(backlog.claims.filter((claim) => claim.claim_class === "retirement").map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0));
	const reviewFindingIds = collectReviewFindingIds(backlog);
	const committedClaims = backlog.claims.filter((claim) => claim.commitment === "committed");
	const validClaimsWithSources = backlog.claims.filter((claim) => {
		const sourceRefs = asArray(claim.source_refs);
		return sourceRefs.length > 0 && sourceRefs.every((sourceRef) => sourceIds.has(sourceRef) && !excludedSourceIds.has(sourceRef));
	});
	const itemsWithDeclaredOrigins = backlog.items.filter((item) => asArray(item.origin_ref).length > 0);
	const itemsWithClaimRefs = backlog.items.filter((item) => asArray(item.claim_refs).length > 0);
	const mappedClaimIds = /* @__PURE__ */ new Set();
	const itemsWithResolvedOrigins = /* @__PURE__ */ new Set();
	const claimsWithInvalidSources = [];
	const claimsWithExcludedSources = [];
	const itemsWithUnresolvedOrigins = [];
	for (const claim of backlog.claims) {
		if (typeof claim.claim_id !== "string" || claim.claim_id.length === 0) continue;
		const sourceRefs = asArray(claim.source_refs);
		if (sourceRefs.some((sourceRef) => !sourceIds.has(sourceRef))) claimsWithInvalidSources.push(claim.claim_id);
		else if (sourceRefs.some((sourceRef) => excludedSourceIds.has(sourceRef))) claimsWithExcludedSources.push(claim.claim_id);
	}
	for (const item of backlog.items) {
		const itemId = typeof item.item_id === "string" ? item.item_id : null;
		for (const claimRef of asArray(item.claim_refs)) if (claimIds.has(claimRef)) mappedClaimIds.add(claimRef);
		let allOriginsResolved = asArray(item.origin_ref).length > 0;
		for (const origin of asArray(item.origin_ref)) {
			if (typeof origin.ref !== "string" || typeof origin.kind !== "string") {
				allOriginsResolved = false;
				continue;
			}
			let originResolved = false;
			switch (origin.kind) {
				case "claim_ref":
					originResolved = claimIds.has(origin.ref);
					break;
				case "gap_ref":
					originResolved = gapIds.has(origin.ref);
					break;
				case "control_obligation_ref":
					originResolved = controlObligationClaimIds.has(origin.ref);
					break;
				case "policy_decision_ref":
					originResolved = policyDecisionIds.has(origin.ref);
					break;
				case "decommission_need_ref":
					originResolved = decommissionNeedClaimIds.has(origin.ref);
					break;
				case "review_finding_ref":
					originResolved = reviewFindingIds.has(origin.ref);
					break;
				case "unknown_ref":
					originResolved = unknownIds.has(origin.ref);
					break;
			}
			if (!originResolved) allOriginsResolved = false;
			if (originResolved && (origin.kind === "claim_ref" || origin.kind === "control_obligation_ref" || origin.kind === "decommission_need_ref")) mappedClaimIds.add(origin.ref);
		}
		if (itemId && allOriginsResolved) itemsWithResolvedOrigins.add(itemId);
		else if (itemId && asArray(item.origin_ref).length > 0) itemsWithUnresolvedOrigins.push(itemId);
	}
	const unmappedCommittedClaims = committedClaims.map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0).filter((claimId) => !mappedClaimIds.has(claimId));
	const claimsMissingSources = backlog.claims.filter((claim) => asArray(claim.source_refs).length === 0).map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0);
	const itemsMissingOrigins = backlog.items.filter((item) => asArray(item.origin_ref).length === 0).map((item) => item.item_id).filter((itemId) => typeof itemId === "string" && itemId.length > 0);
	const lines = [
		"## Traceability",
		"",
		`- Claims with valid canonical source refs: ${validClaimsWithSources.length}/${backlog.claims.length}`,
		`- Committed claims mapped to items: ${committedClaims.length - unmappedCommittedClaims.length}/${committedClaims.length}`,
		`- Items with declared origin refs: ${itemsWithDeclaredOrigins.length}/${backlog.items.length}`,
		`- Items with fully resolved origin refs: ${itemsWithResolvedOrigins.size}/${backlog.items.length}`,
		`- Items with explicit claim refs: ${itemsWithClaimRefs.length}/${backlog.items.length}`,
		"",
		"### Traceability Gaps",
		""
	];
	const gaps = [];
	if (claimsMissingSources.length > 0) gaps.push(`Claims missing source refs: ${claimsMissingSources.join(", ")}`);
	if (claimsWithInvalidSources.length > 0) gaps.push(`Claims with invalid source refs: ${claimsWithInvalidSources.join(", ")}`);
	if (claimsWithExcludedSources.length > 0) gaps.push(`Claims with excluded source refs: ${claimsWithExcludedSources.join(", ")}`);
	if (unmappedCommittedClaims.length > 0) gaps.push(`Committed claims not mapped to items: ${unmappedCommittedClaims.join(", ")}`);
	if (itemsMissingOrigins.length > 0) gaps.push(`Items missing origin refs: ${itemsMissingOrigins.join(", ")}`);
	if (itemsWithUnresolvedOrigins.length > 0) gaps.push(`Items with unresolved origin refs: ${itemsWithUnresolvedOrigins.join(", ")}`);
	if (gaps.length === 0) lines.push("- None");
	else for (const gap of gaps) lines.push(`- ${gap}`);
	lines.push("");
	return lines;
}
function renderApplicabilityAndExemptions(backlog) {
	const lines = [
		"## Applicability And Exemptions",
		"",
		"| Item | Rollout | Recovery | Readiness Exemptions | Done Exemptions |",
		"| --- | --- | --- | --- | --- |"
	];
	for (const item of backlog.items) {
		const rollout = asStringRecord(item.rollout);
		const recovery = asStringRecord(item.recovery);
		const readiness = asStringRecord(item.readiness_contract);
		const done = asStringRecord(item.done_contract);
		const readinessExemptions = Object.entries(asStringRecord(readiness.exemptions)).map(([key, value]) => `${key}: ${String(value)}`).join("; ");
		const doneExemptions = Object.entries(asStringRecord(done.exemptions)).map(([key, value]) => `${key}: ${String(value)}`).join("; ");
		const rolloutJustification = isNonEmptyString(rollout.justification) ? rollout.justification : "";
		const rolloutMode = isNonEmptyString(rollout.mode) ? rollout.mode : "";
		const rolloutLabel = rollout.applicability === "not_applicable" ? `not_applicable: ${rolloutJustification}` : rolloutMode;
		const recoveryJustification = isNonEmptyString(recovery.justification) ? recovery.justification : "";
		const recoveryClass = isNonEmptyString(recovery.class) ? recovery.class : "";
		const recoveryLabel = recovery.applicability === "not_applicable" ? `not_applicable: ${recoveryJustification}` : recoveryClass;
		lines.push(`| ${escapeCell(item.item_id ?? "")} | ${escapeCell(rolloutLabel)} | ${escapeCell(recoveryLabel)} | ${escapeCell(readinessExemptions)} | ${escapeCell(doneExemptions)} |`);
	}
	if (backlog.items.length === 0) lines.push("| _none_ |  |  |  |  |");
	return [...lines, ""];
}
function renderReviewGovernance(backlog, assessment) {
	const invalidWaiverIds = new Set(asArray(assessment.invalid_waiver_ids));
	const lines = [
		"## Review Governance",
		"",
		`- Required review roles: ${assessment.required_review_roles.join(", ") || "None"}`,
		`- Present review roles: ${assessment.present_review_roles.join(", ") || "None"}`,
		`- Missing review roles: ${assessment.missing_review_roles.join(", ") || "None"}`,
		`- Pending track-proof reviews: ${assessment.pending_track_proof_reviews.join(", ") || "None"}`,
		`- Waiver findings: ${assessment.waiver_findings.join("; ") || "None"}`,
		"",
		"### Reviews",
		"",
		"| Review | Scope | Reviewed Ref | Role | Independent | Verdict | Evidence | Findings | Hard Fails | Score Contribution |",
		"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const review of backlog.reviews) lines.push(`| ${escapeCell(review.review_id ?? "")} | ${escapeCell(review.review_scope ?? "")} | ${escapeCell(formatGraphRef(review.reviewed_ref))} | ${escapeCell(review.role ?? "")} | ${escapeCell(review.independent === true ? "yes" : "no")} | ${escapeCell(review.verdict ?? "")} | ${escapeCell(asArray(review.evidence_refs).join(", "))} | ${escapeCell(asArray(review.findings).length)} | ${escapeCell(asArray(review.hard_fail_report).length)} | ${escapeCell(review.score_contribution ?? "")} |`);
	if (backlog.reviews.length === 0) lines.push("| _none_ |  |  |  |  |  |  |  |  |  |");
	lines.push("", "### Waivers", "", "| Waiver | Role | Scope | Granting Authority | Valid | Trigger | Impacted Surfaces |", "| --- | --- | --- | --- | --- | --- | --- |");
	for (const waiver of backlog.waivers) {
		const computedValidity = isNonEmptyString(waiver.waiver_id) && invalidWaiverIds.has(waiver.waiver_id) ? "no" : waiver.valid === true ? "yes" : "no";
		lines.push(`| ${escapeCell(waiver.waiver_id ?? "")} | ${escapeCell(waiver.waived_role ?? "")} | ${escapeCell(formatGraphRef(waiver.scope))} | ${escapeCell(waiver.granting_authority ?? "")} | ${escapeCell(computedValidity)} | ${escapeCell(waiver.expiry_or_revisit_trigger ?? "")} | ${escapeCell(asArray(waiver.impacted_surfaces).join(", "))} |`);
	}
	if (backlog.waivers.length === 0) lines.push("| _none_ |  |  |  |  |  |  |");
	return [...lines, ""];
}
function renderLifecycleAndDrift(manifest, assessment) {
	return [
		"## Lifecycle And Drift",
		"",
		`- Last delta: ${manifest.last_delta_at ?? "Never"}`,
		`- Last rebaseline: ${manifest.last_rebaseline_at ?? "Never"}`,
		`- Last rebaseline causes: ${manifest.last_rebaseline_causes.join(", ") || "None"}`,
		`- Dirty flags: ${manifest.dirty_flags.join(", ") || "None"}`,
		`- Rebaseline required: ${assessment.rebaseline_required ? "Yes" : "No"}`,
		`- Changed sources: ${assessment.delta_summary.changed_source_ids.join(", ") || "None"}`,
		`- Changed claims: ${assessment.delta_summary.changed_claim_ids.join(", ") || "None"}`,
		`- Changed track gates: ${assessment.delta_summary.changed_track_gate_ids.join(", ") || "None"}`,
		`- Stale claims: ${assessment.stale_claims.join(", ") || "None"}`,
		`- Stale items: ${assessment.stale_items.join(", ") || "None"}`,
		`- Stale proofs: ${assessment.stale_proofs.join(", ") || "None"}`,
		`- Track gates to recalculate: ${assessment.delta_summary.track_gate_ids_to_recalculate.join(", ") || "None"}`,
		`- Track gate failures: ${assessment.track_gate_failures.join(", ") || "None"}`,
		""
	];
}
function buildProofMap(backlog) {
	return new Map(backlog.proofs.filter((proof) => isNonEmptyString(proof.proof_id)).map((proof) => [proof.proof_id, proof]));
}
function summarizeProofRefs(proofRefs, proofById, staleProofIds) {
	if (proofRefs.length === 0) return "none";
	return proofRefs.map((proofRef) => {
		const proof = proofById.get(proofRef);
		return `${proofRef} (${staleProofIds.has(proofRef) ? "stale" : "fresh_or_current"}, ${isNonEmptyString(proof?.covered_commit_or_build) ? proof.covered_commit_or_build : "no-build"})`;
	}).join("; ");
}
function summarizeRoadmapAnswer(backlog) {
	const itemMap = getItemMap(backlog);
	const ordered = orderRoadmapRows(backlog);
	if (ordered.length === 0) return "No roadmap rows recorded.";
	return ordered.map((row, index) => {
		const itemId = row.item_ref?.id ?? "unknown";
		const title = itemMap.get(itemId)?.title ?? itemId;
		const factors = asArray(row.economic_factors).join(", ") || "no-economic-factors";
		const note = isNonEmptyString(row.economic_priority_note) ? row.economic_priority_note : "no-economic-note";
		return `${index + 1}) ${itemId} (${title}) [topology=${row.topology_rank ?? "n/a"}, safety=${row.safety_rank ?? "n/a"}, economic=${row.economic_rank ?? "n/a"}; factors=${factors}; note=${note}]`;
	}).join(" ");
}
function summarizeItemProofAnswer(backlog, assessment) {
	const proofById = buildProofMap(backlog);
	const staleProofIds = new Set(assessment.stale_proofs);
	if (backlog.items.length === 0) return "No item proofs recorded.";
	return backlog.items.map((item) => `${item.item_id ?? "unknown"} -> ${summarizeProofRefs(asArray(item.proof_refs), proofById, staleProofIds)}`).join("; ");
}
function summarizeTrackProofAnswer(backlog, assessment) {
	const proofById = buildProofMap(backlog);
	const staleProofIds = new Set(assessment.stale_proofs);
	if (backlog.track_proofs.length === 0) return "No track proofs recorded.";
	return backlog.track_proofs.map((trackProof) => {
		const coverage = Object.entries(trackProof.coverage ?? {}).map(([key, value]) => `${key}=${value === true ? "yes" : "no"}`).join(", ");
		return `${trackProof.track_id ?? "unknown"} -> ${trackProof.track_proof_id ?? "unknown"} [${coverage || "no-coverage"}] backed by ${summarizeProofRefs(asArray(trackProof.proof_refs), proofById, staleProofIds)}`;
	}).join("; ");
}
function renderFinalOperatingQuestions(_manifest, backlog, assessment) {
	const committedClaims = backlog.claims.filter((claim) => claim.commitment === "committed");
	const committedClaimIds = new Set(committedClaims.map((claim) => claim.claim_id).filter((claimId) => typeof claimId === "string" && claimId.length > 0));
	const coveredClaimIds = /* @__PURE__ */ new Set();
	for (const item of backlog.items) {
		for (const claimRef of asArray(item.claim_refs)) if (committedClaimIds.has(claimRef)) coveredClaimIds.add(claimRef);
		for (const origin of asArray(item.origin_ref)) if (typeof origin.ref === "string" && (origin.kind === "claim_ref" || origin.kind === "control_obligation_ref" || origin.kind === "decommission_need_ref") && committedClaimIds.has(origin.ref)) coveredClaimIds.add(origin.ref);
	}
	const uncoveredClaims = [...committedClaimIds].filter((claimId) => !coveredClaimIds.has(claimId));
	const roadmapEndsRunnable = assessment.acceptance.achieved === "implementation-grade" && assessment.track_gate_failures.length === 0 && assessment.stale_items.length === 0 && assessment.stale_proofs.length === 0;
	const roadmapAnswer = summarizeRoadmapAnswer(backlog);
	const itemProofAnswer = summarizeItemProofAnswer(backlog, assessment);
	const trackProofAnswer = summarizeTrackProofAnswer(backlog, assessment);
	return [
		"## Final Operating Questions",
		"",
		`1. What is the system? ${backlog.target_system.external_consumer_groups.join(", ") || "Unspecified"} served by ${backlog.as_built.services.join(", ") || "no recorded services"} across ${backlog.tracks.length} closure tracks.`,
		`2. Which sources are authoritative? ${backlog.source_authority.map((source) => `${source.source_id} (${source.authority})`).join(", ") || "None recorded"}.`,
		`3. What exists now? ${backlog.as_built.deployable_surfaces.length} deployable surfaces, ${backlog.as_built.services.length} services, ${backlog.as_built.state_stores.length} state stores, and ${backlog.as_built.vendor_external_owners.length} external owners are mapped.`,
		`4. What is synthetic, partial, optional, or manual-only? ${backlog.negative_scope.length > 0 ? backlog.negative_scope.map((entry) => `${entry.negative_scope_id}:${entry.negative_scope_class}`).join(", ") : "No negative-scope entries recorded."}`,
		`5. Which committed claims remain uncovered? ${uncoveredClaims.length > 0 ? uncoveredClaims.join(", ") : "None."}`,
		`6. Which seams own each mandatory capability? ${backlog.items.filter((item) => item.item_class === "capability_seam").map((item) => `${item.item_id}:${item.title ?? item.capability_added ?? ""}`).join(", ") || "No capability seams recorded."}`,
		`7. Which items are seams, slices, controls, migrations, retirements, spikes, or enablement work? ${backlog.items.map((item) => `${item.item_id}:${item.item_class}`).join(", ") || "No items recorded."}`,
		`8. Which items are planning-ready now? ${backlog.items.filter((item) => item.readiness_state === "ready").map((item) => item.item_id).join(", ") || "None."}`,
		`9. Which contracts, migrations, and retirements are required? Contracts=${backlog.contracts.map((contract) => contract.contract_id).join(", ") || "None"}; migrations=${backlog.items.filter((item) => item.item_class === "migration").map((item) => item.item_id).join(", ") || "None"}; retirements=${backlog.items.filter((item) => item.item_class === "retirement").map((item) => item.item_id).join(", ") || "None"}.`,
		`10. Which quality budgets and control obligations are binding? Quality attributes=${backlog.quality_attributes.map((entry) => entry.quality_attribute_id).join(", ") || "None"}; control obligations=${backlog.claims.filter((claim) => claim.claim_class === "control_obligation").map((claim) => claim.claim_id).join(", ") || "None"}.`,
		`11. In what order must items land, and why? ${roadmapAnswer}`,
		`12. What proof closes each item? ${itemProofAnswer}`,
		`13. What proof closes each track? ${trackProofAnswer}`,
		`14. Which items remain blocked, stale, or unclear? stale_items=${assessment.stale_items.join(", ") || "None"}; stale_claims=${assessment.stale_claims.join(", ") || "None"}; stale_proofs=${assessment.stale_proofs.join(", ") || "None"}; unresolved_unknowns=${backlog.unknowns.filter((entry) => entry.resolution_state !== "resolved" && entry.resolution_state !== "downgraded").map((entry) => entry.issue_id).join(", ") || "None"}.`,
		`15. Does the roadmap end in a real, runnable, deployable, supportable system? ${roadmapEndsRunnable ? "Yes." : "Not yet."} Achieved acceptance=${assessment.acceptance.achieved}, track gate failures=${assessment.track_gate_failures.length}, stale proofs=${assessment.stale_proofs.length}, stale items=${assessment.stale_items.length}, rebaseline_required=${assessment.rebaseline_required ? "yes" : "no"}.`,
		""
	];
}
function renderInvalidBanner(assessment) {
	if (assessment.status !== "fail") return [];
	return [
		"> [!WARNING]",
		"> Canonical state is invalid. Treat this report as a repair aid, not as backlog truth.",
		""
	];
}
function renderDiscoveryViews(runDirInput) {
	const { assessment, backlog, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	if (legacyLayoutMessage) throw new Error(legacyLayoutMessage);
	if (missingArtifacts.length > 0) throw new Error(missingArtifacts.map((filePath) => `Missing discovery artifact: ${filePath}`).join("\n"));
	if (unsupportedSchemaMessages.length > 0) throw new Error(unsupportedSchemaMessages.join("\n"));
	if (!manifest || !backlog || !assessment) throw new Error("Render could not be completed.");
	const paths = runPaths(runDir);
	const renderedAt = utcNow();
	const reportLines = [
		"# Architecture Backlog Report",
		"",
		...renderInvalidBanner(assessment),
		...renderRunSummary(manifest, assessment),
		...renderBackdrop(backlog),
		...renderSourceAuthority(backlog),
		...renderSourceExclusions(backlog),
		...renderTargetSystem(backlog),
		...renderAsBuilt(backlog),
		...renderClaims(backlog),
		...renderIssueLedgers(backlog),
		...renderValueStreams(backlog),
		...renderTrackClosure(backlog),
		...renderTrackJourneys(backlog),
		...renderTrackGates(backlog),
		...renderTrackProofs(backlog),
		...renderProofBundles(backlog, assessment),
		...renderProofDimensions(backlog, assessment),
		...renderContractsAndDataDomains(backlog),
		...renderNfrAndObservability(backlog),
		...renderExtendedItemSchema(backlog),
		...renderUncertaintyAndSpikes(backlog),
		...renderApplicabilityAndExemptions(backlog),
		...renderClosureEvidence(backlog, assessment),
		...renderFeatureCandidates(backlog),
		...renderRoadmap(backlog),
		...renderRoadmapMatrix(backlog),
		...renderTraceability(backlog),
		...renderReviewGovernance(backlog, assessment),
		...renderLifecycleAndDrift(manifest, assessment),
		...renderGraphRelations(backlog),
		...renderGapsAndValidation(assessment),
		...renderScoreSummary(assessment),
		...renderReviewAndClosure(assessment),
		...renderFinalOperatingQuestions(manifest, backlog, assessment)
	];
	writeText(paths.report, `${reportLines.join("\n")}\n`);
	manifest.updated_at = renderedAt;
	manifest.last_render_at = renderedAt;
	if (manifest.phase_state !== "closed") manifest.phase_state = "rendered";
	backlog.metadata.updated_at = renderedAt;
	writeJson(paths.manifest, manifest);
	writeJson(paths.backlog, backlog);
	appendNdjson(paths.journal, {
		ts: renderedAt,
		event: "report_rendered",
		run_id: manifest.run_id,
		assessment_status: assessment.status,
		achieved_acceptance: assessment.acceptance.achieved
	});
	return {
		renderedAt,
		reportPath: paths.report,
		runDir
	};
}
//#endregion
//#region src/discovery/discover-run.ts
function runHasAnyCanonicalArtifact(runDir) {
	const paths = runPaths(runDir);
	return [
		paths.manifest,
		paths.backlog,
		paths.assessment,
		paths.journal,
		paths.report
	].some((filePath) => fs.existsSync(filePath));
}
function hasAnyEntries(record) {
	return Object.values(record).some((value) => Array.isArray(value) && value.length > 0);
}
function derivePhaseState(backlog) {
	if (backlog.items.length > 0) return "graph_built";
	if (backlog.claims.length > 0) return "claims_extracted";
	if (hasAnyEntries(backlog.as_built)) return "as_built_reconstructed";
	if (hasAnyEntries(backlog.target_system)) return "target_reconstructed";
	if (backlog.source_authority.length > 0) return "sources_resolved";
	return "initialized";
}
async function discoverDiscoveryRun(options) {
	const runDir = path.resolve(options.runDir);
	let initialized = false;
	const bundleRepair = repairCompactRunBundle(runDir);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		appliedPackets: 0,
		appliedRepairs: [],
		initialized,
		inaccessibleSources: [],
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {},
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		sourceIds: [],
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	if (!bundleRepair.hasAnyCanonicalArtifacts) {
		initializeDiscoveryRun({
			...options.acceptanceTarget ? { acceptanceTarget: options.acceptanceTarget } : {},
			runDir
		});
		initialized = true;
	} else if (bundleRepair.irreparableMissingArtifacts.length > 0) return {
		assessment: null,
		appliedPackets: 0,
		appliedRepairs: [],
		initialized,
		inaccessibleSources: [],
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		sourceIds: [],
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	const compactArtifacts = loadCompactRunArtifacts(runDir);
	if (compactArtifacts.legacyLayoutMessage || compactArtifacts.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		appliedPackets: 0,
		appliedRepairs: [],
		initialized,
		inaccessibleSources: [],
		...compactArtifacts.legacyLayoutMessage ? { legacyLayoutMessage: compactArtifacts.legacyLayoutMessage } : {},
		missingArtifacts: compactArtifacts.missingArtifacts,
		runDir: compactArtifacts.runDir,
		sourceIds: [],
		unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages
	};
	if (compactArtifacts.missingArtifacts.length > 0) {
		if (runHasAnyCanonicalArtifact(runDir)) return {
			assessment: null,
			appliedPackets: 0,
			appliedRepairs: [],
			initialized,
			inaccessibleSources: [],
			missingArtifacts: compactArtifacts.missingArtifacts,
			runDir: compactArtifacts.runDir,
			sourceIds: [],
			unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages
		};
	}
	const { backlog, manifest } = compactArtifacts;
	if (!backlog || !manifest) return {
		assessment: null,
		appliedPackets: 0,
		appliedRepairs: [],
		initialized,
		inaccessibleSources: [],
		missingArtifacts: compactArtifacts.missingArtifacts,
		runDir: compactArtifacts.runDir,
		sourceIds: [],
		unsupportedSchemaMessages: compactArtifacts.unsupportedSchemaMessages
	};
	const paths = runPaths(runDir);
	const mergeResult = mergeDiscoveryPacketsIntoBacklog(backlog, await resolveSourceInputs(options.sourceInputs, process.cwd()), await loadSourcePacketRefs(options.packetRefs ?? [], process.cwd()));
	const refreshResult = await refreshSourceFingerprintsInBacklog(backlog, process.cwd());
	const repairResult = options.repair === false ? {
		appliedRepairs: [],
		changed: false
	} : repairBacklogCanonicalState(backlog);
	const loadedManifest = loadJson(paths.manifest);
	loadedManifest.updated_at = utcNow();
	if (options.acceptanceTarget) loadedManifest.acceptance_target = options.acceptanceTarget;
	loadedManifest.phase_state = derivePhaseState(backlog);
	writeJson(paths.backlog, backlog);
	writeJson(paths.manifest, loadedManifest);
	appendNdjson(paths.journal, {
		ts: loadedManifest.updated_at,
		event: "sources_discovered",
		run_id: loadedManifest.run_id,
		source_ids: mergeResult.appliedSourceIds,
		packet_count: mergeResult.appliedPackets,
		initialized,
		refreshed_source_ids: refreshResult.changedSourceIds,
		access_state_changed_source_ids: refreshResult.accessStateChangedSourceIds,
		inaccessible_source_ids: refreshResult.inaccessibleSources,
		applied_repairs: repairResult.appliedRepairs
	});
	if (refreshResult.inaccessibleSources.length > 0) return {
		assessment: null,
		appliedPackets: mergeResult.appliedPackets,
		appliedRepairs: repairResult.appliedRepairs,
		initialized,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir,
		sourceIds: mergeResult.appliedSourceIds,
		unsupportedSchemaMessages: []
	};
	const validationResult = validateDiscoveryRun(runDir);
	let reportPath;
	if (options.render !== false) reportPath = renderDiscoveryViews(runDir).reportPath;
	return {
		assessment: validationResult.assessment,
		appliedPackets: mergeResult.appliedPackets,
		appliedRepairs: repairResult.appliedRepairs,
		initialized,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: validationResult.missingArtifacts,
		...reportPath ? { reportPath } : {},
		runDir,
		sourceIds: mergeResult.appliedSourceIds,
		unsupportedSchemaMessages: [],
		...validationResult.legacyLayoutMessage ? { legacyLayoutMessage: validationResult.legacyLayoutMessage } : {}
	};
}
//#endregion
//#region src/discovery/rebaseline-run.ts
async function rebaselineDiscoveryRun(runDirInput) {
	const bundleRepair = repairCompactRunBundle(runDirInput);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		causes: [],
		inaccessibleSources: [],
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {},
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages
	};
	const refreshResult = await refreshRunSourceFingerprints(runDirInput);
	if (refreshResult.legacyLayoutMessage || refreshResult.missingArtifacts.length > 0 || refreshResult.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		causes: [],
		inaccessibleSources: refreshResult.inaccessibleSources,
		...refreshResult.legacyLayoutMessage ? { legacyLayoutMessage: refreshResult.legacyLayoutMessage } : {},
		missingArtifacts: refreshResult.missingArtifacts,
		runDir: refreshResult.runDir,
		unsupportedSchemaMessages: refreshResult.unsupportedSchemaMessages
	};
	if (refreshResult.inaccessibleSources.length > 0) return {
		assessment: null,
		causes: [],
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir: refreshResult.runDir,
		unsupportedSchemaMessages: []
	};
	const { assessment, backlog, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		causes: [],
		inaccessibleSources: refreshResult.inaccessibleSources,
		...legacyLayoutMessage ? { legacyLayoutMessage } : {},
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages
	};
	if (!manifest || !backlog || !assessment) return {
		assessment: null,
		causes: [],
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		runDir,
		unsupportedSchemaMessages: []
	};
	const paths = runPaths(runDir);
	const driftState = computeDriftState(manifest, backlog);
	const rebaselinedAt = utcNow();
	const causes = [...new Set(driftState.deltaSummary.dirty_flags)];
	appendNdjson(paths.journal, {
		ts: rebaselinedAt,
		event: "rebaseline_started",
		run_id: manifest.run_id,
		previous_baseline_source_hashes: manifest.baseline_source_hashes,
		previous_baseline_canonical_hashes: manifest.baseline_canonical_hashes,
		causes
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
		const result = {
			assessment: null,
			causes,
			inaccessibleSources: refreshResult.inaccessibleSources,
			missingArtifacts: validationResult.missingArtifacts,
			rebaselinedAt,
			runDir,
			unsupportedSchemaMessages: []
		};
		if (validationResult.legacyLayoutMessage) result.legacyLayoutMessage = validationResult.legacyLayoutMessage;
		return result;
	}
	appendNdjson(paths.journal, {
		ts: rebaselinedAt,
		event: "rebaseline_completed",
		run_id: manifest.run_id,
		causes,
		assessment_status: validationResult.assessment.status,
		stale_claim_ids: validationResult.assessment.stale_claims,
		stale_item_ids: validationResult.assessment.stale_items,
		stale_proof_ids: validationResult.assessment.stale_proofs
	});
	return {
		assessment: validationResult.assessment,
		causes,
		inaccessibleSources: refreshResult.inaccessibleSources,
		missingArtifacts: [],
		rebaselinedAt,
		runDir,
		unsupportedSchemaMessages: []
	};
}
//#endregion
//#region src/discovery/status-run.ts
function getDiscoveryRunStatus(runDirInput) {
	const bundleRepair = repairCompactRunBundle(runDirInput);
	if (bundleRepair.legacyLayoutMessage || bundleRepair.irreparableMissingArtifacts.length > 0 || bundleRepair.unsupportedSchemaMessages.length > 0) return {
		assessment: null,
		manifest: null,
		missingArtifacts: bundleRepair.irreparableMissingArtifacts,
		runDir: bundleRepair.runDir,
		unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
		...bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {}
	};
	const { assessment, legacyLayoutMessage, manifest, missingArtifacts, runDir, unsupportedSchemaMessages } = loadCompactRunArtifacts(runDirInput);
	return {
		assessment,
		manifest,
		missingArtifacts,
		runDir,
		unsupportedSchemaMessages,
		...legacyLayoutMessage ? { legacyLayoutMessage } : {}
	};
}
//#endregion
//#region src/cli.ts
var CLI_NAME = "architecture-backlog";
var EXIT_SUCCESS = 0;
var EXIT_FAILURE = 1;
var EXIT_USAGE = 2;
var UsageError = class extends Error {
	helpText;
	constructor(message, helpText) {
		super(message);
		this.name = "UsageError";
		this.helpText = helpText;
	}
};
var io = {
	stderr: process.stderr,
	stdout: process.stdout
};
function writeLine(stream, line = "") {
	stream.write(`${line}\n`);
}
function globalHelp() {
	return [
		"Architecture backlog discovery CLI.",
		"",
		"Usage:",
		`  ${CLI_NAME} <command> [options]`,
		`  ${CLI_NAME} help [command]`,
		"",
		"Commands:",
		"  init <run-dir>       Initialize manifest.json, backlog.json, assessment.json, and journal.ndjson.",
		"  discover <run-dir>   Resolve sources, populate backlog.json, repair derivable state, validate, and render.",
		"  status <run-dir>     Show lifecycle status, acceptance state, and next actions.",
		"  repair <run-dir>     Refresh source truth, repair derivable canonical state, validate, and render.",
		"  validate <run-dir>   Validate canonical state and refresh assessment.json.",
		"  render <run-dir>     Render report.md from canonical state and assessment.",
		"  delta <run-dir>      Compute drift delta and refresh assessment.json.",
		"  rebaseline <run-dir> Accept current source/canonical state as the new baseline.",
		"  help [command]       Show global or command-specific help.",
		"",
		"Compatibility aliases:",
		"  init-discovery-run",
		"  discover-discovery-run",
		"  status-discovery-run",
		"  repair-discovery-run",
		"  validate-discovery-run",
		"  render-discovery-views",
		"  delta-discovery-run",
		"  rebaseline-discovery-run",
		"",
		"Global options:",
		"  -h, --help           Show help.",
		"  --version            Show CLI version."
	].join("\n");
}
function initHelp() {
	return [
		"Initialize compact discovery artifacts for a run directory.",
		"",
		"Usage:",
		`  ${CLI_NAME} init <run-dir> [options]`,
		`  ${CLI_NAME} init-discovery-run <run-dir> [options]`,
		"",
		"Artifacts created:",
		"  - manifest.json",
		"  - backlog.json",
		"  - assessment.json",
		"  - journal.ndjson",
		"",
		"Options:",
		"  --acceptance-target <class>  Set acceptance target.",
		"                               Values: draft-only, planning-grade, implementation-grade.",
		"  --force                      Overwrite discovery artifacts in an existing run directory.",
		"  -h, --help                   Show help."
	].join("\n");
}
function statusHelp() {
	return [
		"Show status for a discovery run.",
		"",
		"Usage:",
		`  ${CLI_NAME} status <run-dir>`,
		`  ${CLI_NAME} status-discovery-run <run-dir>`,
		"",
		"Options:",
		"  -h, --help  Show help."
	].join("\n");
}
function discoverHelp() {
	return [
		"Resolve source inputs, initialize or reuse the run, populate backlog.json, apply derivable repairs, validate, and render.",
		"",
		"Usage:",
		`  ${CLI_NAME} discover <run-dir> [options]`,
		`  ${CLI_NAME} discover-discovery-run <run-dir> [options]`,
		"",
		"Options:",
		"  --acceptance-target <class>     Set acceptance target.",
		"  --architecture-source <ref>     Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --adr-source <ref>              Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --runtime-source <ref>          Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --deployment-contract <ref>     Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --dossier-source <ref>          Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --code-evidence <ref>           Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --operational-evidence <ref>    Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --planning-source <ref>         Local path, file URL, or HTTP(S) URL. Repeatable.",
		"  --source <kind>:<authority>:<ref>  Generic source spec. Repeatable.",
		"  --source-packet <ref>           Explicit packet source. Repeatable.",
		"  --no-render                     Skip report rendering.",
		"  --no-repair                     Skip derivable repair before validation.",
		"  -h, --help                      Show help."
	].join("\n");
}
function repairHelp() {
	return [
		"Refresh source fingerprints from real source refs, repair derivable canonical state, validate, and render.",
		"",
		"Usage:",
		`  ${CLI_NAME} repair <run-dir> [options]`,
		`  ${CLI_NAME} repair-discovery-run <run-dir> [options]`,
		"",
		"Options:",
		"  --no-render  Skip report rendering.",
		"  -h, --help   Show help."
	].join("\n");
}
function validateHelp() {
	return [
		"Validate canonical discovery state and refresh assessment.json.",
		"",
		"Usage:",
		`  ${CLI_NAME} validate <run-dir>`,
		`  ${CLI_NAME} validate-discovery-run <run-dir>`,
		"",
		"Options:",
		"  -h, --help  Show help."
	].join("\n");
}
function renderHelp() {
	return [
		"Render report.md from canonical discovery state.",
		"",
		"Usage:",
		`  ${CLI_NAME} render <run-dir>`,
		`  ${CLI_NAME} render-discovery-views <run-dir>`,
		"",
		"Options:",
		"  -h, --help  Show help."
	].join("\n");
}
function deltaHelp() {
	return [
		"Compute drift delta for a discovery run and refresh assessment.json.",
		"",
		"Usage:",
		`  ${CLI_NAME} delta <run-dir>`,
		`  ${CLI_NAME} delta-discovery-run <run-dir>`,
		"",
		"Options:",
		"  -h, --help  Show help."
	].join("\n");
}
function rebaselineHelp() {
	return [
		"Accept current source and canonical state as the new baseline, then refresh assessment.json.",
		"",
		"Usage:",
		`  ${CLI_NAME} rebaseline <run-dir>`,
		`  ${CLI_NAME} rebaseline-discovery-run <run-dir>`,
		"",
		"Options:",
		"  -h, --help  Show help."
	].join("\n");
}
function toUsageError(error, helpText) {
	return new UsageError(error instanceof Error ? error.message : String(error), helpText);
}
function parseCommandArgs(config, helpText) {
	try {
		return parseArgs(config);
	} catch (error) {
		throw toUsageError(error, helpText);
	}
}
function requireSingleRunDir(positionals, commandName, helpText) {
	if (positionals.length !== 1) throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
	const runDir = positionals[0];
	if (runDir === void 0) throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
	return runDir;
}
function parseAcceptanceTarget(acceptanceTargetValue, helpText) {
	const acceptanceTarget = typeof acceptanceTargetValue === "string" ? acceptanceTargetValue : void 0;
	if (acceptanceTargetValue !== void 0 && acceptanceTarget === void 0) throw new UsageError("Acceptance target must be provided as a single string value.", helpText);
	if (acceptanceTarget !== void 0 && !isAcceptanceClass(acceptanceTarget)) throw new UsageError(`Invalid acceptance target: ${acceptanceTarget}. Expected one of ${ACCEPTANCE_CLASSES.join(", ")}.`, helpText);
	return acceptanceTarget;
}
function addTypedSourceSpecs(specs, values, kind, authority) {
	const refs = Array.isArray(values) ? values : typeof values === "string" ? [values] : [];
	for (const ref of refs) specs.push({
		authority,
		kind,
		ref
	});
}
function parseGenericSourceSpecs(values, helpText) {
	return (Array.isArray(values) ? values : typeof values === "string" ? [values] : []).map((entry) => {
		const match = /^([^:]+):([^:]+):(.+)$/.exec(entry);
		if (!match) throw new UsageError(`Invalid --source value: ${entry}. Expected <kind>:<authority>:<ref>.`, helpText);
		const [, kind, authority, ref] = match;
		if (!SOURCE_KINDS.includes(kind)) throw new UsageError(`Invalid source kind: ${kind}. Expected one of ${SOURCE_KINDS.join(", ")}.`, helpText);
		if (!SOURCE_AUTHORITIES.includes(authority)) throw new UsageError(`Invalid source authority: ${authority}. Expected one of ${SOURCE_AUTHORITIES.join(", ")}.`, helpText);
		if (!ref) throw new UsageError(`Invalid source ref in --source value: ${entry}.`, helpText);
		return {
			authority,
			kind,
			ref
		};
	});
}
function writeAssessmentSummary(commandIo, assessment) {
	writeLine(commandIo.stdout, `Assessment status: ${assessment.status}`);
	writeLine(commandIo.stdout, `Achieved acceptance: ${assessment.acceptance.achieved}`);
	writeLine(commandIo.stdout, `Score: ${assessment.score.total}/${assessment.score.max}`);
	writeLine(commandIo.stdout, `Rebaseline required: ${assessment.rebaseline_required ? "Yes" : "No"}`);
	writeLine(commandIo.stdout, `Stale claims/items/proofs: ${assessment.stale_claims.length}/${assessment.stale_items.length}/${assessment.stale_proofs.length}`);
	writeLine(commandIo.stdout, `Changed sources/claims/gates: ${assessment.delta_summary.changed_source_ids.length}/${assessment.delta_summary.changed_claim_ids.length}/${assessment.delta_summary.changed_track_gate_ids.length}`);
	writeLine(commandIo.stdout, `Track gates to recalculate: ${assessment.delta_summary.track_gate_ids_to_recalculate.length}`);
	writeLine(commandIo.stdout, `Missing review roles: ${assessment.missing_review_roles.length}`);
	writeLine(commandIo.stdout, `Pending track-proof reviews: ${assessment.pending_track_proof_reviews.length}`);
	writeLine(commandIo.stdout, `Waiver findings: ${assessment.waiver_findings.length}`);
}
function writeAssessmentDiagnostics(commandIo, assessment) {
	for (const error of assessment.errors) writeLine(commandIo.stderr, `ERROR: ${error}`);
	const explicitHardFails = assessment.hard_fails.filter((hardFail) => !assessment.errors.includes(hardFail));
	for (const hardFail of explicitHardFails) writeLine(commandIo.stderr, `HARD_FAIL: ${hardFail}`);
	for (const warning of assessment.warnings) writeLine(commandIo.stdout, `WARNING: ${warning}`);
	for (const finding of assessment.lint_findings) writeLine(commandIo.stdout, `LINT: ${finding}`);
}
function writeInaccessibleSources(commandIo, inaccessibleSources) {
	for (const sourceId of inaccessibleSources) writeLine(commandIo.stderr, `ERROR: Source ${sourceId} could not be read from its declared ref.`);
}
function assessmentExitCode(assessment) {
	return assessment.status === "pass" && !assessment.rebaseline_required ? EXIT_SUCCESS : EXIT_FAILURE;
}
function runInitCommand(argv, commandIo) {
	const helpText = initHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			"acceptance-target": { type: "string" },
			force: {
				short: "f",
				type: "boolean"
			},
			help: {
				short: "h",
				type: "boolean"
			}
		}
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "init", helpText);
	const acceptanceTarget = parseAcceptanceTarget(parsed.values["acceptance-target"], helpText);
	const initOptions = { runDir };
	if (acceptanceTarget !== void 0) initOptions.acceptanceTarget = acceptanceTarget;
	if (parsed.values.force !== void 0) initOptions.force = parsed.values.force;
	const result = initializeDiscoveryRun(initOptions);
	writeLine(commandIo.stdout, `Initialized discovery run at ${result.runDir}`);
	return EXIT_SUCCESS;
}
async function runDiscoverCommand(argv, commandIo) {
	const helpText = discoverHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			"acceptance-target": { type: "string" },
			"architecture-source": {
				type: "string",
				multiple: true
			},
			"adr-source": {
				type: "string",
				multiple: true
			},
			"runtime-source": {
				type: "string",
				multiple: true
			},
			"deployment-contract": {
				type: "string",
				multiple: true
			},
			"dossier-source": {
				type: "string",
				multiple: true
			},
			"code-evidence": {
				type: "string",
				multiple: true
			},
			"operational-evidence": {
				type: "string",
				multiple: true
			},
			"planning-source": {
				type: "string",
				multiple: true
			},
			source: {
				type: "string",
				multiple: true
			},
			"source-packet": {
				type: "string",
				multiple: true
			},
			"no-render": { type: "boolean" },
			"no-repair": { type: "boolean" },
			help: {
				short: "h",
				type: "boolean"
			}
		}
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "discover", helpText);
	const acceptanceTarget = parseAcceptanceTarget(parsed.values["acceptance-target"], helpText);
	const sourceInputs = [];
	addTypedSourceSpecs(sourceInputs, parsed.values["architecture-source"], "architecture_doc", "authoritative_target_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["adr-source"], "adr", "authoritative_target_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["runtime-source"], "runtime_evidence", "authoritative_current_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["deployment-contract"], "deployment_contract", "authoritative_current_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["dossier-source"], "delivered_dossier_ssot", "authoritative_current_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["code-evidence"], "code_evidence", "authoritative_current_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["operational-evidence"], "operational_evidence", "authoritative_current_truth");
	addTypedSourceSpecs(sourceInputs, parsed.values["planning-source"], "backlog_text", "planning_only");
	sourceInputs.push(...parseGenericSourceSpecs(parsed.values.source, helpText));
	const packetRefs = Array.isArray(parsed.values["source-packet"]) ? parsed.values["source-packet"] : typeof parsed.values["source-packet"] === "string" ? [parsed.values["source-packet"]] : [];
	if (sourceInputs.length === 0 && packetRefs.length === 0) throw new UsageError("discover requires at least one source input or --source-packet.", helpText);
	const result = await discoverDiscoveryRun({
		...acceptanceTarget ? { acceptanceTarget } : {},
		...packetRefs.length > 0 ? { packetRefs } : {},
		render: !parsed.values["no-render"],
		repair: !parsed.values["no-repair"],
		runDir,
		sourceInputs
	});
	if (result.legacyLayoutMessage) {
		writeLine(commandIo.stderr, result.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (result.unsupportedSchemaMessages.length > 0) {
		for (const message of result.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (result.missingArtifacts.length > 0) {
		for (const filePath of result.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (result.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, result.inaccessibleSources);
		return EXIT_FAILURE;
	}
	if (!result.assessment) {
		writeLine(commandIo.stderr, "Discovery run could not be assessed.");
		return EXIT_FAILURE;
	}
	writeLine(commandIo.stdout, `${result.initialized ? "Initialized" : "Reused"} discovery run at ${result.runDir}`);
	writeLine(commandIo.stdout, `Resolved sources: ${result.sourceIds.length > 0 ? result.sourceIds.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Applied source packets: ${result.appliedPackets}`);
	writeLine(commandIo.stdout, `Applied derivable repairs: ${result.appliedRepairs.length > 0 ? result.appliedRepairs.join(", ") : "None"}`);
	writeAssessmentSummary(commandIo, result.assessment);
	writeAssessmentDiagnostics(commandIo, result.assessment);
	if (result.reportPath) writeLine(commandIo.stdout, `Rendered report into ${result.reportPath}`);
	return assessmentExitCode(result.assessment);
}
async function runStatusCommand(argv, commandIo) {
	const helpText = statusHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: { help: {
			short: "h",
			type: "boolean"
		} }
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "status", helpText);
	const refreshResult = await refreshRunSourceFingerprints(runDir);
	if (refreshResult.legacyLayoutMessage) {
		writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (refreshResult.unsupportedSchemaMessages.length > 0) {
		for (const message of refreshResult.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (refreshResult.missingArtifacts.length > 0) {
		for (const filePath of refreshResult.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (refreshResult.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
		return EXIT_FAILURE;
	}
	const status = getDiscoveryRunStatus(runDir);
	if (status.legacyLayoutMessage) {
		writeLine(commandIo.stderr, status.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (status.unsupportedSchemaMessages.length > 0) {
		for (const message of status.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (status.missingArtifacts.length > 0) {
		for (const filePath of status.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (!status.manifest || !status.assessment) {
		writeLine(commandIo.stderr, "Status could not be determined.");
		return EXIT_FAILURE;
	}
	writeLine(commandIo.stdout, `Run: ${status.manifest.run_id}`);
	writeLine(commandIo.stdout, `Phase: ${status.manifest.phase_state}`);
	writeLine(commandIo.stdout, `Target acceptance: ${status.manifest.acceptance_target}`);
	writeLine(commandIo.stdout, `Achieved acceptance: ${status.assessment.acceptance.achieved}`);
	writeLine(commandIo.stdout, `Assessment: ${status.assessment.status}`);
	writeLine(commandIo.stdout, `Closure: ${status.assessment.closure.status}`);
	writeLine(commandIo.stdout, `Score: ${status.assessment.score.total}/${status.assessment.score.max}`);
	writeLine(commandIo.stdout, `Errors: ${status.assessment.errors.length}`);
	writeLine(commandIo.stdout, `Warnings: ${status.assessment.warnings.length}`);
	writeLine(commandIo.stdout, `Hard-fails: ${status.assessment.hard_fails.length}`);
	writeLine(commandIo.stdout, `Rebaseline required: ${status.assessment.rebaseline_required ? "Yes" : "No"}`);
	writeLine(commandIo.stdout, `Dirty flags: ${status.manifest.dirty_flags.length > 0 ? status.manifest.dirty_flags.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Stale proofs: ${status.assessment.stale_proofs.length > 0 ? status.assessment.stale_proofs.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Stale items: ${status.assessment.stale_items.length > 0 ? status.assessment.stale_items.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Stale claims: ${status.assessment.stale_claims.length > 0 ? status.assessment.stale_claims.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Track gate failures: ${status.assessment.track_gate_failures.length > 0 ? status.assessment.track_gate_failures.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Missing review roles: ${status.assessment.missing_review_roles.length > 0 ? status.assessment.missing_review_roles.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Pending track-proof reviews: ${status.assessment.pending_track_proof_reviews.length > 0 ? status.assessment.pending_track_proof_reviews.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Waiver findings: ${status.assessment.waiver_findings.length > 0 ? status.assessment.waiver_findings.join("; ") : "None"}`);
	writeLine(commandIo.stdout, `Last delta: ${status.manifest.last_delta_at ?? "Never"}`);
	writeLine(commandIo.stdout, `Last rebaseline: ${status.manifest.last_rebaseline_at ?? "Never"}`);
	if (status.assessment.hard_fails.length > 0) {
		writeLine(commandIo.stdout, "Hard-fail details:");
		for (const hardFail of status.assessment.hard_fails) writeLine(commandIo.stdout, `- ${hardFail}`);
	}
	if (status.assessment.next_actions.length > 0) {
		writeLine(commandIo.stdout, "Next actions:");
		for (const action of status.assessment.next_actions) writeLine(commandIo.stdout, `- ${action}`);
	}
	return assessmentExitCode(status.assessment);
}
async function runRepairCommand(argv, commandIo) {
	const helpText = repairHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			"no-render": { type: "boolean" },
			help: {
				short: "h",
				type: "boolean"
			}
		}
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "repair", helpText);
	const refreshResult = await refreshRunSourceFingerprints(runDir);
	if (refreshResult.legacyLayoutMessage) {
		writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (refreshResult.unsupportedSchemaMessages.length > 0) {
		for (const message of refreshResult.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (refreshResult.missingArtifacts.length > 0) {
		for (const filePath of refreshResult.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (refreshResult.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
		return EXIT_FAILURE;
	}
	const repairResult = repairDiscoveryRun(runDir);
	if (repairResult.legacyLayoutMessage) {
		writeLine(commandIo.stderr, repairResult.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (repairResult.unsupportedSchemaMessages.length > 0) {
		for (const message of repairResult.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (repairResult.missingArtifacts.length > 0) {
		for (const filePath of repairResult.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	const validationResult = validateDiscoveryRun(runDir);
	if (!validationResult.assessment) {
		writeLine(commandIo.stderr, "Repair could not produce an assessment.");
		return EXIT_FAILURE;
	}
	let reportPath;
	if (!parsed.values["no-render"]) reportPath = renderDiscoveryViews(runDir).reportPath;
	writeLine(commandIo.stdout, `Repaired discovery run at ${runDir}`);
	writeLine(commandIo.stdout, `Refreshed source fingerprints: ${refreshResult.changedSourceIds.length > 0 ? refreshResult.changedSourceIds.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Applied derivable repairs: ${repairResult.appliedRepairs.length > 0 ? repairResult.appliedRepairs.join(", ") : "None"}`);
	writeAssessmentSummary(commandIo, validationResult.assessment);
	writeAssessmentDiagnostics(commandIo, validationResult.assessment);
	if (reportPath) writeLine(commandIo.stdout, `Rendered report into ${reportPath}`);
	return assessmentExitCode(validationResult.assessment);
}
async function runValidateCommand(argv, commandIo) {
	const helpText = validateHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: { help: {
			short: "h",
			type: "boolean"
		} }
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "validate", helpText);
	const refreshResult = await refreshRunSourceFingerprints(runDir);
	if (refreshResult.legacyLayoutMessage) {
		writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (refreshResult.unsupportedSchemaMessages.length > 0) {
		for (const message of refreshResult.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (refreshResult.missingArtifacts.length > 0) {
		for (const filePath of refreshResult.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (refreshResult.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
		return EXIT_FAILURE;
	}
	const result = validateDiscoveryRun(runDir);
	if (result.legacyLayoutMessage) {
		writeLine(commandIo.stderr, result.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (result.missingArtifacts.length > 0) {
		for (const filePath of result.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	const assessment = result.assessment;
	if (!assessment) {
		writeLine(commandIo.stderr, "Assessment state could not be produced.");
		return EXIT_FAILURE;
	}
	writeAssessmentSummary(commandIo, assessment);
	writeAssessmentDiagnostics(commandIo, assessment);
	return assessmentExitCode(assessment);
}
function runRenderCommand(argv, commandIo) {
	const helpText = renderHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: { help: {
			short: "h",
			type: "boolean"
		} }
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const runDir = requireSingleRunDir(parsed.positionals, "render", helpText);
	const bundleRepair = repairCompactRunBundle(runDir);
	if (bundleRepair.legacyLayoutMessage) {
		writeLine(commandIo.stderr, bundleRepair.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (bundleRepair.unsupportedSchemaMessages.length > 0) {
		for (const message of bundleRepair.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (bundleRepair.irreparableMissingArtifacts.length > 0) {
		for (const filePath of bundleRepair.irreparableMissingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	const result = renderDiscoveryViews(runDir);
	writeLine(commandIo.stdout, `Rendered report into ${result.reportPath}`);
	return EXIT_SUCCESS;
}
async function runDeltaCommand(argv, commandIo) {
	const helpText = deltaHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: { help: {
			short: "h",
			type: "boolean"
		} }
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const result = await computeDiscoveryDelta(requireSingleRunDir(parsed.positionals, "delta", helpText));
	if (result.legacyLayoutMessage) {
		writeLine(commandIo.stderr, result.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (result.unsupportedSchemaMessages.length > 0) {
		for (const message of result.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (result.missingArtifacts.length > 0) {
		for (const filePath of result.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (result.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, result.inaccessibleSources);
		return EXIT_FAILURE;
	}
	if (!result.assessment) {
		writeLine(commandIo.stderr, "Delta state could not be produced.");
		return EXIT_FAILURE;
	}
	writeLine(commandIo.stdout, `Delta computed for ${result.runDir}`);
	writeAssessmentSummary(commandIo, result.assessment);
	writeLine(commandIo.stdout, `Changed sources: ${result.assessment.delta_summary.changed_source_ids.length > 0 ? result.assessment.delta_summary.changed_source_ids.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Changed claims: ${result.assessment.delta_summary.changed_claim_ids.length > 0 ? result.assessment.delta_summary.changed_claim_ids.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Stale items: ${result.assessment.stale_items.length > 0 ? result.assessment.stale_items.join(", ") : "None"}`);
	writeLine(commandIo.stdout, `Stale proofs: ${result.assessment.stale_proofs.length > 0 ? result.assessment.stale_proofs.join(", ") : "None"}`);
	writeAssessmentDiagnostics(commandIo, result.assessment);
	return EXIT_SUCCESS;
}
async function runRebaselineCommand(argv, commandIo) {
	const helpText = rebaselineHelp();
	const parsed = parseCommandArgs({
		args: argv,
		allowPositionals: true,
		strict: true,
		options: { help: {
			short: "h",
			type: "boolean"
		} }
	}, helpText);
	if (parsed.values.help) {
		writeLine(commandIo.stdout, helpText);
		return EXIT_SUCCESS;
	}
	const result = await rebaselineDiscoveryRun(requireSingleRunDir(parsed.positionals, "rebaseline", helpText));
	if (result.legacyLayoutMessage) {
		writeLine(commandIo.stderr, result.legacyLayoutMessage);
		return EXIT_FAILURE;
	}
	if (result.unsupportedSchemaMessages.length > 0) {
		for (const message of result.unsupportedSchemaMessages) writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
	if (result.missingArtifacts.length > 0) {
		for (const filePath of result.missingArtifacts) writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	if (result.inaccessibleSources.length > 0) {
		writeInaccessibleSources(commandIo, result.inaccessibleSources);
		return EXIT_FAILURE;
	}
	if (!result.assessment) {
		writeLine(commandIo.stderr, "Rebaseline could not be completed.");
		return EXIT_FAILURE;
	}
	writeLine(commandIo.stdout, `Rebaseline completed for ${result.runDir}`);
	writeLine(commandIo.stdout, `Rebaseline recorded at ${result.rebaselinedAt ?? "unknown-time"}`);
	writeLine(commandIo.stdout, `Rebaseline causes: ${result.causes.length > 0 ? result.causes.join(", ") : "none"}`);
	writeAssessmentSummary(commandIo, result.assessment);
	writeAssessmentDiagnostics(commandIo, result.assessment);
	if (result.assessment.next_actions.length > 0) {
		writeLine(commandIo.stdout, "Next actions:");
		for (const action of result.assessment.next_actions) writeLine(commandIo.stdout, `- ${action}`);
	}
	return EXIT_SUCCESS;
}
var COMMANDS = [
	{
		aliases: ["init-discovery-run"],
		helpText: initHelp,
		name: "init",
		run: runInitCommand
	},
	{
		aliases: ["discover-discovery-run"],
		helpText: discoverHelp,
		name: "discover",
		run: runDiscoverCommand
	},
	{
		aliases: ["status-discovery-run"],
		helpText: statusHelp,
		name: "status",
		run: runStatusCommand
	},
	{
		aliases: ["repair-discovery-run"],
		helpText: repairHelp,
		name: "repair",
		run: runRepairCommand
	},
	{
		aliases: ["validate-discovery-run"],
		helpText: validateHelp,
		name: "validate",
		run: runValidateCommand
	},
	{
		aliases: ["render-discovery-views"],
		helpText: renderHelp,
		name: "render",
		run: runRenderCommand
	},
	{
		aliases: ["delta-discovery-run"],
		helpText: deltaHelp,
		name: "delta",
		run: runDeltaCommand
	},
	{
		aliases: ["rebaseline-discovery-run"],
		helpText: rebaselineHelp,
		name: "rebaseline",
		run: runRebaselineCommand
	}
];
function findCommand(commandName) {
	return COMMANDS.find((command) => command.name === commandName || command.aliases.includes(commandName));
}
function printUsageError(error, commandIo) {
	writeLine(commandIo.stderr, error.message);
	if (error.helpText) {
		writeLine(commandIo.stderr);
		writeLine(commandIo.stderr, error.helpText);
	}
	return EXIT_USAGE;
}
async function executeCli(argv, commandIo = io) {
	const firstToken = argv[0];
	if (firstToken === void 0) return printUsageError(new UsageError("A command is required.", globalHelp()), commandIo);
	const rest = argv.slice(1);
	if (firstToken === "--help" || firstToken === "-h") {
		writeLine(commandIo.stdout, globalHelp());
		return EXIT_SUCCESS;
	}
	if (firstToken === "--version") {
		writeLine(commandIo.stdout, package_default.version);
		return EXIT_SUCCESS;
	}
	if (firstToken === "help") {
		if (rest.length === 0) {
			writeLine(commandIo.stdout, globalHelp());
			return EXIT_SUCCESS;
		}
		if (rest.length > 1) return printUsageError(new UsageError("help accepts at most one command name.", globalHelp()), commandIo);
		const targetName = rest[0];
		if (targetName === void 0) return printUsageError(new UsageError("help accepts at most one command name.", globalHelp()), commandIo);
		const targetCommand = findCommand(targetName);
		if (!targetCommand) return printUsageError(new UsageError(`Unknown command: ${targetName}`, globalHelp()), commandIo);
		writeLine(commandIo.stdout, targetCommand.helpText());
		return EXIT_SUCCESS;
	}
	const command = findCommand(firstToken);
	if (!command) return printUsageError(new UsageError(`Unknown command: ${firstToken}`, globalHelp()), commandIo);
	try {
		return await command.run(rest, commandIo);
	} catch (error) {
		if (error instanceof UsageError) return printUsageError(error, commandIo);
		const message = error instanceof Error ? error.message : String(error);
		writeLine(commandIo.stderr, message);
		return EXIT_FAILURE;
	}
}
function isDirectExecution(metaUrl) {
	const currentFilePath = fileURLToPath(metaUrl);
	const argvPath = process.argv[1];
	if (!argvPath) return false;
	try {
		return fs.realpathSync(argvPath) === fs.realpathSync(currentFilePath);
	} catch {
		return path.resolve(argvPath) === currentFilePath;
	}
}
if (isDirectExecution(import.meta.url)) executeCli(process.argv.slice(2)).then((exitCode) => {
	process.exit(exitCode);
}).catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	writeLine(process.stderr, message);
	process.exit(EXIT_FAILURE);
});
var cliName = CLI_NAME;
//#endregion
export { cliName, executeCli };

//# sourceMappingURL=architecture-backlog.mjs.map