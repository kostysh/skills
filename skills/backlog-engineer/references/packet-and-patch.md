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
- may close open utility-owned `todo` items;
- never acts as a second kind of packet for adding new tasks.

Start from `template patch` whenever possible.

## Utility-owned todo

Utility-owned `todo` follows these rules:

- it is created only by the utility during `packet`, `patch-item`, `remove-item`, or `refresh`;
- it stores only open actions;
- when resolved, it is removed rather than marked as closed.

Do not author `todo` in packets or patches.

## Dry-run rule

Use `--dry-run` before risky or large mutations:

- `packet --dry-run`
- `patch-item --dry-run`
- `remove-item --dry-run`

The preview must run on temporary in-memory state and must not write to disk.
