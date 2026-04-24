import {
  deriveArtifactEvidenceEnhancement,
  hasUnvalidatedFallbackMetrics,
  type ArtifactEvidenceEnhancement,
} from './artifact-evidence.ts';
import { extractSkillTraceSummary } from './extract-skill-scope.ts';
import { extractTraceScope } from './extract-trace-scope.ts';
import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { resolveStandardEvidenceDir } from './resolve-evidence-roots.ts';
import { inferProjectRootFromLogsDir, resolveRetroOutputLayout, tryParseDate } from './shared.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import type {
  ArtifactCandidate,
  LogsSummary,
  ScanSourceOptions,
  ScanSummary,
  SessionSummary,
  TraceScopeSummary,
} from './types.ts';

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
}): ScanSummary['reportStatus'] {
  const reasons: string[] = [];
  const { sessionSummary, logSummary, skillTraceSummary, scope } = input;

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
    reasons.push('Unvalidated fallback metrics require agent validation.');
  }
  return {
    status: reasons.length > 0 ? 'draft_requires_agent_validation' : 'ready_for_agent_finalization',
    reasons,
  };
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

  const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);
  const reportStatus = buildReportStatus({
    sessionSummary,
    logSummary,
    skillTraceSummary,
    scope,
  });

  const summaryBase: Omit<ScanSummary, 'recommendedOutput' | 'run_dir'> = {
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
      logsPresent: logSummary.exists,
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
      tools: sessionSummary.tools,
      sampleEventTypes: sessionSummary.sampleEventTypes,
    },
    stageLogs: {
      count: logSummary.metrics.logsTotal,
      metrics: logSummary.metrics,
      files: logSummary.logs.map((log) => ({
        filePath: log.filePath,
        metadata: log.metadata,
        reviewEvents: log.reviewEvents.length,
        processMissLines: log.processMissLines,
      })),
    },
    scope,
    reportStatus,
    skills: skillTraceSummary,
    candidateIncidents,
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
