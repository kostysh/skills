import path from 'node:path';

import { stringFromUnknown } from './shared.ts';
import type { CandidateIncident, LogsSummary, SessionSummary } from './types.ts';

export function inferCandidateIncidents(
  sessionSummary: SessionSummary,
  logSummary: LogsSummary,
): CandidateIncident[] {
  const incidents: CandidateIncident[] = [];

  for (const log of logSummary.logs) {
    const metadata = log.metadata;
    const stage = stringFromUnknown(metadata.stage, 'unknown');

    const processMissTotal = Number(metadata.process_misses_total ?? 0);
    const reviewFindingTotal = Number(metadata.review_findings_total ?? 0);

    if (processMissTotal > 0 || log.processMissLines.length > 0) {
      incidents.push({
        title: `Process misses in ${path.basename(log.filePath)}`,
        severity:
          Number(metadata.process_misses_total ?? log.processMissLines.length) >= 2
            ? 'high'
            : 'medium',
        stage,
        evidence: log.filePath,
        reason: log.processMissLines.join('; ') || 'Structured log indicates process misses.',
      });
    }

    if (reviewFindingTotal > 0) {
      incidents.push({
        title: `Review findings in ${path.basename(log.filePath)}`,
        severity: reviewFindingTotal >= 3 ? 'high' : 'medium',
        stage,
        evidence: log.filePath,
        reason: `${reviewFindingTotal} review finding(s) recorded.`,
      });
    }

    if (metadata.backlog_actualized === false && /backlog/iu.test(log.raw)) {
      incidents.push({
        title: `Backlog actualization deferred in ${path.basename(log.filePath)}`,
        severity: 'low',
        stage,
        evidence: log.filePath,
        reason: 'The log references backlog actualization but marks it incomplete or deferred.',
      });
    }

    const reviewText = (
      log.sections['События ревью'] ||
      log.sections['Review events'] ||
      ''
    ).toLowerCase();
    if (reviewText.includes('fail') || reviewText.includes('non-compliant')) {
      incidents.push({
        title: `Non-pass review cycle in ${path.basename(log.filePath)}`,
        severity: 'medium',
        stage,
        evidence: log.filePath,
        reason: 'At least one review event returned FAIL or non-compliant before final pass.',
      });
    }
  }

  if (sessionSummary.abortedTurns > 0 && sessionSummary.filePath) {
    incidents.push({
      title: 'Aborted or restarted turns detected',
      severity: sessionSummary.abortedTurns >= 3 ? 'high' : 'medium',
      stage: 'session',
      evidence: sessionSummary.filePath,
      reason: `${sessionSummary.abortedTurns} aborted/restarted turn(s) detected in the session trace.`,
    });
  }

  return incidents;
}
