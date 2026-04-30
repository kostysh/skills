import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

import {
  ACCEPTANCE_KINDS,
  AUTHORITIES,
  BASELINE_MODES,
  BASELINE_STATUSES,
  CAPABILITY_STATUSES,
  DELIVERY_KINDS,
  DOSSIER_DIR,
  type Artifact,
  type CommandResult,
  type NextAction,
  RELATIONS,
  REVIEW_CLASSES,
  type RuntimeContext,
  SCHEMA_VERSION,
  SOURCE_KINDS,
  SOURCE_REVIEW_VERDICTS,
  STAGES,
  type Stage,
  VERDICTS,
  WORK_TYPES,
  isOneOf,
  isoNow,
} from './domain.ts';
import { BlockedError, UsageError } from './errors.ts';
import {
  discoverRoot,
  ensureDossierDirs,
  expectedArtifactType,
  findArtifactById,
  findArtifactsByType,
  hashFile,
  hashObject,
  isUrlLike,
  loadArtifacts,
  localPathExists,
  makeId,
  newArtifactFrontmatter,
  readArtifactFile,
  toPosix,
  writeArtifactFile,
} from './infra.ts';

export interface ParsedCommand {
  readonly words: string[];
  readonly options: Record<string, string | boolean | string[]>;
  readonly positionals: string[];
  readonly raw: string;
}

const artifactInfo = (artifact: Artifact) => ({
  path: artifact.path,
  artifact_type: String(artifact.frontmatter.artifact_type ?? ''),
  id: String(artifact.frontmatter.id ?? artifact.frontmatter.project_id ?? ''),
});

const value = (command: ParsedCommand, name: string): string | undefined => {
  const raw = command.options[name];
  if (Array.isArray(raw)) return raw.at(-1);
  return typeof raw === 'string' ? raw : undefined;
};

const values = (command: ParsedCommand, name: string): string[] => {
  const raw = command.options[name];
  if (Array.isArray(raw)) return raw;
  return typeof raw === 'string' ? [raw] : [];
};

const hasFlag = (command: ParsedCommand, name: string): boolean => command.options[name] === true;

const requireValue = (command: ParsedCommand, name: string): string => {
  const raw = value(command, name);
  if (raw === undefined || raw.trim() === '') {
    throw new UsageError(`Missing required option --${name}.`);
  }
  return raw;
};

const requireEnum = <T extends readonly string[]>(
  command: ParsedCommand,
  name: string,
  allowed: T,
): T[number] => {
  const raw = requireValue(command, name);
  if (!isOneOf(raw, allowed)) {
    throw new UsageError(`Invalid --${name}: ${raw}. Expected one of: ${allowed.join(', ')}.`);
  }
  return raw;
};

const body = (title: string, sections: readonly string[]): string =>
  [`# ${title}`, '', ...sections.flatMap((section) => [`## ${section}`, ''])].join('\n');

const next = (command: string, reason: string): NextAction => ({
  command,
  reason,
});

const BODY_COMPLETION_ARTIFACT_TYPES = new Set([
  'source',
  'capability',
  'baseline',
  'guardrail',
  'work_item',
  'review',
  'verification',
  'changeset',
]);

const bodyCompletionNextAction = (
  createdArtifacts: CommandResult['created_artifacts'],
): NextAction | undefined => {
  const paths = createdArtifacts
    .filter((artifact) => BODY_COMPLETION_ARTIFACT_TYPES.has(artifact.artifact_type ?? ''))
    .map((artifact) => artifact.path);
  if (paths.length === 0) return undefined;
  const target = paths.length === 1 ? paths[0] : `${paths.length} created dossier artifacts`;
  return next(
    `edit body sections in ${target}`,
    'Complete the human-readable body before stage close, handoff, PR preparation, or final response.',
  );
};

const withBodyCompletionReminder = (
  patch: Partial<CommandResult> & Pick<CommandResult, 'result'>,
): Partial<CommandResult> & Pick<CommandResult, 'result'> => {
  const createdArtifacts = patch.created_artifacts ?? [];
  const reminder = bodyCompletionNextAction(createdArtifacts);
  if (reminder === undefined) return patch;
  return {
    ...patch,
    next_actions: [...(patch.next_actions ?? []), reminder],
  };
};

const result = (
  command: ParsedCommand,
  patch: Partial<CommandResult> & Pick<CommandResult, 'result'>,
): CommandResult => ({
  command: command.raw,
  created_artifacts: [],
  changed_artifacts: [],
  warnings: [],
  blockers: [],
  next_actions: [],
  ...withBodyCompletionReminder(patch),
});

const sourceRef = (sourceId: string, anchor?: string) => ({
  source_id: sourceId,
  anchors: anchor ? [anchor] : [],
});

const resolveSourcePart = (source: string): { source_id: string; anchor: string | null } => {
  const [source_id, anchor] = source.split('#');
  if (source_id === undefined || source_id.trim() === '') {
    throw new UsageError('Source reference must be <source-id> or <source-id>#<anchor>.');
  }
  return { source_id, anchor: anchor ?? null };
};

const artifactPath = (kind: string, id: string): string => {
  switch (kind) {
    case 'source':
      return `${DOSSIER_DIR}/sources/${id}.md`;
    case 'capability':
      return `${DOSSIER_DIR}/capabilities/${id}.md`;
    case 'baseline':
      return `${DOSSIER_DIR}/baselines/${id}.md`;
    case 'guardrail':
      return `${DOSSIER_DIR}/guardrails/${id}.md`;
    case 'work':
      return `${DOSSIER_DIR}/work-items/${id}.md`;
    case 'source-review':
      return `${DOSSIER_DIR}/source-reviews/${id}.md`;
    case 'changeset':
      return `${DOSSIER_DIR}/changesets/${id}.md`;
    case 'retro':
      return `${DOSSIER_DIR}/retro/${id}.md`;
    default:
      throw new Error(`Unknown artifact path kind: ${kind}`);
  }
};

const evidencePathsExist = async (root: string, paths: readonly string[]): Promise<string[]> => {
  const missing: string[] = [];
  for (const evidencePath of paths) {
    if (!isUrlLike(evidencePath) && !(await localPathExists(path.resolve(root, evidencePath)))) {
      missing.push(evidencePath);
    }
  }
  return missing;
};

const loadRootArtifacts = async (ctx: RuntimeContext, command: ParsedCommand) => {
  const root = await discoverRoot(ctx.cwd, value(command, 'root'), command.words.join(' '));
  const loaded = await loadArtifacts(root);
  return { root, ...loaded };
};

const updateArtifact = async (
  root: string,
  artifact: Artifact,
  frontmatter: Record<string, unknown>,
  now: string,
): Promise<Artifact> => {
  const updated = { ...frontmatter, updated_at: now };
  await writeArtifactFile(root, artifact.path, updated, artifact.body);
  return { ...artifact, frontmatter: updated };
};

const materialWorkHash = (
  work: Record<string, unknown>,
  capabilities: readonly Artifact[],
  sources: readonly Artifact[],
): string => {
  const capabilityRefs = (
    ((work.delivery as Record<string, unknown> | undefined)?.capability_refs as unknown[]) ?? []
  )
    .map((entry) => (entry as Record<string, unknown>).capability_id)
    .filter((entry): entry is string => typeof entry === 'string');
  const sourceRefs = ((work.source_refs as unknown[]) ?? [])
    .map((entry) => (entry as Record<string, unknown>).source_id)
    .filter((entry): entry is string => typeof entry === 'string');
  return hashObject({
    source_refs: work.source_refs,
    source_hashes: sources
      .filter((source) => sourceRefs.includes(String(source.frontmatter.id)))
      .map((source) => ({
        id: source.frontmatter.id,
        content_hash: source.frontmatter.content_hash,
      })),
    capability_refs: capabilityRefs,
    capabilities: capabilities
      .filter((capability) => capabilityRefs.includes(String(capability.frontmatter.id)))
      .map((capability) => ({
        id: capability.frontmatter.id,
        claim: capability.frontmatter.claim,
        anti_claims: capability.frontmatter.anti_claims,
        source_refs: capability.frontmatter.source_refs,
      })),
    delivery: work.delivery,
    acceptance: work.acceptance,
    demonstration: work.demonstration,
    anti_claims: work.anti_claims,
    challenge: work.challenge,
    dependencies: work.dependencies,
    risk: work.risk,
  });
};

const recomputeWorkHash = (work: Artifact, all: readonly Artifact[]): Record<string, unknown> => ({
  ...work.frontmatter,
  material_scope_hash: materialWorkHash(
    work.frontmatter,
    findArtifactsByType(all, 'capability'),
    findArtifactsByType(all, 'source'),
  ),
});

const sourceReviewOpenForWork = (work: Artifact, sourceReviews: readonly Artifact[]): boolean => {
  const refs = ((work.frontmatter.source_refs as unknown[]) ?? [])
    .map((entry) => (entry as Record<string, unknown>).source_id)
    .filter((entry): entry is string => typeof entry === 'string');
  return sourceReviews.some(
    (review) =>
      review.frontmatter.status === 'open' && refs.includes(String(review.frontmatter.source_id)),
  );
};

const openBlockers = (work: Artifact): unknown[] =>
  ((work.frontmatter.blockers as unknown[]) ?? []).filter(
    (entry) =>
      (entry as Record<string, unknown>).blocking !== false &&
      (entry as Record<string, unknown>).resolved_at == null,
  );

const workGateFindings = (work: Artifact): string[] => {
  const findings: string[] = [];
  const delivery = work.frontmatter.delivery as Record<string, unknown> | undefined;
  const kind = delivery?.kind;
  const acceptance = work.frontmatter.acceptance as Record<string, unknown> | undefined;
  const criteria = (acceptance?.criteria as unknown[]) ?? [];
  const demonstration = work.frontmatter.demonstration as Record<string, unknown> | undefined;
  const antiClaims = (work.frontmatter.anti_claims as unknown[]) ?? [];
  const challenge = work.frontmatter.challenge as Record<string, unknown> | undefined;

  if (kind === 'capability') {
    if (!criteria.some((entry) => (entry as Record<string, unknown>).kind === 'behavior')) {
      findings.push(`${work.frontmatter.id}: capability work lacks behavior acceptance criterion.`);
    }
    if (typeof demonstration?.scenario !== 'string' || demonstration.scenario.trim() === '') {
      findings.push(`${work.frontmatter.id}: capability work lacks demonstration scenario.`);
    }
    if (antiClaims.length === 0) {
      findings.push(`${work.frontmatter.id}: capability work lacks anti-claims.`);
    }
    if (challenge?.recorded !== true) {
      findings.push(`${work.frontmatter.id}: capability work lacks pre-implementation challenge.`);
    }
  }

  if (
    kind === 'support' &&
    (typeof delivery?.support_reason !== 'string' || delivery.support_reason.trim() === '')
  ) {
    findings.push(`${work.frontmatter.id}: support work lacks support reason.`);
  }

  return findings;
};

const reviewFresh = (work: Artifact, reviews: readonly Artifact[], auditClass: string): boolean =>
  reviews.some(
    (review) =>
      review.frontmatter.work_item_id === work.frontmatter.id &&
      review.frontmatter.audit_class === auditClass &&
      review.frontmatter.verdict === 'pass' &&
      review.frontmatter.material_scope_hash === work.frontmatter.material_scope_hash,
  );

