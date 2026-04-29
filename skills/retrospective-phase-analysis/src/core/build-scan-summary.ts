import {
  deriveArtifactEvidenceEnhancement,
  hasUnvalidatedFallbackMetrics,
  type ArtifactEvidenceEnhancement,
} from './artifact-evidence.ts';
import { extractSkillTraceSummary } from './extract-skill-scope.ts';
import { extractTraceScope } from './extract-trace-scope.ts';
import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { isActionableReviewSignal } from './review-signals.ts';
import { resolveStandardEvidenceDir } from './resolve-evidence-roots.ts';
import {
  extractTimestamp,
  inferProjectRootFromLogsDir,
  resolveRetroOutputLayout,
  tryParseDate,
} from './shared.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import type {
  ArtifactCandidate,
  LogsSummary,
  ReviewSignal,
  ScanSourceOptions,
  ScanSummary,
  SessionSummary,
  TraceScopeSummary,
} from './types.ts';

const SCAN_SUMMARY_SCHEMA_VERSION = '1.1.0';

function hasManualOverrides(args: ScanSourceOptions): boolean {
  return (
    (args.stageLogs?.length ?? 0) > 0 ||
    (args.reviewArtifacts?.length ?? 0) > 0 ||
    (args.verificationArtifacts?.length ?? 0) > 0
  );
}

function assertManualOverridesHaveEvidence(args: ScanSourceOptions): void {
  if (hasManualOverrides(args) && !args.artifactEvidence?.trim()) {
    throw new Error(
      'Manual artifact overrides require artifactEvidence with a short justification',
    );
  }
}

function hasManualCandidates(candidates: readonly ArtifactCandidate[]): boolean {
  return candidates.some((candidate) => candidate.inclusion_source === 'manual_included');
}

function excludedStageLogCandidates(scope: TraceScopeSummary): ArtifactCandidate[] {
  return scope.stage_log_candidates.filter((candidate) => !candidate.included);
}

function formatStageLogCandidate(candidate: ArtifactCandidate): string {
  const eventRef = candidate.event_ref ? ` at ${candidate.event_ref}` : '';
  return `${candidate.path} (${candidate.evidence_kind}${eventRef})`;
}

function buildReportStatus(input: {
  sessionSummary: ReturnType<typeof summarizeSession>;
  logSummary: ReturnType<typeof summarizeLogs>;
  skillTraceSummary: ReturnType<typeof extractSkillTraceSummary>;
  scope: ReturnType<typeof extractTraceScope>;
  reviewSignals: readonly ReviewSignal[];
}): ScanSummary['reportStatus'] {
  const reasons: string[] = [];
  const { sessionSummary, logSummary, skillTraceSummary, scope, reviewSignals } = input;

  if (!sessionSummary.exists) {
    reasons.push('Session trace is missing.');
  }
  if (sessionSummary.parseErrors.length > 0) {
    reasons.push(`Session trace has ${sessionSummary.parseErrors.length} parse error(s).`);
  }
  if (!logSummary.exists) {
    reasons.push('Stage-log directory is missing or unresolved.');
  }
  if (skillTraceSummary.available.length === 0) {
    reasons.push('Injected Available skills catalog is missing or unresolved.');
  }
  const excludedStageLogs = excludedStageLogCandidates(scope);
  if (logSummary.metrics.logsTotal === 0 && excludedStageLogs.length > 0) {
    reasons.push(
      `Excluded stage-log candidate(s) require validation before final report: ${excludedStageLogs
        .map(formatStageLogCandidate)
        .join(', ')}.`,
    );
  } else if (
    logSummary.metrics.logsTotal === 0 &&
    scope.referenced_artifacts.some((artifactPath) => artifactPath.includes('.dossier'))
  ) {
    reasons.push('Trace indicates dossier activity, but no stage logs were analyzed.');
  }
  if (scope.scope_ambiguities.length > 0) {
    reasons.push('Unresolved scope ambiguities remain.');
  }
  if (
    hasManualCandidates(scope.stage_log_candidates) ||
    hasManualCandidates(scope.review_artifact_candidates) ||
    hasManualCandidates(scope.verification_artifact_candidates)
  ) {
    reasons.push('Manual artifact overrides were used.');
  }
  if (hasUnvalidatedFallbackMetrics(logSummary.metrics.sources)) {
    reasons.push('Trace/prose-derived or incomplete metrics require agent validation.');
  }
  if (
    reviewSignals.some((signal) => isActionableReviewSignal(signal) && !signal.matching_artifact)
  ) {
    reasons.push(
      'Non-PASS review signals without matching immutable artifacts require validation.',
    );
  }
  return {
    status: reasons.length > 0 ? 'draft_requires_agent_validation' : 'ready_for_agent_finalization',
    reasons,
  };
}

