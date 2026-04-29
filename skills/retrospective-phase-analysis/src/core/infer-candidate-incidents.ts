import path from 'node:path';

import { isNonPassReviewEvent, structuredReviewEventsFromMetadata } from '../parsers/stage-log.ts';
import { isActionableReviewSignal } from './review-signals.ts';
import { stringFromUnknown } from './shared.ts';
import type { CandidateIncident, LogsSummary, ReviewSignal, SessionSummary } from './types.ts';

function processMissEvidence(
  metadata: Record<string, unknown>,
  proseLines: readonly string[],
): {
  count: number;
  reason: string;
} {
  if (Array.isArray(metadata.process_misses)) {
    return {
      count: metadata.process_misses.length,
      reason: 'Structured process_misses field indicates process misses.',
    };
  }

  const structuredTotal = Number(metadata.process_misses_total);
  if (Number.isFinite(structuredTotal)) {
    return {
      count: structuredTotal,
      reason: 'Structured process_misses_total field indicates process misses.',
    };
  }

  return {
    count: proseLines.length,
    reason: proseLines.join('; '),
  };
}

export function inferCandidateIncidents(
  sessionSummary: SessionSummary,
  logSummary: LogsSummary,
  reviewSignals: readonly ReviewSignal[] = logSummary.reviewSignals,
): CandidateIncident[] {
  const incidents: CandidateIncident[] = [];

  for (const log of logSummary.logs) {
    const metadata = log.metadata;
    const stage = stringFromUnknown(metadata.stage, 'unknown');

    const processMisses = processMissEvidence(metadata, log.processMissLines);
    const structuredReviewFindings = Number(metadata.review_findings_total);
    const hasStructuredReviewFindings = Number.isFinite(structuredReviewFindings);
    const reviewFindingTotal = hasStructuredReviewFindings ? structuredReviewFindings : 0;
    const logReviewSignals = reviewSignals
      .filter(isActionableReviewSignal)
      .filter((signal) => signal.evidence === log.filePath);
    const hasStructuredNonPassReview =
      structuredReviewEventsFromMetadata(metadata).some(isNonPassReviewEvent) ||
      logReviewSignals.some((signal) =>
        ['structured', 'incomplete'].includes(signal.source_quality),
      );

    if (processMisses.count > 0) {
      incidents.push({
        title: `Process misses in ${path.basename(log.filePath)}`,
        severity: processMisses.count >= 2 ? 'high' : 'medium',
        stage,
        evidence: log.filePath,
        reason: processMisses.reason,
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
    } else if (hasStructuredNonPassReview) {
      const sourceQuality = logReviewSignals.some(
        (signal) => signal.source_quality === 'incomplete',
      )
        ? 'Structured review evidence is incomplete because no matching immutable non-PASS review artifact was found.'
        : 'Structured review_events recorded FAIL or non-compliant review state before final pass.';
      incidents.push({
        title: `Non-pass review cycle in ${path.basename(log.filePath)}`,
        severity: 'medium',
        stage,
        evidence: log.filePath,
        reason: sourceQuality,
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
    if (
      !hasStructuredReviewFindings &&
      !hasStructuredNonPassReview &&
      (reviewText.includes('fail') ||
        reviewText.includes('non-compliant') ||
        logReviewSignals.some((signal) => signal.source_quality === 'prose_derived'))
    ) {
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

  for (const signal of reviewSignals.filter(
    (entry) => entry.source === 'trace' && isActionableReviewSignal(entry),
  )) {
    incidents.push({
      title: 'Trace-derived non-pass review signal',
      severity: 'medium',
      stage: 'review',
      evidence: signal.evidence,
      reason:
        'Session trace indicates a non-PASS review signal without a matching immutable review artifact.',
    });
  }

  return incidents;
}
