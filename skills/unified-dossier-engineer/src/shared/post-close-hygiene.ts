import { promises as fs } from 'node:fs';
import path from 'node:path';

import { fileExists, readText } from '../vendor/dossier-engineer/lib/fs-utils.ts';
import { sanitizeFeatureId } from './feature-identity.ts';
import { assertManagedReadPath } from './path-guards.ts';
import {
  readStageState,
  type PostCloseBacklogHygieneStatus,
  type StageStateRecord,
} from './stage-state.ts';

export type BacklogTruthTimestamps = {
  last_refresh_at: string | null;
  updated_at: string | null;
};

export type EffectivePostCloseBacklogHygiene = {
  artifact: string | null;
  blockers: string[];
  checked_at: string | null;
  feature_id: string;
  refresh_at: string | null;
  required: boolean;
  status: PostCloseBacklogHygieneStatus;
};

export type PostCloseBacklogHygieneSummary = {
  blocked_count: number;
  blocked_feature_ids: string[];
  missing_count: number;
  missing_feature_ids: string[];
  stale_count: number;
  stale_feature_ids: string[];
};

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function timestampValue(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isBefore(left: string | null, right: string | null): boolean {
  const leftValue = timestampValue(left);
  const rightValue = timestampValue(right);
  return leftValue !== null && rightValue !== null && leftValue < rightValue;
}

export async function readBacklogTruthTimestamps(root: string): Promise<BacklogTruthTimestamps> {
  const statePath = path.join(root, '.dossier', 'backlog', 'state.json');
  if (!(await fileExists(statePath))) {
    return { updated_at: null, last_refresh_at: null };
  }
  await assertManagedReadPath(
    root,
    path.join(root, '.dossier', 'backlog'),
    statePath,
    'backlog state',
  );
  const parsed = JSON.parse(await readText(statePath)) as Record<string, unknown>;
  return {
    updated_at: toNullableString(parsed.updated_at),
    last_refresh_at: toNullableString(parsed.last_refresh_at),
  };
}

export function evaluatePostCloseBacklogHygiene(payload: {
  state: StageStateRecord | null;
  truth: BacklogTruthTimestamps;
}): EffectivePostCloseBacklogHygiene {
  const state = payload.state;
  if (!state || state.stage !== 'implementation' || !state.post_close_backlog_hygiene_required) {
    return {
      artifact: null,
      blockers: [],
      checked_at: null,
      feature_id: state?.feature_id ?? '',
      refresh_at: null,
      required: false,
      status: 'not_required',
    };
  }

  const artifact = state.post_close_backlog_hygiene_artifact;
  const checkedAt = state.post_close_backlog_hygiene_checked_at;
  const refreshAt = state.post_close_backlog_hygiene_refresh_at;
  if (!artifact || !checkedAt || !refreshAt) {
    return {
      artifact,
      blockers: ['Post-close backlog hygiene evidence is missing.'],
      checked_at: checkedAt,
      feature_id: state.feature_id,
      refresh_at: refreshAt,
      required: true,
      status: 'missing',
    };
  }

  const staleBlockers: string[] = [];
  if (isBefore(checkedAt, state.process_complete_ts)) {
    staleBlockers.push('Post-close backlog hygiene evidence predates implementation closure.');
  }
  if (isBefore(checkedAt, payload.truth.updated_at)) {
    staleBlockers.push('Post-close backlog hygiene evidence predates backlog state update.');
  }
  if (isBefore(checkedAt, payload.truth.last_refresh_at)) {
    staleBlockers.push('Post-close backlog hygiene evidence predates backlog refresh.');
  }
  if (timestampValue(checkedAt) === null || timestampValue(refreshAt) === null) {
    staleBlockers.push('Post-close backlog hygiene evidence has invalid timestamps.');
  }
  if (staleBlockers.length > 0) {
    return {
      artifact,
      blockers: staleBlockers,
      checked_at: checkedAt,
      feature_id: state.feature_id,
      refresh_at: refreshAt,
      required: true,
      status: 'stale',
    };
  }

  if (state.post_close_backlog_hygiene_status === 'blocked') {
    return {
      artifact,
      blockers:
        state.post_close_backlog_hygiene_blockers.length > 0
          ? state.post_close_backlog_hygiene_blockers
          : ['Post-close backlog hygiene has unresolved blockers.'],
      checked_at: checkedAt,
      feature_id: state.feature_id,
      refresh_at: refreshAt,
      required: true,
      status: 'blocked',
    };
  }

  if (state.post_close_backlog_hygiene_status === 'stale') {
    return {
      artifact,
      blockers:
        state.post_close_backlog_hygiene_blockers.length > 0
          ? state.post_close_backlog_hygiene_blockers
          : ['Post-close backlog hygiene evidence is stale.'],
      checked_at: checkedAt,
      feature_id: state.feature_id,
      refresh_at: refreshAt,
      required: true,
      status: 'stale',
    };
  }

  if (state.post_close_backlog_hygiene_status === 'missing') {
    return {
      artifact,
      blockers:
        state.post_close_backlog_hygiene_blockers.length > 0
          ? state.post_close_backlog_hygiene_blockers
          : ['Post-close backlog hygiene evidence is missing.'],
      checked_at: checkedAt,
      feature_id: state.feature_id,
      refresh_at: refreshAt,
      required: true,
      status: 'missing',
    };
  }

  return {
    artifact,
    blockers: [],
    checked_at: checkedAt,
    feature_id: state.feature_id,
    refresh_at: refreshAt,
    required: true,
    status: 'clean',
  };
}

export async function collectPostCloseBacklogHygieneSummary(
  root: string,
): Promise<PostCloseBacklogHygieneSummary> {
  const stagesDir = path.join(root, '.dossier', 'stages');
  const summary: PostCloseBacklogHygieneSummary = {
    blocked_count: 0,
    blocked_feature_ids: [],
    missing_count: 0,
    missing_feature_ids: [],
    stale_count: 0,
    stale_feature_ids: [],
  };
  if (!(await fileExists(stagesDir))) {
    return summary;
  }

  const truth = await readBacklogTruthTimestamps(root);
  const entries = await fs.readdir(stagesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    let featureId: string;
    try {
      featureId = sanitizeFeatureId(entry.name, 'feature id');
    } catch {
      continue;
    }
    const state = await readStageState(root, 'implementation', featureId);
    const hygiene = evaluatePostCloseBacklogHygiene({ state, truth });
    if (hygiene.status === 'missing') {
      summary.missing_feature_ids.push(featureId);
    } else if (hygiene.status === 'stale') {
      summary.stale_feature_ids.push(featureId);
    } else if (hygiene.status === 'blocked') {
      summary.blocked_feature_ids.push(featureId);
    }
  }

  summary.missing_feature_ids.sort((left, right) => left.localeCompare(right));
  summary.stale_feature_ids.sort((left, right) => left.localeCompare(right));
  summary.blocked_feature_ids.sort((left, right) => left.localeCompare(right));
  summary.missing_count = summary.missing_feature_ids.length;
  summary.stale_count = summary.stale_feature_ids.length;
  summary.blocked_count = summary.blocked_feature_ids.length;
  return summary;
}

export function postCloseBacklogHygieneWarnings(summary: PostCloseBacklogHygieneSummary): string[] {
  const warnings: string[] = [];
  if (summary.missing_feature_ids.length > 0) {
    warnings.push(
      `Post-close backlog hygiene missing for implementation features: ${summary.missing_feature_ids.join(
        ', ',
      )}`,
    );
  }
  if (summary.stale_feature_ids.length > 0) {
    warnings.push(
      `Post-close backlog hygiene stale for implementation features: ${summary.stale_feature_ids.join(
        ', ',
      )}`,
    );
  }
  if (summary.blocked_feature_ids.length > 0) {
    warnings.push(
      `Post-close backlog hygiene blocked for implementation features: ${summary.blocked_feature_ids.join(
        ', ',
      )}`,
    );
  }
  return warnings;
}
