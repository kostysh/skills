## Overview

This skill helps an agent audit whether a system's design and implementation can satisfy GDPR obligations in observable behavior. It supplies engineering constraints:

```text
PRD / product brief / issue
-> gdpr-compliance
-> processing map, GDPR constraints, findings, risk controls, verification obligations
-> architecture-engineer or spec-engineer
-> architecture decisions, behavior specs, implementation and tests
-> runtime behavior and audit evidence
```

The skill is independent of language, framework, database, cloud, and legal-document format.

### Capability and substrate

Real GDPR-relevant capability is observable system or operational behavior: consent-dependent analytics do not load before valid consent under C6; a withdrawal disables downstream processing; rights workflows cover the applicable stores and data; erasure propagates to derived data and vendors where required; retention expiry prevents routine use of expired personal data; logs do not expose unnecessary personal data; transfer controls block disallowed destinations.

Substrate can be necessary but is not proof: a policy page, RoPA row, DPIA draft, data map, database column, consent checkbox, deletion route, feature flag, queue, event name, test stub, dashboard, or vendor spreadsheet. Treat substrate as incomplete until it is connected to behavior, verification, and operational responsibility.

### Review inputs

Use PRD, architecture, specification, implementation, configuration, tests, operations, and vendor evidence. When evidence is incomplete, complete the supported assessment and label the missing evidence. Block or escalate only the dependent processing, action, or stronger conclusion when the gap is material; an unresolved external decision need not prevent a complete engineering finding. Runtime probes follow the action boundary in the implementation-evidence reference.

### Severity model

Apply the risk-based P0–P3 definitions in the required audit-methodology reference; examples do not override the assessed risk or applicability.

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
