#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
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
//#endregion
//#region src/discovery/common.ts
var PHASE_STATES = [
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
function isAcceptanceClass(value) {
	return ACCEPTANCE_CLASSES.includes(value);
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
function loadJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function appendNdjson(filePath, event) {
	ensureDir(path.dirname(filePath));
	fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, "utf8");
}
function runPaths(runDir) {
	return {
		manifest: path.join(runDir, "manifest.json"),
		journal: path.join(runDir, "journal.ndjson"),
		state: path.join(runDir, "state.snapshot.json"),
		validation: path.join(runDir, "validation.json"),
		closure: path.join(runDir, "closure.json"),
		views: path.join(runDir, "views")
	};
}
//#endregion
//#region src/discovery/init-run.ts
var DEFAULT_ACCEPTANCE_TARGET = "planning-grade";
function initializeDiscoveryRun(options) {
	const acceptanceTarget = options.acceptanceTarget ?? DEFAULT_ACCEPTANCE_TARGET;
	if (!ACCEPTANCE_CLASSES.includes(acceptanceTarget)) throw new Error(`Invalid acceptance target: ${acceptanceTarget}`);
	const runDir = path.resolve(options.runDir);
	const paths = runPaths(runDir);
	const canonicalPaths = [
		paths.manifest,
		paths.journal,
		paths.state,
		paths.validation,
		paths.closure
	];
	if (!options.force && canonicalPaths.some((filePath) => fs.existsSync(filePath))) throw new Error(`Run directory already contains canonical artifacts: ${runDir}`);
	const createdAt = utcNow();
	const runId = path.basename(runDir);
	const manifest = {
		schema_version: "1",
		run_id: runId,
		created_at: createdAt,
		updated_at: createdAt,
		phase_state: PHASE_STATES[0],
		acceptance_target: acceptanceTarget,
		source_refs: [],
		source_hashes: {},
		dirty_flags: [],
		last_validation_status: null,
		last_render_at: null
	};
	const state = {
		metadata: {
			schema_version: "1",
			run_id: runId,
			created_at: createdAt
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
			{
				track_id: "minimal-working-system",
				title: "Minimal working system"
			},
			{
				track_id: "externally-safe-operationally-supportable",
				title: "Externally safe and operationally supportable system"
			},
			{
				track_id: "full-target-system",
				title: "Full target system"
			}
		]
	};
	const validation = {
		schema_version: "1",
		run_id: runId,
		validated_at: createdAt,
		status: "not-run",
		errors: [],
		warnings: [],
		stats: {}
	};
	const closure = {
		schema_version: "1",
		run_id: runId,
		status: "open",
		acceptance_class: "draft-only",
		closed_at: null,
		reason: "Run initialized but not validated."
	};
	writeJson(paths.manifest, manifest);
	writeJson(paths.state, state);
	writeJson(paths.validation, validation);
	writeJson(paths.closure, closure);
	appendNdjson(paths.journal, {
		ts: createdAt,
		event: "run_initialized",
		run_id: runId,
		acceptance_target: acceptanceTarget
	});
	fs.mkdirSync(paths.views, { recursive: true });
	return {
		createdAt,
		runDir
	};
}
//#endregion
//#region src/discovery/render-views.ts
function escapeCell(value) {
	if (value === null || value === void 0) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value).replace(/\|/g, "\\|");
	return (JSON.stringify(value) ?? "").replace(/\|/g, "\\|");
}
function relativeViewPath(fileName) {
	return path.posix.join("views", fileName);
}
function renderFeatureCandidates(state) {
	const items = [...state.items ?? []].sort((left, right) => String(left.item_id ?? "").localeCompare(String(right.item_id ?? "")));
	const lines = [
		"# Feature Candidates",
		"",
		"| Item ID | Class | Status | Title | Capability added | Origins |",
		"| --- | --- | --- | --- | --- | --- |"
	];
	for (const item of items) lines.push(`| ${escapeCell(item.item_id)} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label ?? "Needs clarification")} | ${escapeCell(item.title ?? "")} | ${escapeCell(item.capability_added ?? "")} | ${escapeCell((item.origin_ref ?? []).join(", "))} |`);
	if (items.length === 0) lines.push("| _none_ |  |  |  |  |  |");
	return `${lines.join("\n")}\n`;
}
function renderRoadmap(state) {
	const indexed = [...state.items ?? []].map((item, index) => ({
		index: index + 1,
		item
	}));
	const lines = [
		"# Roadmap",
		"",
		"| # | Initiative / Feature | Type | Status | Capability added | Architectural scope | Dependencies | Why now | What is blocked without it | Risks / Gaps |",
		"| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
	];
	for (const { index, item } of indexed) lines.push(`| ${index} | ${escapeCell(item.title ?? item.item_id ?? "")} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label ?? "Needs clarification")} | ${escapeCell(item.capability_added ?? "")} | ${escapeCell(item.architectural_scope ?? "")} | ${escapeCell((item.dependencies ?? []).join(", "))} | ${escapeCell(item.why_now ?? "")} | ${escapeCell(item.blocked_without ?? "")} | ${escapeCell(item.risks_gaps ?? "")} |`);
	if (indexed.length === 0) lines.push("| 1 | _No items yet_ |  |  |  |  |  |  |  |  |");
	return `${lines.join("\n")}\n`;
}
function isGapItem(item) {
	return [
		"Missing",
		"Blocked",
		"Needs clarification"
	].includes(String(item.summary_label));
}
function renderGapsAndValidation(manifest, state, validation, closure, projectedPhaseState) {
	const gapItems = (state.items ?? []).filter((item) => isGapItem(item));
	const hardErrors = validation.errors ?? [];
	const warnings = validation.warnings ?? [];
	const lines = [
		"# Gaps And Validation",
		"",
		"## Run State",
		"",
		`- Run ID: ${manifest.run_id ?? "unknown"}`,
		`- Phase state: ${projectedPhaseState ?? manifest.phase_state ?? "unknown"}`,
		`- Acceptance target: ${manifest.acceptance_target ?? "unknown"}`,
		`- Validation status: ${validation.status ?? "unknown"}`,
		`- Acceptance class: ${closure.acceptance_class ?? "draft-only"}`,
		"",
		"## Validation Errors",
		""
	];
	if (hardErrors.length === 0) lines.push("- None");
	else for (const error of hardErrors) lines.push(`- ${error}`);
	lines.push("", "## Validation Warnings", "");
	if (warnings.length === 0) lines.push("- None");
	else for (const warning of warnings) lines.push(`- ${warning}`);
	lines.push("", "## Gap Items", "");
	if (gapItems.length === 0) lines.push("- None");
	else for (const item of gapItems) lines.push(`- ${item.item_id}: ${item.summary_label} - ${item.title ?? ""}`);
	return `${lines.join("\n")}\n`;
}
function renderDiscoveryViews(runDirInput) {
	const runDir = path.resolve(runDirInput);
	const paths = runPaths(runDir);
	const manifest = loadJson(paths.manifest);
	const state = loadJson(paths.state);
	const validation = loadJson(paths.validation);
	const closure = loadJson(paths.closure);
	const renderedAt = utcNow();
	const projectedPhaseState = validation.status === "pass" && manifest.phase_state !== "closed" ? "rendered" : manifest.phase_state;
	const featureCandidates = renderFeatureCandidates(state);
	const roadmap = renderRoadmap(state);
	const gapsAndValidation = renderGapsAndValidation(manifest, state, validation, closure, projectedPhaseState);
	writeJson(path.join(paths.views, "feature-candidates.meta.json"), {
		generated_at: renderedAt,
		kind: "feature-candidates",
		markdown_path: relativeViewPath("feature-candidates.md")
	});
	writeJson(path.join(paths.views, "roadmap.meta.json"), {
		generated_at: renderedAt,
		kind: "roadmap",
		markdown_path: relativeViewPath("roadmap.md")
	});
	writeJson(path.join(paths.views, "gaps-and-validation.meta.json"), {
		generated_at: renderedAt,
		kind: "gaps-and-validation",
		markdown_path: relativeViewPath("gaps-and-validation.md")
	});
	const markdownFiles = [
		["feature-candidates.md", featureCandidates],
		["roadmap.md", roadmap],
		["gaps-and-validation.md", gapsAndValidation]
	];
	for (const [fileName, content] of markdownFiles) {
		const filePath = path.join(paths.views, fileName);
		const tmpPath = `${filePath}.tmp`;
		fs.writeFileSync(tmpPath, content, "utf8");
		fs.renameSync(tmpPath, filePath);
	}
	manifest.updated_at = renderedAt;
	manifest.last_render_at = renderedAt;
	if (manifest.phase_state !== "closed") manifest.phase_state = projectedPhaseState;
	writeJson(paths.manifest, manifest);
	appendNdjson(paths.journal, {
		ts: renderedAt,
		event: "views_rendered",
		run_id: manifest.run_id ?? path.basename(runDir),
		validation_status: validation.status ?? "unknown"
	});
	return {
		renderedAt,
		runDir,
		viewsDir: paths.views
	};
}
//#endregion
//#region src/discovery/validate-run.ts
function validateDiscoveryRun(runDirInput) {
	const runDir = path.resolve(runDirInput);
	const paths = runPaths(runDir);
	const missingArtifacts = [
		paths.manifest,
		paths.journal,
		paths.state,
		paths.validation,
		paths.closure
	].filter((filePath) => !fs.existsSync(filePath));
	if (missingArtifacts.length > 0) return {
		errors: [],
		missingArtifacts,
		runDir,
		validation: null,
		warnings: []
	};
	const manifest = loadJson(paths.manifest);
	const state = loadJson(paths.state);
	const errors = [];
	const warnings = [];
	if (manifest.schema_version !== "1") errors.push("Unsupported schema_version in manifest.json");
	if (!PHASE_STATES.includes(manifest.phase_state)) errors.push("Invalid phase_state in manifest.json");
	if (state.metadata?.schema_version !== "1") errors.push("Unsupported schema_version in state.snapshot.json");
	const itemIds = /* @__PURE__ */ new Set();
	for (const item of state.items ?? []) {
		const itemId = item.item_id;
		if (!itemId) {
			errors.push("Item missing item_id");
			continue;
		}
		if (itemIds.has(itemId)) errors.push(`Duplicate item_id: ${itemId}`);
		itemIds.add(itemId);
		if (!item.item_class || !ITEM_CLASSES.includes(item.item_class)) errors.push(`Invalid item_class for ${itemId}`);
		if (item.summary_label && !SUMMARY_LABELS.includes(item.summary_label)) errors.push(`Invalid summary_label for ${itemId}`);
		if (!Array.isArray(item.origin_ref) || item.origin_ref.length === 0) warnings.push(`Item has no origin_ref: ${itemId}`);
	}
	const trackIds = new Set((state.tracks ?? []).map((track) => track.track_id).filter((trackId) => Boolean(trackId)));
	const proofIds = new Set((state.proofs ?? []).map((proof) => proof.proof_id).filter((proofId) => Boolean(proofId)));
	const reviewIds = new Set((state.reviews ?? []).map((review) => review.review_id).filter((reviewId) => Boolean(reviewId)));
	for (const relation of state.relations ?? []) {
		const relType = relation.relation_type;
		const fromId = relation.from;
		const toId = relation.to;
		if (!relType || !RELATION_TYPES.includes(relType)) errors.push(`Invalid relation_type: ${String(relType ?? "")}`);
		if (!fromId || !toId) {
			errors.push("Relation missing from/to");
			continue;
		}
		const validFrom = itemIds.has(fromId) || trackIds.has(fromId);
		const validTo = itemIds.has(toId) || trackIds.has(toId) || proofIds.has(toId) || reviewIds.has(toId);
		if (!validFrom) errors.push(`Relation source not found: ${fromId}`);
		if (!validTo) errors.push(`Relation target not found: ${toId}`);
	}
	const validationStatus = errors.length === 0 ? "pass" : "fail";
	const validation = {
		schema_version: "1",
		run_id: manifest.run_id ?? path.basename(runDir),
		validated_at: utcNow(),
		status: validationStatus,
		errors,
		warnings,
		stats: {
			items: (state.items ?? []).length,
			relations: (state.relations ?? []).length,
			proofs: (state.proofs ?? []).length,
			reviews: (state.reviews ?? []).length
		}
	};
	writeJson(paths.validation, validation);
	manifest.updated_at = validation.validated_at;
	manifest.last_validation_status = validationStatus;
	if (validation.status === "pass" && ![
		"closed",
		"reviewed",
		"rendered"
	].includes(manifest.phase_state)) manifest.phase_state = "validated";
	writeJson(paths.manifest, manifest);
	appendNdjson(paths.journal, {
		ts: validation.validated_at,
		event: "run_validated",
		run_id: validation.run_id,
		status: validation.status,
		error_count: errors.length,
		warning_count: warnings.length
	});
	return {
		errors,
		missingArtifacts: [],
		runDir,
		validation,
		warnings
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
		"  init <run-dir>       Initialize canonical discovery artifacts.",
		"  validate <run-dir>   Validate canonical state and refresh validation.json.",
		"  render <run-dir>     Render disposable markdown projections into views/.",
		"  help [command]       Show global or command-specific help.",
		"",
		"Compatibility aliases:",
		"  init-discovery-run",
		"  validate-discovery-run",
		"  render-discovery-views",
		"",
		"Global options:",
		"  -h, --help           Show help.",
		"  --version            Show CLI version."
	].join("\n");
}
function initHelp() {
	return [
		"Initialize canonical discovery artifacts for a run directory.",
		"",
		"Usage:",
		`  ${CLI_NAME} init <run-dir> [options]`,
		`  ${CLI_NAME} init-discovery-run <run-dir> [options]`,
		"",
		"Options:",
		"  --acceptance-target <class>  Set acceptance target.",
		"                               Values: draft-only, planning-grade, implementation-grade.",
		"  --force                      Overwrite canonical artifacts in an existing run directory.",
		"  -h, --help                   Show help."
	].join("\n");
}
function validateHelp() {
	return [
		"Validate canonical discovery state and refresh validation.json.",
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
		"Render disposable markdown projections from canonical discovery state.",
		"",
		"Usage:",
		`  ${CLI_NAME} render <run-dir>`,
		`  ${CLI_NAME} render-discovery-views <run-dir>`,
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
	const acceptanceTargetValue = parsed.values["acceptance-target"];
	const acceptanceTarget = typeof acceptanceTargetValue === "string" ? acceptanceTargetValue : void 0;
	if (acceptanceTargetValue !== void 0 && acceptanceTarget === void 0) throw new UsageError("Acceptance target must be provided as a single string value.", helpText);
	if (acceptanceTarget !== void 0 && !isAcceptanceClass(acceptanceTarget)) throw new UsageError(`Invalid acceptance target: ${acceptanceTarget}. Expected one of ${ACCEPTANCE_CLASSES.join(", ")}.`, helpText);
	const initOptions = { runDir };
	if (acceptanceTarget !== void 0) initOptions.acceptanceTarget = acceptanceTarget;
	const forceValue = parsed.values.force;
	if (forceValue !== void 0 && typeof forceValue !== "boolean") throw new UsageError("Force must be provided as a boolean flag.", helpText);
	if (forceValue !== void 0) initOptions.force = forceValue;
	const result = initializeDiscoveryRun(initOptions);
	writeLine(commandIo.stdout, `Initialized discovery run at ${result.runDir}`);
	return EXIT_SUCCESS;
}
function runValidateCommand(argv, commandIo) {
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
	const result = validateDiscoveryRun(requireSingleRunDir(parsed.positionals, "validate", helpText));
	if (result.missingArtifacts.length > 0) {
		for (const filePath of result.missingArtifacts) writeLine(commandIo.stderr, `Missing canonical artifact: ${filePath}`);
		return EXIT_FAILURE;
	}
	const validation = result.validation;
	if (!validation) {
		writeLine(commandIo.stderr, "Validation state could not be produced.");
		return EXIT_FAILURE;
	}
	writeLine(commandIo.stdout, `Validation status: ${validation.status}`);
	for (const error of validation.errors) writeLine(commandIo.stderr, `ERROR: ${error}`);
	for (const warning of validation.warnings) writeLine(commandIo.stdout, `WARNING: ${warning}`);
	return validation.errors.length > 0 ? EXIT_FAILURE : EXIT_SUCCESS;
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
	const result = renderDiscoveryViews(requireSingleRunDir(parsed.positionals, "render", helpText));
	writeLine(commandIo.stdout, `Rendered views into ${result.viewsDir}`);
	return EXIT_SUCCESS;
}
var COMMANDS = [
	{
		aliases: ["init-discovery-run"],
		description: "Initialize canonical discovery artifacts.",
		helpText: initHelp,
		name: "init",
		run: runInitCommand
	},
	{
		aliases: ["validate-discovery-run"],
		description: "Validate canonical state and refresh validation.json.",
		helpText: validateHelp,
		name: "validate",
		run: runValidateCommand
	},
	{
		aliases: ["render-discovery-views"],
		description: "Render markdown projections into views/.",
		helpText: renderHelp,
		name: "render",
		run: runRenderCommand
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
function executeCli(argv, commandIo = io) {
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
		return command.run(rest, commandIo);
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
if (isDirectExecution(import.meta.url)) process.exit(executeCli(process.argv.slice(2)));
var cliName = CLI_NAME;
//#endregion
export { cliName, executeCli };

//# sourceMappingURL=architecture-backlog.mjs.map