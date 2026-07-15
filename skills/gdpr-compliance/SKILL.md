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
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 414a4d27594174e0fb2c36bfc1d01c17a608ec934fe4322581e48c739e0a3e4a
---

# gdpr-compliance

## Start here

1. Treat GDPR as a system architecture constraint, not as a request to draft compliance documents.
2. Separate observable privacy/compliance capability from substrate such as policies, data maps, checklists, flags, empty endpoints, migrations, logs, or tests.
3. Scope whether GDPR may apply, what personal data is processed, who the data subjects are, and which controller/processor roles are in play.
4. Build or update a processing and data-flow map before approving architecture, specs, vendors, analytics, telemetry, retention, deletion, AI use, or implementation behavior.
5. Audit the system against the GDPR architecture controls, then trace findings to required behavior and verification.
6. Escalate legal interpretation to the organisation's legal owner or DPO, while still identifying engineering risks, missing evidence, and safer design constraints.
7. Produce findings, architecture constraints, and handoff obligations; do not claim legal compliance certification.

## When to use this skill

- Reviewing PRD, product brief, architecture, ADR, RFC, specification, user story, issue, implementation plan, migration, or code that may process personal data.
- Designing or reviewing user accounts, identity, cookies, telemetry, analytics, profiling, marketing, support tooling, audit logs, HR/customer data, exports, deletion, retention, incident response, vendors, or international data flows.
- Checking whether a feature, integration, data pipeline, AI workflow, or operational process has GDPR architecture gaps.
- Turning GDPR obligations into system constraints, acceptance criteria, verification obligations, or architecture-to-spec handoff items.
- Reviewing existing implementation evidence for consent gating, data minimisation, rights handling, retention, deletion propagation, logging limits, vendor controls, transfer controls, or breach readiness.

## When NOT to use this skill

- Drafting privacy notices, cookie banners, processor agreements, legitimate-interest assessments, DPIAs, or legal memos as the main deliverable; involve legal/DPO owners.
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

Real GDPR-relevant capability is observable system or operational behavior: optional analytics do not load before valid consent; a withdrawal disables downstream processing; access export covers the correct stores; erasure propagates to derived data and vendors where required; retention expiry prevents routine use of expired personal data; logs do not expose unnecessary personal data; transfer controls block disallowed destinations.

Substrate can be necessary but is not proof: a policy page, RoPA row, DPIA draft, data map, database column, consent checkbox, deletion route, feature flag, queue, event name, test stub, dashboard, or vendor spreadsheet. Treat substrate as incomplete until it is connected to behavior, verification, and operational responsibility.

### Review inputs

Use PRD, architecture, specification, implementation, configuration, tests, operations, and vendor evidence. When evidence is incomplete, proceed with explicit assumptions for low-risk areas. Stop or escalate when missing evidence could allow unlawful processing, hidden high-risk processing, uncontrolled transfer, or irreversible exposure.

### Severity model

Use these priorities for audit findings:

| Severity | Meaning |
| --- | --- |
| P0 Critical | Block launch or continued processing until resolved or explicitly accepted by legal/DPO owner. Use for processing without purpose/lawful basis, uncontrolled special/criminal data, unresolved high-risk DPIA blockers, uncontrolled international transfers, serious rights/security gaps, or breach-readiness failures that create high risk. |
| P1 High | Must be fixed before production or before affected processing expands. Use for missing enforced consent/withdrawal, retention/deletion gaps, vendor/subprocessor gaps, hidden logs/analytics personal data, missing rights implementation, or weak access boundaries for sensitive data. |
| P2 Medium | Must be designed, tracked, and reviewed before launch or material scale. Use for incomplete evidence, unclear operational ownership, weak acceptance criteria, partial minimisation, or unverified control behavior. |
| P3 Low | Improves auditability, maintainability, or review quality. Use for documentation alignment, naming clarity, reporting shape, or low-risk evidence improvements. |

Severity should follow risk to people, processing scale, data sensitivity, reversibility, invisibility, legal/operational exposure, and whether personal-data processing would continue without a valid control.

### Right-sized output

Return the smallest artifact that changes decisions:

| Situation | Output |
| --- | --- |
| Narrow PR/spec/code review | Findings list with evidence, severity, control, required behavior, and verification gap |
| Medium architecture or feature review | Processing map summary, control coverage, findings, and architecture/spec handoff obligations |
| High-risk processing or broad system audit | Full GDPR architecture audit report using `assets/templates/gdpr-architecture-audit.md` |
| Missing architecture evidence | Blocking questions, assumptions, risk classification, and bounded evidence request |

