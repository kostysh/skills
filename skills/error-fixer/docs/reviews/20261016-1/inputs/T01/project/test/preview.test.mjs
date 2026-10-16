import test from 'node:test';
import assert from 'node:assert/strict';
import { previewReady } from '../src/preview.mjs';

test('shows ready items in their input order', () => {
  const input = [
    { id: 4, title: 'Delta', ready: true },
    { id: 2, title: 'Beta', ready: false },
    { id: 9, title: 'Iota', ready: true }
  ];
  assert.deepEqual(previewReady(input), [{ id: 4, title: 'Delta' }, { id: 9, title: 'Iota' }]);
});

test('empty queue has empty preview', () => {
  assert.deepEqual(previewReady([]), []);
});
