---
name: gdpr-compliance
description: Audit architecture, specs, plans, or systems for EU GDPR risks
  involving collection, inference, storage, logging, transfer, profiling,
  retention, deletion, or sharing of personal data. Produce controls, findings,
  evidence gaps, and handoffs—not legal advice, certification, or policy prose.
compatibility: Portable documentation-only skill. It ships active audit
  references and artifact templates, but no runtime. All mandatory GDPR
  architecture audit guidance lives inside this folder.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: fa555193b2a5ff7f40d8f028b742a9926c0c5acb8a87bb22278a37ca26e44297
---

# gdpr-compliance

## Start here

1. Treat GDPR as a system architecture constraint, not as a request to draft compliance documents.
2. Separate observable privacy/compliance capability from substrate such as policies, data maps, checklists, flags, empty endpoints, migrations, logs, or tests.
3. Scope whether GDPR may apply, what personal data is processed, who the data subjects are, and which controller/processor roles are in play.
4. Build or update a processing and data-flow map before approving architecture, specs, vendors, analytics, telemetry, retention, deletion, AI use, or implementation behavior.
5. Route legal interpretation to legal counsel and DPO advice to the DPO; keep controller accountability and engineering risk identification explicit.
6. Produce findings, architecture constraints, and handoff obligations; do not claim legal compliance certification.

## When to use this skill

- Reviewing PRD, product brief, architecture, ADR, RFC, specification, user story, issue, implementation plan, migration, or code that may process personal data.
- Designing or reviewing user accounts, identity, cookies, telemetry, analytics, profiling, marketing, support tooling, audit logs, HR/customer data, exports, deletion, retention, incident response, vendors, or international data flows.
- Checking whether a feature, integration, data pipeline, AI workflow, or operational process has GDPR architecture gaps.
- Reviewing existing implementation evidence for consent gating, data minimisation, rights handling, retention, deletion propagation, logging limits, vendor controls, transfer controls, or breach readiness.

## When NOT to use this skill

- Drafting privacy notices, cookie banners, processor agreements, legitimate-interest assessments, DPIAs, or legal memos as the main deliverable; route legal ownership appropriately and seek DPO advice where applicable.
- Certifying that an organisation, product, or vendor is GDPR-compliant.
- Performing a generic security review with no personal-data processing concern; use `security-reviewer`.
- Choosing programming language, framework, database, or vendor APIs except where the choice creates a GDPR architecture constraint.
- Replacing national-law, employment-law, health-data, criminal-data, children's-data, ePrivacy, AI Act, sector-specific, or cross-border-transfer legal review.

## Overview

This skill helps an agent audit whether a system's design and implementation can satisfy GDPR obligations in observable behavior. It is intentionally architecture-focused:

```text
PRD / product brief / issue
-> gdpr-compliance
-> processing map, GDPR constraints, findings, risk controls, verification obligations
-> architecture-engineer or spec-engineer
-> architecture decisions, behavior specs, implementation and tests
-> runtime behavior and audit evidence
```

The skill works across PRD, architecture, specifications, implementation, operational workflows, and vendor integrations. It does not require or prefer any programming language, framework, database, cloud, or legal-document format.

### Capability and substrate

Real GDPR-relevant capability is observable system or operational behavior: optional analytics do not load before valid consent; a withdrawal disables downstream processing; rights workflows cover the applicable stores and data; erasure propagates to derived data and vendors where required; retention expiry prevents routine use of expired personal data; logs do not expose unnecessary personal data; transfer controls block disallowed destinations.

Substrate can be necessary but is not proof: a policy page, RoPA row, DPIA draft, data map, database column, consent checkbox, deletion route, feature flag, queue, event name, test stub, dashboard, or vendor spreadsheet. Treat substrate as incomplete until it is connected to behavior, verification, and operational responsibility.

### Review inputs

