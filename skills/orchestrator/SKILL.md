---
name: orchestrator
description: Coordinate agents working toward one requested outcome. Use when
  delegating work, managing dependencies between assignments, or combining agent
  handoffs. Leave standalone tasks and delivery planning to their usual owners.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f96a8e4e019baf7032b11757b28de4e0e2d6e0fb34151f09ca8500b9c9b48213
---

# orchestrator

## Start here

1. Identify the requested outcome, how to check it, and which actions are authorized. You own the combined result.

## When to use this skill

- Work needs separate contributors or an independent check, or you are taking over existing agent assignments.

## When NOT to use this skill

- Handle a small self-contained task directly. A request for a plan alone belongs with the planner.

## Workflow stages

### Workflow stage: Assign ready work

Split work only where a separate contribution is useful.

1. Identify what each assignment consumes and produces. Start independent assignments together when useful. Hold dependent work until its input is agreed, then give consumers the same version. Assign one writer per shared output and sequence overlapping changes.
2. Give each agent a brief with its deliverable, source, allowed actions and evidence to return. Pass along relevant project rules and specialist guidance. Keep a required reviewer independent of the author.
3. Track the owner, current input and outstanding handoff in the conversation or existing project record. Continue your own ready work while agents run. Wait when the next action needs their result.

### Workflow stage: Reconcile the results

Check the assembled work against the original request.

1. On a changed input, notify affected owners, reopen stale results and resume them on the agreed version. Keep unrelated work moving. Before reassigning interrupted work, check what the first owner already did and whether they can still write.
2. Inspect each returned result and its evidence. Resolve gaps with the responsible agent or within your authority. Verify that the pieces work together and cover every requested outcome.

## Portability rules

- Use the available agent and messaging facilities within existing permissions. If delegation is unavailable, do the authorized work directly and leave any required independent decision with its owner.

## Portability checklist before finishing

- Give the requester the combined result, the evidence that supports it, and any open dependency or decision with its owner. Respect the requested stopping point.
