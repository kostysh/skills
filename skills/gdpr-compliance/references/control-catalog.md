# GDPR Architecture Control Catalog

## Start here

Use this catalog to translate GDPR obligations into system controls and audit findings. It is not legal advice and does not replace controller accountability, legal interpretation, or independent DPO advice. It is a language-agnostic engineering control map.

Each control lists architecture requirement, audit evidence, red flags, and severity guidance.

## Control severity shortcuts

| Severity | Use when |
| --- | --- |
| P0 | Processing would start or continue without a documented purpose/basis decision; prohibited or high-risk data lacks a required condition, authority, DPIA, or consultation; core rights cannot be exercised; serious security/transfer/vendor gaps create high risk; breach obligations cannot be met. |
| P1 | Control is required before production or scale: consent gating, deletion propagation, retention enforcement, vendor terms, transfer mechanism, sensitive logging, access boundaries, DPIA mitigation, or rights workflow. |
| P2 | Control design or evidence is incomplete but processing can be constrained safely while resolved. |
| P3 | Auditability, documentation, naming, or low-risk operational polish. |

## C1. Scope and personal-data classification

Architecture requirement:

- The system identifies personal data, pseudonymised data, inferred data, data
  subjects, operational identities, environments, per-environment technical
  activation, and processing activities before design approval.
- Pseudonymised data remains personal data when re-identification is reasonably possible.
- Anonymised data is treated as out of scope only when re-identification is not reasonably likely.

Audit evidence:

- Data inventory, operational identity inventory, environment activation
  evidence, event taxonomy, schema, API contracts, telemetry catalog, vendor
  data map, log samples, support workflows, AI/ML dataset description.

Red flags:

- "No personal data" while IP addresses, device IDs, cookie IDs, user IDs, location, free text, logs, support transcripts, or pseudonymous identifiers are present.
- Hashes or tokens treated as anonymous without re-identification analysis.
- Derived profiles, scores, embeddings, or behavioural events not mapped.
- Access, support, deployment, CI, or observability accounts are omitted because
  they are not application users.
- An environment is named without an evidenced `active`, `inactive`, `planned`,
  or `unknown` status for the assessed activity.

Severity:

- P0/P1 when misclassification enables unlawful or invisible processing.
- P2 when inventory is incomplete but processing can be safely constrained.

## C2. Roles and responsibility boundaries

Architecture requirement:

- Controller, processor, joint-controller, sub-processor, recipient, and internal responsibility boundaries are identified for each processing activity and vendor flow.
- Processor behavior follows documented controller instructions.

Audit evidence:

- Contracts, DPA, architecture diagram, vendor documentation, internal ownership, service boundaries, instruction model.

Red flags:

- A vendor is called a processor while it independently decides purposes.
- No owner for rights, breach, retention, or vendor requests.
- Joint-controller implications ignored for shared platforms or co-marketing flows.

Severity:

- P0/P1 when personal data flows to an external party before role and terms are clear.
- P2 when internal ownership is unclear but data flow is not yet active.

## C3. Purpose limitation and lawful basis

Architecture requirement:

- Each processing activity has a specific purpose and candidate basis during design, then a documented accountable basis decision before processing starts or continues.
- Reuse for a new purpose is blocked until compatibility, consent, legal obligation, or another lawful path is resolved.
- Special-category processing requires both an Article 6 basis and an applicable Article 9 condition; criminal-offence data requires the applicable Article 10 authority and safeguards. Route interpretation to legal counsel and seek DPO advice where applicable.

Audit evidence:

- Purpose matrix, PRD requirements, consent records, legitimate-interest assessment reference, legal-obligation reference, contract necessity analysis, compatibility assessment, accountable decision, legal analysis, and DPO advice.

Red flags:

- "For analytics", "improve product", "AI training", or "fraud prevention" with no separated purpose/data/basis.
- One broad consent for unrelated purposes.
- Personal data collected "just in case".
- Support, telemetry, or transaction data reused for AI training, marketing, enrichment, or profiling without separate purpose and basis.

Severity:

- P0 when processing lacks a documented applicable basis or involves special/criminal data without the required condition or authority.
- P1 when reuse or expansion lacks basis before release.

## C4. Data minimisation and privacy by default

Architecture requirement:

- Default behavior collects, exposes, stores, logs, and shares only data necessary for the specific purpose.
- Optional analytics, marketing, profiling, enrichment, and broad internal access are off by default unless the legal basis and controls allow them.

Audit evidence:

- Field-level rationale, event schema, API response shape, UI defaults, admin roles, log configuration, vendor payload, data retention settings.

