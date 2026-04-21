import { promises as fs } from 'node:fs';
import path from 'node:path';

import { fileExists, writeJsonAtomic } from '../vendor/dossier-engineer/lib/fs-utils.ts';
import { assertManagedWritePath } from '../shared/path-guards.ts';

export type SourceReviewOutcome =
  | 'pending'
  | 'no_backlog_change'
  | 'patched_existing_items'
  | 'created_new_item'
  | 'source_maintenance';

export type SourceReviewResolutionKind =
  | 'ack'
  | 'patch-item'
  | 'packet'
  | 'update-source-path'
  | 'remove-source';

export interface SourceReviewRecord {
  source_review_id: string;
  source_id: string;
  source_label: string;
  previous_hash: string;
  current_hash: string;
  status: 'open' | 'closed';
  linked_item_keys: string[];
  linked_item_count: number;
  opened_at: string;
  closed_at: string | null;
  resolved_at: string | null;
  outcome: SourceReviewOutcome;
  resolution_kind: SourceReviewResolutionKind | null;
  resolution_ref: string | null;
}

export function sourceReviewDir(root: string): string {
  return path.join(root, '.dossier', 'backlog', 'source-review');
}

function sourceReviewPath(root: string, sourceReviewId: string): string {
  return path.join(sourceReviewDir(root), `${sourceReviewId}.json`);
}

export function createSourceReviewId(sourceId: string): string {
  return `sr-${sourceId}`;
}

export async function loadSourceReviews(root: string): Promise<SourceReviewRecord[]> {
  const dir = sourceReviewDir(root);
  if (!(await fileExists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const reviews: SourceReviewRecord[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }
    const raw = JSON.parse(
      await fs.readFile(path.join(dir, entry.name), 'utf8'),
    ) as SourceReviewRecord;
    reviews.push(raw);
  }
  reviews.sort((left, right) => left.source_review_id.localeCompare(right.source_review_id));
  return reviews;
}

export async function loadOpenSourceReviews(root: string): Promise<SourceReviewRecord[]> {
  return (await loadSourceReviews(root)).filter((review) => review.status === 'open');
}

export async function upsertOpenSourceReview(payload: {
  root: string;
  currentHash: string;
  linkedItemKeys: string[];
  now: string;
  previousHash: string;
  sourceId: string;
  sourceLabel: string;
}): Promise<{ created: boolean; record: SourceReviewRecord; updated: boolean }> {
  const sourceReviewId = createSourceReviewId(payload.sourceId);
  const targetPath = sourceReviewPath(payload.root, sourceReviewId);
  const existing =
    (await fileExists(targetPath))
      ? (JSON.parse(await fs.readFile(targetPath, 'utf8')) as SourceReviewRecord)
      : null;
  const normalizedLinkedItemKeys = [...new Set(payload.linkedItemKeys)].sort((left, right) =>
    left.localeCompare(right),
  );

  const nextRecord: SourceReviewRecord = existing
    ? {
        ...existing,
        source_label: payload.sourceLabel,
        current_hash: payload.currentHash,
        linked_item_keys: normalizedLinkedItemKeys,
        linked_item_count: normalizedLinkedItemKeys.length,
        status: 'open',
        closed_at: null,
        resolved_at: null,
        outcome: 'pending',
        resolution_kind: null,
        resolution_ref: null,
      }
    : {
        source_review_id: sourceReviewId,
        source_id: payload.sourceId,
        source_label: payload.sourceLabel,
        previous_hash: payload.previousHash,
        current_hash: payload.currentHash,
        status: 'open',
        linked_item_keys: normalizedLinkedItemKeys,
        linked_item_count: normalizedLinkedItemKeys.length,
        opened_at: payload.now,
        closed_at: null,
        resolved_at: null,
        outcome: 'pending',
        resolution_kind: null,
        resolution_ref: null,
      };

  await assertManagedWritePath(
    payload.root,
    sourceReviewDir(payload.root),
    targetPath,
    'source-review artifact',
  );
  await writeJsonAtomic(targetPath, nextRecord);
  return {
    record: nextRecord,
    created: existing === null,
    updated:
      existing !== null &&
      JSON.stringify(existing) !== JSON.stringify(nextRecord),
  };
}

export async function resolveSourceReview(payload: {
  root: string;
  sourceReviewId: string;
  outcome: Exclude<SourceReviewOutcome, 'pending'>;
  resolutionKind: SourceReviewResolutionKind;
  resolutionRef: string;
  now: string;
}): Promise<SourceReviewRecord> {
  const targetPath = sourceReviewPath(payload.root, payload.sourceReviewId);
  if (!(await fileExists(targetPath))) {
    throw new Error(`Source review not found: ${payload.sourceReviewId}`);
  }

  const existing = JSON.parse(await fs.readFile(targetPath, 'utf8')) as SourceReviewRecord;
  const nextRecord: SourceReviewRecord = {
    ...existing,
    status: 'closed',
    outcome: payload.outcome,
    resolution_kind: payload.resolutionKind,
    resolution_ref: payload.resolutionRef,
    resolved_at: payload.now,
    closed_at: payload.now,
  };
  await assertManagedWritePath(
    payload.root,
    sourceReviewDir(payload.root),
    targetPath,
    'source-review artifact',
  );
  await writeJsonAtomic(targetPath, nextRecord);
  return nextRecord;
}

export function collectBlockedItemKeys(reviews: readonly SourceReviewRecord[]): Set<string> {
  const blocked = new Set<string>();
  for (const review of reviews) {
    if (review.status !== 'open') {
      continue;
    }
    for (const itemKey of review.linked_item_keys) {
      blocked.add(itemKey);
    }
  }
  return blocked;
}

export function collectSourceReviewIdsByItemKey(
  reviews: readonly SourceReviewRecord[],
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const review of reviews) {
    if (review.status !== 'open') {
      continue;
    }
    for (const itemKey of review.linked_item_keys) {
      const current = result.get(itemKey) ?? [];
      current.push(review.source_review_id);
      current.sort((left, right) => left.localeCompare(right));
      result.set(itemKey, current);
    }
  }
  return result;
}
