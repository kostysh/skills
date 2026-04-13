import fs from 'node:fs';

import { inferCandidateIncidents } from './infer-candidate-incidents.ts';
import { listFilesRecursive } from './shared.ts';
import { summarizeLogs } from './summarize-logs.ts';
import { summarizeSession } from './summarize-session.ts';
import { summarizeSkills } from './summarize-skills.ts';
import type { ScanSourceOptions, ScanSummary } from './types.ts';

export function buildScanSummary(args: ScanSourceOptions): ScanSummary {
  const sessionSummary = summarizeSession(args.session);
  const logSummary = summarizeLogs(args.logsDir);
  const skillsSummary = summarizeSkills(args.skillsDir);
  const artifactFiles =
    args.artifactsDir && fs.existsSync(args.artifactsDir)
      ? listFilesRecursive(args.artifactsDir).slice(0, 500)
      : [];

  const candidateIncidents = inferCandidateIncidents(sessionSummary, logSummary);

  return {
    generatedAt: new Date().toISOString(),
    inputs: {
      session: args.session ?? null,
      logsDir: args.logsDir ?? null,
      artifactsDir: args.artifactsDir ?? null,
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
    skills: skillsSummary.skills,
    artifacts: {
      scannedCount: artifactFiles.length,
      sample: artifactFiles.slice(0, 50),
    },
    candidateIncidents,
  };
}
