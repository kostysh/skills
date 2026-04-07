# Интерфейсы модулей утилиты `@kostysh/backlog-engineer-cli`

Документ фиксирует implementation-level контракты модулей утилиты:

- публичные интерфейсы верхнеуровневых модулей;
- порты для файловой системы и других внешних зависимостей;
- ownership типов и артефактов;
- внутренние сервисы `core`;
- правила зависимостей и test seams.

Этот документ не повторяет полную продуктовую семантику команд. Она уже зафиксирована в:

- `process-cli.ru.md`
- `utility-spec.ru.md`
- `schemas-and-types.ru.md`

Здесь задача другая: сделать модульную архитектуру однозначной для реализации и unit-тестов.

## 1. Цели документа

Документ должен ответить на вопросы:

- какие top-level модули существуют;
- какие методы они обязаны предоставлять;
- какие типы и артефакты они читают и пишут;
- какие зависимости разрешены;
- где должны жить побочные эффекты;
- как строить unit-тесты без реальной файловой системы и без скрытых singleton-ов.

## 2. Общие правила интерфейсов

1. Каждый top-level модуль должен иметь один явный public entrypoint.
2. Ни один модуль, кроме `schemas`, не должен объявлять теневые дубликаты DTO и artifact shapes.
3. `commands` и `cli` не должны знать внутреннюю структуру графа.
4. `core` не должен знать про argv, stdout/stderr и файловые пути вне backlog root.
5. `artifacts` не должен принимать бизнес-решения по графу и контексту.
6. Все внешние зависимости должны приходить через явные ports.
7. Все mutation-команды должны использовать одни и те же domain services, что и rebuild.
8. Read-команды могут инициировать hidden maintenance rebuild только через `runtime`, а не напрямую через `commands`.
9. Все интерфейсы должны быть пригодны для in-memory тестирования.

## 3. Рекомендуемая структура `src/`

```text
src/
├── cli/
│   ├── run-cli.ts
│   ├── parse-argv.ts
│   └── command-registry.ts
├── commands/
│   ├── index.ts
│   ├── types.ts
│   ├── init.ts
│   ├── register-source.ts
│   ├── list-sources.ts
│   ├── template.ts
│   ├── packet.ts
│   ├── patch-item.ts
│   ├── remove-item.ts
│   ├── refresh.ts
│   ├── status.ts
│   ├── report.ts
│   ├── items.ts
│   ├── search.ts
│   ├── gaps.ts
│   ├── queue.ts
│   ├── attention.ts
│   └── delete-backlog.ts
├── runtime/
│   ├── create-runtime.ts
│   ├── command-context.ts
│   ├── root-discovery.ts
│   ├── state-recovery.ts
│   └── ports.ts
├── core/
│   ├── index.ts
│   ├── types.ts
│   ├── graph-service.ts
│   ├── context-service.ts
│   ├── todo-service.ts
│   ├── derived-state-service.ts
│   ├── search-service.ts
│   ├── items-service.ts
│   ├── queue-service.ts
│   ├── attention-service.ts
│   └── mutation-service.ts
├── artifacts/
│   ├── index.ts
│   ├── backlog-layout.ts
│   ├── root-marker-store.ts
│   ├── source-registry-store.ts
│   ├── applied-registry-store.ts
│   ├── state-store.ts
│   ├── canonical-import-store.ts
│   ├── report-store.ts
│   └── delete-backlog.ts
├── sources/
│   ├── index.ts
│   ├── path-normalizer.ts
│   ├── source-registry-service.ts
│   ├── source-hash-service.ts
│   └── source-scope-service.ts
├── templates/
│   ├── index.ts
│   ├── render-agents-template.ts
│   ├── render-packet-template.ts
│   └── render-patch-template.ts
├── reports/
│   ├── index.ts
│   ├── build-report-model.ts
│   ├── render-report-markdown.ts
│   └── render-mermaid-graph.ts
├── schemas/
│   ├── index.ts
│   ├── scalars.ts
│   ├── packet.ts
│   ├── patch.ts
│   ├── artifacts.ts
│   ├── commands.ts
│   └── errors.ts
├── errors/
│   ├── index.ts
│   ├── backlog-error.ts
│   ├── error-codes.ts
│   ├── factories.ts
│   └── exit-codes.ts
└── hooks/
    ├── index.ts
    ├── types.ts
    └── no-op-hooks.ts
```

