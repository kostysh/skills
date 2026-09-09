# Final preservation readback

Read-only MCP verification after both supplemental cleanup runs succeeded. Fresh state identifies the intended pencil-live-test.pen. All 19 retained authored trees (depth 8, matching the reopen capture) and all resolved geometry records are exactly equal to the operator-confirmed saved/reopened baseline in pencil-after-refresh/01-state-read.json. No clipping problems remain.

Whole-document visitor inventory proves all four scratch IDs absent: A x3vi7b/aTsAR and B QvbuR/QdkRW. Exactly the same 19 top-level roots remain. Original reusable origins, refs and descendants are preserved by tree equality; fresh depth-12 instance/variable-resolved content is included in raw.json. Current variables are empty and equal to both cleanup before captures. No missing-node error was induced.

Persistence refers to the earlier operator-confirmed saved/reopened retained design, whose authored state remains unchanged after scratch creation/deletion. This does not claim a clean dirty flag, saved undo history, or new save operation. No mutations, new screenshots or exports were needed: unchanged geometry and content introduced no new visual concern.

Evidence: raw.json contains exact MCP arguments/results and fresh state; comparison.json records all per-root equality checks, scratch absence, root inventory, variable comparison and clipping results.
