import { createBacklogError } from '../errors/index.ts';
import path from 'node:path';
import { LAYOUT_VERSION, SCHEMA_VERSION, TOOL_NAME } from '../runtime/tool-metadata.ts';
import {
  DeleteBacklogCommandInputSchema,
  DeleteBacklogCommandOutputSchema,
  type CommandHelpOption,
  type DeleteBacklogCommandInput,
  type DeleteBacklogCommandOutput,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';

const OPTIONS = [
  {
    flags: ['--confirm'],
    description: 'Explicitly confirm backlog deletion.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const DELETE_BACKLOG_COMMAND: CommandDefinition<
  DeleteBacklogCommandInput,
  DeleteBacklogCommandOutput
> = {
  name: 'delete-backlog',
  summary: 'Delete the backlog and its utility-owned artifacts.',
  usage: ['backlog-engineer delete-backlog --confirm'],
  options: OPTIONS,
  inputSchema: DeleteBacklogCommandInputSchema,
  outputSchema: DeleteBacklogCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('delete-backlog', args, {
      options: {
        confirm: { type: 'boolean' },
      },
    });
    assertNoPositionals('delete-backlog', parsed.positionals);

    if (parsed.values.confirm !== true) {
      throw createBacklogError({
        code: 'BE_DELETE_CONFIRM_REQUIRED',
        details: {
          command: 'delete-backlog',
        },
        hint: 'Re-run the command with `--confirm` only after explicit operator approval.',
      });
    }

    return parseUsageInput('delete-backlog', DeleteBacklogCommandInputSchema, {
      confirm: true,
    });
  },
  async execute(_input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND', undefined, {
        details: {
          command: 'delete-backlog',
        },
      });
    }

    const marker = await context.artifacts.readRootMarker(context.backlogRoot);
    if (
      marker.tool_name !== TOOL_NAME ||
      marker.schema_version !== SCHEMA_VERSION ||
      marker.layout_version !== LAYOUT_VERSION
    ) {
      throw context.errors.create('BE_ROOT_NOT_FOUND', undefined, {
        details: {
          path: context.backlogRoot,
          tool_name: marker.tool_name,
          schema_version: marker.schema_version,
          layout_version: marker.layout_version,
        },
      });
    }

    const currentWorkingDirectory = process.cwd();
    const relativeToRoot = path.relative(context.backlogRoot, currentWorkingDirectory);
    const runsInsideBacklogRoot =
      relativeToRoot === '' ||
      (relativeToRoot !== '' &&
        !relativeToRoot.startsWith('..') &&
        !path.isAbsolute(relativeToRoot));

    if (runsInsideBacklogRoot) {
      process.chdir(path.dirname(context.backlogRoot));
    }

    try {
      await context.artifacts.deleteBacklog(context.backlogRoot);
    } catch (error) {
      if (runsInsideBacklogRoot) {
        process.chdir(currentWorkingDirectory);
      }
      throw error;
    }

    return {
      deleted_path: '.',
      deleted: true,
    };
  },
};
