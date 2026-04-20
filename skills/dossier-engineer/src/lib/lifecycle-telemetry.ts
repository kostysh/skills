import path from 'node:path';

import { parseFrontmatter } from './frontmatter.ts';
import { fileExists, readText, walk, writeJsonAtomic, writeTextAtomic } from './fs-utils.ts';

export const LIFECYCLE_STAGES = [
  'feature-intake',
  'spec-compact',
  'plan-slice',
  'implementation',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export interface LifecycleRefreshOptions {
  featureCycleId?: string | null;
  featureId: string;
  root: string;
}

interface EventRecord extends Record<string, unknown> {
  status?: string;
  verdict?: string;
  invalidated?: boolean;
  allowed_by_policy?: boolean;
  rerun_reason?: string;
}

export interface SessionIndexRecord {
  backlog_item_key: string | null;
  end_ts: string | null;
  feature_cycle_id: string;
  feature_id: string;
  session_id: string | null;
  stage: LifecycleStage;
  stage_log_path: string;
  start_ts: string | null;
  trace_locator_kind: string;
  trace_runtime: string;
  version: 1;
}

export interface LifecycleRefreshResult {
  featureCycleId: string;
  featureId: string;
  metricsPath: string;
  sessionIndexPath: string;
  snapshot: LifecycleSnapshot;
}

interface ParsedLifecycleLog {
  backlogItemKey: string | null;
  cycleId: string | null;
  featureCycleId: string;
  featureId: string;
  finalPassTs: string | null;
  firstReviewAgentStartedTs: string | null;
  intakeProcessCompleteTs: string | null;
  localGatesGreenTs: string | null;
  metadata: Record<string, unknown>;
  path: string;
  pathRel: string;
  processCompleteTs: string | null;
  sessionId: string | null;
  stage: LifecycleStage;
  startTs: string | null;
  stepArtifact: string | null;
  stepCloseTs: string | null;
  traceLocatorKind: string;
  traceRuntime: string;
}

interface StageAggregate {
  backlogEvents: EventRecord[];
  cycleIds: string[];
  finalPassTs: string | null;
  firstReviewAgentStartedTs: string | null;
  hardIncidentEvents: EventRecord[];
  intakeProcessCompleteTs: string | null;
  localGatesGreenTs: string | null;
  logPaths: string[];
  operatorInterventions: EventRecord[];
  processCompleteTs: string | null;
  processMissEvents: EventRecord[];
  reviewEvents: EventRecord[];
  sessionIds: string[];
  startTs: string | null;
  stepArtifacts: string[];
  stepCloseTs: string | null;
  verificationEvents: EventRecord[];
}

interface LifecycleSnapshot {
  feature_cycle_id: string;
  feature_id: string;
  generated_at: string;
  identity: {
    backlog_item_key: string | null;
    feature_cycle_id: string;
    feature_id: string;
  };
  lifecycle: {
    feature_cycle_time_ms: number | null;
    intake: {
      cycle_ids: string[];
      intake_process_complete_ts: string | null;
      log_paths: string[];
      session_ids: string[];
      start_ts: string | null;
    };
    stages: Record<
      string,
      {
        cycle_ids: string[];
        final_pass_ts: string | null;
        first_review_agent_started_ts: string | null;
        local_gates_green_ts: string | null;
        log_paths: string[];
        process_complete_ts: string | null;
        session_ids: string[];
        start_ts: string | null;
        step_artifacts: string[];
        step_close_ts: string | null;
      }
    >;
  };
  metrics: {
    backlog_actualization_failures_total: number;
    closure_latency_ms: number | null;
    first_pass_close: boolean | null;
    operator_interventions_total: number;
    phase_cycle_time_ms: Record<string, number | null>;
    rerounds_per_feature: number;
    review_loop_time_ms: number | null;
    verification_failures_total: number;
  };
  session_index_records: SessionIndexRecord[];
  version: 1;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toEventRecords(value: unknown): EventRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is EventRecord => item !== null && typeof item === 'object')
    : [];
}

function toStringArray(values: Iterable<string | null | undefined>): string[] {
  return [...new Set([...values].filter((value): value is string => Boolean(value)).map(String))].sort();
}

function parseTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function diffMillis(start: string | null, end: string | null): number | null {
  const startMs = parseTimestamp(start);
  const endMs = parseTimestamp(end);
  return startMs === null || endMs === null ? null : Math.max(0, endMs - startMs);
}

function earliestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values.filter((value): value is string => parseTimestamp(value ?? null) !== null);
  if (valid.length === 0) {
    return null;
  }
  valid.sort((left, right) => (parseTimestamp(left) ?? 0) - (parseTimestamp(right) ?? 0));
  return valid[0] ?? null;
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values.filter((value): value is string => parseTimestamp(value ?? null) !== null);
  if (valid.length === 0) {
    return null;
  }
  valid.sort((left, right) => (parseTimestamp(left) ?? 0) - (parseTimestamp(right) ?? 0));
  return valid.at(-1) ?? null;
}

function compareByTimestamp(left: ParsedLifecycleLog, right: ParsedLifecycleLog): number {
  return (parseTimestamp(left.startTs) ?? 0) - (parseTimestamp(right.startTs) ?? 0);
}

function stableString(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function readLifecycleLog(root: string, absPath: string): Promise<ParsedLifecycleLog | null> {
  const content = await readText(absPath);
  const metadata = parseFrontmatter(content);
  if (!metadata) {
    return null;
  }

  const featureId = toNullableString(metadata.feature_id);
  const featureCycleId = toNullableString(metadata.feature_cycle_id);
  const stage =
    toNullableString(metadata.command) === 'feature-intake'
      ? 'feature-intake'
      : toNullableString(metadata.stage);

  if (!featureId || !featureCycleId || !stage || !LIFECYCLE_STAGES.includes(stage as LifecycleStage)) {
    return null;
  }

  return {
    path: absPath,
    pathRel: path.relative(root, absPath).split(path.sep).join('/'),
    metadata,
    featureId,
    featureCycleId,
    stage: stage as LifecycleStage,
    cycleId: toNullableString(metadata.cycle_id),
    backlogItemKey: toNullableString(metadata.backlog_item_key),
    sessionId: toNullableString(metadata.session_id),
    traceRuntime: toNullableString(metadata.trace_runtime) ?? 'codex',
    traceLocatorKind: toNullableString(metadata.trace_locator_kind) ?? 'session_id',
    startTs: toNullableString(metadata.start_ts),
    intakeProcessCompleteTs: toNullableString(metadata.intake_process_complete_ts),
    localGatesGreenTs: toNullableString(metadata.local_gates_green_ts),
    processCompleteTs: toNullableString(metadata.process_complete_ts),
    stepCloseTs: toNullableString(metadata.step_close_ts),
    stepArtifact: toNullableString(metadata.step_artifact),
    firstReviewAgentStartedTs: toNullableString(metadata.first_review_agent_started_ts),
    finalPassTs: toNullableString(metadata.final_pass_ts),
  };
}

async function loadLifecycleLogs(root: string, featureId: string): Promise<ParsedLifecycleLog[]> {
  const logsRoot = path.join(root, '.dossier', 'logs');
  if (!(await fileExists(logsRoot))) {
    return [];
  }

  const files = await walk(logsRoot, [], {
    includeFile: (filePath) => filePath.endsWith('.md'),
    rootDir: logsRoot,
  });

  const logs: ParsedLifecycleLog[] = [];
  for (const filePath of files.sort()) {
    const parsed = await readLifecycleLog(root, filePath);
    if (parsed?.featureId === featureId) {
      logs.push(parsed);
    }
  }
  return logs;
}

function chooseFeatureCycleId(logs: ParsedLifecycleLog[], requested: string | null | undefined): string {
  if (requested) {
    return requested;
  }
  const ids = [...new Set(logs.map((log) => log.featureCycleId))].sort();
  if (ids.length === 1 && ids[0]) {
    return ids[0];
  }
  throw new Error(
    ids.length === 0
      ? 'No lifecycle logs with feature_cycle_id were found for the requested feature.'
      : `Multiple feature_cycle_id values exist for this feature (${ids.join(', ')}). Pass --feature-cycle-id explicitly.`,
  );
}

function aggregateStage(logs: ParsedLifecycleLog[]): StageAggregate {
  const sorted = [...logs].sort(compareByTimestamp);

  return {
    cycleIds: toStringArray(sorted.map((log) => log.cycleId)),
    logPaths: sorted.map((log) => log.pathRel),
    sessionIds: toStringArray(sorted.map((log) => log.sessionId)),
    stepArtifacts: toStringArray(sorted.map((log) => log.stepArtifact)),
    startTs: sorted.find((log) => log.startTs)?.startTs ?? null,
    intakeProcessCompleteTs:
      [...sorted].reverse().find((log) => log.intakeProcessCompleteTs)?.intakeProcessCompleteTs ?? null,
    localGatesGreenTs:
      [...sorted].reverse().find((log) => log.localGatesGreenTs)?.localGatesGreenTs ?? null,
    processCompleteTs: [...sorted].reverse().find((log) => log.processCompleteTs)?.processCompleteTs ?? null,
    stepCloseTs:
      [...sorted].reverse().find((log) => log.stepCloseTs)?.stepCloseTs ?? null,
    firstReviewAgentStartedTs:
      sorted.find((log) => log.firstReviewAgentStartedTs)?.firstReviewAgentStartedTs ?? null,
    finalPassTs: [...sorted].reverse().find((log) => log.finalPassTs)?.finalPassTs ?? null,
    reviewEvents: sorted.flatMap((log) => toEventRecords(log.metadata.review_events)),
    verificationEvents: sorted.flatMap((log) => toEventRecords(log.metadata.verification_events)),
    backlogEvents: sorted.flatMap((log) => toEventRecords(log.metadata.backlog_events)),
    operatorInterventions: sorted.flatMap((log) => toEventRecords(log.metadata.operator_interventions)),
    processMissEvents: sorted.flatMap((log) => toEventRecords(log.metadata.process_miss_events)),
    hardIncidentEvents: sorted.flatMap((log) => toEventRecords(log.metadata.hard_incident_events)),
  };
}

async function validateImplementationLogEnd(
  root: string,
  featureId: string,
  log: Pick<ParsedLifecycleLog, 'processCompleteTs' | 'stepArtifact'>,
): Promise<string | null> {
  if (!log.processCompleteTs || !log.stepArtifact) {
    return null;
  }

  const absPath = path.resolve(root, log.stepArtifact);
  if (!(await fileExists(absPath))) {
    return null;
  }

  const parsed = JSON.parse(await readText(absPath)) as {
    feature_id?: unknown;
    process_complete?: unknown;
    step?: unknown;
  };
  return parsed?.process_complete === true &&
    parsed.feature_id === featureId &&
    parsed.step === 'implementation'
    ? log.processCompleteTs
    : null;
}

async function validateImplementationClosure(
  root: string,
  featureId: string,
  logs: ParsedLifecycleLog[],
): Promise<string | null> {
  for (const log of [...logs].sort(compareByTimestamp).reverse()) {
    const validated = await validateImplementationLogEnd(root, featureId, log);
    if (validated) {
      return validated;
    }
  }

  return null;
}

function countVerificationFailures(aggregate: StageAggregate): number {
  return aggregate.verificationEvents.filter((event) => String(event.status) === 'fail').length;
}

function countBacklogFailures(aggregate: StageAggregate): number {
  return aggregate.backlogEvents.filter((event) => {
    const status = stableString(event.status ?? event.result ?? event.outcome ?? '');
    return ['blocked', 'failed', 'incomplete'].includes(status);
  }).length;
}

function countOperatorInterventions(aggregate: StageAggregate): number {
  return aggregate.operatorInterventions.length;
}

function countRerounds(aggregate: StageAggregate): number {
  const validEvents = aggregate.reviewEvents.filter(
    (event) => event.invalidated !== true && event.allowed_by_policy !== false,
  );
  return Math.max(validEvents.length - 1, 0);
}

async function endTimestampForLog(
  root: string,
  featureId: string,
  log: ParsedLifecycleLog,
): Promise<string | null> {
  if (log.stage === 'feature-intake') {
    return log.intakeProcessCompleteTs;
  }
  if (log.stage === 'implementation') {
    return validateImplementationLogEnd(root, featureId, log);
  }
  return log.processCompleteTs ?? log.stepCloseTs ?? log.finalPassTs;
}

async function buildSessionIndexRecords(
  root: string,
  logs: ParsedLifecycleLog[],
  featureCycleId: string,
): Promise<SessionIndexRecord[]> {
  const records: SessionIndexRecord[] = [];
  for (const log of logs) {
    records.push({
    version: 1,
    feature_cycle_id: featureCycleId,
    feature_id: log.featureId,
    backlog_item_key: log.backlogItemKey,
    stage: log.stage,
    session_id: log.sessionId,
    trace_runtime: log.traceRuntime,
    trace_locator_kind: log.traceLocatorKind,
    stage_log_path: log.pathRel,
    start_ts: log.startTs,
    end_ts: await endTimestampForLog(root, log.featureId, log),
    });
  }
  return records;
}

async function writeSessionIndex(root: string, records: SessionIndexRecord[]): Promise<string> {
  const outputPath = path.join(root, '.dossier', 'retro', 'session-index.jsonl');
  const existing = (await fileExists(outputPath)) ? await readText(outputPath) : '';
  const existingRecords = existing
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SessionIndexRecord);

  const replacementKeys = new Set(
    records.map((record) => `${record.feature_cycle_id}::${record.stage}::${record.stage_log_path}`),
  );

  const kept = existingRecords.filter((record) => {
    const key = `${record.feature_cycle_id}::${record.stage}::${record.stage_log_path}`;
    return !replacementKeys.has(key);
  });

  const merged = [...kept, ...records].sort((left, right) => {
    const leftKey = `${left.feature_id}:${left.feature_cycle_id}:${left.stage}:${left.stage_log_path}`;
    const rightKey = `${right.feature_id}:${right.feature_cycle_id}:${right.stage}:${right.stage_log_path}`;
    return leftKey.localeCompare(rightKey);
  });

  await writeTextAtomic(
    outputPath,
    `${merged.map((record) => JSON.stringify(record)).join('\n')}${merged.length > 0 ? '\n' : ''}`,
  );
  return outputPath;
}

