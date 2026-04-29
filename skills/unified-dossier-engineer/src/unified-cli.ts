import {
  executeCommand as executeDossierCommand,
  findCommand as findDossierCommand,
  type CliIo as DossierCliIo,
} from './vendor/dossier-engineer/commands.ts';
import { spawnSync } from 'node:child_process';

import { BACKLOG_COMMANDS, type CliIo } from './backlog/commands.ts';
import {
  appendFeatureIntakeLog,
  parseStageAnnotationsInput,
  parseStageProvenanceInput,
  recordVerificationArtifactOnStageLog,
  recordPostCloseBacklogHygieneOnStageLog,
  recordReviewArtifactOnStageLog,
  recordStepCloseOnStageLog,
  resolveLatestFeatureCycleId,
  resolveStageLogContext,
  runStageControllerCommand,
  type StageControllerCommand,
} from './delivery/stage-control.ts';
import { acquireDeliveryMutationLock, acquireGlobalOperationLock } from './shared/delivery-lock.ts';
import {
  resolveManagedDossierIdentity,
  resolveManagedDossierIdentityByFeatureId,
  sanitizeFeatureId,
} from './shared/feature-identity.ts';
import {
  BacklogActualizationRequiredError,
  evaluateBacklogLifecycleReconciliation,
  lifecycleReconciliationMetadata,
  resolveSelectedBacklogItemKey,
} from './shared/lifecycle-reconciliation.ts';
import { resolveProcessRoot } from './shared/process-root.ts';
import { assertManagedWritePath, resolveManagedReadPath } from './shared/path-guards.ts';
import { readStageState, type StageStateStage } from './shared/stage-state.ts';
import { writeCliEnvelope } from './shared/cli-envelope.ts';
import { readBacklogTruthTimestamps } from './shared/post-close-hygiene.ts';
import { writeJsonAtomic } from './vendor/dossier-engineer/lib/fs-utils.ts';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export type { CliIo };

type UnifiedCommand = {
  aliases?: string[];
  commandType: 'backlog' | 'dossier' | 'stage';
  execute: (args: string[], io: CliIo) => Promise<number>;
  family:
    | 'bootstrap'
    | 'backlog-authoring'
    | 'backlog-read'
    | 'backlog-source'
    | 'delivery-helper'
    | 'delivery-stage';
  helpLines?: () => string[];
  name: string;
  summary: string;
  usage: string[];
};

export type RunUnifiedCliOptions = {
  version: string;
};

const ALLOWED_DOSSIER_STEPS = new Set([
  'feature-intake',
  'spec-compact',
  'plan-slice',
  'implementation',
  'change-proposal',
]);

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function currentGitHead(root: string): string | null {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

function takeOption(argv: string[], name: string, fallback: string | null = null): string | null {
  const exact = argv.indexOf(name);
  if (exact !== -1) {
    const value = argv[exact + 1];
    if (!value || value.startsWith('--')) {
      return fallback;
    }
    return value;
  }
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function takeManyOptions(argv: string[], name: string): string[] {
  const values: string[] = [];
  const prefix = `${name}=`;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === name) {
      const value = argv[index + 1];
      if (value && !value.startsWith('--')) {
        values.push(value);
      }
      continue;
    }
    if (arg?.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
    }
  }
  return values;
}

function replaceCliNames(value: string): string {
  return value
    .replaceAll('backlog-engineer', 'dossier-engineer')
    .replaceAll('node scripts/dossier.mjs', 'dossier-engineer');
}

function ensureAllowedStep(step: string, optionName: string): string {
  if (!ALLOWED_DOSSIER_STEPS.has(step)) {
    throw new Error(
      `${optionName} must be one of: ${[...ALLOWED_DOSSIER_STEPS].sort().join(', ')}.`,
    );
  }
  return step;
}

async function captureDossierCommandOutput(
  commandName: string,
  args: string[],
  command: NonNullable<ReturnType<typeof findDossierCommand>>,
): Promise<{ exitCode: number; stderr: string; stdout: string }> {
  const stderrBuffer: string[] = [];
  const stdoutBuffer: string[] = [];
  const captureIo: CliIo = {
    stdout: {
      write(chunk) {
        stdoutBuffer.push(String(chunk));
        return true;
      },
    },
    stderr: {
      write(chunk) {
        stderrBuffer.push(String(chunk));
        return true;
      },
    },
  };
  const exitCode = await executeDossierCommand(
    command,
    args,
    captureIo as DossierCliIo,
    commandName,
  );
  return {
    exitCode,
    stderr: stderrBuffer.join(''),
    stdout: stdoutBuffer.join(''),
  };
}

async function withWorkingDirectory<T>(root: string, run: () => Promise<T>): Promise<T> {
  const previous = process.cwd();
  process.chdir(root);
  try {
    return await run();
  } finally {
    process.chdir(previous);
  }
}

function findBacklogCommand(name: string): (typeof BACKLOG_COMMANDS)[number] {
  const command = BACKLOG_COMMANDS.find(
    (entry) => entry.name === name || entry.aliases?.includes(name),
  );
  if (!command) {
    throw new Error(`Missing backlog command: ${name}`);
  }
  return command;
}

