#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
//#region package.json
var name = "@kostysh/retrospective-phase-analysis-cli";
var version = "0.1.0";
var description = "CLI utilities for the retrospective-phase-analysis skill.";
var type = "module";
var bin = { "retrospective-phase-analysis": "scripts/retro-cli.mjs" };
var exports = { ".": "./scripts/retro-cli.mjs" };
var files = ["scripts"];
var engines = { "node": ">=22.22.0" };
var scripts = {
	"build": "vite build && chmod +x scripts/retro-cli.mjs",
	"format": "biome format --files-ignore-unknown=true --write src test package.json tsconfig.json vite.config.ts",
	"format:check": "biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false src test package.json tsconfig.json vite.config.ts",
	"lint:biome": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings src test package.json tsconfig.json vite.config.ts",
	"lint:eslint": "eslint \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\"",
	"lint": "pnpm run lint:biome && pnpm run lint:eslint && pnpm run typecheck",
	"lint:fix": "biome lint --files-ignore-unknown=true --diagnostic-level=warn --error-on-warnings --write src test package.json tsconfig.json vite.config.ts && eslint --fix \"src/**/*.ts\" \"test/**/*.ts\" \"vite.config.ts\" && pnpm run typecheck",
	"pretest": "pnpm run build",
	"test": "node --experimental-strip-types --test test/*.test.ts",
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
//#region src/core/shared.ts
function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}
function safeMkdirForFile(filePath) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
function isIsoLike(value) {
	return typeof value === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}
function tryParseDate(value) {
	if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
	if (typeof value !== "string" && typeof value !== "number") return null;
	const date = new Date(value);
	return Number.isNaN(date.valueOf()) ? null : date;
}
function diffMinutes(startValue, endValue) {
	const start = tryParseDate(startValue);
	const end = tryParseDate(endValue);
	if (!start || !end) return null;
	return Math.round((end.valueOf() - start.valueOf()) / 6e4 * 100) / 100;
}
function coalesce(...values) {
	return values.find((value) => value !== void 0 && value !== null && value !== "");
}
function getDeepValues(input, predicate, depth = 0) {
	if (depth > 8 || input === null || input === void 0) return [];
	const values = [];
	if (predicate(input)) values.push(input);
	if (Array.isArray(input)) {
		for (const item of input) values.push(...getDeepValues(item, predicate, depth + 1));
		return values;
	}
	if (typeof input === "object") for (const [key, value] of Object.entries(input)) {
		if (predicate(value, key)) values.push(value);
		values.push(...getDeepValues(value, predicate, depth + 1));
	}
	return values;
}
function extractTimestamp(event) {
	if (!event || typeof event !== "object") return null;
	for (const key of [
		"ts",
		"timestamp",
		"created_at",
		"time",
		"occurred_at",
		"start_ts",
		"end_ts"
	]) {
		const candidate = event[key];
		const date = tryParseDate(candidate);
		if (date) return date.toISOString();
	}
	const first = getDeepValues(event, (value) => isIsoLike(value)).map((value) => tryParseDate(value)).find(Boolean);
	return first ? first.toISOString() : null;
}
function extractEventType$1(event) {
	if (!event || typeof event !== "object") return "unknown";
	const direct = coalesce(event.type, event.event_type, event.kind, event.event, event.name);
	return typeof direct === "string" ? direct : "unknown";
}
function extractToolNames(event) {
	const out = /* @__PURE__ */ new Set();
	function maybeAdd(value, key) {
		if (typeof value !== "string") return;
		const normalizedKey = String(key ?? "").toLowerCase();
		if (normalizedKey.includes("tool") || normalizedKey === "recipient" || normalizedKey === "namespace") {
			out.add(value);
			return;
		}
		if (/^[a-z_]+\.[a-z_]+$/i.test(value) || /^[A-Z][A-Za-z0-9_-]*$/u.test(value)) out.add(value);
	}
	function walk(input, depth = 0) {
		if (depth > 6 || input === null || input === void 0) return;
		if (Array.isArray(input)) {
			for (const item of input) walk(item, depth + 1);
			return;
		}
		if (typeof input === "object") for (const [key, value] of Object.entries(input)) {
			maybeAdd(value, key);
			walk(value, depth + 1);
		}
	}
	walk(event);
	return Array.from(out).filter((name) => name !== "user" && name !== "assistant");
}
function topEntries(obj, limit = 10) {
	return Object.entries(obj).sort((left, right) => right[1] - left[1]).slice(0, limit);
}
function formatList(items) {
	return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- none";
}
var POSIX_ABSOLUTE_PATH_PATTERN = /(^|[\s`"'([{<])\/[A-Za-z0-9._@+\-/]+/gu;
var WINDOWS_ABSOLUTE_PATH_PATTERN = /[A-Za-z]:\\[^\s`"')\]}<>]+/gu;
function shortRedactionSessionId(sessionId) {
	const firstSegment = sessionId?.split("-")[0];
	return firstSegment && firstSegment.length > 0 ? firstSegment : "unknown";
}
function isPathInside(root, candidate) {
	const relative = path.relative(root, candidate);
	return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function toPosixPath(value) {
	return value.split(path.sep).join("/");
}
function redactSkillPath(candidate) {
	const parts = path.resolve(candidate).split(path.sep);
	const lastSkillsIndex = parts.lastIndexOf("skills");
	if (lastSkillsIndex === -1 || lastSkillsIndex + 1 >= parts.length) return null;
	return `<skills-root>/${parts.slice(lastSkillsIndex + 1).join("/")}`;
}
function redactAbsolutePath(candidate, context) {
	const normalized = path.resolve(candidate);
	const projectRoot = context.projectRoot ? path.resolve(context.projectRoot) : null;
	const sessionPath = context.sessionPath ? path.resolve(context.sessionPath) : null;
	if (sessionPath && normalized === sessionPath) return `<session-trace:${shortRedactionSessionId(context.sessionId)}>`;
	if (context.sessionId && normalized.includes(context.sessionId) && normalized.includes(`${path.sep}sessions${path.sep}`)) return `<session-trace:${shortRedactionSessionId(context.sessionId)}>`;
	if (projectRoot && isPathInside(projectRoot, normalized)) {
		const relative = path.relative(projectRoot, normalized);
		return relative.length > 0 ? `<project-root>/${toPosixPath(relative)}` : "<project-root>";
	}
	const skillPath = redactSkillPath(normalized);
	if (skillPath) return skillPath;
	const basename = path.basename(normalized);
	return basename.length > 0 ? `<absolute-path:redacted>/${basename}` : "<absolute-path:redacted>";
}
function redactSensitiveRuntimePath(value, context) {
	if (path.isAbsolute(value)) return redactAbsolutePath(value, context);
	return value.replace(POSIX_ABSOLUTE_PATH_PATTERN, (match, prefix) => {
		return `${prefix}${redactAbsolutePath(match.slice(prefix.length), context)}`;
	}).replace(WINDOWS_ABSOLUTE_PATH_PATTERN, "<absolute-path:redacted>");
}
function redactValueForPublicArtifact(value, context) {
	if (typeof value === "string") return redactSensitiveRuntimePath(value, context);
	if (Array.isArray(value)) return value.map((item) => redactValueForPublicArtifact(item, context));
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactValueForPublicArtifact(entry, context)]));
	return value;
}
function redactScanSummaryForPublicArtifact(summary) {
	return redactValueForPublicArtifact(summary, {
		projectRoot: summary.scope.project_root ?? summary.session.projectRoot,
		sessionPath: summary.resolved.session ?? summary.session.filePath ?? null,
		sessionId: summary.session.sessionId
	});
}
function stringFromUnknown(value, fallback) {
	return typeof value === "string" && value.length > 0 ? value : fallback;
}
function sortUnique(values) {
	return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}
