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
