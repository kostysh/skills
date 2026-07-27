import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath: string) => readFile(path.join(skillDir, relativePath), 'utf8');

const countMatches = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].length;

test('source contract exposes one required methodology and optional domain references', async () => {
  const manifest = await readSkillFile('skill.yaml');

  assert.match(manifest, /source-version: "0\.1\.11"/);
  assert.match(manifest, /requiredReferences:\n\s+- "ref-methodology"\n\s+optionalReferences:/);
  assert.match(manifest, /id: "ref-api-auth-input"[\s\S]*?required: false/);
  assert.match(manifest, /id: "ref-github-actions"[\s\S]*?required: false/);
  assert.match(manifest, /id: "ref-secrets-config"[\s\S]*?required: false/);
});

test('TypeScript contract test runs directly with Node type stripping', async () => {
  const [manifest, packageJson] = await Promise.all([
    readSkillFile('skill.yaml'),
    readSkillFile('package.json'),
  ]);

  assert.match(manifest, /source: "test\/docs-contract\.test\.ts"/);
  assert.doesNotMatch(manifest, /docs-contract\.test\.mjs/);
  assert.equal(
    JSON.parse(packageJson).scripts.test,
    'node --experimental-strip-types --test test/docs-contract.test.ts',
  );
});

test('generated root has one activation and interop surface', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.equal(countMatches(skill, /^## When to use this skill$/gm), 1);
  assert.equal(countMatches(skill, /^## When NOT to use this skill$/gm), 1);
  assert.equal(countMatches(skill, /^## Interop priority$/gm), 1);
  assert.doesNotMatch(skill, /^## When to Use$/gm);
  assert.doesNotMatch(skill, /^## Skill Interop \(Priority\)$/gm);
  assert.doesNotMatch(skill, /^## Remediation Rules$/gm);
});

test('review basis and status contract prevent false closure', async () => {
  const [skill, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /Establish the review basis/);
  assert.match(skill, /Missing evidence never becomes FAIL by itself/);
  assert.match(skill, /PASS \(scoped\)/);
  assert.match(skill, /INCOMPLETE/);
  assert.match(skill, /BLOCKED/);
  assert.match(skill, /Targeted review never emits PASS/);
  assert.match(methodology, /Missing evidence alone is not `FAIL`/);
  assert.match(methodology, /no confirmed findings in reviewed scope/);
  assert.match(methodology, /whole-system security/);
});

test('partial snippets cannot become findings through symbol-name inference', async () => {
  const [methodology, apiAuth] = await Promise.all([
    readSkillFile('references/methodology.md'),
    readSkillFile('references/api-auth-input.md'),
  ]);

  assert.match(
    methodology,
    /Do not infer helper, middleware, client, role, or credential semantics from names/,
  );
  assert.match(methodology, /Absence of a control in a supplied snippet or diff is not proof/);
  assert.match(methodology, /Keep the item in `needs verification`/);
  assert.match(apiAuth, /do not infer their guarantees from symbol names/);
});

test('review ownership stays read-only and leaves merge decisions to code-reviewer', async () => {
  const [skill, handoffs] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/domain-handoffs.md'),
  ]);

  assert.match(skill, /Keep the review read-only by default/);
  assert.match(skill, /Do not issue an overall merge recommendation/);
  assert.match(skill, /spec-conformance-reviewer/);
  assert.match(skill, /security-diff-scan, security-scan, or deep-security-scan/);
  assert.match(handoffs, /security-reviewer` stays read-only/);
  assert.match(handoffs, /overall merge recommendation/);
  assert.match(handoffs, /do not start a parallel scan or issue a competing scan verdict/);
});

test('re-audit escalates a recurring related finding before another point fix', async () => {
  const [skill, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /same or a materially related confirmed finding survives remediation/);
  assert.match(skill, /root-cause investigation[\s\S]*before another point fix/);
  assert.match(methodology, /set `Next` to root-cause investigation before more fixes/);
});

test('re-audit is finding-bounded and reports a plain-language outcome first', async () => {
  const [skill, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /exact remediation delta/);
  assert.match(skill, /do not repeat unchanged previously cleared full scope/);
  assert.match(skill, /cosmetic edits alone do not close an attack path/);
  assert.match(skill, /plain-language outcome sentence before security status/);
  assert.match(methodology, /Record unchanged previously cleared scope as excluded/);
  assert.match(methodology, /blast radius cannot be bounded/);
});

test('standards control fulfillment always routes to spec-conformance-reviewer', async () => {
  const [skill, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /whether or not a versioned control set is supplied/);
  assert.match(skill, /standards\/control fulfillment always belongs to spec-conformance-reviewer/);
  assert.match(methodology, /whether or not a complete versioned control set is supplied/);
  assert.match(methodology, /must not issue per-control pass\/fail or the compliance status/);
  assert.match(
    methodology,
    /`PASS \(scoped\)` \| The named stable security-review scope has complete required coverage/,
  );
  assert.doesNotMatch(
    methodology,
    /`PASS \(scoped\)` \| The named stable scope or versioned control set/,
  );
});

test('early-use workflow exposes the bounded auth-admission checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /auth-admission early checkpoint/);
  assert.match(skill, /protected route admission/);
  assert.match(skill, /pre-auth resource consumption/);
  assert.match(skill, /replay\/idempotency controls/);
  assert.match(skill, /bounded request-body handling/);
  assert.match(skill, /do not turn it into a generic security planning framework/);
});

test('api auth reference keeps the auth-admission checklist narrow and complete', async () => {
  const reference = await readSkillFile('references/api-auth-input.md');

  assert.match(reference, /## Auth-Admission Early Checklist/);
  assert.match(reference, /route trust boundary/);
  assert.match(reference, /pre-auth versus post-auth resource consumption/);
  assert.match(reference, /quota isolation/);
  assert.match(reference, /replay\/idempotency expectations/);
  assert.match(reference, /bounded body handling/);
  assert.match(reference, /Keep the checklist narrow/);
  assert.match(reference, /route-specific/);
  assert.match(reference, /references\/policy-governance-admission\.md/);
});

test('domain handoff keeps Hono-specific admission facts with hono-engineer', async () => {
  const reference = await readSkillFile('references/domain-handoffs.md');

  assert.match(reference, /route admission-boundary preservation/);
  assert.match(reference, /route-specific body limits/);
  assert.match(
    reference,
    /preserves the touched route's existing public\/user\/admin\/webhook\/service\/operator boundary/,
  );
  assert.match(reference, /non-route policy-governance admission/);
  assert.match(reference, /HIGH-confidence security finding decision/);
});

test('early-use workflow exposes the bounded policy-governance admission checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /policy-governance admission checkpoint/);
  assert.match(skill, /external consultant\/tool invocation/);
  assert.match(skill, /admission\/approval executable capability/);
  assert.match(skill, /active-scope selection/);
  assert.match(skill, /distinct from route auth-admission/);
  assert.match(skill, /historical replay versus current executable capability/);
  assert.match(skill, /conflict replay/);
  assert.match(skill, /authority binding/);
  assert.match(skill, /references\/policy-governance-admission\.md/);
  assert.match(skill, /security-relevant operator\/control-plane impact/);
});

test('policy-governance admission reference keeps the checkpoint bounded and reportable', async () => {
  const reference = await readSkillFile('references/policy-governance-admission.md');

  assert.match(reference, /## Trigger Boundary/);
  assert.match(reference, /external consultant\/tool invocation admission/);
  assert.match(reference, /policy profile activation or active-scope selection/);
  assert.match(reference, /governance\/audit persistence used as a precondition/);
  assert.match(reference, /explicit deny\/no-invocation/);
  assert.match(reference, /failed\/conflicting audit persistence/);
  assert.match(reference, /stale allow replay/);
  assert.match(reference, /## Admission Replay Semantics/);
  assert.match(reference, /historical\/audit replay/);
  assert.match(reference, /current invocable or executable capability/);
  assert.match(reference, /conflict replay/);
  assert.match(reference, /stored `allowed` decision returns only historical\/audit status/);
  assert.match(reference, /idempotency scope includes every security-relevant dimension/);
  assert.match(reference, /freshness timestamp/);
  assert.match(reference, /age-gated evidence fails closed/);
  assert.match(reference, /## Authority Binding/);
  assert.match(reference, /freshness timestamp authority/);
  assert.match(reference, /evidence identity authority/);
  assert.match(reference, /release-to-runtime artifact binding/);
  assert.match(reference, /deployment identity binding/);
  assert.match(reference, /For an admission-gate verdict, return `FAIL`/);
  assert.match(reference, /activation race/);
  assert.match(reference, /audit explanation sufficiency/);
  assert.match(reference, /HIGH-confidence findings/);
  assert.match(reference, /operator\/control-plane impact/);
  assert.match(reference, /code-reviewer/);
});

test('policy-governance examples cover external invocation and active-policy activation', async () => {
  const reference = await readSkillFile('references/policy-governance-admission.md');

  assert.match(reference, /### External Invocation Admission Review/);
  assert.match(reference, /After explicit DENY/);
  assert.match(reference, /failed\/conflicting persistence still permits side effects/);
  assert.match(reference, /stale replay reaches an external invocation/);
  assert.match(reference, /stored `allowed` decision can invoke the consultant\/tool again/);
  assert.match(reference, /### Caller-Controlled Freshness or Evidence Review/);
  assert.match(reference, /caller-selected ref bound to a canonical server\/provider record/);
  assert.match(
    reference,
    /release ref bind to an immutable runtime artifact and protected deployment identity/,
  );
  assert.match(
    reference,
    /caller-controlled freshness or evidence refs can satisfy admission without canonical authority binding/,
  );
  assert.match(reference, /### Active-Policy Activation Review/);
  assert.match(reference, /active-policy activation is serialized/);
  assert.match(reference, /simultaneous active security\/governance policies/);
  assert.match(
    reference,
    /audit explanation sufficiency for both the refused activation and the admitted active policy/,
  );
});

test('policy-governance admission boundaries stay separated from route and release checks', async () => {
  const apiAuth = await readSkillFile('references/api-auth-input.md');
  const domainHandoffs = await readSkillFile('references/domain-handoffs.md');
  const githubActions = await readSkillFile('references/github-actions.md');

  assert.match(apiAuth, /route-specific/);
  assert.match(apiAuth, /stored `allowed` replay/);
  assert.match(apiAuth, /caller-selected evidence\/freshness refs/);
  assert.match(domainHandoffs, /admission-gate authority binding/);
  assert.match(domainHandoffs, /artifact provenance/);
  assert.match(domainHandoffs, /deployment identity/);
  assert.match(githubActions, /stored admission decisions/);
  assert.match(githubActions, /release\/runtime\/deployment refs/);
  assert.match(githubActions, /immutable runtime artifacts and protected deployment identities/);
});

test('workflow exposes the data-access construction checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /data-access construction checkpoint/);
  assert.match(skill, /REST\/PostgREST/);
  assert.match(skill, /Supabase clients/);
  assert.match(skill, /request\/body\/query\/header\/cookie values/);
  assert.match(
    skill,
    /data-access filters, select lists, RPC args, query-builder fragments, SQL fragments, storage keys, table\/function\/column names, or service-role calls/,
  );
  assert.match(skill, /data-access construction reviewed/);
  assert.match(skill, /Do not claim database security review is complete/);
});

test('data-access injection reference requires trace before reporting PostgREST findings', async () => {
  const reference = await readSkillFile('references/data-access-injection.md');

  assert.match(reference, /## Required Inventory/);
  assert.match(reference, /SQL migrations, RPC, RLS, and grants/);
  assert.match(reference, /REST\/PostgREST query construction/);
  assert.match(reference, /SDK filter and query-builder calls/);
  assert.match(reference, /service-role and client trust boundaries/);
  assert.match(reference, /Pattern matches are not findings/);
  assert.match(
    reference,
    /Entry point: request body\/query\/header\/cookie or persisted user-controlled value/,
  );
  assert.match(reference, /Validation: exact schema constraints, not only `string\(\)\.min\(1\)`/);
  assert.match(reference, /Treat `id=eq\.\$\{value\}` as suspicious even though it is not raw SQL/);
  assert.match(reference, /challengeId = "x&select=\*"/);
  assert.match(reference, /Do not flag a URL-encoded construction pattern by default/);
  assert.match(reference, /supabase-engineer/);
});

test('data-access documentation fixture preserves unsafe and safer examples without claiming behavioral proof', async () => {
  const manifest = await readSkillFile('skill.yaml');
  const fixture = await readSkillFile('test/fixtures/data-access-injection.ts');

  assert.match(manifest, /ref-data-access-injection/);
  assert.match(manifest, /copy-test-fixtures-data-access-injection-ts/);
  assert.match(manifest, /Documentation-contract fixture/);
  assert.match(manifest, /not behavioral security proof/);
  assert.ok(fixture.includes('const challengeId = body.challengeId;'));
  assert.ok(
    fixture.includes(
      'await fetch(`${baseUrl}/rest/v1/otp_challenges?id=eq.${challengeId}&select=*`);',
    ),
  );
  assert.ok(fixture.includes('const params = new URLSearchParams();'));
  assert.ok(fixture.includes("params.append('id', `eq.${challengeId}`);"));
  assert.ok(fixture.includes("params.set('select', 'id');"));
  assert.ok(
    fixture.includes('await fetch(`${baseUrl}/rest/v1/otp_challenges?${params.toString()}`);'),
  );
});

test('data-access guidance is reachable from related references', async () => {
  const apiAuth = await readSkillFile('references/api-auth-input.md');
  const supabaseRls = await readSkillFile('references/supabase-rls.md');
  const domainHandoffs = await readSkillFile('references/domain-handoffs.md');
  const methodology = await readSkillFile('references/methodology.md');

  assert.match(apiAuth, /data-access injection through REST\/PostgREST\/query-builder filters/);
  assert.match(apiAuth, /PostgREST filter expressions, SDK filters, RPC args, and storage keys/);
  assert.match(supabaseRls, /## PostgREST And Supabase REST Query Construction/);
  assert.match(
    supabaseRls,
    /request-controlled values are interpolated into `\/rest\/v1` query strings/,
  );
  assert.match(supabaseRls, /table\/column\/select names as code-owned literals/);
  assert.match(domainHandoffs, /Supabase REST\/PostgREST filter semantics/);
  assert.match(domainHandoffs, /service-role data-access boundaries/);
  assert.match(methodology, /server-side data-access construction/);
  assert.match(
    methodology,
    /raw SQL, REST\/PostgREST, SDK query builders, RPC, and service-role paths/,
  );
});

test('browser storage and telemetry checks are impact-aware while credential material stays prohibited', async () => {
  const [skill, secrets, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/secrets-config.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /browser durable storage/);
  assert.match(skill, /passwords, OTP\/recovery material/);
  assert.match(skill, /identity\/provider\/network payloads and telemetry fields by sensitivity/);
  assert.match(secrets, /Browser Durable Storage/);
  assert.match(secrets, /Always flag browser durable storage of plaintext passwords/);
  assert.match(
    secrets,
    /ordinary non-sensitive display preference or public identifier is not a security finding/,
  );
  assert.match(secrets, /Treat all client-side stored data as untrusted on read/);
  assert.match(secrets, /telemetry destination, access controls, retention, redaction stage/);
  assert.match(methodology, /Browser durable storage and telemetry\/error reporting/);
  assert.match(methodology, /sentinel payload behavior/);
});

test('CSRF guidance follows the selected pattern and requires behavioral evidence', async () => {
  const [skill, apiAuth, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/api-auth-input.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /synchronizer-token, signed double-submit/);
  assert.match(
    skill,
    /require atomic rotation only when the selected stateful contract promises rotation/,
  );
  assert.match(apiAuth, /CSRF Refresh\/Reissue Threat Model/);
  assert.match(apiAuth, /stateful synchronizer token/);
  assert.match(apiAuth, /signed double-submit token/);
  assert.match(apiAuth, /Do not require server-side storage or per-request rotation/);
  assert.match(apiAuth, /pending-session scope/);
  assert.match(apiAuth, /Source-text checks alone are not security evidence/);
  assert.match(methodology, /Source-text tests, source-grep checks/);
  assert.match(methodology, /behavioral tests, sentinel payloads, negative API tests/);
});

test('GitHub Actions findings require actual untrusted execution reachability', async () => {
  const reference = await readSkillFile('references/github-actions.md');

  assert.match(reference, /Flag only when all are true/);
  assert.match(reference, /can actually be fetched into an executable path/);
  assert.match(reference, /built-in protections/);
  assert.match(reference, /explicit unsafe opt-outs/);
  assert.match(
    reference,
    /checking out data without executing or interpreting it is not the complete exploit/,
  );
});