var RETRO_OUTPUT_FILE_NAMES = {
	scan: "scan-summary.json",
	report: "retrospective-report.md",
	"skill-audit": "skill-audit.md",
	"logging-review": "logging-review.md"
};
function slugifyOutputPart(value) {
	const normalized = value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-").replaceAll(/^-+|-+$/gu, "");
	return normalized.length > 0 ? normalized : "session-unknown";
}
function shortSessionId(sessionId) {
	if (!sessionId) return null;
	const firstSegment = sessionId.split("-")[0];
	return firstSegment && firstSegment.length > 0 ? firstSegment.toLowerCase() : slugifyOutputPart(sessionId);
}
function formatCompactTimestamp(value) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) return null;
	const year = String(date.getUTCFullYear());
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return [
		year,
		month,
		day
	].join("") + "-" + [
		hours,
		minutes,
		seconds
	].join("");
}
function inferProjectRootFromLogsDir(logsDir) {
	if (!logsDir) return null;
	const normalized = path.resolve(logsDir);
	const parent = path.dirname(normalized);
	if (path.basename(normalized) !== "logs" || path.basename(parent) !== ".dossier") return null;
	return path.dirname(parent);
}
function findDossierManagedAncestor(startDir) {
	let current = path.resolve(startDir);
	while (true) {
		if (fs.existsSync(path.join(current, ".dossier"))) return current;
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}
function resolveRetroRoot(_summary, options) {
	if (options.draft) return {
		mode: "draft",
		root: path.join(path.resolve("."), "out", "retro-drafts")
	};
	const explicitRoot = options.explicitRoot;
	if (explicitRoot) return {
		mode: "root-override",
		root: path.resolve(explicitRoot)
	};
	const currentWorkingRoot = path.resolve(".");
	const dossierRoot = findDossierManagedAncestor(currentWorkingRoot);
	if (dossierRoot) return {
		mode: "dossier-default",
		root: path.join(dossierRoot, ".dossier", "retro")
	};
	return {
		mode: "fallback-default",
		root: path.join(currentWorkingRoot, "out", "retro")
	};
}
function resolveScopeSlug(summary) {
	const sessionSlug = shortSessionId(summary.session.sessionId);
	if (sessionSlug) return `session-${sessionSlug}`;
	if (summary.scope.mentioned_backlog_items.length === 1) return slugifyOutputPart(summary.scope.mentioned_backlog_items[0] ?? "session-unknown");
	if (summary.scope.mentioned_features.length === 1) return slugifyOutputPart(summary.scope.mentioned_features[0] ?? "session-unknown");
	return "session-unknown";
}
function resolveBaseRunSlug(summary) {
	return [
		"retrospective",
		formatCompactTimestamp(summary.session.firstTimestamp),
		shortSessionId(summary.session.sessionId)
	].filter((value) => typeof value === "string" && value.length > 0).join("-");
}
function resolveRunLocation(root, scopeSlug, baseRunSlug, targetFileName) {
	const scopeDir = path.join(root, scopeSlug);
	for (let attempt = 1; attempt < 1e3; attempt += 1) {
		const runSlug = attempt === 1 ? baseRunSlug : `${baseRunSlug}-r${attempt}`;
		const runDir = path.join(scopeDir, runSlug);
		const targetFilePath = path.join(runDir, targetFileName);
		if (!fs.existsSync(targetFilePath)) return {
			runSlug,
			runDir
		};
	}
	throw new Error(`Could not allocate retrospective output path for ${targetFileName}`);
}
function resolveRetroOutputLayout(summary, options) {
	const targetFileName = RETRO_OUTPUT_FILE_NAMES[options.commandName];
	if (options.runDir) {
		const runDir = path.resolve(options.runDir);
		const scopeDir = path.dirname(runDir);
		return {
			mode: "run-dir",
			root: path.dirname(scopeDir),
			scopeSlug: path.basename(scopeDir),
			runSlug: path.basename(runDir),
			runDir,
			filePath: path.join(runDir, targetFileName),
			files: {
				scanSummary: path.join(runDir, RETRO_OUTPUT_FILE_NAMES.scan),
				retrospectiveReport: path.join(runDir, RETRO_OUTPUT_FILE_NAMES.report),
				skillAudit: path.join(runDir, RETRO_OUTPUT_FILE_NAMES["skill-audit"]),
				loggingReview: path.join(runDir, RETRO_OUTPUT_FILE_NAMES["logging-review"])
			}
		};
	}
	const rootInfo = resolveRetroRoot(summary, {
		explicitRoot: options.outRoot,
		draft: options.draft
	});
	const scopeSlug = resolveScopeSlug(summary);
	const baseRunSlug = resolveBaseRunSlug(summary);
	const runInfo = resolveRunLocation(rootInfo.root, scopeSlug, baseRunSlug, targetFileName);
	return {
		mode: rootInfo.mode,
		root: rootInfo.root,
		scopeSlug,
		runSlug: runInfo.runSlug,
		runDir: runInfo.runDir,
		filePath: path.join(runInfo.runDir, targetFileName),
		files: {
			scanSummary: path.join(runInfo.runDir, RETRO_OUTPUT_FILE_NAMES.scan),
			retrospectiveReport: path.join(runInfo.runDir, RETRO_OUTPUT_FILE_NAMES.report),
			skillAudit: path.join(runInfo.runDir, RETRO_OUTPUT_FILE_NAMES["skill-audit"]),
			loggingReview: path.join(runInfo.runDir, RETRO_OUTPUT_FILE_NAMES["logging-review"])
		}
	};
}
//#endregion
//#region src/core/artifact-evidence.ts
var EMPTY_IDENTITY = {
	phase_scope: null,
	primary_backlog_item_key: null,
	primary_feature_id: null,
	source: null
};
var REVIEW_LINK_KEYS = ["review_artifacts", "review_artifact"];
var VERIFICATION_LINK_KEYS = [
	"verification_artifacts",
	"verification_artifact",
	"verify_artifact"
];
var STEP_LINK_KEYS = ["step_artifacts", "step_artifact"];
var BOUNDARY_TIMESTAMP_KEYS = [
	"step_close_ts",
	"close_out_ts",
	"closeout_ts",
	"process_complete_ts",
	"intake_process_complete_ts",
	"final_pass_ts",
	"ready_for_close_ts",
	"completed_at",
	"closed_at",
	"phase_completed_at",
	"verification_completed_at",
	"review_passed_at"
];
function uniqueNonEmpty(values) {
	return sortUnique(values.map((value) => value.trim()).filter((value) => value.length > 0));
}
function stringListFromUnknown(value) {
	if (typeof value === "string" && value.trim().length > 0) return [value.trim()];
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === "string" && item.trim() !== "");
}
function pathInside$1(root, candidate) {
	const relative = path.relative(root, candidate);
	return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function safeFileInsideRoot$1(root, candidate) {
	try {
		const stat = fs.lstatSync(candidate);
		if (!stat.isFile() || stat.isSymbolicLink()) return false;
		return pathInside$1(fs.realpathSync(root), fs.realpathSync(candidate));
	} catch {
		return false;
	}
}
function normalizeLinkedPath(projectRoot, value) {
	const trimmed = value.replaceAll(/^[\s("'`[{<]+|[\s"',.;:)\]}>`]+$/gu, "");
	if (!trimmed) return null;
	const normalized = path.isAbsolute(trimmed) ? path.normalize(trimmed) : path.resolve(projectRoot, trimmed);
	return pathInside$1(projectRoot, normalized) ? normalized : null;
}
function readPreview(projectRoot, filePath) {
	if (!safeFileInsideRoot$1(projectRoot, filePath)) return "";
	try {
		return fs.readFileSync(filePath, "utf8").slice(0, 8e3);
	} catch {
		return "";
	}
}
function pathOrContentContainsToken(projectRoot, filePath, token) {
	return filePath.includes(token) || readPreview(projectRoot, filePath).includes(token);
}
function scopeMatchesArtifact(input) {
	const tokens = [input.featureId, input.backlogItemKey].filter((value) => value.length > 0);
	if (tokens.length === 0) return false;
	return tokens.some((token) => pathOrContentContainsToken(input.projectRoot, input.filePath, token));
}
function artifactLinkCandidate(input) {
	const exists = safeFileInsideRoot$1(input.projectRoot, input.filePath);
	const scopeMatched = exists && scopeMatchesArtifact({
		projectRoot: input.projectRoot,
		filePath: input.filePath,
		featureId: input.featureId,
		backlogItemKey: input.backlogItemKey
	});
	const included = exists && scopeMatched;
	const reason = included ? `Linked by ${input.field} in ${input.log.filePath} and matched artifact scope.` : `Linked by ${input.field} in ${input.log.filePath}, but ${exists ? "artifact scope could not be verified" : "the target artifact file is missing or unsafe"}.`;
	return {
		path: input.filePath,
		evidence_kind: "stage_artifact_link",
		event_ref: null,
		included,
		inclusion_source: included ? "auto_included" : "not_included",
		reason
	};
}
function buildLinkedCandidates(input) {
	if (!input.projectRoot) return [];
	const out = [];
	for (const log of input.logs) {
		const featureId = stringFromUnknown(log.metadata.primary_feature_id, "") || stringFromUnknown(log.metadata.feature_id, "");
		const backlogItemKey = stringFromUnknown(log.metadata.primary_backlog_item_key, "") || stringFromUnknown(log.metadata.backlog_item_key, "");
		for (const key of input.keys) for (const rawPath of stringListFromUnknown(log.metadata[key])) {
			const normalized = normalizeLinkedPath(input.projectRoot, rawPath);
			if (!normalized) continue;
			out.push(artifactLinkCandidate({
				projectRoot: input.projectRoot,
				filePath: normalized,
				field: key,
				log,
				featureId,
				backlogItemKey
			}));
		}
	}
	return out;
}
function singleIdentityValue(input) {
	const values = uniqueNonEmpty(input.values);
	if (values.length === 0) return null;
	if (values.length > 1) {
		input.ambiguities.push(`Multiple artifact ${input.label} values were found: ${values.join(", ")}.`);
		return null;
	}
	return values[0] ?? null;
}
function deriveArtifactIdentity(logs) {
	const ambiguities = [];
	for (const log of logs) {
		const rejectedState = stringFromUnknown(log.metadata.stage_state_artifact_rejected, "");
		if (rejectedState) ambiguities.push(`Rejected mismatched stage state artifact: ${rejectedState}.`);
	}
	const featureId = singleIdentityValue({
		values: logs.map((log) => stringFromUnknown(log.metadata.primary_feature_id, "") || stringFromUnknown(log.metadata.feature_id, "")),
		label: "feature ids",
		ambiguities
	});
	const backlogItemKey = singleIdentityValue({
		values: logs.map((log) => stringFromUnknown(log.metadata.primary_backlog_item_key, "") || stringFromUnknown(log.metadata.backlog_item_key, "")),
		label: "backlog item keys",
		ambiguities
	});
	const phaseScope = singleIdentityValue({
		values: logs.map((log) => stringFromUnknown(log.metadata.phase_scope, "") || stringFromUnknown(log.metadata.stage, "")),
		label: "phase scopes",
		ambiguities
	});
	const source = logs.map((log) => stringFromUnknown(log.metadata.stage_state_artifact, "") || log.filePath).find((value) => value.length > 0) ?? null;
	return {
		identity: featureId || backlogItemKey || phaseScope ? {
			phase_scope: phaseScope,
			primary_backlog_item_key: backlogItemKey,
			primary_feature_id: featureId,
			source
		} : EMPTY_IDENTITY,
		ambiguities
	};
}
function latestBoundaryTimestamp(logs) {
	const dates = [];
	for (const log of logs) for (const key of BOUNDARY_TIMESTAMP_KEYS) {
		const parsed = tryParseDate(log.metadata[key]);
		if (parsed) dates.push(parsed);
	}
	const latest = dates.sort((left, right) => right.valueOf() - left.valueOf())[0];
	return latest ? latest.toISOString() : null;
}
function hasUnvalidatedFallbackMetrics(input) {
	return Object.values(input).some((source) => source.quality === "unvalidated_fallback");
}
function deriveArtifactEvidenceEnhancement(input) {
	const { identity, ambiguities } = deriveArtifactIdentity(input.logs);
	return {
		artifactIdentity: identity,
		artifactIdentityAmbiguities: ambiguities,
		artifactLinkedReviewCandidates: buildLinkedCandidates({
			logs: input.logs,
			projectRoot: input.projectRoot,
			keys: REVIEW_LINK_KEYS
		}),
		artifactLinkedVerificationCandidates: buildLinkedCandidates({
			logs: input.logs,
			projectRoot: input.projectRoot,
			keys: VERIFICATION_LINK_KEYS
		}),
		artifactLinkedStepCandidates: buildLinkedCandidates({
			logs: input.logs,
			projectRoot: input.projectRoot,
			keys: STEP_LINK_KEYS
		}),
		artifactBoundaryTs: latestBoundaryTimestamp(input.logs)
	};
}
//#endregion
//#region src/parsers/loose-yaml.ts
function parseScalar(value) {
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "null") return null;
	if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
	if (value.startsWith("\"") && value.endsWith("\"") || value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
	return value;
}
function parseLooseYaml(source) {
	const result = {};
	const stack = [{
		indent: -1,
		target: result
	}];
	const lines = source.split(/\r?\n/);
	for (const rawLine of lines) {
		if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
		const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
		const line = rawLine.trim();
		while (stack.length > 1) {
			const current = stack[stack.length - 1];
			if (!current || indent > current.indent) break;
			stack.pop();
		}
		const current = stack[stack.length - 1]?.target;
		if (!current) continue;
		if (line.startsWith("- ")) {
			current.__list__ ??= [];
			current.__list__.push(parseScalar(line.slice(2).trim()));
			continue;
		}
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;
		const key = line.slice(0, colonIndex).trim();
		const rawValue = line.slice(colonIndex + 1).trim();
		if (!rawValue) {
			const child = {};
			current[key] = child;
			stack.push({
				indent,
				target: child
			});
			continue;
		}
		current[key] = parseScalar(rawValue);
	}
	function normalizeLists(input) {
		if (Array.isArray(input)) return input.map(normalizeLists);
		if (input && typeof input === "object") {
			const record = input;
			if (Array.isArray(record.__list__)) return record.__list__.map(normalizeLists);
			const out = {};
			for (const [key, value] of Object.entries(record)) {
				if (key === "__list__") continue;
				out[key] = normalizeLists(value);
			}
			return out;
		}
		return input;
	}
	return normalizeLists(result);
}
//#endregion
//#region src/core/extract-skill-scope.ts
function collectStrings(input, depth = 0) {
	if (depth > 8 || input === null || input === void 0) return [];
	if (typeof input === "string") return [input];
	if (Array.isArray(input)) return input.flatMap((item) => collectStrings(item, depth + 1));
	if (typeof input !== "object") return [];
	return Object.values(input).flatMap((value) => collectStrings(value, depth + 1));
}
function fieldValue(input, field) {
	if (!input || typeof input !== "object") return;
	return input[field];
}
function objectValue(input) {
	return input && typeof input === "object" ? input : null;
}
function compactExcerpt(value) {
	const compacted = value.trim().replaceAll(/\s+/gu, " ");
	return compacted.length > 220 ? `${compacted.slice(0, 217)}...` : compacted;
}
function pathNameFromSkillFile(skillFile) {
	if (!skillFile) return null;
	if (path.basename(skillFile) !== "SKILL.md") return null;
	const parent = path.basename(path.dirname(skillFile));
	return parent.length > 0 ? parent : null;
}
function normalizeAliases(values) {
	return sortUnique(values.map((value) => value.trim()).filter((value) => value.length > 0));
}
function parseAvailableSkillsFromText(text) {
	const markerIndex = text.indexOf("### Available skills");
	if (markerIndex === -1) return [];
	const lines = text.slice(markerIndex).split(/\r?\n/u).slice(1);
	const entries = [];
	for (const line of lines) {
		if (/^###\s+/u.test(line)) break;
		const match = line.match(/^-\s+([^:\n]+):\s*(.*)$/u);
		if (!match?.[1]) continue;
		const displayName = match[1].trim();
		const rawDescription = match[2] ?? "";
		const skillFile = rawDescription.match(/\(file:\s*([^)]+?SKILL\.md)\)/u)?.[1]?.trim() ?? null;
		const pathName = pathNameFromSkillFile(skillFile);
		const name = pathName ?? displayName;
		const description = rawDescription.replace(/\s*\(file:\s*[^)]+?SKILL\.md\)\s*$/u, "").trim();
		entries.push({
			name,
			display_name: displayName,
			path_name: pathName,
			aliases: normalizeAliases([
				name,
				displayName,
				pathName ?? ""
			]),
			skillFile,
			description
		});
	}
	return entries;
}
function mergeCatalogEntries(entries) {
	const byName = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const existing = byName.get(entry.name);
		const skillFile = existing?.skillFile ?? entry.skillFile;
		const pathName = existing?.path_name ?? entry.path_name ?? pathNameFromSkillFile(skillFile);
		const name = pathName ?? entry.name;
		const aliases = normalizeAliases([
			...existing?.aliases ?? [],
			...entry.aliases,
			entry.name,
			entry.display_name,
			pathName ?? ""
		]);
		const next = {
			name,
			display_name: existing?.display_name ?? entry.display_name,
			path_name: pathName,
			aliases,
			skillFile,
			description: existing?.description || entry.description
		};
		byName.set(name, next);
	}
	return Array.from(byName.values()).sort((left, right) => left.name.localeCompare(right.name));
}
function bootstrapCatalogStrings(event) {
	const record = objectValue(event);
	if (!record) return [];
	const eventType = extractEventType$1(event);
	const payload = objectValue(record.payload);
	const payloadType = stringFromUnknown(payload?.type, "");
	if (eventType === "response_item" && payloadType === "message") {
		const role = stringFromUnknown(payload?.role, "");
		return role === "developer" || role === "system" ? collectStrings(payload?.content) : [];
	}
	return eventType === "turn_context" ? collectStrings(event) : [];
}
function extractAvailableSkillCatalog(sessionSummary) {
	return mergeCatalogEntries(sessionSummary.events.flatMap((event) => bootstrapCatalogStrings(event).flatMap((text) => parseAvailableSkillsFromText(text))));
}
function addFragment(out, input) {
	for (const text of collectStrings(input.value)) if (text.trim().length > 0) out.push({
		line: input.line,
		eventType: input.eventType,
		field: input.field,
		text
	});
}
function collectParsedCommandFragments(out, input) {
	if (!Array.isArray(input.parsedCommands)) return;
	for (const [index, command] of input.parsedCommands.entries()) {
		const record = objectValue(command);
		if (!record) continue;
		addFragment(out, {
			line: input.line,
			eventType: input.eventType,
			field: `event_msg.payload.parsed_cmd[${index}].path`,
			value: record.path
		});
		addFragment(out, {
			line: input.line,
			eventType: input.eventType,
			field: `event_msg.payload.parsed_cmd[${index}].cmd`,
			value: record.cmd
		});
	}
}
function operationalFragments(sessionSummary) {
	const out = [];
	for (const [index, event] of sessionSummary.events.entries()) {
		const record = objectValue(event);
		if (!record) continue;
		const line = sessionSummary.eventLines[index] ?? index + 1;
		const eventType = extractEventType$1(event);
		if (eventType === "session_meta" || eventType === "turn_context" || eventType === "compacted") continue;
		const payload = objectValue(record.payload);
		const payloadType = stringFromUnknown(payload?.type, "");
		if (eventType === "response_item") {
			if (payloadType === "message") {
				const role = stringFromUnknown(payload?.role, "");
				if (role === "user" || role === "assistant") addFragment(out, {
					line,
					eventType,
					field: "response_item.payload.content",
					value: payload?.content
				});
				continue;
			}
			if (payloadType === "function_call") {
				addFragment(out, {
					line,
					eventType,
					field: "response_item.payload.arguments",
					value: payload?.arguments
				});
				continue;
			}
			continue;
		}
		if (eventType === "event_msg" && payload) {
			if (payloadType === "user_message" || payloadType === "agent_message") {
				addFragment(out, {
					line,
					eventType,
					field: "event_msg.payload.message",
					value: payload.message
				});
				continue;
			}
			if (payloadType === "exec_command_end") {
				addFragment(out, {
					line,
					eventType,
					field: "event_msg.payload.command",
					value: payload.command
				});
				collectParsedCommandFragments(out, {
					line,
					eventType,
					parsedCommands: payload.parsed_cmd
				});
				continue;
			}
			continue;
		}
		if (eventType === "assistant" || eventType === "user") {
			addFragment(out, {
				line,
				eventType,
				field: `${eventType}.content`,
				value: fieldValue(record, "content") ?? fieldValue(record, "message")
			});
			continue;
		}
		if (eventType === "tool_call") {
			addFragment(out, {
				line,
				eventType,
				field: "tool_call.command",
				value: fieldValue(record, "command")
			});
			addFragment(out, {
				line,
				eventType,
				field: "tool_call.patch",
				value: fieldValue(record, "patch")
			});
			continue;
		}
		if (eventType === "tool_result") addFragment(out, {
			line,
			eventType,
			field: "tool_result.notes",
			value: fieldValue(record, "notes")
		});
	}
	return out;
}
function aliasPattern(alias) {
	const escaped = alias.trim().split(/\s+/u).map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("\\s+");
	return new RegExp(`(^|[^A-Za-z0-9_-])(${escaped})(?![A-Za-z0-9_-])`, "iu");
}
function findSkillEvidence(skill, fragments) {
	const evidence = [];
	for (const fragment of fragments) for (const alias of skill.aliases) {
		if (!aliasPattern(alias).test(fragment.text)) continue;
		evidence.push({
			line: fragment.line,
			event_type: fragment.eventType,
			field: fragment.field,
			excerpt: compactExcerpt(fragment.text),
			matched_alias: alias
		});
		break;
	}
	return evidence;
}
function logMetricFragments(logMetrics) {
	return Object.keys(logMetrics.skillsReferenced).map((skill) => ({
		line: 0,
		eventType: "stage_log",
		field: "stageLogs.metrics.skillsReferenced",
		text: skill
	}));
}
function safeSkillDirectoryName(value) {
	return /^[A-Za-z0-9._-]+$/u.test(value) && value !== "." && value !== "..";
}
function readLocalSkillSummary(skillFile) {
	if (!fs.existsSync(skillFile)) return null;
	const frontmatterMatch = fs.readFileSync(skillFile, "utf8").match(/^---\n([\s\S]*?)\n---/u);
	const frontmatter = frontmatterMatch ? parseLooseYaml(frontmatterMatch[1] ?? "") : {};
	return {
		skillFile,
		name: typeof frontmatter.name === "string" ? frontmatter.name : path.basename(path.dirname(skillFile)),
		description: typeof frontmatter.description === "string" ? frontmatter.description : ""
	};
}
function candidateLocalSkillFiles(skillsDir, skill) {
	return normalizeAliases([
		skill.name,
		skill.path_name ?? "",
		...skill.aliases
	]).filter(safeSkillDirectoryName).map((alias) => path.join(skillsDir, alias, "SKILL.md"));
}
function enrichReferencedSkill(skill, skillsDir) {
	if (!skillsDir || !fs.existsSync(skillsDir)) return skill;
	const localSkill = candidateLocalSkillFiles(skillsDir, skill).map((skillFile) => readLocalSkillSummary(skillFile)).find((candidate) => candidate !== null);
	if (!localSkill) return skill;
	const pathName = skill.path_name ?? pathNameFromSkillFile(localSkill.skillFile);
	return {
		...skill,
		name: pathName ?? skill.name,
		path_name: pathName,
		aliases: normalizeAliases([
			...skill.aliases,
			localSkill.name,
			pathName ?? ""
		]),
		skillFile: localSkill.skillFile,
		description: skill.description || localSkill.description
	};
}
function extractSkillTraceSummary({ sessionSummary, skillsDir, logMetrics }) {
	const available = extractAvailableSkillCatalog(sessionSummary);
	if (available.length === 0) return {
		available: [],
		referenced: [],
		unreferenced_count: 0
	};
	const fragments = [...operationalFragments(sessionSummary), ...logMetricFragments(logMetrics)];
	const referencedEntries = available.map((skill) => ({
		skill,
		evidence: findSkillEvidence(skill, fragments)
	})).filter((entry) => entry.evidence.length > 0);
	const referencedNames = new Set(referencedEntries.map(({ skill }) => skill.name));
	return {
		available,
		referenced: referencedEntries.map(({ skill, evidence }) => ({
			...enrichReferencedSkill(skill, skillsDir),
			evidence
		})),
		unreferenced_count: available.filter((skill) => !referencedNames.has(skill.name)).length
	};
}
//#endregion
//#region src/core/extract-trace-scope.ts
var SKIPPED_KEYS = new Set([
	"base_instructions",
	"developer_instructions",
	"user_instructions",
	"formatted_output"
]);
var ID_TEXT_KEYS = new Set([
	"content",
	"message",
	"text",
	"command",
	"patch",
	"body"
]);
var PATH_TEXT_KEYS = new Set([
	"content",
	"message",
	"text",
	"command",
	"patch",
	"body",
	"notes",
	"path",
	"paths",
	"filePath",
	"file_path",
	"dossier",
	"verify_artifact",
	"review_artifact"
]);
var CANONICAL_BACKLOG_ITEM_PATTERN = /(^|[^A-Za-z0-9_-])(CF-\d{3,4})(?![A-Za-z0-9_.-])/gu;
var CANONICAL_FEATURE_ID_PATTERN = /(^|[^A-Za-z0-9_-])(F-\d{4})(?![A-Za-z0-9_.-])/gu;
var FEATURE_ID_IN_PATH_PATTERN = /(?:^|[\\/])(F-\d{4})(?=[\\/]|[-_.])/gu;
function escapeForRegex(value) {
	return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
function trimPathCandidate(value) {
	return value.replaceAll(/^[\s("'`[{<]+|[\s"',.;:)\]}>`]+$/gu, "");
}
function isInterestingRelativePath(value) {
	return /^(?:\.dossier|docs|src|test|scripts|skills|packages)\//u.test(value);
}
function isInterestingRootFile(value) {
	return /^(?:AGENTS\.md|README\.md|package\.json|pnpm-lock\.yaml|tsconfig\.json)$/u.test(value);
}
function normalizePathCandidate(candidate, projectRoot) {
	const trimmed = trimPathCandidate(candidate);
	if (!trimmed) return null;
	if (path.isAbsolute(trimmed)) return path.normalize(trimmed);
	if (projectRoot && (isInterestingRelativePath(trimmed) || isInterestingRootFile(trimmed))) return path.resolve(projectRoot, trimmed);
	return null;
}
function isProjectScopedPath(value, projectRoot) {
	if (!projectRoot) return false;
	const normalizedRoot = path.resolve(projectRoot);
	const normalizedValue = path.resolve(value);
	return normalizedValue === normalizedRoot || normalizedValue.startsWith(`${normalizedRoot}${path.sep}`) || normalizedValue.startsWith(`${normalizedRoot}/`);
}
function isHighSignalAnchorText(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) return false;
	const lineCount = trimmed.split(/\r?\n/u).length;
	if (trimmed.length > 4e3 || lineCount > 40) return false;
	return !(trimmed.includes("<INSTRUCTIONS>") || trimmed.includes("# AGENTS.md") || trimmed.includes("Original token count:") || trimmed.includes("Process exited with code") || trimmed.startsWith("Command: /bin/bash -lc") || trimmed.startsWith("Command: node "));
}
function extractPathAnchorTexts(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) return [];
	if (isHighSignalAnchorText(trimmed)) return [trimmed];
	const out = trimmed.split(/\r?\n/u).map((line) => line.trim()).filter((line) => {
		if (line.length === 0) return false;
		if (/^\*\*\* (?:Update File|Add File|Move to): /u.test(line)) return true;
		if (!(/(?:^|[\s("'`[{<])(?:\.dossier|docs|src|test|scripts|skills|packages)\//u.test(line) || /(?:^|[\s("'`[{<])(?:\/[A-Za-z0-9._@-]+)+(?:\.[A-Za-z0-9._-]+)?/u.test(line))) return false;
		return /(>|>>)\s*['"]?/u.test(line) || /\btee\b(?:\s+-a)?\s+/u.test(line) || /\btouch\b\s+/u.test(line) || /\bsed\b[\s\S]*?-i/u.test(line) || /\bperl\b[\s\S]*?-0pi/u.test(line) || /\b(?:cp|mv)\b(?:\s+\S+)+\s+/u.test(line);
	});
	return out.length > 0 ? out : [];
}
function isReferencedArtifact(value, projectRoot) {
	if (!projectRoot) return false;
	const relative = path.relative(projectRoot, value);
	if (relative.startsWith("..")) return false;
	return relative.startsWith(".dossier/") || relative.startsWith(`.dossier${path.sep}`) || relative.startsWith("docs/") || relative.startsWith(`docs${path.sep}`);
}
function isStageLogArtifact(value, projectRoot) {
	if (!projectRoot) return false;
	const relative = path.relative(projectRoot, value);
	if (relative.startsWith("..")) return false;
	return relative.startsWith(".dossier/logs/") || relative.startsWith(`.dossier${path.sep}logs${path.sep}`);
}
function isReviewArtifact(value, projectRoot) {
	if (!projectRoot) return false;
	const relative = path.relative(projectRoot, value);
	if (relative.startsWith("..")) return false;
	return relative.startsWith(".dossier/reviews/") || relative.startsWith(`.dossier${path.sep}reviews${path.sep}`);
}
function isVerificationArtifact(value, projectRoot) {
	if (!projectRoot) return false;
	const relative = path.relative(projectRoot, value);
	if (relative.startsWith("..")) return false;
	return relative.startsWith(".dossier/verification/") || relative.startsWith(`.dossier${path.sep}verification${path.sep}`);
}
function isStepArtifact(value, projectRoot) {
	if (!projectRoot) return false;
	const relative = path.relative(projectRoot, value);
	if (relative.startsWith("..")) return false;
	return relative.startsWith(".dossier/steps/") || relative.startsWith(`.dossier${path.sep}steps${path.sep}`);
}
function collectNestedStrings(input, depth = 0) {
	if (depth > 8 || input === null || input === void 0) return [];
	if (typeof input === "string") return [input];
	if (Array.isArray(input)) return input.flatMap((item) => collectNestedStrings(item, depth + 1));
	if (typeof input !== "object") return [];
	return Object.entries(input).flatMap(([key, value]) => {
		if (SKIPPED_KEYS.has(key)) return [];
		return collectNestedStrings(value, depth + 1);
	});
}
function collectEventTextsByKeys(input, allowedKeys, depth = 0) {
	if (depth > 8 || input === null || input === void 0) return [];
	if (Array.isArray(input)) return input.flatMap((item) => collectEventTextsByKeys(item, allowedKeys, depth + 1));
	if (typeof input !== "object") return [];
	const record = input;
	if (record.type === "session_meta") return [];
	const out = [];
	for (const [key, value] of Object.entries(record)) {
		if (SKIPPED_KEYS.has(key)) continue;
		if (allowedKeys.has(key)) {
			out.push(...collectNestedStrings(value, depth + 1));
			continue;
		}
		out.push(...collectEventTextsByKeys(value, allowedKeys, depth + 1));
	}
	return out;
}
function extractMatches(values, pattern) {
	const matches = [];
	for (const value of values) for (const match of value.matchAll(pattern)) {
		const candidate = match[2] ?? match[1] ?? match[0];
		if (candidate) matches.push(candidate);
	}
	return sortUnique(matches);
}
function extractTouchedPaths(values, projectRoot) {
	const rawCandidates = [];
	const absolutePathPattern = /(?:^|[\s("'`[{<])((?:\/[A-Za-z0-9._@-]+)+(?:\.[A-Za-z0-9._-]+)?)/gu;
	const relativePathPattern = /(?:^|[\s("'`[{<])((?:\.dossier|docs|src|test|scripts|skills|packages)\/[A-Za-z0-9._@/\-]+(?:\.[A-Za-z0-9._-]+)?)/gu;
	const rootFilePattern = /\b(AGENTS\.md|README\.md|package\.json|pnpm-lock\.yaml|tsconfig\.json)\b/gu;
	rawCandidates.push(...extractMatches(values, absolutePathPattern));
	rawCandidates.push(...extractMatches(values, relativePathPattern));
	rawCandidates.push(...extractMatches(values, rootFilePattern));
	return sortUnique(rawCandidates.map((value) => normalizePathCandidate(value, projectRoot)).filter((value) => value !== null).filter((value) => isProjectScopedPath(value, projectRoot)).filter((value) => {
		if (projectRoot && path.resolve(value) === path.resolve(projectRoot)) return false;
		if (fs.existsSync(value)) return fs.statSync(value).isFile();
		return path.extname(value).length > 0 || isInterestingRootFile(path.basename(value));
	}));
}
function extractCanonicalBacklogItems(values) {
	return extractMatches(values, CANONICAL_BACKLOG_ITEM_PATTERN);
}
function extractCanonicalFeatureIds(values) {
	return extractMatches(values, CANONICAL_FEATURE_ID_PATTERN);
}
function extractFeatureIdsFromPaths(values, projectRoot) {
	if (!projectRoot) return [];
	const matches = [];
	for (const value of values) {
		const relativePath = path.relative(projectRoot, value);
		if (relativePath.startsWith("..")) continue;
		for (const match of relativePath.matchAll(FEATURE_ID_IN_PATH_PATTERN)) if (match[1]) matches.push(match[1]);
	}
	return sortUnique(matches);
}
function extractEventType(record) {
	return [
		record.type,
		record.event_type,
		record.kind,
		record.event,
		record.name
	].find((value) => typeof value === "string") ?? null;
}
function extractEventToolName(record) {
	return [
		record.tool,
		record.tool_name,
		record.recipient
	].find((value) => typeof value === "string") ?? null;
}
function hasCommandLikeValue(value) {
	return collectNestedStrings(value).some((entry) => entry.trim().length > 0);
}
function unwrapToolExecutionRecord(event) {
	if (!event || typeof event !== "object") return null;
	const record = event;
	const payload = record.payload && typeof record.payload === "object" ? record.payload : null;
	if (payload && (hasCommandLikeValue(payload.command) || hasCommandLikeValue(payload.patch) || hasCommandLikeValue(payload.diff))) return payload;
	return record;
}
function isToolCallEvent(record) {
	const eventType = extractEventType(record);
	return hasCommandLikeValue(record.command) || hasCommandLikeValue(record.patch) || hasCommandLikeValue(record.diff) || typeof eventType === "string" && /tool_call/u.test(eventType);
}
function isToolResultEvent(record) {
	const eventType = extractEventType(record);
	return typeof eventType === "string" && /tool_result/u.test(eventType);
}
function classifyArtifactWriteEvidence(record, artifactPath, projectRoot) {
	if ((extractEventToolName(record)?.toLowerCase() ?? "").includes("apply_patch")) return sortUnique([
		record.patch,
		record.diff,
		record.command
	].flatMap((value) => collectNestedStrings(value)).join("\n").split(/\r?\n/u).flatMap((line) => {
		const match = line.match(/^\*\*\* (?:Update File|Add File|Move to): (.+)$/u);
		if (!match?.[1]) return [];
		const normalized = normalizePathCandidate(match[1], projectRoot);
		if (!normalized || !isProjectScopedPath(normalized, projectRoot)) return [];
		return [normalized];
	})).includes(artifactPath) ? "trace_patch_target" : null;
	const commandBlob = [
		record.command,
		record.body,
		record.patch,
		record.diff
	].flatMap((value) => collectNestedStrings(value)).join("\n");
	if ([artifactPath].some((filePath) => {
		return [filePath, projectRoot && isProjectScopedPath(filePath, projectRoot) ? path.relative(projectRoot, filePath) : null].filter((value) => value !== null).some((candidate) => {
			const escaped = escapeForRegex(candidate);
			return [
				new RegExp(`(?:>|>>)\\s*['"]?${escaped}['"]?(?:\\s|$)`, "iu"),
				new RegExp(`\\btee\\b(?:\\s+-a)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, "iu"),
				new RegExp(`\\btouch\\b\\s+['"]?${escaped}['"]?(?:\\s|$)`, "iu"),
				new RegExp(`\\bsed\\b[\\s\\S]*?-i(?:\\S*)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, "iu"),
				new RegExp(`\\bperl\\b[\\s\\S]*?-0pi(?:\\S*)?\\s+['"]?${escaped}['"]?(?:\\s|$)`, "iu"),
				new RegExp(`\\b(?:cp|mv)\\b(?:\\s+[^\\s]+)+\\s+['"]?${escaped}['"]?(?:\\s|$)`, "iu")
			].some((pattern) => pattern.test(commandBlob));
		});
	})) return "trace_shell_write";
	const eventType = extractEventType(record)?.toLowerCase() ?? "";
	if (/\b(?:write|patch|edit|update)\b/u.test(eventType)) return "trace_write";
	return null;
}
function isSuccessfulToolResult(record) {
	if (record.aborted === true) return false;
	if (typeof record.exit_code === "number" && record.exit_code !== 0) return false;
	if (typeof record.status === "string" && !/^(ok|success|passed|pass|completed|complete)$/iu.test(record.status)) return false;
	if (typeof record.error === "string" && record.error.length > 0) return false;
	return true;
}
function hasConfirmedToolResult(events, startIndex, expectedToolName) {
	for (let index = startIndex + 1; index < events.length; index += 1) {
		const candidate = events[index];
		if (!candidate || typeof candidate !== "object") continue;
		const record = candidate;
		if (isToolResultEvent(record)) {
			const resultToolName = extractEventToolName(record)?.toLowerCase() ?? null;
			if (expectedToolName !== null && resultToolName !== null && resultToolName !== expectedToolName) continue;
			return isSuccessfulToolResult(record);
		}
		if (isToolCallEvent(record) || typeof record.type === "string" || typeof record.event === "string") return false;
	}
	return false;
}
function eventRef(index) {
	return `event:${index + 1}`;
}
function mergeCandidates(candidates) {
	const byPath = /* @__PURE__ */ new Map();
	function priority(candidate) {
		if (candidate.inclusion_source === "manual_included") return 4;
		if (candidate.included) return 3;
		if (candidate.evidence_kind === "tool_output_path") return 2;
		return 1;
	}
	for (const candidate of candidates) {
		const existing = byPath.get(candidate.path);
		if (!existing) {
			byPath.set(candidate.path, candidate);
			continue;
		}
		if (priority(candidate) > priority(existing)) byPath.set(candidate.path, candidate);
	}
	return Array.from(byPath.values()).sort((left, right) => left.path.localeCompare(right.path));
}
function extractReferencedArtifactsByEvent(events, projectRoot) {
	const out = [];
	for (const [index, event] of events.entries()) {
		const paths = extractTouchedPaths(collectEventTextsByKeys(event, PATH_TEXT_KEYS).flatMap((value) => extractPathAnchorTexts(value)), projectRoot).filter((filePath) => isReferencedArtifact(filePath, projectRoot));
		for (const filePath of paths) out.push({
			path: filePath,
			event_ref: eventRef(index),
			evidence_kind: event && typeof event === "object" && isToolResultEvent(event) && isSuccessfulToolResult(event) ? "tool_output_path" : "referenced_only"
		});
	}
	return out;
}
function extractAutoIncludedArtifactCandidates(events, projectRoot) {
	const out = [];
	for (const [index, event] of events.entries()) {
		const record = unwrapToolExecutionRecord(event);
		if (!record) continue;
		if (!isToolCallEvent(record)) continue;
		const eventArtifactPaths = extractTouchedPaths(collectEventTextsByKeys(event, PATH_TEXT_KEYS), projectRoot).filter((filePath) => isReferencedArtifact(filePath, projectRoot));
		if (eventArtifactPaths.length === 0) continue;
		if (!(extractEventType(record) === "exec_command_end" && isSuccessfulToolResult(record)) && !hasConfirmedToolResult(events, index, extractEventToolName(record)?.toLowerCase() ?? null)) continue;
		for (const filePath of eventArtifactPaths) {
			const evidenceKind = classifyArtifactWriteEvidence(record, filePath, projectRoot);
			if (!evidenceKind) continue;
			out.push({
				path: filePath,
				evidence_kind: evidenceKind,
				event_ref: eventRef(index),
				included: true,
				inclusion_source: "auto_included",
				reason: `Trace-confirmed ${evidenceKind} evidence in ${eventRef(index)}.`
			});
		}
	}
	return mergeCandidates(out);
}
function normalizeManualOverridePath(value, projectRoot) {
	const normalized = normalizePathCandidate(value, projectRoot);
	if (normalized) return normalized;
	return path.resolve(value);
}
function manualCandidates(values, projectRoot, artifactEvidence) {
	return (values ?? []).map((value) => ({
		path: normalizeManualOverridePath(value, projectRoot),
		evidence_kind: "manual_override",
		event_ref: null,
		included: true,
		inclusion_source: "manual_included",
		reason: `Manual override supplied by the operator: ${artifactEvidence ?? "no evidence"}`
	}));
}
function referencedOnlyCandidates(references, included) {
	const includedPaths = new Set(included.map((candidate) => candidate.path));
	return references.filter((reference) => !includedPaths.has(reference.path)).map((reference) => ({
		path: reference.path,
		evidence_kind: reference.evidence_kind,
		event_ref: reference.event_ref,
		included: false,
		inclusion_source: "not_included",
		reason: "Referenced in the trace, but not confirmed as created or changed in scope."
	}));
}
function includedPaths(candidates) {
	return sortUnique(candidates.filter((candidate) => candidate.included).map((candidate) => candidate.path));
}
function scoreScopeConfidence(sessionPresent, backlogItems, featureIds, touchedPaths, referencedArtifacts, ambiguities) {
	if (!sessionPresent) return "low";
	if (backlogItems.length + featureIds.length + touchedPaths.length + referencedArtifacts.length === 0) return "low";
	return ambiguities.length > 0 ? "medium" : "high";
}
function extractTraceScope({ sessionSummary, projectRoot, manualStageLogs, manualReviewArtifacts, manualVerificationArtifacts, artifactEvidence, artifactIdentity, artifactIdentityAmbiguities, artifactLinkedReviewCandidates, artifactLinkedVerificationCandidates, artifactLinkedStepCandidates }) {
	const idTexts = sessionSummary.events.flatMap((event) => collectEventTextsByKeys(event, ID_TEXT_KEYS)).filter(isHighSignalAnchorText);
	const touchedPaths = extractTouchedPaths(sessionSummary.events.flatMap((event) => collectEventTextsByKeys(event, PATH_TEXT_KEYS)).flatMap((value) => extractPathAnchorTexts(value)), projectRoot);
	const extractedBacklogItems = extractCanonicalBacklogItems(idTexts);
	const extractedFeatures = sortUnique([...extractCanonicalFeatureIds(idTexts), ...extractFeatureIdsFromPaths(touchedPaths, projectRoot)]);
	const mentionedBacklogItems = artifactIdentity?.primary_backlog_item_key ? [artifactIdentity.primary_backlog_item_key] : extractedBacklogItems;
	const mentionedFeatures = artifactIdentity?.primary_feature_id ? [artifactIdentity.primary_feature_id] : extractedFeatures;
	const referencedArtifacts = sortUnique(touchedPaths.filter((filePath) => isReferencedArtifact(filePath, projectRoot)));
	const referencedByEvent = extractReferencedArtifactsByEvent(sessionSummary.events, projectRoot);
	const autoIncludedCandidates = extractAutoIncludedArtifactCandidates(sessionSummary.events, projectRoot);
	const manualStageLogCandidates = manualCandidates(manualStageLogs, projectRoot, artifactEvidence);
	const manualReviewCandidates = manualCandidates(manualReviewArtifacts, projectRoot, artifactEvidence);
	const manualVerificationCandidates = manualCandidates(manualVerificationArtifacts, projectRoot, artifactEvidence);
	const stageLogCandidates = mergeCandidates([
		...autoIncludedCandidates.filter((candidate) => isStageLogArtifact(candidate.path, projectRoot)),
		...referencedOnlyCandidates(referencedByEvent.filter((candidate) => isStageLogArtifact(candidate.path, projectRoot)), autoIncludedCandidates),
		...manualStageLogCandidates
	]);
	const reviewArtifactCandidates = mergeCandidates([
		...autoIncludedCandidates.filter((candidate) => isReviewArtifact(candidate.path, projectRoot)),
		...artifactLinkedReviewCandidates ?? [],
		...referencedOnlyCandidates(referencedByEvent.filter((candidate) => isReviewArtifact(candidate.path, projectRoot)), autoIncludedCandidates),
		...manualReviewCandidates
	]);
	const verificationArtifactCandidates = mergeCandidates([
		...autoIncludedCandidates.filter((candidate) => isVerificationArtifact(candidate.path, projectRoot)),
		...artifactLinkedVerificationCandidates ?? [],
		...referencedOnlyCandidates(referencedByEvent.filter((candidate) => isVerificationArtifact(candidate.path, projectRoot)), autoIncludedCandidates),
		...manualVerificationCandidates
	]);
	const stepArtifactCandidates = mergeCandidates([
		...autoIncludedCandidates.filter((candidate) => isStepArtifact(candidate.path, projectRoot)),
		...artifactLinkedStepCandidates ?? [],
		...referencedOnlyCandidates(referencedByEvent.filter((candidate) => isStepArtifact(candidate.path, projectRoot)), autoIncludedCandidates)
	]);
	const candidateStageLogs = includedPaths(stageLogCandidates);
	const candidateReviewArtifacts = includedPaths(reviewArtifactCandidates);
	const candidateVerificationArtifacts = includedPaths(verificationArtifactCandidates);
	const candidateStepArtifacts = includedPaths(stepArtifactCandidates);
	const scopeAmbiguities = [];
	scopeAmbiguities.push(...artifactIdentityAmbiguities ?? []);
	if (mentionedBacklogItems.length === 0 && mentionedFeatures.length === 0 && touchedPaths.length === 0 && referencedArtifacts.length === 0) scopeAmbiguities.push("No trace-derived backlog items, feature ids, or touched project paths were found.");
	if (!artifactIdentity?.primary_backlog_item_key && extractedBacklogItems.length > 1) scopeAmbiguities.push(`Multiple backlog items were mentioned in one trace: ${extractedBacklogItems.join(", ")}.`);
	if (!artifactIdentity?.primary_feature_id && extractedFeatures.length > 1) scopeAmbiguities.push(`Multiple feature ids were mentioned in one trace: ${extractedFeatures.join(", ")}.`);
	if (candidateStageLogs.length === 0) scopeAmbiguities.push("The session trace did not confirm any stage-log path created or changed in this session.");
	if (mentionedFeatures.length > 0 && candidateReviewArtifacts.length === 0) scopeAmbiguities.push(`The trace did not directly confirm any review artifacts for extracted feature ids ${mentionedFeatures.join(", ")}.`);
	if (mentionedFeatures.length > 0 && candidateVerificationArtifacts.length === 0) scopeAmbiguities.push(`The trace did not directly confirm any verification artifacts for extracted feature ids ${mentionedFeatures.join(", ")}.`);
	if (manualStageLogCandidates.length > 0) scopeAmbiguities.push("Manual stage-log overrides were included; validate their scope.");
	if (manualReviewCandidates.length > 0) scopeAmbiguities.push("Manual review-artifact overrides were included; validate their scope.");
	if (manualVerificationCandidates.length > 0) scopeAmbiguities.push("Manual verification-artifact overrides were included; validate their scope.");
	return {
		project_root: projectRoot,
		mentioned_backlog_items: mentionedBacklogItems,
		mentioned_features: mentionedFeatures,
		touched_paths: touchedPaths,
		referenced_artifacts: referencedArtifacts,
		candidate_stage_logs: candidateStageLogs,
		candidate_review_artifacts: candidateReviewArtifacts,
		candidate_verification_artifacts: candidateVerificationArtifacts,
		candidate_step_artifacts: candidateStepArtifacts,
		artifact_identity: artifactIdentity ?? {
			phase_scope: null,
			primary_backlog_item_key: null,
			primary_feature_id: null,
			source: null
		},
		stage_log_candidates: stageLogCandidates,
		review_artifact_candidates: reviewArtifactCandidates,
		verification_artifact_candidates: verificationArtifactCandidates,
		step_artifact_candidates: stepArtifactCandidates,
		scope_confidence: scoreScopeConfidence(sessionSummary.exists, mentionedBacklogItems, mentionedFeatures, touchedPaths, referencedArtifacts, scopeAmbiguities),
		scope_ambiguities: scopeAmbiguities
	};
}
//#endregion
//#region src/core/infer-candidate-incidents.ts
function processMissEvidence(metadata, proseLines) {
	if (Array.isArray(metadata.process_misses)) return {
		count: metadata.process_misses.length,
		reason: "Structured process_misses field indicates process misses."
	};
	const structuredTotal = Number(metadata.process_misses_total);
	if (Number.isFinite(structuredTotal)) return {
		count: structuredTotal,
		reason: "Structured process_misses_total field indicates process misses."
	};
	return {
		count: proseLines.length,
		reason: proseLines.join("; ")
	};
}
function inferCandidateIncidents(sessionSummary, logSummary) {
	const incidents = [];
	for (const log of logSummary.logs) {
		const metadata = log.metadata;
		const stage = stringFromUnknown(metadata.stage, "unknown");
		const processMisses = processMissEvidence(metadata, log.processMissLines);
		const structuredReviewFindings = Number(metadata.review_findings_total);
		const hasStructuredReviewFindings = Number.isFinite(structuredReviewFindings);
		const reviewFindingTotal = hasStructuredReviewFindings ? structuredReviewFindings : 0;
		if (processMisses.count > 0) incidents.push({
			title: `Process misses in ${path.basename(log.filePath)}`,
			severity: processMisses.count >= 2 ? "high" : "medium",
			stage,
			evidence: log.filePath,
			reason: processMisses.reason
		});
		if (reviewFindingTotal > 0) incidents.push({
			title: `Review findings in ${path.basename(log.filePath)}`,
			severity: reviewFindingTotal >= 3 ? "high" : "medium",
			stage,
			evidence: log.filePath,
			reason: `${reviewFindingTotal} review finding(s) recorded.`
		});
		if (metadata.backlog_actualized === false && /backlog/iu.test(log.raw)) incidents.push({
			title: `Backlog actualization deferred in ${path.basename(log.filePath)}`,
			severity: "low",
			stage,
			evidence: log.filePath,
			reason: "The log references backlog actualization but marks it incomplete or deferred."
		});
		const reviewText = (log.sections["События ревью"] || log.sections["Review events"] || "").toLowerCase();
		if (!hasStructuredReviewFindings && (reviewText.includes("fail") || reviewText.includes("non-compliant"))) incidents.push({
			title: `Non-pass review cycle in ${path.basename(log.filePath)}`,
			severity: "medium",
			stage,
			evidence: log.filePath,
			reason: "At least one review event returned FAIL or non-compliant before final pass."
		});
	}
	if (sessionSummary.abortedTurns > 0 && sessionSummary.filePath) incidents.push({
		title: "Aborted or restarted turns detected",
		severity: sessionSummary.abortedTurns >= 3 ? "high" : "medium",
		stage: "session",
		evidence: sessionSummary.filePath,
		reason: `${sessionSummary.abortedTurns} aborted/restarted turn(s) detected in the session trace.`
	});
	return incidents;
}
//#endregion
//#region src/core/resolve-evidence-roots.ts
function resolveStandardEvidenceDir(projectRoot, relativeDir) {
	if (!projectRoot) return;
	const absoluteDir = path.join(projectRoot, relativeDir);
	return fs.existsSync(absoluteDir) ? absoluteDir : void 0;
}
//#endregion
//#region src/parsers/markdown.ts
function parseMarkdownSections(body) {
	const lines = body.split(/\r?\n/);
	const sections = { intro: [] };
	let current = "intro";
	for (const line of lines) {
		const heading = line.match(/^##+\s+(.+?)\s*$/u);
		if (heading) {
			current = heading[1] ?? "intro";
			sections[current] = [];
			continue;
		}
		const bucket = sections[current];
		if (bucket) bucket.push(line);
	}
	return Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.join("\n").trim()]));
}
function splitBulletish(text) {
	return text.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
}
//#endregion
//#region src/parsers/stage-log.ts
function parseReviewEvents(text) {
	const lines = text.split(/\r?\n/);
	const events = [];
	let current = null;
	for (const rawLine of lines) {
		const line = rawLine.trim();
		const bulletMatch = line.match(/^-\s+(.+)$/u);
		if (bulletMatch) {
			if (current) events.push(current);
			const raw = bulletMatch[1] ?? "";
			const timestampMatch = raw.match(/(\d{4}-\d{2}-\d{2}T[0-9:+-]+)/u);
			const verdictMatch = raw.match(/\b(PASS|FAIL|pass|fail|non-compliant)\b/u);
			current = {
				raw,
				details: [],
				timestamp: timestampMatch?.[1] ?? null,
				verdict: verdictMatch?.[1]?.toLowerCase() ?? null
			};
			continue;
		}
		if (line.startsWith("-") && current) current.details.push(line.slice(1).trim());
	}
	if (current) events.push(current);
	return events;
}
function parseStageLog(filePath) {
	const raw = readText(filePath);
	const normalized = raw.replace(/^\uFEFF/u, "");
	let metadata = {};
	let body = normalized;
	const yamlFence = normalized.match(/^```yaml\s*\n([\s\S]*?)\n```\s*\n?/u);
	if (yamlFence) {
		metadata = parseLooseYaml(yamlFence[1] ?? "");
		body = normalized.slice(yamlFence[0].length);
	} else if (normalized.startsWith("---\n")) {
		const match = normalized.match(/^---\n([\s\S]*?)\n---\s*\n?/u);
		if (match) {
			metadata = parseLooseYaml(match[1] ?? "");
			body = normalized.slice(match[0].length);
		}
	}
	const sections = parseMarkdownSections(body);
	const reviewText = sections["События ревью"] || sections["Review events"] || "";
	const processMissesText = sections["Процессные промахи"] || sections["Process misses"] || "";
	const closeOutText = sections["Закрытие"] || sections["Close-out"] || "";
	return {
		filePath,
		raw,
		metadata,
		sections,
		reviewEvents: parseReviewEvents(reviewText),
		processMissLines: splitBulletish(processMissesText),
		closeOutLines: splitBulletish(closeOutText)
	};
}
//#endregion
//#region src/core/summarize-logs.ts
function emptyMetricSource(reason) {
	return {
		quality: "none",
		reason
	};
}
function createEmptyMetrics() {
	return {
		logsTotal: 0,
		reviewRoundsTotal: 0,
		reviewFindingsTotal: 0,
		processMissesTotal: 0,
		backlogActualizedCount: 0,
		stages: {},
		skillsReferenced: {},
		lateLogStartCount: 0,
		sources: {
			candidate_incidents: emptyMetricSource("No stage logs were analyzed."),
			process_misses: emptyMetricSource("No stage logs were analyzed."),
			skills_referenced: emptyMetricSource("No stage logs were analyzed.")
		}
	};
}
function qualityRank(value) {
	return {
		none: 0,
		structured: 3,
		unvalidated_fallback: 1,
		validated_fallback: 2
	}[value];
}
function mergeQuality(current, incoming) {
	if (current === "unvalidated_fallback" || incoming === "unvalidated_fallback") return "unvalidated_fallback";
	return qualityRank(incoming) > qualityRank(current) ? incoming : current;
}
function stringArray(value) {
	return Array.isArray(value) ? value.filter((entry) => typeof entry === "string" && entry.trim() !== "") : [];
}
function processMissCount(log) {
	const structuredMisses = Array.isArray(log.metadata.process_misses) ? log.metadata.process_misses : null;
	if (structuredMisses) return {
		count: structuredMisses.length,
		quality: "structured"
	};
	const structuredTotal = Number(log.metadata.process_misses_total);
	if (Number.isFinite(structuredTotal)) return {
		count: structuredTotal,
		quality: "structured"
	};
	if (log.processMissLines.length > 0) return {
		count: log.processMissLines.length,
		quality: "unvalidated_fallback"
	};
	return {
		count: 0,
		quality: "none"
	};
}
function skillNames(log) {
	const skillsUsed = stringArray(log.metadata.skills_used);
	if (skillsUsed.length > 0) return {
		skills: skillsUsed,
		quality: "structured"
	};
	const legacySkill = stringFromUnknown(log.metadata.skill, "");
	if (legacySkill) return {
		skills: [legacySkill],
		quality: "validated_fallback"
	};
	return {
		skills: ["unknown"],
		quality: "none"
	};
}
function reviewIncidentQuality(log) {
	const structuredFindings = Number(log.metadata.review_findings_total);
	if (Number.isFinite(structuredFindings)) return "structured";
	const reviewText = (log.sections["События ревью"] || log.sections["Review events"] || "").toLowerCase();
	return reviewText.includes("fail") || reviewText.includes("non-compliant") ? "unvalidated_fallback" : "none";
}
function isSafeStageSegment(value) {
	return /^[A-Za-z0-9._-]+$/u.test(value) && value !== "." && value !== "..";
}
function pathInside(root, candidate) {
	const relative = path.relative(root, candidate);
	return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function safeFileInsideRoot(root, candidate) {
	try {
		const stat = fs.lstatSync(candidate);
		if (!stat.isFile() || stat.isSymbolicLink()) return false;
		return pathInside(fs.realpathSync(root), fs.realpathSync(candidate));
	} catch {
		return false;
	}
}
function stageStatePath(projectRoot, log) {
	const featureId = stringFromUnknown(log.metadata.primary_feature_id, "") || stringFromUnknown(log.metadata.feature_id, "");
	const stage = stringFromUnknown(log.metadata.stage, "");
	if (!featureId || !stage || !isSafeStageSegment(featureId) || !isSafeStageSegment(stage)) return null;
	return path.join(projectRoot, ".dossier", "stages", featureId, `${stage}.json`);
}
var STAGE_STATE_ALLOWED_FIELDS = new Set([
	"backlog_actualized",
	"backlog_item_key",
	"closed_at",
	"close_out_ts",
	"closeout_ts",
	"completed_at",
	"feature_id",
	"final_pass_ts",
	"intake_process_complete_ts",
	"late_log_start",
	"late_start",
	"log_quality",
	"phase_completed_at",
	"phase_scope",
	"primary_backlog_item_key",
	"primary_feature_id",
	"process_complete_ts",
	"process_misses",
	"process_misses_total",
	"ready_for_close_ts",
	"review_artifact",
	"review_artifacts",
	"review_findings_total",
	"review_passed_at",
	"review_rounds",
	"review_rounds_total",
	"skill",
	"skill_followups",
	"skill_issues",
	"skills_used",
	"stage",
	"step_artifact",
	"step_artifacts",
	"step_close_ts",
	"verification_artifact",
	"verification_artifacts",
	"verification_completed_at",
	"verify_artifact"
]);
function selectedStageStateFields(input) {
	return Object.fromEntries(Object.entries(input).filter(([key]) => STAGE_STATE_ALLOWED_FIELDS.has(key)));
}
function firstString(...values) {
	return values.find((value) => typeof value === "string" && value.length > 0) ?? "";
}
function matchingOptionalField(left, right) {
	return !left || !right || left === right;
}
function stageStateScopeMatches(state, log) {
	const logFeatureId = firstString(log.metadata.primary_feature_id, log.metadata.feature_id);
	const stateFeatureId = firstString(state.primary_feature_id, state.feature_id);
	const logBacklogItem = firstString(log.metadata.primary_backlog_item_key, log.metadata.backlog_item_key);
	const stateBacklogItem = firstString(state.primary_backlog_item_key, state.backlog_item_key);
	const logStage = firstString(log.metadata.stage);
	const stateStage = firstString(state.stage);
	return matchingOptionalField(logFeatureId, stateFeatureId) && matchingOptionalField(logBacklogItem, stateBacklogItem) && matchingOptionalField(logStage, stateStage);
}
function enrichLogWithStageState(log, projectRoot) {
	if (!projectRoot || !pathInside(projectRoot, log.filePath)) return log;
	const statePath = stageStatePath(projectRoot, log);
	if (!statePath || !safeFileInsideRoot(projectRoot, statePath)) return log;
	try {
		const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
		if (!stageStateScopeMatches(parsed, log)) return {
			...log,
			metadata: {
				...log.metadata,
				stage_state_artifact_rejected: statePath,
				stage_state_rejection_reason: "Stage state scope did not match the included stage log."
			}
		};
		return {
			...log,
			metadata: {
				...log.metadata,
				...selectedStageStateFields(parsed),
				stage_state_artifact: statePath
			}
		};
	} catch {
		return log;
	}
}
function sourceReason(quality, metric) {
	if (quality === "structured") return `${metric} used structured stage artifact fields where available.`;
	if (quality === "validated_fallback") return `${metric} used legacy structured metadata fields because new structured fields were absent.`;
	if (quality === "unvalidated_fallback") return `${metric} used prose fallback because structured fields were absent in at least one analyzed log.`;
	return `${metric} had no usable evidence in analyzed logs.`;
}
function summarizeParsedLogs(logs) {
	const metrics = createEmptyMetrics();
	metrics.logsTotal = logs.length;
	let processMissQuality = "none";
	let skillsQuality = "none";
	let candidateIncidentQuality = "none";
	for (const log of logs) {
		const metadata = log.metadata;
		const stage = stringFromUnknown(metadata.stage, "unknown");
		const reviewRounds = Number(metadata.review_rounds ?? metadata.review_rounds_total ?? log.reviewEvents.length ?? 0);
		const reviewFindings = Number(metadata.review_findings_total ?? 0);
		const processMisses = processMissCount(log);
		const reviewIncidents = reviewIncidentQuality(log);
		const skills = skillNames(log);
		metrics.reviewRoundsTotal += Number.isFinite(reviewRounds) ? reviewRounds : 0;
		metrics.reviewFindingsTotal += Number.isFinite(reviewFindings) ? reviewFindings : 0;
		metrics.processMissesTotal += processMisses.count;
		metrics.backlogActualizedCount += metadata.backlog_actualized === true ? 1 : 0;
		if (metadata.late_start === true || metadata.late_log_start === true) metrics.lateLogStartCount += 1;
		processMissQuality = mergeQuality(processMissQuality, processMisses.quality);
		candidateIncidentQuality = mergeQuality(mergeQuality(candidateIncidentQuality, processMisses.quality), reviewIncidents);
		skillsQuality = mergeQuality(skillsQuality, skills.quality);
		metrics.stages[stage] = (metrics.stages[stage] ?? 0) + 1;
		for (const skill of skills.skills) metrics.skillsReferenced[skill] = (metrics.skillsReferenced[skill] ?? 0) + 1;
	}
	metrics.sources.process_misses = {
		quality: processMissQuality,
		reason: sourceReason(processMissQuality, "process_misses")
	};
	metrics.sources.skills_referenced = {
		quality: skillsQuality,
		reason: sourceReason(skillsQuality, "skills_referenced")
	};
	metrics.sources.candidate_incidents = {
		quality: candidateIncidentQuality,
		reason: candidateIncidentQuality === "unvalidated_fallback" ? "Candidate incident inference includes prose fallback evidence." : "Candidate incident inference uses structured evidence where available."
	};
	return {
		exists: true,
		logs,
		metrics
	};
}
function summarizeLogs(logsDir, allowedFilePaths, projectRoot) {
	const files = allowedFilePaths === void 0 ? [] : Array.from(new Set(allowedFilePaths.filter((filePath) => filePath.endsWith(".md") && fs.existsSync(filePath))));
	if (!logsDir || !fs.existsSync(logsDir)) {
		if (files.length > 0) return summarizeParsedLogs(files.map((filePath) => enrichLogWithStageState(parseStageLog(filePath), projectRoot ?? null)));
		return {
			exists: false,
			logs: [],
			metrics: createEmptyMetrics()
		};
	}
	return summarizeParsedLogs(files.map((filePath) => enrichLogWithStageState(parseStageLog(filePath), projectRoot ?? null)));
}
//#endregion
//#region src/parsers/jsonl.ts
function parseJsonl(filePath) {
	const lines = readText(filePath).split(/\r?\n/);
	const sourceLineCount = lines.at(-1)?.trim() === "" ? Math.max(lines.length - 1, 0) : lines.length;
	const events = [];
	const eventLines = [];
	const errors = [];
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const lineNumber = index + 1;
		if (!line || line.trim().length === 0) continue;
		try {
			events.push(JSON.parse(line));
			eventLines.push(lineNumber);
		} catch (error) {
			errors.push({
				line: lineNumber,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}
	return {
		events,
		eventLines,
		errors,
		sourceLineCount
	};
}
//#endregion
//#region src/core/summarize-session.ts
function createFullTraceBoundary() {
	return {
		mode: "full_trace",
		until_line: null,
		until_ts: null,
		reason: "No explicit phase boundary was provided; the full trace was analyzed.",
		excluded_events_count: 0
	};
}
function applyBoundary(events, eventLines, parseErrors, sourceLineCount, options) {
	if (options.untilLine !== void 0) {
		const untilLine = options.untilLine;
		if (!Number.isInteger(untilLine) || untilLine < 1) throw new Error("--until-line must be a positive integer");
		if (untilLine > sourceLineCount) throw new Error(`--until-line ${untilLine} exceeds the session trace length of ${sourceLineCount} line(s)`);
		const boundedEvents = events.filter((_, index) => (eventLines[index] ?? 0) <= untilLine);
		return {
			events: boundedEvents,
			eventLines: eventLines.filter((line) => line <= untilLine),
			parseErrors: parseErrors.filter((error) => error.line <= untilLine),
			phaseBoundary: {
				mode: "until_line",
				until_line: untilLine,
				until_ts: null,
				reason: "Operator supplied --until-line to exclude later events from the analyzed phase.",
				excluded_events_count: events.length - boundedEvents.length
			}
		};
	}
	if (options.untilTs !== void 0) {
		const boundaryDate = tryParseDate(options.untilTs);
		if (!boundaryDate) throw new Error("--until-ts must be a valid ISO-like timestamp");
		const boundedEvents = [];
		const boundedEventLines = [];
		let boundaryReached = false;
		for (const [index, event] of events.entries()) {
			if (boundaryReached) continue;
			const timestamp = extractTimestamp(event);
			const eventDate = timestamp ? tryParseDate(timestamp) : null;
			if (eventDate && eventDate.valueOf() > boundaryDate.valueOf()) {
				boundaryReached = true;
				continue;
			}
			boundedEvents.push(event);
			boundedEventLines.push(eventLines[index] ?? 0);
		}
		return {
			events: boundedEvents,
			eventLines: boundedEventLines,
			parseErrors,
			phaseBoundary: {
				mode: "until_ts",
				until_line: null,
				until_ts: boundaryDate.toISOString(),
				reason: "Operator supplied --until-ts to exclude later events from the analyzed phase.",
				excluded_events_count: events.length - boundedEvents.length
			}
		};
	}
	if (options.artifactUntilTs !== void 0) {
		const boundaryDate = tryParseDate(options.artifactUntilTs);
		if (!boundaryDate) throw new Error("artifact-derived phase boundary must be a valid ISO-like timestamp");
		const boundedEvents = [];
		const boundedEventLines = [];
		let boundaryReached = false;
		for (const [index, event] of events.entries()) {
			if (boundaryReached) continue;
			const timestamp = extractTimestamp(event);
			const eventDate = timestamp ? tryParseDate(timestamp) : null;
			if (eventDate && eventDate.valueOf() > boundaryDate.valueOf()) {
				boundaryReached = true;
				continue;
			}
			boundedEvents.push(event);
			boundedEventLines.push(eventLines[index] ?? 0);
		}
		return {
			events: boundedEvents,
			eventLines: boundedEventLines,
			parseErrors,
			phaseBoundary: {
				mode: "artifact_derived",
				until_line: null,
				until_ts: boundaryDate.toISOString(),
				reason: "Derived from linked stage/closure artifact timestamps to exclude later same-session work.",
				excluded_events_count: events.length - boundedEvents.length
			}
		};
	}
	return {
		events,
		eventLines,
		parseErrors,
		phaseBoundary: createFullTraceBoundary()
	};
}
function summarizeSession(filePath, options = {}) {
	if (!filePath || !fs.existsSync(filePath)) return {
		filePath,
		sessionId: null,
		projectRoot: null,
		exists: false,
		phaseBoundary: createFullTraceBoundary(),
		eventCount: 0,
		parseErrors: [],
		firstTimestamp: null,
		lastTimestamp: null,
		durationMinutes: null,
		abortedTurns: 0,
		longGaps: 0,
		tools: {},
		sampleEventTypes: [],
		events: [],
		eventLines: []
	};
	if ([
		options.untilLine,
		options.untilTs,
		options.artifactUntilTs
	].filter((value) => value !== void 0).length > 1) throw new Error("Use only one phase boundary source");
	const { events: parsedEvents, eventLines, errors, sourceLineCount } = parseJsonl(filePath);
	const { events, eventLines: boundedEventLines, parseErrors, phaseBoundary } = applyBoundary(parsedEvents, eventLines, errors, sourceLineCount, options);
	const toolCounts = /* @__PURE__ */ new Map();
	let sessionId = null;
	let projectRoot = null;
	let firstTimestamp = null;
	let lastTimestamp = null;
	let abortedTurns = 0;
	let longGaps = 0;
	let previousDate = null;
	for (const event of events) {
		if (event && typeof event === "object" && event.type === "session_meta") {
			const payload = event.payload;
			if (payload && typeof payload === "object") {
				const meta = payload;
				if (typeof meta.id === "string" && meta.id.length > 0) sessionId = meta.id;
				if (typeof meta.cwd === "string" && meta.cwd.length > 0) projectRoot = meta.cwd;
			}
		}
		const timestamp = extractTimestamp(event);
		if (timestamp) {
			firstTimestamp ??= timestamp;
			lastTimestamp = timestamp;
			const currentDate = tryParseDate(timestamp);
			if (previousDate && currentDate) {
				const gapMinutes = diffMinutes(previousDate.toISOString(), currentDate.toISOString());
				if (gapMinutes !== null && gapMinutes >= 10) longGaps += 1;
			}
			if (currentDate) previousDate = currentDate;
		}
		const eventType = extractEventType$1(event).toLowerCase();
		const eventText = JSON.stringify(event).toLowerCase();
		if (eventType.includes("abort") || eventText.includes("aborted turn") || eventText.includes("\"aborted\":true")) abortedTurns += 1;
		for (const toolName of extractToolNames(event)) toolCounts.set(toolName, (toolCounts.get(toolName) ?? 0) + 1);
	}
	return {
		filePath,
		sessionId,
		projectRoot,
		exists: true,
		phaseBoundary,
		eventCount: events.length,
		parseErrors,
		firstTimestamp,
		lastTimestamp,
		durationMinutes: firstTimestamp && lastTimestamp ? diffMinutes(firstTimestamp, lastTimestamp) : null,
		abortedTurns,
		longGaps,
		tools: Object.fromEntries(Array.from(toolCounts.entries()).sort((left, right) => right[1] - left[1])),
		sampleEventTypes: Array.from(new Set(events.map((event) => extractEventType$1(event)))).slice(0, 25),
		events,
		eventLines: boundedEventLines
	};
}
//#endregion
//#region src/core/build-scan-summary.ts
function hasManualOverrides(args) {
	return (args.stageLogs?.length ?? 0) > 0 || (args.reviewArtifacts?.length ?? 0) > 0 || (args.verificationArtifacts?.length ?? 0) > 0;
}
function assertManualOverridesHaveEvidence(args) {
	if (hasManualOverrides(args) && !args.artifactEvidence?.trim()) throw new Error("Manual artifact overrides require artifactEvidence with a short justification");
}
function hasManualCandidates(candidates) {
	return candidates.some((candidate) => candidate.inclusion_source === "manual_included");
}
function buildReportStatus(input) {
	const reasons = [];
	const { sessionSummary, logSummary, skillTraceSummary, scope } = input;
	if (!sessionSummary.exists) reasons.push("Session trace is missing.");
	if (sessionSummary.parseErrors.length > 0) reasons.push(`Session trace has ${sessionSummary.parseErrors.length} parse error(s).`);
	if (!logSummary.exists) reasons.push("Stage-log directory is missing or unresolved.");
	if (skillTraceSummary.available.length === 0) reasons.push("Injected Available skills catalog is missing or unresolved.");
	if (logSummary.metrics.logsTotal === 0 && scope.referenced_artifacts.some((artifactPath) => artifactPath.includes(".dossier"))) reasons.push("Trace indicates dossier activity, but no stage logs were analyzed.");
	if (scope.scope_ambiguities.length > 0) reasons.push("Unresolved scope ambiguities remain.");
	if (hasManualCandidates(scope.stage_log_candidates) || hasManualCandidates(scope.review_artifact_candidates) || hasManualCandidates(scope.verification_artifact_candidates)) reasons.push("Manual artifact overrides were used.");
	if (hasUnvalidatedFallbackMetrics(logSummary.metrics.sources)) reasons.push("Unvalidated fallback metrics require agent validation.");
	return {
		status: reasons.length > 0 ? "draft_requires_agent_validation" : "ready_for_agent_finalization",
		reasons
	};
}
function explicitBoundaryOptions(args) {
	const out = {};
	if (args.untilLine !== void 0) out.untilLine = args.untilLine;
	if (args.untilTs !== void 0) out.untilTs = args.untilTs;
	return out;
}
function hasExplicitBoundary(args) {
	return args.untilLine !== void 0 || args.untilTs !== void 0;
}
function scopeOptions(input) {
	const options = {
		sessionSummary: input.sessionSummary,
		projectRoot: input.projectRoot
	};
	if (input.args.stageLogs) options.manualStageLogs = input.args.stageLogs;
	if (input.args.reviewArtifacts) options.manualReviewArtifacts = input.args.reviewArtifacts;
	if (input.args.verificationArtifacts) options.manualVerificationArtifacts = input.args.verificationArtifacts;
	if (input.args.artifactEvidence) options.artifactEvidence = input.args.artifactEvidence;
	if (input.enhancement) {
		options.artifactIdentity = input.enhancement.artifactIdentity;
		options.artifactIdentityAmbiguities = input.enhancement.artifactIdentityAmbiguities;
		options.artifactLinkedReviewCandidates = input.enhancement.artifactLinkedReviewCandidates;
		options.artifactLinkedVerificationCandidates = input.enhancement.artifactLinkedVerificationCandidates;
		options.artifactLinkedStepCandidates = input.enhancement.artifactLinkedStepCandidates;
	}
	return options;
}
function collectEvidence(input) {
	const initialScope = extractTraceScope(scopeOptions({
		args: input.args,
		sessionSummary: input.sessionSummary,
		projectRoot: input.projectRoot
	}));
	const enhancement = deriveArtifactEvidenceEnhancement({
		logs: summarizeLogs(input.logsDir, initialScope.candidate_stage_logs, input.projectRoot).logs,
		projectRoot: input.projectRoot
	});
	const scope = extractTraceScope(scopeOptions({
		args: input.args,
		sessionSummary: input.sessionSummary,
		projectRoot: input.projectRoot,
		enhancement
	}));
	return {
		scope,
		logSummary: summarizeLogs(input.logsDir, scope.candidate_stage_logs, input.projectRoot),
		enhancement
	};
}
function artifactBoundaryExcludesLaterEvents(sessionSummary, artifactBoundaryTs) {
	const boundaryDate = tryParseDate(artifactBoundaryTs);
	const firstDate = tryParseDate(sessionSummary.firstTimestamp);
	const lastDate = tryParseDate(sessionSummary.lastTimestamp);
	if (!boundaryDate || !lastDate) return false;
	if (firstDate && boundaryDate.valueOf() < firstDate.valueOf()) return false;
	return boundaryDate.valueOf() < lastDate.valueOf();
}
function eventIndexFromRef(eventRef) {
	const match = eventRef?.match(/^event:(\d+)$/u);
	if (!match?.[1]) return null;
	return Number(match[1]) - 1;
}
function hasRetrospectiveFollowupMarker(event) {
	const text = JSON.stringify(event).toLowerCase();
	return text.includes(".dossier/retro") || text.includes("retrospective-report") || text.includes("skill-audit") || text.includes("logging-review") || text.includes("retro-cli") || text.includes("retrospective extraction") || text.includes("ретроанализ") || text.includes("ретроспектив");
}
var LATER_BACKLOG_ITEM_PATTERN = /(^|[^A-Za-z0-9_-])(CF-\d{3,4})(?![A-Za-z0-9_-])/gu;
var LATER_FEATURE_ID_PATTERN = /(^|[^A-Za-z0-9_-])(F-\d{4})(?![A-Za-z0-9_-])/gu;
function extractCanonicalIdsFromEvent(event) {
	const text = JSON.stringify(event);
	const backlogItems = Array.from(text.matchAll(LATER_BACKLOG_ITEM_PATTERN)).map((match) => match[2]).filter((value) => value !== void 0);
	const features = Array.from(text.matchAll(LATER_FEATURE_ID_PATTERN)).map((match) => match[2]).filter((value) => value !== void 0);
	return {
		backlogItems: Array.from(new Set(backlogItems)),
		features: Array.from(new Set(features))
	};
}
function hasDifferentLaterWorkItem(input) {
	const ids = extractCanonicalIdsFromEvent(input.event);
	const allowedBacklogItems = new Set(input.scope.artifact_identity.primary_backlog_item_key ? [input.scope.artifact_identity.primary_backlog_item_key] : input.scope.mentioned_backlog_items);
	const allowedFeatures = new Set(input.scope.artifact_identity.primary_feature_id ? [input.scope.artifact_identity.primary_feature_id] : input.scope.mentioned_features);
	return ids.backlogItems.some((backlogItem) => allowedBacklogItems.size > 0 && !allowedBacklogItems.has(backlogItem)) || ids.features.some((feature) => allowedFeatures.size > 0 && !allowedFeatures.has(feature));
}
function hasAmbiguousSameSessionBoundary(input) {
	const candidateRefs = [
		...input.scope.stage_log_candidates,
		...input.scope.review_artifact_candidates,
		...input.scope.verification_artifact_candidates,
		...input.scope.step_artifact_candidates
	].filter((candidate) => candidate.included && candidate.inclusion_source === "auto_included" && candidate.event_ref !== null).map((candidate) => eventIndexFromRef(candidate.event_ref)).filter((index) => index !== null);
	const lastStrongArtifactEventIndex = Math.max(...candidateRefs);
	if (!Number.isFinite(lastStrongArtifactEventIndex)) return false;
	return input.sessionSummary.events.slice(lastStrongArtifactEventIndex + 1).some((event) => hasRetrospectiveFollowupMarker(event) || hasDifferentLaterWorkItem({
		event,
		scope: input.scope
	}));
}
function hasTraceConfirmedStageScopeAmbiguity(scope) {
	if (scope.stage_log_candidates.filter((candidate) => candidate.included && candidate.inclusion_source === "auto_included").length < 2) return false;
	return scope.scope_ambiguities.some((ambiguity) => ambiguity.startsWith("Multiple artifact ") || ambiguity.startsWith("Multiple backlog items") || ambiguity.startsWith("Multiple feature ids"));
}
function buildScanSummary(args) {
	assertManualOverridesHaveEvidence(args);
	const operatorLanguage = args.language ?? "und";
	const reportLanguage = args.language ?? "en";
	let sessionSummary = summarizeSession(args.session, explicitBoundaryOptions(args));
	let resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
	let resolvedLogsDir = args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, ".dossier/logs");
	let resolvedArtifactsDir = args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? void 0;
	let { scope, logSummary, enhancement } = collectEvidence({
		args,
		sessionSummary,
		projectRoot: resolvedProjectRoot,
		logsDir: resolvedLogsDir
	});
	if (!hasExplicitBoundary(args) && artifactBoundaryExcludesLaterEvents(sessionSummary, enhancement.artifactBoundaryTs)) {
		sessionSummary = summarizeSession(args.session, { artifactUntilTs: enhancement.artifactBoundaryTs });
		resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
		resolvedLogsDir = args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, ".dossier/logs");
		resolvedArtifactsDir = args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? void 0;
		({scope, logSummary, enhancement} = collectEvidence({
			args,
			sessionSummary,
			projectRoot: resolvedProjectRoot,
			logsDir: resolvedLogsDir
		}));
	} else if (!hasExplicitBoundary(args) && (hasAmbiguousSameSessionBoundary({
		sessionSummary,
		scope
	}) || hasTraceConfirmedStageScopeAmbiguity(scope))) throw new Error("Ambiguous same-session phase boundary: later same-session work appears after analyzed artifacts or trace-confirmed stage artifacts have conflicting scope; provide --until-line or --until-ts.");
	const skillScopeOptions = {
		sessionSummary,
		logMetrics: logSummary.metrics
	};
	if (args.skillsDir) skillScopeOptions.skillsDir = args.skillsDir;
	const skillTraceSummary = extractSkillTraceSummary(skillScopeOptions);
	const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);
	const reportStatus = buildReportStatus({
		sessionSummary,
		logSummary,
		skillTraceSummary,
		scope
	});
	const summaryBase = {
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		operator_language: operatorLanguage,
		report_language: reportLanguage,
		inputs: {
			session: args.session ?? null,
			logsDir: args.logsDir ?? null,
			artifactsDir: args.artifactsDir ?? null,
			skillsDir: args.skillsDir ?? null,
			outRoot: args.outRoot ?? null,
			runDir: args.runDir ?? null,
			language: args.language ?? null,
			draft: args.draft ?? false,
			untilLine: args.untilLine ?? null,
			untilTs: args.untilTs ?? null,
			stageLogs: args.stageLogs ?? [],
			reviewArtifacts: args.reviewArtifacts ?? [],
			verificationArtifacts: args.verificationArtifacts ?? [],
			artifactEvidence: args.artifactEvidence ?? null
		},
		resolved: {
			session: args.session ?? null,
			logsDir: resolvedLogsDir ?? null,
			artifactsDir: resolvedArtifactsDir ?? null,
			skillsDir: args.skillsDir ?? null
		},
		dataQuality: {
			sessionPresent: sessionSummary.exists,
			logsPresent: logSummary.exists,
			skillCatalogPresent: skillTraceSummary.available.length > 0,
			sessionParseErrors: sessionSummary.parseErrors.length
		},
		phase_boundary: sessionSummary.phaseBoundary,
		session: {
			filePath: sessionSummary.filePath,
			sessionId: sessionSummary.sessionId,
			projectRoot: sessionSummary.projectRoot,
			eventCount: sessionSummary.eventCount,
			firstTimestamp: sessionSummary.firstTimestamp,
			lastTimestamp: sessionSummary.lastTimestamp,
			durationMinutes: sessionSummary.durationMinutes,
			abortedTurns: sessionSummary.abortedTurns,
			longGaps: sessionSummary.longGaps,
			tools: sessionSummary.tools,
			sampleEventTypes: sessionSummary.sampleEventTypes
		},
		stageLogs: {
			count: logSummary.metrics.logsTotal,
			metrics: logSummary.metrics,
			files: logSummary.logs.map((log) => ({
				filePath: log.filePath,
				metadata: log.metadata,
				reviewEvents: log.reviewEvents.length,
				processMissLines: log.processMissLines
			}))
		},
		scope,
		reportStatus,
		skills: skillTraceSummary,
		candidateIncidents
	};
	const outputOptions = { commandName: "scan" };
	if (args.outRoot) outputOptions.outRoot = args.outRoot;
	if (args.runDir) outputOptions.runDir = args.runDir;
	if (args.draft) outputOptions.draft = args.draft;
	const recommendedOutput = resolveRetroOutputLayout(summaryBase, outputOptions);
	return {
		...summaryBase,
		run_dir: recommendedOutput.runDir,
		recommendedOutput
	};
}
//#endregion
//#region src/render/logging-review-markdown.ts
function statusLine$2(scan) {
	return scan.reportStatus.status === "draft_requires_agent_validation" ? "Status: draft, requires agent validation" : "Status: ready for agent finalization";
}
function formatObservedGaps(input) {
	const gaps = [];
	const missingClosureArtifacts = input.missingReviewArtifacts + input.missingVerificationArtifacts + input.missingStepArtifacts;
	if (missingClosureArtifacts > 0) gaps.push(`Not all logs include the full closure artifact set (${missingClosureArtifacts} missing link(s)).`);
	if (input.approximateDurations > 0) gaps.push(`Duration accuracy is not always exact (${input.approximateDurations} log(s)).`);
	if (input.missingSkillCatalog) gaps.push("The injected Available skills catalog was missing or unresolved.");
	if (gaps.length === 0) return "- No automated logging gaps were inferred from the available counters.";
	return gaps.map((gap) => `- ${gap}`).join("\n");
}
function formatMetricSource$1(scan, key) {
	const source = scan.stageLogs.metrics.sources?.[key] ?? {
		quality: "none",
		reason: "Metric source quality is unavailable in this legacy scan summary."
	};
	return `${source.quality} — ${source.reason}`;
}
function buildLoggingReviewMarkdown(scan) {
	const missingReviewArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.review_artifact).length;
	const missingStepArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.step_artifact).length;
	const missingVerificationArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.verification_artifact).length;
	const approximateDurations = scan.stageLogs.files.filter((entry) => entry.metadata.log_quality && typeof entry.metadata.log_quality === "object" && entry.metadata.log_quality.duration_exact === false).length;
	return `# Logging review draft

${statusLine$2(scan)}

## Summary

- Logs analyzed: ${scan.stageLogs.count}
- Process misses recorded: ${scan.stageLogs.metrics.processMissesTotal}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Missing review artifacts: ${missingReviewArtifacts}
- Missing verification artifacts: ${missingVerificationArtifacts}
- Missing step artifacts: ${missingStepArtifacts}
- Logs with approximate duration only: ${approximateDurations}
- Process-miss source quality: ${formatMetricSource$1(scan, "process_misses")}
- Skill-reference source quality: ${formatMetricSource$1(scan, "skills_referenced")}
- Candidate-incident source quality: ${formatMetricSource$1(scan, "candidate_incidents")}

## Observed strengths

- Structured metadata blocks enable automated extraction.
- Review rounds and findings are frequently recorded.
- Backlog actualization state is explicitly modeled.

## Observed gaps

${formatObservedGaps({
		missingReviewArtifacts,
		missingVerificationArtifacts,
		missingStepArtifacts,
		approximateDurations,
		missingSkillCatalog: !scan.dataQuality.skillCatalogPresent
	})}

## Suggested improvements

1. Add machine-readable trace anchors to each stage log:
   - first relevant event id
   - review request event ids
   - final pass event id
   - commit event id

2. Add structured skill-usage fields:
   - skills_used
   - skill_issues
   - skill_followups

3. Add a compact tool summary:
   - tools_called_total
   - distinct_tools_used
   - notable_failures
   - retries_total

4. Add time breakdown fields:
   - active_work_minutes
   - waiting_for_review_minutes
   - reround_minutes
   - closure_minutes

5. Add explicit incident ids and categories in the log itself.

## Validation ideas

- Fail closure when a required stage log lacks mandatory artifact links.
- Warn when review findings exist but no follow-up or reround is logged.
- Warn when backlog truth changed but actualization evidence is missing.
- Warn when the log records a process miss but no remediation note exists.
`;
}
//#endregion
//#region src/cli/errors.ts
var CliError = class extends Error {
	exitCode;
	constructor(message, exitCode) {
		super(message);
		this.name = "CliError";
		this.exitCode = exitCode;
	}
};
function createUsageError(message) {
	return new CliError(message, 1);
}
function normalizeCliError(error) {
	if (error instanceof CliError) return error;
	if (error instanceof Error) return new CliError(error.message, 2);
	return new CliError(String(error), 2);
}
//#endregion
//#region src/commands/shared.ts
var COMMON_OPTION_SPECS = [
	{
		name: "session",
		type: "string",
		valueLabel: "<file>",
		description: "Rollout or session JSONL file."
	},
	{
		name: "logs-dir",
		type: "string",
		valueLabel: "<dir>",
		description: "Directory containing stage logs."
	},
	{
		name: "artifacts-dir",
		type: "string",
		valueLabel: "<dir>",
		description: "Project root or evidence root."
	},
	{
		name: "skills-dir",
		type: "string",
		valueLabel: "<dir>",
		description: "Optional directory containing skill folders for referenced-skill enrichment."
	},
	{
		name: "out-root",
		type: "string",
		valueLabel: "<dir>",
		description: "Root directory where the CLI chooses the canonical retrospective run directory."
	},
	{
		name: "run-dir",
		type: "string",
		valueLabel: "<dir>",
		description: "Exact canonical retrospective run directory to reuse."
	},
	{
		name: "language",
		type: "string",
		valueLabel: "<language>",
		description: "Operator language tag or name for report metadata and final analysis content."
	},
	{
		name: "draft",
		type: "boolean",
		description: "Write an explicitly temporary draft bundle under out/retro-drafts."
	}
];
function parseOptions(argv, specs) {
	const specByName = /* @__PURE__ */ new Map();
	for (const spec of specs) {
		specByName.set(`--${spec.name}`, spec);
		for (const alias of spec.aliases ?? []) specByName.set(alias, spec);
	}
	const parsed = {};
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token) continue;
		const spec = specByName.get(token);
		if (!spec) {
			if (token.startsWith("-")) throw createUsageError(`Unknown option: ${token}`);
			throw createUsageError(`Unexpected positional argument: ${token}`);
		}
		if (spec.type === "boolean") {
			parsed[spec.name] = true;
			continue;
		}
		const value = argv[index + 1];
		if (!value || value.startsWith("-")) throw createUsageError(`Missing value for --${spec.name}`);
		if (spec.repeatable) {
			const existing = parsed[spec.name];
			parsed[spec.name] = Array.isArray(existing) ? [...existing, value] : [value];
		} else parsed[spec.name] = value;
		index += 1;
	}
	for (const spec of specs) if (spec.required && parsed[spec.name] === void 0) throw createUsageError(`Missing required option --${spec.name}`);
	return parsed;
}
function optionToHelpLine(spec) {
	return `${[...spec.aliases ?? [], `--${spec.name}`].map((flag) => spec.type === "string" ? `${flag} ${spec.valueLabel ?? "<value>"}` : flag).join(", ").padEnd(28)}${spec.description}`;
}
function toCommonCommandInput(options) {
	const input = {};
	const session = toOptionalString(options.session);
	const logsDir = toOptionalString(options["logs-dir"]);
	const artifactsDir = toOptionalString(options["artifacts-dir"]);
	const skillsDir = toOptionalString(options["skills-dir"]);
	const outRoot = toOptionalString(options["out-root"]);
	const runDir = toOptionalString(options["run-dir"]);
	const language = toOptionalLanguage(options.language);
	const draft = toBoolean(options.draft);
	if (runDir && outRoot) throw createUsageError("Use either --run-dir or --out-root, not both");
	if (draft && (runDir || outRoot)) throw createUsageError("Use --draft only without --run-dir or --out-root");
	if (session) input.session = session;
	if (logsDir) input.logsDir = logsDir;
	if (artifactsDir) input.artifactsDir = artifactsDir;
	if (skillsDir) input.skillsDir = skillsDir;
	if (outRoot) input.outRoot = outRoot;
	if (runDir) input.runDir = runDir;
	if (language) input.language = language;
	if (draft) input.draft = draft;
	return input;
}
function toRequiredString(value, message) {
	if (typeof value === "string" && value.length > 0) return value;
	throw createUsageError(message);
}
function toOptionalString(value) {
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
function toStringList(value) {
	if (typeof value === "string" && value.length > 0) return [value];
	if (Array.isArray(value)) return value.filter((item) => item.length > 0);
	return [];
}
function toOptionalLanguage(value) {
	const language = toOptionalString(value)?.trim();
	return language && language.length > 0 ? language : void 0;
}
function toBoolean(value) {
	return value === true;
}
function writeJson(filePath, data, pretty = false) {
	safeMkdirForFile(filePath);
	fs.writeFileSync(filePath, JSON.stringify(data, null, pretty ? 2 : 0), "utf8");
}
function writeText(filePath, data) {
	safeMkdirForFile(filePath);
	fs.writeFileSync(filePath, data, "utf8");
}
function resolveCommandOutputPath(summary, input, commandName) {
	const explicitOut = input.out;
	if (typeof explicitOut === "string" && explicitOut.length > 0) return explicitOut;
	const layoutOptions = { commandName };
	if (input.outRoot) layoutOptions.outRoot = input.outRoot;
	if (input.runDir) layoutOptions.runDir = input.runDir;
	if (input.draft) layoutOptions.draft = input.draft;
	return resolveRetroOutputLayout(summary, layoutOptions).filePath;
}
function assertOutputOverrideIsExclusive(input) {
	if (input.out && (input.runDir || input.outRoot || input.draft)) throw createUsageError("Use --out only as a low-level single-file override; do not combine it with --run-dir, --out-root, or --draft");
}
function loadScanSummaryFromRunDir(runDir) {
	const scanSummaryPath = path.join(path.resolve(runDir), "scan-summary.json");
	if (!fs.existsSync(scanSummaryPath)) throw createUsageError(`--run-dir requires an existing scan-summary.json: ${scanSummaryPath}`);
	return JSON.parse(fs.readFileSync(scanSummaryPath, "utf8"));
}
//#endregion
//#region src/commands/logging-review.ts
var LOGGING_REVIEW_COMMAND = {
	name: "logging-review",
	summary: "Generate a logging-quality and improvement draft.",
	usage: [
		"node scripts/retro-cli.mjs logging-review --session <file>",
		"node scripts/retro-cli.mjs logging-review --run-dir <dir>",
		"node scripts/retro-cli.mjs logging-review --logs-dir <dir> --out-root <dir>",
		"node scripts/retro-cli.mjs logging-review --logs-dir <dir> --out <file>"
	],
	options: [...COMMON_OPTION_SPECS, {
		name: "out",
		type: "string",
		valueLabel: "<file>",
		description: "Output Markdown path override."
	}],
	notes: ["Logging review drafts focus on observability quality and follow-up automation ideas.", "Without --out, the command writes logging-review.md into the durable run directory selected for this retrospective scope."],
	parseArgs(argv) {
		const options = parseOptions(argv, this.options);
		const input = { ...toCommonCommandInput(options) };
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		assertOutputOverrideIsExclusive(input);
		return input;
	},
	run(input) {
		const scan = input.runDir ? loadScanSummaryFromRunDir(input.runDir) : buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "logging-review"), buildLoggingReviewMarkdown(redactScanSummaryForPublicArtifact(scan)));
	}
};
//#endregion
//#region src/render/report-markdown.ts
function statusLine$1(scan) {
	return scan.reportStatus.status === "draft_requires_agent_validation" ? "Status: draft, requires agent validation" : "Status: ready for agent finalization";
}
function statusReasons(scan) {
	return scan.reportStatus.reasons.length > 0 ? formatList(scan.reportStatus.reasons) : "- Evidence quality passed automated scaffold checks.";
}
function formatSkillManifest(scan) {
	return scan.skills.referenced.map((skill) => {
		const source = skill.skillFile ?? "skill file not resolved";
		return `- ${skill.name}: ${source}`;
	}).join("\n") || "- none";
}
function formatMetricSource(scan, key) {
	const source = scan.stageLogs.metrics.sources?.[key] ?? {
		quality: "none",
		reason: "Metric source quality is unavailable in this legacy scan summary."
	};
	return `${source.quality} — ${source.reason}`;
}
function buildReportMarkdown(scan, options) {
	const title = options.title ?? `Retrospective${options.phase ? `: ${options.phase}` : ""}`;
	const topTools = topEntries(scan.session.tools, 10).map(([name, count]) => `${name} (${count})`);
	const incidentSections = scan.candidateIncidents.map((incident, index) => [
		`### R-${String(index + 1).padStart(2, "0")} — ${incident.title}`,
		`- Severity: ${incident.severity}`,
		`- Stage: ${incident.stage}`,
		`- Evidence: ${incident.evidence}`,
		`- Observation: ${incident.reason}`,
		""
	].join("\n")).join("\n");
	const logFiles = scan.stageLogs.files.map((entry) => `- ${entry.filePath}`).join("\n") || "- none";
	const skillFiles = formatSkillManifest(scan);
	const scopePaths = scan.scope.touched_paths.map((entry) => `- ${entry}`).join("\n") || "- none";
	const scopeArtifacts = scan.scope.referenced_artifacts.map((entry) => `- ${entry}`).join("\n") || "- none";
	const scopeAmbiguities = scan.scope.scope_ambiguities.map((entry) => `- ${entry}`).join("\n") || "- none";
	return `# ${title}

${statusLine$1(scan)}

## Executive summary

- Phase: ${options.phase ?? "unspecified"}
- Session trace: ${scan.resolved.session ?? "not provided"}
- Session id: ${scan.session.sessionId ?? "not provided"}
- Stage logs analyzed: ${scan.stageLogs.count}
- Candidate incidents: ${scan.candidateIncidents.length}
- Distinct tools observed: ${Object.keys(scan.session.tools).length}
- Scope confidence: ${scan.scope.scope_confidence}
- Report scaffold status: ${scan.reportStatus.status}
- Data-quality note: ${scan.dataQuality.sessionPresent && scan.dataQuality.logsPresent ? "Both session trace and stage logs were available." : "One or more core evidence sources were missing; confidence is reduced."}

## Evidence manifest

### Stage logs
${logFiles}

### Skills
${skillFiles}

### Session trace
- ${scan.resolved.session ?? "not provided"}

### Trace-derived scope
- Project root: ${scan.scope.project_root ?? "unknown"}
- Backlog items: ${scan.scope.mentioned_backlog_items.join(", ") || "none"}
- Features: ${scan.scope.mentioned_features.join(", ") || "none"}

### Touched paths
${scopePaths}

### Referenced artifacts
${scopeArtifacts}

## Timeline summary

- Start: ${scan.session.firstTimestamp ?? "unknown"}
- End: ${scan.session.lastTimestamp ?? "unknown"}
- Duration (minutes): ${scan.session.durationMinutes ?? "unknown"}
- Aborted or restarted turns: ${scan.session.abortedTurns}
- Long gaps detected: ${scan.session.longGaps}

## Top observed tools

${formatList(topTools)}

## Candidate incidents

${incidentSections || "No candidate incidents were inferred automatically."}

## Stage-log metrics

- Review rounds total: ${scan.stageLogs.metrics.reviewRoundsTotal}
- Review findings total: ${scan.stageLogs.metrics.reviewFindingsTotal}
- Process misses total: ${scan.stageLogs.metrics.processMissesTotal}
- Backlog actualized cycles: ${scan.stageLogs.metrics.backlogActualizedCount}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Process-miss source quality: ${formatMetricSource(scan, "process_misses")}
- Skill-reference source quality: ${formatMetricSource(scan, "skills_referenced")}
- Candidate-incident source quality: ${formatMetricSource(scan, "candidate_incidents")}

## Preliminary stage analysis

${formatList(topEntries(scan.stageLogs.metrics.stages, 20).map(([stage, count]) => `${stage}: ${count} log(s)`))}

## Preliminary skill analysis

${formatList(topEntries(scan.stageLogs.metrics.skillsReferenced, 20).map(([skill, count]) => `${skill}: referenced in ${count} log(s)`))}

## Scope ambiguities

${scopeAmbiguities}

## Report status reasons

${statusReasons(scan)}

## Recommended next manual checks

- Confirm each inferred incident against the actual stage log and trace excerpts.
- Stop scope expansion when the ambiguities above remain unresolved after checking linked artifacts.
- Review rerounds and non-pass reviews for avoidable causes.
- Inspect skills referenced in the logs for missing decision rules, outdated assumptions, and ambiguity.
- Validate whether late or missing backlog actualization affected closure quality.
- Separate necessary complexity from avoidable friction before finalizing recommendations.

## Data-quality limits

- Session parse errors: ${scan.dataQuality.sessionParseErrors}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}
- Skill catalog available: ${scan.dataQuality.skillCatalogPresent}
- This draft is heuristic and should be refined by reading the cited artifacts.
`;
}
//#endregion
//#region src/commands/report.ts
var REPORT_COMMAND = {
	name: "report",
	summary: "Generate a Markdown retrospective draft.",
	usage: [
		"node scripts/retro-cli.mjs report --session <file> --phase <name>",
		"node scripts/retro-cli.mjs report --session <file> --out-root <dir>",
		"node scripts/retro-cli.mjs report --run-dir <dir>",
		"node scripts/retro-cli.mjs report --phase <name> --title <text> --out <file>"
	],
	options: [
		...COMMON_OPTION_SPECS,
		{
			name: "phase",
			type: "string",
			valueLabel: "<name>",
			description: "Optional phase label for the report."
		},
		{
			name: "title",
			type: "string",
			valueLabel: "<text>",
			description: "Title override."
		},
		{
			name: "out",
			type: "string",
			valueLabel: "<file>",
			description: "Output Markdown path override."
		}
	],
	notes: ["The generated report is a draft; read the cited artifacts before finalizing conclusions.", "Without --out, the command writes retrospective-report.md into the durable run directory selected for this retrospective scope."],
	parseArgs(argv) {
		const options = parseOptions(argv, this.options);
		const input = { ...toCommonCommandInput(options) };
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		const phase = toOptionalString(options.phase);
		const title = toOptionalString(options.title);
		if (phase) input.phase = phase;
		if (title) input.title = title;
		assertOutputOverrideIsExclusive(input);
		return input;
	},
	run(input) {
		const scan = input.runDir ? loadScanSummaryFromRunDir(input.runDir) : buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "report"), buildReportMarkdown(redactScanSummaryForPublicArtifact(scan), input));
	}
};
//#endregion
//#region src/commands/scan.ts
function parsePositiveInteger(value, optionName) {
	if (value === void 0) return;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) throw createUsageError(`${optionName} must be a positive integer`);
	return parsed;
}
function parseIsoTimestamp(value) {
	if (value === void 0) return;
	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) throw createUsageError("--until-ts must be a valid ISO-like timestamp");
	return value;
}
function toScanUsageError(error) {
	if (error instanceof Error) {
		if ([
			"--until-line",
			"--until-ts",
			"Use either --until-line or --until-ts",
			"Ambiguous same-session phase boundary",
			"Manual artifact overrides require"
		].some((message) => error.message.startsWith(message))) throw createUsageError(error.message);
	}
	throw error;
}
var SCAN_COMMAND = {
	name: "scan",
	summary: "Build a JSON summary from a session trace and stage logs.",
	usage: [
		"node scripts/retro-cli.mjs scan --session <file>",
		"node scripts/retro-cli.mjs scan --session <file> --out-root <dir> --pretty",
		"node scripts/retro-cli.mjs scan --session <file> --run-dir <dir> --language ru",
		"node scripts/retro-cli.mjs scan --session <file> --until-ts <iso>",
		"node scripts/retro-cli.mjs scan --session <file> --out <file> --pretty"
	],
	options: [
		...COMMON_OPTION_SPECS,
		{
			name: "out",
			type: "string",
			valueLabel: "<file>",
			description: "Output JSON path override."
		},
		{
			name: "pretty",
			type: "boolean",
			description: "Pretty-print JSON output."
		},
		{
			name: "until-line",
			type: "string",
			valueLabel: "<n>",
			description: "Analyze only session events at or before this JSONL line."
		},
		{
			name: "until-ts",
			type: "string",
			valueLabel: "<iso>",
			description: "Analyze only session events at or before this timestamp."
		},
		{
			name: "stage-log",
			type: "string",
			repeatable: true,
			valueLabel: "<path>",
			description: "Manually include a stage log; requires --artifact-evidence."
		},
		{
			name: "review-artifact",
			type: "string",
			repeatable: true,
			valueLabel: "<path>",
			description: "Manually include a review artifact; requires --artifact-evidence."
		},
		{
			name: "verification-artifact",
			type: "string",
			repeatable: true,
			valueLabel: "<path>",
			description: "Manually include a verification artifact; requires --artifact-evidence."
		},
		{
			name: "artifact-evidence",
			type: "string",
			valueLabel: "<text>",
			description: "Required justification for manual artifact inclusion."
		}
	],
	notes: [
		"The agent must resolve the target session and pass the canonical trace file via --session.",
		"The JSON summary is heuristic and should be validated against the cited artifacts.",
		"Use --until-line or --until-ts only when the analyzed phase is a prefix of the trace.",
		"Manual artifact paths are controlled overrides and must include --artifact-evidence.",
		"If logs or artifacts directories are omitted, the command tries standard project directories derived from session_meta.cwd.",
		"Without --out, the command writes to a durable run directory under .dossier/retro when a dossier-managed project root is available."
	],
	parseArgs(argv) {
		const options = parseOptions(argv, this.options);
		const input = {
			...toCommonCommandInput(options),
			session: toRequiredString(options.session, "scan requires --session"),
			pretty: toBoolean(options.pretty)
		};
		const untilLine = parsePositiveInteger(toOptionalString(options["until-line"]), "--until-line");
		const untilTs = parseIsoTimestamp(toOptionalString(options["until-ts"]));
		if (untilLine !== void 0 && untilTs !== void 0) throw createUsageError("Use either --until-line or --until-ts, not both");
		if (untilLine !== void 0) input.untilLine = untilLine;
		if (untilTs !== void 0) input.untilTs = untilTs;
		const stageLogs = toStringList(options["stage-log"]);
		const reviewArtifacts = toStringList(options["review-artifact"]);
		const verificationArtifacts = toStringList(options["verification-artifact"]);
		const artifactEvidence = toOptionalString(options["artifact-evidence"]);
		if (stageLogs.length > 0) input.stageLogs = stageLogs;
		if (reviewArtifacts.length > 0) input.reviewArtifacts = reviewArtifacts;
		if (verificationArtifacts.length > 0) input.verificationArtifacts = verificationArtifacts;
		if (artifactEvidence) input.artifactEvidence = artifactEvidence;
		if ((stageLogs.length > 0 || reviewArtifacts.length > 0 || verificationArtifacts.length > 0) && !artifactEvidence) throw createUsageError("Manual artifact overrides require --artifact-evidence with a short justification");
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		assertOutputOverrideIsExclusive(input);
		return input;
	},
	run(input) {
		let summary;
		try {
			summary = buildScanSummary(input);
		} catch (error) {
			toScanUsageError(error);
		}
		const outputPath = resolveCommandOutputPath(summary, input, "scan");
		writeJson(outputPath, redactScanSummaryForPublicArtifact(summary), input.pretty);
		return JSON.stringify({
			run_dir: summary.run_dir,
			scan_summary: outputPath,
			report_language: summary.report_language
		});
	}
};
//#endregion
//#region src/render/skill-audit-markdown.ts
function statusLine(scan) {
	return scan.reportStatus.status === "draft_requires_agent_validation" ? "Status: draft, requires agent validation" : "Status: ready for agent finalization";
}
function formatEvidence(evidence) {
	if (evidence.length === 0) return "- none";
	return evidence.map((entry) => {
		return `- ${entry.line > 0 ? `line ${entry.line}` : entry.event_type}, ${entry.field}, matched \`${entry.matched_alias}\`: ${entry.excerpt}`;
	}).join("\n");
}
function skillFileLine(skill) {
	if (skill.skillFile) return skill.skillFile;
	return "not resolved; local skill body was not inspected";
}
function formatSkillSections(skills) {
	if (skills.length === 0) return "The operational trace did not reference any skills from the injected `Available skills` catalog.";
	return skills.map((skill) => {
		return `### Skill: ${skill.name}

- Display name: ${skill.display_name}
- Skill file: ${skillFileLine(skill)}
- Description: ${skill.description || "n/a"}
- Evidence count: ${skill.evidence.length}

#### Evidence
${formatEvidence(skill.evidence)}

#### Manual review prompts
- Were mandatory review steps explicit?
- Were entry/exit criteria explicit?
- Were ambiguous exceptions handled?
- Did the skill force extra interpretation from scattered references?
`;
	}).join("\n");
}
function buildSkillAuditMarkdown(scan) {
	return `# Skill audit draft

${statusLine(scan)}

## Summary

- Available skills in injected catalog: ${scan.skills.available.length}
- Referenced skills in operational trace: ${scan.skills.referenced.length}
- Unreferenced catalog skills: ${scan.skills.unreferenced_count}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}
- Skill catalog available: ${scan.dataQuality.skillCatalogPresent}

## Findings by skill

${formatSkillSections(scan.skills.referenced)}

## Cross-skill patterns to investigate

- Ambiguous review policy or review order
- Missing decision tables for exceptions and edge cases
- Missing examples for reround handling
- Missing or weak logging expectations
- Outdated assumptions about tools, verification, or closure

## Next manual checks

- Read each referenced skill file when the local body is available.
- Correlate rerounds and process misses with the relevant skill steps.
- Separate operator-specific constraints from actual skill defects.
`;
}
//#endregion
//#region src/commands/skill-audit.ts
var SKILL_AUDIT_COMMAND = {
	name: "skill-audit",
	summary: "Generate a skill-focused Markdown draft.",
	usage: [
		"node scripts/retro-cli.mjs skill-audit --session <file>",
		"node scripts/retro-cli.mjs skill-audit --run-dir <dir>",
		"node scripts/retro-cli.mjs skill-audit --session <file> --skills-dir <dir> --out-root <dir>",
		"node scripts/retro-cli.mjs skill-audit --logs-dir <dir> --out <file>"
	],
	options: [...COMMON_OPTION_SPECS, {
		name: "out",
		type: "string",
		valueLabel: "<file>",
		description: "Output Markdown path override."
	}],
	notes: [
		"Use this draft as a triage aid before editing skill instructions or process policy.",
		"--skills-dir enriches referenced skills only; it does not discover the audit scope.",
		"Without --out, the command writes skill-audit.md into the durable run directory selected for this retrospective scope."
	],
	parseArgs(argv) {
		const options = parseOptions(argv, this.options);
		const input = { ...toCommonCommandInput(options) };
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		assertOutputOverrideIsExclusive(input);
		return input;
	},
	run(input) {
		const scan = input.runDir ? loadScanSummaryFromRunDir(input.runDir) : buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "skill-audit"), buildSkillAuditMarkdown(redactScanSummaryForPublicArtifact(scan)));
	}
};
//#endregion
//#region src/cli/command-registry.ts
var CLI_DISPLAY_NAME = "node scripts/retro-cli.mjs";
var COMMANDS = [
	SCAN_COMMAND,
	REPORT_COMMAND,
	SKILL_AUDIT_COMMAND,
	LOGGING_REVIEW_COMMAND
];
var COMMAND_MAP = new Map(COMMANDS.map((command) => [command.name, command]));
function findCommand(name) {
	return COMMAND_MAP.get(name);
}
function buildGlobalHelpOutput(version) {
	return `retrospective-phase-analysis CLI (v${version})

Usage:
  ${CLI_DISPLAY_NAME} <command> [options]
  ${CLI_DISPLAY_NAME} help [command]
  ${CLI_DISPLAY_NAME} --help
  ${CLI_DISPLAY_NAME} --version

Commands:
${COMMANDS.map((command) => `  ${command.name.padEnd(15)}${command.summary}`).join("\n")}

Notes:
  Generated reports are drafts; validate them against the cited artifacts.
  scan prints the canonical run_dir on stdout; other commands write output files and stay quiet unless help or version is requested.
`;
}
function buildCommandHelpOutput(command) {
	const optionLines = ["  -h, --help".padEnd(30) + "Show command help.", ...command.options.map((option) => `  ${optionToHelpLine(option)}`)].join("\n");
	const noteLines = command.notes?.map((note) => `  - ${note}`).join("\n") ?? "  - none";
	return `${command.name} - ${command.summary}

Usage:
${command.usage.map((line) => `  ${line}`).join("\n")}

Options:
${optionLines}

Notes:
${noteLines}
`;
}
function buildVersionOutput(version) {
	return version;
}
//#endregion
//#region src/cli/parse-argv.ts
function usageHint() {
	return "Run `node scripts/retro-cli.mjs --help` to inspect the available command surface.";
}
function assertNoExtraGlobalArgs(argv, intent) {
	if (argv.length === 1) return;
	throw createUsageError(`Unexpected extra arguments after ${intent === "version" ? "--version" : "--help"}: ${argv.slice(1).join(" ")}`);
}
function parseCliIntent(argv) {
	const [first, ...rest] = argv;
	if (!first) return { kind: "global_help" };
	if (first === "--help" || first === "-h") {
		assertNoExtraGlobalArgs(argv, "global_help");
		return { kind: "global_help" };
	}
	if (first === "--version") {
		assertNoExtraGlobalArgs(argv, "version");
		return { kind: "version" };
	}
	if (first === "help") {
		if (rest.length === 0) return { kind: "global_help" };
		if (rest.length === 1) {
			const [commandName] = rest;
			if (!commandName) throw createUsageError("help requires a command name");
			return {
				kind: "command_help",
				commandName
			};
		}
		throw createUsageError(`Unexpected extra arguments after help: ${rest.slice(1).join(" ")}`);
	}
	if (first.startsWith("-")) throw createUsageError(`Unknown global option: ${first}. ${usageHint()}`);
	return {
		kind: "command_run",
		commandName: first,
		args: rest
	};
}
//#endregion
//#region src/cli/run-cli.ts
function commandHelpRequested(args) {
	return args.includes("--help") || args.includes("-h");
}
function writeLine(stream, text) {
	stream.write(text.endsWith("\n") ? text : `${text}\n`);
}
async function runCli(argv, cliIo, version, dependencies = {}) {
	try {
		const intent = parseCliIntent(argv);
		const findCommandImpl = dependencies.findCommand ?? findCommand;
		if (intent.kind === "global_help") {
			writeLine(cliIo.stdout, buildGlobalHelpOutput(version));
			return 0;
		}
		if (intent.kind === "version") {
			writeLine(cliIo.stdout, buildVersionOutput(version));
			return 0;
		}
		const command = findCommandImpl(intent.commandName);
		if (!command) throw createUsageError(`Unknown command: ${intent.commandName}`);
		if (intent.kind === "command_help") {
			writeLine(cliIo.stdout, buildCommandHelpOutput(command));
			return 0;
		}
		if (commandHelpRequested(intent.args)) {
			writeLine(cliIo.stdout, buildCommandHelpOutput(command));
			return 0;
		}
		const input = command.parseArgs(intent.args);
		const output = await command.run(input);
		if (typeof output === "string" && output.length > 0) writeLine(cliIo.stdout, output);
		return 0;
	} catch (error) {
		const normalized = normalizeCliError(error);
		writeLine(cliIo.stderr, normalized.message);
		return normalized.exitCode;
	}
}
//#endregion
//#region src/cli.ts
var io = {
	stdout: process.stdout,
	stderr: process.stderr
};
var exitCode = await runCli(process.argv.slice(2), io, package_default.version);
process.exitCode = exitCode;
//#endregion
export { runCli };

//# sourceMappingURL=retro-cli.mjs.map