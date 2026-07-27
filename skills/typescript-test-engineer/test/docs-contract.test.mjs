import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

const negativeMatrixRows = [
  'duplicate request / repeated command',
  'concurrent request / parallel command',
  'state read failure',
  'state write failure',
  'completion conflict',
  'terminal replay / terminal overwrite attempt',
  'live running replay versus stale recovery',
  'external executor failure',
  'invalid, unknown or stale input',
  'partial evidence/state after failure',
  'retry after partial success',
];

test('skill separates design, implementation, review, and diagnose mutation boundaries', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /design, implementation, review, or diagnose/);
  assert.match(
    skill,
    /review and diagnose are read-only unless the user explicitly requests fixes/,
  );
  assert.match(skill, /A request to review, assess, inspect, or diagnose does not authorize fixes/);
  assert.match(
    skill,
    /No file or external state changed unless the user separately authorized fixes/,
  );
});

test('hanging-test guidance preserves diagnose-only read-only behavior across references', async () => {
  const skill = await readSkillFile('SKILL.md');
  const testing = await readSkillFile('references/testing.md');
  const react = await readSkillFile('references/react-vitest.md');
  const antiPatterns = await readSkillFile('references/testing-anti-patterns.md');

  assert.match(skill, /For hanging tests in diagnose mode/);
  assert.match(skill, /recommend remediation without editing/);
  assert.match(skill, /Only when fixes are explicitly authorized/);
  assert.match(skill, /Recommend the root-cause fix without editing/);
  assert.match(skill, /only an explicitly authorized implementation may apply it/);
  assert.doesNotMatch(
    skill,
    /For hanging tests, isolate the repro, inspect handles, repair teardown/,
  );
  assert.match(testing, /Diagnosis completion in read-only `diagnose` mode/);
  assert.match(testing, /In `diagnose`, stop at cause\/evidence\/recommendation without editing/);
  assert.match(testing, /Only in explicitly authorized implementation\/fix mode, patch teardown/);
  assert.match(react, /In diagnose mode, report the proven cause/);
  assert.match(react, /Only when fixes are explicitly authorized may implementation tune/);
  for (const reference of [testing, react, antiPatterns]) {
    assert.match(reference, /explicitly authorized implementation\/fix mode/);
    assert.match(reference, /design, review, or diagnose mode/);
  }
});

test('skill defines behavior authority and blocked readiness instead of implementation-as-oracle', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(
    skill,
    /explicit user decisions, accepted specifications or acceptance criteria, then repository contracts/,
  );
  assert.match(skill, /implementation and existing tests as evidence only/);
  assert.match(skill, /return blocked or limited/);
  assert.match(
    skill,
    /No green test, coverage number, mock, fixture, or current implementation is treated as authority by itself/,
  );
});

test('skill publishes decision-complete outputs for every mode', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(
    skill,
    /Implementation output maps behavior to changed tests, files, commands and results/,
  );
  assert.match(skill, /Review output includes stable scope, behavior-to-test mapping/);
  assert.match(skill, /Design output includes test levels, scenarios and falsifiers/);
  assert.match(skill, /Diagnose output includes reproduction or symptom, cause evidence/);
});

test('references are conditional and browser handoff is not a mandatory local wrapper', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /## Optional references/);
  assert.doesNotMatch(skill, /## Required active references/);
  assert.match(skill, /React Vitest.*references\/react-vitest\.md/);
  assert.match(skill, /Tdd.*references\/tdd\.md/);
  assert.match(skill, /Testing Anti Patterns.*references\/testing-anti-patterns\.md/);
  assert.match(skill, /Testing.*references\/testing\.md/);
  assert.doesNotMatch(skill, /references\/agent-browser\.md/);
  await assert.rejects(access(path.join(skillDir, 'references/agent-browser.md')));
});

