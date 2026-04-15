import fs from 'node:fs';

import { parseStageLog } from '../parsers/stage-log.ts';
import { stringFromUnknown } from './shared.ts';
import type { LogMetrics, LogsSummary, ParsedStageLog } from './types.ts';

function createEmptyMetrics(): LogMetrics {
  return {
    logsTotal: 0,
    reviewRoundsTotal: 0,
    reviewFindingsTotal: 0,
    processMissesTotal: 0,
    backlogActualizedCount: 0,
    stages: {},
    skillsReferenced: {},
    lateLogStartCount: 0,
  };
}

function summarizeParsedLogs(logs: ParsedStageLog[]): LogsSummary {
  const metrics = createEmptyMetrics();
  metrics.logsTotal = logs.length;

  for (const log of logs) {
    const metadata = log.metadata;
    const stage = stringFromUnknown(metadata.stage, 'unknown');
    const skill = stringFromUnknown(metadata.skill, 'unknown');
    const reviewRounds = Number(
      metadata.review_rounds ?? metadata.review_rounds_total ?? log.reviewEvents.length ?? 0,
    );
    const reviewFindings = Number(metadata.review_findings_total ?? 0);
    const processMisses = Number(metadata.process_misses_total ?? log.processMissLines.length ?? 0);

    metrics.reviewRoundsTotal += Number.isFinite(reviewRounds) ? reviewRounds : 0;
    metrics.reviewFindingsTotal += Number.isFinite(reviewFindings) ? reviewFindings : 0;
    metrics.processMissesTotal += Number.isFinite(processMisses) ? processMisses : 0;
    metrics.backlogActualizedCount += metadata.backlog_actualized === true ? 1 : 0;
    if (metadata.late_start === true || metadata.late_log_start === true) {
      metrics.lateLogStartCount += 1;
    }

    metrics.stages[stage] = (metrics.stages[stage] ?? 0) + 1;
    metrics.skillsReferenced[skill] = (metrics.skillsReferenced[skill] ?? 0) + 1;
  }

  return {
    exists: true,
    logs,
    metrics,
  };
}

export function summarizeLogs(
  logsDir?: string,
  allowedFilePaths?: readonly string[],
): LogsSummary {
  const files =
    allowedFilePaths === undefined
      ? []
      : Array.from(
          new Set(
            allowedFilePaths.filter((filePath) => filePath.endsWith('.md') && fs.existsSync(filePath)),
          ),
        );

  if (!logsDir || !fs.existsSync(logsDir)) {
    if (files.length > 0) {
      return summarizeParsedLogs(files.map((filePath) => parseStageLog(filePath)));
    }

    return {
      exists: false,
      logs: [],
      metrics: createEmptyMetrics(),
    };
  }

  const logs = files.map((filePath) => parseStageLog(filePath));

  return summarizeParsedLogs(logs);
}
