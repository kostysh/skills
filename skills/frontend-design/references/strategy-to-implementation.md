# Strategy To Implementation

Read this reference for non-trivial design strategy, implementation from an
accepted design, system-constrained UI work, or any handoff that may be mistaken
for delivered runtime capability.

## Choose The Deliverable

Name the requested deliverable before making visual decisions:

- `strategy-only`: a decision-complete visual and interaction strategy for a
  downstream implementer;
- `design-artifact`: a mockup, prototype, screenshot set, or design-tool file;
- `runtime-implementation`: code running in the intended application path.

One request may include more than one deliverable. Track each independently.
A strategy can be complete for its downstream consumer while remaining
substrate for an end-user runtime claim.

## Establish Readiness And Authority

Inspect the smallest authoritative set that can govern the work:

1. user brief and accepted product or UX requirements;
2. existing application behavior and architecture constraints;
3. design-system tokens, component inventory, Storybook or equivalent runtime
   examples, and accepted design artifacts;
4. available content, brand assets, imagery, and copy constraints;
5. representative viewport, accessibility, performance, and browser targets.

Record the source hierarchy when more than one source can govern the same
decision. Do not silently choose between equal-authority conflicts. Ask the
owner or return `blocked` for the affected decision.

Missing visual inspiration can be resolved with a clearly labeled thesis.
Missing product behavior cannot: do not invent actors, actions, states,
permissions, backend truth, validation, or success criteria to complete a
layout.

For `system-constrained` work, inspect the actual reusable component surface
before proposing new primitives or one-off styling. A mockup or old screenshot
does not override current runtime behavior by itself.

## Write The Strategy Contract

Keep the contract proportional for small changes, but cover every field needed
by the downstream consumer:

- `capability and consumer`: what user outcome or downstream decision this
  design enables;
- `anti-claims`: what the strategy, artifact, or implementation does not prove;
- `source hierarchy`: which inputs govern behavior, system constraints, and
  visual direction;
- `surface classification`: surface type, constraint profile, and primary
  visual engine;
- `visual thesis`: mood, material, energy, hierarchy, and dominant idea;
- `content and state plan`: information order plus relevant loading, empty,
  error, success, permission, long-content, and responsive states;
- `interaction thesis`: only the transitions or motion that improve hierarchy,
  continuity, feedback, or affordance;
- `reuse plan`: existing tokens, components, patterns, assets, and any justified
  exception with its owner;
- `evidence plan`: rendered viewports, states, interactions, and accessibility
  checks required for the strongest completion claim.

For complex operational UI, use a compact state-to-owner matrix when prose
would hide missing states or component ownership. Do not create a matrix for a
small visual adjustment that remains clear without one.

## Translate Strategy Into Implementation

- Map each material state and interaction to an existing component or an
  explicitly justified gap before writing screen-level styling.
- Preserve product and runtime semantics when a design artifact disagrees with
  the implemented component contract; resolve the artifact or record the gap
  instead of copying it blindly.
- Keep responsive behavior and content extremes in the implementation plan, not
  as a cleanup pass after desktop styling.
- Use framework and component-system skills for code-level architecture,
  lifecycle, accessibility mechanics, and component APIs. `frontend-design`
  owns the visual strategy and whether the rendered result expresses it.
- Route durable `.pen` creation, inspection, editing, and export mechanics to
  `pencil-dev`; the design artifact still follows this strategy contract.

## Verify The Observable Result

Match evidence to the deliverable:

| Deliverable | Minimum honest evidence |
| --- | --- |
| `strategy-only` | Complete contract, resolved authority, implementable state/reuse plan, and named runtime evidence still required. |
| `design-artifact` | Current artifact inspection and export/readback for the required frames or states; no runtime claim. |
| `runtime-implementation` | Current rendered checks at representative desktop and mobile viewports, relevant states and interactions, keyboard/focus behavior, reduced-motion behavior when motion exists, and console/network inspection when applicable. |

Use `agent-browser` for interactive exploration, diagnostics, screenshots, and
terminal-state checks. Use `playwright` when the evidence must be repeatable as
a scripted browser scenario. Do not require both without a concrete reason.

A screenshot proves only the pixels and state it shows. Source inspection,
component stories, mocks, and design-tool exports do not prove the integrated
runtime path.

## Report Status

Choose the strongest status supported by current evidence:

- `strategy-ready`: the design strategy is decision-complete for its consumer;
- `artifact-ready`: the requested design artifact passed artifact-level checks;
- `implemented-not-verified`: implementation exists, but required rendered
  evidence is missing or failed;
- `verified`: the requested runtime implementation and proportionate rendered
  checks passed;
- `blocked`: an unresolved authoritative input or required boundary prevents a
  safe result.

Report the deliverable, status, evidence obtained, checks not run, and remaining
anti-claims. Do not collapse several deliverables into `verified` when only one
has reached that status.
