import type { ErrorModule } from '../errors/index.ts';
import type { ClockPort, UuidPort } from '../runtime/ports.ts';
import type { SchemaModule } from '../schemas/index.ts';
import { createContextService } from './context-service.ts';
import { createDerivedStateService } from './derived-state-service.ts';
import { createGraphService } from './graph-service.ts';
import { createItemsService } from './items-service.ts';
import { createMutationService } from './mutation-service.ts';
import { createAttentionService } from './attention-service.ts';
import { createQueueService } from './queue-service.ts';
import { createSearchService } from './search-service.ts';
import { createTodoService } from './todo-service.ts';
import type { CoreModule } from './types.ts';

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
  const search = createSearchService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const items = createItemsService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const queue = createQueueService({
    errors: payload.errors,
    schemas: payload.schemas,
  });
  const attention = createAttentionService({
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
    search,
    items,
    queue,
    attention,
    mutation,
  };
}