Это рекомендуемая структура. Допустимы технические перестановки файлов, если сохраняются те же модульные boundaries.

## 4. Общие runtime-типы и порты

## 4.1. Базовые runtime-типы

```ts
type BacklogRootPath = string;
type AbsoluteFsPath = string;
type JsonString = string;
type CommandName =
  | "init"
  | "register-source"
  | "list-sources"
  | "template"
  | "packet"
  | "patch-item"
  | "remove-item"
  | "refresh"
  | "status"
  | "report"
  | "items"
  | "search"
  | "gaps"
  | "queue"
  | "attention"
  | "delete-backlog";
```

## 4.2. Порты внешней среды

Эти порты не являются отдельными top-level модулями. Они представляют внешние зависимости, которые используются через `runtime`.

### `FileSystemPort`

```ts
interface FileSystemPort {
  readText(path: AbsoluteFsPath): Promise<string>;
  writeText(path: AbsoluteFsPath, content: string): Promise<void>;
  exists(path: AbsoluteFsPath): Promise<boolean>;
  mkdir(path: AbsoluteFsPath, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: AbsoluteFsPath): Promise<string[]>;
  rm(path: AbsoluteFsPath, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  stat(path: AbsoluteFsPath): Promise<{
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    mtimeMs: number;
  }>;
  cwd(): AbsoluteFsPath;
}
```

### `PathPort`

```ts
interface PathPort {
  resolve(...parts: string[]): AbsoluteFsPath;
  dirname(path: AbsoluteFsPath): AbsoluteFsPath;
  basename(path: string): string;
  relative(from: AbsoluteFsPath, to: AbsoluteFsPath): string;
  normalize(path: string): string;
  join(...parts: string[]): string;
}
```

### `ClockPort`

```ts
interface ClockPort {
  nowIsoUtc(): string;
}
```

### `UuidPort`

```ts
interface UuidPort {
  create(): string;
}
```

### `HashPort`

```ts
interface HashPort {
  sha256Text(text: string): Promise<string>;
}
```

### `ProcessIoPort`

Нужен только в `cli`.

```ts
interface ProcessIoPort {
  writeStdout(text: string): Promise<void>;
  writeStderr(text: string): Promise<void>;
}
```

## 4.3. Runtime dependency bag

```ts
interface RuntimeDependencies {
  fs: FileSystemPort;
  path: PathPort;
  clock: ClockPort;
  uuid: UuidPort;
  hash: HashPort;
  hooks: HookRegistry;
}
```

Правило: ни один top-level модуль не должен сам получать `Date`, `crypto.randomUUID`, `node:fs/promises` или `process.cwd()` напрямую. Всё должно проходить через этот bag или производный context.

## 5. Ownership типов и данных

## 5.1. Кто владеет типами

| Типы | Владелец |
| --- | --- |
| packet / patch / command DTO / artifact DTO | `schemas` |
| error codes / error payload | `errors` |
| graph orchestration results | `core` |
| source hashing and path normalization results | `sources` |
| file-path layout results | `artifacts` |
| report model | `reports` |
| hook payloads | `hooks` |

Правило: если shape описан в `schemas-and-types.ru.md`, кодовая декларация этого shape должна жить только в `schemas`.

## 5.2. Кто владеет файлами backlog root

| Артефакт | I/O владелец | Кто поставляет content/model |
| --- | --- | --- |
| `.backlog.json` | `artifacts` | `runtime` |
| `.backlog/sources.json` | `artifacts` | `sources` / `runtime` |
| `.backlog/applied.json` | `artifacts` | `runtime` |
| `.backlog/state.json` | `artifacts` | `core` / `runtime` |
| `packets/*` | `artifacts` | `commands` / `runtime` |
| `patches/*` | `artifacts` | `commands` / `runtime` |
| `reports/*` | `artifacts` | `reports` |
| `AGENTS.md` inside backlog root | `artifacts` | `templates` |

