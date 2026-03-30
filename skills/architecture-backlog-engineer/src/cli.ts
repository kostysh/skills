import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import packageJson from '../package.json';
import {
  ACCEPTANCE_CLASSES,
  SOURCE_AUTHORITIES,
  SOURCE_KINDS,
  isAcceptanceClass,
  runPaths,
  type AcceptanceClass,
  type SourceAuthorityClass,
  type SourceKind,
} from './discovery/common.js';
import { repairCompactRunBundle } from './discovery/bundle-repair.js';
import {
  createCommandRunId,
  readLatestMutatingNewStaleSnapshot,
} from './discovery/command-lineage.js';
import { computeDiscoveryDelta, type HumanReadableDelta } from './discovery/delta-run.js';
import { discoverDiscoveryRun } from './discovery/discover-run.js';
import { initializeDiscoveryRun } from './discovery/init-run.js';
import { repairDiscoveryRun } from './discovery/repair-run.js';
import { rebaselineDiscoveryRun } from './discovery/rebaseline-run.js';
import { renderDiscoveryViews } from './discovery/render-views.js';
import { getSummaryMetricLines, renderDiscoveryStatusOutput } from './discovery/status-run.js';
import { refreshRunSourceFingerprints, type SourceInputSpec } from './discovery/source-runtime.js';
import { validateDiscoveryRun } from './discovery/validate-run.js';

const CLI_NAME = 'architecture-backlog';
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXIT_USAGE = 2;

interface CliIo {
  stderr: Pick<NodeJS.WriteStream, 'write'>;
  stdout: Pick<NodeJS.WriteStream, 'write'>;
}

interface CommandDefinition {
  aliases: string[];
  helpText: () => string;
  name: string;
  run: (argv: string[], io: CliIo) => number | Promise<number>;
}

class UsageError extends Error {
  readonly helpText: string | undefined;

  constructor(message: string, helpText?: string) {
    super(message);
    this.name = 'UsageError';
    this.helpText = helpText;
  }
}

const io: CliIo = {
  stderr: process.stderr,
  stdout: process.stdout,
};

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function writeLines(stream: Pick<NodeJS.WriteStream, 'write'>, lines: string[]): void {
  for (const line of lines) {
    writeLine(stream, line);
  }
}

function globalHelp(): string {
  return [
    'Architecture backlog discovery CLI.',
    '',
    'Usage:',
    `  ${CLI_NAME} <command> [options]`,
    `  ${CLI_NAME} help [command]`,
    '',
    'Commands:',
    '  init <run-dir>       Initialize canonical artifacts and auto-render report.md.',
    '  discover <run-dir>   Resolve sources, populate backlog.json, repair derivable state, validate, and render.',
    '  status <run-dir>     Show lifecycle status, acceptance state, and next actions.',
    '  repair <run-dir>     Refresh source truth, repair derivable canonical state, validate, and render.',
    '  validate <run-dir>   Validate canonical state, refresh assessment.json, and render.',
    '  render <run-dir>     Recovery-render report.md from canonical state and assessment.',
    '  delta <run-dir>      Compute drift delta, refresh assessment.json, and render.',
    '  rebaseline <run-dir> Accept current source/canonical state as the new baseline, refresh assessment.json, and render.',
    '  help [command]       Show global or command-specific help.',
    '',
    'Compatibility aliases:',
    '  init-discovery-run',
    '  discover-discovery-run',
    '  status-discovery-run',
    '  repair-discovery-run',
    '  validate-discovery-run',
    '  render-discovery-views',
    '  delta-discovery-run',
    '  rebaseline-discovery-run',
    '',
    'Global options:',
    '  -h, --help           Show help.',
    '  --version            Show CLI version.',
  ].join('\n');
}

function initHelp(): string {
  return [
    'Initialize compact discovery artifacts for a run directory.',
    '',
    'Usage:',
    `  ${CLI_NAME} init <run-dir> [options]`,
    `  ${CLI_NAME} init-discovery-run <run-dir> [options]`,
    '',
    'Artifacts created:',
    '  - manifest.json',
    '  - backlog.json',
    '  - assessment.json',
    '  - journal.ndjson',
    '  - report.md',
    '',
    'Options:',
    '  --acceptance-target <class>  Set acceptance target.',
    '                               Values: draft-only, planning-grade, implementation-grade.',
    '  --force                      Overwrite discovery artifacts in an existing run directory.',
    '  -h, --help                   Show help.',
  ].join('\n');
}

