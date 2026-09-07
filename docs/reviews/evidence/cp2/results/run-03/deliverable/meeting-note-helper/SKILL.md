---
name: meeting-note-helper
description: Turn supplied meeting notes into a concise summary and action list.
  Use for summarizing an existing meeting record; not for inventing decisions or
  participants.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b035fdaa7a83085d75543cd20142b4424030932d914e7aad6f32f2860e1622e3
---

# meeting-note-helper

## Start here

1. Use the supplied meeting record as the factual source. Return a concise summary and, when present, an action list.
2. Do not contact participants or update external systems. If the meeting record is absent, request it before summarizing.
3. When the supplied meeting record contains action items, read references/action-items.md before writing the action list. For records without actions, return the summary only.

## When to use this skill

- Summarize a supplied meeting record into a summary and action list.

## When NOT to use this skill

- No meeting record is available or the task requires inventing meeting decisions.

## Workflow stages

### Workflow stage: Summarize the record

The requester receives a faithful summary and explicit actions supported by the record.

1. Extract the stated decisions and actions without inventing facts.

Validation:

- Check each decision and action against the supplied record; mark unknown facts rather than guessing.

## Policies

### Factual boundary
Omit unsupported decisions. This summary does not confirm participant agreement or execute the listed actions.

## Required active references
- [Action item formatting](references/action-items.md) — Read this when the supplied meeting record contains action items; it is not required for records with no actions.

## Portability rules

- Use only the supplied record and guidance inside this folder.

## Portability checklist before finishing

- Confirm every required local reference travels with the folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
