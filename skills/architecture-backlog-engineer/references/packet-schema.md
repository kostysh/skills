# Explicit Packet Schema

This file is the canonical packet-authoring reference for `architecture-backlog-engineer`.

Use it when the agent must author explicit packet files for `discover`.

## What this file covers

- explicit packet transport forms;
- the top-level packet envelope;
- allowed `source` and `packet_provenance` keys;
- allowed packet sections;
- section upsert identities;
- merge-mode rules;
- validator-required payload shapes and graph rules for new entries;
- minimal authoring examples.

This file does not replace the methodology rules in [standard.md](standard.md). Use [standard.md](standard.md) for planning versus current-truth guardrails, `delivery_state` restrictions, and acceptance policy.

## Important boundary: packet validity vs merged-run validity

`discover` accepts partial upsert packets. Validation, however, runs against the **merged canonical backlog**, not against the packet fragment in isolation.

That means:

- when you update an existing entry, you may send only the fields you are changing;
- when you create a new entry, you must provide the full validation-required shape for that section;
- when you replace a full section through `replace_sections`, you must provide enough content for the merged run to remain valid.

The rest of this file now includes the validator-required fields that matter when authoring **new** entries or full-section refreshes.

## Transport forms

`discover` accepts packets in any of these forms:

1. A JSON object representing one packet.
2. A JSON array of packets.
3. A JSON object with a top-level `packets` array.
4. A Markdown file containing one or more fenced JSON blocks with one of these info strings:
   - `architecture-backlog-packet`
   - `abe-packet`
   - `architecture-backlog`

Example fenced block:

```architecture-backlog-packet
{
  "source": {
    "ref": "./docs/architecture/system.md",
    "kind": "architecture_doc",
    "authority": "authoritative_target_truth"
  },
  "packet_provenance": {
    "merge_mode": "source_driven_refresh"
  },
  "claims": []
}
```

## Explicit packet envelope

An explicit packet normally looks like this:

```json
{
  "source": {
    "ref": "./docs/architecture/system.md",
    "kind": "architecture_doc",
    "authority": "authoritative_target_truth"
  },
  "packet_provenance": {
    "merge_mode": "source_driven_refresh"
  },
  "replace_sections": ["claims"],
  "claims": [],
  "items": [],
  "relations": []
}
```

Top-level keys:

| Key | Required | Meaning |
| --- | --- | --- |
| `source` | yes for explicit packets | Declares the source authority identity this packet comes from or extends. |
| `packet_provenance` | yes for explicit packets | Declares how the packet should merge. |
| `replace_sections` | no | Full-section replacement. Allowed only for `source_driven_refresh`. |
| section payloads | no | One or more backlog sections to upsert or replace. |

## `source` object

Allowed keys in `packet.source`:

| Key | Required | Notes |
| --- | --- | --- |
| `source_id` | no | Optional explicit source ID. If omitted, the CLI derives one or reuses an existing matching source-authority entry. |
| `ref` | yes | Local path, file URL, or HTTP(S) URL for the authoritative source or planning packet. |
| `kind` | yes | Must be one of the allowed `SourceKind` values. |
| `authority` | yes | Must be one of the allowed `SourceAuthorityClass` values. |
| `precedence` | no | Source precedence for the source-authority ledger. |
| `notes` | no | Human-readable source note. |

Allowed `source.kind` values:

- `architecture_doc`
- `adr`
- `runtime_evidence`
- `deployment_contract`
- `delivered_dossier_ssot`
- `code_evidence`
- `operational_evidence`
- `backlog_text`

Allowed `source.authority` values:

- `authoritative_target_truth`
- `authoritative_current_truth`
- `historical_context_only`
- `superseded_excluded`
- `planning_only`

## `packet_provenance` object

Allowed keys in `packet.packet_provenance`:

| Key | Required | Notes |
| --- | --- | --- |
| `merge_mode` | yes for explicit packets | Must be `planning_overlay` or `source_driven_refresh`. |
| `source_authority` | no | Optional consistency cross-check. Normally omitted. |
| `source_id` | no | Optional consistency cross-check. Normally omitted. |
| `source_kind` | no | Optional consistency cross-check. Normally omitted. |

Normal practice:

- set `merge_mode`;
- let the CLI resolve and normalize the rest from `packet.source`;
- provide the other provenance fields only when you intentionally want a consistency assertion.

## Merge modes

### `source_driven_refresh`

Use when packet content is derived from authoritative architecture, ADR, runtime, deployment, code, or operational evidence.

Typical use:

- initial backlog creation from architecture;
- current-truth updates;
- authoritative refresh of claims, items, proofs, or as-built state.

Rules:

- may use `replace_sections`;
- may update `delivery_state` only when backed by authoritative current-truth evidence;
- should be the default mode for architecture-derived packet creation.

### `planning_overlay`

Use when packet content changes planning intent without claiming new current-truth delivery.

Typical use:

- changing owner or dependency planning;
- creating `Gap`, `Unknown`, or `Spike`;
- adjusting roadmap relations;
- editing commitment-related claim decisions.

Rules:

- must not use `replace_sections`;
- must not move an item to `partially_delivered` or `delivered`;
- must not rewrite immutable source-authority identity fields;
- claim-commitment planning edits should change only commitment-related claim fields plus linked `negative_scope`.

## Allowed packet sections

The packet may contain any of these section keys:

- `id_strategy`
- `glossary`
- `aliases`
- `source_exclusions`
- `target_system`
- `value_streams`
- `tracks`
- `track_gates`
- `track_journeys`
- `as_built`
- `claims`
- `negative_scope`
- `quality_attributes`
- `policy_decisions`
- `contracts`
- `data_domains`
- `gaps`
- `contradictions`
- `unknowns`
- `uncertainty_to_spike`
- `delivered_lineage_notes`
- `items`
- `relations`
- `proofs`
- `track_proofs`
- `reviews`
- `waivers`
- `roadmap_matrix`

Default intent mapping:

| Intent | Typical sections |
| --- | --- |
| Create backlog from architecture | `id_strategy`, `glossary`, `aliases`, `target_system`, `value_streams`, `tracks`, `claims`, `negative_scope`, `quality_attributes`, `policy_decisions`, `contracts`, `data_domains` |
| Add current truth | `as_built`, `track_gates`, `track_journeys`, `unknowns`, `uncertainty_to_spike`, `delivered_lineage_notes`, `items`, `relations`, `proofs`, `track_proofs`, `reviews`, `waivers` |
| General planning item edit | `items` |
| Dependency or roadmap edit | `relations`, optionally `roadmap_matrix` |
| Gap or Unknown edit | `gaps` or `unknowns` |
| Claim commitment or negative scope edit | `claims`, `negative_scope` |

## Upsert identity by section

Array sections are upserted by stable identity. Use these IDs consistently:

| Section | Upsert identity |
| --- | --- |
| `source_exclusions` | `source_id` |
| `value_streams` | `value_stream_id` |
| `tracks` | `track_id` |
| `track_gates` | `track_gate_id` |
| `track_journeys` | `journey_id` |
| `claims` | `claim_id` |
| `negative_scope` | `negative_scope_id` |
| `quality_attributes` | `quality_attribute_id` |
| `policy_decisions` | `policy_decision_id` |
| `contracts` | `contract_id` |
| `data_domains` | `domain_id` |
| `gaps` | `issue_id` |
| `contradictions` | `issue_id` |
| `unknowns` | `issue_id` |
| `uncertainty_to_spike` | `unknown_id` + `spike_item_id` |
| `delivered_lineage_notes` | `lineage_note_id` |
| `items` | `item_id` |
| `relations` | `relation_id`, otherwise `relation_type + from + to` |
| `proofs` | `proof_id` |
| `track_proofs` | `track_proof_id` |
| `reviews` | `review_id` |
| `waivers` | `waiver_id` |
| `roadmap_matrix` | `row_id`, otherwise `item_ref.id` |

## Shared enums you usually need

Use these exact values when setting fields governed by the validator:

