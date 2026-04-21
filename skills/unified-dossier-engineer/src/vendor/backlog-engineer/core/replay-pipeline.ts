import type { ErrorModule } from '../errors/index.ts';
import type {
  AppendUniqueOperation,
  AttentionReasonCode,
  PacketContext,
  PacketFile,
  PacketItem,
  PatchFile,
  PatchOperation,
  RemoveValuesOperation,
  ReplaceFields,
  SchemaModule,
  SourceId,
  StateFile,
  StateItem,
  Todo,
} from '../schemas/index.ts';

const DERIVED_TODO_TYPES = {
  review_source_change: 'source_changed',
  review_dependency_change: 'dependency_changed',
  review_context_change: 'context_changed',
} as const;

function dedupeStable<T>(values: readonly T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function mergeGlossary(payload: {
  current: PacketContext['glossary'];
  incoming: PacketContext['glossary'];
  errors: ErrorModule;
}): PacketContext['glossary'] {
  const result = [...payload.current];
  const byTerm = new Map(result.map((entry, index) => [entry.term, index]));

  for (const entry of payload.incoming) {
    const index = byTerm.get(entry.term);
    if (index === undefined) {
      byTerm.set(entry.term, result.length);
      result.push(entry);
      continue;
    }

    const existing = result[index];
    if (!existing) {
      continue;
    }
    if (existing.definition !== entry.definition) {
      throw payload.errors.create('BE_CONTEXT_CONFLICT_GLOSSARY', undefined, {
        details: {
          term: entry.term,
        },
      });
    }

    result[index] = {
      ...existing,
      aliases: dedupeStable([...existing.aliases, ...entry.aliases], (value) => value),
    };
  }

  return result;
}

function mergeUniqueByKey<T extends Record<string, unknown>>(payload: {
  current: readonly T[];
  incoming: readonly T[];
  key: keyof T;
  errors: ErrorModule;
}): T[] {
  const result = [...payload.current];
  const byKey = new Map<string, number>();

  for (const [index, entry] of result.entries()) {
    byKey.set(String(entry[payload.key]), index);
  }

  for (const entry of payload.incoming) {
    const keyValue = String(entry[payload.key]);
    const existingIndex = byKey.get(keyValue);
    if (existingIndex === undefined) {
      byKey.set(keyValue, result.length);
      result.push(entry);
      continue;
    }

    const existing = result[existingIndex];
    if (!deepEqual(existing, entry)) {
      throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
        details: {
          key: keyValue,
          key_field: String(payload.key),
        },
      });
    }
  }

  return result;
}

function mergeAppendUnique<T>(current: readonly T[], incoming: readonly T[]): T[] {
  const result = [...current];
  for (const entry of incoming) {
    if (result.some((candidate) => deepEqual(candidate, entry))) {
      continue;
    }
    result.push(entry);
  }
  return result;
}

export function mergePacketContextOnly(payload: {
  state: StateFile;
  packet: PacketFile;
  errors: ErrorModule;
}): StateFile {
  const next = cloneState(payload.state);
  const current = next.context;
  const incoming = payload.packet.context;

  const keyStrategy =
    Object.keys(current.key_strategy).length === 0
      ? incoming.key_strategy
      : deepEqual(current.key_strategy, incoming.key_strategy)
        ? current.key_strategy
        : (() => {
            throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
              details: {
                key_field: 'key_strategy',
              },
            });
          })();

  next.context = {
    glossary: mergeGlossary({
      current: current.glossary,
      incoming: incoming.glossary,
      errors: payload.errors,
    }),
    key_strategy: keyStrategy,
    target_system: mergeAppendUnique(current.target_system, incoming.target_system),
    as_built: mergeAppendUnique(current.as_built, incoming.as_built),
    claims: mergeUniqueByKey({
      current: current.claims,
      incoming: incoming.claims,
      key: 'claim_key',
      errors: payload.errors,
    }),
    contracts: mergeUniqueByKey({
      current: current.contracts,
      incoming: incoming.contracts,
      key: 'contract_key',
      errors: payload.errors,
    }),
    data_domains: mergeUniqueByKey({
      current: current.data_domains,
      incoming: incoming.data_domains,
      key: 'data_domain_key',
      errors: payload.errors,
    }),
    quality_attributes: mergeUniqueByKey({
      current: current.quality_attributes,
      incoming: incoming.quality_attributes,
      key: 'quality_attribute_key',
      errors: payload.errors,
    }),
    policy_decisions: mergeUniqueByKey({
      current: current.policy_decisions,
      incoming: incoming.policy_decisions,
      key: 'policy_decision_key',
      errors: payload.errors,
    }),
  };

  return next;
}

