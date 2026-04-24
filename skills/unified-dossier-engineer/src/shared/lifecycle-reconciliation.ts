import { promises as fs } from 'node:fs';
import path from 'node:path';

import { resolveManagedReadPath } from './path-guards.ts';
import { featureDossiersDirPath } from './process-root.ts';
import { readStageState, type StageStateStage } from './stage-state.ts';
import {
  readAllDossiers,
  type DossierRecord,
} from '../vendor/dossier-engineer/lib/dossier-utils.ts';
import {
  createSchemaModule,
  type AppliedRegistryFile,
  type PatchFile,
  type StateFile,
  type StateItem,
} from '../vendor/backlog-engineer/schemas/index.ts';

const DELIVERY_STATES = ['defined', 'specified', 'planned', 'implemented'] as const;

export type DeliveryState = (typeof DELIVERY_STATES)[number];

export type BacklogActualizationVerdict =
  | 'actualization_required'
  | 'actualized_by_backlog_artifact'
  | 'blocked_backlog_item_missing'
  | 'current_state_satisfies_target'
  | 'no_lifecycle_target';

export type BacklogLifecycleReconciliation = {
  actualizationArtifacts: string[];
  current: DeliveryState | null;
  itemKey: string | null;
  reconciled: boolean;
  target: DeliveryState | null;
  verdict: BacklogActualizationVerdict;
};

export type LifecycleDrift = {
  backlog_delivery_state: DeliveryState | null;
  backlog_item_key: string | null;
  expected_delivery_state: DeliveryState | null;
  feature_id: string;
  kind:
    | 'done_feature_backlog_state'
    | 'queue_candidate_done_feature'
    | 'step_close_stage_state_missing_linkage';
  message: string;
  step_artifact: string | null;
};

export class BacklogActualizationRequiredError extends Error {
  readonly reconciliation: BacklogLifecycleReconciliation;
  readonly nextCommands: string[];

  constructor(reconciliation: BacklogLifecycleReconciliation) {
    const itemKey = reconciliation.itemKey ?? '<missing>';
    super(
      `Backlog lifecycle actualization is required for ${itemKey}: current=${reconciliation.current ?? 'missing'}, target=${reconciliation.target ?? 'none'}.`,
    );
    this.name = 'BacklogActualizationRequiredError';
    this.reconciliation = reconciliation;
    this.nextCommands = [
      'dossier-engineer patch-item --patch <path>',
      `dossier-engineer items --item-keys ${itemKey}`,
      'dossier-engineer status',
    ];
  }
}

const schema = createSchemaModule();

function normalizeDeliveryState(value: unknown): DeliveryState | null {
  return DELIVERY_STATES.includes(value as DeliveryState) ? (value as DeliveryState) : null;
}

