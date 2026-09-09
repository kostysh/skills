# Edge Security (platform features)

Use this reference only to integrate an accepted edge-security decision with Hono routes and middleware. `security-reviewer` or the project security/platform owner decides whether to use WAF rules, API Shield/endpoint discovery, edge schema validation, mTLS, or an equivalent control.

- Keep route paths, methods, schemas, and admission metadata aligned with the selected edge control.
- Do not treat edge enforcement as evidence that Hono authorization, runtime validation, or direct-origin protection is correct.
- Verify the real edge-to-Hono boundary when the completion claim depends on deployed enforcement.
