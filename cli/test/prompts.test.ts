import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { render } from '@inquirer/testing';
import { sha256 } from '../src/model.ts';
import { chooseInstallation, chooseMode } from '../src/prompts.ts';

void test('arrow keys choose update; Ctrl-C cancels', async () => {
  const { answer, events } = await render((_config, context) => chooseMode(context), {});
  events.keypress('down');
  events.keypress('enter');
  assert.equal(await answer, 'update');
  const cancelled = await render((_config, context) => chooseMode(context), {});
  cancelled.events.keypress({ name: 'c', ctrl: true });
  await assert.rejects(cancelled.answer);
});
void test('space selects checkbox, Enter advances, custom project path is resolved', async (t) => {
  const skill = {
    name: 'example',
    description: 'Example',
    version: '1.0.0',
    sha256: sha256(''),
    contentHash: sha256(''),
    url: 'https://github.com/kostysh/skills/releases/download/skills-test/example.tgz',
  };
  const { answer, events, getScreen } = await render((_config, context) => {
    // Real stderr stays open; the testing stream must do so across multiple prompts too.
    assert.ok(context?.output);
    Object.defineProperty(context.output, 'end', { value: () => context.output });
    return chooseInstallation(
      { schemaVersion: 1, release: 'skills-test', skills: [skill], versions: [] },
      context,
    );
  }, {});
  t.after(() => events.keypress({ name: 'c', ctrl: true }));
  void answer.catch(() => undefined);
  async function screen(text: string): Promise<void> {
    for (let n = 0; n < 100 && !getScreen().includes(text); n++) await setTimeout(5);
    assert.ok(getScreen().includes(text), getScreen());
  }
  events.keypress('space');
  events.keypress('enter');
  await screen('Куда установить');
  assert.match(getScreen(), /Куда установить/);
  for (let i = 0; i < 5; i++) events.keypress('down');
  events.keypress('enter');
  await screen('Путь установки');
  events.keypress('enter');
  const result = await answer;
  assert.equal(result.target, 'custom');
  assert.deepEqual(result.names, ['example']);
  assert.match(result.path, /\.agents[/\\]skills$/);
});
