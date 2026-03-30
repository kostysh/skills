# Methodology: Turning Architecture Into A Versioned, Machine-Checkable Backlog Graph

## 1. Purpose

This methodology defines how to transform architecture into a backlog graph that is:

- architecture-faithful;
- reality-normalized;
- planning-ready;
- execution-safe;
- operable;
- drift-tolerant.

The output is not just a candidate list. The output is a versioned, machine-checkable backlog graph in which:

- every committed architecture claim is covered;
- every mandatory seam has an owner;
- every critical-path step is either real or explicitly tracked as a gap;
- every planning-horizon item is specification-ready and testable;
- every contract-changing item has compatibility and migration rules;
- every quality, security, and operability obligation is expressed as accountable work;
- every rollout has recovery logic;
- every replacement path includes retirement of the old path;
- every closure track is proved at assembled-system level;
- every run can be re-baselined when architecture or runtime drift occurs.

## 2. Failure Inventory Derived From The Full Chat History

The failure pattern that motivated this standard was:

1. architecture was translated into a flat backlog without reconstructing the whole system;
2. backlog states such as `candidate`, `confirmed`, and `intaken` were confused with delivery truth;
3. stub-backed or compatibility-only runtime seams were misread as real closure;
4. missing owner seams stayed hidden in prose;
5. already delivered seams were retrospectively reworded instead of adding new owner seams;
6. the backlog did not prove that it closes onto a real working system;
7. cross-cutting obligations such as auth/authz, deploy/rollback, and support/operability were omitted or left implicit;
8. critical artifacts such as owner maps, gap registers, and proof registers were not durable;
9. discovery ended at seam identification but did not fully formalize planning-ready slicing, contract governance, bounded uncertainty work, economic prioritization, retirement work, or drift management.

This methodology exists to prevent those exact failure modes.

## 3. Target Standard

An architecture-to-backlog run is only implementation-grade if it produces a backlog graph that is:

- topologically valid;
- safety-valid;
- economically ordered inside safe topological constraints;
- proof-bearing;
- reviewable;
- re-baselinable.

The sequencing formula is:

1. topological validity first;
2. then safety and closure;
3. then economics.

## 4. Hard-Fail Invariants

If any invariant below is violated, the run is incomplete.

1. 100% of relevant sources have authority status and precedence.
2. 100% of committed architecture claims map to backlog work or explicit defer/non-goal with revisit trigger.
3. 0 orphan backlog items.
4. 0 unowned mandatory seams.
5. 0 synthetic or manual-only steps on the canonical critical path without a separate real-runtime owner seam.
6. 0 unresolved fail-closed categories on the externally safe track.
7. 100% of interface-changing and data-changing items have compatibility and migration rules.
8. 100% of next-horizon items pass Definition of Ready.
9. 100% of items have measurable acceptance and proof bundle.
10. 100% of risky changes have rollout and recovery logic.
11. 100% of required role reviews are independent, durable, and evidence-based.
12. 0 hidden legacy obligations for replaced paths.
13. 100% of proofs have freshness rules and covered environments.
14. 100% of trust-boundary crossings have security and data-class ownership.
15. 0 backlog items mix incompatible semantic levels.

## 5. Scoring Rubric

Quality may be scored on top of the hard-fail gates:

1. Truth model and source authority: 10
2. Whole-system plus as-built reconstruction: 10
3. Claim coverage and ownership completeness: 15
4. Backlog ontology and decomposition quality: 15
5. NFR, policy, security, and compliance completeness: 10
6. Interface, data, and migration governance: 10
7. Planning readiness and acceptance specificity: 10
8. Sequencing, dependency graph, and economics: 10
9. Proof, rollout, rollback/recovery, and operability: 5
10. Review, drift management, retirement closure, and automation: 5

Interpretation:

- 95-100: implementation-grade standard
- 90-94: excellent, but still missing one or two major control loops
- 80-89: planning-grade only
- below 80: discovery incomplete

Acceptance semantics:

- any hard-fail means the run is incomplete and may be published only as `draft-only`;
- `planning-grade` is allowed only when there are no hard-fails, but the score is below implementation-grade threshold;
- `implementation-grade` requires no hard-fails and a score within the implementation-grade band.

## 6. Baseline Roles

The minimum baseline roles are:

1. Product strategy
2. System architecture
3. Application engineering
4. Platform / SRE
5. Security
6. QA / release
7. Support / operations

## 7. Backlog Graph Ontology

The backlog graph must explicitly distinguish work-item classes.

### 7.1 Mandatory work-item classes

1. Capability seam
2. Feature slice
3. Control / guardrail
4. Migration
5. Retirement / decommission
6. Spike / discovery
7. Operational enablement
8. Documentation / support enablement

### 7.2 Mandatory level-separation rule

The method must enforce:

- architecture seam != feature slice
- feature slice != implementation task
- control obligation != capability seam
- migration != replacement seam
- retirement work != implementation work

No item may mix those semantics.

### 7.3 Mandatory relation types

The graph must support at least:

- `realizes`
- `decomposes_into`
- `depends_on`
- `blocked_by`
- `governed_by`
- `migrates_from`
- `retires`
- `replaces`
- `proves`
- `reviewed_by`
- `belongs_to_track`
- `touches_contract`
- `touches_data_domain`
- `enabled_by`

Canonical direction rules:

- use `governed_by`, never `governs`;
- use `reviewed_by` from item/run to review artifact;
- use `belongs_to_track` from item to track.

## 8. Vocabulary, IDs, And Truth Model

## Phase -1. Canonicalize vocabulary and stable IDs

### Actions

