import test from 'node:test';
import assert from 'node:assert/strict';
import { setPinned, pinnedTitles } from '../src/catalog.mjs';

test('smoke: pinned card is visible immediately', () => {
  const cards = [{ id: 'a', title: 'Alpha', pinned: false }, { id: 'b', title: 'Beta', pinned: false }];
  assert.deepEqual(pinnedTitles(setPinned(cards, 'a', true)), ['Alpha']);
});

test('unknown card is rejected', () => {
  assert.throws(() => setPinned([], 'missing', true), /Unknown card/);
});
