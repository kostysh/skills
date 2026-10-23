import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import semver from 'semver';
import { z } from 'zod';

export const repository = 'kostysh/skills';
export const targets = ['codex', 'claude-code', 'opencode', 'pi', 'universal', 'custom'] as const;
export type Target = (typeof targets)[number];
export const nameSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(64);
export const versionSchema = z.string().refine((value) => semver.valid(value) === value);
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const skillSchema = z
  .object({
    name: nameSchema,
    description: z.string().min(1),
    version: versionSchema,
    url: z.url(),
    sha256: hashSchema,
    contentHash: hashSchema,
  })
  .strict();
export type Skill = z.infer<typeof skillSchema>;
export const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    release: z.string().regex(/^skills-[a-zA-Z0-9._-]+$/),
    versions: z
      .array(skillSchema.pick({ name: true, version: true, contentHash: true }))
      .default([]),
    skills: z
      .array(skillSchema)
      .refine((skills) => new Set(skills.map((s) => s.name)).size === skills.length),
  })
  .strict();
export type Catalog = z.infer<typeof catalogSchema>;
const installedSchema = skillSchema.pick({ name: true, version: true, contentHash: true });
export type Installed = z.infer<typeof installedSchema>;
export const configSchema = z
  .object({
    schemaVersion: z.literal(1),
    installations: z
      .array(
        z
          .object({
            path: z.string().refine(isAbsolute),
            target: z.enum(targets),
            skills: z
              .array(installedSchema)
              .refine((skills) => new Set(skills.map((s) => s.name)).size === skills.length),
          })
          .strict(),
      )
      .refine((items) => new Set(items.map((i) => pathKey(i.path))).size === items.length),
  })
  .strict();
export type Config = z.infer<typeof configSchema>;
export const emptyConfig = (): Config => ({ schemaVersion: 1, installations: [] });
export const sha256 = (bytes: string | Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');
export const pathKey = (path: string): string =>
  process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);
export function destination(
  target: Target,
  custom?: string,
  home = homedir(),
  cwd = process.cwd(),
): string {
  if (custom)
    return resolve(
      cwd,
      custom === '~' ? home : custom.startsWith('~/') ? resolve(home, custom.slice(2)) : custom,
    );
  const defaults: Partial<Record<Target, string>> = {
    codex: '.agents/skills',
    'claude-code': '.claude/skills',
    opencode: '.config/opencode/skills',
    pi: '.pi/agent/skills',
  };
  const path = defaults[target];
  if (!path) throw new Error('The custom and universal targets require --path.');
  return resolve(home, path);
}
export function safeRelative(path: string): void {
  if (
    !path ||
    path.includes('\\') ||
    path.startsWith('/') ||
    path.includes('\0') ||
    path
      .split('/')
      .some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          /[<>:"|?*]/.test(part) ||
          Array.from(part).some((character) => character.charCodeAt(0) < 32) ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part),
      )
  ) {
    throw new Error(`Unsafe archive path: ${path}`);
  }
}
export function isPublishedUrl(value: string): boolean {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.hostname === 'github.com' &&
    !url.username &&
    !url.password &&
    url.pathname.startsWith(`/${repository}/releases/download/skills-`) &&
    !url.search &&
    !url.hash
  );
}
