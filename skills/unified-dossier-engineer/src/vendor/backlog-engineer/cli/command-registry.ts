import {
  ATTENTION_COMMAND,
  DELETE_BACKLOG_COMMAND,
  GAPS_COMMAND,
  INIT_COMMAND,
  ITEMS_COMMAND,
  LIST_SOURCES_COMMAND,
  PACKET_COMMAND,
  PATCH_ITEM_COMMAND,
  QUEUE_COMMAND,
  REFRESH_COMMAND,
  REGISTER_SOURCE_COMMAND,
  REMOVE_ITEM_COMMAND,
  REMOVE_SOURCE_COMMAND,
  REPORT_COMMAND,
  SEARCH_COMMAND,
  STATUS_COMMAND,
  TEMPLATE_COMMAND,
  UPDATE_SOURCE_PATH_COMMAND,
} from '../commands/index.ts';
import type { AnyCommandDefinition } from '../commands/types.ts';
import {
  CommandHelpOutputSchema,
  GlobalHelpOutputSchema,
  VersionOutputSchema,
  type CommandHelpOutput,
  type GlobalHelpOutput,
  type VersionOutput,
} from '../schemas/index.ts';

export const CLI_DISPLAY_NAME = 'dossier-engineer';

const TYPED_COMMANDS = [
  INIT_COMMAND,
  REGISTER_SOURCE_COMMAND,
  LIST_SOURCES_COMMAND,
  UPDATE_SOURCE_PATH_COMMAND,
  REMOVE_SOURCE_COMMAND,
  TEMPLATE_COMMAND,
  PACKET_COMMAND,
  PATCH_ITEM_COMMAND,
  REMOVE_ITEM_COMMAND,
  REFRESH_COMMAND,
  STATUS_COMMAND,
  REPORT_COMMAND,
  ITEMS_COMMAND,
  SEARCH_COMMAND,
  GAPS_COMMAND,
  QUEUE_COMMAND,
  ATTENTION_COMMAND,
  DELETE_BACKLOG_COMMAND,
] as const;

export const COMMANDS = TYPED_COMMANDS as readonly AnyCommandDefinition[];

const COMMAND_MAP = new Map<string, AnyCommandDefinition>(
  COMMANDS.map((command) => [command.name, command]),
);

export function findCommand(name: string): AnyCommandDefinition | undefined {
  return COMMAND_MAP.get(name);
}

export function buildGlobalHelpOutput(version: string): GlobalHelpOutput {
  return GlobalHelpOutputSchema.parse({
    cli_name: CLI_DISPLAY_NAME,
    version,
    usage: [
      `${CLI_DISPLAY_NAME} <command> [options]`,
      `${CLI_DISPLAY_NAME} help [command]`,
      `${CLI_DISPLAY_NAME} --help`,
      `${CLI_DISPLAY_NAME} --version`,
    ],
    commands: COMMANDS.map((command) => ({
      name: command.name,
      summary: command.summary,
    })),
    notes: [
      'Most commands are backlog-scoped and auto-discover `.dossier/manifest.json` from the current working directory or its parent directories.',
      'For one backlog root, run mutating commands strictly one at a time.',
      'Help shows strictly validated values and command semantics that change the mental model; use the reference docs for full field-level contracts.',
    ],
  });
}

export function buildCommandHelpOutput(
  command: AnyCommandDefinition,
  version: string,
): CommandHelpOutput {
  return CommandHelpOutputSchema.parse({
    cli_name: CLI_DISPLAY_NAME,
    version,
    command: command.name,
    summary: command.summary,
    usage: [...command.usage],
    options: [...command.options],
    validations: [...(command.validations ?? [])],
    notes: [...(command.notes ?? [])],
  });
}

export function buildVersionOutput(version: string): VersionOutput {
  return VersionOutputSchema.parse({
    cli_name: CLI_DISPLAY_NAME,
    version,
  });
}
