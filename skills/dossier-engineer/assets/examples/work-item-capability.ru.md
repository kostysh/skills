---
artifact_type: work_item
schema_version: "2.2"
id: WI-20260430-resume-session-6f31c2
title: Resume prior investigation from dossier state
type: feature
lifecycle: planned
owners:
  - agent
area:
  - core
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors:
      - resume-investigation
delivery:
  kind: capability
  capability_refs:
    - capability_id: CAP-20260430-resume-investigation-a17c92
      relation: introduces
  support_reason: null
acceptance:
  criteria:
    - id: AC-20260430-resume-works-a1b2c3
      kind: behavior
      text: Operator can resume a prior investigation and continue from the last unresolved blocker.
      source_ref:
        source_id: SRC-20260430-product-concept-a17c92
        anchor: resume-investigation
      status: active
  coverage_gate: open
demonstration:
  name: Resume investigation demo
  scenario: Operator starts a new process, asks to resume a prior dossier, system loads context, reports unresolved blocker, and after restart continues from that blocker.
  falsifiers:
    - System only creates a session row but cannot explain prior context.
anti_claims:
  - This work does not implement autonomous deployment.
challenge:
  recorded: true
  latest_event_id: STG-20260430-resume-challenge-a1b2c3
risk:
  implementation:
    - state
  policy: []
review_policy: risk_weighted
dependencies: []
blocks: []
blockers: []
stage_state:
  feature-intake: closed
  spec-compact: closed
  plan-slice: closed
  implementation: not_started
  change-proposal: not_started
post_close_hygiene:
  implementation: not_started
material_scope_hash: 4fdc000000000000000000000000000000000000000000000000000000000000
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T13:00:00Z"
---

# Resume prior investigation from dossier state

## Summary

Реализовать наблюдаемое resume behavior для предыдущей работы по досье.

## Capability relation

Introduces `CAP-20260430-resume-investigation-a17c92`.

## Source interpretation

Concept требует durable continuation, not just persisted session rows.

## Scope

In scope: loading prior dossier context, explaining remembered state, continuing from unresolved blocker.

## Acceptance criteria notes

Behavior criterion must be proven by behavioral demo.

## Demonstration notes

Demo must include restart/continuity check.

## Anti-claims notes

Does not make the system act autonomously without operator approval.

## Pre-implementation challenge

Self-deception risk: implementation may only persist a session row and pass repository tests without real resume behavior.

## Dependencies and blockers

None.

## Implementation notes

To be filled during implementation.

## Verification notes

Behavioral demo required.

## Review notes

Concept-conformance and spec-conformance reviews required.

## Closure notes

Not closed.

## Process notes

None.