1. Build a glossary and alias map.
2. Define canonical names for actors, systems, seams, tracks, contracts, data domains, and work items.
3. Define stable IDs for:
   - architecture claims;
   - ADRs;
   - seams;
   - tracks;
   - work items;
   - contracts;
   - quality budgets;
   - review artifacts;
   - proofs.

### Outputs

- glossary;
- alias map;
- stable ID scheme.

### Prevents

- terminology drift and broken traceability.

## Phase 0. Resolve source authority

### Source classes

1. Architecture documents
2. ADRs
3. Runtime and deployment contract
4. Delivered dossiers and SSOT
5. Code, runtime, deployment, and operational evidence
6. Backlog text

### Actions

1. Classify each source as:
   - authoritative target truth;
   - authoritative current truth;
   - historical context only;
   - superseded and excluded;
   - planning-only.
2. Record explicit precedence and exclusions.

### Outputs

- source-authority ledger.

### Rule

Backlog text can never override architecture, ADRs, dossiers, or runtime evidence.

## 9. State Model

Every item and every track must keep four separate state dimensions:

1. Backlog protocol state
2. Delivery state
3. Implementation readiness state
4. Operational closure state

If a compact display is needed, a summary label may be derived from those fields, but it must never replace them.

Allowed summary labels:

- `Implemented`
- `Partially implemented`
- `Planned`
- `Missing`
- `Blocked`
- `Needs clarification`

## 10. Required Durable Artifacts

The run is incomplete unless it durably produces:

1. Glossary and alias map
2. Stable ID scheme
3. Source-authority ledger
4. Whole-system reconstruction
5. As-built system and owner matrix
6. Architecture claim ledger
7. Negative-scope register
8. Quality-attribute matrix
9. Policy decision ledger
10. Interface and data contract ledger
11. Gap / contradiction / unknown register
12. Backlog graph
13. Roadmap matrix
14. Proof register
15. Review artifacts

Those artifacts may live in separate files or in canonical named sections, but they must be durable, linkable, and lintable.

## 11. The Method

## Phase 1. Reconstruct target system, value streams, and closure tracks

### Actions

1. Identify:
   - actors;
   - operator personas;
   - external consumer groups;
   - external dependencies;
   - trust boundaries;
   - durable state families;
   - control surfaces;
   - failure domains;
   - team and ownership assumptions.
2. Define three closure tracks:
   - minimal working system;
   - externally safe and operationally supportable system;
   - full target system.
3. Define at least one first shippable journey for each track:
   - target persona;
   - initiating trigger;
   - end-to-end workflow;
   - success condition;
   - support handoff.
4. Classify architecture promises into:
   - commit now;
   - defer;
   - optional bet;
   - out of scope.
5. Record revisit triggers for every deferred or optional promise.
6. Record quality goals and policy surfaces:
   - performance;
   - reliability;
   - privacy/compliance;
   - auditability;
   - scalability;
   - accessibility/localization, if applicable.

### Outputs

- whole-system model;
- value-stream model;
- closure-track model;
- strategy-horizon map;
- quality-goal map;
- policy map.

## Phase 2. Reconstruct as-built system, runtime, and org ownership

### Inputs

- code and runtime evidence;
- deployment/runtime contract;
- operational inputs where available:
  - runbooks;
  - alert inventory;
  - incident history;
  - support escalation patterns.

### Actions

1. Inventory actual:
   - services;
   - processes;
   - jobs;
   - APIs;
   - event surfaces;
   - queues;
   - state stores;
   - deployable units.
2. Record for each:
   - decision owner;
   - delivery owner;
   - runtime owner;
   - escalation owner;
   - consulted teams;
   - environment matrix;
   - vendor/external owner, if any.
3. Record:
   - ingress and egress interfaces;
   - canonical writers;
   - trust boundaries crossed;
   - data classes;
   - boot-critical versus degraded versus optional dependencies;
   - synthetic/manual-only behavior;
   - compatibility-only behavior.
4. If empirical ops inputs are absent, record that absence as an explicit unknown with owner implications.

### Outputs

- as-built system and owner matrix;
- deployable-surface inventory;
- ownership matrix;
- environment matrix.

## Phase 3. Extract claims, negative scope, quality attributes, contracts, and policy decisions

### Claim classes

Every claim must be typed as one of:

1. Functional capability
2. Control obligation
3. Interface contract
4. Data evolution
5. Migration
6. Retirement
7. Operational capability
8. Policy decision need

### Actions

1. Convert architecture and ADR prose into typed claims.
2. Run a negative-scope scan over phrases such as:
   - `optional`
   - `future`
   - `manual`
   - `trusted-local only`
   - `compatibility only`
   - `stub`
   - `health only`
   - `out of scope`
3. Extract quality promises and quality constraints.
4. Seed the interface/data contract ledger for any API, event schema, DB schema, or external integration change.
5. Seed the policy decision ledger for unresolved policy surfaces.

### Outputs

- architecture claim ledger;
- negative-scope register;
- quality-attribute matrix;
- interface and data contract seed list;
- policy decision ledger.

## Phase 4. Normalize reality, preserve lineage, classify gaps and uncertainty

### Actions

1. Compare every committed claim against the as-built system.
2. Normalize all claims and existing items across the four state dimensions.
3. Record:
   - partial delivery;
   - synthetic closure;
   - missing owners;
   - contradictions;
   - stale proofs.
4. Classify uncertainty into:
   - decision unknown;
   - integration unknown;
   - scale unknown;
   - security unknown;
   - policy unknown;
   - data unknown;
   - operability unknown.
5. Enforce immutable delivered lineage:
   - wording clarification is allowed;
   - semantic widening requires proof;
   - otherwise create a new owner seam.

