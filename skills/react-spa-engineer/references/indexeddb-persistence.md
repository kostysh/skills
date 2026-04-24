# IndexedDB Persistence with Dexie

Client-side persistence layer for React SPA using IndexedDB via Dexie.

**Stack**: Dexie | dexie-react-hooks | TypeScript

## Why IndexedDB for SPA

| Storage | Capacity | Async | Structured | Use Case |
|---------|----------|-------|------------|----------|
| localStorage | ~5MB | No | No | Simple key-value |
| sessionStorage | ~5MB | No | No | Tab-scoped temp |
| **IndexedDB** | **50MB+** | **Yes** | **Yes** | **App data, offline** |

**Use IndexedDB when:**
- Storing structured data (entities, collections)
- Need indexes for queries
- Data > 5MB
- Offline-first functionality
- Real-time UI updates on data changes

### Persistence Layer Contract

| Layer | Source of truth | Responsibility |
|------|------------------|----------------|
| URL | URL params/path | Link-reproducible page state |
| Zustand | In-memory store | Runtime UI state only |
| Dexie | IndexedDB | Reload-safe local persistence and local cache |
| TanStack Query | Server runtime cache | Network lifecycle and server state access |

**Rule**: Components, UI hooks, and Zustand stores must not call HTTP directly for app data.
Server calls are executed via TanStack Query `queryFn` / `mutationFn`.

---

## Setup

```bash
pnpm add dexie@latest dexie-react-hooks@latest
```

---

## 1. Database Definition

**Rule: Create a typed Dexie subclass with explicit table types.**

```tsx
// db.ts
import Dexie, { type Table } from 'dexie';

// Define row types
export type MetaRow = {
  key: string;
  value: string;
};

export type StoredMessage = {
  id: string;
  chatId: string;
  direction: 'in' | 'out';
  type: 'message' | 'typing' | 'error';
  role: 'user' | 'assistant' | 'system';
  message: string;
  date: string;
};

// Typed database class
class AppDb extends Dexie {
  // Declare tables with types: Table<RowType, PrimaryKeyType>
  meta!: Table<MetaRow, string>;
  messages!: Table<StoredMessage, string>;

  constructor() {
    super('my-app-db');  // Database name

    this.version(1).stores({
      // Index syntax:
      // &key     = unique primary key
      // key      = indexed field
      // [a+b]    = compound index
      // *tags    = multi-entry index (array)
      meta: '&key',
      messages: '&id, chatId, date, [chatId+date]',
    });
  }
}

// Export singleton instance
export const db = new AppDb();
```

### Index Syntax Reference

| Syntax | Meaning | Example |
|--------|---------|---------|
| `&field` | Unique primary key | `&id` |
| `field` | Indexed, non-unique | `chatId` |
| `[a+b]` | Compound index | `[chatId+date]` |
| `*field` | Multi-entry (arrays) | `*tags` |
| `++id` | Auto-increment | `++id` |

---

## 2. Schema Versioning

**Rule: Never modify existing version. Add new version for schema changes.**

```tsx
class AppDb extends Dexie {
  users!: Table<User, string>;
  posts!: Table<Post, string>;

  constructor() {
    super('my-app');

    // Version 1: initial schema
    this.version(1).stores({
      users: '&id, email',
      posts: '&id, authorId, createdAt',
    });

    // Version 2: add new table, add index
    this.version(2).stores({
      users: '&id, email, name',  // Added 'name' index
      posts: '&id, authorId, createdAt, [authorId+createdAt]',
      comments: '&id, postId, authorId',  // New table
    });

    // Version 3: migration with data transformation
    this.version(3)
      .stores({
        users: '&id, email, displayName',  // Renamed column
      })
      .upgrade(async (tx) => {
        // Migrate data
        await tx.table('users').toCollection().modify((user) => {
          user.displayName = user.name || user.email.split('@')[0];
          delete user.name;
        });
      });
  }
}
```

---

## 3. Reactive Queries with useLiveQuery

**Rule: Use `useLiveQuery` for automatic UI updates when data changes.**

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

// Basic usage
export const useChatMessages = (chatId: string | null) => {
  return useLiveQuery(
    async () => {
      if (!chatId) return [];

      const rows = await db.messages
        .where('chatId')
        .equals(chatId)
        .toArray();

      // Sort in memory (or use index)
      rows.sort((a, b) => a.date.localeCompare(b.date));
      return rows;
    },
    [chatId],  // Dependencies (like useEffect)
    [],        // Default value while loading
  );
};

