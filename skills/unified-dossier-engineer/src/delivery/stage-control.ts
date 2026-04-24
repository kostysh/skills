import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

import { acquireDeliveryMutationLock } from '../shared/delivery-lock.ts';
import { resolveManagedDossierIdentity, sanitizeFeatureId } from '../shared/feature-identity.ts';
import { featureDossiersDirPath, resolveProcessRoot } from '../shared/process-root.ts';
import {
  normalizeMetadataForStageState,
  readStageState,
  syncStageStateFromMetadata,
  type StageStateProcessMiss,
  type StageStatePreReviewChecklistEntry,
  type StageStateRecord,
} from '../shared/stage-state.ts';
import { assertManagedWritePath } from '../shared/path-guards.ts';
import {
  evaluateBacklogLifecycleReconciliation,
  lifecycleReconciliationMetadata,
  type BacklogLifecycleReconciliation,
} from '../shared/lifecycle-reconciliation.ts';
import { fileExists, writeTextAtomic } from '../vendor/dossier-engineer/lib/fs-utils.ts';
import { getCurrentCommit } from '../vendor/dossier-engineer/lib/git-utils.ts';
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

const AUDIT_CLASSES = ['spec-conformance-reviewer', 'code-reviewer', 'security-reviewer'] as const;
type AuditClass = (typeof AUDIT_CLASSES)[number];

type ReviewMode = 'degraded' | 'external' | 'self-review';
const REVIEW_MODES = ['degraded', 'external', 'self-review'] as const;

const IMPLEMENTATION_REVIEW_SCOPES = ['non-code', 'code-bearing'] as const;
type ImplementationReviewScope = (typeof IMPLEMENTATION_REVIEW_SCOPES)[number];
const PRE_REVIEW_CHECKLIST_ENTRY_STATUSES = ['pass', 'not_applicable', 'blocked'] as const;
const PRE_REVIEW_RISK_IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const POLICY_ADMISSION_GOVERNANCE_CHECKLIST_IDS = [
  'explicit-allow-deny',
  'deny-or-failed-admission-no-invocation',
  'conflicting-request-replay-fail-closed',
  'ambiguous-stale-unsupported-evidence',
  'freshness-timestamp-required',
  'active-scope-concurrency-model',
  'append-only-decision-audit-facts',
  'regression-test-paths',
] as const;
const BUILT_IN_PRE_REVIEW_CHECKLIST_IDS = new Map<string, readonly string[]>([
  ['policy-admission-governance', POLICY_ADMISSION_GOVERNANCE_CHECKLIST_IDS],
]);

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
  pre_review_checklist_blockers: string[];
  pre_review_checklist_status: 'not_required' | 'missing' | 'blocked' | 'complete';
  pre_review_risk_families: string[];
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

type ReviewEventPayload = {
  allowed_by_policy: boolean;
  artifact_path: string;
  audit_class: AuditClass;
  event_commit: string | null;
  implementation_scope: ImplementationReviewScope | null;
  invalidated: boolean;
  latest_copy_path: string | null;
  must_fix_count: number;
  recorded_at: string;
  review_mode: ReviewMode;
  review_attempt_id: string | null;
  review_round_id: string | null;
  review_round_number: number | null;
  reviewer: string;
  reviewer_agent_id: string | null;
  reviewer_skill: string | null;
  reviewer_thread_id: string | null;
  security_trigger_reason: string | null;
  stale?: boolean;
  verdict: 'FAIL' | 'PASS';
};

type AuditSummaryPayload = {
  degradedReviewPresent: boolean;
  executedAuditClasses: string[];
  implementationReviewScope: ImplementationReviewScope | null;
  invalidatedReviewPresent: boolean;
  requiredAuditClasses: string[];
  requiredExternalReviewPending: boolean;
  requiredSecurityReview: boolean | null;
  reviewTraceCommits: string[];
  reviewerAgentIds: string[];
  reviewerSkills: string[];
  securityTriggerReasons: string[];
  staleReviewPresent: boolean;
};

export type StageProvenanceInput = {
  sessionId: string;
  traceRuntime: string | null;
};

