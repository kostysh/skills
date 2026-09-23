# Review requests for concept-conformance-reviewer

Treat each case separately. Use only the supplied concept, claim, and evidence; do not infer a live service or run commands. Give the skill's usual read-only conclusion for each. Labels A/B/C are only identifiers.

## A

Closure review of snapshot `concept-A-r1`. Accepted product concept: a customer submits a dispute intake, receives a persistent case identifier, and can see the submitted record after a new session. The team claims “customer intake is operational.” Supplied evidence: a clickable mock screen, a demo in which a seeded JSON object is displayed, API contract documentation, and a unit test for a `createIntake` stub. The stub returns an in-memory ID; no production request, durable write, session recovery, or readback evidence is supplied. The product owner asks whether the claimed capability can be closed.

## B

Design-time review of snapshot `concept-B-r1`. The same accepted concept applies. The proposed acceptance criteria require: a real customer submission through the production entry point, a server-created durable case ID, retrieval after a fresh session, and an error path that does not report success when persistence fails. Each criterion is explicitly tied to an observation at that boundary; no implementation or closure is claimed. The owner asks whether these criteria are ready to guide implementation.

## C

Conversation history supplied for this case: earlier in this task, you authored the acceptance criteria being assessed. The user asks for an “independent concept-conformance assessment” of snapshot `concept-C-r1`. Its accepted concept and criteria are exactly as in B; this is a design-time review, with no implementation claim.
