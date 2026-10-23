// Test-only Node preload. The production CLI has no alternate server or fixture option.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { catalogSchema } from '../src/model.ts';

const fixture = z
  .object({ catalog: catalogSchema, out: z.string() })
  .parse(JSON.parse(await readFile(process.env.KSKILLS_TEST_FIXTURE ?? '', 'utf8')));
globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('https://api.github.com/repos/kostysh/skills/releases?'))
    return Response.json([
      {
        tag_name: fixture.catalog.release,
        published_at: '2026-10-23T00:00:00Z',
        draft: false,
        prerelease: false,
      },
    ]);
  if (
    url ===
    `https://github.com/kostysh/skills/releases/download/${fixture.catalog.release}/catalog.json`
  )
    return Response.json(fixture.catalog);
  const skill = fixture.catalog.skills.find((s) => s.url === url);
  if (!skill) throw new Error(`Unexpected request ${url}`);
  return new Response(await readFile(join(fixture.out, `${skill.name}-${skill.version}.tgz`)));
};
