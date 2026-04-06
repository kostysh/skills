import type { ArtifactsModule } from '../artifacts/index.ts';
import type { CoreModule } from '../core/index.ts';
import type { ErrorModule } from '../errors/index.ts';
import type { ReportsModule } from '../reports/index.ts';
import type { SchemaModule } from '../schemas/index.ts';
import type { SourcesModule } from '../sources/index.ts';
import type { TemplatesModule } from '../templates/index.ts';
import type { RuntimeDependencies } from './ports.ts';
import type { BacklogRootPath } from './shared.ts';
import type { HookRegistry } from '../hooks/index.ts';
import type { StateFile } from '../schemas/index.ts';
import {
  areStatesEquivalent,
  rebuildStateFromCanonicalArtifacts,
  updateRebuiltStateTimestamp,
} from './rebuild-state.ts';

export interface RuntimeModuleBag {
  artifacts: ArtifactsModule;
  sources: SourcesModule;
  templates: TemplatesModule;
  reports: ReportsModule;
  schemas: SchemaModule;
  errors: ErrorModule;
  hooks: HookRegistry;
  core: CoreModule;
}

export interface RuntimeStateCoordinatorPayload {
  backlogRoot: BacklogRootPath;
  dependencies: RuntimeDependencies;
  modules: RuntimeModuleBag;
}

export interface RuntimeStateCoordinator {
  ensureQueryState(
    payload: RuntimeStateCoordinatorPayload,
  ): Promise<{ state: StateFile; rebuilt: boolean }>;
  ensureMutationState(payload: RuntimeStateCoordinatorPayload): Promise<StateFile>;
  rebuildState(payload: RuntimeStateCoordinatorPayload): Promise<StateFile>;
}

export function createFileBackedStateCoordinator(): RuntimeStateCoordinator {
  return {
    async ensureQueryState(payload) {
      let currentState: StateFile | undefined;
      const updatedAt = payload.dependencies.clock.nowIsoUtc();
      try {
        currentState = await payload.modules.artifacts.readState(payload.backlogRoot);
      } catch (error) {
        if (
          !payload.modules.errors.isBacklogError(error) ||
          error.code !== 'BE_INTERNAL_STATE_CORRUPT'
        ) {
          throw error;
        }
      }

      const rebuiltState = await rebuildStateFromCanonicalArtifacts({
        backlogRoot: payload.backlogRoot,
        dependencies: payload.dependencies,
        artifacts: payload.modules.artifacts,
        schemas: payload.modules.schemas,
        errors: payload.modules.errors,
        ...(currentState ? { currentState } : {}),
      });

      if (currentState && areStatesEquivalent(currentState, rebuiltState)) {
        return {
          state: currentState,
          rebuilt: false,
        };
      }

      const stateToPersist = currentState
        ? updateRebuiltStateTimestamp({
            state: rebuiltState,
            schemas: payload.modules.schemas,
            updatedAt,
          })
        : rebuiltState;

      await payload.modules.artifacts.writeState(payload.backlogRoot, stateToPersist);

      return {
        state: stateToPersist,
        rebuilt: true,
      };
    },
    ensureMutationState(payload) {
      return payload.modules.artifacts.readState(payload.backlogRoot);
    },
    rebuildState(payload) {
      return rebuildStateFromCanonicalArtifacts({
        backlogRoot: payload.backlogRoot,
        dependencies: payload.dependencies,
        artifacts: payload.modules.artifacts,
        schemas: payload.modules.schemas,
        errors: payload.modules.errors,
      });
    },
  };
}

export function createUnconfiguredStateCoordinator(
  errorModule: ErrorModule,
): RuntimeStateCoordinator {
  const createUnconfiguredError = (operation: string) =>
    errorModule.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        operation,
      },
      hint: 'Continue with the runtime/artifacts implementation work packages before invoking state-dependent command semantics.',
    });

  return {
    ensureQueryState() {
      return Promise.reject(createUnconfiguredError('ensureQueryState'));
    },
    ensureMutationState() {
      return Promise.reject(createUnconfiguredError('ensureMutationState'));
    },
    rebuildState() {
      return Promise.reject(createUnconfiguredError('rebuildState'));
    },
  };
}
