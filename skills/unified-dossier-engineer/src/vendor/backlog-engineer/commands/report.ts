import {
  ReportCommandInputSchema,
  ReportCommandOutputSchema,
  type ReportCommandInput,
  type ReportCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import {
  ABSOLUTE_OUTPUT_NOTE,
  BACKLOG_MUTATION_SCOPE_NOTE,
  SERIAL_MUTATION_NOTE,
} from './help-notes.ts';
import { assertBacklogRoot, loadQueryStateWithRegistry } from './query-helpers.ts';
import path from 'node:path';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const REPORT_COMMAND: CommandDefinition<ReportCommandInput, ReportCommandOutput> = {
  name: 'report',
  summary: 'Generate a human-readable backlog report on disk.',
  usage: ['backlog-engineer report'],
  options: OPTIONS,
  notes: [
    BACKLOG_MUTATION_SCOPE_NOTE,
    'Report files are always written into the standard reports directory inside the backlog root.',
    SERIAL_MUTATION_NOTE,
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: ReportCommandInputSchema,
  outputSchema: ReportCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('report', args, {});
    assertNoPositionals('report', parsed.positionals);

    return parseUsageInput('report', ReportCommandInputSchema, {});
  },
  async execute(_input, context) {
    const backlogRoot = assertBacklogRoot(context);
    const { state, registry } = await loadQueryStateWithRegistry(context);
    const model = await context.reports.buildReportModel({
      state,
      registry,
    });
    const baseSections = context.reports.buildSections(model);
    const sections =
      (await context.hooks.decorateReportSections?.({
        sections: baseSections,
      })) ?? baseSections;
    const markdown = context.reports.renderMarkdown(sections);
    const mermaid = context.reports.renderMermaid(model);
    const { reportPath } = await context.artifacts.writeReportFiles({
      root: backlogRoot,
      markdown,
      mermaid,
    });

    return context.schemas.parseCommandOutput('report', {
      report_path: path.resolve(backlogRoot, reportPath),
      generated_at: context.host.nowIsoUtc(),
      item_count: model.metrics.totalItems,
    });
  },
};
