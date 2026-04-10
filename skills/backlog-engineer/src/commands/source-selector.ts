import { createUsageError } from '../errors/index.ts';
import type { SourceRecord, SourceRegistryFile, SourceSelectorInput } from '../schemas/index.ts';
import type { CommandExecutionContext } from './types.ts';

export function buildSourceSelectorFromFlags(payload: {
  commandName: string;
  sourceId?: string | undefined;
  sourceLabel?: string | undefined;
  sourcePath?: string | undefined;
}): SourceSelectorInput {
  const selectors = [
    payload.sourceId ? 'source_id' : null,
    payload.sourceLabel ? 'source_label' : null,
    payload.sourcePath ? 'source_path' : null,
  ].filter((value) => value !== null);

  if (selectors.length !== 1) {
    throw createUsageError(
      {
        command: payload.commandName,
        selectors,
      },
      `Use exactly one source selector: --source-id, --source-label, or --source-path. Run \`backlog-engineer help ${payload.commandName}\` to inspect the command contract.`,
    );
  }

  if (payload.sourceId) {
    return {
      kind: 'source_id',
      source_id: payload.sourceId,
    };
  }

  if (payload.sourceLabel) {
    return {
      kind: 'source_label',
      source_label: payload.sourceLabel,
    };
  }

  return {
    kind: 'source_path',
    source_path: payload.sourcePath ?? '',
  };
}

export async function resolveSourceRecord(payload: {
  context: CommandExecutionContext;
  registry: SourceRegistryFile;
  selector: SourceSelectorInput;
}): Promise<SourceRecord> {
  const { context, registry, selector } = payload;
  if (!context.backlogRoot) {
    throw context.errors.create('BE_ROOT_NOT_FOUND');
  }

  if (selector.kind === 'source_id') {
    const source = registry.sources.find((candidate) => candidate.source_id === selector.source_id);
    if (!source) {
      throw context.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_id: selector.source_id,
        },
      });
    }
    return source;
  }

  if (selector.kind === 'source_label') {
    const source = registry.sources.find(
      (candidate) => candidate.source_label === selector.source_label,
    );
    if (!source) {
      throw context.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_label: selector.source_label,
        },
      });
    }
    return source;
  }

  const normalized = await context.sources.resolveCliSourcePath({
    backlogRoot: context.backlogRoot,
    inputPath: context.host.resolveCliPath(selector.source_path),
  });
  const source = registry.sources.find((candidate) => candidate.path === normalized.relative_path);
  if (!source) {
    throw context.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
      details: {
        source_path: selector.source_path,
        normalized_path: normalized.relative_path,
      },
    });
  }

  return source;
}
