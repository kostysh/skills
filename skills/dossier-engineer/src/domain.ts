export const SCHEMA_VERSION = "2.2";
export const DOSSIER_DIR = "docs/dossier";

export const ARTIFACT_DIRS = [
	"sources",
	"capabilities",
	"baselines",
	"guardrails",
	"work-items",
	"source-reviews",
	"stages",
	"verification",
	"reviews",
	"hygiene",
	"changesets",
	"reports",
	"retro",
] as const;

export const FORBIDDEN_CANONICAL_PATTERNS = [
	".dossier/state.json",
	"docs/dossier/state.json",
	"docs/dossier/index.json",
] as const;

export const SOURCE_KINDS = [
	"concept",
	"architecture",
	"specification",
	"policy",
	"contract",
	"decision-record",
	"test-plan",
	"external-reference",
	"code-reference",
	"other",
] as const;

export const AUTHORITIES = [
	"canonical",
	"supporting",
	"informational",
	"deprecated",
] as const;
export const CAPABILITY_STATUSES = [
	"intended",
	"existing",
	"partial",
	"unverified",
	"retired",
] as const;
export const BASELINE_MODES = [
	"existing-project",
	"release-snapshot",
	"regression-baseline",
	"manual",
] as const;
export const BASELINE_STATUSES = [
	"observed",
	"assumed",
	"unverified",
	"partial",
	"regressed",
] as const;
export const GUARDRAIL_STATUSES = [
	"active",
	"triggered",
	"resolved",
	"retired",
] as const;
export const WORK_TYPES = [
	"feature",
	"fix",
	"refactor",
	"migration",
	"research",
	"test",
	"documentation",
	"operations",
	"security",
	"debt",
] as const;
export const DELIVERY_KINDS = [
	"capability",
	"support",
	"maintenance",
	"exploration",
] as const;
export const RELATIONS = [
	"introduces",
	"extends",
	"supports",
	"maintains",
	"verifies",
	"retires",
] as const;
export const ACCEPTANCE_KINDS = [
	"behavior",
	"contract",
	"unit",
	"integration",
	"security",
	"performance",
	"accessibility",
	"operational",
	"documentation",
	"support",
] as const;
export const STAGES = [
	"feature-intake",
	"spec-compact",
	"plan-slice",
	"implementation",
	"change-proposal",
] as const;
export const STAGE_STATES = [
	"not_started",
	"in_progress",
	"blocked",
	"ready_for_close",
	"closed",
	"reopened",
] as const;
export const REVIEW_CLASSES = [
	"concept-conformance-reviewer",
	"spec-conformance-reviewer",
	"code-reviewer",
	"security-reviewer",
	"release-reviewer",
	"contract-reviewer",
] as const;
export const VERDICTS = ["pass", "fail", "blocked", "not_applicable"] as const;
export const SOURCE_REVIEW_VERDICTS = [
	"no_backlog_change",
	"update_capabilities",
	"update_existing_items",
	"create_followups",
	"retire_items",
	"blocked_pending_decision",
] as const;

export type ArtifactType =
	| "dossier_project"
	| "source"
	| "capability"
	| "baseline"
	| "guardrail"
	| "work_item"
	| "source_review"
	| "stage_event"
	| "verification"
	| "review"
	| "hygiene"
	| "changeset"
	| "retrospective_report"
	| "report";

export type Stage = (typeof STAGES)[number];

export interface Artifact {
	readonly path: string;
	readonly frontmatter: Record<string, unknown>;
	readonly body: string;
}

export interface CommandArtifact {
	readonly path: string;
	readonly artifact_type?: string;
	readonly id?: string;
}

export interface NextAction {
	readonly command: string;
	readonly reason: string;
}

export interface CommandResult {
	readonly result: "success" | "blocked" | "failed";
	readonly command: string;
	readonly summary?: string[];
	readonly findings?: string[];
	readonly created_artifacts: CommandArtifact[];
	readonly changed_artifacts: CommandArtifact[];
	readonly warnings: string[];
	readonly blockers: string[];
	readonly next_actions: NextAction[];
	readonly exitCode?: number;
}

export interface RuntimeContext {
	readonly cwd: string;
	readonly now: () => Date;
	readonly randomHex: (bytes: number) => string;
}

export const isOneOf = <T extends readonly string[]>(
	value: unknown,
	values: T,
): value is T[number] => typeof value === "string" && values.includes(value);

export const isoNow = (date: Date): string =>
	date.toISOString().replace(/\.\d{3}Z$/, "Z");
