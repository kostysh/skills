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
