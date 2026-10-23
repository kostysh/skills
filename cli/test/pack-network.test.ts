import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import * as tar from 'tar';
import { extract } from '../src/archive.ts';
import { sha256 } from '../src/model.ts';
import { latestCatalog } from '../src/network.ts';
import { packSkills } from '../src/pack.ts';
import { release, sandbox } from './helpers.ts';

void test('pack is deterministic, excludes development files and binds a version to content', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const second = await packSkills(
    join(root, 'source-1.0.0'),
    join(root, 'again'),
    'skills-second',
    first.catalog,
  );
  assert.equal(first.catalog.skills[0]?.sha256, second.skills[0]?.sha256);
  assert.equal(second.versions.length, 1);
  await writeFile(join(root, 'source-1.0.0/example/references/method.md'), 'changed');
  await assert.rejects(
    packSkills(join(root, 'source-1.0.0'), join(root, 'bad'), 'skills-bad', second),
    /without a version bump/,
  );
  await writeFile(
    join(root, 'source-1.0.0/example/SKILL.md'),
    '---\nname: example\ndescription: test\nmetadata:\n  source-version: 1.1.0\n---\n[missing](references/missing.md)\n',
  );
  await assert.rejects(
    packSkills(join(root, 'source-1.0.0'), join(root, 'missing'), 'skills-bad', second),
    /missing runtime link/,
  );
});

void test('release discovery ignores CLI and pre-releases, pins one catalog and rejects cross-release URLs', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const { catalog } = await release(root);
  const urls: string[] = [];
  const get = (url: string) => {
    urls.push(url);
    return Promise.resolve(
      Buffer.from(
        JSON.stringify(
          url.includes('api.github.com')
            ? [
                { tag_name: 'cli-v9', draft: false, prerelease: false, published_at: '2026-12-01' },
                {
                  tag_name: 'skills-preview',
                  draft: false,
                  prerelease: true,
                  published_at: '2026-11-01',
                },
                {
                  tag_name: 'skills-1.0.0',
                  draft: false,
                  prerelease: false,
                  published_at: '2026-10-01',
                },
              ]
            : catalog,
        ),
      ),
    );
  };
  assert.equal((await latestCatalog(get)).release, 'skills-1.0.0');
  assert.ok(urls[1]?.includes('/skills-1.0.0/catalog.json'));
  const changed = structuredClone(catalog);
  if (changed.skills[0]) changed.skills[0].url = 'https://evil.example/payload';
  await assert.rejects(
    latestCatalog(async (url) =>
      url.includes('api.github.com') ? get(url) : Buffer.from(JSON.stringify(changed)),
    ),
    /different release/,
  );
});

void test('archive rejects links, duplicate names, traversal, large expansion and incomplete content', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const { catalog, out } = await release(root);
  const skill = catalog.skills[0];
  assert.ok(skill);
  const target = join(root, 'extract');
  await mkdir(target);
  const data = await readFile(join(out, 'example-1.0.0.tgz'));
  await extract(data, target, skill);
  assert.equal(await readFile(join(target, 'assets/AGENTS.md'), 'utf8'), 'Working template\n');
  // Construct USTAR records independently of the production packer.
  const archive = (path: string, type = '0', count = 1) => {
    const header = Buffer.alloc(512);
    header.write(path);
    header.write('0000644\0', 100);
    header.write('0000000\0', 108);
    header.write('0000000\0', 116);
    header.write('00000000000\0', 124);
    header.fill(32, 148, 156);
    header.write(type, 156);
    header.write('ustar\0', 257);
    header.write('00', 263);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
    return gzipSync(
      Buffer.concat([...Array.from({ length: count }, () => header), Buffer.alloc(1024)]),
    );
  };
  for (const bytes of [
    archive('../escape'),
    archive('link', '2'),
    archive('SKILL.md', '0', 2),
    gzipSync(Buffer.alloc(65 * 1024 * 1024)),
  ]) {
    const directory = join(root, `bad-${sha256(bytes).slice(0, 10)}`);
    await mkdir(directory);
    await assert.rejects(extract(bytes, directory, { ...skill, sha256: sha256(bytes) }));
  }
  const names: string[] = [];
  await tar.t({
    file: join(out, 'example-1.0.0.tgz'),
    onReadEntry: (entry) => {
      names.push(entry.path);
    },
  });
  assert.deepEqual(names.sort(), ['SKILL.md', 'assets/AGENTS.md', 'references/method.md']);
});

