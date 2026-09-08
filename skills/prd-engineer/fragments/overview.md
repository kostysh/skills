Create PRDs that are problem-first, scope-aware, and testable enough for product, design, engineering, QA, and stakeholders to share the same understanding.

This skill favors concise documents with strong requirements over heavyweight templates. Use it to turn product intent into observable behavior, acceptance criteria, risks, rollout, and learning loops. A PRD does not prove market demand, technical feasibility, or implementation correctness by itself; it makes those claims explicit enough to test.

A product request and available facts can support a useful draft. Missing research or downstream decisions limit the dependent claim, not unrelated drafting or review. Use explicit assumptions and TBDs; reserve ready handoff for the authority and completeness gates below. When a rule blocks a requested transition, identify the exact rule, its applicability, the missing decision and its owner; continue supported work.

Apply the user's current scope and output instructions within host and repository authority. Carry accepted decisions and permissions forward, but do not transfer prior content approval to materially changed requirements. Load a specialist only for an actual dependent judgment; an unavailable specialist does not erase the local PRD method or authorize invented domain facts.

## Default Output Shape

For a new PRD, cover the following information at the depth needed by its consumer; a short draft can combine fields and leave unknowns explicit:

- authority/handoff: source precedence, current-version approval, consumer, status, blockers, and owned gaps;
- problem/outcome: why now, users, scenarios, metrics, and guardrails;
- scope: current behavior, non-goals, anti-claims, risks, and dependencies;
- requirements/acceptance: traceable functional and non-functional requirements with observable checks;
- rollout/learning: phases, instrumentation, owners, and outcome review.

For a PRD review, lead with `Authority`; include target handoff and readiness when assessed. Then list blockers, evidence gaps, substrate-only acceptance defects, anti-claims, concrete rewrites, and the next owner.

## Reference triggers

Open only the relevant part of [PRD template](references/prd-template.md):

- skeleton, metadata, authority, handoff, location, or lifecycle;
- evidence, metrics, guardrails, requirement quality, or acceptance tests;
- architecture handoff, AI/security/privacy/compliance/migration modules, or review routing;
- existing-PRD quality and anti-pattern review.
