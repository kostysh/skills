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
      throw new Error('Конфиг не должен быть символической ссылкой.');
    try {
      return configSchema.parse(JSON.parse(await readFile(this.file, 'utf8')));
    } catch {
      throw new Error(`Повреждённый конфиг: ${this.file}. Файл сохранён без изменений.`);
    }
  }
  async locked<T>(run: () => Promise<T>): Promise<T> {
    await directory(this.state);
    const lock = join(this.state, 'setup.lock');
    const handle = await open(lock, 'wx', 0o600).catch(() => {
      throw new Error(
        `Не удалось получить блокировку ${lock}. Если CLI завершился аварийно, убедитесь, что он не запущен, и удалите этот lock-файл.`,
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
      if (!skill) throw new Error(`Неизвестный скил: ${name}`);
      return skill;
    });
    if (!skills.length) throw new Error('Выберите хотя бы один скил.');
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
        throw new Error('Установки не найдены. Сначала выполните установку.');
      const tasks: { installation: Config['installations'][number]; skill: Skill }[] = [];
      const errors: string[] = [];
      for (const installation of config.installations)
        for (const installed of installation.skills) {
          const available = catalog.skills.find((s) => s.name === installed.name);
          if (!available) {
            errors.push(`${installed.name}: скил отсутствует в каталоге.`);
            continue;
          }
          if (semver.lt(available.version, installed.version)) {
            errors.push(
              `${installed.name}: каталог старее установленной версии; понижение запрещено.`,
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
          throw new Error('Содержимое опубликованной версии изменилось.');
        if (present) {
          if (!previous || (await fingerprint(path)) !== previous.contentHash)
            throw new Error('Конфликт: чужой каталог или локальные изменения.');
          if (semver.gt(previous.version, skill.version))
            throw new Error('Понижение версии запрещено.');
          if (previous.version === skill.version) {
            if (previous.contentHash !== skill.contentHash)
              throw new Error('Содержимое опубликованной версии изменилось.');
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
            throw new Error('Каталог изменился во время загрузки.');
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
            throw new Error(
              `Не удалось восстановить ${path}. Резервная копия сохранена в ${work}`,
              { cause: error },
            );
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