Правило: только `artifacts` знает реальные пути и умеет читать/писать эти файлы.

## 6. Интерфейсы top-level модулей

## 6.1. `schemas`

Назначение:

- объявить `zod@v4` схемы;
- экспортировать TypeScript-типы;
- выполнять syntax-level parsing and exact validation.

```ts
interface SchemaModule {
  parseRootMarker(raw: unknown): RootMarkerFile;
  parseSourceRegistry(raw: unknown): SourceRegistryFile;
  parseAppliedRegistry(raw: unknown): AppliedRegistryFile;
  parseStateFile(raw: unknown): StateFile;
  parsePacketFile(raw: unknown): PacketFile;
  parsePatchFile(raw: unknown): PatchFile;
  parseCommandInput<TName extends CommandName>(
    name: TName,
    raw: unknown,
  ): CommandInputByName<TName>;
  parseCommandOutput<TName extends CommandName>(
    name: TName,
    raw: unknown,
  ): CommandOutputByName<TName>;
  parseErrorPayload(raw: unknown): ErrorPayload;
}
```

Не должен:

- читать файлы;
- выполнять semantic validation;
- решать конфликты графа.

## 6.2. `errors`

Назначение:

- хранить stable codes;
- создавать типизированные ошибки;
- маппить ошибки в exit codes и `ErrorPayload`.

```ts
interface BacklogError extends Error {
  readonly code: ErrorCode;
  readonly exitCode: number;
  readonly details?: Record<string, unknown>;
  readonly hint?: string;
}

interface ErrorModule {
  create(
    code: ErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      hint?: string;
      cause?: unknown;
    },
  ): BacklogError;
  isBacklogError(value: unknown): value is BacklogError;
  toPayload(error: unknown): ErrorPayload;
  toExitCode(error: unknown): number;
}
```

Не должен:

- знать содержательную бизнес-логику команд;
- делать файловые операции.

## 6.3. `hooks`

Назначение:

- предоставить безопасные extension points;
- дать no-op реализацию по умолчанию.

```ts
interface HookRegistry {
  beforeCommand?(payload: {
    command: CommandName;
    input: unknown;
    backlogRoot?: BacklogRootPath;
  }): Promise<void>;
  afterCommand?(payload: {
    command: CommandName;
    output: unknown;
    backlogRoot?: BacklogRootPath;
  }): Promise<void>;
  afterSourceRegistered?(payload: {
    source: SourceRecord;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterPacketApplied?(payload: {
    summary: PacketCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterPatchApplied?(payload: {
    summary: PatchItemCommandOutput | RemoveItemCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  afterRefresh?(payload: {
    summary: RefreshCommandOutput;
    state: StateFile;
    backlogRoot: BacklogRootPath;
  }): Promise<void>;
  buildSystemSummary?(payload: {
    context: StateFile["context"];
    items: StateFile["items"];
  }): Promise<string[]>;
  decorateReportSections?(payload: {
    sections: ReportSection[];
  }): Promise<ReportSection[]>;
}

interface HooksModule {
  createNoOpRegistry(): HookRegistry;
}
```

Не должен:

- писать `state.json` напрямую;
- менять packet/patch/sources registries напрямую.

## 6.4. `artifacts`

Назначение:

- владеть layout backlog root;
- читать/писать canonical artifacts;
- импортировать packet/patch files;
- выполнять delete backlog;
- участвовать в hidden maintenance rebuild как storage layer.

