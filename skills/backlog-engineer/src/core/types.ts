import type {
  AttentionCommandOutput,
  AttentionReasonCode,
  GapsCommandInput,
  GapsCommandOutput,
  ItemsCommandOutput,
  ItemKey,
  PacketCommandOutput,
  PacketFile,
  PacketId,
  PatchFile,
  PatchItemCommandOutput,
  RefreshCommandInput,
  RefreshCommandOutput,
  RemoveItemCommandOutput,
  SearchCommandInput,
  SearchCommandOutput,
  SourceId,
  SourceRegistryFile,
  SourceSummary,
  StateFile,
  Todo,
  TodoId,
  TodoManagedBy,
} from '../schemas/index.ts';

export interface GraphService {
  assertPacketAddsOnlyNewItems(payload: { state: StateFile; packet: PacketFile }): void;
  applyPacketItems(payload: { state: StateFile; packet: PacketFile }): {
    state: StateFile;
    addedItemKeys: ItemKey[];
  };
  applyPatchOperations(payload: { state: StateFile; patch: PatchFile }): {
    state: StateFile;
    updatedItemKeys: ItemKey[];
    removedItemKeys: ItemKey[];
    removedTodoIds: TodoId[];
  };
  buildDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]>;
  buildReverseDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]>;
  resolveItemSubgraph(payload: { state: StateFile; rootItemKeys: ItemKey[] }): ItemKey[];
  cleanupRemovedItemReferences(payload: {
    state: StateFile;
    removedItemKeys: ItemKey[];
  }): StateFile;
}

export interface ContextService {
  mergePacketContext(payload: { state: StateFile; packet: PacketFile }): {
    state: StateFile;
    changedContextKeys: string[];
  };
  assertNoGlossaryConflicts(payload: { state: StateFile; packet: PacketFile }): void;
  assertImmutableContextEntities(payload: { state: StateFile; packet: PacketFile }): void;
}

export interface TodoService {
  createOrMergeTodos(payload: { state: StateFile; todos: Todo[] }): {
    state: StateFile;
    createdTodoIds: TodoId[];
    updatedTodoIds: TodoId[];
  };
  removeTodos(payload: { state: StateFile; todoIds: TodoId[] }): {
    state: StateFile;
    removedTodoIds: TodoId[];
  };
  generateTodosForSourceChange(payload: {
    state: StateFile;
    registry: SourceRegistryFile;
    sourceIds: SourceId[];
    affectedItemKeys: ItemKey[];
    requireDirectSourceLink?: boolean;
    managedBy?: TodoManagedBy;
  }): Todo[];
  generateTodosForDependencyChange(payload: {
    state: StateFile;
    changedItemKeys: ItemKey[];
    dependentItemKeys: ItemKey[];
    managedBy?: TodoManagedBy;
    relatedSources?: SourceSummary[];
  }): Todo[];
  generateTodosForContextChange(payload: {
    state: StateFile;
    changedItemKeys: ItemKey[];
    affectedItemKeys?: ItemKey[];
    managedBy?: TodoManagedBy;
  }): Todo[];
}

export interface DerivedStateService {
  recomputeAll(state: StateFile): StateFile;
  recomputeItems(payload: { state: StateFile; itemKeys: ItemKey[] }): StateFile;
  computeItemState(payload: { state: StateFile; itemKey: ItemKey }): {
    needs_attention: boolean;
    attention_reason_codes: AttentionReasonCode[];
    attention_reasons: string[];
    ready_for_next_step: boolean;
  };
}

export interface SearchService {
  search(payload: { state: StateFile; filters: SearchCommandInput }): SearchCommandOutput;
}

export interface ItemsService {
  getItems(payload: {
    state: StateFile;
    itemKeys: ItemKey[];
    registry: SourceRegistryFile;
  }): ItemsCommandOutput;
}

export interface QueueService {
  buildQueueChains(payload: { state: StateFile }): import('../schemas/index.ts').QueueCommandOutput;
}

export interface AttentionService {
  buildAttentionList(payload: {
    state: StateFile;
    registry: SourceRegistryFile;
  }): AttentionCommandOutput;
}

export interface MutationService {
  applyPacket(payload: {
    state: StateFile;
    packet: PacketFile;
    sourceRegistry: SourceRegistryFile;
    packetId: PacketId;
    dryRun: boolean;
  }): Promise<PacketCommandOutput & { state: StateFile }>;
  applyPatch(payload: {
    state: StateFile;
    patch: PatchFile;
    sourceRegistry: SourceRegistryFile;
    dryRun: boolean;
  }): Promise<
    | (PatchItemCommandOutput & { state: StateFile })
    | (RemoveItemCommandOutput & { state: StateFile })
  >;
  refresh(payload: {
    state: StateFile;
    sourceRegistry: SourceRegistryFile;
    changedSourceIds: SourceId[];
    scope: RefreshCommandInput;
  }): Promise<RefreshCommandOutput & { state: StateFile; registry: SourceRegistryFile }>;
  getGaps(payload: { state: StateFile; filters: GapsCommandInput }): GapsCommandOutput;
}

export interface CoreModule {
  graph: GraphService;
  context: ContextService;
  todo: TodoService;
  derivedState: DerivedStateService;
  search: SearchService;
  items: ItemsService;
  queue: QueueService;
  attention: AttentionService;
  mutation: MutationService;
}