const verificationFresh = (
  work: Artifact,
  verifications: readonly Artifact[],
  profile: string,
): boolean =>
  verifications.some(
    (verification) =>
      verification.frontmatter.work_item_id === work.frontmatter.id &&
      verification.frontmatter.profile === profile &&
      verification.frontmatter.verdict === 'pass' &&
      verification.frontmatter.material_scope_hash === work.frontmatter.material_scope_hash,
  );

const closureFindings = (work: Artifact, all: readonly Artifact[]): string[] => {
  const findings = workGateFindings(work);
  const delivery = work.frontmatter.delivery as Record<string, unknown> | undefined;
  const stageState = work.frontmatter.stage_state as Record<string, unknown> | undefined;
  const verifications = findArtifactsByType(all, 'verification');
  const reviews = findArtifactsByType(all, 'review');

  if (stageState?.implementation === 'closed' || work.frontmatter.lifecycle === 'implemented') {
    if (
      delivery?.kind === 'capability' &&
      !verificationFresh(work, verifications, 'behavioral-demo')
    ) {
      findings.push(
        `${work.frontmatter.id}: implementation closed without fresh behavioral-demo verification.`,
      );
    }
    if (
      delivery?.kind === 'capability' &&
      !reviewFresh(work, reviews, 'concept-conformance-reviewer')
    ) {
      findings.push(
        `${work.frontmatter.id}: implementation closed without fresh concept-conformance-reviewer review.`,
      );
    }
  }

  return findings;
};

export const runCommand = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const [head, second, third] = command.words;

  if (head === 'init') return init(ctx, command);
  if (head === 'status') return status(ctx, command);
  if (head === 'attention') return attention(ctx, command);
  if (head === 'queue') return queue(ctx, command);
  if (head === 'next') return nextForWork(ctx, command);
  if (head === 'lint') return lint(ctx, command);
  if (head === 'repair' && second === 'frontmatter') return repairFrontmatter(ctx, command);
  if (head === 'source' && second === 'add') return sourceAdd(ctx, command);
  if (head === 'source' && second === 'list') return sourceList(ctx, command);
  if (head === 'source' && second === 'refresh') return sourceRefresh(ctx, command);
  if (head === 'source' && second === 'impact') return sourceImpact(ctx, command);
  if (head === 'source' && second === 'review' && third === 'resolve')
    return sourceReviewResolve(ctx, command);
  if (head === 'capability' && second === 'create') return capabilityCreate(ctx, command);
  if (head === 'capability' && second === 'claim' && third === 'set')
    return capabilityClaimSet(ctx, command);
  if (head === 'capability' && second === 'anti-claim' && third === 'add')
    return capabilityAntiClaimAdd(ctx, command);
  if (head === 'capability' && second === 'demo' && third === 'record')
    return capabilityDemoRecord(ctx, command);
  if (head === 'capability' && second === 'check') return capabilityCheck(ctx, command);
  if (head === 'baseline' && second === 'create') return baselineCreate(ctx, command);
  if (head === 'baseline' && second === 'capability' && third === 'add')
    return baselineCapabilityAdd(ctx, command);
  if (head === 'guardrail' && second === 'add') return guardrailAdd(ctx, command);
  if (head === 'guardrail' && second === 'check') return guardrailCheck(ctx, command);
  if (head === 'guardrail' && second === 'resolve') return guardrailResolve(ctx, command);
  if (head === 'work' && second === 'create') return workCreate(ctx, command);
  if (head === 'work' && second === 'acceptance' && third === 'add')
    return workAcceptanceAdd(ctx, command);
  if (head === 'work' && second === 'demo' && third === 'set') return workDemoSet(ctx, command);
  if (head === 'work' && second === 'anti-claim' && third === 'add')
    return workAntiClaimAdd(ctx, command);
  if (head === 'work' && second === 'challenge' && third === 'record')
    return workChallengeRecord(ctx, command);
  if (head === 'work' && second === 'support' && third === 'explain')
    return workSupportExplain(ctx, command);
  if (head === 'work' && second === 'dependency' && third === 'add')
    return workDependencyAdd(ctx, command);
  if (head === 'work' && second === 'dependency' && third === 'remove')
    return workDependencyRemove(ctx, command);
  if (head === 'work' && second === 'blocker' && third === 'add')
    return workBlockerAdd(ctx, command);
  if (head === 'work' && second === 'blocker' && third === 'resolve')
    return workBlockerResolve(ctx, command);
  if (head === 'work' && second === 'risk' && third === 'set') return workRiskSet(ctx, command);
  if (head === 'work' && second === 'retire') return workRetire(ctx, command);
  if (head === 'work' && second === 'amend')
    return genericBlocked(
      command,
      'work amend requires structured change fields; this runtime does not infer semantic changes from summary only.',
    );
  if (head === 'work' && second === 'split') return workSplit(ctx, command);
  if (head === 'stage' && second === 'start') return stageTransition(ctx, command, 'start');
  if (head === 'stage' && second === 'ready') return stageTransition(ctx, command, 'ready');
  if (head === 'stage' && second === 'close') return stageTransition(ctx, command, 'close');
  if (head === 'stage' && second === 'reopen') return stageTransition(ctx, command, 'reopen');
  if (head === 'stage' && second === 'log') return stageLog(ctx, command);
  if (head === 'verify' && second === 'required') return verifyRequired(ctx, command);
  if (head === 'verify' && second === 'run') return verifyRun(ctx, command);
  if (head === 'verify' && second === 'record') return verifyRecord(ctx, command);
  if (head === 'review' && second === 'required') return reviewRequired(ctx, command);
  if (head === 'review' && second === 'record') return reviewRecord(ctx, command);
  if (head === 'hygiene' && second === 'run') return hygieneRun(ctx, command);
  if (head === 'changeset' && second === 'create') return changesetCreate(ctx, command);
  if (head === 'report' && second === 'create') return reportCreate(ctx, command);
  if (head === 'retro' && second === 'create') return retroCreate(ctx, command);

  throw new UsageError(`Unknown command: ${command.words.join(' ')}`);
};

const genericBlocked = (command: ParsedCommand, blocker: string): CommandResult =>
  result(command, {
    result: 'blocked',
    blockers: [blocker],
    next_actions: [next('dossier-engineer help', 'Review supported runtime command grammar.')],
    exitCode: 2,
  });

const init = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const root = await discoverRoot(ctx.cwd, value(command, 'root'), 'init');
  const projectName = requireValue(command, 'project-name');
  const reviewMode = value(command, 'review-mode') ?? 'risk_weighted';
  if (!['risk_weighted', 'strict', 'custom'].includes(reviewMode)) {
    throw new UsageError('Invalid --review-mode. Expected risk_weighted, strict, or custom.');
  }
  await ensureDossierDirs(root);
  const projectPath = `${DOSSIER_DIR}/project.md`;
  if (existsSync(path.join(root, projectPath)) && !hasFlag(command, 'force')) {
    throw new BlockedError(
      'Dossier project already exists. Use --force only to intentionally rewrite project metadata.',
    );
  }
  const now = isoNow(ctx.now());
  const projectId = await makeId(
    root,
    'PRJ',
    projectName,
    ctx.randomHex,
    () => projectPath,
    ctx.now(),
  );
  const frontmatter = {
    artifact_type: 'dossier_project',
    schema_version: SCHEMA_VERSION,
    project_id: projectId,
    project_name: projectName,
    review_mode: reviewMode,
    capability_policy: {
      require_concept_for_capabilities: true,
      require_behavioral_demo_for_capability_closure: true,
      require_anti_claim_for_capability_spec: true,
      require_challenge_before_implementation: true,
    },
    created_at: now,
    updated_at: now,
    verification_profiles: {
      default: { commands: [] },
      'behavioral-demo': { commands: [] },
    },
    review_policy: {
      capability_requires: ['concept-conformance-reviewer', 'spec-conformance-reviewer'],
      code_requires: ['code-reviewer'],
      risk_requires: { security: ['security-reviewer'] },
    },
    guardrail_defaults: {
      max_closed_support_without_recent_demo: 5,
    },
  };
  await writeArtifactFile(
    root,
    projectPath,
    frontmatter,
    body(projectName, ['Purpose', 'Dossier operating notes']),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: projectPath, artifact_type: 'dossier_project', id: projectId }],
    next_actions: [
      next(
        'dossier-engineer source add --path <path> --kind concept --authority canonical --title "<product concept>"',
        'Register the concept source before creating capabilities.',
      ),
      next(
        'dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <source-id>',
        'Use this when onboarding an already working project.',
      ),
    ],
  });
};

const status = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { artifacts, parseErrors } = await loadRootArtifacts(ctx, command);
  const capabilities = findArtifactsByType(artifacts, 'capability');
  const workItems = findArtifactsByType(artifacts, 'work_item');
  const sourceReviews = findArtifactsByType(artifacts, 'source_review');
  const guardrails = findArtifactsByType(artifacts, 'guardrail');
  const capabilitySummary = new Map<string, number>();
  const lifecycleSummary = new Map<string, number>();
  for (const capability of capabilities) {
    const key = String(capability.frontmatter.status ?? 'unknown');
    capabilitySummary.set(key, (capabilitySummary.get(key) ?? 0) + 1);
  }
  for (const work of workItems) {
    const key = String(work.frontmatter.lifecycle ?? 'unknown');
    lifecycleSummary.set(key, (lifecycleSummary.get(key) ?? 0) + 1);
  }
  const closureViolations = workItems.flatMap((work) => closureFindings(work, artifacts));
  const summary = [
    `Artifacts: ${artifacts.length}`,
    `Capabilities: ${[...capabilitySummary.entries()].map(([key, count]) => `${key}=${count}`).join(', ') || 'none'}`,
    `Work items: ${[...lifecycleSummary.entries()].map(([key, count]) => `${key}=${count}`).join(', ') || 'none'}`,
    `Open source reviews: ${sourceReviews.filter((review) => review.frontmatter.status === 'open').length}`,
    `Triggered guardrails: ${guardrails.filter((guardrail) => guardrail.frontmatter.status === 'triggered').length}`,
    `Closure violations: ${closureViolations.length}`,
  ];
  return result(command, {
    result: parseErrors.length === 0 && closureViolations.length === 0 ? 'success' : 'blocked',
    summary,
    findings: [...parseErrors, ...closureViolations],
    blockers: parseErrors.length > 0 ? ['Invalid artifact frontmatter exists.'] : [],
    next_actions: [
      next('dossier-engineer attention --root .', 'Inspect prioritized blockers.'),
      next('dossier-engineer queue --root .', 'Inspect execution-ready work.'),
    ],
    exitCode: parseErrors.length === 0 && closureViolations.length === 0 ? 0 : 2,
  });
};

const attention = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { artifacts, parseErrors } = await loadRootArtifacts(ctx, command);
  const findings = [
    ...parseErrors.map((entry) => `invalid artifact: ${entry}`),
    ...findArtifactsByType(artifacts, 'guardrail')
      .filter((artifact) => artifact.frontmatter.status === 'triggered')
      .map((artifact) => `triggered guardrail: ${artifact.frontmatter.id}`),
    ...findArtifactsByType(artifacts, 'source_review')
      .filter((artifact) => artifact.frontmatter.status === 'open')
      .map(
        (artifact) =>
          `open source review: ${artifact.frontmatter.id} for ${artifact.frontmatter.source_id}`,
      ),
    ...findArtifactsByType(artifacts, 'capability')
      .filter(
        (artifact) =>
          artifact.frontmatter.status === 'existing' &&
          ((artifact.frontmatter.demo_evidence as unknown[]) ?? []).length === 0,
      )
      .map((artifact) => `existing capability without demo evidence: ${artifact.frontmatter.id}`),
    ...findArtifactsByType(artifacts, 'work_item').flatMap((artifact) =>
      closureFindings(artifact, artifacts),
    ),
  ];
  return result(command, {
    result: findings.length === 0 ? 'success' : 'blocked',
    findings: findings.length === 0 ? ['No attention items.'] : findings,
    next_actions: [
      findings.length === 0
        ? next('dossier-engineer queue --root .', 'Select the next ready work item.')
        : next('dossier-engineer lint --root .', 'Validate structural issues before continuing.'),
    ],
    exitCode: findings.length === 0 ? 0 : 2,
  });
};

