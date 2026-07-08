---
name: documentation
description: "Create, review, restructure, and rewrite technical documentation
  using the Diataxis framework. Use when the task is to decide whether content
  should be a tutorial, how-to guide, reference, or explanation; split mixed
  documentation into the right forms; improve documentation architecture; or
  review docs for user-need fit, structure, and quality. Trigger terms include:
  Diataxis, tutorial vs how-to, reference vs explanation, documentation
  structure, reorganize docs, docs IA, technical writing, rewrite docs."
metadata:
  source-version: 0.1.1
  tags: documentation, technical-writing, diataxis, tutorials, how-to, reference,
    explanation
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 5a6c58b6dff636979dbf1a29abf80cc79c625bb4754c4f738eddc8097b7424bd
---

# documentation

## Start here

1. Confirm the task matches documentation's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- write new technical documentation
- choose the right documentation form for a request
- review documentation quality and structure
- untangle mixed-purpose pages
- reorganize an existing documentation set around user needs

## When NOT to use this skill

- marketing copy, landing pages, or brand messaging
- product specs, ADRs, RFCs, or internal design proposals
- changelogs, release notes, or status updates
- purely technical correctness work where another domain skill should lead

## Overview

Use this skill to apply Diataxis as a practical way to write and improve technical documentation.

Read [references/diataxis-guide.md](references/diataxis-guide.md) when you need deeper guidance, rewrite patterns, or more detailed distinctions between the four forms.

## Interop priority

- This skill owns documentation form, boundaries, structure, and review criteria.
- Domain or framework skills own factual correctness, API behavior, and code examples.
- If there is tension, keep the domain skill's facts and use this skill to decide where that material belongs.

## Core stance

- Treat Diataxis as a model of user needs, not as a requirement to create four empty buckets in a docs tree.
- Choose one primary user need per document. If the material mixes needs, split it.
- Prefer fixing one concrete documentation problem at a time over redesigning the whole corpus upfront.
- Ask a clarifying question only if the ambiguity changes the documentation form or would materially change the result. Otherwise, make a reasonable assumption and state it.

## Workflow

1. Identify the user need.
- Are they trying to learn, complete a task, look up facts, or understand why something works?

2. Use the Diataxis compass.

| Primary need | User mode | Form |
|---|---|---|
| Learn safely by doing | Study + action | Tutorial |
| Complete a real task | Work + action | How-to guide |
| Look up facts about the machinery | Work/study + cognition | Reference |
| Build a mental model | Study + cognition | Explanation |

3. Decide whether to split.
- If one page tries to teach, solve, specify, and explain at once, break it into multiple documents.
- If the user insists on one page, keep one primary form and clearly separate supporting material as linked follow-up content. Only keep mixed sections in one file when that constraint is explicit.

4. Draft or rewrite in the selected form.
- Keep the document pure to its form.
- Link to the other forms instead of embedding them.

5. Validate before delivering.
- Use the checklist for the chosen form.
- In reviews, lead with mismatches between user need and document form, then mixed-content problems, then style issues.

## The four forms

### Tutorial

Use for lessons aimed at learners.

- Optimize for a successful learning experience, not for completeness.
- Show where the learner is going.
- Deliver visible results early and often.
- Maintain a clear narrative of what should happen next.
- Point out what the learner should notice.
- Minimize explanation and ignore alternatives unless they are required for success.
- Aim for reliability: the learner should see the promised result at each step.

Validation:
- A beginner can complete it end-to-end.
- Each step has an expected outcome.
- The learner does not need to make expert judgments to proceed.

### How-to guide

Use for directions that help a capable user accomplish a real task.

- Center the guide on the goal, not on teaching the system from scratch.
- Assume baseline competence.
- Keep the path focused on doing.
- Allow practical branching only when the task genuinely requires judgment.
- Omit background theory except for a short note when strictly necessary.

Validation:
- A user with relevant baseline knowledge can complete the task without backtracking.
- The guide solves a real problem rather than touring the product.

### Reference

Use for factual, structured description of the machinery.

- Organize by the product, API, command, schema, or interface itself.
- Be explicit, neutral, consistent, and easy to scan.
- Prefer repeatable entry formats, tables, signatures, defaults, constraints, and short examples.
- Describe what is true; do not teach workflows or argue for design choices here.

Validation:
- A reader can find a fact quickly.
- Entries are complete and consistent.
- Advice, opinion, and conceptual digressions are kept elsewhere.

### Explanation

Use for understanding-oriented discussion.

- Provide context, rationale, history, constraints, alternatives, and trade-offs.
- Make connections between concepts.
- Bound the topic clearly.
- Permit perspective and judgment where they help understanding.
- Do not turn the page into step-by-step instructions or exhaustive API description.

Validation:
- The reader leaves with a better mental model.
- The page answers "why?" or "what does this mean?" rather than "what do I click?" or "what is the default value?"

## Mixed-content triage

When reviewing or rewriting existing docs, use these default moves:

| Symptom | Likely fix |
|---|---|
| Step-by-step instructions interrupted by long background paragraphs | Keep the steps in a tutorial or how-to guide; move the background into explanation |
| A task page starts teaching basics from scratch | Split out a tutorial for beginners and keep the task page as a how-to guide |
| Reference entries contain recommendations, opinions, or trade-off analysis | Move that material into explanation or a how-to guide |
| A tutorial offers many branches, options, and alternative paths | Tighten it into one reliable learning path, or convert it into a how-to guide if the audience is already competent |
| An explanation contains setup steps or API tables | Move procedures to how-to/tutorial and technical facts to reference |

## Review checklist

- The title matches the document form.
- The introduction makes the user promise clear.
- Every section serves the same primary need.
- Material of other forms is linked, not blended in.
- The document is complete for its form, not for every possible need.

## Workflow stages

### Workflow stage: Apply documentation guidance

Apply the preserved documentation guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Gotchas

- **high** — Do not write persistent project prose in the wrong language with the intent to translate later. Select the language mode before the first draft.
- **high** — Do not present documentation, matrices, reports, or process notes as delivered runtime capability unless the task is explicitly a documentation or support capability.

## Policies

### Language preflight policy
Before creating persistent docs, identify the audience and repository language rule; final language review is a verification step, not the primary drafting workflow.

## Required active references
- [Diataxis Guide](references/diataxis-guide.md) — Read this when you need deeper guidance, rewrite patterns, or more detailed distinctions between the four forms.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory documentation guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
