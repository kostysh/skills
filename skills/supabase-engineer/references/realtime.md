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
- Realtime private-channel access policies are cached during the connection, refreshed when a client subscribes or sends a new JWT. Do not claim that a policy change is checked on every message; verify the accepted revocation/refresh behavior on the deployed version.
- For Postgres Changes DELETE delivery, the current official guide (checked 2026-09-09) requires `replica identity full` for filtering. Its deleted-record RLS limitation means INSERT/UPDATE authorization evidence does not prove DELETE delivery isolation. Inspect the deployed version and actual old-record payload/filter behavior; do not promise a fixed payload shape or change replication settings without authority.
- Remove channels on cleanup and handle subscription errors, reconnects, duplicate events, and token refresh.

## Evidence

Verify authorized and unauthorized subscribers, cross-tenant denial, reconnect behavior, and the actual deployed delivery path. A local callback invocation or successful `.subscribe()` call does not prove authorization, delivery, ordering, or recovery.