### Outputs

- normalized status map;
- gap register;
- uncertainty register;
- stale-proof register;
- delivered-lineage notes.

## Phase 5. Construct owner seams and the backlog graph

### Actions

1. Build owner seams for:
   - committed capability claims;
   - control obligations;
   - migrations;
   - retirements;
   - operational enablement;
   - documentation/support enablement.
2. Create graph relations:
   - parent/child;
   - dependency;
   - track membership;
   - proof relation;
   - retirement relation;
   - migration relation.
3. Reject any item that has no claim, gap, control obligation, or decommission need behind it.

### Outputs

- backlog graph skeleton.

## Phase 6. Slice seams into planning-ready feature increments

### Mandatory slicing rules

Every feature slice must be:

- vertical, not horizontal;
- measurable in closure;
- bounded in blast radius;
- single-dominant in major uncertainty;
- single-dominant in rollback class.

Every slice must produce one of:

- user value;
- risk retirement;
- closure of a control obligation.

### Invalid examples

The method must reject items such as:

- "build service X"
- "add basic observability"
- "implement auth"
- "prepare infra"

unless closure, boundaries, and proof are explicit.

### Allowed slicing dimensions

Oversized seams must be split by one or more of:

- persona;
- workflow step;
- policy mode;
- contract version;
- data domain;
- rollout stage;
- migration stage.

### Outputs

- feature slices;
- control slices;
- migration slices;
- retirement slices.

## Phase 7. Bind interface, data, migration, and compatibility rules

For every item that changes an API, event schema, database schema, or external integration, require:

1. contract owner;
2. compatibility class:
   - backward;
   - forward;
   - breaking;
3. versioning strategy;
4. consumer impact list;
5. migration, backfill, or replay strategy;
6. canonical writer;
7. reconciliation strategy;
8. deprecation window;
9. retirement condition for the old contract.

### Outputs

- interface/data contract ledger with compatibility and migration governance.

## Phase 8. Bind NFR budgets, controls, and observability contracts

Every relevant seam or slice must map to measurable quality obligations such as:

- latency;
- throughput;
- concurrency;
- availability;
- durability;
- RPO;
- RTO;
- cost budget;
- privacy/compliance class;
- accessibility/localization duty;
- auditability/traceability;
- scalability envelope.

Also require:

- SLI/SLO definitions where applicable;
- alert thresholds;
- audit requirements;
- security controls;
- privacy controls;
- analytics obligations, if applicable.

### Outputs

- NFR and controls matrix;
- observability contract ledger.

## Phase 9. Convert uncertainty into bounded discovery work

Critical unknowns may not remain only as prose.

Every significant unknown must become either:

- resolved;
- downgraded to non-critical;
- or converted into a timeboxed spike.

Each spike must have:

- question;
- uncertainty class;
- owner;
- method of validation;
- expected artifact;
- exit criteria;
- kill criteria;
- max duration.

Unbounded spikes are forbidden.

### Outputs

- spike set;
- uncertainty-to-spike mapping.

## Phase 10. Bind proof, rollout, rollback/recovery, docs, and enablement

### Candidate-level proof bundle

Every item needs:

1. architecture trace;
2. implementation trace;
3. verification trace;
4. security trace, with `N/A` only if justified;
5. release trace;
6. rollback or recovery trace;
7. operability trace.

No proof dimension may be marked `N/A` unless:

- the exemption is valid for the item class;
- the justification is explicit;
- the exemption does not violate any hard-fail invariant or track gate.

### Class-sensitive proof applicability

#### Operational enablement

- implementation trace may point to runbooks, dashboards, alert routing, or support surfaces rather than code changes;
- rollout mode may be `N/A` if no production behavior changes and the justification is explicit;
- rollback/recovery trace may point to operational fallback or handoff reversal rather than software rollback.

#### Documentation / support enablement

- implementation trace may point to documentation/support artifacts rather than code changes;
- rollout mode and rollback class may be `N/A` if no production behavior changes and the justification is explicit;
- operability trace must still identify the supported audience, handoff path, and artifact freshness expectations.

### Mandatory reproducibility fields

Every proof bundle must include:

- exact command, artifact, or procedure;
- environment covered;
- commit or build covered;
- freshness rule.

### Rollout governance

Every risky change must define:

- rollout mode:
  - dark launch;
  - canary;
  - shadow;
  - phased;
  - big bang;
- feature flag or kill switch, if applicable;
- rollback or recovery model;
- temporary controls and their retirement dates.

### Rollback / recovery classes

Require explicit classification:

- deploy rollback;
- config/secret rollback;
- schema/data rollback;
- forward-fix only;
- backup/restore;
- replay/rebuild;
- no safe rollback.

### Enablement

Require:

- support training, if needed;
- user docs, if needed;
- operator docs and runbooks, if needed;
- release notes.

### Track-level assembly proof

Each closure track needs system-level proof covering:

- boot and startup dependencies;
- end-to-end shippable journey;
- operator/control path;
- degraded-mode exercise;
- release gate execution;
- rollback or recovery rehearsal;
- observability and alert routing;
- runbook and escalation path.

## Phase 11. Apply Ready gates, estimate bands, and planning constraints

### Definition of Ready

A planning-horizon item passes DoR only if:

- behavior is described;
- happy path and error paths are defined;
- acceptance examples exist;
- interface and data impact are described;
- NFR impact is known;
- security/privacy impact is known;
- rollout strategy exists;
- rollback/recovery class exists;
- observability contract is defined;
- required proof is defined;
- docs/support impact is described;
- estimate band and confidence are stated;
- unresolved questions are below threshold.

