---
name: frontend-design
description: |-
  Use when the task asks for a visually strong landing page, website, app UI,
  dashboard, prototype, demo UI, poster-like web artifact, or a meaningful
  visual upgrade to an existing frontend surface. This skill enforces strong
  hierarchy, restrained composition, purposeful imagery, expressive typography,
  tasteful motion, and system-aware polish while avoiding generic cards, weak
  branding, and AI-slop aesthetics.
metadata:
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f14deed06d60b3a4d06253c8a0ee28c0184dcff1de3d73363134314ce2833238
---

# frontend-design

## Start here

1. Confirm the task matches frontend-design's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Visually strong landing pages, marketing websites, hero sections, or branded surfaces
- Product UI, dashboards, workspaces, admin surfaces, or app redesigns that need better hierarchy and visual discipline
- Beautifying or restyling an existing React, HTML/CSS, or component-based UI
- Prototypes, demo UI, and secondary web formats such as poster-like artifacts or game UI mock surfaces

## When NOT to use this skill

- Pure frontend architecture, state management, routing, or data-fetching work with no design direction requirement
- Pure component API lookup or design-system component selection; use `shadcn` for that
- Reusable React component correctness/hardening work where the core problem is rendering behavior, SSR, portals, or future React semantics; use `react-components-engineer`

## Overview

Use this skill when the quality of the work depends on art direction, hierarchy, restraint, imagery, typography, and motion rather than component count alone.

Goal: ship interfaces that feel deliberate, premium, current, and memorable. Default toward one big idea, strong hierarchy, sparse copy, rigorous spacing, and a small number of meaningful motions.

## Skill Interop

- Use `frontend-design` for visual direction, hierarchy, composition, imagery, motion, typography, copy compression, and atmosphere
- Use `react-spa-engineer` for React SPA architecture, state, routing, data, testing, and accessibility implementation patterns
- Use `react-components-engineer` for reusable component hardening and correctness
- Use `shadcn` when working inside the primary UI system; preserve the existing design system and keep creativity inside its tokens, patterns, and components
- If a project already has a design system or UI framework, do not introduce a parallel ad-hoc styling system without explicit approval

## Working Model

Before building, write five things:

- `surface mode`: `brand/landing`, `product/app`, `system-constrained UI`, or `secondary format`
- `visual thesis`: one sentence describing mood, material, energy, and the dominant visual idea
- `content plan`: hero, support, detail, final CTA for marketing work; or the working surface, navigation, secondary context, and action focus for product UI
- `interaction thesis`: 2-3 motion ideas that materially improve presence, hierarchy, or affordance
- `constraint guardrails`: framework, performance, accessibility, responsive, and design-system constraints

Each section gets one job, one dominant visual idea, and one primary takeaway or action.

Load references only when needed:

- `references/surface-modes.md` for mode-specific application rules
- `references/visual-engines.md` for choosing an `image-led`, `type-led`, `grid-led`, `product-led`, or `data-led` direction
- `references/anti-patterns.md` for common failure patterns and anti-AI-slop guidance
- `references/interop.md` for boundaries with React and shadcn skills

## Beautiful Defaults

- Start with composition, not components.
- Prefer a full-bleed hero or full-canvas visual anchor.
- Make the brand or product name the loudest text.
- Keep copy short enough to scan in seconds.
- Use whitespace, alignment, scale, cropping, and contrast before adding chrome.
- Limit the system: two typefaces max, one accent color by default.
- Use expressive typography when the brief allows it; avoid safe, overused default choices that flatten the page.
- Default to cardless layouts. Use sections, columns, dividers, lists, and media blocks instead.
- Treat the first viewport as a poster, not a document.
- Build atmosphere with backgrounds, texture, depth, overlays, or pattern only when they reinforce hierarchy and mood.
- Avoid AI-slop aesthetics: generic SaaS card stacks, weak branding, filler gradients, predictable component mosaics, and cookie-cutter visual language.

## Landing Pages

Default sequence:

1. Hero: brand or product, promise, CTA, and one dominant visual
2. Support: one concrete feature, offer, or proof point
3. Detail: atmosphere, workflow, product depth, or story
4. Final CTA: convert, start, visit, or contact

