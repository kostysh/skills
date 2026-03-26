import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from './frontmatter.mjs';
import { readText } from './fs-utils.mjs';

export const DEFAULT_DOSSIERS_DIR = 'docs/features';
export const DOSSIER_STATUSES = new Set([
  'proposed',
  'shaped',
  'planned',
  'in_progress',
  'done',
  'parked',
]);
export const COVERAGE_GATES = new Set(['deferred', 'strict']);
export const DEFAULT_STRICT_COVERAGE_STATUSES = new Set(['in_progress', 'done']);

export const isDossierFile = (fileName) =>
  /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);

export const listDossierFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isDossierFile)
    .sort();
};

export const extractAcIds = (markdown) => {
  const ids = new Set();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (;;) {
    const match = regex.exec(String(markdown));
    if (!match) break;
    ids.add(`AC-F${match[1]}-${match[2].padStart(2, '0')}`);
  }
  return [...ids].sort();
};

export const extractCoverageAcIds = (markdown) => {
  const ids = new Set();
  const regex = /^\|\s*(AC-F\d{4}-\d{1,2})\s*\|/gm;
  for (;;) {
    const match = regex.exec(String(markdown));
    if (!match) break;
    ids.add(match[1].replace(/-(\d{1,2})$/, (_, number) => `-${String(number).padStart(2, '0')}`));
  }
  return [...ids].sort();
};

export const extractFeatureNumericId = (featureId) => {
  const match = String(featureId).match(/^F-(\d{4})$/);
  return match ? match[1] : null;
};

export const extractFeatureIdFromAc = (acId) => {
  const match = String(acId).match(/^AC-F(\d{4})-\d{2}$/);
  return match ? `F-${match[1]}` : null;
};

export const matchesFeatureFile = (featureId, filePath) => {
  const baseName = path.basename(filePath);
  return baseName === `${featureId}.md` || baseName.startsWith(`${featureId}-`);
};

export const resolveCoverageGate = (frontmatter = {}, options = {}) => {
  const configuredGate = frontmatter.coverage_gate;
  if (typeof configuredGate === 'string' && COVERAGE_GATES.has(configuredGate)) {
    return configuredGate;
  }

  const strictStatuses = options.strictStatuses ?? DEFAULT_STRICT_COVERAGE_STATUSES;
  return strictStatuses.has(String(frontmatter.status)) ? 'strict' : 'deferred';
};

export const readDossierRecord = async (absPath, options = {}) => {
  const markdown = await readText(absPath);
  const frontmatter = parseFrontmatter(markdown) ?? {};
  const coverageGate = resolveCoverageGate(frontmatter, options);
  return {
    absPath,
    relPath: options.root
      ? path.relative(options.root, absPath).split(path.sep).join('/')
      : absPath,
    markdown,
    frontmatter,
    coverageGate,
    acIds: extractAcIds(markdown),
    coverageIds: extractCoverageAcIds(markdown),
  };
};

export const readAllDossiers = async (root, dossiersDir, options = {}) => {
  const absDossiersDir = path.resolve(root, dossiersDir);
  const files = await listDossierFiles(absDossiersDir);
  const dossiers = [];
  for (const file of files) {
    dossiers.push(
      await readDossierRecord(path.join(absDossiersDir, file), {
        ...options,
        root,
      }),
    );
  }
  dossiers.sort((left, right) =>
    String(left.frontmatter.id).localeCompare(String(right.frontmatter.id)),
  );
  return dossiers;
};

export const hasChangeLogEntry = (markdown) =>
  /##\s+.*Change log|##\s+Change log/i.test(String(markdown));

export const parseStatus = (markdown) => {
  const frontmatter = parseFrontmatter(markdown);
  return frontmatter?.status ?? null;
};
