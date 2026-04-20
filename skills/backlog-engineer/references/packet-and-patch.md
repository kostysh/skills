# Packet and Patch Authoring

This file defines the stable authoring contract for packets and patches.

## Packet

Use `packet` for new tasks only.

Packet rules:

- adds new tasks only;
- carries task context;
- never deletes existing tasks;
- never mutates existing tasks;
- does not contain utility-owned computed state;
- does not contain utility-owned `todo`.

If a packet contains an `item_key` that already exists, the utility should fail the command and make no change.

### Packet context

Packet context can include:

- `glossary`
- `key_strategy`
- optional structured `target_system`
- optional structured `as_built`
- `claims`
- `contracts`
- `data_domains`
- `quality_attributes`
- `policy_decisions`

Use packet context to keep architecture-derived meaning attached to the tasks that come from it.

### Packet task shape

Each packet item should be an atomic task.

Atomic task means:

- one clear goal;
- one clear result;
- can be separately specified;
- can be separately planned;
- can be separately implemented.

At minimum, the task model is centered on:

- `item_key`
- `title`
- `type`
- `delivery_state`
- `gaps`
- `depends_on_keys`
- `origin_source_ids`
- other stage-specific source ID fields when relevant
- context links such as `claim_keys`, `contract_keys`, `data_domain_keys`, `quality_attribute_keys`, `policy_decision_keys`

## Patch

Use patch workflows for existing tasks only.

Patch rules:

- changes existing tasks;
- may remove existing tasks through the remove flow;
- may close open mutation-managed `todo` items;
- never acts as a second kind of packet for adding new tasks.
- for dossier-side actualization, start from `template patch` by default instead of freehand patch authoring.

Start from `template patch` whenever possible.

### Canonical patch retention

A successful real patch mutation writes an immutable canonical patch artifact and registers that path in `.backlog/applied.json`.

Rules:

- authored patch files are operator/agent drafts;
- canonical patch files under `patches/` are replay evidence;
- `canonical_patch_purpose = "immutable_replay_artifact"` means the hashed copy is intentional, not clutter;
- retain and commit canonical patch artifacts while applied registry references them;
- cleanup must not remove files referenced by applied registry, source registry, packet registry, dependency graph, or item metadata.

## Utility-owned todo

Utility-owned `todo` follows these rules:

- it is created only by the utility during `packet`, `patch-item`, `remove-item`, or `refresh`;
- it stores only open actions;
- when resolved, it is removed rather than marked as closed.
- `patch-item remove_todo` may remove only `managed_by = mutation` todo.
- `managed_by = refresh` review todo are cleared by scoped `refresh` when their source/dependency cause is no longer observed.

If a dossier-side change creates truly new backlog work instead of changing an existing item, leave patch workflows and return to `template packet` -> `packet`.

Do not author `todo` in packets or patches.

## Dry-run rule

Use `--dry-run` before risky or large mutations:

- `packet --dry-run`
- `patch-item --dry-run`
- `remove-item --dry-run`

For dossier-side actualization patches, `patch-item --dry-run` is the required pre-apply step.

The preview must run on temporary in-memory state and must not write to disk.
