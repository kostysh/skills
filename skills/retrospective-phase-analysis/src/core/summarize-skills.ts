import fs from 'node:fs';
import path from 'node:path';

import { parseLooseYaml } from '../parsers/loose-yaml.ts';
import { listFilesRecursive, readText } from './shared.ts';
import type { SkillsSummary } from './types.ts';

export function summarizeSkills(skillsDir?: string): SkillsSummary {
  if (!skillsDir || !fs.existsSync(skillsDir)) {
    return { exists: false, skills: [] };
  }

  const candidates = listFilesRecursive(skillsDir).filter(
    (filePath) => path.basename(filePath) === 'SKILL.md',
  );
  const skills = candidates.map((skillFile) => {
    const content = readText(skillFile);
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/u);
    const frontmatter = frontmatterMatch ? parseLooseYaml(frontmatterMatch[1] ?? '') : {};

    return {
      skillFile,
      name:
        typeof frontmatter.name === 'string'
          ? frontmatter.name
          : path.basename(path.dirname(skillFile)),
      description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
    };
  });

  return { exists: true, skills };
}
