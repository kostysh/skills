# Surface Classification

Use this reference when the surface type or the degree of design-system
constraint is ambiguous.

Classify two independent dimensions:

- `surface type`: `brand/landing`, `product/app`, or `secondary format`;
- `constraint profile`: `greenfield` or `system-constrained`.

A product app with an existing design system is therefore `product/app` plus
`system-constrained`, not one or the other. If an existing brief says
`system-constrained UI`, interpret it as the `system-constrained` profile and
still name the surface type.

## `brand/landing`

Use for branded landing pages, marketing pages, campaigns, launches, editorial brand storytelling, and hero-first surfaces.

Default priorities:

- first-screen brand recognition
- one dominant visual anchor
- sparse copy
- clear CTA
- atmosphere and recall

Default composition:

- full-bleed or near-full-bleed hero
- narrow text/action column
- visual-first hierarchy
- short support and detail sections

Avoid:

- generic feature-card grids as the opening move
- overly dense nav, badges, pills, or trust-strip clutter
- weak imagery carrying no narrative weight

## `product/app`

Use for dashboards, workspaces, admin tools, internal tools, product surfaces, and operational UIs.

Default priorities:

- orientation
- scanning speed
- clarity of status and action
- restrained styling
- dense but readable layout

Default composition:

- working surface first
- navigation second
- secondary context third
- one accent for action or state

Avoid:

- homepage-style hero sections unless explicitly requested
- decorative gradients behind everyday productivity UI
- cards used as default wrappers for every region

## Constraint Profile: `greenfield`

Use when no accepted design system, component language, or runtime visual
baseline governs the work.

Rules:

- establish the smallest coherent token and component language the requested
  surface needs;
- do not build a speculative design-system platform before the surface proves
  repeated needs;
- record choices that a downstream implementer must preserve.

## Constraint Profile: `system-constrained`

Use when the project already has an active design system or component framework such as shadcn.

Default priorities:

- preserve tokens, spacing logic, component language, and interaction patterns
- improve hierarchy, composition, and copy within the system
- keep custom styling additive and minimal

Rules:

- inspect the current tokens, reusable components, Storybook or equivalent
  runtime examples before new visual decisions;
- use theme tokens, component props, and supported overrides first
- do not introduce a parallel visual system without approval
- do not fight the framework’s information density model

## `secondary format`

Use for poster-like sections, prototypes, demo UI, exhibit surfaces, or game UI mock pages that still live in a web/frontend context.

Default priorities:

- one big idea
- dramatic hierarchy
- memorable visual treatment
- clear readability despite stylization

Rules:

- keep the same composition discipline as landing work
- let mood support the content, not replace it
- preserve usability when the surface still implies interaction
