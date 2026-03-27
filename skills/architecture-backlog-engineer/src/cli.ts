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
  type AcceptanceClass,
  type SourceAuthorityClass,
  type SourceKind,
} from './discovery/common.js';
import { repairCompactRunBundle } from './discovery/bundle-repair.js';
import { computeDiscoveryDelta } from './discovery/delta-run.js';
import { discoverDiscoveryRun } from './discovery/discover-run.js';
import { initializeDiscoveryRun } from './discovery/init-run.js';
import { repairDiscoveryRun } from './discovery/repair-run.js';
import { rebaselineDiscoveryRun } from './discovery/rebaseline-run.js';
import { renderDiscoveryViews } from './discovery/render-views.js';
import { getDiscoveryRunStatus } from './discovery/status-run.js';
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

function globalHelp(): string {
  return [
    'Architecture backlog discovery CLI.',
    '',
    'Usage:',
    `  ${CLI_NAME} <command> [options]`,
    `  ${CLI_NAME} help [command]`,
    '',
    'Commands:',
    '  init <run-dir>       Initialize manifest.json, backlog.json, assessment.json, and journal.ndjson.',
    '  discover <run-dir>   Resolve sources, populate backlog.json, repair derivable state, validate, and render.',
    '  status <run-dir>     Show lifecycle status, acceptance state, and next actions.',
    '  repair <run-dir>     Refresh source truth, repair derivable canonical state, validate, and render.',
    '  validate <run-dir>   Validate canonical state and refresh assessment.json.',
    '  render <run-dir>     Render report.md from canonical state and assessment.',
    '  delta <run-dir>      Compute drift delta and refresh assessment.json.',
    '  rebaseline <run-dir> Accept current source/canonical state as the new baseline.',
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
    '  --no-render                     Skip report rendering.',
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
    '  --no-render  Skip report rendering.',
    '  -h, --help   Show help.',
  ].join('\n');
}

