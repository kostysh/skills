Build and assess integrated client-side React SPA flows on this fixed stack:

`React | TypeScript | Vite | TanStack Query | Zustand | React Hook Form + Zod | React Router | Dexie`

## Cross-layer ownership

| Concern | Owner in this skill's architecture |
| --- | --- |
| Navigation and link-reproducible state | React Router and the URL |
| Project HTTP, SSE, or WebSocket transport | `shared/api` |
| Server reads, mutations, retries, and runtime cache | TanStack Query |
| Component-local and cross-feature runtime UI state | React state, Context, then Zustand when justified |
| Form state and client validation | React Hook Form and Zod |
| Approved reload-safe drafts and local cache | Dexie |
| Business truth and authorization | The server contract, never browser state |

Use loaders to orchestrate or prefill TanStack Query where route timing matters. In
this fixed architecture, do not also use React Router actions or fetchers as a
second owner for project server IO. Keep transport under `shared/api`, and keep
all durable browser data allowlisted, scoped, TTL-bound, and non-authoritative.

## Capability and anti-claims

The skill succeeds when the requested design, implementation, review, or
diagnosis preserves one coherent contract across every affected layer and the
handoff is backed by evidence appropriate to the claimed behavior.

The skill documentation does not itself run an SPA, validate a backend, grant
authorization, prove accessibility, measure production performance, or establish
end-to-end behavior. Compiler checks, types, builds, generated files, mocks,
screenshots, routes, schemas, stores, and cache tables remain bounded evidence;
they cannot close a broader claim without exercising its real boundary.

## Reference example contract

- A **copyable** example states the relevant major version and follows the root
  ownership, error, security, accessibility, and evidence rules.
- A **conceptual** example is explicitly labeled and names the production
  obligations it omits.
- When the project version differs, the installed manifest and lockfile are the
  compatibility constraint; consult the matching official documentation rather
  than silently upgrading or pasting the example.