Any baseline Ready condition may be marked `N/A` only when a class-specific profile explicitly allows it and the justification is recorded.

### Class-specific DoR profiles

In addition to the baseline DoR, the following class-sensitive rules apply.

#### Feature slice

- the slice is vertical, not horizontal;
- acceptance examples are concrete;
- contract and data impacts are bounded;
- rollout mode is chosen;
- a single dominant uncertainty is identified.

#### Migration

- source and target states are explicit;
- compatibility window is explicit;
- migration/backfill/replay method is explicit;
- canonical writer and reconciliation rules are explicit;
- stop/go checkpoint is defined.

#### Retirement / decommission

- replaced path is identified;
- cutoff trigger is defined;
- dependent consumers are identified;
- cleanup scope is explicit across code, flags, secrets, docs, dashboards, alerts, and residual data.

#### Spike / discovery

- the question is singular and bounded;
- max duration is explicit;
- exit artifact is explicit;
- kill criteria are explicit;
- no implementation work is hidden inside the spike.

#### Control / guardrail

- the control objective is explicit;
- the enforcing surface is explicit;
- fail-open versus fail-closed behavior is explicit;
- verification and monitoring evidence is defined.

#### Operational enablement

- the operational audience is explicit;
- enablement artifacts are identified;
- runtime and escalation owners are identified where applicable;
- any `N/A` rollout or rollback fields are justified explicitly.

#### Documentation / support enablement

- audience and scope are explicit;
- source-of-truth artifact is identified;
- freshness/update trigger is identified;
- any `N/A` rollout or rollback fields are justified explicitly.

### Definition of Done

An item reaches Done only if:

- code and infrastructure changes are complete;
- tests and verification are complete;
- dashboards, alerts, traces, and logging exist where required;
- runbooks and support handoff exist where required;
- migrations/backfills are executed safely or scheduled safely;
- release notes and docs are updated where required;
- flags and kill switches are defined and governed where required;
- retirement obligations for temporary mechanisms are recorded.

Any baseline Done condition may be marked `N/A` only when a class-specific profile explicitly allows it and the justification is recorded.

### Class-specific DoD profiles

In addition to the baseline DoD, the following class-sensitive rules apply.

#### Feature slice

- end-to-end acceptance examples pass;
- the production-facing proof bundle is fresh;
- rollout and recovery behavior are rehearsed or otherwise evidenced.

#### Migration

- migration or backfill has executed safely, or an explicitly approved gated execution step exists;
- reconciliation evidence exists;
- old-write-path status is explicit;
- rollback versus forward-fix decision has evidence.

#### Retirement / decommission

- the old path is disabled or kept behind an explicitly governed residual gate;
- dependent assets are removed or converted into explicit residual cleanup items;
- the consumer impact window has ended or is explicitly governed;
- cleanup proof exists.

#### Spike / discovery

- the promised artifact is produced;
- decision, next action, or kill outcome is recorded;
- follow-on items are linked;
- the spike closes without silently continuing as implementation work.

#### Control / guardrail

- the control is enforced on the canonical path;
- alerting/audit evidence exists where required;
- bypass rules, if any, are governed and reviewed;
- residual exceptions are recorded.

#### Operational enablement

- required operational artifacts exist and are linked;
- ownership and escalation surfaces are current;
- enablement proof is fresh;
- any `N/A` code-change or rollback fields are justified explicitly.

#### Documentation / support enablement

- required documentation/support artifacts exist and are published to the intended audience;
- freshness/update owner is assigned;
- support handoff or usage guidance is linked where required;
- any `N/A` code-change or rollback fields are justified explicitly.

### Additional planning constraints

Every item must carry:

- estimate band;
- confidence level;
- external lead-time risk;
- staffing/skill constraints;
- blocked-by-decision status, if applicable.

## Phase 12. Build the roadmap by topology, safety, economics, and milestone exits

### Ordering logic

1. topological validity first;
2. then safety and closure;
3. then economics.

### Economic prioritization factors

Within a valid and safe layer, order by:

- strategic fit;
- dependency unlock;
- user value;
- ops pain reduction;
- risk burn-down;
- compliance deadline;
- learning value;
- reversibility;
- cost of delay;
- lead-time risk.

### Economic tie-break precedence

If multiple items remain equivalent after dependency and safety ordering, break ties in this order:

1. compliance or external deadline;
2. irreversible risk burn-down;
3. dependency unlock;
4. cost of delay;
5. user value or ops pain reduction;
6. learning value;
7. reversibility;
8. lead-time risk.

### Matrix requirements

For every item, record:

- item class;
- parent and children;
- track and milestone;
- four separate state dimensions;
- summary label derived from them;
- dependency type;
- economic priority note;
- proof relation;
- retirement relation, if any.

## Phase 13. Independent review, scoring, and acceptance

### Rules

1. Review must be independent, durable, and evidence-based.
2. Simulated review may exist only as draft analysis.
3. If independent review is unavailable, acceptance is blocked.

### Required review artifact fields

- reviewer identity;
- role;
- findings ordered by severity;
- evidence references;
- hard-fail report;
- score contribution;
- verdict.

### Review applicability matrix

Unless a formal waiver is granted, all baseline roles are required for every implementation-grade run.

Minimum applicability by change surface:

- all runs:
  - Product strategy
  - System architecture
  - Application engineering
- runtime, deployment, environment, rollback, observability, support, or operational changes:
  - Platform / SRE
  - Support / operations
- auth/authz, trust-boundary, data-class, secret, policy, or exposure changes:
  - Security
- any run targeting planning-grade or implementation-grade acceptance:
  - QA / release

### Waiver rule

A role waiver is allowed only when:

