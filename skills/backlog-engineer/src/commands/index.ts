import { definePlaceholderCommand } from './placeholder.ts';
import { ATTENTION_COMMAND } from './attention.ts';
import { DELETE_BACKLOG_COMMAND } from './delete-backlog.ts';
import { GAPS_COMMAND } from './gaps.ts';
import { INIT_COMMAND } from './init.ts';
import { ITEMS_COMMAND } from './items.ts';
import { LIST_SOURCES_COMMAND } from './list-sources.ts';
import { PACKET_COMMAND } from './packet.ts';
import { PATCH_ITEM_COMMAND } from './patch-item.ts';
import { QUEUE_COMMAND } from './queue.ts';
import { REFRESH_COMMAND } from './refresh.ts';
import { REGISTER_SOURCE_COMMAND } from './register-source.ts';
import { REMOVE_ITEM_COMMAND } from './remove-item.ts';
import { REPORT_COMMAND } from './report.ts';
import { SEARCH_COMMAND } from './search.ts';
import { STATUS_COMMAND } from './status.ts';
import { TEMPLATE_COMMAND } from './template.ts';
import type { CliIo, CommandDefinition } from './types.ts';
import { EXIT_NOT_IMPLEMENTED, EXIT_SUCCESS, EXIT_USAGE } from '../errors/index.ts';

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