test('TDD is explicit opt-in and does not authorize destructive history recreation', async () => {
  const tdd = await readSkillFile('references/tdd.md');

  assert.match(tdd, /only when the user explicitly requests TDD/);
  assert.match(
    tdd,
    /does not authorize deleting, reverting, or rewriting existing production code/,
  );
  assert.match(tdd, /tests-after\/regression coverage, not TDD/);
  assert.doesNotMatch(
    tdd,
    /\*\*Always:\*\*|Delete means delete|No exceptions:|STOP and Start Over/,
  );
});

test('interop assigns formal review, remediation, browser smoke, and domain authority', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(
    skill,
    /Stable diff scope, finding severity, and merge guidance:[\s\S]*code-reviewer/,
  );
  assert.match(skill, /Authorized code and test remediation:[\s\S]*implementation-discipline/);
  assert.match(skill, /Browser smoke sessions and interaction diagnostics:[\s\S]*agent-browser/);
  assert.match(skill, /formal repository E2E remains owned by the project test suite/);
  assert.match(skill, /Framework, platform, and domain behavior used as the test oracle/);
});

test('Node and Cloudflare defaults follow current supported paths', async () => {
  const reference = await readSkillFile('references/testing.md');

  assert.match(reference, /built-in type stripping/);
  assert.match(reference, /does not type-check, read `tsconfig\.json`, rewrite path aliases/);
  assert.match(reference, /do not add `--experimental-strip-types` by default/);
  assert.match(reference, /@cloudflare\/vitest-pool-workers/);
  assert.match(reference, /Treat `unstable_dev` only as a legacy migration case/);
});

test('Node module mocking uses current exports option and deterministic cleanup', async () => {
  const reference = await readSkillFile('references/testing.md');

  assert.match(reference, /Use the `exports` option/);
  assert.ok(
    reference.includes('mock.module("./dep.js", { exports: { default: dep, ...named } });'),
  );
  assert.match(reference, /Prefer `t\.mock` for test-scoped mocks/);
  assert.match(reference, /call `mock\.reset\(\)` in deterministic teardown/);
});

test('React guidance distinguishes supported async waitFor and browser evidence levels', async () => {
  const reference = await readSkillFile('references/react-vitest.md');
  const antiPatterns = await readSkillFile('references/testing-anti-patterns.md');

  assert.match(reference, /Async `waitFor` callbacks are supported/);
  assert.match(reference, /Do not perform repeated side effects/);
  assert.match(antiPatterns, /Testing Library supports promise-returning callbacks/);
  assert.match(antiPatterns, /retry only the side-effect-free observation/);
  assert.doesNotMatch(antiPatterns, /`waitFor` expects polling assertions, not async workflows/);
  assert.match(reference, /Vitest Browser Mode/);
  assert.match(
    reference,
    /does not replace the repository's Vitest Browser Mode, Playwright, or other formal E2E gate/,
  );
});

