import { extractTraceScope } from './extract-trace-scope.ts';
import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { resolveStandardEvidenceDir } from './resolve-evidence-roots.ts';
import { inferProjectRootFromLogsDir, resolveRetroOutputLayout } from './shared.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import { summarizeSkills } from './summarize-skills.ts';
import type { ScanSourceOptions, ScanSummary } from './types.ts';

export function buildScanSummary(args: ScanSourceOptions): ScanSummary {
  const sessionSummary = summarizeSession(args.session);
  const resolvedProjectRoot = args.artifactsDir ?? sessionSummary.projectRoot;
  const resolvedLogsDir =
    args.logsDir ?? resolveStandardEvidenceDir(resolvedProjectRoot, '.dossier/logs');
  const resolvedArtifactsDir =
    args.artifactsDir ?? inferProjectRootFromLogsDir(resolvedLogsDir ?? null) ?? undefined;
  const skillsSummary = summarizeSkills(args.skillsDir);
  const scope = extractTraceScope({
    sessionSummary,
    projectRoot: resolvedProjectRoot,
  });
  const logSummary = summarizeLogs(resolvedLogsDir, scope.candidate_stage_logs);

  const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);

  const summaryBase: Omit<ScanSummary, 'recommendedOutput'> = {
    generatedAt: new Date().toISOString(),
    inputs: {
      session: args.session ?? null,
      logsDir: args.logsDir ?? null,
      artifactsDir: args.artifactsDir ?? null,
      skillsDir: args.skillsDir ?? null,
      outRoot: args.outRoot ?? null,
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

  const outputOptions: { commandName: 'scan'; outRoot?: string } = {
    commandName: 'scan',
  };
  if (args.outRoot) {
    outputOptions.outRoot = args.outRoot;
  }

  return {
    ...summaryBase,
    recommendedOutput: resolveRetroOutputLayout(summaryBase as ScanSummary, outputOptions),
  };
}
