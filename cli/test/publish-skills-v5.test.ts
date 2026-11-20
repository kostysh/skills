import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';

const publisher = new URL('../dist/release/publish-skills-v5.mjs', import.meta.url).href;
const { publishSkills } = (await import(
  publisher
)) as typeof import('../src/publish-skills-v5.mts');
const tag = 'skills-v5.0.0';
const source = 'c'.repeat(40);
const repository = 'example/skills';
const token = 'fixture-release-writer';

async function distribution(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'verified-skills-release-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  const fixtures = [
    ['example', '1.0.0', 'an archive'],
    ['second', '2.0.0', 'another archive'],
  ] as const;
  const files = new Map<string, Buffer>();
  const skills = fixtures.map(([name, version, payload]) => {
    const bytes = Buffer.from(payload);
    files.set(`${name}-${version}.tgz`, bytes);
    return { name, version, sha256: sha(bytes) };
  });
  files.set('catalog.json', Buffer.from(JSON.stringify({ release: tag, skills })));
  files.set('SOURCE-COMMIT', Buffer.from(`${source}\n`));
  const sums = [...files].map(([name, bytes]) => `${sha(bytes)}  ${name}\n`).join('');
  files.set('SHA256SUMS', Buffer.from(sums));
  await Promise.all([...files].map(([name, bytes]) => writeFile(join(directory, name), bytes)));
  return { directory, source, repository, token, files };
}

type Release = { id: number; tag_name: string; draft: boolean; prerelease: boolean };

function provider(initial?: Release, existing: Map<string, Buffer> = new Map()) {
  const writes: string[] = [];
  const requests: string[] = [];
  const remote = new Map<string, { id: number; bytes: Buffer }>();
  for (const [name, bytes] of existing) remote.set(name, { id: remote.size + 10, bytes });
  const state = {
    release: initial,
    tagStatus: 0,
    listingStatus: 0,
    omitUpload: '',
    loseReadback: false,
    target: source,
    annotated: false,
  };
  const identify = () => ({ id: 77, tag_name: tag, draft: true, prerelease: true });

  function respond(input: Parameters<typeof fetch>[0], options?: Parameters<typeof fetch>[1]) {
    assert.ok(typeof input === 'string');
    const url = new URL(input);
    assert.equal(new Headers(options?.headers).get('authorization'), `Bearer ${token}`);
    const prefix = `/repos/${repository}`;
    assert.ok(url.pathname.startsWith(`${prefix}/`));
    const action = `${options?.method ?? 'GET'} ${url.pathname.slice(prefix.length)}`;
    requests.push(action);
    switch (action) {
      case `GET /git/ref/tags/${tag}`:
        if (state.loseReadback && state.release?.draft === false) {
          state.loseReadback = false;
          throw new Error('Connection lost after publication');
        }
        return Response.json({
          ref: `refs/tags/${tag}`,
          object: state.annotated
            ? { type: 'tag', sha: 'a'.repeat(40) }
            : { type: 'commit', sha: state.target },
        });
      case `GET /git/tags/${'a'.repeat(40)}`:
        return Response.json({ object: { type: 'commit', sha: state.target } });
      case `GET /releases/tags/${tag}`:
        if (state.tagStatus) return Response.json({}, { status: state.tagStatus });
        return state.release?.draft === false
          ? Response.json(state.release)
          : Response.json({}, { status: 404 });
      case 'GET /releases':
        if (state.listingStatus) return Response.json({}, { status: state.listingStatus });
        return Response.json(state.release ? [state.release] : []);
      case 'POST /releases':
        assert.equal(url.host, 'api.github.com');
        assert.equal(state.release, undefined);
        assert.ok(typeof options?.body === 'string');
        assert.deepEqual(JSON.parse(options.body), {
          tag_name: tag,
          target_commitish: source,
          name: tag,
          draft: true,
          prerelease: true,
          make_latest: 'false',
          body: 'Verified skills for the methodology v5 release.',
        });
        writes.push('create');
        state.release = identify();
        return Response.json(state.release, { status: 201 });
      case 'GET /releases/77/assets':
        return Response.json(
          [...remote].map(([name, asset]) => ({
            id: asset.id,
            name,
            size: asset.bytes.length,
            state: 'uploaded',
          })),
        );
      case 'POST /releases/77/assets': {
        assert.equal(url.host, 'uploads.github.com');
        assert.equal(state.release?.draft, true);
        const name = url.searchParams.get('name');
        assert.ok(name);
        assert.ok(!remote.has(name), 'An upload would overwrite an existing asset');
        assert.ok(options?.body instanceof Uint8Array);
        const bytes = Buffer.from(options.body);
        writes.push(`upload ${name}`);
        if (name !== state.omitUpload) remote.set(name, { id: remote.size + 10, bytes });
        return Response.json({}, { status: 201 });
      }
      case 'PATCH /releases/77':
        assert.equal(state.release?.draft, true);
        assert.ok(typeof options?.body === 'string');
        assert.deepEqual(JSON.parse(options.body), {
          draft: false,
          prerelease: true,
          make_latest: 'false',
        });
        writes.push('publish');
        state.release = { ...identify(), draft: false };
        return Response.json(state.release);
      case 'GET /releases/77':
        return Response.json(state.release);
      default: {
        const match = /^GET \/releases\/assets\/(\d+)$/u.exec(action);
        assert.ok(match, `Unexpected API route ${action}`);
        const asset = [...remote.values()].find(({ id }) => id === Number(match[1]));
        assert.ok(asset);
        assert.equal(new Headers(options?.headers).get('accept'), 'application/octet-stream');
        return new Response(new Uint8Array(asset.bytes));
      }
    }
  }
  const fetcher: typeof fetch = (input, options) =>
    Promise.resolve().then(() => respond(input, options));
  return { state, fetcher, writes, requests, remote };
}

