# Detailed Diataxis Guidance

Load this reference only for ambiguous form selection, substantial mixed-content
rewrites, detailed tutorial or how-to design, or corpus and multi-audience
information architecture. The root skill owns source authority, statuses,
side-effect limits, and the canonical compass.

## Contents

- [Resolve close form choices](#resolve-close-form-choices)
- [Design and test each form](#design-and-test-each-form)
- [Repair mixed documentation](#repair-mixed-documentation)
- [Evolve a documentation corpus](#evolve-a-documentation-corpus)
- [Understand the quality boundary](#understand-the-quality-boundary)

## Resolve close form choices

### Tutorial or how-to guide

Choose a tutorial when the reader is acquiring capability through a guided
experience. The author owns the path and removes choices that require expert
judgment.

Choose a how-to guide when a competent reader is applying existing capability
to a real problem. The path may fork, overlap, or require judgment when the
problem does.

Diagnostic question: is success primarily the learner's successful experience,
or completion of their external task?

### Reference or explanation

Choose reference when a working reader needs authoritative facts about the
machinery. Its structure should mirror the interface it describes.

Choose explanation when a studying reader needs connections, rationale,
context, or a mental model. It may present perspective, but must distinguish
sourced decisions from interpretation.

Diagnostic question: will the reader consult the page to retrieve a fact, or
read it to understand a topic?

### Documents that coordinate several forms

Landing pages, navigation pages, and bounded overviews may point to several
forms. Their purpose is orientation. Do not misclassify them as reference merely
because they contain lists, or force them into four separate versions.

## Design and test each form

### Tutorial

- Show the achievable result before the first step.
- Produce visible, comprehensible results early and often.
- State what the learner should observe and what expected output looks like.
- Prefer repeatable and reversible exercises where practical.
- Mention likely failure signs only when they help the learner recover without
  turning the lesson into troubleshooting reference.

Strong evidence is a safe end-to-end execution in the target environment;
observation of representative learners is stronger when available. Static
inspection can support a draft but cannot prove the learning experience.

### How-to guide

- Name the real problem and meaningful starting and ending conditions.
- Describe actions, including necessary judgment, in a logical sequence.
- Address material conditions and variants without expanding into a complete
  product tour.
- Keep prerequisites explicit and link to reference for exhaustive options.

Strong evidence exercises the primary path and checks material commands,
interfaces, preconditions, and results. If an operation is unsafe to execute,
use authoritative static evidence and report the unexecuted path.

### Reference

- Derive the entry set from a named API, CLI, schema, configuration, or other
  authoritative contract.
- Keep entry shape and terminology consistent.
- Include the fields a working reader needs: syntax, type, default, constraints,
  behavior, errors, version, and a short example when applicable.
- State the scope of completeness instead of implying universal coverage.

Strong evidence compares the page with the current target contract and records
which surface was checked. Generated reference is still a draft if the
generator input is stale or the published output was not read back.

### Explanation

- Open with the question or concept the page will clarify.
- Connect causes, constraints, alternatives, and consequences.
- Attribute product rationale and mark interpretation where sources do not
  establish intent.
- End when the promised mental model is complete; move procedures and lookup
  tables elsewhere.

Strong evidence checks factual claims and attributed rationale against accepted
sources. Reader research may improve confidence in comprehension but is not a
universal completion requirement.

## Repair mixed documentation

| Symptom | Default move |
| --- | --- |
| Steps are interrupted by long background sections | Keep the executable flow; link or move the background to explanation. |
| A task page teaches all fundamentals from scratch | Keep the real task as how-to and create a tutorial only if the learning need is in scope. |
| Reference entries contain recommendations or trade-offs | Keep contract facts in reference; move decisions to how-to or explanation. |
| A tutorial presents many production variants | Choose one safe learning path; move working variants to how-to guides. |
| An explanation contains setup commands or exhaustive tables | Keep the mental model; move procedures and lookup data to their owning forms. |

Split only when the result has a destination and improves the user's flow. A
move proposal without link, navigation, and ownership implications is not an
implementation-ready restructure handoff.

## Evolve a documentation corpus

Use Diataxis as a guide to local improvement rather than a top-down migration
project:

1. Select the smallest page or cluster that has a concrete user problem.
2. Identify its audience, primary need, target state, and authoritative sources.
3. Apply one bounded improvement and verify its links and user promise.
4. Update navigation or companion content only when the change requires it.
5. Let repeated improvements reveal the durable hierarchy.

For multiple audiences, product variants, or deployment environments, decide
whether audience/topic or form should be the outer hierarchy by the reader's
likely navigation path. Shared content may remain shared when duplication would
create drift. Complex structure is acceptable when it is logical and usable.

## Understand the quality boundary

Diataxis primarily improves fit to user needs, flow, form, and information
architecture. Functional qualities such as accuracy, completeness,
consistency, precision, safety, and usefulness require domain knowledge and
checks against the world being documented.

Therefore:

- use Diataxis review to expose likely gaps, not to certify technical truth;
- keep structural, factual, executable, publication, and reader evidence as
  separate claims;
- use `verified` only for the requested documentation boundary and the checks
  actually performed.

Optional methodology provenance:

- <https://diataxis.fr/compass/>
- <https://diataxis.fr/how-to-use-diataxis/>
- <https://diataxis.fr/quality/>
- <https://diataxis.fr/complex-hierarchies/>
