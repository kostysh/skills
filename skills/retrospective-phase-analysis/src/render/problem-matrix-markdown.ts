import { topEntries } from '../core/shared.ts';
import type { CandidateIncident, ScanSummary } from '../core/types.ts';

function firstProblemSkill(scan: ScanSummary): string {
  const stageSkill = topEntries(scan.stageLogs.metrics.skillsReferenced, 1)[0]?.[0];
  if (stageSkill && stageSkill !== 'unknown') {
    return stageSkill;
  }
  return scan.skills.referenced[0]?.name ?? 'process';
}

function recommendationForIncident(incident: CandidateIncident): string {
  if (/review/iu.test(incident.title)) {
    return 'Preserve structured review history and link immutable non-PASS artifacts before finalizing retrospective metrics.';
  }
  if (/process miss/iu.test(incident.title)) {
    return 'Move the repeated process miss into the owning skill or workflow checklist with a concrete validation gate.';
  }
  if (/backlog/iu.test(incident.title)) {
    return 'Require durable backlog actualization evidence before closure and expose it in stage telemetry.';
  }
  return 'Validate the symptom against cited evidence, then move the reusable prevention rule into the owning skill or workflow.';
}

function reviewHistoryRows(scan: ScanSummary): string[][] {
  const hasIncompleteReviewSignals = (scan.reviewSignals ?? []).some(
    (signal) => !signal.matching_artifact,
  );
  if (!hasIncompleteReviewSignals) {
    return [];
  }

  return [
    [
      'PM-REVIEW-HISTORY',
      'Non-PASS review history is present, but at least one signal lacks a matching immutable review artifact.',
      'unified-dossier-engineer',
      'Use structured UDE producer fields for durable review history; keep trace/prose signals as lower-quality fallback evidence until matching artifacts exist.',
    ],
  ];
}

function incidentRows(scan: ScanSummary): string[][] {
  return scan.candidateIncidents.map((incident, index) => [
    `PM-${String(index + 1).padStart(2, '0')}`,
    `${incident.title}: ${incident.reason}`,
    firstProblemSkill(scan),
    recommendationForIncident(incident),
  ]);
}

function formatTable(rows: string[][]): string {
  if (rows.length === 0) {
    return '| none | No reusable skill/process problem was inferred automatically. | process | Validate cited evidence manually before adding a skill change. |';
  }

  return rows
    .map((row) => `| ${row.map((cell) => cell.replaceAll('|', '\\|')).join(' | ')} |`)
    .join('\n');
}

export function buildProblemMatrixMarkdown(scan: ScanSummary): string {
  const rows = [...reviewHistoryRows(scan), ...incidentRows(scan)];
  const validation = scan.validation ?? {
    agent_validated: false,
    validated_scope: null,
    residual_confidence: null,
    validation_notes: null,
    validated_at: null,
    validated_by: null,
  };

  return `# Problem matrix by skill

Status: ${validation.agent_validated ? 'agent validated' : 'draft, requires agent validation'}

| ID | Проблема | Скил, содержащий проблему | Предложение по решению проблемы |
|---|---|---|---|
${formatTable(rows)}

## Validation metadata

- agent_validated: ${validation.agent_validated}
- validated_scope: ${validation.validated_scope ?? 'not validated'}
- residual_confidence: ${validation.residual_confidence ?? 'not validated'}
- validation_notes: ${validation.validation_notes ?? 'not validated'}
`;
}
