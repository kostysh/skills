import { formatList, topEntries } from '../core/shared.ts';
import type { ScanSummary } from '../core/types.ts';

export interface ReportRenderOptions {
  phase?: string;
  title?: string;
}

export function buildReportMarkdown(scan: ScanSummary, options: ReportRenderOptions): string {
  const title = options.title ?? `Retrospective${options.phase ? `: ${options.phase}` : ''}`;
  const topTools = topEntries(scan.session.tools, 10).map(([name, count]) => `${name} (${count})`);
  const incidentSections = scan.candidateIncidents
    .map((incident, index) =>
      [
        `### R-${String(index + 1).padStart(2, '0')} — ${incident.title}`,
        `- Severity: ${incident.severity}`,
        `- Stage: ${incident.stage}`,
        `- Evidence: ${incident.evidence}`,
        `- Observation: ${incident.reason}`,
        '',
      ].join('\n'),
    )
    .join('\n');

  const logFiles =
    scan.stageLogs.files.map((entry) => `- ${entry.filePath}`).join('\n') || '- none';
  const skillFiles =
    scan.skills.map((skill) => `- ${skill.name}: ${skill.skillFile}`).join('\n') || '- none';

  return `# ${title}

## Executive summary

- Phase: ${options.phase ?? 'unspecified'}
- Session trace: ${scan.inputs.session ?? 'not provided'}
- Stage logs analyzed: ${scan.stageLogs.count}
- Candidate incidents: ${scan.candidateIncidents.length}
- Distinct tools observed: ${Object.keys(scan.session.tools).length}
- Data-quality note: ${
    scan.dataQuality.sessionPresent && scan.dataQuality.logsPresent
      ? 'Both session trace and stage logs were available.'
      : 'One or more core evidence sources were missing; confidence is reduced.'
  }

## Evidence manifest

### Stage logs
${logFiles}

### Skills
${skillFiles}

### Session trace
- ${scan.inputs.session ?? 'not provided'}

## Timeline summary

- Start: ${scan.session.firstTimestamp ?? 'unknown'}
- End: ${scan.session.lastTimestamp ?? 'unknown'}
- Duration (minutes): ${scan.session.durationMinutes ?? 'unknown'}
- Aborted or restarted turns: ${scan.session.abortedTurns}
- Long gaps detected: ${scan.session.longGaps}

## Top observed tools

${formatList(topTools)}

## Candidate incidents

${incidentSections || 'No candidate incidents were inferred automatically.'}

## Stage-log metrics

- Review rounds total: ${scan.stageLogs.metrics.reviewRoundsTotal}
- Review findings total: ${scan.stageLogs.metrics.reviewFindingsTotal}
- Process misses total: ${scan.stageLogs.metrics.processMissesTotal}
- Backlog actualized cycles: ${scan.stageLogs.metrics.backlogActualizedCount}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}

## Preliminary stage analysis

${formatList(
  topEntries(scan.stageLogs.metrics.stages, 20).map(
    ([stage, count]) => `${stage}: ${count} log(s)`,
  ),
)}

## Preliminary skill analysis

${formatList(
  topEntries(scan.stageLogs.metrics.skillsReferenced, 20).map(
    ([skill, count]) => `${skill}: referenced in ${count} log(s)`,
  ),
)}

## Recommended next manual checks

- Confirm each inferred incident against the actual stage log and trace excerpts.
- Review rerounds and non-pass reviews for avoidable causes.
- Inspect skills referenced in the logs for missing decision rules, outdated assumptions, and ambiguity.
- Validate whether late or missing backlog actualization affected closure quality.
- Separate necessary complexity from avoidable friction before finalizing recommendations.

## Data-quality limits

- Session parse errors: ${scan.dataQuality.sessionParseErrors}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}
- Skill catalog available: ${scan.dataQuality.skillCatalogPresent}
- This draft is heuristic and should be refined by reading the cited artifacts.
`;
}