function toStateItem(item: PacketItem): StateItem {
  return {
    ...item,
    reverse_dependency_keys: [],
    open_todo_ids: [],
    needs_attention: false,
    attention_reason_codes: [],
    attention_reasons: [],
    ready_for_next_step: false,
  };
}

export function validateReferentialIntegrity(payload: {
  state: StateFile;
  errors: ErrorModule;
}): void {
  const itemKeys = new Set(payload.state.items.map((item) => item.item_key));
  const claimKeys = new Set(payload.state.context.claims.map((claim) => claim.claim_key));
  const contractKeys = new Set(
    payload.state.context.contracts.map((contract) => contract.contract_key),
  );
  const dataDomainKeys = new Set(
    payload.state.context.data_domains.map((dataDomain) => dataDomain.data_domain_key),
  );
  const qualityAttributeKeys = new Set(
    payload.state.context.quality_attributes.map(
      (qualityAttribute) => qualityAttribute.quality_attribute_key,
    ),
  );
  const policyDecisionKeys = new Set(
    payload.state.context.policy_decisions.map(
      (policyDecision) => policyDecision.policy_decision_key,
    ),
  );

  for (const item of payload.state.items) {
    for (const dependencyKey of item.depends_on_keys) {
      if (!itemKeys.has(dependencyKey) || dependencyKey === item.item_key) {
        throw payload.errors.create('BE_DEPENDENCY_NOT_FOUND', undefined, {
          details: {
            item_key: item.item_key,
            dependency_key: dependencyKey,
          },
        });
      }
    }

    for (const claimKey of item.claim_keys) {
      if (!claimKeys.has(claimKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            item_key: item.item_key,
            claim_key: claimKey,
          },
        });
      }
    }

    for (const contractKey of item.contract_keys) {
      if (!contractKeys.has(contractKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            item_key: item.item_key,
            contract_key: contractKey,
          },
        });
      }
    }

    for (const dataDomainKey of item.data_domain_keys) {
      if (!dataDomainKeys.has(dataDomainKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            item_key: item.item_key,
            data_domain_key: dataDomainKey,
          },
        });
      }
    }

    for (const qualityAttributeKey of item.quality_attribute_keys) {
      if (!qualityAttributeKeys.has(qualityAttributeKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            item_key: item.item_key,
            quality_attribute_key: qualityAttributeKey,
          },
        });
      }
    }

    for (const policyDecisionKey of item.policy_decision_keys) {
      if (!policyDecisionKeys.has(policyDecisionKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            item_key: item.item_key,
            policy_decision_key: policyDecisionKey,
          },
        });
      }
    }
  }

  for (const qualityAttribute of payload.state.context.quality_attributes) {
    for (const itemKey of qualityAttribute.applies_to_item_keys) {
      if (!itemKeys.has(itemKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            quality_attribute_key: qualityAttribute.quality_attribute_key,
            item_key: itemKey,
          },
        });
      }
    }
  }

  for (const policyDecision of payload.state.context.policy_decisions) {
    for (const itemKey of policyDecision.related_item_keys) {
      if (!itemKeys.has(itemKey)) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            policy_decision_key: policyDecision.policy_decision_key,
            item_key: itemKey,
          },
        });
      }
    }
  }
}

function replaceFields(target: StateItem, fields: ReplaceFields): void {
  Object.assign(target, fields);
}

function appendUniqueValues(
  target: StateItem,
  field: AppendUniqueOperation['field'],
  values: AppendUniqueOperation['values'],
): void {
  const current = target[field];
  if (!Array.isArray(current)) {
    return;
  }

  target[field] = dedupeStable([...current, ...values], (value) => String(value)) as never;
}

function removeValues(
  target: StateItem,
  field: RemoveValuesOperation['field'],
  values: RemoveValuesOperation['values'],
): void {
  const current = target[field];
  if (!Array.isArray(current)) {
    return;
  }
  const valueSet = new Set(values);
  target[field] = current.filter((value) => !valueSet.has(String(value))) as never;
}