const queue = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const area = value(command, 'area');
  const owner = value(command, 'owner');
  const sourceReviews = findArtifactsByType(artifacts, 'source_review');
  const guardrailTriggered = findArtifactsByType(artifacts, 'guardrail').some(
    (entry) => entry.frontmatter.status === 'triggered',
  );
  const closed = new Set(
    findArtifactsByType(artifacts, 'work_item')
      .filter(
        (work) =>
          work.frontmatter.lifecycle === 'closed' || work.frontmatter.lifecycle === 'implemented',
      )
      .map((work) => String(work.frontmatter.id)),
  );
  const ready: string[] = [];
  const blocked: string[] = [];
  for (const work of findArtifactsByType(artifacts, 'work_item')) {
    if (['closed', 'retired', 'implemented'].includes(String(work.frontmatter.lifecycle))) continue;
    if (area !== undefined && !((work.frontmatter.area as unknown[]) ?? []).includes(area))
      continue;
    if (owner !== undefined && !((work.frontmatter.owners as unknown[]) ?? []).includes(owner))
      continue;
    const dependencies = (work.frontmatter.dependencies as unknown[]) ?? [];
    const blockers = [
      ...workGateFindings(work),
      ...openBlockers(work).map(
        (entry) => `${work.frontmatter.id}: open blocker ${(entry as Record<string, unknown>).id}`,
      ),
      ...dependencies
        .filter((dep) => !closed.has(String(dep)))
        .map((dep) => `${work.frontmatter.id}: dependency not closed ${dep}`),
    ];
    if (sourceReviewOpenForWork(work, sourceReviews))
      blockers.push(`${work.frontmatter.id}: linked source review is open.`);
    if (guardrailTriggered) blockers.push(`${work.frontmatter.id}: triggered guardrail exists.`);
    if (blockers.length === 0) {
      ready.push(String(work.frontmatter.id));
    } else {
      blocked.push(...blockers);
    }
  }
  return result(command, {
    result: 'success',
    summary: [`Ready work items: ${ready.length}`, ...ready.map((id) => `- ${id}`)],
    findings: blocked,
    next_actions:
      ready.length > 0
        ? [next(`dossier-engineer next --work ${ready[0]}`, 'Inspect the next safe action.')]
        : [next('dossier-engineer attention --root .', 'Resolve blockers before selecting work.')],
  });
};

const nextForWork = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const workId = requireValue(command, 'work');
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item') {
    throw new UsageError(`Work item not found: ${workId}`);
  }
  const findings = closureFindings(work, artifacts);
  if (findings.length > 0) {
    return result(command, {
      result: 'blocked',
      findings,
      next_actions: [
        next(
          `dossier-engineer capability check --work ${workId}`,
          'Inspect missing capability gates.',
        ),
      ],
      exitCode: 2,
    });
  }
  const state = work.frontmatter.stage_state as Record<string, unknown>;
  for (const stage of STAGES.filter((entry) => entry !== 'change-proposal')) {
    if (state[stage] === 'ready_for_close') {
      return result(command, {
        result: 'success',
        next_actions: [
          next(
            `dossier-engineer stage close --work ${workId} --stage ${stage}`,
            'Close the ready stage.',
          ),
        ],
      });
    }
    if (state[stage] === 'in_progress') {
      return result(command, {
        result: 'success',
        next_actions: [
          next(
            `dossier-engineer stage ready --work ${workId} --stage ${stage} --summary "<result>"`,
            'Mark the active stage ready once evidence is recorded.',
          ),
        ],
      });
    }
    if (state[stage] !== 'closed') {
      return result(command, {
        result: 'success',
        next_actions: [
          next(
            `dossier-engineer stage start --work ${workId} --stage ${stage} --session <session-id>`,
            'Start the next required stage.',
          ),
        ],
      });
    }
  }
  return result(command, {
    result: 'success',
    next_actions: [
      next(
        `dossier-engineer hygiene run --work ${workId} --stage implementation`,
        'Run post-close hygiene after implementation closure.',
      ),
    ],
  });
};

