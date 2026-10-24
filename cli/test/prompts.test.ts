import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { render } from '@inquirer/testing';
import { sha256 } from '../src/model.ts';
import { chooseInstallation, chooseMode } from '../src/prompts.ts';

void test('arrow keys choose update; Ctrl-C cancels', async () => {
  const { answer, events, getScreen } = await render((_config, context) => chooseMode(context), {});
  assert.match(getScreen(), /What would you like to do\?/);
  assert.match(getScreen(), /Install/);
  assert.match(getScreen(), /Update/);
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
    description: 'Пример описания скила',
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
  await screen('Select skills');
  assert.match(getScreen(), /Пример описания скила/);
  events.keypress('space');
  events.keypress('enter');
  await screen('Where should skills be installed');
  assert.match(getScreen(), /Where should skills be installed/);
  for (let i = 0; i < 5; i++) events.keypress('down');
  events.keypress('enter');
  await screen('Installation path');
  events.keypress('enter');
  const result = await answer;
  assert.equal(result.target, 'custom');
  assert.deepEqual(result.names, ['example']);
  assert.match(result.path, /\.agents[/\\]skills$/);
});

void test('skills list stops at both ends across pages and preserves selections', async (t) => {
  const skills = Array.from({ length: 15 }, (_, index) => {
    const name = `skill-${String(index + 1).padStart(2, '0')}`;
    return {
      name,
      description: `Description for ${name}`,
      version: '1.0.0',
      sha256: sha256(''),
      contentHash: sha256(''),
      url: `https://github.com/kostysh/skills/releases/download/skills-test/${name}.tgz`,
    };
  });
  const { answer, events, getScreen, nextRender } = await render((_config, context) => {
    assert.ok(context?.output);
    Object.defineProperty(context.output, 'end', { value: () => context.output });
    return chooseInstallation(
      { schemaVersion: 1, release: 'skills-test', skills, versions: [] },
      context,
    );
  }, {});
  t.after(() => events.keypress({ name: 'c', ctrl: true }));
  void answer.catch(() => undefined);

  assert.match(getScreen(), /Description for skill-01/);
  assert.doesNotMatch(getScreen(), /skill-15/);
  events.keypress('up');
  assert.match(getScreen(), /Description for skill-01/);
  events.keypress('space');
  for (let index = 0; index < skills.length + 2; index++) events.keypress('down');
  assert.match(getScreen(), /Description for skill-15/);
  assert.doesNotMatch(getScreen(), /skill-01/);
  events.keypress('up');
  assert.match(getScreen(), /Description for skill-14/);
  events.keypress('down');
  events.keypress('down');
  assert.match(getScreen(), /Description for skill-15/);
  events.keypress('space');
  events.keypress('enter');
  await nextRender();
  assert.match(getScreen(), /Where should skills be installed/);
  events.keypress('enter');
  const result = await answer;
  assert.deepEqual(result.names, ['skill-01', 'skill-15']);
  assert.equal(result.target, 'codex');
});