function removeTodosFromState(payload: {
  state: StateFile;
  itemKey: string;
  todoIds: readonly string[];
  errors: ErrorModule;
  missingTodoPolicy?: 'error' | 'ignore';
}): StateFile {
  const next = cloneState(payload.state);
  const todoIds = new Set(payload.todoIds);
  const ownedTodoIds = new Set(
    next.todos.filter((todo) => todo.item_key === payload.itemKey).map((todo) => todo.todo_id),
  );
  const removableTodoIds = new Set<string>();

  for (const todoId of todoIds) {
    if (!ownedTodoIds.has(todoId)) {
      if (payload.missingTodoPolicy === 'ignore') {
        continue;
      }
      throw payload.errors.create('BE_TODO_NOT_FOUND', undefined, {
        details: {
          item_key: payload.itemKey,
          todo_id: todoId,
        },
      });
    }

    removableTodoIds.add(todoId);
  }

  next.todos = next.todos.filter((todo) => !removableTodoIds.has(todo.todo_id));
  return next;
}

function cleanupRemovedItemReferences(state: StateFile, removedItemKeys: Set<string>): StateFile {
  const next = cloneState(state);

  next.items = next.items
    .filter((item) => !removedItemKeys.has(item.item_key))
    .map((item) => ({
      ...item,
      depends_on_keys: item.depends_on_keys.filter((itemKey) => !removedItemKeys.has(itemKey)),
    }));

  next.todos = next.todos.filter((todo) => !removedItemKeys.has(todo.item_key));
  next.context.quality_attributes = next.context.quality_attributes.map((qualityAttribute) => ({
    ...qualityAttribute,
    applies_to_item_keys: qualityAttribute.applies_to_item_keys.filter(
      (itemKey) => !removedItemKeys.has(itemKey),
    ),
  }));
  next.context.policy_decisions = next.context.policy_decisions.map((policyDecision) => ({
    ...policyDecision,
    related_item_keys: policyDecision.related_item_keys.filter(
      (itemKey) => !removedItemKeys.has(itemKey),
    ),
  }));

  return next;
}

function removeSourceIds(values: readonly SourceId[], sourceId: SourceId): SourceId[] {
  return values.filter((value) => value !== sourceId);
}

function removeSourceReferencesFromState(payload: {
  state: StateFile;
  sourceId: SourceId;
  affectedItemKeys: readonly string[];
  errors: ErrorModule;
}): StateFile {
  const next = cloneState(payload.state);
  const itemKeys = new Set(next.items.map((item) => item.item_key));
  const affectedItemKeys = new Set(payload.affectedItemKeys);

  for (const itemKey of affectedItemKeys) {
    if (itemKeys.has(itemKey)) {
      continue;
    }

    throw payload.errors.create('BE_PATCH_TARGET_NOT_FOUND', undefined, {
      details: {
        item_key: itemKey,
        source_id: payload.sourceId,
      },
    });
  }

  next.items = next.items.map((item) => {
    if (!affectedItemKeys.has(item.item_key)) {
      return item;
    }

    return {
      ...item,
      origin_source_ids: removeSourceIds(item.origin_source_ids, payload.sourceId),
      specification_source_ids: removeSourceIds(item.specification_source_ids, payload.sourceId),
      plan_source_ids: removeSourceIds(item.plan_source_ids, payload.sourceId),
      implementation_source_ids: removeSourceIds(item.implementation_source_ids, payload.sourceId),
      test_source_ids: removeSourceIds(item.test_source_ids, payload.sourceId),
    };
  });

  next.context.claims = next.context.claims.map((claim) => ({
    ...claim,
    source_ids: removeSourceIds(claim.source_ids, payload.sourceId),
  }));
  next.context.quality_attributes = next.context.quality_attributes.map((qualityAttribute) => ({
    ...qualityAttribute,
    source_ids: removeSourceIds(qualityAttribute.source_ids, payload.sourceId),
  }));
  next.context.policy_decisions = next.context.policy_decisions.map((policyDecision) => ({
    ...policyDecision,
    source_ids: removeSourceIds(policyDecision.source_ids, payload.sourceId),
  }));

  return next;
}

