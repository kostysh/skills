import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

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

test('domain handoff keeps Hono-specific admission facts with HONO engineer', async () => {
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

test('data-access regression fixture contains unsafe and safe PostgREST construction', async () => {
  const manifest = await readSkillFile('skill.yaml');
  const fixture = await readSkillFile('test/fixtures/data-access-injection.ts');

  assert.match(manifest, /ref-data-access-injection/);
  assert.match(manifest, /copy-test-fixtures-data-access-injection-ts/);
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

test('browser storage and telemetry leak checks are explicit', async () => {
  const [skill, secrets, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/secrets-config.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /browser durable storage/);
  assert.match(skill, /OTPs, CSRF tokens, cookies, JWT\/session IDs/);
  assert.match(skill, /raw stack\/source, props, request bodies, response bodies, headers/);
  assert.match(secrets, /Browser Durable Storage/);
  assert.match(secrets, /raw request bodies, response bodies, headers, query strings, cookie values/);
  assert.match(secrets, /allowlisted, scoped to user\/tenant\/context, TTL-bound, non-authoritative/);
  assert.match(methodology, /Browser durable storage and telemetry\/error reporting/);
  assert.match(methodology, /sentinel payload behavior/);
});

test('CSRF reissue threat model and behavioral evidence are required', async () => {
  const [skill, apiAuth, methodology] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/api-auth-input.md'),
    readSkillFile('references/methodology.md'),
  ]);

  assert.match(skill, /valid-cookie boundary, Origin\/CORS, rate\/admission/);
  assert.match(skill, /rotation atomicity/);
  assert.match(apiAuth, /CSRF Refresh\/Reissue Threat Model/);
  assert.match(apiAuth, /valid httpOnly session cookie/);
  assert.match(apiAuth, /pending-session scope/);
  assert.match(apiAuth, /Source-text checks alone are not security evidence/);
  assert.match(methodology, /Source-text tests, source-grep checks/);
  assert.match(methodology, /behavioral tests, sentinel payloads, negative API tests/);
});