- the role is not impacted by item class, track, or change surface;
- the waiver is explicit;
- the reviewer granting the waiver is identified;
- the rationale and expiry/revisit trigger are recorded.

No waiver is allowed for implementation-grade runs if the role is directly impacted by the change surface.

### Required acceptance class

Every run must end in one of:

- draft-only;
- planning-grade;
- implementation-grade.

### Acceptance gate

- `draft-only`:
  - any hard-fail exists;
  - independent review is missing;
  - mandatory durable artifacts are incomplete.
- `planning-grade`:
  - no hard-fails;
  - durable artifacts are complete;
  - independent review exists;
  - score is below implementation-grade threshold.
- `implementation-grade`:
  - no hard-fails;
  - durable artifacts are complete;
  - independent review exists;
  - score meets implementation-grade threshold.

## Phase 14. Publish, freeze, automate, and re-baseline

### Publication requirements

1. Version the output.
2. Export machine-readable ledgers.
3. Maintain traceability links between claims, items, proofs, reviews, and retirements.
4. Run lint checks.

### Required lint checks

Lint must detect:

- orphan items;
- unmapped claims;
- stale evidence;
- missing owners;
- missing compatibility class;
- items without rollout/recovery;
- flags without retirement owner/date;
- externally safe track with unresolved fail-closed gaps.

### Drift management

Re-baseline triggers include:

- accepted or changed ADR;
- runtime topology change;
- incident showing false closure;
- security finding;
- breached SLO or NFR;
- new external dependency;
- owner/team boundary change;
- release or rollback path change.

### Delta run outputs

A delta run must answer:

- which claims changed;
- which backlog items became stale;
- which proofs became stale;
- which track gates must be recalculated.

## 12. Extended Item Schema

Every work item must support at least:

- Item ID
- Item class
- Parent ID / children IDs
- Architecture claim IDs
- ADR IDs
- Policy decision IDs, if any
- Track / milestone
- Backlog protocol state
- Delivery state
- Implementation readiness state
- Operational closure state
- Summary label
- Capability or control added
- Persona / operator served
- Product or operator value
- Why now
- Canonical owner surfaces
- Decision owner
- Delivery owner
- Runtime owner
- Escalation owner
- Interfaces touched
- Data domains touched
- Trust boundaries crossed
- Actor / role set
- Data class
- Quality budgets / NFR impact
- Compatibility class
- Migration / backfill / replay strategy
- Consumer impact
- Rollout mode
- Feature flag / kill switch
- Observability contract
- Docs / support / enablement impact
- Estimate band / confidence
- Unknown class / spike link
- Required proof
- Rollback / recovery class
- Retirement trigger / legacy assets to remove
- Evidence freshness SLA

## 13. Anti-Patterns This Methodology Forbids

1. Flat architecture-to-table translation without whole-system reconstruction.
2. Using backlog protocol state as delivery truth.
3. Counting stubs, simulators, or manual-only paths as closure.
4. Rewriting delivered seams instead of creating new owner seams.
5. Hiding missing owners only in prose.
6. Horizontal-only backlog items without closure ownership.
7. Unbounded spikes.
8. Items that mix decision-making and implementation.
9. Items with no measurable acceptance.
10. Contract-changing items without compatibility class.
11. Feature flags without retirement owner or date.
12. Temporary migration code without cleanup item.
13. Items whose only value is "technical improvement" without capability or risk linkage.
14. Assumed policy decisions hidden inside engineering tasks.
15. NFR obligations expressed only as prose.

## 14. Role-Review Synthesis That Shaped This Standard

The actual multi-role review in this work pushed the methodology from discovery-strong to planning- and execution-strong:

- Product forced strategy horizons, first shippable journeys, and value-aware ordering.
- Architecture forced source-authority resolution, seam inventories, and track-level closure proof.
- Engineering forced explicit state separation, durable artifacts, and as-built ownership mapping.
- Platform forced deployable-surface mapping, rollback classes, and fail-closed external-safety gates.
- Security forced universal security traces and trust-boundary/data-class ownership.
- QA/Release forced reproducible proof, freshness rules, and independent acceptance artifacts.
- Support/Ops forced empirical operational inputs, explicit support ownership, and system-level operability rehearsal.

## 15. Operator Extraction, Edit, And Freshness Contract

This section defines the operator-facing methodology contract that must be stable without requiring the agent to infer workflow from CLI source code.

### 15.1 Extraction checklist

For every create or edit request, the agent must execute this checklist before authoring or registering any packet:

1. Classify every input as one of:
   - `architecture_doc`
   - `adr`
   - `runtime_evidence`
   - `deployment_contract`
   - `delivered_dossier_ssot`
   - `code_evidence`
   - `operational_evidence`
   - `backlog_text`
2. Assign authority to every input:
   - `authoritative_target_truth`
   - `authoritative_current_truth`
   - `historical_context_only`
   - `superseded_excluded`
   - `planning_only`
3. Identify which durable sections of canonical state are affected.
4. Decide whether the request requires:
   - authoritative prose inputs only as semantic source material for the agent;
   - new authoritative current-truth evidence;
   - explicit packet authoring by the agent;
   - or both evidence and packet authoring.
5. Author explicit packet files when the CLI needs machine-readable graph input.
6. Register sources and packet refs only through the bundled CLI.
7. After any create or edit workflow, rerun the appropriate CLI command so canonical state is recomputed through the normal run lifecycle.

Normative clarification:

- prose interpretation belongs to the agent;
- packet authoring belongs to the agent;
- canonical graph materialization belongs to the CLI;
- support for embedded packet blocks, if present in runtime code, is an implementation detail and is not part of the normal methodology contract.

