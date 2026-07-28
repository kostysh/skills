## Outcome and anti-claims

Coordinate an unresolved customer-owned requirement into a traceable accepted decision, consistent project artifacts, and evidence-calibrated workflow state.

This documentation-only skill does not grant product or architecture authority, send email, implement document-owner changes, enforce GitHub state, or prove closure from artifacts alone. It orchestrates owners and reports only what current evidence supports.

## Inputs and readiness

Assessment or drafting requires the question source, available project context, and requested scope. Execution additionally requires:

- stable question codes, decision owner, authoritative sources, and precedence;
- customer language and supplied message/thread data;
- affected owners, publication rules, exact GitHub targets, and inspected status mapping;
- explicit authority for each external mutation.

Missing execution inputs permit a useful draft, not external writes or verified closure.

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

- `draft` — preparation is ready; execution or closure was not requested;
- `partial` — progress exists and the next owner can act, but closure remains incomplete;
- `blocked` — a named authority, input, target, or capability prevents the requested transition;
- `verified` — every closure gate, including durable disposition, is freshly evidenced.

Routing to another owner is not itself blocked. Overall state is `blocked` when a blocker prevents the requested outcome, otherwise `verified` only when every in-scope question is verified, `partial` while non-blocking work remains, and `draft` for preparation-only scope.

For each question report:

- code, source, decision owner, authority evidence, and research;
- answer, accepted obligation, durable disposition evidence, and affected owners;
- proposed versus executed actions and observed artifact/ref/issue/Project state;
- remaining gap, next owner, and evidence needed for a stronger state.

End with one overall state; a complete answer may still lack workflow closure.
