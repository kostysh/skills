## Outcome and anti-claims

Turn an unresolved decision into a traced owner disposition and consistent owning artifacts.

Coordinate document owners and report observed state. Product and architecture decisions, email delivery, document edits and GitHub enforcement stay with their authorized owners.

## Inputs and readiness

For assessment or drafting, identify the question source, context and scope. Before execution, identify the decision ID, owner, applicable authority, operation and exact target.

- For local register or document changes, inspect the current artifact and its owning rules.
- Use the customer language for requests and the supplied messages for reply assessment.
- For GitHub, inspect status mappings when used. Apply publication rules when publishing.

Confirm authority and read back each local or external write. Hold the dependent action when inputs are missing. Continue independent authorized work and draft held actions as useful.

Use the latest scope and language clarification. Reuse permissions for the same action and target. If a rule blocks the requested transition, give its source, applicability, owner and missing input.

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

End with one overall state.
