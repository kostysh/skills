import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import * as tar from 'tar';
import { fingerprint } from './files.ts';
import type { Skill } from './model.ts';
import { safeRelative, sha256 } from './model.ts';

export async function extract(bytes: Buffer, target: string, skill: Skill): Promise<void> {
  if (sha256(bytes) !== skill.sha256) throw new Error('SHA-256 архива не совпадает с каталогом.');
  const unpacked = gunzipSync(bytes, { maxOutputLength: 64 * 1024 * 1024 });
  const archive = join(dirname(target), `${randomUUID()}.tar`);
  try {
    await writeFile(archive, unpacked, { flag: 'wx', mode: 0o600 });
    const names = new Set<string>();
    let invalid: Error | undefined;
    let size = 0;
    await tar.t({
      file: archive,
      strict: true,
      onReadEntry(entry) {
        try {
          const name = entry.path.replace(/\/$/, '');
          safeRelative(name);
          if (entry.type !== 'File' && entry.type !== 'Directory')
            throw new Error(`Запрещённый тип: ${entry.type}`);
          const key = name.toLowerCase();
          if (names.has(key)) throw new Error(`Повторный путь: ${name}`);
          names.add(key);
          size += entry.size;
          if (size > 64 * 1024 * 1024 || names.size > 10_000)
            throw new Error('Архив слишком велик.');
        } catch (error) {
          invalid = error as Error;
        }
      },
    });
    if (invalid) throw invalid;
    await tar.x({ cwd: target, file: archive, strict: true, preservePaths: false });
    await readFile(join(target, 'SKILL.md'));
    if ((await fingerprint(target)) !== skill.contentHash)
      throw new Error('Содержимое скила не совпадает с каталогом.');
  } finally {
    await rm(archive, { force: true });
  }
}
