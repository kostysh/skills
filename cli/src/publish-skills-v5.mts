import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const tag = 'skills-v5.0.0';
const sha = /^[a-f0-9]{40}$/u;
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type RepositoryRef = { type?: string; sha?: string };
type GitRef = { ref?: string; object?: RepositoryRef };
type Release = { id: number; tag_name: string; draft: boolean; prerelease: boolean };
type Asset = { id: number; name: string; size: number; state: string };
type RequestOptions = {
  method?: string;
  json?: Record<string, unknown>;
  bytes?: Buffer;
  accepts?: string;
  optional?: boolean;
};
type PublishOptions = {
  directory?: string | undefined;
  source?: string | undefined;
  repository?: string | undefined;
  token?: string | undefined;
  fetcher?: typeof fetch;
};

async function readAssets(directory: string, source: string) {
  const sums = await readFile(join(directory, 'SHA256SUMS'));
  const assets = new Map([['SHA256SUMS', sums]]);
  const lines = sums.toString('utf8').trimEnd().split('\n');
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) [ *]([a-zA-Z0-9][a-zA-Z0-9_.+-]*)$/u.exec(line);
    const [, expected, name] = match ?? [];
    if (!name || assets.has(name)) throw new Error('Invalid release checksum inventory');
    const bytes = await readFile(join(directory, name));
    if (digest(bytes) !== expected) throw new Error(`Local checksum mismatch for ${name}`);
    assets.set(name, bytes);
  }
  if (assets.get('SOURCE-COMMIT')?.toString() !== `${source}\n`) {
    throw new Error('Package source differs from the expected commit');
  }
  const catalog = JSON.parse(assets.get('catalog.json')?.toString() ?? 'null');
  if (catalog?.release !== tag || !Array.isArray(catalog.skills) || !catalog.skills.length) {
    throw new Error('Invalid v5 release catalog');
  }
  const required = new Set(['SHA256SUMS', 'SOURCE-COMMIT', 'catalog.json']);
  for (const item of catalog.skills) {
    if (
      typeof item?.name !== 'string' ||
      !/^[a-z0-9-]+$/u.test(item.name) ||
      typeof item.version !== 'string' ||
      !/^[a-zA-Z0-9.+-]+$/u.test(item.version)
    ) {
      throw new Error('Invalid v5 archive name');
    }
    const name = `${item.name}-${item.version}.tgz`;
    if (required.has(name)) throw new Error(`Duplicate v5 archive ${name}`);
    const archive = assets.get(name);
    if (!archive || digest(archive) !== item.sha256) {
      throw new Error(`Release archive differs from its catalog: ${name}`);
    }
    required.add(name);
  }
  if (
    required.size !== assets.size ||
    [...required].some((name) => !assets.has(name)) ||
    (await readdir(directory)).some((name) => !assets.has(name))
  ) {
    throw new Error('Incomplete or unexpected local release assets');
  }
  return assets;
}