type StageAnnotationsInput = {
  phaseScope: string | null;
  processMisses: StageStateProcessMiss[];
  skillFollowups: string[];
  skillIssues: string[];
  skillsUsed: string[];
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

function extractBulletNotes(body: string): string[] {
  return body
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function mergeNotesBody(existingBody: string | undefined, newNotes: string[]): string | null {
  const trimmed = existingBody?.trim() ?? '';
  const additionalNotes = newNotes.filter((note) => !extractBulletNotes(trimmed).includes(note));
  if (!trimmed) {
    return additionalNotes.length > 0
      ? additionalNotes.map((note) => `- ${note}`).join('\n')
      : null;
  }
  if (additionalNotes.length === 0) {
    return trimmed;
  }
  return `${trimmed}\n\n${additionalNotes.map((note) => `- ${note}`).join('\n')}`;
}

function renderNotesSection(body: string | null): string[] | null {
  if (!body?.trim()) {
    return null;
  }
  return ['## ' + NOTES_SECTION_TITLE, '', ...body.trim().split(/\r?\n/u)];
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
  const lines = ['## Decisions / reclassifications', ''];
  if (preface) {
    lines.push(...preface.split(/\r?\n/u), '');
  }
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

function processMissesFromMetadata(metadata: Record<string, unknown>): StageStateProcessMiss[] {
  return Array.isArray(metadata.process_misses)
    ? metadata.process_misses.filter(
        (miss): miss is StageStateProcessMiss =>
          miss !== null &&
          typeof miss === 'object' &&
          typeof (miss as StageStateProcessMiss).id === 'string' &&
          typeof (miss as StageStateProcessMiss).category === 'string' &&
          typeof (miss as StageStateProcessMiss).summary === 'string' &&
          typeof (miss as StageStateProcessMiss).resolved === 'boolean' &&
          ['low', 'medium', 'high'].includes((miss as StageStateProcessMiss).severity),
      )
    : [];
}

function unstructuredProcessMissNotes(existingBody: string | undefined): string | null {
  const trimmed = existingBody?.trim() ?? '';
  if (!trimmed || trimmed === 'none') {
    return null;
  }
  const marker = 'Unstructured notes:';
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex !== -1) {
    const notes = trimmed.slice(markerIndex + marker.length).trim();
    return notes || null;
  }
  if (/^- .+\[(low|medium|high)\/.+, (open|resolved)\]/u.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function renderProcessMissesSection(
  metadata: Record<string, unknown>,
  existingBody: string | undefined,
): string[] {
  const processMisses = processMissesFromMetadata(metadata);
  const lines = ['## Process misses', ''];
  if (processMisses.length === 0) {
    lines.push('none');
  } else {
    lines.push(
      ...processMisses.map(
        (miss) =>
          `- ${miss.id} [${miss.severity}/${miss.category}, ${
            miss.resolved ? 'resolved' : 'open'
          }] ${miss.summary}`,
      ),
    );
  }
  const notes = unstructuredProcessMissNotes(existingBody);
  if (notes) {
    lines.push('', 'Unstructured notes:', '', ...notes.split(/\r?\n/u));
  }
  return lines;
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
  const notesBody = mergeNotesBody(existingSections.get(NOTES_SECTION_TITLE), options.notes ?? []);
  const sectionLines: string[] = [];
  for (const title of canonicalSectionTitles(metadata)) {
    if (title === TRANSITION_SECTION_TITLE) {
      sectionLines.push(...renderTransitionEventsSection(transitionEvents), '');
      continue;
    }
    if (title === 'Process misses') {
      sectionLines.push(...renderProcessMissesSection(metadata, existingSections.get(title)), '');
      continue;
    }
    if (title === 'Decisions / reclassifications') {
      sectionLines.push(...renderDecisionsSection(existingSections.get(title)), '');
      continue;
    }
    sectionLines.push(...renderSection(title, existingSections.get(title) ?? ''), '');
  }
  const notesSection = renderNotesSection(notesBody);
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
        section.title !== NOTES_SECTION_TITLE,
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

function toBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function uniqueStrings(values: Iterable<string | null | undefined>): string[] {
  return [
    ...new Set(
      [...values].map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean),
    ),
  ];
}

function sortAuditClasses(values: Iterable<string | null | undefined>): string[] {
  const unique = uniqueStrings(values);
  return [
    ...AUDIT_CLASSES.filter((value) => unique.includes(value)),
    ...unique.filter((value) => !AUDIT_CLASSES.includes(value as AuditClass)).sort(),
  ];
}

function normalizeImplementationReviewScope(value: unknown): ImplementationReviewScope | null {
  return IMPLEMENTATION_REVIEW_SCOPES.includes(value as ImplementationReviewScope)
    ? (value as ImplementationReviewScope)
    : null;
}

function requiredAuditClassesForStage(
  stage: LoggedStage,
  implementationScope: ImplementationReviewScope | null,
): AuditClass[] {
  if (stage === 'implementation' && implementationScope === 'code-bearing') {
    return [...AUDIT_CLASSES];
  }
  return ['spec-conformance-reviewer'];
}

function extractReviewEvents(metadata: Record<string, unknown>): ReviewEventPayload[] {
  return Array.isArray(metadata.review_events)
    ? metadata.review_events.filter(
        (item): item is ReviewEventPayload => item !== null && typeof item === 'object',
      )
    : [];
}

function summarizeReviewPolicy(
  stage: LoggedStage,
  reviewEvents: ReviewEventPayload[],
  implementationScope: ImplementationReviewScope | null,
  staleReviewPresent = false,
): AuditSummaryPayload {
  const requiredAuditClasses = requiredAuditClassesForStage(stage, implementationScope);
  const executedAuditClasses = sortAuditClasses(reviewEvents.map((event) => event.audit_class));
  const anyStaleReviewPresent =
    staleReviewPresent || reviewEvents.some((event) => event.stale === true);
  const latestByAuditClass = new Map<AuditClass, ReviewEventPayload>();
  for (const event of reviewEvents) {
    latestByAuditClass.set(event.audit_class, event);
  }
  const validAuditClasses = new Set(
    [...latestByAuditClass.values()]
      .filter(
        (event) =>
          event.verdict === 'PASS' &&
          event.review_mode === 'external' &&
          event.invalidated !== true &&
          event.stale !== true &&
          event.allowed_by_policy !== false &&
          event.must_fix_count === 0,
      )
      .map((event) => event.audit_class),
  );
  const requiredExternalReviewPending = requiredAuditClasses.some(
    (auditClass) => !validAuditClasses.has(auditClass),
  );

  return {
    requiredAuditClasses,
    executedAuditClasses,
    requiredExternalReviewPending,
    implementationReviewScope: stage === 'implementation' ? implementationScope : null,
    requiredSecurityReview:
      stage === 'implementation' ? implementationScope === 'code-bearing' : false,
    degradedReviewPresent: reviewEvents.some((event) => event.review_mode === 'degraded'),
    invalidatedReviewPresent: reviewEvents.some((event) => event.invalidated === true),
    staleReviewPresent: anyStaleReviewPresent,
    reviewerSkills: uniqueStrings(reviewEvents.map((event) => event.reviewer_skill)),
    reviewerAgentIds: uniqueStrings(reviewEvents.map((event) => event.reviewer_agent_id)),
    reviewTraceCommits: uniqueStrings(reviewEvents.map((event) => event.event_commit)),
    securityTriggerReasons: uniqueStrings(
      reviewEvents.map((event) => event.security_trigger_reason),
    ),
  };
}

function machineMetadataFromStageState(state: StageStateRecord): Record<string, unknown> {
  return {
    version: state.version,
    stage: state.stage,
    feature_id: state.feature_id,
    feature_cycle_id: state.feature_cycle_id,
    cycle_id: state.cycle_id,
    backlog_item_key: state.backlog_item_key,
    primary_feature_id: state.primary_feature_id,
    primary_backlog_item_key: state.primary_backlog_item_key,
    phase_scope: state.phase_scope,
    stage_state: state.stage_state,
    start_ts: state.start_ts,
    entered_ts: state.entered_ts,
    ready_for_close_ts: state.ready_for_close_ts,
    transition_events: state.transition_events,
    backlog_followup_required: state.backlog_followup_required,
    backlog_followup_kind: state.backlog_followup_kind,
    backlog_followup_resolved: state.backlog_followup_resolved,
    backlog_lifecycle_target: state.backlog_lifecycle_target,
    backlog_lifecycle_current: state.backlog_lifecycle_current,
    backlog_lifecycle_reconciled: state.backlog_lifecycle_reconciled,
    backlog_actualization_artifacts: state.backlog_actualization_artifacts,
    backlog_actualization_verdict: state.backlog_actualization_verdict,
    ...(state.stage === 'implementation'
      ? {
          pre_review_risk_families: state.pre_review_risk_families,
          pre_review_checklists: state.pre_review_checklists,
          pre_review_checklist_status: state.pre_review_checklist_status,
          pre_review_checklist_blockers: state.pre_review_checklist_blockers,
        }
      : {}),
    required_audit_classes: state.required_audit_classes,
    executed_audit_classes: state.executed_audit_classes,
    required_external_review_pending: state.required_external_review_pending,
    review_artifacts: state.review_artifacts,
    verification_artifacts: state.verification_artifacts,
    review_events: state.review_events,
    reviewer_skills: state.reviewer_skills,
    reviewer_agent_ids: state.reviewer_agent_ids,
    review_trace_commits: state.review_trace_commits,
    degraded_review_present: state.degraded_review_present,
    invalidated_review_present: state.invalidated_review_present,
    stale_review_present: state.stale_review_present,
    skills_used: state.skills_used,
    skill_issues: state.skill_issues,
    skill_followups: state.skill_followups,
    process_misses: state.process_misses,
    session_id: state.session_id,
    trace_runtime: state.trace_runtime,
    trace_locator_kind: state.trace_locator_kind,
    stage_entry_commit: state.stage_entry_commit,
    final_delivery_commit: state.final_delivery_commit,
    final_closure_commit: state.final_closure_commit,
    implementation_review_scope: state.implementation_review_scope,
    required_security_review: state.required_security_review,
    security_trigger_reasons: state.security_trigger_reasons,
    step_close_ts: state.step_close_ts,
    step_artifact: state.step_artifact,
    process_complete_ts: state.process_complete_ts,
    intake_process_complete_ts: state.intake_process_complete_ts,
    local_gates_green_ts: state.local_gates_green_ts,
    first_review_agent_started_ts: state.first_review_agent_started_ts,
    final_pass_ts: state.final_pass_ts,
  };
}

function reviewEventsFromStageState(state: StageStateRecord | null): ReviewEventPayload[] {
  if (!state) {
    return [];
  }
  return state.review_events
    .filter(
      (
        event,
      ): event is typeof event & {
        allowed_by_policy: boolean;
        artifact_path: string;
        audit_class: AuditClass;
        implementation_scope: ImplementationReviewScope | null;
        recorded_at: string;
        review_mode: ReviewMode;
        reviewer: string;
        reviewer_thread_id: string | null;
        verdict: 'FAIL' | 'PASS';
      } =>
        typeof event.allowed_by_policy === 'boolean' &&
        typeof event.artifact_path === 'string' &&
        AUDIT_CLASSES.includes(event.audit_class as AuditClass) &&
        (event.implementation_scope === null ||
          IMPLEMENTATION_REVIEW_SCOPES.includes(event.implementation_scope)) &&
        typeof event.recorded_at === 'string' &&
        REVIEW_MODES.includes(event.review_mode as ReviewMode) &&
        typeof event.reviewer === 'string' &&
        (event.verdict === 'FAIL' || event.verdict === 'PASS'),
    )
    .map((event) => ({
      allowed_by_policy: event.allowed_by_policy,
      artifact_path: event.artifact_path,
      audit_class: event.audit_class,
      event_commit: event.event_commit,
      implementation_scope: event.implementation_scope,
      invalidated: event.invalidated,
      latest_copy_path: event.latest_copy_path,
      must_fix_count: event.must_fix_count ?? 0,
      recorded_at: event.recorded_at,
      review_mode: event.review_mode,
      review_attempt_id: event.review_attempt_id,
      review_round_id: event.review_round_id,
      review_round_number: event.review_round_number,
      reviewer: event.reviewer,
      reviewer_agent_id: event.reviewer_agent_id,
      reviewer_skill: event.reviewer_skill,
      reviewer_thread_id: event.reviewer_thread_id,
      security_trigger_reason: event.security_trigger_reason,
      stale: event.stale,
      verdict: event.verdict,
    }));
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

function takeManyOptionsStrict(args: string[], name: string): string[] {
  const values: string[] = [];
  const prefix = `${name}=`;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${name} requires a value.`);
      }
      values.push(value);
      continue;
    }
    if (arg?.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
    }
  }
  return values;
}

function hasOption(args: string[], name: string): boolean {
  const prefix = `${name}=`;
  return args.some((arg) => arg === name || arg.startsWith(prefix));
}

function ensureEnumValue<T extends readonly string[]>(
  value: string,
  allowed: T,
  optionName: string,
): T[number] {
  if (!allowed.includes(value as T[number])) {
    throw new Error(`${optionName} must be one of: ${allowed.join(', ')}`);
  }
  return value as T[number];
}

function ensureRequired(value: string | null, message: string): string {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function normalizeSingleLineOption(value: string | null, optionName: string): string | null {
  const normalized = value?.trim() ?? '';
  if (!normalized) {
    return null;
  }
  if (/[\r\n]/u.test(normalized)) {
    throw new Error(`${optionName} must be a single-line value.`);
  }
  return normalized;
}

function normalizeRepeatableSingleLineOptions(values: string[], optionName: string): string[] {
  return uniqueStrings(
    values.map((value) => {
      const normalized = normalizeSingleLineOption(value, optionName);
      if (!normalized) {
        throw new Error(`${optionName} cannot be empty.`);
      }
      return normalized;
    }),
  );
}

function normalizePreReviewIdentifier(value: string | null, optionName: string): string {
  const normalized = normalizeSingleLineOption(value, optionName);
  if (!normalized) {
    throw new Error(`${optionName} cannot be empty.`);
  }
  if (!PRE_REVIEW_RISK_IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(
      `${optionName} must be a stable lowercase identifier using letters, digits, and hyphens.`,
    );
  }
  return normalized;
}

export function parseStageProvenanceInput(args: string[]): StageProvenanceInput {
  const sessionId = normalizeSingleLineOption(takeOption(args, '--session-id'), '--session-id');
  if (!sessionId) {
    throw new Error('--session-id is required for stage-controller writes.');
  }
  return {
    sessionId,
    traceRuntime: normalizeSingleLineOption(takeOption(args, '--trace-runtime'), '--trace-runtime'),
  };
}

function parseKeyValueDsl(value: string, optionName: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const part of value.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) {
      throw new Error(`${optionName} entries must use key=value pairs separated by semicolons.`);
    }
    const key = part.slice(0, separator).trim();
    const fieldValue = part.slice(separator + 1).trim();
    if (!key || !fieldValue) {
      throw new Error(`${optionName} entries must not contain empty keys or values.`);
    }
    if (fields.has(key)) {
      throw new Error(`${optionName} contains duplicate key: ${key}.`);
    }
    fields.set(key, fieldValue);
  }
  return fields;
}

function parseProcessMissDsl(value: string): StageStateProcessMiss {
  const fields = parseKeyValueDsl(value, '--process-miss');
  const allowedKeys = new Set(['id', 'category', 'severity', 'resolved', 'summary']);
  for (const key of fields.keys()) {
    if (!allowedKeys.has(key)) {
      throw new Error(`--process-miss contains unsupported key: ${key}.`);
    }
  }
  const id = normalizeSingleLineOption(fields.get('id') ?? null, '--process-miss id');
  const category = normalizeSingleLineOption(
    fields.get('category') ?? null,
    '--process-miss category',
  );
  const severity = normalizeSingleLineOption(
    fields.get('severity') ?? null,
    '--process-miss severity',
  );
  const resolved = normalizeSingleLineOption(
    fields.get('resolved') ?? null,
    '--process-miss resolved',
  );
  const summary = normalizeSingleLineOption(
    fields.get('summary') ?? null,
    '--process-miss summary',
  );
  if (!id || !category || !severity || !resolved || !summary) {
    throw new Error('--process-miss must include id, category, severity, resolved, and summary.');
  }
  if (!['low', 'medium', 'high'].includes(severity)) {
    throw new Error('--process-miss severity must be one of: low, medium, high.');
  }
  if (!['true', 'false'].includes(resolved)) {
    throw new Error('--process-miss resolved must be true or false.');
  }
  return {
    id,
    category,
    severity: severity as StageStateProcessMiss['severity'],
    resolved: resolved === 'true',
    summary,
  };
}

type PreReviewChecklistInput = {
  checklistEntries: StageStatePreReviewChecklistEntry[];
  riskFamilies: string[];
};

function parsePreReviewCheckDsl(value: string): StageStatePreReviewChecklistEntry {
  const fields = parseKeyValueDsl(value, '--pre-review-check');
  const allowedKeys = new Set(['risk_family', 'id', 'status', 'summary', 'evidence', 'test_refs']);
  for (const key of fields.keys()) {
    if (!allowedKeys.has(key)) {
      throw new Error(`--pre-review-check contains unsupported key: ${key}.`);
    }
  }

  const riskFamily = normalizePreReviewIdentifier(
    fields.get('risk_family') ?? null,
    '--pre-review-check risk_family',
  );
  const id = normalizePreReviewIdentifier(fields.get('id') ?? null, '--pre-review-check id');
  const status = normalizeSingleLineOption(
    fields.get('status') ?? null,
    '--pre-review-check status',
  );
  const summary = normalizeSingleLineOption(
    fields.get('summary') ?? null,
    '--pre-review-check summary',
  );
  const evidence = normalizeSingleLineOption(
    fields.get('evidence') ?? null,
    '--pre-review-check evidence',
  );
  if (!status || !summary || !evidence) {
    throw new Error(
      '--pre-review-check must include risk_family, id, status, summary, and evidence.',
    );
  }
  if (
    !PRE_REVIEW_CHECKLIST_ENTRY_STATUSES.includes(
      status as (typeof PRE_REVIEW_CHECKLIST_ENTRY_STATUSES)[number],
    )
  ) {
    throw new Error('--pre-review-check status must be one of: pass, not_applicable, blocked.');
  }
  return {
    risk_family: riskFamily,
    id,
    status: status as StageStatePreReviewChecklistEntry['status'],
    summary,
    evidence,
    test_refs: fields.has('test_refs')
      ? uniqueStrings(
          (fields.get('test_refs') ?? '')
            .split(',')
            .map((value) => normalizeSingleLineOption(value, '--pre-review-check test_refs'))
            .filter((value): value is string => value !== null),
        )
      : [],
  };
}

function parsePreReviewChecklistInput(
  command: StageControllerCommand,
  args: string[],
): PreReviewChecklistInput {
  const hasRiskFamily = hasOption(args, '--risk-family');
  const hasPreReviewCheck = hasOption(args, '--pre-review-check');
  if (command !== 'implementation' && (hasRiskFamily || hasPreReviewCheck)) {
    throw new Error('--risk-family and --pre-review-check are only allowed for implementation.');
  }
  if (!hasRiskFamily && !hasPreReviewCheck) {
    return { riskFamilies: [], checklistEntries: [] };
  }
  return {
    riskFamilies: normalizeRepeatableSingleLineOptions(
      takeManyOptionsStrict(args, '--risk-family'),
      '--risk-family',
    ).map((riskFamily) => normalizePreReviewIdentifier(riskFamily, '--risk-family')),
    checklistEntries: takeManyOptionsStrict(args, '--pre-review-check').map(parsePreReviewCheckDsl),
  };
}

export function parseStageAnnotationsInput(args: string[]): StageAnnotationsInput {
  return {
    skillsUsed: normalizeRepeatableSingleLineOptions(
      takeManyOptions(args, '--skill-used'),
      '--skill-used',
    ),
    skillIssues: normalizeRepeatableSingleLineOptions(
      takeManyOptions(args, '--skill-issue'),
      '--skill-issue',
    ),
    skillFollowups: normalizeRepeatableSingleLineOptions(
      takeManyOptions(args, '--skill-followup'),
      '--skill-followup',
    ),
    processMisses: takeManyOptions(args, '--process-miss').map(parseProcessMissDsl),
    phaseScope: normalizeSingleLineOption(takeOption(args, '--phase-scope'), '--phase-scope'),
  };
}

function mergeProcessMisses(
  existing: StageStateProcessMiss[],
  incoming: StageStateProcessMiss[],
): StageStateProcessMiss[] {
  return [...new Map([...existing, ...incoming].map((miss) => [miss.id, miss])).values()];
}

function mergePreReviewChecklists(
  existing: StageStatePreReviewChecklistEntry[],
  incoming: StageStatePreReviewChecklistEntry[],
): StageStatePreReviewChecklistEntry[] {
  return [
    ...new Map(
      [...existing, ...incoming].map((entry) => [`${entry.risk_family}\u0000${entry.id}`, entry]),
    ).values(),
  ];
}

function assertPreReviewChecklistDeclarations(payload: {
  checklists: StageStatePreReviewChecklistEntry[];
  riskFamilies: string[];
}): void {
  const declaredRiskFamilies = new Set(payload.riskFamilies);
  const undeclared = uniqueStrings(
    payload.checklists
      .filter((entry) => !declaredRiskFamilies.has(entry.risk_family))
      .map((entry) => entry.risk_family),
  );
  if (undeclared.length > 0) {
    throw new Error(
      `--pre-review-check entries must reference declared --risk-family values: ${undeclared.join(
        ', ',
      )}.`,
    );
  }
}

function evaluatePreReviewChecklist(payload: {
  checklists: StageStatePreReviewChecklistEntry[];
  riskFamilies: string[];
}): {
  blockers: string[];
  status: StageControllerResult['pre_review_checklist_status'];
} {
  if (payload.riskFamilies.length === 0) {
    return { status: 'not_required', blockers: [] };
  }

  const blockedEntries = payload.checklists.filter((entry) => entry.status === 'blocked');
  if (blockedEntries.length > 0) {
    return {
      status: 'blocked',
      blockers: blockedEntries.map(
        (entry) => `${entry.risk_family}/${entry.id} blocked: ${entry.summary}`,
      ),
    };
  }

  const blockers: string[] = [];
  for (const riskFamily of payload.riskFamilies) {
    const entriesForFamily = payload.checklists.filter((entry) => entry.risk_family === riskFamily);
    const requiredIds = BUILT_IN_PRE_REVIEW_CHECKLIST_IDS.get(riskFamily);
    if (requiredIds) {
      const presentNonBlockedIds = new Set(
        entriesForFamily
          .filter((entry) => entry.status === 'pass' || entry.status === 'not_applicable')
          .map((entry) => entry.id),
      );
      const missingIds = requiredIds.filter((id) => !presentNonBlockedIds.has(id));
      if (missingIds.length > 0) {
        blockers.push(`${riskFamily} missing checklist entries: ${missingIds.join(', ')}`);
      }
      continue;
    }
    if (
      !entriesForFamily.some(
        (entry) => entry.status === 'pass' || entry.status === 'not_applicable',
      )
    ) {
      blockers.push(`${riskFamily} requires at least one pass or not_applicable checklist entry`);
    }
  }

  if (blockers.length > 0) {
    return { status: 'missing', blockers };
  }
  return { status: 'complete', blockers: [] };
}

function stageSchemaMetadata(payload: {
  featureId: string;
  logPath: string;
  metadata: Record<string, unknown>;
}): Record<string, unknown> {
  return normalizeMetadataForStageState(payload);
}

function commandUsage(command: StageControllerCommand): string {
  const implementationScopeSuffix =
    command === 'implementation'
      ? ' [--implementation-scope <non-code|code-bearing>] when used with --ready-for-close'
      : '';
  const implementationPreReviewSuffix =
    command === 'implementation' ? ' [--risk-family <id>] [--pre-review-check <dsl>]' : '';
  return [
    `${command} --feature-id <id> --session-id <id> [--trace-runtime <name>] [--skill-used <name>] [--skill-issue <text>] [--skill-followup <text>] [--process-miss <dsl>] [--phase-scope <text>] [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]${implementationScopeSuffix}${implementationPreReviewSuffix}`,
    `${command} --feature-id <id> --session-id <id> [--trace-runtime <name>] --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`,
  ].join('\n');
}

function nextCommandsForState(
  command: StageControllerCommand,
  stageState: StageControllerResult['stage_state'],
): string[] {
  if (stageState === 'blocked') {
    return [`dossier-engineer ${command} --feature-id <id> --session-id <id>`];
  }
  if (stageState === 'ready_for_close') {
    return [
      'dossier-engineer dossier-verify ...',
      'dossier-engineer review-artifact ...',
      'dossier-engineer dossier-step-close ...',
    ];
  }
  return [`dossier-engineer ${command} --feature-id <id> --session-id <id> --ready-for-close`];
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
  phaseScope: string | null;
  processMisses: StageStateProcessMiss[];
  root: string;
  sessionId: string;
  skillFollowups: string[];
  skillIssues: string[];
  skillsUsed: string[];
  traceRuntime: string | null;
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
    primary_feature_id: payload.featureId,
    primary_backlog_item_key: payload.backlogItemKey,
    phase_scope: payload.phaseScope ?? 'feature-intake',
    start_ts: now,
    entered_ts: now,
    ready_for_close_ts: now,
    stage_state: 'ready_for_close',
    backlog_followup_required: false,
    backlog_followup_kind: null,
    backlog_followup_resolved: true,
    review_artifacts: [],
    verification_artifacts: [],
    required_audit_classes: ['spec-conformance-reviewer'],
    executed_audit_classes: [],
    required_external_review_pending: true,
    review_events: [],
    reviewer_skills: [],
    reviewer_agent_ids: [],
    review_trace_commits: [],
    degraded_review_present: false,
    invalidated_review_present: false,
    stale_review_present: false,
    skills_used: payload.skillsUsed,
    skill_issues: payload.skillIssues,
    skill_followups: payload.skillFollowups,
    process_misses: payload.processMisses,
    transition_events: transitionEvents,
    session_id: payload.sessionId,
    trace_runtime: payload.traceRuntime,
    trace_locator_kind: 'session_id',
    final_delivery_commit: getCurrentCommit(payload.root),
    final_closure_commit: null,
  };
  const normalizedMetadata = stageSchemaMetadata({
    featureId: payload.featureId,
    logPath: relPath,
    metadata,
  });
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', 'feature-intake'),
    absPath,
    'feature-intake log',
  );
  await writeTextAtomic(
    absPath,
    renderStageLog(normalizedMetadata, {
      notes: ['Feature cycle opened by feature-intake.'],
    }),
  );
  await syncStageStateFromMetadata({
    root: payload.root,
    featureId: payload.featureId,
    metadata: normalizedMetadata,
    logPath: relPath,
  });
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

  const provenance = parseStageProvenanceInput(args);
  const annotations = parseStageAnnotationsInput(args);
  const preReviewChecklistInput = parsePreReviewChecklistInput(command, args);
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
  const implementationScopeRaw = takeOption(args, '--implementation-scope');
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
  const lifecycleReconciliation = await evaluateBacklogLifecycleReconciliation({
    root,
    stage: command,
    itemKey: backlogItemKey,
  });
  const lifecycleFollowupRequired =
    lifecycleReconciliation.target !== null && !lifecycleReconciliation.reconciled;
  const effectiveBacklogFollowupRequired = backlogFollowupRequired || lifecycleFollowupRequired;
  const effectiveBacklogFollowupKind =
    backlogFollowupKind ?? (lifecycleFollowupRequired ? 'backlog-lifecycle-actualization' : null);
  const effectiveBacklogFollowupResolved = lifecycleFollowupRequired
    ? false
    : backlogFollowupResolved;
  const latestForStage = await loadLatestStageLog(root, command, featureId, requestedCycleId);
  const latestFeatureIntake =
    command === 'feature-intake'
      ? null
      : await loadLatestStageLog(root, 'feature-intake', featureId);
  const latestImplementation =
    command === 'feature-intake'
      ? null
      : await loadLatestStageLog(root, 'implementation', featureId);
  const currentStageState =
    command === 'feature-intake' ? null : await readStageState(root, command, featureId);
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

  if (command !== 'implementation' && implementationScopeRaw) {
    throw new Error('--implementation-scope is only allowed for implementation.');
  }
  if (command === 'implementation' && implementationScopeRaw && action !== 'ready_for_close') {
    throw new Error(
      '--implementation-scope is only allowed with implementation --ready-for-close.',
    );
  }

  if (!latestForStage && action !== 'entered') {
    throw new Error(
      `No existing ${command} stage cycle found for ${featureId}. Start the stage before using ${action}.`,
    );
  }

  const cycleId = currentStageState?.cycle_id ?? `${command}-${crypto.randomUUID().slice(0, 8)}`;
  const enteredTs = currentStageState?.entered_ts ?? now;
  const readyForCloseTs =
    action === 'ready_for_close' ? now : currentStageState?.ready_for_close_ts;
  const existingEvents = currentStageState
    ? [...currentStageState.transition_events]
    : Array.isArray(latestForStage?.metadata.transition_events)
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
  const resetImplementationEntry =
    command === 'implementation' &&
    action !== 'ready_for_close' &&
    (currentStageState?.step_close_ts !== null || currentStageState?.process_complete_ts !== null);
  const carryStageEvidence = action === 'ready_for_close';
  const existingPreReviewRiskFamilies =
    command === 'implementation' && !resetImplementationEntry
      ? (currentStageState?.pre_review_risk_families ?? [])
      : [];
  const existingPreReviewChecklists =
    command === 'implementation' && !resetImplementationEntry
      ? (currentStageState?.pre_review_checklists ?? [])
      : [];
  const preReviewRiskFamilies =
    command === 'implementation'
      ? uniqueStrings([...existingPreReviewRiskFamilies, ...preReviewChecklistInput.riskFamilies])
      : [];
  const preReviewChecklists =
    command === 'implementation'
      ? mergePreReviewChecklists(
          existingPreReviewChecklists,
          preReviewChecklistInput.checklistEntries,
        )
      : [];
  if (command === 'implementation') {
    assertPreReviewChecklistDeclarations({
      riskFamilies: preReviewRiskFamilies,
      checklists: preReviewChecklists,
    });
  }
  const preReviewEvaluation =
    command === 'implementation'
      ? evaluatePreReviewChecklist({
          riskFamilies: preReviewRiskFamilies,
          checklists: preReviewChecklists,
        })
      : { status: 'not_required' as const, blockers: [] };
  if (
    command === 'implementation' &&
    action === 'ready_for_close' &&
    preReviewEvaluation.status !== 'not_required' &&
    preReviewEvaluation.status !== 'complete'
  ) {
    throw new Error(
      `implementation pre-review checklist is ${preReviewEvaluation.status}: ${preReviewEvaluation.blockers.join(
        '; ',
      )}`,
    );
  }
  const implementationReviewScope =
    command === 'implementation'
      ? action === 'ready_for_close'
        ? ensureEnumValue(
            implementationScopeRaw ??
              currentStageState?.implementation_review_scope ??
              'code-bearing',
            IMPLEMENTATION_REVIEW_SCOPES,
            '--implementation-scope',
          )
        : (currentStageState?.implementation_review_scope ?? null)
      : null;
  const stageEntryCommit =
    command === 'implementation'
      ? resetImplementationEntry
        ? getCurrentCommit(root)
        : (currentStageState?.stage_entry_commit ?? getCurrentCommit(root))
      : null;
  const requiredAuditClasses = requiredAuditClassesForStage(command, implementationReviewScope);
  const metadata: Record<string, unknown> = {
    version: 1,
    stage: command,
    feature_id: featureId,
    feature_cycle_id: featureCycleId,
    cycle_id: cycleId,
    backlog_item_key: backlogItemKey,
    primary_feature_id: featureId,
    primary_backlog_item_key: backlogItemKey,
    phase_scope: annotations.phaseScope ?? currentStageState?.phase_scope ?? command,
    stage_state: stageState,
    start_ts: enteredTs,
    entered_ts: enteredTs,
    ready_for_close_ts: readyForCloseTs ?? null,
    transition_events: existingEvents,
    backlog_followup_required: effectiveBacklogFollowupRequired,
    backlog_followup_kind: effectiveBacklogFollowupKind,
    backlog_followup_resolved: effectiveBacklogFollowupResolved,
    ...lifecycleReconciliationMetadata(lifecycleReconciliation),
    review_artifacts: carryStageEvidence ? (currentStageState?.review_artifacts ?? []) : [],
    verification_artifacts: carryStageEvidence
      ? (currentStageState?.verification_artifacts ?? [])
      : [],
    required_audit_classes: requiredAuditClasses,
    executed_audit_classes: carryStageEvidence
      ? (currentStageState?.executed_audit_classes ?? [])
      : [],
    required_external_review_pending: carryStageEvidence
      ? (currentStageState?.required_external_review_pending ?? true)
      : true,
    review_events: carryStageEvidence ? (currentStageState?.review_events ?? []) : [],
    reviewer_skills: carryStageEvidence ? (currentStageState?.reviewer_skills ?? []) : [],
    reviewer_agent_ids: carryStageEvidence ? (currentStageState?.reviewer_agent_ids ?? []) : [],
    review_trace_commits: carryStageEvidence ? (currentStageState?.review_trace_commits ?? []) : [],
    degraded_review_present: carryStageEvidence
      ? (currentStageState?.degraded_review_present ?? false)
      : false,
    invalidated_review_present: carryStageEvidence
      ? (currentStageState?.invalidated_review_present ?? false)
      : false,
    stale_review_present: carryStageEvidence
      ? (currentStageState?.stale_review_present ?? false)
      : false,
    skills_used: uniqueStrings([
      ...(currentStageState?.skills_used ?? []),
      ...annotations.skillsUsed,
    ]),
    skill_issues: uniqueStrings([
      ...(currentStageState?.skill_issues ?? []),
      ...annotations.skillIssues,
    ]),
    skill_followups: uniqueStrings([
      ...(currentStageState?.skill_followups ?? []),
      ...annotations.skillFollowups,
    ]),
    process_misses: mergeProcessMisses(
      currentStageState?.process_misses ?? [],
      annotations.processMisses,
    ),
    session_id: provenance.sessionId,
    trace_runtime: provenance.traceRuntime,
    trace_locator_kind: 'session_id',
    final_delivery_commit: action === 'ready_for_close' ? getCurrentCommit(root) : null,
    final_closure_commit: carryStageEvidence
      ? (currentStageState?.final_closure_commit ?? null)
      : null,
  };
  if (command === 'implementation') {
    metadata.implementation_review_scope = implementationReviewScope;
    metadata.stage_entry_commit = stageEntryCommit;
    metadata.required_security_review = implementationReviewScope === 'code-bearing';
    metadata.security_trigger_reasons =
      stageState === 'ready_for_close' ? (currentStageState?.security_trigger_reasons ?? []) : [];
    metadata.pre_review_risk_families = preReviewRiskFamilies;
    metadata.pre_review_checklists = preReviewChecklists;
    metadata.pre_review_checklist_status = preReviewEvaluation.status;
    metadata.pre_review_checklist_blockers = preReviewEvaluation.blockers;
  }
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
  const normalizedMetadata = stageSchemaMetadata({
    featureId,
    logPath: relPath,
    metadata,
  });
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
      renderStageLog(normalizedMetadata, {
        existingContent: latestForStage?.content ?? null,
        notes: noteValues,
      }),
    );
    await syncStageStateFromMetadata({
      root,
      featureId,
      metadata: normalizedMetadata,
      logPath: relPath,
    });
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
    ready_for_close_ts: readyForCloseTs ?? null,
    transition_events: existingEvents,
    backlog_followup_required: effectiveBacklogFollowupRequired,
    backlog_followup_kind: effectiveBacklogFollowupKind,
    backlog_followup_resolved: effectiveBacklogFollowupResolved,
    pre_review_risk_families: preReviewRiskFamilies,
    pre_review_checklist_status: preReviewEvaluation.status,
    pre_review_checklist_blockers: preReviewEvaluation.blockers,
    log_path: relPath.split(path.sep).join('/'),
    next_commands: nextCommandsForState(command, stageState),
  };
}

export async function recordStepCloseOnStageLog(payload: {
  auditSummary?: AuditSummaryPayload;
  backlogLifecycleReconciliation?: BacklogLifecycleReconciliation;
  finalClosureCommit: string | null;
  featureId: string;
  processComplete: boolean;
  reviewArtifactPaths: string[];
  root: string;
  step: string;
  stepArtifactPath: string;
  verificationArtifactPath: string | null;
}): Promise<void> {
  const stageName = payload.step as LoggedStage;
  if (stageName !== 'feature-intake' && !STAGE_CONTROLLER_COMMANDS.includes(stageName)) {
    return;
  }
  const latest = await loadLatestStageLog(
    payload.root,
    stageName,
    sanitizeFeatureId(payload.featureId, 'feature id'),
  );
  const currentStageState = await readStageState(payload.root, stageName, payload.featureId);
  if (!latest) {
    throw new Error(`No ${stageName} stage log found for ${payload.featureId}.`);
  }

  const now = new Date().toISOString();
  const metadata = {
    ...latest.metadata,
    ...(currentStageState ? machineMetadataFromStageState(currentStageState) : {}),
    step_close_ts: now,
    step_artifact: payload.stepArtifactPath,
    ...(payload.backlogLifecycleReconciliation
      ? lifecycleReconciliationMetadata(payload.backlogLifecycleReconciliation)
      : {}),
    review_artifacts: uniqueStrings([
      ...(currentStageState?.review_artifacts ?? []),
      ...payload.reviewArtifactPaths,
    ]),
    verification_artifacts: uniqueStrings([
      ...(currentStageState?.verification_artifacts ?? []),
      payload.verificationArtifactPath,
    ]),
    final_closure_commit: payload.finalClosureCommit,
    ...(payload.auditSummary
      ? {
          required_audit_classes: payload.auditSummary.requiredAuditClasses,
          executed_audit_classes: payload.auditSummary.executedAuditClasses,
          required_external_review_pending: payload.auditSummary.requiredExternalReviewPending,
          reviewer_skills: payload.auditSummary.reviewerSkills,
          reviewer_agent_ids: payload.auditSummary.reviewerAgentIds,
          review_trace_commits: payload.auditSummary.reviewTraceCommits,
          degraded_review_present: payload.auditSummary.degradedReviewPresent,
          invalidated_review_present: payload.auditSummary.invalidatedReviewPresent,
          stale_review_present: payload.auditSummary.staleReviewPresent,
          required_security_review: payload.auditSummary.requiredSecurityReview,
          implementation_review_scope: payload.auditSummary.implementationReviewScope,
          security_trigger_reasons: payload.auditSummary.securityTriggerReasons,
        }
      : {}),
    ...(payload.processComplete ? { process_complete_ts: now } : {}),
    ...(payload.processComplete && stageName === 'feature-intake'
      ? { intake_process_complete_ts: now }
      : {}),
  };
  const normalizedMetadata = stageSchemaMetadata({
    featureId: payload.featureId,
    logPath: path.relative(payload.root, latest.absPath),
    metadata,
  });
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', stageName),
    latest.absPath,
    `${stageName} stage log`,
  );
  await writeTextAtomic(
    latest.absPath,
    renderStageLog(normalizedMetadata, {
      existingContent: latest.content,
    }),
  );
  await syncStageStateFromMetadata({
    root: payload.root,
    featureId: payload.featureId,
    metadata: normalizedMetadata,
    logPath: path.relative(payload.root, latest.absPath),
  });
}

export async function recordReviewArtifactOnStageLog(payload: {
  allowedByPolicy: boolean;
  artifactPath: string;
  eventCommit: string | null;
  featureId: string;
  implementationScope: ImplementationReviewScope | null;
  invalidated: boolean;
  latestCopyPath: string | null;
  mustFixCount: number;
  reviewMode: ReviewMode;
  reviewAttemptId: string | null;
  reviewRoundId: string | null;
  reviewRoundNumber: number | null;
  reviewer: string;
  reviewerAgentId: string | null;
  reviewerSkill: string | null;
  reviewerThreadId: string | null;
  root: string;
  securityTriggerReason: string | null;
  stage: LoggedStage;
  stale: boolean;
  verdict: 'FAIL' | 'PASS';
  auditClass: AuditClass;
}): Promise<void> {
  const latest = await loadLatestStageLog(
    payload.root,
    payload.stage,
    sanitizeFeatureId(payload.featureId, 'feature id'),
  );
  const currentStageState = await readStageState(payload.root, payload.stage, payload.featureId);
  if (!latest) {
    throw new Error(`No ${payload.stage} stage log found for ${payload.featureId}.`);
  }

  const recordedAt = new Date().toISOString();
  const reviewEvents = currentStageState
    ? reviewEventsFromStageState(currentStageState)
    : extractReviewEvents(latest.metadata);
  reviewEvents.push({
    artifact_path: payload.artifactPath,
    at: recordedAt,
    audit_class: payload.auditClass,
    allowed_by_policy: payload.allowedByPolicy,
    event_commit: payload.eventCommit,
    implementation_scope: payload.implementationScope,
    invalidated: payload.invalidated,
    latest_copy_path: payload.latestCopyPath,
    must_fix_count: payload.mustFixCount,
    recorded_at: recordedAt,
    review_mode: payload.reviewMode,
    review_attempt_id: payload.reviewAttemptId,
    review_round_id: payload.reviewRoundId,
    review_round_number: payload.reviewRoundNumber,
    reviewer: payload.reviewer,
    reviewer_agent_id: payload.reviewerAgentId,
    reviewer_skill: payload.reviewerSkill,
    reviewer_thread_id: payload.reviewerThreadId,
    security_trigger_reason: payload.securityTriggerReason,
    stale: payload.stale,
    verdict: payload.verdict,
  } as ReviewEventPayload & { at: string });

  const implementationScope =
    payload.stage === 'implementation'
      ? (payload.implementationScope ??
        currentStageState?.implementation_review_scope ??
        normalizeImplementationReviewScope(latest.metadata.implementation_review_scope))
      : null;
  const staleReviewPresent =
    currentStageState?.stale_review_present ??
    toBoolean(latest.metadata.stale_review_present) ??
    false;
  const summary = summarizeReviewPolicy(
    payload.stage,
    reviewEvents,
    implementationScope,
    staleReviewPresent,
  );
  const metadata = {
    ...latest.metadata,
    ...(currentStageState ? machineMetadataFromStageState(currentStageState) : {}),
    review_artifacts: uniqueStrings([
      ...(currentStageState?.review_artifacts ?? []),
      payload.artifactPath,
    ]),
    review_events: reviewEvents,
    required_audit_classes: summary.requiredAuditClasses,
    executed_audit_classes: summary.executedAuditClasses,
    required_external_review_pending: summary.requiredExternalReviewPending,
    reviewer_skills: summary.reviewerSkills,
    reviewer_agent_ids: summary.reviewerAgentIds,
    review_trace_commits: summary.reviewTraceCommits,
    degraded_review_present: summary.degradedReviewPresent,
    invalidated_review_present: summary.invalidatedReviewPresent,
    stale_review_present: summary.staleReviewPresent,
    required_security_review: summary.requiredSecurityReview,
    implementation_review_scope: summary.implementationReviewScope,
    security_trigger_reasons: summary.securityTriggerReasons,
    first_review_agent_started_ts:
      toNullableString(latest.metadata.first_review_agent_started_ts) ?? recordedAt,
    final_pass_ts: summary.requiredExternalReviewPending ? null : recordedAt,
  };
  const normalizedMetadata = stageSchemaMetadata({
    featureId: payload.featureId,
    logPath: path.relative(payload.root, latest.absPath),
    metadata,
  });
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', payload.stage),
    latest.absPath,
    `${payload.stage} stage log`,
  );
  await writeTextAtomic(
    latest.absPath,
    renderStageLog(normalizedMetadata, {
      existingContent: latest.content,
    }),
  );
  await syncStageStateFromMetadata({
    root: payload.root,
    featureId: payload.featureId,
    metadata: normalizedMetadata,
    logPath: path.relative(payload.root, latest.absPath),
  });
}

export async function recordVerificationArtifactOnStageLog(payload: {
  artifactPath: string;
  eventCommit: string | null;
  featureId: string;
  root: string;
  stage: LoggedStage;
}): Promise<void> {
  const latest = await loadLatestStageLog(
    payload.root,
    payload.stage,
    sanitizeFeatureId(payload.featureId, 'feature id'),
  );
  const currentStageState = await readStageState(payload.root, payload.stage, payload.featureId);
  if (!latest) {
    throw new Error(`No ${payload.stage} stage log found for ${payload.featureId}.`);
  }
  const metadata = {
    ...latest.metadata,
    ...(currentStageState ? machineMetadataFromStageState(currentStageState) : {}),
    verification_artifacts: uniqueStrings([
      ...(currentStageState?.verification_artifacts ?? []),
      payload.artifactPath,
    ]),
    verification_trace_commit: payload.eventCommit,
  };
  const normalizedMetadata = stageSchemaMetadata({
    featureId: payload.featureId,
    logPath: path.relative(payload.root, latest.absPath),
    metadata,
  });
  await assertManagedWritePath(
    payload.root,
    path.join(payload.root, '.dossier', 'logs', payload.stage),
    latest.absPath,
    `${payload.stage} stage log`,
  );
  await writeTextAtomic(
    latest.absPath,
    renderStageLog(normalizedMetadata, {
      existingContent: latest.content,
    }),
  );
  await syncStageStateFromMetadata({
    root: payload.root,
    featureId: payload.featureId,
    metadata: normalizedMetadata,
    logPath: path.relative(payload.root, latest.absPath),
  });
}
