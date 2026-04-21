import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

import { acquireDeliveryMutationLock } from '../shared/delivery-lock.ts';
import { resolveManagedDossierIdentity, sanitizeFeatureId } from '../shared/feature-identity.ts';
import { featureDossiersDirPath, resolveProcessRoot } from '../shared/process-root.ts';
import { assertManagedWritePath } from '../shared/path-guards.ts';
import { fileExists, writeTextAtomic } from '../vendor/dossier-engineer/lib/fs-utils.ts';
import {
  extractFeatureNumericId,
  listDossierFiles,
  readDossierRecord,
} from '../vendor/dossier-engineer/lib/dossier-utils.ts';
import { parseFrontmatter } from '../vendor/dossier-engineer/lib/frontmatter.ts';

export const STAGE_CONTROLLER_COMMANDS = [
  'feature-intake',
  'spec-compact',
  'plan-slice',
  'implementation',
  'change-proposal',
] as const;

export type StageControllerCommand = (typeof STAGE_CONTROLLER_COMMANDS)[number];
type LoggedStage = StageControllerCommand | 'feature-intake';

export interface StageControllerResult {
  backlog_followup_kind: string | null;
  backlog_followup_required: boolean;
  backlog_followup_resolved: boolean;
  cycle_id: string;
  entered_ts: string;
  feature_cycle_id: string;
  feature_id: string;
  log_path: string;
  next_commands: string[];
  ready_for_close_ts: string | null;
  stage: StageControllerCommand;
  stage_state: 'blocked' | 'in_progress' | 'ready_for_close';
  transition_events: Array<Record<string, unknown>>;
}

type ParsedStageLog = {
  absPath: string;
  content: string;
  metadata: Record<string, unknown>;
};

type Section = {
  body: string;
  title: string;
};

const DECISION_SUBSECTION_TITLES = [
  'Spec gap decisions',
  'Implementation freedom decisions',
  'Temporary assumptions',
] as const;

const FEATURE_INTAKE_SECTION_TITLES = [
  'Scope',
  'Inputs actually used',
  'Backlog handoff decisions',
  'Intake findings',
  'Operator feedback',
  'Index refresh',
  'Backlog follow-up',
  'Process misses',
  'Transition events',
  'Close-out',
] as const;

const PRIMARY_STAGE_SECTION_TITLES = [
  'Scope',
  'Inputs actually used',
  'Decisions / reclassifications',
  'Operator feedback',
  'Review events',
  'Backlog follow-up',
  'Process misses',
  'Transition events',
  'Close-out',
] as const;

const NOTES_SECTION_TITLE = 'Notes';
const SUMMARY_SECTION_TITLE = 'Summary';
const TRANSITION_SECTION_TITLE = 'Transition events';

function bodyAfterFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) {
    return content;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return content;
  }
  return content.slice(end + '\n---\n'.length);
}

function parseMarkdownSections(content: string, headingPrefix: '## ' | '### '): Section[] {
  const lines = content.split(/\r?\n/u);
  const sections: Section[] = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  for (const line of lines) {
    if (line.startsWith(headingPrefix)) {
      if (currentTitle !== null) {
        sections.push({
          title: currentTitle,
          body: currentBody.join('\n').trim(),
        });
      }
      currentTitle = line.slice(headingPrefix.length).trim();
      currentBody = [];
      continue;
    }
    if (currentTitle !== null) {
      currentBody.push(line);
    }
  }
  if (currentTitle !== null) {
    sections.push({
      title: currentTitle,
      body: currentBody.join('\n').trim(),
    });
  }
  return sections;
}

function renderSection(title: string, body: string): string[] {
  return ['## ' + title, '', ...(normalizeSectionBody(body) ?? ['none'])];
}

function normalizeSectionBody(body: string | null | undefined): string[] | null {
  const trimmed = body?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  return trimmed.split(/\r?\n/u);
}

function sectionMap(sections: Section[]): Map<string, string> {
  return new Map(sections.map((section) => [section.title, section.body]));
}

function mergeNotes(existingBody: string | undefined, newNotes: string[]): string[] {
  const existing =
    existingBody
      ?.split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim())
      .filter(Boolean) ?? [];
  return [...new Set([...existing, ...newNotes])];
}

function renderNotesSection(notes: string[]): string[] | null {
  if (notes.length === 0) {
    return null;
  }
  return ['## ' + NOTES_SECTION_TITLE, '', ...notes.map((note) => `- ${note}`)];
}

