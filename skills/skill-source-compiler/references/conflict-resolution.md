# Conflict resolution

Apply these rules in order:

1. **Explicit source precedence wins.** If the source bundle already encodes a deterministic winner, use it.
2. **Surface boundaries win over convenience.** Supporting or historical docs do not override active guidance unless explicitly promoted.
3. **More specific guidance wins inside the same surface.** A workflow-stage validation rule can narrow a broad policy.
4. **Equal-level semantic contradictions block authoring.** Return `blocked: unresolved-conflict`, name the conflicting rules and their authority, and do not regenerate or publish until an owner resolves them.

The agent applies these rules. The CLI can detect structural inconsistencies such as ambiguous reference classification, but it does not infer whether prose is semantically equivalent or contradictory. A green `lint`, `compile`, or `check` is therefore not evidence that semantic conflicts are resolved.

## Duplicate handling

When two entries express the same idea, keep the clearer or more specific phrasing and drop the duplicate. Keep one canonical location for each normative idea.
