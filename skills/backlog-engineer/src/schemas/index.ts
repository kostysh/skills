import type { z } from 'zod';

import {
  RootMarkerFileSchema,
  SourceRegistryFileSchema,
  AppliedRegistryFileSchema,
  StateFileSchema,
  type RootMarkerFile,
  type SourceRegistryFile,
  type AppliedRegistryFile,
  type StateFile,
} from './artifacts.ts';
import {
  AttentionCommandInputSchema,
  AttentionCommandOutputSchema,
  DeleteBacklogCommandInputSchema,
  DeleteBacklogCommandOutputSchema,
  GapsCommandInputSchema,
  GapsCommandOutputSchema,
  InitCommandInputSchema,
  InitCommandOutputSchema,
  ItemsCommandInputSchema,
  ItemsCommandOutputSchema,
  ListSourcesCommandInputSchema,
  ListSourcesCommandOutputSchema,
  RemoveSourceCommandInputSchema,
  RemoveSourceCommandOutputSchema,
  PacketCommandInputSchema,
  PacketCommandOutputSchema,
  PatchItemCommandInputSchema,
  PatchItemCommandOutputSchema,
  QueueCommandInputSchema,
  QueueCommandOutputSchema,
  RefreshCommandInputSchema,
  RefreshCommandOutputSchema,
  RegisterSourceCommandInputSchema,
  RegisterSourceCommandOutputSchema,
  UpdateSourcePathCommandInputSchema,
  UpdateSourcePathCommandOutputSchema,
  RemoveItemCommandInputSchema,
  RemoveItemCommandOutputSchema,
  ReportCommandInputSchema,
  ReportCommandOutputSchema,
  SearchCommandInputSchema,
  SearchCommandOutputSchema,
  StatusCommandInputSchema,
  StatusCommandOutputSchema,
  TemplateCommandInputSchema,
  TemplateCommandOutputSchema,
  type AttentionCommandInput,
  type AttentionCommandOutput,
  type DeleteBacklogCommandInput,
  type DeleteBacklogCommandOutput,
  type GapsCommandInput,
  type GapsCommandOutput,
  type InitCommandInput,
  type InitCommandOutput,
  type ItemsCommandInput,
  type ItemsCommandOutput,
  type ListSourcesCommandInput,
  type ListSourcesCommandOutput,
  type RemoveSourceCommandInput,
  type RemoveSourceCommandOutput,
  type PacketCommandInput,
  type PacketCommandOutput,
  type PatchItemCommandInput,
  type PatchItemCommandOutput,
  type QueueCommandInput,
  type QueueCommandOutput,
  type RefreshCommandInput,
  type RefreshCommandOutput,
  type RegisterSourceCommandInput,
  type RegisterSourceCommandOutput,
  type UpdateSourcePathCommandInput,
  type UpdateSourcePathCommandOutput,
  type RemoveItemCommandInput,
  type RemoveItemCommandOutput,
  type ReportCommandInput,
  type ReportCommandOutput,
  type SearchCommandInput,
  type SearchCommandOutput,
  type StatusCommandInput,
  type StatusCommandOutput,
  type TemplateCommandInput,
  type TemplateCommandOutput,
} from './commands.ts';
import { ErrorPayloadSchema, type ErrorPayload } from './errors.ts';
import { PacketFileSchema, type PacketFile } from './packet.ts';
import { PatchFileSchema, type PatchFile } from './patch.ts';
import type { CommandName } from '../runtime/shared.ts';

type SchemaFor<T> = z.ZodType<T>;

export type CommandInputByName = {
  init: InitCommandInput;
  'register-source': RegisterSourceCommandInput;
  'list-sources': ListSourcesCommandInput;
  'update-source-path': UpdateSourcePathCommandInput;
  'remove-source': RemoveSourceCommandInput;
  template: TemplateCommandInput;
  packet: PacketCommandInput;
  'patch-item': PatchItemCommandInput;
  'remove-item': RemoveItemCommandInput;
  refresh: RefreshCommandInput;
  status: StatusCommandInput;
  report: ReportCommandInput;
  items: ItemsCommandInput;
  search: SearchCommandInput;
  gaps: GapsCommandInput;
  queue: QueueCommandInput;
  attention: AttentionCommandInput;
  'delete-backlog': DeleteBacklogCommandInput;
};

