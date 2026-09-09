Mode: implement in disposable synthetic SPA only. Outcome: failed PATCH preserves draft, corrected retry succeeds, list/detail/reload display accepted server name. Existing React 19, Query 5, RHF 7, Router 7 and Vite 7 preserved. No new runtime or architecture.

Mutation lifetime matrix:
- Input: /items/:id + item id, RHF Editor owner, survives failed attempt, reset only on accepted success; navigation after completion discards form. No child/portal remount requirement.
- Attempt/pending/error: Query mutation owned by Editor, each mutate is an attempt; sequential retry and pending button guard preserved. No access contexts, portals or timers in supplied flow.
- Server result: server authoritative, Query detail key ['item', String(id)] projected from successful PATCH; list keys ['items', ...] invalidated. Cache maintenance in hook onSuccess persists independently of observer callbacks.
- Verification: navigation to list fetches invalidated data, return initializes form from updated detail cache, browser reload rereads server. Accepted flow navigates after completed save; no requirement for in-flight cross-route status or separate pre-success reread. Auth, Dexie, context switches and deferred reread failure N/A in contract.

Evidence: real browser walkthrough against unchanged local synthetic HTTP server plus mandatory npm run build. No production integration claim.
