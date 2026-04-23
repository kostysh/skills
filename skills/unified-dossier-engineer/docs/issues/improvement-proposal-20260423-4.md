# Improvement Proposal: restore a portable session provenance contract for stage artifacts

Issue ID: `ISS-02`

Primary owner skill: `unified-dossier-engineer`

## Problem

Current stage-controller behavior records `trace_locator_kind: session_id` while still allowing `session_id: null`.

The deeper issue is not that the runtime fails to auto-discover a session id. The problem is that the skill no longer exposes a clear, portable, explicit contract for session provenance when stage artifacts are written.

That creates three failures at once:

- stage artifacts claim a session-based locator without actually carrying a session id;
- the contract becomes implicitly tied to one runtime-specific environment assumption;
- the agent has no canonical way to provide known session provenance to the CLI.

## Why This Matters

Portable skills should not depend on hidden runtime discovery rules.

If stage artifacts need session provenance, the contract must be explicit and agent-controlled. Otherwise:

- provenance can silently degrade to `null`;
- the skill becomes coupled to one agent runtime's env layout;
- later retrospective tooling receives broken linkage and has to compensate with manual reconstruction.

## Current Active Surface

Relevant active references:

- [Commandized stage control](../../references/commandized-stage-control.md)
- [Runtime and command boundary](../../references/runtime-and-command-boundary.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Unified artifact topology](../../references/unified-artifact-topology.md)

## Required Correction

Restore an explicit, portable provenance input contract for stage artifacts.

The expected model is:

- the agent resolves session provenance;
- the agent passes it explicitly into the CLI/runtime;
- the runtime records what it was explicitly given;
- the runtime must not silently write `trace_locator_kind: session_id` with a missing session id.

For this issue, the canonical no-session branch should be fail-closed for normal stage-controller writes:

- if the stage-controller path requires session provenance and the agent does not provide `--session-id`, the shipped path must block rather than emit contradictory session metadata.

## What Must Change

### 1. Explicit stage-controller input

Add an explicit stage-controller input for session provenance, at minimum `--session-id`.

If additional provenance fields are needed, they must remain portable and explicitly passed, not inferred from one runtime's session store layout.

### 2. Fail-closed provenance semantics

The artifact contract must stop producing the contradictory combination:

- `trace_locator_kind: session_id`
- `session_id: null`

For the bounded scope of this issue, the required behavior is:

- stage-controller bootstrap and update paths that write stage log or stage-state must fail closed when `--session-id` is required but absent;
- they must not substitute a silent null fallback;
- minimum downstream lifecycle/session-index compatibility work is in scope only as needed so that the authoritative readers handle the corrected contract truthfully.

### 3. Portability boundary

The active guidance must state that runtime-specific env variables may be convenience inputs only, not the canonical contract.

The contract must remain usable when the operator runs the skill under another agent runtime.

### 4. Affected shipped surface

The explicit provenance contract must apply consistently across every shipped stage-controller path that bootstraps or updates stage logs and stage-state.

It is not enough to fix only one command or one write path.

## External Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Key review outcome:

- direction was correct, but the draft needed one exact no-session branch instead of an open-ended either/or;
- the shipped-surface scope needed to cover every stage-controller write path, not an implied subset;
- the implementation boundary needed to permit minimum lifecycle/session-index compatibility work required by the truthful contract.

## Acceptance Criteria

This issue is fixed only when:

- stage-controller help and active guidance define an explicit session provenance input contract;
- every shipped stage-controller path that bootstraps or updates stage logs/state uses that explicit provenance contract;
- stage artifacts no longer emit `trace_locator_kind: session_id` together with `session_id: null`;
- when `--session-id` is required but absent, the stage-controller write path fails closed instead of silently emitting degraded session metadata;
- the documented contract keeps session resolution on the agent side rather than inside runtime-specific session-store discovery;
- authoritative lifecycle/session-index readers handle the corrected provenance contract truthfully;
- docs and tests protect the portable explicit-input model;
- runtime-specific convenience inputs, if kept, are clearly documented as optional and non-canonical.

## Mandatory Planning And Implementation Constraint

Any future planning or implementation for this issue must stay tightly scoped to explicit stage-artifact provenance.

Mandatory boundaries:

- change only the CLI contract, artifact semantics, and the minimum tests/docs needed to make provenance truthful and portable;
- do not add Codex-specific trace-store lookup or any other runtime-specific auto-discovery as the primary behavior;
- do not widen this issue into broader artifact-schema cleanup, artifact-link arrays, skill linkage, or retrospective-tool redesign;
- allow only the minimum authoritative lifecycle/session-index compatibility work needed to preserve truthful provenance handling for the corrected contract;
- if additional provenance fields become necessary, add only those needed for this contract and record further ideas as separate follow-ups.

## Non-Goals

- Do not implement automatic lookup of session ids from a Codex-local session store.
- Do not couple the skill to one runtime's private file layout or environment contract.
- Do not fold general stage-log schema expansion into this issue.
