# Implementation Evidence Guide

## Start here

Use this reference when auditing code, configuration, migrations, APIs, jobs, logs, analytics, infrastructure, tests, or runtime behavior for GDPR controls. Keep the review programming-language-agnostic: inspect behavior and evidence surfaces instead of requiring specific libraries, frameworks, or file names.

## Evidence surfaces

| Surface | What to inspect |
| --- | --- |
| Data model and migrations | personal-data fields, identifiers, special categories, retention metadata, deletion markers, audit fields, tenant boundaries |
| API and service contracts | collection points, returned fields, purpose separation, export/delete endpoints, admin/support access, downstream calls |
| UI/client configuration | consent gating, preference state, cookie/script loading, tracking SDK activation, user controls, notices |
| Jobs and workflows | retention expiry, deletion propagation, vendor sync, exports, imports, queues, retries, dead letters, idempotency |
| Logs/traces/metrics/errors | payload capture, URL/query data, identifiers, tokens, secrets, special data, sampling, redaction, vendor forwarding |
| Analytics/event pipeline | event taxonomy, purpose tags, consent dependency, identifiers, aggregation, retention, vendor payload, deletion support |
| Search/cache/indexes | derived copies, invalidation, deletion, retention, re-identification risk |
| Object/file storage | uploads, support attachments, screenshots, backups, access control, retention, deletion |
| Auth/access control | roles, least privilege, admin/support access, tenant isolation, access review, human access logging |
| Infrastructure/config | region settings, backup retention, vendor endpoints, secrets, data residency, observability exporters |
| Tests and CI | behavior tests for blocked processing, deletion propagation, retention expiry, export coverage, log redaction, tenant isolation |
| Operational runbooks | rights requests, breach response, vendor requests, legal holds, backup restoration, incident classification |

## Behavior probes

Use these probes when the project gives enough runtime or test context. Adapt to the local stack.

### Consent and optional processing

Probe:

- Start with no consent or withdrawn consent.
- Trigger page/app flows that could load cookies, SDKs, pixels, analytics events, marketing calls, profiling, or AI enrichment.
- Verify no disallowed storage, network call, queue event, or vendor payload occurs.
- Grant consent for one purpose and verify only that purpose activates.
- Withdraw consent and verify future collection and downstream processing stop.

Evidence:

- Tests, browser/network traces, server logs without payload leakage, event pipeline assertions, vendor dashboard absence/presence, consent record.

### Erasure and deletion propagation

Probe:

- Create or identify a data subject with primary, derived, indexed, cached, queued, analytics, support, and vendor data.
- Execute erasure workflow or deletion trigger.
- Verify allowed erasure, restriction, or exception behavior across each store.
- Verify deleted data is not routinely restored from backups and vendor deletion is requested where required.

Evidence:

- Integration tests, deletion job logs, tombstone/exception records, vendor deletion request evidence, search/cache absence, backup policy.

### Retention expiry

Probe:

- Seed data past retention criterion for each purpose.
- Run retention workflow.
- Verify deletion or irreversible anonymisation and no routine access to expired identifiable data.
- Verify legal holds and exceptions are explicit.

Evidence:

- Scheduled job tests, retention matrix, anonymisation analysis, audit logs, monitoring, alerting.

### Access

Probe:

- Request Article 15 access for a data subject.
- Verify coverage across personal data undergoing processing, including relevant inferred or derived personal data.
- Verify excluded records have reasons and do not expose another person's data.
- Verify the copy, required processing information, and identity verification are proportionate.

Evidence:

- Export tests, field coverage matrix, exception list, identity-verification workflow, response timing evidence.

### Portability where applicable

Probe:

- Confirm Article 20 applicability: consent or contract basis and automated processing.
- Verify coverage for data provided by the data subject, including observed data, without automatically adding controller-created inferred or derived data.
- Verify structured, commonly used, machine-readable output and direct transmission where applicable and technically feasible.
- Verify another person's rights are not adversely affected.

Evidence:

- Applicability decision, field provenance matrix, format/contract tests, transmission workflow, exception evidence.

### Logging and observability

Probe:

- Exercise flows with sensitive inputs, tokens, identifiers, free text, errors, and failed validation.
- Inspect logs, traces, metrics, crash reports, URLs, alerts, and vendor telemetry.
- Verify redaction/minimisation and that necessary incident evidence remains usable.

Evidence:

- Log samples, redaction tests, observability config, alert examples, vendor exporter config.

### Vendor and transfer controls

Probe:

- Inspect all external destinations reached by runtime, workers, clients, CI, support tooling, observability, and backups.
- Compare payloads, regions, subprocessors, retention, deletion support, and transfer mechanisms to approved architecture.
- Verify disabled or unapproved vendors cannot receive personal data.

Evidence:

- Network traces, config, IaC, vendor settings, DPA/SCC references, data residency config, deletion/export support evidence.

## Implementation control dispositions

Use the canonical dispositions from the audit methodology:

| Status | Meaning |
| --- | --- |
| `control_evidenced` | Evidence demonstrates the required control path operates for the assessed boundary |
| `confirmed_gap` | Evidence demonstrates the control path is missing or wrong |
| `missing_evidence` | Behavior is untested or necessary code/runtime/vendor evidence was unavailable |
| `accountable_or_specialist_decision_needed` | The remaining dependency is an accountable organisational decision or specialist interpretation/advice |

For high-risk controls, `missing_evidence` can be a P1 finding even when code appears plausible.

## Test quality rules

Strong tests:

- exercise blocked processing, not only successful processing;
- use realistic hidden stores such as logs, queues, caches, search indexes, and analytics events where relevant;
- verify propagation to downstream systems or explicitly mock with contract evidence;
- check negative cases such as withdrawn consent, expired retention, cross-tenant access, vendor disabled, and deleted data;
- assert that sensitive data does not appear in logs/errors/URLs.

Weak tests:

- assert that a field, endpoint, table, or flag exists;
- mock the entire control path without contract assertions;
- test only UI state while backend/vendor processing continues;
- verify deletion only in the primary table;
- snapshot payloads that contain unnecessary personal data.

## Evidence limits

Do not overstate implementation proof:

- A migration can show storage shape, not runtime minimisation.
- A route can show an intended endpoint, not deletion propagation.
- A policy can show intent, not enforcement.
- A unit test can show local behavior, not vendor deletion or backup aging.
- A regional config can show primary storage location, not support access or onward transfer.

Report the strongest claim the evidence supports.