Red flags:

- Full request/response payloads in logs or analytics.
- API returns fields not needed by the caller.
- Admin/support tools expose full profiles by default.
- Tracking SDK loads before consent or before necessity is established.
- Optional fields required for service access without justification.

Severity:

- P1 for unnecessary sensitive, broad-scale, or vendor-exposed data.
- P2/P3 for low-risk overcollection with clear remediation.

## C5. Transparency and notice architecture

Architecture requirement:

- The system can present or link clear information at the right time, with purpose, controller, rights, retention, recipients, transfers, legal bases, consent withdrawal, complaint rights, and significant automated decision information where applicable.
- Changes in processing can be reflected without stale or contradictory product behavior.

Audit evidence:

- Product copy requirements, notice versioning, consent/preference screens, release process for processing changes, event-to-notice mapping.

Red flags:

- Hidden processing not represented in user-facing information.
- Notices describe fewer recipients, purposes, or retention periods than architecture uses.
- Product changes add processing without a notice update path.

Severity:

- P1 when opaque processing affects user rights, consent, profiling, transfers, or sensitive data.
- P2 for incomplete but non-blocking notice evidence.

## C6. Consent and ePrivacy-dependent gating

Architecture requirement:

- When consent is the lawful basis or ePrivacy/cookie rules require consent, processing starts only after valid consent exists for that purpose.
- Consent is freely given, specific, informed, unambiguous, demonstrable, versioned where needed, and withdrawal is as easy as giving consent.
- Withdrawal propagates to downstream processing and future collection.

Audit evidence:

- Consent state model, purpose/version records, SDK gating, event dispatch gating, withdrawal flow, audit trail, tests, preference propagation, cookie/script loading behavior.

Red flags:

- Pre-ticked boxes, bundled consent, consent hidden in terms, silence/inactivity as consent.
- Tracking scripts, cookies, pixels, analytics events, or marketing SDKs load before valid consent where required.
- Withdrawal updates UI but not backend, vendors, queues, or profile generation.
- Consent records do not include purpose/version/time/source.

Severity:

- P0/P1 when optional tracking, marketing, profiling, or special-category processing runs without valid consent.
- P2 when evidence is incomplete before launch.

## C7. Data subject rights architecture

Architecture requirement:

- The system and operations can handle access, rectification, erasure, restriction, portability where Article 20 applies, objection, direct-marketing objection, consent withdrawal, and safeguards for solely automated significant decisions.
- Article 15 access and Article 20 portability have separate scope and output rules: access covers personal data undergoing processing, including relevant inferred data; portability applies only to applicable consent/contract automated processing and data provided by the data subject, including observed data but not controller-created inferred data.
- Identity verification is proportionate and does not collect unnecessary extra data.
- Corrections, erasure, or restrictions propagate to recipients unless impossible or disproportionate.

Audit evidence:

- Rights workflow, request intake, identity verification, data discovery, export format, deletion plan, exception handling, vendor propagation, SLA monitoring, audit logs.

Red flags:

- Account deletion is the only rights mechanism.
- Access response covers only the primary user table and omits other personal data; portability is incorrectly treated as identical to access.
- Erasure does not cover indexes, caches, queues, derived profiles, analytics identifiers, or vendors.
- No way to handle restriction, objection, or direct-marketing objection.
- Manual process exists but has no system support to find data or prove completion.

Severity:

- P0/P1 when rights cannot be fulfilled for active production processing.
- P2 when manual process exists but evidence, coverage, or timing is incomplete.

## C8. Retention, deletion, and anonymisation

Architecture requirement:

- Every personal-data category has a retention period or objective criterion tied to purpose and legal obligation.
- Expired data is deleted or irreversibly anonymised.
- Backup/archive handling prevents routine restoration of erased or expired data and ages out under controlled procedures.
- Derived data, indexes, caches, queues, logs, and vendors are included in retention and deletion design.

Audit evidence:

- Retention matrix, scheduled jobs, deletion/anonymisation design, backup policy, legal hold handling, vendor deletion terms, tests, runbooks, monitoring.

Red flags:

- "Forever" without legal requirement.
- Deletion removes account row only.
- Backups are used as active archives after erasure.
- Retention differs across systems without purpose or legal explanation.
- Anonymisation keeps keys, rare attributes, small cohorts, or linkable fields.

Severity:

- P0/P1 for indefinite or non-propagating retention of sensitive, broad-scale, or rights-request data.
- P2 for incomplete retention evidence before scale.

