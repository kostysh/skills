# Artifact contract

All canonical dossier artifacts are Markdown files with YAML frontmatter. Runtime creates and changes frontmatter. The agent edits only body sections after scaffold creation.

## 1. Machine-owned and agent-owned zones

Machine-owned:

- `artifact_type`;
- `schema_version`;
- IDs;
- timestamps;
- source hashes;
- lifecycle and stage states;
- delivery kind and capability relations;
- capability status and claim fields;
- guardrail status;
- baseline membership;
- material scope hashes;
- review and verification freshness references;
- canonical artifact links.

Agent-owned:

- prose summary;
- interpretation and rationale;
- implementation notes;
- demo details;
- reviewer notes;
- verification interpretation;
- retrospective notes;
- evidence details in body sections.

If an agent-owned body section contains new structured facts, enter them through a runtime command and then update the body prose.

## 2. Canonical directories

```text
docs/dossier/project.md
docs/dossier/sources/SRC-*.md
docs/dossier/capabilities/CAP-*.md
docs/dossier/baselines/BASE-*.md
docs/dossier/guardrails/KILL-*.md
docs/dossier/work-items/WI-*.md
docs/dossier/source-reviews/SR-*.md
docs/dossier/stages/WI-*/*.md
docs/dossier/verification/WI-*/*.md
docs/dossier/reviews/WI-*/*.md
docs/dossier/hygiene/WI-*/*.md
docs/dossier/changesets/CS-*.md
docs/dossier/reports/*.md
docs/dossier/retro/RETRO-*.md
```

`reports/*.md` and `retro/*.md` are derived artifacts. They are not a source of truth for closure, queue readiness, or audit evidence.

## 3. ID contract

ID format:

```text
<PREFIX>-<YYYYMMDD>-<slug>-<entropy6>
```

Prefixes:

- `PRJ` - project;
- `SRC` - source;
- `CAP` - capability;
- `BASE` - baseline;
- `KILL` - guardrail / kill criterion;
- `WI` - work item;
- `SR` - source review;
- `STG` - stage event;
- `VER` - verification;
- `REV` - review;
- `HYG` - hygiene;
- `CS` - changeset;
- `RETRO` - retrospective report;
- `AC` - acceptance criterion;
- `BLK` - blocker.

Rules:

- no global counters;
- no sequential IDs;
- regenerate on collision;
- filename must match artifact ID.

## 4. Project artifact

Path: `docs/dossier/project.md`.

```yaml
artifact_type: dossier_project
schema_version: "2.2"
project_id: PRJ-20260430-example-a17c92
project_name: Example
review_mode: risk_weighted
capability_policy:
  require_concept_for_capabilities: true
  require_behavioral_demo_for_capability_closure: true
  require_anti_claim_for_capability_spec: true
  require_challenge_before_implementation: true
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
verification_profiles:
  default:
    commands: []
  behavioral-demo:
    commands: []
review_policy:
  capability_requires:
    - concept-conformance-reviewer
    - spec-conformance-reviewer
  code_requires:
    - code-reviewer
  risk_requires:
    security:
      - security-reviewer
guardrail_defaults:
  max_closed_support_without_recent_demo: 5
```

## 5. Source artifact

Path: `docs/dossier/sources/<id>.md`.

```yaml
artifact_type: source
schema_version: "2.2"
id: SRC-20260430-product-concept-a17c92
title: Product concept
source_path: docs/concept.md
source_kind: concept
authority: canonical
content_hash:
  algorithm: sha256
  value: <hex>
registered_at: "2026-04-30T12:00:00Z"
changed_at: null
status: active
tags: []
```

Enums:

- `source_kind`: `concept|architecture|specification|policy|contract|decision-record|test-plan|external-reference|code-reference|other`;
- `authority`: `canonical|supporting|informational|deprecated`;
- `status`: `active|deprecated|missing|removed`.

## 6. Capability artifact

Path: `docs/dossier/capabilities/<id>.md`.

```yaml
artifact_type: capability
schema_version: "2.2"
id: CAP-20260430-resume-investigation-a17c92
title: Resume prior investigation
status: intended
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors: []
claim:
  actor: null
  trigger: null
  observable_behavior: null
  system_response: null
  state_change: null
  continuity: null
anti_claims: []
demo_evidence: []
owner: agent
area:
  - core
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `status`: `intended|existing|partial|unverified|retired`.

Demo evidence shape:

```yaml
id: VER-20260430-resume-demo-3a1c9e
verdict: pass
summary: Operator resumed a prior investigation and state continuity was observed.
evidence:
  - path: docs/evidence/resume-demo.md
recorded_at: "2026-04-30T12:30:00Z"
```

Rules:

- `existing` requires at least one pass demo evidence or observed baseline link;
- `intended` requires concept source;
- `retired` requires reason in body or retirement event;
- incomplete claim blocks capability work closure.

## 7. Baseline artifact

Path: `docs/dossier/baselines/<id>.md`.

```yaml
artifact_type: baseline
schema_version: "2.2"
id: BASE-20260430-existing-product-a17c92
title: Existing product baseline
mode: existing-project
source_refs:
  - SRC-20260430-product-concept-a17c92
