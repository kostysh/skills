# Diataxis Guide

Use this file when the task needs more than a quick type selection. It captures the parts of the Diataxis method that are easy to miss when people reduce it to "four documentation categories".

## Core idea

Diataxis is a framework for documentation based on user needs. It is not just a folder taxonomy.

Two distinctions matter:

- `action` vs `cognition`
- `study` vs `work`

That gives four documentation forms:

| Form | User need |
|---|---|
| Tutorial | Learn by doing |
| How-to guide | Accomplish a task |
| Reference | Look up facts |
| Explanation | Build understanding |

Use this model to decide what a document is for before deciding what to write.

## Important methodological points

### 1. Use Diataxis as a guide, not a plan

Do not force a whole documentation set into a rigid top-down reorganization before solving real user problems.

Prefer this sequence:

1. Identify one weak or mixed document.
2. Decide what user need it should serve.
3. Rewrite or split it accordingly.
4. Repeat.

The architecture of the documentation set should emerge from repeated local improvements.

### 2. Keep documents pure

One document should primarily serve one form.

What usually goes wrong:
- tutorials contain explanations and options that break the lesson
- how-to guides turn into mini-courses
- reference pages contain recommendations and design rationale
- explanations smuggle in procedures and specs

When a page mixes forms, split the content. If a single-file constraint is unavoidable, keep one dominant form and clearly separate the rest as supporting sections or links.

### 3. Organize around user needs, not product features

A product-feature tree often produces inconsistent documentation because the same feature may need all four forms.

Instead of asking:
- "Where do docs for feature X go?"

Ask:
- "What does the user need from this page right now?"

The same feature might legitimately need:
- a tutorial for first contact
- one or more how-to guides for real tasks
- reference for commands, API fields, or config keys
- explanation for architecture, trade-offs, and design rationale

## Detailed guidance by form

## Tutorial

Think of a tutorial as a lesson, not as a piece of reference material with numbered steps.

### What good tutorials do

- show the learner where they are going
- deliver visible results early and often
- maintain a narrative of the expected
- point out what the learner should notice
- target the experience of doing
- encourage repetition
- minimize explanation ruthlessly
- ignore options and alternatives
- aspire to reliability

### Tutorial stance

- The learner is a beginner.
- Success means the learner gains confidence and capability.
- The output artifact matters less than the learning experience.

### Tutorial language

Use direct, confidence-building language:
- "In this tutorial, we will..."
- "First, do x. Now do y."
- "The output should look like..."
- "Notice that..."
- "Let's check..."

### Tutorial anti-patterns

- long conceptual detours
- many branches or alternative paths
- unexplained failures or gaps
- assuming expert judgment from the reader
- stuffing in complete API or config coverage

## How-to guide

Think of a how-to guide as directions for a competent practitioner.

### What good how-to guides do

- solve a real problem
- begin from a meaningful starting point
- end at a meaningful outcome
- stay tightly focused on the task
- support adaptation to real-world variation when needed
- omit teaching material that belongs in tutorials

### How-to stance

- The user already understands the basics.
- They are working, not studying.
- They need a path to an outcome, not a lesson about the system.

### How-to language

Use imperative, task-centered language:
- "To rotate the signing key, do the following..."
- "If you are using provider X, use method Y."
- "After deployment, verify that..."

### How-to anti-patterns

- opening with a long theory section
- explaining every concept from first principles
- describing the product instead of the task
- turning the guide into a reference dump

## Reference

Reference describes the machinery. It is information-oriented and should be authoritative and easy to consult.

### What good reference does

- mirrors the structure of the product or interface
- uses consistent entry formats
- presents facts without persuasion
- exposes signatures, defaults, constraints, values, and behavior clearly
- supports quick lookup

### Reference stance

- The reader needs accurate facts.
- The document serves the system's structure, not a user journey.
- Examples are illustrative, not pedagogical.

### Reference anti-patterns

- hidden recommendations or design arguments
- long workflow narratives
- "best practice" advice embedded in every entry
- missing fields, inconsistent schemas, or uneven coverage

## Explanation

Explanation helps the reader understand why things are the way they are.

### What good explanation does

- provides context and background
- makes connections
- discusses history, rationale, constraints, and alternatives
- admits perspective and judgment where useful
- stays bounded to a coherent topic

### Explanation stance

- The reader is trying to understand.
- The page is about a topic rather than about a task or interface surface.
- Discussion is allowed; procedures and lookup data are not the main event.

### Explanation anti-patterns

- turning into setup instructions
- absorbing reference tables or command lists
- sprawling without a clear topic boundary
- pretending neutrality where trade-offs actually matter

## Rewrite heuristics

Use these moves when repairing existing documentation:

| If you see this | Do this |
|---|---|
| "How to..." page with three screens of background first | Cut the background; move it to explanation; keep only task-critical context |
| Beginner walkthrough with many production variants | Choose one safe path for the tutorial; move variants to how-to guides |
| API reference with recommendations like "you should usually..." | Move guidance to explanation or how-to; keep the reference entry factual |
| "Concepts" page containing commands and setup steps | Keep the concept; move commands to tutorial/how-to/reference as appropriate |
| Feature docs structured only by product area | Re-slice by user need, even if multiple forms exist for the same feature |

## Review questions

When reviewing docs through a Diataxis lens, ask:

1. What user need does this page primarily serve?
2. Does the title signal that form clearly?
3. Does the introduction make the promise of that form clear?
4. Does the body stay loyal to that promise?
5. What content belongs in another form?
6. If this is part of a docs set, where should linked companion pages exist?

## Practical authoring rule

Do not chase theoretical purity at the expense of shipping useful documentation. If a user needs a concrete rewrite now, solve that page well. Use Diataxis to make the next document clearer than the current one.