function sortItems(items: readonly StateItem[]): StateItem[] {
  return [...items].sort((left, right) => left.item_key.localeCompare(right.item_key));
}

function sortTodos(todos: readonly Todo[]): Todo[] {
  return [...todos].sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}

function createPatchReplayFailedError(payload: {
  errors: ErrorModule;
  error: unknown;
  patch: PatchFile;
  operation?: PatchOperation;
  operationIndex?: number;
  replayContext: {
    applyIndex: number;
    canonicalPath: string;
    kind: string;
    sequence: number;
  };
}): Error {
  return payload.errors.create(
    'BE_REBUILD_REPLAY_FAILED',
    payload.operation
      ? 'Backlog rebuild failed while replaying a canonical patch operation.'
      : 'Backlog rebuild failed after replaying a canonical patch.',
    {
      details: {
        artifact_kind: 'patch',
        canonical_path: payload.replayContext.canonicalPath,
        patch_id: payload.patch.metadata.patch_id,
        patch_kind: payload.replayContext.kind,
        apply_index: payload.replayContext.applyIndex,
        sequence: payload.replayContext.sequence,
        ...(payload.operation
          ? {
              operation_index: payload.operationIndex ?? null,
              operation_action: payload.operation.action,
              ...('item_key' in payload.operation
                ? { item_key: payload.operation.item_key }
                : {
                    source_id: payload.operation.source_id,
                    affected_item_keys: payload.operation.affected_item_keys,
                  }),
            }
          : {}),
        ...(payload.errors.isBacklogError(payload.error)
          ? {
              original_code: payload.error.code,
              original_message: payload.error.message,
            }
          : payload.error instanceof Error
            ? {
                original_message: payload.error.message,
              }
            : {}),
      },
      hint: 'Inspect the named canonical patch artifact. Do not repair replay failures by manually editing state.json or applied.json.',
      cause: payload.error,
    },
  );
}

export function synchronizeOpenTodoIds(payload: {
  schemas: SchemaModule;
  state: StateFile;
}): StateFile {
  const next = cloneState(payload.state);
  const todoIdsByItem = new Map<string, string[]>();

  for (const todo of sortTodos(next.todos)) {
    const ownedTodoIds = todoIdsByItem.get(todo.item_key) ?? [];
    ownedTodoIds.push(todo.todo_id);
    todoIdsByItem.set(todo.item_key, ownedTodoIds);
  }

  next.items = next.items.map((item) => ({
    ...item,
    open_todo_ids: [...(todoIdsByItem.get(item.item_key) ?? [])],
  }));

  return payload.schemas.parseStateFile(next);
}

function toAttentionReason(todo: Todo, code: Exclude<AttentionReasonCode, 'gaps'>): string {
  if (code === 'dependency_changed') {
    const relatedItemKey = todo.related_item_keys[0];
    return relatedItemKey
      ? `Dependency changed: review ${relatedItemKey}.`
      : 'Dependency changed: review the task.';
  }

  if (code === 'source_changed') {
    const relatedSource = todo.related_sources[0];
    return relatedSource
      ? `Source changed: review ${relatedSource.source_label}.`
      : 'Source changed: review the task.';
  }

  return 'Context changed: review the task.';
}

export function applyPacketReplay(payload: {
  state: StateFile;
  packet: PacketFile;
  errors: ErrorModule;
}): StateFile {
  const merged = mergePacketContextOnly(payload);
  const existingKeys = new Set(merged.items.map((item) => item.item_key));
  const nextItems = [...merged.items];

  for (const item of payload.packet.items) {
    if (existingKeys.has(item.item_key)) {
      throw payload.errors.create('BE_PACKET_ITEM_ALREADY_EXISTS', undefined, {
        details: {
          item_key: item.item_key,
        },
      });
    }

    existingKeys.add(item.item_key);
    nextItems.push(toStateItem(item));
  }

  const next = {
    ...merged,
    items: nextItems,
  };
  validateReferentialIntegrity({
    state: next,
    errors: payload.errors,
  });
  return next;
}