// Usage in component
interface ChatViewProps {
  chatId: string;
}

function ChatView({ chatId }: ChatViewProps) {
  const messages = useChatMessages(chatId);

  // messages updates automatically when db.messages changes!
  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.message}</li>
      ))}
    </ul>
  );
}
```

### useLiveQuery Signature

```tsx
useLiveQuery<T>(
  querier: () => Promise<T> | T,  // Async function returning data
  deps: unknown[],                 // Dependency array
  defaultValue?: T                 // Value during first load
): T | undefined
```

**Key behaviors:**
- Automatically subscribes to table changes
- Re-runs query when deps change
- Returns `undefined` initially if no default
- Tracks which tables are accessed and only re-runs on those changes

---

## 4. Key-Value Meta Store Pattern (App-Level Preferences)

**Rule: Use a meta table for non-sensitive app-level preferences and bootstrap hints.**

Do not store tenant/user business cache in this table. Use scoped cache tables with `tenantId`/`userId`.

```tsx
// db.ts
export type MetaRow = {
  key: string;
  value: string;
};

// In database class
this.version(1).stores({
  meta: '&key',
});

// Constants for type-safe keys
export const META_KEYS = {
  activeChatId: 'activeChatId',
  theme: 'theme',
  lastSyncAt: 'lastSyncAt',
} as const;

// Helper functions
export const getMeta = async <T = string>(key: string): Promise<T | null> => {
  const row = await db.meta.get(key);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as T;
  }
};

export const setMeta = async <T>(key: string, value: T): Promise<void> => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  await db.meta.put({ key, value: stringValue });
};

export const deleteMeta = async (key: string): Promise<void> => {
  await db.meta.delete(key);
};

// Typed helpers for specific keys
export const getActiveChatId = async () => {
  const row = await db.meta.get(META_KEYS.activeChatId);
  return row?.value ?? null;
};

export const setActiveChatId = async (chatId: string) => {
  await db.meta.put({ key: META_KEYS.activeChatId, value: chatId });
};
```

---

## 5. Optimistic Updates with TanStack Query

**Rule: Combine IndexedDB with TanStack Query mutations for optimistic UI.**

```tsx
import { useMutation } from '@tanstack/react-query';
import { db, type StoredMessage } from './db';
import { sendMessage } from './api';

interface ChatInputProps {
  chatId: string;
}

function ChatInput({ chatId }: ChatInputProps) {
  const sendMutation = useMutation({
    mutationFn: async (vars: {
      chatId: string;
      message: string;
      tempId: string;
      localDate: string;
    }) => {
      const res = await sendMessage(vars.chatId, vars.message);
      return { res, vars };
    },

    // Optimistic update: add temp message immediately
    onMutate: async (vars) => {
      await db.messages.put({
        id: vars.tempId,
        chatId: vars.chatId,
        direction: 'out',
        type: 'message',
        role: 'user',
        message: vars.message,
        date: vars.localDate,
      });
    },

    // Success: replace temp with real message
    onSuccess: async ({ res, vars }) => {
      await db.messages.delete(vars.tempId);
      await db.messages.put({
        id: res.messageId,
        chatId: vars.chatId,
        direction: 'out',
        type: 'message',
        role: 'user',
        message: vars.message,
        date: res.date,
      });
    },

    // Error: add error message
    onError: async (err, vars) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await db.messages.put({
        id: `error-${vars.tempId}`,
        chatId: vars.chatId,
        direction: 'in',
        type: 'error',
        role: 'system',
        message: `Send failed: ${message}`,
        date: new Date().toISOString(),
      });
    },
  });

  const handleSubmit = (text: string) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    sendMutation.mutate({
      chatId,
      message: text,
      tempId,
      localDate: new Date().toISOString(),
    });
  };

  return <form onSubmit={...}>...</form>;
}
```

---

## 6. Real-time Updates (SSE/WebSocket)

**Rule: Parse incoming events, validate with Zod, persist to IndexedDB.**

```tsx
import { db, type StoredMessage } from './db';
import { AgentEventSchema } from './schemas';

// Typing indicator pattern: use deterministic IDs
const typingRowId = (chatId: string, role: string) =>
  `typing-${chatId}-${role}`;