| Field | Allowed values |
| --- | --- |
| `item_class` | `capability_seam`, `feature_slice`, `control_guardrail`, `migration`, `retirement`, `spike_discovery`, `operational_enablement`, `documentation_support_enablement` |
| `relation_type` | `realizes`, `decomposes_into`, `depends_on`, `blocked_by`, `governed_by`, `migrates_from`, `retires`, `replaces`, `proves`, `reviewed_by`, `belongs_to_track`, `touches_contract`, `touches_data_domain`, `enabled_by` |
| `backlog_protocol_state` | `candidate`, `discovered`, `validated`, `accepted` |
| `delivery_state` | `not_started`, `partially_delivered`, `delivered` |
| `readiness_state` | `not_ready`, `needs_clarification`, `ready` |
| `closure_state` | `open`, `partial`, `closed` |
| `summary_label` | `Implemented`, `Partially implemented`, `Planned`, `Missing`, `Blocked`, `Needs clarification` |
| `claim_class` | `functional_capability`, `control_obligation`, `interface_contract`, `data_evolution`, `migration`, `retirement`, `operational_capability`, `policy_decision_need` |
| `claim.commitment` | `committed`, `deferred`, `optional`, `out_of_scope` |
| `source.kind` | `architecture_doc`, `adr`, `runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence`, `operational_evidence`, `backlog_text` |
| `source.authority` | `authoritative_target_truth`, `authoritative_current_truth`, `historical_context_only`, `superseded_excluded`, `planning_only` |
| `track_gate.fail_mode` | `fail_open`, `fail_closed` |
| `rollout.mode` | `dark_launch`, `canary`, `shadow`, `phased`, `big_bang` |
| `recovery.class` | `deploy_rollback`, `config_secret_rollback`, `schema_data_rollback`, `forward_fix_only`, `backup_restore`, `replay_rebuild`, `no_safe_rollback` |
| `compatibility_class` | `backward`, `forward`, `breaking` |
| `uncertainty_class` | `decision_unknown`, `integration_unknown`, `scale_unknown`, `security_unknown`, `policy_unknown`, `data_unknown`, `operability_unknown` |
| `origin_ref.kind` | `claim_ref`, `gap_ref`, `control_obligation_ref`, `policy_decision_ref`, `decommission_need_ref`, `review_finding_ref`, `unknown_ref` |
| `negative_scope_class` | `optional`, `future`, `manual`, `trusted_local_only`, `compatibility_only`, `stub`, `health_only`, `out_of_scope` |
| `policy_decision.decision_state` | `required`, `decided`, `waived`, `deferred` |
| `proof.dimensions.*.status` | `present`, `missing`, `not_applicable` |
| `review.review_scope` | `item`, `run`, `track_proof` |
| `review.role` / `waiver.waived_role` | `product_strategy`, `system_architecture`, `application_engineering`, `platform_sre`, `support_operations`, `security`, `qa_release` |
| `review.verdict` | `pass`, `pass_with_findings`, `fail` |

## Delivery-state rule that most often surprises authors

`delivery_state=partially_delivered` or `delivery_state=delivered` is allowed only when the merged item carries **authoritative current-truth evidence**.

In practice this means:

- the packet must be `source_driven_refresh`;
- the packet source must be one of `runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence`, or `operational_evidence`;
- the source authority must be `authoritative_current_truth`;
- the merged item must keep the managed `source_refs` / `packet_provenance` that point to that current-truth source.

Planning overlays must not claim delivery.

Practical rule for external planning prose:

- planning or workflow statuses from external backlog systems are not delivery evidence by themselves;
- do not copy external planning vocabulary into `delivery_state` unless the operator explicitly gives a mapping rule for the current run;
- when the operator does give such a mapping rule, restate that assumption before encoding it.

## Validation-required section shapes

This section lists the fields you need when you are **creating** new entries.

### Always-on structural sections

These sections must exist in the merged run. For initial backlog creation they should be treated as mandatory:

| Section | Required shape |
| --- | --- |
| `glossary` | Non-empty object of `canonical_term -> non-empty string` |
| `aliases` | Non-empty object of `canonical_term -> non-empty string[]`; aliases must not repeat the canonical term |
| `id_strategy` | Non-empty object; must define keys for every used ledger class such as `source`, `claim`, `negative_scope`, `quality_attribute`, `policy_decision`, `contract`, `data_domain`, `gap`, `contradiction`, `unknown`, `item`, `proof`, `review`, `track`, `value_stream`, `journey`, `track_gate`, `track_proof`, `waiver` |
| `target_system` | Non-empty arrays for `actors`, `operator_personas`, `external_consumer_groups`, `external_dependencies`, `trust_boundaries`, `durable_state_families`, `control_surfaces`, `failure_domains`, `team_and_ownership_assumptions`, `quality_goals`, `policy_surfaces` |
| `as_built` | Non-empty arrays for `deployable_surfaces`, `services`, `processes`, `jobs`, `apis`, `event_surfaces`, `queues`, `state_stores`, `deployable_units`, `ownership_matrix`, `environment_matrix`, `ingress_interfaces`, `egress_interfaces`, `canonical_writers`, `trust_boundary_crossings`, `data_classes`, `vendor_external_owners`; arrays for `synthetic_behaviors`, `compatibility_only_behaviors`, `missing_operational_inputs`; `dependency_classifications[]` with `dependency_id`, `criticality`, `owner` |

### Track model

| Section | Required shape |
| --- | --- |
| `value_streams[]` | `value_stream_id`, `title`, `description`, non-empty `primary_personas`, `initiating_triggers`, `workflow_steps`, `success_conditions`, non-empty `linked_track_ids`, `support_handoff` |
| `tracks[]` | `track_id`, `title`, `description`, `closure_goal`, valid states (`backlog_protocol_state`, `delivery_state`, `readiness_state`, `closure_state`, `summary_label`), arrays `first_shippable_journey_ids`, `required_track_gate_ids`, `track_proof_refs` |
| `track_journeys[]` | `journey_id`, valid `track_id`, valid `value_stream_id`, `persona`, `trigger`, non-empty `workflow_steps`, `success_condition`, `support_handoff` |
| `track_gates[]` | `track_gate_id`, valid `track_id`, `title`, `description`, `gate_type`, valid `fail_mode`, non-empty `owner_refs`, non-empty `required_proof_refs`, non-empty `applies_to_journey_ids`, non-empty `recalculation_triggers`; `governing_control_item_refs` is required and non-empty for `fail_closed` / `safety` gates |
| `track_proofs[]` | `track_proof_id`, valid `track_id`, non-empty `proof_refs`, `coverage` with booleans for `boot_startup_dependencies`, `end_to_end_journey`, `operator_control_path`, `degraded_mode_exercise`, `release_gate_execution`, `rollback_or_recovery_rehearsal`, `observability_and_alert_routing`, `runbook_and_escalation_path` |

There are three methodology-required tracks in the merged run:

- `minimal-working-system`
- `externally-safe-operationally-supportable`
- `full-target-system`

Each of those tracks must have at least one journey, one gate, and one track proof.

### Claim and governance ledgers

| Section | Required shape |
| --- | --- |
| `claims[]` | `claim_id`, `title`, valid `claim_class`, valid `commitment`, non-empty `source_refs`; `revisit_trigger` is also required when `commitment` is `deferred` or `optional` |
| `quality_attributes[]` | Ledger must not be empty; each entry needs `quality_attribute_id`, `title`, supported `quality_class`, `target`, `applies_to_refs[]`, `owner_refs[]`, `source_refs[]`, `proof_refs[]` |
| `policy_decisions[]` | Ledger must not be empty; each entry needs `policy_decision_id`, `title`, `policy_surface`, valid `decision_state`, `owner`, `source_refs[]`, `related_item_refs[]`; `revisit_trigger` is required when state is `required` or `deferred` |
| `contracts[]` | `contract_id`, `title`, `owner`, `versioning_strategy`, `reconciliation_strategy`, `deprecation_window`, `retirement_condition` |
| `data_domains[]` | `domain_id`, `title`, `data_class`, non-empty `owners[]` |

### Issues, spikes, and negative scope

| Section | Required shape |
| --- | --- |
| `gaps[]`, `contradictions[]`, `unknowns[]` | `issue_id`, `title`, `severity`, `source_refs[]`; `owner_implications[]`, `related_claim_refs[]`, and `related_item_refs[]` must exist as arrays; `unknowns[]` additionally require `resolution_state` |
| `uncertainty_to_spike[]` | `unknown_id`, `spike_item_id`; each `unknown_id` may map to only one spike and the target item must be a `spike_discovery` |
| `negative_scope[]` | `negative_scope_id`, `title`, valid `negative_scope_class`, `source_refs[]`, non-empty `owner_implications[]`, non-empty `related_claim_refs[]`, `related_item_refs[]`, `revisit_trigger`; for `manual`, `stub`, `trusted_local_only`, `compatibility_only` also require `critical_path_item_refs[]` and `owner_seam_item_refs[]` |
| `delivered_lineage_notes[]` | `lineage_note_id`, valid `item_id`, `note`, `proof_refs[]` |

Additional issue-state rules:

- `Gap` and `Unknown` entries use `resolution_state` values `open`, `resolved`, `downgraded` when present.
- `resolved` / `downgraded` require `resolution_note`.
- `downgraded` also requires `downgraded_severity`.
- A critical/high unresolved unknown must be resolved, downgraded, or linked via `uncertainty_to_spike`.
- If a claim is marked `out_of_scope`, it must have a matching `negative_scope` entry.

### `items[]`: general required fields

Every new item must include at least:

| Field | Requirement |
| --- | --- |
| `item_id` | Stable unique item ID |
| `item_class` | Valid item class |
| `track_id` | Valid existing track ID |
| `backlog_protocol_state` | Valid protocol state |
| `delivery_state` | Valid delivery state; delivered states require authoritative current-truth evidence |
| `readiness_state` | Valid readiness state |
| `closure_state` | Valid closure state |
| `summary_label` | Valid summary label |
| `title` | Strongly expected; feature slices must not use generic horizontal titles |
| `origin_ref[]` | Non-empty array of valid `kind` + `ref` pairs |
| `owners.decision_owner` | Required |
| `owners.delivery_owner` | Required |
| `dependency_refs[]` | Must exist as an array |
| `proof_refs[]` | Must be a non-empty array |
| `evidence_freshness_sla` | Required |
| `actor_role_set[]` | Required for all item classes |
| `value.persona_or_operator_served` | Required for all item classes |
| `value.product_or_operator_value` | Required for all item classes |
| `value.why_now` | Required for all item classes |
| `readiness_contract` | Needed whenever `readiness_state=ready` |
| `done_contract` | Needed whenever `closure_state=closed` |

