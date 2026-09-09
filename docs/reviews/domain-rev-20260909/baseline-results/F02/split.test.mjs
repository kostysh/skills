import assert from 'node:assert/strict';
import { splitMinor } from '../../cases/F02/split.mjs';
const fixtures = [
  [0n, 3, [0n, 0n, 0n]], [5n, 3, [2n, 2n, 1n]], [-5n, 3, [-2n, -2n, -1n]],
  [1n, 3, [1n, 0n, 0n]], [-1n, 3, [-1n, 0n, 0n]], [6n, 3, [2n, 2n, 2n]],
  [9223372036854775807n, 2, [4611686018427387904n, 4611686018427387903n]],
  [-9223372036854775808n, 3, [-3074457345618258603n, -3074457345618258603n, -3074457345618258602n]],
  [-9223372036854775808n, 1, [-9223372036854775808n]],
];
for (const [total, count, expected] of fixtures) assert.deepEqual(splitMinor(total, count), expected);
for (const total of [0, '1', null, 9223372036854775808n, -9223372036854775809n]) assert.throws(() => splitMinor(total, 2));
for (const count of [0, -1, 1001, 1.5, '2', 2n, NaN, Infinity, null]) assert.throws(() => splitMinor(0n, count));
for (const total of [-9223372036854775808n, -1001n, -1n, 0n, 1n, 1001n, 9223372036854775807n]) {
  const parts = splitMinor(total, 1000);
  assert.equal(parts.length, 1000);
  assert.equal(parts.reduce((a, b) => a + b, 0n), total);
  assert.ok(parts.every(p => typeof p === 'bigint'));
  assert.ok(parts.every(p => p >= -9223372036854775808n && p <= 9223372036854775807n));
  const magnitudes = parts.map(p => p < 0n ? -p : p);
  assert.ok(magnitudes[0] - magnitudes[999] <= 1n);
  assert.ok(magnitudes.every((p, i) => i === 0 || magnitudes[i - 1] >= p));
}
console.log('F02: 9 literal results; 5 invalid totals; 9 invalid counts; 7 count=1000 invariant checks.');