export const useRealtimeEvents = (chatId: string | null) => {
  useEffect(() => {
    if (!chatId) return;

    const es = new EventSource(`/api/chats/${chatId}/events`);

    const handleMessage = async (ev: MessageEvent) => {
      // Parse and validate
      let data: unknown;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }

      const parsed = AgentEventSchema.safeParse(data);
      if (!parsed.success) return;

      const event = parsed.data;

      // Clear typing indicators on real message
      if (event.type === 'message' || event.type === 'error') {
        await db.messages.bulkDelete([
          typingRowId(event.chatId, 'assistant'),
          typingRowId(event.chatId, 'system'),
          typingRowId(event.chatId, 'user'),
        ]);
      }

      // Persist to IndexedDB
      const stored: StoredMessage = {
        id: event.type === 'typing'
          ? typingRowId(event.chatId, event.role)
          : event.messageId,
        chatId: event.chatId,
        direction: event.role === 'user' ? 'out' : 'in',
        type: event.type,
        role: event.role,
        message: event.message ?? '',
        date: event.date,
      };

      await db.messages.put(stored);
    };

    es.addEventListener('message', handleMessage);

    return () => es.close();
  }, [chatId]);
};
```

---

## 7. CRUD Operations Reference

```tsx
// CREATE / UPDATE (put = upsert)
await db.messages.put({ id: '1', chatId: 'c1', message: 'Hello' });

// CREATE only (add = fails if exists)
await db.messages.add({ id: '2', chatId: 'c1', message: 'World' });

// BULK operations
await db.messages.bulkPut([msg1, msg2, msg3]);
await db.messages.bulkAdd([msg4, msg5]);
await db.messages.bulkDelete(['id1', 'id2']);

// READ by primary key
const msg = await db.messages.get('1');

// READ with query
const chatMessages = await db.messages
  .where('chatId')
  .equals('c1')
  .toArray();

// READ with compound index
const recent = await db.messages
  .where('[chatId+date]')
  .between(['c1', '2024-01-01'], ['c1', '2024-12-31'])
  .toArray();

// UPDATE specific fields
await db.messages.update('1', { message: 'Updated' });

// DELETE
await db.messages.delete('1');

// DELETE with query
await db.messages.where('chatId').equals('c1').delete();

// CLEAR table
await db.messages.clear();
```

---

## 8. Transactions

**Rule: Use transactions for atomic multi-table operations.**

```tsx
// Atomic operation across tables
await db.transaction('rw', [db.users, db.posts], async () => {
  const user = await db.users.get(userId);
  if (!user) throw new Error('User not found');

  await db.posts.add({
    id: crypto.randomUUID(),
    authorId: userId,
    title: 'New Post',
    createdAt: new Date().toISOString(),
  });

  await db.users.update(userId, {
    postCount: (user.postCount ?? 0) + 1,
  });
});

// Transaction modes:
// 'r'  - read only
// 'rw' - read/write
```

---

## 9. Integration with TanStack Query Bootstrap

**Rule: Check IndexedDB for persisted state before server calls.**

```tsx
import { useQuery } from '@tanstack/react-query';
import { getActiveChatId, setActiveChatId } from './db/meta';
import { bootstrapKeys } from './keys';
import { createChat, listChats } from './api';

export const useAppBootstrap = (tenantId: string, userId: string) => {
  return useQuery({
    queryKey: bootstrapKeys.session({ tenantId, userId }),
    staleTime: Infinity,
    queryFn: async () => {
      // 1. Check persisted state
      const persistedChatId = await getActiveChatId({ tenantId, userId });

      // 2. Validate with server
      const chats = await listChats({ tenantId, userId });
      const canReuse = persistedChatId !== null &&
        chats.data.some((c) => c.chatId === persistedChatId);

      if (canReuse) {
        return { chatId: persistedChatId, reused: true };
      }

      // 3. Create new and persist
      const chat = await createChat({ tenantId, userId });
      await setActiveChatId({ tenantId, userId, chatId: chat.chatId });
      return { chatId: chat.chatId, reused: false };
    },
  });
};
```

---

## 10. File Structure

```
src/
├── db/
│   ├── index.ts          # Database class, singleton export
│   ├── schema.ts         # Table type definitions
│   └── helpers/
│       ├── meta.ts       # Key-value helpers
│       ├── messages.ts   # Message-specific helpers
│       └── users.ts      # User-specific helpers
├── hooks/
│   ├── useLiveMessages.ts
│   ├── useLiveUsers.ts
│   └── useAppBootstrap.ts
└── ...
```

---

## Cache Metadata and Isolation Contract

**Rule: Cache entries must be context-scoped and self-describing.**

```tsx
type CacheEntry<TData> = {
  cacheKey: string;
  namespace: 'dictionary' | 'entity-list' | 'entity-detail' | 'derived';
  tenantId: string;
  userId?: string;
  loadedAt: string; // ISO datetime
  data: TData;
};