function renderDecisionsSection(existingBody: string | undefined): string[] {
  const normalizedExisting = existingBody?.trim() ?? '';
  const subsections = parseMarkdownSections(normalizedExisting, '### ');
  const subsectionMap = sectionMap(subsections);
  const preface =
    subsections.length === 0
      ? normalizedExisting
      : normalizedExisting.slice(0, normalizedExisting.indexOf('### ')).trim();
  const extraSubsections = subsections.filter(
    (section) =>
      !DECISION_SUBSECTION_TITLES.includes(
        section.title as (typeof DECISION_SUBSECTION_TITLES)[number],
      ),
  );
  if (preface && !subsectionMap.has(DECISION_SUBSECTION_TITLES[0])) {
    subsectionMap.set(DECISION_SUBSECTION_TITLES[0], preface);
  }
  const lines = ['## Decisions / reclassifications', ''];
  for (const title of DECISION_SUBSECTION_TITLES) {
    lines.push(
      `### ${title}`,
      '',
      ...(normalizeSectionBody(subsectionMap.get(title)) ?? ['none']),
      '',
    );
  }
  for (const section of extraSubsections) {
    lines.push(`### ${section.title}`, '', ...(normalizeSectionBody(section.body) ?? ['none']), '');
  }
  while (lines.at(-1) === '') {
    lines.pop();
  }
  return lines;
}

function renderTransitionEventsSection(transitionEvents: Array<Record<string, unknown>>): string[] {
  return [
    '## ' + TRANSITION_SECTION_TITLE,
    '',
    ...(transitionEvents.length > 0
      ? transitionEvents.map((event) => `- ${String(event.at)}: ${String(event.kind)}`)
      : ['none']),
  ];
}

function canonicalSectionTitles(metadata: Record<string, unknown>): readonly string[] {
  return toNullableString(metadata.stage) === 'feature-intake'
    ? FEATURE_INTAKE_SECTION_TITLES
    : PRIMARY_STAGE_SECTION_TITLES;
}