function validateHelp(): string {
  return [
    'Validate canonical discovery state and refresh assessment.json.',
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
    'Render report.md from canonical discovery state.',
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
    'Compute drift delta for a discovery run and refresh assessment.json.',
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
    'Accept current source and canonical state as the new baseline, then refresh assessment.json.',
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

function writeAssessmentSummary(commandIo: CliIo, assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>): void {
  writeLine(commandIo.stdout, `Assessment status: ${assessment.status}`);
  writeLine(commandIo.stdout, `Achieved acceptance: ${assessment.acceptance.achieved}`);
  writeLine(commandIo.stdout, `Score: ${assessment.score.total}/${assessment.score.max}`);
  writeLine(commandIo.stdout, `Rebaseline required: ${assessment.rebaseline_required ? 'Yes' : 'No'}`);
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

function writeAssessmentDiagnostics(commandIo: CliIo, assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>): void {
  for (const error of assessment.errors) {
    writeLine(commandIo.stderr, `ERROR: ${error}`);
  }
  const explicitHardFails = assessment.hard_fails.filter((hardFail) => !assessment.errors.includes(hardFail));
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
    writeLine(commandIo.stderr, `ERROR: Source ${sourceId} could not be read from its declared ref.`);
  }
}

function assessmentExitCode(assessment: NonNullable<ReturnType<typeof validateDiscoveryRun>['assessment']>): number {
  return assessment.status === 'pass' && !assessment.rebaseline_required ? EXIT_SUCCESS : EXIT_FAILURE;
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

  const result = initializeDiscoveryRun(initOptions);
  writeLine(commandIo.stdout, `Initialized discovery run at ${result.runDir}`);
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
        'no-render': {
          type: 'boolean',
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
  addTypedSourceSpecs(sourceInputs, parsed.values['architecture-source'], 'architecture_doc', 'authoritative_target_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['adr-source'], 'adr', 'authoritative_target_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['runtime-source'], 'runtime_evidence', 'authoritative_current_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['deployment-contract'], 'deployment_contract', 'authoritative_current_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['dossier-source'], 'delivered_dossier_ssot', 'authoritative_current_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['code-evidence'], 'code_evidence', 'authoritative_current_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['operational-evidence'], 'operational_evidence', 'authoritative_current_truth');
  addTypedSourceSpecs(sourceInputs, parsed.values['planning-source'], 'backlog_text', 'planning_only');
  sourceInputs.push(...parseGenericSourceSpecs(parsed.values.source, helpText));

  const packetRefs = Array.isArray(parsed.values['source-packet'])
    ? parsed.values['source-packet']
    : typeof parsed.values['source-packet'] === 'string'
      ? [parsed.values['source-packet']]
      : [];

  if (sourceInputs.length === 0 && packetRefs.length === 0) {
    throw new UsageError('discover requires at least one source input or --source-packet.', helpText);
  }

  const result = await discoverDiscoveryRun({
    ...(acceptanceTarget ? { acceptanceTarget } : {}),
    ...(packetRefs.length > 0 ? { packetRefs } : {}),
    render: !parsed.values['no-render'],
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

  writeLine(commandIo.stdout, `${result.initialized ? 'Initialized' : 'Reused'} discovery run at ${result.runDir}`);
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
  writeAssessmentDiagnostics(commandIo, result.assessment);
  if (result.reportPath) {
    writeLine(commandIo.stdout, `Rendered report into ${result.reportPath}`);
  }
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

  const status = getDiscoveryRunStatus(runDir);
  if (status.legacyLayoutMessage) {
    writeLine(commandIo.stderr, status.legacyLayoutMessage);
    return EXIT_FAILURE;
  }
  if (status.unsupportedSchemaMessages.length > 0) {
    for (const message of status.unsupportedSchemaMessages) {
      writeLine(commandIo.stderr, message);
    }
    return EXIT_FAILURE;
  }
  if (status.missingArtifacts.length > 0) {
    for (const filePath of status.missingArtifacts) {
      writeLine(commandIo.stderr, `Missing discovery artifact: ${filePath}`);
    }
    return EXIT_FAILURE;
  }
  if (!status.manifest || !status.assessment) {
    writeLine(commandIo.stderr, 'Status could not be determined.');
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Run: ${status.manifest.run_id}`);
  writeLine(commandIo.stdout, `Phase: ${status.manifest.phase_state}`);
  writeLine(commandIo.stdout, `Target acceptance: ${status.manifest.acceptance_target}`);
  writeLine(commandIo.stdout, `Achieved acceptance: ${status.assessment.acceptance.achieved}`);
  writeLine(commandIo.stdout, `Assessment: ${status.assessment.status}`);
  writeLine(commandIo.stdout, `Closure: ${status.assessment.closure.status}`);
  writeLine(commandIo.stdout, `Score: ${status.assessment.score.total}/${status.assessment.score.max}`);
  writeLine(commandIo.stdout, `Errors: ${status.assessment.errors.length}`);
  writeLine(commandIo.stdout, `Warnings: ${status.assessment.warnings.length}`);
  writeLine(commandIo.stdout, `Hard-fails: ${status.assessment.hard_fails.length}`);
  writeLine(commandIo.stdout, `Rebaseline required: ${status.assessment.rebaseline_required ? 'Yes' : 'No'}`);
  writeLine(
    commandIo.stdout,
    `Dirty flags: ${status.manifest.dirty_flags.length > 0 ? status.manifest.dirty_flags.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale proofs: ${status.assessment.stale_proofs.length > 0 ? status.assessment.stale_proofs.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale items: ${status.assessment.stale_items.length > 0 ? status.assessment.stale_items.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale claims: ${status.assessment.stale_claims.length > 0 ? status.assessment.stale_claims.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Track gate failures: ${
      status.assessment.track_gate_failures.length > 0
        ? status.assessment.track_gate_failures.join(', ')
        : 'None'
    }`,
  );
  writeLine(
    commandIo.stdout,
    `Missing review roles: ${
      status.assessment.missing_review_roles.length > 0
        ? status.assessment.missing_review_roles.join(', ')
        : 'None'
    }`,
  );
  writeLine(
    commandIo.stdout,
    `Pending track-proof reviews: ${
      status.assessment.pending_track_proof_reviews.length > 0
        ? status.assessment.pending_track_proof_reviews.join(', ')
        : 'None'
    }`,
  );
  writeLine(
    commandIo.stdout,
    `Waiver findings: ${
      status.assessment.waiver_findings.length > 0
        ? status.assessment.waiver_findings.join('; ')
        : 'None'
    }`,
  );
  writeLine(
    commandIo.stdout,
    `Last delta: ${status.manifest.last_delta_at ?? 'Never'}`,
  );
  writeLine(
    commandIo.stdout,
    `Last rebaseline: ${status.manifest.last_rebaseline_at ?? 'Never'}`,
  );
  if (status.assessment.hard_fails.length > 0) {
    writeLine(commandIo.stdout, 'Hard-fail details:');
    for (const hardFail of status.assessment.hard_fails) {
      writeLine(commandIo.stdout, `- ${hardFail}`);
    }
  }
  if (status.assessment.next_actions.length > 0) {
    writeLine(commandIo.stdout, 'Next actions:');
    for (const action of status.assessment.next_actions) {
      writeLine(commandIo.stdout, `- ${action}`);
    }
  }

  return assessmentExitCode(status.assessment);
}

async function runRepairCommand(argv: string[], commandIo: CliIo): Promise<number> {
  const helpText = repairHelp();
  const parsed = parseCommandArgs(
    {
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        'no-render': {
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

  const runDir = requireSingleRunDir(parsed.positionals, 'repair', helpText);
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

  const repairResult = repairDiscoveryRun(runDir);
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

  const validationResult = validateDiscoveryRun(runDir);
  if (!validationResult.assessment) {
    writeLine(commandIo.stderr, 'Repair could not produce an assessment.');
    return EXIT_FAILURE;
  }

  let reportPath: string | undefined;
  if (!parsed.values['no-render']) {
    reportPath = renderDiscoveryViews(runDir).reportPath;
  }

  writeLine(commandIo.stdout, `Repaired discovery run at ${runDir}`);
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
  if (reportPath) {
    writeLine(commandIo.stdout, `Rendered report into ${reportPath}`);
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

  const result = validateDiscoveryRun(runDir);

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

  writeAssessmentSummary(commandIo, assessment);
  writeAssessmentDiagnostics(commandIo, assessment);

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
  const result = renderDiscoveryViews(runDir);
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
  const result = await computeDiscoveryDelta(runDir);
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
    writeLine(commandIo.stderr, 'Delta state could not be produced.');
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Delta computed for ${result.runDir}`);
  writeAssessmentSummary(commandIo, result.assessment);
  writeLine(
    commandIo.stdout,
    `Changed sources: ${result.assessment.delta_summary.changed_source_ids.length > 0 ? result.assessment.delta_summary.changed_source_ids.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Changed claims: ${result.assessment.delta_summary.changed_claim_ids.length > 0 ? result.assessment.delta_summary.changed_claim_ids.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale items: ${result.assessment.stale_items.length > 0 ? result.assessment.stale_items.join(', ') : 'None'}`,
  );
  writeLine(
    commandIo.stdout,
    `Stale proofs: ${result.assessment.stale_proofs.length > 0 ? result.assessment.stale_proofs.join(', ') : 'None'}`,
  );
  writeAssessmentDiagnostics(commandIo, result.assessment);
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
  const result = await rebaselineDiscoveryRun(runDir);
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
    writeLine(commandIo.stderr, 'Rebaseline could not be completed.');
    return EXIT_FAILURE;
  }

  writeLine(commandIo.stdout, `Rebaseline completed for ${result.runDir}`);
  writeLine(commandIo.stdout, `Rebaseline recorded at ${result.rebaselinedAt ?? 'unknown-time'}`);
  writeLine(
    commandIo.stdout,
    `Rebaseline causes: ${result.causes.length > 0 ? result.causes.join(', ') : 'none'}`,
  );
  writeAssessmentSummary(commandIo, result.assessment);
  writeAssessmentDiagnostics(commandIo, result.assessment);
  if (result.assessment.next_actions.length > 0) {
    writeLine(commandIo.stdout, 'Next actions:');
    for (const action of result.assessment.next_actions) {
      writeLine(commandIo.stdout, `- ${action}`);
    }
  }
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