### 15.2 Decision table: prose inputs, packets, and recomputation

| Scenario | Allowed path | Forbidden path |
| --- | --- | --- |
| Create a new backlog from architecture, ADR, or runtime sources | agent reads authoritative prose inputs, authors explicit packet files, then runs `discover` with source refs and packet refs | expecting the CLI to derive backlog meaning from prose by itself; manually assembling canonical files without `discover` |
| Enrich an existing run with new current truth | add authoritative-current evidence, author packet updates as needed, then rerun `discover` | editing `delivery_state` directly without evidence |
| Edit owner, `depends_on`, roadmap, or general planning fields on an item | explicit packet with planning overlay, then rerun `discover` | hand-editing `backlog.json` |
| Edit `Gap`, `Unknown`, or create `Spike` | explicit packet, then rerun `discover` | changing unrelated sections through a generic edit path |
| Update `delivery_state` | evidence-backed authoritative-current input, plus packet authoring when needed, then rerun `discover` | planning-only packet edit of `delivery_state` |
| Mark a claim as `deferred`, `optional`, or `negative scope` | explicit packet with planning-decision overlay that changes only commitment-related fields, then rerun `discover` | rewriting claim identity, class, or source trace with planning-only data |

### 15.3 Mapping: operator intent to packet sections

| Operator intent | Packet sections | Default authority/kind | Merge policy |
| --- | --- | --- | --- |
| Create backlog from architecture | `id_strategy`, `glossary`, `aliases`, `target_system`, `value_streams`, `tracks`, `claims`, `negative_scope`, `quality_attributes`, `policy_decisions`, `contracts`, `data_domains` | authoritative target-truth prose sources interpreted by the agent | source-driven upsert through agent-authored packet files |
| Add current truth | `as_built`, `track_gates`, `track_journeys`, `unknowns`, `uncertainty_to_spike`, `delivered_lineage_notes`, `items`, `relations`, `proofs`, `track_proofs`, `reviews`, `waivers` | authoritative current-truth evidence interpreted by the agent | upsert |
| Change general item data | `items` | planning-only packet authored by the agent | targeted item upsert only |
| Change linked Spike question | `items` for `spike_discovery`, optionally `uncertainty_to_spike` | planning-only packet authored by the agent | upsert |
| Change Gap | `gaps` | planning-only packet authored by the agent | upsert |
| Change Unknown | `unknowns` | planning-only packet authored by the agent | upsert |
| Create timeboxed Spike | `items`, `relations`, optionally `uncertainty_to_spike` and `roadmap_matrix` | planning-only packet authored by the agent | upsert |
| Change owner | `items` | planning-only packet authored by the agent | upsert |
| Change `depends_on` | `relations`, optionally `roadmap_matrix` | planning-only packet authored by the agent | upsert |
| Update `delivery_state` from current truth | `items` and/or `as_built` through an evidence-backed current-truth input | authoritative current-truth evidence interpreted by the agent | upsert |
| Mark claim as `deferred`, `optional`, or `negative scope` | `claims`, `negative_scope` | planning-decision packet authored by the agent | upsert of commitment-related fields only |

### 15.4 Explicit packet restrictions

These restrictions are mandatory:

1. Explicit packet files are authored by the agent. The operator is not expected to author packet content directly.
2. Methodology-owned artifacts must be created and updated only through the bundled CLI. The agent must not use ad hoc generators, mutation scripts, or direct editors for canonical artifacts.
3. `replace_sections` is forbidden for targeted operator edits. It is allowed only for full source-driven refresh of a section.
4. A planning overlay may not change immutable identity fields:
   - `claim_id`, `claim_class`
   - `contract_id`
   - `domain_id`
   - identity entries in the source-authority ledger
5. For claim commitment edits, a planning overlay may change only:
   - `claim.commitment`
   - `claim.revisit_trigger`
   - `negative_scope` entries and their links
6. `source_refs` in packet-authored entries must remain system-traceable and may not degenerate into arbitrary manual strings.
7. Every explicit packet must preserve enough provenance to identify:
   - the source ref it came from or extends;
   - the source kind and authority;
   - whether it is acting as a source-driven refresh or a planning overlay.
8. `delivery_state` changes remain admissible only when backed by authoritative current-truth evidence rather than planning-only intent.

### 15.5 Edit semantics and guardrails

#### General rule

Every edit scenario must end with canonical recomputation through the bundled CLI; operator edits are not allowed to patch canonical files directly.

#### Scenario boundaries

- General item edit may change only planning fields that are not reserved for special scenarios.
- A linked Spike question edit may change only the `question` of the target `spike_discovery` item.
- Gap edit may change only:
  - `title`
  - `severity`
  - `owner_implications`
  - `related_claim_refs`
  - `related_item_refs`
  - `fail_closed_category`
  - `resolution_state`
  - `downgraded_severity`
  - `resolution_note`
- Unknown edit follows the same resolution field boundaries as Gap edit, plus severity and linkage fields.
- Owner edit may change only `owners.*`.
- `depends_on` edit may change only the directed `depends_on` relation and any roadmap projection needed to keep ordering consistent.
- `delivery_state` edit is admissible only when backed by authoritative current-truth evidence.
- Claim coverage edit for `deferred`, `optional`, or `negative scope` is restricted to claim commitment fields and canonical `negative_scope` representation.

#### Canonical rule for `negative_scope`

Operator-facing `negative scope` must be represented canonically as:

1. `claim.commitment=out_of_scope`
2. a `negative_scope` register entry with at least:
   - `negative_scope_id`
   - `title`
   - `negative_scope_class`
   - `source_refs`
   - `owner_implications`
   - `related_claim_refs`
   - `related_item_refs`
   - `revisit_trigger`