export async function refreshLifecycleArtifacts(
  options: LifecycleRefreshOptions,
): Promise<LifecycleRefreshResult> {
  const root = path.resolve(options.root);
  const logs = await loadLifecycleLogs(root, options.featureId);
  const featureCycleId = chooseFeatureCycleId(logs, options.featureCycleId ?? null);
  const cycleLogs = logs.filter((log) => log.featureCycleId === featureCycleId);

  if (cycleLogs.length === 0) {
    throw new Error(
      `No lifecycle logs were found for feature ${options.featureId} and feature_cycle_id ${featureCycleId}.`,
    );
  }

  const grouped = new Map<LifecycleStage, ParsedLifecycleLog[]>();
  for (const stage of LIFECYCLE_STAGES) {
    grouped.set(
      stage,
      cycleLogs.filter((log) => log.stage === stage).sort(compareByTimestamp),
    );
  }

  const intake = aggregateStage(grouped.get('feature-intake') ?? []);
  const specCompact = aggregateStage(grouped.get('spec-compact') ?? []);
  const planSlice = aggregateStage(grouped.get('plan-slice') ?? []);
  const implementation = aggregateStage(grouped.get('implementation') ?? []);
  implementation.processCompleteTs = await validateImplementationClosure(
    root,
    options.featureId,
    grouped.get('implementation') ?? [],
  );
  const backlogItemKey =
    cycleLogs.find((log) => log.backlogItemKey)?.backlogItemKey ??
    null;
  const sessionIndexRecords = await buildSessionIndexRecords(root, cycleLogs, featureCycleId);

  const snapshot: LifecycleSnapshot = {
    version: 1,
    generated_at: new Date().toISOString(),
    feature_id: options.featureId,
    feature_cycle_id: featureCycleId,
    identity: {
      feature_id: options.featureId,
      feature_cycle_id: featureCycleId,
      backlog_item_key: backlogItemKey,
    },
    lifecycle: {
      feature_cycle_time_ms: diffMillis(intake.startTs, implementation.processCompleteTs),
      intake: {
        cycle_ids: intake.cycleIds,
        log_paths: intake.logPaths,
        session_ids: intake.sessionIds,
        start_ts: intake.startTs,
        intake_process_complete_ts: intake.intakeProcessCompleteTs,
      },
      stages: {
        'spec-compact': {
          cycle_ids: specCompact.cycleIds,
          log_paths: specCompact.logPaths,
          session_ids: specCompact.sessionIds,
          start_ts: specCompact.startTs,
          local_gates_green_ts: specCompact.localGatesGreenTs,
          process_complete_ts: specCompact.processCompleteTs,
          step_close_ts: specCompact.stepCloseTs,
          step_artifacts: specCompact.stepArtifacts,
          first_review_agent_started_ts: specCompact.firstReviewAgentStartedTs,
          final_pass_ts: specCompact.finalPassTs,
        },
        'plan-slice': {
          cycle_ids: planSlice.cycleIds,
          log_paths: planSlice.logPaths,
          session_ids: planSlice.sessionIds,
          start_ts: planSlice.startTs,
          local_gates_green_ts: planSlice.localGatesGreenTs,
          process_complete_ts: planSlice.processCompleteTs,
          step_close_ts: planSlice.stepCloseTs,
          step_artifacts: planSlice.stepArtifacts,
          first_review_agent_started_ts: planSlice.firstReviewAgentStartedTs,
          final_pass_ts: planSlice.finalPassTs,
        },
        implementation: {
          cycle_ids: implementation.cycleIds,
          log_paths: implementation.logPaths,
          session_ids: implementation.sessionIds,
          start_ts: implementation.startTs,
          local_gates_green_ts: implementation.localGatesGreenTs,
          process_complete_ts: implementation.processCompleteTs,
          step_close_ts: implementation.stepCloseTs,
          step_artifacts: implementation.stepArtifacts,
          first_review_agent_started_ts: implementation.firstReviewAgentStartedTs,
          final_pass_ts: implementation.finalPassTs,
        },
      },
    },
    metrics: {
      phase_cycle_time_ms: {
        'feature-intake': diffMillis(intake.startTs, intake.intakeProcessCompleteTs),
        'spec-compact': diffMillis(specCompact.startTs, specCompact.processCompleteTs),
        'plan-slice': diffMillis(planSlice.startTs, planSlice.processCompleteTs),
        implementation: diffMillis(implementation.startTs, implementation.processCompleteTs),
      },
      review_loop_time_ms: diffMillis(
        earliestTimestamp([
          specCompact.firstReviewAgentStartedTs,
          planSlice.firstReviewAgentStartedTs,
          implementation.firstReviewAgentStartedTs,
        ]),
        latestTimestamp([specCompact.finalPassTs, planSlice.finalPassTs, implementation.finalPassTs]),
      ),
      rerounds_per_feature:
        countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation),
      first_pass_close:
        implementation.processCompleteTs === null
          ? null
          : countRerounds(specCompact) + countRerounds(planSlice) + countRerounds(implementation) === 0,
      closure_latency_ms: diffMillis(implementation.localGatesGreenTs, implementation.stepCloseTs),
      verification_failures_total:
        countVerificationFailures(specCompact) +
        countVerificationFailures(planSlice) +
        countVerificationFailures(implementation),
      backlog_actualization_failures_total:
        countBacklogFailures(specCompact) +
        countBacklogFailures(planSlice) +
        countBacklogFailures(implementation) +
        countBacklogFailures(intake),
      operator_interventions_total:
        countOperatorInterventions(specCompact) +
        countOperatorInterventions(planSlice) +
        countOperatorInterventions(implementation) +
        countOperatorInterventions(intake),
    },
    session_index_records: sessionIndexRecords,
  };

  const metricsPath = path.join(root, '.dossier', 'metrics', options.featureId, `${featureCycleId}.json`);
  await writeJsonAtomic(metricsPath, snapshot);
  const sessionIndexPath = await writeSessionIndex(root, sessionIndexRecords);

  return {
    featureId: options.featureId,
    featureCycleId,
    snapshot,
    metricsPath,
    sessionIndexPath,
  };
}
