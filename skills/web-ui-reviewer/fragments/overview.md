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

Start with one plain-language outcome sentence. Then report one status:

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
