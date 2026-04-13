import { extractTraceScope } from './extract-trace-scope.ts';
import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { resolveSessionTrace, resolveStandardEvidenceDir } from './resolve-scan-inputs.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import { summarizeSkills } from './summarize-skills.ts';
import type { ScanSourceOptions, ScanSummary } from './types.ts';

export function buildScanSummary(args: ScanSourceOptions): ScanSummary {
  const resolvedSession = resolveSessionTrace(args.session, args.sessionId);
  const sessionSummary = summarizeSession(resolvedSession.session);
  const resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
  const resolvedLogsDir =
    args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, '.dossier/logs');
  const resolvedArtifactsDir = args.artifactsDir ?? resolvedProjectRoot ?? undefined;
  const skillsSummary = summarizeSkills(args.skillsDir);
  const logSummary = summarizeLogs(resolvedLogsDir);
  const scope = extractTraceScope({
    sessionSummary,
    projectRoot: resolvedProjectRoot,
    logsSummary: logSummary,
  });

  const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);

  return {
    generatedAt: new Date().toISOString(),
    inputs: {
      session: args.session ?? null,
      sessionId: args.sessionId ?? null,
      logsDir: args.logsDir ?? null,
      artifactsDir: args.artifactsDir ?? null,
      skillsDir: args.skillsDir ?? null,
    },
    resolved: {
      session: resolvedSession.session ?? null,
      sessionId: resolvedSession.sessionId,
      logsDir: resolvedLogsDir ?? null,
      artifactsDir: resolvedArtifactsDir ?? null,
      skillsDir: args.skillsDir ?? null,
      discoveryMode: resolvedSession.discoveryMode,
    },
    dataQuality: {
      sessionPresent: sessionSummary.exists,
      logsPresent: logSummary.exists,
      skillCatalogPresent: skillsSummary.exists,
      sessionParseErrors: sessionSummary.parseErrors.length,
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
    skills: skillsSummary.skills,
    artifacts: {
      scannedCount: scope.referenced_artifacts.length,
      sample: scope.referenced_artifacts.slice(0, 50),
    },
    candidateIncidents,
  };
}
