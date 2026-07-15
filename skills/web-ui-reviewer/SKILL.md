---
name: web-ui-reviewer
description: Review web UI code and rendered states against project requirements
  and Web Interface Guidelines. Use for UI/UX, accessibility, design, content,
  form, or frontend-performance audits that need scoped findings and evidence
  limits; not implementation or conformance certification.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f8df6779ce0bdc511e1a74889651e30303a0e91de081e297eda953fbeaf42bb4
---

# web-ui-reviewer

## Start here

1. Identify the exact review claim, consumer, supplied UI evidence, and authoritative project or design-system rules.
2. Read the required Web Interface Guidelines reference before reviewing; treat it as a heuristic baseline, not a conformance standard.
3. Match code, browser, screenshot, accessibility, and performance evidence to the claim; report missing evidence instead of widening the conclusion.
4. Keep the review read-only and hand implementation, formal code-review, browser collection, and security decisions to their owning skills.

## When to use this skill

- Review web UI code, diffs, screenshots, or rendered states for actionable interface findings.
- Audit accessibility risks, interaction behavior, responsive presentation, forms, content, visual consistency, or frontend performance evidence.
- Provide a scoped UI-domain assessment inside a broader code or product review.

## When NOT to use this skill

- The task is not a web UI, UX, accessibility, design, typography, form, content handling, or frontend performance review.
- The task is implementation work rather than review; use the relevant frontend or framework skill.
- The task is a security-first audit; use security-reviewer.
- The task requires formal WCAG, legal, assistive-technology, or performance certification; use the responsible specialist and treat this skill as supporting review only.

## Capability and anti-claims

Review HTML, CSS, JavaScript, framework code, screenshots, and rendered web states to produce scoped UI findings and handoffs. This skill does not implement fixes, certify WCAG or legal conformance, prove performance without measurement, or prove visual and interaction behavior from code alone.

## Inputs and authority

- Accept code, diffs, file patterns, screenshots, design artifacts, URLs, browser evidence, and explicit product or design-system requirements. Use the evidence already supplied instead of requiring files when a snippet or rendered artifact is the intended scope.
- For accessibility and browser behavior, use observed behavior and applicable platform semantics; project convention does not excuse broken keyboard, focus, naming, or zoom behavior.
- For visual, copy, navigation-state, and design-system preferences, require accepted project, product, or design authority before calling a deviation a defect. Without that authority, omit it or label it as a non-binding suggestion.
- Use `references/web-interface-guidelines.md` as the portable heuristic baseline. If current retrieval is available, the canonical upstream is `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`; report the upstream revision or retrieval date and do not silently replace the local baseline.

## Evidence rules

- Code inspection supports code-level semantic findings and named risks. It does not establish spacing, responsive layout, overlays, state transitions, keyboard operation, assistive-technology behavior, or perceived performance unless those behaviors were observed with an appropriate tool.
- Current browser or design-tool evidence supports only the states, viewport sizes, themes, and interactions actually inspected. Screenshots do not prove keyboard, accessibility-tree, network, or backend behavior.
- Performance findings require measured or directly observed impact. Static patterns such as a large list, controlled input, dependency, preload, or preconnect are validation risks until scale and measurements support a defect.
- Tests, snapshots, linters, and checklist matches prove only their exercised surface. State any requested states or evidence that remain unassessed.

## Output contract

Start with one status:

- `findings` — at least one defect is supported by the reviewed evidence and authority.
- `no-material-findings` — no material defect was found and the evidence is sufficient for the explicitly bounded claim.
- `limited` — useful review was possible, but missing evidence or authority prevents `no-material-findings` for the requested claim.
- `blocked` — the supplied inputs do not support a defensible review.

Then report:

1. **Review basis** — requested claim, files or artifacts, states and viewports, project authority, browser or measurement evidence, and any live guideline revision used.
2. **Findings** — group by file or artifact using terse `file:line - finding` entries. Include the evidence-dependent qualifier or short fix hint only when needed.
3. **Coverage limits and handoffs** — name unassessed behavior and the owner or evidence required next.

For a clean file inside a partial review, use `✓ no code-level findings in reviewed scope`, never bare `✓ pass`. Keep the result brief, but do not omit the review basis or coverage limits to satisfy brevity.