async function captureBacklogCommandOutput(
  commandName: string,
  args: string[],
  root: string,
): Promise<{ exitCode: number; stderr: string; stdout: string }> {
  const command = findBacklogCommand(commandName);
  const stderrBuffer: string[] = [];
  const stdoutBuffer: string[] = [];
  const captureIo: CliIo = {
    stdout: {
      write(chunk) {
        stdoutBuffer.push(String(chunk));
        return true;
      },
    },
    stderr: {
      write(chunk) {
        stderrBuffer.push(String(chunk));
        return true;
      },
    },
  };
  const exitCode = await withWorkingDirectory(root, async () => command.execute(args, captureIo));
  return {
    exitCode,
    stderr: stderrBuffer.join(''),
    stdout: stdoutBuffer.join(''),
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function writeStageLinkageError(
  io: CliIo,
  payload: {
    artifactPath?: string | null;
    command: string;
    featureId: string;
    message: string;
    step: string;
  },
): number {
  io.stderr.write(
    `${JSON.stringify({
      error: {
        artifact_path: payload.artifactPath ?? null,
        code: 'UDE_STAGE_LINKAGE_FAILED',
        command: payload.command,
        feature_id: payload.featureId,
        message: payload.message,
        step: payload.step,
      },
    })}\n`,
  );
  return 1;
}

async function withDeliveryLock<T>(payload: {
  command: string;
  featureCycleId: string;
  featureId: string;
  root: string;
  run: () => Promise<T>;
}): Promise<T> {
  const releaseLock = await acquireDeliveryMutationLock({
    root: payload.root,
    featureId: payload.featureId,
    featureCycleId: payload.featureCycleId,
    command: payload.command,
  });
  try {
    return await payload.run();
  } finally {
    await releaseLock();
  }
}

function parseCapturedEnvelope<T>(payload: {
  commandName: string;
  stderr: string;
  stdout: string;
}): {
  data: T;
  warnings: string[];
} {
  if (!payload.stdout.trim()) {
    throw new Error(
      `${payload.commandName} did not return JSON output${
        payload.stderr.trim() ? ` (${payload.stderr.trim()})` : ''
      }.`,
    );
  }
  const parsed = JSON.parse(payload.stdout) as {
    data?: T;
    warnings?: unknown;
  };
  return {
    data: parsed.data as T,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((warning): warning is string => typeof warning === 'string')
      : [],
  };
}

function numericField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function uniqueStrings(values: Iterable<string | null | undefined>): string[] {
  return [
    ...new Set(
      [...values].map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean),
    ),
  ];
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

type PostCloseHygieneRunContext = {
  absGlobalRefreshArtifactPath: string;
  affectedFeatureIds: string[];
  checkedAt: string;
  featureId: string;
  globalRefreshArtifactPath: string;
  retryCommand: string;
  runId: string;
};

type PostCloseHygieneRunSummaries = {
  globalRefreshRanAt: string | null;
  perFeatureResults: Array<Record<string, unknown>>;
  postStatusSummary: Record<string, unknown> | null;
  preStatusSummary: Record<string, unknown> | null;
  refreshSummary: Record<string, unknown> | null;
};

function postCloseHygieneRetryCommand(featureId: string): string {
  return `dossier-engineer post-close-hygiene --feature-id ${featureId} --step implementation --json`;
}

function postCloseHygieneEvidenceTimestamp(
  ...truthTimestamps: Array<string | null | undefined>
): string {
  const now = Date.now();
  const latestTruthTimestamp = truthTimestamps.reduce((latest, timestamp) => {
    const parsed = typeof timestamp === 'string' ? Date.parse(timestamp) : Number.NaN;
    return Number.isFinite(parsed) ? Math.max(latest, parsed) : latest;
  }, 0);
  return new Date(latestTruthTimestamp > now ? latestTruthTimestamp + 1 : now).toISOString();
}

async function writePostCloseHygieneGlobalArtifact(payload: {
  context: PostCloseHygieneRunContext;
  durabilityStatus: 'final' | 'initialized';
  errorMessage?: string | null;
  failedFeatureIds: string[];
  result: 'complete' | 'failed' | 'partial';
  summaries: PostCloseHygieneRunSummaries;
}): Promise<void> {
  await writeJsonAtomic(payload.context.absGlobalRefreshArtifactPath, {
    version: 2,
    schema_version: 2,
    run_id: payload.context.runId,
    created_at: payload.context.checkedAt,
    updated_at: new Date().toISOString(),
    step: 'implementation',
    command: 'post-close-hygiene',
    result: payload.result,
    durability_status: payload.durabilityStatus,
    global_refresh_ran_at: payload.summaries.globalRefreshRanAt,
    pre_status_summary: payload.summaries.preStatusSummary,
    refresh_summary: payload.summaries.refreshSummary,
    post_status_summary: payload.summaries.postStatusSummary,
    affected_feature_ids: payload.context.affectedFeatureIds,
    failed_feature_ids: payload.failedFeatureIds,
    per_feature_results: payload.summaries.perFeatureResults,
    retry_command: payload.result === 'complete' ? null : payload.context.retryCommand,
    ...(payload.errorMessage ? { error: payload.errorMessage } : {}),
  });
}

async function listPostCloseHygieneFeatureIds(
  root: string,
  selectedFeatureId: string,
): Promise<string[]> {
  const stagesDir = path.join(root, '.dossier', 'stages');
  const featureIds = new Set([sanitizeFeatureId(selectedFeatureId, 'feature id')]);
  if (!(await pathExists(stagesDir))) {
    return [...featureIds].sort((left, right) => left.localeCompare(right));
  }
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
    if (
      state?.process_complete_ts &&
      state.step_artifact &&
      state.post_close_backlog_hygiene_required
    ) {
      featureIds.add(featureId);
    }
  }
  return [...featureIds].sort((left, right) => left.localeCompare(right));
}

async function acquireFeatureLocksForHygiene(payload: {
  featureIds: string[];
  root: string;
}): Promise<() => Promise<void>> {
  const releases: Array<() => Promise<void>> = [];
  try {
    for (const featureId of payload.featureIds) {
      const state = await readStageState(payload.root, 'implementation', featureId);
      releases.push(
        await acquireDeliveryMutationLock({
          root: payload.root,
          featureId,
          featureCycleId: state?.feature_cycle_id || 'post-close-hygiene',
          command: 'post-close-hygiene',
        }),
      );
    }
  } catch (error) {
    for (const release of releases.reverse()) {
      await release().catch(() => undefined);
    }
    throw error;
  }
  return async () => {
    for (const release of releases.reverse()) {
      await release();
    }
  };
}

function createPostCloseHygieneCommand(): UnifiedCommand {
  const helpLines = [
    'Run explicit post-close backlog hygiene evidence after implementation closure.',
    '',
    'Usage:',
    '  dossier-engineer post-close-hygiene --dossier <path> --step implementation [--root <path>] [--json]',
    '  dossier-engineer post-close-hygiene --feature-id <id> --step implementation [--root <path>] [--json]',
    '',
    'Rules:',
    '  - runs refresh explicitly, then captures status, attention, and queue evidence',
    '  - writes .dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json',
    '  - updates helper-managed implementation stage state with clean or blocked hygiene status',
    '  - never auto-acks source-review records and never patches backlog truth except refresh',
  ];
  return {
    name: 'post-close-hygiene',
    family: 'delivery-helper',
    commandType: 'dossier',
    summary: 'Run explicit refresh/status/attention/queue evidence after implementation close.',
    usage: [
      'dossier-engineer post-close-hygiene --dossier <path> --step implementation [--json]',
      'dossier-engineer post-close-hygiene --feature-id <id> --step implementation [--json]',
    ],
    helpLines: () => helpLines,
    async execute(args, io) {
      let hygieneContext: PostCloseHygieneRunContext | null = null;
      const hygieneSummaries: PostCloseHygieneRunSummaries = {
        globalRefreshRanAt: null,
        perFeatureResults: [],
        postStatusSummary: null,
        preStatusSummary: null,
        refreshSummary: null,
      };
      try {
        const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
        const step = takeOption(args, '--step') ?? 'implementation';
        if (step !== 'implementation') {
          throw new Error('--step must be implementation for post-close-hygiene.');
        }
        const dossierPath = takeOption(args, '--dossier');
        const featureIdInput = takeOption(args, '--feature-id');
        if ((dossierPath && featureIdInput) || (!dossierPath && !featureIdInput)) {
          throw new Error('Exactly one of --dossier or --feature-id is required.');
        }
        const identity = dossierPath
          ? await resolveManagedDossierIdentity({ root, dossierPath })
          : await resolveManagedDossierIdentityByFeatureId({
              root,
              featureId: featureIdInput ?? '',
            });
        const featureId = identity.featureId;
        const stageState = await readStageState(root, 'implementation', featureId);
        if (!stageState) {
          throw new Error(`No helper-managed implementation stage state found for ${featureId}.`);
        }
        if (!stageState.process_complete_ts || !stageState.step_artifact) {
          throw new Error(`Implementation stage for ${featureId} is not process-complete.`);
        }

        const releaseGlobalLock = await acquireGlobalOperationLock({
          root,
          command: 'post-close-hygiene',
        });
        try {
          const checkedAt = new Date().toISOString();
          const runId = `post-close-hygiene-${checkedAt.replaceAll(/[:.]/gu, '-')}`;
          const retryCommand = postCloseHygieneRetryCommand(featureId);
          const globalRefreshArtifactPath = path
            .join('.dossier', 'verification', 'post-close-hygiene', `global-refresh-${runId}.json`)
            .split(path.sep)
            .join('/');
          const absGlobalRefreshArtifactPath = path.join(root, globalRefreshArtifactPath);
          hygieneContext = {
            absGlobalRefreshArtifactPath,
            affectedFeatureIds: [featureId],
            checkedAt,
            featureId,
            globalRefreshArtifactPath,
            retryCommand,
            runId,
          };
          await assertManagedWritePath(
            root,
            path.join(root, '.dossier', 'verification', 'post-close-hygiene'),
            absGlobalRefreshArtifactPath,
            'post-close backlog hygiene global refresh artifact',
          );
          await writePostCloseHygieneGlobalArtifact({
            context: hygieneContext,
            durabilityStatus: 'initialized',
            failedFeatureIds: [featureId],
            result: 'failed',
            summaries: hygieneSummaries,
          });

          const preStatusResult = await captureBacklogCommandOutput('status', [], root);
          if (preStatusResult.exitCode !== 0) {
            throw new Error(preStatusResult.stderr.trim() || 'pre-refresh status failed.');
          }
          const preStatusEnvelope = parseCapturedEnvelope<Record<string, unknown>>({
            commandName: 'status',
            stdout: preStatusResult.stdout,
            stderr: preStatusResult.stderr,
          });
          hygieneSummaries.preStatusSummary = preStatusEnvelope.data;
          const refreshResult = await captureBacklogCommandOutput('refresh', [], root);
          if (refreshResult.exitCode !== 0) {
            throw new Error(refreshResult.stderr.trim() || 'refresh failed.');
          }
          const refreshEnvelope = parseCapturedEnvelope<Record<string, unknown>>({
            commandName: 'refresh',
            stdout: refreshResult.stdout,
            stderr: refreshResult.stderr,
          });
          hygieneSummaries.refreshSummary = refreshEnvelope.data;
          const truth = await readBacklogTruthTimestamps(root);
          hygieneSummaries.globalRefreshRanAt = truth.last_refresh_at ?? checkedAt;
          const statusResult = await captureBacklogCommandOutput('status', [], root);
          if (statusResult.exitCode !== 0) {
            throw new Error(statusResult.stderr.trim() || 'status failed.');
          }
          const statusEnvelope = parseCapturedEnvelope<Record<string, unknown>>({
            commandName: 'status',
            stdout: statusResult.stdout,
            stderr: statusResult.stderr,
          });
          hygieneSummaries.postStatusSummary = statusEnvelope.data;
          const attentionResult = await captureBacklogCommandOutput('attention', [], root);
          if (attentionResult.exitCode !== 0) {
            throw new Error(attentionResult.stderr.trim() || 'attention failed.');
          }
          const attentionEnvelope = parseCapturedEnvelope<unknown[]>({
            commandName: 'attention',
            stdout: attentionResult.stdout,
            stderr: attentionResult.stderr,
          });
          const queueResult = await captureBacklogCommandOutput('queue', [], root);
          if (queueResult.exitCode !== 0) {
            throw new Error(queueResult.stderr.trim() || 'queue failed.');
          }
          const queueEnvelope = parseCapturedEnvelope<unknown[]>({
            commandName: 'queue',
            stdout: queueResult.stdout,
            stderr: queueResult.stderr,
          });
          const finalCheckedAt = postCloseHygieneEvidenceTimestamp(
            truth.updated_at,
            truth.last_refresh_at,
          );
          hygieneContext.checkedAt = finalCheckedAt;
          const evidenceCheckedAt = hygieneContext.checkedAt;

          const openSourceReviewCount = numericField(
            statusEnvelope.data,
            'open_source_review_count',
          );
          const sourceReviewBlockedItemCount = numericField(
            statusEnvelope.data,
            'source_review_blocked_item_count',
          );
          const lifecycleReconciliationDriftCount = numericField(
            statusEnvelope.data,
            'lifecycle_reconciliation_drift_count',
          );
          const unresolvedAttentionPresent = attentionEnvelope.data.length > 0;
          const blockers = [
            ...(openSourceReviewCount > 0
              ? [`Open source reviews remain after refresh: ${openSourceReviewCount}.`]
              : []),
            ...(sourceReviewBlockedItemCount > 0
              ? [`Source-review blocked backlog items remain: ${sourceReviewBlockedItemCount}.`]
              : []),
            ...(lifecycleReconciliationDriftCount > 0
              ? [`Lifecycle reconciliation drift remains: ${lifecycleReconciliationDriftCount}.`]
              : []),
          ];
          const hygieneStatus = blockers.length > 0 ? 'blocked' : 'clean';
          const affectedFeatureIds = uniqueStrings([
            ...(await listPostCloseHygieneFeatureIds(root, featureId)),
            ...stringArrayField(statusEnvelope.data, 'post_close_hygiene_missing_feature_ids'),
            ...stringArrayField(statusEnvelope.data, 'post_close_hygiene_stale_feature_ids'),
            ...stringArrayField(statusEnvelope.data, 'post_close_hygiene_blocked_feature_ids'),
          ]).sort((left, right) => left.localeCompare(right));
          hygieneContext.affectedFeatureIds = affectedFeatureIds;

          const releaseFeatureLocks = await acquireFeatureLocksForHygiene({
            root,
            featureIds: affectedFeatureIds,
          });
          const perFeatureResults: Array<Record<string, unknown>> = [];
          try {
            for (const affectedFeatureId of affectedFeatureIds) {
              try {
                const affectedIdentity = await resolveManagedDossierIdentityByFeatureId({
                  root,
                  featureId: affectedFeatureId,
                });
                const affectedState = await readStageState(
                  root,
                  'implementation',
                  affectedFeatureId,
                );
                if (!affectedState?.process_complete_ts || !affectedState.step_artifact) {
                  throw new Error(
                    `Implementation stage for ${affectedFeatureId} is not process-complete.`,
                  );
                }
                const artifactPath = path
                  .join(
                    '.dossier',
                    'verification',
                    affectedFeatureId,
                    'implementation-post-close-backlog-hygiene.json',
                  )
                  .split(path.sep)
                  .join('/');
                const absArtifactPath = path.join(root, artifactPath);
                await assertManagedWritePath(
                  root,
                  path.join(root, '.dossier', 'verification', affectedFeatureId),
                  absArtifactPath,
                  'post-close backlog hygiene artifact',
                );
                const artifact = {
                  version: 2,
                  schema_version: 2,
                  created_at: evidenceCheckedAt,
                  feature_id: affectedFeatureId,
                  step: 'implementation',
                  dossier: path.relative(root, affectedIdentity.absPath).split(path.sep).join('/'),
                  implementation_step_artifact: affectedState.step_artifact,
                  implementation_process_complete_ts: affectedState.process_complete_ts,
                  global_refresh_artifact: globalRefreshArtifactPath,
                  affected_feature_ids: affectedFeatureIds,
                  pre_status_summary: preStatusEnvelope.data,
                  post_status_summary: statusEnvelope.data,
                  refresh_ran_at: truth.last_refresh_at ?? evidenceCheckedAt,
                  backlog_last_refresh_at: truth.last_refresh_at,
                  refresh_summary: refreshEnvelope.data,
                  status_summary: statusEnvelope.data,
                  attention_summary: attentionEnvelope.data,
                  queue_summary: {
                    data: queueEnvelope.data,
                    warnings: queueEnvelope.warnings,
                  },
                  open_source_review_count: openSourceReviewCount,
                  source_review_blocked_item_count: sourceReviewBlockedItemCount,
                  lifecycle_reconciliation_drift_count: lifecycleReconciliationDriftCount,
                  unresolved_attention_present: unresolvedAttentionPresent,
                  backlog_clean: blockers.length === 0,
                  result: hygieneStatus,
                  blockers,
                };
                await writeJsonAtomic(absArtifactPath, artifact);
                await recordPostCloseBacklogHygieneOnStageLog({
                  root,
                  featureId: affectedFeatureId,
                  artifactPath,
                  globalRefreshArtifactPath,
                  affectedFeatureIds,
                  checkedAt: evidenceCheckedAt,
                  refreshAt: truth.last_refresh_at ?? evidenceCheckedAt,
                  schemaVersion: 2,
                  preStatusSummary: preStatusEnvelope.data,
                  postStatusSummary: statusEnvelope.data,
                  status: hygieneStatus,
                  openSourceReviewCount,
                  sourceReviewBlockedItemCount,
                  lifecycleReconciliationDriftCount,
                  unresolvedAttentionPresent,
                  blockers,
                });
                perFeatureResults.push({
                  artifact_path: artifactPath,
                  feature_id: affectedFeatureId,
                  result: hygieneStatus,
                });
              } catch (error) {
                perFeatureResults.push({
                  feature_id: affectedFeatureId,
                  result: 'failed',
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
          } finally {
            await releaseFeatureLocks();
          }

          const failedCount = perFeatureResults.filter(
            (result) => result.result === 'failed',
          ).length;
          const failedFeatureIds = perFeatureResults
            .filter((result) => result.result === 'failed' && typeof result.feature_id === 'string')
            .map((result) => result.feature_id as string);
          const runResult =
            failedCount === 0
              ? 'complete'
              : failedCount === perFeatureResults.length
                ? 'failed'
                : 'partial';
          hygieneSummaries.perFeatureResults = perFeatureResults;
          await writePostCloseHygieneGlobalArtifact({
            context: hygieneContext,
            durabilityStatus: 'final',
            failedFeatureIds,
            result: runResult,
            summaries: hygieneSummaries,
          });
          const selectedResult = perFeatureResults.find(
            (result) => result.feature_id === featureId,
          );
          const selectedArtifactPath =
            typeof selectedResult?.artifact_path === 'string' ? selectedResult.artifact_path : null;
          writeCliEnvelope(io.stdout, {
            command: 'post-close-hygiene',
            scope: { feature_id: featureId, step: 'implementation' },
            result:
              runResult !== 'complete' ? 'fail' : hygieneStatus === 'blocked' ? 'blocked' : 'ok',
            data: {
              artifact_path: selectedArtifactPath,
              global_refresh_artifact: globalRefreshArtifactPath,
              affected_feature_ids: affectedFeatureIds,
              failed_feature_ids: failedFeatureIds,
              per_feature_results: perFeatureResults,
              result: runResult,
              run_id: runId,
              backlog_clean: blockers.length === 0,
              open_source_review_count: openSourceReviewCount,
              source_review_blocked_item_count: sourceReviewBlockedItemCount,
              lifecycle_reconciliation_drift_count: lifecycleReconciliationDriftCount,
              unresolved_attention_present: unresolvedAttentionPresent,
              blockers,
              post_close_backlog_hygiene_status: hygieneStatus,
              retry_command: runResult === 'complete' ? null : retryCommand,
            },
            nextCommands:
              runResult !== 'complete'
                ? [retryCommand]
                : hygieneStatus === 'blocked'
                  ? ['dossier-engineer attention']
                  : [`dossier-engineer next-step --dossier ${identity.dossier.relPath} --json`],
          });
          return runResult === 'complete' ? 0 : 1;
        } finally {
          await releaseGlobalLock();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (hygieneContext) {
          const failedFeatureIds =
            hygieneContext.affectedFeatureIds.length > 0
              ? hygieneContext.affectedFeatureIds
              : [hygieneContext.featureId];
          if (hygieneSummaries.perFeatureResults.length === 0) {
            hygieneSummaries.perFeatureResults = failedFeatureIds.map((failedFeatureId) => ({
              error: message,
              feature_id: failedFeatureId,
              result: 'failed',
            }));
          }
          await writePostCloseHygieneGlobalArtifact({
            context: hygieneContext,
            durabilityStatus: 'final',
            errorMessage: message,
            failedFeatureIds,
            result: 'failed',
            summaries: hygieneSummaries,
          }).catch(() => undefined);
          writeCliEnvelope(io.stdout, {
            command: 'post-close-hygiene',
            scope: { feature_id: hygieneContext.featureId, step: 'implementation' },
            result: 'fail',
            data: {
              artifact_path: null,
              global_refresh_artifact: hygieneContext.globalRefreshArtifactPath,
              affected_feature_ids: hygieneContext.affectedFeatureIds,
              failed_feature_ids: failedFeatureIds,
              per_feature_results: hygieneSummaries.perFeatureResults,
              result: 'failed',
              run_id: hygieneContext.runId,
              backlog_clean: false,
              blockers: [message],
              post_close_backlog_hygiene_status: 'failed',
              retry_command: hygieneContext.retryCommand,
            },
            nextCommands: [hygieneContext.retryCommand],
          });
        }
        io.stderr.write(
          `${JSON.stringify({
            error: {
              code: 'UDE_POST_CLOSE_HYGIENE_FAILED',
              message,
            },
          })}\n`,
        );
        return 1;
      }
    },
  };
}

function createDossierCommandWrapper(
  name: string,
  family: UnifiedCommand['family'],
): UnifiedCommand {
  const command = findDossierCommand(name);
  if (!command) {
    throw new Error(`Missing vendored dossier command: ${name}`);
  }

  const baseHelpLines = replaceCliNames(command.helpText()).split('\n');
  const execute = async (args: string[], io: CliIo): Promise<number> => {
    return executeDossierCommand(command, args, io as DossierCliIo, name);
  };

  if (name === 'feature-intake') {
    const featureIntakeHelpLines = (): string[] =>
      baseHelpLines.flatMap((line) => {
        const replaced = line.replace(
          'workflow_stage_next values name workflow stages, not shipped CLI subcommands.',
          'workflow_stage_next values name canonical stage-controller commands; use spec-compact, plan-slice, implementation, or change-proposal as shipped subcommands.',
        );
        if (replaced.trim() === 'Options:') {
          return [
            replaced,
            '  --session-id <id>          Required explicit session provenance for stage artifacts.',
            '  --trace-runtime <name>     Optional explicit runtime label recorded with the session id.',
            '  --skill-used <name>        Repeatable agent-supplied skill annotation for this stage.',
            '  --skill-issue <text>       Repeatable agent-supplied skill issue annotation.',
            '  --skill-followup <text>    Repeatable agent-supplied skill follow-up annotation.',
            '  --process-miss <dsl>       Repeatable structured process miss DSL.',
            '  --phase-scope <text>       Optional explicit phase/scope descriptor.',
          ];
        }
        return replaced.replace(' [options]', ' --session-id <id> [options]');
      });
    return {
      name,
      family: 'delivery-stage',
      commandType: 'stage',
      summary: command.description,
      usage: baseHelpLines
        .filter((line) => line.trim().startsWith('dossier-engineer feature-intake'))
        .map((line) => line.replace(' [options]', ' --session-id <id> [options]')),
      helpLines: featureIntakeHelpLines,
      async execute(args, io) {
        try {
          if (args.includes('--help') || args.includes('-h')) {
            writeLine(io.stdout, featureIntakeHelpLines().join('\n'));
            return 0;
          }
          const provenance = parseStageProvenanceInput(args);
          const annotations = parseStageAnnotationsInput(args);
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          await assertManagedWritePath(
            root,
            path.join(root, '.dossier', 'logs', 'feature-intake'),
            path.join(root, '.dossier', 'logs', 'feature-intake', '.probe.md'),
            'feature-intake log',
          );
          await assertManagedWritePath(
            root,
            path.join(root, 'docs', 'ssot'),
            path.join(root, 'docs', 'ssot', 'index.md'),
            'feature-intake index file',
          );
          const argsWithJson = args.includes('--json') ? args : [...args, '--json'];
          return await withDeliveryLock({
            root,
            featureId: 'feature-intake',
            featureCycleId: 'allocation',
            command: 'feature-intake',
            run: async () => {
              const { exitCode, stderr, stdout } = await captureDossierCommandOutput(
                name,
                argsWithJson,
                command,
              );
              const summary = stdout.trim()
                ? (JSON.parse(stdout) as {
                    backlog_item_key: string;
                    backlog_delivery_state: string;
                    dossier: string;
                    feature_id: string;
                    partial_success?: boolean;
                    refresh_exit_code?: number | null;
                    refresh_stderr?: string | null;
                    refresh_stdout?: string | null;
                  })
                : null;
              if (exitCode !== 0 && !summary) {
                throw new Error(
                  stderr.trim() || 'feature-intake failed before creating a dossier.',
                );
              }
              if (!summary) {
                throw new Error('feature-intake did not return a JSON summary.');
              }
              const featureId = sanitizeFeatureId(summary.feature_id, 'feature-intake feature id');
              const featureCycleId = `fc-${featureId}-${Date.now().toString(36)}`;
              const nextCommand = `dossier-engineer spec-compact --feature-id ${featureId} --session-id <id>`;
              if (exitCode !== 0) {
                const warnings = [
                  `feature-intake created ${summary.dossier}, but vendored closeout failed before telemetry append.`,
                  ...(summary.refresh_stderr ? [summary.refresh_stderr] : []),
                ];
                if (args.includes('--json')) {
                  writeCliEnvelope(io.stdout, {
                    command: 'feature-intake',
                    scope: { feature_id: featureId },
                    data: {
                      ...summary,
                      feature_cycle_id: null,
                      log_path: null,
                      stage: 'feature-intake',
                    },
                    nextCommands: ['dossier-engineer index-refresh', nextCommand],
                    result: 'partial_success',
                    warnings,
                  });
                  return exitCode;
                }
                writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
                writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
                for (const warning of warnings) {
                  writeLine(io.stderr, `[feature-intake] WARNING: ${warning}`);
                }
                return exitCode;
              }
              try {
                const backlogLifecycleReconciliation = await evaluateBacklogLifecycleReconciliation(
                  {
                    root,
                    stage: 'feature-intake',
                    itemKey: summary.backlog_item_key,
                  },
                );
                const lifecycleFollowupRequired =
                  backlogLifecycleReconciliation.target !== null &&
                  !backlogLifecycleReconciliation.reconciled;
                const intakeLog = await appendFeatureIntakeLog({
                  root,
                  featureId,
                  featureCycleId,
                  backlogItemKey: summary.backlog_item_key,
                  backlogLifecycleReconciliation,
                  phaseScope: annotations.phaseScope,
                  processMisses: annotations.processMisses,
                  sessionId: provenance.sessionId,
                  skillFollowups: annotations.skillFollowups,
                  skillIssues: annotations.skillIssues,
                  skillsUsed: annotations.skillsUsed,
                  traceRuntime: provenance.traceRuntime,
                });
                const stageData = {
                  ...summary,
                  stage: 'feature-intake',
                  cycle_id: intakeLog.cycleId,
                  feature_cycle_id: featureCycleId,
                  stage_state: 'ready_for_close',
                  entered_ts: intakeLog.enteredTs,
                  ready_for_close_ts: intakeLog.readyForCloseTs,
                  transition_events: intakeLog.transitionEvents,
                  backlog_followup_required: lifecycleFollowupRequired,
                  backlog_followup_kind: lifecycleFollowupRequired
                    ? 'backlog-lifecycle-actualization'
                    : null,
                  backlog_followup_resolved: !lifecycleFollowupRequired,
                  ...lifecycleReconciliationMetadata(backlogLifecycleReconciliation),
                  log_path: intakeLog.logPath,
                };
                if (args.includes('--json')) {
                  writeCliEnvelope(io.stdout, {
                    command: 'feature-intake',
                    scope: { feature_id: featureId, feature_cycle_id: featureCycleId },
                    data: stageData,
                    nextCommands: [nextCommand],
                  });
                  return 0;
                }
                writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
                writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
                writeLine(
                  io.stdout,
                  `[feature-intake] backlog_item_key=${summary.backlog_item_key}`,
                );
                writeLine(
                  io.stdout,
                  `[feature-intake] backlog_delivery_state=${summary.backlog_delivery_state}`,
                );
                writeLine(io.stdout, `[feature-intake] feature_cycle_id=${featureCycleId}`);
                writeLine(io.stdout, `[feature-intake] cycle_id=${intakeLog.cycleId}`);
                writeLine(io.stdout, '[feature-intake] stage_state=ready_for_close');
                writeLine(io.stdout, `[feature-intake] log_path=${intakeLog.logPath}`);
                writeLine(io.stdout, '[feature-intake] next_stage_controller=spec-compact');
                writeLine(io.stdout, `[feature-intake] next_command=${nextCommand}`);
                return 0;
              } catch (error) {
                const warning = error instanceof Error ? error.message : String(error);
                if (args.includes('--json')) {
                  writeCliEnvelope(io.stdout, {
                    command: 'feature-intake',
                    scope: { feature_id: featureId, feature_cycle_id: featureCycleId },
                    data: {
                      ...summary,
                      feature_cycle_id: featureCycleId,
                      log_path: null,
                      stage: 'feature-intake',
                    },
                    nextCommands: [nextCommand],
                    result: 'partial_success',
                    warnings: [
                      `Feature dossier was created, but feature-intake log append failed: ${warning}`,
                    ],
                  });
                  return 0;
                }
                writeLine(io.stdout, `[feature-intake] Created ${summary.dossier}`);
                writeLine(io.stdout, `[feature-intake] feature=${featureId}`);
                writeLine(
                  io.stderr,
                  `[feature-intake] WARNING: feature-intake log append failed after dossier creation: ${warning}`,
                );
                return 0;
              }
            },
          });
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_FEATURE_INTAKE_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'dossier-step-close') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer dossier-step-close'),
      ),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const dossierPath = takeOption(args, '--dossier');
          const step = takeOption(args, '--step');
          if (!dossierPath || !step) {
            return executeDossierCommand(command, args, io as DossierCliIo, name);
          }
          const normalizedStep = ensureAllowedStep(step, '--step');
          const { dossier, featureId } = await resolveManagedDossierIdentity({
            root,
            dossierPath,
          });
          const stageLog = await resolveStageLogContext(
            root,
            normalizedStep as Parameters<typeof resolveStageLogContext>[1],
            featureId,
          );
          if (!stageLog) {
            throw new Error(`No ${normalizedStep} stage log found for ${featureId}.`);
          }
          const backlogActualizationArtifactPaths = takeManyOptions(
            args,
            '--backlog-actualization-artifact',
          );
          const selectedBacklogItemKey = await resolveSelectedBacklogItemKey({
            root,
            featureId,
            stage: normalizedStep as StageStateStage,
            dossier,
          });
          const backlogLifecycleReconciliation = await evaluateBacklogLifecycleReconciliation({
            root,
            stage: normalizedStep,
            itemKey: selectedBacklogItemKey,
            actualizationArtifactPaths: backlogActualizationArtifactPaths,
          });
          if (
            backlogLifecycleReconciliation.target !== null &&
            !backlogLifecycleReconciliation.reconciled
          ) {
            throw new BacklogActualizationRequiredError(backlogLifecycleReconciliation);
          }
          const verifyArtifactPath = takeOption(args, '--verify-artifact');
          const reviewArtifactPaths = takeManyOptions(args, '--review-artifact');
          const outputPath = takeOption(args, '--output');
          if (verifyArtifactPath) {
            const absVerifyArtifactPath = await resolveManagedReadPath(
              root,
              verifyArtifactPath,
              path.join(root, '.dossier', 'verification', featureId),
              'verification artifact path',
            );
            try {
              const verifyArtifact = JSON.parse(
                await fs.readFile(absVerifyArtifactPath, 'utf8'),
              ) as {
                feature_id?: string;
                step?: string;
              };
              if (
                verifyArtifact.feature_id !== featureId ||
                verifyArtifact.step !== normalizedStep
              ) {
                throw new Error(
                  `Verification artifact must match feature ${featureId} and step ${normalizedStep}.`,
                );
              }
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.startsWith('Verification artifact must match')
              ) {
                throw error;
              }
            }
          }
          for (const reviewArtifactPath of reviewArtifactPaths) {
            if (reviewArtifactPath) {
              const absReviewArtifactPath = await resolveManagedReadPath(
                root,
                reviewArtifactPath,
                path.join(root, '.dossier', 'reviews', featureId),
                'review artifact path',
              );
              try {
                const reviewArtifact = JSON.parse(
                  await fs.readFile(absReviewArtifactPath, 'utf8'),
                ) as {
                  feature_id?: string;
                  step?: string;
                };
                if (
                  reviewArtifact.feature_id !== featureId ||
                  reviewArtifact.step !== normalizedStep
                ) {
                  throw new Error(
                    `Review artifact must match feature ${featureId} and step ${normalizedStep}.`,
                  );
                }
              } catch (error) {
                if (
                  error instanceof Error &&
                  error.message.startsWith('Review artifact must match')
                ) {
                  throw error;
                }
              }
            }
          }
          if (outputPath) {
            await assertManagedWritePath(
              root,
              path.join(root, '.dossier', 'steps', featureId),
              path.resolve(root, outputPath),
              'step-close output path',
            );
          }
          await assertManagedWritePath(
            root,
            path.join(root, '.dossier', 'logs', normalizedStep),
            stageLog.absPath,
            `${normalizedStep} stage log`,
          );
          return await withDeliveryLock({
            root,
            featureId,
            featureCycleId: stageLog.featureCycleId,
            command: name,
            run: async () => {
              const { exitCode, stderr, stdout } = await captureDossierCommandOutput(
                name,
                args,
                command,
              );
              const stepArtifactPath = outputPath
                ? path.relative(root, path.resolve(root, outputPath)).split(path.sep).join('/')
                : path
                    .join('.dossier', 'steps', featureId, `${normalizedStep}.json`)
                    .split(path.sep)
                    .join('/');
              const absStepArtifactPath = path.resolve(root, stepArtifactPath);
              if (stdout) {
                io.stdout.write(stdout);
              }
              const shouldLinkStage =
                exitCode === 0 || exitCode === 2 || (await pathExists(absStepArtifactPath));
              if (shouldLinkStage) {
                try {
                  await fs.access(absStepArtifactPath);
                  const artifact = JSON.parse(await fs.readFile(absStepArtifactPath, 'utf8')) as {
                    blockers?: string[];
                    degraded_review_present?: boolean;
                    executed_audit_classes?: string[];
                    feature_id?: string;
                    implementation_review_scope?: 'code-bearing' | 'non-code' | null;
                    invalidated_review_present?: boolean;
                    process_complete?: boolean;
                    closure_bundle_id?: string | null;
                    closure_bundle_round?: number | null;
                    closure_bundle_rounds_by_audit_class?: Record<string, number>;
                    non_pass_review_events?: Array<Record<string, unknown>>;
                    required_audit_classes?: string[];
                    required_external_review_pending?: boolean;
                    required_security_review?: boolean | null;
                    review_artifacts?: string[];
                    review_trace_commits?: string[];
                    reviewer_agent_ids?: string[];
                    reviewer_skills?: string[];
                    rpa_source_identity?: Record<string, unknown> | null;
                    rpa_source_quality?: Record<string, unknown> | null;
                    security_trigger_reasons?: string[];
                    selected_closure_ts?: string | null;
                    selected_review_artifacts?: string[];
                    selected_step_artifact?: string | null;
                    selected_verification_artifact?: string | null;
                    step?: string;
                    stale_review_present?: boolean;
                  };
                  if (artifact.feature_id !== featureId || artifact.step !== normalizedStep) {
                    throw new Error(
                      `Step artifact must match feature ${featureId} and step ${normalizedStep}.`,
                    );
                  }
                  const selectedReviewArtifactPaths = Array.isArray(artifact.review_artifacts)
                    ? artifact.review_artifacts.filter(
                        (artifactPath): artifactPath is string =>
                          typeof artifactPath === 'string' && artifactPath.trim().length > 0,
                      )
                    : reviewArtifactPaths.map((artifactPath) =>
                        path
                          .relative(root, path.resolve(root, artifactPath))
                          .split(path.sep)
                          .join('/'),
                      );
                  await recordStepCloseOnStageLog({
                    root,
                    featureId,
                    step: normalizedStep,
                    stepArtifactPath,
                    verificationArtifactPath: verifyArtifactPath
                      ? path
                          .relative(root, path.resolve(root, verifyArtifactPath))
                          .split(path.sep)
                          .join('/')
                      : null,
                    reviewArtifactPaths: selectedReviewArtifactPaths,
                    finalClosureCommit: currentGitHead(root),
                    processComplete: artifact.process_complete === true,
                    auditSummary: {
                      degradedReviewPresent: artifact.degraded_review_present === true,
                      executedAuditClasses: Array.isArray(artifact.executed_audit_classes)
                        ? artifact.executed_audit_classes
                        : [],
                      implementationReviewScope:
                        artifact.implementation_review_scope === 'code-bearing' ||
                        artifact.implementation_review_scope === 'non-code'
                          ? artifact.implementation_review_scope
                          : null,
                      invalidatedReviewPresent: artifact.invalidated_review_present === true,
                      requiredAuditClasses: Array.isArray(artifact.required_audit_classes)
                        ? artifact.required_audit_classes
                        : [],
                      requiredExternalReviewPending:
                        artifact.required_external_review_pending !== false,
                      requiredSecurityReview:
                        typeof artifact.required_security_review === 'boolean'
                          ? artifact.required_security_review
                          : null,
                      reviewTraceCommits: Array.isArray(artifact.review_trace_commits)
                        ? artifact.review_trace_commits
                        : [],
                      reviewerAgentIds: Array.isArray(artifact.reviewer_agent_ids)
                        ? artifact.reviewer_agent_ids
                        : [],
                      reviewerSkills: Array.isArray(artifact.reviewer_skills)
                        ? artifact.reviewer_skills
                        : [],
                      securityTriggerReasons: Array.isArray(artifact.security_trigger_reasons)
                        ? artifact.security_trigger_reasons
                        : [],
                      staleReviewPresent: artifact.stale_review_present === true,
                    },
                    backlogLifecycleReconciliation,
                    selectedClosure: {
                      closureBundleId:
                        typeof artifact.closure_bundle_id === 'string'
                          ? artifact.closure_bundle_id
                          : null,
                      closureBundleRound:
                        typeof artifact.closure_bundle_round === 'number' &&
                        Number.isInteger(artifact.closure_bundle_round) &&
                        artifact.closure_bundle_round > 0
                          ? artifact.closure_bundle_round
                          : null,
                      closureBundleRoundsByAuditClass:
                        artifact.closure_bundle_rounds_by_audit_class &&
                        typeof artifact.closure_bundle_rounds_by_audit_class === 'object'
                          ? artifact.closure_bundle_rounds_by_audit_class
                          : {},
                      selectedReviewArtifacts: Array.isArray(artifact.selected_review_artifacts)
                        ? artifact.selected_review_artifacts.filter(
                            (artifactPath): artifactPath is string =>
                              typeof artifactPath === 'string' && artifactPath.trim().length > 0,
                          )
                        : selectedReviewArtifactPaths,
                      selectedVerificationArtifact:
                        typeof artifact.selected_verification_artifact === 'string'
                          ? artifact.selected_verification_artifact
                          : null,
                      selectedStepArtifact:
                        typeof artifact.selected_step_artifact === 'string'
                          ? artifact.selected_step_artifact
                          : null,
                      selectedClosureTs:
                        typeof artifact.selected_closure_ts === 'string'
                          ? artifact.selected_closure_ts
                          : null,
                      rpaSourceIdentity:
                        artifact.rpa_source_identity &&
                        typeof artifact.rpa_source_identity === 'object'
                          ? artifact.rpa_source_identity
                          : null,
                      rpaSourceQuality:
                        artifact.rpa_source_quality &&
                        typeof artifact.rpa_source_quality === 'object'
                          ? artifact.rpa_source_quality
                          : null,
                      nonPassReviewEvents: Array.isArray(artifact.non_pass_review_events)
                        ? artifact.non_pass_review_events.filter(
                            (event): event is Record<string, unknown> =>
                              event !== null && typeof event === 'object',
                          )
                        : [],
                    },
                  });
                  if (exitCode === 2) {
                    io.stderr.write(
                      `${JSON.stringify({
                        error: {
                          blockers: artifact.blockers ?? [],
                          code: 'UDE_CLOSURE_BLOCKED',
                          message: `dossier-step-close is blocked for ${featureId}/${normalizedStep}.`,
                          step_artifact: stepArtifactPath,
                        },
                      })}\n`,
                    );
                    return 3;
                  }
                } catch (error) {
                  if (stderr) {
                    io.stderr.write(stderr);
                  }
                  return writeStageLinkageError(io, {
                    artifactPath: stepArtifactPath,
                    command: name,
                    featureId,
                    message: error instanceof Error ? error.message : String(error),
                    step: normalizedStep,
                  });
                }
              }
              if (stderr && exitCode !== 2) {
                io.stderr.write(stderr);
              }
              if (stderr && exitCode === 2) {
                io.stderr.write(stderr);
              }
              return exitCode;
            },
          });
        } catch (error) {
          if (error instanceof BacklogActualizationRequiredError) {
            io.stderr.write(
              `${JSON.stringify({
                error: {
                  code: 'UDE_BACKLOG_ACTUALIZATION_REQUIRED',
                  message: error.message,
                  selected_backlog_item_key: error.reconciliation.itemKey,
                  current_delivery_state: error.reconciliation.current,
                  target_delivery_state: error.reconciliation.target,
                  backlog_actualization_verdict: error.reconciliation.verdict,
                  backlog_actualization_artifacts: error.reconciliation.actualizationArtifacts,
                  next_commands: error.nextCommands,
                },
              })}\n`,
            );
            return 3;
          }
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_DOSSIER_STEP_CLOSE_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'review-artifact') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer review-artifact'),
      ),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const dossierPath = takeOption(args, '--dossier');
          const step = takeOption(args, '--step');
          if (!dossierPath || !step) {
            return executeDossierCommand(command, args, io as DossierCliIo, name);
          }
          const normalizedStep = ensureAllowedStep(step, '--step');
          const { featureId } = await resolveManagedDossierIdentity({
            root,
            dossierPath,
          });
          const outputPath = takeOption(args, '--output');
          if (outputPath) {
            await assertManagedWritePath(
              root,
              path.join(root, '.dossier', 'reviews', featureId),
              path.resolve(root, outputPath),
              'review-artifact output path',
            );
          }
          const normalizedArgs = args.map((arg, index) =>
            arg === step && args[index - 1] === '--step' ? normalizedStep : arg,
          );
          const featureCycleId = await resolveLatestFeatureCycleId(
            root,
            featureId,
            normalizedStep as StageControllerCommand,
          );
          if (!featureCycleId) {
            throw new Error(`No feature cycle found for ${featureId}.`);
          }
          return await withDeliveryLock({
            root,
            featureId,
            featureCycleId,
            command: name,
            run: async () => {
              const { exitCode, stderr, stdout } = await captureDossierCommandOutput(
                name,
                normalizedArgs,
                command,
              );
              if (stdout) {
                io.stdout.write(stdout);
              }
              if (stderr) {
                io.stderr.write(stderr);
              }
              if (exitCode !== 0) {
                return exitCode;
              }

              let artifactPath: string | null = null;
              try {
                const outputMatch = stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
                if (!outputMatch?.[1]) {
                  throw new Error('review-artifact did not report its output path.');
                }
                artifactPath = outputMatch[1].trim();
                const absArtifactPath = await resolveManagedReadPath(
                  root,
                  artifactPath,
                  path.join(root, '.dossier', 'reviews', featureId),
                  'review-artifact output path',
                );
                const artifact = JSON.parse(await fs.readFile(absArtifactPath, 'utf8')) as {
                  allowed_by_policy?: boolean;
                  audit_class?: 'code-reviewer' | 'security-reviewer' | 'spec-conformance-reviewer';
                  event_commit?: string | null;
                  feature_id?: string;
                  findings?: { evidence?: unknown; must_fix?: unknown };
                  implementation_scope?: 'code-bearing' | 'non-code' | null;
                  invalidated?: boolean;
                  latest_copy_path?: string | null;
                  review_mode?: 'degraded' | 'external' | 'self-review';
                  review_attempt_id?: string | null;
                  review_round_id?: string | null;
                  review_round_number?: number | null;
                  reviewer?: string;
                  reviewer_agent_id?: string | null;
                  reviewer_skill?: string | null;
                  reviewer_thread_id?: string | null;
                  repair_next_action?: string | null;
                  risk_families?: unknown;
                  security_trigger_reason?: string | null;
                  step?: string;
                  verdict?: 'FAIL' | 'PASS';
                };
                if (artifact.feature_id !== featureId || artifact.step !== normalizedStep) {
                  throw new Error(
                    `Review artifact must match feature ${featureId} and step ${normalizedStep}.`,
                  );
                }
                if (!artifact.audit_class || !artifact.verdict) {
                  throw new Error('Review artifact is missing audit_class or verdict.');
                }
                const gitHead = currentGitHead(root);
                const reviewerThreadId =
                  typeof artifact.reviewer_thread_id === 'string' &&
                  artifact.reviewer_thread_id.trim().length > 0
                    ? artifact.reviewer_thread_id
                    : null;
                const stale =
                  gitHead !== null &&
                  (!artifact.event_commit?.trim() || artifact.event_commit !== gitHead);
                await recordReviewArtifactOnStageLog({
                  root,
                  featureId,
                  stage: normalizedStep as Parameters<
                    typeof recordReviewArtifactOnStageLog
                  >[0]['stage'],
                  artifactPath,
                  auditClass: artifact.audit_class,
                  eventCommit: artifact.event_commit ?? null,
                  implementationScope:
                    artifact.implementation_scope === 'code-bearing' ||
                    artifact.implementation_scope === 'non-code'
                      ? artifact.implementation_scope
                      : null,
                  invalidated: artifact.invalidated === true,
                  latestCopyPath:
                    typeof artifact.latest_copy_path === 'string' &&
                    artifact.latest_copy_path.trim().length > 0
                      ? artifact.latest_copy_path
                      : null,
                  mustFixCount: Array.isArray(artifact.findings?.must_fix)
                    ? artifact.findings.must_fix.length
                    : 0,
                  evidenceCount: Array.isArray(artifact.findings?.evidence)
                    ? artifact.findings.evidence.length
                    : 0,
                  reviewMode: artifact.review_mode ?? 'external',
                  reviewAttemptId:
                    typeof artifact.review_attempt_id === 'string' &&
                    artifact.review_attempt_id.trim().length > 0
                      ? artifact.review_attempt_id
                      : null,
                  reviewRoundId:
                    typeof artifact.review_round_id === 'string' &&
                    artifact.review_round_id.trim().length > 0
                      ? artifact.review_round_id
                      : null,
                  reviewRoundNumber:
                    typeof artifact.review_round_number === 'number' &&
                    Number.isInteger(artifact.review_round_number) &&
                    artifact.review_round_number > 0
                      ? artifact.review_round_number
                      : null,
                  reviewer: artifact.reviewer ?? 'unknown-reviewer',
                  reviewerAgentId: artifact.reviewer_agent_id ?? null,
                  reviewerSkill: artifact.reviewer_skill ?? null,
                  reviewerThreadId,
                  repairNextAction:
                    typeof artifact.repair_next_action === 'string' &&
                    artifact.repair_next_action.trim().length > 0
                      ? artifact.repair_next_action
                      : null,
                  riskFamilies: Array.isArray(artifact.risk_families)
                    ? artifact.risk_families.filter(
                        (riskFamily): riskFamily is string =>
                          typeof riskFamily === 'string' && riskFamily.trim().length > 0,
                      )
                    : [],
                  securityTriggerReason: artifact.security_trigger_reason ?? null,
                  stale,
                  verdict: artifact.verdict,
                  allowedByPolicy: artifact.allowed_by_policy !== false && !stale,
                });
              } catch (error) {
                return writeStageLinkageError(io, {
                  artifactPath,
                  command: name,
                  featureId,
                  message: error instanceof Error ? error.message : String(error),
                  step: normalizedStep,
                });
              }
              return exitCode;
            },
          });
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_REVIEW_ARTIFACT_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'contract-drift-audit') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer contract-drift-audit'),
      ),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const dossierPath = takeOption(args, '--dossier');
          if (dossierPath) {
            const { featureId } = await resolveManagedDossierIdentity({
              root,
              dossierPath,
            });
            const outputPath = takeOption(args, '--output');
            if (outputPath) {
              await assertManagedWritePath(
                root,
                path.join(root, '.dossier', 'drift', featureId),
                path.resolve(root, outputPath),
                'contract-drift-audit output path',
              );
            }
            const featureCycleId = await resolveLatestFeatureCycleId(root, featureId);
            if (!featureCycleId) {
              throw new Error(`No feature cycle found for ${featureId}.`);
            }
            return await withDeliveryLock({
              root,
              featureId,
              featureCycleId,
              command: name,
              run: async () => executeDossierCommand(command, args, io as DossierCliIo, name),
            });
          }
          return executeDossierCommand(command, args, io as DossierCliIo, name);
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_CONTRACT_DRIFT_AUDIT_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'dossier-verify') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer dossier-verify'),
      ),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const dossierPath = takeOption(args, '--dossier');
          const step = takeOption(args, '--step');
          let featureId: string | null = null;
          if (dossierPath) {
            featureId = (
              await resolveManagedDossierIdentity({
                root,
                dossierPath,
              })
            ).featureId;
            const outputPath = takeOption(args, '--output');
            if (outputPath) {
              await assertManagedWritePath(
                root,
                path.join(root, '.dossier', 'verification', featureId),
                path.resolve(root, outputPath),
                'dossier-verify output path',
              );
            }
          }
          if (step) {
            ensureAllowedStep(step, '--step');
          }
          if (featureId) {
            const normalizedStep = step ? ensureAllowedStep(step, '--step') : 'implementation';
            const featureCycleId = await resolveLatestFeatureCycleId(
              root,
              featureId,
              normalizedStep as StageControllerCommand,
            );
            if (!featureCycleId) {
              throw new Error(`No feature cycle found for ${featureId}.`);
            }
            return await withDeliveryLock({
              root,
              featureId,
              featureCycleId,
              command: name,
              run: async () => {
                const { exitCode, stderr, stdout } = await captureDossierCommandOutput(
                  name,
                  args,
                  command,
                );
                if (stdout) {
                  io.stdout.write(stdout);
                }
                if (stderr) {
                  io.stderr.write(stderr);
                }
                const artifactPath =
                  stdout.match(/\[dossier-verify\] artifact=([^\n]+)/u)?.[1]?.trim() ?? null;
                const shouldLinkStage = exitCode === 0 || exitCode === 2 || artifactPath !== null;
                if (shouldLinkStage) {
                  try {
                    if (!artifactPath) {
                      throw new Error('dossier-verify did not report its artifact path.');
                    }
                    const absArtifactPath = await resolveManagedReadPath(
                      root,
                      artifactPath,
                      path.join(root, '.dossier', 'verification', featureId),
                      'dossier-verify artifact path',
                    );
                    const artifact = JSON.parse(await fs.readFile(absArtifactPath, 'utf8')) as {
                      event_commit?: string | null;
                      feature_id?: string;
                      step?: string;
                    };
                    if (artifact.feature_id !== featureId || artifact.step !== normalizedStep) {
                      throw new Error(
                        `Verification artifact must match feature ${featureId} and step ${normalizedStep}.`,
                      );
                    }
                    await recordVerificationArtifactOnStageLog({
                      root,
                      featureId,
                      stage: normalizedStep as Parameters<
                        typeof recordVerificationArtifactOnStageLog
                      >[0]['stage'],
                      artifactPath,
                      eventCommit: artifact.event_commit ?? null,
                    });
                  } catch (error) {
                    return writeStageLinkageError(io, {
                      artifactPath,
                      command: name,
                      featureId,
                      message: error instanceof Error ? error.message : String(error),
                      step: normalizedStep,
                    });
                  }
                }
                return exitCode;
              },
            });
          }
          return executeDossierCommand(command, args, io as DossierCliIo, name);
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_DOSSIER_VERIFY_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'sync-index' || name === 'lint-dossiers' || name === 'index-refresh') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) => line.trim().startsWith(`dossier-engineer ${name}`)),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const indexFile =
            takeOption(args, '--index-file') ?? path.join('docs', 'ssot', 'index.md');
          await assertManagedWritePath(
            root,
            path.join(root, 'docs', 'ssot'),
            path.resolve(root, indexFile),
            `${name} index file`,
          );
          const shouldLock = name !== 'lint-dossiers' || args.includes('--update-index');
          if (shouldLock) {
            return await withDeliveryLock({
              root,
              featureId: 'index',
              featureCycleId: 'global',
              command: name,
              run: async () => executeDossierCommand(command, args, io as DossierCliIo, name),
            });
          }
          return executeDossierCommand(command, args, io as DossierCliIo, name);
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_INDEX_HELPER_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  if (name === 'lifecycle-refresh') {
    return {
      name,
      family,
      commandType: 'dossier',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer lifecycle-refresh'),
      ),
      helpLines: () => baseHelpLines,
      async execute(args, io) {
        try {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          const dossierPath = takeOption(args, '--dossier');
          let featureId = takeOption(args, '--feature-id');
          if (dossierPath) {
            featureId =
              featureId ??
              (
                await resolveManagedDossierIdentity({
                  root,
                  dossierPath,
                })
              ).featureId;
          }
          if (featureId) {
            featureId = sanitizeFeatureId(featureId, '--feature-id');
            await assertManagedWritePath(
              root,
              path.join(root, '.dossier', 'metrics', featureId),
              path.join(root, '.dossier', 'metrics', featureId, '.probe.json'),
              'lifecycle metrics directory',
            );
          }
          await assertManagedWritePath(
            root,
            path.join(root, '.dossier', 'retro'),
            path.join(root, '.dossier', 'retro', 'session-index.jsonl'),
            'lifecycle session index path',
          );
          const featureCycleId =
            takeOption(args, '--feature-cycle-id') ??
            (featureId ? await resolveLatestFeatureCycleId(root, featureId) : null);

          if (!args.includes('--json')) {
            if (!featureId || !featureCycleId) {
              return executeDossierCommand(command, args, io as DossierCliIo, name);
            }
            return await withDeliveryLock({
              root,
              featureId,
              featureCycleId,
              command: name,
              run: async () => executeDossierCommand(command, args, io as DossierCliIo, name),
            });
          }

          const { exitCode, stderr, stdout } =
            featureId && featureCycleId
              ? await withDeliveryLock({
                  root,
                  featureId,
                  featureCycleId,
                  command: name,
                  run: async () => captureDossierCommandOutput(name, args, command),
                })
              : await captureDossierCommandOutput(name, args, command);
          if (exitCode !== 0) {
            throw new Error(stderr.trim() || 'lifecycle-refresh failed.');
          }
          const summary = JSON.parse(stdout) as {
            feature_cycle_id: string;
            feature_id: string;
            metrics_path: string;
            session_index_path: string;
            snapshot: unknown;
          };
          writeCliEnvelope(io.stdout, {
            command: 'lifecycle-refresh',
            scope: { feature_id: summary.feature_id, feature_cycle_id: summary.feature_cycle_id },
            data: summary,
          });
          return 0;
        } catch (error) {
          io.stderr.write(
            `${JSON.stringify({
              error: {
                code: 'UDE_LIFECYCLE_REFRESH_FAILED',
                message: error instanceof Error ? error.message : String(error),
              },
            })}\n`,
          );
          return 1;
        }
      },
    };
  }

  return {
    name,
    family,
    commandType: 'dossier',
    summary: command.description,
    usage: baseHelpLines
      .filter(
        (line) =>
          line.trim().startsWith('dossier-engineer ') || line.trim().startsWith('Usage:') === false,
      )
      .slice(0, 1),
    helpLines: () => baseHelpLines,
    execute,
  };
}

