# Realtime

Check current Realtime guidance and installed client versions before selecting a transport.

## Choose the mechanism

- Prefer Broadcast for most scalable or security-sensitive database-change delivery. Database triggers can call `realtime.broadcast_changes()` and private channels require Realtime authorization policies.
- Use Postgres Changes for simpler flows whose scale, filtering, publication, and per-subscriber authorization costs are acceptable.
- Use Presence for ephemeral participant state, not durable truth.

Do not select from projected user count alone. Name event rate, payload size, fan-out, ordering, latency, authorization, reconnect, missed-event recovery, and durability requirements.

## Authorization

- Use private channels for protected topics and define policies on `realtime.messages` according to current official guidance.
- Derive topic/tenant/user identifiers from trusted state; do not trust a caller-provided topic as authorization.
- Postgres Changes still depends on table grants, RLS, publication configuration, and the subscriber's JWT.
- Remove channels on cleanup and handle subscription errors, reconnects, duplicate events, and token refresh.

## Evidence

Verify authorized and unauthorized subscribers, cross-tenant denial, reconnect behavior, and the actual deployed delivery path. A local callback invocation or successful `.subscribe()` call does not prove authorization, delivery, ordering, or recovery.
