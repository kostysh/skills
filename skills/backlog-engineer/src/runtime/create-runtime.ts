import { createErrorModule, type ErrorModule } from '../errors/index.ts';
import { createSchemaModule, type SchemaModule } from '../schemas/index.ts';
import {
  ROOT_MARKER_BASENAME,
  createArtifactsModule,
  type ArtifactsModule,
} from '../artifacts/index.ts';
import { ensureNoSymlinkAncestors } from '../artifacts/store-helpers.ts';
import { createCoreModule, type CoreModule } from '../core/index.ts';
import { createReportsModule, type ReportsModule } from '../reports/index.ts';
import { createSourcesModule, type SourcesModule } from '../sources/index.ts';
import { createTemplatesModule, type TemplatesModule } from '../templates/index.ts';
import type { RuntimeModule } from './index.ts';
import type { CommandExecutionContext } from './command-context.ts';
import { createNodeRuntimeDependencies, type RuntimeDependencies } from './ports.ts';
import { resolveCommandBacklogRoot } from './root-discovery.ts';
import {
  createFileBackedStateCoordinator,
  type RuntimeModuleBag,
  type RuntimeStateCoordinator,
} from './state-recovery.ts';
import type { AbsoluteFsPath, CommandName } from './shared.ts';
import { acquireMutationLock } from './mutation-lock.ts';

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

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function buildRuntimeModules(
  dependencies: RuntimeDependencies,
  overrides: CreateRuntimeOptions['modules'] = {},
): RuntimeModuleBag {
  const errors = overrides?.errors ?? createErrorModule();
  const schemas = overrides?.schemas ?? createSchemaModule();
  const core =
    overrides?.core ??
    createCoreModule({
      errors,
      schemas,
      clock: dependencies.clock,
      uuid: dependencies.uuid,
    });

  return {
    artifacts:
      overrides?.artifacts ??
      createArtifactsModule({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        schemas,
        errors,
      }),
    sources:
      overrides?.sources ??
      createSourcesModule({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        clock: dependencies.clock,
        schemas,
        errors,
      }),
    templates: overrides?.templates ?? createTemplatesModule(),
    reports:
      overrides?.reports ??
      createReportsModule({
        items: core.items,
        attention: core.attention,
        queue: core.queue,
        hooks: dependencies.hooks,
      }),
    schemas,
    errors,
    hooks: dependencies.hooks,
    core,
  };
}

export function createRuntime(options: CreateRuntimeOptions = {}): RuntimeModule {
  const dependencies = createNodeRuntimeDependencies(options.dependencies);
  const modules = buildRuntimeModules(dependencies, options.modules);
  const stateCoordinator = options.stateCoordinator ?? createFileBackedStateCoordinator();

  return {
    getProcessCwd() {
      return dependencies.fs.cwd();
    },
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
        host: {
          resolveCliPath(inputPath) {
            return dependencies.path.resolve(cwd, inputPath);
          },
          async readCliTextFile(inputPath) {
            const absolutePath = dependencies.path.resolve(cwd, inputPath);

            try {
              await ensureNoSymlinkAncestors({
                fs: dependencies.fs,
                path: dependencies.path,
                errors: modules.errors,
                targetPath: absolutePath,
                errorCode: 'BE_INPUT_FILE_NOT_FOUND',
              });
            } catch (error) {
              if (modules.errors.isBacklogError(error)) {
                throw error;
              }

              throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                details: {
                  path: absolutePath,
                },
                cause: error,
              });
            }

            let entry: Awaited<ReturnType<typeof dependencies.fs.lstat>>;
            try {
              entry = await dependencies.fs.lstat(absolutePath);
            } catch (error) {
              if (isErrnoException(error) && error.code === 'ENOENT') {
                throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                  details: {
                    path: absolutePath,
                  },
                  cause: error,
                });
              }
              if (isErrnoException(error) && error.code === 'ENOTSUP') {
                throw modules.errors.create('BE_PLATFORM_UNSUPPORTED', undefined, {
                  details: {
                    path: absolutePath,
                  },
                  cause: error,
                });
              }

              throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                details: {
                  path: absolutePath,
                  reason: 'lstat_failed',
                },
                cause: error,
              });
            }

            if (entry.isSymbolicLink) {
              throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                details: {
                  path: absolutePath,
                  reason: 'symbolic_link',
                },
              });
            }

            if (!entry.isFile) {
              throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                details: {
                  path: absolutePath,
                  reason: 'not_regular_file',
                },
              });
            }

            try {
              const parentDirectory = await dependencies.fs.openDirectory(
                dependencies.path.dirname(absolutePath),
              );
              try {
                return {
                  absolutePath,
                  canonicalBasename: dependencies.path.basename(absolutePath),
                  rawContent: await dependencies.fs.readTextNoFollow(
                    parentDirectory.resolveEntry(dependencies.path.basename(absolutePath)),
                  ),
                };
              } finally {
                await parentDirectory.close();
              }
            } catch (error) {
              if (isErrnoException(error) && error.code === 'ENOENT') {
                throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                  details: {
                    path: absolutePath,
                  },
                  cause: error,
                });
              }
              if (isErrnoException(error) && error.code === 'ENOTSUP') {
                throw modules.errors.create('BE_PLATFORM_UNSUPPORTED', undefined, {
                  details: {
                    path: absolutePath,
                  },
                  cause: error,
                });
              }

              throw modules.errors.create('BE_INPUT_FILE_NOT_FOUND', undefined, {
                details: {
                  path: absolutePath,
                  reason: 'read_failed',
                },
                cause: error,
              });
            }
          },
          getProcessCwd() {
            return dependencies.fs.cwd();
          },
          chdir(targetPath) {
            dependencies.fs.chdir(targetPath);
          },
          nowIsoUtc() {
            return dependencies.clock.nowIsoUtc();
          },
          createUuid() {
            return dependencies.uuid.create();
          },
        },
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
        async acquireMutationLock(lockCommand) {
          if (!backlogRoot) {
            throw modules.errors.create('BE_ROOT_NOT_FOUND', undefined, {
              details: {
                command: lockCommand,
              },
            });
          }

          return acquireMutationLock({
            fs: dependencies.fs,
            path: dependencies.path,
            errors: modules.errors,
            backlogRoot,
            command: lockCommand,
            cwd,
            acquiredAt: dependencies.clock.nowIsoUtc(),
          });
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