export type CommandOutputByName = {
  init: InitCommandOutput;
  'register-source': RegisterSourceCommandOutput;
  'list-sources': ListSourcesCommandOutput;
  'update-source-path': UpdateSourcePathCommandOutput;
  'remove-source': RemoveSourceCommandOutput;
  template: TemplateCommandOutput;
  packet: PacketCommandOutput;
  'patch-item': PatchItemCommandOutput;
  'remove-item': RemoveItemCommandOutput;
  refresh: RefreshCommandOutput;
  status: StatusCommandOutput;
  report: ReportCommandOutput;
  items: ItemsCommandOutput;
  search: SearchCommandOutput;
  gaps: GapsCommandOutput;
  queue: QueueCommandOutput;
  attention: AttentionCommandOutput;
  'delete-backlog': DeleteBacklogCommandOutput;
};

export interface SchemaModule {
  parseRootMarker(raw: unknown): RootMarkerFile;
  parseSourceRegistry(raw: unknown): SourceRegistryFile;
  parseAppliedRegistry(raw: unknown): AppliedRegistryFile;
  parseStateFile(raw: unknown): StateFile;
  parsePacketFile(raw: unknown): PacketFile;
  parsePatchFile(raw: unknown): PatchFile;
  parseCommandInput<TName extends CommandName>(
    name: TName,
    raw: unknown,
  ): CommandInputByName[TName];
  parseCommandOutput<TName extends CommandName>(
    name: TName,
    raw: unknown,
  ): CommandOutputByName[TName];
  parseErrorPayload(raw: unknown): ErrorPayload;
}

const commandInputSchemas: {
  [TName in CommandName]: SchemaFor<CommandInputByName[TName]>;
} = {
  init: InitCommandInputSchema,
  'register-source': RegisterSourceCommandInputSchema,
  'list-sources': ListSourcesCommandInputSchema,
  'update-source-path': UpdateSourcePathCommandInputSchema,
  'remove-source': RemoveSourceCommandInputSchema,
  template: TemplateCommandInputSchema,
  packet: PacketCommandInputSchema,
  'patch-item': PatchItemCommandInputSchema,
  'remove-item': RemoveItemCommandInputSchema,
  refresh: RefreshCommandInputSchema,
  status: StatusCommandInputSchema,
  report: ReportCommandInputSchema,
  items: ItemsCommandInputSchema,
  search: SearchCommandInputSchema,
  gaps: GapsCommandInputSchema,
  queue: QueueCommandInputSchema,
  attention: AttentionCommandInputSchema,
  'delete-backlog': DeleteBacklogCommandInputSchema,
};

const commandOutputSchemas: {
  [TName in CommandName]: SchemaFor<CommandOutputByName[TName]>;
} = {
  init: InitCommandOutputSchema,
  'register-source': RegisterSourceCommandOutputSchema,
  'list-sources': ListSourcesCommandOutputSchema,
  'update-source-path': UpdateSourcePathCommandOutputSchema,
  'remove-source': RemoveSourceCommandOutputSchema,
  template: TemplateCommandOutputSchema,
  packet: PacketCommandOutputSchema,
  'patch-item': PatchItemCommandOutputSchema,
  'remove-item': RemoveItemCommandOutputSchema,
  refresh: RefreshCommandOutputSchema,
  status: StatusCommandOutputSchema,
  report: ReportCommandOutputSchema,
  items: ItemsCommandOutputSchema,
  search: SearchCommandOutputSchema,
  gaps: GapsCommandOutputSchema,
  queue: QueueCommandOutputSchema,
  attention: AttentionCommandOutputSchema,
  'delete-backlog': DeleteBacklogCommandOutputSchema,
};

export function createSchemaModule(): SchemaModule {
  return {
    parseRootMarker(raw) {
      return RootMarkerFileSchema.parse(raw);
    },
    parseSourceRegistry(raw) {
      return SourceRegistryFileSchema.parse(raw);
    },
    parseAppliedRegistry(raw) {
      return AppliedRegistryFileSchema.parse(raw);
    },
    parseStateFile(raw) {
      return StateFileSchema.parse(raw);
    },
    parsePacketFile(raw) {
      return PacketFileSchema.parse(raw);
    },
    parsePatchFile(raw) {
      return PatchFileSchema.parse(raw);
    },
    parseCommandInput(name, raw) {
      return commandInputSchemas[name].parse(raw) as CommandInputByName[typeof name];
    },
    parseCommandOutput(name, raw) {
      return commandOutputSchemas[name].parse(raw) as CommandOutputByName[typeof name];
    },
    parseErrorPayload(raw) {
      return ErrorPayloadSchema.parse(raw);
    },
  };
}

export * from './artifacts.ts';
export * from './cli.ts';
export * from './commands.ts';
export * from './errors.ts';
export * from './packet.ts';
export * from './patch.ts';
export * from './scalars.ts';