const lint = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const root = await discoverRoot(ctx.cwd, value(command, 'root'), 'lint');
  const parseErrors: string[] = [];
  const artifacts: Artifact[] = [];
  const pathFilter = value(command, 'path');
  if (pathFilter !== undefined) {
    try {
      artifacts.push(await readArtifactFile(root, toPosix(pathFilter)));
    } catch (error) {
      parseErrors.push(`${pathFilter}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    const loaded = await loadArtifacts(root);
    parseErrors.push(...loaded.parseErrors);
    artifacts.push(...loaded.artifacts);
  }

  const findings: string[] = [...parseErrors];
  for (const forbidden of [
    '.dossier/state.json',
    'docs/dossier/state.json',
    'docs/dossier/index.json',
  ]) {
    if (existsSync(path.resolve(root, forbidden))) {
      findings.push(`Forbidden canonical state file exists: ${forbidden}`);
    }
  }
  const sourceIds = new Set(
    findArtifactsByType(artifacts, 'source').map((entry) => String(entry.frontmatter.id)),
  );
  const capabilityIds = new Set(
    findArtifactsByType(artifacts, 'capability').map((entry) => String(entry.frontmatter.id)),
  );
  const workIds = new Set(
    findArtifactsByType(artifacts, 'work_item').map((entry) => String(entry.frontmatter.id)),
  );
  for (const artifact of artifacts) {
    const expected = expectedArtifactType(artifact.path);
    if (expected !== null && artifact.frontmatter.artifact_type !== expected) {
      findings.push(`${artifact.path}: artifact_type should be ${expected}.`);
    }
    if (artifact.frontmatter.schema_version !== SCHEMA_VERSION) {
      findings.push(`${artifact.path}: schema_version should be "${SCHEMA_VERSION}".`);
    }
    const id = artifact.frontmatter.id ?? artifact.frontmatter.project_id;
    if (
      expected !== 'dossier_project' &&
      typeof id === 'string' &&
      !artifact.path.endsWith(`${id}.md`)
    ) {
      findings.push(`${artifact.path}: filename must match id ${id}.`);
    }
    if (artifact.frontmatter.artifact_type === 'capability') {
      for (const ref of (artifact.frontmatter.source_refs as unknown[]) ?? []) {
        if (!sourceIds.has(String((ref as Record<string, unknown>).source_id))) {
          findings.push(
            `${artifact.frontmatter.id}: missing source ref ${(ref as Record<string, unknown>).source_id}.`,
          );
        }
      }
      const claim = artifact.frontmatter.claim as Record<string, unknown> | undefined;
      if (
        artifact.frontmatter.status !== 'retired' &&
        [
          'actor',
          'trigger',
          'observable_behavior',
          'system_response',
          'state_change',
          'continuity',
        ].some((key) => typeof claim?.[key] !== 'string' || String(claim[key]).trim() === '')
      ) {
        findings.push(`${artifact.frontmatter.id}: capability claim is incomplete.`);
      }
      if (
        artifact.frontmatter.status === 'existing' &&
        ((artifact.frontmatter.demo_evidence as unknown[]) ?? []).length === 0
      ) {
        findings.push(
          `${artifact.frontmatter.id}: existing capability lacks pass demo evidence or observed baseline.`,
        );
      }
    }
    if (artifact.frontmatter.artifact_type === 'work_item') {
      for (const ref of (artifact.frontmatter.source_refs as unknown[]) ?? []) {
        if (!sourceIds.has(String((ref as Record<string, unknown>).source_id))) {
          findings.push(
            `${artifact.frontmatter.id}: missing source ref ${(ref as Record<string, unknown>).source_id}.`,
          );
        }
      }
      const delivery = artifact.frontmatter.delivery as Record<string, unknown> | undefined;
      for (const ref of (delivery?.capability_refs as unknown[]) ?? []) {
        if (!capabilityIds.has(String((ref as Record<string, unknown>).capability_id))) {
          findings.push(
            `${artifact.frontmatter.id}: missing capability ref ${(ref as Record<string, unknown>).capability_id}.`,
          );
        }
      }
      for (const dependency of (artifact.frontmatter.dependencies as unknown[]) ?? []) {
        if (!workIds.has(String(dependency))) {
          findings.push(`${artifact.frontmatter.id}: missing dependency ${dependency}.`);
        }
      }
      findings.push(...closureFindings(artifact, artifacts));
    }
  }

  return result(command, {
    result: findings.length === 0 ? 'success' : 'blocked',
    findings: findings.length === 0 ? ['No lint findings.'] : findings,
    blockers: findings.length === 0 ? [] : ['Dossier lint found errors.'],
    next_actions:
      findings.length === 0
        ? [next('dossier-engineer status --root .', 'Review derived readiness after validation.')]
        : [
            next(
              'dossier-engineer repair frontmatter --path <artifact-path> --type <artifact-type>',
              'Repair machine-owned frontmatter only when semantics are inferable.',
            ),
          ],
    exitCode: findings.length === 0 ? 0 : 3,
  });
};

const repairFrontmatter = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const root = await discoverRoot(ctx.cwd, value(command, 'root'), 'repair frontmatter');
  const targetPath = requireValue(command, 'path');
  const type = requireValue(command, 'type');
  if (!existsSync(path.resolve(root, targetPath))) {
    throw new UsageError(`Artifact path does not exist: ${targetPath}`);
  }
  let artifact: Artifact;
  try {
    artifact = await readArtifactFile(root, targetPath);
  } catch {
    throw new BlockedError(
      'Cannot safely repair missing or invalid frontmatter without risking semantic loss.',
    );
  }
  if (artifact.frontmatter.artifact_type !== type) {
    const updated: Record<string, unknown> = {
      ...artifact.frontmatter,
      artifact_type: type,
      schema_version: SCHEMA_VERSION,
    };
    await writeArtifactFile(root, artifact.path, updated, artifact.body);
    return result(command, {
      result: 'success',
      changed_artifacts: [
        {
          path: artifact.path,
          artifact_type: type,
          id: String(updated.id ?? updated.project_id ?? ''),
        },
      ],
      warnings: ['Only safe machine metadata was repaired; semantic fields were not invented.'],
      next_actions: [
        next(`dossier-engineer lint --path ${artifact.path}`, 'Validate the repaired artifact.'),
      ],
    });
  }
  return result(command, {
    result: 'success',
    summary: ['No repair needed.'],
    next_actions: [next(`dossier-engineer lint --path ${artifact.path}`, 'Validate the artifact.')],
  });
};

const sourceAdd = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const sourcePath = requireValue(command, 'path');
  const kind = requireEnum(command, 'kind', SOURCE_KINDS);
  const authority = requireEnum(command, 'authority', AUTHORITIES);
  const title = requireValue(command, 'title');
  const duplicate = findArtifactsByType(artifacts, 'source').find(
    (artifact) => artifact.frontmatter.source_path === sourcePath,
  );
  if (duplicate !== undefined && !hasFlag(command, 'allow-duplicate')) {
    return result(command, {
      result: 'blocked',
      warnings: [`Source path already registered: ${duplicate.frontmatter.id}`],
      blockers: ['Duplicate source path. Use --allow-duplicate only when intentional.'],
      next_actions: [next('dossier-engineer source list --root .', 'Inspect registered sources.')],
      exitCode: 2,
    });
  }
  const absoluteSourcePath = path.resolve(root, sourcePath);
  let hash: string | null = null;
  if (isUrlLike(sourcePath)) {
    if (kind !== 'external-reference') {
      throw new UsageError('URL-like source paths require --kind external-reference.');
    }
  } else {
    if (!(await localPathExists(absoluteSourcePath))) {
      throw new UsageError(`Source file does not exist: ${sourcePath}`);
    }
    hash = await hashFile(absoluteSourcePath);
  }
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'SRC',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('source', candidate),
    ctx.now(),
  );
  const frontmatter = {
    artifact_type: 'source',
    schema_version: SCHEMA_VERSION,
    id,
    title,
    source_path: sourcePath,
    source_kind: kind,
    authority,
    content_hash: { algorithm: 'sha256', value: hash },
    registered_at: now,
    changed_at: null,
    status: 'active',
    tags: values(command, 'tag'),
  };
  const relativePath = artifactPath('source', id);
  await writeArtifactFile(
    root,
    relativePath,
    frontmatter,
    body(title, ['Summary', 'Source interpretation', 'Notes']),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'source', id }],
    next_actions: [
      next(
        `dossier-engineer capability create --title "<capability>" --status intended --source ${id}`,
        'Map an observable capability to this source.',
      ),
      next(
        'dossier-engineer source refresh --root .',
        'Refresh sources after source files change.',
      ),
    ],
  });
};

const sourceList = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const statusFilter = value(command, 'status');
  const kindFilter = value(command, 'kind');
  const findings = findArtifactsByType(artifacts, 'source')
    .filter((source) => statusFilter === undefined || source.frontmatter.status === statusFilter)
    .filter((source) => kindFilter === undefined || source.frontmatter.source_kind === kindFilter)
    .map(
      (source) =>
        `${source.frontmatter.id} ${source.frontmatter.source_kind} ${source.frontmatter.authority} ${source.frontmatter.source_path}`,
    );
  return result(command, {
    result: 'success',
    summary: findings.length === 0 ? ['No sources.'] : findings,
    next_actions: [
      next('dossier-engineer source refresh --root .', 'Check for changed source hashes.'),
    ],
  });
};

const impactedBySource = (sourceId: string, artifacts: readonly Artifact[]) => {
  const capabilities = findArtifactsByType(artifacts, 'capability').filter((capability) =>
    ((capability.frontmatter.source_refs as unknown[]) ?? []).some(
      (ref) => (ref as Record<string, unknown>).source_id === sourceId,
    ),
  );
  const capabilityIds = new Set(
    capabilities.map((capability) => String(capability.frontmatter.id)),
  );
  const workItems = findArtifactsByType(artifacts, 'work_item').filter((work) => {
    const direct = ((work.frontmatter.source_refs as unknown[]) ?? []).some(
      (ref) => (ref as Record<string, unknown>).source_id === sourceId,
    );
    const viaCapability = (
      ((work.frontmatter.delivery as Record<string, unknown> | undefined)
        ?.capability_refs as unknown[]) ?? []
    ).some((ref) => capabilityIds.has(String((ref as Record<string, unknown>).capability_id)));
    return direct || viaCapability;
  });
  return { capabilities, workItems };
};

const sourceRefresh = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const sourceId = value(command, 'source');
  const sources = findArtifactsByType(artifacts, 'source').filter(
    (source) => sourceId === undefined || source.frontmatter.id === sourceId,
  );
  if (sourceId !== undefined && sources.length === 0)
    throw new UsageError(`Source not found: ${sourceId}`);
  const changed: Artifact[] = [];
  const created: { path: string; artifact_type: string; id: string }[] = [];
  const warnings: string[] = [];
  const now = isoNow(ctx.now());
  for (const source of sources) {
    const sourcePath = String(source.frontmatter.source_path);
    if (isUrlLike(sourcePath)) continue;
    const absolute = path.resolve(root, sourcePath);
    if (!(await localPathExists(absolute))) {
      if (hasFlag(command, 'record-missing')) {
        const updated = await updateArtifact(
          root,
          source,
          { ...source.frontmatter, status: 'missing' },
          now,
        );
        changed.push(updated);
      } else {
        warnings.push(`${source.frontmatter.id}: missing local source ${sourcePath}`);
      }
      continue;
    }
    const currentHash = await hashFile(absolute);
    const contentHash = source.frontmatter.content_hash as Record<string, unknown> | undefined;
    if (contentHash?.value === currentHash) continue;
    const previousHash = typeof contentHash?.value === 'string' ? contentHash.value : null;
    const updated = await updateArtifact(
      root,
      source,
      {
        ...source.frontmatter,
        content_hash: { algorithm: 'sha256', value: currentHash },
        changed_at: now,
        status: 'active',
      },
      now,
    );
    changed.push(updated);
    if (previousHash !== null) {
      const impact = impactedBySource(String(source.frontmatter.id), artifacts);
      const srId = await makeId(
        root,
        'SR',
        `${source.frontmatter.title} review`,
        ctx.randomHex,
        (candidate) => artifactPath('source-review', candidate),
        ctx.now(),
      );
      const reviewPath = artifactPath('source-review', srId);
      await writeArtifactFile(
        root,
        reviewPath,
        {
          artifact_type: 'source_review',
          schema_version: SCHEMA_VERSION,
          id: srId,
          source_id: source.frontmatter.id,
          previous_hash: previousHash,
          current_hash: currentHash,
          status: 'open',
          opened_at: now,
          resolved_at: null,
          verdict: null,
          impacted_capabilities: impact.capabilities.map((entry) => entry.frontmatter.id),
          impacted_work_items: impact.workItems.map((entry) => entry.frontmatter.id),
        },
        body(`Source review ${srId}`, ['Change summary', 'Backlog impact', 'Resolution notes']),
      );
      created.push({
        path: reviewPath,
        artifact_type: 'source_review',
        id: srId,
      });
    }
  }
  return result(command, {
    result: warnings.length > 0 ? 'blocked' : 'success',
    changed_artifacts: changed.map(artifactInfo),
    created_artifacts: created,
    warnings,
    blockers: warnings.length > 0 ? ['Missing sources were detected.'] : [],
    next_actions:
      created.length > 0
        ? [
            next(
              'dossier-engineer attention --root .',
              'Resolve opened source reviews before linked work is ready.',
            ),
          ]
        : [next('dossier-engineer status --root .', 'Review current readiness.')],
    exitCode: warnings.length > 0 ? 2 : 0,
  });
};

const sourceImpact = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const sourceId = requireValue(command, 'source');
  const source = findArtifactById(artifacts, sourceId);
  if (source === undefined || source.frontmatter.artifact_type !== 'source')
    throw new UsageError(`Source not found: ${sourceId}`);
  const impact = impactedBySource(sourceId, artifacts);
  return result(command, {
    result: 'success',
    summary: [
      `Source: ${sourceId}`,
      `Impacted capabilities: ${impact.capabilities.map((entry) => entry.frontmatter.id).join(', ') || 'none'}`,
      `Impacted work items: ${impact.workItems.map((entry) => entry.frontmatter.id).join(', ') || 'none'}`,
    ],
    next_actions: [
      next(
        'dossier-engineer source refresh --source <source-id>',
        'Refresh hash and create a source review if content changed.',
      ),
    ],
  });
};

const sourceReviewResolve = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const reviewId = requireValue(command, 'review');
  const verdict = requireEnum(command, 'verdict', SOURCE_REVIEW_VERDICTS);
  const summary = requireValue(command, 'summary');
  const review = findArtifactById(artifacts, reviewId);
  if (review === undefined || review.frontmatter.artifact_type !== 'source_review')
    throw new UsageError(`Source review not found: ${reviewId}`);
  if (!['open', 'blocked'].includes(String(review.frontmatter.status)))
    throw new UsageError(`Source review is not open or blocked: ${reviewId}`);
  const now = isoNow(ctx.now());
  const updated = await updateArtifact(
    root,
    review,
    {
      ...review.frontmatter,
      status: verdict === 'blocked_pending_decision' ? 'blocked' : 'resolved',
      verdict,
      resolved_at: verdict === 'blocked_pending_decision' ? null : now,
    },
    now,
  );
  return result(command, {
    result: verdict === 'blocked_pending_decision' ? 'blocked' : 'success',
    changed_artifacts: [artifactInfo(updated)],
    blockers: verdict === 'blocked_pending_decision' ? [summary] : [],
    next_actions: [
      next(
        'dossier-engineer queue --root .',
        'Recompute ready work after source-review resolution.',
      ),
    ],
    exitCode: verdict === 'blocked_pending_decision' ? 2 : 0,
  });
};

const capabilityCreate = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const title = requireValue(command, 'title');
  const status = requireEnum(command, 'status', CAPABILITY_STATUSES);
  const sourceId = requireValue(command, 'source');
  if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'CAP',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('capability', candidate),
    ctx.now(),
  );
  const frontmatter = {
    ...newArtifactFrontmatter('capability', id, title, now),
    status,
    source_refs: [sourceRef(sourceId)],
    claim: {
      actor: null,
      trigger: null,
      observable_behavior: null,
      system_response: null,
      state_change: null,
      continuity: null,
    },
    anti_claims: [],
    demo_evidence: [],
    owner: value(command, 'owner') ?? 'agent',
    area: values(command, 'area').length > 0 ? values(command, 'area') : ['core'],
  };
  const relativePath = artifactPath('capability', id);
  await writeArtifactFile(
    root,
    relativePath,
    frontmatter,
    body(title, [
      'Summary',
      'Concept interpretation',
      'Observable behavior',
      'Anti-claims',
      'Demonstrations',
      'Notes',
    ]),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'capability', id }],
    warnings:
      status === 'existing'
        ? [
            'Existing capability remains unverified until pass demo or observed baseline evidence is recorded.',
          ]
        : [],
    next_actions: [
      next(
        `dossier-engineer capability claim set --capability ${id} --actor "<actor>" --trigger "<trigger>" --behavior "<behavior>" --response "<response>" --state-change "<state/effect>" --continuity "<continuity>"`,
        'Complete the observable capability claim.',
      ),
      next(
        `dossier-engineer work create --title "<work>" --type feature --delivery capability --capability ${id} --relation introduces --source ${sourceId} --area core --owner agent`,
        'Create work only after the capability claim is concrete.',
      ),
    ],
  });
};

const capabilityClaimSet = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const id = requireValue(command, 'capability');
  const capability = findArtifactById(artifacts, id);
  if (capability === undefined || capability.frontmatter.artifact_type !== 'capability')
    throw new UsageError(`Capability not found: ${id}`);
  const claim = {
    actor: requireValue(command, 'actor'),
    trigger: requireValue(command, 'trigger'),
    observable_behavior: requireValue(command, 'behavior'),
    system_response: requireValue(command, 'response'),
    state_change: requireValue(command, 'state-change'),
    continuity: requireValue(command, 'continuity'),
  };
  const now = isoNow(ctx.now());
  const updated = await updateArtifact(root, capability, { ...capability.frontmatter, claim }, now);
  const impactedWork = findArtifactsByType(artifacts, 'work_item').filter((work) =>
    (
      ((work.frontmatter.delivery as Record<string, unknown> | undefined)
        ?.capability_refs as unknown[]) ?? []
    ).some((ref) => (ref as Record<string, unknown>).capability_id === id),
  );
  const changed = [artifactInfo(updated)];
  for (const work of impactedWork) {
    const updatedWork = await updateArtifact(root, work, recomputeWorkHash(work, artifacts), now);
    changed.push(artifactInfo(updatedWork));
  }
  return result(command, {
    result: 'success',
    changed_artifacts: changed,
    next_actions: [
      next(
        `dossier-engineer capability anti-claim add --capability ${id} --text "<explicit non-goal>"`,
        'Record capability-level anti-claims where useful.',
      ),
      next(
        `dossier-engineer capability demo record --capability ${id} --verdict pass --summary "<observed behavior>" --evidence <path>`,
        'Record observed demo evidence for existing capabilities.',
      ),
    ],
  });
};

const capabilityAntiClaimAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const id = requireValue(command, 'capability');
  const text = requireValue(command, 'text');
  const capability = findArtifactById(artifacts, id);
  if (capability === undefined || capability.frontmatter.artifact_type !== 'capability')
    throw new UsageError(`Capability not found: ${id}`);
  const antiClaims = [...new Set([...(capability.frontmatter.anti_claims as string[]), text])];
  const updated = await updateArtifact(
    root,
    capability,
    { ...capability.frontmatter, anti_claims: antiClaims },
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next('dossier-engineer capability check --root .', 'Validate capability governance gates.'),
    ],
  });
};

const capabilityDemoRecord = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const id = requireValue(command, 'capability');
  const verdict = requireEnum(command, 'verdict', VERDICTS);
  const summary = requireValue(command, 'summary');
  const evidence = values(command, 'evidence');
  const missing = await evidencePathsExist(root, evidence);
  if (missing.length > 0)
    throw new UsageError(`Evidence path does not exist: ${missing.join(', ')}`);
  const capability = findArtifactById(artifacts, id);
  if (capability === undefined || capability.frontmatter.artifact_type !== 'capability')
    throw new UsageError(`Capability not found: ${id}`);
  const now = isoNow(ctx.now());
  const demoId = await makeId(
    root,
    'VER',
    `${capability.frontmatter.title} demo`,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`,
    ctx.now(),
  );
  const demoEvidence = [
    ...((capability.frontmatter.demo_evidence as unknown[]) ?? []),
    {
      id: demoId,
      verdict,
      summary,
      evidence: evidence.map((entry) => ({ path: entry })),
      recorded_at: now,
    },
  ];
  const updated = await updateArtifact(
    root,
    capability,
    { ...capability.frontmatter, demo_evidence: demoEvidence },
    now,
  );
  return result(command, {
    result: verdict === 'pass' ? 'success' : 'blocked',
    changed_artifacts: [artifactInfo(updated)],
    blockers: verdict === 'pass' ? [] : [`Capability demo verdict is ${verdict}.`],
    next_actions: [
      next('dossier-engineer capability check --root .', 'Re-evaluate capability evidence.'),
    ],
    exitCode: verdict === 'pass' ? 0 : 2,
  });
};

const capabilityCheck = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const capabilityFilter = value(command, 'capability');
  const workFilter = value(command, 'work');
  const findings: string[] = [];
  for (const capability of findArtifactsByType(artifacts, 'capability').filter(
    (entry) => capabilityFilter === undefined || entry.frontmatter.id === capabilityFilter,
  )) {
    const claim = capability.frontmatter.claim as Record<string, unknown> | undefined;
    if (
      capability.frontmatter.status !== 'retired' &&
      [
        'actor',
        'trigger',
        'observable_behavior',
        'system_response',
        'state_change',
        'continuity',
      ].some((key) => typeof claim?.[key] !== 'string' || String(claim[key]).trim() === '')
    ) {
      findings.push(`${capability.frontmatter.id}: incomplete observable behavior claim.`);
    }
    if (
      capability.frontmatter.status === 'existing' &&
      ((capability.frontmatter.demo_evidence as unknown[]) ?? []).filter(
        (entry) => (entry as Record<string, unknown>).verdict === 'pass',
      ).length === 0
    ) {
      findings.push(`${capability.frontmatter.id}: existing capability lacks pass demo evidence.`);
    }
  }
  for (const work of findArtifactsByType(artifacts, 'work_item').filter(
    (entry) => workFilter === undefined || entry.frontmatter.id === workFilter,
  )) {
    findings.push(...workGateFindings(work));
  }
  return result(command, {
    result: findings.length === 0 ? 'success' : 'blocked',
    findings: findings.length === 0 ? ['Capability gates pass.'] : findings,
    blockers: findings.length === 0 ? [] : ['Capability governance blockers exist.'],
    next_actions:
      findings.length === 0
        ? [next('dossier-engineer queue --root .', 'Inspect ready work.')]
        : [
            next(
              'dossier-engineer next --work <work-id>',
              'Resolve the next protocol-safe work item action.',
            ),
          ],
    exitCode: findings.length === 0 ? 0 : 2,
  });
};

