# Raw blind sibling/action-binding output

SHA-256 of the original result: `0ce1da7df2f7c9a1d3d169d9c220dd8fdf7bb760f16308626ae49270414e89c6`. The text below preserves the full content with Markdown trailing-space line breaks normalized to blank lines for repository whitespace checks.

The imported-runbook path lets attacker-authored text trigger destructive, cross-tenant project deletion through a privileged service credential.

Review basis: targeted review of the exact supplied `README.md` (`520bd5f…afa2e`) and `projects.ts` (`0347552…e4cc`); research scope was identical. Threat actor: malicious runbook publisher who persuades a signed-in user with `projects:delete` to import it.

[high] `projects.ts:33` Imported deletion bypasses tenant authorization

Confidence: HIGH

Impact: Given a project ID, the runbook publisher can cause the importing user to delete a project belonging to another tenant.

Evidence: Runbook text is attacker-controlled (`README.md:8-10`), its `DELETE_PROJECT` value reaches `deleteWithServiceCredential` (`projects.ts:28-41`), and that credential can delete any tenant’s project (`README.md:5-6`). The UI sibling path loads the project and enforces `project.tenantId === user.tenantId` (`projects.ts:20-25`); the imported path performs only the generic permission check.

Next: Enforce tenant ownership at the shared privileged deletion boundary and avoid unrestricted service credentials for user-scoped deletion. Regression case: a permitted tenant-A user importing a tenant-B project ID must not invoke deletion. Production blast radius and project-ID discoverability remain runtime/infrastructure evidence gaps, but they do not remove the authorization defect.

[medium] `projects.ts:28` Untrusted instructions are not bound to the user’s destructive intent

Confidence: HIGH

Impact: A malicious runbook can cause a permitted user to delete a selected project merely by importing the content, including after tenant authorization is repaired.

Evidence: The product explicitly has no separate confirmation or action allow-list (`README.md:8-10`); the marker is parsed directly into the service-credential deletion call (`projects.ts:28-41`). Generic permission to delete projects does not establish approval of this exact target and action.

Next: Require a trusted confirmation or policy gate bound to the exact action and project ID before deletion. Regression case: importing a runbook containing `DELETE_PROJECT:<id>` must produce no deletion until the user explicitly approves that exact operation.

Coverage: UI and imported sibling paths, permission and tenant checks, attacker-controlled parsing, privileged deletion, service-credential data access, and agent intent/action binding. No raw SQL, REST/PostgREST, SDK query builders, RPC, storage, RLS, or other data paths were supplied.

Result: 2 confirmed findings in reviewed scope.

Evidence limits: Source-only review; no target code was executed. Implementations of the declared data functions, runtime controls, audit handling, and deployment configuration were outside the supplied scope. This is not penetration testing, exhaustive scanning, or whole-system assurance.

Next owner: The implementation/domain owner should remediate; `security-reviewer` should re-audit the new stable snapshot. Any merge recommendation belongs to `code-reviewer`.