function stateRank(value: DeliveryState): number {
  return DELIVERY_STATES.indexOf(value);
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toRepoRelative(root: string, absPath: string): string {
  return path.relative(root, absPath).split(path.sep).join('/');
}

function canonicalBacklogPathMatches(payload: {
  canonicalPath: string;
  repoRelativePath: string;
}): boolean {
  return (
    payload.canonicalPath === payload.repoRelativePath ||
    path.posix.join('.dossier/backlog', payload.canonicalPath) === payload.repoRelativePath
  );
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}

export function lifecycleTargetForStage(stage: string): DeliveryState | null {
  if (stage === 'spec-compact') {
    return 'specified';
  }
  if (stage === 'plan-slice') {
    return 'planned';
  }
  if (stage === 'implementation') {
    return 'implemented';
  }
  return null;
}

export function deliveryStateSatisfies(
  current: DeliveryState | null,
  target: DeliveryState | null,
): boolean {
  if (!target) {
    return true;
  }
  return current !== null && stateRank(current) >= stateRank(target);
}

export async function readBacklogState(root: string): Promise<StateFile> {
  return schema.parseStateFile(
    await readJsonFile(path.join(root, '.dossier', 'backlog', 'state.json')),
  );
}

async function readAppliedRegistry(root: string): Promise<AppliedRegistryFile> {
  return schema.parseAppliedRegistry(
    await readJsonFile(path.join(root, '.dossier', 'backlog', 'applied.json')),
  );
}

function findBacklogItem(state: StateFile, itemKey: string | null): StateItem | null {
  if (!itemKey) {
    return null;
  }
  return state.items.find((item) => item.item_key === itemKey) ?? null;
}

export function selectedBacklogItemKeyFromDossier(
  dossier: Pick<DossierRecord, 'frontmatter'>,
): string | null {
  return toNullableString(dossier.frontmatter.backlog_item_key);
}

function selectedBacklogItemKeyFromStageState(
  state: Awaited<ReturnType<typeof readStageState>>,
): string | null {
  return state?.primary_backlog_item_key ?? state?.backlog_item_key ?? null;
}

export async function resolveSelectedBacklogItemKey(payload: {
  dossier?: Pick<DossierRecord, 'frontmatter'> | null;
  featureId: string;
  root: string;
  stage: StageStateStage;
}): Promise<string | null> {
  const stageState = await readStageState(payload.root, payload.stage, payload.featureId);
  return (
    selectedBacklogItemKeyFromStageState(stageState) ??
    (payload.dossier ? selectedBacklogItemKeyFromDossier(payload.dossier) : null)
  );
}

async function validateBacklogActualizationArtifacts(payload: {
  artifactPaths: string[];
  itemKey: string | null;
  root: string;
}): Promise<string[]> {
  if (payload.artifactPaths.length === 0) {
    return [];
  }
  if (!payload.itemKey) {
    throw new Error('Backlog actualization artifact validation requires a selected backlog item.');
  }
  const applied = await readAppliedRegistry(payload.root);
  const accepted: string[] = [];
  for (const artifactPath of payload.artifactPaths) {
    const absPath = await resolveManagedReadPath(
      payload.root,
      artifactPath,
      path.join(payload.root, '.dossier', 'backlog', 'patches'),
      'backlog actualization artifact',
    );
    const relPath = toRepoRelative(payload.root, absPath);
    const patch = schema.parsePatchFile(await readJsonFile<PatchFile>(absPath));
    if (!patch.metadata.target_item_keys.includes(payload.itemKey)) {
      throw new Error(
        `Backlog actualization artifact ${relPath} does not target ${payload.itemKey}.`,
      );
    }
    const appliedEntry = applied.patches.find(
      (entry) =>
        entry.kind === 'patch-item' &&
        entry.target_item_keys.includes(payload.itemKey ?? '') &&
        canonicalBacklogPathMatches({
          canonicalPath: entry.canonical_path,
          repoRelativePath: relPath,
        }),
    );
    if (!appliedEntry) {
      throw new Error(
        `Backlog actualization artifact ${relPath} is not recorded as an applied patch-item for ${payload.itemKey}.`,
      );
    }
    accepted.push(relPath);
  }
  return [...new Set(accepted)];
}

export async function evaluateBacklogLifecycleReconciliation(payload: {
  actualizationArtifactPaths?: string[];
  itemKey: string | null;
  root: string;
  stage: string;
}): Promise<BacklogLifecycleReconciliation> {
  const target = lifecycleTargetForStage(payload.stage);
  const actualizationArtifacts = await validateBacklogActualizationArtifacts({
    root: payload.root,
    itemKey: payload.itemKey,
    artifactPaths: payload.actualizationArtifactPaths ?? [],
  });
  if (!target) {
    return {
      actualizationArtifacts,
      current: null,
      itemKey: payload.itemKey,
      reconciled: true,
      target: null,
      verdict: 'no_lifecycle_target',
    };
  }

  const state = await readBacklogState(payload.root);
  const item = findBacklogItem(state, payload.itemKey);
  const current = normalizeDeliveryState(item?.delivery_state);
  if (!item || !current) {
    return {
      actualizationArtifacts,
      current: null,
      itemKey: payload.itemKey,
      reconciled: false,
      target,
      verdict: 'blocked_backlog_item_missing',
    };
  }
  const reconciled = deliveryStateSatisfies(current, target);
  return {
    actualizationArtifacts,
    current,
    itemKey: payload.itemKey,
    reconciled,
    target,
    verdict: reconciled
      ? actualizationArtifacts.length > 0
        ? 'actualized_by_backlog_artifact'
        : 'current_state_satisfies_target'
      : 'actualization_required',
  };
}

export function lifecycleReconciliationMetadata(
  reconciliation: BacklogLifecycleReconciliation,
): Record<string, unknown> {
  return {
    backlog_lifecycle_target: reconciliation.target,
    backlog_lifecycle_current: reconciliation.current,
    backlog_lifecycle_reconciled: reconciliation.reconciled,
    backlog_actualization_artifacts: reconciliation.actualizationArtifacts,
    backlog_actualization_verdict: reconciliation.verdict,
  };
}

function featureIdFromDossier(dossier: DossierRecord): string | null {
  return toNullableString(dossier.frontmatter.id) ?? path.basename(dossier.absPath, '.md');
}

async function collectDoneFeatureBacklogDrifts(payload: {
  state: StateFile;
  root: string;
}): Promise<LifecycleDrift[]> {
  const dossiers = await readAllDossiers(payload.root, featureDossiersDirPath(payload.root)).catch(
    () => [],
  );
  const drifts: LifecycleDrift[] = [];
  for (const dossier of dossiers) {
    if (dossier.frontmatter.status !== 'done') {
      continue;
    }
    const featureId = featureIdFromDossier(dossier);
    const itemKey = selectedBacklogItemKeyFromDossier(dossier);
    if (!featureId || !itemKey) {
      continue;
    }
    const item = findBacklogItem(payload.state, itemKey);
    const current = normalizeDeliveryState(item?.delivery_state);
    if (deliveryStateSatisfies(current, 'implemented')) {
      continue;
    }
    drifts.push({
      kind: 'done_feature_backlog_state',
      feature_id: featureId,
      backlog_item_key: itemKey,
      backlog_delivery_state: current,
      expected_delivery_state: 'implemented',
      step_artifact: null,
      message: `Feature ${featureId} is done while selected backlog item ${itemKey} is ${current ?? 'missing'}, expected implemented.`,
    });
  }
  return drifts;
}

async function collectStepCloseLinkageDrifts(root: string): Promise<LifecycleDrift[]> {
  const stepsDir = path.join(root, '.dossier', 'steps');
  const featureDirs = await fs.readdir(stepsDir, { withFileTypes: true }).catch(() => []);
  const drifts: LifecycleDrift[] = [];
  for (const featureDir of featureDirs) {
    if (!featureDir.isDirectory()) {
      continue;
    }
    const featureId = featureDir.name;
    const artifactPath = path.join(stepsDir, featureId, 'implementation.json');
    const raw = await readJsonFile<Record<string, unknown>>(artifactPath).catch(() => null);
    if (!raw || raw.process_complete !== true) {
      continue;
    }
    const state = await readStageState(root, 'implementation', featureId);
    if (state?.step_artifact && state.step_close_ts && state.process_complete_ts) {
      continue;
    }
    drifts.push({
      kind: 'step_close_stage_state_missing_linkage',
      feature_id: featureId,
      backlog_item_key: state?.primary_backlog_item_key ?? state?.backlog_item_key ?? null,
      backlog_delivery_state: null,
      expected_delivery_state: 'implemented',
      step_artifact: toRepoRelative(root, artifactPath),
      message: `Implementation step artifact for ${featureId} is process_complete but helper-managed stage state is missing close linkage.`,
    });
  }
  return drifts;
}

export async function collectLifecycleReconciliationDrifts(payload: {
  root: string;
  state?: StateFile;
}): Promise<LifecycleDrift[]> {
  const state = payload.state ?? (await readBacklogState(payload.root));
  const drifts = [
    ...(await collectDoneFeatureBacklogDrifts({ root: payload.root, state })),
    ...(await collectStepCloseLinkageDrifts(payload.root)),
  ];
  const seen = new Set<string>();
  return drifts.filter((drift) => {
    const key = `${drift.kind}:${drift.feature_id}:${drift.backlog_item_key ?? ''}:${drift.step_artifact ?? ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function lifecycleDriftBlockedItemKeys(drifts: readonly LifecycleDrift[]): Set<string> {
  return new Set(
    drifts
      .filter((drift) => drift.kind === 'done_feature_backlog_state')
      .map((drift) => drift.backlog_item_key)
      .filter((itemKey): itemKey is string => itemKey !== null),
  );
}
