Use this skill when the quality of the work depends on art direction, hierarchy, restraint, imagery, typography, and motion rather than component count alone.

Goal: produce deliberate, current interfaces and implementation-ready design
strategies whose claims match the evidence. Prefer one clear idea, strong
hierarchy, rigorous spacing, and only the imagery or motion the selected surface
needs.

## Working Model

Before designing or building, establish:

- `deliverable`: `strategy-only`, `design-artifact`, or `runtime-implementation`
- `source hierarchy`: the brief, product behavior, existing runtime, design system, and assets that govern decisions
- `surface type`: `brand/landing`, `product/app`, or `secondary format`
- `constraint profile`: `greenfield` or `system-constrained`
- `visual engine`: one primary engine and, only when useful, one supporting engine
- `visual thesis`: one sentence describing mood, material, energy, and the dominant visual idea
- `content and state plan`: content order plus the relevant loading, empty, error, success, permission, responsive, and long-content states
- `interaction thesis`: only the transitions or motion that materially improve presence, hierarchy, feedback, or affordance
- `reuse and evidence plan`: existing components/assets to reuse and the rendered checks required for the requested completion claim

Each section gets one job, one dominant visual idea, and one primary takeaway or action.

For non-trivial strategy, system-constrained work, implementation handoff, or
runtime completion, read `references/strategy-to-implementation.md`.

Load references only when needed:

- `references/strategy-to-implementation.md` for readiness, strategy handoff, implementation mapping, evidence, and status rules
- `references/surface-modes.md` for surface type and constraint-profile rules
- `references/visual-engines.md` for choosing an `image-led`, `type-led`, `grid-led`, `product-led`, or `data-led` direction
- `references/anti-patterns.md` for common failure patterns and anti-AI-slop guidance

## Cross-Mode Defaults

- Start with composition, not components.
- Keep copy short enough to scan in seconds.
- Use whitespace, alignment, scale, cropping, and contrast before adding chrome.
- In greenfield work, limit the system to two typefaces and one accent color by default; in system-constrained work, preserve the accepted token system.
- Use expressive typography when the brief allows it; avoid safe, overused default choices that flatten the page.
- Default to cardless layouts. Use sections, columns, dividers, lists, and media blocks instead.
- Build atmosphere with backgrounds, texture, depth, overlays, or pattern only when they reinforce hierarchy and mood.
- Avoid AI-slop aesthetics: generic SaaS card stacks, weak branding, filler gradients, predictable component mosaics, and cookie-cutter visual language.

## Mode Application

For landing work, use a concise hero-support-detail-CTA sequence and one
dominant first-screen composition. The anchor may be imagery, expressive type,
product proof, data, or grid structure; do not force imagery into a non-image
engine. Count persistent headers against the initial viewport budget.

For product work, lead with the working surface, navigation, secondary context,
and one clear action or state accent. Prefer dense but readable layout over
marketing heroes, decorative backgrounds, or card mosaics.

When imagery is selected, make it carry narrative meaning, crop it around the
composition, and keep text away from visual or typographic clutter. Read
`references/surface-modes.md` and `references/visual-engines.md` for the full
mode and engine guidance.

## Copy

- Write in product language, not design commentary.
- Let the headline carry the meaning.
- Supporting copy should usually be one short sentence.
- Cut repetition between sections.
- Do not include prompt language or design commentary in the UI.
- Give every section one responsibility: explain, prove, deepen, or convert.

If deleting 30 percent of the copy improves the page, keep deleting.

## Utility Copy For Product UI

When the work is a dashboard, app surface, admin tool, or operational workspace, default to utility copy over marketing copy.

- Prioritize orientation, status, and action over promise, mood, or brand voice.
- Start with the working surface itself: KPIs, charts, filters, tables, status, or task context. Do not introduce a hero section unless the user explicitly asks for one.
- Section headings should say what the area is or what the user can do there.
- Good: `Selected KPIs`, `Plan status`, `Search metrics`, `Top segments`, `Last sync`
- Avoid aspirational hero lines, metaphors, campaign-style language, and executive-summary banners on product surfaces unless specifically requested.
- Supporting text should explain scope, behavior, freshness, or decision value in one sentence.
- If a sentence could appear in a homepage hero or ad, rewrite it until it sounds like product UI.
- If a section does not help someone operate, monitor, or decide, remove it.
- Litmus check: if an operator scans only headings, labels, and numbers, can they understand the page immediately?

## Motion

Use motion to create presence and hierarchy, not noise.

Choose only the motions the brief and surface can justify. A visually led
landing page may use several coordinated motions; a routine product surface may
need one transition or none.

Possible roles include:

- one entrance sequence in the hero
- one scroll-linked, sticky, or depth effect
- one hover, reveal, or layout transition that sharpens affordance

Use the existing project motion stack. Prefer CSS for simple state changes and,
when a React motion dependency is already installed or explicitly approved,
verify its current package and framework API before use. Motion for React is
appropriate for:

- section reveals
- shared layout transitions
- scroll-linked opacity, translate, or scale shifts
- sticky storytelling
- carousels that advance narrative rather than filling space
- menus, drawers, and modal presence effects

Motion rules:

- observable when it is part of the intended experience
- smooth on mobile
- fast and restrained
- consistent across the page
- removed if ornamental only
- non-essential transform, parallax, or autoplay behavior is disabled or replaced when the user prefers reduced motion

## Guardrails

Accepted product behavior, accessibility constraints, and an existing design
system take precedence over the aesthetic defaults below.

- No cards by default.
- No hero cards by default.
- No boxed or center-column hero when the brief calls for full bleed.
- No more than one dominant idea per section.
- No section should need many tiny UI devices to explain itself.
- No headline should overpower the brand on branded pages.
- No filler copy.
- No split-screen hero unless text sits on a calm, unified side.
- No more than two typefaces without a clear reason.
- No more than one accent color unless the product already has a strong system.
- No generic AI-slop styling: safe default fonts, generic purple-on-white gradients, predictable SaaS block stacks, or interchangeable component soup.

## Reject These Failures

- Generic SaaS card grid as the first impression
- Beautiful image with weak brand presence
- Strong headline with no clear action
- Busy imagery behind text
- Sections that repeat the same mood statement
- Carousel with no narrative purpose
- App UI made of stacked cards instead of layout
- “Creative” styling that breaks the existing design system or framework conventions

## Final Review Loop

Before finishing the requested deliverable, verify:

- first-screen hierarchy is obvious
- each section has one dominant idea
- card use is necessary rather than habitual
- copy is compressed to the shortest useful version
- motion improves meaning, hierarchy, or affordance
- desktop and mobile viewport composition both hold up
- contrast, tap targets, focus states, and reduced-motion behavior are acceptable

For a runtime implementation, these checks must come from the current rendered
interface at representative viewports and relevant states. If rendered checks
cannot run, report `implemented-not-verified`; do not imply runtime completion.
For strategy-only or design-artifact work, report the corresponding scoped
status and the runtime evidence still outstanding.