function traceTextContainsNonPassReviewSignal(value: string): boolean {
  if (
    !/\b(?:FAIL|failed|non-compliant|noncompliant|changes[-_\s]requested|request[-_\s]changes)\b/iu.test(
      value,
    ) ||
    !/\b(?:review|reviewer|audit|auditor|spec-conformance|security|code-reviewer)\b/iu.test(value)
  ) {
    return false;
  }

  return [
    /\b(?:verdict|result|status|outcome)\s*[:=-]\s*(?:FAIL|failed|non-compliant|noncompliant|changes[-_\s]requested|request[-_\s]changes)\b/iu,
    /\b(?:review|reviewer|audit|auditor|spec-conformance-reviewer|security-reviewer|code-reviewer)\b.{0,180}\b(?:returned|reported|completed|found|blocked|requested|requested changes|verdict|result|status)\b.{0,120}\b(?:FAIL|failed|non-compliant|noncompliant|changes[-_\s]requested|request[-_\s]changes)\b/isu,
    /\b(?:FAIL|failed|non-compliant|noncompliant|changes[-_\s]requested|request[-_\s]changes)\b.{0,120}\b(?:review|reviewer|audit|auditor|spec-conformance-reviewer|security-reviewer|code-reviewer)\b.{0,120}\b(?:found|returned|reported|blocked|requested)\b/isu,
  ].some((pattern) => pattern.test(value));
}

const TRACE_REVIEW_TEXT_KEYS = new Set([
  'content',
  'message',
  'notes',
  'summary',
  'completed',
  'final',
  'output',
  'stdout',
  'stderr',
  'result',
  'status',
  'outcome',
  'verdict',
]);

