# Pre-customer triage falsifiers

Customer language: Italian.

Repository instructions state that customer requests may be prepared only for unresolved customer-owned decisions. Current runtime evidence, environment-owned contracts, existing approval records, and technical-owner decisions are authoritative for their respective boundaries.

## Q-RUNTIME

Question: Must an operator be able to retry a failed export without re-approving the report?

Current integration test `export-retry.integration.test.ts` and the deployed route contract both show that an approved report remains approved and the operator can retry the failed export. The evidence is current for the active release.

## Q-ENV

Question: Can export links remain valid for 30 days?

The active environment contract sets a mandatory maximum signed-link lifetime of 7 days. Application configuration cannot increase it. A 30-day link would require a separately approved provider and environment change; no such scope exists.

## Q-TODO

Question: Which weekday should the weekly summary be sent?

Existing approval record `TODO-42` already owns this unresolved customer preference, is current, and is awaiting the same product owner's answer. It contains the affected PRD and notification specification links.

## Q-TECH

Question: Should generated PDFs be stored in object storage or in the relational database?

The accepted architecture boundary assigns binary-object placement to the architecture owner after volume and retention evidence is collected. No customer-owned product behavior changes between the two allowed implementations.
