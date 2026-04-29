import { formatList, topEntries } from '../core/shared.ts';
import { isContextReviewSignal } from '../core/review-signals.ts';
import type { ScanSummary } from '../core/types.ts';

export interface ReportRenderOptions {
  phase?: string;
  title?: string;
}

function statusLine(scan: ScanSummary): string {
  if (scan.validation?.agent_validated) {
    return 'Status: agent validated';
  }
  return scan.reportStatus.status === 'draft_requires_agent_validation'
    ? 'Status: draft, requires agent validation'
    : 'Status: ready for agent finalization';
}

function statusReasons(scan: ScanSummary): string {
  return scan.reportStatus.reasons.length > 0
    ? formatList(scan.reportStatus.reasons)
    : '- Evidence quality passed automated scaffold checks.';
}

function formatSkillManifest(scan: ScanSummary): string {
  return (
    scan.skills.referenced
      .map((skill) => {
        const source = skill.skillFile ?? 'skill file not resolved';
        return `- ${skill.name}: ${source}`;
      })
      .join('\n') || '- none'
  );
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

function excludedStageLogCandidates(
  scan: ScanSummary,
): ScanSummary['scope']['stage_log_candidates'] {
  return scan.scope.stage_log_candidates.filter((candidate) => !candidate.included);
}

function hasIncompleteZeroStageLogMetrics(scan: ScanSummary): boolean {
  return scan.stageLogs.count === 0 && excludedStageLogCandidates(scan).length > 0;
}

function candidateIncidentsSummary(scan: ScanSummary): string {
  if (hasIncompleteZeroStageLogMetrics(scan)) {
    return `incomplete until excluded stage-log candidates are validated (${scan.candidateIncidents.length} inferred automatically)`;
  }

  return String(scan.candidateIncidents.length);
}

function candidateIncidentSection(scan: ScanSummary, incidentSections: string): string {
  if (incidentSections) {
    return incidentSections;
  }
  if (hasIncompleteZeroStageLogMetrics(scan)) {
    return 'No candidate incidents were inferred automatically because no stage logs were analyzed; excluded stage-log candidates require validation first.';
  }

  return 'No candidate incidents were inferred automatically.';
}

function hasManualOverrides(scan: ScanSummary): boolean {
  return scan.reportStatus.reasons.some((reason) => /manual artifact overrides/iu.test(reason));
}

function evidenceSourceStatus(scan: ScanSummary): string {
  const limits: string[] = [];
  if (!scan.dataQuality.sessionPresent) {
    limits.push('session trace missing');
  }
  if (scan.dataQuality.sessionParseErrors > 0) {
    limits.push(`${scan.dataQuality.sessionParseErrors} session parse error(s)`);
  }
  if (!scan.dataQuality.logsPresent) {
    limits.push('stage logs missing or unresolved');
  }
  if (!scan.dataQuality.skillCatalogPresent) {
    limits.push('skill catalog missing or unresolved');
  }
  if (hasIncompleteZeroStageLogMetrics(scan)) {
    limits.push('excluded stage-log candidates require validation');
  }
  if (hasManualOverrides(scan)) {
    limits.push('manual artifact overrides require validation');
  }

  return limits.length > 0 ? limits.join('; ') : 'core evidence sources are available.';
}

function formatDataQualityLimits(scan: ScanSummary): string {
  return [
    `- Session trace available: ${scan.dataQuality.sessionPresent}`,
    `- Session parse errors: ${scan.dataQuality.sessionParseErrors}`,
    `- Phase boundary mode: ${scan.phase_boundary.mode}`,
    `- Phase boundary confidence note: ${scan.phase_boundary.reason}`,
    `- Stage-log directory available: ${scan.dataQuality.logsPresent}`,
    `- Stage logs analyzed: ${scan.stageLogs.count}`,
    `- Excluded stage-log candidates requiring validation: ${excludedStageLogCandidates(scan).length}`,
    `- Skill catalog available: ${scan.dataQuality.skillCatalogPresent}`,
    `- Manual artifact overrides used: ${hasManualOverrides(scan)}`,
    '- This draft is heuristic and should be refined by reading the cited artifacts.',
  ].join('\n');
}

function formatAgentContextFactors(scan: ScanSummary): string {
  const compactedEvents = scan.session.compactedEvents ?? 0;
  const factors: string[] = [];
  if (compactedEvents > 0) {
    factors.push(
      `Compaction events observed: ${compactedEvents}; treat as execution context, not evidence loss when the raw trace is available and parsed.`,
    );
  }
  if (scan.session.longGaps > 0) {
    factors.push(`Long gaps observed: ${scan.session.longGaps}.`);
  }
  if (scan.session.abortedTurns > 0) {
    factors.push(`Aborted or restarted turns observed: ${scan.session.abortedTurns}.`);
  }

  return factors.length > 0
    ? formatList(factors)
    : '- No material agent-context factors were inferred automatically.';
}

function formatExcludedStageLogCandidates(scan: ScanSummary): string {
  const candidates = excludedStageLogCandidates(scan);
  return candidates.length > 0
    ? formatList(
        candidates.map(
          (candidate) =>
            `${candidate.path} (${candidate.evidence_kind}; ${candidate.next_action ?? candidate.reason})`,
        ),
      )
    : '- none';
}

function formatReviewEvidenceQuality(scan: ScanSummary): string {
  const signals = scan.reviewSignals ?? [];
  if (signals.length === 0) {
    return '- No non-PASS review signals were extracted automatically.';
  }

  return formatList(
    signals.map((signal) => {
      const artifact = signal.artifact_path ?? 'no immutable artifact';
      const match = signal.matching_artifact ? 'matched artifact' : 'missing matching artifact';
      return `${signal.source_quality}: ${signal.verdict} from ${signal.source} (${signal.classification}; ${artifact}; ${match})`;
    }),
  );
}

function formatReviewEvidenceContext(scan: ScanSummary): string {
  const signals = (scan.reviewSignals ?? []).filter(isContextReviewSignal);
  if (signals.length === 0) {
    return '- No historical or superseded trace-only review signals were extracted automatically.';
  }

  return formatList(
    signals.map(
      (signal) =>
        `${signal.classification}: ${signal.source_quality} ${signal.verdict} from ${signal.source} at ${signal.timestamp ?? 'unknown time'} (${signal.evidence})`,
    ),
  );
}

function formatValidationMetadata(scan: ScanSummary): string {
  const validation = scan.validation;
  if (!validation) {
    return '- Validation metadata is unavailable in this legacy scan summary.';
  }

  return [
    `- agent_validated: ${validation.agent_validated}`,
    `- validated_scope: ${validation.validated_scope ?? 'not validated'}`,
    `- manual_overrides: ${validation.manual_overrides}`,
    `- residual_confidence: ${validation.residual_confidence ?? 'not validated'}`,
    `- validation_notes: ${validation.validation_notes ?? 'not validated'}`,
  ].join('\n');
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
  const skillFiles = formatSkillManifest(scan);
  const scopePaths = scan.scope.touched_paths.map((entry) => `- ${entry}`).join('\n') || '- none';
  const scopeArtifacts =
    scan.scope.referenced_artifacts.map((entry) => `- ${entry}`).join('\n') || '- none';
  const scopeAmbiguities =
    scan.scope.scope_ambiguities.map((entry) => `- ${entry}`).join('\n') || '- none';

  return `# ${title}

${statusLine(scan)}

## Executive summary

- Phase: ${options.phase ?? 'unspecified'}
- Session trace: ${scan.resolved.session ?? 'not provided'}
- Session id: ${scan.session.sessionId ?? 'not provided'}
- Stage logs analyzed: ${scan.stageLogs.count}
- Candidate incidents: ${candidateIncidentsSummary(scan)}
- Distinct tools observed: ${Object.keys(scan.session.tools).length}
- Scope confidence: ${scan.scope.scope_confidence}
- Report scaffold status: ${scan.reportStatus.status}
- Agent validated: ${scan.validation?.agent_validated ?? false}
- Evidence-source status: ${evidenceSourceStatus(scan)}

## Evidence manifest

### Stage logs
${logFiles}

### Skills
${skillFiles}

### Session trace
- ${scan.resolved.session ?? 'not provided'}

### Trace-derived scope
- Project root: ${scan.scope.project_root ?? 'unknown'}
- Backlog items: ${scan.scope.mentioned_backlog_items.join(', ') || 'none'}
- Features: ${scan.scope.mentioned_features.join(', ') || 'none'}

### Touched paths
${scopePaths}

### Referenced artifacts
${scopeArtifacts}

## Timeline summary

- Start: ${scan.session.firstTimestamp ?? 'unknown'}
- End: ${scan.session.lastTimestamp ?? 'unknown'}
- Duration (minutes): ${scan.session.durationMinutes ?? 'unknown'}
- Aborted or restarted turns: ${scan.session.abortedTurns}
- Long gaps detected: ${scan.session.longGaps}

## Top observed tools

${formatList(topTools)}

## Candidate incidents

${candidateIncidentSection(scan, incidentSections)}

## Stage-log metrics

- Reliability: ${
    hasIncompleteZeroStageLogMetrics(scan)
      ? 'incomplete until excluded stage-log candidates are validated.'
      : 'based on included stage logs.'
  }
- Review rounds total: ${scan.stageLogs.metrics.reviewRoundsTotal}
- Review findings total: ${scan.stageLogs.metrics.reviewFindingsTotal}
- Process misses total: ${scan.stageLogs.metrics.processMissesTotal}
- Backlog actualized cycles: ${scan.stageLogs.metrics.backlogActualizedCount}
- Late log starts: ${scan.stageLogs.metrics.lateLogStartCount}
- Process-miss source quality: ${formatMetricSource(scan, 'process_misses')}
- Skill-reference source quality: ${formatMetricSource(scan, 'skills_referenced')}
- Candidate-incident source quality: ${formatMetricSource(scan, 'candidate_incidents')}

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

## Scope ambiguities

${scopeAmbiguities}

## Excluded stage-log candidates

${formatExcludedStageLogCandidates(scan)}

## Review evidence quality

${formatReviewEvidenceQuality(scan)}

## Review evidence context

${formatReviewEvidenceContext(scan)}

## Report status reasons

${statusReasons(scan)}

## Recommended next manual checks

- Confirm each inferred incident against the actual stage log and trace excerpts.
- Stop scope expansion when the ambiguities above remain unresolved after checking linked artifacts.
- Review rerounds and non-pass reviews for avoidable causes.
- Inspect skills referenced in the logs for missing decision rules, outdated assumptions, and ambiguity.
- Validate whether late or missing backlog actualization affected closure quality.
- Separate necessary complexity from avoidable friction before finalizing recommendations.

## Data-quality limits

${formatDataQualityLimits(scan)}

## Validation metadata

${formatValidationMetadata(scan)}

## Agent-context factors

${formatAgentContextFactors(scan)}
`;
}
