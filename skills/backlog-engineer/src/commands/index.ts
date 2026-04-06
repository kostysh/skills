import { definePlaceholderCommand } from './placeholder.js';
import { ATTENTION_COMMAND } from './attention.js';
import { DELETE_BACKLOG_COMMAND } from './delete-backlog.js';
import { GAPS_COMMAND } from './gaps.js';
import { INIT_COMMAND } from './init.js';
import { ITEMS_COMMAND } from './items.js';
import { LIST_SOURCES_COMMAND } from './list-sources.js';
import { PACKET_COMMAND } from './packet.js';
import { PATCH_ITEM_COMMAND } from './patch-item.js';
import { QUEUE_COMMAND } from './queue.js';
import { REFRESH_COMMAND } from './refresh.js';
import { REGISTER_SOURCE_COMMAND } from './register-source.js';
import { REMOVE_ITEM_COMMAND } from './remove-item.js';
import { REPORT_COMMAND } from './report.js';
import { SEARCH_COMMAND } from './search.js';
import { STATUS_COMMAND } from './status.js';
import { TEMPLATE_COMMAND } from './template.js';
import type { CliIo, CommandDefinition } from './types.js';
import { EXIT_NOT_IMPLEMENTED, EXIT_SUCCESS, EXIT_USAGE } from '../errors/index.js';

export {
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
  definePlaceholderCommand,
  EXIT_NOT_IMPLEMENTED,
  EXIT_SUCCESS,
  EXIT_USAGE,
  type CliIo,
  type CommandDefinition,
};

export async function executeCommand(
  command: CommandDefinition,
  args: string[],
  io: CliIo,
): Promise<number> {
  return await command.execute(args, io);
}
