import {
  executeCommand as executeDossierCommand,
  findCommand as findDossierCommand,
  type CliIo as DossierCliIo,
} from './vendor/dossier-engineer/commands.ts';
import { spawnSync } from 'node:child_process';

import { BACKLOG_COMMANDS, type CliIo } from './backlog/commands.ts';
import {
  appendFeatureIntakeLog,
  recordReviewArtifactOnStageLog,
  recordStepCloseOnStageLog,
  resolveLatestFeatureCycleId,
  resolveStageLogContext,
  runStageControllerCommand,
  type StageControllerCommand,
} from './delivery/stage-control.ts';
import { acquireDeliveryMutationLock } from './shared/delivery-lock.ts';
import { resolveManagedDossierIdentity, sanitizeFeatureId } from './shared/feature-identity.ts';
import { resolveProcessRoot } from './shared/process-root.ts';
import { assertManagedWritePath, resolveManagedReadPath } from './shared/path-guards.ts';
import { writeCliEnvelope } from './shared/cli-envelope.ts';
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
    return {
      name,
      family: 'delivery-stage',
      commandType: 'stage',
      summary: command.description,
      usage: baseHelpLines.filter((line) =>
        line.trim().startsWith('dossier-engineer feature-intake'),
      ),
      helpLines: () =>
        baseHelpLines.map((line) =>
          line.replace(
            'workflow_stage_next values name workflow stages, not shipped CLI subcommands.',
            'workflow_stage_next values name canonical stage-controller commands; use spec-compact, plan-slice, implementation, or change-proposal as shipped subcommands.',
          ),
        ),
      async execute(args, io) {
        try {
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
              const nextCommand = `dossier-engineer spec-compact --feature-id ${featureId}`;
              if (exitCode !== 0) {
                const warnings = [
                  `feature-intake created ${summary.dossier}, but vendored closeout failed before merged telemetry append.`,
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
                const intakeLog = await appendFeatureIntakeLog({
                  root,
                  featureId,
                  featureCycleId,
                  backlogItemKey: summary.backlog_item_key,
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
                  backlog_followup_required: false,
                  backlog_followup_kind: null,
                  backlog_followup_resolved: true,
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
          const { featureId } = await resolveManagedDossierIdentity({
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
            const verifyArtifact = JSON.parse(await fs.readFile(absVerifyArtifactPath, 'utf8')) as {
              feature_id?: string;
              step?: string;
            };
            if (verifyArtifact.feature_id !== featureId || verifyArtifact.step !== normalizedStep) {
              throw new Error(
                `Verification artifact must match feature ${featureId} and step ${normalizedStep}.`,
              );
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
              const stepArtifactPath = path.join(
                '.dossier',
                'steps',
                featureId,
                `${normalizedStep}.json`,
              );
              const absStepArtifactPath = path.join(root, stepArtifactPath);
              if (stdout) {
                io.stdout.write(stdout);
              }
              try {
                await fs.access(absStepArtifactPath);
                const artifact = JSON.parse(await fs.readFile(absStepArtifactPath, 'utf8')) as {
                  blockers?: string[];
                  degraded_review_present?: boolean;
                  executed_audit_classes?: string[];
                  implementation_review_scope?: 'code-bearing' | 'non-code' | null;
                  invalidated_review_present?: boolean;
                  process_complete?: boolean;
                  required_audit_classes?: string[];
                  required_external_review_pending?: boolean;
                  required_security_review?: boolean | null;
                  review_trace_commits?: string[];
                  reviewer_agent_ids?: string[];
                  reviewer_skills?: string[];
                  security_trigger_reasons?: string[];
                  stale_review_present?: boolean;
                };
                await recordStepCloseOnStageLog({
                  root,
                  featureId,
                  step: normalizedStep,
                  stepArtifactPath,
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
                if ((error as NodeJS.ErrnoException | undefined)?.code !== 'ENOENT') {
                  writeLine(
                    io.stderr,
                    `[dossier-step-close] WARNING: step artifact was created, but stage log/state refresh failed: ${
                      error instanceof Error ? error.message : String(error)
                    }`,
                  );
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

              try {
                const outputMatch = stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
                if (!outputMatch?.[1]) {
                  throw new Error('review-artifact did not report its output path.');
                }
                const artifactPath = outputMatch[1].trim();
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
                  findings?: { must_fix?: unknown };
                  implementation_scope?: 'code-bearing' | 'non-code' | null;
                  invalidated?: boolean;
                  review_mode?: 'degraded' | 'external' | 'self-review';
                  reviewer?: string;
                  reviewer_agent_id?: string | null;
                  reviewer_skill?: string | null;
                  reviewer_thread_id?: string | null;
                  security_trigger_reason?: string | null;
                  step?: string;
                  verdict?: 'FAIL' | 'PASS';
                };
                if (
                  artifact.feature_id === featureId &&
                  artifact.step === normalizedStep &&
                  artifact.audit_class &&
                  artifact.verdict
                ) {
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
                    mustFixCount: Array.isArray(artifact.findings?.must_fix)
                      ? artifact.findings.must_fix.length
                      : 0,
                    reviewMode: artifact.review_mode ?? 'external',
                    reviewer: artifact.reviewer ?? 'unknown-reviewer',
                    reviewerAgentId: artifact.reviewer_agent_id ?? null,
                    reviewerSkill: artifact.reviewer_skill ?? null,
                    reviewerThreadId,
                    securityTriggerReason: artifact.security_trigger_reason ?? null,
                    stale,
                    verdict: artifact.verdict,
                    allowedByPolicy: artifact.allowed_by_policy !== false && !stale,
                  });
                }
              } catch (error) {
                writeLine(
                  io.stderr,
                  `[review-artifact] WARNING: stage log/state refresh failed after artifact write: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                );
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
            const featureCycleId = await resolveLatestFeatureCycleId(
              root,
              featureId,
              step ? (step as StageControllerCommand) : undefined,
            );
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
  return {
    name: command,
    family: 'delivery-stage',
    commandType: 'stage',
    summary: `Mechanical controller for the ${command} delivery stage.`,
    usage: [
      `dossier-engineer ${command} --feature-id <id>`,
      `dossier-engineer ${command} --feature-id <id> --block`,
      `dossier-engineer ${command} --feature-id <id> --ready-for-close`,
    ],
    helpLines: () => [
      `Mechanical controller for the ${command} delivery stage.`,
      '',
      'Usage:',
      `  dossier-engineer ${command} --feature-id <id> [--root <path>] [--dossier <path>] [--cycle-id <id>] [--block | --ready-for-close]`,
      '  dossier-engineer ' +
        `${command} --feature-id <id> --backlog-followup-kind <kind> [--backlog-followup-required] [--backlog-followup-resolved]`,
      '',
      'Rules:',
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
    'The only public utility for the merged dossier/backlog runtime.',
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
      lines.push(
        '  help                   Show the shipped unified help surface or command-local help.',
      );
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
    '  - This runtime only supports the canonical unified `.dossier` + `docs/ssot` layout.',
    '  - No split-skill migration, rollout, or compatibility launchers are shipped here.',
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