```ts
interface ArtifactsModule {
  createBacklogDirectories(root: BacklogRootPath): Promise<void>;
  readRootMarker(root: BacklogRootPath): Promise<RootMarkerFile>;
  writeRootMarker(root: BacklogRootPath, marker: RootMarkerFile): Promise<void>;
  writeAgentsFile(root: BacklogRootPath, content: string): Promise<void>;
  initializeBacklogRoot(payload: {
    root: BacklogRootPath;
    createdAt: IsoUtcTimestamp;
    agentsContent: string;
  }): Promise<InitCommandOutput>;

  writeInitialArtifacts(payload: {
    root: BacklogRootPath;
    marker: RootMarkerFile;
    agentsContent: string;
    sourceRegistry: SourceRegistryFile;
    appliedRegistry: AppliedRegistryFile;
    state: StateFile;
  }): Promise<void>;

  readSourceRegistry(root: BacklogRootPath): Promise<SourceRegistryFile>;
  writeSourceRegistry(root: BacklogRootPath, value: SourceRegistryFile): Promise<void>;

  readAppliedRegistry(root: BacklogRootPath): Promise<AppliedRegistryFile>;
  writeAppliedRegistry(root: BacklogRootPath, value: AppliedRegistryFile): Promise<void>;

  readState(root: BacklogRootPath): Promise<StateFile>;
  writeState(root: BacklogRootPath, value: StateFile): Promise<void>;
  stateExists(root: BacklogRootPath): Promise<boolean>;

  importPacketFile(payload: {
    root: BacklogRootPath;
    packetId: PacketId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  }): Promise<{
    canonicalPath: BacklogRelativePosixPath;
    sha256: string;
  }>;

  importPatchFile(payload: {
    root: BacklogRootPath;
    patchId: PatchId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  }): Promise<{
    canonicalPath: BacklogRelativePosixPath;
    sha256: string;
  }>;

  writeReportFiles(payload: {
    root: BacklogRootPath;
    markdown: string;
    mermaid: string;
  }): Promise<{
    reportPath: BacklogRelativePosixPath;
    graphPath: BacklogRelativePosixPath;
  }>;

  writeTemplateOutput(payload: {
    cwd: AbsoluteFsPath;
    out: CliPathInput;
    defaultBasename: string;
    content: string;
  }): Promise<NormalizedFsPath>;

  deleteBacklog(root: BacklogRootPath): Promise<void>;
}
```

Boundary для `init`:

- `templates` генерирует только `agentsContent`;
- `runtime` собирает initial DTO bundle;
- `artifacts.writeInitialArtifacts(...)` делает все file writes для `.backlog.json`, `AGENTS.md`, `.backlog/sources.json`, `.backlog/applied.json`, `.backlog/state.json`.
- `commands/template` использует `artifacts.writeTemplateOutput(...)` для authored output path из `--out`.

Не должен:

- валидировать semantic смысл packet/patch;
- решать, какие `todo` создавать;
- вычислять `ready_for_next_step`.

## 6.5. `sources`

Назначение:

- нормализовать source paths;
- регистрировать source records;
- хешировать source files;
- находить source-scoped refresh scope.

Правило path-модели:

- persisted `SourceRecord.path` всегда хранится как `SourceRelativePosixPath`;
- `SourceRecord.path` нормализуется относительно backlog root, но может содержать `..`, если исходный документ расположен вне backlog root;
- `source_label` должен детерминированно выводиться из нормализованного относительного пути;
- внешний caller не должен override-ить `source_label` произвольной строкой;
- `buildSourceRecord(...)` сам производит `source_label` из `relativePath`.

```ts
interface SourcesModule {
  resolveCliSourcePath(payload: {
    backlogRoot: BacklogRootPath;
    inputPath: NormalizedFsPath;
  }): Promise<{
    absolute_path: NormalizedFsPath;
    relative_path: SourceRelativePosixPath;
    source_label: SourceLabel;
  }>;

  buildSourceRecord(payload: {
    sourceId: SourceId;
    relativePath: SourceRelativePosixPath;
    kind: string;
    note?: string;
    authority: string;
    registeredAt: string;
    lastCheckedAt: string;
    sourceHash: string;
  }): SourceRecord;

  hashSourceFile(path: NormalizedFsPath): Promise<string>;

  registerSource(payload: {
    registry: SourceRegistryFile;
    source: SourceRecord;
  }): {
    registry: SourceRegistryFile;
    source: SourceRecord;
    created: boolean;
  };

  refreshSourceHashes(payload: {
    backlogRoot: BacklogRootPath;
    registry: SourceRegistryFile;
    selectedSourceIds: SourceId[];
  }): Promise<{
    registry: SourceRegistryFile;
    changedSourceIds: SourceId[];
    changedSources: SourceSummary[];
  }>;

  resolveSourceScope(payload: {
    backlogRoot: BacklogRootPath;
    state: StateFile;
    registry: SourceRegistryFile;
    selector:
      | { kind: "source_id"; source_id: SourceId }
      | { kind: "source_label"; source_label: string }
      | { kind: "source_path"; source_path: NormalizedFsPath };
  }): {
    sourceIds: SourceId[];
    topLevelItemKeys: ItemKey[];
    subgraphItemKeys: ItemKey[];
  };
}
```

