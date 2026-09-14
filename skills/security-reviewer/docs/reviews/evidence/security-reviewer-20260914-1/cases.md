# Blind forward-test inputs

## Exposure

- Executors: `/root/independent_security_skill_review/blind_sibling_case` и `/root/independent_security_skill_review/blind_calibration_case`.
- `fork_turns: none`; model override: none; reasoning-effort override: none.
- Независимо наблюдаемая runtime model/settings metadata недоступна.
- Included skill surface: `SKILL.md` и девять active `references/*.md` из trial copy.
- Excluded: `skill.yaml`, fragments, tests, compile report, supporting/history, prior diagnoses, rubric, expected findings и reviewer conclusions.
- Follow-up prompts executor не получали.

## Sibling/action-binding case

### Exact dispatch prompt

```text
Act as a fresh execution-sample agent. Use the documentation-only skill package at `/tmp/security-reviewer-forward-VEBp6o/trial-skill` to perform a targeted security review of only `/tmp/security-reviewer-forward-VEBp6o/case-a`. Read `SKILL.md` and every local reference it requires for this task. The case files are the complete supplied review scope. Keep the task read-only: do not edit files, run target-controlled code, contact external systems, or inspect any repository/candidate/history/log outside those two paths. Return the actual terse targeted-review output that you would give the user, including review basis, coverage, evidence limits, and any next owner required by the supplied skill. Do not assess the skill itself.
```

### `README.md`

SHA-256: `520bd5fd9500a6b75877c3ce24ffd2da7b4de08cc0e06b688f8a39825acafa2e`.

```markdown
# Imported instruction automation

Authenticated users can delete projects in their own tenant through the UI. The
application also lets a user import third-party runbooks. An agent reads an
imported runbook and calls `runImportedInstruction` with the signed-in user's
identity. The service credential can delete any tenant's project.

Runbooks are untrusted content: another user can publish one and persuade a
signed-in user to import it. The product has no separate confirmation or
allow-list for tool actions derived from imported runbook text.
```

### `projects.ts`

SHA-256: `03475524dabb3f73c43dde1a29d54804c3fa54197e9eec2c5db2c9a6a524e4cc`.

```ts
export type User = {
  id: string;
  tenantId: string;
  permissions: string[];
};

type Project = {
  id: string;
  tenantId: string;
};

declare function loadProject(projectId: string): Promise<Project>;
declare function deleteWithServiceCredential(projectId: string): Promise<void>;

export async function deleteProjectFromUi(user: User, projectId: string) {
  if (!user.permissions.includes('projects:delete')) {
    throw new Error('forbidden');
  }

  const project = await loadProject(projectId);
  if (project.tenantId !== user.tenantId) {
    throw new Error('forbidden');
  }

  await deleteWithServiceCredential(project.id);
}

function requestedDeletion(importedText: string): string | undefined {
  const match = importedText.match(/DELETE_PROJECT:([a-z0-9-]+)/i);
  return match?.[1];
}

export async function runImportedInstruction(user: User, importedText: string) {
  if (!user.permissions.includes('projects:delete')) {
    throw new Error('forbidden');
  }

  const projectId = requestedDeletion(importedText);
  if (!projectId) return;

  await deleteWithServiceCredential(projectId);
}
```

## Crash/calibration case

### Exact dispatch prompt

```text
Act as a fresh execution-sample agent. Use the documentation-only skill package at `/tmp/security-reviewer-forward-VEBp6o/trial-skill` to perform a targeted security review of only `/tmp/security-reviewer-forward-VEBp6o/case-b`. Read `SKILL.md` and every local reference it requires for this task. The case files are the complete supplied review scope. Keep the task read-only and honor the case constraints: do not edit files, execute target-controlled code, download dependencies, create a harness, contact external systems, or inspect any repository/candidate/history/log outside those two paths. Return the actual terse targeted-review output that you would give the user, including review basis, coverage, evidence limits, and any next owner required by the supplied skill. Do not assess the skill itself.
```

### `README.md`

SHA-256: `ca59b1bfebdfe9c6c6ad016b96ae8f45de37ca7ad4cdc3a7812c2e9ff56b2def`.

```markdown
# Archive preview route

`uploadArchive` is exposed to unauthenticated users and runs in a worker pool.
The native addon's implementation and runtime crash telemetry are not included
in this review package. A bug report says only that a malformed archive made
"the parser crash" during a manual staging check; it contains no stack trace,
process-exit evidence, sanitizer output, or reproduction artifact.

The review environment must remain read-only. Do not execute the native addon,
download dependencies, or build a new sandbox or harness.
```

### `archive-route.ts`

SHA-256: `0cd0b4ad9699670e0e34b95a10abaae9b304b3e694fdd2a03ec77d8b74b5ecdb`.

```ts
type RequestLike = {
  arrayBuffer(): Promise<ArrayBuffer>;
};

type NativeArchiveAddon = {
  extract(input: Uint8Array): Promise<string[]>;
};

declare const nativeArchiveAddon: NativeArchiveAddon;

export async function uploadArchive(request: RequestLike): Promise<Response> {
  const bytes = new Uint8Array(await request.arrayBuffer());

  try {
    const names = await nativeArchiveAddon.extract(bytes);
    return Response.json({ names });
  } catch {
    return Response.json({ error: 'invalid archive' }, { status: 422 });
  }
}
```