const baselineCreate = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const title = requireValue(command, 'title');
  const mode = requireEnum(command, 'mode', BASELINE_MODES);
  const sourceId = requireValue(command, 'source');
  if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'BASE',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('baseline', candidate),
    ctx.now(),
  );
  const frontmatter = {
    ...newArtifactFrontmatter('baseline', id, title, now),
    mode,
    source_refs: [sourceId],
    capabilities: [],
  };
  const relativePath = artifactPath('baseline', id);
  await writeArtifactFile(
    root,
    relativePath,
    frontmatter,
    body(title, [
      'Scope',
      'Observed capabilities',
      'Assumed or unverified capabilities',
      'Evidence notes',
      'Gaps',
    ]),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'baseline', id }],
    next_actions: [
      next(
        `dossier-engineer baseline capability add --baseline ${id} --capability <capability-id> --status observed --evidence <path>`,
        'Attach observed existing capabilities to this baseline.',
      ),
    ],
  });
};

const baselineCapabilityAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const baselineId = requireValue(command, 'baseline');
  const capabilityId = requireValue(command, 'capability');
  const status = requireEnum(command, 'status', BASELINE_STATUSES);
  const evidence = values(command, 'evidence');
  const missing = await evidencePathsExist(root, evidence);
  if (missing.length > 0)
    throw new UsageError(`Evidence path does not exist: ${missing.join(', ')}`);
  const baseline = findArtifactById(artifacts, baselineId);
  const capability = findArtifactById(artifacts, capabilityId);
  if (baseline === undefined || baseline.frontmatter.artifact_type !== 'baseline')
    throw new UsageError(`Baseline not found: ${baselineId}`);
  if (capability === undefined || capability.frontmatter.artifact_type !== 'capability')
    throw new UsageError(`Capability not found: ${capabilityId}`);
  const capabilityHasPassDemo = ((capability.frontmatter.demo_evidence as unknown[]) ?? []).some(
    (entry) => (entry as Record<string, unknown>).verdict === 'pass',
  );
  if (status === 'observed' && evidence.length === 0 && !capabilityHasPassDemo) {
    throw new BlockedError(
      'Observed baseline membership requires evidence path or pass capability demo.',
    );
  }
  const now = isoNow(ctx.now());
  const membership = {
    capability_id: capabilityId,
    status,
    evidence,
    added_at: now,
    notes: value(command, 'notes') ?? null,
  };
  const existing = ((baseline.frontmatter.capabilities as unknown[]) ?? []).filter(
    (entry) => (entry as Record<string, unknown>).capability_id !== capabilityId,
  );
  const updated = await updateArtifact(
    root,
    baseline,
    { ...baseline.frontmatter, capabilities: [...existing, membership] },
    now,
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        'dossier-engineer capability check --root .',
        'Validate existing capability evidence after baseline update.',
      ),
    ],
  });
};

const guardrailAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root } = await loadRootArtifacts(ctx, command);
  const title = requireValue(command, 'title');
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'KILL',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('guardrail', candidate),
    ctx.now(),
  );
  const frontmatter = {
    ...newArtifactFrontmatter('guardrail', id, title, now),
    condition: requireValue(command, 'condition'),
    action: requireValue(command, 'action'),
    status: 'active',
    scope: {
      areas: values(command, 'area'),
      capability_ids: values(command, 'capability'),
    },
    triggered_at: null,
    resolved_at: null,
    resolution: null,
  };
  const relativePath = artifactPath('guardrail', id);
  await writeArtifactFile(
    root,
    relativePath,
    frontmatter,
    body(title, ['Intent', 'Trigger interpretation', 'Required action', 'Resolution history']),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'guardrail', id }],
    next_actions: [
      next('dossier-engineer guardrail check --root .', 'Evaluate active guardrails.'),
    ],
  });
};

const guardrailCheck = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const guardrailId = value(command, 'guardrail');
  const findings: string[] = [];
  const changed: Artifact[] = [];
  const now = isoNow(ctx.now());
  for (const guardrail of findArtifactsByType(artifacts, 'guardrail').filter(
    (entry) => guardrailId === undefined || entry.frontmatter.id === guardrailId,
  )) {
    if (guardrail.frontmatter.status === 'triggered') {
      findings.push(`${guardrail.frontmatter.id}: already triggered.`);
      continue;
    }
    if (guardrail.frontmatter.status !== 'active') continue;
    findings.push(
      `${guardrail.frontmatter.id}: needs_manual_evaluation: ${guardrail.frontmatter.condition}`,
    );
    if (hasFlag(command, 'record')) {
      changed.push(
        await updateArtifact(
          root,
          guardrail,
          { ...guardrail.frontmatter, status: 'triggered', triggered_at: now },
          now,
        ),
      );
    }
  }
  return result(command, {
    result: findings.length === 0 ? 'success' : 'blocked',
    findings: findings.length === 0 ? ['No active guardrail findings.'] : findings,
    changed_artifacts: changed.map(artifactInfo),
    blockers:
      findings.length === 0 ? [] : ['Guardrail evaluation requires action or manual decision.'],
    next_actions:
      findings.length === 0
        ? [next('dossier-engineer queue --root .', 'Continue with ready work.')]
        : [
            next(
              'dossier-engineer guardrail resolve --guardrail <guardrail-id> --summary "<resolution>"',
              'Resolve triggered or manually evaluated guardrails.',
            ),
          ],
    exitCode: findings.length === 0 ? 0 : 2,
  });
};

const guardrailResolve = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const id = requireValue(command, 'guardrail');
  const summary = requireValue(command, 'summary');
  const evidence = values(command, 'evidence');
  const missing = await evidencePathsExist(root, evidence);
  if (missing.length > 0)
    throw new UsageError(`Evidence path does not exist: ${missing.join(', ')}`);
  const guardrail = findArtifactById(artifacts, id);
  if (guardrail === undefined || guardrail.frontmatter.artifact_type !== 'guardrail')
    throw new UsageError(`Guardrail not found: ${id}`);
  const updated = await updateArtifact(
    root,
    guardrail,
    {
      ...guardrail.frontmatter,
      status: 'resolved',
      resolved_at: isoNow(ctx.now()),
      resolution: { summary, evidence },
    },
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next('dossier-engineer queue --root .', 'Recompute queue after guardrail resolution.'),
    ],
  });
};