function createStageControllerWrapper(command: StageControllerCommand): UnifiedCommand {
  const implementationUsageSuffix =
    command === 'implementation'
      ? ' [--implementation-scope <non-code|code-bearing>] [--risk-family <id>] [--pre-review-check <dsl>]'
      : '';
  const planSliceUsageSuffix =
    command === 'plan-slice'
      ? ' [--policy-admission-risk-profile <not_applicable|applicable>] [--policy-admission-risk-rationale <text>] [--policy-admission-risk <id>] [--policy-admission-negative <dsl>]'
      : '';
  const implementationHelpLines =
    command === 'implementation'
      ? [
          '  - --implementation-scope is accepted only with implementation --ready-for-close',
          '  - --risk-family declares an explicit bounded implementation pre-review risk family',
          '  - --pre-review-check uses risk_family=<id>;id=<id>;status=<pass|not_applicable|blocked>;summary=<text>;evidence=<text>;test_refs=<comma-list>',
          '  - declared risk families require complete non-blocked pre-review checklist evidence before implementation can reach ready_for_close',
        ]
      : [];
  const planSliceHelpLines =
    command === 'plan-slice'
      ? [
          '  - --policy-admission-risk-profile records explicit policy/admission classification before ready_for_close',
          '  - --policy-admission-risk-rationale is required for not_applicable classification',
          '  - --policy-admission-risk declares admission, replay, evidence, release-policy, or runtime-gating risk',
          '  - --policy-admission-negative uses ac=<id>;risk=<admission|replay|evidence|release-policy|runtime-gating>;negative_test=<text>;production_path=<text>;evidence=<text>',
        ]
      : [];
  return {
    name: command,
    family: 'delivery-stage',
    commandType: 'stage',
    summary: `Mechanical controller for the ${command} delivery stage.`,
    usage: [
      `dossier-engineer ${command} --feature-id <id> --session-id <id>`,
      `dossier-engineer ${command} --feature-id <id> --session-id <id> --block`,
      `dossier-engineer ${command} --feature-id <id> --session-id <id> --ready-for-close`,
    ],
    helpLines: () => [
      `Mechanical controller for the ${command} delivery stage.`,
      '',
      'Usage:',
      `  dossier-engineer ${command} --feature-id <id> --session-id <id> [--trace-runtime <name>] [--skill-used <name>] [--skill-issue <text>] [--skill-followup <text>] [--process-miss <dsl>] [--phase-scope <text>] [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]${implementationUsageSuffix}${planSliceUsageSuffix}`,
      '  dossier-engineer ' +
        `${command} --feature-id <id> --session-id <id> [--trace-runtime <name>] --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`,
      '',
      'Rules:',
      '  - --session-id is required and must be supplied by the agent; the runtime does not discover it',
      '  - --trace-runtime is optional explicit metadata, not a runtime-specific default',
      '  - --skill-used, --skill-issue, --skill-followup, and --process-miss are explicit agent-supplied annotations',
      '  - --process-miss uses id=<id>;category=<category>;severity=<low|medium|high>;resolved=<true|false>;summary=<text>',
      ...implementationHelpLines,
      ...planSliceHelpLines,
      '  - stage controllers stop at ready_for_close',
      '  - authoritative closure remains dossier-step-close + lifecycle-refresh',
      '  - backlog truth is not mutated directly by the stage controller',
    ],
    async execute(args, io) {
      try {
        const result = await runStageControllerCommand(command, args);
        writeCliEnvelope(io.stdout, {
          command,
          scope: { feature_id: result.feature_id, feature_cycle_id: result.feature_cycle_id },
          data: result,
          nextCommands: result.next_commands,
        });
        return 0;
      } catch (error) {
        io.stderr.write(
          `${JSON.stringify({
            error: {
              code: 'UDE_STAGE_CONTROL_FAILED',
              message: error instanceof Error ? error.message : String(error),
            },
          })}\n`,
        );
        return 1;
      }
    },
  };
}