Do not expand into a formal compliance document unless the user explicitly asks for that artifact and legal ownership is clear.

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
5. Mark legal interpretation questions for legal/DPO review instead of inventing conclusions.

Validation:

- Scope assumptions, unknowns, and role evidence are explicit.
- High-risk categories cannot be silently treated as ordinary personal data.
- Legal escalation gaps do not block engineering risk identification.

### Workflow stage: Map processing and data flows

Make hidden personal-data processing visible before judging GDPR compliance risk.

1. Map each processing activity by purpose, lawful-basis candidate or missing basis, data subject category, personal data category, source, recipient, storage location, retention rule, access boundary, and deletion path.
2. Include non-obvious surfaces: logs, metrics, traces, crash reports, analytics events, support tools, admin tools, search indexes, caches, queues, ML/AI datasets, exports, imports, backups, non-production, screenshots, and vendor dashboards.
3. Map regions and transfer mechanisms for vendors, hosting, support access, subprocessors, and onward transfers.
4. Identify where the same data is reused for a new purpose or combined with other datasets.

Validation:

- No material store, flow, vendor, log, backup, or non-production copy is left outside the map without an explicit reason.
- Every mapped activity has purpose, retention, access, and transfer status, even if marked missing or unknown.
- Reuse and inference are treated as processing, not ignored because no new form field was added.

### Workflow stage: Audit architecture controls

Convert GDPR principles and obligations into concrete system constraints and findings.

1. Evaluate the processing map against the control catalog for lawful basis, purpose limitation, minimisation, transparency, consent, privacy by default, rights handling, retention/deletion, security, vendors, transfers, DPIA triggers, automated decisions, breach readiness, and accountability evidence.
2. For each gap, distinguish PRD gap, architecture gap, specification gap, implementation gap, operational process gap, legal/DPO decision gap, or missing evidence.
3. Rate severity by user impact, legal/operational risk, reversibility, blast radius, data sensitivity, scale, and whether processing would continue unlawfully or invisibly.
4. Prefer design changes that reduce collection, exposure, retention, access, transfer, and identifiability before adding compensating controls.

Validation:

- Findings cite evidence or say evidence is missing.
- Controls are framed as required behavior or constraints, not only documents to produce.
- Severity is tied to risk and blocked behavior, not to how much text is missing.

### Workflow stage: Trace controls to behavior and verification

Ensure GDPR architecture decisions can be implemented and tested without reinterpreting the obligation.

1. Translate required controls into falsifiable requirements, acceptance constraints, invariants, and verification obligations for specs or implementation.
2. Define how to verify runtime behavior for high-risk controls, such as consent gating, withdrawal, deletion propagation, retention expiry, access export, restriction, objection, automated-decision safeguards, vendor blocking, logging exclusion, and breach escalation.
3. Identify substrate that must exist to support the behavior, but keep it separate from proof that the behavior works.
4. Mark controls that need operational runbooks, legal/DPO approval, vendor evidence, or production observability before release.

Validation:

- Each P0/P1 finding has a concrete required behavior and verification path.
- Acceptance criteria cannot pass through metadata-only or documentation-only work.
- Downstream specs can implement behavior without reselecting GDPR architecture decisions.

### Workflow stage: Report findings and handoff obligations

Produce a useful audit result that engineering, product, and legal/DPO stakeholders can act on.

1. Report the smallest complete output for the task: short findings for targeted review, a control matrix for medium review, or an architecture audit report for broad/high-risk review.
2. For each finding include severity, evidence, affected processing activity, GDPR control, user/system impact, required capability, insufficient substrate, recommended constraint, verification, and escalation owner type when needed.
3. State anti-claims and residual risk, including legal questions not resolved by the audit.
4. For implementation work, hand off constraints and acceptance obligations rather than broad compliance commentary.

Validation:

- The report is traceable from source evidence to control to required behavior.
- Legal review needs are explicit and not disguised as engineering certainty.
- Residual risk and unverified behavior are visible.

## Interop priority