export function applyPacketItemsOnly(payload: {
  state: StateFile;
  items: readonly PacketItem[];
  errors: ErrorModule;
}): StateFile {
  const next = cloneState(payload.state);
  const existingKeys = new Set(next.items.map((item) => item.item_key));

  for (const item of payload.items) {
    if (existingKeys.has(item.item_key)) {
      throw payload.errors.create('BE_PACKET_ITEM_ALREADY_EXISTS', undefined, {
        details: {
          item_key: item.item_key,
        },
      });
    }

    existingKeys.add(item.item_key);
    next.items.push(toStateItem(item));
  }

  validateReferentialIntegrity({
    state: next,
    errors: payload.errors,
  });

  return next;
}

export function applyPatchReplay(payload: {
  state: StateFile;
  patch: PatchFile;
  errors: ErrorModule;
  missingTodoPolicy?: 'error' | 'ignore';
  replayContext?: {
    applyIndex: number;
    canonicalPath: string;
    kind: string;
    sequence: number;
  };
}): StateFile {
  let next = cloneState(payload.state);
  const removedItemKeys = new Set<string>();

  for (const [operationIndex, operation] of payload.patch.operations.entries()) {
    try {
      if (operation.action === 'remove_source_references') {
        next = removeSourceReferencesFromState({
          state: next,
          sourceId: operation.source_id,
          affectedItemKeys: operation.affected_item_keys,
          errors: payload.errors,
        });
        continue;
      }

      const targetItem = next.items.find((item) => item.item_key === operation.item_key);
      if (!targetItem) {
        throw payload.errors.create('BE_PATCH_TARGET_NOT_FOUND', undefined, {
          details: {
            item_key: operation.item_key,
          },
        });
      }

      switch (operation.action) {
        case 'replace_fields':
          replaceFields(targetItem, operation.fields);
          break;
        case 'append_unique':
          appendUniqueValues(targetItem, operation.field, operation.values);
          break;
        case 'remove_values':
          removeValues(targetItem, operation.field, operation.values);
          break;
        case 'remove_todo':
          next = removeTodosFromState({
            state: next,
            itemKey: operation.item_key,
            todoIds: operation.todo_ids,
            errors: payload.errors,
            missingTodoPolicy: payload.missingTodoPolicy ?? 'error',
          });
          break;
        case 'remove_item':
          removedItemKeys.add(operation.item_key);
          break;
        default: {
          const exhaustiveCheck: never = operation;
          throw payload.errors.create('BE_PATCH_OPERATION_INVALID', undefined, {
            details: {
              operation: exhaustiveCheck,
            },
          });
        }
      }
    } catch (error) {
      if (!payload.replayContext) {
        throw error;
      }

      throw createPatchReplayFailedError({
        errors: payload.errors,
        error,
        patch: payload.patch,
        operation,
        operationIndex,
        replayContext: payload.replayContext,
      });
    }
  }

  if (removedItemKeys.size > 0) {
    next = cleanupRemovedItemReferences(next, removedItemKeys);
  }

  try {
    validateReferentialIntegrity({
      state: next,
      errors: payload.errors,
    });
  } catch (error) {
    if (!payload.replayContext) {
      throw error;
    }

    throw createPatchReplayFailedError({
      errors: payload.errors,
      error,
      patch: payload.patch,
      replayContext: payload.replayContext,
    });
  }

  return next;
}