const DOSSIER_COMMANDS: UnifiedCommand[] = [
  createDossierCommandWrapper('feature-intake', 'delivery-stage'),
  createDossierCommandWrapper('contract-drift-audit', 'delivery-helper'),
  createDossierCommandWrapper('coverage-audit', 'delivery-helper'),
  createDossierCommandWrapper('debt-audit', 'delivery-helper'),
  createDossierCommandWrapper('dependency-graph', 'delivery-helper'),
  createDossierCommandWrapper('sync-index', 'delivery-helper'),
  createDossierCommandWrapper('index-refresh', 'delivery-helper'),
  createDossierCommandWrapper('lint-dossiers', 'delivery-helper'),
  createDossierCommandWrapper('dossier-verify', 'delivery-helper'),
  createDossierCommandWrapper('review-artifact', 'delivery-helper'),
  createDossierCommandWrapper('dossier-step-close', 'delivery-helper'),
  createPostCloseHygieneCommand(),
  createDossierCommandWrapper('next-step', 'delivery-helper'),
  createDossierCommandWrapper('lifecycle-refresh', 'delivery-helper'),
];

const STAGE_COMMANDS: UnifiedCommand[] = [
  createStageControllerWrapper('spec-compact'),
  createStageControllerWrapper('plan-slice'),
  createStageControllerWrapper('implementation'),
  createStageControllerWrapper('change-proposal'),
];

