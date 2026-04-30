# Body Completion

Runtime commands create structurally valid dossier scaffolds. They do not create complete human-readable dossier artifacts by themselves.

Use this reference before stage close, handoff, PR preparation, final response, or any review of dossier artifacts created or materially changed during the active task.

## Completion Rule

After creating or materially changing any source, capability, baseline, guardrail, work item, review, verification, or changeset artifact, complete the relevant body sections before handoff.

Frontmatter is canonical machine-readable state. Body sections are canonical human-readable interpretation. A reviewer must be able to understand what the artifact means, what evidence supports it, what remains uncertain, and what follow-up is expected without reverse-engineering the frontmatter or command transcript.

Scaffold-only body content is allowed only as transient working state inside the same active task. It is not allowed before:

- `stage close`;
- handoff;
- PR preparation;
- changeset publication;
- final response to the operator.

## Unacceptable Body State

The following body states are not acceptable before handoff:

- empty sections;
- headings without explanatory text;
- `TODO`, `TBD`, placeholder, or template-only body text;
- copied scaffold text that has not been interpreted for the project;
- empty lists where evidence, interpretation, uncertainty, or follow-up should appear;
- unexplained `unknown`;
- a capability body without observable behavior;
- a baseline body that does not separate observed, partial, and unverified capabilities;
- verification body that does not explain what was actually proven;
- review body without human-readable verdict rationale;
- a changeset body that lists files but does not explain capability, evidence, blockers, or risk impact;
- source body that registers a file but does not explain its project-relevant meaning;
- work-item body that repeats the title but does not explain scope, acceptance meaning, risks, and non-goals.

## Artifact-Specific Minimums

### Source

A completed source body should include:

- summary;
- interpretation relevant to the current project;
- linked capabilities or work implications;
- ambiguity, drift, or missing-context notes.

### Capability

A completed capability body should include:

- summary;
- concept interpretation;
- observable behavior;
- anti-claims;
- demonstration or evidence notes;
- uncertainty notes;
- follow-up recommendations.

Existing code is not observed capability by itself. A capability is observed only when there is a demonstration or sufficiently concrete evidence.

### Baseline

A completed baseline body should include:

- scope of the onboarding or baseline pass;
- observed capabilities;
- partial capabilities;
- unverified capabilities;
- evidence notes;
- gaps;
- recommended next verification steps.

### Guardrail

A completed guardrail body should include:

- the risk or kill condition it protects against;
- triggering signals;
- affected capability or support scope;
- resolution criteria;
- owner or follow-up expectation.

### Work Item

A completed work-item body should include:

- problem or goal summary;
- source and capability interpretation;
- delivery classification rationale;
- behavioral acceptance interpretation for capability or maintenance work;
- support rationale for support work;
- demo or evidence plan;
- anti-claims and non-goals;
- risks, blockers, and uncertainty;
- next stage recommendation.

### Verification

A completed verification body should include:

- scenario or command executed;
- evidence location;
- what behavior, contract, or support condition was proven;
- limitations of the evidence;
- verdict rationale.

For capability work, verification must explain the observable behavior proven by the evidence.

### Review

A completed review body should include:

- reviewed scope;
- review class and verdict rationale;
- evidence inspected;
- gaps or concerns;
- freshness or material-scope notes;
- follow-up required before closure, if any.

### Changeset

A completed changeset body should include:

- branch or work scope summary;
- changed dossier records;
- affected sources, capabilities, and work items;
- verification and review evidence summary;
- blockers, stale reviews, failed verification, or guardrails;
- handoff risks and next actions.

## Existing-Project Onboarding Body Requirements

Before handoff, every created or updated baseline, source, and capability must have completed body content.

Baseline body minimum:

- scope of the onboarding pass;
- observed capabilities;
- partial capabilities;
- unverified capabilities;
- evidence notes;
- gaps;
- recommended next verification steps.

Capability body minimum:

- summary;
- concept interpretation;
- observable behavior;
- anti-claims;
- demonstration or evidence notes;
- uncertainty notes;
- follow-up recommendations.

Source body minimum:

- summary;
- interpretation relevant to the project;
- linked capabilities or work implications;
- ambiguity, drift, or missing-context notes.

Do not treat source existence, repository structure, or code presence as observed capability. Observed means demonstrated or supported by concrete evidence that a reviewer can inspect.

## Body Completion Check

Before handoff, inspect every Markdown dossier artifact created or materially changed in the active task:

1. List the changed artifact paths.
2. Confirm each changed artifact has project-specific body interpretation.
3. Confirm no required body section remains scaffold-only.
4. Confirm evidence and uncertainty are explained in prose, not only encoded in frontmatter.
5. If a body is incomplete, complete it or explicitly keep the artifact open as transient work and do not close the stage or hand off.