const workCreate = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const title = requireValue(command, 'title');
  const type = requireEnum(command, 'type', WORK_TYPES);
  const delivery = requireEnum(command, 'delivery', DELIVERY_KINDS);
  const sourceId = requireValue(command, 'source');
  const area = requireValue(command, 'area');
  const owner = requireValue(command, 'owner');
  const capabilityId = value(command, 'capability');
  const relation = value(command, 'relation');
  if (!findArtifactById(artifacts, sourceId)) throw new UsageError(`Source not found: ${sourceId}`);
  if (capabilityId !== undefined && !findArtifactById(artifacts, capabilityId))
    throw new UsageError(`Capability not found: ${capabilityId}`);
  if (delivery === 'capability' && capabilityId === undefined)
    throw new UsageError('Capability delivery requires --capability.');
  if (delivery === 'capability' && !['introduces', 'extends'].includes(String(relation)))
    throw new UsageError('Capability delivery requires --relation introduces|extends.');
  if (delivery === 'maintenance' && relation !== 'maintains')
    throw new UsageError('Maintenance delivery requires --relation maintains.');
  if (relation !== undefined && !isOneOf(relation, RELATIONS))
    throw new UsageError(`Invalid --relation: ${relation}.`);
  const capabilityRefs =
    capabilityId === undefined
      ? []
      : [
          {
            capability_id: capabilityId,
            relation: relation ?? (delivery === 'support' ? 'supports' : 'introduces'),
          },
        ];
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'WI',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('work', candidate),
    ctx.now(),
  );
  const frontmatter = {
    ...newArtifactFrontmatter('work_item', id, title, now),
    type,
    lifecycle: 'defined',
    owners: [owner],
    area: [area],
    source_refs: [sourceRef(sourceId)],
    delivery: {
      kind: delivery,
      capability_refs: capabilityRefs,
      support_reason: null,
    },
    acceptance: { criteria: [], coverage_gate: 'open' },
    demonstration: { name: null, scenario: null, falsifiers: [] },
    anti_claims: [],
    challenge: { recorded: false, latest_event_id: null },
    risk: { implementation: [], policy: [] },
    review_policy: 'risk_weighted',
    dependencies: [],
    blocks: [],
    blockers: [],
    stage_state: {
      'feature-intake': 'not_started',
      'spec-compact': 'not_started',
      'plan-slice': 'not_started',
      implementation: 'not_started',
      'change-proposal': 'not_started',
    },
    post_close_hygiene: { implementation: 'not_started' },
    material_scope_hash: null,
    priority: value(command, 'priority') ?? 'normal',
  };
  const withHash = {
    ...frontmatter,
    material_scope_hash: materialWorkHash(
      frontmatter,
      findArtifactsByType(artifacts, 'capability'),
      findArtifactsByType(artifacts, 'source'),
    ),
  };
  const relativePath = artifactPath('work', id);
  await writeArtifactFile(
    root,
    relativePath,
    withHash,
    body(title, [
      'Summary',
      'Capability relation',
      'Source interpretation',
      'Scope',
      'Acceptance criteria notes',
      'Demonstration notes',
      'Anti-claims notes',
      'Pre-implementation challenge',
      'Dependencies and blockers',
      'Implementation notes',
      'Verification notes',
      'Review notes',
      'Closure notes',
      'Process notes',
    ]),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'work_item', id }],
    next_actions: [
      next(
        `dossier-engineer work acceptance add --work ${id} --kind behavior --text "<criterion>" --source ${sourceId}#<anchor>`,
        'Capability work needs behavioral acceptance.',
      ),
      next(
        `dossier-engineer stage start --work ${id} --stage feature-intake --session <session-id>`,
        'Start the first workflow stage.',
      ),
    ],
  });
};

const workAcceptanceAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const kind = requireEnum(command, 'kind', ACCEPTANCE_KINDS);
  const text = requireValue(command, 'text');
  const source = resolveSourcePart(requireValue(command, 'source'));
  if (!findArtifactById(artifacts, source.source_id))
    throw new UsageError(`Source not found: ${source.source_id}`);
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const now = isoNow(ctx.now());
  const acId = await makeId(
    root,
    'AC',
    text,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`,
    ctx.now(),
  );
  const acceptance = work.frontmatter.acceptance as Record<string, unknown>;
  const criteria = [
    ...((acceptance.criteria as unknown[]) ?? []),
    {
      id: acId,
      kind,
      text,
      source_ref: { source_id: source.source_id, anchor: source.anchor },
      status: 'active',
    },
  ];
  const updatedFrontmatter = recomputeWorkHash(
    {
      ...work,
      frontmatter: {
        ...work.frontmatter,
        acceptance: { ...acceptance, criteria },
      },
    },
    artifacts,
  );
  const updated = await updateArtifact(root, work, updatedFrontmatter, now);
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer work demo set --work ${workId} --name "<demo>" --scenario "<observable scenario>"`,
        'Define the demonstration that proves the criteria.',
      ),
    ],
  });
};

const workDemoSet = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const updatedFrontmatter = recomputeWorkHash(
    {
      ...work,
      frontmatter: {
        ...work.frontmatter,
        demonstration: {
          name: requireValue(command, 'name'),
          scenario: requireValue(command, 'scenario'),
          falsifiers: values(command, 'falsifier'),
        },
      },
    },
    artifacts,
  );
  const updated = await updateArtifact(root, work, updatedFrontmatter, isoNow(ctx.now()));
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer work anti-claim add --work ${workId} --text "<explicit non-goal>"`,
        'Record anti-claims before spec closure.',
      ),
    ],
  });
};

const workAntiClaimAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const text = requireValue(command, 'text');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const updatedFrontmatter = recomputeWorkHash(
    {
      ...work,
      frontmatter: {
        ...work.frontmatter,
        anti_claims: [...new Set([...(work.frontmatter.anti_claims as string[]), text])],
      },
    },
    artifacts,
  );
  const updated = await updateArtifact(root, work, updatedFrontmatter, isoNow(ctx.now()));
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer work challenge record --work ${workId} --summary "<how this plan could be wrong>"`,
        'Challenge implementation before plan-slice closure.',
      ),
    ],
  });
};

const createStageEvent = async (
  root: string,
  ctx: RuntimeContext,
  workId: string,
  stage: Stage,
  event: string,
  summary: string,
  sessionId: string | null,
): Promise<{ path: string; id: string }> => {
  const id = await makeId(
    root,
    'STG',
    `${workId} ${stage} ${event}`,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/stages/${workId}/${candidate}.md`,
    ctx.now(),
  );
  const relativePath = `${DOSSIER_DIR}/stages/${workId}/${id}.md`;
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'stage_event',
      schema_version: SCHEMA_VERSION,
      id,
      work_item_id: workId,
      stage,
      event,
      session_id: sessionId,
      created_at: isoNow(ctx.now()),
      summary,
      linked_artifacts: [],
    },
    body(`${stage} ${event}`, ['Summary', 'Notes']),
  );
  return { path: relativePath, id };
};

const workChallengeRecord = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const summary = requireValue(command, 'summary');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const event = await createStageEvent(
    root,
    ctx,
    workId,
    'plan-slice',
    'challenge',
    summary,
    value(command, 'session') ?? null,
  );
  const updatedFrontmatter = recomputeWorkHash(
    {
      ...work,
      frontmatter: {
        ...work.frontmatter,
        challenge: { recorded: true, latest_event_id: event.id },
      },
    },
    artifacts,
  );
  const updated = await updateArtifact(root, work, updatedFrontmatter, isoNow(ctx.now()));
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: event.path, artifact_type: 'stage_event', id: event.id }],
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer stage ready --work ${workId} --stage plan-slice --summary "<result>"`,
        'Mark plan-slice ready after challenge and plan evidence are complete.',
      ),
    ],
  });
};

const workSupportExplain = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const reason = requireValue(command, 'reason');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const delivery = work.frontmatter.delivery as Record<string, unknown>;
  const updatedFrontmatter = recomputeWorkHash(
    {
      ...work,
      frontmatter: {
        ...work.frontmatter,
        delivery: { ...delivery, support_reason: reason },
      },
    },
    artifacts,
  );
  const updated = await updateArtifact(root, work, updatedFrontmatter, isoNow(ctx.now()));
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        'dossier-engineer capability check --root .',
        'Validate support work does not masquerade as capability.',
      ),
    ],
  });
};

const workDependencyAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const dependency = requireValue(command, 'depends-on');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  if (!findArtifactById(artifacts, dependency))
    throw new UsageError(`Dependency work item not found: ${dependency}`);
  if (dependency === workId) throw new UsageError('A work item cannot depend on itself.');
  const dependencies = [...new Set([...(work.frontmatter.dependencies as string[]), dependency])];
  const updated = await updateArtifact(
    root,
    work,
    recomputeWorkHash({ ...work, frontmatter: { ...work.frontmatter, dependencies } }, artifacts),
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [next('dossier-engineer queue --root .', 'Recompute dependency-aware queue.')],
  });
};

const workDependencyRemove = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const dependency = requireValue(command, 'depends-on');
  requireValue(command, 'reason');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const dependencies = ((work.frontmatter.dependencies as string[]) ?? []).filter(
    (entry) => entry !== dependency,
  );
  const updated = await updateArtifact(
    root,
    work,
    recomputeWorkHash({ ...work, frontmatter: { ...work.frontmatter, dependencies } }, artifacts),
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [next('dossier-engineer queue --root .', 'Recompute dependency-aware queue.')],
  });
};

const workBlockerAdd = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const kind = requireValue(command, 'kind');
  const summary = requireValue(command, 'summary');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const now = isoNow(ctx.now());
  const blockerId = await makeId(
    root,
    'BLK',
    summary,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/_embedded/${candidate}`,
    ctx.now(),
  );
  const blockers = [
    ...((work.frontmatter.blockers as unknown[]) ?? []),
    {
      id: blockerId,
      kind,
      summary,
      blocking: !hasFlag(command, 'non-blocking'),
      created_at: now,
      resolved_at: null,
      resolution: null,
    },
  ];
  const updated = await updateArtifact(root, work, { ...work.frontmatter, blockers }, now);
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer work blocker resolve --work ${workId} --blocker ${blockerId} --summary "<resolution>"`,
        'Resolve blockers before closure.',
      ),
    ],
  });
};

const workBlockerResolve = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const blocker = requireValue(command, 'blocker');
  const summary = requireValue(command, 'summary');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const now = isoNow(ctx.now());
  const blockers = ((work.frontmatter.blockers as unknown[]) ?? []).map((entry) => {
    const item = entry as Record<string, unknown>;
    return item.id === blocker ? { ...item, resolved_at: now, resolution: summary } : item;
  });
  const updated = await updateArtifact(root, work, { ...work.frontmatter, blockers }, now);
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(`dossier-engineer next --work ${workId}`, 'Continue protocol after blocker resolution.'),
    ],
  });
};

const workRiskSet = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const risk = {
    implementation: (value(command, 'implementation') ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    policy: (value(command, 'policy') ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
  const updated = await updateArtifact(
    root,
    work,
    recomputeWorkHash({ ...work, frontmatter: { ...work.frontmatter, risk } }, artifacts),
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [
      next(
        `dossier-engineer review required --work ${workId} --stage implementation`,
        'Inspect review requirements after risk update.',
      ),
    ],
  });
};

const workRetire = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  requireValue(command, 'reason');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const updated = await updateArtifact(
    root,
    work,
    { ...work.frontmatter, lifecycle: 'retired' },
    isoNow(ctx.now()),
  );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    next_actions: [next('dossier-engineer queue --root .', 'Recompute queue after retirement.')],
  });
};

