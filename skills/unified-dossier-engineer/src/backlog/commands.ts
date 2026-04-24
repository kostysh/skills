import path from 'node:path';

import {
  ATTENTION_COMMAND,
  GAPS_COMMAND,
  ITEMS_COMMAND,
  LIST_SOURCES_COMMAND,
  PACKET_COMMAND,
  PATCH_ITEM_COMMAND,
  QUEUE_COMMAND,
  REGISTER_SOURCE_COMMAND,
  REMOVE_ITEM_COMMAND,
  REMOVE_SOURCE_COMMAND,
  REPORT_COMMAND,
  SEARCH_COMMAND,
  STATUS_COMMAND,
  TEMPLATE_COMMAND,
  UPDATE_SOURCE_PATH_COMMAND,
  type CommandDefinition,
} from '../vendor/backlog-engineer/commands/index.ts';
import { normalizeError, type BacklogError } from '../vendor/backlog-engineer/errors/index.ts';
import { createRuntime } from '../vendor/backlog-engineer/runtime/index.ts';
import type {
  AttentionCommandOutput,
  ItemsCommandOutput,
  QueueCommandOutput,
  SearchCommandOutput,
  SourceId,
  StateFile,
} from '../vendor/backlog-engineer/schemas/index.ts';
import type { CommandExecutionContext } from '../vendor/backlog-engineer/runtime/command-context.ts';
import {
  collectBlockedItemKeys,
  collectSourceReviewIdsByItemKey,
  createSourceReviewId,
  loadOpenSourceReviews,
  resolveSourceReview,
  sourceReviewDir,
  upsertOpenSourceReview,
  type SourceReviewRecord,
} from './source-review.ts';
import { initializeProcessRoot, resolveProcessRoot } from '../shared/process-root.ts';
import { assertManagedWritePath } from '../shared/path-guards.ts';
import type { CliJsonResult } from '../shared/cli-envelope.ts';
import { writeCliEnvelope } from '../shared/cli-envelope.ts';
import {
  collectLifecycleReconciliationDrifts,
  lifecycleDriftBlockedItemKeys,
  type LifecycleDrift,
} from '../shared/lifecycle-reconciliation.ts';

export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
};

export type UnifiedBacklogCommand = {
  aliases?: string[];
  commandType: 'backlog';
  execute: (args: string[], io: CliIo) => Promise<number>;
  family: 'backlog-authoring' | 'backlog-read' | 'backlog-source' | 'bootstrap';
  name: string;
  options?: string[];
  summary: string;
  usage: string[];
};

type BacklogCommandExecution<TOutput = unknown> = {
  context: CommandExecutionContext;
  output: TOutput;
  releaseMutationLock?: () => Promise<void>;
};

type BacklogPostSuccessEffect = {
  dataPatch?: Record<string, unknown>;
  nextCommands?: string[];
  result?: CliJsonResult;
  warnings?: string[];
};

function writeJson(stream: Pick<NodeJS.WriteStream, 'write'>, payload: unknown): void {
  stream.write(`${JSON.stringify(payload)}\n`);
}

function buildScopeFromArgs(
  args: string[],
  optionNames: string[] = [
    '--item-key',
    '--item-keys',
    '--source-id',
    '--source-label',
    '--source-path',
    '--path',
  ],
): Record<string, unknown> {
  const scope: Record<string, unknown> = {};
  for (const optionName of optionNames) {
    const value = takeOption(args, optionName);
    if (value !== null) {
      scope[optionName.slice(2).replaceAll('-', '_')] = value;
    }
  }
  return scope;
}

function shouldAcquireMutationLock(commandName: string, args: string[]): boolean {
  if (commandName === 'status') {
    return args.includes('--refresh');
  }
  return [
    'register-source',
    'update-source-path',
    'remove-source',
    'packet',
    'patch-item',
    'remove-item',
    'refresh',
    'report',
  ].includes(commandName);
}

function adaptUsage(usage: readonly string[]): string[] {
  return usage.map((entry) => entry.replaceAll('backlog-engineer', 'dossier-engineer'));
}

