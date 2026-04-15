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

  if (scan.report_language.toLowerCase().startsWith('ru')) {
    return buildRussianSkillAuditMarkdown(scan, skills);
  }

  const rows = skills
    .map((skill) => {
      const references = scan.stageLogs.files.filter(
        (entry) => stringFromUnknown(entry.metadata.skill, '') === skill.name,
      ).length;
      const confidence =
        references > 0
          ? 'confirmed_used'
          : scan.scope.touched_paths.includes(skill.skillFile)
            ? 'probably_used'
            : 'implicitly_relevant';
      const issueCount = scan.candidateIncidents.filter((incident) =>
        incident.evidence.includes('.md'),
      ).length;

      return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Description: ${skill.description || 'n/a'}
- Confidence: ${confidence}
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

function buildRussianSkillAuditMarkdown(scan: ScanSummary, skills: SkillSummary[]): string {
  const rows = skills
    .map((skill) => {
      const references = scan.stageLogs.files.filter(
        (entry) => stringFromUnknown(entry.metadata.skill, '') === skill.name,
      ).length;
      const confidence =
        references > 0
          ? 'confirmed_used'
          : scan.scope.touched_paths.includes(skill.skillFile)
            ? 'probably_used'
            : 'implicitly_relevant';
      const issueCount = scan.candidateIncidents.filter((incident) =>
        incident.evidence.includes('.md'),
      ).length;

      return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Описание: ${skill.description || 'n/a'}
- Уверенность: ${confidence}
- Прямые ссылки из логов: ${references}
- Потенциальные friction signals: ${issueCount > 0 ? issueCount : 'none automatically inferred'}
- Ручные проверки:
  - Были ли обязательные review steps явными?
  - Были ли entry/exit criteria явными?
  - Были ли неоднозначные исключения обработаны?
  - Заставлял ли skill интерпретировать правила из разрозненных references?
`;
    })
    .join('\n');

  return `# Черновик аудита инструкций агентов

## Резюме

- Проверено skills: ${skills.length}
- Trace сессии доступен: ${scan.dataQuality.sessionPresent}
- Логи этапов доступны: ${scan.dataQuality.logsPresent}

## Находки по инструкциям

${rows}

## Cross-skill patterns для проверки

- Неоднозначный review policy или review order
- Недостающие decision tables для exceptions и edge cases
- Недостающие examples для reround handling
- Недостающие или слабые logging expectations
- Устаревшие assumptions о tools, verification или closure

## Следующие ручные проверки

- Прочитать каждый skill file, который существенно влиял на phase.
- Сопоставить rerounds и process misses с соответствующими skill steps.
- Отделить operator-specific constraints от реальных skill defects.
`;
}