const workSplit = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const sourceWorkId = requireValue(command, 'work');
  const title = requireValue(command, 'title');
  requireValue(command, 'reason');
  const sourceWork = findArtifactById(artifacts, sourceWorkId);
  if (sourceWork === undefined || sourceWork.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${sourceWorkId}`);
  const now = isoNow(ctx.now());
  const id = await makeId(
    root,
    'WI',
    title,
    ctx.randomHex,
    (candidate) => artifactPath('work', candidate),
    ctx.now(),
  );
  const frontmatter = {
    ...sourceWork.frontmatter,
    id,
    title,
    lifecycle: 'defined',
    created_at: now,
    updated_at: now,
    source_refs: value(command, 'source')
      ? [sourceRef(requireValue(command, 'source'))]
      : sourceWork.frontmatter.source_refs,
    stage_state: {
      'feature-intake': 'not_started',
      'spec-compact': 'not_started',
      'plan-slice': 'not_started',
      implementation: 'not_started',
      'change-proposal': 'not_started',
    },
  };
  const relativePath = artifactPath('work', id);
  await writeArtifactFile(
    root,
    relativePath,
    recomputeWorkHash({ path: relativePath, frontmatter, body: sourceWork.body }, artifacts),
    sourceWork.body.replace(/^# .*/m, `# ${title}`),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'work_item', id }],
    next_actions: [next(`dossier-engineer next --work ${id}`, 'Continue the new split work item.')],
  });
};

const previousStageClosed = (work: Artifact, stage: Stage): boolean => {
  const state = work.frontmatter.stage_state as Record<string, unknown>;
  if (stage === 'feature-intake' || stage === 'change-proposal') return true;
  if (stage === 'spec-compact') return state['feature-intake'] === 'closed';
  if (stage === 'plan-slice') return state['spec-compact'] === 'closed';
  if (stage === 'implementation') return state['plan-slice'] === 'closed';
  return false;
};

const stageGateFindings = (work: Artifact, all: readonly Artifact[], stage: Stage): string[] => {
  const findings: string[] = [];
  if (!previousStageClosed(work, stage))
    findings.push(`${work.frontmatter.id}: previous stage is not closed for ${stage}.`);
  if (openBlockers(work).length > 0) findings.push(`${work.frontmatter.id}: open blocker exists.`);
  if (stage === 'feature-intake') {
    const delivery = work.frontmatter.delivery as Record<string, unknown>;
    if (!isOneOf(delivery.kind, DELIVERY_KINDS))
      findings.push(`${work.frontmatter.id}: invalid delivery kind.`);
  }
  if (stage === 'spec-compact')
    findings.push(...workGateFindings(work).filter((entry) => !entry.includes('challenge')));
  if (stage === 'plan-slice') {
    const challenge = work.frontmatter.challenge as Record<string, unknown>;
    if (challenge.recorded !== true)
      findings.push(
        `${work.frontmatter.id}: challenge must be recorded before plan-slice readiness.`,
      );
  }
  if (stage === 'implementation') {
    const delivery = work.frontmatter.delivery as Record<string, unknown>;
    if (
      delivery.kind === 'capability' &&
      !verificationFresh(work, findArtifactsByType(all, 'verification'), 'behavioral-demo')
    ) {
      findings.push(`${work.frontmatter.id}: fresh behavioral-demo verification required.`);
    }
    if (
      delivery.kind === 'capability' &&
      !reviewFresh(work, findArtifactsByType(all, 'review'), 'concept-conformance-reviewer')
    ) {
      findings.push(`${work.frontmatter.id}: fresh concept-conformance review required.`);
    }
    if (
      delivery.kind === 'capability' &&
      !reviewFresh(work, findArtifactsByType(all, 'review'), 'spec-conformance-reviewer')
    ) {
      findings.push(`${work.frontmatter.id}: fresh spec-conformance review required.`);
    }
  }
  return findings;
};

const stageTransition = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
  action: 'start' | 'ready' | 'close' | 'reopen',
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const state = work.frontmatter.stage_state as Record<string, unknown>;
  const warnings: string[] = [];
  const blockers: string[] = [];
  if (action === 'start') {
    if (!previousStageClosed(work, stage))
      blockers.push(`${stage}: previous required stage is not closed.`);
    requireValue(command, 'session');
  }
  if (action === 'ready') {
    requireValue(command, 'summary');
    blockers.push(...stageGateFindings(work, artifacts, stage));
  }
  if (action === 'close') {
    if (state[stage] !== 'ready_for_close')
      blockers.push(`${stage}: stage is not ready_for_close.`);
    blockers.push(...stageGateFindings(work, artifacts, stage));
  }
  if (action === 'reopen') requireValue(command, 'reason');
  if (blockers.length > 0) {
    return result(command, {
      result: 'blocked',
      blockers,
      next_actions: [
        next(
          `dossier-engineer next --work ${workId}`,
          'Resolve stage blockers through the next safe action.',
        ),
      ],
      exitCode: 2,
    });
  }
  const nextState =
    action === 'start'
      ? 'in_progress'
      : action === 'ready'
        ? 'ready_for_close'
        : action === 'close'
          ? 'closed'
          : 'reopened';
  const lifecycleByStage: Record<string, string> = {
    'feature-intake': 'intaken',
    'spec-compact': 'specified',
    'plan-slice': 'planned',
    implementation: 'implemented',
  };
  const frontmatter = {
    ...work.frontmatter,
    stage_state: { ...state, [stage]: nextState },
    lifecycle:
      action === 'close' && lifecycleByStage[stage] !== undefined
        ? lifecycleByStage[stage]
        : work.frontmatter.lifecycle,
  };
  const updated = await updateArtifact(root, work, frontmatter, isoNow(ctx.now()));
  const event = await createStageEvent(
    root,
    ctx,
    workId,
    stage,
    action === 'ready' ? 'ready' : action,
    value(command, 'summary') ?? value(command, 'reason') ?? `${stage} ${action}`,
    value(command, 'session') ?? null,
  );
  if (action === 'close' && stage === 'implementation')
    warnings.push(
      'Implementation is implemented, not fully closed, until hygiene passes and project closure policy is satisfied.',
    );
  return result(command, {
    result: 'success',
    changed_artifacts: [artifactInfo(updated)],
    created_artifacts: [{ path: event.path, artifact_type: 'stage_event', id: event.id }],
    warnings,
    next_actions:
      action === 'close' && stage === 'implementation'
        ? [
            next(
              `dossier-engineer hygiene run --work ${workId} --stage implementation`,
              'Run post-close hygiene before handoff.',
            ),
          ]
        : [
            next(
              `dossier-engineer next --work ${workId}`,
              'Continue with the next protocol-safe action.',
            ),
          ],
  });
};

const stageLog = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const summary = requireValue(command, 'summary');
  if (!findArtifactById(artifacts, workId)) throw new UsageError(`Work item not found: ${workId}`);
  const event = await createStageEvent(
    root,
    ctx,
    workId,
    stage,
    value(command, 'event') ?? 'note',
    summary,
    value(command, 'session') ?? null,
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: event.path, artifact_type: 'stage_event', id: event.id }],
    next_actions: [
      next(`dossier-engineer next --work ${workId}`, 'Continue protocol after the note.'),
    ],
  });
};

const requiredReviewClasses = (work: Artifact): string[] => {
  const delivery = work.frontmatter.delivery as Record<string, unknown>;
  const risk = work.frontmatter.risk as Record<string, unknown> | undefined;
  const classes = new Set<string>();
  if (delivery.kind === 'capability') {
    classes.add('concept-conformance-reviewer');
    classes.add('spec-conformance-reviewer');
  }
  if (
    ((risk?.implementation as string[]) ?? []).some((entry) =>
      ['code', 'implementation'].includes(entry),
    )
  )
    classes.add('code-reviewer');
  if (
    [...((risk?.implementation as string[]) ?? []), ...((risk?.policy as string[]) ?? [])].some(
      (entry) => ['security', 'auth', 'privacy', 'network', 'dependency'].includes(entry),
    )
  )
    classes.add('security-reviewer');
  return [...classes];
};

const verifyRequired = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const delivery = work.frontmatter.delivery as Record<string, unknown>;
  const required =
    delivery.kind === 'capability'
      ? ['behavioral-demo']
      : delivery.kind === 'maintenance'
        ? ['default']
        : ['default'];
  const findings = required.map(
    (profile) =>
      `${profile}: ${verificationFresh(work, findArtifactsByType(artifacts, 'verification'), profile) ? 'fresh' : 'missing_or_stale'}`,
  );
  return result(command, {
    result: findings.some((entry) => entry.includes('missing')) ? 'blocked' : 'success',
    findings,
    next_actions: [
      next(
        `dossier-engineer verify record --work ${workId} --stage implementation --profile ${required[0]} --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>`,
        'Record verification evidence when no runnable profile is configured.',
      ),
    ],
    exitCode: findings.some((entry) => entry.includes('missing')) ? 2 : 0,
  });
};

const verifyRun = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const profile = requireValue(command, 'profile');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item') {
    throw new UsageError(`Work item not found: ${workId}`);
  }
  const project = findArtifactsByType(artifacts, 'dossier_project')[0];
  const profiles = project?.frontmatter.verification_profiles as
    | Record<string, { commands?: string[] }>
    | undefined;
  const profileCommands = profiles?.[profile]?.commands ?? [];
  if (profileCommands.length > 0) {
    const commandResults = profileCommands.map((profileCommand) => {
      const spawned = spawnSync(profileCommand, {
        cwd: root,
        encoding: 'utf8',
        shell: true,
      });
      return {
        command: profileCommand,
        exit_code: spawned.status ?? 1,
        stdout: spawned.stdout.slice(0, 4000),
        stderr: spawned.stderr.slice(0, 4000),
      };
    });
    const failed = commandResults.find((entry) => entry.exit_code !== 0);
    const verdict = failed === undefined ? 'pass' : 'fail';
    const id = await makeId(
      root,
      'VER',
      `${workId} ${profile}`,
      ctx.randomHex,
      (candidate) => `${DOSSIER_DIR}/verification/${workId}/${candidate}.md`,
      ctx.now(),
    );
    const relativePath = `${DOSSIER_DIR}/verification/${workId}/${id}.md`;
    await writeArtifactFile(
      root,
      relativePath,
      {
        artifact_type: 'verification',
        schema_version: SCHEMA_VERSION,
        id,
        work_item_id: workId,
        stage,
        profile,
        evidence_class: profile === 'behavioral-demo' ? 'behavioral' : 'support',
        verdict,
        commands: commandResults,
        evidence: [],
        coverage_gate: verdict === 'pass' ? 'green' : 'open',
        created_at: isoNow(ctx.now()),
        material_scope_hash: work.frontmatter.material_scope_hash,
      },
      body(`${profile} verification`, ['Command output', 'Evidence interpretation']),
    );
    const changed: ReturnType<typeof artifactInfo>[] = [];
    if (verdict === 'pass') {
      const acceptance = work.frontmatter.acceptance as Record<string, unknown>;
      const updated = await updateArtifact(
        root,
        work,
        {
          ...work.frontmatter,
          acceptance: { ...acceptance, coverage_gate: 'green' },
        },
        isoNow(ctx.now()),
      );
      changed.push(artifactInfo(updated));
    }
    return result(command, {
      result: verdict === 'pass' ? 'success' : 'failed',
      created_artifacts: [{ path: relativePath, artifact_type: 'verification', id }],
      changed_artifacts: changed,
      blockers:
        failed === undefined
          ? []
          : [`Verification command failed (${failed.exit_code}): ${failed.command}`],
      next_actions:
        verdict === 'pass'
          ? [
              next(
                `dossier-engineer review required --work ${workId} --stage ${stage}`,
                'Check review requirements after verification evidence.',
              ),
            ]
          : [
              next(
                `dossier-engineer verify run --work ${workId} --stage ${stage} --profile ${profile}`,
                'Rerun after fixing the failed command.',
              ),
            ],
      exitCode: verdict === 'pass' ? 0 : 4,
    });
  }
  return result(command, {
    result: 'blocked',
    blockers: [
      `Verification profile ${profile} has no configured commands; use verify record for external/manual evidence or configure project.md verification_profiles.`,
    ],
    next_actions: [
      next(
        `dossier-engineer verify record --work ${workId} --stage ${stage} --profile ${profile} --evidence-class manual --verdict pass --summary "<summary>" --evidence <path>`,
        'Record evidence explicitly when no runnable profile is configured.',
      ),
    ],
    exitCode: 2,
  });
};

