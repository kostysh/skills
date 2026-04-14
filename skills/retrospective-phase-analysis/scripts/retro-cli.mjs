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
function listFilesRecursive(targetDir) {
	const out = [];
	function walk(current) {
		const entries = fs.readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const nextPath = path.join(current, entry.name);
			if (entry.isDirectory()) walk(nextPath);
			else out.push(nextPath);
		}
	}
	walk(targetDir);
	return out;
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
function resolveRetroRoot(summary, explicitRoot) {
	if (explicitRoot) return {
		mode: "root-override",
		root: path.resolve(explicitRoot)
	};
	const projectRoot = summary.session.projectRoot ?? inferProjectRootFromLogsDir(summary.resolved.logsDir);
	if (projectRoot && fs.existsSync(path.join(projectRoot, ".dossier"))) return {
		mode: "dossier-default",
		root: path.join(projectRoot, ".dossier", "retro")
	};
	if (projectRoot) return {
		mode: "fallback-default",
		root: path.join(projectRoot, "out", "retro")
	};
	return {
		mode: "fallback-default",
		root: path.resolve("out", "retro")
	};
}
function resolveScopeSlug(summary) {
	if (summary.scope.mentioned_backlog_items.length === 1) return slugifyOutputPart(summary.scope.mentioned_backlog_items[0] ?? "session-unknown");
	if (summary.scope.mentioned_features.length === 1) return slugifyOutputPart(summary.scope.mentioned_features[0] ?? "session-unknown");
	const sessionSlug = shortSessionId(summary.session.sessionId);
	return sessionSlug ? `session-${sessionSlug}` : "session-unknown";
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
	const rootInfo = resolveRetroRoot(summary, options.outRoot);
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
//#region src/core/extract-trace-scope.ts
var SKIPPED_KEYS = new Set([
	"base_instructions",
	"developer_instructions",
	"user_instructions",
	"formatted_output"
]);
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
function collectEventTexts(input, pathTrail = []) {
	if (input === null || input === void 0) return [];
	if (typeof input === "string") return [input];
	if (Array.isArray(input)) return input.flatMap((item) => collectEventTexts(item, pathTrail));
	if (typeof input !== "object") return [];
	const record = input;
	const eventType = typeof record.type === "string" ? record.type : null;
	if (eventType === "session_meta") {
		const payload = record.payload && typeof record.payload === "object" ? record.payload : null;
		const out = [];
		if (typeof payload?.id === "string") out.push(payload.id);
		if (typeof payload?.cwd === "string") out.push(payload.cwd);
		return out;
	}
	if (eventType === "turn_context") return [];
	const out = [];
	for (const [key, value] of Object.entries(record)) {
		if (SKIPPED_KEYS.has(key)) continue;
		out.push(...collectEventTexts(value, [...pathTrail, key]));
	}
	return out;
}
function extractMatches(values, pattern) {
	const matches = [];
	for (const value of values) for (const match of value.matchAll(pattern)) {
		const candidate = match[1] ?? match[0];
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
	return sortUnique(rawCandidates.map((value) => normalizePathCandidate(value, projectRoot)).filter((value) => value !== null).filter((value) => isProjectScopedPath(value, projectRoot)));
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
function isToolCallEvent(record) {
	const eventType = extractEventType(record);
	return typeof record.command === "string" || typeof record.patch === "string" || typeof record.diff === "string" || typeof eventType === "string" && /tool_call/u.test(eventType);
}
function isToolResultEvent(record) {
	const eventType = extractEventType(record);
	return typeof eventType === "string" && /tool_result/u.test(eventType);
}
function eventRequestsStageLogWrite(record, stageLogPaths, projectRoot) {
	if ((extractEventToolName(record)?.toLowerCase() ?? "").includes("apply_patch")) {
		const patchTargets = sortUnique([
			record.patch,
			record.diff,
			record.command
		].filter((value) => typeof value === "string").join("\n").split(/\r?\n/u).flatMap((line) => {
			const match = line.match(/^\*\*\* (?:Update File|Add File|Move to): (.+)$/u);
			if (!match?.[1]) return [];
			const normalized = normalizePathCandidate(match[1], projectRoot);
			if (!normalized || !isProjectScopedPath(normalized, projectRoot)) return [];
			return [normalized];
		}));
		return stageLogPaths.some((filePath) => patchTargets.includes(filePath));
	}
	const commandBlob = [record.command, record.body].filter((value) => typeof value === "string").join("\n");
	return stageLogPaths.some((filePath) => {
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
	});
}
function isSuccessfulToolResult(record) {
	if (record.aborted === true) return false;
	if (typeof record.exit_code === "number" && record.exit_code !== 0) return false;
	if (typeof record.status === "string" && !/^(ok|success|passed|pass)$/iu.test(record.status)) return false;
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
function extractChangedStageLogPaths(events, projectRoot) {
	const out = [];
	for (const [index, event] of events.entries()) {
		if (!event || typeof event !== "object") continue;
		const record = event;
		if (!isToolCallEvent(record)) continue;
		const eventStageLogPaths = extractTouchedPaths(collectEventTexts(event), projectRoot).filter((filePath) => isStageLogArtifact(filePath, projectRoot));
		if (eventStageLogPaths.length === 0) continue;
		if (!eventRequestsStageLogWrite(record, eventStageLogPaths, projectRoot)) continue;
		if (!hasConfirmedToolResult(events, index, extractEventToolName(record)?.toLowerCase() ?? null)) continue;
		out.push(...eventStageLogPaths);
	}
	return sortUnique(out);
}
function collectFeatureScopedCandidates(baseDir, featureIds) {
	if (!baseDir || featureIds.length === 0 || !fs.existsSync(baseDir)) return [];
	return sortUnique(listFilesRecursive(baseDir).filter((filePath) => featureIds.some((featureId) => filePath.includes(featureId))));
}
function scoreScopeConfidence(sessionPresent, backlogItems, featureIds, touchedPaths, referencedArtifacts, ambiguities) {
	if (!sessionPresent) return "low";
	if (backlogItems.length + featureIds.length + touchedPaths.length + referencedArtifacts.length === 0) return "low";
	return ambiguities.length > 0 ? "medium" : "high";
}
function extractTraceScope({ sessionSummary, projectRoot }) {
	const texts = sessionSummary.events.flatMap((event) => collectEventTexts(event));
	const mentionedBacklogItems = extractMatches(texts, /\b(CF-[A-Za-z0-9._-]+)\b/gu);
	const mentionedFeatures = extractMatches(texts, /\b(F-\d{4,})\b/gu);
	const touchedPaths = extractTouchedPaths(texts, projectRoot);
	const touchedStageLogs = extractChangedStageLogPaths(sessionSummary.events, projectRoot);
	const referencedArtifacts = sortUnique(touchedPaths.filter((filePath) => isReferencedArtifact(filePath, projectRoot)));
	const candidateReviewArtifacts = sortUnique([...referencedArtifacts.filter((filePath) => filePath.includes(`${path.sep}.dossier${path.sep}reviews${path.sep}`)), ...collectFeatureScopedCandidates(projectRoot ? path.join(projectRoot, ".dossier", "reviews") : void 0, mentionedFeatures)]);
	const candidateVerificationArtifacts = sortUnique([...referencedArtifacts.filter((filePath) => filePath.includes(`${path.sep}.dossier${path.sep}verification${path.sep}`)), ...collectFeatureScopedCandidates(projectRoot ? path.join(projectRoot, ".dossier", "verification") : void 0, mentionedFeatures)]);
	const candidateStageLogs = touchedStageLogs;
	const scopeAmbiguities = [];
	if (mentionedBacklogItems.length === 0 && mentionedFeatures.length === 0 && touchedPaths.length === 0 && referencedArtifacts.length === 0) scopeAmbiguities.push("No trace-derived backlog items, feature ids, or touched project paths were found.");
	if (mentionedBacklogItems.length > 1) scopeAmbiguities.push(`Multiple backlog items were mentioned in one trace: ${mentionedBacklogItems.join(", ")}.`);
	if (mentionedFeatures.length > 1) scopeAmbiguities.push(`Multiple feature ids were mentioned in one trace: ${mentionedFeatures.join(", ")}.`);
	if (candidateStageLogs.length === 0) scopeAmbiguities.push("The session trace did not confirm any stage-log path created or changed in this session.");
	if (mentionedFeatures.length > 0 && candidateReviewArtifacts.length === 0) scopeAmbiguities.push(`No review artifacts were auto-linked for feature ids ${mentionedFeatures.join(", ")}.`);
	if (mentionedFeatures.length > 0 && candidateVerificationArtifacts.length === 0) scopeAmbiguities.push(`No verification artifacts were auto-linked for feature ids ${mentionedFeatures.join(", ")}.`);
	return {
		project_root: projectRoot,
		mentioned_backlog_items: mentionedBacklogItems,
		mentioned_features: mentionedFeatures,
		touched_paths: touchedPaths,
		referenced_artifacts: referencedArtifacts,
		candidate_stage_logs: candidateStageLogs,
		candidate_review_artifacts: candidateReviewArtifacts,
		candidate_verification_artifacts: candidateVerificationArtifacts,
		scope_confidence: scoreScopeConfidence(sessionSummary.exists, mentionedBacklogItems, mentionedFeatures, touchedPaths, referencedArtifacts, scopeAmbiguities),
		scope_ambiguities: scopeAmbiguities
	};
}
//#endregion
//#region src/core/infer-candidate-incidents.ts
function inferCandidateIncidents(sessionSummary, logSummary) {
	const incidents = [];
	for (const log of logSummary.logs) {
		const metadata = log.metadata;
		const stage = stringFromUnknown(metadata.stage, "unknown");
		const processMissTotal = Number(metadata.process_misses_total ?? 0);
		const reviewFindingTotal = Number(metadata.review_findings_total ?? 0);
		if (processMissTotal > 0 || log.processMissLines.length > 0) incidents.push({
			title: `Process misses in ${path.basename(log.filePath)}`,
			severity: Number(metadata.process_misses_total ?? log.processMissLines.length) >= 2 ? "high" : "medium",
			stage,
			evidence: log.filePath,
			reason: log.processMissLines.join("; ") || "Structured log indicates process misses."
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
		if (reviewText.includes("fail") || reviewText.includes("non-compliant")) incidents.push({
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
function isWithinLogsDir(filePath, logsDir) {
	const normalizedDir = path.resolve(logsDir);
	const normalizedFile = path.resolve(filePath);
	return normalizedFile === normalizedDir || normalizedFile.startsWith(`${normalizedDir}${path.sep}`) || normalizedFile.startsWith(`${normalizedDir}/`);
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
		lateLogStartCount: 0
	};
}
function summarizeParsedLogs(logs) {
	const metrics = createEmptyMetrics();
	metrics.logsTotal = logs.length;
	for (const log of logs) {
		const metadata = log.metadata;
		const stage = stringFromUnknown(metadata.stage, "unknown");
		const skill = stringFromUnknown(metadata.skill, "unknown");
		const reviewRounds = Number(metadata.review_rounds ?? metadata.review_rounds_total ?? log.reviewEvents.length ?? 0);
		const reviewFindings = Number(metadata.review_findings_total ?? 0);
		const processMisses = Number(metadata.process_misses_total ?? log.processMissLines.length ?? 0);
		metrics.reviewRoundsTotal += Number.isFinite(reviewRounds) ? reviewRounds : 0;
		metrics.reviewFindingsTotal += Number.isFinite(reviewFindings) ? reviewFindings : 0;
		metrics.processMissesTotal += Number.isFinite(processMisses) ? processMisses : 0;
		metrics.backlogActualizedCount += metadata.backlog_actualized === true ? 1 : 0;
		if (metadata.late_start === true || metadata.late_log_start === true) metrics.lateLogStartCount += 1;
		metrics.stages[stage] = (metrics.stages[stage] ?? 0) + 1;
		metrics.skillsReferenced[skill] = (metrics.skillsReferenced[skill] ?? 0) + 1;
	}
	return {
		exists: true,
		logs,
		metrics
	};
}
function summarizeLogs(logsDir, allowedFilePaths) {
	if (!logsDir || !fs.existsSync(logsDir)) return {
		exists: false,
		logs: [],
		metrics: createEmptyMetrics()
	};
	return summarizeParsedLogs((allowedFilePaths === void 0 ? [] : Array.from(new Set(allowedFilePaths.filter((filePath) => filePath.endsWith(".md") && fs.existsSync(filePath) && isWithinLogsDir(filePath, logsDir))))).map((filePath) => parseStageLog(filePath)));
}
//#endregion
//#region src/parsers/jsonl.ts
function parseJsonl(filePath) {
	const lines = readText(filePath).split(/\r?\n/).filter((line) => line.trim().length > 0);
	const events = [];
	const errors = [];
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line) continue;
		try {
			events.push(JSON.parse(line));
		} catch (error) {
			errors.push({
				line: index + 1,
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}
	return {
		events,
		errors
	};
}
//#endregion
//#region src/core/summarize-session.ts
function summarizeSession(filePath) {
	if (!filePath || !fs.existsSync(filePath)) return {
		filePath,
		sessionId: null,
		projectRoot: null,
		exists: false,
		eventCount: 0,
		parseErrors: [],
		firstTimestamp: null,
		lastTimestamp: null,
		durationMinutes: null,
		abortedTurns: 0,
		longGaps: 0,
		tools: {},
		sampleEventTypes: [],
		events: []
	};
	const { events, errors } = parseJsonl(filePath);
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
		eventCount: events.length,
		parseErrors: errors,
		firstTimestamp,
		lastTimestamp,
		durationMinutes: firstTimestamp && lastTimestamp ? diffMinutes(firstTimestamp, lastTimestamp) : null,
		abortedTurns,
		longGaps,
		tools: Object.fromEntries(Array.from(toolCounts.entries()).sort((left, right) => right[1] - left[1])),
		sampleEventTypes: Array.from(new Set(events.map((event) => extractEventType$1(event)))).slice(0, 25),
		events
	};
}
//#endregion
//#region src/core/summarize-skills.ts
function summarizeSkills(skillsDir) {
	if (!skillsDir || !fs.existsSync(skillsDir)) return {
		exists: false,
		skills: []
	};
	return {
		exists: true,
		skills: listFilesRecursive(skillsDir).filter((filePath) => path.basename(filePath) === "SKILL.md").map((skillFile) => {
			const frontmatterMatch = readText(skillFile).match(/^---\n([\s\S]*?)\n---/u);
			const frontmatter = frontmatterMatch ? parseLooseYaml(frontmatterMatch[1] ?? "") : {};
			return {
				skillFile,
				name: typeof frontmatter.name === "string" ? frontmatter.name : path.basename(path.dirname(skillFile)),
				description: typeof frontmatter.description === "string" ? frontmatter.description : ""
			};
		})
	};
}
//#endregion
//#region src/core/build-scan-summary.ts
function buildScanSummary(args) {
	const sessionSummary = summarizeSession(args.session);
	const resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
	const resolvedLogsDir = args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, ".dossier/logs");
	const resolvedArtifactsDir = args.artifactsDir ?? resolvedProjectRoot ?? void 0;
	const skillsSummary = summarizeSkills(args.skillsDir);
	const scope = extractTraceScope({
		sessionSummary,
		projectRoot: resolvedProjectRoot
	});
	const logSummary = summarizeLogs(resolvedLogsDir, scope.candidate_stage_logs);
	const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);
	const summaryBase = {
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		inputs: {
			session: args.session ?? null,
			logsDir: args.logsDir ?? null,
			artifactsDir: args.artifactsDir ?? null,
			skillsDir: args.skillsDir ?? null,
			outRoot: args.outRoot ?? null
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
			skillCatalogPresent: skillsSummary.exists,
			sessionParseErrors: sessionSummary.parseErrors.length
		},
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
		skills: skillsSummary.skills,
		artifacts: {
			scannedCount: scope.referenced_artifacts.length,
			sample: scope.referenced_artifacts.slice(0, 50)
		},
		candidateIncidents
	};
	const outputOptions = { commandName: "scan" };
	if (args.outRoot) outputOptions.outRoot = args.outRoot;
	return {
		...summaryBase,
		recommendedOutput: resolveRetroOutputLayout(summaryBase, outputOptions)
	};
}
//#endregion
//#region src/render/logging-review-markdown.ts
function buildLoggingReviewMarkdown(scan) {
	const missingReviewArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.review_artifact).length;
	const missingStepArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.step_artifact).length;
	const missingVerificationArtifacts = scan.stageLogs.files.filter((entry) => !entry.metadata.verification_artifact).length;
	const approximateDurations = scan.stageLogs.files.filter((entry) => entry.metadata.log_quality && typeof entry.metadata.log_quality === "object" && entry.metadata.log_quality.duration_exact === false).length;
	return `# Logging review draft

## Summary

- Logs analyzed: ${scan.stageLogs.count}
- Process misses recorded: ${scan.stageLogs.metrics.processMissesTotal}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Missing review artifacts: ${missingReviewArtifacts}
- Missing verification artifacts: ${missingVerificationArtifacts}
- Missing step artifacts: ${missingStepArtifacts}
- Logs with approximate duration only: ${approximateDurations}

## Observed strengths

- Structured metadata blocks enable automated extraction.
- Review rounds and findings are frequently recorded.
- Backlog actualization state is explicitly modeled.

## Observed gaps

- Not all logs include the full closure artifact set.
- Duration accuracy is not always exact.
- Skill usage is not consistently captured in a machine-readable way.
- Session-trace anchors are not recorded directly in stage logs.
- Tool-level summaries are typically absent.

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
		description: "Directory containing skill folders."
	},
	{
		name: "out-root",
		type: "string",
		valueLabel: "<dir>",
		description: "Root directory for durable retrospective outputs."
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
		parsed[spec.name] = value;
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
	if (session) input.session = session;
	if (logsDir) input.logsDir = logsDir;
	if (artifactsDir) input.artifactsDir = artifactsDir;
	if (skillsDir) input.skillsDir = skillsDir;
	if (outRoot) input.outRoot = outRoot;
	return input;
}
function toRequiredString(value, message) {
	if (typeof value === "string" && value.length > 0) return value;
	throw createUsageError(message);
}
function toOptionalString(value) {
	return typeof value === "string" && value.length > 0 ? value : void 0;
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
	return resolveRetroOutputLayout(summary, layoutOptions).filePath;
}
//#endregion
//#region src/commands/logging-review.ts
var LOGGING_REVIEW_COMMAND = {
	name: "logging-review",
	summary: "Generate a logging-quality and improvement draft.",
	usage: [
		"node scripts/retro-cli.mjs logging-review --session <file>",
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
		return input;
	},
	run(input) {
		const scan = buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "logging-review"), buildLoggingReviewMarkdown(scan));
	}
};
//#endregion
//#region src/render/report-markdown.ts
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
	const skillFiles = scan.skills.map((skill) => `- ${skill.name}: ${skill.skillFile}`).join("\n") || "- none";
	const scopePaths = scan.scope.touched_paths.map((entry) => `- ${entry}`).join("\n") || "- none";
	const scopeArtifacts = scan.scope.referenced_artifacts.map((entry) => `- ${entry}`).join("\n") || "- none";
	const scopeAmbiguities = scan.scope.scope_ambiguities.map((entry) => `- ${entry}`).join("\n") || "- none";
	return `# ${title}

## Executive summary

- Phase: ${options.phase ?? "unspecified"}
- Session trace: ${scan.resolved.session ?? "not provided"}
- Session id: ${scan.session.sessionId ?? "not provided"}
- Stage logs analyzed: ${scan.stageLogs.count}
- Candidate incidents: ${scan.candidateIncidents.length}
- Distinct tools observed: ${Object.keys(scan.session.tools).length}
- Scope confidence: ${scan.scope.scope_confidence}
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

## Preliminary stage analysis

${formatList(topEntries(scan.stageLogs.metrics.stages, 20).map(([stage, count]) => `${stage}: ${count} log(s)`))}

## Preliminary skill analysis

${formatList(topEntries(scan.stageLogs.metrics.skillsReferenced, 20).map(([skill, count]) => `${skill}: referenced in ${count} log(s)`))}

## Scope ambiguities

${scopeAmbiguities}

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
		return input;
	},
	run(input) {
		const scan = buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "report"), buildReportMarkdown(scan, input));
	}
};
//#endregion
//#region src/commands/scan.ts
var SCAN_COMMAND = {
	name: "scan",
	summary: "Build a JSON summary from a session trace and stage logs.",
	usage: [
		"node scripts/retro-cli.mjs scan --session <file>",
		"node scripts/retro-cli.mjs scan --session <file> --out-root <dir> --pretty",
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
		}
	],
	notes: [
		"The agent must resolve the target session and pass the canonical trace file via --session.",
		"The JSON summary is heuristic and should be validated against the cited artifacts.",
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
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		return input;
	},
	run(input) {
		const summary = buildScanSummary(input);
		writeJson(resolveCommandOutputPath(summary, input, "scan"), summary, input.pretty);
	}
};
//#endregion
//#region src/render/skill-audit-markdown.ts
function buildSkillAuditMarkdown(scan) {
	const skills = scan.skills.length > 0 ? scan.skills : Object.keys(scan.stageLogs.metrics.skillsReferenced).map((name) => ({
		name,
		skillFile: "referenced via logs only",
		description: ""
	}));
	const rows = skills.map((skill) => {
		const references = scan.stageLogs.files.filter((entry) => stringFromUnknown(entry.metadata.skill, "") === skill.name).length;
		const confidence = references > 0 ? "confirmed_used" : scan.scope.touched_paths.includes(skill.skillFile) ? "probably_used" : "implicitly_relevant";
		const issueCount = scan.candidateIncidents.filter((incident) => incident.evidence.includes(".md")).length;
		return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Description: ${skill.description || "n/a"}
- Confidence: ${confidence}
- Direct log references: ${references}
- Potential friction signals: ${issueCount > 0 ? issueCount : "none automatically inferred"}
- Manual review prompts:
  - Were mandatory review steps explicit?
  - Were entry/exit criteria explicit?
  - Were ambiguous exceptions handled?
  - Did the skill force extra interpretation from scattered references?
`;
	}).join("\n");
	return `# Skill audit draft

## Summary

- Skills inspected: ${skills.length}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}

## Findings by skill

${rows}

## Cross-skill patterns to investigate

- Ambiguous review policy or review order
- Missing decision tables for exceptions and edge cases
- Missing examples for reround handling
- Missing or weak logging expectations
- Outdated assumptions about tools, verification, or closure

## Next manual checks

- Read each skill file that materially influenced the phase.
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
		"node scripts/retro-cli.mjs skill-audit --session <file> --skills-dir <dir>",
		"node scripts/retro-cli.mjs skill-audit --skills-dir <dir> --out-root <dir>",
		"node scripts/retro-cli.mjs skill-audit --logs-dir <dir> --skills-dir <dir> --out <file>"
	],
	options: [...COMMON_OPTION_SPECS, {
		name: "out",
		type: "string",
		valueLabel: "<file>",
		description: "Output Markdown path override."
	}],
	notes: ["Use this draft as a triage aid before editing skill instructions or process policy.", "Without --out, the command writes skill-audit.md into the durable run directory selected for this retrospective scope."],
	parseArgs(argv) {
		const options = parseOptions(argv, this.options);
		const input = { ...toCommonCommandInput(options) };
		const out = toOptionalString(options.out);
		if (out) input.out = out;
		return input;
	},
	run(input) {
		const scan = buildScanSummary(input);
		writeText(resolveCommandOutputPath(scan, input, "skill-audit"), buildSkillAuditMarkdown(scan));
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
  Commands write output files and stay quiet on stdout unless help or version is requested.
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
		await command.run(input);
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