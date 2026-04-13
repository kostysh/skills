import { stringFromUnknown } from '../core/shared.ts';
import type { ScanSummary, SkillSummary } from '../core/types.ts';

export function buildSkillAuditMarkdown(scan: ScanSummary): string {
  const skills: SkillSummary[] =
    scan.skills.length > 0
      ? scan.skills
      : Object.keys(scan.stageLogs.metrics.skillsReferenced).map((name) => ({
          name,
          skillFile: 'referenced via logs only',
          description: '',
        }));

  const rows = skills
    .map((skill) => {
      const references = scan.stageLogs.files.filter(
        (entry) => stringFromUnknown(entry.metadata.skill, '') === skill.name,
      ).length;
      const issueCount = scan.candidateIncidents.filter((incident) =>
        incident.evidence.includes('.md'),
      ).length;

      return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Description: ${skill.description || 'n/a'}
- Direct log references: ${references}
- Potential friction signals: ${issueCount > 0 ? issueCount : 'none automatically inferred'}
- Manual review prompts:
  - Were mandatory review steps explicit?
  - Were entry/exit criteria explicit?
  - Were ambiguous exceptions handled?
  - Did the skill force extra interpretation from scattered references?
`;
    })
    .join('\n');

  return `# Skill audit draft

## Summary

- Skills inspected: ${skills.length}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}

## Findings by skill

${rows}

## Cross-skill patterns to investigate

- Ambiguous review policy or review order
- Missing decision tables for exceptions and edge cases
- Missing examples for reround handling
- Missing or weak logging expectations
- Outdated assumptions about tools, verification, or closure

## Next manual checks

- Read each skill file that materially influenced the phase.
- Correlate rerounds and process misses with the relevant skill steps.
- Separate operator-specific constraints from actual skill defects.
`;
}
