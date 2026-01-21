# UI Testing with agent-browser

> **Load when:** User asks about UI testing with `agent-browser`, browser automation, or needs deterministic UI E2E flows for web apps.

## What it is (quick)
`agent-browser` is a headless browser automation CLI for AI agents. It exposes commands for navigation, interaction, screenshots, storage, and more, and provides an accessibility-tree snapshot with stable element refs for deterministic actions. It uses a client-daemon architecture (fast Rust CLI + Node daemon running Playwright) for performance and supports multiple sessions.

## Install (CLI)
```bash
npm install -g agent-browser
agent-browser install  # downloads Chromium
```

On Linux, install deps if needed:
```bash
agent-browser install --with-deps
# or: npx playwright install-deps chromium
```
You can also point to a custom browser executable:
```bash
agent-browser --executable-path /path/to/chromium open example.com
# or:
AGENT_BROWSER_EXECUTABLE_PATH=/path/to/chromium agent-browser open example.com
```

## Core workflow (recommended)
1. `agent-browser open <url>`
2. `agent-browser snapshot -i --json` -> parse refs like `@e1`, `@e2`
3. `agent-browser click @e1` / `fill @e2 "text"`
4. Re-snapshot after page changes
5. `agent-browser close`

Why refs: the snapshot returns an accessibility tree with stable refs, so you avoid brittle selectors and can act deterministically.

## Best practices for UI tests
- Prefer UI-level behavior assertions (visible text, enabled/disabled, navigation success).
- Re-snapshot after any navigation, route change, or async UI update.
- Use accessible labels/roles in your app so elements appear clearly in snapshots.
- Keep tests order-agnostic; isolate sessions per test to avoid shared auth/state.
- Use dedicated test accounts and test data; never use production credentials.
- Keep concurrency low for E2E and clean up browser sessions.

## JSON output for deterministic parsing
Use `--json` for machine-readable outputs:
```bash
agent-browser snapshot -i --json
agent-browser get text @e1 --json
agent-browser is visible @e2 --json
```

## Snapshot tuning (reduce noise)
```bash
agent-browser snapshot -i -c -d 5
agent-browser snapshot -s "#main" -i
```
Options like `-i` (interactive), `-c` (compact), `-d` (depth), and `-s` (scope selector) keep snapshots small and actionable.

## Sessions and isolation
`agent-browser` supports multiple isolated browser instances. Use one session per test or per suite to prevent state bleed (`--session` or `AGENT_BROWSER_SESSION`).

## Debugging / visual aid
Use `--headed` to run a visible browser window for local debugging:
```bash
agent-browser open https://example.com --headed
```

You can also stream the viewport via WebSocket for live preview by setting `AGENT_BROWSER_STREAM_PORT` and opening a page:
```bash
AGENT_BROWSER_STREAM_PORT=9223 agent-browser open https://example.com
```
Connect to `ws://localhost:9223` to view frames and send input events.

## Example test flow (pseudo)
```
- open login page
- snapshot -> find "Email" input ref
- fill email/password
- click "Sign in"
- snapshot -> assert dashboard heading is visible
```

## Notes
- Use `agent-browser --help` for the full command list.
- The CLI uses a client/daemon model and persists between commands for speed.
- Chromium is the default engine; Playwright also supports Firefox/WebKit via the daemon.