export async function publishSkills({
  directory,
  source,
  repository,
  token,
  fetcher = fetch,
}: PublishOptions) {
  if (
    !directory ||
    !source ||
    !sha.test(source) ||
    !repository ||
    !/^[\w.-]+\/[\w.-]+$/u.test(repository) ||
    !token
  ) {
    throw new Error('Expected a verified asset directory, source commit, GH_REPO and GH_TOKEN');
  }
  const assets = await readAssets(directory, source);
  const api = `https://api.github.com/repos/${repository}`;
  const upload = `https://uploads.github.com/repos/${repository}`;

  async function request(path: string, options: RequestOptions = {}) {
    const {
      method = 'GET',
      json,
      bytes,
      accepts = 'application/vnd.github+json',
      optional = false,
    } = options;
    const body = bytes ? new Uint8Array(bytes) : json ? JSON.stringify(json) : null;
    const response = await fetcher(`${bytes ? upload : api}${path}`, {
      method,
      signal: AbortSignal.timeout(60_000),
      redirect: accepts === 'application/octet-stream' ? 'follow' : 'error',
      headers: {
        accept: accepts,
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2026-03-10',
        ...(bytes
          ? { 'content-type': 'application/octet-stream' }
          : json
            ? { 'content-type': 'application/json' }
            : {}),
      },
      body,
    });
    if (optional && response.status === 404) return null;
    if (!response.ok)
      throw new Error(`GitHub ${method} ${path.split('?')[0]} returned HTTP ${response.status}`);
    return response;
  }

  async function json<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await request(path, options);
    if (!response) throw new Error('Expected GitHub response');
    return response.json() as Promise<T>;
  }

  async function fullList<T>(path: string): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const rows = await json<T[]>(`${path}?per_page=100&page=${page}`);
      if (!Array.isArray(rows)) throw new Error('Invalid GitHub release listing');
      all.push(...rows);
      if (rows.length < 100) return all;
    }
    throw new Error('Incomplete GitHub release listing');
  }

  async function verifyTag() {
    const reference = await json<GitRef>(`/git/ref/tags/${tag}`);
    let object = reference?.object;
    for (
      let depth = 0;
      depth < 5 && object?.type === 'tag' && object.sha && sha.test(object.sha);
      depth += 1
    ) {
      const annotated = await json<GitRef>(`/git/tags/${object.sha}`);
      object = annotated?.object;
    }
    if (
      reference?.ref !== `refs/tags/${tag}` ||
      object?.type !== 'commit' ||
      object.sha !== source
    ) {
      throw new Error('GitHub release tag differs from the verified source commit');
    }
  }

  function verifyRelease(release: Release, id = release?.id) {
    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      release?.id !== id ||
      release.tag_name !== tag ||
      release.prerelease !== true ||
      typeof release.draft !== 'boolean'
    ) {
      throw new Error('Unexpected GitHub release identity or visibility');
    }
    return release;
  }

  async function verifyRemoteAssets(id: number) {
    const observed = new Set();
    for (const asset of await fullList<Asset>(`/releases/${id}/assets`)) {
      const expected = assets.get(asset?.name);
      if (
        !expected ||
        observed.has(asset.name) ||
        !Number.isSafeInteger(asset.id) ||
        asset.id < 1 ||
        asset.state !== 'uploaded' ||
        asset.size !== expected.length
      ) {
        throw new Error('Unexpected, duplicate or incomplete GitHub release asset');
      }
      const actual = await request(`/releases/assets/${asset.id}`, {
        accepts: 'application/octet-stream',
      });
      if (!actual || !expected.equals(Buffer.from(await actual.arrayBuffer()))) {
        throw new Error(`GitHub release asset differs: ${asset.name}`);
      }
      observed.add(asset.name);
    }
    return [...assets.keys()].filter((name) => !observed.has(name));
  }

  await verifyTag();
  const published = await request(`/releases/tags/${tag}`, { optional: true });
  let release: Release;
  if (published) release = (await published.json()) as Release;
  else {
    // The published-release lookup can return 404 for an existing draft.
    const matches = (await fullList<Release>('/releases')).filter(
      (entry) => entry?.tag_name === tag,
    );
    if (matches.length > 1) throw new Error('Ambiguous GitHub releases for the v5 tag');
    release =
      matches[0] ??
      (await json<Release>('/releases', {
        method: 'POST',
        json: {
          tag_name: tag,
          target_commitish: source,
          name: tag,
          draft: true,
          prerelease: true,
          make_latest: 'false',
          body: 'Verified skills for the methodology v5 release.',
        },
      }));
  }
  const { id, draft } = verifyRelease(release);
  const missing = await verifyRemoteAssets(id);
  if (!draft) {
    if (missing.length) throw new Error('Published release is missing verified assets');
    return 'Verified previously published v5 archives.';
  }
  for (const name of missing) {
    const bytes = assets.get(name);
    if (!bytes) throw new Error(`Missing verified bytes for ${name}`);
    await request(`/releases/${id}/assets?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      bytes,
    });
  }
  if ((await verifyRemoteAssets(id)).length)
    throw new Error('Draft release is missing verified assets');
  await verifyTag();
  await request(`/releases/${id}`, {
    method: 'PATCH',
    json: { draft: false, prerelease: true, make_latest: 'false' },
  });
  await verifyTag();
  if (
    verifyRelease(await json<Release>(`/releases/${id}`), id).draft ||
    (await verifyRemoteAssets(id)).length
  ) {
    throw new Error('Published release readback is incomplete');
  }
  return 'Published and verified v5 archives.';
}

if (import.meta.main) {
  const [directory, source] = process.argv.slice(2);
  try {
    console.log(
      await publishSkills({
        directory,
        source,
        repository: process.env.GH_REPO,
        token: process.env.GH_TOKEN,
      }),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Skills v5 publication failed');
    process.exitCode = 1;
  }
}
