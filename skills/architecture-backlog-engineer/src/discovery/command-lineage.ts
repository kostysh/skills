import crypto from 'node:crypto';

import {
  asArray,
  asStringRecord,
  isNonEmptyString,
  loadNdjson,
  type AssessmentFile,
  type BacklogFile,
} from './common.js';

export type RenderReason = 'mutating_command' | 'recovery_render';

export interface StaleSnapshot {
  claims: string[];
  items: string[];
  proofs: string[];
  reviews: string[];
}

export interface NewStaleSnapshot extends StaleSnapshot {
  reason: string | null;
  status: 'known' | 'unknown';
}

export interface BaselineProjectionItem {
  item_id: string;
  title: string | null;
  delivery_state: string | null;
  readiness_state: string | null;
  closure_state: string | null;
  summary_label: string | null;
  track_id: string | null;
  dependency_item_ids: string[];
}

export interface BaselineProjectionRelation {
  relation_type: string;
  from: {
    id: string;
    kind: string;
  };
  to: {
    id: string;
    kind: string;
  };
}

export interface BaselineProjectionClaimCommitment {
  claim_id: string;
  commitment: string | null;
  revisit_trigger: string | null;
}

export interface BaselineProjectionRoadmapRow {
  row_id: string;
  item_id: string;
  track_id: string | null;
  topology_rank: number | null;
  safety_rank: number | null;
  economic_rank: number | null;
}

export interface BaselineProjection {
  claim_commitments: BaselineProjectionClaimCommitment[];
  items: BaselineProjectionItem[];
  relations: BaselineProjectionRelation[];
  roadmap_rows: BaselineProjectionRoadmapRow[];
}

export const FIRST_STALE_SNAPSHOT_REASON =
  'first recorded snapshot; no previous stale snapshot to diff';

function sortDedupStrings(values: string[]): string[] {
  return [...new Set(values.filter(isNonEmptyString))].sort();
}

function sortByJsonHash<T>(entries: T[]): T[] {
  return [...entries].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? sortDedupStrings(value.filter((entry): entry is string => typeof entry === 'string'))
    : [];
}

function normalizeNullableString(value: unknown): string | null {
  return isNonEmptyString(value) ? value : null;
}

export function createCommandRunId(): string {
  return crypto.randomUUID();
}

export function buildStaleSnapshot(assessment: AssessmentFile): StaleSnapshot {
  return {
    claims: sortDedupStrings(asArray(assessment.stale_claims)),
    items: sortDedupStrings(asArray(assessment.stale_items)),
    proofs: sortDedupStrings(asArray(assessment.stale_proofs)),
    reviews: sortDedupStrings(asArray(assessment.stale_review_artifacts)),
  };
}

export function normalizeStaleSnapshot(value: unknown): StaleSnapshot | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    claims: normalizeStringArray(record.claims),
    items: normalizeStringArray(record.items),
    proofs: normalizeStringArray(record.proofs),
    reviews: normalizeStringArray(record.reviews),
  };
}

export function normalizeNewStaleSnapshot(value: unknown): NewStaleSnapshot | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const status = record.status;
  if (status !== 'known' && status !== 'unknown') {
    return null;
  }

  return {
    status,
    reason: normalizeNullableString(record.reason),
    claims: normalizeStringArray(record.claims),
    items: normalizeStringArray(record.items),
    proofs: normalizeStringArray(record.proofs),
    reviews: normalizeStringArray(record.reviews),
  };
}

export function readPreviousMutatingStaleSnapshot(journalPath: string): StaleSnapshot | null {
  const journal = loadNdjson<Record<string, unknown>>(journalPath);
  const previousRenderedEvent = [...journal]
    .reverse()
    .find(
      (entry) =>
        entry.event === 'report_rendered' &&
        entry.render_reason === 'mutating_command' &&
        entry.stale_snapshot !== undefined,
    );

  return previousRenderedEvent
    ? normalizeStaleSnapshot(previousRenderedEvent.stale_snapshot)
    : null;
}

