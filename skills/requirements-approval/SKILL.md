---
name: requirements-approval
description: "Coordinate customer-owned requirements decisions: triage open
  questions, research resolvable facts, prepare approval requests, process
  supplied or Gmail replies, and route accepted decisions into GitHub and
  authoritative project documents. Use for approval workflows and «согласование
  требований»."
metadata:
  source-version: 0.2.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f72b7980217b1ce8d52f7ae4fde906f3488d2628bd4b73f1c6568653f87ab810
---

# requirements-approval

## Start here

1. Confirm whether the request is assessment/drafting or authorizes external execution against exact targets.
2. Match success to the requested stage using the state/output contract; an actionable draft does not require workflow closure.
3. Identify each question's decision owner, authority, affected artifacts, and downstream owners before interpretation or closure.
4. Use repository-defined source precedence; unresolved equal-authority conflicts block acceptance instead of being resolved by recency or convenience.
5. Route document content and authority decisions to their owning skills; requirements-approval owns triage, traceability, and the closure gate.
6. Resolve exact GitHub or Git action targets from the request and available context, and reuse existing authorization within that scope. Missing mutation authority limits execution, not useful drafting or assessment.

## When to use this skill

- Triaging unresolved requirements questions to determine which need customer input.
- Preparing or creating traceable approval requests for customer-owned decisions.
- Processing supplied or Gmail customer replies against stable question codes and decision authority.
- Coordinating accepted decisions through project artifacts, Git, and approval-task state.
- Auditing approval-item evidence for honest closure.

## When NOT to use this skill

- Non-approval PRD authoring; explicitly hand it to prd-engineer, and route other artifacts to their named owners.
- Internal research or issue triage when no decision is customer-owned.
- Discovery, sales proposals, or optional scope expansion.
- Sending customer email; this skill only prepares request text.
- External execution without the required target, authorization, credentials, or source data; return a draft or blocked handoff.

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

Continue the supported stage using available sources and the user's latest scope or language clarification. Reuse permissions already given for the same action and target; ask only for a material missing input. If a rule prevents a requested transition, name its exact source, applicability, decision owner, and unblock condition rather than requesting generic confirmation.

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

## Workflow stages

### Workflow stage: Triage questions and prepare approval requests

Escalate only unresolved customer-owned decisions and keep proposed actions distinct from executed mutations.

1. Extract open questions and preserve stable source codes; create a short project-local code only when the source lacks one.
2. Identify the decision owner and affected product, architecture, specification, plan, data, or documentation artifacts for each question.
3. Inspect authoritative project inputs, decisions, dependencies, and issue history before external research.
4. Check current runtime evidence when it can resolve a factual subquestion. Observed behavior is not customer preference or approval; unavailable unrelated runtime evidence does not block drafting.
5. Check the environment perimeter and accepted contracts when they constrain the question; do not escalate a choice those authoritative constraints already fix.
6. Check existing TODO, approval, and decision records; reuse the owning record or accepted answer.
7. Consider a narrower technical resolution or domain-owner route before asking for customer intent; investigate it only when it could resolve the current question without changing agreed scope or choosing a customer preference.
8. Use current authoritative public sources only for factual parts that can narrow the question; do not use public facts to invent a customer preference or approval.
9. Classify each question as resolved internally, customer input required, partial, or blocked by missing/conflicting authority.
10. For customer input required, prepare a concise request in the customer's language with context, research, exact missing input, and current-scope choices.
11. When creation is requested and authorized, hand the resolved GitHub target to gh-utility and verify by fresh read. For preparation-only scope, deliver the draft; list missing execution inputs only if they affect a requested next transition.

Validation:

- Every question names its decision owner, authority basis, affected artifacts, and next owner.
- Applicable runtime and environment checks resolve factual questions only; a remaining customer-owned preference still goes to its decision owner.
- Existing owning records are reused, not duplicated.
- Technical or domain-owned questions stay internal unless customer-owned intent remains.
- An internally resolved or authority-conflicted question is not escalated as a customer task.
- Proposed and executed external actions are reported separately.
- Every executed GitHub mutation has an exact target and fresh observed state.

### Workflow stage: Assess customer replies

Determine what a reply authoritatively answers without converting mailbox presence into decision authority or workflow closure.

1. Read the exact supplied messages through gmail or equivalent exported data without changing mailbox state.
2. Verify sender/thread identity, the question codes discussed, the named decision owner's authority, and whether the reply is current or superseded.
3. Read the related approval-item history and authoritative project sources; stop acceptance on unresolved equal-authority conflicts.
4. If a necessary attachment is unavailable, request that specific attachment and block only the dependent question while continuing independent items.
5. Classify each reply per question as complete, partial, non-answer, or authority-conflict.
6. Convert answers into traced obligations for document owners; do not invent product, architecture, specification, or plan decisions.