General conditional rules:

- `adr_refs[]` is required for `capability_seam` and `feature_slice`.
- `actor_role_set` must include `value.persona_or_operator_served`.
- `dependency_refs` may be empty, but the array itself must exist.
- `proof_refs` must have matching graph-level `proves` relations, and at least one referenced proof must have `covered_ref = item`.
- Every item must have exactly one `belongs_to_track` relation.
- Obsolete pre-GA fields must not be used: `rollout_mode`, `rollback_class`, `n_a_justification`.

### Item-level contracts and supporting objects

Use these shapes when applicable:

| Object | Required shape / rule |
| --- | --- |
| `planning_constraints` on `feature_slice` | Must include `external_lead_time_risk`, `staffing_skill_constraints`, `blocked_by_decision_status`, valid `dominant_uncertainty_class`, valid `dominant_rollback_class`, `blast_radius_note`, and `unresolved_questions_below_threshold=true` |
| `nfr_contract` | Required for `capability_seam`, `feature_slice`, `control_guardrail`, `migration`, `operational_enablement`; must include `latency`, `throughput`, `concurrency`, `availability`, `durability`, `rpo`, `rto`, `cost_budget`, `privacy_compliance_class`, `accessibility_localization_duty`, `auditability_traceability`, `scalability_envelope` |
| `observability_contract` | Required for every item that needs observability coverage; must include non-empty arrays `sli_slo`, `alert_thresholds`, `audit_requirements`, `security_controls`, `privacy_controls`, `analytics_obligations`; arrays `monitoring_evidence_refs`, `dashboards`, `runbook_refs`, `telemetry_signals`, `residual_exceptions`; and explicit `bypass_governance` |
| `rollout` | `applicability` must be `required` or `not_applicable`; if `required`, valid `mode` is required; if `not_applicable`, justification is required and only `spike_discovery`, `operational_enablement`, `documentation_support_enablement` may use it; each `temporary_controls[]` entry must include `control_id`, `description`, `retirement_owner`, `retirement_date` |
| `recovery` | `applicability` must be `required` or `not_applicable`; if `required`, valid rollback class is required; if `not_applicable`, justification is required and only `spike_discovery`, `operational_enablement`, `documentation_support_enablement` may use it |
| `contract_governance` | Required when the item changes contracts, data domains, migrations, or trust boundaries; must include `applicable=true`, `contract_owner`, `compatibility_class`, `versioning_strategy`, `consumer_impact`, `migration_strategy`, `canonical_writer`, `reconciliation_strategy`, `deprecation_window`, `retirement_condition` |

For ready items, the validator expects `readiness_contract` booleans for:

- `behavior_described`
- `happy_path_defined`
- `error_paths_defined`
- `acceptance_examples_defined`
- `interface_data_impact_described`
- `nfr_impact_known`
- `security_privacy_impact_known`
- `rollout_defined`
- `recovery_defined`
- `observability_contract_defined`
- `required_proof_defined`
- `docs_support_impact_described`
- `estimate_band_defined`
- `confidence_defined`
- `unresolved_questions_below_threshold`

For closed items, the validator expects `done_contract` booleans for:

- `code_and_infra_complete`
- `tests_and_verification_complete`
- `dashboards_alerts_traces_logging_present`
- `runbooks_and_support_handoff_present`
- `migration_execution_or_safe_schedule_complete`
- `release_notes_and_docs_updated`
- `flags_and_kill_switches_governed`
- `temporary_mechanism_retirement_recorded`

`operational_enablement` and `documentation_support_enablement` may exempt:

- `readiness_contract.rollout_defined`
- `readiness_contract.recovery_defined`
- `done_contract.code_and_infra_complete`
- `done_contract.migration_execution_or_safe_schedule_complete`

### Class-specific item payloads

Use only the payload fields that match the `item_class`. Mixing semantic levels hard-fails validation.

| `item_class` | Required class-specific fields |
| --- | --- |
| `capability_seam` | `capability_added`, non-empty `owner_surfaces[]`, `real_closure_definition` |
| `feature_slice` | `parent_seam_id` or `class_payload.parent_seam_ref`, non-empty `acceptance_examples[]`, persona/value fields, `why_now`, valid `slice_value_kind`, bounded impact via `interfaces_touched` and/or `data_domains_touched` and/or `change_surfaces` |
| `control_guardrail` | `control_objective`, `enforcing_surface`, `fail_mode`; `observability_contract.monitoring_evidence_refs[]` must be non-empty |
| `migration` | `source_state`, `target_state`, `compatibility_class`, `migration_strategy`, `canonical_writer`, `stop_go_checkpoint`, non-empty `cleanup_scope[]` |
| `retirement` | `replaces_or_retires_ref`, `retirement_trigger`, non-empty `legacy_assets[]`, non-empty `dependent_consumers[]`, `cleanup_scope[]` covering `code`, `flags`, `secrets`, `docs`, `dashboards`, `alerts`, `data` |
| `spike_discovery` | `uncertainty_class`, `question`, `validation_method`, `expected_artifact`, `max_duration`, `exit_criteria`, `kill_criteria`, non-empty `follow_on_item_refs[]` |
| `operational_enablement` | `runbook_or_enablement_artifact`, `operational_audience`, plus `owners.runtime_owner` and `owners.escalation_owner` |
| `documentation_support_enablement` | `doc_audience`, `doc_scope`, `source_of_truth_artifact`, `freshness_update_trigger`, `freshness_update_owner`, `support_handoff_artifact` |

Extra closed-item class checks:

- closed `feature_slice` also requires done checks `end_to_end_acceptance_examples_pass`, `production_proof_fresh`, `rollout_and_recovery_rehearsed`;
- closed `migration` also requires `migration_executed_or_gated`, `reconciliation_evidence_exists`, `old_write_path_status_explicit`, `rollback_forward_fix_decision_evidenced`;
- closed `retirement` also requires `old_path_disabled_or_residual_gate_governed`, `dependent_assets_removed_or_residual_items`, `consumer_impact_window_closed_or_governed`, `cleanup_proof_exists`;
- closed `control_guardrail` also requires `canonical_path_enforced`, `alerting_audit_evidence_exists`, `bypass_rules_governed`, `residual_exceptions_recorded`;
- closed `operational_enablement` also requires `required_operational_artifacts_exist`, `ownership_and_escalation_surfaces_current`, `enablement_proof_fresh`;
- closed `documentation_support_enablement` also requires `published_to_intended_audience`, `freshness_owner_assigned`, `handoff_guidance_linked`;
- `spike_discovery` uses `done_contract.class_specific_checks` with `promised_artifact_exists`, `outcome_recorded`, `follow_on_items_linked`, `silent_continuation_blocked`.

### Graph rules for `relations[]`

`relations[]` is not just decorative; the validator checks graph topology against item classes.

Core requirements:

- every relation must use valid `from` / `to` graph refs and a valid `relation_type`;
- every item must have exactly one `belongs_to_track` relation to its `track_id`;
- every `proof_ref` used by an item must have a matching `proves` relation from the item;
- every `track_proof` must have a `proves` relation from the owning track;
- every `review` must have a `reviewed_by` relation from the reviewed object to the review artifact.

Class-specific graph rules:

- `capability_seam` must `decomposes_into` child work; allowed child classes are `feature_slice`, `control_guardrail`, `migration`, `retirement`, `operational_enablement`, `documentation_support_enablement`
- `feature_slice` must have exactly one `realizes` relation to a `capability_seam`
- `control_guardrail` must be the target of at least one `governed_by` relation
- `migration` must have exactly one `migrates_from` relation
- `retirement` must have at least one `retires` relation
- `spike_discovery` must not `decomposes_into` implementation work and must be linked from `uncertainty_to_spike`
- `operational_enablement` and `documentation_support_enablement` must have at least one `enabled_by` or `governed_by` relation
- contract/data-changing items must have `touches_contract` / `touches_data_domain` relations that match `interfaces_touched` / `data_domains_touched`

### `proofs[]`, `reviews[]`, and `waivers[]`

| Section | Required shape |
| --- | --- |
| `proofs[]` | `proof_id`, `covered_ref`, `covered_commit_or_build`, `environment`, valid timestamp `executed_at`, `freshness_rule`, non-empty `invalidated_by[]`; `dimensions` must exist for every dimension key and each dimension must be `present` or `not_applicable` (never `missing` in a valid run); `present` dimensions need `command` or `artifact` or `procedure`; `not_applicable` needs `justification`, and only `security_trace` may be `not_applicable` |
| `reviews[]` | `review_id`, valid `review_scope`, `reviewed_ref`, `reviewer`, valid `role`, valid `verdict`, non-empty `evidence_refs[]`, numeric `score_contribution`, valid timestamp `reviewed_at`; `verdict=fail` additionally requires non-empty `hard_fail_report[]` |
| `waivers[]` | `waiver_id`, valid `waived_role`, `scope`, `granting_authority`, `rationale`, `expiry_or_revisit_trigger`, `impacted_surfaces[]`; `valid` is strongly expected for clarity |

