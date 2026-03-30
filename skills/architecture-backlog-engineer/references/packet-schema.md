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
