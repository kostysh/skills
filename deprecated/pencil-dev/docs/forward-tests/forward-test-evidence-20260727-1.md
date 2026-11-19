# Blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Candidate: `pencil-dev` source-version `0.1.10` in the isolated #228 worktree.
- Evaluator: fresh agent with no forked conversation turns.
- Read boundary: generated `SKILL.md`, triggered `references/component-libraries.md`, and raw fixture `module-workspace-input.md` only.
- Side effects: read-only; the prompt explicitly prohibited MCP calls and writes.

## Exact evaluator prompt

```text
Use $pencil-dev from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/pencil-dev to prepare the exact Pencil MCP read/edit plan for updating the module mockup described in /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/web-ui-reviewer/evals/fixtures/module-workspace-input.md. The operator will open the document later; do not perform MCP calls or external writes in this task.

You may read only:
- skills/pencil-dev/SKILL.md
- skills/pencil-dev/references/component-libraries.md if its trigger applies
- the supplied module-workspace-input.md fixture
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Do not modify files. Return the actual decision-complete read/edit plan and honest readiness/evidence status, then a brief self-assessment.
```

The absolute path records the local run and is not an active portable dependency.

## Complete observed output

```text
Capability challenge: polishing the existing overview would only improve substrate. The accepted capability is the complete `queue search/filter → case detail → chronological activity and decision history` journey. The current mockup is therefore not implementation-ready.

## Decision-complete Pencil MCP plan

1. **Bind to the correct document**
   - Call `get_editor_state(include_schema: true)`.
   - Confirm the intended module `.pen`, active canvas, selection, and returned `filePath`.
   - Stop if the file is absent, ambiguous, or different from the expected module document. Do not mutate against cached state.

2. **Inventory target, peers, and reusable origins**
   - In one low-depth `batch_get`, search for:
     - `Case overview`;
     - `Mediation matters`;
     - `Document requests`;
     - reusable origins/instances named `WorkspaceSearchBar`, `CaseDetailHeader`, and `ActivityTimeline`.
   - In a targeted deeper `batch_get`, inspect only:
     - the target overview subtree and its handoff note;
     - peer queue, row-to-detail, and detail-history subtrees;
     - component variants/slots, including search query/status, header identity/status, and timeline loading/empty/error states.
   - Verify the three reusable assets are genuine origins/refs/instances. Visual similarity or matching names are insufficient.
   - If the library is not imported or visible, stop and ask the operator to import it in Pencil UI. Continue only after a fresh editor-state read and successful reusable-node readback.
   - Use `get_variables` for target tokens/themes and a scoped pre-edit screenshot of `Case overview` for visual continuity.

3. **Record the capability disposition before editing**
   - Search/filter: **reuse** `WorkspaceSearchBar` with query and status-filter behavior.
   - Case identity/current status: **reuse** `CaseDetailHeader`.
   - Activity and decision history: **reuse** `ActivityTimeline`, including its accepted states.
   - Overview metrics/cards: **retain as supplementary**, not as the complete release.
   - Peer modules: **behavioral reference only**; do not copy their differing styling.
   - Export and bulk comparison: **N/A / explicitly absent**.

4. **Create the missing workflow frames with `batch_design`**
   - Preserve `Case overview` except for correcting any in-document claim that it alone is the complete first release.
   - Add a `Case queue` frame using the overview’s typography, spacing, and visual language.
     - Place a real `WorkspaceSearchBar` instance configured for query plus status filter.
     - Add a visible result list beneath it.
     - Build module-local result rows only if no reusable row origin exists; do not detach or counterfeit library components.
     - Make at least one row visibly actionable and carry its exact case identity into the detail frame.
   - Add `Case detail — populated`.
     - Place a real `CaseDetailHeader` instance with the selected case identity and status.
     - Place a real populated `ActivityTimeline` instance containing both activity and decision events.
     - Use the ordering direction consistently established by the two peer views. If they disagree or do not establish it, stop for an operator decision instead of inventing the convention.
   - Add `Case detail — loading`, `Case detail — empty`, and `Case detail — error` variants using the corresponding `ActivityTimeline` variants while preserving the same header context.
   - If the live schema supports prototype interactions, wire the actionable queue row/control to `Case detail — populated`. If it does not, add an explicit design-handoff annotation for row activation and report that prototype interaction itself remains unverified.
   - Use established component/default copy and existing domain terminology. Do not invent new route names, case fields, statuses, or domain vocabulary.
   - Do not add export or bulk-comparison controls.

5. **Correct the handoff claim**
   - If the “overview is the complete first release” note is inside the `.pen`, replace it with a statement that the overview is supplementary and that the first-release design coverage comprises queue search/filter, row-to-detail navigation, and case history.
   - If the note is external, do not write it during this Pencil-only task; report the stale external handoff separately.

6. **Structural verification**
   - Use targeted `batch_get` on the new frame IDs to prove:
     - the queue contains a `WorkspaceSearchBar` ref/instance;
     - an actionable queue result and matching detail identity exist;
     - the detail contains `CaseDetailHeader` and `ActivityTimeline` refs/instances;
     - activity and decision events are chronologically ordered;
     - loading, empty, and error variants exist;
     - no export or bulk-comparison surface was introduced.
   - Read the top-level inventory again and confirm no copied peer/reference scaffolding remains.

7. **Layout and visual verification**
   - Run scoped `snapshot_layout(problemsOnly: true)` across all changed frames; fix and repeat until no relevant clipping, overlap, or constraint defects remain.
   - Capture and inspect screenshots of:
     - `Case queue`;
     - `Case detail — populated`;
     - the loading, empty, and error detail variants.
   - Check action discoverability, case-identity continuity, event-order legibility, visual consistency with the overview, and state clarity. A clean layout result alone is not sufficient.

8. **Persistence**
   - Ask the operator to save the document in Pencil.
   - Report live verification separately from save confirmation. Do not claim a durable `.pen` update until saving is confirmed.
   - No export is planned because none was requested.

## Readiness and evidence status

- **Current mockup:** not implementation-ready. It omits all three required workflow capabilities.
- **Current runtime evidence:** proves only static desktop parity with the overview. It does not prove navigation, filtering, keyboard behavior, network behavior, state handling, backend integration, or history data.
- **This task:** plan only. No Pencil MCP calls, mutations, screenshots, structural checks, or save confirmation were performed.
- **Post-plan claim ceiling:** after successful MCP readback, visual review, and save confirmation, the artifact may be called design-handoff-ready for the accepted workflow. It still would not prove runtime implementation or production readiness.

Self-assessment: the plan closes the source-defined workflow gap, explicitly reuses the accepted library, and includes falsifiable structural and visual checks. Its intentional limitation is that live file identity, node IDs, schema-supported interaction wiring, reusable-instance state, and persistence remain unknown until the operator opens the document.
```

## Coordinator-only rubric and verdict

| Expected decision | Observed | Result |
| --- | --- | --- |
| Inspect target, peer views, and library origins before `batch_design`. | Ordered MCP readback plan does so. | PASS |
| Distinguish library, module artifact, and runtime roles. | Each role and claim ceiling is explicit. | PASS |
| Add accepted search/filter, result-to-detail, and history coverage. | Queue/detail/history frames and states are specified. | PASS |
| Preserve authoritative `N/A`. | Export and bulk comparison remain absent. | PASS |
| Require structural, visual, and save evidence without claiming runtime. | Readback, layout, screenshots, persistence, and anti-claims are separate. | PASS |

Aggregate blind verdict: `PASS`. No live Pencil document or runtime behavior was exercised.