export function buildNewStaleSnapshot(
  previousSnapshot: StaleSnapshot | null,
  currentSnapshot: StaleSnapshot,
): NewStaleSnapshot {
  if (previousSnapshot === null) {
    return {
      status: 'unknown',
      reason: FIRST_STALE_SNAPSHOT_REASON,
      claims: [],
      items: [],
      proofs: [],
      reviews: [],
    };
  }

  return {
    status: 'known',
    reason: null,
    claims: currentSnapshot.claims.filter((claimId) => !previousSnapshot.claims.includes(claimId)),
    items: currentSnapshot.items.filter((itemId) => !previousSnapshot.items.includes(itemId)),
    proofs: currentSnapshot.proofs.filter((proofId) => !previousSnapshot.proofs.includes(proofId)),
    reviews: currentSnapshot.reviews.filter(
      (reviewId) => !previousSnapshot.reviews.includes(reviewId),
    ),
  };
}

export function readLatestMutatingNewStaleSnapshot(journalPath: string): NewStaleSnapshot {
  const journal = loadNdjson<Record<string, unknown>>(journalPath);
  const latestMutatingRenderEvent = [...journal]
    .reverse()
    .find(
      (entry) =>
        entry.event === 'report_rendered' &&
        entry.render_reason === 'mutating_command' &&
        entry.new_stale_snapshot !== undefined,
    );

  return (
    normalizeNewStaleSnapshot(latestMutatingRenderEvent?.new_stale_snapshot) ?? {
      status: 'unknown',
      reason: FIRST_STALE_SNAPSHOT_REASON,
      claims: [],
      items: [],
      proofs: [],
      reviews: [],
    }
  );
}

function normalizeBaselineProjectionItem(value: unknown): BaselineProjectionItem | null {
  const record = asStringRecord(value);
  if (!isNonEmptyString(record.item_id)) {
    return null;
  }

  return {
    item_id: record.item_id,
    title: normalizeNullableString(record.title),
    delivery_state: normalizeNullableString(record.delivery_state),
    readiness_state: normalizeNullableString(record.readiness_state),
    closure_state: normalizeNullableString(record.closure_state),
    summary_label: normalizeNullableString(record.summary_label),
    track_id: normalizeNullableString(record.track_id),
    dependency_item_ids: normalizeStringArray(record.dependency_item_ids),
  };
}

function normalizeBaselineProjectionRelation(value: unknown): BaselineProjectionRelation | null {
  const record = asStringRecord(value);
  const from = asStringRecord(record.from);
  const to = asStringRecord(record.to);
  if (
    !isNonEmptyString(record.relation_type) ||
    !isNonEmptyString(from.kind) ||
    !isNonEmptyString(from.id) ||
    !isNonEmptyString(to.kind) ||
    !isNonEmptyString(to.id)
  ) {
    return null;
  }

  return {
    relation_type: record.relation_type,
    from: {
      kind: from.kind,
      id: from.id,
    },
    to: {
      kind: to.kind,
      id: to.id,
    },
  };
}

function normalizeBaselineProjectionClaimCommitment(
  value: unknown,
): BaselineProjectionClaimCommitment | null {
  const record = asStringRecord(value);
  if (!isNonEmptyString(record.claim_id)) {
    return null;
  }

  return {
    claim_id: record.claim_id,
    commitment: normalizeNullableString(record.commitment),
    revisit_trigger: normalizeNullableString(record.revisit_trigger),
  };
}

function normalizeBaselineProjectionRoadmapRow(
  value: unknown,
): BaselineProjectionRoadmapRow | null {
  const record = asStringRecord(value);
  if (!isNonEmptyString(record.row_id) || !isNonEmptyString(record.item_id)) {
    return null;
  }

  const toNullableInteger = (entry: unknown): number | null =>
    Number.isInteger(entry) ? Number(entry) : null;

  return {
    row_id: record.row_id,
    item_id: record.item_id,
    track_id: normalizeNullableString(record.track_id),
    topology_rank: toNullableInteger(record.topology_rank),
    safety_rank: toNullableInteger(record.safety_rank),
    economic_rank: toNullableInteger(record.economic_rank),
  };
}