const draft = () => ({ id: 77, tag_name: tag, draft: true, prerelease: true });

void test('built publisher creates an absent release only after authenticated draft discovery', async (t) => {
  const asset = await distribution(t);
  const api = provider();
  api.state.annotated = true;
  assert.match(await publishSkills({ ...asset, fetcher: api.fetcher }), /Published and verified/);
  assert.ok(api.requests.includes(`GET /git/tags/${'a'.repeat(40)}`));
  assert.equal(api.writes[0], 'create');
  assert.equal(api.writes.at(-1), 'publish');
  assert.deepEqual(
    api.writes.slice(1, -1).sort(),
    [...asset.files.keys()].map((name) => `upload ${name}`).sort(),
  );
});

void test('a partial draft appends only assets missing after comparing present bytes', async (t) => {
  const asset = await distribution(t);
  const present = 'example-1.0.0.tgz';
  const bytes = asset.files.get(present);
  assert.ok(bytes);
  const api = provider(draft(), new Map([[present, bytes]]));
  assert.match(await publishSkills({ ...asset, fetcher: api.fetcher }), /Published and verified/);
  assert.equal(api.writes.at(-1), 'publish');
  assert.deepEqual(
    api.writes.slice(0, -1).sort(),
    [...asset.files.keys()]
      .filter((name) => name !== present)
      .map((name) => `upload ${name}`)
      .sort(),
  );
});

void test('retry after a lost published readback verifies the existing release without writes', async (t) => {
  const asset = await distribution(t);
  const api = provider(draft(), asset.files);
  api.state.loseReadback = true;
  await assert.rejects(publishSkills({ ...asset, fetcher: api.fetcher }), /lost after publication/);
  assert.deepEqual(api.writes, ['publish']);
  assert.match(
    await publishSkills({ ...asset, fetcher: api.fetcher }),
    /Verified previously published/,
  );
  assert.deepEqual(api.writes, ['publish']);
});

void test('mismatched bytes, incomplete uploads and incomplete published releases block', async (t) => {
  const asset = await distribution(t);
  const present = 'example-1.0.0.tgz';
  const bytes = asset.files.get(present);
  assert.ok(bytes);
  const api = provider(draft(), new Map([[present, Buffer.alloc(bytes.length)]]));
  await assert.rejects(publishSkills({ ...asset, fetcher: api.fetcher }), /release asset differs/);
  assert.deepEqual(api.writes, []);

  const incomplete = provider(draft());
  incomplete.state.omitUpload = present;
  await assert.rejects(
    publishSkills({ ...asset, fetcher: incomplete.fetcher }),
    /Draft release is missing verified assets/,
  );
  assert.ok(!incomplete.writes.includes('publish'));

  const published = provider({ ...draft(), draft: false });
  await assert.rejects(
    publishSkills({ ...asset, fetcher: published.fetcher }),
    /Published release is missing verified assets/,
  );
  assert.deepEqual(published.writes, []);
});

void test('HTTP errors, incorrect tags and wrong visibility prevent every write', async (t) => {
  const asset = await distribution(t);
  for (const status of [401, 403, 500]) {
    const api = provider();
    api.state.tagStatus = status;
    await assert.rejects(
      publishSkills({ ...asset, fetcher: api.fetcher }),
      new RegExp(`HTTP ${status}`),
    );
    assert.deepEqual(api.writes, []);
    assert.ok(!api.requests.includes('GET /releases'));
  }
  const missingPermissions = provider();
  missingPermissions.state.listingStatus = 404;
  await assert.rejects(
    publishSkills({ ...asset, fetcher: missingPermissions.fetcher }),
    /GET \/releases returned HTTP 404/,
  );
  assert.deepEqual(missingPermissions.writes, []);
  const wrongTag = provider();
  wrongTag.state.target = 'd'.repeat(40);
  await assert.rejects(publishSkills({ ...asset, fetcher: wrongTag.fetcher }), /tag differs/);
  assert.deepEqual(wrongTag.writes, []);
  const stable = provider({ ...draft(), prerelease: false });
  await assert.rejects(
    publishSkills({ ...asset, fetcher: stable.fetcher }),
    /release identity or visibility/,
  );
  assert.deepEqual(stable.writes, []);
});

void test('corrupt local assets block before the first GitHub request', async (t) => {
  const asset = await distribution(t);
  await writeFile(join(asset.directory, 'example-1.0.0.tgz'), 'changed archive');
  const api = provider();
  await assert.rejects(
    publishSkills({ ...asset, fetcher: api.fetcher }),
    /Local checksum mismatch/,
  );
  assert.deepEqual(api.requests, []);

  const writer = await mkdtemp(join(tmpdir(), 'isolated-skills-writer-'));
  t.after(() => rm(writer, { recursive: true, force: true }));
  const physical = join(writer, 'physical');
  const launch = join(writer, 'launch');
  await mkdir(physical);
  await symlink(physical, launch, 'junction');
  await copyFile(new URL(publisher), join(physical, 'publish-skills-v5.mjs'));
  const result = spawnSync(
    process.execPath,
    [join(launch, 'publish-skills-v5.mjs'), asset.directory, source],
    {
      cwd: writer,
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, GH_TOKEN: token, GH_REPO: repository },
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Local checksum mismatch/u);
});