function renderStageLog(
  metadata: Record<string, unknown>,
  options: {
    existingContent?: string | null;
    notes?: string[];
  } = {},
): string {
  const transitionEvents = Array.isArray(metadata.transition_events)
    ? (metadata.transition_events as Array<Record<string, unknown>>)
    : [];
  const existingSections = sectionMap(
    parseMarkdownSections(bodyAfterFrontmatter(options.existingContent ?? ''), '## '),
  );
  const notes = mergeNotes(existingSections.get(NOTES_SECTION_TITLE), options.notes ?? []);
  const sectionLines: string[] = [];
  for (const title of canonicalSectionTitles(metadata)) {
    if (title === TRANSITION_SECTION_TITLE) {
      sectionLines.push(...renderTransitionEventsSection(transitionEvents), '');
      continue;
    }
    if (title === 'Decisions / reclassifications') {
      sectionLines.push(...renderDecisionsSection(existingSections.get(title)), '');
      continue;
    }
    sectionLines.push(...renderSection(title, existingSections.get(title) ?? ''), '');
  }
  const notesSection = renderNotesSection(notes);
  if (notesSection) {
    sectionLines.push(...notesSection, '');
  }
  const extraSections = parseMarkdownSections(
    bodyAfterFrontmatter(options.existingContent ?? ''),
    '## ',
  )
    .filter(
      (section) =>
        !canonicalSectionTitles(metadata).includes(section.title) &&
        section.title !== NOTES_SECTION_TITLE &&
        section.title !== SUMMARY_SECTION_TITLE,
    )
    .map((section) => renderSection(section.title, section.body));
  for (const section of extraSections) {
    sectionLines.push(...section, '');
  }
  while (sectionLines.at(-1) === '') {
    sectionLines.pop();
  }
  return ['---', YAML.stringify(metadata).trimEnd(), '---', '', ...sectionLines, ''].join('\n');
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
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

function takeManyOptions(args: string[], name: string): string[] {
  const values: string[] = [];
  const prefix = `${name}=`;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name) {
      const value = args[index + 1];
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

function ensureRequired(value: string | null, message: string): string {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function commandUsage(command: StageControllerCommand): string {
  return [
    `${command} --feature-id <id> [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]`,
    `${command} --feature-id <id> --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`,
  ].join('\n');
}

function nextCommandsForState(
  command: StageControllerCommand,
  stageState: StageControllerResult['stage_state'],
): string[] {
  if (stageState === 'blocked') {
    return [`dossier-engineer ${command} --feature-id <id>`];
  }
  if (stageState === 'ready_for_close') {
    return [
      'dossier-engineer dossier-verify ...',
      'dossier-engineer review-artifact ...',
      'dossier-engineer dossier-step-close ...',
    ];
  }
  return [`dossier-engineer ${command} --feature-id <id> --ready-for-close`];
}

function parseBacklogItemKey(dossier: {
  frontmatter: Record<string, unknown>;
  markdown: string;
}): string | null {
  const fromFrontmatter = dossier.frontmatter.backlog_item_key;
  if (typeof fromFrontmatter === 'string' && fromFrontmatter.trim()) {
    return fromFrontmatter.trim();
  }
  return null;
}

async function findDossierPathByFeatureId(root: string, featureId: string): Promise<string> {
  const normalizedFeatureId = sanitizeFeatureId(featureId, '--feature-id');
  const dir = featureDossiersDirPath(root);
  const files = await listDossierFiles(dir);
  const direct = files.find(
    (file) => file === `${normalizedFeatureId}.md` || file.startsWith(`${normalizedFeatureId}-`),
  );
  if (!direct) {
    throw new Error(
      `Feature dossier for ${normalizedFeatureId} not found in ${path.relative(root, dir)}`,
    );
  }
  return path.join(dir, direct);
}

async function loadLatestStageLog(
  root: string,
  stage: LoggedStage,
  featureId: string,
  requestedCycleId?: string | null,
): Promise<ParsedStageLog | null> {
  const logsDir = path.join(root, '.dossier', 'logs', stage);
  if (!(await fileExists(logsDir))) {
    return null;
  }
  const entries = await fs.readdir(logsDir, { withFileTypes: true });
  const matching: ParsedStageLog[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    const absPath = path.join(logsDir, entry.name);
    const content = await fs.readFile(absPath, 'utf8');
    const metadata = parseFrontmatter(content);
    if (!metadata) {
      continue;
    }
    if (toNullableString(metadata.feature_id) !== featureId) {
      continue;
    }
    if (requestedCycleId && toNullableString(metadata.cycle_id) !== requestedCycleId) {
      continue;
    }
    matching.push({ absPath, content, metadata });
  }
  matching.sort((left, right) => {
    const leftTs = Date.parse(toNullableString(left.metadata.entered_ts) ?? '') || 0;
    const rightTs = Date.parse(toNullableString(right.metadata.entered_ts) ?? '') || 0;
    return leftTs - rightTs;
  });
  return matching.at(-1) ?? null;
}

export async function resolveStageLogContext(
  root: string,
  stage: LoggedStage,
  featureId: string,
  requestedCycleId?: string | null,
): Promise<{
  absPath: string;
  cycleId: string;
  featureCycleId: string;
  relPath: string;
} | null> {
  const log = await loadLatestStageLog(
    root,
    stage,
    sanitizeFeatureId(featureId, 'feature id'),
    requestedCycleId,
  );
  const featureCycleId = toNullableString(log?.metadata.feature_cycle_id);
  const cycleId = toNullableString(log?.metadata.cycle_id);
  if (!log || !featureCycleId || !cycleId) {
    return null;
  }
  return {
    absPath: log.absPath,
    cycleId,
    featureCycleId,
    relPath: path.relative(root, log.absPath).split(path.sep).join('/'),
  };
}

export async function resolveLatestFeatureCycleId(
  root: string,
  featureId: string,
  preferredStage?: LoggedStage,
): Promise<string | null> {
  const normalizedFeatureId = sanitizeFeatureId(featureId, 'feature id');
  const orderedStages: LoggedStage[] = [
    ...(preferredStage ? [preferredStage] : []),
    'change-proposal',
    'implementation',
    'plan-slice',
    'spec-compact',
    'feature-intake',
  ];
  const dedupedStages = [...new Set(orderedStages)];
  const candidates = await Promise.all(
    dedupedStages.map((stage) => loadLatestStageLog(root, stage, normalizedFeatureId)),
  );
  const latest = candidates
    .filter((candidate): candidate is ParsedStageLog => candidate !== null)
    .sort((left, right) => {
      const leftTs = Date.parse(toNullableString(left.metadata.entered_ts) ?? '') || 0;
      const rightTs = Date.parse(toNullableString(right.metadata.entered_ts) ?? '') || 0;
      return leftTs - rightTs;
    })
    .at(-1);
  return toNullableString(latest?.metadata.feature_cycle_id);
}

export async function appendFeatureIntakeLog(payload: {
  backlogItemKey: string;
  featureCycleId: string;
  featureId: string;
  root: string;
}): Promise<{
  cycleId: string;
  enteredTs: string;
  logPath: string;
  readyForCloseTs: string;
  transitionEvents: Array<Record<string, unknown>>;
}> {
  const now = new Date().toISOString();
  const cycleId = `intake-${crypto.randomUUID().slice(0, 8)}`;
  const relPath = path.join(
    '.dossier',
    'logs',
    'feature-intake',
    `${payload.featureId}--${payload.featureCycleId}.md`,
  );
  const absPath = path.join(payload.root, relPath);
  const transitionEvents = [
    { kind: 'entered', at: now },
    { kind: 'ready_for_close', at: now },
  ];
  const metadata = {
    version: 1,
    command: 'feature-intake',
    stage: 'feature-intake',
    feature_id: payload.featureId,
    feature_cycle_id: payload.featureCycleId,
    cycle_id: cycleId,
    backlog_item_key: payload.backlogItemKey,
    start_ts: now,
    entered_ts: now,
    ready_for_close_ts: now,
    stage_state: 'ready_for_close',
    backlog_followup_required: false,
    backlog_followup_kind: null,
    backlog_followup_resolved: true,
    intake_process_complete_ts: now,
    transition_events: transitionEvents,
    session_id: process.env.CODEX_SESSION_ID ?? null,
    trace_runtime: 'codex',
    trace_locator_kind: 'session_id',
  };
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', 'feature-intake'),
    absPath,
    'feature-intake log',
  );
  await writeTextAtomic(
    absPath,
    renderStageLog(metadata, {
      notes: ['Feature cycle opened by feature-intake.'],
    }),
  );
  return {
    cycleId,
    enteredTs: now,
    logPath: relPath.split(path.sep).join('/'),
    readyForCloseTs: now,
    transitionEvents,
  };
}

export async function runStageControllerCommand(
  command: StageControllerCommand,
  args: string[],
): Promise<StageControllerResult> {
  if (args.includes('--help') || args.includes('-h')) {
    throw new Error(commandUsage(command));
  }

  const cwd = process.cwd();
  const root = await resolveProcessRoot(cwd, takeOption(args, '--root'));
  const featureId = sanitizeFeatureId(
    ensureRequired(takeOption(args, '--feature-id'), '--feature-id is required.'),
    '--feature-id',
  );
  const backlogFollowupKind = takeOption(args, '--backlog-followup-kind');
  const backlogFollowupRequired =
    args.includes('--backlog-followup-required') || backlogFollowupKind !== null;
  const backlogFollowupResolved = args.includes('--backlog-followup-resolved');
  const requestedCycleId = takeOption(args, '--cycle-id');
  const noteValues = takeManyOptions(args, '--note');
  const requestedDossier = takeOption(args, '--dossier');
  const { dossier } = requestedDossier
    ? await resolveManagedDossierIdentity({
        root,
        dossierPath: requestedDossier,
        expectedFeatureId: featureId,
      })
    : {
        dossier: await readDossierRecord(await findDossierPathByFeatureId(root, featureId), {
          root,
        }),
      };
  const backlogItemKey = parseBacklogItemKey(dossier);
  if (!backlogItemKey) {
    throw new Error(`Dossier ${featureId} is missing canonical frontmatter backlog_item_key.`);
  }
  const latestForStage = await loadLatestStageLog(root, command, featureId, requestedCycleId);
  const latestFeatureIntake =
    command === 'feature-intake'
      ? null
      : await loadLatestStageLog(root, 'feature-intake', featureId);
  const latestImplementation =
    command === 'feature-intake'
      ? null
      : await loadLatestStageLog(root, 'implementation', featureId);
  const lifecycleAnchor = latestForStage ?? latestFeatureIntake ?? latestImplementation;
  const featureCycleId =
    toNullableString(lifecycleAnchor?.metadata.feature_cycle_id) ??
    `fc-${extractFeatureNumericId(featureId) ?? featureId}-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const action = args.includes('--block')
    ? 'blocked'
    : args.includes('--ready-for-close')
      ? 'ready_for_close'
      : latestForStage
        ? 'resumed'
        : 'entered';

  if (!latestForStage && action !== 'entered') {
    throw new Error(
      `No existing ${command} stage cycle found for ${featureId}. Start the stage before using ${action}.`,
    );
  }

  const cycleId =
    toNullableString(latestForStage?.metadata.cycle_id) ??
    `${command}-${crypto.randomUUID().slice(0, 8)}`;
  const enteredTs = toNullableString(latestForStage?.metadata.entered_ts) ?? now;
  const readyForCloseTs =
    action === 'ready_for_close'
      ? now
      : toNullableString(latestForStage?.metadata.ready_for_close_ts);
  const existingEvents = Array.isArray(latestForStage?.metadata.transition_events)
    ? [...(latestForStage?.metadata.transition_events as Array<Record<string, unknown>>)]
    : [];
  existingEvents.push({
    kind: action,
    at: now,
  });
  const stageState: StageControllerResult['stage_state'] =
    action === 'blocked'
      ? 'blocked'
      : action === 'ready_for_close'
        ? 'ready_for_close'
        : 'in_progress';
  const metadata: Record<string, unknown> = {
    version: 1,
    stage: command,
    feature_id: featureId,
    feature_cycle_id: featureCycleId,
    cycle_id: cycleId,
    backlog_item_key: backlogItemKey,
    stage_state: stageState,
    start_ts: enteredTs,
    entered_ts: enteredTs,
    ready_for_close_ts: readyForCloseTs,
    transition_events: existingEvents,
    backlog_followup_required: backlogFollowupRequired,
    backlog_followup_kind: backlogFollowupKind,
    backlog_followup_resolved: backlogFollowupResolved,
    session_id: process.env.CODEX_SESSION_ID ?? null,
    trace_runtime: 'codex',
    trace_locator_kind: 'session_id',
  };
  if (command === 'implementation' && stageState === 'ready_for_close') {
    metadata.local_gates_green_ts = now;
  }

  const relPath = path.join(
    '.dossier',
    'logs',
    command,
    `${featureId}--${featureCycleId}--${cycleId}.md`,
  );
  const absPath = path.join(root, relPath);
  const releaseLock = await acquireDeliveryMutationLock({
    root,
    featureId,
    featureCycleId,
    command,
  });
  try {
    await assertManagedWritePath(
      root,
      path.join(root, '.dossier', 'logs', command),
      absPath,
      `${command} stage log`,
    );
    await writeTextAtomic(
      absPath,
      renderStageLog(metadata, {
        existingContent: latestForStage?.content ?? null,
        notes: noteValues,
      }),
    );
  } finally {
    await releaseLock();
  }

  return {
    stage: command,
    feature_id: featureId,
    feature_cycle_id: featureCycleId,
    cycle_id: cycleId,
    stage_state: stageState,
    entered_ts: enteredTs,
    ready_for_close_ts: readyForCloseTs,
    transition_events: existingEvents,
    backlog_followup_required: backlogFollowupRequired,
    backlog_followup_kind: backlogFollowupKind,
    backlog_followup_resolved: backlogFollowupResolved,
    log_path: relPath.split(path.sep).join('/'),
    next_commands: nextCommandsForState(command, stageState),
  };
}

export async function recordStepCloseOnStageLog(payload: {
  featureId: string;
  processComplete: boolean;
  root: string;
  step: string;
  stepArtifactPath: string;
}): Promise<void> {
  const stageName = payload.step as StageControllerCommand;
  if (!STAGE_CONTROLLER_COMMANDS.includes(stageName)) {
    return;
  }
  const latest = await loadLatestStageLog(
    payload.root,
    stageName,
    sanitizeFeatureId(payload.featureId, 'feature id'),
  );
  if (!latest) {
    return;
  }

  const now = new Date().toISOString();
  const metadata = {
    ...latest.metadata,
    step_close_ts: now,
    step_artifact: payload.stepArtifactPath,
    ...(payload.processComplete ? { process_complete_ts: now } : {}),
  };
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', stageName),
    latest.absPath,
    `${stageName} stage log`,
  );
  await writeTextAtomic(
    latest.absPath,
    renderStageLog(metadata, {
      existingContent: latest.content,
    }),
  );
}
