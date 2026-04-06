import { createErrorModule, type ErrorModule } from '../errors/index.ts';
import { createSchemaModule, type SchemaModule } from '../schemas/index.ts';
import type { ArtifactsModule } from '../artifacts/index.ts';
import type { CoreModule } from '../core/index.ts';
import type { ReportsModule } from '../reports/index.ts';
import type { SourcesModule } from '../sources/index.ts';
import type { TemplatesModule } from '../templates/index.ts';
import type { RuntimeModule } from './index.ts';
import type { CommandExecutionContext } from './command-context.ts';
import { createNodeRuntimeDependencies, type RuntimeDependencies } from './ports.ts';
import { resolveCommandBacklogRoot, ROOT_MARKER_BASENAME } from './root-discovery.ts';
import {
  createUnconfiguredStateCoordinator,
  type RuntimeModuleBag,
  type RuntimeStateCoordinator,
} from './state-recovery.ts';
import type { AbsoluteFsPath, CommandName } from './shared.ts';

type CreateRuntimeOptions = {
  dependencies?: Partial<RuntimeDependencies>;
  modules?: Partial<{
    artifacts: ArtifactsModule;
    sources: SourcesModule;
    templates: TemplatesModule;
    reports: ReportsModule;
    schemas: SchemaModule;
    errors: ErrorModule;
    core: CoreModule;
  }>;
  stateCoordinator?: RuntimeStateCoordinator;
};

function createUnavailableModuleProxy<T extends object>(
  moduleName: string,
  errorModule: ErrorModule,
): T {
  return new Proxy(
    {},
    {
      get(_target, propertyKey) {
        return () => {
          throw errorModule.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
            details: {
              module: moduleName,
              property: String(propertyKey),
            },
            hint: 'Continue with the next implementation work package to install the concrete module implementation.',
          });
        };
      },
    },
  ) as T;
}

function buildRuntimeModules(
  dependencies: RuntimeDependencies,
  overrides: CreateRuntimeOptions['modules'] = {},
): RuntimeModuleBag {
  const errors = overrides?.errors ?? createErrorModule();

  return {
    artifacts:
      overrides?.artifacts ?? createUnavailableModuleProxy<ArtifactsModule>('artifacts', errors),
    sources: overrides?.sources ?? createUnavailableModuleProxy<SourcesModule>('sources', errors),
    templates:
      overrides?.templates ?? createUnavailableModuleProxy<TemplatesModule>('templates', errors),
    reports: overrides?.reports ?? createUnavailableModuleProxy<ReportsModule>('reports', errors),
    schemas: overrides?.schemas ?? createSchemaModule(),
    errors,
    hooks: dependencies.hooks,
    core: overrides?.core ?? createUnavailableModuleProxy<CoreModule>('core', errors),
  };
}

export function createRuntime(options: CreateRuntimeOptions = {}): RuntimeModule {
  const dependencies = createNodeRuntimeDependencies(options.dependencies);
  const modules = buildRuntimeModules(dependencies, options.modules);
  const stateCoordinator =
    options.stateCoordinator ?? createUnconfiguredStateCoordinator(modules.errors);

  return {
    async createContext(
      command: CommandName,
      cwd: AbsoluteFsPath,
    ): Promise<CommandExecutionContext> {
      const backlogRoot = await resolveCommandBacklogRoot({
        command,
        cwd,
        fs: dependencies.fs,
        path: dependencies.path,
      });

      if (!backlogRoot && command !== 'init') {
        throw modules.errors.create('BE_ROOT_NOT_FOUND', undefined, {
          details: {
            command,
            cwd: dependencies.path.resolve(cwd),
            root_marker: ROOT_MARKER_BASENAME,
          },
          hint: 'Run `backlog-engineer init --path <path>` inside a new backlog root or execute the command from an existing backlog directory.',
        });
      }

      const coordinatorPayload =
        backlogRoot === undefined
          ? undefined
          : {
              backlogRoot,
              dependencies,
              modules,
            };

      return {
        ...(backlogRoot ? { backlogRoot } : {}),
        artifacts: modules.artifacts,
        sources: modules.sources,
        templates: modules.templates,
        reports: modules.reports,
        schemas: modules.schemas,
        errors: modules.errors,
        hooks: modules.hooks,
        core: modules.core,
        async ensureQueryState() {
          if (!coordinatorPayload) {
            throw modules.errors.create('BE_ROOT_NOT_FOUND', undefined, {
              details: {
                command,
              },
            });
          }

          return stateCoordinator.ensureQueryState(coordinatorPayload);
        },
        async ensureMutationState() {
          if (!coordinatorPayload) {
            throw modules.errors.create('BE_ROOT_NOT_FOUND', undefined, {
              details: {
                command,
              },
            });
          }

          return stateCoordinator.ensureMutationState(coordinatorPayload);
        },
      };
    },
    async rebuildState(root) {
      return stateCoordinator.rebuildState({
        backlogRoot: root,
        dependencies,
        modules,
      });
    },
  };
}
