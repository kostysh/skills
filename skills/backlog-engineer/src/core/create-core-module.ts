import type { ErrorModule } from '../errors/index.ts';
import type { ClockPort, UuidPort } from '../runtime/ports.ts';
import type { SchemaModule } from '../schemas/index.ts';
import { createContextService } from './context-service.ts';
import { createDerivedStateService } from './derived-state-service.ts';
import { createGraphService } from './graph-service.ts';
import { createMutationService } from './mutation-service.ts';
import { createTodoService } from './todo-service.ts';
import type {
  AttentionService,
  CoreModule,
  ItemsService,
  QueueService,
  SearchService,
} from './types.ts';

function createUnavailableQueryService<T extends object>(
  serviceName: string,
  errors: ErrorModule,
): T {
  return new Proxy(
    {},
    {
      get(_target, propertyKey) {
        return () => {
          throw errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
            details: {
              module: 'core',
              service: serviceName,
              property: String(propertyKey),
            },
            hint: 'Continue with the read-model work packages before invoking query services.',
          });
        };
      },
    },
  ) as T;
}

export function createCoreModule(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
  clock: ClockPort;
  uuid: UuidPort;
}): CoreModule {
  const graph = createGraphService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const context = createContextService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const todo = createTodoService({
    errors: payload.errors,
    schemas: payload.schemas,
    clock: payload.clock,
    uuid: payload.uuid,
  });
  const derivedState = createDerivedStateService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const mutation = createMutationService({
    errors: payload.errors,
    schemas: payload.schemas,
    clock: payload.clock,
    graph,
    context,
    todo,
    derivedState,
  });

  return {
    graph,
    context,
    todo,
    derivedState,
    mutation,
    search: createUnavailableQueryService<SearchService>('search', payload.errors),
    items: createUnavailableQueryService<ItemsService>('items', payload.errors),
    queue: createUnavailableQueryService<QueueService>('queue', payload.errors),
    attention: createUnavailableQueryService<AttentionService>('attention', payload.errors),
  };
}