const TRACE_REVIEW_BLOB_SKIP_PATTERN =
  /(^|\n)\s*(?:#{1,6}\s*)?(?:In scope:|Out of scope:|Proposed Resolution|Alternatives Considered|Destructive Side Effects|Verification|Independent Audit|Required corrections:|##\s+)/iu;

function eventRole(event: unknown): string {
  if (!event || typeof event !== 'object') {
    return '';
  }
  const record = event as Record<string, unknown>;
  return (
    [record.role, record.type, record.kind, record.event]
      .find((value): value is string => typeof value === 'string')
      ?.toLowerCase() ?? ''
  );
}

function isTraceReviewCandidateEvent(event: unknown): boolean {
  const role = eventRole(event);
  if (['user', 'system', 'developer', 'session_meta'].includes(role)) {
    return false;
  }
  return true;
}

function collectTraceReviewText(event: unknown, depth = 0, key?: string): string[] {
  if (depth > 5 || event === null || event === undefined) {
    return [];
  }
  if (typeof event === 'string') {
    const normalizedKey = String(key ?? '').toLowerCase();
    if (!TRACE_REVIEW_TEXT_KEYS.has(normalizedKey)) {
      return [];
    }
    const trimmed = event.trim();
    if (
      trimmed.length === 0 ||
      trimmed.length > 4000 ||
      TRACE_REVIEW_BLOB_SKIP_PATTERN.test(trimmed) ||
      trimmed.includes('<INSTRUCTIONS>') ||
      trimmed.includes('Available skills')
    ) {
      return [];
    }
    return [trimmed];
  }
  if (Array.isArray(event)) {
    return event.flatMap((entry) => collectTraceReviewText(entry, depth + 1, key));
  }
  if (typeof event === 'object') {
    return Object.entries(event).flatMap(([entryKey, value]) =>
      collectTraceReviewText(value, depth + 1, entryKey),
    );
  }
  return [];
}

function traceSignalExplicitFindingCount(value: string): number | null {
  const explicit = value.match(/\b(\d+)\s+(?:must[-_\s]?fix|blocking|finding|issue)s?\b/iu)?.[1];
  if (explicit) {
    return Number(explicit);
  }

  const blockingMarkers = value.match(/\[(?:blocking|must[-_\s]?fix)\]/giu)?.length ?? 0;
  if (blockingMarkers > 0) {
    return blockingMarkers;
  }

  if (/\bone\s+(?:must[-_\s]?fix|blocking|finding|issue)\b/iu.test(value)) {
    return 1;
  }

  return null;
}

function onlyUniqueMatch(value: string, pattern: RegExp): string | null {
  const matches = Array.from(value.matchAll(pattern))
    .map((match) => match[1])
    .filter((match): match is string => match !== undefined);
  const uniqueMatches = Array.from(new Set(matches));
  return uniqueMatches.length === 1 ? (uniqueMatches.at(0) ?? null) : null;
}

function hasAmbiguousMatches(value: string, pattern: RegExp): boolean {
  const uniqueMatches = Array.from(
    new Set(
      Array.from(value.matchAll(pattern))
        .map((match) => match[1])
        .filter((match): match is string => match !== undefined),
    ),
  );
  return uniqueMatches.length > 1;
}

function traceSignalScopeIdentity(value: string): Record<string, unknown> | null {
  const featurePattern = /\b(F-\d{4})\b/giu;
  const backlogPattern = /\b(CF-\d{3,4})\b/giu;
  const stagePattern =
    /\b(feature-intake|spec-compact|plan-slice|implementation|change-proposal|next-step)\b/giu;
  const featureId = onlyUniqueMatch(value, featurePattern);
  const backlogItemKey = onlyUniqueMatch(value, backlogPattern);
  const stage = onlyUniqueMatch(value, stagePattern);
  const ambiguous =
    hasAmbiguousMatches(value, featurePattern) ||
    hasAmbiguousMatches(value, backlogPattern) ||
    hasAmbiguousMatches(value, stagePattern);
  if (!featureId && !backlogItemKey && !stage && !ambiguous) {
    return null;
  }

  return {
    feature_id: featureId,
    backlog_item_key: backlogItemKey,
    stage,
    ambiguous,
  };
}

function extractTraceReviewSignals(sessionSummary: SessionSummary): ReviewSignal[] {
  if (!sessionSummary.filePath) {
    return [];
  }

  const out: ReviewSignal[] = [];
  for (const [index, event] of sessionSummary.events.entries()) {
    if (!isTraceReviewCandidateEvent(event)) {
      continue;
    }

    const raw = collectTraceReviewText(event).join('\n');
    if (!traceTextContainsNonPassReviewSignal(raw)) {
      continue;
    }

    out.push({
      source_quality: 'trace_derived',
      source: 'trace',
      classification: 'active_unmatched',
      verdict: 'non-pass',
      audit_class:
        raw.match(/\b(spec-conformance-reviewer|security-reviewer|code-reviewer)\b/iu)?.[1] ?? null,
      round: raw.match(/\b(?:r|round)[-_ ]?(\d+)\b/iu)?.[1] ?? null,
      commit: raw.match(/\b[0-9a-f]{7,40}\b/iu)?.[0] ?? null,
      artifact_path: null,
      matching_artifact: false,
      source_identity: traceSignalScopeIdentity(raw),
      timestamp: extractTimestamp(event),
      evidence: `${sessionSummary.filePath}#event:${sessionSummary.eventLines[index] ?? index + 1}`,
      must_fix_count: traceSignalExplicitFindingCount(raw),
      evidence_count: null,
    });
  }
  return out;
}

function reviewHistoryQuality(logSummary: LogsSummary, evidence: string): string | null {
  const log = logSummary.logs.find((entry) => entry.filePath === evidence);
  const quality = log?.metadata.rpa_source_quality;
  if (!quality || typeof quality !== 'object') {
    return null;
  }
  const reviewHistoryQualityValue = (quality as Record<string, unknown>).review_history_quality;
  return typeof reviewHistoryQualityValue === 'string' ? reviewHistoryQualityValue : null;
}

function normalizedScalar(value: string | number | null): string | null {
  return value === null ? null : String(value).toLowerCase();
}

function normalizedRound(value: string | number | null): string | null {
  const normalized = normalizedScalar(value);
  return normalized?.replace(/^r0*/u, '').replace(/^0+/u, '') ?? null;
}

function signalTimestamp(value: string | null): number | null {
  const date = tryParseDate(value);
  return date ? date.valueOf() : null;
}

function identityValue(identity: Record<string, unknown> | null, key: string): string | null {
  const value = identity?.[key];
  return typeof value === 'string' && value.length > 0 ? value.toLowerCase() : null;
}

function identityFlag(identity: Record<string, unknown> | null, key: string): boolean {
  return identity?.[key] === true;
}

function completeStructuredReviewSignals(logSummary: LogsSummary): ReviewSignal[] {
  return logSummary.reviewSignals.filter(
    (signal) =>
      signal.source !== 'trace' &&
      signal.source !== 'prose' &&
      signal.source_quality === 'structured' &&
      signal.matching_artifact &&
      reviewHistoryQuality(logSummary, signal.evidence) === 'complete',
  );
}

function traceMatchesCompleteReviewSignal(trace: ReviewSignal, complete: ReviewSignal): boolean {
  if (
    !trace.audit_class ||
    normalizedScalar(trace.audit_class) !== normalizedScalar(complete.audit_class)
  ) {
    return false;
  }
  if (!trace.round || normalizedRound(trace.round) !== normalizedRound(complete.round)) {
    return false;
  }
  if (!trace.commit || normalizedScalar(trace.commit) !== normalizedScalar(complete.commit)) {
    return false;
  }
  if (trace.must_fix_count === null || trace.must_fix_count !== complete.must_fix_count) {
    return false;
  }

  const traceFeatureId = identityValue(trace.source_identity, 'feature_id');
  const traceBacklogItemKey = identityValue(trace.source_identity, 'backlog_item_key');
  const traceStage = identityValue(trace.source_identity, 'stage');
  const completeFeatureId = identityValue(complete.source_identity, 'feature_id');
  const completeBacklogItemKey = identityValue(complete.source_identity, 'backlog_item_key');
  const completeStage = identityValue(complete.source_identity, 'stage');
  if (identityFlag(trace.source_identity, 'ambiguous')) {
    return false;
  }
  if (!traceStage || traceStage !== completeStage) {
    return false;
  }
  if (!traceFeatureId && !traceBacklogItemKey) {
    return false;
  }
  if (traceFeatureId && traceFeatureId !== completeFeatureId) {
    return false;
  }
  if (
    traceBacklogItemKey &&
    completeBacklogItemKey &&
    traceBacklogItemKey !== completeBacklogItemKey
  ) {
    return false;
  }
  const traceTs = signalTimestamp(trace.timestamp);
  const completeTs = signalTimestamp(complete.timestamp);
  return traceTs !== null && completeTs !== null && traceTs <= completeTs;
}

function classifyTraceReviewSignals(
  logSummary: LogsSummary,
  traceReviewSignals: readonly ReviewSignal[],
): ReviewSignal[] {
  const completeSignals = completeStructuredReviewSignals(logSummary);
  if (completeSignals.length === 0) {
    return [...traceReviewSignals];
  }

  return traceReviewSignals.map((trace) => {
    const matches = completeSignals.filter((complete) =>
      traceMatchesCompleteReviewSignal(trace, complete),
    );
    if (matches.length !== 1) {
      return trace;
    }

    const traceTs = signalTimestamp(trace.timestamp);
    const completeTs = signalTimestamp(matches[0]?.timestamp ?? null);
    return {
      ...trace,
      classification:
        traceTs !== null && completeTs !== null && traceTs < completeTs
          ? 'historical'
          : 'superseded',
    };
  });
}

function logSummaryWithTraceReviewSignals(
  logSummary: LogsSummary,
  traceReviewSignals: readonly ReviewSignal[],
): LogsSummary {
  if (traceReviewSignals.length === 0) {
    return logSummary;
  }

  const actionableTraceReviewSignals = traceReviewSignals.filter(isActionableReviewSignal);
  const reviewFindingsFromTrace = actionableTraceReviewSignals.reduce(
    (total, signal) => total + (signal.must_fix_count ?? 1),
    0,
  );
  const metrics =
    actionableTraceReviewSignals.length === 0
      ? logSummary.metrics
      : {
          ...logSummary.metrics,
          reviewFindingsTotal: logSummary.metrics.reviewFindingsTotal + reviewFindingsFromTrace,
          sources: {
            ...logSummary.metrics.sources,
            candidate_incidents: {
              quality: 'incomplete' as const,
              reason:
                'candidate_incidents include trace-derived non-PASS review signals without matching immutable review artifacts.',
            },
          },
        };

  return {
    ...logSummary,
    metrics,
    reviewSignals: [...logSummary.reviewSignals, ...traceReviewSignals],
  };
}

function allArtifactCandidates(scope: TraceScopeSummary): ArtifactCandidate[] {
  return [
    ...scope.stage_log_candidates,
    ...scope.review_artifact_candidates,
    ...scope.verification_artifact_candidates,
    ...scope.step_artifact_candidates,
  ];
}

function explicitBoundaryOptions(args: ScanSourceOptions): {
  untilLine?: number;
  untilTs?: string;
} {
  const out: { untilLine?: number; untilTs?: string } = {};
  if (args.untilLine !== undefined) {
    out.untilLine = args.untilLine;
  }
  if (args.untilTs !== undefined) {
    out.untilTs = args.untilTs;
  }
  return out;
}

function hasExplicitBoundary(args: ScanSourceOptions): boolean {
  return args.untilLine !== undefined || args.untilTs !== undefined;
}

function scopeOptions(input: {
  args: ScanSourceOptions;
  sessionSummary: SessionSummary;
  projectRoot: string | null;
  enhancement?: ArtifactEvidenceEnhancement;
}): Parameters<typeof extractTraceScope>[0] {
  const options: Parameters<typeof extractTraceScope>[0] = {
    sessionSummary: input.sessionSummary,
    projectRoot: input.projectRoot,
  };
  if (input.args.stageLogs) {
    options.manualStageLogs = input.args.stageLogs;
  }
  if (input.args.reviewArtifacts) {
    options.manualReviewArtifacts = input.args.reviewArtifacts;
  }
  if (input.args.verificationArtifacts) {
    options.manualVerificationArtifacts = input.args.verificationArtifacts;
  }
  if (input.args.artifactEvidence) {
    options.artifactEvidence = input.args.artifactEvidence;
  }
  if (input.enhancement) {
    options.artifactIdentity = input.enhancement.artifactIdentity;
    options.artifactIdentityAmbiguities = input.enhancement.artifactIdentityAmbiguities;
    options.artifactLinkedReviewCandidates = input.enhancement.artifactLinkedReviewCandidates;
    options.artifactLinkedVerificationCandidates =
      input.enhancement.artifactLinkedVerificationCandidates;
    options.artifactLinkedStepCandidates = input.enhancement.artifactLinkedStepCandidates;
  }
  return options;
}

function collectEvidence(input: {
  args: ScanSourceOptions;
  sessionSummary: SessionSummary;
  projectRoot: string | null;
  logsDir: string | undefined;
}): {
  scope: TraceScopeSummary;
  logSummary: LogsSummary;
  enhancement: ArtifactEvidenceEnhancement;
} {
  const initialScope = extractTraceScope(
    scopeOptions({
      args: input.args,
      sessionSummary: input.sessionSummary,
      projectRoot: input.projectRoot,
    }),
  );
  const initialLogSummary = summarizeLogs(
    input.logsDir,
    initialScope.candidate_stage_logs,
    input.projectRoot,
  );
  const enhancement = deriveArtifactEvidenceEnhancement({
    logs: initialLogSummary.logs,
    projectRoot: input.projectRoot,
  });
  const scope = extractTraceScope(
    scopeOptions({
      args: input.args,
      sessionSummary: input.sessionSummary,
      projectRoot: input.projectRoot,
      enhancement,
    }),
  );
  const logSummary = summarizeLogs(input.logsDir, scope.candidate_stage_logs, input.projectRoot);
  return {
    scope,
    logSummary,
    enhancement,
  };
}

function artifactBoundaryExcludesLaterEvents(
  sessionSummary: SessionSummary,
  artifactBoundaryTs: string | null,
): artifactBoundaryTs is string {
  const boundaryDate = tryParseDate(artifactBoundaryTs);
  const firstDate = tryParseDate(sessionSummary.firstTimestamp);
  const lastDate = tryParseDate(sessionSummary.lastTimestamp);
  if (!boundaryDate || !lastDate) {
    return false;
  }
  if (firstDate && boundaryDate.valueOf() < firstDate.valueOf()) {
    return false;
  }
  return boundaryDate.valueOf() < lastDate.valueOf();
}

function eventIndexFromRef(eventRef: string | null): number | null {
  const match = eventRef?.match(/^event:(\d+)$/u);
  if (!match?.[1]) {
    return null;
  }
  return Number(match[1]) - 1;
}

function hasRetrospectiveFollowupMarker(event: unknown): boolean {
  const text = JSON.stringify(event).toLowerCase();
  return (
    text.includes('.dossier/retro') ||
    text.includes('retrospective-report') ||
    text.includes('skill-audit') ||
    text.includes('logging-review') ||
    text.includes('retro-cli') ||
    text.includes('retrospective extraction') ||
    text.includes('ретроанализ') ||
    text.includes('ретроспектив')
  );
}

const LATER_BACKLOG_ITEM_PATTERN = /(^|[^A-Za-z0-9_-])(CF-\d{3,4})(?![A-Za-z0-9_-])/gu;
const LATER_FEATURE_ID_PATTERN = /(^|[^A-Za-z0-9_-])(F-\d{4})(?![A-Za-z0-9_-])/gu;

function extractCanonicalIdsFromEvent(event: unknown): {
  backlogItems: string[];
  features: string[];
} {
  const text = JSON.stringify(event);
  const backlogItems = Array.from(text.matchAll(LATER_BACKLOG_ITEM_PATTERN))
    .map((match) => match[2])
    .filter((value): value is string => value !== undefined);
  const features = Array.from(text.matchAll(LATER_FEATURE_ID_PATTERN))
    .map((match) => match[2])
    .filter((value): value is string => value !== undefined);

  return {
    backlogItems: Array.from(new Set(backlogItems)),
    features: Array.from(new Set(features)),
  };
}

function hasDifferentLaterWorkItem(input: { event: unknown; scope: TraceScopeSummary }): boolean {
  const ids = extractCanonicalIdsFromEvent(input.event);
  const allowedBacklogItems = new Set(
    input.scope.artifact_identity.primary_backlog_item_key
      ? [input.scope.artifact_identity.primary_backlog_item_key]
      : input.scope.mentioned_backlog_items,
  );
  const allowedFeatures = new Set(
    input.scope.artifact_identity.primary_feature_id
      ? [input.scope.artifact_identity.primary_feature_id]
      : input.scope.mentioned_features,
  );

  return (
    ids.backlogItems.some(
      (backlogItem) => allowedBacklogItems.size > 0 && !allowedBacklogItems.has(backlogItem),
    ) || ids.features.some((feature) => allowedFeatures.size > 0 && !allowedFeatures.has(feature))
  );
}

function hasAmbiguousSameSessionBoundary(input: {
  sessionSummary: SessionSummary;
  scope: TraceScopeSummary;
}): boolean {
  const candidateRefs = [
    ...input.scope.stage_log_candidates,
    ...input.scope.review_artifact_candidates,
    ...input.scope.verification_artifact_candidates,
    ...input.scope.step_artifact_candidates,
  ]
    .filter(
      (candidate) =>
        candidate.included &&
        candidate.inclusion_source === 'auto_included' &&
        candidate.event_ref !== null,
    )
    .map((candidate) => eventIndexFromRef(candidate.event_ref))
    .filter((index): index is number => index !== null);
  const lastStrongArtifactEventIndex = Math.max(...candidateRefs);
  if (!Number.isFinite(lastStrongArtifactEventIndex)) {
    return false;
  }

  return input.sessionSummary.events
    .slice(lastStrongArtifactEventIndex + 1)
    .some(
      (event) =>
        hasRetrospectiveFollowupMarker(event) ||
        hasDifferentLaterWorkItem({ event, scope: input.scope }),
    );
}

function hasTraceConfirmedStageScopeAmbiguity(scope: TraceScopeSummary): boolean {
  const autoIncludedStageLogCount = scope.stage_log_candidates.filter(
    (candidate) => candidate.included && candidate.inclusion_source === 'auto_included',
  ).length;
  if (autoIncludedStageLogCount < 2) {
    return false;
  }

  return scope.scope_ambiguities.some(
    (ambiguity) =>
      ambiguity.startsWith('Multiple artifact ') ||
      ambiguity.startsWith('Multiple backlog items') ||
      ambiguity.startsWith('Multiple feature ids'),
  );
}

export function buildScanSummary(args: ScanSourceOptions): ScanSummary {
  assertManualOverridesHaveEvidence(args);

  const operatorLanguage = args.language ?? 'und';
  const reportLanguage = args.language ?? 'en';
  let sessionSummary = summarizeSession(args.session, explicitBoundaryOptions(args));
  let resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
  let resolvedLogsDir =
    args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, '.dossier/logs');
  let resolvedArtifactsDir =
    args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? undefined;
  let { scope, logSummary, enhancement } = collectEvidence({
    args,
    sessionSummary,
    projectRoot: resolvedProjectRoot,
    logsDir: resolvedLogsDir,
  });

  if (
    !hasExplicitBoundary(args) &&
    artifactBoundaryExcludesLaterEvents(sessionSummary, enhancement.artifactBoundaryTs)
  ) {
    sessionSummary = summarizeSession(args.session, {
      artifactUntilTs: enhancement.artifactBoundaryTs,
    });
    resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
    resolvedLogsDir =
      args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, '.dossier/logs');
    resolvedArtifactsDir =
      args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? undefined;
    ({ scope, logSummary, enhancement } = collectEvidence({
      args,
      sessionSummary,
      projectRoot: resolvedProjectRoot,
      logsDir: resolvedLogsDir,
    }));
  } else if (
    !hasExplicitBoundary(args) &&
    (hasAmbiguousSameSessionBoundary({ sessionSummary, scope }) ||
      hasTraceConfirmedStageScopeAmbiguity(scope))
  ) {
    throw new Error(
      'Ambiguous same-session phase boundary: later same-session work appears after analyzed artifacts or trace-confirmed stage artifacts have conflicting scope; provide --until-line or --until-ts.',
    );
  }

  const skillScopeOptions: Parameters<typeof extractSkillTraceSummary>[0] = {
    sessionSummary,
    logMetrics: logSummary.metrics,
  };
  if (args.skillsDir) {
    skillScopeOptions.skillsDir = args.skillsDir;
  }
  const skillTraceSummary = extractSkillTraceSummary(skillScopeOptions);

  const traceReviewSignals = classifyTraceReviewSignals(
    logSummary,
    extractTraceReviewSignals(sessionSummary),
  );
  const evidenceLogSummary = logSummaryWithTraceReviewSignals(logSummary, traceReviewSignals);
  const reviewSignals = evidenceLogSummary.reviewSignals;
  const candidateIncidents = inferCandidateIncidents(
    sessionSummary,
    evidenceLogSummary,
    reviewSignals,
  );
  const reportStatus = buildReportStatus({
    sessionSummary,
    logSummary: evidenceLogSummary,
    skillTraceSummary,
    scope,
    reviewSignals,
  });
  const artifactCandidates = allArtifactCandidates(scope);

  const summaryBase: Omit<ScanSummary, 'recommendedOutput' | 'run_dir'> = {
    schema_version: SCAN_SUMMARY_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
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
      artifactEvidence: args.artifactEvidence ?? null,
    },
    resolved: {
      session: args.session ?? null,
      logsDir: resolvedLogsDir ?? null,
      artifactsDir: resolvedArtifactsDir ?? null,
      skillsDir: args.skillsDir ?? null,
    },
    dataQuality: {
      sessionPresent: sessionSummary.exists,
      logsPresent: evidenceLogSummary.exists,
      skillCatalogPresent: skillTraceSummary.available.length > 0,
      sessionParseErrors: sessionSummary.parseErrors.length,
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
      compactedEvents: sessionSummary.compactedEvents,
      tools: sessionSummary.tools,
      sampleEventTypes: sessionSummary.sampleEventTypes,
    },
    stageLogs: {
      count: evidenceLogSummary.metrics.logsTotal,
      metrics: evidenceLogSummary.metrics,
      files: evidenceLogSummary.logs.map((log) => ({
        filePath: log.filePath,
        metadata: log.metadata,
        reviewEvents: log.reviewEvents.length,
        processMissLines: log.processMissLines,
      })),
    },
    scope,
    reportStatus,
    validation: {
      agent_validated: false,
      validated_scope: null,
      manual_overrides: artifactCandidates.some(
        (candidate) => candidate.inclusion_source === 'manual_included',
      ),
      residual_confidence: null,
      validation_notes: null,
      validated_at: null,
      validated_by: null,
    },
    discovery: {
      provenance: artifactCandidates,
      manual_overrides: artifactCandidates.filter(
        (candidate) => candidate.inclusion_source === 'manual_included',
      ),
    },
    skills: skillTraceSummary,
    candidateIncidents,
    reviewSignals,
  };

  const outputOptions: { commandName: 'scan'; outRoot?: string; runDir?: string; draft?: boolean } =
    {
      commandName: 'scan',
    };
  if (args.outRoot) {
    outputOptions.outRoot = args.outRoot;
  }
  if (args.runDir) {
    outputOptions.runDir = args.runDir;
  }
  if (args.draft) {
    outputOptions.draft = args.draft;
  }

  const recommendedOutput = resolveRetroOutputLayout(summaryBase as ScanSummary, outputOptions);

  return {
    ...summaryBase,
    run_dir: recommendedOutput.runDir,
    recommendedOutput,
  };
}
