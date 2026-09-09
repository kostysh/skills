Commands and evidence

- Read supplied active react-components-engineer/SKILL.md and references/bulletproof-patterns.md; agent-browser/SKILL.md; fixture README/package.json, Tooltip.js, main.jsx, server.mjs, index.html.
- node -p "require('react/package.json').version + ' / ' + require('react-dom/package.json').version": 19.2.0 / 19.2.0.
- npm run build: exit 0; Vite 7.1.12, 86 modules transformed. Dependency use-client directive warnings; no build errors.
- UI_REV_PORT=43782 npm start: UI_REV_URL=http://127.0.0.1:43782.
- curl --fail http://127.0.0.1:43782/components -o results-baseline-components/ssr.html: exit 0; actual server-rendered main and both buttons present; SSR placeholder absent.
- agent-browser --version: 0.27.3; skills get core --full and --help inspected.
- Initial environment launch attempts failed: default runtime socket directory read-only; Chrome needed --no-sandbox. Used task-local XDG_RUNTIME_DIR and --args --no-sandbox. doctor --offline --quick: 6 pass, 1 stale-session warning, 0 fail.
- python3 check-components.py: final exit 0. Exact commands, inline assertions and browser output: browser-commands.json. Chrome 152.0.7977.82, actual React hydrateRoot with StrictMode from unchanged main.jsx, direct real local HTTP (no interception).
- Earlier browser check iterations: invalid unsupported :has-text selector replaced with semantic locator. Physical pointer remaining over Second caused hover re-entry during DOM changes; moved pointer to h1 before scripted lifecycle sequence. These were check corrections; implementation did not change after first patch.
- Actual browser CLI focus/hover verifies simultaneous tooltips and ref; lifecycle repetition uses DOM focus/blur and synthetic mouse/resize events within actual renderer. Five unmount/remount cycles, then final unmount. Each unmount: listeners=0, wrappers=0, tooltip nodes=0. Each remount: listeners=2. No recoverable hydration errors or page errors.
- Browser session ui-rev-base-components closed by check. Own server terminated separately. No server/API/SPA source edited.

Limits: sampled local browser lifecycle evidence, not heap/GC proof, formal accessibility/security/performance assurance, cross-document or multiple-root verification. No changes to skill sources.