Use PRD, architecture, specification, implementation, configuration, tests, operations, and vendor evidence. When evidence is incomplete, proceed with explicit assumptions for low-risk areas. Stop or escalate when missing evidence could allow unlawful processing, hidden high-risk processing, uncontrolled transfer, or irreversible exposure.

### Severity model

Use these priorities for audit findings:

| Severity | Meaning |
| --- | --- |
| P0 Critical | Block launch or continued processing until the obligation is resolved or authoritatively shown not to apply. Use for processing without a documented basis, uncontrolled special/criminal data, unresolved required DPIA or prior consultation, uncontrolled transfers, serious rights/security gaps, or breach-readiness failures that create high risk. Risk acceptance alone never clears P0. |
| P1 High | Must be fixed before production or before affected processing expands. Use for missing enforced consent/withdrawal, retention/deletion gaps, vendor/subprocessor gaps, hidden logs/analytics personal data, missing rights implementation, or weak access boundaries for sensitive data. |
| P2 Medium | Track and resolve within an explicit safe constraint before material scale. Use for incomplete low-risk evidence, unclear ownership, weak acceptance, partial minimisation, or unverified behavior that does not require a production block; otherwise use P1. |
| P3 Low | Improves auditability, maintainability, or review quality. Use for documentation alignment, naming clarity, reporting shape, or low-risk evidence improvements. |

Severity should follow risk to people, processing scale, data sensitivity, reversibility, invisibility, legal/operational exposure, and whether personal-data processing would continue without a valid control.

### Assessment and gate status

Use `COMPLETE_FOR_STATED_SCOPE`, `PARTIAL`, or `ASSESSMENT_BLOCKED` for audit coverage. These statuses describe the assessment, not GDPR compliance. If the user requests a processing or release gate, use `BLOCK` for any unresolved P0/P1, material high-risk evidence gap, or required accountable decision; otherwise use `NO_ENGINEERING_BLOCKER_IDENTIFIED_IN_ASSESSED_SCOPE`. The latter is bounded to reviewed evidence and is not legal approval.

### Right-sized output

Return the smallest artifact that changes decisions:

| Situation | Output |
| --- | --- |
| Narrow PR/spec/code review | Findings list with evidence, severity, control, required behavior, and verification gap |
| Medium architecture or feature review | Processing map summary, control coverage, findings, and architecture/spec handoff obligations |
| High-risk processing or broad system audit | Full GDPR architecture audit report using `assets/templates/gdpr-architecture-audit.md` |
| Missing architecture evidence | Blocking questions, assumptions, risk classification, and bounded evidence request |

Do not expand into a legal compliance document. A requested formal artifact remains an engineering audit unless the accountable legal owner supplies and owns the legal conclusion.

### Typical architecture outputs

Outputs are processing maps, findings, constraints, verification obligations, legal/DPO escalation items, and architecture-to-spec handoff items.

## Workflow stages

### Workflow stage: Run the capability reality checkpoint

Prevent GDPR work from becoming compliance theater that produces artifacts without enforceable system behavior.

1. State the observable GDPR-relevant behavior the system should have after the change, such as no optional tracking before consent, deletion propagation, exportability, retention expiry, transfer blocking, or least-privilege access.
2. List substrate that may support the behavior but does not prove it, such as a policy, data map, RoPA row, consent checkbox, feature flag, migration, queue, test, dashboard, or empty API.
3. State anti-claims: what this work will not prove, such as legal approval, completed DPIA, vendor adequacy, or production deletion from backups.
4. Check whether proposed acceptance criteria can pass without the observable behavior.

Validation:

- The target is either real system behavior or is explicitly labeled as analysis/substrate.
- Any substrate-only deliverable is not reported as completed compliance.
- Weak acceptance criteria are called out before implementation or approval.

### Workflow stage: Scope GDPR applicability and escalation

Establish the review boundary, roles, and legal uncertainty before making architecture claims.