Implementation-grade runs additionally need independent reviews for the baseline roles:

- `product_strategy`
- `system_architecture`
- `application_engineering`
- `platform_sre`
- `security`
- `qa_release`
- `support_operations`

## Usually derived, not hand-authored

These sections are technically allowed in packets, but in normal workflow they should be left to the CLI unless you are intentionally repairing or rehydrating canonical state:

- `roadmap_matrix`
- `summary_label` values that the repair step can derive from state
- `source_refs` / `packet_provenance` bookkeeping for current-truth delivery evidence

If you do author `roadmap_matrix`, it must mirror `items[]` + `relations[]` exactly: state fields, parent/child refs, dependency refs, dependency entries, proof refs, ranks, and economic factors are all cross-checked.

## Minimal examples

### Compact end-to-end example

This example is intentionally small, but still follows the full graph shape expected by `discover`.

Use the same two-packet split in your own runs:

1. Put the target-truth packet in the architecture source.
2. Put the current-truth packet in the runtime/deployment/current-truth source.
3. Run `discover` against both sources.

Command shape:

```bash
node scripts/architecture-backlog.mjs discover ./tmp/abe-example \
  --architecture-source ./tmp/abe-example/architecture.md \
  --runtime-source ./tmp/abe-example/runtime.md
```

`architecture.md`

````markdown
# Architecture example

```architecture-backlog-packet
{
  "source": {
    "source_id": "src-architecture",
    "ref": "./tmp/abe-example/architecture.md",
    "kind": "architecture_doc",
    "authority": "authoritative_target_truth",
    "precedence": 1,
    "notes": "Canonical target-truth example."
  },
  "packet_provenance": {
    "merge_mode": "source_driven_refresh"
  },
  "id_strategy": {
    "source": "src",
    "claim": "claim",
    "negative_scope": "neg",
    "quality_attribute": "qa",
    "policy_decision": "policy",
    "contract": "contract",
    "data_domain": "domain",
    "gap": "gap",
    "contradiction": "contradiction",
    "unknown": "unknown",
    "item": "item",
    "proof": "proof",
    "review": "review",
    "track": "track",
    "value_stream": "vs",
    "journey": "journey",
    "track_gate": "gate",
    "track_proof": "track-proof",
    "waiver": "waiver"
  },
  "glossary": {
    "runtime": "Identity-bearing runtime surface.",
    "guardrail": "Fail-closed control on the operator path."
  },
  "aliases": {
    "runtime": ["core"],
    "guardrail": ["control"]
  },
  "target_system": {
    "actors": ["operator"],
    "operator_personas": ["runtime-operator"],
    "external_consumer_groups": ["operators"],
    "external_dependencies": ["example-provider", "example-alerting"],
    "trust_boundaries": ["operator boundary"],
    "durable_state_families": ["example-state"],
    "control_surfaces": ["operator api", "guardrails"],
    "failure_domains": ["provider latency", "operator misuse"],
    "team_and_ownership_assumptions": ["runtime-team owns the canonical path"],
    "quality_goals": ["safe operator completion"],
    "policy_surfaces": ["operator access policy"]
  },
  "value_streams": [
    {
      "value_stream_id": "vs-min",
      "title": "Minimal operator flow",
      "description": "First runnable operator flow.",
      "primary_personas": ["operator"],
      "initiating_triggers": ["operator submits request"],
      "workflow_steps": ["Submit request", "Validate", "Persist result"],
      "success_conditions": ["Operator request completes"],
      "linked_track_ids": ["minimal-working-system"],
      "support_handoff": "runtime-support"
    },
    {
      "value_stream_id": "vs-safe",
      "title": "Safety and ops closure",
      "description": "Fail-closed and supportable operation.",
      "primary_personas": ["operator"],
      "initiating_triggers": ["external readiness review"],
      "workflow_steps": ["Verify guardrail", "Confirm alerts", "Confirm runbook"],
      "success_conditions": ["Safe and supportable control path"],
      "linked_track_ids": ["externally-safe-operationally-supportable"],
      "support_handoff": "runtime-support"
    },
    {
      "value_stream_id": "vs-full",
      "title": "Full target closure",
      "description": "Durable documentation and handoff.",
      "primary_personas": ["operator"],
      "initiating_triggers": ["release handoff"],
      "workflow_steps": ["Review docs", "Confirm ownership", "Publish handoff"],
      "success_conditions": ["Support source of truth is current"],
      "linked_track_ids": ["full-target-system"],
      "support_handoff": "runtime-support"
    }
  ],
  "tracks": [
    {
      "track_id": "minimal-working-system",
      "title": "Minimal working system",
      "description": "First runnable system.",
      "closure_goal": "One runnable end-to-end operator flow.",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "first_shippable_journey_ids": ["journey-min"],
      "required_track_gate_ids": ["gate-min"],
      "track_proof_refs": ["track-proof-min"]
    },
    {
      "track_id": "externally-safe-operationally-supportable",
      "title": "Externally safe and supportable",
      "description": "Safe external operation.",
      "closure_goal": "Fail-closed and supportable operator path.",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "first_shippable_journey_ids": ["journey-safe"],
      "required_track_gate_ids": ["gate-safe"],
      "track_proof_refs": ["track-proof-safe"]
    },
    {
      "track_id": "full-target-system",
      "title": "Full target system",
      "description": "Target-state closure.",
      "closure_goal": "Durable docs and handoff close the target.",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "first_shippable_journey_ids": ["journey-full"],
      "required_track_gate_ids": ["gate-full"],
      "track_proof_refs": ["track-proof-full"]
    }
  ],
  "claims": [
    {
      "claim_id": "claim-core",
      "title": "The system must expose one canonical operator flow.",
      "claim_class": "functional_capability",
      "commitment": "committed",
      "source_refs": ["src-architecture"]
    },
    {
      "claim_id": "claim-core-control",
      "title": "Unsafe operator requests must fail closed.",
      "claim_class": "control_obligation",
      "commitment": "committed",
      "source_refs": ["src-architecture"]
    },
    {
      "claim_id": "claim-core-ops",
      "title": "Operators must have explicit support handoff and runbooks.",
      "claim_class": "operational_capability",
      "commitment": "committed",
      "source_refs": ["src-architecture"]
    }
  ],
  "negative_scope": [],
  "quality_attributes": [
    {
      "quality_attribute_id": "qa-latency",
      "title": "Operator p95 latency target",
      "quality_class": "latency",
      "target": "p95 < 500ms",
      "applies_to_refs": [
        { "kind": "item", "id": "item-core-slice" },
        { "kind": "track", "id": "minimal-working-system" }
      ],
      "owner_refs": ["runtime-team"],
      "source_refs": ["src-architecture"],
      "proof_refs": ["proof-core-slice"]
    }
  ],
  "policy_decisions": [
    {
      "policy_decision_id": "policy-operator-access",
      "title": "Operator access policy fixed",
      "policy_surface": "operator-access",
      "decision_state": "decided",
      "owner": "security-team",
      "source_refs": ["src-architecture"],
      "related_item_refs": ["item-core-slice", "item-core-control"],
      "revisit_trigger": "Access policy changes"
    }
  ],
  "contracts": [
    {
      "contract_id": "contract-example-api",
      "title": "Example operator API",
      "owner": "example-architecture",
      "versioning_strategy": "header-versioned",
      "reconciliation_strategy": "daily state reconciliation",
      "deprecation_window": "30d",
      "retirement_condition": "all operators use v2"
    }
  ],
  "data_domains": [
    {
      "domain_id": "domain-example-state",
      "title": "Example state",
      "data_class": "restricted",
      "owners": ["runtime-team", "security-team"]
    }
  ]
}
```
````

`runtime.md`

````markdown
# Runtime example