capabilities: []
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Capability membership shape:

```yaml
capability_id: CAP-20260430-resume-investigation-a17c92
status: observed
evidence:
  - docs/evidence/resume-demo.md
added_at: "2026-04-30T12:30:00Z"
notes: null
```

Enums:

- `mode`: `existing-project|release-snapshot|regression-baseline|manual`;
- membership `status`: `observed|assumed|unverified|partial|regressed`.

## 8. Guardrail artifact

Path: `docs/dossier/guardrails/<id>.md`.

```yaml
artifact_type: guardrail
schema_version: "2.2"
id: KILL-20260430-support-without-demo-a17c92
title: Stop support accumulation without demo
condition: If five closed support items pass without recent end-to-end capability demonstration.
action: Stop new support work and open change-proposal or demonstrate capability.
status: active
scope:
  areas: []
  capability_ids: []
triggered_at: null
resolved_at: null
resolution: null
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `status`: `active|triggered|resolved|retired`.

## 9. Work item artifact

Path: `docs/dossier/work-items/<id>.md`.

```yaml
artifact_type: work_item
schema_version: "2.2"
id: WI-20260430-resume-session-6f31c2
title: Resume prior investigation from dossier state
type: feature
lifecycle: defined
owners:
  - agent
area:
  - core
source_refs:
  - source_id: SRC-20260430-product-concept-a17c92
    anchors: []
delivery:
  kind: capability
  capability_refs:
    - capability_id: CAP-20260430-resume-investigation-a17c92
      relation: introduces
  support_reason: null
acceptance:
  criteria: []
  coverage_gate: open
demonstration:
  name: null
  scenario: null
  falsifiers: []
anti_claims: []
challenge:
  recorded: false
  latest_event_id: null
risk:
  implementation: []
  policy: []
review_policy: risk_weighted
dependencies: []
blocks: []
blockers: []
stage_state:
  feature-intake: not_started
  spec-compact: not_started
  plan-slice: not_started
  implementation: not_started
  change-proposal: not_started
post_close_hygiene:
  implementation: not_started
material_scope_hash: null
created_at: "2026-04-30T12:00:00Z"
updated_at: "2026-04-30T12:00:00Z"
```

Enums:

- `type`: `feature|fix|refactor|migration|research|test|documentation|operations|security|debt`;
- `lifecycle`: `defined|intaken|specified|planned|implemented|closed|retired`;
- `delivery.kind`: `capability|support|maintenance|exploration`;
- `delivery.capability_refs[].relation`: `introduces|extends|supports|maintains|verifies|retires`;
- `acceptance.criteria[].kind`: `behavior|contract|unit|integration|security|performance|accessibility|operational|documentation|support|negative|falsifier`;
- `stage_state.*`: `not_started|in_progress|blocked|ready_for_close|closed|reopened`;
- `coverage_gate`: `open|partial|green|not_applicable`.

Acceptance criterion shape:

```yaml
id: AC-20260430-resume-works-a1b2c3
kind: behavior
text: Operator can resume a prior investigation and continue from the last unresolved blocker.
source_ref:
  source_id: SRC-20260430-product-concept-a17c92
  anchor: resume-investigation
status: active
```

Acceptance `kind`: `behavior|contract|unit|integration|security|performance|accessibility|operational|documentation|support`.

Blocker shape:

```yaml
id: BLK-20260430-memory-scope-a1b2c3
kind: requirement-gap
summary: Memory boundaries between sessions must be defined.
blocking: true
created_at: "2026-04-30T12:00:00Z"
resolved_at: null
resolution: null
```

## 10. Source-review artifact

Path: `docs/dossier/source-reviews/<id>.md`.

```yaml
artifact_type: source_review
schema_version: "2.2"
id: SR-20260430-product-concept-9db014
source_id: SRC-20260430-product-concept-a17c92
previous_hash: <hex>
current_hash: <hex>
status: open
opened_at: "2026-04-30T12:00:00Z"
resolved_at: null
verdict: null
impacted_capabilities:
  - CAP-20260430-resume-investigation-a17c92
impacted_work_items:
  - WI-20260430-resume-session-6f31c2