Не должен:

- менять backlog graph напрямую;
- записывать файлы напрямую.

## 6.6. `templates`

Назначение:

- сгенерировать `AGENTS.md` в backlog root;
- строить packet/patch templates;
- не знать текущую семантику графа кроме shape templates.

```ts
interface TemplatesModule {
  renderBacklogAgentsTemplate(): string;
  renderPacketTemplate(): string;
  renderPatchTemplate(payload: {
    targetItemKeys: ItemKey[];
    kind: PatchKind;
    patchId: PatchId;
    createdAt: string;
    sequence: Sequence;
  }): string;
}
```

Не должен:

- писать файлы напрямую;
- читать `state.json`.

## 6.7. `reports`

Назначение:

- строить report model;
- рендерить markdown и Mermaid;
- использовать hooks-декорацию только на уровне report assembly.

`reports` должен покрывать:

- глобальный compact graph;
- локальные графы для подграфов, если общий граф слишком тяжёлый;
- section-level assembly операторского отчёта до финального markdown render.

```ts
type ReportSection = {
  key: string;
  title: string;
  markdown: string;
};

type LocalMermaidGraph = {
  title: string;
  mermaid: string;
  item_keys: ItemKey[];
};

type ReportModel = {
  systemSummary: string[];
  metrics: {
    totalItems: number;
    itemsNeedingAttention: number;
    readyForNextStep: number;
    openGaps: number;
    openTodos: number;
  };
  globalMermaidGraph: string;
  localMermaidGraphs: LocalMermaidGraph[];
  attentionItems: AttentionEntry[];
  queueChains: QueueChain[];
  itemCatalog: ItemCard[];
};

interface ReportsModule {
  buildReportModel(payload: {
    state: StateFile;
    registry: SourceRegistryFile;
  }): Promise<ReportModel>;
  buildSections(model: ReportModel): ReportSection[];
  renderMarkdown(sections: ReportSection[]): string;
  renderMermaid(model: ReportModel): string;
}
```

Не должен:

- мутировать `state.json`;
- создавать `todo`.

## 6.8. `core`

Назначение:

- владеть содержательной логикой backlog graph;
- обрабатывать packet/patch semantics;
- вычислять derived state;
- обслуживать read-модели `items`, `search`, `queue`, `attention`, `gaps`.

Публичный entrypoint `core` должен быть bundle-ом domain services:

```ts
interface CoreModule {
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
```

## 6.9. `runtime`

Назначение:

- создать command execution context;
- найти backlog root;
- предоставить service bundle;
- централизованно решать hidden maintenance rebuild.

Backlog-root discovery относится к `runtime`. Если используется helper `root-discovery.ts`, он является внутренней реализацией `runtime`, а не публичным API `artifacts`.

```ts
interface CommandExecutionContext {
  host: {
    resolveCliPath(path: CliPathInput): AbsoluteFsPath;
    nowIsoUtc(): IsoUtcTimestamp;
    createUuid(): string;
  };
  backlogRoot?: BacklogRootPath;
  artifacts: ArtifactsModule;
  sources: SourcesModule;
  templates: TemplatesModule;
  reports: ReportsModule;
  schemas: SchemaModule;
  errors: ErrorModule;
  hooks: HookRegistry;
  core: CoreModule;
  ensureQueryState(): Promise<{
    state: StateFile;
    rebuilt: boolean;
  }>;
  ensureMutationState(): Promise<StateFile>;
}

interface RuntimeModule {
  createContext(command: CommandName, cwd: AbsoluteFsPath): Promise<CommandExecutionContext>;

  rebuildState(root: BacklogRootPath): Promise<StateFile>;
}
```

`ensureQueryState` обязан:

