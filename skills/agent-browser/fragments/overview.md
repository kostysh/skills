## Quick start

Use the guidance shipped by the installed CLI instead of a copied command
reference:

```bash
agent-browser --version
agent-browser skills get core --full
```

The stable interaction loop is:

```bash
agent-browser open <url>
agent-browser snapshot -i
# interact with refs from the current snapshot
# wait for the expected result
agent-browser snapshot -i
agent-browser get url
```

Refs become stale after navigation and material page changes, so snapshot again
before reusing them. If bundled guidance is unavailable, check the root and
relevant subcommand help.

## What proves completion

- Navigation or interaction: the requested final URL or visible state is
  observed.
- Extraction: the requested fields and scope are checked, including pagination
  or lazy loading; otherwise report the extracted subset as partial.
- SPA or integration behavior: state whether relevant network calls were real or
  intercepted. Mocks prove local UI behavior only.
- Diagnosis: browser requests, responses, console, and page errors are evidence;
  another domain owner must establish backend or provider root cause.

A screenshot, snapshot, trace, successful command, or healthy runtime is useful
evidence only when it supports the requested result. It is not completion by
itself.

## Setup boundary

Agent-browser owns its browser runtime. Do not install Playwright packages in the
target project to prepare it. Use the installed CLI's diagnostic and install
guidance, or report a blocked handoff when environment changes are not in scope.

Do not put secrets in command history or reports. Use the installed CLI's
authentication guidance and treat saved state, downloads, screenshots, traces,
and recordings as potentially sensitive.