function adaptOptions<TInput, TOutput>(
  command: Pick<CommandDefinition<TInput, TOutput>, 'options'>,
): string[] {
  return command.options.map((option) => {
    const suffix = option.value_name ? ` ${option.value_name}` : '';
    return `${option.flags.join(', ')}${suffix} — ${option.description}`;
  });
}

function writeBacklogError(io: CliIo, error: BacklogError): number {
  writeJson(io.stderr, error.toPayload());
  return error.exitCode;
}

async function runVendoredBacklogCommand<TInput, TOutput>(
  command: CommandDefinition<TInput, TOutput>,
  args: string[],
  options: { deferMutationUnlock?: boolean } = {},
): Promise<BacklogCommandExecution<TOutput>> {
  const input = command.parseArgs(args);
  const runtime = createRuntime();
  const commandName = command.name;
  const context = await runtime.createContext(commandName, runtime.getProcessCwd());
  const vendoredReleaseMutationLock =
    context.backlogRoot && shouldAcquireMutationLock(command.name, args)
      ? await context.acquireMutationLock(commandName)
      : undefined;
  let released = false;
  const releaseMutationLock = async () => {
    if (released) {
      return;
    }
    released = true;
    await vendoredReleaseMutationLock?.();
  };
  try {
    const output = command.outputSchema.parse(await command.execute(input, context));
    if (options.deferMutationUnlock) {
      return { context, output, releaseMutationLock };
    }
    await releaseMutationLock();
    return { context, output };
  } catch (error) {
    await releaseMutationLock();
    throw error;
  }
}

function collectItemSourceIds(item: StateFile['items'][number]): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function resolveRefreshScope(payload: {
  args: string[];
  context: CommandExecutionContext;
  registry: Awaited<ReturnType<CommandExecutionContext['artifacts']['readSourceRegistry']>>;
  state: StateFile;
}): Promise<{ selectedSourceIds: SourceId[] }> {
  const itemKey = takeOption(payload.args, '--item-key');
  const sourceId = takeOption(payload.args, '--source-id');
  const sourceLabel = takeOption(payload.args, '--source-label');
  const sourcePath = takeOption(payload.args, '--source-path');
  const selectors = [itemKey, sourceId, sourceLabel, sourcePath].filter(Boolean);
  if (selectors.length > 1) {
    throw new Error('Use only one selector for refresh.');
  }
  if (!payload.context.backlogRoot) {
    throw new Error('Backlog root not available.');
  }

  if (itemKey) {
    const item = payload.state.items.find((entry) => entry.item_key === itemKey);
    if (!item) {
      throw new Error(`Unknown item key: ${itemKey}`);
    }
    return Promise.resolve({
      selectedSourceIds: [...collectItemSourceIds(item)].sort((left, right) =>
        left.localeCompare(right),
      ),
    });
  }

  if (sourceId || sourceLabel || sourcePath) {
    const scope = payload.context.sources.resolveSourceScope({
      backlogRoot: payload.context.backlogRoot,
      state: payload.state,
      registry: payload.registry,
      selector: sourceId
        ? { kind: 'source_id', source_id: sourceId }
        : sourceLabel
          ? { kind: 'source_label', source_label: sourceLabel }
          : {
              kind: 'source_path',
              source_path: payload.context.host.resolveCliPath(sourcePath ?? ''),
            },
    });
    return Promise.resolve({
      selectedSourceIds: scope.sourceIds,
    });
  }

  return Promise.resolve({
    selectedSourceIds: payload.registry.sources.map((source) => source.source_id),
  });
}

function relatedItemKeysForSource(state: StateFile, sourceId: string): string[] {
  return state.items
    .filter((item) => collectItemSourceIds(item).has(sourceId))
    .map((item) => item.item_key)
    .sort((left, right) => left.localeCompare(right));
}

