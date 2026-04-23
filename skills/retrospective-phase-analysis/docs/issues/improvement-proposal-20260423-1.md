# Improvement Proposal: harden retrospective automation around artifact-driven evidence

Issue ID: `ISS-04`

Primary owner skill: `retrospective-phase-analysis`

## Problem

The current retrospective tooling produces useful human analysis, but it still depends too much on manual overrides and weak fallbacks when evidence linkage is incomplete.

The grouped problems are one automation-hardening issue:

- artifact discovery still needs manual `--stage-log`, `--review-artifact`, and `--verification-artifact` overrides in cases that should be routine;
- same-session phase boundaries may require manual line cutoffs;
- scope narrowing is too noisy and can pull unrelated features or backlog items;
- parser metrics still fall back to brittle prose heuristics and can overcount or misclassify incidents.

## Why This Matters

The skill already states that the agent resolves `session_id` and canonical trace lookup before invoking the CLI. That boundary is good and should stay intact.

The remaining problem is inside retrospective automation itself:

- even with the right trace, the scan path is not low-friction enough;
- output quality still depends on operator cleanup;
- generated drafts can contain noisy scope or misleading metrics;
- the tool cannot yet rely on declared artifact state as strongly as it should.

## Current Active Surface

Relevant active references:

- [CLI](../../references/CLI.md)
- [PROJECT-ADAPTATION](../../references/PROJECT-ADAPTATION.md)
- [REFERENCE](../../references/REFERENCE.md)
- [SKILL-AUDIT-TEMPLATE](../../references/SKILL-AUDIT-TEMPLATE.md)

## Required Correction

Improve retrospective automation so that it prefers artifact-linked evidence, narrows scope conservatively, and treats legacy prose parsing as a fallback instead of a primary signal.

This issue should become the retrospective-side counterpart of stronger stage-artifact contracts, without breaking the explicit boundary that the agent owns session resolution.

## What Must Change

### 1. Artifact-driven discovery

When machine-complete stage artifacts are available, the retrospective workflow should find the relevant stage/review/verification/close-out bundle without routine manual overrides.

The discovery contract must stay conservative:

- weakly linked artifacts remain candidates until stronger evidence or explicit operator input resolves them;
- feature-id matching alone must not auto-include review or verification artifacts;
- manual overrides remain evidence-justified exceptions, not a sign that broad auto-inclusion is acceptable.

### 2. Better phase boundaries

Same-session retrospectives should stop depending on arbitrary manual line cutoffs when stronger phase evidence is available.

The solution should remain evidence-driven and bounded. It must not depend on runtime-specific session-store discovery that belongs to the agent side.

If same-session boundaries remain ambiguous after available evidence is evaluated, the workflow must fail closed by requiring an explicit operator boundary or by stopping with a clear ambiguity note. It must not widen scope heuristically.

### 3. Conservative scope narrowing

Scope construction should prefer explicit artifact-linked identity over broad trace mention extraction.

If scope remains ambiguous, the scan should degrade conservatively instead of widening into unrelated work.

### 4. Structured metrics first

Metrics and incident inference should prefer structured fields from artifacts.

Legacy prose parsing may remain as fallback compatibility, but structured values must win on conflict and prose fallback must not inflate totals or duplicate incidents when structured evidence exists.

## External Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Key review outcome:

- the overall direction was accepted;
- the draft needed explicit conservative fallback for unresolved phase ambiguity;
- the discovery section needed stronger artifact-gating rules so manual overrides are reduced by better linkage, not by widening;
- structured metrics needed explicit precedence over prose when both exist.

## Acceptance Criteria

This issue is fixed only when:

- retrospective scan can use artifact-linked discovery for the routine case without mandatory manual artifact overrides;
- weakly linked artifacts remain candidates only until stronger evidence or explicit operator input resolves them;
- same-session boundaries no longer rely on arbitrary line cutoffs when stronger evidence exists;
- if same-session boundary evidence remains ambiguous, the workflow requires an explicit operator boundary or stops with a clear ambiguity result instead of widening heuristically;
- scope narrowing prefers explicit artifact identity and degrades conservatively when still ambiguous;
- metrics and candidate incidents prefer structured artifact fields over prose heuristics when structured fields are present, with structured values winning on conflict and no prose-driven double counting;
- active docs and tests protect artifact-link gating, conservative ambiguity handling, structured-over-prose precedence, and the explicit boundary that session resolution remains agent-owned.

## Mandatory Planning And Implementation Constraint

Any future planning or implementation for this issue must stay tightly scoped to retrospective automation quality for the declared problems above.

Mandatory boundaries:

- change only the discovery, boundary, scope, metrics, rendering, and tests needed to solve these retrospective-tooling weaknesses;
- allow rendering changes only when they are strictly incidental to discovery, ambiguity handling, or metrics correctness for this issue;
- preserve the explicit contract that the agent resolves `session_id` before CLI execution;
- do not widen this issue into stage-controller schema work that belongs to `unified-dossier-engineer`;
- if solving this issue reveals a missing stage-artifact field, record that as a separate dependency or follow-up instead of silently extending this issue.

## Non-Goals

- Do not move `session_id` resolution into the CLI.
- Do not add Codex-specific session-store scraping to this skill.
- Do not redesign the full report style or narrative templates beyond what is required to remove the identified automation weaknesses.
