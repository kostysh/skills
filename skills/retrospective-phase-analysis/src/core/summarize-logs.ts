import fs from 'node:fs';

import { parseStageLog } from '../parsers/stage-log.ts';
import { listFilesRecursive, stringFromUnknown } from './shared.ts';
import type { LogsSummary } from './types.ts';

export function summarizeLogs(logsDir?: string): LogsSummary {
  if (!logsDir || !fs.existsSync(logsDir)) {
    return {
      exists: false,
      logs: [],
      metrics: {
        logsTotal: 0,
        reviewRoundsTotal: 0,
        reviewFindingsTotal: 0,
        processMissesTotal: 0,
        backlogActualizedCount: 0,
        stages: {},
        skillsReferenced: {},
        lateLogStartCount: 0,
      },
    };
  }

  const files = listFilesRecursive(logsDir).filter((filePath) => filePath.endsWith('.md'));
  const logs = files.map((filePath) => parseStageLog(filePath));

  const metrics = {
    logsTotal: logs.length,
    reviewRoundsTotal: 0,
    reviewFindingsTotal: 0,
    processMissesTotal: 0,
    backlogActualizedCount: 0,
    stages: {} as Record<string, number>,
    skillsReferenced: {} as Record<string, number>,
    lateLogStartCount: 0,
  };

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