```architecture-backlog-packet
{
  "source": {
    "source_id": "src-runtime",
    "ref": "./tmp/abe-example/runtime.md",
    "kind": "runtime_evidence",
    "authority": "authoritative_current_truth",
    "precedence": 2,
    "notes": "Canonical current-truth example."
  },
  "packet_provenance": {
    "merge_mode": "source_driven_refresh"
  },
  "as_built": {
    "deployable_surfaces": ["api", "worker"],
    "services": ["example-api"],
    "processes": ["example-worker"],
    "jobs": ["example-job"],
    "apis": ["operator-api"],
    "event_surfaces": ["example-events"],
    "queues": ["example-queue"],
    "state_stores": ["example-db"],
    "deployable_units": ["example-api-image", "example-worker-image"],
    "ownership_matrix": ["runtime-team"],
    "environment_matrix": ["staging"],
    "ingress_interfaces": ["operator-http"],
    "egress_interfaces": ["provider-http"],
    "canonical_writers": ["example-api"],
    "trust_boundary_crossings": ["operator -> provider"],
    "data_classes": ["restricted"],
    "dependency_classifications": [
      { "dependency_id": "example-provider", "criticality": "boot_critical", "owner": "vendor-provider" },
      { "dependency_id": "example-alerting", "criticality": "degraded", "owner": "vendor-alerting" }
    ],
    "synthetic_behaviors": [],
    "compatibility_only_behaviors": [],
    "vendor_external_owners": ["vendor-provider", "vendor-alerting"],
    "missing_operational_inputs": []
  },
  "track_gates": [
    {
      "track_gate_id": "gate-min",
      "track_id": "minimal-working-system",
      "title": "Minimal proof freshness",
      "description": "The minimal journey has fresh proof.",
      "gate_type": "readiness",
      "fail_mode": "fail_open",
      "governing_control_item_refs": [],
      "owner_refs": ["runtime-team"],
      "required_proof_refs": ["proof-core-slice"],
      "applies_to_journey_ids": ["journey-min"],
      "recalculation_triggers": ["source_change", "proof_change"]
    },
    {
      "track_gate_id": "gate-safe",
      "track_id": "externally-safe-operationally-supportable",
      "title": "Fail-closed safety gate",
      "description": "The external path is fail-closed and supportable.",
      "gate_type": "safety",
      "fail_mode": "fail_closed",
      "governing_control_item_refs": ["item-core-control"],
      "owner_refs": ["security", "runtime-ops"],
      "required_proof_refs": ["proof-core-control", "proof-track-safe"],
      "applies_to_journey_ids": ["journey-safe"],
      "recalculation_triggers": ["source_change", "topology_change", "control_change"]
    },
    {
      "track_gate_id": "gate-full",
      "track_id": "full-target-system",
      "title": "Full target docs gate",
      "description": "The support source of truth is current.",
      "gate_type": "completeness",
      "fail_mode": "fail_open",
      "governing_control_item_refs": [],
      "owner_refs": ["runtime-team", "support"],
      "required_proof_refs": ["proof-core-docs", "proof-track-full"],
      "applies_to_journey_ids": ["journey-full"],
      "recalculation_triggers": ["source_change", "topology_change", "release_change"]
    }
  ],
  "track_journeys": [
    {
      "journey_id": "journey-min",
      "track_id": "minimal-working-system",
      "value_stream_id": "vs-min",
      "persona": "operator",
      "trigger": "Operator submits request",
      "workflow_steps": ["Submit request", "Validate", "Persist result"],
      "success_condition": "One operator request completes safely.",
      "support_handoff": "runtime-support"
    },
    {
      "journey_id": "journey-safe",
      "track_id": "externally-safe-operationally-supportable",
      "value_stream_id": "vs-safe",
      "persona": "operator",
      "trigger": "External readiness review",
      "workflow_steps": ["Verify guardrail", "Confirm alerts", "Confirm runbook"],
      "success_condition": "The external path is fail-closed and supportable.",
      "support_handoff": "runtime-support"
    },
    {
      "journey_id": "journey-full",
      "track_id": "full-target-system",
      "value_stream_id": "vs-full",
      "persona": "operator",
      "trigger": "Release handoff",
      "workflow_steps": ["Review docs", "Confirm ownership", "Publish handoff"],
      "success_condition": "Support documentation is current and owned.",
      "support_handoff": "runtime-support"
    }
  ],
  "unknowns": [],
  "uncertainty_to_spike": [],
  "delivered_lineage_notes": [],
  "items": [
    {
      "item_id": "item-core-seam",
      "item_class": "capability_seam",
      "track_id": "minimal-working-system",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "title": "Core runtime seam",
      "claim_refs": ["claim-core"],
      "adr_refs": ["ADR-EX-1"],
      "origin_ref": [{ "kind": "claim_ref", "ref": "claim-core" }],
      "owners": {
        "decision_owner": "architecture",
        "delivery_owner": "runtime-team",
        "runtime_owner": "runtime-ops",
        "escalation_owner": "incident-manager",
        "consulted_teams": ["security-team"]
      },
      "proof_refs": ["proof-core-seam"],
      "dependency_refs": [],
      "change_surfaces": ["runtime"],
      "interfaces_touched": ["contract-example-api"],
      "data_domains_touched": ["domain-example-state"],
      "trust_boundaries_crossed": ["operator-to-core"],
      "actor_role_set": ["operator"],
      "data_class": "restricted",
      "value": {
        "persona_or_operator_served": "operator",
        "product_or_operator_value": "Own the first runnable runtime seam.",
        "why_now": "Everything else depends on one canonical seam owner.",
        "slice_value_kind": "user_value"
      },
      "estimate_band": "M",
      "confidence": "medium",
      "economic_priority_note": "Unlocks every downstream slice.",
      "evidence_freshness_sla": "7d unless contract or topology changes",
      "contract_governance": {
        "applicable": true,
        "contract_owner": "example-architecture",
        "compatibility_class": "backward",
        "versioning_strategy": "header-versioned",
        "consumer_impact": "operator api and runtime worker",
        "migration_strategy": "bounded phased rollout",
        "canonical_writer": "example-api",
        "reconciliation_strategy": "daily state reconciliation",
        "deprecation_window": "30d",
        "retirement_condition": "all callers use v2"
      },
      "nfr_contract": {
        "latency": "p95 < 500ms for core-seam",
        "throughput": "200 rps for core-seam",
        "concurrency": "100 inflight for core-seam",
        "availability": "99.9%",
        "durability": "no silent loss for core-seam",
        "rpo": "5m",
        "rto": "30m",
        "cost_budget": "within core-seam budget",
        "privacy_compliance_class": "restricted",
        "accessibility_localization_duty": "operator-visible outputs stay accessible",
        "auditability_traceability": "core-seam changes are auditable",
        "scalability_envelope": "3x load for core-seam"
      },
      "observability_contract": {
        "sli_slo": ["core-seam-success-rate >= 99%"],
        "alert_thresholds": ["core-seam-error-rate > 1% for 5m"],
        "audit_requirements": ["core-seam actions logged"],
        "security_controls": ["explicit operator access review"],
        "privacy_controls": ["sensitive payload redaction"],
        "analytics_obligations": ["core-seam telemetry emitted"],
        "monitoring_evidence_refs": ["evidence:core-seam:monitoring"],
        "dashboards": ["dashboard:core-seam"],
        "runbook_refs": ["runbook:core-seam"],
        "telemetry_signals": ["trace:core-seam"],
        "bypass_governance": "No bypass outside incident authority.",
        "residual_exceptions": ["none"]
      },
      "rollout": {
        "applicability": "required",
        "mode": "phased",
        "temporary_controls": [
          {
            "control_id": "TMP-ALLOWLIST",
            "description": "Early operator allowlist",
            "retirement_owner": "runtime-team",
            "retirement_date": "2026-06-01"
          }
        ]
      },
      "recovery": {
        "applicability": "required",
        "class": "deploy_rollback",
        "strategy": "Rollback the runtime image"
      },
      "readiness_contract": {
        "behavior_described": true,
        "happy_path_defined": true,
        "error_paths_defined": true,
        "acceptance_examples_defined": true,
        "interface_data_impact_described": true,
        "nfr_impact_known": true,
        "security_privacy_impact_known": true,
        "rollout_defined": true,
        "recovery_defined": true,
        "observability_contract_defined": true,
        "required_proof_defined": true,
        "docs_support_impact_described": true,
        "estimate_band_defined": true,
        "confidence_defined": true,
        "unresolved_questions_below_threshold": true,
        "class_specific_checks": {}
      },
      "done_contract": {},
      "class_payload": {
        "capability_added": "One canonical runtime path",
        "owner_surfaces": ["example-api", "example-worker"],
        "real_closure_definition": "One operator request flows through the canonical runtime path."
      }
    },
    {
      "item_id": "item-core-slice",
      "item_class": "feature_slice",
      "track_id": "minimal-working-system",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "title": "Operator request slice",
      "claim_refs": ["claim-core"],
      "adr_refs": ["ADR-EX-1"],
      "origin_ref": [{ "kind": "claim_ref", "ref": "claim-core" }],
      "owners": {
        "decision_owner": "product",
        "delivery_owner": "runtime-team",
        "runtime_owner": "runtime-ops",
        "escalation_owner": "incident-manager",
        "consulted_teams": ["security-team"]
      },
      "proof_refs": ["proof-core-slice"],
      "dependency_refs": ["item-core-seam"],
      "change_surfaces": ["runtime", "trust_boundary", "data_class"],
      "interfaces_touched": ["contract-example-api"],
      "data_domains_touched": ["domain-example-state"],
      "trust_boundaries_crossed": ["operator-to-core"],
      "actor_role_set": ["operator"],
      "data_class": "restricted",
      "value": {
        "persona_or_operator_served": "operator",
        "product_or_operator_value": "An operator request completes through the canonical path.",
        "why_now": "This is the first shippable journey.",
        "slice_value_kind": "user_value"
      },
      "planning_constraints": {
        "external_lead_time_risk": "none",
        "staffing_skill_constraints": "runtime + api familiarity",
        "blocked_by_decision_status": false,
        "dominant_uncertainty_class": "integration_unknown",
        "dominant_rollback_class": "deploy_rollback",
        "blast_radius_note": "Operator control path only",
        "unresolved_questions_below_threshold": true
      },
      "estimate_band": "S",
      "confidence": "high",
      "economic_priority_note": "First shippable journey.",
      "evidence_freshness_sla": "7d unless contract or topology changes",
      "contract_governance": {
        "applicable": true,
        "contract_owner": "example-architecture",
        "compatibility_class": "backward",
        "versioning_strategy": "header-versioned",
        "consumer_impact": "operator api and runtime worker",
        "migration_strategy": "bounded phased rollout",
        "canonical_writer": "example-api",
        "reconciliation_strategy": "daily state reconciliation",
        "deprecation_window": "30d",
        "retirement_condition": "all callers use v2"
      },
      "nfr_contract": {
        "latency": "p95 < 500ms for core-slice",
        "throughput": "200 rps for core-slice",
        "concurrency": "100 inflight for core-slice",
        "availability": "99.9%",
        "durability": "no silent loss for core-slice",
        "rpo": "5m",
        "rto": "30m",
        "cost_budget": "within core-slice budget",
        "privacy_compliance_class": "restricted",
        "accessibility_localization_duty": "operator-visible outputs stay accessible",
        "auditability_traceability": "core-slice changes are auditable",
        "scalability_envelope": "3x load for core-slice"
      },
      "observability_contract": {
        "sli_slo": ["core-slice-success-rate >= 99%"],
        "alert_thresholds": ["core-slice-error-rate > 1% for 5m"],
        "audit_requirements": ["core-slice actions logged"],
        "security_controls": ["explicit operator access review"],
        "privacy_controls": ["sensitive payload redaction"],
        "analytics_obligations": ["core-slice telemetry emitted"],
        "monitoring_evidence_refs": ["evidence:core-slice:monitoring"],
        "dashboards": ["dashboard:core-slice"],
        "runbook_refs": ["runbook:core-slice"],
        "telemetry_signals": ["trace:core-slice"],
        "bypass_governance": "No bypass outside incident authority.",
        "residual_exceptions": ["none"]
      },
      "rollout": {
        "applicability": "required",
        "mode": "phased",
        "temporary_controls": [
          {
            "control_id": "TMP-SLICE",
            "description": "Operator-only rollout",
            "retirement_owner": "runtime-team",
            "retirement_date": "2026-06-01"
          }
        ]
      },
      "recovery": {
        "applicability": "required",
        "class": "deploy_rollback",
        "strategy": "Rollback the request path"
      },
      "readiness_contract": {
        "behavior_described": true,
        "happy_path_defined": true,
        "error_paths_defined": true,
        "acceptance_examples_defined": true,
        "interface_data_impact_described": true,
        "nfr_impact_known": true,
        "security_privacy_impact_known": true,
        "rollout_defined": true,
        "recovery_defined": true,
        "observability_contract_defined": true,
        "required_proof_defined": true,
        "docs_support_impact_described": true,
        "estimate_band_defined": true,
        "confidence_defined": true,
        "unresolved_questions_below_threshold": true,
        "class_specific_checks": {}
      },
      "done_contract": {},
      "class_payload": {
        "parent_seam_ref": { "kind": "item", "id": "item-core-seam" },
        "acceptance_examples": [
          "Operator submits a valid request and receives success.",
          "Invalid input fails safely without partial write."
        ]
      }
    },
    {
      "item_id": "item-core-control",
      "item_class": "control_guardrail",
      "track_id": "externally-safe-operationally-supportable",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "title": "Fail-closed operator guardrail",
      "origin_ref": [{ "kind": "control_obligation_ref", "ref": "claim-core-control" }],
      "owners": {
        "decision_owner": "security",
        "delivery_owner": "runtime-team",
        "runtime_owner": "runtime-ops",
        "escalation_owner": "incident-manager",
        "consulted_teams": ["security-team"]
      },
      "proof_refs": ["proof-core-control"],
      "dependency_refs": ["item-core-slice"],
      "change_surfaces": ["trust_boundary", "policy", "observability"],
      "interfaces_touched": ["contract-example-api"],
      "data_domains_touched": ["domain-example-state"],
      "trust_boundaries_crossed": ["operator-to-core"],
      "actor_role_set": ["operator"],
      "data_class": "restricted",
      "value": {
        "persona_or_operator_served": "operator",
        "product_or_operator_value": "The external operator path fails closed.",
        "why_now": "The system is not safely operable without this guardrail.",
        "slice_value_kind": "control_closure"
      },
      "estimate_band": "S",
      "confidence": "medium",
      "economic_priority_note": "Closes the fail-closed safety gap.",
      "evidence_freshness_sla": "refresh before external release",
      "contract_governance": {
        "applicable": true,
        "contract_owner": "example-architecture",
        "compatibility_class": "backward",
        "versioning_strategy": "header-versioned",
        "consumer_impact": "operator api and runtime worker",
        "migration_strategy": "bounded phased rollout",
        "canonical_writer": "example-api",
        "reconciliation_strategy": "daily state reconciliation",
        "deprecation_window": "30d",
        "retirement_condition": "all callers use v2"
      },
      "nfr_contract": {
        "latency": "p95 < 500ms for core-control",
        "throughput": "200 rps for core-control",
        "concurrency": "100 inflight for core-control",
        "availability": "99.9%",
        "durability": "no silent loss for core-control",
        "rpo": "5m",
        "rto": "30m",
        "cost_budget": "within core-control budget",
        "privacy_compliance_class": "restricted",
        "accessibility_localization_duty": "operator-visible outputs stay accessible",
        "auditability_traceability": "core-control changes are auditable",
        "scalability_envelope": "3x load for core-control"
      },
      "observability_contract": {
        "sli_slo": ["core-control-success-rate >= 99%"],
        "alert_thresholds": ["core-control-error-rate > 1% for 5m"],
        "audit_requirements": ["core-control actions logged"],
        "security_controls": ["explicit operator access review"],
        "privacy_controls": ["sensitive payload redaction"],
        "analytics_obligations": ["core-control telemetry emitted"],
        "monitoring_evidence_refs": ["evidence:core-control:monitoring"],
        "dashboards": ["dashboard:core-control"],
        "runbook_refs": ["runbook:core-control"],
        "telemetry_signals": ["trace:core-control"],
        "bypass_governance": "No bypass outside incident authority.",
        "residual_exceptions": ["none"]
      },
      "rollout": {
        "applicability": "required",
        "mode": "phased",
        "temporary_controls": [
          {
            "control_id": "TMP-FAIL-CLOSED",
            "description": "Temporary allowlist while controls are verified",
            "retirement_owner": "security",
            "retirement_date": "2026-06-10"
          }
        ]
      },
      "recovery": {
        "applicability": "required",
        "class": "forward_fix_only",
        "strategy": "Disable launch and keep the fail-closed path active"
      },
      "readiness_contract": {
        "behavior_described": true,
        "happy_path_defined": true,
        "error_paths_defined": true,
        "acceptance_examples_defined": true,
        "interface_data_impact_described": true,
        "nfr_impact_known": true,
        "security_privacy_impact_known": true,
        "rollout_defined": true,
        "recovery_defined": true,
        "observability_contract_defined": true,
        "required_proof_defined": true,
        "docs_support_impact_described": true,
        "estimate_band_defined": true,
        "confidence_defined": true,
        "unresolved_questions_below_threshold": true,
        "class_specific_checks": {}
      },
      "done_contract": {},
      "class_payload": {
        "control_objective": "Prevent unsafe writes on invalid operator requests.",
        "enforcing_surface": "operator request workflow",
        "fail_mode": "fail_closed"
      }
    },
    {
      "item_id": "item-core-ops",
      "item_class": "operational_enablement",
      "track_id": "externally-safe-operationally-supportable",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "title": "Runtime operational enablement",
      "origin_ref": [{ "kind": "claim_ref", "ref": "claim-core-ops" }],
      "owners": {
        "decision_owner": "platform",
        "delivery_owner": "runtime-team",
        "runtime_owner": "runtime-ops",
        "escalation_owner": "incident-manager",
        "consulted_teams": ["support-team"]
      },
      "proof_refs": ["proof-core-ops"],
      "dependency_refs": ["item-core-control"],
      "change_surfaces": ["runtime", "deployment", "observability", "support"],
      "actor_role_set": ["operator"],
      "value": {
        "persona_or_operator_served": "operator",
        "product_or_operator_value": "Operators get runbooks, alerts, and escalation ownership.",
        "why_now": "The safe track is incomplete without operational handoff.",
        "slice_value_kind": "risk_retirement"
      },
      "estimate_band": "S",
      "confidence": "medium",
      "economic_priority_note": "Makes the safe track operable.",
      "evidence_freshness_sla": "refresh on alerting or topology changes",
      "nfr_contract": {
        "latency": "p95 < 500ms for core-ops",
        "throughput": "200 rps for core-ops",
        "concurrency": "100 inflight for core-ops",
        "availability": "99.9%",
        "durability": "no silent loss for core-ops",
        "rpo": "5m",
        "rto": "30m",
        "cost_budget": "within core-ops budget",
        "privacy_compliance_class": "restricted",
        "accessibility_localization_duty": "operator-visible outputs stay accessible",
        "auditability_traceability": "core-ops changes are auditable",
        "scalability_envelope": "3x load for core-ops"
      },
      "observability_contract": {
        "sli_slo": ["core-ops-success-rate >= 99%"],
        "alert_thresholds": ["core-ops-error-rate > 1% for 5m"],
        "audit_requirements": ["core-ops actions logged"],
        "security_controls": ["explicit operator access review"],
        "privacy_controls": ["sensitive payload redaction"],
        "analytics_obligations": ["core-ops telemetry emitted"],
        "monitoring_evidence_refs": ["evidence:core-ops:monitoring"],
        "dashboards": ["dashboard:core-ops"],
        "runbook_refs": ["runbook:core-ops"],
        "telemetry_signals": ["trace:core-ops"],
        "bypass_governance": "No bypass outside incident authority.",
        "residual_exceptions": ["none"]
      },
      "rollout": {
        "applicability": "not_applicable",
        "justification": "Enablement artifact only."
      },
      "recovery": {
        "applicability": "not_applicable",
        "justification": "Enablement artifact only."
      },
      "readiness_contract": {
        "behavior_described": true,
        "happy_path_defined": true,
        "error_paths_defined": true,
        "acceptance_examples_defined": true,
        "interface_data_impact_described": true,
        "nfr_impact_known": true,
        "security_privacy_impact_known": true,
        "rollout_defined": true,
        "recovery_defined": true,
        "observability_contract_defined": true,
        "required_proof_defined": true,
        "docs_support_impact_described": true,
        "estimate_band_defined": true,
        "confidence_defined": true,
        "unresolved_questions_below_threshold": true,
        "class_specific_checks": {}
      },
      "done_contract": {},
      "class_payload": {
        "runbook_or_enablement_artifact": "runbooks/example-ops.md",
        "operational_audience": "runtime on-call"
      }
    },
    {
      "item_id": "item-core-docs",
      "item_class": "documentation_support_enablement",
      "track_id": "full-target-system",
      "backlog_protocol_state": "validated",
      "delivery_state": "not_started",
      "readiness_state": "ready",
      "closure_state": "open",
      "summary_label": "Planned",
      "title": "Runtime documentation source of truth",
      "origin_ref": [{ "kind": "claim_ref", "ref": "claim-core-ops" }],
      "owners": {
        "decision_owner": "support",
        "delivery_owner": "runtime-team",
        "runtime_owner": "runtime-ops",
        "escalation_owner": "incident-manager",
        "consulted_teams": ["support-team"]
      },
      "proof_refs": ["proof-core-docs"],
      "dependency_refs": ["item-core-ops"],
      "change_surfaces": ["support"],
      "actor_role_set": ["operator"],
      "value": {
        "persona_or_operator_served": "operator",
        "product_or_operator_value": "Support uses one source of truth for the runtime.",
        "why_now": "The full target track remains open without durable docs.",
        "slice_value_kind": "risk_retirement"
      },
      "estimate_band": "XS",
      "confidence": "high",
      "economic_priority_note": "Closes the full-target support handoff.",
      "evidence_freshness_sla": "refresh on support or runtime release",
      "observability_contract": {
        "sli_slo": ["core-docs-success-rate >= 99%"],
        "alert_thresholds": ["core-docs-error-rate > 1% for 5m"],
        "audit_requirements": ["core-docs actions logged"],
        "security_controls": ["explicit operator access review"],
        "privacy_controls": ["sensitive payload redaction"],
        "analytics_obligations": ["core-docs telemetry emitted"],
        "monitoring_evidence_refs": ["evidence:core-docs:monitoring"],
        "dashboards": ["dashboard:core-docs"],
        "runbook_refs": ["runbook:core-docs"],
        "telemetry_signals": ["trace:core-docs"],
        "bypass_governance": "No bypass outside incident authority.",
        "residual_exceptions": ["none"]
      },
      "rollout": {
        "applicability": "not_applicable",
        "justification": "Documentation update only."
      },
      "recovery": {
        "applicability": "not_applicable",
        "justification": "Documentation update only."
      },
      "readiness_contract": {
        "behavior_described": true,
        "happy_path_defined": true,
        "error_paths_defined": true,
        "acceptance_examples_defined": true,
        "interface_data_impact_described": true,
        "nfr_impact_known": true,
        "security_privacy_impact_known": true,
        "rollout_defined": true,
        "recovery_defined": true,
        "observability_contract_defined": true,
        "required_proof_defined": true,
        "docs_support_impact_described": true,
        "estimate_band_defined": true,
        "confidence_defined": true,
        "unresolved_questions_below_threshold": true,
        "class_specific_checks": {}
      },
      "done_contract": {},
      "class_payload": {
        "doc_audience": "runtime operators",
        "doc_scope": "runtime behavior, incident handling, operator workflow",
        "source_of_truth_artifact": "docs/example-runtime-support.md",
        "freshness_update_trigger": "any runtime release",
        "freshness_update_owner": "support-lead",
        "support_handoff_artifact": "docs/example-runtime-handoff.md"
      }
    }
  ],
  "relations": [
    { "relation_type": "belongs_to_track", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "track", "id": "minimal-working-system" } },
    { "relation_type": "belongs_to_track", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "track", "id": "minimal-working-system" } },
    { "relation_type": "belongs_to_track", "from": { "kind": "item", "id": "item-core-control" }, "to": { "kind": "track", "id": "externally-safe-operationally-supportable" } },
    { "relation_type": "belongs_to_track", "from": { "kind": "item", "id": "item-core-ops" }, "to": { "kind": "track", "id": "externally-safe-operationally-supportable" } },
    { "relation_type": "belongs_to_track", "from": { "kind": "item", "id": "item-core-docs" }, "to": { "kind": "track", "id": "full-target-system" } },
    { "relation_type": "decomposes_into", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "item", "id": "item-core-slice" } },
    { "relation_type": "decomposes_into", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "item", "id": "item-core-control" } },
    { "relation_type": "decomposes_into", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "item", "id": "item-core-ops" } },
    { "relation_type": "decomposes_into", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "item", "id": "item-core-docs" } },
    { "relation_type": "realizes", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "item", "id": "item-core-seam" } },
    { "relation_type": "depends_on", "from": { "kind": "item", "id": "item-core-control" }, "to": { "kind": "item", "id": "item-core-slice" } },
    { "relation_type": "depends_on", "from": { "kind": "item", "id": "item-core-ops" }, "to": { "kind": "item", "id": "item-core-control" } },
    { "relation_type": "depends_on", "from": { "kind": "item", "id": "item-core-docs" }, "to": { "kind": "item", "id": "item-core-ops" } },
    { "relation_type": "governed_by", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "item", "id": "item-core-control" } },
    { "relation_type": "enabled_by", "from": { "kind": "item", "id": "item-core-ops" }, "to": { "kind": "item", "id": "item-core-slice" } },
    { "relation_type": "enabled_by", "from": { "kind": "item", "id": "item-core-docs" }, "to": { "kind": "item", "id": "item-core-ops" } },
    { "relation_type": "touches_contract", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "contract", "id": "contract-example-api" } },
    { "relation_type": "touches_contract", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "contract", "id": "contract-example-api" } },
    { "relation_type": "touches_contract", "from": { "kind": "item", "id": "item-core-control" }, "to": { "kind": "contract", "id": "contract-example-api" } },
    { "relation_type": "touches_data_domain", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "data_domain", "id": "domain-example-state" } },
    { "relation_type": "touches_data_domain", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "data_domain", "id": "domain-example-state" } },
    { "relation_type": "touches_data_domain", "from": { "kind": "item", "id": "item-core-control" }, "to": { "kind": "data_domain", "id": "domain-example-state" } },
    { "relation_type": "proves", "from": { "kind": "item", "id": "item-core-seam" }, "to": { "kind": "proof", "id": "proof-core-seam" } },
    { "relation_type": "proves", "from": { "kind": "item", "id": "item-core-slice" }, "to": { "kind": "proof", "id": "proof-core-slice" } },
    { "relation_type": "proves", "from": { "kind": "item", "id": "item-core-control" }, "to": { "kind": "proof", "id": "proof-core-control" } },
    { "relation_type": "proves", "from": { "kind": "item", "id": "item-core-ops" }, "to": { "kind": "proof", "id": "proof-core-ops" } },
    { "relation_type": "proves", "from": { "kind": "item", "id": "item-core-docs" }, "to": { "kind": "proof", "id": "proof-core-docs" } },
    { "relation_type": "proves", "from": { "kind": "track", "id": "minimal-working-system" }, "to": { "kind": "track_proof", "id": "track-proof-min" } },
    { "relation_type": "proves", "from": { "kind": "track", "id": "externally-safe-operationally-supportable" }, "to": { "kind": "track_proof", "id": "track-proof-safe" } },
    { "relation_type": "proves", "from": { "kind": "track", "id": "full-target-system" }, "to": { "kind": "track_proof", "id": "track-proof-full" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-product" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-architecture" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-engineering" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-platform" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-security" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-qa" } },
    { "relation_type": "reviewed_by", "from": { "kind": "run", "id": "abe-example" }, "to": { "kind": "review", "id": "review-support" } },
    { "relation_type": "reviewed_by", "from": { "kind": "track_proof", "id": "track-proof-min" }, "to": { "kind": "review", "id": "review-track-min" } },
    { "relation_type": "reviewed_by", "from": { "kind": "track_proof", "id": "track-proof-safe" }, "to": { "kind": "review", "id": "review-track-safe" } },
    { "relation_type": "reviewed_by", "from": { "kind": "track_proof", "id": "track-proof-full" }, "to": { "kind": "review", "id": "review-track-full" } }
  ],
  "proofs": [
    {
      "proof_id": "proof-core-seam",
      "covered_ref": { "kind": "item", "id": "item-core-seam" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after source, contract, or topology changes.",
      "invalidated_by": ["source_change", "contract_change", "topology_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-core-slice",
      "covered_ref": { "kind": "item", "id": "item-core-slice" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after source, contract, or topology changes.",
      "invalidated_by": ["source_change", "contract_change", "topology_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-core-control",
      "covered_ref": { "kind": "item", "id": "item-core-control" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after source, contract, or topology changes.",
      "invalidated_by": ["source_change", "contract_change", "topology_change", "track_gate_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-core-ops",
      "covered_ref": { "kind": "item", "id": "item-core-ops" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after source or topology changes.",
      "invalidated_by": ["source_change", "topology_change", "track_gate_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-core-docs",
      "covered_ref": { "kind": "item", "id": "item-core-docs" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after source or topology changes.",
      "invalidated_by": ["source_change", "topology_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-track-min",
      "covered_ref": { "kind": "track_proof", "id": "track-proof-min" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after track or topology changes.",
      "invalidated_by": ["source_change", "topology_change", "track_gate_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-track-safe",
      "covered_ref": { "kind": "track_proof", "id": "track-proof-safe" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after track or topology changes.",
      "invalidated_by": ["source_change", "topology_change", "track_gate_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    },
    {
      "proof_id": "proof-track-full",
      "covered_ref": { "kind": "track_proof", "id": "track-proof-full" },
      "covered_commit_or_build": "build:abe-example",
      "environment": "staging",
      "executed_at": "2026-03-30T00:00:00Z",
      "freshness_rule": "Refresh after track or topology changes.",
      "invalidated_by": ["source_change", "topology_change", "track_gate_change"],
      "dimensions": {
        "architecture_trace": { "status": "present", "artifact": "docs/example-architecture.md" },
        "implementation_trace": { "status": "present", "command": "pnpm test" },
        "verification_trace": { "status": "present", "command": "pnpm test" },
        "security_trace": { "status": "present", "artifact": "artifacts/security-review.md" },
        "release_trace": { "status": "present", "procedure": "release/example" },
        "rollback_or_recovery_trace": { "status": "present", "procedure": "runbooks/example-rollback" },
        "operability_trace": { "status": "present", "artifact": "runbooks/example-ops.md" }
      }
    }
  ],
  "track_proofs": [
    {
      "track_proof_id": "track-proof-min",
      "track_id": "minimal-working-system",
      "proof_refs": ["proof-core-slice", "proof-track-min"],
      "coverage": {
        "boot_startup_dependencies": true,
        "end_to_end_journey": true,
        "operator_control_path": true,
        "degraded_mode_exercise": true,
        "release_gate_execution": true,
        "rollback_or_recovery_rehearsal": true,
        "observability_and_alert_routing": true,
        "runbook_and_escalation_path": true
      }
    },
    {
      "track_proof_id": "track-proof-safe",
      "track_id": "externally-safe-operationally-supportable",
      "proof_refs": ["proof-core-control", "proof-core-ops", "proof-track-safe"],
      "coverage": {
        "boot_startup_dependencies": true,
        "end_to_end_journey": true,
        "operator_control_path": true,
        "degraded_mode_exercise": true,
        "release_gate_execution": true,
        "rollback_or_recovery_rehearsal": true,
        "observability_and_alert_routing": true,
        "runbook_and_escalation_path": true
      }
    },
    {
      "track_proof_id": "track-proof-full",
      "track_id": "full-target-system",
      "proof_refs": ["proof-core-docs", "proof-track-full"],
      "coverage": {
        "boot_startup_dependencies": true,
        "end_to_end_journey": true,
        "operator_control_path": true,
        "degraded_mode_exercise": true,
        "release_gate_execution": true,
        "rollback_or_recovery_rehearsal": true,
        "observability_and_alert_routing": true,
        "runbook_and_escalation_path": true
      }
    }
  ],
  "reviews": [
    { "review_id": "review-product", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "pm-1", "role": "product_strategy", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:product"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-architecture", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "arch-1", "role": "system_architecture", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:architecture"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-engineering", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "eng-1", "role": "application_engineering", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:engineering"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-platform", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "sre-1", "role": "platform_sre", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:platform"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-security", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "sec-1", "role": "security", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:security"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-qa", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "qa-1", "role": "qa_release", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:qa"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-support", "review_scope": "run", "reviewed_ref": { "kind": "run", "id": "abe-example" }, "reviewer": "ops-1", "role": "support_operations", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["note:support"], "score_contribution": 10, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-track-min", "review_scope": "track_proof", "reviewed_ref": { "kind": "track_proof", "id": "track-proof-min" }, "reviewer": "eng-track", "role": "application_engineering", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["proof:track:min"], "score_contribution": 5, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-track-safe", "review_scope": "track_proof", "reviewed_ref": { "kind": "track_proof", "id": "track-proof-safe" }, "reviewer": "sre-track", "role": "platform_sre", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["proof:track:safe"], "score_contribution": 5, "reviewed_at": "2026-03-30T00:00:00Z" },
    { "review_id": "review-track-full", "review_scope": "track_proof", "reviewed_ref": { "kind": "track_proof", "id": "track-proof-full" }, "reviewer": "ops-track", "role": "support_operations", "independent": true, "verdict": "pass", "findings": [], "hard_fail_report": [], "evidence_refs": ["proof:track:full"], "score_contribution": 5, "reviewed_at": "2026-03-30T00:00:00Z" }
  ],
  "waivers": []
}
```
````