test('React global fetch example restores the stub between tests', async () => {
  const reference = await readSkillFile('references/react-vitest.md');

  assert.match(reference, /vi\.stubGlobal\(/);
  assert.match(reference, /vi\.unstubAllGlobals\(\)/);
  assert.doesNotMatch(reference, /global(?:This)?\.fetch\s*=/);
});

test('React mutation guidance requires the combined lifetime falsifier', async () => {
  const skill = await readSkillFile('SKILL.md');
  const reference = await readSkillFile('references/react-vitest.md');

  assert.match(skill, /one combined lifetime falsifier/);
  assert.match(skill, /pre-populated cache/);
  assert.match(skill, /authoritative reread failure/);
  assert.match(reference, /## Combined mutation-lifetime falsifier/);
  assert.match(reference, /unmount and remount the disposable child/);
  assert.match(reference, /switch to context B/);
  assert.match(reference, /false terminal success/);
  assert.match(reference, /worker can terminate/);
  assert.match(reference, /Mark an element `N\/A` with a sourced\s+reason/);
});

test('UI metadata matches the activation contract', async () => {
  const metadata = await readSkillFile('agents/openai.yaml');

  assert.match(metadata, /display_name: "TypeScript Test Engineer"/);
  assert.match(metadata, /short_description: "Design, review, and debug TypeScript tests"/);
  assert.match(metadata, /default_prompt: "Use \$typescript-test-engineer/);
});

test('structural checks cannot close a broader behavioral claim', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /Structural evidence limit/);
  assert.match(
    skill,
    /regex contract tests, coverage percentages, mocks, fixtures, and green commands are substrate or bounded evidence/,
  );
  assert.match(
    skill,
    /Claim the named behavior only when the corresponding scenario or real boundary was exercised/,
  );
});

test('conditional references do not invent an unsourced coverage closure gate', async () => {
  const react = await readSkillFile('references/react-vitest.md');
  const antiPatterns = await readSkillFile('references/testing-anti-patterns.md');
  const testing = await readSkillFile('references/testing.md');

  for (const reference of [react, antiPatterns, testing]) {
    assert.match(reference, /repository or user|repository\/user|repository.*policy/i);
    assert.match(reference, /do not invent/i);
  }

  assert.doesNotMatch(antiPatterns, /package-native coverage command \(or explicit equivalent\)/);
  assert.doesNotMatch(
    react,
    /Run coverage at milestone checkpoints and before final stage closure/,
  );
  assert.doesNotMatch(testing, /Run a final checkpoint before stage\/release closure\./);
  assert.doesNotMatch(testing, /consider a modest coverage threshold/);
  assert.match(testing, /A coverage command does not authorize inventing a CI threshold/);
  assert.match(testing, /only when the repository or user explicitly requires/);
});

test('replay and rate-limit tests must prove the named risk', async () => {
  const skill = await readSkillFile('SKILL.md');
  const reference = await readSkillFile('references/testing.md');

  assert.match(skill, /For replay\/rate-limit regression tests/);
  assert.match(skill, /a prose label alone is not coverage/);
  assert.match(reference, /## Replay and rate-limit regression tests/);
  assert.match(reference, /do not count a test name, comment, or nearby behavior as coverage/);
  assert.match(reference, /quota-isolation test/);
  assert.match(reference, /renaming a generic 429 test/);
});

test('state-changing work uses the negative matrix with explicit relevance', async () => {
  const skill = await readSkillFile('SKILL.md');
  const reference = await readSkillFile('references/testing.md');

  assert.match(skill, /For side-effecting\/state-changing behavior/);
  assert.match(skill, /mark irrelevant rows `N\/A` with a reason/);
  assert.match(reference, /not limited to database-backed code/);
  assert.match(reference, /Rows that do not apply should be marked `N\/A` with a short reason/);
  assert.match(reference, /Do not turn the matrix into a required test count/);

  for (const row of negativeMatrixRows) {
    assert.match(reference, new RegExp(row.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('skill requires negative fail-closed tests for sourced forbidden behavior', async () => {
  const skill = await readSkillFile('SKILL.md');
  const reference = await readSkillFile('references/testing.md');

  assert.match(skill, /negative\/fail-closed tests/);
  assert.match(skill, /security-sensitive code, treat missing negative tests as a test gap/);
  assert.match(reference, /## Negative\/fail-closed coverage/);
  assert.match(reference, /missing negative\/fail-closed tests are a test gap/);
});

test('anti-patterns require contract suites for production state-changing doubles', async () => {
  const reference = await readSkillFile('references/testing-anti-patterns.md');

  assert.match(reference, /## Anti-Pattern 5: State-Changing Test Doubles Without Contract Tests/);
  assert.match(reference, /Run the suite against production and the double/);
  assert.match(reference, /allowed transitions/);
  assert.match(reference, /terminal states/);
  assert.match(reference, /conflict behavior/);
  assert.match(reference, /replay behavior/);
});
