import type { ArtifactsModule } from '../artifacts/index.ts';
import type { CoreModule } from '../core/index.ts';
import type { ErrorModule } from '../errors/index.ts';
import type { HookRegistry } from '../hooks/index.ts';
import type { ReportsModule } from '../reports/index.ts';
import type { CliPathInput, SchemaModule, StateFile } from '../schemas/index.ts';
import type { SourcesModule } from '../sources/index.ts';
import type { TemplatesModule } from '../templates/index.ts';
import type { AbsoluteFsPath, BacklogRootPath } from './shared.ts';

export interface CommandHost {
  resolveCliPath(path: CliPathInput): AbsoluteFsPath;
  readCliTextFile(path: CliPathInput): Promise<{
    absolutePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  }>;
  nowIsoUtc(): string;
  createUuid(): string;
}

export interface CommandExecutionContext {
  host: CommandHost;
  backlogRoot?: BacklogRootPath;
  artifacts: ArtifactsModule;
  sources: SourcesModule;
  templates: TemplatesModule;
  reports: ReportsModule;
  schemas: SchemaModule;
  errors: ErrorModule;
  hooks: HookRegistry;
  core: CoreModule;
  ensureQueryState(): Promise<{
    state: StateFile;
    rebuilt: boolean;
  }>;
  ensureMutationState(): Promise<StateFile>;
}
