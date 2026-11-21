---
name: orchestrator
description: Coordinate agents working toward one requested outcome. Use when
  delegating work, managing dependencies between assignments, or combining agent
  handoffs. Leave standalone tasks and delivery planning to their usual owners.
metadata:
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 5e93c98375931c2cb12a8c118827e71b7c748146c6812848ac236520d5d3d2c6
---

# orchestrator

## Start here

1. Identify the requested outcome, how to check it, and which actions are authorized. You own the combined result.
2. Apply the project's development method, if any, to your plan and each assignment.

## When to use this skill

- Work needs separate contributors or an independent check, or you are taking over existing agent assignments.

## When NOT to use this skill

- Handle a small self-contained task directly. A request for a plan alone belongs with the planner.

## Workflow stages

### Workflow stage: Assign ready work

Choose the simplest approach that meets the request and its constraints. Split work where a separate contribution helps.

1. Identify what each assignment consumes and produces. Start independent assignments together when useful. Hold dependent work until its input is agreed, then give consumers the same version. Assign one writer per shared output and sequence overlapping changes.
2. Give each agent its deliverable, inputs, allowed actions and evidence to return. Assign each check to one owner. Share only relevant guidance. Keep a required reviewer independent of the author.
3. Track owners, input versions and handoffs in the conversation or existing project record. Continue ready work and wait only for a blocking result or decision. Use a stable handoff as soon as its required checks pass, even if its author is still running.

### Workflow stage: Reconcile the results

Check the assembled work against the original request.

1. On a changed input, notify affected owners, reopen stale results and resume them on the agreed version. Keep unrelated work moving. Before reassigning interrupted work, check what the first owner already did and whether they can still write.
2. Inspect each handoff. If it adds unrequested complexity, have the author simplify it unless a concrete requirement, constraint or material risk justifies it.
3. Accept checks that cover the current result. Before repeating one, identify the changed input, gap in coverage or independence requirement that justifies it. Test only what remains, including interactions between parts. If blocked, the owner changes approach or hands off the gap and the blocker.

## Portability rules

- Use the available agent and messaging facilities within existing permissions. If delegation is unavailable, do the authorized work directly and leave any required independent decision with its owner.

## Portability checklist before finishing

- Give the requester the combined result, the evidence that supports it, and any open dependency or decision with its owner. Respect the requested stopping point.
