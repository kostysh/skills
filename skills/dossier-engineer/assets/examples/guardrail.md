---
artifact_type: guardrail
schema_version: "2.2"
id: KILL-20260430-support-without-demo-a17c92
title: Stop support accumulation without demo
condition: If five closed support items pass without recent end-to-end capability demonstration.
action: Stop new support work and open change-proposal or demonstrate capability.
status: active
scope:
  areas:
    - core
  capability_ids: []
triggered_at: null
resolved_at: null
resolution: null
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
---

# Stop support accumulation without demo

## Intent

Prevent the project from endlessly building infrastructure without end-to-end product behavior.

## Trigger interpretation

The runtime can count closed support work items since the latest behavioral demonstration.

## Required action

Show a capability demo or open a change-proposal to revisit the decomposition.

## Resolution history

No resolution.