function statusHelp(): string {
  return [
    'Show status for a discovery run.',
    '',
    'Usage:',
    `  ${CLI_NAME} status <run-dir>`,
    `  ${CLI_NAME} status-discovery-run <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function discoverHelp(): string {
  return [
    'Resolve source inputs, initialize or reuse the run, populate backlog.json, apply derivable repairs, validate, and render.',
    '',
    'Usage:',
    `  ${CLI_NAME} discover <run-dir> [options]`,
    `  ${CLI_NAME} discover-discovery-run <run-dir> [options]`,
    '',
    'Options:',
    '  --acceptance-target <class>     Set acceptance target.',
    '  --architecture-source <ref>     Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --adr-source <ref>              Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --runtime-source <ref>          Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --deployment-contract <ref>     Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --dossier-source <ref>          Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --code-evidence <ref>           Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --operational-evidence <ref>    Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --planning-source <ref>         Local path, file URL, or HTTP(S) URL. Repeatable.',
    '  --source <kind>:<authority>:<ref>  Generic source spec. Repeatable.',
    '  --source-packet <ref>           Explicit packet source. Repeatable.',
    '  --no-repair                     Skip derivable repair before validation.',
    '  -h, --help                      Show help.',
  ].join('\n');
}

function repairHelp(): string {
  return [
    'Refresh source fingerprints from real source refs, repair derivable canonical state, validate, and render.',
    '',
    'Usage:',
    `  ${CLI_NAME} repair <run-dir> [options]`,
    `  ${CLI_NAME} repair-discovery-run <run-dir> [options]`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function validateHelp(): string {
  return [
    'Validate canonical discovery state, refresh assessment.json, and auto-render report.md.',
    '',
    'Usage:',
    `  ${CLI_NAME} validate <run-dir>`,
    `  ${CLI_NAME} validate-discovery-run <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function renderHelp(): string {
  return [
    'Recovery-render report.md from canonical discovery state.',
    '',
    'Usage:',
    `  ${CLI_NAME} render <run-dir>`,
    `  ${CLI_NAME} render-discovery-views <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function deltaHelp(): string {
  return [
    'Compute drift delta for a discovery run, refresh assessment.json, and auto-render report.md.',
    '',
    'Usage:',
    `  ${CLI_NAME} delta <run-dir>`,
    `  ${CLI_NAME} delta-discovery-run <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function rebaselineHelp(): string {
  return [
    'Accept current source and canonical state as the new baseline, refresh assessment.json, and auto-render report.md.',
    '',
    'Usage:',
    `  ${CLI_NAME} rebaseline <run-dir>`,
    `  ${CLI_NAME} rebaseline-discovery-run <run-dir>`,
    '',
    'Options:',
    '  -h, --help  Show help.',
  ].join('\n');
}

function toUsageError(error: unknown, helpText: string): UsageError {
  const message = error instanceof Error ? error.message : String(error);
  return new UsageError(message, helpText);
}

function parseCommandArgs<const T extends NonNullable<Parameters<typeof parseArgs>[0]>>(
  config: T,
  helpText: string,
) {
  try {
    return parseArgs(config);
  } catch (error) {
    throw toUsageError(error, helpText);
  }
}

function requireSingleRunDir(positionals: string[], commandName: string, helpText: string): string {
  if (positionals.length !== 1) {
    throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
  }

  const runDir = positionals[0];
  if (runDir === undefined) {
    throw new UsageError(`${commandName} requires exactly one <run-dir> argument.`, helpText);
  }

  return runDir;
}

function parseAcceptanceTarget(
  acceptanceTargetValue: string | boolean | string[] | undefined,
  helpText: string,
): AcceptanceClass | undefined {
  const acceptanceTarget =
    typeof acceptanceTargetValue === 'string' ? acceptanceTargetValue : undefined;
  if (acceptanceTargetValue !== undefined && acceptanceTarget === undefined) {
    throw new UsageError('Acceptance target must be provided as a single string value.', helpText);
  }
  if (acceptanceTarget !== undefined && !isAcceptanceClass(acceptanceTarget)) {
    throw new UsageError(
      `Invalid acceptance target: ${acceptanceTarget}. Expected one of ${ACCEPTANCE_CLASSES.join(', ')}.`,
      helpText,
    );
  }
  return acceptanceTarget;
}

function addTypedSourceSpecs(
  specs: SourceInputSpec[],
  values: string[] | string | undefined,
  kind: SourceKind,
  authority: SourceAuthorityClass,
): void {
  const refs = Array.isArray(values) ? values : typeof values === 'string' ? [values] : [];
  for (const ref of refs) {
    specs.push({ authority, kind, ref });
  }
}

function parseGenericSourceSpecs(
  values: string[] | string | undefined,
  helpText: string,
): SourceInputSpec[] {
  const refs = Array.isArray(values) ? values : typeof values === 'string' ? [values] : [];
  return refs.map((entry) => {
    const match = /^([^:]+):([^:]+):(.+)$/.exec(entry);
    if (!match) {
      throw new UsageError(
        `Invalid --source value: ${entry}. Expected <kind>:<authority>:<ref>.`,
        helpText,
      );
    }
    const [, kind, authority, ref] = match;
    if (!SOURCE_KINDS.includes(kind as SourceKind)) {
      throw new UsageError(
        `Invalid source kind: ${kind}. Expected one of ${SOURCE_KINDS.join(', ')}.`,
        helpText,
      );
    }
    if (!SOURCE_AUTHORITIES.includes(authority as SourceAuthorityClass)) {
      throw new UsageError(
        `Invalid source authority: ${authority}. Expected one of ${SOURCE_AUTHORITIES.join(', ')}.`,
        helpText,
      );
    }
    if (!ref) {
      throw new UsageError(`Invalid source ref in --source value: ${entry}.`, helpText);
    }
    return {
      authority: authority as SourceAuthorityClass,
      kind: kind as SourceKind,
      ref,
    };
  });
}

function writeAssessmentSummary(
  commandIo: CliIo,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  writeLine(commandIo.stdout, `Assessment status: ${assessment.status}`);
  writeLine(commandIo.stdout, `Achieved acceptance: ${assessment.acceptance.achieved}`);
  writeLine(commandIo.stdout, `Score: ${assessment.score.total}/${assessment.score.max}`);
  writeLine(
    commandIo.stdout,
    `Rebaseline required: ${assessment.rebaseline_required ? 'Yes' : 'No'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale claims/items/proofs: ${assessment.stale_claims.length}/${assessment.stale_items.length}/${assessment.stale_proofs.length}`,
  );
  writeLine(
    commandIo.stdout,
    `Changed sources/claims/gates: ${assessment.delta_summary.changed_source_ids.length}/${assessment.delta_summary.changed_claim_ids.length}/${assessment.delta_summary.changed_track_gate_ids.length}`,
  );
  writeLine(
    commandIo.stdout,
    `Track gates to recalculate: ${assessment.delta_summary.track_gate_ids_to_recalculate.length}`,
  );
  writeLine(commandIo.stdout, `Missing review roles: ${assessment.missing_review_roles.length}`);
  writeLine(
    commandIo.stdout,
    `Pending track-proof reviews: ${assessment.pending_track_proof_reviews.length}`,
  );
  writeLine(commandIo.stdout, `Waiver findings: ${assessment.waiver_findings.length}`);
}

function formatOutputList(values: readonly string[]): string {
  return values.length > 0 ? values.join(', ') : 'None';
}

function writeSummaryMetricsBlock(
  commandIo: CliIo,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  writeLine(commandIo.stdout, 'Summary metrics:');
  writeLines(commandIo.stdout, getSummaryMetricLines(assessment));
}

function writeRebaselineReadinessBlock(
  commandIo: CliIo,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  writeLine(commandIo.stdout, 'Rebaseline readiness:');
  writeLine(commandIo.stdout, `Status: ${assessment.rebaseline_readiness.status}`);
  if (assessment.rebaseline_readiness.reasons.length === 0) {
    writeLine(commandIo.stdout, '- None');
    return;
  }

  for (const reason of assessment.rebaseline_readiness.reasons) {
    writeLine(commandIo.stdout, `- ${reason}`);
  }
}

function writeNewStaleBlock(commandIo: CliIo, runDir: string): void {
  const snapshot = readLatestMutatingNewStaleSnapshot(runPaths(runDir).journal);
  writeLine(commandIo.stdout, 'New stale since last change:');
  writeLine(commandIo.stdout, `Status: ${snapshot.status}`);
  writeLine(commandIo.stdout, `Reason: ${snapshot.reason ?? 'None'}`);
  writeLine(commandIo.stdout, `Claims: ${formatOutputList(snapshot.claims)}`);
  writeLine(commandIo.stdout, `Items: ${formatOutputList(snapshot.items)}`);
  writeLine(commandIo.stdout, `Proofs: ${formatOutputList(snapshot.proofs)}`);
  writeLine(commandIo.stdout, `Reviews: ${formatOutputList(snapshot.reviews)}`);
}

function writeHumanReadableDeltaBlock(commandIo: CliIo, diff: HumanReadableDelta): void {
  const unavailableReason = 'Unavailable without baseline_projection.';
  const renderCategory = (values: string[]): string => {
    if (!diff.baselineEstablished) {
      return unavailableReason;
    }
    return values.length > 0 ? values.join(', ') : 'None';
  };

  writeLine(commandIo.stdout, 'Human-readable diff:');
  writeLine(commandIo.stdout, `baseline_established=${diff.baselineEstablished}`);
  writeLine(commandIo.stdout, `Item adds: ${renderCategory(diff.itemAdds)}`);
  writeLine(commandIo.stdout, `Item removals: ${renderCategory(diff.itemRemovals)}`);
  writeLine(commandIo.stdout, `Item state changes: ${renderCategory(diff.itemStateChanges)}`);
  writeLine(commandIo.stdout, `Relation adds: ${renderCategory(diff.relationAdds)}`);
  writeLine(commandIo.stdout, `Relation removals: ${renderCategory(diff.relationRemovals)}`);
  writeLine(
    commandIo.stdout,
    `Claim commitment changes: ${renderCategory(diff.claimCommitmentChanges)}`,
  );
  writeLine(commandIo.stdout, `Roadmap order changes: ${renderCategory(diff.roadmapOrderChanges)}`);
}

function writeDeltaOperatorOutput(
  commandIo: CliIo,
  runDir: string,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
  diff: HumanReadableDelta,
): void {
  writeLine(commandIo.stdout, 'Core assessment summary:');
  writeAssessmentSummary(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeSummaryMetricsBlock(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeLine(commandIo.stdout, 'Changed sources/claims/gates:');
  writeLine(
    commandIo.stdout,
    `Changed sources: ${formatOutputList(assessment.delta_summary.changed_source_ids)}`,
  );
  writeLine(
    commandIo.stdout,
    `Changed claims: ${formatOutputList(assessment.delta_summary.changed_claim_ids)}`,
  );
  writeLine(
    commandIo.stdout,
    `Changed track gates: ${formatOutputList(assessment.delta_summary.changed_track_gate_ids)}`,
  );
  writeLine(
    commandIo.stdout,
    `Track gates to recalculate: ${formatOutputList(
      assessment.delta_summary.track_gate_ids_to_recalculate,
    )}`,
  );
  writeLine(
    commandIo.stdout,
    `Dirty flags: ${formatOutputList(assessment.delta_summary.dirty_flags)}`,
  );
  writeLine(commandIo.stdout);
  writeHumanReadableDeltaBlock(commandIo, diff);
  writeLine(commandIo.stdout);
  writeLine(commandIo.stdout, 'Stale and readiness diagnostics:');
  writeLine(commandIo.stdout, `Stale claims: ${formatOutputList(assessment.stale_claims)}`);
  writeLine(commandIo.stdout, `Stale items: ${formatOutputList(assessment.stale_items)}`);
  writeLine(commandIo.stdout, `Stale proofs: ${formatOutputList(assessment.stale_proofs)}`);
  writeLine(
    commandIo.stdout,
    `Stale review artifacts: ${formatOutputList(assessment.stale_review_artifacts)}`,
  );
  writeRebaselineReadinessBlock(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeNewStaleBlock(commandIo, runDir);
}

function writeDiscoverOperatorOutput(
  commandIo: CliIo,
  runDir: string,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  writeLine(
    commandIo.stdout,
    `Stale review artifacts: ${formatOutputList(assessment.stale_review_artifacts)}`,
  );
  writeRebaselineReadinessBlock(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeNewStaleBlock(commandIo, runDir);
}

function writeRebaselineOperatorOutput(
  commandIo: CliIo,
  runDir: string,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  writeSummaryMetricsBlock(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeLine(commandIo.stdout, `Stale proofs: ${formatOutputList(assessment.stale_proofs)}`);
  writeLine(
    commandIo.stdout,
    `Stale review artifacts: ${formatOutputList(assessment.stale_review_artifacts)}`,
  );
  writeRebaselineReadinessBlock(commandIo, assessment);
  writeLine(commandIo.stdout);
  writeNewStaleBlock(commandIo, runDir);
}

function writeAssessmentDiagnostics(
  commandIo: CliIo,
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): void {
  for (const error of assessment.errors) {
    writeLine(commandIo.stderr, `ERROR: ${error}`);
  }
  const explicitHardFails = assessment.hard_fails.filter(
    (hardFail) => !assessment.errors.includes(hardFail),
  );
  for (const hardFail of explicitHardFails) {
    writeLine(commandIo.stderr, `HARD_FAIL: ${hardFail}`);
  }
  for (const warning of assessment.warnings) {
    writeLine(commandIo.stdout, `WARNING: ${warning}`);
  }
  for (const finding of assessment.lint_findings) {
    writeLine(commandIo.stdout, `LINT: ${finding}`);
  }
}

function writeInaccessibleSources(commandIo: CliIo, inaccessibleSources: string[]): void {
  for (const sourceId of inaccessibleSources) {
    writeLine(
      commandIo.stderr,
      `ERROR: Source ${sourceId} could not be read from its declared ref.`,
    );
  }
}

function assessmentExitCode(
  assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>,
): number {
  return assessment.status === 'pass' && !assessment.rebaseline_required
    ? EXIT_SUCCESS
    : EXIT_FAILURE;
}

function runInitCommand(argv: string[], commandIo: CliIo): number {
  const helpText = initHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        'acceptance-target': {
          type: 'string',
        },
        force: {
          short: 'f',
          type: 'boolean',
        },
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'init', helpText);
  const acceptanceTarget = parseAcceptanceTarget(parsed.values['acceptance-target'], helpText);

  const initOptions: {
    acceptanceTarget?: AcceptanceClass;
    force?: boolean;
    runDir: string;
  } = { runDir };

  if (acceptanceTarget !== undefined) {
    initOptions.acceptanceTarget = acceptanceTarget;
  }
  if (parsed.values.force !== undefined) {
    initOptions.force = parsed.values.force;
  }

  const commandRunId = createCommandRunId();
  const result = initializeDiscoveryRun({
    ...initOptions,
    commandRunId,
  });
  const renderResult = renderDiscoveryViews(result.runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });
  writeLine(commandIo.stdout, `Initialized discovery run at ${result.runDir}`);
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  return EXIT_SUCCESS;
}

async function runDiscoverCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = discoverHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        'acceptance-target': {
          type: 'string',
        },
        'architecture-source': {
          type: 'string',
          multiple: true,
        },
        'adr-source': {
          type: 'string',
          multiple: true,
        },
        'runtime-source': {
          type: 'string',
          multiple: true,
        },
        'deployment-contract': {
          type: 'string',
          multiple: true,
        },
        'dossier-source': {
          type: 'string',
          multiple: true,
        },
        'code-evidence': {
          type: 'string',
          multiple: true,
        },
        'operational-evidence': {
          type: 'string',
          multiple: true,
        },
        'planning-source': {
          type: 'string',
          multiple: true,
        },
        source: {
          type: 'string',
          multiple: true,
        },
        'source-packet': {
          type: 'string',
          multiple: true,
        },
        'no-repair': {
          type: 'boolean',
        },
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'discover', helpText);
  const acceptanceTarget = parseAcceptanceTarget(parsed.values['acceptance-target'], helpText);
  const sourceInputs: SourceInputSpec[] = [];
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['architecture-source'],
    'architecture_doc',
    'authoritative_target_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['adr-source'],
    'adr',
    'authoritative_target_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['runtime-source'],
    'runtime_evidence',
    'authoritative_current_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['deployment-contract'],
    'deployment_contract',
    'authoritative_current_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['dossier-source'],
    'delivered_dossier_ssot',
    'authoritative_current_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['code-evidence'],
    'code_evidence',
    'authoritative_current_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['operational-evidence'],
    'operational_evidence',
    'authoritative_current_truth',
  );
  addTypedSourceSpecs(
    sourceInputs,
    parsed.values['planning-source'],
    'backlog_text',
    'planning_only',
  );
  sourceInputs.push(...parseGenericSourceSpecs(parsed.values.source, helpText));

  const packetRefs = Array.isArray(parsed.values['source-packet'])
    ? parsed.values['source-packet']
    : typeof parsed.values['source-packet'] === 'string'
      ? [parsed.values['source-packet']]
      : [];

  if (sourceInputs.length === 0 && packetRefs.length === 0) {
    throw new UsageError(
      'discover requires at least one source input or --source-packet.',
      helpText,
    );
  }

  const commandRunId = createCommandRunId();
  const result = await discoverDiscoveryRun({
    ...(acceptanceTarget ? { acceptanceTarget } : {}),
    commandRunId,
    ...(packetRefs.length > 0 ? { packetRefs } : {}),
    repair: !parsed.values['no-repair'],
    runDir,
    sourceInputs,
  });

  if (result.legacyLayoutMessage) {
    writeLine(commandIo.stderr, result.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (result.unsupportedSchemaMessages.length > 0) {
    for (const message of result.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (result.missingArtifacts.length > 0) {
    for (const filePath of result.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (result.inaccessibleSources.length > 0) {
    writeInaccessibleSources(commandIo, result.inaccessibleSources);
    return EXIT_FAILURE;
  }
  if (!result.assessment) {
    writeLine(commandIo.stderr, 'Discovery run could not be assessed.');
    return EXIT_FAILURE;
  }
  const renderResult = renderDiscoveryViews(result.runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });

  writeLine(
    commandIo.stdout,
    `${result.initialized ? 'Initialized' : 'Reused'} discovery run at ${result.runDir}`,
  );
  writeLine(
    commandIo.stdout,
    `Resolved sources: ${result.sourceIds.length > 0 ? result.sourceIds.join(', ') : 'None'}`,
  );
  writeLine(commandIo.stdout, `Applied source packets: ${result.appliedPackets}`);
  writeLine(
    commandIo.stdout,
    `Applied derivable repairs: ${result.appliedRepairs.length > 0 ? result.appliedRepairs.join(', ') : 'None'}`,
  );
  writeAssessmentSummary(commandIo, result.assessment);
  writeLine(commandIo.stdout);
  writeDiscoverOperatorOutput(commandIo, result.runDir, result.assessment);
  writeAssessmentDiagnostics(commandIo, result.assessment);
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  return assessmentExitCode(result.assessment);
}

async function runStatusCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = statusHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'status', helpText);
  const refreshResult = await refreshRunSourceFingerprints(runDir);
  if (refreshResult.legacyLayoutMessage) {
    writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (refreshResult.unsupportedSchemaMessages.length > 0) {
    for (const message of refreshResult.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (refreshResult.missingArtifacts.length > 0) {
    for (const filePath of refreshResult.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (refreshResult.inaccessibleSources.length > 0) {
    writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
    return EXIT_FAILURE;
  }

  const validationResult = validateDiscoveryRun(runDir);
  if (validationResult.legacyLayoutMessage) {
    writeLine(commandIo.stderr, validationResult.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (validationResult.missingArtifacts.length > 0) {
    for (const filePath of validationResult.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (!validationResult.assessment) {
    writeLine(commandIo.stderr, 'Status could not be determined.');
    return EXIT_FAILURE;
  }
  writeLines(commandIo.stdout, renderDiscoveryStatusOutput(runDir));

  return assessmentExitCode(validationResult.assessment);
}

async function runRepairCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = repairHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'repair', helpText);
  const commandRunId = createCommandRunId();
  const refreshResult = await refreshRunSourceFingerprints(runDir, { commandRunId });
  if (refreshResult.legacyLayoutMessage) {
    writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (refreshResult.unsupportedSchemaMessages.length > 0) {
    for (const message of refreshResult.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (refreshResult.missingArtifacts.length > 0) {
    for (const filePath of refreshResult.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  const repairResult =
    refreshResult.inaccessibleSources.length > 0
      ? {
          appliedRepairs: [],
          legacyLayoutMessage: undefined,
          missingArtifacts: [],
          unsupportedSchemaMessages: [],
        }
      : repairDiscoveryRun(runDir, { commandRunId });
  if (repairResult.legacyLayoutMessage) {
    writeLine(commandIo.stderr, repairResult.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (repairResult.unsupportedSchemaMessages.length > 0) {
    for (const message of repairResult.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (repairResult.missingArtifacts.length > 0) {
    for (const filePath of repairResult.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }

  const validationResult = validateDiscoveryRun(runDir, { commandRunId });
  if (!validationResult.assessment) {
    writeLine(commandIo.stderr, 'Repair could not produce an assessment.');
    return EXIT_FAILURE;
  }
  const renderResult = renderDiscoveryViews(runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });

  if (refreshResult.inaccessibleSources.length > 0) {
    writeLine(commandIo.stdout, `Repair could not complete for ${runDir}`);
  } else {
    writeLine(commandIo.stdout, `Repaired discovery run at ${runDir}`);
  }
  writeLine(
    commandIo.stdout,
    `Refreshed source fingerprints: ${refreshResult.changedSourceIds.length > 0 ? refreshResult.changedSourceIds.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Applied derivable repairs: ${repairResult.appliedRepairs.length > 0 ? repairResult.appliedRepairs.join(', ') : 'None'}`,
  );
  writeAssessmentSummary(commandIo, validationResult.assessment);
  writeAssessmentDiagnostics(commandIo, validationResult.assessment);
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  if (refreshResult.inaccessibleSources.length > 0) {
    writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
    return EXIT_FAILURE;
  }
  return assessmentExitCode(validationResult.assessment);
}

async function runValidateCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = validateHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'validate', helpText);
  const commandRunId = createCommandRunId();
  const refreshResult = await refreshRunSourceFingerprints(runDir, { commandRunId });
  if (refreshResult.legacyLayoutMessage) {
    writeLine(commandIo.stderr, refreshResult.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (refreshResult.unsupportedSchemaMessages.length > 0) {
    for (const message of refreshResult.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (refreshResult.missingArtifacts.length > 0) {
    for (const filePath of refreshResult.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  const result = validateDiscoveryRun(runDir, { commandRunId });

  if (result.legacyLayoutMessage) {
    writeLine(commandIo.stderr, result.legacyLayoutMessage);
    return EXIT_FAILURE;
  }

  if (result.missingArtifacts.length > 0) {
    for (const filePath of result.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }

  const assessment = result.assessment;
  if (!assessment) {
    writeLine(commandIo.stderr, 'Assessment state could not be produced.');
    return EXIT_FAILURE;
  }
  const renderResult = renderDiscoveryViews(runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });

  writeAssessmentSummary(commandIo, assessment);
  writeAssessmentDiagnostics(commandIo, assessment);
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  if (refreshResult.inaccessibleSources.length > 0) {
    writeInaccessibleSources(commandIo, refreshResult.inaccessibleSources);
    return EXIT_FAILURE;
  }

  return assessmentExitCode(assessment);
}

function runRenderCommand(argv: string[], commandIo: CliIo): number {
  const helpText = renderHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'render', helpText);
  const bundleRepair = repairCompactRunBundle(runDir);
  if (bundleRepair.legacyLayoutMessage) {
    writeLine(commandIo.stderr, bundleRepair.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (bundleRepair.unsupportedSchemaMessages.length > 0) {
    for (const message of bundleRepair.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (bundleRepair.irreparableMissingArtifacts.length > 0) {
    for (const filePath of bundleRepair.irreparableMissingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  const commandRunId = createCommandRunId();
  const result = renderDiscoveryViews(runDir, {
    commandRunId,
    renderReason: 'recovery_render',
  });
  writeLine(commandIo.stdout, `Rendered report into ${result.reportPath}`);
  return EXIT_SUCCESS;
}

async function runDeltaCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = deltaHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'delta', helpText);
  const commandRunId = createCommandRunId();
  const result = await computeDiscoveryDelta(runDir, { commandRunId });
  if (result.legacyLayoutMessage) {
    writeLine(commandIo.stderr, result.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (result.unsupportedSchemaMessages.length > 0) {
    for (const message of result.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (result.missingArtifacts.length > 0) {
    for (const filePath of result.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (!result.assessment) {
    if (result.inaccessibleSources.length > 0) {
      writeInaccessibleSources(commandIo, result.inaccessibleSources);
    }
    writeLine(commandIo.stderr, 'Delta state could not be produced.');
    return EXIT_FAILURE;
  }
  const renderResult = renderDiscoveryViews(result.runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });

  if (result.inaccessibleSources.length > 0) {
    writeDeltaOperatorOutput(commandIo, result.runDir, result.assessment, result.humanReadableDiff);
    writeAssessmentDiagnostics(commandIo, result.assessment);
    writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
    writeInaccessibleSources(commandIo, result.inaccessibleSources);
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Delta computed for ${result.runDir}`);
  writeDeltaOperatorOutput(commandIo, result.runDir, result.assessment, result.humanReadableDiff);
  writeAssessmentDiagnostics(commandIo, result.assessment);
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  return EXIT_SUCCESS;
}

async function runRebaselineCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = rebaselineHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        help: {
          short: 'h',
          type: 'boolean',
        },
      },
    },
    helpText,
  );

  if (parsed.values.help) {
    writeLine(commandIo.stdout, helpText);
    return EXIT_SUCCESS;
  }

  const runDir = requireSingleRunDir(parsed.positionals, 'rebaseline', helpText);
  const commandRunId = createCommandRunId();
  const result = await rebaselineDiscoveryRun(runDir, { commandRunId });
  if (result.legacyLayoutMessage) {
    writeLine(commandIo.stderr, result.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (result.unsupportedSchemaMessages.length > 0) {
    for (const message of result.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (result.missingArtifacts.length > 0) {
    for (const filePath of result.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (!result.assessment) {
    if (result.inaccessibleSources.length > 0) {
      writeInaccessibleSources(commandIo, result.inaccessibleSources);
    }
    writeLine(commandIo.stderr, 'Rebaseline could not be completed.');
    return EXIT_FAILURE;
  }
  const renderResult = renderDiscoveryViews(result.runDir, {
    commandRunId,
    renderReason: 'mutating_command',
  });

  if (result.inaccessibleSources.length > 0) {
    writeAssessmentSummary(commandIo, result.assessment);
    writeLine(commandIo.stdout);
    writeRebaselineOperatorOutput(commandIo, result.runDir, result.assessment);
    writeAssessmentDiagnostics(commandIo, result.assessment);
    writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
    writeInaccessibleSources(commandIo, result.inaccessibleSources);
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Rebaseline completed for ${result.runDir}`);
  writeLine(commandIo.stdout, `Rebaseline recorded at ${result.rebaselinedAt ?? 'unknown-time'}`);
  writeLine(
    commandIo.stdout,
    `Rebaseline causes: ${result.causes.length > 0 ? result.causes.join(', ') : 'none'}`,
  );
  writeAssessmentSummary(commandIo, result.assessment);
  writeLine(commandIo.stdout);
  writeRebaselineOperatorOutput(commandIo, result.runDir, result.assessment);
  writeAssessmentDiagnostics(commandIo, result.assessment);
  if (result.assessment.next_actions.length > 0) {
    writeLine(commandIo.stdout, 'Next actions:');
    for (const action of result.assessment.next_actions) {
      writeLine(commandIo.stdout, `- ${action}`);
    }
  }
  writeLine(commandIo.stdout, `Rendered report into ${renderResult.reportPath}`);
  return EXIT_SUCCESS;
}

const COMMANDS: CommandDefinition[] = [
  {
    aliases: ['init-discovery-run'],
    helpText: initHelp,
    name: 'init',
    run: runInitCommand,
  },
  {
    aliases: ['discover-discovery-run'],
    helpText: discoverHelp,
    name: 'discover',
    run: runDiscoverCommand,
  },
  {
    aliases: ['status-discovery-run'],
    helpText: statusHelp,
    name: 'status',
    run: runStatusCommand,
  },
  {
    aliases: ['repair-discovery-run'],
    helpText: repairHelp,
    name: 'repair',
    run: runRepairCommand,
  },
  {
    aliases: ['validate-discovery-run'],
    helpText: validateHelp,
    name: 'validate',
    run: runValidateCommand,
  },
  {
    aliases: ['render-discovery-views'],
    helpText: renderHelp,
    name: 'render',
    run: runRenderCommand,
  },
  {
    aliases: ['delta-discovery-run'],
    helpText: deltaHelp,
    name: 'delta',
    run: runDeltaCommand,
  },
  {
    aliases: ['rebaseline-discovery-run'],
    helpText: rebaselineHelp,
    name: 'rebaseline',
    run: runRebaselineCommand,
  },
];

function findCommand(commandName: string): CommandDefinition | undefined {
  return COMMANDS.find(
    (command) => command.name === commandName || command.aliases.includes(commandName),
  );
}

function printUsageError(error: UsageError, commandIo: CliIo): number {
  writeLine(commandIo.stderr, error.message);
  if (error.helpText) {
    writeLine(commandIo.stderr);
    writeLine(commandIo.stderr, error.helpText);
  }
  return EXIT_USAGE;
}

export async function executeCli(argv: string[], commandIo: CliIo = io): Promise<number> {
  const firstToken = argv[0];
  if (firstToken === undefined) {
    return printUsageError(new UsageError('A command is required.', globalHelp()), commandIo);
  }

  const rest = argv.slice(1);

  if (firstToken === '--help' || firstToken === '-h') {
    writeLine(commandIo.stdout, globalHelp());
    return EXIT_SUCCESS;
  }

  if (firstToken === '--version') {
    writeLine(commandIo.stdout, packageJson.version);
    return EXIT_SUCCESS;
  }

  if (firstToken === 'help') {
    if (rest.length === 0) {
      writeLine(commandIo.stdout, globalHelp());
      return EXIT_SUCCESS;
    }
    if (rest.length > 1) {
      return printUsageError(
        new UsageError('help accepts at most one command name.', globalHelp()),
        commandIo,
      );
    }

    const targetName = rest[0];
    if (targetName === undefined) {
      return printUsageError(
        new UsageError('help accepts at most one command name.', globalHelp()),
        commandIo,
      );
    }

    const targetCommand = findCommand(targetName);
    if (!targetCommand) {
      return printUsageError(
        new UsageError(`Unknown command: ${targetName}`, globalHelp()),
        commandIo,
      );
    }

    writeLine(commandIo.stdout, targetCommand.helpText());
    return EXIT_SUCCESS;
  }

  const command = findCommand(firstToken);
  if (!command) {
    return printUsageError(
      new UsageError(`Unknown command: ${firstToken}`, globalHelp()),
      commandIo,
    );
  }

  try {
    return await command.run(rest, commandIo);
  } catch (error) {
    if (error instanceof UsageError) {
      return printUsageError(error, commandIo);
    }

    const message = error instanceof Error ? error.message : String(error);
    writeLine(commandIo.stderr, message);
    return EXIT_FAILURE;
  }
}

function isDirectExecution(metaUrl: string): boolean {
  const currentFilePath = fileURLToPath(metaUrl);
  const argvPath = process.argv[1];
  if (!argvPath) {
    return false;
  }

  try {
    return fs.realpathSync(argvPath) === fs.realpathSync(currentFilePath);
  } catch {
    return path.resolve(argvPath) === currentFilePath;
  }
}

if (isDirectExecution(import.meta.url)) {
  executeCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      writeLine(process.stderr, message);
      process.exit(EXIT_FAILURE);
    });
}

export const cliName = CLI_NAME;
