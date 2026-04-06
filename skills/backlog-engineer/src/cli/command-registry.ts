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
  REPORT_COMMAND,
  SEARCH_COMMAND,
  STATUS_COMMAND,
  TEMPLATE_COMMAND,
  type CommandDefinition,
} from '../commands/index.js';

export const CLI_DISPLAY_NAME = 'backlog-engineer';

export const COMMANDS = [
  INIT_COMMAND,
  REGISTER_SOURCE_COMMAND,
  LIST_SOURCES_COMMAND,
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
] as const satisfies readonly CommandDefinition[];

const COMMAND_MAP = new Map(COMMANDS.map((command) => [command.name, command]));

export function findCommand(name: string): CommandDefinition | undefined {
  return COMMAND_MAP.get(name);
}

export function globalHelp(): string {
  const lines = [
    `${CLI_DISPLAY_NAME}`,
    '',
    'Scaffolded CLI for the backlog-engineer skill.',
    'The command surface exists, but command behavior is still to be implemented.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} <command> [options]`,
    `  ${CLI_DISPLAY_NAME} help [command]`,
    `  ${CLI_DISPLAY_NAME} --version`,
    '',
    'Commands:',
  ];

  for (const command of COMMANDS) {
    lines.push(`  ${command.name.padEnd(16)} ${command.summary}`);
  }

  return lines.join('\n');
}