```

Enums:

- `status`: `open|resolved|blocked`;
- `verdict`: `no_backlog_change|update_capabilities|update_existing_items|create_followups|retire_items|blocked_pending_decision|null`.

## 11. Stage event artifact

Path: `docs/dossier/stages/<work-id>/<id>.md`.

```yaml
artifact_type: stage_event
schema_version: "2.2"
id: STG-20260430-resume-plan-ready-1b8a2c
work_item_id: WI-20260430-resume-session-6f31c2
stage: plan-slice
event: ready
session_id: sess-20260430-agent-01
created_at: "2026-04-30T12:00:00Z"
summary: Slice, risks, challenge, and verification plan recorded.
linked_artifacts: []
```

Enums:

- `stage`: `feature-intake|spec-compact|plan-slice|implementation|change-proposal`;
- `event`: `start|note|blocked|ready|close|reopen|decision|challenge`.

## 12. Verification artifact

Path: `docs/dossier/verification/<work-id>/<id>.md`.

```yaml
artifact_type: verification
schema_version: "2.2"
id: VER-20260430-resume-behavioral-demo-8f22a0
work_item_id: WI-20260430-resume-session-6f31c2
stage: implementation
profile: behavioral-demo
evidence_class: behavioral
entrypoint: null
runtime_path: null
verdict: pass
commands: []
evidence: []
coverage_gate: green
created_at: "2026-04-30T12:00:00Z"
material_scope_hash: <hex>
```

Enums:

- `evidence_class`: `behavioral|contract|unit|integration|security|performance|manual|operational|documentation|support|live-app`;
- `verdict`: `pass|fail|blocked|not_applicable`.

`entrypoint` and `runtime_path` are required when `evidence_class` is
`live-app`. CLI flags use kebab-case (`--runtime-path`); stored frontmatter uses
snake_case (`runtime_path`).

Verification `material_scope_hash` is computed from the current normalized work
material scope: source hashes, capability claim, delivery kind, acceptance
criteria including negative/falsifier entries, anti-claims, demo/falsifier
surface, dependencies, risk, and required material `Spec Compact` / `Plan Slice`
subsections. Non-material note sections and insignificant whitespace must not
stale verification by themselves.

## 13. Review artifact

Path: `docs/dossier/reviews/<work-id>/<id>.md`.

```yaml
artifact_type: review
schema_version: "2.2"
id: REV-20260430-resume-concept-2bc719
work_item_id: WI-20260430-resume-session-6f31c2
stage: implementation
audit_class: concept-conformance-reviewer
verdict: pass
reviewer: independent-agent
created_at: "2026-04-30T12:00:00Z"
material_scope_hash: <hex>
reviewed_artifacts: []
findings: []
```

Enums:

- `audit_class`: built-in class or project-configured class;
- `verdict`: `pass|fail|blocked|not_applicable`.

Built-in review classes:

- `concept-conformance-reviewer`;
- `spec-conformance-reviewer`;
- `code-reviewer`;
- `security-reviewer`;
- `release-reviewer`;
- `contract-reviewer`.

Review `material_scope_hash` uses normalized material scope. For
`stage=plan-slice`, it covers the work/source/capability/spec/plan material
scope. For implementation reviews, it also includes the current passing
`live-app` behavioral-demo evidence path when applicable, so reviews recorded
before final live-app evidence do not satisfy implementation closure.

There is no `consolidated-reviewer` class. Consolidation is represented by
fresh required review artifacts recorded after stabilization.

## 14. Hygiene artifact

Path: `docs/dossier/hygiene/<work-id>/<id>.md`.

```yaml
artifact_type: hygiene
schema_version: "2.2"
id: HYG-20260430-resume-impl-4e0aa3
work_item_id: WI-20260430-resume-session-6f31c2
stage: implementation
verdict: pass
checked_at: "2026-04-30T12:00:00Z"
checks:
  source_reviews: pass
  capability_claim: pass
  behavioral_demo: pass
  concept_conformance: pass
  status_overlay: pass
  queue_impact: pass
  attention: pass
  review_freshness: pass
```

## 15. Changeset artifact

Path: `docs/dossier/changesets/<id>.md`.

```yaml
artifact_type: changeset
schema_version: "2.2"
id: CS-20260430-resume-branch-d1c771
scope: current-branch
created_at: "2026-04-30T12:00:00Z"
sources: []
capabilities: []
baselines: []
guardrails: []
work_items: []
source_reviews: []
reviews: []
verification: []
hygiene: []
process_misses: []
skill_feedback: []
capability_drift: []
```

## 16. Retrospective artifact

Path: `docs/dossier/retro/<id>.md`.

```yaml
artifact_type: retrospective_report
schema_version: "2.2"
id: RETRO-20260430-week-18-72aa01
since: "2026-04-23T00:00:00Z"
until: "2026-04-30T23:59:59Z"
derived: true
created_at: "2026-04-30T12:00:00Z"
source_artifacts: []
```

## 17. Validation requirements

`dossier-engineer lint` validates:

- YAML frontmatter parses;
- required fields are present;
- enum values are valid;
- timestamps are UTC ISO strings;
- file path matches artifact type and ID;
- source refs exist;
- capability refs exist;
- existing capabilities have evidence;
- delivery kind matches type, acceptance, demo, and relation;
- support items have support reason;
- capability items have behavior criteria, demo scenario, anti-claims, and challenge;
- dependencies exist and have no cycles;
- blockers shape is valid;
- stage states are valid;
- review and verification freshness is valid;
- closure gates are valid;
- source hashes are current when source files exist;
- forbidden canonical state files are absent;
- generated reports are not used as closure proof.
