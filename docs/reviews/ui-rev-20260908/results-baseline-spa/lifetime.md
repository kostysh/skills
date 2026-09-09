Режим: implement. Scope: Editor error and success behavior.

|Value|Identity|Owner|Lifetime|Verification|
|---|---|---|---|---|
|Draft|/items/:id, item.id|RHF Editor|Survives rejected save; reset only accepted response; discard on navigation|Error retains, corrected retry|
|Attempt/status|item.id, mutation invocation|Query mutation in Editor|No required in-flight navigation/remount in accepted flow; status local until completion|503 then 200|
|Accepted entity|item id|server, Query projection|Detail cache survives navigation; server survives browser reload|list/detail/reload|
|List projections|items/q/page|Query|Invalidate all lists after save|return list|

No access scope, portal, timers, Dexie, migration or TTL boundary in fixture. Server PATCH result defines save acceptance; subsequent browser reload verifies independent reread. Routes/API/server unchanged.