Hero rules:

- One composition only.
- Use a full-bleed image or a dominant visual plane.
- On branded landing pages, the hero itself should run edge-to-edge. Do not inherit shared gutters, framed containers, or a global max-width for the hero shell; constrain only the inner text and actions.
- Brand first, headline second, body third, CTA fourth.
- No hero cards, stat strips, logo clouds, pill soup, or floating dashboards by default.
- Keep headlines to roughly 2-3 lines on desktop and readable in one glance on mobile.
- Keep the text column narrow and anchored to a calm area of the image or composition.
- All text over imagery must keep strong contrast and clear tap targets.

If the first viewport still works after removing the image, the image is too weak. If the brand disappears after hiding the nav, the hierarchy is too weak.

Viewport budget:

- If the first screen uses a sticky or fixed header, that header counts against the hero. Header and hero content together must fit within the initial viewport on common desktop and mobile sizes.
- When using `100vh` or `100svh` heroes, subtract persistent chrome with `calc(100svh - header-height)` or overlay the header instead of stacking it in normal flow.

## Apps

Default to restrained product UI:

- calm surface hierarchy
- strong typography and spacing
- few colors
- dense but readable information
- minimal chrome
- cards only when the card is the interaction

For app UI, organize around:

- primary workspace
- navigation
- secondary context or inspector
- one clear accent for action or state

Avoid:

- dashboard-card mosaics
- thick borders on every region
- decorative gradients behind routine product UI
- multiple competing accent colors
- ornamental icons that do not improve scanning

If a panel can become plain layout without losing meaning, remove the card treatment.

For product and app work, utility copy and operational clarity beat marketing voice unless the user explicitly asks otherwise.

## Imagery

Imagery must do narrative work.

- Use at least one strong, real-looking image for brands, venues, editorial pages, and lifestyle products.
- Prefer in-situ photography over abstract gradients or fake 3D objects when the brief benefits from realism.
- Choose or crop images with a stable tonal area for text.
- Do not use images with embedded signage, logos, or typographic clutter fighting the UI.
- Do not generate images with built-in UI frames, splits, cards, or panels.
- If multiple moments are needed, use multiple images, not one collage.

The first viewport needs a real visual anchor. Decorative texture is not enough.

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

Ship at least 2-3 intentional motions for visually led work:

- one entrance sequence in the hero
- one scroll-linked, sticky, or depth effect
- one hover, reveal, or layout transition that sharpens affordance

Prefer Framer Motion when available for:

- section reveals
- shared layout transitions
- scroll-linked opacity, translate, or scale shifts
- sticky storytelling
- carousels that advance narrative rather than filling space
- menus, drawers, and modal presence effects

Motion rules:

- noticeable in a quick recording
- smooth on mobile
- fast and restrained
- consistent across the page
- removed if ornamental only

## Hard Rules

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

## Litmus Checks

- Is the brand or product unmistakable in the first screen?
- Is there one strong visual anchor?
- Can the page be understood by scanning headlines only?
- Does each section have one job?
- Are cards actually necessary?
- Does motion improve hierarchy or atmosphere?
- Would the design still feel premium if all decorative shadows were removed?

## Final Review Loop

Before finishing, verify:

- first-screen hierarchy is obvious
- each section has one dominant idea
- card use is necessary rather than habitual
- copy is compressed to the shortest useful version
- motion improves meaning, hierarchy, or affordance
- desktop and mobile viewport composition both hold up
- contrast, tap targets, focus states, and reduced-motion behavior are acceptable

## Workflow stages

### Workflow stage: Apply frontend-design guidance

Apply the preserved frontend-design guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Anti Patterns](references/anti-patterns.md) — Read this when you need common failure patterns and anti-AI-slop guidance.
- [Interop](references/interop.md) — Read this when you need boundaries with React and shadcn skills.
- [Surface Modes](references/surface-modes.md) — Read this when you need mode-specific application rules.
- [Visual Engines](references/visual-engines.md) — Read this when you need choosing an image-led, type-led, grid-led, product-led, or data-led direction.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory frontend-design guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
