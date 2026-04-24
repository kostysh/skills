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