3. if `negative_scope_class` implies manual or synthetic closure semantics, the entry must additionally include:
   - `critical_path_item_refs`
   - `owner_seam_item_refs`

If the operator asks only for `deferred` or `optional`, update only `claim.commitment` and `claim.revisit_trigger` without creating `negative_scope` until an actual out-of-scope decision exists.

#### Transition rules for Gap and Unknown

Gap and Unknown follow the same state machine:

- `open -> resolved`
  - requires `resolution_note`
- `open -> downgraded`
  - requires both `resolution_note` and `downgraded_severity`
- `downgraded -> resolved`
  - requires a new `resolution_note`
- `resolved -> open`
  - allowed only when triggered by new authoritative input or drift reassessment

Validation must hard-fail invalid transitions.

#### Evidence-based delivery state

The methodology requires:

- `delivery_state=delivered` and `delivery_state=partially_delivered` only when supported by current-truth evidence;
- admissible evidence sources are:
  - `runtime_evidence`
  - `deployment_contract`
  - `delivered_dossier_ssot`
  - `code_evidence`
  - `operational_evidence`
- a planning-only packet may not move an item to `partially_delivered` or `delivered`.

Validation must hard-fail any delivery-state flip that lacks evidence-backed current-truth input.

#### Spike authoring rule

The minimum required fields for a new `spike_discovery` item are:

- `item_id`
- `title`
- `item_class=spike_discovery`
- `track_id`
- `uncertainty_class`
- `question`
- `validation_method`
- `expected_artifact`
- `max_duration`
- `kill_criteria`
- `exit_criteria`
- `follow_on_item_refs`

The only fields that may be inherited automatically are:

- `track_id`
- owners
- related `Unknown`
- basic `origin_ref`

Inheritance is allowed only when the parent item and related Unknown are unambiguous; otherwise the workflow must stop for disambiguation. If required spike fields are missing, the agent must first return the missing-field list instead of creating the spike.

### 15.6 Review staleness and rebaseline readiness

#### Stale review artifact

A review artifact is stale if any of the following holds:

1. `review_scope=run` and `reviewed_at < last_rebaseline_at`
2. `review_scope=item` and the reviewed item is in `stale_items`
3. `review_scope=track_proof` and the reviewed track proof depends on `stale_proofs` or requires recalculation by `track_gate_ids_to_recalculate`
4. `review_scope=run` and any dirty flag that changes run acceptance or closure appeared after `reviewed_at`
5. the reviewed scope no longer satisfies the review applicability matrix

#### Rule after rebaseline

`rebaseline` removes drift against the baseline but does not automatically refresh review artifacts.

After `rebaseline`:

- every run-scope review issued before `last_rebaseline_at` becomes stale;
- item-scope and track-proof reviews become stale only when their actual scope is in stale or recalculated surfaces, or when applicability changed.

#### Rebaseline readiness

`rebaseline_readiness.status` is:

- `allowed` when:
  - `assessment.status=pass`
  - `rebaseline_required=true`
  - no `hard_fails`
  - no `stale_items`
  - no `stale_proofs`
  - no `stale_review_artifacts`
  - no `missing_review_roles`
  - no `pending_track_proof_reviews`
  - no `track_gate_failures`
- `not_needed` when `rebaseline_required=false`
- `blocked` in every other case

`reasons` must enumerate blockers or the cause of `not_needed`.

### 15.7 Command freshness lineage semantics

The methodology uses the following run-level semantics:

- `command_run_id` is created for every top-level CLI invocation, including standalone recovery `render`;
- auto-render that closes a mutating command must reuse the same `command_run_id` as the preceding phase events of that command;
- a retry or repeated invocation after failure must receive a new `command_run_id` and may not reuse lineage from the previous attempt;
- `render_reason` is one of:
  - `mutating_command`
  - `recovery_render`
- the canonical command-outcome event for stale lineage is `report_rendered` with `render_reason=mutating_command`;
- only command-level snapshots from mutating commands participate in `New Stale Since Last Change`;
- intermediate phase events inside the same command may exist for diagnostics but must not participate in stale-diff comparison;
- if there is no previous command-level stale snapshot, operator-facing output must show `Unknown` with reason `first recorded snapshot; no previous stale snapshot to diff`.

## 16. Final Operating Instruction

An architecture-to-backlog run is complete only when it can answer, with durable evidence:

1. What is the system?
2. Which sources are authoritative?
3. What exists now?
4. What is synthetic, partial, optional, or manual-only?
5. Which committed claims remain uncovered?
6. Which seams own each mandatory capability?
7. Which items are capability seams, slices, controls, migrations, retirements, spikes, or enablement work?
8. Which items are planning-ready now?
9. Which contracts, migrations, and retirements are required?
10. Which quality budgets and control obligations are binding?
11. In what order must items land, and why?
12. What proof closes each item?
13. What proof closes each track?
14. Which items remain blocked, stale, or unclear?
15. Does the roadmap end in a real, runnable, deployable, supportable system?

If any answer is missing, the run is incomplete.

## Appendix A. Validation Contract

This appendix defines the minimum machine-checkable validation contract behind the standard.

### A.1 Required fields by item class

All items require:

- `item_id`
- `item_class`
- `track_id`
- `backlog_protocol_state`
- `delivery_state`
- `readiness_state`
- `closure_state`
- `summary_label`
- `origin_ref[]`
- `owners`
- `dependencies`
- `proof_refs`

Allowed `origin_ref` kinds:

- `claim_ref`
- `gap_ref`
- `control_obligation_ref`
- `policy_decision_ref`
- `decommission_need_ref`
- `review_finding_ref`
- `unknown_ref`

