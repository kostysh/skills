---
artifact_type: capability
schema_version: "2.2"
id: CAP-20260430-resume-investigation-a17c92
title: Resume prior investigation
status: intended
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors:
      - resume-investigation
claim:
  actor: operator
  trigger: asks the system to resume a prior investigation
  observable_behavior: system loads the prior dossier context and identifies unresolved blockers
  system_response: system explains what it remembers and proposes the next safe action
  state_change: resumed session state is associated with the active dossier
  continuity: after restart, the system can resume from the same unresolved blocker
anti_claims:
  - This capability does not provide autonomous deployment.
demo_evidence: []
owner: agent
area:
  - core
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:30:00Z"
---

# Resume prior investigation

## Summary

A user or operator can continue previous dossier work without losing context.

## Concept interpretation

This capability supports durable project memory and explainable continuation.

## Observable behavior

The operator asks to resume work; the system shows the saved context, the latest unresolved blocker, and the next safe action.

## Anti-claims

This capability does not mean autonomous action without operator approval.

## Demonstrations

The demonstration will be recorded through the `capability demo record` runtime command.

## Notes

Frontmatter is created by the runtime, not manually.
