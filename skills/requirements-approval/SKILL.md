---
name: requirements-approval
description: "Organize requirements approvals: identify open questions, research
  which can be resolved internally, route customer-owned decisions, create
  GitHub tasks, process Gmail/GitHub replies, and propagate accepted decisions
  into PRDs, architecture, specs, and plans. Also use for «согласование
  требований»."
metadata:
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 8472987dd02d141db3f50458f9e51992756db712908914a5693f3da23f398b19
---

# requirements-approval

## Start here

1. Confirm whether the task is preparing customer approval requests or processing customer replies.
2. Treat approval artifacts as coordination substrate; the real capability is resolved requirements reflected in project documents and tracked GitHub state.
3. Before asking the customer, research whether each open question can be closed from existing inputs, project requirements, or public sources.
4. Escalate only questions that cannot be fully resolved without customer input; do not use approval tasks as a substitute for analysis.
5. Keep customer-facing requests conservative and scope-protecting; do not suggest expansions or improvements outside initial project requirements.
6. Use the customer's language for customer-facing request examples.

## When to use this skill

- Identifying open questions in requirements, specs, PRDs, architecture notes, plans, or backlog items.
- Creating GitHub tasks in a dedicated approval project for questions that need customer input.
- Processing customer email replies, matching them to open-question codes and GitHub approval tasks.
- Propagating customer decisions into project documentation and committing those changes.

## When NOT to use this skill

- The answer can be derived from existing project inputs without customer approval.
- The task is ordinary product specification work with no customer-facing approval workflow.
- The user wants a broad discovery workshop, sales proposal, or scope expansion.
- Gmail or GitHub access is required but unavailable and the needed data was not provided another way.

## Overview

This skill organizes two customer requirements approval workflows:

1. preparing approval requests for unresolved open questions
2. processing customer replies from email into documented project decisions

The process is intentionally conservative. The agent should protect the agreed scope, not use customer approval as a way to introduce optional enhancements.

## Open Question Standard

Each open question should have a stable code. If source materials do not provide one, create a short project-local code and keep it stable across GitHub tasks, email processing, docs, commits, and reports.

Before escalating, ask:

- Can existing requirements, project docs, decision history, or dependencies answer this?
- Can public sources answer the current factual part?
- Is only part of the question unresolved?
- What exact customer input is still needed?

## GitHub Approval Task Shape

Each approval task should include:

- title with open-question code or codes
- why the open question exists
- context and links to project documents or dependencies
- research already performed
- exact missing input
- customer-facing request example in the customer's language
- conservative scope note when useful

## Customer Reply Decision Shape

Classify each customer reply as:

- **full closure** — enough to update all affected docs and close the task
- **partial closure** — some decision or data is usable, but a named gap remains
- **no closure** — reply does not answer the open question

Full and partial closures both require documentation propagation and a commit. Only full closure may move the task to DONE.

## Workflow stages

### Workflow stage: Prepare approval requests

Create approval tasks only for open questions that remain unresolved after reasonable research.

1. Extract open questions and assign or preserve stable question codes.
2. For each question, check existing inputs, requirements, decisions, project docs, issue history, and related dependencies.
3. If the question depends on current external facts, search public sources and cite what was checked.
4. Mark questions as resolved, partially resolved, or customer-needed; do not escalate resolved questions.
5. For customer-needed questions, create a GitHub task in the dedicated approvals project.
6. Put the question code or codes in the task title.
7. In the task body, include why the question exists, project context, links to project docs and dependencies, what research was done, and the specific missing customer input.
8. Add a customer-facing request example in the customer's language, written simply and shaped for quick choice or reply.
9. Keep the request conservative; present decisions needed to satisfy current scope, not optional enhancements.

Validation:

- Every created task maps to at least one open-question code.
- Every escalated question shows why existing inputs and public research were insufficient.
- The customer request does not invite scope expansion beyond initial requirements.

### Workflow stage: Process customer replies

Convert customer email replies into documented decisions, commits, and updated approval task state.

1. Read the operator's screenshot/text list and identify the mentioned emails or threads.
2. Use the mailbox connector to find and read those emails or threads.
3. If an attachment is needed but cannot be read, immediately ask the operator to provide all attachments and stop processing that item.
4. Identify open-question codes discussed in the emails.
5. Find related GitHub approval tasks and read their history before changing status.
6. Comment on each related task with the email id or thread id and a short answer summary.
7. Decide whether the customer answer closes each open question fully, partially, or not at all.
8. For full closure, propagate the decision and any incoming data through all affected docs, such as PRD, architecture, specs, plans, and related materials.
9. For partial closure, propagate the partial decision, document what remains open, and prepare a conservative follow-up request.
10. For partial closure, add a task comment explaining why the answer is incomplete, with arguments and links to related materials when useful.
11. Commit documentation/data changes and comment on the task with the commit hash.
12. Move fully closed tasks to DONE; keep or move partially closed tasks to IN PROGRESS.
13. Report to the operator what answers were received, how scope/functionality changed or stayed unchanged, what docs/data changed, task statuses, commits, and any follow-up customer request example.

Validation:

- Each processed email is linked to question codes and GitHub task comments.
- Documentation changes are committed before a task is marked DONE.
- Partial answers remain IN PROGRESS with a clear reason and follow-up request.

## Interop priority

- **mailbox lookup and customer email threads:** gmail. Use Gmail connector capabilities for finding and reading customer emails.
- **approval task creation, comments, and status updates:** gh-utility or GitHub plugin skills. Use GitHub tools for issue/project state, comments, and task lifecycle.
- **documentation propagation:** documentation, prd-engineer, architecture-engineer, spec-engineer, or delivery-planner as applicable. Use the relevant document skill for the affected artifact type.
- **commits:** git-engineer. Use git-engineer for Conventional Commits and clean history.

## Gotchas

- **high** — Do not ask the customer questions that can be closed from existing inputs, project docs, issue history, or public research.
- **high** — Customer requests must not propose enhancements outside initial project scope unless the operator explicitly asks for scope discovery.
- **high** — If an email attachment is necessary but unreadable, ask the operator for all attachments before deciding or updating docs.
- **medium** — Record the email id/thread id and answer summary on the GitHub task before changing task status.
- **high** — Do not mark a task DONE until the accepted decision is propagated through affected documentation and committed.

## Policies

### Conservative customer language
Customer-facing examples should be short, plain, easy to answer, and framed around required decisions rather than optional improvements.

### Traceability policy
Maintain a chain from open-question code to research, GitHub task, customer email id, documented decision, commit hash, and final task state.

### Partial closure policy
Partial replies must be documented, committed, and left IN PROGRESS with the remaining gap and a follow-up customer request.

## Portability rules

- Do not reference machine-specific paths or repository-specific project ids.
- Keep the approval workflow understandable without external local files.
- Treat connector names as capability expectations; if unavailable, ask for equivalent exported data.

## Portability checklist before finishing

- Run the skill-source-compiler check command after generation.
- Search the skill folder for absolute local paths.
- Confirm the skill remains concise and self-contained.
