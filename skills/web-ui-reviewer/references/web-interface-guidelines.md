# Web Interface Guidelines

Portable heuristic baseline, synchronized with the upstream `command.md` at revision `4e799d45c17aec1498c269287a83b9dba22b966b` and extended with locally maintained recovery, error-boundary, and native-platform checks. The upstream list is living and non-exhaustive; this reference does not establish WCAG certification or product authority.

## Guidance classification

- Treat keyboard access, focus visibility, semantic naming, zoom, and directly observed broken behavior as findings when the reviewed evidence supports them.
- Treat performance, URL-state, preload, preconnect, virtualization, layout, and similar implementation guidance as contextual heuristics. Require relevant scale, behavior, or measurement before calling them defects.
- Treat copy voice, capitalization, terminology, visual style, and design-system choices as product preferences. Report them as findings only when an accepted project, product, or design-system source adopts them.
- When a rule conflicts with explicit project authority, preserve platform and accessibility invariants, but let accepted project authority decide product preferences. State unresolved conflicts rather than inventing a winner.

## Navigation

- [Peer-view and functional coverage](#peer-view-and-functional-coverage)
- [Accessibility and native controls](#accessibility)
- [Forms and one-time codes](#forms)
- [Motion, typography, content, and images](#animation)
- [Performance and navigation state](#performance)
- [Errors, interaction, layout, and themes](#error-boundaries)
- [Locale, hydration, and interactive states](#locale--i18n)
- [Product copy heuristics](#product-copy-heuristics)
- [Anti-patterns and output](#anti-patterns-flag-these)

## Rules

### Peer-view and Functional Coverage

- For a module or journey completeness claim, inventory relevant peer views and
  capabilities established by accepted product, UX, or design-system sources
  before accepting a polished overview as ready.
- Record each applicable capability as reuse, justified divergence, or `N/A`
  with its authority. Search, detail, and history are named falsifiers, not
  universal requirements.
- Distinguish accepted behavior, reusable library patterns, the module mockup,
  and the runtime representation. A mockup or runtime screenshot is evidence of
  that representation, not automatic authority to erase a required capability.
- Report an absent capability as a finding only when the accepted source or
  relevant peer evidence makes it required. Treat unsupported parity as a
  non-binding suggestion and honor an authoritative `N/A`.
- Do not let visual polish, a component inventory, or one overview screenshot
  support `no-material-findings` when the bounded completeness claim includes
  an unreviewed or missing required view.

### Accessibility

- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Native interactive elements use their built-in keyboard behavior; custom or non-native controls must implement the expected keyboard interaction without duplicating native handlers
- `<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before ARIA
- Headings hierarchical `<h1>`–`<h6>`; include skip link for main content
- `scroll-margin-top` on heading anchors

### Native Platform Fit

- Prefer native HTML controls, CSS, and browser APIs before custom widgets, JavaScript layout engines, scroll managers, or UI dependencies
- Flag a custom control when it replaces a native element without preserving keyboard behavior, labels, focus, autofill, form submit, link navigation, or browser zoom
- Do not flag an existing design-system component just for being abstracted if it preserves native semantics and is the repo standard

### Focus States

- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` / `outline: none` without focus replacement
- Use `:focus-visible` over `:focus` (avoid focus ring on click)
- Group focus with `:focus-within` for compound controls

### Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails, codes, usernames (`spellCheck={false}`)
- Checkboxes/radios: label + control share single hit target (no dead zones)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- Use the correct `autocomplete` purpose token for personal or authentication data; for unrelated fields that trigger password managers incorrectly, use a specific non-auth token or `autocomplete="off"` only when appropriate
- Warn before navigation with unsaved changes (`beforeunload` or router guard)
- Mutation forms preserve entered values on server/network error and clear only after success
- Pending submit buttons expose `aria-busy="true"` while the request is active
- Repeated field/error ids are stable per component instance; use `useId` or equivalent, not hardcoded ids reused across rows/forms

### OTP and One-Time Code UI

- Failed submit does not clear entered digits; preserve them so the user can correct or retry
- Visible OTP digits are acceptable for one-time codes unless the product explicitly requires masking
- Provide cancel/back and resend actions when the backend contract supports them
- Show cooldown, expiry, and resend-disabled states when those states exist server-side
- Do not block paste for OTP codes

### Animation

- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all`—list properties explicitly
- Set correct `transform-origin`
- SVG: transforms on `<g>` wrapper with `transform-box: fill-box; transform-origin: center`
- Animations interruptible—respond to user input mid-animation

### Typography

- `…` not `...`
- Curly quotes `“` `”` not straight `"`
- Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` for number columns/comparisons
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

### Content Handling

- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Handle empty states—don't render broken UI for empty strings/arrays
- User-generated content: anticipate short, average, and very long inputs

### Images

- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images may use `fetchpriority="high"` or the framework equivalent when priority is established; do not mark every above-fold image high priority

### Performance

- For lists with demonstrated scale or rendering cost, consider virtualization or `content-visibility: auto`; do not infer a defect from item count alone
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
- Batch DOM reads/writes; avoid interleaving
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
- Add `<link rel="preconnect">` only for known critical cross-origin connections where measurement or the loading path supports it
- Preload only fonts required for critical text, and use `font-display: swap`; unnecessary preloads compete with critical resources

### Navigation & State

- Put shareable, navigable, or refresh-persistent state such as filters, tabs, and pagination in the URL when the product behavior requires those properties
- Links use `<a>`/`<Link>` (Cmd/Ctrl+click, middle-click support)
- Deep-link user-meaningful state; do not infer that every local `useState` value belongs in the URL
- Destructive actions need confirmation modal or undo window—never immediate
- Hiding admin navigation for non-admin users is UX-only. Flag any review claim that treats hidden nav as API authorization; authoritative authorization must be checked separately in API/server review.

### Error Boundaries

- Error boundaries provide a clear recovery action such as retry, reload, go back, or contact support with a safe reference id
- User-facing error copy avoids stack traces, process details, technical internals, and "report JSON"
- Safe error reporting is explicit: no raw props, request/response bodies, headers, cookies, tokens, OTPs, CSRF tokens, or raw identity payloads

### Touch & Interaction

- `touch-action: manipulation` (prevents double-tap zoom delay)
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals/drawers/sheets
- During drag: disable text selection, `inert` on dragged elements
- `autoFocus` sparingly—desktop only, single primary input; avoid on mobile

### Safe Areas & Layout

- Full-bleed layouts need `env(safe-area-inset-*)` for notches
- Avoid unwanted scrollbars: `overflow-x-hidden` on containers, fix content overflow
- Flex/grid over JS measurement for layout

### Dark Mode & Theming

- `color-scheme: dark` on `<html>` for dark themes (fixes scrollbar, inputs)
- `<meta name="theme-color">` matches page background
- Native `<select>`: explicit `background-color` and `color` (Windows dark mode)

### Locale & i18n

- Dates/times: use `Intl.DateTimeFormat` not hardcoded formats
- Numbers/currency: use `Intl.NumberFormat` not hardcoded formats
- Detect language via `Accept-Language` / `navigator.languages`, not IP
- Brand names, code tokens, and identifiers: use `translate="no"` when automatic translation would corrupt verbatim content

### Hydration Safety

- Inputs with `value` need `onChange` (or use `defaultValue` for uncontrolled)
- Date/time rendering: guard against hydration mismatch (server vs client)
- `suppressHydrationWarning` only where truly needed

### Hover & Interactive States

- Buttons/links need `hover:` state (visual feedback)
- Interactive states increase contrast: hover/active/focus more prominent than rest

### Product Copy Heuristics

Apply these as findings only when an accepted product or style source adopts them. Without that authority, they are non-binding suggestions rather than defects.

- Active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings/buttons (Chicago style)
- Numerals for counts: "8 deployments" not "eight"
- Specific button labels: "Save API Key" not "Continue"
- Error messages include fix/next step, not just problem
- Second person; avoid first person
- `&` over "and" where space-constrained

### Anti-patterns (flag these)

- `user-scalable=no` or `maximum-scale=1` disabling zoom
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without focus-visible replacement
- Inline `onClick` navigation without `<a>`
- `<div>` or `<span>` with click handlers (should be `<button>`)
- Custom select/dialog/tabs widgets that lose native keyboard or focus behavior
- Images without dimensions
- Lists with measured or clearly demonstrated rendering cost and no suitable containment or virtualization
- Form inputs without labels
- Icon buttons without `aria-label`
- Pending buttons without `aria-busy`
- Reused hardcoded ids for field help/error text
- Mutation forms clearing user input on error
- OTP failures clearing digits with no recovery path
- Hardcoded date/number formats (use `Intl.*`)
- `autoFocus` without clear justification

## Output Format

Begin with one plain-language outcome sentence before formal result terminology. Follow the status, review-basis, coverage-limit, and handoff contract in `SKILL.md`. Group supported findings by file or artifact and use terse `file:line - finding` entries.

For remediation re-audit, report fixed findings, original UI failure states, adjacent regression states, and the stable remediation delta. Name unchanged previously verified states as excluded instead of repeating them; cosmetic edits alone do not close behavioral or accessibility findings.

```text
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:18 - input lacks label
src/Button.tsx:55 - animation missing prefers-reduced-motion
src/Button.tsx:67 - transition: all → list properties

## src/Modal.tsx

src/Modal.tsx:12 - missing overscroll-behavior: contain
src/Modal.tsx:34 - "..." → "…"

## src/Card.tsx

✓ no code-level findings in reviewed scope
```

State issue + location. Skip explanation unless the evidence qualifier or fix is non-obvious. Never use a bare pass to imply unobserved rendered, interaction, accessibility, or performance behavior.
