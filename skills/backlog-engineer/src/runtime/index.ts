export { ROOT_MARKER_BASENAME } from '../artifacts/index.ts';
export { createRuntime } from './create-runtime.ts';
export {
  createNodeClockPort,
  createNodeFileSystemPort,
  createNodeHashPort,
  createNodePathPort,
  createNodeProcessIoPort,
  createNodeRuntimeDependencies,
  createNodeUuidPort,
  type ClockPort,
  type FileSystemPort,
  type HashPort,
  type PathPort,
  type ProcessIoPort,
  type RuntimeDependencies,
  type UuidPort,
} from './ports.ts';
export {
  findBacklogRoot,
  resolveCommandBacklogRoot,
} from './root-discovery.ts';
export {
  createUnconfiguredStateCoordinator,
  type RuntimeModuleBag,
  type RuntimeStateCoordinator,
  type RuntimeStateCoordinatorPayload,
} from './state-recovery.ts';
export type { CommandExecutionContext } from './command-context.ts';
export {
  COMMAND_NAMES,
  type AbsoluteFsPath,
  type BacklogRootPath,
  type CommandName,
} from './shared.ts';

export interface RuntimeModule {
  createContext(
    command: import('./shared.ts').CommandName,
    cwd: import('./shared.ts').AbsoluteFsPath,
  ): Promise<import('./command-context.ts').CommandExecutionContext>;
  rebuildState(
    root: import('./shared.ts').BacklogRootPath,
  ): Promise<import('../schemas/index.ts').StateFile>;
}