const COMMANDS: UnifiedCommand[] = [...BACKLOG_COMMANDS, ...DOSSIER_COMMANDS, ...STAGE_COMMANDS];

const FAMILY_TITLES: Array<[UnifiedCommand['family'], string]> = [
  ['bootstrap', 'Bootstrap / root-management'],
  ['backlog-source', 'Backlog truth / source registry'],
  ['backlog-authoring', 'Backlog truth / authoring and mutation'],
  ['backlog-read', 'Backlog truth / read models'],
  ['delivery-stage', 'Delivery stage controllers'],
  ['delivery-helper', 'Delivery helpers / integrity / closure'],
];

function findUnifiedCommand(name: string): UnifiedCommand | undefined {
  return COMMANDS.find((command) => command.name === name || command.aliases?.includes(name));
}

function renderGlobalHelp(version: string): string {
  const lines = [
    `dossier-engineer ${version}`,
    '',
    'The only public utility for the dossier/backlog runtime.',
    '',
    'Usage:',
    '  dossier-engineer <command> [options]',
    '  dossier-engineer help [command]',
    '  dossier-engineer --help',
    '  dossier-engineer --version',
    '',
  ];

  for (const [family, title] of FAMILY_TITLES) {
    lines.push(`${title}:`);
    if (family === 'bootstrap') {
      lines.push('  help                   Show the shipped help surface or command-local help.');
    }
    for (const command of COMMANDS.filter((entry) => entry.family === family)) {
      const aliasSuffix =
        command.aliases && command.aliases.length > 0
          ? ` (aliases: ${command.aliases.join(', ')})`
          : '';
      lines.push(`  ${command.name.padEnd(22)} ${command.summary}${aliasSuffix}`);
    }
    lines.push('');
  }

  lines.push(
    'Notes:',
    '  - Stage-controller commands are mechanical progress controllers only.',
    '  - Authoritative closure remains `dossier-step-close` followed by `lifecycle-refresh` when telemetry refresh is needed.',
    '  - This runtime only supports the canonical `.dossier` + `docs/ssot` layout.',
  );

  return lines.join('\n');
}