- проверить, существует ли `state.json`;
- проверить, можно ли его безопасно использовать;
- если нельзя, rebuild-ить `state.json` по каноническим артефактам;
- вернуть флаг `rebuilt`.

`createContext(...)` обязан:

- для non-`init` команд находить backlog root через internal runtime helper;
- прикреплять к `CommandExecutionContext.host` semantic helpers для CLI path resolution и runtime clock;
- прикреплять к `CommandExecutionContext` методы `ensureQueryState()` и `ensureMutationState()`;
- не требовать от `commands` ручного конструирования runtime service graph.

Не должен:

- принимать решения о `todo` и графе сам по себе;
- дублировать бизнес-правила `core`.

## 6.10. `commands`

Назначение:

- быть адаптерами над typed DTO;
- вызывать `runtime`;
- собирать JSON result;
- не знать internals домена.

Единый интерфейс контроллера:

```ts
interface CommandController<TInput, TOutput> {
  readonly name: CommandName;
  execute(input: TInput, ctx: CommandExecutionContext): Promise<TOutput>;
}
```

Допустимая обязанность `commands`:

- command-level orchestration между `artifacts`, `sources`, `reports`, `core`.

Недопустимая обязанность `commands`:

- самостоятельный обход графа;
- manual patch semantics;
- direct filesystem work.

## 6.11. `cli`

Назначение:

- преобразовать `argv` в raw input;
- делегировать execution конкретному `CommandController`;
- сериализовать success/error JSON;
- выставить exit code.

```ts
interface CliModule {
  run(argv: string[], io: ProcessIoPort): Promise<number>;
}
```

Допустимо, чтобы `cli` владел:

- help text;
- version output;
- raw argv tokenization.

Недопустимо:

- напрямую читать `.backlog.json`;
- напрямую читать packet/patch files;
- вызывать `core` мимо `commands`.

## 7. Интерфейсы внутренних сервисов `core`

## 7.1. `GraphService`

```ts
interface GraphService {
  assertPacketAddsOnlyNewItems(payload: {
    state: StateFile;
    packet: PacketFile;
  }): void;

  applyPacketItems(payload: {
    state: StateFile;
    packet: PacketFile;
  }): {
    state: StateFile;
    addedItemKeys: ItemKey[];
  };

  applyPatchOperations(payload: {
    state: StateFile;
    patch: PatchFile;
  }): {
    state: StateFile;
    updatedItemKeys: ItemKey[];
    removedItemKeys: ItemKey[];
    removedTodoIds: TodoId[];
  };

  buildDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]>;
  buildReverseDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]>;

  resolveItemSubgraph(payload: {
    state: StateFile;
    rootItemKeys: ItemKey[];
  }): ItemKey[];

  cleanupRemovedItemReferences(payload: {
    state: StateFile;
    removedItemKeys: ItemKey[];
  }): StateFile;
}
```

Обязан:

- проверять, что все `depends_on_keys` и context-based item references валидны после mutation;
- чистить context references после `remove-item`.

## 7.2. `ContextService`

```ts
interface ContextService {
  mergePacketContext(payload: {
    state: StateFile;
    packet: PacketFile;
  }): {
    state: StateFile;
    changedContextKeys: string[];
  };

  assertNoGlossaryConflicts(payload: {
    state: StateFile;
    packet: PacketFile;
  }): void;

  assertImmutableContextEntities(payload: {
    state: StateFile;
    packet: PacketFile;
  }): void;
}
```

Обязан:

- enforce immutability по ключу для `claim`, `contract`, `data_domain`, `quality_attribute`, `policy_decision`;
- считать конфликт переопределения ошибкой.

## 7.3. `TodoService`

```ts
interface TodoService {
  createOrMergeTodos(payload: {
    state: StateFile;
    todos: Todo[];
  }): {
    state: StateFile;
    createdTodoIds: TodoId[];
    updatedTodoIds: TodoId[];
  };

  removeTodos(payload: {
    state: StateFile;
    todoIds: TodoId[];
  }): {
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
  }): Todo[];

  generateTodosForContextChange(payload: {
    state: StateFile;
    changedItemKeys: ItemKey[];
    affectedItemKeys?: ItemKey[];
    managedBy?: TodoManagedBy;
  }): Todo[];
}
```