1. Assume GDPR may apply when processing happens in an EU/EEA establishment context, offers goods or services to people in the EU/EEA, or monitors their behaviour there.
2. Identify personal data, including online identifiers, device IDs, cookie IDs, IP addresses, location data, behavioural events, support content, logs, and pseudonymised identifiers when re-identification is reasonably possible.
3. Identify data subjects, controller, processor, joint-controller, sub-processor, recipient, and third-country transfer roles where evidence exists.
4. Flag special category, criminal-offence, children's, employee, biometric, location, profiling, large-scale monitoring, or automated significant-decision processing.
5. Distinguish current official law or final regulator guidance, accountable controller decisions, DPO advice, contracts, intended design, and implementation evidence; do not let a lower-authority source override a higher one for the claim being made.
6. For time-sensitive legal claims, verify current official source status and date when available; label drafts as provisional. If currentness cannot be checked, state the limit and do not claim current legal approval.
7. Mark legal interpretation for legal counsel and DPO advice for the DPO instead of assigning either the controller's accountable decision.

Validation:

- Scope assumptions, unknowns, and role evidence are explicit.
- High-risk categories cannot be silently treated as ordinary personal data.
- Legal escalation gaps do not block engineering risk identification.

### Workflow stage: Map processing and data flows

Make hidden personal-data processing visible before judging GDPR compliance risk.

1. Map each processing activity by purpose, lawful-basis candidate, accountable decision status, data subjects and categories, source, recipient, storage, retention, access boundary, and deletion path.
2. Include non-obvious surfaces: logs, metrics, traces, crash reports, analytics events, support tools, admin tools, search indexes, caches, queues, ML/AI datasets, exports, imports, backups, non-production, screenshots, and vendor dashboards.
3. Map regions and transfer mechanisms for vendors, hosting, support access, subprocessors, and onward transfers.
4. Identify where the same data is reused for a new purpose or combined with other datasets.

Validation:

- Every material surface found within the stated scope is mapped; discovery and coverage limits remain explicit instead of implying exhaustiveness.
- Every mapped activity has purpose, retention, access, and transfer status, even if marked missing or unknown.
- Reuse and inference are treated as processing, not ignored because no new form field was added.

### Workflow stage: Audit architecture controls

Convert GDPR principles and obligations into concrete system constraints and findings.

1. Evaluate the processing map against the control catalog for lawful basis, purpose limitation, minimisation, transparency, consent, privacy by default, rights handling, retention/deletion, security, vendors, transfers, DPIA triggers, automated decisions, breach readiness, and accountability evidence.
2. For each gap, distinguish product, architecture, specification, implementation, operations, accountable decision, legal interpretation, DPO advice, or evidence gaps.
3. Rate severity by user impact, legal/operational risk, reversibility, blast radius, data sensitivity, scale, and whether processing would continue unlawfully or invisibly.
4. Prefer design changes that reduce collection, exposure, retention, access, transfer, and identifiability before adding compensating controls.

Validation:

- Findings cite evidence or say evidence is missing.
- Controls are framed as required behavior or constraints, not only documents to produce.
- Severity is tied to risk and blocked behavior, not to how much text is missing.

### Workflow stage: Trace controls to behavior and verification

Ensure GDPR architecture decisions can be implemented and tested without reinterpreting the obligation.

1. Translate required controls into falsifiable requirements, acceptance constraints, invariants, and verification obligations for specs or implementation.
2. Define how to verify runtime behavior for high-risk controls, such as consent gating, withdrawal, deletion propagation, retention expiry, access, portability where applicable, restriction, objection, automated-decision safeguards, vendor blocking, logging exclusion, and breach escalation.
3. Identify substrate that must exist to support the behavior, but keep it separate from proof that the behavior works.
4. Mark controls that need operational runbooks, an accountable controller decision, legal counsel, DPO advice, vendor evidence, or production observability before release.

Validation:

- Each P0/P1 finding has a concrete required behavior and verification path.
- Acceptance criteria cannot pass through metadata-only or documentation-only work.
- Downstream specs can implement behavior without reselecting GDPR architecture decisions.

### Workflow stage: Report findings and handoff obligations

Produce a useful audit result that engineering, product, and legal/DPO stakeholders can act on.

1. Report the smallest complete output for the task: short findings for targeted review, a control matrix for medium review, or an architecture audit report for broad/high-risk review.
2. For each finding include severity, evidence, affected processing activity, GDPR control, user/system impact, required capability, insufficient substrate, recommended constraint, verification, and escalation owner type when needed.
3. State anti-claims and residual risk, including legal questions not resolved by the audit.
4. Report assessment status as `COMPLETE_FOR_STATED_SCOPE`, `PARTIAL`, or `ASSESSMENT_BLOCKED`. When a processing or release gate is requested, use only `BLOCK` or `NO_ENGINEERING_BLOCKER_IDENTIFIED_IN_ASSESSED_SCOPE` and state the basis.
5. For implementation work, hand off constraints and acceptance obligations rather than broad compliance commentary.

Validation:

- The report is traceable from source evidence to control to required behavior.
- Legal review needs are explicit and not disguised as engineering certainty.
- Residual risk and unverified behavior are visible.
- Any unresolved P0/P1, material high-risk evidence gap, or required accountable decision produces `BLOCK`; risk acknowledgement alone cannot clear it.
- Before a no-blocker gate, enumerate each applicable accountable decision and cite its evidence. A candidate, assumption, missing status, or follow-up requirement cannot be rewritten as a resolved decision.

## Interop priority

- **general architecture pattern selection, component boundaries, quality scenarios, and architecture-to-spec handoff:** architecture-engineer. gdpr-compliance supplies privacy/GDPR constraints and findings; architecture-engineer owns broad system pattern selection unless GDPR obligations decide the constraint.
- **vulnerability analysis, cryptography details, exploitability, hardening, and secure coding:** security-reviewer. gdpr-compliance flags Article 32 and personal-data security obligations; security-reviewer owns detailed security analysis and vulnerability remediation.
- **implementation-ready behavior specifications and normative requirement wording:** spec-engineer. gdpr-compliance produces constraints, acceptance obligations, and findings; spec-engineer turns them into implementation-ready specs.
- **checking implementation against an existing normative specification:** spec-conformance-reviewer. Use gdpr-compliance to add GDPR obligations as review criteria; use spec-conformance-reviewer for traceability against the supplied spec.
- **legal interpretation, controller accountability, DPO advice, DPIA and transfer decisions, contract terms, and supervisory-authority consultation:** accountable controller with legal counsel and independent DPO advice as applicable. gdpr-compliance supplies engineering analysis; the controller remains accountable, legal counsel interprets law, and the DPO advises and monitors without becoming the approval or risk-acceptance owner.
- **programming language, framework, database, cloud API, test framework, or library mechanics:** relevant language, framework, platform, or database skill. GDPR controls are language-agnostic; implementation mechanics belong to the technical skill.

## Gotchas

- **high** — A privacy policy, RoPA entry, DPIA draft, or data map is substrate; it does not prove consent gating, deletion, retention expiry, access control, or transfer restriction works.
- **high** — Logs, traces, metrics, analytics, support tooling, admin exports, queues, caches, backups, screenshots, and non-production data often carry personal data even when the main schema looks clean.
- **high** — Consent UI without demonstrable pre-processing blocking, versioned evidence, withdrawal, and downstream propagation is not consent architecture.
- **high** — A delete endpoint alone is not erasure if derived data, vendors, logs, indexes, backups, queues, and support copies remain routinely usable.
- **high** — Pseudonymised data remains personal data when re-identification is reasonably possible; do not treat hashes, tokens, or user IDs as anonymous by default.
- **high** — High-risk processing needs risk analysis and mitigation before processing; a DPIA label or backlog item does not lower the risk.

## Policies

