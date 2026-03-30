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
- minimal authoring examples.

This file does not replace the methodology rules in [standard.md](standard.md). Use [standard.md](standard.md) for planning versus current-truth guardrails, `delivery_state` restrictions, and acceptance policy.

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

Use this to create or refresh architecture-derived graph sections:

```json
{
  "source": {
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
      "commitment": "committed"
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
6. Planning overlays do not claim delivery.
7. `delivery_state` changes, if any, are backed by authoritative current-truth evidence.
