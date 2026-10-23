import { parseArgs } from 'node:util';
import pkg from '../package.json' with { type: 'json' };
import { Installer } from './installer.ts';
import type { Target } from './model.ts';
import { destination, targets } from './model.ts';
import { download, latestCatalog } from './network.ts';
import { chooseInstallation, chooseMode } from './prompts.ts';

const help = `kskills ${pkg.version} — установка и обновление скилов\n\nБез команды — интерактивное меню.\n  kskills install <skill...> --target <codex|claude-code|opencode|pi|universal|custom> [--path <directory>]\n  kskills update\n  kskills --help\n  kskills --version\n\ncustom и universal без диалога требуют --path. Относительный путь считается от каталога запуска.\nКонфиг: ~/.kskills/setup.json\nКоды: 0 — успех; 1 — ошибка/частичный результат; 2 — неверные аргументы; 130 — отмена.\n`;
async function run(): Promise<number> {
  let values: { help?: boolean; version?: boolean; target?: string; path?: string };
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({
      allowPositionals: true,
      strict: true,
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'V' },
        target: { type: 'string' },
        path: { type: 'string' },
      },
    }));
    if (values.help || values.version) {
      if (
        positionals.length ||
        values.target !== undefined ||
        values.path !== undefined ||
        (values.help && values.version)
      )
        throw new Error('Не сочетайте --help/--version с действием.');
      process.stdout.write(values.help ? help : `${pkg.version}\n`);
      return 0;
    }
    const command = positionals[0];
    if (command === 'install') {
      if (
        positionals.length < 2 ||
        !targets.includes(values.target as Target) ||
        values.path === ''
      )
        throw new Error('Нужны имена скилов и корректный --target.');
      destination(values.target as Target, values.path);
    } else if (command === 'update') {
      if (positionals.length !== 1 || values.target !== undefined || values.path !== undefined)
        throw new Error('update не принимает дополнительные аргументы.');
    } else if (command !== undefined || values.target !== undefined || values.path !== undefined)
      throw new Error('Неизвестная команда или параметры.');
    else if (!process.stdin.isTTY || !process.stderr.isTTY)
      throw new Error('Без терминала укажите install с параметрами или update.');
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n${help}`);
    return 2;
  }
  const mode = positionals[0] ?? (await chooseMode());
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error('Отменено.'));
  process.once('SIGINT', cancel);
  try {
    const get = (url: string, limit?: number) => download(url, limit, controller.signal);
    const installer = new Installer(undefined, get, controller.signal);
    // Validate existing state before making any network request.
    const config = await installer.read();
    if (mode === 'update' && !config.installations.length)
      throw new Error('Установки не найдены. Сначала выполните установку.');
    process.stderr.write('Проверка каталога скилов…\n');
    const catalog = await latestCatalog(get);
    const selected =
      mode === 'install'
        ? positionals.length
          ? {
              names: positionals.slice(1),
              target: values.target as Target,
              path: destination(values.target as Target, values.path),
            }
          : await chooseInstallation(catalog)
        : undefined;
    if (selected) process.stderr.write(`Путь установки: ${selected.path}\n`);
    const result = selected
      ? await installer.install(catalog, selected.names, selected.path, selected.target)
      : await installer.update(catalog);
    for (const changed of result.changed) process.stdout.write(`Установлен ${changed}\n`);
    for (const error of result.errors) process.stderr.write(`${error}\n`);
    if (controller.signal.aborted) {
      process.stderr.write('Отменено.\n');
      return 130;
    }
    if (!result.changed.length && !result.errors.length) process.stdout.write('Все up to date\n');
    return result.errors.length ? 1 : 0;
  } catch (error) {
    if (controller.signal.aborted) {
      process.stderr.write('Отменено.\n');
      return 130;
    }
    throw error;
  } finally {
    process.removeListener('SIGINT', cancel);
  }
}
try {
  process.exitCode = await run();
} catch (error) {
  if (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.name === 'AbortPromptError')
  ) {
    process.stderr.write('Отменено.\n');
    process.exitCode = 130;
  } else {
    process.stderr.write(`Ошибка: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
