const PACKET_TEMPLATE = `{
  "context": {
    "glossary": [],
    "key_strategy": {
      "module_prefix": "<module_prefix>",
      "item_pattern": "<module>-<capability>-<result>"
    },
    "target_system": [],
    "as_built": [],
    "claims": [],
    "contracts": [],
    "data_domains": [],
    "quality_attributes": [],
    "policy_decisions": []
  },
  "items": []
}
`;

export function renderPacketTemplate(): string {
  return PACKET_TEMPLATE;
}
