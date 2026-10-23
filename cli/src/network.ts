import { z } from 'zod';
import type { Catalog } from './model.ts';
import { catalogSchema, isPublishedUrl, repository } from './model.ts';
export class NoReleaseError extends Error {}
export type Download = (url: string, limit?: number) => Promise<Buffer>;
export const download = async (
  url: string,
  limit = 8 * 1024 * 1024,
  signal?: AbortSignal,
): Promise<Buffer> => {
  const response = await fetch(url, {
    signal: AbortSignal.any([AbortSignal.timeout(60_000), ...(signal ? [signal] : [])]),
    headers: { 'User-Agent': '@kostysh/skills', Accept: 'application/vnd.github+json' },
  });
  if (!response.ok)
    throw new Error(`Download failed: HTTP ${response.status} (${new URL(url).hostname}).`);
  const chunks: Buffer[] = [];
  let size = 0;
  if (!response.body) throw new Error('Empty server response.');
  for await (const value of response.body) {
    const chunk: unknown = value;
    if (!(chunk instanceof Uint8Array)) throw new Error('Invalid response format.');
    size += chunk.byteLength;
    if (size > limit) throw new Error('Response exceeds the size limit.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};
const releasesSchema = z.array(
  z.object({
    tag_name: z.string(),
    draft: z.boolean(),
    prerelease: z.boolean(),
    published_at: z.string().nullable(),
  }),
);
export async function latestCatalog(get: Download = download): Promise<Catalog> {
  const releases: z.infer<typeof releasesSchema> = [];
  for (let page = 1; page <= 10; page++) {
    const batch = releasesSchema.parse(
      JSON.parse(
        (
          await get(`https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`)
        ).toString(),
      ),
    );
    releases.push(...batch);
    if (batch.length < 100) break;
    if (page === 10) throw new Error('Too many releases to reliably select the latest one.');
  }
  const release = releases
    .filter(
      (r) =>
        /^skills-[a-zA-Z0-9._-]+$/.test(r.tag_name) && !r.draft && !r.prerelease && r.published_at,
    )
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0];
  if (!release) throw new NoReleaseError('No stable skills release has been published yet.');
  const base = `https://github.com/${repository}/releases/download/${release.tag_name}/`;
  const catalog = catalogSchema.parse(JSON.parse((await get(`${base}catalog.json`)).toString()));
  if (
    catalog.release !== release.tag_name ||
    catalog.skills.some((s) => !isPublishedUrl(s.url) || !new URL(s.url).href.startsWith(base))
  )
    throw new Error('Catalog contains links to a different release.');
  return catalog;
}