## C9. Integrity, confidentiality, and Article 32 security

Architecture requirement:

- Personal data is protected with risk-appropriate technical and organisational measures, including least privilege, authentication, access control, tenant isolation, encryption where appropriate, resilience, backup/restore, vulnerability management, and regular testing.
- Logs, errors, URLs, telemetry, analytics, screenshots, and support transcripts avoid unnecessary personal data.

Audit evidence:

- Access-control model, data classification, secrets handling, audit logs, encryption design, tenant isolation, logging policy, vulnerability process, backup/restore tests, incident runbooks.

Red flags:

- Passwords, tokens, secrets, payment data, special category data, national IDs, or full payloads in logs/errors/URLs.
- Broad admin access without need, review, or audit.
- Tenant isolation assumptions not tested.
- Observability vendors receive full personal-data payloads.

Severity:

- P0 for serious exposure of credentials, special data, or cross-tenant data.
- P1 for broad personal-data exposure or missing least privilege.
- Also use `security-reviewer` for vulnerability depth.

## C10. Processors, subprocessors, recipients, and vendors

Architecture requirement:

- Personal data does not flow to vendors or processors until role, purpose, data categories, instructions, retention, location, subprocessors, deletion/return, audit/evidence rights, security, and breach notification obligations are known.
- Vendor architecture respects data minimisation and transfer controls.

Audit evidence:

- DPA, subprocessors list, vendor security docs, region settings, retention settings, payload examples, deletion support, breach notice terms, procurement/legal approval.

Red flags:

- New SaaS, analytics, AI, support, or observability tool added because it is convenient.
- Vendor receives more data than needed.
- No deletion/export support for vendor-held personal data.
- Subprocessors or support regions unknown.

Severity:

- P0/P1 when data leaves the organisation without role/terms/transfer clarity.
- P2 when vendor evidence is incomplete but flow can be disabled until resolved.

## C11. International transfers

Architecture requirement:

- Transfers to third countries or international organisations have documented destination, recipient, role, transfer mechanism, onward-transfer rules, and supplementary safeguards where needed.
- Adequacy decisions, SCCs, BCRs, approved codes/certifications, or exceptional derogations are treated as legal mechanisms requiring organisational evidence.
- A judgment, decision, or request from a third-country authority is not by itself a legal basis or Chapter V transfer ground; responding requires separate Article 6 and transfer analysis with legal escalation.

Audit evidence:

- Hosting/support/backups regions, vendor subprocessors, SCC/DPA references, transfer impact assessment reference, access logs, data residency controls, configuration.

Red flags:

- "EU region" while support, telemetry, backups, subprocessors, or admin access cross borders.
- Transfer mechanism unknown.
- Derogation used for regular repeated transfer.
- Regional controls are only contractual but runtime config permits any region.
- A third-country authority request is executed solely because it is locally binding outside the EU/EEA.

Severity:

- P0/P1 for uncontrolled or undocumented transfer before processing.
- P2 for incomplete evidence before activation.

## C12. DPIA and high-risk processing

Architecture requirement:

- Processing likely to result in high risk requires an Article 35 DPIA before processing, subject only to an applicable legal exception.
- If the DPIA indicates residual high risk in the absence of measures sufficient to mitigate it, Article 36 prior consultation is required before processing.

Audit evidence:

- DPIA screening and decision, applicable supervisory-authority list, DPIA, mitigation plan, residual-risk result, profiling and automated-decision analysis, data protection by design choices, accountable controller decision, legal analysis, and DPO advice.

High-risk indicators for documented screening:

- systematic and extensive profiling with legal or similarly significant effects;
- large-scale special category or criminal data;
- large-scale systematic monitoring of public areas;
- children at scale;
- employee monitoring;
- precise location or biometric processing;
- combining datasets in ways that increase risk;
- innovative technology with unclear privacy impact;
- AI/ML models that infer sensitive traits or drive significant decisions.

The first three Article 35(3) cases and applicable supervisory-authority Article 35(4) lists can directly require a DPIA. Other indicators above require contextual assessment and must not be treated as automatic standalone legal triggers.

Red flags:

- DPIA planned after release.
- High-risk processing reduced to a checklist without mitigation.
- Residual high risk ignored.

Severity:

- P0 when high-risk processing would start before required DPIA/prior consultation decision.
- P1 when DPIA mitigation is incomplete before production.

## C13. Automated decisions and profiling

Architecture requirement:

- Solely automated decisions that produce legal or similarly significant effects are avoided unless a GDPR exception applies and safeguards exist.
- Users can obtain human intervention, express a view, and contest the decision where required.
- Special-category data is not used for such decisions unless Article 22(4) is satisfied through Article 9(2)(a) or 9(2)(g) and suitable safeguards apply.

Audit evidence:

- Decision flow, model features, human review process, contestation workflow, explanation material, special category analysis, logs of decisions, bias/risk monitoring.

Red flags:

- Account denial, pricing, eligibility, fraud blocking, employment, credit, insurance, health, or access decisions made solely by automation without safeguards.
- "Recommendation" actually determines an outcome.
- Human review is nominal and cannot change the result.

Severity:

- P0/P1 depending on decision effect and missing accountable decision, legal analysis, or DPO advice.

## C14. Children and vulnerable data subjects

Architecture requirement:

- Children's data, services offered directly to children, and consent based on parental responsibility are identified and reviewed against applicable age thresholds and verification requirements.
- Language, defaults, profiling, marketing, and behavioural monitoring are designed with elevated care.

Audit evidence:

- Age-gating design, target audience, parental consent process, child-friendly transparency, profiling/marketing controls, accountable decision, legal analysis, and DPO advice.

Red flags:

- Product likely used by children but age/parental-consent implications ignored.
- Behavioural ads or profiling for children.
- Adult-oriented notices for child users.

Severity:

- P0/P1 for children's profiling, marketing, or consent-dependent processing without specialist review.

## C15. Breach detection and response

Architecture requirement:

- The system can detect, triage, contain, assess, document, and remediate personal data breaches.
- Controllers can notify supervisory authority without undue delay and where feasible within 72 hours of awareness unless the breach is unlikely to create risk.
- Processors can notify controllers without undue delay.
- Affected people can be notified without undue delay where high risk is likely, unless an exception applies.

Audit evidence:

- Incident runbook, alerting, logging without overexposure, data impact assessment workflow, processor/controller notification path, breach register, contact routing, evidence preservation.

Red flags:

- Security incidents are handled without personal-data impact classification.
- No way to identify affected data subjects or data categories.
- Vendor breach notices have no intake owner.
- Logs needed for breach investigation are absent or themselves overexpose data.

Severity:

- P0/P1 for active systems that cannot meet breach timing or impact assessment obligations.

## C16. Accountability and evidence

Architecture requirement:

- The organisation can demonstrate compliance decisions and control operation with proportionate evidence.
- Evidence is linked to processing activities, purposes, controls, releases, vendor changes, and rights/breach events.

Audit evidence:

- Processing map, RoPA where required, decision records, consent versions, retention tests, deletion logs, access review, vendor review, transfer evidence, DPIA decision, incident records, release checklist.

Red flags:

- Decisions live only in chat or ticket comments.
- Evidence proves a document exists, not that behavior works.
- No traceability from data flow to purpose/basis/control/test.

Severity:

- P2/P3 for evidence weaknesses, P1 when missing evidence hides active high-risk processing.

## C17. Non-production, support, analytics, and AI reuse

Architecture requirement:

- Development, test, CI, demos, analytics sandboxes, support tooling, and AI/model workflows use synthetic, anonymised, or strongly minimised data where possible.
- Real personal data in non-production or AI workflows has purpose, lawful basis, access control, retention, transfer, deletion, and security controls equivalent to the risk.
- Training, fine-tuning, evaluation, retrieval, prompt logging, and embedding workflows are treated as processing.
- Operational human and service identities used for environment access,
  administration, support, deployment, CI, observability, or backups are
  classified and mapped even when application datasets are synthetic.
- Each activity records an evidenced technical activation status for every
  in-scope environment. Technical configuration or observed traffic must not be
  treated as a lawful-basis decision, controller approval, legal conclusion,
  DPO advice, or release authorization.

Audit evidence:

- Test data policy, masking/anonymisation process, operational identity
  inventory, per-environment activation evidence, dataset lineage, prompt/log
  retention, model provider terms, opt-out/consent logic, access controls,
  deletion support.

Red flags:

- Production database copied into staging or CI.
- Support transcripts or telemetry used for AI training without separate purpose and basis.
- Prompts, embeddings, or model logs contain personal data with unclear retention or vendor access.
- Demo accounts contain real customer data.
- A synthetic application fixture is used to claim that operational access,
  mailbox, support, or deployment identities process no personal data.
- STAGE or local technical configuration is used to infer PROD activation or an
  accountable or specialist approval.

Severity:

- P0/P1 when sensitive, broad-scale, or vendor-exposed data is reused without basis and controls.
- P2 for incomplete non-production controls before scale.
