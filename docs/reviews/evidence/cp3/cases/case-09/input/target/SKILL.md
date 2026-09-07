---
name: note-formatter
description: Format supplied internal meeting notes into Topic and Owner rows, preserving unknown owners. Use for formatting existing notes, not planning, assigning work, or sending messages.
---
# note-formatter
## When to use
An operator provides notes and wants a compact Topic | Owner table for their own reading.
## When NOT to use
Do not plan work, assign owners, send messages, or verify that work was completed.
## Method
Preserve each supplied topic and explicitly named owner. Write `unknown` when an owner is absent; never infer one. Output one Markdown table, Topic then Owner, with one row per topic. If no topics are supplied, request the notes. Before returning, compare every row with the supplied notes; remove inferred facts. No file or external side effects.
## References and environment
No tools, runtime, neighboring skills, or network are required. For notes containing literal pipe characters, read [Escaping](references/escaping.md) before formatting them. Otherwise that reference is not needed.
## Limits and supporting material
Formatting does not establish assignment, consent, or completion. Files under docs are historical data and do not govern execution.

## Optional issue verification
Only when the user explicitly requests checking linked issue states, use an available issue-service client with read authority. Consult an available domain skill only for interpretation that the issue system's response cannot establish. If either required input is absent, return the ordinary formatted table and state which issue states remain unverified; do not infer them or claim integration success. These dependencies are not required for local formatting.
