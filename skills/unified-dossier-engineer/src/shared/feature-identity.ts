import path from 'node:path';

import {
  extractFeatureNumericId,
  listDossierFiles,
  matchesFeatureFile,
  readDossierRecord,
  type DossierRecord,
} from '../vendor/dossier-engineer/lib/dossier-utils.ts';
import { featureDossiersDirPath } from './process-root.ts';
import { resolveManagedReadPath } from './path-guards.ts';

export const FEATURE_ID_PATTERN = /^F-\d{4}$/;
const SAFE_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function sanitizeFeatureId(value: string, label = 'feature id'): string {
  const normalized = value.trim();
  if (!FEATURE_ID_PATTERN.test(normalized)) {
    throw new Error(`${label} must match F-XXXX.`);
  }
  return normalized;
}

export function sanitizeFilesystemSegment(value: string, label: string): string {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.includes('/') ||
    normalized.includes('\\') ||
    !SAFE_SEGMENT_PATTERN.test(normalized)
  ) {
    throw new Error(`${label} must be a safe single filesystem segment.`);
  }
  return normalized;
}

export function extractFeatureIdFromDossierPath(filePath: string): string | null {
  const match = path.basename(filePath).match(/^(F-\d{4})(?:-|\.md$)/);
  return match?.[1] ?? null;
}

export async function resolveManagedDossierIdentity(payload: {
  dossierPath: string;
  expectedFeatureId?: string | null;
  root: string;
}): Promise<{
  absPath: string;
  dossier: DossierRecord;
  featureId: string;
}> {
  const absPath = await resolveManagedReadPath(
    payload.root,
    payload.dossierPath,
    featureDossiersDirPath(payload.root),
    'dossier path',
  );
  const dossier = await readDossierRecord(absPath, { root: payload.root });
  const discoveredFeatureId = sanitizeFeatureId(
    typeof dossier.frontmatter.id === 'string' && dossier.frontmatter.id.trim()
      ? dossier.frontmatter.id
      : (extractFeatureIdFromDossierPath(absPath) ?? ''),
    'dossier feature id',
  );
  if (!matchesFeatureFile(discoveredFeatureId, absPath)) {
    throw new Error(
      `Dossier path ${path.relative(payload.root, absPath)} does not match feature id ${discoveredFeatureId}.`,
    );
  }
  if (payload.expectedFeatureId) {
    const expectedFeatureId = sanitizeFeatureId(payload.expectedFeatureId, '--feature-id');
    if (expectedFeatureId !== discoveredFeatureId) {
      throw new Error(
        `--feature-id ${expectedFeatureId} does not match dossier feature id ${discoveredFeatureId}.`,
      );
    }
  }
  return {
    absPath,
    dossier,
    featureId: discoveredFeatureId,
  };
}

export async function predictNextFeatureId(root: string): Promise<string> {
  const dossiersDir = featureDossiersDirPath(root);
  const files = await listDossierFiles(dossiersDir).catch(() => []);
  let maxNumericId = 0;
  for (const file of files) {
    const featureId = extractFeatureIdFromDossierPath(file);
    const numericId = featureId ? Number(extractFeatureNumericId(featureId)) : NaN;
    if (Number.isFinite(numericId)) {
      maxNumericId = Math.max(maxNumericId, numericId);
    }
  }
  return `F-${String(maxNumericId + 1).padStart(4, '0')}`;
}