- **general architecture pattern selection, component boundaries, quality scenarios, and architecture-to-spec handoff:** architecture-engineer. gdpr-compliance supplies privacy/GDPR constraints and findings; architecture-engineer owns broad system pattern selection unless GDPR obligations decide the constraint.
- **vulnerability analysis, cryptography details, exploitability, hardening, and secure coding:** security-reviewer. gdpr-compliance flags Article 32 and personal-data security obligations; security-reviewer owns detailed security analysis and vulnerability remediation.
- **implementation-ready behavior specifications and normative requirement wording:** spec-engineer. gdpr-compliance produces constraints, acceptance obligations, and findings; spec-engineer turns them into implementation-ready specs.
- **checking implementation against an existing normative specification:** spec-conformance-reviewer. Use gdpr-compliance to add GDPR obligations as review criteria; use spec-conformance-reviewer for traceability against the supplied spec.
- **legal interpretation, lawful-basis approval, DPIA approval, transfer-impact assessment approval, DPA/SCC terms, and supervisory-authority consultation:** legal owner or DPO. This skill supports engineering analysis and escalation, but cannot replace legal accountability or organisational decisions.
- **programming language, framework, database, cloud API, test framework, or library mechanics:** relevant language, framework, platform, or database skill. GDPR controls are language-agnostic; implementation mechanics belong to the technical skill.

## Gotchas

- **high** — A privacy policy, RoPA entry, DPIA draft, or data map is substrate; it does not prove consent gating, deletion, retention expiry, access control, or transfer restriction works.
- **high** — Do not design data collection, logging, analytics, or vendor transfer first and assign purpose or lawful basis later.
- **high** — Logs, traces, metrics, analytics, support tooling, admin exports, queues, caches, backups, screenshots, and non-production data often carry personal data even when the main schema looks clean.
- **high** — Consent UI without demonstrable pre-processing blocking, versioned evidence, withdrawal, and downstream propagation is not consent architecture.
- **high** — A delete endpoint alone is not erasure if derived data, vendors, logs, indexes, backups, queues, and support copies remain routinely usable.
- **high** — Pseudonymised data remains personal data when re-identification is reasonably possible; do not treat hashes, tokens, or user IDs as anonymous by default.
- **high** — Adding SaaS, analytics, support, AI, or hosting vendors before roles, terms, regions, retention, subprocessors, and transfer safeguards are known creates architecture risk.
- **high** — High-risk processing needs risk analysis and mitigation before processing; a DPIA label or backlog item does not lower the risk.
- **medium** — Legitimate interest is not a blanket basis for marketing, profiling, enrichment, or invisible reuse; the balancing and opt-out consequences must fit the processing.
- **medium** — EU hosting alone does not prove no third-country transfer when support access, subprocessors, telemetry, backups, or admin tools cross regions.
- **medium** — Tests that assert fields or endpoints exist do not prove GDPR behavior unless they exercise the actual control path.
- **medium** — Calling a party a processor does not make it one; role follows purpose-setting power and actual processing instructions.

## Policies

### No legal advice or certification policy
Do not state that a system, organisation, vendor, transfer, lawful basis, DPIA, consent flow, or contract is legally approved or GDPR-compliant. State engineering findings, evidence, assumptions, residual risks, and legal/DPO escalation needs.

### Purpose and lawful-basis before processing policy
No personal-data collection, inference, storage, logging, enrichment, sharing, training, analysis, or transfer should proceed without a specific purpose and lawful-basis candidate or legal/DPO-approved basis. Special category and criminal-offence data require explicit escalation.

### Minimise before compensating policy
Prefer removing, aggregating, delaying, shortening, narrowing, or localising personal-data processing before adding encryption, access controls, notices, or documentation as compensating measures.

### Evidence-first verdict policy
Findings must distinguish confirmed behavior, missing behavior, missing evidence, legal uncertainty, and residual risk. Absence of evidence is a review finding when the system would rely on that control.

### High-risk fail-closed policy
P0 issues, high-risk DPIA triggers without review, unresolved special/criminal/children data processing, uncontrolled international transfers, or processing without purpose/lawful basis should block launch or continued processing until a responsible owner resolves them.

### Output language policy
Use the user's working language for audit findings and reports unless repository conventions require another language. Keep GDPR terms, control IDs, and artifact identifiers stable in English when they are part of templates.

### Output contract
For targeted work, return concise findings ordered by severity. For broad audits, include scope, evidence reviewed, processing map summary, capability/substrate anti-claims, control coverage, findings, required behavior, verification gaps, legal/DPO escalations, and residual risk.

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
- Confirm legal/DPO escalation is explicit where lawful basis, special category data, criminal data, children, employment, automated significant decisions, DPIA, transfers, or contracts require organisational judgement.
- Confirm the answer does not claim legal approval, certification, or complete GDPR compliance.
