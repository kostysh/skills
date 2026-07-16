# Service-backed CLI candidate

- Package: `@acme/jobs-cli`
- Build: Vite succeeds
- Tests: node:test unit and process suites succeed
- Service adapter tests: use a local stub returning canned JSON
- Installed command checks: `jobs --help` and `jobs --json doctor` exit 0
- `doctor` reports a configured sandbox token but does not call the jobs API
- Representative user job: `jobs download-log job-42`
- Representative job through the installed command: not run
- Real, sandbox, or authoritative contract-conformant jobs API result: not observed