class AppDb extends Dexie {
  cache!: Table<CacheEntry<unknown>, string>;

  constructor() {
    super('my-app');
    this.version(1).stores({
      cache: '&cacheKey, namespace, tenantId, userId, [tenantId+namespace], [tenantId+userId]',
    });
  }
}
```

### queryKey/cacheKey Alignment

**Rule: Build `queryKey` and `cacheKey` from the same semantic components.**

```tsx
const dictionaryKeys = {
  all: (tenantId: string, userId: string) =>
    ['dictionary', tenantId, userId] as const,
  byName: (tenantId: string, userId: string, name: string, locale: string) =>
    [...dictionaryKeys.all(tenantId, userId), name, { locale }] as const,
};

const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = (v as Record<string, unknown>)[key];
            return acc;
          }, {})
      : v
  );

const toCacheKey = (queryKey: readonly unknown[]) => stableStringify(queryKey);
```

### TTL Read Flow (On-demand Passive Refresh)

1. Build key from namespace + access context + params.
2. Try Dexie lookup by exact `cacheKey`.
3. If miss: fetch through TanStack Query, write Dexie, return data.
4. If hit and `TTL` valid: return cache immediately.
5. If hit and `TTL` expired: refetch via TanStack Query, update Dexie, return fresh data.

Store TTL configuration centrally (app config/env); allow per-dictionary overrides when required.

### Invalidation After Mutations

**Rule: Invalidate runtime and persistent caches together.**

```tsx
const mutation = useMutation({
  mutationFn: updateOrder,
  onSuccess: async (_, vars) => {
    await db.cache
      .where('[tenantId+namespace]')
      .equals([vars.tenantId, 'entity-list'])
      .delete();

    queryClient.invalidateQueries({
      queryKey: orderKeys.lists({ tenantId: vars.tenantId, userId: vars.userId }),
    });
    queryClient.invalidateQueries({
      queryKey: orderKeys.detail(
        { tenantId: vars.tenantId, userId: vars.userId },
        vars.orderId
      ),
    });
  },
});
```

### Context Switch Cleanup

On logout or tenant/user switch:
- delete Dexie entries for old `tenantId`/`userId`;
- reset Zustand runtime state;
- clear related TanStack Query runtime cache entries.

---

## Critical Rules

| Rule | Description |
|------|-------------|
| Typed tables | Use `Table<RowType, KeyType>` for type safety |
| Version up | Never modify existing version, add new version |
| Singleton | Export single `db` instance |
| useLiveQuery | Use for reactive UI updates |
| Deterministic IDs | Use for ephemeral items (typing indicators) |
| Transactions | Use for multi-table atomic operations |
| Validate events | Parse & validate before persisting real-time data |
| Metadata required | Persist `cacheKey`, context (`tenantId`/`userId`), and `loadedAt` |
| Scoped keys | Keep strict tenant/user isolation in keys and indexes |
| Dual invalidation | Update/invalidate Dexie and Query caches together |
| Context cleanup | Clear scoped Dexie + Query cache + runtime store on context switch |

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Modifying old version | Breaks existing databases | Add new version |
| Multiple db instances | Conflicts, memory waste | Export singleton |
| useEffect for queries | Manual subscription | Use `useLiveQuery` |
| Storing in memory | Lost on refresh | Persist to IndexedDB |
| No validation | Invalid data in DB | Validate with Zod before put |
| Cache keys without context | Cross-tenant/user leakage | Include `tenantId` and `userId` in key/index |
| Query key and cache key drift | Invalidation misses, duplicate cache lines | Generate both via centralized key factories |
| Mutations without persistent invalidation | Stale IndexedDB after server update | Invalidate/update Dexie entries in mutation flow |
| No cleanup on logout/switch | Previous account data reused | Scope-delete Dexie and reset runtime caches |

---

## References

- **Dexie.js**: https://dexie.org/
- **dexie-react-hooks**: https://dexie.org/docs/dexie-react-hooks/useLiveQuery()
- **IndexedDB API**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Persistence Architecture**: [persistence-architecture.md](persistence-architecture.md)
