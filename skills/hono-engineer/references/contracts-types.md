# Contract Types Export

Use this when you need to expose API request/response types to other apps without creating a separate package.

## Recommended pattern (type-only export)
- Define contracts in a dedicated module (e.g., `src/contracts/v1/*`).
- Keep schemas close to routes or in `src/contracts`, and re-use them in handlers.
- Export only types from `src/contracts/index.ts` to keep the public entrypoint type-only.

Example:
```ts
// src/contracts/v1/health.ts
import { z } from 'zod'
export const HealthResponseSchema = z.object({ ok: z.boolean() })
export type HealthResponse = z.infer<typeof HealthResponseSchema>
```

```ts
// src/contracts/index.ts
export type { HealthResponse } from './v1/health'
```

```json
// package.json
{
  "exports": {
    "./types": {
      "types": "./src/contracts/index.ts"
    }
  }
}
```

Consumer usage:
```ts
import type { HealthResponse } from 'your-package/types'
```

## Notes
- Use `import type` in consumers to avoid runtime imports.
- Avoid `export *` for contracts; prefer explicit `export type` to keep the public surface stable.
- Keep contracts versioned by API version (`v1`, `v2`) to avoid breaking consumers.
- If you need runtime schemas outside the server, switch to a built output (emit `.d.ts` and/or JS) and document it explicitly.
