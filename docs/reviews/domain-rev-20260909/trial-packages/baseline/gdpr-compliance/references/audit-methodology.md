# GDPR Architecture Audit Methodology

## Start here

Use this reference whenever the task is to audit a PRD, architecture, specification, implementation, operational workflow, vendor integration, or release decision for GDPR risk.

The audit goal is not to prove legal compliance. The goal is to find places where the system design or implementation lacks observable behavior needed to satisfy GDPR obligations, then state the required constraints, evidence gaps, and verification obligations.

## Audit flow

### 1. Establish source authority and currentness

Classify authority by the claim being made:

| Source type | What it can establish |
| --- | --- |
| Current applicable law, court decisions, and final regulator guidance | Legal constraint; record jurisdiction, status, and as-of date when currentness matters |
| Accountable controller decision and documented processor instructions | Organisational decision or instruction; neither overrides applicable law |
| Legal counsel analysis and independent DPO advice | Specialist interpretation, advice, and monitoring; the DPO is not the controller's approval or risk-acceptance owner |
| Signed contracts, DPA/SCC material, vendor terms | Contractual and operational evidence, not proof that a role, basis, or transfer is lawful |
| Approved PRD, spec, ADR, architecture brief | Intended product or architecture behavior |
| Code, config, logs, tests, CI, infrastructure | Implemented or observed behavior to the strength of the evidence |
| README, comments, diagrams, backlog items | Supporting evidence only unless locally authoritative |

If sources conflict, report the conflict and apply authority only to the claim it can support. For volatile matters such as adequacy, transfer tools, regulator guidance, or national DPIA lists, check official current status when tools permit. Label drafts and consultations as provisional. If currentness cannot be verified, continue the engineering audit but state the limit and do not make a current-law approval claim.

### 2. Define audit scope

State:

- target system, feature, workflow, integration, or release;
- data subjects involved;
- personal data categories, including inferred and pseudonymised data;
- purposes, lawful-basis candidates, accountable decision status, and missing basis;
- controller/processor/joint-controller/sub-processor/recipient roles;
- in-scope environments and each activity's evidenced technical activation status:
  production, staging, dev, CI, demos, support, analytics, observability,
  backups, or other discovered environments;
- operational human and service identities used for environment access,
  administration, support, review, deployment, CI, observability, or backups;
- third parties, countries/regions, support access, subprocessors, and onward transfers;
- explicit exclusions and why they are out of scope.

### 3. Build the processing map

For each processing activity, capture:

| Field | Meaning |
| --- | --- |
| Purpose and basis state | Specific purpose, candidate basis, accountable decision status, and any Article 9/10 condition or authority needed |
| Data subjects | People whose data is processed |
| Data categories | Direct identifiers, indirect identifiers, online identifiers, special categories, criminal data, children, employees, location, behavioural events, content |
| Operational identities | Human or service identities used to access or operate an environment, including identity provider or mailbox account identifiers, their purpose, provider, environments, access boundary, retention, and personal-data classification |
| Source | User input, device, browser, third party, internal inference, vendor, import, log, support interaction |
| Operation | Collection, storage, access, display, sharing, inference, profiling, training, export, deletion, retention, anonymisation |
| System surfaces | UI, API, service, database, object store, queue, cache, search index, log, trace, metric, analytics, support/admin tool, backup, non-production |
| Environment activation | For every in-scope environment, `active`, `inactive`, `planned`, or `unknown` technical status and the evidence that supports it |
| Recipients | Internal roles, services, vendors, processors, subprocessors, recipients, public disclosure |
| Location and transfer | Hosting region, support region, backup region, transfer mechanism, onward transfer |
| Retention and deletion | Retention period or criterion, deletion trigger, backup aging, vendor deletion, derived-data handling |
| Access boundary | Human access, service access, tenant boundary, role-based controls, audit evidence |
| Evidence | PRD/spec/code/config/vendor evidence or missing evidence |

Include derived and secondary processing. Personal data can be created by inference, enrichment, aggregation with small cohorts, profile scores, embeddings, identifiers, logs, or support workflows.

Do not treat application users as a complete identity inventory. Record
operational identities even when they exist only in an access provider, mailbox,
support tool, deployment system, CI, logs, or backups. Do not place passwords,
OTP values, API tokens, cookies, or other authentication secrets in the
processing map.

Technical activation evidence establishes only whether processing appears
active, inactive, planned, or unknown in an environment. It does not establish
a lawful-basis decision, controller approval, legal conclusion, DPO advice,
vendor approval, or release authorization. Keep those authority states and
their evidence separate.

### 4. Audit by artifact type

#### PRD and product brief

Look for:

- personal data needed to deliver the stated user value;
- optional vs necessary processing;
- purposes separated by user value, security, analytics, marketing, support, legal, and product improvement;
- user-facing transparency and control expectations;
- consent, withdrawal, objection, portability, access, correction, erasure, restriction, and automated-decision implications;
- high-risk triggers: special category, criminal, children, employees, biometric, location, large-scale monitoring, profiling, AI training, automated significant decisions;
- acceptance criteria that can pass without privacy behavior.

Common PRD gap: "track engagement to improve product" without data categories, purpose boundary, lawful-basis candidate, opt-out/consent consequence, retention, or analytics vendor constraints.

#### Architecture, ADR, and RFC

Look for:

- data-flow diagrams that include hidden stores and operational tools;
- trust boundaries, tenant boundaries, access boundaries, and admin/support boundaries;
- data minimisation at collection, API, event, log, analytics, and vendor boundaries;
- consent and preference state as an enforceable dependency, not only UI state;
- deletion and correction propagation through derived stores, queues, indexes, vendors, and backups;
- retention enforcement, including scheduled deletion/anonymisation and backup aging;
- observability that avoids unnecessary personal data while still detecting privacy/security incidents;
- vendor and transfer controls before data leaves the system;
- breach detection, triage, containment, notification routing, and evidence preservation;
- migration/rollback plan for privacy-sensitive data model changes.

Common architecture gap: a system includes "central analytics pipeline" but does not define consent gating, event minimisation, regional storage, retention, vendor terms, or deletion of user-linked events.

#### Specification and tickets

Look for:

- normative requirements that are falsifiable;
- edge cases for consent missing/withdrawn, account deletion, identity verification for rights requests, partial erasure exceptions, retention expiry, vendor failure, and cross-region blocking;
- acceptance criteria that exercise behavior instead of checking fields exist;
- audit evidence requirements, event names, logs, and dashboards that do not leak personal data;
- negative tests for blocked processing, not only happy-path tests;
- operational handoff for manual rights or breach workflows.

Common spec gap: "user can delete account" with acceptance only that account row is removed, while analytics, invoices, support tickets, search indexes, backups, and vendors are not addressed.

#### Implementation and runtime evidence

Look for actual behavior. Read `implementation-evidence.md` when auditing code, config, tests, or runtime artifacts.

Common implementation gap: code stores full request payloads in logs or traces even though the spec says data is minimised.

### 5. Convert controls to findings

A useful finding has:

- severity;
- short title;
- evidence location or missing evidence;
- affected processing activity;
- affected GDPR control;
- risk to data subjects or system accountability;
- required observable capability;
- substrate that is insufficient by itself;
- recommended architecture/spec constraint;
- verification path;
- legal/DPO escalation when needed.

Do not write findings as "missing document" unless the missing document blocks a control decision. Prefer "No enforceable retention expiry for support attachments" over "No retention policy".

### 6. Handle uncertainty and status

Use these finding and control-disposition statuses:

| Status | Meaning |
| --- | --- |
| `control_evidenced` | Reliable evidence supports the required control behavior for the assessed boundary; this is not a broader compliance verdict |
| `confirmed_gap` | Evidence shows required behavior is absent or wrong |
| `missing_evidence` | Required behavior may exist, but no reliable evidence was found |
| `accountable_or_specialist_decision_needed` | Engineering cannot choose the controller's basis, legal interpretation, DPIA result, transfer mechanism, contract position, or substitute for DPO advice |
| `assumption` | Proceeding with stated assumption; risk if false |
| `not_in_scope` | Excluded with reason |

For high-risk processing, missing evidence is often a finding, not a neutral note.

Report audit coverage separately:

| Assessment status | Meaning |
| --- | --- |
| `COMPLETE_FOR_STATED_SCOPE` | Every material surface found in the stated scope has a control disposition; this does not mean gap-free or compliant |
| `PARTIAL` | Some in-scope surfaces or evidence remain unassessed; list the coverage limit |
| `ASSESSMENT_BLOCKED` | Missing authority, target, or evidence prevents a defensible assessment of a material boundary |

When a processing or release gate is requested, use `BLOCK` for any unresolved P0/P1, material high-risk evidence gap, or required accountable decision. Before `NO_ENGINEERING_BLOCKER_IDENTIFIED_IN_ASSESSED_SCOPE`, enumerate every applicable accountable decision and cite evidence that it is resolved; a candidate, assumption, omitted status, advice request, or future follow-up remains `BLOCK`. Never shorten the bounded status to `PASS` or invent missing evidence.

### 7. Avoid false positives

Do not require a product to implement every GDPR right as a self-service UI. Manual verified processes can be valid if they meet timing, identity, propagation, and evidence requirements. The architecture finding is whether the system and operations can satisfy the right, not whether every control is automated.

Do not demand consent for every processing activity. Consent is one lawful basis and is fragile when not freely given or when processing is necessary for the service. The audit should flag missing lawful-basis decision and invalid consent architecture, not force consent everywhere.

Do not treat anonymised data as personal data when anonymisation is robust and irreversible. Do challenge anonymisation claims when keys, rare attributes, small cohorts, linkable datasets, vendor access, logs, or auxiliary data make re-identification reasonably possible.

## Finding wording

Prefer concrete phrasing:

- "P1: Optional analytics events can be emitted before consent state is loaded."
- "P0: The architecture sends health data to a third-party model provider without documented Article 9 exception, transfer mechanism, or retention boundary."
- "P1: Account erasure does not propagate to search indexes or support attachments."
- "P2: PRD acceptance criteria for export can pass without including profile-derived data."

Avoid weak phrasing:

- "Needs GDPR compliance."
- "Add privacy policy."
- "Make deletion GDPR-compliant."
- "Use encryption."

## Handoff shape

For downstream architecture/spec work, hand off constraints such as:

- "No analytics SDK or event dispatch may run until consent state permits that purpose."
- "Retention expiry must remove or irreversibly anonymise identifiers in event store, search index, and derived profile table."
- "Article 15 access must cover personal data in the assessed stores, including relevant inferred data; Article 20 portability must be specified separately and only for data and processing within its applicability conditions."
- "Support tool may display only the minimum fields needed for the support workflow and must log human access without exposing full payloads."

These are not implementation tickets. They are constraints and acceptance obligations.