export async function runUnifiedCli(
  argv: string[],
  io: CliIo,
  options: RunUnifiedCliOptions,
): Promise<number> {
  const [commandName, ...rest] = argv;

  if (!commandName || commandName === '--help' || commandName === '-h') {
    writeLine(io.stdout, renderGlobalHelp(options.version));
    return 0;
  }

  if (commandName === '--version') {
    writeLine(io.stdout, options.version);
    return 0;
  }

  if (commandName === 'help') {
    const target = rest[0];
    if (!target) {
      writeLine(io.stdout, renderGlobalHelp(options.version));
      return 0;
    }
    const command = findUnifiedCommand(target);
    if (!command) {
      writeLine(io.stderr, `Unknown command: ${target}`);
      return 2;
    }
    const helpLines = command.helpLines?.() ?? [
      command.summary,
      '',
      'Usage:',
      ...command.usage.map((line) => `  ${line}`),
    ];
    writeLine(io.stdout, helpLines.join('\n'));
    return 0;
  }

  const command = findUnifiedCommand(commandName);
  if (!command) {
    writeLine(io.stderr, `Unknown command: ${commandName}`);
    writeLine(io.stderr, 'Run `dossier-engineer --help` to list available commands.');
    return 2;
  }

  if (rest.includes('--help') || rest.includes('-h')) {
    const helpLines = command.helpLines?.() ?? [
      command.summary,
      '',
      'Usage:',
      ...command.usage.map((line) => `  ${line}`),
    ];
    writeLine(io.stdout, helpLines.join('\n'));
    return 0;
  }

  return command.execute(rest, io);
}
