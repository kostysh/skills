import { stringFromUnknown } from '../core/shared.ts';
import type { ScanSummary, SkillSummary } from '../core/types.ts';

type SkillAuditConfidence = 'confirmed_used' | 'probably_used' | 'implicitly_relevant';

interface ClassifiedSkill extends SkillSummary {
  confidence: SkillAuditConfidence;
  issueCount: number;
  references: number;
}

function statusLine(scan: ScanSummary): string {
  return scan.reportStatus.status === 'draft_requires_agent_validation'
    ? 'Status: draft, requires agent validation'
    : 'Status: ready for agent finalization';
}

function skillCandidates(scan: ScanSummary): SkillSummary[] {
  return scan.skills.length > 0
    ? scan.skills
    : Object.keys(scan.stageLogs.metrics.skillsReferenced).map((name) => ({
        name,
        skillFile: 'referenced via logs only',
        description: '',
      }));
}

function classifySkill(scan: ScanSummary, skill: SkillSummary): ClassifiedSkill {
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

  return {
    ...skill,
    confidence,
    issueCount,
    references,
  };
}

function formatImplicitSkills(skills: ClassifiedSkill[]): string {
  const implicit = skills.filter((skill) => skill.confidence === 'implicitly_relevant');
  if (implicit.length === 0) {
    return '- none';
  }

  const visible = implicit
    .slice(0, 10)
    .map((skill) => `- ${skill.name}: ${skill.skillFile}`);
  const hiddenCount = implicit.length - visible.length;
  if (hiddenCount > 0) {
    visible.push(`- ${hiddenCount} additional implicitly relevant skill(s) omitted.`);
  }
  return visible.join('\n');
}

function formatMaterialSkillRows(skills: ClassifiedSkill[], language: 'en' | 'ru'): string {
  const material = skills.filter((skill) => skill.confidence !== 'implicitly_relevant');
  if (material.length === 0) {
    return language === 'ru'
      ? 'Автоматически не найдено skills с уверенностью `confirmed_used` или `probably_used`.'
      : 'No skills reached `confirmed_used` or `probably_used` automatically.';
  }

  return material
    .map((skill) => {
      if (language === 'ru') {
        return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Описание: ${skill.description || 'n/a'}
- Уверенность: ${skill.confidence}
- Прямые ссылки из логов: ${skill.references}
- Потенциальные friction signals: ${skill.issueCount > 0 ? skill.issueCount : 'none automatically inferred'}
- Ручные проверки:
  - Были ли обязательные review steps явными?
  - Были ли entry/exit criteria явными?
  - Были ли неоднозначные исключения обработаны?
  - Заставлял ли skill интерпретировать правила из разрозненных references?
`;
      }

      return `### Skill: ${skill.name}

- Skill file: ${skill.skillFile}
- Description: ${skill.description || 'n/a'}
- Confidence: ${skill.confidence}
- Direct log references: ${skill.references}
- Potential friction signals: ${skill.issueCount > 0 ? skill.issueCount : 'none automatically inferred'}
- Manual review prompts:
  - Were mandatory review steps explicit?
  - Were entry/exit criteria explicit?
  - Were ambiguous exceptions handled?
  - Did the skill force extra interpretation from scattered references?
`;
    })
    .join('\n');
}

export function buildSkillAuditMarkdown(scan: ScanSummary): string {
  const classifiedSkills = skillCandidates(scan).map((skill) => classifySkill(scan, skill));

  if (scan.report_language.toLowerCase().startsWith('ru')) {
    return buildRussianSkillAuditMarkdown(scan, classifiedSkills);
  }

  const materialSkills = classifiedSkills.filter(
    (skill) => skill.confidence !== 'implicitly_relevant',
  );

  return `# Skill audit draft

${statusLine(scan)}

## Summary

- Skills inspected: ${materialSkills.length}
- Implicitly relevant skills listed separately: ${
    classifiedSkills.length - materialSkills.length
  }
- Session trace available: ${scan.dataQuality.sessionPresent}
- Stage logs available: ${scan.dataQuality.logsPresent}

## Findings by skill

${formatMaterialSkillRows(classifiedSkills, 'en')}

## Implicitly relevant skills

${formatImplicitSkills(classifiedSkills)}

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

function buildRussianSkillAuditMarkdown(scan: ScanSummary, skills: ClassifiedSkill[]): string {
  const materialSkills = skills.filter((skill) => skill.confidence !== 'implicitly_relevant');

  return `# Черновик аудита инструкций агентов

${statusLine(scan)}

## Резюме

- Проверено skills: ${materialSkills.length}
- Отдельно перечислено implicitly relevant skills: ${skills.length - materialSkills.length}
- Trace сессии доступен: ${scan.dataQuality.sessionPresent}
- Логи этапов доступны: ${scan.dataQuality.logsPresent}

## Находки по инструкциям

${formatMaterialSkillRows(skills, 'ru')}

## Implicitly relevant skills

${formatImplicitSkills(skills)}

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
