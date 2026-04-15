import type { ScanSummary } from '../core/types.ts';

function statusLine(scan: ScanSummary): string {
  return scan.reportStatus.status === 'draft_requires_agent_validation'
    ? 'Status: draft, requires agent validation'
    : 'Status: ready for agent finalization';
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

  if (scan.report_language.toLowerCase().startsWith('ru')) {
    return `# Черновик анализа качества логирования

${statusLine(scan)}

## Резюме

- Проанализировано логов: ${scan.stageLogs.count}
- Зафиксировано process misses: ${scan.stageLogs.metrics.processMissesTotal}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Missing review artifacts: ${missingReviewArtifacts}
- Missing verification artifacts: ${missingVerificationArtifacts}
- Missing step artifacts: ${missingStepArtifacts}
- Логи только с approximate duration: ${approximateDurations}

## Наблюдаемые сильные стороны

- Structured metadata blocks позволяют автоматическое извлечение данных.
- Review rounds и findings часто записываются.
- Backlog actualization state моделируется явно.

## Наблюдаемые gaps

- Не все logs содержат полный набор closure artifacts.
- Duration accuracy не всегда exact.
- Skill usage не всегда фиксируется machine-readable способом.
- Session-trace anchors не записываются напрямую в stage logs.
- Tool-level summaries обычно отсутствуют.

## Рекомендованные улучшения

1. Добавить machine-readable trace anchors в каждый stage log:
   - first relevant event id
   - review request event ids
   - final pass event id
   - commit event id

2. Добавить structured skill-usage fields:
   - skills_used
   - skill_issues
   - skill_followups

3. Добавить компактный tool summary:
   - tools_called_total
   - distinct_tools_used
   - notable_failures
   - retries_total

4. Добавить time breakdown fields:
   - active_work_minutes
   - waiting_for_review_minutes
   - reround_minutes
   - closure_minutes

5. Добавить явные incident ids и categories в сам log.

## Validation ideas

- Fail closure, если required stage log не содержит mandatory artifact links.
- Warn, если review findings есть, но follow-up или reround не залогирован.
- Warn, если backlog truth changed, но actualization evidence отсутствует.
- Warn, если log фиксирует process miss, но remediation note отсутствует.
`;
  }

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

- Not all logs include the full closure artifact set.
- Duration accuracy is not always exact.
- Skill usage is not consistently captured in a machine-readable way.
- Session-trace anchors are not recorded directly in stage logs.
- Tool-level summaries are typically absent.

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
