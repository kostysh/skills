# Blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Candidate: `frontend-design` source-version `0.2.1` in the isolated #228 worktree.
- Evaluator: fresh agent with no forked conversation turns.
- Read boundary: generated `SKILL.md`, triggered `references/strategy-to-implementation.md`, and raw fixture `module-workspace-input.md` only.
- Prohibited inputs: `skill.yaml`, `evals/evals.json`, docs, Git history/diff, other skills, and coordinator expectations.
- Side effects: read-only; no files or external state changed.

## Exact evaluator prompt

```text
Use $frontend-design from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/frontend-design to produce an implementation-ready design strategy for the module described in /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/web-ui-reviewer/evals/fixtures/module-workspace-input.md.

This is read-only. You may read only:
- skills/frontend-design/SKILL.md
- skills/frontend-design/references/strategy-to-implementation.md if the skill trigger requires it
- the supplied module-workspace-input.md fixture
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Do not modify files or external state. Return the actual strategy/handoff you would give the requester, then a brief self-assessment of evidence limits.
```

The absolute path above records the executed local run; it is evidence text, not an active portable dependency.

## Complete observed output

```markdown
# Case workspace — implementation handoff

## Readiness verdict

**Status: `blocked` for implementation-ready.**

The accepted capability is an end-to-end operational workflow:

1. search or filter the case queue;
2. open a case from a result;
3. inspect its chronological activity and decision history.

The polished `Case overview` is only substrate. It omits all three required workflow capabilities, so matching that frame cannot establish implementation readiness or first-release completeness.

## Capability, substrate, anti-claims

**Capability:** an operator can find a case, enter its detail context, and review activity and decisions chronologically.

**Reusable substrate:** `WorkspaceSearchBar`, `CaseDetailHeader`, `ActivityTimeline`, and the mockup’s accepted typography/spacing direction.

**Anti-claims:**

- The overview screenshot does not prove search, navigation, history, accessibility, or backend integration.
- Summary metrics, status cards, and recent-case cards are not substitutes for the accepted queue-to-detail workflow.
- Component availability does not prove that their contracts cover queue results, decision events, permissions, or runtime states.
- Export and bulk comparison remain out of scope.

## Source hierarchy

1. Accepted product and UX workflow.
2. Accepted reusable-library contracts.
3. Established peer-module workflow coverage.
4. Target mockup as visual inspiration only.
5. Current screenshot as evidence of one static desktop state only.

The mockup handoff’s “complete first release” claim conflicts with the accepted workflow and is therefore rejected.

## Peer-capability inventory

| Capability | Accepted evidence | Reusable representation | Current target state | Disposition |
| --- | --- | --- | --- | --- |
| Search and status filter | Product source and both peer modules | `WorkspaceSearchBar` | Absent | Reuse; required |
| Queue results | Product source and both peer modules | No owner identified | Absent | Component/runtime gap; resolve before implementation |
| Result-to-detail navigation | Product source and both peer modules | No owner identified | Absent | Interaction/navigation gap; resolve before implementation |
| Case identity and status | Required detail context | `CaseDetailHeader` | Absent | Reuse; required |
| Activity and decision history | Product source and both peer modules | `ActivityTimeline` may be suitable | Absent | Reuse only after confirming decision-event support |
| Export | Explicitly out of scope | N/A | N/A | Do not add |
| Bulk comparison | Explicitly out of scope | N/A | N/A | Do not add |

## Surface strategy

- **Surface:** product/app workspace
- **Constraint profile:** system-constrained
- **Primary visual engine:** data-led
- **Visual thesis:** a quiet, information-dense operational surface in which queue results and chronology dominate; hierarchy comes from typography, spacing, alignment, dividers, and restrained status accents rather than dashboard cards.

The overview card mosaic must not remain the primary first-release composition. Its typography and responsive spacing may inform the required frames, but its unsupported metrics and cards should not enter scope without separate product authority.

## Required frames

### 1. Queue

Place `WorkspaceSearchBar` at the top of the working surface, followed immediately by the result set. The queue—not summary metrics—is the dominant content.

The result representation must:

- provide a clear pointer and keyboard affordance for opening a case;
- remain readable at narrow widths without hiding the open-case action;
- use the existing token and component system;
- avoid a decorative recent-case card grid.

Exact row fields, ordering, result density, pagination, and search execution behavior are unresolved product/runtime decisions and must not be invented by visual implementation.

### 2. Case detail

Use `CaseDetailHeader` as the orientation anchor for case identity and current status. Place chronological history directly beneath it as the principal working content.

Use `ActivityTimeline` only if its item contract can represent both ordinary activity and decision records without losing their distinction. Otherwise, record a reusable-component gap rather than creating a screen-local imitation.

The navigation mechanism between queue and detail, including return behavior, route semantics, and preservation of queue state, remains unresolved.

## Material-state ownership

| Area | Required state | Proposed owner | Readiness |
| --- | --- | --- | --- |
| Search/filter | Query and status-filter variants | `WorkspaceSearchBar` | Available; behavior contract still needs confirmation |
| Queue | Populated results | Missing queue owner | Blocked |
| Queue | Loading, empty/no-match, error | No accepted owner supplied | Blocked |
| Detail header | Identity and current status | `CaseDetailHeader` | Available |
| Detail | Loading, not-found, error, permission outcome | No accepted owner supplied | Blocked |
| History | Loading, empty, error | `ActivityTimeline` | Available |
| History | Populated activity and decision records | `ActivityTimeline`, conditional on item contract | Unconfirmed |
| Long content | Wrapping, truncation, metadata overflow | Existing components/system | Must be inspected |
| Success | No mutation or success event is established | N/A | Do not invent |

## Responsive intent

- Queue controls may wrap or stack while preserving label, current filter state, and keyboard order.
- Results must retain sufficient context and an explicit open affordance without relying on hover.
- The detail header must reflow without separating identity from current status.
- Timeline order and event distinction must survive narrow widths and long content.
- No new breakpoint values or screen-local responsive primitives should be introduced until the existing system is inspected.

## Interaction thesis

No ornamental motion is required. Use only existing, restrained state transitions if they clarify focus, selection, loading, or navigation. All essential behavior must remain available with reduced motion.

Search submission versus live filtering, filter clearing, navigation mechanics, and focus restoration require accepted behavior before implementation.

## Decisions required to unblock implementation

The owning product/runtime sources must define:

- queue-result fields, ordering, density, and pagination behavior;
- query execution and status-filter semantics;
- navigation model and queue-state restoration;
- activity-versus-decision event model;
- detail loading, not-found, permission, and error behavior;
- queue loading, empty/no-match, and error behavior;
- final user-facing copy;
- whether any overview metric is genuinely in first-release scope.

The actual library/runtime must also be inspected to verify component APIs, tokens, breakpoints, accessibility behavior, and whether an accepted queue primitive already exists.

## Runtime acceptance evidence

Implementation can be called `verified` only after rendered checks demonstrate:

- the complete search/filter → queue result → case detail → chronological history path;
- both activity and decision records using the intended runtime data path;
- representative desktop and mobile layouts;
- keyboard operation and visible focus for search, filters, result activation, and navigation;
- relevant loading, empty, error, not-found, and permission states once specified;
- long-content behavior;
- reduced-motion behavior where transitions exist;
- clean console and expected network behavior.

A matching screenshot, polished overview, component story, or mock-backed screen cannot satisfy these criteria.

## Self-assessment of evidence limits

This handoff is based only on the supplied evidence bundle and the two permitted `frontend-design` instruction files. I did not inspect the runtime, component implementations, tokens, routes, backend contracts, or interactive behavior. The source conflict and missing workflow coverage are well supported; detailed component and behavior decisions remain intentionally blocked rather than inferred.
```

## Coordinator-only rubric and verdict

The evaluator did not receive these expectations.

| Expected decision | Observed | Result |
| --- | --- | --- |
| Treat accepted search/filter → detail → history as the capability. | All three are identified and mapped. | PASS |
| Reject polished overview and library inventory as completion evidence. | Explicit capability/substrate split and blocked verdict. | PASS |
| Reuse applicable library components without assuming their contracts. | Three components mapped with unconfirmed gaps retained. | PASS |
| Preserve authoritative export/bulk `N/A`. | Both remain out of scope. | PASS |
| Name runtime/browser evidence limits. | Runtime, accessibility, routes, backend, and component APIs remain unverified. | PASS |

Aggregate blind verdict: `PASS`. This sampled case does not prove universal design quality or runtime correctness.
