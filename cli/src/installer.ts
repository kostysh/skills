import { lstat, mkdir, mkdtemp, open, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import semver from 'semver';
import { extract } from './archive.ts';
import { atomicJson, directory, exists, fingerprint } from './files.ts';
import type { Catalog, Config, Skill, Target } from './model.ts';
import { configSchema, emptyConfig, pathKey } from './model.ts';
import type { Download } from './network.ts';
import { download } from './network.ts';

export interface Result {
  changed: string[];
  errors: string[];
}
export class Installer {
  readonly state: string;
  readonly file: string;
  readonly home: string;
  readonly get: Download;
  readonly signal: AbortSignal | undefined;
  constructor(home = homedir(), get: Download = download, signal?: AbortSignal) {
    this.home = home;
    this.get = get;
    this.signal = signal;
    this.state = join(home, '.kskills');
    this.file = join(this.state, 'setup.json');
  }
  async read(): Promise<Config> {
    if (!(await exists(this.file))) return emptyConfig();
    if ((await lstat(this.file)).isSymbolicLink())
      throw new Error('The configuration file must not be a symbolic link.');
    try {
      return configSchema.parse(JSON.parse(await readFile(this.file, 'utf8')));
    } catch {
      throw new Error(`Invalid configuration: ${this.file}. The file has been left unchanged.`);
    }
  }
  async locked<T>(run: () => Promise<T>): Promise<T> {
    await directory(this.state);
    const lock = join(this.state, 'setup.lock');
    const handle = await open(lock, 'wx', 0o600).catch(() => {
      throw new Error(
        `Could not acquire lock ${lock}. If a previous CLI process crashed, make sure no CLI process is running before removing this lock file.`,
      );
    });
    try {
      await handle.writeFile(String(process.pid));
      return await run();
    } finally {
      await handle.close();
      await rm(lock);
    }
  }
  async install(catalog: Catalog, names: string[], path: string, target: Target): Promise<Result> {
    const skills = [...new Set(names)].map((name) => {
      const skill = catalog.skills.find((item) => item.name === name);
      if (!skill) throw new Error(`Unknown skill: ${name}`);
      return skill;
    });
    if (!skills.length) throw new Error('Select at least one skill.');
    return this.locked(async () => {
      const config = await this.read();
      const canonical = await directory(path);
      let installation = config.installations.find((i) => pathKey(i.path) === pathKey(canonical));
      if (!installation) {
        installation = { path: canonical, target, skills: [] };
        config.installations.push(installation);
      }
      return this.perform(
        config,
        skills.map((skill) => ({ installation, skill })),
      );
    });
  }
  async update(catalog: Catalog): Promise<Result> {
    return this.locked(async () => {
      const config = await this.read();
      if (!config.installations.length)
        throw new Error('No installations found. Install skills first.');
      const tasks: { installation: Config['installations'][number]; skill: Skill }[] = [];
      const errors: string[] = [];
      for (const installation of config.installations)
        for (const installed of installation.skills) {
          const available = catalog.skills.find((s) => s.name === installed.name);
          if (!available) {
            errors.push(`${installed.name}: skill is missing from the catalog.`);
            continue;
          }
          if (semver.lt(available.version, installed.version)) {
            errors.push(
              `${installed.name}: catalog version is older than the installed version; downgrades are not allowed.`,
            );
            continue;
          }
          tasks.push({ installation, skill: available });
        }
      const result = await this.perform(config, tasks);
      result.errors.unshift(...errors);
      return result;
    });
  }
  private async perform(
    config: Config,
    tasks: { installation: Config['installations'][number]; skill: Skill }[],
  ): Promise<Result> {
    const result: Result = { changed: [], errors: [] };
    for (const { installation, skill } of tasks) {
      if (this.signal?.aborted) break;
      try {
        await directory(installation.path);
        const path = join(installation.path, skill.name);
        const previous = installation.skills.find((s) => s.name === skill.name);
        const present = await exists(path);
        if (previous?.version === skill.version && previous.contentHash !== skill.contentHash)
          throw new Error('The contents of a published version have changed.');
        if (present) {
          if (!previous || (await fingerprint(path)) !== previous.contentHash)
            throw new Error('Conflict: directory is not managed by this CLI or has local changes.');
          if (semver.gt(previous.version, skill.version))
            throw new Error('Downgrades are not allowed.');
          if (previous.version === skill.version) {
            if (previous.contentHash !== skill.contentHash)
              throw new Error('The contents of a published version have changed.');
            continue;
          }
        }
        const work = await mkdtemp(join(installation.path, '.kskills-'));
        const fresh = join(work, 'new');
        const backup = join(work, 'old');
        let movedOld = false;
        let movedNew = false;
        let retain = false;
        try {
          await mkdir(fresh);
          await extract(await this.get(skill.url, 16 * 1024 * 1024), fresh, skill);
          this.signal?.throwIfAborted();
          // Recheck immediately before replacement, including a new conflicting directory.
          if (
            (await exists(path)) !== present ||
            (present && (await fingerprint(path)) !== previous?.contentHash)
          )
            throw new Error('Directory changed during download.');
          if (present) {
            await rename(path, backup);
            movedOld = true;
          }
          await rename(fresh, path);
          movedNew = true;
          const nextSkills = installation.skills.filter((s) => s.name !== skill.name);
          nextSkills.push({
            name: skill.name,
            version: skill.version,
            contentHash: skill.contentHash,
          });
          const savedSkills = installation.skills;
          installation.skills = nextSkills;
          try {
            await atomicJson(this.file, config);
          } catch (error) {
            installation.skills = savedSkills;
            throw error;
          }
          // Commit point: config and installed files now agree.
          movedNew = false;
          movedOld = false;
          result.changed.push(`${skill.name}@${skill.version} → ${installation.path}`);
        } catch (error) {
          try {
            if (movedNew) await rm(path, { recursive: true });
            if (movedOld) await rename(backup, path);
          } catch {
            retain = true;
            throw new Error(`Could not restore ${path}. Backup preserved at ${work}`, {
              cause: error,
            });
          }
          throw error;
        } finally {
          if (!retain) await rm(work, { recursive: true, force: true });
        }
      } catch (error) {
        result.errors.push(`${skill.name} (${installation.path}): ${(error as Error).message}`);
      }
    }
    return result;
  }
}