async function maybeResolveSourceReviewsFromItemKeys(payload: {
  itemKeys: readonly string[];
  kind: 'packet' | 'patch-item';
  resolutionRef: string;
  root: string;
}): Promise<SourceReviewRecord[]> {
  const openReviews = await loadOpenSourceReviews(payload.root);
  const itemKeySet = new Set(payload.itemKeys);
  const resolved: SourceReviewRecord[] = [];
  for (const review of openReviews) {
    if (!review.linked_item_keys.some((itemKey) => itemKeySet.has(itemKey))) {
      continue;
    }
    if (!review.linked_item_keys.every((itemKey) => itemKeySet.has(itemKey))) {
      continue;
    }
    resolved.push(
      await resolveSourceReview({
        root: payload.root,
        sourceReviewId: review.source_review_id,
        outcome: payload.kind === 'packet' ? 'created_new_item' : 'patched_existing_items',
        resolutionKind: payload.kind,
        resolutionRef: payload.resolutionRef,
        now: new Date().toISOString(),
      }),
    );
  }
  return resolved;
}

async function maybeResolveSourceReviewsFromSourceId(payload: {
  kind: 'remove-source' | 'update-source-path';
  resolutionRef: string;
  root: string;
  sourceId: string;
}): Promise<SourceReviewRecord[]> {
  const openReviews = await loadOpenSourceReviews(payload.root);
  const matching = openReviews.filter((review) => review.source_id === payload.sourceId);
  const resolved: SourceReviewRecord[] = [];
  for (const review of matching) {
    resolved.push(
      await resolveSourceReview({
        root: payload.root,
        sourceReviewId: review.source_review_id,
        outcome: 'source_maintenance',
        resolutionKind: payload.kind,
        resolutionRef: payload.resolutionRef,
        now: new Date().toISOString(),
      }),
    );
  }
  return resolved;
}

function overlayItemsWithSourceReviewBlock(
  items: ItemsCommandOutput,
  openReviews: readonly SourceReviewRecord[],
): Array<Record<string, unknown>> {
  const blockedItemKeys = collectBlockedItemKeys(openReviews);
  const reviewIdsByItemKey = collectSourceReviewIdsByItemKey(openReviews);
  return items.map((card) => ({
    ...card,
    computed_state: {
      ...card.computed_state,
      ready_for_next_step: blockedItemKeys.has(card.item.item_key)
        ? false
        : card.computed_state.ready_for_next_step,
    },
    source_review_blocked: blockedItemKeys.has(card.item.item_key),
    open_source_review_ids: reviewIdsByItemKey.get(card.item.item_key) ?? [],
  }));
}

function overlayQueueWithSourceReviewBlock(
  queue: QueueCommandOutput,
  openReviews: readonly SourceReviewRecord[],
  lifecycleBlockedItemKeys: ReadonlySet<string> = new Set(),
): Array<Record<string, unknown>> {
  const blockedItemKeys = collectBlockedItemKeys(openReviews);
  return queue
    .map((chain) => ({
      ...chain,
      items: chain.items.filter(
        (itemKey) => !blockedItemKeys.has(itemKey) && !lifecycleBlockedItemKeys.has(itemKey),
      ),
    }))
    .filter((chain) => chain.items.length > 0);
}

function overlaySearchWithSourceReviewBlock(
  results: SearchCommandOutput,
  openReviews: readonly SourceReviewRecord[],
): Array<Record<string, unknown>> {
  const blockedItemKeys = collectBlockedItemKeys(openReviews);
  return results.map((entry) => ({
    ...entry,
    ready_for_next_step: blockedItemKeys.has(entry.item_key) ? false : entry.ready_for_next_step,
    source_review_blocked: blockedItemKeys.has(entry.item_key),
  }));
}

function buildAttentionOutput(payload: {
  itemAttention: AttentionCommandOutput;
  openReviews: readonly SourceReviewRecord[];
}): Array<Record<string, unknown>> {
  const sourceReviewEntries = payload.openReviews.map((review) => ({
    entry_kind: 'source_review',
    source_review_id: review.source_review_id,
    source_id: review.source_id,
    source_label: review.source_label,
    linked_item_keys: review.linked_item_keys,
    linked_item_count: review.linked_item_count,
    status: review.status,
    next_commands: [
      'dossier-engineer attention',
      `dossier-engineer items --item-keys ${
        review.linked_item_keys.length > 0 ? review.linked_item_keys.join(',') : '<item-key>'
      }`,
      `dossier-engineer ack-source-review --source-review-id ${review.source_review_id}`,
    ],
  }));
  const itemEntries = payload.itemAttention.map((entry) => ({
    entry_kind: 'item',
    ...entry,
  }));
  return [...sourceReviewEntries, ...itemEntries];
}

