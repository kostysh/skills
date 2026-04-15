import type { ScanSummary } from '../core/types.ts';

function statusLine(scan: ScanSummary): string {
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

  if (gaps.length === 0) {
    return '- No automated logging gaps were inferred from the available counters.';
  }

  return gaps.map((gap) => `- ${gap}`).join('\n');
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

  return `# Logging review draft

${statusLine(scan)}

## Summary

- Logs analyzed: ${scan.stageLogs.count}
- Process misses recorded: ${scan.stageLogs.metrics.processMissesTotal}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Missing review artifacts: ${missingReviewArtifacts}
- Missing verification artifacts: ${missingVerificationArtifacts}
- Missing step artifacts: ${missingStepArtifacts}
- Logs with approximate duration only: ${approximateDurations}

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
})}

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