Обязан:

- хранить только open `todo`;
- дедуплицировать по semantic effect, а не только по `todo_id`.
- не терять более сильный ownership:
  - если semantic effect совпал и одна запись `managedBy = mutation`, итоговая запись должна остаться `mutation`;
  - `refresh` cleanup имеет право удалять только `managedBy = refresh`.

## 7.4. `DerivedStateService`

```ts
interface DerivedStateService {
  recomputeAll(state: StateFile): StateFile;

  recomputeItems(payload: {
    state: StateFile;
    itemKeys: ItemKey[];
  }): StateFile;

  computeItemState(payload: {
    state: StateFile;
    itemKey: ItemKey;
  }): {
    needs_attention: boolean;
    attention_reason_codes: AttentionReasonCode[];
    attention_reasons: string[];
    ready_for_next_step: boolean;
  };
}
```

Обязан:

- возвращать `attention_reason_codes` и `attention_reasons` в одном и том же порядке;
- считать `gaps` blocking;
- считать open `todo` по source/dependency/context как review-needed;
- применять stage-aligned readiness.

## 7.5. `SearchService`

```ts
interface SearchService {
  search(payload: {
    state: StateFile;
    filters: SearchCommandInput;
    registry: SourceRegistryFile;
  }): SearchCommandOutput;
}
```

Обязан:

- возвращать compact summaries;
- не возвращать полные карточки;
- поддерживать deterministic ordering.

## 7.6. `ItemsService`

```ts
interface ItemsService {
  getItems(payload: {
    state: StateFile;
    itemKeys: ItemKey[];
    registry: SourceRegistryFile;
  }): ItemsCommandOutput;
}
```

Обязан:

- возвращать полные карточки только для известных ключей;
- прикладывать computed state и open `todo`.

## 7.7. `QueueService`

```ts
interface QueueService {
  buildQueueChains(payload: {
    state: StateFile;
  }): QueueCommandOutput;
}
```

Обязан:

- возвращать цепочки, а не плоский список;
- включать только задачи, которые:
  - `ready_for_next_step = true`
  - не `implemented`
  - без блокирующих `gaps`
  - без незакрытых зависимостей
- сортировать внутри цепочки:
  - по глубине
  - затем по числу downstream-зависимостей
  - затем по `item_key`.

## 7.8. `AttentionService`

```ts
interface AttentionService {
  buildAttentionList(payload: {
    state: StateFile;
    registry: SourceRegistryFile;
  }): AttentionCommandOutput;
}
```

Обязан:

- показывать причины в порядке:
  - `source_changed`
  - `dependency_changed`
  - `context_changed`
  - `gaps`

## 7.9. `MutationService`

```ts
interface MutationService {
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
    scope:
      | { kind: "all" }
      | { kind: "item"; item_key: ItemKey }
      | { kind: "source_id"; source_id: SourceId }
      | { kind: "source_label"; source_label: string }
      | { kind: "source_path"; source_path: CliPathInput };
  }): Promise<RefreshCommandOutput & { state: StateFile; registry: SourceRegistryFile }>;
}
```

Обязан:

- использовать те же semantic pipelines, что и rebuild;
- возвращать compact post-change summary;
- не писать файлы сам.

## 8. Матрица вызовов по командам

| Команда | Основной orchestrator | Основные модули |
| --- | --- | --- |
| `init` | `commands/init` | `runtime`, `artifacts`, `templates` |
| `register-source` | `commands/register-source` | `runtime`, `sources`, `artifacts`, `hooks` |
| `list-sources` | `commands/list-sources` | `runtime`, `artifacts`, `sources` |
| `template` | `commands/template` | `runtime`, `templates`, `artifacts` |
| `packet` | `commands/packet` | `runtime`, `schemas`, `artifacts`, `core`, `hooks` |
| `patch-item` | `commands/patch-item` | `runtime`, `schemas`, `artifacts`, `core`, `hooks` |
| `remove-item` | `commands/remove-item` | `runtime`, `schemas`, `artifacts`, `core`, `hooks` |
| `refresh` | `commands/refresh` | `runtime`, `artifacts`, `sources`, `core`, `hooks` |
| `status` | `commands/status` | `runtime`, `core` |
| `report` | `commands/report` | `runtime`, `reports`, `artifacts`, `hooks` |
| `items` | `commands/items` | `runtime`, `core`, `artifacts` |
| `search` | `commands/search` | `runtime`, `core` |
| `gaps` | `commands/gaps` | `runtime`, `core` |
| `queue` | `commands/queue` | `runtime`, `core` |
| `attention` | `commands/attention` | `runtime`, `core`, `artifacts` |
| `delete-backlog` | `commands/delete-backlog` | `runtime`, `artifacts` |