export function normalizeBaselineProjection(value: unknown): BaselineProjection | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    claim_commitments: sortByJsonHash(
      (Array.isArray(record.claim_commitments) ? record.claim_commitments : [])
        .map((entry) => normalizeBaselineProjectionClaimCommitment(entry))
        .filter((entry): entry is BaselineProjectionClaimCommitment => entry !== null),
    ),
    items: sortByJsonHash(
      (Array.isArray(record.items) ? record.items : [])
        .map((entry) => normalizeBaselineProjectionItem(entry))
        .filter((entry): entry is BaselineProjectionItem => entry !== null),
    ),
    relations: sortByJsonHash(
      (Array.isArray(record.relations) ? record.relations : [])
        .map((entry) => normalizeBaselineProjectionRelation(entry))
        .filter((entry): entry is BaselineProjectionRelation => entry !== null),
    ),
    roadmap_rows: sortByJsonHash(
      (Array.isArray(record.roadmap_rows) ? record.roadmap_rows : [])
        .map((entry) => normalizeBaselineProjectionRoadmapRow(entry))
        .filter((entry): entry is BaselineProjectionRoadmapRow => entry !== null),
    ),
  };
}

export function readLatestBaselineProjection(journalPath: string): BaselineProjection | null {
  const journal = loadNdjson<Record<string, unknown>>(journalPath);
  const latestRebaselineEvent = [...journal]
    .reverse()
    .find(
      (entry) => entry.event === 'rebaseline_completed' && entry.baseline_projection !== undefined,
    );

  return latestRebaselineEvent
    ? normalizeBaselineProjection(latestRebaselineEvent.baseline_projection)
    : null;
}

export function buildBaselineProjection(backlog: BacklogFile): BaselineProjection {
  const items = sortByJsonHash(
    backlog.items
      .filter(
        (
          item,
        ): item is BacklogFile['items'][number] & {
          item_id: string;
        } => isNonEmptyString(item.item_id),
      )
      .map((item) => ({
        item_id: item.item_id,
        title: normalizeNullableString(item.title),
        delivery_state: normalizeNullableString(item.delivery_state),
        readiness_state: normalizeNullableString(item.readiness_state),
        closure_state: normalizeNullableString(item.closure_state),
        summary_label: normalizeNullableString(item.summary_label),
        track_id: normalizeNullableString(item.track_id),
        dependency_item_ids: sortDedupStrings(asArray(item.dependency_refs)),
      })),
  );

  const relations = sortByJsonHash(
    backlog.relations
      .filter(
        (
          relation,
        ): relation is BacklogFile['relations'][number] & {
          relation_type: string;
          from: { id: string; kind: string };
          to: { id: string; kind: string };
        } =>
          isNonEmptyString(relation.relation_type) &&
          isNonEmptyString(relation.from?.kind) &&
          isNonEmptyString(relation.from?.id) &&
          isNonEmptyString(relation.to?.kind) &&
          isNonEmptyString(relation.to?.id),
      )
      .map((relation) => ({
        relation_type: relation.relation_type,
        from: {
          kind: relation.from.kind,
          id: relation.from.id,
        },
        to: {
          kind: relation.to.kind,
          id: relation.to.id,
        },
      })),
  );

  const claimCommitments = sortByJsonHash(
    backlog.claims
      .filter(
        (
          claim,
        ): claim is BacklogFile['claims'][number] & {
          claim_id: string;
        } => isNonEmptyString(claim.claim_id),
      )
      .map((claim) => ({
        claim_id: claim.claim_id,
        commitment: normalizeNullableString(claim.commitment),
        revisit_trigger: normalizeNullableString(claim.revisit_trigger),
      })),
  );

  const roadmapRows = sortByJsonHash(
    backlog.roadmap_matrix
      .filter(
        (
          row,
        ): row is BacklogFile['roadmap_matrix'][number] & {
          row_id: string;
          item_ref: { id: string };
        } => isNonEmptyString(row.row_id) && isNonEmptyString(row.item_ref?.id),
      )
      .map((row) => ({
        row_id: row.row_id,
        item_id: row.item_ref.id,
        track_id: normalizeNullableString(row.track_ref?.id),
        topology_rank: Number.isInteger(row.topology_rank) ? Number(row.topology_rank) : null,
        safety_rank: Number.isInteger(row.safety_rank) ? Number(row.safety_rank) : null,
        economic_rank: Number.isInteger(row.economic_rank) ? Number(row.economic_rank) : null,
      })),
  );

  return {
    claim_commitments: claimCommitments,
    items,
    relations,
    roadmap_rows: roadmapRows,
  };
}