This example is intentionally verbose because a brand-new run must carry a whole graph, not just a few claims or items.

### Planning overlay example

Use this to update planning fields for an existing item without claiming new delivery:

```json
{
  "source": {
    "ref": "./packets/planning-owner-update.json",
    "kind": "backlog_text",
    "authority": "planning_only"
  },
  "packet_provenance": {
    "merge_mode": "planning_overlay"
  },
  "items": [
    {
      "item_id": "item-model-serving-seam",
      "owners": {
        "decision_owner": "platform-team",
        "delivery_owner": "ml-platform"
      },
      "why_now": "Real local-model runtime is now on the critical path."
    }
  ]
}
```

### Source-driven refresh example

Use this as a **fragment example** for architecture-derived graph sections. A brand-new run still needs the other validation-required sections listed above.

```json
{
  "source": {
    "source_id": "src-architecture",
    "ref": "./docs/architecture/system.md",
    "kind": "architecture_doc",
    "authority": "authoritative_target_truth",
    "precedence": 1,
    "notes": "Canonical architecture source."
  },
  "packet_provenance": {
    "merge_mode": "source_driven_refresh"
  },
  "target_system": {
    "actors": ["operator"],
    "operator_personas": ["system operator"],
    "external_consumer_groups": ["maintainers"],
    "external_dependencies": ["postgres", "vllm"],
    "trust_boundaries": ["http ingress", "model-serving boundary"],
    "durable_state_families": ["identity state", "timeline", "model registry"],
    "control_surfaces": ["boot policy", "governor freeze"],
    "failure_domains": ["boot", "tick loop", "model serving"],
    "team_and_ownership_assumptions": ["runtime team owns the identity-bearing core"],
    "quality_goals": ["single-subject continuity under bounded failure"],
    "policy_surfaces": ["development governance", "operator control policy"]
  },
  "claims": [
    {
      "claim_id": "claim-single-identity-core",
      "title": "The system has one identity-bearing core.",
      "claim_class": "functional_capability",
      "commitment": "committed",
      "source_refs": ["src-architecture"]
    }
  ]
}
```

## Authoring checklist

Before running `discover`, check:

1. The packet uses one of the supported transport forms.
2. Explicit packets define `source.ref`, `source.kind`, `source.authority`, and `packet_provenance.merge_mode`.
3. The merge mode matches the source authority and the intent of the change.
4. `replace_sections` is used only for full source-driven refresh.
5. Every array section includes stable IDs for its upsert identity.
6. New entries include the full validation-required shape for their section; partial updates are used only for existing entries.
7. Planning overlays do not claim delivery.
8. `delivery_state` changes, if any, are backed by authoritative current-truth evidence.
9. New items have the required graph relations, not just the item payload.
10. Derived sections such as `roadmap_matrix` are left to the CLI unless a repair workflow explicitly needs them.