Validation:

- Mailbox identity and decision authority are separate evidence fields.
- A complete answer is not reported as closed before propagation and terminal-state verification.
- Partial and blocked items name the exact remaining input and do not block independent questions.

### Workflow stage: Propagate accepted decisions and verify closure

Close only questions whose accepted obligations have durable disposition and whose required workflow state is evidenced.

1. Inventory every required affected artifact and owner per obligation; preserve their authority and handoff rules.
2. For each required owner, freshly verify one durable route: change evidence traces the exact obligation into required published owning artifact or code; or a current linked follow-up preserves the exact obligation, owner, owning slice or module increment, activation trigger, expected acceptance/evidence, evidence-return route, and reciprocal decision-record link.
3. Stop closure while a required owner lacks a durable route, affected artifacts conflict, or authority remains unresolved.
4. Treat a linked follow-up as closure only for the decision-workflow boundary; keep that follow-up open and do not claim its downstream product or runtime capability.
5. Use git-engineer for an authorized scoped commit; treat push or publication as a separate action that must be authorized and verified when the repository process requires it.
6. Use gh-utility for authorized comments and project updates with the exact applicable repository, issue, Project, item, field, and option identifiers.
7. Map semantic workflow state to the actual inspected Project field options; never assume status names.
8. Freshly read the commit/ref and GitHub issue/project state after mutations.
9. Mark verified only when the answer is authoritative and complete, every required owner has a durable route, affected artifacts are consistent, and required traceability, publication, and terminal state are observed.
10. Report per-question results, executed and proposed actions, evidence limits, remaining gaps, and next owners.

Validation:

- No terminal issue or Project state, comment, generated document, test, or commit hash is sufficient closure evidence by itself.
- A missing required-owner route, inconsistent affected artifact, unresolved authority conflict, or unavailable required publication cannot produce verified closure.
- The final report does not claim stronger authority or terminal state than the observed evidence.

## Interop priority

- **mailbox search, message/thread retrieval, and Gmail evidence:** gmail. gmail owns mailbox reads; requirements-approval assesses decision authority.
- **GitHub issue, comment, Project field mutation, and fresh remote-state verification:** gh-utility. gh-utility owns exact targets, mutations, and readback; requirements-approval supplies the semantic transition.
- **product scope, customer-owned product decisions, PRD authority, and product handoff:** prd-engineer. prd-engineer owns product content and PRD authority; requirements-approval supplies traced input.
- **architecture constraints, ASRs, pattern decisions, ADRs, and architecture handoff:** architecture-engineer. architecture-engineer owns architecture decisions; customer input supplies intent or constraints.
- **implementation-ready behavior, edge cases, and specification authority:** spec-engineer. spec-engineer owns specification content; requirements-approval routes obligations and gaps.
- **delivery decomposition, sequencing, and plan readiness:** delivery-planner. delivery-planner owns plan changes and readiness.
- **technical-document structure and documentation-only artifacts:** documentation. documentation owns form and structure when no specialized owner applies.
- **commits, pushes, branches, and ref verification:** git-engineer. git-engineer owns Git authorization, history changes, and ref evidence.

## Gotchas

- **high** — Before customer escalation, consider runtime, environment, existing owning records, and a narrower technical resolution for their relevance to the question. Inspect applicable evidence; neither an irrelevant unavailable service nor an unapproved technical alternative resolves customer intent.
- **high** — Organizing approvals does not authorize external writes; resolve the action, target and permission before execution.

## Policies

### Conservative customer language
Ask only for decisions required by current scope, in plain customer language, without embedding optional enhancements or a preferred answer.

## Portability rules

- Do not reference machine-specific paths, credentials, repository ids, Project ids, field ids, option ids, or fixed status names.
- Keep the authority, traceability, mutation, and closure contracts understandable without external local files.
- Treat connector and neighboring-skill names as capability expectations; accept equivalent exported data or report the unavailable boundary.

## Portability checklist before finishing

- During skill maintenance only, lint and regenerate changed sources, check generated parity and local links, and inspect active dependencies for portability.
- During skill maintenance only, compile to an isolated directory and check declared files; ordinary approval work does not compile the package or require a compiler.
- Maintenance structural checks do not establish behavioral PASS or decision-workflow closure.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/forward-tests/*`
- Supporting glob: `docs/logs/*`
