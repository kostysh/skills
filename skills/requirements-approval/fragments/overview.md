## Outcome and anti-claims

Coordinate an unresolved customer-owned requirement into a traceable accepted decision, consistent project artifacts, and evidence-calibrated workflow state.

This documentation-only skill does not grant product or architecture authority, send email, implement document-owner changes, enforce GitHub state, or prove closure from artifacts alone. It orchestrates owners and reports only what current evidence supports.

## Inputs and readiness

Minimum input for assessment or drafting is the question source, available project context, and requested scope. Stronger execution additionally requires:

- stable question codes and the named decision owner;
- authoritative source documents and applicable precedence;
- customer language plus supplied message/thread identifiers or exported content;
- exact repository and approval-project targets, including inspected status-field mapping;
- affected artifact owners and repository publication requirements;
- explicit authority for each external GitHub or Git mutation.

Missing execution inputs do not prevent a useful draft. They do prevent external writes and verified closure.

Workflow authority controls which actions the agent may take. It does not transfer product, architecture, specification, planning, document-version, or customer-decision authority.

## Source precedence

Follow repository-defined precedence. When none is defined, use operator workflow constraints first, then the explicitly authorized decision owner for the question's content, then current canonical project decisions and documents, then authoritative public facts for factual subquestions. Examples in this skill come last.

Do not silently choose the latest message when equal-authority sources conflict. Record the conflict, keep affected questions blocked, and name the owner who must resolve it.

## State and output contract

Assess reply content separately from workflow closure:

- answer: `complete`, `partial`, `non-answer`, or `authority-conflict`;
- workflow: `draft`, `partial`, `blocked`, or `verified`;
- GitHub state: the freshly observed target-specific field value, never an assumed label.

Use workflow states deterministically:

- `draft` — the requested assessment or draft is ready and execution or closure was not requested;
- `partial` — an accepted decision or routed action advanced, closure remains incomplete, and the next owner can act on available input;
- `blocked` — the requested transition cannot proceed until a named authority, input, target, or capability is supplied;
- `verified` — every closure gate is freshly evidenced.

Routing to another owner is not itself blocked. For the overall state, use `blocked` if a blocker prevents the requested outcome; otherwise use `verified` only when every in-scope question is verified, `partial` when non-blocking work remains after progress, and `draft` for preparation-only scope.

For each question report:

- code, source, decision owner, authority evidence, and research performed;
- answer assessment and accepted obligation, if any;
- affected artifacts and their owning skills;
- proposed versus executed GitHub, document, and Git actions;
- observed artifact, commit/ref, issue, and Project state;
- remaining gap, next owner, and evidence needed for a stronger state.

End with one overall state. A complete answer may still be partial or blocked until propagation and terminal-state evidence exist.
