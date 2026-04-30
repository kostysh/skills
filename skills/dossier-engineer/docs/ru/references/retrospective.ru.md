# Retrospective protocol

Retrospective analysis improves the dossier process without adding hidden telemetry or central state files.

## 1. Canonical inputs

Retrospective reports derive from:

- source artifacts;
- capability artifacts;
- baseline artifacts;
- guardrail artifacts;
- work items;
- source reviews;
- stage events;
- verification artifacts;
- review artifacts;
- hygiene artifacts;
- changesets.

No JSONL session index or database is used.

## 2. Process misses

Process miss — recorded case where the process allowed friction, ambiguity, drift, false progress, stale evidence, or avoidable rework.

Process misses are stored in changeset frontmatter or work item body, then summarized by `retro create`.

Suggested fields when recorded in changeset:

```yaml
process_misses:
  - kind: capability_drift
    summary: Support work was created before capability demo was defined.
    affected_artifacts:
      - WI-20260430-session-db-a17c92
    severity: medium
    suggested_change: Add guardrail for support work without demo.
```

Kinds:

- `capability_drift`;
- `infrastructure_masquerade`;
- `missing_demo`;
- `weak_anti_claim`;
- `late_concept_review`;
- `support_chain_too_long`;
- `source_drift`;
- `stale_evidence`;
- `merge_conflict`;
- `runtime_friction`;
- `ambiguous_command`;
- `other`.

## 3. Skill feedback

Skill feedback records changes that could improve methodology or runtime.

Suggested fields:

```yaml
skill_feedback:
  - topic: guardrail-output
    summary: guardrail check should show the exact support items that triggered the criterion.
    suggested_change: Include support chain evidence in Next actions.
    priority: high
```

Feedback must be actionable. Do not record vague dissatisfaction without a concrete process or runtime adjustment.

## 4. Capability drift tracking

Capability drift occurs when backlog or implementation moves away from the concept or from observable behavior.

Examples:

- feature item became infrastructure-only;
- demo scenario proves only internal state;
- acceptance criteria prove mocks/status records but not system behavior;
- anti-claims hide essential user expectation;
- support work accumulates without a demonstrated capability;
- existing capability was assumed but not baseline-observed.

Record drift in changeset:

```yaml
capability_drift:
  - capability_id: CAP-20260430-resume-investigation-a17c92
    work_item_id: WI-20260430-session-db-a17c92
    drift_type: infrastructure_masquerade
    summary: Work proved storage mechanics but not resume behavior.
    resolution: Opened follow-up capability work and guardrail.
```

## 5. Retrospective command

```bash
dossier-engineer retro create --since <date-or-ref> --until <date-or-ref>
```

Runtime scans canonical artifacts and creates a derived `RETRO-*.md` report.

Report must include:

- completed capability work count;
- completed support work count;
- support-to-capability ratio;
- behavioral demo pass/fail/blocked counts;
- concept-conformance pass/fail/blocked counts;
- source-review counts;
- stale evidence counts;
- guardrails added/triggered/resolved;
- existing baseline capabilities observed/unverified/partial;
- process misses grouped by kind;
- skill feedback grouped by topic;
- recurring blockers;
- merge conflicts or conflict-prone artifacts;
- recommendations.

## 6. Retrospective interpretation

Red flags:

- many support items closed without new or maintained capability demo;
- capability work often fails concept-conformance review;
- anti-claims repeatedly hide necessary behavior;
- guardrails trigger often and are resolved by decision without evidence;
- existing project baseline has many `assumed` or `unverified` capabilities;
- reviews become stale often due to late spec changes;
- agents frequently repair frontmatter, indicating command friction.

Healthy signals:

- capabilities have clear claims and demos;
- support work is short and linked to capabilities;
- guardrails rarely trigger or trigger early;
- existing baseline separates observed behavior from assumptions;
- concept-conformance review catches weak slices before implementation;
- changesets explain capability progress, not just code changes.

## 7. Using retrospective results

After reading retro report:

1. Add or adjust guardrails when support accumulation is visible.
2. Tighten capability claim requirements when demos are weak.
3. Add verification profiles when behavioral demos are manual too often.
4. Clarify runtime next actions when process misses are caused by command ambiguity.
5. Split capabilities when broad claims create vague work items.
6. Retire or mark unverified capabilities that lack evidence.
7. Update concept sources when repeated drift indicates unclear product intent.

Retrospective report is derived. It must not be used as direct closure evidence.
