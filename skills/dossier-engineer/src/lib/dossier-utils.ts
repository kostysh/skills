import { promises as fs } from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from './frontmatter.js';
import { readText } from './fs-utils.js';

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

export interface DossierRecord {
  absPath: string;
  acIds: string[];
  coverageGate: string;
  coverageIds: string[];
  frontmatter: Record<string, unknown>;
  markdown: string;
  relPath: string;
}

export function isDossierFile(fileName: string): boolean {
  return /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName);
}

export async function listDossierFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isDossierFile)
    .sort();
}

export function extractAcIds(markdown: string): string[] {
  const ids = new Set<string>();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (;;) {
    const match = regex.exec(String(markdown));
    if (!match) {
      break;
    }
    ids.add(`AC-F${match[1]}-${match[2]?.padStart(2, '0')}`);
  }
  return [...ids].sort();
}

export function extractCoverageAcIds(markdown: string): string[] {
  const ids = new Set<string>();
  const regex = /^\|\s*(AC-F\d{4}-\d{1,2})\s*\|/gm;
  for (;;) {
    const match = regex.exec(String(markdown));
    if (!match) {
      break;
    }
    ids.add(
      (match[1] ?? '').replace(/-(\d{1,2})$/, (_, number: string) => `-${number.padStart(2, '0')}`),
    );
  }
  return [...ids].sort();
}

export function extractFeatureNumericId(featureId: string | null | undefined): string | null {
  const match = String(featureId).match(/^F-(\d{4})$/);
  return match ? (match[1] ?? null) : null;
}

export function extractFeatureIdFromAc(acId: string | null | undefined): string | null {
  const match = String(acId).match(/^AC-F(\d{4})-\d{2}$/);
  return match ? `F-${match[1]}` : null;
}

export function matchesFeatureFile(featureId: string, filePath: string): boolean {
  const baseName = path.basename(filePath);
  return baseName === `${featureId}.md` || baseName.startsWith(`${featureId}-`);
}

export function resolveCoverageGate(
  frontmatter: Record<string, unknown> = {},
  options: { strictStatuses?: Set<string> } = {},
): string {
  const configuredGate = frontmatter.coverage_gate;
  if (typeof configuredGate === 'string' && COVERAGE_GATES.has(configuredGate)) {
    return configuredGate;
  }

  const strictStatuses = options.strictStatuses ?? DEFAULT_STRICT_COVERAGE_STATUSES;
  return strictStatuses.has(String(frontmatter.status)) ? 'strict' : 'deferred';
}

export async function readDossierRecord(
  absPath: string,
  options: { root?: string; strictStatuses?: Set<string> } = {},
): Promise<DossierRecord> {
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
}

export async function readAllDossiers(
  root: string,
  dossiersDir: string,
  options: { strictStatuses?: Set<string> } = {},
): Promise<DossierRecord[]> {
  const absDossiersDir = path.resolve(root, dossiersDir);
  const files = await listDossierFiles(absDossiersDir);
  const dossiers: DossierRecord[] = [];
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
}

export function hasChangeLogEntry(markdown: string): boolean {
  return /##\s+.*Change log|##\s+Change log/i.test(String(markdown));
}

export function parseStatus(markdown: string): unknown {
  const frontmatter = parseFrontmatter(markdown);
  return frontmatter?.status ?? null;
}
