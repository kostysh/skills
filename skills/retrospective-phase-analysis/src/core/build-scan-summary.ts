import { extractSkillTraceSummary } from './extract-skill-scope.ts';
import { extractTraceScope } from './extract-trace-scope.ts';
import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { resolveStandardEvidenceDir } from './resolve-evidence-roots.ts';
import { inferProjectRootFromLogsDir, resolveRetroOutputLayout } from './shared.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import type { ArtifactCandidate, ScanSourceOptions, ScanSummary } from './types.ts';

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
  if (
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
  return {
    status: reasons.length > 0 ? 'draft_requires_agent_validation' : 'ready_for_agent_finalization',
    reasons,
  };
}

export function buildScanSummary(args: ScanSourceOptions): ScanSummary {
  assertManualOverridesHaveEvidence(args);

  const operatorLanguage = args.language ?? 'und';
  const reportLanguage = args.language ?? 'en';
  const sessionBoundaryOptions: { untilLine?: number; untilTs?: string } = {};
  if (args.untilLine !== undefined) {
    sessionBoundaryOptions.untilLine = args.untilLine;
  }
  if (args.untilTs !== undefined) {
    sessionBoundaryOptions.untilTs = args.untilTs;
  }
  const sessionSummary = summarizeSession(args.session, sessionBoundaryOptions);
  const resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
  const resolvedLogsDir =
    args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, '.dossier/logs');
  const resolvedArtifactsDir =
    args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? undefined;
  const scopeOptions: Parameters<typeof extractTraceScope>[0] = {
    sessionSummary,
    projectRoot: resolvedProjectRoot,
  };
  if (args.stageLogs) {
    scopeOptions.manualStageLogs = args.stageLogs;
  }
  if (args.reviewArtifacts) {
    scopeOptions.manualReviewArtifacts = args.reviewArtifacts;
  }
  if (args.verificationArtifacts) {
    scopeOptions.manualVerificationArtifacts = args.verificationArtifacts;
  }
  if (args.artifactEvidence) {
    scopeOptions.artifactEvidence = args.artifactEvidence;
  }
  const scope = extractTraceScope(scopeOptions);
  const logSummary = summarizeLogs(resolvedLogsDir, scope.candidate_stage_logs);
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
