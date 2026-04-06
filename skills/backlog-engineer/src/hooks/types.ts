import type {
  PacketCommandOutput,
  PatchItemCommandOutput,
  RefreshCommandOutput,
  RemoveItemCommandOutput,
  SourceRecord,
  StateFile,
} from '../schemas/index.ts';
import type { ReportSection } from '../reports/index.ts';
import type { BacklogRootPath, CommandName } from '../runtime/shared.ts';

export interface HookRegistry {
  beforeCommand?(payload: {
    command: CommandName;
    input: unknown;
    backlogRoot?: BacklogRootPath;
  }): Promise<void>;
  afterCommand?(payload: {
    command: CommandName;
    output: unknown;
    backlogRoot?: BacklogRootPath;
  }): Promise<void>;
  afterSourceRegistered?(payload: {
    source: SourceRecord;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterPacketApplied?(payload: {
    summary: PacketCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterPatchApplied?(payload: {
    summary: PatchItemCommandOutput | RemoveItemCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterRefresh?(payload: {
    summary: RefreshCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  buildSystemSummary?(payload: {
    context: StateFile['context'];
    items: StateFile['items'];
  }): Promise<string[]>;
  decorateReportSections?(payload: { sections: ReportSection[] }): Promise<ReportSection[]>;
}

export interface HooksModule {
  createNoOpRegistry(): HookRegistry;
}
