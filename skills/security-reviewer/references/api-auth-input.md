# API, Auth, and Input Checks

Use this file for app code, handlers, API routes, forms, and server-side validation flows.

## Input and Injection

Check:

- user input reaching SQL, shell, template, HTML, headers, file paths, or dynamic code
- schema validation that parses but does not constrain dangerous fields
- raw object spreading or unchecked patch updates into privileged models
- file upload paths, MIME trust, storage keys, and content-type assumptions

High-signal classes:

- SQL, command, path, header, and template injection
- stored or reflected XSS
- mass assignment or unsafe object merge
- unsafe deserialization

## Authentication

Check:

- token or session presence vs actual identity verification
- fallback paths that silently treat failures as guest or authenticated
- refresh or recovery flows that widen account takeover surface
- trust in unsigned cookies, client claims, or unverified headers

## Authorization

Check:

- object-level access control, not just route-level authentication
- cross-tenant access paths
- admin or support paths with weak guards
- server-side filtering that is not backed by a real permission boundary

## State-Changing Requests

Check:

- CSRF defenses for cookie-authenticated flows
- replay handling for idempotent-looking endpoints
- rate limits or abuse controls on expensive or privileged actions

## Safe-by-Default Patterns

Usually safe unless protections are bypassed:

- framework auto-escaping in templates
- parameterized ORM usage
- validated enums or allowlists driving control flow

Flag only when you can show the protection is absent, disabled, or escaped around.