void test('active references require literal resources and shell commands transitively', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  await release(root);
  const source = join(root, 'source-1.0.0');
  const folder = join(source, 'example');
  const reference = join(folder, 'references/method.md');
  await writeFile(reference, 'Read `assets/missing.md` before proceeding.\n');
  await assert.rejects(
    packSkills(source, join(root, 'missing-asset'), 'skills-test'),
    /references\/method.md: missing resource assets\/missing.md/,
  );
  await writeFile(join(folder, 'assets/missing.md'), 'Required working resource');
  for (const language of ['sh', 'bash', 'console', '']) {
    await writeFile(
      reference,
      `Read \`assets/missing.md\`.\n\n\`\`\`${language}\nnode scripts/missing.mjs\n\`\`\`\n`,
    );
    await assert.rejects(
      packSkills(source, join(root, `missing-script-${language || 'plain'}`), 'skills-test'),
      /scripts\/missing.mjs/,
    );
  }
  await mkdir(join(folder, 'scripts'));
  await writeFile(join(folder, 'scripts/missing.mjs'), 'console.log("ready");');
  await writeFile(
    reference,
    'Read `assets/missing.md`.\n```sh\nnode scripts/missing.mjs\n```\nFor example, a skill can mention `references/example.md`.\n```ts\nconst fontPath = "assets/fonts/example.ttf";\n```\n',
  );
  const valid = await packSkills(source, join(root, 'complete'), 'skills-test');
  assert.equal(valid.skills.length, 1);
  const target = join(root, 'restored');
  await mkdir(target);
  const skill = valid.skills[0];
  assert.ok(skill);
  await extract(await readFile(join(root, 'complete/example-1.0.0.tgz')), target, skill);
  assert.equal(
    await readFile(join(target, 'scripts/missing.mjs'), 'utf8'),
    'console.log("ready");',
  );
  await writeFile(reference, 'Read `references/nested.md` before every run.');
  await assert.rejects(
    packSkills(source, join(root, 'missing-nested'), 'skills-test'),
    /references\/nested.md/,
  );
});

void test('release pin rejects normalized and encoded dot-segments to another release', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const { catalog } = await release(root);
  const base = 'https://github.com/kostysh/skills/releases/download/skills-1.0.0/';
  for (const suffix of [
    'x/../../skills-other/example.tgz',
    'x/%2e%2e/%2E%2E/skills-other/example.tgz',
  ]) {
    const changed = structuredClone(catalog);
    const skill = changed.skills[0];
    assert.ok(skill);
    skill.url = base + suffix;
    await assert.rejects(
      latestCatalog((url) =>
        Promise.resolve(
          Buffer.from(
            JSON.stringify(
              url.includes('api.github.com')
                ? [
                    {
                      tag_name: catalog.release,
                      draft: false,
                      prerelease: false,
                      published_at: '2026-10-23',
                    },
                  ]
                : changed,
            ),
          ),
        ),
      ),
      /different release/,
    );
  }
});

void test('resource paths normalize dot prefixes and examples do not hide required neighbours', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  await release(root);
  const source = join(root, 'source-1.0.0');
  const folder = join(source, 'example');
  const reference = join(folder, 'references/method.md');
  const required = [
    'First read `assets/missing.md` before proceeding.',
    'First read `./assets/missing.md` before proceeding.',
    'First read `../assets/missing.md` relative to this document.',
    'First read `./references/missing.md` before proceeding.',
    'First read `agents/missing.md` before proceeding.',
    'Run `node ./scripts/missing.mjs` before proceeding.',
    'Execute the required command:\n```sh\nnode ./scripts/missing.mjs\n```',
    'Execute the required command:\n```bash\nnode "./scripts/missing.mjs"\n```',
    'Execute the required command:\n```sh\nnode --import=./scripts/missing.mjs\n```',
    'First read `assets/missing.md`; for example, this also applies to updates.',
    'You must, for example, first read `assets/missing.md`.',
    'First read the required resource, such as `assets/missing.md`.',
    'For example, an unrelated operation may differ; first read `assets/missing.md`.',
    'For example, an unrelated operation may differ. First read `assets/missing.md`.',
    'Prefer explicit invocations, for example:\n```sh\nnode ./scripts/missing.mjs\n```',
  ];
  for (const [index, instruction] of required.entries()) {
    await writeFile(reference, instruction);
    await assert.rejects(
      packSkills(source, join(root, `negative-${index}`), 'skills-test'),
      /missing resource/,
      instruction,
    );
  }
  await mkdir(join(folder, 'scripts'));
  await mkdir(join(folder, 'agents'));
  await writeFile(join(folder, 'assets/missing.md'), 'Required asset');
  await writeFile(join(folder, 'references/missing.md'), 'Required reference');
  await writeFile(join(folder, 'agents/missing.md'), 'Required agent metadata');
  await writeFile(join(folder, 'agents/README.md'), 'Development notes');
  await writeFile(join(folder, 'scripts/missing.mjs'), 'console.log("ready");');
  await writeFile(reference, required.join('\n\n'));
  const valid = await packSkills(source, join(root, 'positive'), 'skills-test');
  const skill = valid.skills[0];
  assert.ok(skill);
  const target = join(root, 'restored');
  await mkdir(target);
  await extract(await readFile(join(root, 'positive/example-1.0.0.tgz')), target, skill);
  assert.equal(await readFile(join(target, 'assets/missing.md'), 'utf8'), 'Required asset');
  assert.equal(
    await readFile(join(target, 'agents/missing.md'), 'utf8'),
    'Required agent metadata',
  );
  await assert.rejects(readFile(join(target, 'agents/README.md')), { code: 'ENOENT' });
  assert.equal(
    await readFile(join(target, 'scripts/missing.mjs'), 'utf8'),
    'console.log("ready");',
  );
  // A reference-relative path may not escape the skill folder.
  await writeFile(reference, 'Read `../../assets/missing.md` before proceeding.');
  await assert.rejects(packSkills(source, join(root, 'escape'), 'skills-test'), /path/i);
});
