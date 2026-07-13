# Accessibility for React SPA

Use this reference for implementation guidance. Use `web-ui-reviewer` for a
formal accessibility or UX verdict and `react-components-engineer` when a
reusable composite component itself is the primary artifact.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project composition, styling, and verification wiring.

## Native-first rule

Prefer semantic HTML and an existing, accessibility-reviewed project component
before implementing ARIA behavior yourself:

- use `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `<details>`,
  `<dialog>`, headings, lists, tables, and landmarks for their native purposes;
- keep visible labels associated with controls;
- do not add an ARIA role that conflicts with native semantics;
- do not treat ARIA attributes as behavior: custom widgets still need the full
  keyboard, focus, selection, and announcement model.

Do not copy a shortened menu, listbox, combobox, tabs, or dialog example into
production. If native HTML or the existing project component cannot satisfy the
accepted interaction contract, route reusable component hardening to
`react-components-engineer` and implement the complete applicable WAI-ARIA APG
pattern, including every required state and keyboard behavior.

## Names, descriptions, and state

```tsx
function PasswordField({ error }: { error?: string }) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>Password</label>
      <input
        id={id}
        type="password"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
      />
      <p id={helpId}>Use at least eight characters.</p>
      {error ? (
        <p id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- Prefer a visible label; use `aria-label` only when visible text cannot provide
  the accessible name.
- Use `aria-labelledby` to reference visible naming content and
  `aria-describedby` for supplementary help or error text.
- Set `aria-invalid` only when the current value is known to be invalid.
- Use `role="alert"` for newly rendered urgent errors and `role="status"` or a
  polite live region for non-urgent status. Do not repeatedly announce static
  content on every render.
- Hide decorative images with `alt=""`; provide concise, purpose-oriented alt
  text for informative images.

## Keyboard and focus contract

Every interaction available to a pointer must have a keyboard path. Preserve a
visible focus indicator and logical tab order; do not use positive `tabIndex`.

For composite widgets, implement the whole selected APG pattern rather than a
generic Arrow/Enter/Escape switch. At minimum, the implementation and tests must
cover:

- where DOM focus enters and leaves the widget;
- roving `tabIndex` or `aria-activedescendant`, when the pattern requires it;
- the difference between focus and selection;
- all required arrow, Home/End, Enter/Space, Escape, and type-ahead behavior;
- disabled items and dynamic option updates;
- correct accessible name, role, state, and relationship attributes.

Authoritative patterns:

- <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- <https://www.w3.org/WAI/ARIA/apg/patterns/listbox/>
- <https://www.w3.org/WAI/ARIA/apg/patterns/combobox/>
- <https://www.w3.org/WAI/ARIA/apg/patterns/tabs/>

## Dialog contract

Prefer the existing project dialog primitive when it already owns focus and
inertness correctly. A custom modal is complete only when it:

- has `role="dialog"` or equivalent native semantics, `aria-modal="true"`, and
  an accessible name;
- moves focus to an appropriate element inside on open;
- keeps Tab and Shift+Tab within the modal while it is open;
- makes background content non-interactive for pointer, keyboard, and assistive
  technology users;
- supports Escape when dismissal is allowed;
- includes a visible close or cancel control;
- restores focus to the invoking element or the next logical workflow target;
- handles nested dialogs, removed triggers, scroll locking, and cleanup without
  leaving the page inert.

A `role="dialog"`, a screenshot, or focus on the container alone does not prove
this behavior.

## Route and async behavior

- Give each route a unique page title and a stable heading hierarchy.
- After client navigation, move focus only according to an accepted navigation
  policy; avoid surprising focus changes during background refresh.
- Preserve already rendered content during TanStack Query background refetch and
  announce only meaningful status changes.
- Loading UI must expose busy state without trapping focus. Skeletons are a
  visual option, not an accessibility requirement; respect reduced-motion
  preferences and avoid layout shifts.
- Error and empty states need actionable text and a keyboard-reachable recovery
  path.

## Verification

Use semantic Testing Library queries and real keyboard sequences for local
coverage. For material flows, combine automated checks with Playwright and real
browser inspection of focus, keyboard operation, announcements, zoom/reflow,
and reduced motion.

Automated rules, roles, snapshots, and `getByRole` assertions do not by
themselves prove screen-reader usability or the complete APG interaction model.
Report the tested browsers, scenarios, assistive-technology coverage when any,
and remaining evidence limits.
