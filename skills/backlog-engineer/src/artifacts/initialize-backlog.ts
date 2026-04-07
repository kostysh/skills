import type {
  AppliedRegistryFile,
  InitCommandOutput,
  RootMarkerFile,
  SourceRegistryFile,
  StateFile,
} from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import { LAYOUT_VERSION, SCHEMA_VERSION, TOOL_NAME } from '../runtime/tool-metadata.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import {
  GITIGNORE_BASENAME,
  getAgentsPath,
  getGitignorePath,
  getRootMarkerPath,
} from './backlog-layout.ts';

function createInitialRootMarker(createdAt: string): RootMarkerFile {
  return {
    schema_version: SCHEMA_VERSION,
    tool_name: TOOL_NAME,
    created_at: createdAt,
    layout_version: LAYOUT_VERSION,
  };
}

function createInitialSourceRegistry(createdAt: string): SourceRegistryFile {
  return {
    schema_version: SCHEMA_VERSION,
    created_at: createdAt,
    updated_at: createdAt,
    sources: [],
  };
}

function createInitialAppliedRegistry(createdAt: string): AppliedRegistryFile {
  return {
    schema_version: SCHEMA_VERSION,
    created_at: createdAt,
    updated_at: createdAt,
    next_apply_index: 1,
    packets: [],
    patches: [],
  };
}

function createInitialState(createdAt: string): StateFile {
  return {
    schema_version: SCHEMA_VERSION,
    created_at: createdAt,
    updated_at: createdAt,
    last_refresh_at: null,
    context: {
      glossary: [],
      key_strategy: {},
      target_system: [],
      as_built: [],
      claims: [],
      contracts: [],
      data_domains: [],
      quality_attributes: [],
      policy_decisions: [],
    },
    items: [],
    todos: [],
  };
}

async function assertInitTargetAvailable(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<{ existingGitignoreContent?: string }> {
  const markerPath = getRootMarkerPath(dependencies.path, root);
  if (await dependencies.fs.exists(markerPath)) {
    const markerStat = await dependencies.fs.lstat(markerPath);
    if (markerStat.isFile && !markerStat.isSymbolicLink) {
      throw dependencies.errors.create('BE_ROOT_ALREADY_EXISTS', undefined, {
        details: {
          path: root,
          root_marker_path: markerPath,
        },
      });
    }
  }

  if (!(await dependencies.fs.exists(root))) {
    return {};
  }

  const rootStat = await dependencies.fs.lstat(root);
  if (rootStat.isSymbolicLink || !rootStat.isDirectory) {
    throw dependencies.errors.create('BE_ROOT_NOT_EMPTY', undefined, {
      details: {
        path: root,
      },
    });
  }

  const entries = await dependencies.fs.readdir(root);
  if (entries.length === 0) {
    return {};
  }

  if (entries.length === 1 && entries[0] === GITIGNORE_BASENAME) {
    const gitignorePath = getGitignorePath(dependencies.path, root);
    const gitignoreStat = await dependencies.fs.lstat(gitignorePath);
    if (!gitignoreStat.isFile || gitignoreStat.isSymbolicLink) {
      throw dependencies.errors.create('BE_ROOT_NOT_EMPTY', undefined, {
        details: {
          path: root,
          entries,
        },
      });
    }

    return {
      existingGitignoreContent: await dependencies.fs.readText(gitignorePath),
    };
  }

  if (entries.length > 0) {
    throw dependencies.errors.create('BE_ROOT_NOT_EMPTY', undefined, {
      details: {
        path: root,
        entries,
      },
    });
  }

  return {};
}

export async function initializeBacklogRoot(
  dependencies: ArtifactsModuleDependencies & {
    artifacts: NonNullable<ArtifactsModuleDependencies['artifacts']>;
  },
  payload: {
    root: BacklogRootPath;
    createdAt: string;
    agentsContent: string;
  },
): Promise<InitCommandOutput> {
  const initTarget = await assertInitTargetAvailable(dependencies, payload.root);

  const marker = dependencies.schemas.parseRootMarker(createInitialRootMarker(payload.createdAt));
  const sourceRegistry = dependencies.schemas.parseSourceRegistry(
    createInitialSourceRegistry(payload.createdAt),
  );
  const appliedRegistry = dependencies.schemas.parseAppliedRegistry(
    createInitialAppliedRegistry(payload.createdAt),
  );
  const state = dependencies.schemas.parseStateFile(createInitialState(payload.createdAt));

  await dependencies.artifacts.writeInitialArtifacts({
    root: payload.root,
    marker,
    agentsContent: payload.agentsContent,
    ...(initTarget.existingGitignoreContent !== undefined
      ? { existingGitignoreContent: initTarget.existingGitignoreContent }
      : {}),
    sourceRegistry,
    appliedRegistry,
    state,
  });

  return dependencies.schemas.parseCommandOutput('init', {
    path: dependencies.path.resolve(payload.root),
    root_marker_path: getRootMarkerPath(dependencies.path, payload.root),
    agents_path: getAgentsPath(dependencies.path, payload.root),
  });
}