## Tools

- Use `rg` for file discovery and text search when available; otherwise use `git grep`, `grep`, or `find`.
- Use an available browser or design tool when the claim includes rendered, responsive, focus, overlay, loading, empty, or error states. If the required evidence cannot be collected safely, return `limited` and name the gap.

## Workflow stages

### Workflow stage: Establish the review basis

Bound the requested claim to authoritative rules and available evidence.

1. Record the requested claim, consumer, files or states in scope, and supplied code, diff, URL, screenshot, browser, design-system, or performance evidence.
2. Separate platform and accessibility behavior from product preferences; require accepted project authority before reporting a preference as a defect.
3. Select the strongest honest status the evidence could support before beginning the review.

Validation:

- The review basis names its authority, evidence, and unassessed scope without implying broader readiness.

### Workflow stage: Review observable UI behavior

Produce supported findings without converting heuristics or missing evidence into defects.

1. Inspect code for directly observable semantics and risk patterns; use current rendered evidence for visual, responsive, overlay, loading, empty, error, focus, and interaction claims.
2. Classify each item as a supported defect, a risk needing named validation, or a non-binding preference; report only supported defects as findings.
3. Use measurements for performance conclusions and browser or design-tool evidence for visual conclusions; otherwise mark the area not assessed.

Validation:

- Every finding identifies the evidence and authority that make it actionable.
- Static analysis, screenshots, tests, or checklists are not presented as proof beyond what they observed.

### Workflow stage: Report and hand off

Return a concise result that the next owner can act on without mistaking partial coverage for approval.

1. Choose findings, no-material-findings, limited, or blocked according to the output contract.
2. Group findings by file or artifact, then state reviewed evidence, coverage limits, unassessed states, and required handoffs.
3. Keep remediation as a fix hint unless the user separately authorizes implementation.

Validation:

- No-material-findings appears only when evidence is sufficient for the explicitly bounded claim.
- Limited and blocked results name the missing evidence or authority needed to strengthen the result.

## Interop priority

- **formal diff scope, finding severity, merge guidance, and overall code-review verdict:** code-reviewer. web-ui-reviewer supplies UI-domain findings; code-reviewer owns the formal code-review process and merge conclusion.
- **navigating a live UI, collecting current screenshots, exercising interactions, and recording viewport or state evidence:** agent-browser or playwright. Browser skills collect runtime evidence; web-ui-reviewer decides what UI evidence is required and interprets it within the bounded review.
- **visual direction, component implementation, framework behavior, and test changes:** frontend-design and the relevant frontend or framework skill. web-ui-reviewer remains read-only and hands supported findings to the implementation owner.
- **API or server authorization, vulnerability severity, secrets, and security controls:** security-reviewer. web-ui-reviewer may flag misleading UI or unsafe user-facing error behavior but cannot establish backend security.

## Gotchas

- **high** — Do not return no-material-findings from code inspection alone when visual, responsive, focus, overlay, loading, empty, or error behavior is part of the claim.
- **high** — Flag design-system drift only when an accepted design system or project convention establishes the expected component, token, or pattern; otherwise label the observation as a non-binding preference.
- **high** — Do not turn list size, dependency presence, preload, preconnect, or render patterns into performance defects without scale or measurement evidence; report a validation risk instead.

## Policies

### Result status
Use findings when at least one defect is supported; no-material-findings only when evidence is sufficient for the bounded claim; limited when useful review occurred but missing evidence prevents that conclusion; blocked when no defensible review can be performed.

### Current screenshot evidence
Require current browser or design-tool evidence for affected desktop and mobile states, including error, loading, empty, drawer, and modal states when those states are part of the requested claim; screenshots alone do not prove keyboard, assistive-technology, or backend behavior.

### Guidance freshness and precedence
The portable reference is the reproducible baseline. A live upstream overlay may add non-conflicting guidance only when its URL and revision or retrieval date are reported; it never creates product authority or silently overrides project requirements.

## Required active references
- [Web Interface Guidelines](references/web-interface-guidelines.md) — Read this before every review; use its classification and the sections relevant to the requested UI scope.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory web-ui-reviewer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/forward-tests/*`
- Supporting glob: `docs/logs/*`