const verifyRecord = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const profile = requireValue(command, 'profile');
  const evidenceClass = requireValue(command, 'evidence-class');
  const verdict = requireEnum(command, 'verdict', VERDICTS);
  const summary = requireValue(command, 'summary');
  const evidence = values(command, 'evidence');
  const missing = await evidencePathsExist(root, evidence);
  if (missing.length > 0)
    throw new UsageError(`Evidence path does not exist: ${missing.join(', ')}`);
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const id = await makeId(
    root,
    'VER',
    `${workId} ${profile}`,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/verification/${workId}/${candidate}.md`,
    ctx.now(),
  );
  const relativePath = `${DOSSIER_DIR}/verification/${workId}/${id}.md`;
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'verification',
      schema_version: SCHEMA_VERSION,
      id,
      work_item_id: workId,
      stage,
      profile,
      evidence_class: evidenceClass,
      verdict,
      commands: [],
      evidence,
      coverage_gate: verdict === 'pass' ? 'green' : 'open',
      created_at: isoNow(ctx.now()),
      material_scope_hash: work.frontmatter.material_scope_hash,
    },
    [
      `# ${profile} verification`,
      '',
      '## Summary',
      '',
      summary,
      '',
      '## Evidence interpretation',
      '',
    ].join('\n'),
  );
  const changed: ReturnType<typeof artifactInfo>[] = [];
  if (verdict === 'pass') {
    const acceptance = work.frontmatter.acceptance as Record<string, unknown>;
    const updated = await updateArtifact(
      root,
      work,
      {
        ...work.frontmatter,
        acceptance: { ...acceptance, coverage_gate: 'green' },
      },
      isoNow(ctx.now()),
    );
    changed.push(artifactInfo(updated));
  }
  return result(command, {
    result: verdict === 'pass' ? 'success' : 'blocked',
    created_artifacts: [{ path: relativePath, artifact_type: 'verification', id }],
    changed_artifacts: changed,
    blockers: verdict === 'pass' ? [] : [`Verification verdict is ${verdict}.`],
    next_actions: [
      next(
        `dossier-engineer review required --work ${workId} --stage ${stage}`,
        'Check review requirements after verification evidence.',
      ),
    ],
    exitCode: verdict === 'pass' ? 0 : 2,
  });
};

const reviewRequired = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const findings = requiredReviewClasses(work).map(
    (reviewClass) =>
      `${reviewClass}: ${reviewFresh(work, findArtifactsByType(artifacts, 'review'), reviewClass) ? 'fresh' : 'missing_or_stale'}`,
  );
  return result(command, {
    result: findings.some((entry) => entry.includes('missing')) ? 'blocked' : 'success',
    findings: findings.length === 0 ? ['No required reviews by current risk policy.'] : findings,
    next_actions: [
      next(
        `dossier-engineer review record --work ${workId} --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>`,
        'Record immutable external review evidence.',
      ),
    ],
    exitCode: findings.some((entry) => entry.includes('missing')) ? 2 : 0,
  });
};

const reviewRecord = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const auditClass = requireValue(command, 'class');
  if (
    !REVIEW_CLASSES.includes(auditClass as (typeof REVIEW_CLASSES)[number]) &&
    !auditClass.includes('-reviewer')
  )
    throw new UsageError(`Invalid review class: ${auditClass}`);
  const verdict = requireEnum(command, 'verdict', VERDICTS);
  const reviewer = requireValue(command, 'reviewer');
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const id = await makeId(
    root,
    'REV',
    `${workId} ${auditClass}`,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/reviews/${workId}/${candidate}.md`,
    ctx.now(),
  );
  const relativePath = `${DOSSIER_DIR}/reviews/${workId}/${id}.md`;
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'review',
      schema_version: SCHEMA_VERSION,
      id,
      work_item_id: workId,
      stage,
      audit_class: auditClass,
      verdict,
      reviewer,
      created_at: isoNow(ctx.now()),
      material_scope_hash: work.frontmatter.material_scope_hash,
      reviewed_artifacts: [work.path],
      findings: [],
      summary: value(command, 'summary') ?? null,
      evidence: values(command, 'evidence'),
    },
    body(`${auditClass} review`, ['Findings', 'Reviewer notes']),
  );
  return result(command, {
    result: verdict === 'pass' || verdict === 'not_applicable' ? 'success' : 'blocked',
    created_artifacts: [{ path: relativePath, artifact_type: 'review', id }],
    blockers:
      verdict === 'pass' || verdict === 'not_applicable' ? [] : [`Review verdict is ${verdict}.`],
    next_actions: [
      next(
        `dossier-engineer stage ready --work ${workId} --stage ${stage} --summary "<implemented result>"`,
        'Mark implementation ready only after all required reviews and verification pass.',
      ),
    ],
    exitCode: verdict === 'pass' || verdict === 'not_applicable' ? 0 : 2,
  });
};

const hygieneRun = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const workId = requireValue(command, 'work');
  const stage = requireEnum(command, 'stage', STAGES);
  const work = findArtifactById(artifacts, workId);
  if (work === undefined || work.frontmatter.artifact_type !== 'work_item')
    throw new UsageError(`Work item not found: ${workId}`);
  const findings = closureFindings(work, artifacts);
  const verdict = findings.length === 0 ? 'pass' : 'blocked';
  const id = await makeId(
    root,
    'HYG',
    `${workId} ${stage}`,
    ctx.randomHex,
    (candidate) => `${DOSSIER_DIR}/hygiene/${workId}/${candidate}.md`,
    ctx.now(),
  );
  const relativePath = `${DOSSIER_DIR}/hygiene/${workId}/${id}.md`;
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'hygiene',
      schema_version: SCHEMA_VERSION,
      id,
      work_item_id: workId,
      stage,
      verdict,
      checked_at: isoNow(ctx.now()),
      checks: {
        source_reviews: 'pass',
        capability_claim: findings.some((entry) => entry.includes('claim')) ? 'fail' : 'pass',
        behavioral_demo: findings.some((entry) => entry.includes('behavioral')) ? 'fail' : 'pass',
        concept_conformance: findings.some((entry) => entry.includes('concept')) ? 'fail' : 'pass',
        status_overlay: 'pass',
        queue_impact: 'pass',
        attention: findings.length === 0 ? 'pass' : 'fail',
        review_freshness: findings.some((entry) => entry.includes('review')) ? 'fail' : 'pass',
      },
    },
    body(`${stage} hygiene`, ['Findings', 'Follow-up']),
  );
  const changed: ReturnType<typeof artifactInfo>[] = [];
  if (verdict === 'pass') {
    const updated = await updateArtifact(
      root,
      work,
      {
        ...work.frontmatter,
        post_close_hygiene: {
          ...(work.frontmatter.post_close_hygiene as Record<string, unknown>),
          [stage]: 'closed',
        },
        lifecycle: stage === 'implementation' ? 'closed' : work.frontmatter.lifecycle,
      },
      isoNow(ctx.now()),
    );
    changed.push(artifactInfo(updated));
  }
  return result(command, {
    result: verdict === 'pass' ? 'success' : 'blocked',
    created_artifacts: [{ path: relativePath, artifact_type: 'hygiene', id }],
    changed_artifacts: changed,
    findings,
    blockers: findings,
    next_actions:
      verdict === 'pass'
        ? [
            next(
              'dossier-engineer changeset create --scope current-branch --summary "<branch summary>"',
              'Create branch-level evidence before handoff.',
            ),
          ]
        : [next(`dossier-engineer next --work ${workId}`, 'Resolve hygiene blockers.')],
    exitCode: verdict === 'pass' ? 0 : 2,
  });
};

const changesetCreate = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root } = await loadRootArtifacts(ctx, command);
  const scope = requireValue(command, 'scope');
  const summary = requireValue(command, 'summary');
  const id = await makeId(
    root,
    'CS',
    summary,
    ctx.randomHex,
    (candidate) => artifactPath('changeset', candidate),
    ctx.now(),
  );
  const relativePath = artifactPath('changeset', id);
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'changeset',
      schema_version: SCHEMA_VERSION,
      id,
      scope,
      created_at: isoNow(ctx.now()),
      sources: values(command, 'source'),
      capabilities: values(command, 'capability'),
      baselines: [],
      guardrails: [],
      work_items: values(command, 'work'),
      source_reviews: [],
      reviews: [],
      verification: [],
      hygiene: [],
      process_misses: [],
      skill_feedback: [],
      capability_drift: [],
    },
    body(summary, [
      'Branch summary',
      'Artifacts',
      'Process misses',
      'Skill feedback',
      'Capability drift',
    ]),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'changeset', id }],
    next_actions: [next('dossier-engineer lint --root .', 'Validate dossier before handoff.')],
  });
};

const reportCreate = async (
  ctx: RuntimeContext,
  command: ParsedCommand,
): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const kind = requireValue(command, 'kind');
  const scope = requireValue(command, 'scope');
  const id = `${kind}-${ctx.now().toISOString().slice(0, 10)}`;
  const relativePath = `${DOSSIER_DIR}/reports/${id}.md`;
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'report',
      schema_version: SCHEMA_VERSION,
      id,
      kind,
      scope,
      derived: true,
      created_at: isoNow(ctx.now()),
      source_artifacts: artifacts.map((entry) => entry.path),
    },
    body(`${kind} report`, ['Summary', 'Findings', 'Next actions']),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'report', id }],
    warnings: ['Reports are derived views and are not closure evidence.'],
    next_actions: [
      next('dossier-engineer status --root .', 'Use live derived state for current readiness.'),
    ],
  });
};

const retroCreate = async (ctx: RuntimeContext, command: ParsedCommand): Promise<CommandResult> => {
  const { root, artifacts } = await loadRootArtifacts(ctx, command);
  const since = requireValue(command, 'since');
  const until = requireValue(command, 'until');
  const id = await makeId(
    root,
    'RETRO',
    `${since} ${until}`,
    ctx.randomHex,
    (candidate) => artifactPath('retro', candidate),
    ctx.now(),
  );
  const relativePath = artifactPath('retro', id);
  await writeArtifactFile(
    root,
    relativePath,
    {
      artifact_type: 'retrospective_report',
      schema_version: SCHEMA_VERSION,
      id,
      since,
      until,
      derived: true,
      created_at: isoNow(ctx.now()),
      source_artifacts: artifacts.map((entry) => entry.path),
    },
    body(`Retrospective ${since} - ${until}`, [
      'Capability completion',
      'Support ratio',
      'Demonstration outcomes',
      'Review outcomes',
      'Guardrail outcomes',
      'Process misses',
      'Skill feedback',
    ]),
  );
  return result(command, {
    result: 'success',
    created_artifacts: [{ path: relativePath, artifact_type: 'retrospective_report', id }],
    next_actions: [
      next(
        'dossier-engineer report create --kind status --scope repository',
        'Create a status report only if a durable derived view is needed.',
      ),
    ],
  });
};
