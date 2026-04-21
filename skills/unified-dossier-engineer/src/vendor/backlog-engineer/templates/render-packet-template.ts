const PACKET_TEMPLATE = `{
  "context": {
    "glossary": [
      {
        "term": "<term_if_needed>",
        "definition": "<definition_if_needed>",
        "aliases": ["<optional_alias>"]
      }
    ],
    "key_strategy": {
      "module_prefix": "<module_prefix>",
      "item_pattern": "<module>-<capability>-<result>"
    },
    "target_system": [
      {
        "area": "<system_area>",
        "summary": "<what_should_exist_or_how_it_should_work>",
        "services": ["<service_name>"]
      }
    ],
    "as_built": [
      {
        "area": "<system_area>",
        "implemented_services": ["<implemented_service_if_any>"],
        "missing_services": ["<missing_service_if_any>"]
      }
    ],
    "claims": [
      {
        "claim_key": "<module>-<claim>",
        "title": "<requirement_or_architectural_claim>",
        "claim_class": "behavior",
        "commitment": "required",
        "source_ids": ["<source_id_1>"]
      }
    ],
    "contracts": [
      {
        "contract_key": "<module>-<contract>",
        "title": "<contract_title>",
        "owner": "<owner_team>",
        "versioning_strategy": "<versioning_strategy>",
        "reconciliation_strategy": "<reconciliation_strategy>",
        "deprecation_window": "<deprecation_window_or_na>",
        "retirement_condition": "<retirement_condition_or_na>"
      }
    ],
    "data_domains": [
      {
        "data_domain_key": "<module>-<data_domain>",
        "title": "<data_domain_title>",
        "data_class": "<data_class>",
        "owners": ["<owner_team>"]
      }
    ],
    "quality_attributes": [
      {
        "quality_attribute_key": "<module>-<quality_attribute>",
        "title": "<quality_requirement>",
        "quality_class": "<quality_class>",
        "target": "<measurable_target>",
        "applies_to_item_keys": ["<module>-<capability>-<result>"],
        "owner_keys": ["<owner_team>"],
        "source_ids": ["<source_id_1>"]
      }
    ],
    "policy_decisions": []
  },
  "items": [
    {
      "item_key": "<module>-<capability>-<result>",
      "title": "<task_title>",
      "type": "feature",
      "delivery_state": "defined",
      "gaps": [],
      "depends_on_keys": [],
      "origin_source_ids": ["<source_id_1>"],
      "specification_source_ids": ["<source_id_1>"],
      "plan_source_ids": [],
      "implementation_source_ids": [],
      "test_source_ids": [],
      "claim_keys": ["<module>-<claim>"],
      "contract_keys": ["<module>-<contract>"],
      "data_domain_keys": ["<module>-<data_domain>"],
      "quality_attribute_keys": ["<module>-<quality_attribute>"],
      "policy_decision_keys": []
    }
  ]
}
`;

export function renderPacketTemplate(): string {
  return PACKET_TEMPLATE;
}
