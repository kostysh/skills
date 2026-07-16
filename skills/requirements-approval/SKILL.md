---
name: requirements-approval
description: "Coordinate customer-owned requirements decisions: triage open
  questions, research resolvable facts, prepare approval requests, process
  supplied or Gmail replies, and route accepted decisions into GitHub and
  authoritative project documents. Use for approval workflows and «согласование
  требований»."
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 80b8d0da59e9bdd87c760a1042bdaf4261f4d17388a13962f639e1f76b455e65
---

# requirements-approval

## Start here

1. Confirm whether the request is assessment/drafting or authorizes external execution against exact targets.
2. Define success as an authoritative decision propagated through every affected artifact and verified workflow state, not coordination artifacts alone.
3. Identify each question's decision owner, authority, affected artifacts, and downstream owners before interpretation or closure.
4. Use repository-defined source precedence; unresolved equal-authority conflicts block acceptance instead of being resolved by recency or convenience.
5. Route document content and authority decisions to their owning skills; requirements-approval owns triage, traceability, and the closure gate.
6. Execute GitHub or Git mutations only with exact action/target authorization; otherwise return a draft, partial, or blocked state.

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

## Workflow stages

### Workflow stage: Triage questions and prepare approval requests

Escalate only unresolved customer-owned decisions and keep proposed actions distinct from executed mutations.

1. Extract open questions and preserve stable source codes; create a short project-local code only when the source lacks one.
2. Identify the decision owner and affected product, architecture, specification, plan, data, or documentation artifacts for each question.
3. Inspect authoritative project inputs, decisions, dependencies, and issue history before external research.
4. Use current authoritative public sources only for factual parts that can narrow the question; do not use public facts to invent a customer preference or approval.
5. Classify each question as resolved internally, customer input required, partial, or blocked by missing/conflicting authority.
6. For customer input required, prepare a concise request in the customer's language with context, research, exact missing input, and current-scope choices.
7. With exact GitHub target and mutation authority, hand creation to gh-utility and verify by fresh read; otherwise draft and list the missing repository, record target, applicable Project mapping, and authorization.

Validation:

- Every question names its decision owner, authority basis, affected artifacts, and next owner.
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

Close only the questions whose accepted content, project artifacts, Git state, and approval-task state are all evidenced.

1. Route each accepted obligation to the applicable artifact owner and preserve that artifact's authority, approval, and handoff rules.
2. Verify every affected artifact was updated consistently and that no required owner or conflicting source remains unresolved.
3. Use git-engineer for an authorized scoped commit; treat push or publication as a separate action that must be authorized and verified when the repository process requires it.
4. Use gh-utility for authorized comments and project updates with the exact applicable repository, issue, Project, item, field, and option identifiers.
5. Map semantic workflow state to the actual inspected Project field options; never assume status names.
6. Freshly read the commit/ref and GitHub issue/project state after mutations.
7. Mark a question verified only when the accepted answer is authoritative and complete, every affected artifact is updated and available as required, and the traceability chain plus terminal state are observed.
8. Report per-question results, executed and proposed actions, evidence limits, remaining gaps, and next owners.

Validation:

- No issue, comment, generated document, test, or commit hash is sufficient closure evidence by itself.
- Partial, blocked, or unpublished required changes cannot produce a verified closure.
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

- **high** — A broad request to organize or review approvals does not identify an external mutation target; return drafts until exact action, target, and authorization are available.
- **high** — Finding an email proves message presence, not sender authority, decision ownership, currentness, or acceptance of affected artifacts.
- **high** — Public research may resolve current facts but cannot choose a customer preference or approve product scope.
- **medium** — Request only the unavailable attachment required by a named question and continue independent items.
- **high** — GitHub Project status names and option IDs are target-specific; inspect them and verify each update instead of assuming workflow labels.
- **high** — An issue, comment, commit, generated document, test, or traceability row is substrate until the accepted decision is propagated and the required terminal state is observed.

## Policies

### Conservative customer language
Ask only for decisions required by current scope, in plain customer language, without embedding optional enhancements or a preferred answer.

### Traceability
Preserve the chain from question code and authority evidence through research, reply, accepted obligation, affected artifact, verified Git/ref state, GitHub item, and remaining gap.

## Portability rules

- Do not reference machine-specific paths, credentials, repository ids, Project ids, field ids, option ids, or fixed status names.
- Keep the authority, traceability, mutation, and closure contracts understandable without external local files.
- Treat connector and neighboring-skill names as capability expectations; accept equivalent exported data or report the unavailable boundary.

## Portability checklist before finishing

- Run skill-source-compiler lint, regenerate, and check after source changes.
- Resolve local links and search the complete emitted package for absolute local dependencies.
- Compile to an isolated directory and confirm copied eval and supporting artifacts remain readable.
- Confirm structural checks are not reported as behavioral PASS.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/forward-tests/*`
- Supporting glob: `docs/logs/*`
