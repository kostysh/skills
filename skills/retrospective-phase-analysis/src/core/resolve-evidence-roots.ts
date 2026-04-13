import fs from 'node:fs';
import path from 'node:path';

export function resolveStandardEvidenceDir(
  projectRoot: string | null,
  relativeDir: string,
): string | undefined {
  if (!projectRoot) {
    return undefined;
  }

  const absoluteDir = path.join(projectRoot, relativeDir);
  return fs.existsSync(absoluteDir) ? absoluteDir : undefined;
}
