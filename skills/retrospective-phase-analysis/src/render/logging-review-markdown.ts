import { isActionableReviewSignal, isContextReviewSignal } from '../core/review-signals.ts';
import type { ScanSummary } from '../core/types.ts';

function statusLine(scan: ScanSummary): string {
  if (scan.validation?.agent_validated) {
    return 'Status: agent validated';
  }
  return scan.reportStatus.status === 'draft_requires_agent_validation'
    ? 'Status: draft, requires agent validation'
    : 'Status: ready for agent finalization';
}

function formatObservedGaps(input: {
  missingReviewArtifacts: number;
  missingVerificationArtifacts: number;
  missingStepArtifacts: number;
  approximateDurations: number;
  missingSkillCatalog: boolean;
  excludedStageLogCandidates: string[];
  missingNonPassReviewArtifacts: number;
}): string {
  const gaps: string[] = [];
  const missingClosureArtifacts =
    input.missingReviewArtifacts + input.missingVerificationArtifacts + input.missingStepArtifacts;

  if (missingClosureArtifacts > 0) {
    gaps.push(
      `Not all logs include the full closure artifact set (${missingClosureArtifacts} missing link(s)).`,
    );
  }
  if (input.approximateDurations > 0) {
    gaps.push(`Duration accuracy is not always exact (${input.approximateDurations} log(s)).`);
  }
  if (input.missingSkillCatalog) {
    gaps.push('The injected Available skills catalog was missing or unresolved.');
  }
  if (input.excludedStageLogCandidates.length > 0) {
    gaps.push(
      `Excluded stage-log candidates require validation: ${input.excludedStageLogCandidates.join(', ')}.`,
    );
  }
  if (input.missingNonPassReviewArtifacts > 0) {
    gaps.push(
      `${input.missingNonPassReviewArtifacts} non-PASS review signal(s) lack matching immutable review artifacts.`,
    );
  }

  if (gaps.length === 0) {
    return '- No automated logging gaps were inferred from the available counters.';
  }

  return gaps.map((gap) => `- ${gap}`).join('\n');
}

function formatMetricSource(
  scan: ScanSummary,
  key: keyof ScanSummary['stageLogs']['metrics']['sources'],
): string {
  const source = scan.stageLogs.metrics.sources?.[key] ?? {
    quality: 'none',
    reason: 'Metric source quality is unavailable in this legacy scan summary.',
  };
  return `${source.quality} — ${source.reason}`;
}

function excludedStageLogCandidateLabels(scan: ScanSummary): string[] {
  return scan.scope.stage_log_candidates
    .filter((candidate) => !candidate.included)
    .map(
      (candidate) =>
        `${candidate.path} (${candidate.evidence_kind}; ${candidate.next_action ?? candidate.reason})`,
    );
}

export function buildLoggingReviewMarkdown(scan: ScanSummary): string {
  const missingReviewArtifacts = scan.stageLogs.files.filter(
    (entry) => !entry.metadata.review_artifact,
  ).length;
  const missingStepArtifacts = scan.stageLogs.files.filter(
    (entry) => !entry.metadata.step_artifact,
  ).length;
  const missingVerificationArtifacts = scan.stageLogs.files.filter(
    (entry) => !entry.metadata.verification_artifact,
  ).length;
  const approximateDurations = scan.stageLogs.files.filter(
    (entry) =>
      entry.metadata.log_quality &&
      typeof entry.metadata.log_quality === 'object' &&
      (entry.metadata.log_quality as Record<string, unknown>).duration_exact === false,
  ).length;
  const excludedStageLogs = excludedStageLogCandidateLabels(scan);
  const missingNonPassReviewArtifacts = (scan.reviewSignals ?? []).filter(
    (signal) => isActionableReviewSignal(signal) && !signal.matching_artifact,
  ).length;
  const contextReviewSignals = (scan.reviewSignals ?? []).filter(isContextReviewSignal).length;
  const logDerivedMetricsStatus =
    scan.stageLogs.count === 0 && excludedStageLogs.length > 0
      ? 'incomplete; excluded stage-log candidates require validation.'
      : 'based on included stage logs.';

  return `# Logging review draft

${statusLine(scan)}

## Summary

- Logs analyzed: ${scan.stageLogs.count}
- Log-derived metrics: ${logDerivedMetricsStatus}
- Excluded stage-log candidates require validation: ${excludedStageLogs.join(', ') || 'none'}
- Non-PASS review signals without matching immutable artifacts: ${missingNonPassReviewArtifacts}
- Historical or superseded trace-only review signals retained as context: ${contextReviewSignals}
- Process misses recorded: ${scan.stageLogs.metrics.processMissesTotal}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Missing review artifacts: ${missingReviewArtifacts}
- Missing verification artifacts: ${missingVerificationArtifacts}
- Missing step artifacts: ${missingStepArtifacts}
- Logs with approximate duration only: ${approximateDurations}
- Process-miss source quality: ${formatMetricSource(scan, 'process_misses')}
- Skill-reference source quality: ${formatMetricSource(scan, 'skills_referenced')}
- Candidate-incident source quality: ${formatMetricSource(scan, 'candidate_incidents')}

## Observed strengths

- Structured metadata blocks enable automated extraction.
- Review rounds and findings are frequently recorded.
- Backlog actualization state is explicitly modeled.

## Observed gaps

${formatObservedGaps({
  missingReviewArtifacts,
  missingVerificationArtifacts,
  missingStepArtifacts,
  approximateDurations,
  missingSkillCatalog: !scan.dataQuality.skillCatalogPresent,
  excludedStageLogCandidates: excludedStageLogs,
  missingNonPassReviewArtifacts,
})}

## Recommendation discipline

Before adding fields or expanding log schema, check whether the issue is already solvable through existing canonical review artifacts, workflow sequencing, or prompt recipes. Propose schema/log expansion only when those mechanisms are insufficient and name the remaining gap.

## Suggested improvements

1. Add machine-readable trace anchors to each stage log:
   - first relevant event id
   - review request event ids
   - final pass event id
   - commit event id

2. Add structured skill-usage fields:
   - skills_used
   - skill_issues
   - skill_followups

3. Add a compact tool summary:
   - tools_called_total
   - distinct_tools_used
   - notable_failures
   - retries_total

4. Add time breakdown fields:
   - active_work_minutes
   - waiting_for_review_minutes
   - reround_minutes
   - closure_minutes

5. Add explicit incident ids and categories in the log itself.

## Validation ideas

- Fail closure when a required stage log lacks mandatory artifact links.
- Warn when review findings exist but no follow-up or reround is logged.
- Warn when backlog truth changed but actualization evidence is missing.
- Warn when the log records a process miss but no remediation note exists.
`;
}
