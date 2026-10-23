import { homedir } from 'node:os';
import { join } from 'node:path';
import { checkbox, input, select } from '@inquirer/prompts';
import type { Catalog, Target } from './model.ts';
import { destination } from './model.ts';

type PromptContext = NonNullable<Parameters<typeof select>[1]>;
export const promptContext = { output: process.stderr };
export async function chooseMode(
  context: PromptContext = promptContext,
): Promise<'install' | 'update'> {
  return select(
    {
      message: 'Что сделать?',
      choices: [
        { name: 'Установка', value: 'install' as const },
        { name: 'Обновление', value: 'update' as const },
      ],
    },
    context,
  );
}
export async function chooseInstallation(
  catalog: Catalog,
  context: PromptContext = promptContext,
): Promise<{ names: string[]; target: Target; path: string }> {
  const names = await checkbox(
    {
      message: 'Выберите скилы (пробел — выбор, Enter — продолжить)',
      required: true,
      pageSize: 12,
      choices: catalog.skills.map((skill) => ({
        name: `${skill.name} (${skill.version})`,
        value: skill.name,
        description: skill.description,
      })),
    },
    context,
  );
  const target = await select<Target>(
    {
      message: 'Куда установить?',
      choices: [
        { name: 'Codex', value: 'codex' },
        { name: 'Claude Code', value: 'claude-code' },
        { name: 'OpenCode', value: 'opencode' },
        { name: 'Pi', value: 'pi' },
        { name: 'Универсальный', value: 'universal' },
        { name: 'Пользовательский путь (например, каталог проекта)', value: 'custom' },
      ],
    },
    context,
  );
  const path =
    target === 'custom' || target === 'universal'
      ? destination(
          target,
          await input(
            {
              message: 'Путь установки (относительный — от каталога запуска)',
              default: target === 'custom' ? '.agents/skills' : join(homedir(), '.agents/skills'),
              required: true,
            },
            context,
          ),
        )
      : destination(target);
  return { names, target, path };
}