function buildStatusOutput(payload: {
  adjustedReadyForNextStepCount: number;
  baseStatus: Record<string, unknown>;
  lifecycleDrifts: readonly LifecycleDrift[];
  openReviews: readonly SourceReviewRecord[];
}): Record<string, unknown> {
  const blockedItemCount = collectBlockedItemKeys(payload.openReviews).size;
  return {
    ...payload.baseStatus,
    ready_for_next_step_count: payload.adjustedReadyForNextStepCount,
    open_source_review_count: payload.openReviews.length,
    source_review_blocked_item_count: blockedItemCount,
    lifecycle_reconciliation_drift_count: payload.lifecycleDrifts.length,
    lifecycle_reconciliation_drifts: payload.lifecycleDrifts,
  };
}

function takeOption(args: string[], name: string): string | null {
  const exact = args.indexOf(name);
  if (exact !== -1) {
    const value = args[exact + 1];
    if (!value || value.startsWith('--')) {
      return null;
    }
    return value;
  }
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : null;
}

async function runInitCommand(args: string[], io: CliIo): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    io.stdout.write('dossier-engineer init --path <path>\n');
    return 0;
  }
  const outputPath = takeOption(args, '--path');
  if (!outputPath) {
    writeJson(io.stderr, {
      error: {
        code: 'UDE_USAGE',
        message: '--path is required.',
      },
    });
    return 2;
  }

  try {
    const root = path.resolve(process.cwd(), outputPath);
    const result = await initializeProcessRoot(root);
    writeCliEnvelope(io.stdout, {
      command: 'init',
      scope: { path: root },
      data: {
        path: root,
        process_manifest_path: result.processManifestPath,
        backlog_manifest_path: result.backlogManifestPath,
        index_path: result.indexFilePath,
        dossiers_dir: result.dossiersDirPath,
      },
      nextCommands: ['dossier-engineer register-source --path <path> --kind spec --authority repo'],
    });
    return 0;
  } catch (error) {
    writeJson(io.stderr, {
      error: {
        code: 'UDE_INIT_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return 1;
  }
}

async function runRefreshCommand(args: string[], io: CliIo): Promise<number> {
  try {
    const runtime = createRuntime();
    const context = await runtime.createContext('refresh', runtime.getProcessCwd());
    if (!context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const releaseMutationLock = await context.acquireMutationLock('refresh');
    try {
      const [state, registry] = await Promise.all([
        context.ensureMutationState(),
        context.artifacts.readSourceRegistry(context.backlogRoot),
      ]);
      const { selectedSourceIds } = await resolveRefreshScope({
        args,
        context,
        registry,
        state,
      });
      const changedBefore = new Map(
        registry.sources.map((source) => [source.source_id, source.hash]),
      );
      const refreshed = await context.sources.refreshSourceHashes({
        backlogRoot: context.backlogRoot,
        registry,
        selectedSourceIds,
      });
      const refreshTs = new Date().toISOString();
      await context.artifacts.writeSourceRegistry(context.backlogRoot, refreshed.registry);
      await context.artifacts.writeState(context.backlogRoot, {
        ...state,
        last_refresh_at: refreshTs,
        updated_at: refreshTs,
      });

      const createdIds: string[] = [];
      const updatedIds: string[] = [];
      const reviewRecords: SourceReviewRecord[] = [];
      for (const changed of refreshed.changedSources) {
        const currentSource = refreshed.registry.sources.find(
          (source) => source.source_id === changed.source_id,
        );
        if (!currentSource) {
          continue;
        }
        const result = await upsertOpenSourceReview({
          root: context.backlogRoot,
          sourceId: currentSource.source_id,
          sourceLabel: currentSource.source_label,
          previousHash: changedBefore.get(currentSource.source_id) ?? currentSource.hash,
          currentHash: currentSource.hash,
          linkedItemKeys: relatedItemKeysForSource(state, currentSource.source_id),
          now: refreshTs,
        });
        if (result.created) {
          createdIds.push(result.record.source_review_id);
        } else if (result.updated) {
          updatedIds.push(result.record.source_review_id);
        }
        reviewRecords.push(result.record);
      }

      writeCliEnvelope(io.stdout, {
        command: 'refresh',
        scope: buildScopeFromArgs(args, [
          '--item-key',
          '--source-id',
          '--source-label',
          '--source-path',
        ]),
        data: {
          changed_sources: refreshed.changedSources,
          source_reviews_created: createdIds.length,
          source_reviews_updated: updatedIds.length,
          source_review_ids: [...createdIds, ...updatedIds].sort((left, right) =>
            left.localeCompare(right),
          ),
        },
        nextCommands: [
          'dossier-engineer attention',
          ...reviewRecords
            .filter((review) => review.linked_item_keys.length > 0)
            .map(
              (review) => `dossier-engineer items --item-keys ${review.linked_item_keys.join(',')}`,
            ),
        ],
      });
      return 0;
    } finally {
      await releaseMutationLock();
    }
  } catch (error) {
    writeJson(io.stderr, {
      error: {
        code: 'UDE_REFRESH_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return 1;
  }
}

async function runStatusCommand(args: string[], io: CliIo): Promise<number> {
  try {
    if (args.includes('--refresh')) {
      const refreshIo: CliIo = {
        stdout: {
          write() {
            return true;
          },
        },
        stderr: io.stderr,
      };
      const refreshExit = await runRefreshCommand([], refreshIo);
      if (refreshExit !== 0) {
        return refreshExit;
      }
    }
    const status = (
      await runVendoredBacklogCommand(
        STATUS_COMMAND,
        args.filter((arg) => arg !== '--refresh'),
      )
    ).output as Record<string, unknown>;
    const runtime = createRuntime();
    const context = await runtime.createContext('status', runtime.getProcessCwd());
    if (!context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const openReviews = await loadOpenSourceReviews(context.backlogRoot);
    const { state } = await context.ensureQueryState();
    const blockedItemKeys = collectBlockedItemKeys(openReviews);
    const lifecycleDrifts = await collectLifecycleReconciliationDrifts({
      root: context.backlogRoot,
      state,
    });
    const lifecycleBlockedItemKeys = lifecycleDriftBlockedItemKeys(lifecycleDrifts);
    const adjustedReadyForNextStepCount = state.items.filter(
      (item) =>
        item.ready_for_next_step &&
        !blockedItemKeys.has(item.item_key) &&
        !lifecycleBlockedItemKeys.has(item.item_key),
    ).length;
    writeCliEnvelope(io.stdout, {
      command: 'status',
      data: buildStatusOutput({
        adjustedReadyForNextStepCount,
        baseStatus: status,
        lifecycleDrifts,
        openReviews,
      }),
    });
    return 0;
  } catch (error) {
    if (isBacklogCommandError(error)) {
      return writeBacklogError(io, normalizeError(error));
    }
    writeJson(io.stderr, {
      error: {
        code: 'UDE_STATUS_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return 1;
  }
}

async function runAttentionCommand(_args: string[], io: CliIo): Promise<number> {
  try {
    const result = await runVendoredBacklogCommand(ATTENTION_COMMAND, []);
    if (!result.context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
    writeCliEnvelope(io.stdout, {
      command: 'attention',
      data: buildAttentionOutput({
        itemAttention: result.output,
        openReviews,
      }),
      nextCommands: ['dossier-engineer items --item-keys <item_key>'],
    });
    return 0;
  } catch (error) {
    return writeBacklogError(io, normalizeError(error));
  }
}

async function runItemsCommand(args: string[], io: CliIo): Promise<number> {
  try {
    const result = await runVendoredBacklogCommand(ITEMS_COMMAND, args);
    if (!result.context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
    writeCliEnvelope(io.stdout, {
      command: 'items',
      scope: buildScopeFromArgs(args, ['--item-keys']),
      data: overlayItemsWithSourceReviewBlock(result.output, openReviews),
    });
    return 0;
  } catch (error) {
    return writeBacklogError(io, normalizeError(error));
  }
}

async function runQueueCommand(args: string[], io: CliIo): Promise<number> {
  try {
    const result = await runVendoredBacklogCommand(QUEUE_COMMAND, args);
    if (!result.context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
    const { state } = await result.context.ensureQueryState();
    const lifecycleDrifts = await collectLifecycleReconciliationDrifts({
      root: result.context.backlogRoot,
      state,
    });
    const lifecycleBlockedItemKeys = lifecycleDriftBlockedItemKeys(lifecycleDrifts);
    writeCliEnvelope(io.stdout, {
      command: 'queue',
      data: overlayQueueWithSourceReviewBlock(result.output, openReviews, lifecycleBlockedItemKeys),
      warnings:
        lifecycleBlockedItemKeys.size > 0
          ? [
              `Lifecycle reconciliation drift blocked queue items: ${[
                ...lifecycleBlockedItemKeys,
              ].join(', ')}`,
            ]
          : [],
    });
    return 0;
  } catch (error) {
    return writeBacklogError(io, normalizeError(error));
  }
}

async function runSearchCommand(args: string[], io: CliIo): Promise<number> {
  try {
    const result = await runVendoredBacklogCommand(SEARCH_COMMAND, args);
    if (!result.context.backlogRoot) {
      throw new Error('Backlog root not found.');
    }
    const openReviews = await loadOpenSourceReviews(result.context.backlogRoot);
    writeCliEnvelope(io.stdout, {
      command: 'search',
      data: overlaySearchWithSourceReviewBlock(result.output, openReviews),
    });
    return 0;
  } catch (error) {
    return writeBacklogError(io, normalizeError(error));
  }
}

async function runAckSourceReviewCommand(args: string[], io: CliIo): Promise<number> {
  const sourceReviewId = takeOption(args, '--source-review-id');
  const sourceId = takeOption(args, '--source-id');
  if (!sourceReviewId && !sourceId) {
    writeJson(io.stderr, {
      error: {
        code: 'UDE_USAGE',
        message: '--source-review-id or --source-id is required.',
      },
    });
    return 2;
  }

  try {
    const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
    const runtime = createRuntime();
    const context = await runtime.createContext('refresh', root);
    const releaseMutationLock = context.backlogRoot
      ? await context.acquireMutationLock('refresh')
      : undefined;
    const reviewId = sourceReviewId ?? createSourceReviewId(sourceId ?? '');
    try {
      const record = await resolveSourceReview({
        root,
        sourceReviewId: reviewId,
        outcome: 'no_backlog_change',
        resolutionKind: 'ack',
        resolutionRef: 'ack-source-review',
        now: new Date().toISOString(),
      });
      writeCliEnvelope(io.stdout, {
        command: 'ack-source-review',
        scope: {
          ...(sourceReviewId ? { source_review_id: sourceReviewId } : {}),
          ...(sourceId ? { source_id: sourceId } : {}),
        },
        data: record,
        nextCommands: ['dossier-engineer status'],
      });
      return 0;
    } finally {
      await releaseMutationLock?.();
    }
  } catch (error) {
    writeJson(io.stderr, {
      error: {
        code: 'UDE_SOURCE_REVIEW_ACK_FAILED',
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return 1;
  }
}

function isBacklogCommandError(error: unknown): boolean {
  return error instanceof Error;
}

function createVendoredCommandWrapper<TInput, TOutput>(
  command: CommandDefinition<TInput, TOutput>,
  family: UnifiedBacklogCommand['family'],
  afterSuccess?: (payload: {
    context: CommandExecutionContext;
    output: TOutput;
  }) => Promise<undefined | BacklogPostSuccessEffect>,
): UnifiedBacklogCommand {
  return {
    name: command.name,
    commandType: 'backlog',
    family,
    summary: command.summary,
    usage: adaptUsage(command.usage),
    options: adaptOptions(command),
    async execute(args, io) {
      try {
        if (afterSuccess) {
          const root = await resolveProcessRoot(process.cwd(), takeOption(args, '--root'));
          await assertManagedWritePath(
            root,
            sourceReviewDir(root),
            path.join(sourceReviewDir(root), '.probe.json'),
            'source-review artifact',
          );
        }
        const result = await runVendoredBacklogCommand(command, args, {
          deferMutationUnlock: Boolean(afterSuccess),
        });
        const warnings: string[] = [];
        let nextCommands: string[] = [];
        let envelopeResult: CliJsonResult = 'ok';
        let data: unknown = result.output;
        try {
          if (afterSuccess) {
            try {
              const effect = await afterSuccess({
                context: result.context,
                output: result.output,
              });
              if (effect?.dataPatch && data && typeof data === 'object' && !Array.isArray(data)) {
                data = {
                  ...(data as Record<string, unknown>),
                  ...effect.dataPatch,
                };
              }
              if (effect?.warnings) {
                warnings.push(...effect.warnings);
              }
              if (effect?.nextCommands) {
                nextCommands = effect.nextCommands;
              }
              if (effect?.result) {
                envelopeResult = effect.result;
              }
            } catch (error) {
              warnings.push(
                `Primary backlog mutation succeeded, but source-review cleanup failed: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
              envelopeResult = 'partial_success';
            }
          }
        } finally {
          await result.releaseMutationLock?.();
        }
        writeCliEnvelope(io.stdout, {
          command: command.name,
          scope: buildScopeFromArgs(args),
          data,
          nextCommands,
          result: envelopeResult,
          warnings,
        });
        return 0;
      } catch (error) {
        if (
          error instanceof Error &&
          /(symlinked path components|must stay inside|safe single filesystem segment)/i.test(
            error.message,
          )
        ) {
          writeJson(io.stderr, {
            error: {
              code: 'UDE_BACKLOG_PRECHECK_FAILED',
              message: error.message,
            },
          });
          return 1;
        }
        return writeBacklogError(io, normalizeError(error));
      }
    },
  };
}

export const BACKLOG_COMMANDS: UnifiedBacklogCommand[] = [
  {
    name: 'init',
    commandType: 'backlog',
    family: 'bootstrap',
    summary: 'Initialize the process root, backlog subroot, and SSOT skeleton.',
    usage: ['dossier-engineer init --path <path>'],
    options: ['--path <path> — Process root directory to initialize.'],
    execute: runInitCommand,
  },
  createVendoredCommandWrapper(REGISTER_SOURCE_COMMAND, 'backlog-source'),
  createVendoredCommandWrapper(LIST_SOURCES_COMMAND, 'backlog-source'),
  createVendoredCommandWrapper(
    UPDATE_SOURCE_PATH_COMMAND,
    'backlog-source',
    async ({ context, output }) => {
      if (!context.backlogRoot || !output.source_id) {
        return;
      }
      const resolved = await maybeResolveSourceReviewsFromSourceId({
        root: context.backlogRoot,
        sourceId: output.source_id,
        kind: 'update-source-path',
        resolutionRef: `update-source-path:${String(output.path ?? '')}`,
      });
      return {
        dataPatch: {
          resolved_source_review_ids: resolved.map((review) => review.source_review_id),
          resolution_kind: 'update-source-path',
        },
      };
    },
  ),
  createVendoredCommandWrapper(
    REMOVE_SOURCE_COMMAND,
    'backlog-source',
    async ({ context, output }) => {
      if (!context.backlogRoot || !output.source_id) {
        return;
      }
      const resolved = await maybeResolveSourceReviewsFromSourceId({
        root: context.backlogRoot,
        sourceId: output.source_id,
        kind: 'remove-source',
        resolutionRef: `remove-source:${String(output.source_id)}`,
      });
      return {
        dataPatch: {
          resolved_source_review_ids: resolved.map((review) => review.source_review_id),
          resolution_kind: 'remove-source',
        },
      };
    },
  ),
  {
    name: 'refresh',
    commandType: 'backlog',
    family: 'backlog-source',
    summary: 'Refresh source hashes and open/update source-review records.',
    usage: [
      'dossier-engineer refresh',
      'dossier-engineer refresh --item-key <item_key>',
      'dossier-engineer refresh --source-id <source_id>',
      'dossier-engineer refresh --source-label <source_label>',
      'dossier-engineer refresh --source-path <path>',
    ],
    options: [
      '--item-key <item_key> — Refresh sources linked to one backlog item.',
      '--source-id <source_id> — Refresh one registered source by ID.',
      '--source-label <source_label> — Refresh one registered source by label.',
      '--source-path <path> — Refresh one registered source by path.',
    ],
    execute: runRefreshCommand,
  },
  {
    name: 'ack-source-review',
    commandType: 'backlog',
    family: 'backlog-source',
    summary: 'Close an open source-review record as an explicit no-op.',
    usage: [
      'dossier-engineer ack-source-review --source-review-id <id>',
      'dossier-engineer ack-source-review --source-id <source_id>',
    ],
    options: [
      '--source-review-id <id> — Source-review record to close.',
      '--source-id <source_id> — Resolve the record for one source ID.',
    ],
    execute: runAckSourceReviewCommand,
  },
  createVendoredCommandWrapper(TEMPLATE_COMMAND, 'backlog-authoring'),
  createVendoredCommandWrapper(PACKET_COMMAND, 'backlog-authoring', async ({ context, output }) => {
    if (!context.backlogRoot) {
      return undefined;
    }
    const itemKeys = [...(output.added ?? []), ...(output.removed ?? [])] as string[];
    await maybeResolveSourceReviewsFromItemKeys({
      root: context.backlogRoot,
      itemKeys,
      kind: 'packet',
      resolutionRef: String(
        output.authored_packet_path ?? output.canonical_packet_path ?? 'packet',
      ),
    });
    return undefined;
  }),
  createVendoredCommandWrapper(
    PATCH_ITEM_COMMAND,
    'backlog-authoring',
    async ({ context, output }) => {
      if (!context.backlogRoot) {
        return undefined;
      }
      await maybeResolveSourceReviewsFromItemKeys({
        root: context.backlogRoot,
        itemKeys: output.updated ?? [],
        kind: 'patch-item',
        resolutionRef: String(
          output.authored_patch_path ?? output.canonical_patch_path ?? 'patch-item',
        ),
      });
      return undefined;
    },
  ),
  createVendoredCommandWrapper(REMOVE_ITEM_COMMAND, 'backlog-authoring'),
  {
    name: 'status',
    commandType: 'backlog',
    family: 'backlog-read',
    summary: 'Show backlog status with source-review blocking signals.',
    usage: ['dossier-engineer status [--refresh]'],
    options: ['--refresh — Refresh source hashes before returning the status summary.'],
    execute: runStatusCommand,
  },
  createVendoredCommandWrapper(REPORT_COMMAND, 'backlog-read'),
  {
    name: 'items',
    commandType: 'backlog',
    family: 'backlog-read',
    summary: 'Return backlog item cards with source-review readiness overlay.',
    usage: ['dossier-engineer items --item-keys <item_key_1>,<item_key_2>'],
    options: ['--item-keys <item_key_1>,<item_key_2> — Comma-separated backlog item keys.'],
    execute: runItemsCommand,
  },
  {
    name: 'search',
    commandType: 'backlog',
    family: 'backlog-read',
    summary: 'Search backlog items with source-review readiness overlay.',
    usage: ['dossier-engineer search [filters]'],
    options: ['See `dossier-engineer help search` for the full filter surface.'],
    execute: runSearchCommand,
  },
  createVendoredCommandWrapper(GAPS_COMMAND, 'backlog-read'),
  {
    name: 'queue',
    commandType: 'backlog',
    family: 'backlog-read',
    summary: 'Return queue chains after excluding source-review blocked items.',
    usage: ['dossier-engineer queue'],
    execute: runQueueCommand,
  },
  {
    name: 'attention',
    commandType: 'backlog',
    family: 'backlog-read',
    summary: 'Return open source-review records first, then generic item attention entries.',
    usage: ['dossier-engineer attention'],
    execute: runAttentionCommand,
  },
];