## 9. Hidden maintenance rebuild boundary

Hidden maintenance rebuild разрешён только в `runtime.ensureQueryState(...)`.

Запрещено:

- делать rebuild в `commands`;
- делать rebuild внутри `core`;
- делать rebuild как часть `schemas`;
- подменять `refresh` этим механизмом.

Правильный flow:

1. Read-команда вызывает `runtime.createContext(...)`.
2. `commands` вызывает только `ctx.ensureQueryState()`.
3. Если `state.json` отсутствует, повреждён или не совпадает с каноническими артефактами, `runtime` вызывает rebuild.
4. Rebuild использует:
   - `artifacts`
   - `schemas`
   - `sources`
   - `core`
5. Read-команда работает уже с консистентным `StateFile`.

`commands` не инициируют rebuild напрямую и не должны работать с `state.json` мимо `ctx.ensureQueryState()`.

## 10. Правила зависимостей между модулями

Запрещённые зависимости:

- `core -> artifacts`
- `core -> sources`
- `core -> templates`
- `core -> reports`
- `artifacts -> core`
- `schemas -> anything`
- `errors -> anything`
- `reports -> core mutation services`
- `templates -> artifacts`
- `commands -> fs/path/clock/uuid/hash` напрямую
- `commands -> node:path` и `new Date()` для обхода `CommandExecutionContext.host`
- `cli -> runtime` напрямую в обход `commands`

Разрешённые зависимости должны следовать диаграмме из `utility-spec.ru.md`.

## 11. Test seams

## 11.1. Что тестируется как pure unit

- `schemas`
- `errors`
- `core/context-service`
- `core/graph-service`
- `core/todo-service`
- `core/derived-state-service`
- `core/search-service`
- `core/items-service`
- `core/queue-service`
- `core/attention-service`
- `sources/path-normalizer`
- `sources/source-hash-service` с mock `HashPort`
- `templates`
- `reports` builders

## 11.2. Что тестируется с in-memory adapters

- `artifacts`
- `runtime`
- `commands`

Для этого нужен как минимум:

- in-memory `FileSystemPort`
- deterministic `ClockPort`
- deterministic `UuidPort`
- deterministic `HashPort`
- no-op `HookRegistry`

## 11.3. Что тестируется как process-level CLI

- help/version;
- argv parsing;
- JSON success/error printing;
- exit code mapping;
- integration happy-path для 2-3 командных цепочек.

## 12. Минимальный набор implementation decisions

Чтобы модульные интерфейсы были действительно полезны, реализация должна принять такие решения:

1. Все command controllers получают уже typed DTO, а не raw JSON strings.
2. Все file reads возвращают raw text только на границе `artifacts`, а дальше идут parsed DTO.
3. `runtime` — единственная точка сборки dependency bag.
4. `core` не создаёт UUID и timestamps сам; они приходят из payload или от orchestrator layer.
5. `artifacts` должен предоставлять atomic write policy для JSON files.
6. `reports` не должен читать файлы напрямую; только принимать уже загруженные DTO.
7. `templates` не должен знать backlog root path; он возвращает только content.

## 13. Итог

Эта архитектура даёт:

- тонкий `cli`;
- unit-test friendly `core`;
- явные ports для внешней среды;
- один composition root в `runtime`;
- отсутствие скрытых обратных зависимостей;
- возможность реализовывать команды по одной без архитектурного расползания.

После этого документа следующими естественными шагами являются:

- тестовая матрица;
- implementation plan по модулям;
- сама реализация `src/`.
