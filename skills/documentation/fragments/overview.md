Use this skill to create documentation that fits a real user need and remains
honest about what its sources and checks establish.

Diataxis governs documentation form, flow, and information architecture. It
does not replace technical authority or verification against the product.

Read [references/diataxis-guide.md](references/diataxis-guide.md) only when form
selection is ambiguous, mixed content needs a substantial rewrite, a tutorial
or how-to needs detailed design, or corpus and multi-audience information
architecture is in scope.

## Capability boundary

- Capability: produce an actionable document, review, or restructure handoff
  for a named reader and target state, with claims and completion status matched
  to current evidence.
- Anti-claim: a correct Diataxis category, polished prose, Markdown lint, link
  check, generated site, or docs build does not prove factual or executable
  correctness by itself.
- Use safe editorial assumptions for presentation details only. Never assume
  product behavior, commands, defaults, permissions, errors, version support,
  or rationale.

## Diataxis compass

Ask two questions: does the content inform action or cognition, and does it
support acquisition/study or application/work?

| Primary need | Mode | Form |
| --- | --- | --- |
| Learn through a guided practical experience | Action + acquisition/study | Tutorial |
| Accomplish a real task or solve a problem | Action + application/work | How-to guide |
| Look up facts about an interface or system | Cognition + application/work | Reference |
| Build a mental model or understand why | Cognition + acquisition/study | Explanation |

Use the compass as a course-correction tool, not as a four-folder mandate.

## Form contracts

### Tutorial

- Own the learner's successful experience from meaningful starting point to
  visible result.
- Use one reliable path, small steps, expected outcomes, and prompts to notice
  important effects.
- Minimize alternatives and explanation that interrupt the learning flow.

A tutorial remains `draft` when its safe end-to-end path or material expected
results have not been checked for the target environment.

### How-to guide

- Start from a real user goal, not from a tour of a tool or feature.
- Assume relevant baseline competence and keep actions focused on the outcome.
- Include branches and judgment only where the real problem requires them.

A how-to remains `draft` when its main executable path, material conditions, or
commands have not been checked against the target version.

### Reference

- Mirror the authoritative product, API, command, schema, or interface surface.
- Use consistent entries for signatures, defaults, constraints, errors, and
  short illustrative examples.
- Keep recommendations and rationale in a how-to guide or explanation.

Reference completeness is scoped to a named contract surface. Do not call it
complete because its entries are internally consistent.

### Explanation

- Bound the topic and connect concepts, constraints, history, rationale,
  alternatives, and trade-offs.
- Separate sourced facts and accepted decisions from author interpretation.
- Do not turn the page into setup instructions or exhaustive interface lookup.

An explanation can be structurally strong while remaining `draft` if its facts
or attributed rationale cannot be traced to an accepted source.

## Mixed content and information architecture

- Give each document or bounded section a primary user need.
- Split content when mixed forms disrupt the reader's task; otherwise use a
  clear supporting section or link rather than chasing theoretical purity.
- Allow landing and navigation pages to coordinate several forms as overviews.
- For corpus work, improve the smallest useful page or cluster first. Preserve
  discoverability and identify URL, navigation, link, and redirect effects
  before moving material.
- Let audience and product use shape complex hierarchies; do not assume that
  every documentation set needs four top-level directories.

## Review order

1. Unsupported, inaccurate, unsafe, or unusable claims.
2. Mismatch between the reader's need and the document's promise or form.
3. Missing prerequisites, outcomes, navigation, or companion material.
4. Language, consistency, scanning, and style.

Keep review findings separate from edits unless remediation is explicitly
authorized.
