import type { CommandExecutionContext } from './types.ts';
import type { SourceRegistryFile, StateFile } from '../schemas/index.ts';

export function assertBacklogRoot(context: CommandExecutionContext): string {
  const backlogRoot = context.backlogRoot;
  if (!backlogRoot) {
    throw context.errors.create('BE_ROOT_NOT_FOUND');
  }

  return backlogRoot;
}

export async function loadQueryState(context: CommandExecutionContext): Promise<StateFile> {
  const { state } = await context.ensureQueryState();
  return state;
}

export async function loadQueryStateWithRegistry(context: CommandExecutionContext): Promise<{
  state: StateFile;
  registry: SourceRegistryFile;
}> {
  const backlogRoot = assertBacklogRoot(context);
  const [{ state }, registry] = await Promise.all([
    context.ensureQueryState(),
    context.artifacts.readSourceRegistry(backlogRoot),
  ]);

  return {
    state,
    registry,
  };
}