Additional required fields by class:

- `Capability seam`:
  - `capability_added`
  - `owner_surfaces`
  - `real_closure_definition`
- `Feature slice`:
  - `parent_seam_id`
  - `persona`
  - `acceptance_examples`
  - `rollout_mode`
- `Control / guardrail`:
  - `control_objective`
  - `enforcing_surface`
  - `fail_mode`
- `Migration`:
  - `source_state`
  - `target_state`
  - `compatibility_class`
  - `migration_strategy`
  - `canonical_writer`
- `Retirement / decommission`:
  - `replaces_or_retires_ref`
  - `retirement_trigger`
  - `legacy_assets`
- `Spike / discovery`:
  - `uncertainty_class`
  - `question`
  - `validation_method`
  - `expected_artifact`
  - `max_duration`
  - `exit_criteria`
  - `kill_criteria`
  - `follow_on_item_refs`
- `Operational enablement`:
  - `runbook_or_enablement_artifact`
  - `runtime_owner`
  - `escalation_owner`
- `Documentation / support enablement`:
  - `doc_audience`
  - `doc_scope`

### A.2 Allowed relations by item class

- `Capability seam`:
  - may `decomposes_into` feature slices, controls, migrations, retirements, and enablement items
  - may `depends_on`, `governed_by`, `proves`
  - must `belongs_to_track`
- `Feature slice`:
  - must `realizes` exactly one parent seam
  - may `depends_on`, `blocked_by`, `touches_contract`, `touches_data_domain`, `governed_by`, `proves`
  - must `belongs_to_track`
- `Control / guardrail`:
  - must be the target of one or more `governed_by` relations
  - may `depends_on`, `proves`
- `Migration`:
  - must `migrates_from` exactly one source path or contract
  - may `depends_on`, `retires`, `governed_by`, `proves`
  - must `belongs_to_track`
- `Retirement / decommission`:
  - must `retires` at least one old path, contract, asset, or flag
  - may `depends_on`, `governed_by`, `proves`
  - must `belongs_to_track`
- `Spike / discovery`:
  - may `enabled_by` a parent unknown
  - may `depends_on`, `reviewed_by`
  - may not parent implementation work
  - must `belongs_to_track`
- `Operational enablement`:
  - may `enabled_by`, `depends_on`, `governed_by`, `proves`
  - must `belongs_to_track`
- `Documentation / support enablement`:
  - may `enabled_by`, `depends_on`, `governed_by`, `proves`
  - must `belongs_to_track`

Run-level review artifacts:

- backlog runs and track-closure artifacts must `reviewed_by` one or more review artifacts
- implementation-grade runs must `reviewed_by` all required roles after waiver evaluation

### A.3 Enum constraints

- `item_class`:
  - `capability_seam`
  - `feature_slice`
  - `control_guardrail`
  - `migration`
  - `retirement`
  - `spike_discovery`
  - `operational_enablement`
  - `documentation_support_enablement`
- `summary_label`:
  - `Implemented`
  - `Partially implemented`
  - `Planned`
  - `Missing`
  - `Blocked`
  - `Needs clarification`
- `compatibility_class`:
  - `backward`
  - `forward`
  - `breaking`
- `rollout_mode`:
  - `dark_launch`
  - `canary`
  - `shadow`
  - `phased`
  - `big_bang`
- `rollback_class`:
  - `deploy_rollback`
  - `config_secret_rollback`
  - `schema_data_rollback`
  - `forward_fix_only`
  - `backup_restore`
  - `replay_rebuild`
  - `no_safe_rollback`
- `uncertainty_class`:
  - `decision_unknown`
  - `integration_unknown`
  - `scale_unknown`
  - `security_unknown`
  - `policy_unknown`
  - `data_unknown`
  - `operability_unknown`

### A.4 Freshness validation rules

Every `proof_ref` must include:

- covered commit or build;
- environment;
- execution timestamp;
- freshness SLA or invalidation trigger.

A proof is stale if:

- covered code or contract changed after proof execution;
- runtime/deployment topology changed;
- linked track gate changed;
- freshness SLA expired.

### A.5 Orphan detection logic

An item is orphaned if any of the following is true:

- it has no `origin_ref`;
- it has no allowed parent or governing relation for its class;
- it has no owner;
- it has no track;
- it has no proof requirement.

### A.6 Trace-closure rules

Automated validation must prove:

1. every committed claim maps to one or more items, or explicit defer/non-goal;
2. every next-horizon item maps to at least one proof;
3. every externally safe track gate maps to owned control work;
4. every contract-changing item maps to compatibility and migration governance;
5. every replacement path maps to at least one retirement item;
6. every implementation-grade run maps to independent review artifacts for all required roles after waiver evaluation.

### A.7 Review applicability and waiver validation

Automated validation must determine required roles from:

- target acceptance class;
- impacted tracks;
- item classes present;
- change surfaces touched.

Default role rules:

- all runs require:
  - `product_strategy`
  - `system_architecture`
  - `application_engineering`
- runs touching runtime, deployment, rollback/recovery, observability, support, or enablement require:
  - `platform_sre`
  - `support_operations`
- runs touching auth/authz, trust boundaries, secrets, policy, data class, or exposure require:
  - `security`
- runs targeting `planning-grade` or `implementation-grade` require:
  - `qa_release`

Waiver validation rules:

- a waiver must identify:
  - waived role;
  - granting authority;
  - rationale;
  - expiry or revisit trigger;
- a waiver is invalid if the waived role is directly impacted by track, item class, or change surface;
- `implementation-grade` runs may not pass with an invalid or missing required-role waiver.