export function validateSourceRegistryReferences(payload: {
  state: StateFile;
  availableSourceIds: ReadonlySet<string>;
  errors: ErrorModule;
}): void {
  const ensureSourceExists = (sourceId: string, details: Record<string, string>) => {
    if (payload.availableSourceIds.has(sourceId)) {
      return;
    }

    throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        ...details,
        source_id: sourceId,
        reason: 'Canonical backlog references source_id that is missing from sources.json.',
      },
    });
  };

  for (const item of payload.state.items) {
    for (const sourceId of item.origin_source_ids) {
      ensureSourceExists(sourceId, {
        item_key: item.item_key,
        field: 'origin_source_ids',
      });
    }

    for (const sourceId of item.specification_source_ids) {
      ensureSourceExists(sourceId, {
        item_key: item.item_key,
        field: 'specification_source_ids',
      });
    }

    for (const sourceId of item.plan_source_ids) {
      ensureSourceExists(sourceId, {
        item_key: item.item_key,
        field: 'plan_source_ids',
      });
    }

    for (const sourceId of item.implementation_source_ids) {
      ensureSourceExists(sourceId, {
        item_key: item.item_key,
        field: 'implementation_source_ids',
      });
    }

    for (const sourceId of item.test_source_ids) {
      ensureSourceExists(sourceId, {
        item_key: item.item_key,
        field: 'test_source_ids',
      });
    }
  }

  for (const claim of payload.state.context.claims) {
    for (const sourceId of claim.source_ids) {
      ensureSourceExists(sourceId, {
        claim_key: claim.claim_key,
        field: 'source_ids',
      });
    }
  }

  for (const qualityAttribute of payload.state.context.quality_attributes) {
    for (const sourceId of qualityAttribute.source_ids) {
      ensureSourceExists(sourceId, {
        quality_attribute_key: qualityAttribute.quality_attribute_key,
        field: 'source_ids',
      });
    }
  }

  for (const policyDecision of payload.state.context.policy_decisions) {
    for (const sourceId of policyDecision.source_ids) {
      ensureSourceExists(sourceId, {
        policy_decision_key: policyDecision.policy_decision_key,
        field: 'source_ids',
      });
    }
  }
}

export function recomputeDerivedState(payload: {
  schemas: SchemaModule;
  state: StateFile;
}): StateFile {
  const next = cloneState(payload.state);
  const reverseDependencies = new Map<string, string[]>();

  for (const item of next.items) {
    reverseDependencies.set(item.item_key, []);
  }

  for (const item of next.items) {
    for (const dependencyKey of item.depends_on_keys) {
      const dependents = reverseDependencies.get(dependencyKey);
      if (dependents) {
        dependents.push(item.item_key);
      }
    }
  }

  const todoIdsByItem = new Map<string, string[]>();
  for (const todo of sortTodos(next.todos)) {
    const ownedTodoIds = todoIdsByItem.get(todo.item_key) ?? [];
    ownedTodoIds.push(todo.todo_id);
    todoIdsByItem.set(todo.item_key, ownedTodoIds);
  }

  const stageRank = {
    defined: 0,
    specified: 1,
    planned: 2,
    implemented: 3,
  } as const;

  next.items = sortItems(next.items).map((item) => {
    const itemTodos = next.todos.filter((todo) => todo.item_key === item.item_key);
    const attentionReasonCodes: AttentionReasonCode[] = [];
    const attentionReasons: string[] = [];

    const orderedTodoTypes = [
      'review_source_change',
      'review_dependency_change',
      'review_context_change',
    ] as const;
    for (const todoType of orderedTodoTypes) {
      const todo = itemTodos.find((candidate) => candidate.type === todoType);
      if (!todo) {
        continue;
      }

      const code = DERIVED_TODO_TYPES[todoType];
      attentionReasonCodes.push(code);
      attentionReasons.push(toAttentionReason(todo, code));
    }

    if (item.gaps.length > 0) {
      attentionReasonCodes.push('gaps');
      attentionReasons.push('Gap present: the task is blocked until missing input is clarified.');
    }

    const dependencyReady = item.depends_on_keys.every((dependencyKey) => {
      const dependency = next.items.find((candidate) => candidate.item_key === dependencyKey);
      if (!dependency) {
        return false;
      }

      return (
        dependency.gaps.length === 0 &&
        (todoIdsByItem.get(dependency.item_key)?.length ?? 0) === 0 &&
        stageRank[dependency.delivery_state] >= stageRank[item.delivery_state]
      );
    });

    return {
      ...item,
      reverse_dependency_keys: [...(reverseDependencies.get(item.item_key) ?? [])].sort(
        (left, right) => left.localeCompare(right),
      ),
      open_todo_ids: [...(todoIdsByItem.get(item.item_key) ?? [])],
      needs_attention: attentionReasonCodes.length > 0,
      attention_reason_codes: attentionReasonCodes,
      attention_reasons: attentionReasons,
      ready_for_next_step:
        item.delivery_state !== 'implemented' &&
        item.gaps.length === 0 &&
        (todoIdsByItem.get(item.item_key)?.length ?? 0) === 0 &&
        dependencyReady,
    };
  });

  next.todos = sortTodos(next.todos).filter((todo) =>
    next.items.some((item) => item.item_key === todo.item_key),
  );

  return payload.schemas.parseStateFile(next);
}
