import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CLI_DISPLAY_NAME,
  COMMANDS,
  buildCommandHelpOutput,
  buildGlobalHelpOutput,
  buildVersionOutput,
  findCommand,
} from '../src/cli/command-registry.ts';
import {
  CommandHelpOutputSchema,
  GlobalHelpOutputSchema,
  VersionOutputSchema,
} from '../src/schemas/index.ts';

void test('registry exposes the complete planned command surface', () => {
  assert.equal(COMMANDS.length, 16);
  assert.ok(findCommand('init'));
  assert.ok(findCommand('delete-backlog'));
  assert.equal(findCommand('missing-command'), undefined);
});

void test('global help output is schema-valid and command-complete', () => {
  const help = buildGlobalHelpOutput('0.1.0');
  const parsed = GlobalHelpOutputSchema.parse(help);

  assert.equal(parsed.cli_name, CLI_DISPLAY_NAME);
  assert.equal(parsed.commands.length, COMMANDS.length);
});

void test('command help output is schema-valid for refresh', () => {
  const command = findCommand('refresh');
  assert.ok(command);

  const help = buildCommandHelpOutput(command, '0.1.0');
  const parsed = CommandHelpOutputSchema.parse(help);

  assert.equal(parsed.command, 'refresh');
  assert.ok(parsed.options.some((option) => option.flags.includes('--source-id')));
});

void test('version output is schema-valid', () => {
  const parsed = VersionOutputSchema.parse(buildVersionOutput('0.1.0'));

  assert.equal(parsed.cli_name, CLI_DISPLAY_NAME);
  assert.equal(parsed.version, '0.1.0');
});
