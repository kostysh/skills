import type { ReferencedSkill, ScanSummary, SkillEvidence } from '../core/types.ts';

function statusLine(scan: ScanSummary): string {
  return scan.reportStatus.status === 'draft_requires_agent_validation'
    ? 'Status: draft, requires agent validation'
    : 'Status: ready for agent finalization';
}

function formatEvidence(evidence: readonly SkillEvidence[]): string {
  if (evidence.length === 0) {
    return '- none';
  }

  return evidence
    .map((entry) => {
      const location = entry.line > 0 ? `line ${entry.line}` : entry.event_type;
      return `- ${location}, ${entry.field}, matched \`${entry.matched_alias}\`: ${entry.excerpt}`;
    })
    .join('\n');
}

function skillFileLine(skill: ReferencedSkill): string {
  if (skill.skillFile) {
    return skill.skillFile;
  }

  return 'not resolved; local skill body was not inspected';
}

function formatSkillSections(skills: readonly ReferencedSkill[]): string {
  if (skills.length === 0) {
    return 'The operational trace did not reference any skills from the injected `Available skills` catalog.';
  }

  return skills
    .map((skill) => {
      return `### Skill: ${skill.name}

- Display name: ${skill.display_name}
- Skill file: ${skillFileLine(skill)}
- Description: ${skill.description || 'n/a'}
- Evidence count: ${skill.evidence.length}

#### Evidence
${formatEvidence(skill.evidence)}

#### Manual review prompts
- Were mandatory review steps explicit?
- Were entry/exit criteria explicit?
- Were ambiguous exceptions handled?
- Did the skill force extra interpretation from scattered references?
`;
    })
    .join('\n');
}

export function buildSkillAuditMarkdown(scan: ScanSummary): string {
  return `# Skill audit draft

${statusLine(scan)}

## Summary

- Available skills in injected catalog: ${scan.skills.available.length}
- Referenced skills in operational trace: ${scan.skills.referenced.length}
- Unreferenced catalog skills: ${scan.skills.unreferenced_count}
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}
- Skill catalog available: ${scan.dataQuality.skillCatalogPresent}

## Findings by skill

${formatSkillSections(scan.skills.referenced)}

## Cross-skill patterns to investigate

- Ambiguous review policy or review order
- Missing decision tables for exceptions and edge cases
- Missing examples for reround handling
- Missing or weak logging expectations
- Outdated assumptions about tools, verification, or closure

## Next manual checks

- Read each referenced skill file when the local body is available.
- Correlate rerounds and process misses with the relevant skill steps.
- Separate operator-specific constraints from actual skill defects.
`;
}