### No legal advice or certification policy
Do not state that a system, organisation, vendor, transfer, lawful basis, DPIA, consent flow, or contract is legally approved or GDPR-compliant. State engineering findings, evidence, assumptions, residual risks, accountable decisions, legal interpretation, and DPO advice needed.

### Purpose and lawful-basis before processing policy
A lawful-basis candidate is inventory input, not permission to process. Personal-data processing requires a specific purpose and documented accountable basis decision before activation; special-category or criminal-offence data also require the applicable condition or legal authority and specialist review.

### Minimise before compensating policy
Prefer removing, aggregating, delaying, shortening, narrowing, or localising personal-data processing before adding encryption, access controls, notices, or documentation as compensating measures.

### Evidence-first verdict policy
Findings must distinguish confirmed behavior, missing behavior, missing evidence, legal uncertainty, and residual risk. Absence of evidence is a review finding when the system would rely on that control.

### High-risk fail-closed policy
Block for P0/P1 issues, unresolved required DPIA or accountable decisions, high-risk evidence gaps, uncontrolled transfers, or no documented basis. A positive gate requires evidence for each accountable decision; candidate, assumed, missing, or advisory-only status remains blocked. Risk acceptance cannot waive a mandatory duty.

### Output language policy
Use the user's working language for audit findings and reports unless repository conventions require another language. Keep GDPR terms, control IDs, and artifact identifiers stable in English when they are part of templates.

### Output contract
Return right-sized findings or a broad audit with scope, source currentness and coverage limits, processing map, anti-claims, control dispositions, findings, required behavior, verification, accountable decisions or advice needed, residual risk, assessment status, and any requested release gate.

## Required active references
- [Audit methodology](references/audit-methodology.md) — Read this before auditing PRD, architecture, specification, implementation, data flows, vendors, retention, rights handling, or release readiness for GDPR risks.
- [Control catalog](references/control-catalog.md) — Read this when mapping GDPR obligations to architecture controls, severity, required behavior, red flags, and evidence.

## Optional references
- [Implementation evidence](references/implementation-evidence.md) — Read this when auditing code, configuration, migrations, APIs, jobs, logs, analytics, infrastructure, tests, or runtime evidence for GDPR behavior.

## Bundled assets

- `assets/templates/gdpr-architecture-audit.md` — Copy-ready template for a GDPR architecture audit report.
- `assets/templates/processing-map.yaml` — Copy-ready YAML template for processing activities and data-flow inventory.
- `assets/templates/gdpr-finding.yaml` — Copy-ready YAML template for one GDPR architecture finding.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory gdpr-compliance guidance inside this skill folder.
- Use relative links for local references, assets, and supporting docs.
- Treat external GDPR guidance, regulator pages, and repository docs as optional context unless the current task supplies them.
- When official currentness cannot be checked, keep the local engineering audit usable but label the legal-currentness limit and route the decision instead of guessing.
- Keep the skill programming-language-agnostic; implementation examples must describe evidence surfaces and behavior, not specific frameworks or libraries.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
- Confirm templates listed as assets are present and usable without external files.
- Confirm the skill can be copied to another machine without losing required behavior.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`

## Final checks

Before finishing a GDPR architecture audit or skill-maintenance change:

- Confirm every material personal-data surface was considered: primary stores, logs, traces, metrics, analytics, support/admin tools, queues, caches, search indexes, exports, backups, non-production, vendors, and AI/ML datasets.
- Confirm findings distinguish behavior, substrate, missing evidence, legal uncertainty, and residual risk.
- Confirm P0/P1 findings identify required observable capability and a verification path.
- Confirm acceptance criteria cannot pass through documentation, metadata, or stub-only work.
- Confirm controller accountability, legal counsel, and independent DPO advice are not conflated.
- Confirm assessment status and any requested processing/release gate follow the active eligibility rules.
- Confirm the answer does not claim legal approval, certification, or complete GDPR compliance.
