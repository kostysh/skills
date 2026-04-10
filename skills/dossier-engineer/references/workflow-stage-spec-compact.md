# Workflow stage steps: `spec-compact`

1. Re-read repo overlays from `AGENTS.md` and relevant repo ADRs.
2. Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).
   If logging is required, open `.dossier/logs/...` before the first substantive spec mutation.
3. Map the user-visible and boundary-facing behavior before editing the spec:
   - list each user-visible or boundary operation;
   - for each operation, note success behavior plus invalid input, dependency failure/timeout, and duplicate/retry behavior when relevant.
4. Refine ACs into **atomic, observable, behavior-first** statements.
   - one AC = one obligation;
   - if one sentence contains multiple independent outcomes, split it;
   - make triggers, guards, or preconditions explicit when they matter.
5. Add a mini `Terms & thresholds` block only when triggered.
   Trigger it when the feature introduces new domain terms, roles, states, statuses, or time/size limits that a reader could interpret in more than one way.
   Keep it to 3–5 bullets max.
6. When the feature has operator-facing, agent-facing, or machine-facing behavior, make the operator/agent contract explicit where it materially affects implementation or later usage.
   Capture what is relevant: first-run flow, ambiguity policy, path/root semantics, machine-facing output fields, error interpretation rules, and cross-tool or cross-skill handoff notes.
7. Separate three things explicitly:
   - `Constraints` = mandatory solution bounds;
   - `Assumptions` = expected substrate or external behavior;
   - `Open questions` = unresolved items with an owner/date, a `needed_by` marker (`before_planned`, `before_implementation`, or `before_done`), and an explicit next decision path.
8. When the feature touches trust boundaries or failure-prone surfaces, add the relevant safety and boundary semantics: ownership, symlink policy, rollback vs partial success, concurrency or mutation ordering, stale-state handling, and provenance requirements.
9. Add compact design with trigger-based representations:
   - If the feature adds or changes boundary I/O, include either an inline contract sketch or a link to the canonical schema/OpenAPI/protocol.
     Add the error model, and add retry/idempotency or duplicate-delivery semantics when the operation can be repeated.
   - runtime and deployment surface when relevant;
   - data model changes, invariants, and migration notes when relevant;
   - edge cases and failure modes;
   - verification surface as an **initial verification plan** that names the proof type for each AC or AC group;
   - representation upgrades only when triggered:
     - If a rule has 2+ independent conditions, add a decision table or decision list.
     - If the feature has named states, transitions, or guards, add a state list or compact state table.
     - If a DTO/event/request/response crosses a boundary, add a schema/contract pointer or compact structure block.
10. Keep NFRs compact and normative only.
   - include only NFRs that can materially change implementation, verification, or feature closure;
   - every normative NFR needs a metric, budget/threshold, or explicit observable signal.
11. Classify unresolved implementation-shaping decisions explicitly as `normative now`, `implementation freedom`, or `temporary assumption` instead of leaving them all in one undifferentiated bucket.
12. Add Definition of Done, an initial coverage plan, and a compact rollout / activation note when activation order matters.
13. Run a one-minute quick wording pass (`smell pass`):
   - remove vague words such as `etc.`, `usually`, `as appropriate`, `fast`, or `user-friendly`;
   - split compound ACs;
   - do not leave raw `TBD`; convert it into an `Open question` with owner/date or next decision path.
14. If an architectural fork exists, run `adr-log`.
15. If the spec introduces a cross-cutting decision, promote it to architecture or a repo ADR.
16. Set dossier `status: shaped` unless a stricter repo overlay defines a different maturity rule.
17. Keep `coverage_gate` explicit; default is still `deferred` unless repo rules say otherwise.
18. If logging was required, update the stage log with review events, decisions/reclassifications, process misses, and the planned backlog actualization outcome before closure.
19. Before moving to planning, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = specified`, or when shaping exposed new blockers, dependencies, or context facts.
20. If logging was required, update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.
