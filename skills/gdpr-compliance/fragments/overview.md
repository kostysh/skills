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
